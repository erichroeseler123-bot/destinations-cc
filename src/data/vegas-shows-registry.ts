export type VegasCasinoCluster = "strip" | "downtown" | "off-strip";

export type VegasVenueType =
  | "casino-theater"
  | "arena"
  | "showroom"
  | "performing-arts-center"
  | "lounge"
  | "club";

export type VegasVenueCluster =
  | "strip-mega"
  | "casino-theater"
  | "magic-comedy"
  | "performing-arts"
  | "jazz-lounge"
  | "downtown";

export type VegasCasino = {
  slug: string;
  name: string;
  cluster: VegasCasinoCluster;
  address: string;
  officialUrl?: string;
};

export type VegasVenue = {
  slug: string;
  name: string;
  casinoSlug?: string;
  venueType: VegasVenueType;
  cluster: VegasVenueCluster;
  address: string;
  officialUrl?: string;
  ticketSources?: string[];
};

export const VEGAS_CASINOS: VegasCasino[] = [
  {
    slug: "mgm-grand",
    name: "MGM Grand",
    cluster: "strip",
    address: "3799 S Las Vegas Blvd, Las Vegas, NV 89109",
    officialUrl: "https://mgmgrand.mgmresorts.com/",
  },
  {
    slug: "bellagio",
    name: "Bellagio",
    cluster: "strip",
    address: "3600 S Las Vegas Blvd, Las Vegas, NV 89109",
    officialUrl: "https://bellagio.mgmresorts.com/",
  },
  {
    slug: "caesars-palace",
    name: "Caesars Palace",
    cluster: "strip",
    address: "3570 S Las Vegas Blvd, Las Vegas, NV 89109",
    officialUrl: "https://www.caesars.com/caesars-palace",
  },
  {
    slug: "venetian-palazzo",
    name: "Venetian and Palazzo",
    cluster: "strip",
    address: "3355 S Las Vegas Blvd, Las Vegas, NV 89109",
    officialUrl: "https://www.venetianlasvegas.com/",
  },
  {
    slug: "wynn-encore",
    name: "Wynn and Encore",
    cluster: "strip",
    address: "3131 S Las Vegas Blvd, Las Vegas, NV 89109",
    officialUrl: "https://www.wynnlasvegas.com/",
  },
  {
    slug: "resorts-world",
    name: "Resorts World",
    cluster: "strip",
    address: "3000 S Las Vegas Blvd, Las Vegas, NV 89109",
    officialUrl: "https://www.rwlasvegas.com/",
  },
  {
    slug: "aria",
    name: "Aria",
    cluster: "strip",
    address: "3730 S Las Vegas Blvd, Las Vegas, NV 89158",
    officialUrl: "https://aria.mgmresorts.com/",
  },
  {
    slug: "park-mgm",
    name: "Park MGM",
    cluster: "strip",
    address: "3770 S Las Vegas Blvd, Las Vegas, NV 89109",
    officialUrl: "https://parkmgm.mgmresorts.com/",
  },
  {
    slug: "cosmopolitan",
    name: "The Cosmopolitan",
    cluster: "strip",
    address: "3708 S Las Vegas Blvd, Las Vegas, NV 89109",
    officialUrl: "https://www.cosmopolitanlasvegas.com/",
  },
  {
    slug: "flamingo",
    name: "Flamingo",
    cluster: "strip",
    address: "3555 S Las Vegas Blvd, Las Vegas, NV 89109",
    officialUrl: "https://www.caesars.com/flamingo-las-vegas",
  },
  {
    slug: "paris-las-vegas",
    name: "Paris Las Vegas",
    cluster: "strip",
    address: "3655 S Las Vegas Blvd, Las Vegas, NV 89109",
    officialUrl: "https://www.caesars.com/paris-las-vegas",
  },
  {
    slug: "planet-hollywood",
    name: "Planet Hollywood",
    cluster: "strip",
    address: "3667 S Las Vegas Blvd, Las Vegas, NV 89109",
    officialUrl: "https://www.caesars.com/planet-hollywood",
  },
  {
    slug: "mandalay-bay",
    name: "Mandalay Bay",
    cluster: "strip",
    address: "3950 S Las Vegas Blvd, Las Vegas, NV 89119",
    officialUrl: "https://mandalaybay.mgmresorts.com/",
  },
  {
    slug: "new-york-new-york",
    name: "New York-New York",
    cluster: "strip",
    address: "3790 S Las Vegas Blvd, Las Vegas, NV 89109",
    officialUrl: "https://newyorknewyork.mgmresorts.com/",
  },
  {
    slug: "luxor",
    name: "Luxor",
    cluster: "strip",
    address: "3900 S Las Vegas Blvd, Las Vegas, NV 89119",
    officialUrl: "https://luxor.mgmresorts.com/",
  },
  {
    slug: "excalibur",
    name: "Excalibur",
    cluster: "strip",
    address: "3850 S Las Vegas Blvd, Las Vegas, NV 89109",
    officialUrl: "https://excalibur.mgmresorts.com/",
  },
  {
    slug: "treasure-island",
    name: "Treasure Island",
    cluster: "strip",
    address: "3300 S Las Vegas Blvd, Las Vegas, NV 89109",
    officialUrl: "https://treasureisland.com/",
  },
  {
    slug: "sphere",
    name: "Sphere",
    cluster: "strip",
    address: "255 Sands Ave, Las Vegas, NV 89169",
    officialUrl: "https://www.thesphere.com/",
  },
  {
    slug: "downtown-cluster",
    name: "Downtown Las Vegas",
    cluster: "downtown",
    address: "Fremont Street and surrounding downtown venues, Las Vegas, NV",
  },
];

export const VEGAS_VENUES: VegasVenue[] = [
  {
    slug: "ka-theater",
    name: "KA Theatre",
    casinoSlug: "mgm-grand",
    venueType: "casino-theater",
    cluster: "casino-theater",
    address: "MGM Grand, Las Vegas",
    ticketSources: ["ticketmaster", "venue"],
  },
  {
    slug: "david-copperfield-theater",
    name: "David Copperfield Theater",
    casinoSlug: "mgm-grand",
    venueType: "showroom",
    cluster: "magic-comedy",
    address: "MGM Grand, Las Vegas",
    ticketSources: ["ticketmaster", "venue"],
  },
  {
    slug: "o-theatre",
    name: "O Theatre",
    casinoSlug: "bellagio",
    venueType: "casino-theater",
    cluster: "casino-theater",
    address: "Bellagio, Las Vegas",
    ticketSources: ["ticketmaster", "venue"],
  },
  {
    slug: "the-colosseum",
    name: "The Colosseum",
    casinoSlug: "caesars-palace",
    venueType: "casino-theater",
    cluster: "strip-mega",
    address: "Caesars Palace, Las Vegas",
    ticketSources: ["ticketmaster", "venue"],
  },
  {
    slug: "voltaire",
    name: "Voltaire",
    casinoSlug: "venetian-palazzo",
    venueType: "lounge",
    cluster: "jazz-lounge",
    address: "Venetian, Las Vegas",
    ticketSources: ["venue"],
  },
  {
    slug: "resorts-world-theatre",
    name: "Resorts World Theatre",
    casinoSlug: "resorts-world",
    venueType: "casino-theater",
    cluster: "strip-mega",
    address: "Resorts World, Las Vegas",
    ticketSources: ["ticketmaster", "venue"],
  },
  {
    slug: "encore-theater",
    name: "Encore Theater",
    casinoSlug: "wynn-encore",
    venueType: "casino-theater",
    cluster: "casino-theater",
    address: "Encore, Las Vegas",
    ticketSources: ["ticketmaster", "venue"],
  },
  {
    slug: "dolby-live",
    name: "Dolby Live",
    casinoSlug: "park-mgm",
    venueType: "arena",
    cluster: "strip-mega",
    address: "Park MGM, Las Vegas",
    ticketSources: ["ticketmaster", "venue"],
  },
  {
    slug: "sphere-main-venue",
    name: "Sphere",
    casinoSlug: "sphere",
    venueType: "arena",
    cluster: "strip-mega",
    address: "255 Sands Ave, Las Vegas, NV 89169",
    ticketSources: ["ticketmaster", "venue"],
  },
  {
    slug: "flamingo-showroom",
    name: "Flamingo Showroom",
    casinoSlug: "flamingo",
    venueType: "showroom",
    cluster: "magic-comedy",
    address: "Flamingo, Las Vegas",
    ticketSources: ["ticketmaster", "venue"],
  },
  {
    slug: "bakkt-theater",
    name: "Bakkt Theater",
    casinoSlug: "planet-hollywood",
    venueType: "casino-theater",
    cluster: "casino-theater",
    address: "Planet Hollywood, Las Vegas",
    ticketSources: ["ticketmaster", "venue"],
  },
  {
    slug: "michael-jackson-one-theater",
    name: "Michael Jackson ONE Theatre",
    casinoSlug: "mandalay-bay",
    venueType: "casino-theater",
    cluster: "casino-theater",
    address: "Mandalay Bay, Las Vegas",
    ticketSources: ["ticketmaster", "venue"],
  },
  {
    slug: "new-york-new-york-theater",
    name: "Mad Apple Theater",
    casinoSlug: "new-york-new-york",
    venueType: "casino-theater",
    cluster: "casino-theater",
    address: "New York-New York, Las Vegas",
    ticketSources: ["ticketmaster", "venue"],
  },
  {
    slug: "luxor-theater",
    name: "Luxor Theater",
    casinoSlug: "luxor",
    venueType: "showroom",
    cluster: "magic-comedy",
    address: "Luxor, Las Vegas",
    ticketSources: ["ticketmaster", "venue"],
  },
  {
    slug: "treasure-island-theater",
    name: "Treasure Island Theater",
    casinoSlug: "treasure-island",
    venueType: "showroom",
    cluster: "magic-comedy",
    address: "Treasure Island, Las Vegas",
    ticketSources: ["ticketmaster", "venue"],
  },
  {
    slug: "smith-center",
    name: "The Smith Center",
    venueType: "performing-arts-center",
    cluster: "performing-arts",
    address: "361 Symphony Park Ave, Las Vegas, NV 89106",
    officialUrl: "https://thesmithcenter.com/",
    ticketSources: ["venue"],
  },
  {
    slug: "downtown-event-center",
    name: "Downtown Event Center",
    casinoSlug: "downtown-cluster",
    venueType: "club",
    cluster: "downtown",
    address: "Downtown Las Vegas, NV",
    ticketSources: ["ticketmaster", "venue"],
  },
];

export function getVegasCasinoBySlug(slug: string) {
  return VEGAS_CASINOS.find((casino) => casino.slug === slug) || null;
}

export function getVegasVenuesByCasinoSlug(casinoSlug: string) {
  return VEGAS_VENUES.filter((venue) => venue.casinoSlug === casinoSlug);
}

export function groupVegasVenuesByCluster() {
  const groups = new Map<VegasVenueCluster, VegasVenue[]>();
  for (const venue of VEGAS_VENUES) {
    const current = groups.get(venue.cluster) || [];
    current.push(venue);
    groups.set(venue.cluster, current);
  }
  return groups;
}
