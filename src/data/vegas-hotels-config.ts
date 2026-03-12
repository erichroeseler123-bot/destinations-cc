import type { NodeImageAsset } from "@/src/lib/media-resolver";
import { buildLocalImageAsset } from "@/src/lib/media-resolver";

export type VegasHotelTag =
  | "pet-friendly"
  | "kid-friendly"
  | "luxury"
  | "romantic"
  | "strip"
  | "downtown"
  | "casino"
  | "pool"
  | "spa"
  | "show-adjacent";

export type VegasHotel = {
  slug: string;
  name: string;
  area: "mid-strip" | "south-strip" | "north-strip" | "downtown" | "off-strip";
  tier: "budget" | "upper-midscale" | "luxury";
  tags: VegasHotelTag[];
  image?: NodeImageAsset;
  heroImage?: NodeImageAsset;
  gallery?: NodeImageAsset[];
  summary: string;
  famousFor: string[];
  nearbyHooks: string[];
  premiumStayInfo?: {
    suiteTypes?: Array<"suite" | "villa" | "penthouse" | "presidential-suite">;
    multiBedroom?: boolean;
    privatePool?: boolean;
    butlerService?: boolean;
    privateEntrance?: boolean;
    eventFriendly?: boolean;
    stripView?: boolean;
    familyFriendlyLargeUnit?: boolean;
    notes?: string;
  };
};

function buildSpecificHotelNodeMedia(slug: string, name: string): {
  image?: NodeImageAsset;
  heroImage?: NodeImageAsset;
  gallery?: NodeImageAsset[];
} {
  const overrides: Record<string, { image: string; hero: string; gallery: string[] }> = {
    bellagio: {
      image: "/images/las-vegas/hotels/bellagio-card.svg",
      hero: "/images/las-vegas/hotels/bellagio-hero.svg",
      gallery: [
        "/images/las-vegas/hotels/bellagio-card.svg",
        "/images/las-vegas/hotels/mid-strip-luxury.svg",
      ],
    },
    "caesars-palace": {
      image: "/images/las-vegas/hotels/caesars-card.svg",
      hero: "/images/las-vegas/hotels/caesars-hero.svg",
      gallery: [
        "/images/las-vegas/hotels/caesars-card.svg",
        "/images/las-vegas/hotels/mid-strip-luxury.svg",
      ],
    },
    "mgm-grand": {
      image: "/images/las-vegas/hotels/mgm-grand-card.svg",
      hero: "/images/las-vegas/hotels/mgm-grand-hero.svg",
      gallery: [
        "/images/las-vegas/hotels/mgm-grand-card.svg",
        "/images/las-vegas/hotels/south-strip-family.svg",
      ],
    },
    venetian: {
      image: "/images/las-vegas/hotels/venetian-card.svg",
      hero: "/images/las-vegas/hotels/venetian-hero.svg",
      gallery: [
        "/images/las-vegas/hotels/venetian-card.svg",
        "/images/las-vegas/hotels/mid-strip-luxury.svg",
      ],
    },
    wynn: {
      image: "/images/las-vegas/hotels/wynn-card.svg",
      hero: "/images/las-vegas/hotels/wynn-hero.svg",
      gallery: [
        "/images/las-vegas/hotels/wynn-card.svg",
        "/images/las-vegas/hotels/north-strip-luxury.svg",
      ],
    },
  };

  const override = overrides[slug];
  if (!override) return {};

  return {
    image: buildLocalImageAsset(override.image, `${name} hotel artwork`),
    heroImage: buildLocalImageAsset(override.hero, `${name} hotel guide hero artwork`),
    gallery: override.gallery.map((src, index) =>
      buildLocalImageAsset(src, `${name} gallery image ${index + 1}`),
    ),
  };
}

function buildVegasHotelImage(
  name: string,
  area: VegasHotel["area"],
  tags: VegasHotelTag[],
): NodeImageAsset {
  if (area === "downtown") {
    return buildLocalImageAsset("/images/las-vegas/hotels/downtown-classic.svg", `${name} downtown Las Vegas hotel concept artwork`);
  }

  if (area === "south-strip" && tags.includes("kid-friendly")) {
    return buildLocalImageAsset("/images/las-vegas/hotels/south-strip-family.svg", `${name} South Strip family-friendly hotel concept artwork`);
  }

  if (area === "north-strip" && tags.includes("luxury")) {
    return buildLocalImageAsset("/images/las-vegas/hotels/north-strip-luxury.svg", `${name} north Strip luxury hotel concept artwork`);
  }

  if (area === "mid-strip" && tags.includes("luxury")) {
    return buildLocalImageAsset("/images/las-vegas/hotels/mid-strip-luxury.svg", `${name} mid-Strip luxury hotel concept artwork`);
  }

  if (area === "mid-strip") {
    return buildLocalImageAsset("/images/las-vegas/hotels/mid-strip-social.svg", `${name} center Strip hotel concept artwork`);
  }

  return buildLocalImageAsset("/images/las-vegas/hotels/off-strip-resort.svg", `${name} Las Vegas resort hotel concept artwork`);
}

const VEGAS_HOTELS_BASE: VegasHotel[] = [
  {
    slug: "bellagio",
    name: "Bellagio",
    area: "mid-strip",
    tier: "luxury",
    tags: ["luxury", "romantic", "strip", "casino", "pool", "spa", "show-adjacent"],
    summary: "Classic flagship resort for fountain-driven Vegas, higher-end dining, and premium Strip positioning.",
    famousFor: ["Bellagio Fountains", "Conservatory", "O by Cirque du Soleil"],
    nearbyHooks: ["Mid-Strip walkability", "show nights", "romantic Vegas"],
    premiumStayInfo: {
      suiteTypes: ["suite", "penthouse", "villa"],
      multiBedroom: true,
      butlerService: true,
      privateEntrance: true,
      stripView: true,
      eventFriendly: true,
      notes: "One of the clearest Vegas premium-stay anchors for couples, milestone trips, and buyers chasing iconic central-Strip views.",
    },
  },
  {
    slug: "caesars-palace",
    name: "Caesars Palace",
    area: "mid-strip",
    tier: "luxury",
    tags: ["luxury", "strip", "casino", "pool", "spa", "show-adjacent"],
    summary: "Iconic Roman-theme anchor for residencies, sportsbook energy, and center-Strip access.",
    famousFor: ["The Colosseum", "Forum Shops", "sportsbook and restaurant density"],
    nearbyHooks: ["shows", "sportsbook buyers", "restaurant-heavy trips"],
    premiumStayInfo: {
      suiteTypes: ["suite", "penthouse", "villa", "presidential-suite"],
      multiBedroom: true,
      butlerService: true,
      privateEntrance: true,
      stripView: true,
      eventFriendly: true,
      notes: "Strong premium-room candidate for group trips, VIP-style stays, and central Strip routing tied to restaurants and residencies.",
    },
  },
  {
    slug: "mgm-grand",
    name: "MGM Grand",
    area: "south-strip",
    tier: "upper-midscale",
    tags: ["strip", "casino", "pool", "kid-friendly", "show-adjacent"],
    summary: "Large-scale South Strip base for entertainment-first trips with show, sports, and nightlife pull.",
    famousFor: ["David Copperfield", "MGM Grand Garden Arena", "Topgolf adjacency"],
    nearbyHooks: ["South Strip", "event nights", "sports crossover"],
    premiumStayInfo: {
      suiteTypes: ["suite", "penthouse"],
      multiBedroom: true,
      eventFriendly: true,
      stripView: true,
      notes: "Useful premium option when the buyer wants event-night access and larger entertaining space without only shopping north-Strip luxury.",
    },
  },
  {
    slug: "venetian",
    name: "The Venetian Resort",
    area: "mid-strip",
    tier: "luxury",
    tags: ["luxury", "romantic", "strip", "casino", "pool", "spa", "show-adjacent"],
    summary: "Suite-heavy luxury base that fits longer Strip stays, upscale dining, and show nights.",
    famousFor: ["Grand Canal Shoppes", "gondolas", "Sphere adjacency"],
    nearbyHooks: ["Sphere", "luxury couples trips", "mid-Strip access"],
    premiumStayInfo: {
      suiteTypes: ["suite", "penthouse", "presidential-suite"],
      multiBedroom: true,
      butlerService: true,
      privateEntrance: true,
      stripView: true,
      notes: "One of the most natural suite-first Vegas anchors because larger room categories are part of the Venetian identity, especially for groups and celebration stays.",
    },
  },
  {
    slug: "wynn",
    name: "Wynn Las Vegas",
    area: "north-strip",
    tier: "luxury",
    tags: ["luxury", "romantic", "strip", "casino", "pool", "spa", "show-adjacent"],
    summary: "High-end resort for luxury buyers who want cleaner aesthetics, restaurants, and club access.",
    famousFor: ["Lake of Dreams", "Encore Beach Club adjacency", "high-limit feel"],
    nearbyHooks: ["luxury Vegas", "nightlife", "north Strip"],
    premiumStayInfo: {
      suiteTypes: ["suite", "penthouse", "villa", "presidential-suite"],
      multiBedroom: true,
      butlerService: true,
      privateEntrance: true,
      stripView: true,
      eventFriendly: true,
      notes: "High-end premium-stay anchor for north-Strip buyers who care about privacy, polish, and nightlife-adjacent luxury.",
    },
  },
  {
    slug: "encore",
    name: "Encore",
    area: "north-strip",
    tier: "luxury",
    tags: ["luxury", "romantic", "strip", "casino", "pool", "spa", "show-adjacent"],
    summary: "Encore functions as a high-end nightlife and luxury stay node inside the Wynn cluster.",
    famousFor: ["Encore Theater", "club access", "premium service"],
    nearbyHooks: ["luxury stays", "nightlife buyers", "show nights"],
    premiumStayInfo: {
      suiteTypes: ["suite", "penthouse", "villa"],
      multiBedroom: true,
      butlerService: true,
      privateEntrance: true,
      stripView: true,
      eventFriendly: true,
      notes: "A strong choice for buyers who want premium room categories with easier nightlife pairing than many calmer luxury resorts.",
    },
  },
  {
    slug: "cosmopolitan",
    name: "The Cosmopolitan of Las Vegas",
    area: "mid-strip",
    tier: "luxury",
    tags: ["luxury", "romantic", "strip", "casino", "pool", "show-adjacent"],
    summary: "Style-forward resort for nightlife-heavy, dining-heavy, and couples-led Vegas trips.",
    famousFor: ["Chandelier Bar", "balcony rooms", "Marquee nightlife"],
    nearbyHooks: ["romantic Vegas", "nightlife", "mid-Strip dining"],
    premiumStayInfo: {
      suiteTypes: ["suite", "penthouse"],
      multiBedroom: true,
      stripView: true,
      eventFriendly: true,
      notes: "Strong for style-led premium stays, balcony/view buyers, and groups that want luxury without a purely formal resort tone.",
    },
  },
  {
    slug: "aria",
    name: "Aria",
    area: "mid-strip",
    tier: "luxury",
    tags: ["luxury", "strip", "casino", "pool", "spa", "show-adjacent"],
    summary: "Modern luxury base for visitors who want upscale dining, central access, and cleaner design language.",
    famousFor: ["Crystals adjacency", "Jewel nightlife", "CityCenter location"],
    nearbyHooks: ["luxury stays", "mid-Strip", "dining-led trips"],
    premiumStayInfo: {
      suiteTypes: ["suite", "penthouse"],
      multiBedroom: true,
      butlerService: true,
      stripView: true,
      notes: "A useful penthouse-style and suite-style anchor for modern-luxury buyers who care more about polished design than old-school Vegas spectacle.",
    },
  },
  {
    slug: "vdara",
    name: "Vdara",
    area: "mid-strip",
    tier: "luxury",
    tags: ["luxury", "pet-friendly", "romantic", "strip", "spa"],
    summary: "Non-casino luxury option for calmer Vegas stays with easy access to the Strip without full casino intensity.",
    famousFor: ["non-casino feel", "suite layout", "CityCenter access"],
    nearbyHooks: ["pet-friendly luxury", "spa stays", "quieter Vegas"],
    premiumStayInfo: {
      suiteTypes: ["suite", "villa"],
      multiBedroom: true,
      privateEntrance: true,
      familyFriendlyLargeUnit: true,
      notes: "Useful premium-room node when the trip needs larger units, calmer circulation, or a less casino-heavy luxury base.",
    },
  },
  {
    slug: "mandalay-bay",
    name: "Mandalay Bay",
    area: "south-strip",
    tier: "upper-midscale",
    tags: ["strip", "casino", "pool", "kid-friendly", "show-adjacent"],
    summary: "South Strip resort with stronger family and event crossover than many nightlife-only properties.",
    famousFor: ["beach pool complex", "Shark Reef", "Michelob ULTRA Arena"],
    nearbyHooks: ["family Vegas", "event nights", "south Strip"],
  },
  {
    slug: "luxor",
    name: "Luxor",
    area: "south-strip",
    tier: "budget",
    tags: ["strip", "casino", "kid-friendly", "show-adjacent"],
    summary: "Theme-forward budget-friendly base for buyers who want recognizable Vegas with lighter spend.",
    famousFor: ["pyramid silhouette", "Carrot Top", "south Strip value"],
    nearbyHooks: ["budget Vegas", "family-light trips", "south Strip"],
  },
  {
    slug: "excalibur",
    name: "Excalibur",
    area: "south-strip",
    tier: "budget",
    tags: ["strip", "casino", "kid-friendly"],
    summary: "Castle-theme value property that works for cheaper family-led Vegas routing.",
    famousFor: ["castle theme", "lower price point", "family positioning"],
    nearbyHooks: ["kid-friendly Vegas", "budget stays", "south Strip"],
  },
  {
    slug: "new-york-new-york",
    name: "New York-New York",
    area: "south-strip",
    tier: "upper-midscale",
    tags: ["strip", "casino", "kid-friendly", "show-adjacent"],
    summary: "Themed South Strip resort that works well for first-time visitors wanting accessible attractions and easier fun-first planning.",
    famousFor: ["roller coaster", "Hershey’s store", "south Strip positioning"],
    nearbyHooks: ["family attractions", "south Strip", "first-time Vegas"],
  },
  {
    slug: "park-mgm",
    name: "Park MGM",
    area: "mid-strip",
    tier: "upper-midscale",
    tags: ["pet-friendly", "strip", "casino", "show-adjacent"],
    summary: "Cleaner, calmer Strip hotel with strong dining and event access without the loudest Vegas energy.",
    famousFor: ["Eataly", "smoke-free positioning", "event access"],
    nearbyHooks: ["pet-friendly Vegas", "food-led stays", "shows"],
  },
  {
    slug: "paris-las-vegas",
    name: "Paris Las Vegas",
    area: "mid-strip",
    tier: "upper-midscale",
    tags: ["romantic", "strip", "casino", "show-adjacent"],
    summary: "Reliable center-Strip base for romantic and first-time Vegas stays with a recognizable themed anchor.",
    famousFor: ["Eiffel Tower Viewing Deck", "center Strip location", "theme appeal"],
    nearbyHooks: ["romantic Vegas", "mid-Strip access", "observation attractions"],
  },
  {
    slug: "planet-hollywood",
    name: "Planet Hollywood",
    area: "mid-strip",
    tier: "upper-midscale",
    tags: ["strip", "casino", "show-adjacent"],
    summary: "Entertainment-led center-Strip property that fits show and nightlife buyers better than quiet luxury buyers.",
    famousFor: ["entertainment identity", "Miracle Mile", "show access"],
    nearbyHooks: ["shows", "mid-Strip", "group trips"],
  },
  {
    slug: "resorts-world",
    name: "Resorts World",
    area: "north-strip",
    tier: "luxury",
    tags: ["luxury", "strip", "casino", "pool", "show-adjacent"],
    summary: "Newer north Strip resort with modern rooms and strong residency and nightlife crossover.",
    famousFor: ["Resorts World Theatre", "modern resort build", "Zouk nightlife"],
    nearbyHooks: ["north Strip", "newer luxury", "show buyers"],
  },
  {
    slug: "fontainebleau",
    name: "Fontainebleau Las Vegas",
    area: "north-strip",
    tier: "luxury",
    tags: ["luxury", "strip", "casino", "pool", "spa", "show-adjacent"],
    summary: "Ultra-luxury north Strip base for buyers who want newer hardware, premium restaurants, and nightlife pull.",
    famousFor: ["new ultra-luxury", "LIV nightlife", "north Strip momentum"],
    nearbyHooks: ["luxury Vegas", "north Strip", "nightlife"],
  },
  {
    slug: "treasure-island",
    name: "Treasure Island",
    area: "mid-strip",
    tier: "budget",
    tags: ["strip", "casino", "kid-friendly", "show-adjacent"],
    summary: "Value-leaning Strip hotel that still gives decent central access and classic-Vegas familiarity.",
    famousFor: ["Mystere adjacency", "central location", "value positioning"],
    nearbyHooks: ["value Strip stays", "family-light trips", "mid-Strip"],
  },
  {
    slug: "circus-circus",
    name: "Circus Circus",
    area: "north-strip",
    tier: "budget",
    tags: ["strip", "casino", "kid-friendly"],
    summary: "One of the clearest family and budget nodes in the Vegas hotel mesh.",
    famousFor: ["Adventuredome", "family budget appeal", "classic Vegas weirdness"],
    nearbyHooks: ["kid-friendly Vegas", "budget trips", "north Strip"],
  },
  {
    slug: "flamingo",
    name: "Flamingo",
    area: "mid-strip",
    tier: "budget",
    tags: ["strip", "casino", "pool", "show-adjacent"],
    summary: "Central Strip value property that works for nightlife and location-first buyers.",
    famousFor: ["classic Vegas name", "mid-Strip value", "showroom proximity"],
    nearbyHooks: ["budget Strip", "nightlife", "mid-Strip access"],
  },
  {
    slug: "harrahs",
    name: "Harrah's Las Vegas",
    area: "mid-strip",
    tier: "budget",
    tags: ["strip", "casino", "show-adjacent"],
    summary: "Practical center-Strip base for location-first buyers who care more about access than luxury.",
    famousFor: ["mid-Strip position", "value casino stay", "easy walkability"],
    nearbyHooks: ["budget Vegas", "shows", "Strip walkability"],
  },
  {
    slug: "linq-hotel",
    name: "The LINQ Hotel + Experience",
    area: "mid-strip",
    tier: "upper-midscale",
    tags: ["strip", "casino", "show-adjacent"],
    summary: "A good mid-Strip social base for younger groups, observation-wheel traffic, and shorter Vegas stays.",
    famousFor: ["High Roller adjacency", "promenade energy", "social-trip fit"],
    nearbyHooks: ["group trips", "mid-Strip attractions", "nightlife"],
  },
  {
    slug: "sahara",
    name: "Sahara Las Vegas",
    area: "north-strip",
    tier: "upper-midscale",
    tags: ["strip", "casino", "show-adjacent"],
    summary: "North Strip value-to-midscale node that fits buyers wanting a lighter price point without going full budget.",
    famousFor: ["north end positioning", "The Theater", "less crowded feel"],
    nearbyHooks: ["north Strip", "show buyers", "value-conscious stays"],
  },
  {
    slug: "strat-hotel",
    name: "The STRAT Hotel, Casino & Tower",
    area: "north-strip",
    tier: "budget",
    tags: ["strip", "casino", "kid-friendly"],
    summary: "Observation-led hotel node that fits first-time and budget buyers who want a landmark built into the stay.",
    famousFor: ["STRAT Tower", "observation thrills", "north Strip value"],
    nearbyHooks: ["observation attractions", "budget Vegas", "north Strip"],
  },
  {
    slug: "golden-nugget",
    name: "Golden Nugget",
    area: "downtown",
    tier: "upper-midscale",
    tags: ["downtown", "casino", "pool", "show-adjacent"],
    summary: "The clearest premium-downtown hotel node for Fremont-led trips.",
    famousFor: ["shark tank pool", "downtown icon", "Fremont access"],
    nearbyHooks: ["downtown Vegas", "Fremont Street", "old Vegas"],
  },
  {
    slug: "plaza",
    name: "Plaza Hotel & Casino",
    area: "downtown",
    tier: "budget",
    tags: ["downtown", "casino"],
    summary: "Classic downtown base for cheaper Fremont trips and old-Vegas positioning.",
    famousFor: ["Fremont edge", "downtown value", "old Vegas context"],
    nearbyHooks: ["downtown", "Fremont Street", "budget Vegas"],
  },
  {
    slug: "downtown-grand",
    name: "Downtown Grand",
    area: "downtown",
    tier: "upper-midscale",
    tags: ["downtown", "pool"],
    summary: "Less casino-heavy downtown option for buyers who want Fremont access without making gambling the whole trip.",
    famousFor: ["downtown location", "less intense casino feel", "value-midscale fit"],
    nearbyHooks: ["downtown stays", "Fremont", "quieter alternative"],
  },
];

export const VEGAS_HOTELS_CONFIG: VegasHotel[] = VEGAS_HOTELS_BASE.map((hotel) => {
  const media = buildSpecificHotelNodeMedia(hotel.slug, hotel.name);
  return {
    ...hotel,
    image: media.image || buildVegasHotelImage(hotel.name, hotel.area, hotel.tags),
    heroImage: media.heroImage,
    gallery: media.gallery,
  };
});

export function getVegasHotelsByTag(tag: VegasHotelTag) {
  return VEGAS_HOTELS_CONFIG.filter((hotel) => hotel.tags.includes(tag));
}

export function getVegasHotelBySlug(slug: string) {
  return VEGAS_HOTELS_CONFIG.find((hotel) => hotel.slug === slug) || null;
}

export function getVegasHotelsByPremiumStayType(type: "suite" | "villa" | "penthouse" | "presidential-suite") {
  return VEGAS_HOTELS_CONFIG.filter((hotel) => hotel.premiumStayInfo?.suiteTypes?.includes(type));
}
