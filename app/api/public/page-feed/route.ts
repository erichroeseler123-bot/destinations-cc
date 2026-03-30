import { getAgentPageFeed } from "@/lib/dcc/agentFeed";

export const dynamic = "force-static";

export function GET(request: Request) {
  const url = new URL(request.url);
  const path = url.searchParams.get("path") || "/";
  const feed = getAgentPageFeed(path);

  if (!feed) {
    return Response.json(
      {
        ok: false,
        error: "unsupported_path",
        supportedPattern: "/api/public/page-feed?path=/example",
      },
      {
        status: 404,
        headers: {
          "Cache-Control": "public, max-age=300, s-maxage=300",
        },
      }
    );
  }

  return Response.json(feed, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
