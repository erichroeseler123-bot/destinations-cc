export const SITE_IDENTITY = {
  name: "Destination Command Center",
  siteUrl: "https://destinationcommandcenter.com",
  canonicalDescription:
    "Destination Command Center (DCC) is a travel reference and decision platform supported by live, source-attributed coordinate intelligence. It connects verified destination knowledge—geography, history, transport access, 6-factor entry rules, seasonality, and safety boundaries—with live NOAA, NWS, USGS, FAA, and Open-Meteo telemetry, developer APIs, venue widgets, and context-preserving specialist handoffs.",
  shortDescription:
    "Source-attributed travel reference and decision platform supported by live coordinate intelligence.",
  homepageTitle: "Destination Command Center | Travel Reference & Live Coordinate Intelligence",
  homepageDescription:
    "Understand destinations, prepare for trips, compare practical transport and excursion options, and inspect live, source-attributed coordinate conditions.",
  homepageHeroTitle:
    "Know the destination. Verify the conditions.",
  homepageHeroSummary:
    "Comprehensive travel reference and practical decision guides connected to live, source-attributed coordinate intelligence, developer APIs, and venue widgets.",
  aboutTitle: "About Destination Command Center | Travel Reference & Capability Truth Matrix",
  aboutDescription:
    "How Destination Command Center combines source-attributed destination reference guides with live coordinate telemetry, what works vs. what is linked, and how we prevent safety conflation.",
  aboutHeroTitle:
    "Verifiable travel reference, backed by live coordinate intelligence.",
  aboutHeroSummary:
    "Destination Command Center helps travelers, search engines, and AI assistants understand destinations, verify entry and transport rules, and inspect live environmental telemetry without conflating weather forecasts with venue or road operating status.",
  aiTitle: "For AI and Crawlers | Destination Command Center",
  aiDescription:
    "Machine-readable overview of Destination Command Center, including its travel reference architecture, coordinate intelligence API (dcc-location-v2), evidence attribution model, and capability boundaries.",
  coreCoverage: [
    "Cruise ports and shore-day timing",
    "Tours and attraction comparisons",
    "Transportation choices and handoffs",
    "Weather-sensitive activity planning",
    "Destination logistics and failure modes",
    "Trip-planning decisions and practical next steps",
  ],
  audience: [
    "Travelers who need to understand a decision before they book",
    "Cruise passengers working within finite port-day windows",
    "Visitors comparing tours, transportation, timing, weather exposure, or destination logistics",
  ],
  transportationFit:
    "Destination Command Center explains transportation tradeoffs and practical constraints. When a focused transportation brand is the useful next step, DCC can hand the traveler to that specialist without pretending DCC is the operator.",
  entityCategory: "Travel intelligence and decision research",
  alternateNames: [
    "DCC Travel Intelligence",
    "Destination Command Center Travel",
    "DCC Travel Research",
  ],
  entityDisambiguation:
    "Destination Command Center is a travel research and decision-intelligence publication, not an IT command center, military command, warehouse platform, generic online travel agency, or booking marketplace.",
  knowsAbout: [
    "travel logistics",
    "destination decision support",
    "cruise port logistics",
    "guided tour selection",
    "transportation tradeoffs",
    "traffic and parking failure modes",
    "weather-sensitive activity planning",
    "high-congestion destination planning",
    "operator and marketplace handoffs",
    "shore excursion timing",
    "port-day return margins",
    "backup planning",
  ],
  notDescriptions: [
    "not a generic online travel agency",
    "not a generic travel guide",
    "not a booking marketplace",
    "not a doorway-page network",
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
