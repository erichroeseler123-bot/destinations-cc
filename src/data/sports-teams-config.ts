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
];

export function getSportsTeam(slug: string) {
  return SPORTS_TEAMS_CONFIG.find((team) => team.slug === slug) || null;
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
