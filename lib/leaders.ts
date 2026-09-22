import { bsd } from "./bsd";
import { num, rowsOf } from "./live";

export type LeaderStat = "goals" | "assists" | "yellow" | "red" | "fouls";
export type Leader = { rank: number; playerId: number | null; name: string; teamId: number | null; team: string; value: number };
export type SquadPlayer = {
  id: number | null;
  name: string;
  group: "Goalkeepers" | "Defenders" | "Midfielders" | "Forwards" | "Other";
  number: number | null;
  availability: string | null; // "available", "injured", ...
  injury: string | null;
  returns: string | null; // expected return date
};

type Json = Record<string, unknown>;
const isObj = (v: unknown): v is Json => !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown): string => (typeof v === "string" ? v : "");

/** The provider accepts exactly: scorers, assists, yellowcards, redcards, fouls. */
const SLUGS: Record<LeaderStat, string[]> = {
  goals: ["scorers"],
  assists: ["assists"],
  yellow: ["yellowcards"],
  red: ["redcards"],
  fouls: ["fouls"]
};

function rows(data: unknown): unknown[] {
  const direct = rowsOf(data);
  if (direct.length > 0) return direct;
  if (isObj(data)) {
    for (const k of ["data", "leaders", "players", "items"]) if (Array.isArray(data[k])) return data[k] as unknown[];
  }
  return [];
}

function firstNum(...vals: unknown[]): number | null {
  for (const v of vals) {
    const n = num(v);
    if (n !== null) return n;
  }
  return null;
}

export function mapLeader(raw: unknown, index: number): Leader | null {
  if (!isObj(raw)) return null;
  const player = isObj(raw.player) ? raw.player : null;
  const team = isObj(raw.team) ? raw.team : null;
  const name = str(player?.name) || str(raw.player_name) || str(raw.name) || (typeof raw.player === "string" ? raw.player : "");
  if (!name) return null;
  const value = firstNum(raw.value, raw.total, raw.count, raw.goals, raw.assists, raw.yellow_cards, raw.red_cards, raw.stat, raw.score, raw.amount);
  if (value === null) return null;
  return {
    rank: firstNum(raw.rank, raw.position) ?? index + 1,
    playerId: firstNum(player?.id, raw.player_id, raw.id),
    name,
    teamId: firstNum(team?.id, raw.team_id),
    team: str(team?.name) || str(raw.team_name) || (typeof raw.team === "string" ? raw.team : ""),
    value
  };
}

/** Top-20 list for one statistic, or null if the provider does not answer. */
export async function loadLeaders(stat: LeaderStat): Promise<Leader[] | null> {
  for (const slug of SLUGS[stat]) {
    try {
      const data = await bsd<unknown>(`/leagues/1/top/${slug}/`, { revalidate: 600 });
      if (data === null) continue;
      const list = rows(data).map(mapLeader).filter((l): l is Leader => l !== null).slice(0, 20);
      if (list.length > 0) return list;
    } catch {
      // try the next name
    }
  }
  return null;
}

function groupOf(pos: string): SquadPlayer["group"] {
  const p = pos.trim().toLowerCase();
  if (p.startsWith("g")) return "Goalkeepers";
  if (p.startsWith("d")) return "Defenders";
  if (p.startsWith("m")) return "Midfielders";
  if (p.startsWith("f") || p.startsWith("a") || p.startsWith("s")) return "Forwards";
  return "Other";
}

export function mapSquadPlayer(raw: unknown): SquadPlayer | null {
  if (!isObj(raw)) return null;
  const player = isObj(raw.player) ? raw.player : raw;
  const name = str(player.name) || str(player.player_name);
  if (!name) return null;
  return {
    id: firstNum(player.id, raw.player_id),
    name,
    group: groupOf(str(player.position) || str(raw.position)),
    number: firstNum(player.jersey_number, raw.jersey_number, player.shirt_number, raw.number),
    availability: str(player.availability) || null,
    injury: str(player.injury_type) || null,
    returns: str(player.injury_expected_return) || null
  };
}

/** A club's squad, or null if the provider has none. */
export async function loadSquad(teamId: number): Promise<SquadPlayer[] | null> {
  const paths = [`/teams/${teamId}/squad/`, `/players/?team_id=${teamId}&limit=60`, `/players/?team=${teamId}&limit=60`];
  for (const path of paths) {
    try {
      const data = await bsd<unknown>(path, { revalidate: 3600 });
      if (data === null) continue;
      const list = rows(data).map(mapSquadPlayer).filter((p): p is SquadPlayer => p !== null);
      if (list.length > 0) return list;
    } catch {
      // try the next path
    }
  }
  return null;
}
