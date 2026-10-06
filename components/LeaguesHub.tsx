"use client";

import { useState } from "react";
import Link from "next/link";
import { Crest } from "@/components/Crest";
import { flagFor } from "@/lib/countries";
import type { League } from "@/lib/leagues";

type DayMatch = {
  id: number;
  slug: string;
  time: string;
  status: string;
  score: { home: number; away: number } | null;
  home: { id: number; name: string; short: string; color: string };
  away: { id: number; name: string; short: string; color: string };
};

export function LeaguesHub({ leagues }: { leagues: League[] }) {
  const [openCountry, setOpenCountry] = useState<string | null>(null);
  const [data, setData] = useState<Record<number, DayMatch[] | "loading" | "error">>({});

  const byCountry = new Map<string, League[]>();
  for (const l of leagues) {
    const list = byCountry.get(l.country) ?? [];
    list.push(l);
    byCountry.set(l.country, list);
  }
  const countries = Array.from(byCountry.entries())
    .map(([country, ls]) => [country, ls.sort((a, b) => a.tier - b.tier)] as const)
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));

  async function openCountryRow(country: string, ls: readonly League[]) {
    if (openCountry === country) {
      setOpenCountry(null);
      return;
    }
    setOpenCountry(country);
    for (const l of ls) {
      if (data[l.id]) continue;
      setData((d) => ({ ...d, [l.id]: "loading" }));
      try {
        const res = await fetch(`/api/league-day?league=${l.id}`);
        const json = await res.json();
        setData((d) => ({ ...d, [l.id]: res.ok ? json.matches : "error" }));
      } catch {
        setData((d) => ({ ...d, [l.id]: "error" }));
      }
    }
  }

  return (
    <section>
      <h2 className="section-title mb-3">Leagues</h2>
      <div className="flex flex-col gap-2">
        {countries.map(([country, ls]) => {
          const isOpen = openCountry === country;
          return (
            <div key={country} className="panel overflow-hidden">
              <button
                type="button"
                onClick={() => openCountryRow(country, ls)}
                className="flex w-full items-center gap-3 p-3.5 text-left"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-lg">
                  {flagFor(country)}
                </span>
                <span className="flex-1 font-display text-[15px] font-bold">{country}</span>
                <span className="text-[12px] text-white/40">{ls.length}</span>
                <svg
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  className={`shrink-0 text-white/40 transition-transform ${isOpen ? "rotate-180" : ""}`}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {isOpen && (
                <div className="flex flex-col border-t border-white/[0.06]">
                  {ls.map((l) => {
                    const matches = data[l.id];
                    return (
                      <div key={l.id} className="border-b border-white/[0.04] px-3.5 py-3 last:border-b-0">
                        <Link href={`/table?league=${l.id}`} className="mb-2 flex items-center gap-2.5">
                          <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: l.color }} />
                          <span className="text-[13.5px] font-bold text-white/90 hover:text-pulse-400">{l.name}</span>
                        </Link>

                        {matches === "loading" && <p className="pl-5 text-[12px] text-white/35">Loading matches…</p>}
                        {matches === "error" && <p className="pl-5 text-[12px] text-white/35">Couldn't load matches.</p>}
                        {Array.isArray(matches) && matches.length === 0 && (
                          <p className="pl-5 text-[12px] text-white/35">No matches today.</p>
                        )}
                        {Array.isArray(matches) && matches.length > 0 && (
                          <div className="flex flex-col gap-1.5 pl-1">
                            {matches.map((m) => (
                              <Link
                                key={m.id}
                                href={`/match/${m.slug}`}
                                className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-white/[0.05]"
                              >
                                <span className="w-11 shrink-0 text-[11px] text-white/45">{m.score ? m.status : m.time}</span>
                                <span className="flex flex-1 items-center gap-1.5 text-[12.5px] font-semibold text-white/85">
                                  <Crest short={m.home.short} color={m.home.color} size={18} teamId={m.home.id} name={m.home.name} />
                                  {m.home.short}
                                  <span className="text-white/30">v</span>
                                  <Crest short={m.away.short} color={m.away.color} size={18} teamId={m.away.id} name={m.away.name} />
                                  {m.away.short}
                                </span>
                                {m.score && (
                                  <span className="shrink-0 text-[12.5px] font-bold tnum">
                                    {m.score.home}-{m.score.away}
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
