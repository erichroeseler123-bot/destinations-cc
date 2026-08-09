import { NETWORK_GRAPH } from "@/src/data/network-graph";

export const dynamic = "force-static";

export function GET() {
  return Response.json(NETWORK_GRAPH, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "X-Robots-Tag": "noindex",
    },
  });
}
