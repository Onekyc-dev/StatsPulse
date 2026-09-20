import Link from "next/link";
import { Crest } from "./Crest";
import { ProbBar } from "./ProbBar";
import type { Match, TeamView } from "@/lib/types";

function TeamSide({ team }: { team: TeamView }) {
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
  if (match.status === "OFF") return <span className="text-[11px] font-bold text-draw">Off</span>;
  return <span className="text-[11px] font-semibold text-white/45">{match.dateLabel}</span>;
}

/** Score for live and finished matches, kickoff time otherwise. */
export function CentreValue({ match, size = "text-[26px]" }: { match: Match; size?: string }) {
  const showScore = match.score && (match.status === "FT" || match.status === "LIVE");
  return (
    <div className={`font-display font-extrabold leading-none tnum ${size}`}>
      {showScore && match.score ? `${match.score.home}–${match.score.away}` : match.time}
    </div>
  );
}

export function FixtureCard({ match }: { match: Match }) {
  const o = match.outlook;
  return (
    <Link
      href={`/match/${match.slug}`}
      className="card block overflow-hidden p-4 transition-colors hover:border-pulse-500/40 active:bg-ink-700"
    >
      <div className="flex items-center justify-between text-[11px] text-white/45">
        <span>{match.competition}</span>
        <span>{match.matchday ? `Matchday ${match.matchday}` : ""}</span>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <TeamSide team={match.home} />
        <div className="px-2 text-center">
          <StatusLabel match={match} />
          <div className="mt-1">
            <CentreValue match={match} />
          </div>
          <div className="mt-1 text-[11px] text-white/40">{match.status === "FT" ? match.dateLabel : `${match.dateLabel}, UK`}</div>
        </div>
        <TeamSide team={match.away} />
      </div>

      {(o || match.status !== "FT") && (
        <div className="mt-5 border-t border-white/[0.06] pt-4">
          {o ? (
            <ProbBar home={o.homeWin} draw={o.draw} away={o.awayWin} homeLabel={match.home.short} awayLabel={match.away.short} />
          ) : (
            <p className="text-center text-[12px] text-white/40">Outlook appears within 30 days of kickoff.</p>
          )}
        </div>
      )}
    </Link>
  );
}
