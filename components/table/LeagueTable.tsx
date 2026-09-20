"use client";

import Link from "next/link";
import { useState } from "react";
import { Crest } from "@/components/Crest";
import { FormPills } from "@/components/FormPills";
import type { Result } from "@/lib/types";

export type TableRowView = {
  pos: number;
  teamId: number;
  name: string;
  short: string;
  color: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  form: Result[];
  next: { opponentId: number; opponentName: string; opponentShort: string; opponentColor: string; home: boolean; label: string } | null;
};

export type Kind = "all" | "home" | "away" | "form";

const TABS: { key: Kind; label: string }[] = [
  { key: "all", label: "Overall" },
  { key: "home", label: "Home" },
  { key: "away", label: "Away" },
  { key: "form", label: "Last 5" }
];

const th = "px-1.5 py-2.5 text-center text-[11px] font-semibold text-white/40";

export function LeagueTable({ tables, showNext }: { tables: Record<Kind, TableRowView[]>; showNext: boolean }) {
  const [kind, setKind] = useState<Kind>("all");
  const rows = tables[kind];
  const zones = kind === "all" && rows.length >= 18;

  return (
    <section className="card overflow-hidden">
      <div role="tablist" aria-label="Table view" className="flex gap-1 border-b border-white/[0.06] p-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={kind === t.key}
            onClick={() => setKind(t.key)}
            className={`flex-1 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors ${
              kind === t.key ? "bg-pulse-500 text-[#03100c]" : "text-white/60 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[13px] tnum">
          <thead>
            <tr>
              <th className={`${th} w-9 pl-3`}>#</th>
              <th className={`${th} text-left`}>Club</th>
              <th className={th}>P</th>
              <th className={`${th} hidden sm:table-cell`}>W</th>
              <th className={`${th} hidden sm:table-cell`}>D</th>
              <th className={`${th} hidden sm:table-cell`}>L</th>
              <th className={`${th} hidden md:table-cell`}>GF</th>
              <th className={`${th} hidden md:table-cell`}>GA</th>
              <th className={th}>GD</th>
              <th className={`${th} pr-3 text-white/60`}>Pts</th>
              <th className={`${th} hidden text-left lg:table-cell`}>Form</th>
              {showNext && <th className={`${th} hidden text-left lg:table-cell`}>Next</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const zone = zones ? (r.pos <= 4 ? "bg-pulse-500" : r.pos > rows.length - 3 ? "bg-loss" : "") : "";
              return (
                <tr key={r.teamId} className="border-t border-white/[0.05] transition-colors hover:bg-white/[0.03]">
                  <td className="relative py-2.5 pl-3 pr-1 text-center text-white/55">
                    {zone && <span className={`absolute inset-y-2 left-0 w-[3px] rounded-full ${zone}`} />}
                    {r.pos}
                  </td>
                  <td className="py-2 pr-2">
                    <Link href={`/team/${r.teamId}`} className="flex min-w-0 items-center gap-2.5">
                      <Crest short={r.short} color={r.color} size={22} teamId={r.teamId} name={r.name} />
                      <span className="max-w-[7.5rem] truncate font-semibold sm:max-w-[14rem]">{r.name}</span>
                    </Link>
                  </td>
                  <td className="px-1.5 text-center text-white/70">{r.played}</td>
                  <td className="hidden px-1.5 text-center text-white/70 sm:table-cell">{r.won}</td>
                  <td className="hidden px-1.5 text-center text-white/70 sm:table-cell">{r.drawn}</td>
                  <td className="hidden px-1.5 text-center text-white/70 sm:table-cell">{r.lost}</td>
                  <td className="hidden px-1.5 text-center text-white/70 md:table-cell">{r.gf}</td>
                  <td className="hidden px-1.5 text-center text-white/70 md:table-cell">{r.ga}</td>
                  <td className="px-1.5 text-center text-white/70">{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
                  <td className="px-2 pr-3 text-center font-display text-[15px] font-extrabold">{r.points}</td>
                  <td className="hidden px-2 lg:table-cell">{r.form.length > 0 ? <FormPills form={r.form} size="sm" /> : null}</td>
                  {showNext && (
                    <td className="hidden px-2 lg:table-cell">
                      {r.next ? (
                        <span className="flex items-center gap-2 text-[12px] text-white/60">
                          <Crest short={r.next.opponentShort} color={r.next.opponentColor} size={18} teamId={r.next.opponentId} name={r.next.opponentName} />
                          <span className="font-semibold">{r.next.home ? "H" : "A"}</span>
                          <span className="text-white/40">{r.next.label}</span>
                        </span>
                      ) : null}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1.5 border-t border-white/[0.06] px-4 py-3 text-[11.5px] text-white/45">
        {zones && (
          <>
            <span className="flex items-center gap-2">
              <span className="h-3 w-[3px] rounded-full bg-pulse-500" />
              Top four
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-[3px] rounded-full bg-loss" />
              Relegation
            </span>
          </>
        )}
        {kind === "form" && <span>Points from each club&apos;s last five matches.</span>}
        <span>P played, W won, D drawn, L lost, GF goals for, GA against, GD difference.</span>
      </div>
    </section>
  );
}
