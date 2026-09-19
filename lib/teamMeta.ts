const SHORT: Record<string, string> = {
  Arsenal: "ARS", "Aston Villa": "AVL", Bournemouth: "BOU", "AFC Bournemouth": "BOU", Brentford: "BRE",
  "Brighton & Hove Albion": "BHA", Brighton: "BHA", Burnley: "BUR", Chelsea: "CHE", "Crystal Palace": "CRY",
  Everton: "EVE", Fulham: "FUL", "Leeds United": "LEE", Liverpool: "LIV", "Manchester City": "MCI",
  "Manchester United": "MUN", "Newcastle United": "NEW", "Nottingham Forest": "NFO", Sunderland: "SUN",
  "Tottenham Hotspur": "TOT", "West Ham United": "WHU", "Wolverhampton Wanderers": "WOL", "Hull City": "HUL",
  "Ipswich Town": "IPS", "Coventry City": "COV", "Leicester City": "LEI", Southampton: "SOU",
  "Sheffield United": "SHU", "Luton Town": "LUT", "Norwich City": "NOR", "West Bromwich Albion": "WBA"
};

const COLOR: Record<string, string> = {
  Arsenal: "#ef4444", "Aston Villa": "#a3355f", Bournemouth: "#e5303a", "AFC Bournemouth": "#e5303a",
  Brentford: "#e63946", "Brighton & Hove Albion": "#3aa0ff", Chelsea: "#2f6fe4", "Crystal Palace": "#3b6fd8",
  Everton: "#3a63d6", Fulham: "#9aa4b2", "Leeds United": "#f0d341", Liverpool: "#e0313f",
  "Manchester City": "#6cc0f0", "Manchester United": "#e0242f", "Newcastle United": "#8b95a3",
  "Nottingham Forest": "#e0323b", Sunderland: "#e0323b", "Tottenham Hotspur": "#6d7dff",
  "West Ham United": "#a1345c", "Wolverhampton Wanderers": "#f5a623", Burnley: "#8c3b57"
};

function hashColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  const s = 0.62, l = 0.55;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * c).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function shortCode(name: string): string {
  return SHORT[name] ?? name.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase();
}

export function teamColor(name: string): string {
  return COLOR[name] ?? hashColor(name);
}

export function slugify(s: string): string {
  return s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
