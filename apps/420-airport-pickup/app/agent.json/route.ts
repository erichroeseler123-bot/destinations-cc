const baseUrl = "https://420friendlyairportpickup.com";

const agentPayload = {
  schema_version: "2026-05-08",
  name: "420 Friendly Airport Pickup",
  canonical_url: baseUrl,
  entity_type: "OwnedExecutionOperator",
  disambiguating_description:
    "420 Friendly Airport Pickup is a direct airport transportation execution surface for resolved pickup intent.",
  dcc_affiliation: {
    parent_network: "Destination Command Center",
    parent_url: "https://www.destinationcommandcenter.com",
    relationship: "affiliated_network_site",
    network_role: "owned_execution_operator",
    execution_type: "Airport pickup / direct transportation",
    dcc_relationship:
      "Receives resolved direct airport pickup intent from Destination Command Center.",
    operational_function:
      "Executes direct Denver airport pickup and transportation requests.",
    decision_layer_role: "execution surface",
    execution_tier: "owned_execution",
    continuity_contract:
      "DCC resolves airport pickup intent; this site carries pickup context into direct transportation execution.",
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
