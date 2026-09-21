import { bsd } from "@/lib/bsd";

export const dynamic = "force-dynamic";

/** Protected diagnostic: shows the raw shape of the provider's league, leaderboard and squad data. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = process.env.CRON_SECRET;
  const ok = !!secret && (req.headers.get("authorization") === `Bearer ${secret}` || url.searchParams.get("secret") === secret);
  const headers = { "content-type": "text/plain; charset=utf-8" };
  if (!ok) return new Response("unauthorized", { status: 401, headers });

  const paths = [
    "/leagues/1/",
    "/leagues/1/standings/?season_id=1058",
    "/leagues/1/top/scorers/",
    "/leagues/1/top/assists/",
    "/leagues/1/top/yellow_cards/",
    "/leagues/1/top/yellows/",
    "/leagues/1/top/cards/",
    "/leagues/1/top/red_cards/",
    "/leagues/1/top/reds/",
    "/leagues/1/top/fouls/",
    "/players/852/",
    "/players/852/stats/?season_id=1058&limit=2",
    "/players/852/career/",
    "/players/852/transfers/"
  ];
  const out: string[] = ["PROVIDER LEAGUE PROBE", "====================="];
  for (const p of paths) {
    try {
      const data = await bsd<unknown>(p);
      out.push("", `GET ${p}`, data === null ? "-> not found (404)" : JSON.stringify(data).slice(0, 700));
    } catch (e) {
      out.push("", `GET ${p}`, `-> error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return new Response(out.join("\n"), { headers });
}
