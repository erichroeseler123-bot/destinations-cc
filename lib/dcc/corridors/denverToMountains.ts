import type {
  CorridorDecisionCard,
  CorridorManifest,
  CorridorNavigationLink,
  CorridorRouteConfig,
  CorridorRouteRole,
} from "@/lib/dcc/corridors/types";
import { buildDecisionContinuationParams } from "@/lib/dcc/contracts/decisionContinuation";

export type DenverMountainTripType = "ski" | "scenic" | "food_drink" | "outdoor" | "relaxing";
export type DenverMountainSeason = "winter" | "summer" | "fall" | "spring";
export type DenverMountainDriveTime = "under_1hr" | "1_2hr" | "2_3hr" | "longer";
export type DenverMountainPartyType = "couple" | "friends" | "family" | "solo";
export type DenverMountainTripLength = "day_trip" | "overnight" | "weekend";
export type DenverMountainVibe = "luxury" | "casual" | "adventurous" | "easy";
export type DenverToMountainsExecutionMode = "transportation" | "stays" | "activities";
export type DenverToMountainsTransportMode = "shuttle" | "private_suv" | "self_drive";

export const DENVER_TO_MOUNTAINS_MACHINE_CONTRACT = {
  parent_network: "Destination Command Center",
  parent_url: "https://www.destinationcommandcenter.com/network",
  corridor_id: "denver-to-mountains",
  route_key: "denver-to-breckenridge",
  source_network_role: "decision_hub",
  decision_surface_role: "breckenridge_transport_decision_surface",
  preferred_operator: "GoSno",
  preferred_operator_url: "https://gosno.co",
  destination_network_role: "owned_execution_operator",
  execution_tier: "owned_execution",
  experience_type: "mountain_transport_execution",
  fallback_tier: "traveler_self_execution_fallback",
  continuity_contract:
    "DCC narrows Denver mountain intent; the Breckenridge transport surface selects the mode; GoSno executes owned mountain transportation without reopening destination choice.",
  crawler_story:
    "DCC decides the mountain route, Breckenridge transport narrows execution, GoSno executes the ride, and self-drive is fallback when the traveler accepts road and parking risk.",
} as const;

export type DenverToMountainsDecisionState = {
  corridor: "denver-to-mountains";
  tripType?: DenverMountainTripType;
  season?: DenverMountainSeason;
  driveTime?: DenverMountainDriveTime;
  partyType?: DenverMountainPartyType;
  tripLength?: DenverMountainTripLength;
  vibe?: DenverMountainVibe;
  destination?: string;
  mode?: DenverToMountainsExecutionMode;
  transportMode?: DenverToMountainsTransportMode;
  sourcePage?: string;
};

export type DenverToMountainsHandoff = DenverToMountainsDecisionState & {
  cta?: string;
};

type FitTag =
  | DenverMountainTripType
  | DenverMountainSeason
  | DenverMountainDriveTime
  | DenverMountainPartyType
  | DenverMountainTripLength
  | DenverMountainVibe;

type Destination = {
  slug: string;
  name: string;
  summary: string;
  recommendedPath: string;
  driveTimeBand: DenverMountainDriveTime;
  ski: boolean;
  fits: readonly FitTag[];
  execution: {
    tier: "primary" | "secondary" | "none";
    route?: string;
    transport: boolean;
    shuttleRoute: string | null;
    bookable: boolean;
  };
};

const relatedGuides: CorridorNavigationLink[] = [
  { href: "/best-mountain-town-from-denver", label: "Best mountain town" },
  { href: "/breckenridge-vs-vail", label: "Breckenridge vs Vail" },
  { href: "/best-day-trip-from-denver-mountains", label: "Best day trip" },
  { href: "/estes-park-vs-idaho-springs", label: "Estes Park vs Idaho Springs" },
  { href: "/can-you-get-to-breckenridge-without-a-car", label: "Breckenridge without a car" },
  { href: "/shuttle-vs-driving-breckenridge", label: "Shuttle vs driving" },
];

const decisionCards: CorridorDecisionCard[] = [
  {
    href: "/best-mountain-town-from-denver",
    title: "Pick the best overall mountain town",
    body: "Use this when you want the fastest answer on which town actually wins for a Denver-based weekend.",
    label: "Proof page",
  },
  {
    href: "/breckenridge-vs-vail",
    title: "Resolve Breckenridge vs Vail",
    body: "Use this when the real tension is ski-town energy versus polish and premium feel.",
    label: "Ski lane",
  },
  {
    href: "/best-day-trip-from-denver-mountains",
    title: "Choose the best day trip",
    body: "Use this when overnight friction kills the plan and drive time matters more than destination prestige.",
    label: "Day-trip lane",
  },
  {
    href: "/estes-park-vs-idaho-springs",
    title: "Compare the easy mountain towns",
    body: "Use this when the question is scenic national-park edge versus the fastest low-friction reset.",
    label: "Easy lane",
  },
];

export const DENVER_TO_MOUNTAINS_CORRIDOR: CorridorManifest = {
  id: "denver-to-mountains",
  canonicalHubRoute: "/denver-to-mountains",
  handoff: {
    approvedParams: [
      "tripType",
      "season",
      "driveTime",
      "partyType",
      "tripLength",
      "vibe",
      "destination",
      "mode",
      "transportMode",
      "sourcePage",
      "route_key",
      "execution_tier",
      "experience_type",
      "source_network_role",
      "destination_network_role",
      "dcc_handoff_id",
    ],
    forbiddenLegacyParams: [],
    targets: [],
  },
  relatedGuides,
  decisionCards,
  routes: [
    {
      route: "/denver-to-mountains",
      role: "hub",
      target: "/denver-to-mountains",
      notes: "Canonical DCC hub for Denver-origin mountain trip decisions.",
    },
    {
      route: "/best-mountain-town-from-denver",
      role: "feeder",
      target: "/denver-to-mountains",
      notes: "Proof page for best overall mountain-town decision.",
    },
    {
      route: "/breckenridge-vs-vail",
      role: "feeder",
      target: "/denver-to-mountains",
      notes: "Ski-town comparison feeder.",
    },
    {
      route: "/best-day-trip-from-denver-mountains",
      role: "feeder",
      target: "/denver-to-mountains",
      notes: "Day-trip decision feeder.",
    },
    {
      route: "/estes-park-vs-idaho-springs",
      role: "feeder",
      target: "/denver-to-mountains",
      notes: "Easy mountain-town comparison feeder.",
    },
    {
      route: "/denver-to-mountains/breckenridge",
      role: "support",
      target: "/denver-to-mountains",
      notes: "Execution bridge for the Breckenridge decision before narrowing into trip-mode execution.",
    },
    {
      route: "/denver-to-mountains/breckenridge/transportation",
      role: "support",
      target: "/denver-to-mountains",
      notes: "Transport narrowing page for the Breckenridge lane before GoSno owned execution or self-drive fallback.",
    },
    {
      route: "/can-you-get-to-breckenridge-without-a-car",
      role: "support",
      target: "/denver-to-mountains",
      notes: "High-intent Breckenridge no-car feeder routing directly into the transportation narrowing lane.",
    },
    {
      route: "/shuttle-vs-driving-breckenridge",
      role: "support",
      target: "/denver-to-mountains",
      notes: "High-intent Breckenridge transport comparison feeder routing into the transportation narrowing lane.",
    },
  ],
};

export const DENVER_TO_MOUNTAINS_DESTINATIONS: readonly Destination[] = [
  {
    slug: "breckenridge",
    name: "Breckenridge",
    recommendedPath: "/denver-to-mountains/breckenridge",
    driveTimeBand: "1_2hr",
    ski: true,
    execution: {
      tier: "primary",
      route: "denver-breckenridge",
      transport: true,
      shuttleRoute: "denver-breckenridge",
      bookable: false,
    },
    fits: ["ski", "outdoor", "summer", "winter", "friends", "couple", "overnight", "weekend", "casual", "adventurous", "1_2hr"],
    summary:
      "Best overall if you want a mountain town that actually balances ski access, walkable core, weekend energy, and repeat-trip value from Denver.",
  },
  {
    slug: "vail",
    name: "Vail",
    recommendedPath: "/breckenridge-vs-vail",
    driveTimeBand: "2_3hr",
    ski: true,
    execution: {
      tier: "primary",
      route: "denver-vail",
      transport: true,
      shuttleRoute: "denver-vail",
      bookable: false,
    },
    fits: ["ski", "scenic", "summer", "winter", "couple", "friends", "overnight", "weekend", "luxury", "easy", "2_3hr"],
    summary:
      "Best when polish, premium lodging feel, and a cleaner luxury mountain weekend matter more than price or casual town energy.",
  },
  {
    slug: "estes-park",
    name: "Estes Park",
    recommendedPath: "/estes-park-vs-idaho-springs",
    driveTimeBand: "1_2hr",
    ski: false,
    execution: {
      tier: "primary",
      route: "denver-estes-park",
      transport: false,
      shuttleRoute: null,
      bookable: false,
    },
    fits: ["scenic", "outdoor", "summer", "fall", "family", "couple", "day_trip", "overnight", "casual", "easy", "1_2hr"],
    summary:
      "Best for Rocky Mountain gateway scenery, wildlife, and a scenic mountain day or easy overnight that still feels like a real escape.",
  },
  {
    slug: "idaho-springs",
    name: "Idaho Springs",
    recommendedPath: "/estes-park-vs-idaho-springs",
    driveTimeBand: "under_1hr",
    ski: false,
    execution: {
      tier: "secondary",
      route: "denver-idaho-springs",
      transport: true,
      shuttleRoute: "denver-idaho-springs",
      bookable: false,
    },
    fits: ["scenic", "food_drink", "relaxing", "summer", "fall", "spring", "couple", "friends", "solo", "day_trip", "casual", "easy", "under_1hr"],
    summary:
      "Best for the fastest low-friction mountain reset from Denver when drive time matters more than a full resort-town experience.",
  },
  {
    slug: "glenwood-springs",
    name: "Glenwood Springs",
    recommendedPath: "/best-mountain-town-from-denver",
    driveTimeBand: "longer",
    ski: false,
    execution: {
      tier: "none",
      transport: true,
      shuttleRoute: "denver-glenwood-springs",
      bookable: false,
    },
    fits: ["scenic", "food_drink", "relaxing", "summer", "fall", "couple", "family", "weekend", "luxury", "easy", "longer"],
    summary:
      "Best when you want hot-springs energy and a fuller weekend payoff and are willing to spend more drive time to get it.",
  },
];

export const DENVER_MOUNTAIN_EXECUTION_MAP = {
  breckenridge: {
    tier: "primary",
    primary: "/denver-to-mountains/breckenridge",
    fallback: "/transportation/colorado",
  },
  vail: {
    tier: "primary",
    primary: "/transportation/colorado/denver-to-vail-shuttle-guide",
    fallback: "/transportation/colorado",
  },
  "estes-park": {
    tier: "primary",
    primary: "/transportation/colorado/denver-to-estes-park-guide",
    fallback: "/transportation/colorado",
  },
  "idaho-springs": {
    tier: "secondary",
    primary: "/transportation/colorado",
    fallback: "/transportation/colorado",
  },
  "glenwood-springs": {
    tier: "none",
    primary: "/best-mountain-town-from-denver",
    fallback: "/best-mountain-town-from-denver",
  },
} as const;

const TRIP_TYPES = ["ski", "scenic", "food_drink", "outdoor", "relaxing"] as const;
const SEASONS = ["winter", "summer", "fall", "spring"] as const;
const DRIVE_TIMES = ["under_1hr", "1_2hr", "2_3hr", "longer"] as const;
const PARTY_TYPES = ["couple", "friends", "family", "solo"] as const;
const TRIP_LENGTHS = ["day_trip", "overnight", "weekend"] as const;
const VIBES = ["luxury", "casual", "adventurous", "easy"] as const;
const EXECUTION_MODES = ["transportation", "stays", "activities"] as const;
const TRANSPORT_MODES = ["shuttle", "private_suv", "self_drive"] as const;

function firstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function matchesOption<T extends string>(value: string | undefined, options: readonly T[]): T | undefined {
  return value && options.includes(value as T) ? (value as T) : undefined;
}

export function getDenverToMountainsDecisionState(input?: Record<string, string | string[] | undefined>): DenverToMountainsDecisionState {
  const source = input || {};

  return {
    corridor: "denver-to-mountains",
    tripType: matchesOption(firstValue(source.tripType), TRIP_TYPES),
    season: matchesOption(firstValue(source.season), SEASONS),
    driveTime: matchesOption(firstValue(source.driveTime), DRIVE_TIMES),
    partyType: matchesOption(firstValue(source.partyType), PARTY_TYPES),
    tripLength: matchesOption(firstValue(source.tripLength), TRIP_LENGTHS),
    vibe: matchesOption(firstValue(source.vibe), VIBES),
    destination: firstValue(source.destination),
    mode: matchesOption(firstValue(source.mode), EXECUTION_MODES),
    transportMode: matchesOption(firstValue(source.transportMode), TRANSPORT_MODES),
    sourcePage: firstValue(source.sourcePage),
  };
}

export function buildDenverToMountainsHref(pathname: string, state: Partial<DenverToMountainsDecisionState>) {
  const url = new URL(pathname, "https://destinationcommandcenter.com");

  const params = {
    tripType: state.tripType,
    season: state.season,
    driveTime: state.driveTime,
    partyType: state.partyType,
    tripLength: state.tripLength,
    vibe: state.vibe,
    destination: state.destination,
    mode: state.mode,
    transportMode: state.transportMode,
    sourcePage: state.sourcePage,
  };

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value.length > 0) {
      url.searchParams.set(key, value);
    }
  }

  return `${url.pathname}${url.search}`;
}

export function buildDenverToMountainsExecutionHref(
  destination: keyof typeof DENVER_MOUNTAIN_EXECUTION_MAP,
  state: Partial<DenverToMountainsDecisionState>,
  cta = "choose_destination",
) {
  const route = DENVER_MOUNTAIN_EXECUTION_MAP[destination];
  if (route.tier === "none") {
    return buildDenverToMountainsHref(route.fallback, state);
  }

  const targetPath = route.tier === "primary" ? route.primary : route.fallback;
  const url = new URL(targetPath, "https://destinationcommandcenter.com");

  const continuationParams = buildDecisionContinuationParams({
    sourcePage: state.sourcePage || "/denver-to-mountains",
    corridor: "denver-to-mountains",
    cta,
    action: cta,
    option: destination,
    product: "mountain-route-guide",
    entryMode: "dcc-first",
    destinationSurface: "flow",
    routeKey: destination === "breckenridge" ? DENVER_TO_MOUNTAINS_MACHINE_CONTRACT.route_key : undefined,
    executionTier: destination === "breckenridge" ? "decision_surface" : undefined,
    sourceNetworkRole: DENVER_TO_MOUNTAINS_MACHINE_CONTRACT.source_network_role,
    destinationNetworkRole: destination === "breckenridge" ? "owned_execution_operator" : undefined,
    experienceType: destination === "breckenridge" ? DENVER_TO_MOUNTAINS_MACHINE_CONTRACT.experience_type : undefined,
    continuityContract:
      destination === "breckenridge"
        ? DENVER_TO_MOUNTAINS_MACHINE_CONTRACT.continuity_contract
        : undefined,
  });

  for (const [key, value] of Object.entries(continuationParams)) {
    if (typeof value === "string" && value.length > 0) {
      url.searchParams.set(key, value);
    }
  }

  const params = {
    corridor: "denver-to-mountains",
    destination,
    tripType: state.tripType,
    season: state.season,
    driveTime: state.driveTime,
    partyType: state.partyType,
    tripLength: state.tripLength,
    vibe: state.vibe,
    mode: state.mode,
    transportMode: state.transportMode,
    sourcePage: state.sourcePage,
    cta,
  };

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value.length > 0) {
      url.searchParams.set(key, value);
    }
  }

  return `${url.pathname}${url.search}`;
}

export function buildDenverToMountainsPlanningHref(
  pathname: string,
  state: Partial<DenverToMountainsDecisionState>,
  options: {
    mode?: DenverToMountainsExecutionMode;
    transportMode?: DenverToMountainsTransportMode;
    cta?: string;
  } = {},
) {
  const url = new URL(pathname, "https://destinationcommandcenter.com");

  const params = {
    corridor: "denver-to-mountains",
    tripType: state.tripType,
    season: state.season,
    driveTime: state.driveTime,
    partyType: state.partyType,
    tripLength: state.tripLength,
    vibe: state.vibe,
    destination: state.destination,
    mode: options.mode ?? state.mode,
    transportMode: options.transportMode ?? state.transportMode,
    sourcePage: state.sourcePage,
    cta: options.cta,
  };

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value.length > 0) {
      url.searchParams.set(key, value);
    }
  }

  return `${url.pathname}${url.search}`;
}

export function getDenverToMountainsCorridorRoutesByRole(role: CorridorRouteRole): CorridorRouteConfig[] {
  return DENVER_TO_MOUNTAINS_CORRIDOR.routes.filter((entry) => entry.role === role);
}

export function getDenverToMountainsDestination(slug: string) {
  return DENVER_TO_MOUNTAINS_DESTINATIONS.find((destination) => destination.slug === slug) ?? null;
}

export function getDenverToMountainsExecutionHandoff(
  input?: Record<string, string | string[] | undefined>,
): DenverToMountainsHandoff | null {
  const source = input || {};
  const corridor = firstValue(source.corridor);
  const destination = firstValue(source.destination);
  const hasValidHandoff = corridor === "denver-to-mountains" && typeof destination === "string" && destination.length > 0;

  if (!hasValidHandoff) {
    return null;
  }

  const state = getDenverToMountainsDecisionState(input);

  return {
    ...state,
    corridor: "denver-to-mountains",
    destination,
    mode: matchesOption(firstValue(source.mode), EXECUTION_MODES),
    transportMode: matchesOption(firstValue(source.transportMode), TRANSPORT_MODES),
    sourcePage: firstValue(source.sourcePage) || firstValue(source.source_page) || state.sourcePage,
    cta: firstValue(source.cta) || firstValue(source.decision_cta),
  };
}

const DRIVE_PENALTIES: Record<DenverMountainDriveTime, number> = {
  under_1hr: 0,
  "1_2hr": 1,
  "2_3hr": 2,
  longer: 3,
};

export function resolveDenverToMountainsDestination(state: DenverToMountainsDecisionState) {
  const scored = DENVER_TO_MOUNTAINS_DESTINATIONS.map((destination) => {
    let score = 0;
    const matchedFits: FitTag[] = [];

    const tests: Array<[FitTag | undefined, number]> = [
      [state.tripType, 3],
      [state.season, 2],
      [state.partyType, 2],
      [state.tripLength, 3],
      [state.vibe, 2],
      [state.driveTime, 2],
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

    if (state.tripLength === "day_trip" && DRIVE_PENALTIES[destination.driveTimeBand] >= DRIVE_PENALTIES["2_3hr"]) {
      score -= 5;
    }

    if (state.tripLength === "overnight" && destination.driveTimeBand === "longer") {
      score -= 2;
    }

    if (state.season === "winter" && state.tripType === "ski" && !destination.ski) {
      score -= 4;
    }

    if (state.driveTime === "under_1hr" && destination.driveTimeBand !== "under_1hr") {
      score -= 3;
    }

    if (state.driveTime === "1_2hr" && DRIVE_PENALTIES[destination.driveTimeBand] > DRIVE_PENALTIES["1_2hr"]) {
      score -= 2;
    }

    return { destination, score, matchedFits };
  }).sort((a, b) => b.score - a.score);

  return scored[0] ?? null;
}
