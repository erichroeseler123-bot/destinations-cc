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
  {
    slug: "chicago-bears",
    name: "Chicago Bears",
    leagueSlug: "nfl",
    citySlug: "chicago",
    cityName: "Chicago",
    venueName: "Soldier Field",
    venueSlug: "soldier-field",
    seatGeekPerformerSlug: "chicago-bears",
    description:
      "Chicago Bears ticket intent is driven by lakefront stadium weekends, legacy-team demand, and city-break sports travel that overlaps strongly with downtown hotel planning.",
    whyItMatters: [
      "Bears weekends create one of the clearest stadium-demand spikes in Chicago.",
      "Soldier Field links sports discovery to museums, downtown lodging, and lakefront routing.",
      "Chicago football gives the sports graph a major legacy-franchise node with strong search demand.",
    ],
    relatedCityPages: [
      { href: "/chicago", label: "Chicago hub" },
      { href: "/sports/nfl", label: "NFL league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "chicago-bulls",
    name: "Chicago Bulls",
    leagueSlug: "nba",
    citySlug: "chicago",
    cityName: "Chicago",
    venueName: "United Center",
    venueSlug: "united-center",
    seatGeekPerformerSlug: "chicago-bulls",
    description:
      "Chicago Bulls pages serve downtown and West Side arena-night demand, city-break basketball buyers, and one of the strongest NBA legacy brands in the market.",
    whyItMatters: [
      "Bulls games create a clean arena-night ticket lane inside the broader Chicago visitor graph.",
      "United Center is a top-tier venue node that supports both sports and future event coverage.",
      "NBA buyers in Chicago often combine one game with architecture, food, or theater plans rather than an all-day sports itinerary.",
    ],
    relatedCityPages: [
      { href: "/chicago", label: "Chicago hub" },
      { href: "/sports/nba", label: "NBA league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "chicago-blackhawks",
    name: "Chicago Blackhawks",
    leagueSlug: "nhl",
    citySlug: "chicago",
    cityName: "Chicago",
    venueName: "United Center",
    venueSlug: "united-center",
    seatGeekPerformerSlug: "chicago-blackhawks",
    description:
      "Blackhawks ticket pages give Chicago a legacy hockey node built around winter arena nights, sports-weekend planning, and strong city search demand.",
    whyItMatters: [
      "Hockey broadens Chicago’s sports layer beyond football and basketball while reusing the same venue authority node.",
      "Blackhawks demand reinforces United Center as one of the strongest multi-team venue pages in the graph.",
      "Arena-night buyers in Chicago often overlap with restaurant and theater planning rather than broader attraction routing.",
    ],
    relatedCityPages: [
      { href: "/chicago", label: "Chicago hub" },
      { href: "/sports/nhl", label: "NHL league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "chicago-cubs",
    name: "Chicago Cubs",
    leagueSlug: "mlb",
    citySlug: "chicago",
    cityName: "Chicago",
    venueName: "Wrigley Field",
    venueSlug: "wrigley-field",
    seatGeekPerformerSlug: "chicago-cubs",
    description:
      "Chicago Cubs pages serve one of the strongest ballpark tourism lanes in the country, where baseball demand overlaps directly with neighborhood and summer travel planning.",
    whyItMatters: [
      "Wrigley Field is both a team node and a major venue/area authority asset.",
      "Cubs games create a long-season ticket lane with strong tourism overlap, not just local sports demand.",
      "Ballpark routing in Chicago works differently than arena or stadium weekends and deserves its own sports path.",
    ],
    relatedCityPages: [
      { href: "/chicago", label: "Chicago hub" },
      { href: "/sports/mlb", label: "MLB league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "chicago-fire-fc",
    name: "Chicago Fire FC",
    leagueSlug: "mls",
    citySlug: "chicago",
    cityName: "Chicago",
    venueName: "Soldier Field",
    venueSlug: "soldier-field",
    seatGeekPerformerSlug: "chicago-fire-fc",
    description:
      "Chicago Fire pages create a soccer-first city-break lane tied to lakefront match nights and a more flexible sports itinerary than NFL weekends.",
    whyItMatters: [
      "MLS gives Chicago a weekend sports product that fits shorter stays and summer city routing.",
      "Soldier Field becomes a stronger venue node when it anchors more than one league path.",
      "Soccer expands the sports graph into a newer but still travel-friendly ticket market.",
    ],
    relatedCityPages: [
      { href: "/chicago", label: "Chicago hub" },
      { href: "/sports/mls", label: "MLS league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "new-york-giants",
    name: "New York Giants",
    leagueSlug: "nfl",
    citySlug: "new-york",
    cityName: "New York",
    venueName: "MetLife Stadium",
    venueSlug: "metlife-stadium",
    seatGeekPerformerSlug: "new-york-giants",
    description:
      "Giants ticket pages serve one of the strongest stadium-travel lanes in the country, anchored by New York market demand and regional weekend sports traffic.",
    whyItMatters: [
      "Giants demand adds a top-tier NFL node to the DCC sports graph.",
      "MetLife Stadium is a major venue authority page because it anchors multiple teams and high-volume event traffic.",
      "New York football buyers behave differently from theater and show buyers and need a direct sports-ticket route.",
    ],
    relatedCityPages: [
      { href: "/new-york", label: "New York hub" },
      { href: "/sports/nfl", label: "NFL league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "new-york-jets",
    name: "New York Jets",
    leagueSlug: "nfl",
    citySlug: "new-york",
    cityName: "New York",
    venueName: "MetLife Stadium",
    venueSlug: "metlife-stadium",
    seatGeekPerformerSlug: "new-york-jets",
    description:
      "Jets ticket pages strengthen the New York stadium lane with another high-demand NFL path tied to regional game-day travel and major-market sports discovery.",
    whyItMatters: [
      "Jets and Giants together make MetLife one of the strongest shared venue nodes in the sports graph.",
      "New York NFL demand is big enough to justify separate team nodes rather than a single generic stadium page.",
      "Jets pages help build a denser New York city-to-team-to-venue mesh quickly.",
    ],
    relatedCityPages: [
      { href: "/new-york", label: "New York hub" },
      { href: "/sports/nfl", label: "NFL league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "new-york-knicks",
    name: "New York Knicks",
    leagueSlug: "nba",
    citySlug: "new-york",
    cityName: "New York",
    venueName: "Madison Square Garden",
    venueSlug: "madison-square-garden",
    seatGeekPerformerSlug: "new-york-knicks",
    description:
      "Knicks pages anchor one of the strongest arena-night ticket lanes in the country, centered on Manhattan demand and all-season sports discovery.",
    whyItMatters: [
      "Madison Square Garden is a top-tier venue node that also matters beyond basketball.",
      "Knicks games create premium urban sports intent that fits shorter New York stays and night planning.",
      "This team adds high-authority NBA demand to the New York node quickly.",
    ],
    relatedCityPages: [
      { href: "/new-york", label: "New York hub" },
      { href: "/sports/nba", label: "NBA league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "new-york-rangers",
    name: "New York Rangers",
    leagueSlug: "nhl",
    citySlug: "new-york",
    cityName: "New York",
    venueName: "Madison Square Garden",
    venueSlug: "madison-square-garden",
    seatGeekPerformerSlug: "new-york-rangers",
    description:
      "Rangers pages give the New York sports graph a premium hockey lane tied to Manhattan arena demand and major-market winter travel behavior.",
    whyItMatters: [
      "Rangers demand strengthens Madison Square Garden as a shared multi-team venue node.",
      "Hockey expands the New York sports layer without overlapping the shows lane.",
      "Arena sports in Manhattan are a highly reusable authority pattern for future cities.",
    ],
    relatedCityPages: [
      { href: "/new-york", label: "New York hub" },
      { href: "/sports/nhl", label: "NHL league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "new-york-yankees",
    name: "New York Yankees",
    leagueSlug: "mlb",
    citySlug: "new-york",
    cityName: "New York",
    venueName: "Yankee Stadium",
    venueSlug: "yankee-stadium",
    seatGeekPerformerSlug: "new-york-yankees",
    description:
      "Yankees pages capture one of the biggest baseball tourism and ticket-intent lanes in the country, blending iconic-venue demand with long-season sports discovery.",
    whyItMatters: [
      "Yankee Stadium is both a major ballpark node and a landmark-style venue authority asset.",
      "The Yankees create long-season sports inventory with unusually strong tourism overlap.",
      "This is one of the clearest MLB nodes for proving venue-plus-team authority outside Miami.",
    ],
    relatedCityPages: [
      { href: "/new-york", label: "New York hub" },
      { href: "/sports/mlb", label: "MLB league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "new-york-liberty",
    name: "New York Liberty",
    leagueSlug: "wnba",
    citySlug: "new-york",
    cityName: "New York",
    venueName: "Barclays Center",
    venueSlug: "barclays-center",
    seatGeekPerformerSlug: "new-york-liberty",
    description:
      "Liberty pages add a premium women’s basketball node to the New York graph, centered on Brooklyn arena demand and city-break ticket intent.",
    whyItMatters: [
      "The Liberty extend the sports graph beyond the biggest men’s leagues while staying in a high-demand market.",
      "Barclays Center becomes a valuable arena authority node when paired with both WNBA and future event coverage.",
      "WNBA pages convert well for shorter stays and evening-first trip planning.",
    ],
    relatedCityPages: [
      { href: "/new-york", label: "New York hub" },
      { href: "/sports/wnba", label: "WNBA league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "new-york-city-fc",
    name: "New York City FC",
    leagueSlug: "mls",
    citySlug: "new-york",
    cityName: "New York",
    venueName: "Yankee Stadium",
    venueSlug: "yankee-stadium",
    seatGeekPerformerSlug: "new-york-city-fc",
    description:
      "NYCFC pages give New York a travel-friendly MLS lane built around stadium match nights and broader weekend city itineraries.",
    whyItMatters: [
      "MLS adds a soccer-first sports route in one of the biggest city markets in the system.",
      "NYCFC strengthens Yankee Stadium as a multi-use venue node inside the sports graph.",
      "Soccer creates a lower-friction sports product for New York visitors than NFL weekends.",
    ],
    relatedCityPages: [
      { href: "/new-york", label: "New York hub" },
      { href: "/sports/mls", label: "MLS league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "los-angeles-rams",
    name: "Los Angeles Rams",
    leagueSlug: "nfl",
    citySlug: "los-angeles",
    cityName: "Los Angeles",
    venueName: "SoFi Stadium",
    venueSlug: "sofi-stadium",
    seatGeekPerformerSlug: "los-angeles-rams",
    description:
      "Rams pages serve one of the biggest stadium-event markets in the country, tied to premium NFL demand and broader Los Angeles trip planning.",
    whyItMatters: [
      "SoFi Stadium is a flagship venue node for both sports and future event authority.",
      "Rams demand gives Los Angeles a major-market NFL layer that behaves differently from tours and shows.",
      "NFL weekends in LA influence hotels, traffic, and neighborhood routing more than many other sports products.",
    ],
    relatedCityPages: [
      { href: "/los-angeles", label: "Los Angeles hub" },
      { href: "/sports/nfl", label: "NFL league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "los-angeles-lakers",
    name: "Los Angeles Lakers",
    leagueSlug: "nba",
    citySlug: "los-angeles",
    cityName: "Los Angeles",
    venueName: "Crypto.com Arena",
    venueSlug: "crypto-dot-com-arena",
    seatGeekPerformerSlug: "los-angeles-lakers",
    description:
      "Lakers pages anchor one of the strongest arena-ticket lanes in the country, tied to downtown LA nights and premium basketball demand.",
    whyItMatters: [
      "Lakers demand is a top-tier NBA search node and a strong commercial ticket lane.",
      "Crypto.com Arena is a flagship venue page that also supports future show and concert graph growth.",
      "Arena nights in Los Angeles create a distinct live-event behavior from studio tours or beach routing.",
    ],
    relatedCityPages: [
      { href: "/los-angeles", label: "Los Angeles hub" },
      { href: "/sports/nba", label: "NBA league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "los-angeles-kings",
    name: "Los Angeles Kings",
    leagueSlug: "nhl",
    citySlug: "los-angeles",
    cityName: "Los Angeles",
    venueName: "Crypto.com Arena",
    venueSlug: "crypto-dot-com-arena",
    seatGeekPerformerSlug: "los-angeles-kings",
    description:
      "Kings pages give Los Angeles a premium hockey lane centered on downtown arena nights and a strong city sports identity.",
    whyItMatters: [
      "Kings pages make Crypto.com Arena a stronger shared venue node instead of a single-team surface.",
      "NHL demand broadens Los Angeles sports coverage beyond the biggest football and basketball paths.",
      "Hockey nights fit shorter city itineraries and evening planning well.",
    ],
    relatedCityPages: [
      { href: "/los-angeles", label: "Los Angeles hub" },
      { href: "/sports/nhl", label: "NHL league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "los-angeles-dodgers",
    name: "Los Angeles Dodgers",
    leagueSlug: "mlb",
    citySlug: "los-angeles",
    cityName: "Los Angeles",
    venueName: "Dodger Stadium",
    venueSlug: "dodger-stadium",
    seatGeekPerformerSlug: "los-angeles-dodgers",
    description:
      "Dodgers pages serve one of the strongest baseball tourism and stadium-intent lanes in the country, centered on a landmark-style venue and long-season ticket demand.",
    whyItMatters: [
      "Dodger Stadium is a major venue authority page in its own right.",
      "The Dodgers create a high-volume, long-season ticket lane that pairs well with city-break planning.",
      "This gives Los Angeles a strong MLB node without relying on wider regional teams outside the city core.",
    ],
    relatedCityPages: [
      { href: "/los-angeles", label: "Los Angeles hub" },
      { href: "/sports/mlb", label: "MLB league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "lafc",
    name: "LAFC",
    leagueSlug: "mls",
    citySlug: "los-angeles",
    cityName: "Los Angeles",
    venueName: "BMO Stadium",
    venueSlug: "bmo-stadium",
    seatGeekPerformerSlug: "los-angeles-football-club",
    description:
      "LAFC pages give Los Angeles a high-energy soccer lane built around downtown match nights and strong supporter culture demand.",
    whyItMatters: [
      "MLS adds a travel-friendly sports route in one of the biggest city markets in the system.",
      "BMO Stadium becomes a useful venue node that differs from the larger arena and stadium patterns.",
      "LAFC broadens the Los Angeles sports graph into a different style of live event buyer.",
    ],
    relatedCityPages: [
      { href: "/los-angeles", label: "Los Angeles hub" },
      { href: "/sports/mls", label: "MLS league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "nashville-titans",
    name: "Tennessee Titans",
    leagueSlug: "nfl",
    citySlug: "nashville",
    cityName: "Nashville",
    venueName: "Nissan Stadium",
    venueSlug: "nissan-stadium",
    seatGeekPerformerSlug: "tennessee-titans",
    description:
      "Titans pages give Nashville a true stadium-weekend sports lane layered onto Broadway, hotel, and music-city travel behavior.",
    whyItMatters: [
      "Titans weekends create a different city-demand pattern than music-first tourism alone.",
      "Nissan Stadium is a core venue node that can later support both sports and event routing.",
      "NFL adds a strong ticket path to a city already seeded deeply on the shows side.",
    ],
    relatedCityPages: [
      { href: "/nashville", label: "Nashville hub" },
      { href: "/sports/nfl", label: "NFL league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "nashville-predators",
    name: "Nashville Predators",
    leagueSlug: "nhl",
    citySlug: "nashville",
    cityName: "Nashville",
    venueName: "Bridgestone Arena",
    venueSlug: "bridgestone-arena",
    seatGeekPerformerSlug: "nashville-predators",
    description:
      "Predators pages capture one of Nashville’s clearest recurring arena-night lanes, tying sports demand directly into Broadway and downtown routing.",
    whyItMatters: [
      "Predators games fit Nashville’s nightlife and short-stay city-break behavior extremely well.",
      "Bridgestone Arena is a prime venue node because it overlaps sports, concerts, and downtown event traffic.",
      "Hockey gives Nashville a second major sports pattern beside football.",
    ],
    relatedCityPages: [
      { href: "/nashville", label: "Nashville hub" },
      { href: "/sports/nhl", label: "NHL league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "nashville-sc",
    name: "Nashville SC",
    leagueSlug: "mls",
    citySlug: "nashville",
    cityName: "Nashville",
    venueName: "GEODIS Park",
    venueSlug: "geodis-park",
    seatGeekPerformerSlug: "nashville-sc",
    description:
      "Nashville SC pages add a soccer-first ticket lane that fits weekend city travel, supporter culture, and a more flexible sports itinerary than NFL weekends.",
    whyItMatters: [
      "MLS expands Nashville’s sports graph into a newer, travel-friendly match product.",
      "GEODIS Park is a useful standalone venue node with clear sports authority value.",
      "Soccer buyers often overlap with music and nightlife planning without replacing the shows lane.",
    ],
    relatedCityPages: [
      { href: "/nashville", label: "Nashville hub" },
      { href: "/sports/mls", label: "MLS league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "new-england-patriots",
    name: "New England Patriots",
    leagueSlug: "nfl",
    citySlug: "boston",
    cityName: "Boston",
    venueName: "Gillette Stadium",
    venueSlug: "gillette-stadium",
    seatGeekPerformerSlug: "new-england-patriots",
    description:
      "Patriots pages give Boston a stadium-weekend sports lane with regional travel demand, legacy-team search volume, and strong game-day routing behavior.",
    whyItMatters: [
      "Patriots demand gives Boston one of the clearest NFL authority nodes in the Northeast.",
      "Gillette Stadium matters as a market-level venue even though it sits outside the downtown core.",
      "Football weekends create a different buyer pattern from Boston arena nights or ballpark routing.",
    ],
    relatedCityPages: [
      { href: "/boston", label: "Boston hub" },
      { href: "/sports/nfl", label: "NFL league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "boston-celtics",
    name: "Boston Celtics",
    leagueSlug: "nba",
    citySlug: "boston",
    cityName: "Boston",
    venueName: "TD Garden",
    venueSlug: "td-garden",
    seatGeekPerformerSlug: "boston-celtics",
    description:
      "Celtics pages anchor one of the strongest urban arena-ticket lanes in the country, centered on downtown Boston nights and legacy-franchise demand.",
    whyItMatters: [
      "Celtics demand gives Boston a premium NBA node with strong search and ticket value.",
      "TD Garden becomes a high-leverage shared venue page when paired with both basketball and hockey.",
      "Arena nights in Boston fit shorter city itineraries more cleanly than football weekends.",
    ],
    relatedCityPages: [
      { href: "/boston", label: "Boston hub" },
      { href: "/sports/nba", label: "NBA league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "boston-bruins",
    name: "Boston Bruins",
    leagueSlug: "nhl",
    citySlug: "boston",
    cityName: "Boston",
    venueName: "TD Garden",
    venueSlug: "td-garden",
    seatGeekPerformerSlug: "boston-bruins",
    description:
      "Bruins pages give Boston a premium hockey lane built around downtown arena nights and one of the strongest original-market NHL brands.",
    whyItMatters: [
      "Bruins demand makes TD Garden a denser arena authority page instead of a single-team surface.",
      "Hockey broadens Boston’s sports graph beyond football and basketball while staying high-value.",
      "Arena-night demand overlaps well with restaurant, hotel, and theater-first city travel.",
    ],
    relatedCityPages: [
      { href: "/boston", label: "Boston hub" },
      { href: "/sports/nhl", label: "NHL league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "boston-red-sox",
    name: "Boston Red Sox",
    leagueSlug: "mlb",
    citySlug: "boston",
    cityName: "Boston",
    venueName: "Fenway Park",
    venueSlug: "fenway-park",
    seatGeekPerformerSlug: "boston-red-sox",
    description:
      "Red Sox pages serve one of the strongest baseball tourism and landmark-ballpark lanes in the country, tied directly to Boston neighborhood and summer travel planning.",
    whyItMatters: [
      "Fenway Park is both a team venue and a destination-level authority page.",
      "The Red Sox create long-season ticket demand with unusually strong tourism overlap.",
      "This is one of the clearest MLB nodes for proving ballpark authority in a major city market.",
    ],
    relatedCityPages: [
      { href: "/boston", label: "Boston hub" },
      { href: "/sports/mlb", label: "MLB league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "new-england-revolution",
    name: "New England Revolution",
    leagueSlug: "mls",
    citySlug: "boston",
    cityName: "Boston",
    venueName: "Gillette Stadium",
    venueSlug: "gillette-stadium",
    seatGeekPerformerSlug: "new-england-revolution",
    description:
      "Revolution pages add a soccer-first match lane to the Boston market, giving the sports graph a more flexible weekend product than NFL travel alone.",
    whyItMatters: [
      "MLS broadens the Boston sports graph beyond legacy football, basketball, and baseball demand.",
      "Gillette becomes a stronger multi-team venue node when it anchors both NFL and MLS pages.",
      "Soccer gives Boston a travel-friendly sports route that fits shorter stays.",
    ],
    relatedCityPages: [
      { href: "/boston", label: "Boston hub" },
      { href: "/sports/mls", label: "MLS league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "seattle-seahawks",
    name: "Seattle Seahawks",
    leagueSlug: "nfl",
    citySlug: "seattle",
    cityName: "Seattle",
    venueName: "Lumen Field",
    venueSlug: "lumen-field",
    seatGeekPerformerSlug: "seattle-seahawks",
    description:
      "Seahawks pages anchor Seattle’s stadium-weekend sports demand, tying NFL ticket intent to downtown and waterfront travel behavior.",
    whyItMatters: [
      "Seahawks weekends create one of the clearest stadium-demand spikes in the Seattle market.",
      "Lumen Field is a high-value venue node because it serves multiple teams and major events.",
      "Seattle football buyers often pair one game window with food, hotel, and waterfront city planning.",
    ],
    relatedCityPages: [
      { href: "/seattle", label: "Seattle hub" },
      { href: "/sports/nfl", label: "NFL league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "seattle-kraken",
    name: "Seattle Kraken",
    leagueSlug: "nhl",
    citySlug: "seattle",
    cityName: "Seattle",
    venueName: "Climate Pledge Arena",
    venueSlug: "climate-pledge-arena",
    seatGeekPerformerSlug: "seattle-kraken",
    description:
      "Kraken pages give Seattle a premium hockey lane built around arena nights, shorter city stays, and downtown event routing.",
    whyItMatters: [
      "Kraken demand adds a strong NHL node in a major tourism and events city.",
      "Climate Pledge Arena becomes a stronger shared venue page when it anchors multiple teams.",
      "Arena nights in Seattle fit shorter travel windows better than full NFL weekends.",
    ],
    relatedCityPages: [
      { href: "/seattle", label: "Seattle hub" },
      { href: "/sports/nhl", label: "NHL league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "seattle-mariners",
    name: "Seattle Mariners",
    leagueSlug: "mlb",
    citySlug: "seattle",
    cityName: "Seattle",
    venueName: "T-Mobile Park",
    venueSlug: "t-mobile-park",
    seatGeekPerformerSlug: "seattle-mariners",
    description:
      "Mariners pages give Seattle a long-season ballpark lane tied to summer city travel, family buyers, and lower-friction sports discovery.",
    whyItMatters: [
      "Baseball broadens Seattle’s sports graph into a slower but denser seasonal ticket lane.",
      "T-Mobile Park is a high-quality ballpark venue node with strong local and visitor intent.",
      "Mariners nights convert differently than arena or stadium weekends and deserve their own path.",
    ],
    relatedCityPages: [
      { href: "/seattle", label: "Seattle hub" },
      { href: "/sports/mlb", label: "MLB league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "seattle-sounders-fc",
    name: "Seattle Sounders FC",
    leagueSlug: "mls",
    citySlug: "seattle",
    cityName: "Seattle",
    venueName: "Lumen Field",
    venueSlug: "lumen-field",
    seatGeekPerformerSlug: "seattle-sounders-fc",
    description:
      "Sounders pages give Seattle a high-energy soccer lane tied to supporter culture and travel-friendly downtown match nights.",
    whyItMatters: [
      "Seattle Sounders demand adds a high-value MLS path in a proven soccer market.",
      "Lumen Field becomes a stronger shared venue node with both NFL and MLS coverage.",
      "MLS adds a lower-friction sports product for Seattle visitors than stadium weekends alone.",
    ],
    relatedCityPages: [
      { href: "/seattle", label: "Seattle hub" },
      { href: "/sports/mls", label: "MLS league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "seattle-storm",
    name: "Seattle Storm",
    leagueSlug: "wnba",
    citySlug: "seattle",
    cityName: "Seattle",
    venueName: "Climate Pledge Arena",
    venueSlug: "climate-pledge-arena",
    seatGeekPerformerSlug: "seattle-storm",
    description:
      "Storm pages add a strong women’s basketball node to Seattle, centered on arena nights and a highly reusable city-break sports product.",
    whyItMatters: [
      "WNBA broadens the Seattle sports graph without relying only on the biggest men’s leagues.",
      "Storm and Kraken together make Climate Pledge Arena a denser shared venue node.",
      "Seattle gets a strong evening-ticket lane that fits shorter downtown itineraries cleanly.",
    ],
    relatedCityPages: [
      { href: "/seattle", label: "Seattle hub" },
      { href: "/sports/wnba", label: "WNBA league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "san-francisco-49ers",
    name: "San Francisco 49ers",
    leagueSlug: "nfl",
    citySlug: "san-francisco",
    cityName: "San Francisco",
    venueName: "Levi's Stadium",
    venueSlug: "levis-stadium",
    seatGeekPerformerSlug: "san-francisco-49ers",
    description:
      "49ers pages give San Francisco a flagship NFL node tied to premium stadium demand and broader Bay Area trip planning.",
    whyItMatters: [
      "49ers demand is large enough to justify a dedicated city-market sports route even with regional venue geography.",
      "Levi's Stadium is a top-tier venue node with strong event and stadium authority value.",
      "NFL demand here behaves differently from San Francisco sightseeing and tour intent.",
    ],
    relatedCityPages: [
      { href: "/san-francisco", label: "San Francisco hub" },
      { href: "/sports/nfl", label: "NFL league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "golden-state-warriors",
    name: "Golden State Warriors",
    leagueSlug: "nba",
    citySlug: "san-francisco",
    cityName: "San Francisco",
    venueName: "Chase Center",
    venueSlug: "chase-center-sf",
    seatGeekPerformerSlug: "golden-state-warriors",
    description:
      "Warriors pages anchor one of the strongest arena-night ticket lanes on the West Coast, centered on San Francisco demand and premium basketball intent.",
    whyItMatters: [
      "Warriors demand gives San Francisco a top-tier NBA authority node.",
      "Chase Center is a high-value shared venue candidate even beyond basketball.",
      "Arena-night buyers in San Francisco behave differently than day-tour or attraction-first travelers.",
    ],
    relatedCityPages: [
      { href: "/san-francisco", label: "San Francisco hub" },
      { href: "/sports/nba", label: "NBA league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "san-francisco-giants",
    name: "San Francisco Giants",
    leagueSlug: "mlb",
    citySlug: "san-francisco",
    cityName: "San Francisco",
    venueName: "Oracle Park",
    venueSlug: "oracle-park",
    seatGeekPerformerSlug: "san-francisco-giants",
    description:
      "Giants pages create a high-intent ballpark lane tied to one of the strongest urban baseball settings in the country and a long-season travel pattern.",
    whyItMatters: [
      "Oracle Park is both a venue node and a strong waterfront/location query target.",
      "Giants games broaden San Francisco’s sports graph into seasonal baseball demand.",
      "Ballpark routing supports different buyers than arena nights or sightseeing itineraries.",
    ],
    relatedCityPages: [
      { href: "/san-francisco", label: "San Francisco hub" },
      { href: "/sports/mlb", label: "MLB league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "washington-commanders",
    name: "Washington Commanders",
    leagueSlug: "nfl",
    citySlug: "washington-dc",
    cityName: "Washington, D.C.",
    venueName: "Northwest Stadium",
    venueSlug: "northwest-stadium",
    seatGeekPerformerSlug: "washington-commanders",
    description:
      "Commanders pages give Washington a flagship NFL node tied to large regional game-day demand and one of the clearest sports-travel lanes in the DMV.",
    whyItMatters: [
      "Commanders demand creates a major stadium-weekend pattern for the Washington market.",
      "Northwest Stadium is a high-value venue page because stadium logistics matter as much as the ticket link.",
      "This gives D.C. a true football node separate from museums, monuments, and civic tourism.",
    ],
    relatedCityPages: [
      { href: "/washington-dc", label: "Washington, D.C. hub" },
      { href: "/sports/nfl", label: "NFL league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "washington-wizards",
    name: "Washington Wizards",
    leagueSlug: "nba",
    citySlug: "washington-dc",
    cityName: "Washington, D.C.",
    venueName: "Capital One Arena",
    venueSlug: "capital-one-arena",
    seatGeekPerformerSlug: "washington-wizards",
    description:
      "Wizards pages add a downtown arena-night sports lane to Washington, fitting shorter city stays and event-first trip planning.",
    whyItMatters: [
      "The Wizards give Washington a distinct NBA path separate from football weekends.",
      "Capital One Arena becomes a stronger shared venue node when paired with basketball and hockey.",
      "Arena-night buyers fit naturally into downtown D.C. routing and shorter itineraries.",
    ],
    relatedCityPages: [
      { href: "/washington-dc", label: "Washington, D.C. hub" },
      { href: "/sports/nba", label: "NBA league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "washington-capitals",
    name: "Washington Capitals",
    leagueSlug: "nhl",
    citySlug: "washington-dc",
    cityName: "Washington, D.C.",
    venueName: "Capital One Arena",
    venueSlug: "capital-one-arena",
    seatGeekPerformerSlug: "washington-capitals",
    description:
      "Capitals pages give Washington a premium hockey lane built around downtown arena demand and one of the strongest legacy NHL brands in the market.",
    whyItMatters: [
      "Capitals demand deepens the D.C. sports graph without overlapping the same commercial pattern as the NFL.",
      "Capital One Arena becomes a denser venue authority node when it anchors both NBA and NHL pages.",
      "Hockey nights are a clean fit for city-break and convention travel in Washington.",
    ],
    relatedCityPages: [
      { href: "/washington-dc", label: "Washington, D.C. hub" },
      { href: "/sports/nhl", label: "NHL league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "washington-nationals",
    name: "Washington Nationals",
    leagueSlug: "mlb",
    citySlug: "washington-dc",
    cityName: "Washington, D.C.",
    venueName: "Nationals Park",
    venueSlug: "nationals-park",
    seatGeekPerformerSlug: "washington-nationals",
    description:
      "Nationals pages give Washington a strong ballpark route tied to summer city travel, waterfront district planning, and long-season sports discovery.",
    whyItMatters: [
      "Nationals Park is a strong neighborhood-aware venue node for the D.C. graph.",
      "Baseball adds a lower-friction seasonal sports lane beyond football and arena nights.",
      "This page helps Washington behave like a rounded city sports market, not just a football node.",
    ],
    relatedCityPages: [
      { href: "/washington-dc", label: "Washington, D.C. hub" },
      { href: "/sports/mlb", label: "MLB league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "washington-mystics",
    name: "Washington Mystics",
    leagueSlug: "wnba",
    citySlug: "washington-dc",
    cityName: "Washington, D.C.",
    venueName: "CareFirst Arena",
    venueSlug: "carefirst-arena",
    seatGeekPerformerSlug: "washington-mystics",
    description:
      "Mystics pages add a women’s basketball lane to the Washington graph, centered on a smaller dedicated arena and a highly reusable city-break sports product.",
    whyItMatters: [
      "The Mystics broaden Washington’s sports layer beyond the biggest men’s leagues.",
      "CareFirst Arena gives D.C. a different venue scale and planning pattern than the larger downtown arenas and stadiums.",
      "WNBA pages fit shorter stays and evening-first city trips well.",
    ],
    relatedCityPages: [
      { href: "/washington-dc", label: "Washington, D.C. hub" },
      { href: "/sports/wnba", label: "WNBA league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "dc-united",
    name: "D.C. United",
    leagueSlug: "mls",
    citySlug: "washington-dc",
    cityName: "Washington, D.C.",
    venueName: "Audi Field",
    venueSlug: "audi-field",
    seatGeekPerformerSlug: "dc-united",
    description:
      "D.C. United pages give Washington a soccer-first match lane tied to Audi Field, supporter culture, and downtown waterfront routing.",
    whyItMatters: [
      "MLS adds a flexible city-break sports product that is distinct from football weekends in D.C.",
      "Audi Field is a strong venue node because it already carries multi-event authority in the city.",
      "This page rounds out Washington with a sixth league path inside the same sports graph.",
    ],
    relatedCityPages: [
      { href: "/washington-dc", label: "Washington, D.C. hub" },
      { href: "/sports/mls", label: "MLS league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "atlanta-falcons",
    name: "Atlanta Falcons",
    leagueSlug: "nfl",
    citySlug: "atlanta",
    cityName: "Atlanta",
    venueName: "Mercedes-Benz Stadium",
    venueSlug: "mercedes-benz-stadium-atl",
    seatGeekPerformerSlug: "atlanta-falcons",
    description:
      "Falcons pages anchor Atlanta’s biggest stadium-ticket lane, tying football weekends to downtown event pressure and broader city-break demand.",
    whyItMatters: [
      "Falcons weekends create one of the clearest sports-driven demand spikes in the Atlanta market.",
      "Mercedes-Benz Stadium is a true crossover venue node that matters for both sports and larger live-event planning.",
      "NFL buyers in Atlanta behave differently than concert or museum-first visitors and need a direct sports path.",
    ],
    relatedCityPages: [
      { href: "/atlanta", label: "Atlanta hub" },
      { href: "/sports/nfl", label: "NFL league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "atlanta-hawks",
    name: "Atlanta Hawks",
    leagueSlug: "nba",
    citySlug: "atlanta",
    cityName: "Atlanta",
    venueName: "State Farm Arena",
    venueSlug: "state-farm-arena-atl",
    seatGeekPerformerSlug: "atlanta-hawks",
    description:
      "Hawks ticket pages give Atlanta a strong downtown arena-night lane with cleaner city-break fit than full football weekends.",
    whyItMatters: [
      "NBA nights make Atlanta easier to productize as an evening-ticket city.",
      "State Farm Arena is a reusable venue node that bridges sports and broader entertainment demand.",
      "Arena routing fits shorter urban itineraries and convention-overlap travel better than stadium days.",
    ],
    relatedCityPages: [
      { href: "/atlanta", label: "Atlanta hub" },
      { href: "/sports/nba", label: "NBA league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "atlanta-braves",
    name: "Atlanta Braves",
    leagueSlug: "mlb",
    citySlug: "atlanta",
    cityName: "Atlanta",
    venueName: "Truist Park",
    venueSlug: "truist-park",
    seatGeekPerformerSlug: "atlanta-braves",
    description:
      "Braves pages give Atlanta a long-season baseball lane tied to destination ballpark demand and summer city travel.",
    whyItMatters: [
      "MLB adds a steadier seasonal ticket layer than pure premium-event spikes.",
      "Truist Park is a venue node with strong neighborhood and district context beyond the game itself.",
      "Atlanta baseball broadens the graph into family, casual, and repeat-visit sports intent.",
    ],
    relatedCityPages: [
      { href: "/atlanta", label: "Atlanta hub" },
      { href: "/sports/mlb", label: "MLB league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "atlanta-united-fc",
    name: "Atlanta United FC",
    leagueSlug: "mls",
    citySlug: "atlanta",
    cityName: "Atlanta",
    venueName: "Mercedes-Benz Stadium",
    venueSlug: "mercedes-benz-stadium-atl",
    seatGeekPerformerSlug: "atlanta-united-fc",
    description:
      "Atlanta United gives the city a high-demand soccer lane centered on one of the strongest MLS attendance markets in the country.",
    whyItMatters: [
      "Atlanta United is one of the clearest MLS city-break sports products in the U.S.",
      "Shared stadium logic makes Mercedes-Benz Stadium a more valuable authority node.",
      "Soccer buyers often overlap with younger, event-first weekend travelers rather than traditional sightseeing intent.",
    ],
    relatedCityPages: [
      { href: "/atlanta", label: "Atlanta hub" },
      { href: "/sports/mls", label: "MLS league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "atlanta-dream",
    name: "Atlanta Dream",
    leagueSlug: "wnba",
    citySlug: "atlanta",
    cityName: "Atlanta",
    venueName: "Gateway Center Arena",
    venueSlug: "gateway-center-arena",
    seatGeekPerformerSlug: "atlanta-dream",
    description:
      "Dream pages add a women’s basketball lane to Atlanta’s sports graph and a smaller-arena ticket product with strong repeat-visit potential.",
    whyItMatters: [
      "WNBA expands the sports graph beyond the largest men’s leagues and supports more flexible city itineraries.",
      "Smaller-arena nights are easier to combine with broader urban travel plans than full stadium events.",
      "The Dream helps Atlanta behave like a fuller multi-league city node.",
    ],
    relatedCityPages: [
      { href: "/atlanta", label: "Atlanta hub" },
      { href: "/sports/wnba", label: "WNBA league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "dallas-cowboys",
    name: "Dallas Cowboys",
    leagueSlug: "nfl",
    citySlug: "dallas",
    cityName: "Dallas",
    venueName: "AT&T Stadium",
    venueSlug: "att-stadium",
    seatGeekPerformerSlug: "dallas-cowboys",
    description:
      "Cowboys pages capture one of the biggest sports-ticket brands in the country, tied to premium weekend demand across the Dallas market.",
    whyItMatters: [
      "Cowboys demand makes Dallas an obvious top-tier NFL node.",
      "AT&T Stadium is a major venue authority candidate with crossover event relevance far beyond football.",
      "This lane supports stadium-weekend planning rather than generic city sightseeing behavior.",
    ],
    relatedCityPages: [
      { href: "/dallas", label: "Dallas hub" },
      { href: "/sports/nfl", label: "NFL league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "dallas-mavericks",
    name: "Dallas Mavericks",
    leagueSlug: "nba",
    citySlug: "dallas",
    cityName: "Dallas",
    venueName: "American Airlines Center",
    venueSlug: "american-airlines-center-dallas",
    seatGeekPerformerSlug: "dallas-mavericks",
    description:
      "Mavericks pages give Dallas a premium downtown arena-ticket lane centered on basketball nights and shorter city itineraries.",
    whyItMatters: [
      "NBA nights make Dallas easier to route for quick urban event trips.",
      "American Airlines Center becomes stronger as a shared arena node across leagues.",
      "Arena demand converts differently than football and deserves its own page model.",
    ],
    relatedCityPages: [
      { href: "/dallas", label: "Dallas hub" },
      { href: "/sports/nba", label: "NBA league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "dallas-stars",
    name: "Dallas Stars",
    leagueSlug: "nhl",
    citySlug: "dallas",
    cityName: "Dallas",
    venueName: "American Airlines Center",
    venueSlug: "american-airlines-center-dallas",
    seatGeekPerformerSlug: "dallas-stars",
    description:
      "Stars pages add a distinct hockey lane to Dallas, centered on downtown arena nights and repeat live-sports demand.",
    whyItMatters: [
      "NHL broadens Dallas beyond football-first assumptions.",
      "Shared-venue logic increases the value of American Airlines Center as an authority node.",
      "Arena-night buyers often pair sports with dining and entertainment instead of all-day city plans.",
    ],
    relatedCityPages: [
      { href: "/dallas", label: "Dallas hub" },
      { href: "/sports/nhl", label: "NHL league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "texas-rangers",
    name: "Texas Rangers",
    leagueSlug: "mlb",
    citySlug: "dallas",
    cityName: "Dallas",
    venueName: "Globe Life Field",
    venueSlug: "globe-life-field",
    seatGeekPerformerSlug: "texas-rangers",
    description:
      "Rangers pages give the Dallas market a long-season ballpark node tied to Arlington event routing and broader family-ticket demand.",
    whyItMatters: [
      "MLB adds seasonal depth and price-range diversity to the Dallas sports graph.",
      "Globe Life Field gives the region a high-value venue node beyond downtown Dallas proper.",
      "Baseball supports more casual and repeat-visit sports discovery than only premium-event inventory.",
    ],
    relatedCityPages: [
      { href: "/dallas", label: "Dallas hub" },
      { href: "/sports/mlb", label: "MLB league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "fc-dallas",
    name: "FC Dallas",
    leagueSlug: "mls",
    citySlug: "dallas",
    cityName: "Dallas",
    venueName: "Toyota Stadium",
    venueSlug: "toyota-stadium-frisco",
    seatGeekPerformerSlug: "fc-dallas",
    description:
      "FC Dallas adds a soccer-first lane to the Dallas market, tied to suburban stadium routing and a different match-night audience than the core downtown teams.",
    whyItMatters: [
      "MLS broadens the Dallas sports graph into a more flexible weekend and family sports product.",
      "Toyota Stadium creates a useful market-edge venue node in Frisco.",
      "Soccer demand helps the city graph avoid becoming too arena-and-stadium narrow.",
    ],
    relatedCityPages: [
      { href: "/dallas", label: "Dallas hub" },
      { href: "/sports/mls", label: "MLS league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "houston-texans",
    name: "Houston Texans",
    leagueSlug: "nfl",
    citySlug: "houston",
    cityName: "Houston",
    venueName: "NRG Stadium",
    venueSlug: "nrg-stadium",
    seatGeekPerformerSlug: "houston-texans",
    description:
      "Texans pages anchor Houston’s biggest stadium-ticket lane, tied to football weekends and major-event routing across the city.",
    whyItMatters: [
      "Texans weekends create one of the clearest sports demand spikes in Houston.",
      "NRG Stadium is a major venue node with wider event relevance across the city.",
      "NFL inventory creates a different buyer path than museum, food, or business-travel intent.",
    ],
    relatedCityPages: [
      { href: "/houston", label: "Houston hub" },
      { href: "/sports/nfl", label: "NFL league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "houston-rockets",
    name: "Houston Rockets",
    leagueSlug: "nba",
    citySlug: "houston",
    cityName: "Houston",
    venueName: "Toyota Center",
    venueSlug: "toyota-center-houston",
    seatGeekPerformerSlug: "houston-rockets",
    description:
      "Rockets pages give Houston a strong downtown arena-ticket lane centered on basketball nights and shorter urban stays.",
    whyItMatters: [
      "NBA gives Houston a clean evening-ticket product distinct from full stadium weekends.",
      "Toyota Center is a reusable venue node for broader entertainment and sports demand.",
      "Arena routing suits convention and business-travel overlap particularly well in Houston.",
    ],
    relatedCityPages: [
      { href: "/houston", label: "Houston hub" },
      { href: "/sports/nba", label: "NBA league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "houston-astros",
    name: "Houston Astros",
    leagueSlug: "mlb",
    citySlug: "houston",
    cityName: "Houston",
    venueName: "Daikin Park",
    venueSlug: "daikin-park",
    seatGeekPerformerSlug: "houston-astros",
    description:
      "Astros pages give Houston a long-season baseball lane centered on downtown ballpark demand and repeat sports discovery.",
    whyItMatters: [
      "MLB adds seasonal depth and lower-friction ticket intent to the Houston market.",
      "Daikin Park is one of the strongest baseball venue candidates in the next expansion set.",
      "Ballpark nights complement, rather than replace, Houston’s other sports products.",
    ],
    relatedCityPages: [
      { href: "/houston", label: "Houston hub" },
      { href: "/sports/mlb", label: "MLB league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "houston-dynamo-fc",
    name: "Houston Dynamo FC",
    leagueSlug: "mls",
    citySlug: "houston",
    cityName: "Houston",
    venueName: "Shell Energy Stadium",
    venueSlug: "shell-energy-stadium",
    seatGeekPerformerSlug: "houston-dynamo-fc",
    description:
      "Houston Dynamo pages add a soccer lane to the city graph, tied to downtown-adjacent match routing and more flexible event planning.",
    whyItMatters: [
      "MLS helps Houston behave like a fuller multi-sport market rather than a football-and-baseball-only city.",
      "Shell Energy Stadium adds another useful venue node near the city core.",
      "Soccer buyers often convert on simpler weekend or same-day event intent than major stadium games.",
    ],
    relatedCityPages: [
      { href: "/houston", label: "Houston hub" },
      { href: "/sports/mls", label: "MLS league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "philadelphia-eagles",
    name: "Philadelphia Eagles",
    leagueSlug: "nfl",
    citySlug: "philadelphia",
    cityName: "Philadelphia",
    venueName: "Lincoln Financial Field",
    venueSlug: "lincoln-financial-field",
    seatGeekPerformerSlug: "philadelphia-eagles",
    description:
      "Eagles pages capture one of the strongest stadium-ticket brands in the Northeast, tied to full football weekends and intense local demand.",
    whyItMatters: [
      "Eagles demand makes Philadelphia one of the clearest sports-city nodes in the country.",
      "Lincoln Financial Field is a major venue authority candidate with strong game-day logistics value.",
      "NFL routing in Philadelphia changes hotel, tailgate, and neighborhood-planning behavior.",
    ],
    relatedCityPages: [
      { href: "/philadelphia", label: "Philadelphia hub" },
      { href: "/sports/nfl", label: "NFL league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "philadelphia-76ers",
    name: "Philadelphia 76ers",
    leagueSlug: "nba",
    citySlug: "philadelphia",
    cityName: "Philadelphia",
    venueName: "Wells Fargo Center",
    venueSlug: "wells-fargo-center-philadelphia",
    seatGeekPerformerSlug: "philadelphia-76ers",
    description:
      "76ers pages give Philadelphia a premium arena-ticket lane centered on basketball nights and urban event intent.",
    whyItMatters: [
      "NBA strengthens Philadelphia as a year-round evening-ticket city, not only a football market.",
      "Wells Fargo Center becomes more valuable when it anchors multiple team nodes.",
      "Arena demand converts differently than full-day stadium weekends and broadens the city graph.",
    ],
    relatedCityPages: [
      { href: "/philadelphia", label: "Philadelphia hub" },
      { href: "/sports/nba", label: "NBA league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "philadelphia-flyers",
    name: "Philadelphia Flyers",
    leagueSlug: "nhl",
    citySlug: "philadelphia",
    cityName: "Philadelphia",
    venueName: "Wells Fargo Center",
    venueSlug: "wells-fargo-center-philadelphia",
    seatGeekPerformerSlug: "philadelphia-flyers",
    description:
      "Flyers pages add a strong hockey lane to Philadelphia, tied to repeat arena demand and city-break sports planning.",
    whyItMatters: [
      "NHL broadens Philadelphia into a denser multi-league sports city.",
      "Shared-venue logic makes Wells Fargo Center a stronger authority node.",
      "Arena-night buyers often behave differently than tailgate and stadium-weekend buyers.",
    ],
    relatedCityPages: [
      { href: "/philadelphia", label: "Philadelphia hub" },
      { href: "/sports/nhl", label: "NHL league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "philadelphia-phillies",
    name: "Philadelphia Phillies",
    leagueSlug: "mlb",
    citySlug: "philadelphia",
    cityName: "Philadelphia",
    venueName: "Citizens Bank Park",
    venueSlug: "citizens-bank-park",
    seatGeekPerformerSlug: "philadelphia-phillies",
    description:
      "Phillies pages give Philadelphia a high-value baseball lane tied to summer city demand and one of the clearest Northeast ballpark products.",
    whyItMatters: [
      "MLB adds seasonal depth and wider price-band coverage to the Philadelphia sports graph.",
      "Citizens Bank Park is a major venue node with real district context around the stadium complex.",
      "Ballpark nights help Philadelphia behave like a fuller year-round sports market.",
    ],
    relatedCityPages: [
      { href: "/philadelphia", label: "Philadelphia hub" },
      { href: "/sports/mlb", label: "MLB league hub" },
    ],
    updatedAt: "2026-03-12",
  },
  {
    slug: "philadelphia-union",
    name: "Philadelphia Union",
    leagueSlug: "mls",
    citySlug: "philadelphia",
    cityName: "Philadelphia",
    venueName: "Subaru Park",
    venueSlug: "subaru-park",
    seatGeekPerformerSlug: "philadelphia-union",
    description:
      "Union pages add a soccer lane to the Philadelphia market, tied to a stadium experience that sits slightly outside the core city center.",
    whyItMatters: [
      "MLS broadens the Philadelphia sports graph and captures a different event audience than the core major-league teams.",
      "Subaru Park adds a market-edge venue node with useful geographic context.",
      "Soccer inventory helps diversify the sports layer beyond the most saturated Northeast teams.",
    ],
    relatedCityPages: [
      { href: "/philadelphia", label: "Philadelphia hub" },
      { href: "/sports/mls", label: "MLS league hub" },
    ],
    updatedAt: "2026-03-12",
  },
];

export function getSportsTeam(slug: string) {
  return SPORTS_TEAMS_CONFIG.find((team) => team.slug === slug) || null;
}

export function getSportsTeamByPerformerSlug(performerSlug: string) {
  return SPORTS_TEAMS_CONFIG.find((team) => team.seatGeekPerformerSlug === performerSlug) || null;
}

export function getTeamsByLeague(leagueSlug: string) {
  return SPORTS_TEAMS_CONFIG.filter((team) => team.leagueSlug === leagueSlug);
}

export function getTeamsByCity(citySlug: string) {
  return SPORTS_TEAMS_CONFIG.filter((team) => team.citySlug === citySlug);
}

export function getTeamsByVenue(venueSlug: string) {
  return SPORTS_TEAMS_CONFIG.filter((team) => team.venueSlug === venueSlug);
}

export function getSportsCitySlugs() {
  return Array.from(new Set(SPORTS_TEAMS_CONFIG.map((team) => team.citySlug))).sort();
}
