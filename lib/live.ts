/**
 * Live match helpers. Pure functions, used by both the API routes and the screens.
 * Provider fields are read defensively: anything missing becomes null instead of breaking the page.
 */

export type LiveStatus = "LIVE" | "FT" | "UPCOMING" | "OFF";

export type LiveSnap = {
  id: number;
  status: LiveStatus;
  minute: number | null;
  period: string;
  home: number | null;
  away: number | null;
  htHome: number | null;
  htAway: number | null;
  label: string; // "67'", "HT", "FT"
};

export type LiveEvent = {
  key: string;
  type: "goal" | "card" | "sub" | "var" | "period" | "other";
  minute: number | null;
  added: number | null;
  second: number | null;
  side: "home" | "away" | null;
  player: string | null;
  playerOut: string | null;
  detail: string;
  card: "yellow" | "red" | "second-yellow" | null;
  rescinded: boolean;
  homeScore: number | null;
  awayScore: number | null;
};

export type StatRow = { key: string; label: string; home: number | null; away: number | null; decimals?: number; suffix?: string };

type Json = Record<string, unknown>;
const isObj = (v: unknown): v is Json => !!v && typeof v === "object" && !Array.isArray(v);

export function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return null;
}

const str = (v: unknown): string => (typeof v === "string" ? v : "");

/** Finds the list inside a paged response, or accepts a bare array. */
export function rowsOf(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (isObj(data) && Array.isArray(data.results)) return data.results;
  return [];
}

export function clockLabel(status: LiveStatus, period: string, minute: number | null): string {
  if (status === "FT") return "FT";
  if (status === "OFF") return "Off";
  if (status === "UPCOMING") return "";
  const p = period.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (p.includes("halftime") || p === "ht" || p.includes("break")) return "HT";
  if (p.includes("penalt") || p.includes("shootout")) return "Pens";
  if (minute !== null) return `${minute}'`;
  if (p.includes("extra")) return "Extra time";
  if (p.includes("1st") || p.includes("first") || p.endsWith("1")) return "1st half";
  if (p.includes("2nd") || p.includes("second") || p.endsWith("2")) return "2nd half";
  return "Live";
}

/** Reads one live or single-match record. `fromLiveList` means the provider says it is in play. */
export function snapFromRaw(raw: unknown, fromLiveList: boolean): LiveSnap | null {
  if (!isObj(raw)) return null;
  const id = num(raw.id) ?? num(raw.event_id);
  if (id === null) return null;

  const providerStatus = str(raw.status).toLowerCase();
  let status: LiveStatus;
  if (providerStatus === "finished") status = "FT";
  else if (["cancelled", "canceled", "postponed", "abandoned", "unresolved"].includes(providerStatus)) status = "OFF";
  else if (["notstarted", "scheduled", "upcoming"].includes(providerStatus)) status = "UPCOMING";
  else status = fromLiveList || providerStatus !== "" ? "LIVE" : "UPCOMING";

  const scoreObj = isObj(raw.score) ? raw.score : null;
  const minute = num(raw.current_minute) ?? num(raw.minute);
  const period = str(raw.period);
  return {
    id,
    status,
    minute,
    period,
    home: num(raw.home_score) ?? (scoreObj ? num(scoreObj.home) : null),
    away: num(raw.away_score) ?? (scoreObj ? num(scoreObj.away) : null),
    htHome: num(raw.home_score_ht),
    htAway: num(raw.away_score_ht),
    label: clockLabel(status, period, minute)
  };
}

export function mapIncident(raw: unknown, index: number): LiveEvent | null {
  if (!isObj(raw)) return null;
  const t = str(raw.type).toLowerCase();
  const text = str(raw.text).toLowerCase();
  let type: LiveEvent["type"] = "other";
  if (t.includes("goal")) type = "goal";
  else if (t.includes("card")) type = "card";
  else if (t.includes("sub")) type = "sub";
  else if (t.includes("var")) type = "var";
  else if (t.includes("period")) type = "period";

  let card: LiveEvent["card"] = null;
  if (type === "card") {
    const hint = `${str(raw.card_type)} ${str(raw.card)} ${str(raw.color)} ${str(raw.detail)} ${text}`.toLowerCase();
    card = hint.includes("second") || hint.includes("yellowred") || hint.includes("yellow-red") ? "second-yellow" : hint.includes("red") ? "red" : "yellow";
  }

  const goalType = str(raw.goal_type).toLowerCase();
  let detail = "";
  if (type === "goal") detail = goalType.includes("pen") ? "Penalty" : goalType.includes("own") ? "Own goal" : "";
  else if (type === "var") detail = str(raw.text) || str(raw.decision) || "VAR check";
  else if (type === "period") detail = str(raw.text);
  else if (type === "card") detail = str(raw.reason);

  const minute = num(raw.minute);
  const addedRaw = num(raw.added_time);
  return {
    key: `${index}-${t}-${minute ?? "x"}-${num(raw.period_second) ?? ""}`,
    type,
    minute,
    added: addedRaw !== null && addedRaw > 0 && addedRaw < 90 ? addedRaw : null,
    second: num(raw.period_second),
    side: typeof raw.is_home === "boolean" ? (raw.is_home ? "home" : "away") : null,
    player: str(raw.player) || str(raw.player_in) || null,
    playerOut: str(raw.player_out) || null,
    detail,
    card,
    rescinded: raw.rescinded === true,
    homeScore: num(raw.home_score),
    awayScore: num(raw.away_score)
  };
}

/** Newest first. */
export function mapIncidents(data: unknown): LiveEvent[] {
  const list = isObj(data) && Array.isArray(data.incidents) ? data.incidents : rowsOf(data);
  return list
    .map((r, i) => mapIncident(r, i))
    .filter((e): e is LiveEvent => e !== null)
    .sort((a, b) => {
      const ka = (a.minute ?? 0) * 1000 + (a.added ?? 0) + (a.second ?? 0) / 1000;
      const kb = (b.minute ?? 0) * 1000 + (b.added ?? 0) + (b.second ?? 0) / 1000;
      return kb - ka;
    });
}

export function minuteText(e: { minute: number | null; added: number | null }): string {
  if (e.minute === null) return "";
  return e.added ? `${e.minute}+${e.added}'` : `${e.minute}'`;
}

/** The eight statistics the provider always sends, plus expected goals when present. */
export function mapStats(data: unknown): StatRow[] {
  const s = isObj(data) && isObj(data.stats) ? data.stats : null;
  if (!s) return [];
  const side = (k: "home" | "away") => (isObj(s[k]) ? (s[k] as Json) : {});
  const h = side("home");
  const a = side("away");
  const xg = (o: Json) => (isObj(o.xg) ? num(o.xg.actual) : num(o.xg));
  const rows: StatRow[] = [
    { key: "possession", label: "Possession", home: num(h.ball_possession), away: num(a.ball_possession), suffix: "%" },
    { key: "xg", label: "Expected goals", home: xg(h), away: xg(a), decimals: 2 },
    { key: "shots", label: "Shots", home: num(h.total_shots), away: num(a.total_shots) },
    { key: "sot", label: "Shots on target", home: num(h.shots_on_target), away: num(a.shots_on_target) },
    { key: "corners", label: "Corners", home: num(h.corner_kicks), away: num(a.corner_kicks) },
    { key: "fouls", label: "Fouls", home: num(h.fouls), away: num(a.fouls) },
    { key: "yellow", label: "Yellow cards", home: num(h.yellow_cards), away: num(a.yellow_cards) },
    { key: "red", label: "Red cards", home: num(h.red_cards), away: num(a.red_cards) },
    { key: "offsides", label: "Offsides", home: num(h.offsides), away: num(a.offsides) }
  ];
  return rows.filter((r) => r.home !== null || r.away !== null);
}
