export const dynamic = "force-dynamic";

const baseUrl = "https://www.shuttletosomersetamphitheater.com";
const portfolioFeed = "https://www.destinationcommandcenter.com/api/public/portfolio-feed";
const truthRecord = "https://www.destinationcommandcenter.com/api/public/truth-feed?id=somerset-amphitheater-shuttle";

export const SOMERSET_AGENT_PAYLOAD = {
  spec: "dcc-site-contract",
  version: "1.1",
  dcc_id: "dcc:site:somerset-amphitheater-shuttle",
  schema_version: "2026-08-24",
  site: {
    id: "somerset-amphitheater-shuttle",
    name: "Somerset Amphitheater Shuttle",
    url: baseUrl,
    type: "private_concert_transportation",
    description:
      "Private prearranged group shuttle and concert transportation between the Minneapolis-St. Paul Twin Cities metro and Somerset Amphitheater in Somerset, Wisconsin. High-roof passenger vans and luxury SUVs with guaranteed late-night return rides.",
  },
  status: { state: "active", last_verified: "2026-09-12" },
  authority: [
    "somerset_concert_transportation",
    "published_vehicle_pricing",
    "door_to_door_twin_cities_coverage",
    "venue_parking_and_logistics_guidance",
  ],
  service_area: {
    venue: {
      dcc_id: "dcc:venue:somerset-amphitheater",
      name: "Somerset Amphitheater",
      city: "Somerset",
      state: "WI",
      country: "US",
    },
    pickup_regions: [
      "Minneapolis",
      "St. Paul",
      "Stillwater",
      "Hudson, WI",
      "Woodbury",
      "Twin Cities East Metro",
      "Greater Twin Cities Metro",
    ],
    corridor: "Twin Cities Metro <-> Somerset Amphitheater (I-94 / WI-35 / WI-64)",
  },
  fleet_and_pricing: {
    quote_model: "flat_round_trip",
    surge_pricing: false,
    on_site_driver_staging: true,
    vehicles: [
      {
        type: "private_high_roof_van",
        name: "Private High-Roof Passenger Van",
        capacity: 14,
        pricing: "~$500 flat round-trip",
        features: [
          "Stand-up ceiling",
          "Air conditioning",
          "Cooler and tailgate gear storage",
          "On-site driver wait through encore",
        ],
      },
      {
        type: "private_luxury_suv",
        name: "Private Luxury SUV",
        capacity: 6,
        pricing: "$375-$425 flat round-trip",
        features: [
          "Leather interior",
          "Tri-zone climate control",
          "Private group ride",
          "Guaranteed post-concert departure",
        ],
      },
    ],
  },
  contact: {
    phone: "(720) 369-6292",
    text: "(720) 369-6292",
    direct_inquiries: "tel:+17203696292",
  },
  entry_points: [
    {
      path: "/",
      method: "GET",
      purpose: "Primary concert transportation landing page and quote inquiry",
    },
    {
      path: "/somerset-amphitheater-shuttle",
      method: "GET",
      purpose: "Core shuttle guide, pickup locations, transit times, and service policies",
    },
    {
      path: "/somerset-concert-transportation",
      method: "GET",
      purpose: "Festival and concert logistics, tailgate storage, and event travel timing",
    },
    {
      path: "/somerset-amphitheater-parking-and-transportation",
      method: "GET",
      purpose: "Comparison of venue parking gridlock, rural rideshare shortages, and private charters",
    },
    {
      path: "/api/somerset/quote",
      method: "POST",
      purpose: "Submit flat-rate private charter quote inquiry",
    },
    {
      path: "/api/somerset/quote",
      method: "GET",
      purpose: "Retrieve submitted quote by ID (?id=<quoteId>)",
    },
  ],
  machine: {
    agent: `${baseUrl}/agent.json`,
    llms: `${baseUrl}/llms.txt`,
    sitemap: `${baseUrl}/sitemap.xml`,
    quote_api: `${baseUrl}/api/somerset/quote`,
    portfolio_graph: portfolioFeed,
    truth_record: truthRecord,
  },
  booking_boundary: {
    rule:
      "Transportation is prearranged private group charter only. All rides must be reserved in advance through quote confirmation. Not a public per-seat bus or scheduled fixed-route shuttle. River tubing shuttles on the Apple River are operated exclusively on-site by campgrounds and outfitters (e.g., River's Edge, Float Rite Park) and are not sold or operated by this service.",
  },
  network: {
    parent_dcc_id: "dcc:site:destination-command-center",
    parent_url: "https://www.destinationcommandcenter.com",
    relationship: "affiliated transportation property",
    portfolio_feed: portfolioFeed,
    truth_record: truthRecord,
  },
};

export function GET() {
  return Response.json(SOMERSET_AGENT_PAYLOAD, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
