export type Pos = "G" | "D" | "M" | "F" | "?";
export type XIPlayer = { id: number; name: string; short: string; pos: Pos; number: number | null; captain: boolean };
export type TeamLineup = { formation: string | null; confidence: number | null; players: XIPlayer[]; subs: XIPlayer[] };

type Json = Record<string, unknown>;
const RANK: Record<Pos, number> = { G: 0, D: 1, M: 2, F: 3, "?": 2 };

function toPlayer(p: unknown): XIPlayer | null {
  if (!p || typeof p !== "object") return null;
  const o = p as Json;
  if (typeof o.id !== "number" || typeof o.name !== "string") return null;
  const raw = typeof o.position === "string" ? o.position.trim().charAt(0).toUpperCase() : "";
  const pos: Pos = raw === "G" || raw === "D" || raw === "M" || raw === "F" ? raw : "?";
  return {
    id: o.id,
    name: o.name,
    short: typeof o.short_name === "string" ? o.short_name : o.name,
    pos,
    number: typeof o.jersey_number === "number" ? o.jersey_number : null,
    captain: o.captain === true
  };
}

/** Reads one team's lineup from the stored provider data. Returns null if there is no usable lineup. */
export function parseTeamLineup(raw: unknown, side: "home" | "away"): TeamLineup | null {
  if (!raw || typeof raw !== "object") return null;
  const team = (raw as Json)[side];
  if (!team || typeof team !== "object") return null;
  const t = team as Json;
  const list = (v: unknown): XIPlayer[] => (Array.isArray(v) ? v.map(toPlayer).filter((x): x is XIPlayer => x !== null) : []);
  const players = list(t.players);
  if (players.length < 9) return null;
  return {
    formation: typeof t.formation === "string" ? t.formation : null,
    confidence: typeof t.confidence === "number" ? t.confidence : null,
    players: players.slice(0, 11),
    subs: list(t.substitutes).slice(0, 15)
  };
}

/** Splits the eleven into goalkeeper plus rows that follow the formation, for example 4-2-3-1. */
export function formationRows(l: TeamLineup): { gk: XIPlayer; rows: XIPlayer[][] } | null {
  if (!l.formation) return null;
  const counts = l.formation.split("-").map((n) => parseInt(n, 10)).filter((n) => n > 0);
  const gk = l.players.find((p) => p.pos === "G");
  if (!gk || counts.length === 0) return null;
  const rest = l.players.filter((p) => p !== gk).map((p, i) => ({ p, i })).sort((a, b) => RANK[a.p.pos] - RANK[b.p.pos] || a.i - b.i).map((x) => x.p);
  if (counts.reduce((a, b) => a + b, 0) !== rest.length) return null;
  const rows: XIPlayer[][] = [];
  let k = 0;
  for (const c of counts) {
    rows.push(rest.slice(k, k + c));
    k += c;
  }
  return { gk, rows };
}

export function surname(p: XIPlayer): string {
  const s = p.short.includes(" ") ? p.short.slice(p.short.indexOf(" ") + 1) : p.short;
  return s.length > 11 ? `${s.slice(0, 10)}.` : s;
}
