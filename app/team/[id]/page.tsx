import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Crest } from "@/components/Crest";
import { DataNotice } from "@/components/DataNotice";
import { FormPills } from "@/components/FormPills";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { withAlpha } from "@/lib/color";
import { loadLeague, matchPath, shortDate } from "@/lib/league";
import { loadSquad, type SquadPlayer } from "@/lib/leaders";
import { attackRating, defenceRating } from "@/lib/model";
import { buildTable, resultsFor, seasonList, teamsInSeason, upcomingFor, type Row } from "@/lib/standings";

export const revalidate = 60;

type Props = { params: Promise<{ id: string }> };

const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await loadLeague();
  const t = data.teams.get(Number(id));
  return { title: t ? t.name : "Club" };
}

const GROUPS: SquadPlayer["group"][] = ["Goalkeepers", "Defenders", "Midfielders", "Forwards", "Other"];

function RecordRow({ label, r }: { label: string; r: Row | undefined }) {
  if (!r) return null;
  return (
    <tr className="border-t border-white/[0.05] text-center">
      <td className="py-2.5 pl-4 text-left text-white/60">{label}</td>
      <td className="px-1.5">{r.played}</td>
      <td className="px-1.5">{r.won}</td>
      <td className="px-1.5">{r.drawn}</td>
      <td className="px-1.5">{r.lost}</td>
      <td className="hidden px-1.5 sm:table-cell">{r.gf}</td>
      <td className="hidden px-1.5 sm:table-cell">{r.ga}</td>
      <td className="px-1.5">{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
      <td className="px-2 pr-4 font-display font-extrabold">{r.points}</td>
    </tr>
  );
}

export default async function TeamPage({ params }: Props) {
  const { id } = await params;
  const teamId = Number(id);
  if (!Number.isInteger(teamId)) notFound();

  const data = await loadLeague();
  if (data.error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <DataNotice error={data.error} />
      </div>
    );
  }
  const team = data.teams.get(teamId);
  if (!team) notFound();

  const seasons = seasonList(data.fixtures);
  const season = seasons.find((s) => teamsInSeason(data.fixtures, s.id).includes(teamId));
  if (!season) notFound();
  const isCurrent = season.id === seasons[0]?.id;

  const names = new Map([...data.teams].map(([tid, t]) => [tid, t.name]));
  const all = buildTable(data.fixtures, season.id, "all", names);
  const home = buildTable(data.fixtures, season.id, "home", names).find((r) => r.teamId === teamId);
  const away = buildTable(data.fixtures, season.id, "away", names).find((r) => r.teamId === teamId);
  const pos = all.findIndex((r) => r.teamId === teamId) + 1;
  const overall = all[pos - 1];

  const results = resultsFor(teamId, data.fixtures, season.id, 5);
  const upcoming = isCurrent ? upcomingFor(teamId, data.fixtures, Date.now(), 5) : [];
  const squad = await loadSquad(teamId);
  const glow = `radial-gradient(70% 120% at 0% 0%, ${withAlpha(team.color, 0.3)}, transparent 70%)`;

  const oppLine = (oppId: number) => {
    const o = data.teams.get(oppId);
    return o ? (
      <span className="flex min-w-0 items-center gap-2.5">
        <Crest short={o.short} color={o.color} size={22} teamId={o.id} name={o.name} />
        <span className="truncate font-semibold">{o.name}</span>
      </span>
    ) : (
      <span className="text-white/50">Team {oppId}</span>
    );
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-ink-900">
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: glow }} />
        <div className="relative p-5 sm:p-8">
          <Link href="/teams" className="inline-flex items-center gap-1 text-xs text-white/60 hover:text-white">
            <ChevronLeft size={16} />
            Clubs
          </Link>
          <div className="mt-5 flex items-center gap-5">
            <Crest short={team.short} color={team.color} size={84} teamId={team.id} name={team.name} />
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">{team.name}</h1>
              <p className="mt-1 text-sm text-white/60">
                {ordinal(pos)} in the {season.label} Premier League, {overall?.points ?? 0} points
              </p>
              {overall && overall.form.length > 0 && (
                <div className="mt-3">
                  <FormPills form={overall.form} />
                </div>
              )}
            </div>
          </div>
          {!isCurrent && <p className="mt-4 text-[12px] text-draw">Not in this season&apos;s Premier League. Showing {season.label}.</p>}
        </div>
      </section>

      <section className="card mt-5 overflow-hidden">
        <h2 className="section-title px-4 pt-4">Season record</h2>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-[13px] tnum">
            <thead>
              <tr className="text-center text-[11px] font-semibold text-white/40">
                <th className="py-2 pl-4 text-left"> </th>
                <th className="px-1.5">P</th>
                <th className="px-1.5">W</th>
                <th className="px-1.5">D</th>
                <th className="px-1.5">L</th>
                <th className="hidden px-1.5 sm:table-cell">GF</th>
                <th className="hidden px-1.5 sm:table-cell">GA</th>
                <th className="px-1.5">GD</th>
                <th className="px-2 pr-4">Pts</th>
              </tr>
            </thead>
            <tbody>
              <RecordRow label="Overall" r={overall} />
              <RecordRow label="Home" r={home} />
              <RecordRow label="Away" r={away} />
            </tbody>
          </table>
        </div>
        {isCurrent && (
          <div className="grid grid-cols-2 gap-3 border-t border-white/[0.05] p-4">
            <div className="panel px-3 py-3 text-center">
              <div className="font-display text-xl font-extrabold tnum">{attackRating(data.strengths, teamId).toFixed(1)}</div>
              <div className="mt-0.5 text-[11px] text-white/45">Attack rating</div>
            </div>
            <div className="panel px-3 py-3 text-center">
              <div className="font-display text-xl font-extrabold tnum">{defenceRating(data.strengths, teamId).toFixed(1)}</div>
              <div className="mt-0.5 text-[11px] text-white/45">Defence rating</div>
            </div>
            <p className="col-span-2 text-[11.5px] leading-relaxed text-white/40">Model ratings out of 10, where 5 is an average Premier League club. They come from results, with recent matches counting more.</p>
          </div>
        )}
      </section>

      {upcoming.length > 0 && (
        <section className="card mt-5 p-4">
          <h2 className="section-title">Next matches</h2>
          <ul className="mt-3 flex flex-col">
            {upcoming.map((u) => (
              <li key={u.fixtureId} className="border-t border-white/[0.05] first:border-t-0">
                <Link
                  href={matchPath({ id: u.fixtureId, home_team_id: u.home ? teamId : u.opponentId, away_team_id: u.home ? u.opponentId : teamId }, data.teams)}
                  className="flex items-center gap-3 py-3 text-[13.5px] hover:text-pulse-400"
                >
                  <span className="w-16 shrink-0 text-[12px] text-white/45">{shortDate(u.kickoff)}</span>
                  <span className="w-5 shrink-0 text-center text-[12px] font-bold text-white/50">{u.home ? "H" : "A"}</span>
                  <span className="min-w-0 flex-1">{oppLine(u.opponentId)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {results.length > 0 && (
        <section className="card mt-5 p-4">
          <h2 className="section-title">Recent results</h2>
          <ul className="mt-3 flex flex-col">
            {results.map((r) => (
              <li key={r.fixtureId} className="border-t border-white/[0.05] first:border-t-0">
                <Link
                  href={matchPath({ id: r.fixtureId, home_team_id: r.home ? teamId : r.opponentId, away_team_id: r.home ? r.opponentId : teamId }, data.teams)}
                  className="flex items-center gap-3 py-3 text-[13.5px] hover:text-pulse-400"
                >
                  <span className="w-16 shrink-0 text-[12px] text-white/45">{shortDate(r.kickoff)}</span>
                  <span className="w-5 shrink-0 text-center text-[12px] font-bold text-white/50">{r.home ? "H" : "A"}</span>
                  <span className="min-w-0 flex-1">{oppLine(r.opponentId)}</span>
                  <span className="font-display font-extrabold tnum">
                    {r.gf}–{r.ga}
                  </span>
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold ${
                      r.result === "W" ? "bg-win/15 text-win" : r.result === "D" ? "bg-draw/15 text-draw" : "bg-loss/15 text-loss"
                    }`}
                  >
                    {r.result}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {squad && squad.length > 0 && (
        <section className="card mt-5 p-4">
          <h2 className="section-title">Squad</h2>
          <div className="mt-3 flex flex-col gap-5">
            {GROUPS.map((g) => {
              const players = squad.filter((p) => p.group === g).sort((a, b) => (a.number ?? 999) - (b.number ?? 999));
              if (players.length === 0) return null;
              return (
                <div key={g}>
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/40">{g}</div>
                  <ul className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
                    {players.map((p, i) => (
                      <li key={`${p.id ?? p.name}-${i}`} className="flex items-center gap-3">
                        <PlayerAvatar id={p.id} name={p.name} size={34} />
                        <span className="w-5 shrink-0 text-right text-[12px] font-bold text-white/35 tnum">{p.number ?? ""}</span>
                        {p.id !== null ? (
                          <Link href={`/player/${p.id}`} className="min-w-0 flex-1 truncate text-[13.5px] hover:text-pulse-400">
                            {p.name}
                          </Link>
                        ) : (
                          <span className="min-w-0 flex-1 truncate text-[13.5px]">{p.name}</span>
                        )}
                        {p.availability && p.availability !== "available" && (
                          <span className="shrink-0 rounded-md bg-loss/15 px-2 py-0.5 text-[10.5px] font-bold capitalize text-loss">
                            {p.availability}
                            {p.injury ? `, ${p.injury.toLowerCase()}` : ""}
                            {p.returns && !Number.isNaN(new Date(p.returns).getTime()) ? `, back ${shortDate(p.returns)}` : ""}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
