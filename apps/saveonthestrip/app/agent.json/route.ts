import { listSaveOnTheStripAgentPaths } from "@/lib/agentFeed";

export const dynamic = "force-static";

export function GET() {
  return Response.json(
    {
      version: "2026-08-10",
      site: {
        id: "saveonthestrip",
        name: "Save On The Strip",
        url: "https://saveonthestrip.com",
        description:
          "A Las Vegas decision guide for what is worth the money, what to do tonight, what to skip, and how to build a better trip without overspending.",
      },
      machineReadable: {
        llms: "https://saveonthestrip.com/llms.txt",
        sitemap: "https://saveonthestrip.com/sitemap.xml",
        pageFeedTemplate: "https://saveonthestrip.com/api/public/page-feed?path={pathname}",
      },
      canonicalPaths: listSaveOnTheStripAgentPaths(),
      decisionPaths: [
        "/tonight",
        "/worth-it",
        "/under-100",
        "/near-your-hotel",
        "/four-hours-in-vegas",
        "/before-a-late-flight",
        "/what-to-skip-in-las-vegas",
        "/compare/sphere-vs-vegas-show",
        "/compare/grand-canyon-vs-hoover-dam",
      ],
      topics: [
        "las-vegas",
        "what-to-do-tonight",
        "worth-it",
        "under-100",
        "shows",
        "tours",
        "free-things",
        "hotels",
        "comparisons",
        "trip-timing",
      ],
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    }
  );
}
