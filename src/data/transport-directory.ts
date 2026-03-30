import { buildParrBookUrl } from "@/lib/dcc/contracts/dccParrBridge";

export type TransportDirectoryEntry = {
  slug: string;
  name: string;
  city: string;
  state: string;
  region: string;
  venueType: "amphitheatre" | "arena" | "club" | "festival" | "mountain" | "theatre";
  serviceStatus: "active" | "limited" | "partner" | "coming_soon";
  serviceTypes: Array<"shared" | "private" | "group-charter">;
  operatorType: "internal" | "partner" | "planned";
  operatorName?: string;
  dccUrl: string;
  bookingUrl?: string;
  guideUrl?: string;
  notes?: string;
  trustBadges?: string[];
  urgencyNote?: string;
  offerCards?: Array<{
    title: string;
    detail: string;
    bullets: string[];
    ctaLabel: string;
    emphasis?: "shared" | "private";
  }>;
};

export const TRANSPORT_DIRECTORY_UPDATED_AT = "2026-03-15";

export const TRANSPORT_DIRECTORY: TransportDirectoryEntry[] = [
  {
    slug: "red-rocks-amphitheatre",
    name: "Red Rocks Amphitheatre",
    city: "Morrison",
    state: "Colorado",
    region: "Colorado",
    venueType: "amphitheatre",
    serviceStatus: "active",
    serviceTypes: ["shared", "private"],
    operatorType: "internal",
    operatorName: "Party At Red Rocks",
    dccUrl: "/transportation/venues/red-rocks-amphitheatre",
    bookingUrl: buildParrBookUrl(),
    guideUrl: "/red-rocks-shuttle",
    notes:
      "Shared shuttle seats from Denver and Golden, plus private door-to-door rides. This is the primary active transport execution lane.",
    trustBadges: ["Denver and Golden pickup anchors", "Shared shuttle and private rides", "Built for post-show ride-home certainty"],
    urgencyNote:
      "High-demand nights make the ride-home decision more important than the ride in. If the plan already revolves around Red Rocks, solve transport early.",
    offerCards: [
      {
        title: "Shared Shuttle",
        detail: "Round-trip concert transportation from Denver or Golden pickup anchors.",
        bullets: ["Best when you want the cleanest ride-home path", "Stronger fit than late-lot parking for many visitors", "Simpler than gambling on post-show Uber pickup"],
        ctaLabel: "Book Shuttle",
        emphasis: "shared",
      },
      {
        title: "Private Ride",
        detail: "Door-to-door group transportation with tighter control over the night.",
        bullets: ["Best for groups, dates, and tighter schedules", "Less parking friction and less pickup uncertainty", "Cleaner fit when autonomy matters more than seat pricing"],
        ctaLabel: "Plan Private Ride",
        emphasis: "private",
      },
    ],
  },
  {
    slug: "mission-ballroom",
    name: "Mission Ballroom",
    city: "Denver",
    state: "Colorado",
    region: "Colorado",
    venueType: "theatre",
    serviceStatus: "coming_soon",
    serviceTypes: ["private", "group-charter"],
    operatorType: "planned",
    dccUrl: "/transportation/venues/mission-ballroom",
    guideUrl: "/denver/concert-transportation",
    notes:
      "High-intent Denver venue where private rides and group transport are the likely first-fit coverage model.",
  },
  {
    slug: "ball-arena",
    name: "Ball Arena",
    city: "Denver",
    state: "Colorado",
    region: "Colorado",
    venueType: "arena",
    serviceStatus: "coming_soon",
    serviceTypes: ["private", "group-charter"],
    operatorType: "planned",
    dccUrl: "/transportation/venues/ball-arena",
    guideUrl: "/denver/concert-transportation",
    notes:
      "Downtown arena coverage is planned, but public transit and rideshare still solve much of the current transport demand.",
  },
  {
    slug: "fiddlers-green-amphitheatre",
    name: "Fiddler's Green Amphitheatre",
    city: "Greenwood Village",
    state: "Colorado",
    region: "Colorado",
    venueType: "amphitheatre",
    serviceStatus: "coming_soon",
    serviceTypes: ["private", "group-charter"],
    operatorType: "planned",
    dccUrl: "/transportation/venues/fiddlers-green-amphitheatre",
    guideUrl: "/denver/concert-transportation",
    notes:
      "Suburban venue coverage is planned once the active Red Rocks lane is fully established.",
  },
  {
    slug: "ogden-theatre",
    name: "Ogden Theatre",
    city: "Denver",
    state: "Colorado",
    region: "Colorado",
    venueType: "theatre",
    serviceStatus: "coming_soon",
    serviceTypes: ["private"],
    operatorType: "planned",
    dccUrl: "/transportation/venues/ogden-theatre",
    guideUrl: "/denver/concert-transportation",
    notes: "Guide-first Denver theatre coverage with private-ride demand more likely than shared shuttle demand.",
  },
  {
    slug: "gothic-theatre",
    name: "Gothic Theatre",
    city: "Englewood",
    state: "Colorado",
    region: "Colorado",
    venueType: "theatre",
    serviceStatus: "coming_soon",
    serviceTypes: ["private"],
    operatorType: "planned",
    dccUrl: "/transportation/venues/gothic-theatre",
    guideUrl: "/denver/concert-transportation",
    notes: "Smaller venue where private ride coverage is more realistic than a broad shared-shuttle product.",
  },
  {
    slug: "cervantes-masterpiece",
    name: "Cervantes' Masterpiece Ballroom",
    city: "Denver",
    state: "Colorado",
    region: "Colorado",
    venueType: "club",
    serviceStatus: "coming_soon",
    serviceTypes: ["private"],
    operatorType: "planned",
    dccUrl: "/transportation/venues/cervantes-masterpiece",
    guideUrl: "/denver/concert-transportation",
    notes: "Planned club-level transportation coverage for later Denver expansion.",
  },
  {
    slug: "bluebird-theater",
    name: "Bluebird Theater",
    city: "Denver",
    state: "Colorado",
    region: "Colorado",
    venueType: "theatre",
    serviceStatus: "coming_soon",
    serviceTypes: ["private"],
    operatorType: "planned",
    dccUrl: "/transportation/venues/bluebird-theater",
    guideUrl: "/denver/concert-transportation",
    notes: "Neighborhood theatre lane best treated as guide coverage until dedicated ride demand exists.",
  },
  {
    slug: "summit-music-hall",
    name: "Summit Music Hall",
    city: "Denver",
    state: "Colorado",
    region: "Colorado",
    venueType: "club",
    serviceStatus: "coming_soon",
    serviceTypes: ["private"],
    operatorType: "planned",
    dccUrl: "/transportation/venues/summit-music-hall",
    guideUrl: "/denver/concert-transportation",
    notes: "Compact downtown venue where transportation guidance comes before active execution coverage.",
  },
  {
    slug: "marquis-theater",
    name: "Marquis Theater",
    city: "Denver",
    state: "Colorado",
    region: "Colorado",
    venueType: "club",
    serviceStatus: "coming_soon",
    serviceTypes: ["private"],
    operatorType: "planned",
    dccUrl: "/transportation/venues/marquis-theater",
    guideUrl: "/denver/concert-transportation",
    notes: "Small-format venue kept in planned status to avoid pretending to support a broad shuttle network.",
  },
  {
    slug: "boulder-theater",
    name: "Boulder Theater",
    city: "Boulder",
    state: "Colorado",
    region: "Colorado",
    venueType: "theatre",
    serviceStatus: "limited",
    serviceTypes: ["group-charter", "private"],
    operatorType: "planned",
    dccUrl: "/transportation/venues/boulder-theater",
    guideUrl: "/transportation/colorado",
    notes: "Boulder coverage is limited to guide and custom transport planning for now.",
  },
  {
    slug: "fox-theatre",
    name: "Fox Theatre",
    city: "Boulder",
    state: "Colorado",
    region: "Colorado",
    venueType: "club",
    serviceStatus: "limited",
    serviceTypes: ["group-charter", "private"],
    operatorType: "planned",
    dccUrl: "/transportation/venues/fox-theatre",
    guideUrl: "/transportation/colorado",
    notes: "Limited Boulder venue coverage focused on custom or group transport requests.",
  },
  {
    slug: "mishawaka-amphitheatre",
    name: "Mishawaka Amphitheatre",
    city: "Bellvue",
    state: "Colorado",
    region: "Colorado",
    venueType: "mountain",
    serviceStatus: "limited",
    serviceTypes: ["group-charter", "private"],
    operatorType: "planned",
    dccUrl: "/transportation/venues/mishawaka-amphitheatre",
    guideUrl: "/transportation/colorado",
    notes: "Mountain / destination venue where custom-group transport is the more realistic initial model.",
  },
];

export function getTransportDirectoryEntry(slug: string) {
  return TRANSPORT_DIRECTORY.find((entry) => entry.slug === slug) ?? null;
}

export function getTransportEntriesByRegion(region: string) {
  return TRANSPORT_DIRECTORY.filter((entry) => entry.region === region);
}

function normalizeTransportToken(value: string | undefined | null) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
}

export function getTransportGuideHrefForCitySlug(citySlug: string | undefined | null) {
  const normalizedCity = normalizeTransportToken(citySlug);
  if (!normalizedCity) return null;

  const matchingEntry = TRANSPORT_DIRECTORY.find(
    (entry) => normalizeTransportToken(entry.city) === normalizedCity
  );
  if (!matchingEntry) return null;

  if (matchingEntry.region === "Colorado") {
    return "/transportation/colorado";
  }

  return "/transportation";
}

export function getTransportRegions() {
  return [...new Set(TRANSPORT_DIRECTORY.map((entry) => entry.region))];
}

export function getTransportEntriesByStatus(status: TransportDirectoryEntry["serviceStatus"]) {
  return TRANSPORT_DIRECTORY.filter((entry) => entry.serviceStatus === status);
}
