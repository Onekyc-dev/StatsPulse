"use client";

import { ArrowLeftRight, CircleDot, Clock, Tv } from "lucide-react";
import { useMatchCentre } from "@/lib/liveClient";
import { minuteText, type LiveEvent, type StatRow } from "@/lib/live";
import type { Match } from "@/lib/types";

function fmt(v: number | null, r: StatRow): string {
  if (v === null) return "-";
  const n = r.decimals !== undefined ? v.toFixed(r.decimals) : String(v);
  return `${n}${r.suffix ?? ""}`;
}

function StatBars({ rows, match }: { rows: StatRow[]; match: Match }) {
  return (
    <section className="card p-5">
      <div className="flex items-center justify-between">
        <h3 className="section-title">Match statistics</h3>
        <div className="flex items-center gap-3 text-[11px] text-white/55">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-pulse-500" />
            {match.home.short}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-away" />
            {match.away.short}
          </span>
        </div>
      </div>
      <ul className="mt-4 flex flex-col gap-4">
        {rows.map((r) => {
          const h = r.home ?? 0;
          const a = r.away ?? 0;
          const total = h + a;
          const share = total > 0 ? (h / total) * 100 : 50;
          return (
            <li key={r.key}>
              <div className="mb-1.5 flex items-baseline justify-between text-[13px]">
                <span className="font-display font-bold tnum text-pulse-500">{fmt(r.home, r)}</span>
                <span className="text-white/60">{r.label}</span>
                <span className="font-display font-bold tnum text-away">{fmt(r.away, r)}</span>
              </div>
              <div className="flex h-2 gap-[3px] overflow-hidden rounded-full bg-white/[0.04]">
                {total > 0 ? (
                  <>
                    <div className="rounded-full bg-pulse-500" style={{ width: `${share}%` }} />
                    <div className="rounded-full bg-away" style={{ width: `${100 - share}%` }} />
                  </>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function periodName(text: string): string {
  const t = text.trim().toUpperCase();
  if (t === "FT") return "Full time";
  if (t === "HT") return "Half time";
  if (t === "ET" || t === "AET") return "Extra time";
  return text || "Period";
}

function EventRow({ e, match }: { e: LiveEvent; match: Match }) {
  if (e.type === "period") {
    const score = e.homeScore !== null && e.awayScore !== null ? ` ${e.homeScore}–${e.awayScore}` : "";
    return (
      <li className="flex items-center gap-3 py-1">
        <span className="h-px flex-1 bg-white/[0.08]" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-white/45">
          {periodName(e.detail)}
          {score}
        </span>
        <span className="h-px flex-1 bg-white/[0.08]" />
      </li>
    );
  }

  const team = e.side === "home" ? match.home : e.side === "away" ? match.away : null;
  let icon: React.ReactNode;
  let text: React.ReactNode;

  if (e.type === "goal") {
    icon = <CircleDot size={16} className="text-pulse-500" />;
    text = (
      <>
        <span className="font-semibold">Goal</span>
        {e.player ? `, ${e.player}` : ""}
        {e.detail ? ` (${e.detail})` : ""}
      </>
    );
  } else if (e.type === "card") {
    const red = e.card === "red" || e.card === "second-yellow";
    icon = <span className={`inline-block h-4 w-3 rounded-[2px] ${red ? "bg-loss" : "bg-draw"}`} />;
    text = (
      <span className={e.rescinded ? "line-through opacity-60" : ""}>
        <span className="font-semibold">{e.card === "second-yellow" ? "Second yellow" : red ? "Red card" : "Yellow card"}</span>
        {e.player ? `, ${e.player}` : ""}
        {e.rescinded ? " (overturned)" : ""}
      </span>
    );
  } else if (e.type === "sub") {
    icon = <ArrowLeftRight size={16} className="text-white/60" />;
    text = (
      <>
        <span className="font-semibold">Substitution</span>
        {e.player ? `. On: ${e.player}` : ""}
        {e.playerOut ? `. Off: ${e.playerOut}` : ""}
      </>
    );
  } else if (e.type === "var") {
    icon = <Tv size={16} className="text-white/60" />;
    text = (
      <>
        <span className="font-semibold">VAR</span>
        {e.detail ? `, ${e.detail}` : ""}
      </>
    );
  } else {
    icon = <Clock size={16} className="text-white/40" />;
    text = e.detail || "Event";
  }

  return (
    <li className="flex items-start gap-3 py-2">
      <span className="w-11 shrink-0 pt-0.5 text-right text-[12px] font-bold text-white/45 tnum">{minuteText(e)}</span>
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">{icon}</span>
      <p className="min-w-0 flex-1 text-[13.5px] leading-snug text-white/80">
        {text}
        {team && <span className="ml-2 rounded-md bg-white/[0.07] px-1.5 py-0.5 text-[10.5px] font-bold text-white/55">{team.short}</span>}
      </p>
    </li>
  );
}

export function MatchCentre({ match }: { match: Match }) {
  const { data, failed } = useMatchCentre(match.id, match.kickoff, match.status);
  const live = (data?.snap?.status ?? match.status) === "LIVE";

  if (!data) {
    return (
      <div className="card px-6 py-10 text-center text-sm text-white/55">
        {failed ? "Live data is temporarily unavailable. It will retry automatically." : "Loading the match centre"}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="card p-5">
        <div className="flex items-center justify-between">
          <h3 className="section-title">Events</h3>
          {live && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-loss">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-loss" />
              Updating
            </span>
          )}
        </div>
        {data.events.length === 0 ? (
          <p className="mt-3 text-sm leading-relaxed text-white/55">
            {live ? "No events yet. Goals, cards and substitutions will appear here as they happen." : "No events were recorded for this match."}
          </p>
        ) : (
          <ol className="mt-3 divide-y divide-white/[0.05]">
            {data.events.map((e) => (
              <EventRow key={e.key} e={e} match={match} />
            ))}
          </ol>
        )}
        <p className="mt-3 text-[11.5px] leading-relaxed text-white/35">
          {live
            ? "Refreshes every 15 seconds. Data arrives about 10 to 30 seconds behind the match."
            : "Final events and statistics. Statistics can be corrected for a few hours after full time."}
        </p>
      </section>

      {data.stats.length > 0 && <StatBars rows={data.stats} match={match} />}
    </div>
  );
}
