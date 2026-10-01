import { bsd } from "@/lib/bsd";
import { loadEnabledLeagues } from "@/lib/leagues";
import { rowsOf, snapFromRaw, type LiveSnap } from "@/lib/live";

export const dynamic = "force-dynamic";

/**
 * Scores, clock and status for live matches, across every enabled league.
 * One provider request per league is shared by every visitor: the provider's own cache is
 * 10 to 30 seconds, so we cache for 10 seconds and let the CDN absorb the rest.
 */
async function liveMap(): Promise<Map<number, LiveSnap>> {
  const out = new Map<number, LiveSnap>();
  const leagues = await loadEnabledLeagues();
  await Promise.all(
    leagues.map(async (league) => {
      try {
        const data = await bsd<unknown>(`/events/live/?league_id=${league.id}&limit=50`, { revalidate: 10 });
        for (const r of rowsOf(data)) {
          const s = snapFromRaw(r, true);
          if (s) out.set(s.id, s);
        }
      } catch {
        // If one league's live feed is briefly unavailable, the others still come through.
      }
    })
  );
  return out;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ids = (url.searchParams.get("ids") ?? "")
    .split(",")
    .map((s) => Number(s))
    .filter((n) => Number.isInteger(n) && n > 0)
    .slice(0, 12);

  const live = await liveMap();
  const matches: LiveSnap[] = [];

  if (ids.length === 0) {
    matches.push(...live.values());
  } else {
    const missing: number[] = [];
    for (const id of ids) {
      const s = live.get(id);
      if (s) matches.push(s);
      else missing.push(id);
    }
    // Not in the live list: it has not started, or it has just ended. Ask about that match directly
    // (this works for any league, since a specific match id needs no league filter).
    await Promise.all(
      missing.slice(0, 6).map(async (id) => {
        try {
          const d = await bsd<unknown>(`/events/${id}/`, { revalidate: 10 });
          const s = d ? snapFromRaw(d, false) : null;
          if (s) matches.push(s);
        } catch {
          // skip this one
        }
      })
    );
  }

  return Response.json(
    { at: Date.now(), matches },
    { headers: { "Cache-Control": "public, s-maxage=5, stale-while-revalidate=10" } }
  );
}
