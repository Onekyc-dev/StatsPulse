import type { Result } from "./types";

/** A stored fixture, with only the fields the league table needs. */
export type Fx = {
  id: number;
  season_id: number | null;
  kickoff: string;
  status: string;
  home_team_id: number;
  away_team_id: number;
  home_score: number | null;
  away_score: number | null;
};

export type TableKind = "all" | "home" | "away" | "form";

export type Row = {
  teamId: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  form: Result[]; // last five results, oldest to newest
};

type Rec = { venue: "home" | "away"; gf: number; ga: number; kickoff: string; fixtureId: number; opponentId: number };

const isDone = (f: Fx): boolean => f.status === "finished" && f.home_score !== null && f.away_score !== null;

/** Every team that appears in a season's fixtures, played or not. */
export function teamsInSeason(fixtures: Fx[], seasonId: number): number[] {
  const ids = new Set<number>();
  for (const f of fixtures) {
    if (f.season_id !== seasonId) continue;
    ids.add(f.home_team_id);
    ids.add(f.away_team_id);
  }
  return [...ids];
}

/** One record per finished match for each team, oldest first. */
export function recordsByTeam(fixtures: Fx[], seasonId: number): Map<number, Rec[]> {
  const out = new Map<number, Rec[]>();
  for (const id of teamsInSeason(fixtures, seasonId)) out.set(id, []);
  const played = fixtures.filter((f) => f.season_id === seasonId && isDone(f)).sort((a, b) => a.kickoff.localeCompare(b.kickoff) || a.id - b.id);
  for (const f of played) {
    const hs = f.home_score as number;
    const as = f.away_score as number;
    out.get(f.home_team_id)?.push({ venue: "home", gf: hs, ga: as, kickoff: f.kickoff, fixtureId: f.id, opponentId: f.away_team_id });
    out.get(f.away_team_id)?.push({ venue: "away", gf: as, ga: hs, kickoff: f.kickoff, fixtureId: f.id, opponentId: f.home_team_id });
  }
  return out;
}

const resultOf = (r: Rec): Result => (r.gf > r.ga ? "W" : r.gf === r.ga ? "D" : "L");

function rowFrom(teamId: number, recs: Rec[], allRecs: Rec[]): Row {
  let won = 0, drawn = 0, lost = 0, gf = 0, ga = 0;
  for (const r of recs) {
    gf += r.gf;
    ga += r.ga;
    const res = resultOf(r);
    if (res === "W") won++;
    else if (res === "D") drawn++;
    else lost++;
  }
  return {
    teamId,
    played: recs.length,
    won,
    drawn,
    lost,
    gf,
    ga,
    gd: gf - ga,
    points: won * 3 + drawn,
    form: allRecs.slice(-5).map(resultOf)
  };
}

/**
 * Builds a league table. Order: points, then goal difference, then goals scored, then name.
 * "form" counts only each team's last five matches.
 */
export function buildTable(fixtures: Fx[], seasonId: number, kind: TableKind, names: Map<number, string>): Row[] {
  const byTeam = recordsByTeam(fixtures, seasonId);
  const rows: Row[] = [];
  for (const [teamId, all] of byTeam) {
    const recs = kind === "home" ? all.filter((r) => r.venue === "home") : kind === "away" ? all.filter((r) => r.venue === "away") : kind === "form" ? all.slice(-5) : all;
    rows.push(rowFrom(teamId, recs, all));
  }
  const name = (id: number) => names.get(id) ?? String(id);
  return rows.sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf || name(a.teamId).localeCompare(name(b.teamId)));
}

export type SeasonInfo = { id: number; label: string; finished: number; latest: string };

/** "2026/27" style label from the first kickoff of the season. */
export function seasonLabel(firstKickoffIso: string): string {
  const d = new Date(firstKickoffIso);
  const y = d.getUTCFullYear();
  const start = d.getUTCMonth() >= 6 ? y : y - 1;
  return `${start}/${String(start + 1).slice(2)}`;
}

/** Seasons found in the stored fixtures, newest first. */
export function seasonList(fixtures: Fx[]): SeasonInfo[] {
  const map = new Map<number, { first: string; latest: string; finished: number }>();
  for (const f of fixtures) {
    if (f.season_id === null) continue;
    const m = map.get(f.season_id) ?? { first: f.kickoff, latest: "", finished: 0 };
    if (f.kickoff < m.first) m.first = f.kickoff;
    if (isDone(f)) {
      m.finished++;
      if (f.kickoff > m.latest) m.latest = f.kickoff;
    }
    map.set(f.season_id, m);
  }
  return [...map]
    .filter(([, m]) => m.finished > 0)
    .map(([id, m]) => ({ id, label: seasonLabel(m.first), finished: m.finished, latest: m.latest }))
    .sort((a, b) => b.latest.localeCompare(a.latest));
}

export type Snapshot = {
  played: number;
  goals: number;
  goalsPerMatch: number;
  homeWinPct: number;
  drawPct: number;
  awayWinPct: number;
  bttsPct: number;
  over25Pct: number;
  biggestWin: { fixtureId: number; homeId: number; awayId: number; score: string; margin: number } | null;
  highest: { fixtureId: number; homeId: number; awayId: number; score: string; total: number } | null;
};

export function snapshot(fixtures: Fx[], seasonId: number): Snapshot | null {
  const done = fixtures.filter((f) => f.season_id === seasonId && isDone(f));
  if (done.length === 0) return null;
  let goals = 0, hw = 0, dr = 0, aw = 0, btts = 0, over = 0;
  let biggest: Snapshot["biggestWin"] = null;
  let highest: Snapshot["highest"] = null;
  for (const f of done) {
    const h = f.home_score as number;
    const a = f.away_score as number;
    goals += h + a;
    if (h > a) hw++;
    else if (h === a) dr++;
    else aw++;
    if (h > 0 && a > 0) btts++;
    if (h + a >= 3) over++;
    const margin = Math.abs(h - a);
    if (margin > 0 && (!biggest || margin > biggest.margin || (margin === biggest.margin && h + a > Number(biggest.score.split("-")[0]) + Number(biggest.score.split("-")[1])))) {
      biggest = { fixtureId: f.id, homeId: f.home_team_id, awayId: f.away_team_id, score: `${h}-${a}`, margin };
    }
    if (!highest || h + a > highest.total) highest = { fixtureId: f.id, homeId: f.home_team_id, awayId: f.away_team_id, score: `${h}-${a}`, total: h + a };
  }
  const pct = (n: number) => Math.round((n / done.length) * 100);
  return {
    played: done.length,
    goals,
    goalsPerMatch: Math.round((goals / done.length) * 100) / 100,
    homeWinPct: pct(hw),
    drawPct: pct(dr),
    awayWinPct: pct(aw),
    bttsPct: pct(btts),
    over25Pct: pct(over),
    biggestWin: biggest,
    highest
  };
}

export type Upcoming = { fixtureId: number; opponentId: number; home: boolean; kickoff: string };

/** The team's next matches that have not finished, soonest first. */
export function upcomingFor(teamId: number, fixtures: Fx[], nowMs: number, limit: number): Upcoming[] {
  return fixtures
    .filter((f) => (f.home_team_id === teamId || f.away_team_id === teamId) && f.status !== "finished" && !["cancelled", "canceled", "postponed", "abandoned"].includes(f.status.toLowerCase()))
    .filter((f) => new Date(f.kickoff).getTime() > nowMs - 3.5 * 3600000)
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff))
    .slice(0, limit)
    .map((f) => ({ fixtureId: f.id, opponentId: f.home_team_id === teamId ? f.away_team_id : f.home_team_id, home: f.home_team_id === teamId, kickoff: f.kickoff }));
}

export type PastResult = { fixtureId: number; opponentId: number; home: boolean; gf: number; ga: number; result: Result; kickoff: string };

/** The team's most recent finished matches, newest first, in a given season. */
export function resultsFor(teamId: number, fixtures: Fx[], seasonId: number, limit: number): PastResult[] {
  const recs = recordsByTeam(fixtures, seasonId).get(teamId) ?? [];
  return recs
    .slice(-limit)
    .reverse()
    .map((r) => ({ fixtureId: r.fixtureId, opponentId: r.opponentId, home: r.venue === "home", gf: r.gf, ga: r.ga, result: resultOf(r), kickoff: r.kickoff }));
}
