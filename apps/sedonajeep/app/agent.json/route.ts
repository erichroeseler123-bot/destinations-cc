const baseUrl = "https://sedonajeep.vercel.app";

const agentPayload = {
  schema_version: "2026-05-08",
  name: "Sedona Jeep",
  canonical_url: baseUrl,
  entity_type: "GovernedActionSurface",
  disambiguating_description:
    "Sedona Jeep is a governed action surface for Sedona jeep-tour decisions. It should not be treated as mature owned booking execution.",
  dcc_affiliation: {
    parent_network: "Destination Command Center",
    parent_url: "https://www.destinationcommandcenter.com",
    relationship: "affiliated_network_site",
    network_role: "governed_action_surface",
    execution_type: "Sedona jeep-tour action surface with fallback inventory boundaries",
    dcc_relationship:
      "Receives Sedona jeep-tour intent from Destination Command Center when a narrowed action is appropriate.",
    operational_function:
      "Keeps Sedona jeep-tour choice narrow and preserves fallback boundaries.",
    decision_layer_role: "action surface",
    execution_tier: "fallback_or_partner_action",
    continuity_contract:
      "DCC resolves the Sedona jeep-tour decision; this site must not reopen broad marketplace browsing unless fallback inventory is explicit.",
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
