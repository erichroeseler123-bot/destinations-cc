export type SportsLeagueConfig = {
  slug: string;
  name: string;
  description: string;
  focus: string;
  updatedAt: string;
};

export const SPORTS_LEAGUES_CONFIG: SportsLeagueConfig[] = [
  {
    slug: "nfl",
    name: "NFL",
    description: "Pro football teams, stadium-driven event demand, and game-ticket buyer intent.",
    focus: "Best for stadium games, weekend travel, and premium sports-event demand.",
    updatedAt: "2026-03-12",
  },
  {
    slug: "nhl",
    name: "NHL",
    description: "Pro hockey teams, arena nights, and high-intent ticket traffic.",
    focus: "Best for arena games, city-night planning, and lower-friction live sports routing.",
    updatedAt: "2026-03-12",
  },
  {
    slug: "wnba",
    name: "WNBA",
    description: "Women’s pro basketball teams, arena schedules, and event-ticket discovery.",
    focus: "Best for city-break sports buyers and arena-centered live-event demand.",
    updatedAt: "2026-03-12",
  },
  {
    slug: "nba",
    name: "NBA",
    description: "Pro basketball teams, arena-night demand, and city-break ticket buyers.",
    focus: "Best for premium arena games, downtown entertainment overlap, and mid-stay event planning.",
    updatedAt: "2026-03-12",
  },
  {
    slug: "mlb",
    name: "MLB",
    description: "Baseball teams, ballpark routing, and long-season ticket demand.",
    focus: "Best for seasonal city trips, outdoor stadium nights, and lower-friction live sports discovery.",
    updatedAt: "2026-03-12",
  },
  {
    slug: "mls",
    name: "MLS",
    description: "Soccer clubs, stadium nights, and travel-friendly match demand.",
    focus: "Best for weekend city breaks, supporter culture, and sports buyers who pair matches with broader nightlife plans.",
    updatedAt: "2026-03-12",
  },
];

export function getSportsLeague(slug: string) {
  return SPORTS_LEAGUES_CONFIG.find((league) => league.slug === slug) || null;
}

export function getSportsLeagueSlugs() {
  return SPORTS_LEAGUES_CONFIG.map((league) => league.slug);
}
