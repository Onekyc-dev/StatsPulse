/**
 * TEMPORARY diagnostic page. Open /api/bsd-test to see whether the BSD data feed works.
 * It never prints the API key. Delete this file after the test.
 */
export const dynamic = "force-dynamic";

const BASE = "https://sports.bzzoiro.com/api/v2";

type Json = Record<string, unknown>;

async function call(path: string, key: string) {
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

function firstItem(data: unknown): Json | undefined {
  if (Array.isArray(data)) return data[0] as Json | undefined;
  if (data && typeof data === "object") {
    const r = (data as Json).results;
    if (Array.isArray(r)) return r[0] as Json | undefined;
  }
  return undefined;
}

function count(data: unknown): number {
  if (Array.isArray(data)) return data.length;
  if (data && typeof data === "object") {
    const r = (data as Json).results;
    if (Array.isArray(r)) return r.length;
  }
  return 0;
}

function excerpt(r: { json: unknown; text: string }, max = 1800): string {
  const s = r.json ? JSON.stringify(r.json, null, 1) : r.text;
  return s.length > max ? `${s.slice(0, max)}\n... (cut)` : s;
}

export async function GET() {
  const key = process.env.BSD_API_KEY;
  const out: string[] = [];
  const headers = { "content-type": "text/plain; charset=utf-8" };

  if (!key) {
    return new Response(
      "BSD_API_KEY is not set on Vercel yet.\nAdd it under Settings > Environment Variables, then redeploy.",
      { headers }
    );
  }

  const events = await call("/events/?team_name=Chelsea&status=upcoming&limit=3", key);
  const first = firstItem(events.json);
  const id = first && first.id !== undefined ? String(first.id) : "";

  out.push("STATPULSE BSD TEST");
  out.push("==================");
  out.push(`1. Upcoming Chelsea matches: HTTP ${events.status}, found ${count(events.json)} (${events.ms} ms)`);

  let lineups: Awaited<ReturnType<typeof call>> | null = null;
  let detail: Awaited<ReturnType<typeof call>> | null = null;
  let prediction: Awaited<ReturnType<typeof call>> | null = null;

  if (id) {
    lineups = await call(`/events/${id}/lineups/`, key);
    detail = await call(`/events/${id}/`, key);
    prediction = await call(`/events/${id}/prediction/`, key);
    const lj = (lineups.json ?? {}) as Json;
    out.push(`2. Lineups for match ${id}: HTTP ${lineups.status}, lineup_status = ${String(lj.lineup_status)}`);
    out.push(`   unavailable_players present: ${lj.unavailable_players ? "yes" : "no or empty"}`);
    out.push(`3. Match detail: HTTP ${detail.status}`);
    out.push(`4. Model prediction: HTTP ${prediction.status}`);
  } else {
    out.push("2. No match id found, so lineups were not tested.");
  }

  out.push("");
  out.push("---- RAW: match list ----");
  out.push(excerpt(events));
  if (lineups) {
    out.push("");
    out.push("---- RAW: lineups ----");
    out.push(excerpt(lineups));
  }
  if (prediction) {
    out.push("");
    out.push("---- RAW: prediction ----");
    out.push(excerpt(prediction, 1200));
  }

  return new Response(out.join("\n"), { headers });
}
