import type { Impact, StabilityFactor, TeamStability } from "./types";
import type { TeamLineup } from "./lineups";

/** The score is a plain weighted average, so every part of it can be shown to the user. */
export const STABILITY_FACTORS: { key: string; label: string; weight: number; hint: string }[] = [
  { key: "lineup", label: "Lineup continuity", weight: 0.3, hint: "How much of the starting eleven matches the last three matches" },
  { key: "backline", label: "Back line", weight: 0.25, hint: "Whether the goalkeeper and defenders are the usual ones" },
  { key: "midfield", label: "Midfield", weight: 0.2, hint: "Whether the midfielders are the usual ones" },
  { key: "availability", label: "Availability", weight: 0.15, hint: "Regular starters missing lower this the most" },
  { key: "rotation", label: "Rotation", weight: 0.1, hint: "Changes to the eleven since the last match. Six or more scores zero" }
];

export function stabilityLabel(score: number): string {
  if (score >= 80) return "Settled";
  if (score >= 60) return "Mostly settled";
  return "Disrupted";
}

const clamp = (v: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, v));
const idsOf = (l: TeamLineup, pos?: string[]) => new Set(l.players.filter((p) => !pos || pos.includes(p.pos)).map((p) => p.id));
const overlap = (a: Set<number>, b: Set<number>) => [...a].filter((x) => b.has(x)).length;
const share = (a: Set<number>, b: Set<number>) => (Math.max(a.size, b.size) === 0 ? 100 : (overlap(a, b) / Math.max(a.size, b.size)) * 100);
const mean = (xs: number[]) => xs.reduce((s, v) => s + v, 0) / xs.length;

/** Players who started at least 60% of the recent matches (three of five). */
export function regularStarters(prev: TeamLineup[]): Set<number> {
  const recent = prev.slice(0, 5);
  const counts = new Map<number, number>();
  recent.forEach((l) => l.players.forEach((p) => counts.set(p.id, (counts.get(p.id) ?? 0) + 1)));
  const need = Math.max(2, Math.ceil(recent.length * 0.6));
  return new Set([...counts].filter(([, n]) => n >= need).map(([id]) => id));
}

/**
 * How much a missing player matters, from how often they started recently.
 * `prev` is the team's earlier lineups, newest first.
 */
export function absenceImpact(playerId: number, prev: TeamLineup[]): { impact: Impact; started: number; of: number } {
  const recent = prev.slice(0, 5);
  const started = recent.filter((l) => l.players.some((p) => p.id === playerId)).length;
  if (recent.length < 3) return { impact: "Unknown", started, of: recent.length };
  const r = started / recent.length;
  return { impact: r >= 0.6 ? "High" : r >= 0.4 ? "Medium" : "Low", started, of: recent.length };
}

/** `cur` is the predicted or confirmed eleven, `prev` the team's earlier lineups (newest first). */
export function computeStability(cur: TeamLineup, prev: TeamLineup[], unavailableIds: number[]): TeamStability | null {
  if (prev.length === 0) return null;
  const used = prev.slice(0, 3);
  const all = idsOf(cur);
  const values: Record<string, number> = {
    lineup: mean(used.map((l) => share(all, idsOf(l)))),
    backline: mean(used.map((l) => share(idsOf(cur, ["G", "D"]), idsOf(l, ["G", "D"])))),
    midfield: mean(used.map((l) => share(idsOf(cur, ["M"]), idsOf(l, ["M"]))))
  };
  const changes = Math.max(0, Math.max(all.size, idsOf(prev[0]).size) - overlap(all, idsOf(prev[0])));
  values.rotation = clamp(100 * (1 - changes / 6));

  const regulars = regularStarters(prev);
  const regularOut = unavailableIds.filter((id) => regulars.has(id)).length;
  values.availability = clamp(100 - 15 * regularOut - 3 * (unavailableIds.length - regularOut));

  const factors: StabilityFactor[] = STABILITY_FACTORS.map((f) => ({ ...f, value: Math.round(values[f.key]) }));
  const score = Math.round(STABILITY_FACTORS.reduce((s, f) => s + values[f.key] * f.weight, 0));
  return { score, label: stabilityLabel(score), factors, comparedWith: used.length, changes };
}
