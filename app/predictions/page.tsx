import type { Metadata } from "next";
import { DataNotice } from "@/components/DataNotice";
import { FixtureCard } from "@/components/FixtureCard";
import { loadMatches, loadModelStats, loadTrackRecord } from "@/lib/db";
import { interval95, pickLabel, tierOf, topProbability } from "@/lib/tiers";

export const metadata: Metadata = { title: "Predictions" };
export const revalidate = 60;

export default async function PredictionsPage() {
  const [{ matches, error }, record, stats] = await Promise.all([loadMatches(0, 30), loadTrackRecord(), loadModelStats()]);
  const upcoming = matches.filter((m) => m.status !== "FT" && m.outlook);
  const confident = upcoming.filter((m) => m.outlook && tierOf(topProbability(m.outlook)) === "high");
  const others = upcoming.filter((m) => !confident.includes(m));
  const high = stats?.tiers.find((t) => t.key === "high");

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Predictions</h1>
      <p className="mt-1 text-sm text-white/55">Model outlooks for upcoming matches, with the evidence behind them.</p>

      {stats && (
        <section className="card mt-6 p-5">
          <h2 className="section-title">How reliable are the outlooks?</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-white/60">
            Backtest: each of {stats.matchesTested} past matches was predicted using only earlier results. Overall the model picked the right outcome {stats.accuracy}% of
            the time. The more confident it is, the more often it is right:
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {stats.tiers.map((t) => {
              const r = t.accuracyPercent !== null ? interval95(t.accuracyPercent, t.matches) : null;
              return (
                <div key={t.key} className="panel p-4">
                  <div className="text-[12px] font-semibold text-white/60">{t.label}</div>
                  <div className="mt-1 font-display text-3xl font-extrabold tnum">{t.accuracyPercent ?? "-"}%</div>
                  <div className="mt-1 text-[12px] leading-snug text-white/45">
                    right, over {t.matches} matches ({t.sharePercent}% of all){r ? `. Likely range ${r[0]} to ${r[1]}%.` : "."}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-[12px] leading-relaxed text-white/40">
            Tiers were chosen after seeing the backtest, so the live record below is the fair test. Brier score {stats.brier}, against {stats.baselineBrier} for always
            predicting the average outcome (lower is better).
          </p>
        </section>
      )}

      <section className="card mt-6 p-5">
        <h2 className="section-title">Live record</h2>
        {record ? (
          <>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="panel px-2 py-4">
                <div className="font-display text-2xl font-extrabold tnum">{record.n}</div>
                <div className="mt-1 text-[11px] text-white/45">Matches judged</div>
              </div>
              <div className="panel px-2 py-4">
                <div className="font-display text-2xl font-extrabold tnum">{record.accuracy}%</div>
                <div className="mt-1 text-[11px] text-white/45">Right outcome</div>
              </div>
              <div className="panel px-2 py-4">
                <div className="font-display text-2xl font-extrabold tnum">{record.brier}</div>
                <div className="mt-1 text-[11px] text-white/45">Brier score</div>
              </div>
            </div>
            <p className="mt-4 text-[12.5px] leading-relaxed text-white/50">
              These predictions were locked at kickoff, before the results were known. A small sample says little, so judge over many matches.
            </p>
          </>
        ) : (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/60">
            Every prediction is stored and locked at kickoff, then compared with the real result. The first results will appear here after the next matches finish.
          </p>
        )}
      </section>

      {upcoming.length === 0 ? (
        <div className="mt-6">
          <DataNotice error={error} />
        </div>
      ) : (
        <>
          {confident.length > 0 && (
            <section className="mt-8">
              <h2 className="section-title">Most confident outlooks</h2>
              <p className="mb-3 mt-1 text-[13px] text-white/50">
                {high && high.accuracyPercent !== null
                  ? `Outlooks at this level were right about ${high.accuracyPercent}% of the time in the backtest.`
                  : "Outlooks where the model's top result is 65% or higher."}
              </p>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {confident.map((m) => (
                  <FixtureCard key={m.id} match={m} note={pickLabel(m) ?? undefined} />
                ))}
              </div>
            </section>
          )}
          <section className="mt-8">
            <h2 className="section-title">{confident.length > 0 ? "Other outlooks" : "Upcoming outlooks"}</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {others.map((m) => (
                <FixtureCard key={m.id} match={m} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
