import { bsd, bsdList, type BsdEvent } from "@/lib/bsd";
import { dbDelete, dbPatch, dbSelect, dbUpsert } from "@/lib/supabase";
import { DEFAULT_PARAMS, MODEL_VERSION, fitStrengths, predict, type ModelParams } from "@/lib/model";
import { shortCode, teamColor } from "@/lib/teamMeta";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const LEAGUE_ID = 1; // Premier League
const HISTORY_FROM = "2025-08-01";
const DAY = 86400000;

const ymd = (d: Date) => d.toISOString().slice(0, 10);
const isoNow = () => new Date().toISOString();

async function pool<T>(items: T[], size: number, fn: (item: T) => Promise<void>): Promise<void> {
  for (let i = 0; i < items.length; i += size) {
    await Promise.all(items.slice(i, i + size).map(fn));
  }
}

/** Saves teams and fixtures from a batch of provider events. */
async function ingest(events: BsdEvent[]): Promise<number> {
  const teams = new Map<number, { id: number; name: string; short: string; color: string; updated_at: string }>();
  const fixtures = new Map<number, object>();
  const now = isoNow();
  for (const e of events) {
    if (e.home_team_id === null || e.away_team_id === null) continue;
    // Only current Premier League matches are stored, whatever the provider sends back.
    if (e.league_id !== LEAGUE_ID || e.event_date < HISTORY_FROM) continue;
    teams.set(e.home_team_id, { id: e.home_team_id, name: e.home_team, short: shortCode(e.home_team), color: teamColor(e.home_team), updated_at: now });
    teams.set(e.away_team_id, { id: e.away_team_id, name: e.away_team, short: shortCode(e.away_team), color: teamColor(e.away_team), updated_at: now });
    fixtures.set(e.id, {
      id: e.id,
      league_id: e.league_id,
      season_id: e.season_id,
      round_number: e.round_number,
      kickoff: e.event_date,
      status: e.status,
      home_team_id: e.home_team_id,
      away_team_id: e.away_team_id,
      home_score: e.home_score,
      away_score: e.away_score,
      venue_id: e.venue_id,
      updated_at: now
    });
  }
  await dbUpsert("teams", [...teams.values()], "id");
  await dbUpsert("fixtures", [...fixtures.values()], "id");
  return fixtures.size;
}

type PlayerOut = { id: number; name: string; status?: string; reason?: string };
type LineupResp = {
  lineup_status?: string;
  lineups?: unknown;
  unavailable_players?: { home?: PlayerOut[]; away?: PlayerOut[] } | null;
};
type Fetched = { id: number; lu: LineupResp | null; pr: object | null };

/**
 * Lineups, absences and (optionally) the provider's prediction for many matches.
 * Reads run in parallel, writes are batched into a few requests, and the work stops at the deadline
 * so the function never times out. Anything skipped is picked up on the next run.
 */
async function enrichBatch(ids: number[], withPrediction: boolean, deadline: number, log: string[], label: string): Promise<void> {
  const fetched: Fetched[] = [];
  let skipped = 0;
  let failed = 0;

  await pool(ids, 6, async (id) => {
    if (Date.now() > deadline) {
      skipped++;
      return;
    }
    try {
      const [lu, pr] = await Promise.all([
        bsd<LineupResp>(`/events/${id}/lineups/`),
        withPrediction ? bsd<object>(`/events/${id}/prediction/`) : Promise.resolve(null)
      ]);
      fetched.push({ id, lu, pr });
    } catch {
      failed++;
    }
  });

  const now = isoNow();
  const lineupRows = fetched.flatMap((f) =>
    f.lu ? [{ fixture_id: f.id, lineup_status: f.lu.lineup_status ?? "unavailable", raw: f.lu.lineups ?? null, updated_at: now }] : []
  );
  if (lineupRows.length > 0) await dbUpsert("lineups", lineupRows, "fixture_id");

  const withAbsences = fetched.filter((f) => f.lu && f.lu.unavailable_players);
  if (withAbsences.length > 0) {
    await dbDelete("absences", { fixture_id: `in.(${withAbsences.map((f) => f.id).join(",")})` });
    const absenceRows = withAbsences.flatMap((f) => {
      const un = f.lu?.unavailable_players;
      if (!un) return [];
      return (["home", "away"] as const).flatMap((side) =>
        (un[side] ?? []).map((p) => ({
          fixture_id: f.id, side, player_id: p.id, player_name: p.name, status: p.status ?? null, reason: p.reason ?? null, updated_at: now
        }))
      );
    });
    if (absenceRows.length > 0) await dbUpsert("absences", absenceRows, "fixture_id,side,player_id");
  }

  const predRows = fetched.flatMap((f) => (f.pr ? [{ fixture_id: f.id, raw: f.pr, fetched_at: now }] : []));
  if (predRows.length > 0) await dbUpsert("provider_predictions", predRows, "fixture_id");

  let msg = `${label}: ${fetched.length} of ${ids.length} matches refreshed`;
  if (skipped > 0) msg += `, ${skipped} skipped to stay within the time limit (run the link again to continue)`;
  if (failed > 0) msg += `, ${failed} failed`;
  log.push(msg);
}

type FxRow = { id: number; home_team_id: number; away_team_id: number; home_score: number | null; away_score: number | null; kickoff: string };

/** Our own predictions for matches that have not kicked off yet. Locked matches are never touched. */
async function refreshPredictions(log: string[]): Promise<void> {
  const now = new Date();
  const hist = await dbSelect<FxRow>("fixtures", {
    select: "id,home_team_id,away_team_id,home_score,away_score,kickoff",
    league_id: `eq.${LEAGUE_ID}`, status: "eq.finished", kickoff: `gte.${HISTORY_FROM}T00:00:00Z`, limit: "1000"
  });
  const strengths = fitStrengths(
    hist.filter((f) => f.home_score !== null && f.away_score !== null).map((f) => ({
      homeId: f.home_team_id, awayId: f.away_team_id, homeGoals: f.home_score as number, awayGoals: f.away_score as number, date: f.kickoff
    })),
    now
  );

  const upcoming = await dbSelect<FxRow>("fixtures", {
    select: "id,home_team_id,away_team_id,home_score,away_score,kickoff",
    league_id: `eq.${LEAGUE_ID}`, kickoff: [`gt.${now.toISOString()}`, `lt.${new Date(now.getTime() + 30 * DAY).toISOString()}`], limit: "200"
  });
  const rows = upcoming.map((f) => {
    const p = predict(strengths, f.home_team_id, f.away_team_id);
    return {
      fixture_id: f.id, model_version: MODEL_VERSION, home_xg: p.homeXg, away_xg: p.awayXg,
      p_home: p.outlook.homeWin, p_draw: p.outlook.draw, p_away: p.outlook.awayWin,
      btts: p.outlook.btts, over25: p.outlook.over25,
      likely_home: p.outlook.likelyScore[0], likely_away: p.outlook.likelyScore[1], updated_at: now.toISOString()
    };
  });
  if (rows.length > 0) await dbUpsert("predictions", rows, "fixture_id,model_version");
  log.push(`predictions written for ${rows.length} upcoming matches (from ${hist.length} finished matches)`);

  // Lock: predictions for matches that have kicked off become permanent, stamped with kickoff time.
  const open = await dbSelect<{ fixture_id: number }>("predictions", {
    select: "fixture_id", locked_at: "is.null", model_version: `eq.${MODEL_VERSION}`, limit: "1000"
  });
  if (open.length > 0) {
    const fx = await dbSelect<{ id: number; kickoff: string }>("fixtures", {
      select: "id,kickoff", id: `in.(${open.map((o) => o.fixture_id).join(",")})`, limit: "1000"
    });
    let locked = 0;
    for (const f of fx) {
      if (new Date(f.kickoff) <= now) {
        await dbPatch("predictions", { fixture_id: `eq.${f.id}`, model_version: `eq.${MODEL_VERSION}` }, { locked_at: f.kickoff });
        locked++;
      }
    }
    if (locked > 0) log.push(`locked ${locked} predictions at kickoff`);
  }
}

type Score = { brier: number; logLoss: number; accuracy: number };

/** Replays the model over past matches: each is predicted using only the matches before it. */
async function backtest() {
  const rows = await dbSelect<FxRow>("fixtures", {
    select: "id,home_team_id,away_team_id,home_score,away_score,kickoff",
    league_id: `eq.${LEAGUE_ID}`, status: "eq.finished", kickoff: `gte.${HISTORY_FROM}T00:00:00Z`, order: "kickoff.asc", limit: "1000"
  });
  const played = rows
    .filter((f) => f.home_score !== null && f.away_score !== null)
    .map((f) => ({ homeId: f.home_team_id, awayId: f.away_team_id, homeGoals: f.home_score as number, awayGoals: f.away_score as number, date: f.kickoff }));
  const START = 100; // the first matches only train the model
  const outcome = (h: { homeGoals: number; awayGoals: number }) => (h.homeGoals > h.awayGoals ? 0 : h.homeGoals === h.awayGoals ? 1 : 2);

  const score = (probsFor: (i: number) => number[]): Score => {
    let brier = 0, logLoss = 0, hits = 0, n = 0;
    for (let i = START; i < played.length; i++) {
      const p = probsFor(i);
      const o = outcome(played[i]);
      brier += p.reduce((s, pr, k) => s + (pr - (k === o ? 1 : 0)) ** 2, 0);
      logLoss += -Math.log(Math.max(0.001, p[o]));
      if (p.indexOf(Math.max(...p)) === o) hits++;
      n++;
    }
    const r = (v: number) => Math.round(v * 1000) / 1000;
    return { brier: r(brier / n), logLoss: r(logLoss / n), accuracy: Math.round((hits / n) * 100) };
  };

  const configs: ModelParams[] = [
    DEFAULT_PARAMS,
    { halfLifeDays: 120, priorGames: 6 },
    { halfLifeDays: 480, priorGames: 6 },
    { halfLifeDays: 240, priorGames: 3 },
    { halfLifeDays: 240, priorGames: 12 },
    { halfLifeDays: 240, priorGames: 20 }
  ];
  const models = configs.map((cfg) => ({
    settings: cfg,
    ...score((i) => {
      const s = fitStrengths(played.slice(0, i), new Date(played[i].date), cfg);
      const o = predict(s, played[i].homeId, played[i].awayId).outlook;
      return [o.homeWin / 100, o.draw / 100, o.awayWin / 100];
    })
  }));

  const baseline = score((i) => {
    const seen = played.slice(0, i);
    const c = [0, 0, 0];
    seen.forEach((m) => c[outcome(m)]++);
    return c.map((v) => v / seen.length);
  });
  const uniform = score(() => [1 / 3, 1 / 3, 1 / 3]);

  return { matchesTested: played.length - START, models, baseline_average_outcome: baseline, guessing_one_third_each: uniform };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = process.env.CRON_SECRET;
  const authorized = !!secret && (req.headers.get("authorization") === `Bearer ${secret}` || url.searchParams.get("secret") === secret);
  if (!authorized) return Response.json({ error: "unauthorized" }, { status: 401 });

  const missing = ["BSD_API_KEY", "SUPABASE_URL", "SUPABASE_SECRET_KEY"].filter((k) => !process.env[k]);
  if (missing.length > 0) return Response.json({ error: `missing environment variables: ${missing.join(", ")}` }, { status: 500 });

  const mode = url.searchParams.get("mode") ?? "daily";
  const log: string[] = [];
  const now = new Date();
  const started = Date.now();
  const deadline = started + 40000; // stop starting new work after 40 seconds
  const base = `/events/?league_id=${LEAGUE_ID}`;

  try {
    if (mode === "backtest") {
      const result = await backtest();
      return Response.json({ ok: true, mode, result });
    } else if (mode === "backfill") {
      const finished = await bsdList<BsdEvent>(`${base}&status=finished&date_from=${HISTORY_FROM}`);
      log.push(`finished matches saved: ${await ingest(finished)}`);
      const upcoming = await bsdList<BsdEvent>(`${base}&status=upcoming&date_from=${ymd(now)}&date_to=${ymd(new Date(now.getTime() + 60 * DAY))}`);
      log.push(`upcoming matches saved: ${await ingest(upcoming)}`);
      await refreshPredictions(log);
    } else if (mode === "lineups") {
      // Collects confirmed lineups of finished matches, in batches, for the stability score later.
      const finished = await dbSelect<{ id: number }>("fixtures", {
        select: "id", league_id: `eq.${LEAGUE_ID}`, status: "eq.finished", kickoff: "gte.2026-07-01T00:00:00Z", order: "kickoff.desc", limit: "400"
      });
      const have = await dbSelect<{ fixture_id: number }>("lineups", { select: "fixture_id", limit: "1000" });
      const haveSet = new Set(have.map((h) => h.fixture_id));
      const todo = finished.filter((f) => !haveSet.has(f.id)).slice(0, 40);
      await enrichBatch(todo.map((f) => f.id), false, deadline, log, "lineups of finished matches");
      const stillToDo = finished.filter((f) => !haveSet.has(f.id)).length - todo.length;
      log.push(`finished 2026/27 matches stored: ${finished.length}, with lineups already: ${finished.length - todo.length - Math.max(0, stillToDo)}, still to collect: ${Math.max(0, stillToDo)}`);
    } else {
      const recent = await bsdList<BsdEvent>(`${base}&status=finished&date_from=${ymd(new Date(now.getTime() - 10 * DAY))}`, 400);
      const upcoming = await bsdList<BsdEvent>(
        `${base}&status=upcoming&date_from=${ymd(now)}&date_to=${ymd(new Date(now.getTime() + 30 * DAY))}`, 400
      );
      // Live matches: look at yesterday to tomorrow and keep anything that has started but not finished.
      const window = await bsdList<BsdEvent>(
        `${base}&date_from=${ymd(new Date(now.getTime() - DAY))}&date_to=${ymd(new Date(now.getTime() + DAY))}`, 200
      );
      const notLive = ["notstarted", "scheduled", "upcoming", "finished", "cancelled", "postponed", "abandoned", "suspended", "unresolved"];
      const live = window.filter((e) => e.league_id === LEAGUE_ID && !notLive.includes(String(e.status).toLowerCase()));
      const saved = await ingest([...recent, ...live, ...upcoming]);
      log.push(`saved ${saved} matches (${recent.length} recent, ${live.length} live, ${upcoming.length} upcoming)`);

      const soon = upcoming
        .filter((e) => new Date(e.event_date).getTime() < now.getTime() + 14 * DAY)
        .sort((a, b) => a.event_date.localeCompare(b.event_date));
      await enrichBatch([...live, ...soon].map((e) => e.id), true, deadline, log, "upcoming and live matches");
      const justPlayed = recent.filter((e) => new Date(e.event_date).getTime() > now.getTime() - 3 * DAY);
      await enrichBatch(justPlayed.map((e) => e.id), false, deadline, log, "just-played matches");
      await refreshPredictions(log);
    }
    log.push(`finished in ${Math.round((Date.now() - started) / 1000)} seconds`);
    return Response.json({ ok: true, mode, log });
  } catch (e) {
    log.push(`stopped after ${Math.round((Date.now() - started) / 1000)} seconds`);
    return Response.json({ ok: false, mode, log, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
