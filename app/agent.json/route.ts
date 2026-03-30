import { listAgentPageFeedPaths } from "@/lib/dcc/agentFeed";
import { SITE_IDENTITY } from "@/src/data/site-identity";

export const dynamic = "force-static";

export function GET() {
  const manifest = {
    version: "2026-03-19",
    site: {
      id: "destinationcommandcenter",
      name: SITE_IDENTITY.name,
      url: "https://www.destinationcommandcenter.com",
      description: SITE_IDENTITY.canonicalDescription,
    },
    machineReadable: {
      llms: "https://www.destinationcommandcenter.com/llms.txt",
      pageFeedTemplate:
        "https://www.destinationcommandcenter.com/api/public/page-feed?path={pathname}",
      networkFeed: "https://www.destinationcommandcenter.com/api/public/network-feed",
      mediaFeedTemplate:
        "https://www.destinationcommandcenter.com/api/public/media-feed?entityType={entityType}&slug={slug}",
    },
    canonicalPaths: listAgentPageFeedPaths(),
    topics: [
      "cities",
      "shows",
      "tours",
      "attractions",
      "transportation",
      "alerts",
      "airports",
      "stations",
      "ports",
    ],
  };

  return Response.json(manifest, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
