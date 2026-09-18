import type { Metadata } from "next";
import { FixtureCard } from "@/components/FixtureCard";
import { matches } from "@/data/matches";

export const metadata: Metadata = { title: "Predictions" };

export default function PredictionsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Predictions</h1>
      <p className="mt-1 text-sm text-white/55">Current model outlook for upcoming matches.</p>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {matches.map((m) => (
          <FixtureCard key={m.slug} match={m} />
        ))}
      </div>

      <section className="card mt-8 p-5">
        <h2 className="section-title">Track record</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">
          Every prediction will be stored with its model version and locked at kickoff, then compared with the real result.
          This page will show accuracy, log loss, Brier score and calibration, so you can judge the model by its record.
        </p>
      </section>
    </div>
  );
}
