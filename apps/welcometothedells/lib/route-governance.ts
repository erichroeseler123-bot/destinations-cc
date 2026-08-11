import type { MetadataRoute } from "next";

export type PublishState = "draft" | "live_unpromoted" | "indexable" | "promoted";
export type NetworkRole = "dcc" | "satellite" | "operator" | "utility";
export type HandoffPolicy =
  | "none"
  | "inbound_only"
  | "outbound_only"
  | "bidirectional"
  | "conditional";

export type RouteGovernanceEntry = {
  path: string;
  publishState: PublishState;
  networkRole: NetworkRole;
  handoffPolicy: HandoffPolicy;
  priority?: number;
  changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
  notes?: string;
};

const WELCOME_TO_THE_DELLS_ROUTE_GOVERNANCE = [
  {
    path: "/",
    publishState: "promoted",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 1,
    changeFrequency: "weekly",
    notes: "Primary consumer Wisconsin Dells discovery and decision surface.",
  },
  {
    path: "/things-to-do",
    publishState: "promoted",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.95,
    changeFrequency: "weekly",
    notes: "High-intent Wisconsin Dells activity discovery hub.",
  },
  {
    path: "/boat-tours",
    publishState: "promoted",
    networkRole: "satellite",
    handoffPolicy: "outbound_only",
    priority: 0.94,
    changeFrequency: "weekly",
    notes: "Commercial river and boat-tour comparison surface with controlled operator exits.",
  },
  {
    path: "/waterparks",
    publishState: "promoted",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.92,
    changeFrequency: "weekly",
    notes: "Waterpark decision guide covering indoor, outdoor, resort, and day-use planning intent.",
  },
  {
    path: "/first-time",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.88,
    changeFrequency: "monthly",
    notes: "First-visit Wisconsin Dells planning guide.",
  },
  {
    path: "/rainy-day",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.86,
    changeFrequency: "monthly",
    notes: "Rainy-day and indoor Wisconsin Dells planning guide.",
  },
  {
    path: "/families",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.86,
    changeFrequency: "monthly",
    notes: "Family Wisconsin Dells trip-planning guide.",
  },
  {
    path: "/adults",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.84,
    changeFrequency: "monthly",
    notes: "Adults-only and couples Wisconsin Dells planning guide.",
  },
  {
    path: "/tonight",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "outbound_only",
    priority: 0.84,
    changeFrequency: "weekly",
    notes: "Same-day and tonight decision surface.",
  },
  {
    path: "/large-groups",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "outbound_only",
    priority: 0.82,
    changeFrequency: "monthly",
    notes: "Large-group activity and meal logistics guide.",
  },
  {
    path: "/downtown",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.8,
    changeFrequency: "monthly",
    notes: "Downtown and Broadway area guide.",
  },
  {
    path: "/parkway",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.8,
    changeFrequency: "monthly",
    notes: "Wisconsin Dells Parkway activity corridor guide.",
  },
  {
    path: "/lake-delton",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.8,
    changeFrequency: "monthly",
    notes: "Lake Delton resort and group-planning guide.",
  },
  {
    path: "/lounge",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "outbound_only",
    priority: 0.74,
    changeFrequency: "weekly",
    notes: "Editorial section for supper clubs, neon, after-hours moves, and river handoffs.",
  },
  {
    path: "/river-ops/jet-boat-adventures",
    publishState: "live_unpromoted",
    networkRole: "operator",
    handoffPolicy: "outbound_only",
    priority: 0.72,
    changeFrequency: "weekly",
    notes:
      "Execution-adjacent confirmation surface for the jet-boat-primary River Ops decision. Held out of sitemap promotion until visual and telemetry review passes.",
  },
] as const satisfies readonly RouteGovernanceEntry[];

function createRouteGovernanceIndex<T extends { path: string; publishState: PublishState; networkRole: NetworkRole }>(
  entries: readonly T[],
) {
  const sortedEntries = [...entries].sort((a, b) => a.path.localeCompare(b.path));
  const byPath = new Map(sortedEntries.map((entry) => [entry.path, entry]));
  const indexablePaths = sortedEntries
    .filter((entry) => entry.publishState === "indexable" || entry.publishState === "promoted")
    .map((entry) => entry.path);
  const visiblePaths = sortedEntries
    .filter((entry) => entry.networkRole !== "utility" && entry.publishState !== "draft")
    .map((entry) => entry.path);

  return {
    entries: sortedEntries as readonly T[],
    indexablePaths,
    visiblePaths,
    get: (pathname: string) => byPath.get(pathname) ?? null,
  };
}

const WELCOME_TO_THE_DELLS_ROUTE_GOVERNANCE_INDEX = createRouteGovernanceIndex(
  WELCOME_TO_THE_DELLS_ROUTE_GOVERNANCE,
);

export const WELCOME_TO_THE_DELLS_INDEXABLE_ROUTE_PATHS =
  WELCOME_TO_THE_DELLS_ROUTE_GOVERNANCE_INDEX.indexablePaths;

export const WELCOME_TO_THE_DELLS_VISIBLE_ROUTE_PATHS =
  WELCOME_TO_THE_DELLS_ROUTE_GOVERNANCE_INDEX.visiblePaths;

export function getWelcomeToTheDellsRouteGovernance(pathname: string): RouteGovernanceEntry | null {
  return WELCOME_TO_THE_DELLS_ROUTE_GOVERNANCE_INDEX.get(pathname);
}

export function getWelcomeToTheDellsRouteGovernanceEntries(): readonly RouteGovernanceEntry[] {
  return WELCOME_TO_THE_DELLS_ROUTE_GOVERNANCE_INDEX.entries;
}
