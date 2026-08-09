export type CategoryId =
  | "swamp-airboat"
  | "city-highlights"
  | "plantations-history"
  | "haunted-after-dark"
  | "food-cooking"
  | "river-music"
  | "full-day-combos";

export type PreferenceId =
  | "swamp-covered"
  | "swamp-small-airboat"
  | "swamp-large-airboat"
  | "swamp-plantation"
  | "city-sightseeing"
  | "city-river"
  | "city-cocktails"
  | "city-ghosts"
  | "plantation-oak-alley"
  | "plantation-whitney"
  | "plantation-swamp"
  | "notsure-day-evening"
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
  primaryProductId?: string;
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
  },
  {
    id: "plantations-history",
    title: "Plantations & History",
    description: "Step back into the historic River Road.",
    image: "/images/wikimedia/originals/oak-alley-front.jpg",
  },
  {
    id: "haunted-after-dark",
    title: "Haunted & After Dark",
    description: "Discover ghosts, legends, and nighttime New Orleans.",
    image: "/images/wikimedia/originals/french-quarter-night.jpg",
    skipPreferences: true,
  },
  {
    id: "food-cooking",
    title: "Food & Cocktails",
    description: "Taste the city's culinary and cocktail heritage.",
    image: "/images/wikimedia/originals/gumbo-dish.jpg",
    skipPreferences: true,
  },
  {
    id: "river-music",
    title: "River Cruises",
    description: "Experience jazz and the Mississippi River.",
    image: "/images/travel-markets/new-orleans/steamboat-natchez.jpg",
    skipPreferences: true,
  },
  {
    id: "full-day-combos",
    title: "Full-Day Combos",
    description: "Combine major New Orleans experiences in one longer outing.",
    image: "/images/travel-markets/new-orleans/french-quarter-street.jpg",
    skipPreferences: true,
  },
];

export const CHOOSER_PREFERENCES: ChooserPreference[] = [
  { id: "swamp-covered", categoryId: "swamp-airboat", title: "Covered swamp boat" },
  { id: "swamp-small-airboat", categoryId: "swamp-airboat", title: "Small airboat" },
  { id: "swamp-large-airboat", categoryId: "swamp-airboat", title: "Large airboat" },
  { id: "swamp-plantation", categoryId: "swamp-airboat", title: "Swamp plus plantation" },
  { id: "city-sightseeing", categoryId: "city-highlights", title: "City sightseeing" },
  { id: "city-river", categoryId: "city-highlights", title: "River cruise" },
  { id: "city-cocktails", categoryId: "city-highlights", title: "Cocktails and food" },
  { id: "city-ghosts", categoryId: "city-highlights", title: "Ghosts and spirits" },
  { id: "plantation-oak-alley", categoryId: "plantations-history", title: "Oak Alley" },
  { id: "plantation-whitney", categoryId: "plantations-history", title: "Whitney" },
  { id: "plantation-swamp", categoryId: "plantations-history", title: "Plantation plus swamp" },
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
      if (preferenceId === "swamp-covered") {
        return { primaryProductId: "swamp-bayou-tour", alternativeProductIds: ["covered-tour-boat"], explanation: "A classic, relaxed covered boat tour." };
      }
      if (preferenceId === "swamp-small-airboat") {
        return { primaryProductId: "small-airboat-swamp-adventure", alternativeProductIds: ["ragin-cajun-airboat-options"], explanation: "An intimate, fast-paced airboat ride." };
      }
      if (preferenceId === "swamp-large-airboat") {
        return { primaryProductId: "large-airboat-swamp-adventure", alternativeProductIds: ["ragin-cajun-airboat-options"], explanation: "A high-speed large airboat experience." };
      }
      if (preferenceId === "swamp-plantation") {
        return { primaryProductId: "swamp-boat-oak-alley-combo", alternativeProductIds: ["covered-boat-plantation-combo"], explanation: "A full day exploring both." };
      }
      return { explanation: "Explore our swamp options.", fallbackMessage: "Please choose a specific swamp experience." };

    case "city-highlights":
      if (preferenceId === "city-sightseeing") {
        return { primaryProductId: "city-cemetery-garden-district-tour", alternativeProductIds: ["city-tour-of-new-orleans"], explanation: "A comprehensive city overview." };
      }
      if (preferenceId === "city-river") {
        return { primaryProductId: "evening-jazz-cruise", alternativeProductIds: ["daytime-jazz-cruise"], explanation: "Experience the Mississippi River." };
      }
      if (preferenceId === "city-cocktails") {
        return { primaryProductId: "craft-cocktail-walking-tour", alternativeProductIds: ["cocktail-walking-tour"], explanation: "Taste the city's cocktail history." };
      }
      if (preferenceId === "city-ghosts") {
        return { primaryProductId: "ghosts-spirits-walking-tour", explanation: "Discover the haunted history." };
      }
      return { explanation: "Explore our city options.", fallbackMessage: "Please choose a specific city experience." };

    case "plantations-history":
      if (preferenceId === "plantation-oak-alley") {
        return { primaryProductId: "oak-alley-plantation-tour-grey-line", alternativeProductIds: ["oak-alley-or-laura-plantation-tour"], explanation: "Visit Oak Alley and compare the available historic-site options." };
      }
      if (preferenceId === "plantation-whitney") {
        return { primaryProductId: "whitney-plantation-tour", explanation: "Choose an experience centered on Whitney Plantation." };
      }
      if (preferenceId === "plantation-swamp") {
        return { primaryProductId: "swamp-boat-whitney-combo", alternativeProductIds: ["swamp-boat-oak-alley-combo"], explanation: "Combine a plantation visit with a swamp experience." };
      }
      return { explanation: "Explore our plantation options.", fallbackMessage: "Please choose a specific plantation experience." };

    case "haunted-after-dark":
      return {
        primaryProductId: "ghosts-spirits-walking-tour",
        alternativeProductIds: ["craft-cocktail-walking-tour"],
        explanation: "Explore New Orleans after dark with a ghosts-and-spirits walking experience."
      };

    case "food-cooking":
      return {
        primaryProductId: "craft-cocktail-walking-tour",
        alternativeProductIds: ["cocktail-walking-tour"],
        explanation: "Experience the city's cocktail and culinary heritage."
      };

    case "river-music":
      return {
        primaryProductId: "evening-jazz-cruise",
        alternativeProductIds: ["daytime-jazz-cruise", "sunday-jazz-brunch-cruise", "city-of-new-orleans-riverboat-cruise"],
        explanation: "See New Orleans from the Mississippi with a river-cruise experience."
      };

    case "full-day-combos":
      return {
        primaryProductId: "all-day-city-plantation-combo",
        alternativeProductIds: ["covered-boat-plantation-combo", "swamp-boat-oak-alley-combo", "swamp-boat-whitney-combo"],
        explanation: "Use a longer day to combine major New Orleans experiences in one outing."
      };

    default:
      return {
        explanation: "",
        fallbackMessage:
          "This category guide is being prepared. Explore other currently bookable experiences or contact us for help.",
      };
  }
}
