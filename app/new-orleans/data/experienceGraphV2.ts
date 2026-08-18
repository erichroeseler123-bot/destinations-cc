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

function authoritative<T>(value: T, note: string): Fact<T> {
  return { value, source: "operator", confidence: "verified", reviewedAt: REVIEWED_AT, note };
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

function range(min: number | null, typical: number | null, max: number | null): TimeRange {
  return { min, typical, max };
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
 * Experience Graph v2 is provenance-first. A field is populated only when an
 * existing WNO record or current operator source supports it. Operational
 * fields that vary by selected variant remain null rather than being guessed.
 */
export const WNO_EXPERIENCE_GRAPH_V2: Record<string, WnoExperienceGraphRecord> = {
  "city-tour-of-new-orleans": {
    ...base("city-tour-of-new-orleans"),
    verificationStatus: "PARTIAL",
    format: authoritative("bus_tour", "Southern Style describes an air-conditioned minibus city tour."),
    activityMinutes: authoritative(minutes(180), "Southern Style currently describes the city tour as a 3-hour expedition."),
    doorToDoorWithPickupMinutes: unknown("Operator confirms a 30-minute pickup window, but exact door-to-door return timing is not stated as a single guaranteed duration."),
    doorToDoorSelfDriveMinutes: unknown(),
    pickupFrenchQuarter: unknown("Operator states hotel pickup and drop-off but does not define a French Quarter-only boundary on the public city-tour page."),
    pickupCitywide: unknown("Hotel pickup is confirmed; exact geographic boundary still needs verification."),
    selfDriveAvailable: unknown(),
    physicalIntensity: editorial("low", "Riding-focused format with outdoor stops; exact stop walking varies."),
    shadeCoverage: unknown(),
    heatExposure: authoritative("climate_controlled", "Southern Style explicitly describes the minibus as air-conditioned; outdoor stops still apply."),
    rainExposure: editorial("mixed"),
    noiseLevel: editorial("quiet"),
    stairsRequired: unknown(),
    bathroomAccess: unknown(),
    minimumAge: unknown("Operator publishes adult and child pricing but no minimum age on the public city-tour page."),
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
    verificationStatus: "PARTIAL",
    format: authoritative("covered_boat", "Ragin Cajun currently describes this as a covered swamp boat."),
    activityMinutes: authoritative(range(90, 105, 120), "Ragin Cajun FAQ says tours run approximately 1.5–2 hours."),
    doorToDoorWithPickupMinutes: unknown("Shuttle pickup is available, but operator does not publish one guaranteed total door-to-door duration."),
    doorToDoorSelfDriveMinutes: authoritative(range(146, null, 180), "Operator states 26–45 minutes driving from downtown/French Quarter each way, arrival 15 minutes early, plus a 1.5–2 hour tour."),
    pickupFrenchQuarter: authoritative(true, "Ragin Cajun states hotel pickup is available and identifies the French Quarter/downtown as its New Orleans reference area."),
    pickupCitywide: authoritative(true, "Operator states hotel pickups are offered across the New Orleans area."),
    selfDriveAvailable: authoritative(true, "Operator sells both tour-only/self-drive and shuttle-service options."),
    physicalIntensity: editorial("low"),
    shadeCoverage: authoritative("partial", "Operator describes a covered boat with space for up to 40 people; it remains an outdoor swamp experience."),
    heatExposure: editorial("shaded"),
    rainExposure: editorial("covered"),
    noiseLevel: editorial("moderate", "Existing WNO record describes it as calmer than an airboat."),
    stairsRequired: unknown(),
    bathroomAccess: unknown(),
    minimumAge: authoritative(0, "Ragin Cajun says the covered boat is suitable for all people and age groups and children 5 and under ride free."),
    maximumGroupSize: authoritative(40, "Operator describes the covered boat as having room for up to 40 people."),
    historyFocus: editorial("low"),
    wildlifeLikelihood: unknown("Operator lists likely wildlife but sightings are variable and must not be guaranteed."),
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
    verificationStatus: "PARTIAL",
    format: authoritative("airboat", "Ragin Cajun publishes premium, standard and large airboat formats."),
    activityMinutes: authoritative(range(90, 105, 120), "Ragin Cajun FAQ says tours run approximately 1.5–2 hours; another operator article specifies 1 hour 45 minutes for airboats."),
    doorToDoorWithPickupMinutes: unknown("Shuttle pickup windows are published, but exact hotel return time varies by tour and traffic."),
    doorToDoorSelfDriveMinutes: authoritative(range(146, null, 180), "Operator states 26–45 minutes driving from downtown/French Quarter each way, arrival 15 minutes early, plus a 1.5–2 hour tour."),
    pickupFrenchQuarter: authoritative(true, "Operator states hotel pickup is available and publishes shuttle pickup windows for each departure."),
    pickupCitywide: authoritative(true, "Operator states hotel pickups are offered across the New Orleans area."),
    selfDriveAvailable: authoritative(true, "Operator sells tour-only/self-drive and shuttle-service prices."),
    physicalIntensity: editorial("low", "Boat-based, but health restrictions materially affect eligibility."),
    shadeCoverage: editorial("none"),
    heatExposure: editorial("exposed"),
    rainExposure: editorial("exposed"),
    noiseLevel: authoritative("loud", "Operator safety information and WNO intelligence identify the airboat format as loud."),
    stairsRequired: unknown(),
    bathroomAccess: unknown(),
    minimumAge: authoritative(5, "Ragin Cajun FAQ says children under 5 are not permitted on airboat tours."),
    maximumGroupSize: authoritative(16, "Current operator page lists airboat variants up to 6, 10 and 16 seats."),
    historyFocus: editorial("low"),
    wildlifeLikelihood: unknown("Operator says alligator chances are high but explicitly does not guarantee sightings."),
    thrillIntensity: editorial("high"),
    romanceIndex: editorial("low"),
    mealIncluded: unknown(),
    alcoholEmphasis: editorial(false),
    bestFor: TOUR_INTELLIGENCE["ragin-cajun-airboat-options"].decision.bestFor,
    avoidIf: ["Anyone in the party is under 5", "Someone is pregnant or has neck/back problems", "You are noise-sensitive", "You strongly prefer shade or weather protection"],
    tradeOff: "More speed and open-air excitement, with more noise, weather exposure and stricter eligibility rules.",
    alternativeSlug: "covered-tour-boat",
    constraints: [
      { key: "minimum_age", severity: "hard", label: "Age eligibility", reason: "Children under 5 are not permitted on Ragin Cajun airboat tours." },
      { key: "pregnancy", severity: "hard", label: "Pregnancy", reason: "Expectant mothers are not permitted on Ragin Cajun airboat tours." },
      { key: "neck_back", severity: "hard", label: "Neck/back conditions", reason: "Operator says persons with neck or back problems are not permitted." },
    ],
  },

  "daytime-jazz-cruise": {
    ...base("daytime-jazz-cruise"),
    verificationStatus: "PARTIAL",
    format: authoritative("river_cruise", "Gray Line/New Orleans Steamboat Company currently publishes daytime sightseeing jazz cruises."),
    activityMinutes: authoritative(range(120, null, 150), "Current official daytime variants are published as 2 hours to 2.5 hours depending on vessel/schedule."),
    doorToDoorWithPickupMinutes: unknown("These products use a downtown meeting point rather than a hotel pickup commitment."),
    doorToDoorSelfDriveMinutes: unknown(),
    pickupFrenchQuarter: authoritative(false, "Current official daytime cruise pages publish a fixed downtown riverfront meeting point rather than hotel pickup."),
    pickupCitywide: authoritative(false, "Current official daytime cruise pages publish a fixed meeting point."),
    selfDriveAvailable: authoritative(true, "Guests check in at the published riverfront meeting point."),
    physicalIntensity: editorial("low"),
    shadeCoverage: authoritative("partial", "Official cruise pages state indoor and outdoor seating is available."),
    heatExposure: editorial("shaded", "Indoor seating is available, while outdoor decks remain exposed."),
    rainExposure: editorial("mixed"),
    noiseLevel: editorial("moderate"),
    stairsRequired: unknown("Vessel accessibility varies by deck and should be verified for the booked vessel."),
    bathroomAccess: unknown(),
    minimumAge: authoritative(0, "Official cruise pages list all ages."),
    maximumGroupSize: unknown("Group booking rules exist, but vessel capacity is not used as a recommendation constraint here."),
    historyFocus: editorial("general"),
    wildlifeLikelihood: editorial("low"),
    thrillIntensity: editorial("calm"),
    romanceIndex: editorial("moderate"),
    mealIncluded: unknown("Some daytime variants are sightseeing-only and others include a meal; selected booking variant controls this."),
    alcoholEmphasis: authoritative(false, "Alcohol is available for purchase, but the sightseeing cruise is not an alcohol-centered experience."),
    bestFor: ["Travelers wanting an easy daytime Mississippi River experience", "Mixed-age groups", "Visitors who want live jazz without committing to an evening plan"],
    avoidIf: ["You want a high-energy or highly active experience"],
    tradeOff: "You get daylight views and an easy schedule, but less of the classic after-dark atmosphere.",
    alternativeSlug: "evening-jazz-cruise",
    constraints: [],
  },

  "evening-jazz-cruise": {
    ...base("evening-jazz-cruise"),
    verificationStatus: "PARTIAL",
    format: authoritative("river_cruise", "Gray Line/New Orleans Steamboat Company currently publishes evening jazz sightseeing and dinner variants."),
    activityMinutes: authoritative(range(120, null, 180), "Current official evening variants publish a 2-hour cruise with total listed duration varying by product/check-in/dinner format."),
    doorToDoorWithPickupMinutes: unknown("These products use a downtown meeting point rather than hotel pickup."),
    doorToDoorSelfDriveMinutes: unknown(),
    pickupFrenchQuarter: authoritative(false, "Official evening cruise pages publish fixed riverfront meeting points."),
    pickupCitywide: authoritative(false, "Official evening cruise pages publish fixed meeting points."),
    selfDriveAvailable: authoritative(true, "Guests check in at the published riverfront meeting point."),
    physicalIntensity: editorial("low"),
    shadeCoverage: authoritative("partial", "Official pages state indoor and outdoor seating is available."),
    heatExposure: editorial("shaded", "Indoor seating is available, while outdoor decks remain exposed."),
    rainExposure: editorial("mixed"),
    noiseLevel: editorial("moderate"),
    stairsRequired: unknown("Deck accessibility depends on the vessel/area and should be verified for mobility-sensitive travelers."),
    bathroomAccess: unknown(),
    minimumAge: authoritative(0, "Official sightseeing and dinner variants list all ages."),
    maximumGroupSize: unknown(),
    historyFocus: editorial("general"),
    wildlifeLikelihood: editorial("low"),
    thrillIntensity: editorial("calm"),
    romanceIndex: editorial("high"),
    mealIncluded: unknown("Sightseeing-only and dinner-inclusive variants both exist; the selected booking option controls this."),
    alcoholEmphasis: authoritative(false, "Bars are available, but the core product is a jazz sightseeing cruise rather than an alcohol-centered activity."),
    bestFor: ["Couples and first-time visitors wanting a classic New Orleans night", "Travelers who want live jazz with Mississippi River views", "Groups wanting a low-walking evening option"],
    avoidIf: ["You want an intense history-focused experience", "You need every part of the vessel to be stair-free without confirming accessibility first"],
    tradeOff: "The atmosphere is the strength; dinner and sightseeing compete for your attention if you choose a meal package.",
    alternativeSlug: "daytime-jazz-cruise",
    constraints: [],
  },

  "whitney-plantation-tour": {
    ...base("whitney-plantation-tour"),
    verificationStatus: "PARTIAL",
    format: authoritative("plantation", "Gray Line currently sells Whitney as a dedicated plantation-history excursion."),
    activityMinutes: authoritative(minutes(325), "Gray Line currently lists the New Orleans Whitney tour at 5 hours 25 minutes including round-trip transportation."),
    doorToDoorWithPickupMinutes: authoritative(minutes(325), "Current Gray Line product is a 5 hour 25 minute round-trip tour from its fixed New Orleans departure point, not hotel pickup."),
    doorToDoorSelfDriveMinutes: unknown("This graph entry represents the Gray Line round-trip product, not a self-drive Whitney admission product."),
    pickupFrenchQuarter: authoritative(false, "Gray Line currently requires check-in at 400 Toulouse St rather than hotel pickup for this product."),
    pickupCitywide: authoritative(false, "Gray Line currently uses a fixed meeting point for this product."),
    selfDriveAvailable: authoritative(false, "This WNO bookable product is the Gray Line round-trip transportation tour."),
    physicalIntensity: authoritative("moderate", "Gray Line notes uneven gravel paths on the plantation grounds; wheelchair users can access grounds/museum but not enter slave quarters."),
    shadeCoverage: unknown(),
    heatExposure: editorial("exposed", "The plantation includes outdoor grounds; exact shade coverage is not represented as a verified field."),
    rainExposure: editorial("mixed"),
    noiseLevel: editorial("quiet"),
    stairsRequired: unknown("Gray Line publishes wheelchair-access details but does not reduce the whole site to a single stairs-required yes/no rule."),
    bathroomAccess: authoritative("frequent", "Gray Line explicitly states wheelchair users have access to the gift shop, restrooms and museum."),
    minimumAge: authoritative(0, "Gray Line lists the Whitney tour as all ages."),
    maximumGroupSize: unknown("Group rates begin at 10 adults, but that is not a maximum capacity."),
    historyFocus: authoritative("slavery_centered", "Gray Line describes Whitney as a museum dedicated to the history of slavery and first-person enslaved narratives."),
    wildlifeLikelihood: editorial("low"),
    thrillIntensity: editorial("calm"),
    romanceIndex: editorial("low"),
    mealIncluded: authoritative(false, "Gray Line states food and drinks are not included."),
    alcoholEmphasis: editorial(false),
    bestFor: ["Visitors prioritizing the history of slavery and enslaved people", "Travelers willing to commit roughly half a day", "History-focused visitors who prefer a self-paced audio experience at the site"],
    avoidIf: ["You have less than about half a day", "Uneven gravel paths are a major mobility barrier for your group"],
    tradeOff: "It is a substantial half-day commitment, but the interpretation is unusually focused on the lives and narratives of enslaved people.",
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
