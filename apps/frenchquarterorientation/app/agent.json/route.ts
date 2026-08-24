import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    spec: "dcc-site-contract",
    version: "1.0",
    dcc_id: "dcc:site:french-quarter-orientation",
    schema_version: "2026-08-23",
    site: {
      id: "french-quarter-orientation",
      name: "French Quarter Orientation",
      url: "https://frenchquarterorientation.com",
      type: "new_orleans_orientation",
      description: "Practical 30-minute French Quarter orientation covering neighborhood layout, first-street choice, navigation, regroup points, walking strategy, and next-step handoffs.",
      areaServed: ["French Quarter, New Orleans, Louisiana", "New Orleans, Louisiana"]
    },
    authority: ["published_french_quarter_orientation_content", "published_navigation_guidance", "published_outbound_handoffs"],
    service_area: { dcc_id: "dcc:destination:new-orleans", city: "New Orleans", region: "Louisiana", country: "US" },
    canonicalPaths: ["/"],
    orientationModel: {
      duration_minutes: 30,
      rule: "Understand the neighborhood first, choose one anchor, preserve a clear regroup point, then hand off live commerce to the operating provider.",
      anchors: ["Mississippi River", "Canal Street", "Rampart Street", "Esplanade Avenue", "Jackson Square"]
    },
    machine: {
      agent: "https://frenchquarterorientation.com/agent.json",
      llms: "https://frenchquarterorientation.com/llms.txt",
      sitemap: "https://frenchquarterorientation.com/sitemap.xml",
      robots: "https://frenchquarterorientation.com/robots.txt",
      portfolio_graph: "https://www.destinationcommandcenter.com/api/public/portfolio-feed"
    },
    booking_boundary: {
      rule: "Use the relevant tour, attraction, transportation, or booking provider as the authority for live availability, prices, payment, meeting details, restrictions, cancellation terms, and final inclusions."
    },
    network: {
      parent_dcc_id: "dcc:site:destination-command-center",
      parent_url: "https://www.destinationcommandcenter.com",
      relationship: "affiliated New Orleans orientation property",
      portfolio_feed: "https://www.destinationcommandcenter.com/api/public/portfolio-feed"
    }
  });
}
