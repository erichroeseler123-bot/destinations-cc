export type ShowType =
  | "residency"
  | "concert"
  | "magic"
  | "comedy"
  | "theater"
  | "musical"
  | "opera"
  | "ballet"
  | "dance"
  | "jazz"
  | "symphony"
  | "cabaret"
  | "spectacle"
  | "showroom";

export type VenueType =
  | "casino-theater"
  | "performing-arts-center"
  | "jazz-club"
  | "arena"
  | "cabaret"
  | "lounge"
  | "historic-theater"
  | "club-district"
  | "festival-zone";

export type AudienceType =
  | "couples"
  | "family"
  | "luxury"
  | "nightlife"
  | "culture"
  | "music-first"
  | "weekend-trip";

export type CuratedShowCard = {
  title: string;
  venue: string;
  category: string;
  description: string;
  query: string;
  showType: ShowType;
  venueType: VenueType;
  audienceTypes: AudienceType[];
  isResidency?: boolean;
  isPerformingArts?: boolean;
  isJazzClub?: boolean;
  isFamilyFriendly?: boolean;
};

export type ShowCategoryLane = {
  title: string;
  description: string;
  query: string;
  showType: ShowType;
  venueType?: VenueType;
  audienceTypes: AudienceType[];
  isPerformingArts?: boolean;
  isJazzClub?: boolean;
};

export type VenueCluster = {
  title: string;
  venues: string[];
  venueType: VenueType;
};

export type CulturalAnchor = {
  title: string;
  description: string;
  query: string;
  showType: ShowType;
  venueType: VenueType;
};

export type CityShowsConfig = {
  heroSummary: string;
  liveFeed: {
    lat: number;
    lon: number;
    radiusKm: number;
    size: number;
  };
  featuredShows: CuratedShowCard[];
  showCategories: ShowCategoryLane[];
  venueClusters: VenueCluster[];
  culturalAnchors: CulturalAnchor[];
  planningNotes: string[];
};

export const CITY_SHOWS_CONFIG: Record<string, CityShowsConfig> = {
  "las-vegas": {
    heroSummary:
      "Las Vegas shows are a dedicated live-performance lane: residencies, magic, comedy, Sphere productions, casino showroom acts, headline concerts, and premium spectacle inventory.",
    liveFeed: {
      lat: 36.1147,
      lon: -115.1728,
      radiusKm: 30,
      size: 12,
    },
    featuredShows: [
      {
        title: "Sphere and immersive headline nights",
        venue: "Sphere",
        category: "Spectacle",
        description:
          "Use this lane for large-format productions, residency-level runs, and premium headline inventory that anchors an entire Vegas night.",
        query: "sphere las vegas shows",
        showType: "spectacle",
        venueType: "arena",
        audienceTypes: ["luxury", "couples", "music-first"],
      },
      {
        title: "David Copperfield and premium magic",
        venue: "MGM Grand and Strip theaters",
        category: "Magic",
        description:
          "Magic is one of Vegas' clearest evergreen show categories, especially for visitors who want a strong evening commitment without club planning.",
        query: "las vegas magic shows",
        showType: "magic",
        venueType: "casino-theater",
        audienceTypes: ["couples", "nightlife", "weekend-trip"],
      },
      {
        title: "Comedy and late-night cabaret",
        venue: "Caesars, Flamingo, MGM, and downtown rooms",
        category: "Comedy",
        description:
          "Comedy buyers usually want a tighter schedule, lower coordination overhead, and an easy pairing with dinner or Fremont routing.",
        query: "las vegas comedy shows",
        showType: "comedy",
        venueType: "cabaret",
        audienceTypes: ["couples", "nightlife", "weekend-trip"],
      },
      {
        title: "Residencies and casino showroom acts",
        venue: "Colosseum, Resorts World, Venetian, Wynn",
        category: "Residency",
        description:
          "This lane captures the classic Vegas ticket intent: residency performers, casino-theater acts, and date-specific headline runs.",
        query: "las vegas residency shows",
        showType: "residency",
        venueType: "casino-theater",
        audienceTypes: ["luxury", "couples", "music-first"],
        isResidency: true,
      },
    ],
    showCategories: [
      {
        title: "Residencies",
        description: "Casino-theater headliners, repeat-run performers, and premium ticket inventory.",
        query: "las vegas residency shows",
        showType: "residency",
        venueType: "casino-theater",
        audienceTypes: ["luxury", "couples", "music-first"],
      },
      {
        title: "Magic",
        description: "Headline illusion, mentalism, and classic Vegas showroom magic.",
        query: "las vegas magic shows",
        showType: "magic",
        venueType: "casino-theater",
        audienceTypes: ["couples", "nightlife", "weekend-trip"],
      },
      {
        title: "Comedy",
        description: "Stand-up, adult cabaret, and late-night comedy rooms across the Strip.",
        query: "las vegas comedy shows",
        showType: "comedy",
        venueType: "cabaret",
        audienceTypes: ["nightlife", "couples", "weekend-trip"],
      },
      {
        title: "Concerts",
        description: "Arena dates, theater tours, and large-format music nights.",
        query: "las vegas concerts",
        showType: "concert",
        venueType: "arena",
        audienceTypes: ["music-first", "couples", "weekend-trip"],
      },
      {
        title: "Sphere and spectacle",
        description: "Immersive productions, headline runs, and major-format visual shows.",
        query: "sphere las vegas shows",
        showType: "spectacle",
        venueType: "arena",
        audienceTypes: ["luxury", "couples", "music-first"],
      },
      {
        title: "Casino showroom acts",
        description: "Classic Vegas theater inventory across Caesars, MGM, Venetian, and Wynn.",
        query: "las vegas showroom acts",
        showType: "showroom",
        venueType: "casino-theater",
        audienceTypes: ["nightlife", "couples", "weekend-trip"],
      },
      {
        title: "Broadway and musical theater",
        description: "Touring musicals, theatrical productions, and larger scripted nights on the Strip.",
        query: "las vegas musical theater",
        showType: "musical",
        venueType: "casino-theater",
        audienceTypes: ["couples", "culture", "weekend-trip"],
        isPerformingArts: true,
      },
      {
        title: "Opera, classical, and orchestra",
        description: "Special-event classical programming, orchestra dates, and crossover performing-arts nights.",
        query: "las vegas orchestra classical performances",
        showType: "symphony",
        venueType: "performing-arts-center",
        audienceTypes: ["culture", "luxury", "couples"],
        isPerformingArts: true,
      },
    ],
    venueClusters: [
      {
        title: "Sphere and mega-format rooms",
        venueType: "arena",
        venues: ["Sphere", "T-Mobile Arena", "Dolby Live", "MGM Grand Garden Arena"],
      },
      {
        title: "Casino theaters and residency rooms",
        venueType: "casino-theater",
        venues: ["The Colosseum", "Resorts World Theatre", "Voltaire", "Encore Theater"],
      },
      {
        title: "Magic, comedy, and flexible-night rooms",
        venueType: "cabaret",
        venues: ["Flamingo Showroom", "The LINQ Theater", "Rio", "Downtown and cabaret rooms"],
      },
    ],
    culturalAnchors: [
      {
        title: "Smith Center and performing arts nights",
        description:
          "Vegas is not only casino entertainment. This lane covers ballet, Broadway tours, orchestra programs, and more formal performing-arts programming.",
        query: "smith center las vegas shows",
        showType: "theater",
        venueType: "performing-arts-center",
      },
      {
        title: "Jazz and lounge performance",
        description:
          "Use this layer for smaller-format live music, jazz sets, and lounge-style nights that fit better than a full arena production.",
        query: "las vegas jazz clubs live music",
        showType: "jazz",
        venueType: "lounge",
      },
    ],
    planningNotes: [
      "Shows are the event-intent lane, not the excursion lane. Use Vegas tours for canyon and dam planning, not theater inventory.",
      "A strong Vegas day usually pairs one fixed-time evening show with one lighter daytime attraction or one prebooked dinner block.",
      "Residency and premium headline nights should be booked earlier than flexible comedy or magic inventory because the date-specific demand is less forgiving.",
    ],
  },
  "new-orleans": {
    heroSummary:
      "New Orleans shows span jazz clubs, cabaret, theater, symphony, opera, and festival-season performance inventory centered around music-first neighborhoods and historic venues.",
    liveFeed: {
      lat: 29.9511,
      lon: -90.0715,
      radiusKm: 25,
      size: 12,
    },
    featuredShows: [
      {
        title: "Frenchmen Street jazz and club nights",
        venue: "Frenchmen Street club corridor",
        category: "Jazz",
        description:
          "For New Orleans, the clearest show intent starts with live jazz, club sets, and neighborhood music planning rather than arena-first ticketing.",
        query: "frenchmen street live jazz tonight",
        showType: "jazz",
        venueType: "club-district",
        audienceTypes: ["music-first", "nightlife", "couples"],
        isJazzClub: true,
      },
      {
        title: "Saenger and Orpheum theater nights",
        venue: "Saenger Theatre and Orpheum Theater",
        category: "Theater",
        description:
          "This lane captures touring musicals, comedy runs, Broadway-style dates, and larger indoor performance inventory in the city core.",
        query: "saenger theatre new orleans shows",
        showType: "theater",
        venueType: "historic-theater",
        audienceTypes: ["culture", "couples", "weekend-trip"],
        isPerformingArts: true,
      },
      {
        title: "Jazz hall and intimate performance rooms",
        venue: "Preservation Hall and Quarter clubs",
        category: "Cabaret",
        description:
          "Smaller-format performance nights are central to New Orleans. They convert differently than large ticketed events and need their own discovery layer.",
        query: "preservation hall new orleans tickets",
        showType: "cabaret",
        venueType: "lounge",
        audienceTypes: ["music-first", "culture", "couples"],
        isJazzClub: true,
      },
      {
        title: "Opera, ballet, and orchestra anchors",
        venue: "Mahalia Jackson Theater and symphony venues",
        category: "Performing Arts",
        description:
          "New Orleans has a real cultural-performance lane beyond clubs: orchestra, opera, ballet, and formal staged productions.",
        query: "new orleans opera ballet symphony",
        showType: "opera",
        venueType: "performing-arts-center",
        audienceTypes: ["culture", "couples", "luxury"],
        isPerformingArts: true,
      },
    ],
    showCategories: [
      {
        title: "Jazz clubs",
        description: "Frenchmen Street, classic jazz rooms, and intimate live-music nights.",
        query: "new orleans jazz clubs live music",
        showType: "jazz",
        venueType: "jazz-club",
        audienceTypes: ["music-first", "nightlife", "couples"],
        isJazzClub: true,
      },
      {
        title: "Cabaret and lounge performance",
        description: "Smaller-format performance rooms, vocal jazz, piano bars, and club-style nights.",
        query: "new orleans cabaret live music",
        showType: "cabaret",
        venueType: "lounge",
        audienceTypes: ["nightlife", "couples", "music-first"],
      },
      {
        title: "Theater and musicals",
        description: "Historic theater programming, touring productions, and indoor staged performances.",
        query: "new orleans theater shows",
        showType: "theater",
        venueType: "historic-theater",
        audienceTypes: ["culture", "couples", "weekend-trip"],
        isPerformingArts: true,
      },
      {
        title: "Opera and ballet",
        description: "Formal staged performance inventory, cultural institutions, and seasonal productions.",
        query: "new orleans opera ballet",
        showType: "ballet",
        venueType: "performing-arts-center",
        audienceTypes: ["culture", "luxury", "couples"],
        isPerformingArts: true,
      },
      {
        title: "Symphony and classical",
        description: "Orchestra nights, chamber programming, and higher-culture evening plans.",
        query: "new orleans symphony orchestra",
        showType: "symphony",
        venueType: "performing-arts-center",
        audienceTypes: ["culture", "couples", "luxury"],
        isPerformingArts: true,
      },
      {
        title: "Festival and headline music",
        description: "Large music-event demand, festival overlap, and headline venue inventory.",
        query: "new orleans live music events",
        showType: "concert",
        venueType: "festival-zone",
        audienceTypes: ["music-first", "nightlife", "weekend-trip"],
      },
    ],
    venueClusters: [
      {
        title: "Frenchmen and club-music corridor",
        venueType: "club-district",
        venues: ["Frenchmen Street clubs", "Spotted Cat Music Club", "Snug Harbor", "d.b.a."],
      },
      {
        title: "Historic theaters and major rooms",
        venueType: "historic-theater",
        venues: ["Saenger Theatre", "Orpheum Theater", "House of Blues", "Civic-style indoor rooms"],
      },
      {
        title: "Performing arts and cultural venues",
        venueType: "performing-arts-center",
        venues: ["Mahalia Jackson Theater", "Symphony performance rooms", "Opera and ballet venues"],
      },
    ],
    culturalAnchors: [
      {
        title: "Preservation Hall and heritage performance",
        description:
          "Some New Orleans show intent is not headline-ticket inventory at all. It is heritage music, jazz lineage, and smaller-format performance booking.",
        query: "preservation hall new orleans tickets",
        showType: "jazz",
        venueType: "jazz-club",
      },
      {
        title: "Festival-season planning",
        description:
          "Jazz Fest and other seasonal anchors change citywide demand, routing, and ticket availability, so the page should keep a festival-aware planning layer.",
        query: "new orleans jazz fest tickets events",
        showType: "concert",
        venueType: "festival-zone",
      },
    ],
    planningNotes: [
      "New Orleans shows are not just arena dates. Jazz clubs, cabaret, and heritage music rooms are core inventory here.",
      "The strongest New Orleans entertainment day usually protects one neighborhood music block instead of trying to cross the city multiple times at night.",
      "Festival weekends materially change pricing and venue access, so music-first trips should treat them as a separate planning mode.",
    ],
  },
  nashville: {
    heroSummary:
      "Nashville shows span Opry-style performance, Broadway live-music rooms, touring concerts, songwriter rounds, theater nights, jazz, and formal performing-arts programming.",
    liveFeed: {
      lat: 36.1627,
      lon: -86.7816,
      radiusKm: 28,
      size: 12,
    },
    featuredShows: [
      {
        title: "Grand Ole Opry and heritage country performance",
        venue: "Grand Ole Opry and Opry House",
        category: "Country Performance",
        description:
          "Nashville’s show lane starts with the Opry model: recurring heritage performance, country-music identity, and date-specific evening planning.",
        query: "grand ole opry tickets",
        showType: "concert",
        venueType: "historic-theater",
        audienceTypes: ["music-first", "culture", "weekend-trip"],
      },
      {
        title: "Broadway live music and songwriter rooms",
        venue: "Broadway corridor and round venues",
        category: "Live Music",
        description:
          "Broadway is not one show. It is a cluster of venue decisions, live bands, and flexible-night music routing that needs its own lane.",
        query: "nashville broadway live music tonight",
        showType: "cabaret",
        venueType: "club-district",
        audienceTypes: ["music-first", "nightlife", "weekend-trip"],
      },
      {
        title: "Ryman and seated concert nights",
        venue: "Ryman Auditorium and headline rooms",
        category: "Concert",
        description:
          "This lane captures seated headline inventory, special runs, recorded-live events, and premium Nashville performance nights.",
        query: "ryman auditorium shows",
        showType: "concert",
        venueType: "historic-theater",
        audienceTypes: ["music-first", "couples", "culture"],
      },
      {
        title: "Symphony, ballet, and theater programming",
        venue: "TPAC and downtown arts venues",
        category: "Performing Arts",
        description:
          "Nashville has a real performing-arts lane beyond Broadway bars: orchestra, ballet, touring theater, and formal evening programming.",
        query: "nashville performing arts center shows",
        showType: "theater",
        venueType: "performing-arts-center",
        audienceTypes: ["culture", "couples", "luxury"],
        isPerformingArts: true,
      },
    ],
    showCategories: [
      {
        title: "Opry and country performance",
        description: "Heritage country-show inventory, Opry nights, and iconic Nashville performance planning.",
        query: "grand ole opry tickets",
        showType: "concert",
        venueType: "historic-theater",
        audienceTypes: ["music-first", "culture", "weekend-trip"],
      },
      {
        title: "Broadway live music",
        description: "Bar-stage music, honky-tonk routing, and same-night venue hopping.",
        query: "nashville broadway live music tonight",
        showType: "cabaret",
        venueType: "club-district",
        audienceTypes: ["music-first", "nightlife", "weekend-trip"],
      },
      {
        title: "Songwriter rounds",
        description: "Smaller-format writers’ rooms, seated listening nights, and music-first local discovery.",
        query: "nashville songwriter rounds",
        showType: "cabaret",
        venueType: "lounge",
        audienceTypes: ["music-first", "culture", "couples"],
      },
      {
        title: "Concerts and headline rooms",
        description: "Arena, amphitheater, and historic-theater ticket inventory.",
        query: "nashville concerts this weekend",
        showType: "concert",
        venueType: "arena",
        audienceTypes: ["music-first", "weekend-trip", "couples"],
      },
      {
        title: "Theater and musicals",
        description: "Touring shows, classic theater nights, and scripted performance inventory.",
        query: "nashville theater shows",
        showType: "musical",
        venueType: "performing-arts-center",
        audienceTypes: ["culture", "couples", "family"],
        isPerformingArts: true,
      },
      {
        title: "Symphony, ballet, and classical",
        description: "Formal arts programming for orchestra, ballet, and classical performance buyers.",
        query: "nashville symphony ballet",
        showType: "symphony",
        venueType: "performing-arts-center",
        audienceTypes: ["culture", "luxury", "couples"],
        isPerformingArts: true,
      },
      {
        title: "Jazz and listening rooms",
        description: "Smaller performance rooms for jazz, musicianship-first sets, and date-night live music.",
        query: "nashville jazz clubs",
        showType: "jazz",
        venueType: "jazz-club",
        audienceTypes: ["culture", "couples", "music-first"],
        isJazzClub: true,
      },
    ],
    venueClusters: [
      {
        title: "Broadway and live-music corridor",
        venueType: "club-district",
        venues: ["Broadway honky-tonks", "Lower Broadway stages", "Writers' rooms", "Listening bars"],
      },
      {
        title: "Historic headline venues",
        venueType: "historic-theater",
        venues: ["Ryman Auditorium", "Grand Ole Opry", "Ascend Amphitheater", "Bridgestone Arena"],
      },
      {
        title: "Performing arts and cultural venues",
        venueType: "performing-arts-center",
        venues: ["Tennessee Performing Arts Center", "Nashville Symphony", "Ballet and touring-show venues"],
      },
    ],
    culturalAnchors: [
      {
        title: "Country music heritage nights",
        description:
          "Nashville’s entertainment lane is not only bar music. It includes heritage performance brands with their own booking behavior and audience expectations.",
        query: "country music hall of fame live shows nashville",
        showType: "concert",
        venueType: "historic-theater",
      },
      {
        title: "Performing arts center programming",
        description:
          "TPAC-style inventory matters here because Nashville is both a tourism show city and a real performing-arts market.",
        query: "tennessee performing arts center shows",
        showType: "theater",
        venueType: "performing-arts-center",
      },
    ],
    planningNotes: [
      "Nashville show buyers split between Broadway wandering, heritage country performance, and formal seated venues. Those are different behaviors and should stay distinct.",
      "Broadway can absorb an entire night on its own, while Opry, Ryman, or TPAC nights usually want a cleaner pre-show and post-show route.",
      "Songwriter rounds and jazz/listening rooms fit best for lower-chaos evenings and more music-first travelers.",
    ],
  },
};

export function getCityShowsConfig(citySlug: string) {
  return CITY_SHOWS_CONFIG[citySlug] || null;
}
