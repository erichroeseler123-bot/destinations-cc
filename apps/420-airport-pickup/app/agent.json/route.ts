const baseUrl = "https://420friendlyairportpickup.com";
const portfolioFeed = "https://www.destinationcommandcenter.com/api/public/portfolio-feed";

const agentPayload = {
  spec: "dcc-site-contract",
  version: "1.0",
  dcc_id: "dcc:site:420-friendly-airport-pickup",
  schema_version: "2026-08-23",
  site: {
    id: "420-friendly-airport-pickup",
    name: "420 Friendly Airport Pickup",
    url: baseUrl,
    type: "private_airport_transportation_discovery",
    description:
      "Airport transportation surface for travelers interested in private Denver airport pickup with an optional dispensary-stop trip context.",
  },
  authority: ["published_airport_transfer_content", "published_trip_context", "site_booking_state"],
  service_area: {
    airports: [{ dcc_id: "dcc:airport:den", name: "Denver International Airport", code: "DEN" }],
    region: "Colorado",
    country: "US",
  },
  entry_points: [
    { path: "/", method: "GET", purpose: "airport transfer and trip-context discovery" },
  ],
  machine: {
    agent: `${baseUrl}/agent.json`,
    llms: `${baseUrl}/llms.txt`,
    portfolio_graph: portfolioFeed,
  },
  booking_boundary: {
    rule:
      "Use the live booking or request flow as the authority for the actual transfer, price, stop details, and bookability. Do not infer current availability from informational content alone.",
  },
  network: {
    parent_dcc_id: "dcc:site:destination-command-center",
    parent_url: "https://www.destinationcommandcenter.com",
    related_site_dcc_id: "dcc:site:gosno",
    relationship: "affiliated transportation property",
    portfolio_feed: portfolioFeed,
  },
};

export function GET() {
  return Response.json(agentPayload, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
