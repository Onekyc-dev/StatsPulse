import type { Metadata } from "next";
import { DataNotice } from "@/components/DataNotice";
import { LeagueBadge } from "@/components/LeagueBadge";
import { MatchesBrowser } from "@/components/MatchesBrowser";
import { loadMatches } from "@/lib/db";

export const metadata: Metadata = { title: "Matches" };
export const revalidate = 60;

export default async function MatchesPage() {
  const { matches, error } = await loadMatches(4, 21);
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="flex items-center gap-3 font-display text-3xl font-extrabold tracking-tight">
        <LeagueBadge size={30} />
        Matches
      </h1>
      <p className="mb-6 mt-1 text-sm text-white/55">Premier League fixtures and results, with the model&apos;s outlook. Times are UK time.</p>
      {matches.length === 0 ? <DataNotice error={error} /> : <MatchesBrowser matches={matches} />}
    </div>
  );
}
