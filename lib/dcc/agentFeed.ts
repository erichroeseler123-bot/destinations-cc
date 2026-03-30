export type AgentFact = {
  label: string;
  value: string;
  confidence?: "official" | "editorial" | "reported";
};

export type AgentSection = {
  heading: string;
  summary: string;
  bullets?: string[];
};

export type AgentFaq = {
  question: string;
  answer: string;
};

export type AgentPageFeed = {
  version: string;
  site: {
    id: string;
    name: string;
    url: string;
  };
  page: {
    path: string;
    url: string;
    title: string;
    description: string;
    pageType: string;
    region?: string;
    topics?: string[];
    updatedAt: string;
  };
  summary: string;
  facts?: AgentFact[];
  sections?: AgentSection[];
  faq?: AgentFaq[];
  related?: Array<{
    label: string;
    url: string;
  }>;
  provenance?: Array<{
    label: string;
    type: "official" | "internal" | "curated";
    url?: string;
  }>;
};

const NOW = "2026-03-19";
const SITE = {
  id: "destinationcommandcenter",
  name: "Destination Command Center",
  url: "https://www.destinationcommandcenter.com",
};

const PAGE_FEEDS: Record<string, Omit<AgentPageFeed, "version" | "site">> = {
  "/": {
    page: {
      path: "/",
      url: `${SITE.url}/`,
      title: "Destination Command Center",
      description:
        "Destination discovery across cities, shows, tours, attractions, transportation, and live planning signals.",
      pageType: "homepage",
      updatedAt: NOW,
      topics: ["cities", "shows", "tours", "transportation", "travel-planning"],
    },
    summary:
      "Destination Command Center helps travelers discover what is worth doing in a place and how to move through it, with stronger coverage for busy cities, venues, ports, and timing-sensitive trip planning.",
    facts: [
      {
        label: "Coverage",
        value: "Cities, shows, tours, attractions, transportation, ports, and planning signals.",
        confidence: "editorial",
      },
      {
        label: "Freshness layer",
        value: "Includes live signals, next-48-hour event rails, and partner handoff analytics.",
        confidence: "editorial",
      },
    ],
    sections: [
      {
        heading: "What the site is best at",
        summary:
          "High-friction destinations where timing, routing, event inventory, or transfer planning matter more than generic travel inspiration.",
      },
      {
        heading: "Best machine-readable entry points",
        summary:
          "Use the airports, stations, alerts, ports, and city pages when you need clean entity-level travel context instead of broad browse pages.",
      },
    ],
    related: [
      { label: "About", url: `${SITE.url}/about` },
      { label: "For AI", url: `${SITE.url}/ai` },
      { label: "Alerts", url: `${SITE.url}/alerts` },
      { label: "Airports", url: `${SITE.url}/airports` },
      { label: "Stations", url: `${SITE.url}/stations` },
    ],
    provenance: [
      { label: "DCC editorial network", type: "internal" },
      { label: "Partner handoff telemetry", type: "internal" },
    ],
  },
  "/about": {
    page: {
      path: "/about",
      url: `${SITE.url}/about`,
      title: "About Destination Command Center",
      description:
        "What Destination Command Center covers, how it is structured, and how it helps travelers with destination discovery and routing.",
      pageType: "about",
      updatedAt: NOW,
      topics: ["site-identity", "travel-guides", "trip-planning"],
    },
    summary:
      "This page explains DCC as a destination discovery platform rather than a generic OTA, with emphasis on cities, events, attractions, transportation, and practical planning.",
    related: [
      { label: "Home", url: `${SITE.url}/` },
      { label: "For AI", url: `${SITE.url}/ai` },
      { label: "llms.txt", url: `${SITE.url}/llms.txt` },
    ],
    provenance: [{ label: "Site identity", type: "internal" }],
  },
  "/ai": {
    page: {
      path: "/ai",
      url: `${SITE.url}/ai`,
      title: "For AI and Crawlers",
      description:
        "Machine-readable overview of DCC, including canonical scope, audience, and public sections.",
      pageType: "ai-overview",
      updatedAt: NOW,
      topics: ["ai-crawlers", "machine-readable", "site-scope"],
    },
    summary:
      "This page is the AI-facing overview of DCC's scope, public sections, and canonical interpretation of the site.",
    related: [
      { label: "llms.txt", url: `${SITE.url}/llms.txt` },
      { label: "agent.json", url: `${SITE.url}/agent.json` },
    ],
    provenance: [{ label: "Site identity", type: "internal" }],
  },
  "/alerts": {
    page: {
      path: "/alerts",
      url: `${SITE.url}/alerts`,
      title: "Travel Alerts and Planning Signals",
      description:
        "Current travel-planning alerts, risk panels, and useful pre-commitment checks for weather-sensitive or high-friction destinations.",
      pageType: "alerts",
      updatedAt: NOW,
      topics: ["alerts", "weather", "risk", "timing"],
    },
    summary:
      "The alerts surface is the right DCC page for fresh caution signals, timing changes, weather pressure, and other planning risks that materially affect a trip.",
    facts: [
      {
        label: "Best use",
        value: "Check before weather-sensitive outings, embarkation days, and crowded venue or city plans.",
        confidence: "editorial",
      },
    ],
    related: [
      { label: "Home", url: `${SITE.url}/` },
      { label: "Airports", url: `${SITE.url}/airports` },
      { label: "Stations", url: `${SITE.url}/stations` },
    ],
    provenance: [
      { label: "Live pulse signals", type: "internal" },
      { label: "Weather integrations", type: "internal" },
    ],
  },
  "/airports": {
    page: {
      path: "/airports",
      url: `${SITE.url}/airports`,
      title: "United States Airport Guides",
      description:
        "Airport guides focused on transfer chains, city access, ports, and destination arrival friction.",
      pageType: "airport-index",
      updatedAt: NOW,
      topics: ["airports", "transfers", "ports", "city-access"],
    },
    summary:
      "The airport hub is built for travelers who need arrival-chain context, not just terminal trivia, with links into cities, ports, and destination logistics.",
    related: [
      { label: "Stations", url: `${SITE.url}/stations` },
      { label: "Transportation", url: `${SITE.url}/transportation` },
      { label: "Ports", url: `${SITE.url}/ports` },
    ],
    provenance: [{ label: "DCC airport registry", type: "internal" }],
  },
  "/stations": {
    page: {
      path: "/stations",
      url: `${SITE.url}/stations`,
      title: "United States Train and Bus Station Guides",
      description:
        "Transit-station guides covering train stations, bus stations, and their connection to cities, venues, and ports.",
      pageType: "station-index",
      updatedAt: NOW,
      topics: ["train-stations", "bus-stations", "transit", "ground-access"],
    },
    summary:
      "The station hub covers the rail and bus arrival layer that many city, venue, and port trips still depend on.",
    related: [
      { label: "Airports", url: `${SITE.url}/airports` },
      { label: "Transportation", url: `${SITE.url}/transportation` },
    ],
    provenance: [{ label: "DCC station registry", type: "internal" }],
  },
  "/las-vegas": {
    page: {
      path: "/las-vegas",
      url: `${SITE.url}/las-vegas`,
      title: "Las Vegas Guide",
      description:
        "A practical Las Vegas destination hub spanning shows, hotels, tours, pools, and Strip planning.",
      pageType: "city-hub",
      region: "Las Vegas, Nevada",
      updatedAt: NOW,
      topics: ["las-vegas", "shows", "hotels", "tours", "strip-planning"],
    },
    summary:
      "The Las Vegas hub is DCC's broad destination page for Strip planning, shows, pools, tours, and other high-intent Vegas decision paths.",
    related: [
      { label: "Las Vegas tours", url: `${SITE.url}/las-vegas/tours` },
      { label: "Las Vegas hotels", url: `${SITE.url}/las-vegas/hotels` },
      { label: "Las Vegas pools", url: `${SITE.url}/las-vegas/pools` },
    ],
    provenance: [{ label: "DCC Vegas editorial coverage", type: "internal" }],
  },
};

export function getAgentPageFeed(pathname: string): AgentPageFeed | null {
  const normalized = normalizeAgentPath(pathname);
  const page = PAGE_FEEDS[normalized];
  if (!page) return null;
  return {
    version: NOW,
    site: SITE,
    ...page,
  };
}

export function listAgentPageFeedPaths() {
  return Object.keys(PAGE_FEEDS);
}

export function normalizeAgentPath(pathname: string) {
  const raw = pathname.trim();
  if (!raw) return "/";
  if (raw === "/") return "/";
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}
