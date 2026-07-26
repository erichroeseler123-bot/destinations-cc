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

export type HistoricalInterest = 
  | "Strong interest"
  | "Some interest"
  | "Not the priority";

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
  id: string; // The FareHarbor product ID or internal identifier
  operator: string;
  experienceType: string;
  pace: string;
  familyFit: string;
  transportationAvailable: string; // "Yes", "No", "Varies", "Confirm in checkout"
  historicalDepth: string;
  weatherExposure: string;
  noiseLevel: string;
  estimatedExperienceMinutes: number | null; // null if unverified
  estimatedTotalCommitmentMinutes: number | null; // null if unverified
  verifiedDurationLabel: string;
  verifiedTimeCommitmentLabel: string;
}

export const TOUR_RECORDS: Record<string, TourRecord> = {
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
    verifiedTimeCommitmentLabel: "Complete time commitment varies with traffic and pickup route. Confirm during checkout."
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
    verifiedTimeCommitmentLabel: "Pickup and return timing may make the complete outing longer. Confirm during checkout."
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
    verifiedTimeCommitmentLabel: "Complete time commitment varies with the selected option and transportation. Confirm during checkout."
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
    verifiedTimeCommitmentLabel: "Complete time commitment varies with the selected option and transportation. Confirm during checkout."
  }
};

export interface RecommendationResult {
  primary: {
    slug: string;
    reasons: string[];
    cautionReasons: string[];
  } | null;
  secondary?: {
    slug: string;
    reasons: string[];
  };
  isNoFit: boolean;
}

export function evaluateRecommendation(inputs: RecommendationInputs): RecommendationResult {
  if (
    !inputs.availableTime || 
    !inputs.transportation || 
    !inputs.groupStyle || 
    !inputs.mixedAges || 
    !inputs.historicalInterest
  ) {
    return { primary: null, isNoFit: true };
  }

  // 1. Incompatibility Checks
  let cityEligible = true;
  let plantationEligible = true;
  let coveredBoatEligible = true;
  let airboatEligible = true;

  // Time constraint
  if (inputs.availableTime === "About 3 hours") {
    plantationEligible = false; // requires half day or most of the day
    // Swamp tours take at least half a day generally if travel is involved
    coveredBoatEligible = false;
    airboatEligible = false;
  }
  
  if (inputs.availableTime === "About half a day") {
    plantationEligible = false; // Usually requires most of the day or at least half, let's keep eligible but low score
  }

  // Historical constraint
  if (inputs.historicalInterest === "Strong interest") {
    coveredBoatEligible = false;
    airboatEligible = false;
  }

  // Group style & pace constraint
  if (inputs.groupStyle === "Fast and adventurous") {
    cityEligible = false;
    plantationEligible = false;
    coveredBoatEligible = false;
  }
  if (inputs.groupStyle === "Relaxed and comfortable") {
    airboatEligible = false;
  }

  // Children/Mixed ages
  if (inputs.mixedAges === "Yes" && inputs.groupStyle === "Fast and adventurous") {
    // Airboat with mixed ages? Possible but might be incompatible based on exact situation.
    // The rules say: Airboat prefer when children or mixed ages are NOT selected, unless confirmed.
    // If mixedAges = Yes and adventurous, it's a conflict for our strict routing. Let's make it ineligible to be safe, 
    // or just let it pass with strong cautions. We'll let it pass but it needs a caution.
  }

  // If they need transportation but didn't book it, we can't definitively say they can do airboats without confirming.
  if (inputs.transportation === "We need pickup or transportation") {
    // Some swamp tours might not have transport confirmed for every slot.
    // It's a caution for swamp tours.
  }

  // 2. Scoring
  let cityScore = 0;
  let plantationScore = 0;
  let coveredBoatScore = 0;
  let airboatScore = 0;

  // City Tour
  if (inputs.planningWindow === "A first New Orleans experience") cityScore += 2;
  if (inputs.availableTime === "About 3 hours") cityScore += 3;
  if (inputs.historicalInterest === "Some interest") cityScore += 2;
  if (inputs.transportation === "We need pickup or transportation" || inputs.transportation === "Not sure") cityScore += 1;
  if (inputs.groupStyle === "Balanced") cityScore += 2;

  // Plantation Tour
  if (inputs.historicalInterest === "Strong interest") plantationScore += 4;
  if (inputs.availableTime === "Most of the day") plantationScore += 3;
  if (inputs.availableTime === "About half a day") plantationScore += 1;

  // Covered Boat
  if (inputs.groupStyle === "Relaxed and comfortable") coveredBoatScore += 3;
  if (inputs.mixedAges === "Yes") coveredBoatScore += 2;
  if (inputs.historicalInterest === "Not the priority") coveredBoatScore += 1;

  // Airboat
  if (inputs.groupStyle === "Fast and adventurous") airboatScore += 3;
  if (inputs.mixedAges === "No") airboatScore += 2;
  if (inputs.historicalInterest === "Not the priority") airboatScore += 1;

  interface ScoreObj { slug: string; score: number; eligible: boolean; }
  const scores: ScoreObj[] = [
    { slug: "city-tour-of-new-orleans", score: cityScore, eligible: cityEligible },
    { slug: "oak-alley-or-laura-plantation-tour", score: plantationScore, eligible: plantationEligible },
    { slug: "covered-tour-boat", score: coveredBoatScore, eligible: coveredBoatEligible },
    { slug: "ragin-cajun-airboat-options", score: airboatScore, eligible: airboatEligible },
  ];

  const sorted = scores.filter(s => s.eligible).sort((a, b) => b.score - a.score);

  if (sorted.length === 0 || sorted[0].score === 0) {
    return { primary: null, isNoFit: true };
  }

  const primarySlug = sorted[0].slug;
  const primaryReasons: string[] = [];
  const primaryCaution: string[] = [];

  if (primarySlug === "city-tour-of-new-orleans") {
    primaryReasons.push("A great balanced introduction to the city.");
    if (inputs.availableTime === "About 3 hours") primaryReasons.push("Fits within your roughly 3-hour window.");
    if (inputs.historicalInterest === "Some interest") primaryReasons.push("Provides engaging historical context without taking the whole day.");
    primaryCaution.push("Traffic can affect exact durations and pickup routes.");
  } else if (primarySlug === "oak-alley-or-laura-plantation-tour") {
    primaryReasons.push("Directly answers your strong historical interest.");
    if (inputs.availableTime === "Most of the day") primaryReasons.push("Matches your available time for a longer commitment.");
    primaryCaution.push("Confirm the selected plantation site and return timing in checkout.");
  } else if (primarySlug === "covered-tour-boat") {
    primaryReasons.push("Offers a relaxed, comfortable ride format.");
    if (inputs.mixedAges === "Yes") primaryReasons.push("Generally a better fit for mixed-age groups.");
    primaryCaution.push("Check the operator checkout for live availability and exact transportation options.");
  } else if (primarySlug === "ragin-cajun-airboat-options") {
    primaryReasons.push("Matches your fast and adventurous preference.");
    primaryCaution.push("Final option, group size, eligibility, duration, and transportation details must be confirmed in checkout.");
    if (inputs.mixedAges === "Yes") primaryCaution.push("Verify age minimums and child eligibility in checkout before booking.");
  }

  let secondary: { slug: string; reasons: string[] } | undefined = undefined;

  // Determine secondary recommendation
  if (sorted.length > 1 && sorted[1].score > 0) {
    const secondarySlug = sorted[1].slug;
    const secondaryReasons: string[] = [];
    
    if (secondarySlug === "city-tour-of-new-orleans") {
      secondaryReasons.push("The city tour also fits your available time, but offers a broad introduction rather than an outdoor or specialized experience.");
    } else if (secondarySlug === "oak-alley-or-laura-plantation-tour") {
      secondaryReasons.push("The plantation tour also offers a longer excursion, but focuses heavily on historical sites rather than nature or city overview.");
    } else if (secondarySlug === "covered-tour-boat") {
      secondaryReasons.push("A covered boat is also available, providing a calmer, shaded swamp experience instead of a high-speed ride.");
    } else if (secondarySlug === "ragin-cajun-airboat-options") {
      secondaryReasons.push("Airboats are also an option if you prefer a louder, faster, open-air experience.");
    }
    
    secondary = { slug: secondarySlug, reasons: secondaryReasons };
  }

  return {
    primary: {
      slug: primarySlug,
      reasons: primaryReasons,
      cautionReasons: primaryCaution,
    },
    secondary,
    isNoFit: false
  };
}
