import {
  getVegasAttractionBySlug,
  VEGAS_ATTRACTIONS_CONFIG,
  type VegasAttraction,
} from "@/src/data/vegas-attractions-config";
import { getVegasCasinoBySlug, VEGAS_CASINOS_CONFIG, type VegasCasino } from "@/src/data/vegas-casinos-config";
import { getVegasHotelBySlug, VEGAS_HOTELS_CONFIG, type VegasHotel } from "@/src/data/vegas-hotels-config";

export type HotelsNearConfig = {
  slug: string;
  anchorType: "attraction" | "casino";
  targetSlug: string;
  hotelSlugs: string[];
  summary: string;
  buyerNotes: string[];
};

export type AttractionsNearConfig = {
  slug: string;
  targetHotelSlug: string;
  attractionSlugs: string[];
  summary: string;
  buyerNotes: string[];
};

export type CasinosNearConfig = {
  slug: string;
  targetHotelSlug: string;
  casinoSlugs: string[];
  summary: string;
  buyerNotes: string[];
};

export const VEGAS_HOTELS_NEAR_CONFIG: HotelsNearConfig[] = [
  {
    slug: "sphere-las-vegas",
    anchorType: "attraction",
    targetSlug: "sphere-las-vegas",
    hotelSlugs: ["venetian", "wynn", "encore", "resorts-world", "treasure-island", "bellagio"],
    summary:
      "This page captures the hotel-first version of Sphere planning: walkability, north-Strip convenience, and easier post-show routing.",
    buyerNotes: [
      "Best for buyers prioritizing walkable show nights",
      "Useful when Sphere is the anchor of the entire Vegas stay",
      "Most relevant for north and central Strip room selection",
    ],
  },
  {
    slug: "fremont-street-experience",
    anchorType: "attraction",
    targetSlug: "fremont-street-experience",
    hotelSlugs: ["golden-nugget", "downtown-grand", "plaza", "circa", "linq-hotel"],
    summary:
      "This page captures the hotel-first version of Fremont planning: downtown walkability, lower-cost old-Vegas energy, and easier nightlife routing.",
    buyerNotes: [
      "Best for buyers prioritizing Fremont walkability",
      "Useful when downtown is the real trip anchor rather than the Strip",
      "Most relevant for nightlife, sportsbook, and classic-casino buyers",
    ],
  },
  {
    slug: "caesars-palace-casino",
    anchorType: "casino",
    targetSlug: "caesars-palace-casino",
    hotelSlugs: ["caesars-palace", "bellagio", "paris-las-vegas", "planet-hollywood", "aria", "cosmopolitan"],
    summary:
      "This page captures the hotel-first version of Caesars Palace Casino planning: center-Strip access, residency nights, sportsbook pull, and walkable restaurant density.",
    buyerNotes: [
      "Best for buyers prioritizing center-Strip walkability",
      "Useful when sportsbook and residency nights are both in the mix",
      "Most relevant for first-time flagship Vegas stays",
    ],
  },
];

export const VEGAS_ATTRACTIONS_NEAR_CONFIG: AttractionsNearConfig[] = [
  {
    slug: "bellagio",
    targetHotelSlug: "bellagio",
    attractionSlugs: ["fountains-of-bellagio", "high-roller", "sphere-las-vegas", "area15"],
    summary:
      "This page captures the attraction-first version of Bellagio planning: fountain nights, central Strip walkability, and what else to stack around the hotel.",
    buyerNotes: [
      "Best for first-time Bellagio stays",
      "Useful when the hotel is the anchor and the itinerary fills around it",
      "Strong for romantic and show-adjacent Vegas routing",
    ],
  },
];

export const VEGAS_CASINOS_NEAR_CONFIG: CasinosNearConfig[] = [
  {
    slug: "bellagio",
    targetHotelSlug: "bellagio",
    casinoSlugs: ["bellagio-casino", "caesars-palace-casino", "mgm-grand-casino", "venetian-casino", "wynn-casino"],
    summary:
      "This page captures the casino-first version of Bellagio planning: fountain-adjacent gaming, nearby flagship alternatives, and central-Strip comparison routing.",
    buyerNotes: [
      "Best for buyers starting from Bellagio and comparing nearby flagship casino energy",
      "Useful when the room is likely Bellagio but gaming and nightlife are still open decisions",
      "Most relevant for luxury and show-adjacent central Strip trips",
    ],
  },
];

export function getHotelsNearConfig(slug: string) {
  return VEGAS_HOTELS_NEAR_CONFIG.find((config) => config.slug === slug) || null;
}

export function getAttractionsNearConfig(slug: string) {
  return VEGAS_ATTRACTIONS_NEAR_CONFIG.find((config) => config.slug === slug) || null;
}

export function getCasinosNearConfig(slug: string) {
  return VEGAS_CASINOS_NEAR_CONFIG.find((config) => config.slug === slug) || null;
}

export function getHotelsNearTarget(slug: string): {
  config: HotelsNearConfig;
  target: { name: string; primaryHref: string };
  hotels: VegasHotel[];
} | null {
  const config = getHotelsNearConfig(slug);
  if (!config) return null;
  let target: { name: string; primaryHref: string } | null = null;
  if (config.anchorType === "casino") {
    const casinoTarget = getVegasCasinoBySlug(config.targetSlug);
    if (!casinoTarget) return null;
    target = { name: casinoTarget.name, primaryHref: `/casino/${casinoTarget.slug}` };
  } else {
    const attractionTarget = getVegasAttractionBySlug(config.targetSlug);
    if (!attractionTarget) return null;
    target = { name: attractionTarget.name, primaryHref: attractionTarget.primaryHref };
  }
  const hotels = config.hotelSlugs
    .map((hotelSlug) => getVegasHotelBySlug(hotelSlug))
    .filter((hotel): hotel is VegasHotel => Boolean(hotel));
  return { config, target, hotels };
}

export function getAttractionsNearHotel(slug: string): { config: AttractionsNearConfig; target: VegasHotel; attractions: VegasAttraction[] } | null {
  const config = getAttractionsNearConfig(slug);
  if (!config) return null;
  const target = getVegasHotelBySlug(config.targetHotelSlug);
  if (!target) return null;
  const attractions = config.attractionSlugs
    .map((attractionSlug) => getVegasAttractionBySlug(attractionSlug))
    .filter((attraction): attraction is VegasAttraction => Boolean(attraction));
  return { config, target, attractions };
}

export function getCasinosNearHotel(slug: string): { config: CasinosNearConfig; target: VegasHotel; casinos: VegasCasino[] } | null {
  const config = getCasinosNearConfig(slug);
  if (!config) return null;
  const target = getVegasHotelBySlug(config.targetHotelSlug);
  if (!target) return null;
  const casinos = config.casinoSlugs
    .map((casinoSlug) => getVegasCasinoBySlug(casinoSlug))
    .filter((casino): casino is VegasCasino => Boolean(casino));
  return { config, target, casinos };
}

export function listHotelsNearSlugs() {
  return VEGAS_HOTELS_NEAR_CONFIG.map((config) => config.slug);
}

export function listAttractionsNearSlugs() {
  return VEGAS_ATTRACTIONS_NEAR_CONFIG.map((config) => config.slug);
}

export function listCasinosNearSlugs() {
  return VEGAS_CASINOS_NEAR_CONFIG.map((config) => config.slug);
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
