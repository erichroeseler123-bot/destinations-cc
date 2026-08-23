import { listSaveOnTheStripAgentPaths } from "@/lib/agentFeed";

export const dynamic = "force-static";

const baseUrl = "https://saveonthestrip.com";
const portfolioFeed = "https://www.destinationcommandcenter.com/api/public/portfolio-feed";

export function GET() {
  return Response.json(
    {
      spec: "dcc-site-contract",
      version: "1.0",
      dcc_id: "dcc:site:save-on-the-strip",
      schema_version: "2026-08-23",
      site: {
        id: "save-on-the-strip",
        name: "Save On The Strip",
        url: baseUrl,
        type: "las_vegas_travel_planning",
        description:
          "A Las Vegas decision guide for what is worth the money, what to do tonight, what to skip, and how to build a better trip without overspending.",
      },
      authority: ["las_vegas_destination_content", "published_decision_guides", "published_comparisons"],
      service_area: {
        dcc_id: "dcc:destination:las-vegas",
        city: "Las Vegas",
        region: "Nevada",
        country: "US",
      },
      machine: {
        agent: `${baseUrl}/agent.json`,
        llms: `${baseUrl}/llms.txt`,
        sitemap: `${baseUrl}/sitemap.xml`,
        page_feed_template: `${baseUrl}/api/public/page-feed?path={pathname}`,
        portfolio_graph: portfolioFeed,
      },
      entry_points: [
        { path: "/tonight", method: "GET", purpose: "time-sensitive Las Vegas ideas" },
        { path: "/worth-it", method: "GET", purpose: "value-oriented recommendations" },
        { path: "/under-100", method: "GET", purpose: "options under a published budget threshold" },
        { path: "/near-your-hotel", method: "GET", purpose: "hotel-proximity decision support" },
      ],
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
      network: {
        parent_dcc_id: "dcc:site:destination-command-center",
        parent_url: "https://www.destinationcommandcenter.com",
        relationship: "affiliated destination planning property",
        portfolio_feed: portfolioFeed,
      },
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}
