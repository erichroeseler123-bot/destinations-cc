/**
 * Region-Neutral Travel Directory & Knowledge Graph Core Contract
 * (`lib/dcc/shared/regionalDirectoryCoreContract.ts`).
 *
 * Contains ONLY universally reusable entities and fail-closed governance primitives:
 *   1. Provenance (`PrimarySourceCitation`, `RecordProvenanceFields`)
 *   2. Location (`DirectoryLocationCoreRecord`, `LocationRelationshipLink`)
 *   3. Meeting Point (`DirectoryMeetingPointRecord`, `OperatorMeetingRuleRecord`)
 *   4. Booking Provider (`BookingProviderPlatform`, `BookingProviderDescriptor`, `OperatorIntegrationApprovalState`)
 *   5. Operator (`DirectoryOperatorCoreRecord`, claim verification, field authority)
 *   6. Product & Departure (`DirectoryProductCoreRecord`, `DirectoryDepartureSlot`)
 *   7. Entity-Separated Reviews (`DirectoryOperatorReviewRecord`, `DirectoryProductReviewRecord`)
 *   8. Fail-Closed Publication Gates (location, operator, and place-category gates)
 *
 * Pure TypeScript (zero `node:fs`, zero DB drivers, zero region-specific or
 * cruise-specific berths/tenders/wildlife/all-aboard logic). Regional extensions
 * (such as `alaskaDirectoryExtensionContract.ts`) compose on top of this core.
 */

export const DIRECTORY_CORE_CONTRACT_VERSION = "dcc.directory.core.v1" as const;

export const UNCLAIMED_OPERATOR_PROFILE_NOTICE =
  "Independent source-backed profile. This company has not yet claimed or verified this page." as const;

// ============================================================================
// 1. PROVENANCE & FRESHNESS
// ============================================================================

export type CoreSourceKind =
  | "official_operator"
  | "municipal_or_civic_authority"
  | "official_dmo_tourism"
  | "federal_or_state_agency"
  | "indigenous_or_community_governance"
  | "verified_partner_catalog";

export interface PrimarySourceCitation<TSourceKind extends string = CoreSourceKind> {
  label: string;
  url: string;
  sourceKind: TSourceKind;
  checkedAt: string;
}

export interface RecordProvenanceFields<TSourceKind extends string = CoreSourceKind> {
  sources: readonly PrimarySourceCitation<TSourceKind>[];
  verifiedAt: string | null;
  lastModifiedAt: string;
  explicitHoldReasons?: readonly string[];
}

// ============================================================================
// 2. LOCATION & PLACE RELATIONSHIPS
// ============================================================================

export const CORE_LOCATION_TYPES = [
  "community",
  "neighborhood_or_district",
  "transit_or_port_terminal",
  "harbor_or_marina",
  "park_or_preserve",
  "scenic_corridor",
  "venue_or_landmark",
] as const;

export type CoreLocationType = (typeof CORE_LOCATION_TYPES)[number];

export type CoreLocationPrecisionTier =
  | "exact_entrance_or_berth"
  | "terminal_or_facility"
  | "meeting_point"
  | "gate_or_plaza"
  | "district_or_city_centroid";

export interface LocationRelationshipLink<
  TPlaceType extends string = CoreLocationType,
  TRelationship extends string = string,
> {
  targetPlaceId: string;
  targetPublicSlug: string | null;
  targetName: string;
  targetPlaceType: TPlaceType;
  relationship: TRelationship;
  distanceOrTransitSummary: string;
  geographicExplanation: string;
}

export interface DirectoryLocationCoreRecord<
  TPlaceType extends string = CoreLocationType,
  TMeetingPoint extends DirectoryMeetingPointRecord = DirectoryMeetingPointRecord,
  TSourceKind extends string = CoreSourceKind,
> {
  placeId: string;
  publicPlaceSlug: string | null;
  hasPublicDirectoryPage: boolean;
  name: string;
  subRegionLabel: string;
  placeType: TPlaceType;
  secondaryPlaceTypes?: readonly TPlaceType[];
  neverAliasOrRedirectToSlugs?: readonly string[];
  heroImage: string;
  heroImageAlt: string;
  heroImageCredit: string;
  hook: string;
  overview: string;
  accessAndTransitSummary: string;
  pickupAndArrivalNotes: string;
  weatherOrSeasonalAdvice: string;
  meetingAndAccessPoints: readonly TMeetingPoint[];
  officialLocalSources: readonly PrimarySourceCitation<TSourceKind>[];
  verifiedAt: string | null;
  lastModifiedAt: string;
  explicitHoldReasons?: readonly string[];
}

// ============================================================================
// 3. MEETING POINTS & OPERATOR PICKUP RULES
// ============================================================================

export type CoreMeetingPointKind =
  | "pickup_zone"
  | "terminal_gate"
  | "harbor_ramp"
  | "hotel_or_downtown_plaza"
  | "venue_check_in"
  | "transit_station";

export interface DirectoryMeetingPointRecord<
  TKind extends string = CoreMeetingPointKind,
  TPrecision extends string = CoreLocationPrecisionTier,
> {
  locationId: string;
  name: string;
  facilityKind: TKind;
  latitude: number;
  longitude: number;
  precisionTier: TPrecision;
  transitOrWalkNotes: string;
  additionalTransferMinutesEachWay: number;
}

export interface OperatorMeetingRuleRecord {
  placeId: string;
  meetingAreaName: string;
  pickupProvided: boolean;
  meetingPointInstructions: string;
  addedBufferMinutesEachWay: number;
}

// ============================================================================
// 4. BOOKING PROVIDERS & COMMERCIAL INTEGRATION GATE
// ============================================================================

export type BookingProviderPlatform =
  | "FareHarbor"
  | "Rezgo"
  | "Rezdy"
  | "Peek Pro"
  | "Ventrata"
  | "Bokun"
  | "Direct Website"
  | "Phone / Charter Inquiry"
  | "Unverified";

export type ProductBookingChannel =
  | "viator_exact_product"
  | "getyourguide_exact_product"
  | "supplier_direct_facilitator_10pct"
  | "official_operator_website"
  | "held_pending_verification";

export interface BookingProviderDescriptor {
  platform: BookingProviderPlatform;
  providerAccountHandle?: string | null;
  supportsLiveAvailabilityWebhook?: boolean;
}

export interface OperatorIntegrationApprovalState {
  connectionRequestStatus:
    | "not_requested"
    | "submitted_pending_owner_approval"
    | "approved_live"
    | "held_needs_verification";
  liveAvailabilityApprovedByOwner: boolean;
  directCheckoutApprovedByOwner: boolean;
  commercialTermsSigned10Pct: boolean;
  settlementMode?: "operator_mor_platform_invoices_commission" | null;
  commissionEarnedOn?: "completed_non_refunded_bookings" | null;
  publicAttributionParam?: string | null;
  liveFeedVerificationStatus?:
    | "unconnected"
    | "verified_live_feed"
    | "degraded_fallback";
  approvedAt: string | null;
  approvedBy: string | null;
  notes: string;
}

export interface AuthorizedSupplierProductBinding {
  provider: BookingProviderPlatform;
  supplierOperatorKey: string;
  supplierItemCode: string;
  supplierDefaultOptionUid: string;
  supplierHostedSeoSlug: string;
  normalizedFeedTourId: string;
  matchedPartnerProductCode: string | null;
  supplierHostedDomain: string;
  publicRefId: string;
  surfaceName: string;
  trackingTagPrefix: string;
  liveAvailabilityConnected: boolean;
  directCheckoutConnected: boolean;
  merchantOfRecord: "operator";
  customerFundsCapturedByPlatform: false;
  settlementMode: "operator_mor_platform_invoices_commission";
  commissionPercent: 10;
  commissionEarnedOn: "completed_non_refunded_bookings";
}

export function buildAuthorizedSupplierDirectWrapperHref(
  binding: AuthorizedSupplierProductBinding,
  options?: {
    placeSlug?: string | null;
    originatingSite?: string | null;
    serviceDate?: string | null;
    partySize?: number | null;
    optionUid?: string | null;
  },
): string | null {
  if (!binding.directCheckoutConnected) return null;
  const host = binding.supplierHostedDomain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
  const refId = binding.publicRefId.trim();
  const optionUid = (options?.optionUid || binding.supplierDefaultOptionUid).trim();
  if (!host || !/^[A-Za-z0-9]+$/.test(refId) || !/^\d+$/.test(optionUid)) {
    return null;
  }

  const dateSeg =
    options?.serviceDate && /^\d{4}-\d{2}-\d{2}$/.test(options.serviceDate)
      ? `/${options.serviceDate}`
      : "";
  const supplierUrl = new URL(
    `https://${host}/details/${binding.supplierItemCode}/${binding.supplierHostedSeoSlug}/${optionUid}${dateSeg}`,
  );
  supplierUrl.searchParams.set("refid", refId);
  if (
    typeof options?.partySize === "number" &&
    Number.isFinite(options.partySize) &&
    options.partySize >= 1
  ) {
    supplierUrl.searchParams.set(
      "adult_num",
      String(Math.min(99, Math.trunc(options.partySize))),
    );
  }

  const wrapper = new URL("https://www.destinationcommandcenter.com/go/out");
  wrapper.searchParams.set("u", supplierUrl.toString());
  wrapper.searchParams.set(
    "originatingSite",
    (options?.originatingSite || "destinationcommandcenter.com").trim(),
  );
  wrapper.searchParams.set("surface", binding.surfaceName);
  if (options?.placeSlug) {
    wrapper.searchParams.set("port", options.placeSlug);
  }
  const prodCode = binding.matchedPartnerProductCode || binding.supplierItemCode;
  wrapper.searchParams.set("product", prodCode);
  wrapper.searchParams.set("option", optionUid);
  if (options?.serviceDate && /^\d{4}-\d{2}-\d{2}$/.test(options.serviceDate)) {
    wrapper.searchParams.set("date", options.serviceDate);
  }
  if (
    typeof options?.partySize === "number" &&
    Number.isFinite(options.partySize) &&
    options.partySize >= 1
  ) {
    wrapper.searchParams.set(
      "partySize",
      String(Math.min(99, Math.trunc(options.partySize))),
    );
  }
  wrapper.searchParams.set(
    "trackingTag",
    `${binding.trackingTagPrefix}_${prodCode.toLowerCase()}_${optionUid}`,
  );
  return wrapper.toString();
}

export function isOperatorLiveAvailabilityConnected(operator: {
  integrationApproval: OperatorIntegrationApprovalState;
}): boolean {
  if (operator.integrationApproval.liveFeedVerificationStatus === "degraded_fallback") {
    return false;
  }
  return (
    operator.integrationApproval.connectionRequestStatus === "approved_live" &&
    operator.integrationApproval.liveAvailabilityApprovedByOwner === true
  );
}

export function isOperatorDirectCheckoutConnected(operator: {
  integrationApproval: OperatorIntegrationApprovalState;
}): boolean {
  return (
    operator.integrationApproval.connectionRequestStatus === "approved_live" &&
    operator.integrationApproval.directCheckoutApprovedByOwner === true &&
    operator.integrationApproval.commercialTermsSigned10Pct === true
  );
}

// ============================================================================
// 5. ENTITY-SEPARATED REVIEWS (OPERATOR VS. PRODUCT)
// ============================================================================

export interface DirectoryOperatorReviewRecord {
  reviewId: string;
  entityScope: "operator";
  operatorId: string;
  reviewerDisplayName: string;
  visitMonthOrSeason: string;
  verificationBasis: "verified_booking_or_owner_moderated";
  operationsAndPickupSummary: string;
  operatorReply?: string | null;
  publishedAt: string;
}

export interface DirectoryProductReviewRecord {
  reviewId: string;
  entityScope: "product" | "tour";
  productId: string;
  operatorId: string;
  reviewerDisplayName: string;
  visitMonthOrSeason: string;
  verificationBasis: "verified_booking_or_owner_moderated";
  experienceSummary: string;
  operatorReply?: string | null;
  publishedAt: string;
}

// ============================================================================
// 6. OPERATOR ENTITY, CLAIM VERIFICATION & FIELD AUTHORITY
// ============================================================================

export type CoreOwnershipTag =
  | "locally_owned"
  | "independent_small_group"
  | "indigenous_or_community_owned"
  | "family_owned"
  | "historic_utility_or_heritage_operator"
  | "regional_operator";

export interface VerifiedOwnershipBadge<TTag extends string = CoreOwnershipTag> {
  tag: TTag;
  label: string;
  evidenceSummary: string;
  sourceUrl: string;
}

export interface DirectoryOperatorCoreRecord<
  TOwnershipTag extends string = CoreOwnershipTag,
  TSourceKind extends string = CoreSourceKind,
  TReview extends { reviewId: string; operatorId: string } = DirectoryOperatorReviewRecord,
> extends RecordProvenanceFields<TSourceKind> {
  operatorId: string;
  slug: string;
  legacyCompanyAliases?: readonly string[];
  separateFromOperatorIds?: readonly string[];
  separationGovernanceNote?: string;
  name: string;
  tagline: string;
  headquartersCommunityId: string;
  servedPlaceIds: readonly string[];
  publicPlaceSlugs: readonly string[];
  categorySlugs: readonly string[];
  verifiedOwnershipBadges: readonly VerifiedOwnershipBadge<TOwnershipTag>[];
  companyOverview: string;
  arrivalAndPickupSummary: string;
  officialWebsite: string | null;
  officialEmailDomain: string | null;
  officialPhone: string | null;
  yearEstablished?: number | null;
  socialLinks: Readonly<Record<string, string>>;
  bookingPlatform: BookingProviderPlatform;
  accessibilityAndMobilityNotes: string;
  participantPolicies: string;
  heroImage: string;
  heroImageAlt: string;
  heroImageCredit: string;
  claimStatus: "unclaimed" | "claim_pending_verification" | "claimed_verified";
  integrationApproval: OperatorIntegrationApprovalState;
  operatorReviews: readonly TReview[];
}

export type OperatorClaimVerificationMethod =
  | "official_company_domain_email"
  | "official_listed_phone_verification"
  | "manual_owner_verification";

export interface OperatorClaimControlAssessment {
  verificationMethod: OperatorClaimVerificationMethod;
  domainEmailMatched: boolean;
  listedPhoneMatched: boolean;
  autoGrantsWorkspaceAccess: false;
  resultingClaimState: "pending_owner_confirmation" | "pending_manual_owner_review";
  resultingIntegrationState:
    | "not_requested"
    | "submitted_pending_owner_approval";
  summary: string;
}

function normalizePhoneDigits(phone: string | null | undefined): string {
  const digits = String(phone || "").replace(/\D+/g, "");
  return digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
}

export function assessOperatorClaimAndIntegrationSubmission(params: {
  operator: {
    operatorId: string;
    name: string;
    officialEmailDomain: string | null;
    officialWebsite?: string | null;
    officialPhone: string | null;
  };
  claimantEmail: string;
  claimantPhone?: string | null;
  requestedDirectIntegration?: boolean;
}): OperatorClaimControlAssessment {
  const emailDomain = (params.claimantEmail.split("@")[1] || "")
    .trim()
    .toLowerCase()
    .replace(/^www\./, "");
  const officialDomain = (params.operator.officialEmailDomain || "")
    .trim()
    .toLowerCase()
    .replace(/^www\./, "");
  let websiteHost = "";
  if (params.operator.officialWebsite) {
    try {
      websiteHost = new URL(params.operator.officialWebsite).hostname
        .toLowerCase()
        .replace(/^www\./, "");
    } catch {
      websiteHost = "";
    }
  }

  const domainEmailMatched = Boolean(
    emailDomain &&
      ((officialDomain && emailDomain === officialDomain) ||
        (websiteHost && emailDomain === websiteHost)),
  );

  const submittedDigits = normalizePhoneDigits(params.claimantPhone);
  const officialDigits = normalizePhoneDigits(params.operator.officialPhone);
  const listedPhoneMatched = Boolean(
    submittedDigits.length >= 10 &&
      officialDigits.length >= 10 &&
      submittedDigits === officialDigits,
  );

  const verificationMethod: OperatorClaimVerificationMethod = domainEmailMatched
    ? "official_company_domain_email"
    : listedPhoneMatched
      ? "official_listed_phone_verification"
      : "manual_owner_verification";

  const resultingIntegrationState = params.requestedDirectIntegration
    ? "submitted_pending_owner_approval"
    : "not_requested";

  const matchedDomainLabel = officialDomain || websiteHost;

  return {
    verificationMethod,
    domainEmailMatched,
    listedPhoneMatched,
    autoGrantsWorkspaceAccess: false,
    resultingClaimState: domainEmailMatched
      ? "pending_owner_confirmation"
      : "pending_manual_owner_review",
    resultingIntegrationState,
    summary: domainEmailMatched
      ? `Claimant email matches verified company domain (${matchedDomainLabel}); queued for owner confirmation. Direct integration and 10% commercial status remain off until explicit owner approval.`
      : listedPhoneMatched
        ? `Claimant phone matches official listed operator phone; requires callback/SMS verification and owner review before workspace activation.`
        : `Claimant email/phone differs from public company domain; held for manual owner verification before granting profile control.`,
  };
}

export const CORE_OPERATOR_FIELD_AUTHORITY_MATRIX = {
  operatorEditableWhenClaimedAndVerified: [
    "companyOverview",
    "logoAndLicensedPhotos",
    "submittedTourProducts",
    "officialPhone",
    "socialLinks",
    "accessibilityAndMobilityNotes",
    "weightAndAgePolicies",
    "operatorReviewReplies",
  ],
  dccVerifiedReadOnlyRequiresVerificationQueue: [
    "canonicalPlaceAndMeetingCoordinates",
    "verifiedOwnershipBadges",
  ],
  ownerOnlyCommercialAndIntegrationGates: [
    "liveAvailabilityConnected",
    "directCheckoutConnected",
    "commercialTermsSigned10Pct",
    "publicationGateOverrides",
  ],
} as const;

// ============================================================================
// 7. PRODUCT, DEPARTURE SLOTS & CATEGORY COMPARISONS
// ============================================================================

export interface DirectoryDepartureSlot {
  departureId: string;
  localStartTime: string;
  durationMinutes: number;
  meetingPointId?: string | null;
  pickupAvailable: boolean;
  seasonOrDayNotes?: string | null;
}

export function normalizeProductDepartureSlots(params: {
  productId: string;
  typicalDepartureTimes: readonly string[];
  durationMinutes: number;
  pickupAvailable: boolean;
  meetingPointId?: string | null;
}): DirectoryDepartureSlot[] {
  return params.typicalDepartureTimes.map((timeLabel, idx) => ({
    departureId: `${params.productId}:dep:${idx + 1}`,
    localStartTime: timeLabel,
    durationMinutes: params.durationMinutes,
    meetingPointId: params.meetingPointId ?? null,
    pickupAvailable: params.pickupAvailable,
    seasonOrDayNotes: null,
  }));
}

export interface DirectoryProductCoreRecord<
  TReview extends { reviewId: string; operatorId: string } = DirectoryProductReviewRecord,
> {
  productId: string;
  productSlug: string;
  legacyRouteAliases?: readonly { company: string; item: string }[];
  operatorId: string;
  operatorSlug: string;
  operatorName: string;
  primaryPlaceId: string;
  placeSlug: string;
  categorySlug: string;
  secondaryCategorySlugs?: readonly string[];
  title: string;
  summary: string;
  durationLabel: string;
  durationMinutes: number;
  typicalDepartureTimes: readonly string[];
  departures?: readonly DirectoryDepartureSlot[];
  fromPriceUsd: number | null;
  priceDisplayLabel: string;
  meetingPoint: string;
  pickupIncluded: boolean;
  pickupDetails: string;
  accessibilityNotes: string;
  participantRestrictions: string;
  image: string;
  imageAlt: string;
  imageCredit: string;
  bookingChannel: ProductBookingChannel;
  authorizedSupplierBinding?: AuthorizedSupplierProductBinding | null;
  viatorProductCode?: string | null;
  viatorOfficialUrl?: string | null;
  officialProductUrl: string;
  attributionCampaign: string;
  isCommerciallyHeld?: boolean;
  commercialHoldReason?: string | null;
  productReviews: readonly TReview[];
  verifiedAt: string | null;
  lastModifiedAt: string;
}

export interface DirectoryCategoryDefinition {
  categorySlug: string;
  name: string;
  shortLabel: string;
  summary: string;
  image: string;
  imageAlt: string;
  imageCredit: string;
}

export interface PlaceCategoryComparisonCore {
  placeSlug: string;
  categorySlug: string;
  h1: string;
  title: string;
  metaDescription: string;
  comparisonIntro: string;
  keyDifferencesBullets: readonly string[];
  arrivalAndTimingGuidance: string;
  manualSignatureAllowlist?: {
    approved: boolean;
    approvedBy: string;
    rationale: string;
  } | null;
  verifiedAt: string;
  lastModifiedAt: string;
}

// ============================================================================
// 8. REGION-NEUTRAL FAIL-CLOSED PUBLICATION GATES
// ============================================================================

export type CorePublicationGateHoldReasonCode =
  | "MISSING_VERIFIED_IDENTITY"
  | "MISSING_OFFICIAL_CONTACT_SOURCE"
  | "MISSING_VERIFIED_OPERATING_PLACE"
  | "NO_VERIFIED_TOUR_PRODUCTS"
  | "THIN_OR_MISSING_ORIGINAL_SUMMARY"
  | "MISSING_PRIMARY_SOURCE_OR_FRESHNESS"
  | "EXPLICIT_RESEARCH_QUEUE_HOLD"
  | "PLACE_MISSING_FACILITY_OR_ACCESS_CONTEXT"
  | "PLACE_MISSING_OFFICIAL_LOCAL_SOURCE"
  | "PLACE_MISSING_SUBSTANTIVE_LOGISTICS"
  | "CATEGORY_FEWER_THAN_2_VERIFIED_OPERATORS"
  | "CATEGORY_FEWER_THAN_3_VERIFIED_PRODUCTS"
  | "CATEGORY_MISSING_SUBSTANTIVE_COMPARISON";

export interface EntityPublicationGateEvaluation<
  TReasonCode extends string = CorePublicationGateHoldReasonCode,
  TEntityType extends string = "place" | "operator" | "place_category",
> {
  entityType: TEntityType;
  entityId: string;
  publicPath: string | null;
  indexable: boolean;
  includeInSitemap: boolean;
  robotsDirective: "index, follow" | "noindex, follow";
  status: "published_indexable" | "held_noindex";
  holdReasonCodes: TReasonCode[];
  holdDetails: string[];
  metrics?: Record<string, number | boolean | string>;
}

export function evaluateCoreLocationPublicationGate<
  TReasonCode extends string = CorePublicationGateHoldReasonCode,
>(params: {
  placeId: string;
  publicPath: string | null;
  hasPublicDirectoryPage: boolean;
  placeType: string;
  overview: string;
  accessAndLogisticsSummary: string;
  accessPointCount: number;
  officialLocalSourceCount: number;
  verifiedAt: string | null;
  explicitHoldReasons?: readonly string[];
  additionalChecks?: Array<{ code: TReasonCode; detail: string }>;
  extraMetrics?: Record<string, number | boolean | string>;
}): EntityPublicationGateEvaluation<TReasonCode, "place"> {
  const holdReasonCodes: TReasonCode[] = [];
  const holdDetails: string[] = [];

  if (params.explicitHoldReasons && params.explicitHoldReasons.length > 0) {
    holdReasonCodes.push("EXPLICIT_RESEARCH_QUEUE_HOLD" as TReasonCode);
    holdDetails.push(...params.explicitHoldReasons);
  }
  if (params.accessPointCount <= 0) {
    holdReasonCodes.push("PLACE_MISSING_FACILITY_OR_ACCESS_CONTEXT" as TReasonCode);
    holdDetails.push("Missing verified facility, transit, harbor, or meeting-point access record.");
  }
  if (params.officialLocalSourceCount <= 0) {
    holdReasonCodes.push("PLACE_MISSING_OFFICIAL_LOCAL_SOURCE" as TReasonCode);
    holdDetails.push("Missing official municipal, civic, DMO, or park authority source.");
  }
  if (
    !params.overview ||
    params.overview.trim().length < 120 ||
    !params.accessAndLogisticsSummary ||
    params.accessAndLogisticsSummary.trim().length < 80
  ) {
    holdReasonCodes.push("PLACE_MISSING_SUBSTANTIVE_LOGISTICS" as TReasonCode);
    holdDetails.push("Overview or local access/pickup logistics copy is below substantive threshold.");
  }
  if (!params.verifiedAt) {
    holdReasonCodes.push("MISSING_PRIMARY_SOURCE_OR_FRESHNESS" as TReasonCode);
    holdDetails.push("Missing verifiedAt freshness timestamp.");
  }
  if (params.additionalChecks) {
    for (const extra of params.additionalChecks) {
      holdReasonCodes.push(extra.code);
      holdDetails.push(extra.detail);
    }
  }

  const indexable = params.hasPublicDirectoryPage && holdReasonCodes.length === 0;
  return {
    entityType: "place",
    entityId: params.placeId,
    publicPath: params.hasPublicDirectoryPage ? params.publicPath : null,
    indexable,
    includeInSitemap: indexable,
    robotsDirective: indexable ? "index, follow" : "noindex, follow",
    status: indexable ? "published_indexable" : "held_noindex",
    holdReasonCodes,
    holdDetails,
    metrics: {
      placeType: params.placeType,
      accessPointCount: params.accessPointCount,
      officialSourceCount: params.officialLocalSourceCount,
      ...(params.extraMetrics || {}),
    },
  };
}

export function evaluateCoreOperatorPublicationGate<
  TReasonCode extends string = CorePublicationGateHoldReasonCode,
>(params: {
  operatorId: string;
  slug: string;
  name: string;
  officialWebsite: string | null;
  officialPhone: string | null;
  servedPlaceCount: number;
  publicPlaceSlugCount: number;
  meetingOrPickupRuleCount: number;
  companyOverview: string;
  logisticsSummary: string;
  sources: readonly PrimarySourceCitation<string>[];
  verifiedAt: string | null;
  explicitHoldReasons?: readonly string[];
  integrationApproval: OperatorIntegrationApprovalState;
  products: ReadonlyArray<{
    verifiedAt: string | null;
    durationMinutes: number;
    isCommerciallyHeld?: boolean;
  }>;
  publicPathPrefix?: string;
}): EntityPublicationGateEvaluation<TReasonCode, "operator"> {
  const holdReasonCodes: TReasonCode[] = [];
  const holdDetails: string[] = [];
  const pathPrefix = params.publicPathPrefix ?? "/operators";

  if (params.explicitHoldReasons && params.explicitHoldReasons.length > 0) {
    holdReasonCodes.push("EXPLICIT_RESEARCH_QUEUE_HOLD" as TReasonCode);
    holdDetails.push(...params.explicitHoldReasons);
  }
  if (
    !params.operatorId.startsWith("operator:") ||
    !params.slug.trim() ||
    !params.name.trim()
  ) {
    holdReasonCodes.push("MISSING_VERIFIED_IDENTITY" as TReasonCode);
    holdDetails.push("Missing canonical operatorId, slug, or company name.");
  }
  const hasOfficialWebsite = Boolean(
    params.officialWebsite && /^https?:\/\//i.test(params.officialWebsite),
  );
  const hasPhoneWithOfficialSource = Boolean(
    params.officialPhone &&
      params.sources.some((s) => s.sourceKind !== "verified_partner_catalog"),
  );
  if (!hasOfficialWebsite && !hasPhoneWithOfficialSource) {
    holdReasonCodes.push("MISSING_OFFICIAL_CONTACT_SOURCE" as TReasonCode);
    holdDetails.push(
      "Requires verified official website or verified phone backed by municipal/DMO/authority listing.",
    );
  }
  if (
    params.servedPlaceCount <= 0 ||
    params.publicPlaceSlugCount <= 0 ||
    params.meetingOrPickupRuleCount <= 0
  ) {
    holdReasonCodes.push("MISSING_VERIFIED_OPERATING_PLACE" as TReasonCode);
    holdDetails.push(
      "Missing verified operating community/place or meeting/pickup rule.",
    );
  }
  const verifiedProducts = params.products.filter(
    (p) =>
      Boolean(p.verifiedAt) && p.durationMinutes > 0 && !p.isCommerciallyHeld,
  );
  if (verifiedProducts.length === 0) {
    holdReasonCodes.push("NO_VERIFIED_TOUR_PRODUCTS" as TReasonCode);
    holdDetails.push("Requires at least 1 verified non-held product with real duration.");
  }
  if (
    !params.companyOverview ||
    params.companyOverview.trim().length < 110 ||
    !params.logisticsSummary ||
    params.logisticsSummary.trim().length < 70
  ) {
    holdReasonCodes.push("THIN_OR_MISSING_ORIGINAL_SUMMARY" as TReasonCode);
    holdDetails.push("Company overview or arrival/pickup summary is missing or too thin.");
  }
  if (!params.verifiedAt || params.sources.length === 0) {
    holdReasonCodes.push("MISSING_PRIMARY_SOURCE_OR_FRESHNESS" as TReasonCode);
    holdDetails.push("Missing primary source URLs or verifiedAt timestamp.");
  }

  const indexable = holdReasonCodes.length === 0;
  return {
    entityType: "operator",
    entityId: params.operatorId,
    publicPath: `${pathPrefix}/${params.slug}`,
    indexable,
    includeInSitemap: indexable,
    robotsDirective: indexable ? "index, follow" : "noindex, follow",
    status: indexable ? "published_indexable" : "held_noindex",
    holdReasonCodes,
    holdDetails,
    metrics: {
      verifiedProductCount: verifiedProducts.length,
      totalCatalogProductCount: params.products.length,
      sourceCount: params.sources.length,
      liveAvailabilityConnected: isOperatorLiveAvailabilityConnected({
        integrationApproval: params.integrationApproval,
      }),
      directCheckoutConnected: isOperatorDirectCheckoutConnected({
        integrationApproval: params.integrationApproval,
      }),
    },
  };
}

export function evaluateCorePlaceCategoryPublicationGate<
  TReasonCode extends string = CorePublicationGateHoldReasonCode,
  TEntityType extends string = "place_category",
>(params: {
  placeSlug: string;
  categorySlug: string;
  entityTypeLabel?: TEntityType;
  entityIdPrefix?: string;
  publicPlacePathPrefix?: string;
  comparison: {
    comparisonIntro: string;
    keyDifferencesBullets: readonly string[];
    logisticsGuidance: string;
    manualSignatureAllowlist?: {
      approved: boolean;
      approvedBy: string;
      rationale: string;
    } | null;
  } | null;
  qualifiedOperatorIds: readonly string[];
  qualifiedProducts: ReadonlyArray<{
    verifiedAt: string | null;
    isCommerciallyHeld?: boolean;
  }>;
}): EntityPublicationGateEvaluation<TReasonCode, TEntityType> {
  const placePathPrefix = params.publicPlacePathPrefix ?? "/places";
  const entityType = (params.entityTypeLabel ?? "place_category") as TEntityType;
  const idPrefix = params.entityIdPrefix ?? "place_category";

  const distinctOperatorCount = new Set(params.qualifiedOperatorIds).size;
  const verifiedProductCount = params.qualifiedProducts.filter(
    (p) => Boolean(p.verifiedAt) && !p.isCommerciallyHeld,
  ).length;
  const hasSubstantiveComparison = Boolean(
    params.comparison &&
      params.comparison.comparisonIntro.trim().length >= 120 &&
      params.comparison.keyDifferencesBullets.length >= 3 &&
      params.comparison.logisticsGuidance.trim().length >= 80,
  );

  const manualExceptionApproved = Boolean(
    params.comparison?.manualSignatureAllowlist?.approved &&
      params.comparison.manualSignatureAllowlist.rationale.trim().length >= 30,
  );

  const holdReasonCodes: TReasonCode[] = [];
  const holdDetails: string[] = [];

  if (!manualExceptionApproved) {
    if (distinctOperatorCount < 2) {
      holdReasonCodes.push("CATEGORY_FEWER_THAN_2_VERIFIED_OPERATORS" as TReasonCode);
      holdDetails.push(
        `Category has ${distinctOperatorCount} verified operator(s) in ${params.placeSlug}; requires at least 2 distinct verified operators (remain consolidated inside ${placePathPrefix}/${params.placeSlug}).`,
      );
    }
    if (verifiedProductCount < 3) {
      holdReasonCodes.push("CATEGORY_FEWER_THAN_3_VERIFIED_PRODUCTS" as TReasonCode);
      holdDetails.push(
        `Category has ${verifiedProductCount} verified product(s) in ${params.placeSlug}; requires at least 3 verified products (remain consolidated inside ${placePathPrefix}/${params.placeSlug}).`,
      );
    }
  }

  if (!hasSubstantiveComparison) {
    holdReasonCodes.push("CATEGORY_MISSING_SUBSTANTIVE_COMPARISON" as TReasonCode);
    holdDetails.push(
      `Category ${placePathPrefix}/${params.placeSlug}/${params.categorySlug} lacks substantive multi-option comparison copy and arrival-timing guidance.`,
    );
  }

  const indexable = holdReasonCodes.length === 0;
  return {
    entityType,
    entityId: `${idPrefix}:${params.placeSlug}:${params.categorySlug}`,
    publicPath: `${placePathPrefix}/${params.placeSlug}/${params.categorySlug}`,
    indexable,
    includeInSitemap: indexable,
    robotsDirective: indexable ? "index, follow" : "noindex, follow",
    status: indexable ? "published_indexable" : "held_noindex",
    holdReasonCodes,
    holdDetails,
    metrics: {
      distinctVerifiedOperatorCount: distinctOperatorCount,
      verifiedProductCount,
      hasSubstantiveComparisonContent: hasSubstantiveComparison,
      manualSignatureAllowlistUsed: manualExceptionApproved,
    },
  };
}
