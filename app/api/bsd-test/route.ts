/** TEMPORARY. Shows the raw lineup layout of one finished match. Delete afterwards. */
export const dynamic = "force-dynamic";

export async function GET() {
  const key = process.env.BSD_API_KEY;
  const headers = { "content-type": "text/plain; charset=utf-8" };
  if (!key) return new Response("BSD_API_KEY is not set", { headers });
  const res = await fetch("https://sports.bzzoiro.com/api/v2/events/209576/lineups/", {
    headers: { Authorization: `Token ${key}` },
    cache: "no-store"
  });
  const text = await res.text();
  let summary = "";
  try {
    const j = JSON.parse(text) as { lineups?: Record<string, unknown> };
    const l = j.lineups ?? {};
    summary = `top-level keys of lineups: ${Object.keys(l).join(", ")}\n`;
    for (const side of Object.keys(l)) {
      const v = l[side];
      if (v && typeof v === "object") summary += `keys of ${side}: ${Object.keys(v as object).join(", ")}\n`;
    }
  } catch {
    summary = "could not read the response\n";
  }
  return new Response(`HTTP ${res.status}\n${summary}\n${text.slice(0, 2600)}`, { headers });
}
