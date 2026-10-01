"use client";

import { Fragment } from "react";
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

export type XgRowView = {
  teamId: number;
  name: string;
  short: string;
  color: string;
  played: number;
  xgf: number | null;
  xga: number | null;
  xgd: number;
  gd: number;
};

export type ZoneView = { key: string; label: string; type: string; from: number; to: number };
export type Kind = "all" | "home" | "away" | "form" | "xg";

const th = "px-1.5 py-2.5 text-center text-[11px] font-semibold text-white/40";

function zoneClass(z: ZoneView): string {
  if (z.type === "relegation") return "bg-loss";
  if (z.key === "cl") return "bg-pulse-500";
  if (z.key === "el") return "bg-away";
  if (z.type === "qualification") return "bg-[#a86bff]";
  return "bg-white/40";
}

const signed = (n: number, d = 0) => (n > 0 ? `+${n.toFixed(d)}` : n.toFixed(d));

export function LeagueTable({
  tables,
  xg,
  zones,
  showNext
}: {
  tables: Record<"all" | "home" | "away" | "form", TableRowView[]>;
  xg: XgRowView[] | null;
  zones: ZoneView[];
  showNext: boolean;
}) {
  const [kind, setKind] = useState<Kind>("all");
  const tabs: { key: Kind; label: string }[] = [
    { key: "all", label: "Overall" },
    { key: "home", label: "Home" },
    { key: "away", label: "Away" },
    { key: "form", label: "Last 5" }
  ];
  if (xg && xg.length > 0) tabs.push({ key: "xg", label: "xG" });

  const rows = kind === "xg" ? [] : tables[kind];
  const showZones = kind === "all";

  return (
    <section className="card overflow-hidden">
      <div role="tablist" aria-label="Table view" className="no-scrollbar flex gap-1 overflow-x-auto border-b border-white/[0.06] p-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={kind === t.key}
            onClick={() => setKind(t.key)}
            className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors ${
              kind === t.key ? "bg-pulse-500 text-[#03100c]" : "text-white/60 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        {kind === "xg" && xg ? (
          <table className="w-full text-[13px] tnum">
            <thead>
              <tr>
                <th className={`${th} w-9 pl-3`}>#</th>
                <th className={`${th} text-left`}>Club</th>
                <th className={th}>P</th>
                <th className={`${th} hidden sm:table-cell`}>xGF</th>
                <th className={`${th} hidden sm:table-cell`}>xGA</th>
                <th className={`${th} text-white/60`}>xGD</th>
                <th className={th}>GD</th>
                <th className={`${th} hidden pr-3 md:table-cell`}>GD vs xGD</th>
              </tr>
            </thead>
            <tbody>
              {xg.map((r, i) => {
                const diff = r.gd - r.xgd;
                return (
                  <tr key={r.teamId} className="border-t border-white/[0.05] hover:bg-white/[0.03]">
                    <td className="py-2.5 pl-3 pr-1 text-center text-white/55">{i + 1}</td>
                    <td className="py-2 pr-2">
                      <Link href={`/team/${r.teamId}`} className="flex min-w-0 items-center gap-2.5">
                        <Crest short={r.short} color={r.color} size={22} teamId={r.teamId} name={r.name} />
                        <span className="max-w-[9rem] truncate font-semibold sm:max-w-[14rem]">{r.name}</span>
                      </Link>
                    </td>
                    <td className="px-1.5 text-center text-white/70">{r.played}</td>
                    <td className="hidden px-1.5 text-center text-white/70 sm:table-cell">{r.xgf !== null ? r.xgf.toFixed(1) : "-"}</td>
                    <td className="hidden px-1.5 text-center text-white/70 sm:table-cell">{r.xga !== null ? r.xga.toFixed(1) : "-"}</td>
                    <td className={`px-1.5 text-center font-display font-extrabold ${r.xgd > 0 ? "text-pulse-400" : r.xgd < 0 ? "text-loss" : ""}`}>{signed(r.xgd, 1)}</td>
                    <td className="px-1.5 text-center text-white/70">{signed(r.gd)}</td>
                    <td className={`hidden px-1.5 pr-3 text-center md:table-cell ${diff > 1 ? "text-draw" : diff < -1 ? "text-away" : "text-white/40"}`}>
                      {diff > 1 ? "Overperforming" : diff < -1 ? "Underperforming" : "In line"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-[13px] tnum">
            <thead>
              <tr>
                <th className={`${th} w-7 pl-3 text-left`}>#</th>
                <th className={`${th} text-left`}>Club</th>
                <th className={th}>P</th>
                <th className={th}>W</th>
                <th className={th}>D</th>
                <th className={th}>L</th>
                <th className={th}>GLS</th>
                <th className={`${th} pr-3 text-white/60`}>PTS</th>
                <th className={`${th} hidden text-left lg:table-cell`}>Form</th>
                {showNext && <th className={`${th} hidden text-left lg:table-cell`}>Next</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => {
                const zone = showZones ? zones.find((z) => r.pos >= z.from && r.pos <= z.to) : undefined;
                const zoneStart = zone && (idx === 0 || rows[idx - 1].pos < zone.from);
                return (
                  <Fragment key={r.teamId}>
                    {zoneStart && (
                      <tr key={`zone-${zone.key}-${zone.from}`} className="border-t border-white/[0.05]">
                        <td colSpan={showNext ? 10 : 9} className="px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-white/35">
                          <span className="flex items-center gap-1.5">
                            <span className={`h-2 w-2 rounded-full ${zoneClass(zone)}`} />
                            {zone.label}
                          </span>
                        </td>
                      </tr>
                    )}
                    <tr className="border-t border-white/[0.05] transition-colors hover:bg-white/[0.03]">
                      <td className="relative py-2.5 pl-3 pr-1 text-left text-white/55">
                        {zone && <span className={`absolute inset-y-2 left-0 w-[3px] rounded-full ${zoneClass(zone)}`} />}
                        <span className="pl-1.5">{r.pos}</span>
                      </td>
                      <td className="py-2 pr-2">
                        <Link href={`/team/${r.teamId}`} className="flex min-w-0 items-center gap-2.5">
                          <Crest short={r.short} color={r.color} size={22} teamId={r.teamId} name={r.name} />
                          <span className="max-w-[9rem] truncate font-semibold sm:max-w-[14rem]">{r.name}</span>
                        </Link>
                      </td>
                      <td className="px-1.5 text-center text-white/70">{r.played}</td>
                      <td className="px-1.5 text-center text-white/70">{r.won}</td>
                      <td className="px-1.5 text-center text-white/70">{r.drawn}</td>
                      <td className="px-1.5 text-center text-white/70">{r.lost}</td>
                      <td className="px-1.5 text-center tnum text-white/70">
                        {r.gf}:{r.ga}
                      </td>
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
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1.5 border-t border-white/[0.06] px-4 py-3 text-[11.5px] text-white/45">
        {showZones &&
          zones.map((z) => (
            <span key={`${z.key}-${z.from}`} className="flex items-center gap-2">
              <span className={`h-3 w-[3px] rounded-full ${zoneClass(z)}`} />
              {z.label}
            </span>
          ))}
        {kind === "form" && <span>Points from each club&apos;s last five matches.</span>}
        {kind === "xg" ? (
          <span>
            xG (expected goals) measures the quality of the chances a club creates (xGF) and allows (xGA). When goal difference is well above xGD, a club may be
            finishing unusually well or getting lucky, and the reverse.
          </span>
        ) : (
          <span>P played, W won, D drawn, L lost, GF goals for, GA against, GD difference.</span>
        )}
      </div>
    </section>
  );
}
