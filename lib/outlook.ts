import type { Match } from "./types";
import { goalOutlook, type GoalOutlook } from "./poisson";
import { stabilityScore } from "./stability";

export function getOutlook(m: Match): GoalOutlook {
  return goalOutlook(m.homeXg, m.awayXg);
}

export function leanHeadline(m: Match, o: GoalOutlook): string {
  const gap = Math.abs(o.homeWin - o.awayWin);
  if (gap < 6) return "Too close to call";
  const homeLeads = o.homeWin > o.awayWin;
  const name = homeLeads ? m.home.name : m.away.name;
  const best = homeLeads ? o.homeWin : o.awayWin;
  return best >= 55 ? `${name} are clear favourites` : `${name} are slight favourites`;
}

export type Insight = { kind: "xg" | "stability" | "absence" | "goals"; text: string };

/** Insights are generated from the numbers, so they can never contradict the data. */
export function buildInsights(m: Match, o: GoalOutlook): Insight[] {
  const out: Insight[] = [];

  const hx = m.homeXg;
  const ax = m.awayXg;
  const leader = hx >= ax ? m.home.name : m.away.name;
  out.push({
    kind: "xg",
    text: `${leader} have the higher expected goals (${Math.max(hx, ax).toFixed(2)} v ${Math.min(hx, ax).toFixed(2)}).`
  });

  const hs = stabilityScore(m.home.stability);
  const as = stabilityScore(m.away.stability);
  if (Math.abs(hs - as) >= 5) {
    const settled = hs > as ? m.home.name : m.away.name;
    out.push({ kind: "stability", text: `${settled} are the more settled side (stability ${Math.max(hs, as)} v ${Math.min(hs, as)}).` });
  } else {
    out.push({ kind: "stability", text: `Both sides are similarly settled (stability ${hs} and ${as}).` });
  }

  const high = (t: Match["home"]) => t.absences.filter((a) => a.impact === "High").length;
  const hh = high(m.home);
  const ah = high(m.away);
  if (hh + ah === 0) {
    out.push({ kind: "absence", text: "Neither side has a high-impact absence." });
  } else {
    const parts: string[] = [];
    if (hh > 0) parts.push(`${m.home.name} ${hh}`);
    if (ah > 0) parts.push(`${m.away.name} ${ah}`);
    out.push({ kind: "absence", text: `High-impact absences: ${parts.join(", ")}.` });
  }

  out.push({ kind: "goals", text: `The model gives both teams a ${o.btts}% chance to score.` });
  return out;
}
