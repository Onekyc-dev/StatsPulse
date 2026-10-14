import { bsd } from "@/lib/bsd";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "salah";
  try {
    const raw = await bsd<unknown>(`/players/?search=${encodeURIComponent(q)}&limit=5`, { revalidate: 0 });
    return Response.json({ ok: true, query: q, raw }, { status: 200 });
  } catch (e) {
    return Response.json({ ok: false, query: q, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}