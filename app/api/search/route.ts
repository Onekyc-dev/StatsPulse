import { search } from "@/lib/search";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  try {
    return Response.json({ hits: await search(q) });
  } catch {
    return Response.json({ hits: [] });
  }
}
