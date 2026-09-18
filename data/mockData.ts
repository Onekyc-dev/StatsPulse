export type Prediction = {
  homeWin: number;
  draw: number;
  awayWin: number;
  score: string;
  summary: string;
  homeXg: number;
  awayXg: number;
  btts: number;
  corners: number;
  shots: number;
  cards: number;
};

export type Match = {
  slug: string;
  competition: string;
  kickoff: string;
  status: string;
  time: string;
  home: string;
  away: string;
  homeShort: string;
  awayShort: string;
  prediction: Prediction;
};

export const featuredMatch: Match = {
  slug: "brentford-chelsea",
  competition: "Premier League · Matchday 5",
  kickoff: "Sep 18 · 20:00",
  status: "TODAY",
  time: "20:00",
  home: "Brentford",
  away: "Chelsea",
  homeShort: "BRE",
  awayShort: "CHE",
  prediction: {
    homeWin: 31,
    draw: 27,
    awayWin: 42,
    score: "1 – 2",
    summary: "Chelsea carry the stronger underlying profile, while Brentford's home setup keeps the matchup competitive.",
    homeXg: 1.22,
    awayXg: 1.57,
    btts: 58,
    corners: 10.1,
    shots: 24,
    cards: 4.2
  }
};

export const matches: Match[] = [
  featuredMatch,
  {
    ...featuredMatch,
    slug: "tottenham-aston-villa",
    kickoff: "Sep 19 · 15:00",
    time: "15:00",
    status: "UPCOMING",
    home: "Tottenham",
    away: "Aston Villa",
    homeShort: "TOT",
    awayShort: "AVL",
    prediction: { ...featuredMatch.prediction, homeWin: 45, draw: 28, awayWin: 27, score: "2 – 1" }
  },
  {
    ...featuredMatch,
    slug: "brighton-arsenal",
    kickoff: "Sep 19 · 17:30",
    time: "17:30",
    status: "UPCOMING",
    home: "Brighton",
    away: "Arsenal",
    homeShort: "BRI",
    awayShort: "ARS",
    prediction: { ...featuredMatch.prediction, homeWin: 24, draw: 25, awayWin: 51, score: "1 – 2" }
  }
];

export const previousMatches = [
  { date: "Sep 12", opponent: "Manchester United", result: "W", score: "2–1" },
  { date: "Sep 05", opponent: "Everton", result: "D", score: "1–1" },
  { date: "Aug 30", opponent: "Newcastle", result: "L", score: "0–2" },
  { date: "Aug 23", opponent: "West Ham", result: "W", score: "3–1" },
  { date: "Aug 16", opponent: "Fulham", result: "W", score: "2–0" }
];