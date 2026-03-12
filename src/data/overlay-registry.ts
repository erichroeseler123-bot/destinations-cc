export type DccOverlayType =
  | "pet-friendly"
  | "kid-friendly"
  | "luxury"
  | "nightlife"
  | "budget"
  | "scenic"
  | "festival-pressure"
  | "music-first"
  | "family";

export type DccOverlayRegistryNode = {
  slug: string;
  citySlug: string;
  overlayType: DccOverlayType;
  entityTypes: string[];
  resultSlugs: string[];
  canonicalPath: string;
  summary: string;
  relatedLinks?: Array<{ href: string; label: string }>;
};

export const OVERLAY_REGISTRY: DccOverlayRegistryNode[] = [
  {
    slug: "pet-friendly-las-vegas",
    citySlug: "las-vegas",
    overlayType: "pet-friendly",
    entityTypes: ["hotel"],
    resultSlugs: ["vdara", "park-mgm", "mgm-grand", "caesars-palace"],
    canonicalPath: "/pet-friendly/las-vegas",
    summary: "Cross-city overlay pattern for pet-friendly hotel discovery, proven first in the Vegas hotel mesh.",
    relatedLinks: [
      { href: "/las-vegas/hotels", label: "Las Vegas hotels" },
      { href: "/vegas", label: "Vegas hub" },
      { href: "/las-vegas-strip", label: "Las Vegas Strip" },
    ],
  },
  {
    slug: "kid-friendly-las-vegas",
    citySlug: "las-vegas",
    overlayType: "kid-friendly",
    entityTypes: ["hotel", "attraction", "pool"],
    resultSlugs: ["excalibur", "circus-circus", "adventuredome", "mandalay-bay-pools"],
    canonicalPath: "/kid-friendly/las-vegas",
    summary: "Family-first Vegas overlay that cuts across hotels, attractions, and pool nodes.",
    relatedLinks: [
      { href: "/las-vegas/hotels", label: "Las Vegas hotels" },
      { href: "/las-vegas/pools", label: "Las Vegas pools" },
      { href: "/vegas", label: "Vegas hub" },
    ],
  },
  {
    slug: "luxury-las-vegas",
    citySlug: "las-vegas",
    overlayType: "luxury",
    entityTypes: ["hotel", "casino"],
    resultSlugs: ["bellagio", "caesars-palace", "venetian", "wynn", "bellagio-casino", "wynn-casino"],
    canonicalPath: "/luxury-hotels-las-vegas",
    summary: "Luxury overlay layer for flagship Vegas hotel and casino routing.",
  },
  {
    slug: "kid-friendly-miami",
    citySlug: "miami",
    overlayType: "kid-friendly",
    entityTypes: ["beach"],
    resultSlugs: ["north-beach", "surfside", "hobie-beach"],
    canonicalPath: "/kid-friendly/miami",
    summary: "Kid-friendly Miami overlay focused on calmer beaches, easier family movement, and lighter beach-day logistics.",
    relatedLinks: [
      { href: "/miami", label: "Miami hub" },
      { href: "/miami/beaches", label: "Miami beaches" },
      { href: "/miami/tours", label: "Miami tours" },
    ],
  },
  {
    slug: "miami-beach-family",
    citySlug: "miami",
    overlayType: "family",
    entityTypes: ["beach"],
    resultSlugs: ["north-beach", "surfside", "hobie-beach"],
    canonicalPath: "/miami/beaches",
    summary: "Family-oriented Miami beach overlay that can later split into dedicated family-beach pages.",
  },
  {
    slug: "miami-beach-scenic",
    citySlug: "miami",
    overlayType: "scenic",
    entityTypes: ["beach"],
    resultSlugs: ["south-beach", "mid-beach", "haulover-beach"],
    canonicalPath: "/miami/beaches",
    summary: "Scenic and skyline-oriented beach discovery layer for Miami.",
  },
  {
    slug: "new-orleans-festival-pressure",
    citySlug: "new-orleans",
    overlayType: "festival-pressure",
    entityTypes: ["district", "venue", "hotel"],
    resultSlugs: [],
    canonicalPath: "/new-orleans",
    summary: "Seasonal-pressure overlay for New Orleans, centered on festival, crowd, and hotel-demand behavior.",
  },
  {
    slug: "nashville-music-first",
    citySlug: "nashville",
    overlayType: "music-first",
    entityTypes: ["venue", "show", "district"],
    resultSlugs: [],
    canonicalPath: "/nashville/shows",
    summary: "Music-first Nashville overlay that ties live-music discovery to venue and district expansion later.",
  },
];

export function getOverlayRegistryNodesByCity(citySlug: string) {
  return OVERLAY_REGISTRY.filter((overlay) => overlay.citySlug === citySlug);
}

export function getOverlayRegistryNodeByTypeAndCity(overlayType: DccOverlayType, citySlug: string) {
  return OVERLAY_REGISTRY.find((overlay) => overlay.overlayType === overlayType && overlay.citySlug === citySlug) ?? null;
}

export function listOverlayCitySlugsByType(overlayType: DccOverlayType) {
  return OVERLAY_REGISTRY.filter((overlay) => overlay.overlayType === overlayType).map((overlay) => overlay.citySlug);
}
