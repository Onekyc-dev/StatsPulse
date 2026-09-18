/**
 * Baseline goal model.
 * Each team's expected goals (xG) feeds a Poisson distribution; combining the
 * two gives the probability of every scoreline, which we sum into markets.
 * This is a starting baseline, to be backtested before it is shown as a prediction.
 */
const MAX_GOALS = 8;

export type GoalOutlook = {
  homeWin: number; // whole percentages, homeWin + draw + awayWin = 100
  draw: number;
  awayWin: number;
  btts: number;
  over25: number;
  likelyScore: [number, number];
  likelyScoreChance: number;
};

function poissonSeries(lambda: number): number[] {
  const out: number[] = [];
  let p = Math.exp(-lambda);
  out.push(p);
  for (let k = 1; k <= MAX_GOALS; k++) {
    p = (p * lambda) / k;
    out.push(p);
  }
  return out;
}

/** Rounds shares that sum to 1 into whole percentages that sum to exactly 100. */
export function roundToHundred(shares: number[]): number[] {
  const scaled = shares.map((s) => s * 100);
  const floors = scaled.map((v) => Math.floor(v));
  let remainder = 100 - floors.reduce((a, b) => a + b, 0);
  const order = scaled
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);
  for (const { i } of order) {
    if (remainder <= 0) break;
    floors[i] += 1;
    remainder -= 1;
  }
  return floors;
}

export function goalOutlook(homeXg: number, awayXg: number): GoalOutlook {
  const h = poissonSeries(homeXg);
  const a = poissonSeries(awayXg);

  let home = 0, draw = 0, away = 0, btts = 0, over = 0, total = 0;
  let best = 0;
  let bestScore: [number, number] = [0, 0];

  for (let i = 0; i <= MAX_GOALS; i++) {
    for (let j = 0; j <= MAX_GOALS; j++) {
      const p = h[i] * a[j];
      total += p;
      if (i > j) home += p;
      else if (i === j) draw += p;
      else away += p;
      if (i > 0 && j > 0) btts += p;
      if (i + j >= 3) over += p;
      if (p > best) {
        best = p;
        bestScore = [i, j];
      }
    }
  }

  const [homeWin, drawPct, awayWin] = roundToHundred([home / total, draw / total, away / total]);

  return {
    homeWin,
    draw: drawPct,
    awayWin,
    btts: Math.round((btts / total) * 100),
    over25: Math.round((over / total) * 100),
    likelyScore: bestScore,
    likelyScoreChance: Math.round((best / total) * 100)
  };
}
