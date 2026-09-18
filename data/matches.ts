import type { Match } from "@/lib/types";

/**
 * DEMO DATA. Fixtures, form, ratings, absences and stability inputs below are
 * placeholders so the interface can be designed and tested. They are replaced by
 * real data once the sports data provider and database are connected.
 * Player names are deliberately not used: absences are described by position.
 */
export const matches: Match[] = [
  {
    slug: "brentford-chelsea",
    competition: "Premier League",
    matchday: 5,
    venue: "Gtech Community Stadium",
    dateLabel: "Fri 18 Sep",
    time: "20:00",
    status: "TODAY",
    home: {
      name: "Brentford",
      short: "BRE",
      color: "#e63946",
      formation: "4-3-3",
      form: ["W", "W", "L", "D", "W"],
      avgScored: 1.6,
      avgConceded: 1.3,
      ratings: { attack: 7.2, defence: 6.6, midfield: 6.8, setPieces: 7.4, depth: 6.2 },
      stability: { lineup: 78, defence: 58, midfield: 74, availability: 70, rotation: 82 },
      absences: [
        {
          position: "Centre-back",
          status: "Doubtful",
          reason: "Knock",
          impact: "High",
          why: "A regular starter. Without him the usual back-line pairing is broken, which lowers defensive continuity."
        },
        {
          position: "Striker",
          status: "Out",
          reason: "Hamstring",
          impact: "Medium",
          why: "A rotation option. His absence reduces attacking depth more than the first-choice structure."
        }
      ]
    },
    away: {
      name: "Chelsea",
      short: "CHE",
      color: "#2f6fe4",
      formation: "4-2-3-1",
      form: ["D", "W", "W", "L", "W"],
      avgScored: 1.8,
      avgConceded: 1.1,
      ratings: { attack: 7.9, defence: 7.1, midfield: 7.6, setPieces: 6.5, depth: 8.2 },
      stability: { lineup: 62, defence: 70, midfield: 66, availability: 80, rotation: 48 },
      absences: [
        {
          position: "Central midfielder",
          status: "Doubtful",
          reason: "Illness",
          impact: "Medium",
          why: "Starts most weeks and links defence to attack. A replacement changes the midfield balance."
        },
        {
          position: "Winger",
          status: "Out",
          reason: "Ankle",
          impact: "Low",
          why: "Usually comes off the bench, so the effect on the starting eleven is small."
        }
      ]
    },
    homeXg: 1.22,
    awayXg: 1.57,
    corners: 10.1,
    cards: 4.2,
    summary:
      "Chelsea look stronger going forward, but heavy rotation keeps their stability lower than the raw numbers suggest. Brentford's back line is the open question: a doubtful centre-back would break their usual pairing."
  },
  {
    slug: "tottenham-aston-villa",
    competition: "Premier League",
    matchday: 5,
    venue: "Tottenham Hotspur Stadium",
    dateLabel: "Sat 19 Sep",
    time: "15:00",
    status: "UPCOMING",
    home: {
      name: "Tottenham",
      short: "TOT",
      color: "#6d7dff",
      formation: "4-3-3",
      form: ["W", "D", "W", "W", "L"],
      avgScored: 1.9,
      avgConceded: 1.4,
      ratings: { attack: 7.8, defence: 6.2, midfield: 7.0, setPieces: 6.9, depth: 7.1 },
      stability: { lineup: 72, defence: 60, midfield: 70, availability: 64, rotation: 66 },
      absences: [
        {
          position: "Full-back",
          status: "Out",
          reason: "Muscle injury",
          impact: "Medium",
          why: "Provides width on that side. His absence forces a shift in the back line."
        }
      ]
    },
    away: {
      name: "Aston Villa",
      short: "AVL",
      color: "#a3355f",
      formation: "4-2-3-1",
      form: ["L", "W", "D", "W", "W"],
      avgScored: 1.6,
      avgConceded: 1.2,
      ratings: { attack: 7.3, defence: 7.0, midfield: 7.2, setPieces: 6.8, depth: 6.9 },
      stability: { lineup: 84, defence: 88, midfield: 80, availability: 76, rotation: 78 },
      absences: [
        {
          position: "Forward",
          status: "Doubtful",
          reason: "Knock",
          impact: "Low",
          why: "A supporting option. The first-choice attack is unaffected."
        }
      ]
    },
    homeXg: 1.71,
    awayXg: 1.28,
    corners: 10.6,
    cards: 3.9,
    summary:
      "Tottenham's attack gives them the edge at home, but Aston Villa are the more settled team, with the same back line and midfield pairing for several matches. That keeps this closer than the attacking numbers suggest."
  },
  {
    slug: "brighton-arsenal",
    competition: "Premier League",
    matchday: 5,
    venue: "American Express Stadium",
    dateLabel: "Sat 19 Sep",
    time: "17:30",
    status: "UPCOMING",
    home: {
      name: "Brighton",
      short: "BHA",
      color: "#3aa0ff",
      formation: "4-2-3-1",
      form: ["D", "L", "W", "D", "W"],
      avgScored: 1.4,
      avgConceded: 1.5,
      ratings: { attack: 6.9, defence: 6.3, midfield: 6.8, setPieces: 6.4, depth: 6.6 },
      stability: { lineup: 58, defence: 52, midfield: 64, availability: 60, rotation: 56 },
      absences: [
        {
          position: "Centre-back",
          status: "Out",
          reason: "Knee injury",
          impact: "High",
          why: "A regular starter at the heart of the defence. His absence weakens the back line and its partnership."
        },
        {
          position: "Defensive midfielder",
          status: "Suspended",
          reason: "Yellow-card ban",
          impact: "Medium",
          why: "Screens the back line. Without him the defence is more exposed."
        }
      ]
    },
    away: {
      name: "Arsenal",
      short: "ARS",
      color: "#ef4444",
      formation: "4-3-3",
      form: ["W", "W", "W", "D", "W"],
      avgScored: 2.0,
      avgConceded: 0.8,
      ratings: { attack: 8.3, defence: 8.2, midfield: 8.1, setPieces: 7.9, depth: 7.8 },
      stability: { lineup: 88, defence: 90, midfield: 86, availability: 82, rotation: 80 },
      absences: [
        {
          position: "Winger",
          status: "Doubtful",
          reason: "Knock",
          impact: "Low",
          why: "One of several options in a deep squad. Little change to the overall shape."
        }
      ]
    },
    homeXg: 1.15,
    awayXg: 1.72,
    corners: 9.8,
    cards: 3.6,
    summary:
      "Arsenal arrive with the more settled lineup and the stronger underlying numbers. Brighton's disrupted back line, with a key defender out, is the main reason the model leans away from home."
  }
];

export const featuredMatch: Match = matches[0];

export function getMatch(slug: string): Match | undefined {
  return matches.find((m) => m.slug === slug);
}
