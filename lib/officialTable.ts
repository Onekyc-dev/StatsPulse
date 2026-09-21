import { bsd } from "./bsd";
import { num } from "./live";

export type Zone = { key: string; label: string; type: string; from: number; to: number };
export type OfficialRow = {
  teamId: number;
  position: number;
  played: number;
  points: number;
  gd: number;
  xgf: number | null;
  xga: number | null;
  xgd: number | null;
  xgGames: number | null;
};
export type OfficialTable = { zones: Zone[]; rows: OfficialRow[] };

type Json = Record<string, unknown>;
const isObj = (v: unknown): v is Json => !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown): string => (typeof v === "string" ? v : "");

function mapZone(z: unknown): Zone | null {
  if (!isObj(z)) return null;
  const from = num(z.from);
  const to = num(z.to);
  if (from === null || to === null) return null;
  return { key: str(z.key), label: str(z.label) || "Zone", type: str(z.type), from, to };
}

function mapRow(r: unknown): OfficialRow | null {
  if (!isObj(r)) return null;
  const teamId = num(r.team_id);
  const position = num(r.position);
  const played = num(r.played);
  const points = num(r.pts) ?? num(r.points);
  if (teamId === null || position === null || played === null || points === null) return null;
  return {
    teamId,
    position,
    played,
    points,
    gd: num(r.gd) ?? 0,
    xgf: num(r.xgf),
    xga: num(r.xga),
    xgd: num(r.xgd),
    xgGames: num(r.xg_games)
  };
}

/** The provider's official table for a season: zones (Champions League, relegation) and expected goals. */
export async function loadOfficialTable(seasonId: number): Promise<OfficialTable | null> {
  try {
    const data = await bsd<unknown>(`/leagues/1/standings/?season_id=${seasonId}`, { revalidate: 600 });
    if (!isObj(data) || !Array.isArray(data.standings)) return null;
    const rows = data.standings.map(mapRow).filter((r): r is OfficialRow => r !== null);
    const zones = Array.isArray(data.zones) ? data.zones.map(mapZone).filter((z): z is Zone => z !== null) : [];
    return rows.length > 0 ? { zones, rows } : null;
  } catch {
    return null;
  }
}
