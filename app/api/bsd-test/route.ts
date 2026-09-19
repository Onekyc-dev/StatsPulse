/** TEMPORARY. Shows the raw shape of lineup and prediction data so the display can be finished. Delete afterwards. */
export const dynamic = "force-dynamic";
const BASE = "https://sports.bzzoiro.com/api/v2";

async function get(path: string, key: string): Promise<{ status: number; body: string }> {
  const res = await fetch(`${BASE}${path}`, { headers: { Authorization: `Token ${key}` }, cache: "no-store" });
  return { status: res.status, body: await res.text() };
}

export async function GET() {
  const key = process.env.BSD_API_KEY;
  const headers = { "content-type": "text/plain; charset=utf-8" };
  if (!key) return new Response("BSD_API_KEY is not set", { headers });

  const today = new Date().toISOString().slice(0, 10);
  const list = await get(`/events/?league_id=1&status=upcoming&date_from=${today}&limit=5`, key);
  let id = "";
  try {
    const rows = (JSON.parse(list.body) as { results?: { id: number; event_date: string }[] }).results ?? [];
    rows.sort((a, b) => a.event_date.localeCompare(b.event_date));
    id = rows.length ? String(rows[0].id) : "";
  } catch {
    id = "";
  }
  const out = [`nearest match id: ${id || "none"}`, ""];
  if (id) {
    const lu = await get(`/events/${id}/lineups/`, key);
    out.push(`LINEUPS (HTTP ${lu.status}):`, lu.body.slice(0, 3200), "");
    const pr = await get(`/events/${id}/prediction/`, key);
    out.push(`PREDICTION (HTTP ${pr.status}):`, pr.body.slice(0, 1800));
  }
  return new Response(out.join("\n"), { headers });
}
