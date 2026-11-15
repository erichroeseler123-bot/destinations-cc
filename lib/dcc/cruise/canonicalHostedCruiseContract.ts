/**
 * Canonical Entity & Page Ownership Contract (v1.0.0)
 *
 * Governing Rule:
 * Every fact, review, message, booking, page, and calculation has exactly one
 * authoritative owner. Other systems may reference or display it via canonical IDs,
 * never independently recreate or copy it.
 */

export const CANONICAL_HOSTED_CRUISE_CONTRACT_VERSION = "2026-11-15.v1" as const;

export const SYSTEM_OF_RECORD_OWNERSHIP = {
  ships_and_cruise_lines: "dcc",
  physical_sailing_schedule: "dcc",
  port_facts_and_timing: "dcc",
  hosted_organizer_identity: "dcc",
  official_booking_source: "dcc",
  hosted_programming_facts: "dcc",
  public_organizer_description: "dcc",
  reviews: "cruise_promenade",
  review_moderation: "cruise_promenade_with_dcc_admin_control",
  planner_activities: "cruise_promenade",
  private_members: "rollcall_usa",
  private_messages: "rollcall_usa",
  live_operator_inventory: "operator_cached_by_dcc",
  booking_order: "actual_seller",
  affiliate_routing: "dcc_commercial_registry",
  tour_product_description: "operator_or_specialist_site",
  analytics: "shared_event_ledger_summarized_by_dcc",
} as const;

export type CanonicalCruiseLineCode =
  | "rccl"
  | "ccl"
  | "ncl"
  | "cel"
  | "pcl"
  | "hal"
  | "msc"
  | "dcl"
  | "vv";

const LINE_CODE_ALIASES: Record<string, CanonicalCruiseLineCode> = {
  rccl: "rccl",
  "royal-caribbean": "rccl",
  "royal caribbean": "rccl",
  "royal caribbean international": "rccl",
  ccl: "ccl",
  carnival: "ccl",
  "carnival cruise line": "ccl",
  ncl: "ncl",
  norwegian: "ncl",
  "norwegian cruise line": "ncl",
  cel: "cel",
  celebrity: "cel",
  "celebrity cruises": "cel",
  pcl: "pcl",
  princess: "pcl",
  "princess cruises": "pcl",
  hal: "hal",
  holland: "hal",
  "holland-america": "hal",
  "holland america": "hal",
  "holland america line": "hal",
  msc: "msc",
  "msc cruises": "msc",
  dcl: "dcl",
  disney: "dcl",
  "disney cruise line": "dcl",
  vv: "vv",
  virgin: "vv",
  "virgin-voyages": "vv",
  "virgin voyages": "vv",
};

export function normalizeCanonicalCruiseLineCode(raw: string): CanonicalCruiseLineCode {
  const key = raw.trim().toLowerCase();
  const mapped = LINE_CODE_ALIASES[key];
  if (!mapped) {
    throw new Error(`Unsupported canonical cruise line identifier: "${raw}"`);
  }
  return mapped;
}

export function buildPhysicalSailingId(
  lineInput: string,
  shipSlug: string,
  sailDate: string,
): string {
  const lineCode = normalizeCanonicalCruiseLineCode(lineInput);
  const cleanShip = shipSlug.trim().toLowerCase();
  const cleanDate = sailDate.trim();
  if (!cleanShip || !/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
    throw new Error(`Invalid physical sailing components: ship="${shipSlug}", date="${sailDate}"`);
  }
  return `sailing:${lineCode}:${cleanShip}:${cleanDate}`;
}

export function buildHostedOrganizerId(organizerSlug: string): string {
  const clean = organizerSlug.trim().toLowerCase();
  if (!clean || !/^[a-z0-9-]+$/.test(clean)) {
    throw new Error(`Invalid canonical organizerSlug: "${organizerSlug}"`);
  }
  return `hosted-organizer:${clean}`;
}

export function buildHostedSailingId(
  organizerSlug: string,
  lineInput: string,
  shipSlug: string,
  sailDate: string,
): string {
  const lineCode = normalizeCanonicalCruiseLineCode(lineInput);
  const cleanOrg = organizerSlug.trim().toLowerCase();
  const cleanShip = shipSlug.trim().toLowerCase();
  const cleanDate = sailDate.trim();
  if (!cleanOrg || !cleanShip || !/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
    throw new Error(
      `Invalid hosted sailing ID components: org="${organizerSlug}", ship="${shipSlug}", date="${sailDate}"`,
    );
  }
  return `hosted-sailing:${cleanOrg}:${lineCode}:${cleanShip}:${cleanDate}`;
}

export function buildPrivateCommunityId(
  organizerSlugOrIndependent: string,
  shipSlug: string,
  sailDate: string,
): string {
  const scope = organizerSlugOrIndependent.trim().toLowerCase() || "independent";
  const cleanShip = shipSlug.trim().toLowerCase();
  const cleanDate = sailDate.trim();
  return `community:${scope}:${cleanShip}:${cleanDate}`;
}

export interface CanonicalTravelerPlanReference {
  sailingId: string;
  hostedSailingId?: string;
  communityId: string;
}

export function buildTravelerPlanReference(input: {
  lineInput: string;
  shipSlug: string;
  sailDate: string;
  organizerSlug?: string | null;
}): CanonicalTravelerPlanReference {
  const sailingId = buildPhysicalSailingId(input.lineInput, input.shipSlug, input.sailDate);
  if (input.organizerSlug && input.organizerSlug.trim()) {
    const org = input.organizerSlug.trim().toLowerCase();
    return {
      sailingId,
      hostedSailingId: buildHostedSailingId(org, input.lineInput, input.shipSlug, input.sailDate),
      communityId: buildPrivateCommunityId(org, input.shipSlug, input.sailDate),
    };
  }
  return {
    sailingId,
    communityId: buildPrivateCommunityId("independent", input.shipSlug, input.sailDate),
  };
}

export const HOSTED_CRUISE_THEME_SLUGS = [
  "lgbtq-cruises",
  "bear-cruises",
  "music-cruises",
  "business-and-networking",
  "crafting-and-hobbies",
  "food-and-wine",
  "dance-cruises",
  "wellness",
  "faith-communities",
  "recovery-and-sober-cruises",
  "family-reunions",
  "weddings-and-celebrations",
] as const;

export type HostedCruiseThemeSlug = (typeof HOSTED_CRUISE_THEME_SLUGS)[number];

export interface HostedCruiseThemeDefinition {
  themeSlug: HostedCruiseThemeSlug;
  label: string;
  shortLabel: string;
  heroHeadline: string;
  description: string;
  searchIntentExamples: string[];
  visualKey:
    | "sail-away-deck-meetup"
    | "juneau-whale-watch-crew"
    | "fleet-hero"
    | "port-costa-maya"
    | "port-san-juan"
    | "port-cabo-san-lucas"
    | "port-bermuda"
    | "port-curacao"
    | "port-barbados"
    | "port-aruba"
    | "port-ketchikan"
    | "port-sitka"
    | "region-mediterranean"
    | "region-northern-europe"
    | "region-asia-pacific";
}

export const HOSTED_CRUISE_THEMES: ReadonlyArray<HostedCruiseThemeDefinition> = [
  {
    themeSlug: "lgbtq-cruises",
    label: "LGBTQ+ cruises",
    shortLabel: "LGBTQ+",
    heroHeadline: "LGBTQ+ Hosted Cruises & Full-Ship Charters",
    description:
      "Compare full-ship LGBTQ+ charters and hosted group voyages side by side, check verified port schedules, read community-specific traveler reviews, and plan shore days together after booking with the official organizer.",
    searchIntentExamples: ["gay cruises 2027", "LGBTQ+ Alaska cruises 2027", "lesbian cruises 2027"],
    visualKey: "sail-away-deck-meetup",
  },
  {
    themeSlug: "bear-cruises",
    label: "Bear cruises",
    shortLabel: "Bear",
    heroHeadline: "Bear Group Cruises & Hosted Sailings",
    description:
      "Discover upcoming bear group cruises and welcoming community voyages, verify every port window, book directly through the official group host, and coordinate excursions with shipmates before embarkation.",
    searchIntentExamples: ["bear cruises 2027", "Arno bear cruise 2028"],
    visualKey: "port-costa-maya",
  },
  {
    themeSlug: "music-cruises",
    label: "Music cruises",
    shortLabel: "Music",
    heroHeadline: "Music & Festival Cruises at Sea",
    description:
      "Explore concert charters, fan voyages, and live-music group sailings—then see which shore excursions fit between onboard performances.",
    searchIntentExamples: ["music cruises 2027", "blues and bluegrass cruises"],
    visualKey: "port-curacao",
  },
  {
    themeSlug: "business-and-networking",
    label: "Business and networking",
    shortLabel: "Business & CE",
    heroHeadline: "Business, Mastermind & Continuing-Education Cruises",
    description:
      "Find professional conferences, CE/CLE/CPE voyages, and founder networking sailings with sea-day sessions and open port days you can coordinate together.",
    searchIntentExamples: ["CE cruises 2027", "networking cruises 2027"],
    visualKey: "port-san-juan",
  },
  {
    themeSlug: "crafting-and-hobbies",
    label: "Crafting and hobbies",
    shortLabel: "Crafting & Hobbies",
    heroHeadline: "Quilting, Knitting, Scrapbooking & Hobby Cruises",
    description:
      "Compare educator-led quilting, knitting, stamping, bridge, and hobby voyages where sea-day workshops pair with relaxed group shore excursions.",
    searchIntentExamples: ["quilting cruises 2027", "knitting cruises 2027"],
    visualKey: "port-ketchikan",
  },
  {
    themeSlug: "food-and-wine",
    label: "Food and wine",
    shortLabel: "Food & Wine",
    heroHeadline: "Winemaker & Culinary Hosted Cruises",
    description:
      "Sail with winemakers, wine clubs, and culinary hosts—combining sea-day tastings with shared food and coastal excursions in port.",
    searchIntentExamples: ["wine cruises 2027", "winery hosted cruises"],
    visualKey: "region-mediterranean",
  },
  {
    themeSlug: "dance-cruises",
    label: "Dance cruises",
    shortLabel: "Dance",
    heroHeadline: "Social Dance, Swing, Ballroom & Country Cruises",
    description:
      "Discover hosted West Coast Swing, ballroom, country, and line-dance cruises with sea-day workshops and group shore days.",
    searchIntentExamples: ["swing dance cruises 2027", "ballroom dance cruises"],
    visualKey: "port-cabo-san-lucas",
  },
  {
    themeSlug: "wellness",
    label: "Wellness",
    shortLabel: "Wellness & Active",
    heroHeadline: "Wellness, Pickleball & Active Renewal Cruises",
    description:
      "Find active sports clinics, pickleball voyages, and restorative group retreats at sea with balanced port-day adventures.",
    searchIntentExamples: ["pickleball cruises 2027", "wellness cruises"],
    visualKey: "port-barbados",
  },
  {
    themeSlug: "faith-communities",
    label: "Faith communities",
    shortLabel: "Faith",
    heroHeadline: "Faith Community, Gospel Music & Study Cruises",
    description:
      "Explore hosted Christian music, Bible study, and faith-fellowship voyages with verified port windows and group shore coordination.",
    searchIntentExamples: ["Christian cruises 2027", "Footsteps of Paul cruise 2027"],
    visualKey: "juneau-whale-watch-crew",
  },
  {
    themeSlug: "recovery-and-sober-cruises",
    label: "Recovery and sober cruises",
    shortLabel: "Sober & Recovery",
    heroHeadline: "Sober & Recovery Community Cruises",
    description:
      "Alcohol-free and recovery-supportive hosted group sailings where fellowship on board carries straight into stress-free days ashore.",
    searchIntentExamples: ["sober cruises 2027", "recovery cruises"],
    visualKey: "port-sitka",
  },
  {
    themeSlug: "family-reunions",
    label: "Family reunions",
    shortLabel: "Family & Friends",
    heroHeadline: "Hosted Family Reunion & Multi-Generational Cruises",
    description:
      "Advisor-hosted friends-and-family sailings and multi-generational group voyages where everyone can see the daily plan without 40-person group texts.",
    searchIntentExamples: ["family reunion cruises 2027"],
    visualKey: "region-northern-europe",
  },
  {
    themeSlug: "weddings-and-celebrations",
    label: "Weddings and celebrations",
    shortLabel: "Celebrations & Social",
    heroHeadline: "Milestone Celebrations, Alumni & Social Group Cruises",
    description:
      "Retirement milestones, holiday singles voyages, and celebratory group sailings built around shared memories ashore and at sea.",
    searchIntentExamples: ["celebration group cruises 2027", "singles Valentine cruise 2027"],
    visualKey: "port-bermuda",
  },
];

export type ListingTrustState =
  | "independent_listing"
  | "claimed_by_organizer"
  | "information_verified"
  | "official_organizer_partnership";

export type HostedFamilyPolicy =
  | "adults_only"
  | "family_friendly"
  | "mixed_group"
  | "not_verified";

export type HostedCabinAvailabilityStatus =
  | "available"
  | "limited"
  | "waitlist"
  | "sold_out"
  | "independent_cabins"
  | "not_verified";

export type HostedSailingLifecycleStatus = "upcoming" | "completed" | "cancelled";

export interface CanonicalHostedOrganizerFactRecord {
  organizerId: string; // hosted-organizer:<organizerSlug>
  organizerSlug: string;
  aliases: string[]; // previous/alternate slugs resolving to this single identity
  organizerName: string;
  shortName: string;
  categoryLabel: string;
  primaryTheme: HostedCruiseThemeSlug;
  secondaryThemes: HostedCruiseThemeSlug[];
  tagline: string;
  independentSummary: string;
  organizerProvidedDescription: string | null;
  designedForAudience: string;
  typicalHostedProgramming: string | null; // null -> "Not verified"
  typicalCharterModel: "full_ship_charter" | "hosted_group_block" | "mixed" | "not_verified";
  soloSupportSummary: string | null;
  soloFriendly: boolean | null;
  familyPolicy: HostedFamilyPolicy;
  goodForTags: string[];
  heroVisualKey: HostedCruiseThemeDefinition["visualKey"];
  officialWebsiteUrl: string;
  officialDomain: string;
  reservationPortalDomain?: string;
  publicContactPageUrl: string;
  nonAffiliationNotice: string;
  cabinBookingPolicyNote: string;
  verifiedSourceCheckedAt: string;
  comparableOrganizerSlugs: string[];
}

export interface CanonicalHostedSailingFactRecord {
  hostedSailingId: string; // hosted-sailing:<organizerSlug>:<lineCode>:<shipSlug>:<sailDate>
  organizerSlug: string;
  sailingSlug: string;
  physicalSailingId: string; // sailing:<lineCode>:<shipSlug>:<sailDate>
  canonicalLineCode: CanonicalCruiseLineCode;
  canonicalShipSlug: string;
  canonicalSailDate: string;
  sailingTitle: string;
  shortHeadline: string;
  editionSubtitle: string;
  anticipationHook: string;
  primaryTheme: HostedCruiseThemeSlug;
  secondaryThemes: HostedCruiseThemeSlug[];
  visualKey: HostedCruiseThemeDefinition["visualKey"];
  regionLabel: string;
  officialSailingPageUrl: string;
  officialReservationFormUrl: string;
  officialCruiseId?: string;
  cabinSellerLabel: string;
  cabinBookingCtaLabel: string;
  cabinAvailabilityStatus: HostedCabinAvailabilityStatus;
  cabinAvailabilityNote: string;
  verifiedStartingPriceUsd: number | null;
  verifiedPriceNote: string | null;
  approximateGroupSizeLabel: string | null; // null -> "Not verified"
  fullShipCharter: boolean | null; // null -> "Not verified"
  typicalAudience: string;
  announcedHostedProgramming: string | null; // null -> "Not verified"
  programmingSourceUrl: string | null;
  soloSupport: string | null; // null -> "Not verified"
  soloFriendly: boolean | null;
  familyPolicy: HostedFamilyPolicy;
  communityAtmosphereSummary: string | null; // null -> "Not verified"
  goodForTags: string[];
  lifecycleStatus: HostedSailingLifecycleStatus;
  cancelledReason?: string;
  organizerSourceCheckedAt: string;
  /**
   * Optional fail-closed hold reason: when non-empty, the hosted page stays
   * `noindex` and is excluded from sitemaps even if a vendor ship row exists.
   */
  scheduleHoldReason?: string;
}

export interface CanonicalHostedCatalogChangeEvent {
  eventId: string;
  occurredAt: string;
  entityType: "physical_sailing" | "hosted_organizer" | "hosted_sailing";
  entityId: string;
  summary: string;
  preservesCommunityIdentity: true;
}

export interface CanonicalHostedCatalogSnapshot {
  contractVersion: typeof CANONICAL_HOSTED_CRUISE_CONTRACT_VERSION;
  snapshotId: string;
  generatedAt: string;
  owner: "dcc";
  consumerCanonicalHost: "https://cruisepromenade.com";
  themes: ReadonlyArray<HostedCruiseThemeDefinition>;
  organizers: ReadonlyArray<CanonicalHostedOrganizerFactRecord>;
  hostedSailings: ReadonlyArray<CanonicalHostedSailingFactRecord>;
  recentChangeEvents: ReadonlyArray<CanonicalHostedCatalogChangeEvent>;
}

/**
 * Entity-Scoped Reviews & Q&A
 * Every stored review attaches to EXACTLY ONE primary subject so ship food
 * never lowers an organizer's score and tour issues never lower ship scores.
 */
export type HostedReviewPrimarySubjectType =
  | "organizer"
  | "hosted_sailing"
  | "ship"
  | "cruise_line"
  | "tour";

export type ReviewModerationStatus =
  | "pending_moderation"
  | "approved"
  | "rejected";

export type ReviewerVerificationBadge =
  | "verified_sailing_member"
  | "verified_email_traveler";

export interface EntityScopedReviewRecord {
  reviewId: string;
  submissionGroupId: string;
  primarySubjectType: HostedReviewPrimarySubjectType;
  primarySubjectId: string;
  organizerSlug?: string;
  sailingSlug?: string;
  authorDisplayName: string;
  verificationBadge: ReviewerVerificationBadge;
  overallRating: 1 | 2 | 3 | 4 | 5;
  dimensionRatings: Record<string, 1 | 2 | 3 | 4 | 5>;
  headline: string;
  writtenExperience: string;
  sailedDateLabel?: string;
  wouldSailAgain: boolean | null;
  photoUrls: string[];
  helpfulCount: number;
  moderationStatus: ReviewModerationStatus;
  organizerResponse?: {
    responderName: string;
    responderRole: string;
    body: string;
    respondedAt: string;
  };
  createdAt: string;
  approvedAt?: string;
}

export interface EntityScopedReviewAggregate {
  primarySubjectType: HostedReviewPrimarySubjectType;
  primarySubjectId: string;
  approvedReviewCount: number;
  averageRating: number | null;
  bayesianConfidenceScore: number;
  dimensionAverages: Record<string, number>;
  verifiedMemberReviewCount: number;
}

export function computeEntityReviewAggregate(
  reviews: ReadonlyArray<EntityScopedReviewRecord>,
  subjectType: HostedReviewPrimarySubjectType,
  subjectId: string,
): EntityScopedReviewAggregate {
  const matching = reviews.filter(
    (r) =>
      r.moderationStatus === "approved" &&
      r.primarySubjectType === subjectType &&
      r.primarySubjectId === subjectId,
  );

  const count = matching.length;
  if (count === 0) {
    return {
      primarySubjectType: subjectType,
      primarySubjectId: subjectId,
      approvedReviewCount: 0,
      averageRating: null,
      bayesianConfidenceScore: 0,
      dimensionAverages: {},
      verifiedMemberReviewCount: 0,
    };
  }

  const sum = matching.reduce((acc, r) => acc + r.overallRating, 0);
  const avg = Math.round((sum / count) * 10) / 10;

  // Bayesian confidence score toward neutral prior 3.8 with weight m=5
  const m = 5;
  const prior = 3.8;
  const bayesian = Math.round((((count / (count + m)) * (sum / count) + (m / (count + m)) * prior) / 5) * 1000) / 1000;

  const dimSums: Record<string, { total: number; n: number }> = {};
  for (const r of matching) {
    for (const [k, v] of Object.entries(r.dimensionRatings || {})) {
      if (typeof v === "number" && v >= 1 && v <= 5) {
        if (!dimSums[k]) dimSums[k] = { total: 0, n: 0 };
        dimSums[k].total += v;
        dimSums[k].n += 1;
      }
    }
  }
  const dimensionAverages: Record<string, number> = {};
  for (const [k, stat] of Object.entries(dimSums)) {
    if (stat.n > 0) {
      dimensionAverages[k] = Math.round((stat.total / stat.n) * 10) / 10;
    }
  }

  return {
    primarySubjectType: subjectType,
    primarySubjectId: subjectId,
    approvedReviewCount: count,
    averageRating: avg,
    bayesianConfidenceScore: bayesian,
    dimensionAverages,
    verifiedMemberReviewCount: matching.filter(
      (r) => r.verificationBadge === "verified_sailing_member",
    ).length,
  };
}

export interface HostedQuestionAnswerItem {
  answerId: string;
  authorDisplayName: string;
  isOfficialOrganizerAnswer: boolean;
  isVerifiedSailingMember: boolean;
  body: string;
  createdAt: string;
}

export interface HostedPublicQuestionRecord {
  questionId: string;
  targetType: "organizer" | "hosted_sailing";
  organizerSlug: string;
  sailingSlug?: string;
  authorDisplayName: string;
  questionText: string;
  moderationStatus: ReviewModerationStatus;
  helpfulCount: number;
  answers: HostedQuestionAnswerItem[];
  createdAt: string;
}

/**
 * Published Zero-Commercial-Weight Organic Ranking
 */
export interface HostedCatalogSearchCriteria {
  query?: string;
  theme?: HostedCruiseThemeSlug | "";
  destination?: string;
  departureMonth?: string; // YYYY-MM
  departurePort?: string;
  organizerSlug?: string;
  cruiseLineOrShip?: string;
  soloFriendlyOnly?: boolean;
  familyPolicy?: HostedFamilyPolicy | "";
  cabinAvailability?: HostedCabinAvailabilityStatus | "";
  minNights?: number;
  maxNights?: number;
  maxVerifiedPriceUsd?: number;
}

export interface RankableHostedSailingCandidate {
  hostedSailingId: string;
  organizerSlug: string;
  organizerName: string;
  primaryTheme: HostedCruiseThemeSlug;
  secondaryThemes: HostedCruiseThemeSlug[];
  regionLabel: string;
  itineraryPortsText: string;
  departurePort: string;
  sailDate: string;
  nights: number | null;
  shipName: string;
  shipSlug: string;
  cruiseLine: string;
  soloFriendly: boolean | null;
  familyPolicy: HostedFamilyPolicy;
  cabinAvailabilityStatus: HostedCabinAvailabilityStatus;
  verifiedStartingPriceUsd: number | null;
  everyPortDayVerified: boolean;
  everySourceVerified: boolean;
  reviewAggregate: EntityScopedReviewAggregate;
  dataCompletenessRatio: number; // 0..1
  sourceVerifiedAtIso: string;
  answeredQuestionsCount: number;
  communityParticipantCount: number;
  /** Explicitly accepted so tests can prove they have ZERO effect on organic score. */
  hasAffiliateCommission?: boolean;
  isClaimedByOrganizer?: boolean;
}

export interface RankedHostedSailingResult<T extends RankableHostedSailingCandidate> {
  item: T;
  totalScore: number;
  breakdown: {
    criteriaMatch: number;
    verifiedScheduleAndOrganizer: number;
    bookingAvailability: number;
    reviewQualityConfidence: number;
    dataCompleteness: number;
    freshness: number;
    communityUsefulness: number;
    travelerInterest: number;
    affiliateCommissionWeight: 0;
    claimedStatusAutoBoostWeight: 0;
  };
}

export function filterAndRankHostedSailings<T extends RankableHostedSailingCandidate>(
  candidates: ReadonlyArray<T>,
  criteria: HostedCatalogSearchCriteria = {},
  now: Date = new Date(),
): Array<RankedHostedSailingResult<T>> {
  const q = (criteria.query || "").trim().toLowerCase();
  const dest = (criteria.destination || "").trim().toLowerCase();
  const month = (criteria.departureMonth || "").trim();
  const depPort = (criteria.departurePort || "").trim().toLowerCase();
  const orgFilter = (criteria.organizerSlug || "").trim().toLowerCase();
  const lineOrShip = (criteria.cruiseLineOrShip || "").trim().toLowerCase();

  const filtered = candidates.filter((c) => {
    if (criteria.theme) {
      const matchesTheme =
        c.primaryTheme === criteria.theme || c.secondaryThemes.includes(criteria.theme);
      if (!matchesTheme) return false;
    }
    if (dest) {
      const hay = `${c.regionLabel} ${c.itineraryPortsText} ${c.departurePort}`.toLowerCase();
      if (!hay.includes(dest)) return false;
    }
    if (month && !c.sailDate.startsWith(month)) {
      return false;
    }
    if (depPort && !c.departurePort.toLowerCase().includes(depPort)) {
      return false;
    }
    if (orgFilter && c.organizerSlug.toLowerCase() !== orgFilter) {
      return false;
    }
    if (lineOrShip) {
      const hay = `${c.cruiseLine} ${c.shipName} ${c.shipSlug}`.toLowerCase();
      if (!hay.includes(lineOrShip)) return false;
    }
    if (criteria.soloFriendlyOnly && c.soloFriendly !== true) {
      return false;
    }
    if (criteria.familyPolicy && c.familyPolicy !== criteria.familyPolicy) {
      return false;
    }
    if (criteria.cabinAvailability && c.cabinAvailabilityStatus !== criteria.cabinAvailability) {
      return false;
    }
    if (typeof criteria.minNights === "number" && criteria.minNights > 0) {
      if (c.nights === null || c.nights < criteria.minNights) return false;
    }
    if (typeof criteria.maxNights === "number" && criteria.maxNights > 0) {
      if (c.nights === null || c.nights > criteria.maxNights) return false;
    }
    if (typeof criteria.maxVerifiedPriceUsd === "number" && criteria.maxVerifiedPriceUsd > 0) {
      if (
        c.verifiedStartingPriceUsd === null ||
        c.verifiedStartingPriceUsd > criteria.maxVerifiedPriceUsd
      ) {
        return false;
      }
    }
    if (q) {
      const hay = [
        c.organizerName,
        c.organizerSlug,
        c.shipName,
        c.cruiseLine,
        c.regionLabel,
        c.itineraryPortsText,
        c.departurePort,
        c.primaryTheme,
        ...c.secondaryThemes,
      ]
        .join(" ")
        .toLowerCase();
      const tokens = q.split(/\s+/).filter(Boolean);
      if (!tokens.every((tok) => hay.includes(tok))) return false;
    }
    return true;
  });

  const AVAILABILITY_POINTS: Record<HostedCabinAvailabilityStatus, number> = {
    available: 14,
    limited: 12,
    independent_cabins: 10,
    waitlist: 6,
    not_verified: 5,
    sold_out: 1,
  };

  const results: Array<RankedHostedSailingResult<T>> = filtered.map((item) => {
    let criteriaMatch = 20;
    if (criteria.theme && item.primaryTheme === criteria.theme) criteriaMatch += 6;
    if (q && item.organizerName.toLowerCase().includes(q)) criteriaMatch += 4;

    const verifiedScheduleAndOrganizer =
      (item.everyPortDayVerified ? 14 : 0) + (item.everySourceVerified ? 10 : 0);

    const bookingAvailability = AVAILABILITY_POINTS[item.cabinAvailabilityStatus] ?? 5;

    const reviewQualityConfidence = Math.round(item.reviewAggregate.bayesianConfidenceScore * 16 * 100) / 100;

    const dataCompleteness = Math.round(Math.max(0, Math.min(1, item.dataCompletenessRatio)) * 12 * 100) / 100;

    const verifiedMs = Date.parse(item.sourceVerifiedAtIso);
    const ageDays = Number.isFinite(verifiedMs)
      ? Math.max(0, (now.getTime() - verifiedMs) / 86_400_000)
      : 365;
    const freshness = ageDays <= 30 ? 8 : ageDays <= 90 ? 6 : ageDays <= 180 ? 4 : 1;

    const communityUsefulness = Math.min(5, item.answeredQuestionsCount * 1.5);
    const travelerInterest = Math.min(5, Math.log2(1 + Math.max(0, item.communityParticipantCount)));

    const totalScore =
      Math.round(
        (criteriaMatch +
          verifiedScheduleAndOrganizer +
          bookingAvailability +
          reviewQualityConfidence +
          dataCompleteness +
          freshness +
          communityUsefulness +
          travelerInterest) *
          100,
      ) / 100;

    return {
      item,
      totalScore,
      breakdown: {
        criteriaMatch,
        verifiedScheduleAndOrganizer,
        bookingAvailability,
        reviewQualityConfidence,
        dataCompleteness,
        freshness,
        communityUsefulness,
        travelerInterest: Math.round(travelerInterest * 100) / 100,
        affiliateCommissionWeight: 0,
        claimedStatusAutoBoostWeight: 0,
      },
    };
  });

  return results.sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    if (a.item.sailDate !== b.item.sailDate) return a.item.sailDate.localeCompare(b.item.sailDate);
    return a.item.hostedSailingId.localeCompare(b.item.hostedSailingId);
  });
}

/**
 * Automated Redundancy Safeguards (All 12 Invariants)
 */
export type RedundancySafeguardCode =
  | "DUPLICATE_PHYSICAL_SAILING_ID"
  | "DUPLICATED_ITINERARY_IN_HOSTED_RECORD"
  | "COMPETING_HOSTED_INTENT_CANONICAL"
  | "DCC_COMPETING_CONSUMER_CANONICAL"
  | "HOSTED_PORT_SCHEDULE_DIVERGENCE"
  | "PRIVATE_ROLLCALL_PII_IN_PUBLIC_OUTPUT"
  | "REVIEW_TOTAL_PAGE_API_MISMATCH"
  | "ORGANIZER_RATING_CONFLATED_WITH_SHIP_OR_TOUR"
  | "FILTER_OR_PRIVATE_URL_IN_SITEMAP"
  | "STALE_SOURCE_PRESENTED_AS_LIVE"
  | "RENAMED_ORGANIZER_DUPLICATE_IDENTITY"
  | "CANCELLED_SAILING_SILENTLY_REPLACED";

export interface SafeguardViolation {
  code: RedundancySafeguardCode;
  message: string;
  entityId?: string;
}

export interface RedundancyValidationInput {
  physicalSailings?: ReadonlyArray<{
    physicalSailingId: string;
    shipSlug: string;
    sailDate: string;
    portSequenceSignature?: string;
  }>;
  organizers: ReadonlyArray<CanonicalHostedOrganizerFactRecord>;
  hostedSailings: ReadonlyArray<CanonicalHostedSailingFactRecord & Record<string, unknown>>;
  renderedHostedPortSignatures?: ReadonlyArray<{
    hostedSailingId: string;
    physicalSailingId: string;
    portSequenceSignature: string;
  }>;
  dccConsumerCanonicalUrls?: ReadonlyArray<string>;
  cpConsumerCanonicalUrls?: ReadonlyArray<string>;
  publicSerializedPayloads?: ReadonlyArray<string>;
  reviewPageVsApiComparisons?: ReadonlyArray<{
    entityId: string;
    pageCount: number;
    apiCount: number;
    pageAverage: number | null;
    apiAverage: number | null;
  }>;
  reviewsSample?: ReadonlyArray<EntityScopedReviewRecord>;
  sitemapUrls?: ReadonlyArray<string>;
  liveInventoryClaims?: ReadonlyArray<{
    entityId: string;
    claimedLive: boolean;
    retrievedAtIso: string;
    maxAgeMinutes: number;
  }>;
  previousHistoricalHostedSailings?: ReadonlyArray<{
    hostedSailingId: string;
    organizerSlug: string;
    sailingSlug: string;
    physicalSailingId: string;
  }>;
  now?: Date;
}

const PRIVATE_LEAK_PATTERNS = [
  /\brc_cruise_part=/i,
  /\bCONFIDENTIAL_DM_/i,
  /"privateAlertEmail"\s*:/i,
  /"invitationCodeHash"\s*:/i,
  /"memberVerificationCodeHash"\s*:/i,
  /"dmBody"\s*:/i,
];

export function validateHostedCruiseRedundancySafeguards(
  input: RedundancyValidationInput,
): { valid: boolean; violations: SafeguardViolation[] } {
  const violations: SafeguardViolation[] = [];
  const now = input.now || new Date();

  // 1. Two physical sailings using different IDs for the same ship/date
  const physicalByTuple = new Map<string, string>();
  for (const ps of input.physicalSailings || []) {
    const tuple = `${ps.shipSlug.toLowerCase()}|${ps.sailDate}`;
    const prev = physicalByTuple.get(tuple);
    if (prev && prev !== ps.physicalSailingId) {
      violations.push({
        code: "DUPLICATE_PHYSICAL_SAILING_ID",
        entityId: ps.physicalSailingId,
        message: `Physical sailing ${tuple} has conflicting IDs "${prev}" and "${ps.physicalSailingId}".`,
      });
    } else {
      physicalByTuple.set(tuple, ps.physicalSailingId);
    }
  }

  // Also check physicalSailingId consistency across hostedSailings referencing the same ship+date
  for (const hs of input.hostedSailings) {
    const tuple = `${hs.canonicalShipSlug.toLowerCase()}|${hs.canonicalSailDate}`;
    const prev = physicalByTuple.get(tuple);
    if (prev && prev !== hs.physicalSailingId) {
      violations.push({
        code: "DUPLICATE_PHYSICAL_SAILING_ID",
        entityId: hs.hostedSailingId,
        message: `Hosted sailing "${hs.hostedSailingId}" references "${hs.physicalSailingId}" instead of "${prev}" for ${tuple}.`,
      });
    } else {
      physicalByTuple.set(tuple, hs.physicalSailingId);
    }
  }

  // 2. Manual itinerary duplication inside a hosted-sailing record
  for (const hs of input.hostedSailings) {
    if (
      "itinerary" in hs ||
      "itineraryDays" in hs ||
      "portDays" in hs ||
      "ports" in hs
    ) {
      const val =
        hs.itinerary ?? hs.itineraryDays ?? hs.portDays ?? hs.ports;
      if (val !== undefined) {
        violations.push({
          code: "DUPLICATED_ITINERARY_IN_HOSTED_RECORD",
          entityId: hs.hostedSailingId,
          message: `Hosted sailing "${hs.hostedSailingId}" illegally embeds an itinerary array instead of referencing "${hs.physicalSailingId}".`,
        });
      }
    }
  }

  // 3. Two canonical pages targeting the same organizer + physical sailing intent
  const intentToSailingId = new Map<string, string>();
  const pathToSailingId = new Map<string, string>();
  for (const hs of input.hostedSailings) {
    const intentKey = `${hs.organizerSlug.toLowerCase()}|${hs.physicalSailingId}`;
    const prevIntent = intentToSailingId.get(intentKey);
    if (prevIntent && prevIntent !== hs.hostedSailingId) {
      violations.push({
        code: "COMPETING_HOSTED_INTENT_CANONICAL",
        entityId: hs.hostedSailingId,
        message: `Duplicate hosted sailing canonicals "${prevIntent}" and "${hs.hostedSailingId}" target the same organizer/sailing intent (${intentKey}).`,
      });
    } else {
      intentToSailingId.set(intentKey, hs.hostedSailingId);
    }

    const pathKey = `/hosted-cruises/${hs.organizerSlug.toLowerCase()}/${hs.sailingSlug.toLowerCase()}`;
    const prevPath = pathToSailingId.get(pathKey);
    if (prevPath && prevPath !== hs.hostedSailingId) {
      violations.push({
        code: "COMPETING_HOSTED_INTENT_CANONICAL",
        entityId: hs.hostedSailingId,
        message: `Duplicate hosted sailing path "${pathKey}" claimed by "${prevPath}" and "${hs.hostedSailingId}".`,
      });
    } else {
      pathToSailingId.set(pathKey, hs.hostedSailingId);
    }
  }

  // 4. DCC and CP publishing competing consumer canonicals
  for (const dccUrl of input.dccConsumerCanonicalUrls || []) {
    if (/\/hosted-cruises(\/|$)/i.test(dccUrl) || /reviews/i.test(dccUrl)) {
      violations.push({
        code: "DCC_COMPETING_CONSUMER_CANONICAL",
        entityId: dccUrl,
        message: `DCC published a competing consumer hosted-cruise canonical URL: "${dccUrl}".`,
      });
    }
  }

  // 5. Hosted page inventing a different port schedule from its physical sailing
  const physicalSignatureMap = new Map<string, string>();
  for (const ps of input.physicalSailings || []) {
    if (ps.portSequenceSignature !== undefined) {
      physicalSignatureMap.set(ps.physicalSailingId, ps.portSequenceSignature);
    }
  }
  for (const rendered of input.renderedHostedPortSignatures || []) {
    const expected = physicalSignatureMap.get(rendered.physicalSailingId);
    if (expected !== undefined && expected !== rendered.portSequenceSignature) {
      violations.push({
        code: "HOSTED_PORT_SCHEDULE_DIVERGENCE",
        entityId: rendered.hostedSailingId,
        message: `Hosted sailing "${rendered.hostedSailingId}" port schedule "${rendered.portSequenceSignature}" diverged from physical sailing "${expected}".`,
      });
    }
  }

  // 6. Private RollCall data in public HTML or JSON-LD schema
  for (const payload of input.publicSerializedPayloads || []) {
    for (const regex of PRIVATE_LEAK_PATTERNS) {
      if (regex.test(payload)) {
        violations.push({
          code: "PRIVATE_ROLLCALL_PII_IN_PUBLIC_OUTPUT",
          message: `Public HTML/JSON-LD matched prohibited private RollCall/PII pattern ${String(regex)}.`,
        });
      }
    }
  }

  // 7. Review totals differing between page and API
  for (const cmp of input.reviewPageVsApiComparisons || []) {
    if (cmp.pageCount !== cmp.apiCount || cmp.pageAverage !== cmp.apiAverage) {
      violations.push({
        code: "REVIEW_TOTAL_PAGE_API_MISMATCH",
        entityId: cmp.entityId,
        message: `Review summary mismatch for "${cmp.entityId}": page=(${cmp.pageCount}, ${cmp.pageAverage}) vs api=(${cmp.apiCount}, ${cmp.apiAverage}).`,
      });
    }
  }

  // 8. Organizer rating including ship or tour ratings
  if (input.reviewsSample && input.reviewsSample.length > 0) {
    const orgIds = new Set(input.organizers.map((o) => o.organizerId));
    for (const orgId of orgIds) {
      const agg = computeEntityReviewAggregate(input.reviewsSample, "organizer", orgId);
      const strictOrgReviews = input.reviewsSample.filter(
        (r) =>
          r.moderationStatus === "approved" &&
          r.primarySubjectType === "organizer" &&
          r.primarySubjectId === orgId,
      );
      if (agg.approvedReviewCount !== strictOrgReviews.length) {
        violations.push({
          code: "ORGANIZER_RATING_CONFLATED_WITH_SHIP_OR_TOUR",
          entityId: orgId,
          message: `Organizer aggregate for "${orgId}" included non-organizer reviews.`,
        });
      }
    }
  }

  // 9. Filter, UTM, comparison query, planner code, or chat room URL entering a sitemap
  for (const url of input.sitemapUrls || []) {
    if (
      url.includes("?") ||
      /utm_/i.test(url) ||
      /\/p\//i.test(url) ||
      /\/cruise\/group\//i.test(url) ||
      /\/hosted-cruises\/compare\//i.test(url)
    ) {
      violations.push({
        code: "FILTER_OR_PRIVATE_URL_IN_SITEMAP",
        entityId: url,
        message: `Non-canonical filter, UTM, comparison query, planner, or chat URL entered sitemap: "${url}".`,
      });
    }
  }

  // 10. Stale source presented as live
  for (const inv of input.liveInventoryClaims || []) {
    if (!inv.claimedLive) continue;
    const ts = Date.parse(inv.retrievedAtIso);
    const ageMin = Number.isFinite(ts) ? (now.getTime() - ts) / 60_000 : Infinity;
    if (ageMin > inv.maxAgeMinutes) {
      violations.push({
        code: "STALE_SOURCE_PRESENTED_AS_LIVE",
        entityId: inv.entityId,
        message: `Entity "${inv.entityId}" presented ${Math.round(ageMin)}m-old cache as live (max ${inv.maxAgeMinutes}m).`,
      });
    }
  }

  // 11. Renamed organizer creating a second identity
  const slugAndAliasOwners = new Map<string, string>();
  const domainOwners = new Map<string, string>();
  for (const org of input.organizers) {
    const allSlugs = [org.organizerSlug, ...(org.aliases || [])].map((s) =>
      s.trim().toLowerCase(),
    );
    for (const s of allSlugs) {
      const existing = slugAndAliasOwners.get(s);
      if (existing && existing !== org.organizerId) {
        violations.push({
          code: "RENAMED_ORGANIZER_DUPLICATE_IDENTITY",
          entityId: org.organizerId,
          message: `Organizer slug/alias "${s}" is claimed by both "${existing}" and "${org.organizerId}".`,
        });
      } else {
        slugAndAliasOwners.set(s, org.organizerId);
      }
    }
    const dom = org.officialDomain.trim().toLowerCase();
    const prevDomOwner = domainOwners.get(dom);
    if (prevDomOwner && prevDomOwner !== org.organizerId) {
      violations.push({
        code: "RENAMED_ORGANIZER_DUPLICATE_IDENTITY",
        entityId: org.organizerId,
        message: `Official domain "${dom}" is claimed by two separate organizer records: "${prevDomOwner}" and "${org.organizerId}".`,
      });
    } else {
      domainOwners.set(dom, org.organizerId);
    }
  }

  // 12. Cancelled sailing silently replaced or dropped instead of marked cancelled
  const currentById = new Map(input.hostedSailings.map((h) => [h.hostedSailingId, h]));
  const currentByPath = new Map(
    input.hostedSailings.map((h) => [`${h.organizerSlug}|${h.sailingSlug}`, h]),
  );
  for (const hist of input.previousHistoricalHostedSailings || []) {
    const byId = currentById.get(hist.hostedSailingId);
    const byPath = currentByPath.get(`${hist.organizerSlug}|${hist.sailingSlug}`);
    if (!byId) {
      violations.push({
        code: "CANCELLED_SAILING_SILENTLY_REPLACED",
        entityId: hist.hostedSailingId,
        message: `Historical hosted sailing "${hist.hostedSailingId}" disappeared instead of transitioning to lifecycleStatus="cancelled" or "completed".`,
      });
    } else if (byId.physicalSailingId !== hist.physicalSailingId) {
      violations.push({
        code: "CANCELLED_SAILING_SILENTLY_REPLACED",
        entityId: hist.hostedSailingId,
        message: `Hosted sailing "${hist.hostedSailingId}" silently swapped physical sailing "${hist.physicalSailingId}" for "${byId.physicalSailingId}".`,
      });
    }
    if (byPath && byPath.hostedSailingId !== hist.hostedSailingId) {
      violations.push({
        code: "CANCELLED_SAILING_SILENTLY_REPLACED",
        entityId: hist.hostedSailingId,
        message: `Hosted path "${hist.organizerSlug}/${hist.sailingSlug}" silently replaced "${hist.hostedSailingId}" with "${byPath.hostedSailingId}".`,
      });
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}
