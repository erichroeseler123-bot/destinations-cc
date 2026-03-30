import { getVegasHotelGuides } from "@/lib/hotels";

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
    updatedAt: string;
    region?: string;
    topics?: string[];
  };
  summary: string;
  facts?: Array<{
    label: string;
    value: string;
    confidence?: "official" | "editorial" | "reported";
  }>;
  sections?: Array<{
    heading: string;
    summary: string;
    bullets?: string[];
  }>;
  related?: Array<{
    label: string;
    url: string;
  }>;
};

const NOW = "2026-03-19";
const SITE = {
  id: "saveonthestrip",
  name: "Save On The Strip",
  url: "https://saveonthestrip.com",
};

const staticFeeds: Record<string, Omit<AgentPageFeed, "version" | "site">> = {
  "/": {
    page: {
      path: "/",
      url: `${SITE.url}/`,
      title: "Save On The Strip",
      description:
        "A Vegas-first planning site for shows, tours, deals, free things, hotels, and practical value moves.",
      pageType: "homepage",
      updatedAt: NOW,
      region: "Las Vegas, Nevada",
      topics: ["las-vegas", "shows", "tours", "deals", "free-things", "hotels"],
    },
    summary:
      "Save On The Strip is a forward-facing Vegas planning site that helps travelers compare shows, tours, hotel changes, deal sources, and practical Strip decisions without starting from generic listing walls.",
    related: [
      { label: "Shows", url: `${SITE.url}/shows` },
      { label: "Tours", url: `${SITE.url}/tours` },
      { label: "Deals", url: `${SITE.url}/deals` },
      { label: "Hotels", url: `${SITE.url}/hotels` },
      { label: "Free things", url: `${SITE.url}/free-things` },
    ],
  },
  "/deals": {
    page: {
      path: "/deals",
      url: `${SITE.url}/deals`,
      title: "Vegas Deals",
      description:
        "A curated guide to Vegas show-deal sites, official resort offer pages, travel bundles, and insider savings tools.",
      pageType: "deals-hub",
      updatedAt: NOW,
      region: "Las Vegas, Nevada",
      topics: ["vegas-deals", "show-discounts", "hotel-offers", "travel-bundles"],
    },
    summary:
      "The deals page is the main savings hub, combining major deal aggregators, resort offer pages, cheap-eat/value tools, and help-request capture for travelers who want human help finding a better Vegas value move.",
    facts: [
      {
        label: "Main use",
        value: "Compare show, hotel, dining, and bundle deal sources before paying full price out of convenience.",
        confidence: "editorial",
      },
    ],
    related: [
      { label: "Free things", url: `${SITE.url}/free-things` },
      { label: "Hotels", url: `${SITE.url}/hotels` },
      { label: "Shows", url: `${SITE.url}/shows` },
    ],
  },
  "/free-things": {
    page: {
      path: "/free-things",
      url: `${SITE.url}/free-things`,
      title: "Free Things To Do in Las Vegas",
      description:
        "A practical guide to free Vegas attractions worth time, including Bellagio, Fremont Street, wildlife habitats, and desert art.",
      pageType: "free-things-guide",
      updatedAt: NOW,
      region: "Las Vegas, Nevada",
      topics: ["free-things", "bellagio", "fremont-street", "vegas-budget"],
    },
    summary:
      "The free-things page focuses on no-cost Vegas attractions that still feel like real trip pieces rather than filler, including Bellagio, Fremont, wildlife habitats, and art stops.",
    related: [
      { label: "Deals", url: `${SITE.url}/deals` },
      { label: "Shows", url: `${SITE.url}/shows` },
      { label: "Tours", url: `${SITE.url}/tours` },
    ],
  },
  "/shows": {
    page: {
      path: "/shows",
      url: `${SITE.url}/shows`,
      title: "Vegas Shows",
      description:
        "A forward-facing Vegas shows page with featured picks, Sphere coverage, value comedy angles, and live ticket feeds.",
      pageType: "shows-hub",
      updatedAt: NOW,
      region: "Las Vegas, Nevada",
      topics: ["vegas-shows", "sphere", "comedy", "tickets"],
    },
    summary:
      "The shows page leads with featured editorial picks like Sphere and value-oriented comedy lanes, then supports those with live Ticketmaster and SeatGeek inventory.",
    related: [
      { label: "Sphere shows", url: `${SITE.url}/shows/sphere` },
      { label: "Deals", url: `${SITE.url}/deals` },
    ],
  },
  "/shows/sphere": {
    page: {
      path: "/shows/sphere",
      url: `${SITE.url}/shows/sphere`,
      title: "Sphere Shows in Las Vegas",
      description:
        "A dedicated Sphere guide with featured Wizard of Oz coverage and a current schedule lane.",
      pageType: "venue-show-guide",
      updatedAt: NOW,
      region: "Las Vegas, Nevada",
      topics: ["sphere", "wizard-of-oz", "vegas-shows"],
    },
    summary:
      "The Sphere page is the focused show-decision page for premium Vegas nights, with Wizard of Oz featured when available and current Sphere schedule coverage underneath.",
    related: [
      { label: "All shows", url: `${SITE.url}/shows` },
      { label: "Deals", url: `${SITE.url}/deals` },
    ],
  },
  "/tours": {
    page: {
      path: "/tours",
      url: `${SITE.url}/tours`,
      title: "Vegas Tours",
      description:
        "Las Vegas tours and day trips, including Grand Canyon, Hoover Dam, Red Rock Canyon, and other nearby outings.",
      pageType: "tours-hub",
      updatedAt: NOW,
      region: "Las Vegas, Nevada",
      topics: ["vegas-tours", "grand-canyon", "hoover-dam", "red-rock"],
    },
    summary:
      "The tours page groups FareHarbor-backed day trips by area, with special emphasis on the Grand Canyon, Hoover Dam, Red Rock, and other easy Vegas add-on outings.",
    related: [
      { label: "Deals", url: `${SITE.url}/deals` },
      { label: "Free things", url: `${SITE.url}/free-things` },
    ],
  },
  "/hotels": {
    page: {
      path: "/hotels",
      url: `${SITE.url}/hotels`,
      title: "Vegas Hotel Guides",
      description:
        "Practical Las Vegas hotel guides covering renovations, reopenings, and whether a property is currently useful for a trip.",
      pageType: "hotel-guides-index",
      updatedAt: NOW,
      region: "Las Vegas, Nevada",
      topics: ["vegas-hotels", "renovations", "reopenings", "value-stays"],
    },
    summary:
      "The hotel index is for travelers who need the fast answer on hotel change stories, not generic brochure copy.",
    related: [
      { label: "Rio guide", url: `${SITE.url}/hotels/rio-las-vegas-renovation-update` },
      { label: "Hard Rock update", url: `${SITE.url}/hotels/hard-rock-las-vegas-construction-update` },
    ],
  },
  "/timeshares": {
    page: {
      path: "/timeshares",
      url: `${SITE.url}/timeshares`,
      title: "Vegas Timeshares",
      description:
        "A Las Vegas timeshare location guide with optional help for presentation-driven offers and resort comparisons.",
      pageType: "timeshare-guide",
      updatedAt: NOW,
      region: "Las Vegas, Nevada",
      topics: ["timeshares", "las-vegas-resorts", "optional-offers"],
    },
    summary:
      "The timeshare page is a no-pressure Vegas resort-comparison page for travelers who want to understand location and property fit before deciding whether a presentation offer is worth it.",
  },
};

export function normalizeAgentPath(pathname: string) {
  const raw = pathname.trim();
  if (!raw) return "/";
  if (raw === "/") return "/";
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

export function getSaveOnTheStripAgentFeed(pathname: string): AgentPageFeed | null {
  const normalized = normalizeAgentPath(pathname);
  if (staticFeeds[normalized]) {
    return {
      version: NOW,
      site: SITE,
      ...staticFeeds[normalized],
    };
  }

  if (normalized.startsWith("/hotels/")) {
    const slug = normalized.replace("/hotels/", "");
    const guide = getVegasHotelGuides().find((entry) => entry.slug === slug);
    if (!guide) return null;
    return {
      version: NOW,
      site: SITE,
      page: {
        path: normalized,
        url: `${SITE.url}${normalized}`,
        title: guide.title,
        description: guide.description,
        pageType: "hotel-guide",
        updatedAt: NOW,
        region: "Las Vegas, Nevada",
        topics: ["vegas-hotels", "hotel-update", slug.includes("rio") ? "rio" : "hard-rock"],
      },
      summary: guide.heroSummary,
      facts: guide.quickFacts.map((fact) => ({
        label: fact.label,
        value: fact.value,
        confidence: fact.label === "Opening target" ? "official" : "editorial",
      })),
      sections: guide.sections.map((section) => ({
        heading: section.title,
        summary: section.paragraphs[0] || "",
        bullets: section.bullets,
      })),
      related: [
        { label: "Vegas hotels", url: `${SITE.url}/hotels` },
        { label: "Vegas deals", url: `${SITE.url}/deals` },
        { label: "Free things", url: `${SITE.url}/free-things` },
      ],
    };
  }

  return null;
}

export function listSaveOnTheStripAgentPaths() {
  return [...Object.keys(staticFeeds), ...getVegasHotelGuides().map((guide) => `/hotels/${guide.slug}`)];
}
