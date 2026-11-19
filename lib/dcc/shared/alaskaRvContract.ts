/**
 * Alaska RV Travel Canonical Data & Shared-Planner Integration Contract
 * (`lib/dcc/shared/alaskaRvContract.ts`).
 *
 * Composes on `regionalDirectoryCoreContract.ts` (`PrimarySourceCitation`,
 * `RecordProvenanceFields`, `BookingProviderPlatform`, `UNCLAIMED_OPERATOR_PROFILE_NOTICE`)
 * and `alaskaDirectoryExtensionContract.ts` (`AlaskaSourceKind`) without stretching
 * LFSE's Southeast-only directory into an implied statewide directory and without
 * creating synthetic cruise ships or sailing records.
 *
 * Strictly separates six RV-critical fact pairs:
 *   1. Vehicle owner / rental operator vs. actual vehicle specifications
 *   2. Rental contract road permission vs. physical road open/closed status (511.alaska.gov)
 *   3. Campground operation vs. an available, reservable site
 *   4. Campground-wide amenities vs. the selected site's hookups and length limit
 *   5. Estimated highway driving time vs. a realistic RV travel day with stops
 *   6. Suggested overnight location vs. a confirmed reservation
 *
 * Unknown facts remain `null` / `'unknown'` / `'not_checked'` — never guessed.
 * For ferry legs, a walk-on passenger ticket never establishes reserved vehicle deck space.
 */

import type {
  BookingProviderPlatform,
  PrimarySourceCitation,
  RecordProvenanceFields,
} from "./regionalDirectoryCoreContract";
import type { AlaskaSourceKind } from "./alaskaDirectoryExtensionContract";

export const ALASKA_RV_CONTRACT_VERSION = "dcc.alaska-rv.v1" as const;
export const ALASKA_RV_PLANNER_INTEGRATION_CONTRACT_VERSION =
  "dcc.cp.independent-rv-planner.v1" as const;

export type AlaskaRvSourceCitation = PrimarySourceCitation<AlaskaSourceKind>;

// ============================================================================
// 1. ENTRY MODES & CONFIRMATION LIFECYCLE STATES
// ============================================================================

export type AlaskaRvEntryMode =
  | "fly_and_rent_anc"
  | "drive_from_outside_ak"
  | "ferry_plus_rv";

export interface AlaskaRvEntryModeDescriptor {
  mode: AlaskaRvEntryMode;
  title: string;
  pilotSupportLevel: "full_interactive_pilot" | "documented_entry_mode_routing_deferred";
  summary: string;
  whoItFits: string;
  keyOperationalRealities: readonly string[];
  deferredScopeBoundary: string | null;
  sources: readonly AlaskaRvSourceCitation[];
}

export type RvConfirmationLifecycleState =
  | "tentative"
  | "traveler_booked"
  | "changed"
  | "cancelled";

export type RvScheduleFreshnessState =
  | "published_2027_window"
  | "seasonal_pattern_2027_unverified"
  | "current_posted_guidance_2027_unverified"
  | "outside_published_coverage";

export type RvInventoryCheckState = "not_checked" | "available" | "unavailable" | "error";

// ============================================================================
// 2. CANONICAL PLACES (SOUTHCENTRAL / KENAI PENINSULA + GATEWAYS)
// ============================================================================

export interface AlaskaRvPlaceRecord extends RecordProvenanceFields<AlaskaSourceKind> {
  placeId: string; // e.g. "dcc:place:us-ak-anchorage-ak:0001" or "dcc:port:us-seward:0001"
  slug: string;
  name: string;
  regionLabel: "Anchorage Bowl" | "Turnagain Arm & Portage" | "Eastern Kenai Peninsula" | "Central Kenai Peninsula" | "Southern Kenai & Kachemak Bay" | "Prince William Sound Gateway";
  roleInPilot: "arrival_rental_gateway" | "candidate_base" | "corridor_checkpoint" | "ferry_gateway";
  cpPortDirectoryPath: string | null; // e.g. "/ports/anchorage", "/ports/seward", "/ports/homer"
  coordinates: {
    latitude: number;
    longitude: number;
  };
  rvBasecampSummary: string;
  rvParkingAndTownNavigationNote: string;
  recommendedBaseNightsRange: string | null;
}

// ============================================================================
// 3. RENTAL OPERATOR VS. ACTUAL VEHICLE SPECIFICATIONS (SEPARATION #1)
// ============================================================================

export type RvVehicleOwnershipMode = "rental" | "traveler_owned";

export type RvVehicleClass =
  | "class_c_motorhome"
  | "class_b_campervan"
  | "class_a_motorhome"
  | "truck_camper_4x4"
  | "travel_trailer"
  | "fifth_wheel"
  | "unknown";

export type RvTowingConfiguration =
  | "none"
  | "towing_toad_vehicle"
  | "towing_utility_or_boat"
  | "tow_vehicle_plus_trailer"
  | "unknown";

export interface AlaskaRvRentalOperatorRecord extends RecordProvenanceFields<AlaskaSourceKind> {
  operatorId: `operator:${string}`;
  slug: string;
  name: string;
  depotPlaceId: string;
  depotAddressLabel: string;
  officialWebsite: string | null;
  bookingPlatform: BookingProviderPlatform;
  publicationStatus: "published_pilot" | "held_source_unreachable";
  fleetClassesOffered: readonly RvVehicleClass[];
  typicalLengthRangeFeet: { min: number; max: number } | null;
  floorplanGuaranteePolicy: string; // Or "unknown"
  airportShuttlePolicy: string;
  pickupWindowPolicy: string;
  mandatoryOrientationNote: string;
  returnCutoffPolicy: string;
  returnCleaningAndDumpPolicy: string;
  gravelRoadPolicy: "prohibited_paved_only" | "selective_restricted_caution" | "gravel_permitted_subject_to_contract" | "unknown";
  prohibitedRoadCorridorNames: readonly string[];
  cautionRestrictedRoadCorridorNames: readonly string[];
  canadaCrossBorderPolicy: string;
  unresolvedPolicies: readonly string[];
}

/**
 * Actual specs of the specific rig on the trip — kept strictly separate from the
 * rental company profile so unknown dimensions remain `null` until selected or
 * extracted from a booking confirmation.
 */
export interface RvActualVehicleSpec {
  ownershipMode: RvVehicleOwnershipMode;
  rentalOperatorId: string | null;
  rentalOperatorDisplayName: string | null;
  vehicleClass: RvVehicleClass;
  modelOrFloorplanLabel: string | null;
  lengthFeet: number | null;
  heightFeet: number | null;
  widthFeet: number | null;
  towingConfiguration: RvTowingConfiguration;
  combinedBumperToBumperLengthFeet: number | null;
  electricalAmpService: 15 | 20 | 30 | 50 | null;
  hardSidedBearCompliant: boolean | null;
  onboardGeneratorIncluded: boolean | "unknown";
  pickupAppointment: {
    date: string | null;
    windowLabel: string | null;
    locationLabel: string | null;
    confirmationState: RvConfirmationLifecycleState;
  } | null;
  returnAppointment: {
    date: string | null;
    cutoffLabel: string | null;
    locationLabel: string | null;
    confirmationState: RvConfirmationLifecycleState;
  } | null;
  applicableRentalRestrictionsNote: string | null;
}

// ============================================================================
// 4. CORRIDORS: RENTAL PERMISSION VS. PHYSICAL ROAD STATUS (#2) &
//    PURE DRIVE TIME VS. REALISTIC RV TRAVEL DAY (#5)
// ============================================================================

export type RentalCorridorPermissionClass =
  | "permitted_paved_standard"
  | "caution_speed_or_surface_restricted"
  | "prohibited_by_standard_rental_contracts"
  | "gravel_specialist_or_owned_rig_only";

export interface AlaskaRvHighwayCorridorRecord extends RecordProvenanceFields<AlaskaSourceKind> {
  corridorId: `corridor:${string}`;
  name: string;
  routeDesignations: readonly string[]; // e.g. ["AK-1", "AK-9"]
  originPlaceId: string;
  destinationPlaceId: string;
  distanceMiles: number;
  surfaceType: "paved_two_lane_mountain_coastal" | "paved_divided_and_two_lane" | "gravel_unpaved";
  /** Pure non-stop passenger/highway estimate — NEVER presented as the full RV travel day. */
  estimatedPureDrivingHoursRange: string;
  /** Realistic RV day accounting for slow grades, pullouts, fuel/dump/grocery stops, and construction pilot cars. */
  realisticRvTravelDayHoursRange: string;
  rvTravelDayStopFactors: readonly string[];
  fuelAndServiceGapWarning: string;
  /** Contractual permission under mainstream RV rentals — separate from physical road opening! */
  standardRentalPermission: RentalCorridorPermissionClass;
  rentalPermissionExplanation: string;
  /** Physical open/construction/avalanche status is NEVER assumed static; checked live via Alaska 511. */
  physicalRoadOpenState: "not_checked_verify_511_live";
  officialPhysicalRoadStatusUrl: "https://511.alaska.gov/";
  physicalHazardsAndSeasonalNotes: string;
}

// ============================================================================
// 5. CAMPGROUNDS: OPERATION VS. AVAILABLE SITE (#3) &
//    PARK-WIDE AMENITIES VS. SELECTED SITE HOOKUPS/LENGTH (#4)
// ============================================================================

export interface AlaskaRvCampgroundSiteTierRecord {
  siteTierId: string;
  label: string; // e.g. "Waterfront 30A Electric + Water", "Dry Beach RV Row", "Full Hookup Pull-Through"
  padStyle: "pull_through" | "back_in" | "mixed_pads" | "open_gravel_lot";
  electricAmpOptions: readonly (20 | 30 | 50)[]; // empty array = dry / no electric at site
  waterAtSite: boolean;
  sewerAtSite: boolean;
  maxMotorhomeLengthFeet: number | null; // null = unknown / varies per individual pad on booking map
  maxTrailerLengthFeet: number | null;
  reservableOnline: boolean;
  siteSpecificRulesNote: string;
}

export interface AlaskaRvCampgroundRecord extends RecordProvenanceFields<AlaskaSourceKind> {
  campgroundId: `campground:${string}`;
  slug: string;
  name: string;
  placeId: string;
  operatorType: "municipal" | "federal_usfs_or_nps" | "private_rv_park";
  SeparateFromCampgroundIds?: readonly string[];
  addressOrMilepostLabel: string;
  officialBookingOrInfoUrl: string;
  /** Campground operation status — NEVER implies an open/available site for the traveler's dates! */
  campgroundOperatingSeasonLabel: string;
  reservationModel:
    | "advance_online_required"
    | "advance_online_recommended"
    | "mixed_online_and_fcfs_loops"
    | "first_come_first_served_only";
  reservationOpeningWindowNote: string;
  liveSiteInventoryState: RvInventoryCheckState; // Always 'not_checked' in static catalog
  /** Campground-wide facilities — kept strictly separate from what an individual site provides! */
  campgroundWideAmenities: {
    hasCentralDumpStation: boolean | "unknown";
    centralDumpFeeNote: string;
    hasPotableWaterFill: boolean | "unknown";
    hasRestrooms: boolean;
    hasHotShowers: boolean | "coin_or_fee" | "unknown";
    hasLaundry: boolean | "unknown";
    hasWifi: boolean | "unknown";
    parkWideMaxRigLengthFeet: number | null;
    bearFoodStorageRule: string | null;
  };
  /** Distinct site tiers proving hookups and length limits vary by selected site. */
  siteTiers: readonly AlaskaRvCampgroundSiteTierRecord[];
  rateGuidanceLabel: string;
  rateFreshnessState: RvScheduleFreshnessState;
  rvAccessAndTowingNote: string;
  unresolvedCampgroundFacts: readonly string[];
}

// ============================================================================
// 6. PRACTICAL SERVICE STOPS (FUEL, WATER, DUMP, PROPANE, GROCERIES)
// ============================================================================

export type RvServiceStopCapability =
  | "fuel_gas_diesel"
  | "propane_fill"
  | "potable_water"
  | "sanitation_dump"
  | "grocery_provisioning";

export interface AlaskaRvPracticalServiceStopRecord extends RecordProvenanceFields<AlaskaSourceKind> {
  serviceStopId: `service:${string}`;
  name: string;
  placeId: string;
  highwayLocationLabel: string;
  capabilities: readonly RvServiceStopCapability[];
  officialOrAuthorityUrl: string | null;
  bigRigManeuveringNote: string;
  seasonalOperationAndHoseWarning: string;
  feeGuidanceNote: string;
  unresolvedServiceFacts: readonly string[];
}

// ============================================================================
// 7. ACTIVITIES & EXPERIENCES (WITH RV PARKING / SHUTTLE LOGISTICS)
// ============================================================================

export interface AlaskaRvActivityExperienceRecord extends RecordProvenanceFields<AlaskaSourceKind> {
  activityId: `activity:${string}`;
  slug: string;
  title: string;
  operatorName: string;
  placeId: string;
  category:
    | "marine_wildlife_glacier_cruise"
    | "national_park_glacier_walk"
    | "wildlife_conservation_drive"
    | "water_taxi_state_park"
    | "marine_science_center";
  officialUrl: string;
  typicalDurationMinutes: number;
  checkInLeadMinutes: number | null;
  rvParkingAndShuttlePolicy: {
    oversizedParkingAtVenue: "ample_pull_through" | "tight_day_use_arrive_early" | "limited_use_shuttle_or_walk" | "coordinate_harbor_lot";
    overnightRvParkingPermitted: false;
    shuttleAvailableFromCampgrounds: boolean;
    shuttleAdvanceReservationRule: string | null;
    practicalRvInstruction: string;
  };
  priceGuidanceLabel: string;
  scheduleFreshnessState: RvScheduleFreshnessState;
  liveInventoryState: RvInventoryCheckState;
  unresolvedActivityFacts: readonly string[];
}

// ============================================================================
// 8. FERRY VEHICLE CARRIAGE CONTRACT (PASSENGER TICKET != VEHICLE SPACE)
// ============================================================================

export interface AlaskaRvFerryCorridorRuleRecord extends RecordProvenanceFields<AlaskaSourceKind> {
  ferryRuleId: `ferry:${string}`;
  operatorName: string;
  officialBookingUrl: string;
  corridorLabel: string;
  departureTerminalLabel: string;
  arrivalTerminalLabel: string;
  vehicleCheckInCutoffMinutesPrior: number;
  maxStandardWidthInches: number; // 101" (8'5"); >=102" (8'6") incurs wide surcharge
  maxStandardHeightFeet: number;
  propaneShutoffAndTagRequired: true;
  carDeckLockedWhileUnderway: true;
  tidalRampOverhangWarning: string;
  publishedScheduleCoverageNote: string;
  scheduleFreshnessState: RvScheduleFreshnessState;
  liveSailingSpaceState: RvInventoryCheckState;
}

export interface RvFerryBookingVerificationInput {
  passengerTicketConfirmed: boolean;
  vehicleDeckSpaceConfirmed: boolean;
  actualRigCombinedLengthFeet: number | null;
  actualRigHeightFeet: number | null;
  actualRigWidthFeet: number | null;
  bookedVehicleLengthFeet: number | null;
  bookedVehicleHeightFeet: number | null;
  bookedVehicleWidthFeet: number | null;
  departureTerminalLabel: string | null;
  arrivalTerminalLabel: string | null;
  checkInCutoffMinutesPrior: number | null;
}

export interface RvFerryBookingVerificationResult {
  status: "verified_vehicle_ready" | "blocked_passenger_only_no_vehicle_space" | "dimension_mismatch_risk" | "needs_confirmation";
  headline: string;
  warnings: string[];
}

export function evaluateRvFerryBookingReadiness(
  input: RvFerryBookingVerificationInput,
): RvFerryBookingVerificationResult {
  const warnings: string[] = [];

  if (input.passengerTicketConfirmed && !input.vehicleDeckSpaceConfirmed) {
    return {
      status: "blocked_passenger_only_no_vehicle_space",
      headline: "Passenger ticket only — RV vehicle deck space is NOT reserved",
      warnings: [
        "A walk-on passenger ticket on AMHS never reserves car-deck footage for an RV or towed vehicle.",
        "Confirm an explicit AMHS vehicle reservation matching bumper-to-bumper length, height, and width before counting this ferry leg.",
      ],
    };
  }

  if (!input.vehicleDeckSpaceConfirmed) {
    warnings.push("Vehicle deck space is not yet confirmed on an actual sailing.");
  }

  if (!input.departureTerminalLabel || !input.arrivalTerminalLabel) {
    warnings.push("Verify exact departure and arrival ferry terminals (e.g., Whittier vs. Homer vs. Bellingham).");
  }

  if (!input.checkInCutoffMinutesPrior) {
    warnings.push("Verify terminal vehicle staging/check-in cutoff (typically 120–180 minutes prior to departure).");
  }

  if (
    input.actualRigCombinedLengthFeet === null ||
    input.bookedVehicleLengthFeet === null
  ) {
    warnings.push("Exact bumper-to-bumper RV length (including bike racks, spare tires, or towed vehicle) is unknown.");
  } else if (input.actualRigCombinedLengthFeet > input.bookedVehicleLengthFeet) {
    return {
      status: "dimension_mismatch_risk",
      headline: `Actual rig (${input.actualRigCombinedLengthFeet} ft) exceeds booked ferry space (${input.bookedVehicleLengthFeet} ft)`,
      warnings: [
        `Booked vehicle length (${input.bookedVehicleLengthFeet} ft) is shorter than total rig length (${input.actualRigCombinedLengthFeet} ft). Terminal agents measure bumper-to-bumper including racks and tow hitches.`,
      ],
    };
  }

  if (input.actualRigWidthFeet !== null && input.actualRigWidthFeet >= 8.5) {
    warnings.push(
      `Vehicle width (${input.actualRigWidthFeet} ft) meets/exceeds 8 ft 6 in — verify wide-vehicle tariff class on AMHS.`,
    );
  }

  if (
    input.vehicleDeckSpaceConfirmed &&
    input.actualRigCombinedLengthFeet !== null &&
    input.bookedVehicleLengthFeet !== null &&
    Boolean(input.departureTerminalLabel) &&
    Boolean(input.arrivalTerminalLabel) &&
    Boolean(input.checkInCutoffMinutesPrior)
  ) {
    return {
      status: "verified_vehicle_ready",
      headline: `Reserved RV deck space (${input.bookedVehicleLengthFeet} ft) · Check in ${input.checkInCutoffMinutesPrior}m prior`,
      warnings,
    };
  }

  return {
    status: "needs_confirmation",
    headline: "Ferry vehicle reservation details need confirmation",
    warnings,
  };
}

// ============================================================================
// 9. SITE & CORRIDOR COMPATIBILITY HELPERS (UNKNOWN STAYS UNKNOWN)
// ============================================================================

export interface RvSiteCompatibilityAssessment {
  state: "compatible" | "incompatible" | "needs_confirmation";
  summaryLabel: string;
  reasons: string[];
}

export function evaluateRvSiteCompatibility(input: {
  vehicle: Pick<
    RvActualVehicleSpec,
    | "lengthFeet"
    | "combinedBumperToBumperLengthFeet"
    | "towingConfiguration"
    | "electricalAmpService"
    | "hardSidedBearCompliant"
  >;
  campground: Pick<AlaskaRvCampgroundRecord, "name" | "campgroundWideAmenities">;
  siteTier: AlaskaRvCampgroundSiteTierRecord;
}): RvSiteCompatibilityAssessment {
  const reasons: string[] = [];
  const effectiveLength =
    input.vehicle.combinedBumperToBumperLengthFeet ?? input.vehicle.lengthFeet;

  const isTrailer =
    input.vehicle.towingConfiguration === "tow_vehicle_plus_trailer";
  const siteMaxLen = isTrailer
    ? input.siteTier.maxTrailerLengthFeet ?? input.siteTier.maxMotorhomeLengthFeet
    : input.siteTier.maxMotorhomeLengthFeet;

  if (
    input.campground.campgroundWideAmenities.bearFoodStorageRule &&
    input.vehicle.hardSidedBearCompliant === false
  ) {
    return {
      state: "incompatible",
      summaryLabel: "Incompatible with hard-sided bear food-storage requirement",
      reasons: [input.campground.campgroundWideAmenities.bearFoodStorageRule],
    };
  }

  if (effectiveLength === null) {
    reasons.push(
      "Vehicle overall length is still unknown — confirm exact bumper-to-bumper length before reserving this site.",
    );
  } else if (siteMaxLen === null) {
    reasons.push(
      "Individual pad lengths vary within this loop — verify the exact site pad length on the reservation map.",
    );
  } else if (effectiveLength > siteMaxLen) {
    return {
      state: "incompatible",
      summaryLabel: `Rig length (${effectiveLength} ft) exceeds ${input.siteTier.label} limit (${siteMaxLen} ft)`,
      reasons: [
        `${input.siteTier.label} at ${input.campground.name} caps length at ${siteMaxLen} ft, while your configured rig is ${effectiveLength} ft.`,
      ],
    };
  }

  if (
    input.vehicle.towingConfiguration === "towing_toad_vehicle" &&
    input.siteTier.padStyle === "back_in"
  ) {
    reasons.push(
      "Back-in pad with a towed vehicle — plan to unhook toad vehicle or confirm side-street/extra-vehicle parking rules.",
    );
  }

  if (!input.siteTier.sewerAtSite) {
    reasons.push(
      "No sewer hookup at individual site — schedule a central or municipal dump station stop.",
    );
  }

  if (effectiveLength === null || siteMaxLen === null) {
    return {
      state: "needs_confirmation",
      summaryLabel: "Length fit needs confirmation",
      reasons,
    };
  }

  return {
    state: "compatible",
    summaryLabel: `Fits stated ${siteMaxLen} ft site limit (${input.siteTier.sewerAtSite ? "Full hookups" : input.siteTier.electricAmpOptions.length > 0 ? `${input.siteTier.electricAmpOptions.join("/")}A + ${input.siteTier.waterAtSite ? "water" : "electric only"}` : "Dry site"})`,
    reasons,
  };
}

export interface RvCorridorComplianceAssessment {
  rentalPermissionState: "permitted" | "caution_restricted" | "prohibited" | "owned_vehicle_not_applicable" | "needs_operator_confirmation";
  physicalRoadStatusState: "not_checked_verify_511_live";
  summaryLabel: string;
  notes: string[];
}

export function evaluateRvCorridorCompliance(input: {
  vehicle: Pick<RvActualVehicleSpec, "ownershipMode" | "rentalOperatorId">;
  operator: Pick<AlaskaRvRentalOperatorRecord, "name" | "gravelRoadPolicy" | "prohibitedRoadCorridorNames"> | null;
  corridor: Pick<
    AlaskaRvHighwayCorridorRecord,
    | "name"
    | "surfaceType"
    | "standardRentalPermission"
    | "rentalPermissionExplanation"
    | "officialPhysicalRoadStatusUrl"
  >;
}): RvCorridorComplianceAssessment {
  const notes: string[] = [
    `Physical road opening, construction pilot cars, and closures remain live state — check ${input.corridor.officialPhysicalRoadStatusUrl} before departure.`,
  ];

  if (input.vehicle.ownershipMode === "traveler_owned") {
    return {
      rentalPermissionState: "owned_vehicle_not_applicable",
      physicalRoadStatusState: "not_checked_verify_511_live",
      summaryLabel: "Traveler-owned RV (no rental road ban · verify physical 511 status)",
      notes,
    };
  }

  if (!input.operator) {
    notes.push("Rental operator not yet selected — verify unpaved/restricted road addendum before signing.");
    return {
      rentalPermissionState:
        input.corridor.standardRentalPermission === "permitted_paved_standard"
          ? "permitted"
          : "needs_operator_confirmation",
      physicalRoadStatusState: "not_checked_verify_511_live",
      summaryLabel:
        input.corridor.standardRentalPermission === "permitted_paved_standard"
          ? "Paved state highway (permitted by standard rentals · verify 511 live)"
          : "Confirm rental operator road addendum before driving",
      notes,
    };
  }

  if (input.corridor.standardRentalPermission === "prohibited_by_standard_rental_contracts") {
    if (input.operator.gravelRoadPolicy === "gravel_permitted_subject_to_contract") {
      notes.push(
        `${input.operator.name} permits gravel highways on eligible rigs subject to contract terms — confirm exact route at Anchorage desk.`,
      );
      return {
        rentalPermissionState: "caution_restricted",
        physicalRoadStatusState: "not_checked_verify_511_live",
        summaryLabel: `Verify gravel rider with ${input.operator.name} · Check 511 live`,
        notes,
      };
    }
    notes.push(input.corridor.rentalPermissionExplanation);
    return {
      rentalPermissionState: "prohibited",
      physicalRoadStatusState: "not_checked_verify_511_live",
      summaryLabel: `Prohibited under ${input.operator.name} standard road rules (even when physically open on 511)`,
      notes,
    };
  }

  if (input.corridor.standardRentalPermission === "caution_speed_or_surface_restricted") {
    notes.push(input.corridor.rentalPermissionExplanation);
    return {
      rentalPermissionState: "caution_restricted",
      physicalRoadStatusState: "not_checked_verify_511_live",
      summaryLabel: `Restricted speed/tire rules under ${input.operator.name} · Check 511 live`,
      notes,
    };
  }

  return {
    rentalPermissionState: "permitted",
    physicalRoadStatusState: "not_checked_verify_511_live",
    summaryLabel: `Permitted paved highway (${input.operator.name}) · Check 511 live`,
    notes,
  };
}

// ============================================================================
// 10. EXAMPLE TRIP TEMPLATE & DCC <-> CP SHARED PLANNER INTEGRATION CONTRACT
// ============================================================================

export interface AlaskaRvPilotDayTemplate {
  dayNumber: number;
  dayRole: "arrival_pickup" | "drive_leg" | "basecamp_stay" | "return_departure";
  title: string;
  basePlaceId: string;
  suggestedOvernightPlaceLabel: string; // Always starts tentative_suggested, NEVER confirmed!
  defaultConfirmationState: "tentative";
  corridorId: `corridor:${string}` | null;
  candidateCampgroundIds: readonly `campground:${string}`[];
  defaultCampgroundId: `campground:${string}` | null;
  defaultSiteTierId: string | null;
  recommendedServiceStopIds: readonly `service:${string}`[];
  candidateActivityIds: readonly `activity:${string}`[];
  realisticDayNarrative: string;
  operationalChecklist: readonly string[];
}

export interface AlaskaRvExistingToolComparison {
  toolName: string;
  officialUrl: string;
  category: "official_alaska_authority" | "rv_routing_and_campground_app" | "highway_milepost_reference";
  whatItDoesWell: string;
  whatRemainsForTravelerToStitch: string;
}

export interface DccCpIndependentRvPlannerIntegrationSpec {
  contractVersion: typeof ALASKA_RV_PLANNER_INTEGRATION_CONTRACT_VERSION;
  canonicalCatalogOwner: "dcc";
  privatePlannerOwner: "cruisepromenade";
  publicDiscoveryHome: "cruisepromenade";
  publicDiscoveryCanonicalPreviewPath: "/guides/alaska-rv-trip-planner";
  publicItineraryWorkspacePreviewPath: "/guides/alaska-rv-trip-planner/itinerary";
  requiresCruiseShipOrSailingRecord: false;
  createsSyntheticPhysicalSailingId: false;
  defaultRollCallSyncEnabled: false;
  supportedConfirmationCategories: readonly [
    "rv_rental",
    "campground_reservation",
    "ferry_reservation",
    "activity",
    "flight",
    "accommodation",
  ];
  supportedItemConfirmationStates: readonly [
    "tentative",
    "traveler_booked",
    "changed",
    "cancelled",
  ];
  privacyInvariants: readonly string[];
  uncruiseAndIndependentWorkstreamAlignment: readonly string[];
}
