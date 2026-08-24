const baseUrl = "https://welcometoneworleanstours.com";
const portfolioFeed = "https://www.destinationcommandcenter.com/api/public/portfolio-feed";

const agentPayload = {
  spec: "dcc-site-contract",
  version: "1.0",
  dcc_id: "dcc:site:wno-tours",
  schema_version: "2026-08-23",
  site: {
    id: "wno-tours",
    name: "Welcome to New Orleans Tours",
    url: baseUrl,
    type: "tour_recommendation_service",
    description:
      "Independent New Orleans tour-planning and booking-assistance site with curated recommendations, decision guides, current local context, concierge help, and participating-operator booking handoff.",
  },
  authority: [
    "tour_recommendations",
    "tour_decision_guides",
    "participating_operator_handoffs",
    "published_site_content",
  ],
  service_area: {
    dcc_id: "dcc:destination:new-orleans",
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
  entry_points: [
    { path: "/", method: "GET", purpose: "tour discovery and planning" },
    { path: "/help-me-choose", method: "GET", purpose: "personalized tour recommendation flow" },
    { path: "/compare", method: "GET", purpose: "compare tour choices and tradeoffs" },
  ],
  machine: {
    agent: `${baseUrl}/agent.json`,
    portfolio_graph: portfolioFeed,
  },
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
  network: {
    parent_dcc_id: "dcc:site:destination-command-center",
    parent: "Destination Command Center",
    parent_url: "https://www.destinationcommandcenter.com",
    relationship: "affiliated planning site",
    category: "New Orleans tour planning and recommendation",
    portfolio_feed: portfolioFeed,
  },
};

export function GET() {
  return Response.json(agentPayload, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
