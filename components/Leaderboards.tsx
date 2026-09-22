"use client";

import Link from "next/link";
import { useState } from "react";
import { Crest } from "@/components/Crest";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import type { Leader, LeaderStat } from "@/lib/leaders";

const TABS: { key: LeaderStat; label: string; unit: string }[] = [
  { key: "goals", label: "Goals", unit: "goals" },
  { key: "assists", label: "Assists", unit: "assists" },
  { key: "yellow", label: "Yellow cards", unit: "yellow cards" },
  { key: "red", label: "Red cards", unit: "red cards" },
  { key: "fouls", label: "Fouls", unit: "fouls" }
];

export function Leaderboards({ lists, teamColors }: { lists: Record<LeaderStat, Leader[] | null>; teamColors: Record<number, { short: string; color: string }> }) {
  const [tab, setTab] = useState<LeaderStat>("goals");
  const list = lists[tab];
  const unit = TABS.find((t) => t.key === tab)?.unit ?? "";

  return (
    <section className="card overflow-hidden">
      <div role="tablist" aria-label="Leaderboard" className="no-scrollbar flex gap-1 overflow-x-auto border-b border-white/[0.06] p-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 rounded-lg px-3.5 py-2 text-[13px] font-semibold transition-colors ${
              tab === t.key ? "bg-pulse-500 text-[#03100c]" : "text-white/60 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!list ? (
        <p className="px-5 py-10 text-center text-sm text-white/55">This leaderboard is not available right now.</p>
      ) : (
        <ol>
          {list.map((p, i) => {
            const t = p.teamId !== null ? teamColors[p.teamId] : undefined;
            return (
              <li key={`${p.playerId ?? p.name}-${i}`} className="flex items-center gap-3 border-t border-white/[0.05] px-4 py-2.5 first:border-t-0">
                <span className="w-6 shrink-0 text-center text-[13px] font-semibold text-white/45 tnum">{p.rank}</span>
                <PlayerAvatar id={p.playerId} name={p.name} size={38} />
                <div className="min-w-0 flex-1">
                  {p.playerId !== null ? (
                    <Link href={`/player/${p.playerId}`} className="block truncate text-[14px] font-semibold hover:text-pulse-400">
                      {p.name}
                    </Link>
                  ) : (
                    <div className="truncate text-[14px] font-semibold">{p.name}</div>
                  )}
                  {p.team && (
                    <Link href={p.teamId !== null ? `/team/${p.teamId}` : "#"} className="mt-0.5 flex items-center gap-1.5 text-[12px] text-white/50">
                      {p.teamId !== null && t && <Crest short={t.short} color={t.color} size={14} teamId={p.teamId} name={p.team} />}
                      <span className="truncate">{p.team}</span>
                    </Link>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-display text-xl font-extrabold leading-none tnum">{p.value}</div>
                  <div className="mt-1 text-[10.5px] text-white/35">{unit}</div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
