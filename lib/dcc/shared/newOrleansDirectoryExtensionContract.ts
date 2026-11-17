/**
 * New Orleans Regional Directory & Knowledge Graph Extension Contract
 * (`lib/dcc/shared/newOrleansDirectoryExtensionContract.ts`).
 *
 * Composes strictly on top of the frozen region-neutral core contract
 * (`lib/dcc/shared/regionalDirectoryCoreContract.ts`, `dcc.directory.core.v1`).
 *
 * Encodes New Orleans-specific logistics and governance:
 *   1. Distinct wetland basins (Honey Island, Jean Lafitte / Barataria, Manchac),
 *      River Road heritage corridor, distinct historic-site/museum entities
 *      (Whitney Plantation, Oak Alley Plantation, Laura Plantation), separate
 *      Port NOLA cruise terminals (Erato Street vs. Julia Street), MSY Airport,
 *      and urban neighborhoods.
 *   2. Source-backed, traffic-qualified planning drive-time ranges (`isGuarantee: false`).
 *   3. Historically responsible River Road & enslavement-history framing.
 *   4. Operator vs. vessel separation (New Orleans Steamboat Company vs.
 *      Steamboat NATCHEZ & Riverboat CITY of NEW ORLEANS) and product/departure-level
 *      boarding-wharf resolution.
 *   5. Port NOLA turnaround & MSY flight timing-fit calculator.
 */

import {
  DIRECTORY_CORE_CONTRACT_VERSION,
  UNCLAIMED_OPERATOR_PROFILE_NOTICE,
  CORE_OPERATOR_FIELD_AUTHORITY_MATRIX,
  evaluateCoreLocationPublicationGate,
  evaluateCoreOperatorPublicationGate,
  evaluateCorePlaceCategoryPublicationGate,
  isOperatorLiveAvailabilityConnected,
  isOperatorDirectCheckoutConnected,
  type CoreLocationPrecisionTier,
  type CoreMeetingPointKind,
  type CoreOwnershipTag,
  type CorePublicationGateHoldReasonCode,
  type CoreSourceKind,
  type DirectoryCategoryDefinition,
  type DirectoryLocationCoreRecord,
  type DirectoryMeetingPointRecord,
  type DirectoryOperatorCoreRecord,
  type DirectoryOperatorReviewRecord,
  type DirectoryProductCoreRecord,
  type DirectoryProductReviewRecord,
  type EntityPublicationGateEvaluation,
  type LocationRelationshipLink,
  type OperatorMeetingRuleRecord,
  type PlaceCategoryComparisonCore,
  type PrimarySourceCitation,
} from "@/lib/dcc/shared/regionalDirectoryCoreContract";

export {
  DIRECTORY_CORE_CONTRACT_VERSION,
  UNCLAIMED_OPERATOR_PROFILE_NOTICE,
  isOperatorLiveAvailabilityConnected,
  isOperatorDirectCheckoutConnected,
};

export const NEW_ORLEANS_DIRECTORY_EXTENSION_VERSION =
  "dcc.directory.ext.new-orleans.v1" as const;

export const NEW_ORLEANS_DIRECTORY_SCHEMA_VERSION =
  "dcc.new-orleans.directory.v1" as const;

export const NEW_ORLEANS_OPERATOR_FIELD_AUTHORITY_MATRIX = {
  ...CORE_OPERATOR_FIELD_AUTHORITY_MATRIX,
  dccVerifiedReadOnlyRequiresVerificationQueue: [
    ...CORE_OPERATOR_FIELD_AUTHORITY_MATRIX.dccVerifiedReadOnlyRequiresVerificationQueue,
    "vesselBoardingWharfResolution",
    "trafficQualifiedCorridorDriveEstimates",
    "historicSiteMuseumEntitySeparation",
    "portNolaCruiseTerminalAssignment",
  ],
} as const;

// ============================================================================
// 1. NEW ORLEANS PLACE TAXONOMY & CORRIDOR GOVERNANCE
// ============================================================================

export const NEW_ORLEANS_PLACE_TYPES = [
  "urban_neighborhood",
  "riverfront_wharf_or_dock",
  "bayou_or_wetland_corridor",
  "river_road_heritage_corridor",
  "historic_site_or_museum",
  "cruise_turnaround_terminal",
  "airport_transfer_corridor",
] as const;

export type NewOrleansPlaceType = (typeof NEW_ORLEANS_PLACE_TYPES)[number];

export type NewOrleansPlaceRelationshipKind =
  | "adjacent_neighborhood_or_riverfront"
  | "wetland_basin_corridor_from_city"
  | "historic_site_within_river_road_corridor"
  | "separate_wetland_basin_do_not_conflate"
  | "separate_cruise_terminal_do_not_conflate"
  | "turnaround_transfer_link";

export interface TrafficQualifiedDriveEstimate {
  originLabel: string;
  distanceMilesMin: number;
  distanceMilesMax: number;
  typicalMinutesMin: number;
  typicalMinutesMax: number;
  peakTrafficMinutesMax: number;
  primaryRouteSummary: string;
  trafficQualificationNote: string;
  rideshareReturnAvailability:
    | "reliable"
    | "limited_outbound_unreliable_return"
    | "none_rely_on_shuttle_or_car";
  isGuarantee: false;
  sourceCitation: PrimarySourceCitation<CoreSourceKind>;
}

export interface HistoricSiteGovernanceContext {
  legalEntityName: string;
  taxOrHeritageDesignation: string;
  physicalStreetAddress: string;
  officialSiteWebsite: string;
  officialSitePhone: string;
  enslavementHistorySummary: string;
  publicFramingPolicy: "historical_and_enslavement_education";
  isTransportationTourOperator: false;
}

export interface PortNolaCruiseTerminalLogistics {
  terminalCode: "erato_street" | "julia_street";
  streetAddress: string;
  primaryCruiseLines: readonly string[];
  officialParkingFacility: string;
  parkingNotes: string;
  dropOffRoutingNotes: string;
  luggageStorageNotes: string;
}

export interface NewOrleansPlaceRecord
  extends DirectoryLocationCoreRecord<
    NewOrleansPlaceType,
    DirectoryMeetingPointRecord<CoreMeetingPointKind, CoreLocationPrecisionTier>,
    CoreSourceKind
  > {
  parishOrJurisdiction: string;
  relationships: readonly LocationRelationshipLink<
    NewOrleansPlaceType,
    NewOrleansPlaceRelationshipKind
  >[];
  driveEstimateFromFrenchQuarter: TrafficQualifiedDriveEstimate | null;
  historicSiteGovernance?: HistoricSiteGovernanceContext | null;
  cruiseTerminalLogistics?: PortNolaCruiseTerminalLogistics | null;
}

// ============================================================================
// 2. OPERATOR, VESSEL & DEPARTURE-LEVEL BOARDING RESOLUTION
// ============================================================================

export type NewOrleansOwnershipTag =
  | CoreOwnershipTag
  | "cajun_captain_owned"
  | "mississippi_river_vessel_operator"
  | "licensed_french_quarter_walking_company";

export interface NamedVesselDescriptor {
  vesselId: string;
  vesselName: string;
  vesselType: string;
  propulsionAndHullSummary: string;
  primaryWharfName: string;
  primaryWharfAddress: string;
  companionOrSubstituteWharfRule: string;
}

export interface ProductBoardingLocationResolution {
  resolutionScope: "product_and_departure_level";
  vesselId?: string | null;
  vesselName?: string | null;
  ticketOfficeAddress: string;
  primaryBoardingWharfOrDock: string;
  companionOrAlternateBoardingRule: string | null;
  checkInLeadMinutes: number;
  voucherConfirmationRule: string;
  sourceUrl: string;
  verifiedAt: string;
}

export interface NewOrleansOperatorRecord
  extends DirectoryOperatorCoreRecord<
    NewOrleansOwnershipTag,
    CoreSourceKind,
    DirectoryOperatorReviewRecord
  > {
  meetingRules: readonly OperatorMeetingRuleRecord[];
  operatedVessels?: readonly NamedVesselDescriptor[];
  fareharborShortname?: string | null;
  viatorSupplierNote?: string | null;
}

export interface NewOrleansProductRecord
  extends DirectoryProductCoreRecord<DirectoryProductReviewRecord> {
  wnoPublicTourPath: string | null;
  boardingLocationResolution: ProductBoardingLocationResolution;
  visitedHistoricSiteIds?: readonly string[];
  vesselTypeSummary: string;
  minimumAgeYears: number | null;
  airboatNoiseAndHealthAdvisory?: string | null;
  luggageCompatibleForTurnaround: boolean;
  fareharborDirectUrl?: string | null;
  fareharborAsn?: string | null;
}

export interface NewOrleansAreaCategoryComparison
  extends PlaceCategoryComparisonCore {
  areaName: string;
  categoryName: string;
}

// ============================================================================
// 3. NEW ORLEANS EXTENSION PUBLICATION GATES
// ============================================================================

export type NewOrleansPublicationHoldReasonCode =
  | CorePublicationGateHoldReasonCode
  | "PLACE_MISSING_TRAFFIC_QUALIFIED_DRIVE_ESTIMATE"
  | "PLACE_MISSING_HISTORICAL_ENSLAVEMENT_CONTEXT"
  | "PLACE_MISSING_CRUISE_TERMINAL_LOGISTICS";

export function evaluateNewOrleansPlacePublicationGate(
  place: NewOrleansPlaceRecord,
): EntityPublicationGateEvaluation<NewOrleansPublicationHoldReasonCode, "place"> {
  const additionalChecks: Array<{
    code: NewOrleansPublicationHoldReasonCode;
    detail: string;
  }> = [];

  const requiresCorridorDriveEstimate =
    place.placeType === "bayou_or_wetland_corridor" ||
    place.placeType === "river_road_heritage_corridor" ||
    place.placeType === "historic_site_or_museum" ||
    place.placeType === "airport_transfer_corridor";

  if (requiresCorridorDriveEstimate) {
    const est = place.driveEstimateFromFrenchQuarter;
    if (
      !est ||
      est.isGuarantee !== false ||
      est.typicalMinutesMin <= 0 ||
      est.typicalMinutesMax < est.typicalMinutesMin ||
      est.trafficQualificationNote.trim().length < 30
    ) {
      additionalChecks.push({
        code: "PLACE_MISSING_TRAFFIC_QUALIFIED_DRIVE_ESTIMATE",
        detail:
          "Out-of-quarter wetland, River Road, historic-site, and airport corridors require a source-backed, traffic-qualified planning drive-time range with isGuarantee=false.",
      });
    }
  }

  const requiresEnslavementContext =
    place.placeType === "river_road_heritage_corridor" ||
    place.placeType === "historic_site_or_museum";

  if (requiresEnslavementContext) {
    const gov = place.historicSiteGovernance;
    if (
      !gov ||
      gov.isTransportationTourOperator !== false ||
      gov.publicFramingPolicy !== "historical_and_enslavement_education" ||
      gov.enslavementHistorySummary.trim().length < 80
    ) {
      additionalChecks.push({
        code: "PLACE_MISSING_HISTORICAL_ENSLAVEMENT_CONTEXT",
        detail:
          "River Road heritage corridors and historic sites require explicit enslavement-history context and non-operator museum/site governance framing.",
      });
    }
  }

  if (place.placeType === "cruise_turnaround_terminal") {
    if (!place.cruiseTerminalLogistics) {
      additionalChecks.push({
        code: "PLACE_MISSING_CRUISE_TERMINAL_LOGISTICS",
        detail:
          "Port NOLA cruise terminals require verified terminal-specific address, parking garage, and drop-off routing details.",
      });
    }
  }

  return evaluateCoreLocationPublicationGate<NewOrleansPublicationHoldReasonCode>({
    placeId: place.placeId,
    publicPath: place.publicPlaceSlug ? `/areas/${place.publicPlaceSlug}` : null,
    hasPublicDirectoryPage: place.hasPublicDirectoryPage,
    placeType: place.placeType,
    overview: place.overview,
    accessAndLogisticsSummary: `${place.accessAndTransitSummary} ${place.pickupAndArrivalNotes}`,
    accessPointCount: place.meetingAndAccessPoints.length,
    officialLocalSourceCount: place.officialLocalSources.length,
    verifiedAt: place.verifiedAt,
    explicitHoldReasons: place.explicitHoldReasons,
    additionalChecks,
    extraMetrics: {
      parishOrJurisdiction: place.parishOrJurisdiction,
      hasTrafficQualifiedDriveEstimate: Boolean(place.driveEstimateFromFrenchQuarter),
      isHistoricSiteOrMuseum: place.placeType === "historic_site_or_museum",
    },
  });
}

export function evaluateNewOrleansOperatorPublicationGate(
  operator: NewOrleansOperatorRecord,
  products: readonly NewOrleansProductRecord[],
): EntityPublicationGateEvaluation<NewOrleansPublicationHoldReasonCode, "operator"> {
  return evaluateCoreOperatorPublicationGate<NewOrleansPublicationHoldReasonCode>({
    operatorId: operator.operatorId,
    slug: operator.slug,
    name: operator.name,
    officialWebsite: operator.officialWebsite,
    officialPhone: operator.officialPhone,
    servedPlaceCount: operator.servedPlaceIds.length,
    publicPlaceSlugCount: operator.publicPlaceSlugs.length,
    meetingOrPickupRuleCount: operator.meetingRules.length,
    companyOverview: operator.companyOverview,
    logisticsSummary: operator.arrivalAndPickupSummary,
    sources: operator.sources,
    verifiedAt: operator.verifiedAt,
    explicitHoldReasons: operator.explicitHoldReasons,
    integrationApproval: operator.integrationApproval,
    products,
    publicPathPrefix: "/operators",
  });
}

export function evaluateNewOrleansAreaCategoryPublicationGate(params: {
  areaSlug: string;
  categorySlug: string;
  comparison: NewOrleansAreaCategoryComparison | null;
  qualifiedOperatorIds: readonly string[];
  qualifiedProducts: readonly NewOrleansProductRecord[];
}): EntityPublicationGateEvaluation<
  NewOrleansPublicationHoldReasonCode,
  "area_category"
> {
  return evaluateCorePlaceCategoryPublicationGate<
    NewOrleansPublicationHoldReasonCode,
    "area_category"
  >({
    placeSlug: params.areaSlug,
    categorySlug: params.categorySlug,
    entityTypeLabel: "area_category",
    entityIdPrefix: "area_category",
    publicPlacePathPrefix: "/areas",
    comparison: params.comparison
      ? {
          comparisonIntro: params.comparison.comparisonIntro,
          keyDifferencesBullets: params.comparison.keyDifferencesBullets,
          logisticsGuidance: params.comparison.arrivalAndTimingGuidance,
          manualSignatureAllowlist: params.comparison.manualSignatureAllowlist,
        }
      : null,
    qualifiedOperatorIds: params.qualifiedOperatorIds,
    qualifiedProducts: params.qualifiedProducts,
  });
}

// ============================================================================
// 4. PORT NOLA TURNAROUND & MSY FLIGHT TIMING-FIT CALCULATOR
// ============================================================================

export type NewOrleansTravelerWindowScenario =
  | "same_day_port_nola_embarkation"
  | "post_cruise_debarkation_before_msy_flight"
  | "hotel_stay_full_or_half_day";

export interface NewOrleansTimingFitResult {
  scenario: NewOrleansTravelerWindowScenario;
  status: "fits_with_buffer" | "tight_verify_schedule" | "not_recommended";
  totalRequiredMinutesWithBuffers: number;
  availableWindowMinutes: number;
  remainingMarginMinutes: number;
  requiredSafetyBufferMinutes: number;
  luggageAdvisory: string;
  explanation: string;
}

export function evaluateNewOrleansTurnaroundAndFlightFit(params: {
  scenario: NewOrleansTravelerWindowScenario;
  availableWindowMinutes: number;
  productDurationMinutes: number;
  outboundTransferMinutesMax?: number;
  hasUnstoredLuggage?: boolean;
  luggageCompatibleForTurnaround?: boolean;
}): NewOrleansTimingFitResult {
  const transferRoundTrip = Math.max(0, (params.outboundTransferMinutesMax ?? 15) * 2);
  const safetyBuffer =
    params.scenario === "same_day_port_nola_embarkation"
      ? 120 // 2-hour Port NOLA terminal check-in + security buffer before final boarding
      : params.scenario === "post_cruise_debarkation_before_msy_flight"
        ? 150 // 35-45m I-10 transfer to MSY + TSA security + bag drop buffer before flight departure
        : 45;

  const totalRequired =
    params.productDurationMinutes + transferRoundTrip + safetyBuffer;
  const remaining = params.availableWindowMinutes - totalRequired;

  const unstoredLuggageBlocked =
    Boolean(params.hasUnstoredLuggage) &&
    params.luggageCompatibleForTurnaround !== true;

  const luggageAdvisory = unstoredLuggageBlocked
    ? "Luggage warning: Swamp airboats, walking tours, and standard shuttle vans cannot store full-size cruise suitcases. Drop bags with Port NOLA porters, hotel bell desks, or Advance Check-In / luggage storage before departure."
    : params.hasUnstoredLuggage
      ? "Confirm motorcoach under-bay luggage storage on your exact departure voucher before arrival."
      : "Store cruise bags with hotel bell service or Port NOLA terminal porters before starting your tour.";

  if (unstoredLuggageBlocked || remaining < 0) {
    return {
      scenario: params.scenario,
      status: "not_recommended",
      totalRequiredMinutesWithBuffers: totalRequired,
      availableWindowMinutes: params.availableWindowMinutes,
      remainingMarginMinutes: remaining,
      requiredSafetyBufferMinutes: safetyBuffer,
      luggageAdvisory,
      explanation: unstoredLuggageBlocked
        ? "Not recommended with unstored cruise luggage: store bags first or choose a motorcoach city transfer product."
        : `Not recommended: requires ~${totalRequired} minutes including peak traffic and a ${safetyBuffer}-minute ${
            params.scenario === "same_day_port_nola_embarkation"
              ? "Port NOLA embarkation"
              : params.scenario === "post_cruise_debarkation_before_msy_flight"
                ? "MSY airport transfer + TSA"
                : "schedule"
          } buffer, exceeding your ${params.availableWindowMinutes}-minute window.`,
    };
  }

  if (remaining < 45) {
    return {
      scenario: params.scenario,
      status: "tight_verify_schedule",
      totalRequiredMinutesWithBuffers: totalRequired,
      availableWindowMinutes: params.availableWindowMinutes,
      remainingMarginMinutes: remaining,
      requiredSafetyBufferMinutes: safetyBuffer,
      luggageAdvisory,
      explanation: `Tight fit (${remaining} minutes spare above the ${safetyBuffer}-minute safety buffer). I-10, US-90B, or Hale Boggs Bridge delays can compress return times; confirm earliest departure slot.`,
    };
  }

  return {
    scenario: params.scenario,
    status: "fits_with_buffer",
    totalRequiredMinutesWithBuffers: totalRequired,
    availableWindowMinutes: params.availableWindowMinutes,
    remainingMarginMinutes: remaining,
    requiredSafetyBufferMinutes: safetyBuffer,
    luggageAdvisory,
    explanation: `Fits comfortably with ~${remaining} minutes of extra margin beyond peak corridor drive estimates and the ${safetyBuffer}-minute ${
      params.scenario === "same_day_port_nola_embarkation"
        ? "Port NOLA terminal boarding"
        : params.scenario === "post_cruise_debarkation_before_msy_flight"
          ? "MSY airport"
          : "local"
    } buffer.`,
  };
}
