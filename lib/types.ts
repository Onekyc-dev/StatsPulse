export type Result = "W" | "D" | "L";
export type Impact = "High" | "Medium" | "Low";
export type AbsenceStatus = "Out" | "Doubtful" | "Suspended";

export type Absence = {
  position: string;
  status: AbsenceStatus;
  reason: string;
  impact: Impact;
  why: string;
};

/** Each value is 0-100. Higher = more settled. */
export type StabilityInputs = {
  lineup: number;
  defence: number;
  midfield: number;
  availability: number;
  rotation: number;
};

/** Each value is 0-10. */
export type Ratings = {
  attack: number;
  defence: number;
  midfield: number;
  setPieces: number;
  depth: number;
};

export type TeamData = {
  name: string;
  short: string;
  color: string; // 6-digit hex
  formation: string; // e.g. "4-3-3"
  form: Result[]; // oldest -> newest
  avgScored: number;
  avgConceded: number;
  ratings: Ratings;
  stability: StabilityInputs;
  absences: Absence[];
};

export type MatchStatus = "TODAY" | "UPCOMING" | "LIVE" | "FT";

export type Match = {
  slug: string;
  competition: string;
  matchday: number;
  venue: string;
  dateLabel: string;
  time: string;
  status: MatchStatus;
  home: TeamData;
  away: TeamData;
  homeXg: number;
  awayXg: number;
  corners: number;
  cards: number;
  summary: string;
};
