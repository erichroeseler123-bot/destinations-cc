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
    status: "planned",
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
    status: "planned",
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
    status: "planned",
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
    status: "planned",
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
    status: "planned",
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
    status: "planned",
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
    status: "planned",
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
    status: "planned",
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
    status: "planned",
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
    status: "planned",
    whyNow: "Strong entertainment-town plus attraction-market hybrid with close Gatlinburg spillover.",
    templateFocus: ["city authority", "attractions", "shows", "best-of spokes"],
    priorityLanes: ["family-attractions", "shows", "dinner-theaters", "mountain-activities", "day-trips"],
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
