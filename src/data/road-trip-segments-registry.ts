import type { RoadTripWarningSlug } from "@/src/data/road-trips-registry";

export type RoadTripSegment = {
  slug: string;
  routeSlug: string;
  fromLabel: string;
  toLabel: string;
  driveTimeNote: string;
  distanceNote: string;
  stopSlugs: string[];
  warningSlugs: RoadTripWarningSlug[];
  summary: string;
};

export const ROAD_TRIP_SEGMENTS_REGISTRY: RoadTripSegment[] = [
  {
    slug: "las-vegas-to-hoover-dam",
    routeSlug: "las-vegas-to-grand-canyon",
    fromLabel: "Las Vegas",
    toLabel: "Hoover Dam",
    driveTimeNote: "Usually about 45 to 60 minutes without heavy congestion.",
    distanceNote: "Roughly 35 to 40 miles depending on start point.",
    stopSlugs: ["boulder-city-fuel-reset", "hoover-dam", "lake-mead-overlook"],
    warningSlugs: ["desert-heat", "weekend-traffic"],
    summary:
      "This first leg is about getting out of Vegas cleanly, deciding whether Hoover Dam is a real stop or a drive-by, and setting the pace for the rest of the route.",
  },
  {
    slug: "hoover-dam-to-kingman",
    routeSlug: "las-vegas-to-grand-canyon",
    fromLabel: "Hoover Dam",
    toLabel: "Kingman / Route 66",
    driveTimeNote: "Usually around 1 hour 45 minutes to 2 hours 15 minutes.",
    distanceNote: "Roughly 90 to 100 miles depending on exact detours.",
    stopSlugs: ["route-66-kingman", "mr-dz-route-66-diner", "loves-kingman"],
    warningSlugs: ["desert-heat", "fuel-planning"],
    summary:
      "This is the long desert middle. It works best if you already know whether the stop style is classic Route 66 lunch, truck-stop utility, or one quick photo reset only.",
  },
  {
    slug: "kingman-to-grand-canyon",
    routeSlug: "las-vegas-to-grand-canyon",
    fromLabel: "Kingman",
    toLabel: "Grand Canyon South Rim",
    driveTimeNote: "Usually 3 to 3.5 hours depending on entry traffic and final park approach.",
    distanceNote: "Around 175 miles for the final destination leg.",
    stopSlugs: ["grand-canyon-south-rim-overlook"],
    warningSlugs: ["park-entry-timing", "weather-check"],
    summary:
      "The final leg is about protecting enough daylight and energy for the canyon itself. Treat the destination as the main block, not just the end of a long drive.",
  },
];

export function getRoadTripSegment(slug: string) {
  return ROAD_TRIP_SEGMENTS_REGISTRY.find((segment) => segment.slug === slug) ?? null;
}

export function getRoadTripSegmentsByRoute(routeSlug: string) {
  return ROAD_TRIP_SEGMENTS_REGISTRY.filter((segment) => segment.routeSlug === routeSlug);
}

export function listRoadTripSegmentSlugs() {
  return ROAD_TRIP_SEGMENTS_REGISTRY.map((segment) => segment.slug);
}
