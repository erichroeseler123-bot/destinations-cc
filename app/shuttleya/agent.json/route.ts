const baseUrl = "https://shuttleya.com";
const portfolioFeed = "https://www.destinationcommandcenter.com/api/public/portfolio-feed";

const payload = {
  spec: "dcc-site-contract",
  version: "1.0",
  dcc_id: "dcc:site:shuttleya",
  schema_version: "2026-08-24",
  site: {
    id: "shuttleya",
    name: "ShuttleYa",
    url: baseUrl,
    type: "transportation_discovery_and_operator_routing",
    description: "A transportation finder that helps travelers identify the right ride category and continue to the operating provider.",
  },
  authority: ["published_transportation_comparison", "published_operator_routing", "published_decision_support"],
  service_categories: ["airport_transfers", "ski_and_mountain_transportation", "concert_transportation", "cruise_port_transportation"],
  entry_points: [
    { path: "/", method: "GET", purpose: "transportation finder" },
    { path: "/airport-shuttles", method: "GET", purpose: "airport transportation discovery" },
    { path: "/ski-shuttles", method: "GET", purpose: "ski and mountain transportation discovery" },
    { path: "/concert-transportation", method: "GET", purpose: "concert transportation discovery" },
    { path: "/cruise-port-transportation", method: "GET", purpose: "cruise-port transportation discovery" },
  ],
  operator_handoffs: [
    { name: "GoSno", url: "https://gosno.co", scope: "DEN/COS to Colorado mountain resorts" },
    { name: "BigSky GoSno", url: "https://bigsky.gosno.co", scope: "BZN to Big Sky private transportation" },
    { name: "Party at Red Rocks", url: "https://partyatredrocks.com", scope: "private Red Rocks transportation" },
    { name: "Red Rocks DD", url: "https://redrocksdd.com", scope: "Red Rocks designated-driver transportation" },
    { name: "Vibe Around Town", url: "https://vibearoundtown.com", scope: "USVI local-driver discovery and private ride planning" },
  ],
  legacy_service: {
    denver_to_mighty_argo_scheduled_shuttle: "retired_not_operating",
    direct_checkout: false,
  },
  machine: {
    agent: `${baseUrl}/agent.json`,
    llms: `${baseUrl}/llms.txt`,
    sitemap: `${baseUrl}/sitemap.xml`,
    robots: `${baseUrl}/robots.txt`,
    portfolio_graph: portfolioFeed,
  },
  booking_boundary: {
    shuttleya_is_operator: false,
    shuttleya_takes_transportation_payment: false,
    rule: "The listed transportation provider is authoritative for service, live price, availability, vehicles, pickup instructions, payment, restrictions and cancellation terms.",
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
