import {
  getVegasAttractionBySlug,
  VEGAS_ATTRACTIONS_CONFIG,
  type VegasAttraction,
} from "@/src/data/vegas-attractions-config";
import { getVegasHotelBySlug, VEGAS_HOTELS_CONFIG, type VegasHotel } from "@/src/data/vegas-hotels-config";

export type HotelsNearConfig = {
  slug: string;
  targetAttractionSlug: string;
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

export const VEGAS_HOTELS_NEAR_CONFIG: HotelsNearConfig[] = [
  {
    slug: "sphere-las-vegas",
    targetAttractionSlug: "sphere-las-vegas",
    hotelSlugs: ["venetian", "wynn", "encore", "resorts-world", "treasure-island", "bellagio"],
    summary:
      "This page captures the hotel-first version of Sphere planning: walkability, north-Strip convenience, and easier post-show routing.",
    buyerNotes: [
      "Best for buyers prioritizing walkable show nights",
      "Useful when Sphere is the anchor of the entire Vegas stay",
      "Most relevant for north and central Strip room selection",
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

export function getHotelsNearConfig(slug: string) {
  return VEGAS_HOTELS_NEAR_CONFIG.find((config) => config.slug === slug) || null;
}

export function getAttractionsNearConfig(slug: string) {
  return VEGAS_ATTRACTIONS_NEAR_CONFIG.find((config) => config.slug === slug) || null;
}

export function getHotelsNearAttraction(slug: string): { config: HotelsNearConfig; target: VegasAttraction; hotels: VegasHotel[] } | null {
  const config = getHotelsNearConfig(slug);
  if (!config) return null;
  const target = getVegasAttractionBySlug(config.targetAttractionSlug);
  if (!target) return null;
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

export function listHotelsNearSlugs() {
  return VEGAS_HOTELS_NEAR_CONFIG.map((config) => config.slug);
}

export function listAttractionsNearSlugs() {
  return VEGAS_ATTRACTIONS_NEAR_CONFIG.map((config) => config.slug);
}

export function getVegasRelationshipFallbackHotels(limit = 6) {
  return VEGAS_HOTELS_CONFIG.slice(0, limit);
}

export function getVegasRelationshipFallbackAttractions(limit = 6) {
  return VEGAS_ATTRACTIONS_CONFIG.slice(0, limit);
}
