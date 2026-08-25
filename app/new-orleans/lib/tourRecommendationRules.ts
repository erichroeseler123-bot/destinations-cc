import { buildRecommendationShortlist } from "@/lib/recommendationEngine";
import { STOREFRONT_PRODUCTS } from "../tours/pageConfig";
import { getGovernedExperienceGraphRecord } from "../data/experienceGraphGovernance";
import {
  getDecisionEligibility,
  HELD_COMBO_REASON,
  HELD_COMBO_SLUG,
  SOUTHERN_STYLE_COMBO_DURATION_COPY,
  SOUTHERN_STYLE_COMBO_SLUG,
} from "../data/truthPolicy";

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
export type AirboatEligibility =
  | "No known airboat restrictions"
  | "Child under 5 in the group"
  | "Pregnancy in the group"
  | "Neck or back condition in the group"
  | "Not sure about airboat eligibility";

export interface RecommendationInputs {
  planningWindow: PlanningWindow | null;
  availableTime: AvailableTime | null;
  transportation: TransportationNeed | null;
  groupStyle: GroupStyle | null;
  mixedAges: ChildrenOrMixedAges | null;
  airboatEligibility: AirboatEligibility | null;
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
  "all-day-city-plantation-combo": { pace: "balanced", family: "neutral", history: "strong", exposure: "mixed", fullDay: true, transportation: "included" },
  "covered-boat-plantation-combo": { pace: "relaxed", family: "neutral", history: "strong", exposure: "mixed", fullDay: true, transportation: "included" },
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

const AIRBOAT_SLUGS = new Set([
  "ragin-cajun-airboat-options",
  "small-airboat-swamp-adventure",
  "large-airboat-swamp-adventure",
]);

function bestRangeMinutes(value: { min: number | null; typical: number | null; max: number | null } | null) {
  if (!value) return null;
  return value.typical ?? value.max ?? value.min ?? null;
}

function governedCommitmentMinutes(slug: string, transportation: TransportationNeed | null) {
  const graph = getGovernedExperienceGraphRecord(slug);
  if (!graph || graph.verificationStatus === "NEEDS_VERIFICATION") return null;

  if (transportation === "We need pickup or transportation") {
    return bestRangeMinutes(graph.doorToDoorWithPickupMinutes.value);
  }
  if (transportation === "We can drive ourselves") {
    return bestRangeMinutes(graph.doorToDoorSelfDriveMinutes.value) ?? bestRangeMinutes(graph.activityMinutes.value);
  }

  const pickup = bestRangeMinutes(graph.doorToDoorWithPickupMinutes.value);
  const selfDrive = bestRangeMinutes(graph.doorToDoorSelfDriveMinutes.value);
  const activity = bestRangeMinutes(graph.activityMinutes.value);
  const known = [pickup, selfDrive, activity].filter((value): value is number => typeof value === "number");
  return known.length ? Math.max(...known) : null;
}

export function getRecommendationEligibility(slug: string) {
  return getDecisionEligibility(slug);
}

export const TOUR_RECORDS: Record<string, TourRecord> = Object.fromEntries(
  STOREFRONT_PRODUCTS.map((product) => {
    const profile = PROFILES[product.slug] || {};
    const governed = governedCommitmentMinutes(product.slug, "Not sure");
    const isSouthernFlexibleCombo = product.slug === SOUTHERN_STYLE_COMBO_SLUG;
    const isHeldCombo = product.slug === HELD_COMBO_SLUG;
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
      estimatedExperienceMinutes: isSouthernFlexibleCombo || isHeldCombo ? null : profile.minutes || null,
      estimatedTotalCommitmentMinutes: isSouthernFlexibleCombo || isHeldCombo ? null : governed ?? profile.minutes ?? null,
      verifiedDurationLabel: isSouthernFlexibleCombo
        ? SOUTHERN_STYLE_COMBO_DURATION_COPY
        : isHeldCombo
          ? "Duration pending operator verification."
          : product.durationLabel || (profile.minutes ? `About ${Math.round(profile.minutes / 60)} hours` : "Confirm during booking"),
      verifiedTimeCommitmentLabel: isSouthernFlexibleCombo
        ? SOUTHERN_STYLE_COMBO_DURATION_COPY
        : isHeldCombo
          ? HELD_COMBO_REASON
          : governed
            ? "Use the governed door-to-door time for the transportation option you choose."
            : profile.fullDay ? "Plan for most of the day." : "Confirm current departure and return timing before booking.",
    } satisfies TourRecord];
  })
);

export interface RecommendationResult {
  primary: { slug: string; reasons: string[]; cautionReasons: string[] } | null;
  secondary?: { slug: string; reasons: string[] };
  isNoFit: boolean;
}

type ScoredTour = {
  slug: string;
  score: number;
  eligible: boolean;
  reasons: string[];
  cautions: string[];
  sourceIndex: number;
};

export function evaluateRecommendation(inputs: RecommendationInputs, live: LiveRecommendationContext = {}): RecommendationResult {
  if (!inputs.availableTime || !inputs.transportation || !inputs.groupStyle || !inputs.mixedAges || !inputs.airboatEligibility || !inputs.historicalInterest) {
    return { primary: null, isNoFit: true };
  }

  const maxMinutes = inputs.availableTime === "About 3 hours" ? 210 : inputs.availableTime === "About half a day" ? 360 : 600;
  const tonight = inputs.planningWindow === "Something for today" && live.period === "evening";
  const airboatEligible = inputs.airboatEligibility === "No known airboat restrictions";

  const scored: ScoredTour[] = STOREFRONT_PRODUCTS.map((product, sourceIndex) => {
    const profile = PROFILES[product.slug] || {};
    const governedMinutes = governedCommitmentMinutes(product.slug, inputs.transportation);
    const commitmentMinutes = product.slug === SOUTHERN_STYLE_COMBO_SLUG || product.slug === HELD_COMBO_SLUG
      ? null
      : governedMinutes ?? profile.minutes ?? null;
    const reasons: string[] = [];
    const cautions: string[] = [];
    let score = 0;
    const truthEligibility = getDecisionEligibility(product.slug);
    let eligible = truthEligibility.eligibility;
    if (!eligible && truthEligibility.reason) cautions.push(truthEligibility.reason);

    // Hard constraints are applied before any preference scoring.
    if (AIRBOAT_SLUGS.has(product.slug) && !airboatEligible) eligible = false;
    if (commitmentMinutes && commitmentMinutes > maxMinutes) eligible = false;
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
      if (profile.family === "adult" || profile.cocktails) {
        score -= 8;
        cautions.push("This is primarily an adult-oriented experience.");
      } else if (profile.evening && profile.family !== "good") {
        score -= 3;
        cautions.push("This after-dark format may be a weaker fit for a mixed-age group.");
      }
    }

    if (inputs.historicalInterest === "Strong interest") {
      if (profile.history === "strong") { score += 7; reasons.push("Strongly matches your interest in New Orleans and Louisiana history."); }
      if (profile.history === "low") score -= 4;
      if (product.slug === "whitney-plantation-tour") {
        score += 3;
        reasons.push("Whitney is especially strong when understanding plantation history is the priority.");
      }
      if (product.slug === "city-cemetery-garden-district-tour") score += 2;
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

    if (inputs.availableTime === "About 3 hours" && commitmentMinutes && commitmentMinutes <= 180) {
      score += 4;
      reasons.push(governedMinutes
        ? "The governed time commitment fits comfortably inside the time you selected."
        : "The published activity duration fits comfortably inside the time you selected; confirm the full door-to-door commitment before booking.");
    }
    if (inputs.availableTime === "Most of the day" && profile.fullDay && product.slug !== HELD_COMBO_SLUG) {
      score += 5;
      reasons.push("Makes good use of the larger block of time you have available.");
    }

    if (inputs.transportation === "We need pickup or transportation") {
      if (profile.transportation === "included") { score += 4; reasons.push("Transportation is built into or described with this experience."); }
      if (profile.transportation === "self") score -= 2;
    }

    if (!governedMinutes && inputs.availableTime !== "Most of the day" && product.slug !== HELD_COMBO_SLUG) {
      cautions.push("Full door-to-door time is not yet verified; confirm the return window before booking around another timed plan.");
    }

    if (live.period === "evening") {
      if (profile.evening) score += 5;
      if (profile.morning) score -= 3;
    }
    if (live.period === "morning" && profile.morning) score += 4;
    if (live.liveMusicSignal && profile.music) { score += 4; reasons.push("The current live-music context makes this especially timely."); }
    if (live.period === "evening" && live.liveMusicSignal && product.slug === "evening-jazz-cruise") {
      score += 5;
      reasons.push("Evening timing plus a live-music signal makes the jazz cruise especially timely.");
    }
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

    const clearEnoughForOutdoors = live.rainRisk === "low" || live.outdoorFriendly;
    if (
      product.slug === "covered-tour-boat" &&
      live.period === "morning" &&
      clearEnoughForOutdoors &&
      inputs.groupStyle === "Relaxed and comfortable" &&
      inputs.mixedAges === "Yes"
    ) {
      score += 6;
      reasons.push("A clear morning plus a relaxed mixed-age group is an especially strong match for the covered swamp boat.");
    }

    if (
      AIRBOAT_SLUGS.has(product.slug) &&
      (live.period === "morning" || live.period === "afternoon") &&
      clearEnoughForOutdoors &&
      inputs.groupStyle === "Fast and adventurous"
    ) {
      score += 5;
      reasons.push("Clear daytime conditions strengthen the fit for an adventurous airboat option.");
    }

    return { slug: product.slug, score, eligible, reasons, cautions, sourceIndex };
  });

  const eligiblePositive = scored.filter((item) => item.eligible && item.score > 0);
  const shortlist = buildRecommendationShortlist({
    candidates: eligiblePositive,
    limit: 2,
    evaluate: (item) => ({
      key: item.slug,
      score: item.score,
      exactMatch: true,
      reason: item.reasons[0] || "Strong overall fit",
    }),
    tieBreak: (a, b) => a.candidate.sourceIndex - b.candidate.sourceIndex,
  });
  const ranked = shortlist.recommendations.map((item) => item.candidate);

  if (!ranked.length) return { primary: null, isNoFit: true };

  const primary = ranked[0];
  const secondary = ranked[1];

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
