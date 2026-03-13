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

export const CITY_MONEY_LANES: Record<string, CityMoneyLaneConfig> = {
  "new-orleans": {
    cityKey: "new-orleans",
    cityName: "New Orleans",
    sectionTitle: "Priority monetization lane: Airboat + Swamp Tours",
    sectionDescription:
      "Lead with airboat and swamp inventory first. These are typically high-intent, high-conversion categories for New Orleans day-trip buyers.",
    trustLine: "Top-reviewed New Orleans airboat and swamp experiences, prioritized for conversion intent.",
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
    sectionTitle: "Priority Monetization Lane",
    sectionDescription:
      "Lead with high-intent Vegas day-tour categories where booking behavior is strongest: Grand Canyon, Hoover Dam, Antelope Canyon, and helicopter experiences.",
    trustLine: "Top-reviewed Las Vegas day tours prioritized for conversion and repeatable commission flow.",
    primaryCtaLabel: "Browse Vegas Tours",
    primaryCtaHref: "/las-vegas/tours",
    secondaryCtaLabel: "View City Tour Inventory",
    secondaryCtaHref: "/tours?city=las-vegas",
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
    sectionTitle: "Priority Monetization Lane",
    sectionDescription:
      "Lead with Miami's highest-intent excursion categories: Everglades airboat, Biscayne boat tours, Key West day trips, and skyline/night cruise inventory.",
    trustLine: "Top-reviewed Miami excursions prioritized for high booking intent and repeatable commission flow.",
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
    sectionTitle: "Priority Monetization Lane",
    sectionDescription:
      "Lead with Nashville's strongest buyer intent lanes: Broadway nightlife experiences, music history, party transport, and whiskey/distillery tours.",
    trustLine: "Top-reviewed Nashville experiences prioritized for music-driven traveler intent and conversion.",
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
};

export function getCityMoneyLane(cityKey: string): CityMoneyLaneConfig | null {
  return CITY_MONEY_LANES[cityKey] || null;
}
