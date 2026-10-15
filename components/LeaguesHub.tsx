"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Crest } from "@/components/Crest";
import { LeagueBadge } from "@/components/LeagueBadge";
import { flagFor } from "@/lib/countries";
import type { League } from "@/lib/leagues";

type DayMatch = {
id: number;
slug: string;
time: string;
status: string;
score: {
home: number;
away: number;
} | null;
home: {
id: number;
name: string;
short: string;
color: string;
};
away: {
id: number;
name: string;
short: string;
color: string;
};
};

type LeagueMatchData = Record<
number,
DayMatch[] | "loading" | "error"

>;

type LeaguesHubProps = {
leagues: League[];
selectedDate: string;
};

export function LeaguesHub({
  leagues,
  selectedDate = new Date().toLocaleDateString("en-CA"),
}: LeaguesHubProps) {
const [openCountry, setOpenCountry] = useState<string | null>(null);

const [data, setData] = useState<LeagueMatchData>({});

useEffect(() => {
setData({});
}, [selectedDate]);

const byCountry = new Map<string, League[]>();

for (const league of leagues) {
const countryLeagues = byCountry.get(league.country) ?? [];

countryLeagues.push(league);
byCountry.set(league.country, countryLeagues);

}

const countries = Array.from(byCountry.entries())
.map(([country, countryLeagues]) => [
country,
countryLeagues.sort((a, b) => a.tier - b.tier),
] as const)
.sort(
(a, b) =>
b[1].length - a[1].length ||
a[0].localeCompare(b[0])
);

async function openCountryRow(
country: string,
countryLeagues: readonly League[]
) {
if (openCountry === country) {
setOpenCountry(null);
return;
}

setOpenCountry(country);

const leaguesToLoad = countryLeagues.filter(
  (league) => !data[league.id]
);

for (const league of leaguesToLoad) {
  setData((current) => ({
    ...current,
    [league.id]: "loading",
  }));

  try {
    const params = new URLSearchParams({
      league: String(league.id),
      date: selectedDate,
    });

    const response = await fetch(
      `/api/league-day?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error("Failed to load matches");
    }

    const result = await response.json();

    setData((current) => ({
      ...current,
      [league.id]: Array.isArray(result.matches)
        ? result.matches
        : "error",
    }));
  } catch {
    setData((current) => ({
      ...current,
      [league.id]: "error",
    }));
  }
}

}

return (
<section>
<h2 className="section-title mb-3">Leagues</h2>

  <div className="flex flex-col gap-2">
    {countries.map(([country, countryLeagues]) => {
      const isOpen = openCountry === country;

      const matchCount = countryLeagues.reduce(
        (total, league) => {
          const matches = data[league.id];

          return (
            total +
            (Array.isArray(matches) ? matches.length : 0)
          );
        },
        0
      );

      return (
        <div
          key={country}
          className="panel overflow-hidden"
        >
          <button
            type="button"
            onClick={() =>
              openCountryRow(country, countryLeagues)
            }
            className="flex w-full items-center gap-3 p-3.5 text-left"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-lg">
              {flagFor(country)}
            </span>

            <span className="flex-1 font-display text-[15px] font-bold">
              {country}
            </span>

            <span className="text-[12px] text-white/40">
              {matchCount}
            </span>

            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className={`shrink-0 text-white/40 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {isOpen && (
            <div className="flex flex-col border-t border-white/[0.06]">
              {countryLeagues.map((league) => {
                const matches = data[league.id];

                return (
                  <div
                    key={league.id}
                    className="border-b border-white/[0.04] px-3.5 py-3 last:border-b-0"
                  >
                    <Link
                      href={`/table?league=${league.id}`}
                      className="mb-2 flex items-center gap-2.5"
                    >
                      <LeagueBadge
                        id={league.id}
                        size={20}
                        name={league.name}
                      />

                      <span className="text-[13.5px] font-bold text-white/90 hover:text-pulse-400">
                        {league.name}
                      </span>
                    </Link>

                    {matches === "loading" && (
                      <p className="pl-5 text-[12px] text-white/35">
                        Loading matches…
                      </p>
                    )}

                    {matches === "error" && (
                      <p className="pl-5 text-[12px] text-white/35">
                        Couldn&apos;t load matches.
                      </p>
                    )}

                    {Array.isArray(matches) &&
                      matches.length === 0 && (
                        <p className="pl-5 text-[12px] text-white/35">
                          No matches on this date.
                        </p>
                      )}

                    {Array.isArray(matches) &&
                      matches.length > 0 && (
                        <div className="flex flex-col gap-1.5 pl-1">
                          {matches.map((match) => (
                            <Link
                              key={match.id}
                              href={`/match/${match.slug}`}
                              className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-white/[0.05]"
                            >
                              <span className="w-11 shrink-0 text-[11px] text-white/45">
                                {match.score
                                  ? match.status
                                  : match.time}
                              </span>

                              <span className="flex flex-1 items-center gap-1.5 text-[12.5px] font-semibold text-white/85">
                                <Crest
                                  short={match.home.short}
                                  color={match.home.color}
                                  size={18}
                                  teamId={match.home.id}
                                  name={match.home.name}
                                />

                                {match.home.short}

                                <span className="text-white/30">
                                  v
                                </span>

                                <Crest
                                  short={match.away.short}
                                  color={match.away.color}
                                  size={18}
                                  teamId={match.away.id}
                                  name={match.away.name}
                                />

                                {match.away.short}
                              </span>

                              {match.score && (
                                <span className="tnum shrink-0 text-[12.5px] font-bold">
                                  {match.score.home}-
                                  {match.score.away}
                                </span>
                              )}
                            </Link>
                          ))}
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    })}
  </div>
</section>

);
}
