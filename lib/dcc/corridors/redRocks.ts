import type {
  CorridorAuditPageConfig,
  CorridorCommandBinding,
  CorridorDecisionCard,
  CorridorHandoffTarget,
  CorridorManifest,
  CorridorNavigationLink,
  CorridorRouteConfig,
  CorridorRouteRole,
} from "@/lib/dcc/corridors/types";

const CANONICAL_SHARED_EXECUTION_TARGET =
  "https://www.partyatredrocks.com/book/red-rocks-amphitheatre/custom/shared";
const CANONICAL_PRIVATE_EXECUTION_TARGET =
  "https://www.partyatredrocks.com/book/red-rocks-amphitheatre/private";

const handoffTargets: CorridorHandoffTarget[] = [
  {
    id: "shared",
    href: CANONICAL_SHARED_EXECUTION_TARGET,
    mode: "shared",
    satelliteId: "partyatredrocks",
    venueSlug: "red-rocks-amphitheatre",
    notes: "Canonical shared shuttle handoff for Red Rocks transport.",
    isCanonical: true,
  },
  {
    id: "private",
    href: CANONICAL_PRIVATE_EXECUTION_TARGET,
    mode: "private",
    satelliteId: "partyatredrocks",
    venueSlug: "red-rocks-amphitheatre",
    notes: "Canonical private ride handoff for Red Rocks transport.",
    isCanonical: true,
  },
];

const commandBinding: CorridorCommandBinding = {
  corridorId: "denver-red-rocks",
  satelliteId: "partyatredrocks",
  venueSlug: "red-rocks-amphitheatre",
};

const relatedGuides: CorridorNavigationLink[] = [
  { href: "/red-rocks-transportation", label: "Transportation hub" },
  { href: "/red-rocks-shuttle-vs-uber", label: "Shuttle vs Uber" },
  { href: "/how-to-get-to-red-rocks-without-parking-hassle", label: "No parking hassle" },
  { href: "/how-to-leave-red-rocks-after-a-concert", label: "Best way to leave" },
];

const decisionCards: CorridorDecisionCard[] = [
  {
    href: "/red-rocks-transportation",
    title: "Make the transport decision",
    body: "Use this when you want the parent answer on what usually works best before you book.",
    label: "Decision hub",
  },
  {
    href: "/red-rocks-shuttle-vs-uber",
    title: "Resolve the rideshare question",
    body: "Use this when the real comparison is shuttle versus the post-show pickup mess.",
    label: "Rideshare lane",
  },
  {
    href: "/how-to-get-to-red-rocks-without-parking-hassle",
    title: "Remove parking from the night",
    body: "Use this when parking is already the problem and you want the cleanest way around it.",
    label: "Parking lane",
  },
  {
    href: "/how-to-leave-red-rocks-after-a-concert",
    title: "Solve the exit plan",
    body: "Use this when the real concern is how the night ends once everyone tries to leave at once.",
    label: "Exit lane",
  },
];

const auditPages: CorridorAuditPageConfig[] = [
  {
    route: "/red-rocks-transportation",
    file: "app/red-rocks-transportation/page.tsx",
    alias: "rr-transportation",
    role: "hub",
    expectedRegistryTarget: CANONICAL_SHARED_EXECUTION_TARGET,
    requiredUrlCtas: ["primary", "notice-primary"],
    requiredTelemetryCtas: ["notice-primary"],
    minParrCtaLinks: 1,
    requireHubFallback: false,
  },
  {
    route: "/red-rocks-shuttle-vs-uber",
    file: "app/red-rocks-shuttle-vs-uber/page.tsx",
    alias: "rr-shuttle-vs-uber",
    role: "feeder",
    expectedRegistryTarget: "/red-rocks-transportation",
    requiredUrlCtas: ["primary", "recommendation-primary"],
    requiredTelemetryCtas: ["primary", "recommendation-primary"],
    minParrCtaLinks: 2,
    requireHubFallback: true,
  },
  {
    route: "/how-to-get-to-red-rocks-without-parking-hassle",
    file: "app/how-to-get-to-red-rocks-without-parking-hassle/page.tsx",
    alias: "rr-no-parking",
    role: "feeder",
    expectedRegistryTarget: "/red-rocks-transportation",
    requiredUrlCtas: ["primary", "recommendation-primary"],
    requiredTelemetryCtas: ["primary", "recommendation-primary"],
    minParrCtaLinks: 2,
    requireHubFallback: true,
  },
  {
    route: "/how-to-leave-red-rocks-after-a-concert",
    file: "app/how-to-leave-red-rocks-after-a-concert/page.tsx",
    alias: "rr-leave",
    role: "feeder",
    expectedRegistryTarget: "/red-rocks-transportation",
    requiredUrlCtas: ["primary", "recommendation-primary"],
    requiredTelemetryCtas: ["primary", "recommendation-primary"],
    minParrCtaLinks: 2,
    requireHubFallback: true,
  },
];

export const RED_ROCKS_CORRIDOR: CorridorManifest = {
  id: "red-rocks-transport",
  canonicalHubRoute: "/red-rocks-transportation",
  handoff: {
    approvedParams: [
      "src",
      "page",
      "cta",
      "qty",
      "partySize",
      "date",
      "event",
      "artist",
      "venue",
      "dcc_handoff_id",
      "decision_state",
      "decision_surface",
      "destination_surface",
      "decision_corridor",
      "decision_cta",
      "decision_action",
      "decision_entry",
      "decision_policy",
      "decision_option",
      "decision_product",
    ],
    forbiddenLegacyParams: ["source", "source_page", "sourcePage", "intent", "topic", "subtype", "product"],
    targets: handoffTargets,
  },
  command: commandBinding,
  relatedGuides,
  decisionCards,
  audit: {
    pages: auditPages,
    shellFile: "app/components/dcc/RedRocksAuthorityPage.tsx",
  },
  routes: [
    {
      route: "/red-rocks-transportation",
      role: "hub",
      target: CANONICAL_SHARED_EXECUTION_TARGET,
      pageParamAlias: "rr-transportation",
      notes: "Canonical Red Rocks transportation decision hub.",
    },
    {
      route: "/red-rocks-shuttle-vs-uber",
      role: "feeder",
      target: "/red-rocks-transportation",
      pageParamAlias: "rr-shuttle-vs-uber",
      notes: "Constraint page for shuttle-versus-rideshare intent only.",
    },
    {
      route: "/how-to-get-to-red-rocks-without-parking-hassle",
      role: "feeder",
      target: "/red-rocks-transportation",
      pageParamAlias: "rr-no-parking",
      notes: "Constraint page for parking-friction intent only.",
    },
    {
      route: "/best-way-to-leave-red-rocks",
      role: "redirect",
      target: "/how-to-leave-red-rocks-after-a-concert",
      pageParamAlias: "rr-leave",
      notes: "Legacy exit-intent route redirected into the newer exit page.",
    },
    {
      route: "/how-to-leave-red-rocks-after-a-concert",
      role: "feeder",
      target: "/red-rocks-transportation",
      pageParamAlias: "rr-leave",
      notes: "Constraint page for post-show exit friction.",
    },
    {
      route: "/best-way-to-get-to-red-rocks-from-denver",
      role: "feeder",
      target: "/red-rocks-transportation",
      notes: "Constraint page for Denver-origin planning intent.",
    },
    {
      route: "/private-vs-shared-shuttles-to-red-rocks-denver-guide",
      role: "feeder",
      target: "/red-rocks-transportation",
      notes: "Constraint page for ride-type selection only.",
    },
    {
      route: "/guide/local/denver-pickups",
      role: "feeder",
      target: "/red-rocks-transportation",
      notes: "Constraint page for pickup-anchor planning only.",
    },
    {
      route: "/red-rocks-parking",
      role: "feeder",
      target: "/red-rocks-transportation",
      notes: "Parking-specific feeder only.",
    },
    {
      route: "/red-rocks-shuttle",
      role: "feeder",
      target: "/red-rocks-transportation",
      notes: "Shuttle-intent feeder only.",
    },
    {
      route: "/red-rocks",
      role: "support",
      target: "/red-rocks-transportation",
      notes: "Broad venue authority page, not a second transport hub.",
    },
    {
      route: "/red-rocks-complete-guide",
      role: "support",
      target: "/red-rocks-transportation",
      notes: "Broad venue guide, not a transport decision page.",
    },
    {
      route: "/red-rocks-concert-guide",
      role: "support",
      target: "/red-rocks-transportation",
      notes: "Concert planning support page.",
    },
    {
      route: "/red-rocks-events",
      role: "support",
      target: "/red-rocks-transportation",
      notes: "Event discovery surface that should hand off transport-intent users into the hub.",
    },
    {
      route: "/book/red-rocks",
      role: "execution_alias",
      target: CANONICAL_SHARED_EXECUTION_TARGET,
      notes: "Legacy DCC shared booking alias.",
    },
    {
      route: "/book/red-rocks-amphitheatre",
      role: "execution_alias",
      target: CANONICAL_SHARED_EXECUTION_TARGET,
      notes: "Legacy DCC shared booking alias.",
    },
    {
      route: "/book/red-rocks-amphitheatre/private",
      role: "execution_alias",
      target: CANONICAL_PRIVATE_EXECUTION_TARGET,
      notes: "Legacy DCC private booking alias.",
    },
  ],
};

export const RED_ROCKS_PAGE_PARAM_MAP = Object.fromEntries(
  RED_ROCKS_CORRIDOR.routes
    .filter((route) => route.pageParamAlias)
    .map((route) => [route.route, route.pageParamAlias!])
) as Record<string, string>;

export function getRedRocksCorridorRoute(route: string): CorridorRouteConfig | undefined {
  return RED_ROCKS_CORRIDOR.routes.find((entry) => entry.route === route);
}

export function getRedRocksCorridorRoutesByRole(role: CorridorRouteRole): CorridorRouteConfig[] {
  return RED_ROCKS_CORRIDOR.routes.filter((entry) => entry.role === role);
}

export function getRedRocksHandoffTarget(targetId: string): CorridorHandoffTarget | undefined {
  return RED_ROCKS_CORRIDOR.handoff.targets.find((target) => target.id === targetId);
}

export function getRedRocksPageParamAlias(route: string): string {
  return RED_ROCKS_PAGE_PARAM_MAP[route] ?? route.replace(/^\/+/, "");
}

export const RED_ROCKS_CANONICAL_SHARED_TARGET = CANONICAL_SHARED_EXECUTION_TARGET;
export const RED_ROCKS_CANONICAL_PRIVATE_TARGET = CANONICAL_PRIVATE_EXECUTION_TARGET;
export const RED_ROCKS_HANDOFF_TARGETS = handoffTargets;
