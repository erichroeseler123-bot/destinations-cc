export type CruisePortGeo = {
  latitude: number;
  longitude: number;
};

export type CruisePortAddress = {
  addressLocality: string;
  addressRegion?: string;
  addressCountry: string;
  postalCode?: string;
  streetAddress?: string;
};

const CRUISE_PORT_GEO: Record<string, CruisePortGeo> = {
  "costa-maya-mexico": { latitude: 18.715278, longitude: -87.699722 },
  "cozumel-mexico": { latitude: 20.510982, longitude: -86.949089 },
  "galveston-usa": { latitude: 29.310778, longitude: -94.793304 },
  "juneau-alaska": { latitude: 58.300493, longitude: -134.410147 },
  "ketchikan-alaska": { latitude: 55.342222, longitude: -131.646111 },
  "miami-usa": { latitude: 25.778137, longitude: -80.179100 },
  "nassau-bahamas": { latitude: 25.078144, longitude: -77.343063 },
  "perfect-day-at-cococay": { latitude: 25.817576, longitude: -77.941844 },
  "roatan-honduras": { latitude: 16.329300, longitude: -86.535200 },
  "seattle-usa": { latitude: 47.602606, longitude: -122.339083 },
  "seward-alaska": { latitude: 60.119778, longitude: -149.442889 },
  "skagway-alaska": { latitude: 59.455583, longitude: -135.323639 },
  "st-maarten": { latitude: 18.021700, longitude: -63.045800 },
  "st-thomas": { latitude: 18.336000, longitude: -64.939000 },
};

const CRUISE_PORT_ADDRESS: Record<string, CruisePortAddress> = {
  "costa-maya-mexico": {
    addressLocality: "Costa Maya",
    addressRegion: "Quintana Roo",
    addressCountry: "MX",
    postalCode: "77984",
    streetAddress: "Puerto Costa Maya Cruise Terminal",
  },
  "cozumel-mexico": {
    addressLocality: "Cozumel",
    addressRegion: "Quintana Roo",
    addressCountry: "MX",
    postalCode: "77600",
    streetAddress: "SSA International Pier",
  },
  "galveston-usa": {
    addressLocality: "Galveston",
    addressRegion: "Texas",
    addressCountry: "US",
    postalCode: "77550",
    streetAddress: "Galveston Wharves Cruise Terminal",
  },
  "juneau-alaska": {
    addressLocality: "Juneau",
    addressRegion: "Alaska",
    addressCountry: "US",
    postalCode: "99801",
    streetAddress: "Downtown Juneau Cruise Docks",
  },
  "ketchikan-alaska": {
    addressLocality: "Ketchikan",
    addressRegion: "Alaska",
    addressCountry: "US",
    postalCode: "99901",
    streetAddress: "Ketchikan Cruise Berths",
  },
  "miami-usa": {
    addressLocality: "Miami",
    addressRegion: "Florida",
    addressCountry: "US",
    postalCode: "33132",
    streetAddress: "PortMiami Cruise Terminals",
  },
  "nassau-bahamas": {
    addressLocality: "Nassau",
    addressRegion: "New Providence",
    addressCountry: "BS",
    postalCode: "N-4777",
    streetAddress: "Nassau Cruise Port",
  },
  "perfect-day-at-cococay": {
    addressLocality: "CocoCay",
    addressRegion: "Berry Islands",
    addressCountry: "BS",
    streetAddress: "Perfect Day at CocoCay Cruise Pier",
  },
  "roatan-honduras": {
    addressLocality: "Roatan",
    addressRegion: "Bay Islands",
    addressCountry: "HN",
    streetAddress: "Mahogany Bay Cruise Center",
  },
  "seattle-usa": {
    addressLocality: "Seattle",
    addressRegion: "Washington",
    addressCountry: "US",
    postalCode: "98134",
    streetAddress: "Bell Street Pier Cruise Terminal",
  },
  "seward-alaska": {
    addressLocality: "Seward",
    addressRegion: "Alaska",
    addressCountry: "US",
    postalCode: "99664",
    streetAddress: "Seward Cruise Terminal",
  },
  "skagway-alaska": {
    addressLocality: "Skagway",
    addressRegion: "Alaska",
    addressCountry: "US",
    postalCode: "99840",
    streetAddress: "Skagway Ore Dock",
  },
  "st-maarten": {
    addressLocality: "Philipsburg",
    addressRegion: "Sint Maarten",
    addressCountry: "SX",
    streetAddress: "A.C. Wathey Cruise & Cargo Facilities",
  },
  "st-thomas": {
    addressLocality: "Charlotte Amalie",
    addressRegion: "U.S. Virgin Islands",
    addressCountry: "US",
    postalCode: "00802",
    streetAddress: "Havensight Cruise Pier",
  },
};

export function getCruisePortGeo(slug: string): CruisePortGeo | null {
  return CRUISE_PORT_GEO[slug] || null;
}

export function hasCruisePortGeo(slug: string): boolean {
  return Boolean(CRUISE_PORT_GEO[slug]);
}

export function getCruisePortAddress(slug: string): CruisePortAddress | null {
  return CRUISE_PORT_ADDRESS[slug] || null;
}

export function hasCruisePortAddress(slug: string): boolean {
  return Boolean(CRUISE_PORT_ADDRESS[slug]);
}
