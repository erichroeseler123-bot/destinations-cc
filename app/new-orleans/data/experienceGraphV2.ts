import { TOUR_INTELLIGENCE, type VerificationStatus } from "./tourIntelligence";

export type FieldSource =
  | "operator"
  | "fareharbor"
  | "existing_wno_record"
  | "editorial"
  | "unknown";

export type FieldConfidence = "verified" | "partial" | "inferred" | "unverified";

export type Fact<T> = {
  value: T | null;
  source: FieldSource;
  confidence: FieldConfidence;
  reviewedAt: string | null;
  note?: string;
};

export type TimeRange = {
  min: number | null;
  typical: number | null;
  max: number | null;
};

export type ConstraintSeverity = "hard" | "soft";

export type ExperienceConstraint = {
  key: string;
  severity: ConstraintSeverity;
  label: string;
  reason: string;
};

export type WnoExperienceGraphRecord = {
  slug: string;
  operator: string;
  experienceType: string;
  verificationStatus: VerificationStatus;

  format: Fact<
    | "covered_boat"
    | "airboat"
    | "river_cruise"
    | "walking"
    | "bus_tour"
    | "plantation"
    | "combination"
  >;
  activityMinutes: Fact<TimeRange>;
  doorToDoorWithPickupMinutes: Fact<TimeRange>;
  doorToDoorSelfDriveMinutes: Fact<TimeRange>;
  pickupFrenchQuarter: Fact<boolean>;
  pickupCitywide: Fact<boolean>;
  selfDriveAvailable: Fact<boolean>;

  physicalIntensity: Fact<"low" | "moderate" | "high">;
  shadeCoverage: Fact<"full" | "partial" | "none">;
  heatExposure: Fact<"climate_controlled" | "shaded" | "exposed">;
  rainExposure: Fact<"indoor" | "covered" | "exposed" | "mixed">;
  noiseLevel: Fact<"quiet" | "moderate" | "loud">;
  stairsRequired: Fact<boolean>;
  bathroomAccess: Fact<"frequent" | "limited" | "none">;
  minimumAge: Fact<number>;
  maximumGroupSize: Fact<number>;

  historyFocus: Fact<"slavery_centered" | "architecture_landscape" | "general" | "low">;
  wildlifeLikelihood: Fact<"high" | "moderate" | "low">;
  thrillIntensity: Fact<"calm" | "moderate" | "high">;
  romanceIndex: Fact<"low" | "moderate" | "high">;
  mealIncluded: Fact<boolean>;
  alcoholEmphasis: Fact<boolean>;

  bestFor: string[];
  avoidIf: string[];
  tradeOff: string | null;
  alternativeSlug: string | null;
  constraints: ExperienceConstraint[];
};

const REVIEWED_AT = "2026-08-17";

function known<T>(value: T, note?: string): Fact<T> {
  return { value, source: "existing_wno_record", confidence: "partial", reviewedAt: REVIEWED_AT, note };
}

function editorial<T>(value: T, note?: string): Fact<T> {
  return { value, source: "editorial", confidence: "inferred", reviewedAt: REVIEWED_AT, note };
}

function unknown<T>(note = "Needs operator or authoritative source verification."): Fact<T> {
  return { value: null, source: "unknown", confidence: "unverified", reviewedAt: null, note };
}

function minutes(typical: number): TimeRange {
  return { min: null, typical, max: null };
}

function base(slug: string): Pick<WnoExperienceGraphRecord, "slug" | "operator" | "experienceType" | "verificationStatus"> {
  const intelligence = TOUR_INTELLIGENCE[slug];
  if (!intelligence) throw new Error(`Missing WNO tour intelligence for ${slug}`);
  return {
    slug,
    operator: intelligence.operator,
    experienceType: intelligence.experienceType,
    verificationStatus: intelligence.verification.status,
  };
}

/**
 * Experience Graph v2 starts deliberately small. Only decision facts already
 * supported by WNO records are populated. Operational fields that can change
 * (pickup boundaries, age minimums, exact door-to-door time, stairs, booking
 * cutoffs, etc.) remain null until an operator/FareHarbor source verifies them.
 */
export const WNO_EXPERIENCE_GRAPH_V2: Record<string, WnoExperienceGraphRecord> = {
  "city-tour-of-new-orleans": {
    ...base("city-tour-of-new-orleans"),
    format: known("bus_tour"),
    activityMinutes: known(minutes(180), "Existing WNO recommendation profile uses about three hours."),
    doorToDoorWithPickupMinutes: unknown(),
    doorToDoorSelfDriveMinutes: unknown(),
    pickupFrenchQuarter: unknown(),
    pickupCitywide: unknown(),
    selfDriveAvailable: unknown(),
    physicalIntensity: editorial("low", "Riding-focused format with outdoor stops; exact stop walking varies."),
    shadeCoverage: unknown(),
    heatExposure: editorial("climate_controlled", "Vehicle-based for much of the experience; outdoor stops still apply."),
    rainExposure: editorial("mixed"),
    noiseLevel: editorial("quiet"),
    stairsRequired: unknown(),
    bathroomAccess: unknown(),
    minimumAge: unknown(),
    maximumGroupSize: unknown(),
    historyFocus: editorial("general"),
    wildlifeLikelihood: editorial("low"),
    thrillIntensity: editorial("calm"),
    romanceIndex: editorial("low"),
    mealIncluded: unknown(),
    alcoholEmphasis: editorial(false),
    bestFor: TOUR_INTELLIGENCE["city-tour-of-new-orleans"].decision.bestFor,
    avoidIf: ["You want a deep dive into one historical site", "You want a high-adrenaline outdoor activity"],
    tradeOff: "Breadth is the advantage; depth at any one stop is the trade-off.",
    alternativeSlug: "covered-tour-boat",
    constraints: [],
  },

  "covered-tour-boat": {
    ...base("covered-tour-boat"),
    format: known("covered_boat"),
    activityMinutes: unknown(),
    doorToDoorWithPickupMinutes: unknown(),
    doorToDoorSelfDriveMinutes: unknown(),
    pickupFrenchQuarter: unknown(),
    pickupCitywide: unknown(),
    selfDriveAvailable: unknown(),
    physicalIntensity: editorial("low"),
    shadeCoverage: known("partial", "WNO record supports a covered/shaded boat format; exact vessel configuration remains operator-controlled."),
    heatExposure: editorial("shaded"),
    rainExposure: editorial("covered"),
    noiseLevel: editorial("moderate", "Existing WNO record describes it as calmer than an airboat."),
    stairsRequired: unknown(),
    bathroomAccess: unknown(),
    minimumAge: unknown(),
    maximumGroupSize: unknown(),
    historyFocus: editorial("low"),
    wildlifeLikelihood: unknown("Wildlife sightings vary and should not be promised."),
    thrillIntensity: editorial("calm"),
    romanceIndex: editorial("low"),
    mealIncluded: unknown(),
    alcoholEmphasis: editorial(false),
    bestFor: TOUR_INTELLIGENCE["covered-tour-boat"].decision.bestFor,
    avoidIf: ["Your priority is speed and adrenaline"],
    tradeOff: "More cover and a calmer pace, but less of the high-speed airboat feel.",
    alternativeSlug: "ragin-cajun-airboat-options",
    constraints: [],
  },

  "ragin-cajun-airboat-options": {
    ...base("ragin-cajun-airboat-options"),
    format: known("airboat"),
    activityMinutes: unknown(),
    doorToDoorWithPickupMinutes: unknown(),
    doorToDoorSelfDriveMinutes: unknown(),
    pickupFrenchQuarter: unknown(),
    pickupCitywide: unknown(),
    selfDriveAvailable: unknown(),
    physicalIntensity: editorial("low", "Boat-based, but participation requirements still need verification."),
    shadeCoverage: editorial("none"),
    heatExposure: editorial("exposed"),
    rainExposure: editorial("exposed"),
    noiseLevel: known("loud", "Existing WNO intelligence explicitly flags the airboat format as loud."),
    stairsRequired: unknown(),
    bathroomAccess: unknown(),
    minimumAge: unknown(),
    maximumGroupSize: unknown(),
    historyFocus: editorial("low"),
    wildlifeLikelihood: unknown("Wildlife sightings vary and should not be promised."),
    thrillIntensity: editorial("high"),
    romanceIndex: editorial("low"),
    mealIncluded: unknown(),
    alcoholEmphasis: editorial(false),
    bestFor: TOUR_INTELLIGENCE["ragin-cajun-airboat-options"].decision.bestFor,
    avoidIf: ["You are noise-sensitive", "You strongly prefer shade or weather protection"],
    tradeOff: "More speed and open-air excitement, with more noise and weather exposure.",
    alternativeSlug: "covered-tour-boat",
    constraints: [
      { key: "age", severity: "hard", label: "Age eligibility", reason: "Minimum age and child rules must be confirmed for the selected airboat option before recommendation." },
    ],
  },

  "daytime-jazz-cruise": {
    ...base("daytime-jazz-cruise"),
    format: known("river_cruise"),
    activityMinutes: unknown(),
    doorToDoorWithPickupMinutes: unknown(),
    doorToDoorSelfDriveMinutes: unknown(),
    pickupFrenchQuarter: unknown(),
    pickupCitywide: unknown(),
    selfDriveAvailable: unknown(),
    physicalIntensity: unknown(),
    shadeCoverage: unknown(),
    heatExposure: unknown(),
    rainExposure: unknown(),
    noiseLevel: unknown(),
    stairsRequired: unknown(),
    bathroomAccess: unknown(),
    minimumAge: unknown(),
    maximumGroupSize: unknown(),
    historyFocus: unknown(),
    wildlifeLikelihood: unknown(),
    thrillIntensity: unknown(),
    romanceIndex: editorial("moderate"),
    mealIncluded: unknown(),
    alcoholEmphasis: unknown(),
    bestFor: [],
    avoidIf: [],
    tradeOff: null,
    alternativeSlug: "evening-jazz-cruise",
    constraints: [],
  },

  "evening-jazz-cruise": {
    ...base("evening-jazz-cruise"),
    format: known("river_cruise"),
    activityMinutes: unknown(),
    doorToDoorWithPickupMinutes: unknown(),
    doorToDoorSelfDriveMinutes: unknown(),
    pickupFrenchQuarter: unknown(),
    pickupCitywide: unknown(),
    selfDriveAvailable: unknown(),
    physicalIntensity: unknown(),
    shadeCoverage: unknown(),
    heatExposure: unknown(),
    rainExposure: unknown(),
    noiseLevel: unknown(),
    stairsRequired: unknown(),
    bathroomAccess: unknown(),
    minimumAge: unknown(),
    maximumGroupSize: unknown(),
    historyFocus: unknown(),
    wildlifeLikelihood: unknown(),
    thrillIntensity: unknown(),
    romanceIndex: editorial("high"),
    mealIncluded: unknown(),
    alcoholEmphasis: unknown(),
    bestFor: [],
    avoidIf: [],
    tradeOff: null,
    alternativeSlug: "daytime-jazz-cruise",
    constraints: [],
  },

  "whitney-plantation-tour": {
    ...base("whitney-plantation-tour"),
    format: known("plantation"),
    activityMinutes: unknown(),
    doorToDoorWithPickupMinutes: unknown(),
    doorToDoorSelfDriveMinutes: unknown(),
    pickupFrenchQuarter: unknown(),
    pickupCitywide: unknown(),
    selfDriveAvailable: unknown(),
    physicalIntensity: unknown(),
    shadeCoverage: unknown(),
    heatExposure: unknown(),
    rainExposure: unknown(),
    noiseLevel: unknown(),
    stairsRequired: unknown(),
    bathroomAccess: unknown(),
    minimumAge: unknown(),
    maximumGroupSize: unknown(),
    historyFocus: editorial("slavery_centered", "Editorial classification only; operational and interpretive details still require authoritative verification."),
    wildlifeLikelihood: editorial("low"),
    thrillIntensity: editorial("calm"),
    romanceIndex: editorial("low"),
    mealIncluded: unknown(),
    alcoholEmphasis: editorial(false),
    bestFor: [],
    avoidIf: [],
    tradeOff: null,
    alternativeSlug: "oak-alley-plantation-tour-grey-line",
    constraints: [],
  },
};

export function getExperienceGraphRecord(slug: string) {
  return WNO_EXPERIENCE_GRAPH_V2[slug] || null;
}

export function getPublishableDecisionFacts(slug: string) {
  const record = getExperienceGraphRecord(slug);
  if (!record || record.verificationStatus === "NEEDS_VERIFICATION") return null;
  return record;
}
