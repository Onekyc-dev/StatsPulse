import type { Metadata } from "next";
import { MatchesBrowser } from "@/components/MatchesBrowser";
import { matches } from "@/data/matches";

export const metadata: Metadata = { title: "Matches" };

export default function MatchesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Matches</h1>
      <p className="mt-1 mb-6 text-sm text-white/55">Premier League fixtures with the model&apos;s outlook for each.</p>
      <MatchesBrowser matches={matches} />
    </div>
  );
}
