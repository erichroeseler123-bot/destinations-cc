export type RoadTripOverlayType = "scenic" | "family" | "truck-friendly" | "winter-driving" | "weird-roadside" | "desert-heat";

export type RoadTripOverlay = {
  slug: string;
  overlayType: RoadTripOverlayType;
  routeSlugs: string[];
  stopSlugs: string[];
  summary: string;
  canonicalPath: string;
  relatedLinks: Array<{ href: string; label: string }>;
};

export const ROAD_TRIP_OVERLAYS_REGISTRY: RoadTripOverlay[] = [
  {
    slug: "nevada-arizona-scenic-drive",
    overlayType: "scenic",
    routeSlugs: ["las-vegas-to-grand-canyon"],
    stopSlugs: ["hoover-dam", "lake-mead-overlook", "route-66-kingman", "grand-canyon-south-rim-overlook"],
    summary:
      "A scenic-drive overlay for the Nevada-to-Arizona desert corridor, useful when the trip is about views, pullouts, and memorable stops rather than pure arrival speed.",
    canonicalPath: "/scenic-drives/nevada-arizona-desert",
    relatedLinks: [
      { href: "/road-trips/las-vegas-to-grand-canyon", label: "Las Vegas to Grand Canyon" },
      { href: "/grand-canyon", label: "Grand Canyon guide" },
      { href: "/hoover-dam", label: "Hoover Dam guide" },
    ],
  },
];

export function getRoadTripOverlay(slug: string) {
  return ROAD_TRIP_OVERLAYS_REGISTRY.find((overlay) => overlay.slug === slug) ?? null;
}

export function getRoadTripOverlayByCanonicalSlug(slug: string) {
  return ROAD_TRIP_OVERLAYS_REGISTRY.find((overlay) => overlay.canonicalPath.endsWith(`/${slug}`)) ?? null;
}

export function listRoadTripOverlayRouteSlugs() {
  return ROAD_TRIP_OVERLAYS_REGISTRY.map((overlay) => overlay.canonicalPath.split("/").pop() as string);
}
