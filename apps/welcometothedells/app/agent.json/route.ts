import {
  HUBS,
  RIVER_OPS_OUTBOUND_TARGETS,
  RIVER_OPS_TERMINAL,
  SITE_URL,
} from "@/lib/content";

export const dynamic = "force-static";

const portfolioFeed = "https://www.destinationcommandcenter.com/api/public/portfolio-feed";

export function GET() {
  return Response.json(
    {
      spec: "dcc-site-contract",
      version: "1.0",
      dcc_id: "dcc:site:welcome-to-the-dells",
      schema_version: "2026-08-23",
      site: {
        id: "welcome-to-the-dells",
        name: "Welcome to the Dells",
        url: SITE_URL,
        type: "wisconsin_dells_destination_planning",
        description:
          "Consumer-first Wisconsin Dells discovery and planning for things to do, boat tours, Ducks, waterparks, rainy-day activities, family trips, adults-only trips, tonight plans, area guides, and large-group logistics.",
        areaServed: ["Wisconsin Dells, Wisconsin", "Lake Delton, Wisconsin"],
      },
      authority: ["published_wisconsin_dells_destination_content", "published_decision_guides", "published_outbound_handoffs"],
      service_area: {
        dcc_id: "dcc:destination:wisconsin-dells",
        city: "Wisconsin Dells",
        region: "Wisconsin",
        country: "US",
      },
      canonicalPaths: [
        "/",
        "/things-to-do",
        "/boat-tours",
        "/waterparks",
        "/first-time",
        "/rainy-day",
        "/families",
        "/adults",
        "/tonight",
        "/large-groups",
        "/downtown",
        "/parkway",
        "/lake-delton",
        "/lounge",
      ],
      planningModel: {
        rule: "Choose one anchor, keep nearby stops together, and preserve a weather backup.",
        anchorTypes: ["river", "waterpark", "major attraction", "evening plan"],
      },
      riverExperiences: RIVER_OPS_TERMINAL.map((card) => ({
        slug: card.slug,
        title: card.title,
        category: card.category,
        intensity: card.intensity,
        summary: card.loungeIntel,
        outboundRoute: card.href,
      })),
      outboundBridge: {
        pattern: `${SITE_URL}/out/wisconsin-dells/{slug}`,
        rule: "Use current provider pages for live prices, availability, times, meeting details, and final terms.",
        targets: RIVER_OPS_OUTBOUND_TARGETS.map((target) => ({
          slug: target.slug,
          provider: target.provider,
          operator: target.operator,
          routeKind: target.routeKind,
          route: `${SITE_URL}/out/wisconsin-dells/${target.slug}`,
        })),
      },
      areas: HUBS.map((hub) => ({
        id: hub.id,
        name: hub.name,
        bestFor: hub.bestFor,
        friction: hub.friction,
        defaultMove: hub.defaultMove,
      })),
      machine: {
        agent: `${SITE_URL}/agent.json`,
        llms: `${SITE_URL}/llms.txt`,
        sitemap: `${SITE_URL}/sitemap.xml`,
        robots: `${SITE_URL}/robots.txt`,
        portfolio_graph: portfolioFeed,
      },
      booking_boundary: {
        rule: "Use the attraction, lodging, tour, or booking provider as the authority for live availability, price, payment, final inclusions, restrictions, and provider terms.",
      },
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
    },
  );
}
