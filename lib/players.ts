import { bsd } from "./bsd";
import { num, rowsOf } from "./live";

/* Provider data is read defensively: unknown or missing fields become null instead of breaking the page. */

type Json = Record<string, unknown>;
const isObj = (v: unknown): v is Json => !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown): string => (typeof v === "string" ? v : "");

function nameOf(v: unknown): string {
  if (typeof v === "string") return v;
  if (isObj(v)) return str(v.name) || str(v.team_name) || str(v.title);
  return "";
}
function firstText(o: Json, keys: string[]): string {
  for (const k of keys) {
    const t = nameOf(o[k]);
    if (t) return t;
    const n = num(o[k]);
    if (n !== null && typeof o[k] === "number") return String(n);
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
    for (const k of ["data", "items", "career", "transfers", "stats", "seasons"]) if (Array.isArray(data[k])) return data[k] as unknown[];
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

export function ageFrom(dob: string | null, now = new Date()): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  let age = now.getUTCFullYear() - d.getUTCFullYear();
  const m = now.getUTCMonth() - d.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < d.getUTCDate())) age--;
  return age;
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
  nationality: string;
  dob: string | null;
  age: number | null;
  heightCm: number | null;
  foot: string | null;
  number: number | null;
  marketValue: string | null;
  contractEnd: string | null;
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

export function mapProfile(data: unknown, id: number): PlayerProfile | null {
  if (!isObj(data)) return null;
  const p = isObj(data.player) ? data.player : data;
  const name = str(p.name) || str(p.player_name);
  if (!name) return null;
  const team = isObj(p.team) ? p.team : isObj(p.current_team) ? p.current_team : null;
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
    teamId: firstNum(p, ["team_id", "current_team_id"]) ?? (team ? firstNum(team, ["id"]) : null),
    teamName: str(p.team_name) || (team ? nameOf(team) : "") || nameOf(p.team),
    nationality: str(p.nationality) || str(p.country) || str(p.nationality_code),
    dob,
    age: firstNum(p, ["age"]) ?? ageFrom(dob),
    heightCm: firstNum(p, ["height", "height_cm"]),
    foot: str(p.preferred_foot) || str(p.foot) || null,
    number: firstNum(p, ["jersey_number", "shirt_number", "number"]),
    marketValue: formatMoney(p.market_value ?? p.transfer_value ?? p.market_value_eur ?? p.value),
    contractEnd: str(p.contract_end) || str(p.contract_until) || str(p.contract_expires) || null,
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

/* ---------------- career and transfers ---------------- */

export type CareerRow = { season: string; competition: string; club: string; matches: number | null; minutes: number | null; goals: number | null; assists: number | null };
export type TransferRow = { date: string; from: string; to: string; fee: string; kind: string };

function careerRow(o: Json, parentSeason: string): CareerRow | null {
  const row: CareerRow = {
    season: firstText(o, ["season", "season_name", "season_year", "year"]) || parentSeason,
    competition: firstText(o, ["competition", "competition_name", "league", "league_name", "tournament"]),
    club: firstText(o, ["team", "team_name", "club", "club_name"]),
    matches: firstNum(o, ["matches", "mp", "appearances", "games", "played", "apps", "matches_played"]),
    minutes: firstNum(o, ["minutes", "minutes_played", "min"]),
    goals: firstNum(o, ["goals", "goals_scored"]),
    assists: firstNum(o, ["assists", "goal_assists"])
  };
  return row.season || row.competition || row.club ? row : null;
}

export function mapCareer(data: unknown): CareerRow[] {
  const out: CareerRow[] = [];
  for (const r of listOf(data)) {
    if (!isObj(r)) continue;
    const season = firstText(r, ["season", "season_name", "season_year", "year"]);
    const nested = ["competitions", "leagues", "entries", "rows", "stats"].map((k) => r[k]).find(Array.isArray) as unknown[] | undefined;
    if (nested) {
      for (const n of nested) if (isObj(n)) { const c = careerRow(n, season); if (c) out.push(c); }
    } else {
      const c = careerRow(r, "");
      if (c) out.push(c);
    }
  }
  return out.sort((a, b) => b.season.localeCompare(a.season) || (b.matches ?? 0) - (a.matches ?? 0));
}

export async function loadCareer(id: number): Promise<CareerRow[]> {
  try {
    return mapCareer(await bsd<unknown>(`/players/${id}/career/`, { revalidate: 3600 }));
  } catch {
    return [];
  }
}

export function mapTransfers(data: unknown): TransferRow[] {
  const out: TransferRow[] = [];
  for (const r of listOf(data)) {
    if (!isObj(r)) continue;
    const feeRaw = r.fee ?? r.fee_eur ?? r.amount ?? r.fee_text;
    const row: TransferRow = {
      date: firstText(r, ["date", "transfer_date", "moved_at"]),
      from: firstText(r, ["from_team", "from_team_name", "from", "from_club"]),
      to: firstText(r, ["to_team", "to_team_name", "to", "to_club"]),
      fee: formatMoney(feeRaw) ?? (str(r.fee_type) || str(r.type) || ""),
      kind: str(r.type) || str(r.transfer_type) || ""
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
  minutes: ["minutes", "minutesplayed", "min", "mins", "timeplayed"],
  rating: ["rating", "matchrating", "avgrating", "sofascorerating"],
  goals: ["goals", "goalsscored"],
  assists: ["assists", "goalassists"],
  xg: ["xg", "expectedgoals"],
  xa: ["xa", "xag", "expectedassists"],
  shots: ["shots", "totalshots", "shotstotal", "totalscoringatt"],
  sot: ["shotsontarget", "ontargetscoringatt", "sot", "shotontarget"],
  keyPasses: ["keypasses", "keypass", "chancescreated", "keypassescount"],
  passes: ["passes", "totalpasses", "passestotal", "totalpass"],
  passesAcc: ["accuratepasses", "passescompleted", "passesaccurate", "accuratepass"],
  tackles: ["tackles", "tackleswon", "totaltackles", "wontackle"],
  interceptions: ["interceptions", "interceptionwon", "totalinterceptions"],
  clearances: ["clearances", "totalclearance", "clearance"],
  duelsWon: ["duelswon", "duelwon", "groundduelswon", "wonduels"],
  aerialsWon: ["aerialswon", "aerialduelswon", "aerialwon", "wonaerials"],
  recoveries: ["recoveries", "ballrecovery", "ballrecoveries"],
  dribbles: ["dribbleswon", "successfuldribbles", "dribbles", "wontakeon"],
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

export async function loadPlayerMatches(id: number, seasonId: number): Promise<Aggregate | null> {
  try {
    const data = await bsd<unknown>(`/players/${id}/stats/?season_id=${seasonId}&limit=200`, { revalidate: 600 });
    return data === null ? null : aggregateMatches(data);
  } catch {
    return null;
  }
}
