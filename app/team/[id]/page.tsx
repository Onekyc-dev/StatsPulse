import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Crest } from "@/components/Crest";
import { DataNotice } from "@/components/DataNotice";
import { FormPills } from "@/components/FormPills";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { withAlpha } from "@/lib/color";
import { loadEnabledLeagues, PREMIER_LEAGUE_ID } from "@/lib/leagues";
import { loadLeague, matchPath, shortDate } from "@/lib/league";
import { loadSquad, type SquadPlayer } from "@/lib/leaders";
import { attackRating, defenceRating } from "@/lib/model";
import { dbSelect } from "@/lib/supabase";
import { buildTable, resultsFor, seasonList, teamsInSeason, upcomingFor, type Row } from "@/lib/standings";

export const revalidate = 60;

type Props = { params: Promise<{ id: string }> };

const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
};

/**
 * A team's page URL (/team/541) carries no league. Before anything else can load, we have to find
 * out which league this team actually plays in, by checking which league its fixtures are stored
 * under. Falls back to the Premier League if the team has no stored fixtures at all.
 */
async function findTeamLeague(teamId: number): Promise<number> {
  try {
    const rows = await dbSelect<{ league_id: number }>(
      "fixtures",
      { select: "league_id", or: `(home_team_id.eq.${teamId},away_team_id.eq.${teamId})`, limit: "1" },
      { revalidate: 300 }
    );
    return rows[0]?.league_id ?? PREMIER_LEAGUE_ID;
  } catch {
    return PREMIER_LEAGUE_ID;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const teamId = Number(id);
  const leagueId = await findTeamLeague(teamId);
  const data = await loadLeague(leagueId);
  const t = data.teams.get(teamId);
  return { title: t ? t.name : "Club" };
}

const GROUPS: SquadPlayer["group"][] = ["Goalkeepers", "Defenders", "Midfielders", "Forwards", "Other"];

function RecordRow({ label, r }: { label: string; r: Row | undefined }) {
  if (!r) return null;
  return (
    <tr className="border-t border-white/[0.05] text-center">
      <td className="py-2.5 pl-4 text-left text-white/60">{label}</td>
      <td className="px-1.5">{r.played}</td>
      <td className="px-1.5">{r.won}</td>
      <td className="px-1.5">{r.drawn}</td>
      <td className="px-1.5">{r.lost}</td>
      <td className="hidden px-1.5 sm:table-cell">{r.gf}</td>
      <td className="hidden px-1.5 sm:table-cell">{r.ga}</td>
      <td className="px-1.5">{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
      <td className="px-2 pr-4 font-display font-extrabold">{r.points}</td>
    </tr>
  );
}

export default async function TeamPage({ params }: Props) {
  const { id } = await params;
  const teamId = Number(id);
  if (!Number.isInteger(teamId)) notFound();

  const [leagueId, enabledLeagues] = await Promise.all([findTeamLeague(teamId), loadEnabledLeagues()]);
  const league = enabledLeagues.find((l) => l.id === leagueId) ?? enabledLeagues.find((l) => l.id === PREMIER_LEAGUE_ID) ?? enabledLeagues[0];

  const data = await loadLeague(leagueId);
                {ordinal(pos)} in the {season.label} {league?.name ?? "league"}, {overall?.points ?? 0} points
              </p>
              {overall && overall.form.length > 0 && (
                <div className="mt-3">
                  <FormPills form={overall.form} />
                </div>
              )}
            </div>
          </div>
          {!isCurrent && <p className="mt-4 text-[12px] text-draw">Not in this season&apos;s {league?.name ?? "league"}. Showing {season.label}.</p>}
            <p className="col-span-2 text-[11.5px] leading-relaxed text-white/40">Model ratings out of 10, where 5 is an average club in this league. They come from results, with recent matches counting more.</p>
