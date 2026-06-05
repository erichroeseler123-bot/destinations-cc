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

const SPECIAL_PAGES_ROUTE_GOVERNANCE = [
  {
    path: "/",
    publishState: "promoted",
    networkRole: "dcc",
    handoffPolicy: "none",
    priority: 1,
    changeFrequency: "weekly",
    notes: "Special-pages root entry.",
  },
  {
    path: "/vegas",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "bidirectional",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  {
    path: "/alaska",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "bidirectional",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  {
    path: "/cruises",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "bidirectional",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  {
    path: "/national-parks",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "bidirectional",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  {
    path: "/new-orleans",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "bidirectional",
    priority: 0.8,
    changeFrequency: "monthly",
  },
] as const satisfies readonly RouteGovernanceEntry[];

const SPECIAL_PAGES_ROUTE_GOVERNANCE_INDEX = createRouteGovernanceIndex(
  SPECIAL_PAGES_ROUTE_GOVERNANCE,
);

export const SPECIAL_PAGES_INDEXABLE_ROUTE_PATHS =
  SPECIAL_PAGES_ROUTE_GOVERNANCE_INDEX.indexablePaths;

export function getSpecialPagesRouteGovernance(pathname: string): RouteGovernanceEntry | null {
  return SPECIAL_PAGES_ROUTE_GOVERNANCE_INDEX.get(pathname);
}
