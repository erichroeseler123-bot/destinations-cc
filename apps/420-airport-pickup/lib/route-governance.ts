import type { MetadataRoute } from "next";

type PublishState = "draft" | "live_unpromoted" | "indexable" | "promoted";
type NetworkRole = "dcc" | "satellite" | "operator" | "utility";
type HandoffPolicy = "none" | "inbound_only" | "outbound_only" | "bidirectional" | "conditional";

export type RouteGovernanceEntry = {
  path: string;
  publishState: PublishState;
  networkRole: NetworkRole;
  handoffPolicy: HandoffPolicy;
  priority?: number;
  changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
  notes?: string;
};

function createRouteGovernanceIndex(entries: readonly RouteGovernanceEntry[]) {
  const sortedEntries = [...entries].sort((a, b) => a.path.localeCompare(b.path));
  const byPath = new Map<string, RouteGovernanceEntry>();
  const indexablePaths: string[] = [];
  const visiblePaths: string[] = [];

  for (const entry of sortedEntries) {
    byPath.set(entry.path, entry);

    if (entry.publishState === "indexable" || entry.publishState === "promoted") {
      indexablePaths.push(entry.path);
    }

    if (entry.networkRole !== "utility" && entry.publishState !== "draft") {
      visiblePaths.push(entry.path);
    }
  }

  return {
    entries: sortedEntries as readonly RouteGovernanceEntry[],
    indexablePaths,
    visiblePaths,
    get: (pathname: string) => byPath.get(pathname) ?? null,
  };
}

const AIRPORT420_ROUTE_GOVERNANCE = [
  {
    path: "/",
    publishState: "promoted",
    networkRole: "operator",
    handoffPolicy: "bidirectional",
    priority: 1,
    changeFrequency: "weekly",
    notes: "Primary Denver airport-arrival execution surface.",
  },
  {
    path: "/about",
    publishState: "indexable",
    networkRole: "operator",
    handoffPolicy: "none",
    priority: 0.6,
    changeFrequency: "monthly",
  },
  {
    path: "/contact",
    publishState: "indexable",
    networkRole: "utility",
    handoffPolicy: "none",
    priority: 0.5,
    changeFrequency: "monthly",
  },
  {
    path: "/faq",
    publishState: "indexable",
    networkRole: "utility",
    handoffPolicy: "none",
    priority: 0.6,
    changeFrequency: "monthly",
  },
  {
    path: "/privacy-policy",
    publishState: "indexable",
    networkRole: "utility",
    handoffPolicy: "none",
    priority: 0.45,
    changeFrequency: "monthly",
  },
  {
    path: "/terms",
    publishState: "indexable",
    networkRole: "utility",
    handoffPolicy: "none",
    priority: 0.45,
    changeFrequency: "monthly",
  },
  {
    path: "/how-it-works",
    publishState: "indexable",
    networkRole: "operator",
    handoffPolicy: "bidirectional",
    priority: 0.7,
    changeFrequency: "monthly",
  },
  {
    path: "/denver-airport-420-friendly-pickup",
    publishState: "indexable",
    networkRole: "operator",
    handoffPolicy: "bidirectional",
    priority: 0.86,
    changeFrequency: "weekly",
    notes: "Exact DEN 420-friendly pickup entry page feeding the checkout package context.",
  },
  {
    path: "/420-friendly-airport-transport-denver",
    publishState: "indexable",
    networkRole: "operator",
    handoffPolicy: "bidirectional",
    priority: 0.84,
    changeFrequency: "weekly",
    notes: "Broader 420-friendly airport transport entry page comparing standard vs dispensary-stop booking lanes.",
  },
  {
    path: "/denver-airport-pickup",
    publishState: "live_unpromoted",
    networkRole: "operator",
    handoffPolicy: "bidirectional",
    priority: 0.8,
    changeFrequency: "weekly",
  },
  {
    path: "/420-friendly-airport-pickup",
    publishState: "live_unpromoted",
    networkRole: "operator",
    handoffPolicy: "bidirectional",
    priority: 0.8,
    changeFrequency: "weekly",
  },
  {
    path: "/airport-pickup-with-dispensary-stop",
    publishState: "live_unpromoted",
    networkRole: "operator",
    handoffPolicy: "bidirectional",
    priority: 0.75,
    changeFrequency: "weekly",
  },
] as const satisfies readonly RouteGovernanceEntry[];

const AIRPORT420_ROUTE_GOVERNANCE_INDEX = createRouteGovernanceIndex(AIRPORT420_ROUTE_GOVERNANCE);

export const AIRPORT420_INDEXABLE_ROUTE_PATHS = AIRPORT420_ROUTE_GOVERNANCE_INDEX.indexablePaths;

export const AIRPORT420_VISIBLE_ROUTE_PATHS = AIRPORT420_ROUTE_GOVERNANCE_INDEX.visiblePaths;

export function getAirport420RouteGovernance(pathname: string): RouteGovernanceEntry | null {
  return AIRPORT420_ROUTE_GOVERNANCE_INDEX.get(pathname);
}

export function getAirport420RouteGovernanceEntries(): readonly RouteGovernanceEntry[] {
  return AIRPORT420_ROUTE_GOVERNANCE_INDEX.entries;
}
