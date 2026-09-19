import { dbSelect } from "./supabase";
import { bsd } from "./bsd";
import { deriveStatus, formatKickoff } from "./format";
import { attackRating, defenceRating, fitStrengths, type Strengths } from "./model";
import { slugify } from "./teamMeta";
import type { Absence, H2H, Match, ProviderView, Result, TeamView } from "./types";

const LEAGUE_ID = 1; // Premier League
const HISTORY_FROM = "2025-08-01T00:00:00Z";
const CACHE = 60;

type FixtureRow = {
  id: number;
  round_number: number | null;
  kickoff: string;
  status: string;
  home_team_id: number;
  away_team_id: number;
  home_score: number | null;
  away_score: number | null;
};
type TeamRow = { id: number; name: string; short: string; color: string };
type AbsenceRow = { fixture_id: number; side: "home" | "away"; player_name: string; status: string | null; reason: string | null };
type PredRow = {
  fixture_id: number; model_version: string; home_xg: number; away_xg: number;
  p_home: number; p_draw: number; p_away: number; btts: number; over25: number;
  likely_home: number; likely_away: number; created_at: string; updated_at: string; locked_at: string | null;
};
type LineupRow = { fixture_id: number; lineup_status: string; raw?: unknown };

const FIXTURE_COLS = "id,round_number,kickoff,status,home_team_id,away_team_id,home_score,away_score";

function resultFor(f: FixtureRow, teamId: number): Result | null {
  if (f.home_score === null || f.away_score === null) return null;
  const mine = f.home_team_id === teamId ? f.home_score : f.away_score;
  const theirs = f.home_team_id === teamId ? f.away_score : f.home_score;
  return mine > theirs ? "W" : mine === theirs ? "D" : "L";
}

type Ctx = {
  teams: Map<number, TeamRow>;
  finished: FixtureRow[];
  strengths: Strengths;
  absences: AbsenceRow[];
  preds: Map<number, PredRow>;
  lineups: Map<number, LineupRow>;
  providerRaw: Map<number, unknown>;
};

function teamView(teamId: number, before: string, ctx: Ctx, absences: Absence[]): TeamView {
  const t = ctx.teams.get(teamId);
  const played = ctx.finished
    .filter((f) => (f.home_team_id === teamId || f.away_team_id === teamId) && f.kickoff < before)
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff))
    .slice(-5);
  const form = played.map((f) => resultFor(f, teamId)).filter((r): r is Result => r !== null);
  let gf = 0, ga = 0;
  for (const f of played) {
    gf += f.home_team_id === teamId ? f.home_score ?? 0 : f.away_score ?? 0;
    ga += f.home_team_id === teamId ? f.away_score ?? 0 : f.home_score ?? 0;
  }
  return {
    id: teamId,
    name: t?.name ?? `Team ${teamId}`,
    short: t?.short ?? "???",
    color: t?.color ?? "#5b6b73",
    form,
    avgScored: played.length ? Math.round((gf / played.length) * 10) / 10 : null,
    avgConceded: played.length ? Math.round((ga / played.length) * 10) / 10 : null,
    attack: attackRating(ctx.strengths, teamId),
    defence: defenceRating(ctx.strengths, teamId),
    absences
  };
}

function providerView(raw: unknown): ProviderView {
  try {
    const mr = (raw as { markets?: { match_result?: { prob_home?: number; prob_draw?: number; prob_away?: number } } })
      .markets?.match_result;
    if (!mr || mr.prob_home === undefined || mr.prob_draw === undefined || mr.prob_away === undefined) return null;
    return { homeWin: Math.round(mr.prob_home), draw: Math.round(mr.prob_draw), awayWin: Math.round(mr.prob_away) };
  } catch {
    return null;
  }
}

function buildMatch(f: FixtureRow, ctx: Ctx, now: Date): Match {
  const home = ctx.teams.get(f.home_team_id);
  const away = ctx.teams.get(f.away_team_id);
  const abs = (side: "home" | "away"): Absence[] =>
    ctx.absences
      .filter((a) => a.fixture_id === f.id && a.side === side)
      .map((a) => ({ name: a.player_name, status: a.status ?? "unavailable", reason: a.reason ?? "" }));
  const p = ctx.preds.get(f.id);
  const lu = ctx.lineups.get(f.id);
  const { dateLabel, time } = formatKickoff(f.kickoff);
  const status = deriveStatus(f.status, f.kickoff, now);

  return {
    id: f.id,
    slug: `${slugify(home?.name ?? "home")}-v-${slugify(away?.name ?? "away")}-${f.id}`,
    competition: "Premier League",
    matchday: f.round_number,
    kickoff: f.kickoff,
    dateLabel,
    time,
    status,
    score: f.home_score !== null && f.away_score !== null ? { home: f.home_score, away: f.away_score } : null,
    home: teamView(f.home_team_id, f.kickoff, ctx, abs("home")),
    away: teamView(f.away_team_id, f.kickoff, ctx, abs("away")),
    outlook: p
      ? {
          homeXg: Number(p.home_xg),
          awayXg: Number(p.away_xg),
          homeWin: p.p_home,
          draw: p.p_draw,
          awayWin: p.p_away,
          btts: p.btts,
          over25: p.over25,
          likelyScore: [p.likely_home, p.likely_away]
        }
      : null,
    lineupStatus: lu?.lineup_status ?? "unknown",
    lineupRaw: lu?.raw ?? null,
    ledger: p ? { modelVersion: p.model_version, createdAt: p.created_at, updatedAt: p.updated_at, lockedAt: p.locked_at } : null,
    provider: ctx.providerRaw.has(f.id) ? providerView(ctx.providerRaw.get(f.id)) : null
  };
}

async function loadContext(fixtureIds: number[], withRaw: boolean): Promise<Ctx> {
  const idList = `in.(${fixtureIds.join(",") || "0"})`;
  const [teams, finished, absences, preds, lineups, provider] = await Promise.all([
    dbSelect<TeamRow>("teams", { select: "id,name,short,color", limit: "500" }, { revalidate: CACHE }),
    dbSelect<FixtureRow>(
      "fixtures",
      { select: FIXTURE_COLS, league_id: `eq.${LEAGUE_ID}`, status: "eq.finished", kickoff: `gte.${HISTORY_FROM}`, limit: "1000" },
      { revalidate: CACHE }
    ),
    dbSelect<AbsenceRow>("absences", { select: "fixture_id,side,player_name,status,reason", fixture_id: idList, limit: "1000" }, { revalidate: CACHE }),
    dbSelect<PredRow>("predictions", { select: "*", fixture_id: idList, limit: "1000" }, { revalidate: CACHE }),
    dbSelect<LineupRow>("lineups", { select: withRaw ? "fixture_id,lineup_status,raw" : "fixture_id,lineup_status", fixture_id: idList, limit: "1000" }, { revalidate: CACHE }),
    withRaw
      ? dbSelect<{ fixture_id: number; raw: unknown }>("provider_predictions", { select: "fixture_id,raw", fixture_id: idList }, { revalidate: CACHE })
      : Promise.resolve([] as { fixture_id: number; raw: unknown }[])
  ]);

  const hist = finished
    .filter((f) => f.home_score !== null && f.away_score !== null)
    .map((f) => ({ homeId: f.home_team_id, awayId: f.away_team_id, homeGoals: f.home_score as number, awayGoals: f.away_score as number, date: f.kickoff }));

  return {
    teams: new Map(teams.map((t) => [t.id, t])),
    finished,
    strengths: fitStrengths(hist, new Date()),
    absences,
    preds: new Map(preds.map((p) => [p.fixture_id, p])),
    lineups: new Map(lineups.map((l) => [l.fixture_id, l])),
    providerRaw: new Map(provider.map((p) => [p.fixture_id, p.raw]))
  };
}

export async function loadMatches(daysBack: number, daysAhead: number): Promise<{ matches: Match[]; error: string | null }> {
  try {
    const now = new Date();
    const from = new Date(now.getTime() - daysBack * 86400000).toISOString();
    const to = new Date(now.getTime() + daysAhead * 86400000).toISOString();
    const rows = await dbSelect<FixtureRow>(
      "fixtures",
      { select: FIXTURE_COLS, league_id: `eq.${LEAGUE_ID}`, kickoff: [`gte.${from}`, `lt.${to}`], order: "kickoff.asc", limit: "200" },
      { revalidate: CACHE }
    );
    const ctx = await loadContext(rows.map((r) => r.id), false);
    return { matches: rows.map((r) => buildMatch(r, ctx, now)), error: null };
  } catch (e) {
    return { matches: [], error: e instanceof Error ? e.message : String(e) };
  }
}

export async function loadMatch(id: number): Promise<{ match: Match | null; h2h: H2H | null; error: string | null }> {
  try {
    const rows = await dbSelect<FixtureRow>("fixtures", { select: FIXTURE_COLS, id: `eq.${id}` }, { revalidate: CACHE });
    if (rows.length === 0) return { match: null, h2h: null, error: null };
    const ctx = await loadContext([id], true);
    const match = buildMatch(rows[0], ctx, new Date());
    return { match, h2h: await loadH2H(id), error: null };
  } catch (e) {
    return { match: null, h2h: null, error: e instanceof Error ? e.message : String(e) };
  }
}

async function loadH2H(id: number): Promise<H2H | null> {
  try {
    const r = await bsd<{
      total_matches?: number; home_wins?: number; draws?: number; away_wins?: number; avg_total_goals?: number;
      recent_matches?: { date?: string; home?: string; away?: string; score?: string }[];
    }>(`/events/${id}/h2h/`, { revalidate: 3600 });
    if (!r || !r.total_matches) return null;
    return {
      total: r.total_matches,
      homeWins: r.home_wins ?? 0,
      draws: r.draws ?? 0,
      awayWins: r.away_wins ?? 0,
      avgGoals: typeof r.avg_total_goals === "number" ? Math.round(r.avg_total_goals * 10) / 10 : null,
      recent: (r.recent_matches ?? []).slice(0, 6).map((m) => ({
        date: m.date ?? "", home: m.home ?? "", away: m.away ?? "", score: m.score ?? ""
      }))
    };
  } catch {
    return null;
  }
}

export type TrackRecord = { n: number; accuracy: number; brier: number };

/** How well locked predictions did on matches that have finished. */
export async function loadTrackRecord(): Promise<TrackRecord | null> {
  try {
    const preds = await dbSelect<PredRow>("predictions", { select: "*", locked_at: "not.is.null", limit: "1000" }, { revalidate: CACHE });
    if (preds.length === 0) return null;
    const fx = await dbSelect<FixtureRow>(
      "fixtures",
      { select: FIXTURE_COLS, id: `in.(${preds.map((p) => p.fixture_id).join(",")})`, status: "eq.finished", limit: "1000" },
      { revalidate: CACHE }
    );
    const byId = new Map(fx.map((f) => [f.id, f]));
    let n = 0, hits = 0, brier = 0;
    for (const p of preds) {
      const f = byId.get(p.fixture_id);
      if (!f || f.home_score === null || f.away_score === null) continue;
      const out = f.home_score > f.away_score ? 0 : f.home_score === f.away_score ? 1 : 2;
      const probs = [p.p_home / 100, p.p_draw / 100, p.p_away / 100];
      brier += probs.reduce((s, pr, i) => s + (pr - (i === out ? 1 : 0)) ** 2, 0);
      if (probs.indexOf(Math.max(...probs)) === out) hits++;
      n++;
    }
    if (n === 0) return null;
    return { n, accuracy: Math.round((hits / n) * 100), brier: Math.round((brier / n) * 1000) / 1000 };
  } catch {
    return null;
  }
}
