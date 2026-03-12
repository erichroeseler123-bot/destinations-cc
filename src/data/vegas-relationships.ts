import {
  getVegasAttractionBySlug,
  VEGAS_ATTRACTIONS_CONFIG,
  type VegasAttraction,
} from "@/src/data/vegas-attractions-config";
import {
  getVegasCasinoBySlug,
  VEGAS_CASINOS_CONFIG,
  type VegasCasino,
} from "@/src/data/vegas-casinos-config";
import {
  getVegasHotelBySlug,
  VEGAS_HOTELS_CONFIG,
  type VegasHotel,
} from "@/src/data/vegas-hotels-config";

export type VegasRelationshipPath = "hotels-near" | "casinos-near" | "attractions-near";
export type VegasRelationshipAnchorType = "hotel" | "casino" | "attraction";
export type VegasRelationshipResultType = "hotel" | "casino" | "attraction";

export type VegasRelationshipGuidance = {
  title: string;
  body: string;
};

export type VegasRelationshipPage = {
  slug: string;
  path: VegasRelationshipPath;
  title: string;
  summary: string;
  anchorType: VegasRelationshipAnchorType;
  anchorSlug: string;
  resultType: VegasRelationshipResultType;
  resultSlugs: string[];
  guidance: VegasRelationshipGuidance[];
  relatedLinks: Array<{ href: string; label: string }>;
  overlayTags?: string[];
  districtNote?: string;
};

type RelationshipAnchor = {
  slug: string;
  name: string;
  href: string;
};

type RelationshipEntity = VegasHotel | VegasCasino | VegasAttraction;

function resolveAnchor(anchorType: VegasRelationshipAnchorType, slug: string): RelationshipAnchor | null {
  switch (anchorType) {
    case "hotel": {
      const hotel = getVegasHotelBySlug(slug);
      return hotel ? { slug: hotel.slug, name: hotel.name, href: `/hotel/${hotel.slug}` } : null;
    }
    case "casino": {
      const casino = getVegasCasinoBySlug(slug);
      return casino ? { slug: casino.slug, name: casino.name, href: `/casino/${casino.slug}` } : null;
    }
    case "attraction": {
      const attraction = getVegasAttractionBySlug(slug);
      return attraction ? { slug: attraction.slug, name: attraction.name, href: attraction.primaryHref } : null;
    }
  }
}

function resolveEntity(resultType: VegasRelationshipResultType, slug: string): RelationshipEntity | null {
  switch (resultType) {
    case "hotel":
      return getVegasHotelBySlug(slug);
    case "casino":
      return getVegasCasinoBySlug(slug) || null;
    case "attraction":
      return getVegasAttractionBySlug(slug);
  }
}

export const VEGAS_RELATIONSHIP_PAGES: VegasRelationshipPage[] = [
  {
    slug: "sphere-las-vegas",
    path: "hotels-near",
    title: "Hotels near Sphere at The Venetian Resort",
    summary:
      "This page captures the hotel-first version of Sphere planning: walkability, north-Strip convenience, and easier post-show routing.",
    anchorType: "attraction",
    anchorSlug: "sphere-las-vegas",
    resultType: "hotel",
    resultSlugs: ["venetian", "wynn", "encore", "resorts-world", "treasure-island", "bellagio"],
    guidance: [
      { title: "Best for walkability", body: "Strongest for buyers who want show nights without relying on longer Strip transfers." },
      { title: "Best for luxury", body: "North and mid-Strip luxury stays fit best when Sphere is the anchor of the trip." },
      { title: "Best for nightlife pairing", body: "This works especially well for buyers who want post-show dining and nightlife nearby." },
    ],
    relatedLinks: [
      { href: "/las-vegas/shows", label: "Las Vegas shows" },
      { href: "/vegas", label: "Vegas hub" },
      { href: "/las-vegas/hotels", label: "Las Vegas hotels" },
    ],
    overlayTags: ["show-adjacent", "luxury", "strip"],
    districtNote: "North and central Strip hotel selection matters more here than citywide hotel comparison.",
  },
  {
    slug: "fremont-street-experience",
    path: "hotels-near",
    title: "Hotels near Fremont Street Experience",
    summary:
      "This page captures the hotel-first version of Fremont planning: downtown walkability, lower-cost old-Vegas energy, and easier nightlife routing.",
    anchorType: "attraction",
    anchorSlug: "fremont-street-experience",
    resultType: "hotel",
    resultSlugs: ["golden-nugget", "downtown-grand", "plaza", "linq-hotel"],
    guidance: [
      { title: "Best for Fremont walkability", body: "These stays fit best when downtown is the real trip anchor rather than the Strip." },
      { title: "Best for nightlife", body: "Fremont-led nights work better when the hotel is close enough to avoid late cross-city transfers." },
      { title: "Best for classic Vegas", body: "This cluster helps buyers who want old-Vegas identity, lower-cost routing, and sportsbook energy." },
    ],
    relatedLinks: [
      { href: "/fremont-street", label: "Fremont Street" },
      { href: "/las-vegas/casinos", label: "Las Vegas casinos" },
      { href: "/vegas", label: "Vegas hub" },
    ],
    overlayTags: ["downtown", "classic", "nightlife"],
    districtNote: "Downtown behaves like a separate district with a tighter hotel-nightlife-casino loop than the Strip.",
  },
  {
    slug: "caesars-palace-casino",
    path: "hotels-near",
    title: "Hotels near Caesars Palace Casino",
    summary:
      "This page captures the hotel-first version of Caesars Palace Casino planning: center-Strip access, residency nights, sportsbook pull, and walkable restaurant density.",
    anchorType: "casino",
    anchorSlug: "caesars-palace-casino",
    resultType: "hotel",
    resultSlugs: ["caesars-palace", "bellagio", "paris-las-vegas", "planet-hollywood", "aria", "cosmopolitan"],
    guidance: [
      { title: "Best for center-Strip access", body: "These stays fit buyers who want flagship casino energy without leaving the center Strip corridor." },
      { title: "Best for sportsbook and shows", body: "Useful when sportsbook time and residency nights are both part of the plan." },
      { title: "Best for first-timers", body: "This cluster works well for first-time buyers who want recognizable Vegas in one walkable zone." },
    ],
    relatedLinks: [
      { href: "/casino/caesars-palace-casino", label: "Caesars Palace Casino" },
      { href: "/las-vegas/casinos", label: "Las Vegas casinos" },
      { href: "/las-vegas-strip", label: "Las Vegas Strip" },
    ],
    overlayTags: ["luxury", "sportsbook", "show-adjacent"],
    districtNote: "This is a center-Strip routing problem more than a generic Vegas hotel search.",
  },
  {
    slug: "bellagio",
    path: "attractions-near",
    title: "Attractions near Bellagio",
    summary:
      "This page captures the attraction-first version of Bellagio planning: fountain nights, central Strip walkability, and what else to stack around the hotel.",
    anchorType: "hotel",
    anchorSlug: "bellagio",
    resultType: "attraction",
    resultSlugs: ["fountains-of-bellagio", "high-roller", "sphere-las-vegas", "area15"],
    guidance: [
      { title: "Best for first-timers", body: "Useful when Bellagio is already chosen and the traveler is filling the nearby itinerary around it." },
      { title: "Best for romantic routing", body: "This cluster favors fountain nights, observation attractions, and show-adjacent planning." },
      { title: "Best for central Strip stacks", body: "The strongest options here work when the buyer wants one base with multiple nearby nights out." },
    ],
    relatedLinks: [
      { href: "/hotel/bellagio", label: "Bellagio hotel node" },
      { href: "/las-vegas/things-to-do", label: "Las Vegas things to do" },
      { href: "/things-to-do-on-the-strip", label: "Things to do on the Strip" },
    ],
    overlayTags: ["romantic", "strip", "show-adjacent"],
    districtNote: "Bellagio sits inside the highest-density central Strip attraction zone.",
  },
  {
    slug: "bellagio",
    path: "casinos-near",
    title: "Casinos near Bellagio",
    summary:
      "This page captures the casino-first version of Bellagio planning: fountain-adjacent gaming, nearby flagship alternatives, and central-Strip comparison routing.",
    anchorType: "hotel",
    anchorSlug: "bellagio",
    resultType: "casino",
    resultSlugs: ["bellagio-casino", "caesars-palace-casino", "mgm-grand-casino", "venetian-casino", "wynn-casino"],
    guidance: [
      { title: "Best for flagship comparison", body: "Useful when the room is likely Bellagio but gaming and nightlife choices are still open." },
      { title: "Best for luxury casino buyers", body: "This cluster captures the strongest nearby flagship casino alternatives without leaving the Strip core." },
      { title: "Best for show-adjacent gaming", body: "These casino nodes work well when dining, shows, and gaming all need to fit one core corridor." },
    ],
    relatedLinks: [
      { href: "/hotel/bellagio", label: "Bellagio hotel node" },
      { href: "/las-vegas/casinos", label: "Las Vegas casinos" },
      { href: "/las-vegas-strip", label: "Las Vegas Strip" },
    ],
    overlayTags: ["luxury", "show-adjacent", "strip"],
    districtNote: "This is a central-Strip comparison problem, not a citywide casino search.",
  },
];

export function getVegasRelationshipPage(path: VegasRelationshipPath, slug: string) {
  return VEGAS_RELATIONSHIP_PAGES.find((page) => page.path === path && page.slug === slug) || null;
}

export function listVegasRelationshipSlugs(path: VegasRelationshipPath) {
  return VEGAS_RELATIONSHIP_PAGES.filter((page) => page.path === path).map((page) => page.slug);
}

export function getResolvedVegasRelationshipPage(path: VegasRelationshipPath, slug: string): {
  page: VegasRelationshipPage;
  anchor: RelationshipAnchor;
  results: RelationshipEntity[];
} | null {
  const page = getVegasRelationshipPage(path, slug);
  if (!page) return null;
  const anchor = resolveAnchor(page.anchorType, page.anchorSlug);
  if (!anchor) return null;
  const results = page.resultSlugs
    .map((resultSlug) => resolveEntity(page.resultType, resultSlug))
    .filter((result): result is RelationshipEntity => Boolean(result));
  return { page, anchor, results };
}

export function listHotelsNearSlugs() {
  return listVegasRelationshipSlugs("hotels-near");
}

export function listAttractionsNearSlugs() {
  return listVegasRelationshipSlugs("attractions-near");
}

export function listCasinosNearSlugs() {
  return listVegasRelationshipSlugs("casinos-near");
}

export function getResolvedHotelsNearPage(slug: string): {
  page: VegasRelationshipPage;
  anchor: RelationshipAnchor;
  results: VegasHotel[];
} | null {
  const resolved = getResolvedVegasRelationshipPage("hotels-near", slug);
  if (!resolved) return null;
  return {
    ...resolved,
    results: resolved.results.filter((result): result is VegasHotel => "tier" in result),
  };
}

export function getResolvedAttractionsNearPage(slug: string): {
  page: VegasRelationshipPage;
  anchor: RelationshipAnchor;
  results: VegasAttraction[];
} | null {
  const resolved = getResolvedVegasRelationshipPage("attractions-near", slug);
  if (!resolved) return null;
  return {
    ...resolved,
    results: resolved.results.filter((result): result is VegasAttraction => "primaryHref" in result),
  };
}

export function getResolvedCasinosNearPage(slug: string): {
  page: VegasRelationshipPage;
  anchor: RelationshipAnchor;
  results: VegasCasino[];
} | null {
  const resolved = getResolvedVegasRelationshipPage("casinos-near", slug);
  if (!resolved) return null;
  return {
    ...resolved,
    results: resolved.results.filter((result): result is VegasCasino => "anchors" in result),
  };
}

export function getVegasRelationshipFallbackHotels(limit = 6) {
  return VEGAS_HOTELS_CONFIG.slice(0, limit);
}

export function getVegasRelationshipFallbackAttractions(limit = 6) {
  return VEGAS_ATTRACTIONS_CONFIG.slice(0, limit);
}

export function getVegasRelationshipFallbackCasinos(limit = 6) {
  return VEGAS_CASINOS_CONFIG.slice(0, limit);
}
