export type CityAuthorityConfig = {
  cityKey: string;
  cityName: string;
  canonicalPath: string;
  openGraphImage: string;
  updatedAt: string;
  refreshIntervalDays: number;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  heroTitle: string;
  heroDescription: string;
  pillars: string[];
  trustLine: string;
  eventVenues: string[];
  eventQueries: Array<{ label: string; query: string }>;
  festivals: string[];
  faq: Array<{ q: string; a: string }>;
  linkedPages: Array<{ href: string; label: string }>;
  structuredDataHints?: string[];
};

type CityAuthoritySeed = Omit<
  CityAuthorityConfig,
  "canonicalPath" | "openGraphImage" | "updatedAt" | "refreshIntervalDays" | "heroTitle"
> & {
  canonicalPath?: string;
  openGraphImage?: string;
  updatedAt?: string;
  refreshIntervalDays?: number;
  heroTitle?: string;
};

function defineCityAuthorityConfig(seed: CityAuthoritySeed): CityAuthorityConfig {
  return {
    canonicalPath: `/${seed.cityKey}`,
    openGraphImage: `/og/${seed.cityKey}-2026.jpg`,
    updatedAt: "2026-03-26",
    refreshIntervalDays: 45,
    heroTitle: `${seed.cityName} Travel Guide`,
    ...seed,
  };
}

export const CITY_AUTHORITY_CONFIG: Record<string, CityAuthorityConfig> = {
  "new-orleans": {
    cityKey: "new-orleans",
    cityName: "New Orleans",
    canonicalPath: "/new-orleans",
    openGraphImage: "/og/new-orleans-2026.jpg",
    updatedAt: "2026-03-11",
    refreshIntervalDays: 45,
    seoTitle: "New Orleans Travel Guide 2026 | French Quarter, Music, Food, and Logistics",
    seoDescription:
      "Plan New Orleans with practical timing, French Quarter logistics, airport transfer flow, neighborhood food routes, and live music planning.",
    keywords: [
      "new orleans travel guide",
      "things to do in new orleans",
      "new orleans itinerary",
      "french quarter guide",
      "new orleans airport to french quarter",
      "new orleans live music",
      "new orleans neighborhood guide",
    ],
    heroTitle: "New Orleans Travel Guide",
    heroDescription:
      "A practical New Orleans guide for French Quarter planning, airport-to-hotel logistics, live music planning, and food stops that fit a real day.",
    pillars: [
      "French Quarter timing + crowd windows",
      "MSY airport transfer + check-in blocks",
      "Music route planning by neighborhood",
      "Food strategy by daypart",
    ],
    trustLine: "Top-reviewed New Orleans airboat and swamp experiences for visitors planning ahead.",
    eventVenues: [
      "Smoothie King Center",
      "Caesars Superdome",
      "Saenger Theatre",
      "Orpheum Theater",
      "House of Blues New Orleans",
      "Frenchmen Street clubs",
    ],
    eventQueries: [
      { label: "New Orleans concerts this weekend", query: "new orleans concerts this weekend" },
      { label: "Frenchmen Street live music", query: "frenchmen street live music" },
      { label: "New Orleans casino shows", query: "new orleans casino shows" },
      { label: "Jazz festivals and events", query: "new orleans jazz festival events" },
      { label: "Superdome events schedule", query: "caesars superdome events" },
      { label: "Saenger Theatre shows", query: "saenger theatre new orleans shows" },
    ],
    festivals: [
      "Mardi Gras season",
      "New Orleans Jazz & Heritage Festival",
      "French Quarter Festival",
      "Essence Festival weekend",
      "Voodoo / Halloween-season event demand",
      "Holiday event calendar",
    ],
    faq: [
      {
        q: "How many days do you need in New Orleans?",
        a: "A strong first trip is 3 days: one French Quarter day, one music-focused night, and one flexible neighborhood day with buffer time.",
      },
      {
        q: "Is New Orleans walkable for visitors?",
        a: "Core visitor zones are walkable, but your day is smoother if you group activities by neighborhood and avoid crossing the city repeatedly.",
      },
      {
        q: "What is the best area to stay in New Orleans?",
        a: "For first-time visits, many travelers choose near the French Quarter or Warehouse District to reduce transfer friction and keep evenings simple.",
      },
      {
        q: "How do I get from MSY airport to the French Quarter?",
        a: "Plan a dedicated transfer block from Louis Armstrong New Orleans International Airport (MSY) to your hotel, then start your city route after check-in.",
      },
    ],
    linkedPages: [
      { href: "/mighty-argo-shuttle", label: "Argo Shuttle" },
      { href: "/vegas", label: "Vegas" },
      { href: "/alaska", label: "Alaska" },
      { href: "/cruises", label: "Cruises" },
      { href: "/national-parks", label: "National Parks Map" },
    ],
    structuredDataHints: ["Music travelers", "Food travelers", "City-break visitors"],
  },
  "las-vegas": {
    cityKey: "las-vegas",
    cityName: "Las Vegas",
    canonicalPath: "/las-vegas",
    openGraphImage: "/og/las-vegas-2026.jpg",
    updatedAt: "2026-03-11",
    refreshIntervalDays: 45,
    seoTitle: "Las Vegas Travel Guide 2026 | Grand Canyon, Hoover Dam, Shows, and Tours",
    seoDescription:
      "Plan Las Vegas with practical timing, show-night flow, Grand Canyon and Hoover Dam tour options, helicopter experiences, and cleaner logistics.",
    keywords: [
      "las vegas travel guide",
      "best tours from las vegas",
      "grand canyon tour from las vegas",
      "hoover dam tour from las vegas",
      "las vegas helicopter tour",
      "antelope canyon tour from las vegas",
      "things to do in las vegas",
    ],
    heroTitle: "Las Vegas Travel Guide",
    heroDescription:
      "A practical Vegas guide for people who want clean logistics and worthwhile experiences without overloading the schedule.",
    pillars: [
      "Show-night pacing without overbooking the day",
      "Airport arrival and hotel check-in timing",
      "Day trips from the Strip that fit a real schedule",
      "Buffer-first planning for long desert day trips",
    ],
    trustLine: "Top-reviewed Las Vegas day tours for visitors who want the strongest options first.",
    eventVenues: [
      "Sphere Las Vegas",
      "T-Mobile Arena",
      "MGM Grand Garden Arena",
      "Colosseum at Caesars Palace",
      "Allegiant Stadium",
      "Major Strip casino residencies",
    ],
    eventQueries: [
      { label: "Las Vegas concerts this weekend", query: "las vegas concerts this weekend" },
      { label: "Vegas residency shows", query: "las vegas residency shows" },
      { label: "Sphere Las Vegas events", query: "sphere las vegas events" },
      { label: "T-Mobile Arena events", query: "t mobile arena events" },
      { label: "Las Vegas festival schedule", query: "las vegas festival schedule" },
      { label: "Casino shows tonight", query: "las vegas casino shows tonight" },
    ],
    festivals: [
      "EDC Las Vegas",
      "When We Were Young Festival",
      "Life Is Beautiful cycle",
      "NFR / rodeo event windows",
      "Major fight-week demand spikes",
      "Holiday and New Year event surges",
    ],
    faq: [
      {
        q: "What are the best day tours from Las Vegas?",
        a: "The highest-demand options are usually Grand Canyon, Hoover Dam, and Antelope Canyon routes, with helicopter inventory often converting strongly for shorter stays.",
      },
      {
        q: "How many days do you need in Las Vegas?",
        a: "A common structure is 3 days: one arrival/show block, one major day tour block, and one flexible city day with lighter evening plans.",
      },
      {
        q: "Should I book tours before I arrive in Vegas?",
        a: "For top inventory and stable pricing, book key tours early and keep at least one flexible block for weather or schedule drift.",
      },
    ],
    linkedPages: [
      { href: "/mighty-argo-shuttle", label: "Argo Shuttle" },
      { href: "/alaska", label: "Alaska" },
      { href: "/cruises", label: "Cruises" },
      { href: "/national-parks", label: "National Parks Map" },
      { href: "/new-orleans", label: "New Orleans" },
    ],
    structuredDataHints: ["Tour buyers", "Entertainment travelers", "Weekend city-break visitors"],
  },
  miami: {
    cityKey: "miami",
    cityName: "Miami",
    canonicalPath: "/miami",
    openGraphImage: "/og/miami-2026.jpg",
    updatedAt: "2026-03-11",
    refreshIntervalDays: 45,
    seoTitle: "Miami Travel Guide 2026 | Everglades Airboat, Boat Tours, and Nightlife Logistics",
    seoDescription:
      "Plan Miami with practical route timing, Everglades airboat priorities, Key West day-trip options, and event-aware nightlife planning.",
    keywords: [
      "miami travel guide",
      "everglades airboat tour from miami",
      "key west day trip from miami",
      "miami boat tours",
      "things to do in miami",
      "miami nightlife tours",
    ],
    heroTitle: "Miami Travel Guide",
    heroDescription:
      "A practical Miami guide for beach, boat, and excursion planning with clearer trip structure.",
    pillars: [
      "Everglades and day-trip timing",
      "Beach + nightlife pacing",
      "Cruise and transfer windows",
      "Weather-aware planning with buffers",
    ],
    trustLine: "Top-reviewed Miami excursions for travelers planning ahead.",
    eventVenues: [
      "Kaseya Center",
      "Hard Rock Stadium",
      "LoanDepot Park",
      "Fillmore Miami Beach",
      "Miami Beach clubs and venues",
      "Downtown festival circuits",
    ],
    eventQueries: [
      { label: "Miami concerts this weekend", query: "miami concerts this weekend" },
      { label: "Miami beach club events", query: "miami beach club events tonight" },
      { label: "Kaseya Center events", query: "kaseya center events" },
      { label: "Hard Rock Stadium events", query: "hard rock stadium events miami" },
      { label: "Miami music festivals", query: "miami music festival schedule" },
      { label: "Miami nightlife shows", query: "miami nightlife shows" },
    ],
    festivals: [
      "Ultra Music Festival cycle",
      "Art Basel demand windows",
      "Miami Music Week",
      "South Beach seasonal peaks",
      "Holiday and New Year event surges",
      "Major sports-event weekends",
    ],
    faq: [
      {
        q: "What are the best tours from Miami?",
        a: "High-demand categories usually include Everglades airboat tours, Key West day trips, Biscayne Bay boat tours, and skyline/night cruise options.",
      },
      {
        q: "How many days should I spend in Miami?",
        a: "A typical first trip works well with 3 days: one city/beach day, one excursion day, and one nightlife-focused evening block.",
      },
      {
        q: "Should I book Miami tours ahead of time?",
        a: "For top inventory and cleaner pricing, reserve key excursions early and keep one buffer window for weather or traffic changes.",
      },
    ],
    linkedPages: [
      { href: "/cruises", label: "Cruises" },
      { href: "/alaska", label: "Alaska" },
      { href: "/vegas", label: "Vegas" },
      { href: "/new-orleans", label: "New Orleans" },
      { href: "/national-parks", label: "National Parks Map" },
    ],
    structuredDataHints: ["Beach travelers", "Excursion buyers", "Nightlife travelers"],
  },
  nashville: {
    cityKey: "nashville",
    cityName: "Nashville",
    canonicalPath: "/nashville",
    openGraphImage: "/og/nashville-2026.jpg",
    updatedAt: "2026-03-11",
    refreshIntervalDays: 45,
    seoTitle: "Nashville Travel Guide 2026 | Broadway, Music Tours, and Nightlife Logistics",
    seoDescription:
      "Plan Nashville with practical Broadway timing, live-music planning, distillery tour priorities, and clearer logistics.",
    keywords: [
      "nashville travel guide",
      "things to do in nashville",
      "nashville broadway tours",
      "nashville music tours",
      "nashville distillery tours",
      "nashville nightlife tours",
    ],
    heroTitle: "Nashville Travel Guide",
    heroDescription:
      "A practical Nashville guide for Broadway timing, music discovery, and experience booking without schedule chaos.",
    pillars: [
      "Broadway live-music pacing",
      "Day-to-night planning with buffer time",
      "Music history and neighborhood clusters",
      "Tour categories with high booking intent",
    ],
    trustLine: "Top-reviewed Nashville experiences for music-focused travelers.",
    eventVenues: [
      "Bridgestone Arena",
      "Ryman Auditorium",
      "Ascend Amphitheater",
      "Nissan Stadium",
      "Broadway venue corridor",
      "East Nashville live-music venues",
    ],
    eventQueries: [
      { label: "Nashville concerts this weekend", query: "nashville concerts this weekend" },
      { label: "Ryman Auditorium schedule", query: "ryman auditorium events" },
      { label: "Broadway live music tonight", query: "broadway nashville live music tonight" },
      { label: "Bridgestone Arena events", query: "bridgestone arena events" },
      { label: "Nashville festivals", query: "nashville festival schedule" },
      { label: "Country music shows", query: "nashville country music shows" },
    ],
    festivals: [
      "CMA Fest cycle",
      "Bonnaroo demand bleed into Nashville",
      "Americanafest",
      "Tin Pan South",
      "Holiday and New Year event spikes",
      "Major touring-season weekends",
    ],
    faq: [
      {
        q: "What are the best tours in Nashville?",
        a: "Top categories are usually Broadway nightlife routes, country-music history tours, distillery experiences, and party transport options.",
      },
      {
        q: "How many days do you need in Nashville?",
        a: "A common first trip works in 2 to 3 days with one music-history day, one Broadway night block, and one flexible daytime experience.",
      },
      {
        q: "Should I plan Broadway and tours on the same day?",
        a: "You can, but the trip usually works better when you protect one clean evening block for live music without overloading the daytime plan.",
      },
    ],
    linkedPages: [
      { href: "/vegas", label: "Vegas" },
      { href: "/new-orleans", label: "New Orleans" },
      { href: "/miami", label: "Miami" },
      { href: "/cruises", label: "Cruises" },
      { href: "/national-parks", label: "National Parks Map" },
    ],
    structuredDataHints: ["Music travelers", "Nightlife travelers", "Weekend city-break visitors"],
  },
  orlando: defineCityAuthorityConfig({
    cityKey: "orlando",
    cityName: "Orlando",
    seoTitle: "Orlando Travel Guide 2026 | Airboat Tours, Family Planning, and Beyond-the-Parks Logistics",
    seoDescription:
      "Plan Orlando with cleaner theme-park alternatives, airboat priorities, resort-to-attraction routing, and family-friendly day structure.",
    keywords: [
      "orlando travel guide",
      "things to do in orlando",
      "orlando airboat tours",
      "orlando family activities",
      "orlando beyond the parks",
      "orlando day trips",
    ],
    heroDescription:
      "A practical Orlando guide for visitors balancing resort time, family attractions, airboat tours, and smoother city routing.",
    pillars: [
      "Theme-park alternative planning with lower-friction blocks",
      "Resort to attraction routing and midday reset windows",
      "Convention, arena, and family demand overlap",
      "Wetland and coast-side excursions that justify a half-day block",
    ],
    trustLine: "High-intent Orlando experiences for travelers who want stronger trip structure before they arrive.",
    eventVenues: [
      "Kia Center",
      "Dr. Phillips Center for the Performing Arts",
      "Orange County Convention Center",
      "Camping World Stadium",
      "International Drive attraction corridor",
      "Disney Springs and resort event spillover",
    ],
    eventQueries: [
      { label: "Orlando concerts this weekend", query: "orlando concerts this weekend" },
      { label: "Kia Center events", query: "kia center events orlando" },
      { label: "Dr. Phillips Center schedule", query: "dr phillips center events" },
      { label: "Orange County Convention Center schedule", query: "orange county convention center events" },
      { label: "International Drive events", query: "international drive orlando events" },
      { label: "Orlando family event calendar", query: "orlando family events this weekend" },
    ],
    festivals: [
      "EPCOT festival demand windows",
      "Holiday and spring-break family surges",
      "MegaCon and convention-heavy weekends",
      "Major arena concert blocks",
      "Halloween-season after-dark demand",
      "Summer resort and water-activity peaks",
    ],
    faq: [
      {
        q: "What should you do in Orlando besides theme parks?",
        a: "Many visitors balance park days with airboat rides, downtown dining, show nights, outlet blocks, and shorter excursions that reduce all-day queue fatigue.",
      },
      {
        q: "How many days should you spend in Orlando?",
        a: "A strong first trip is usually 3 to 5 days depending on how many park days, rest windows, and off-property experiences you want to fit in.",
      },
      {
        q: "Should you plan Orlando day by day?",
        a: "Yes. Orlando works better when you separate park-heavy days, indoor resets, and traffic-sensitive dinner or event blocks instead of improvising every transfer.",
      },
    ],
    linkedPages: [
      { href: "/miami", label: "Miami" },
      { href: "/new-orleans", label: "New Orleans" },
      { href: "/vegas", label: "Vegas" },
      { href: "/cruises", label: "Cruises" },
      { href: "/national-parks", label: "National Parks Map" },
    ],
    structuredDataHints: ["Family travelers", "Resort travelers", "Convention visitors"],
  }),
  "los-angeles": defineCityAuthorityConfig({
    cityKey: "los-angeles",
    cityName: "Los Angeles",
    seoTitle: "Los Angeles Travel Guide 2026 | Studio Tours, Hollywood Planning, and Event Logistics",
    seoDescription:
      "Plan Los Angeles with stronger neighborhood pacing, studio-tour priorities, arena-night routing, and realistic cross-city travel blocks.",
    keywords: [
      "los angeles travel guide",
      "things to do in los angeles",
      "los angeles studio tours",
      "hollywood tours los angeles",
      "los angeles concerts",
      "los angeles itinerary",
    ],
    heroDescription:
      "A practical Los Angeles guide for visitors who need cleaner neighborhood sequencing, entertainment planning, and less wasted transit time.",
    pillars: [
      "Sprawl-aware routing instead of overpacked city days",
      "Studio tours, Hollywood, and arena-night blocks",
      "Beach, dining, and show planning with realistic transfer times",
      "Event-driven traffic pressure around downtown and Hollywood",
    ],
    trustLine: "High-intent Los Angeles experiences for visitors who want cleaner planning across a sprawling city.",
    eventVenues: [
      "Crypto.com Arena",
      "Peacock Theater",
      "Hollywood Bowl",
      "Dodger Stadium",
      "SoFi-adjacent spillover demand",
      "Broad Hollywood premiere and live-event corridors",
    ],
    eventQueries: [
      { label: "Los Angeles concerts this weekend", query: "los angeles concerts this weekend" },
      { label: "Crypto.com Arena events", query: "crypto com arena events" },
      { label: "Hollywood Bowl schedule", query: "hollywood bowl events" },
      { label: "LA theater schedule", query: "los angeles theater schedule" },
      { label: "Downtown LA events tonight", query: "downtown la events tonight" },
      { label: "Hollywood events tonight", query: "hollywood los angeles events tonight" },
    ],
    festivals: [
      "Awards-season travel spikes",
      "Major summer concert runs",
      "Holiday and New Year event surges",
      "Anime Expo and convention-heavy weekends",
      "Pride and marquee civic-event weekends",
      "Film-premiere and studio press cycles",
    ],
    faq: [
      {
        q: "How many days do you need in Los Angeles?",
        a: "A practical first trip is usually 4 to 5 days because the city works better when you group neighborhoods instead of trying to cross town multiple times in one day.",
      },
      {
        q: "What are the best tours in Los Angeles?",
        a: "Studio tours, Hollywood sightseeing, food-focused neighborhood tours, and a single beach or coastal block usually give first-time visitors the best range.",
      },
      {
        q: "Should you stay in one part of Los Angeles?",
        a: "Often yes. LA planning improves when you anchor around your highest-priority neighborhoods and accept that not every major sight belongs in the same day.",
      },
    ],
    linkedPages: [
      { href: "/vegas", label: "Vegas" },
      { href: "/miami", label: "Miami" },
      { href: "/new-orleans", label: "New Orleans" },
      { href: "/cruises", label: "Cruises" },
      { href: "/national-parks", label: "National Parks Map" },
    ],
    structuredDataHints: ["Entertainment travelers", "Weekend city-break visitors", "First-time California visitors"],
  }),
  "san-francisco": defineCityAuthorityConfig({
    cityKey: "san-francisco",
    cityName: "San Francisco",
    seoTitle: "San Francisco Travel Guide 2026 | Alcatraz, Bay Routing, and Day-Trip Planning",
    seoDescription:
      "Plan San Francisco with stronger waterfront routing, Alcatraz-first booking logic, hill-aware neighborhood pacing, and cleaner day-trip structure.",
    keywords: [
      "san francisco travel guide",
      "things to do in san francisco",
      "san francisco alcatraz tours",
      "san francisco bay cruise",
      "san francisco day trips",
      "san francisco itinerary",
    ],
    heroDescription:
      "A practical San Francisco guide for waterfront planning, city hills, day-trip decisions, and cleaner attraction sequencing.",
    pillars: [
      "Alcatraz and bay inventory that needs early planning",
      "Waterfront, market, and North Beach sequencing",
      "Steep-terrain routing and transit-aware pacing",
      "Wine-country and regional day-trip blocks that fit a city stay",
    ],
    trustLine: "High-intent San Francisco experiences for visitors who want stronger bay, city, and day-trip planning.",
    eventVenues: [
      "Chase Center",
      "The Masonic",
      "Oracle Park",
      "Ferry Building waterfront corridor",
      "Palace of Fine Arts event demand",
      "Downtown and Union Square live-event spillover",
    ],
    eventQueries: [
      { label: "San Francisco concerts this weekend", query: "san francisco concerts this weekend" },
      { label: "Chase Center events", query: "chase center events san francisco" },
      { label: "San Francisco bay events", query: "san francisco waterfront events" },
      { label: "Union Square events", query: "union square san francisco events" },
      { label: "North Beach live music", query: "north beach san francisco live music" },
      { label: "Alcatraz tickets", query: "alcatraz tickets san francisco" },
    ],
    festivals: [
      "Fleet Week demand spikes",
      "Pride and major civic-event weekends",
      "Outside Lands travel overlap",
      "Holiday waterfront traffic",
      "Convention and tech-event surges",
      "Peak wine-country excursion season",
    ],
    faq: [
      {
        q: "What are the best things to book first in San Francisco?",
        a: "Alcatraz, major bay tours, and any wine-country day trip usually deserve the earliest booking attention because they shape the rest of the itinerary.",
      },
      {
        q: "How many days should you spend in San Francisco?",
        a: "Three to four days is a strong first trip if you want a mix of core city sights, one bay activity, and one full-day regional escape.",
      },
      {
        q: "Is San Francisco easy to do without a car?",
        a: "For many visitors yes, but the city works best when you respect hills, transit gaps, and the time cost of jumping between neighborhoods too often.",
      },
    ],
    linkedPages: [
      { href: "/vegas", label: "Vegas" },
      { href: "/seattle", label: "Seattle" },
      { href: "/los-angeles", label: "Los Angeles" },
      { href: "/cruises", label: "Cruises" },
      { href: "/national-parks", label: "National Parks Map" },
    ],
    structuredDataHints: ["Bay travelers", "Day-trip buyers", "First-time California visitors"],
  }),
  "san-diego": defineCityAuthorityConfig({
    cityKey: "san-diego",
    cityName: "San Diego",
    seoTitle: "San Diego Travel Guide 2026 | Harbor Cruises, Beaches, and Convention-Aware Planning",
    seoDescription:
      "Plan San Diego with stronger harbor routing, beach-to-downtown pacing, whale-watching priorities, and convention-aware timing.",
    keywords: [
      "san diego travel guide",
      "things to do in san diego",
      "san diego harbor cruises",
      "san diego whale watching",
      "san diego beaches",
      "san diego itinerary",
    ],
    heroDescription:
      "A practical San Diego guide for harbor routes, family attractions, beach planning, and city-center event timing.",
    pillars: [
      "Harbor, Gaslamp, and beach sequencing",
      "Zoo, waterfront, and family-demand planning",
      "Convention and stadium pressure around downtown",
      "Whale-watching and bay activity blocks that fit a real stay",
    ],
    trustLine: "High-intent San Diego experiences for visitors who want cleaner harbor, beach, and event planning.",
    eventVenues: [
      "Petco Park",
      "San Diego Convention Center",
      "The Shell",
      "Waterfront harbor cruise corridor",
      "Gaslamp nightlife blocks",
      "Balboa Park event spillover",
    ],
    eventQueries: [
      { label: "San Diego concerts this weekend", query: "san diego concerts this weekend" },
      { label: "Petco Park events", query: "petco park events" },
      { label: "San Diego Convention Center schedule", query: "san diego convention center events" },
      { label: "Gaslamp events tonight", query: "gaslamp san diego events tonight" },
      { label: "San Diego harbor cruises", query: "san diego harbor cruise" },
      { label: "San Diego whale watching", query: "san diego whale watching" },
    ],
    festivals: [
      "Comic-Con and convention surges",
      "Summer waterfront demand",
      "Holiday harbor-lighting cycles",
      "Peak whale-watching windows",
      "Major baseball weekends",
      "Spring-break and family-travel spikes",
    ],
    faq: [
      {
        q: "What are the best tours in San Diego?",
        a: "Harbor cruises, whale watching, zoo-adjacent planning, waterfront sightseeing, and one beach or neighborhood block usually give first-time visitors the strongest mix.",
      },
      {
        q: "How many days should you spend in San Diego?",
        a: "Three to four days works well if you want one harbor day, one family or attraction day, one beach block, and some flexibility for downtown events.",
      },
      {
        q: "Should you stay near downtown or the beach in San Diego?",
        a: "Downtown often works best for event access and transit, while beach stays feel slower and more leisure-first. The right answer depends on whether harbor and event planning matter more than sand time.",
      },
    ],
    linkedPages: [
      { href: "/los-angeles", label: "Los Angeles" },
      { href: "/vegas", label: "Vegas" },
      { href: "/miami", label: "Miami" },
      { href: "/cruises", label: "Cruises" },
      { href: "/national-parks", label: "National Parks Map" },
    ],
    structuredDataHints: ["Beach travelers", "Cruise-adjacent visitors", "Family travelers"],
  }),
  branson: defineCityAuthorityConfig({
    cityKey: "branson",
    cityName: "Branson",
    seoTitle: "Branson Travel Guide 2026 | Shows, Family Attractions, and Strip Planning",
    seoDescription:
      "Plan Branson with stronger show-night pacing, Highway 76 Strip routing, family-attraction prioritization, and lake-adjacent trip structure.",
    keywords: [
      "branson travel guide",
      "things to do in branson",
      "branson shows",
      "branson family attractions",
      "branson strip planning",
      "branson itinerary",
    ],
    heroDescription:
      "A practical Branson guide for show timing, family attraction stacking, and reducing back-and-forth across the Strip.",
    pillars: [
      "Show-first evening planning on Highway 76",
      "Family attraction sequencing without overload",
      "Branson Landing and Strip routing",
      "Lake activity blocks that add range to a show-heavy stay",
    ],
    trustLine: "High-intent Branson experiences for visitors planning around shows, family time, and cleaner daily routing.",
    eventVenues: [
      "Dolly Parton's Stampede",
      "Sight & Sound Theatre",
      "Branson Convention Center",
      "Highway 76 theater corridor",
      "Branson Landing live-event blocks",
      "Table Rock Lake seasonal spillover",
    ],
    eventQueries: [
      { label: "Branson shows this weekend", query: "branson shows this weekend" },
      { label: "Branson theater schedule", query: "branson theater schedule" },
      { label: "Branson family attractions", query: "branson family attractions" },
      { label: "Highway 76 traffic", query: "highway 76 branson traffic tonight" },
      { label: "Branson Landing events", query: "branson landing events" },
      { label: "Table Rock Lake activities", query: "table rock lake activities branson" },
    ],
    festivals: [
      "Peak summer family-travel season",
      "Holiday lights and Christmas-show demand",
      "Spring-break family surges",
      "Fall foliage and coach-tour traffic",
      "Major theater opening windows",
      "Lake-season weekend demand",
    ],
    faq: [
      {
        q: "What are the best things to do in Branson?",
        a: "Most first-time visitors build around one or two headline shows, a family attraction block, and either Branson Landing or a lake-focused half day.",
      },
      {
        q: "How many days should you spend in Branson?",
        a: "Two to three days is usually enough for a strong first trip if you want a mix of shows, family attractions, and one lighter sightseeing block.",
      },
      {
        q: "Should you stay on the Strip in Branson?",
        a: "Often yes, especially if show access matters. It reduces transfer friction and makes it easier to avoid wasting time in Highway 76 traffic.",
      },
    ],
    linkedPages: [
      { href: "/new-orleans", label: "New Orleans" },
      { href: "/vegas", label: "Vegas" },
      { href: "/nashville", label: "Nashville" },
      { href: "/cruises", label: "Cruises" },
      { href: "/national-parks", label: "National Parks Map" },
    ],
    structuredDataHints: ["Family travelers", "Show-market visitors", "Drive-market weekend visitors"],
  }),
  "wisconsin-dells": defineCityAuthorityConfig({
    cityKey: "wisconsin-dells",
    cityName: "Wisconsin Dells",
    seoTitle: "Wisconsin Dells Travel Guide 2026 | Waterparks, Boat Rides, and Family Routing",
    seoDescription:
      "Plan Wisconsin Dells with stronger waterpark pacing, downtown boat-tour routing, family demand management, and resort-area trip structure.",
    keywords: [
      "wisconsin dells travel guide",
      "things to do in wisconsin dells",
      "wisconsin dells waterparks",
      "wisconsin dells boat tours",
      "wisconsin dells family attractions",
      "wisconsin dells itinerary",
    ],
    heroDescription:
      "A practical Wisconsin Dells guide for waterpark-heavy trips, family attraction balance, and lower-friction district planning.",
    pillars: [
      "Waterpark planning with realistic rest windows",
      "Downtown Dells and Parkway attraction sequencing",
      "Boat tours and scenic river blocks",
      "Family-demand spikes that affect parking and meal timing",
    ],
    trustLine: "High-intent Wisconsin Dells experiences for families who want cleaner waterpark and sightseeing planning.",
    eventVenues: [
      "Noah's Ark Waterpark",
      "Mt. Olympus Water & Theme Park",
      "Upper Dells boat-tour corridor",
      "Downtown Dells entertainment blocks",
      "Resort-heavy Parkway demand",
      "Seasonal family-event weekends",
    ],
    eventQueries: [
      { label: "Wisconsin Dells things to do", query: "wisconsin dells things to do" },
      { label: "Wisconsin Dells waterparks", query: "wisconsin dells waterparks" },
      { label: "Wisconsin Dells boat tours", query: "wisconsin dells boat tours" },
      { label: "Downtown Dells events", query: "downtown wisconsin dells events" },
      { label: "Wisconsin Dells family attractions", query: "wisconsin dells family attractions" },
      { label: "Dells Parkway traffic", query: "wisconsin dells parkway traffic" },
    ],
    festivals: [
      "Peak summer family-travel season",
      "Holiday indoor-waterpark demand",
      "Spring-break family surges",
      "Labor Day and long-weekend pressure",
      "Weekend coach and drive-market spikes",
      "Warm-weather river and boat-tour peaks",
    ],
    faq: [
      {
        q: "What are the best things to do in Wisconsin Dells besides waterparks?",
        a: "Boat rides, scenic river routes, downtown attractions, and a lighter evening dining block usually make the trip feel more balanced.",
      },
      {
        q: "How many days should you spend in Wisconsin Dells?",
        a: "Two to three days is a practical first trip if you want one or two major waterpark blocks plus some scenic or downtown time.",
      },
      {
        q: "Should you plan waterparks every day in Wisconsin Dells?",
        a: "Usually no. The trip tends to work better when you mix one heavy activity day with a lighter sightseeing or downtown block.",
      },
    ],
    linkedPages: [
      { href: "/chicago", label: "Chicago" },
      { href: "/nashville", label: "Nashville" },
      { href: "/new-orleans", label: "New Orleans" },
      { href: "/cruises", label: "Cruises" },
      { href: "/national-parks", label: "National Parks Map" },
    ],
    structuredDataHints: ["Family travelers", "Drive-market visitors", "Water-activity planners"],
  }),
  "pigeon-forge": defineCityAuthorityConfig({
    cityKey: "pigeon-forge",
    cityName: "Pigeon Forge",
    seoTitle: "Pigeon Forge Travel Guide 2026 | Smoky Mountains Access, Shows, and Family Planning",
    seoDescription:
      "Plan Pigeon Forge with cleaner Parkway routing, Smoky Mountains day structure, family-attraction pacing, and dinner-theater timing.",
    keywords: [
      "pigeon forge travel guide",
      "things to do in pigeon forge",
      "pigeon forge shows",
      "smoky mountains from pigeon forge",
      "pigeon forge family attractions",
      "pigeon forge itinerary",
    ],
    heroDescription:
      "A practical Pigeon Forge guide for balancing Parkway attractions, Smoky Mountain access, and family-friendly evening planning.",
    pillars: [
      "Parkway traffic-aware trip structure",
      "Smoky Mountains access and day-trip buffers",
      "Dinner theaters, family entertainment, and evening pacing",
      "Separating ride-heavy blocks from slower scenic days",
    ],
    trustLine: "High-intent Pigeon Forge experiences for visitors balancing family attractions, shows, and mountain access.",
    eventVenues: [
      "Dollywood",
      "LeConte Center at Pigeon Forge",
      "The Island in Pigeon Forge",
      "Dinner-theater corridor",
      "Parkway traffic pressure zones",
      "Smoky Mountains gateway demand",
    ],
    eventQueries: [
      { label: "Pigeon Forge things to do", query: "pigeon forge things to do" },
      { label: "Pigeon Forge shows", query: "pigeon forge shows" },
      { label: "Dollywood hours and events", query: "dollywood hours events" },
      { label: "Smoky Mountains from Pigeon Forge", query: "smoky mountains day trip from pigeon forge" },
      { label: "Pigeon Forge dinner shows", query: "pigeon forge dinner shows" },
      { label: "Parkway traffic tonight", query: "pigeon forge parkway traffic tonight" },
    ],
    festivals: [
      "Peak summer family-travel season",
      "Holiday lights and winter-event demand",
      "Spring-break and school-break surges",
      "Dollywood seasonal festivals",
      "Fall foliage drive-market peaks",
      "Long-weekend cabin and resort demand",
    ],
    faq: [
      {
        q: "What are the best things to do in Pigeon Forge?",
        a: "Most first-time visitors pair one major attraction block like Dollywood with one mountain-access day and one flexible evening around shows or dinner theaters.",
      },
      {
        q: "How many days should you spend in Pigeon Forge?",
        a: "Three days is a strong first trip if you want time for attractions, mountain scenery, and at least one slower family evening.",
      },
      {
        q: "Is Pigeon Forge or Gatlinburg better for first-time visitors?",
        a: "Pigeon Forge often works better for larger attractions and easier parking, while Gatlinburg feels more compact. The best choice depends on whether you want rides and shows or a tighter walkable core.",
      },
    ],
    linkedPages: [
      { href: "/nashville", label: "Nashville" },
      { href: "/new-orleans", label: "New Orleans" },
      { href: "/vegas", label: "Vegas" },
      { href: "/cruises", label: "Cruises" },
      { href: "/national-parks", label: "National Parks Map" },
    ],
    structuredDataHints: ["Family travelers", "Drive-market visitors", "Mountain gateway visitors"],
  }),
  "washington-dc": defineCityAuthorityConfig({
    cityKey: "washington-dc",
    cityName: "Washington, DC",
    seoTitle: "Washington, DC Travel Guide 2026 | Monuments, Museums, and Event-Aware Routing",
    seoDescription:
      "Plan Washington, DC with stronger monument sequencing, museum-day pacing, Wharf and arena event timing, and practical city routing.",
    keywords: [
      "washington dc travel guide",
      "things to do in washington dc",
      "washington dc museums",
      "washington dc monuments",
      "washington dc itinerary",
      "washington dc events",
    ],
    heroDescription:
      "A practical Washington guide for museum-heavy days, monument routing, and downtown event awareness that keeps the trip cleaner.",
    pillars: [
      "Monument and museum sequencing that respects walking load",
      "Arena nights, Wharf events, and city-center pressure",
      "Separating civic-core days from neighborhood dining blocks",
      "Seasonal crowd management around the Mall",
    ],
    trustLine: "High-intent Washington experiences for visitors who want stronger museum, monument, and event planning.",
    eventVenues: [
      "Capital One Arena",
      "The Anthem",
      "The Wharf",
      "National Mall event perimeter",
      "Kennedy Center demand blocks",
      "Convention-center spillover",
    ],
    eventQueries: [
      { label: "Washington DC events this weekend", query: "washington dc events this weekend" },
      { label: "Capital One Arena schedule", query: "capital one arena events" },
      { label: "The Anthem schedule", query: "the anthem dc events" },
      { label: "National Mall events", query: "national mall events washington dc" },
      { label: "Washington museum hours", query: "smithsonian museum hours washington dc" },
      { label: "Wharf DC events", query: "the wharf dc events" },
    ],
    festivals: [
      "Cherry Blossom season",
      "Holiday civic-event calendar",
      "Peak museum and school-break demand",
      "Major protest and civic-event routing pressure",
      "Summer family-travel season",
      "Arena and convention-heavy weekends",
    ],
    faq: [
      {
        q: "How many days do you need in Washington, DC?",
        a: "Three to four days is a strong first trip if you want one museum-heavy day, one monument day, and room for a neighborhood or event-focused evening.",
      },
      {
        q: "What is the best way to plan Washington, DC attractions?",
        a: "Group by geography. DC gets much easier when you cluster the National Mall, arena district, and waterfront instead of zig-zagging all day.",
      },
      {
        q: "Are Washington, DC museums free?",
        a: "Many Smithsonian museums are free, but the real planning challenge is timing, walking load, and making sure you do not overload one day.",
      },
    ],
    linkedPages: [
      { href: "/boston", label: "Boston" },
      { href: "/new-orleans", label: "New Orleans" },
      { href: "/miami", label: "Miami" },
      { href: "/cruises", label: "Cruises" },
      { href: "/national-parks", label: "National Parks Map" },
    ],
    structuredDataHints: ["Museum travelers", "Civic tourism visitors", "Weekend city-break visitors"],
  }),
  boston: defineCityAuthorityConfig({
    cityKey: "boston",
    cityName: "Boston",
    seoTitle: "Boston Travel Guide 2026 | Freedom Trail, Harbor Planning, and Compact-City Routing",
    seoDescription:
      "Plan Boston with stronger Freedom Trail pacing, harbor-day structure, event-aware downtown routing, and practical neighborhood sequencing.",
    keywords: [
      "boston travel guide",
      "things to do in boston",
      "boston freedom trail",
      "boston harbor cruises",
      "boston itinerary",
      "boston events",
    ],
    heroDescription:
      "A practical Boston guide for history-heavy city breaks, harbor activity, sports-event timing, and cleaner walkable routing.",
    pillars: [
      "Freedom Trail and historic-core pacing",
      "Harbor and Seaport blocks that fit a compact stay",
      "Garden nights, theater timing, and convention spillover",
      "Food and neighborhood planning without overpacking the day",
    ],
    trustLine: "High-intent Boston experiences for visitors who want stronger history, harbor, and event planning.",
    eventVenues: [
      "TD Garden",
      "Citizens Opera House",
      "Fenway-adjacent spillover demand",
      "Boston Convention and Exhibition Center",
      "Seaport waterfront event blocks",
      "Historic-core festival weekends",
    ],
    eventQueries: [
      { label: "Boston concerts this weekend", query: "boston concerts this weekend" },
      { label: "TD Garden events", query: "td garden events" },
      { label: "Boston harbor cruises", query: "boston harbor cruise" },
      { label: "Boston theater schedule", query: "boston theater schedule" },
      { label: "Seaport Boston events", query: "seaport boston events" },
      { label: "Freedom Trail tours", query: "freedom trail tours boston" },
    ],
    festivals: [
      "Marathon weekend demand spikes",
      "Holiday market and winter event blocks",
      "Peak summer history-tour season",
      "College move-in and fall travel pressure",
      "Major sports-event weekends",
      "Seaport convention surges",
    ],
    faq: [
      {
        q: "How many days should you spend in Boston?",
        a: "Two to three days is enough for a strong first trip if you want one history-heavy day, one harbor or neighborhood day, and room for an evening event block.",
      },
      {
        q: "What are the best tours in Boston?",
        a: "Freedom Trail routes, harbor cruises, neighborhood food walks, and one sports or museum block usually give first-time visitors the best spread.",
      },
      {
        q: "Is Boston walkable for visitors?",
        a: "Yes, but it still helps to cluster downtown, Back Bay, and Seaport activity by day so you do not burn time on unnecessary backtracking.",
      },
    ],
    linkedPages: [
      { href: "/washington-dc", label: "Washington, DC" },
      { href: "/new-orleans", label: "New Orleans" },
      { href: "/miami", label: "Miami" },
      { href: "/cruises", label: "Cruises" },
      { href: "/national-parks", label: "National Parks Map" },
    ],
    structuredDataHints: ["History travelers", "Sports-travel visitors", "Weekend city-break visitors"],
  }),
  seattle: defineCityAuthorityConfig({
    cityKey: "seattle",
    cityName: "Seattle",
    seoTitle: "Seattle Travel Guide 2026 | Pike Place, Harbor Planning, and Day-Trip Structure",
    seoDescription:
      "Plan Seattle with stronger waterfront routing, Pike Place pacing, arena-night awareness, and clearer mountain or island day-trip structure.",
    keywords: [
      "seattle travel guide",
      "things to do in seattle",
      "seattle pike place",
      "seattle harbor cruise",
      "seattle day trips",
      "seattle itinerary",
    ],
    heroDescription:
      "A practical Seattle guide for waterfront planning, neighborhood pacing, arena nights, and cleaner regional day-trip decisions.",
    pillars: [
      "Pike Place and waterfront sequencing without crowd overload",
      "Arena nights and event-aware downtown planning",
      "Capitol Hill, market, and bay routing",
      "Mountains, islands, and ferry-linked day-trip logic",
    ],
    trustLine: "High-intent Seattle experiences for visitors who want stronger waterfront, event, and day-trip planning.",
    eventVenues: [
      "Climate Pledge Arena",
      "Neumos",
      "Seattle waterfront attraction corridor",
      "Pike Place crowd blocks",
      "Lumen and T-Mobile spillover demand",
      "Convention-center event weekends",
    ],
    eventQueries: [
      { label: "Seattle concerts this weekend", query: "seattle concerts this weekend" },
      { label: "Climate Pledge Arena events", query: "climate pledge arena events" },
      { label: "Pike Place events", query: "pike place events seattle" },
      { label: "Seattle waterfront tours", query: "seattle waterfront tours" },
      { label: "Seattle day trips", query: "day trips from seattle" },
      { label: "Capitol Hill live music", query: "capitol hill seattle live music" },
    ],
    festivals: [
      "Peak summer waterfront season",
      "Holiday market and light-event demand",
      "Cruise-season city spillover",
      "Major concert weekends",
      "Cherry blossom and spring-travel demand",
      "Mountain day-trip peak season",
    ],
    faq: [
      {
        q: "How many days should you spend in Seattle?",
        a: "Three days works well for a first trip if you want one waterfront day, one neighborhood or market day, and one full-day regional escape.",
      },
      {
        q: "What are the best tours in Seattle?",
        a: "Waterfront cruises, market-focused walks, day trips to the mountains or islands, and one evening live-music or arena block usually create the best mix.",
      },
      {
        q: "Should you rent a car in Seattle?",
        a: "Not always. Many visitors do well without one in the core city, then use a dedicated day-trip solution only on the day they leave the city center.",
      },
    ],
    linkedPages: [
      { href: "/san-francisco", label: "San Francisco" },
      { href: "/boston", label: "Boston" },
      { href: "/miami", label: "Miami" },
      { href: "/cruises", label: "Cruises" },
      { href: "/national-parks", label: "National Parks Map" },
    ],
    structuredDataHints: ["Waterfront travelers", "Day-trip buyers", "Weekend city-break visitors"],
  }),
};

export function getCityAuthorityConfig(cityKey: string): CityAuthorityConfig | null {
  return CITY_AUTHORITY_CONFIG[cityKey] || null;
}
