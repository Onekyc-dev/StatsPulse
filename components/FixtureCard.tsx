import Link from "next/link";
import { Crest } from "./Crest";
import { ProbBar } from "./ProbBar";
import { getOutlook } from "@/lib/outlook";
import type { Match, TeamData } from "@/lib/types";

function TeamSide({ team }: { team: TeamData }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-2 text-center">
      <Crest short={team.short} color={team.color} size={46} />
      <div className="w-full truncate text-[13px] font-semibold leading-tight">{team.name}</div>
    </div>
  );
}

export function StatusLabel({ match }: { match: Match }) {
  if (match.status === "LIVE") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-loss">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-loss" />
        Live
      </span>
    );
  }
  if (match.status === "TODAY") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-pulse-400">
        <span className="h-1.5 w-1.5 rounded-full bg-pulse-500" />
        Today
      </span>
    );
  }
  if (match.status === "FT") return <span className="text-[11px] font-bold text-white/50">Full time</span>;
  return <span className="text-[11px] font-semibold text-white/45">{match.dateLabel}</span>;
}

export function FixtureCard({ match }: { match: Match }) {
  const o = getOutlook(match);
  return (
    <Link
      href={`/match/${match.slug}`}
      className="card block overflow-hidden p-4 transition-colors hover:border-pulse-500/40 active:bg-ink-700"
    >
      <div className="flex items-center justify-between text-[11px] text-white/45">
        <span>{match.competition}</span>
        <span>Matchday {match.matchday}</span>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <TeamSide team={match.home} />
        <div className="px-2 text-center">
          <StatusLabel match={match} />
          <div className="mt-1 font-display text-[26px] font-extrabold leading-none tnum">{match.time}</div>
          <div className="mt-1 text-[11px] text-white/40">{match.dateLabel}</div>
        </div>
        <TeamSide team={match.away} />
      </div>

      <div className="mt-5 border-t border-white/[0.06] pt-4">
        <ProbBar
          home={o.homeWin}
          draw={o.draw}
          away={o.awayWin}
          homeLabel={match.home.short}
          awayLabel={match.away.short}
        />
      </div>
    </Link>
  );
}
