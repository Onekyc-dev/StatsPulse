"use client";

import { useMemo, useState } from "react";
import { FixtureCard } from "./FixtureCard";
import type { Match } from "@/lib/types";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "finished", label: "Finished" }
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

function passes(m: Match, f: FilterKey): boolean {
  if (f === "all") return true;
  if (f === "today") return m.status === "TODAY" || m.status === "LIVE";
  if (f === "upcoming") return m.status === "UPCOMING" || m.status === "TODAY";
  return m.status === "FT";
}

export function MatchesBrowser({ matches }: { matches: Match[] }) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [day, setDay] = useState<string | null>(null);

  const days = useMemo(() => {
    const seen = new Map<string, string>();
    for (const m of matches) {
      if (!seen.has(m.dateLabel)) seen.set(m.dateLabel, m.kickoff);
    }
    return Array.from(seen.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([label]) => label);
  }, [matches]);

  const shown = matches.filter((m) => passes(m, filter) && (day === null || m.dateLabel === day));

  const groups: { label: string; items: Match[] }[] = [];
  for (const m of shown) {
    const g = groups.find((x) => x.label === m.dateLabel);
    if (g) g.items.push(m);
    else groups.push({ label: m.dateLabel, items: [m] });
  }

  return (
    <div>
      {days.length > 1 && (
        <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setDay(null)}
            className={`shrink-0 rounded-xl border px-3.5 py-2 text-[12.5px] font-semibold ${
              day === null ? "border-pulse-500 bg-pulse-500 text-[#03100c]" : "border-white/[0.1] bg-white/[0.03] text-white/65"
            }`}
          >
            All days
          </button>
          {days.map((d) => (
            <button
              key={d}
              onClick={() => setDay(d)}
              className={`shrink-0 rounded-xl border px-3.5 py-2 text-[12.5px] font-semibold ${
                day === d ? "border-pulse-500 bg-pulse-500 text-[#03100c]" : "border-white/[0.1] bg-white/[0.03] text-white/65"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      )}

      <div role="group" aria-label="Filter matches" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              filter === f.key
                ? "border-pulse-500 bg-pulse-500 text-[#03100c]"
                : "border-white/[0.1] bg-white/[0.03] text-white/65 hover:text-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {groups.length === 0 ? (
        <div className="card mt-6 px-6 py-10 text-center text-sm text-white/55">No matches here.</div>
      ) : (
        <div className="mt-6 flex flex-col gap-7">
          {groups.map((g) => (
            <section key={g.label}>
              <h2 className="mb-3 text-sm font-semibold text-white/60">{g.label}</h2>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {g.items.map((m) => (
                  <FixtureCard key={m.id} match={m} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
