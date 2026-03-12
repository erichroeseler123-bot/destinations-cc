export type CuratedShowCard = {
  title: string;
  venue: string;
  category: string;
  description: string;
  query: string;
};

export type ShowCategoryLane = {
  title: string;
  description: string;
  query: string;
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
  venueClusters: Array<{
    title: string;
    venues: string[];
  }>;
  planningNotes: string[];
};

export const CITY_SHOWS_CONFIG: Record<string, CityShowsConfig> = {
  "las-vegas": {
    heroSummary:
      "Las Vegas shows are a dedicated live-entertainment lane: residencies, magic, comedy, Sphere productions, casino showroom acts, and headline concert inventory.",
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
      },
      {
        title: "David Copperfield and premium magic",
        venue: "MGM Grand and Strip theaters",
        category: "Magic",
        description:
          "Magic is one of Vegas' clearest evergreen show categories, especially for visitors who want a strong evening commitment without club planning.",
        query: "las vegas magic shows",
      },
      {
        title: "Comedy and late-night cabaret",
        venue: "Caesars, Flamingo, MGM, and downtown rooms",
        category: "Comedy",
        description:
          "Comedy buyers usually want a tighter schedule, lower coordination overhead, and an easy pairing with dinner or Fremont routing.",
        query: "las vegas comedy shows",
      },
      {
        title: "Residencies and casino showroom acts",
        venue: "Colosseum, Resorts World, Venetian, Wynn",
        category: "Residency",
        description:
          "This lane captures the classic Vegas ticket intent: residency performers, casino-theater acts, and date-specific headline runs.",
        query: "las vegas residency shows",
      },
    ],
    showCategories: [
      {
        title: "Residencies",
        description: "Casino-theater headliners, repeat-run performers, and premium ticket inventory.",
        query: "las vegas residency shows",
      },
      {
        title: "Magic",
        description: "Headline illusion, mentalism, and classic Vegas showroom magic.",
        query: "las vegas magic shows",
      },
      {
        title: "Comedy",
        description: "Stand-up, adult cabaret, and late-night comedy rooms across the Strip.",
        query: "las vegas comedy shows",
      },
      {
        title: "Concerts",
        description: "Arena dates, theater tours, and large-format music nights.",
        query: "las vegas concerts",
      },
      {
        title: "Sphere and spectacle",
        description: "Immersive productions, headline runs, and major-format visual shows.",
        query: "sphere las vegas shows",
      },
      {
        title: "Casino showroom acts",
        description: "Classic Vegas theater inventory across Caesars, MGM, Venetian, and Wynn.",
        query: "las vegas showroom acts",
      },
    ],
    venueClusters: [
      {
        title: "Sphere and mega-format rooms",
        venues: ["Sphere", "T-Mobile Arena", "Dolby Live", "MGM Grand Garden Arena"],
      },
      {
        title: "Casino theaters and residency rooms",
        venues: ["The Colosseum", "Resorts World Theatre", "Voltaire", "Encore Theater"],
      },
      {
        title: "Magic, comedy, and flexible-night rooms",
        venues: ["Flamingo Showroom", "The LINQ Theater", "Rio", "Downtown and cabaret rooms"],
      },
    ],
    planningNotes: [
      "Shows are the event-intent lane, not the excursion lane. Use Vegas tours for canyon and dam planning, not theater inventory.",
      "A strong Vegas day usually pairs one fixed-time evening show with one lighter daytime attraction or one prebooked dinner block.",
      "Residency and premium headline nights should be booked earlier than flexible comedy or magic inventory because the date-specific demand is less forgiving.",
    ],
  },
};

export function getCityShowsConfig(citySlug: string) {
  return CITY_SHOWS_CONFIG[citySlug] || null;
}
