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
  {
    slug: "miami-dolphins",
    name: "Miami Dolphins",
    leagueSlug: "nfl",
    citySlug: "miami",
    cityName: "Miami",
    venueName: "Hard Rock Stadium",
    venueSlug: "hard-rock-stadium",
    seatGeekPerformerSlug: "miami-dolphins",
    description:
      "Miami NFL intent mixes game-day ticket demand with South Florida weekend travel, nightlife, and nearby-event routing.",
    whyItMatters: [
      "Dolphins games create one of the clearest sports-weekend demand spikes in the Miami market.",
      "Hard Rock Stadium anchors more than sports alone, so team pages help the wider venue and event graph.",
      "NFL buyers in Miami often pair one fixed game window with nightlife or water-activity planning instead of all-day attraction routing.",
    ],
    relatedCityPages: [
      { href: "/miami", label: "Miami hub" },
      { href: "/sports/nfl", label: "NFL league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "miami-heat",
    name: "Miami Heat",
    leagueSlug: "nba",
    citySlug: "miami",
    cityName: "Miami",
    venueName: "Kaseya Center",
    venueSlug: "kaseya-center",
    seatGeekPerformerSlug: "miami-heat",
    description:
      "Heat ticket intent is built around downtown arena nights, shorter city-break travel, and premium basketball demand.",
    whyItMatters: [
      "NBA nights fit Miami itineraries more easily than full football weekends and create a strong evening-ticket lane.",
      "Kaseya Center is a real venue authority candidate for both sports and event traffic.",
      "Heat pages help connect sports routing to Miami nightlife and waterfront planning.",
    ],
    relatedCityPages: [
      { href: "/miami", label: "Miami hub" },
      { href: "/sports/nba", label: "NBA league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "miami-marlins",
    name: "Miami Marlins",
    leagueSlug: "mlb",
    citySlug: "miami",
    cityName: "Miami",
    venueName: "loanDepot park",
    venueSlug: "loandepot-park",
    seatGeekPerformerSlug: "miami-marlins",
    description:
      "Marlins ticket intent supports seasonal baseball routing, neighborhood stadium planning, and lower-friction sports discovery in Miami.",
    whyItMatters: [
      "MLB gives the sports graph a long-season local inventory layer instead of only premium-event spikes.",
      "Ballpark nights convert differently than arena or stadium weekends and deserve their own ticket path.",
      "Miami baseball routing is useful for family, casual, and price-sensitive sports buyers.",
    ],
    relatedCityPages: [
      { href: "/miami", label: "Miami hub" },
      { href: "/sports/mlb", label: "MLB league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "florida-panthers",
    name: "Florida Panthers",
    leagueSlug: "nhl",
    citySlug: "miami",
    cityName: "Miami",
    venueName: "Amerant Bank Arena",
    venueSlug: "amerant-bank-arena",
    seatGeekPerformerSlug: "florida-panthers",
    description:
      "Panthers ticket pages serve South Florida arena demand that sits between Miami and Fort Lauderdale routing.",
    whyItMatters: [
      "The Panthers create a live sports lane for South Florida that overlaps the Miami visitor market.",
      "Hockey broadens the sports graph beyond the biggest football and basketball patterns.",
      "Arena nights fit shorter city stays and travel buyers who want one bookable evening anchor.",
    ],
    relatedCityPages: [
      { href: "/miami", label: "Miami hub" },
      { href: "/sports/nhl", label: "NHL league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "inter-miami-cf",
    name: "Inter Miami CF",
    leagueSlug: "mls",
    citySlug: "miami",
    cityName: "Miami",
    venueName: "Chase Stadium",
    venueSlug: "chase-stadium",
    seatGeekPerformerSlug: "inter-miami-cf",
    description:
      "Inter Miami pages capture one of the strongest soccer-ticket lanes in the country, tied to high-profile match demand and travel intent.",
    whyItMatters: [
      "Inter Miami is a top-tier sports discovery node with real national search demand.",
      "MLS adds a strong travel-friendly weekend sports product that fits South Florida itineraries.",
      "Soccer pages also help bridge future city, venue, and event-node growth in Miami.",
    ],
    relatedCityPages: [
      { href: "/miami", label: "Miami hub" },
      { href: "/sports/mls", label: "MLS league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "orlando-magic",
    name: "Orlando Magic",
    leagueSlug: "nba",
    citySlug: "orlando",
    cityName: "Orlando",
    venueName: "Kia Center",
    venueSlug: "kia-center",
    seatGeekPerformerSlug: "orlando-magic",
    description:
      "Magic ticket intent gives Orlando a real downtown arena lane beyond the theme-park and family-attractions surface.",
    whyItMatters: [
      "Magic nights create a separate Orlando event pattern from theme parks and airboat tours.",
      "NBA inventory adds a strong evening-ticket lane for longer Orlando stays.",
      "Kia Center is an obvious venue-node candidate in the Orlando graph.",
    ],
    relatedCityPages: [
      { href: "/orlando", label: "Orlando hub" },
      { href: "/sports/nba", label: "NBA league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "orlando-city-sc",
    name: "Orlando City SC",
    leagueSlug: "mls",
    citySlug: "orlando",
    cityName: "Orlando",
    venueName: "Inter&Co Stadium",
    venueSlug: "interco-stadium",
    seatGeekPerformerSlug: "orlando-city-sc",
    description:
      "Orlando City pages serve soccer-first city-break buyers who want a live match layered onto a broader Orlando trip.",
    whyItMatters: [
      "MLS gives Orlando a sports lane that is distinct from both theme parks and indoor arena nights.",
      "Supporter-driven soccer demand is a useful expansion pattern for the broader sports graph.",
      "Stadium matches create a more compact live-event planning block than all-day attraction routes.",
    ],
    relatedCityPages: [
      { href: "/orlando", label: "Orlando hub" },
      { href: "/sports/mls", label: "MLS league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "new-orleans-saints",
    name: "New Orleans Saints",
    leagueSlug: "nfl",
    citySlug: "new-orleans",
    cityName: "New Orleans",
    venueName: "Caesars Superdome",
    venueSlug: "caesars-superdome",
    seatGeekPerformerSlug: "new-orleans-saints",
    description:
      "Saints ticket intent blends football weekends with French Quarter demand, festival pressure, and strong citywide hotel effects.",
    whyItMatters: [
      "Saints weekends are one of the clearest sports-driven demand spikes in New Orleans.",
      "The Superdome is a major venue node with both sports and event relevance.",
      "NFL routing in New Orleans overlaps directly with music, food, and hotel-planning behavior.",
    ],
    relatedCityPages: [
      { href: "/new-orleans", label: "New Orleans hub" },
      { href: "/new-orleans/shows", label: "New Orleans shows" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "new-orleans-pelicans",
    name: "New Orleans Pelicans",
    leagueSlug: "nba",
    citySlug: "new-orleans",
    cityName: "New Orleans",
    venueName: "Smoothie King Center",
    venueSlug: "smoothie-king-center",
    seatGeekPerformerSlug: "new-orleans-pelicans",
    description:
      "Pelicans ticket pages serve arena-night buyers who want a lighter live-sports block within a broader New Orleans stay.",
    whyItMatters: [
      "Pelicans games are a clean fit for New Orleans city-break and convention travel.",
      "The arena strengthens the venue graph around downtown and event-heavy New Orleans routing.",
      "NBA pages complement shows and festival pages without overlapping the same commercial lane.",
    ],
    relatedCityPages: [
      { href: "/new-orleans", label: "New Orleans hub" },
      { href: "/sports/nba", label: "NBA league hub" },
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
