import type {
  CorridorDecisionCard,
  CorridorManifest,
  CorridorNavigationLink,
  CorridorRouteConfig,
  CorridorRouteRole,
} from "@/lib/dcc/corridors/types";

export type WesternWisconsinTripType =
  | "scenic"
  | "food_drink"
  | "music_culture"
  | "outdoor"
  | "family"
  | "winter";

export type WesternWisconsinDuration =
  | "day_trip"
  | "overnight"
  | "weekend"
  | "long_weekend";

export type WesternWisconsinOrigin =
  | "twin_cities"
  | "madison"
  | "milwaukee"
  | "chicago"
  | "local";

export type WesternWisconsinSeason =
  | "spring"
  | "summer"
  | "fall"
  | "winter";

export type WesternWisconsinPartyType =
  | "couple"
  | "family"
  | "friends"
  | "solo";

export type WesternWisconsinVibe =
  | "relaxing"
  | "walkable"
  | "adventurous"
  | "romantic"
  | "lively"
  | "quiet";

export type WesternWisconsinDecisionState = {
  corridor: "western-wisconsin";
  tripType?: WesternWisconsinTripType;
  duration?: WesternWisconsinDuration;
  origin?: WesternWisconsinOrigin;
  season?: WesternWisconsinSeason;
  partyType?: WesternWisconsinPartyType;
  vibe?: WesternWisconsinVibe;
  destination?: string;
  sourcePage?: string;
};

export type WesternWisconsinExecutionMode = "stays" | "activities" | "easy_plan";

type WesternWisconsinFitTag =
  | WesternWisconsinTripType
  | WesternWisconsinDuration
  | WesternWisconsinOrigin
  | WesternWisconsinSeason
  | WesternWisconsinPartyType
  | WesternWisconsinVibe;

type WesternWisconsinDestination = {
  slug: string;
  name: string;
  summary: string;
  recommendedPath: string;
  fits: readonly WesternWisconsinFitTag[];
};

type StCroixValleyTown = {
  name: string;
  body: string;
};

export type StCroixValleyProfile = {
  overview: string;
  rivers: readonly {
    name: string;
    body: string;
  }[];
  events: {
    intro: string;
    items: readonly string[];
    note: string;
  };
  towns: readonly StCroixValleyTown[];
  bestFor: readonly string[];
  decisionNotes: readonly string[];
  concertCalendar: {
    title: string;
    positioning: string;
    sources: readonly {
      name: string;
      role: string;
    }[];
    managerNotes: readonly string[];
    userPromise: string;
  };
  regionalVenues: readonly {
    name: string;
    location: string;
    body: string;
    transportation: string;
  }[];
};

const relatedGuides: CorridorNavigationLink[] = [
  { href: "/western-wisconsin/best-weekend-trip-from-twin-cities", label: "Best from Twin Cities" },
  { href: "/western-wisconsin/eau-claire-vs-la-crosse", label: "Eau Claire vs La Crosse" },
  { href: "/western-wisconsin/best-fall-getaway", label: "Best fall getaway" },
];

const decisionCards: CorridorDecisionCard[] = [
  {
    href: "/western-wisconsin/best-weekend-trip-from-twin-cities",
    title: "Best weekend trip from Twin Cities",
    body: "Use this when drive time and first-weekend ease matter more than browsing every town equally.",
    label: "Drive-time lane",
  },
  {
    href: "/western-wisconsin/eau-claire-vs-la-crosse",
    title: "Eau Claire vs La Crosse",
    body: "Use this when the real decision is social energy versus scenic bluff-country payoff.",
    label: "Town comparison",
  },
  {
    href: "/western-wisconsin/best-fall-getaway",
    title: "Best fall getaway",
    body: "Use this when foliage, scenic drives, trails, and shoulder-season fit are the whole point.",
    label: "Seasonal lane",
  },
];

export const WESTERN_WISCONSIN_CORRIDOR: CorridorManifest = {
  id: "western-wisconsin",
  canonicalHubRoute: "/western-wisconsin",
  handoff: {
    approvedParams: [
      "tripType",
      "duration",
      "origin",
      "season",
      "partyType",
      "vibe",
      "destination",
      "sourcePage",
      "choice",
      "intent",
      "mode",
    ],
    forbiddenLegacyParams: [],
    targets: [],
  },
  relatedGuides,
  decisionCards,
  routes: [
    {
      route: "/western-wisconsin",
      role: "hub",
      target: "/western-wisconsin",
      notes: "Canonical DCC hub for Western Wisconsin and the St. Croix Valley weekend decisions.",
    },
    {
      route: "/western-wisconsin/best-weekend-trip-from-twin-cities",
      role: "feeder",
      target: "/western-wisconsin",
      notes: "Twin Cities drive-time feeder.",
    },
    {
      route: "/western-wisconsin/eau-claire-vs-la-crosse",
      role: "feeder",
      target: "/western-wisconsin",
      notes: "River-town comparison feeder.",
    },
  {
    route: "/western-wisconsin/best-fall-getaway",
    role: "feeder",
    target: "/western-wisconsin",
    notes: "Fall-fit feeder.",
  },
  {
    route: "/western-wisconsin/stays",
    role: "support",
    target: "/western-wisconsin",
    notes: "Execution narrowing page for St. Croix stay-base selection before external inventory handoff.",
  },
    {
      route: "/western-wisconsin/activities",
      role: "support",
      target: "/western-wisconsin",
      notes: "Execution narrowing page for St. Croix activity-mode selection before external activity handoff.",
    },
  ],
};

export const WESTERN_WISCONSIN_DESTINATIONS: readonly WesternWisconsinDestination[] = [
  {
    slug: "eau-claire",
    name: "Eau Claire",
    recommendedPath: "/western-wisconsin/eau-claire-vs-la-crosse",
    fits: ["music_culture", "food_drink", "weekend", "friends", "lively", "walkable", "twin_cities"],
    summary:
      "Best for indie music, breweries, riverfront downtown, and a weekend that feels active without getting brittle.",
  },
  {
    slug: "la-crosse",
    name: "La Crosse",
    recommendedPath: "/western-wisconsin/eau-claire-vs-la-crosse",
    fits: ["scenic", "outdoor", "fall", "weekend", "couple", "romantic", "madison"],
    summary:
      "Best for Mississippi bluff views, Grandad Bluff, scenic trails, and a more dramatic river-country weekend.",
  },
  {
    slug: "stillwater",
    name: "Stillwater",
    recommendedPath: "/western-wisconsin/best-weekend-trip-from-twin-cities",
    fits: ["day_trip", "overnight", "couple", "romantic", "walkable", "food_drink", "twin_cities"],
    summary:
      "Best for a fast historic river-town reset with strong walkability and low-friction date-night energy from Minneapolis or St. Paul.",
  },
  {
    slug: "hudson",
    name: "Hudson",
    recommendedPath: "/western-wisconsin/best-weekend-trip-from-twin-cities",
    fits: ["day_trip", "overnight", "family", "friends", "walkable", "food_drink", "twin_cities"],
    summary:
      "Best for Wisconsin-side St. Croix riverfront access, Lakefront Park concerts, downtown dining, and easy Twin Cities weekend reach.",
  },
  {
    slug: "somerset",
    name: "Somerset",
    recommendedPath: "/western-wisconsin/best-weekend-trip-from-twin-cities",
    fits: ["summer", "outdoor", "friends", "family", "lively", "day_trip", "twin_cities"],
    summary:
      "Best for Apple River tubing, campground weekends, group floats, and a more casual summer recreation base north of Hudson and Stillwater.",
  },
  {
    slug: "black-river-falls",
    name: "Black River Falls",
    recommendedPath: "/western-wisconsin/best-fall-getaway",
    fits: ["outdoor", "adventurous", "family", "weekend", "fall", "winter", "quiet"],
    summary:
      "Best for trail systems, ATV access, cabin energy, and a more rugged outdoors-first weekend shape.",
  },
  {
    slug: "rice-lake-barron",
    name: "Rice Lake & Barron",
    recommendedPath: "/western-wisconsin/best-fall-getaway",
    fits: ["quiet", "family", "outdoor", "relaxing", "overnight", "fall", "local"],
    summary:
      "Best for quieter lake-country pacing, family downtime, and Northwoods-edge color without major crowd pressure.",
  },
  {
    slug: "wausau",
    name: "Wausau",
    recommendedPath: "/western-wisconsin/best-fall-getaway",
    fits: ["winter", "outdoor", "adventurous", "weekend", "friends", "milwaukee"],
    summary:
      "Best for Granite Peak, winter sports, and a more active Wisconsin weekend than a pure stroll-and-dine trip.",
  },
];

export const ST_CROIX_VALLEY_PROFILE: StCroixValleyProfile = {
  overview:
    "The Somerset-Hudson-Stillwater Area forms the core of the St. Croix Valley corridor. Stillwater (MN) and Hudson (WI) sit directly across from each other on the St. Croix River, with Somerset (WI) located just north along the Apple River. This tri-community region combines historic river towns, outdoor recreation, and easy access to the Twin Cities (roughly 20-30 minutes east of St. Paul).",
  rivers: [
    {
      name: "Apple River (Somerset)",
      body:
        "Primary tubing destination in the valley. River's Edge Apple River Campground and nearby outfitters offer lazy river tubing, group floats, camping, and summer events. Follow standard river safety: no glass or Styrofoam, wear water shoes, and check current conditions.",
    },
    {
      name: "St. Croix River (Hudson-Stillwater)",
      body:
        "National Scenic Riverway offering kayaking, canoeing, paddleboarding, fishing, paddlewheel cruises, and scenic riverfront experiences.",
    },
  ],
  events: {
    intro: "The St. Croix Valley hosts regular summer music and festivals.",
    items: [
      "Hudson: Concerts in the Park at Lakefront Park Bandshell",
      "Stillwater: Lumberjack Days, Summer Tuesdays, Opera on the River",
      "Somerset/River's Edge: Campground live music and events",
    ],
    note:
      "Summer schedules change yearly - check official calendars (DiscoverHudsonWI.com, DiscoverStillwater.com) for current details.",
  },
  towns: [
    {
      name: "Stillwater, MN",
      body:
        "Historic \"Birthplace of Minnesota\" with Victorian Main Street, riverwalk, Lift Bridge, shops, dining, and paddlewheel tours.",
    },
    {
      name: "Hudson, WI",
      body:
        "Vibrant river town with Lakefront Park, bandshell, downtown dining/shopping, Phipps Center for the Arts, and Willow River State Park nearby.",
    },
    {
      name: "Somerset, WI",
      body: "Known for Apple River tubing, campgrounds, and relaxed group recreation.",
    },
  ],
  bestFor: [
    "Twin Cities day trips and weekend getaways",
    "River tubing and water recreation groups",
    "Historic small-town exploration",
    "Summer concerts and festivals",
    "Future shuttle transportation opportunities",
  ],
  decisionNotes: [
    "Choose Somerset for tubing and campground energy.",
    "Choose Stillwater for historic downtown, dining, riverwalk, and romantic trips.",
    "Choose Hudson for riverfront concerts, parks, restaurants, and Wisconsin-side access.",
    "Combine all three for a full St. Croix Valley weekend.",
  ],
  concertCalendar: {
    title: "Somerset and St. Croix Valley concert calendar",
    positioning:
      "Somerset does not have one reliable public concert calendar that captures the full visitor decision: campground events, River's Edge weekends, Hudson park concerts, Stillwater festivals, and ticketed regional shows all sit in different places. DCC should fill that gap by acting as the decision layer for the whole St. Croix Valley live-music weekend.",
    sources: [
      {
        name: "Official venue and tourism calendars",
        role:
          "Use DiscoverHudsonWI.com, DiscoverStillwater.com, Apple River and River's Edge official pages, venue pages, and municipal calendars as the source of truth for local dates, rules, cancellations, and free public events.",
      },
      {
        name: "Ticketmaster Discovery API",
        role:
          "Use for ticketed concerts and larger regional events around Somerset, Hudson, Stillwater, and the east Twin Cities market when API credentials are configured.",
      },
      {
        name: "SeatGeek Events API",
        role:
          "Use as a second ticketed-event feed for market coverage, price discovery, and event deduping when API credentials are configured.",
      },
      {
        name: "DCC editorial review",
        role:
          "Hold unverified dates, uncertain venues, duplicate listings, and campground-event details for manual review before presenting them as planning facts.",
      },
    ],
    managerNotes: [
      "Do not invent dates, prices, artist names, ticket links, or campground schedules.",
      "Show evergreen planning guidance when live provider data is missing, stale, duplicated, or not yet reviewed.",
      "Prefer official local calendars over ticket APIs for free concerts, civic festivals, tubing rules, river conditions, and campground policies.",
      "Use Ticketmaster and SeatGeek for discoverability and ticketed inventory, then normalize event names, venue names, dates, and outbound links before publishing.",
    ],
    userPromise:
      "The calendar should help visitors decide whether Somerset, Hudson, Stillwater, or a combined St. Croix Valley weekend is the right move without forcing them to hunt across scattered local pages and ticket platforms.",
  },
  regionalVenues: [
    {
      name: "The Ledge Amphitheater",
      location: "Waite Park, MN",
      body:
        "A modern Minnesota amphitheater set against a granite quarry backdrop. It belongs in the same DCC concert-discovery lane because St. Croix Valley visitors comparing outdoor summer shows may treat Waite Park as a regional destination-night option, not just a local venue.",
      transportation:
        "Support the same concert-transportation service model and approved pricing rules used for the Somerset/St. Croix Valley shuttle lane once operator coverage is confirmed. Do not publish a fare, pickup point, or booking promise until the operator and price are validated.",
    },
    {
      name: "Mystic Lake Amphitheater",
      location: "Shakopee, MN",
      body:
        "A large outdoor venue on the Mystic Lake Casino grounds that books national touring acts and draws Twin Cities, Wisconsin, and regional concert traffic. It should be treated as a high-intent ticketed-event source for the St. Croix Valley calendar manager.",
      transportation:
        "Support the same concert-transportation service model and approved pricing rules used for the Somerset/St. Croix Valley shuttle lane once operator coverage is confirmed. Do not publish a fare, pickup point, or booking promise until the operator and price are validated.",
    },
  ],
};

const TRIP_TYPES = ["scenic", "food_drink", "music_culture", "outdoor", "family", "winter"] as const;
const DURATIONS = ["day_trip", "overnight", "weekend", "long_weekend"] as const;
const ORIGINS = ["twin_cities", "madison", "milwaukee", "chicago", "local"] as const;
const SEASONS = ["spring", "summer", "fall", "winter"] as const;
const PARTY_TYPES = ["couple", "family", "friends", "solo"] as const;
const VIBES = ["relaxing", "walkable", "adventurous", "romantic", "lively", "quiet"] as const;

function firstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function matchesOption<T extends string>(value: string | undefined, options: readonly T[]): T | undefined {
  return value && options.includes(value as T) ? (value as T) : undefined;
}

export function getWesternWisconsinDecisionState(input?: Record<string, string | string[] | undefined>): WesternWisconsinDecisionState {
  const source = input || {};

  return {
    corridor: "western-wisconsin",
    tripType: matchesOption(firstValue(source.tripType), TRIP_TYPES),
    duration: matchesOption(firstValue(source.duration), DURATIONS),
    origin: matchesOption(firstValue(source.origin), ORIGINS),
    season: matchesOption(firstValue(source.season), SEASONS),
    partyType: matchesOption(firstValue(source.partyType), PARTY_TYPES),
    vibe: matchesOption(firstValue(source.vibe), VIBES),
    destination: firstValue(source.destination),
    sourcePage: firstValue(source.sourcePage),
  };
}

export function buildWesternWisconsinHref(pathname: string, state: Partial<WesternWisconsinDecisionState>) {
  const url = new URL(pathname, "https://destinationcommandcenter.com");
  const params = {
    tripType: state.tripType,
    duration: state.duration,
    origin: state.origin,
    season: state.season,
    partyType: state.partyType,
    vibe: state.vibe,
    destination: state.destination,
    sourcePage: state.sourcePage,
  };

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value.length > 0) {
      url.searchParams.set(key, value);
    }
  }

  return `${url.pathname}${url.search}`;
}

export function buildWesternWisconsinExecutionHref(
  pathname: string,
  state: Partial<WesternWisconsinDecisionState>,
  input: {
    choice?: string;
    intent?: string;
    mode: WesternWisconsinExecutionMode;
  }
) {
  const url = new URL(buildWesternWisconsinHref(pathname, state), "https://destinationcommandcenter.com");
  url.searchParams.set("corridor", "western-wisconsin");
  url.searchParams.set("choice", input.choice || "st_croix");
  url.searchParams.set("intent", input.intent || "weekend");
  url.searchParams.set("mode", input.mode);
  return `${url.pathname}${url.search}`;
}

export function getWesternWisconsinCorridorRoutesByRole(role: CorridorRouteRole): CorridorRouteConfig[] {
  return WESTERN_WISCONSIN_CORRIDOR.routes.filter((entry) => entry.role === role);
}

export function resolveWesternWisconsinDestination(state: WesternWisconsinDecisionState) {
  const scored = WESTERN_WISCONSIN_DESTINATIONS.map((destination) => {
    let score = 0;
    const matchedFits: WesternWisconsinFitTag[] = [];

    const tests: Array<[WesternWisconsinFitTag | undefined, number]> = [
      [state.tripType, 3],
      [state.duration, 2],
      [state.partyType, 2],
      [state.vibe, 2],
      [state.season, 2],
      [state.origin, 1],
    ];

    for (const [value, points] of tests) {
      if (value && destination.fits.includes(value)) {
        score += points;
        matchedFits.push(value);
      }
    }

    if (state.destination && state.destination === destination.slug) {
      score += 4;
    }

    return { destination, score, matchedFits };
  }).sort((a, b) => b.score - a.score);

  return scored[0] ?? null;
}
