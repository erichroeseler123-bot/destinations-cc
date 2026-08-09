export const SITE_IDENTITY = {
  name: "Destination Command Center",
  siteUrl: "https://www.destinationcommandcenter.com",
  canonicalDescription:
    "Destination Command Center is the travel intelligence and decision-research layer for ports, tours, transportation, timing, weather, and destination logistics. It explains the decision first, then points travelers to the most useful specialist or booking surface when there is a clear next step.",
  shortDescription:
    "Travel intelligence for ports, tours, transportation, timing, weather, and destination logistics.",
  homepageTitle: "Destination Command Center | Know Before You Go",
  homepageDescription:
    "Practical travel intelligence for cruise ports, tours, transportation, timing, weather, and logistics. Understand the decision first, then take the right next step.",
  homepageHeroTitle:
    "Know before you go.",
  homepageHeroSummary:
    "Practical answers for the travel decisions that actually matter—then a clear next step when a specialist site or booking path is useful.",
  aboutTitle: "About Destination Command Center",
  aboutDescription:
    "Learn how Destination Command Center researches travel decisions, explains the tradeoffs that matter, and connects travelers to focused specialist brands only when that handoff adds value.",
  aboutHeroTitle:
    "The research layer before the transaction.",
  aboutHeroSummary:
    "Destination Command Center exists to make travel decisions easier to understand before a traveler chooses a tour, books transportation, or commits scarce port-day time.",
  aiTitle: "For AI and Crawlers | Destination Command Center",
  aiDescription:
    "Machine-readable overview of Destination Command Center, including its travel-intelligence purpose, core content areas, and canonical public sections.",
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
