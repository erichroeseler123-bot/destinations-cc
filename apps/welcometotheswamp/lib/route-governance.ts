import {
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
  notes?: string;
};

const WTS_ROUTE_GOVERNANCE: readonly RouteGovernanceEntry[] = [
  {
    path: "/",
    publishState: "promoted",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    notes: "Primary visual front door and chooser surface for the swamp lane.",
  },
  {
    path: "/plan",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    notes: "Optional help surface for users who still need narrowing before live options.",
  },
  {
    path: "/best-swamp-tour-new-orleans",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    notes: "Short SEO entry for best swamp tour New Orleans intent.",
  },
  {
    path: "/swamp-tours-new-orleans",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    notes: "Broad SEO entry for swamp tours New Orleans intent.",
  },
  {
    path: "/airboat-swamp-tour-new-orleans",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    notes: "Short SEO entry for airboat swamp tour New Orleans intent.",
  },
  {
    path: "/which-swamp-tour-should-i-choose",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    notes: "Short decision page for swamp tour chooser intent.",
  },
  {
    path: "/airboat-vs-boat",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
  },
  {
    path: "/with-kids",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
  },
  {
    path: "/best-time",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
  },
  {
    path: "/worth-it",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
  },
  {
    path: "/transportation",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
  },
  {
    path: "/types",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
  },
  {
    path: "/about",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "none",
  },
  {
    path: "/contact",
    publishState: "indexable",
    networkRole: "utility",
    handoffPolicy: "none",
  },
  {
    path: "/faq",
    publishState: "indexable",
    networkRole: "utility",
    handoffPolicy: "none",
  },
  {
    path: "/privacy-policy",
    publishState: "indexable",
    networkRole: "utility",
    handoffPolicy: "none",
  },
  {
    path: "/privacy",
    publishState: "indexable",
    networkRole: "utility",
    handoffPolicy: "none",
  },
  {
    path: "/terms",
    publishState: "indexable",
    networkRole: "utility",
    handoffPolicy: "none",
  },
  {
    path: "/editorial-policy",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "none",
  },
  {
    path: "/how-we-rank-tours",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "none",
  },
  {
    path: "/how-it-works",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "none",
  },
  {
    path: "/choose-the-right-tour",
    publishState: "live_unpromoted",
    networkRole: "utility",
    handoffPolicy: "none",
    notes: "Redirect alias to the homepage chooser.",
  },
  {
    path: "/live-options",
    publishState: "live_unpromoted",
    networkRole: "utility",
    handoffPolicy: "none",
    notes: "Live money page; intentionally unpromoted and kept out of the sitemap.",
  },
  {
    path: "/start-here",
    publishState: "live_unpromoted",
    networkRole: "utility",
    handoffPolicy: "none",
    notes: "Redirect alias to the homepage chooser.",
  },
  {
    path: "/from-new-orleans",
    publishState: "live_unpromoted",
    networkRole: "utility",
    handoffPolicy: "none",
    notes: "Redirect alias to /transportation.",
  },
  {
    path: "/plan-your-day",
    publishState: "live_unpromoted",
    networkRole: "utility",
    handoffPolicy: "none",
    notes: "Redirect alias to /plan.",
  },
  {
    path: "/what-its-like",
    publishState: "live_unpromoted",
    networkRole: "utility",
    handoffPolicy: "outbound_only",
    notes: "Redirects to DCC editorial surface.",
  },
] as const;

const WTS_ROUTE_GOVERNANCE_INDEX = createRouteGovernanceIndex(WTS_ROUTE_GOVERNANCE);

export const WTS_INDEXABLE_ROUTE_PATHS = WTS_ROUTE_GOVERNANCE_INDEX.indexablePaths;

export const WTS_VISIBLE_ROUTE_PATHS = WTS_ROUTE_GOVERNANCE_INDEX.visiblePaths;

export function getWtsRouteGovernance(pathname: string): RouteGovernanceEntry | null {
  return WTS_ROUTE_GOVERNANCE_INDEX.get(pathname);
}

export function getWtsRouteGovernanceEntries(): readonly RouteGovernanceEntry[] {
  return WTS_ROUTE_GOVERNANCE_INDEX.entries;
}

export function isWtsIndexableRoutePath(pathname: string): boolean {
  return WTS_INDEXABLE_ROUTE_PATHS.includes(pathname);
}
