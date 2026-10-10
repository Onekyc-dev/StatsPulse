"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
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

/** The match's calendar day in UK time, as YYYY-MM-DD, for grouping and the calendar grid. */
function londonDateKey(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(new Date(iso));
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_FMT = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "Europe/London" });

function CalendarPopup({
  matchDays,
  selected,
  onPick,
  onClose
}: {
  matchDays: Set<string>;
  selected: string | null;
  onPick: (key: string | null) => void;
  onClose: () => void;
}) {
  const todayKey = londonDateKey(new Date().toISOString());
  const base = selected ?? todayKey;
  const [year, month] = base.split("-").map(Number);
  const [viewYear, setViewYear] = useState(year);
  const [viewMonth, setViewMonth] = useState(month - 1); // 0-indexed

  const viewDate = new Date(Date.UTC(viewYear, viewMonth, 1));
  const firstWeekday = viewDate.getUTCDay();
  const daysInMonth = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate();

  const cells: (string | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push(key);
  }

  const shiftMonth = (delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setViewMonth(m);
    setViewYear(y);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 sm:items-center" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl bg-[#0a1216] p-5 sm:rounded-3xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-extrabold">Calendar</h3>
          <button onClick={onClose} aria-label="Close calendar" className="flex h-9 w-9 items-center justify-center rounded-lg text-white/60 hover:bg-white/[0.06]">
            <X size={19} />
          </button>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <button onClick={() => shiftMonth(-1)} aria-label="Previous month" className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/[0.06]">
            <ChevronLeft size={18} />
          </button>
          <span className="font-display text-[15px] font-bold">{MONTH_FMT.format(viewDate)}</span>
          <button onClick={() => shiftMonth(1)} aria-label="Next month" className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/[0.06]">
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-white/40">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-1">{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((key, i) => {
            if (!key) return <div key={i} />;
            const day = Number(key.split("-")[2]);
            const hasMatches = matchDays.has(key);
            const isToday = key === todayKey;
            const isSelected = key === selected;
            return (
              <button
                key={key}
                onClick={() => {
                  onPick(key);
                  onClose();
                }}
                className={`flex flex-col items-center gap-0.5 rounded-xl py-2 text-[13px] font-semibold ${
                  isSelected ? "bg-pulse-500 text-[#03100c]" : isToday ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/[0.06]"
                }`}
              >
                {day}
                <span className={`h-1 w-1 rounded-full ${hasMatches ? "bg-pulse-400" : "bg-transparent"}`} />
              </button>
            );
          })}
        </div>

        <button
          onClick={() => {
            onPick(todayKey);
            onClose();
          }}
          className="mt-4 w-full rounded-xl bg-pulse-500 py-2.5 text-center text-sm font-bold text-[#03100c]"
        >
          Today
        </button>
      </div>
    </div>
  );
}

export function MatchesBrowser({ matches }: { matches: Match[] }) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [day, setDay] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const byDayKey = useMemo(() => {
    const m = new Map<string, Match[]>();
    for (const match of matches) {
      const key = londonDateKey(match.kickoff);
      const list = m.get(key) ?? [];
      list.push(match);
      m.set(key, list);
    }
    return m;
  }, [matches]);

  const days = useMemo(() => {
    const seen = new Map<string, string>(); // key -> dateLabel
    for (const m of matches) {
      const key = londonDateKey(m.kickoff);
      if (!seen.has(key)) seen.set(key, m.dateLabel);
    }
    return Array.from(seen.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [matches]);

  const matchDaySet = useMemo(() => new Set(byDayKey.keys()), [byDayKey]);

  const dayFiltered = day === null ? matches : byDayKey.get(day) ?? [];
  const shown = dayFiltered.filter((m) => passes(m, filter));

  const groups: { label: string; items: Match[] }[] = [];
  for (const m of shown) {
    const g = groups.find((x) => x.label === m.dateLabel);
    if (g) g.items.push(m);
    else groups.push({ label: m.dateLabel, items: [m] });
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <button
          onClick={() => setCalendarOpen(true)}
          aria-label="Open calendar"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.03] text-white/70 hover:bg-white/[0.06]"
        >
          <CalendarDays size={17} />
        </button>
        {days.length > 1 && (
          <div className="no-scrollbar flex flex-1 gap-2 overflow-x-auto">
            <button
              onClick={() => setDay(null)}
              className={`shrink-0 rounded-xl border px-3.5 py-2 text-[12.5px] font-semibold ${
                day === null ? "border-pulse-500 bg-pulse-500 text-[#03100c]" : "border-white/[0.1] bg-white/[0.03] text-white/65"
              }`}
            >
              All days
            </button>
            {days.map(([key, label]) => (
              <button
                key={key}
                onClick={() => setDay(key)}
                className={`shrink-0 rounded-xl border px-3.5 py-2 text-[12.5px] font-semibold ${
                  day === key ? "border-pulse-500 bg-pulse-500 text-[#03100c]" : "border-white/[0.1] bg-white/[0.03] text-white/65"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

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

      {calendarOpen && (
        <CalendarPopup matchDays={matchDaySet} selected={day} onPick={setDay} onClose={() => setCalendarOpen(false)} />
      )}
    </div>
  );
}
