import {
  HUBS,
  RIVER_OPS_OUTBOUND_TARGETS,
  RIVER_OPS_TERMINAL,
  SITE_URL,
} from "@/lib/content";

export const dynamic = "force-static";

export function GET() {
  return Response.json(
    {
      version: "2026-08-11",
      site: {
        id: "welcometothedells",
        name: "Welcome to the Dells",
        url: SITE_URL,
        description:
          "Consumer-first Wisconsin Dells discovery and planning for things to do, boat tours, Ducks, waterparks, rainy-day activities, family trips, adults-only trips, tonight plans, area guides, and large-group logistics.",
        role: "local_destination_discovery_and_decision_layer",
        areaServed: ["Wisconsin Dells, Wisconsin", "Lake Delton, Wisconsin"],
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
      revenuePriority: [
        {
          lane: "river_and_signature_experiences",
          description: "Boat tours, jet boats, Original Wisconsin Ducks, Ghost Boat, and sunset/scenic river products.",
          primaryEvent: "product_opened",
        },
        {
          lane: "large_group_logistics",
          description: "Large-group planning and Feastly food logistics handoffs.",
          primaryEvent: "support_opened",
        },
      ],
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
      destinationCommandCenter: {
        relationship: "broader_destination_research_layer",
        url: "https://www.destinationcommandcenter.com/wisconsin-dells",
        useWhen: "The visitor wants broader city context before narrowing the local decision on Welcome to the Dells.",
      },
      machineReadable: {
        llms: `${SITE_URL}/llms.txt`,
        sitemap: `${SITE_URL}/sitemap.xml`,
        robots: `${SITE_URL}/robots.txt`,
      },
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    },
  );
}
