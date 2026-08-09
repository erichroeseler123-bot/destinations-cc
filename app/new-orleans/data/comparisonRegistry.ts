export type ComparisonOpportunity = {
  slug: string;
  title: string;
  queryIntent: string;
  primaryTourSlugs: string[];
  status: "READY_FOR_RESEARCH" | "READY_TO_PUBLISH";
  requiredFacts: string[];
  decisionQuestions: string[];
};

/**
 * High-intent comparison topics. These are deliberately finite and tied to
 * real booking decisions; this is not a programmatic-SEO page generator.
 */
export const COMPARISON_OPPORTUNITIES: ComparisonOpportunity[] = [
  {
    slug: "whitney-vs-oak-alley",
    title: "Whitney Plantation vs Oak Alley: Which New Orleans Plantation Tour Fits You?",
    queryIntent: "Choose between two plantation experiences before booking.",
    primaryTourSlugs: ["whitney-plantation-tour", "oak-alley-plantation-tour-grey-line"],
    status: "READY_TO_PUBLISH",
    requiredFacts: ["total time", "transportation", "walking", "accessibility", "historical emphasis", "tour format"],
    decisionQuestions: ["Which is more focused on slavery history?", "Which is easier for limited mobility?", "How long does each take?", "Which format fits me better?"]
  },
  {
    slug: "covered-swamp-boat-vs-airboat",
    title: "Covered Swamp Boat vs Airboat in New Orleans: Which Should You Book?",
    queryIntent: "Choose the right swamp-tour format.",
    primaryTourSlugs: ["swamp-bayou-tour", "small-airboat-swamp-adventure", "large-airboat-swamp-adventure"],
    status: "READY_TO_PUBLISH",
    requiredFacts: ["noise", "shade", "speed", "age restrictions", "boat capacity", "total duration", "transportation", "weather exposure", "mobility restrictions"],
    decisionQuestions: ["Which is better with kids or grandparents?", "Which is calmer?", "Which has more weather protection?", "Which feels more adventurous?"]
  },
  {
    slug: "small-vs-large-airboat",
    title: "Small vs Large Airboat Tours in New Orleans: What Actually Changes?",
    queryIntent: "Understand whether paying for a smaller airboat changes the experience.",
    primaryTourSlugs: ["small-airboat-swamp-adventure", "large-airboat-swamp-adventure"],
    status: "READY_TO_PUBLISH",
    requiredFacts: ["capacity", "duration", "speed", "age restrictions", "price", "transportation", "weather exposure", "health restrictions"],
    decisionQuestions: ["Is the smaller boat worth it?", "How many people are on each boat?", "Are age rules different?", "How much more does the small boat cost?"]
  },
  {
    slug: "natchez-vs-city-of-new-orleans-riverboat",
    title: "Steamboat NATCHEZ vs Riverboat CITY of NEW ORLEANS: What's the Difference?",
    queryIntent: "Choose a Mississippi River cruise and understand the vessel/product difference.",
    primaryTourSlugs: ["daytime-jazz-cruise", "evening-jazz-cruise", "city-of-new-orleans-riverboat-cruise"],
    status: "READY_TO_PUBLISH",
    requiredFacts: ["vessel identity", "cruise duration", "jazz offering", "meal options", "boarding location", "narration"],
    decisionQuestions: ["Which boat will I actually ride?", "Which has live jazz?", "Which is shorter?", "Which meal options are available?"]
  },
  {
    slug: "swamp-tour-with-vs-without-transportation",
    title: "New Orleans Swamp Tours With Pickup vs Driving Yourself",
    queryIntent: "Choose transportation format and understand the real time commitment.",
    primaryTourSlugs: ["covered-tour-boat", "ragin-cajun-airboat-options", "swamp-bayou-tour", "small-airboat-swamp-adventure", "large-airboat-swamp-adventure"],
    status: "READY_FOR_RESEARCH",
    requiredFacts: ["pickup area", "pickup lead time", "drive time", "parking", "return window", "tour-only duration", "total commitment"],
    decisionQuestions: ["How much time does pickup add?", "Is driving yourself faster?", "Where do I park?", "Which option is easiest from the French Quarter?"]
  },
  {
    slug: "best-new-orleans-tour-if-you-only-have-3-hours",
    title: "Best New Orleans Tours If You Only Have About 3 Hours",
    queryIntent: "Find a bookable tour that fits a hard short-time constraint.",
    primaryTourSlugs: ["city-tour-of-new-orleans", "cocktail-walking-tour", "craft-cocktail-walking-tour", "ghosts-spirits-walking-tour"],
    status: "READY_FOR_RESEARCH",
    requiredFacts: ["scheduled duration", "check-in lead time", "starting location", "ending location", "transportation", "typical overrun risk"],
    decisionQuestions: ["Can I really finish in 3 hours?", "Do I need hotel pickup?", "Will I end where I started?", "What is safest before dinner or a flight?"]
  }
];
