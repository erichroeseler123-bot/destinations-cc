export type SomersetPageKey =
  | "concerts"
  | "apple-river-tubing"
  | "transportation"
  | "rivers-edge-campground"
  | "mystic-lake-amphitheater"
  | "the-ledge-amphitheater";

export type SomersetPageConfig = {
  slug: SomersetPageKey;
  title: string;
  description: string;
  eyebrow: string;
  sections: readonly {
    title: string;
    body: string;
  }[];
};

export const SOMERSET_BASE_PATH = "/somerset-wi";

export const SOMERSET_PAGE_PATHS = [
  SOMERSET_BASE_PATH,
  `${SOMERSET_BASE_PATH}/concerts`,
  `${SOMERSET_BASE_PATH}/apple-river-tubing`,
  `${SOMERSET_BASE_PATH}/transportation`,
  `${SOMERSET_BASE_PATH}/rivers-edge-campground`,
  `${SOMERSET_BASE_PATH}/mystic-lake-amphitheater`,
  `${SOMERSET_BASE_PATH}/the-ledge-amphitheater`,
] as const;

export const SOMERSET_PAGES: readonly SomersetPageConfig[] = [
  {
    slug: "concerts",
    eyebrow: "Somerset concert calendar",
    title: "Somerset WI concerts and St. Croix Valley live music",
    description:
      "Auto-updating Somerset and St. Croix Valley concert planning for River's Edge weekends, Hudson-Stillwater music, Mystic Lake, and The Ledge.",
    sections: [
      {
        title: "Why this page exists",
        body:
          "Somerset does not have one clean visitor-facing concert calendar. DCC fills that gap by combining ticketed-event feeds with official local-calendar guidance and venue-specific planning notes.",
      },
      {
        title: "What changes automatically",
        body:
          "Ticketed shows from Ticketmaster and SeatGeek refresh through the St. Croix calendar layer. Free civic concerts, campground rules, cancellations, and river-event details still need official-calendar review.",
      },
    ],
  },
  {
    slug: "apple-river-tubing",
    eyebrow: "Apple River tubing",
    title: "Apple River tubing in Somerset WI",
    description:
      "Somerset Apple River tubing planning for group floats, campground weekends, safety rules, and St. Croix Valley trip decisions.",
    sections: [
      {
        title: "Somerset is the tubing anchor",
        body:
          "Use Somerset when the trip is built around Apple River tubing, lazy river floats, campground energy, and casual summer group recreation.",
      },
      {
        title: "Rules and conditions",
        body:
          "Do not rely on stale hours, prices, or opening dates. Check current operator rules, water conditions, no-glass policies, and campground updates before leaving.",
      },
    ],
  },
  {
    slug: "transportation",
    eyebrow: "Somerset transportation",
    title: "Somerset WI concert and tubing transportation",
    description:
      "Somerset VIP Shuttle planning for private concert rides, tubing weekends, River's Edge events, St. Croix Valley concerts, Mystic Lake, and The Ledge.",
    sections: [
      {
        title: "New Wisconsin service, proven concert-night background",
        body:
          "Somerset VIP Shuttle is new to western Wisconsin, but the operator's transportation experience is not new. The service is expanding from an established Red Rocks shuttle operation in Colorado, where concertgoers need calm pickup plans, reliable timing, and a clean ride home through a demanding live-event corridor.",
      },
      {
        title: "What that means for Somerset Amphitheater",
        body:
          "The goal is to bring that same concert-night logistics experience to Somerset Amphitheater: private rides, clear pickup plans, tailgate-friendly service, and a driver who understands that the ride is part of the night.",
      },
    ],
  },
  {
    slug: "rivers-edge-campground",
    eyebrow: "River's Edge",
    title: "River's Edge Apple River Campground events and tubing",
    description:
      "River's Edge Apple River Campground planning for tubing groups, camping weekends, live music, and Somerset summer trips.",
    sections: [
      {
        title: "Campground and tubing base",
        body:
          "River's Edge is one of the clearest Somerset anchors for Apple River tubing, camping, group weekends, summer events, and live-music-adjacent trip planning.",
      },
      {
        title: "Use official details for trip-critical facts",
        body:
          "Campground events, rules, pool or waterslide access, tubing conditions, and seasonal operations can change. Keep exact dates and policies tied to official sources.",
      },
    ],
  },
  {
    slug: "mystic-lake-amphitheater",
    eyebrow: "Mystic Lake",
    title: "Mystic Lake Amphitheater concerts and transportation",
    description:
      "Mystic Lake Amphitheater concert planning for Shakopee, Twin Cities groups, St. Croix Valley visitors, and future shuttle service.",
    sections: [
      {
        title: "Regional amphitheater lane",
        body:
          "Mystic Lake Amphitheater is a major outdoor concert draw on the casino grounds in Shakopee. It belongs in the Somerset/St. Croix planning system because visitors compare it with other summer outdoor show options.",
      },
      {
        title: "Transportation fit",
        body:
          "Use the same validated concert-transportation service model as the Somerset venue lane once operator coverage and pricing are confirmed. Do not imply local Wisconsin operating history until the service has earned it.",
      },
    ],
  },
  {
    slug: "the-ledge-amphitheater",
    eyebrow: "The Ledge",
    title: "The Ledge Amphitheater concerts and transportation",
    description:
      "The Ledge Amphitheater concert planning for Waite Park, regional summer shows, granite quarry backdrop trips, and future shuttle service.",
    sections: [
      {
        title: "Destination-night amphitheater",
        body:
          "The Ledge Amphitheater in Waite Park is a modern Minnesota amphitheater set against a granite quarry backdrop. It is a regional outdoor-show option for travelers comparing summer concert weekends.",
      },
      {
        title: "Transportation fit",
        body:
          "Use the same validated concert-transportation service model as the Somerset venue lane once operator coverage and pricing are confirmed. Keep the trust message grounded in Red Rocks transportation experience, not claimed local Wisconsin tenure.",
      },
    ],
  },
];

export function getSomersetPage(slug: string) {
  return SOMERSET_PAGES.find((page) => page.slug === slug) || null;
}
