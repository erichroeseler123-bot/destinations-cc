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
    networkRole: "satellite",
    handoffPolicy: "outbound_only",
    priority: 1,
    changeFrequency: "monthly",
    notes: "Transportation discovery and operator-routing entry surface. ShuttleYa is not a carrier.",
  },
  {
    path: "/airport-shuttles",
    publishState: "promoted",
    networkRole: "satellite",
    handoffPolicy: "outbound_only",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  {
    path: "/ski-shuttles",
    publishState: "promoted",
    networkRole: "satellite",
    handoffPolicy: "outbound_only",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  {
    path: "/concert-transportation",
    publishState: "promoted",
    networkRole: "satellite",
    handoffPolicy: "outbound_only",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  {
    path: "/cruise-port-transportation",
    publishState: "promoted",
    networkRole: "satellite",
    handoffPolicy: "outbound_only",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  {
    path: "/book/argo-shuttle",
    publishState: "draft",
    networkRole: "utility",
    handoffPolicy: "none",
    notes: "Retired legacy service. Must not accept bookings or payment.",
  },
];

const SHUTTLEYA_ROUTE_GOVERNANCE_INDEX = createRouteGovernanceIndex(SHUTTLEYA_ROUTE_GOVERNANCE);

export const SHUTTLEYA_INDEXABLE_ROUTE_PATHS = SHUTTLEYA_ROUTE_GOVERNANCE_INDEX.indexablePaths;

export const SHUTTLEYA_VISIBLE_ROUTE_PATHS = SHUTTLEYA_ROUTE_GOVERNANCE_INDEX.entries
  .filter((entry) => entry.publishState === "promoted" && entry.networkRole === "satellite")
  .map((entry) => entry.path);

export function getShuttleyaRouteGovernance(pathname: string): RouteGovernanceEntry | null {
  return SHUTTLEYA_ROUTE_GOVERNANCE_INDEX.get(pathname);
}

export function getShuttleyaRouteGovernanceEntries(): readonly RouteGovernanceEntry[] {
  return SHUTTLEYA_ROUTE_GOVERNANCE_INDEX.entries;
}
