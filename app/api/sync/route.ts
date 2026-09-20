import { bsd, bsdList, type BsdEvent } from "@/lib/bsd";
import { dbDelete, dbInsert, dbPatch, dbSelect, dbSelectAll, dbUpsert } from "@/lib/supabase";
import { parseTeamLineup } from "@/lib/lineups";
import { TIERS } from "@/lib/tiers";
import { DEFAULT_PARAMS, MODEL_VERSION, fitStrengths, predict, type ModelParams } from "@/lib/model";
import { shortCode, teamColor } from "@/lib/teamMeta";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const LEAGUE_ID = 1; // Premier League
const HISTORY_FROM = "2022-08-01"; // four full seasons plus the current one
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

/** Compares new lineups with the stored ones and logs what changed, for the match timeline. */
async function recordLineupChanges(fetched: Fetched[]): Promise<void> {
  const withLineups = fetched.filter((f) => f.lu && f.lu.lineups);
  if (withLineups.length === 0) return;
  const old = await dbSelect<{ fixture_id: number; lineup_status: string; raw: unknown }>("lineups", {
    select: "fixture_id,lineup_status,raw", fixture_id: `in.(${withLineups.map((f) => f.id).join(",")})`, limit: "200"
  });
  const oldById = new Map(old.map((o) => [o.fixture_id, o]));
  const events: object[] = [];

  for (const f of withLineups) {
    const before = oldById.get(f.id);
    const toStatus = f.lu?.lineup_status ?? "unavailable";
    const fromStatus = before?.lineup_status ?? null;
    for (const side of ["home", "away"] as const) {
      const now = parseTeamLineup(f.lu?.lineups, side);
      if (!now) continue;
      const prev = before ? parseTeamLineup(before.raw, side) : null;
      const base = { fixture_id: f.id, side, from_status: fromStatus, to_status: toStatus, formation: now.formation };
      if (!prev) {
        events.push({ ...base, kind: toStatus === "confirmed" ? "confirmed" : "predicted", players_in: [], players_out: [] });
        continue;
      }
      const prevIds = new Set(prev.players.map((p) => p.id));
      const nowIds = new Set(now.players.map((p) => p.id));
      const playersIn = now.players.filter((p) => !prevIds.has(p.id)).map((p) => p.name);
      const playersOut = prev.players.filter((p) => !nowIds.has(p.id)).map((p) => p.name);
      const statusChanged = fromStatus !== toStatus;
      if (playersIn.length === 0 && playersOut.length === 0 && !statusChanged && prev.formation === now.formation) continue;
      events.push({
        ...base,
        kind: toStatus === "confirmed" && statusChanged ? "confirmed" : "changed",
        players_in: playersIn,
        players_out: playersOut
      });
    }
  }
  await dbInsert("lineup_events", events);
}

/**
 * Lineups, absences and (optionally) the provider's prediction for many matches.
 * Reads run in parallel, writes are batched into a few requests, and the work stops at the deadline
 * so the function never times out. Anything skipped is picked up on the next run.
 */
async function enrichBatch(
  ids: number[], withPrediction: boolean, deadline: number, log: string[], label: string, trackChanges = false
): Promise<void> {
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
  if (trackChanges) await recordLineupChanges(fetched);
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
  const hist = await dbSelectAll<FxRow>("fixtures", {
    select: "id,home_team_id,away_team_id,home_score,away_score,kickoff",
    league_id: `eq.${LEAGUE_ID}`, status: "eq.finished", kickoff: `gte.${HISTORY_FROM}T00:00:00Z`, order: "kickoff.asc,id.asc"
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

  await lockPredictions(log);
}

/** Predictions for matches that have kicked off become permanent, stamped with the kickoff time. */
async function lockPredictions(log: string[]): Promise<void> {
  const now = new Date();
  const open = await dbSelect<{ fixture_id: number; model_version: string }>("predictions", {
    select: "fixture_id,model_version", locked_at: "is.null", limit: "1000"
  });
  if (open.length > 0) {
    const fx = await dbSelect<{ id: number; kickoff: string }>("fixtures", {
      select: "id,kickoff", id: `in.(${[...new Set(open.map((o) => o.fixture_id))].join(",")})`, limit: "1000"
    });
    let locked = 0;
    for (const f of fx) {
      if (new Date(f.kickoff) <= now) {
        await dbPatch("predictions", { fixture_id: `eq.${f.id}`, locked_at: "is.null" }, { locked_at: f.kickoff });
        locked++;
      }
    }
    if (locked > 0) log.push(`locked ${locked} predictions at kickoff`);
  }
}

type Score = { brier: number; logLoss: number; accuracy: number };

/** Replays the model over past matches: each is predicted using only the matches before it. */
async function backtest() {
  const rows = await dbSelectAll<FxRow>("fixtures", {
    select: "id,home_team_id,away_team_id,home_score,away_score,kickoff",
    league_id: `eq.${LEAGUE_ID}`, status: "eq.finished", kickoff: `gte.${HISTORY_FROM}T00:00:00Z`, order: "kickoff.asc,id.asc"
  });
  const played = rows
    .filter((f) => f.home_score !== null && f.away_score !== null)
    .map((f) => ({ homeId: f.home_team_id, awayId: f.away_team_id, homeGoals: f.home_score as number, awayGoals: f.away_score as number, date: f.kickoff }));
  const START = Math.min(300, Math.floor(played.length / 2)); // the first matches only train the model
  const outcome = (h: { homeGoals: number; awayGoals: number }) => (h.homeGoals > h.awayGoals ? 0 : h.homeGoals === h.awayGoals ? 1 : 2);
  const r3 = (v: number) => Math.round(v * 1000) / 1000;

  const score = (probs: number[][]): Score => {
    let brier = 0, logLoss = 0, hits = 0;
    probs.forEach((p, k) => {
      const o = outcome(played[START + k]);
      brier += p.reduce((s, pr, c) => s + (pr - (c === o ? 1 : 0)) ** 2, 0);
      logLoss += -Math.log(Math.max(0.001, p[o]));
      if (p.indexOf(Math.max(...p)) === o) hits++;
    });
    return { brier: r3(brier / probs.length), logLoss: r3(logLoss / probs.length), accuracy: Math.round((hits / probs.length) * 100) };
  };

  const configs: ModelParams[] = [
    DEFAULT_PARAMS,
    { halfLifeDays: 240, priorGames: 6 },
    { halfLifeDays: 600, priorGames: 6 },
    { halfLifeDays: 1200, priorGames: 6 },
    { halfLifeDays: 600, priorGames: 12 },
    { halfLifeDays: 600, priorGames: 3 }
  ];
  const run = (cfg: ModelParams): number[][] => {
    const out: number[][] = [];
    for (let i = START; i < played.length; i++) {
      const s = fitStrengths(played.slice(0, i), new Date(played[i].date), cfg);
      const o = predict(s, played[i].homeId, played[i].awayId).outlook;
      out.push([o.homeWin / 100, o.draw / 100, o.awayWin / 100]);
    }
    return out;
  };
  const allProbs = configs.map(run);
  const models = configs.map((cfg, k) => ({ settings: cfg, ...score(allProbs[k]) }));
  const best = models.reduce((bi, m, k) => (m.brier < models[bi].brier ? k : bi), 0);

  const average: number[][] = [];
  for (let i = START; i < played.length; i++) {
    const c = [0, 0, 0];
    for (let j = 0; j < i; j++) c[outcome(played[j])]++;
    average.push(c.map((v) => v / i));
  }
  // Is the model overconfident? Blend it toward the average outcome and see whether the score improves.
  const blends = [0, 0.1, 0.2, 0.3].map((w) => ({
    weight_on_average: w,
    ...score(allProbs[best].map((p, k) => p.map((v, c) => (1 - w) * v + w * average[k][c])))
  }));

  // How often is the model right when it is confident? (This is what a "70% accurate" claim can honestly mean.)
  const bp = allProbs[0]; // the live model
  const topOf = (p: number[]) => Math.max(...p);
  const hit = (k: number) => bp[k].indexOf(topOf(bp[k])) === outcome(played[START + k]);
  const bands = [0, 0.5, 0.55, 0.6, 0.65, 0.7].map((t) => {
    const idx = bp.map((_, k) => k).filter((k) => topOf(bp[k]) >= t);
    return {
      top_probability_at_least_percent: Math.round(t * 100),
      matches: idx.length,
      share_of_all_matches_percent: Math.round((idx.length / bp.length) * 100),
      accuracy_percent: idx.length ? Math.round((idx.filter(hit).length / idx.length) * 100) : null
    };
  });
  const calibration = [[0.3, 0.4], [0.4, 0.5], [0.5, 0.6], [0.6, 0.7], [0.7, 1.01]].map(([lo, hi]) => {
    const idx = bp.map((_, k) => k).filter((k) => topOf(bp[k]) >= lo && topOf(bp[k]) < hi);
    return {
      top_probability_between_percent: `${Math.round(lo * 100)}-${Math.min(100, Math.round(hi * 100))}`,
      matches: idx.length,
      average_stated_percent: idx.length ? Math.round((idx.reduce((s, k) => s + topOf(bp[k]), 0) / idx.length) * 100) : null,
      actually_right_percent: idx.length ? Math.round((idx.filter(hit).length / idx.length) * 100) : null
    };
  });
  // Double chance: pick the safest pair of outcomes (home or draw, draw or away, home or away).
  const pairs = [[0, 1], [1, 2], [0, 2]];
  let dcHits = 0;
  bp.forEach((p, k) => {
    const sums = pairs.map(([a, b]) => p[a] + p[b]);
    const pick = pairs[sums.indexOf(Math.max(...sums))];
    if (pick.includes(outcome(played[START + k]))) dcHits++;
  });

  // Exclusive confidence tiers, the same ones the site shows.
  const tierStats = TIERS.map((t) => {
    const idx = bp.map((_, k) => k).filter((k) => {
      const top = Math.round(topOf(bp[k]) * 100);
      return top >= t.min && top < t.max;
    });
    return {
      key: t.key, label: t.label, min: t.min, max: t.max, matches: idx.length,
      sharePercent: Math.round((idx.length / bp.length) * 100),
      accuracyPercent: idx.length ? Math.round((idx.filter(hit).length / idx.length) * 100) : null
    };
  });
  const liveScore = models[0];
  const stats = {
    modelVersion: MODEL_VERSION, testedAt: isoNow(), matchesTested: played.length - START,
    brier: liveScore.brier, baselineBrier: score(average).brier, accuracy: liveScore.accuracy,
    tiers: tierStats,
    calibration: calibration.map((c) => ({ range: c.top_probability_between_percent, matches: c.matches, stated: c.average_stated_percent, right: c.actually_right_percent }))
  };
  let savedForSite = true;
  try {
    await dbUpsert("model_stats", [{ key: "backtest", value: stats, updated_at: isoNow() }], "key");
  } catch {
    savedForSite = false; // run supabase/migration_3.sql first
  }

  return {
    saved_for_site: savedForSite,
    tiers: tierStats,
    double_chance_accuracy_percent: Math.round((dcHits / bp.length) * 100),
    confidence_bands: bands,
    calibration,
    matchesInDatabase: played.length,
    matchesTested: played.length - START,
    models,
    best_model_number: best + 1,
    blend_best_model_toward_average: blends,
    baseline_average_outcome: score(average),
    guessing_one_third_each: score(average.map(() => [1 / 3, 1 / 3, 1 / 3]))
  };
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
    if (mode === "near") {
      // Runs every few minutes: refreshes scores and lineups only for matches about to start or just played.
      const HOUR = 3600000;
      const window = await bsdList<BsdEvent>(
        `${base}&date_from=${ymd(new Date(now.getTime() - DAY))}&date_to=${ymd(new Date(now.getTime() + DAY))}`, 200
      );
      const mine = window.filter((e) => e.league_id === LEAGUE_ID);
      const saved = await ingest(mine);
      const active = mine.filter((e) => {
        const t = new Date(e.event_date).getTime();
        return t > now.getTime() - 3 * HOUR && t < now.getTime() + 3 * HOUR;
      });
      log.push(`saved ${saved} matches, ${active.length} within three hours of kickoff`);
      if (active.length > 0) await enrichBatch(active.map((e) => e.id), false, deadline, log, "matches near kickoff", true);
      await lockPredictions(log);
      log.push(`finished in ${Math.round((Date.now() - started) / 1000)} seconds`);
      return Response.json({ ok: true, mode, log });
    } else if (mode === "backtest") {
      const result = await backtest();
      return Response.json({ ok: true, mode, result });
    } else if (mode === "backfill") {
      const finished = await bsdList<BsdEvent>(`${base}&status=finished&date_from=${HISTORY_FROM}`, 3400);
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
      await enrichBatch([...live, ...soon].map((e) => e.id), true, deadline, log, "upcoming and live matches", true);
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
