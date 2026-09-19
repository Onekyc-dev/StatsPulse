type Json = Record<string, unknown>;

function nameOf(p: unknown): string | null {
  if (typeof p === "string") return p;
  if (p && typeof p === "object") {
    const o = p as Json;
    for (const k of ["name", "short_name", "player_name"]) {
      if (typeof o[k] === "string") return o[k] as string;
    }
    if (o.player) return nameOf(o.player);
  }
  return null;
}

function firstArray(t: Json, keys: string[]): unknown[] {
  for (const k of keys) {
    const v = t[k];
    if (Array.isArray(v)) return v;
  }
  return [];
}

/** Best-effort read of a stored lineup. Returns null when the shape is not recognised. */
export function extractXI(raw: unknown, side: "home" | "away"): { starters: string[]; bench: string[] } | null {
  if (!raw || typeof raw !== "object") return null;
  const team = (raw as Json)[side];
  let starters: unknown[] = [];
  let bench: unknown[] = [];
  if (Array.isArray(team)) {
    starters = team;
  } else if (team && typeof team === "object") {
    const t = team as Json;
    starters = firstArray(t, ["starting", "starters", "xi", "startXI", "starting_xi", "lineup", "players"]);
    bench = firstArray(t, ["substitutes", "bench", "subs"]);
  }
  const names = starters.map(nameOf).filter((n): n is string => !!n);
  if (names.length < 9) return null;
  return { starters: names.slice(0, 11), bench: bench.map(nameOf).filter((n): n is string => !!n).slice(0, 15) };
}
