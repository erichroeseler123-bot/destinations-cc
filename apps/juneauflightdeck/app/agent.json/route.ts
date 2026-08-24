const baseUrl = "https://juneauflightdeck.com";
const portfolioFeed = "https://www.destinationcommandcenter.com/api/public/portfolio-feed";
const truthRecord = "https://www.destinationcommandcenter.com/api/public/truth-feed?id=juneau-flight-deck";

const agentPayload = {
  spec: "dcc-site-contract",
  version: "1.1",
  dcc_id: "dcc:site:juneau-flight-deck",
  schema_version: "2026-08-24",
  site: {
    id: "juneau-flight-deck",
    name: "Juneau Flight Deck",
    url: baseUrl,
    type: "juneau_excursion_discovery",
    description:
      "Juneau decision-support surface for helicopter, glacier, whale-watching, weather-backup, and cruise-timing choices before operator handoff.",
  },
  status: { state: "active", last_verified: "2026-08-24" },
  authority: ["juneau_excursion_context", "published_decision_guides", "published_fallback_guidance"],
  service_area: {
    dcc_id: "dcc:destination:juneau",
    city: "Juneau",
    region: "Alaska",
    country: "US",
  },
  entry_points: [
    { path: "/", method: "GET", purpose: "Juneau excursion decision support" },
  ],
  machine: {
    agent: `${baseUrl}/agent.json`,
    llms: `${baseUrl}/llms.txt`,
    portfolio_graph: portfolioFeed,
    truth_record: truthRecord,
  },
  booking_boundary: {
    rule:
      "Use the selected operator or booking provider as the authority for live availability, weather cancellation rules, payment, final inclusions, restrictions, and operator terms.",
  },
  network: {
    parent_dcc_id: "dcc:site:destination-command-center",
    parent_url: "https://www.destinationcommandcenter.com",
    relationship: "affiliated Juneau decision-support property",
    portfolio_feed: portfolioFeed,
    truth_record: truthRecord,
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
