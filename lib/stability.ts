import type { StabilityInputs } from "./types";

/** The score is a plain weighted average, so every part of it can be shown to the user. */
export const STABILITY_FACTORS: {
  key: keyof StabilityInputs;
  label: string;
  weight: number;
  hint: string;
}[] = [
  { key: "lineup", label: "Lineup continuity", weight: 0.3, hint: "How closely the expected XI matches recent starting elevens" },
  { key: "defence", label: "Defensive pairing", weight: 0.25, hint: "Whether the usual back line is intact" },
  { key: "midfield", label: "Midfield pairing", weight: 0.2, hint: "Whether the usual midfield partnership is intact" },
  { key: "availability", label: "Availability", weight: 0.15, hint: "Share of regular starters who are fit and eligible" },
  { key: "rotation", label: "Rotation", weight: 0.1, hint: "Fewer forced or heavy changes scores higher" }
];

export function stabilityScore(s: StabilityInputs): number {
  const total = STABILITY_FACTORS.reduce((sum, f) => sum + s[f.key] * f.weight, 0);
  return Math.round(total);
}

export function stabilityLabel(score: number): "Settled" | "Mostly settled" | "Disrupted" {
  if (score >= 80) return "Settled";
  if (score >= 60) return "Mostly settled";
  return "Disrupted";
}
