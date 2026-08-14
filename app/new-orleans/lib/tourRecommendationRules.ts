import { OFFICIAL_TOUR_FACTS } from "../data/officialTourFacts";
import { TOUR_KNOWLEDGE } from "../data/tourKnowledge";
import { rankTours, type DecisionRequest } from "../data/decisionEngine";

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

export interface TourRecord {
  slug: string;
  id: string;
  operator: string;
  experienceType: string;
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

const CORE_TOUR_RECORDS: Record<string, TourRecord> = {
  "city-tour-of-new-orleans": {
    slug: "city-tour-of-new-orleans", id: "southernstyle-city-tour", operator: "Southern Style Tours", experienceType: "City Overview", pace: "Balanced", familyFit: "Suitable for most ages", transportationAvailable: "Yes (minibus)", historicalDepth: "Some interest", weatherExposure: "Mostly enclosed", noiseLevel: "Low", estimatedExperienceMinutes: null, estimatedTotalCommitmentMinutes: null, verifiedDurationLabel: "Duration varies by traffic and route. Check estimates during booking.", verifiedTimeCommitmentLabel: "Complete time commitment varies with traffic and pickup route. Confirm during checkout.",
  },
  "oak-alley-or-laura-plantation-tour": {
    slug: "oak-alley-or-laura-plantation-tour", id: "southernstyle-plantation", operator: "Southern Style Tours", experienceType: "Plantation Tour", pace: "Balanced", familyFit: "Older children and adults", transportationAvailable: "Yes (minibus)", historicalDepth: "Strong interest", weatherExposure: "Mixed indoor/outdoor", noiseLevel: "Low", estimatedExperienceMinutes: null, estimatedTotalCommitmentMinutes: null, verifiedDurationLabel: "Tour duration varies. Exact schedule confirmed during booking.", verifiedTimeCommitmentLabel: "Pickup and return timing may make the complete outing longer. Confirm during checkout.",
  },
  "covered-tour-boat": {
    slug: "covered-tour-boat", id: "ragincajun-covered-boat", operator: "Ragin Cajun Tours", experienceType: "Swamp Tour", pace: "Relaxed and comfortable", familyFit: "Suitable for mixed ages", transportationAvailable: "Confirm in checkout", historicalDepth: "Not the priority", weatherExposure: "Shaded / Covered boat", noiseLevel: "Moderate", estimatedExperienceMinutes: null, estimatedTotalCommitmentMinutes: null, verifiedDurationLabel: "Duration confirmed during booking.", verifiedTimeCommitmentLabel: "Complete time commitment varies with the selected option and transportation. Confirm during checkout.",
  },
  "ragin-cajun-airboat-options": {
    slug: "ragin-cajun-airboat-options", id: "ragincajun-airboat", operator: "Ragin Cajun Tours", experienceType: "Airboat Ride", pace: "Fast and adventurous", familyFit: "Confirm child eligibility during checkout", transportationAvailable: "Confirm in checkout", historicalDepth: "Not the priority", weatherExposure: "Open-air exposure", noiseLevel: "Loud", estimatedExperienceMinutes: null, estimatedTotalCommitmentMinutes: null, verifiedDurationLabel: "Duration confirmed during booking.", verifiedTimeCommitmentLabel: "Complete time commitment varies with the selected option and transportation. Confirm during checkout.",
  },
  "all-day-city-plantation-combo": {
    slug: "all-day-city-plantation-combo", id: "southernstyle-city-plantation-combo", operator: "Southern Style Tours", experienceType: "City and Plantation Combo", pace: "Full-day combination", familyFit: "Ages 4 and older", transportationAvailable: "Morning pickup included", historicalDepth: "City and plantation history", weatherExposure: "Varies by itinerary segment", noiseLevel: "Confirm with operator", estimatedExperienceMinutes: 480, estimatedTotalCommitmentMinutes: 480, verifiedDurationLabel: "8 hours", verifiedTimeCommitmentLabel: "Plan for the full 8-hour combined experience.",
  },
  "covered-boat-plantation-combo": {
    slug: "covered-boat-plantation-combo", id: "ragincajun-covered-plantation-combo", operator: "Ragin Cajun Airboat Tours", experienceType: "Covered Boat and Plantation Combo", pace: "Full-day combination", familyFit: "Ages 5 and older; adult and child pricing types are available", transportationAvailable: "Transportation and pickup included", historicalDepth: "Plantation history and swamp experience", weatherExposure: "Varies by itinerary segment", noiseLevel: "Confirm with operator", estimatedExperienceMinutes: 420, estimatedTotalCommitmentMinutes: 420, verifiedDurationLabel: "Approximately 7 hours", verifiedTimeCommitmentLabel: "Plan for approximately 7 hours.",
  },
};

export const TOUR_RECORDS: Record<string, TourRecord> = { ...CORE_TOUR_RECORDS };
for (const [slug, facts] of Object.entries(OFFICIAL_TOUR_FACTS)) {
  if (TOUR_RECORDS[slug]) continue;
  TOUR_RECORDS[slug] = {
    slug, id: `official-${slug}`, operator: facts.sourceLabel.split(" — ")[0] || "Gray Line New Orleans", experienceType: "Operator-published tour", pace: facts.pace, familyFit: "Verify current age and accessibility requirements in checkout", transportationAvailable: facts.transportation, historicalDepth: "Verify with operator", weatherExposure: facts.weatherExposure, noiseLevel: facts.noiseLevel, estimatedExperienceMinutes: null, estimatedTotalCommitmentMinutes: null, verifiedDurationLabel: facts.duration, verifiedTimeCommitmentLabel: facts.completeTime,
  };
}

export interface RecommendationResult {
  primary: { slug: string; reasons: string[]; cautionReasons: string[] } | null;
  secondary?: { slug: string; reasons: string[] };
  isNoFit: boolean;
}

function requestFromInputs(inputs: RecommendationInputs): DecisionRequest {
  const availableMinutes = inputs.availableTime === "About 3 hours" ? 180 : inputs.availableTime === "About half a day" ? 300 : 600;
  const preferences: string[] = [];
  if (inputs.groupStyle === "Relaxed and comfortable") preferences.push("covered", "relaxed", "city");
  if (inputs.groupStyle === "Fast and adventurous") preferences.push("airboat", "adventure");
  if (inputs.groupStyle === "Balanced") preferences.push("city-sightseeing");
  if (inputs.historicalInterest === "Strong interest") preferences.push("plantations", "history");
  if (inputs.historicalInterest === "Some interest") preferences.push("city-sightseeing", "history");
  if (inputs.historicalInterest === "Not the priority") preferences.push("swamp-bayou", "airboat", "river-cruises");

  return {
    availableMinutes,
    situation: inputs.planningWindow === "Something for today" ? "today" : "general",
    needsTransportation: inputs.transportation === "We need pickup or transportation",
    mixedAgeGroup: inputs.mixedAges === "Yes" || inputs.planningWindow === "A family or mixed-age group",
    preferences,
  };
}

export function evaluateRecommendation(inputs: RecommendationInputs): RecommendationResult {
  if (!inputs.availableTime || !inputs.transportation || !inputs.groupStyle || !inputs.mixedAges || !inputs.historicalInterest) {
    return { primary: null, isNoFit: true };
  }

  const candidateTours = TOUR_KNOWLEDGE.filter((tour) => Boolean(TOUR_RECORDS[tour.slug]));
  const ranked = rankTours(candidateTours, requestFromInputs(inputs)).filter((result) => result.eligible);
  const primary = ranked[0];
  if (!primary) return { primary: null, isNoFit: true };

  const primaryReasons = primary.reasons.length ? primary.reasons.slice(0, 5) : ["Best overall fit for the answers you selected."];
  const cautionReasons = [...primary.warnings, ...primary.tour.bookingConfirmations].slice(0, 5);
  const secondary = ranked[1]
    ? {
        slug: ranked[1].tour.slug,
        reasons: ranked[1].reasons.length ? ranked[1].reasons.slice(0, 3) : ["Also fits several of your stated preferences."],
      }
    : undefined;

  return {
    primary: { slug: primary.tour.slug, reasons: primaryReasons, cautionReasons },
    secondary,
    isNoFit: false,
  };
}
