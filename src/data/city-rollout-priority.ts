export type CityRolloutPhase =
  | "foundation"
  | "major-tourism"
  | "experience-markets"
  | "entertainment-towns";

export type CityRolloutStatus = "live" | "in-progress" | "planned";

export type CityRolloutPriority = {
  cityKey: string;
  cityName: string;
  phase: CityRolloutPhase;
  phaseOrder: number;
  overallRank: number;
  status: CityRolloutStatus;
  whyNow: string;
  templateFocus: string[];
  priorityLanes: string[];
};

export const CITY_ROLLOUT_PRIORITY: CityRolloutPriority[] = [
  {
    cityKey: "las-vegas",
    cityName: "Las Vegas",
    phase: "foundation",
    phaseOrder: 1,
    overallRank: 1,
    status: "live",
    whyNow: "Strongest current DCC node for shows, tours, helicopter, nightlife, and commercial spoke expansion.",
    templateFocus: ["city authority", "shows", "adventure", "best-of spokes", "activity hubs"],
    priorityLanes: ["shows", "day-trips", "helicopter", "nightlife", "adventure"],
  },
  {
    cityKey: "miami",
    cityName: "Miami",
    phase: "foundation",
    phaseOrder: 2,
    overallRank: 2,
    status: "live",
    whyNow: "High-intent water-activity market with strong excursion and nightlife adjacency.",
    templateFocus: ["city authority", "adventure", "best-of spokes", "water activity hubs"],
    priorityLanes: ["water-activities", "jet-ski-rentals", "boat-tours", "helicopter", "nightlife"],
  },
  {
    cityKey: "orlando",
    cityName: "Orlando",
    phase: "foundation",
    phaseOrder: 3,
    overallRank: 3,
    status: "live",
    whyNow: "Huge tourism footprint with strong outdoor-contrast and family-adventure monetization beyond parks.",
    templateFocus: ["city authority", "adventure", "best-of spokes", "activity hubs"],
    priorityLanes: ["airboat-tours", "balloon-rides", "skydiving", "water-activities", "theme-park alternatives"],
  },
  {
    cityKey: "new-orleans",
    cityName: "New Orleans",
    phase: "foundation",
    phaseOrder: 4,
    overallRank: 4,
    status: "live",
    whyNow: "Strong music, festival, food, and swamp-tour graph with clear authority and seasonal-pressure value.",
    templateFocus: ["city authority", "shows", "festivals", "best-of spokes", "swamp activity hubs"],
    priorityLanes: ["shows", "festivals", "swamp-tours", "ghost-tours", "food-tours"],
  },
  {
    cityKey: "new-york-city",
    cityName: "New York City",
    phase: "major-tourism",
    phaseOrder: 1,
    overallRank: 5,
    status: "live",
    whyNow: "Broadway, observation decks, museums, and harbor inventory make this one of the highest-value authority nodes in the network.",
    templateFocus: ["city authority", "shows", "attractions", "venue nodes", "best-of spokes"],
    priorityLanes: ["shows", "attractions", "harbor-cruises", "observation-decks", "museum-tours"],
  },
  {
    cityKey: "los-angeles",
    cityName: "Los Angeles",
    phase: "major-tourism",
    phaseOrder: 2,
    overallRank: 6,
    status: "live",
    whyNow: "Large tourism footprint with studio tours, venue inventory, and beach-city adjacency.",
    templateFocus: ["city authority", "attractions", "shows", "best-of spokes", "venue nodes"],
    priorityLanes: ["studio-tours", "hollywood-tours", "shows", "beaches", "theme-parks"],
  },
  {
    cityKey: "chicago",
    cityName: "Chicago",
    phase: "major-tourism",
    phaseOrder: 3,
    overallRank: 7,
    status: "live",
    whyNow: "Strong performing arts, architecture-tour, museum, and event-intent city.",
    templateFocus: ["city authority", "shows", "venue nodes", "best-of spokes"],
    priorityLanes: ["architecture-tours", "shows", "jazz", "museums", "river-cruises"],
  },
  {
    cityKey: "san-francisco",
    cityName: "San Francisco",
    phase: "major-tourism",
    phaseOrder: 4,
    overallRank: 8,
    status: "live",
    whyNow: "High-signal city for sightseeing, Alcatraz, bridge views, harbor routes, and wine-country adjacency.",
    templateFocus: ["city authority", "attractions", "best-of spokes", "activity hubs"],
    priorityLanes: ["alcatraz-tours", "sightseeing", "wine-country", "harbor-cruises", "day-trips"],
  },
  {
    cityKey: "nashville",
    cityName: "Nashville",
    phase: "experience-markets",
    phaseOrder: 1,
    overallRank: 9,
    status: "live",
    whyNow: "Show-lane groundwork already exists, making this the easiest next music-tourism scale city.",
    templateFocus: ["city authority", "shows", "venue nodes", "best-of spokes"],
    priorityLanes: ["shows", "live-music", "honky-tonks", "country-tours", "songwriter-rounds"],
  },
  {
    cityKey: "austin",
    cityName: "Austin",
    phase: "experience-markets",
    phaseOrder: 2,
    overallRank: 10,
    status: "live",
    whyNow: "Good overlap between live music, urban tourism, and outdoor-activity intent.",
    templateFocus: ["city authority", "shows", "adventure", "best-of spokes"],
    priorityLanes: ["live-music", "food-tours", "bat-cruises", "day-trips", "lake-activities"],
  },
  {
    cityKey: "san-diego",
    cityName: "San Diego",
    phase: "experience-markets",
    phaseOrder: 3,
    overallRank: 11,
    status: "live",
    whyNow: "Excellent harbor, beach, zoo, and whale-watching inventory with strong family and cruise overlap.",
    templateFocus: ["city authority", "adventure", "attractions", "best-of spokes"],
    priorityLanes: ["harbor-cruises", "whale-watching", "zoo", "water-activities", "beaches"],
  },
  {
    cityKey: "denver",
    cityName: "Denver",
    phase: "experience-markets",
    phaseOrder: 4,
    overallRank: 12,
    status: "live",
    whyNow: "Outdoor gateway market with existing Colorado ecosystem overlap, useful once city normalization is cleaner.",
    templateFocus: ["city authority", "adventure", "regional spokes", "venue nodes"],
    priorityLanes: ["day-trips", "mountain-activities", "concert-transport", "outdoor-adventure", "national-park gateways"],
  },
  {
    cityKey: "branson",
    cityName: "Branson",
    phase: "entertainment-towns",
    phaseOrder: 1,
    overallRank: 13,
    status: "live",
    whyNow: "True show-market city with dense entertainment-node potential and strong tourism intent.",
    templateFocus: ["city authority", "shows", "venue nodes", "best-of spokes"],
    priorityLanes: ["shows", "family-entertainment", "music-theaters", "comedy", "attractions"],
  },
  {
    cityKey: "wisconsin-dells",
    cityName: "Wisconsin Dells",
    phase: "entertainment-towns",
    phaseOrder: 2,
    overallRank: 14,
    status: "live",
    whyNow: "High family-attraction density with waterpark and entertainment-town search behavior.",
    templateFocus: ["city authority", "attractions", "adventure", "best-of spokes"],
    priorityLanes: ["waterparks", "family-attractions", "shows", "outdoor-activities", "rentals"],
  },
  {
    cityKey: "pigeon-forge",
    cityName: "Pigeon Forge",
    phase: "entertainment-towns",
    phaseOrder: 3,
    overallRank: 15,
    status: "live",
    whyNow: "Strong entertainment-town plus attraction-market hybrid with close Gatlinburg spillover.",
    templateFocus: ["city authority", "attractions", "shows", "best-of spokes"],
    priorityLanes: ["family-attractions", "shows", "dinner-theaters", "mountain-activities", "day-trips"],
  },
  {
    cityKey: "washington-dc",
    cityName: "Washington, DC",
    phase: "major-tourism",
    phaseOrder: 5,
    overallRank: 16,
    status: "live",
    whyNow: "High-intent civic tourism market with museum, monument, and event demand that fits DCC's route-first planning model.",
    templateFocus: ["city authority", "attractions", "museums", "best-of spokes", "event nodes"],
    priorityLanes: ["museums", "monuments", "shows", "day-trips", "walkable-neighborhoods"],
  },
  {
    cityKey: "boston",
    cityName: "Boston",
    phase: "major-tourism",
    phaseOrder: 6,
    overallRank: 17,
    status: "live",
    whyNow: "Strong overlap between historic tourism, sports travel, harbor activity, and compact-city trip planning.",
    templateFocus: ["city authority", "attractions", "sports", "best-of spokes", "harbor routes"],
    priorityLanes: ["history-tours", "harbor-cruises", "sports", "museums", "day-trips"],
  },
  {
    cityKey: "seattle",
    cityName: "Seattle",
    phase: "major-tourism",
    phaseOrder: 7,
    overallRank: 18,
    status: "live",
    whyNow: "Strong urban tourism with harbor, market, mountain-day-trip, and event demand that fits a city hub well.",
    templateFocus: ["city authority", "attractions", "harbor routes", "best-of spokes", "event nodes"],
    priorityLanes: ["harbor-cruises", "observation-views", "day-trips", "markets", "shows"],
  },
  {
    cityKey: "honolulu",
    cityName: "Honolulu",
    phase: "major-tourism",
    phaseOrder: 8,
    overallRank: 19,
    status: "live",
    whyNow: "Destination-led tourism market with beach, harbor, and island-excursion demand that benefits from route-first planning.",
    templateFocus: ["city authority", "beaches", "excursions", "best-of spokes", "activity hubs"],
    priorityLanes: ["beaches", "harbor-cruises", "pearl-harbor", "island-tours", "sunset-cruises"],
  },
  {
    cityKey: "phoenix",
    cityName: "Phoenix",
    phase: "experience-markets",
    phaseOrder: 5,
    overallRank: 20,
    status: "live",
    whyNow: "Useful desert-city authority node with event demand, golf adjacency, and day-trip crossover into Arizona experience markets.",
    templateFocus: ["city authority", "adventure", "day-trips", "best-of spokes"],
    priorityLanes: ["desert-day-trips", "sports", "outdoor-adventure", "golf", "attractions"],
  },
  {
    cityKey: "scottsdale",
    cityName: "Scottsdale",
    phase: "experience-markets",
    phaseOrder: 6,
    overallRank: 21,
    status: "live",
    whyNow: "High-intent leisure market with nightlife, resort planning, and desert-activity demand that converts well.",
    templateFocus: ["city authority", "nightlife", "resorts", "best-of spokes", "adventure"],
    priorityLanes: ["resorts", "nightlife", "spa-days", "jeep-tours", "desert-activities"],
  },
  {
    cityKey: "san-antonio",
    cityName: "San Antonio",
    phase: "experience-markets",
    phaseOrder: 7,
    overallRank: 22,
    status: "live",
    whyNow: "Strong family and heritage travel market with River Walk planning, attractions, and day-tour potential.",
    templateFocus: ["city authority", "attractions", "family-travel", "best-of spokes"],
    priorityLanes: ["river-walk", "history-tours", "family-attractions", "food-tours", "day-trips"],
  },
  {
    cityKey: "tampa",
    cityName: "Tampa",
    phase: "experience-markets",
    phaseOrder: 8,
    overallRank: 23,
    status: "live",
    whyNow: "Florida leisure market with sports, water activity, and cruise-adjacent trip planning that fits the DCC model.",
    templateFocus: ["city authority", "water-activities", "sports", "best-of spokes", "family-travel"],
    priorityLanes: ["water-activities", "sports", "beaches", "family-attractions", "day-trips"],
  },
  {
    cityKey: "portland",
    cityName: "Portland",
    phase: "experience-markets",
    phaseOrder: 9,
    overallRank: 24,
    status: "live",
    whyNow: "Compact city with strong food, neighborhood, and nature-adjacent planning value for a practical authority page.",
    templateFocus: ["city authority", "food", "day-trips", "best-of spokes", "neighborhood routes"],
    priorityLanes: ["food-tours", "day-trips", "gardens", "markets", "shows"],
  },
  {
    cityKey: "salt-lake-city",
    cityName: "Salt Lake City",
    phase: "experience-markets",
    phaseOrder: 10,
    overallRank: 25,
    status: "live",
    whyNow: "Useful mountain gateway market with seasonal trip planning, event demand, and outdoor crossover.",
    templateFocus: ["city authority", "mountain-gateway", "adventure", "best-of spokes"],
    priorityLanes: ["mountain-day-trips", "ski-planning", "outdoor-adventure", "concerts", "city-breaks"],
  },
];

export const CITY_ROLLOUT_PHASE_ORDER: CityRolloutPhase[] = [
  "foundation",
  "major-tourism",
  "experience-markets",
  "entertainment-towns",
];

export function getCityRolloutPhase(phase: CityRolloutPhase) {
  return CITY_ROLLOUT_PRIORITY.filter((city) => city.phase === phase).sort(
    (a, b) => a.phaseOrder - b.phaseOrder
  );
}

export function getLiveCityRolloutNodes() {
  return CITY_ROLLOUT_PRIORITY.filter((city) => city.status === "live").sort(
    (a, b) => a.overallRank - b.overallRank
  );
}

export function getNextPlannedCityRolloutNodes(limit = 5) {
  return CITY_ROLLOUT_PRIORITY.filter((city) => city.status === "planned")
    .sort((a, b) => a.overallRank - b.overallRank)
    .slice(0, limit);
}
