const SITE_URL = "https://www.destinationcommandcenter.com";

export const dynamic = "force-dynamic";

const contract = {
  spec: "dcc-portfolio-utility-contract",
  version: 1,
  generated_schema_version: "2026-08-23",
  purpose:
    "Define stable ownership and handoff boundaries between portfolio utilities and destination-facing satellite sites without changing satellite storefront identity.",
  principles: {
    human_surface_rule:
      "A satellite homepage must present only its own destination or niche purpose. Shared utilities are infrastructure, not the public brand.",
    canonical_owner_rule:
      "Each fact class has one canonical utility owner. Satellites may present or interpret utility data but should not silently become the source of truth for that fact class.",
    machine_first_rule:
      "Utilities expose stable machine-readable identities, provenance, freshness, and handoff URLs while human pages remain useful without knowing the portfolio architecture.",
    no_booking_side_effects:
      "Discovery and handoff endpoints must not create bookings, reservations, planner records, payments, or provider writes merely because they are called.",
  },
  utilities: [
    {
      id: "dcc:utility:location-context",
      name: "Destination Command Center",
      owner_site: "dcc:site:destination-command-center",
      canonical_url: SITE_URL,
      role: "location_and_live_public_context",
      authority: [
        "coordinate_identity",
        "place_relationships",
        "weather_and_public_conditions",
        "public_alerts",
        "public_machine_feed_relationships",
        "portfolio_relationship_graph",
      ],
      machine: {
        agent: `${SITE_URL}/agent.json`,
        scope: `${SITE_URL}/scope.json`,
        location_template: `${SITE_URL}/api/location/{lat}/{lng}`,
      },
    },
    {
      id: "dcc:utility:cruise-context",
      name: "Cruise Promenade",
      owner_site: "dcc:site:cruise-promenade",
      canonical_url: "https://cruisepromenade.com",
      role: "cruise_sailing_and_port_day_context",
      authority: [
        "cruise_ship_identity",
        "sailing_context",
        "cruise_port_calls",
        "arrival_and_departure_evidence",
        "cruise_day_planning_context",
      ],
      machine: {
        agent: "https://cruisepromenade.com/agent.json",
      },
    },
    {
      id: "dcc:utility:local-driver-marketplace",
      name: "Vibing Around Town",
      owner_site: "dcc:site:vibe-around-town",
      canonical_url: "https://www.vibearoundtown.com",
      role: "licensed_local_driver_inventory_and_request_flow",
      authority: [
        "driver_identity",
        "vehicle_identity",
        "driver_service_area",
        "driver_availability",
        "driver_price",
        "driver_request_and_acceptance_state",
      ],
      machine: {
        agent: "https://www.vibearoundtown.com/agent.json",
        cruise_handoff: "https://www.vibearoundtown.com/handoff/cruise-promenade",
      },
    },
    {
      id: "dcc:utility:live-entertainment",
      name: "Live Entertainment",
      owner_site: null,
      canonical_url: null,
      role: "event_venue_and_performance_schedule_context",
      status: "provider_unassigned",
      authority: ["event_identity", "venue_identity", "performance_schedule", "event_status"],
      machine: {},
      note:
        "Reserved contract slot. Do not fabricate a provider URL or event authority until the live-entertainment utility is assigned and verified.",
    },
  ],
  satellite_contract: {
    role: "destination_or_niche_storefront",
    may: [
      "render utility-derived facts when relevant to the visitor",
      "add destination-specific editorial interpretation",
      "link or hand off into a utility transaction flow",
      "declare utility relationships in machine-readable metadata",
    ],
    must: [
      "retain a clear standalone public purpose",
      "keep utility data provenance identifiable",
      "prefer canonical utility identifiers for shared entities",
      "avoid implying ownership of facts controlled by another utility",
    ],
    must_not: [
      "turn the homepage into portfolio infrastructure documentation",
      "duplicate mutable utility inventory as a second source of truth",
      "create a booking merely from a machine discovery request",
    ],
  },
  handoff_context_v1: {
    optional_fields: [
      "source_site_id",
      "source_page",
      "destination_site_id",
      "intent_id",
      "ship",
      "ship_slug",
      "sailing_date",
      "port",
      "port_date",
      "arrival_time",
      "departure_time",
      "party_size",
      "lat",
      "lng",
    ],
    rule:
      "Handoff context is advisory until the receiving utility validates it against its own canonical inventory or evidence.",
  },
};

export async function GET() {
  return Response.json(contract, {
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
