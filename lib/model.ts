import { goalOutlook, type GoalOutlook } from "./poisson";

export const MODEL_VERSION = "baseline-v0.2";

/**
 * Baseline model: every team gets an attack and a defence strength from past results
 * (recent matches count more), shrunk toward the league average so a few results cannot
 * swing it. Expected goals feed the Poisson model in poisson.ts.
 * Newly promoted clubs have no top-flight history, so they start near average.
 */
export type ModelParams = { halfLifeDays: number; priorGames: number };
export const DEFAULT_PARAMS: ModelParams = { halfLifeDays: 365, priorGames: 6 };

export type HistMatch = { homeId: number; awayId: number; homeGoals: number; awayGoals: number; date: string };
export type TeamStrength = { att: number; def: number };
export type Strengths = { avgHome: number; avgAway: number; teams: Map<number, TeamStrength> };

export function fitStrengths(hist: HistMatch[], now: Date, params: ModelParams = DEFAULT_PARAMS): Strengths {
  const teams = new Map<number, TeamStrength>();
  if (hist.length === 0) return { avgHome: 1.5, avgAway: 1.2, teams };

  const weightOf = (h: HistMatch) => {
    const ageDays = Math.max(0, (now.getTime() - new Date(h.date).getTime()) / 86400000);
    return Math.pow(0.5, ageDays / params.halfLifeDays);
  };

  let W = 0, hg = 0, ag = 0;
  for (const h of hist) {
    const w = weightOf(h);
    W += w;
    hg += w * h.homeGoals;
    ag += w * h.awayGoals;
  }
  const avgHome = hg / W;
  const avgAway = ag / W;
  const m = (avgHome + avgAway) / 2; // goals per team per game

  const acc = new Map<number, { gf: number; ga: number; n: number }>();
  const add = (id: number, gf: number, ga: number, w: number) => {
    const a = acc.get(id) ?? { gf: 0, ga: 0, n: 0 };
    a.gf += w * gf;
    a.ga += w * ga;
    a.n += w;
    acc.set(id, a);
  };
  for (const h of hist) {
    const w = weightOf(h);
    add(h.homeId, h.homeGoals, h.awayGoals, w);
    add(h.awayId, h.awayGoals, h.homeGoals, w);
  }
  for (const [id, a] of acc) {
    teams.set(id, {
      att: (a.gf + params.priorGames * m) / ((a.n + params.priorGames) * m),
      def: (a.ga + params.priorGames * m) / ((a.n + params.priorGames) * m)
    });
  }
  return { avgHome, avgAway, teams };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function expectedGoals(s: Strengths, homeId: number, awayId: number) {
  const h = s.teams.get(homeId) ?? { att: 1, def: 1 };
  const a = s.teams.get(awayId) ?? { att: 1, def: 1 };
  return {
    homeXg: clamp(s.avgHome * h.att * a.def, 0.2, 4.5),
    awayXg: clamp(s.avgAway * a.att * h.def, 0.2, 4.5)
  };
}

export function predict(s: Strengths, homeId: number, awayId: number): { homeXg: number; awayXg: number; outlook: GoalOutlook } {
  const { homeXg, awayXg } = expectedGoals(s, homeId, awayId);
  const r2 = (v: number) => Math.round(v * 100) / 100;
  const hx = r2(homeXg);
  const ax = r2(awayXg);
  return { homeXg: hx, awayXg: ax, outlook: goalOutlook(hx, ax) };
}

/** 0-10 rating where 5 is the league average. */
export function attackRating(s: Strengths, teamId: number): number {
  const t = s.teams.get(teamId);
  return Math.round(clamp(5 + 6 * ((t?.att ?? 1) - 1), 0.5, 9.9) * 10) / 10;
}
export function defenceRating(s: Strengths, teamId: number): number {
  const t = s.teams.get(teamId);
  return Math.round(clamp(5 + 6 * (1 - (t?.def ?? 1)), 0.5, 9.9) * 10) / 10;
}
