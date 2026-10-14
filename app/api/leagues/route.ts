import { loadEnabledLeagues } from "@/lib/leagues";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const leagues = await loadEnabledLeagues();
    return Response.json({ leagues });
  } catch {
    return Response.json({ leagues: [] });
  }
}