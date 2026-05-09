export type HubId = "downtown-broadway" | "parkway" | "lake-delton-outskirts";

export type Hub = {
  id: HubId;
  name: string;
  shortName: string;
  role: string;
  oneLine: string;
  bestFor: string[];
  friction: string;
  parking: string;
  timeCommitment: string;
  defaultMove: string;
  nextStopPrompt: string;
};

export type ActionCard = {
  id: string;
  hubId: HubId;
  title: string;
  label: string;
  body: string;
  parkingFriction: "Easy" | "Moderate" | "High";
  timeCommitment: string;
  escapeRoute: string;
  ctaLabel: string;
  href: string;
  handoffType: "controlled_execution" | "dcc" | "owned_execution" | "marketplace_fallback" | "local-intel";
};

export type RiverOpsCard = {
  rank: string;
  slug: string;
  title: string;
  category: "river" | "roadside" | "after-hours";
  imageUrl: string;
  imageAlt: string;
  blurDataURL: string;
  intensity: string;
  loungeIntel: string;
  commissionPath: string;
  ctaLabel: string;
  href: string;
};

export const SITE_URL = "https://welcometothedells.com";
export const OUTBOUND_BASE_URL = `${SITE_URL}/out/wisconsin-dells`;
export const DCC_DELLS_URL = "https://www.destinationcommandcenter.com/wisconsin-dells";
export const FEASTLY_DELLS_URL = "https://feastlyspread.com/book";
export const DCC_DELLS_MASTER_PLAN_URL =
  "https://www.destinationcommandcenter.com/wisconsin-dells?utm_source=welcometothedells&utm_medium=satellite&utm_campaign=welcometothedells-dcc-master-plan";
export const QR_TEST_URLS = [
  {
    id: "lake-delton",
    label: "Lake Delton QR test",
    url: `${SITE_URL}/?utm_source=qr&utm_medium=print&utm_campaign=dells-river-ops-test&utm_content=lake-delton`,
  },
  {
    id: "broadway",
    label: "Broadway QR test",
    url: `${SITE_URL}/?utm_source=qr&utm_medium=print&utm_campaign=dells-river-ops-test&utm_content=broadway`,
  },
] as const;

export type RiverOpsOutboundTarget = {
  slug: string;
  label: string;
  provider: "viator" | "operator";
  routeKind: "marketplace_fallback" | "controlled_operator";
  mode: "direct-product" | "operator-ticket-hub";
  targetUrl: string;
  productCode?: string;
  operator: string;
  fallbackUrl: string;
};

const VIATOR_ATTRIBUTION = {
  pid: "P00249726",
  mcid: "42383",
  campaign: "welcometothedells-river-ops",
};

function appendParams(url: string, params: Record<string, string>) {
  const target = new URL(url);
  for (const [key, value] of Object.entries(params)) {
    target.searchParams.set(key, value);
  }
  return target.toString();
}

function viatorProduct(productUrl: string, label: string) {
  return appendParams(productUrl, {
    ...VIATOR_ATTRIBUTION,
    label,
  });
}

function operatorTarget(productUrl: string, label: string) {
  return appendParams(productUrl, {
    utm_source: "welcometothedells",
    utm_medium: "owned_outbound",
    utm_campaign: "welcometothedells-river-ops",
    utm_content: label,
  });
}

export const RIVER_OPS_OUTBOUND_TARGETS: RiverOpsOutboundTarget[] = [
  {
    slug: "jet-boat-primary",
    label: "jet_boat_primary",
    provider: "operator",
    routeKind: "controlled_operator",
    mode: "operator-ticket-hub",
    operator: "Jet Boat Adventures",
    targetUrl: operatorTarget("https://originalwisconsinducks.com/ticket-hub/jet-boat.jsp", "jet_boat_primary"),
    fallbackUrl: operatorTarget("https://www.jetboatadv.com/", "jet_boat_primary_fallback"),
  },
  {
    slug: "ducks-primary",
    label: "ducks_primary",
    provider: "operator",
    routeKind: "controlled_operator",
    mode: "operator-ticket-hub",
    operator: "Original Wisconsin Ducks",
    targetUrl: operatorTarget("https://originalwisconsinducks.com/ticket-hub/ducks.jsp", "ducks_primary"),
    fallbackUrl: operatorTarget("https://originalwisconsinducks.com/ticket-hub/ducks.jsp", "ducks_primary_fallback"),
  },
  {
    slug: "ghost-boat",
    label: "ghost_boat_after_hours",
    provider: "operator",
    routeKind: "controlled_operator",
    mode: "operator-ticket-hub",
    operator: "Ghost Boat",
    targetUrl: operatorTarget("https://originalwisconsinducks.com/ticket-hub/ghost-boat.jsp", "ghost_boat_after_hours"),
    fallbackUrl: operatorTarget("https://www.dellsghostboat.com/", "ghost_boat_after_hours_fallback"),
  },
  {
    slug: "sunset-dinner",
    label: "sunset_tour",
    provider: "operator",
    routeKind: "controlled_operator",
    mode: "operator-ticket-hub",
    operator: "Dells Boat Tours",
    targetUrl: operatorTarget("https://originalwisconsinducks.com/ticket-hub/sunset-dinner.jsp", "sunset_tour"),
    fallbackUrl: operatorTarget("https://www.dellsboats.com/", "sunset_tour_fallback"),
  },
  {
    slug: "classic-upper",
    label: "classic_tour",
    provider: "operator",
    routeKind: "controlled_operator",
    mode: "operator-ticket-hub",
    operator: "Dells Boat Tours",
    targetUrl: operatorTarget("https://originalwisconsinducks.com/ticket-hub/dells-boat.jsp", "classic_tour"),
    fallbackUrl: operatorTarget("https://www.dellsboats.com/", "classic_tour_fallback"),
  },
  {
    slug: "roadside-oddities",
    label: "roadside_oddities",
    provider: "viator",
    routeKind: "marketplace_fallback",
    mode: "direct-product",
    productCode: "285568P2",
    operator: "Wisconsin Dells Trolley Service",
    targetUrl: viatorProduct(
      "https://www.viator.com/tours/Wisconsin-Dells/Haunted-History-Trolley-Tour/d27740-285568P2",
      "roadside_oddities",
    ),
    fallbackUrl: operatorTarget("https://www.wisdells.com/wisconsin-dells-attractions", "roadside_oddities_fallback"),
  },
];

export function getRiverOpsOutboundTarget(slug: string) {
  return RIVER_OPS_OUTBOUND_TARGETS.find((target) => target.slug === slug);
}

export function riverOpsOutbound(slug: string) {
  return `${OUTBOUND_BASE_URL}/${slug}`;
}

const RIVER_CARD_BLUR =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTAiIHZpZXdCb3g9IjAgMCAxNiAxMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwIiB4Mj0iMSIgeTE9IjAiIHkyPSIxIj48c3RvcCBzdG9wLWNvbG9yPSIjMTUxMjBlIi8+PHN0b3Agb2Zmc2V0PSIwLjUyIiBzdG9wLWNvbG9yPSIjNjhiOGFkIi8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjZDQ5YTU1Ii8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjEwIiBmaWxsPSJ1cmwoI2cpIi8+PC9zdmc+";

export const RIVER_OPS_TERMINAL: RiverOpsCard[] = [
  {
    rank: "01",
    slug: "jet-boat-adventures",
    title: "Jet Boat Adventures",
    category: "river",
    imageUrl: "https://www.jetboatadv.com/wp-content/uploads/2023/07/homepage_hero.png",
    imageAlt: "Jet Boat Adventures running through the Wisconsin Dells canyon",
    blurDataURL: RIVER_CARD_BLUR,
    intensity: "High intensity",
    loungeIntel: "The 360-degree canyon run. Best when the group wants the Dells to feel physical, fast, and unmistakably local.",
    commissionPath: "Controlled operator ticket hub",
    ctaLabel: "Check jet boat times",
    href: riverOpsOutbound("jet-boat-primary"),
  },
  {
    rank: "02",
    slug: "original-wisconsin-ducks",
    title: "Original Wisconsin Ducks",
    category: "river",
    imageUrl: "https://originalwisconsinducks.com/ticket-hub/img/ducks-header-lg.jpg",
    imageAlt: "Original Wisconsin Ducks amphibious vehicle on the Dells route",
    blurDataURL: RIVER_CARD_BLUR,
    intensity: "Essential Dells",
    loungeIntel: "Road-to-river amphibious ride. The reliable first-timer answer when nobody wants to overthink the canyon decision.",
    commissionPath: "Controlled operator ticket hub",
    ctaLabel: "Reserve a duck",
    href: riverOpsOutbound("ducks-primary"),
  },
  {
    rank: "03",
    slug: "ghost-boat",
    title: "Ghost Boat: Journey to Haunted Canyon",
    category: "after-hours",
    imageUrl: "https://www.dellsghostboat.com/wp-content/uploads/2025/06/Vintage-Boat-Red-scaled-1-2048x821.webp",
    imageAlt: "Ghost Boat on the Dells water after dark",
    blurDataURL: RIVER_CARD_BLUR,
    intensity: "After dark",
    loungeIntel: "The night-run version of the canyon. Best for groups that want atmosphere after the hot, loud part of the day is over.",
    commissionPath: "Controlled operator ticket hub",
    ctaLabel: "Check night tours",
    href: riverOpsOutbound("ghost-boat"),
  },
  {
    rank: "04",
    slug: "sunset-dinner-cruise",
    title: "Dells Sunset Dinner Cruise",
    category: "river",
    imageUrl: "https://originalwisconsinducks.com/ticket-hub/img/sunset-cruise-header-lg.jpg",
    imageAlt: "Dells Sunset Dinner Cruise on the river at evening",
    blurDataURL: RIVER_CARD_BLUR,
    intensity: "Evening upsell",
    loungeIntel: "The higher-ticket river move when the group wants the canyon and the night plan solved in one booking.",
    commissionPath: "Controlled operator product",
    ctaLabel: "Check sunset departures",
    href: riverOpsOutbound("sunset-dinner"),
  },
  {
    rank: "05",
    slug: "upper-dells-boat-tour",
    title: "Upper Dells Scenic Boat Tour",
    category: "river",
    imageUrl: "https://www.dellsboats.com/wp-content/uploads/2023/05/homepage-hero-1.png",
    imageAlt: "Upper Dells scenic boat tour moving through sandstone bluffs",
    blurDataURL: RIVER_CARD_BLUR,
    intensity: "Classic canyon",
    loungeIntel: "The slow-roll sandstone payoff: Witches Gulch, Stand Rock, and the reason the town exists.",
    commissionPath: "Controlled operator tour list",
    ctaLabel: "Check classic tours",
    href: riverOpsOutbound("classic-upper"),
  },
];

export const HUBS: Hub[] = [
  {
    id: "downtown-broadway",
    name: "Downtown / Broadway",
    shortName: "Broadway",
    role: "Park once and walk",
    oneLine: "Best for kitsch, boat-tour staging, the Riverwalk, and classic roadside Dells energy.",
    bestFor: ["walkable oddities", "boat-tour staging", "Riverwalk reset"],
    friction: "Crowds spike after lunch and during the early-evening shuffle.",
    parking: "Use a single downtown lot and avoid moving the car between short stops.",
    timeCommitment: "30-90 minutes",
    defaultMove: "Start on Broadway, then decide whether you need a quick food stop or a river-view reset.",
    nextStopPrompt: "Standing near H.H. Bennett or Broadway? Pick the next stop within walking distance.",
  },
  {
    id: "parkway",
    name: "Wisconsin Dells Parkway / Hwy 12",
    shortName: "The Parkway",
    role: "The neon heart",
    oneLine: "Best for roadside oddities, high-energy attractions, big signs, and the classic drive-by decision problem.",
    bestFor: ["roadside oddities", "major attractions", "quick pull-over decisions"],
    friction: "Traffic and left turns create the real delay, especially when families are leaving resorts.",
    parking: "Choose a destination before turning in; do not try to browse from the lane.",
    timeCommitment: "1 hour to full afternoon",
    defaultMove: "If the kids need the big attraction, commit. If the group is overloaded, switch to a quieter hub.",
    nextStopPrompt: "On Hwy 12 and overwhelmed? Choose one high-energy stop or leave the strip cleanly.",
  },
  {
    id: "lake-delton-outskirts",
    name: "Lake Delton / Outskirts",
    shortName: "Lake Delton",
    role: "The scenic reset",
    oneLine: "Best for quiet water, vacation-rental groups, scenic resets, and getting away from the strip.",
    bestFor: ["quiet reset", "large groups", "scenic reset plans"],
    friction: "The group often feels marooned once cars, kids, coolers, and dinner timing split apart.",
    parking: "Favor one destination with easy parking instead of stitching together multiple small stops.",
    timeCommitment: "1-3 hours",
    defaultMove: "Use Lake Delton when the strip stops being fun and the group needs a calmer plan.",
    nextStopPrompt: "At a rental or resort edge? Choose food, water, or a scenic reset before driving back in.",
  },
];

export const ACTION_CARDS: ActionCard[] = [
  {
    id: "broadway-walkable-reset",
    hubId: "downtown-broadway",
    title: "Broadway Walkable Reset",
    label: "Best first stop downtown",
    body: "Use downtown when the group needs a low-commitment stop: Riverwalk, oddities, short attractions, and a cleaner reset before the next ticket.",
    parkingFriction: "Moderate",
    timeCommitment: "45-75 min",
    escapeRoute: "If the sidewalks are jammed, leave downtown and reset toward Lake Delton.",
    ctaLabel: "Open downtown intel",
    href: `${DCC_DELLS_URL}?utm_source=welcometothedells&utm_medium=satellite&utm_campaign=dells-next-stop&utm_content=downtown-broadway`,
    handoffType: "dcc",
  },
  {
    id: "upper-dells-boat-window",
    hubId: "downtown-broadway",
    title: "Upper Dells Boat Window",
    label: "River payoff",
    body: "When the group wants the actual sandstone-cliff payoff, prioritize the boat window before more Broadway browsing.",
    parkingFriction: "Moderate",
    timeCommitment: "2 hours",
    escapeRoute: "If tour timing is bad, use the Riverwalk as the no-ticket fallback.",
    ctaLabel: "Check boat tour options",
    href: riverOpsOutbound("classic-upper"),
    handoffType: "controlled_execution",
  },
  {
    id: "parkway-oddity-commit",
    hubId: "parkway",
    title: "Roadside Oddity Commit",
    label: "Fallback only",
    body: "If the controlled river or hub path does not fit, use this as the oddball Parkway fallback. Pick one strong stop and commit.",
    parkingFriction: "High",
    timeCommitment: "45-90 min",
    escapeRoute: "If prices or crowds feel wrong, leave the Parkway and use Lake Delton as the decompression route.",
    ctaLabel: "Use fallback oddity",
    href: riverOpsOutbound("roadside-oddities"),
    handoffType: "marketplace_fallback",
  },
  {
    id: "parkway-roadside-roulette",
    hubId: "parkway",
    title: "Roadside Roulette",
    label: "Quick pull-over",
    body: "Use this when the group wants one oddball stop, not another full-day ticket decision.",
    parkingFriction: "Easy",
    timeCommitment: "30-60 min",
    escapeRoute: "If the lot looks chaotic, keep moving and pick the next stop instead of forcing it.",
    ctaLabel: "Use the Next Stop map",
    href: `${DCC_DELLS_URL}?utm_source=welcometothedells&utm_medium=satellite&utm_campaign=dells-next-stop&utm_content=roadside-roulette`,
    handoffType: "local-intel",
  },
  {
    id: "lake-delton-scenic-reset",
    hubId: "lake-delton-outskirts",
    title: "Lake Delton Scenic Reset",
    label: "Escape the strip",
    body: "Best when everyone is overstimulated and you need water, air, and a quieter plan before the next ticket.",
    parkingFriction: "Easy",
    timeCommitment: "60-120 min",
    escapeRoute: "If group logistics are the real issue, solve the rental-house plan before adding another attraction.",
    ctaLabel: "Open calm-route intel",
    href: `${DCC_DELLS_URL}?utm_source=welcometothedells&utm_medium=satellite&utm_campaign=dells-next-stop&utm_content=lake-delton-reset`,
    handoffType: "dcc",
  },
  {
    id: "vacation-rental-food-drop",
    hubId: "lake-delton-outskirts",
    title: "Feastly Food Drop",
    label: "Owned execution",
    body: "For vacation-rental groups, the winning move may be breakfast or dinner dropped at the house instead of loading everyone back into cars.",
    parkingFriction: "Easy",
    timeCommitment: "Group-dependent",
    escapeRoute: "If the group is already split, route food to the rental before sending everyone back into traffic.",
    ctaLabel: "Reserve a Feastly drop",
    href: `${FEASTLY_DELLS_URL}?utm_source=welcometothedells&utm_medium=satellite&utm_campaign=dells-owned-food-drop&utm_content=lake-delton-food-drop`,
    handoffType: "owned_execution",
  },
];

export function getActionsForHub(hubId: HubId) {
  return ACTION_CARDS.filter((card) => card.hubId === hubId);
}
