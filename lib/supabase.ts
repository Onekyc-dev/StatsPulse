type Params = Record<string, string | string[]>;
type Init = RequestInit & { next?: { revalidate: number } };

function baseUrl(): string {
  const url = process.env.SUPABASE_URL;
  if (!url) throw new Error("SUPABASE_URL is not set");
  return `${url.replace(/\/$/, "")}/rest/v1`;
}

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("SUPABASE_SECRET_KEY is not set");
  const h: Record<string, string> = { apikey: key, "Content-Type": "application/json", ...extra };
  if (key.startsWith("eyJ")) h.Authorization = `Bearer ${key}`;
  return h;
}

/**
 * Sends a request and retries brief platform hiccups (for example "JWT issued at future" from a clock mismatch
 * between servers, rate limits, or server errors). A genuine authentication failure is not retried.
 */
async function request(url: string, init: Init): Promise<Response> {
  let res = await fetch(url, init);
  for (let attempt = 1; attempt <= 3; attempt++) {
    const transient = res.status >= 500 || res.status === 429 || (res.status === 401 && (await res.clone().text()).includes("future"));
    if (!transient) break;
    await new Promise((r) => setTimeout(r, 300 * attempt));
    const retry: Init = { ...init, cache: "no-store" };
    delete retry.next;
    res = await fetch(url, retry);
  }
  return res;
}

function qs(params: Params): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (Array.isArray(v)) v.forEach((x) => sp.append(k, x));
    else sp.append(k, v);
  }
  return sp.toString();
}

async function fail(what: string, res: Response): Promise<never> {
  throw new Error(`Supabase ${what} failed: ${res.status} ${(await res.text()).slice(0, 300)}`);
}

/** Server-side read. Pass revalidate (seconds) to cache; omit it for fresh data. */
export async function dbSelect<T>(table: string, params: Params, opts: { revalidate?: number } = {}): Promise<T[]> {
  const init: Init = { headers: authHeaders() };
  if (opts.revalidate === undefined) init.cache = "no-store";
  else init.next = { revalidate: opts.revalidate };
  const res = await request(`${baseUrl()}/${table}?${qs(params)}`, init);
  if (!res.ok) return fail(`select ${table}`, res);
  return (await res.json()) as T[];
}

/** Reads every row, in pages of 1000. The params must include a stable order, for example "kickoff.asc,id.asc". */
export async function dbSelectAll<T>(table: string, params: Params, opts: { revalidate?: number } = {}): Promise<T[]> {
  const out: T[] = [];
  for (let offset = 0; offset < 50000; offset += 1000) {
    const page = await dbSelect<T>(table, { ...params, limit: "1000", offset: String(offset) }, opts);
    out.push(...page);
    if (page.length < 1000) break;
  }
  return out;
}

/** Insert or update. Every row in one call must have the same keys. */
export async function dbUpsert(table: string, rows: object[], onConflict: string): Promise<void> {
  for (let i = 0; i < rows.length; i += 500) {
    const res = await request(`${baseUrl()}/${table}?on_conflict=${onConflict}`, {
      method: "POST",
      headers: authHeaders({ Prefer: "resolution=merge-duplicates,return=minimal" }),
      body: JSON.stringify(rows.slice(i, i + 500)),
      cache: "no-store"
    });
    if (!res.ok) return fail(`upsert ${table}`, res);
  }
}

/** Adds new rows (no merging). */
export async function dbInsert(table: string, rows: object[]): Promise<void> {
  if (rows.length === 0) return;
  const res = await request(`${baseUrl()}/${table}`, {
    method: "POST",
    headers: authHeaders({ Prefer: "return=minimal" }),
    body: JSON.stringify(rows),
    cache: "no-store"
  });
  if (!res.ok) return fail(`insert ${table}`, res);
}

export async function dbDelete(table: string, params: Params): Promise<void> {
  const res = await request(`${baseUrl()}/${table}?${qs(params)}`, {
    method: "DELETE",
    headers: authHeaders({ Prefer: "return=minimal" }),
    cache: "no-store"
  });
  if (!res.ok) return fail(`delete ${table}`, res);
}

export async function dbPatch(table: string, params: Params, body: object): Promise<void> {
  const res = await request(`${baseUrl()}/${table}?${qs(params)}`, {
    method: "PATCH",
    headers: authHeaders({ Prefer: "return=minimal" }),
    body: JSON.stringify(body),
    cache: "no-store"
  });
  if (!res.ok) return fail(`patch ${table}`, res);
}
