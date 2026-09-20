import type { Match, OutlookView } from "./types";

/** Confidence tiers, by the model's top probability. Shared by the backtest and the site so the labels always agree. */
export const TIERS = [
  { key: "high", label: "High confidence", min: 65, max: 101 },
  { key: "medium", label: "Moderate confidence", min: 50, max: 65 },
  { key: "low", label: "Low confidence", min: 0, max: 50 }
] as const;

export type TierKey = (typeof TIERS)[number]["key"];

export const topProbability = (o: OutlookView): number => Math.max(o.homeWin, o.draw, o.awayWin);

export function tierOf(top: number): TierKey {
  return top >= 65 ? "high" : top >= 50 ? "medium" : "low";
}

export function pickLabel(m: Match): string | null {
  const o = m.outlook;
  if (!o) return null;
  const top = topProbability(o);
  if (top === o.homeWin) return `${m.home.name} to win`;
  if (top === o.awayWin) return `${m.away.name} to win`;
  return "Draw";
}

/** Rough 95% range for a hit rate measured on n matches (normal approximation). */
export function interval95(percent: number, n: number): [number, number] {
  if (n <= 0) return [0, 100];
  const p = percent / 100;
  const se = Math.sqrt((p * (1 - p)) / n);
  return [Math.max(0, Math.round((p - 1.96 * se) * 100)), Math.min(100, Math.round((p + 1.96 * se) * 100))];
}
