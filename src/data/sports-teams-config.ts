export type SportsTeamConfig = {
  slug: string;
  name: string;
  leagueSlug: string;
  citySlug: string;
  cityName: string;
  venueName: string;
  venueSlug: string;
  seatGeekPerformerSlug: string;
  description: string;
  whyItMatters: string[];
  relatedCityPages: Array<{ href: string; label: string }>;
  updatedAt: string;
};

export const SPORTS_TEAMS_CONFIG: SportsTeamConfig[] = [
  {
    slug: "las-vegas-raiders",
    name: "Las Vegas Raiders",
    leagueSlug: "nfl",
    citySlug: "las-vegas",
    cityName: "Las Vegas",
    venueName: "Allegiant Stadium",
    venueSlug: "allegiant-stadium",
    seatGeekPerformerSlug: "las-vegas-raiders",
    description:
      "Vegas NFL ticket intent revolves around Raiders home games, stadium-weekend planning, and premium event nights that change Strip pricing and routing.",
    whyItMatters: [
      "Raiders weekends create real event pressure across the Strip and airport transfer windows.",
      "NFL buyers are a distinct ticket lane from concert or comedy buyers and usually need direct sports-ticket handoff.",
      "Allegiant Stadium events overlap with nightlife, hotel, and premium weekend travel intent.",
    ],
    relatedCityPages: [
      { href: "/vegas", label: "Las Vegas hub" },
      { href: "/las-vegas/shows", label: "Las Vegas shows" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "vegas-golden-knights",
    name: "Vegas Golden Knights",
    leagueSlug: "nhl",
    citySlug: "las-vegas",
    cityName: "Las Vegas",
    venueName: "T-Mobile Arena",
    venueSlug: "t-mobile-arena",
    seatGeekPerformerSlug: "vegas-golden-knights",
    description:
      "Golden Knights pages should serve arena-night buyers who want a sports-first Vegas plan rather than a generic concert or show route.",
    whyItMatters: [
      "Hockey nights are one of the clearest recurring sports-event lanes in Las Vegas.",
      "Arena game buyers often combine one dinner block and one shorter nightlife block instead of a full casino-show plan.",
      "T-Mobile Arena is already a major Vegas venue node candidate, so this page strengthens the city-to-venue graph.",
    ],
    relatedCityPages: [
      { href: "/vegas", label: "Las Vegas hub" },
      { href: "/las-vegas/helicopter-tours", label: "Las Vegas helicopter tours" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "las-vegas-aces",
    name: "Las Vegas Aces",
    leagueSlug: "wnba",
    citySlug: "las-vegas",
    cityName: "Las Vegas",
    venueName: "Michelob ULTRA Arena",
    venueSlug: "michelob-ultra-arena",
    seatGeekPerformerSlug: "las-vegas-aces",
    description:
      "Aces ticket intent fits city-break sports buyers and event nights that pair more cleanly with a broader Vegas itinerary than full football weekends.",
    whyItMatters: [
      "Aces games create an easier live-sports product for shorter Vegas stays.",
      "WNBA pages broaden the sports graph beyond the biggest men’s leagues and create additional venue/seasonality coverage.",
      "Michelob ULTRA Arena is useful as a future venue authority node in the Vegas entertainment graph.",
    ],
    relatedCityPages: [
      { href: "/vegas", label: "Las Vegas hub" },
      { href: "/las-vegas/best-day-trips", label: "Best day trips from Las Vegas" },
    ],
    updatedAt: "2026-03-12",
  },
];

export function getSportsTeam(slug: string) {
  return SPORTS_TEAMS_CONFIG.find((team) => team.slug === slug) || null;
}

export function getTeamsByLeague(leagueSlug: string) {
  return SPORTS_TEAMS_CONFIG.filter((team) => team.leagueSlug === leagueSlug);
}
