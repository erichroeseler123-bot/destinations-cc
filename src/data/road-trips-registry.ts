export type RoadTripWarningSlug =
  | "desert-heat"
  | "weekend-traffic"
  | "fuel-planning"
  | "park-entry-timing"
  | "weather-check";

export type RoadTripRoute = {
  slug: string;
  title: string;
  originSlug: string;
  destinationSlug: string;
  summary: string;
  driveTimeNote: string;
  distanceNote: string;
  bestFor: string[];
  segmentSlugs: string[];
  stopSlugs: string[];
  overlaySlugs: string[];
  warningSlugs: RoadTripWarningSlug[];
  relatedCitySlugs: string[];
  externalLinks: Array<{ href: string; label: string }>;
  alternatives: Array<{ href: string; label: string; body: string }>;
};

export const ROAD_TRIPS_REGISTRY: RoadTripRoute[] = [
  {
    slug: "las-vegas-to-grand-canyon",
    title: "Las Vegas to Grand Canyon road trip",
    originSlug: "las-vegas",
    destinationSlug: "grand-canyon",
    summary:
      "This is the strongest first DCC road-trip corridor because it blends iconic demand with real route decisions: Hoover Dam or not, Kingman or not, scenic pullouts versus pure drive-time, and when driving should give way to a helicopter or bus alternative.",
    driveTimeNote: "Often 4.5 to 6.5 hours one way depending on rim choice, stops, traffic, and park-entry timing.",
    distanceNote: "Usually around 270 to 300 miles for the South Rim-oriented version of the drive.",
    bestFor: ["self-drive first-timers", "classic Southwest scenery", "Route 66 stopovers", "buyers comparing drive vs helicopter"],
    segmentSlugs: ["las-vegas-to-hoover-dam", "hoover-dam-to-kingman", "kingman-to-grand-canyon"],
    stopSlugs: [
      "hoover-dam",
      "lake-mead-overlook",
      "route-66-kingman",
      "mr-dz-route-66-diner",
      "loves-kingman",
      "grand-canyon-south-rim-overlook",
    ],
    overlaySlugs: ["nevada-arizona-scenic-drive"],
    warningSlugs: ["desert-heat", "fuel-planning", "park-entry-timing", "weather-check"],
    relatedCitySlugs: ["las-vegas"],
    externalLinks: [
      { href: "https://www.google.com/maps/search/?api=1&query=Las+Vegas+to+Grand+Canyon+South+Rim", label: "Open route in Maps" },
      { href: "https://www.dot.nv.gov/", label: "Nevada DOT" },
      { href: "https://azdot.gov/", label: "Arizona DOT" },
      { href: "https://www.nps.gov/grca/index.htm", label: "Grand Canyon NPS alerts" },
    ],
    alternatives: [
      {
        href: "/grand-canyon",
        label: "Grand Canyon tour alternatives",
        body: "Use the pillar page when the question shifts from driving to bus tours, helicopter upgrades, or route choice from Las Vegas.",
      },
      {
        href: "/helicopter-tours",
        label: "Helicopter alternatives",
        body: "Best when the buyer wants canyon payoff without losing a full day to the road.",
      },
    ],
  },
];

export const ROAD_TRIP_WARNING_COPY: Record<RoadTripWarningSlug, { title: string; body: string }> = {
  "desert-heat": {
    title: "Desert heat warning",
    body: "This route gets much harder when people under-pack water or overestimate how comfortable quick stops will feel in extreme heat.",
  },
  "weekend-traffic": {
    title: "Weekend traffic",
    body: "Holiday and peak weekend departures can turn the first Vegas leg into a much slower start than the mileage suggests.",
  },
  "fuel-planning": {
    title: "Fuel planning",
    body: "Do not treat the Arizona desert leg like an urban corridor. Decide your fuel reset before leaving the Vegas basin.",
  },
  "park-entry-timing": {
    title: "Park entry timing",
    body: "Grand Canyon arrival works much better when you protect daylight and leave margin for entry lines or viewpoint parking delays.",
  },
  "weather-check": {
    title: "Weather and closure checks",
    body: "Wind, cold snaps, and seasonal conditions change how comfortable and worthwhile the later stops feel. Check official alerts before departure.",
  },
};

export function getRoadTripRoute(slug: string) {
  return ROAD_TRIPS_REGISTRY.find((route) => route.slug === slug) ?? null;
}

export function listRoadTripRouteSlugs() {
  return ROAD_TRIPS_REGISTRY.map((route) => route.slug);
}
