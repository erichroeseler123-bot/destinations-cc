export const dynamic = "force-static";

export function GET() {
  return Response.json(
    {
      version: "2026-03-19",
      network: "destinationcommandcenter",
      sites: [
        {
          id: "destinationcommandcenter",
          name: "Destination Command Center",
          url: "https://www.destinationcommandcenter.com",
          agentManifest: "https://www.destinationcommandcenter.com/agent.json",
          llms: "https://www.destinationcommandcenter.com/llms.txt",
          pageFeedTemplate:
            "https://www.destinationcommandcenter.com/api/public/page-feed?path={pathname}",
          mediaFeedTemplate:
            "https://www.destinationcommandcenter.com/api/public/media-feed?entityType={entityType}&slug={slug}",
          mediaResolveTemplate:
            "https://www.destinationcommandcenter.com/api/public/media?entityType={entityType}&slug={slug}&q={query}",
          status: "live",
        },
        {
          id: "saveonthestrip",
          name: "Save On The Strip",
          url: "https://saveonthestrip.com",
          agentManifest: "https://saveonthestrip.com/agent.json",
          llms: "https://saveonthestrip.com/llms.txt",
          pageFeedTemplate: "https://saveonthestrip.com/api/public/page-feed?path={pathname}",
          mediaFeedTemplate:
            "https://www.destinationcommandcenter.com/api/public/media-feed?entityType={entityType}&slug={slug}",
          mediaResolveTemplate:
            "https://www.destinationcommandcenter.com/api/public/media?entityType={entityType}&slug={slug}&q={query}",
          status: "live",
        },
      ],
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    }
  );
}
