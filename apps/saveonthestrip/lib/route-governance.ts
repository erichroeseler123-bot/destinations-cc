import type { MetadataRoute } from "next";

export type PublishState = "draft" | "live_unpromoted" | "indexable" | "promoted";
export type NetworkRole = "dcc" | "satellite" | "operator" | "utility";
export type HandoffPolicy =
  | "none"
  | "inbound_only"
  | "outbound_only"
  | "bidirectional"
  | "conditional";

type BaseRouteGovernanceEntry = {
  path: string;
  publishState: PublishState;
  networkRole: NetworkRole;
  handoffPolicy: HandoffPolicy;
};

function appendPath<K extends string>(map: Map<K, string[]>, key: K, path: string) {
  const existing = map.get(key);
  if (existing) {
    existing.push(path);
    return;
  }
  map.set(key, [path]);
}

function createRouteGovernanceIndex<T extends BaseRouteGovernanceEntry>(
  entries: readonly T[],
) {
  const sortedEntries = [...entries].sort((a, b) => a.path.localeCompare(b.path));
  const byPath = new Map<string, T>();
  const publishStatePaths = new Map<PublishState, string[]>();
  const rolePaths = new Map<NetworkRole, string[]>();
  const indexablePaths: string[] = [];
  const visiblePaths: string[] = [];

  for (const entry of sortedEntries) {
    byPath.set(entry.path, entry);
    appendPath(publishStatePaths, entry.publishState, entry.path);
    appendPath(rolePaths, entry.networkRole, entry.path);

    if (entry.publishState === "indexable" || entry.publishState === "promoted") {
      indexablePaths.push(entry.path);
    }

    if (entry.networkRole !== "utility" && entry.publishState !== "draft") {
      visiblePaths.push(entry.path);
    }
  }

  return {
    entries: sortedEntries as readonly T[],
    indexablePaths,
    visiblePaths,
    get: (pathname: string) => byPath.get(pathname) ?? null,
    has: (pathname: string) => byPath.has(pathname),
  };
}
import { getVegasHotelGuides } from "./hotels";
import { VEGAS_TIMESHARE_RESORTS } from "./timeshares";

export type RouteGovernanceEntry = {
  path: string;
  publishState: PublishState;
  networkRole: NetworkRole;
  handoffPolicy: HandoffPolicy;
  priority?: number;
  changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
  notes?: string;
};

const CORE_ROUTE_GOVERNANCE: RouteGovernanceEntry[] = [
  {
    path: "/",
    publishState: "promoted",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 1,
    changeFrequency: "weekly",
  },
  {
    path: "/shows",
    publishState: "promoted",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.9,
    changeFrequency: "weekly",
  },
  {
    path: "/tours",
    publishState: "promoted",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.9,
    changeFrequency: "weekly",
  },
  {
    path: "/deals",
    publishState: "promoted",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.9,
    changeFrequency: "weekly",
  },
  {
    path: "/hotels",
    publishState: "promoted",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.9,
    changeFrequency: "weekly",
  },
  {
    path: "/shows/sphere",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.8,
    changeFrequency: "weekly",
  },
  {
    path: "/free-things",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.75,
    changeFrequency: "monthly",
  },
  {
    path: "/timeshares",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.75,
    changeFrequency: "monthly",
  },
  {
    path: "/about",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "none",
    priority: 0.7,
    changeFrequency: "monthly",
  },
  {
    path: "/contact",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "none",
    priority: 0.55,
    changeFrequency: "monthly",
  },
  {
    path: "/privacy",
    publishState: "indexable",
    networkRole: "utility",
    handoffPolicy: "none",
    priority: 0.55,
    changeFrequency: "monthly",
  },
  {
    path: "/terms",
    publishState: "indexable",
    networkRole: "utility",
    handoffPolicy: "none",
    priority: 0.55,
    changeFrequency: "monthly",
  },
  {
    path: "/handoff/dcc",
    publishState: "live_unpromoted",
    networkRole: "utility",
    handoffPolicy: "inbound_only",
    notes: "Receives DCC continuity payloads into SOTS.",
  },
  {
    path: "/handoff/return",
    publishState: "live_unpromoted",
    networkRole: "utility",
    handoffPolicy: "outbound_only",
    notes: "Returns travelers to DCC or downstream surfaces.",
  },
];

const HOTEL_GUIDE_GOVERNANCE: RouteGovernanceEntry[] = getVegasHotelGuides().map((guide) => ({
  path: `/hotels/${guide.slug}`,
  publishState: "indexable",
  networkRole: "satellite",
  handoffPolicy: "bidirectional",
  priority: 0.8,
  changeFrequency: "weekly",
}));

const TIMESHARE_GUIDE_GOVERNANCE: RouteGovernanceEntry[] = VEGAS_TIMESHARE_RESORTS.map((resort) => ({
  path: `/timeshares/${resort.slug}`,
  publishState: "indexable",
  networkRole: "satellite",
  handoffPolicy: "bidirectional",
  priority: 0.8,
  changeFrequency: "weekly",
}));

const SOTS_ROUTE_GOVERNANCE = [
  ...CORE_ROUTE_GOVERNANCE,
  ...HOTEL_GUIDE_GOVERNANCE,
  ...TIMESHARE_GUIDE_GOVERNANCE,
] as const satisfies readonly RouteGovernanceEntry[];

const SOTS_ROUTE_GOVERNANCE_INDEX = createRouteGovernanceIndex(SOTS_ROUTE_GOVERNANCE);

export const SOTS_INDEXABLE_ROUTE_PATHS = SOTS_ROUTE_GOVERNANCE_INDEX.indexablePaths;

export const SOTS_VISIBLE_ROUTE_PATHS = SOTS_ROUTE_GOVERNANCE_INDEX.visiblePaths;

export function getSotsRouteGovernance(pathname: string): RouteGovernanceEntry | null {
  return SOTS_ROUTE_GOVERNANCE_INDEX.get(pathname);
}

export function getSotsRouteGovernanceEntries(): readonly RouteGovernanceEntry[] {
  return SOTS_ROUTE_GOVERNANCE_INDEX.entries;
}
