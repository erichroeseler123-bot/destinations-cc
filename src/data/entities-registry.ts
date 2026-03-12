import type { NodeImageSet } from "@/src/lib/media/types";
import { CITY_BEACHES_CONFIG } from "@/src/data/city-beaches-config";
import { CITY_POOLS_CONFIG } from "@/src/data/city-pools-config";
import { SPORTS_TEAMS_CONFIG } from "@/src/data/sports-teams-config";
import { SPORTS_VENUES_CONFIG } from "@/src/data/sports-venues-config";
import { VEGAS_ATTRACTIONS_CONFIG } from "@/src/data/vegas-attractions-config";
import { VEGAS_CASINOS_CONFIG } from "@/src/data/vegas-casinos-config";
import { VEGAS_HOTELS_CONFIG } from "@/src/data/vegas-hotels-config";

export type DccEntityType =
  | "hotel"
  | "casino"
  | "venue"
  | "attraction"
  | "restaurant"
  | "team"
  | "artist"
  | "beach"
  | "pool";

export type DccEntityRegistryNode = {
  slug: string;
  entityType: DccEntityType;
  citySlug: string;
  districtSlug?: string;
  title: string;
  summary: string;
  tags: string[];
  imageSet?: NodeImageSet;
  relatedEntitySlugs?: string[];
  canonicalPath: string;
  updatedAt: string;
};

function singleCardImage(image?: { src: string; alt: string; source: "local" | "ticketmaster" | "bandsintown" | "viator" | "seatgeek" | "unsplash"; attribution?: { label: string; href?: string } }): NodeImageSet | undefined {
  if (!image) return undefined;
  return { card: image };
}

const vegasHotelEntities: DccEntityRegistryNode[] = VEGAS_HOTELS_CONFIG.map((hotel) => ({
  slug: hotel.slug,
  entityType: "hotel",
  citySlug: "las-vegas",
  districtSlug: hotel.tags.includes("downtown") ? "fremont-street" : hotel.tags.includes("strip") ? "las-vegas-strip" : undefined,
  title: hotel.name,
  summary: hotel.summary,
  tags: hotel.tags,
  imageSet: { hero: hotel.heroImage, card: hotel.image, gallery: hotel.gallery },
  relatedEntitySlugs: [],
  canonicalPath: `/hotel/${hotel.slug}`,
  updatedAt: "2026-03-12",
}));

const vegasCasinoEntities: DccEntityRegistryNode[] = VEGAS_CASINOS_CONFIG.map((casino) => ({
  slug: casino.slug,
  entityType: "casino",
  citySlug: "las-vegas",
  districtSlug: casino.district,
  title: casino.name,
  summary: casino.summary,
  tags: casino.tags,
  imageSet: singleCardImage(casino.image),
  relatedEntitySlugs: casino.hotelSlug ? [casino.hotelSlug] : [],
  canonicalPath: `/casino/${casino.slug}`,
  updatedAt: "2026-03-12",
}));

const vegasAttractionEntities: DccEntityRegistryNode[] = VEGAS_ATTRACTIONS_CONFIG.map((attraction) => ({
  slug: attraction.slug,
  entityType: "attraction",
  citySlug: "las-vegas",
  districtSlug: attraction.district === "regional" ? undefined : attraction.district,
  title: attraction.name,
  summary: attraction.summary,
  tags: attraction.tags,
  imageSet: singleCardImage(attraction.image),
  relatedEntitySlugs: [],
  canonicalPath: attraction.primaryHref,
  updatedAt: "2026-03-12",
}));

const sportsTeamEntities: DccEntityRegistryNode[] = SPORTS_TEAMS_CONFIG.map((team) => ({
  slug: team.slug,
  entityType: "team",
  citySlug: team.citySlug,
  title: team.name,
  summary: team.description,
  tags: [team.leagueSlug, "sports"],
  relatedEntitySlugs: [team.venueSlug],
  canonicalPath: `/sports/team/${team.slug}`,
  updatedAt: team.updatedAt,
}));

const sportsVenueEntities: DccEntityRegistryNode[] = SPORTS_VENUES_CONFIG.map((venue) => ({
  slug: venue.slug,
  entityType: "venue",
  citySlug: venue.citySlug,
  title: venue.name,
  summary: venue.description,
  tags: [...venue.sportsLeagues, "sports-venue"],
  relatedEntitySlugs: venue.primaryTeams,
  canonicalPath: `/venues/${venue.slug}`,
  updatedAt: venue.updatedAt,
}));

const vegasPoolEntities: DccEntityRegistryNode[] = (CITY_POOLS_CONFIG["las-vegas"]?.poolNodes ?? []).map((pool) => ({
  slug: pool.slug,
  entityType: "pool",
  citySlug: "las-vegas",
  districtSlug: "las-vegas-strip",
  title: pool.title,
  summary: pool.summary,
  tags: [pool.type, "pool"],
  relatedEntitySlugs: pool.hotelHref ? [pool.hotelHref.replace("/hotel/", "")] : [],
  canonicalPath: "/las-vegas/pools",
  updatedAt: "2026-03-12",
}));

const miamiBeachEntities: DccEntityRegistryNode[] = (CITY_BEACHES_CONFIG.miami?.beaches ?? []).map((beach) => ({
  slug: beach.slug,
  entityType: "beach",
  citySlug: "miami",
  title: beach.title,
  summary: beach.summary,
  tags: beach.tags,
  relatedEntitySlugs: [],
  canonicalPath: "/miami/beaches",
  updatedAt: "2026-03-12",
}));

const miamiPetEntities: DccEntityRegistryNode[] = [
  {
    slug: "bark-beach-miami-beach",
    entityType: "attraction",
    citySlug: "miami",
    districtSlug: "south-beach",
    title: "Bark Beach",
    summary: "Miami Beach's designated dog-beach surface, useful when the trip needs real pet-friendly outdoor time instead of only hotel-policy filtering.",
    tags: ["pet-friendly", "beach", "outdoor", "miami-beach"],
    canonicalPath: "/miami/beaches",
    updatedAt: "2026-03-12",
  },
  {
    slug: "belle-isle-dog-park",
    entityType: "attraction",
    citySlug: "miami",
    title: "Belle Isle Dog Park",
    summary: "A cleaner local pet-routing anchor for Miami stays that need dog-space access without treating the whole trip as South Beach only.",
    tags: ["pet-friendly", "park", "walkable", "miami-beach"],
    canonicalPath: "/miami",
    updatedAt: "2026-03-12",
  },
];

const orlandoKidEntities: DccEntityRegistryNode[] = [
  {
    slug: "icon-park-orlando",
    entityType: "attraction",
    citySlug: "orlando",
    title: "ICON Park Orlando",
    summary: "A family-flexible Orlando attraction cluster that works when the day needs easier walking, multiple kid-friendly stops, and shorter commitment windows.",
    tags: ["kid-friendly", "family", "walkable", "indoor-outdoor"],
    canonicalPath: "/orlando/attractions",
    updatedAt: "2026-03-12",
  },
  {
    slug: "sea-life-orlando-aquarium",
    entityType: "attraction",
    citySlug: "orlando",
    title: "SEA LIFE Orlando Aquarium",
    summary: "One of the clearer Orlando family-attraction answers for indoor time, younger kids, and lower-friction routing away from full park days.",
    tags: ["kid-friendly", "family", "indoor", "aquarium"],
    canonicalPath: "/orlando/attractions",
    updatedAt: "2026-03-12",
  },
  {
    slug: "airboat-adventures-orlando",
    entityType: "attraction",
    citySlug: "orlando",
    title: "Airboat and wildlife adventures",
    summary: "Family-friendly outdoor contrast for Orlando trips that want one nature-and-wildlife block instead of another full queue-heavy day.",
    tags: ["kid-friendly", "family", "outdoor", "wildlife"],
    canonicalPath: "/orlando/tours",
    updatedAt: "2026-03-12",
  },
];

export const ENTITIES_REGISTRY: DccEntityRegistryNode[] = [
  ...vegasHotelEntities,
  ...vegasCasinoEntities,
  ...vegasAttractionEntities,
  ...sportsTeamEntities,
  ...sportsVenueEntities,
  ...vegasPoolEntities,
  ...miamiBeachEntities,
  ...miamiPetEntities,
  ...orlandoKidEntities,
];

export function getEntityRegistryNode(slug: string, entityType?: DccEntityType) {
  return (
    ENTITIES_REGISTRY.find((entity) => entity.slug === slug && (!entityType || entity.entityType === entityType)) ?? null
  );
}

export function getEntityRegistryNodesByCity(citySlug: string) {
  return ENTITIES_REGISTRY.filter((entity) => entity.citySlug === citySlug);
}
