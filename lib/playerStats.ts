import { bsd } from "./bsd";
import { loadSquad } from "./leaders";
import { aggregateMatches } from "./players";
import { groupOf, type PeerRow } from "./peers";
import { dbSelect, dbSelectAll, dbUpsert } from "./supabase";

const LEAGUE_ID = 1;

/** The season of the most recent finished Premier League match. */
export async function currentSeasonId(cacheSeconds?: number): Promise<number | null> {
  try {
    const rows = await dbSelect<{ season_id: number | null }>(
      "fixtures",
      { select: "season_id", league_id: `eq.${LEAGUE_ID}`, status: "eq.finished", order: "kickoff.desc", limit: "1" },
      cacheSeconds === undefined ? {} : { revalidate: cacheSeconds }
    );
    return rows[0]?.season_id ?? null;
  } catch {
    return null;
  }
}

type Stored = { player_id: number; position: string | null; minutes: number; per90: Record<string, number> | null };

/** Every player with collected statistics this season, for comparisons. */
export async function loadPeers(seasonId: number): Promise<PeerRow[]> {
  try {
    const rows = await dbSelectAll<Stored>(
      "player_season",
      { select: "player_id,position,minutes,per90", season_id: `eq.${seasonId}`, stats_at: "not.is.null", order: "player_id.asc" },
      { revalidate: 300 }
    );
    const out: PeerRow[] = [];
    for (const r of rows) {
      const group = groupOf(r.position ?? "");
      if (group && r.per90) out.push({ playerId: r.player_id, group, minutes: Number(r.minutes), per90: r.per90 });
    }
    return out;
  } catch {
    return [];
  }
}

const LETTER: Record<string, string> = { Goalkeepers: "G", Defenders: "D", Midfielders: "M", Forwards: "F", Other: "" };

async function pool<T>(items: T[], size: number, fn: (item: T) => Promise<void>): Promise<void> {
  for (let i = 0; i < items.length; i += size) await Promise.all(items.slice(i, i + size).map(fn));
}

/**
 * Collects the squads of every club, then each player's season statistics, a few at a time.
 * Runs in small batches (it is called every few minutes when no match is on) and stops at the deadline.
 */
export async function refreshPlayerStats(seasonId: number, limit: number, deadline: number, log: string[]): Promise<void> {
  const now = new Date().toISOString();

  // 1. Squads for clubs we have not collected yet.
  const fx = await dbSelect<{ home_team_id: number; away_team_id: number }>("fixtures", {
    select: "home_team_id,away_team_id", season_id: `eq.${seasonId}`, limit: "1000"
  });
  const teamIds = [...new Set(fx.flatMap((f) => [f.home_team_id, f.away_team_id]))];
  const have = await dbSelect<{ team_id: number | null }>("player_season", { select: "team_id", season_id: `eq.${seasonId}`, limit: "3000" });
  const haveTeams = new Set(have.map((h) => h.team_id));
  let rosterAdded = 0;
  for (const teamId of teamIds.filter((t) => !haveTeams.has(t)).slice(0, 4)) {
    if (Date.now() > deadline) break;
    const squad = await loadSquad(teamId);
    if (!squad) continue;
    const rows = squad
      .filter((p) => p.id !== null)
      .map((p) => ({ player_id: p.id as number, season_id: seasonId, team_id: teamId, name: p.name, position: LETTER[p.group] ?? "", updated_at: now }));
    if (rows.length > 0) {
      await dbUpsert("player_season", rows, "player_id");
      rosterAdded += rows.length;
    }
  }

  // 2. Statistics for players never collected, or older than a day.
  const cutoff = new Date(Date.now() - 24 * 3600000).toISOString();
  const due = await dbSelect<{ player_id: number; team_id: number | null; name: string; position: string | null }>("player_season", {
    select: "player_id,team_id,name,position",
    season_id: `eq.${seasonId}`,
    or: `(stats_at.is.null,stats_at.lt.${cutoff})`,
    order: "stats_at.asc.nullsfirst",
    limit: String(limit)
  });
  const done: object[] = [];
  await pool(due, 5, async (p) => {
    if (Date.now() > deadline) return;
    try {
      const data = await bsd<unknown>(`/players/${p.player_id}/stats/?season_id=${seasonId}&limit=200`);
      const agg = aggregateMatches(data ?? []);
      done.push({
        player_id: p.player_id, season_id: seasonId, team_id: p.team_id, name: p.name, position: p.position,
        minutes: Math.round(agg.minutes), matches: agg.matches, per90: agg.per90, stats_at: new Date().toISOString(), updated_at: now
      });
    } catch {
      // skip this player, try again next run
    }
  });
  if (done.length > 0) await dbUpsert("player_season", done, "player_id");
  log.push(`players: ${rosterAdded} squad places added, ${done.length} of ${due.length} due players updated`);
}
