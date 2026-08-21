export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const target = new URL("/agent.json", request.url);
  const response = await fetch(target, { cache: "no-store" });
  const body = await response.text();

  return new Response(body, {
    status: response.status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
