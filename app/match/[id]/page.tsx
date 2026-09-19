import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DataNotice } from "@/components/DataNotice";
import { MatchHero } from "@/components/match/MatchHero";
import { OutlookCard } from "@/components/match/OutlookCard";
import { InsightsCard } from "@/components/match/InsightsCard";
import { MatchTabs } from "@/components/match/MatchTabs";
import { loadMatch } from "@/lib/db";

export const revalidate = 60;

type Props = { params: Promise<{ id: string }> };

function idFromSlug(slug: string): number {
  const last = slug.split("-").pop() ?? "";
  return /^\d+$/.test(last) ? Number(last) : NaN;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const n = idFromSlug(id);
  if (Number.isNaN(n)) return { title: "Match not found" };
  const { match } = await loadMatch(n);
  return { title: match ? `${match.home.name} v ${match.away.name}` : "Match" };
}

export default async function MatchPage({ params }: Props) {
  const { id } = await params;
  const n = idFromSlug(id);
  if (Number.isNaN(n)) notFound();

  const { match, h2h, error } = await loadMatch(n);
  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <DataNotice error={error} />
      </div>
    );
  }
  if (!match) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
      <MatchHero match={match} />

      <div className="mt-5 flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-6">
        <aside className="order-first flex flex-col gap-5 lg:sticky lg:top-24 lg:order-last">
          <OutlookCard match={match} />
          <InsightsCard match={match} />
        </aside>
        <MatchTabs match={match} h2h={h2h} />
      </div>
    </div>
  );
}
