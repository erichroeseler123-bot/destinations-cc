import { listSaveOnTheStripAgentPaths } from "@/lib/agentFeed";

export const dynamic = "force-static";

export function GET() {
  return Response.json(
    {
      version: "2026-03-19",
      site: {
        id: "saveonthestrip",
        name: "Save On The Strip",
        url: "https://saveonthestrip.com",
        description:
          "Vegas-first trip planning across shows, tours, deals, free things, timeshares, and hotel change guides.",
      },
      machineReadable: {
        llms: "https://saveonthestrip.com/llms.txt",
        pageFeedTemplate: "https://saveonthestrip.com/api/public/page-feed?path={pathname}",
      },
      canonicalPaths: listSaveOnTheStripAgentPaths(),
      topics: [
        "las-vegas",
        "shows",
        "tours",
        "deals",
        "free-things",
        "timeshares",
        "hotels",
      ],
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    }
  );
}
