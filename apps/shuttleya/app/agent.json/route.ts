const baseUrl = "https://shuttleya.com";
const portfolioFeed = "https://www.destinationcommandcenter.com/api/public/portfolio-feed";

const payload = {
  spec: "dcc-site-contract",
  version: "1.0",
  dcc_id: "dcc:site:shuttleya",
  schema_version: "2026-08-23",
  site: {
    id: "shuttleya",
    name: "ShuttleYa",
    url: baseUrl,
    type: "transportation_discovery",
    description:
      "Transportation discovery and decision-support property for travelers comparing practical ground-transport options.",
  },
  authority: ["published_transportation_content", "published_decision_guides"],
  entry_points: [
    { path: "/", method: "GET", purpose: "transportation discovery and decision support" },
  ],
  machine: {
    agent: `${baseUrl}/agent.json`,
    llms: `${baseUrl}/llms.txt`,
    portfolio_graph: portfolioFeed,
  },
  booking_boundary: {
    rule:
      "Use the transportation operator or booking provider as the authority for live availability, price, pickup details, payment, and operator terms unless ShuttleYa explicitly states that it is the operator for a specific service.",
  },
  network: {
    parent_dcc_id: "dcc:site:destination-command-center",
    parent_url: "https://www.destinationcommandcenter.com",
    relationship: "affiliated transportation discovery property",
    portfolio_feed: portfolioFeed,
  },
};

export function GET() {
  return Response.json(payload, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
