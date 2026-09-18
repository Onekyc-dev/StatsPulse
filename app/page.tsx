import Link from "next/link";
import { ArrowRight, Shield, ShieldAlert, Sparkles } from "lucide-react";
import { Crest } from "@/components/Crest";
import { FixtureCard, StatusLabel } from "@/components/FixtureCard";
import { ProbBar } from "@/components/ProbBar";
import { featuredMatch, matches } from "@/data/matches";
import { withAlpha } from "@/lib/color";
import { buildInsights, getOutlook, leanHeadline } from "@/lib/outlook";

const pillars = [
  { icon: ShieldAlert, title: "Squad and absences", text: "Not just who is missing, but how much it changes the team." },
  { icon: Shield, title: "Team stability", text: "A transparent score for how settled each side is right now." },
  { icon: Sparkles, title: "Match outlook", text: "Probabilities from our own model, always shown as estimates." }
];

export default function HomePage() {
  const m = featuredMatch;
  const o = getOutlook(m);
  const insights = buildInsights(m, o).slice(0, 3);
  const rest = matches.filter((x) => x.slug !== m.slug);
  const glow = `radial-gradient(65% 100% at 0% 0%, ${withAlpha(m.home.color, 0.28)}, transparent 70%), radial-gradient(65% 100% at 100% 0%, ${withAlpha(m.away.color, 0.28)}, transparent 70%)`;

  return (
    <div className="mx-auto max-w-6xl space-y-9 px-4 py-6 sm:px-6 lg:px-8">
      <header>
        <p className="text-sm text-white/50">Friday 18 September</p>
        <h1 className="mt-1 font-display text-[28px] font-extrabold leading-tight tracking-tight sm:text-4xl">
          Today in the Premier League
        </h1>
      </header>

      <Link
        href={`/match/${m.slug}`}
        className="relative block overflow-hidden rounded-3xl border border-white/[0.08] bg-ink-900 transition-colors hover:border-pulse-500/40"
      >
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: glow }} />
        <div className="relative grid gap-6 p-5 sm:p-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <div className="flex items-center justify-between text-xs text-white/55">
              <span>Featured match</span>
              <span>Matchday {m.matchday}</span>
            </div>
            <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <div className="flex flex-col items-center gap-2.5 text-center">
                <Crest short={m.home.short} color={m.home.color} size={66} />
                <span className="font-display text-[15px] font-extrabold sm:text-lg">{m.home.name}</span>
              </div>
              <div className="px-1 text-center">
                <StatusLabel match={m} />
                <div className="mt-1 font-display text-[40px] font-extrabold leading-none tnum sm:text-5xl">{m.time}</div>
                <div className="mt-1.5 text-xs text-white/50">{m.dateLabel}</div>
              </div>
              <div className="flex flex-col items-center gap-2.5 text-center">
                <Crest short={m.away.short} color={m.away.color} size={66} />
                <span className="font-display text-[15px] font-extrabold sm:text-lg">{m.away.name}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-black/25 p-4">
            <div className="font-display text-lg font-extrabold leading-tight">{leanHeadline(m, o)}</div>
            <div className="mt-4">
              <ProbBar home={o.homeWin} draw={o.draw} away={o.awayWin} homeLabel={m.home.short} awayLabel={m.away.short} />
            </div>
            <ul className="mt-4 flex flex-col gap-2 border-t border-white/[0.07] pt-4">
              {insights.map((i, idx) => (
                <li key={idx} className="flex gap-2 text-[13px] leading-snug text-white/65">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-pulse-500" />
                  {i.text}
                </li>
              ))}
            </ul>
            <div className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-pulse-500">
              Open match intelligence
              <ArrowRight size={16} />
            </div>
          </div>
        </div>
      </Link>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="section-title">Coming up</h2>
          <Link href="/matches" className="text-sm font-semibold text-pulse-500">
            See all matches
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rest.map((x) => (
            <FixtureCard key={x.slug} match={x} />
          ))}
        </div>
      </section>

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
