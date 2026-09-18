import Link from "next/link";
import { ArrowLeft, BrainCircuit, CalendarDays, ShieldAlert, Target, Users, Zap } from "lucide-react";
import { featuredMatch, previousMatches } from "@/data/mockData";

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  await params;
  const m = featuredMatch;

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
      <Link href="/matches" className="mb-7 inline-flex items-center gap-2 text-sm text-white/40 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to matches</Link>

      <section className="panel overflow-hidden">
        <div className="border-b border-white/[0.06] px-5 py-5 md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-white/40">
            <span>{m.competition}</span>
            <span className="flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5" /> {m.kickoff}</span>
          </div>

          <div className="mx-auto flex max-w-2xl items-center justify-between py-10">
            <Club name={m.home} short={m.homeShort} />
            <div className="text-center"><div className="text-[11px] font-semibold tracking-widest text-pulse-400">UPCOMING</div><div className="mt-2 text-3xl font-semibold">20:00</div><div className="mt-1 text-xs text-white/35">Today</div></div>
            <Club name={m.away} short={m.awayShort} right />
          </div>
        </div>

        <div className="grid grid-cols-3 border-b border-white/[0.06] md:grid-cols-6">
          {["Overview", "Stats", "Form", "Lineups", "H2H", "Analysis"].map((x, i) => <div key={x} className={`px-2 py-4 text-center text-xs md:text-sm ${i === 0 ? "font-semibold text-pulse-400" : "text-white/40"}`}>{x}</div>)}
        </div>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_.8fr]">
        <div className="space-y-5">
          <section className="panel p-6">
            <div className="eyebrow">Match outlook</div>
            <h2 className="mt-2 text-2xl font-semibold">What StatPulse sees</h2>
            <p className="mt-4 leading-7 text-white/55">{m.prediction.summary} The model currently projects a {m.prediction.homeXg.toFixed(2)}–{m.prediction.awayXg.toFixed(2)} expected-goal profile and a {m.prediction.btts}% chance of both teams scoring.</p>
          </section>

          <section className="panel p-6">
            <div className="eyebrow">Team form</div>
            <div className="mt-5 grid gap-6 md:grid-cols-2"><Form title={m.home} /><Form title={m.away} /></div>
          </section>

          <section className="panel p-6">
            <div className="eyebrow">Key factors</div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <Factor icon={<ShieldAlert />} title="Availability" text="Injuries and suspensions will be incorporated when connected to the live data source." />
              <Factor icon={<Users />} title="Lineup continuity" text="Expected XI continuity will contribute to the team stability layer." />
              <Factor icon={<Target />} title="Chance profile" text={`Projected total goals: ${(m.prediction.homeXg + m.prediction.awayXg).toFixed(2)}.`} />
              <Factor icon={<Zap />} title="Match environment" text={`Projected ${m.prediction.corners} corners and ${m.prediction.cards} cards.`} />
            </div>
          </section>
        </div>

        <aside>
          <section className="panel p-6 lg:sticky lg:top-24">
            <div className="flex items-center gap-2 font-semibold"><BrainCircuit className="h-4 w-4 text-pulse-400" /> StatPulse Prediction</div>
            <div className="mt-6 text-center"><div className="text-xs text-white/35">Projected score</div><div className="mt-1 text-5xl font-semibold">{m.prediction.score}</div></div>

            <div className="mt-7 space-y-3">
              {[
                ["Home win", `${m.prediction.homeWin}%`],
                ["Draw", `${m.prediction.draw}%`],
                ["Away win", `${m.prediction.awayWin}%`],
                ["BTTS", `${m.prediction.btts}%`],
                ["Expected goals", `${m.prediction.homeXg} · ${m.prediction.awayXg}`],
                ["Corners", `${m.prediction.corners}`],
                ["Shots", `${m.prediction.shots}`],
                ["Cards", `${m.prediction.cards}`]
              ].map(([a, b]) => <div key={a} className="flex justify-between border-b border-white/[0.05] py-2 text-sm"><span className="text-white/45">{a}</span><span className="font-medium">{b}</span></div>)}
            </div>
            <p className="mt-5 text-[11px] leading-5 text-white/30">Estimates are model outputs and can change when lineups, injuries and live match data are incorporated.</p>
          </section>
        </aside>
      </div>

      <section className="mt-5 panel p-6">
        <div className="eyebrow">Previous matches</div>
        <h2 className="mt-2 text-xl font-semibold">Brentford recent form</h2>
        <div className="mt-5 divide-y divide-white/[0.05]">
          {previousMatches.map(x => <div key={x.date} className="flex items-center justify-between py-3 text-sm"><span className="text-white/35">{x.date}</span><span className="flex-1 px-5">{x.opponent}</span><span className="w-8 text-center font-semibold text-pulse-400">{x.result}</span><span className="w-12 text-right">{x.score}</span></div>)}
        </div>
      </section>
    </div>
  );
}

function Club({ name, short, right = false }: { name: string; short: string; right?: boolean }) {
  return <div className={`flex items-center gap-3 ${right ? "flex-row-reverse text-right" : ""}`}><div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-xl font-bold">{short[0]}</div><div><div className="font-semibold md:text-lg">{name}</div><div className="text-xs text-white/35">{short}</div></div></div>;
}
function Form({ title }: { title: string }) {
  return <div><div className="mb-3 text-sm font-medium">{title}</div><div className="flex gap-2">{["W", "D", "W", "L", "W"].map((x, i) => <span key={i} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] text-xs text-pulse-400">{x}</span>)}</div></div>;
}
function Factor({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4"><div className="flex items-center gap-2 text-sm font-semibold"><span className="text-pulse-400 [&>svg]:h-4 [&>svg]:w-4">{icon}</span>{title}</div><p className="mt-2 text-xs leading-5 text-white/40">{text}</p></div>;
}