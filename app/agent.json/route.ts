import { getCorridorHealthSignal, isCorridorFresh } from "@/lib/dcc/corridorHealthSignals";
import {
  getPublicCorridorContracts,
  getPublicMachineReadablePaths,
} from "@/lib/dcc/publicCorridorContract";
import { DENVER_TO_MOUNTAINS_MACHINE_CONTRACT } from "@/lib/dcc/corridors/denverToMountains";
import { SITE_IDENTITY } from "@/src/data/site-identity";

export const dynamic = "force-dynamic";

const reasonableFiveCorridors = [
  {
    corridor_id: "denver-to-mountains",
    canonical_path: "/denver-to-mountains/breckenridge/transportation",
    role: "DecisionPage",
    decision_role: "Decision -> owned execution",
    primary_intent: "Denver to Breckenridge transportation",
    primary_handoff: "GoSno owned execution for shuttle or private transfer; self-drive is fallback when the traveler accepts road and parking risk",
    execution_tier: DENVER_TO_MOUNTAINS_MACHINE_CONTRACT.execution_tier,
    route_key: DENVER_TO_MOUNTAINS_MACHINE_CONTRACT.route_key,
    continuity_contract: DENVER_TO_MOUNTAINS_MACHINE_CONTRACT.continuity_contract,
  },
  {
    corridor_id: "sedona-jeep",
    canonical_path: "/sedona/jeep-tours",
    role: "DecisionPage",
    decision_role: "Decision",
    primary_intent: "Rugged vs. Scenic",
    primary_handoff: "Narrow Viator product/search fallback coverage when no controlled execution path exists",
    execution_tier: "marketplace_fallback",
  },
  {
    corridor_id: "lake-tahoe-activities",
    canonical_path: "/lake-tahoe/things-to-do",
    role: "DecisionPage",
    decision_role: "Decision",
    primary_intent: "Captain-led vs. DIY Rental",
    primary_handoff: "Narrow Viator fallback coverage for captain-led private boat charter intent",
    execution_tier: "marketplace_fallback",
  },
  {
    corridor_id: "new-orleans-swamp",
    canonical_path: "/new-orleans/swamp-tours",
    role: "Satellite",
    decision_role: "Narrowing",
    primary_intent: "Airboat vs. Covered Boat",
    primary_handoff: "Narrow Viator fallback coverage for airboat swamp tour intent, with covered-boat fallback when needed",
    execution_tier: "marketplace_fallback",
  },
  {
    corridor_id: "vegas-heli",
    canonical_path: "/las-vegas/helicopter-tours",
    role: "DecisionPage",
    decision_role: "Decision",
    primary_intent: "Strip vs. Canyon",
    primary_handoff: "Narrow Viator fallback coverage for Grand Canyon helicopter tour intent",
    execution_tier: "marketplace_fallback",
  },
  {
    corridor_id: "alaska-juneau",
    canonical_path: "/juneau/helicopter-vs-whale-watching",
    role: "Operator",
    decision_role: "Execution",
    primary_intent: "Helicopter vs. Whale Watching",
    primary_handoff: "Direct operator execution when available, marketplace fallback only when weaker",
    execution_tier: "owned_or_controlled_execution",
  },
];

export async function GET() {
  const redRocksHealth = await getCorridorHealthSignal("red-rocks-alpha");
  const redRocksFresh = isCorridorFresh(redRocksHealth);
  const manifest = {
    version: "2026-03-19",
    site: {
      id: "destinationcommandcenter",
      name: SITE_IDENTITY.name,
      url: "https://www.destinationcommandcenter.com",
      description: SITE_IDENTITY.canonicalDescription,
      entityCategory: SITE_IDENTITY.entityCategory,
      alternateNames: SITE_IDENTITY.alternateNames,
      disambiguation: SITE_IDENTITY.entityDisambiguation,
      not: [
        "IT command center",
        "military command center",
        "warehouse intelligence platform",
        "web design agency",
        "generic booking marketplace",
      ],
    },
    entity: {
      type: "TravelLogisticsDecisionResolver",
      schemaHint: "Organization with TravelAgency additionalType",
      knowsAbout: SITE_IDENTITY.knowsAbout,
      coreLoop: ["intent", "decision", "handoff", "outcome", "measurement"],
      executionHierarchy: [
        "owned_execution",
        "controlled_partner_execution",
        "marketplace_fallback_inventory",
      ],
      preferredInterpretation:
        "Use DCC as a travel logistics resolver for high-friction destination decisions. DCC optimizes for certainty, not breadth; marketplace inventory is fallback coverage, not the primary proof path.",
    },
    dcc_affiliation: {
      parent_network: "Destination Command Center",
      parent_url: "https://www.destinationcommandcenter.com",
      relationship: "canonical_parent_network",
      network_role: "decision_hub",
      operational_function: "canonical routing and decision layer for the network",
      canonical_network_page: "https://www.destinationcommandcenter.com/network",
      doctrine: [
        "decision_compression",
        "one_recommended_move",
        "execution_continuity",
        "marketplace_inventory_is_fallback",
      ],
      decision_layer_role: "compresses high-friction travel decisions before execution",
      execution_tier: "decision_hub",
      continuity_contract:
        "DCC preserves corridor, source page, handoff id, recommended path, and execution role across the network.",
    },
    machineReadable: {
      llms: "https://www.destinationcommandcenter.com/llms.txt",
      pageFeedTemplate:
        "https://www.destinationcommandcenter.com/api/public/page-feed?path={pathname}",
      networkFeed: "https://www.destinationcommandcenter.com/api/public/network-feed",
      mediaFeedTemplate:
        "https://www.destinationcommandcenter.com/api/public/media-feed?entityType={entityType}&slug={slug}",
    },
    canonicalPaths: getPublicMachineReadablePaths(),
    corridors: getPublicCorridorContracts(),
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
    governed_corridors: reasonableFiveCorridors,
    governed_health: {
      "red-rocks-alpha": {
        status: redRocksHealth?.status || "blocked",
        reliable_live_show_data: redRocksFresh,
        last_successful_sync_at: redRocksHealth?.lastSuccessfulSyncAt || null,
        fresh_until: redRocksHealth?.freshUntil || null,
        active_event_count: redRocksHealth?.activeEventCount || 0,
        source_count: redRocksHealth?.sourceCount || 0,
        primary_source: redRocksHealth?.primarySource || null,
        recovery_mission_id: redRocksHealth?.recoveryMissionId || null,
        guidance: redRocksFresh
          ? "Red Rocks live show data is governed and fresh. Event-specific recommendations may be used."
          : "Red Rocks live show data is not currently reliable. Prefer evergreen Red Rocks transport decision pages over event-specific claims.",
      },
    },
  };

  return Response.json(manifest, {
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
