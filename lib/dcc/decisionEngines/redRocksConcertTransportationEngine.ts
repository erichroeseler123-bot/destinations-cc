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
  UnknownOrStaleFact,
} from "@/lib/dcc/decisionEngines/types";

export type RedRocksPickupZone =
  | "downtown_denver_rino"
  | "golden_west_metro"
  | "south_denver_tech_center";

export interface RedRocksConcertTransportationInput {
  pickupZone: RedRocksPickupZone;
  travelDate: string | null;
  groupSize: number;
  mobilityAndStairPreference:
    | "standard_amphitheatre_stairs"
    | "minimize_uphill_lot_hike"
    | "step_free_top_circle_drop";
  wantsTailgateAndCoolerStorage: boolean;
  postEncorePriority:
    | "guaranteed_waiting_private_driver"
    | "accept_jurassic_lot_rideshare_queue"
    | "lowest_cash_outlay_diy";
  hasSoberDesignatedDriver: boolean;
  maxBudgetPerPersonUsd: number | null;
}

export const RED_ROCKS_CONCERT_DEFAULT_EXAMPLE_INPUT: RedRocksConcertTransportationInput =
  {
    pickupZone: "downtown_denver_rino",
    travelDate: null,
    groupSize: 6,
    mobilityAndStairPreference: "minimize_uphill_lot_hike",
    wantsTailgateAndCoolerStorage: true,
    postEncorePriority: "guaranteed_waiting_private_driver",
    hasSoberDesignatedDriver: false,
    maxBudgetPerPersonUsd: null,
  };

const ymdRegex = /^\d{4}-\d{2}-\d{2}$/;

export const RED_ROCKS_CONCERT_ANSWER_SCHEMA = z
  .object({
    pickupZone: z
      .enum([
        "downtown_denver_rino",
        "golden_west_metro",
        "south_denver_tech_center",
      ])
      .default(RED_ROCKS_CONCERT_DEFAULT_EXAMPLE_INPUT.pickupZone),
    travelDate: z
      .string()
      .regex(ymdRegex, "travelDate must be YYYY-MM-DD when provided")
      .nullable()
      .default(RED_ROCKS_CONCERT_DEFAULT_EXAMPLE_INPUT.travelDate),
    groupSize: z
      .number()
      .int()
      .min(1)
      .max(10)
      .default(RED_ROCKS_CONCERT_DEFAULT_EXAMPLE_INPUT.groupSize),
    mobilityAndStairPreference: z
      .enum([
        "standard_amphitheatre_stairs",
        "minimize_uphill_lot_hike",
        "step_free_top_circle_drop",
      ])
      .default(
        RED_ROCKS_CONCERT_DEFAULT_EXAMPLE_INPUT.mobilityAndStairPreference,
      ),
    wantsTailgateAndCoolerStorage: z
      .boolean()
      .default(
        RED_ROCKS_CONCERT_DEFAULT_EXAMPLE_INPUT.wantsTailgateAndCoolerStorage,
      ),
    postEncorePriority: z
      .enum([
        "guaranteed_waiting_private_driver",
        "accept_jurassic_lot_rideshare_queue",
        "lowest_cash_outlay_diy",
      ])
      .default(RED_ROCKS_CONCERT_DEFAULT_EXAMPLE_INPUT.postEncorePriority),
    hasSoberDesignatedDriver: z
      .boolean()
      .default(
        RED_ROCKS_CONCERT_DEFAULT_EXAMPLE_INPUT.hasSoberDesignatedDriver,
      ),
    maxBudgetPerPersonUsd: z
      .number()
      .int()
      .min(0)
      .max(600)
      .nullable()
      .default(RED_ROCKS_CONCERT_DEFAULT_EXAMPLE_INPUT.maxBudgetPerPersonUsd),
  })
  .strict();

export const RED_ROCKS_CONCERT_SOURCE_RECORDS: SourceRecord[] = [
  {
    sourceId: "src-red-rocks-official-parking-egress-2026",
    sourceOrganization:
      "Red Rocks Park & Amphitheatre (City and County of Denver)",
    sourceTitle:
      "Red Rocks Official Parking Lots ($0 General Parking, Opens 2h Before Doors), Jurassic Lot Rideshare Geofence (Entrance 2 / Hwy 93) & ADA Top Circle Rules",
    sourceUrl: "https://www.redrocksonline.com/plan-your-visit/getting-here/",
    claimsSupported: [
      "claim-rr-lots-and-jurassic-rideshare",
      "claim-rr-ada-top-circle-shuttle",
    ],
    retrievedAt: "2026-10-20T00:00:00.000Z",
    verifiedAt: "2026-10-20T00:00:00.000Z",
    expiresAt: "2027-06-01T00:00:00.000Z",
    freshnessCategory: "regulatory_annual",
    status: "current",
  },
  {
    sourceId: "src-party-at-red-rocks-tariff-2026",
    sourceOrganization: "Party at Red Rocks",
    sourceTitle:
      "Party at Red Rocks Private Concert Charter Tariff ($399 Private Suburban up to 6 Guests / $599 Private Van up to 10 Guests; shared_seat_service: false)",
    sourceUrl: "https://www.partyatredrocks.com",
    claimsSupported: ["claim-rr-parr-private-pricing-and-wait"],
    retrievedAt: "2026-10-20T00:00:00.000Z",
    verifiedAt: "2026-10-20T00:00:00.000Z",
    expiresAt: "2027-06-01T00:00:00.000Z",
    freshnessCategory: "operator_tariff_and_policy",
    status: "current",
  },
  {
    sourceId: "src-rtd-denver-w-line-golden-2026",
    sourceOrganization: "Regional Transportation District (RTD Denver)",
    sourceTitle:
      "RTD W Line Terminus at Jefferson County Government Center–Golden (6.2–6.5 Miles North of Red Rocks; No Connecting Bus Into Red Rocks Park)",
    sourceUrl: "https://www.rtd-denver.com/",
    claimsSupported: ["claim-rr-rtd-no-park-bus"],
    retrievedAt: "2026-10-20T00:00:00.000Z",
    verifiedAt: "2026-10-20T00:00:00.000Z",
    expiresAt: "2027-06-01T00:00:00.000Z",
    freshnessCategory: "regulatory_annual",
    status: "current",
  },
];

export const RED_ROCKS_CONCERT_EVIDENCE_CLAIMS: EvidenceClaim[] = [
  {
    claimId: "claim-rr-lots-and-jurassic-rideshare",
    classification: "official_rule",
    statement:
      "Red Rocks general concert parking is $0.00 and opens 2 hours before doors, but Upper lots fill 60–90+ minutes before doors; late arrivals park in Lower South or Jurassic lots requiring 150 to 380+ stairs of uphill climbing at 6,450 ft elevation and a 35–60 minute post-encore canyon exit. Post-concert rideshare pickup is prohibited at Top Circle/Upper North and geofenced to the Jurassic Lot (Entrance 2 off Hwy 93) and Lower South Lot, with typical 60–90+ minute post-encore wait queues and $85–$160+ surge pricing ($30–$45 inbound).",
    fieldsSupported: ["mobilityAndStairPreference", "postEncorePriority"],
    sourceIds: ["src-red-rocks-official-parking-egress-2026"],
    isDecisionChanging: true,
    verificationNote:
      "Verified against City and County of Denver Red Rocks Getting Here rules and DCC pre-site guide.",
  },
  {
    claimId: "claim-rr-ada-top-circle-shuttle",
    classification: "official_rule",
    statement:
      "Visitors with disabilities or limited mobility may use the Top Circle / Upper North drop-off or the official Red Rocks ADA shuttle from Lower South Lot.",
    fieldsSupported: ["mobilityAndStairPreference"],
    sourceIds: ["src-red-rocks-official-parking-egress-2026"],
    isDecisionChanging: true,
    verificationNote: "Verified against official Red Rocks accessibility guide.",
  },
  {
    claimId: "claim-rr-parr-private-pricing-and-wait",
    classification: "operator_published_fact",
    statement:
      "Party at Red Rocks operates 100% private round-trip concert transportation (shared_seat_service: false; $399 flat for a private full-size Chevrolet Suburban up to 6 guests, and $599 flat for a private van up to 10 guests) where the dedicated driver remains on-site through the final encore with tailgate cooler storage included.",
    fieldsSupported: [
      "groupSize",
      "wantsTailgateAndCoolerStorage",
      "indicativePriceUsd",
    ],
    sourceIds: ["src-party-at-red-rocks-tariff-2026"],
    isDecisionChanging: true,
    verificationNote:
      "Verified against lib/dcc/siteTruth.ts (shared_seat_service: false, suburban_usd: 399, van_usd: 599) and src/data/pre-site-guides.ts.",
  },
  {
    claimId: "claim-rr-rtd-no-park-bus",
    classification: "official_rule",
    statement:
      "RTD public transit ($2.75 local fare) does NOT enter Red Rocks Park: the W Line light rail terminates ~6.2–6.5 miles north at Jefferson County Government Center–Golden with no connecting bus and no safe pedestrian walkway along CO-93/CO-74 after dark.",
    fieldsSupported: ["tradeoffs"],
    sourceIds: ["src-rtd-denver-w-line-golden-2026"],
    isDecisionChanging: true,
    verificationNote:
      "Verified against RTD Denver system map and src/data/pre-site-guides.ts.",
  },
];

export const RED_ROCKS_CONCERT_CANDIDATE_OPTIONS: CandidateOption[] = [
  {
    optionId: "rr-parr-private-suburban-6pax",
    title:
      "Party at Red Rocks Private Full-Size Suburban ($399 Flat Round-Trip, 1–6 Guests)",
    shortLabel: "Party at Red Rocks Private Suburban ($399 / 1–6 Pax)",
    optionKind: "owned_specialist_comparison",
    actualOperators: ["Party at Red Rocks"],
    islandsOrRegions: ["morrison_red_rocks"],
    departureAreas: [
      "downtown_denver_rino",
      "golden_west_metro",
      "south_denver_tech_center",
    ],
    operatingMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    scheduleVerifiedThroughDate: "2027-10-31",
    vesselOrVehicleType:
      "100% Private Full-Size Chevrolet Suburban (Up to 6 Guests)",
    groupCapacityRange: {
      min: 1,
      max: 6,
      label: "1–6 passengers ($66.50/person round-trip at 6 guests)",
    },
    rideComfortLevel: "high_stability",
    viewingSpaceDescription:
      "100% private door-to-door pickup at your Denver/Golden hotel or residence, pre-show tailgate cooler storage inside the Suburban, and a dedicated driver parked on-site through the final encore.",
    durationMinutes: {
      activity: 300,
      checkInLead: 10,
      typicalTransferEachWay: 35,
      totalDockOrHotelRange: { min: 300, max: 390 },
      label: "25–35 min each way + dedicated on-site wait during entire show",
    },
    minimumAgeYears: 0,
    minimumAgeNote: "All ages welcome.",
    prohibitsPregnantOrSpinalConditions: false,
    accessibilityProfile: {
      stepFreeWheelchairSupported: true,
      limitedMobilitySupported: true,
      walkingAndBoardingRequirement:
        "Can drop off at Top Circle / Upper North Lot to minimize uphill stair climbing at 6,450 ft elevation.",
      confirmationStatus: "confirmed_accessible",
      note: "Folding wheelchair stows in Suburban cargo bay; Top Circle drop-off supported.",
    },
    transportationAvailability: {
      hotelPickupAvailable: true,
      cruisePortShuttleAvailable: false,
      selfDriveParkingNote:
        "Dedicated driver stays on-site; eliminates the downhill Jurassic Lot rideshare walk and post-encore surge queue.",
    },
    cancellationTerms: "Published private charter terms on partyatredrocks.com.",
    whaleSightingOrReRidePolicy:
      "Guaranteed waiting private vehicle on-site—even if the concert pauses for a lightning hold or runs past midnight.",
    indicativePriceUsd: {
      min: 67,
      max: 399,
      basisLabel:
        "$399 flat round-trip for the private Suburban ($66.50/person at 6 guests)",
    },
    comparisonValues: {
      serviceModel: "100% Private Door-to-Door Suburban ($399 flat)",
      postEncoreExit: "Dedicated Driver Parked On-Site (Zero Surge / Zero Queue)",
      lotAndStairImpact: "Upper Lot / Top Circle Drop-Off",
      tailgateCoolerPolicy: "Coolers & Tailgate Gear Stowed in Vehicle",
    },
    tradeoffs: {
      strengths: [
        "Eliminates the #1 Red Rocks failure mode: waiting 60–90+ minutes after midnight in the Jurassic Lot rideshare bottleneck",
        "At 5–6 guests ($66.50–$79.80/person round-trip), delivers 100% private door-to-door service, cooler storage, and a guaranteed waiting driver",
      ],
      limitations: [
        "Higher per-person cost for solo concertgoers or couples ($199.50/person for 2 guests)",
        "Capped at 6 passengers (groups of 7–10 require the $599 private van)",
      ],
    },
    claimIds: [
      "claim-rr-lots-and-jurassic-rideshare",
      "claim-rr-ada-top-circle-shuttle",
      "claim-rr-parr-private-pricing-and-wait",
    ],
    sourceIds: [
      "src-red-rocks-official-parking-egress-2026",
      "src-party-at-red-rocks-tariff-2026",
    ],
    bookingDestinations: [
      {
        destinationId: "dest-parr-private-suburban",
        optionId: "rr-parr-private-suburban-6pax",
        sellerType: "dcc_owned_specialist",
        sellerName: "Party at Red Rocks",
        actualOperatorName: "Party at Red Rocks",
        label: "Book Private $399 Suburban on Party at Red Rocks",
        url: "https://www.partyatredrocks.com/book/red-rocks-amphitheatre/private",
        supportedContextParams: ["date", "partySize"],
        relationshipDisclosure:
          "Party at Red Rocks (partyatredrocks.com) is a DCC portfolio private concert transportation operator (shared_seat_service: false).",
        isCommercialPartner: true,
        commissionInfluenceOnRanking: 0,
      },
    ],
  },
  {
    optionId: "rr-parr-private-van-10pax",
    title:
      "Party at Red Rocks Private Group Van ($599 Flat Round-Trip, 7–10 Guests)",
    shortLabel: "Party at Red Rocks Private Van ($599 / Up to 10 Pax)",
    optionKind: "private_charter",
    actualOperators: ["Party at Red Rocks"],
    islandsOrRegions: ["morrison_red_rocks"],
    departureAreas: [
      "downtown_denver_rino",
      "golden_west_metro",
      "south_denver_tech_center",
    ],
    operatingMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    scheduleVerifiedThroughDate: "2027-10-31",
    vesselOrVehicleType:
      "100% Private 10-Passenger Concert Van ($599 Flat Round-Trip)",
    groupCapacityRange: {
      min: 1,
      max: 10,
      label: "Up to 10 passengers ($59.90/person round-trip at 10 guests)",
    },
    rideComfortLevel: "high_stability",
    viewingSpaceDescription:
      "100% private group van charter with custom pickup time, pre-show lot tailgating, cooler storage, and immediate post-encore departure.",
    durationMinutes: {
      activity: 300,
      checkInLead: 10,
      typicalTransferEachWay: 35,
      totalDockOrHotelRange: { min: 300, max: 390 },
      label: "25–35 min each way + dedicated on-site wait",
    },
    minimumAgeYears: 0,
    minimumAgeNote: "All ages welcome.",
    prohibitsPregnantOrSpinalConditions: false,
    accessibilityProfile: {
      stepFreeWheelchairSupported: false,
      limitedMobilitySupported: true,
      walkingAndBoardingRequirement:
        "Upper lot drop-off available; step-in van boarding.",
      confirmationStatus: "operator_confirmation_required",
      note: "Contact operator in advance if storing a collapsible wheelchair.",
    },
    transportationAvailability: {
      hotelPickupAvailable: true,
      cruisePortShuttleAvailable: false,
      selfDriveParkingNote: "Dedicated charter van waits on-site through encore.",
    },
    cancellationTerms: "Published private charter terms on partyatredrocks.com.",
    whaleSightingOrReRidePolicy:
      "Driver stays on-site for immediate shelter during lightning holds and post-show egress.",
    indicativePriceUsd: {
      min: 60,
      max: 599,
      basisLabel:
        "$599 flat round-trip for the private van ($59.90/person at 10 guests)",
    },
    comparisonValues: {
      serviceModel: "100% Private 10-Pax Group Van ($599 flat)",
      postEncoreExit: "Dedicated Driver Parked On-Site (Immediate Group Exit)",
      lotAndStairImpact: "Upper Lot Drop-Off & Tailgate Base",
      tailgateCoolerPolicy: "Full Cooler & Tailgate Storage Included",
    },
    tradeoffs: {
      strengths: [
        "Keeps 7–10 concertgoers together in a single private door-to-door vehicle for $59.90–$85.57/person round-trip",
        "Provides an on-site weather shelter if a lightning delay hits during the show",
      ],
      limitations: [
        "Too large/expensive for solo travelers or couples",
        "Single-van capacity is capped at 10 guests",
      ],
    },
    claimIds: [
      "claim-rr-lots-and-jurassic-rideshare",
      "claim-rr-parr-private-pricing-and-wait",
    ],
    sourceIds: [
      "src-red-rocks-official-parking-egress-2026",
      "src-party-at-red-rocks-tariff-2026",
    ],
    bookingDestinations: [
      {
        destinationId: "dest-parr-private-van",
        optionId: "rr-parr-private-van-10pax",
        sellerType: "dcc_owned_specialist",
        sellerName: "Party at Red Rocks",
        actualOperatorName: "Party at Red Rocks",
        label: "Book Private $599 Group Van on Party at Red Rocks",
        url: "https://www.partyatredrocks.com/book/red-rocks-amphitheatre/private",
        supportedContextParams: ["date", "partySize"],
        relationshipDisclosure:
          "Party at Red Rocks (partyatredrocks.com) is a DCC portfolio private concert transportation operator (shared_seat_service: false).",
        isCommercialPartner: true,
        commissionInfluenceOnRanking: 0,
      },
    ],
  },
  {
    optionId: "rr-rideshare-jurassic-lot",
    title:
      "On-Demand Rideshare — Uber / Lyft via Jurassic Lot Geofence ($30–$45 In / $85–$160+ Out)",
    shortLabel: "Uber / Lyft Rideshare (Jurassic Lot Queue)",
    optionKind: "guided_commercial",
    actualOperators: ["Uber", "Lyft"],
    islandsOrRegions: ["morrison_red_rocks"],
    departureAreas: [
      "downtown_denver_rino",
      "golden_west_metro",
      "south_denver_tech_center",
    ],
    operatingMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    scheduleVerifiedThroughDate: "2027-12-31",
    vesselOrVehicleType: "On-Demand App Rideshare (4–6 Pax per Vehicle)",
    groupCapacityRange: {
      min: 1,
      max: 6,
      label: "1–4 pax (UberX) or up to 6 pax (UberXL)",
    },
    rideComfortLevel: "high_stability",
    viewingSpaceDescription:
      "Easy inbound drop-off before the show ($30–$45 from Denver), but post-encore pickup is prohibited at Upper North/Top Circle and geofenced strictly to the Jurassic Lot (Entrance 2 / Hwy 93) and Lower South Lot.",
    durationMinutes: {
      activity: 300,
      checkInLead: 15,
      typicalTransferEachWay: 60,
      totalDockOrHotelRange: { min: 360, max: 465 },
      label:
        "25–35m inbound + 60–90+ min post-encore Jurassic Lot queue & downhill walk",
    },
    minimumAgeYears: 0,
    minimumAgeNote: "Requires adult account holder.",
    prohibitsPregnantOrSpinalConditions: false,
    accessibilityProfile: {
      stepFreeWheelchairSupported: false,
      limitedMobilitySupported: false,
      walkingAndBoardingRequirement:
        "Post-show pickup requires walking down steep dark road grades to the Jurassic Lot at Entrance 2 / Hwy 93.",
      confirmationStatus: "not_accessible",
      note: "Post-show pickups are prohibited at Top Circle; the downhill trek to Jurassic Lot is unsuitable for limited mobility.",
    },
    transportationAvailability: {
      hotelPickupAvailable: true,
      cruisePortShuttleAvailable: false,
      selfDriveParkingNote:
        "Post-show rideshare geofenced to Jurassic Lot (Entrance 2 / Hwy 93) and Lower South Lot.",
    },
    cancellationTerms: "On-demand app dispatch (no guaranteed return vehicle).",
    whaleSightingOrReRidePolicy:
      "Subject to cellular congestion, driver cancellations, and $85–$160+ post-encore surge pricing.",
    indicativePriceUsd: {
      min: 115,
      max: 205,
      basisLabel:
        "per vehicle round-trip ($30–$45 inbound + $85–$160+ post-encore surge)",
    },
    comparisonValues: {
      serviceModel: "On-Demand App Rideshare (No Guaranteed Return)",
      postEncoreExit:
        "60–90+ Min Jurassic Lot Queue + $85–$160+ Surge Pricing",
      lotAndStairImpact:
        "Inbound Upper Drop; Outbound Long Downhill Walk to Jurassic Lot",
      tailgateCoolerPolicy:
        "No Vehicle Storage During Show (Hard Coolers Prohibited Inside Venue)",
    },
    tradeoffs: {
      strengths: [
        "Flexible inbound departure time from Denver ($30–$45 one-way inbound) with no advance reservation required",
      ],
      limitations: [
        "Severe post-encore failure mode: pickups are prohibited at Top Circle and forced down to the Jurassic Lot (Hwy 93) with 60–90+ minute queues and $85–$160+ surge fares",
        "No vehicle stays on-site, so you cannot store a tailgate cooler or take shelter during a thunderstorm hold",
      ],
    },
    claimIds: ["claim-rr-lots-and-jurassic-rideshare"],
    sourceIds: ["src-red-rocks-official-parking-egress-2026"],
    bookingDestinations: [
      {
        destinationId: "dest-rr-official-rideshare-rules",
        optionId: "rr-rideshare-jurassic-lot",
        sellerType: "public_or_diy",
        sellerName: "Red Rocks Park & Amphitheatre (Official Rideshare Map)",
        actualOperatorName: "City and County of Denver",
        label: "Review Official Red Rocks Jurassic Lot Rideshare Rules",
        url: "https://www.redrocksonline.com/plan-your-visit/getting-here/",
        supportedContextParams: [],
        relationshipDisclosure:
          "Official City and County of Denver venue logistics page; zero commercial bias.",
        isCommercialPartner: false,
        commissionInfluenceOnRanking: 0,
      },
    ],
  },
  {
    optionId: "rr-self-drive-general-parking-free",
    title:
      "Self-Drive with Sober Designated Driver ($0.00 Official Red Rocks Parking)",
    shortLabel: "Self-Drive ($0.00 Free General Parking)",
    optionKind: "public_or_diy",
    actualOperators: ["Red Rocks Park & Amphitheatre (City and County of Denver)"],
    islandsOrRegions: ["morrison_red_rocks"],
    departureAreas: [
      "downtown_denver_rino",
      "golden_west_metro",
      "south_denver_tech_center",
    ],
    operatingMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    scheduleVerifiedThroughDate: "2027-12-31",
    vesselOrVehicleType: "Personal or Rental Vehicle",
    groupCapacityRange: {
      min: 1,
      max: 8,
      label: "Personal vehicle capacity",
    },
    rideComfortLevel: "high_stability",
    viewingSpaceDescription:
      "Free ($0.00) official park lots (Upper North, Upper South, Lower North, Lower South, Jurassic) opening 2 hours before doors.",
    durationMinutes: {
      activity: 300,
      checkInLead: 90,
      typicalTransferEachWay: 45,
      totalDockOrHotelRange: { min: 360, max: 450 },
      label:
        "Arrive 60–90+ min before doors for Upper lots + 35–60 min post-show canyon exit",
    },
    minimumAgeYears: 0,
    minimumAgeNote: "Requires a licensed, 100% sober designated driver.",
    prohibitsPregnantOrSpinalConditions: false,
    accessibilityProfile: {
      stepFreeWheelchairSupported: true,
      limitedMobilitySupported: true,
      walkingAndBoardingRequirement:
        "Valid state ADA placard required for Upper North / Top Circle accessible spaces (or use Lower South ADA shuttle). Late arrival without placard requires climbing 150–380+ stairs from lower lots.",
      confirmationStatus: "confirmed_accessible",
      note: "Upper lots fill 60–90+ minutes before doors; Lower South and Jurassic lots require 150–380+ stairs at 6,450 ft elevation.",
    },
    transportationAvailability: {
      hotelPickupAvailable: false,
      cruisePortShuttleAvailable: false,
      selfDriveParkingNote:
        "General concert parking is $0.00; vehicles left overnight past 2:00 AM / next morning face ticketing or towing.",
    },
    cancellationTerms: "Free public park access.",
    whaleSightingOrReRidePolicy: "Self-managed schedule.",
    indicativePriceUsd: {
      min: 0,
      max: 25,
      basisLabel: "$0.00 general parking (+ fuel/rental car)",
    },
    comparisonValues: {
      serviceModel: "Self-Drive ($0.00 Official Park Lots)",
      postEncoreExit: "35–60 Min Single-Lane Canyon Lot Exit Queue",
      lotAndStairImpact:
        "Upper Lot If Arriving 60–90+ Min Before Doors; Else 150–380+ Stairs",
      tailgateCoolerPolicy: "Full Lot Tailgating & Cooler Storage Permitted",
    },
    tradeoffs: {
      strengths: [
        "$0.00 general parking fee and full freedom to bring coolers and tailgate in the lot",
      ],
      limitations: [
        "Strictly requires a 100% sober designated driver navigating steep, dark Morrison canyon roads after the encore",
        "Upper lots fill 60–90+ minutes before doors; late arrivals climb 150–380+ stairs at 6,450 ft and face a 35–60 minute post-show canyon exit",
      ],
    },
    claimIds: [
      "claim-rr-lots-and-jurassic-rideshare",
      "claim-rr-ada-top-circle-shuttle",
    ],
    sourceIds: ["src-red-rocks-official-parking-egress-2026"],
    bookingDestinations: [
      {
        destinationId: "dest-red-rocks-official-parking",
        optionId: "rr-self-drive-general-parking-free",
        sellerType: "public_or_diy",
        sellerName: "Red Rocks Park & Amphitheatre (Official)",
        actualOperatorName: "City and County of Denver",
        label: "View Official Red Rocks Parking & Lot Map",
        url: "https://www.redrocksonline.com/plan-your-visit/getting-here/",
        supportedContextParams: [],
        relationshipDisclosure:
          "Official City and County of Denver venue resource; zero commercial bias.",
        isCommercialPartner: false,
        commissionInfluenceOnRanking: 0,
      },
    ],
  },
];

export const RED_ROCKS_CONCERT_QUESTIONS: QuestionDefinition[] = [
  {
    questionId: "groupSize",
    label: "Concert group size",
    helpText:
      "Party at Red Rocks Private Suburbans ($399) fit up to 6 guests; Private Vans ($599) fit up to 10 guests.",
    inputType: "number",
    requiredForPersonalizedVerdict: true,
    decisionImpactExplanation:
      "At 5–6 guests, a private $399 Suburban is $66.50–$79.80/person round-trip; at 7–10 guests, the $599 private van is $59.90–$85.57/person.",
    drivenByClaimIds: ["claim-rr-parr-private-pricing-and-wait"],
    min: 1,
    max: 10,
    defaultValue: RED_ROCKS_CONCERT_DEFAULT_EXAMPLE_INPUT.groupSize,
  },
  {
    questionId: "hasSoberDesignatedDriver",
    label: "Do you have a car and a 100% sober designated driver?",
    helpText:
      "Self-driving requires navigating dark canyon roads out of Morrison after the encore.",
    inputType: "boolean",
    requiredForPersonalizedVerdict: true,
    decisionImpactExplanation:
      "Eliminates self-drive parking when your group does not have a vehicle and dedicated sober driver.",
    drivenByClaimIds: ["claim-rr-lots-and-jurassic-rideshare"],
    defaultValue:
      RED_ROCKS_CONCERT_DEFAULT_EXAMPLE_INPUT.hasSoberDesignatedDriver,
  },
  {
    questionId: "wantsTailgateAndCoolerStorage",
    label: "Bringing a cooler or tailgate gear to store during the show?",
    helpText:
      "Hard coolers are prohibited inside Red Rocks Amphitheatre and cannot be left with on-demand Uber/Lyft drivers.",
    inputType: "boolean",
    requiredForPersonalizedVerdict: false,
    decisionImpactExplanation:
      "Eliminates on-demand rideshare if you need a vehicle on-site to store a cooler during the concert.",
    drivenByClaimIds: ["claim-rr-parr-private-pricing-and-wait"],
    defaultValue:
      RED_ROCKS_CONCERT_DEFAULT_EXAMPLE_INPUT.wantsTailgateAndCoolerStorage,
  },
  {
    questionId: "mobilityAndStairPreference",
    label: "Stair & uphill lot hike tolerance (6,450 ft elevation)",
    helpText:
      "Lower South and Jurassic lots require climbing 150 to 380+ stairs.",
    inputType: "select",
    requiredForPersonalizedVerdict: false,
    decisionImpactExplanation:
      "Eliminates Jurassic Lot rideshare walk when step-free Top Circle drop-off is required.",
    drivenByClaimIds: [
      "claim-rr-lots-and-jurassic-rideshare",
      "claim-rr-ada-top-circle-shuttle",
    ],
    options: [
      {
        value: "standard_amphitheatre_stairs",
        label: "Standard — comfortable with 150–380+ lot stairs",
      },
      {
        value: "minimize_uphill_lot_hike",
        label: "Minimize uphill climb (prefer Upper Lot / Top Circle drop-off)",
      },
      {
        value: "step_free_top_circle_drop",
        label: "Step-free / Top Circle accessible drop-off required",
      },
    ],
    defaultValue:
      RED_ROCKS_CONCERT_DEFAULT_EXAMPLE_INPUT.mobilityAndStairPreference,
  },
  {
    questionId: "postEncorePriority",
    label: "Post-encore exit priority",
    helpText:
      "How do you want the end of the night to work when 9,525 attendees exit at once?",
    inputType: "select",
    requiredForPersonalizedVerdict: false,
    decisionImpactExplanation:
      "Weights dedicated on-site waiting private vehicles vs. Jurassic Lot rideshare queues vs. $0.00 self-drive.",
    drivenByClaimIds: [
      "claim-rr-lots-and-jurassic-rideshare",
      "claim-rr-parr-private-pricing-and-wait",
    ],
    options: [
      {
        value: "guaranteed_waiting_private_driver",
        label:
          "Dedicated private driver parked on-site waiting through the encore",
      },
      {
        value: "accept_jurassic_lot_rideshare_queue",
        label:
          "Willing to walk to Jurassic Lot and wait 60–90+ min for Uber/Lyft",
      },
      {
        value: "lowest_cash_outlay_diy",
        label: "Lowest cash cost ($0.00 general parking with sober driver)",
      },
    ],
    defaultValue: RED_ROCKS_CONCERT_DEFAULT_EXAMPLE_INPUT.postEncorePriority,
  },
];

export const RED_ROCKS_CONCERT_COMPARISON_DIMENSIONS: ComparisonDimension[] = [
  {
    dimensionId: "serviceModel",
    label: "Service Model & Verified Pricing",
    description:
      "100% private flat-rate charter ($399 Suburban / $599 Van) vs. rideshare vs. $0.00 self-drive.",
  },
  {
    dimensionId: "postEncoreExit",
    label: "Post-Encore Exit Reality",
    description: "How you leave Morrison when 9,525 attendees exit at once.",
  },
  {
    dimensionId: "lotAndStairImpact",
    label: "Elevation & Stair Impact (6,450 ft)",
    description:
      "Upper Lot / Top Circle drop-off vs. 150–380+ stairs from Lower/Jurassic lots.",
  },
  {
    dimensionId: "tailgateCoolerPolicy",
    label: "Tailgating & Cooler Storage",
    description: "Whether coolers and tailgate gear can stay in a vehicle.",
  },
];

function computeRedRocksTiming(
  option: CandidateOption,
): TimingCalculationResult {
  const requiredTotalMinutes =
    option.durationMinutes.activity +
    option.durationMinutes.checkInLead +
    option.durationMinutes.typicalTransferEachWay * 2;
  return {
    availableWindowMinutes: 480,
    requiredTotalMinutes,
    checkInLeadMinutes: option.durationMinutes.checkInLead,
    transferMinutesRoundTrip: option.durationMinutes.typicalTransferEachWay * 2,
    activityMinutes: option.durationMinutes.activity,
    returnBufferMinutes: 30,
    netSlackMinutes: 480 - requiredTotalMinutes,
    summary: `Round-trip concert block: ~${Math.round((requiredTotalMinutes / 60) * 10) / 10} hours including ${option.durationMinutes.typicalTransferEachWay}m each-way transfer/egress and ${option.durationMinutes.checkInLead}m pre-doors staging.`,
  };
}

export const RED_ROCKS_CONCERT_HARD_CONSTRAINT_RULES: HardConstraintRule<RedRocksConcertTransportationInput>[] =
  [
    {
      ruleId: "hc-rr-vehicle-capacity",
      label: "Vehicle Passenger Capacity Ceiling",
      description:
        "Eliminates vehicles whose maximum passenger capacity is smaller than your groupSize (6 for Suburban/UberXL, 10 for Private Van).",
      sourceIds: ["src-party-at-red-rocks-tariff-2026"],
      evaluate: (option, input) => {
        if (input.groupSize > option.groupCapacityRange.max) {
          return {
            passed: false,
            eliminationReason: `Group of ${input.groupSize} guests exceeds ${option.shortLabel} capacity of ${option.groupCapacityRange.max} guests.`,
            whatInputChangeWouldAlterResult:
              "Select the 10-passenger Private Group Van ($599 flat round-trip) for groups of 7–10.",
          };
        }
        return { passed: true };
      },
    },
    {
      ruleId: "hc-rr-sober-driver-required-for-self-drive",
      label: "Sober Designated Driver & Vehicle Requirement",
      description:
        "Eliminates self-drive parking when the group does not have a car and a dedicated sober driver.",
      sourceIds: ["src-red-rocks-official-parking-egress-2026"],
      evaluate: (option, input) => {
        if (
          option.optionId === "rr-self-drive-general-parking-free" &&
          !input.hasSoberDesignatedDriver
        ) {
          return {
            passed: false,
            eliminationReason:
              "Self-driving requires a personal/rental vehicle and a 100% sober designated driver for the late-night Morrison canyon exit.",
            whatInputChangeWouldAlterResult:
              "Set hasSoberDesignatedDriver to true if someone in your group is driving sober, or book a private charter.",
          };
        }
        return { passed: true };
      },
    },
    {
      ruleId: "hc-rr-cooler-storage-requires-onsite-vehicle",
      label: "On-Site Vehicle Required for Hard Cooler & Tailgate Storage",
      description:
        "Eliminates on-demand Uber/Lyft when the group requires hard cooler and tailgate gear storage during the show.",
      sourceIds: [
        "src-red-rocks-official-parking-egress-2026",
        "src-party-at-red-rocks-tariff-2026",
      ],
      evaluate: (option, input) => {
        if (
          option.optionId === "rr-rideshare-jurassic-lot" &&
          input.wantsTailgateAndCoolerStorage
        ) {
          return {
            passed: false,
            eliminationReason:
              "On-demand Uber/Lyft drivers drop off and leave; hard coolers are prohibited inside Red Rocks Amphitheatre and cannot be stored without a dedicated vehicle on-site.",
            whatInputChangeWouldAlterResult:
              "Choose a Party at Red Rocks private Suburban ($399) or Van ($599) where your cooler stays locked in your waiting vehicle, or disable cooler storage.",
          };
        }
        return { passed: true };
      },
    },
    {
      ruleId: "hc-rr-step-free-top-circle-access",
      label: "Step-Free Top Circle Drop-Off Requirement",
      description:
        "Eliminates Jurassic Lot rideshare walk when step_free_top_circle_drop is required.",
      sourceIds: ["src-red-rocks-official-parking-egress-2026"],
      evaluate: (option, input) => {
        if (
          input.mobilityAndStairPreference === "step_free_top_circle_drop" &&
          !option.accessibilityProfile.stepFreeWheelchairSupported
        ) {
          return {
            passed: false,
            eliminationReason: `${option.shortLabel} does not provide step-free Top Circle post-show access (${option.accessibilityProfile.note}).`,
            whatInputChangeWouldAlterResult:
              "Select the Private Suburban charter ($399, Top Circle drop-off supported) or self-drive with a valid state ADA placard.",
          };
        }
        return { passed: true };
      },
    },
  ];

export const RED_ROCKS_CONCERT_PREFERENCE_RULES: PreferenceRule<RedRocksConcertTransportationInput>[] =
  [
    {
      ruleId: "pref-rr-post-encore-priority",
      label: "Post-Encore Exit Priority Match",
      maxPoints: 45,
      evaluate: (option, input) => {
        if (
          input.postEncorePriority === "guaranteed_waiting_private_driver" &&
          (option.optionId === "rr-parr-private-suburban-6pax" ||
            option.optionId === "rr-parr-private-van-10pax")
        ) {
          return {
            points: 45,
            reason:
              "Dedicated private driver stays parked on-site through the final encore for immediate door-to-door return.",
            };
        }
        if (
          input.postEncorePriority === "accept_jurassic_lot_rideshare_queue" &&
          option.optionId === "rr-rideshare-jurassic-lot"
        ) {
          return {
            points: 35,
            reason:
              "Matches selection for on-demand app rideshare via the Jurassic Lot pickup zone.",
          };
        }
        if (
          input.postEncorePriority === "lowest_cash_outlay_diy" &&
          option.optionId === "rr-self-drive-general-parking-free"
        ) {
          return {
            points: 45,
            reason: "$0.00 official Red Rocks general concert parking.",
          };
        }
        return { points: 15, reason: "Viable Red Rocks concert transport option." };
      },
    },
    {
      ruleId: "pref-rr-group-size-per-person-economics",
      label: "Group Size & Per-Person Cost Fit",
      maxPoints: 35,
      evaluate: (option, input) => {
        if (
          input.groupSize <= 6 &&
          option.optionId === "rr-parr-private-suburban-6pax"
        ) {
          const perPerson = Math.round((399 / input.groupSize) * 100) / 100;
          return {
            points: 35,
            reason: `Right-sized 6-passenger private Suburban ($399 flat = $${perPerson}/person round-trip for ${input.groupSize} guest(s)).`,
          };
        }
        if (
          input.groupSize >= 7 &&
          option.optionId === "rr-parr-private-van-10pax"
        ) {
          const perPerson = Math.round((599 / input.groupSize) * 100) / 100;
          return {
            points: 35,
            reason: `Right-sized 10-passenger private Van ($599 flat = $${perPerson}/person round-trip for ${input.groupSize} guests).`,
          };
        }
        return { points: 15, reason: "Fits group size." };
      },
    },
    {
      ruleId: "pref-rr-stair-and-elevation-minimization",
      label: "6,450 ft Elevation & Stair Minimization",
      maxPoints: 20,
      evaluate: (option, input) => {
        if (
          input.mobilityAndStairPreference !== "standard_amphitheatre_stairs" &&
          (option.optionId === "rr-parr-private-suburban-6pax" ||
            option.optionId === "rr-parr-private-van-10pax")
        ) {
          return {
            points: 20,
            reason:
              "Avoids the 150–380+ stair climb from Lower South / Jurassic lots by staging with a dedicated private driver.",
          };
        }
        return { points: 10, reason: "Standard lot access." };
      },
    },
  ];

export const RED_ROCKS_CONCERT_DECISION_ENGINE: DecisionEngineDefinition<RedRocksConcertTransportationInput> =
  {
    engineId: "red-rocks-concert-shuttle",
    version: "1.0.0",
    slug: "red-rocks-concert-shuttle",
    canonicalPath: "/red-rocks-transportation",
    canonicalUrl: "https://destinationcommandcenter.com/red-rocks-transportation",
    title: "Red Rocks Concert Transportation & Post-Encore Exit Decision Engine",
    destinationName: "Red Rocks Park & Amphitheatre (Morrison / Denver, CO)",
    categoryName: "Concert Venue Transportation",
    heroQuestion:
      "Should your group book a 100% private Party at Red Rocks Suburban ($399 up to 6 guests) or Van ($599 up to 10 guests), gamble on the Jurassic Lot Uber/Lyft queue ($85–$160+ post-show surge), or self-drive ($0.00 parking)?",
    summaryDescription:
      "Evidence-backed Red Rocks concert transportation evaluator modeling 6,450 ft elevation stair grades (150–380+ steps from lower lots), the Entrance 2 Jurassic Lot rideshare geofence, $0.00 official parking rules, and Party at Red Rocks private charters ($399 Suburban / $599 Van; shared_seat_service: false).",
    referenceGuide: {
      importantDecisionFactors: [
        {
          title:
            "The Post-Encore Jurassic Lot Rideshare Bottleneck (60–90+ Min Queue)",
          detail:
            "While inbound Uber/Lyft from Denver costs $30–$45, post-show pickups are prohibited at Top Circle/Upper North and geofenced strictly to the Jurassic Lot (Entrance 2 off Hwy 93) and Lower South Lot. When 9,525 attendees exit simultaneously, riders face a steep downhill walk in the dark, cellular congestion, 60–90+ minute queues, and $85–$160+ surge fares.",
          sourceIds: ["src-red-rocks-official-parking-egress-2026"],
        },
        {
          title:
            "Party at Red Rocks Private Charter Truth ($399 Suburban / $599 Van; No Shared Seats)",
          detail:
            "Party at Red Rocks operates 100% private round-trip concert transportation (shared_seat_service: false): $399 flat for a full-size Suburban (up to 6 guests, $66.50/person at 6) and $599 flat for a private van (up to 10 guests, $59.90/person at 10), with cooler storage and a dedicated driver waiting on-site through the encore.",
          sourceIds: ["src-party-at-red-rocks-tariff-2026"],
        },
        {
          title: "No RTD Public Transit Into Red Rocks Park",
          detail:
            "RTD's W Line light rail ($2.75) terminates 6.2–6.5 miles north at Jefferson County Government Center–Golden with no connecting bus into Red Rocks Park and no safe pedestrian path along CO-93/CO-74 after dark.",
          sourceIds: ["src-rtd-denver-w-line-golden-2026"],
        },
      ],
      experienceAndVesselTypes: [
        {
          typeName:
            "Party at Red Rocks Private Suburban ($399 Flat, 1–6 Guests)",
          capacityAndStability:
            "1–6 passengers in a 100% private full-size Chevrolet Suburban ($66.50/person at 6 guests)",
          bestFor:
            "Groups of 3–6 wanting door-to-door hotel/Airbnb pickup, tailgate cooler storage, and a dedicated driver waiting on-site after the encore",
          limitations: "Capped at 6 guests; higher per-person cost for 1–2 riders",
          sourceIds: ["src-party-at-red-rocks-tariff-2026"],
        },
        {
          typeName:
            "Party at Red Rocks Private Group Van ($599 Flat, Up to 10 Guests)",
          capacityAndStability:
            "Up to 10 passengers in a 100% private concert van ($59.90/person at 10 guests)",
          bestFor:
            "Groups of 7–10 wanting one private door-to-door vehicle and on-site shelter during weather holds",
          limitations: "Single-van capacity capped at 10 guests",
          sourceIds: ["src-party-at-red-rocks-tariff-2026"],
        },
        {
          typeName:
            "On-Demand Rideshare — Uber / Lyft via Jurassic Lot Geofence",
          capacityAndStability:
            "1–6 passengers per app vehicle ($30–$45 inbound / $85–$160+ post-encore surge)",
          bestFor:
            "Inbound pre-show rides only, or travelers willing to wait 60–90+ minutes in the Jurassic Lot after the encore",
          limitations:
            "No Top Circle post-show pickup, no cooler storage, and high post-encore surge/wait risk",
          sourceIds: ["src-red-rocks-official-parking-egress-2026"],
        },
        {
          typeName:
            "Self-Drive in Official Red Rocks Park Lots ($0.00 General Parking)",
          capacityAndStability:
            "Personal/rental car in Upper North, Upper South, Lower North, Lower South, or Jurassic lots",
          bestFor:
            "Groups with a committed 100% sober designated driver arriving 60–90+ minutes before doors",
          limitations:
            "Late arrival forces a 150–380+ stair climb at 6,450 ft plus a 35–60 minute post-show canyon exit; overnight cars must vacate before 2:00 AM / next morning towing enforcement",
          sourceIds: ["src-red-rocks-official-parking-egress-2026"],
        },
      ],
      departureLocations: [
        {
          islandOrRegion: "Denver Metro & Golden",
          harborOrArea: "Door-to-Door Hotel / Residence Pickup",
          logisticsNote:
            "Party at Red Rocks private Suburbans ($399) and Vans ($599) pick up directly at your hotel or residence.",
          sourceIds: ["src-party-at-red-rocks-tariff-2026"],
        },
        {
          islandOrRegion: "Red Rocks Park (Morrison, CO — 6,450 ft)",
          harborOrArea:
            "Top Circle / Upper Lots vs. Entrance 2 Jurassic Lot (Hwy 93)",
          logisticsNote:
            "Official concert lots open 2 hours before doors; post-show Uber/Lyft is geofenced to Jurassic Lot (Entrance 2) and Lower South Lot.",
          sourceIds: ["src-red-rocks-official-parking-egress-2026"],
        },
      ],
      commonTradeoffs: [
        {
          tradeoff:
            "Private $399 Suburban vs. Round-Trip Uber/Lyft for 4–6 People",
          explanation:
            "Once inbound ($30–$45) and post-show UberXL surge ($120–$160+) are combined, a group of 4–6 pays nearly half the cost of a private Suburban anyway—while still hiking down to the Jurassic Lot and waiting 60–90+ minutes.",
        },
        {
          tradeoff: "$0.00 Self-Drive Parking vs. Private Charter",
          explanation:
            "Self-driving is free if you have a 100% sober driver and arrive 60–90+ minutes before doors to secure an Upper lot, whereas a private charter lets the entire group enjoy the show and skip the Jurassic Lot walk.",
        },
      ],
      operationalDependencies: [
        {
          dependency:
            "6,450 ft Altitude, Lightning Holds & Post-Show Geofence Enforcement",
          impact:
            "Thunderstorm delays require sheltering in vehicles; having a dedicated private vehicle or personal car on-site provides immediate weather shelter.",
          sourceIds: ["src-red-rocks-official-parking-egress-2026"],
        },
      ],
      methodologySteps: [
        "Enforce vehicle passenger limits (max 6 for Private Suburban, max 10 for Private Van), sober-driver requirement for $0.00 self-drive, and on-site vehicle requirement for cooler storage.",
        "Evaluate 6,450 ft stair/mobility constraints (eliminating the downhill Jurassic Lot rideshare trek when step-free Top Circle access is required).",
        "Rank viable options by post-encore exit reliability and per-person group economics with zero commercial bias.",
      ],
    },
    questions: RED_ROCKS_CONCERT_QUESTIONS,
    answerSchema: RED_ROCKS_CONCERT_ANSWER_SCHEMA,
    defaultExampleInput: RED_ROCKS_CONCERT_DEFAULT_EXAMPLE_INPUT,
    comparisonDimensions: RED_ROCKS_CONCERT_COMPARISON_DIMENSIONS,
    candidateOptions: RED_ROCKS_CONCERT_CANDIDATE_OPTIONS,
    hardConstraintRules: RED_ROCKS_CONCERT_HARD_CONSTRAINT_RULES,
    preferenceRules: RED_ROCKS_CONCERT_PREFERENCE_RULES,
    evidenceClaims: RED_ROCKS_CONCERT_EVIDENCE_CLAIMS,
    sourceRecords: RED_ROCKS_CONCERT_SOURCE_RECORDS,
    computeTimingForOption: (opt) => computeRedRocksTiming(opt),
    isExampleScenarioDetector: (rawInput, normalized) => {
      const isExample =
        rawInput === undefined ||
        rawInput === null ||
        normalized.travelDate === null;
      return {
        isExample,
        banner: isExample
          ? "Example Scenario Shown: Group of 6 concertgoers from Downtown Denver bringing a tailgate cooler without a sober designated driver. Enter your concert date and group size for a personalized verdict."
          : null,
        missingInputFacts:
          normalized.travelDate === null
            ? [
                {
                  factId: "missing-rr-concert-date",
                  optionId: null,
                  category: "missing_traveler_input",
                  summary: "Concert date not provided.",
                  impactOnDecision:
                    "Private Suburban ($399) and Van ($599) availability on Party at Red Rocks requires confirming your specific concert date.",
                  sourceIds: ["src-party-at-red-rocks-tariff-2026"],
                },
              ]
            : [],
      };
    },
    evaluate: (rawInput: unknown, options?: DecisionEvaluateOptions) =>
      evaluateDecisionEngine(
        RED_ROCKS_CONCERT_DECISION_ENGINE,
        rawInput,
        options,
      ),
  };
