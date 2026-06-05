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

export type RouteGovernanceEntry = {
  path: string;
  publishState: PublishState;
  networkRole: NetworkRole;
  handoffPolicy: HandoffPolicy;
  priority?: number;
  changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
  notes?: string;
};

const RRFP_ROUTE_GOVERNANCE = [
  {
    path: "/",
    publishState: "promoted",
    networkRole: "operator",
    handoffPolicy: "bidirectional",
    priority: 1,
    changeFrequency: "weekly",
    notes: "Public fast-pass homepage.",
  },
  {
    path: "/checkout",
    publishState: "live_unpromoted",
    networkRole: "utility",
    handoffPolicy: "bidirectional",
    notes: "Execution route; intentionally excluded from sitemap.",
  },
  {
    path: "/handoff/dcc",
    publishState: "live_unpromoted",
    networkRole: "utility",
    handoffPolicy: "inbound_only",
    notes: "Receives DCC continuity payloads.",
  },
  {
    path: "/handoff/partner/partyatredrocks",
    publishState: "live_unpromoted",
    networkRole: "utility",
    handoffPolicy: "bidirectional",
    notes: "Partner handoff route into Party at Red Rocks.",
  },
  {
    path: "/handoff/return",
    publishState: "live_unpromoted",
    networkRole: "utility",
    handoffPolicy: "outbound_only",
    notes: "Returns users to upstream context.",
  },
] as const satisfies readonly RouteGovernanceEntry[];

const RRFP_ROUTE_GOVERNANCE_INDEX = createRouteGovernanceIndex(RRFP_ROUTE_GOVERNANCE);

export const RRFP_INDEXABLE_ROUTE_PATHS = RRFP_ROUTE_GOVERNANCE_INDEX.indexablePaths;

export const RRFP_VISIBLE_ROUTE_PATHS = RRFP_ROUTE_GOVERNANCE_INDEX.visiblePaths;

export function getRrfpRouteGovernance(pathname: string): RouteGovernanceEntry | null {
  return RRFP_ROUTE_GOVERNANCE_INDEX.get(pathname);
}

export function getRrfpRouteGovernanceEntries(): readonly RouteGovernanceEntry[] {
  return RRFP_ROUTE_GOVERNANCE_INDEX.entries;
}
