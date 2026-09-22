import { bsd } from "./bsd";
import { num, rowsOf } from "./live";

/* Provider data is read defensively: unknown or missing fields become null instead of breaking the page. */

type Json = Record<string, unknown>;
const isObj = (v: unknown): v is Json => !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown): string => (typeof v === "string" ? v : "");

function nameOf(v: unknown): string {
  if (typeof v === "string") return v;
  if (isObj(v)) return str(v.name) || str(v.team_name) || str(v.title) || str(v.label);
  return "";
}
function firstText(o: Json, keys: string[]): string {
  for (const k of keys) {
    const t = nameOf(o[k]);
    if (t) return t;
    if (typeof o[k] === "number") return String(o[k]);
  }
  return "";
}
function firstNum(o: Json, keys: string[]): number | null {
  for (const k of keys) {
    const n = num(o[k]);
    if (n !== null) return n;
  }
  return null;
}
function listOf(data: unknown): unknown[] {
  const direct = rowsOf(data);
  if (direct.length > 0) return direct;
  if (isObj(data)) {
    for (const k of ["seasons", "transfers", "career", "stats", "data", "items"]) if (Array.isArray(data[k])) return data[k] as unknown[];
  }
  return [];
}

export function humanize(key: string): string {
  const s = key.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").trim().toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatMoney(v: unknown): string | null {
  const n = typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)) ? Number(v) : typeof v === "number" ? v : null;
  if (n === null) return typeof v === "string" && v.trim() !== "" ? v : null;
  if (n >= 1e6) return `€${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}M`;
  if (n >= 1e3) return `€${Math.round(n / 1e3)}K`;
  return `€${n}`;
}

const LONG = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" });
/** "30 Jun 2030". Returns the input unchanged if it is not a date. */
export function longDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : LONG.format(d);
}

export function ageFrom(dob: string | null, now = new Date()): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  let age = now.getUTCFullYear() - d.getUTCFullYear();
  const m = now.getUTCMonth() - d.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < d.getUTCDate())) age--;
  return age;
}

/** The date five years ago, as YYYY-MM-DD. */
export function fiveYearsAgo(now = new Date()): string {
  const d = new Date(now.getTime());
  d.setUTCFullYear(d.getUTCFullYear() - 5);
  return d.toISOString().slice(0, 10);
}

/* ---------------- profile ---------------- */

export type Skill = { label: string; value: number };
export type PlayerProfile = {
  id: number;
  name: string;
  position: string;
  positions: string[];
  teamId: number | null;
  teamName: string;
  nationalTeamId: number | null;
  nationality: string;
  dob: string | null;
  age: number | null;
  heightCm: number | null;
  foot: string | null;
  number: number | null;
  marketValue: string | null;
  contractEnd: string | null;
  availability: string | null;
  injury: string | null;
  returns: string | null;
  rating: number | null;
  potential: string | null;
  injuryRisk: string | null;
  providerStrengths: string[];
  providerWeaknesses: string[];
  skills: Skill[];
};

function mapSkills(v: unknown): Skill[] {
  const out: Skill[] = [];
  if (Array.isArray(v)) {
    for (const x of v) {
      if (!isObj(x)) continue;
      const value = firstNum(x, ["value", "rating", "score", "level"]);
      const label = str(x.name) || str(x.skill) || str(x.label) || str(x.key);
      if (label && value !== null) out.push({ label: humanize(label), value });
    }
  } else if (isObj(v)) {
    for (const [k, val] of Object.entries(v)) {
      const n = num(val);
      if (n !== null) out.push({ label: humanize(k), value: n });
    }
  }
  return out.filter((s) => s.value >= 0 && s.value <= 100);
}

function textList(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => (typeof x === "string" ? x : nameOf(x) || str(isObj(x) ? x.text : ""))).map((s) => s.trim()).filter(Boolean);
}

function footName(raw: string): string | null {
  const f = raw.trim();
  if (!f) return null;
  const u = f.toUpperCase();
  return u === "L" ? "Left" : u === "R" ? "Right" : u === "B" ? "Both" : f;
}

export function mapProfile(data: unknown, id: number): PlayerProfile | null {
  if (!isObj(data)) return null;
  const p = isObj(data.player) ? data.player : data;
  const name = str(p.name) || str(p.player_name);
  if (!name) return null;
  const team = isObj(p.current_team) ? p.current_team : isObj(p.team) ? p.team : null;
  const national = isObj(p.national_team) ? p.national_team : null;
  const positions = Array.isArray(p.positions)
    ? p.positions.map((x) => (typeof x === "string" ? x : nameOf(x))).filter(Boolean)
    : typeof p.positions === "string"
      ? p.positions.split(/[,/]/).map((s) => s.trim()).filter(Boolean)
      : [];
  const dob = str(p.date_of_birth) || str(p.birth_date) || str(p.dob) || null;
  return {
    id,
    name,
    position: str(p.position) || positions[0] || "",
    positions,
    teamId: firstNum(p, ["current_team_id", "team_id"]) ?? (team ? firstNum(team, ["id"]) : null),
    teamName: str(p.team_name) || (team ? nameOf(team) : ""),
    nationalTeamId: firstNum(p, ["national_team_id"]) ?? (national ? firstNum(national, ["id"]) : null),
    nationality: str(p.nationality) || str(p.country) || str(p.nationality_code),
    dob,
    age: firstNum(p, ["age"]) ?? ageFrom(dob),
    heightCm: firstNum(p, ["height_cm", "height"]),
    foot: footName(str(p.preferred_foot) || str(p.foot)),
    number: firstNum(p, ["jersey_number", "shirt_number", "number"]),
    marketValue: formatMoney(p.market_value_eur ?? p.market_value ?? p.transfer_value ?? p.value),
    contractEnd: str(p.contract_until) || str(p.contract_end) || str(p.contract_expires) || null,
    availability: str(p.availability) || null,
    injury: str(p.injury_type) || null,
    returns: str(p.injury_expected_return) || null,
    rating: firstNum(p, ["rating"]),
    potential: str(p.potential) || null,
    injuryRisk: str(p.injury_risk) || null,
    providerStrengths: textList(p.strengths),
    providerWeaknesses: textList(p.weaknesses),
    skills: mapSkills(p.skills ?? p.attributes)
  };
}

export async function loadPlayerProfile(id: number): Promise<PlayerProfile | null> {
  try {
    return mapProfile(await bsd<unknown>(`/players/${id}/`, { revalidate: 3600 }), id);
  } catch {
    return null;
  }
}

/* ---------------- career ---------------- */

export type CareerRow = {
  season: string;
  sortKey: string;
  competition: string;
  leagueId: number | null;
  club: string;
  teamId: number | null;
  matches: number | null;
  minutes: number | null;
  goals: number | null;
  assists: number | null;
  rating: number | null;
};

type RawCareer = {
  seasonId: number | null;
  leagueId: number | null;
  teamId: number | null;
  seasonText: string;
  competitionText: string;
  clubText: string;
  matches: number | null;
  minutes: number | null;
  goals: number | null;
  assists: number | null;
  rating: number | null;
};

function rawCareerRow(o: Json, parentSeason: string): RawCareer | null {
  const row: RawCareer = {
    seasonId: firstNum(o, ["season_id"]),
    leagueId: firstNum(o, ["league_id"]),
    teamId: firstNum(o, ["team_id"]),
    seasonText: firstText(o, ["season", "season_name", "season_year", "year"]) || parentSeason,
    competitionText: firstText(o, ["competition", "competition_name", "league", "league_name", "tournament"]),
    clubText: firstText(o, ["team", "team_name", "club", "club_name"]),
    matches: firstNum(o, ["matches", "mp", "appearances", "games", "played", "apps", "matches_played"]),
    minutes: firstNum(o, ["minutes", "minutes_played", "min"]),
    goals: firstNum(o, ["goals", "goals_scored"]),
    assists: firstNum(o, ["assists", "goal_assist", "goal_assists"]),
    rating: firstNum(o, ["avg_rating", "rating"])
  };
  return row.seasonId !== null || row.leagueId !== null || row.teamId !== null || row.seasonText || row.competitionText || row.clubText ? row : null;
}

export function rawCareer(data: unknown): RawCareer[] {
  const out: RawCareer[] = [];
  for (const r of listOf(data)) {
    if (!isObj(r)) continue;
    const season = firstText(r, ["season", "season_name", "year"]);
    const nested = ["competitions", "leagues", "entries", "rows"].map((k) => r[k]).find(Array.isArray) as unknown[] | undefined;
    if (nested) {
      for (const n of nested) if (isObj(n)) { const c = rawCareerRow(n, season); if (c) out.push(c); }
    } else {
      const c = rawCareerRow(r, "");
      if (c) out.push(c);
    }
  }
  return out;
}

async function poolMap<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += size) out.push(...(await Promise.all(items.slice(i, i + size).map(fn))));
  return out;
}

type SeasonInfo = { label: string; sort: string };

export function seasonInfo(s: unknown, leagueName = ""): (SeasonInfo & { id: number }) | null {
  if (!isObj(s)) return null;
  const id = firstNum(s, ["id", "season_id"]);
  if (id === null) return null;
  const name = str(s.name);
  const year = firstNum(s, ["year"]);
  const m = name.match(/(\d{2,4}\s*\/\s*\d{2,4}|\d{4})\s*$/);
  let label = m ? m[1].replace(/\s+/g, "") : year !== null ? String(year) : name.replace(leagueName, "").trim() || `Season ${id}`;
  const short = label.match(/^(\d{2})\/(\d{2})$/);
  if (short) label = `20${short[1]}/${short[2]}`;
  return { id, label, sort: str(s.start_date) || (year !== null ? `${year}-01-01` : label) };
}

/** Career rows only carry ids. This looks up league, season and club names (cached for a day). */
export async function loadCareer(id: number): Promise<CareerRow[]> {
  try {
    const raws = rawCareer(await bsd<unknown>(`/players/${id}/career/`, { revalidate: 3600 }));
    if (raws.length === 0) return [];
    const leagueIds = [...new Set(raws.map((r) => r.leagueId).filter((v): v is number => v !== null))];
    const teamIds = [...new Set(raws.map((r) => r.teamId).filter((v): v is number => v !== null))];

    const leagueNames = new Map<number, string>();
    try {
      for (const l of rowsOf(await bsd<unknown>("/leagues/?limit=200", { revalidate: 86400 }))) {
        if (isObj(l)) {
          const lid = firstNum(l, ["id"]);
          if (lid !== null) leagueNames.set(lid, str(l.name));
        }
      }
    } catch {
      // names stay blank
    }

    const seasons = new Map<string, SeasonInfo>(); // key: leagueId:seasonId
    await poolMap(leagueIds, 6, async (lid) => {
      try {
        const data = await bsd<unknown>(`/leagues/${lid}/seasons/`, { revalidate: 86400 });
        for (const s of listOf(data)) {
          const si = seasonInfo(s, leagueNames.get(lid) ?? "");
          if (si) seasons.set(`${lid}:${si.id}`, { label: si.label, sort: si.sort });
        }
      } catch {
        // labels fall back to the season id
      }
    });

    const clubNames = new Map<number, string>();
    await poolMap(teamIds, 6, async (tid) => {
      try {
        const d = await bsd<unknown>(`/teams/${tid}/`, { revalidate: 86400 });
        const nm = isObj(d) ? str(d.name) || nameOf(d.team) : "";
        if (nm) clubNames.set(tid, nm);
      } catch {
        // leave blank
      }
    });

    const rows: CareerRow[] = raws.map((r) => {
      const si = r.leagueId !== null && r.seasonId !== null ? seasons.get(`${r.leagueId}:${r.seasonId}`) : undefined;
      return {
        season: si?.label ?? (r.seasonText || (r.seasonId !== null ? `Season ${r.seasonId}` : "")),
        sortKey: si?.sort ?? r.seasonText,
        competition: (r.leagueId !== null ? leagueNames.get(r.leagueId) : "") || r.competitionText || (r.leagueId !== null ? `Competition ${r.leagueId}` : ""),
        leagueId: r.leagueId,
        club: (r.teamId !== null ? clubNames.get(r.teamId) : "") || r.clubText || (r.teamId !== null ? `Team ${r.teamId}` : ""),
        teamId: r.teamId,
        matches: r.matches,
        minutes: r.minutes,
        goals: r.goals,
        assists: r.assists,
        rating: r.rating
      };
    });
    return rows.sort((a, b) => b.sortKey.localeCompare(a.sortKey) || (b.matches ?? 0) - (a.matches ?? 0));
  } catch {
    return [];
  }
}

/* ---------------- transfers ---------------- */

export type TransferRow = { date: string; from: string; to: string; fee: string; kind: string };

export function mapTransfers(data: unknown): TransferRow[] {
  const out: TransferRow[] = [];
  for (const r of listOf(data)) {
    if (!isObj(r)) continue;
    const feeNum = num(r.fee_eur ?? r.fee ?? r.amount);
    const row: TransferRow = {
      date: firstText(r, ["transfer_date", "date", "moved_at"]),
      from: firstText(r, ["from_team_name", "from_team", "from", "from_club"]),
      to: firstText(r, ["to_team_name", "to_team", "to", "to_club"]),
      fee: feeNum !== null ? (feeNum === 0 ? "No fee" : formatMoney(feeNum) ?? "") : str(r.fee_description),
      kind: str(r.type) || str(r.transfer_type)
    };
    if (row.from || row.to) out.push(row);
  }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

export async function loadTransfers(id: number): Promise<TransferRow[]> {
  try {
    return mapTransfers(await bsd<unknown>(`/players/${id}/transfers/`, { revalidate: 3600 }));
  } catch {
    return [];
  }
}

/* ---------------- per-match stats, aggregated ---------------- */

export type Metric =
  | "goals" | "assists" | "xg" | "xa" | "shots" | "sot" | "keyPasses" | "passes" | "passesAcc"
  | "tackles" | "interceptions" | "clearances" | "duelsWon" | "aerialsWon" | "recoveries" | "dribbles" | "fouls";

const ALIASES: Record<Metric | "minutes" | "rating", string[]> = {
  minutes: ["minutesplayed", "minutes", "min", "mins", "timeplayed"],
  rating: ["rating", "matchrating", "avgrating"],
  goals: ["goals", "goalsscored"],
  assists: ["goalassist", "assists", "goalassists"],
  xg: ["expectedgoals", "xg"],
  xa: ["expectedassists", "xa", "xag"],
  shots: ["totalshots", "shots", "shotstotal", "totalscoringatt"],
  sot: ["shotsontarget", "ontargetscoringatt", "sot", "shotontarget"],
  keyPasses: ["keypass", "keypasses", "chancescreated"],
  passes: ["totalpass", "passes", "totalpasses", "passestotal"],
  passesAcc: ["accuratepass", "accuratepasses", "passescompleted", "passesaccurate"],
  tackles: ["wontackle", "tackleswon", "tackles", "totaltackles"],
  interceptions: ["interception", "interceptions", "interceptionwon", "totalinterceptions"],
  clearances: ["totalclearance", "clearances", "clearance"],
  duelsWon: ["duelwon", "duelswon", "groundduelswon", "wonduels"],
  aerialsWon: ["aerialwon", "aerialswon", "aerialduelswon", "wonaerials"],
  recoveries: ["ballrecovery", "recoveries", "ballrecoveries"],
  dribbles: ["woncontest", "dribbleswon", "successfuldribbles", "dribbles", "wontakeon"],
  fouls: ["fouls", "foulscommitted", "foulcommitted"]
};

const norm = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, "");

function valueOf(v: unknown): number | null {
  if (isObj(v)) return num(v.actual) ?? num(v.value) ?? num(v.total);
  return num(v);
}

/** Flattens one match row (and a nested `stats` object, if any) into normalised key -> number. */
function flatten(row: Json): Map<string, number> {
  const m = new Map<string, number>();
  const add = (o: Json) => {
    for (const [k, v] of Object.entries(o)) {
      const n = valueOf(v);
      if (n !== null && !m.has(norm(k))) m.set(norm(k), n);
    }
  };
  add(row);
  for (const k of ["stats", "statistics", "player_stats"]) if (isObj(row[k])) add(row[k] as Json);
  return m;
}

function pick(m: Map<string, number>, key: Metric | "minutes" | "rating"): number | null {
  for (const a of ALIASES[key]) if (m.has(a)) return m.get(a) as number;
  return null;
}

export type Aggregate = {
  matches: number; // matches with minutes played
  minutes: number;
  rating: number | null;
  totals: Partial<Record<Metric, number>>;
  per90: Partial<Record<Metric | "passAccuracy", number>>;
};

export function aggregateMatches(data: unknown): Aggregate {
  const totals: Partial<Record<Metric, number>> = {};
  let minutes = 0, matches = 0, ratingSum = 0, ratingN = 0;
  for (const r of listOf(data)) {
    if (!isObj(r)) continue;
    const m = flatten(r);
    const min = pick(m, "minutes") ?? 0;
    if (min <= 0) continue;
    minutes += min;
    matches++;
    const rt = pick(m, "rating");
    if (rt !== null && rt > 0) {
      ratingSum += rt;
      ratingN++;
    }
    for (const key of Object.keys(ALIASES) as (Metric | "minutes" | "rating")[]) {
      if (key === "minutes" || key === "rating") continue;
      const v = pick(m, key);
      if (v !== null) totals[key] = (totals[key] ?? 0) + v;
    }
  }
  const per90: Aggregate["per90"] = {};
  if (minutes >= 90) {
    for (const [k, v] of Object.entries(totals) as [Metric, number][]) {
      if (k === "passes" || k === "passesAcc") continue;
      per90[k] = Math.round((v / minutes) * 90 * 100) / 100;
    }
    if (totals.passes && totals.passesAcc !== undefined && totals.passes > 0) per90.passAccuracy = Math.round((totals.passesAcc / totals.passes) * 1000) / 10;
  }
  return { matches, minutes, rating: ratingN > 0 ? Math.round((ratingSum / ratingN) * 100) / 100 : null, totals, per90 };
}

/** One season's matches for a player. */
export async function loadPlayerMatches(id: number, seasonId: number): Promise<Aggregate | null> {
  try {
    const data = await bsd<unknown>(`/players/${id}/stats/?season_id=${seasonId}&limit=200`, { revalidate: 600 });
    return data === null ? null : aggregateMatches(data);
  } catch {
    return null;
  }
}

/**
 * Every match since a date (up to 800), combined into one average. Used for the five-year strengths view.
 * `fresh` skips caching, for the background job.
 */
export async function fetchWindowAggregate(id: number, dateFrom: string, opts: { fresh?: boolean } = {}): Promise<Aggregate | null> {
  const rows: unknown[] = [];
  for (let offset = 0; offset < 800; offset += 200) {
    let page: unknown;
    try {
      page = await bsd<unknown>(`/players/${id}/stats/?date_from=${dateFrom}&limit=200&offset=${offset}`, opts.fresh ? {} : { revalidate: 600 });
    } catch {
      break;
    }
    if (page === null) break;
    const list = listOf(page);
    rows.push(...list);
    if (list.length < 200) break;
  }
  return rows.length > 0 ? aggregateMatches(rows) : null;
}
