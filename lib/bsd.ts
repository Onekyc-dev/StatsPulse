const BASE = "https://sports.bzzoiro.com/api/v2";
type Init = RequestInit & { next?: { revalidate: number } };

export type BsdEvent = {
  id: number;
  league_id: number;
  season_id: number | null;
  home_team_id: number | null;
  home_team: string;
  away_team_id: number | null;
  away_team: string;
  event_date: string;
  status: string;
  round_number: number | null;
  home_score: number | null;
  away_score: number | null;
  venue_id: number | null;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** One BSD request. Returns null on 404. Retries politely on rate limits and server errors. */
export async function bsd<T>(path: string, opts: { revalidate?: number } = {}): Promise<T | null> {
  const key = process.env.BSD_API_KEY;
  if (!key) throw new Error("BSD_API_KEY is not set");
  for (let attempt = 0; attempt < 3; attempt++) {
    const init: Init = { headers: { Authorization: `Token ${key}` } };
    if (opts.revalidate === undefined) init.cache = "no-store";
    else init.next = { revalidate: opts.revalidate };
    const res = await fetch(`${BASE}${path}`, init);
    if (res.status === 404) return null;
    if (res.status === 429 || res.status >= 500) {
      await sleep(800 * (attempt + 1));
      continue;
    }
    if (!res.ok) throw new Error(`BSD ${path} failed: ${res.status}`);
    return (await res.json()) as T;
  }
  throw new Error(`BSD ${path} kept failing`);
}

/** Reads every page of a list endpoint. */
export async function bsdList<T>(path: string): Promise<T[]> {
  const out: T[] = [];
  const sep = path.includes("?") ? "&" : "?";
  for (let offset = 0; offset < 4000; offset += 200) {
    const page = await bsd<{ results?: T[] }>(`${path}${sep}limit=200&offset=${offset}`);
    const rows = page?.results ?? [];
    out.push(...rows);
    if (rows.length < 200) break;
  }
  return out;
}
