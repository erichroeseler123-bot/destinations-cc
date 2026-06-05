const baseUrl = "https://juneauflightdeck.com";

const agentPayload = {
  schema_version: "2026-05-08",
  name: "Juneau Flight Deck",
  canonical_url: baseUrl,
  entity_type: "SatelliteDecisionSurface",
  disambiguating_description:
    "Juneau Flight Deck narrows urgent Juneau helicopter, glacier, whale-watching, weather-backup, and cruise-timing decisions before execution handoff.",
  dcc_affiliation: {
    parent_network: "Destination Command Center",
    parent_url: "https://www.destinationcommandcenter.com",
    relationship: "affiliated_network_site",
    network_role: "satellite_decision_surface",
    execution_type: "Juneau decision compression before operator or fallback handoff",
    dcc_relationship:
      "Receives Juneau and Alaska excursion intent from Destination Command Center when users need same-day or cruise-safe narrowing.",
    operational_function:
      "Compresses Juneau helicopter, glacier, whale-watching, and weather-backup choices into the next correct action.",
    decision_layer_role: "satellite decision surface",
    execution_tier: "decision_surface",
    continuity_contract:
      "DCC resolves or frames the Juneau corridor; Juneau Flight Deck preserves decision context before operator or fallback execution.",
    canonical_network_page: "https://www.destinationcommandcenter.com/network",
    doctrine: [
      "decision_compression",
      "one_recommended_move",
      "execution_continuity",
      "marketplace_inventory_is_fallback",
    ],
  },
};

export function GET() {
  return Response.json(agentPayload, {
    headers: {
      "Cache-Control": "public, max-age=3600",
    },
  });
}
