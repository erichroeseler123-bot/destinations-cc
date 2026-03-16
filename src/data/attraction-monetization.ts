export type AttractionExperienceIntent = {
  label: string;
  query: string;
  description: string;
};

export type AttractionMonetizationEntry = {
  citySlug: string;
  cityName: string;
  slug: string;
  name: string;
  heroTitle: string;
  heroSummary: string;
  trustLine: string;
  about: string;
  thingsToDo: string[];
  visitorInfo: Array<{ label: string; value: string }>;
  planningTips: string[];
  experiencesIntro: string;
  experiencesDescription: string;
  experienceIntents: AttractionExperienceIntent[];
  relatedAttractions: Array<{ label: string; href: string }>;
  primaryToursHref: string;
  thingsToDoHref: string;
  schemaType?: "TouristAttraction" | "LandmarksOrHistoricalBuildings";
};

export const ATTRACTION_MONETIZATION_ENTRIES: AttractionMonetizationEntry[] = [
  {
    citySlug: "new-orleans",
    cityName: "New Orleans",
    slug: "french-quarter",
    name: "French Quarter",
    heroTitle: "French Quarter guide, things to do, and local tours",
    heroSummary:
      "Explore the French Quarter with practical visitor context, neighborhood highlights, and guided experiences that help first-time visitors make the most of the area.",
    trustLine:
      "Popular ways visitors experience the French Quarter include walking tours, ghost tours, food tours, and live music nights nearby.",
    about:
      "The French Quarter is the best-known part of New Orleans for a reason: architecture, history, balconies, courtyards, music, and food are all concentrated into a compact, walkable area. It works best when you plan it as a focused neighborhood block rather than trying to combine it with too many distant stops in one day.",
    thingsToDo: [
      "Walk Jackson Square, St. Louis Cathedral, and the surrounding historic streets.",
      "Use Royal Street for galleries, architecture, and a calmer daytime loop.",
      "Book a ghost, history, or food tour if you want stronger context than wandering alone.",
      "Treat the Quarter as a dedicated evening block before heading toward Frenchmen Street.",
    ],
    visitorInfo: [
      { label: "Best for", value: "First-time visitors, history, architecture, and iconic New Orleans atmosphere" },
      { label: "Best time", value: "Early mornings and late afternoons for easier walking and better pacing" },
      { label: "Typical visit", value: "2 to 4 hours, or longer if you add a guided tour, meal, or music night" },
      { label: "Works well with", value: "Frenchmen Street, a food tour, riverfront walks, and a weekend guide" },
    ],
    planningTips: [
      "Go early if you want the Quarter before heavy crowds and nightlife spillover.",
      "Pair the area with one clear tour or food experience instead of improvising your whole day there.",
      "Use a music-first night plan if you want the Quarter and Frenchmen to feel intentional instead of rushed.",
    ],
    experiencesIntro: "Popular ways visitors experience the French Quarter",
    experiencesDescription:
      "Guided experiences help visitors understand the Quarter’s history, food, and nightlife without turning the area into a random checklist.",
    experienceIntents: [
      {
        label: "French Quarter walking tours",
        query: "french quarter walking tour new orleans",
        description: "A strong first option for history, architecture, and orientation.",
      },
      {
        label: "French Quarter ghost tours",
        query: "french quarter ghost tour new orleans",
        description: "One of the area’s most popular night experiences.",
      },
      {
        label: "French Quarter food tours",
        query: "french quarter food tour new orleans",
        description: "An easy way to combine neighborhood context with classic dishes.",
      },
      {
        label: "French Quarter jazz and music tours",
        query: "new orleans french quarter jazz tour",
        description: "Useful when you want the Quarter tied into a music-first itinerary.",
      },
    ],
    relatedAttractions: [
      { label: "Frenchmen Street", href: "/new-orleans/frenchmen-street" },
      { label: "Jackson Square", href: "/new-orleans/jackson-square" },
      { label: "Garden District", href: "/new-orleans/garden-district" },
      { label: "New Orleans things to do", href: "/new-orleans/things-to-do" },
    ],
    primaryToursHref: "/new-orleans/french-quarter/tours",
    thingsToDoHref: "/new-orleans/things-to-do",
  },
  {
    citySlug: "new-orleans",
    cityName: "New Orleans",
    slug: "garden-district",
    name: "Garden District",
    heroTitle: "Garden District guide, things to do, and local tours",
    heroSummary:
      "Plan a Garden District visit around architecture, quieter streets, historic homes, and guided neighborhood experiences.",
    trustLine:
      "Popular ways visitors experience the Garden District include walking tours, architecture tours, and food or cocktail stops nearby.",
    about:
      "The Garden District gives New Orleans visitors a slower, greener side of the city. It works well as a daytime contrast to the French Quarter and is one of the easiest neighborhoods to pair with brunch, architecture walks, and a focused afternoon tour.",
    thingsToDo: [
      "Walk residential streets known for historic homes and oak-lined blocks.",
      "Book a neighborhood walking tour if you want more context on architecture and local history.",
      "Pair the area with lunch, coffee, or a slower daytime sightseeing block.",
      "Use it as a counterweight to a more crowded Quarter or nightlife-heavy day.",
    ],
    visitorInfo: [
      { label: "Best for", value: "Architecture, daytime exploring, quieter pacing, and repeat visitors" },
      { label: "Best time", value: "Morning through mid-afternoon" },
      { label: "Typical visit", value: "1.5 to 3 hours, longer with a guided walk or meal stop" },
      { label: "Works well with", value: "Warehouse District museums, brunch, and neighborhood-focused itineraries" },
    ],
    planningTips: [
      "Treat the district as a slower, walkable day block instead of squeezing it into a packed schedule.",
      "A guided walk is often the easiest way to make the neighborhood feel more meaningful than just a photo stop.",
      "Pair it with one nearby meal or museum to avoid bouncing across the city.",
    ],
    experiencesIntro: "Popular ways visitors experience the Garden District",
    experiencesDescription:
      "Guided neighborhood walks and architecture-focused experiences help first-time visitors understand what makes the district distinct.",
    experienceIntents: [
      {
        label: "Garden District walking tours",
        query: "garden district walking tour new orleans",
        description: "The simplest way to add local history and architectural context.",
      },
      {
        label: "New Orleans architecture tours",
        query: "new orleans architecture tour garden district",
        description: "Helpful if the neighborhood’s homes and layout are your main draw.",
      },
      {
        label: "Garden District food tours",
        query: "garden district food tour new orleans",
        description: "A lighter way to combine neighborhood discovery with local dining.",
      },
    ],
    relatedAttractions: [
      { label: "French Quarter", href: "/new-orleans/french-quarter" },
      { label: "Frenchmen Street", href: "/new-orleans/frenchmen-street" },
      { label: "New Orleans neighborhoods", href: "/new-orleans/neighborhoods" },
    ],
    primaryToursHref: "/new-orleans/garden-district/tours",
    thingsToDoHref: "/new-orleans/things-to-do",
  },
  {
    citySlug: "new-orleans",
    cityName: "New Orleans",
    slug: "frenchmen-street",
    name: "Frenchmen Street",
    heroTitle: "Frenchmen Street guide, music, and local tours",
    heroSummary:
      "Use Frenchmen Street as a music-first New Orleans entry point, with live-show context, nearby planning, and guided experiences for visitors who want more than a random night out.",
    trustLine:
      "Popular ways visitors experience Frenchmen Street include jazz tours, music-history walks, and small-group nightlife experiences.",
    about:
      "Frenchmen Street is one of the best-known live-music corridors in New Orleans. It is most useful as a dedicated evening plan rather than a quick add-on after an already overpacked day. Visitors who want real music atmosphere usually get more out of this area than a generic Bourbon Street night.",
    thingsToDo: [
      "Build one music-first evening around clubs, bars, and late-night food nearby.",
      "Use a guided music or history walk if you want stronger local context before the night starts.",
      "Pair the area with the French Quarter, but keep enough buffer to avoid rushing the whole night.",
      "Check what is happening now if you want a more live feel before choosing a venue.",
    ],
    visitorInfo: [
      { label: "Best for", value: "Jazz, live music, nightlife, and repeat visitors who want something less generic" },
      { label: "Best time", value: "Evening into late night" },
      { label: "Typical visit", value: "2 to 5 hours depending on music stops and pacing" },
      { label: "Works well with", value: "French Quarter walks, jazz history, and weekend city guides" },
    ],
    planningTips: [
      "Go in with one or two clear venues or a guided music experience instead of trying to improvise every stop.",
      "Use this as its own evening block and avoid stacking too many daytime neighborhoods around it.",
      "If live music is the main reason for your trip, pair Frenchmen with a city shows page and a weekend guide.",
    ],
    experiencesIntro: "Popular ways visitors experience Frenchmen Street",
    experiencesDescription:
      "Music-focused visitors often book guided experiences here because they add context, local recommendations, and a stronger start to the night.",
    experienceIntents: [
      {
        label: "Frenchmen Street jazz tours",
        query: "frenchmen street jazz tour new orleans",
        description: "A clean entry point if live music is the main reason for your visit.",
      },
      {
        label: "New Orleans music history tours",
        query: "new orleans music history tour frenchmen street",
        description: "Useful if you want more than just bar hopping.",
      },
      {
        label: "New Orleans nightlife tours",
        query: "new orleans nightlife tour frenchmen street",
        description: "Helpful for pairing music, bars, and local context in one evening.",
      },
    ],
    relatedAttractions: [
      { label: "French Quarter", href: "/new-orleans/french-quarter" },
      { label: "Jackson Square", href: "/new-orleans/jackson-square" },
      { label: "New Orleans music guide", href: "/new-orleans/music" },
    ],
    primaryToursHref: "/new-orleans/frenchmen-street/tours",
    thingsToDoHref: "/new-orleans/music",
  },
  {
    citySlug: "new-orleans",
    cityName: "New Orleans",
    slug: "jackson-square",
    name: "Jackson Square",
    heroTitle: "Jackson Square guide, things to do, and local tours",
    heroSummary:
      "Plan a visit to Jackson Square with context on what to see nearby, how to pace the area, and which guided experiences fit naturally around it.",
    trustLine:
      "Popular ways visitors experience Jackson Square include French Quarter walks, history tours, and nearby food or culture experiences.",
    about:
      "Jackson Square is one of the most recognizable public spaces in New Orleans and a natural anchor for a first walk through the French Quarter. It works best as part of a larger Quarter route rather than as a standalone stop, especially if you want the area to feel richer than a few photos.",
    thingsToDo: [
      "See St. Louis Cathedral, artists, and the surrounding Quarter streets.",
      "Use the square as the anchor point for a walking or history tour.",
      "Pair it with riverfront wandering, Royal Street, and nearby cafés.",
      "Treat it as an early or mid-day stop before food, shopping, or music plans.",
    ],
    visitorInfo: [
      { label: "Best for", value: "First-time visitors, short walking loops, history, and classic New Orleans landmarks" },
      { label: "Best time", value: "Morning and late afternoon" },
      { label: "Typical visit", value: "30 minutes to 2 hours, depending on whether you add a tour" },
      { label: "Works well with", value: "French Quarter walking tours, food tours, and riverfront sightseeing" },
    ],
    planningTips: [
      "Use Jackson Square as the start of a Quarter route rather than the only thing on your list.",
      "A walking or history tour usually makes the area feel far more meaningful than a quick pass-through.",
      "If crowds are part of the trip, early hours are easier for photos and orientation.",
    ],
    experiencesIntro: "Popular ways visitors experience Jackson Square",
    experiencesDescription:
      "The square is most useful when it is part of a larger French Quarter experience, especially on a guided walk.",
    experienceIntents: [
      {
        label: "Jackson Square and French Quarter tours",
        query: "jackson square french quarter walking tour",
        description: "The most natural way to place the square in a larger visit.",
      },
      {
        label: "New Orleans history tours",
        query: "new orleans history tour jackson square",
        description: "Good for visitors who want more context than a self-guided stop.",
      },
      {
        label: "French Quarter food and history tours",
        query: "new orleans french quarter food and history tour",
        description: "A practical option if you want to connect landmarks with local dining.",
      },
    ],
    relatedAttractions: [
      { label: "French Quarter", href: "/new-orleans/french-quarter" },
      { label: "Frenchmen Street", href: "/new-orleans/frenchmen-street" },
      { label: "New Orleans things to do", href: "/new-orleans/things-to-do" },
    ],
    primaryToursHref: "/new-orleans/jackson-square/tours",
    thingsToDoHref: "/new-orleans/things-to-do",
  },
];

export function listAttractionMonetizationEntries() {
  return ATTRACTION_MONETIZATION_ENTRIES;
}

export function getAttractionMonetizationEntry(citySlug: string, slug: string) {
  return ATTRACTION_MONETIZATION_ENTRIES.find((entry) => entry.citySlug === citySlug && entry.slug === slug) || null;
}

export function listAttractionEntriesByCity(citySlug: string) {
  return ATTRACTION_MONETIZATION_ENTRIES.filter((entry) => entry.citySlug === citySlug);
}
