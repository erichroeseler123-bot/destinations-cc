import { STOREFRONT_PRODUCTS } from "../tours/pageConfig";

export type PlanningWindow =
  | "Something for today"
  | "Something for tomorrow"
  | "A first New Orleans experience"
  | "A family or mixed-age group"
  | "A group that needs help deciding";

export type AvailableTime = "About 3 hours" | "About half a day" | "Most of the day";
export type TransportationNeed = "We need pickup or transportation" | "We can drive ourselves" | "Not sure";
export type GroupStyle = "Relaxed and comfortable" | "Balanced" | "Fast and adventurous";
export type ChildrenOrMixedAges = "Yes" | "No";
export type HistoricalInterest = "Strong interest" | "Some interest" | "Not the priority";

export interface RecommendationInputs {
  planningWindow: PlanningWindow | null;
  availableTime: AvailableTime | null;
  transportation: TransportationNeed | null;
  groupStyle: GroupStyle | null;
  mixedAges: ChildrenOrMixedAges | null;
  historicalInterest: HistoricalInterest | null;
}

export interface LiveRecommendationContext {
  period?: "morning" | "afternoon" | "evening";
  rainRisk?: "low" | "elevated" | "high";
  heatRisk?: "low" | "elevated" | "high";
  liveMusicSignal?: boolean;
  outdoorFriendly?: boolean;
}

export interface TourRecord {
  slug: string;
  id: string;
  operator: string;
  experienceType: string;
  category: string;
  pace: string;
  familyFit: string;
  transportationAvailable: string;
  historicalDepth: string;
  weatherExposure: string;
  noiseLevel: string;
  estimatedExperienceMinutes: number | null;
  estimatedTotalCommitmentMinutes: number | null;
  verifiedDurationLabel: string;
  verifiedTimeCommitmentLabel: string;
}

type Profile = {
  minutes?: number;
  pace?: "relaxed" | "balanced" | "adventurous";
  family?: "good" | "neutral" | "adult";
  history?: "strong" | "some" | "low";
  exposure?: "covered" | "mixed" | "outdoor" | "indoor";
  evening?: boolean;
  morning?: boolean;
  fullDay?: boolean;
  music?: boolean;
  cocktails?: boolean;
  transportation?: "included" | "available" | "self" | "unknown";
};

const PROFILES: Record<string, Profile> = {
  "city-tour-of-new-orleans": { minutes: 180, pace: "balanced", family: "good", history: "some", exposure: "covered", transportation: "included" },
  "oak-alley-or-laura-plantation-tour": { minutes: 330, pace: "balanced", family: "neutral", history: "strong", exposure: "mixed", transportation: "included" },
  "covered-tour-boat": { minutes: 210, pace: "relaxed", family: "good", history: "low", exposure: "covered", morning: true, transportation: "available" },
  "ragin-cajun-airboat-options": { minutes: 210, pace: "adventurous", family: "neutral", history: "low", exposure: "outdoor", morning: true, transportation: "available" },
  "all-day-city-plantation-combo": { minutes: 480, pace: "balanced", family: "neutral", history: "strong", exposure: "mixed", fullDay: true, transportation: "included" },
  "covered-boat-plantation-combo": { minutes: 420, pace: "relaxed", family: "neutral", history: "strong", exposure: "mixed", fullDay: true, transportation: "included" },
  "evening-jazz-cruise": { minutes: 150, pace: "relaxed", family: "good", history: "low", exposure: "mixed", evening: true, music: true, transportation: "self" },
  "daytime-jazz-cruise": { minutes: 150, pace: "relaxed", family: "good", history: "low", exposure: "mixed", music: true, transportation: "self" },
  "sunday-jazz-brunch-cruise": { minutes: 180, pace: "relaxed", family: "good", history: "low", exposure: "mixed", morning: true, music: true, transportation: "self" },
  "oak-alley-plantation-tour-grey-line": { minutes: 330, pace: "balanced", family: "neutral", history: "strong", exposure: "mixed", transportation: "included" },
  "whitney-plantation-tour": { minutes: 330, pace: "balanced", family: "neutral", history: "strong", exposure: "mixed", transportation: "included" },
  "swamp-bayou-tour": { minutes: 240, pace: "relaxed", family: "good", history: "low", exposure: "covered", morning: true, transportation: "included" },
  "small-airboat-swamp-adventure": { minutes: 240, pace: "adventurous", family: "neutral", history: "low", exposure: "outdoor", morning: true, transportation: "included" },
  "large-airboat-swamp-adventure": { minutes: 240, pace: "adventurous", family: "neutral", history: "low", exposure: "outdoor", morning: true, transportation: "included" },
  "swamp-boat-oak-alley-combo": { minutes: 480, pace: "balanced", family: "neutral", history: "strong", exposure: "mixed", fullDay: true, transportation: "included" },
  "swamp-boat-whitney-combo": { minutes: 480, pace: "balanced", family: "neutral", history: "strong", exposure: "mixed", fullDay: true, transportation: "included" },
  "cocktail-walking-tour": { minutes: 150, pace: "balanced", family: "adult", history: "some", exposure: "outdoor", evening: true, cocktails: true, transportation: "self" },
  "craft-cocktail-walking-tour": { minutes: 150, pace: "balanced", family: "adult", history: "some", exposure: "outdoor", evening: true, cocktails: true, transportation: "self" },
  "ghosts-spirits-walking-tour": { minutes: 120, pace: "balanced", family: "neutral", history: "some", exposure: "outdoor", evening: true, transportation: "self" },
  "city-cemetery-garden-district-tour": { minutes: 180, pace: "balanced", family: "good", history: "strong", exposure: "mixed", transportation: "included" },
  "city-of-new-orleans-riverboat-cruise": { minutes: 75, pace: "relaxed", family: "good", history: "low", exposure: "mixed", transportation: "self" },
};

export const TOUR_RECORDS: Record<string, TourRecord> = Object.fromEntries(
  STOREFRONT_PRODUCTS.map((product) => {
    const profile = PROFILES[product.slug] || {};
    return [product.slug, {
      slug: product.slug,
      id: product.id,
      operator: product.operatorName,
      experienceType: product.title,
      category: product.category,
      pace: profile.pace || "balanced",
      familyFit: profile.family === "adult" ? "Best for adults" : profile.family === "good" ? "Good for mixed ages" : "Check age requirements",
      transportationAvailable: profile.transportation === "included" ? "Transportation included or described by operator" : profile.transportation === "available" ? "Transportation may be available" : profile.transportation === "self" ? "Meet at departure point" : "Confirm during booking",
      historicalDepth: profile.history || "some",
      weatherExposure: profile.exposure || "mixed",
      noiseLevel: profile.pace === "adventurous" ? "Higher" : "Moderate",
      estimatedExperienceMinutes: profile.minutes || null,
      estimatedTotalCommitmentMinutes: profile.minutes || null,
      verifiedDurationLabel: product.durationLabel || (profile.minutes ? `About ${Math.round(profile.minutes / 60)} hours` : "Confirm during booking"),
      verifiedTimeCommitmentLabel: profile.fullDay ? "Plan for most of the day." : "Confirm current departure and return timing before booking.",
    } satisfies TourRecord];
  })
);

export interface RecommendationResult {
  primary: { slug: string; reasons: string[]; cautionReasons: string[] } | null;
  secondary?: { slug: string; reasons: string[] };
  isNoFit: boolean;
}

export function evaluateRecommendation(inputs: RecommendationInputs, live: LiveRecommendationContext = {}): RecommendationResult {
  if (!inputs.availableTime || !inputs.transportation || !inputs.groupStyle || !inputs.mixedAges || !inputs.historicalInterest) {
    return { primary: null, isNoFit: true };
  }

  const maxMinutes = inputs.availableTime === "About 3 hours" ? 210 : inputs.availableTime === "About half a day" ? 360 : 600;
  const tonight = inputs.planningWindow === "Something for today" && live.period === "evening";

  const ranked = STOREFRONT_PRODUCTS.map((product) => {
    const profile = PROFILES[product.slug] || {};
    const reasons: string[] = [];
    const cautions: string[] = [];
    let score = 0;
    let eligible = true;

    if (profile.minutes && profile.minutes > maxMinutes) eligible = false;
    if (inputs.availableTime !== "Most of the day" && profile.fullDay) eligible = false;
    if (tonight && (product.category.includes("Plantation") || product.category.includes("Swamp") || product.category.includes("Airboat") || profile.fullDay)) eligible = false;

    if (inputs.groupStyle === "Relaxed and comfortable") {
      if (profile.pace === "relaxed") { score += 5; reasons.push("Matches your preference for a relaxed, comfortable pace."); }
      if (profile.pace === "adventurous") score -= 5;
    }
    if (inputs.groupStyle === "Balanced" && profile.pace === "balanced") { score += 4; reasons.push("Fits the balanced pace you selected."); }
    if (inputs.groupStyle === "Fast and adventurous") {
      if (profile.pace === "adventurous") { score += 6; reasons.push("Matches your preference for something faster and more adventurous."); }
      if (profile.pace === "relaxed") score -= 2;
    }

    if (inputs.mixedAges === "Yes") {
      if (profile.family === "good") { score += 4; reasons.push("A stronger fit for a family or mixed-age group."); }
      if (profile.family === "adult" || profile.cocktails) { score -= 8; cautions.push("This is primarily an adult-oriented experience."); }
    }

    if (inputs.historicalInterest === "Strong interest") {
      if (profile.history === "strong") { score += 7; reasons.push("Strongly matches your interest in New Orleans and Louisiana history."); }
      if (profile.history === "low") score -= 4;
    } else if (inputs.historicalInterest === "Some interest" && (profile.history === "some" || profile.history === "strong")) {
      score += 3;
      reasons.push("Includes meaningful historical context without making history the only focus.");
    } else if (inputs.historicalInterest === "Not the priority" && profile.history === "low") {
      score += 3;
    }

    if (inputs.planningWindow === "A first New Orleans experience") {
      if (["city-tour-of-new-orleans", "evening-jazz-cruise", "daytime-jazz-cruise", "city-cemetery-garden-district-tour"].includes(product.slug)) {
        score += 5;
        reasons.push("A strong first-visit introduction to New Orleans.");
      }
    }

    if (inputs.availableTime === "About 3 hours" && profile.minutes && profile.minutes <= 180) {
      score += 4;
      reasons.push("Fits comfortably inside the time you have available.");
    }
    if (inputs.availableTime === "Most of the day" && profile.fullDay) {
      score += 5;
      reasons.push("Makes good use of the larger block of time you have available.");
    }

    if (inputs.transportation === "We need pickup or transportation") {
      if (profile.transportation === "included") { score += 4; reasons.push("Transportation is built into or described with this experience."); }
      if (profile.transportation === "self") score -= 2;
    }

    if (live.period === "evening") {
      if (profile.evening) score += 5;
      if (profile.morning) score -= 3;
    }
    if (live.period === "morning" && profile.morning) score += 4;
    if (live.liveMusicSignal && profile.music) { score += 4; reasons.push("The current live-music context makes this especially timely."); }
    if ((live.rainRisk === "high" || live.rainRisk === "elevated") && profile.exposure === "outdoor") {
      score -= live.rainRisk === "high" ? 7 : 3;
      cautions.push("Current rain risk makes this more weather-sensitive.");
    }
    if (live.rainRisk === "high" && profile.exposure === "covered") score += 3;
    if (live.heatRisk === "high" && profile.exposure === "outdoor") {
      score -= 3;
      cautions.push("Heat may make this less comfortable at the current time of day.");
    }
    if (live.outdoorFriendly && (profile.exposure === "outdoor" || profile.exposure === "mixed")) score += 2;

    return { slug: product.slug, score, eligible, reasons, cautions };
  })
    .filter((item) => item.eligible)
    .sort((a, b) => b.score - a.score);

  if (!ranked.length || ranked[0].score <= 0) return { primary: null, isNoFit: true };

  const primary = ranked[0];
  const secondary = ranked.find((item, index) => index > 0 && item.score > 0 && item.slug !== primary.slug);

  return {
    primary: {
      slug: primary.slug,
      reasons: primary.reasons.slice(0, 3).length ? primary.reasons.slice(0, 3) : ["This is the strongest overall fit for the combination of answers you gave us."],
      cautionReasons: primary.cautions.slice(0, 2),
    },
    secondary: secondary ? {
      slug: secondary.slug,
      reasons: secondary.reasons.slice(0, 2).length ? secondary.reasons.slice(0, 2) : ["A strong alternative if you want a slightly different pace or format."],
    } : undefined,
    isNoFit: false,
  };
}
