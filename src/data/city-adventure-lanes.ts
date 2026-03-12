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
  miami: {
    cityKey: "miami",
    cityName: "Miami",
    sectionTitle: "Water sports, rentals, and aerial adventure lanes",
    sectionDescription:
      "Miami is a natural fit for bookable adventure inventory: Biscayne water activities, jet skis, parasailing, boat-based action, and short-format thrill products.",
    categories: [
      {
        title: "Jet ski rentals and tours",
        description:
          "One of Miami's clearest high-intent categories for short, energetic, bookable water activity inventory.",
        query: "jet ski rental miami",
        ctaLabel: "Browse jet skis",
      },
      {
        title: "Water activities and parasailing",
        description:
          "Boat-led and water-led activity inventory for buyers who want speed, skyline views, or simple beach-day upgrades.",
        query: "parasailing water activities miami",
        ctaLabel: "Browse water activities",
      },
      {
        title: "Kayak and paddle experiences",
        description:
          "Lower-friction active inventory for Biscayne, mangrove, and calmer water exploration.",
        query: "kayak paddleboard tour miami",
        ctaLabel: "Browse kayak and paddle",
      },
      {
        title: "Helicopter and aerial sightseeing",
        description:
          "Premium-format activity inventory for skyline, coastline, and celebration-trip buyers.",
        query: "helicopter tour miami",
        ctaLabel: "Browse helicopter flights",
      },
      {
        title: "Scooter and mobility rentals",
        description:
          "Short-distance exploration inventory for South Beach and city-near routing that sits outside the main excursion stack.",
        query: "scooter moped rental miami",
        ctaLabel: "Browse scooter rentals",
      },
    ],
  },
  orlando: {
    cityKey: "orlando",
    cityName: "Orlando",
    sectionTitle: "Adventure activities beyond the theme-park core",
    sectionDescription:
      "Orlando converts first on parks and family attractions, but there is still a strong secondary lane for airboats, balloon flights, skydiving, water sports, and active rentals.",
    categories: [
      {
        title: "Hot air balloon rides",
        description:
          "Sunrise balloon inventory is one of the clearest premium add-ons for Orlando travelers who want one non-park morning activity.",
        query: "hot air balloon ride orlando",
        ctaLabel: "Browse balloon rides",
      },
      {
        title: "Skydiving and tandem jumps",
        description:
          "Bucket-list adventure inventory for visitors extending the trip beyond theme parks and resort time.",
        query: "skydiving orlando",
        ctaLabel: "Browse skydiving",
      },
      {
        title: "Airboat and wildlife adventures",
        description:
          "Florida wetland and wildlife inventory that fits naturally as a contrast to theme-park days.",
        query: "airboat tour orlando",
        ctaLabel: "Browse airboat adventures",
      },
      {
        title: "Jet skis and water activities",
        description:
          "Lake-based activity inventory for buyers who want active outdoor time instead of another full park day.",
        query: "jet ski rental orlando",
        ctaLabel: "Browse water activities",
      },
      {
        title: "Scooter and mobility rentals",
        description:
          "Flexible rental inventory for shorter city movements, resort-adjacent exploration, and low-friction local travel.",
        query: "scooter rental orlando",
        ctaLabel: "Browse scooter rentals",
      },
    ],
  },
};

export function getCityAdventureLane(cityKey: string): CityAdventureLaneConfig | null {
  return CITY_ADVENTURE_LANES[cityKey] || null;
}
