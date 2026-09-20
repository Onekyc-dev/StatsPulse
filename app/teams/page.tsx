import type { Metadata } from "next";
import Link from "next/link";
import { Crest } from "@/components/Crest";
import { DataNotice } from "@/components/DataNotice";
import { FormPills } from "@/components/FormPills";
import { LeagueBadge } from "@/components/LeagueBadge";
import { LeagueNav } from "@/components/LeagueNav";
import { loadLeague } from "@/lib/league";
import { buildTable, seasonList } from "@/lib/standings";

export const metadata: Metadata = { title: "Clubs" };
export const revalidate = 60;

export default async function TeamsPage() {
  const data = await loadLeague();
  const seasons = seasonList(data.fixtures);
  if (data.error || seasons.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <DataNotice error={data.error} />
      </div>
    );
  }
  const names = new Map([...data.teams].map(([id, t]) => [id, t.name]));
  const rows = buildTable(data.fixtures, seasons[0].id, "all", names);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="flex items-center gap-3 font-display text-3xl font-extrabold tracking-tight">
        <LeagueBadge size={34} />
        Clubs
      </h1>
      <p className="mt-1 text-sm text-white/55">All {rows.length} clubs in the {seasons[0].label} Premier League, in table order.</p>
      <div className="mt-5">
        <LeagueNav active="teams" />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((r, i) => {
          const t = data.teams.get(r.teamId);
          if (!t) return null;
          return (
            <Link key={r.teamId} href={`/team/${r.teamId}`} className="card flex items-center gap-4 p-4 transition-colors hover:border-pulse-500/40">
              <span className="w-6 text-center text-sm font-semibold text-white/40 tnum">{i + 1}</span>
              <Crest short={t.short} color={t.color} size={44} teamId={t.id} name={t.name} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-[15px] font-bold">{t.name}</div>
                <div className="mt-1.5">{r.form.length > 0 ? <FormPills form={r.form} size="sm" /> : <span className="text-[12px] text-white/40">No matches yet</span>}</div>
              </div>
              <div className="text-right">
                <div className="font-display text-2xl font-extrabold leading-none tnum">{r.points}</div>
                <div className="mt-1 text-[10.5px] text-white/40">points</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
