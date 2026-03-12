export type VegasCasinoTag =
  | "strip"
  | "downtown"
  | "luxury"
  | "classic"
  | "sportsbook"
  | "nightlife"
  | "show-adjacent";

export type VegasCasino = {
  slug: string;
  name: string;
  district: "las-vegas-strip" | "fremont-street" | "summerlin";
  hotelSlug?: string;
  tags: VegasCasinoTag[];
  image?: { src: string; alt: string };
  summary: string;
  anchors: string[];
  nearbyLinks: Array<{ href: string; label: string }>;
};

function buildVegasCasinoImage(
  name: string,
  district: VegasCasino["district"],
  tags: VegasCasinoTag[],
): { src: string; alt: string } {
  if (district === "fremont-street") {
    return {
      src: "/images/las-vegas/casinos/downtown-classic.svg",
      alt: `${name} Fremont Street casino concept artwork`,
    };
  }

  if (district === "summerlin") {
    return {
      src: "/images/las-vegas/casinos/summerlin-resort.svg",
      alt: `${name} Summerlin resort casino concept artwork`,
    };
  }

  if (tags.includes("nightlife")) {
    return {
      src: "/images/las-vegas/casinos/strip-nightlife.svg",
      alt: `${name} Strip nightlife casino concept artwork`,
    };
  }

  return {
    src: "/images/las-vegas/casinos/strip-luxury.svg",
    alt: `${name} luxury Strip casino concept artwork`,
  };
}

const VEGAS_CASINOS_BASE: VegasCasino[] = [
  {
    slug: "bellagio-casino",
    name: "Bellagio Casino",
    district: "las-vegas-strip",
    hotelSlug: "bellagio",
    tags: ["strip", "luxury", "show-adjacent"],
    summary: "Classic flagship Strip casino with fountain-adjacent routing, luxury hotel context, and premium-night positioning.",
    anchors: ["Bellagio hotel node", "Fountains of Bellagio", "mid-Strip show routing"],
    nearbyLinks: [
      { href: "/hotel/bellagio", label: "Bellagio hotel node" },
      { href: "/las-vegas-strip", label: "Las Vegas Strip" },
      { href: "/las-vegas/shows", label: "Las Vegas shows" },
    ],
  },
  {
    slug: "caesars-palace-casino",
    name: "Caesars Palace Casino",
    district: "las-vegas-strip",
    hotelSlug: "caesars-palace",
    tags: ["strip", "luxury", "sportsbook", "show-adjacent"],
    summary: "A center-Strip sportsbook and residency anchor that fits show nights, restaurant-heavy trips, and classic flagship Vegas planning.",
    anchors: ["Caesars Palace hotel node", "The Colosseum", "sportsbook energy"],
    nearbyLinks: [
      { href: "/hotel/caesars-palace", label: "Caesars Palace hotel node" },
      { href: "/las-vegas-strip", label: "Las Vegas Strip" },
      { href: "/sports", label: "Sports hub" },
    ],
  },
  {
    slug: "mgm-grand-casino",
    name: "MGM Grand Casino",
    district: "las-vegas-strip",
    hotelSlug: "mgm-grand",
    tags: ["strip", "nightlife", "show-adjacent"],
    summary: "Large-footprint Strip casino tied to event nights, nightlife, arena crossover, and entertainment-led trips.",
    anchors: ["MGM Grand hotel node", "David Copperfield", "event-night routing"],
    nearbyLinks: [
      { href: "/hotel/mgm-grand", label: "MGM Grand hotel node" },
      { href: "/las-vegas/shows", label: "Las Vegas shows" },
      { href: "/las-vegas-strip", label: "Las Vegas Strip" },
    ],
  },
  {
    slug: "venetian-casino",
    name: "The Venetian Casino",
    district: "las-vegas-strip",
    hotelSlug: "venetian",
    tags: ["strip", "luxury", "nightlife", "show-adjacent"],
    summary: "Luxury Strip casino tied to the Venetian resort cluster, Sphere adjacency, and upscale dining routes.",
    anchors: ["Venetian hotel node", "Sphere adjacency", "luxury-night routing"],
    nearbyLinks: [
      { href: "/hotel/venetian", label: "The Venetian hotel node" },
      { href: "/las-vegas-strip", label: "Las Vegas Strip" },
      { href: "/las-vegas/things-to-do", label: "Las Vegas things to do" },
    ],
  },
  {
    slug: "wynn-casino",
    name: "Wynn Casino",
    district: "las-vegas-strip",
    hotelSlug: "wynn",
    tags: ["strip", "luxury", "nightlife", "show-adjacent"],
    summary: "High-end north Strip casino for luxury buyers and club-heavy trips that still want strong restaurant and show options nearby.",
    anchors: ["Wynn hotel node", "north Strip luxury", "nightlife crossover"],
    nearbyLinks: [
      { href: "/hotel/wynn", label: "Wynn hotel node" },
      { href: "/las-vegas-strip", label: "Las Vegas Strip" },
      { href: "/helicopter-tours", label: "Helicopter tours" },
    ],
  },
  {
    slug: "resorts-world-casino",
    name: "Resorts World Casino",
    district: "las-vegas-strip",
    hotelSlug: "resorts-world",
    tags: ["strip", "luxury", "nightlife", "show-adjacent"],
    summary: "Newer resort-casino node that fits modern luxury, theater buyers, and north Strip nightlife routing.",
    anchors: ["Resorts World hotel node", "theater nights", "new-build luxury"],
    nearbyLinks: [
      { href: "/hotel/resorts-world", label: "Resorts World hotel node" },
      { href: "/las-vegas-strip", label: "Las Vegas Strip" },
      { href: "/las-vegas/shows", label: "Las Vegas shows" },
    ],
  },
  {
    slug: "golden-nugget-casino",
    name: "Golden Nugget Casino",
    district: "fremont-street",
    hotelSlug: "golden-nugget",
    tags: ["downtown", "classic", "show-adjacent"],
    summary: "Strong downtown anchor for classic-casino, Fremont, and lower-cost old-Vegas routing.",
    anchors: ["Golden Nugget hotel node", "Fremont Street", "downtown contrast"],
    nearbyLinks: [
      { href: "/hotel/golden-nugget", label: "Golden Nugget hotel node" },
      { href: "/fremont-street", label: "Fremont Street" },
      { href: "/vegas#fremont", label: "Vegas downtown section" },
    ],
  },
  {
    slug: "circa-casino",
    name: "Circa Resort & Casino",
    district: "fremont-street",
    tags: ["downtown", "sportsbook", "nightlife", "classic"],
    summary: "Downtown sportsbook-led casino node for adult-group trips, game-day energy, and newer Fremont routing.",
    anchors: ["Fremont Street", "sportsbook buyers", "downtown nightlife"],
    nearbyLinks: [
      { href: "/fremont-street", label: "Fremont Street" },
      { href: "/sports", label: "Sports hub" },
      { href: "/vegas", label: "Vegas hub" },
    ],
  },
  {
    slug: "red-rock-casino",
    name: "Red Rock Casino Resort & Spa",
    district: "summerlin",
    tags: ["luxury", "nightlife", "sportsbook"],
    summary: "Summerlin resort-casino node that bridges local dining, shopping, and Red Rock outdoor routing.",
    anchors: ["Summerlin", "Red Rock Canyon access", "off-Strip resort feel"],
    nearbyLinks: [
      { href: "/summerlin", label: "Summerlin" },
      { href: "/red-rock-canyon", label: "Red Rock Canyon" },
      { href: "/vegas", label: "Vegas hub" },
    ],
  },
];

export const VEGAS_CASINOS_CONFIG: VegasCasino[] = VEGAS_CASINOS_BASE.map((casino) => ({
  ...casino,
  image: buildVegasCasinoImage(casino.name, casino.district, casino.tags),
}));

export function getVegasCasinosByTag(tag: VegasCasinoTag) {
  return VEGAS_CASINOS_CONFIG.filter((casino) => casino.tags.includes(tag));
}
