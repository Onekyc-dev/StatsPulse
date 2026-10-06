import { NextRequest, NextResponse } from "next/server";
import { dbSelect } from "@/lib/supabase";
import { deriveStatus, formatKickoff } from "@/lib/format";
import { slugify } from "@/lib/teamMeta";

type FixtureRow = {
  id: number;
  kickoff: string;
  status: string;
  home_team_id: number;
  away_team_id: number;
  home_score: number | null;
  away_score: number | null;
};
type TeamRow = { id: number; name: string; short: string; color: string };

export async function GET(req: NextRequest) {
  const leagueId = Number(req.nextUrl.searchParams.get("league"));
  if (!leagueId) return NextResponse.json({ error: "league required" }, { status: 400 });

  const dateParam = req.nextUrl.searchParams.get("date");
  const day = dateParam ? new Date(dateParam) : new Date();
  const from = new Date(day);
  from.setHours(0, 0, 0, 0);
  const to = new Date(day);
  to.setHours(23, 59, 59, 999);

  try {
    const rows = await dbSelect<FixtureRow>(
      "fixtures",
      {
        select: "id,kickoff,status,home_team_id,away_team_id,home_score,away_score",
        league_id: `eq.${leagueId}`,
        kickoff: [`gte.${from.toISOString()}`, `lte.${to.toISOString()}`],
        order: "kickoff.asc",
        limit: "100"
      },
      { revalidate: 60 }
    );
    const teamIds = Array.from(new Set(rows.flatMap((f) => [f.home_team_id, f.away_team_id])));
    const teams = teamIds.length
      ? await dbSelect<TeamRow>("teams", { select: "id,name,short,color", id: `in.(${teamIds.join(",")})` }, { revalidate: 60 })
      : [];
    const byId = new Map(teams.map((t) => [t.id, t]));
    const now = new Date();

    const matches = rows.map((f) => {
      const home = byId.get(f.home_team_id);
      const away = byId.get(f.away_team_id);
      const { time } = formatKickoff(f.kickoff);
      return {
        id: f.id,
        slug: `${slugify(home?.name ?? "home")}-v-${slugify(away?.name ?? "away")}-${f.id}`,
        kickoff: f.kickoff,
        time,
        status: deriveStatus(f.status, f.kickoff, now),
        score: f.home_score !== null && f.away_score !== null ? { home: f.home_score, away: f.away_score } : null,
        home: { id: home?.id ?? f.home_team_id, name: home?.name ?? "Home", short: home?.short ?? "???", color: home?.color ?? "#5b6b73" },
        away: { id: away?.id ?? f.away_team_id, name: away?.name ?? "Away", short: away?.short ?? "???", color: away?.color ?? "#5b6b73" }
      };
    });

    return NextResponse.json({ matches });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
