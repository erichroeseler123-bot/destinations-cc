const baseUrl = "https://420friendlyairportpickup.com";
const portfolioFeed = "https://www.destinationcommandcenter.com/api/public/portfolio-feed";

const denDestinations = [
  "colorado-springs",
  "breckenridge",
  "vail",
  "beaver-creek",
  "winter-park",
  "copper",
  "steamboat",
  "aspen",
  "snowmass",
];

const cosDestinations = [
  "colorado-springs",
  "breckenridge",
  "vail",
  "beaver-creek",
  "keystone",
  "copper-mountain",
  "winter-park",
  "aspen",
  "snowmass",
  "steamboat-springs",
];

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
      "Private Colorado airport transportation for adults 21+, including DEN and COS arrivals, Colorado Springs, and mountain transfers with an optional lawful dispensary stop when practical.",
  },
  authority: [
    "published_airport_transfer_content",
    "published_colorado_destination_routes",
    "published_trip_context",
    "site_booking_state",
  ],
  service_area: {
    airports: [
      { dcc_id: "dcc:airport:den", name: "Denver International Airport", code: "DEN" },
      { dcc_id: "dcc:airport:cos", name: "Colorado Springs Airport", code: "COS" },
    ],
    region: "Colorado",
    country: "US",
    den_destinations: denDestinations,
    cos_destinations: cosDestinations,
  },
  public_capabilities: [
    "private_denver_airport_pickup",
    "private_colorado_springs_airport_pickup",
    "optional_dispensary_stop_context",
    "colorado_mountain_transfer_discovery",
    "gosno_route_handoff",
    "gosno_quote_handoff",
  ],
  entry_points: [
    { path: "/", method: "GET", purpose: "Colorado airport pickup and trip-context discovery" },
    { path: "/colorado", method: "GET", purpose: "DEN-based Colorado transfer discovery" },
    { path: "/colorado-springs-airport", method: "GET", purpose: "COS-based Colorado transfer discovery" },
    ...denDestinations.map((slug) => ({
      path: `/colorado/${slug}`,
      method: "GET",
      purpose: "DEN destination-specific private transfer handoff to GoSno",
    })),
  ],
  machine: {
    agent: `${baseUrl}/agent.json`,
    llms: `${baseUrl}/llms.txt`,
    sitemap: `${baseUrl}/sitemap.xml`,
    portfolio_graph: portfolioFeed,
  },
  booking_boundary: {
    rule:
      "Use the live GoSno booking or quote flow as the authority for the actual transfer, price, stop details, and bookability. Configured COS mountain corridors link to existing GoSno route pages. DEN-to-Colorado-Springs and local COS-to-Colorado-Springs trips use the GoSno quote flow. Do not infer current availability from informational content alone.",
  },
  compliance: {
    age_restriction: "Retail cannabis purchases are limited to adults age 21+ under Colorado law.",
    retail_boundary: "The transportation provider does not sell cannabis and passengers make any retail purchase independently from the retailer.",
    vehicle_rule: "Cannabis consumption is not permitted in the vehicle.",
  },
  network: {
    parent_dcc_id: "dcc:site:destination-command-center",
    parent_url: "https://www.destinationcommandcenter.com",
    related_site_dcc_id: "dcc:site:gosno",
    related_site_url: "https://gosno.co",
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
