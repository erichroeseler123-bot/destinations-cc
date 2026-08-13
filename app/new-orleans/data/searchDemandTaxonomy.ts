export type FulfillmentSource = "fareharbor" | "viator" | "getyourguide" | "direct";

export type SearchDemandFamily = {
  id: string;
  title: string;
  parentCategory: string;
  priority: 1 | 2 | 3 | 4;
  terms: string[];
  fulfillmentSources: FulfillmentSource[];
  publishPolicy: "commercial-when-matched" | "editorial-until-matched";
};

/**
 * Research-backed New Orleans tour search universe.
 *
 * Governance:
 * - This is demand/taxonomy data, not permission to publish thin SEO pages.
 * - A commercial landing page may only claim bookability when at least one
 *   real product is mapped through FareHarbor, Viator, GetYourGuide, or an
 *   approved direct operator.
 * - Unmatched demand may support genuinely useful editorial/decision content,
 *   but must not receive a fake booking CTA.
 * - Prefer one strong canonical page per distinct traveler decision over
 *   near-duplicate pages for keyword variants.
 */
export const NEW_ORLEANS_SEARCH_DEMAND: SearchDemandFamily[] = [
  {
    id: "swamp-bayou",
    title: "Swamp, Bayou & Wildlife Tours",
    parentCategory: "swamp-tours",
    priority: 1,
    terms: [
      "new orleans swamp tours", "best swamp tour new orleans", "swamp tour from new orleans",
      "louisiana swamp tour", "bayou tour new orleans", "alligator tour new orleans",
      "swamp boat tour", "covered swamp boat tour", "pontoon swamp tour", "eco swamp tour",
      "honey island swamp tour", "manchac swamp tour", "jean lafitte swamp tour",
      "private swamp tour", "swamp tour with transportation", "swamp tour without transportation",
      "swamp tour for kids", "small group swamp tour"
    ],
    fulfillmentSources: ["fareharbor", "viator", "getyourguide", "direct"],
    publishPolicy: "commercial-when-matched"
  },
  {
    id: "airboat",
    title: "Airboat Tours",
    parentCategory: "swamp-tours",
    priority: 1,
    terms: [
      "new orleans airboat tour", "best airboat tour new orleans", "small airboat tour",
      "large airboat tour", "high speed airboat", "private airboat tour",
      "airboat tour with pickup", "airboat swamp tour", "airboat vs swamp boat"
    ],
    fulfillmentSources: ["fareharbor", "viator", "getyourguide", "direct"],
    publishPolicy: "commercial-when-matched"
  },
  {
    id: "plantations",
    title: "Plantation & River Road Tours",
    parentCategory: "plantation-tours",
    priority: 1,
    terms: [
      "new orleans plantation tours", "plantation tours from new orleans", "best plantation tour new orleans",
      "whitney plantation tour", "whitney plantation with transportation", "oak alley plantation tour",
      "oak alley from new orleans", "laura plantation tour", "destrehan plantation tour",
      "houmas house tour", "plantation day trip", "plantation and swamp tour",
      "plantation and airboat tour", "whitney vs oak alley", "laura vs oak alley"
    ],
    fulfillmentSources: ["fareharbor", "viator", "getyourguide", "direct"],
    publishPolicy: "commercial-when-matched"
  },
  {
    id: "ghost-haunted",
    title: "Ghost, Haunted & Paranormal Tours",
    parentCategory: "ghost-tours",
    priority: 1,
    terms: [
      "new orleans ghost tours", "best ghost tour new orleans", "haunted tour new orleans",
      "french quarter ghost tour", "adults only ghost tour", "ghost and vampire tour",
      "ghost and voodoo tour", "haunted history tour", "paranormal tour", "ghost hunting tour",
      "haunted pub crawl", "nighttime ghost tour", "family friendly ghost tour", "true crime tour new orleans"
    ],
    fulfillmentSources: ["fareharbor", "viator", "getyourguide", "direct"],
    publishPolicy: "commercial-when-matched"
  },
  {
    id: "voodoo",
    title: "Voodoo & Folklore Tours",
    parentCategory: "ghost-tours",
    priority: 1,
    terms: [
      "new orleans voodoo tour", "voodoo history tour", "marie laveau tour", "voodoo walking tour",
      "french quarter voodoo tour", "voodoo and cemetery tour", "congo square tour", "voodoo queen tour"
    ],
    fulfillmentSources: ["viator", "getyourguide", "direct"],
    publishPolicy: "commercial-when-matched"
  },
  {
    id: "cemetery",
    title: "Cemetery Tours",
    parentCategory: "ghost-tours",
    priority: 1,
    terms: [
      "new orleans cemetery tours", "st louis cemetery no 1 tour", "st louis cemetery no 3 tour",
      "cemetery walking tour", "cemetery bus tour", "cemetery tour at night",
      "cemetery and voodoo tour", "city and cemetery tour", "garden district cemetery tour",
      "above ground cemetery tour", "marie laveau tomb tour"
    ],
    fulfillmentSources: ["viator", "getyourguide", "direct"],
    publishPolicy: "commercial-when-matched"
  },
  {
    id: "city-sightseeing",
    title: "City Sightseeing Tours",
    parentCategory: "city-tours",
    priority: 1,
    terms: [
      "new orleans city tour", "new orleans sightseeing tour", "city bus tour", "city and cemetery tour",
      "city tour with hotel pickup", "small group city tour", "private city tour",
      "new orleans highlights tour", "new orleans overview tour", "first time visitor tour",
      "hop on hop off new orleans", "new orleans bus tour", "new orleans van tour"
    ],
    fulfillmentSources: ["fareharbor", "viator", "getyourguide", "direct"],
    publishPolicy: "commercial-when-matched"
  },
  {
    id: "french-quarter",
    title: "French Quarter Tours",
    parentCategory: "city-tours",
    priority: 1,
    terms: [
      "french quarter tour", "french quarter walking tour", "french quarter history tour",
      "french quarter architecture tour", "french quarter food tour", "french quarter cocktail tour",
      "french quarter ghost tour", "french quarter private tour", "vieux carre walking tour"
    ],
    fulfillmentSources: ["viator", "getyourguide", "direct"],
    publishPolicy: "commercial-when-matched"
  },
  {
    id: "garden-district",
    title: "Garden District Tours",
    parentCategory: "city-tours",
    priority: 2,
    terms: [
      "garden district tour", "garden district walking tour", "garden district architecture tour",
      "garden district mansion tour", "garden district celebrity homes", "garden district cemetery tour",
      "garden district food tour", "garden district cocktail tour", "garden district bike tour",
      "french quarter and garden district tour"
    ],
    fulfillmentSources: ["viator", "getyourguide", "direct"],
    publishPolicy: "commercial-when-matched"
  },
  {
    id: "walking",
    title: "Walking Tours",
    parentCategory: "walking-tours",
    priority: 2,
    terms: [
      "new orleans walking tours", "best walking tour new orleans", "history walking tour",
      "architecture walking tour", "neighborhood walking tour", "french quarter walking tour",
      "garden district walking tour", "cemetery walking tour", "music walking tour",
      "food walking tour", "private walking tour"
    ],
    fulfillmentSources: ["viator", "getyourguide", "direct"],
    publishPolicy: "commercial-when-matched"
  },
  {
    id: "food",
    title: "Food Tours",
    parentCategory: "food-tours",
    priority: 1,
    terms: [
      "new orleans food tours", "best food tour new orleans", "french quarter food tour",
      "new orleans culinary tour", "creole food tour", "cajun food tour", "beignet tour",
      "gumbo tour", "food and history tour", "garden district food tour",
      "small group food tour", "private food tour", "vegan food tour"
    ],
    fulfillmentSources: ["fareharbor", "viator", "getyourguide", "direct"],
    publishPolicy: "commercial-when-matched"
  },
  {
    id: "cooking",
    title: "Cooking Classes",
    parentCategory: "food-tours",
    priority: 2,
    terms: [
      "new orleans cooking class", "cajun cooking class", "creole cooking class",
      "hands on cooking class", "new orleans school of cooking", "roux cooking class",
      "cooking class and cocktail tour"
    ],
    fulfillmentSources: ["viator", "getyourguide", "direct"],
    publishPolicy: "commercial-when-matched"
  },
  {
    id: "cocktails-bars",
    title: "Cocktail, Bar & Pub Tours",
    parentCategory: "food-tours",
    priority: 2,
    terms: [
      "new orleans cocktail tour", "french quarter cocktail tour", "cocktail walking tour",
      "new orleans pub crawl", "bourbon street pub crawl", "haunted pub crawl",
      "cocktail and food tour", "sazerac tour", "new orleans bar tour", "mixology class",
      "history of drinking tour"
    ],
    fulfillmentSources: ["viator", "getyourguide", "direct"],
    publishPolicy: "commercial-when-matched"
  },
  {
    id: "river-cruises",
    title: "Riverboat & Mississippi River Cruises",
    parentCategory: "riverboat-cruises",
    priority: 1,
    terms: [
      "new orleans riverboat cruise", "mississippi river cruise new orleans", "new orleans jazz cruise",
      "dinner cruise", "lunch cruise", "brunch cruise", "daytime cruise", "sightseeing cruise",
      "sunset cruise", "steamboat natchez", "riverboat city of new orleans", "creole queen",
      "paddlewheel cruise", "riverboat with live jazz", "riverboat with dinner", "romantic cruise new orleans"
    ],
    fulfillmentSources: ["fareharbor", "viator", "getyourguide", "direct"],
    publishPolicy: "commercial-when-matched"
  },
  {
    id: "jazz-music",
    title: "Jazz & Music Tours",
    parentCategory: "music-tours",
    priority: 2,
    terms: [
      "new orleans jazz tour", "new orleans music tour", "jazz history tour", "frenchmen street music tour",
      "live music tour", "blues tour new orleans", "louis armstrong tour", "congo square jazz tour",
      "treme music tour", "preservation hall tour"
    ],
    fulfillmentSources: ["viator", "getyourguide", "direct"],
    publishPolicy: "commercial-when-matched"
  },
  {
    id: "black-history-treme",
    title: "Black History, Creole & Treme Tours",
    parentCategory: "music-tours",
    priority: 2,
    terms: [
      "new orleans black history tour", "african american history tour new orleans", "treme tour",
      "treme walking tour", "creole history tour", "congo square history tour",
      "civil rights tour new orleans", "slavery history tour new orleans"
    ],
    fulfillmentSources: ["viator", "getyourguide", "direct"],
    publishPolicy: "commercial-when-matched"
  },
  {
    id: "katrina-ninth-ward",
    title: "Hurricane Katrina & Ninth Ward Tours",
    parentCategory: "city-tours",
    priority: 3,
    terms: [
      "hurricane katrina tour", "katrina tour new orleans", "ninth ward tour", "lower ninth ward tour",
      "levee tour new orleans", "katrina history tour", "katrina bus tour"
    ],
    fulfillmentSources: ["viator", "getyourguide", "direct"],
    publishPolicy: "commercial-when-matched"
  },
  {
    id: "mardi-gras",
    title: "Mardi Gras & Carnival Tours",
    parentCategory: "music-tours",
    priority: 3,
    terms: [
      "mardi gras tour new orleans", "mardi gras world tour", "mardi gras history tour",
      "carnival history tour", "mardi gras walking tour"
    ],
    fulfillmentSources: ["viator", "getyourguide", "direct"],
    publishPolicy: "commercial-when-matched"
  },
  {
    id: "architecture",
    title: "Architecture & Historic Homes Tours",
    parentCategory: "city-tours",
    priority: 3,
    terms: [
      "new orleans architecture tour", "french quarter architecture tour", "garden district architecture tour",
      "creole architecture tour", "historic homes tour", "mansion tour new orleans"
    ],
    fulfillmentSources: ["viator", "getyourguide", "direct"],
    publishPolicy: "commercial-when-matched"
  },
  {
    id: "lgbtq-history",
    title: "LGBTQ+ History Tours",
    parentCategory: "city-tours",
    priority: 4,
    terms: ["new orleans lgbtq history tour", "gay history tour new orleans", "queer history french quarter"],
    fulfillmentSources: ["viator", "getyourguide", "direct"],
    publishPolicy: "commercial-when-matched"
  },
  {
    id: "true-crime-vice",
    title: "True Crime, Vice & Dark History Tours",
    parentCategory: "true-crime-tours",
    priority: 3,
    terms: [
      "new orleans true crime tour", "crime tour new orleans", "storyville tour", "brothel history tour",
      "pirates tour", "privateers tour", "dark history tour"
    ],
    fulfillmentSources: ["viator", "getyourguide", "direct"],
    publishPolicy: "commercial-when-matched"
  },
  {
    id: "bike-ebike",
    title: "Bike & E-Bike Tours",
    parentCategory: "city-tours",
    priority: 3,
    terms: [
      "new orleans bike tours", "new orleans e-bike tours", "garden district bike tour",
      "french quarter bike tour", "cemetery bike tour", "culinary bike tour"
    ],
    fulfillmentSources: ["viator", "getyourguide", "direct"],
    publishPolicy: "commercial-when-matched"
  },
  {
    id: "carriage",
    title: "Carriage Tours",
    parentCategory: "city-tours",
    priority: 3,
    terms: ["new orleans carriage tours", "horse carriage french quarter", "private carriage tour"],
    fulfillmentSources: ["viator", "getyourguide", "direct"],
    publishPolicy: "commercial-when-matched"
  },
  {
    id: "helicopter-air",
    title: "Helicopter & Sightseeing Flights",
    parentCategory: "city-tours",
    priority: 4,
    terms: ["new orleans helicopter tours", "new orleans sightseeing flight", "new orleans aerial tour"],
    fulfillmentSources: ["viator", "getyourguide", "direct"],
    publishPolicy: "commercial-when-matched"
  },
  {
    id: "private-custom",
    title: "Private & Custom Tours",
    parentCategory: "private-tours",
    priority: 2,
    terms: [
      "private tours new orleans", "private city tour new orleans", "private french quarter tour",
      "custom tour new orleans", "private group tour new orleans"
    ],
    fulfillmentSources: ["viator", "getyourguide", "direct"],
    publishPolicy: "commercial-when-matched"
  }
];

export const TRAVELER_INTENT_TERMS = [
  "best tours in new orleans", "top rated tours new orleans", "cheap tours new orleans",
  "tours under 50 new orleans", "luxury tours new orleans", "small group tours new orleans",
  "family tours new orleans", "tours for kids new orleans", "adults only tours new orleans",
  "tours for seniors new orleans", "accessible tours new orleans", "wheelchair friendly tours new orleans",
  "minimal walking tours new orleans", "tours with hotel pickup new orleans",
  "tours with transportation new orleans", "new orleans tours without a car", "rainy day tours new orleans",
  "evening tours new orleans", "night tours new orleans", "morning tours new orleans",
  "tours today new orleans", "tours tonight new orleans", "tours tomorrow new orleans",
  "weekend tours new orleans", "half day tours new orleans", "full day tours new orleans",
  "2 hour tours new orleans", "3 hour tours new orleans", "4 hour tours new orleans",
  "tours before dinner new orleans", "tours after dinner new orleans", "tours for couples new orleans",
  "romantic tours new orleans", "group tours new orleans", "cruise passenger tours new orleans",
  "things to do before a cruise new orleans", "things to do after a cruise new orleans",
  "tours near french quarter", "tours near bourbon street"
] as const;
