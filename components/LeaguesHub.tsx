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
selectedDate,
}: LeaguesHubProps) {
const [openCountry, setOpenCountry] = useState<string | null>(null);
const [data, setData] = useState<LeagueMatchData>({});

useEffect(() => {
let cancelled = false;

setData({});

async function loadAllLeagueMatches() {
  const results = await Promise.all(
    leagues.map(async (league) => {
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

        return {
          id: league.id,
          matches: Array.isArray(result.matches)
            ? (result.matches as DayMatch[])
            : null,
        };
      } catch {
        return {
          id: league.id,
          matches: null,
        };
      }
    })
  );

  if (cancelled) return;

  const nextData: LeagueMatchData = {};

  for (const result of results) {
    nextData[result.id] = result.matches ?? "error";
  }

  setData(nextData);
}

void loadAllLeagueMatches();

return () => {
  cancelled = true;
};

}, [leagues, selectedDate]);

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

function toggleCountry(country: string) {
setOpenCountry((current) =>
current === country ? null : country
);
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
          return total + (Array.isArray(matches) ? matches.length : 0);
        },
        0
      );

      const isLoading = countryLeagues.some(
        (league) =>
          data[league.id] === undefined ||
          data[league.id] === "loading"
      );

      const hasError = countryLeagues.some(
        (league) => data[league.id] === "error"
      );

      // Hide countries only after all their leagues loaded
      // successfully and confirmed there are no fixtures.
      const allLoaded =
        !isLoading &&
        !hasError;

      if (allLoaded && matchCount === 0) {
        return null;
      }

      return (
        <div key={country} className="panel overflow-hidden">
          <button
            type="button"
            onClick={() => toggleCountry(country)}
            className="flex w-full items-center gap-3 p-3.5 text-left"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-lg">
              {flagFor(country)}
            </span>

            <span className="flex-1 font-display text-[15px] font-bold">
              {country}
            </span>

            <span className="text-[12px] text-white/40">
              {isLoading ? "…" : hasError ? "—" : matchCount}
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

                    {matches === undefined ||
                      matches === "loading" ? (
                      <p className="pl-5 text-[12px] text-white/35">
                        Loading matches…
                      </p>
                    ) : matches === "error" ? (
                      <p className="pl-5 text-[12px] text-white/35">
                        Couldn&apos;t load matches.
                      </p>
                    ) : matches.length === 0 ? (
                      <p className="pl-5 text-[12px] text-white/35">
                        No matches on this date.
                      </p>
                    ) : (
                      
<div className="grid gap-3">
  {matches.map((match) => (
    <Link
      key={match.id}
      href={`/match/${match.slug}`}
      className="card block overflow-hidden p-4 transition-colors hover:border-pulse-500/40 active:bg-ink-700"
    >
      <div className="flex items-center justify-between text-[11px] text-white/45">
        <span>
          {match.status === "LIVE"
            ? "Live"
            : match.score && match.status === "FT"
              ? "Full time"
              : match.score
                ? match.status
                : match.time}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="flex min-w-0 flex-col items-center gap-2 text-center">
          <Crest
            short={match.home.short}
            color={match.home.color}
            size={46}
            teamId={match.home.id}
            name={match.home.name}
          />
          <div className="w-full truncate text-[13px] font-semibold leading-tight">
            {match.home.name}
          </div>
        </div>

        <div className="px-2 text-center">
          <div className="font-display text-[26px] font-extrabold leading-none tnum">
            {match.score
              ? `${match.score.home}–${match.score.away}`
              : match.time}
          </div>
        </div>

        <div className="flex min-w-0 flex-col items-center gap-2 text-center">
          <Crest
            short={match.away.short}
            color={match.away.color}
            size={46}
            teamId={match.away.id}
            name={match.away.name}
          />
          <div className="w-full truncate text-[13px] font-semibold leading-tight">
            {match.away.name}
          </div>
        </div>
      </div>
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
