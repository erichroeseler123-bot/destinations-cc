/**
 * Alaska & Cruise-Port Directory Extension Contract
 * (`lib/dcc/shared/alaskaDirectoryExtensionContract.ts`).
 *
 * Extends the region-neutral `regionalDirectoryCoreContract.ts` strictly with
 * Alaska- and cruise-specific domain structures:
 *   - Berths, cruise terminals, tender landings, and scenic non-disembarkation waterways
 *   - Visiting cruise ship schedules and berth/shuttle notes
 *   - Alaska Native Corporation / small-boat / glacier & wildlife operator context
 *   - Juneau Flight Deck specialist aviation boundary metadata
 *   - 2-hour (120-minute) cruise gangway return-buffer calculations
 */

import {
  CORE_OPERATOR_FIELD_AUTHORITY_MATRIX,
  evaluateCoreLocationPublicationGate,
  evaluateCoreOperatorPublicationGate,
  evaluateCorePlaceCategoryPublicationGate,
  type AuthorizedSupplierProductBinding,
  type BookingProviderPlatform,
  type CoreOwnershipTag,
  type CorePublicationGateHoldReasonCode,
  type CoreSourceKind,
  type DirectoryCategoryDefinition,
  type DirectoryDepartureSlot,
  type EntityPublicationGateEvaluation,
  type OperatorIntegrationApprovalState,
  type PrimarySourceCitation,
  type ProductBookingChannel,
  type VerifiedOwnershipBadge,
} from "./regionalDirectoryCoreContract";

export const ALASKA_DIRECTORY_EXTENSION_VERSION =
  "dcc.directory.ext.alaska-cruise.v1" as const;

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

export type AlaskaSourceKind =
  | CoreSourceKind
  | "municipal_harbor_or_port"
  | "nps_or_usfs_federal"
  | "tribal_or_native_corp";

export type AlaskaPrimarySourceCitation = PrimarySourceCitation<AlaskaSourceKind>;

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
  officialLocalSources: readonly AlaskaPrimarySourceCitation[];
  verifiedAt: string | null;
  lastModifiedAt: string;
  explicitHoldReasons?: readonly string[];
}

export type VerifiedOwnershipTag =
  | CoreOwnershipTag
  | "independent_small_boat"
  | "alaska_native_corporation_owned"
  | "tribal_member_or_indigenous_owned"
  | "regional_alaska_operator"
  | "historic_rail_or_utility_operator";

export type AlaskaVerifiedOwnershipBadge =
  VerifiedOwnershipBadge<VerifiedOwnershipTag>;

export type BookingPlatformType = BookingProviderPlatform;

export interface OperatorDockPickupRule {
  placeId: string;
  dockOrTerminalName: string;
  pickupProvided: boolean;
  meetingPointInstructions: string;
  addedBufferMinutesEachWay: number;
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
  verifiedOwnershipBadges: readonly AlaskaVerifiedOwnershipBadge[];
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
  sources: readonly AlaskaPrimarySourceCitation[];
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
  departures?: readonly DirectoryDepartureSlot[];
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
  bookingChannel: ProductBookingChannel;
  authorizedSupplierBinding?: AuthorizedSupplierProductBinding | null;
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

export interface SoutheastAlaskaCategoryDefinition
  extends DirectoryCategoryDefinition {
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
  | CorePublicationGateHoldReasonCode
  | "PLACE_MISSING_SCENIC_NON_DISEMBARKATION_DISCLOSURE";

export type AlaskaEntityPublicationGateEvaluation =
  EntityPublicationGateEvaluation<
    PublicationGateHoldReasonCode,
    "place" | "operator" | "port_category"
  >;

export function evaluatePlacePublicationGate(
  place: SoutheastAlaskaPlaceRecord,
): AlaskaEntityPublicationGateEvaluation {
  const additionalChecks: Array<{
    code: PublicationGateHoldReasonCode;
    detail: string;
  }> = [];

  if (
    place.placeType === "scenic_cruise_destination" &&
    (place.largeCruiseShipDisembarkationAllowed !== false ||
      !/do not dock|do not disembark|no shore disembarkation/i.test(
        place.disembarkationExplanation,
      ))
  ) {
    additionalChecks.push({
      code: "PLACE_MISSING_SCENIC_NON_DISEMBARKATION_DISCLOSURE",
      detail:
        "Scenic cruise destination must explicitly state that large cruise ships do not dock or disembark passengers.",
    });
  }

  return evaluateCoreLocationPublicationGate<PublicationGateHoldReasonCode>({
    placeId: place.placeId,
    publicPath: place.publicPortSlug ? `/ports/${place.publicPortSlug}` : null,
    hasPublicDirectoryPage: place.hasPublicDirectoryPage,
    placeType: place.placeType,
    overview: place.overview,
    accessAndLogisticsSummary: place.portAndDockSummary,
    accessPointCount: place.docksAndAccessPoints.length,
    officialLocalSourceCount: place.officialLocalSources.length,
    verifiedAt: place.verifiedAt,
    explicitHoldReasons: place.explicitHoldReasons,
    additionalChecks,
    extraMetrics: {
      dockOrAccessPointCount: place.docksAndAccessPoints.length,
      largeCruiseShipDisembarkationAllowed:
        place.largeCruiseShipDisembarkationAllowed,
    },
  });
}

export function evaluateOperatorPublicationGate(
  operator: SoutheastAlaskaOperatorRecord,
  operatorTours: readonly SoutheastAlaskaTourProductRecord[],
): AlaskaEntityPublicationGateEvaluation {
  return evaluateCoreOperatorPublicationGate<PublicationGateHoldReasonCode>({
    operatorId: operator.operatorId,
    slug: operator.slug,
    name: operator.name,
    officialWebsite: operator.officialWebsite,
    officialPhone: operator.officialPhone,
    servedPlaceCount: operator.servedPlaceIds.length,
    publicPlaceSlugCount: operator.publicPortSlugs.length,
    meetingOrPickupRuleCount: operator.dockPickupRules.length,
    companyOverview: operator.companyOverview,
    logisticsSummary: operator.cruiseLogisticsSummary,
    sources: operator.sources,
    verifiedAt: operator.verifiedAt,
    explicitHoldReasons: operator.explicitHoldReasons,
    integrationApproval: operator.integrationApproval,
    products: operatorTours,
    publicPathPrefix: "/operators",
  });
}

export function evaluatePortCategoryPublicationGate(params: {
  portSlug: string;
  categorySlug: string;
  comparison: PortCategoryComparisonContent | null;
  qualifiedOperatorIdsForPortCategory: readonly string[];
  qualifiedProductsForPortCategory: readonly SoutheastAlaskaTourProductRecord[];
}): AlaskaEntityPublicationGateEvaluation {
  return evaluateCorePlaceCategoryPublicationGate<
    PublicationGateHoldReasonCode,
    "port_category"
  >({
    placeSlug: params.portSlug,
    categorySlug: params.categorySlug,
    entityTypeLabel: "port_category",
    entityIdPrefix: "port_category",
    publicPlacePathPrefix: "/ports",
    comparison: params.comparison
      ? {
          comparisonIntro: params.comparison.comparisonIntro,
          keyDifferencesBullets: params.comparison.keyDifferencesBullets,
          logisticsGuidance: params.comparison.dockAndTimingGuidance,
          manualSignatureAllowlist: params.comparison.manualSignatureAllowlist,
        }
      : null,
    qualifiedOperatorIds: params.qualifiedOperatorIdsForPortCategory,
    qualifiedProducts: params.qualifiedProductsForPortCategory,
  });
}

export const OPERATOR_FIELD_AUTHORITY_MATRIX = {
  operatorEditableWhenClaimedAndVerified:
    CORE_OPERATOR_FIELD_AUTHORITY_MATRIX.operatorEditableWhenClaimedAndVerified,
  dccVerifiedReadOnlyRequiresVerificationQueue: [
    ...CORE_OPERATOR_FIELD_AUTHORITY_MATRIX.dccVerifiedReadOnlyRequiresVerificationQueue,
    "visitingCruiseShipSchedules",
    "canonicalPlaceAndBerthCoordinates",
    "twoHourPierReturnBufferCalculations",
  ],
  ownerOnlyCommercialAndIntegrationGates:
    CORE_OPERATOR_FIELD_AUTHORITY_MATRIX.ownerOnlyCommercialAndIntegrationGates,
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
    explanation: `Fits sailing window with ${remainingBufferBeforeAllAboardMinutes}m pier buffer before all-aboard (meets >=${requiredBuffer}m standard).`,
  };
}
