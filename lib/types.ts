export type Result = "W" | "D" | "L";
export type MatchStatus = "UPCOMING" | "TODAY" | "LIVE" | "FT" | "OFF";

export type Absence = { name: string; status: string; reason: string };

export type TeamView = {
  id: number;
  name: string;
  short: string;
  color: string;
  form: Result[]; // oldest -> newest, up to 5
  avgScored: number | null;
  avgConceded: number | null;
  attack: number; // 0-10, 5 = league average
  defence: number; // 0-10, 5 = league average
  absences: Absence[];
};

export type OutlookView = {
  homeXg: number;
  awayXg: number;
  homeWin: number;
  draw: number;
  awayWin: number;
  btts: number;
  over25: number;
  likelyScore: [number, number];
};

export type LedgerView = {
  modelVersion: string;
  createdAt: string;
  updatedAt: string;
  lockedAt: string | null;
};

export type ProviderView = { homeWin: number; draw: number; awayWin: number } | null;

export type Match = {
  id: number;
  slug: string;
  competition: string;
  matchday: number | null;
  kickoff: string;
  dateLabel: string;
  time: string;
  status: MatchStatus;
  score: { home: number; away: number } | null;
  home: TeamView;
  away: TeamView;
  outlook: OutlookView | null;
  lineupStatus: string;
  lineupRaw: unknown;
  ledger: LedgerView | null;
  provider: ProviderView;
};

export type H2H = {
  total: number;
  homeWins: number;
  draws: number;
  awayWins: number;
  avgGoals: number | null;
  recent: { date: string; home: string; away: string; score: string }[];
};
