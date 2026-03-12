import type { NodeImageAsset } from "@/src/lib/media-resolver";
import { buildLocalImageAsset } from "@/src/lib/media-resolver";

export type VegasAttractionTag =
  | "strip"
  | "downtown"
  | "kid-friendly"
  | "nightlife"
  | "immersive"
  | "outdoor"
  | "day-trip"
  | "romantic";

export type VegasAttraction = {
  slug: string;
  name: string;
  district: "las-vegas-strip" | "fremont-street" | "las-vegas-arts-district" | "summerlin" | "regional";
  tags: VegasAttractionTag[];
  image?: NodeImageAsset;
  summary: string;
  primaryHref: string;
  nearbyLinks: Array<{ href: string; label: string }>;
};

function buildVegasAttractionImage(
  slug: string,
  name: string,
  district: VegasAttraction["district"],
  tags: VegasAttractionTag[],
): NodeImageAsset {
  const specific: Record<string, string> = {
    "fountains-of-bellagio": "/images/las-vegas/attractions/fountains-of-bellagio.svg",
    "sphere-las-vegas": "/images/las-vegas/attractions/sphere-las-vegas.svg",
    area15: "/images/las-vegas/attractions/area15.svg",
    "fremont-street-experience": "/images/las-vegas/attractions/fremont-street-experience.svg",
    adventuredome: "/images/las-vegas/attractions/adventuredome.svg",
  };
  if (specific[slug]) {
    return buildLocalImageAsset(specific[slug], `${name} attraction artwork`);
  }

  if (district === "regional" && tags.includes("day-trip")) {
    return buildLocalImageAsset("/images/las-vegas/attractions/day-trip.svg", `${name} Las Vegas day-trip attraction concept artwork`);
  }

  if (district === "summerlin" || tags.includes("outdoor")) {
    return buildLocalImageAsset("/images/las-vegas/attractions/outdoor.svg", `${name} Las Vegas outdoor attraction concept artwork`);
  }

  if (district === "fremont-street") {
    return buildLocalImageAsset("/images/las-vegas/attractions/downtown.svg", `${name} downtown Las Vegas attraction concept artwork`);
  }

  if (district === "las-vegas-arts-district" || tags.includes("immersive")) {
    return buildLocalImageAsset("/images/las-vegas/attractions/immersive.svg", `${name} immersive Las Vegas attraction concept artwork`);
  }

  return buildLocalImageAsset("/images/las-vegas/attractions/strip-landmark.svg", `${name} Las Vegas Strip attraction concept artwork`);
}

const VEGAS_ATTRACTIONS_BASE: VegasAttraction[] = [
  {
    slug: "fountains-of-bellagio",
    name: "Fountains of Bellagio",
    district: "las-vegas-strip",
    tags: ["strip", "romantic"],
    summary: "A core Strip landmark that anchors Bellagio, central-Strip walking, and romantic first-night Vegas routing.",
    primaryHref: "/hotel/bellagio",
    nearbyLinks: [
      { href: "/las-vegas-strip", label: "Las Vegas Strip" },
      { href: "/las-vegas/hotels", label: "Las Vegas hotels" },
      { href: "/things-to-do-on-the-strip", label: "Things to do on the Strip" },
    ],
  },
  {
    slug: "sphere-las-vegas",
    name: "Sphere at The Venetian Resort",
    district: "las-vegas-strip",
    tags: ["strip", "immersive", "nightlife"],
    summary: "One of the strongest Vegas entertainment-attraction nodes for immersive nights, venue adjacency, and hotel-nearby routing.",
    primaryHref: "/las-vegas/shows",
    nearbyLinks: [
      { href: "/las-vegas-strip", label: "Las Vegas Strip" },
      { href: "/hotel/venetian", label: "The Venetian hotel node" },
      { href: "/las-vegas/things-to-do", label: "Las Vegas things to do" },
    ],
  },
  {
    slug: "high-roller",
    name: "High Roller Observation Wheel",
    district: "las-vegas-strip",
    tags: ["strip", "romantic", "kid-friendly"],
    summary: "A high-intent Strip attraction that works for couples, first-time visitors, and light-night sightseeing stacks.",
    primaryHref: "/las-vegas/things-to-do",
    nearbyLinks: [
      { href: "/las-vegas-strip", label: "Las Vegas Strip" },
      { href: "/hotel/linq-hotel", label: "The LINQ hotel node" },
      { href: "/things-to-do-on-the-strip", label: "Things to do on the Strip" },
    ],
  },
  {
    slug: "area15",
    name: "AREA15 and Omega Mart",
    district: "las-vegas-arts-district",
    tags: ["immersive", "nightlife", "kid-friendly"],
    summary: "A strong immersive-attractions cluster that fits off-Strip entertainment routing, group trips, and unusual Vegas planning.",
    primaryHref: "/las-vegas/things-to-do",
    nearbyLinks: [
      { href: "/las-vegas-arts-district", label: "Las Vegas Arts District" },
      { href: "/vegas", label: "Vegas hub" },
      { href: "/kid-friendly/las-vegas", label: "Kid-friendly Las Vegas" },
    ],
  },
  {
    slug: "fremont-street-experience",
    name: "Fremont Street Experience",
    district: "fremont-street",
    tags: ["downtown", "nightlife"],
    summary: "The core downtown attraction node for canopy spectacle, classic-casino contrast, and older Vegas identity.",
    primaryHref: "/fremont-street",
    nearbyLinks: [
      { href: "/fremont-street", label: "Fremont Street" },
      { href: "/las-vegas/things-to-do", label: "Las Vegas things to do" },
      { href: "/vegas#fremont", label: "Vegas downtown section" },
    ],
  },
  {
    slug: "adventuredome",
    name: "Adventuredome",
    district: "las-vegas-strip",
    tags: ["kid-friendly", "strip"],
    summary: "A family-heavy indoor attraction that matters for kid-friendly and weather-proof Vegas planning.",
    primaryHref: "/kid-friendly/las-vegas",
    nearbyLinks: [
      { href: "/kid-friendly/las-vegas", label: "Kid-friendly Las Vegas" },
      { href: "/hotel/circus-circus", label: "Circus Circus hotel node" },
      { href: "/las-vegas/things-to-do", label: "Las Vegas things to do" },
    ],
  },
  {
    slug: "neon-museum",
    name: "The Neon Museum",
    district: "fremont-street",
    tags: ["downtown", "romantic"],
    summary: "A strong downtown-adjacent history and visual-identity node that pairs well with Fremont routing.",
    primaryHref: "/fremont-street",
    nearbyLinks: [
      { href: "/fremont-street", label: "Fremont Street" },
      { href: "/vegas#history", label: "Vegas history section" },
      { href: "/las-vegas/things-to-do", label: "Las Vegas things to do" },
    ],
  },
  {
    slug: "grand-canyon",
    name: "Grand Canyon",
    district: "regional",
    tags: ["day-trip", "outdoor", "romantic"],
    summary: "The largest Vegas day-trip attraction cluster and one of the strongest evergreen conversion nodes in the entire city graph.",
    primaryHref: "/grand-canyon",
    nearbyLinks: [
      { href: "/las-vegas/day-trips", label: "Las Vegas day trips" },
      { href: "/helicopter-tours", label: "Helicopter tours" },
      { href: "/vegas", label: "Vegas hub" },
    ],
  },
  {
    slug: "hoover-dam",
    name: "Hoover Dam",
    district: "regional",
    tags: ["day-trip", "outdoor"],
    summary: "A short-transfer engineering and sightseeing anchor that fits half-day or combo Vegas routing.",
    primaryHref: "/hoover-dam",
    nearbyLinks: [
      { href: "/las-vegas/day-trips", label: "Las Vegas day trips" },
      { href: "/lake-mead", label: "Lake Mead" },
      { href: "/vegas", label: "Vegas hub" },
    ],
  },
  {
    slug: "red-rock-canyon",
    name: "Red Rock Canyon",
    district: "summerlin",
    tags: ["outdoor", "day-trip"],
    summary: "The cleanest local outdoor pillar for scenic drives, guided hikes, and west-Vegas desert planning.",
    primaryHref: "/red-rock-canyon",
    nearbyLinks: [
      { href: "/summerlin", label: "Summerlin" },
      { href: "/red-rock-canyon", label: "Red Rock Canyon" },
      { href: "/las-vegas/day-trips", label: "Las Vegas day trips" },
    ],
  },
  {
    slug: "valley-of-fire",
    name: "Valley of Fire",
    district: "regional",
    tags: ["outdoor", "day-trip"],
    summary: "One of the strongest scenic desert nodes for first-time day-trip buyers who want a shorter but visually dramatic route from Vegas.",
    primaryHref: "/valley-of-fire",
    nearbyLinks: [
      { href: "/las-vegas/day-trips", label: "Las Vegas day trips" },
      { href: "/vegas", label: "Vegas hub" },
      { href: "/helicopter-tours", label: "Helicopter tours" },
    ],
  },
];

export const VEGAS_ATTRACTIONS_CONFIG: VegasAttraction[] = VEGAS_ATTRACTIONS_BASE.map((attraction) => ({
  ...attraction,
  image: buildVegasAttractionImage(attraction.slug, attraction.name, attraction.district, attraction.tags),
}));

export function getVegasAttractionsByTag(tag: VegasAttractionTag) {
  return VEGAS_ATTRACTIONS_CONFIG.filter((attraction) => attraction.tags.includes(tag));
}
