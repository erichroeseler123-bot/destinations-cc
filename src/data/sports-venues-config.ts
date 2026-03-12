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
  {
    slug: "soldier-field",
    name: "Soldier Field",
    citySlug: "chicago",
    cityName: "Chicago",
    addressNote: "Chicago lakefront stadium district near Museum Campus",
    primaryTeams: ["chicago-bears", "chicago-fire-fc"],
    sportsLeagues: ["nfl", "mls"],
    description:
      "Soldier Field gives Chicago a multi-league lakefront stadium node that connects football and soccer demand to downtown stays and museum-campus routing.",
    whyItMatters: [
      "The stadium matters because it anchors more than one major Chicago sports lane.",
      "Its lakefront location makes logistics, area context, and neighborhood planning part of the venue story.",
      "This is one of the strongest stadium authority candidates in the next sports-city set.",
    ],
    relatedPages: [
      { href: "/chicago", label: "Chicago hub" },
      { href: "/sports/team/chicago-bears", label: "Chicago Bears" },
    ],
    seatGeekPerformerSlugs: ["chicago-bears", "chicago-fire-fc"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "united-center",
    name: "United Center",
    citySlug: "chicago",
    cityName: "Chicago",
    addressNote: "Chicago West Side arena district",
    primaryTeams: ["chicago-bulls", "chicago-blackhawks"],
    sportsLeagues: ["nba", "nhl"],
    description:
      "United Center is Chicago’s flagship arena node, linking basketball and hockey demand to a major urban live-event venue.",
    whyItMatters: [
      "This venue becomes much stronger when it anchors both NBA and NHL team pages.",
      "United Center is also a major future crossover venue for concerts and larger event authority.",
      "Arena-night demand behaves differently than stadium weekends and needs its own authority surface.",
    ],
    relatedPages: [
      { href: "/chicago", label: "Chicago hub" },
      { href: "/sports/team/chicago-bulls", label: "Chicago Bulls" },
    ],
    seatGeekPerformerSlugs: ["chicago-bulls", "chicago-blackhawks"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "wrigley-field",
    name: "Wrigley Field",
    citySlug: "chicago",
    cityName: "Chicago",
    addressNote: "Wrigleyville ballpark district on the North Side",
    primaryTeams: ["chicago-cubs"],
    sportsLeagues: ["mlb"],
    description:
      "Wrigley Field is both a ballpark venue node and a neighborhood-scale tourism asset, making it one of the strongest baseball authority pages in the graph.",
    whyItMatters: [
      "The Cubs create unusually strong tourism overlap for an MLB team page.",
      "Wrigleyville context gives this venue page value beyond ticket links alone.",
      "Ballpark and neighborhood planning are central to how visitors use this venue.",
    ],
    relatedPages: [
      { href: "/chicago", label: "Chicago hub" },
      { href: "/sports/team/chicago-cubs", label: "Chicago Cubs" },
    ],
    seatGeekPerformerSlugs: ["chicago-cubs"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "metlife-stadium",
    name: "MetLife Stadium",
    citySlug: "new-york",
    cityName: "New York",
    addressNote: "East Rutherford stadium district serving the New York market",
    primaryTeams: ["new-york-giants", "new-york-jets"],
    sportsLeagues: ["nfl"],
    description:
      "MetLife Stadium is one of the biggest shared NFL venue nodes in the country, serving both Giants and Jets demand for the New York market.",
    whyItMatters: [
      "Few venue pages benefit more from multi-team ticket demand than MetLife Stadium.",
      "This page ties city sports discovery to a regional stadium logistics pattern.",
      "It is a high-leverage stadium node for later event and transport coverage.",
    ],
    relatedPages: [
      { href: "/new-york", label: "New York hub" },
      { href: "/sports/team/new-york-giants", label: "New York Giants" },
    ],
    seatGeekPerformerSlugs: ["new-york-giants", "new-york-jets"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "madison-square-garden",
    name: "Madison Square Garden",
    citySlug: "new-york",
    cityName: "New York",
    addressNote: "Midtown Manhattan arena district",
    primaryTeams: ["new-york-knicks", "new-york-rangers"],
    sportsLeagues: ["nba", "nhl"],
    description:
      "Madison Square Garden is a flagship arena authority node, linking Manhattan sports nights to one of the strongest live-event venues in the country.",
    whyItMatters: [
      "Knicks and Rangers together make MSG a high-authority shared venue node.",
      "The venue matters to the wider graph because it is already a major destination in its own right.",
      "This is one of the cleanest arena pages for blending sports authority with broader event discovery later.",
    ],
    relatedPages: [
      { href: "/new-york", label: "New York hub" },
      { href: "/sports/team/new-york-knicks", label: "New York Knicks" },
    ],
    seatGeekPerformerSlugs: ["new-york-knicks", "new-york-rangers"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "yankee-stadium",
    name: "Yankee Stadium",
    citySlug: "new-york",
    cityName: "New York",
    addressNote: "Bronx stadium district",
    primaryTeams: ["new-york-yankees", "new-york-city-fc"],
    sportsLeagues: ["mlb", "mls"],
    description:
      "Yankee Stadium gives the New York graph a landmark ballpark node with enough tourism gravity to support both baseball and soccer authority paths.",
    whyItMatters: [
      "The Yankees make this one of the strongest MLB venue pages in the system.",
      "NYCFC broadens the venue beyond one sport and increases event density.",
      "This page is useful because venue, neighborhood, and iconic-status queries all converge here.",
    ],
    relatedPages: [
      { href: "/new-york", label: "New York hub" },
      { href: "/sports/team/new-york-yankees", label: "New York Yankees" },
    ],
    seatGeekPerformerSlugs: ["new-york-yankees", "new-york-city-fc"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "barclays-center",
    name: "Barclays Center",
    citySlug: "new-york",
    cityName: "New York",
    addressNote: "Downtown Brooklyn arena district",
    primaryTeams: ["new-york-liberty"],
    sportsLeagues: ["wnba"],
    description:
      "Barclays Center gives the New York graph a Brooklyn arena node with a strong women’s basketball ticket lane and future crossover event value.",
    whyItMatters: [
      "The Liberty create a meaningful WNBA authority path in one of the biggest city markets.",
      "Barclays is an arena node with value beyond one team, which helps future venue expansion.",
      "This page strengthens New York coverage without overlapping Manhattan’s main arena node.",
    ],
    relatedPages: [
      { href: "/new-york", label: "New York hub" },
      { href: "/sports/team/new-york-liberty", label: "New York Liberty" },
    ],
    seatGeekPerformerSlugs: ["new-york-liberty"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "sofi-stadium",
    name: "SoFi Stadium",
    citySlug: "los-angeles",
    cityName: "Los Angeles",
    addressNote: "Inglewood stadium district serving the Los Angeles market",
    primaryTeams: ["los-angeles-rams"],
    sportsLeagues: ["nfl"],
    description:
      "SoFi Stadium is the flagship stadium node for the Los Angeles sports graph, linking premium NFL demand to one of the region’s biggest live-event venues.",
    whyItMatters: [
      "This venue carries enough event gravity to matter far beyond one team.",
      "NFL demand here intersects with larger Los Angeles lodging and traffic behavior.",
      "SoFi is one of the highest-leverage future venue pages in the system.",
    ],
    relatedPages: [
      { href: "/los-angeles", label: "Los Angeles hub" },
      { href: "/sports/team/los-angeles-rams", label: "Los Angeles Rams" },
    ],
    seatGeekPerformerSlugs: ["los-angeles-rams"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "crypto-dot-com-arena",
    name: "Crypto.com Arena",
    citySlug: "los-angeles",
    cityName: "Los Angeles",
    addressNote: "Downtown Los Angeles arena district",
    primaryTeams: ["los-angeles-lakers", "los-angeles-kings"],
    sportsLeagues: ["nba", "nhl"],
    description:
      "Crypto.com Arena is the central arena authority node in the Los Angeles market, combining basketball and hockey demand in one downtown venue surface.",
    whyItMatters: [
      "Lakers and Kings together make this a high-density shared venue node.",
      "The venue is already a major event destination, which supports future crossover authority.",
      "Downtown arena nights create a distinct routing pattern from beach or studio-tour visitors.",
    ],
    relatedPages: [
      { href: "/los-angeles", label: "Los Angeles hub" },
      { href: "/sports/team/los-angeles-lakers", label: "Los Angeles Lakers" },
    ],
    seatGeekPerformerSlugs: ["los-angeles-lakers", "los-angeles-kings"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "dodger-stadium",
    name: "Dodger Stadium",
    citySlug: "los-angeles",
    cityName: "Los Angeles",
    addressNote: "Elysian Park ballpark zone",
    primaryTeams: ["los-angeles-dodgers"],
    sportsLeagues: ["mlb"],
    description:
      "Dodger Stadium gives Los Angeles one of the strongest ballpark venue nodes in the country, combining landmark recognition with long-season sports demand.",
    whyItMatters: [
      "Dodgers demand creates both baseball and destination-style venue search intent.",
      "This page benefits from iconic venue status, not just team demand.",
      "Ballpark planning in Los Angeles is distinct enough to justify a dedicated authority node.",
    ],
    relatedPages: [
      { href: "/los-angeles", label: "Los Angeles hub" },
      { href: "/sports/team/los-angeles-dodgers", label: "Los Angeles Dodgers" },
    ],
    seatGeekPerformerSlugs: ["los-angeles-dodgers"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "bmo-stadium",
    name: "BMO Stadium",
    citySlug: "los-angeles",
    cityName: "Los Angeles",
    addressNote: "Exposition Park match-night district",
    primaryTeams: ["lafc"],
    sportsLeagues: ["mls"],
    description:
      "BMO Stadium adds a soccer-first venue node to the Los Angeles graph, tied to supporter culture and a distinct match-night routing pattern.",
    whyItMatters: [
      "LAFC gives Los Angeles a strong MLS demand lane that differs from the city’s larger arena and stadium markets.",
      "This venue improves sport diversity in the graph while staying rooted in a high-demand city.",
      "Soccer venue nodes are highly reusable for other cities later in the rollout.",
    ],
    relatedPages: [
      { href: "/los-angeles", label: "Los Angeles hub" },
      { href: "/sports/team/lafc", label: "LAFC" },
    ],
    seatGeekPerformerSlugs: ["lafc", "los-angeles-football-club"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "nissan-stadium",
    name: "Nissan Stadium",
    citySlug: "nashville",
    cityName: "Nashville",
    addressNote: "East Bank stadium district across from downtown Nashville",
    primaryTeams: ["nashville-titans"],
    sportsLeagues: ["nfl"],
    description:
      "Nissan Stadium gives Nashville a true stadium-weekend node, pairing Titans demand with downtown and Broadway travel behavior.",
    whyItMatters: [
      "Titans weekends create a citywide sports pattern that differs from Nashville’s music-first traffic.",
      "The stadium’s relationship to downtown makes routing and logistics part of the authority value.",
      "This is the obvious first stadium venue node for Nashville.",
    ],
    relatedPages: [
      { href: "/nashville", label: "Nashville hub" },
      { href: "/sports/team/nashville-titans", label: "Tennessee Titans" },
    ],
    seatGeekPerformerSlugs: ["tennessee-titans"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "bridgestone-arena",
    name: "Bridgestone Arena",
    citySlug: "nashville",
    cityName: "Nashville",
    addressNote: "Downtown Nashville and Broadway arena core",
    primaryTeams: ["nashville-predators"],
    sportsLeagues: ["nhl"],
    description:
      "Bridgestone Arena is the clearest downtown arena node in Nashville, tying hockey nights directly into the city’s core live-event district.",
    whyItMatters: [
      "Predators demand fits naturally into Broadway and downtown Nashville itineraries.",
      "This venue is highly reusable later because it matters for sports and general live-event coverage.",
      "Arena-night authority complements Nashville’s already-strong shows layer without replacing it.",
    ],
    relatedPages: [
      { href: "/nashville", label: "Nashville hub" },
      { href: "/sports/team/nashville-predators", label: "Nashville Predators" },
    ],
    seatGeekPerformerSlugs: ["nashville-predators"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "geodis-park",
    name: "GEODIS Park",
    citySlug: "nashville",
    cityName: "Nashville",
    addressNote: "South Nashville soccer venue district",
    primaryTeams: ["nashville-sc"],
    sportsLeagues: ["mls"],
    description:
      "GEODIS Park adds a soccer-first stadium node to Nashville, giving the city a travel-friendly match-night product separate from football and arena demand.",
    whyItMatters: [
      "Nashville SC broadens the sports graph into MLS without forcing overlap with music-first content.",
      "GEODIS Park is a useful venue node because it supports a distinct match-day pattern in Nashville.",
      "Soccer pages help make Nashville more than a shows-only city in the DCC graph.",
    ],
    relatedPages: [
      { href: "/nashville", label: "Nashville hub" },
      { href: "/sports/team/nashville-sc", label: "Nashville SC" },
    ],
    seatGeekPerformerSlugs: ["nashville-sc"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "gillette-stadium",
    name: "Gillette Stadium",
    citySlug: "boston",
    cityName: "Boston",
    addressNote: "Foxborough stadium district serving the Boston market",
    primaryTeams: ["new-england-patriots", "new-england-revolution"],
    sportsLeagues: ["nfl", "mls"],
    description:
      "Gillette Stadium gives the Boston market a shared stadium node for both NFL and MLS demand, with strong regional travel and game-day routing behavior.",
    whyItMatters: [
      "Patriots and Revolution pages make this a denser multi-team venue node instead of a single-use stadium page.",
      "Regional venue geography is part of the authority value here, not a weakness.",
      "This page strengthens Boston’s sports graph with one of the clearest stadium nodes in New England.",
    ],
    relatedPages: [
      { href: "/boston", label: "Boston hub" },
      { href: "/sports/team/new-england-patriots", label: "New England Patriots" },
    ],
    seatGeekPerformerSlugs: ["new-england-patriots", "new-england-revolution"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "td-garden",
    name: "TD Garden",
    citySlug: "boston",
    cityName: "Boston",
    addressNote: "Downtown Boston arena district",
    primaryTeams: ["boston-celtics", "boston-bruins"],
    sportsLeagues: ["nba", "nhl"],
    description:
      "TD Garden is Boston’s flagship arena node, combining basketball and hockey demand in one of the strongest downtown live-event venues in the market.",
    whyItMatters: [
      "Celtics and Bruins together make TD Garden a high-density arena authority page.",
      "Arena-night demand overlaps directly with downtown hotel, food, and theater planning.",
      "This is one of the strongest shared-venue patterns in the next sports-city batch.",
    ],
    relatedPages: [
      { href: "/boston", label: "Boston hub" },
      { href: "/sports/team/boston-celtics", label: "Boston Celtics" },
    ],
    seatGeekPerformerSlugs: ["boston-celtics", "boston-bruins"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "fenway-park",
    name: "Fenway Park",
    citySlug: "boston",
    cityName: "Boston",
    addressNote: "Fenway neighborhood ballpark district",
    primaryTeams: ["boston-red-sox"],
    sportsLeagues: ["mlb"],
    description:
      "Fenway Park is both a baseball venue node and a landmark authority page, giving Boston one of the strongest ballpark surfaces in the sports graph.",
    whyItMatters: [
      "The Red Sox and Fenway combine team demand with landmark-style venue intent.",
      "Neighborhood context matters heavily to how visitors use this venue page.",
      "This is a high-value MLB authority node with strong tourism overlap.",
    ],
    relatedPages: [
      { href: "/boston", label: "Boston hub" },
      { href: "/sports/team/boston-red-sox", label: "Boston Red Sox" },
    ],
    seatGeekPerformerSlugs: ["boston-red-sox"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "lumen-field",
    name: "Lumen Field",
    citySlug: "seattle",
    cityName: "Seattle",
    addressNote: "Seattle stadium district south of downtown",
    primaryTeams: ["seattle-seahawks", "seattle-sounders-fc"],
    sportsLeagues: ["nfl", "mls"],
    description:
      "Lumen Field gives Seattle a shared stadium node for both football and soccer demand, tying match-day travel directly into downtown and waterfront routing.",
    whyItMatters: [
      "Seahawks and Sounders together make Lumen Field a stronger multi-team venue page.",
      "This venue helps Seattle behave like a full-spectrum sports city rather than a single-team market.",
      "Stadium logistics and downtown proximity are central to its authority value.",
    ],
    relatedPages: [
      { href: "/seattle", label: "Seattle hub" },
      { href: "/sports/team/seattle-seahawks", label: "Seattle Seahawks" },
    ],
    seatGeekPerformerSlugs: ["seattle-seahawks", "seattle-sounders-fc"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "climate-pledge-arena",
    name: "Climate Pledge Arena",
    citySlug: "seattle",
    cityName: "Seattle",
    addressNote: "Seattle Center arena district",
    primaryTeams: ["seattle-kraken", "seattle-storm"],
    sportsLeagues: ["nhl", "wnba"],
    description:
      "Climate Pledge Arena is Seattle’s shared arena node for hockey and women’s basketball, linking downtown event routing to premium sports demand.",
    whyItMatters: [
      "Kraken and Storm together create a stronger cross-league arena authority page.",
      "This venue gives Seattle a clean evening-ticket surface separate from stadium routing.",
      "Arena nights here fit shorter urban itineraries extremely well.",
    ],
    relatedPages: [
      { href: "/seattle", label: "Seattle hub" },
      { href: "/sports/team/seattle-kraken", label: "Seattle Kraken" },
    ],
    seatGeekPerformerSlugs: ["seattle-kraken", "seattle-storm"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "t-mobile-park",
    name: "T-Mobile Park",
    citySlug: "seattle",
    cityName: "Seattle",
    addressNote: "Seattle ballpark district beside the stadium core",
    primaryTeams: ["seattle-mariners"],
    sportsLeagues: ["mlb"],
    description:
      "T-Mobile Park gives Seattle a long-season ballpark authority node tied to summer city travel, family demand, and lower-friction ticket buying.",
    whyItMatters: [
      "Mariners demand broadens Seattle into a fuller seasonal sports market.",
      "This page supports a distinct ballpark planning pattern from stadium or arena nights.",
      "Ballpark and neighborhood context both matter to how visitors use this venue.",
    ],
    relatedPages: [
      { href: "/seattle", label: "Seattle hub" },
      { href: "/sports/team/seattle-mariners", label: "Seattle Mariners" },
    ],
    seatGeekPerformerSlugs: ["seattle-mariners"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "levis-stadium",
    name: "Levi's Stadium",
    citySlug: "san-francisco",
    cityName: "San Francisco",
    addressNote: "Santa Clara stadium district serving the San Francisco market",
    primaryTeams: ["san-francisco-49ers"],
    sportsLeagues: ["nfl"],
    description:
      "Levi's Stadium gives San Francisco a flagship NFL venue node with strong market-wide demand and one of the biggest stadium paths in the Bay Area.",
    whyItMatters: [
      "49ers demand is large enough to justify a city-market venue page despite regional geography.",
      "Stadium logistics are a key part of what users need from this page.",
      "This is a top-tier NFL venue node for the next-city expansion set.",
    ],
    relatedPages: [
      { href: "/san-francisco", label: "San Francisco hub" },
      { href: "/sports/team/san-francisco-49ers", label: "San Francisco 49ers" },
    ],
    seatGeekPerformerSlugs: ["san-francisco-49ers"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "chase-center-sf",
    name: "Chase Center",
    citySlug: "san-francisco",
    cityName: "San Francisco",
    addressNote: "Mission Bay arena district",
    primaryTeams: ["golden-state-warriors"],
    sportsLeagues: ["nba"],
    description:
      "Chase Center is San Francisco’s premium arena node, centered on Warriors demand and one of the strongest basketball ticket lanes on the West Coast.",
    whyItMatters: [
      "Warriors demand gives this venue page high-value NBA authority immediately.",
      "This is also a strong future crossover venue node beyond sports alone.",
      "Arena-night routing here differs meaningfully from sightseeing-first city plans.",
    ],
    relatedPages: [
      { href: "/san-francisco", label: "San Francisco hub" },
      { href: "/sports/team/golden-state-warriors", label: "Golden State Warriors" },
    ],
    seatGeekPerformerSlugs: ["golden-state-warriors"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "oracle-park",
    name: "Oracle Park",
    citySlug: "san-francisco",
    cityName: "San Francisco",
    addressNote: "South Beach and waterfront ballpark zone",
    primaryTeams: ["san-francisco-giants"],
    sportsLeagues: ["mlb"],
    description:
      "Oracle Park gives San Francisco a strong ballpark authority node with waterfront, neighborhood, and long-season sports intent all in one surface.",
    whyItMatters: [
      "Giants demand supports one of the strongest urban ballpark pages in the country.",
      "The waterfront and neighborhood context make this page useful beyond tickets alone.",
      "This is a clean MLB venue node for the Bay Area branch of the graph.",
    ],
    relatedPages: [
      { href: "/san-francisco", label: "San Francisco hub" },
      { href: "/sports/team/san-francisco-giants", label: "San Francisco Giants" },
    ],
    seatGeekPerformerSlugs: ["san-francisco-giants"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "northwest-stadium",
    name: "Northwest Stadium",
    citySlug: "washington-dc",
    cityName: "Washington, D.C.",
    addressNote: "Landover stadium district serving the Washington market",
    primaryTeams: ["washington-commanders"],
    sportsLeagues: ["nfl"],
    description:
      "Northwest Stadium gives Washington a flagship NFL venue node with major regional demand and a strong need for stadium-focused planning context.",
    whyItMatters: [
      "Commanders demand makes this one of the clearest sports-weekend nodes in the DMV.",
      "Regional venue geography is part of the authority value, not a weakness.",
      "This page supports future transport, parking, and event-routing coverage naturally.",
    ],
    relatedPages: [
      { href: "/washington-dc", label: "Washington, D.C. hub" },
      { href: "/sports/team/washington-commanders", label: "Washington Commanders" },
    ],
    seatGeekPerformerSlugs: ["washington-commanders"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "capital-one-arena",
    name: "Capital One Arena",
    citySlug: "washington-dc",
    cityName: "Washington, D.C.",
    addressNote: "Downtown Washington arena district",
    primaryTeams: ["washington-wizards", "washington-capitals"],
    sportsLeagues: ["nba", "nhl"],
    description:
      "Capital One Arena is Washington’s core downtown arena node, linking basketball and hockey demand to one of the city’s strongest live-event districts.",
    whyItMatters: [
      "Wizards and Capitals together make this a denser shared venue node.",
      "Arena-night demand in Washington fits shorter city stays and downtown planning especially well.",
      "This page is highly reusable for future non-sports event authority too.",
    ],
    relatedPages: [
      { href: "/washington-dc", label: "Washington, D.C. hub" },
      { href: "/sports/team/washington-wizards", label: "Washington Wizards" },
    ],
    seatGeekPerformerSlugs: ["washington-wizards", "washington-capitals"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "nationals-park",
    name: "Nationals Park",
    citySlug: "washington-dc",
    cityName: "Washington, D.C.",
    addressNote: "Capitol Riverfront ballpark district",
    primaryTeams: ["washington-nationals"],
    sportsLeagues: ["mlb"],
    description:
      "Nationals Park gives Washington a summer ballpark authority node tied to waterfront district planning and a lower-friction long-season sports lane.",
    whyItMatters: [
      "The Nationals help Washington behave like a fuller seasonal sports market.",
      "This venue page benefits from neighborhood and riverfront routing, not just ticket demand.",
      "Ballpark nights convert differently than arena or stadium weekends and deserve their own node.",
    ],
    relatedPages: [
      { href: "/washington-dc", label: "Washington, D.C. hub" },
      { href: "/sports/team/washington-nationals", label: "Washington Nationals" },
    ],
    seatGeekPerformerSlugs: ["washington-nationals"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "carefirst-arena",
    name: "CareFirst Arena",
    citySlug: "washington-dc",
    cityName: "Washington, D.C.",
    addressNote: "Congress Heights arena district",
    primaryTeams: ["washington-mystics"],
    sportsLeagues: ["wnba"],
    description:
      "CareFirst Arena gives Washington a smaller-scale women’s basketball venue node with a distinct local and city-break sports pattern from the larger downtown arenas.",
    whyItMatters: [
      "The Mystics broaden the D.C. sports graph beyond the biggest men’s leagues.",
      "CareFirst Arena adds a different venue scale and neighborhood context to the venue layer.",
      "It supports a strong evening-ticket product for shorter Washington stays.",
    ],
    relatedPages: [
      { href: "/washington-dc", label: "Washington, D.C. hub" },
      { href: "/sports/team/washington-mystics", label: "Washington Mystics" },
    ],
    seatGeekPerformerSlugs: ["washington-mystics"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "audi-field",
    name: "Audi Field",
    citySlug: "washington-dc",
    cityName: "Washington, D.C.",
    addressNote: "Buzzard Point and Capitol Riverfront soccer district",
    primaryTeams: ["dc-united"],
    sportsLeagues: ["mls"],
    description:
      "Audi Field gives Washington a soccer-first venue node with strong match-night routing and a useful bridge between downtown and waterfront city planning.",
    whyItMatters: [
      "D.C. United gives Washington a clean MLS path with strong city-break value.",
      "Audi Field already has wider event authority, which helps this venue page scale later.",
      "This node rounds out Washington with a different type of sports-travel behavior than football or arena nights.",
    ],
    relatedPages: [
      { href: "/washington-dc", label: "Washington, D.C. hub" },
      { href: "/sports/team/dc-united", label: "D.C. United" },
    ],
    seatGeekPerformerSlugs: ["dc-united"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "mercedes-benz-stadium-atl",
    name: "Mercedes-Benz Stadium",
    citySlug: "atlanta",
    cityName: "Atlanta",
    addressNote: "Downtown Atlanta stadium district",
    primaryTeams: ["atlanta-falcons", "atlanta-united-fc"],
    sportsLeagues: ["nfl", "mls"],
    description:
      "Mercedes-Benz Stadium is Atlanta’s flagship stadium node, connecting football and soccer demand to downtown event routing and high-traffic weekends.",
    whyItMatters: [
      "Shared NFL and MLS usage makes this a strong multi-league authority page.",
      "It is one of the clearest stadium-scale venue nodes in the Southeast.",
      "Visitors need district and logistics context here, not just raw ticket links.",
    ],
    relatedPages: [
      { href: "/atlanta", label: "Atlanta hub" },
      { href: "/sports/team/atlanta-falcons", label: "Atlanta Falcons" },
    ],
    seatGeekPerformerSlugs: ["atlanta-falcons", "atlanta-united-fc"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "state-farm-arena-atl",
    name: "State Farm Arena",
    citySlug: "atlanta",
    cityName: "Atlanta",
    addressNote: "Downtown Atlanta arena district",
    primaryTeams: ["atlanta-hawks"],
    sportsLeagues: ["nba"],
    description:
      "State Farm Arena gives Atlanta a downtown arena node centered on NBA demand and shorter evening-event itineraries.",
    whyItMatters: [
      "Arena nights make Atlanta easier to convert for compact city-break travel.",
      "The venue is a reusable authority node for sports and broader event crossover.",
      "It balances the Atlanta graph away from purely stadium-weekend behavior.",
    ],
    relatedPages: [
      { href: "/atlanta", label: "Atlanta hub" },
      { href: "/sports/team/atlanta-hawks", label: "Atlanta Hawks" },
    ],
    seatGeekPerformerSlugs: ["atlanta-hawks"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "truist-park",
    name: "Truist Park",
    citySlug: "atlanta",
    cityName: "Atlanta",
    addressNote: "Cobb County ballpark district serving the Atlanta market",
    primaryTeams: ["atlanta-braves"],
    sportsLeagues: ["mlb"],
    description:
      "Truist Park gives Atlanta a long-season baseball venue node with strong district and destination-game context.",
    whyItMatters: [
      "Braves demand creates one of the strongest baseball lanes in the Southeast.",
      "The venue matters as both a ballpark and an area-planning destination.",
      "MLB deepens Atlanta beyond its largest weekend event spikes.",
    ],
    relatedPages: [
      { href: "/atlanta", label: "Atlanta hub" },
      { href: "/sports/team/atlanta-braves", label: "Atlanta Braves" },
    ],
    seatGeekPerformerSlugs: ["atlanta-braves"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "gateway-center-arena",
    name: "Gateway Center Arena",
    citySlug: "atlanta",
    cityName: "Atlanta",
    addressNote: "College Park arena serving the Atlanta market",
    primaryTeams: ["atlanta-dream"],
    sportsLeagues: ["wnba"],
    description:
      "Gateway Center Arena adds a dedicated women’s basketball venue node to the Atlanta sports graph.",
    whyItMatters: [
      "WNBA broadens Atlanta into a fuller multi-league city.",
      "Smaller-arena events support a more flexible city itinerary than major stadium days.",
      "This venue helps diversify the graph beyond only the largest properties.",
    ],
    relatedPages: [
      { href: "/atlanta", label: "Atlanta hub" },
      { href: "/sports/team/atlanta-dream", label: "Atlanta Dream" },
    ],
    seatGeekPerformerSlugs: ["atlanta-dream"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "att-stadium",
    name: "AT&T Stadium",
    citySlug: "dallas",
    cityName: "Dallas",
    addressNote: "Arlington stadium district serving the Dallas market",
    primaryTeams: ["dallas-cowboys"],
    sportsLeagues: ["nfl"],
    description:
      "AT&T Stadium is the dominant stadium node in the Dallas market, tied to premium NFL demand and major-event weekends.",
    whyItMatters: [
      "Cowboys demand makes this one of the highest-value sports venue nodes in the country.",
      "The venue matters beyond football, which strengthens its authority-page value.",
      "Visitors need region-scale routing context here, not just city-center assumptions.",
    ],
    relatedPages: [
      { href: "/dallas", label: "Dallas hub" },
      { href: "/sports/team/dallas-cowboys", label: "Dallas Cowboys" },
    ],
    seatGeekPerformerSlugs: ["dallas-cowboys"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "american-airlines-center-dallas",
    name: "American Airlines Center",
    citySlug: "dallas",
    cityName: "Dallas",
    addressNote: "Downtown Dallas arena district",
    primaryTeams: ["dallas-mavericks", "dallas-stars"],
    sportsLeagues: ["nba", "nhl"],
    description:
      "American Airlines Center gives Dallas a shared arena node for basketball and hockey nights in the urban core.",
    whyItMatters: [
      "Shared NBA and NHL use makes this a stronger authority node than a single-team venue.",
      "Arena nights support shorter urban itineraries better than full stadium days.",
      "It creates a real downtown event anchor inside the Dallas graph.",
    ],
    relatedPages: [
      { href: "/dallas", label: "Dallas hub" },
      { href: "/sports/team/dallas-mavericks", label: "Dallas Mavericks" },
    ],
    seatGeekPerformerSlugs: ["dallas-mavericks", "dallas-stars"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "globe-life-field",
    name: "Globe Life Field",
    citySlug: "dallas",
    cityName: "Dallas",
    addressNote: "Arlington ballpark district serving the Dallas market",
    primaryTeams: ["texas-rangers"],
    sportsLeagues: ["mlb"],
    description:
      "Globe Life Field adds a major ballpark node to the Dallas market with strong seasonal and family-ticket demand.",
    whyItMatters: [
      "MLB broadens Dallas beyond football and arena demand.",
      "The Arlington cluster gives this venue more destination context than a generic ballpark page.",
      "It supports repeat seasonal discovery instead of only premium-event spikes.",
    ],
    relatedPages: [
      { href: "/dallas", label: "Dallas hub" },
      { href: "/sports/team/texas-rangers", label: "Texas Rangers" },
    ],
    seatGeekPerformerSlugs: ["texas-rangers"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "toyota-stadium-frisco",
    name: "Toyota Stadium",
    citySlug: "dallas",
    cityName: "Dallas",
    addressNote: "Frisco soccer venue serving the Dallas market",
    primaryTeams: ["fc-dallas"],
    sportsLeagues: ["mls"],
    description:
      "Toyota Stadium adds a soccer-first venue node to the Dallas market, tied to suburban match-night routing and family-friendly sports discovery.",
    whyItMatters: [
      "MLS broadens Dallas into a fuller multi-sport market.",
      "The venue’s Frisco location gives the graph useful regional detail.",
      "Soccer events fit a different buyer profile than the biggest Dallas teams.",
    ],
    relatedPages: [
      { href: "/dallas", label: "Dallas hub" },
      { href: "/sports/team/fc-dallas", label: "FC Dallas" },
    ],
    seatGeekPerformerSlugs: ["fc-dallas"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "nrg-stadium",
    name: "NRG Stadium",
    citySlug: "houston",
    cityName: "Houston",
    addressNote: "Houston stadium and event complex district",
    primaryTeams: ["houston-texans"],
    sportsLeagues: ["nfl"],
    description:
      "NRG Stadium is Houston’s dominant stadium-scale sports node, centered on football weekends and major event routing.",
    whyItMatters: [
      "Texans demand makes this a core NFL venue page in the city graph.",
      "The broader NRG complex gives it stronger area and logistics value than a simple ticket landing page.",
      "It anchors the Houston market’s largest sports-weekend behavior.",
    ],
    relatedPages: [
      { href: "/houston", label: "Houston hub" },
      { href: "/sports/team/houston-texans", label: "Houston Texans" },
    ],
    seatGeekPerformerSlugs: ["houston-texans"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "toyota-center-houston",
    name: "Toyota Center",
    citySlug: "houston",
    cityName: "Houston",
    addressNote: "Downtown Houston arena district",
    primaryTeams: ["houston-rockets"],
    sportsLeagues: ["nba"],
    description:
      "Toyota Center gives Houston a downtown arena node centered on NBA demand and event-night routing.",
    whyItMatters: [
      "Rockets games add a strong evening-ticket lane to the Houston graph.",
      "Arena routing fits downtown stays and business-travel overlap well.",
      "This venue helps Houston behave like a fuller urban sports node rather than only a stadium market.",
    ],
    relatedPages: [
      { href: "/houston", label: "Houston hub" },
      { href: "/sports/team/houston-rockets", label: "Houston Rockets" },
    ],
    seatGeekPerformerSlugs: ["houston-rockets"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "daikin-park",
    name: "Daikin Park",
    citySlug: "houston",
    cityName: "Houston",
    addressNote: "Downtown Houston ballpark district",
    primaryTeams: ["houston-astros"],
    sportsLeagues: ["mlb"],
    description:
      "Daikin Park gives Houston a central ballpark venue node tied to long-season baseball demand and repeat city visits.",
    whyItMatters: [
      "Astros demand creates a strong MLB lane in a city already rich with business and convention travel.",
      "The ballpark district adds neighborhood context beyond ticketing alone.",
      "MLB helps diversify the Houston sports graph across seasons and price bands.",
    ],
    relatedPages: [
      { href: "/houston", label: "Houston hub" },
      { href: "/sports/team/houston-astros", label: "Houston Astros" },
    ],
    seatGeekPerformerSlugs: ["houston-astros"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "shell-energy-stadium",
    name: "Shell Energy Stadium",
    citySlug: "houston",
    cityName: "Houston",
    addressNote: "East Downtown Houston soccer venue",
    primaryTeams: ["houston-dynamo-fc"],
    sportsLeagues: ["mls"],
    description:
      "Shell Energy Stadium adds a soccer-first venue node to Houston with a lighter-weight match-night product than full stadium events.",
    whyItMatters: [
      "MLS broadens the Houston sports layer beyond the biggest national leagues.",
      "East Downtown context makes this a more specific urban venue page.",
      "Soccer adds a flexible live-event product that fits more trip types.",
    ],
    relatedPages: [
      { href: "/houston", label: "Houston hub" },
      { href: "/sports/team/houston-dynamo-fc", label: "Houston Dynamo FC" },
    ],
    seatGeekPerformerSlugs: ["houston-dynamo-fc"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "lincoln-financial-field",
    name: "Lincoln Financial Field",
    citySlug: "philadelphia",
    cityName: "Philadelphia",
    addressNote: "South Philadelphia stadium complex",
    primaryTeams: ["philadelphia-eagles"],
    sportsLeagues: ["nfl"],
    description:
      "Lincoln Financial Field is the flagship Philadelphia stadium node, tied to one of the strongest NFL demand markets in the country.",
    whyItMatters: [
      "Eagles demand makes this one of the highest-value sports venue pages in the Northeast.",
      "South Philly stadium-complex context gives the page real logistics and area value.",
      "It anchors a city-wide weekend sports behavior rather than a simple one-off event pattern.",
    ],
    relatedPages: [
      { href: "/philadelphia", label: "Philadelphia hub" },
      { href: "/sports/team/philadelphia-eagles", label: "Philadelphia Eagles" },
    ],
    seatGeekPerformerSlugs: ["philadelphia-eagles"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "wells-fargo-center-philadelphia",
    name: "Wells Fargo Center",
    citySlug: "philadelphia",
    cityName: "Philadelphia",
    addressNote: "South Philadelphia arena district",
    primaryTeams: ["philadelphia-76ers", "philadelphia-flyers"],
    sportsLeagues: ["nba", "nhl"],
    description:
      "Wells Fargo Center is Philadelphia’s shared arena node for basketball and hockey nights, tying multiple leagues into one authority page.",
    whyItMatters: [
      "Shared-venue logic makes this one of the strongest arena nodes in the next expansion set.",
      "Arena-night demand gives Philadelphia more year-round sports depth than football alone.",
      "The venue sits inside a broader stadium complex, which adds area and routing value.",
    ],
    relatedPages: [
      { href: "/philadelphia", label: "Philadelphia hub" },
      { href: "/sports/team/philadelphia-76ers", label: "Philadelphia 76ers" },
    ],
    seatGeekPerformerSlugs: ["philadelphia-76ers", "philadelphia-flyers"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "citizens-bank-park",
    name: "Citizens Bank Park",
    citySlug: "philadelphia",
    cityName: "Philadelphia",
    addressNote: "South Philadelphia ballpark district",
    primaryTeams: ["philadelphia-phillies"],
    sportsLeagues: ["mlb"],
    description:
      "Citizens Bank Park adds a strong ballpark node to Philadelphia with real summer city demand and stadium-complex context.",
    whyItMatters: [
      "Phillies demand creates a valuable Northeast baseball product.",
      "The venue benefits from both ballpark identity and stadium-complex geography.",
      "MLB expands the Philadelphia sports graph across seasons and visitor types.",
    ],
    relatedPages: [
      { href: "/philadelphia", label: "Philadelphia hub" },
      { href: "/sports/team/philadelphia-phillies", label: "Philadelphia Phillies" },
    ],
    seatGeekPerformerSlugs: ["philadelphia-phillies"],
    updatedAt: "2026-03-12",
  },
  {
    slug: "subaru-park",
    name: "Subaru Park",
    citySlug: "philadelphia",
    cityName: "Philadelphia",
    addressNote: "Chester waterfront soccer venue serving the Philadelphia market",
    primaryTeams: ["philadelphia-union"],
    sportsLeagues: ["mls"],
    description:
      "Subaru Park adds a soccer-first venue node to the Philadelphia market with strong regional context outside the city core.",
    whyItMatters: [
      "MLS broadens Philadelphia into a fuller multi-sport city graph.",
      "The venue’s Chester location gives the page useful regional specificity.",
      "Soccer supports a lighter, more flexible live-event product than the largest city teams.",
    ],
    relatedPages: [
      { href: "/philadelphia", label: "Philadelphia hub" },
      { href: "/sports/team/philadelphia-union", label: "Philadelphia Union" },
    ],
    seatGeekPerformerSlugs: ["philadelphia-union"],
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
