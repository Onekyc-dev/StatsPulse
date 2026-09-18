import { matches } from "@/data/mockData";
import { MatchCard } from "@/components/MatchCard";

export default function MatchesPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-12 md:px-8">
      <div className="mb-10">
        <div className="eyebrow">Fixtures</div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Matches</h1>
        <p className="mt-3 text-white/45">Explore upcoming, live and completed matches.</p>
      </div>
      <div className="mb-6 flex gap-2 overflow-x-auto text-sm">
        <button className="rounded-lg bg-pulse-500 px-4 py-2 font-semibold text-black">All</button>
        <button className="rounded-lg border border-white/10 px-4 py-2 text-white/50">Today</button>
        <button className="rounded-lg border border-white/10 px-4 py-2 text-white/50">Upcoming</button>
        <button className="rounded-lg border border-white/10 px-4 py-2 text-white/50">Completed</button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">{matches.map(m => <MatchCard key={m.slug} match={m} />)}</div>
    </div>
  );
}