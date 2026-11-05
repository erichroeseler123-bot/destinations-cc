import { z } from "zod";
import { evaluateDecisionEngine } from "@/lib/dcc/decisionEngines/evaluator";
import type {
  BookingDestination,
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

export interface AlaskaShoreExcursionsInput {
  portOfCall: "juneau" | "skagway" | "ketchikan";
  excursionFocus:
    | "port_signature_shore_excursion"
    | "juneau_specialist_flightseeing"
    | "walkable_port_town_backup";
  portWindowHours: number;
  travelDate: string | null;
}

export const ALASKA_SHORE_EXCURSIONS_DEFAULT_EXAMPLE_INPUT: AlaskaShoreExcursionsInput =
  {
    portOfCall: "juneau",
    excursionFocus: "port_signature_shore_excursion",
    portWindowHours: 8,
    travelDate: null,
  };

const ymdRegex = /^\d{4}-\d{2}-\d{2}$/;

export const ALASKA_SHORE_EXCURSIONS_ANSWER_SCHEMA = z
  .object({
    portOfCall: z
      .enum(["juneau", "skagway", "ketchikan"])
      .default(ALASKA_SHORE_EXCURSIONS_DEFAULT_EXAMPLE_INPUT.portOfCall),
    excursionFocus: z
      .enum([
        "port_signature_shore_excursion",
        "juneau_specialist_flightseeing",
        "walkable_port_town_backup",
      ])
      .default(ALASKA_SHORE_EXCURSIONS_DEFAULT_EXAMPLE_INPUT.excursionFocus),
    portWindowHours: z
      .number()
      .min(3)
      .max(14)
      .default(ALASKA_SHORE_EXCURSIONS_DEFAULT_EXAMPLE_INPUT.portWindowHours),
    travelDate: z
      .string()
      .regex(ymdRegex, "travelDate must be YYYY-MM-DD when provided")
      .nullable()
      .default(ALASKA_SHORE_EXCURSIONS_DEFAULT_EXAMPLE_INPUT.travelDate),
  })
  .strict();

export const ALASKA_SHORE_EXCURSIONS_SOURCE_RECORDS: SourceRecord[] = [
  {
    sourceId: "src-lfse-site-truth-2026",
    sourceOrganization:
      "Last Frontier Shore Excursions (DCC Verified Site Truth)",
    sourceTitle:
      "Last Frontier Shore Excursions — Alaska Cruise-Port Decision & Provider-Handoff Property (Juneau, Skagway, Ketchikan)",
    sourceUrl: "https://www.lastfrontiershoreexcursions.com",
    claimsSupported: [
      "claim-lfse-multi-port-provider-routing",
      "claim-alaska-one-anchor-per-port-rule",
    ],
    retrievedAt: "2026-08-24T00:00:00.000Z",
    verifiedAt: "2026-08-24T00:00:00.000Z",
    expiresAt: "2027-02-24T00:00:00.000Z",
    freshnessCategory: "operator_tariff_and_policy",
    status: "current",
  },
  {
    sourceId: "src-juneau-flight-deck-site-truth-2026",
    sourceOrganization: "Juneau Flight Deck (DCC Verified Site Truth)",
    sourceTitle:
      "Juneau Flight Deck — Specialist Juneau Flightseeing Decision Surface (juneauflightdeck.com)",
    sourceUrl: "https://juneauflightdeck.com",
    claimsSupported: ["claim-jfd-juneau-flightseeing-specialist"],
    retrievedAt: "2026-08-24T00:00:00.000Z",
    verifiedAt: "2026-08-24T00:00:00.000Z",
    expiresAt: "2027-02-24T00:00:00.000Z",
    freshnessCategory: "operator_tariff_and_policy",
    status: "current",
  },
  {
    sourceId: "src-dcc-alaska-shorex-guide-2026",
    sourceOrganization: "Destination Command Center Pre-Site Decision Guide",
    sourceTitle:
      "Alaska Shore Excursion How to Choose — One Signature Anchor Per Port & Walkable Port Backup",
    sourceUrl:
      "https://destinationcommandcenter.com/guides/alaska-shore-excursion-how-to-choose",
    claimsSupported: ["claim-alaska-one-anchor-per-port-rule"],
    retrievedAt: "2026-10-18T00:00:00.000Z",
    verifiedAt: "2026-10-18T00:00:00.000Z",
    expiresAt: "2027-04-18T00:00:00.000Z",
    freshnessCategory: "operator_tariff_and_policy",
    status: "current",
  },
];

export const ALASKA_SHORE_EXCURSIONS_EVIDENCE_CLAIMS: EvidenceClaim[] = [
  {
    claimId: "claim-lfse-multi-port-provider-routing",
    classification: "operator_published_fact",
    statement:
      "Last Frontier Shore Excursions (lastfrontiershoreexcursions.com) is an Alaska cruise-port excursion decision and provider-handoff property covering Juneau, Skagway, and Ketchikan; it routes travelers to excursion providers to complete booking and payment (takes_direct_payment: false).",
    fieldsSupported: ["bookingDestinations", "comparisonValues"],
    sourceIds: ["src-lfse-site-truth-2026"],
    isDecisionChanging: true,
    verificationNote:
      "Verified in lib/dcc/siteTruth.ts (last-frontier-shore-excursions, booking.authority: provider, takes_direct_payment: false, last_verified 2026-08-24).",
  },
  {
    claimId: "claim-jfd-juneau-flightseeing-specialist",
    classification: "operator_published_fact",
    statement:
      "Juneau Flight Deck (juneauflightdeck.com) is the specialist Juneau flightseeing decision surface that compares Juneau helicopter and floatplane options and routes travelers to operator/provider checkout (takes_direct_payment: false).",
    fieldsSupported: ["bookingDestinations", "islandsOrRegions"],
    sourceIds: ["src-juneau-flight-deck-site-truth-2026"],
    isDecisionChanging: true,
    verificationNote:
      "Verified in lib/dcc/siteTruth.ts (juneau-flight-deck, booking.authority: provider, takes_direct_payment: false, last_verified 2026-08-24).",
  },
  {
    claimId: "claim-alaska-one-anchor-per-port-rule",
    classification: "dcc_interpretation",
    statement:
      "Each Alaska port day works best when built around one signature anchor unique to that port (Juneau whales/glaciers, Skagway White Pass/Yukon corridor, Ketchikan Misty Fjords/rainforest/totems) while protecting the ship-clock return buffer and keeping a low-transfer walkable backup.",
    fieldsSupported: ["durationMinutes", "tradeoffs"],
    sourceIds: ["src-lfse-site-truth-2026", "src-dcc-alaska-shorex-guide-2026"],
    isDecisionChanging: true,
    verificationNote:
      "Verified in src/data/pre-site-guides.ts (alaska-shore-excursion-how-to-choose).",
  },
];

export const ALASKA_SHORE_EXCURSIONS_QUESTIONS: QuestionDefinition[] = [
  {
    questionId: "portOfCall",
    label: "1. Which Southeast Alaska cruise port are you planning?",
    helpText:
      "Select Juneau, Skagway, or Ketchikan to match port-specific anchors and specialist satellites.",
    inputType: "select",
    requiredForPersonalizedVerdict: true,
    decisionImpactExplanation:
      "Routes Juneau aviation inquiries to Juneau Flight Deck and port-wide shore excursion comparisons to Last Frontier Shore Excursions.",
    drivenByClaimIds: [
      "claim-lfse-multi-port-provider-routing",
      "claim-jfd-juneau-flightseeing-specialist",
    ],
    options: [
      {
        value: "juneau",
        label: "Juneau (Whales, Mendenhall Glacier & Flightseeing)",
      },
      {
        value: "skagway",
        label: "Skagway (White Pass Summit, Klondike & Sled Dog Camps)",
      },
      {
        value: "ketchikan",
        label: "Ketchikan (Misty Fjords, Tongass Rainforest & Totem Parks)",
      },
    ],
    defaultValue: ALASKA_SHORE_EXCURSIONS_DEFAULT_EXAMPLE_INPUT.portOfCall,
  },
  {
    questionId: "excursionFocus",
    label: "2. What is your primary port-day priority?",
    helpText:
      "Compare signature port excursions against specialist Juneau flightseeing or a walkable low-transfer port day.",
    inputType: "select",
    requiredForPersonalizedVerdict: true,
    decisionImpactExplanation:
      "Selects the appropriate specialist satellite or public port-town baseline.",
    drivenByClaimIds: [
      "claim-lfse-multi-port-provider-routing",
      "claim-jfd-juneau-flightseeing-specialist",
      "claim-alaska-one-anchor-per-port-rule",
    ],
    options: [
      {
        value: "port_signature_shore_excursion",
        label: "Compare signature port excursions (Whales, Rail/Yukon, Fjords)",
      },
      {
        value: "juneau_specialist_flightseeing",
        label: "Dedicated Juneau helicopter / glacier flightseeing comparison",
      },
      {
        value: "walkable_port_town_backup",
        label: "Low-transfer walkable port town & weather backup ($0 baseline)",
      },
    ],
    defaultValue: ALASKA_SHORE_EXCURSIONS_DEFAULT_EXAMPLE_INPUT.excursionFocus,
  },
  {
    questionId: "portWindowHours",
    label: "3. Total ship port window (hours from dock to all-aboard)",
    helpText:
      "Short port windows (< 5 hours) require keeping transfer and return buffers tight.",
    inputType: "number",
    requiredForPersonalizedVerdict: true,
    decisionImpactExplanation:
      "Eliminates multi-hour excursion lanes when the total port call is too short to protect the ship-time return buffer.",
    drivenByClaimIds: ["claim-alaska-one-anchor-per-port-rule"],
    min: 3,
    max: 14,
    defaultValue: ALASKA_SHORE_EXCURSIONS_DEFAULT_EXAMPLE_INPUT.portWindowHours,
  },
  {
    questionId: "travelDate",
    label: "4. Port call date (optional)",
    helpText: "Leave blank to view the default comparison scenario.",
    inputType: "date",
    requiredForPersonalizedVerdict: false,
    decisionImpactExplanation:
      "Marks the evaluation as a personalized date scenario.",
    drivenByClaimIds: ["claim-lfse-multi-port-provider-routing"],
    defaultValue: null,
  },
];

export const ALASKA_SHORE_EXCURSIONS_COMPARISON_DIMENSIONS: ComparisonDimension[] =
  [
    {
      dimensionId: "supportedPorts",
      label: "Supported Alaska Ports",
      description: "Ports covered by this specialist lane.",
    },
    {
      dimensionId: "bookingAuthority",
      label: "Booking & Payment Authority",
      description: "Verified checkout boundary from siteTruth.ts.",
    },
    {
      dimensionId: "portBufferFit",
      label: "Port-Window & Return-Buffer Fit",
      description: "How this lane fits your ship clock.",
    },
  ];

export const ALASKA_SHORE_EXCURSIONS_CANDIDATE_OPTIONS: CandidateOption[] = [
  {
    optionId: "ak-shorex-lfse-port-anchor",
    title:
      "Multi-Port Signature Shore Excursion Comparison (Last Frontier Shore Excursions — Juneau, Skagway & Ketchikan)",
    shortLabel: "Last Frontier Shore Excursions",
    optionKind: "owned_specialist_comparison",
    actualOperators: [
      "Verified Alaska Excursion Providers via Last Frontier Shore Excursions",
    ],
    islandsOrRegions: ["Juneau", "Skagway", "Ketchikan"],
    departureAreas: [
      "Juneau Cruise Docks, Skagway Cruise Docks & Ketchikan Berths 1–4 / Ward Cove",
    ],
    operatingMonths: [5, 6, 7, 8, 9, 10],
    scheduleVerifiedThroughDate: "2026-08-24",
    vesselOrVehicleType:
      "Port-specific wildlife boats, scenic rail/motorcoaches, and fjord/rainforest excursions",
    groupCapacityRange: {
      min: 1,
      max: 40,
      label: "Small-group and standard shore excursions",
    },
    rideComfortLevel: "high_stability",
    viewingSpaceDescription:
      "Curated Alaska shore excursion comparison organized around one signature anchor per port (Juneau whales/glaciers, Skagway White Pass/Yukon, Ketchikan Misty Fjords/totems).",
    durationMinutes: {
      activity: 210,
      checkInLead: 30,
      typicalTransferEachWay: 20,
      totalDockOrHotelRange: { min: 180, max: 300 },
      label: "3–5 hours dock-to-dock (requires >= 5h port window)",
    },
    minimumAgeYears: null,
    minimumAgeNote: "Varies by excursion provider.",
    accessibilityProfile: {
      stepFreeWheelchairSupported: true,
      limitedMobilitySupported: true,
      walkingAndBoardingRequirement: "Varies by excursion type.",
      confirmationStatus: "operator_confirmation_required",
      note: "Check ramp, coach lift, or vessel boarding specs on the excursion provider page.",
    },
    transportationAvailability: {
      hotelPickupAvailable: false,
      cruisePortShuttleAvailable: true,
      selfDriveParkingNote: "Departs from cruise port meeting zones.",
    },
    cancellationTerms:
      "Last Frontier Shore Excursions takes no direct payment; booking, payment, and cancellation terms are finalized with the excursion provider.",
    whaleSightingOrReRidePolicy:
      "Varies by selected excursion provider.",
    indicativePriceUsd: {
      min: 0,
      max: 0,
      basisLabel:
        "Provider-published rates on lastfrontiershoreexcursions.com (takes_direct_payment: false)",
    },
    comparisonValues: {
      supportedPorts: "Juneau, Skagway, and Ketchikan",
      bookingAuthority:
        "Provider (Last Frontier Shore Excursions routes to excursion providers; takes_direct_payment: false)",
      portBufferFit:
        "Built around one signature anchor per port with ship-clock buffer discipline",
    },
    tradeoffs: {
      strengths: [
        "Covers all three primary Southeast Alaska ports (Juneau, Skagway, Ketchikan) on a single dedicated shore-excursion decision surface.",
        "Helps travelers pick one signature anchor per port instead of over-stacking tight transfers.",
      ],
      limitations: [
        "Last Frontier Shore Excursions is a decision and provider-handoff surface; final booking and payment occur with the excursion provider.",
      ],
    },
    claimIds: [
      "claim-lfse-multi-port-provider-routing",
      "claim-alaska-one-anchor-per-port-rule",
    ],
    sourceIds: ["src-lfse-site-truth-2026", "src-dcc-alaska-shorex-guide-2026"],
    bookingDestinations: [
      {
        destinationId: "dest-lfse-port-hub",
        optionId: "ak-shorex-lfse-port-anchor",
        sellerType: "dcc_owned_specialist",
        sellerName: "Last Frontier Shore Excursions",
        actualOperatorName: "Alaska Shore Excursion Providers",
        label: "Compare Port Excursions on Last Frontier Shore Excursions",
        url: "https://www.lastfrontiershoreexcursions.com/ports/juneau",
        supportedContextParams: ["port", "src"],
        relationshipDisclosure:
          "Last Frontier Shore Excursions (lastfrontiershoreexcursions.com) is a connected DCC portfolio property that routes travelers to excursion providers to complete booking and payment (commercialWeightApplied: 0).",
        isCommercialPartner: true,
        commissionInfluenceOnRanking: 0,
      },
    ],
  },
  {
    optionId: "ak-shorex-jfd-aviation-specialist",
    title:
      "Juneau Helicopter & Floatplane Specialist Comparison (Juneau Flight Deck — Juneau Only)",
    shortLabel: "Juneau Flight Deck (Aviation)",
    optionKind: "owned_specialist_comparison",
    actualOperators: [
      "Juneau Flightseeing Operators via Juneau Flight Deck",
    ],
    islandsOrRegions: ["Juneau"],
    departureAreas: ["Juneau Cruise Docks to JNU Airport / Floatplane Pond"],
    operatingMonths: [5, 6, 7, 8, 9],
    scheduleVerifiedThroughDate: "2026-08-24",
    vesselOrVehicleType:
      "Helicopter glacier landing & floatplane flightseeing qualification",
    groupCapacityRange: {
      min: 1,
      max: 6,
      label: "Aircraft seat allocation (typically up to 6 passengers per aircraft)",
    },
    rideComfortLevel: "high_motion_raft_or_aircraft",
    viewingSpaceDescription:
      "Dedicated Juneau flightseeing specialist surface comparing icefield helicopter landings and floatplane routes.",
    durationMinutes: {
      activity: 150,
      checkInLead: 45,
      typicalTransferEachWay: 25,
      totalDockOrHotelRange: { min: 195, max: 270 },
      label: "3.25–4.5 hours dock-to-dock (Juneau only)",
    },
    minimumAgeYears: null,
    minimumAgeNote: "Confirm operator age and FAA weight-balance policies.",
    accessibilityProfile: {
      stepFreeWheelchairSupported: false,
      limitedMobilitySupported: true,
      walkingAndBoardingRequirement: "Aircraft boarding at JNU heliport/pond.",
      confirmationStatus: "operator_confirmation_required",
      note: "Confirm aircraft lift support with the flightseeing operator.",
    },
    transportationAvailability: {
      hotelPickupAvailable: false,
      cruisePortShuttleAvailable: true,
      selfDriveParkingNote: "Includes dock-to-heliport shuttle transfer.",
    },
    cancellationTerms:
      "Juneau Flight Deck takes no direct payment; booking, payment, and weather-cancellation terms are finalized at operator/provider checkout.",
    whaleSightingOrReRidePolicy:
      "Subject to FAA VFR ceiling and visibility minima.",
    indicativePriceUsd: {
      min: 0,
      max: 0,
      basisLabel:
        "Operator/provider rates via juneauflightdeck.com (takes_direct_payment: false)",
    },
    comparisonValues: {
      supportedPorts: "Juneau only",
      bookingAuthority:
        "Provider (Juneau Flight Deck routes to operator/provider checkout; takes_direct_payment: false)",
      portBufferFit:
        "Requires Juneau port call with >= 5h window and weather backup plan",
    },
    tradeoffs: {
      strengths: [
        "Purpose-built Juneau flightseeing specialist surface (juneauflightdeck.com) focused strictly on glacier helicopter and floatplane decisions.",
        "Pairs with DCC's deep Juneau Helicopter Tours engine (/juneau/helicopter-tours) when evaluating specific docks and weight-balance rules.",
      ],
      limitations: [
        "Strictly for Juneau port calls—not applicable to Skagway or Ketchikan.",
        "Weather-sensitive aviation requires keeping a surface backup.",
      ],
    },
    claimIds: ["claim-jfd-juneau-flightseeing-specialist"],
    sourceIds: ["src-juneau-flight-deck-site-truth-2026"],
    bookingDestinations: [
      {
        destinationId: "dest-jfd-specialist",
        optionId: "ak-shorex-jfd-aviation-specialist",
        sellerType: "dcc_owned_specialist",
        sellerName: "Juneau Flight Deck",
        actualOperatorName: "Juneau Flightseeing Operators",
        label: "Open Juneau Flight Deck Specialist Surface",
        url: "https://juneauflightdeck.com",
        supportedContextParams: ["src"],
        relationshipDisclosure:
          "Juneau Flight Deck (juneauflightdeck.com) is a connected DCC specialist surface that routes travelers to operator/provider checkout (commercialWeightApplied: 0).",
        isCommercialPartner: true,
        commissionInfluenceOnRanking: 0,
      },
    ],
  },
  {
    optionId: "ak-shorex-walkable-port-backup",
    title:
      "Walkable Port Town & Low-Transfer Weather Backup (No Pre-Booked Excursion)",
    shortLabel: "Walkable Port Backup ($0 Baseline)",
    optionKind: "public_or_diy",
    actualOperators: ["Self-Guided Port Walk / Local Municipal Transit"],
    islandsOrRegions: ["Juneau", "Skagway", "Ketchikan"],
    departureAreas: ["Downtown Cruise Waterfronts"],
    operatingMonths: [5, 6, 7, 8, 9, 10],
    scheduleVerifiedThroughDate: "2026-10-18",
    vesselOrVehicleType: "Pedestrian port-town walk",
    groupCapacityRange: {
      min: 1,
      max: 20,
      label: "Any group size",
    },
    rideComfortLevel: "shore_stationary",
    viewingSpaceDescription:
      "Low-transfer port day exploring downtown Juneau, historic Skagway Broadway, or Ketchikan Creek Street without timed excursion risk.",
    durationMinutes: {
      activity: 120,
      checkInLead: 0,
      typicalTransferEachWay: 0,
      totalDockOrHotelRange: { min: 60, max: 180 },
      label: "Flexible 1–3 hour walk near the cruise docks",
    },
    minimumAgeYears: null,
    minimumAgeNote: "All ages.",
    accessibilityProfile: {
      stepFreeWheelchairSupported: true,
      limitedMobilitySupported: true,
      walkingAndBoardingRequirement: "Paved waterfront and boardwalk areas.",
      confirmationStatus: "confirmed_accessible",
      note: "Stays close to the ship gangway with no remote transfer risk.",
    },
    transportationAvailability: {
      hotelPickupAvailable: false,
      cruisePortShuttleAvailable: false,
      selfDriveParkingNote: "Walk directly from the dock.",
    },
    cancellationTerms: "No ticket or reservation required ($0).",
    whaleSightingOrReRidePolicy: "N/A — weather-resilient port town walk.",
    indicativePriceUsd: {
      min: 0,
      max: 0,
      basisLabel: "$0 self-guided port walk",
    },
    comparisonValues: {
      supportedPorts: "Juneau, Skagway, and Ketchikan",
      bookingAuthority: "None ($0 no-purchase baseline)",
      portBufferFit:
        "Fits even short (< 5h) port windows and low-ceiling weather holds",
    },
    tradeoffs: {
      strengths: [
        "Zero missed-ship risk, zero cancellation stress, and works in short port calls (< 5 hours) or low cloud ceilings.",
      ],
      limitations: [
        "Does not reach remote glaciers, humpback whale feeding channels, or the White Pass summit.",
      ],
    },
    claimIds: ["claim-alaska-one-anchor-per-port-rule"],
    sourceIds: ["src-dcc-alaska-shorex-guide-2026"],
    bookingDestinations: [
      {
        destinationId: "dest-alaska-shorex-guide-baseline",
        optionId: "ak-shorex-walkable-port-backup",
        sellerType: "public_or_diy",
        sellerName: "Destination Command Center Guide",
        actualOperatorName: "Self-Guided",
        label: "Read Alaska Shore Excursion Port-Day Guide",
        url: "https://destinationcommandcenter.com/guides/alaska-shore-excursion-how-to-choose",
        supportedContextParams: [],
        relationshipDisclosure:
          "Non-commercial DCC research guide for Alaska port days (commercialWeightApplied: 0).",
        isCommercialPartner: false,
        commissionInfluenceOnRanking: 0,
      },
    ],
  },
];

export const ALASKA_SHORE_EXCURSIONS_HARD_CONSTRAINT_RULES: HardConstraintRule<AlaskaShoreExcursionsInput>[] =
  [
    {
      ruleId: "hc-jfd-juneau-port-only",
      label: "Juneau Flight Deck Port Scope (Juneau Only)",
      description:
        "Juneau Flight Deck (juneauflightdeck.com) is strictly a Juneau flightseeing specialist surface and is eliminated when the selected port is Skagway or Ketchikan.",
      sourceIds: ["src-juneau-flight-deck-site-truth-2026"],
      evaluate: (option, input) => {
        if (
          option.optionId === "ak-shorex-jfd-aviation-specialist" &&
          input.portOfCall !== "juneau"
        ) {
          return {
            passed: false,
            eliminationReason: `Juneau Flight Deck (juneauflightdeck.com) is strictly a specialist Juneau flightseeing surface and does not serve ${input.portOfCall}. Use Last Frontier Shore Excursions for ${input.portOfCall} excursions.`,
            whatInputChangeWouldAlterResult:
              "Select 'Juneau' as the port of call to evaluate Juneau Flight Deck.",
          };
        }
        return { passed: true };
      },
    },
    {
      ruleId: "hc-alaska-minimum-port-window",
      label: "Minimum 5-Hour Port Window for Off-Dock Excursions",
      description:
        "Eliminates multi-hour off-dock excursions when the ship port window is under 5 hours.",
      sourceIds: ["src-dcc-alaska-shorex-guide-2026"],
      evaluate: (option, input) => {
        if (
          option.optionId !== "ak-shorex-walkable-port-backup" &&
          input.portWindowHours < 5
        ) {
          return {
            passed: false,
            eliminationReason: `A ${input.portWindowHours}-hour port window is too short to safely complete a 3.5–4.5 hour off-dock excursion plus dock transfers and a 60-minute all-aboard buffer.`,
            whatInputChangeWouldAlterResult:
              "Increase port window to 5+ hours, or use the Walkable Port Town Backup for short port calls.",
          };
        }
        return { passed: true };
      },
    },
  ];

export const ALASKA_SHORE_EXCURSIONS_PREFERENCE_RULES: PreferenceRule<AlaskaShoreExcursionsInput>[] =
  [
    {
      ruleId: "pref-excursion-focus-match",
      label: "Excursion Focus & Specialist Satellite Alignment",
      maxPoints: 60,
      evaluate: (option, input) => {
        if (
          input.excursionFocus === "port_signature_shore_excursion" &&
          option.optionId === "ak-shorex-lfse-port-anchor"
        ) {
          return {
            points: 60,
            reason: `Routes directly to Last Frontier Shore Excursions' ${input.portOfCall} port hub to compare signature excursions.`,
          };
        }
        if (
          input.excursionFocus === "juneau_specialist_flightseeing" &&
          option.optionId === "ak-shorex-jfd-aviation-specialist"
        ) {
          return {
            points: 60,
            reason:
              "Routes directly to Juneau Flight Deck (juneauflightdeck.com), the specialist Juneau flightseeing decision surface.",
          };
        }
        if (
          input.excursionFocus === "walkable_port_town_backup" &&
          option.optionId === "ak-shorex-walkable-port-backup"
        ) {
          return {
            points: 60,
            reason:
              "Matches preference for a zero-commitment, weather-resilient walkable port day.",
          };
        }
        return {
          points: 25,
          reason: "Viable alternative port-day option.",
        };
      },
    },
  ];

function computeAlaskaShorexTiming(
  option: CandidateOption,
  input: AlaskaShoreExcursionsInput,
): TimingCalculationResult {
  const availableMinutes = Math.round(input.portWindowHours * 60);
  const checkIn = option.durationMinutes.checkInLead;
  const transfer = option.durationMinutes.typicalTransferEachWay * 2;
  const activity = option.durationMinutes.activity;
  const returnBuffer = option.optionId === "ak-shorex-walkable-port-backup" ? 30 : 60;
  const requiredTotal = checkIn + transfer + activity + returnBuffer;
  const netSlack = availableMinutes - requiredTotal;
  return {
    availableWindowMinutes: availableMinutes,
    requiredTotalMinutes: requiredTotal,
    checkInLeadMinutes: checkIn,
    transferMinutesRoundTrip: transfer,
    activityMinutes: activity,
    returnBufferMinutes: returnBuffer,
    netSlackMinutes: netSlack,
    summary: `${requiredTotal} min required (including ${returnBuffer}m ship buffer) vs. ${availableMinutes} min port window (${netSlack >= 0 ? `+${netSlack}m slack` : `${netSlack}m deficit`}).`,
  };
}

function customizeAlaskaShorexBookingDestinations(
  option: CandidateOption,
  input: AlaskaShoreExcursionsInput,
): BookingDestination[] {
  if (option.optionId === "ak-shorex-lfse-port-anchor") {
    const portLabel =
      input.portOfCall.charAt(0).toUpperCase() + input.portOfCall.slice(1);
    return option.bookingDestinations.map((dest) => ({
      ...dest,
      label: `Compare ${portLabel} Shore Excursions on Last Frontier Shore Excursions`,
      url: `https://www.lastfrontiershoreexcursions.com/ports/${input.portOfCall}`,
    }));
  }
  return option.bookingDestinations;
}

export const ALASKA_SHORE_EXCURSIONS_DECISION_ENGINE: DecisionEngineDefinition<AlaskaShoreExcursionsInput> =
  {
    engineId: "alaska-shore-excursions",
    version: "1.0.0",
    slug: "alaska",
    canonicalPath: "/alaska",
    canonicalUrl: "https://destinationcommandcenter.com/alaska",
    title:
      "Alaska Multi-Port Shore Excursions Decision Engine (Juneau, Skagway & Ketchikan)",
    destinationName: "Southeast Alaska (Juneau, Skagway & Ketchikan)",
    categoryName: "Alaska Shore Excursions & Port-Day Routing",
    heroQuestion:
      "Which specialist Alaska port surface fits your Juneau, Skagway, or Ketchikan port window?",
    summaryDescription:
      "High-level multi-port Alaska router connecting cruise travelers to Last Frontier Shore Excursions (lastfrontiershoreexcursions.com for Juneau, Skagway, and Ketchikan shore excursions), Juneau Flight Deck (juneauflightdeck.com for Juneau flightseeing), and a walkable port-town backup.",
    referenceGuide: {
      importantDecisionFactors: [
        {
          title:
            "One Signature Anchor Per Alaska Port Day",
          detail:
            "Each Southeast Alaska port has a distinct strength—Juneau for whales, Mendenhall Glacier, and flightseeing; Skagway for the White Pass & Yukon corridor; Ketchikan for Misty Fjords, Tongass rainforest, and totems. Building around one anchor protects your ship-time return buffer.",
          sourceIds: [
            "src-lfse-site-truth-2026",
            "src-dcc-alaska-shorex-guide-2026",
          ],
        },
        {
          title:
            "Specialist Port Satellites & Provider Checkout Authority",
          detail:
            "Last Frontier Shore Excursions (lastfrontiershoreexcursions.com) covers Juneau, Skagway, and Ketchikan shore excursions, while Juneau Flight Deck (juneauflightdeck.com) specializes in Juneau aviation; both route travelers to excursion providers to finalize booking and payment.",
          sourceIds: [
            "src-lfse-site-truth-2026",
            "src-juneau-flight-deck-site-truth-2026",
          ],
        },
      ],
      experienceAndVesselTypes: [
        {
          typeName:
            "Multi-Port Shore Excursion Routing (Last Frontier Shore Excursions)",
          capacityAndStability:
            "Wildlife vessels, White Pass rail/coach, and fjord/rainforest tours",
          bestFor:
            "Comparing signature port anchors across Juneau, Skagway, and Ketchikan",
          limitations:
            "Requires >= 5h port window; final booking and payment occur with the excursion provider",
          sourceIds: ["src-lfse-site-truth-2026"],
        },
        {
          typeName:
            "Juneau Flightseeing Specialist (Juneau Flight Deck)",
          capacityAndStability: "Helicopter glacier landings & floatplanes",
          bestFor: "Juneau port calls prioritizing icefield aviation",
          limitations: "Juneau only; subject to FAA VFR ceiling weather holds",
          sourceIds: ["src-juneau-flight-deck-site-truth-2026"],
        },
        {
          typeName: "Walkable Port Town Backup ($0 Baseline)",
          capacityAndStability: "Pedestrian waterfront exploration",
          bestFor:
            "Short (< 5h) port windows or low-visibility weather days",
          limitations: "Stays within the immediate port town",
          sourceIds: ["src-dcc-alaska-shorex-guide-2026"],
        },
      ],
      departureLocations: [
        {
          islandOrRegion: "Juneau, Skagway & Ketchikan",
          harborOrArea: "Cruise Berths & Port Excursion Staging Zones",
          logisticsNote:
            "Account for tender or shuttle time (such as AJ Dock/Franklin Dock in Juneau or Ward Cove in Ketchikan) before booking tight back-to-back activities.",
          sourceIds: ["src-dcc-alaska-shorex-guide-2026"],
        },
      ],
      commonTradeoffs: [
        {
          tradeoff: "Single Signature Excursion vs. Stacking Two Major Tours",
          explanation:
            "One well-chosen signature excursion leaves time for dock transfers and weather delays without risking your all-aboard time.",
        },
      ],
      operationalDependencies: [
        {
          dependency: "Ship Clock & Southeast Alaska Weather Ceilings",
          impact:
            "Always keep a walkable port-side backup plan if aviation ceilings drop or port arrival is delayed.",
          sourceIds: ["src-dcc-alaska-shorex-guide-2026"],
        },
      ],
      methodologySteps: [
        "Enforce port-window timing math (requiring >= 5 hours for off-dock excursions).",
        "Route Juneau, Skagway, and Ketchikan excursion comparisons to Last Frontier Shore Excursions and Juneau aviation inquiries to Juneau Flight Deck.",
        "Enforce assertNoWtaBookingDestination and retain the $0 walkable port-town backup.",
      ],
    },
    questions: ALASKA_SHORE_EXCURSIONS_QUESTIONS,
    answerSchema: ALASKA_SHORE_EXCURSIONS_ANSWER_SCHEMA,
    defaultExampleInput: ALASKA_SHORE_EXCURSIONS_DEFAULT_EXAMPLE_INPUT,
    comparisonDimensions: ALASKA_SHORE_EXCURSIONS_COMPARISON_DIMENSIONS,
    candidateOptions: ALASKA_SHORE_EXCURSIONS_CANDIDATE_OPTIONS,
    hardConstraintRules: ALASKA_SHORE_EXCURSIONS_HARD_CONSTRAINT_RULES,
    preferenceRules: ALASKA_SHORE_EXCURSIONS_PREFERENCE_RULES,
    evidenceClaims: ALASKA_SHORE_EXCURSIONS_EVIDENCE_CLAIMS,
    sourceRecords: ALASKA_SHORE_EXCURSIONS_SOURCE_RECORDS,
    computeTimingForOption: (opt, input) =>
      computeAlaskaShorexTiming(opt, input),
    customizeBookingDestinations: (opt, input) =>
      customizeAlaskaShorexBookingDestinations(opt, input),
    isExampleScenarioDetector: (rawInput, normalized) => {
      const isExample =
        rawInput === undefined ||
        rawInput === null ||
        normalized.travelDate === null;
      return {
        isExample,
        banner: isExample
          ? "Example Scenario Shown: 8-hour Juneau port call comparing Last Frontier Shore Excursions against Juneau Flight Deck and a walkable port backup."
          : null,
        missingInputFacts:
          normalized.travelDate === null
            ? [
                {
                  factId: "missing-alaska-shorex-date",
                  optionId: null,
                  category: "missing_traveler_input",
                  summary: "Port call date not provided.",
                  impactOnDecision:
                    "Live departure availability is confirmed on the provider checkout page for your specific sailing date.",
                  sourceIds: ["src-lfse-site-truth-2026"],
                },
              ]
            : [],
      };
    },
    evaluate: (rawInput: unknown, options?: DecisionEvaluateOptions) =>
      evaluateDecisionEngine(
        ALASKA_SHORE_EXCURSIONS_DECISION_ENGINE,
        rawInput,
        options,
      ),
  };
