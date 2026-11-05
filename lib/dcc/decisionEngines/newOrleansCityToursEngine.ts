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

export interface NewOrleansCityToursInput {
  visitStage:
    | "first_hour_orientation"
    | "curated_city_or_history_tour"
    | "self_guided_neighborhood_walk";
  timeOfDayContext: "daytime_arrival" | "evening_or_after_dark";
  wantsBayouOrSwampHandoff: boolean;
  travelDate: string | null;
}

export const NOLA_CITY_TOURS_DEFAULT_EXAMPLE_INPUT: NewOrleansCityToursInput = {
  visitStage: "first_hour_orientation",
  timeOfDayContext: "daytime_arrival",
  wantsBayouOrSwampHandoff: false,
  travelDate: null,
};

const ymdRegex = /^\d{4}-\d{2}-\d{2}$/;

export const NOLA_CITY_TOURS_ANSWER_SCHEMA = z
  .object({
    visitStage: z
      .enum([
        "first_hour_orientation",
        "curated_city_or_history_tour",
        "self_guided_neighborhood_walk",
      ])
      .default(NOLA_CITY_TOURS_DEFAULT_EXAMPLE_INPUT.visitStage),
    timeOfDayContext: z
      .enum(["daytime_arrival", "evening_or_after_dark"])
      .default(NOLA_CITY_TOURS_DEFAULT_EXAMPLE_INPUT.timeOfDayContext),
    wantsBayouOrSwampHandoff: z
      .boolean()
      .default(NOLA_CITY_TOURS_DEFAULT_EXAMPLE_INPUT.wantsBayouOrSwampHandoff),
    travelDate: z
      .string()
      .regex(ymdRegex, "travelDate must be YYYY-MM-DD when provided")
      .nullable()
      .default(NOLA_CITY_TOURS_DEFAULT_EXAMPLE_INPUT.travelDate),
  })
  .strict();

export const NOLA_CITY_TOURS_SOURCE_RECORDS: SourceRecord[] = [
  {
    sourceId: "src-fq-orientation-site-truth-2026",
    sourceOrganization: "French Quarter Orientation (DCC Verified Site Truth)",
    sourceTitle:
      "French Quarter Orientation Property Truth — 30-Minute Current Orientation & Retired Legacy 45-Minute/$5 Identity",
    sourceUrl: "https://frenchquarterorientation.com",
    claimsSupported: [
      "claim-fq-orientation-30min-current",
      "claim-fq-orientation-separate-from-swamp",
    ],
    retrievedAt: "2026-08-24T00:00:00.000Z",
    verifiedAt: "2026-08-24T00:00:00.000Z",
    expiresAt: "2027-02-24T00:00:00.000Z",
    freshnessCategory: "operator_tariff_and_policy",
    status: "current",
  },
  {
    sourceId: "src-wno-tours-site-truth-2026",
    sourceOrganization: "Welcome to New Orleans Tours (DCC Verified Site Truth)",
    sourceTitle:
      "Welcome to New Orleans Tours — City, Walking & Cultural Recommendation Surface with Bayou Handoff",
    sourceUrl: "https://www.welcometoneworleanstours.com",
    claimsSupported: [
      "claim-wno-tours-provider-routing",
      "claim-fq-orientation-separate-from-swamp",
    ],
    retrievedAt: "2026-08-24T00:00:00.000Z",
    verifiedAt: "2026-08-24T00:00:00.000Z",
    expiresAt: "2027-02-24T00:00:00.000Z",
    freshnessCategory: "operator_tariff_and_policy",
    status: "current",
  },
  {
    sourceId: "src-norta-streetcar-and-fq-walk-2026",
    sourceOrganization: "New Orleans Regional Transit Authority (NORTA)",
    sourceTitle:
      "NORTA Historic Streetcar Single-Ride Fare ($1.25) & Self-Guided French Quarter Daytime Baseline",
    sourceUrl: "https://www.norta.com/ride-with-us/how-to-pay/fares",
    claimsSupported: ["claim-nola-rta-streetcar-and-self-guided"],
    retrievedAt: "2026-10-18T00:00:00.000Z",
    verifiedAt: "2026-10-18T00:00:00.000Z",
    expiresAt: "2027-04-18T00:00:00.000Z",
    freshnessCategory: "regulatory_annual",
    status: "current",
  },
];

export const NOLA_CITY_TOURS_EVIDENCE_CLAIMS: EvidenceClaim[] = [
  {
    claimId: "claim-fq-orientation-30min-current",
    classification: "operator_published_fact",
    statement:
      "French Quarter Orientation (frenchquarterorientation.com) is a dedicated 30-minute French Quarter orientation property; the older 45-minute/$5 identity is retired and must not be revived.",
    fieldsSupported: ["durationMinutes", "indicativePriceUsd"],
    sourceIds: ["src-fq-orientation-site-truth-2026"],
    isDecisionChanging: true,
    verificationNote:
      "Verified in lib/dcc/siteTruth.ts (french-quarter-orientation, last_verified 2026-08-24).",
  },
  {
    claimId: "claim-wno-tours-provider-routing",
    classification: "operator_published_fact",
    statement:
      "Welcome to New Orleans Tours (welcometoneworleanstours.com) recommends city, walking, and cultural experiences and routes travelers to verified tour providers (including Welcome to the Swamp for bayou excursions).",
    fieldsSupported: ["bookingDestinations", "comparisonValues"],
    sourceIds: ["src-wno-tours-site-truth-2026"],
    isDecisionChanging: true,
    verificationNote:
      "Verified in lib/dcc/siteTruth.ts (wno-tours, booking.authority: provider, last_verified 2026-08-24).",
  },
  {
    claimId: "claim-fq-orientation-separate-from-swamp",
    classification: "operator_published_fact",
    statement:
      "French Quarter Orientation (frenchquarterorientation.com) is a separate property from Welcome to the Swamp (welcometotheswamp.com) and must never be represented as the swamp tour product.",
    fieldsSupported: ["bookingDestinations", "tradeoffs"],
    sourceIds: [
      "src-fq-orientation-site-truth-2026",
      "src-wno-tours-site-truth-2026",
    ],
    isDecisionChanging: true,
    verificationNote:
      "Verified in lib/dcc/siteTruth.ts (welcome-to-the-swamp & french-quarter-orientation).",
  },
  {
    claimId: "claim-nola-rta-streetcar-and-self-guided",
    classification: "official_rule",
    statement:
      "Self-guided daytime exploration of Jackson Square and Royal Street costs $0, and the New Orleans RTA historic streetcar costs $1.25 per single ride; after dark, structured guided walking tours reduce block-by-block navigation friction.",
    fieldsSupported: ["indicativePriceUsd", "tradeoffs"],
    sourceIds: ["src-norta-streetcar-and-fq-walk-2026"],
    isDecisionChanging: true,
    verificationNote:
      "Verified in src/data/pre-site-guides.ts (first-time-in-the-french-quarter-what-to-do-first & french-quarter-after-dark-solo-or-group).",
  },
];

export const NOLA_CITY_TOURS_QUESTIONS: QuestionDefinition[] = [
  {
    questionId: "visitStage",
    label: "1. What kind of New Orleans city experience are you planning right now?",
    helpText:
      "Separates a quick 30-minute first-hour French Quarter orientation from curated city/history tours or a self-guided walk.",
    inputType: "select",
    requiredForPersonalizedVerdict: true,
    decisionImpactExplanation:
      "Routes newly arrived visitors to the 30-minute French Quarter Orientation property vs. full city/walking tour comparison on Welcome to New Orleans Tours.",
    drivenByClaimIds: [
      "claim-fq-orientation-30min-current",
      "claim-wno-tours-provider-routing",
    ],
    options: [
      {
        value: "first_hour_orientation",
        label: "Quick 30-minute first-hour French Quarter orientation",
        description:
          "Get your bearings, layout context, and immediate neighborhood rhythm before booking longer tours",
      },
      {
        value: "curated_city_or_history_tour",
        label: "Curated city, walking, history, food, or evening ghost tour",
        description:
          "Compare structured guided walking tours, neighborhood buses, or river cruises via Welcome to New Orleans Tours",
      },
      {
        value: "self_guided_neighborhood_walk",
        label: "Unstructured self-guided walk & $1.25 RTA streetcar",
        description:
          "Keep the day open with Jackson Square, Royal Street, and public streetcar transit",
      },
    ],
    defaultValue: NOLA_CITY_TOURS_DEFAULT_EXAMPLE_INPUT.visitStage,
  },
  {
    questionId: "timeOfDayContext",
    label: "2. Are you planning for daytime arrival or evening / after dark?",
    helpText:
      "In the French Quarter, daytime favors open wandering or quick orientation, while after-dark visits benefit from a structured group host.",
    inputType: "select",
    requiredForPersonalizedVerdict: true,
    decisionImpactExplanation:
      "Eliminates unguided wandering when travelers specifically want structured after-dark routing.",
    drivenByClaimIds: ["claim-nola-rta-streetcar-and-self-guided"],
    options: [
      {
        value: "daytime_arrival",
        label: "Daytime (morning or afternoon)",
      },
      {
        value: "evening_or_after_dark",
        label: "Evening / after dark",
      },
    ],
    defaultValue: NOLA_CITY_TOURS_DEFAULT_EXAMPLE_INPUT.timeOfDayContext,
  },
  {
    questionId: "wantsBayouOrSwampHandoff",
    label: "3. Do you also want to pair your city plan with a bayou / swamp excursion?",
    helpText:
      "French Quarter Orientation is strictly a 30-minute Quarter orientation; Welcome to New Orleans Tours provides a natural handoff to Welcome to the Swamp.",
    inputType: "boolean",
    requiredForPersonalizedVerdict: false,
    decisionImpactExplanation:
      "Prioritizes the Welcome to New Orleans Tours + Welcome to the Swamp routing lane when a bayou extension is planned.",
    drivenByClaimIds: ["claim-fq-orientation-separate-from-swamp"],
    defaultValue: NOLA_CITY_TOURS_DEFAULT_EXAMPLE_INPUT.wantsBayouOrSwampHandoff,
  },
  {
    questionId: "travelDate",
    label: "4. Planned visit date (optional)",
    helpText: "Leave blank to explore the default comparison scenario.",
    inputType: "date",
    requiredForPersonalizedVerdict: false,
    decisionImpactExplanation:
      "Marks the evaluation as a personalized date scenario.",
    drivenByClaimIds: ["claim-wno-tours-provider-routing"],
    defaultValue: null,
  },
];

export const NOLA_CITY_TOURS_COMPARISON_DIMENSIONS: ComparisonDimension[] = [
  {
    dimensionId: "laneRole",
    label: "Portfolio Role",
    description: "How this option fits in the New Orleans decision flow.",
  },
  {
    dimensionId: "verifiedDuration",
    label: "Verified Duration",
    description: "Published duration from verified site truth.",
  },
  {
    dimensionId: "bookingAuthority",
    label: "Booking Authority",
    description: "Where booking or orientation details are finalized.",
  },
];

export const NOLA_CITY_TOURS_CANDIDATE_OPTIONS: CandidateOption[] = [
  {
    optionId: "nola-city-fq-orientation-30min",
    title:
      "30-Minute First-Hour French Quarter Orientation (French Quarter Orientation)",
    shortLabel: "30-Min French Quarter Orientation",
    optionKind: "owned_specialist_comparison",
    actualOperators: ["French Quarter Orientation"],
    islandsOrRegions: ["New Orleans", "French Quarter"],
    departureAreas: ["French Quarter (New Orleans, LA)"],
    operatingMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    scheduleVerifiedThroughDate: "2026-08-24",
    vesselOrVehicleType: "30-minute neighborhood orientation walk/briefing",
    groupCapacityRange: {
      min: 1,
      max: 20,
      label: "First-hour arrival orientation",
    },
    rideComfortLevel: "shore_stationary",
    viewingSpaceDescription:
      "Focused 30-minute French Quarter orientation covering block rhythm, layout, and how to sequence the rest of your stay.",
    durationMinutes: {
      activity: 30,
      checkInLead: 10,
      typicalTransferEachWay: 0,
      totalDockOrHotelRange: { min: 30, max: 45 },
      label: "30 minutes (verified current duration; legacy 45-min/$5 identity retired)",
    },
    minimumAgeYears: null,
    minimumAgeNote: "Confirm current session details on frenchquarterorientation.com.",
    accessibilityProfile: {
      stepFreeWheelchairSupported: true,
      limitedMobilitySupported: true,
      walkingAndBoardingRequirement: "French Quarter sidewalk pace for 30 minutes.",
      confirmationStatus: "operator_confirmation_required",
      note: "Confirm current meeting point and route accessibility on frenchquarterorientation.com.",
    },
    transportationAvailability: {
      hotelPickupAvailable: false,
      cruisePortShuttleAvailable: false,
      selfDriveParkingNote: "Meet directly in the French Quarter.",
    },
    cancellationTerms:
      "See frenchquarterorientation.com for current session terms (legacy 45-minute/$5 identity is retired).",
    whaleSightingOrReRidePolicy: "N/A — 30-minute neighborhood orientation.",
    indicativePriceUsd: {
      min: 0,
      max: 0,
      basisLabel:
        "See frenchquarterorientation.com (current 30-minute orientation; legacy $5/45-min identity is retired)",
    },
    comparisonValues: {
      laneRole: "30-minute first-hour French Quarter orientation",
      verifiedDuration: "30 minutes (legacy 45-minute/$5 identity retired)",
      bookingAuthority: "French Quarter Orientation (frenchquarterorientation.com)",
    },
    tradeoffs: {
      strengths: [
        "Fast 30-minute orientation so first-time visitors understand French Quarter block changes before spending money on full tours.",
        "Kept strictly separate from swamp/bayou tour products so expectations stay clear.",
      ],
      limitations: [
        "Strictly a 30-minute French Quarter orientation—not a multi-hour city bus tour, river cruise, or swamp tour.",
      ],
    },
    claimIds: [
      "claim-fq-orientation-30min-current",
      "claim-fq-orientation-separate-from-swamp",
    ],
    sourceIds: ["src-fq-orientation-site-truth-2026"],
    bookingDestinations: [
      {
        destinationId: "dest-fq-orientation-specialist",
        optionId: "nola-city-fq-orientation-30min",
        sellerType: "dcc_owned_specialist",
        sellerName: "French Quarter Orientation",
        actualOperatorName: "French Quarter Orientation",
        label: "Open French Quarter Orientation (30-Minute Orientation)",
        url: "https://frenchquarterorientation.com",
        supportedContextParams: ["src"],
        relationshipDisclosure:
          "French Quarter Orientation (frenchquarterorientation.com) is a connected DCC portfolio property offering a 30-minute orientation (the legacy 45-minute/$5 identity is retired). Commercial relationships have zero influence on ranking (commercialWeightApplied: 0).",
        isCommercialPartner: true,
        commissionInfluenceOnRanking: 0,
      },
    ],
  },
  {
    optionId: "nola-city-wno-guided-tours",
    title:
      "Curated New Orleans City, Walking & Cultural Tours (Welcome to New Orleans Tours)",
    shortLabel: "Welcome to New Orleans Tours Hub",
    optionKind: "owned_specialist_comparison",
    actualOperators: [
      "Verified New Orleans Tour Providers via Welcome to New Orleans Tours",
    ],
    islandsOrRegions: ["New Orleans", "French Quarter", "Garden District"],
    departureAreas: ["French Quarter & Central New Orleans Meeting Points"],
    operatingMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    scheduleVerifiedThroughDate: "2026-08-24",
    vesselOrVehicleType:
      "Guided walking tours, neighborhood sightseeing, and bayou handoff routing",
    groupCapacityRange: {
      min: 1,
      max: 30,
      label: "Individual and group guided tour departures",
    },
    rideComfortLevel: "shore_stationary",
    viewingSpaceDescription:
      "Curated New Orleans walking, history, architecture, evening ghost/voodoo, and cultural experiences with natural bayou/swamp tour handoff.",
    durationMinutes: {
      activity: 120,
      checkInLead: 15,
      typicalTransferEachWay: 0,
      totalDockOrHotelRange: { min: 90, max: 240 },
      label: "Varies by selected walking or city tour provider",
    },
    minimumAgeYears: null,
    minimumAgeNote: "Varies by tour provider; confirm on welcometoneworleanstours.com.",
    accessibilityProfile: {
      stepFreeWheelchairSupported: true,
      limitedMobilitySupported: true,
      walkingAndBoardingRequirement:
        "Varies between French Quarter walking routes and seated sightseeing.",
      confirmationStatus: "operator_confirmation_required",
      note: "Confirm sidewalk, step, or vehicle accessibility with the selected tour provider.",
    },
    transportationAvailability: {
      hotelPickupAvailable: false,
      cruisePortShuttleAvailable: false,
      selfDriveParkingNote:
        "Most walking tours meet at designated French Quarter landmarks.",
    },
    cancellationTerms:
      "Booking and cancellation terms are finalized with the verified tour provider selected from Welcome to New Orleans Tours.",
    whaleSightingOrReRidePolicy: "N/A — urban and cultural tour routing.",
    indicativePriceUsd: {
      min: 0,
      max: 0,
      basisLabel:
        "Provider-published rates on welcometoneworleanstours.com (booking authority: provider)",
    },
    comparisonValues: {
      laneRole:
        "Curated city, walking, and cultural tour recommendation surface + bayou handoff",
      verifiedDuration: "Provider-dependent (walking, city, or evening tours)",
      bookingAuthority:
        "Provider (Welcome to New Orleans Tours routes to verified tour providers)",
    },
    tradeoffs: {
      strengths: [
        "Dedicated New Orleans specialist surface comparing French Quarter walking tours, cultural experiences, and evening group walks.",
        "Includes direct bayou/swamp handoff routing to Welcome to the Swamp (welcometotheswamp.com) when pairing city and marsh days.",
      ],
      limitations: [
        "Welcome to New Orleans Tours is a recommendation surface; final booking and payment occur with the verified tour provider.",
      ],
    },
    claimIds: [
      "claim-wno-tours-provider-routing",
      "claim-fq-orientation-separate-from-swamp",
    ],
    sourceIds: ["src-wno-tours-site-truth-2026"],
    bookingDestinations: [
      {
        destinationId: "dest-wno-tours-specialist",
        optionId: "nola-city-wno-guided-tours",
        sellerType: "dcc_owned_specialist",
        sellerName: "Welcome to New Orleans Tours",
        actualOperatorName: "Verified New Orleans Tour Providers",
        label: "Compare City & Walking Tours on Welcome to New Orleans Tours",
        url: "https://www.welcometoneworleanstours.com",
        supportedContextParams: ["src"],
        relationshipDisclosure:
          "Welcome to New Orleans Tours (welcometoneworleanstours.com) is a connected DCC portfolio property that routes travelers to verified tour providers. Commercial relationships have zero influence on ranking (commercialWeightApplied: 0).",
        isCommercialPartner: true,
        commissionInfluenceOnRanking: 0,
      },
      {
        destinationId: "dest-wno-swamp-handoff",
        optionId: "nola-city-wno-guided-tours",
        sellerType: "dcc_owned_specialist",
        sellerName: "Welcome to the Swamp",
        actualOperatorName: "New Orleans Swamp Tour Operators",
        label: "Pair with Bayou / Swamp Tours on Welcome to the Swamp",
        url: "https://welcometotheswamp.com",
        supportedContextParams: ["src"],
        relationshipDisclosure:
          "Welcome to the Swamp (welcometotheswamp.com) is a connected DCC specialist property for bayou and swamp tour routing. Commercial relationships have zero influence on ranking (commercialWeightApplied: 0).",
        isCommercialPartner: true,
        commissionInfluenceOnRanking: 0,
      },
    ],
  },
  {
    optionId: "nola-city-self-guided-streetcar",
    title:
      "Self-Guided Jackson Square Walk & $1.25 RTA Historic Streetcar (No-Purchase / Public Baseline)",
    shortLabel: "Self-Guided Walk & $1.25 Streetcar",
    optionKind: "public_or_diy",
    actualOperators: [
      "Self-Guided / New Orleans Regional Transit Authority (NORTA)",
    ],
    islandsOrRegions: ["New Orleans", "French Quarter", "Garden District"],
    departureAreas: ["Jackson Square, Canal Street & St. Charles Avenue"],
    operatingMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    scheduleVerifiedThroughDate: "2026-10-18",
    vesselOrVehicleType: "Pedestrian walk + NORTA historic streetcar ($1.25)",
    groupCapacityRange: {
      min: 1,
      max: 20,
      label: "Independent walk and public streetcar",
    },
    rideComfortLevel: "shore_stationary",
    viewingSpaceDescription:
      "Daytime self-guided loop through Jackson Square, St. Louis Cathedral exterior, Royal Street galleries, and the $1.25 RTA streetcar.",
    durationMinutes: {
      activity: 90,
      checkInLead: 0,
      typicalTransferEachWay: 0,
      totalDockOrHotelRange: { min: 60, max: 180 },
      label: "Flexible self-paced daytime walk",
    },
    minimumAgeYears: null,
    minimumAgeNote: "All ages.",
    accessibilityProfile: {
      stepFreeWheelchairSupported: true,
      limitedMobilitySupported: true,
      walkingAndBoardingRequirement:
        "Historic French Quarter slates/curbs; check NORTA streetcar line accessibility.",
      confirmationStatus: "operator_confirmation_required",
      note: "Check NORTA line status for wheelchair lift availability on historic vs. Riverfront streetcars.",
    },
    transportationAvailability: {
      hotelPickupAvailable: false,
      cruisePortShuttleAvailable: false,
      selfDriveParkingNote: "Walk from French Quarter/CBD hotels or ride NORTA.",
    },
    cancellationTerms: "No ticket commitment ($0 walk / $1.25 single streetcar fare).",
    whaleSightingOrReRidePolicy: "N/A — public/self-guided baseline.",
    indicativePriceUsd: {
      min: 0,
      max: 2,
      basisLabel: "$0 self-guided walk / $1.25 NORTA single streetcar fare",
    },
    comparisonValues: {
      laneRole: "Public / no-purchase daytime baseline",
      verifiedDuration: "Flexible self-paced",
      bookingAuthority: "None ($0 walk / $1.25 public transit)",
    },
    tradeoffs: {
      strengths: [
        "Zero reservation commitment and $0–$1.25 out-of-pocket cost.",
        "Ideal when you want an unstructured daytime coffee walk around Jackson Square and Royal Street.",
      ],
      limitations: [
        "No historical narration or curated route pacing.",
        "After dark in the French Quarter, wandering unguided increases block-by-block navigation friction compared with a hosted walking group.",
      ],
    },
    claimIds: ["claim-nola-rta-streetcar-and-self-guided"],
    sourceIds: ["src-norta-streetcar-and-fq-walk-2026"],
    bookingDestinations: [
      {
        destinationId: "dest-norta-public-fares",
        optionId: "nola-city-self-guided-streetcar",
        sellerType: "public_or_diy",
        sellerName: "New Orleans Regional Transit Authority (NORTA)",
        actualOperatorName: "New Orleans Regional Transit Authority",
        label: "View NORTA $1.25 Streetcar Fares & Maps",
        url: "https://www.norta.com/ride-with-us/how-to-pay/fares",
        supportedContextParams: [],
        relationshipDisclosure:
          "Public transit link provided as a neutral non-commercial baseline (commercialWeightApplied: 0).",
        isCommercialPartner: false,
        commissionInfluenceOnRanking: 0,
      },
    ],
  },
];

export const NOLA_CITY_TOURS_HARD_CONSTRAINT_RULES: HardConstraintRule<NewOrleansCityToursInput>[] =
  [
    {
      ruleId: "hc-fq-orientation-30min-scope",
      label: "30-Minute Orientation Scope Boundary",
      description:
        "French Quarter Orientation is strictly a 30-minute orientation property (legacy 45-min/$5 retired) and is eliminated when the traveler specifically requests a full curated multi-hour city/history tour in this slot.",
      sourceIds: ["src-fq-orientation-site-truth-2026"],
      evaluate: (option, input) => {
        if (
          option.optionId === "nola-city-fq-orientation-30min" &&
          input.visitStage === "curated_city_or_history_tour"
        ) {
          return {
            passed: false,
            eliminationReason:
              "French Quarter Orientation (frenchquarterorientation.com) is strictly a 30-minute neighborhood orientation property (legacy 45-minute/$5 identity retired), not a full multi-hour city or history tour.",
            whatInputChangeWouldAlterResult:
              "Switch visit stage to 'Quick 30-minute first-hour French Quarter orientation' if you want a brief arrival briefing first.",
          };
        }
        return { passed: true };
      },
    },
    {
      ruleId: "hc-after-dark-structured-routing",
      label: "After-Dark Structured Group vs. Unguided Walk",
      description:
        "Eliminates the unguided daytime streetcar/walk baseline when the traveler is planning an evening/after-dark structured tour.",
      sourceIds: ["src-norta-streetcar-and-fq-walk-2026"],
      evaluate: (option, input) => {
        if (
          option.optionId === "nola-city-self-guided-streetcar" &&
          input.timeOfDayContext === "evening_or_after_dark" &&
          input.visitStage === "curated_city_or_history_tour"
        ) {
          return {
            passed: false,
            eliminationReason:
              "For evening/after-dark curated tour plans, unguided wandering is eliminated in favor of structured group tours on Welcome to New Orleans Tours.",
            whatInputChangeWouldAlterResult:
              "Select 'Daytime' or 'Unstructured self-guided walk' if you prefer an unguided walk.",
          };
        }
        return { passed: true };
      },
    },
  ];

export const NOLA_CITY_TOURS_PREFERENCE_RULES: PreferenceRule<NewOrleansCityToursInput>[] =
  [
    {
      ruleId: "pref-visit-stage-alignment",
      label: "Visit Stage Alignment",
      maxPoints: 50,
      evaluate: (option, input) => {
        if (
          input.visitStage === "first_hour_orientation" &&
          option.optionId === "nola-city-fq-orientation-30min"
        ) {
          return {
            points: 50,
            reason:
              "Directly matches the 30-minute first-hour French Quarter orientation property (frenchquarterorientation.com).",
          };
        }
        if (
          input.visitStage === "curated_city_or_history_tour" &&
          option.optionId === "nola-city-wno-guided-tours"
        ) {
          return {
            points: 50,
            reason:
              "Routes directly to Welcome to New Orleans Tours (welcometoneworleanstours.com) to compare verified walking, history, and cultural providers.",
          };
        }
        if (
          input.visitStage === "self_guided_neighborhood_walk" &&
          option.optionId === "nola-city-self-guided-streetcar"
        ) {
          return {
            points: 50,
            reason:
              "Matches the $0 Jackson Square walk and $1.25 RTA historic streetcar baseline.",
          };
        }
        return {
          points: 20,
          reason: "Viable alternative lane for New Orleans neighborhood planning.",
        };
      },
    },
    {
      ruleId: "pref-bayou-swamp-handoff",
      label: "Natural Bayou / Swamp Tour Handoff",
      maxPoints: 30,
      evaluate: (option, input) => {
        if (!input.wantsBayouOrSwampHandoff) {
          return {
            points: 15,
            reason: "No bayou/swamp extension requested for this slot.",
          };
        }
        if (option.optionId === "nola-city-wno-guided-tours") {
          return {
            points: 30,
            reason:
              "Welcome to New Orleans Tours includes a verified natural handoff to Welcome to the Swamp (welcometotheswamp.com).",
          };
        }
        return {
          points: 5,
          reason:
            "French Quarter Orientation is a separate 30-minute orientation property and must not be conflated with Welcome to the Swamp.",
        };
      },
    },
  ];

function computeNolaCityTiming(
  option: CandidateOption,
): TimingCalculationResult {
  const checkIn = option.durationMinutes.checkInLead;
  const transfer = option.durationMinutes.typicalTransferEachWay * 2;
  const activity = option.durationMinutes.activity;
  const requiredTotal = checkIn + transfer + activity;
  return {
    availableWindowMinutes: null,
    requiredTotalMinutes: requiredTotal,
    checkInLeadMinutes: checkIn,
    transferMinutesRoundTrip: transfer,
    activityMinutes: activity,
    returnBufferMinutes: 0,
    netSlackMinutes: null,
    summary: `${option.durationMinutes.label} (${requiredTotal} min total including ${checkIn} min lead time).`,
  };
}

export const NOLA_CITY_TOURS_DECISION_ENGINE: DecisionEngineDefinition<NewOrleansCityToursInput> =
  {
    engineId: "new-orleans-city-tours",
    version: "1.0.0",
    slug: "new-orleans/tours",
    canonicalPath: "/new-orleans/tours",
    canonicalUrl: "https://destinationcommandcenter.com/new-orleans/tours",
    title:
      "New Orleans City Tours & French Quarter Orientation Decision Engine",
    destinationName: "New Orleans, Louisiana",
    categoryName: "City Tours & French Quarter Orientation",
    heroQuestion:
      "Should you start with a 30-minute French Quarter orientation, book a curated walking/city tour, or explore by $1.25 streetcar?",
    summaryDescription:
      "High-level portfolio router separating the 30-minute French Quarter Orientation property (frenchquarterorientation.com) from full guided tour comparison on Welcome to New Orleans Tours (welcometoneworleanstours.com), bayou handoffs to Welcome to the Swamp (welcometotheswamp.com), and the $0–$1.25 self-guided baseline.",
    referenceGuide: {
      importantDecisionFactors: [
        {
          title:
            "30-Minute First-Hour Orientation vs. Full Guided Walking Tours",
          detail:
            "French Quarter Orientation (frenchquarterorientation.com) is a dedicated 30-minute orientation property (the older 45-minute/$5 identity is retired). Welcome to New Orleans Tours (welcometoneworleanstours.com) covers full guided walking, history, and cultural tours.",
          sourceIds: [
            "src-fq-orientation-site-truth-2026",
            "src-wno-tours-site-truth-2026",
          ],
        },
        {
          title:
            "Strict Separation Between French Quarter Orientation and Welcome to the Swamp",
          detail:
            "French Quarter Orientation is a separate property and is never represented as the swamp tour product; travelers pairing city tours with bayou excursions route through Welcome to the Swamp (welcometotheswamp.com).",
          sourceIds: [
            "src-fq-orientation-site-truth-2026",
            "src-wno-tours-site-truth-2026",
          ],
        },
      ],
      experienceAndVesselTypes: [
        {
          typeName: "30-Minute French Quarter Orientation",
          capacityAndStability: "30-minute neighborhood briefing",
          bestFor:
            "First-hour arrivals who want layout context before booking longer tours",
          limitations:
            "Strictly 30 minutes; not a full multi-hour city tour or swamp excursion",
          sourceIds: ["src-fq-orientation-site-truth-2026"],
        },
        {
          typeName:
            "Curated Walking & City Tours (Welcome to New Orleans Tours)",
          capacityAndStability:
            "Provider-operated walking, neighborhood, and cultural tours",
          bestFor:
            "Visitors comparing history, food, architecture, or evening group walks with optional swamp handoff",
          limitations:
            "Final booking and payment occur with the verified tour provider",
          sourceIds: ["src-wno-tours-site-truth-2026"],
        },
        {
          typeName: "Self-Guided Walk & $1.25 NORTA Streetcar",
          capacityAndStability: "Pedestrian walk + public streetcar",
          bestFor:
            "Daytime visitors keeping their schedule unstructured at $0–$1.25",
          limitations: "No guide narration; less structured after dark",
          sourceIds: ["src-norta-streetcar-and-fq-walk-2026"],
        },
      ],
      departureLocations: [
        {
          islandOrRegion: "French Quarter & Central New Orleans",
          harborOrArea: "Jackson Square, Royal Street & Canal Street",
          logisticsNote:
            "Walkable from French Quarter and CBD hotels or accessible via the $1.25 NORTA streetcar.",
          sourceIds: ["src-norta-streetcar-and-fq-walk-2026"],
        },
      ],
      commonTradeoffs: [
        {
          tradeoff:
            "30-Minute Orientation vs. Immediate Multi-Hour Guided Tour",
          explanation:
            "Taking a 30-minute orientation first prevents overbooking back-to-back overlapping walking routes in the same blocks.",
        },
      ],
      operationalDependencies: [
        {
          dependency: "Daytime vs. After-Dark Street Rhythm",
          impact:
            "Daytime favors self-guided coffee walks or a 30-minute orientation; after dark favors structured group walking routes.",
          sourceIds: ["src-norta-streetcar-and-fq-walk-2026"],
        },
      ],
      methodologySteps: [
        "Enforce the verified 30-minute boundary for French Quarter Orientation (with the legacy 45-minute/$5 identity retired).",
        "Separate city/walking tour routing (Welcome to New Orleans Tours) from swamp/bayou routing (Welcome to the Swamp).",
        "Always retain the $0 Jackson Square walk / $1.25 NORTA streetcar public baseline with zero commercial bias.",
      ],
    },
    questions: NOLA_CITY_TOURS_QUESTIONS,
    answerSchema: NOLA_CITY_TOURS_ANSWER_SCHEMA,
    defaultExampleInput: NOLA_CITY_TOURS_DEFAULT_EXAMPLE_INPUT,
    comparisonDimensions: NOLA_CITY_TOURS_COMPARISON_DIMENSIONS,
    candidateOptions: NOLA_CITY_TOURS_CANDIDATE_OPTIONS,
    hardConstraintRules: NOLA_CITY_TOURS_HARD_CONSTRAINT_RULES,
    preferenceRules: NOLA_CITY_TOURS_PREFERENCE_RULES,
    evidenceClaims: NOLA_CITY_TOURS_EVIDENCE_CLAIMS,
    sourceRecords: NOLA_CITY_TOURS_SOURCE_RECORDS,
    computeTimingForOption: (opt) => computeNolaCityTiming(opt),
    isExampleScenarioDetector: (rawInput, normalized) => {
      const isExample =
        rawInput === undefined ||
        rawInput === null ||
        normalized.travelDate === null;
      return {
        isExample,
        banner: isExample
          ? "Example Scenario Shown: Daytime arrival in the French Quarter comparing the 30-minute French Quarter Orientation against curated tours on Welcome to New Orleans Tours and the $1.25 RTA streetcar."
          : null,
        missingInputFacts:
          normalized.travelDate === null
            ? [
                {
                  factId: "missing-nola-city-visit-date",
                  optionId: null,
                  category: "missing_traveler_input",
                  summary: "Visit date not provided.",
                  impactOnDecision:
                    "Specific departure times on frenchquarterorientation.com and welcometoneworleanstours.com require confirming your visit date.",
                  sourceIds: [
                    "src-fq-orientation-site-truth-2026",
                    "src-wno-tours-site-truth-2026",
                  ],
                },
              ]
            : [],
      };
    },
    evaluate: (rawInput: unknown, options?: DecisionEvaluateOptions) =>
      evaluateDecisionEngine(NOLA_CITY_TOURS_DECISION_ENGINE, rawInput, options),
  };
