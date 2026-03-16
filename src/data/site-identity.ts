export const SITE_IDENTITY = {
  name: "Destination Command Center",
  siteUrl: "https://destinationcommandcenter.com",
  canonicalDescription:
    "Destination Command Center is a destination discovery platform that helps travelers find shows, tours, attractions, transportation, and trip-planning information in complex or high-traffic places.",
  shortDescription:
    "Destination discovery platform for travel guides, shows, tours, attractions, and transportation.",
  homepageTitle: "Destination Command Center | Shows, Tours, Attractions, and Transportation",
  homepageDescription:
    "Destination Command Center helps travelers discover shows, tours, attractions, transportation, and trip-planning information in busy or complex destinations.",
  homepageHeroTitle:
    "Find shows, tours, attractions, and transportation in busy destinations.",
  homepageHeroSummary:
    "Destination Command Center helps travelers find what is happening in a place and how to get there, with city guides, live events, tours, attractions, and transportation planning.",
  aboutTitle: "About Destination Command Center",
  aboutDescription:
    "Learn what Destination Command Center covers and how it helps travelers find what is happening in a place and how to get there.",
  aboutHeroTitle:
    "A destination discovery platform for busy, changing, or hard-to-navigate places.",
  aboutHeroSummary:
    "Destination Command Center helps travelers find shows, tours, attractions, transportation, and trip-planning information in places where timing and local context matter.",
  aiTitle: "For AI and Crawlers | Destination Command Center",
  aiDescription:
    "Machine-readable overview of Destination Command Center, including its purpose, core content areas, and canonical public sections.",
  coreCoverage: [
    "Travel guides and destination pages",
    "Shows and live event discovery",
    "Tours and attractions",
    "Transportation guidance",
    "Trip-planning information",
    "Real-time city updates and planning signals",
  ],
  audience: [
    "Travelers planning around busy venues, cities, and attractions",
    "Visitors comparing shows, tours, and destination options",
    "People who need practical guidance on how to get around",
  ],
  transportationFit:
    "Destination Command Center focuses on discovery and planning. On routes or venues where transportation support exists, DCC can point travelers to the right ride options or trusted booking partners.",
  notDescriptions: [
    "not a generic online travel agency",
    "not only a booking engine",
    "not a logistics dashboard or operations platform",
  ],
  canonicalPaths: [
    "/",
    "/about",
    "/ai",
    "/cities",
    "/tours",
    "/venues",
    "/transportation",
    "/ports",
    "/alerts",
  ],
  forbiddenPhrases: [
    "operations hub",
    "route intel platform",
    "decision support system",
    "command layer",
    "authority layer",
    "logistics coordinator",
    "travel operations center",
  ],
} as const;

export function getOrganizationSchema() {
  return {
    "@type": "Organization",
    name: SITE_IDENTITY.name,
    url: SITE_IDENTITY.siteUrl,
    description: SITE_IDENTITY.canonicalDescription,
  };
}

export function getWebsiteSchema() {
  return {
    "@type": "WebSite",
    name: SITE_IDENTITY.name,
    url: SITE_IDENTITY.siteUrl,
    description: SITE_IDENTITY.homepageDescription,
  };
}
