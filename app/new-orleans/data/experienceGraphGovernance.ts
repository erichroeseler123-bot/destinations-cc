import { WNO_EXPERIENCE_GRAPH_V2, type Fact, type TimeRange, type WnoExperienceGraphRecord } from "./experienceGraphV2";
import { WNO_OFFICIAL_GRAPH_BACKFILL } from "./experienceGraphOfficialBackfill";
import { TOUR_INTELLIGENCE } from "./tourIntelligence";

function unknown<T>(note = "Needs operator or authoritative source verification."): Fact<T> {
  return { value: null, source: "unknown", confidence: "unverified", reviewedAt: null, note };
}

function unverifiedShell(slug: string): WnoExperienceGraphRecord {
  const intelligence = TOUR_INTELLIGENCE[slug];
  if (!intelligence) throw new Error(`Missing WNO tour intelligence for ${slug}`);

  return {
    slug,
    operator: intelligence.operator,
    experienceType: intelligence.experienceType,
    verificationStatus: "NEEDS_VERIFICATION",
    format: unknown(),
    activityMinutes: unknown<TimeRange>(),
    doorToDoorWithPickupMinutes: unknown<TimeRange>(),
    doorToDoorSelfDriveMinutes: unknown<TimeRange>(),
    pickupFrenchQuarter: unknown<boolean>(),
    pickupCitywide: unknown<boolean>(),
    selfDriveAvailable: unknown<boolean>(),
    physicalIntensity: unknown<"low" | "moderate" | "high">(),
    shadeCoverage: unknown<"full" | "partial" | "none">(),
    heatExposure: unknown<"climate_controlled" | "shaded" | "exposed">(),
    rainExposure: unknown<"indoor" | "covered" | "exposed" | "mixed">(),
    noiseLevel: unknown<"quiet" | "moderate" | "loud">(),
    stairsRequired: unknown<boolean>(),
    bathroomAccess: unknown<"frequent" | "limited" | "none">(),
    minimumAge: unknown<number>(),
    maximumGroupSize: unknown<number>(),
    historyFocus: unknown<"slavery_centered" | "architecture_landscape" | "general" | "low">(),
    wildlifeLikelihood: unknown<"high" | "moderate" | "low">(),
    thrillIntensity: unknown<"calm" | "moderate" | "high">(),
    romanceIndex: unknown<"low" | "moderate" | "high">(),
    mealIncluded: unknown<boolean>(),
    alcoholEmphasis: unknown<boolean>(),
    bestFor: [],
    avoidIf: [],
    tradeOff: null,
    alternativeSlug: null,
    constraints: [],
  };
}

/**
 * Governance layer for the complete WNO storefront inventory.
 *
 * Detailed v2 records win, then current operator-source backfill records, then
 * an explicit unverified shell. This preserves one rule across every decision
 * surface: unknown facts stay unknown and are never filled by guesswork.
 */
export const WNO_GOVERNED_EXPERIENCE_GRAPH: Record<string, WnoExperienceGraphRecord> = Object.fromEntries(
  Object.keys(TOUR_INTELLIGENCE).map((slug) => [
    slug,
    WNO_EXPERIENCE_GRAPH_V2[slug] || WNO_OFFICIAL_GRAPH_BACKFILL[slug] || unverifiedShell(slug),
  ])
);

export function getGovernedExperienceGraphRecord(slug: string) {
  return WNO_GOVERNED_EXPERIENCE_GRAPH[slug] || null;
}

export function getGovernedPublishableDecisionFacts(slug: string) {
  const record = getGovernedExperienceGraphRecord(slug);
  if (!record || record.verificationStatus === "NEEDS_VERIFICATION") return null;
  return record;
}

export function getExperienceGraphGovernanceSummary() {
  const records = Object.values(WNO_GOVERNED_EXPERIENCE_GRAPH);
  return {
    total: records.length,
    publishable: records.filter((record) => record.verificationStatus !== "NEEDS_VERIFICATION").length,
    needsVerification: records.filter((record) => record.verificationStatus === "NEEDS_VERIFICATION").length,
    slugsNeedingVerification: records
      .filter((record) => record.verificationStatus === "NEEDS_VERIFICATION")
      .map((record) => record.slug),
  };
}
