import { bsd } from "./bsd";
import { dbSelect } from "./supabase";
import { num, rowsOf } from "./live";

export type SearchHit =
  | { kind: "team"; id: number; name: string; short: string; color: string }
  | { kind: "player"; id: number; name: string; teamName: string; teamId: number | null };

type Json = Record<string, unknown>;
const isObj = (v: unknown): v is Json => !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown): string => (typeof v === "string" ? v : "");

/** Clubs from our own database, then players from the provider's player search. Runs in parallel. */
export async function search(query: string): Promise<SearchHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const like = `ilike.*${q.replace(/[%*]/g, "")}*`;

  const [teams, playerData] = await Promise.all([
    dbSelect<{ id: number; name: string; short: string; color: string }>("teams", { select: "id,name,short,color", name: like, limit: "6" }, { revalidate: 60 }).catch(() => []),
    bsd<unknown>(`/players/?search=${encodeURIComponent(q)}&limit=8`, { revalidate: 60 }).catch(() => null)
  ]);

  const players: SearchHit[] = rowsOf(playerData)
    .map((r): SearchHit | null => {
      if (!isObj(r)) return null;
      const id = num(r.id);
      const name = str(r.name);
      if (id === null || !name) return null;
      const team = isObj(r.current_team) ? r.current_team : null;
      return { kind: "player", id, name, teamName: str(r.team_name) || (team ? str(team.name) : ""), teamId: num(r.current_team_id) ?? (team ? num(team.id) : null) };
    })
    .filter((h): h is SearchHit => h !== null);

  return [...teams.map((t): SearchHit => ({ kind: "team", ...t })), ...players];
}
