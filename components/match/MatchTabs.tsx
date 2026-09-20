"use client";

import { useState } from "react";
import { Activity, Clock, History, Lock, Swords, Users } from "lucide-react";
import { Crest } from "@/components/Crest";
import { FormPills } from "@/components/FormPills";
import { niceTime } from "@/lib/format";
import { parseTeamLineup, surname } from "@/lib/lineups";
import { absencesKnown } from "@/lib/outlook";
import { LineupPitch } from "./LineupPitch";
import type { Absence, H2H, Match, TeamView } from "@/lib/types";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "lineups", label: "Lineups" },
  { key: "absences", label: "Absences" },
  { key: "stability", label: "Stability" },
  { key: "h2h", label: "Head to head" },
  { key: "live", label: "Live and history" }
] as const;
type TabKey = (typeof TABS)[number]["key"];

function TeamTitle({ team }: { team: TeamView }) {
  return (
    <div className="flex items-center gap-2.5">
      <Crest short={team.short} color={team.color} size={28} />
      <span className="font-display text-[15px] font-bold tracking-tight">{team.name}</span>
    </div>
  );
}

function TeamToggle({ match, value, onChange }: { match: Match; value: "home" | "away"; onChange: (v: "home" | "away") => void }) {
  const opts = [
    { key: "home" as const, team: match.home },
    { key: "away" as const, team: match.away }
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

function factorRows(match: Match) {
  const pts = (f: string[]) => f.reduce((s, r) => s + (r === "W" ? 3 : r === "D" ? 1 : 0), 0);
  const formScore = (t: TeamView) => (t.form.length ? Math.round((pts(t.form) / (t.form.length * 3)) * 100) / 10 : null);
  return [
    { label: "Attacking strength", h: match.home.attack, a: match.away.attack },
    { label: "Defensive strength", h: match.home.defence, a: match.away.defence },
    { label: "Recent form", h: formScore(match.home), a: formScore(match.away) }
  ];
}

function Overview({ match }: { match: Match }) {
  const o = match.outlook;
  const tiles = o
    ? [
        { label: "Over 2.5 goals", value: `${o.over25}%` },
        { label: "Both teams score", value: `${o.btts}%` },
        { label: "Home model goals", value: o.homeXg.toFixed(2) },
        { label: "Away model goals", value: o.awayXg.toFixed(2) }
      ]
    : [];

  return (
    <div className="flex flex-col gap-5">
      <section className="card p-5">
        <h3 className="section-title">Recent form</h3>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          {[match.home, match.away].map((t) => (
            <div key={t.id} className="panel p-4">
              <TeamTitle team={t} />
              <div className="mt-3">{t.form.length ? <FormPills form={t.form} /> : <span className="text-sm text-white/45">No matches yet</span>}</div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                <div>
                  <div className="font-display text-xl font-extrabold tnum">{t.avgScored ?? "-"}</div>
                  <div className="text-[11px] text-white/45">Scored per match</div>
                </div>
                <div>
                  <div className="font-display text-xl font-extrabold tnum">{t.avgConceded ?? "-"}</div>
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
          {factorRows(match).map((r) => {
            if (r.h === null || r.a === null) return null;
            const share = (r.h / (r.h + r.a)) * 100;
            return (
              <li key={r.label}>
                <div className="mb-1.5 flex items-baseline justify-between text-[13px]">
                  <span className="font-display font-bold tnum text-pulse-500">{r.h.toFixed(1)}</span>
                  <span className="text-white/60">{r.label}</span>
                  <span className="font-display font-bold tnum text-away">{r.a.toFixed(1)}</span>
                </div>
                <div className="flex h-2 gap-[3px] overflow-hidden rounded-full">
                  <div className="rounded-full bg-pulse-500" style={{ width: `${share}%` }} />
                  <div className="rounded-full bg-away" style={{ width: `${100 - share}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-[12px] leading-relaxed text-white/40">
          Ratings are out of 10, where 5 is an average Premier League team. They come from results, with recent matches counting more.
        </p>
      </section>

      {tiles.length > 0 && (
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
            How it works: each team gets an attack and defence strength from past results. Those give expected goals for this match,
            and a Poisson model turns them into the chances above.
          </p>
        </section>
      )}
    </div>
  );
}

/* ---------- Lineups ---------- */

const lineupLabel: Record<string, string> = {
  confirmed: "Confirmed XI",
  predicted: "Predicted XI",
  unavailable: "Not available yet",
  unknown: "Not collected yet"
};

function Lineups({ match }: { match: Match }) {
  const [side, setSide] = useState<"home" | "away">("home");
  const team = side === "home" ? match.home : match.away;
  const lineup = parseTeamLineup(match.lineupRaw, side);
  const label = lineupLabel[match.lineupStatus] ?? match.lineupStatus;

  return (
    <div className="flex flex-col gap-4">
      <TeamToggle match={match} value={side} onChange={setSide} />
      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TeamTitle team={team} />
          <div className="flex items-center gap-2">
            {lineup?.formation && (
              <span className="rounded-full border border-white/[0.12] bg-white/[0.05] px-2.5 py-0.5 text-[11px] font-bold tnum">{lineup.formation}</span>
            )}
            <span className="rounded-full border border-draw/30 bg-draw/10 px-2.5 py-0.5 text-[11px] font-semibold text-draw">{label}</span>
          </div>
        </div>

        {lineup ? (
          <>
            <div className="mt-4">
              <LineupPitch lineup={lineup} color={team.color} />
            </div>
            {lineup.subs.length > 0 && (
              <div className="mt-5">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/40">Bench</div>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px] text-white/65">
                  {lineup.subs.map((p) => (
                    <li key={p.id} className="flex gap-2">
                      <span className="w-5 shrink-0 text-right text-[11px] font-bold text-white/30">{p.number ?? ""}</span>
                      <span className="truncate">{surname(p)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <p className="mt-4 text-sm leading-relaxed text-white/55">
            No lineup exists yet. A predicted XI usually appears about two weeks before kickoff, and the confirmed one shortly before the match.
          </p>
        )}
        <p className="mt-4 text-[12.5px] leading-relaxed text-white/45">
          The gold ring marks the captain. When the official XI is announced, StatPulse will compare it with the predicted one and explain what changed.
        </p>
      </section>
    </div>
  );
}

/* ---------- Absences ---------- */

function statusText(status: string, reason: string): { label: string; tone: string } {
  if (reason === "coach_decision" || status === "coach_decision") return { label: "Not selected", tone: "bg-white/10 text-white/70" };
  if (status === "suspended") return { label: "Suspended", tone: "bg-loss/15 text-loss" };
  if (status === "doubtful") return { label: "Doubtful", tone: "bg-draw/15 text-draw" };
  return { label: "Injured", tone: "bg-loss/15 text-loss" };
}

const impactTone: Record<string, string> = {
  High: "bg-loss/15 text-loss",
  Medium: "bg-draw/15 text-draw",
  Low: "bg-white/10 text-white/60",
  Unknown: "bg-white/10 text-white/50"
};

function impactText(a: Absence): string {
  if (a.impact === null || a.of === null) return "";
  if (a.impact === "Unknown") return "Not enough recent lineups to judge how much this matters.";
  const s = `Started ${a.started ?? 0} of the last ${a.of} matches.`;
  if (a.impact === "High") return `${s} A regular starter, so the usual eleven has to change.`;
  if (a.impact === "Medium") return `${s} A frequent starter.`;
  return `${s} Mostly a squad player, so the effect on the team is small.`;
}

function Absences({ match }: { match: Match }) {
  if (!absencesKnown(match)) {
    return (
      <EmptyState
        icon={Clock}
        title="Injury news is not available yet"
        text="Injuries and suspensions appear about two weeks before kickoff, when the data provider starts publishing lineup information."
      />
    );
  }
  return (
    <div className="flex flex-col gap-5">
      {[match.home, match.away].map((t) => (
        <section key={t.id} className="card p-5">
          <TeamTitle team={t} />
          {t.absences.length === 0 ? (
            <p className="mt-4 text-sm text-white/55">No unavailable players listed.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-2.5">
              {[...t.absences]
                .sort((x, y) => (["High", "Medium", "Low", "Unknown"].indexOf(x.impact ?? "Unknown")) - (["High", "Medium", "Low", "Unknown"].indexOf(y.impact ?? "Unknown")))
                .map((a) => {
                  const s = statusText(a.status, a.reason);
                  const reason = a.reason && a.reason !== "coach_decision" ? a.reason : "Coach decision";
                  const note = impactText(a);
                  return (
                    <li key={a.id} className="panel p-3.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-[15px] font-bold">{a.name}</span>
                        <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${s.tone}`}>{s.label}</span>
                        {a.impact && a.impact !== "Unknown" && (
                          <span className={`ml-auto rounded-md px-2 py-0.5 text-[11px] font-bold ${impactTone[a.impact]}`}>{a.impact} impact</span>
                        )}
                      </div>
                      <div className="mt-1.5 text-[12.5px] text-white/50">{reason.replace(/_/g, " ")}</div>
                      {note && <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/60">{note}</p>}
                    </li>
                  );
                })}
            </ul>
          )}
        </section>
      ))}
      <p className="text-[12px] leading-relaxed text-white/40">
        Impact comes from how often the player started the team&apos;s last five matches, using stored lineups. It is not a judgement of quality.
      </p>
    </div>
  );
}

/* ---------- Stability ---------- */

function StabilityCard({ team, note }: { team: TeamView; note: string }) {
  const s = team.stability;
  return (
    <section className="card p-5">
      <TeamTitle team={team} />
      {!s ? (
        <p className="mt-4 text-sm leading-relaxed text-white/55">{note}</p>
      ) : (
        <>
          <div className="mt-4 flex items-end gap-3">
            <div className="font-display text-5xl font-extrabold leading-none tnum">{s.score}</div>
            <div className="pb-1">
              <div className="text-sm font-semibold text-pulse-400">{s.label}</div>
              <div className="text-[11px] text-white/40">out of 100</div>
            </div>
          </div>
          <p className="mt-3 text-[12.5px] leading-relaxed text-white/50">
            {s.changes === 0 ? "The same eleven as last time." : `${s.changes} ${s.changes === 1 ? "change" : "changes"} to the eleven since the last match.`} Compared with the last {s.comparedWith} {s.comparedWith === 1 ? "match" : "matches"}.
          </p>
          <ul className="mt-5 flex flex-col gap-3.5">
            {s.factors.map((f) => (
              <li key={f.key}>
                <div className="mb-1.5 flex items-baseline justify-between text-[13px]">
                  <span className="text-white/70">
                    {f.label} <span className="text-[11px] text-white/35">{Math.round(f.weight * 100)}%</span>
                  </span>
                  <span className="font-display font-bold tnum">{f.value}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                  <div className="h-full rounded-full bg-pulse-500" style={{ width: `${f.value}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function Stability({ match }: { match: Match }) {
  const note = "Needs a predicted or confirmed eleven, which appears about two weeks before kickoff, and earlier matches with stored lineups.";
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 md:grid-cols-2">
        <StabilityCard team={match.home} note={note} />
        <StabilityCard team={match.away} note={note} />
      </div>
      <p className="text-[12px] leading-relaxed text-white/40">
        Stability is a weighted average of the five factors, with the weights shown beside each one. It only uses lineups stored since this season began, so it gets sharper each match.
      </p>
    </div>
  );
}

/* ---------- Head to head ---------- */

function HeadToHead({ match, h2h }: { match: Match; h2h: H2H | null }) {
  if (!h2h) {
    return <EmptyState icon={Swords} title="No previous meetings found" text="Past results between these teams will appear here when the data provider has them." />;
  }
  return (
    <div className="flex flex-col gap-5">
      <section className="card p-5">
        <h3 className="section-title">Last {h2h.total} meetings</h3>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div className="panel px-2 py-4">
            <div className="font-display text-2xl font-extrabold tnum text-pulse-500">{h2h.homeWins}</div>
            <div className="mt-1 truncate text-[11px] text-white/45">{match.home.name} wins</div>
          </div>
          <div className="panel px-2 py-4">
            <div className="font-display text-2xl font-extrabold tnum">{h2h.draws}</div>
            <div className="mt-1 text-[11px] text-white/45">Draws</div>
          </div>
          <div className="panel px-2 py-4">
            <div className="font-display text-2xl font-extrabold tnum text-away">{h2h.awayWins}</div>
            <div className="mt-1 truncate text-[11px] text-white/45">{match.away.name} wins</div>
          </div>
        </div>
        {h2h.avgGoals !== null && <p className="mt-4 text-[13px] text-white/55">{h2h.avgGoals} goals per meeting on average.</p>}
      </section>

      {h2h.recent.length > 0 && (
        <section className="card p-5">
          <h3 className="section-title">Recent meetings</h3>
          <ul className="mt-4 flex flex-col gap-2">
            {h2h.recent.map((m, i) => (
              <li key={i} className="panel flex items-center gap-3 px-3.5 py-3 text-[13px]">
                <span className="w-16 shrink-0 text-[11px] text-white/40">{m.date.slice(0, 10)}</span>
                <span className="min-w-0 flex-1 truncate">
                  {m.home} v {m.away}
                </span>
                <span className="font-display font-extrabold tnum">{m.score}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/* ---------- Live and history ---------- */

function outcomeOf(m: Match): 0 | 1 | 2 | null {
  if (!m.score) return null;
  return m.score.home > m.score.away ? 0 : m.score.home === m.score.away ? 1 : 2;
}

function LiveAndHistory({ match }: { match: Match }) {
  const o = match.outlook;
  const led = match.ledger;
  const out = match.status === "FT" ? outcomeOf(match) : null;
  const probs = o ? [o.homeWin, o.draw, o.awayWin] : null;
  const outcomeName = out === 0 ? `${match.home.name} win` : out === 1 ? "a draw" : out === 2 ? `${match.away.name} win` : "";

  return (
    <div className="flex flex-col gap-5">
      {match.status === "FT" && match.score && (
        <section className="card p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <History size={16} className="text-pulse-500" />
            Prediction versus reality
          </div>
          <p className="mt-3 text-sm leading-relaxed text-white/65">
            Final score {match.home.name} {match.score.home}–{match.score.away} {match.away.name}, so the result was {outcomeName}.
            {probs && out !== null
              ? ` The stored prediction gave that outcome ${probs[out]}%.`
              : " No prediction was stored for this match before kickoff."}
          </p>
        </section>
      )}

      <section className="card p-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Lock size={16} className="text-pulse-500" />
          Prediction ledger
        </div>
        {led ? (
          <dl className="mt-4 divide-y divide-white/[0.06] text-[13px]">
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-white/50">Model</dt>
              <dd className="font-semibold">{led.modelVersion}</dd>
            </div>
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-white/50">First stored</dt>
              <dd className="text-right font-semibold">{niceTime(led.createdAt)}</dd>
            </div>
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-white/50">Status</dt>
              <dd className={`text-right font-semibold ${led.lockedAt ? "text-draw" : "text-pulse-400"}`}>
                {led.lockedAt ? `Locked at kickoff, ${niceTime(led.lockedAt)}` : "Open until kickoff"}
              </dd>
            </div>
            {!led.lockedAt && (
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="text-white/50">Last updated</dt>
                <dd className="text-right font-semibold">{niceTime(led.updatedAt)}</dd>
              </div>
            )}
          </dl>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-white/55">
            No prediction was stored for this match. Predictions are stored within 30 days of kickoff and locked when the match starts.
          </p>
        )}
        {match.provider && (
          <p className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.03] p-3.5 text-[12.5px] leading-relaxed text-white/60">
            Second opinion from the data provider&apos;s own model: {match.home.short} {match.provider.homeWin}%, draw {match.provider.draw}%, {match.away.short} {match.provider.awayWin}%.
          </p>
        )}
      </section>

      <section className="card p-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Clock size={16} className="text-pulse-500" />
          Intelligence timeline
        </div>
        {match.timeline.length === 0 ? (
          <p className="mt-3 text-sm leading-relaxed text-white/60">
            No lineup changes recorded yet. When lineups are published or confirmed, each change is logged here automatically.
          </p>
        ) : (
          <ol className="mt-4 flex flex-col gap-3">
            {match.timeline.map((e, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-pulse-500" />
                <div>
                  <div className="text-[11px] text-white/40">{niceTime(e.at)}</div>
                  <p className="text-[13.5px] leading-snug text-white/75">{e.text}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
        <p className="mt-4 text-[12px] leading-relaxed text-white/40">
          The prediction model does not use lineups yet, so these changes do not move the probabilities. That is planned once there is enough lineup history to test it.
        </p>
      </section>

      <section className="card p-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Activity size={16} className="text-pulse-500" />
          Live intelligence
        </div>
        <p className="mt-3 text-sm leading-relaxed text-white/60">
          Scores update automatically during matches. Shots, momentum and live win probabilities are planned and need faster data than is set up today.
        </p>
      </section>
    </div>
  );
}

/* ---------- Tabs ---------- */

export function MatchTabs({ match, h2h }: { match: Match; h2h: H2H | null }) {
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
        {tab === "h2h" && <HeadToHead match={match} h2h={h2h} />}
        {tab === "live" && <LiveAndHistory match={match} />}
      </div>
    </div>
  );
}
