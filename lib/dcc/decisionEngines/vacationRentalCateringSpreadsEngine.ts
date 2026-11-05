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
import {
  FEASTLY_SPREAD_MARKETS,
  resolveFeastlySpreadMarket,
} from "@/lib/dcc/portfolioNetworkRegistry";

const FEASTLY_MARKET_SLUGS = FEASTLY_SPREAD_MARKETS.map((m) => m.slug) as [
  string,
  ...string[],
];

export interface VacationRentalCateringSpreadsInput {
  destinationMarket: string;
  mealApproach:
    | "delivered_in_rental_catering_spread"
    | "self_cooked_or_local_restaurant_group";
  groupSize: number;
  travelDate: string | null;
}

export const VACATION_RENTAL_CATERING_DEFAULT_EXAMPLE_INPUT: VacationRentalCateringSpreadsInput =
  {
    destinationMarket: "wisconsin-dells",
    mealApproach: "delivered_in_rental_catering_spread",
    groupSize: 12,
    travelDate: null,
  };

const ymdRegex = /^\d{4}-\d{2}-\d{2}$/;

export const VACATION_RENTAL_CATERING_ANSWER_SCHEMA = z
  .object({
    destinationMarket: z
      .enum(FEASTLY_MARKET_SLUGS)
      .default(
        VACATION_RENTAL_CATERING_DEFAULT_EXAMPLE_INPUT.destinationMarket,
      ),
    mealApproach: z
      .enum([
        "delivered_in_rental_catering_spread",
        "self_cooked_or_local_restaurant_group",
      ])
      .default(VACATION_RENTAL_CATERING_DEFAULT_EXAMPLE_INPUT.mealApproach),
    groupSize: z
      .number()
      .int()
      .min(2)
      .max(60)
      .default(VACATION_RENTAL_CATERING_DEFAULT_EXAMPLE_INPUT.groupSize),
    travelDate: z
      .string()
      .regex(ymdRegex, "travelDate must be YYYY-MM-DD when provided")
      .nullable()
      .default(VACATION_RENTAL_CATERING_DEFAULT_EXAMPLE_INPUT.travelDate),
  })
  .strict();

export const VACATION_RENTAL_CATERING_SOURCE_RECORDS: SourceRecord[] = [
  {
    sourceId: "src-feastly-spread-site-truth-2026",
    sourceOrganization: "FeastlySpread (DCC Verified Site Truth & Market Catalog)",
    sourceTitle:
      "FeastlySpread — 2 Existing Booking Path Markets (Wisconsin Dells, Door County) & 16 Coverage-Request Markets",
    sourceUrl: "https://feastlyspread.com",
    claimsSupported: [
      "claim-feastly-2-active-vs-16-coverage-request-markets",
      "claim-feastly-coverage-request-never-confirms-fulfillment",
    ],
    retrievedAt: "2026-10-27T00:00:00.000Z",
    verifiedAt: "2026-10-27T00:00:00.000Z",
    expiresAt: "2027-04-27T00:00:00.000Z",
    freshnessCategory: "operator_tariff_and_policy",
    status: "current",
  },
  {
    sourceId: "src-welcome-to-the-dells-and-brinkberry-2026",
    sourceOrganization:
      "Welcome to the Dells & Brinkberry (DCC Verified Site Truth)",
    sourceTitle:
      "Welcome to the Dells (welcometothedells.com) & Brinkberry (brinkberry.com) Group Stay & Dining Discovery",
    sourceUrl: "https://welcometothedells.com",
    claimsSupported: ["claim-vacation-rental-diy-and-local-dining-baseline"],
    retrievedAt: "2026-10-27T00:00:00.000Z",
    verifiedAt: "2026-10-27T00:00:00.000Z",
    expiresAt: "2027-04-27T00:00:00.000Z",
    freshnessCategory: "operator_tariff_and_policy",
    status: "current",
  },
];

export const VACATION_RENTAL_CATERING_EVIDENCE_CLAIMS: EvidenceClaim[] = [
  {
    claimId: "claim-feastly-2-active-vs-16-coverage-request-markets",
    classification: "operator_published_fact",
    statement:
      "FeastlySpread (feastlyspread.com) has 2 markets with an existing booking path (Wisconsin Dells, WI and Door County, WI) and 16 coverage-request markets where live booking is not available.",
    fieldsSupported: ["bookingDestinations", "comparisonValues"],
    sourceIds: ["src-feastly-spread-site-truth-2026"],
    isDecisionChanging: true,
    verificationNote:
      "Verified in lib/dcc/siteTruth.ts (feastly-spread, last_verified 2026-10-27) and FEASTLY_SPREAD_MARKETS in lib/dcc/portfolioNetworkRegistry.ts.",
  },
  {
    claimId: "claim-feastly-coverage-request-never-confirms-fulfillment",
    classification: "operator_published_fact",
    statement:
      "In FeastlySpread's 16 coverage-request markets, an existing booking path is not available; submitting a coverage request logs market demand only and never confirms catering fulfillment.",
    fieldsSupported: ["cancellationTerms", "tradeoffs"],
    sourceIds: ["src-feastly-spread-site-truth-2026"],
    isDecisionChanging: true,
    verificationNote:
      "Verified in FEASTLY_SPREAD_MARKETS in lib/dcc/portfolioNetworkRegistry.ts.",
  },
  {
    claimId: "claim-vacation-rental-diy-and-local-dining-baseline",
    classification: "dcc_interpretation",
    statement:
      "Large vacation-rental groups can alternatively cook in-cabin or coordinate local group dining and regional stay logistics via Welcome to the Dells (welcometothedells.com) and Brinkberry (brinkberry.com).",
    fieldsSupported: ["indicativePriceUsd", "tradeoffs"],
    sourceIds: ["src-welcome-to-the-dells-and-brinkberry-2026"],
    isDecisionChanging: true,
    verificationNote:
      "Verified in lib/dcc/siteTruth.ts (welcome-to-the-dells & brinkberry) and src/data/pre-site-guides.ts (wisconsin-dells-large-group-dinner).",
  },
];

export const VACATION_RENTAL_CATERING_QUESTIONS: QuestionDefinition[] = [
  {
    questionId: "destinationMarket",
    label: "1. Which vacation-rental market are you visiting?",
    helpText:
      "FeastlySpread has an existing booking path in 2 active markets (Wisconsin Dells and Door County) and operates as a coverage-request inquiry in 16 expansion markets.",
    inputType: "select",
    requiredForPersonalizedVerdict: true,
    decisionImpactExplanation:
      "Determines whether an existing FeastlySpread booking path exists or if the market is strictly a coverage-request inquiry.",
    drivenByClaimIds: [
      "claim-feastly-2-active-vs-16-coverage-request-markets",
      "claim-feastly-coverage-request-never-confirms-fulfillment",
    ],
    options: FEASTLY_SPREAD_MARKETS.map((market) => ({
      value: market.slug,
      label: `${market.name} (${
        market.hasExistingBookingPath
          ? "Active Booking Path"
          : "Coverage-Request Market Only"
      })`,
      description: market.disclosure,
    })),
    defaultValue:
      VACATION_RENTAL_CATERING_DEFAULT_EXAMPLE_INPUT.destinationMarket,
  },
  {
    questionId: "mealApproach",
    label: "2. How does your group prefer to handle the main group dinner?",
    helpText:
      "Compare ordering a group catering spread for the rental against cooking in-cabin or dining out.",
    inputType: "select",
    requiredForPersonalizedVerdict: true,
    decisionImpactExplanation:
      "Ranks FeastlySpread in-rental spreads against self-cooked or local restaurant plans.",
    drivenByClaimIds: [
      "claim-feastly-2-active-vs-16-coverage-request-markets",
      "claim-vacation-rental-diy-and-local-dining-baseline",
    ],
    options: [
      {
        value: "delivered_in_rental_catering_spread",
        label: "In-rental group catering spread (eat together at the house)",
      },
      {
        value: "self_cooked_or_local_restaurant_group",
        label: "Self-cooked cabin grocery run or local restaurant reservation",
      },
    ],
    defaultValue: VACATION_RENTAL_CATERING_DEFAULT_EXAMPLE_INPUT.mealApproach,
  },
  {
    questionId: "groupSize",
    label: "3. Total guests in your vacation rental group",
    helpText: "Number of people eating together at the rental.",
    inputType: "number",
    requiredForPersonalizedVerdict: false,
    decisionImpactExplanation:
      "Used to evaluate group dining friction vs. in-rental catering.",
    drivenByClaimIds: ["claim-vacation-rental-diy-and-local-dining-baseline"],
    min: 2,
    max: 60,
    defaultValue: VACATION_RENTAL_CATERING_DEFAULT_EXAMPLE_INPUT.groupSize,
  },
  {
    questionId: "travelDate",
    label: "4. Planned dinner date (optional)",
    helpText: "Leave blank to view the default comparison scenario.",
    inputType: "date",
    requiredForPersonalizedVerdict: false,
    decisionImpactExplanation:
      "Marks the evaluation as a personalized date scenario.",
    drivenByClaimIds: ["claim-feastly-2-active-vs-16-coverage-request-markets"],
    defaultValue: null,
  },
];

export const VACATION_RENTAL_CATERING_COMPARISON_DIMENSIONS: ComparisonDimension[] =
  [
    {
      dimensionId: "marketCoverageStatus",
      label: "Market Coverage Status",
      description:
        "Active booking path (2 markets) vs. coverage-request inquiry (16 markets) vs. DIY.",
    },
    {
      dimensionId: "fulfillmentFinality",
      label: "Fulfillment & Checkout Finality",
      description:
        "How orders or coverage requests are handled on FeastlySpread.",
    },
    {
      dimensionId: "kitchenEffort",
      label: "Host Cooking & Cleanup Load",
      description:
        "Effort required from the vacation-rental group.",
    },
  ];

export const VACATION_RENTAL_CATERING_CANDIDATE_OPTIONS: CandidateOption[] = [
  {
    optionId: "catering-feastly-active-market",
    title:
      "FeastlySpread In-Rental Group Catering Booking Path (Active Markets Only: Wisconsin Dells & Door County)",
    shortLabel: "FeastlySpread (Active Booking Path)",
    optionKind: "owned_specialist_comparison",
    actualOperators: ["FeastlySpread (feastlyspread.com)"],
    islandsOrRegions: ["Wisconsin Dells, WI", "Door County, WI"],
    departureAreas: ["Vacation Rental Delivery / Drop-Off"],
    operatingMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    scheduleVerifiedThroughDate: "2026-10-27",
    vesselOrVehicleType: "Vacation-rental group catering spread package",
    groupCapacityRange: {
      min: 6,
      max: 60,
      label: "Large vacation-rental groups (6–60+ guests)",
    },
    rideComfortLevel: "shore_stationary",
    viewingSpaceDescription:
      "Group catering spreads designed to be served directly at your Wisconsin Dells or Door County vacation rental.",
    durationMinutes: {
      activity: 90,
      checkInLead: 0,
      typicalTransferEachWay: 0,
      totalDockOrHotelRange: { min: 60, max: 120 },
      label: "Served at your vacation rental (zero restaurant wait)",
    },
    minimumAgeYears: null,
    minimumAgeNote: "All ages.",
    accessibilityProfile: {
      stepFreeWheelchairSupported: true,
      limitedMobilitySupported: true,
      walkingAndBoardingRequirement: "Served inside your own rental property.",
      confirmationStatus: "confirmed_accessible",
      note: "Eliminates multi-car restaurant travel for guests with mobility needs.",
    },
    transportationAvailability: {
      hotelPickupAvailable: false,
      cruisePortShuttleAvailable: false,
      selfDriveParkingNote: "Served at your vacation rental.",
    },
    cancellationTerms:
      "FeastlySpread offers a published booking path in Wisconsin Dells and Door County; order confirmation is finalized per published site terms.",
    whaleSightingOrReRidePolicy:
      "N/A — vacation-rental catering spread platform.",
    indicativePriceUsd: {
      min: 0,
      max: 0,
      basisLabel:
        "Published package pricing on feastlyspread.com (Wisconsin Dells & Door County active markets)",
    },
    comparisonValues: {
      marketCoverageStatus:
        "Existing booking path in 2 active markets (wisconsin-dells, door-county)",
      fulfillmentFinality:
        "Published booking path on feastlyspread.com with explicit traveler confirmation",
      kitchenEffort:
        "Minimal — group eats together at the rental without cooking from scratch",
    },
    tradeoffs: {
      strengths: [
        "Available via an existing booking path in Wisconsin Dells and Door County.",
        "Keeps 8–30+ guests at one table in the rental without splitting across multiple restaurant tables or spending half a vacation day cooking.",
      ],
      limitations: [
        "Strictly limited to the 2 active markets (Wisconsin Dells and Door County); not available as a live booking path in the 16 coverage-request markets.",
      ],
    },
    claimIds: ["claim-feastly-2-active-vs-16-coverage-request-markets"],
    sourceIds: ["src-feastly-spread-site-truth-2026"],
    bookingDestinations: [
      {
        destinationId: "dest-feastly-active-booking",
        optionId: "catering-feastly-active-market",
        sellerType: "dcc_owned_specialist",
        sellerName: "FeastlySpread",
        actualOperatorName: "FeastlySpread",
        label: "Open FeastlySpread Active Market Booking Path",
        url: "https://feastlyspread.com/book?market=wisconsin-dells",
        supportedContextParams: ["market", "src"],
        relationshipDisclosure:
          "FeastlySpread (feastlyspread.com) is a connected DCC portfolio property with an existing booking path in Wisconsin Dells and Door County. Commercial relationships have zero influence on ranking (commercialWeightApplied: 0).",
        isCommercialPartner: true,
        commissionInfluenceOnRanking: 0,
      },
    ],
  },
  {
    optionId: "catering-feastly-coverage-inquiry",
    title:
      "FeastlySpread Market Coverage Request (16 Expansion Markets — Logs Demand Only, Never Confirms Fulfillment)",
    shortLabel: "FeastlySpread Coverage Request (Inquiry Only)",
    optionKind: "owned_specialist_comparison",
    actualOperators: ["FeastlySpread Market Expansion Queue"],
    islandsOrRegions: [
      "16 Coverage-Request Markets (Gatlinburg, Lake Tahoe, Outer Banks, Destin, Big Bear, Branson, Broken Bow, Lake of the Ozarks, Scottsdale, Nashville, Hamptons, Lake Geneva, Minocqua, Gulf Shores, Myrtle Beach, Park City)",
    ],
    departureAreas: ["Online Market Coverage Inquiry"],
    operatingMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    scheduleVerifiedThroughDate: "2026-10-27",
    vesselOrVehicleType:
      "Market coverage request form (does not confirm catering fulfillment)",
    groupCapacityRange: {
      min: 6,
      max: 60,
      label: "Expansion market demand inquiry",
    },
    rideComfortLevel: "shore_stationary",
    viewingSpaceDescription:
      "Coverage-request inquiry path for the 16 FeastlySpread expansion markets where an existing booking path is not yet active.",
    durationMinutes: {
      activity: 5,
      checkInLead: 0,
      typicalTransferEachWay: 0,
      totalDockOrHotelRange: { min: 5, max: 10 },
      label: "Online coverage request submission",
    },
    minimumAgeYears: null,
    minimumAgeNote: "N/A",
    accessibilityProfile: {
      stepFreeWheelchairSupported: true,
      limitedMobilitySupported: true,
      walkingAndBoardingRequirement: "Online inquiry.",
      confirmationStatus: "operator_confirmation_required",
      note: "Submitting a coverage request logs demand only and does not book catering.",
    },
    transportationAvailability: {
      hotelPickupAvailable: false,
      cruisePortShuttleAvailable: false,
      selfDriveParkingNote: "N/A — coverage inquiry only.",
    },
    cancellationTerms:
      "Coverage-request market only: an existing booking path is not available. Submitting a coverage request logs market demand and does not confirm catering fulfillment.",
    whaleSightingOrReRidePolicy: "N/A — market coverage inquiry.",
    indicativePriceUsd: {
      min: 0,
      max: 0,
      basisLabel:
        "$0 coverage request inquiry (does not confirm catering fulfillment)",
    },
    comparisonValues: {
      marketCoverageStatus:
        "Coverage-request market only (16 expansion markets)",
      fulfillmentFinality:
        "Logs market demand only — never confirms live catering fulfillment",
      kitchenEffort:
        "Must still plan a self-cooked or local restaurant meal unless coverage is separately confirmed",
    },
    tradeoffs: {
      strengths: [
        "Transparently distinguishes FeastlySpread's 16 expansion markets from its 2 active booking-path markets so groups never rely on unconfirmed catering.",
      ],
      limitations: [
        "Submitting a coverage request logs market demand only and does not confirm catering fulfillment; your group should still arrange a local or self-cooked dinner plan.",
      ],
    },
    claimIds: [
      "claim-feastly-2-active-vs-16-coverage-request-markets",
      "claim-feastly-coverage-request-never-confirms-fulfillment",
    ],
    sourceIds: ["src-feastly-spread-site-truth-2026"],
    bookingDestinations: [
      {
        destinationId: "dest-feastly-coverage-request",
        optionId: "catering-feastly-coverage-inquiry",
        sellerType: "dcc_owned_specialist",
        sellerName: "FeastlySpread",
        actualOperatorName: "FeastlySpread Coverage Request",
        label:
          "Submit FeastlySpread Market Coverage Request (Does Not Confirm Fulfillment)",
        url: "https://feastlyspread.com/locations#coverage-request",
        supportedContextParams: ["request_market", "src"],
        relationshipDisclosure:
          "FeastlySpread (feastlyspread.com) is a connected DCC portfolio property. In the 16 coverage-request markets, submitting a request logs market demand only and does not confirm catering fulfillment (commercialWeightApplied: 0).",
        isCommercialPartner: true,
        commissionInfluenceOnRanking: 0,
      },
    ],
  },
  {
    optionId: "catering-diy-or-local-dining",
    title:
      "Self-Cooked Rental Meal or Local Group Dining + Destination Planning (No-Purchase / Public Baseline)",
    shortLabel: "Self-Cooked Rental Meal / Local Dining",
    optionKind: "public_or_diy",
    actualOperators: [
      "Self-Cooked / Local Destination Restaurants (Welcome to the Dells & Brinkberry Context)",
    ],
    islandsOrRegions: ["All 18 Vacation-Rental Markets"],
    departureAreas: ["Vacation Rental Kitchen or Local Group Restaurant"],
    operatingMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    scheduleVerifiedThroughDate: "2026-10-27",
    vesselOrVehicleType:
      "In-cabin grocery meal prep or advance local restaurant group reservation",
    groupCapacityRange: {
      min: 2,
      max: 60,
      label: "Any group size",
    },
    rideComfortLevel: "shore_stationary",
    viewingSpaceDescription:
      "Self-managed grocery prep in the cabin kitchen or advance group reservations at local destination restaurants.",
    durationMinutes: {
      activity: 120,
      checkInLead: 0,
      typicalTransferEachWay: 15,
      totalDockOrHotelRange: { min: 90, max: 180 },
      label: "2–3 hours including prep/cleanup or restaurant travel",
    },
    minimumAgeYears: null,
    minimumAgeNote: "All ages.",
    accessibilityProfile: {
      stepFreeWheelchairSupported: true,
      limitedMobilitySupported: true,
      walkingAndBoardingRequirement: "Rental kitchen or local restaurant.",
      confirmationStatus: "operator_confirmation_required",
      note: "Check large-party seating accessibility if dining at a local restaurant.",
    },
    transportationAvailability: {
      hotelPickupAvailable: false,
      cruisePortShuttleAvailable: false,
      selfDriveParkingNote: "Self-drive for grocery run or restaurant seating.",
    },
    cancellationTerms: "No catering platform commitment.",
    whaleSightingOrReRidePolicy: "N/A — self-managed meal baseline.",
    indicativePriceUsd: {
      min: 0,
      max: 0,
      basisLabel: "Direct grocery or local restaurant menu cost",
    },
    comparisonValues: {
      marketCoverageStatus: "Available in all 18 vacation-rental markets",
      fulfillmentFinality:
        "Self-controlled grocery prep or direct restaurant reservation",
      kitchenEffort:
        "High kitchen prep/cleanup load (if cooking) or multi-car coordination (if dining out)",
    },
    tradeoffs: {
      strengths: [
        "Works in every market—including all 16 FeastlySpread coverage-request markets where live platform booking is not yet active.",
        "Full control over grocery budget or local restaurant selection.",
      ],
      limitations: [
        "Cooking for 10–25+ people in a rental kitchen requires grocery hauling, undersized cookware management, and cleanup.",
        "Dining out with a large group on peak weekends often splits the party across tables or requires long waits.",
      ],
    },
    claimIds: ["claim-vacation-rental-diy-and-local-dining-baseline"],
    sourceIds: ["src-welcome-to-the-dells-and-brinkberry-2026"],
    bookingDestinations: [
      {
        destinationId: "dest-welcome-to-the-dells-planning",
        optionId: "catering-diy-or-local-dining",
        sellerType: "dcc_owned_specialist",
        sellerName: "Welcome to the Dells",
        actualOperatorName: "Welcome to the Dells",
        label: "Explore Wisconsin Dells Group Planning on Welcome to the Dells",
        url: "https://welcometothedells.com",
        supportedContextParams: ["src"],
        relationshipDisclosure:
          "Welcome to the Dells (welcometothedells.com) is a connected DCC consumer planning property (commercialWeightApplied: 0).",
        isCommercialPartner: true,
        commissionInfluenceOnRanking: 0,
      },
      {
        destinationId: "dest-brinkberry-group-stays",
        optionId: "catering-diy-or-local-dining",
        sellerType: "dcc_owned_specialist",
        sellerName: "Brinkberry",
        actualOperatorName: "Brinkberry",
        label: "Explore Regional Group Stays & Events on Brinkberry",
        url: "https://brinkberry.com",
        supportedContextParams: ["src"],
        relationshipDisclosure:
          "Brinkberry (brinkberry.com) is a connected DCC regional group-stay discovery surface (commercialWeightApplied: 0).",
        isCommercialPartner: true,
        commissionInfluenceOnRanking: 0,
      },
    ],
  },
];

export const VACATION_RENTAL_CATERING_HARD_CONSTRAINT_RULES: HardConstraintRule<VacationRentalCateringSpreadsInput>[] =
  [
    {
      ruleId: "hc-feastly-market-coverage-truth",
      label:
        "FeastlySpread 2 Active Markets vs. 16 Coverage-Request Markets Boundary",
      description:
        "Strictly enforces FEASTLY_SPREAD_MARKETS truth: active booking is only viable in Wisconsin Dells and Door County; in the 16 coverage-request markets, live booking is eliminated and only the coverage-request inquiry + DIY/local dining remain viable.",
      sourceIds: ["src-feastly-spread-site-truth-2026"],
      evaluate: (option, input) => {
        const market = resolveFeastlySpreadMarket(input.destinationMarket);
        if (!market) {
          return { passed: true };
        }

        if (option.optionId === "catering-feastly-active-market") {
          if (!market.hasExistingBookingPath) {
            return {
              passed: false,
              eliminationReason: market.disclosure,
              whatInputChangeWouldAlterResult:
                "Select Wisconsin Dells or Door County for an active FeastlySpread booking path, or use the Coverage Request + Self-Cooked/Local Dining lanes for this market.",
            };
          }
          return { passed: true };
        }

        if (option.optionId === "catering-feastly-coverage-inquiry") {
          if (market.hasExistingBookingPath) {
            return {
              passed: false,
              eliminationReason: `${market.name} already has an active FeastlySpread booking path (${market.checkoutPath}); a coverage-request inquiry is not needed.`,
              whatInputChangeWouldAlterResult:
                "Use the active FeastlySpread booking path for Wisconsin Dells or Door County.",
            };
          }
          return {
            passed: true,
            unknownOrStaleWarning: {
              factId: `feastly-coverage-request-only-${market.slug}`,
              optionId: option.optionId,
              category: "operator_confirmation_required",
              summary: market.disclosure,
              impactOnDecision:
                "Do not rely on a coverage request for guaranteed meal fulfillment; pair with a self-cooked or local restaurant backup plan.",
              sourceIds: ["src-feastly-spread-site-truth-2026"],
            },
            decisionChangingWarning: market.disclosure,
          };
        }

        return { passed: true };
      },
    },
  ];

export const VACATION_RENTAL_CATERING_PREFERENCE_RULES: PreferenceRule<VacationRentalCateringSpreadsInput>[] =
  [
    {
      ruleId: "pref-meal-approach-and-market-fit",
      label: "Meal Approach & Market Readiness Fit",
      maxPoints: 60,
      evaluate: (option, input) => {
        const market = resolveFeastlySpreadMarket(input.destinationMarket);
        if (input.mealApproach === "delivered_in_rental_catering_spread") {
          if (
            option.optionId === "catering-feastly-active-market" &&
            market?.hasExistingBookingPath
          ) {
            return {
              points: 60,
              reason: `${market.name} is one of FeastlySpread's 2 active booking-path markets (${market.checkoutPath}).`,
            };
          }
          if (option.optionId === "catering-diy-or-local-dining") {
            return {
              points: market?.hasExistingBookingPath ? 25 : 50,
              reason: market?.hasExistingBookingPath
                ? "Reliable self-cooked or local restaurant alternative."
                : `Because ${market?.name ?? input.destinationMarket} is a coverage-request market without live FeastlySpread checkout, a self-cooked or local dining plan is the primary actionable meal solution.`,
            };
          }
          if (option.optionId === "catering-feastly-coverage-inquiry") {
            return {
              points: 35,
              reason:
                "Allows you to log market demand for FeastlySpread in this expansion market (does not confirm fulfillment).",
            };
          }
        }

        if (option.optionId === "catering-diy-or-local-dining") {
          return {
            points: 60,
            reason:
              "Directly matches your preference for a self-cooked cabin meal or local restaurant group plan.",
          };
        }
        return {
          points: 20,
          reason: "Alternative group meal lane.",
        };
      },
    },
  ];

function computeVacationRentalCateringTiming(
  option: CandidateOption,
): TimingCalculationResult {
  const activity = option.durationMinutes.activity;
  const transfer = option.durationMinutes.typicalTransferEachWay * 2;
  const total = activity + transfer;
  return {
    availableWindowMinutes: null,
    requiredTotalMinutes: total,
    checkInLeadMinutes: 0,
    transferMinutesRoundTrip: transfer,
    activityMinutes: activity,
    returnBufferMinutes: 0,
    netSlackMinutes: null,
    summary: `${option.durationMinutes.label} (${total} min estimated).`,
  };
}

function customizeFeastlyBookingDestinations(
  option: CandidateOption,
  input: VacationRentalCateringSpreadsInput,
): BookingDestination[] {
  const market = resolveFeastlySpreadMarket(input.destinationMarket);
  if (!market) return option.bookingDestinations;

  if (option.optionId === "catering-feastly-active-market") {
    return option.bookingDestinations.map((dest) => ({
      ...dest,
      label: `Open FeastlySpread ${market.name} Booking Path`,
      url: `https://feastlyspread.com${market.checkoutPath}`,
    }));
  }

  if (option.optionId === "catering-feastly-coverage-inquiry") {
    return option.bookingDestinations.map((dest) => ({
      ...dest,
      label: `Submit ${market.name} Coverage Request (Logs Demand Only)`,
      url: `https://feastlyspread.com${market.checkoutPath}`,
    }));
  }

  return option.bookingDestinations;
}

export const VACATION_RENTAL_CATERING_DECISION_ENGINE: DecisionEngineDefinition<VacationRentalCateringSpreadsInput> =
  {
    engineId: "vacation-rental-catering-spreads",
    version: "1.0.0",
    slug: "wisconsin-dells-large-group-dinner",
    canonicalPath: "/wisconsin-dells-large-group-dinner",
    canonicalUrl:
      "https://destinationcommandcenter.com/wisconsin-dells-large-group-dinner",
    title:
      "Vacation-Rental Group Catering Spreads vs. Local Dining Decision Engine",
    destinationName: "Wisconsin Dells, Door County & 16 Expansion Markets",
    categoryName: "Vacation-Rental Group Catering & Large-Group Dinners",
    heroQuestion:
      "Does your vacation-rental market have an active FeastlySpread booking path, or should you submit a coverage request and plan a self-cooked/local dinner?",
    summaryDescription:
      "High-level portfolio router enforcing FeastlySpread's verified market boundary: 2 active booking-path markets (Wisconsin Dells and Door County) vs. 16 coverage-request markets (where inquiries log market demand only and never confirm fulfillment), alongside self-cooked and local dining baselines.",
    referenceGuide: {
      importantDecisionFactors: [
        {
          title:
            "2 Active Booking-Path Markets vs. 16 Coverage-Request Markets",
          detail:
            "FeastlySpread (feastlyspread.com) has an existing booking path in exactly 2 markets: Wisconsin Dells, WI and Door County, WI. The other 16 listed destinations are coverage-request markets where submitting a request logs market demand only and never confirms catering fulfillment.",
          sourceIds: ["src-feastly-spread-site-truth-2026"],
        },
        {
          title:
            "In-Rental Spread vs. Cooking from Scratch or Splitting Restaurant Tables",
          detail:
            "For groups of 8–30+ in Wisconsin Dells or Door County, an in-rental catering spread avoids multi-car restaurant waits and heavy cabin kitchen cleanup.",
          sourceIds: [
            "src-feastly-spread-site-truth-2026",
            "src-welcome-to-the-dells-and-brinkberry-2026",
          ],
        },
      ],
      experienceAndVesselTypes: [
        {
          typeName:
            "FeastlySpread Active Booking Path (Wisconsin Dells & Door County)",
          capacityAndStability: "In-rental group catering spread",
          bestFor:
            "Large cabin/house groups in Wisconsin Dells or Door County wanting a shared meal at the rental",
          limitations:
            "Only active in Wisconsin Dells and Door County",
          sourceIds: ["src-feastly-spread-site-truth-2026"],
        },
        {
          typeName:
            "FeastlySpread Market Coverage Request (16 Expansion Markets)",
          capacityAndStability: "Demand inquiry only",
          bestFor:
            "Signaling future demand in Gatlinburg, Lake Tahoe, Outer Banks, Destin, Big Bear, Branson, Broken Bow, Lake of the Ozarks, Scottsdale, Nashville, Hamptons, Lake Geneva, Minocqua, Gulf Shores, Myrtle Beach, or Park City",
          limitations:
            "Never confirms live catering fulfillment; requires a self-cooked or local restaurant dinner plan",
          sourceIds: ["src-feastly-spread-site-truth-2026"],
        },
        {
          typeName: "Self-Cooked Rental Meal or Local Group Dining",
          capacityAndStability: "Rental kitchen or local restaurant seating",
          bestFor:
            "All 18 markets when cooking in-cabin or booking local dining",
          limitations: "Requires grocery prep/cleanup or advance restaurant table coordination",
          sourceIds: ["src-welcome-to-the-dells-and-brinkberry-2026"],
        },
      ],
      departureLocations: [
        {
          islandOrRegion: "Wisconsin Dells & Door County, WI (Active Markets)",
          harborOrArea: "Vacation Rental Properties",
          logisticsNote:
            "Existing booking paths at feastlyspread.com/book?market=wisconsin-dells and feastlyspread.com/book?market=door-county.",
          sourceIds: ["src-feastly-spread-site-truth-2026"],
        },
      ],
      commonTradeoffs: [
        {
          tradeoff: "In-Rental Catering vs. Peak-Night Restaurant Waits",
          explanation:
            "Eating at the rental keeps the whole group at one table on their own schedule, while dining out removes kitchen cleanup at the cost of splitting large tables.",
        },
      ],
      operationalDependencies: [
        {
          dependency: "Market Coverage Verification",
          impact:
            "Always verify whether your destination is one of the 2 active FeastlySpread markets or one of the 16 coverage-request markets before counting on platform catering.",
          sourceIds: ["src-feastly-spread-site-truth-2026"],
        },
      ],
      methodologySteps: [
        "Resolve the selected market against FEASTLY_SPREAD_MARKETS in lib/dcc/portfolioNetworkRegistry.ts.",
        "Eliminate live FeastlySpread booking in all 16 coverage-request markets so travelers are never misled about fulfillment.",
        "Retain the self-cooked and local dining baseline across all 18 markets with zero commercial bias.",
      ],
    },
    questions: VACATION_RENTAL_CATERING_QUESTIONS,
    answerSchema: VACATION_RENTAL_CATERING_ANSWER_SCHEMA,
    defaultExampleInput: VACATION_RENTAL_CATERING_DEFAULT_EXAMPLE_INPUT,
    comparisonDimensions: VACATION_RENTAL_CATERING_COMPARISON_DIMENSIONS,
    candidateOptions: VACATION_RENTAL_CATERING_CANDIDATE_OPTIONS,
    hardConstraintRules: VACATION_RENTAL_CATERING_HARD_CONSTRAINT_RULES,
    preferenceRules: VACATION_RENTAL_CATERING_PREFERENCE_RULES,
    evidenceClaims: VACATION_RENTAL_CATERING_EVIDENCE_CLAIMS,
    sourceRecords: VACATION_RENTAL_CATERING_SOURCE_RECORDS,
    computeTimingForOption: (opt) => computeVacationRentalCateringTiming(opt),
    customizeBookingDestinations: (opt, input) =>
      customizeFeastlyBookingDestinations(opt, input),
    isExampleScenarioDetector: (rawInput, normalized) => {
      const isExample =
        rawInput === undefined ||
        rawInput === null ||
        normalized.travelDate === null;
      return {
        isExample,
        banner: isExample
          ? "Example Scenario Shown: Group of 12 in Wisconsin Dells (one of FeastlySpread's 2 active booking-path markets). Select any of the 18 markets to check active booking vs. coverage-request status."
          : null,
        missingInputFacts:
          normalized.travelDate === null
            ? [
                {
                  factId: "missing-catering-dinner-date",
                  optionId: null,
                  category: "missing_traveler_input",
                  summary: "Dinner date not provided.",
                  impactOnDecision:
                    "In active markets (Wisconsin Dells and Door County), date selection is required at checkout.",
                  sourceIds: ["src-feastly-spread-site-truth-2026"],
                },
              ]
            : [],
      };
    },
    evaluate: (rawInput: unknown, options?: DecisionEvaluateOptions) =>
      evaluateDecisionEngine(
        VACATION_RENTAL_CATERING_DECISION_ENGINE,
        rawInput,
        options,
      ),
  };
