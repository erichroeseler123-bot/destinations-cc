export type VegasTimeshareResort = {
  slug: string;
  name: string;
  brand: string;
  area: string;
  address: string;
  locationSummary: string;
  stripAccess: string;
  nearby: string[];
  bestFor: string;
  notes: string[];
  mapsQuery: string;
};

export function getVegasTimeshareResort(slug: string) {
  return VEGAS_TIMESHARE_RESORTS.find((resort) => resort.slug === slug) || null;
}

export const VEGAS_TIMESHARE_RESORTS: VegasTimeshareResort[] = [
  {
    slug: "elara-hgv",
    name: "Elara by Hilton Grand Vacations",
    brand: "Hilton Grand Vacations",
    area: "Center Strip",
    address: "80 E Harmon Ave, Las Vegas, NV 89109",
    locationSummary: "Just off the center Strip with direct access near Planet Hollywood and the Miracle Mile area.",
    stripAccess: "Walkable center-Strip position.",
    nearby: ["Planet Hollywood", "Miracle Mile Shops", "Cosmopolitan side of the Strip"],
    bestFor: "Travelers who want a polished resort feel and easy access to mid-Strip dining and shopping.",
    notes: [
      "Strong location if walking access matters more than a casino floor atmosphere.",
      "Usually one of the easier fits for people who want center-Strip convenience.",
    ],
    mapsQuery: "Elara by Hilton Grand Vacations Las Vegas",
  },
  {
    slug: "flamingo-hgv",
    name: "Hilton Grand Vacations Club Flamingo Las Vegas",
    brand: "Hilton Grand Vacations",
    area: "Center Strip",
    address: "3575 Las Vegas Blvd South, Las Vegas, NV 89109",
    locationSummary: "In the heart of the center Strip near Flamingo, LINQ, and Caesars.",
    stripAccess: "Very walkable center-Strip position.",
    nearby: ["Flamingo", "LINQ Promenade", "Caesars Palace"],
    bestFor: "People who want to stay close to the busiest walkable part of Las Vegas.",
    notes: [
      "Good for first-timers who care about easy Strip access.",
      "Makes sense if you want to be close to restaurants, casinos, and nightlife without going far.",
    ],
    mapsQuery: "Hilton Grand Vacations Club Flamingo Las Vegas",
  },
  {
    slug: "boulevard-hgv",
    name: "Hilton Grand Vacations Club on the Las Vegas Strip",
    brand: "Hilton Grand Vacations",
    area: "North Strip",
    address: "2650 Las Vegas Blvd South, Las Vegas, NV 89109",
    locationSummary: "On the north end of the Strip, away from the busiest mid-Strip foot traffic.",
    stripAccess: "On Strip, but north of the center action.",
    nearby: ["Sahara area", "Strat corridor", "Las Vegas Convention Center side"],
    bestFor: "Travelers who want more room and less center-Strip foot traffic.",
    notes: [
      "North Strip can work well if you are fine using rideshare or walking farther.",
      "Often better for travelers who care more about the resort than nonstop mid-Strip activity.",
    ],
    mapsQuery: "Hilton Grand Vacations Club on the Las Vegas Strip",
  },
  {
    slug: "marriott-grand-chateau",
    name: "Marriott's Grand Chateau",
    brand: "Marriott Vacation Club",
    area: "Just off Center Strip",
    address: "75 E Harmon Ave, Las Vegas, NV 89109",
    locationSummary: "Just off Harmon near the center Strip and the Planet Hollywood side of town.",
    stripAccess: "Easy walk into the center Strip.",
    nearby: ["Planet Hollywood", "MGM corridor", "Miracle Mile area"],
    bestFor: "Travelers who want Marriott-style familiarity with strong central access.",
    notes: [
      "Popular choice for people who want a resort-style stay without being deep off-Strip.",
      "Good base if you plan to split time between shows, dining, and one major day trip.",
    ],
    mapsQuery: "Marriott's Grand Chateau Las Vegas",
  },
  {
    slug: "polo-towers",
    name: "Polo Towers",
    brand: "Hilton Vacation Club",
    area: "Center Strip",
    address: "3745 Las Vegas Blvd South, Las Vegas, NV 89109",
    locationSummary: "On the Strip corridor near the center action and south of the Bellagio side.",
    stripAccess: "Walkable center-Strip location.",
    nearby: ["CityCenter area", "Planet Hollywood side", "Bellagio corridor"],
    bestFor: "Travelers who want a practical center-Strip location and easy walks to major resorts.",
    notes: [
      "Useful for people who prioritize Strip position over flashy resort branding.",
      "Often appeals to travelers who want a central base and plan to stay moving.",
    ],
    mapsQuery: "Polo Towers Las Vegas",
  },
  {
    slug: "club-wyndham-grand-desert",
    name: "Club Wyndham Grand Desert",
    brand: "Club Wyndham",
    area: "East of Strip",
    address: "265 E Harmon Ave, Las Vegas, NV 89169",
    locationSummary: "East of the Strip on Harmon, about a mile from the main casino corridor.",
    stripAccess: "Short rideshare or longer walk; not a true on-Strip stay.",
    nearby: ["Harmon corridor", "UNLV side", "airport approach area"],
    bestFor: "People who do not need to stay directly on Las Vegas Boulevard every minute of the trip.",
    notes: [
      "Usually better for people who are comfortable ridesharing instead of walking everywhere.",
      "Can make sense for longer stays where room and value matter more than exact Strip position.",
    ],
    mapsQuery: "Club Wyndham Grand Desert Las Vegas",
  },
  {
    slug: "club-wyndham-desert-blue",
    name: "Club Wyndham Desert Blue",
    brand: "Club Wyndham",
    area: "West of Strip",
    address: "3200 W Twain Ave, Las Vegas, NV 89103",
    locationSummary: "West of the Strip near the Rio and Palms side of town.",
    stripAccess: "Off-Strip stay; rideshare is usually the practical move.",
    nearby: ["Rio side", "Palms side", "west-of-Strip corridor"],
    bestFor: "Travelers who want a timeshare-style resort stay without paying for a center-Strip address.",
    notes: [
      "Best if you expect to use rideshare often.",
      "Can be a practical value play when Strip walking distance is not the top priority.",
    ],
    mapsQuery: "Club Wyndham Desert Blue Las Vegas",
  },
  {
    slug: "tahiti-village",
    name: "Tahiti Village Resort & Spa",
    brand: "Tahiti Village",
    area: "South Las Vegas Boulevard",
    address: "7200 S Las Vegas Blvd, Las Vegas, NV 89119",
    locationSummary: "South of the main Strip near Town Square and the airport side of town.",
    stripAccess: "South Strip location; better for shuttle/rideshare than constant center-Strip walking.",
    nearby: ["Town Square", "airport side of Las Vegas Blvd", "south resort corridor"],
    bestFor: "Families and travelers who want a larger resort feel and do not need to be in the center every hour.",
    notes: [
      "Good fit for people who like a more resort-style property and can live with some distance from center Strip.",
      "South-end location can be easier for airport access and day-trip departures.",
    ],
    mapsQuery: "Tahiti Village Resort & Spa Las Vegas",
  },
  {
    slug: "cancun-resort",
    name: "Hilton Vacation Club Cancun Resort Las Vegas",
    brand: "Hilton Vacation Club",
    area: "South Las Vegas Boulevard",
    address: "8335 S Las Vegas Blvd, Las Vegas, NV 89123",
    locationSummary: "Farther south on Las Vegas Boulevard, away from center-Strip traffic.",
    stripAccess: "South-end resort stay; rideshare or car is the normal move.",
    nearby: ["South Strip", "Silverton side of town", "airport-adjacent south corridor"],
    bestFor: "Travelers who want a resort base and expect to use a car or rideshare regularly.",
    notes: [
      "More about resort stay comfort than spontaneous mid-Strip walking.",
      "Works best for people planning a calmer home base with selected outings.",
    ],
    mapsQuery: "Hilton Vacation Club Cancun Resort Las Vegas",
  },
  {
    slug: "jockey-club",
    name: "Jockey Club",
    brand: "Jockey Club",
    area: "Center Strip",
    address: "3700 S Las Vegas Blvd, Las Vegas, NV 89109",
    locationSummary: "In the center Strip core between the Bellagio and Cosmopolitan side of town.",
    stripAccess: "Very strong center-Strip walking position.",
    nearby: ["Bellagio", "Cosmopolitan", "CityCenter corridor"],
    bestFor: "Travelers who care most about a central location and easy access to major resorts.",
    notes: [
      "Very useful if staying close to center-Strip action matters more than newer resort polish.",
      "Location can be the biggest selling point here.",
    ],
    mapsQuery: "Jockey Club Las Vegas",
  },
];
