import {
  VEGAS_RELATIONSHIP_PAGES,
  type VegasRelationshipAnchorType,
  type VegasRelationshipPath,
  type VegasRelationshipResultType,
} from "@/src/data/vegas-relationships";
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

export const RELATIONSHIP_REGISTRY: DccRelationshipRegistryNode[] = VEGAS_RELATIONSHIP_PAGES.map((page) => ({
  citySlug: "las-vegas",
  ...page,
}));

export function getRelationshipRegistryNode(path: DccRelationshipPath, slug: string) {
  return RELATIONSHIP_REGISTRY.find((page) => page.path === path && page.slug === slug) ?? null;
}

export function getRelationshipRegistryNodesByCity(citySlug: string) {
  return RELATIONSHIP_REGISTRY.filter((page) => page.citySlug === citySlug);
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
