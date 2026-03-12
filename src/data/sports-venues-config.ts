export type SportsVenueConfig = {
  slug: string;
  name: string;
  citySlug: string;
  cityName: string;
  addressNote?: string;
  primaryTeams: string[];
  sportsLeagues: string[];
  description: string;
  whyItMatters: string[];
  relatedPages: Array<{ href: string; label: string }>;
  seatGeekPerformerSlugs?: string[];
  updatedAt: string;
};

export const SPORTS_VENUES_CONFIG: SportsVenueConfig[] = [
  {
    slug: "allegiant-stadium",
    name: "Allegiant Stadium",
    citySlug: "las-vegas",
    cityName: "Las Vegas",
    addressNote: "Las Vegas stadium district, west of the Strip",
    primaryTeams: ["las-vegas-raiders"],
    sportsLeagues: ["nfl"],
    description:
      "Allegiant Stadium is the clearest sports-weekend venue node in Las Vegas, driving football demand, premium hotel overlap, and major event-night routing.",
    whyItMatters: [
      "Raiders weekends create one of the strongest event-pressure patterns in the Las Vegas market.",
      "The stadium sits close enough to Strip planning that visitors routinely combine sports with nightlife, dining, and resort stays.",
      "This venue is a clean bridge between city authority, team nodes, and future event-by-date discovery.",
    ],
    relatedPages: [
      { href: "/vegas", label: "Las Vegas hub" },
      { href: "/sports/team/las-vegas-raiders", label: "Las Vegas Raiders" },
    ],
    seatGeekPerformerSlugs: ["las-vegas-raiders"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "t-mobile-arena",
    name: "T-Mobile Arena",
    citySlug: "las-vegas",
    cityName: "Las Vegas",
    addressNote: "The Strip arena corridor near Park MGM and New York-New York",
    primaryTeams: ["vegas-golden-knights"],
    sportsLeagues: ["nhl"],
    description:
      "T-Mobile Arena is a core Las Vegas venue node for hockey nights and broader arena-event demand tied directly to the Strip.",
    whyItMatters: [
      "Golden Knights games give Vegas a recurring arena-night sports lane that converts differently than stadium weekends.",
      "The venue is tightly connected to the Strip resort grid, so it supports same-night dining and nightlife routing.",
      "T-Mobile Arena is also an important future venue authority candidate beyond sports alone.",
    ],
    relatedPages: [
      { href: "/vegas", label: "Las Vegas hub" },
      { href: "/sports/team/vegas-golden-knights", label: "Vegas Golden Knights" },
    ],
    seatGeekPerformerSlugs: ["vegas-golden-knights"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "hard-rock-stadium",
    name: "Hard Rock Stadium",
    citySlug: "miami",
    cityName: "Miami",
    addressNote: "Miami Gardens, north of the beach and downtown core",
    primaryTeams: ["miami-dolphins"],
    sportsLeagues: ["nfl"],
    description:
      "Hard Rock Stadium is the dominant stadium venue node in the Miami market, shaping weekend sports demand and major-event travel behavior across South Florida.",
    whyItMatters: [
      "Dolphins games create one of the strongest sports-weekend demand patterns in the Miami node.",
      "The venue matters to the larger event graph because it anchors more than one type of large-format live event.",
      "It is a strong future logistics page because visitors need clear location and routing context, not just ticket links.",
    ],
    relatedPages: [
      { href: "/miami", label: "Miami hub" },
      { href: "/sports/team/miami-dolphins", label: "Miami Dolphins" },
    ],
    seatGeekPerformerSlugs: ["miami-dolphins"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "caesars-superdome",
    name: "Caesars Superdome",
    citySlug: "new-orleans",
    cityName: "New Orleans",
    addressNote: "Downtown New Orleans, near the convention and event core",
    primaryTeams: ["new-orleans-saints"],
    sportsLeagues: ["nfl"],
    description:
      "Caesars Superdome is the main stadium-scale venue node in New Orleans, tying Saints demand into downtown hotel, festival, and music-routing behavior.",
    whyItMatters: [
      "Saints weekends push real pricing and crowd pressure across the city.",
      "The Superdome is a core event anchor that fits both sports and broader New Orleans live-event intent.",
      "This venue helps connect the sports graph to the stronger New Orleans festival and city-authority surfaces already live.",
    ],
    relatedPages: [
      { href: "/new-orleans", label: "New Orleans hub" },
      { href: "/sports/team/new-orleans-saints", label: "New Orleans Saints" },
    ],
    seatGeekPerformerSlugs: ["new-orleans-saints"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "kaseya-center",
    name: "Kaseya Center",
    citySlug: "miami",
    cityName: "Miami",
    addressNote: "Downtown Miami and Biscayne Bay arena zone",
    primaryTeams: ["miami-heat"],
    sportsLeagues: ["nba"],
    description:
      "Kaseya Center is the cleanest downtown Miami arena venue node, tying basketball nights to shorter city-break stays and waterfront entertainment plans.",
    whyItMatters: [
      "Heat games create a simpler evening sports product than full weekend stadium travel.",
      "The venue is central to downtown Miami routing and helps bridge sports, nightlife, and bayfront planning.",
      "This is an obvious early arena authority node for the sports graph.",
    ],
    relatedPages: [
      { href: "/miami", label: "Miami hub" },
      { href: "/sports/team/miami-heat", label: "Miami Heat" },
    ],
    seatGeekPerformerSlugs: ["miami-heat"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "loandepot-park",
    name: "loanDepot park",
    citySlug: "miami",
    cityName: "Miami",
    addressNote: "Little Havana ballpark district",
    primaryTeams: ["miami-marlins"],
    sportsLeagues: ["mlb"],
    description:
      "loanDepot park gives the Miami node a true long-season baseball venue, useful for lower-friction sports nights and family or casual ticket buyers.",
    whyItMatters: [
      "Ballpark nights create a different buyer pattern than football weekends or premium arena events.",
      "This venue broadens the Miami sports graph into a slower, more seasonal ticket lane.",
      "It is a useful anchor for future neighborhood-aware venue and event routing in Miami.",
    ],
    relatedPages: [
      { href: "/miami", label: "Miami hub" },
      { href: "/sports/team/miami-marlins", label: "Miami Marlins" },
    ],
    seatGeekPerformerSlugs: ["miami-marlins"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "amerant-bank-arena",
    name: "Amerant Bank Arena",
    citySlug: "miami",
    cityName: "Miami",
    addressNote: "Sunrise arena zone serving the greater South Florida market",
    primaryTeams: ["florida-panthers"],
    sportsLeagues: ["nhl"],
    description:
      "Amerant Bank Arena is the South Florida hockey venue node, connecting Panthers demand to the broader Miami visitor market.",
    whyItMatters: [
      "Panthers games add a strong arena-night lane that is distinct from central Miami nightlife routing.",
      "The venue is valuable because South Florida sports demand does not map cleanly to one downtown core.",
      "It expands the Miami node into a true regional sports cluster instead of only a city-center graph.",
    ],
    relatedPages: [
      { href: "/miami", label: "Miami hub" },
      { href: "/sports/team/florida-panthers", label: "Florida Panthers" },
    ],
    seatGeekPerformerSlugs: ["florida-panthers"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "chase-stadium",
    name: "Chase Stadium",
    citySlug: "miami",
    cityName: "Miami",
    addressNote: "Fort Lauderdale soccer venue serving the Miami market",
    primaryTeams: ["inter-miami-cf"],
    sportsLeagues: ["mls"],
    description:
      "Chase Stadium is the current soccer venue node for the Miami market, tied directly to one of the country’s highest-interest club ticket lanes.",
    whyItMatters: [
      "Inter Miami creates national search demand that justifies a dedicated venue node.",
      "This venue links the sports graph to a faster-moving soccer ticket market and city-break travel behavior.",
      "It is a strong expansion node for future MLS and South Florida venue coverage.",
    ],
    relatedPages: [
      { href: "/miami", label: "Miami hub" },
      { href: "/sports/team/inter-miami-cf", label: "Inter Miami CF" },
    ],
    seatGeekPerformerSlugs: ["inter-miami-cf"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "kia-center",
    name: "Kia Center",
    citySlug: "orlando",
    cityName: "Orlando",
    addressNote: "Downtown Orlando arena district",
    primaryTeams: ["orlando-magic"],
    sportsLeagues: ["nba"],
    description:
      "Kia Center gives Orlando a real downtown arena node, separate from its theme-park and outdoor-activity surfaces.",
    whyItMatters: [
      "Magic nights create a true evening-ticket lane inside the Orlando graph.",
      "The venue helps Orlando behave like a city node, not only a park-and-excursion destination.",
      "This is one of the cleanest future venue authority pages in the Phase 1 rollout.",
    ],
    relatedPages: [
      { href: "/orlando", label: "Orlando hub" },
      { href: "/sports/team/orlando-magic", label: "Orlando Magic" },
    ],
    seatGeekPerformerSlugs: ["orlando-magic"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "interco-stadium",
    name: "Inter&Co Stadium",
    citySlug: "orlando",
    cityName: "Orlando",
    addressNote: "Downtown Orlando soccer venue",
    primaryTeams: ["orlando-city-sc"],
    sportsLeagues: ["mls"],
    description:
      "Inter&Co Stadium is Orlando’s soccer venue node, giving the city a compact match-night surface beyond theme-park planning.",
    whyItMatters: [
      "Orlando City adds a sports option that fits short city-break routing better than all-day attraction plans.",
      "The venue expands the Orlando graph into MLS and supporter-driven live event demand.",
      "It strengthens downtown Orlando within a system that can otherwise skew too hard toward resort geography.",
    ],
    relatedPages: [
      { href: "/orlando", label: "Orlando hub" },
      { href: "/sports/team/orlando-city-sc", label: "Orlando City SC" },
    ],
    seatGeekPerformerSlugs: ["orlando-city-sc"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "smoothie-king-center",
    name: "Smoothie King Center",
    citySlug: "new-orleans",
    cityName: "New Orleans",
    addressNote: "Downtown New Orleans arena district near the Superdome",
    primaryTeams: ["new-orleans-pelicans"],
    sportsLeagues: ["nba"],
    description:
      "Smoothie King Center gives New Orleans a clean arena-night venue node that sits between the sports graph and the city’s broader live-event core.",
    whyItMatters: [
      "Pelicans games fit city-break and convention travel patterns better than full football weekends.",
      "The venue is already relevant to the New Orleans event and festivals layer, so it strengthens the local node mesh.",
      "This page creates a practical bridge from team demand to future event and venue guidance.",
    ],
    relatedPages: [
      { href: "/new-orleans", label: "New Orleans hub" },
      { href: "/sports/team/new-orleans-pelicans", label: "New Orleans Pelicans" },
    ],
    seatGeekPerformerSlugs: ["new-orleans-pelicans"],
    updatedAt: "2026-03-12",
  },
];

export function getSportsVenue(slug: string) {
  return SPORTS_VENUES_CONFIG.find((venue) => venue.slug === slug) || null;
}

export function getSportsVenueSlugs() {
  return SPORTS_VENUES_CONFIG.map((venue) => venue.slug);
}

export function getSportsVenuesByCity(citySlug: string) {
  return SPORTS_VENUES_CONFIG.filter((venue) => venue.citySlug === citySlug);
}
