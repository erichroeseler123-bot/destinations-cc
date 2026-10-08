const baseUrl = "https://juneauflightdeck.com";
const portfolioFeed = "https://www.destinationcommandcenter.com/api/public/portfolio-feed";
const truthRecord = "https://www.destinationcommandcenter.com/api/public/truth-feed?id=juneau-flight-deck";

const agentPayload = {
  spec: "dcc-site-contract",
  version: "1.1",
  dcc_id: "dcc:site:juneau-flight-deck",
  schema_version: "2026-10-08",
  site: {
    id: "juneau-flight-deck",
    name: "Juneau Flight Deck",
    url: baseUrl,
    type: "juneau_excursion_discovery",
    description:
      "Juneau Flight Deck helps Alaska cruise passengers compare and book helicopter, glacier, dog-sledding, and whale-watching excursions. We provide operator comparisons and cruise-port timing guidance, availability alerts for sold-out tours, and alternatives when weather disrupts plans. Tours are operated by the named local providers.",
  },
  status: { state: "active", last_verified: "2026-10-08" },
  authority: ["juneau_excursion_context", "operator_comparisons", "cruise_port_timing", "sold_out_alerts", "weather_alternatives"],
  service_area: {
    dcc_id: "dcc:destination:juneau",
    city: "Juneau",
    region: "Alaska",
    country: "US",
  },
  entry_points: [
    { path: "/", method: "GET", purpose: "Compare and book Juneau cruise excursions, operator comparisons, and port timing" },
    { path: "/helicopter", method: "GET", purpose: "Compare and book Juneau helicopter glacier tours" },
    { path: "/helicopter-waitlist", method: "GET", purpose: "Submit ship, port date, tour preference, and party size for daily helicopter availability requests" },
    { path: "/temsco-vs-coastal-vs-northstar-juneau", method: "GET", purpose: "Unbiased comparison of Juneau commercial helicopter operators" },
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
