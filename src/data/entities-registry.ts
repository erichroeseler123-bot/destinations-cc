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

export type DccAccessibilityInfo = {
  wheelchairAccessible?: boolean;
  accessibleEntrance?: boolean;
  accessibleRestroom?: boolean;
  accessibleParking?: boolean;
  hearingAssistance?: boolean;
  visualAssistance?: boolean;
  brailleAvailable?: boolean;
  serviceAnimalsAllowed?: boolean;
  accessibilitySummary?: string;
};

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
  accessibilityInfo?: DccAccessibilityInfo;
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
  accessibilityInfo:
    hotel.slug === "bellagio" || hotel.slug === "vdara" || hotel.slug === "park-mgm"
      ? {
          wheelchairAccessible: true,
          accessibleEntrance: true,
          accessibleRestroom: true,
          accessibleParking: true,
          serviceAnimalsAllowed: true,
          accessibilitySummary: "Accessible entrance routes, guest-room access, and lower-friction resort movement make this one of the clearer Vegas hotel accessibility anchors.",
        }
      : undefined,
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
  accessibilityInfo:
    attraction.slug === "sphere-las-vegas" || attraction.slug === "fountains-of-bellagio" || attraction.slug === "adventuredome"
      ? {
          wheelchairAccessible: true,
          accessibleEntrance: true,
          accessibleRestroom: true,
          hearingAssistance: attraction.slug === "sphere-las-vegas",
          serviceAnimalsAllowed: true,
          accessibilitySummary: "Useful accessibility anchor for Vegas visitors who need clearer entrance, restroom, and on-site movement expectations before committing to the attraction.",
        }
      : undefined,
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
  accessibilityInfo:
    pool.slug === "mandalay-bay-pools"
      ? {
          wheelchairAccessible: true,
          accessibleEntrance: true,
          accessibleRestroom: true,
          accessibilitySummary: "One of the clearer Vegas pool anchors for mobility-conscious planning because the access question can be evaluated before the pool-day decision.",
        }
      : undefined,
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
  accessibilityInfo:
    beach.slug === "north-beach" || beach.slug === "hobie-beach"
      ? {
          wheelchairAccessible: true,
          accessibleParking: true,
          serviceAnimalsAllowed: true,
          accessibilitySummary: "A stronger Miami accessibility beach candidate when easier parking, calmer routing, or simpler shoreline access matters more than South Beach intensity.",
        }
      : undefined,
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

const miamiHotelEntities: DccEntityRegistryNode[] = [
  {
    slug: "loews-miami-beach",
    entityType: "hotel",
    citySlug: "miami",
    districtSlug: "south-beach",
    title: "Loews Miami Beach Hotel",
    summary:
      "A South Beach hotel node that fits travelers who want walkable beach access, easier family routing, and quick movement between the sand, Lincoln Road, and central Miami Beach dining.",
    tags: ["hotel", "south-beach", "family", "walkable", "beachfront", "pet-friendly"],
    accessibilityInfo: {
      wheelchairAccessible: true,
      accessibleEntrance: true,
      accessibleRestroom: true,
      accessibleParking: true,
      serviceAnimalsAllowed: true,
      accessibilitySummary: "Useful Miami Beach accessibility stay anchor because it pairs beach access with a more straightforward full-service resort layout.",
    },
    canonicalPath: "/hotel/loews-miami-beach",
    updatedAt: "2026-03-12",
  },
  {
    slug: "1-hotel-south-beach",
    entityType: "hotel",
    citySlug: "miami",
    districtSlug: "south-beach",
    title: "1 Hotel South Beach",
    summary:
      "A premium South Beach base for buyers who want direct sand access, strong pool identity, and a more design-led beach stay without losing nightlife reach.",
    tags: ["hotel", "south-beach", "luxury", "beachfront", "pool", "pet-friendly"],
    accessibilityInfo: {
      wheelchairAccessible: true,
      accessibleEntrance: true,
      accessibleRestroom: true,
      serviceAnimalsAllowed: true,
      accessibilitySummary: "A premium South Beach accessibility option when beach access and resort amenities matter more than the quietest routing.",
    },
    canonicalPath: "/hotel/1-hotel-south-beach",
    updatedAt: "2026-03-12",
  },
  {
    slug: "fontainebleau-miami-beach",
    entityType: "hotel",
    citySlug: "miami",
    districtSlug: "mid-beach",
    title: "Fontainebleau Miami Beach",
    summary:
      "A larger Miami Beach resort node for travelers who want a full resort campus, bigger pool energy, and easier split routing between beach time and nightlife.",
    tags: ["hotel", "mid-beach", "resort", "pool", "nightlife", "luxury"],
    canonicalPath: "/hotel/fontainebleau-miami-beach",
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

const orlandoHotelEntities: DccEntityRegistryNode[] = [
  {
    slug: "cabana-bay-beach-resort",
    entityType: "hotel",
    citySlug: "orlando",
    title: "Universal Cabana Bay Beach Resort",
    summary:
      "A kid-friendly Orlando hotel node for families who want easier theme-park shuttles, big pool energy, and a less formal resort feel.",
    tags: ["hotel", "kid-friendly", "family", "pool", "theme-park", "value"],
    accessibilityInfo: {
      wheelchairAccessible: true,
      accessibleEntrance: true,
      accessibleRestroom: true,
      accessibleParking: true,
      serviceAnimalsAllowed: true,
      accessibilitySummary: "A strong family accessibility hotel anchor because resort movement is easier to understand before locking in the park plan.",
    },
    canonicalPath: "/hotel/cabana-bay-beach-resort",
    updatedAt: "2026-03-12",
  },
  {
    slug: "signia-bonnet-creek",
    entityType: "hotel",
    citySlug: "orlando",
    title: "Signia by Hilton Orlando Bonnet Creek",
    summary:
      "A family-oriented Orlando resort node that works well for buyers who want a calmer full-service base, pool time, and easier routing into Disney-area days.",
    tags: ["hotel", "kid-friendly", "family", "resort", "pool", "bonnet-creek"],
    accessibilityInfo: {
      wheelchairAccessible: true,
      accessibleEntrance: true,
      accessibleRestroom: true,
      accessibleParking: true,
      serviceAnimalsAllowed: true,
      accessibilitySummary: "A calmer Orlando resort choice for accessibility-first families who want easier routing between hotel downtime and Disney-area movement.",
    },
    canonicalPath: "/hotel/signia-bonnet-creek",
    updatedAt: "2026-03-12",
  },
  {
    slug: "waldorf-astoria-orlando",
    entityType: "hotel",
    citySlug: "orlando",
    title: "Waldorf Astoria Orlando",
    summary:
      "A premium Orlando family stay node for travelers who want a quieter luxury base, stronger dining, and easier split routing between resort time and park days.",
    tags: ["hotel", "kid-friendly", "luxury", "family", "bonnet-creek", "resort"],
    canonicalPath: "/hotel/waldorf-astoria-orlando",
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
  ...miamiHotelEntities,
  ...orlandoKidEntities,
  ...orlandoHotelEntities,
];

export function getEntityRegistryNode(slug: string, entityType?: DccEntityType) {
  return (
    ENTITIES_REGISTRY.find((entity) => entity.slug === slug && (!entityType || entity.entityType === entityType)) ?? null
  );
}

export function getEntityRegistryNodesByCity(citySlug: string) {
  return ENTITIES_REGISTRY.filter((entity) => entity.citySlug === citySlug);
}

export function getEntityRegistryNodesByCityAndType(citySlug: string, entityType: DccEntityType) {
  return ENTITIES_REGISTRY.filter((entity) => entity.citySlug === citySlug && entity.entityType === entityType);
}
