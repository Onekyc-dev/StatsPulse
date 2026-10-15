"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bell, BellRing } from "lucide-react";
import { Crest } from "@/components/Crest";
import { DateStrip } from "@/components/DateStrip";
import type { Match } from "@/lib/types";

type CountryMatch = Match & {
  country: string;
};

const PRIORITY_LEAGUES = [
  "premier league",
  "la liga",
  "bundesliga",
  "serie a",
  "ligue 1",
];

function getLocalDateKey(value: string): string {
  const date = new Date(value);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getCompetitionPriority(name: string): number {
  const index = PRIORITY_LEAGUES.indexOf(name.trim().toLowerCase());
  return index === -1 ? PRIORITY_LEAGUES.length : index;
}

function getReminderKey(match: Match): string {
  return `statspulse-reminder-${match.id}`;
}

function MatchRow({ match }: { match: CountryMatch }) {
  const [reminderOn, setReminderOn] = useState(false);

  function toggleReminder(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    const nextValue = !reminderOn;
    setReminderOn(nextValue);

    try {
      if (nextValue) {
        localStorage.setItem(getReminderKey(match), "on");
      } else {
        localStorage.removeItem(getReminderKey(match));
      }
    } catch {
      // Keep the button usable if browser storage is unavailable.
    }
  }

  return (
    <div className="border-b border-white/[0.07] last:border-b-0">
      <div className="grid grid-cols-[54px_minmax(0,1fr)_40px] items-center gap-2 py-3">
        <div className="text-center">
          {match.status === "LIVE" ? (
            <span className="text-xs font-extrabold text-loss">LIVE</span>
          ) : match.status === "FT" ? (
            <span className="text-xs font-semibold text-white/45">FT</span>
          ) : (
            <span className="text-sm font-semibold tabular-nums text-white/65">
              {match.time}
            </span>
          )}
        </div>

        <Link
          href={`/match/${match.slug}`}
          className="min-w-0 space-y-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-pulse-500"
          aria-label={`${match.home.name} versus ${match.away.name}, ${match.competition}`}
        >
          <div className="flex min-w-0 items-center gap-2">
            <Crest
              short={match.home.short}
              color={match.home.color}
              size={23}
              teamId={match.home.id}
              name={match.home.name}
            />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">
              {match.home.name}
            </span>
            {match.score && (match.status === "LIVE" || match.status === "FT") && (
              <span className="text-sm font-bold tabular-nums text-white">
                {match.score.home}
              </span>
            )}
          </div>

          <div className="flex min-w-0 items-center gap-2">
            <Crest
              short={match.away.short}
              color={match.away.color}
              size={23}
              teamId={match.away.id}
              name={match.away.name}
            />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">
              {match.away.name}
            </span>
            {match.score && (match.status === "LIVE" || match.status === "FT") && (
              <span className="text-sm font-bold tabular-nums text-white">
                {match.score.away}
              </span>
            )}
          </div>
        </Link>

        <button
          type="button"
          onClick={toggleReminder}
          aria-pressed={reminderOn}
          aria-label={
            reminderOn
              ? `Turn off reminder for ${match.home.name} versus ${match.away.name}`
              : `Save reminder for ${match.home.name} versus ${match.away.name}`
          }
          title={
            reminderOn
              ? "Reminder saved on this device"
              : "Save match reminder"
          }
          className={[
            "flex h-10 w-10 items-center justify-center rounded-full",
            "border transition-colors focus-visible:outline-none",
            "focus-visible:ring-2 focus-visible:ring-pulse-500",
            reminderOn
              ? "border-pulse-500/50 bg-pulse-500/10 text-pulse-500"
              : "border-white/[0.08] text-white/55 hover:border-pulse-500/40 hover:text-pulse-500",
          ].join(" ")}
        >
          {reminderOn ? <BellRing size={19} /> : <Bell size={19} />}
        </button>
      </div>
    </div>
  );
}

type HomeMatchBrowserProps = {
  matches: CountryMatch[];
  selectedDate: string;
  onDateChange: (date: string) => void;
};

export function HomeMatchBrowser({
  matches,
  selectedDate,
  onDateChange,
}: HomeMatchBrowserProps) {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  
  const selectedMatches = useMemo(() => {
    return matches.filter(
      (match) => getLocalDateKey(match.kickoff) === selectedDate
    );
  }, [matches, selectedDate]);

  const visibleCompetitions = useMemo(() => {
    const competitionMap = new Map<string, CountryMatch[]>();

    for (const match of selectedMatches) {
      const key = match.competition;
      const existing = competitionMap.get(key) ?? [];
      existing.push(match);
      competitionMap.set(key, existing);
    }

    const competitions = Array.from(competitionMap.entries()).sort(
      ([nameA, matchesA], [nameB, matchesB]) => {
        const priorityDifference =
          getCompetitionPriority(nameA) - getCompetitionPriority(nameB);

        if (priorityDifference !== 0) {
          return priorityDifference;
        }

        const countryA = matchesA[0]?.country ?? "";
        const countryB = matchesB[0]?.country ?? "";

        return countryA.localeCompare(countryB) || nameA.localeCompare(nameB);
      }
    );

    const priorityPlaying = competitions.filter(
      ([name]) => getCompetitionPriority(name) < PRIORITY_LEAGUES.length
    );

    const fallback = competitions.filter(
      ([name]) => getCompetitionPriority(name) >= PRIORITY_LEAGUES.length
    );

    return [...priorityPlaying, ...fallback].slice(0, 5);
  }, [selectedMatches]);

  const groupedByCountry = useMemo(() => {
    const countries = new Map<
      string,
      { competition: string; matches: CountryMatch[] }[]
    >();

    for (const [competition, competitionMatches] of visibleCompetitions) {
      const country = competitionMatches[0]?.country || "Other competitions";
      const groups = countries.get(country) ?? [];
      groups.push({ competition, matches: competitionMatches });
      countries.set(country, groups);
    }

    return Array.from(countries.entries()).map(([country, groups]) => ({
      country,
      groups,
      count: groups.reduce(
        (total, group) => total + group.matches.length,
        0
      ),
    }));
  }, [visibleCompetitions]);

  return (
    <section className="min-w-0 space-y-4">
      <DateStrip
        selectedDate={selectedDate}
        onDateChange={onDateChange}
      />

      {groupedByCountry.length === 0 ? (
        <div className="border-y border-white/[0.08] px-4 py-8 text-center">
          <p className="font-semibold text-white">No matches on this date</p>
          <p className="mt-1 text-sm text-white/50">
            Choose another date to see available fixtures.
          </p>
        </div>
      ) : (
        groupedByCountry.map(({ country, groups, count }) => (
          <section key={country} className="min-w-0">
            <div className="flex items-center justify-between border-b border-white/[0.1] pb-2">
              <h2 className="font-display text-base font-extrabold text-white">
                {country}
              </h2>
              <span className="text-sm font-bold text-pulse-500">{count}</span>
            </div>

            {groups.map(({ competition, matches: competitionMatches }) => (
              <div key={competition} className="mt-2">
                <div className="flex items-center gap-2 py-2">
                  <span
                    className="h-4 w-1 rounded-full bg-pulse-500"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 truncate text-xs font-semibold text-white/55">
                    {competition}
                  </span>
                  <span className="text-xs text-white/35">
                    {competitionMatches.length}
                  </span>
                </div>

                <div>
                  {competitionMatches
                    .slice()
                    .sort((a, b) => a.kickoff.localeCompare(b.kickoff))
                    .map((match) => (
                      <MatchRow
                        key={`${match.competition}-${match.id}`}
                        match={match}
                      />
                    ))}
                </div>
              </div>
            ))}
          </section>
        ))
      )}

      <p className="text-[11px] text-white/35">
        Match reminders are saved on this device. Push notifications still
        need to be connected before alerts can be delivered automatically.
      </p>
    </section>
  );
}

export default HomeMatchBrowser;
