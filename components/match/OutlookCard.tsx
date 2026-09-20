import { Sparkles } from "lucide-react";
import { ProbBar } from "@/components/ProbBar";
import { leanHeadline, summaryText } from "@/lib/outlook";
import { interval95, tierOf, topProbability } from "@/lib/tiers";
import type { Match, ModelStats } from "@/lib/types";

export function OutlookCard({ match, stats }: { match: Match; stats: ModelStats | null }) {
  const o = match.outlook;
  const tierKey = o ? tierOf(topProbability(o)) : null;
  const tier = stats && tierKey ? stats.tiers.find((t) => t.key === tierKey) : undefined;
  const range = tier && tier.accuracyPercent !== null ? interval95(tier.accuracyPercent, tier.matches) : null;
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

          {tier && stats && tier.accuracyPercent !== null && range && (
            <div className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3.5">
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  tier.key === "high" ? "bg-pulse-500/15 text-pulse-400" : tier.key === "medium" ? "bg-draw/15 text-draw" : "bg-white/10 text-white/60"
                }`}
              >
                {tier.label}
              </span>
              <p className="mt-2 text-[12.5px] leading-relaxed text-white/60">
                In backtests on {stats.matchesTested} past matches, outlooks this confident were right about {tier.accuracyPercent}% of the time ({tier.matches}{" "}
                matches, {tier.sharePercent}% of all). With that many matches the true rate is likely {range[0]} to {range[1]}%.
              </p>
            </div>
          )}

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
