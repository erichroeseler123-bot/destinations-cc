export type CityMoneyLaneIntent = {
  label: string;
  query: string;
};

export type CityMoneyLaneConfig = {
  cityKey: string;
  cityName: string;
  sectionTitle: string;
  sectionDescription: string;
  trustLine: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  intents: CityMoneyLaneIntent[];
};

type CityMoneyLaneSeed = Omit<CityMoneyLaneConfig, "primaryCtaLabel" | "primaryCtaHref" | "secondaryCtaLabel" | "secondaryCtaHref"> & {
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
};

function defineCityMoneyLane(seed: CityMoneyLaneSeed): CityMoneyLaneConfig {
  return {
    primaryCtaLabel: `Browse ${seed.cityName} Tours`,
    primaryCtaHref: `/${seed.cityKey}/tours`,
    secondaryCtaLabel: "View City Tour Inventory",
    secondaryCtaHref: `/tours?city=${seed.cityKey}`,
    ...seed,
  };
}

export const CITY_MONEY_LANES: Record<string, CityMoneyLaneConfig> = {
  "new-orleans": {
    cityKey: "new-orleans",
    cityName: "New Orleans",
    sectionTitle: "Popular New Orleans Tours",
    sectionDescription:
      "Start with airboat and swamp tours. They are some of the most popular day-trip choices for New Orleans visitors.",
    trustLine: "Top-reviewed New Orleans airboat and swamp experiences for visitors planning ahead.",
    primaryCtaLabel: "See Airboat Tours",
    primaryCtaHref: "/tours?city=new-orleans&q=new%20orleans%20airboat%20swamp%20tour",
    secondaryCtaLabel: "See Swamp Tours",
    secondaryCtaHref: "/tours?city=new-orleans&q=new%20orleans%20swamp%20tour",
    intents: [
      { label: "Airboat swamp tours (high demand)", query: "new orleans airboat swamp tour" },
      { label: "High-speed bayou airboat rides", query: "new orleans bayou airboat tour" },
      { label: "French Quarter walking tours", query: "french quarter walking tour" },
      { label: "New Orleans food tours", query: "new orleans food tour" },
      { label: "Jazz and live music tours", query: "new orleans jazz tour" },
      { label: "Swamp and bayou tours", query: "new orleans swamp tour" },
      { label: "Ghost and history tours", query: "new orleans ghost tour" },
      { label: "Garden District tours", query: "garden district tour new orleans" },
    ],
  },
  "las-vegas": {
    cityKey: "las-vegas",
    cityName: "Las Vegas",
    sectionTitle: "Popular Las Vegas Tours",
    sectionDescription:
      "Start with the Las Vegas day trips people book most often: Grand Canyon, Hoover Dam, Antelope Canyon, and helicopter experiences.",
    trustLine: "Top-reviewed Las Vegas day tours for visitors who want the strongest options first.",
    primaryCtaLabel: "Browse Vegas Tours",
    primaryCtaHref: "/las-vegas/tours",
    secondaryCtaLabel: "View City Tour Inventory",
    secondaryCtaHref: "/las-vegas/tours",
    intents: [
      { label: "Grand Canyon bus tours", query: "grand canyon tour from las vegas" },
      { label: "Grand Canyon helicopter tours", query: "grand canyon helicopter tour las vegas" },
      { label: "Hoover Dam tours", query: "hoover dam tour from las vegas" },
      { label: "Antelope Canyon tours", query: "antelope canyon tour from las vegas" },
      { label: "Las Vegas helicopter night tours", query: "las vegas helicopter night tour" },
      { label: "Las Vegas Strip night tours", query: "las vegas strip night tour" },
    ],
  },
  miami: {
    cityKey: "miami",
    cityName: "Miami",
    sectionTitle: "Popular Miami Tours",
    sectionDescription:
      "Start with Miami’s most popular excursion categories: Everglades airboat rides, Biscayne boat tours, Key West day trips, and skyline or night cruises.",
    trustLine: "Top-reviewed Miami excursions for travelers planning ahead.",
    primaryCtaLabel: "Browse Miami Tours",
    primaryCtaHref: "/miami/tours",
    secondaryCtaLabel: "View City Tour Inventory",
    secondaryCtaHref: "/tours?city=miami",
    intents: [
      { label: "Everglades airboat tours", query: "everglades airboat tour from miami" },
      { label: "Key West day trips", query: "key west day trip from miami" },
      { label: "Biscayne Bay boat tours", query: "biscayne bay boat tour miami" },
      { label: "Celebrity homes cruises", query: "miami celebrity homes boat tour" },
      { label: "Miami night cruises", query: "miami sunset night cruise" },
      { label: "Miami helicopter tours", query: "miami helicopter tour" },
    ],
  },
  nashville: {
    cityKey: "nashville",
    cityName: "Nashville",
    sectionTitle: "Popular Nashville Experiences",
    sectionDescription:
      "Start with some of Nashville’s most popular experiences: Broadway nightlife, music history, party transport, and whiskey or distillery tours.",
    trustLine: "Top-reviewed Nashville experiences for music-focused travelers.",
    primaryCtaLabel: "Browse Nashville Tours",
    primaryCtaHref: "/nashville/tours",
    secondaryCtaLabel: "View City Tour Inventory",
    secondaryCtaHref: "/tours?city=nashville",
    intents: [
      { label: "Broadway nightlife tours", query: "nashville broadway nightlife tour" },
      { label: "Country music history tours", query: "nashville country music tour" },
      { label: "Distillery and whiskey tours", query: "nashville whiskey distillery tour" },
      { label: "Party bus and tractor tours", query: "nashville party bus tour" },
      { label: "Nashville mural and food tours", query: "nashville food and mural tour" },
      { label: "Franklin day trips", query: "franklin day trip from nashville" },
    ],
  },
  orlando: defineCityMoneyLane({
    cityKey: "orlando",
    cityName: "Orlando",
    sectionTitle: "Popular Orlando Experiences",
    sectionDescription:
      "Start with Orlando categories that work outside the parks: airboat rides, family attractions, bioluminescence outings, and cleaner half-day escapes.",
    trustLine: "High-intent Orlando experiences for visitors who want stronger family and off-park planning.",
    intents: [
      { label: "Orlando airboat tours", query: "orlando airboat tour" },
      { label: "Bioluminescence kayaking", query: "orlando bioluminescence kayaking" },
      { label: "Orlando family activities", query: "orlando family activities" },
      { label: "Orlando sightseeing tours", query: "orlando sightseeing tour" },
      { label: "Kennedy Space Center day trips", query: "kennedy space center day trip from orlando" },
      { label: "Orlando evening experiences", query: "orlando night tour" },
    ],
  }),
  "los-angeles": defineCityMoneyLane({
    cityKey: "los-angeles",
    cityName: "Los Angeles",
    sectionTitle: "Popular Los Angeles Experiences",
    sectionDescription:
      "Start with some of LA’s most practical categories: studio tours, Hollywood routes, celebrity-home sightseeing, and food-forward neighborhood blocks.",
    trustLine: "High-intent Los Angeles experiences for travelers who want cleaner planning across a sprawling city.",
    intents: [
      { label: "Studio tours", query: "los angeles studio tour" },
      { label: "Hollywood sightseeing", query: "hollywood tour los angeles" },
      { label: "Celebrity homes tours", query: "los angeles celebrity homes tour" },
      { label: "Food tours", query: "los angeles food tour" },
      { label: "Beach day tours", query: "los angeles beach tour" },
      { label: "Night sightseeing", query: "los angeles night tour" },
    ],
  }),
  "san-francisco": defineCityMoneyLane({
    cityKey: "san-francisco",
    cityName: "San Francisco",
    sectionTitle: "Popular San Francisco Experiences",
    sectionDescription:
      "Start with San Francisco demand lanes that shape real itineraries: Alcatraz, bay cruises, wine-country escapes, and neighborhood sightseeing.",
    trustLine: "High-intent San Francisco experiences for visitors who want stronger bay and day-trip planning.",
    intents: [
      { label: "Alcatraz tours", query: "alcatraz tour san francisco" },
      { label: "Bay cruises", query: "san francisco bay cruise" },
      { label: "Wine-country day trips", query: "napa sonoma day trip from san francisco" },
      { label: "City sightseeing tours", query: "san francisco sightseeing tour" },
      { label: "Muir Woods day trips", query: "muir woods tour from san francisco" },
      { label: "Food tours", query: "san francisco food tour" },
    ],
  }),
  "san-diego": defineCityMoneyLane({
    cityKey: "san-diego",
    cityName: "San Diego",
    sectionTitle: "Popular San Diego Experiences",
    sectionDescription:
      "Start with some of San Diego’s most bookable categories: harbor cruises, whale watching, waterfront sightseeing, and family-friendly city blocks.",
    trustLine: "High-intent San Diego experiences for travelers who want cleaner harbor and beach planning.",
    intents: [
      { label: "Harbor cruises", query: "san diego harbor cruise" },
      { label: "Whale watching", query: "san diego whale watching" },
      { label: "Waterfront sightseeing", query: "san diego sightseeing tour" },
      { label: "San Diego food tours", query: "san diego food tour" },
      { label: "Beach experiences", query: "san diego beach tour" },
      { label: "Zoo and family attractions", query: "san diego family attractions" },
    ],
  }),
  branson: defineCityMoneyLane({
    cityKey: "branson",
    cityName: "Branson",
    sectionTitle: "Popular Branson Experiences",
    sectionDescription:
      "Start with Branson categories that shape real trips: headline shows, family attractions, Strip planning, and lake-adjacent experiences.",
    trustLine: "High-intent Branson experiences for visitors planning around shows and family demand.",
    intents: [
      { label: "Branson shows", query: "branson shows" },
      { label: "Family attractions", query: "branson family attractions" },
      { label: "Dinner shows", query: "branson dinner show" },
      { label: "Table Rock Lake activities", query: "table rock lake activities branson" },
      { label: "Branson sightseeing tours", query: "branson sightseeing tour" },
      { label: "Highway 76 planning", query: "highway 76 branson attractions" },
    ],
  }),
  "wisconsin-dells": defineCityMoneyLane({
    cityKey: "wisconsin-dells",
    cityName: "Wisconsin Dells",
    sectionTitle: "Popular Wisconsin Dells Experiences",
    sectionDescription:
      "Start with the Dells categories visitors plan around most often: waterparks, boat rides, family attractions, and classic downtown stops.",
    trustLine: "High-intent Wisconsin Dells experiences for families who want cleaner activity pacing.",
    intents: [
      { label: "Waterparks", query: "wisconsin dells waterparks" },
      { label: "Boat tours", query: "wisconsin dells boat tour" },
      { label: "Family attractions", query: "wisconsin dells family attractions" },
      { label: "Downtown Dells activities", query: "downtown wisconsin dells things to do" },
      { label: "Scenic tours", query: "wisconsin dells sightseeing tour" },
      { label: "Indoor waterpark stays", query: "wisconsin dells indoor waterpark resort" },
    ],
  }),
  "pigeon-forge": defineCityMoneyLane({
    cityKey: "pigeon-forge",
    cityName: "Pigeon Forge",
    sectionTitle: "Popular Pigeon Forge Experiences",
    sectionDescription:
      "Start with attractions that shape most Pigeon Forge trips: Dollywood, dinner theaters, Smoky Mountains access, and family entertainment blocks.",
    trustLine: "High-intent Pigeon Forge experiences for visitors balancing attractions, shows, and mountain access.",
    intents: [
      { label: "Dollywood planning", query: "dollywood tickets planning" },
      { label: "Dinner theaters", query: "pigeon forge dinner show" },
      { label: "Smoky Mountains day trips", query: "smoky mountains day trip from pigeon forge" },
      { label: "Family attractions", query: "pigeon forge family attractions" },
      { label: "Parkway things to do", query: "pigeon forge parkway things to do" },
      { label: "Mountain activities", query: "pigeon forge mountain activities" },
    ],
  }),
  "washington-dc": defineCityMoneyLane({
    cityKey: "washington-dc",
    cityName: "Washington, DC",
    sectionTitle: "Popular Washington, DC Experiences",
    sectionDescription:
      "Start with DC categories that help structure the city: monument tours, museum planning, evening monument routes, and waterfront blocks.",
    trustLine: "High-intent Washington experiences for visitors who want stronger museum and monument planning.",
    intents: [
      { label: "Monument tours", query: "washington dc monument tour" },
      { label: "Museum tours", query: "washington dc museum tour" },
      { label: "Night monument tours", query: "washington dc night monument tour" },
      { label: "Capitol and civic tours", query: "washington dc capitol tour" },
      { label: "Food tours", query: "washington dc food tour" },
      { label: "Wharf and waterfront tours", query: "washington dc waterfront tour" },
    ],
  }),
  boston: defineCityMoneyLane({
    cityKey: "boston",
    cityName: "Boston",
    sectionTitle: "Popular Boston Experiences",
    sectionDescription:
      "Start with Boston demand lanes that structure a real visit: Freedom Trail routes, harbor cruises, sports-adjacent planning, and neighborhood food blocks.",
    trustLine: "High-intent Boston experiences for visitors who want stronger history and harbor planning.",
    intents: [
      { label: "Freedom Trail tours", query: "freedom trail tour boston" },
      { label: "Harbor cruises", query: "boston harbor cruise" },
      { label: "Food tours", query: "boston food tour" },
      { label: "Sports-travel blocks", query: "boston sports tour" },
      { label: "Historic sightseeing", query: "boston sightseeing tour" },
      { label: "Cambridge and city walks", query: "boston cambridge walking tour" },
    ],
  }),
  seattle: defineCityMoneyLane({
    cityKey: "seattle",
    cityName: "Seattle",
    sectionTitle: "Popular Seattle Experiences",
    sectionDescription:
      "Start with Seattle categories that shape strong itineraries: waterfront cruises, Pike Place planning, mountain day trips, and live-music nights.",
    trustLine: "High-intent Seattle experiences for visitors who want stronger waterfront and day-trip planning.",
    intents: [
      { label: "Harbor cruises", query: "seattle harbor cruise" },
      { label: "Pike Place tours", query: "pike place market tour" },
      { label: "Mount Rainier day trips", query: "mount rainier day trip from seattle" },
      { label: "Food tours", query: "seattle food tour" },
      { label: "Live-music nights", query: "seattle live music tour" },
      { label: "Bainbridge and ferry routes", query: "bainbridge island day trip from seattle" },
    ],
  }),
};

export function getCityMoneyLane(cityKey: string): CityMoneyLaneConfig | null {
  return CITY_MONEY_LANES[cityKey] || null;
}
