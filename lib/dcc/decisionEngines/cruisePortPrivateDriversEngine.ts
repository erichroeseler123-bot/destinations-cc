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

export interface CruisePortPrivateDriversInput {
  portDayStyle:
    | "custom_pace_local_driver"
    | "shared_group_itinerary_and_excursions"
    | "walkable_pier_no_excursion";
  acceptsDriverAcceptanceFinality: boolean;
  travelDate: string | null;
}

export const CRUISE_PORT_DRIVERS_DEFAULT_EXAMPLE_INPUT: CruisePortPrivateDriversInput =
  {
    portDayStyle: "custom_pace_local_driver",
    acceptsDriverAcceptanceFinality: true,
    travelDate: null,
  };

const ymdRegex = /^\d{4}-\d{2}-\d{2}$/;

export const CRUISE_PORT_DRIVERS_ANSWER_SCHEMA = z
  .object({
    portDayStyle: z
      .enum([
        "custom_pace_local_driver",
        "shared_group_itinerary_and_excursions",
        "walkable_pier_no_excursion",
      ])
      .default(CRUISE_PORT_DRIVERS_DEFAULT_EXAMPLE_INPUT.portDayStyle),
    acceptsDriverAcceptanceFinality: z
      .boolean()
      .default(
        CRUISE_PORT_DRIVERS_DEFAULT_EXAMPLE_INPUT.acceptsDriverAcceptanceFinality,
      ),
    travelDate: z
      .string()
      .regex(ymdRegex, "travelDate must be YYYY-MM-DD when provided")
      .nullable()
      .default(CRUISE_PORT_DRIVERS_DEFAULT_EXAMPLE_INPUT.travelDate),
  })
  .strict();

export const CRUISE_PORT_DRIVERS_SOURCE_RECORDS: SourceRecord[] = [
  {
    sourceId: "src-vibe-around-town-site-truth-2026",
    sourceOrganization:
      "Vibing Around Tour Co. / Vibe Around Town (DCC Verified Site Truth)",
    sourceTitle:
      "Vibe Around Town — Local-Driver Request, Acceptance & Reservation Marketplace (vibearoundtown.com)",
    sourceUrl: "https://vibearoundtown.com",
    claimsSupported: ["claim-vibe-around-driver-acceptance-finality"],
    retrievedAt: "2026-08-24T00:00:00.000Z",
    verifiedAt: "2026-08-24T00:00:00.000Z",
    expiresAt: "2027-02-24T00:00:00.000Z",
    freshnessCategory: "operator_tariff_and_policy",
    status: "current",
  },
  {
    sourceId: "src-cruise-promenade-site-truth-2026",
    sourceOrganization: "Cruise Promenade (DCC Verified Site Truth)",
    sourceTitle:
      "Cruise Promenade — Shared Private Cruise-Group Planning Property & Provider Excursion Referral (cruisepromenade.com)",
    sourceUrl: "https://cruisepromenade.com",
    claimsSupported: ["claim-cruise-promenade-group-planning-referral"],
    retrievedAt: "2026-09-10T00:00:00.000Z",
    verifiedAt: "2026-09-10T00:00:00.000Z",
    expiresAt: "2027-03-10T00:00:00.000Z",
    freshnessCategory: "operator_tariff_and_policy",
    status: "current",
  },
  {
    sourceId: "src-dcc-port-driver-vs-bus-guide-2026",
    sourceOrganization: "Destination Command Center Pre-Site Decision Guide",
    sourceTitle:
      "Independent Cruise-Port Driver vs. Bus Tour & Walkable Port-Day Baseline",
    sourceUrl:
      "https://destinationcommandcenter.com/guides/independent-cruise-port-driver-vs-bus-tour",
    claimsSupported: ["claim-port-day-walkable-baseline"],
    retrievedAt: "2026-10-18T00:00:00.000Z",
    verifiedAt: "2026-10-18T00:00:00.000Z",
    expiresAt: "2027-04-18T00:00:00.000Z",
    freshnessCategory: "operator_tariff_and_policy",
    status: "current",
  },
];

export const CRUISE_PORT_DRIVERS_EVIDENCE_CLAIMS: EvidenceClaim[] = [
  {
    claimId: "claim-vibe-around-driver-acceptance-finality",
    classification: "operator_published_fact",
    statement:
      "Vibing Around Tour Co. (vibearoundtown.com) is a local-driver request, acceptance, and reservation marketplace; a reservation request is not final until the driver accepts, and the site may collect the published reservation fee.",
    fieldsSupported: [
      "bookingDestinations",
      "cancellationTerms",
      "comparisonValues",
    ],
    sourceIds: ["src-vibe-around-town-site-truth-2026"],
    isDecisionChanging: true,
    verificationNote:
      "Verified in lib/dcc/siteTruth.ts (vibe-around-town, booking.authority: driver, takes_payment: true, last_verified 2026-08-24).",
  },
  {
    claimId: "claim-cruise-promenade-group-planning-referral",
    classification: "operator_published_fact",
    statement:
      "Cruise Promenade (cruisepromenade.com) is a shared private cruise-group planning property that refers travelers to GetYourGuide; excursion bookings and payments are finalized with the provider (takes_payment: false).",
    fieldsSupported: ["bookingDestinations", "comparisonValues"],
    sourceIds: ["src-cruise-promenade-site-truth-2026"],
    isDecisionChanging: true,
    verificationNote:
      "Verified in lib/dcc/siteTruth.ts (cruise-promenade, booking.authority: provider, takes_payment: false, last_verified 2026-11-13).",
  },
  {
    claimId: "claim-port-day-walkable-baseline",
    classification: "dcc_interpretation",
    statement:
      "When travelers want zero excursion commitment or minimal return-buffer risk, staying within the walkable cruise pier district requires no advance booking or reservation fee.",
    fieldsSupported: ["indicativePriceUsd", "tradeoffs"],
    sourceIds: ["src-dcc-port-driver-vs-bus-guide-2026"],
    isDecisionChanging: true,
    verificationNote:
      "Verified in src/data/pre-site-guides.ts (independent-cruise-port-driver-vs-bus-tour).",
  },
];

export const CRUISE_PORT_DRIVERS_QUESTIONS: QuestionDefinition[] = [
  {
    questionId: "portDayStyle",
    label: "1. What kind of cruise port-day structure fits your group?",
    helpText:
      "Compare requesting a private local driver for custom stops against coordinating a shared group excursion plan or staying walkable near the pier.",
    inputType: "select",
    requiredForPersonalizedVerdict: true,
    decisionImpactExplanation:
      "Routes between Vibe Around Town (private driver request marketplace), Cruise Promenade (shared group cruise workspace), and the walkable pier baseline.",
    drivenByClaimIds: [
      "claim-vibe-around-driver-acceptance-finality",
      "claim-cruise-promenade-group-planning-referral",
    ],
    options: [
      {
        value: "custom_pace_local_driver",
        label: "Private local driver for custom stops & flexible pacing",
        description:
          "Request a local driver on Vibe Around Town (vibearoundtown.com)",
      },
      {
        value: "shared_group_itinerary_and_excursions",
        label:
          "Shared cruise-group planning workspace & structured excursion referrals",
        description:
          "Coordinate multi-cabin port days on Cruise Promenade (cruisepromenade.com)",
      },
      {
        value: "walkable_pier_no_excursion",
        label: "Walkable port town exploration (no booked excursion or driver)",
        description: "Keep the port day unstructured and close to the ship",
      },
    ],
    defaultValue: CRUISE_PORT_DRIVERS_DEFAULT_EXAMPLE_INPUT.portDayStyle,
  },
  {
    questionId: "acceptsDriverAcceptanceFinality",
    label:
      "2. Are you comfortable with a driver-acceptance workflow (request is not final until the local driver accepts)?",
    helpText:
      "On Vibe Around Town, a reservation request is not final until the driver accepts.",
    inputType: "boolean",
    requiredForPersonalizedVerdict: true,
    decisionImpactExplanation:
      "Eliminates the Vibe Around Town driver-request lane if you require instant automated bus-ticket confirmation without waiting for driver acceptance.",
    drivenByClaimIds: ["claim-vibe-around-driver-acceptance-finality"],
    defaultValue:
      CRUISE_PORT_DRIVERS_DEFAULT_EXAMPLE_INPUT.acceptsDriverAcceptanceFinality,
  },
  {
    questionId: "travelDate",
    label: "3. Port call date (optional)",
    helpText: "Leave blank to view the default comparison scenario.",
    inputType: "date",
    requiredForPersonalizedVerdict: false,
    decisionImpactExplanation:
      "Marks the evaluation as a personalized date scenario.",
    drivenByClaimIds: ["claim-vibe-around-driver-acceptance-finality"],
    defaultValue: null,
  },
];

export const CRUISE_PORT_DRIVERS_COMPARISON_DIMENSIONS: ComparisonDimension[] =
  [
    {
      dimensionId: "bookingAuthority",
      label: "Booking & Acceptance Authority",
      description: "How reservations or referrals are finalized.",
    },
    {
      dimensionId: "pacingModel",
      label: "Port-Day Pacing",
      description:
        "Custom local driver vs. shared group excursion vs. walkable pier.",
    },
    {
      dimensionId: "paymentModel",
      label: "Payment Handling",
      description: "Verified payment boundary from siteTruth.ts.",
    },
  ];

export const CRUISE_PORT_DRIVERS_CANDIDATE_OPTIONS: CandidateOption[] = [
  {
    optionId: "port-driver-vibe-around-request",
    title:
      "Private Local Driver Request & Reservation Marketplace (Vibing Around Tour Co. / Vibe Around Town)",
    shortLabel: "Vibe Around Town (Local Driver)",
    optionKind: "owned_specialist_comparison",
    actualOperators: ["Independent Local Drivers via Vibing Around Tour Co."],
    islandsOrRegions: ["Cruise Port Destinations"],
    departureAreas: ["Designated Cruise Port Pickup Zones"],
    operatingMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    scheduleVerifiedThroughDate: "2026-08-24",
    vesselOrVehicleType:
      "Private local driver vehicle (requested and accepted per port day)",
    groupCapacityRange: {
      min: 1,
      max: 8,
      label: "Private small-group vehicle (driver-dependent)",
    },
    rideComfortLevel: "high_stability",
    viewingSpaceDescription:
      "Flexible private port-day touring with a local driver who adjusts stop duration and route pacing to your group.",
    durationMinutes: {
      activity: 240,
      checkInLead: 15,
      typicalTransferEachWay: 0,
      totalDockOrHotelRange: { min: 180, max: 360 },
      label: "Custom port-day window coordinated with the accepting driver",
    },
    minimumAgeYears: null,
    minimumAgeNote: "Confirm child-seat requirements with your driver prior to acceptance.",
    accessibilityProfile: {
      stepFreeWheelchairSupported: false,
      limitedMobilitySupported: true,
      walkingAndBoardingRequirement: "Private vehicle boarding at port pickup area.",
      confirmationStatus: "operator_confirmation_required",
      note: "Specify folding mobility aids in your driver reservation request before acceptance.",
    },
    transportationAvailability: {
      hotelPickupAvailable: true,
      cruisePortShuttleAvailable: true,
      selfDriveParkingNote: "Driver meets group at designated port pickup location.",
    },
    cancellationTerms:
      "A reservation request is not final until the driver accepts; the site may collect the published reservation fee.",
    whaleSightingOrReRidePolicy: "N/A — private local-driver marketplace.",
    indicativePriceUsd: {
      min: 0,
      max: 0,
      basisLabel:
        "Published reservation fee & driver rate on vibearoundtown.com (final upon driver acceptance)",
    },
    comparisonValues: {
      bookingAuthority:
        "Driver (reservation request is not final until the driver accepts)",
      pacingModel:
        "Custom stops, local food/neighborhood detours, and private group pacing",
      paymentModel:
        "Site may collect the published reservation fee; final upon driver acceptance",
    },
    tradeoffs: {
      strengths: [
        "Avoids 40-person coach crowds and rigid gift-shop stops so your group controls the port-day pace.",
        "Direct driver-request workflow on vibearoundtown.com.",
      ],
      limitations: [
        "A reservation request is not final until the driver accepts.",
        "Requires coordinating a clear ship-time return buffer directly with your driver.",
      ],
    },
    claimIds: ["claim-vibe-around-driver-acceptance-finality"],
    sourceIds: ["src-vibe-around-town-site-truth-2026"],
    bookingDestinations: [
      {
        destinationId: "dest-vibe-around-town-marketplace",
        optionId: "port-driver-vibe-around-request",
        sellerType: "dcc_owned_specialist",
        sellerName: "Vibing Around Tour Co.",
        actualOperatorName: "Accepting Local Driver on Vibe Around Town",
        label: "Request a Local Driver on Vibe Around Town",
        url: "https://vibearoundtown.com",
        supportedContextParams: ["src"],
        relationshipDisclosure:
          "Vibing Around Tour Co. (vibearoundtown.com) is a connected DCC portfolio marketplace where a reservation request is not final until the driver accepts. Commercial relationships have zero influence on ranking (commercialWeightApplied: 0).",
        isCommercialPartner: true,
        commissionInfluenceOnRanking: 0,
      },
    ],
  },
  {
    optionId: "port-driver-cruise-promenade-group",
    title:
      "Shared Cruise-Group Planning & Provider Excursion Referrals (Cruise Promenade)",
    shortLabel: "Cruise Promenade (Group Hub)",
    optionKind: "owned_specialist_comparison",
    actualOperators: [
      "Excursion Providers (via GetYourGuide referral from Cruise Promenade)",
    ],
    islandsOrRegions: ["Multi-Port Cruise Itineraries"],
    departureAreas: ["Cruise Port Excursion Meeting Points"],
    operatingMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    scheduleVerifiedThroughDate: "2026-09-10",
    vesselOrVehicleType:
      "Shared cruise-group planning workspace + provider excursion referrals",
    groupCapacityRange: {
      min: 2,
      max: 30,
      label: "Multi-cabin cruise groups and families",
    },
    rideComfortLevel: "high_stability",
    viewingSpaceDescription:
      "Shared group planning surface to align multiple cabins on port-day anchors before booking structured excursions with the provider.",
    durationMinutes: {
      activity: 240,
      checkInLead: 20,
      typicalTransferEachWay: 0,
      totalDockOrHotelRange: { min: 180, max: 360 },
      label: "Varies by provider excursion selected",
    },
    minimumAgeYears: null,
    minimumAgeNote: "Varies by excursion provider.",
    accessibilityProfile: {
      stepFreeWheelchairSupported: true,
      limitedMobilitySupported: true,
      walkingAndBoardingRequirement: "Varies by excursion provider.",
      confirmationStatus: "operator_confirmation_required",
      note: "Confirm excursion accessibility on the provider checkout page.",
    },
    transportationAvailability: {
      hotelPickupAvailable: false,
      cruisePortShuttleAvailable: true,
      selfDriveParkingNote: "Meets at port excursion zone.",
    },
    cancellationTerms:
      "Cruise Promenade refers travelers to GetYourGuide; excursion bookings, payments, and cancellation terms are finalized with the provider.",
    whaleSightingOrReRidePolicy: "N/A — group cruise planning and excursion referral.",
    indicativePriceUsd: {
      min: 0,
      max: 0,
      basisLabel:
        "Cruise Promenade takes no payment; excursion pricing finalized with provider",
    },
    comparisonValues: {
      bookingAuthority:
        "Provider (Cruise Promenade refers travelers to GetYourGuide)",
      pacingModel:
        "Shared group itinerary alignment + structured provider excursions",
      paymentModel:
        "takes_payment: false on Cruise Promenade; finalized with excursion provider",
    },
    tradeoffs: {
      strengths: [
        "Keeps multi-cabin cruise groups aligned on shared port-day anchors and split sub-group activities.",
        "Refers directly to structured provider excursions when a group prefers pre-packaged bus or boat tours over hiring a private driver.",
      ],
      limitations: [
        "Cruise Promenade does not take direct payment or operate vehicles; bookings are finalized with the excursion provider.",
      ],
    },
    claimIds: ["claim-cruise-promenade-group-planning-referral"],
    sourceIds: ["src-cruise-promenade-site-truth-2026"],
    bookingDestinations: [
      {
        destinationId: "dest-cruise-promenade-workspace",
        optionId: "port-driver-cruise-promenade-group",
        sellerType: "dcc_owned_specialist",
        sellerName: "Cruise Promenade",
        actualOperatorName: "Referred Excursion Provider",
        label: "Open Cruise Promenade Group Planning Workspace",
        url: "https://cruisepromenade.com",
        supportedContextParams: ["src"],
        relationshipDisclosure:
          "Cruise Promenade (cruisepromenade.com) is a connected DCC portfolio planning property that refers travelers to GetYourGuide, where bookings and payments are finalized with the provider (commercialWeightApplied: 0).",
        isCommercialPartner: true,
        commissionInfluenceOnRanking: 0,
      },
    ],
  },
  {
    optionId: "port-driver-walkable-pier-baseline",
    title:
      "Walkable Cruise Pier & Town Exploration (No Pre-Booked Excursion or Driver)",
    shortLabel: "Walkable Pier Day ($0 Baseline)",
    optionKind: "public_or_diy",
    actualOperators: ["Self-Guided Port Walk"],
    islandsOrRegions: ["Cruise Port Waterfront Districts"],
    departureAreas: ["Cruise Ship Gangway / Pier"],
    operatingMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    scheduleVerifiedThroughDate: "2026-10-18",
    vesselOrVehicleType: "Pedestrian port-town walk",
    groupCapacityRange: {
      min: 1,
      max: 20,
      label: "Any group size",
    },
    rideComfortLevel: "shore_stationary",
    viewingSpaceDescription:
      "Zero-commitment port day staying within walking distance of the ship.",
    durationMinutes: {
      activity: 120,
      checkInLead: 0,
      typicalTransferEachWay: 0,
      totalDockOrHotelRange: { min: 60, max: 240 },
      label: "Flexible self-paced walk near the ship",
    },
    minimumAgeYears: null,
    minimumAgeNote: "All ages.",
    accessibilityProfile: {
      stepFreeWheelchairSupported: true,
      limitedMobilitySupported: true,
      walkingAndBoardingRequirement: "Flat dock and waterfront sidewalks.",
      confirmationStatus: "confirmed_accessible",
      note: "Remains within paved cruise pier and downtown waterfront areas.",
    },
    transportationAvailability: {
      hotelPickupAvailable: false,
      cruisePortShuttleAvailable: false,
      selfDriveParkingNote: "Walk directly from the cruise pier.",
    },
    cancellationTerms: "No ticket or reservation required ($0).",
    whaleSightingOrReRidePolicy: "N/A — self-guided port walk.",
    indicativePriceUsd: {
      min: 0,
      max: 0,
      basisLabel: "$0 self-guided port walk",
    },
    comparisonValues: {
      bookingAuthority: "None ($0 no-purchase baseline)",
      pacingModel: "Unstructured walk within sight of the pier",
      paymentModel: "$0 out-of-pocket commitment",
    },
    tradeoffs: {
      strengths: [
        "Zero reservation fee, zero schedule risk, and easy return to the ship at any time.",
      ],
      limitations: [
        "Limited to the immediate port waterfront; does not reach inland attractions or scenic lookouts.",
      ],
    },
    claimIds: ["claim-port-day-walkable-baseline"],
    sourceIds: ["src-dcc-port-driver-vs-bus-guide-2026"],
    bookingDestinations: [
      {
        destinationId: "dest-port-driver-guide-baseline",
        optionId: "port-driver-walkable-pier-baseline",
        sellerType: "public_or_diy",
        sellerName: "Destination Command Center Guide",
        actualOperatorName: "Self-Guided",
        label: "Read Independent Driver vs. Bus Tour Port Guide",
        url: "https://destinationcommandcenter.com/guides/independent-cruise-port-driver-vs-bus-tour",
        supportedContextParams: [],
        relationshipDisclosure:
          "Non-commercial DCC research guide for self-guided port days (commercialWeightApplied: 0).",
        isCommercialPartner: false,
        commissionInfluenceOnRanking: 0,
      },
    ],
  },
];

export const CRUISE_PORT_DRIVERS_HARD_CONSTRAINT_RULES: HardConstraintRule<CruisePortPrivateDriversInput>[] =
  [
    {
      ruleId: "hc-vibe-around-driver-acceptance-required",
      label: "Driver Acceptance Finality Requirement",
      description:
        "On Vibe Around Town (vibearoundtown.com), a reservation request is not final until the driver accepts. Eliminates the driver-request lane if the traveler rejects the driver-acceptance workflow.",
      sourceIds: ["src-vibe-around-town-site-truth-2026"],
      evaluate: (option, input) => {
        if (
          option.optionId === "port-driver-vibe-around-request" &&
          !input.acceptsDriverAcceptanceFinality
        ) {
          return {
            passed: false,
            eliminationReason:
              "Vibe Around Town is a local-driver request and acceptance marketplace where a reservation request is not final until the driver accepts.",
            whatInputChangeWouldAlterResult:
              "Enable 'Accepts driver-acceptance workflow' to include Vibe Around Town local driver requests.",
          };
        }
        return { passed: true };
      },
    },
  ];

export const CRUISE_PORT_DRIVERS_PREFERENCE_RULES: PreferenceRule<CruisePortPrivateDriversInput>[] =
  [
    {
      ruleId: "pref-port-day-style-match",
      label: "Port-Day Style Alignment",
      maxPoints: 60,
      evaluate: (option, input) => {
        if (
          input.portDayStyle === "custom_pace_local_driver" &&
          option.optionId === "port-driver-vibe-around-request"
        ) {
          return {
            points: 60,
            reason:
              "Directly matches your preference for a custom-paced local driver via Vibe Around Town (vibearoundtown.com).",
          };
        }
        if (
          input.portDayStyle === "shared_group_itinerary_and_excursions" &&
          option.optionId === "port-driver-cruise-promenade-group"
        ) {
          return {
            points: 60,
            reason:
              "Directly matches your preference for shared cruise-group planning and structured excursion referrals via Cruise Promenade (cruisepromenade.com).",
          };
        }
        if (
          input.portDayStyle === "walkable_pier_no_excursion" &&
          option.optionId === "port-driver-walkable-pier-baseline"
        ) {
          return {
            points: 60,
            reason:
              "Directly matches your preference for an unstructured, zero-cost walkable pier day.",
          };
        }
        return {
          points: 20,
          reason: "Viable alternative port-day structure.",
        };
      },
    },
  ];

function computeCruisePortDriverTiming(
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
    returnBufferMinutes: 60,
    netSlackMinutes: null,
    summary: `${option.durationMinutes.label} (keep a 60+ min return buffer before ship all-aboard).`,
  };
}

export const CRUISE_PORT_PRIVATE_DRIVERS_DECISION_ENGINE: DecisionEngineDefinition<CruisePortPrivateDriversInput> =
  {
    engineId: "cruise-port-private-drivers",
    version: "1.0.0",
    slug: "vibe-around",
    canonicalPath: "/vibe-around",
    canonicalUrl: "https://destinationcommandcenter.com/vibe-around",
    title:
      "Cruise Port Private Drivers vs. Group Excursions Decision Engine",
    destinationName: "Cruise Port Destinations",
    categoryName: "Cruise Port Private Drivers & Group Planning",
    heroQuestion:
      "Should you request a private local port driver, coordinate structured group excursions, or stay walkable near the pier?",
    summaryDescription:
      "High-level portfolio router comparing Vibing Around Tour Co. / Vibe Around Town (vibearoundtown.com, where a reservation request is not final until the driver accepts) against shared group cruise planning on Cruise Promenade (cruisepromenade.com) and a $0 walkable pier day.",
    referenceGuide: {
      importantDecisionFactors: [
        {
          title:
            "Driver-Acceptance Finality on Vibe Around Town (vibearoundtown.com)",
          detail:
            "Vibing Around Tour Co. is a local-driver request, acceptance, and reservation marketplace (booking.authority: driver). A reservation request is not final until the driver accepts; the site may collect the published reservation fee.",
          sourceIds: ["src-vibe-around-town-site-truth-2026"],
        },
        {
          title:
            "Shared Cruise-Group Planning vs. Provider Excursion Checkout (cruisepromenade.com)",
          detail:
            "Cruise Promenade helps groups coordinate port-day plans and refers travelers to GetYourGuide, where excursion bookings and payments are finalized with the provider (takes_payment: false).",
          sourceIds: ["src-cruise-promenade-site-truth-2026"],
        },
      ],
      experienceAndVesselTypes: [
        {
          typeName:
            "Private Local Driver Request (Vibing Around Tour Co. / Vibe Around Town)",
          capacityAndStability: "Private local driver vehicle",
          bestFor:
            "Travelers wanting custom stops, local pace control, and no big-bus crowds",
          limitations:
            "Reservation request is not final until the driver accepts",
          sourceIds: ["src-vibe-around-town-site-truth-2026"],
        },
        {
          typeName:
            "Shared Group Cruise Plan & Excursion Referral (Cruise Promenade)",
          capacityAndStability: "Group planning hub + provider excursions",
          bestFor:
            "Multi-cabin cruise groups aligning shared anchors and structured tours",
          limitations:
            "Excursion bookings and payments are finalized with the provider",
          sourceIds: ["src-cruise-promenade-site-truth-2026"],
        },
        {
          typeName: "Walkable Pier Day ($0 No-Purchase Baseline)",
          capacityAndStability: "Pedestrian waterfront exploration",
          bestFor: "Short port windows or relaxed no-commitment days",
          limitations: "Does not reach inland sights beyond walking distance",
          sourceIds: ["src-dcc-port-driver-vs-bus-guide-2026"],
        },
      ],
      departureLocations: [
        {
          islandOrRegion: "Cruise Port Terminals",
          harborOrArea: "Independent Driver Pickup Zones & Excursion Piers",
          logisticsNote:
            "Always confirm the exact pier gate meeting point and maintain a conservative ship-time return buffer.",
          sourceIds: ["src-dcc-port-driver-vs-bus-guide-2026"],
        },
      ],
      commonTradeoffs: [
        {
          tradeoff:
            "Private Local Driver Flexibility vs. Big-Bus Excursion Autopilot",
          explanation:
            "A private local driver gives your group control over stops and timing once accepted, whereas a structured bus tour requires zero route decisions.",
        },
      ],
      operationalDependencies: [
        {
          dependency: "Driver Acceptance & Ship-Time Return Buffer",
          impact:
            "Because a Vibe Around Town reservation request is not final until the driver accepts, submit requests ahead of port call and lock in your return-to-pier time.",
          sourceIds: ["src-vibe-around-town-site-truth-2026"],
        },
      ],
      methodologySteps: [
        "Enforce the verified Vibe Around Town finality rule: a reservation request is not final until the driver accepts.",
        "Enforce the verified Cruise Promenade referral boundary: excursion bookings and payments are finalized with the provider.",
        "Always retain the $0 walkable pier baseline with zero commercial bias.",
      ],
    },
    questions: CRUISE_PORT_DRIVERS_QUESTIONS,
    answerSchema: CRUISE_PORT_DRIVERS_ANSWER_SCHEMA,
    defaultExampleInput: CRUISE_PORT_DRIVERS_DEFAULT_EXAMPLE_INPUT,
    comparisonDimensions: CRUISE_PORT_DRIVERS_COMPARISON_DIMENSIONS,
    candidateOptions: CRUISE_PORT_DRIVERS_CANDIDATE_OPTIONS,
    hardConstraintRules: CRUISE_PORT_DRIVERS_HARD_CONSTRAINT_RULES,
    preferenceRules: CRUISE_PORT_DRIVERS_PREFERENCE_RULES,
    evidenceClaims: CRUISE_PORT_DRIVERS_EVIDENCE_CLAIMS,
    sourceRecords: CRUISE_PORT_DRIVERS_SOURCE_RECORDS,
    computeTimingForOption: (opt) => computeCruisePortDriverTiming(opt),
    isExampleScenarioDetector: (rawInput, normalized) => {
      const isExample =
        rawInput === undefined ||
        rawInput === null ||
        normalized.travelDate === null;
      return {
        isExample,
        banner: isExample
          ? "Example Scenario Shown: Cruise port group comparing a private local driver request on Vibe Around Town against group excursion planning on Cruise Promenade and a walkable pier day."
          : null,
        missingInputFacts:
          normalized.travelDate === null
            ? [
                {
                  factId: "missing-port-driver-date",
                  optionId: null,
                  category: "missing_traveler_input",
                  summary: "Port call date not provided.",
                  impactOnDecision:
                    "Driver acceptance on vibearoundtown.com depends on local driver availability for your specific port date.",
                  sourceIds: ["src-vibe-around-town-site-truth-2026"],
                },
              ]
            : [],
      };
    },
    evaluate: (rawInput: unknown, options?: DecisionEvaluateOptions) =>
      evaluateDecisionEngine(
        CRUISE_PORT_PRIVATE_DRIVERS_DECISION_ENGINE,
        rawInput,
        options,
      ),
  };
