import type { Metadata } from "next";
import { Leaderboards } from "@/components/Leaderboards";
import { LeagueBadge } from "@/components/LeagueBadge";
import { LeagueNav } from "@/components/LeagueNav";
import { loadLeague } from "@/lib/league";
import { loadLeaders, type Leader, type LeaderStat } from "@/lib/leaders";

export const metadata: Metadata = { title: "Top players" };
export const revalidate = 600;

export default async function PlayersPage() {
  const [data, goals, assists, yellow, red, fouls] = await Promise.all([
    loadLeague(),
    loadLeaders("goals"),
    loadLeaders("assists"),
    loadLeaders("yellow"),
    loadLeaders("red"),
    loadLeaders("fouls")
  ]);
  const lists: Record<LeaderStat, Leader[] | null> = { goals, assists, yellow, red, fouls };
  const teamColors = Object.fromEntries([...data.teams].map(([id, t]) => [id, { short: t.short, color: t.color }]));

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="flex items-center gap-3 font-display text-3xl font-extrabold tracking-tight">
        <LeagueBadge size={34} />
        Top players
      </h1>
      <p className="mt-1 text-sm text-white/55">Season leaders in the Premier League.</p>
      <div className="mt-5">
        <LeagueNav active="players" />
      </div>
      <div className="mt-5">
        <Leaderboards lists={lists} teamColors={teamColors} />
      </div>
      <p className="mt-3 text-[11.5px] leading-relaxed text-white/35">Player photos are shown only to identify players. Leaderboards come from the data provider and refresh every few minutes.</p>
    </div>
  );
}
