import Link from "next/link";
import { ChevronLeft, MapPin } from "lucide-react";
import { Crest } from "@/components/Crest";
import { StatusLabel } from "@/components/FixtureCard";
import { withAlpha } from "@/lib/color";
import type { Match, TeamData } from "@/lib/types";

function Side({ team }: { team: TeamData }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-3 text-center">
      <div className="sm:hidden">
        <Crest short={team.short} color={team.color} size={62} />
      </div>
      <div className="hidden sm:block">
        <Crest short={team.short} color={team.color} size={84} />
      </div>
      <div className="w-full truncate font-display text-[15px] font-extrabold tracking-tight sm:text-xl">{team.name}</div>
    </div>
  );
}

export function MatchHero({ match }: { match: Match }) {
  const glow = `radial-gradient(65% 100% at 0% 0%, ${withAlpha(match.home.color, 0.3)}, transparent 70%), radial-gradient(65% 100% at 100% 0%, ${withAlpha(match.away.color, 0.3)}, transparent 70%)`;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-ink-900">
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: glow }} />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent"
      />

      <div className="relative px-4 pb-6 pt-4 sm:px-8 sm:pb-8">
        <div className="flex items-center justify-between text-xs text-white/60">
          <Link href="/matches" className="inline-flex items-center gap-1 rounded-lg py-1 pr-2 hover:text-white">
            <ChevronLeft size={16} />
            Matches
          </Link>
          <span>
            {match.competition}, matchday {match.matchday}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-6">
          <Side team={match.home} />
          <div className="px-1 text-center">
            <StatusLabel match={match} />
            <div className="mt-1.5 font-display text-[38px] font-extrabold leading-none tnum sm:text-5xl">{match.time}</div>
            <div className="mt-2 text-xs text-white/55">{match.dateLabel}</div>
          </div>
          <Side team={match.away} />
        </div>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-white/50">
          <MapPin size={13} />
          {match.venue}
        </div>
      </div>
    </section>
  );
}
