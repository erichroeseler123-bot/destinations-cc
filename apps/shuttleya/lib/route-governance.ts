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

const SHUTTLEYA_ROUTE_GOVERNANCE: readonly RouteGovernanceEntry[] = [
  {
    path: "/",
    publishState: "promoted",
    networkRole: "operator",
    handoffPolicy: "bidirectional",
    priority: 1,
    changeFrequency: "weekly",
    notes: "Standalone Argo execution entry surface.",
  },
  {
    path: "/book/argo-shuttle",
    publishState: "promoted",
    networkRole: "operator",
    handoffPolicy: "bidirectional",
    priority: 0.9,
    changeFrequency: "weekly",
    notes: "Canonical Argo request route expected by DCC decision continuity.",
  },
  {
    path: "/denver-to-argo-shuttle",
    publishState: "live_unpromoted",
    networkRole: "operator",
    handoffPolicy: "bidirectional",
    notes: "Acquisition-style alias kept live but not indexable.",
  },
  {
    path: "/argo-shuttle-schedule",
    publishState: "live_unpromoted",
    networkRole: "operator",
    handoffPolicy: "bidirectional",
    notes: "Acquisition-style alias kept live but not indexable.",
  },
  {
    path: "/mighty-argo-cable-car-shuttle",
    publishState: "live_unpromoted",
    networkRole: "operator",
    handoffPolicy: "bidirectional",
    notes: "Acquisition-style alias kept live but not indexable.",
  },
];

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
