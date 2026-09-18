import Link from "next/link";
import { ArrowUpRight, Clock3 } from "lucide-react";
import type { Match } from "@/data/mockData";

export function MatchCard({ match }: { match: Match }) {
  return (
    <Link href={`/match/${match.slug}`} className="panel block p-5 transition hover:border-pulse-500/30 hover:bg-white/[0.05]">
      <div className="flex items-center justify-between text-xs text-white/40">
        <span>{match.competition}</span>
        <span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" /> {match.kickoff}</span>
      </div>

      <div className="mt-7 flex items-center justify-between gap-5">
        <Team name={match.home} short={match.homeShort} />
        <div className="text-center">
          <div className="text-xs font-medium text-pulse-400">{match.status}</div>
          <div className="mt-1 text-2xl font-semibold">{match.time}</div>
        </div>
        <Team name={match.away} short={match.awayShort} right />
      </div>

      <div className="mt-7 flex items-center justify-between border-t border-white/[0.06] pt-4 text-xs">
        <span className="text-white/40">Match intelligence</span>
        <span className="text-pulse-400">Open <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" /></span>
      </div>
    </Link>
  );
}

function Team({ name, short, right = false }: { name: string; short: string; right?: boolean }) {
  return (
    <div className={`flex min-w-0 items-center gap-3 ${right ? "flex-row-reverse text-right" : ""}`}>
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-sm font-bold">
        {short[0]}
      </div>
      <div>
        <div className="font-semibold">{name}</div>
        <div className="mt-1 text-xs text-white/35">{short}</div>
      </div>
    </div>
  );
}