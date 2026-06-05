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

const LAKE_TAHOE_ROUTE_GOVERNANCE = [
  {
    path: "/",
    publishState: "promoted",
    networkRole: "operator",
    handoffPolicy: "bidirectional",
    priority: 1,
    changeFrequency: "weekly",
    notes: "Primary Tahoe transport execution surface.",
  },
] as const satisfies readonly RouteGovernanceEntry[];

const LAKE_TAHOE_ROUTE_GOVERNANCE_INDEX = createRouteGovernanceIndex(LAKE_TAHOE_ROUTE_GOVERNANCE);

export const LAKE_TAHOE_INDEXABLE_ROUTE_PATHS = LAKE_TAHOE_ROUTE_GOVERNANCE_INDEX.indexablePaths;

export const LAKE_TAHOE_VISIBLE_ROUTE_PATHS = LAKE_TAHOE_ROUTE_GOVERNANCE_INDEX.visiblePaths;

export function getLakeTahoeRouteGovernance(pathname: string): RouteGovernanceEntry | null {
  return LAKE_TAHOE_ROUTE_GOVERNANCE_INDEX.get(pathname);
}

export function getLakeTahoeRouteGovernanceEntries(): readonly RouteGovernanceEntry[] {
  return LAKE_TAHOE_ROUTE_GOVERNANCE_INDEX.entries;
}
