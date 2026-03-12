export type AdventureLaneItem = {
  title: string;
  description: string;
  query: string;
  ctaLabel: string;
};

export type CityAdventureLaneConfig = {
  cityKey: string;
  cityName: string;
  sectionTitle: string;
  sectionDescription: string;
  categories: AdventureLaneItem[];
};

export const CITY_ADVENTURE_LANES: Record<string, CityAdventureLaneConfig> = {
  "las-vegas": {
    cityKey: "las-vegas",
    cityName: "Las Vegas",
    sectionTitle: "Adventure flights, rentals, and water activities",
    sectionDescription:
      "Use this lane for bookable thrill and rental categories that sit outside the classic canyon-tour stack: hot air balloons, tandem jumps, jet skis, scooters, and other high-intent adventure inventory.",
    categories: [
      {
        title: "Hot air balloon rides",
        description:
          "Sunrise desert flights and scenic balloon experiences for couples, celebration trips, and premium-photo buyers.",
        query: "hot air balloon ride las vegas",
        ctaLabel: "Browse balloon rides",
      },
      {
        title: "Skydiving and tandem jumps",
        description:
          "Bucket-list jump inventory for visitors who want a distinct thrill lane instead of a standard sightseeing product.",
        query: "skydiving las vegas",
        ctaLabel: "Browse skydiving",
      },
      {
        title: "Water sports and rentals",
        description:
          "Lake-focused adventure inventory including jet skis, power rentals, paddle options, and other water-first experiences.",
        query: "water sports las vegas lake mead",
        ctaLabel: "Browse water activities",
      },
      {
        title: "Jet ski rentals and tours",
        description:
          "High-conversion rental and guided-water category for buyers who want something shorter and more active than a full-day tour.",
        query: "jet ski rental las vegas",
        ctaLabel: "Browse jet skis",
      },
      {
        title: "Moped and scooter rentals",
        description:
          "Short-format city exploration inventory for visitors who want more control over Strip-adjacent movement and casual sightseeing.",
        query: "moped scooter rental las vegas",
        ctaLabel: "Browse scooter rentals",
      },
    ],
  },
  "new-orleans": {
    cityKey: "new-orleans",
    cityName: "New Orleans",
    sectionTitle: "Adventure and active experience categories",
    sectionDescription:
      "New Orleans converts best on swamp and music lanes first, but there is still real buyer intent for active categories like bayou water activities, scooter rentals, and scenic flight-style experiences.",
    categories: [
      {
        title: "Hot air balloon and scenic flight style experiences",
        description:
          "A lighter-volume but still valid celebration lane for travelers who want a scenic or premium-format activity outside the Quarter.",
        query: "hot air balloon ride new orleans",
        ctaLabel: "Browse balloon-style experiences",
      },
      {
        title: "Kayak, paddle, and bayou water activities",
        description:
          "Water-first activity inventory for visitors who want more movement and less standard tour-bus pacing.",
        query: "kayak bayou tour new orleans",
        ctaLabel: "Browse water activities",
      },
      {
        title: "Jet ski and fast-water experiences",
        description:
          "Smaller-format adrenaline inventory for buyers who want speed and novelty instead of a history-heavy route.",
        query: "jet ski rental new orleans",
        ctaLabel: "Browse jet skis",
      },
      {
        title: "Moped and scooter rentals",
        description:
          "Flexible city-exploration inventory for neighborhoods and shorter self-directed discovery blocks.",
        query: "moped scooter rental new orleans",
        ctaLabel: "Browse scooter rentals",
      },
      {
        title: "Airboat and active swamp combinations",
        description:
          "Use this as the bridge between New Orleans' strongest core money lane and more active outdoor buyers.",
        query: "new orleans airboat swamp adventure",
        ctaLabel: "Browse swamp adventure",
      },
    ],
  },
};

export function getCityAdventureLane(cityKey: string): CityAdventureLaneConfig | null {
  return CITY_ADVENTURE_LANES[cityKey] || null;
}
