export type CruiseLineLink = {
  label: string;
  href: string;
};

export type CruiseLineConfig = {
  slug: string;
  name: string;
  updatedAt: string;
  summary: string;
  bestFor: string[];
  fleetStyle: string[];
  shipSlugs: string[];
  featuredPortSlugs: string[];
  relatedLinks: CruiseLineLink[];
};

export const CRUISE_LINES_CONFIG: Record<string, CruiseLineConfig> = {
  "royal-caribbean-international": {
    slug: "royal-caribbean-international",
    name: "Royal Caribbean International",
    updatedAt: "2026-03-11",
    summary:
      "Mainstream big-ship line built around family demand, heavy onboard activity stacks, and Caribbean-first scale.",
    bestFor: ["Families", "Resort-at-sea buyers", "Entertainment-heavy Caribbean trips"],
    fleetStyle: [
      "Large-ship public spaces with broad all-ages activity density",
      "Strong private-island and Caribbean itinerary fit",
      "Good match for travelers who want the ship to be part of the vacation headline",
    ],
    shipSlugs: ["icon-of-the-seas"],
    featuredPortSlugs: ["miami-usa", "nassau-bahamas", "cozumel-mexico"],
    relatedLinks: [
      { label: "Cruise explorer", href: "/cruises" },
      { label: "Miami cruise port", href: "/cruises/port/miami-usa" },
    ],
  },
  "carnival-cruise-line": {
    slug: "carnival-cruise-line",
    name: "Carnival Cruise Line",
    updatedAt: "2026-03-11",
    summary:
      "Fun-forward mainstream line aimed at value-focused leisure demand, family trips, and simpler embarkation decisions.",
    bestFor: ["Families", "Group trips", "Value-led Caribbean buyers"],
    fleetStyle: [
      "Casual onboard tone with broad family and group appeal",
      "Strong drive-market embarkation fit for Gulf and Caribbean sailings",
      "Clear fit for buyers who want a simpler price-to-fun equation",
    ],
    shipSlugs: ["carnival-jubilee"],
    featuredPortSlugs: ["galveston-usa", "roatan-honduras", "cozumel-mexico"],
    relatedLinks: [
      { label: "Cruise explorer", href: "/cruises" },
      { label: "Galveston cruise port", href: "/cruises/port/galveston-usa" },
    ],
  },
  "viking-expeditions": {
    slug: "viking-expeditions",
    name: "Viking Expeditions",
    updatedAt: "2026-03-11",
    summary:
      "Lower-capacity expedition product focused on destination depth, guided learning, and premium remote-leaning itineraries.",
    bestFor: ["Expedition travelers", "Nature-led itineraries", "Premium lower-capacity buyers"],
    fleetStyle: [
      "Destination-first proposition rather than resort-at-sea entertainment",
      "Science, learning, and guided exploration baked into the product identity",
      "Best fit for travelers comparing expedition value rather than mainstream ship spectacle",
    ],
    shipSlugs: ["viking-octantis"],
    featuredPortSlugs: ["seward-alaska", "juneau-alaska", "ketchikan-alaska"],
    relatedLinks: [
      { label: "Cruise explorer", href: "/cruises" },
      { label: "Seward cruise port", href: "/cruises/port/seward-alaska" },
    ],
  },
};

export function getCruiseLineConfig(slug: string): CruiseLineConfig | null {
  return CRUISE_LINES_CONFIG[slug] || null;
}

export function listCruiseLineSlugs(): string[] {
  return Object.keys(CRUISE_LINES_CONFIG).sort();
}

export function getCruiseLineConfigByShipSlug(shipSlug: string): CruiseLineConfig | null {
  return (
    Object.values(CRUISE_LINES_CONFIG).find((line) => line.shipSlugs.includes(shipSlug)) || null
  );
}
