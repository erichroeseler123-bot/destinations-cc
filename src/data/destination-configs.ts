import { validateDestinationConfig, type DestinationConfig } from "@/src/data/destination-config-schema";

const configs: DestinationConfig[] = [
  {
    id: "new-orleans",
    slug: "new-orleans",
    name: "New Orleans",
    type: "TouristDestination",
    timezone: "America/Chicago",
    lat: 29.9511,
    lng: -90.0715,
    capabilities: ["weather", "webcams", "streetView", "transit", "events"],
    places: [
      { id: "new-orleans/french-quarter", slug: "french-quarter", name: "French Quarter", kind: "Neighborhood" },
      { id: "new-orleans/bourbon-street", slug: "bourbon-street", name: "Bourbon Street", kind: "District" },
      { id: "new-orleans/jackson-square", slug: "jackson-square", name: "Jackson Square", kind: "Landmark" },
      { id: "new-orleans/frenchmen-street", slug: "frenchmen-street", name: "Frenchmen Street", kind: "District" }
    ],
    liveSources: [
      { id: "new-orleans/weather", type: "weather", provider: "noaa", cacheMinutes: 30, enabled: true },
      { id: "new-orleans/events", type: "events", provider: "registry", cacheMinutes: 30, enabled: true }
    ],
    eventProviders: ["ticketmaster", "eventbrite", "city-calendar"],
    commercialActions: [
      {
        id: "new-orleans/orientation",
        intent: "orientation",
        label: "Get your head around the French Quarter first",
        description: "Use the orientation product when understanding the Quarter is the next problem to solve.",
        href: "https://frenchquarterorientation.com",
        provider: "french-quarter-orientation",
        pageKinds: ["Neighborhood"],
        placeIds: ["new-orleans/french-quarter"],
        priority: 100
      },
      {
        id: "new-orleans/tours",
        intent: "guided-experience",
        label: "Want somebody to actually show you New Orleans?",
        description: "Move into a tour recommendation when the traveler is ready to choose an experience.",
        href: "https://welcometoneworleanstours.com",
        provider: "welcome-to-new-orleans-tours",
        destinationIds: ["new-orleans"],
        priority: 80
      }
    ]
  },
  {
    id: "st-thomas",
    slug: "st-thomas",
    name: "St. Thomas",
    type: "TouristDestination",
    timezone: "America/St_Thomas",
    lat: 18.3419,
    lng: -64.9307,
    capabilities: ["weather", "webcams", "streetView", "events", "cruiseCalls", "marine"],
    places: [
      { id: "st-thomas/crown-bay", slug: "crown-bay", name: "Crown Bay", kind: "Port" },
      { id: "st-thomas/havensight", slug: "havensight", name: "Havensight", kind: "Port" },
      { id: "st-thomas/charlotte-amalie", slug: "charlotte-amalie", name: "Charlotte Amalie", kind: "District" },
      { id: "st-thomas/magens-bay", slug: "magens-bay", name: "Magens Bay", kind: "Beach", relatedIds: ["st-thomas/crown-bay", "st-thomas/mountain-top"] },
      { id: "st-thomas/mountain-top", slug: "mountain-top", name: "Mountain Top", kind: "Viewpoint" },
      { id: "st-thomas/red-hook", slug: "red-hook", name: "Red Hook", kind: "District" }
    ],
    liveSources: [
      { id: "st-thomas/weather", type: "weather", provider: "noaa", cacheMinutes: 30, enabled: true },
      { id: "st-thomas/events", type: "events", provider: "registry", cacheMinutes: 30, enabled: true },
      { id: "st-thomas/cruise-calls", type: "cruise_calls", provider: "cruise-promenade", cacheMinutes: 30, enabled: true }
    ],
    eventProviders: ["ticketmaster", "local-venue-feeds"],
    commercialActions: [
      {
        id: "st-thomas/vibe-driver",
        intent: "private-local-driver",
        label: "Find a local driver for your port day",
        description: "Query live driver availability only after the traveler has a real date, window, and party size.",
        href: "https://vibearoundtown.com",
        provider: "vibe-around-town",
        destinationIds: ["st-thomas"],
        priority: 100
      }
    ]
  },
  {
    id: "breckenridge",
    slug: "breckenridge",
    name: "Breckenridge",
    type: "TouristDestination",
    timezone: "America/Denver",
    lat: 39.4817,
    lng: -106.0384,
    capabilities: ["weather", "webcams", "roads"],
    places: [],
    liveSources: [
      { id: "breckenridge/weather", type: "weather", provider: "noaa", cacheMinutes: 30, enabled: true },
      { id: "breckenridge/roads", type: "roads", provider: "public-road-feed", cacheMinutes: 15, enabled: true }
    ],
    commercialActions: [
      {
        id: "breckenridge/gosno",
        intent: "private-airport-transfer",
        label: "Private DEN transfer through GoSno",
        description: "Use GoSno only when airport-to-resort transportation is the next action.",
        href: "https://gosno.co/breckenridge",
        provider: "gosno",
        destinationIds: ["breckenridge"],
        priority: 100
      }
    ]
  }
];

export const DESTINATION_CONFIGS = configs.map(validateDestinationConfig);

export function getDestinationConfig(id: string) {
  return DESTINATION_CONFIGS.find((config) => config.id === id) ?? null;
}
