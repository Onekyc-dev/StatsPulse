import { Sparkles } from "lucide-react";
import { ProbBar } from "@/components/ProbBar";
import { leanHeadline, summaryText } from "@/lib/outlook";
import type { Match } from "@/lib/types";

export function OutlookCard({ match }: { match: Match }) {
  const o = match.outlook;
  return (
    <section className="card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles size={16} className="text-pulse-500" />
          Match outlook
        </div>
        <span className="rounded-full border border-pulse-500/30 bg-pulse-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-pulse-400">
          Model estimate
        </span>
      </div>

      {!o ? (
        <p className="mt-4 text-sm leading-relaxed text-white/60">
          No outlook is stored for this match. Outlooks are created within 30 days of kickoff and locked when the match starts.
        </p>
      ) : (
        <>
          <h2 className="mt-4 font-display text-[22px] font-extrabold leading-tight tracking-tight">{leanHeadline(match)}</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/65">{summaryText(match)}</p>

          <div className="mt-5">
            <ProbBar home={o.homeWin} draw={o.draw} away={o.awayWin} homeLabel={match.home.name} awayLabel={match.away.name} large />
          </div>

          <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
            <div className="panel px-2 py-3">
              <dd className="font-display text-lg font-extrabold tnum">
                {o.likelyScore[0]}–{o.likelyScore[1]}
              </dd>
              <dt className="mt-0.5 text-[10.5px] leading-tight text-white/45">Likeliest score</dt>
            </div>
            <div className="panel px-2 py-3">
              <dd className="font-display text-lg font-extrabold tnum">
                {o.homeXg.toFixed(1)}–{o.awayXg.toFixed(1)}
              </dd>
              <dt className="mt-0.5 text-[10.5px] leading-tight text-white/45">Model goals</dt>
            </div>
            <div className="panel px-2 py-3">
              <dd className="font-display text-lg font-extrabold tnum">{o.btts}%</dd>
              <dt className="mt-0.5 text-[10.5px] leading-tight text-white/45">Both teams score</dt>
            </div>
          </dl>

          <p className="mt-4 text-[11.5px] leading-relaxed text-white/40">
            Baseline model built from past results. An estimate, not a guarantee.
          </p>
        </>
      )}
    </section>
  );
}
