import { headers } from "next/headers";
import { logDiscoveryRequest } from "@/lib/dcc/discoveryTelemetry";
import {
  getPublicCorridorContracts,
  getPublicMachineReadablePaths,
} from "@/lib/dcc/publicCorridorContract";
import { DCC_SITE_CONTRACT } from "@/lib/dcc/portfolioRegistry";
import { DCC_PRODUCT_SCOPE } from "@/lib/dcc/productScope";

import { SOMERSET_AGENT_PAYLOAD } from "@/app/somerset-wi/agent.json/handler";

export const dynamic = "force-dynamic";

const SITE_URL = "https://www.destinationcommandcenter.com";

export async function GET() {
  let host = "";
  let userAgent: string | null = null;
  let referer: string | null = null;
  try {
    const h = await headers();
    const hostHeader = h.get("x-forwarded-host") || h.get("host") || "";
    host = hostHeader.split(":")[0].toLowerCase();
    userAgent = h.get("user-agent");
    referer = h.get("referer");
  } catch {
    // Unit test / static execution context
  }

  if (host.includes("shuttletosomersetamphitheater")) {
    return Response.json(SOMERSET_AGENT_PAYLOAD, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  logDiscoveryRequest({
    surface: "agent_manifest",
    path: "/agent.json",
    userAgent,
    referer,
  });

  const manifest = {
    spec: DCC_SITE_CONTRACT.spec,
    version: DCC_SITE_CONTRACT.version,
    dcc_id: "dcc:site:destination-command-center",
    schema_version: "2026-10-23",
    product_scope: {
      url: `${SITE_URL}/scope.json`,
      contract: DCC_PRODUCT_SCOPE,
    },
    site: {
      id: "destination-command-center",
      name: "Destination Command Center",
      url: SITE_URL,
      type: "travel_reference_and_location_intelligence_graph",
      primary_role: DCC_PRODUCT_SCOPE.primaryProduct.id,
      description:
        "Travel reference and decision platform supported by live, source-attributed coordinate intelligence, developer APIs, and venue widgets.",
      preferred_interpretation:
        "Treat DCC as a source-attributed travel reference and decision platform backed by coordinate-native public location intelligence. Curated destination reference nodes (/juneau, /ports/juneau, /red-rocks, /venues/red-rocks-amphitheatre, /routes/denver-breckenridge, /new-orleans, /ports/new-orleans, /vegas) provide deep travel preparation, 6-factor entry dependency modeling, operational safety boundaries, and evidence ledgers, while any latitude and longitude on Earth resolves to live public environmental telemetry (/location/{lat}/{lng} and /api/location/{lat}/{lng}).",
      not: DCC_PRODUCT_SCOPE.outOfScopeAsPrimaryIdentity,
    },
    authority: [
      "coordinate_identity",
      "public_location_context",
      "source_attributed_travel_reference",
      "entry_dependency_modeling",
      "operational_non_conflation_guardrails",
      "portfolio_site_identity",
      "cross_property_relationships",
      "canonical_public_portfolio_truth",
      "octo_participant_directory",
      "sovereign_operator_authority",
    ],
    travel_reference_architecture: DCC_PRODUCT_SCOPE.travelReferenceArchitecture,
    coordinate_contract: {
      canonical_key: DCC_PRODUCT_SCOPE.primaryProduct.canonicalIdentity,
      canonical_precision_decimals: 5,
      latitude_range: [-90, 90],
      longitude_range: [-180, 180],
      human_page_template: `${SITE_URL}${DCC_PRODUCT_SCOPE.primaryProduct.canonicalHumanPath}`,
      json_api_template: `${SITE_URL}${DCC_PRODUCT_SCOPE.primaryProduct.canonicalMachinePath}`,
      example: {
        coordinates: { lat: 39.6654, lng: -105.2057 },
        page: `${SITE_URL}/location/39.66540/-105.20570`,
        api: `${SITE_URL}/api/location/39.66540/-105.20570`,
        destination_reference: `${SITE_URL}/red-rocks`,
      },
      rule:
        "Normalize valid coordinates to five decimal places before constructing a canonical DCC location URL.",
    },
    resolution: {
      device_location:
        "Browser geolocation yields latitude and longitude, which route to the canonical coordinate page.",
      entered_location:
        "Addresses and named places are geocoded once to latitude and longitude, then route to the canonical coordinate page (which bridges to curated destination references when within a flagship corridor).",
      machine_coordinate_reads:
        "The machine coordinate API does not require reverse geocoding. Human-readable names are descriptive and optional; latitude and longitude remain the physical location identity.",
    },
    location_response: {
      schema: "dcc-location-v2",
      schemaVersion: 2,
      ordered_modules: DCC_PRODUCT_SCOPE.primaryProduct.allowedCoreModules,
      optional_enrichment_modules: DCC_PRODUCT_SCOPE.primaryProduct.optionalEnrichmentModules,
      core_public_sources: [
        "Open-Meteo weather & snow models",
        "Open-Meteo / CAMS air quality",
        "U.S. National Weather Service forecasts and alerts when geographically applicable",
        "U.S. Geological Survey earthquakes",
        "NASA EONET natural events",
        "NOAA National Water Prediction Service gauges when geographically applicable",
        "NOAA CO-OPS tide & water-level stations when coastal",
        "NOAA NDBC marine buoys when coastal/offshore",
        "FAA / NWS Aviation Weather Center METAR & TAF within 120 km",
      ],
      compatibility_aliases: ["weather", "alerts", "earthquakes", "events", "machineFeeds", "providerSlots", "travelReference"],
      source_rule:
        "Dynamic facts must be traceable to public or configured machine-readable sources and include source availability and freshness metadata. Missing modules or failed feeds mean unavailable mapped coverage—never proof that a hazard is absent or that a venue, road, or activity is safe.",
    },
    portfolio_truth: {
      feed: DCC_SITE_CONTRACT.truthFeedUrl,
      purpose:
        "Canonical public site identity, role, declared service status, authority boundaries, provenance and safe public claims for DCC portfolio properties.",
      inference_rule:
        "Do not infer ownership, live availability, live price, guarantees, operating status or third-party integrations when the truth feed does not explicitly publish them.",
    },
    octo_connectivity: {
      status: "pilot_and_directory_onboarding_layer",
      description:
        "Machine-readable discovery and OCTO Core v1.2.0 specification layer. In production, 0 external operators are currently live_authorized (participants are in technical_onboarding, contract_pending, or directory_only status, and sandbox mock inventory is strictly quarantined).",
      protocol: "Open Connectivity for Tour Operators (OCTO Core v1.2.0)",
      platform_take_rate: "5.0% fixed commission (when live_authorized)",
      merchant_of_record: "operator_direct_or_authorized_handoff",
      participant_directory: `${SITE_URL}/octo`,
      participant_api: `${SITE_URL}/api/octo/participants`,
      operator_directory: `${SITE_URL}/operators`,
      core_endpoints: {
        supplier: `${SITE_URL}/octo/supplier`,
        products: `${SITE_URL}/octo/products`,
        product_detail: `${SITE_URL}/octo/products/{productId}`,
        availability_calendar: `${SITE_URL}/octo/availability/calendar`,
        availability: `${SITE_URL}/octo/availability`,
        bookings: `${SITE_URL}/octo/bookings`,
        booking_detail: `${SITE_URL}/octo/bookings/{bookingUuid}`,
        booking_confirm: `${SITE_URL}/octo/bookings/{bookingUuid}/confirm`,
        booking_cancel: `${SITE_URL}/octo/bookings/{bookingUuid}/cancel`,
      },
      availability_endpoint: `${SITE_URL}/octo/availability`,
      booking_hold_endpoint: `${SITE_URL}/octo/bookings`,
      booking_confirm_endpoint: `${SITE_URL}/octo/bookings/{bookingUuid}/confirm`,
      hold_expiration_rule: "Explicit expirationMinutes enforced per OCTO Core specification",
    },
    caching: {
      response_shared_cache_seconds: 60,
      stale_while_revalidate_seconds: 240,
      source_specific_revalidation: true,
      reason:
        "DCC deduplicates common coordinate reads and respects upstream public-service capacity instead of refetching every provider on every agent request.",
    },
    discovery: {
      llms: `${SITE_URL}/llms.txt`,
      agent: `${SITE_URL}/agent.json`,
      agent_well_known: `${SITE_URL}/.well-known/agent.json`,
      scope: `${SITE_URL}/scope.json`,
      openapi: `${SITE_URL}/openapi.json`,
      developers: `${SITE_URL}/developers`,
      about: `${SITE_URL}/about`,
      locations_sitemap: `${SITE_URL}/locations-sitemap.xml`,
      portfolio_feed: DCC_SITE_CONTRACT.registryUrl,
      truth_feed: DCC_SITE_CONTRACT.truthFeedUrl,
      octo_directory: `${SITE_URL}/octo`,
      octo_participants: `${SITE_URL}/api/octo/participants`,
      octo_products: `${SITE_URL}/octo/products`,
      octo_supplier: `${SITE_URL}/octo/supplier`,
      operators_directory: `${SITE_URL}/operators`,
      dcc_machine_well_known: `${SITE_URL}/.well-known/dcc`,
      dcc_machine_inspector: `${SITE_URL}/machine/inspector`,
    },
    machine: {
      portfolio_graph: DCC_SITE_CONTRACT.registryUrl,
      portfolio_truth: DCC_SITE_CONTRACT.truthFeedUrl,
      coordinate_api_template: `${SITE_URL}/api/location/{lat}/{lng}`,
      octo_supplier: `${SITE_URL}/octo/supplier`,
      octo_products: `${SITE_URL}/octo/products`,
      octo_availability: `${SITE_URL}/octo/availability`,
      octo_availability_calendar: `${SITE_URL}/octo/availability/calendar`,
      octo_bookings: `${SITE_URL}/octo/bookings`,
      octo_participants: `${SITE_URL}/api/octo/participants`,
      octo_hold: `${SITE_URL}/api/octo/hold`,
      octo_confirm: `${SITE_URL}/api/octo/confirm`,
      dcc_well_known: `${SITE_URL}/.well-known/dcc`,
      entity_api_template: `${SITE_URL}/api/v1/entities/{id}`,
      claim_api_template: `${SITE_URL}/api/v1/claims/{id}`,
      source_api_template: `${SITE_URL}/api/v1/sources/{id}`,
      rule_api_template: `${SITE_URL}/api/v1/rules/{id}`,
      engine_api_template: `${SITE_URL}/api/v1/engines/{id}`,
      bundle_api_template: `${SITE_URL}/api/v1/bundles/{engineId}/{version}`,
      evaluate_api: `${SITE_URL}/api/v1/evaluate`,
      evaluate_batch_api: `${SITE_URL}/api/v1/evaluations:batch`,
      changes_api: `${SITE_URL}/api/v1/changes?since={cursor}`,
      reference_resolver_template: `${SITE_URL}/r/{id}`,
      immutable_reference_resolver_template: `${SITE_URL}/r/{id}/v/{version}`,
    },
    dcc_machine_layer: {
      version: "0.1.0",
      ir_schema_version: "dcc-decision-ir/0.1",
      reference_envelope_spec: "dcc-reference-envelope/0.1",
      well_known: `${SITE_URL}/.well-known/dcc`,
      evaluate_endpoint: `${SITE_URL}/api/v1/evaluate`,
      batch_evaluate_endpoint: `${SITE_URL}/api/v1/evaluations:batch`,
      reference_resolver: `${SITE_URL}/r/{id}`,
      immutable_reference_resolver: `${SITE_URL}/r/{id}/v/{version}`,
      active_engines: ["juneau-helicopter-tours", "hawaii-whale-watching"],
    },
    network: {
      role: "canonical_directory_and_relationship_graph",
      portfolio_feed: DCC_SITE_CONTRACT.registryUrl,
      truth_feed: DCC_SITE_CONTRACT.truthFeedUrl,
    },
    usage_guidance: [
      "For curated destination preparation (entry rules, transport access, seasonality, safety boundaries, and source attribution), use /juneau, /ports/juneau, /red-rocks, /venues/red-rocks-amphitheatre, and /routes/denver-breckenridge, or inspect the travelReference module on /api/location/{lat}/{lng}.",
      "If exact coordinates are known, call /api/location/{lat}/{lng} directly.",
      "Never conflate weather forecasts or 0 NWS alerts with venue operating status, lightning holds, road traction laws, or activity safety.",
      "Never treat missing or unavailable upstream feed data as an all-clear.",
      "Entry requirements depend on nationality, passport/documents, residence, transit routing, trip purpose, and dates—never answer visa or border questions from coordinates alone.",
      "Use /api/public/portfolio-feed for canonical public relationships between DCC portfolio properties.",
      "Use /api/public/truth-feed for canonical public site role, status, provenance and authority boundaries.",
      "Never infer ownership or live commercial facts from portfolio relationships or naming similarity.",
      "Preserve the exact coordinate pair when citing a DCC location page or API response.",
    ],
    legacy_travel_network: {
      status: "versioned_to_first_class_travel_reference_v3",
      explanation:
        "In schemaVersion 3 (2026-10-23), DCC intentionally versioned its scope so curated destination reference guides (/juneau, /red-rocks, /routes/denver-breckenridge) operate as first-class travel reference surfaces connected to coordinate intelligence, while older travel routes remain governed.",
      canonicalPaths: getPublicMachineReadablePaths(),
      corridors: getPublicCorridorContracts(),
    },
    canonicalPaths: getPublicMachineReadablePaths(),
    corridors: getPublicCorridorContracts(),
  };

  return Response.json(manifest, {
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
