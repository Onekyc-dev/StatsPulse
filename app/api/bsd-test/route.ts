/** Retired. The temporary provider test page has been switched off. */
export function GET() {
  return new Response("This test page has been retired.", { status: 410, headers: { "content-type": "text/plain; charset=utf-8" } });
}
