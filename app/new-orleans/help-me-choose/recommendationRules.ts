export type CategoryId =
  | "swamp-airboat"
  | "city-highlights"
  | "plantations-history"
  | "haunted-after-dark"
  | "food-cooking"
  | "river-music";

export type PreferenceId =
  | "swamp-calm"
  | "swamp-active"
  | "haunted-walking"
  | "haunted-riding"
  | "food-tasting"
  | "food-cooking";

export interface ChooserCategory {
  id: CategoryId;
  title: string;
  description: string;
  image: string;
  skipPreferences?: boolean;
}

export interface ChooserPreference {
  id: PreferenceId;
  categoryId: CategoryId;
  title: string;
}

export interface RecommendationResult {
  primaryProductId?: string; // If live inventory exists
  alternativeProductIds?: string[];
  explanation: string;
  fallbackMessage?: string;
}

export const CHOOSER_CATEGORIES: ChooserCategory[] = [
  {
    id: "swamp-airboat",
    title: "Swamp & Airboat",
    description: "Venture into the Louisiana bayou.",
    image: "/images/travel-markets/new-orleans/louisiana-bayou-swamp.jpg",
  },
  {
    id: "city-highlights",
    title: "City Highlights",
    description: "Explore the history and architecture.",
    image: "/images/travel-markets/new-orleans/french-quarter-street.jpg",
    skipPreferences: true,
  },
  {
    id: "plantations-history",
    title: "Plantations & History",
    description: "Step back into the historic River Road.",
    image: "/images/wikimedia/originals/oak-alley-front.jpg",
    skipPreferences: true,
  },
  {
    id: "haunted-after-dark",
    title: "Haunted & After Dark",
    description: "Discover ghosts, voodoo, and vampires.",
    image: "/images/wikimedia/originals/french-quarter-night.jpg",
  },
  {
    id: "food-cooking",
    title: "Food & Cooking",
    description: "Taste the city's culinary heritage.",
    image: "/images/wikimedia/originals/gumbo-dish.jpg",
  },
  {
    id: "river-music",
    title: "River & Music",
    description: "Experience jazz and the Mississippi.",
    image: "/images/travel-markets/new-orleans/steamboat-natchez.jpg",
    skipPreferences: true,
  },
];

export const CHOOSER_PREFERENCES: ChooserPreference[] = [
  // Swamp
  {
    id: "swamp-calm",
    categoryId: "swamp-airboat",
    title: "Covered boat and a calmer ride",
  },
  {
    id: "swamp-active",
    categoryId: "swamp-airboat",
    title: "Faster, more active airboat preference",
  },
  // Haunted
  {
    id: "haunted-walking",
    categoryId: "haunted-after-dark",
    title: "Walking and storytelling",
  },
  {
    id: "haunted-riding",
    categoryId: "haunted-after-dark",
    title: "Riding or lower-walking format",
  },
  // Food
  {
    id: "food-tasting",
    categoryId: "food-cooking",
    title: "Food tour and tastings",
  },
  {
    id: "food-cooking",
    categoryId: "food-cooking",
    title: "Cooking demonstration or class",
  },
];

export function getPreferencesForCategory(
  categoryId: CategoryId
): ChooserPreference[] {
  return CHOOSER_PREFERENCES.filter((p) => p.categoryId === categoryId);
}

export function getRecommendation(
  categoryId: CategoryId,
  preferenceId?: PreferenceId
): RecommendationResult {
  switch (categoryId) {
    case "swamp-airboat":
      if (preferenceId === "swamp-calm") {
        return {
          primaryProductId: "ragincajun-covered-boat",
          alternativeProductIds: ["ragincajun-airboat"],
          explanation:
            "This may be a better fit for visitors who prefer less speed or exposure. Confirm age, seating, accessibility, and weather details during booking.",
        };
      } else {
        return {
          primaryProductId: "ragincajun-airboat",
          alternativeProductIds: ["ragincajun-covered-boat"],
          explanation:
            "This may be a better fit for those seeking a fast, active ride. Operator policies vary, confirm age and accessibility during booking.",
        };
      }

    case "city-highlights":
      return {
        primaryProductId: "southernstyle-city-tour",
        explanation:
          "This may be a better fit for first-time visitors seeking a broader overview of the city. Confirm accessibility and pickup details during booking.",
      };

    case "plantations-history":
      return {
        primaryProductId: "southernstyle-plantation",
        explanation:
          "This may be a better fit for visitors looking for a half-day historic site visit. Confirm duration and availability during booking.",
      };

    case "haunted-after-dark":
    case "food-cooking":
    case "river-music":
    default:
      return {
        explanation: "",
        fallbackMessage:
          "This category guide is being prepared. Explore other currently bookable experiences or contact us for help.",
      };
  }
}
