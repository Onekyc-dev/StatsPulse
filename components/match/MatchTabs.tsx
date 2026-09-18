"use client";

import { useState } from "react";
import { Activity, Clock, History, Lock, Swords } from "lucide-react";
import { Crest } from "@/components/Crest";
import { FormPills } from "@/components/FormPills";
import { Pitch } from "./Pitch";
import { getOutlook } from "@/lib/outlook";
import { STABILITY_FACTORS, stabilityLabel, stabilityScore } from "@/lib/stability";
import type { Absence, Impact, Match, Ratings, TeamData } from "@/lib/types";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "lineups", label: "Lineups" },
  { key: "absences", label: "Absences" },
  { key: "stability", label: "Stability" },
  { key: "h2h", label: "Head to head" },
  { key: "live", label: "Live and history" }
] as const;

type TabKey = (typeof TABS)[number]["key"];

/* ---------- small shared pieces ---------- */

function TeamTitle({ team }: { team: TeamData }) {
  return (
    <div className="flex items-center gap-2.5">
      <Crest short={team.short} color={team.color} size={28} />
      <span className="font-display text-[15px] font-bold tracking-tight">{team.name}</span>
    </div>
  );
}

function TeamToggle({ match, value, onChange }: { match: Match; value: "home" | "away"; onChange: (v: "home" | "away") => void }) {
  const opts: { key: "home" | "away"; team: TeamData }[] = [
    { key: "home", team: match.home },
    { key: "away", team: match.away }
  ];
  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] p-1" role="group" aria-label="Choose team">
      {opts.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          aria-pressed={value === o.key}
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
            value === o.key ? "bg-pulse-500 text-[#03100c]" : "text-white/60 hover:text-white"
          }`}
        >
          {o.team.name}
        </button>
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, title, text }: { icon: typeof Clock; title: string; text: string }) {
  return (
    <div className="card flex flex-col items-center px-6 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pulse-500/10 text-pulse-500">
        <Icon size={22} />
      </span>
      <h3 className="mt-4 font-display text-base font-bold">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-white/55">{text}</p>
    </div>
  );
}

/* ---------- Overview ---------- */

const RATING_ROWS: { key: keyof Ratings; label: string }[] = [
  { key: "attack", label: "Attacking strength" },
  { key: "defence", label: "Defensive stability" },
  { key: "midfield", label: "Midfield control" },
  { key: "setPieces", label: "Set-piece threat" },
  { key: "depth", label: "Squad depth" }
];

function Overview({ match }: { match: Match }) {
  const o = getOutlook(match);
  const tiles = [
    { label: "Over 2.5 goals", value: `${o.over25}%` },
    { label: "Both teams score", value: `${o.btts}%` },
    { label: "Corners (demo)", value: match.corners.toFixed(1) },
    { label: "Cards (demo)", value: match.cards.toFixed(1) }
  ];

  return (
    <div className="flex flex-col gap-5">
      <section className="card p-5">
        <h3 className="section-title">Recent form</h3>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          {[match.home, match.away].map((t) => (
            <div key={t.short} className="panel p-4">
              <TeamTitle team={t} />
              <div className="mt-3">
                <FormPills form={t.form} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                <div>
                  <div className="font-display text-xl font-extrabold tnum">{t.avgScored.toFixed(1)}</div>
                  <div className="text-[11px] text-white/45">Scored per match</div>
                </div>
                <div>
                  <div className="font-display text-xl font-extrabold tnum">{t.avgConceded.toFixed(1)}</div>
                  <div className="text-[11px] text-white/45">Conceded per match</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11.5px] text-white/40">Oldest to newest. The ringed result is the latest match.</p>
      </section>

      <section className="card p-5">
        <div className="flex items-center justify-between">
          <h3 className="section-title">Key match factors</h3>
          <div className="flex items-center gap-3 text-[11px] text-white/55">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-pulse-500" />
              {match.home.short}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-away" />
              {match.away.short}
            </span>
          </div>
        </div>
        <ul className="mt-4 flex flex-col gap-4">
          {RATING_ROWS.map((r) => {
            const h = match.home.ratings[r.key];
            const a = match.away.ratings[r.key];
            const share = (h / (h + a)) * 100;
            return (
              <li key={r.key}>
                <div className="mb-1.5 flex items-baseline justify-between text-[13px]">
                  <span className="font-display font-bold tnum text-pulse-500">{h.toFixed(1)}</span>
                  <span className="text-white/60">{r.label}</span>
                  <span className="font-display font-bold tnum text-away">{a.toFixed(1)}</span>
                </div>
                <div className="flex h-2 gap-[3px] overflow-hidden rounded-full">
                  <div className="rounded-full bg-pulse-500" style={{ width: `${share}%` }} />
                  <div className="rounded-full bg-away" style={{ width: `${100 - share}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="card p-5">
        <h3 className="section-title">Related estimates</h3>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {tiles.map((t) => (
            <div key={t.label} className="panel px-3 py-4 text-center">
              <div className="font-display text-xl font-extrabold tnum">{t.value}</div>
              <div className="mt-1 text-[11px] leading-tight text-white/45">{t.label}</div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[12.5px] leading-relaxed text-white/50">
          How it works: each team&apos;s expected goals feed a Poisson model that scores every possible result, then adds them up
          into the numbers above. Corners and cards are placeholders until they have their own models. Every market will be
          tested against past matches before it is shown as a prediction.
        </p>
      </section>
    </div>
  );
}

/* ---------- Lineups ---------- */

function Lineups({ match }: { match: Match }) {
  const [side, setSide] = useState<"home" | "away">("home");
  const team = side === "home" ? match.home : match.away;
  return (
    <div className="flex flex-col gap-4">
      <TeamToggle match={match} value={side} onChange={setSide} />
      <section className="card p-5">
        <div className="flex items-center justify-between">
          <TeamTitle team={team} />
          <span className="rounded-full border border-draw/30 bg-draw/10 px-2.5 py-0.5 text-[11px] font-semibold text-draw">
            Expected XI, {team.formation}
          </span>
        </div>
        <div className="mt-4">
          <Pitch formation={team.formation} color={team.color} />
        </div>
        <p className="mt-4 text-[12.5px] leading-relaxed text-white/50">
          This is the expected shape. Player names appear when live lineups are connected. When the official XI is announced,
          StatPulse will compare it with this one, recalculate the outlook and explain what moved.
        </p>
      </section>
    </div>
  );
}

/* ---------- Absences ---------- */

const impactStyle: Record<Impact, string> = {
  High: "bg-loss/15 text-loss",
  Medium: "bg-draw/15 text-draw",
  Low: "bg-white/10 text-white/60"
};

function AbsenceCard({ a }: { a: Absence }) {
  return (
    <li className="panel p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-display text-[15px] font-bold">{a.position}</span>
        <span className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/80">
          {a.status}, {a.reason.toLowerCase()}
        </span>
        <span className={`ml-auto rounded-md px-2 py-0.5 text-[11px] font-bold ${impactStyle[a.impact]}`}>{a.impact} impact</span>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-white/60">{a.why}</p>
    </li>
  );
}

function Absences({ match }: { match: Match }) {
  return (
    <div className="flex flex-col gap-5">
      {[match.home, match.away].map((t) => (
        <section key={t.short} className="card p-5">
          <TeamTitle team={t} />
          {t.absences.length === 0 ? (
            <p className="mt-4 text-sm text-white/55">No reported absences.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {t.absences.map((a, i) => (
                <AbsenceCard key={i} a={a} />
              ))}
            </ul>
          )}
        </section>
      ))}
      <p className="text-[12px] leading-relaxed text-white/40">
        Impact reflects how much the absence changes the team, not just who is missing. Demo entries are described by position.
      </p>
    </div>
  );
}

/* ---------- Stability ---------- */

function Stability({ match }: { match: Match }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 md:grid-cols-2">
        {[match.home, match.away].map((t) => {
          const score = stabilityScore(t.stability);
          return (
            <section key={t.short} className="card p-5">
              <TeamTitle team={t} />
              <div className="mt-4 flex items-end gap-3">
                <div className="font-display text-5xl font-extrabold leading-none tnum">{score}</div>
                <div className="pb-1">
                  <div className="text-sm font-semibold text-pulse-400">{stabilityLabel(score)}</div>
                  <div className="text-[11px] text-white/40">out of 100</div>
                </div>
              </div>
              <ul className="mt-5 flex flex-col gap-3.5">
                {STABILITY_FACTORS.map((f) => (
                  <li key={f.key}>
                    <div className="mb-1.5 flex items-baseline justify-between text-[13px]">
                      <span className="text-white/70">
                        {f.label} <span className="text-[11px] text-white/35">{Math.round(f.weight * 100)}%</span>
                      </span>
                      <span className="font-display font-bold tnum">{t.stability[f.key]}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                      <div className="h-full rounded-full bg-pulse-500" style={{ width: `${t.stability[f.key]}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      <p className="text-[12px] leading-relaxed text-white/40">
        Stability is a weighted average of the five factors, with the weights shown beside each one. Inputs are demo values.
      </p>
    </div>
  );
}

/* ---------- Head to head ---------- */

function HeadToHead() {
  return (
    <EmptyState
      icon={Swords}
      title="Previous meetings are not connected yet"
      text="Once match history is stored, this tab will show past results between these teams with context, such as who was missing and how the model saw it."
    />
  );
}

/* ---------- Live and history ---------- */

function LiveAndHistory({ match }: { match: Match }) {
  return (
    <div className="flex flex-col gap-5">
      <section className="card p-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Activity size={16} className="text-pulse-500" />
          Live intelligence
        </div>
        <p className="mt-3 text-sm leading-relaxed text-white/60">
          Starts at kickoff ({match.time}). You will see the score, shots, corners, cards, momentum and win probabilities that
          shift as the match develops, with a short explanation of every big change.
        </p>
      </section>

      <section className="card p-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Clock size={16} className="text-pulse-500" />
          Intelligence timeline
        </div>
        <p className="mt-3 text-sm leading-relaxed text-white/60">
          Lineups, injuries, goals and cards will be listed here, each with how much it moved the outlook.
        </p>
      </section>

      <section className="card p-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Lock size={16} className="text-pulse-500" />
          Prediction ledger
        </div>
        <dl className="mt-4 divide-y divide-white/[0.06] text-[13px]">
          <div className="flex justify-between gap-4 py-2.5">
            <dt className="text-white/50">Model</dt>
            <dd className="font-semibold">Baseline Poisson, version 0.1</dd>
          </div>
          <div className="flex justify-between gap-4 py-2.5">
            <dt className="text-white/50">Status</dt>
            <dd className="font-semibold text-pulse-400">Open until kickoff</dd>
          </div>
          <div className="flex justify-between gap-4 py-2.5">
            <dt className="text-white/50">At kickoff</dt>
            <dd className="text-right font-semibold">Prediction is locked and timestamped</dd>
          </div>
        </dl>
        <p className="mt-3 flex gap-2 text-[12.5px] leading-relaxed text-white/50">
          <History size={14} className="mt-0.5 shrink-0" />
          After the final whistle the locked prediction is compared with the result and added to the model&apos;s track record.
        </p>
      </section>
    </div>
  );
}

/* ---------- Tabs ---------- */

export function MatchTabs({ match }: { match: Match }) {
  const [tab, setTab] = useState<TabKey>("overview");

  return (
    <div className="min-w-0">
      <div className="sticky top-16 z-30 -mx-4 border-b border-white/[0.06] bg-ink/90 px-4 backdrop-blur-xl sm:mx-0 sm:rounded-t-2xl sm:px-2">
        <div role="tablist" aria-label="Match sections" className="no-scrollbar flex gap-1 overflow-x-auto">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                role="tab"
                id={`tab-${t.key}`}
                aria-selected={active}
                aria-controls="match-panel"
                onClick={() => setTab(t.key)}
                className={`relative shrink-0 whitespace-nowrap px-3.5 py-3.5 text-sm font-semibold transition-colors ${
                  active ? "text-white" : "text-white/50 hover:text-white/80"
                }`}
              >
                {t.label}
                {active && <span className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-pulse-500" />}
              </button>
            );
          })}
        </div>
      </div>

      <div id="match-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="pt-5">
        {tab === "overview" && <Overview match={match} />}
        {tab === "lineups" && <Lineups match={match} />}
        {tab === "absences" && <Absences match={match} />}
        {tab === "stability" && <Stability match={match} />}
        {tab === "h2h" && <HeadToHead />}
        {tab === "live" && <LiveAndHistory match={match} />}
      </div>
    </div>
  );
}
