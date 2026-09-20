import Link from "next/link";
import { ArrowRight, Shield, ShieldAlert, Sparkles } from "lucide-react";
import { Crest } from "@/components/Crest";
import { DataNotice } from "@/components/DataNotice";
import { FixtureCard, slim } from "@/components/FixtureCard";
import { LeagueBadge } from "@/components/LeagueBadge";
import { LiveCentre } from "@/components/LiveCentre";
import { ProbBar } from "@/components/ProbBar";
import { withAlpha } from "@/lib/color";
import { loadMatches } from "@/lib/db";
import { buildInsights, leanHeadline } from "@/lib/outlook";

export const revalidate = 60;

const pillars = [
  { icon: ShieldAlert, title: "Squad and absences", text: "Who is unavailable, straight from the data, for every match." },
  { icon: Shield, title: "Team stability", text: "A transparent score for how settled each side is, coming as lineup history builds." },
  { icon: Sparkles, title: "Match outlook", text: "Probabilities from our own model, stored and locked at kickoff." }
];

export default async function HomePage() {
  const { matches, error } = await loadMatches(3, 30);
  const live = matches.filter((m) => m.status === "LIVE");
  const upcoming = matches.filter((m) => m.status === "TODAY" || m.status === "UPCOMING");
  const results = matches.filter((m) => m.status === "FT").slice(-4).reverse();
  const featured = live[0] ?? upcoming[0] ?? null;
  const rest = upcoming.filter((m) => m.id !== featured?.id).slice(0, 6);
  const hasToday = matches.some((m) => m.status === "TODAY" || m.status === "LIVE");

  return (
    <div className="mx-auto max-w-6xl space-y-9 px-4 py-6 sm:px-6 lg:px-8">
      <header>
        <p className="flex items-center gap-2 text-sm text-white/50">
          <LeagueBadge size={18} />
          {featured ? featured.dateLabel : "Premier League"}
        </p>
        <h1 className="mt-1 font-display text-[28px] font-extrabold leading-tight tracking-tight sm:text-4xl">
          {hasToday ? "Today in the Premier League" : "Next up in the Premier League"}
        </h1>
      </header>

      {matches.length === 0 && <DataNotice error={error} />}

      {featured && (
        <Link
          href={`/match/${featured.slug}`}
          className="relative block overflow-hidden rounded-3xl border border-white/[0.08] bg-ink-900 transition-colors hover:border-pulse-500/40"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(65% 100% at 0% 0%, ${withAlpha(featured.home.color, 0.28)}, transparent 70%), radial-gradient(65% 100% at 100% 0%, ${withAlpha(featured.away.color, 0.28)}, transparent 70%)`
            }}
          />
          <div className="relative grid gap-6 p-5 sm:p-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div>
              <div className="flex items-center justify-between text-xs text-white/55">
                <span>Featured match</span>
                <span>{featured.matchday ? `Matchday ${featured.matchday}` : ""}</span>
              </div>
              <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <div className="flex flex-col items-center gap-2.5 text-center">
                  <Crest short={featured.home.short} color={featured.home.color} size={66} teamId={featured.home.id} name={featured.home.name} />
                  <span className="font-display text-[15px] font-extrabold sm:text-lg">{featured.home.name}</span>
                </div>
                <div className="px-1 text-center">
                  <LiveCentre match={slim(featured)} size="text-[40px] sm:text-5xl" subClass="text-xs text-white/50" />
                </div>
                <div className="flex flex-col items-center gap-2.5 text-center">
                  <Crest short={featured.away.short} color={featured.away.color} size={66} teamId={featured.away.id} name={featured.away.name} />
                  <span className="font-display text-[15px] font-extrabold sm:text-lg">{featured.away.name}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-black/25 p-4">
              {featured.outlook ? (
                <>
                  <div className="font-display text-lg font-extrabold leading-tight">{leanHeadline(featured)}</div>
                  <div className="mt-4">
                    <ProbBar
                      home={featured.outlook.homeWin}
                      draw={featured.outlook.draw}
                      away={featured.outlook.awayWin}
                      homeLabel={featured.home.short}
                      awayLabel={featured.away.short}
                    />
                  </div>
                  <ul className="mt-4 flex flex-col gap-2 border-t border-white/[0.07] pt-4">
                    {buildInsights(featured).slice(0, 3).map((i, idx) => (
                      <li key={idx} className="flex gap-2 text-[13px] leading-snug text-white/65">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-pulse-500" />
                        {i.text}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-sm text-white/55">Outlook appears within 30 days of kickoff.</p>
              )}
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-pulse-500">
                Open match intelligence
                <ArrowRight size={16} />
              </div>
            </div>
          </div>
        </Link>
      )}

      {rest.length > 0 && (
        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="section-title">Coming up</h2>
            <Link href="/matches" className="text-sm font-semibold text-pulse-500">
              See all matches
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {rest.map((m) => (
              <FixtureCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {results.length > 0 && (
        <section>
          <h2 className="section-title mb-3">Recent results</h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {results.map((m) => (
              <FixtureCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="section-title mb-3">What sits under every match</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {pillars.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.title} className="panel p-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pulse-500/10 text-pulse-500">
                  <Icon size={18} />
                </span>
                <div className="mt-3 font-display text-[15px] font-bold">{p.title}</div>
                <p className="mt-1 text-[13px] leading-relaxed text-white/55">{p.text}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
