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
