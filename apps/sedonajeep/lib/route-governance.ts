import type { MetadataRoute } from "next";
import {
  createRouteGovernanceIndex,
  type HandoffPolicy,
  type NetworkRole,
  type PublishState,
} from "../../../lib/route-governance";

export type RouteGovernanceEntry = {
  path: string;
  publishState: PublishState;
  networkRole: NetworkRole;
  handoffPolicy: HandoffPolicy;
  priority?: number;
  changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
  notes?: string;
};

const SEDONA_ROUTE_GOVERNANCE = [
  {
    path: "/",
    publishState: "promoted",
    networkRole: "operator",
    handoffPolicy: "bidirectional",
    priority: 1,
    changeFrequency: "weekly",
    notes: "Primary Sedona jeep-tour execution surface.",
  },
] as const satisfies readonly RouteGovernanceEntry[];

const SEDONA_ROUTE_GOVERNANCE_INDEX = createRouteGovernanceIndex(SEDONA_ROUTE_GOVERNANCE);

export const SEDONA_INDEXABLE_ROUTE_PATHS = SEDONA_ROUTE_GOVERNANCE_INDEX.indexablePaths;

export const SEDONA_VISIBLE_ROUTE_PATHS = SEDONA_ROUTE_GOVERNANCE_INDEX.visiblePaths;

export function getSedonaRouteGovernance(pathname: string): RouteGovernanceEntry | null {
  return SEDONA_ROUTE_GOVERNANCE_INDEX.get(pathname);
}

export function getSedonaRouteGovernanceEntries(): readonly RouteGovernanceEntry[] {
  return SEDONA_ROUTE_GOVERNANCE_INDEX.entries;
}
