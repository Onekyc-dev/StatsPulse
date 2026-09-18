import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MatchHero } from "@/components/match/MatchHero";
import { OutlookCard } from "@/components/match/OutlookCard";
import { InsightsCard } from "@/components/match/InsightsCard";
import { MatchTabs } from "@/components/match/MatchTabs";
import { getMatch, matches } from "@/data/matches";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return matches.map((m) => ({ id: m.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const match = getMatch(id);
  return { title: match ? `${match.home.name} v ${match.away.name}` : "Match not found" };
}

export default async function MatchPage({ params }: Props) {
  const { id } = await params;
  const match = getMatch(id);
  if (!match) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
      <MatchHero match={match} />

      <div className="mt-5 flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-6">
        <aside className="order-first flex flex-col gap-5 lg:sticky lg:top-24 lg:order-last">
          <OutlookCard match={match} />
          <InsightsCard match={match} />
        </aside>
        <MatchTabs match={match} />
      </div>
    </div>
  );
}
