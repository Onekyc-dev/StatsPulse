import type { Metadata } from "next";
import Link from "next/link";
import { DataNotice } from "@/components/DataNotice";
import { LeagueBadge } from "@/components/LeagueBadge";
import { LeagueNav } from "@/components/LeagueNav";
import { LeagueTable, type TableRowView, type XgRowView, type ZoneView } from "@/components/table/LeagueTable";
import { loadLeague, matchPath, shortDate } from "@/lib/league";
import { loadOfficialTable } from "@/lib/officialTable";
import { buildTable, seasonList, snapshot, upcomingFor, type Row } from "@/lib/standings";

export const metadata: Metadata = { title: "Premier League table" };
export const revalidate = 60;

type Props = { searchParams: Promise<{ season?: string }> };

const KINDS = ["all", "home", "away", "form"] as const;

export default async function TablePage({ searchParams }: Props) {
  const { season } = await searchParams;
  const data = await loadLeague();
  const seasons = seasonList(data.fixtures);

  if (data.error || seasons.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <DataNotice error={data.error} />
      </div>
    );
  }

  const selected = seasons.find((s) => s.id === Number(season)) ?? seasons[0];
  const isCurrent = selected.id === seasons[0].id;
  const names = new Map([...data.teams].map(([id, t]) => [id, t.name]));
  const now = Date.now();

  const toView = (r: Row, i: number): TableRowView => {
    const t = data.teams.get(r.teamId);
    const nx = isCurrent ? upcomingFor(r.teamId, data.fixtures, now, 1)[0] : undefined;
    const opp = nx ? data.teams.get(nx.opponentId) : undefined;
    return {
      pos: i + 1,
      teamId: r.teamId,
      name: t?.name ?? `Team ${r.teamId}`,
      short: t?.short ?? "???",
      color: t?.color ?? "#5b6b73",
      played: r.played,
      won: r.won,
      drawn: r.drawn,
      lost: r.lost,
      gf: r.gf,
      ga: r.ga,
      gd: r.gd,
      points: r.points,
      form: r.form,
      next: nx && opp ? { opponentId: opp.id, opponentName: opp.name, opponentShort: opp.short, opponentColor: opp.color, home: nx.home, label: shortDate(nx.kickoff) } : null
    };
  };

  const tables = Object.fromEntries(KINDS.map((k) => [k, buildTable(data.fixtures, selected.id, k, names).map(toView)])) as Record<(typeof KINDS)[number], TableRowView[]>;
  const overall = tables.all;

  // The provider's official table gives the real qualification and relegation zones and expected goals.
  const official = await loadOfficialTable(selected.id);
  const zones: ZoneView[] =
    official && official.zones.length > 0
      ? official.zones
      : [
          { key: "cl", label: "Top four", type: "qualification", from: 1, to: 4 },
          { key: "rel", label: "Relegation", type: "relegation", from: Math.max(1, overall.length - 2), to: overall.length }
        ];
  const xg: XgRowView[] | null = official
    ? official.rows
        .filter((r) => r.xgd !== null)
        .map((r) => {
          const t = data.teams.get(r.teamId);
          return {
            teamId: r.teamId,
            name: t?.name ?? `Team ${r.teamId}`,
            short: t?.short ?? "???",
            color: t?.color ?? "#5b6b73",
            played: r.xgGames ?? r.played,
            xgf: r.xgf,
            xga: r.xga,
            xgd: r.xgd as number,
            gd: r.gd
          };
        })
        .sort((a, b) => b.xgd - a.xgd)
    : null;
  // If the official points differ from ours (for example a points deduction), say so.
  const mismatches = official
    ? official.rows
        .map((o) => ({ o, ours: overall.find((r) => r.teamId === o.teamId) }))
        .filter((m) => m.ours && (m.ours.points !== m.o.points || m.ours.played !== m.o.played))
        .slice(0, 4)
        .map((m) => `${m.ours?.name} (${m.ours?.points} points from ${m.ours?.played}, official ${m.o.points} from ${m.o.played})`)
    : [];
  const snap = snapshot(data.fixtures, selected.id);
  const fixtureName = (f: { homeId: number; awayId: number }) => `${data.teams.get(f.homeId)?.name ?? "Home"} v ${data.teams.get(f.awayId)?.name ?? "Away"}`;
  const link = (f: { fixtureId: number; homeId: number; awayId: number }) => matchPath({ id: f.fixtureId, home_team_id: f.homeId, away_team_id: f.awayId }, data.teams);

  const played = overall.filter((r) => r.played > 0);
  const bestAttack = [...played].sort((a, b) => b.gf / b.played - a.gf / a.played).slice(0, 3);
  const bestDefence = [...played].sort((a, b) => a.ga / a.played - b.ga / b.played).slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="flex items-center gap-3 font-display text-3xl font-extrabold tracking-tight">
        <LeagueBadge size={34} />
        Premier League
      </h1>
      <p className="mt-1 text-sm text-white/55">
        Season {selected.label}, after {selected.finished} matches.
      </p>

      <div className="mt-5">
        <LeagueNav active="table" />
      </div>

      {seasons.length > 1 && (
        <div className="no-scrollbar -mx-4 mt-3 flex items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <span className="shrink-0 text-[12px] text-white/40">Season</span>
          {seasons.slice(0, 5).map((s) => (
            <Link
              key={s.id}
              href={s.id === seasons[0].id ? "/table" : `/table?season=${s.id}`}
              className={`shrink-0 rounded-lg border px-3 py-1.5 text-[12.5px] font-semibold ${
                s.id === selected.id ? "border-white/30 bg-white/10 text-white" : "border-white/[0.08] text-white/55 hover:text-white"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-5">
        <LeagueTable tables={tables} xg={xg} zones={zones} showNext={isCurrent} />
        <p className="mt-3 text-[11.5px] leading-relaxed text-white/35">
          Calculated from the results StatPulse has stored, ordered by points, then goal difference, then goals scored. It updates as results are recorded.
          {official ? " Zones and expected goals come from the data provider." : " Official tables can differ if points are deducted."}
        </p>
        {mismatches.length > 0 && (
          <p className="mt-2 rounded-xl border border-draw/25 bg-draw/[0.07] p-3 text-[12px] leading-relaxed text-draw">
            The official table differs for: {mismatches.join("; ")}. This can happen while matches are in progress, or when points are deducted.
          </p>
        )}
      </div>

      {snap && (
        <section className="card mt-8 p-5">
          <h2 className="section-title">Season snapshot</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Goals per match", value: snap.goalsPerMatch.toFixed(2) },
              { label: "Home wins", value: `${snap.homeWinPct}%` },
              { label: "Draws", value: `${snap.drawPct}%` },
              { label: "Away wins", value: `${snap.awayWinPct}%` },
              { label: "Both teams score", value: `${snap.bttsPct}%` },
              { label: "Over 2.5 goals", value: `${snap.over25Pct}%` },
              { label: "Matches played", value: String(snap.played) },
              { label: "Goals scored", value: String(snap.goals) }
            ].map((t) => (
              <div key={t.label} className="panel px-3 py-4 text-center">
                <div className="font-display text-xl font-extrabold tnum">{t.value}</div>
                <div className="mt-1 text-[11px] leading-tight text-white/45">{t.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="panel p-4">
              <div className="text-[12px] font-semibold text-white/50">Best attacks, goals per match</div>
              <ol className="mt-3 flex flex-col gap-2 text-[13.5px]">
                {bestAttack.map((r) => (
                  <li key={r.teamId} className="flex items-center justify-between">
                    <Link href={`/team/${r.teamId}`} className="truncate font-semibold hover:text-pulse-400">
                      {r.name}
                    </Link>
                    <span className="tnum text-white/70">
                      {(r.gf / r.played).toFixed(2)} <span className="text-white/35">({r.gf})</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="panel p-4">
              <div className="text-[12px] font-semibold text-white/50">Best defences, conceded per match</div>
              <ol className="mt-3 flex flex-col gap-2 text-[13.5px]">
                {bestDefence.map((r) => (
                  <li key={r.teamId} className="flex items-center justify-between">
                    <Link href={`/team/${r.teamId}`} className="truncate font-semibold hover:text-pulse-400">
                      {r.name}
                    </Link>
                    <span className="tnum text-white/70">
                      {(r.ga / r.played).toFixed(2)} <span className="text-white/35">({r.ga})</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 text-[13px] text-white/60">
            {snap.biggestWin && (
              <p>
                Biggest win:{" "}
                <Link href={link(snap.biggestWin)} className="font-semibold text-white hover:text-pulse-400">
                  {fixtureName(snap.biggestWin)} {snap.biggestWin.score}
                </Link>
              </p>
            )}
            {snap.highest && (
              <p>
                Most goals:{" "}
                <Link href={link(snap.highest)} className="font-semibold text-white hover:text-pulse-400">
                  {fixtureName(snap.highest)} {snap.highest.score}
                </Link>
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
