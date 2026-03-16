export type ConcertShuttleListing = {
  slug: string;
  operatorName: string;
  marketLabel: string;
  region: "Colorado" | "West" | "Midwest" | "South" | "Northeast" | "Nationwide";
  venueOrEvent: string;
  serviceType: "shared-shuttle" | "private-shuttle" | "charter" | "park-and-ride" | "mixed";
  website: string | null;
  note: string;
  tags: string[];
  featured?: boolean;
};

export const CONCERT_SHUTTLE_DIRECTORY_UPDATED_AT = "2026-03-15";

export const CONCERT_SHUTTLE_DIRECTORY: ConcertShuttleListing[] = [
  {
    slug: "party-at-red-rocks",
    operatorName: "Party At Red Rocks",
    marketLabel: "Denver / Red Rocks",
    region: "Colorado",
    venueOrEvent: "Red Rocks concerts",
    serviceType: "mixed",
    website: "https://www.partyatredrocks.com",
    note: "Shared shuttles and private ride execution for Red Rocks concert traffic.",
    tags: ["red-rocks", "denver", "shared", "private"],
    featured: true,
  },
  {
    slug: "on-location-red-rocks-shuttles",
    operatorName: "On Location / rrxshuttles.com",
    marketLabel: "Denver / Red Rocks",
    region: "Colorado",
    venueOrEvent: "Red Rocks concerts",
    serviceType: "shared-shuttle",
    website: "https://rrxshuttles.com",
    note: "Venue-linked Red Rocks shuttle option with multiple pickup stops.",
    tags: ["red-rocks", "venue-linked", "shared"],
  },
  {
    slug: "bus-to-show",
    operatorName: "Bus to Show",
    marketLabel: "Denver / Boulder / Red Rocks",
    region: "Colorado",
    venueOrEvent: "Red Rocks concerts",
    serviceType: "shared-shuttle",
    website: "https://bustoshow.org",
    note: "Affordable Red Rocks bus option with Denver and Boulder demand overlap.",
    tags: ["red-rocks", "boulder", "denver", "budget"],
  },
  {
    slug: "ride-to-red-rocks",
    operatorName: "Ride to Red Rocks / shuttleredrocks.com",
    marketLabel: "Denver / Red Rocks",
    region: "Colorado",
    venueOrEvent: "Red Rocks concerts",
    serviceType: "shared-shuttle",
    website: "https://shuttleredrocks.com",
    note: "Dedicated Red Rocks shuttle option built around concert-night transportation intent.",
    tags: ["red-rocks", "shared", "concert"],
  },
  {
    slug: "bus-party-colorado",
    operatorName: "Bus Party Colorado",
    marketLabel: "Colorado Front Range",
    region: "Colorado",
    venueOrEvent: "Concert and event transportation",
    serviceType: "private-shuttle",
    website: null,
    note: "Seeded as a Colorado concert-transport operator for group and event demand.",
    tags: ["colorado", "group", "concert"],
  },
  {
    slug: "rockin-transportation",
    operatorName: "Rockin Transportation",
    marketLabel: "Denver metro",
    region: "Colorado",
    venueOrEvent: "Private concert group transportation",
    serviceType: "private-shuttle",
    website: null,
    note: "Private group transport fit for venue nights where parking and post-show pickup matter.",
    tags: ["denver", "private", "group"],
  },
  {
    slug: "peak-1-express",
    operatorName: "Peak 1 Express / mountainshuttle.com",
    marketLabel: "Colorado mountain corridor",
    region: "Colorado",
    venueOrEvent: "Shuttle and transfer network",
    serviceType: "mixed",
    website: "https://www.mountainshuttle.com",
    note: "Mountain shuttle brand with adjacent transfer relevance for Colorado event movement.",
    tags: ["colorado", "transfer", "mountain"],
  },
  {
    slug: "rocky-mountain-event-shuttles",
    operatorName: "Rocky Mountain Event Shuttles",
    marketLabel: "Colorado",
    region: "Colorado",
    venueOrEvent: "Event and concert shuttle demand",
    serviceType: "private-shuttle",
    website: null,
    note: "User-seeded Colorado operator reference from local discovery channels.",
    tags: ["colorado", "event", "group"],
  },
  {
    slug: "cid-colorado",
    operatorName: "CID Colorado",
    marketLabel: "Colorado",
    region: "Colorado",
    venueOrEvent: "Concert and event transportation",
    serviceType: "private-shuttle",
    website: null,
    note: "Seed operator reference for Colorado concert transportation expansion.",
    tags: ["colorado", "concert", "private"],
  },
  {
    slug: "all-in-transportation",
    operatorName: "All In Transportation",
    marketLabel: "Colorado",
    region: "Colorado",
    venueOrEvent: "Concert and event transportation",
    serviceType: "private-shuttle",
    website: null,
    note: "Colorado transport seed for future direct verification and page expansion.",
    tags: ["colorado", "event", "transport"],
  },
  {
    slug: "hollywood-bowl-park-and-ride",
    operatorName: "Hollywood Bowl Park & Ride / Bowl Shuttle",
    marketLabel: "Los Angeles",
    region: "West",
    venueOrEvent: "Hollywood Bowl",
    serviceType: "park-and-ride",
    website: "https://www.hollywoodbowl.com",
    note: "Official park-and-ride and shuttle layer for Hollywood Bowl concert nights.",
    tags: ["hollywood-bowl", "los-angeles", "official"],
  },
  {
    slug: "xpress-shuttles-coachella-stagecoach",
    operatorName: "Xpress Shuttles",
    marketLabel: "Indio / Coachella Valley",
    region: "West",
    venueOrEvent: "Coachella and Stagecoach",
    serviceType: "mixed",
    website: null,
    note: "Festival-oriented private shuttle reference for Coachella and Stagecoach demand.",
    tags: ["coachella", "stagecoach", "festival", "indio"],
  },
  {
    slug: "cta-for-lollapalooza",
    operatorName: "CTA and private charter mix",
    marketLabel: "Chicago",
    region: "Midwest",
    venueOrEvent: "Lollapalooza",
    serviceType: "mixed",
    website: null,
    note: "Public transit dominates the festival move, but private charters still exist for group demand.",
    tags: ["lollapalooza", "chicago", "festival", "transit"],
  },
  {
    slug: "bonnaroo-cma-fest-shuttles",
    operatorName: "Site-specific shuttles and charters",
    marketLabel: "Tennessee",
    region: "South",
    venueOrEvent: "Bonnaroo and CMA Fest",
    serviceType: "mixed",
    website: null,
    note: "These large Tennessee events often resolve transportation through event-specific shuttles or charter providers.",
    tags: ["bonnaroo", "cma-fest", "festival", "tennessee"],
  },
  {
    slug: "best-vip-chauffeured",
    operatorName: "BEST-VIP Chauffeured",
    marketLabel: "Southern California",
    region: "West",
    venueOrEvent: "Concert transportation",
    serviceType: "private-shuttle",
    website: null,
    note: "Private SoCal concert transportation seed for premium group moves.",
    tags: ["socal", "private", "concert"],
  },
  {
    slug: "rent-a-bus-usa",
    operatorName: "Rent-A-Bus USA",
    marketLabel: "Nationwide",
    region: "Nationwide",
    venueOrEvent: "Concerts and festivals",
    serviceType: "charter",
    website: null,
    note: "Nationwide charter layer relevant for group concert and festival transportation.",
    tags: ["nationwide", "charter", "group"],
  },
  {
    slug: "bauer-event-shuttles",
    operatorName: "Bauer event shuttle providers",
    marketLabel: "Nationwide",
    region: "Nationwide",
    venueOrEvent: "Concert and event shuttle rentals",
    serviceType: "charter",
    website: null,
    note: "Nationwide event shuttle rental seed for concerts and larger gatherings.",
    tags: ["nationwide", "event", "charter"],
  },
  {
    slug: "meadowlands-show-shuttles",
    operatorName: "Meadowlands / MetLife show shuttle references",
    marketLabel: "New York metro",
    region: "Northeast",
    venueOrEvent: "MetLife Stadium shows",
    serviceType: "mixed",
    website: null,
    note: "New York metro seed for venue-night shuttle discovery around major stadium shows.",
    tags: ["new-york", "metlife", "stadium", "show"],
  },
];

export const CONCERT_SHUTTLE_REGIONS = [
  "Colorado",
  "West",
  "Midwest",
  "South",
  "Northeast",
  "Nationwide",
] as const;

export function getConcertShuttleListingsByRegion(region: ConcertShuttleListing["region"]) {
  return CONCERT_SHUTTLE_DIRECTORY.filter((listing) => listing.region === region);
}

export function getFeaturedConcertShuttleListings() {
  return CONCERT_SHUTTLE_DIRECTORY.filter((listing) => listing.featured);
}
