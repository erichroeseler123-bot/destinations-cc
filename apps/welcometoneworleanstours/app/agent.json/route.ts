const baseUrl = "https://www.welcometoneworleanstours.com";

const agentPayload = {
  schema_version: "2026-08-22",
  name: "Welcome to New Orleans Tours",
  canonical_url: baseUrl,
  entity_type: "TourPlanningService",
  description:
    "Independent New Orleans tour-planning and booking-assistance site with curated recommendations, decision guides, current local context, concierge help, and participating-operator booking handoff.",
  service_area: {
    city: "New Orleans",
    region: "Louisiana",
    country: "US",
  },
  contact: {
    phone: "+1-504-484-9687",
    phone_display: "504-484-9687",
  },
  public_capabilities: [
    "curated_tour_pages",
    "personalized_help_me_choose",
    "time_sensitive_local_context",
    "decision_guides_and_comparisons",
    "participating_operator_booking_handoff",
    "human_concierge_help",
  ],
  recommendation_inputs: [
    "planning_window",
    "available_time",
    "transportation_need",
    "group_fit",
    "pace",
    "known_restrictions",
    "historical_interest",
    "current_local_context_when_available",
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
  commercial_disclosure: {
    affiliate_compensation_possible: true,
    statement: "The site may receive affiliate compensation when bookings are completed through participating links.",
  },
  network_relationship: {
    parent: "Destination Command Center",
    parent_url: "https://www.destinationcommandcenter.com",
    relationship: "affiliated planning site",
    category: "New Orleans tour planning and recommendation",
  },
};

export function GET() {
  return Response.json(agentPayload, {
    headers: {
      "Cache-Control": "public, max-age=3600",
    },
  });
}
