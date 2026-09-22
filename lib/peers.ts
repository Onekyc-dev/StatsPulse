import type { Aggregate } from "./players";

export type Group = "G" | "D" | "M" | "F";

export type PeerRow = { playerId: number; group: Group; minutes: number; per90: Record<string, number> };

type Def = {
  key: string; // key in per90
  label: string;
  unit: string;
  decimals: number;
  better: "high" | "low";
  groups: Group[];
  strength: string;
  weakness: string;
};

const DEFS: Def[] = [
  { key: "goals", label: "goals", unit: "goals per 90", decimals: 2, better: "high", groups: ["F", "M"], strength: "Scores goals at a high rate", weakness: "Scores less often than most" },
  { key: "xg", label: "chance quality", unit: "xG per 90", decimals: 2, better: "high", groups: ["F", "M"], strength: "Gets into very good scoring positions", weakness: "Rarely gets into good scoring positions" },
  { key: "shots", label: "shooting volume", unit: "shots per 90", decimals: 1, better: "high", groups: ["F", "M"], strength: "Shoots often", weakness: "Shoots rarely" },
  { key: "assists", label: "assists", unit: "assists per 90", decimals: 2, better: "high", groups: ["F", "M"], strength: "Sets up goals regularly", weakness: "Creates few goals for others" },
  { key: "keyPasses", label: "chance creation", unit: "key passes per 90", decimals: 1, better: "high", groups: ["F", "M", "D"], strength: "Creates chances for team-mates", weakness: "Creates few chances" },
  { key: "dribbles", label: "dribbling", unit: "dribbles won per 90", decimals: 1, better: "high", groups: ["F", "M"], strength: "Beats opponents on the ball", weakness: "Rarely takes players on" },
  { key: "passAccuracy", label: "passing accuracy", unit: "% of passes completed", decimals: 0, better: "high", groups: ["M", "D"], strength: "Accurate, secure passer", weakness: "Gives the ball away with passing" },
  { key: "tackles", label: "tackling", unit: "tackles per 90", decimals: 1, better: "high", groups: ["M", "D"], strength: "Wins the ball back with tackles", weakness: "Makes few tackles" },
  { key: "interceptions", label: "reading of play", unit: "interceptions per 90", decimals: 1, better: "high", groups: ["M", "D"], strength: "Reads the game and cuts out passes", weakness: "Rarely intercepts the ball" },
  { key: "clearances", label: "clearing danger", unit: "clearances per 90", decimals: 1, better: "high", groups: ["D"], strength: "Clears danger consistently", weakness: "Clears the ball less than most defenders" },
  { key: "aerialsWon", label: "aerial duels", unit: "aerial duels won per 90", decimals: 1, better: "high", groups: ["F", "M", "D"], strength: "Strong in the air", weakness: "Rarely wins aerial duels" },
  { key: "duelsWon", label: "duels", unit: "duels won per 90", decimals: 1, better: "high", groups: ["F", "M", "D"], strength: "Wins a lot of duels", weakness: "Loses out in duels" },
  { key: "recoveries", label: "ball recoveries", unit: "recoveries per 90", decimals: 1, better: "high", groups: ["F", "M", "D"], strength: "Wins possession back", weakness: "Recovers the ball less than most" },
  { key: "fouls", label: "discipline", unit: "fouls per 90", decimals: 1, better: "low", groups: ["M", "D"], strength: "Disciplined, rarely fouls", weakness: "Fouls more than most" }
];

export const GROUP_NAME: Record<Group, string> = { G: "goalkeepers", D: "defenders", M: "midfielders", F: "forwards" };

export function groupOf(position: string): Group | null {
  const p = position.trim().toLowerCase();
  if (p.startsWith("g")) return "G";
  if (p.startsWith("d")) return "D";
  if (p.startsWith("m")) return "M";
  if (p.startsWith("f") || p.startsWith("a") || p.startsWith("s") || p.startsWith("w")) return "F";
  return null;
}

export type Finding = { key: string; text: string; detail: string; topPercent: number };
export type Assessment = { strengths: Finding[]; weaknesses: Finding[]; note: string | null; peers: number };

const MIN_PLAYER_MINUTES = 900;
const MIN_PEER_MINUTES = 900;
const MIN_PEERS = 25;

/** Share of peers this player beats, 0 to 100 (ties count half). */
export function percentile(value: number, peerValues: number[], better: "high" | "low"): number {
  if (peerValues.length === 0) return 50;
  let below = 0;
  for (const v of peerValues) {
    if (v === value) below += 0.5;
    else if (better === "high" ? v < value : v > value) below += 1;
  }
  return (below / peerValues.length) * 100;
}

export function assess(player: { group: Group | null; minutes: number; per90: Record<string, number> }, peers: PeerRow[], selfId: number | null): Assessment {
  const empty = (note: string, n = 0): Assessment => ({ strengths: [], weaknesses: [], note, peers: n });
  if (!player.group) return empty("The position is not known, so no comparison is possible.");
  if (player.group === "G") return empty("Goalkeeper comparisons are not available yet.");
  if (player.minutes < MIN_PLAYER_MINUTES) return empty(`Only ${Math.round(player.minutes)} minutes recorded over the last five years. At least ${MIN_PLAYER_MINUTES} are needed for a fair comparison.`);

  const pool = peers.filter((p) => p.group === player.group && p.minutes >= MIN_PEER_MINUTES && p.playerId !== selfId);
  if (pool.length < MIN_PEERS) return empty(`Still collecting data on other ${GROUP_NAME[player.group]}. ${pool.length} compared so far, ${MIN_PEERS} needed.`, pool.length);

  const findings: { def: Def; pct: number; value: number }[] = [];
  for (const def of DEFS) {
    if (!def.groups.includes(player.group)) continue;
    const value = player.per90[def.key];
    if (value === undefined) continue;
    const values = pool.map((p) => p.per90[def.key]).filter((v): v is number => typeof v === "number");
    if (values.length < MIN_PEERS) continue;
    findings.push({ def, pct: percentile(value, values, def.better), value });
  }
  const mk = (f: { def: Def; pct: number; value: number }, strength: boolean): Finding => {
    const top = Math.max(1, Math.round(strength ? 100 - f.pct : f.pct));
    const shown = f.value.toFixed(f.def.decimals);
    return {
      key: f.def.key,
      text: strength ? f.def.strength : f.def.weakness,
      detail: strength
        ? `Top ${top}% of current Premier League ${GROUP_NAME[player.group as Group]} for ${f.def.label} (${shown} ${f.def.unit})`
        : `Bottom ${top}% of current Premier League ${GROUP_NAME[player.group as Group]} for ${f.def.label} (${shown} ${f.def.unit})`,
      topPercent: top
    };
  };
  const strengths = findings.filter((f) => f.pct >= 80).sort((a, b) => b.pct - a.pct).slice(0, 4).map((f) => mk(f, true));
  const weaknesses = findings.filter((f) => f.pct <= 25).sort((a, b) => a.pct - b.pct).slice(0, 3).map((f) => mk(f, false));
  return {
    strengths,
    weaknesses,
    note: findings.length === 0 ? "No comparable statistics are available for this player yet." : strengths.length + weaknesses.length === 0 ? "No stand-out strengths or weaknesses compared with other players in the same position." : null,
    peers: pool.length
  };
}

/** Builds a comparison row from an aggregate. */
export function toPeer(playerId: number, position: string, agg: Aggregate): PeerRow | null {
  const group = groupOf(position);
  if (!group) return null;
  return { playerId, group, minutes: agg.minutes, per90: agg.per90 as Record<string, number> };
}
