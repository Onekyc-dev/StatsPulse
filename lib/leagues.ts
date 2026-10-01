import { dbSelect } from "./supabase";

export type League = { id: number; name: string; shortName: string; country: string; tier: number; color: string; enabled: boolean };

/** Every league switched on for syncing and display. Premier League is always first if present. */
export async function loadEnabledLeagues(cacheSeconds = 300): Promise<League[]> {
  try {
    const rows = await dbSelect<{ id: number; name: string; short_name: string; country: string; tier: number; color: string; enabled: boolean }>(
      "leagues",
      { select: "id,name,short_name,country,tier,color,enabled", enabled: "eq.true", order: "id.asc" },
      { revalidate: cacheSeconds }
    );
    const out = rows.map((r) => ({ id: r.id, name: r.name, shortName: r.short_name, country: r.country, tier: r.tier, color: r.color, enabled: r.enabled }));
    return out.sort((a, b) => (a.id === 1 ? -1 : b.id === 1 ? 1 : a.id - b.id));
  } catch {
    // If the table is missing or empty, fall back to Premier League only so the app keeps working.
    return [{ id: 1, name: "Premier League", shortName: "EPL", country: "England", tier: 1, color: "#18e6a4", enabled: true }];
  }
}

/** Every league we know about, enabled or not, for the league-directory "Soon" list. */
export async function loadAllLeagues(cacheSeconds = 300): Promise<League[]> {
  try {
    const rows = await dbSelect<{ id: number; name: string; short_name: string; country: string; tier: number; color: string; enabled: boolean }>(
      "leagues",
      { select: "id,name,short_name,country,tier,color,enabled", order: "enabled.desc,tier.asc,name.asc" },
      { revalidate: cacheSeconds }
    );
    return rows.map((r) => ({ id: r.id, name: r.name, shortName: r.short_name, country: r.country, tier: r.tier, color: r.color, enabled: r.enabled }));
  } catch {
    return [{ id: 1, name: "Premier League", shortName: "EPL", country: "England", tier: 1, color: "#18e6a4", enabled: true }];
  }
}

export const PREMIER_LEAGUE_ID = 1;
