/**
 * TEMPORARY diagnostic page (v2). Open /api/bsd-test to see whether the BSD data feed works.
 * It never prints the API key. Delete this file after the test.
 */
export const dynamic = "force-dynamic";

const BASE = "https://sports.bzzoiro.com/api/v2";
const FINISHED_SAMPLE_ID = "209576"; // Brentford v Chelsea, played 18 Sep 2026

type Json = Record<string, unknown>;
type CallResult = { path: string; status: number; ms: number; json: unknown; text: string };

async function call(path: string, key: string): Promise<CallResult> {
  const started = Date.now();
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { Authorization: `Token ${key}` },
      cache: "no-store"
    });
    const text = await res.text();
    let json: unknown = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
    return { path, status: res.status, ms: Date.now() - started, json, text };
  } catch (e) {
    return { path, status: 0, ms: Date.now() - started, json: null, text: String(e) };
  }
}

function items(data: unknown): Json[] {
  if (Array.isArray(data)) return data as Json[];
  if (data && typeof data === "object") {
    const r = (data as Json).results;
    if (Array.isArray(r)) return r as Json[];
  }
  return [];
}

function short(v: unknown, max = 500): string {
  if (v === undefined) return "(missing)";
  const s = JSON.stringify(v);
  if (s === undefined) return "(missing)";
  return s.length > max ? `${s.slice(0, max)}...` : s;
}

function day(offset: number): string {
  return new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
}

function asObj(v: unknown): Json {
  return v && typeof v === "object" ? (v as Json) : {};
}

export async function GET() {
  const key = process.env.BSD_API_KEY;
  const headers = { "content-type": "text/plain; charset=utf-8" };
  if (!key) {
    return new Response("BSD_API_KEY is not set on Vercel yet.", { headers });
  }

  const out: string[] = ["STATPULSE BSD TEST v2", "====================="];

  // 1. Which league is "Premier League"?
  const leagues = await call("/leagues/?limit=200", key);
  const pl = items(leagues.json).filter((l) => String(l.name ?? "").toLowerCase().includes("premier league"));
  out.push(`1. Leagues: HTTP ${leagues.status}, total ${items(leagues.json).length}`);
  pl.slice(0, 5).forEach((l) => out.push(`   ${short(l, 220)}`));
  const england = pl.find((l) => JSON.stringify(l).includes("England"));
  const plId = String((england ?? {}).id ?? 1);
  out.push(`   Using league_id = ${plId}`);

  // 2. Premier League matches in the next 7 days
  const upcoming = await call(
    `/events/?league_id=${plId}&status=upcoming&date_from=${day(0)}&date_to=${day(7)}&limit=50`,
    key
  );
  const list = items(upcoming.json).sort((a, b) => String(a.event_date).localeCompare(String(b.event_date)));
  out.push("");
  out.push(`2. Matches in the next 7 days: HTTP ${upcoming.status}, found ${list.length}`);
  list.slice(0, 6).forEach((e) => out.push(`   ${String(e.event_date).slice(0, 16)}  ${e.home_team} v ${e.away_team}  (id ${e.id})`));

  // 3. The nearest match: lineups, absences, prediction
  if (list.length > 0) {
    const id = String(list[0].id);
    const lineups = await call(`/events/${id}/lineups/`, key);
    const lj = asObj(lineups.json);
    const prediction = await call(`/events/${id}/prediction/`, key);
    out.push("");
    out.push(`3. Nearest match ${list[0].home_team} v ${list[0].away_team} (id ${id})`);
    out.push(`   lineup_status: ${String(lj.lineup_status)}`);
    out.push(`   unavailable_players: ${short(lj.unavailable_players, 700)}`);
    out.push(`   prediction: HTTP ${prediction.status}`);
    out.push(`   ${short(prediction.json, 700)}`);
  } else {
    out.push("3. No upcoming matches in the window, so lineups and prediction were not tested.");
  }

  // 4. A finished match: xG, confirmed lineup, incidents
  const stats = await call(`/events/${FINISHED_SAMPLE_ID}/stats/`, key);
  const fl = await call(`/events/${FINISHED_SAMPLE_ID}/lineups/`, key);
  const inc = await call(`/events/${FINISHED_SAMPLE_ID}/incidents/`, key);
  const sj = asObj(stats.json);
  const st = asObj(sj.stats);
  out.push("");
  out.push(`4. Finished match ${FINISHED_SAMPLE_ID} (Brentford v Chelsea, 18 Sep)`);
  out.push(`   stats: HTTP ${stats.status}, xg home: ${short(asObj(st.home).xg, 120)}, xg away: ${short(asObj(st.away).xg, 120)}`);
  out.push(`   shots in shotmap: ${Array.isArray(sj.shotmap) ? sj.shotmap.length : "none"}`);
  out.push(`   lineups: HTTP ${fl.status}, lineup_status: ${String(asObj(fl.json).lineup_status)}`);
  out.push(`   unavailable_players: ${short(asObj(fl.json).unavailable_players, 500)}`);
  out.push(`   incidents: HTTP ${inc.status}, ${short(inc.json, 400)}`);

  return new Response(out.join("\n"), { headers });
}
