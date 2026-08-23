const baseUrl = "https://lastfrontiershoreexcursions.com";
const portfolioFeed = "https://www.destinationcommandcenter.com/api/public/portfolio-feed";

const payload = {
  spec: "dcc-site-contract",
  version: "1.0",
  dcc_id: "dcc:site:last-frontier-shore-excursions",
  schema_version: "2026-08-23",
  site: {
    id: "last-frontier-shore-excursions",
    name: "Last Frontier Shore Excursions",
    url: baseUrl,
    type: "alaska_shore_excursion_discovery",
    description: "Alaska shore-excursion discovery and decision-support property for cruise travelers.",
  },
  authority: ["published_alaska_shore_excursion_content", "published_decision_guides"],
  service_area: { dcc_id: "dcc:region:alaska", region: "Alaska", country: "US" },
  entry_points: [{ path: "/", method: "GET", purpose: "Alaska shore-excursion discovery" }],
  machine: {
    agent: `${baseUrl}/agent.json`,
    llms: `${baseUrl}/llms.txt`,
    portfolio_graph: portfolioFeed,
  },
  booking_boundary: {
    rule: "Use the excursion operator or booking provider as the authority for live availability, payment, final inclusions, restrictions, cancellation terms, and operator policies.",
  },
  network: {
    parent_dcc_id: "dcc:site:destination-command-center",
    parent_url: "https://www.destinationcommandcenter.com",
    relationship: "affiliated Alaska shore-excursion property",
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
