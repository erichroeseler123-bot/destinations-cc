export type RoadTripRelationshipPath = "stops-near" | "diners-near" | "gas-near" | "roadside-attractions-near";
export type RoadTripRelationshipAnchorType = "route" | "segment" | "stop" | "city";

export type RoadTripRelationship = {
  slug: string;
  path: RoadTripRelationshipPath;
  anchorType: RoadTripRelationshipAnchorType;
  anchorSlug: string;
  resultType: "stop";
  resultSlugs: string[];
  summary: string;
  guidance: Array<{ title: string; body: string }>;
  canonicalPath: string;
  relatedLinks: Array<{ href: string; label: string }>;
};

export const ROAD_TRIP_RELATIONSHIPS_REGISTRY: RoadTripRelationship[] = [
  {
    slug: "hoover-dam",
    path: "stops-near",
    anchorType: "stop",
    anchorSlug: "hoover-dam",
    resultType: "stop",
    resultSlugs: ["lake-mead-overlook", "boulder-city-fuel-reset"],
    summary:
      "Use this page when Hoover Dam is the anchor but the real question is what else is worth stopping for without turning the first leg into chaos.",
    guidance: [
      { title: "Best for short reset stops", body: "These are good nearby additions when Hoover Dam is already the headline stop and you only want one or two extras." },
      { title: "Best for first-day pacing", body: "Keep the first leg clean. Hoover Dam plus one scenic or fuel reset is usually enough before the longer Arizona miles begin." },
    ],
    canonicalPath: "/stops-near/hoover-dam",
    relatedLinks: [
      { href: "/road-trips/las-vegas-to-grand-canyon", label: "Main road-trip route" },
      { href: "/hoover-dam", label: "Hoover Dam guide" },
    ],
  },
  {
    slug: "route-66-kingman",
    path: "diners-near",
    anchorType: "stop",
    anchorSlug: "route-66-kingman",
    resultType: "stop",
    resultSlugs: ["mr-dz-route-66-diner", "loves-kingman"],
    summary:
      "A food-and-reset relationship page for the Kingman leg, useful when the route needs one classic diner stop or one faster practical stop.",
    guidance: [
      { title: "Best for classic Route 66 energy", body: "Choose the themed diner when the stop should feel memorable instead of purely practical." },
      { title: "Best for truck-friendly utility", body: "Choose the travel stop when the route needs quick fuel, restrooms, and a shorter interruption." },
    ],
    canonicalPath: "/diners-near/route-66-kingman",
    relatedLinks: [
      { href: "/road-trips/las-vegas-to-grand-canyon", label: "Main road-trip route" },
      { href: "/route-segment/hoover-dam-to-kingman", label: "Kingman segment" },
    ],
  },
];

export function getRoadTripRelationship(path: RoadTripRelationshipPath, slug: string) {
  return ROAD_TRIP_RELATIONSHIPS_REGISTRY.find((item) => item.path === path && item.slug === slug) ?? null;
}

export function listRoadTripRelationshipSlugs(path: RoadTripRelationshipPath) {
  return ROAD_TRIP_RELATIONSHIPS_REGISTRY.filter((item) => item.path === path).map((item) => item.slug);
}
