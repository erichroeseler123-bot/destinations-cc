import {
  ACTION_CARDS,
  HUBS,
  QR_TEST_URLS,
  RIVER_OPS_OUTBOUND_TARGETS,
  RIVER_OPS_TERMINAL,
  SITE_URL,
} from "@/lib/content";
import {
  OPERATOR_SURFACES,
  buildOperatorSurfaceUrl,
} from "@/lib/operatorSurfaces";

export const dynamic = "force-static";

export function GET() {
  return Response.json(
    {
      version: "2026-05-06",
      site: {
        id: "welcometothedells",
        name: "Welcome to the Dells",
        url: SITE_URL,
        description:
          "The Wisconsin Dells satellite decision surface in the Destination Command Center network. It narrows River Ops, hub, and large-group food logistics decisions before execution handoff.",
        networkRole: "satellite_decision_surface",
        exclusions: ["hotels", "waterparks", "generic restaurant guides"],
      },
      dcc_affiliation: {
        parent_network: "Destination Command Center",
        parent_url: "https://www.destinationcommandcenter.com",
        relationship: "affiliated_network_site",
        network_role: "satellite_decision_surface",
        execution_tier: "decision_surface",
        operational_function:
          "Narrows Wisconsin Dells activity, transportation, and group logistics decisions.",
        canonical_network_page: "https://www.destinationcommandcenter.com/network",
        doctrine: [
          "decision_compression",
          "one_recommended_move",
          "execution_continuity",
          "marketplace_inventory_is_fallback",
        ],
        continuity_contract:
          "DCC routes Dells intent; Welcome to the Dells narrows the local decision before execution handoff.",
      },
      relationship_graph: {
        parent: {
          name: "Destination Command Center",
          url: "https://www.destinationcommandcenter.com",
          role: "decision_hub",
        },
        node: {
          name: "Welcome to the Dells",
          url: SITE_URL,
          role: "satellite_decision_surface",
          function: "narrows Wisconsin Dells activity, transportation, and group logistics intent",
        },
        preferred_execution: {
          name: "FeastlySpread",
          url: "https://feastlyspread.com",
          role: "owned_execution_operator",
          execution_tier: "owned_execution",
          function: "executes resolved large-group food logistics intent for Wisconsin Dells rentals",
          preferred_for: ["large_group_food", "rental_house_breakfast", "rental_house_dinner"],
        },
      },
      machineReadable: {
        llms: `${SITE_URL}/llms.txt`,
        canonical_network_page: "https://www.destinationcommandcenter.com/network",
      },
      canonicalPaths: [
        {
          path: "/",
          role: "promoted_next_stop_surface",
          corridor_id: "wisconsin-dells-next-stop",
          decision: "Which Dells hub should I use right now?",
        },
        {
          path: "/lounge",
          role: "editorial_section",
          corridor_id: "wisconsin-dells-lounge",
          decision: "What local texture, supper-club, neon, or after-hours move should frame the Dells plan?",
        },
        ...OPERATOR_SURFACES.map((surface) => ({
          path: surface.routePath,
          role: "execution_adjacent_operator_surface",
          corridor_id: surface.associatedCorridor,
          decision: surface.upstreamVerdict,
        })),
      ],
      revenuePriority: [
        {
          lane: "river_ops",
          description: "Boat tours, jet boats, ducks, night river tours, and canyon hardware.",
          primaryEvent: "product_opened",
        },
        {
          lane: "group_multiplier",
          description: "Feastly owned food-drop execution and DCC master-plan handoffs for large rental groups.",
          primaryEvent: "support_opened",
        },
      ],
      proofWindow: {
        phase: "first_100_sessions",
        landingEvent: "landing_viewed",
        clickEvents: ["product_opened", "support_opened", "next_stop_viewed", "hub_selected", "verdict_shown"],
        controlledQrUrls: QR_TEST_URLS,
      },
      outboundBridge: {
        pattern: `${SITE_URL}/out/wisconsin-dells/{slug}`,
        role: "stable_owned_redirect",
        doctrine:
          "River Ops cards preserve decision momentum by routing to exact controlled operator-ticket endpoints. Viator appears only as marketplace fallback coverage when controlled execution does not fit.",
        targets: RIVER_OPS_OUTBOUND_TARGETS.map((target) => ({
          slug: target.slug,
          label: target.label,
          provider: target.provider,
          route_kind: target.routeKind,
          mode: target.mode,
          execution_tier: target.routeKind === "marketplace_fallback" ? "marketplace_fallback_inventory" : "controlled_partner_execution",
          operator: target.operator,
          product_code: target.productCode || null,
          route: `${SITE_URL}/out/wisconsin-dells/${target.slug}`,
          final_host: new URL(target.targetUrl).host,
        })),
      },
      operatorSurfaces: OPERATOR_SURFACES.map((surface) => ({
        slug: surface.slug,
        route: buildOperatorSurfaceUrl(surface),
        role: "execution_confirmation_surface",
        associated_corridor: surface.associatedCorridor,
        decision_product: surface.decisionProduct,
        execution_entity: surface.executionEntity,
        execution_tier: surface.executionTier,
        upstream_verdict: surface.upstreamVerdict,
        outbound_route: surface.outboundHref,
        doctrine:
          "This is not an operator directory profile. It confirms who executes a River Ops decision already narrowed by Welcome to the Dells and DCC.",
      })),
      riverOpsTerminal: RIVER_OPS_TERMINAL.map((card) => ({
        rank: card.rank,
        slug: card.slug,
        title: card.title,
        category: card.category,
        intensity: card.intensity,
        commission_path: card.commissionPath,
        url: card.href,
      })),
      sections: [
        {
          path: "/lounge",
          name: "The Lounge",
          format: "newspaper_section",
          columns: ["The Supper Club Circuit", "Neon Watch", "After Hours", "River Ops display ads"],
        },
      ],
      hubs: HUBS.map((hub) => ({
        id: hub.id,
        name: hub.name,
        role: hub.role,
        bestFor: hub.bestFor,
        friction: hub.friction,
        defaultMove: hub.defaultMove,
      })),
      actions: ACTION_CARDS.map((card) => ({
        id: card.id,
        hub_id: card.hubId,
        title: card.title,
        handoff_type: card.handoffType,
        execution_tier:
          card.handoffType === "owned_execution"
            ? "owned_execution"
            : card.handoffType === "controlled_execution"
              ? "controlled_partner_execution"
              : card.handoffType === "marketplace_fallback"
                ? "marketplace_fallback_inventory"
                : "decision_surface",
        parking_friction: card.parkingFriction,
        time_commitment: card.timeCommitment,
        escape_route: card.escapeRoute,
        url: card.href,
      })),
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    },
  );
}
