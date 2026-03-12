export type CityBeachNode = {
  slug: string;
  title: string;
  summary: string;
  tags: Array<"family" | "nightlife" | "surf" | "pet-friendly" | "scenic" | "walkable">;
};

export type CityBeachesConfig = {
  cityKey: string;
  cityName: string;
  heroSummary: string;
  heroImage: { src: string; alt: string };
  gallery: Array<{ src: string; alt: string }>;
  highlights: string[];
  beaches: CityBeachNode[];
  relatedLinks: Array<{ href: string; label: string }>;
  faq: Array<{ q: string; a: string }>;
};

export const CITY_BEACHES_CONFIG: Record<string, CityBeachesConfig> = {
  miami: {
    cityKey: "miami",
    cityName: "Miami",
    heroSummary:
      "Miami beaches are a real destination layer: South Beach, quieter family stretches, scenic sands, nightlife-adjacent waterfronts, and beach-led activity planning.",
    heroImage: {
      src: "/images/miami/beaches/hero.svg",
      alt: "Miami beach skyline and shoreline concept artwork",
    },
    gallery: [
      {
        src: "/images/miami/beaches/south-beach.svg",
        alt: "South Beach inspired shoreline concept artwork",
      },
      {
        src: "/images/miami/beaches/family-shore.svg",
        alt: "Family-friendly Miami beach concept artwork",
      },
      {
        src: "/images/miami/beaches/palm-water.svg",
        alt: "Palm-lined Miami beach concept artwork",
      },
      {
        src: "/images/miami/beaches/biscayne.svg",
        alt: "Biscayne and beach activity concept artwork",
      },
    ],
    highlights: [
      "Beach intent is not the same as general attractions or water-sports intent, so this page should split lounging, family beach time, and nightlife-adjacent sand zones.",
      "Many Miami buyers choose where to stay through the beach surface first, then branch into rentals, boat tours, and nightlife.",
      "Walkability, crowd profile, and nearby activity access matter as much as sand quality for most short Miami trips.",
    ],
    beaches: [
      {
        slug: "south-beach",
        title: "South Beach",
        summary: "The main Miami beach node for iconic shoreline, walkability, nightlife adjacency, and first-time visitor routing.",
        tags: ["nightlife", "walkable", "scenic"],
      },
      {
        slug: "mid-beach",
        title: "Mid-Beach",
        summary: "A cleaner resort-and-beach crossover for travelers who want sand access without the most intense South Beach energy.",
        tags: ["scenic", "walkable"],
      },
      {
        slug: "north-beach",
        title: "North Beach",
        summary: "A calmer local beach layer for quieter stays, longer walks, and less nightlife-first planning.",
        tags: ["family", "scenic"],
      },
      {
        slug: "surfside",
        title: "Surfside",
        summary: "One of the clearer family and calmer-beach choices in the broader Miami beach graph.",
        tags: ["family", "walkable"],
      },
      {
        slug: "haulover-beach",
        title: "Haulover Beach",
        summary: "A distinct beach node with strong local identity and a very different vibe from South Beach routing.",
        tags: ["scenic"],
      },
      {
        slug: "hobie-beach",
        title: "Hobie Beach and Biscayne launch zones",
        summary: "A beach-and-water-activity crossover node that matters for rentals, paddling, and lighter beach-day routing.",
        tags: ["family", "scenic"],
      },
    ],
    relatedLinks: [
      { href: "/miami", label: "Miami hub" },
      { href: "/miami/tours", label: "Miami tours" },
      { href: "/miami/attractions", label: "Miami attractions" },
    ],
    faq: [
      {
        q: "What is the best beach for a first Miami trip?",
        a: "South Beach is usually the default first-trip answer because it combines a recognizable shoreline, walking access, and strong crossover into food, nightlife, and rentals.",
      },
      {
        q: "Are there quieter beaches than South Beach in Miami?",
        a: "Yes. North Beach, Surfside, and some Mid-Beach stretches fit calmer stays and family-led beach planning better than the core South Beach zone.",
      },
      {
        q: "Should I treat beach days and water activities as the same plan?",
        a: "Not always. A lounge-first beach day and a rental-first or boat-first activity day usually work better as separate planning modes.",
      },
    ],
  },
};

export function getCityBeachesConfig(cityKey: string) {
  return CITY_BEACHES_CONFIG[cityKey] || null;
}
