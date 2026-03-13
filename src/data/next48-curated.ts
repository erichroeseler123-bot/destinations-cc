import type { Next48Category, Next48EntityType, Next48SourceName } from "@/lib/dcc/next48/types";

export type Next48CuratedSeedItem = {
  id: string;
  source: Next48SourceName;
  category: Next48Category;
  title: string;
  startsInHours: number;
  venueOrArea: string;
  image: string;
  whyItMatters: string;
  significance: number;
  actionability: number;
  localRelevance: number;
  authorityCta: {
    label: string;
    href: string;
    kind: "internal" | "external";
  };
  executionCta?: {
    label: string;
    href: string;
    kind: "internal" | "external";
  };
};

export type Next48CuratedSeed = {
  entityType: Next48EntityType;
  slug: string;
  items: Next48CuratedSeedItem[];
};

export const NEXT48_CURATED_SEEDS: Next48CuratedSeed[] = [
  {
    entityType: "city",
    slug: "denver",
    items: [
      {
        id: "denver-concert-red-rocks",
        source: "concerts",
        category: "concerts",
        title: "Major headline show at Red Rocks",
        startsInHours: 5,
        venueOrArea: "Red Rocks Amphitheatre",
        image: "/images/authority/venues/red-rocks-amphitheatre/hero.webp",
        whyItMatters: "High-demand night with transfer pressure where route timing decisions matter.",
        significance: 0.95,
        actionability: 0.9,
        localRelevance: 1,
        authorityCta: {
          label: "Open Red Rocks Decision Engine",
          href: "/venues/red-rocks-amphitheatre",
          kind: "internal",
        },
        executionCta: {
          label: "See Denver Tours",
          href: "/tours?city=denver",
          kind: "internal",
        },
      },
      {
        id: "denver-sports-nuggets",
        source: "sports",
        category: "sports",
        title: "NBA home game downtown",
        startsInHours: 27,
        venueOrArea: "Ball Arena",
        image: "/images/authority/cities/denver/section-1.webp",
        whyItMatters: "Downtown movement and post-event demand spikes can reshape evening plans.",
        significance: 0.84,
        actionability: 0.85,
        localRelevance: 0.92,
        authorityCta: {
          label: "Open Denver City Decision Engine",
          href: "/cities/denver",
          kind: "internal",
        },
        executionCta: {
          label: "Open Sports Surface",
          href: "/sports",
          kind: "internal",
        },
      },
      {
        id: "denver-festival-weekend-block",
        source: "festivals",
        category: "festivals",
        title: "Neighborhood festival block",
        startsInHours: 22,
        venueOrArea: "RiNo / Five Points",
        image: "/images/authority/cities/denver/gallery-1.webp",
        whyItMatters: "Street closures and crowd lanes affect route reliability across districts.",
        significance: 0.74,
        actionability: 0.78,
        localRelevance: 0.88,
        authorityCta: {
          label: "Open Denver Planning Layer",
          href: "/cities/denver",
          kind: "internal",
        },
      },
      {
        id: "denver-tour-mountain-window",
        source: "tours",
        category: "tours",
        title: "Morning foothills tour window",
        startsInHours: 15,
        venueOrArea: "Denver to foothills corridor",
        image: "/images/authority/routes/denver-red-rocks/hero.webp",
        whyItMatters: "Useful low-friction block before event-night commitments.",
        significance: 0.7,
        actionability: 0.83,
        localRelevance: 0.87,
        authorityCta: {
          label: "Open Denver to Red Rocks Route",
          href: "/routes/denver-red-rocks",
          kind: "internal",
        },
        executionCta: {
          label: "Browse Tours",
          href: "/tours?city=denver",
          kind: "internal",
        },
      },
      {
        id: "denver-nightlife-late-lane",
        source: "curated",
        category: "nightlife",
        title: "Late-night live-music lane",
        startsInHours: 9,
        venueOrArea: "LoDo",
        image: "/images/authority/cities/denver/gallery-2.webp",
        whyItMatters: "Good fallback lane when post-show transport windows shift.",
        significance: 0.68,
        actionability: 0.72,
        localRelevance: 0.8,
        authorityCta: {
          label: "Open Denver Decision Engine",
          href: "/cities/denver",
          kind: "internal",
        },
      },
    ],
  },
  {
    entityType: "port",
    slug: "juneau",
    items: [
      {
        id: "juneau-tour-glacier-window",
        source: "tours",
        category: "tours",
        title: "Mendenhall-first excursion window",
        startsInHours: 3,
        venueOrArea: "Mendenhall Glacier",
        image: "/images/authority/attractions/mendenhall-glacier/hero.webp",
        whyItMatters: "Best-fit anchor when weather and transfer timing are still stable.",
        significance: 0.93,
        actionability: 0.9,
        localRelevance: 1,
        authorityCta: {
          label: "Open Mendenhall Decision Engine",
          href: "/attractions/mendenhall-glacier",
          kind: "internal",
        },
        executionCta: {
          label: "Browse Shore Excursions",
          href: "/cruises/shore-excursions",
          kind: "internal",
        },
      },
      {
        id: "juneau-festival-waterfront",
        source: "festivals",
        category: "festivals",
        title: "Waterfront market and local maker block",
        startsInHours: 20,
        venueOrArea: "Juneau waterfront",
        image: "/images/authority/ports/juneau/section-1.webp",
        whyItMatters: "Lower-transfer fallback if marine conditions change itinerary quality.",
        significance: 0.66,
        actionability: 0.8,
        localRelevance: 0.9,
        authorityCta: {
          label: "Open Juneau Port Decision Engine",
          href: "/ports/juneau",
          kind: "internal",
        },
      },
      {
        id: "juneau-concert-harbor",
        source: "concerts",
        category: "concerts",
        title: "Harbor-side evening set",
        startsInHours: 31,
        venueOrArea: "Marine Park",
        image: "/images/authority/ports/juneau/gallery-1.webp",
        whyItMatters: "Useful evening lane with predictable return path to port transport zones.",
        significance: 0.62,
        actionability: 0.72,
        localRelevance: 0.78,
        authorityCta: {
          label: "Open Juneau Port Planning",
          href: "/ports/juneau",
          kind: "internal",
        },
      },
      {
        id: "juneau-nightlife-dockside",
        source: "curated",
        category: "nightlife",
        title: "Dockside local music window",
        startsInHours: 10,
        venueOrArea: "Downtown Juneau",
        image: "/images/authority/ports/juneau/gallery-2.webp",
        whyItMatters: "Short-hop nightlife lane that preserves conservative all-aboard buffers.",
        significance: 0.58,
        actionability: 0.71,
        localRelevance: 0.84,
        authorityCta: {
          label: "Open Juneau Decision Engine",
          href: "/ports/juneau",
          kind: "internal",
        },
      },
      {
        id: "juneau-sports-local-game",
        source: "sports",
        category: "sports",
        title: "Local hockey showcase",
        startsInHours: 40,
        venueOrArea: "Downtown rink zone",
        image: "/images/authority/ports/juneau/hero.webp",
        whyItMatters: "Secondary option for travelers with extended overnights in Juneau.",
        significance: 0.5,
        actionability: 0.65,
        localRelevance: 0.7,
        authorityCta: {
          label: "Open Juneau Port Layer",
          href: "/ports/juneau",
          kind: "internal",
        },
      },
    ],
  },
];

const byKey = new Map(
  NEXT48_CURATED_SEEDS.map((seed) => [`${seed.entityType}:${seed.slug}`, seed])
);

export function getNext48CuratedSeed(entityType: Next48EntityType, slug: string): Next48CuratedSeed | null {
  return byKey.get(`${entityType}:${slug}`) || null;
}
