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

export type DccSocialProfile = {
  vibe?: string[];
  bestFor?: string[];
  crowdType?: string[];
  photoMoment?: boolean;
  pregameFriendly?: boolean;
  dateNightFriendly?: boolean;
  groupFriendly?: boolean;
  familyFriendly?: boolean;
  notes?: string;
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
  socialProfile?: DccSocialProfile;
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
    hotel.slug === "bellagio" || hotel.slug === "vdara" || hotel.slug === "park-mgm" || hotel.slug === "caesars-palace"
      ? {
          wheelchairAccessible: true,
          accessibleEntrance: true,
          accessibleRestroom: true,
          accessibleParking: true,
          serviceAnimalsAllowed: true,
          accessibilitySummary: "Accessible entrance routes, guest-room access, and lower-friction resort movement make this one of the clearer Vegas hotel accessibility anchors.",
        }
      : undefined,
  socialProfile:
    hotel.slug === "bellagio"
      ? {
          vibe: ["polished luxury", "central Strip", "fountain-side classic"],
          bestFor: ["couples", "celebration trips", "first-timer luxury", "date night routing"],
          crowdType: ["couples", "luxury travelers", "show-night mix"],
          photoMoment: true,
          dateNightFriendly: true,
          notes: "Best when the trip needs a polished central Strip base with stronger dining and fountain-adjacent evening energy.",
        }
      : hotel.slug === "caesars-palace"
        ? {
            vibe: ["big-resort energy", "central Strip", "show-adjacent"],
            bestFor: ["groups", "birthday weekends", "central-location buyers"],
            crowdType: ["mixed groups", "casino-first travelers", "show-night crowd"],
            pregameFriendly: true,
            groupFriendly: true,
            notes: "Best for travelers who want one central Strip property that can branch into casino time, dinners, nightlife, and shows.",
          }
        : hotel.slug === "wynn"
          ? {
              vibe: ["quiet luxury", "north Strip polish", "high-end nightlife"],
              bestFor: ["couples", "luxury stays", "date-night trips"],
              crowdType: ["luxury travelers", "nightlife-adjacent couples"],
              dateNightFriendly: true,
              photoMoment: true,
              notes: "Stronger for polished luxury and upscale nightlife adjacency than for budget or chaotic group-trip routing.",
            }
          : hotel.slug === "mgm-grand"
            ? {
                vibe: ["high-energy resort", "sports-and-shows base", "big-group scale"],
                bestFor: ["groups", "guys trips", "event weekends"],
                crowdType: ["sports crowd", "groups", "show-night spillover"],
                pregameFriendly: true,
                groupFriendly: true,
                notes: "Best when room count, event access, and big-resort energy matter more than a quiet luxury feel.",
              }
            : hotel.slug === "venetian"
              ? {
                  vibe: ["suite-heavy luxury", "romantic interiors", "restaurant-forward"],
                  bestFor: ["couples", "group luxury", "milestone weekends"],
                  crowdType: ["couples", "upscale groups", "dining-led travelers"],
                  dateNightFriendly: true,
                  groupFriendly: true,
                  photoMoment: true,
                  notes: "A strong fit for larger-room buyers who still want a polished Strip base and better dining density.",
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
  socialProfile:
    casino.slug === "bellagio-casino"
      ? {
          vibe: ["upscale gaming", "fountain-adjacent", "date-night luxury"],
          bestFor: ["couples", "luxury casino hopping", "pre-dinner gaming"],
          crowdType: ["couples", "luxury travelers", "central Strip visitors"],
          dateNightFriendly: true,
          photoMoment: true,
          notes: "Works best when gaming is part of a larger polished Strip evening rather than the whole trip identity.",
        }
      : casino.slug === "caesars-palace-casino"
        ? {
            vibe: ["big classic resort casino", "high-traffic central Strip", "show-night crossover"],
            bestFor: ["groups", "birthday weekends", "first-time Vegas gamblers"],
            crowdType: ["mixed groups", "tourist-heavy", "show-night spillover"],
            pregameFriendly: true,
            groupFriendly: true,
            notes: "One of the clearest group-trip casino anchors because it sits in the middle of so many dinner, show, and nightlife routes.",
          }
        : casino.slug === "mgm-grand-casino"
          ? {
              vibe: ["high-energy sportsbook-adjacent", "event weekend", "late-night volume"],
              bestFor: ["groups", "sports weekends", "guys trips"],
              crowdType: ["sports crowd", "event-night crowd", "large groups"],
              pregameFriendly: true,
              groupFriendly: true,
              notes: "Best when sports, arena adjacency, and larger-group movement matter more than a boutique casino feel.",
            }
          : casino.slug === "venetian-casino"
            ? {
                vibe: ["upscale indoor resort energy", "restaurant-forward", "romantic luxury"],
                bestFor: ["couples", "luxury groups", "dinner-led nights"],
                crowdType: ["couples", "upscale dining crowd", "group celebrators"],
                dateNightFriendly: true,
                groupFriendly: true,
                photoMoment: true,
                notes: "A stronger fit for travelers who want upscale dining and larger-room resort context around casino time.",
              }
            : casino.slug === "wynn-casino"
              ? {
                  vibe: ["quiet luxury gaming", "high-end nightlife adjacency", "polished north Strip"],
                  bestFor: ["couples", "luxury travelers", "date-night gaming"],
                  crowdType: ["luxury travelers", "nightlife-adjacent crowd"],
                  dateNightFriendly: true,
                  photoMoment: true,
                  notes: "Best when the trip wants a more polished north Strip rhythm with upscale nightlife nearby.",
                }
              : undefined,
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
  socialProfile:
    attraction.slug === "sphere-las-vegas"
      ? {
          vibe: ["big-night spectacle", "concert-night surge", "high-photo-value"],
          bestFor: ["groups", "concert trips", "birthday weekends"],
          crowdType: ["concert crowd", "group travelers", "nightlife-adjacent visitors"],
          photoMoment: true,
          pregameFriendly: true,
          groupFriendly: true,
          notes: "Strong when the night is built around one marquee visual anchor and the nearby hotel choice matters as much as the ticket.",
        }
      : attraction.slug === "fountains-of-bellagio"
        ? {
            vibe: ["free classic Vegas", "romantic stop", "high-photo-value"],
            bestFor: ["couples", "first-timers", "date-night walks"],
            crowdType: ["mixed visitors", "couples", "first-time Vegas travelers"],
            photoMoment: true,
            dateNightFriendly: true,
            notes: "Still one of the easiest social/photo moments in Vegas, especially when paired with dinner or nearby casino hopping.",
        }
      : attraction.slug === "area15"
        ? {
            vibe: ["immersive social stop", "group-night flex", "photo-heavy"],
            bestFor: ["groups", "friends trips", "birthday nights"],
            crowdType: ["groups", "night-out crowd", "experience seekers"],
            photoMoment: true,
            groupFriendly: true,
            notes: "Best when the night needs an interactive social anchor rather than a pure luxury or fine-dining plan.",
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

const ENTITY_REGISTRY_BY_SLUG = new Map<string, DccEntityRegistryNode>();
const ENTITY_REGISTRY_BY_TYPE_AND_SLUG = new Map<string, DccEntityRegistryNode>();

for (const entity of ENTITIES_REGISTRY) {
  if (!ENTITY_REGISTRY_BY_SLUG.has(entity.slug)) {
    ENTITY_REGISTRY_BY_SLUG.set(entity.slug, entity);
  }
  ENTITY_REGISTRY_BY_TYPE_AND_SLUG.set(`${entity.entityType}:${entity.slug}`, entity);
}

export function getEntityRegistryNode(slug: string, entityType?: DccEntityType) {
  if (entityType) {
    return ENTITY_REGISTRY_BY_TYPE_AND_SLUG.get(`${entityType}:${slug}`) ?? null;
  }
  return ENTITY_REGISTRY_BY_SLUG.get(slug) ?? null;
}

export function getEntityRegistryNodesByCity(citySlug: string) {
  return ENTITIES_REGISTRY.filter((entity) => entity.citySlug === citySlug);
}

export function getEntityRegistryNodesByCityAndType(citySlug: string, entityType: DccEntityType) {
  return ENTITIES_REGISTRY.filter((entity) => entity.citySlug === citySlug && entity.entityType === entityType);
}

export function getEntityRegistryNodesBySlugs(slugs: string[]) {
  return slugs
    .map((slug) => getEntityRegistryNode(slug))
    .filter((entity): entity is DccEntityRegistryNode => Boolean(entity));
}

export function getEntityRegistryNodesBySlugsAndType(slugs: string[], entityType: DccEntityType) {
  return slugs
    .map((slug) => getEntityRegistryNode(slug, entityType))
    .filter((entity): entity is DccEntityRegistryNode => Boolean(entity));
}
