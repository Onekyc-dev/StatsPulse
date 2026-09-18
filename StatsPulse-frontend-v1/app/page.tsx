import Link from "next/link";
import { ArrowRight, BarChart3, BrainCircuit, ShieldAlert, Trophy, Activity } from "lucide-react";
import { MatchCard } from "@/components/MatchCard";
import { PredictionCard } from "@/components/PredictionCard";
import { featuredMatch } from "@/data/mockData";

export default function HomePage() {
  return (
    <div>
      <section className="mx-auto max-w-7xl px-5 pb-16 pt-16 md:px-8 md:pt-24">
        <div className="max-w-3xl">
          <div className="eyebrow mb-5">Sports intelligence</div>
          <h1 className="text-5xl font-semibold leading-[1.02] tracking-[-0.045em] md:text-7xl">
            See beneath<br />the surface.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-white/55 md:text-lg">
            StatPulse turns match data into context — form, availability, trends and predictions that help you understand what is really driving a game.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/matches" className="rounded-xl bg-pulse-500 px-5 py-3 text-sm font-semibold text-black hover:bg-pulse-400">
              Explore matches <ArrowRight className="ml-2 inline h-4 w-4" />
            </Link>
            <Link href="/match/brentford-chelsea" className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-white/80 hover:bg-white/5">
              View match intelligence
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 pb-16 md:grid-cols-[1.4fr_.8fr] md:px-8">
        <MatchCard match={featuredMatch} />
        <PredictionCard prediction={featuredMatch.prediction} />
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 md:px-8">
        <div className="mb-6">
          <div className="eyebrow">What StatPulse sees</div>
          <h2 className="mt-2 text-2xl font-semibold">More than the score</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Insight icon={<BarChart3 />} title="Team stability" text="Availability, lineup continuity and recent changes build a clearer picture of team stability." />
          <Insight icon={<ShieldAlert />} title="Match context" text="Look beyond wins and losses with form, absences, trends and head-to-head context." />
          <Insight icon={<BrainCircuit />} title="Model intelligence" text="StatPulse turns historical and current data into transparent probability estimates." />
        </div>
      </section>

      <section className="border-t border-white/[0.06]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-3 md:px-8">
          <Feature icon={<Trophy />} title="Match context" text="Form, head-to-head, lineups and team stability in one place." />
          <Feature icon={<Activity />} title="Live intelligence" text="A foundation for live events, momentum and changing match probabilities." />
          <Feature icon={<BrainCircuit />} title="Our own model" text="Predictions built from data, then tracked against what actually happened." />
        </div>
      </section>
    </div>
  );
}

function Insight({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="panel p-6"><div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-pulse-500/10 text-pulse-400 [&>svg]:h-5 [&>svg]:w-5">{icon}</div><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-white/45">{text}</p></div>;
}
function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div><div className="text-pulse-400 [&>svg]:h-5 [&>svg]:w-5">{icon}</div><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-white/45">{text}</p></div>;
}