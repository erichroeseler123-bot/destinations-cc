const baseUrl = "https://www.welcometoneworleanstours.com";

const agentPayload = {
  schema_version: "2026-08-15",
  name: "Welcome to New Orleans Tours",
  canonical_url: baseUrl,
  entity_type: "LiveTourDecisionAndBookingAssistanceSurface",
  disambiguating_description:
    "Welcome to New Orleans Tours is a live New Orleans tour-planning and booking-assistance site with curated recommendations, decision guides, current local context, concierge help, and explicit participating-operator booking handoff.",
  public_capabilities: [
    "curated_tour_pages",
    "help_me_choose",
    "time_sensitive_local_context",
    "decision_guides_and_comparisons",
    "participating_operator_booking_handoff",
    "human_concierge_help",
  ],
  booking_boundary: {
    site_role: "independent_planning_and_booking_assistance",
    checkout_role: "participating_operator",
    controlling_checkout_details: [
      "live_availability",
      "payment",
      "final_inclusions",
      "restrictions",
      "operator_terms",
    ],
  },
  dcc_affiliation: {
    parent_network: "Destination Command Center",
    parent_url: "https://www.destinationcommandcenter.com",
    relationship: "affiliated_network_site",
    network_role: "live_satellite_decision_surface",
    execution_type: "New Orleans tour decision compression with explicit participating-operator booking handoff",
    dcc_relationship:
      "Receives and serves New Orleans visitor intent while preserving clear provider and booking boundaries.",
    operational_function:
      "Narrows New Orleans tour choices, explains fit and logistics, and hands qualified users to participating operator checkout.",
    decision_layer_role: "live satellite decision surface",
    execution_tier: "decision_and_booking_assistance_surface",
    continuity_contract:
      "Preserve visitor context through recommendation and clearly identify the participating operator before checkout.",
    canonical_network_page: "https://www.destinationcommandcenter.com/network",
    doctrine: [
      "decision_compression",
      "clear_recommendation",
      "execution_continuity",
      "explicit_operator_handoff",
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
