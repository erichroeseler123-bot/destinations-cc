import type { NodeImageSet } from "@/src/lib/media/types";

export type RoadTripStopType =
  | "roadside"
  | "diner"
  | "truck-stop"
  | "scenic"
  | "town"
  | "gas"
  | "warning-zone";

export type RoadTripStop = {
  slug: string;
  stopType: RoadTripStopType;
  title: string;
  citySlug?: string;
  summary: string;
  tags: string[];
  routeSlugs: string[];
  nearbyStopSlugs: string[];
  externalLinks: Array<{ href: string; label: string }>;
  imageSet?: NodeImageSet;
  quickFacts?: string[];
};

export const ROAD_TRIP_STOPS_REGISTRY: RoadTripStop[] = [
  {
    slug: "hoover-dam",
    stopType: "scenic",
    citySlug: "las-vegas",
    title: "Hoover Dam and bypass overlook",
    summary:
      "The cleanest first major stop on the Vegas-to-Grand-Canyon drive, good for a short engineering stop, photo break, and route reset before the long Arizona leg.",
    tags: ["dam", "engineering", "photo-stop", "road-trip-anchor"],
    routeSlugs: ["las-vegas-to-grand-canyon"],
    nearbyStopSlugs: ["lake-mead-overlook", "boulder-city-fuel-reset"],
    externalLinks: [
      { href: "https://www.nps.gov/lake/planyourvisit/hooverdam.htm", label: "NPS / Hoover Dam info" },
      { href: "https://www.google.com/maps/search/?api=1&query=Hoover+Dam", label: "Open in Maps" },
    ],
    quickFacts: ["Best as a short first stop", "Good photo and restroom reset", "Can add traffic in peak windows"],
  },
  {
    slug: "lake-mead-overlook",
    stopType: "scenic",
    citySlug: "las-vegas",
    title: "Lake Mead overlook",
    summary:
      "A scenic reset point that makes the drive feel more like a real desert route instead of one long utility haul out of Las Vegas.",
    tags: ["lake", "scenic", "photo-stop", "desert-drive"],
    routeSlugs: ["las-vegas-to-grand-canyon"],
    nearbyStopSlugs: ["hoover-dam"],
    externalLinks: [
      { href: "https://www.nps.gov/lake/index.htm", label: "Lake Mead alerts" },
      { href: "https://www.google.com/maps/search/?api=1&query=Lake+Mead+overlook", label: "Open in Maps" },
    ],
    quickFacts: ["Good short scenic pullout", "Useful before the Arizona stretch", "Heat and wind matter in summer"],
  },
  {
    slug: "boulder-city-fuel-reset",
    stopType: "gas",
    citySlug: "las-vegas",
    title: "Boulder City fuel and snack reset",
    summary:
      "Practical early-route reset for fuel, cold drinks, and getting the car organized before the longer desert miles begin.",
    tags: ["fuel", "snacks", "reset", "practical-stop"],
    routeSlugs: ["las-vegas-to-grand-canyon"],
    nearbyStopSlugs: ["hoover-dam"],
    externalLinks: [
      { href: "https://www.google.com/maps/search/?api=1&query=gas+station+Boulder+City+Nevada", label: "Fuel options in Maps" },
    ],
    quickFacts: ["Use before committing to the long leg", "Good for ice and water", "Short detour only"],
  },
  {
    slug: "route-66-kingman",
    stopType: "roadside",
    title: "Historic Route 66 in Kingman",
    summary:
      "The strongest old-road and classic-Americana stop on this route, useful for diners, photo breaks, and breaking the drive into a more human sequence.",
    tags: ["route-66", "historic", "town-stop", "roadside"],
    routeSlugs: ["las-vegas-to-grand-canyon"],
    nearbyStopSlugs: ["mr-dz-route-66-diner", "loves-kingman"],
    externalLinks: [
      { href: "https://www.visitkingman.com/", label: "Kingman visitor info" },
      { href: "https://www.google.com/maps/search/?api=1&query=Historic+Route+66+Kingman", label: "Open in Maps" },
    ],
    quickFacts: ["Best classic-road stop", "Good lunch break anchor", "Useful for a town reset before final leg"],
  },
  {
    slug: "mr-dz-route-66-diner",
    stopType: "diner",
    title: "Mr. D'z Route 66 Diner",
    summary:
      "One of the clearest themed roadside meal stops on the Kingman leg, useful when the drive needs one memorable non-chain break.",
    tags: ["diner", "route-66", "food", "roadside"],
    routeSlugs: ["las-vegas-to-grand-canyon"],
    nearbyStopSlugs: ["route-66-kingman", "loves-kingman"],
    externalLinks: [
      { href: "https://www.google.com/maps/search/?api=1&query=Mr.+D%27z+Route+66+Diner+Kingman", label: "Open in Maps" },
      { href: "https://www.google.com/search?q=Mr.+D%27z+Route+66+Diner+official+site", label: "Find official info" },
    ],
    quickFacts: ["Best themed lunch stop", "Good with Kingman town break", "Not a fast in-and-out chain stop"],
  },
  {
    slug: "loves-kingman",
    stopType: "truck-stop",
    title: "Love's Travel Stop, Kingman",
    summary:
      "Truck-friendly and practical stop for fuel, restrooms, and fast food when the route needs utility over scenery.",
    tags: ["truck-stop", "fuel", "restrooms", "practical"],
    routeSlugs: ["las-vegas-to-grand-canyon"],
    nearbyStopSlugs: ["route-66-kingman", "mr-dz-route-66-diner"],
    externalLinks: [
      { href: "https://www.loves.com/", label: "Love's official site" },
      { href: "https://www.google.com/maps/search/?api=1&query=Love%27s+Travel+Stop+Kingman", label: "Open in Maps" },
    ],
    quickFacts: ["Best truck-friendly stop", "Fast refill and restroom reset", "Good when time matters more than atmosphere"],
  },
  {
    slug: "grand-canyon-south-rim-overlook",
    stopType: "scenic",
    title: "Grand Canyon South Rim overlook",
    summary:
      "The payoff stop for the full drive, better treated as the main destination block rather than just another quick pullout.",
    tags: ["grand-canyon", "scenic", "destination", "south-rim"],
    routeSlugs: ["las-vegas-to-grand-canyon"],
    nearbyStopSlugs: [],
    externalLinks: [
      { href: "https://www.nps.gov/grca/index.htm", label: "Grand Canyon NPS alerts" },
      { href: "https://www.google.com/maps/search/?api=1&query=Grand+Canyon+South+Rim", label: "Open in Maps" },
    ],
    quickFacts: ["Destination stop, not quick reset", "Best with daylight margin", "Weather and closure checks matter"],
  },
];

export function getRoadTripStop(slug: string) {
  return ROAD_TRIP_STOPS_REGISTRY.find((stop) => stop.slug === slug) ?? null;
}

export function getRoadTripStopsByRoute(routeSlug: string) {
  return ROAD_TRIP_STOPS_REGISTRY.filter((stop) => stop.routeSlugs.includes(routeSlug));
}

export function listRoadTripStopSlugs(stopType?: RoadTripStopType) {
  return ROAD_TRIP_STOPS_REGISTRY.filter((stop) => !stopType || stop.stopType === stopType).map((stop) => stop.slug);
}

export function getRoadTripStopHref(stop: RoadTripStop) {
  switch (stop.stopType) {
    case "diner":
      return `/diner/${stop.slug}`;
    case "truck-stop":
      return `/truck-stop/${stop.slug}`;
    case "scenic":
      return `/scenic/${stop.slug}`;
    default:
      return `/roadside/${stop.slug}`;
  }
}
