import {
  createRouteGovernanceIndex,
  type HandoffPolicy,
  type NetworkRole,
  type PublishState,
} from "@/lib/route-governance";

export type RouteGovernanceEntry = {
  path: string;
  publishState: PublishState;
  networkRole: NetworkRole;
  handoffPolicy: HandoffPolicy;
  notes?: string;
};

const ROOT_ROUTE_GOVERNANCE = [
  {
    path: "/",
    publishState: "promoted",
    networkRole: "dcc",
    handoffPolicy: "none",
    notes: "Root homepage and top-level network entry.",
  },
  {
    path: "/command",
    publishState: "promoted",
    networkRole: "dcc",
    handoffPolicy: "none",
    notes: "Top-level command view.",
  },
  {
    path: "/network",
    publishState: "promoted",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
    notes: "Public entity page explaining the governed DCC network and active connected domains.",
  },
  {
    path: "/red-rocks-transportation",
    publishState: "promoted",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
    notes: "Canonical Red Rocks decision hub. Booking-ready users should route directly to Party at Red Rocks execution.",
  },
  {
    path: "/red-rocks-shuttle",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
  },
  {
    path: "/red-rocks-shuttle-vs-uber",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
    notes: "Red Rocks decision page comparing shuttle and rideshare. Booking-ready users should route into Party at Red Rocks execution.",
  },
  {
    path: "/how-to-get-to-red-rocks-without-parking-hassle",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
    notes: "Red Rocks decision page for avoiding parking friction. Booking-ready users should route into Party at Red Rocks execution.",
  },
  {
    path: "/red-rocks-parking",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
  },
  {
    path: "/red-rocks/best-way-to-leave-after-a-concert",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
    notes: "Exact-match post-show exit feeder. Should route booking-ready users straight into Party at Red Rocks execution.",
  },
  {
    path: "/red-rocks-shuttle-cost",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
    notes: "Narrow Red Rocks feeder page answering shuttle cost intent and sending users to the shuttle vs Uber decision page.",
  },
  {
    path: "/red-rocks-shuttle-from-denver",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
    notes: "Narrow Red Rocks feeder page for Denver shuttle intent. Core recommendation stays shared shuttle decision.",
  },
  {
    path: "/red-rocks-shuttle-pickup-locations",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
    notes: "Narrow Red Rocks feeder page for pickup-location intent. Sends users back to the core shuttle decision.",
  },
  {
    path: "/uber-after-red-rocks",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
    notes: "Narrow Red Rocks feeder page answering post-show Uber reliability and sending users to shuttle vs Uber.",
  },
  {
    path: "/red-rocks-parking-cost",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
    notes: "Narrow Red Rocks feeder page for parking-cost intent. Sends users to the parking-hassle decision page.",
  },
  {
    path: "/cruise-excursions-vs-independent",
    publishState: "promoted",
    networkRole: "dcc",
    handoffPolicy: "conditional",
    notes:
      "Primary cruise excursion intake page. Should route generic traffic into the cruise port registry and known-port traffic into the relevant reserved port surface.",
  },
  {
    path: "/sedona/jeep-tours",
    publishState: "promoted",
    networkRole: "dcc",
    handoffPolicy: "bidirectional",
  },
  {
    path: "/lake-tahoe/things-to-do",
    publishState: "promoted",
    networkRole: "dcc",
    handoffPolicy: "bidirectional",
  },
  {
    path: "/new-orleans/swamp-tours",
    publishState: "promoted",
    networkRole: "dcc",
    handoffPolicy: "bidirectional",
  },
  {
    path: "/new-orleans/best-swamp-tour",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
  },
  {
    path: "/new-orleans/airboat-vs-swamp-tour",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
  },
  {
    path: "/new-orleans/swamp-tour-with-kids",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
  },
  {
    path: "/new-orleans/swamp-tours/best-swamp-tours",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
  },
  {
    path: "/new-orleans/swamp-tours/airboat-vs-boat",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
  },
  {
    path: "/new-orleans/swamp-tours/worth-it",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
  },
  {
    path: "/new-orleans/swamp-tours/transportation",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
  },
  {
    path: "/new-orleans/swamp-tours/which-tour-should-i-book",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
  },
  {
    path: "/juneau/helicopter-tours",
    publishState: "promoted",
    networkRole: "dcc",
    handoffPolicy: "bidirectional",
  },
  {
    path: "/juneau/helicopter-tours-worth-it",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
  },
  {
    path: "/juneau/helicopter-vs-whale-watching",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
  },
  {
    path: "/juneau/whale-watching-tours",
    publishState: "promoted",
    networkRole: "dcc",
    handoffPolicy: "bidirectional",
  },
  {
    path: "/juneau/what-to-do-if-helicopter-tour-canceled",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
  },
  {
    path: "/ketchikan/cruise-excursions-vs-independent",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
  },
  {
    path: "/ketchikan/best-independent-excursions",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
  },
  {
    path: "/ketchikan/what-happens-if-you-miss-the-ship",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
  },
  {
    path: "/ketchikan/misty-fjords-worth-it",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
  },
  {
    path: "/ketchikan/floatplane-worth-it",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
  },
  {
    path: "/skagway/cruise-excursions-vs-independent",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
  },
  {
    path: "/skagway/best-independent-excursions",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
  },
  {
    path: "/skagway/what-happens-if-you-miss-the-ship",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
  },
  {
    path: "/skagway/white-pass-worth-it",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
  },
  {
    path: "/skagway/history-worth-it",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
  },
  {
    path: "/sitka/cruise-excursions-vs-independent",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
  },
  {
    path: "/sitka/best-independent-excursions",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
  },
  {
    path: "/sitka/what-happens-if-you-miss-the-ship",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
  },
  {
    path: "/sitka/sea-otter-worth-it",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
  },
  {
    path: "/sitka/wildlife-worth-it",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
  },
  {
    path: "/nassau/cruise-excursions-vs-independent",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
  },
  {
    path: "/nassau/best-independent-excursions",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
  },
  {
    path: "/nassau/what-happens-if-you-miss-the-ship",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
  },
  {
    path: "/nassau/beach-resort-worth-it",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
  },
  {
    path: "/nassau/private-resort-worth-it",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
  },
  {
    path: "/cozumel/cruise-excursions-vs-independent",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
  },
  {
    path: "/cozumel/best-independent-excursions",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
  },
  {
    path: "/cozumel/what-happens-if-you-miss-the-ship",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
  },
  {
    path: "/cozumel/snorkeling-worth-it",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
  },
  {
    path: "/cozumel/private-boat-worth-it",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
  },
  {
    path: "/st-thomas/cruise-excursions-vs-independent",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
  },
  {
    path: "/st-thomas/best-independent-excursions",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
  },
  {
    path: "/st-thomas/what-happens-if-you-miss-the-ship",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
  },
  {
    path: "/st-thomas/st-john-worth-it",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
  },
  {
    path: "/st-thomas/private-boat-worth-it",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
  },
  {
    path: "/western-wisconsin",
    publishState: "promoted",
    networkRole: "dcc",
    handoffPolicy: "none",
  },
  {
    path: "/western-wisconsin/best-weekend-trip-from-twin-cities",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "none",
  },
  {
    path: "/western-wisconsin/eau-claire-vs-la-crosse",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "none",
  },
  {
    path: "/western-wisconsin/best-fall-getaway",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "none",
  },
  {
    path: "/airbnb-food-large-group-wisconsin-dells",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
    notes: "Wisconsin Dells FeastlySpread feeder for large-group vacation rental food intent.",
  },
  {
    path: "/wisconsin-dells-bachelorette-party-food",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
    notes: "Wisconsin Dells FeastlySpread feeder for bachelorette-party food planning intent.",
  },
  {
    path: "/wisconsin-dells-large-group-dinner",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
    notes: "Wisconsin Dells FeastlySpread feeder for large-group dinner intent.",
  },
  {
    path: "/denver-to-mountains",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "none",
  },
  {
    path: "/best-mountain-town-from-denver",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "none",
  },
  {
    path: "/transportation/colorado/denver-to-breckenridge-without-a-car",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
    notes: "Exact-match Breckenridge no-car feeder. Pushes qualified search traffic into the GoSno execution lane quickly.",
  },
  {
    path: "/transportation/colorado/how-to-get-to-argo-mill-from-denver",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
    notes: "Exact-match Argo transport feeder. Keeps Denver-to-Argo intent brutally simple and execution-oriented.",
  },
  {
    path: "/colorado/what-to-do-if-rafting-is-canceled",
    publishState: "live_unpromoted",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
    notes: "Test pattern only; kept off promoted and indexable surfaces while corridor focus stays on active lanes.",
  },
  {
    path: "/breckenridge-vs-vail",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "none",
  },
  {
    path: "/best-day-trip-from-denver-mountains",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "none",
  },
  {
    path: "/estes-park-vs-idaho-springs",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "none",
  },
  {
    path: "/denver/weed-airport-pickup",
    publishState: "promoted",
    networkRole: "dcc",
    handoffPolicy: "bidirectional",
  },
  {
    path: "/denver/420-airport-pickup-worth-it",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
  },
  {
    path: "/denver/is-420-airport-pickup-legal",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
  },
  {
    path: "/denver/airport-ride-vs-uber-denver",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
  },
  {
    path: "/denver/ride-from-denver-airport",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
  },
  {
    path: "/denver/best-way-from-denver-airport-to-hotel",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
  },
  {
    path: "/denver/airport-ride-with-kids",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "bidirectional",
    notes: "DCC family airport pickup decision page feeding the Shuttleya execution lane.",
  },
  {
    path: "/mighty-argo-shuttle",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
    notes: "Argo proof corridor entry route. DCC should hand Argo users into the Shuttleya action surface before booking.",
  },
  {
    path: "/mighty-argo/status",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
    notes: "Launch-status page for Mighty Argo Cable Car shuttle timing, pickup/return plan, and Shuttleya handoff.",
  },
  {
    path: "/how-to-get-to-argo-cable-car-from-denver",
    publishState: "live_unpromoted",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
    notes: "Legacy Argo feeder path. Redirects to the exact-match Argo Mill page and should stay out of the visible indexable surface.",
  },
  {
    path: "/argo-parking-vs-shuttle",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
    notes: "Argo feeder page for parking-vs-shuttle intent. Recommends shuttle when users want transport solved before arrival.",
  },
  {
    path: "/denver-to-argo-transportation",
    publishState: "indexable",
    networkRole: "dcc",
    handoffPolicy: "outbound_only",
    notes: "Argo feeder page for Denver transportation intent. Pushes booking-ready users into the Argo Shuttleya surface.",
  },
  {
    path: "/cruises/ports",
    publishState: "promoted",
    networkRole: "dcc",
    handoffPolicy: "none",
    notes:
      "Master registry for the repeatable cruise port decision system. Alaska-first, registry-first, and intended to anchor future port rollout.",
  },
  {
    path: "/book",
    publishState: "live_unpromoted",
    networkRole: "utility",
    handoffPolicy: "bidirectional",
  },
  {
    path: "/checkout",
    publishState: "live_unpromoted",
    networkRole: "utility",
    handoffPolicy: "bidirectional",
  },
  {
    path: "/track",
    publishState: "live_unpromoted",
    networkRole: "utility",
    handoffPolicy: "bidirectional",
  },
  {
    path: "/red-rocks/status",
    publishState: "live_unpromoted",
    networkRole: "utility",
    handoffPolicy: "bidirectional",
  },
] as const satisfies readonly RouteGovernanceEntry[];

const ROOT_ROUTE_GOVERNANCE_INDEX = createRouteGovernanceIndex(ROOT_ROUTE_GOVERNANCE);

export function getRootRouteGovernanceEntries(): RouteGovernanceEntry[] {
  return [...ROOT_ROUTE_GOVERNANCE_INDEX.entries];
}

export function getRootRouteGovernance(pathname: string): RouteGovernanceEntry | null {
  return ROOT_ROUTE_GOVERNANCE_INDEX.get(pathname);
}

export function hasRootRouteGovernance(pathname: string): boolean {
  return ROOT_ROUTE_GOVERNANCE_INDEX.has(pathname);
}

export function getRootPathsByPublishState(...states: PublishState[]): string[] {
  return ROOT_ROUTE_GOVERNANCE_INDEX.getPathsByPublishState(...states);
}

export function getRootPathsByRole(...roles: NetworkRole[]): string[] {
  return ROOT_ROUTE_GOVERNANCE_INDEX.getPathsByRole(...roles);
}
