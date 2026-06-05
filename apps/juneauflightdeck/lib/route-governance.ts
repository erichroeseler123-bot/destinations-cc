import type { MetadataRoute } from "next";
import {
  createRouteGovernanceIndex,
  type HandoffPolicy,
  type NetworkRole,
  type PublishState,
} from "./route-governance-core";
import { curatedTours } from "./site-data";

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
    notes: "Primary Juneau helicopter chooser surface.",
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
    notes: "Juneau next-48-hours helicopter availability surface.",
  },
  {
    path: "/skagway/helicopter",
    publishState: "promoted",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.88,
    changeFrequency: "weekly",
    notes: "Skagway next-48-hours helicopter availability surface.",
  },
  {
    path: "/best-excursions-in-juneau",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.86,
    changeFrequency: "weekly",
    notes: "Short decision entry for best Juneau excursions intent.",
  },
  {
    path: "/juneau-whale-watching-tours",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.86,
    changeFrequency: "weekly",
    notes: "Short decision entry for Juneau whale watching tour intent.",
  },
  {
    path: "/helicopter-vs-whale-watching-juneau",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.84,
    changeFrequency: "weekly",
    notes: "Short comparison entry for helicopter vs whale watching intent.",
  },
  {
    path: "/what-to-do-in-juneau-cruise-port",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "bidirectional",
    priority: 0.84,
    changeFrequency: "weekly",
    notes: "Short cruise-port entry for what to do in Juneau intent.",
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
    notes:
      "Anchor decision page for Juneau cruise visitors choosing between ship excursions, independent tours, and self-guided port days.",
  },
  {
    path: "/juneau/best-independent-excursions",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "outbound_only",
    priority: 0.8,
    changeFrequency: "weekly",
    notes:
      "Money page ranking the few independent Juneau excursions worth surfacing for cruise visitors.",
  },
  {
    path: "/juneau/what-happens-if-you-miss-the-ship",
    publishState: "indexable",
    networkRole: "satellite",
    handoffPolicy: "outbound_only",
    priority: 0.75,
    changeFrequency: "weekly",
    notes:
      "Fear-removal page addressing the main objection to independent Juneau excursions for cruise passengers.",
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
  {
    path: "/how-it-works",
    publishState: "indexable",
    networkRole: "operator",
    handoffPolicy: "none",
    priority: 0.7,
    changeFrequency: "monthly",
  },
  {
    path: "/juneau-helicopter-tours",
    publishState: "indexable",
    networkRole: "operator",
    handoffPolicy: "bidirectional",
    priority: 0.85,
    changeFrequency: "weekly",
  },
  {
    path: "/juneau-glacier-landing-tours",
    publishState: "indexable",
    networkRole: "operator",
    handoffPolicy: "bidirectional",
    priority: 0.8,
    changeFrequency: "weekly",
  },
  {
    path: "/juneau-dogsled-helicopter-tours",
    publishState: "indexable",
    networkRole: "operator",
    handoffPolicy: "bidirectional",
    priority: 0.8,
    changeFrequency: "weekly",
  },
];

const CURATED_TOUR_GOVERNANCE: RouteGovernanceEntry[] = curatedTours.map((tour) => ({
  path: `/tours/${tour.slug}`,
  publishState: "indexable",
  networkRole: "satellite",
  handoffPolicy: "bidirectional",
  priority: 0.8,
  changeFrequency: "weekly",
}));

const JFD_ROUTE_GOVERNANCE = [...CORE_ROUTE_GOVERNANCE, ...CURATED_TOUR_GOVERNANCE] as const satisfies readonly RouteGovernanceEntry[];

const JFD_ROUTE_GOVERNANCE_INDEX = createRouteGovernanceIndex(JFD_ROUTE_GOVERNANCE);

export const JFD_INDEXABLE_ROUTE_PATHS = JFD_ROUTE_GOVERNANCE_INDEX.indexablePaths;

export const JFD_VISIBLE_ROUTE_PATHS = JFD_ROUTE_GOVERNANCE_INDEX.visiblePaths;

export function getJfdRouteGovernance(pathname: string): RouteGovernanceEntry | null {
  return JFD_ROUTE_GOVERNANCE_INDEX.get(pathname);
}

export function getJfdRouteGovernanceEntries(): readonly RouteGovernanceEntry[] {
  return JFD_ROUTE_GOVERNANCE_INDEX.entries;
}
