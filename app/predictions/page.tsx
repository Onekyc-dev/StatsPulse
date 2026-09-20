import type { Metadata } from "next";
import { DataNotice } from "@/components/DataNotice";
import { FixtureCard } from "@/components/FixtureCard";
import { loadMatches, loadTrackRecord } from "@/lib/db";

export const metadata: Metadata = { title: "Predictions" };
export const revalidate = 60;

export default async function PredictionsPage() {
  const [{ matches, error }, record] = await Promise.all([loadMatches(0, 30), loadTrackRecord()]);
  const upcoming = matches.filter((m) => m.status !== "FT" && m.outlook);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Predictions</h1>
      <p className="mt-1 text-sm text-white/55">Current model outlook for upcoming matches.</p>

      <section className="card mt-6 p-5">
        <h2 className="section-title">Track record</h2>
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
              Brier score measures how good the probabilities are, and lower is better. Guessing one third each time scores 0.667. A
              small sample says little, so judge the model over many matches.
            </p>
          </>
        ) : (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/60">
            Every prediction is stored and locked at kickoff, then compared with the real result. The first results will appear here
            after the next matches finish.
          </p>
        )}
      </section>

      <div className="mt-6">
        {upcoming.length === 0 ? (
          <DataNotice error={error} />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {upcoming.map((m) => (
              <FixtureCard key={m.id} match={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
