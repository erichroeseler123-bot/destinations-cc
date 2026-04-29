import type { MetadataRoute } from "next";
import {
  createRouteGovernanceIndex,
  type HandoffPolicy,
  type NetworkRole,
  type PublishState,
} from "./route-governance-core";

export {
  createRouteGovernanceIndex,
  type HandoffPolicy,
  type NetworkRole,
  type PublishState,
} from "./route-governance-core";

export type RouteGovernanceEntry = {
  path: string;
  publishState: PublishState;
  networkRole: NetworkRole;
  handoffPolicy: HandoffPolicy;
  priority?: number;
  changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
  notes?: string;
};

const SHUTTLEYA_ROUTE_GOVERNANCE: readonly RouteGovernanceEntry[] = [];

const SHUTTLEYA_ROUTE_GOVERNANCE_INDEX = createRouteGovernanceIndex(SHUTTLEYA_ROUTE_GOVERNANCE);

export const SHUTTLEYA_INDEXABLE_ROUTE_PATHS = SHUTTLEYA_ROUTE_GOVERNANCE_INDEX.indexablePaths;

export const SHUTTLEYA_VISIBLE_ROUTE_PATHS = SHUTTLEYA_ROUTE_GOVERNANCE_INDEX.entries
  .filter((entry) => entry.publishState === "promoted" && entry.networkRole === "operator")
  .map((entry) => entry.path);

export function getShuttleyaRouteGovernance(pathname: string): RouteGovernanceEntry | null {
  return SHUTTLEYA_ROUTE_GOVERNANCE_INDEX.get(pathname);
}

export function getShuttleyaRouteGovernanceEntries(): readonly RouteGovernanceEntry[] {
  return SHUTTLEYA_ROUTE_GOVERNANCE_INDEX.entries;
}
