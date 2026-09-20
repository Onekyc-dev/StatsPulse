import { bsd } from "@/lib/bsd";
import { mapIncidents, mapStats, rowsOf, snapFromRaw, type LiveSnap } from "@/lib/live";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Everything the Match Centre needs for one match: clock and score, events, and statistics. */
export async function GET(_req: Request, { params }: Ctx) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) return Response.json({ error: "bad id" }, { status: 400 });

  const safe = async <T,>(p: Promise<T | null>): Promise<T | null> => {
    try {
      return await p;
    } catch {
      return null;
    }
  };

  const [detail, live, incidents, stats] = await Promise.all([
    safe(bsd<unknown>(`/events/${id}/`, { revalidate: 10 })),
    safe(bsd<unknown>(`/events/live/?league_id=1&limit=50`, { revalidate: 10 })),
    safe(bsd<unknown>(`/events/${id}/incidents/`, { revalidate: 10 })),
    safe(bsd<unknown>(`/events/${id}/stats/`, { revalidate: 10 }))
  ]);

  // Prefer the live feed (fresher clock), fall back to the match record.
  let snap: LiveSnap | null = null;
  for (const r of rowsOf(live)) {
    const s = snapFromRaw(r, true);
    if (s && s.id === id) snap = s;
  }
  if (!snap && detail) snap = snapFromRaw(detail, false);

  return Response.json(
    { at: Date.now(), snap, events: mapIncidents(incidents), stats: mapStats(stats) },
    { headers: { "Cache-Control": "public, s-maxage=5, stale-while-revalidate=10" } }
  );
}
