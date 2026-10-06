"use client";

import { useState } from "react";
import Link from "next/link";
import { flagFor } from "@/lib/countries";
import type { League } from "@/lib/leagues";

export function LeaguesHub({ leagues }: { leagues: League[] }) {
  const [open, setOpen] = useState<string | null>(null);

  const byCountry = new Map<string, League[]>();
  for (const l of leagues) {
    const list = byCountry.get(l.country) ?? [];
    list.push(l);
    byCountry.set(l.country, list);
  }
  const countries = Array.from(byCountry.entries())
    .map(([country, ls]) => [country, ls.sort((a, b) => a.tier - b.tier)] as const)
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));

  return (
    <section>
      <h2 className="section-title mb-3">Leagues</h2>
      <div className="flex flex-col gap-2">
        {countries.map(([country, ls]) => {
          const isOpen = open === country;
          return (
            <div key={country} className="panel overflow-hidden">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : country)}
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
                <div className="flex flex-col gap-1 border-t border-white/[0.06] px-3.5 pb-3.5 pt-2">
                  {ls.map((l) => (
                    <Link
                      key={l.id}
                      href={`/table?league=${l.id}`}
                      className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 hover:bg-white/[0.05]"
                    >
                      <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: l.color }} />
                      <span className="text-[13.5px] font-semibold text-white/85">{l.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
