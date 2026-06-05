import type { MetadataRoute } from "next";
import {
  createRouteGovernanceIndex,
  type HandoffPolicy,
  type NetworkRole,
  type PublishState,
} from "./sharedRouteGovernance";

export type RouteGovernanceEntry = {
  path: string;
  publishState: PublishState;
  networkRole: NetworkRole;
  handoffPolicy: HandoffPolicy;
  priority?: number;
  changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
  notes?: string;
};

const GOSNO_ROUTE_GOVERNANCE = [
  {
    path: "/",
    publishState: "promoted",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 1,
    changeFrequency: "weekly",
    notes: "Primary GoSno mountain-route intake surface.",
  },
  {
    path: "/book",
    publishState: "live_unpromoted",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    notes: "Guided continuation flow, not meant to rank independently.",
  },
  {
    path: "/destinations",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.92,
    changeFrequency: "weekly",
    notes: "Destination hub listing the operator execution pages.",
  },
  {
    path: "/services",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.8,
    changeFrequency: "monthly",
    notes: "Service hub supporting airport, return, and group lanes.",
  },
  {
    path: "/about",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.6,
    changeFrequency: "monthly",
  },
  {
    path: "/faq",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.6,
    changeFrequency: "monthly",
  },
  {
    path: "/contact",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.6,
    changeFrequency: "monthly",
  },
  {
    path: "/blog",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.55,
    changeFrequency: "monthly",
  },
  {
    path: "/airport-shuttle",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.78,
    changeFrequency: "monthly",
  },
  {
    path: "/black-hawk",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.72,
    changeFrequency: "monthly",
  },
  {
    path: "/denver-to-breckenridge",
    publishState: "promoted",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.98,
    changeFrequency: "weekly",
    notes: "Canonical Breckenridge money page preserving Denver-to-destination query intent.",
  },
  {
    path: "/denver-to-breckenridge-shuttle",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.9,
    changeFrequency: "weekly",
    notes: "Exact shuttle-intent Breckenridge entry page feeding route=breckenridge into booking.",
  },
  {
    path: "/denver-airport-to-breckenridge",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.88,
    changeFrequency: "weekly",
    notes: "DEN airport to Breckenridge entry page feeding pickup and route context into booking.",
  },
  {
    path: "/breckenridge",
    publishState: "live_unpromoted",
    networkRole: "utility",
    handoffPolicy: "bidirectional",
    notes: "Compatibility alias that redirects to canonical Denver-to-Breckenridge route.",
  },
  {
    path: "/breckenridge-shuttle",
    publishState: "live_unpromoted",
    networkRole: "utility",
    handoffPolicy: "bidirectional",
    notes: "Legacy alias route that should redirect into canonical Breckenridge path.",
  },
  {
    path: "/breckenridge/index.html",
    publishState: "live_unpromoted",
    networkRole: "utility",
    handoffPolicy: "bidirectional",
    notes: "Legacy filesystem-style alias that redirects to canonical Denver-to-Breckenridge route.",
  },
  {
    path: "/keystone",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.85,
    changeFrequency: "weekly",
  },
  {
    path: "/vail",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.9,
    changeFrequency: "weekly",
  },
  {
    path: "/denver-to-vail-shuttle",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.88,
    changeFrequency: "weekly",
    notes: "Exact Denver to Vail shuttle entry page feeding route=vail into booking.",
  },
  {
    path: "/copper",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.84,
    changeFrequency: "weekly",
    notes: "Copper Mountain execution page with clean public slug.",
  },
  {
    path: "/steamboat",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.84,
    changeFrequency: "weekly",
    notes: "Steamboat Springs execution page with clean public slug.",
  },
  {
    path: "/beaver-creek",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.8,
    changeFrequency: "weekly",
  },
  {
    path: "/winter-park",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.8,
    changeFrequency: "weekly",
  },
  {
    path: "/copper-mountain",
    publishState: "live_unpromoted",
    networkRole: "utility",
    handoffPolicy: "bidirectional",
    notes: "Legacy long-form Copper Mountain slug retained for compatibility.",
  },
  {
    path: "/aspen",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.85,
    changeFrequency: "weekly",
  },
  {
    path: "/snowmass",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.8,
    changeFrequency: "weekly",
  },
  {
    path: "/steamboat-springs",
    publishState: "live_unpromoted",
    networkRole: "utility",
    handoffPolicy: "bidirectional",
    notes: "Legacy long-form Steamboat Springs slug retained for compatibility.",
  },
  {
    path: "/services/airport-shuttle",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.64,
    changeFrequency: "monthly",
  },
  {
    path: "/denver-airport-shuttle-to-ski-resorts",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.86,
    changeFrequency: "weekly",
    notes: "Broad DEN airport to ski resorts entry page pushing users into route choice and booking.",
  },
  {
    path: "/services/return-shuttle",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.6,
    changeFrequency: "monthly",
  },
  {
    path: "/services/round-trip",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.6,
    changeFrequency: "monthly",
  },
  {
    path: "/services/black-hawk-shuttle",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.58,
    changeFrequency: "monthly",
  },
  {
    path: "/services/group-transport",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.58,
    changeFrequency: "monthly",
  },
  {
    path: "/privacy-policy",
    publishState: "indexable",
    networkRole: "utility",
    handoffPolicy: "bidirectional",
    priority: 0.2,
    changeFrequency: "yearly",
  },
  {
    path: "/terms-and-conditions",
    publishState: "indexable",
    networkRole: "utility",
    handoffPolicy: "bidirectional",
    priority: 0.2,
    changeFrequency: "yearly",
  },
  {
    path: "/cancellation-policy",
    publishState: "indexable",
    networkRole: "utility",
    handoffPolicy: "bidirectional",
    priority: 0.2,
    changeFrequency: "yearly",
  },
] as const satisfies readonly RouteGovernanceEntry[];

const GOSNO_ROUTE_GOVERNANCE_INDEX = createRouteGovernanceIndex(GOSNO_ROUTE_GOVERNANCE);

export const GOSNO_INDEXABLE_ROUTE_PATHS = GOSNO_ROUTE_GOVERNANCE_INDEX.indexablePaths;
export const GOSNO_VISIBLE_ROUTE_PATHS = GOSNO_ROUTE_GOVERNANCE_INDEX.visiblePaths;

export function getGosnoRouteGovernance(pathname: string): RouteGovernanceEntry | null {
  return GOSNO_ROUTE_GOVERNANCE_INDEX.get(pathname);
}

export function getGosnoRouteGovernanceEntries(): readonly RouteGovernanceEntry[] {
  return GOSNO_ROUTE_GOVERNANCE_INDEX.entries;
}
