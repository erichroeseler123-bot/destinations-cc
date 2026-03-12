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
];

export function getSportsLeague(slug: string) {
  return SPORTS_LEAGUES_CONFIG.find((league) => league.slug === slug) || null;
}
