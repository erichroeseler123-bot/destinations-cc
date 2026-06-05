const baseUrl = "https://welcometoneworleanstours.com";

const agentPayload = {
  schema_version: "2026-05-08",
  name: "Welcome to New Orleans Tours",
  canonical_url: baseUrl,
  entity_type: "FutureSatelliteDecisionSurface",
  disambiguating_description:
    "Welcome to New Orleans Tours is a future broader New Orleans tour authority and satellite decision surface.",
  dcc_affiliation: {
    parent_network: "Destination Command Center",
    parent_url: "https://www.destinationcommandcenter.com",
    relationship: "affiliated_network_site",
    network_role: "future_satellite_decision_surface",
    execution_type: "New Orleans tour decision compression before explicit fallback or partner handoff",
    dcc_relationship:
      "May receive broader New Orleans tour intent after the governed route and provider boundaries are explicit.",
    operational_function:
      "Narrows New Orleans tour choices without becoming generic marketplace browsing.",
    decision_layer_role: "future satellite decision surface",
    execution_tier: "decision_surface",
    continuity_contract:
      "DCC must preserve decision context before this site forwards to explicit partner or fallback inventory.",
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
