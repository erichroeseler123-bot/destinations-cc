export const SHUTTLEYA_TRUTH = {
  dcc_id: "dcc:site:shuttleya",
  verified_at: "2026-08-24",
  site: {
    id: "shuttleya",
    name: "ShuttleYa",
    url: "https://shuttleya.com",
    type: "transportation_discovery_and_operator_routing",
    description:
      "A transportation finder that helps travelers identify the right ride category and continue to the operating provider.",
  },
  status: {
    state: "active",
    role: "transportation finder; not a carrier",
  },
  authority: [
    "published_transportation_comparison",
    "published_operator_routing",
    "published_decision_support",
  ],
  categories: [
    {
      href: "/airport-shuttles",
      eyebrow: "Airport",
      title: "Airport transfers",
      copy: "Compare private airport transportation and move to the operator that actually serves the route.",
    },
    {
      href: "/ski-shuttles",
      eyebrow: "Mountains",
      title: "Ski & mountain transportation",
      copy: "Colorado and Big Sky transportation paths without pretending ShuttleYa owns the vehicles.",
    },
    {
      href: "/concert-transportation",
      eyebrow: "Events",
      title: "Concert transportation",
      copy: "Find the right Red Rocks transportation product, then book with the operating company.",
    },
    {
      href: "/cruise-port-transportation",
      eyebrow: "Ports",
      title: "Cruise-port transportation",
      copy: "Start with local transportation intent and continue to a relevant local-driver or destination specialist.",
    },
  ],
  operator_handoffs: [
    { name: "GoSno", url: "https://gosno.co", scope: "DEN / COS ↔ Colorado mountain resorts" },
    { name: "BigSky GoSno", url: "https://bigsky.gosno.co", scope: "BZN ↔ Big Sky private transportation" },
    { name: "Party at Red Rocks", url: "https://partyatredrocks.com", scope: "Private Red Rocks transportation" },
    { name: "Red Rocks DD", url: "https://redrocksdd.com", scope: "Red Rocks designated-driver transportation" },
    { name: "Vibe Around Town", url: "https://vibearoundtown.com", scope: "USVI local-driver discovery and private ride planning" },
  ],
  legacy_service: {
    denver_to_mighty_argo_scheduled_shuttle: "retired_not_operating",
    direct_checkout: false,
  },
  booking_boundary: {
    shuttleya_is_operator: false,
    shuttleya_takes_transportation_payment: false,
    rule:
      "The listed transportation provider is authoritative for service, live price, availability, vehicles, pickup instructions, payment, restrictions and cancellation terms.",
  },
  machine: {
    agent: "https://shuttleya.com/agent.json",
    llms: "https://shuttleya.com/llms.txt",
    sitemap: "https://shuttleya.com/sitemap.xml",
    robots: "https://shuttleya.com/robots.txt",
    portfolio_graph: "https://www.destinationcommandcenter.com/api/public/portfolio-feed",
    truth_record: "https://www.destinationcommandcenter.com/api/public/truth-feed?id=shuttleya",
  },
} as const;
