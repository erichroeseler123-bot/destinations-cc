import { z } from "zod";
import { evaluateDecisionEngine } from "@/lib/dcc/decisionEngines/evaluator";
import {
  JUNEAU_DOCK_TRANSFER_TABLE,
  type JuneauDockCode,
} from "@/lib/dcc/decisionEngines/juneauHelicopterEngine";
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
  UnknownOrStaleFact,
} from "@/lib/dcc/decisionEngines/types";

export const JuneauWhaleAnswerSchema = z.object({
  portCallHours: z.coerce.number().min(3).max(14).default(7),
  arrivalDock: z
    .enum(["CT", "FKL", "AS", "ACT", "AJ", "TENDER_FKL", "UNKNOWN"])
    .default("CT"),
  sailingMonth: z.coerce.number().int().min(1).max(12).default(7),
  wantsMendenhallGlacierCombo: z.coerce.boolean().default(false),
  motionSensitivity: z
    .enum(["low", "moderate_prefer_catamaran", "severe_avoid_vessels"])
    .default("low"),
  needsWheelchairOrLowRampSlope: z.coerce.boolean().default(false),
});

export type JuneauWhaleAnswerInput = z.infer<typeof JuneauWhaleAnswerSchema>;

export const DEFAULT_JUNEAU_WHALE_INPUT: JuneauWhaleAnswerInput = {
  portCallHours: 7,
  arrivalDock: "CT",
  sailingMonth: 7,
  wantsMendenhallGlacierCombo: false,
  motionSensitivity: "low",
  needsWheelchairOrLowRampSlope: false,
};

export const JUNEAU_WHALE_SOURCES: SourceRecord[] = [
  {
    sourceId: "src-noaa-50cfr224-103b",
    sourceOrganization: "NOAA Fisheries Alaska Region",
    sourceTitle:
      "50 CFR § 224.103(b) — Alaska Humpback Whale 100-Yard Minimum Approach Regulation & Slow-Speed Zone",
    sourceUrl:
      "https://www.fisheries.noaa.gov/alaska/marine-life-distress/alaska-humpback-whale-approach-regulations",
    claimsSupported: ["clm-noaa-alaska-100yd-humpback-rule"],
    retrievedAt: "2026-04-08T00:00:00Z",
    verifiedAt: "2026-04-08T00:00:00Z",
    expiresAt: "2027-04-08T00:00:00Z",
    freshnessCategory: "regulatory_annual",
    status: "current",
  },
  {
    sourceId: "src-allen-marine-juneau-whale",
    sourceOrganization:
      "Allen Marine Tours / Gastineau Guiding / Juneau Tours / Harv & Marv's Outback Alaska",
    sourceTitle:
      "Juneau Auke Bay Whale Watching (220 min Baseline / $169–$229) & Mendenhall Glacier Combo (315 min Baseline / $219–$289) Specifications",
    sourceUrl: "https://allenmarinetours.com/juneau/",
    claimsSupported: [
      "clm-auke-bay-direct-whale-specs",
      "clm-auke-bay-whale-mendenhall-combo-specs",
      "clm-juneau-dock-to-auke-bay-transfer-penalty",
    ],
    retrievedAt: "2026-11-03T00:00:00Z",
    verifiedAt: "2026-11-03T00:00:00Z",
    expiresAt: "2027-05-03T00:00:00Z",
    freshnessCategory: "operator_tariff_and_policy",
    status: "current",
  },
  {
    sourceId: "src-noaa-tides-juneau-9452210",
    sourceOrganization: "NOAA Tides & Currents",
    sourceTitle:
      "Station 9452210 (Juneau, AK) — Semidiurnal Tidal Range (~16–20+ ft) & Statter Harbor Ramp Slope at Minus Low Tides (-3 to -5 ft MLLW)",
    sourceUrl:
      "https://tidesandcurrents.noaa.gov/stationhome.html?id=9452210",
    claimsSupported: ["clm-statter-harbor-minus-tide-ramp-slope"],
    retrievedAt: "2026-04-08T00:00:00Z",
    verifiedAt: "2026-04-08T00:00:00Z",
    expiresAt: "2027-04-08T00:00:00Z",
    freshnessCategory: "regulatory_annual",
    status: "current",
  },
  {
    sourceId: "src-usfs-mendenhall-glacier",
    sourceOrganization: "USDA Forest Service — Tongass National Forest",
    sourceTitle:
      "Mendenhall Glacier Recreation Area — Visitor Center ($5 Ages 16+, May–Sept), Photo Point & Nugget Falls Trails ($0)",
    sourceUrl:
      "https://www.fs.usda.gov/detail/tongass/about-forest/offices/?cid=fseprd1093566",
    claimsSupported: ["clm-usfs-mendenhall-ground-shuttle-specs"],
    retrievedAt: "2026-11-03T00:00:00Z",
    verifiedAt: "2026-11-03T00:00:00Z",
    expiresAt: "2027-05-03T00:00:00Z",
    freshnessCategory: "regulatory_annual",
    status: "current",
  },
  {
    sourceId: "src-juneau-seawalk-soboleff",
    sourceOrganization:
      "Travel Juneau & Sealaska Heritage Institute (Walter Soboleff Building)",
    sourceTitle:
      "Downtown Juneau Seawalk, Overstreet Park ('Tahku' Life-Sized Bronze Humpback Whale), Walter Soboleff Center ($10) & Goldbelt Tram ($55–$60)",
    sourceUrl:
      "https://www.sealaskaheritage.org/institute/walter-soboleff-building",
    claimsSupported: ["clm-downtown-juneau-seawalk-soboleff-specs"],
    retrievedAt: "2026-04-08T00:00:00Z",
    verifiedAt: "2026-04-08T00:00:00Z",
    expiresAt: "2027-04-08T00:00:00Z",
    freshnessCategory: "operator_tariff_and_policy",
    status: "current",
  },
];

export const JUNEAU_WHALE_CLAIMS: EvidenceClaim[] = [
  {
    claimId: "clm-noaa-alaska-100yd-humpback-rule",
    classification: "official_rule",
    statement:
      "Federal regulation 50 CFR § 224.103(b) prohibits all vessels in Alaska waters from approaching within 100 yards of any humpback whale and requires slow, safe speeds near whales.",
    fieldsSupported: [
      "candidateOptions.jun-opt-auke-bay-whale-direct",
      "candidateOptions.jun-opt-combo-whale-and-mendenhall",
    ],
    sourceIds: ["src-noaa-50cfr224-103b"],
    isDecisionChanging: false,
    verificationNote:
      "Verified against NOAA Fisheries Alaska humpback whale approach regulation 50 CFR § 224.103(b).",
  },
  {
    claimId: "clm-auke-bay-direct-whale-specs",
    classification: "operator_published_fact",
    statement:
      "Direct Auke Bay whale watching tours (Allen Marine Tours, Gastineau Guiding, Juneau Tours, Harv & Marv's Outback Alaska) operate mid-April through mid-October with a 220-minute (3 hr 40 min) baseline dock-to-dock duration (210–240 min range: 20m dock check-in + 25m outbound transfer to Statter Harbor + 150m on-water viewing + 25m return transfer) and published rates of $169–$229 per adult including round-trip dock shuttle and whale sighting guarantee.",
    fieldsSupported: [
      "candidateOptions.jun-opt-auke-bay-whale-direct",
      "questions.portCallHours",
    ],
    sourceIds: ["src-allen-marine-juneau-whale"],
    isDecisionChanging: true,
    verificationNote:
      "Verified against lib/dcc/juneauPortDayEngine.ts (jun-opt-auke-bay-whale-direct).",
  },
  {
    claimId: "clm-auke-bay-whale-mendenhall-combo-specs",
    classification: "operator_published_fact",
    statement:
      "Auke Bay Whale Watching + Mendenhall Glacier Combo excursions operate May through September with a 315-minute (5 hr 15 min) baseline dock-to-dock duration (300–330 min range: 20m dock check-in + 25m outbound transfer + 220m combined whale watch ~135m and USFS Mendenhall Glacier Visitor Area ~85m + 25m inter-activity transfer + 25m return transfer) at $219–$289 per adult.",
    fieldsSupported: [
      "candidateOptions.jun-opt-combo-whale-and-mendenhall",
      "questions.wantsMendenhallGlacierCombo",
    ],
    sourceIds: ["src-allen-marine-juneau-whale"],
    isDecisionChanging: true,
    verificationNote:
      "Verified against lib/dcc/juneauPortDayEngine.ts (jun-opt-combo-whale-and-mendenhall).",
  },
  {
    claimId: "clm-juneau-dock-to-auke-bay-transfer-penalty",
    classification: "operator_published_fact",
    statement:
      "One-way ground transfer to Statter Harbor / Auke Bay is ~25 minutes from downtown berths (CT, FKL, AS), ~30 minutes from Alaska Steamship Dock (ACT), ~35 minutes from AJ Dock (including shuttle staging), and ~45 minutes when tendering ashore from the Franklin Dock anchorage (TENDER_FKL), plus DCC's recommended 2-hour (1:59:59+ / 120-minute) all-aboard ship buffer.",
    fieldsSupported: ["questions.arrivalDock", "questions.portCallHours"],
    sourceIds: ["src-allen-marine-juneau-whale"],
    isDecisionChanging: true,
    verificationNote:
      "Verified against JUNEAU_DOCK_TRANSFER_TABLE in lib/dcc/decisionEngines/juneauHelicopterEngine.ts.",
  },
  {
    claimId: "clm-statter-harbor-minus-tide-ramp-slope",
    classification: "official_rule",
    statement:
      "Juneau (NOAA Station 9452210) experiences semidiurnal tides of ~16–20+ feet; during extreme minus low tides (-3 to -5 ft MLLW), the floating dock ramps at Statter Harbor (Auke Bay) become significantly steeper for wheelchair and limited-mobility boarding.",
    fieldsSupported: ["questions.needsWheelchairOrLowRampSlope"],
    sourceIds: ["src-noaa-tides-juneau-9452210"],
    isDecisionChanging: true,
    verificationNote:
      "Verified against lib/dcc/juneauPortDayEngine.ts and NOAA Station 9452210.",
  },
  {
    claimId: "clm-usfs-mendenhall-ground-shuttle-specs",
    classification: "official_rule",
    statement:
      "The USFS Mendenhall Glacier Ground Shuttle & Visitor Area excursion requires a 185-minute (3 hr 5 min) baseline window (150–210 min range: 15m boarding + 25m outbound transfer + 120m on-site at Photo Point, Nugget Falls, and Visitor Center + 25m return transfer) and costs $50–$85 per adult ($5 USFS Visitor Center fee for ages 16+ plus ~$45–$80 commercial round-trip shuttle; outdoor trails are $0).",
    fieldsSupported: ["candidateOptions.jun-opt-usfs-mendenhall-shuttle"],
    sourceIds: ["src-usfs-mendenhall-glacier"],
    isDecisionChanging: true,
    verificationNote:
      "Verified against lib/dcc/juneauPortDayEngine.ts (jun-opt-usfs-mendenhall-shuttle).",
  },
  {
    claimId: "clm-downtown-juneau-seawalk-soboleff-specs",
    classification: "operator_published_fact",
    statement:
      "Travelers with short port calls, severe motion sensitivity, or zero-transfer preference can walk the Downtown Juneau Seawalk to Overstreet Park ('Tahku' life-sized breaching bronze humpback whale statue, $0 free), visit the Sealaska Heritage Walter Soboleff Building ($10 admission), and optionally ride the Goldbelt Tram ($55–$60) in a 120-minute (60–240 min) self-paced window with 0 minutes of bus transfer.",
    fieldsSupported: ["candidateOptions.jun-opt-downtown-seawalk-soboleff-tram"],
    sourceIds: ["src-juneau-seawalk-soboleff"],
    isDecisionChanging: true,
    verificationNote:
      "Verified against lib/dcc/juneauPortDayEngine.ts (jun-opt-downtown-seawalk-soboleff-tram).",
  },
];

export const JUNEAU_WHALE_QUESTIONS: QuestionDefinition[] = [
  {
    questionId: "portCallHours",
    label: "Total ship time in port (hours from arrival to all-aboard)",
    helpText:
      "Auke Bay whale watching requires ~3.7 hours (220m) dock-to-dock plus DCC's 2-hour (1:59:59+ / 120-minute) recommended all-aboard buffer; the Whale + Mendenhall Glacier Combo requires ~5.25 hours (315m) plus buffer.",
    inputType: "number",
    min: 3,
    max: 14,
    requiredForPersonalizedVerdict: true,
    decisionImpactExplanation:
      "Eliminates the 315-minute Whale + Mendenhall Combo or 220-minute Direct Auke Bay Whale Watch when your port window minus dock transfer and 2-hour (120-minute) recommended ship buffer is too short.",
    drivenByClaimIds: [
      "clm-auke-bay-direct-whale-specs",
      "clm-auke-bay-whale-mendenhall-combo-specs",
      "clm-juneau-dock-to-auke-bay-transfer-penalty",
    ],
    defaultValue: DEFAULT_JUNEAU_WHALE_INPUT.portCallHours,
  },
  {
    questionId: "arrivalDock",
    label: "Which Juneau cruise ship berth or anchorage are you arriving at?",
    helpText:
      "AJ Dock adds +10m each way to Auke Bay (~35m vs 25m from CT/FKL/AS); tendering from Franklin Anchorage (TENDER_FKL) adds +20m each way (~45m).",
    inputType: "select",
    requiredForPersonalizedVerdict: true,
    decisionImpactExplanation:
      "Adjusts round-trip Statter Harbor transfer time using JUNEAU_DOCK_TRANSFER_TABLE.",
    drivenByClaimIds: ["clm-juneau-dock-to-auke-bay-transfer-penalty"],
    defaultValue: DEFAULT_JUNEAU_WHALE_INPUT.arrivalDock,
    options: [
      {
        value: "CT",
        label: "Cruise Ship Terminal (CT) — Downtown (~25m to Auke Bay)",
      },
      {
        value: "FKL",
        label: "South Franklin Street Dock (FKL) — Downtown (~25m to Auke Bay)",
      },
      {
        value: "AS",
        label: "Alaska Steamship Wharf (AS) — Downtown (~25m to Auke Bay)",
      },
      {
        value: "ACT",
        label: "Alaska Cruise Terminal (ACT) — North Downtown (~30m to Auke Bay)",
      },
      {
        value: "AJ",
        label: "AJ Dock (AJ) — South of Downtown (~35m to Auke Bay)",
      },
      {
        value: "TENDER_FKL",
        label: "Franklin Dock Anchorage (TENDER_FKL) — Tender Required (~45m to Auke Bay)",
      },
      {
        value: "UNKNOWN",
        label: "Not sure yet (uses conservative 35m AJ Dock transfer assumption)",
      },
    ],
  },
  {
    questionId: "sailingMonth",
    label: "Month of your Juneau visit",
    helpText:
      "Direct Auke Bay whale watching runs mid-April through mid-October (months 4–10); Mendenhall Glacier Combo packages run May through September (months 5–9).",
    inputType: "select",
    requiredForPersonalizedVerdict: true,
    decisionImpactExplanation:
      "Eliminates seasonal Auke Bay whale or Mendenhall combo tours outside their operating months.",
    drivenByClaimIds: [
      "clm-auke-bay-direct-whale-specs",
      "clm-auke-bay-whale-mendenhall-combo-specs",
    ],
    defaultValue: DEFAULT_JUNEAU_WHALE_INPUT.sailingMonth,
    options: [
      { value: "4", label: "April (Direct Auke Bay Whale open mid-April; Combo closed)" },
      { value: "5", label: "May (Peak spring humpback & Mendenhall Combo open)" },
      { value: "6", label: "June (Peak humpback & Mendenhall Combo open)" },
      { value: "7", label: "July (Peak humpback & Mendenhall Combo open)" },
      { value: "8", label: "August (Peak humpback & Mendenhall Combo open)" },
      { value: "9", label: "September (Late-season humpback & Mendenhall Combo open)" },
      { value: "10", label: "October (Direct Auke Bay Whale open through mid-Oct; Combo closed)" },
    ],
  },
  {
    questionId: "wantsMendenhallGlacierCombo",
    label: "Do you want to combine Auke Bay whale watching with the Mendenhall Glacier Visitor Area in one excursion?",
    helpText:
      "The combo adds ~95 minutes (total 315m / 5 hr 15 min baseline) and $50–$60/person over a standalone whale watch, giving ~85 minutes at Mendenhall Glacier.",
    inputType: "boolean",
    requiredForPersonalizedVerdict: true,
    decisionImpactExplanation:
      "Prioritizes the 315-minute Combo when your port window allows it, or explains why the standalone 220-minute whale watch is safer on tighter port calls.",
    drivenByClaimIds: [
      "clm-auke-bay-direct-whale-specs",
      "clm-auke-bay-whale-mendenhall-combo-specs",
    ],
    defaultValue: DEFAULT_JUNEAU_WHALE_INPUT.wantsMendenhallGlacierCombo,
  },
  {
    questionId: "motionSensitivity",
    label: "How sensitive is your party to vessel motion?",
    helpText:
      "Stephens Passage / Favorite Channel is sheltered Inside Passage water, and multi-deck catamarans (Allen Marine / Gastineau Guiding) have heated cabins.",
    inputType: "select",
    requiredForPersonalizedVerdict: false,
    decisionImpactExplanation:
      "Eliminates on-water vessels if severe motion avoidance is selected, routing to USFS Mendenhall Glacier or the Downtown Seawalk ('Tahku' bronze whale at Overstreet Park).",
    drivenByClaimIds: [
      "clm-auke-bay-direct-whale-specs",
      "clm-usfs-mendenhall-ground-shuttle-specs",
      "clm-downtown-juneau-seawalk-soboleff-specs",
    ],
    defaultValue: DEFAULT_JUNEAU_WHALE_INPUT.motionSensitivity,
    options: [
      {
        value: "low",
        label: "Low — comfortable on sheltered Inside Passage vessels",
      },
      {
        value: "moderate_prefer_catamaran",
        label: "Moderate — prefer stabilized heated cabin catamarans in Auke Bay",
      },
      {
        value: "severe_avoid_vessels",
        label: "Severe — must stay on land (no boat excursions)",
      },
    ],
  },
  {
    questionId: "needsWheelchairOrLowRampSlope",
    label: "Does anyone use a wheelchair or require low-slope dock ramp boarding?",
    helpText:
      "During extreme minus low tides (-3 to -5 ft MLLW at NOAA Station 9452210), Statter Harbor floating dock ramps become steep.",
    inputType: "boolean",
    requiredForPersonalizedVerdict: false,
    decisionImpactExplanation:
      "Surfaces NOAA Station 9452210 minus-tide Statter Harbor ramp slope warnings and operator wheelchair-lift confirmation requirements.",
    drivenByClaimIds: ["clm-statter-harbor-minus-tide-ramp-slope"],
    defaultValue: DEFAULT_JUNEAU_WHALE_INPUT.needsWheelchairOrLowRampSlope,
  },
];

export const JUNEAU_WHALE_COMPARISON_DIMENSIONS: ComparisonDimension[] = [
  {
    dimensionId: "dockToDockDuration",
    label: "Dock-to-Dock Duration",
    description: "Total baseline duration from downtown cruise docks.",
  },
  {
    dimensionId: "operatorsAndVessels",
    label: "Operators & Vessel Class",
    description: "Verified Juneau operators and heated-cabin vessel profile.",
  },
  {
    dimensionId: "glacierAndWildlifeScope",
    label: "Whale & Glacier Scope",
    description: "On-water viewing time, sighting guarantee, and Mendenhall access.",
  },
  {
    dimensionId: "publishedPricing",
    label: "Published Pricing",
    description: "Verified per-adult tariff range.",
    unitOrFormat: "USD",
  },
  {
    dimensionId: "seasonAndRegulations",
    label: "Operating Season & Rules",
    description: "Verified operating months and NOAA / USFS regulations.",
  },
];

export const JUNEAU_WHALE_CANDIDATE_OPTIONS: CandidateOption[] = [
  {
    optionId: "jun-opt-auke-bay-whale-direct",
    title: "Direct Auke Bay Whale Watching (Heated-Cabin Catamaran / Cruiser)",
    shortLabel: "Direct Auke Bay Whale Watch (3 hr 40 min / $169–$229)",
    optionKind: "guided_commercial",
    actualOperators: [
      "Allen Marine Tours",
      "Gastineau Guiding",
      "Juneau Tours",
      "Harv & Marv's Outback Alaska",
    ],
    islandsOrRegions: ["Juneau / Auke Bay (Stephens Passage & Favorite Channel)"],
    departureAreas: [
      "Downtown Juneau Cruise Docks via Shuttle to Statter Harbor (Auke Bay)",
    ],
    operatingMonths: [4, 5, 6, 7, 8, 9, 10],
    scheduleVerifiedThroughDate: "2026-10-15",
    vesselOrVehicleType:
      "Heated-cabin waterjet catamaran or safari cruiser with outdoor observation decks and marine head",
    groupCapacityRange: {
      min: 6,
      max: 140,
      label:
        "Small-boat safari vessels (6–20 guests) to stabilized multi-deck catamarans (up to 140 guests)",
    },
    rideComfortLevel: "high_stability",
    viewingSpaceDescription:
      "Sheltered Inside Passage waters of Auke Bay, Stephens Passage, and Favorite Channel under NOAA 50 CFR § 224.103(b) 100-yard humpback approach regulations.",
    durationMinutes: {
      activity: 150,
      checkInLead: 20,
      typicalTransferEachWay: 25,
      totalDockOrHotelRange: { min: 210, max: 240 },
      label:
        "3 hr 40 min (220m) baseline (210–240m range: 20m check-in + 25m outbound transfer + 150m on-water + 25m return transfer)",
    },
    minimumAgeYears: 0,
    minimumAgeNote: "Open to all ages on standard Auke Bay whale watching vessels.",
    prohibitsPregnantOrSpinalConditions: false,
    accessibilityProfile: {
      stepFreeWheelchairSupported: true,
      limitedMobilitySupported: true,
      walkingAndBoardingRequirement:
        "Select Allen Marine and Gastineau Guiding vessels support wheelchairs, but Statter Harbor floating dock ramps become steep during minus low tides (-3 to -5 ft MLLW at NOAA Station 9452210).",
      confirmationStatus: "operator_confirmation_required",
      note: "Confirm accessible shuttle lift and check NOAA Station 9452210 tide height for your boarding hour.",
    },
    transportationAvailability: {
      hotelPickupAvailable: false,
      cruisePortShuttleAvailable: true,
      selfDriveParkingNote:
        "Round-trip shuttle from downtown Juneau cruise ship docks to Statter Harbor (Auke Bay) is included.",
    },
    cancellationTerms:
      "Full refund if cruise ship misses port or operator cancels for marine weather; runs rain or shine in sheltered Inside Passage channels.",
    whaleSightingOrReRidePolicy:
      "Includes operator whale sighting guarantee (cash refund or re-ride credit if no whale is sighted; sighting rate exceeds 99% May–September).",
    indicativePriceUsd: {
      min: 169,
      max: 229,
      basisLabel:
        "$169–$229 per adult including round-trip Statter Harbor dock shuttle and whale sighting guarantee",
    },
    comparisonValues: {
      dockToDockDuration:
        "220 min (3 hr 40 min) baseline from downtown docks (210–240 min range)",
      operatorsAndVessels:
        "Allen Marine Tours, Gastineau Guiding, Juneau Tours, Harv & Marv's (heated cabin + observation deck)",
      glacierAndWildlifeScope:
        "150 min on-water humpback/orca viewing + whale sighting guarantee",
      publishedPricing: "$169–$229 per adult (dock shuttle included)",
      seasonAndRegulations:
        "Mid-April to Mid-October; NOAA 50 CFR § 224.103(b) 100-yard rule",
    },
    tradeoffs: {
      strengths: [
        "Fits 5.5+ hour cruise port calls where the 315-minute Glacier Combo would violate the 60-minute all-aboard buffer",
        "150 minutes of dedicated on-water time in Auke Bay / Stephens Passage with a whale sighting guarantee and heated cabin",
      ],
      limitations: [
        "Does not include a stop at the USFS Mendenhall Glacier Visitor Area",
        "Statter Harbor floating dock ramp slope steepens during minus low tides (-3 to -5 ft MLLW)",
      ],
    },
    claimIds: [
      "clm-auke-bay-direct-whale-specs",
      "clm-noaa-alaska-100yd-humpback-rule",
      "clm-juneau-dock-to-auke-bay-transfer-penalty",
      "clm-statter-harbor-minus-tide-ramp-slope",
    ],
    sourceIds: [
      "src-allen-marine-juneau-whale",
      "src-noaa-50cfr224-103b",
      "src-noaa-tides-juneau-9452210",
    ],
    bookingDestinations: [
      {
        destinationId: "dest-allen-marine-juneau-direct",
        optionId: "jun-opt-auke-bay-whale-direct",
        sellerType: "direct_operator",
        sellerName: "Allen Marine Tours",
        actualOperatorName: "Allen Marine Tours",
        label: "View Allen Marine Juneau Auke Bay Whale Watch Specifications",
        url: "https://allenmarinetours.com/juneau/",
        supportedContextParams: [],
        relationshipDisclosure:
          "Direct operator link. Destination Command Center applies zero commercial weight to candidate rankings.",
        isCommercialPartner: false,
        commissionInfluenceOnRanking: 0,
      },
    ],
  },
  {
    optionId: "jun-opt-combo-whale-and-mendenhall",
    title: "Auke Bay Whale Watching + Mendenhall Glacier Combo Excursion",
    shortLabel: "Whale Watch + Mendenhall Glacier Combo (5 hr 15 min / $219–$289)",
    optionKind: "guided_commercial",
    actualOperators: [
      "Allen Marine Tours",
      "Juneau Tours",
      "True Alaskan Tours",
      "Gastineau Guiding",
    ],
    islandsOrRegions: [
      "Juneau / Auke Bay & Mendenhall Glacier Recreation Area",
    ],
    departureAreas: [
      "Downtown Juneau Cruise Docks via Shuttle to Statter Harbor & USFS Mendenhall Visitor Area",
    ],
    operatingMonths: [5, 6, 7, 8, 9],
    scheduleVerifiedThroughDate: "2027-09-30",
    vesselOrVehicleType:
      "Heated-cabin whale watching vessel + direct coach transfer between Statter Harbor and Mendenhall Glacier",
    groupCapacityRange: {
      min: 14,
      max: 120,
      label: "Coordinated whale vessel + Mendenhall Glacier shuttle coach",
    },
    rideComfortLevel: "high_stability",
    viewingSpaceDescription:
      "Combines ~135 minutes on the water in Auke Bay with ~85 minutes on-site at the USFS Mendenhall Glacier Visitor Area (Photo Point, Nugget Falls trail, and Visitor Center).",
    durationMinutes: {
      activity: 220,
      checkInLead: 20,
      typicalTransferEachWay: 25,
      totalDockOrHotelRange: { min: 300, max: 330 },
      label:
        "5 hr 15 min (315m) baseline (300–330m range: 20m check-in + 25m outbound + 220m combined whale ~135m & glacier ~85m + 25m inter-site transfer + 25m return)",
    },
    minimumAgeYears: 0,
    minimumAgeNote: "Open to all ages.",
    prohibitsPregnantOrSpinalConditions: false,
    accessibilityProfile: {
      stepFreeWheelchairSupported: true,
      limitedMobilitySupported: true,
      walkingAndBoardingRequirement:
        "Paved Photo Point trail and USFS Mendenhall Visitor Center elevator/ramps; Statter Harbor dock ramp slope varies with tide (NOAA Station 9452210).",
      confirmationStatus: "operator_confirmation_required",
      note: "Confirm lift-equipped coach for the inter-site transfer between Auke Bay and Mendenhall Glacier.",
    },
    transportationAvailability: {
      hotelPickupAvailable: false,
      cruisePortShuttleAvailable: true,
      selfDriveParkingNote:
        "Includes all three bus legs: Downtown Docks -> Statter Harbor -> Mendenhall Glacier -> Downtown Docks.",
    },
    cancellationTerms:
      "Full refund if ship misses port; runs in rain/overcast ceilings (unlike helicopter glacier landings).",
    whaleSightingOrReRidePolicy:
      "Includes whale sighting guarantee on the Auke Bay marine leg plus USFS Mendenhall Glacier admission.",
    indicativePriceUsd: {
      min: 219,
      max: 289,
      basisLabel:
        "$219–$289 per adult including all shuttle legs, USFS Mendenhall Glacier fee, and whale sighting guarantee",
    },
    comparisonValues: {
      dockToDockDuration:
        "315 min (5 hr 15 min) baseline from downtown docks (300–330 min range)",
      operatorsAndVessels:
        "Allen Marine Tours, Juneau Tours, True Alaskan Tours, Gastineau Guiding",
      glacierAndWildlifeScope:
        "~135m Auke Bay whale watch + ~85m at USFS Mendenhall Glacier Visitor Area",
      publishedPricing: "$219–$289 per adult (all transfers & USFS fee included)",
      seasonAndRegulations:
        "May through September; NOAA 50 CFR § 224.103(b) & USFS commercial permit",
    },
    tradeoffs: {
      strengths: [
        "Covers both of Juneau's signature sights (Auke Bay humpbacks + Mendenhall Glacier) without backtracking downtown between tours",
        "Unaffected by low cloud ceilings that cancel helicopter glacier landings",
      ],
      limitations: [
        "Requires 315 minutes (5 hr 15 min) baseline plus dock transfer and 60-minute ship buffer—unsafe for short 5–6 hour port calls or tender delays",
        "~85-minute Mendenhall stop is tight if you want to hike the full 2-mile round-trip Nugget Falls trail at a leisurely pace",
      ],
    },
    claimIds: [
      "clm-auke-bay-whale-mendenhall-combo-specs",
      "clm-noaa-alaska-100yd-humpback-rule",
      "clm-juneau-dock-to-auke-bay-transfer-penalty",
    ],
    sourceIds: ["src-allen-marine-juneau-whale", "src-noaa-50cfr224-103b"],
    bookingDestinations: [
      {
        destinationId: "dest-allen-marine-combo-direct",
        optionId: "jun-opt-combo-whale-and-mendenhall",
        sellerType: "direct_operator",
        sellerName: "Allen Marine Tours",
        actualOperatorName: "Allen Marine Tours",
        label: "View Juneau Whale Watch + Mendenhall Glacier Combo Details",
        url: "https://allenmarinetours.com/juneau/",
        supportedContextParams: [],
        relationshipDisclosure:
          "Direct operator link. Destination Command Center applies zero commercial weight to candidate rankings.",
        isCommercialPartner: false,
        commissionInfluenceOnRanking: 0,
      },
    ],
  },
  {
    optionId: "jun-opt-usfs-mendenhall-shuttle",
    title:
      "Land-Only Alternative: USFS Mendenhall Glacier Ground Shuttle & Visitor Area",
    shortLabel: "USFS Mendenhall Glacier Ground Shuttle (3 hr 5 min / $50–$85)",
    optionKind: "public_or_diy",
    actualOperators: [
      "USDA Forest Service (Tongass National Forest)",
      "Juneau Tours / M&M Tours Glacier Express",
    ],
    islandsOrRegions: ["Juneau / Mendenhall Valley"],
    departureAreas: ["Downtown Juneau Cruise Docks (Round-Trip Glacier Shuttle)"],
    operatingMonths: [5, 6, 7, 8, 9],
    scheduleVerifiedThroughDate: "2026-09-30",
    vesselOrVehicleType:
      "Commercial round-trip motorcoach shuttle + paved/gravel USFS glacier viewing trails",
    groupCapacityRange: {
      min: 1,
      max: 50,
      label: "Self-paced USFS Mendenhall Glacier Visitor Area & trails",
    },
    rideComfortLevel: "shore_stationary",
    viewingSpaceDescription:
      "Shore-based views of Mendenhall Glacier, Mendenhall Lake icebergs, Steep Creek salmon viewing boardwalk, Photo Point, and Nugget Falls.",
    durationMinutes: {
      activity: 120,
      checkInLead: 15,
      typicalTransferEachWay: 25,
      totalDockOrHotelRange: { min: 150, max: 210 },
      label:
        "3 hr 5 min (185m) baseline (150–210m range: 15m boarding + 25m outbound + 120m on-site + 25m return)",
    },
    minimumAgeYears: 0,
    minimumAgeNote:
      "Open to all ages ($5 USFS Visitor Center fee applies to ages 16+; ages 15 and under free).",
    prohibitsPregnantOrSpinalConditions: false,
    accessibilityProfile: {
      stepFreeWheelchairSupported: true,
      limitedMobilitySupported: true,
      walkingAndBoardingRequirement:
        "USFS Mendenhall Visitor Center, Photo Point trail, and Steep Creek boardwalk are wheelchair accessible.",
      confirmationStatus: "confirmed_accessible",
      note: "No floating harbor ramp slope—ideal when minus low tides or motion sickness rule out marine vessels.",
    },
    transportationAvailability: {
      hotelPickupAvailable: false,
      cruisePortShuttleAvailable: true,
      selfDriveParkingNote:
        "Round-trip commercial glacier shuttles depart adjacent to the downtown cruise docks.",
    },
    cancellationTerms: "Operates rain or shine regardless of marine sea state.",
    whaleSightingOrReRidePolicy:
      "Land-based glacier, iceberg, waterfall, and seasonal salmon/black bear viewing (no marine whale watching).",
    indicativePriceUsd: {
      min: 50,
      max: 85,
      basisLabel:
        "$50–$85 per adult ($5 USFS Visitor Center fee ages 16+ plus ~$45–$80 round-trip commercial shuttle; outdoor trails $0)",
    },
    comparisonValues: {
      dockToDockDuration:
        "185 min (3 hr 5 min) baseline from downtown docks (150–210 min range)",
      operatorsAndVessels:
        "USFS Tongass National Forest + permitted downtown glacier shuttles",
      glacierAndWildlifeScope:
        "120 min at Mendenhall Glacier, Nugget Falls & Steep Creek (no vessel leg)",
      publishedPricing:
        "$50–$85 per adult ($5 USFS Visitor Center fee + ~$45–$80 shuttle)",
      seasonAndRegulations: "May through September (USFS Visitor Center season)",
    },
    tradeoffs: {
      strengths: [
        "Zero vessel motion and $50–$85 per adult total cost with 2 full hours on-site at Mendenhall Glacier and Nugget Falls",
        "35 minutes shorter than a standalone Auke Bay whale watch and 130 minutes shorter than the Combo",
      ],
      limitations: [
        "Does not include marine whale watching in Auke Bay",
        "Permitted commercial glacier express shuttles and Visitor Center operate May through September",
      ],
    },
    claimIds: ["clm-usfs-mendenhall-ground-shuttle-specs"],
    sourceIds: ["src-usfs-mendenhall-glacier"],
    bookingDestinations: [
      {
        destinationId: "dest-usfs-mendenhall-official",
        optionId: "jun-opt-usfs-mendenhall-shuttle",
        sellerType: "public_or_diy",
        sellerName: "USDA Forest Service — Mendenhall Glacier Recreation Area",
        actualOperatorName: "USDA Forest Service",
        label: "View Official USFS Mendenhall Glacier Visitor Area Hours & Fees ($5)",
        url: "https://www.fs.usda.gov/detail/tongass/about-forest/offices/?cid=fseprd1093566",
        supportedContextParams: [],
        relationshipDisclosure:
          "Official USDA Forest Service link. Destination Command Center has no commercial relationship with USFS.",
        isCommercialPartner: false,
        commissionInfluenceOnRanking: 0,
      },
    ],
  },
  {
    optionId: "jun-opt-downtown-seawalk-soboleff-tram",
    title:
      "Zero-Transfer Walkable Alternative: Downtown Juneau Seawalk, Overstreet Park ('Tahku' Bronze Whale) & Sealaska Heritage",
    shortLabel: "Downtown Seawalk, 'Tahku' Whale Park & Soboleff ($0–$60)",
    optionKind: "public_or_diy",
    actualOperators: [
      "City & Borough of Juneau (Seawalk & Overstreet Park)",
      "Sealaska Heritage Institute (Walter Soboleff Building)",
      "Goldbelt Tram",
    ],
    islandsOrRegions: ["Downtown Juneau Waterfront"],
    departureAreas: [
      "Immediate Walk-Off from Downtown Juneau Cruise Berths (0m shuttle transfer)",
    ],
    operatingMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    scheduleVerifiedThroughDate: "2026-12-31",
    vesselOrVehicleType:
      "Paved waterfront Seawalk + cultural center + optional aerial tramway",
    groupCapacityRange: {
      min: 1,
      max: 50,
      label: "Self-paced downtown waterfront walk (all ages)",
    },
    rideComfortLevel: "shore_stationary",
    viewingSpaceDescription:
      "Follows the paved Downtown Juneau Seawalk to Overstreet Park (featuring 'Tahku', a life-sized breaching bronze humpback whale sculpture in a saltwater infinity fountain overlooking Gastineau Channel), combined with the Walter Soboleff Building ($10) and optional Goldbelt Tram ($55–$60).",
    durationMinutes: {
      activity: 120,
      checkInLead: 0,
      typicalTransferEachWay: 0,
      totalDockOrHotelRange: { min: 60, max: 240 },
      label:
        "2.0 hr (120m) self-paced baseline (60–240m range; 0m bus transfer required)",
    },
    minimumAgeYears: 0,
    minimumAgeNote: "Open to all ages.",
    prohibitsPregnantOrSpinalConditions: false,
    accessibilityProfile: {
      stepFreeWheelchairSupported: true,
      limitedMobilitySupported: true,
      walkingAndBoardingRequirement:
        "Level paved Downtown Juneau Seawalk, ADA-accessible Overstreet Park viewing deck, and full elevator access inside the Walter Soboleff Building.",
      confirmationStatus: "confirmed_accessible",
      note: "Eliminates Statter Harbor minus-tide ramp slopes and bus transfers.",
    },
    transportationAvailability: {
      hotelPickupAvailable: false,
      cruisePortShuttleAvailable: false,
      selfDriveParkingNote:
        "Walk directly off the downtown cruise docks (CT, FKL, AS, ACT); zero shuttle required.",
    },
    cancellationTerms: "Self-paced public waterfront and museum access; no pre-booking required.",
    whaleSightingOrReRidePolicy:
      "Features the life-sized 'Tahku' bronze humpback whale monument at Overstreet Park and Gastineau Channel shoreline scanning (not an Auke Bay boat tour).",
    indicativePriceUsd: {
      min: 0,
      max: 60,
      basisLabel:
        "$0 free Seawalk & Overstreet Park ('Tahku' whale statue), $10 Walter Soboleff Center, optional $55–$60 Goldbelt Tram",
    },
    comparisonValues: {
      dockToDockDuration:
        "120 min (2.0 hr) self-paced (60–240 min range; 0m transfer)",
      operatorsAndVessels:
        "CBJ Seawalk / Overstreet Park, Sealaska Heritage Institute, Goldbelt Tram",
      glacierAndWildlifeScope:
        "Overstreet Park 'Tahku' bronze whale + Gastineau Channel shore + Tlingit/Haida/Tsimshian art",
      publishedPricing:
        "$0–$60 per person ($0 Seawalk/Park, $10 Soboleff Center, $55–$60 Tram)",
      seasonAndRegulations: "Year-round (months 1–12); zero all-aboard bus risk",
    },
    tradeoffs: {
      strengths: [
        "Zero bus transfer risk and $0–$10 base cost—works on any port call length, off-season month, or severe motion-sensitivity profile",
        "Fully step-free along the paved Downtown Seawalk to Overstreet Park ('Tahku' life-sized bronze humpback) and the Walter Soboleff Building",
      ],
      limitations: [
        "Shoreline cultural walk rather than a marine boat excursion into Auke Bay / Stephens Passage",
        "Does not visit Mendenhall Glacier",
      ],
    },
    claimIds: ["clm-downtown-juneau-seawalk-soboleff-specs"],
    sourceIds: ["src-juneau-seawalk-soboleff"],
    bookingDestinations: [
      {
        destinationId: "dest-sealaska-heritage-official",
        optionId: "jun-opt-downtown-seawalk-soboleff-tram",
        sellerType: "public_or_diy",
        sellerName: "Sealaska Heritage Institute",
        actualOperatorName: "Sealaska Heritage Institute",
        label: "View Walter Soboleff Building Hours & Downtown Juneau Cultural Info ($10)",
        url: "https://www.sealaskaheritage.org/institute/walter-soboleff-building",
        supportedContextParams: [],
        relationshipDisclosure:
          "Non-profit cultural institute link. Destination Command Center has no commercial relationship with Sealaska Heritage.",
        isCommercialPartner: false,
        commissionInfluenceOnRanking: 0,
      },
    ],
  },
];

export function computeJuneauWhaleTiming(
  option: CandidateOption,
  input: JuneauWhaleAnswerInput,
): TimingCalculationResult {
  const availableWindowMinutes = Math.round(input.portCallHours * 60);
  const dockEntry =
    JUNEAU_DOCK_TRANSFER_TABLE[input.arrivalDock as JuneauDockCode] ??
    JUNEAU_DOCK_TRANSFER_TABLE.UNKNOWN;

  const isDowntownWalkable =
    option.optionId === "jun-opt-downtown-seawalk-soboleff-tram";
  const extraPerWayOver25Baseline = Math.max(
    0,
    dockEntry.minutesToAukeBay - 25,
  );
  const transferEachWay = isDowntownWalkable
    ? extraPerWayOver25Baseline
    : dockEntry.minutesToAukeBay;
  const interActivityTransfer =
    option.optionId === "jun-opt-combo-whale-and-mendenhall" ? 25 : 0;
  const transferMinutesRoundTrip =
    transferEachWay * 2 + interActivityTransfer;
  const checkInLeadMinutes = option.durationMinutes.checkInLead;
  const activityMinutes = option.durationMinutes.activity;
  const returnBufferMinutes = isDowntownWalkable ? 60 : 120;
  const requiredTotalMinutes =
    checkInLeadMinutes +
    transferMinutesRoundTrip +
    activityMinutes +
    returnBufferMinutes;
  const netSlackMinutes = availableWindowMinutes - requiredTotalMinutes;

  return {
    availableWindowMinutes,
    requiredTotalMinutes,
    checkInLeadMinutes,
    transferMinutesRoundTrip,
    activityMinutes,
    returnBufferMinutes,
    netSlackMinutes,
    summary: `Dock ${input.arrivalDock} (${dockEntry.minutesToAukeBay}m each way to Auke Bay): ${checkInLeadMinutes}m check-in + ${transferMinutesRoundTrip}m transfers + ${activityMinutes}m activity + ${returnBufferMinutes}m ship buffer = ${requiredTotalMinutes}m required vs. ${availableWindowMinutes}m port call (${netSlackMinutes >= 0 ? `+${netSlackMinutes}m slack` : `${netSlackMinutes}m deficit`}).`,
  };
}

export const JUNEAU_WHALE_HARD_CONSTRAINTS: HardConstraintRule<JuneauWhaleAnswerInput>[] =
  [
    {
      ruleId: "hc-juneau-whale-operating-month",
      label: "Seasonal Operating Window",
      description:
        "Eliminates excursions that do not operate during the traveler's sailing month (e.g., Mendenhall Combo is May–September only).",
      sourceIds: [
        "src-allen-marine-juneau-whale",
        "src-usfs-mendenhall-glacier",
      ],
      evaluate: (option, input) => {
        if (!option.operatingMonths.includes(input.sailingMonth)) {
          return {
            passed: false,
            eliminationReason: `${option.shortLabel} does not operate in month ${input.sailingMonth} (verified operating months: ${option.operatingMonths.join(", ")}).`,
            whatInputChangeWouldAlterResult:
              "Select a sailing month between May and September (or April/October for Direct Auke Bay Whale Watching).",
          };
        }
        return { passed: true };
      },
    },
    {
      ruleId: "hc-juneau-whale-port-window-and-dock",
      label: "Cruise Port Call Window & 2-Hour (120-Minute) Recommended Ship Buffer",
      description:
        "Eliminates excursions whose total duration plus berth/tender transfer penalty and 120-minute (1:59:59+) recommended all-aboard buffer exceeds the port call.",
      sourceIds: ["src-allen-marine-juneau-whale"],
      evaluate: (option, _input, context) => {
        const timing = context.computeTimingForOption(option);
        if (
          timing.netSlackMinutes !== null &&
          timing.netSlackMinutes < 0
        ) {
          return {
            passed: false,
            eliminationReason: `${option.shortLabel} requires ${timing.requiredTotalMinutes} minutes including dock transfers and a ${timing.returnBufferMinutes}-minute all-aboard buffer, exceeding your ${timing.availableWindowMinutes}-minute port call by ${Math.abs(timing.netSlackMinutes)} minutes.`,
            whatInputChangeWouldAlterResult:
              option.optionId === "jun-opt-combo-whale-and-mendenhall"
                ? "Switch to the standalone 220-minute Direct Auke Bay Whale Watch (saves 95 minutes) or require at least a 6.5–7.0 hour port call."
                : "Increase available port call hours or choose the 185-minute USFS Mendenhall Shuttle / 120-minute Downtown Seawalk.",
          };
        }
        return { passed: true };
      },
    },
    {
      ruleId: "hc-juneau-whale-motion-avoidance",
      label: "Severe Motion Sensitivity / Land-Only Filter",
      description:
        "Eliminates marine vessels when the traveler selects severe motion avoidance (land-only).",
      sourceIds: [
        "src-usfs-mendenhall-glacier",
        "src-juneau-seawalk-soboleff",
      ],
      evaluate: (option, input) => {
        if (
          input.motionSensitivity === "severe_avoid_vessels" &&
          option.optionKind === "guided_commercial"
        ) {
          return {
            passed: false,
            eliminationReason: `${option.shortLabel} is a 2.25–2.5 hour marine excursion on Auke Bay, eliminated because you selected 'Severe — must stay on land'.`,
            whatInputChangeWouldAlterResult:
              "Change motion sensitivity to 'Low' or 'Moderate — prefer stabilized heated cabin catamarans'.",
          };
        }
        return { passed: true };
      },
    },
    {
      ruleId: "hc-juneau-whale-statter-harbor-minus-tide-ramp",
      label: "Statter Harbor Minus-Tide Ramp Slope Advisory",
      description:
        "Flags NOAA Station 9452210 minus-tide ramp slope and operator lift confirmation for wheelchair users on Auke Bay boats.",
      sourceIds: ["src-noaa-tides-juneau-9452210"],
      evaluate: (option, input) => {
        if (
          input.needsWheelchairOrLowRampSlope &&
          option.optionKind === "guided_commercial"
        ) {
          return {
            passed: true,
            decisionChangingWarning:
              "Statter Harbor (Auke Bay) floating dock ramps become significantly steeper during minus low tides (-3 to -5 ft MLLW at NOAA Station 9452210); confirm a wheelchair-accessible catamaran (Allen Marine / Gastineau Guiding) and check your sailing day's low-tide hour.",
          };
        }
        return { passed: true };
      },
    },
  ];

export const JUNEAU_WHALE_PREFERENCE_RULES: PreferenceRule<JuneauWhaleAnswerInput>[] =
  [
    {
      ruleId: "pref-juneau-whale-combo-vs-direct",
      label: "Standalone Whale Watch vs. Whale + Mendenhall Combo Fit",
      maxPoints: 50,
      evaluate: (option, input, context) => {
        const timing = context.computeTimingForOption(option);
        if (
          input.wantsMendenhallGlacierCombo &&
          option.optionId === "jun-opt-combo-whale-and-mendenhall"
        ) {
          return {
            points: 50,
            reason: `Directly fulfills your request to combine Auke Bay whale watching (~135m) and Mendenhall Glacier (~85m) in one coordinated 315-minute excursion with +${timing.netSlackMinutes}m of port-call slack.`,
          };
        }
        if (
          !input.wantsMendenhallGlacierCombo &&
          option.optionId === "jun-opt-auke-bay-whale-direct"
        ) {
          return {
            points: 50,
            reason: `Maximizes dedicated on-water whale watching time (150m vs. ~135m on the combo) at $169–$229/adult while preserving +${timing.netSlackMinutes}m of ship-return slack.`,
          };
        }
        if (
          input.wantsMendenhallGlacierCombo &&
          option.optionId === "jun-opt-auke-bay-whale-direct"
        ) {
          return {
            points: 35,
            reason:
              "Provides the full 150-minute Auke Bay whale watch when port timing or season makes the 315-minute Glacier Combo tighter.",
          };
        }
        return { points: 15, reason: null };
      },
    },
    {
      ruleId: "pref-juneau-whale-port-slack-margin",
      label: "All-Aboard Safety Slack Margin",
      maxPoints: 30,
      evaluate: (option, _input, context) => {
        const timing = context.computeTimingForOption(option);
        if (timing.netSlackMinutes !== null && timing.netSlackMinutes >= 90) {
          return {
            points: 30,
            reason: `Comfortable +${timing.netSlackMinutes} minutes of slack beyond the 60-minute all-aboard buffer.`,
          };
        }
        if (timing.netSlackMinutes !== null && timing.netSlackMinutes >= 30) {
          return {
            points: 20,
            reason: `Provides +${timing.netSlackMinutes} minutes of net slack beyond the 60-minute all-aboard buffer.`,
          };
        }
        return { points: 10, reason: null };
      },
    },
    {
      ruleId: "pref-juneau-whale-accessibility-and-stability",
      label: "Ramp Slope & Heated Cabin Stability Fit",
      maxPoints: 20,
      evaluate: (option, input) => {
        if (
          input.needsWheelchairOrLowRampSlope &&
          option.optionKind === "public_or_diy"
        ) {
          return {
            points: 20,
            reason:
              "Avoids Statter Harbor minus-tide floating dock ramp slopes entirely.",
          };
        }
        if (option.optionKind === "guided_commercial") {
          return {
            points: 18,
            reason:
              "Operates in sheltered Inside Passage waters (Stephens Passage / Favorite Channel) with heated indoor cabin seating and a whale sighting guarantee.",
          };
        }
        return { points: 10, reason: null };
      },
    },
  ];

export const JUNEAU_WHALE_DECISION_ENGINE: DecisionEngineDefinition<JuneauWhaleAnswerInput> =
  {
    engineId: "juneau-whale-watching",
    version: "2026.04.08-v1",
    slug: "juneau/whale-watching-tours",
    canonicalPath: "/juneau/whale-watching-tours",
    canonicalUrl:
      "https://destinationcommandcenter.com/juneau/whale-watching-tours",
    title:
      "Juneau Whale Watching Decision Engine — Direct Auke Bay (220m) vs. Mendenhall Glacier Combo (315m) & Dock Transfer Math",
    destinationName: "Juneau, Alaska",
    categoryName: "Whale Watching & Glacier Port-Day Excursions",
    heroQuestion:
      "Should you book a standalone 3 hr 40 min Auke Bay Whale Watch ($169–$229) or the 5 hr 15 min Whale + Mendenhall Glacier Combo ($219–$289) for your Juneau port call?",
    summaryDescription:
      "Constraint-first port-day evaluator using verified Juneau berth transfer times (CT/FKL/AS 25m, ACT 30m, AJ 35m, TENDER_FKL 45m), DCC's 2-hour (1:59:59+ / 120-minute) recommended all-aboard buffer, NOAA 50 CFR § 224.103(b) 100-yard humpback approach regulations, and NOAA Station 9452210 minus-tide Statter Harbor ramp slope advisories.",
    referenceGuide: {
      importantDecisionFactors: [
        {
          title:
            "220-Minute Standalone Whale Watch ($169–$229) vs. 315-Minute Whale + Mendenhall Combo ($219–$289)",
          detail:
            "Direct Auke Bay whale watching takes 220 minutes (3 hr 40 min) baseline with 150 minutes on the water. Adding the Mendenhall Glacier Visitor Area extends the excursion to 315 minutes (5 hr 15 min) baseline (~135m on water + ~85m at Mendenhall + 25m inter-site bus transfer). Once you add DCC's 2-hour (1:59:59+ / 120-minute) recommended all-aboard ship buffer and AJ/Tender dock penalties, port calls under 7.25 hours cannot meet the full 2-hour recommended buffer for the Combo.",
          sourceIds: ["src-allen-marine-juneau-whale"],
        },
        {
          title:
            "Berth & Tender Transfer Penalties to Statter Harbor (Auke Bay)",
          detail:
            "Downtown docks (CT, FKL, AS) are ~25 minutes each way from Statter Harbor; ACT is ~30 minutes; AJ Dock is ~35 minutes; and tendering from the Franklin Anchorage (TENDER_FKL) requires ~45 minutes each way.",
          sourceIds: ["src-allen-marine-juneau-whale"],
        },
        {
          title:
            "NOAA 50 CFR § 224.103(b) 100-Yard Rule & Station 9452210 Minus-Tide Ramp Slopes",
          detail:
            "All vessels in Alaska waters are legally prohibited from approaching within 100 yards of humpback whales (50 CFR § 224.103(b)). At Statter Harbor, semidiurnal tides of 16–20+ feet mean minus low tides (-3 to -5 ft MLLW) make floating dock ramps steep for wheelchair boarding.",
          sourceIds: [
            "src-noaa-50cfr224-103b",
            "src-noaa-tides-juneau-9452210",
          ],
        },
      ],
      experienceAndVesselTypes: [
        {
          typeName:
            "Stabilized Multi-Deck Heated Catamaran (Allen Marine / Gastineau Guiding)",
          capacityAndStability:
            "High stability in sheltered Stephens Passage / Favorite Channel with heated indoor cabins, large windows, and topside viewing decks.",
          bestFor:
            "Families, multi-generational cruise groups, and moderate motion-sensitivity travelers.",
          limitations:
            "Statter Harbor floating dock ramp slope still varies with tide height.",
          sourceIds: [
            "src-allen-marine-juneau-whale",
            "src-noaa-tides-juneau-9452210",
          ],
        },
        {
          typeName:
            "Small-Group Safari Vessel (6–20 Guests — Harv & Marv's / Gastineau Guiding)",
          capacityAndStability:
            "Smaller enclosed cabin cruisers with wrap-around walk-around decks.",
          bestFor:
            "Photographers wanting 360-degree rail access in small groups.",
          limitations:
            "Subject to the exact same federal 100-yard humpback approach limit (50 CFR § 224.103(b)) as larger catamarans.",
          sourceIds: [
            "src-allen-marine-juneau-whale",
            "src-noaa-50cfr224-103b",
          ],
        },
      ],
      departureLocations: [
        {
          islandOrRegion: "Auke Bay (12 Miles North of Downtown Juneau)",
          harborOrArea: "Statter Harbor (Auke Bay)",
          logisticsNote:
            "All Juneau whale watching boats depart from Statter Harbor via included round-trip coach transfer from the downtown cruise ship docks.",
          sourceIds: ["src-allen-marine-juneau-whale"],
        },
        {
          islandOrRegion: "Downtown Juneau Waterfront",
          harborOrArea:
            "Downtown Seawalk & Overstreet Park ('Tahku' Bronze Humpback Statue)",
          logisticsNote:
            "0-minute transfer from downtown docks for short port calls or land-only days.",
          sourceIds: ["src-juneau-seawalk-soboleff"],
        },
      ],
      commonTradeoffs: [
        {
          tradeoff:
            "Dedicated 150-Minute Whale Watch ($169–$229) vs. 315-Minute Whale + Glacier Combo ($219–$289)",
          explanation:
            "The standalone whale watch gives ~15 minutes more on-water time and finishes 95 minutes earlier, whereas the Combo adds ~85 minutes at Mendenhall Glacier without returning downtown in between.",
        },
        {
          tradeoff:
            "Weather Resilience vs. Helicopter Glacier Landings",
          explanation:
            "Auke Bay whale watching and the Mendenhall ground shuttle operate reliably under low overcast ceilings and rain that cancel Juneau helicopter glacier landings.",
        },
      ],
      operationalDependencies: [
        {
          dependency: "Seasonal Operating Windows (Mid-April–Mid-Oct vs. May–Sept)",
          impact:
            "Direct Auke Bay whale watching runs mid-April through mid-October (months 4–10), while Mendenhall Glacier Combo packages and USFS Visitor Center shuttles run May through September (months 5–9).",
          sourceIds: [
            "src-allen-marine-juneau-whale",
            "src-usfs-mendenhall-glacier",
          ],
        },
      ],
      methodologySteps: [
        "Filter by verified seasonal operating months (months 4–10 for Direct Auke Bay Whale; months 5–9 for Mendenhall Glacier Combo and USFS Shuttle).",
        "Compute exact berth-adjusted dock-to-dock timing using JUNEAU_DOCK_TRANSFER_TABLE plus a mandatory 60-minute all-aboard ship buffer.",
        "Apply motion-sensitivity and NOAA Station 9452210 minus-tide Statter Harbor ramp slope checks.",
        "Rank viable candidates by standalone vs. glacier-combo preference with zero commercial bias (commissionInfluenceOnRanking: 0).",
      ],
    },
    questions: JUNEAU_WHALE_QUESTIONS,
    answerSchema: JuneauWhaleAnswerSchema,
    defaultExampleInput: DEFAULT_JUNEAU_WHALE_INPUT,
    comparisonDimensions: JUNEAU_WHALE_COMPARISON_DIMENSIONS,
    candidateOptions: JUNEAU_WHALE_CANDIDATE_OPTIONS,
    hardConstraintRules: JUNEAU_WHALE_HARD_CONSTRAINTS,
    preferenceRules: JUNEAU_WHALE_PREFERENCE_RULES,
    evidenceClaims: JUNEAU_WHALE_CLAIMS,
    sourceRecords: JUNEAU_WHALE_SOURCES,
    computeTimingForOption: computeJuneauWhaleTiming,
    isExampleScenarioDetector: (rawInput) => {
      const isExample =
        rawInput === undefined ||
        rawInput === null ||
        (typeof rawInput === "object" &&
          Object.keys(rawInput as Record<string, unknown>).length === 0);
      const missingInputFacts: UnknownOrStaleFact[] = isExample
        ? [
            {
              factId: "unk-juneau-whale-example-input",
              optionId: null,
              category: "missing_traveler_input",
              summary:
                "Showing representative baseline scenario (7-hour July port call at Cruise Ship Terminal CT, standalone whale watch preference).",
              impactOnDecision:
                "Enter your exact port call hours, arrival berth (especially AJ or TENDER_FKL), and whether you want the Mendenhall Glacier Combo to test your all-aboard buffer.",
              sourceIds: ["src-allen-marine-juneau-whale"],
            },
          ]
        : [];
      return {
        isExample,
        banner: isExample
          ? "Example Scenario: 7-hour July port call at Cruise Ship Terminal (CT). Adjust port hours, berth (AJ or Tender), or toggle the Mendenhall Glacier Combo below."
          : null,
        missingInputFacts,
      };
    },
    customizeBookingDestinations: (
      option: CandidateOption,
    ): BookingDestination[] => option.bookingDestinations,
    evaluate: (
      rawInput: unknown,
      options?: DecisionEvaluateOptions,
    ): DecisionResult<JuneauWhaleAnswerInput> =>
      evaluateDecisionEngine(JUNEAU_WHALE_DECISION_ENGINE, rawInput, options),
  };
