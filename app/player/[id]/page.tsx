import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Crest } from "@/components/Crest";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { loadSquad } from "@/lib/leaders";
import { loadTeam } from "@/lib/league";
import { assess, groupOf, GROUP_NAME } from "@/lib/peers";
import { currentSeasonId, loadPeers } from "@/lib/playerStats";
import { fetchWindowAggregate, fiveYearsAgo, humanize, loadCareer, loadPlayerMatches, loadPlayerProfile, loadTransfers, longDate, type CareerRow } from "@/lib/players";

export const revalidate = 300;

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const p = await loadPlayerProfile(Number(id));
  return { title: p ? p.name : "Player" };
}

const POSITION_NAME: Record<string, string> = { G: "Goalkeeper", D: "Defender", M: "Midfielder", F: "Forward" };

const PER90: { key: string; label: string; suffix?: string; decimals?: number }[] = [
  { key: "goals", label: "Goals", decimals: 2 },
  { key: "assists", label: "Assists", decimals: 2 },
  { key: "xg", label: "Expected goals", decimals: 2 },
  { key: "xa", label: "Expected assists", decimals: 2 },
  { key: "shots", label: "Shots", decimals: 1 },
  { key: "keyPasses", label: "Key passes", decimals: 1 },
  { key: "dribbles", label: "Dribbles won", decimals: 1 },
  { key: "passAccuracy", label: "Pass accuracy", suffix: "%", decimals: 0 },
  { key: "tackles", label: "Tackles", decimals: 1 },
  { key: "interceptions", label: "Interceptions", decimals: 1 },
  { key: "clearances", label: "Clearances", decimals: 1 },
  { key: "aerialsWon", label: "Aerial duels won", decimals: 1 },
  { key: "duelsWon", label: "Duels won", decimals: 1 },
  { key: "recoveries", label: "Ball recoveries", decimals: 1 },
  { key: "fouls", label: "Fouls", decimals: 1 }
];

const dash = (n: number | null) => (n === null ? "-" : String(n));

export default async function PlayerPage({ params }: Props) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [profile, career, transfers, seasonId] = await Promise.all([loadPlayerProfile(id), loadCareer(id), loadTransfers(id), currentSeasonId(300)]);
  if (!profile) notFound();

  const [agg, fiveYear, peers, squad, team] = await Promise.all([
    seasonId !== null ? loadPlayerMatches(id, seasonId) : Promise.resolve(null),
    fetchWindowAggregate(id, fiveYearsAgo()),
    seasonId !== null ? loadPeers(seasonId) : Promise.resolve([]),
    profile.teamId !== null ? loadSquad(profile.teamId) : Promise.resolve(null),
    profile.teamId !== null ? loadTeam(profile.teamId) : Promise.resolve(null)
  ]);

  const group = groupOf(profile.position);
  const availability = profile.availability;
  const missing = availability !== null && availability !== "" && availability !== "available";
  const compareAgg = fiveYear && fiveYear.minutes >= 900 ? fiveYear : agg;
  const usedFiveYear = !!fiveYear && fiveYear.minutes >= 900;
  const assessment = compareAgg ? assess({ group, minutes: compareAgg.minutes, per90: compareAgg.per90 as Record<string, number> }, peers, id) : null;
  const positionLabel = POSITION_NAME[profile.position.charAt(0).toUpperCase()] ?? profile.position;
  const squadEntry = squad?.find((p) => p.id === id);
  const seasonRows = PER90.filter((d) => agg && agg.per90[d.key as keyof typeof agg.per90] !== undefined);

  const facts: { label: string; value: string }[] = [
    { label: "Age", value: profile.age !== null ? String(profile.age) : "" },
    { label: "Nationality", value: profile.nationality },
    { label: "Height", value: profile.heightCm !== null ? `${profile.heightCm} cm` : "" },
    { label: "Preferred foot", value: profile.foot ?? "" },
    { label: "Shirt number", value: profile.number !== null ? String(profile.number) : "" },
    { label: "Market value", value: profile.marketValue ?? "" },
    { label: "Contract until", value: longDate(profile.contractEnd) },
    { label: "Provider rating", value: profile.rating !== null ? `${profile.rating} / 100` : "" }
  ].filter((f) => f.value);

  const totals =
    career.length >= 3
      ? career.reduce((t, r) => ({ matches: t.matches + (r.matches ?? 0), goals: t.goals + (r.goals ?? 0), assists: t.assists + (r.assists ?? 0) }), { matches: 0, goals: 0, assists: 0 })
      : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 lg:px-8">
      <section className="card p-5 sm:p-6">
        <Link href={team ? `/team/${team.id}` : "/players"} className="inline-flex items-center gap-1 text-xs text-white/60 hover:text-white">
          <ChevronLeft size={16} />
          {team ? team.name : "Top players"}
        </Link>
        <div className="mt-4 flex items-center gap-4">
          <PlayerAvatar id={id} name={profile.name} size={92} />
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">{profile.name}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/60">
              {positionLabel && <span>{positionLabel}</span>}
              {team && (
                <Link href={`/team/${team.id}`} className="flex items-center gap-1.5 hover:text-white">
                  <Crest short={team.short} color={team.color} size={16} teamId={team.id} name={team.name} />
                  {team.name}
                </Link>
              )}
              {!team && profile.teamName && <span>{profile.teamName}</span>}
            </div>
          </div>
        </div>
        {facts.length > 0 && (
          <dl className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {facts.map((f) => (
              <div key={f.label} className="panel px-3 py-2.5">
                <dd className="text-[14px] font-semibold">{f.value}</dd>
                <dt className="mt-0.5 text-[11px] text-white/45">{f.label}</dt>
              </div>
            ))}
          </dl>
        )}
      </section>

      <section className="card mt-5 p-5">
        <h2 className="section-title">Availability</h2>
        {availability === null || availability === "" ? (
          <p className="mt-3 text-sm text-white/55">Availability is not published for this player.</p>
        ) : missing ? (
          <div className="mt-3">
            <span className="rounded-md bg-loss/15 px-2.5 py-1 text-[12px] font-bold capitalize text-loss">{availability}</span>
            <p className="mt-3 text-[14px] leading-relaxed text-white/75">
              {profile.injury ? `${profile.injury}. ` : ""}
              {profile.returns ? `Expected back around ${longDate(profile.returns)}.` : "No return date has been published."}
            </p>
          </div>
        ) : (
          <div className="mt-3">
            <span className="rounded-md bg-win/15 px-2.5 py-1 text-[12px] font-bold text-win">No injury reported</span>
            <p className="mt-3 text-[12.5px] leading-relaxed text-white/45">
              This means the player is not currently listed as missing from team news. It is not a guarantee of full fitness.
            </p>
          </div>
        )}
        {profile.injuryRisk && !["not specifically", "unknown", ""].includes(profile.injuryRisk.toLowerCase()) && (
          <p className="mt-3 text-[12.5px] leading-relaxed text-white/50">Injury risk noted by the data provider: {profile.injuryRisk}.</p>
        )}
      </section>

      {agg && agg.matches > 0 && (
        <section className="card mt-5 p-5">
          <h2 className="section-title">This season</h2>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center sm:grid-cols-5">
            {[
              { label: "Matches", value: String(agg.matches) },
              { label: "Minutes", value: String(Math.round(agg.minutes)) },
              { label: "Goals", value: String(agg.totals.goals ?? 0) },
              { label: "Assists", value: String(agg.totals.assists ?? 0) },
              { label: "Avg rating", value: agg.rating !== null ? agg.rating.toFixed(2) : "-" }
            ].map((t) => (
              <div key={t.label} className="panel px-2 py-3.5">
                <div className="font-display text-xl font-extrabold tnum">{t.value}</div>
                <div className="mt-1 text-[11px] text-white/45">{t.label}</div>
              </div>
            ))}
          </div>
          {seasonRows.length > 0 && (
            <>
              <h3 className="mt-6 text-[12px] font-semibold uppercase tracking-wider text-white/40">Per 90 minutes</h3>
              <dl className="mt-3 grid grid-cols-2 gap-x-6 sm:grid-cols-3">
                {seasonRows.map((d) => {
                  const v = agg.per90[d.key as keyof typeof agg.per90] as number;
                  return (
                    <div key={d.key} className="flex items-baseline justify-between border-b border-white/[0.05] py-2 text-[13px]">
                      <dt className="text-white/55">{d.label}</dt>
                      <dd className="font-display font-bold tnum">
                        {v.toFixed(d.decimals ?? 1)}
                        {d.suffix ?? ""}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </>
          )}
        </section>
      )}

      <section className="card mt-5 p-5">
        <h2 className="section-title">Strengths and weaknesses</h2>
        {!assessment ? (
          <p className="mt-3 text-sm leading-relaxed text-white/55">Statistics are not available for this player yet.</p>
        ) : (
          <>
            {(assessment.strengths.length > 0 || assessment.weaknesses.length > 0) && (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-[12px] font-semibold text-win">Strengths</div>
                  <ul className="mt-2 flex flex-col gap-3">
                    {assessment.strengths.length === 0 && <li className="text-[13px] text-white/45">None stand out.</li>}
                    {assessment.strengths.map((s) => (
                      <li key={s.key} className="panel p-3">
                        <div className="text-[14px] font-semibold">{s.text}</div>
                        <div className="mt-1 text-[12px] leading-snug text-white/50">{s.detail}</div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-[12px] font-semibold text-loss">Weaknesses</div>
                  <ul className="mt-2 flex flex-col gap-3">
                    {assessment.weaknesses.length === 0 && <li className="text-[13px] text-white/45">None stand out.</li>}
                    {assessment.weaknesses.map((s) => (
                      <li key={s.key} className="panel p-3">
                        <div className="text-[14px] font-semibold">{s.text}</div>
                        <div className="mt-1 text-[12px] leading-snug text-white/50">{s.detail}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            {assessment.note && <p className="mt-3 text-sm leading-relaxed text-white/55">{assessment.note}</p>}
            <p className="mt-4 text-[11.5px] leading-relaxed text-white/35">
              Worked out from average per-90 statistics {usedFiveYear ? "over the last five years" : "this season (five years of history is not yet available for this player)"}, compared with{" "}
              {assessment.peers > 0 ? `${assessment.peers} other current Premier League ${group ? GROUP_NAME[group] : "players"}` : "other players in the same position"}. This is a
              statistical view, not a scouting report.
            </p>
          </>
        )}
      </section>

      {(profile.providerStrengths.length > 0 || profile.providerWeaknesses.length > 0) && (
        <section className="card mt-5 p-5">
          <h2 className="section-title">Provider notes</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {profile.providerStrengths.length > 0 && (
              <div>
                <div className="text-[12px] font-semibold text-win">Strengths</div>
                <ul className="mt-2 flex flex-col gap-1.5 text-[13.5px] text-white/75">
                  {profile.providerStrengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {profile.providerWeaknesses.length > 0 && (
              <div>
                <div className="text-[12px] font-semibold text-loss">Weaknesses</div>
                <ul className="mt-2 flex flex-col gap-1.5 text-[13.5px] text-white/75">
                  {profile.providerWeaknesses.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {profile.potential && <p className="mt-3 text-[12.5px] text-white/50">Potential: {profile.potential}</p>}
        </section>
      )}

      {profile.skills.length > 0 && (
        <section className="card mt-5 p-5">
          <h2 className="section-title">Skills</h2>
          <ul className="mt-4 flex flex-col gap-3.5">
            {profile.skills.map((s) => (
              <li key={s.label}>
                <div className="mb-1.5 flex items-baseline justify-between text-[13px]">
                  <span className="text-white/70">{humanize(s.label)}</span>
                  <span className="font-display font-bold tnum">{Math.round(s.value)}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                  <div className="h-full rounded-full bg-pulse-500" style={{ width: `${s.value}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card mt-5 overflow-hidden">
        <h2 className="section-title px-5 pt-5">Career</h2>
        {career.length === 0 ? (
          <p className="px-5 pb-5 pt-3 text-sm text-white/55">No career history is available for this player.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-[13px] tnum">
              <thead>
                <tr className="text-[11px] font-semibold text-white/40">
                  <th className="px-3 py-2.5 pl-5 text-left">Season</th>
                  <th className="px-2 py-2.5 text-left">Club</th>
                  <th className="hidden px-2 py-2.5 text-left sm:table-cell">Competition</th>
                  <th className="px-2 py-2.5 text-center">MP</th>
                  <th className="px-2 py-2.5 text-center">G</th>
                  <th className="px-2 py-2.5 pr-5 text-center">A</th>
                </tr>
              </thead>
              <tbody>
                {career.map((r: CareerRow, i) => (
                  <tr key={`${r.season}-${r.competition}-${r.club}-${i}`} className="border-t border-white/[0.05]">
                    <td className="whitespace-nowrap px-3 py-2.5 pl-5 text-white/70">{r.season}</td>
                    <td className="px-2 py-2.5">
                      <div className="font-semibold">{r.club || "-"}</div>
                      <div className="text-[11.5px] text-white/45 sm:hidden">{r.competition}</div>
                    </td>
                    <td className="hidden px-2 py-2.5 text-white/60 sm:table-cell">{r.competition}</td>
                    <td className="px-2 text-center text-white/70">{dash(r.matches)}</td>
                    <td className="px-2 text-center text-white/70">{dash(r.goals)}</td>
                    <td className="px-2 pr-5 text-center text-white/70">{dash(r.assists)}</td>
                  </tr>
                ))}
                {totals && (
                  <tr className="border-t border-white/[0.12] font-semibold">
                    <td className="px-3 py-3 pl-5" colSpan={3}>
                      Career total
                    </td>
                    <td className="px-2 text-center">{totals.matches}</td>
                    <td className="px-2 text-center">{totals.goals}</td>
                    <td className="px-2 pr-5 text-center">{totals.assists}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {transfers.length > 0 && (
        <section className="card mt-5 p-5">
          <h2 className="section-title">Transfers</h2>
          <ul className="mt-3 flex flex-col">
            {transfers.map((t, i) => (
              <li key={`${t.date}-${i}`} className="flex items-start gap-3 border-t border-white/[0.05] py-3 text-[13.5px] first:border-t-0">
                <span className="w-24 shrink-0 text-[12px] text-white/45">{longDate(t.date)}</span>
                <span className="min-w-0 flex-1">
                  {t.from || "-"} <span className="text-white/35">to</span> <span className="font-semibold">{t.to || "-"}</span>
                </span>
                {t.fee && <span className="shrink-0 text-[12.5px] font-semibold capitalize text-white/70">{t.fee}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {squadEntry === undefined && !team && (
        <p className="mt-4 text-[11.5px] leading-relaxed text-white/35">This player&apos;s current club could not be confirmed.</p>
      )}
      <p className="mt-4 text-[11.5px] leading-relaxed text-white/35">Player photos are shown only to identify players. Data comes from the data provider and refreshes from every few minutes to weekly.</p>
    </div>
  );
}
