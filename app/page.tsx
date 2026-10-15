
import { Shield, ShieldAlert, Sparkles } from "lucide-react";
import { DataNotice } from "@/components/DataNotice";
import { LeaguesHub } from "@/components/LeaguesHub";
import { HomeMatchBrowser } from "@/components/HomeMatchBrowser";
import { loadMatches } from "@/lib/db";
import { loadEnabledLeagues } from "@/lib/leagues";

export const revalidate = 60;

const pillars = [
  {
    icon: ShieldAlert,
    title: "Squad and absences",
    text: "Who is unavailable, straight from the data, for every match.",
  },
  {
    icon: Shield,
    title: "Team stability",
    text: "A transparent score for how settled each side is, coming as lineup history builds.",
  },
  {
    icon: Sparkles,
    title: "Match outlook",
    text: "Probabilities from our own model, stored and locked at kickoff.",
  },
];

export default async function HomePage() {
  const leagues = await loadEnabledLeagues();

  const leagueResults = await Promise.all(
    leagues.map(async (league) => ({
      league,
      result: await loadMatches(3, 30, league.id, league.name),
    }))
  );

  const matches = leagueResults.flatMap(({ league, result }) =>
    result.matches.map((match) => ({
      ...match,
      country: league.country,
    }))
  );

  const error =
    leagueResults.find(({ result }) => result.error)?.result.error ?? null;

  return (
    <div className="mx-auto max-w-6xl space-y-9 px-4 py-6 sm:px-6 lg:px-8">
      <HomeMatchBrowser matches={matches} />

      {matches.length === 0 && <DataNotice error={error} />}

      {leagues.length > 0 && <LeaguesHub leagues={leagues} />}

      <section>
        <h2 className="section-title mb-3">
          What sits under every match
        </h2>

        <div className="grid gap-3 md:grid-cols-3">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;

            return (
              <div key={pillar.title} className="panel p-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pulse-500/10 text-pulse-500">
                  <Icon size={18} />
                </span>

                <div className="mt-3 font-display text-[15px] font-bold">
                  {pillar.title}
                </div>

                <p className="mt-1 text-[13px] leading-relaxed text-white/55">
                  {pillar.text}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
