import { dbSelect, dbSelectAll } from "./supabase";
import { fitStrengths, type Strengths } from "./model";
import { slugify } from "./teamMeta";
import type { Fx } from "./standings";

export type TeamRow = { id: number; name: string; short: string; color: string };

const LEAGUE_ID = 1;
const HISTORY_FROM = "2022-08-01T00:00:00Z";
const CACHE = 60;

export type LeagueData = {
  fixtures: Fx[];
  teams: Map<number, TeamRow>;
  strengths: Strengths;
  error: string | null;
};

/** Every stored Premier League fixture since 2022, the clubs, and the model's team strengths. */
export async function loadLeague(): Promise<LeagueData> {
  try {
    const [fixtures, teams] = await Promise.all([
      dbSelectAll<Fx>(
        "fixtures",
        {
          select: "id,season_id,kickoff,status,home_team_id,away_team_id,home_score,away_score",
          league_id: `eq.${LEAGUE_ID}`,
          kickoff: `gte.${HISTORY_FROM}`,
          order: "kickoff.asc,id.asc"
        },
        { revalidate: CACHE }
      ),
      dbSelect<TeamRow>("teams", { select: "id,name,short,color", limit: "500" }, { revalidate: CACHE })
    ]);
    const hist = fixtures
      .filter((f) => f.status === "finished" && f.home_score !== null && f.away_score !== null)
      .map((f) => ({ homeId: f.home_team_id, awayId: f.away_team_id, homeGoals: f.home_score as number, awayGoals: f.away_score as number, date: f.kickoff }));
    return { fixtures, teams: new Map(teams.map((t) => [t.id, t])), strengths: fitStrengths(hist, new Date()), error: null };
  } catch (e) {
    return { fixtures: [], teams: new Map(), strengths: fitStrengths([], new Date()), error: e instanceof Error ? e.message : String(e) };
  }
}

export function matchPath(fx: { id: number; home_team_id: number; away_team_id: number }, teams: Map<number, TeamRow>): string {
  const h = teams.get(fx.home_team_id)?.name ?? "home";
  const a = teams.get(fx.away_team_id)?.name ?? "away";
  return `/match/${slugify(h)}-v-${slugify(a)}-${fx.id}`;
}

const DAY_FMT = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", weekday: "short", day: "numeric", month: "short" });
export const shortDate = (iso: string): string => DAY_FMT.format(new Date(iso));

/** One club's name, code and colour. */
export async function loadTeam(id: number): Promise<TeamRow | null> {
  try {
    const rows = await dbSelect<TeamRow>("teams", { select: "id,name,short,color", id: `eq.${id}`, limit: "1" }, { revalidate: 300 });
    return rows[0] ?? null;
  } catch {
    return null;
  }
}
