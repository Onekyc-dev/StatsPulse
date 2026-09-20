import type { Match, Result } from "./types";

export function leanHeadline(m: Match): string | null {
  const o = m.outlook;
  if (!o) return null;
  if (Math.abs(o.homeWin - o.awayWin) < 6) return "Too close to call";
  const homeLeads = o.homeWin > o.awayWin;
  const name = homeLeads ? m.home.name : m.away.name;
  const best = homeLeads ? o.homeWin : o.awayWin;
  return best >= 55 ? `${name} are clear favourites` : `${name} are slight favourites`;
}

export type Insight = { kind: "xg" | "form" | "absence" | "goals" | "stability"; text: string };

/** Injury news only exists once the provider has a lineup for the match, roughly two weeks before kickoff. */
export function absencesKnown(m: Match): boolean {
  return m.lineupStatus === "predicted" || m.lineupStatus === "confirmed" || m.home.absences.length + m.away.absences.length > 0;
}

const points = (f: Result[]) => f.reduce((s, r) => s + (r === "W" ? 3 : r === "D" ? 1 : 0), 0);
const isOut = (status: string, reason: string) => !(reason === "coach_decision" || status === "coach_decision");

/** Insights are generated from the data, so they cannot contradict it. */
export function buildInsights(m: Match): Insight[] {
  const out: Insight[] = [];
  const o = m.outlook;

  if (o) {
    const homeMore = o.homeXg >= o.awayXg;
    out.push({
      kind: "xg",
      text: `${homeMore ? m.home.name : m.away.name} are expected to score more (${Math.max(o.homeXg, o.awayXg).toFixed(2)} v ${Math.min(o.homeXg, o.awayXg).toFixed(2)} in the model).`
    });
  }

  if (m.home.form.length > 0 && m.away.form.length > 0) {
    const hp = points(m.home.form);
    const ap = points(m.away.form);
    out.push({
      kind: "form",
      text:
        hp === ap
          ? `Recent form is level (${hp} points from the last ${m.home.form.length}).`
          : `Recent form favours ${hp > ap ? m.home.name : m.away.name} (${Math.max(hp, ap)} points v ${Math.min(hp, ap)}).`
    });
  }

  const hOut = m.home.absences.filter((a) => isOut(a.status, a.reason)).length;
  const aOut = m.away.absences.filter((a) => isOut(a.status, a.reason)).length;
  const highOf = (t: Match["home"]) => t.absences.filter((a) => isOut(a.status, a.reason) && a.impact === "High").length;
  const hHigh = highOf(m.home);
  const aHigh = highOf(m.away);
  const impactKnown = [...m.home.absences, ...m.away.absences].some((a) => a.impact !== null && a.impact !== "Unknown");
  out.push({
    kind: "absence",
    text: !absencesKnown(m)
      ? "Injury and suspension news is not available yet for this match."
      : hOut + aOut === 0
        ? "No unavailable players are listed for either side."
        : impactKnown
          ? hHigh + aHigh === 0
            ? "No regular starters are listed as unavailable."
            : `Regular starters unavailable: ${m.home.name} ${hHigh}, ${m.away.name} ${aHigh}.`
          : `Unavailable players: ${m.home.name} ${hOut}, ${m.away.name} ${aOut}.`
  });

  const hs = m.home.stability?.score;
  const as = m.away.stability?.score;
  if (hs !== undefined && as !== undefined) {
    out.push({
      kind: "stability",
      text:
        Math.abs(hs - as) >= 5
          ? `${hs > as ? m.home.name : m.away.name} are the more settled side (stability ${Math.max(hs, as)} v ${Math.min(hs, as)}).`
          : `Both sides are similarly settled (stability ${hs} and ${as}).`
    });
  }

  if (o) out.push({ kind: "goals", text: `The model gives both teams a ${o.btts}% chance to score.` });
  return out;
}

export function summaryText(m: Match): string {
  const ins = buildInsights(m);
  return ins.slice(0, 2).map((i) => i.text).join(" ");
}
