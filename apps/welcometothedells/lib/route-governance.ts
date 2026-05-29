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
    notes: "Primary Wisconsin Dells Next Stop operating surface.",
  },
  {
    path: "/lounge",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "outbound_only",
    priority: 0.82,
    changeFrequency: "weekly",
    notes: "Editorial newspaper section for supper clubs, neon, after-hours moves, and river handoffs.",
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
