import { z } from "zod";
import { evaluateDecisionEngine } from "@/lib/dcc/decisionEngines/evaluator";
import type {
  CandidateOption,
  ComparisonDimension,
  DecisionEngineDefinition,
  DecisionEvaluateOptions,
  DecisionResult,
  EvidenceClaim,
  HardConstraintRule,
  PreferenceRule,
  QuestionDefinition,
  SourceRecord,
  TimingCalculationResult,
} from "@/lib/dcc/decisionEngines/types";

export interface Denver420AirportTransfersInput {
  destinationZone: "mountain_resort_corridor" | "denver_metro_or_downtown";
  wantsEnRouteDispensaryStopContext: boolean;
  transferModePreference:
    | "private_arranged_transfer"
    | "public_rail_and_separate_errand";
  travelDate: string | null;
}

export const DENVER_420_AIRPORT_DEFAULT_EXAMPLE_INPUT: Denver420AirportTransfersInput =
  {
    destinationZone: "mountain_resort_corridor",
    wantsEnRouteDispensaryStopContext: true,
    transferModePreference: "private_arranged_transfer",
    travelDate: null,
  };

const ymdRegex = /^\d{4}-\d{2}-\d{2}$/;

export const DENVER_420_AIRPORT_ANSWER_SCHEMA = z
  .object({
    destinationZone: z
      .enum(["mountain_resort_corridor", "denver_metro_or_downtown"])
      .default(DENVER_420_AIRPORT_DEFAULT_EXAMPLE_INPUT.destinationZone),
    wantsEnRouteDispensaryStopContext: z
      .boolean()
      .default(
        DENVER_420_AIRPORT_DEFAULT_EXAMPLE_INPUT.wantsEnRouteDispensaryStopContext,
      ),
    transferModePreference: z
      .enum(["private_arranged_transfer", "public_rail_and_separate_errand"])
      .default(DENVER_420_AIRPORT_DEFAULT_EXAMPLE_INPUT.transferModePreference),
    travelDate: z
      .string()
      .regex(ymdRegex, "travelDate must be YYYY-MM-DD when provided")
      .nullable()
      .default(DENVER_420_AIRPORT_DEFAULT_EXAMPLE_INPUT.travelDate),
  })
  .strict();

export const DENVER_420_AIRPORT_SOURCE_RECORDS: SourceRecord[] = [
  {
    sourceId: "src-420-airport-pickup-site-truth-2026",
    sourceOrganization:
      "420 Friendly Airport Pickup (DCC Verified Site Truth)",
    sourceTitle:
      "420 Friendly Airport Pickup — Colorado Airport-Transfer Discovery Property Routing to Operator Checkout",
    sourceUrl: "https://420friendlyairportpickup.com",
    claimsSupported: [
      "claim-420-pickup-operator-checkout-boundary",
      "claim-420-pickup-separate-transport-and-consumption-rules",
    ],
    retrievedAt: "2026-08-24T00:00:00.000Z",
    verifiedAt: "2026-08-24T00:00:00.000Z",
    expiresAt: "2027-02-24T00:00:00.000Z",
    freshnessCategory: "operator_tariff_and_policy",
    status: "current",
  },
  {
    sourceId: "src-gosno-operator-site-truth-2026",
    sourceOrganization: "GoSno (DCC Verified Site Truth)",
    sourceTitle:
      "GoSno Mountain Shuttle & Private Transfer Checkout Authority (gosno.co)",
    sourceUrl: "https://gosno.co",
    claimsSupported: ["claim-420-pickup-operator-checkout-boundary"],
    retrievedAt: "2026-08-24T00:00:00.000Z",
    verifiedAt: "2026-08-24T00:00:00.000Z",
    expiresAt: "2027-02-24T00:00:00.000Z",
    freshnessCategory: "operator_tariff_and_policy",
    status: "current",
  },
  {
    sourceId: "src-rtd-denver-a-line-2026",
    sourceOrganization: "Regional Transportation District (RTD Denver)",
    sourceTitle:
      "RTD University of Colorado A-Line — DEN Airport to Denver Union Station ($10.50 Airport Fare)",
    sourceUrl: "https://www.rtd-denver.com/Fares",
    claimsSupported: [
      "claim-rtd-a-line-downtown-baseline",
      "claim-420-pickup-separate-transport-and-consumption-rules",
    ],
    retrievedAt: "2026-10-18T00:00:00.000Z",
    verifiedAt: "2026-10-18T00:00:00.000Z",
    expiresAt: "2027-04-18T00:00:00.000Z",
    freshnessCategory: "regulatory_annual",
    status: "current",
  },
];

export const DENVER_420_AIRPORT_EVIDENCE_CLAIMS: EvidenceClaim[] = [
  {
    claimId: "claim-420-pickup-operator-checkout-boundary",
    classification: "operator_published_fact",
    statement:
      "420 Friendly Airport Pickup (420friendlyairportpickup.com) qualifies Denver/Colorado Springs airport transfer options with dispensary-stop context and routes travelers to operator checkout (such as GoSno at gosno.co) to finalize booking and payment; it does not take direct payment itself.",
    fieldsSupported: ["bookingDestinations", "comparisonValues"],
    sourceIds: [
      "src-420-airport-pickup-site-truth-2026",
      "src-gosno-operator-site-truth-2026",
    ],
    isDecisionChanging: true,
    verificationNote:
      "Verified in lib/dcc/siteTruth.ts (420-friendly-airport-pickup, booking.authority: operator, takes_direct_payment: false, last_verified 2026-08-24).",
  },
  {
    claimId: "claim-420-pickup-separate-transport-and-consumption-rules",
    classification: "official_rule",
    statement:
      "Airport-transfer planning with a dispensary stop must separate route/luggage logistics from vehicle and property rules: never assume a transportation provider allows consumption in the vehicle or that airport, hotel, or public-space rules match private-property rules.",
    fieldsSupported: ["tradeoffs", "comparisonValues"],
    sourceIds: [
      "src-420-airport-pickup-site-truth-2026",
      "src-rtd-denver-a-line-2026",
    ],
    isDecisionChanging: true,
    verificationNote:
      "Verified in src/data/pre-site-guides.ts (airport-pickup-after-visiting-a-dispensary-denver).",
  },
  {
    claimId: "claim-rtd-a-line-downtown-baseline",
    classification: "official_rule",
    statement:
      "RTD's A-Line commuter rail connects Denver International Airport (DEN) to Denver Union Station for $10.50 (37 minutes), providing a public baseline for downtown Denver stays when handling any retail stop separately.",
    fieldsSupported: ["indicativePriceUsd", "durationMinutes"],
    sourceIds: ["src-rtd-denver-a-line-2026"],
    isDecisionChanging: true,
    verificationNote:
      "Verified in RTD Denver published airport fare and schedule.",
  },
];

export const DENVER_420_AIRPORT_QUESTIONS: QuestionDefinition[] = [
  {
    questionId: "destinationZone",
    label: "1. Where is your final destination after landing at DEN?",
    helpText:
      "Mountain resort transfers require I-70 vehicle logistics, while downtown Denver stays can also use the $10.50 RTD A-Line.",
    inputType: "select",
    requiredForPersonalizedVerdict: true,
    decisionImpactExplanation:
      "Eliminates the downtown-only RTD A-Line rail lane when your final destination is a mountain resort without a mountain connection.",
    drivenByClaimIds: [
      "claim-420-pickup-operator-checkout-boundary",
      "claim-rtd-a-line-downtown-baseline",
    ],
    options: [
      {
        value: "mountain_resort_corridor",
        label: "Colorado Mountain Resort (I-70 / Winter Park / Summit / Vail)",
      },
      {
        value: "denver_metro_or_downtown",
        label: "Downtown Denver / Denver Metro Hotel or Rental",
      },
    ],
    defaultValue: DENVER_420_AIRPORT_DEFAULT_EXAMPLE_INPUT.destinationZone,
  },
  {
    questionId: "wantsEnRouteDispensaryStopContext",
    label:
      "2. Do you want a pre-arranged en-route dispensary stop with luggage stays in the vehicle?",
    helpText:
      "420 Friendly Airport Pickup qualifies transfers with dispensary-stop context and routes into operator checkout.",
    inputType: "boolean",
    requiredForPersonalizedVerdict: true,
    decisionImpactExplanation:
      "Determines whether to qualify through 420 Friendly Airport Pickup or go straight to a direct non-stop transfer.",
    drivenByClaimIds: ["claim-420-pickup-operator-checkout-boundary"],
    defaultValue:
      DENVER_420_AIRPORT_DEFAULT_EXAMPLE_INPUT.wantsEnRouteDispensaryStopContext,
  },
  {
    questionId: "transferModePreference",
    label: "3. Which transfer structure fits your group?",
    helpText:
      "Compare private arranged pickup against public rail + handling any retail stop separately after hotel check-in.",
    inputType: "select",
    requiredForPersonalizedVerdict: true,
    decisionImpactExplanation:
      "Ranks private arranged pickup vs. public rail baseline.",
    drivenByClaimIds: [
      "claim-420-pickup-operator-checkout-boundary",
      "claim-rtd-a-line-downtown-baseline",
    ],
    options: [
      {
        value: "private_arranged_transfer",
        label: "Private arranged airport pickup (luggage stays in one vehicle)",
      },
      {
        value: "public_rail_and_separate_errand",
        label: "Public transit first, handle any retail stop separately later",
      },
    ],
    defaultValue:
      DENVER_420_AIRPORT_DEFAULT_EXAMPLE_INPUT.transferModePreference,
  },
  {
    questionId: "travelDate",
    label: "4. Arrival date (optional)",
    helpText: "Leave blank to view the default comparison scenario.",
    inputType: "date",
    requiredForPersonalizedVerdict: false,
    decisionImpactExplanation:
      "Marks the evaluation as a personalized date scenario.",
    drivenByClaimIds: ["claim-420-pickup-operator-checkout-boundary"],
    defaultValue: null,
  },
];

export const DENVER_420_AIRPORT_COMPARISON_DIMENSIONS: ComparisonDimension[] = [
  {
    dimensionId: "stopHandling",
    label: "Dispensary-Stop Handling",
    description: "How an en-route stop and luggage are handled.",
  },
  {
    dimensionId: "checkoutAuthority",
    label: "Checkout & Payment Authority",
    description: "Which entity finalizes booking and payment.",
  },
  {
    dimensionId: "policyBoundary",
    label: "Vehicle & Property Policy Boundary",
    description: "Verified separation between transport and consumption rules.",
  },
];

export const DENVER_420_AIRPORT_CANDIDATE_OPTIONS: CandidateOption[] = [
  {
    optionId: "den-420-specialist-pickup-qualification",
    title:
      "Airport Transfer Qualification with Dispensary-Stop Context (420 Friendly Airport Pickup → Operator Checkout)",
    shortLabel: "420 Friendly Airport Pickup",
    optionKind: "owned_specialist_comparison",
    actualOperators: [
      "Connected Private Transfer Operators (such as GoSno at gosno.co)",
    ],
    islandsOrRegions: ["Denver Metro", "Colorado I-70 Mountain Corridor"],
    departureAreas: [
      "Denver International Airport (DEN) & Colorado Springs Airport (COS)",
    ],
    operatingMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    scheduleVerifiedThroughDate: "2026-08-24",
    vesselOrVehicleType:
      "Private SUV / van transfer qualified with dispensary-stop trip context",
    groupCapacityRange: {
      min: 1,
      max: 14,
      label: "Private group vehicle (operator-dependent)",
    },
    rideComfortLevel: "high_stability",
    viewingSpaceDescription:
      "Private airport pickup with pre-qualified dispensary-stop routing so bags remain with your dedicated vehicle while you make a brief retail stop en route.",
    durationMinutes: {
      activity: 120,
      checkInLead: 15,
      typicalTransferEachWay: 0,
      totalDockOrHotelRange: { min: 60, max: 180 },
      label: "Route-dependent (DEN to Metro or I-70 Mountain Resort)",
    },
    minimumAgeYears: 21,
    minimumAgeNote:
      "Colorado retail dispensary entry requires a valid government ID showing age 21+.",
    accessibilityProfile: {
      stepFreeWheelchairSupported: false,
      limitedMobilitySupported: true,
      walkingAndBoardingRequirement: "Curbside SUV/van boarding at DEN.",
      confirmationStatus: "operator_confirmation_required",
      note: "Confirm mobility equipment and vehicle rules with the fulfilling transfer operator.",
    },
    transportationAvailability: {
      hotelPickupAvailable: true,
      cruisePortShuttleAvailable: false,
      selfDriveParkingNote: "Door-to-door private transfer from DEN.",
    },
    cancellationTerms:
      "420 Friendly Airport Pickup takes no direct payment; booking, payment, and cancellation terms are finalized at operator checkout (such as GoSno).",
    whaleSightingOrReRidePolicy:
      "N/A — private airport transfer qualification surface.",
    indicativePriceUsd: {
      min: 0,
      max: 0,
      basisLabel:
        "Published at fulfilling operator checkout (420friendlyairportpickup.com takes no direct payment)",
    },
    comparisonValues: {
      stopHandling:
        "Pre-qualified en-route dispensary stop context with luggage kept in the private vehicle",
      checkoutAuthority:
        "Fulfilling operator checkout (e.g., GoSno); 420friendlyairportpickup.com does not take direct payment",
      policyBoundary:
        "Separates transport logistics from vehicle/property rules; never assume in-vehicle consumption is permitted",
    },
    tradeoffs: {
      strengths: [
        "Solves the multi-stop airport arrival problem so travelers do not have to haul suitcases and ski bags into a retail stop or book two separate rideshares.",
        "Routes directly into operator checkout (such as GoSno for mountain transfers) once trip context is qualified.",
      ],
      limitations: [
        "420 Friendly Airport Pickup is a qualification and routing property (takes_direct_payment: false); final booking and vehicle rules are confirmed with the fulfilling operator.",
        "Never assume a transportation provider allows consumption inside the vehicle.",
      ],
    },
    claimIds: [
      "claim-420-pickup-operator-checkout-boundary",
      "claim-420-pickup-separate-transport-and-consumption-rules",
    ],
    sourceIds: [
      "src-420-airport-pickup-site-truth-2026",
      "src-gosno-operator-site-truth-2026",
    ],
    bookingDestinations: [
      {
        destinationId: "dest-420-friendly-airport-pickup",
        optionId: "den-420-specialist-pickup-qualification",
        sellerType: "dcc_owned_specialist",
        sellerName: "420 Friendly Airport Pickup",
        actualOperatorName: "Fulfilling Private Transfer Operator (e.g., GoSno)",
        label: "Qualify Airport Pickup with Dispensary-Stop Context",
        url: "https://420friendlyairportpickup.com",
        supportedContextParams: ["src"],
        relationshipDisclosure:
          "420 Friendly Airport Pickup (420friendlyairportpickup.com) is a connected DCC portfolio discovery surface that routes travelers to operator checkout (such as GoSno) to finalize booking and payment. Commercial relationships have zero influence on ranking (commercialWeightApplied: 0).",
        isCommercialPartner: true,
        commissionInfluenceOnRanking: 0,
      },
    ],
  },
  {
    optionId: "den-420-direct-gosno-mountain-transfer",
    title:
      "Direct Private Mountain Transfer Checkout (GoSno — Handle Any Retail Visit Separately at Destination)",
    shortLabel: "GoSno Direct Mountain Transfer",
    optionKind: "direct_operator" as unknown as CandidateOption["optionKind"],
    actualOperators: ["GoSno (gosno.co)"],
    islandsOrRegions: ["Colorado I-70 Mountain Corridor"],
    departureAreas: ["Denver International Airport (DEN)"],
    operatingMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    scheduleVerifiedThroughDate: "2026-08-24",
    vesselOrVehicleType: "Private 6-Seat SUV or 10–14 Seat Private Van",
    groupCapacityRange: {
      min: 1,
      max: 14,
      label: "1–6 (SUV) or up to 14 (Private Van)",
    },
    rideComfortLevel: "high_stability",
    viewingSpaceDescription:
      "Direct private airport-to-mountain transfer booked directly on GoSno (gosno.co).",
    durationMinutes: {
      activity: 110,
      checkInLead: 15,
      typicalTransferEachWay: 0,
      totalDockOrHotelRange: { min: 90, max: 165 },
      label: "Direct DEN to Mountain Resort transfer",
    },
    minimumAgeYears: null,
    minimumAgeNote: "All ages welcome on standard private mountain transfers.",
    accessibilityProfile: {
      stepFreeWheelchairSupported: false,
      limitedMobilitySupported: true,
      walkingAndBoardingRequirement: "Curbside SUV/van boarding at DEN.",
      confirmationStatus: "operator_confirmation_required",
      note: "Confirm mobility equipment directly with GoSno.",
    },
    transportationAvailability: {
      hotelPickupAvailable: true,
      cruisePortShuttleAvailable: false,
      selfDriveParkingNote: "Door-to-door private transfer from DEN.",
    },
    cancellationTerms: "Finalized directly at GoSno checkout (gosno.co).",
    whaleSightingOrReRidePolicy: "N/A — private mountain transfer.",
    indicativePriceUsd: {
      min: 0,
      max: 0,
      basisLabel: "Route-specific private vehicle fare published on gosno.co",
    },
    comparisonValues: {
      stopHandling:
        "Direct airport-to-resort transfer (or confirm stop policy with GoSno)",
      checkoutAuthority: "GoSno direct checkout (gosno.co, takes_payment: true)",
      policyBoundary: "Operator vehicle policies apply throughout the transfer",
    },
    tradeoffs: {
      strengths: [
        "Direct operator checkout on GoSno (gosno.co) for travelers headed straight to I-70 mountain resorts.",
        "Can be compared in full corridor detail on DCC's Denver-to-Mountain Transportation engine (/transportation/colorado).",
      ],
      limitations: [
        "If you specifically want pre-qualified dispensary-stop trip context before checkout, start on 420friendlyairportpickup.com first.",
      ],
    },
    claimIds: ["claim-420-pickup-operator-checkout-boundary"],
    sourceIds: ["src-gosno-operator-site-truth-2026"],
    bookingDestinations: [
      {
        destinationId: "dest-gosno-direct-from-420-engine",
        optionId: "den-420-direct-gosno-mountain-transfer",
        sellerType: "direct_operator",
        sellerName: "GoSno",
        actualOperatorName: "GoSno",
        label: "Open GoSno Direct Mountain Transfer Checkout",
        url: "https://gosno.co",
        supportedContextParams: ["src"],
        relationshipDisclosure:
          "GoSno (gosno.co) is a connected portfolio operator taking direct booking and payment. Commercial relationships have zero influence on ranking (commercialWeightApplied: 0).",
        isCommercialPartner: true,
        commissionInfluenceOnRanking: 0,
      },
    ],
  },
  {
    optionId: "den-420-public-rtd-aline-baseline",
    title:
      "RTD A-Line Commuter Rail to Denver Union Station ($10.50 — Check In First, Errand Separately)",
    shortLabel: "RTD A-Line ($10.50 Downtown)",
    optionKind: "public_or_diy",
    actualOperators: ["Regional Transportation District (RTD Denver)"],
    islandsOrRegions: ["Downtown Denver"],
    departureAreas: ["DEN Transit Center"],
    operatingMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    scheduleVerifiedThroughDate: "2026-10-18",
    vesselOrVehicleType: "Electrified commuter rail (37 min to Union Station)",
    groupCapacityRange: {
      min: 1,
      max: 20,
      label: "Public rail passenger seating",
    },
    rideComfortLevel: "high_stability",
    viewingSpaceDescription:
      "Direct 37-minute rail ride from DEN to Downtown Denver Union Station so you can drop luggage at your hotel first and handle any retail visit separately on foot.",
    durationMinutes: {
      activity: 37,
      checkInLead: 10,
      typicalTransferEachWay: 0,
      totalDockOrHotelRange: { min: 45, max: 60 },
      label: "37 minutes DEN to Denver Union Station",
    },
    minimumAgeYears: null,
    minimumAgeNote: "All ages on RTD public transit.",
    accessibilityProfile: {
      stepFreeWheelchairSupported: true,
      limitedMobilitySupported: true,
      walkingAndBoardingRequirement: "Level-boarding ADA commuter rail cars.",
      confirmationStatus: "confirmed_accessible",
      note: "RTD A-Line provides level platform boarding at DEN and Union Station.",
    },
    transportationAvailability: {
      hotelPickupAvailable: false,
      cruisePortShuttleAvailable: false,
      selfDriveParkingNote: "Terminates at Denver Union Station downtown.",
    },
    cancellationTerms: "$10.50 RTD Airport Day Pass.",
    whaleSightingOrReRidePolicy: "N/A — public commuter rail.",
    indicativePriceUsd: {
      min: 11,
      max: 11,
      basisLabel: "$10.50 RTD Airport fare per person",
    },
    comparisonValues: {
      stopHandling:
        "No en-route stop; drop luggage at downtown hotel first, then walk separately",
      checkoutAuthority: "RTD Denver public transit ($10.50)",
      policyBoundary:
        "Public transit rules strictly prohibit open containers or consumption on trains/stations",
    },
    tradeoffs: {
      strengths: [
        "$10.50 per person into Downtown Denver Union Station with level ADA boarding.",
        "Separates airport luggage transit from any retail errand—drop bags at your hotel first, then walk unencumbered.",
      ],
      limitations: [
        "Only serves the DEN-to-Union Station corridor (does not go to I-70 mountain resorts without a separate Bustang/Amtrak transfer).",
        "No en-route waiting vehicle for luggage.",
      ],
    },
    claimIds: [
      "claim-rtd-a-line-downtown-baseline",
      "claim-420-pickup-separate-transport-and-consumption-rules",
    ],
    sourceIds: ["src-rtd-denver-a-line-2026"],
    bookingDestinations: [
      {
        destinationId: "dest-rtd-aline-public",
        optionId: "den-420-public-rtd-aline-baseline",
        sellerType: "public_or_diy",
        sellerName: "RTD Denver",
        actualOperatorName: "Regional Transportation District (RTD)",
        label: "View RTD A-Line $10.50 Airport Fare & Schedule",
        url: "https://www.rtd-denver.com/Fares",
        supportedContextParams: [],
        relationshipDisclosure:
          "Public transit link provided as a neutral non-commercial baseline (commercialWeightApplied: 0).",
        isCommercialPartner: false,
        commissionInfluenceOnRanking: 0,
      },
    ],
  },
];

// Ensure optionKind matches CandidateOption union type strictly
DENVER_420_AIRPORT_CANDIDATE_OPTIONS[1].optionKind = "private_charter";

export const DENVER_420_AIRPORT_HARD_CONSTRAINT_RULES: HardConstraintRule<Denver420AirportTransfersInput>[] =
  [
    {
      ruleId: "hc-rtd-aline-downtown-only",
      label: "RTD A-Line Terminates at Denver Union Station",
      description:
        "Eliminates the standalone RTD A-Line rail option when the traveler is headed to a mountain resort and wants a single door-to-door private transfer.",
      sourceIds: ["src-rtd-a-line-downtown-baseline"],
      evaluate: (option, input) => {
        if (
          option.optionId === "den-420-public-rtd-aline-baseline" &&
          input.destinationZone === "mountain_resort_corridor" &&
          input.transferModePreference === "private_arranged_transfer"
        ) {
          return {
            passed: false,
            eliminationReason:
              "RTD A-Line terminates at Downtown Denver Union Station and does not provide a single-seat private transfer to Colorado mountain resorts.",
            whatInputChangeWouldAlterResult:
              "Select 'Downtown Denver' or 'Public transit first' if you plan to transfer at Union Station.",
          };
        }
        return { passed: true };
      },
    },
  ];

export const DENVER_420_AIRPORT_PREFERENCE_RULES: PreferenceRule<Denver420AirportTransfersInput>[] =
  [
    {
      ruleId: "pref-dispensary-stop-context-match",
      label: "En-Route Dispensary-Stop Context Qualification",
      maxPoints: 50,
      evaluate: (option, input) => {
        if (input.wantsEnRouteDispensaryStopContext) {
          if (option.optionId === "den-420-specialist-pickup-qualification") {
            return {
              points: 50,
              reason:
                "420 Friendly Airport Pickup specifically qualifies DEN/COS airport transfers with dispensary-stop context before routing to operator checkout.",
            };
          }
          return {
            points: 15,
            reason:
              "Does not pre-package en-route dispensary-stop context prior to checkout.",
          };
        }
        if (option.optionId === "den-420-direct-gosno-mountain-transfer") {
          return {
            points: 45,
            reason:
              "Direct operator checkout on GoSno when no en-route retail stop qualification is needed.",
          };
        }
        return {
          points: 35,
          reason: "Viable transfer lane when handling errands separately.",
        };
      },
    },
    {
      ruleId: "pref-mode-and-zone-match",
      label: "Transfer Mode & Destination Zone Fit",
      maxPoints: 30,
      evaluate: (option, input) => {
        if (
          input.transferModePreference === "public_rail_and_separate_errand" &&
          option.optionId === "den-420-public-rtd-aline-baseline"
        ) {
          return {
            points: 30,
            reason:
              "Matches preference to ride the $10.50 RTD A-Line into Downtown Denver first and handle any errand separately after hotel check-in.",
          };
        }
        if (
          input.transferModePreference === "private_arranged_transfer" &&
          option.optionId !== "den-420-public-rtd-aline-baseline"
        ) {
          return {
            points: 30,
            reason:
              "Matches preference for a private arranged vehicle with luggage kept secure.",
          };
        }
        return {
          points: 10,
          reason: "Alternative mode available for comparison.",
        };
      },
    },
  ];

function computeDenver420AirportTiming(
  option: CandidateOption,
): TimingCalculationResult {
  const checkIn = option.durationMinutes.checkInLead;
  const activity = option.durationMinutes.activity;
  const total = checkIn + activity;
  return {
    availableWindowMinutes: null,
    requiredTotalMinutes: total,
    checkInLeadMinutes: checkIn,
    transferMinutesRoundTrip: 0,
    activityMinutes: activity,
    returnBufferMinutes: 0,
    netSlackMinutes: null,
    summary: `${option.durationMinutes.label} (${total} min estimated including airport pickup lead).`,
  };
}

export const DENVER_420_AIRPORT_DECISION_ENGINE: DecisionEngineDefinition<Denver420AirportTransfersInput> =
  {
    engineId: "denver-420-airport-transfers",
    version: "1.0.0",
    slug: "guides/airport-pickup-after-visiting-a-dispensary-denver",
    canonicalPath:
      "/guides/airport-pickup-after-visiting-a-dispensary-denver",
    canonicalUrl:
      "https://destinationcommandcenter.com/guides/airport-pickup-after-visiting-a-dispensary-denver",
    title:
      "Denver Airport Pickup with Dispensary-Stop Context Decision Engine",
    destinationName: "Denver & Colorado Mountain Corridor",
    categoryName: "Airport Pickup & Dispensary-Stop Routing",
    heroQuestion:
      "Should you pre-arrange a private airport transfer with a dispensary stop, book direct mountain transport, or check into your hotel via the $10.50 RTD A-Line first?",
    summaryDescription:
      "High-level portfolio router separating 420 Friendly Airport Pickup (420friendlyairportpickup.com, which qualifies dispensary-stop context and routes to operator checkout such as GoSno) from direct mountain transfers and the $10.50 RTD A-Line public rail baseline.",
    referenceGuide: {
      importantDecisionFactors: [
        {
          title:
            "Qualification Property vs. Fulfilling Operator Checkout Authority",
          detail:
            "420 Friendly Airport Pickup (420friendlyairportpickup.com) qualifies Denver/Colorado Springs airport transfer options with dispensary-stop context and routes travelers to operator checkout (such as GoSno at gosno.co) to finalize booking and payment; it does not take direct payment itself.",
          sourceIds: [
            "src-420-airport-pickup-site-truth-2026",
            "src-gosno-operator-site-truth-2026",
          ],
        },
        {
          title:
            "Separate Transportation Logistics from Vehicle & Property Rules",
          detail:
            "Never assume a transportation provider allows consumption inside the vehicle, or that airport, hotel, or public-space rules match private-property rules.",
          sourceIds: ["src-420-airport-pickup-site-truth-2026"],
        },
      ],
      experienceAndVesselTypes: [
        {
          typeName:
            "Pre-Qualified Private Transfer with Dispensary-Stop Context (420 Friendly Airport Pickup)",
          capacityAndStability: "Private SUV or Van (operator-fulfilled)",
          bestFor:
            "Groups with luggage or ski gear wanting a single coordinated pickup from DEN with an en-route stop",
          limitations:
            "Final booking and payment occur at fulfilling operator checkout (e.g., GoSno)",
          sourceIds: ["src-420-airport-pickup-site-truth-2026"],
        },
        {
          typeName:
            "RTD A-Line Commuter Rail ($10.50) + Separate Errand After Hotel Drop",
          capacityAndStability: "Public commuter rail (37 min to Union Station)",
          bestFor:
            "Downtown Denver visitors who prefer to drop bags at their hotel first",
          limitations: "Does not serve I-70 mountain resorts directly",
          sourceIds: ["src-rtd-denver-a-line-2026"],
        },
      ],
      departureLocations: [
        {
          islandOrRegion: "Denver International Airport (DEN)",
          harborOrArea: "Jeppesen Terminal Curbside & DEN Transit Center",
          logisticsNote:
            "Private transfers meet curbside; RTD A-Line departs from the DEN Transit Center.",
          sourceIds: [
            "src-420-airport-pickup-site-truth-2026",
            "src-rtd-denver-a-line-2026",
          ],
        },
      ],
      commonTradeoffs: [
        {
          tradeoff:
            "Pre-Arranged Stop with Waiting Vehicle vs. Two Separate Rideshares",
          explanation:
            "Chaining two separate on-demand rideshares with suitcases and ski bags adds curbside wait time and luggage friction compared with either a pre-arranged private transfer or dropping bags at your hotel first.",
        },
      ],
      operationalDependencies: [
        {
          dependency: "Flight Arrival Timing & Store Hours",
          impact:
            "Late-night flight arrivals can miss retail operating hours, making direct-to-lodging transfer the cleaner choice.",
          sourceIds: ["src-420-airport-pickup-site-truth-2026"],
        },
      ],
      methodologySteps: [
        "Enforce the verified checkout boundary: 420 Friendly Airport Pickup qualifies trip context and routes to operator checkout (such as GoSno) without taking direct payment.",
        "Keep vehicle and property compliance boundaries explicit.",
        "Retain the $10.50 RTD A-Line public rail baseline for downtown Denver arrivals.",
      ],
    },
    questions: DENVER_420_AIRPORT_QUESTIONS,
    answerSchema: DENVER_420_AIRPORT_ANSWER_SCHEMA,
    defaultExampleInput: DENVER_420_AIRPORT_DEFAULT_EXAMPLE_INPUT,
    comparisonDimensions: DENVER_420_AIRPORT_COMPARISON_DIMENSIONS,
    candidateOptions: DENVER_420_AIRPORT_CANDIDATE_OPTIONS,
    hardConstraintRules: DENVER_420_AIRPORT_HARD_CONSTRAINT_RULES,
    preferenceRules: DENVER_420_AIRPORT_PREFERENCE_RULES,
    evidenceClaims: DENVER_420_AIRPORT_EVIDENCE_CLAIMS,
    sourceRecords: DENVER_420_AIRPORT_SOURCE_RECORDS,
    computeTimingForOption: (opt) => computeDenver420AirportTiming(opt),
    isExampleScenarioDetector: (rawInput, normalized) => {
      const isExample =
        rawInput === undefined ||
        rawInput === null ||
        normalized.travelDate === null;
      return {
        isExample,
        banner: isExample
          ? "Example Scenario Shown: DEN arrival headed to a Colorado mountain resort wanting pre-qualified dispensary-stop context before operator checkout."
          : null,
        missingInputFacts:
          normalized.travelDate === null
            ? [
                {
                  factId: "missing-den-420-arrival-date",
                  optionId: null,
                  category: "missing_traveler_input",
                  summary: "Arrival date not provided.",
                  impactOnDecision:
                    "Operator vehicle availability and exact transfer fares require confirming your arrival date at operator checkout.",
                  sourceIds: ["src-420-airport-pickup-site-truth-2026"],
                },
              ]
            : [],
      };
    },
    evaluate: (rawInput: unknown, options?: DecisionEvaluateOptions) =>
      evaluateDecisionEngine(
        DENVER_420_AIRPORT_DECISION_ENGINE,
        rawInput,
        options,
      ),
  };
