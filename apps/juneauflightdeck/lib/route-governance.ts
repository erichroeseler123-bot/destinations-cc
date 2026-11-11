import type { MetadataRoute } from "next";
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
  priority?: number;
  changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
  notes?: string;
};

const CORE_ROUTE_GOVERNANCE: RouteGovernanceEntry[] = [
  {
    path: "/",
    publishState: "promoted",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 1,
    changeFrequency: "weekly",
    notes: "Primary Juneau & Skagway glacier aviation decision surface.",
  },
  {
    path: "/helicopter",
    publishState: "promoted",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.9,
    changeFrequency: "weekly",
    notes: "Dedicated helicopter lane overview.",
  },
  {
    path: "/juneau/helicopter",
    publishState: "promoted",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.9,
    changeFrequency: "weekly",
    notes: "Juneau glacier helicopter comparison surface.",
  },
  {
    path: "/skagway/helicopter",
    publishState: "promoted",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.88,
    changeFrequency: "weekly",
    notes: "Skagway glacier helicopter comparison surface.",
  },
  {
    path: "/juneau-helicopter-tour-sold-out",
    publishState: "promoted",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.92,
    changeFrequency: "weekly",
    notes: "Sold-out recovery and human concierge availability review entry.",
  },
  {
    path: "/helicopter-waitlist",
    publishState: "promoted",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.9,
    changeFrequency: "weekly",
    notes: "Human concierge availability review request surface.",
  },
  {
    path: "/juneau-dogsled-helicopter-tours",
    publishState: "indexable",
    networkRole: "operator",
    handoffPolicy: "bidirectional",
    priority: 0.85,
    changeFrequency: "weekly",
    notes: "Juneau & Skagway glacier helicopter dog-sledding decision surface.",
  },
  {
    path: "/temsco-vs-coastal-vs-northstar-juneau",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.88,
    changeFrequency: "weekly",
  },
  {
    path: "/temsco-vs-northstar-juneau",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.85,
    changeFrequency: "weekly",
  },
  {
    path: "/temsco-vs-coastal-juneau",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.85,
    changeFrequency: "weekly",
  },
  {
    path: "/best-time-for-glacier-dog-sledding-juneau",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.84,
    changeFrequency: "weekly",
  },
  {
    path: "/juneau-helicopter-tour-weight-limits-and-seating",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.84,
    changeFrequency: "weekly",
  },
  {
    path: "/juneau-glacier-flight-weather",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.84,
    changeFrequency: "weekly",
  },
  {
    path: "/tools",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.82,
    changeFrequency: "weekly",
  },
  {
    path: "/what-to-do-in-juneau-cruise-port",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.78,
    changeFrequency: "weekly",
  },
  {
    path: "/juneau/what-to-do-if-helicopter-tour-canceled",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "outbound_only",
    priority: 0.8,
    changeFrequency: "weekly",
    notes: "Broken-plan recovery page for weather-canceled helicopter buyers who need a same-day replacement.",
  },
  {
    path: "/juneau/cruise-excursions-vs-independent",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "outbound_only",
    priority: 0.8,
    changeFrequency: "weekly",
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
    priority: 0.55,
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
];

const JFD_ROUTE_GOVERNANCE = [...CORE_ROUTE_GOVERNANCE] as const satisfies readonly RouteGovernanceEntry[];

const JFD_ROUTE_GOVERNANCE_INDEX = createRouteGovernanceIndex(JFD_ROUTE_GOVERNANCE);

export const JFD_INDEXABLE_ROUTE_PATHS = JFD_ROUTE_GOVERNANCE_INDEX.indexablePaths;

export const JFD_VISIBLE_ROUTE_PATHS = JFD_ROUTE_GOVERNANCE_INDEX.visiblePaths;

export function getJfdRouteGovernance(pathname: string): RouteGovernanceEntry | null {
  return JFD_ROUTE_GOVERNANCE_INDEX.get(pathname);
}

export function getJfdRouteGovernanceEntries(): readonly RouteGovernanceEntry[] {
  return JFD_ROUTE_GOVERNANCE_INDEX.entries;
}
