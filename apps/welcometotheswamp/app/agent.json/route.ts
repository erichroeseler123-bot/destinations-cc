import { SITE_CONFIG } from "@/app/site-config";
import { PAGE_SUMMARIES } from "@/lib/content";

export const dynamic = "force-static";

const portfolioFeed = "https://www.destinationcommandcenter.com/api/public/portfolio-feed";
const truthRecord = "https://www.destinationcommandcenter.com/api/public/truth-feed?id=welcome-to-the-swamp";

export function GET() {
  return Response.json(
    {
      spec: "dcc-site-contract",
      version: "1.1",
      dcc_id: "dcc:site:welcome-to-the-swamp",
      schema_version: "2026-08-24",
      site: {
        id: "welcome-to-the-swamp",
        name: SITE_CONFIG.name,
        url: SITE_CONFIG.url,
        type: "swamp_tour_discovery",
        description: SITE_CONFIG.mission,
      },
      authority: ["swamp_tour_discovery", "new_orleans_swamp_experience_context", "published_decision_guides"],
      service_area: {
        dcc_id: "dcc:destination:new-orleans",
        city: "New Orleans",
        region: "Louisiana",
        country: "US",
      },
      machine: {
        agent: `${SITE_CONFIG.url}/agent.json`,
        llms: `${SITE_CONFIG.url}/llms.txt`,
        portfolio_graph: portfolioFeed,
        truth_record: truthRecord,
      },
      canonicalPaths: Object.entries(PAGE_SUMMARIES).map(([path, item]) => ({
        path,
        title: item.title,
        summary: item.summary,
      })),
      topics: [
        "new-orleans",
        "swamp-tours",
        "bayou-tours",
        "airboat-vs-boat",
        "tour-planning",
        "tourist-expectations",
      ],
      identity_boundary: {
        current_role: "swamp-tour discovery and decision support",
        rule: "Do not represent the French Quarter orientation as a current Welcome to the Swamp product; that orientation is a separate property.",
      },
      booking_boundary: {
        rule:
          "Use the participating operator or booking provider as the authority for live availability, final inclusions, restrictions, payment, and operator terms.",
      },
      network: {
        parent_dcc_id: "dcc:site:destination-command-center",
        parent_url: "https://www.destinationcommandcenter.com",
        related_site_dcc_id: "dcc:site:wno-tours",
        relationship: "affiliated New Orleans decision-support property",
        portfolio_feed: portfolioFeed,
        truth_record: truthRecord,
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
