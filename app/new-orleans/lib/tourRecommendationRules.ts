import { OFFICIAL_TOUR_FACTS } from "../data/officialTourFacts";

export type PlanningWindow =
  | "Something for today"
  | "Something for tomorrow"
  | "A first New Orleans experience"
  | "A family or mixed-age group"
  | "A group that needs help deciding";

export type AvailableTime =
  | "About 3 hours"
  | "About half a day"
  | "Most of the day";

export type TransportationNeed =
  | "We need pickup or transportation"
  | "We can drive ourselves"
  | "Not sure";

export type GroupStyle =
  | "Relaxed and comfortable"
  | "Balanced"
  | "Fast and adventurous";

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
    slug: "city-tour-of-new-orleans",
    id: "southernstyle-city-tour",
    operator: "Southern Style Tours",
    experienceType: "City Overview",
    pace: "Balanced",
    familyFit: "Suitable for most ages",
    transportationAvailable: "Yes (minibus)",
    historicalDepth: "Some interest",
    weatherExposure: "Mostly enclosed",
    noiseLevel: "Low",
    estimatedExperienceMinutes: null,
    estimatedTotalCommitmentMinutes: null,
    verifiedDurationLabel: "Duration varies by traffic and route. Check estimates during booking.",
    verifiedTimeCommitmentLabel: "Complete time commitment varies with traffic and pickup route. Confirm during checkout.",
  },
  "oak-alley-or-laura-plantation-tour": {
    slug: "oak-alley-or-laura-plantation-tour",
    id: "southernstyle-plantation",
    operator: "Southern Style Tours",
    experienceType: "Plantation Tour",
    pace: "Balanced",
    familyFit: "Older children and adults",
    transportationAvailable: "Yes (minibus)",
    historicalDepth: "Strong interest",
    weatherExposure: "Mixed indoor/outdoor",
    noiseLevel: "Low",
    estimatedExperienceMinutes: null,
    estimatedTotalCommitmentMinutes: null,
    verifiedDurationLabel: "Tour duration varies. Exact schedule confirmed during booking.",
    verifiedTimeCommitmentLabel: "Pickup and return timing may make the complete outing longer. Confirm during checkout.",
  },
  "covered-tour-boat": {
    slug: "covered-tour-boat",
    id: "ragincajun-covered-boat",
    operator: "Ragin Cajun Tours",
    experienceType: "Swamp Tour",
    pace: "Relaxed and comfortable",
    familyFit: "Suitable for mixed ages",
    transportationAvailable: "Confirm in checkout",
    historicalDepth: "Not the priority",
    weatherExposure: "Shaded / Covered boat",
    noiseLevel: "Moderate",
    estimatedExperienceMinutes: null,
    estimatedTotalCommitmentMinutes: null,
    verifiedDurationLabel: "Duration confirmed during booking.",
    verifiedTimeCommitmentLabel: "Complete time commitment varies with the selected option and transportation. Confirm during checkout.",
  },
  "ragin-cajun-airboat-options": {
    slug: "ragin-cajun-airboat-options",
    id: "ragincajun-airboat",
    operator: "Ragin Cajun Tours",
    experienceType: "Airboat Ride",
    pace: "Fast and adventurous",
    familyFit: "Confirm child eligibility during checkout",
    transportationAvailable: "Confirm in checkout",
    historicalDepth: "Not the priority",
    weatherExposure: "Open-air exposure",
    noiseLevel: "Loud",
    estimatedExperienceMinutes: null,
    estimatedTotalCommitmentMinutes: null,
    verifiedDurationLabel: "Duration confirmed during booking.",
    verifiedTimeCommitmentLabel: "Complete time commitment varies with the selected option and transportation. Confirm during checkout.",
  },
  "all-day-city-plantation-combo": {
    slug: "all-day-city-plantation-combo",
    id: "southernstyle-city-plantation-combo",
    operator: "Southern Style Tours",
    experienceType: "City and Plantation Combo",
    pace: "Full-day combination",
    familyFit: "Ages 4 and older",
    transportationAvailable: "Morning pickup included",
    historicalDepth: "City and plantation history",
    weatherExposure: "Varies by itinerary segment",
    noiseLevel: "Confirm with operator",
    estimatedExperienceMinutes: 480,
    estimatedTotalCommitmentMinutes: 480,
    verifiedDurationLabel: "8 hours",
    verifiedTimeCommitmentLabel: "Plan for the full 8-hour combined experience.",
  },
  "covered-boat-plantation-combo": {
    slug: "covered-boat-plantation-combo",
    id: "ragincajun-covered-plantation-combo",
    operator: "Ragin Cajun Airboat Tours",
    experienceType: "Covered Boat and Plantation Combo",
    pace: "Full-day combination",
    familyFit: "Ages 5 and older; adult and child pricing types are available",
    transportationAvailable: "Transportation and pickup included",
    historicalDepth: "Plantation history and swamp experience",
    weatherExposure: "Varies by itinerary segment",
    noiseLevel: "Confirm with operator",
    estimatedExperienceMinutes: 420,
    estimatedTotalCommitmentMinutes: 420,
    verifiedDurationLabel: "Approximately 7 hours",
    verifiedTimeCommitmentLabel: "Plan for approximately 7 hours.",
  },
};

export const TOUR_RECORDS: Record<string, TourRecord> = { ...CORE_TOUR_RECORDS };

for (const [slug, facts] of Object.entries(OFFICIAL_TOUR_FACTS)) {
  if (TOUR_RECORDS[slug]) continue;
  TOUR_RECORDS[slug] = {
    slug,
    id: `official-${slug}`,
    operator: facts.sourceLabel.split(" — ")[0] || "Gray Line New Orleans",
    experienceType: "Operator-published tour",
    pace: facts.pace,
    familyFit: "Verify current age and accessibility requirements in checkout",
    transportationAvailable: facts.transportation,
    historicalDepth: "Verify with operator",
    weatherExposure: facts.weatherExposure,
    noiseLevel: facts.noiseLevel,
    estimatedExperienceMinutes: null,
    estimatedTotalCommitmentMinutes: null,
    verifiedDurationLabel: facts.duration,
    verifiedTimeCommitmentLabel: facts.completeTime,
  };
}

export interface RecommendationResult {
  primary: { slug: string; reasons: string[]; cautionReasons: string[] } | null;
  secondary?: { slug: string; reasons: string[] };
  isNoFit: boolean;
}

export function evaluateRecommendation(inputs: RecommendationInputs): RecommendationResult {
  if (!inputs.availableTime || !inputs.transportation || !inputs.groupStyle || !inputs.mixedAges || !inputs.historicalInterest) {
    return { primary: null, isNoFit: true };
  }

  let cityEligible = true;
  let plantationEligible = true;
  let coveredBoatEligible = true;
  let airboatEligible = true;

  if (inputs.availableTime === "About 3 hours") {
    plantationEligible = false;
    coveredBoatEligible = false;
    airboatEligible = false;
  }
  if (inputs.availableTime === "About half a day") plantationEligible = false;
  if (inputs.historicalInterest === "Strong interest") {
    coveredBoatEligible = false;
    airboatEligible = false;
  }
  if (inputs.groupStyle === "Fast and adventurous") {
    cityEligible = false;
    plantationEligible = false;
    coveredBoatEligible = false;
  }
  if (inputs.groupStyle === "Relaxed and comfortable") airboatEligible = false;

  let cityScore = 0;
  let plantationScore = 0;
  let coveredBoatScore = 0;
  let airboatScore = 0;

  if (inputs.planningWindow === "A first New Orleans experience") cityScore += 2;
  if (inputs.availableTime === "About 3 hours") cityScore += 3;
  if (inputs.historicalInterest === "Some interest") cityScore += 2;
  if (inputs.transportation === "We need pickup or transportation" || inputs.transportation === "Not sure") cityScore += 1;
  if (inputs.groupStyle === "Balanced") cityScore += 2;

  if (inputs.historicalInterest === "Strong interest") plantationScore += 4;
  if (inputs.availableTime === "Most of the day") plantationScore += 3;
  if (inputs.availableTime === "About half a day") plantationScore += 1;

  if (inputs.groupStyle === "Relaxed and comfortable") coveredBoatScore += 3;
  if (inputs.mixedAges === "Yes") coveredBoatScore += 2;
  if (inputs.historicalInterest === "Not the priority") coveredBoatScore += 1;

  if (inputs.groupStyle === "Fast and adventurous") airboatScore += 3;
  if (inputs.mixedAges === "No") airboatScore += 2;
  if (inputs.historicalInterest === "Not the priority") airboatScore += 1;

  const sorted = [
    { slug: "city-tour-of-new-orleans", score: cityScore, eligible: cityEligible },
    { slug: "oak-alley-or-laura-plantation-tour", score: plantationScore, eligible: plantationEligible },
    { slug: "covered-tour-boat", score: coveredBoatScore, eligible: coveredBoatEligible },
    { slug: "ragin-cajun-airboat-options", score: airboatScore, eligible: airboatEligible },
  ].filter((item) => item.eligible).sort((a, b) => b.score - a.score);

  if (sorted.length === 0 || sorted[0].score === 0) return { primary: null, isNoFit: true };

  const primarySlug = sorted[0].slug;
  const reasons: string[] = [];
  const cautions: string[] = [];

  if (primarySlug === "city-tour-of-new-orleans") {
    reasons.push("A great balanced introduction to the city.");
    if (inputs.availableTime === "About 3 hours") reasons.push("Fits within your roughly 3-hour window.");
    if (inputs.historicalInterest === "Some interest") reasons.push("Provides engaging historical context without taking the whole day.");
    cautions.push("Traffic can affect exact durations and pickup routes.");
  } else if (primarySlug === "oak-alley-or-laura-plantation-tour") {
    reasons.push("Directly answers your strong historical interest.");
    if (inputs.availableTime === "Most of the day") reasons.push("Matches your available time for a longer commitment.");
    cautions.push("Confirm the selected plantation site and return timing in checkout.");
  } else if (primarySlug === "covered-tour-boat") {
    reasons.push("Offers a relaxed, comfortable ride format.");
    if (inputs.mixedAges === "Yes") reasons.push("Generally a better fit for mixed-age groups.");
    cautions.push("Check the operator checkout for live availability and exact transportation options.");
  } else {
    reasons.push("Matches your fast and adventurous preference.");
    cautions.push("Final option, group size, eligibility, duration, and transportation details must be confirmed in checkout.");
    if (inputs.mixedAges === "Yes") cautions.push("Verify age minimums and child eligibility in checkout before booking.");
  }

  let secondary: { slug: string; reasons: string[] } | undefined;
  if (sorted.length > 1 && sorted[1].score > 0) {
    const slug = sorted[1].slug;
    const secondaryReasons: string[] = [];
    if (slug === "city-tour-of-new-orleans") secondaryReasons.push("The city tour also fits your available time, but offers a broad introduction rather than an outdoor or specialized experience.");
    if (slug === "oak-alley-or-laura-plantation-tour") secondaryReasons.push("The plantation tour also offers a longer excursion, but focuses heavily on historical sites rather than nature or city overview.");
    if (slug === "covered-tour-boat") secondaryReasons.push("A covered boat is also available, providing a calmer, shaded swamp experience instead of a high-speed ride.");
    if (slug === "ragin-cajun-airboat-options") secondaryReasons.push("Airboats are also an option if you prefer a louder, faster, open-air experience.");
    secondary = { slug, reasons: secondaryReasons };
  }

  return {
    primary: { slug: primarySlug, reasons, cautionReasons: cautions },
    secondary,
    isNoFit: false,
  };
}
