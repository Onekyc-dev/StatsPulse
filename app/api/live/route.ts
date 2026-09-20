import { bsd } from "@/lib/bsd";
import { rowsOf, snapFromRaw, type LiveSnap } from "@/lib/live";

export const dynamic = "force-dynamic";

const LEAGUE_ID = 1;

/**
 * Scores, clock and status for live matches. One provider request is shared by every visitor:
 * the provider's own cache is 10 to 30 seconds, so we cache for 10 seconds and let the CDN absorb the rest.
 */
async function liveMap(): Promise<Map<number, LiveSnap>> {
  const out = new Map<number, LiveSnap>();
  try {
    const data = await bsd<unknown>(`/events/live/?league_id=${LEAGUE_ID}&limit=50`, { revalidate: 10 });
    for (const r of rowsOf(data)) {
      const s = snapFromRaw(r, true);
      if (s) out.set(s.id, s);
    }
  } catch {
    // If the live feed is briefly unavailable, callers fall back to per-match lookups below.
  }
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
    // Not in the live list: it has not started, or it has just ended. Ask about that match directly.
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
