/** TEMPORARY. Lists every league BSD covers, so real league_ids can be wired in. Delete afterwards. */
export const dynamic = "force-dynamic";
const BASE = "https://sports.bzzoiro.com/api/v2";

export async function GET() {
  const key = process.env.BSD_API_KEY;
  const headers = { "content-type": "text/plain; charset=utf-8" };
  if (!key) return new Response("BSD_API_KEY is not set", { headers });

  const out: string[] = [];
  try {
    const res = await fetch(`${BASE}/leagues/?limit=100`, { headers: { Authorization: `Token ${key}` }, cache: "no-store" });
    const text = await res.text();
    out.push(`GET /leagues/ (HTTP ${res.status})`, "");
    try {
      const j = JSON.parse(text) as { results?: { id: number; name: string; country?: string }[]; count?: number };
      const rows = j.results ?? [];
      out.push(`count reported: ${j.count ?? "?"}, this page: ${rows.length}`, "");
      const wanted = ["premier league", "la liga", "serie a", "bundesliga", "ligue 1", "nigeria", "npfl", "championship"];
      for (const r of rows) {
        const hit = wanted.some((w) => r.name.toLowerCase().includes(w));
        out.push(`${hit ? ">>" : "  "} id=${r.id}  ${r.name}  (${r.country ?? "?"})`);
      }
    } catch {
      out.push("could not parse JSON:", text.slice(0, 1500));
    }
  } catch (e) {
    out.push(`request failed: ${e instanceof Error ? e.message : String(e)}`);
  }
  return new Response(out.join("\n"), { headers });
}
