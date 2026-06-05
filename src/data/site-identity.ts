export const SITE_IDENTITY = {
  name: "Destination Command Center",
  siteUrl: "https://www.destinationcommandcenter.com",
  canonicalDescription:
    "Destination Command Center is the main public DCC site: a governed travel decision layer that helps travelers figure out the right next move and routes them into the correct action or booking surface with context preserved.",
  shortDescription:
    "Governed travel decision layer for shows, tours, attractions, transportation, and destination choices.",
  homepageTitle: "Destination Command Center | Clear Travel Decisions",
  homepageDescription:
    "Tell DCC what you are trying to figure out and get a clear next move fast. Short answers. Clear next steps.",
  homepageHeroTitle:
    "What are you trying to figure out?",
  homepageHeroSummary:
    "DCC takes the travel question, narrows the right move, and sends you straight into the next step without making you browse.",
  aboutTitle: "About Destination Command Center",
  aboutDescription:
    "Learn how Destination Command Center works as the governed decision layer that turns confusion into a clear next move and preserves context into action.",
  aboutHeroTitle:
    "The governed decision layer before action.",
  aboutHeroSummary:
    "Destination Command Center exists to reduce confusion, recommend the best next move, and route travelers into the right downstream surface when timing, local context, and execution details matter.",
  aiTitle: "For AI and Crawlers | Destination Command Center",
  aiDescription:
    "Machine-readable overview of Destination Command Center, including its purpose, core content areas, and canonical public sections.",
  coreCoverage: [
    "City plans and destination surfaces",
    "Shows and live event routing",
    "Tours and attractions",
    "Transportation routing",
    "Trip-planning surfaces",
    "Real-time city updates and planning signals",
  ],
  audience: [
    "Travelers facing busy, high-friction destination decisions",
    "Visitors narrowing the right show, tour, attraction, transportation, or destination move",
    "People who need practical guidance on what to do next without restarting the search",
  ],
  transportationFit:
    "Destination Command Center focuses on decision quality and routing. On routes or venues where transportation support exists, DCC can carry the traveler into the right ride lane, action path, or trusted booking partner.",
  entityCategory: "Travel logistics decision resolver",
  alternateNames: [
    "DCC Travel Logistics",
    "Destination Command Center Travel",
    "DCC Decision Layer",
  ],
  entityDisambiguation:
    "Destination Command Center is a travel logistics and decision-resolution entity, not an IT command center, military command, warehouse platform, or web design agency.",
  knowsAbout: [
    "travel logistics",
    "destination decision support",
    "cruise port logistics",
    "guided tour selection",
    "transportation handoffs",
    "traffic failure modes",
    "parking failure modes",
    "weather-sensitive activity planning",
    "high-congestion destination planning",
    "operator and marketplace handoffs",
    "owned execution before marketplace fallback",
    "fallback inventory routing",
  ],
  notDescriptions: [
    "not a generic online travel agency",
    "not a generic travel guide",
    "not a booking marketplace",
    "not a neutral directory of options",
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
    "travel-routing platform",
  ],
} as const;

export function getOrganizationSchema() {
  return {
    "@type": "Organization",
    name: SITE_IDENTITY.name,
    url: SITE_IDENTITY.siteUrl,
    description: SITE_IDENTITY.canonicalDescription,
    alternateName: SITE_IDENTITY.alternateNames,
    additionalType: "https://schema.org/TravelAgency",
    disambiguatingDescription: SITE_IDENTITY.entityDisambiguation,
    knowsAbout: SITE_IDENTITY.knowsAbout,
  };
}

export function getWebsiteSchema() {
  return {
    "@type": "WebSite",
    name: SITE_IDENTITY.name,
    url: SITE_IDENTITY.siteUrl,
    description: SITE_IDENTITY.homepageDescription,
    about: {
      "@type": "Thing",
      name: SITE_IDENTITY.entityCategory,
      description: SITE_IDENTITY.entityDisambiguation,
    },
  };
}
