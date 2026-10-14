
"use client";

import { useMemo, useState } from "react";
import { DateStrip } from "@/components/DateStrip";
import { FixtureCard } from "@/components/FixtureCard";
import type { Match } from "@/lib/types";

type CountryMatch = Match & {
  country: string;
};

function getMatchDateKey(kickoff: string): string {
  const date = new Date(kickoff);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function HomeMatchBrowser({
  matches,
}: {
  matches: CountryMatch[];
}) {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  });

  const groupedMatches = useMemo(() => {
    const selectedMatches = matches
      .filter((match) => getMatchDateKey(match.kickoff) === selectedDate)
      .sort((a, b) => a.kickoff.localeCompare(b.kickoff));

    const groups = new Map<string, CountryMatch[]>();

    for (const match of selectedMatches) {
      const country = match.country || "Other competitions";
      const group = groups.get(country) ?? [];
      group.push(match);
      groups.set(country, group);
    }

    return Array.from(groups.entries());
  }, [matches, selectedDate]);

  return (
    <section className="space-y-5">
      <DateStrip
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />

      {groupedMatches.length === 0 ? (
        <div className="rounded-xl border border-white/[0.08] px-4 py-8 text-center">
          <p className="font-semibold text-white">
            No matches on this date
          </p>
          <p className="mt-1 text-sm text-white/50">
            Select another date to see scheduled matches and results.
          </p>
        </div>
      ) : (
        groupedMatches.map(([country, countryMatches]) => (
          <div key={country} className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
              <h2 className="font-display text-sm font-extrabold text-white">
                {country}
              </h2>
              <span className="text-xs font-bold text-pulse-500">
                {countryMatches.length}
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {countryMatches.map((match) => (
                <FixtureCard
                  key={`${match.competition}-${match.id}`}
                  match={match}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </section>
  );
}

export default HomeMatchBrowser;
