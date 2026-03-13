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
      "A practical New Orleans guide for French Quarter planning, airport-to-hotel logistics, live music routing, and food blocks that actually fit a real day.",
    pillars: [
      "French Quarter timing + crowd windows",
      "MSY airport transfer + check-in blocks",
      "Music route planning by neighborhood",
      "Food strategy by daypart",
    ],
    trustLine: "Top-reviewed New Orleans airboat and swamp experiences, prioritized for conversion intent.",
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
      "Plan Las Vegas with practical timing, show-night flow, Grand Canyon and Hoover Dam tour options, helicopter experiences, and route-first logistics.",
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
      "A conversion-first Vegas guide for people who want clean logistics and high-value experiences without breaking their schedule.",
    pillars: [
      "Show-night pacing without overbooking the day",
      "Airport arrival and hotel check-in timing",
      "High-value day tour routing from the Strip",
      "Buffer-first planning for long desert day trips",
    ],
    trustLine: "Top-reviewed Las Vegas day tours prioritized for conversion and repeatable commission flow.",
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
      "A route-first Miami page for beach, boat, and excursion planning with conversion-focused money lanes.",
    pillars: [
      "Everglades and day-trip timing",
      "Beach + nightlife pacing",
      "Cruise and transfer windows",
      "Weather-aware routing with buffers",
    ],
    trustLine: "Top-reviewed Miami excursions prioritized for high booking intent and repeatable commission flow.",
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
      "Plan Nashville with practical Broadway timing, live-music event routing, distillery tour priorities, and experience-first logistics.",
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
      "A conversion-aware Nashville page for Broadway flow, music discovery, and experience booking without schedule chaos.",
    pillars: [
      "Broadway live-music pacing",
      "Day-to-night routing with buffer time",
      "Music history and neighborhood clusters",
      "Tour categories with high booking intent",
    ],
    trustLine: "Top-reviewed Nashville experiences prioritized for music-driven traveler intent and conversion.",
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
        a: "You can, but conversion and experience quality are better when you protect one clean evening block for live music without overloading daytime routing.",
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
};

export function getCityAuthorityConfig(cityKey: string): CityAuthorityConfig | null {
  return CITY_AUTHORITY_CONFIG[cityKey] || null;
}
