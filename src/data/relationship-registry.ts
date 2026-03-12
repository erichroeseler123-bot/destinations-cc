import {
  VEGAS_RELATIONSHIP_PAGES,
  type VegasRelationshipAnchorType,
  type VegasRelationshipPath,
  type VegasRelationshipResultType,
} from "@/src/data/vegas-relationships";
import { getCityRegistryNode } from "@/src/data/cities-registry";
import {
  ENTITIES_REGISTRY,
  getEntityRegistryNode,
  type DccEntityRegistryNode,
  type DccEntityType,
} from "@/src/data/entities-registry";
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

export type DccRelationshipPath =
  | VegasRelationshipPath
  | "accessible-hotels-near"
  | "venues-near"
  | "restaurants-near"
  | "pools-near"
  | "best-for";

export type DccRelationshipAnchorType =
  | VegasRelationshipAnchorType
  | "venue"
  | "district"
  | "beach"
  | "pool";

export type DccRelationshipResultType =
  | VegasRelationshipResultType
  | "venue"
  | "restaurant"
  | "pool"
  | "beach";

export type DccRelationshipGuidance = {
  title: string;
  body: string;
};

export type DccRelationshipRegistryNode = {
  slug: string;
  path: DccRelationshipPath;
  citySlug: string;
  title: string;
  summary: string;
  anchorType: DccRelationshipAnchorType;
  anchorSlug: string;
  resultType: DccRelationshipResultType;
  resultSlugs: string[];
  guidance: DccRelationshipGuidance[];
  relatedLinks: Array<{ href: string; label: string }>;
  overlayTags?: string[];
  districtNote?: string;
};

export type DccRelationshipAnchor = {
  slug: string;
  name: string;
  href: string;
};

type RelationshipEntity = VegasHotel | VegasCasino | VegasAttraction;

const vegasRelationshipRegistryNodes: DccRelationshipRegistryNode[] = VEGAS_RELATIONSHIP_PAGES.map((page) => ({
  citySlug: "las-vegas",
  ...page,
}));

export const RELATIONSHIP_REGISTRY: DccRelationshipRegistryNode[] = [
  ...vegasRelationshipRegistryNodes,
  {
    slug: "sphere-las-vegas",
    path: "accessible-hotels-near",
    citySlug: "las-vegas",
    title: "Accessible hotels near Sphere Las Vegas",
    summary:
      "Where to stay when Sphere is the anchor and accessibility matters early: easier hotel movement, clearer arrival flow, lower-friction entrances, and better recovery options after high-stimulus show nights.",
    anchorType: "attraction",
    anchorSlug: "sphere-las-vegas",
    resultType: "hotel",
    resultSlugs: ["bellagio", "vdara", "park-mgm"],
    guidance: [
      {
        title: "Best for lower-friction arrival",
        body: "These stays fit travelers who want clearer resort layouts and fewer accessibility unknowns before locking in a Sphere night.",
      },
      {
        title: "Best for event-night recovery",
        body: "This cluster works well when the plan needs simpler re-entry, calmer hotel movement, or easier reset time after a major show.",
      },
      {
        title: "Best for couples and small groups",
        body: "Use this page when one accessibility requirement is driving the stay choice for the whole group, not just one guest.",
      },
    ],
    relatedLinks: [
      { href: "/accessibility/las-vegas", label: "Las Vegas accessibility guide" },
      { href: "/las-vegas/shows", label: "Las Vegas shows" },
      { href: "/vegas", label: "Vegas hub" },
    ],
    overlayTags: ["accessibility", "show-adjacent", "strip"],
    districtNote: "This is a show-led accessibility routing problem centered on the Sphere and its surrounding resort cluster.",
  },
  {
    slug: "caesars-palace-casino",
    path: "accessible-hotels-near",
    citySlug: "las-vegas",
    title: "Accessible hotels near Caesars Palace Casino",
    summary:
      "Hotels near Caesars Palace for travelers who need strong central-Strip access without making the whole trip depend on one giant casino-floor routing decision.",
    anchorType: "casino",
    anchorSlug: "caesars-palace-casino",
    resultType: "hotel",
    resultSlugs: ["bellagio", "caesars-palace", "park-mgm"],
    guidance: [
      {
        title: "Best for central Strip access",
        body: "These hotel anchors keep the stay close to Caesars Palace while still giving easier alternatives to a single casino-centered movement pattern.",
      },
      {
        title: "Best for mixed trip priorities",
        body: "Use this when accessibility matters but the trip also includes shows, restaurants, and mid-Strip movement beyond the casino itself.",
      },
      {
        title: "Best for lower-friction rerouting",
        body: "This layer is useful when the hotel choice needs to absorb some of the strain that would otherwise fall on one busy casino property.",
      },
    ],
    relatedLinks: [
      { href: "/accessibility/las-vegas", label: "Las Vegas accessibility guide" },
      { href: "/casino/caesars-palace-casino", label: "Caesars Palace Casino" },
      { href: "/las-vegas/hotels", label: "Las Vegas hotels" },
    ],
    overlayTags: ["accessibility", "strip", "central-location"],
    districtNote: "This is a center-Strip accessibility hotel-routing question, not just a casino-comparison page.",
  },
  {
    slug: "south-beach",
    path: "hotels-near",
    citySlug: "miami",
    title: "Hotels near South Beach",
    summary:
      "Where to stay when South Beach is the anchor but the hotel decision is still open. This page compares walkable, beach-forward, and premium Miami Beach stays without dropping back into a generic city hotel list.",
    anchorType: "beach",
    anchorSlug: "south-beach",
    resultType: "hotel",
    resultSlugs: ["loews-miami-beach", "1-hotel-south-beach", "fontainebleau-miami-beach"],
    guidance: [
      {
        title: "Best for first-time Miami stays",
        body: "Use this when the trip is clearly beach-led and the next decision is whether to stay on South Beach itself or shift slightly north for more resort depth.",
      },
      {
        title: "Best for walkability",
        body: "These hotel nodes keep the stay close to the water, nightlife, and Miami Beach dining without turning the whole plan into a car-first itinerary.",
      },
      {
        title: "Best for split beach and nightlife trips",
        body: "This is the right layer when the buyer wants a South Beach anchor but still needs to compare quieter resort choices against nightlife-heavy options.",
      },
    ],
    relatedLinks: [
      { href: "/miami", label: "Miami hub" },
      { href: "/miami/beaches", label: "Miami beaches" },
      { href: "/pet-friendly/miami", label: "Pet-friendly Miami" },
    ],
    overlayTags: ["beachfront", "walkable", "nightlife"],
    districtNote: "South Beach should behave like a Miami district anchor, not just a single beach label on the beach hub.",
  },
  {
    slug: "south-beach",
    path: "attractions-near",
    citySlug: "miami",
    title: "Beaches and waterfront spots near South Beach",
    summary:
      "This page captures the nearby-waterfront version of South Beach planning: adjacent beach zones, quieter stretches, and beach-day alternatives when the trip is already anchored on Miami’s best-known shoreline.",
    anchorType: "beach",
    anchorSlug: "south-beach",
    resultType: "beach",
    resultSlugs: ["mid-beach", "north-beach", "surfside", "hobie-beach", "haulover-beach"],
    guidance: [
      { title: "Best for first-time Miami trips", body: "Use this when South Beach is already the anchor and the next question is where else to go without losing the beach-led shape of the trip." },
      { title: "Best for calmer alternatives", body: "These nearby nodes help when South Beach feels too nightlife-heavy and the buyer wants quieter family or scenic beach routing." },
      { title: "Best for split beach days", body: "This works when the itinerary needs one iconic beach block plus one lighter, more local, or more activity-friendly waterfront block." },
    ],
    relatedLinks: [
      { href: "/miami/beaches", label: "Miami beaches" },
      { href: "/miami", label: "Miami hub" },
      { href: "/miami/tours", label: "Miami tours" },
    ],
    overlayTags: ["nightlife", "scenic", "family"],
    districtNote: "South Beach should behave like a district anchor inside the Miami graph, not just a single beach mention on the city page.",
  },
];

export function getRelationshipRegistryNode(path: DccRelationshipPath, slug: string) {
  return RELATIONSHIP_REGISTRY.find((page) => page.path === path && page.slug === slug) ?? null;
}

export function getRelationshipRegistryNodesByCity(citySlug: string) {
  return RELATIONSHIP_REGISTRY.filter((page) => page.citySlug === citySlug);
}

function mapRelationshipTypeToEntityType(resultType: DccRelationshipResultType): DccEntityType | null {
  switch (resultType) {
    case "hotel":
    case "casino":
    case "venue":
    case "attraction":
    case "restaurant":
    case "pool":
    case "beach":
      return resultType;
    default:
      return null;
  }
}

export function getResolvedEntityRelationshipPage(path: DccRelationshipPath, slug: string): {
  page: DccRelationshipRegistryNode;
  city: ReturnType<typeof getCityRegistryNode>;
  anchor: DccEntityRegistryNode;
  results: DccEntityRegistryNode[];
} | null {
  const page = getRelationshipRegistryNode(path, slug);
  if (!page) return null;

  const anchor = getEntityRegistryNode(page.anchorSlug, mapRelationshipTypeToEntityType(page.anchorType as DccRelationshipResultType) ?? undefined);
  const city = getCityRegistryNode(page.citySlug);
  if (!anchor || !city) return null;

  const results = page.resultSlugs
    .map((resultSlug) => getEntityRegistryNode(resultSlug, mapRelationshipTypeToEntityType(page.resultType) ?? undefined))
    .filter((result): result is DccEntityRegistryNode => Boolean(result));

  return { page, city, anchor, results };
}

function resolveVegasAnchor(anchorType: DccRelationshipAnchorType, slug: string): DccRelationshipAnchor | null {
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
    default:
      return null;
  }
}

function resolveVegasEntity(resultType: DccRelationshipResultType, slug: string): RelationshipEntity | null {
  switch (resultType) {
    case "hotel":
      return getVegasHotelBySlug(slug);
    case "casino":
      return getVegasCasinoBySlug(slug) ?? null;
    case "attraction":
      return getVegasAttractionBySlug(slug);
    default:
      return null;
  }
}

export function listRelationshipSlugs(path: DccRelationshipPath) {
  return RELATIONSHIP_REGISTRY.filter((page) => page.path === path).map((page) => page.slug);
}

export function getResolvedRelationshipPage(path: DccRelationshipPath, slug: string): {
  page: DccRelationshipRegistryNode;
  anchor: DccRelationshipAnchor;
  results: RelationshipEntity[];
} | null {
  const page = getRelationshipRegistryNode(path, slug);
  if (!page) return null;
  if (page.citySlug !== "las-vegas") return null;

  const anchor = resolveVegasAnchor(page.anchorType, page.anchorSlug);
  if (!anchor) return null;

  const results = page.resultSlugs
    .map((resultSlug) => resolveVegasEntity(page.resultType, resultSlug))
    .filter((result): result is RelationshipEntity => Boolean(result));

  return { page, anchor, results };
}

export function getResolvedHotelsNearPage(slug: string): {
  page: DccRelationshipRegistryNode;
  anchor: DccRelationshipAnchor;
  results: VegasHotel[];
} | null {
  const resolved = getResolvedRelationshipPage("hotels-near", slug);
  if (!resolved) return null;
  return {
    ...resolved,
    results: resolved.results.filter((result): result is VegasHotel => "tier" in result),
  };
}

export function getResolvedAccessibleHotelsNearPage(slug: string): {
  page: DccRelationshipRegistryNode;
  anchor: DccRelationshipAnchor;
  results: VegasHotel[];
} | null {
  const resolved = getResolvedRelationshipPage("accessible-hotels-near", slug);
  if (!resolved) return null;
  return {
    ...resolved,
    results: resolved.results.filter((result): result is VegasHotel => "tier" in result),
  };
}

export function getResolvedAttractionsNearPage(slug: string): {
  page: DccRelationshipRegistryNode;
  anchor: DccRelationshipAnchor;
  results: VegasAttraction[];
} | null {
  const resolved = getResolvedRelationshipPage("attractions-near", slug);
  if (!resolved) return null;
  return {
    ...resolved,
    results: resolved.results.filter((result): result is VegasAttraction => "primaryHref" in result),
  };
}

export function getResolvedCasinosNearPage(slug: string): {
  page: DccRelationshipRegistryNode;
  anchor: DccRelationshipAnchor;
  results: VegasCasino[];
} | null {
  const resolved = getResolvedRelationshipPage("casinos-near", slug);
  if (!resolved) return null;
  return {
    ...resolved,
    results: resolved.results.filter((result): result is VegasCasino => "anchors" in result),
  };
}

export function getRelationshipFallbackHotels(limit = 6) {
  return VEGAS_HOTELS_CONFIG.slice(0, limit);
}

export function getRelationshipFallbackAttractions(limit = 6) {
  return VEGAS_ATTRACTIONS_CONFIG.slice(0, limit);
}

export function getRelationshipFallbackCasinos(limit = 6) {
  return VEGAS_CASINOS_CONFIG.slice(0, limit);
}

export function getRelationshipFallbackEntities(citySlug: string, resultType: DccRelationshipResultType, limit = 6) {
  const entityType = mapRelationshipTypeToEntityType(resultType);
  if (!entityType) return [];
  return ENTITIES_REGISTRY.filter((entity) => entity.citySlug === citySlug && entity.entityType === entityType).slice(0, limit);
}
