import { rfc8785Canonicalize, sha256HexFull } from "../machine/v03/rfc8785AndJws";

export const APPLICABILITY_MODEL_VERSION = "dcc-applicability-context-model/1.0.0" as const;
export const APPLICABILITY_COMPILER_VERSION = "dcc-applicability-compiler/1.0.0" as const;

export type CorridorId =
  | "corridor:denver-vail-i70"
  | "corridor:denver-breckenridge-i70"
  | "corridor:denver-red-rocks"
  | "corridor:juneau-port-icefield"
  | "corridor:new-orleans-barataria-swamp";

export type DrivetrainCapability =
  | "2wd"
  | "awd_4wd"
  | "awd_commercial_chains"
  | "commercial_coach_chains"
  | "rotorcraft_part135"
  | "marine_planing_airboat"
  | "marine_displacement_pontoon";

export interface GeographicSegmentSpec {
  segmentId: string;
  corridorId: CorridorId;
  sequenceOrder: number;
  name: string;
  jurisdiction: string;
  highwayOrWaterway: string;
  milepostRange: string | null;
  maxElevationFeet: number;
  maxGradePercent: number;
  applicableRegulationIds: readonly string[];
  supportedVehicleClassIds: readonly string[];
  evidenceVersion: string;
  verifiedCitationIds: readonly string[];
}

export interface VehicleClassCapacitySpec {
  vehicleClassId: string;
  corridorIds: readonly CorridorId[];
  displayName: string;
  operatorId: string;
  operatorName: string;
  providerType: "direct_operator" | "shared_shuttle" | "self_drive_rental" | "public_transit";
  drivetrain: DrivetrainCapability;
  commercialChainEquipped: boolean;
  maxPassengersStandard: number;
  maxPassengersWithFullLengthSkiBagsInside: number;
  maxStandardBagsWithFullPassengerLoad: number;
  maxStandardBagsWithFoldedThirdRow: number;
  maxSkiOrOversizeBagsInsideWithFullPassengerLoad: number;
  maxSkiOrOversizeBagsWithRoofBoxAndFoldedRow: number;
  includedBagsPerPassenger?: number;
  extraBagFeeUsd?: number | null;
  minPassengerAgeYears: number;
  singlePassengerWeightThresholdLbs?: number | null;
  prohibitsCarryOnBags?: boolean;
  requiresManualTransitTransfer?: boolean;
  pricingModel: "fixed_vehicle_rate" | "quote_only" | "per_seat_variable" | "public_fare" | "multi_vehicle_rental";
  fixedRateOneWayUsd: number | null;
  quoteOnly: boolean;
  evidenceVersion: string;
}

export interface SeasonalRegulationSpec {
  regulationId: string;
  corridorIds: readonly CorridorId[];
  segmentIds: readonly string[];
  code: string;
  statuteOrAuthority: string;
  title: string;
  activeMonthsUtc: readonly number[];
  canBeTriggeredByLiveCondition: boolean;
  liveConditionTriggerKey:
    | "vailPassChainLawActive"
    | "i70TractionLawActive"
    | "pajnLowCeilingIframeWarning"
    | null;
  requiresAwdOrWinterTires: boolean;
  requiresPhysicalChainsOrAltTractionOnAllVehicles: boolean;
  requiresCommercialChainsOnVansAndCoaches: boolean;
  disqualifiesVehicleClassIdsWhenActive: readonly string[];
  compiledConstraintCode: string;
  deterministicDirective: string;
  evidenceVersion: string;
  verifiedCitationId: string;
}

export interface VersionedApplicabilityContextModel {
  modelVersion: typeof APPLICABILITY_MODEL_VERSION;
  compilerVersion: typeof APPLICABILITY_COMPILER_VERSION;
  evidenceVersion: string;
  knowledgeCutoff: string;
  segments: readonly GeographicSegmentSpec[];
  vehicleClasses: readonly VehicleClassCapacitySpec[];
  regulations: readonly SeasonalRegulationSpec[];
  modelHash: string;
}

export const GEOGRAPHIC_SEGMENTS: readonly GeographicSegmentSpec[] = [
  {
    segmentId: "seg:i70-den-eisenhower-tunnel",
    corridorId: "corridor:denver-vail-i70",
    sequenceOrder: 1,
    name: "DEN Airport to Eisenhower-Johnson Memorial Tunnel (I-70 West)",
    jurisdiction: "Colorado Department of Transportation (CDOT)",
    highwayOrWaterway: "I-70 Westbound / Eastbound",
    milepostRange: "MP 259.0 (Morrison) to MP 213.7 (Eisenhower Tunnel)",
    maxElevationFeet: 11158,
    maxGradePercent: 6.5,
    applicableRegulationIds: [
      "reg:co-passenger-traction-law-code-15",
      "reg:co-commercial-chain-law-code-18",
    ],
    supportedVehicleClassIds: [
      "veh:private-transit-van-10-14",
      "veh:awd-full-size-suv",
      "veh:shared-mountain-shuttle",
      "veh:cdot-bustang-coach",
      "veh:sedan-2wd",
    ],
    evidenceVersion: "dcc-evidence-co-i70/2026.11",
    verifiedCitationIds: ["cdot-traction-law", "gosno-rates", "eme-rates"],
  },
  {
    segmentId: "seg:i70-vail-pass",
    corridorId: "corridor:denver-vail-i70",
    sequenceOrder: 2,
    name: "Vail Pass Summit Corridor (Tenmile Canyon to East Vail)",
    jurisdiction: "Colorado Department of Transportation (CDOT) & CSP",
    highwayOrWaterway: "I-70 Westbound / Eastbound",
    milepostRange: "MP 195.0 (Copper Mountain) to MP 180.0 (East Vail)",
    maxElevationFeet: 10662,
    maxGradePercent: 7.0,
    applicableRegulationIds: [
      "reg:co-passenger-traction-law-code-15",
      "reg:co-passenger-chain-law-code-16",
      "reg:co-commercial-chain-law-code-18",
    ],
    supportedVehicleClassIds: [
      "veh:private-transit-van-10-14",
      "veh:awd-full-size-suv",
      "veh:shared-mountain-shuttle",
      "veh:cdot-bustang-coach",
      "veh:sedan-2wd",
    ],
    evidenceVersion: "dcc-evidence-co-i70/2026.11",
    verifiedCitationIds: ["cdot-traction-law", "gosno-rates", "eme-baggage", "bustang-west"],
  },
  {
    segmentId: "seg:den-red-rocks-morrison",
    corridorId: "corridor:denver-red-rocks",
    sequenceOrder: 1,
    name: "Downtown Denver / Union Station to Red Rocks Amphitheatre (Morrison)",
    jurisdiction: "City and County of Denver Arts & Venues / Jefferson County",
    highwayOrWaterway: "US-6 / I-70 / CO-8 / Alameda Pkwy",
    milepostRange: "MP 259.0 to Red Rocks Entrances 1–4",
    maxElevationFeet: 6450,
    maxGradePercent: 6.0,
    applicableRegulationIds: [],
    supportedVehicleClassIds: [
      "veh:private-transit-van-10-14",
      "veh:awd-full-size-suv",
      "veh:sedan-2wd",
    ],
    evidenceVersion: "dcc-evidence-red-rocks/2026.11",
    verifiedCitationIds: ["rr-parking", "rr-rideshare"],
  },
  {
    segmentId: "seg:jnu-port-mendenhall-corridor",
    corridorId: "corridor:juneau-port-icefield",
    sequenceOrder: 1,
    name: "Juneau Cruise Berths (CT/FKL/AS/AJ) to PAJN Heliport & Mendenhall Icefield",
    jurisdiction: "FAA Alaskan Region / USFS Tongass National Forest / CBJ",
    highwayOrWaterway: "Egan Drive (AK-7) & Juneau Icefield VFR Airspace",
    milepostRange: "Downtown Marine Park to PAJN / Mendenhall Glacier",
    maxElevationFeet: 5200,
    maxGradePercent: 0,
    applicableRegulationIds: ["reg:faa-part135-pajn-vfr-ceiling"],
    supportedVehicleClassIds: ["veh:heli-astar-as350"],
    evidenceVersion: "dcc-evidence-juneau-heli/2026.11",
    verifiedCitationIds: ["coastal-heli-faq", "viator-worry-free-sec20"],
  },
  {
    segmentId: "seg:nola-fq-barataria-lafitte",
    corridorId: "corridor:new-orleans-barataria-swamp",
    sequenceOrder: 1,
    name: "French Quarter / Port of New Orleans to Jean Lafitte & Barataria Basin",
    jurisdiction: "USCG Sector New Orleans / NPS Jean Lafitte NHP&P",
    highwayOrWaterway: "US-90B Crescent City Connection / LA-45 Barataria Waterway",
    milepostRange: "French Quarter Pickups to Lafitte / Marrero Docks",
    maxElevationFeet: 15,
    maxGradePercent: 4.0,
    applicableRegulationIds: ["reg:uscg-barataria-airboat-age-safety"],
    supportedVehicleClassIds: [
      "veh:small-open-airboat",
      "veh:covered-pontoon-swamp-boat",
    ],
    evidenceVersion: "dcc-evidence-nola-swamp/2026.11",
    verifiedCitationIds: ["airboat-adventures-rates", "nps-barataria-closure"],
  },
] as const;

export const VEHICLE_CLASSES: readonly VehicleClassCapacitySpec[] = [
  {
    vehicleClassId: "veh:sedan-2wd",
    corridorIds: ["corridor:denver-vail-i70", "corridor:denver-red-rocks"],
    displayName: "Standard 2WD Sedan / Economy Rental",
    operatorId: "op:generic-2wd-rental",
    operatorName: "Standard Airport 2WD Rental / Rideshare",
    providerType: "self_drive_rental",
    drivetrain: "2wd",
    commercialChainEquipped: false,
    maxPassengersStandard: 3,
    maxPassengersWithFullLengthSkiBagsInside: 2,
    maxStandardBagsWithFullPassengerLoad: 2,
    maxStandardBagsWithFoldedThirdRow: 3,
    maxSkiOrOversizeBagsInsideWithFullPassengerLoad: 0,
    maxSkiOrOversizeBagsWithRoofBoxAndFoldedRow: 0,
    minPassengerAgeYears: 0,
    pricingModel: "multi_vehicle_rental",
    fixedRateOneWayUsd: null,
    quoteOnly: false,
    evidenceVersion: "dcc-evidence-co-i70/2026.11",
  },
  {
    vehicleClassId: "veh:awd-full-size-suv",
    corridorIds: ["corridor:denver-vail-i70", "corridor:denver-breckenridge-i70", "corridor:denver-red-rocks"],
    displayName: "Private 3-Row Full-Size AWD/4WD SUV (GoSno)",
    operatorId: "op:gosno",
    operatorName: "GoSno Mountain Transport",
    providerType: "direct_operator",
    drivetrain: "awd_4wd",
    commercialChainEquipped: true,
    maxPassengersStandard: 6,
    maxPassengersWithFullLengthSkiBagsInside: 4,
    maxStandardBagsWithFullPassengerLoad: 4,
    maxStandardBagsWithFoldedThirdRow: 6,
    maxSkiOrOversizeBagsInsideWithFullPassengerLoad: 0,
    maxSkiOrOversizeBagsWithRoofBoxAndFoldedRow: 4,
    minPassengerAgeYears: 0,
    pricingModel: "fixed_vehicle_rate",
    fixedRateOneWayUsd: 499,
    quoteOnly: false,
    evidenceVersion: "dcc-evidence-co-i70/2026.11",
  },
  {
    vehicleClassId: "veh:private-transit-van-10-14",
    corridorIds: ["corridor:denver-vail-i70", "corridor:denver-breckenridge-i70", "corridor:denver-red-rocks"],
    displayName: "Private 10–14 Passenger High-Roof Transit Van (GoSno)",
    operatorId: "op:gosno",
    operatorName: "GoSno Mountain Transport",
    providerType: "direct_operator",
    drivetrain: "awd_commercial_chains",
    commercialChainEquipped: true,
    maxPassengersStandard: 14,
    maxPassengersWithFullLengthSkiBagsInside: 14,
    maxStandardBagsWithFullPassengerLoad: 14,
    maxStandardBagsWithFoldedThirdRow: 14,
    maxSkiOrOversizeBagsInsideWithFullPassengerLoad: 14,
    maxSkiOrOversizeBagsWithRoofBoxAndFoldedRow: 14,
    minPassengerAgeYears: 0,
    pricingModel: "quote_only",
    fixedRateOneWayUsd: null,
    quoteOnly: true,
    evidenceVersion: "dcc-evidence-co-i70/2026.11",
  },
  {
    vehicleClassId: "veh:shared-mountain-shuttle",
    corridorIds: ["corridor:denver-vail-i70", "corridor:denver-breckenridge-i70"],
    displayName: "Per-Seat Shared Mountain Shuttle (Epic Mountain Express)",
    operatorId: "op:epic-mountain-express",
    operatorName: "Epic Mountain Express",
    providerType: "shared_shuttle",
    drivetrain: "awd_commercial_chains",
    commercialChainEquipped: true,
    maxPassengersStandard: 14,
    maxPassengersWithFullLengthSkiBagsInside: 14,
    maxStandardBagsWithFullPassengerLoad: 14,
    maxStandardBagsWithFoldedThirdRow: 14,
    maxSkiOrOversizeBagsInsideWithFullPassengerLoad: 14,
    maxSkiOrOversizeBagsWithRoofBoxAndFoldedRow: 14,
    includedBagsPerPassenger: 2,
    extraBagFeeUsd: 10,
    minPassengerAgeYears: 0,
    pricingModel: "per_seat_variable",
    fixedRateOneWayUsd: null,
    quoteOnly: false,
    evidenceVersion: "dcc-evidence-co-i70/2026.11",
  },
  {
    vehicleClassId: "veh:cdot-bustang-coach",
    corridorIds: ["corridor:denver-vail-i70"],
    displayName: "RTD A-Line Rail + CDOT Bustang West Line Coach",
    operatorId: "op:cdot-bustang",
    operatorName: "CDOT Bustang & RTD",
    providerType: "public_transit",
    drivetrain: "commercial_coach_chains",
    commercialChainEquipped: true,
    maxPassengersStandard: 14,
    maxPassengersWithFullLengthSkiBagsInside: 14,
    maxStandardBagsWithFullPassengerLoad: 8,
    maxStandardBagsWithFoldedThirdRow: 8,
    maxSkiOrOversizeBagsInsideWithFullPassengerLoad: 4,
    maxSkiOrOversizeBagsWithRoofBoxAndFoldedRow: 4,
    includedBagsPerPassenger: 2,
    extraBagFeeUsd: null,
    minPassengerAgeYears: 0,
    requiresManualTransitTransfer: true,
    pricingModel: "public_fare",
    fixedRateOneWayUsd: 27.5,
    quoteOnly: false,
    evidenceVersion: "dcc-evidence-co-i70/2026.11",
  },
  {
    vehicleClassId: "veh:heli-astar-as350",
    corridorIds: ["corridor:juneau-port-icefield"],
    displayName: "Airbus AS350 / H125 6-Passenger Glacier Helicopter",
    operatorId: "op:coastal-helicopters",
    operatorName: "Coastal Helicopters",
    providerType: "direct_operator",
    drivetrain: "rotorcraft_part135",
    commercialChainEquipped: false,
    maxPassengersStandard: 6,
    maxPassengersWithFullLengthSkiBagsInside: 0,
    maxStandardBagsWithFullPassengerLoad: 0,
    maxStandardBagsWithFoldedThirdRow: 0,
    maxSkiOrOversizeBagsInsideWithFullPassengerLoad: 0,
    maxSkiOrOversizeBagsWithRoofBoxAndFoldedRow: 0,
    minPassengerAgeYears: 0,
    singlePassengerWeightThresholdLbs: 259,
    prohibitsCarryOnBags: true,
    pricingModel: "per_seat_variable",
    fixedRateOneWayUsd: 459,
    quoteOnly: false,
    evidenceVersion: "dcc-evidence-juneau-heli/2026.11",
  },
  {
    vehicleClassId: "veh:small-open-airboat",
    corridorIds: ["corridor:new-orleans-barataria-swamp"],
    displayName: "Small 6–10 Passenger High-Speed Open Airboat",
    operatorId: "op:airboat-adventures",
    operatorName: "Airboat Adventures",
    providerType: "direct_operator",
    drivetrain: "marine_planing_airboat",
    commercialChainEquipped: false,
    maxPassengersStandard: 10,
    maxPassengersWithFullLengthSkiBagsInside: 0,
    maxStandardBagsWithFullPassengerLoad: 0,
    maxStandardBagsWithFoldedThirdRow: 0,
    maxSkiOrOversizeBagsInsideWithFullPassengerLoad: 0,
    maxSkiOrOversizeBagsWithRoofBoxAndFoldedRow: 0,
    minPassengerAgeYears: 5,
    prohibitsCarryOnBags: true,
    pricingModel: "per_seat_variable",
    fixedRateOneWayUsd: 119,
    quoteOnly: false,
    evidenceVersion: "dcc-evidence-nola-swamp/2026.11",
  },
  {
    vehicleClassId: "veh:covered-pontoon-swamp-boat",
    corridorIds: ["corridor:new-orleans-barataria-swamp"],
    displayName: "Covered Canopy Pontoon Swamp Tour Boat",
    operatorId: "op:airboat-adventures",
    operatorName: "Airboat Adventures",
    providerType: "direct_operator",
    drivetrain: "marine_displacement_pontoon",
    commercialChainEquipped: false,
    maxPassengersStandard: 45,
    maxPassengersWithFullLengthSkiBagsInside: 0,
    maxStandardBagsWithFullPassengerLoad: 10,
    maxStandardBagsWithFoldedThirdRow: 10,
    maxSkiOrOversizeBagsInsideWithFullPassengerLoad: 0,
    maxSkiOrOversizeBagsWithRoofBoxAndFoldedRow: 0,
    minPassengerAgeYears: 0,
    prohibitsCarryOnBags: false,
    pricingModel: "per_seat_variable",
    fixedRateOneWayUsd: 65,
    quoteOnly: false,
    evidenceVersion: "dcc-evidence-nola-swamp/2026.11",
  },
] as const;

export const SEASONAL_REGULATIONS: readonly SeasonalRegulationSpec[] = [
  {
    regulationId: "reg:co-passenger-traction-law-code-15",
    corridorIds: ["corridor:denver-vail-i70", "corridor:denver-breckenridge-i70"],
    segmentIds: ["seg:i70-den-eisenhower-tunnel", "seg:i70-vail-pass"],
    code: "CO-CDOT-CODE-15",
    statuteOrAuthority: "C.R.S. § 42-4-106 (Mandatory Sept 1 – May 31 on I-70 Dotsero to Morrison)",
    title: "Colorado I-70 Passenger Vehicle Traction Law (Code 15)",
    activeMonthsUtc: [1, 2, 3, 4, 5, 9, 10, 11, 12],
    canBeTriggeredByLiveCondition: true,
    liveConditionTriggerKey: "i70TractionLawActive",
    requiresAwdOrWinterTires: true,
    requiresPhysicalChainsOrAltTractionOnAllVehicles: false,
    requiresCommercialChainsOnVansAndCoaches: false,
    disqualifiesVehicleClassIdsWhenActive: ["veh:sedan-2wd"],
    compiledConstraintCode: "REG_I70_TRACTION_LAW_CODE_15_ACTIVE",
    deterministicDirective:
      "Mandatory I-70 Traction Law (C.R.S. § 42-4-106) is active across Eisenhower Tunnel and Vail Pass: 2WD vehicles without Mud+Snow (M+S) or 3PMSF tires (>= 3/16-inch tread) or chains/AutoSock are legally prohibited.",
    evidenceVersion: "dcc-evidence-co-i70/2026.11",
    verifiedCitationId: "cdot-traction-law",
  },
  {
    regulationId: "reg:co-passenger-chain-law-code-16",
    corridorIds: ["corridor:denver-vail-i70"],
    segmentIds: ["seg:i70-vail-pass"],
    code: "CO-CDOT-CODE-16",
    statuteOrAuthority: "C.R.S. § 42-4-106 Passenger Vehicle Chain Law (Final Safety Threshold Before I-70 Closure)",
    title: "Vail Pass Active Passenger & Commercial Chain Law (Code 16)",
    activeMonthsUtc: [],
    canBeTriggeredByLiveCondition: true,
    liveConditionTriggerKey: "vailPassChainLawActive",
    requiresAwdOrWinterTires: true,
    requiresPhysicalChainsOrAltTractionOnAllVehicles: true,
    requiresCommercialChainsOnVansAndCoaches: true,
    disqualifiesVehicleClassIdsWhenActive: ["veh:sedan-2wd"],
    compiledConstraintCode: "REG_VAIL_PASS_CHAIN_LAW_CODE_16_ACTIVE",
    deterministicDirective:
      "Active Vail Pass Chain Law (Code 16) is enforced on segment seg:i70-vail-pass (MP 180–195, 10,662 ft, 7% grade): every vehicle must have physical tire chains or approved AutoSock traction devices installed; standard airport rental SUVs prohibit tire chains under rental-car agreements, requiring a commercial chain-equipped operator (GoSno private van/SUV or Epic Mountain Express).",
    evidenceVersion: "dcc-evidence-co-i70/2026.11",
    verifiedCitationId: "cdot-traction-law",
  },
  {
    regulationId: "reg:co-commercial-chain-law-code-18",
    corridorIds: ["corridor:denver-vail-i70", "corridor:denver-breckenridge-i70"],
    segmentIds: ["seg:i70-den-eisenhower-tunnel", "seg:i70-vail-pass"],
    code: "CO-CDOT-CODE-18",
    statuteOrAuthority: "C.R.S. § 42-4-106 Commercial Motor Vehicle Chain Law (Sept 1 – May 31)",
    title: "Colorado I-70 Commercial Motor Vehicle Chain Law (Code 18)",
    activeMonthsUtc: [1, 2, 3, 4, 5, 9, 10, 11, 12],
    canBeTriggeredByLiveCondition: true,
    liveConditionTriggerKey: "vailPassChainLawActive",
    requiresAwdOrWinterTires: true,
    requiresPhysicalChainsOrAltTractionOnAllVehicles: false,
    requiresCommercialChainsOnVansAndCoaches: true,
    disqualifiesVehicleClassIdsWhenActive: [],
    compiledConstraintCode: "REG_I70_COMMERCIAL_CHAIN_CARRY_CODE_18",
    deterministicDirective:
      "Commercial carriers operating on I-70 between Dotsero and Morrison (Sept 1 – May 31) must carry commercial tire chains and install them when Code 18 is posted at Vail Pass or Eisenhower Tunnel.",
    evidenceVersion: "dcc-evidence-co-i70/2026.11",
    verifiedCitationId: "cdot-traction-law",
  },
  {
    regulationId: "reg:faa-part135-pajn-vfr-ceiling",
    corridorIds: ["corridor:juneau-port-icefield"],
    segmentIds: ["seg:jnu-port-mendenhall-corridor"],
    code: "FAA-PART135-PAJN-VFR",
    statuteOrAuthority: "14 CFR Part 135 VFR Ceiling & Visibility Minimums (PAJN / Juneau Icefield)",
    title: "FAA Part 135 Juneau Icefield VFR Ceiling & Weight-Balance Rule",
    activeMonthsUtc: [5, 6, 7, 8, 9],
    canBeTriggeredByLiveCondition: true,
    liveConditionTriggerKey: "pajnLowCeilingIframeWarning",
    requiresAwdOrWinterTires: false,
    requiresPhysicalChainsOrAltTractionOnAllVehicles: false,
    requiresCommercialChainsOnVansAndCoaches: false,
    disqualifiesVehicleClassIdsWhenActive: [],
    compiledConstraintCode: "REG_FAA_PART135_PAJN_DISPATCH_AND_WEIGHT_BALANCE",
    deterministicDirective:
      "Helicopter glacier landings require FAA Part 135 VFR ceiling/visibility minimums evaluated within 60 minutes of departure, zero carry-on bags on the aircraft, and per-passenger weight-tier seating (260–299 lbs half-seat surcharge; 300+ lbs second seat).",
    evidenceVersion: "dcc-evidence-juneau-heli/2026.11",
    verifiedCitationId: "coastal-heli-faq",
  },
  {
    regulationId: "reg:uscg-barataria-airboat-age-safety",
    corridorIds: ["corridor:new-orleans-barataria-swamp"],
    segmentIds: ["seg:nola-fq-barataria-lafitte"],
    code: "NOLA-SWAMP-AIRBOAT-AGE-5",
    statuteOrAuthority: "Operator Marine Safety Rule (Airboat Adventures / Jean Lafitte Waterway)",
    title: "High-Speed Airboat Minimum Age (5+) & Spine/Pregnancy Restriction",
    activeMonthsUtc: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    canBeTriggeredByLiveCondition: false,
    liveConditionTriggerKey: null,
    requiresAwdOrWinterTires: false,
    requiresPhysicalChainsOrAltTractionOnAllVehicles: false,
    requiresCommercialChainsOnVansAndCoaches: false,
    disqualifiesVehicleClassIdsWhenActive: [],
    compiledConstraintCode: "REG_SWAMP_AIRBOAT_MIN_AGE_5_YEARS",
    deterministicDirective:
      "Children under 5 years old, expectant mothers, and passengers with back or neck conditions are prohibited from boarding high-speed open airboats and must be routed to a covered pontoon swamp boat.",
    evidenceVersion: "dcc-evidence-nola-swamp/2026.11",
    verifiedCitationId: "airboat-adventures-rates",
  },
] as const;

export interface StewardVehicleEvidencePatch {
  vehicleClassId: string;
  evidenceVersion: string;
  maxPassengersStandard?: number;
  maxStandardBagsWithFullPassengerLoad?: number;
  maxStandardBagsWithFoldedThirdRow?: number;
  commercialChainEquipped?: boolean;
  fixedRateOneWayUsd?: number | null;
  quoteOnly?: boolean;
  operatingAuthorityValid?: boolean;
}

import {
  readDurableLedgerState,
  runDurableLedgerTransaction,
} from "../storage/durableTransactionalStore";

const DEFAULT_EVIDENCE_SNAPSHOT_ID = "dcc-evidence-bundle/2026.11.02";

export function applyStewardVehicleEvidencePatch(
  patch: StewardVehicleEvidencePatch,
  resultingEvidenceSnapshotId: string,
): void {
  runDurableLedgerTransaction((state) => {
    state.stewardVehiclePatchesByClassId[patch.vehicleClassId] = patch;
    state.stewardLatestSnapshotId = resultingEvidenceSnapshotId;
  });
}

export function getStewardVehicleEvidencePatch(
  vehicleClassId: string,
): StewardVehicleEvidencePatch | undefined {
  const state = readDurableLedgerState();
  return state.stewardVehiclePatchesByClassId[vehicleClassId];
}

export function resetStewardVehicleEvidencePatchesForTests(): void {
  runDurableLedgerTransaction((state) => {
    state.stewardVehiclePatchesByClassId = {};
    state.stewardLatestSnapshotId = null;
  });
}

export function getVersionedApplicabilityContextModel(): VersionedApplicabilityContextModel {
  const durableState = readDurableLedgerState();
  const effectiveSnapshotId =
    durableState.stewardLatestSnapshotId || DEFAULT_EVIDENCE_SNAPSHOT_ID;

  const effectiveVehicles: readonly VehicleClassCapacitySpec[] = VEHICLE_CLASSES.map((v) => {
    const patch = durableState.stewardVehiclePatchesByClassId[v.vehicleClassId];
    if (!patch) return v;
    return {
      ...v,
      evidenceVersion: patch.evidenceVersion,
      ...(typeof patch.maxPassengersStandard === "number"
        ? { maxPassengersStandard: patch.maxPassengersStandard }
        : {}),
      ...(typeof patch.maxStandardBagsWithFullPassengerLoad === "number"
        ? {
            maxStandardBagsWithFullPassengerLoad:
              patch.maxStandardBagsWithFullPassengerLoad,
          }
        : {}),
      ...(typeof patch.maxStandardBagsWithFoldedThirdRow === "number"
        ? {
            maxStandardBagsWithFoldedThirdRow:
              patch.maxStandardBagsWithFoldedThirdRow,
          }
        : {}),
      ...(typeof patch.commercialChainEquipped === "boolean"
        ? { commercialChainEquipped: patch.commercialChainEquipped }
        : {}),
      ...(patch.fixedRateOneWayUsd !== undefined
        ? { fixedRateOneWayUsd: patch.fixedRateOneWayUsd }
        : {}),
      ...(typeof patch.quoteOnly === "boolean" ? { quoteOnly: patch.quoteOnly } : {}),
    };
  });

  const core = {
    modelVersion: APPLICABILITY_MODEL_VERSION,
    compilerVersion: APPLICABILITY_COMPILER_VERSION,
    evidenceVersion: effectiveSnapshotId,
    knowledgeCutoff: "2026-11-02T12:00:00.000Z",
    segments: GEOGRAPHIC_SEGMENTS,
    vehicleClasses: effectiveVehicles,
    regulations: SEASONAL_REGULATIONS,
  };
  const modelHash = `sha256:${sha256HexFull(rfc8785Canonicalize(core))}`;
  return {
    ...core,
    modelHash,
  };
}
