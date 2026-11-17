/**
 * Phase 1 — Canonical Southeast Alaska Directory, Distinct Place-Type Graph,
 * Fail-Closed Publication Gates, Claim-Control Verification, and Owner-Gated
 * Direct Integration Contract (`lib/dcc/shared/southeastAlaskaDirectoryContract.ts`).
 *
 * Pure TypeScript (zero `node:fs`, zero DB drivers) so both Destination Command Center
 * (`destinationcommandcenter.com`) and Last Frontier Shore Excursions
 * (`www.lastfrontiershoreexcursions.com` in `apps/last-frontier-shore-excursions`)
 * enforce identical entity IDs, non-aliasing rules, and publication gates.
 */

export const UNCLAIMED_OPERATOR_PROFILE_NOTICE =
  "Independent source-backed profile. This company has not yet claimed or verified this page." as const;

export const SOUTHEAST_ALASKA_PLACE_TYPES = [
  "community",
  "cruise_terminal",
  "harbor",
  "national_park",
  "scenic_cruise_destination",
] as const;

export type SoutheastAlaskaPlaceType =
  (typeof SOUTHEAST_ALASKA_PLACE_TYPES)[number];

export type PlaceRelationshipKind =
  | "serves_community"
  | "cruise_terminal_for_community"
  | "local_harbor"
  | "gateway_community"
  | "scenic_park_waterway"
  | "fast_ferry_corridor"
  | "island_road_corridor";

export interface PlaceRelationshipLink {
  targetPlaceId: string;
  targetPublicPortSlug: string | null;
  targetName: string;
  targetPlaceType: SoutheastAlaskaPlaceType;
  relationship: PlaceRelationshipKind;
  distanceOrTransitSummary: string;
  geographicExplanation: string;
}

export interface PrimarySourceCitation {
  label: string;
  url: string;
  sourceKind:
    | "official_operator"
    | "municipal_harbor_or_port"
    | "official_dmo_tourism"
    | "nps_or_usfs_federal"
    | "tribal_or_native_corp"
    | "verified_partner_catalog";
  checkedAt: string;
}

export interface SoutheastAlaskaDockOrAccessPoint {
  locationId: string;
  name: string;
  facilityKind:
    | "berth"
    | "cruise_terminal"
    | "tender_landing"
    | "small_boat_harbor"
    | "meeting_point"
    | "ferry_or_air_gateway"
    | "scenic_waterway_no_berth";
  latitude: number;
  longitude: number;
  precisionTier:
    | "berth"
    | "terminal"
    | "tender_landing"
    | "meeting_point"
    | "port_gate"
    | "city_centroid";
  shuttleOrWalkNotes: string;
  additionalTransferMinutesEachWay: number;
}

export interface VisitingCruiseShipSummary {
  shipSlug: string;
  shipName: string;
  cruiseLine: string;
  callPattern: string;
  typicalPortWindow: string;
  berthOrAccessNote: string;
  cruisePromenadeShipHref: string;
}

export interface SoutheastAlaskaPlaceRecord {
  placeId: string;
  publicPortSlug: string | null;
  hasPublicDirectoryPage: boolean;
  name: string;
  subRegionLabel: string;
  placeType: SoutheastAlaskaPlaceType;
  secondaryPlaceTypes?: readonly SoutheastAlaskaPlaceType[];
  neverAliasOrRedirectToSlugs?: readonly string[];
  largeCruiseShipDisembarkationAllowed: boolean;
  disembarkationExplanation: string;
  heroImage: string;
  heroImageAlt: string;
  heroImageCredit: string;
  hook: string;
  overview: string;
  portAndDockSummary: string;
  cruisePickupDropoffNotes: string;
  typicalPortHours: string;
  recommendedReturnBufferMinutes: 120;
  weatherBackupAdvice: string;
  docksAndAccessPoints: readonly SoutheastAlaskaDockOrAccessPoint[];
  relatedPlaces: readonly PlaceRelationshipLink[];
  visitingShips: readonly VisitingCruiseShipSummary[];
  officialLocalSources: readonly PrimarySourceCitation[];
  verifiedAt: string | null;
  lastModifiedAt: string;
  explicitHoldReasons?: readonly string[];
}

export type VerifiedOwnershipTag =
  | "locally_owned"
  | "independent_small_boat"
  | "alaska_native_corporation_owned"
  | "tribal_member_or_indigenous_owned"
  | "regional_alaska_operator"
  | "historic_rail_or_utility_operator";

export interface VerifiedOwnershipBadge {
  tag: VerifiedOwnershipTag;
  label: string;
  evidenceSummary: string;
  sourceUrl: string;
}

export type BookingPlatformType =
  | "FareHarbor"
  | "Rezgo"
  | "Rezdy"
  | "Peek Pro"
  | "Direct Website"
  | "Phone / Charter Inquiry"
  | "Unverified";

export interface OperatorDockPickupRule {
  placeId: string;
  dockOrTerminalName: string;
  pickupProvided: boolean;
  meetingPointInstructions: string;
  addedBufferMinutesEachWay: number;
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
  approvedAt: string | null;
  approvedBy: string | null;
  notes: string;
}

export interface OperatorEntityReviewRecord {
  reviewId: string;
  entityScope: "operator";
  operatorId: string;
  reviewerDisplayName: string;
  sailingOrVisitMonth: string;
  verificationBasis: "verified_booking_or_owner_moderated";
  communicationAndPickupSummary: string;
  operatorReply?: string | null;
  publishedAt: string;
}

export interface TourEntityReviewRecord {
  reviewId: string;
  entityScope: "tour";
  tourId: string;
  operatorId: string;
  reviewerDisplayName: string;
  sailingOrVisitMonth: string;
  verificationBasis: "verified_booking_or_owner_moderated";
  experienceSummary: string;
  operatorReply?: string | null;
  publishedAt: string;
}

export interface SoutheastAlaskaOperatorRecord {
  operatorId: string;
  slug: string;
  legacyCompanyAliases?: readonly string[];
  separateFromOperatorIds?: readonly string[];
  separationGovernanceNote?: string;
  name: string;
  tagline: string;
  headquartersCommunityId: string;
  servedPlaceIds: readonly string[];
  publicPortSlugs: readonly string[];
  categorySlugs: readonly string[];
  verifiedOwnershipBadges: readonly VerifiedOwnershipBadge[];
  companyOverview: string;
  cruiseLogisticsSummary: string;
  officialWebsite: string | null;
  officialEmailDomain: string | null;
  officialPhone: string | null;
  yearEstablished?: number | null;
  socialLinks: Readonly<Record<string, string>>;
  bookingPlatform: BookingPlatformType;
  fareharborShortname?: string | null;
  rezgoDomain?: string | null;
  dockPickupRules: readonly OperatorDockPickupRule[];
  accessibilityAndMobilityNotes: string;
  weightAndAgePolicies: string;
  heroImage: string;
  heroImageAlt: string;
  heroImageCredit: string;
  claimStatus: "unclaimed" | "claim_pending_verification" | "claimed_verified";
  integrationApproval: OperatorIntegrationApprovalState;
  operatorReviews: readonly OperatorEntityReviewRecord[];
  sources: readonly PrimarySourceCitation[];
  verifiedAt: string | null;
  lastModifiedAt: string;
  explicitHoldReasons?: readonly string[];
}

export interface SoutheastAlaskaTourProductRecord {
  tourId: string;
  tourSlug: string;
  legacyRouteAliases?: readonly { company: string; item: string }[];
  operatorId: string;
  operatorSlug: string;
  operatorName: string;
  primaryPlaceId: string;
  portSlug: string;
  categorySlug: string;
  secondaryCategorySlugs?: readonly string[];
  legacyPortActivityHref?: string | null;
  title: string;
  summary: string;
  durationLabel: string;
  durationMinutes: number;
  typicalDepartureTimes: readonly string[];
  fromPriceUsd: number | null;
  priceDisplayLabel: string;
  meetingPoint: string;
  cruisePickupIncluded: boolean;
  pickupDetails: string;
  transferBufferMinutesEachWay: number;
  recommendedMinPortHours: number;
  weatherSensitivity: "Low" | "Moderate" | "High";
  accessibilityNotes: string;
  weightOrAgeRestrictions: string;
  image: string;
  imageAlt: string;
  imageCredit: string;
  bookingChannel:
    | "viator_exact_product"
    | "official_operator_website"
    | "held_pending_verification";
  viatorProductCode?: string | null;
  viatorOfficialUrl?: string | null;
  officialProductUrl: string;
  attributionCampaign: string;
  isCommerciallyHeld?: boolean;
  commercialHoldReason?: string | null;
  tourReviews: readonly TourEntityReviewRecord[];
  verifiedAt: string | null;
  lastModifiedAt: string;
}

export interface SoutheastAlaskaCategoryDefinition {
  categorySlug: string;
  name: string;
  shortLabel: string;
  summary: string;
  image: string;
  imageAlt: string;
  imageCredit: string;
  legacyActivitySlugByPort?: Readonly<Record<string, string>>;
}

export interface PortCategoryComparisonContent {
  portSlug: string;
  categorySlug: string;
  h1: string;
  title: string;
  metaDescription: string;
  comparisonIntro: string;
  keyDifferencesBullets: readonly string[];
  dockAndTimingGuidance: string;
  juneauFlightDeckNote?: string | null;
  manualSignatureAllowlist?: {
    approved: boolean;
    approvedBy: string;
    rationale: string;
  } | null;
  verifiedAt: string;
  lastModifiedAt: string;
}

export type PublicationGateHoldReasonCode =
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
  | "PLACE_MISSING_SCENIC_NON_DISEMBARKATION_DISCLOSURE"
  | "CATEGORY_FEWER_THAN_2_VERIFIED_OPERATORS"
  | "CATEGORY_FEWER_THAN_3_VERIFIED_PRODUCTS"
  | "CATEGORY_MISSING_SUBSTANTIVE_COMPARISON";

export interface EntityPublicationGateEvaluation {
  entityType: "place" | "operator" | "port_category";
  entityId: string;
  publicPath: string | null;
  indexable: boolean;
  includeInSitemap: boolean;
  robotsDirective: "index, follow" | "noindex, follow";
  status: "published_indexable" | "held_noindex";
  holdReasonCodes: PublicationGateHoldReasonCode[];
  holdDetails: string[];
  metrics?: Record<string, number | boolean | string>;
}

export function isOperatorLiveAvailabilityConnected(
  operator: Pick<SoutheastAlaskaOperatorRecord, "integrationApproval">,
): boolean {
  return (
    operator.integrationApproval.connectionRequestStatus === "approved_live" &&
    operator.integrationApproval.liveAvailabilityApprovedByOwner === true
  );
}

export function isOperatorDirectCheckoutConnected(
  operator: Pick<SoutheastAlaskaOperatorRecord, "integrationApproval">,
): boolean {
  return (
    operator.integrationApproval.connectionRequestStatus === "approved_live" &&
    operator.integrationApproval.directCheckoutApprovedByOwner === true &&
    operator.integrationApproval.commercialTermsSigned10Pct === true
  );
}

export function evaluatePlacePublicationGate(
  place: SoutheastAlaskaPlaceRecord,
): EntityPublicationGateEvaluation {
  const holdReasonCodes: PublicationGateHoldReasonCode[] = [];
  const holdDetails: string[] = [];

  if (place.explicitHoldReasons && place.explicitHoldReasons.length > 0) {
    holdReasonCodes.push("EXPLICIT_RESEARCH_QUEUE_HOLD");
    holdDetails.push(...place.explicitHoldReasons);
  }
  if (!place.docksAndAccessPoints || place.docksAndAccessPoints.length === 0) {
    holdReasonCodes.push("PLACE_MISSING_FACILITY_OR_ACCESS_CONTEXT");
    holdDetails.push("Missing verified dock, harbor, tender, or waterway access record.");
  }
  if (!place.officialLocalSources || place.officialLocalSources.length === 0) {
    holdReasonCodes.push("PLACE_MISSING_OFFICIAL_LOCAL_SOURCE");
    holdDetails.push("Missing official municipal, harbor, DMO, or National Park source.");
  }
  if (
    !place.overview ||
    place.overview.trim().length < 120 ||
    !place.portAndDockSummary ||
    place.portAndDockSummary.trim().length < 80
  ) {
    holdReasonCodes.push("PLACE_MISSING_SUBSTANTIVE_LOGISTICS");
    holdDetails.push("Overview or dock/pickup logistics copy is below substantive threshold.");
  }
  if (!place.verifiedAt) {
    holdReasonCodes.push("MISSING_PRIMARY_SOURCE_OR_FRESHNESS");
    holdDetails.push("Missing verifiedAt freshness timestamp.");
  }
  if (
    place.placeType === "scenic_cruise_destination" &&
    (place.largeCruiseShipDisembarkationAllowed !== false ||
      !/do not dock|do not disembark|no shore disembarkation/i.test(
        place.disembarkationExplanation,
      ))
  ) {
    holdReasonCodes.push("PLACE_MISSING_SCENIC_NON_DISEMBARKATION_DISCLOSURE");
    holdDetails.push(
      "Scenic cruise destination must explicitly state that large cruise ships do not dock or disembark passengers.",
    );
  }

  const indexable = place.hasPublicDirectoryPage && holdReasonCodes.length === 0;
  return {
    entityType: "place",
    entityId: place.placeId,
    publicPath:
      place.hasPublicDirectoryPage && place.publicPortSlug
        ? `/ports/${place.publicPortSlug}`
        : null,
    indexable,
    includeInSitemap: indexable,
    robotsDirective: indexable ? "index, follow" : "noindex, follow",
    status: indexable ? "published_indexable" : "held_noindex",
    holdReasonCodes,
    holdDetails,
    metrics: {
      placeType: place.placeType,
      dockOrAccessPointCount: place.docksAndAccessPoints.length,
      officialSourceCount: place.officialLocalSources.length,
      largeCruiseShipDisembarkationAllowed:
        place.largeCruiseShipDisembarkationAllowed,
    },
  };
}

export function evaluateOperatorPublicationGate(
  operator: SoutheastAlaskaOperatorRecord,
  operatorTours: readonly SoutheastAlaskaTourProductRecord[],
): EntityPublicationGateEvaluation {
  const holdReasonCodes: PublicationGateHoldReasonCode[] = [];
  const holdDetails: string[] = [];

  if (operator.explicitHoldReasons && operator.explicitHoldReasons.length > 0) {
    holdReasonCodes.push("EXPLICIT_RESEARCH_QUEUE_HOLD");
    holdDetails.push(...operator.explicitHoldReasons);
  }
  if (
    !operator.operatorId.startsWith("operator:") ||
    !operator.slug.trim() ||
    !operator.name.trim()
  ) {
    holdReasonCodes.push("MISSING_VERIFIED_IDENTITY");
    holdDetails.push("Missing canonical operatorId, slug, or company name.");
  }
  const hasOfficialWebsite = Boolean(
    operator.officialWebsite && /^https?:\/\//i.test(operator.officialWebsite),
  );
  const hasPhoneWithOfficialSource = Boolean(
    operator.officialPhone &&
      operator.sources.some((s) => s.sourceKind !== "verified_partner_catalog"),
  );
  if (!hasOfficialWebsite && !hasPhoneWithOfficialSource) {
    holdReasonCodes.push("MISSING_OFFICIAL_CONTACT_SOURCE");
    holdDetails.push(
      "Requires verified official website or verified phone backed by municipal/DMO/harbor listing.",
    );
  }
  if (
    operator.servedPlaceIds.length === 0 ||
    operator.publicPortSlugs.length === 0 ||
    operator.dockPickupRules.length === 0
  ) {
    holdReasonCodes.push("MISSING_VERIFIED_OPERATING_PLACE");
    holdDetails.push(
      "Missing verified operating community/port or cruise meeting/pickup rule.",
    );
  }
  const verifiedTours = operatorTours.filter(
    (t) =>
      Boolean(t.verifiedAt) &&
      t.durationMinutes > 0 &&
      !t.isCommerciallyHeld,
  );
  if (verifiedTours.length === 0) {
    holdReasonCodes.push("NO_VERIFIED_TOUR_PRODUCTS");
    holdDetails.push("Requires at least 1 verified non-held tour product with real duration.");
  }
  if (
    !operator.companyOverview ||
    operator.companyOverview.trim().length < 110 ||
    !operator.cruiseLogisticsSummary ||
    operator.cruiseLogisticsSummary.trim().length < 70
  ) {
    holdReasonCodes.push("THIN_OR_MISSING_ORIGINAL_SUMMARY");
    holdDetails.push("Company overview or cruise-logistics summary is missing or too thin.");
  }
  if (!operator.verifiedAt || operator.sources.length === 0) {
    holdReasonCodes.push("MISSING_PRIMARY_SOURCE_OR_FRESHNESS");
    holdDetails.push("Missing primary source URLs or verifiedAt timestamp.");
  }

  const indexable = holdReasonCodes.length === 0;
  return {
    entityType: "operator",
    entityId: operator.operatorId,
    publicPath: `/operators/${operator.slug}`,
    indexable,
    includeInSitemap: indexable,
    robotsDirective: indexable ? "index, follow" : "noindex, follow",
    status: indexable ? "published_indexable" : "held_noindex",
    holdReasonCodes,
    holdDetails,
    metrics: {
      verifiedProductCount: verifiedTours.length,
      totalCatalogProductCount: operatorTours.length,
      sourceCount: operator.sources.length,
      liveAvailabilityConnected: isOperatorLiveAvailabilityConnected(operator),
      directCheckoutConnected: isOperatorDirectCheckoutConnected(operator),
    },
  };
}

export function evaluatePortCategoryPublicationGate(params: {
  portSlug: string;
  categorySlug: string;
  comparison: PortCategoryComparisonContent | null;
  qualifiedOperatorIdsForPortCategory: readonly string[];
  qualifiedProductsForPortCategory: readonly SoutheastAlaskaTourProductRecord[];
}): EntityPublicationGateEvaluation {
  const {
    portSlug,
    categorySlug,
    comparison,
    qualifiedOperatorIdsForPortCategory,
    qualifiedProductsForPortCategory,
  } = params;
  const distinctOperatorCount = new Set(qualifiedOperatorIdsForPortCategory).size;
  const verifiedProductCount = qualifiedProductsForPortCategory.filter(
    (p) => Boolean(p.verifiedAt) && !p.isCommerciallyHeld,
  ).length;
  const hasSubstantiveComparison = Boolean(
    comparison &&
      comparison.comparisonIntro.trim().length >= 120 &&
      comparison.keyDifferencesBullets.length >= 3 &&
      comparison.dockAndTimingGuidance.trim().length >= 80,
  );

  const manualExceptionApproved = Boolean(
    comparison?.manualSignatureAllowlist?.approved &&
      comparison.manualSignatureAllowlist.rationale.trim().length >= 30,
  );

  const holdReasonCodes: PublicationGateHoldReasonCode[] = [];
  const holdDetails: string[] = [];

  if (!manualExceptionApproved) {
    if (distinctOperatorCount < 2) {
      holdReasonCodes.push("CATEGORY_FEWER_THAN_2_VERIFIED_OPERATORS");
      holdDetails.push(
        `Category has ${distinctOperatorCount} verified operator(s) in ${portSlug}; requires at least 2 distinct verified operators (remain consolidated inside /ports/${portSlug}).`,
      );
    }
    if (verifiedProductCount < 3) {
      holdReasonCodes.push("CATEGORY_FEWER_THAN_3_VERIFIED_PRODUCTS");
      holdDetails.push(
        `Category has ${verifiedProductCount} verified product(s) in ${portSlug}; requires at least 3 verified products (remain consolidated inside /ports/${portSlug}).`,
      );
    }
  }

  if (!hasSubstantiveComparison) {
    holdReasonCodes.push("CATEGORY_MISSING_SUBSTANTIVE_COMPARISON");
    holdDetails.push(
      `Category /ports/${portSlug}/${categorySlug} lacks substantive multi-option comparison copy and dock-timing guidance.`,
    );
  }

  const indexable = holdReasonCodes.length === 0;
  return {
    entityType: "port_category",
    entityId: `port_category:${portSlug}:${categorySlug}`,
    publicPath: `/ports/${portSlug}/${categorySlug}`,
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
  operator: Pick<
    SoutheastAlaskaOperatorRecord,
    "operatorId" | "name" | "officialEmailDomain" | "officialWebsite" | "officialPhone"
  >;
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
      ? `Claimant email matches verified company domain (${officialDomain}); queued for owner confirmation. Direct integration and 10% commercial status remain off until explicit owner approval.`
      : listedPhoneMatched
        ? `Claimant phone matches official listed operator phone; requires callback/SMS verification and owner review before workspace activation.`
        : `Claimant email/phone differs from public company domain; held for manual owner verification before granting profile control.`,
  };
}

export const OPERATOR_FIELD_AUTHORITY_MATRIX = {
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
    "visitingCruiseShipSchedules",
    "canonicalPlaceAndBerthCoordinates",
    "twoHourPierReturnBufferCalculations",
    "verifiedOwnershipBadges",
  ],
  ownerOnlyCommercialAndIntegrationGates: [
    "liveAvailabilityConnected",
    "directCheckoutConnected",
    "commercialTermsSigned10Pct",
    "publicationGateOverrides",
  ],
} as const;

export function evaluateCruiseSailingPortFit(params: {
  shipArrivalMinutesFromMidnight: number;
  shipAllAboardMinutesFromMidnight: number;
  tourDepartureMinutesFromMidnight: number;
  tourDurationMinutes: number;
  dockDisembarkBufferMinutes?: number;
  berthTransferMinutesEachWay?: number;
  mandatoryAllAboardBufferMinutes?: number;
}): {
  fitsRecommendedWindow: boolean;
  earliestReadyMinutes: number;
  estimatedBackAtPierMinutes: number;
  remainingBufferBeforeAllAboardMinutes: number;
  status: "fits_with_2h_buffer" | "starts_too_early" | "insufficient_return_buffer";
  explanation: string;
} {
  const disembarkMinutes = params.dockDisembarkBufferMinutes ?? 30;
  const berthTransfer = params.berthTransferMinutesEachWay ?? 0;
  const requiredBuffer = params.mandatoryAllAboardBufferMinutes ?? 120;

  const earliestReadyMinutes =
    params.shipArrivalMinutesFromMidnight + disembarkMinutes + berthTransfer;
  const estimatedBackAtPierMinutes =
    params.tourDepartureMinutesFromMidnight +
    params.tourDurationMinutes +
    berthTransfer;
  const remainingBufferBeforeAllAboardMinutes =
    params.shipAllAboardMinutesFromMidnight - estimatedBackAtPierMinutes;

  if (params.tourDepartureMinutesFromMidnight < earliestReadyMinutes) {
    return {
      fitsRecommendedWindow: false,
      earliestReadyMinutes,
      estimatedBackAtPierMinutes,
      remainingBufferBeforeAllAboardMinutes,
      status: "starts_too_early",
      explanation: `Departure starts before disembarkation + ${berthTransfer}m dock transfer completes.`,
    };
  }

  if (remainingBufferBeforeAllAboardMinutes < requiredBuffer) {
    return {
      fitsRecommendedWindow: false,
      earliestReadyMinutes,
      estimatedBackAtPierMinutes,
      remainingBufferBeforeAllAboardMinutes,
      status: "insufficient_return_buffer",
      explanation: `Returns with ${remainingBufferBeforeAllAboardMinutes}m before all-aboard (below recommended ${requiredBuffer}m pier buffer).`,
    };
  }

  return {
    fitsRecommendedWindow: true,
    earliestReadyMinutes,
    estimatedBackAtPierMinutes,
    remainingBufferBeforeAllAboardMinutes,
    status: "fits_with_2h_buffer",
    explanation: `Clears disembarkation and returns with ${remainingBufferBeforeAllAboardMinutes}m before all-aboard (meets ${requiredBuffer}m buffer).`,
  };
}
