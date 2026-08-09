import { PRE_SITE_GUIDES } from "@/src/data/pre-site-guides";

export type DecisionCategory = (typeof PRE_SITE_GUIDES)[number]["category"];

export type DecisionCategoryDefinition = {
  slug: DecisionCategory;
  label: string;
  promise: string;
  scope: string[];
  bridgeCategories: DecisionCategory[];
};

export const DECISION_CATEGORIES: DecisionCategoryDefinition[] = [
  {
    slug: "cruise",
    label: "Cruise planning",
    promise: "Solve the port-day and group-planning questions before you choose an excursion or tool.",
    scope: ["port timing", "return buffers", "independent vs ship excursions", "group planning", "cruise-day logistics"],
    bridgeCategories: ["alaska", "transportation"],
  },
  {
    slug: "new-orleans",
    label: "New Orleans",
    promise: "Narrow the kind of New Orleans experience that fits before you open a booking surface.",
    scope: ["swamp tours", "French Quarter orientation", "first-day planning", "mobility", "time constraints"],
    bridgeCategories: ["transportation"],
  },
  {
    slug: "alaska",
    label: "Alaska",
    promise: "Turn a finite Alaska port day into a decision that respects weather, timing, and backup options.",
    scope: ["Juneau", "shore excursions", "flightseeing", "whale watching", "weather pivots"],
    bridgeCategories: ["cruise", "transportation"],
  },
  {
    slug: "colorado",
    label: "Colorado mountains",
    promise: "Resolve mountain-transfer, rental-car, and resort-mobility questions before paying for transportation.",
    scope: ["DEN", "Vail", "Breckenridge", "winter driving", "private transfers"],
    bridgeCategories: ["transportation"],
  },
  {
    slug: "red-rocks",
    label: "Red Rocks",
    promise: "Solve the transportation and exit-plan problem before concert day or a daytime visit.",
    scope: ["shuttles", "rideshare", "parking", "post-show exits", "day visits"],
    bridgeCategories: ["transportation", "colorado"],
  },
  {
    slug: "wisconsin",
    label: "Wisconsin Dells",
    promise: "Choose the shape of the trip before committing to attractions, transportation, or a fixed itinerary.",
    scope: ["first visits", "group planning", "trip shape", "time budgeting", "activity mix"],
    bridgeCategories: ["transportation"],
  },
  {
    slug: "transportation",
    label: "Transportation",
    promise: "Compare ride modes by reliability, timing, group fit, and the cost of failure—not just sticker price.",
    scope: ["airport pickup", "private transfer", "shuttle", "rideshare", "event transportation"],
    bridgeCategories: ["colorado", "red-rocks", "cruise", "alaska", "new-orleans", "wisconsin"],
  },
];

export function getDecisionCategory(slug: string) {
  return DECISION_CATEGORIES.find((category) => category.slug === slug) ?? null;
}

export function guidesForCategory(category: DecisionCategory) {
  return PRE_SITE_GUIDES.filter((guide) => guide.category === category);
}

export function relatedDecisionGuides(slug: string, limit = 4) {
  const guide = PRE_SITE_GUIDES.find((item) => item.slug === slug);
  if (!guide) return [];

  const category = getDecisionCategory(guide.category);
  const sameCategory = PRE_SITE_GUIDES.filter(
    (candidate) => candidate.slug !== slug && candidate.category === guide.category,
  );
  const bridges = PRE_SITE_GUIDES.filter(
    (candidate) =>
      candidate.slug !== slug &&
      candidate.category !== guide.category &&
      category?.bridgeCategories.includes(candidate.category),
  );

  return [...sameCategory, ...bridges].slice(0, limit);
}
