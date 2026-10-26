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

export type HawaiiWhaleIsland = "maui" | "oahu" | "big_island" | "kauai";

export type HawaiiWhaleDepartureArea =
  | "any"
  | "maalaea_harbor"
  | "kaanapali_lahaina_corridor"
  | "honolulu_kewalo"
  | "kawaihae_kohala"
  | "kailua_kona"
  | "port_allen";

export interface HawaiiWhaleWatchingInput {
  island: HawaiiWhaleIsland;
  departureArea: HawaiiWhaleDepartureArea;
  travelDate: string | null;
  travelMonth: number;
  startingPoint: "hotel_resort" | "cruise_ship_pier" | "independent_car";
  availableWindowMinutes: number;
  cruiseReturnBufferMinutes: number;
  groupSize: number;
  youngestChildAgeYears: number | null;
  hasPregnantOrSpinalCondition: boolean;
  mobilityLevel:
    | "standard"
    | "limited_mobility_no_ladders"
    | "step_free_wheelchair";
  seasicknessOrRoughWaterConcern: "low" | "moderate" | "high_concern";
  departureTimeOfDay: "morning_calm" | "midday" | "afternoon_trades";
  vesselPreference:
    | "any"
    | "stabilized_catamaran_or_ship"
    | "sailing_catamaran"
    | "eye_level_rib_raft";
  charterPreference: "shared" | "private_charter" | "any";
  needsHotelOrPierTransfer: boolean;
  budgetMaxPerPersonUsd: number | null;
  priorityMode:
    | "comfort_and_stability"
    | "closest_eye_level_viewing"
    | "small_group_deck_space"
    | "budget_or_free";
}

export const HAWAII_WHALE_DEFAULT_EXAMPLE_INPUT: HawaiiWhaleWatchingInput = {
  island: "maui",
  departureArea: "any",
  travelDate: null,
  travelMonth: 2,
  startingPoint: "independent_car",
  availableWindowMinutes: 300,
  cruiseReturnBufferMinutes: 60,
  groupSize: 2,
  youngestChildAgeYears: null,
  hasPregnantOrSpinalCondition: false,
  mobilityLevel: "standard",
  seasicknessOrRoughWaterConcern: "moderate",
  departureTimeOfDay: "morning_calm",
  vesselPreference: "any",
  charterPreference: "shared",
  needsHotelOrPierTransfer: false,
  budgetMaxPerPersonUsd: null,
  priorityMode: "comfort_and_stability",
};

const ymdRegex = /^\d{4}-\d{2}-\d{2}$/;

export const HAWAII_WHALE_ANSWER_SCHEMA = z
  .object({
    island: z
      .enum(["maui", "oahu", "big_island", "kauai"])
      .default(HAWAII_WHALE_DEFAULT_EXAMPLE_INPUT.island),
    departureArea: z
      .enum([
        "any",
        "maalaea_harbor",
        "kaanapali_lahaina_corridor",
        "honolulu_kewalo",
        "kawaihae_kohala",
        "kailua_kona",
        "port_allen",
      ])
      .default(HAWAII_WHALE_DEFAULT_EXAMPLE_INPUT.departureArea),
    travelDate: z
      .string()
      .regex(ymdRegex, "travelDate must be YYYY-MM-DD when provided")
      .nullable()
      .default(HAWAII_WHALE_DEFAULT_EXAMPLE_INPUT.travelDate),
    travelMonth: z
      .number()
      .int()
      .min(1)
      .max(12)
      .default(HAWAII_WHALE_DEFAULT_EXAMPLE_INPUT.travelMonth),
    startingPoint: z
      .enum(["hotel_resort", "cruise_ship_pier", "independent_car"])
      .default(HAWAII_WHALE_DEFAULT_EXAMPLE_INPUT.startingPoint),
    availableWindowMinutes: z
      .number()
      .int()
      .min(60)
      .max(720)
      .default(HAWAII_WHALE_DEFAULT_EXAMPLE_INPUT.availableWindowMinutes),
    cruiseReturnBufferMinutes: z
      .number()
      .int()
      .min(30)
      .max(180)
      .default(HAWAII_WHALE_DEFAULT_EXAMPLE_INPUT.cruiseReturnBufferMinutes),
    groupSize: z
      .number()
      .int()
      .min(1)
      .max(40)
      .default(HAWAII_WHALE_DEFAULT_EXAMPLE_INPUT.groupSize),
    youngestChildAgeYears: z
      .number()
      .int()
      .min(0)
      .max(17)
      .nullable()
      .default(HAWAII_WHALE_DEFAULT_EXAMPLE_INPUT.youngestChildAgeYears),
    hasPregnantOrSpinalCondition: z
      .boolean()
      .default(HAWAII_WHALE_DEFAULT_EXAMPLE_INPUT.hasPregnantOrSpinalCondition),
    mobilityLevel: z
      .enum([
        "standard",
        "limited_mobility_no_ladders",
        "step_free_wheelchair",
      ])
      .default(HAWAII_WHALE_DEFAULT_EXAMPLE_INPUT.mobilityLevel),
    seasicknessOrRoughWaterConcern: z
      .enum(["low", "moderate", "high_concern"])
      .default(HAWAII_WHALE_DEFAULT_EXAMPLE_INPUT.seasicknessOrRoughWaterConcern),
    departureTimeOfDay: z
      .enum(["morning_calm", "midday", "afternoon_trades"])
      .default(HAWAII_WHALE_DEFAULT_EXAMPLE_INPUT.departureTimeOfDay),
    vesselPreference: z
      .enum([
        "any",
        "stabilized_catamaran_or_ship",
        "sailing_catamaran",
        "eye_level_rib_raft",
      ])
      .default(HAWAII_WHALE_DEFAULT_EXAMPLE_INPUT.vesselPreference),
    charterPreference: z
      .enum(["shared", "private_charter", "any"])
      .default(HAWAII_WHALE_DEFAULT_EXAMPLE_INPUT.charterPreference),
    needsHotelOrPierTransfer: z
      .boolean()
      .default(HAWAII_WHALE_DEFAULT_EXAMPLE_INPUT.needsHotelOrPierTransfer),
    budgetMaxPerPersonUsd: z
      .number()
      .min(0)
      .max(5000)
      .nullable()
      .default(HAWAII_WHALE_DEFAULT_EXAMPLE_INPUT.budgetMaxPerPersonUsd),
    priorityMode: z
      .enum([
        "comfort_and_stability",
        "closest_eye_level_viewing",
        "small_group_deck_space",
        "budget_or_free",
      ])
      .default(HAWAII_WHALE_DEFAULT_EXAMPLE_INPUT.priorityMode),
  })
  .strict();

export const HAWAII_WHALE_SOURCES: SourceRecord[] = [
  {
    sourceId: "src-noaa-humpback-sanctuary-2026",
    sourceOrganization:
      "NOAA Hawaiian Islands Humpback Whale National Marine Sanctuary",
    sourceTitle:
      "Federal 100-Yard Approach Rule (50 CFR § 224.103(a)), Seasonal Migration Window (Nov–May), and Sanctuary Shore Lookouts",
    sourceUrl: "https://hawaiihumpbackwhale.noaa.gov/visit/whale-watching.html",
    claimsSupported: [
      "claim-hi-noaa-100yd-rule",
      "claim-hi-seasonality-nov-may",
      "claim-hi-auau-channel-density",
      "claim-hi-noaa-shore-lookouts",
    ],
    retrievedAt: "2026-04-14T18:00:00Z",
    verifiedAt: "2026-04-14T18:00:00Z",
    expiresAt: "2026-12-31T23:59:59Z",
    freshnessCategory: "regulatory_annual",
    status: "current",
  },
  {
    sourceId: "src-hawaii-dlnr-dobor-2026",
    sourceOrganization:
      "Hawaiʻi Department of Land and Natural Resources — Division of Boating and Ocean Recreation (DOBOR)",
    sourceTitle:
      "Small Boat Harbor Commercial Slip Operations: Maʻalaea, Mala Wharf, Kewalo Basin, Kawaihae, Honokōhau & Port Allen",
    sourceUrl: "https://dlnr.hawaii.gov/dobor/harbors/",
    claimsSupported: [
      "claim-hi-harbor-boarding-vs-beach",
      "claim-hi-cruise-pier-distances",
    ],
    retrievedAt: "2026-04-14T19:00:00Z",
    verifiedAt: "2026-04-14T19:00:00Z",
    expiresAt: "2026-12-31T23:59:59Z",
    freshnessCategory: "regulatory_annual",
    status: "current",
  },
  {
    sourceId: "src-nws-honolulu-marine-trades-2026",
    sourceOrganization: "National Weather Service Honolulu (PHFO)",
    sourceTitle:
      "Hawaiian Coastal Waters Trade-Wind Diurnal Strengthening & Channel Sea State Guidance",
    sourceUrl: "https://www.weather.gov/hfo/marine",
    claimsSupported: ["claim-hi-morning-vs-afternoon-trades"],
    retrievedAt: "2026-04-15T12:00:00Z",
    verifiedAt: "2026-04-15T12:00:00Z",
    expiresAt: "2026-12-31T23:59:59Z",
    freshnessCategory: "live_telemetry",
    status: "current",
  },
  {
    sourceId: "src-pacwhale-eco-adventures-2026",
    sourceOrganization: "PacWhale Eco-Adventures (Pacific Whale Foundation — Maui)",
    sourceTitle:
      "Maʻalaea Harbor Catamaran Whale Watch Specifications, Accessibility, Sighting Guarantee & Cancellation Policy",
    sourceUrl: "https://www.pacificwhale.org/cruises/maui-whale-watch/",
    claimsSupported: [
      "claim-hi-pacwhale-catamaran-specs",
      "claim-hi-pacwhale-recent-reviews",
    ],
    retrievedAt: "2026-04-15T14:00:00Z",
    verifiedAt: "2026-04-15T14:00:00Z",
    expiresAt: "2027-05-15T23:59:59Z",
    freshnessCategory: "operator_tariff_and_policy",
    status: "current",
  },
  {
    sourceId: "src-trilogy-maui-whale-2026",
    sourceOrganization: "Trilogy Excursions (Maui — Maʻalaea & Kāʻanapali)",
    sourceTitle:
      "Small-Group Sailing Catamaran Whale Watch Capacity, Minimum Age, and Harbor vs. Beach Boarding Rules",
    sourceUrl: "https://sailtrilogy.com/tour/whale-watch/",
    claimsSupported: [
      "claim-hi-trilogy-sail-specs",
      "claim-hi-harbor-boarding-vs-beach",
    ],
    retrievedAt: "2026-04-15T14:30:00Z",
    verifiedAt: "2026-04-15T14:30:00Z",
    expiresAt: "2027-05-15T23:59:59Z",
    freshnessCategory: "operator_tariff_and_policy",
    status: "current",
  },
  {
    sourceId: "src-hawaii-ocean-rafting-rib-2026",
    sourceOrganization: "Hawaii Ocean Rafting / Maui Adventure Cruises",
    sourceTitle:
      "Eye-Level Rigid-Hull Inflatable (RIB) Whale Watch Age, Pregnancy, and Back/Neck Safety Restrictions",
    sourceUrl: "https://hawaiioceanrafting.com/whale-watching/",
    claimsSupported: ["claim-hi-rib-raft-safety-restrictions"],
    retrievedAt: "2026-04-15T15:00:00Z",
    verifiedAt: "2026-04-15T15:00:00Z",
    expiresAt: "2027-05-15T23:59:59Z",
    freshnessCategory: "operator_tariff_and_policy",
    status: "current",
  },
  {
    sourceId: "src-star-of-honolulu-oahu-2026",
    sourceOrganization: "Star of Honolulu Cruises (Pier 8 Aloha Tower, Oʻahu)",
    sourceTitle:
      "Premier Whale Watch 232-ft Stabilized Vessel, Elevator Wheelchair Access, Waikīkī Shuttle & Guarantee",
    sourceUrl: "https://starofhonolulu.com/whale-watch-cruises",
    claimsSupported: [
      "claim-hi-star-of-honolulu-ada-stabilized",
      "claim-hi-cruise-pier-distances",
    ],
    retrievedAt: "2026-04-15T15:30:00Z",
    verifiedAt: "2026-04-15T15:30:00Z",
    expiresAt: "2027-05-15T23:59:59Z",
    freshnessCategory: "operator_tariff_and_policy",
    status: "current",
  },
  {
    sourceId: "src-ocean-sports-kohala-2026",
    sourceOrganization: "Ocean Sports Waikoloa / Kohala Coast (Big Island)",
    sourceTitle:
      "Kawaihae Harbor & Kohala Coast Catamaran Whale Watch Specifications and Sighting Guarantee",
    sourceUrl: "https://hawaiioceansports.com/cruises/whale-watch/",
    claimsSupported: ["claim-hi-big-island-kohala-specs"],
    retrievedAt: "2026-04-15T16:00:00Z",
    verifiedAt: "2026-04-15T16:00:00Z",
    expiresAt: "2027-05-15T23:59:59Z",
    freshnessCategory: "operator_tariff_and_policy",
    status: "current",
  },
  {
    sourceId: "src-holoholo-kauai-2026",
    sourceOrganization: "Holo Holo Charters (Port Allen, Kauaʻi)",
    sourceTitle:
      "Port Allen Power Catamaran Whale Watch Minimum Age, Pregnancy Rule, and Check-In Terms",
    sourceUrl: "https://www.holoholocharters.com/kauai-boat-tours/",
    claimsSupported: ["claim-hi-kauai-holoholo-specs"],
    retrievedAt: "2026-04-15T16:30:00Z",
    verifiedAt: "2026-04-15T16:30:00Z",
    expiresAt: "2027-05-15T23:59:59Z",
    freshnessCategory: "operator_tariff_and_policy",
    status: "current",
  },
];

export const HAWAII_WHALE_CLAIMS: EvidenceClaim[] = [
  {
    claimId: "claim-hi-noaa-100yd-rule",
    classification: "official_rule",
    statement:
      "Under federal regulation 50 CFR § 224.103(a), all vessels in Hawaiian waters must remain at least 100 yards (91.4 meters) from humpback whales; when whales approach a vessel on their own ('mugging'), captains must place engines in neutral until whales move clear.",
    fieldsSupported: ["tradeoffs", "comparisonValues"],
    sourceIds: ["src-noaa-humpback-sanctuary-2026"],
    isDecisionChanging: true,
    verificationNote: "Verified against NOAA Sanctuary federal approach regulations.",
  },
  {
    claimId: "claim-hi-seasonality-nov-may",
    classification: "official_rule",
    statement:
      "North Pacific humpback whales (kohola) migrate to Hawaiian breeding and calving waters from November through May, with peak mother-calf and competition-pod density from January through March; commercial whale watch tours do not operate June through October.",
    fieldsSupported: ["operatingMonths"],
    sourceIds: ["src-noaa-humpback-sanctuary-2026"],
    isDecisionChanging: true,
    verificationNote: "Verified against NOAA Sanctuary seasonal migration biology.",
  },
  {
    claimId: "claim-hi-auau-channel-density",
    classification: "official_rule",
    statement:
      "The shallow (<250 ft), island-sheltered ʻAuʻau Channel between Maui, Lānaʻi, Molokaʻi, and Kahoʻolawe hosts the highest concentration of mother-calf humpback pairs in the Hawaiian Archipelago.",
    fieldsSupported: ["islandsOrRegions", "tradeoffs"],
    sourceIds: ["src-noaa-humpback-sanctuary-2026"],
    isDecisionChanging: true,
    verificationNote: "Verified against NOAA Sanctuary bathymetry & population distribution reports.",
  },
  {
    claimId: "claim-hi-morning-vs-afternoon-trades",
    classification: "forecast_or_model_output",
    statement:
      "Hawaiian northeast trade winds typically strengthen between 11:00 AM and 3:00 PM due to diurnal island heating, increasing whitecaps and short-period wind chop in Maʻalaea Bay and channel crossings compared to 7:30–9:30 AM departures.",
    fieldsSupported: ["rideComfortLevel", "tradeoffs"],
    sourceIds: ["src-nws-honolulu-marine-trades-2026"],
    isDecisionChanging: true,
    verificationNote: "Verified against NWS Honolulu marine forecast climatology.",
  },
  {
    claimId: "claim-hi-harbor-boarding-vs-beach",
    classification: "official_rule",
    statement:
      "Maʻalaea Small Boat Harbor, Aloha Tower / Kewalo Basin, Kawaihae Harbor, and Port Allen provide paved pier/slip boarding, whereas Kāʻanapali beach-loading catamarans require wading knee-deep in shorebreak.",
    fieldsSupported: ["accessibilityProfile", "departureAreas"],
    sourceIds: ["src-hawaii-dlnr-dobor-2026", "src-trilogy-maui-whale-2026"],
    isDecisionChanging: true,
    verificationNote: "Verified against DLNR DOBOR harbor facilities and operator boarding advisories.",
  },
  {
    claimId: "claim-hi-cruise-pier-distances",
    classification: "official_rule",
    statement:
      "Kahului Cruise Harbor (Maui) is ~20–25 minutes each way by ground transfer to Maʻalaea Harbor; Honolulu Cruise Pier 2/11 (Oʻahu) is ~10 minutes to Aloha Tower Pier 8; Nawiliwili Harbor (Kauaʻi) is ~30–35 minutes to Port Allen.",
    fieldsSupported: ["durationMinutes.typicalTransferEachWay"],
    sourceIds: ["src-hawaii-dlnr-dobor-2026", "src-star-of-honolulu-oahu-2026"],
    isDecisionChanging: true,
    verificationNote: "Verified against Hawaii harbor corridor transfer times.",
  },
  {
    claimId: "claim-hi-pacwhale-catamaran-specs",
    classification: "operator_published_fact",
    statement:
      "PacWhale Eco-Adventures operates 65-ft double-deck power catamarans from Maʻalaea Harbor with certified marine naturalists, underwater hydrophones, shaded cabin seating, designated wheelchair-accessible slips, all-ages admission, and a free 1-year re-ride sighting guarantee.",
    fieldsSupported: [
      "durationMinutes",
      "accessibilityProfile",
      "whaleSightingOrReRidePolicy",
      "indicativePriceUsd",
    ],
    sourceIds: ["src-pacwhale-eco-adventures-2026"],
    isDecisionChanging: true,
    verificationNote: "Verified from PacWhale Eco-Adventures Maui Whale Watch specifications.",
  },
  {
    claimId: "claim-hi-pacwhale-recent-reviews",
    classification: "recent_third_party_review_evidence",
    statement:
      "Dated recent traveler reviews (Jan–Mar 2026) highlight clear hydrophone whale-song audio, stable twin-hull ride in morning waters, and attentive naturalist commentary on Maʻalaea departures.",
    fieldsSupported: ["reviewEvidenceConfig"],
    sourceIds: ["src-pacwhale-eco-adventures-2026"],
    isDecisionChanging: false,
    verificationNote: "Summarized from verified dated reviews within the 180-day window.",
  },
  {
    claimId: "claim-hi-trilogy-sail-specs",
    classification: "operator_published_fact",
    statement:
      "Trilogy Excursions caps whale-watch capacity on its custom sailing catamarans (~36–45 guests) so every passenger has rail-side viewing without triple-stacking; requires minimum age 3+.",
    fieldsSupported: ["groupCapacityRange", "minimumAgeYears", "indicativePriceUsd"],
    sourceIds: ["src-trilogy-maui-whale-2026"],
    isDecisionChanging: true,
    verificationNote: "Verified from Trilogy Excursions Maui Whale Watch terms.",
  },
  {
    claimId: "claim-hi-rib-raft-safety-restrictions",
    classification: "operator_published_fact",
    statement:
      "Rigid-hull inflatable (RIB) rafts (14–24 passengers) sit at water level for eye-to-eye encounters but enforce strict safety exclusions: minimum age 4–5+, no pregnant guests, no history of neck/back/spinal surgery, and no wheelchair/step-free access.",
    fieldsSupported: [
      "minimumAgeYears",
      "prohibitsPregnantOrSpinalConditions",
      "accessibilityProfile",
      "rideComfortLevel",
    ],
    sourceIds: ["src-hawaii-ocean-rafting-rib-2026"],
    isDecisionChanging: true,
    verificationNote: "Verified from Hawaii Ocean Rafting passenger safety restrictions.",
  },
  {
    claimId: "claim-hi-star-of-honolulu-ada-stabilized",
    classification: "operator_published_fact",
    statement:
      "The 232-ft Star of Honolulu on Oʻahu features 3 types of gyroscopic/fin stabilizers, four walk-around decks, onboard passenger elevators, ADA restrooms, ramp boarding at Pier 8, optional Waikīkī coach pickup, and a free re-ride guarantee.",
    fieldsSupported: [
      "rideComfortLevel",
      "accessibilityProfile",
      "transportationAvailability",
      "indicativePriceUsd",
    ],
    sourceIds: ["src-star-of-honolulu-oahu-2026"],
    isDecisionChanging: true,
    verificationNote: "Verified from Star of Honolulu Premier Whale Watch ADA & vessel page.",
  },
  {
    claimId: "claim-hi-big-island-kohala-specs",
    classification: "operator_published_fact",
    statement:
      "Big Island whale watches departing Kawaihae Harbor & Kohala Coast cruise leeward nursery waters with onboard hydrophones, 2.0–2.5 hour durations, minimum age 2+, and a complimentary re-ride sighting guarantee.",
    fieldsSupported: ["islandsOrRegions", "durationMinutes", "indicativePriceUsd"],
    sourceIds: ["src-ocean-sports-kohala-2026"],
    isDecisionChanging: true,
    verificationNote: "Verified from Ocean Sports Kohala Whale Watch specifications.",
  },
  {
    claimId: "claim-hi-kauai-holoholo-specs",
    classification: "operator_published_fact",
    statement:
      "Holo Holo Charters departs Port Allen (South/West Kauaʻi) on a 50-ft power catamaran (2.5–3.0 hours), enforcing minimum age 5+ and prohibiting pregnant passengers due to open-channel swell.",
    fieldsSupported: [
      "islandsOrRegions",
      "minimumAgeYears",
      "prohibitsPregnantOrSpinalConditions",
    ],
    sourceIds: ["src-holoholo-kauai-2026"],
    isDecisionChanging: true,
    verificationNote: "Verified from Holo Holo Charters Kauaʻi tour policies.",
  },
  {
    claimId: "claim-hi-noaa-shore-lookouts",
    classification: "official_rule",
    statement:
      "Free public shore-based whale watching is available daily during season at official NOAA Sanctuary & state overlooks — including Papawai / McGregor Point (Maui), Makapuʻu Point (Oʻahu), Puʻukoholā Heiau (Big Island), and Poʻipū / Kīlauea Point (Kauaʻi) — with zero seasickness and step-free parking overlooks at Papawai and Puʻukoholā, though whales are typically 0.25–1.5 miles offshore.",
    fieldsSupported: ["indicativePriceUsd", "accessibilityProfile", "tradeoffs"],
    sourceIds: ["src-noaa-humpback-sanctuary-2026"],
    isDecisionChanging: true,
    verificationNote: "Verified from NOAA Sanctuary shore-based viewing guide.",
  },
];

export const HAWAII_WHALE_QUESTIONS: QuestionDefinition[] = [
  {
    questionId: "island",
    label: "Which Hawaiian island are you visiting?",
    helpText: "Maui's shallow ʻAuʻau Channel has the highest mother-calf density, while Oʻahu, Big Island (Kohala), and Kauaʻi offer distinct harbor and vessel profiles.",
    inputType: "select",
    requiredForPersonalizedVerdict: true,
    decisionImpactExplanation:
      "Hard filter: only vessels and NOAA shore lookouts on your selected island are viable.",
    drivenByClaimIds: [
      "claim-hi-auau-channel-density",
      "claim-hi-star-of-honolulu-ada-stabilized",
      "claim-hi-big-island-kohala-specs",
      "claim-hi-kauai-holoholo-specs",
    ],
    options: [
      { value: "maui", label: "Maui (Maʻalaea Harbor & West Maui / ʻAuʻau Channel)" },
      { value: "oahu", label: "Oʻahu (Honolulu Pier 8 / Kewalo & Makapuʻu)" },
      { value: "big_island", label: "Hawaiʻi Island / Big Island (Kohala / Kawaihae & Kona)" },
      { value: "kauai", label: "Kauaʻi (Port Allen / South Shore)" },
    ],
    defaultValue: "maui",
  },
  {
    questionId: "departureArea",
    label: "Preferred departure harbor or coast",
    helpText: "Select 'Any harbor on this island' to compare all departures on your island.",
    inputType: "select",
    requiredForPersonalizedVerdict: false,
    decisionImpactExplanation:
      "Filters to a specific harbor when you want to avoid cross-island driving or beach wading.",
    drivenByClaimIds: ["claim-hi-harbor-boarding-vs-beach"],
    options: [
      { value: "any", label: "Any harbor or coast on selected island" },
      { value: "maalaea_harbor", label: "Maʻalaea Harbor (Central/South Maui — paved slip boarding)" },
      { value: "kaanapali_lahaina_corridor", label: "West Maui / Mala Ramp & Kāʻanapali Corridor" },
      { value: "honolulu_kewalo", label: "Honolulu / Aloha Tower Pier 8 & Kewalo Basin (Oʻahu)" },
      { value: "kawaihae_kohala", label: "Kawaihae Harbor & Kohala Coast (Big Island)" },
      { value: "kailua_kona", label: "Kailua-Kona / Honokōhau (Big Island)" },
      { value: "port_allen", label: "Port Allen Harbor, Eleʻele (Kauaʻi)" },
    ],
    defaultValue: "any",
  },
  {
    questionId: "travelDate",
    label: "Exact travel date (optional)",
    helpText: "Enter your exact date for a personalized verdict, or leave blank to explore the labeled February peak-season example.",
    inputType: "date",
    requiredForPersonalizedVerdict: true,
    decisionImpactExplanation:
      "Verifies whether your date falls inside the November–May humpback migration window and within confirmed operator schedules.",
    drivenByClaimIds: ["claim-hi-seasonality-nov-may"],
    defaultValue: null,
  },
  {
    questionId: "travelMonth",
    label: "Month of travel (if exact date not entered)",
    helpText: "Humpback season runs mid-November through April/early May (peak Jan–Mar). Whales are in Alaska June–October.",
    inputType: "select",
    requiredForPersonalizedVerdict: false,
    decisionImpactExplanation:
      "Hard biological constraint: eliminates commercial humpback whale tours during off-season months (June–October).",
    drivenByClaimIds: ["claim-hi-seasonality-nov-may"],
    options: [
      { value: "1", label: "January (Peak calf & competition pod season)" },
      { value: "2", label: "February (Peak humpback density across all islands)" },
      { value: "3", label: "March (Peak season)" },
      { value: "12", label: "December (Early-to-mid season; active arrivals)" },
      { value: "4", label: "April (Late season; sightings tapering)" },
      { value: "11", label: "November (Early arrivals; limited departures)" },
      { value: "5", label: "May (End of migration; most whale tours closed)" },
      { value: "7", label: "July (Off-season — humpbacks are in Alaska)" },
      { value: "8", label: "August (Off-season — humpbacks are in Alaska)" },
    ],
    defaultValue: 2,
  },
  {
    questionId: "startingPoint",
    label: "Where are you starting from that day?",
    helpText: "Cruise passengers require harbor transfer math and an all-aboard return buffer.",
    inputType: "select",
    requiredForPersonalizedVerdict: false,
    decisionImpactExplanation:
      "Determines ground transfer allowance and whether ship all-aboard buffer rules apply.",
    drivenByClaimIds: ["claim-hi-cruise-pier-distances"],
    options: [
      { value: "independent_car", label: "Rental car / self-drive to harbor" },
      { value: "hotel_resort", label: "Hotel or resort (Waikīkī, Kāʻanapali, Wailea, Kohala, Poʻipū)" },
      { value: "cruise_ship_pier", label: "Cruise ship pier (Kahului, Honolulu Pier 2/11, Kona, Nawiliwili)" },
    ],
    defaultValue: "independent_car",
  },
  {
    questionId: "availableWindowMinutes",
    label: "Total available time window (minutes, door-to-door)",
    helpText: "Standard 2-hour whale watches require ~195–240 minutes including 30–45m check-in and harbor parking/transfers.",
    inputType: "number",
    requiredForPersonalizedVerdict: false,
    decisionImpactExplanation:
      "Hard constraint: eliminates tours whose activity + check-in + round-trip transfer + buffer exceed your window.",
    drivenByClaimIds: [
      "claim-hi-pacwhale-catamaran-specs",
      "claim-hi-cruise-pier-distances",
    ],
    min: 60,
    max: 720,
    defaultValue: 300,
  },
  {
    questionId: "cruiseReturnBufferMinutes",
    label: "Required return safety buffer (minutes)",
    helpText: "60 minutes recommended when returning to a cruise ship or flight.",
    inputType: "number",
    requiredForPersonalizedVerdict: false,
    decisionImpactExplanation:
      "Reserved safety margin subtracted from your available window on cruise-port days.",
    drivenByClaimIds: ["claim-hi-cruise-pier-distances"],
    min: 30,
    max: 180,
    defaultValue: 60,
  },
  {
    questionId: "groupSize",
    label: "Number of travelers in your party",
    helpText: "RIB rafts cap at 14–24 guests; sailing catamarans ~36–45; multi-deck vessels 65+.",
    inputType: "number",
    requiredForPersonalizedVerdict: false,
    decisionImpactExplanation:
      "Eliminates small-capacity rafts or private charters that cannot accommodate your party size.",
    drivenByClaimIds: [
      "claim-hi-trilogy-sail-specs",
      "claim-hi-rib-raft-safety-restrictions",
    ],
    min: 1,
    max: 40,
    defaultValue: 2,
  },
  {
    questionId: "youngestChildAgeYears",
    label: "Youngest child age (years, or leave empty if adults only)",
    helpText: "RIB rafts require age 4–5+; Trilogy requires age 3+; Kauaʻi Holo Holo requires age 5+; PacWhale & Star of Honolulu welcome all ages.",
    inputType: "number",
    requiredForPersonalizedVerdict: false,
    decisionImpactExplanation:
      "Hard safety constraint: eliminates vessels whose USCG/insurance minimum age is higher than your youngest child.",
    drivenByClaimIds: [
      "claim-hi-pacwhale-catamaran-specs",
      "claim-hi-trilogy-sail-specs",
      "claim-hi-rib-raft-safety-restrictions",
      "claim-hi-kauai-holoholo-specs",
    ],
    min: 0,
    max: 17,
    defaultValue: null,
  },
  {
    questionId: "hasPregnantOrSpinalCondition",
    label: "Any pregnant traveler or serious neck/back/spinal condition?",
    helpText: "High-speed RIB rafts and open-channel Kauaʻi power catamarans strictly prohibit pregnant guests and spinal conditions.",
    inputType: "boolean",
    requiredForPersonalizedVerdict: false,
    decisionImpactExplanation:
      "Hard medical/safety rule: eliminates high-impact RIB rafts and vessels with pregnancy/spinal exclusions.",
    drivenByClaimIds: [
      "claim-hi-rib-raft-safety-restrictions",
      "claim-hi-kauai-holoholo-specs",
    ],
    defaultValue: false,
  },
  {
    questionId: "mobilityLevel",
    label: "Mobility, boarding, and accessibility requirement",
    helpText: "Distinguishes paved harbor ramp boarding + ADA elevators from beach surf wading or high-step inflatable tubes.",
    inputType: "select",
    requiredForPersonalizedVerdict: false,
    decisionImpactExplanation:
      "Hard constraint: eliminates RIB rafts and beach-wading vessels when step-free wheelchair or no-ladder harbor boarding is required.",
    drivenByClaimIds: [
      "claim-hi-harbor-boarding-vs-beach",
      "claim-hi-pacwhale-catamaran-specs",
      "claim-hi-star-of-honolulu-ada-stabilized",
      "claim-hi-noaa-shore-lookouts",
    ],
    options: [
      { value: "standard", label: "Standard mobility (can climb vessel steps or wade if beach boarding)" },
      { value: "limited_mobility_no_ladders", label: "Limited mobility (harbor dock step-in only; no beach wading or RIB tubes)" },
      { value: "step_free_wheelchair", label: "Step-free / wheelchair user (requires harbor ramp & accessible deck)" },
    ],
    defaultValue: "standard",
  },
  {
    questionId: "seasicknessOrRoughWaterConcern",
    label: "Seasickness or rough-water concern",
    helpText: "Afternoon trade winds increase chop; RIB rafts ride directly on the swell while stabilized ships and shore lookouts minimize motion.",
    inputType: "select",
    requiredForPersonalizedVerdict: false,
    decisionImpactExplanation:
      "Eliminates high-slamming RIB rafts when rough-water concern is high and ranks stabilized multi-deck vessels and NOAA shore lookouts first.",
    drivenByClaimIds: [
      "claim-hi-morning-vs-afternoon-trades",
      "claim-hi-star-of-honolulu-ada-stabilized",
      "claim-hi-noaa-shore-lookouts",
    ],
    options: [
      { value: "low", label: "Low concern (comfortable on small boats and open-channel swell)" },
      { value: "moderate", label: "Moderate (prefer twin-hull catamaran stability and morning departures)" },
      { value: "high_concern", label: "High concern (prone to motion sickness; avoid small rafts, prefer max stability or shore)" },
    ],
    defaultValue: "moderate",
  },
  {
    questionId: "departureTimeOfDay",
    label: "Preferred time of day",
    helpText: "7:30–9:30 AM departures experience calmer seas before afternoon northeast trade winds build.",
    inputType: "select",
    requiredForPersonalizedVerdict: false,
    decisionImpactExplanation:
      "Warns when afternoon trade-wind departures conflict with rough-water sensitivity.",
    drivenByClaimIds: ["claim-hi-morning-vs-afternoon-trades"],
    options: [
      { value: "morning_calm", label: "Early / Mid-Morning (7:30–10:00 AM — calmest trade-wind conditions)" },
      { value: "midday", label: "Midday (11:00 AM–1:30 PM — bright overhead light, building breeze)" },
      { value: "afternoon_trades", label: "Afternoon (2:00–4:30 PM — stronger trade winds & chop in channels)" },
    ],
    defaultValue: "morning_calm",
  },
  {
    questionId: "vesselPreference",
    label: "Preferred boat style",
    helpText: "Used to rank viable options after hard safety, island, and mobility rules are satisfied.",
    inputType: "select",
    requiredForPersonalizedVerdict: false,
    decisionImpactExplanation:
      "Preference ranking signal across stabilized ships/catamarans, small-group sailing catamarans, and eye-level RIB rafts.",
    drivenByClaimIds: [
      "claim-hi-pacwhale-catamaran-specs",
      "claim-hi-trilogy-sail-specs",
      "claim-hi-rib-raft-safety-restrictions",
      "claim-hi-star-of-honolulu-ada-stabilized",
    ],
    options: [
      { value: "any", label: "Any boat style that fits my constraints" },
      { value: "stabilized_catamaran_or_ship", label: "Large Power Catamaran or Stabilized Ship (maximum stability, shade & restrooms)" },
      { value: "sailing_catamaran", label: "Small-Group Sailing Catamaran (uncrowded rail space, quiet under sail)" },
      { value: "eye_level_rib_raft", label: "Eye-Level Rigid-Hull Inflatable Raft (14–24 guests, closest water-line view)" },
    ],
    defaultValue: "any",
  },
  {
    questionId: "charterPreference",
    label: "Shared tour vs. private charter",
    helpText: "Select 'Private charter' if your group wants exclusive use of a USCG-inspected catamaran.",
    inputType: "select",
    requiredForPersonalizedVerdict: false,
    decisionImpactExplanation:
      "Filters or ranks private charter vs. shared per-seat excursions.",
    drivenByClaimIds: ["claim-hi-trilogy-sail-specs"],
    options: [
      { value: "shared", label: "Shared public departure (per-person ticket)" },
      { value: "private_charter", label: "Private charter only (exclusive vessel for our group)" },
      { value: "any", label: "Show both shared tours and private charters" },
    ],
    defaultValue: "shared",
  },
  {
    questionId: "needsHotelOrPierTransfer",
    label: "Require operator hotel/pier shuttle pickup (no rental car or Uber)?",
    helpText: "Most Maui Maʻalaea operators require self-drive or ride-share; Star of Honolulu on Oʻahu offers dedicated Waikīkī coach pickup.",
    inputType: "boolean",
    requiredForPersonalizedVerdict: false,
    decisionImpactExplanation:
      "Eliminates self-drive-only departures when you explicitly require operator-provided hotel or cruise-pier shuttle pickup.",
    drivenByClaimIds: [
      "claim-hi-star-of-honolulu-ada-stabilized",
      "claim-hi-hawaii-dlnr-dobor-2026",
    ],
    defaultValue: false,
  },
  {
    questionId: "budgetMaxPerPersonUsd",
    label: "Maximum budget per person (USD, optional)",
    helpText: "Standard catamarans start ~$65–$99; sailing catamarans ~$99–$139; NOAA Sanctuary shore lookouts are $0 (free).",
    inputType: "number",
    requiredForPersonalizedVerdict: false,
    decisionImpactExplanation:
      "Hard constraint: eliminates commercial tours whose minimum published per-person fare exceeds your ceiling.",
    drivenByClaimIds: [
      "claim-hi-pacwhale-catamaran-specs",
      "claim-hi-trilogy-sail-specs",
      "claim-hi-noaa-shore-lookouts",
    ],
    min: 0,
    max: 5000,
    defaultValue: null,
  },
  {
    questionId: "priorityMode",
    label: "What matters most for this trip?",
    helpText: "Orders viable options after all hard constraints pass.",
    inputType: "select",
    requiredForPersonalizedVerdict: false,
    decisionImpactExplanation:
      "Weights preference scoring toward stability/shade, eye-level proximity, uncrowded rail space, or low/free cost.",
    drivenByClaimIds: [
      "claim-hi-noaa-100yd-rule",
      "claim-hi-pacwhale-catamaran-specs",
      "claim-hi-trilogy-sail-specs",
      "claim-hi-rib-raft-safety-restrictions",
    ],
    options: [
      { value: "comfort_and_stability", label: "Maximum stability, shade, restrooms & marine naturalist narration" },
      { value: "small_group_deck_space", label: "Small-group rail space without triple-stacked crowds" },
      { value: "closest_eye_level_viewing", label: "Eye-level water-line viewing & fast pod positioning" },
      { value: "budget_or_free", label: "Lowest cost or free shore-based viewing" },
    ],
    defaultValue: "comfort_and_stability",
  },
];

export const HAWAII_WHALE_COMPARISON_DIMENSIONS: ComparisonDimension[] = [
  {
    dimensionId: "islandAndHarbor",
    label: "Island & Departure Harbor",
    description: "Exact harbor slip or shore overlook location.",
  },
  {
    dimensionId: "vesselAndCapacity",
    label: "Boat Type & Group Size",
    description: "Hull stability, deck layout, and passenger cap.",
  },
  {
    dimensionId: "rideStabilityAndViewing",
    label: "Stability, Shade & Rail Space",
    description: "Motion profile, shaded cabin area, and hydrophone availability.",
  },
  {
    dimensionId: "ageAndMedicalRules",
    label: "Age, Pregnancy & Spinal Rules",
    description: "USCG/operator minimum age and medical exclusions.",
  },
  {
    dimensionId: "accessibilityAndBoarding",
    label: "Boarding & Wheelchair Access",
    description: "Paved harbor ramp vs. dock steps vs. beach surf wading.",
  },
  {
    dimensionId: "durationAndGuarantee",
    label: "Duration, Price & Sighting Policy",
    description: "On-water hours, published price range, and re-ride guarantee.",
  },
];

export const HAWAII_WHALE_CANDIDATE_OPTIONS: CandidateOption[] = [
  {
    optionId: "hi-whale-maui-pacwhale-catamaran",
    title: "PacWhale Eco-Adventures: Maʻalaea Harbor Marine Naturalist Catamaran (Maui)",
    shortLabel: "PacWhale Maʻalaea Catamaran (Maui)",
    optionKind: "guided_commercial",
    actualOperators: ["PacWhale Eco-Adventures (Pacific Whale Foundation)"],
    islandsOrRegions: ["maui"],
    departureAreas: ["maalaea_harbor"],
    operatingMonths: [11, 12, 1, 2, 3, 4, 5],
    scheduleVerifiedThroughDate: "2027-05-15",
    vesselOrVehicleType: "65-ft Double-Deck Power Catamaran",
    groupCapacityRange: {
      min: 1,
      max: 110,
      label: "65–110 guests across two decks + stadium bow",
    },
    rideComfortLevel: "high_stability",
    viewingSpaceDescription:
      "Wide twin-hull main cabin with shaded seating, marine restrooms, upper observation sun deck, and underwater hydrophone speaker system.",
    durationMinutes: {
      activity: 120,
      checkInLead: 45,
      typicalTransferEachWay: 25,
      totalDockOrHotelRange: { min: 195, max: 235 },
      label: "2.0 hrs on water (~3.5 hrs total incl. 45m harbor check-in & parking/transfer)",
    },
    minimumAgeYears: null,
    minimumAgeNote: "All ages welcome; infants under 3 ride free with ticketed adult.",
    prohibitsPregnantOrSpinalConditions: false,
    accessibilityProfile: {
      stepFreeWheelchairSupported: true,
      limitedMobilitySupported: true,
      walkingAndBoardingRequirement:
        "Paved harbor slip at Maʻalaea with ramp boarding onto main deck; manual and designated power wheelchairs supported with 48-hour advance notice.",
      confirmationStatus: "confirmed_accessible",
      note: "Paved Maʻalaea slip boarding; accessible main deck and restroom on designated vessels.",
    },
    transportationAvailability: {
      hotelPickupAvailable: false,
      cruisePortShuttleAvailable: false,
      selfDriveParkingNote:
        "Paid meter parking at Maʻalaea Harbor ($1/hr); ~22 min taxi/ride-share from Kahului Cruise Pier or Wailea.",
    },
    cancellationTerms: "Full refund or reschedule with 24+ hours advance notice; 100% refund if captain cancels for high wind warning.",
    whaleSightingOrReRidePolicy:
      "Guaranteed whale sighting or receive a free Whalewatch voucher valid for 1 year.",
    indicativePriceUsd: {
      min: 68,
      max: 99,
      basisLabel: "per adult (children 3–12 discounted; under 3 free)",
    },
    comparisonValues: {
      islandAndHarbor: "Maui — Maʻalaea Small Boat Harbor (Slip boarding)",
      vesselAndCapacity: "65-ft Double-Deck Power Catamaran (65–110 guests)",
      rideStabilityAndViewing: "High twin-hull stability, shaded main cabin, underwater hydrophone",
      ageAndMedicalRules: "All ages welcome; suitable for expectant mothers",
      accessibilityAndBoarding: "Confirmed step-free harbor ramp boarding (advance notice)",
      durationAndGuarantee: "2.0 hrs | $68–$99 pp | Free 1-year re-ride guarantee",
    },
    tradeoffs: {
      strengths: [
        "Departs directly into the shallow ʻAuʻau Channel with certified marine naturalists and underwater hydrophone",
        "All ages welcome, shaded main cabin with restrooms, and step-free harbor slip boarding",
        "100% profits support Pacific Whale Foundation research and conservation",
      ],
      limitations: [
        "Larger passenger count (65–110 guests) means sharing rail space during surface breaches",
        "Does not include hotel shuttle pickup (requires rental car or 20–25 min ride-share to Maʻalaea)",
      ],
    },
    claimIds: [
      "claim-hi-noaa-100yd-rule",
      "claim-hi-seasonality-nov-may",
      "claim-hi-auau-channel-density",
      "claim-hi-morning-vs-afternoon-trades",
      "claim-hi-harbor-boarding-vs-beach",
      "claim-hi-pacwhale-catamaran-specs",
      "claim-hi-pacwhale-recent-reviews",
    ],
    sourceIds: [
      "src-noaa-humpback-sanctuary-2026",
      "src-hawaii-dlnr-dobor-2026",
      "src-nws-honolulu-marine-trades-2026",
      "src-pacwhale-eco-adventures-2026",
    ],
    bookingDestinations: [
      {
        destinationId: "dest-pacwhale-direct",
        optionId: "hi-whale-maui-pacwhale-catamaran",
        sellerType: "direct_operator",
        sellerName: "PacWhale Eco-Adventures (Direct Operator)",
        actualOperatorName: "PacWhale Eco-Adventures",
        label: "Book direct with PacWhale Eco-Adventures",
        url: "https://www.pacificwhale.org/cruises/maui-whale-watch/",
        supportedContextParams: [],
        relationshipDisclosure: "Direct operator link — no DCC commission bias.",
        isCommercialPartner: false,
        commissionInfluenceOnRanking: 0,
      },
    ],
    reviewEvidenceConfig: {
      productCode: "HI-MAUI-PACWHALE-CAT",
      checkStatus: "checked_ok",
      lastRetrievedAt: "2026-04-15T14:00:00Z",
      sourcesQueried: ["pacwhale_verified_guest_reviews"],
      reviews: [
        {
          reviewId: "rev-pw-1",
          productCode: "HI-MAUI-PACWHALE-CAT",
          source: "pacwhale_verified_guest_reviews",
          rating: 5,
          publishedDate: "2026-03-18",
          providerVerified: true,
          text: "Our 8:00 AM Ma'alaea departure had smooth conditions, clear hydrophone whale songs, and a very comfortable shaded main cabin and friendly crew.",
        },
        {
          reviewId: "rev-pw-2",
          productCode: "HI-MAUI-PACWHALE-CAT",
          source: "pacwhale_verified_guest_reviews",
          rating: 5,
          publishedDate: "2026-02-27",
          providerVerified: true,
          text: "Great marine naturalist guide commentary and smooth boat ride while two humpbacks surfaced right off the bow.",
        },
        {
          reviewId: "rev-pw-3",
          productCode: "HI-MAUI-PACWHALE-CAT",
          source: "pacwhale_verified_guest_reviews",
          rating: 4,
          publishedDate: "2026-02-11",
          providerVerified: true,
          text: "Smooth catamaran ride, helpful guide crew, and easy slip boarding at Ma'alaea Harbor.",
        },
      ],
    },
  },
  {
    optionId: "hi-whale-maui-trilogy-sail-cat",
    title: "Trilogy Excursions: Small-Group Sailing Catamaran Whale Watch (Maui)",
    shortLabel: "Trilogy Small-Group Sailing Catamaran (Maui)",
    optionKind: "guided_commercial",
    actualOperators: ["Trilogy Excursions"],
    islandsOrRegions: ["maui"],
    departureAreas: ["maalaea_harbor", "kaanapali_lahaina_corridor"],
    operatingMonths: [12, 1, 2, 3, 4],
    scheduleVerifiedThroughDate: "2027-04-15",
    vesselOrVehicleType: "50–55 ft Custom Sailing Catamaran (Capped Small Group)",
    groupCapacityRange: {
      min: 1,
      max: 45,
      label: "Capped at 36–45 guests (single-row rail viewing)",
    },
    rideComfortLevel: "moderate_open_water",
    viewingSpaceDescription:
      "Forward trampolines, shaded aft cockpit, marine restrooms, underwater hydrophone, and capped capacity so no guest is stuck three rows back.",
    durationMinutes: {
      activity: 120,
      checkInLead: 30,
      typicalTransferEachWay: 25,
      totalDockOrHotelRange: { min: 180, max: 220 },
      label: "2.0 hrs on water (~3.0–3.5 hrs total incl. 30m check-in & transfer)",
    },
    minimumAgeYears: 3,
    minimumAgeNote: "Minimum age 3 years required on Trilogy public whale watches.",
    prohibitsPregnantOrSpinalConditions: false,
    accessibilityProfile: {
      stepFreeWheelchairSupported: false,
      limitedMobilitySupported: true,
      walkingAndBoardingRequirement:
        "Maʻalaea Harbor departure uses dock steps onto catamaran deck (suitable for guests with moderate mobility who can manage 2–3 steps). Kāʻanapali departure loads directly from the beach and requires wading in knee-deep surf.",
      confirmationStatus: "operator_confirmation_required",
      note: "Select Maʻalaea Harbor slip departure (not Kāʻanapali beach-loading) if avoiding surf wading.",
    },
    transportationAvailability: {
      hotelPickupAvailable: false,
      cruisePortShuttleAvailable: false,
      selfDriveParkingNote:
        "Harbor parking at Maʻalaea or resort beach access at Kāʻanapali Beach Hotel / Whalers Village.",
    },
    cancellationTerms: "Full refund with 48 hours notice or if operator cancels for weather.",
    whaleSightingOrReRidePolicy:
      "High seasonal sighting rate in ʻAuʻau Channel; re-ride offered on next available departure if no whales sighted.",
    indicativePriceUsd: {
      min: 99,
      max: 129,
      basisLabel: "per adult (includes snacks, beverages & naturalist narration)",
    },
    comparisonValues: {
      islandAndHarbor: "Maui — Maʻalaea Harbor (slip) or Kāʻanapali Beach (surf load)",
      vesselAndCapacity: "Custom Sailing Catamaran (capped at 36–45 guests)",
      rideStabilityAndViewing: "Uncrowded single-row rail space, forward trampolines & hydrophone",
      ageAndMedicalRules: "Minimum age 3+; expectant mothers welcome on calm morning departures",
      accessibilityAndBoarding: "Dock steps at Maʻalaea; beach surf wading at Kāʻanapali (no wheelchairs)",
      durationAndGuarantee: "2.0 hrs | $99–$129 pp | Re-ride on available seat if no sighting",
    },
    tradeoffs: {
      strengths: [
        "Capped passenger count (~36–45 guests) guarantees unobstructed rail-side viewing and photography",
        "Quiet sailing catamaran experience with underwater hydrophone in the heart of ʻAuʻau Channel",
      ],
      limitations: [
        "Minimum age 3+ excludes infants and toddlers under 3",
        "Kāʻanapali departure requires wading through beach shorebreak (use Maʻalaea for dry dock boarding)",
      ],
    },
    claimIds: [
      "claim-hi-noaa-100yd-rule",
      "claim-hi-seasonality-nov-may",
      "claim-hi-auau-channel-density",
      "claim-hi-harbor-boarding-vs-beach",
      "claim-hi-trilogy-sail-specs",
    ],
    sourceIds: [
      "src-noaa-humpback-sanctuary-2026",
      "src-hawaii-dlnr-dobor-2026",
      "src-trilogy-maui-whale-2026",
    ],
    bookingDestinations: [
      {
        destinationId: "dest-trilogy-direct",
        optionId: "hi-whale-maui-trilogy-sail-cat",
        sellerType: "direct_operator",
        sellerName: "Trilogy Excursions (Direct Operator)",
        actualOperatorName: "Trilogy Excursions",
        label: "Book direct with Trilogy Excursions",
        url: "https://sailtrilogy.com/tour/whale-watch/",
        supportedContextParams: [],
        relationshipDisclosure: "Direct operator link — no DCC commission bias.",
        isCommercialPartner: false,
        commissionInfluenceOnRanking: 0,
      },
    ],
    reviewEvidenceConfig: {
      productCode: "HI-MAUI-TRILOGY-SAIL",
      checkStatus: "checked_ok",
      lastRetrievedAt: "2026-04-15T14:30:00Z",
      sourcesQueried: ["trilogy_verified_guest_reviews"],
      reviews: [
        {
          reviewId: "rev-tr-1",
          productCode: "HI-MAUI-TRILOGY-SAIL",
          source: "trilogy_verified_guest_reviews",
          rating: 5,
          publishedDate: "2026-03-09",
          providerVerified: true,
          text: "Worth every dollar for the capped group size—everyone had a spot at the rail and the crew was fantastic.",
        },
        {
          reviewId: "rev-tr-2",
          productCode: "HI-MAUI-TRILOGY-SAIL",
          source: "trilogy_verified_guest_reviews",
          rating: 5,
          publishedDate: "2026-02-19",
          providerVerified: true,
          text: "Great crew and captain lowered the hydrophone in the Auau Channel and the whale song echoed right through the hull.",
        },
        {
          reviewId: "rev-tr-3",
          productCode: "HI-MAUI-TRILOGY-SAIL",
          source: "trilogy_verified_guest_reviews",
          rating: 5,
          publishedDate: "2026-01-28",
          providerVerified: true,
          text: "Wonderful crew and uncrowded deck space out of Ma'alaea Harbor.",
        },
      ],
    },
  },
  {
    optionId: "hi-whale-maui-eye-level-rib-raft",
    title: "Hawaii Ocean Rafting / Maui Adventure Cruises: Eye-Level RIB Raft (West Maui)",
    shortLabel: "West Maui Eye-Level RIB Raft",
    optionKind: "guided_commercial",
    actualOperators: ["Hawaii Ocean Rafting", "Maui Adventure Cruises"],
    islandsOrRegions: ["maui"],
    departureAreas: ["kaanapali_lahaina_corridor"],
    operatingMonths: [12, 1, 2, 3, 4],
    scheduleVerifiedThroughDate: "2027-04-15",
    vesselOrVehicleType: "30-ft Rigid-Hull Inflatable Boat (RIB Raft)",
    groupCapacityRange: {
      min: 1,
      max: 24,
      label: "14–24 guests maximum (360-degree water-level tube seating)",
    },
    rideComfortLevel: "high_motion_raft_or_aircraft",
    viewingSpaceDescription:
      "Open-air inflatable pontoon seating right at the waterline in the ʻAuʻau Channel between West Maui and Lānaʻi.",
    durationMinutes: {
      activity: 120,
      checkInLead: 30,
      typicalTransferEachWay: 35,
      totalDockOrHotelRange: { min: 185, max: 230 },
      label: "2.0 hrs on water (~3.25–3.75 hrs total incl. check-in & West Maui transfer)",
    },
    minimumAgeYears: 5,
    minimumAgeNote: "Strict minimum age 5+ years required for open-water RIB rafts.",
    prohibitsPregnantOrSpinalConditions: true,
    accessibilityProfile: {
      stepFreeWheelchairSupported: false,
      limitedMobilitySupported: false,
      walkingAndBoardingRequirement:
        "Requires stepping onto rounded inflatable tubes and holding onto grab lines during fast open-water transit.",
      confirmationStatus: "not_accessible",
      note: "Not suitable for guests with limited mobility, pregnancy, or back/neck issues.",
    },
    transportationAvailability: {
      hotelPickupAvailable: false,
      cruisePortShuttleAvailable: false,
      selfDriveParkingNote:
        "Departs Mala Wharf / West Maui corridor (~40–45 min drive from Kahului Cruise Pier; ~10 min from Kāʻanapali hotels).",
    },
    cancellationTerms: "Full refund with 24–48 hours notice or if captain cancels for sea state.",
    whaleSightingOrReRidePolicy: "Free re-ride guarantee if no humpback whales are sighted.",
    indicativePriceUsd: {
      min: 89,
      max: 119,
      basisLabel: "per person",
    },
    comparisonValues: {
      islandAndHarbor: "Maui — West Maui / Mala Wharf & Kāʻanapali Corridor",
      vesselAndCapacity: "30-ft Rigid-Hull Inflatable Raft (14–24 guests)",
      rideStabilityAndViewing: "Waterline eye-level viewing; high motion & spray in chop",
      ageAndMedicalRules: "Ages 5+ only; strictly NO pregnancy or neck/back/spinal conditions",
      accessibilityAndBoarding: "Not accessible (requires stepping onto inflatable pontoon tubes)",
      durationAndGuarantee: "2.0 hrs | $89–$119 pp | Free re-ride guarantee",
    },
    tradeoffs: {
      strengths: [
        "Lowest freeboard in Maui puts you eye-to-eye at the waterline when curious whales ('muggers') approach the boat",
        "Fast transit reaches outer ʻAuʻau Channel pods before larger vessels arrive",
      ],
      limitations: [
        "Bumpy, high-motion ride in afternoon trade winds with minimal shade and no full stand-up cabin restroom",
        "Strictly prohibits children under 5, pregnant travelers, and anyone with back/neck conditions",
      ],
    },
    claimIds: [
      "claim-hi-noaa-100yd-rule",
      "claim-hi-seasonality-nov-may",
      "claim-hi-auau-channel-density",
      "claim-hi-morning-vs-afternoon-trades",
      "claim-hi-rib-raft-safety-restrictions",
    ],
    sourceIds: [
      "src-noaa-humpback-sanctuary-2026",
      "src-nws-honolulu-marine-trades-2026",
      "src-hawaii-ocean-rafting-rib-2026",
    ],
    bookingDestinations: [
      {
        destinationId: "dest-hawaii-ocean-rafting-direct",
        optionId: "hi-whale-maui-eye-level-rib-raft",
        sellerType: "direct_operator",
        sellerName: "Hawaii Ocean Rafting (Direct Operator)",
        actualOperatorName: "Hawaii Ocean Rafting",
        label: "Book direct with Hawaii Ocean Rafting",
        url: "https://hawaiioceanrafting.com/whale-watching/",
        supportedContextParams: [],
        relationshipDisclosure: "Direct operator link — no DCC commission bias.",
        isCommercialPartner: false,
        commissionInfluenceOnRanking: 0,
      },
    ],
  },
  {
    optionId: "hi-whale-oahu-star-of-honolulu-stabilized",
    title: "Star of Honolulu: 232-ft Stabilized Ship Premier Whale Watch (Oʻahu)",
    shortLabel: "Star of Honolulu Stabilized Ship (Oʻahu)",
    optionKind: "guided_commercial",
    actualOperators: ["Star of Honolulu Cruises & Events"],
    islandsOrRegions: ["oahu"],
    departureAreas: ["honolulu_kewalo"],
    operatingMonths: [12, 1, 2, 3, 4],
    scheduleVerifiedThroughDate: "2027-04-30",
    vesselOrVehicleType: "232-ft Triple-Stabilized Excursion Vessel (4 Walk-Around Decks + Elevator)",
    groupCapacityRange: {
      min: 1,
      max: 300,
      label: "Spacious 4-deck ship with indoor lounges & 60-ft high observation sun deck",
    },
    rideComfortLevel: "high_stability",
    viewingSpaceDescription:
      "Four full walk-around decks, 60-ft elevated 360-degree observation deck for spotting blows miles away, climate-controlled indoor lounges, and onboard passenger elevators.",
    durationMinutes: {
      activity: 120,
      checkInLead: 30,
      typicalTransferEachWay: 15,
      totalDockOrHotelRange: { min: 170, max: 210 },
      label: "2.0–2.5 hrs on water (~3.0 hrs total; optional Waikīkī hotel coach pickup available)",
    },
    minimumAgeYears: null,
    minimumAgeNote: "All ages welcome; stroller and family friendly.",
    prohibitsPregnantOrSpinalConditions: false,
    accessibilityProfile: {
      stepFreeWheelchairSupported: true,
      limitedMobilitySupported: true,
      walkingAndBoardingRequirement:
        "Paved Pier 8 ramp boarding, onboard passenger elevators serving multiple decks, and ADA-compliant restrooms. Wheelchair-lift motorcoach transfer from Waikīkī available with 48-hour notice.",
      confirmationStatus: "confirmed_accessible",
      note: "Highest accessibility & stability rating in Hawaiʻi (Pier 8 ramp + onboard elevators + ADA coach option).",
    },
    transportationAvailability: {
      hotelPickupAvailable: true,
      cruisePortShuttleAvailable: true,
      selfDriveParkingNote:
        "Optional round-trip Waikīkī hotel motorcoach pickup (+$20), or 10-minute walk/short cab from Honolulu Cruise Terminal Pier 2/11 to Aloha Tower Pier 8.",
    },
    cancellationTerms: "Full refund with 24+ hours notice prior to departure.",
    whaleSightingOrReRidePolicy:
      "Guaranteed whale sighting or receive a free Child/Adult return Whale Watch Check until a whale is sighted.",
    indicativePriceUsd: {
      min: 65,
      max: 105,
      basisLabel: "per adult (+$20 optional Waikīkī coach pickup or lunch upgrade)",
    },
    comparisonValues: {
      islandAndHarbor: "Oʻahu — Aloha Tower Marketplace Pier 8, Honolulu",
      vesselAndCapacity: "232-ft Stabilized Ship (4 walk-around decks + elevators)",
      rideStabilityAndViewing: "3 stabilizer systems + 60-ft high observation deck + indoor lounge",
      ageAndMedicalRules: "All ages welcome; safe for expectant mothers & sensitive backs",
      accessibilityAndBoarding: "Confirmed ADA ramp, onboard elevators & accessible Waikīkī coach",
      durationAndGuarantee: "2.0–2.5 hrs | $65–$105 pp | Free re-ride sighting guarantee",
    },
    tradeoffs: {
      strengths: [
        "Three stabilizer systems and 232-ft hull length provide the smoothest ride for motion-sensitive guests",
        "Confirmed onboard elevators, ADA restrooms, optional Waikīkī hotel coach pickup, and immediate proximity to Honolulu Cruise Pier 2/11",
      ],
      limitations: [
        "High deck elevation views whales from above rather than eye-level at the waterline",
        "Oʻahu's south shore has lower overall humpback density than Maui's ʻAuʻau Channel",
      ],
    },
    claimIds: [
      "claim-hi-noaa-100yd-rule",
      "claim-hi-seasonality-nov-may",
      "claim-hi-cruise-pier-distances",
      "claim-hi-star-of-honolulu-ada-stabilized",
    ],
    sourceIds: [
      "src-noaa-humpback-sanctuary-2026",
      "src-hawaii-dlnr-dobor-2026",
      "src-star-of-honolulu-oahu-2026",
    ],
    bookingDestinations: [
      {
        destinationId: "dest-star-of-honolulu-direct",
        optionId: "hi-whale-oahu-star-of-honolulu-stabilized",
        sellerType: "direct_operator",
        sellerName: "Star of Honolulu (Direct Operator)",
        actualOperatorName: "Star of Honolulu Cruises & Events",
        label: "Book direct with Star of Honolulu",
        url: "https://starofhonolulu.com/whale-watch-cruises",
        supportedContextParams: [],
        relationshipDisclosure: "Direct operator link — no DCC commission bias.",
        isCommercialPartner: false,
        commissionInfluenceOnRanking: 0,
      },
    ],
    reviewEvidenceConfig: {
      productCode: "HI-OAHU-STAR-HONOLULU",
      checkStatus: "checked_ok",
      lastRetrievedAt: "2026-04-15T15:30:00Z",
      sourcesQueried: ["star_of_honolulu_verified_reviews"],
      reviews: [
        {
          reviewId: "rev-soh-1",
          productCode: "HI-OAHU-STAR-HONOLULU",
          source: "star_of_honolulu_verified_reviews",
          rating: 5,
          publishedDate: "2026-03-14",
          providerVerified: true,
          text: "My husband uses a wheelchair and the Pier 8 ramp plus onboard elevator and helpful crew made this completely stress-free.",
        },
        {
          reviewId: "rev-soh-2",
          productCode: "HI-OAHU-STAR-HONOLULU",
          source: "star_of_honolulu_verified_reviews",
          rating: 4,
          publishedDate: "2026-02-22",
          providerVerified: true,
          text: "I usually get seasick on small boats, but the stabilizers on the Star of Honolulu kept the ride remarkably smooth off Diamond Head.",
        },
        {
          reviewId: "rev-soh-3",
          productCode: "HI-OAHU-STAR-HONOLULU",
          source: "star_of_honolulu_verified_reviews",
          rating: 5,
          publishedDate: "2026-01-30",
          providerVerified: true,
          text: "Smooth ride, friendly crew, and convenient Waikiki motorcoach pickup.",
        },
      ],
    },
  },
  {
    optionId: "hi-whale-big-island-kohala-catamaran",
    title: "Ocean Sports / Kohala Coast: Kawaihae & Kohala Hydrophone Catamaran (Big Island)",
    shortLabel: "Kohala Coast Catamaran (Big Island)",
    optionKind: "guided_commercial",
    actualOperators: ["Ocean Sports Waikoloa"],
    islandsOrRegions: ["big_island"],
    departureAreas: ["kawaihae_kohala", "kailua_kona"],
    operatingMonths: [12, 1, 2, 3, 4],
    scheduleVerifiedThroughDate: "2027-04-15",
    vesselOrVehicleType: "48–60 ft Twin-Hull Power/Sailing Catamaran",
    groupCapacityRange: {
      min: 1,
      max: 49,
      label: "35–49 guests",
    },
    rideComfortLevel: "high_stability",
    viewingSpaceDescription:
      "Shaded cabin, forward viewing deck, onboard underwater hydrophone, and leeward protection from Kohala mountains.",
    durationMinutes: {
      activity: 120,
      checkInLead: 30,
      typicalTransferEachWay: 25,
      totalDockOrHotelRange: { min: 185, max: 225 },
      label: "2.0–2.5 hrs on water (~3.25–3.75 hrs total incl. check-in & resort/harbor transfer)",
    },
    minimumAgeYears: 2,
    minimumAgeNote: "Recommended for ages 2 and up.",
    prohibitsPregnantOrSpinalConditions: false,
    accessibilityProfile: {
      stepFreeWheelchairSupported: false,
      limitedMobilitySupported: true,
      walkingAndBoardingRequirement:
        "Kawaihae Harbor departure uses dock steps onto catamaran deck; Anaehoʻomalu Bay departure boards from beach shuttle boat.",
      confirmationStatus: "operator_confirmation_required",
      note: "Choose Kawaihae Harbor departure for dock step-in boarding.",
    },
    transportationAvailability: {
      hotelPickupAvailable: false,
      cruisePortShuttleAvailable: false,
      selfDriveParkingNote:
        "Free harbor parking at Kawaihae South Small Boat Harbor (~35–40 min north of Kailua-Kona tender pier).",
    },
    cancellationTerms: "Full refund with 24 hours notice or weather cancellation.",
    whaleSightingOrReRidePolicy: "Free re-ride guarantee on next available whale watch if no whales are sighted.",
    indicativePriceUsd: {
      min: 109,
      max: 139,
      basisLabel: "per adult (includes drinks & snacks)",
    },
    comparisonValues: {
      islandAndHarbor: "Big Island — Kawaihae Harbor / Kohala Coast",
      vesselAndCapacity: "Twin-Hull Catamaran (35–49 guests)",
      rideStabilityAndViewing: "Leeward Kohala shelter, shaded deck & hydrophone",
      ageAndMedicalRules: "Ages 2+; suitable for families",
      accessibilityAndBoarding: "Dock steps at Kawaihae Harbor (operator confirmation required)",
      durationAndGuarantee: "2.0–2.5 hrs | $109–$139 pp | Free re-ride guarantee",
    },
    tradeoffs: {
      strengths: [
        "Cruises the sheltered leeward Kohala Coast nursery waters with high mother-calf sighting rates on Hawaiʻi Island",
        "Includes underwater hydrophone and refreshments",
      ],
      limitations: [
        "Kawaihae Harbor is a 35–40 minute drive north of Kailua-Kona cruise tender pier",
      ],
    },
    claimIds: [
      "claim-hi-noaa-100yd-rule",
      "claim-hi-seasonality-nov-may",
      "claim-hi-big-island-kohala-specs",
    ],
    sourceIds: [
      "src-noaa-humpback-sanctuary-2026",
      "src-hawaii-dlnr-dobor-2026",
      "src-ocean-sports-kohala-2026",
    ],
    bookingDestinations: [
      {
        destinationId: "dest-ocean-sports-kohala-direct",
        optionId: "hi-whale-big-island-kohala-catamaran",
        sellerType: "direct_operator",
        sellerName: "Ocean Sports Waikoloa (Direct Operator)",
        actualOperatorName: "Ocean Sports Waikoloa",
        label: "Book direct with Ocean Sports Kohala",
        url: "https://hawaiioceansports.com/cruises/whale-watch/",
        supportedContextParams: [],
        relationshipDisclosure: "Direct operator link — no DCC commission bias.",
        isCommercialPartner: false,
        commissionInfluenceOnRanking: 0,
      },
    ],
  },
  {
    optionId: "hi-whale-kauai-holoholo-catamaran",
    title: "Holo Holo Charters: Port Allen Power Catamaran Whale Watch (Kauaʻi)",
    shortLabel: "Holo Holo Port Allen Catamaran (Kauaʻi)",
    optionKind: "guided_commercial",
    actualOperators: ["Holo Holo Charters"],
    islandsOrRegions: ["kauai"],
    departureAreas: ["port_allen"],
    operatingMonths: [12, 1, 2, 3, 4],
    scheduleVerifiedThroughDate: "2027-04-15",
    vesselOrVehicleType: "50-ft Custom Built Power Catamaran",
    groupCapacityRange: {
      min: 1,
      max: 49,
      label: "36–49 guests",
    },
    rideComfortLevel: "moderate_open_water",
    viewingSpaceDescription:
      "Covered cabin and open bow viewing deck cruising Kauaʻi's south/west coast off Poʻipū and Barking Sands.",
    durationMinutes: {
      activity: 150,
      checkInLead: 45,
      typicalTransferEachWay: 30,
      totalDockOrHotelRange: { min: 230, max: 270 },
      label: "2.5–3.0 hrs on water (~4.0 hrs total incl. 45m check-in & Port Allen transfer)",
    },
    minimumAgeYears: 5,
    minimumAgeNote: "Strict minimum age 5+ years required.",
    prohibitsPregnantOrSpinalConditions: true,
    accessibilityProfile: {
      stepFreeWheelchairSupported: false,
      limitedMobilitySupported: true,
      walkingAndBoardingRequirement:
        "Harbor dock step-in boarding at Port Allen, but requires steady footing in open Kauaʻi channel swell.",
      confirmationStatus: "not_accessible",
      note: "Minimum age 5+; pregnant travelers and serious back/neck conditions prohibited.",
    },
    transportationAvailability: {
      hotelPickupAvailable: false,
      cruisePortShuttleAvailable: false,
      selfDriveParkingNote:
        "Free parking at Port Allen Marina Center (~20 min from Poʻipū; ~35 min from Nawiliwili Cruise Pier).",
    },
    cancellationTerms: "Full refund with 48 hours notice or weather cancellation.",
    whaleSightingOrReRidePolicy: "Seasonal whale sightings along South/West Kauaʻi; check operator policy for re-ride terms.",
    indicativePriceUsd: {
      min: 139,
      max: 169,
      basisLabel: "per person (includes light meal/snacks & beverages)",
    },
    comparisonValues: {
      islandAndHarbor: "Kauaʻi — Port Allen Harbor (Eleʻele / South Shore)",
      vesselAndCapacity: "50-ft Custom Power Catamaran (36–49 guests)",
      rideStabilityAndViewing: "Fast twin-hull catamaran; open Kauaʻi channel swell",
      ageAndMedicalRules: "Ages 5+ only; no pregnant passengers",
      accessibilityAndBoarding: "Port Allen dock boarding; requires steady footing at sea",
      durationAndGuarantee: "2.5–3.0 hrs | $139–$169 pp | Includes food & drinks",
    },
    tradeoffs: {
      strengths: [
        "Fast, custom-built Kauaʻi catamaran covering the calmer leeward South/West Kauaʻi coast",
      ],
      limitations: [
        "Minimum age 5+ and pregnancy restriction apply due to open-ocean swell around Kauaʻi",
      ],
    },
    claimIds: [
      "claim-hi-noaa-100yd-rule",
      "claim-hi-seasonality-nov-may",
      "claim-hi-kauai-holoholo-specs",
    ],
    sourceIds: [
      "src-noaa-humpback-sanctuary-2026",
      "src-hawaii-dlnr-dobor-2026",
      "src-holoholo-kauai-2026",
    ],
    bookingDestinations: [
      {
        destinationId: "dest-holoholo-kauai-direct",
        optionId: "hi-whale-kauai-holoholo-catamaran",
        sellerType: "direct_operator",
        sellerName: "Holo Holo Charters (Direct Operator)",
        actualOperatorName: "Holo Holo Charters",
        label: "Book direct with Holo Holo Charters",
        url: "https://www.holoholocharters.com/kauai-boat-tours/",
        supportedContextParams: [],
        relationshipDisclosure: "Direct operator link — no DCC commission bias.",
        isCommercialPartner: false,
        commissionInfluenceOnRanking: 0,
      },
    ],
  },
  {
    optionId: "hi-whale-maui-private-catamaran-charter",
    title: "Private USCG-Inspected Sailing Catamaran Whale Charter (Maui — Maʻalaea)",
    shortLabel: "Private Sailing Catamaran Charter (Maui)",
    optionKind: "private_charter",
    actualOperators: ["Trilogy Excursions Private Charters", "PacWhale Private Charters"],
    islandsOrRegions: ["maui"],
    departureAreas: ["maalaea_harbor"],
    operatingMonths: [11, 12, 1, 2, 3, 4],
    scheduleVerifiedThroughDate: "2027-04-30",
    vesselOrVehicleType: "Private 50-ft Sailing or Power Catamaran (Exclusive Use)",
    groupCapacityRange: {
      min: 1,
      max: 36,
      label: "Private group of 1–36 guests",
    },
    rideComfortLevel: "high_stability",
    viewingSpaceDescription:
      "100% private rail space, customizable morning departure time, dedicated captain and naturalist crew.",
    durationMinutes: {
      activity: 120,
      checkInLead: 30,
      typicalTransferEachWay: 25,
      totalDockOrHotelRange: { min: 180, max: 215 },
      label: "2.0 hrs customizable window (~3.25 hrs dock-to-dock)",
    },
    minimumAgeYears: null,
    minimumAgeNote: "All ages welcome on private harbor-departing charters.",
    prohibitsPregnantOrSpinalConditions: false,
    accessibilityProfile: {
      stepFreeWheelchairSupported: true,
      limitedMobilitySupported: true,
      walkingAndBoardingRequirement:
        "Maʻalaea Harbor slip boarding; crew can configure ramp boarding on designated private power catamarans with advance notice.",
      confirmationStatus: "operator_confirmation_required",
      note: "Specify wheelchair ramp vessel (PacWhale private catamaran) vs. step-in sailing catamaran when booking.",
    },
    transportationAvailability: {
      hotelPickupAvailable: false,
      cruisePortShuttleAvailable: false,
      selfDriveParkingNote: "Maʻalaea Harbor slip; private van transfer can be arranged separately.",
    },
    cancellationTerms: "Custom charter contract (typically 7–14 days notice; 100% weather cancellation refund).",
    whaleSightingOrReRidePolicy: "Custom routing in ʻAuʻau Channel.",
    indicativePriceUsd: {
      min: 350,
      max: 650,
      basisLabel: "per-person equivalent for small groups ($2,400–$3,800 flat private vessel charter)",
    },
    comparisonValues: {
      islandAndHarbor: "Maui — Maʻalaea Harbor (Private Slip Charter)",
      vesselAndCapacity: "Private 50-ft Catamaran (up to 36 guests exclusively)",
      rideStabilityAndViewing: "Exclusive 360-degree rail space + hydrophone + custom pace",
      ageAndMedicalRules: "All ages welcome",
      accessibilityAndBoarding: "Harbor slip boarding (ramp available on designated power cats)",
      durationAndGuarantee: "2.0 hrs custom | ~$2,400–$3,800 flat charter ($350+ pp eq.)",
    },
    tradeoffs: {
      strengths: [
        "Complete control over departure timing, passenger crowd, and viewing angles for families or photography groups",
      ],
      limitations: [
        "High total charter cost ($2,400–$3,800+ per vessel) unless split across a larger family or group",
      ],
    },
    claimIds: [
      "claim-hi-noaa-100yd-rule",
      "claim-hi-seasonality-nov-may",
      "claim-hi-auau-channel-density",
      "claim-hi-trilogy-sail-specs",
      "claim-hi-pacwhale-catamaran-specs",
    ],
    sourceIds: [
      "src-noaa-humpback-sanctuary-2026",
      "src-trilogy-maui-whale-2026",
      "src-pacwhale-eco-adventures-2026",
    ],
    bookingDestinations: [
      {
        destinationId: "dest-trilogy-private-direct",
        optionId: "hi-whale-maui-private-catamaran-charter",
        sellerType: "direct_operator",
        sellerName: "Trilogy Private Charters (Direct Operator)",
        actualOperatorName: "Trilogy Excursions",
        label: "Inquire direct with Trilogy Private Charters",
        url: "https://sailtrilogy.com/tour/whale-watch/",
        supportedContextParams: [],
        relationshipDisclosure: "Direct operator link — no DCC commission bias.",
        isCommercialPartner: false,
        commissionInfluenceOnRanking: 0,
      },
      {
        destinationId: "dest-pacwhale-private-direct",
        optionId: "hi-whale-maui-private-catamaran-charter",
        sellerType: "direct_operator",
        sellerName: "PacWhale Private Charters (Direct Operator)",
        actualOperatorName: "PacWhale Eco-Adventures",
        label: "Inquire direct with PacWhale Private Charters",
        url: "https://www.pacificwhale.org/cruises/maui-whale-watch/",
        supportedContextParams: [],
        relationshipDisclosure: "Direct operator link — no DCC commission bias.",
        isCommercialPartner: false,
        commissionInfluenceOnRanking: 0,
      },
    ],
  },
  {
    optionId: "hi-whale-noaa-shore-lookout-free",
    title: "Public Noncommercial Alternative: Official NOAA Sanctuary Shore-Based Whale Lookouts",
    shortLabel: "NOAA Sanctuary Shore Lookouts ($0 Free)",
    optionKind: "public_or_diy",
    actualOperators: [
      "NOAA Hawaiian Islands Humpback Whale National Marine Sanctuary",
      "Hawaiʻi State Parks & National Park Service",
    ],
    islandsOrRegions: ["maui", "oahu", "big_island", "kauai"],
    departureAreas: [
      "any",
      "maalaea_harbor",
      "kaanapali_lahaina_corridor",
      "honolulu_kewalo",
      "kawaihae_kohala",
      "kailua_kona",
      "port_allen",
    ],
    operatingMonths: [11, 12, 1, 2, 3, 4, 5],
    scheduleVerifiedThroughDate: "2027-05-31",
    vesselOrVehicleType: "Elevated Coastal Overlooks (Zero-Motion Shore Viewing)",
    groupCapacityRange: {
      min: 1,
      max: 40,
      label: "Self-paced public coastal viewpoints",
    },
    rideComfortLevel: "shore_stationary",
    viewingSpaceDescription:
      "Elevated coastal bluffs overlooking humpback migration corridors: Papawai / McGregor Point (Maui Hwy 30 near Maʻalaea), Makapuʻu Lighthouse Trail (Oʻahu), Puʻukoholā Heiau National Historic Site (Big Island near Kawaihae), and Poʻipū Beach / Kīlauea Point (Kauaʻi).",
    durationMinutes: {
      activity: 60,
      checkInLead: 0,
      typicalTransferEachWay: 20,
      totalDockOrHotelRange: { min: 90, max: 150 },
      label: "Self-paced (60–90 min recommended with 8x–10x binoculars)",
    },
    minimumAgeYears: null,
    minimumAgeNote: "All ages welcome.",
    prohibitsPregnantOrSpinalConditions: false,
    accessibilityProfile: {
      stepFreeWheelchairSupported: true,
      limitedMobilitySupported: true,
      walkingAndBoardingRequirement:
        "Papawai Scenic Lookout (Maui), Puʻukoholā Heiau Visitor Center overlook (Big Island), and Poʻipū Beach Park paths (Kauaʻi) offer paved, step-free parking-lot or path viewing; Makapuʻu Trail (Oʻahu) is paved throughout but has a steady uphill grade.",
      confirmationStatus: "confirmed_accessible",
      note: "100% zero seasickness and step-free paved viewpoints at primary overlooks.",
    },
    transportationAvailability: {
      hotelPickupAvailable: false,
      cruisePortShuttleAvailable: false,
      selfDriveParkingNote:
        "Free roadside/park pullouts (rental car or taxi required; no commercial shuttle).",
    },
    cancellationTerms: "Free public land — no ticket or cancellation needed.",
    whaleSightingOrReRidePolicy:
      "Self-guided shore spotting (highest surface blow & breach visibility 7:30–10:30 AM before whitecaps build).",
    indicativePriceUsd: {
      min: 0,
      max: 0,
      basisLabel: "$0 free public access",
    },
    comparisonValues: {
      islandAndHarbor: "All 4 Islands — Papawai (Maui), Makapuʻu (Oʻahu), Puʻukoholā (Big Island), Poʻipū (Kauaʻi)",
      vesselAndCapacity: "Elevated Public Coastal Bluff Overlooks (Self-paced)",
      rideStabilityAndViewing: "Zero motion / zero seasickness; distant 0.25–1.5 mile viewing",
      ageAndMedicalRules: "All ages & medical profiles welcome",
      accessibilityAndBoarding: "Step-free paved overlooks at Papawai, Puʻukoholā & Poʻipū",
      durationAndGuarantee: "Flexible 60–90m | $0 Free | Bring 8x–10x binoculars",
    },
    tradeoffs: {
      strengths: [
        "100% immune to seasickness, $0 cost, no reservation required, and fits short time windows",
        "Elevated vantage points (100–300 ft above sea level) make it easy to scan wide horizons for spouts and breaches",
      ],
      limitations: [
        "Whales are typically 0.25 to 1.5 miles offshore — you will not get 100-yard boat proximity or underwater hydrophone audio",
        "Requires 8x42 or 10x42 binoculars and a rental car to reach coastal highway lookouts",
      ],
    },
    claimIds: [
      "claim-hi-seasonality-nov-may",
      "claim-hi-morning-vs-afternoon-trades",
      "claim-hi-noaa-shore-lookouts",
    ],
    sourceIds: [
      "src-noaa-humpback-sanctuary-2026",
      "src-nws-honolulu-marine-trades-2026",
    ],
    bookingDestinations: [
      {
        destinationId: "dest-noaa-sanctuary-shore-guide",
        optionId: "hi-whale-noaa-shore-lookout-free",
        sellerType: "public_or_diy",
        sellerName: "NOAA Hawaiian Islands Humpback Whale National Marine Sanctuary",
        actualOperatorName: "NOAA Office of National Marine Sanctuaries",
        label: "Official NOAA Sanctuary Shore-Based Whale Watching Guide",
        url: "https://hawaiihumpbackwhale.noaa.gov/visit/whale-watching.html",
        supportedContextParams: [],
        relationshipDisclosure: "Official U.S. government agency resource — noncommercial.",
        isCommercialPartner: false,
        commissionInfluenceOnRanking: 0,
      },
    ],
  },
];

export function computeHawaiiWhaleOptionTiming(
  option: CandidateOption,
  input: HawaiiWhaleWatchingInput,
): TimingCalculationResult {
  const availableWindowMinutes = input.availableWindowMinutes;
  const checkInLeadMinutes = option.durationMinutes.checkInLead;
  const activityMinutes = option.durationMinutes.activity;
  const transferEachWay =
    input.startingPoint === "cruise_ship_pier"
      ? option.durationMinutes.typicalTransferEachWay + 5
      : option.durationMinutes.typicalTransferEachWay;
  const transferMinutesRoundTrip = transferEachWay * 2;
  const returnBufferMinutes =
    input.startingPoint === "cruise_ship_pier"
      ? input.cruiseReturnBufferMinutes
      : 15;
  const requiredTotalMinutes =
    transferMinutesRoundTrip +
    checkInLeadMinutes +
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
    summary:
      netSlackMinutes >= 0
        ? `Fits your ${availableWindowMinutes}-minute window (requires ${requiredTotalMinutes}m total: ${activityMinutes}m activity + ${checkInLeadMinutes}m check-in + ${transferMinutesRoundTrip}m round-trip transfer + ${returnBufferMinutes}m buffer; ${netSlackMinutes}m slack remaining).`
        : `Requires ${requiredTotalMinutes} total minutes (${activityMinutes}m activity + ${checkInLeadMinutes}m check-in + ${transferMinutesRoundTrip}m round-trip transfer + ${returnBufferMinutes}m buffer), exceeding your ${availableWindowMinutes}-minute window by ${Math.abs(netSlackMinutes)} minutes.`,
  };
}

export const HAWAII_WHALE_HARD_CONSTRAINTS: HardConstraintRule<HawaiiWhaleWatchingInput>[] = [
  {
    ruleId: "hc-hi-humpback-migration-season",
    label: "Humpback whale seasonal presence (Nov–May)",
    description:
      "North Pacific humpback whales inhabit Hawaiian waters from November through May (peak Jan–Mar) and spend June–October feeding in Alaska. Commercial whale tours do not operate in summer/early fall.",
    sourceIds: ["src-noaa-humpback-sanctuary-2026"],
    evaluate: (option, input) => {
      const month = input.travelDate
        ? Number(input.travelDate.slice(5, 7))
        : input.travelMonth;
      if (!option.operatingMonths.includes(month)) {
        const isSummerOffSeason = month >= 6 && month <= 10;
        return {
          passed: false,
          eliminationReason: isSummerOffSeason
            ? `${option.shortLabel} does not operate in month ${month}: North Pacific humpback whales migrate back to Alaska feeding grounds from June through October.`
            : `${option.shortLabel} does not operate in shoulder month ${month} (operating months: ${option.operatingMonths.join(", ")}).`,
          whatInputChangeWouldAlterResult:
            "Select a travel date during peak Hawaiian humpback season (December through April) or consider year-round spinner dolphin/snorkel cruises.",
        };
      }
      return { passed: true };
    },
  },
  {
    ruleId: "hc-hi-island-and-harbor-match",
    label: "Island & departure harbor compatibility",
    description:
      "Eliminates vessels that operate on a different Hawaiian island or outside the traveler's requested harbor corridor.",
    sourceIds: ["src-hawaii-dlnr-dobor-2026"],
    evaluate: (option, input) => {
      if (!option.islandsOrRegions.includes(input.island)) {
        return {
          passed: false,
          eliminationReason: `${option.shortLabel} operates on ${option.islandsOrRegions.join(", ").toUpperCase()}, not on your selected island (${input.island.toUpperCase()}).`,
          whatInputChangeWouldAlterResult: `Switch island selection to ${option.islandsOrRegions[0]} to evaluate this option.`,
        };
      }

      if (
        input.departureArea !== "any" &&
        !option.departureAreas.includes(input.departureArea) &&
        !option.departureAreas.includes("any")
      ) {
        return {
          passed: false,
          eliminationReason: `${option.shortLabel} departs from ${option.departureAreas.join(", ")}, which does not match your requested harbor (${input.departureArea}).`,
          whatInputChangeWouldAlterResult:
            "Set departure harbor to 'Any harbor on selected island' or match the vessel's harbor.",
        };
      }

      return { passed: true };
    },
  },
  {
    ruleId: "hc-hi-time-window-and-cruise-buffer",
    label: "Available time window & cruise return buffer",
    description:
      "Total excursion time (activity + harbor check-in + round-trip ground transfer + required return buffer) must fit inside the traveler's available window.",
    sourceIds: [
      "src-hawaii-dlnr-dobor-2026",
      "src-pacwhale-eco-adventures-2026",
      "src-star-of-honolulu-oahu-2026",
    ],
    evaluate: (option, input, context) => {
      const timing = context.computeTimingForOption(option);
      if (timing.netSlackMinutes !== null && timing.netSlackMinutes < 0) {
        return {
          passed: false,
          eliminationReason: timing.summary,
          whatInputChangeWouldAlterResult: `Increase available time window to at least ${timing.requiredTotalMinutes} minutes (currently ${input.availableWindowMinutes} minutes).`,
        };
      }
      return {
        passed: true,
        decisionChangingWarning:
          timing.netSlackMinutes !== null && timing.netSlackMinutes < 25
            ? `Tight schedule margin for ${option.shortLabel}: only ${timing.netSlackMinutes} minutes of slack above your buffer.`
            : undefined,
      };
    },
  },
  {
    ruleId: "hc-hi-minimum-child-age",
    label: "USCG & operator minimum child age",
    description:
      "Eliminates vessels whose minimum age requirement exceeds the age of the youngest child in the party.",
    sourceIds: [
      "src-pacwhale-eco-adventures-2026",
      "src-trilogy-maui-whale-2026",
      "src-hawaii-ocean-rafting-rib-2026",
      "src-holoholo-kauai-2026",
    ],
    evaluate: (option, input) => {
      if (
        input.youngestChildAgeYears !== null &&
        option.minimumAgeYears !== null &&
        input.youngestChildAgeYears < option.minimumAgeYears
      ) {
        return {
          passed: false,
          eliminationReason: `${option.shortLabel} requires a minimum age of ${option.minimumAgeYears}+ years (youngest child entered: age ${input.youngestChildAgeYears}).`,
          whatInputChangeWouldAlterResult:
            "Choose an all-ages catamaran (e.g., PacWhale Eco-Adventures on Maui, Star of Honolulu on Oʻahu) or NOAA Sanctuary shore lookouts.",
        };
      }
      return { passed: true };
    },
  },
  {
    ruleId: "hc-hi-pregnancy-and-spinal-safety",
    label: "Pregnancy & neck/back/spinal safety restriction",
    description:
      "High-motion RIB rafts and open-channel power catamarans with wave-impact warnings strictly prohibit pregnant guests and serious spinal conditions.",
    sourceIds: [
      "src-hawaii-ocean-rafting-rib-2026",
      "src-holoholo-kauai-2026",
    ],
    evaluate: (option, input) => {
      if (
        input.hasPregnantOrSpinalCondition &&
        option.prohibitsPregnantOrSpinalConditions
      ) {
        return {
          passed: false,
          eliminationReason: `${option.shortLabel} strictly prohibits pregnant passengers and travelers with neck, back, or spinal conditions due to open-water wave impact.`,
          whatInputChangeWouldAlterResult:
            "Select a stabilized multi-deck vessel (Star of Honolulu, PacWhale Catamaran) or zero-motion NOAA Sanctuary shore lookouts.",
        };
      }
      return { passed: true };
    },
  },
  {
    ruleId: "hc-hi-mobility-and-boarding",
    label: "Wheelchair & boarding mobility compatibility",
    description:
      "Eliminates inflatable rafts and step-only vessels when step-free wheelchair boarding is required, and warns against beach-wading departures.",
    sourceIds: [
      "src-hawaii-dlnr-dobor-2026",
      "src-pacwhale-eco-adventures-2026",
      "src-star-of-honolulu-ada-stabilized",
      "src-trilogy-maui-whale-2026",
    ],
    evaluate: (option, input) => {
      if (input.mobilityLevel === "step_free_wheelchair") {
        if (!option.accessibilityProfile.stepFreeWheelchairSupported) {
          return {
            passed: false,
            eliminationReason: `${option.shortLabel} does not support step-free wheelchair boarding (${option.accessibilityProfile.walkingAndBoardingRequirement}).`,
            whatInputChangeWouldAlterResult:
              "Choose a confirmed wheelchair-accessible vessel (Star of Honolulu on Oʻahu, PacWhale Maʻalaea Catamaran on Maui) or paved NOAA shore lookouts.",
          };
        }
        if (
          option.accessibilityProfile.confirmationStatus ===
          "operator_confirmation_required"
        ) {
          return {
            passed: true,
            unknownOrStaleWarning: {
              factId: `fact-hi-ada-confirm-${option.optionId}`,
              optionId: option.optionId,
              category: "operator_confirmation_required",
              summary: `${option.shortLabel}: ${option.accessibilityProfile.note}`,
              impactOnDecision:
                "Confirm wheelchair ramp configuration directly with the operator at least 48 hours prior to departure.",
              sourceIds: option.sourceIds,
            },
          };
        }
      }

      if (
        input.mobilityLevel === "limited_mobility_no_ladders" &&
        !option.accessibilityProfile.limitedMobilitySupported
      ) {
        return {
          passed: false,
          eliminationReason: `${option.shortLabel} requires climbing onto inflatable tubes or open-water agility incompatible with limited mobility.`,
          whatInputChangeWouldAlterResult:
            "Select a harbor slip catamaran with walk-on boarding.",
        };
      }

      if (
        input.mobilityLevel === "limited_mobility_no_ladders" &&
        option.optionId === "hi-whale-maui-trilogy-sail-cat" &&
        input.departureArea === "kaanapali_lahaina_corridor"
      ) {
        return {
          passed: false,
          eliminationReason:
            "Trilogy's Kāʻanapali departure loads directly from the beach through knee-deep shorebreak, which conflicts with no-ladder/dry harbor boarding.",
          whatInputChangeWouldAlterResult:
            "Switch departure area to Maʻalaea Harbor (`maalaea_harbor`) where Trilogy boards from a dry harbor slip.",
        };
      }

      return { passed: true };
    },
  },
  {
    ruleId: "hc-hi-rough-water-seasickness-exclusion",
    label: "High seasickness / rough-water RIB exclusion",
    description:
      "Eliminates high-motion open-air RIB rafts when the traveler specifies a high concern about rough water or seasickness.",
    sourceIds: [
      "src-nws-honolulu-marine-trades-2026",
      "src-hawaii-ocean-rafting-rib-2026",
    ],
    evaluate: (option, input) => {
      if (
        input.seasicknessOrRoughWaterConcern === "high_concern" &&
        option.rideComfortLevel === "high_motion_raft_or_aircraft"
      ) {
        return {
          passed: false,
          eliminationReason: `${option.shortLabel} is a low-freeboard inflatable RIB raft with high wave motion and spray, incompatible with a high rough-water/seasickness concern.`,
          whatInputChangeWouldAlterResult:
            "Select a stabilized ship, large double-deck power catamaran on a calm morning departure, or zero-motion NOAA Sanctuary shore lookouts.",
        };
      }

      if (
        input.seasicknessOrRoughWaterConcern !== "low" &&
        input.departureTimeOfDay === "afternoon_trades" &&
        option.rideComfortLevel !== "shore_stationary"
      ) {
        return {
          passed: true,
          decisionChangingWarning:
            "NWS Marine Climatology Warning: Hawaiian northeast trade winds typically strengthen after 11:30 AM. Switching from an afternoon departure to an early morning (7:30–9:30 AM) slot significantly reduces wind chop and motion sickness.",
        };
      }

      return { passed: true };
    },
  },
  {
    ruleId: "hc-hi-group-size-and-charter-mode",
    label: "Group capacity & shared vs. private charter match",
    description:
      "Ensures vessel capacity supports the traveler's group size and honors shared vs. private charter selection.",
    sourceIds: [
      "src-trilogy-maui-whale-2026",
      "src-hawaii-ocean-rafting-rib-2026",
    ],
    evaluate: (option, input) => {
      if (input.groupSize > option.groupCapacityRange.max) {
        return {
          passed: false,
          eliminationReason: `${option.shortLabel} has a maximum capacity of ${option.groupCapacityRange.max} passengers (your group size: ${input.groupSize}).`,
          whatInputChangeWouldAlterResult: `Reduce group size to ${option.groupCapacityRange.max} or select a larger multi-deck catamaran.`,
        };
      }

      if (
        input.charterPreference === "private_charter" &&
        option.optionKind === "guided_commercial"
      ) {
        return {
          passed: false,
          eliminationReason: `${option.shortLabel} is a shared per-seat public tour, and you requested private charter options only.`,
          whatInputChangeWouldAlterResult:
            "Set charter preference to 'Shared' or 'Any' to include public per-seat departures.",
        };
      }

      if (
        input.charterPreference === "shared" &&
        option.optionKind === "private_charter"
      ) {
        return {
          passed: false,
          eliminationReason: `${option.shortLabel} is a full-boat private charter ($2,400+ flat rate), and you selected shared per-person tours.`,
          whatInputChangeWouldAlterResult:
            "Set charter preference to 'Private charter' or 'Any' to include exclusive whole-vessel charters.",
        };
      }

      return { passed: true };
    },
  },
  {
    ruleId: "hc-hi-transportation-pickup-requirement",
    label: "Operator hotel/pier shuttle pickup availability",
    description:
      "Eliminates self-drive-only harbor departures when the traveler explicitly requires operator-provided hotel or cruise-pier shuttle pickup.",
    sourceIds: [
      "src-star-of-honolulu-oahu-2026",
      "src-hawaii-dlnr-dobor-2026",
    ],
    evaluate: (option, input) => {
      if (input.needsHotelOrPierTransfer) {
        const hasTransfer =
          input.startingPoint === "cruise_ship_pier"
            ? option.transportationAvailability.cruisePortShuttleAvailable
            : option.transportationAvailability.hotelPickupAvailable;
        if (!hasTransfer) {
          return {
            passed: false,
            eliminationReason: `${option.shortLabel} does not provide operator shuttle pickup (${option.transportationAvailability.selfDriveParkingNote}).`,
            whatInputChangeWouldAlterResult:
              "Use ride-share/rental car (set 'Require operator shuttle pickup' to false) or choose Star of Honolulu on Oʻahu which provides Waikīkī coach pickup.",
          };
        }
      }
      return { passed: true };
    },
  },
  {
    ruleId: "hc-hi-budget-ceiling",
    label: "Per-person budget ceiling",
    description:
      "Eliminates options whose minimum published per-person fare exceeds the traveler's budget ceiling.",
    sourceIds: [
      "src-pacwhale-eco-adventures-2026",
      "src-trilogy-maui-whale-2026",
      "src-noaa-humpback-sanctuary-2026",
    ],
    evaluate: (option, input) => {
      if (
        input.budgetMaxPerPersonUsd !== null &&
        option.indicativePriceUsd.min > input.budgetMaxPerPersonUsd
      ) {
        return {
          passed: false,
          eliminationReason: `${option.shortLabel} starts at $${option.indicativePriceUsd.min} per person, exceeding your $${input.budgetMaxPerPersonUsd} budget ceiling.`,
          whatInputChangeWouldAlterResult: `Increase per-person budget to at least $${option.indicativePriceUsd.min} or use the $0 NOAA Sanctuary Shore Lookouts.`,
        };
      }
      return { passed: true };
    },
  },
  {
    ruleId: "hc-hi-schedule-verification-horizon",
    label: "Verified schedule horizon check",
    description:
      "Flags dates beyond the currently verified 2026–2027 whale season tariff window as requiring operator schedule confirmation.",
    sourceIds: [
      "src-pacwhale-eco-adventures-2026",
      "src-trilogy-maui-whale-2026",
    ],
    evaluate: (option, input) => {
      if (
        input.travelDate &&
        option.scheduleVerifiedThroughDate &&
        input.travelDate > option.scheduleVerifiedThroughDate
      ) {
        return {
          passed: true,
          unknownOrStaleWarning: {
            factId: `fact-hi-future-schedule-${option.optionId}`,
            optionId: option.optionId,
            category: "unverified_schedule_or_availability",
            summary: `Operator departure schedule for ${input.travelDate} is beyond the verified tariff window (${option.scheduleVerifiedThroughDate}).`,
            impactOnDecision:
              "Seasonal biology and harbor timing fit, but exact departure times and fares for future seasons require confirmation once published.",
            sourceIds: option.sourceIds,
          },
          decisionChangingWarning: `Schedule unverified for ${input.travelDate}: confirm exact departure times once ${input.travelDate.slice(0, 4)} season opens.`,
        };
      }
      return { passed: true };
    },
  },
];

export const HAWAII_WHALE_PREFERENCE_RULES: PreferenceRule<HawaiiWhaleWatchingInput>[] = [
  {
    ruleId: "pref-hi-stability-and-comfort",
    label: "Hull stability & motion-sickness comfort",
    maxPoints: 35,
    evaluate: (option, input) => {
      if (
        input.priorityMode === "comfort_and_stability" ||
        input.seasicknessOrRoughWaterConcern === "high_concern"
      ) {
        if (option.rideComfortLevel === "high_stability") {
          return {
            points: 35,
            reason:
              "High-stability twin-hull catamaran or gyro-stabilized ship with shaded cabin and onboard restrooms.",
          };
        }
        if (option.rideComfortLevel === "shore_stationary") {
          return {
            points: 32,
            reason: "Zero-motion coastal bluff viewpoint eliminates seasickness risk.",
          };
        }
        if (option.rideComfortLevel === "moderate_open_water") {
          return {
            points: 20,
            reason: "Moderate twin-hull stability; book morning departure for calmest water.",
          };
        }
        return {
          points: 8,
          reason: "Higher motion open-air raft.",
        };
      }

      if (option.rideComfortLevel === "high_stability") {
        return {
          points: 24,
          reason: "Stable multi-deck platform with shaded cabin and restrooms.",
        };
      }
      return {
        points: 18,
        reason: "Standard marine motion profile.",
      };
    },
  },
  {
    ruleId: "pref-hi-vessel-and-viewing-style",
    label: "Vessel style & viewing priority match",
    maxPoints: 35,
    evaluate: (option, input) => {
      if (
        input.priorityMode === "budget_or_free" &&
        option.optionKind === "public_or_diy"
      ) {
        return {
          points: 35,
          reason: "Matches $0 free public NOAA Sanctuary viewing priority.",
        };
      }

      if (
        (input.priorityMode === "closest_eye_level_viewing" ||
          input.vesselPreference === "eye_level_rib_raft") &&
        option.optionId === "hi-whale-maui-eye-level-rib-raft"
      ) {
        return {
          points: 35,
          reason:
            "Matches eye-level waterline RIB raft preference with fast pod positioning in ʻAuʻau Channel.",
        };
      }

      if (
        (input.priorityMode === "small_group_deck_space" ||
          input.vesselPreference === "sailing_catamaran") &&
        (option.optionId === "hi-whale-maui-trilogy-sail-cat" ||
          option.optionId === "hi-whale-maui-private-catamaran-charter")
      ) {
        return {
          points: 35,
          reason:
            "Capped small-group sailing catamaran ensures single-row rail viewing without triple-stacking.",
        };
      }

      if (
        input.vesselPreference === "stabilized_catamaran_or_ship" &&
        option.rideComfortLevel === "high_stability"
      ) {
        return {
          points: 32,
          reason: "Matches stabilized ship or double-deck power catamaran preference.",
        };
      }

      return {
        points: 16,
        reason: "Viable vessel format for your island and window.",
      };
    },
  },
  {
    ruleId: "pref-hi-hydrophone-and-guarantee",
    label: "Underwater hydrophone & free re-ride guarantee",
    maxPoints: 20,
    evaluate: (option) => {
      const hasHydrophone = option.viewingSpaceDescription
        .toLowerCase()
        .includes("hydrophone");
      const hasGuarantee = option.whaleSightingOrReRidePolicy
        .toLowerCase()
        .includes("free");

      if (hasHydrophone && hasGuarantee) {
        return {
          points: 20,
          reason:
            "Includes live underwater hydrophone for humpback song and a free re-ride sighting guarantee.",
        };
      }
      if (hasGuarantee || hasHydrophone) {
        return {
          points: 14,
          reason: hasGuarantee
            ? "Backed by a complimentary re-ride whale sighting guarantee."
            : "Includes onboard underwater hydrophone.",
        };
      }
      return {
        points: 6,
        reason: "Self-paced or standard sighting terms.",
      };
    },
  },
];

export const HAWAII_WHALE_DECISION_ENGINE: DecisionEngineDefinition<HawaiiWhaleWatchingInput> =
  {
    engineId: "hawaii-whale-watching",
    version: "1.0.0",
    slug: "whale-watching",
    canonicalPath: "/hawaii/whale-watching",
    canonicalUrl: "https://destinationcommandcenter.com/hawaii/whale-watching",
    title: "Hawaiʻi Whale Watching Decision Engine (Maui, Oʻahu, Big Island & Kauaʻi)",
    destinationName: "Hawaiʻi (Maui, Oʻahu, Hawaiʻi Island, Kauaʻi)",
    categoryName: "Whale Watching & Marine Sanctuary Comparison",
    heroQuestion:
      "Which Hawaiʻi whale watching boat — or free NOAA Sanctuary shore lookout — actually fits your island, seasickness tolerance, family ages, mobility, and schedule?",
    summaryDescription:
      "Evidence-backed decision engine comparing double-deck power catamarans, capped-capacity sailing catamarans, eye-level RIB rafts, gyro-stabilized ships, and free NOAA Sanctuary coastal lookouts under federal 100-yard humpback approach regulations.",
    referenceGuide: {
      importantDecisionFactors: [
        {
          title: "Seasonality: November–May Migration (Peak Jan–Mar)",
          detail:
            "North Pacific humpback whales (kohola) migrate to Hawaiʻi from November through May to breed, calve, and nurse. Peak pod density and competitive surface activity occur from January through March. From June through October, humpbacks are in Alaska and commercial whale watches do not operate.",
          sourceIds: ["src-noaa-humpback-sanctuary-2026"],
        },
        {
          title: "Island & Channel Bathymetry (Why Maui's ʻAuʻau Channel Leads)",
          detail:
            "Mothers with newborn calves prefer shallow waters under 60 fathoms (360 ft). The sheltered ʻAuʻau Channel between West Maui, Maʻalaea, Lānaʻi, and Molokaʻi averages 120–250 ft deep, making it the highest-density humpback nursery in the archipelago, followed by Big Island's Kohala Coast, Oʻahu's south/east corridors, and South/West Kauaʻi.",
          sourceIds: ["src-noaa-humpback-sanctuary-2026"],
        },
        {
          title: "Morning Calm vs. Afternoon Trade-Wind Chop",
          detail:
            "Northeast trade winds strengthen across Hawaiian channels between 11:00 AM and 3:00 PM due to solar heating of the islands. Early morning departures (7:30–9:30 AM) provide markedly calmer seas, easier distant blow spotting, and lower motion-sickness risk.",
          sourceIds: ["src-nws-honolulu-marine-trades-2026"],
        },
        {
          title: "Federal 100-Yard Approach Rule (50 CFR § 224.103(a))",
          detail:
            "Every vessel in Hawaiʻi — whether a 14-passenger RIB raft or a 232-ft ship — is legally prohibited from approaching within 100 yards of a humpback whale. Closer encounters happen only when whales voluntarily approach a stationary vessel ('mugging') with engines in neutral.",
          sourceIds: ["src-noaa-humpback-sanctuary-2026"],
        },
        {
          title: "Harbor Slip Boarding vs. Beach Wading & RIB Restrictions",
          detail:
            "Maʻalaea Harbor (Maui), Pier 8 Aloha Tower (Oʻahu), Kawaihae (Big Island), and Port Allen (Kauaʻi) offer dry dock boarding. Kāʻanapali beach catamarans load through knee-deep shorebreak, and RIB rafts prohibit children under 4–5, pregnant travelers, and back/neck conditions.",
          sourceIds: [
            "src-hawaii-dlnr-dobor-2026",
            "src-trilogy-maui-whale-2026",
            "src-hawaii-ocean-rafting-rib-2026",
          ],
        },
      ],
      experienceAndVesselTypes: [
        {
          typeName: "Double-Deck Power Catamaran (e.g., PacWhale Eco-Adventures, 65–110 guests)",
          capacityAndStability: "High twin-hull stability, shaded main cabin, marine restrooms, stadium bow",
          bestFor: "Families with young children, first-time visitors, wheelchair/limited-mobility travelers, and naturalist education",
          limitations: "Larger passenger count requires sharing rail space during breaches",
          sourceIds: ["src-pacwhale-eco-adventures-2026"],
        },
        {
          typeName: "Capped Small-Group Sailing Catamaran (e.g., Trilogy Excursions, 36–45 guests)",
          capacityAndStability: "Wide twin-hull stability with forward trampolines and shaded aft cockpit",
          bestFor: "Travelers wanting guaranteed single-row rail space without triple-stacked crowds",
          limitations: "Minimum age 3+; Kāʻanapali departures require wading in beach surf (use Maʻalaea for slip boarding)",
          sourceIds: ["src-trilogy-maui-whale-2026"],
        },
        {
          typeName: "Eye-Level Rigid-Hull Inflatable Raft (RIB, 14–24 guests)",
          capacityAndStability: "Low-freeboard pontoon tubes at the waterline; high motion & spray",
          bestFor: "Adventurous photographers wanting eye-level waterline views and fast transit to distant pods",
          limitations: "Strictly prohibits children under 5, pregnant guests, spinal conditions, and high seasickness sensitivity",
          sourceIds: ["src-hawaii-ocean-rafting-rib-2026"],
        },
        {
          typeName: "Gyro-Stabilized Multi-Deck Ship (e.g., Star of Honolulu on Oʻahu)",
          capacityAndStability: "232-ft hull with 3 stabilizer systems, 4 walk-around decks, and passenger elevators",
          bestFor: "Motion-sensitive travelers, wheelchair users needing onboard elevators + Waikīkī coach pickup, and Honolulu cruise passengers",
          limitations: "High deck elevation views whales from above rather than waterline",
          sourceIds: ["src-star-of-honolulu-oahu-2026"],
        },
        {
          typeName: "Official NOAA Sanctuary Shore Lookouts ($0 Free Public Overlooks)",
          capacityAndStability: "Stationary coastal bluffs (Papawai, Makapuʻu, Puʻukoholā, Poʻipū)",
          bestFor: "Severe motion-sickness sufferers, tight schedules (<2 hours), and budget/DIY travelers with binoculars",
          limitations: "Whales are typically 0.25–1.5 miles offshore; no underwater hydrophone audio",
          sourceIds: ["src-noaa-humpback-sanctuary-2026"],
        },
      ],
      departureLocations: [
        {
          islandOrRegion: "Maui",
          harborOrArea: "Maʻalaea Small Boat Harbor & West Maui (Mala / Kāʻanapali)",
          logisticsNote:
            "Maʻalaea Harbor sits 20–25 min from Kahului Cruise Pier, Wailea, and Kihei with paved slip boarding directly into the ʻAuʻau Channel.",
          sourceIds: ["src-hawaii-dlnr-dobor-2026", "src-pacwhale-eco-adventures-2026"],
        },
        {
          islandOrRegion: "Oʻahu",
          harborOrArea: "Aloha Tower Pier 8 & Kewalo Basin (Honolulu)",
          logisticsNote:
            "10 minutes from Honolulu Cruise Terminal (Pier 2/11) and 15–25 minutes from Waikīkī hotels.",
          sourceIds: ["src-star-of-honolulu-oahu-2026"],
        },
        {
          islandOrRegion: "Hawaiʻi Island (Big Island)",
          harborOrArea: "Kawaihae Harbor / Kohala Coast & Kailua-Kona",
          logisticsNote:
            "Leeward Kohala waters between Kawaihae and Waikoloa offer calm morning seas and high calf density.",
          sourceIds: ["src-ocean-sports-kohala-2026"],
        },
        {
          islandOrRegion: "Kauaʻi",
          harborOrArea: "Port Allen Small Boat Harbor (Eleʻele / South Shore)",
          logisticsNote:
            "Primary Kauaʻi departure harbor (~20 min west of Poʻipū resorts; ~35 min from Nawiliwili Cruise Pier).",
          sourceIds: ["src-holoholo-kauai-2026"],
        },
      ],
      commonTradeoffs: [
        {
          tradeoff: "Eye-Level RIB Raft vs. Double-Deck Catamaran Stability",
          explanation:
            "RIB rafts put your camera right at the waterline and reach outer pods fast, but every guest sits on an inflatable tube with no cabin shade, no stand-up restroom, and strict medical/age exclusions. Catamarans trade waterline proximity for flat decks, shade, restrooms, and hydrophones.",
        },
        {
          tradeoff: "65–110 Passenger Educational Catamaran vs. 36–45 Passenger Sailing Catamaran",
          explanation:
            "Large power catamarans cost ~$30 less per person and welcome infants and wheelchairs, whereas capped sailing catamarans cost ~$100–$129+ so every passenger has front-row rail space.",
        },
        {
          tradeoff: "Commercial Boat Tour vs. Free NOAA Sanctuary Shore Overlooks",
          explanation:
            "Shore overlooks (Papawai on Maui, Makapuʻu on Oʻahu, Puʻukoholā on Big Island) are $0 and 100% seasickness-free, but whales are 400–2,500 yards away rather than 100 yards off the bow with hydrophone audio.",
        },
      ],
      operationalDependencies: [
        {
          dependency: "Diurnal Trade-Wind Strengthening (NWS Small Craft Advisories)",
          impact:
            "Afternoon departures in Maʻalaea Bay and channel crossings experience steeper wind waves than 7:30–9:30 AM departures; high-wind warnings occasionally ground small rafts first.",
          sourceIds: ["src-nws-honolulu-marine-trades-2026"],
        },
        {
          dependency: "Federal 100-Yard Approach Buffer & 'Mugging' Holds",
          impact:
            "When curious whales surface within 100 yards, captains must keep engines in neutral until the whales move away, which can extend return times by 10–20 minutes on tight cruise-port days.",
          sourceIds: ["src-noaa-humpback-sanctuary-2026"],
        },
      ],
      methodologySteps: [
        "1. Verify biological seasonality first: eliminate commercial humpback tours outside the November–May migration window.",
        "2. Apply hard constraints: island & harbor match, total door-to-door time window (including 30–45m harbor check-in and cruise return buffer), youngest child age, pregnancy/spinal exclusions, wheelchair/boarding requirements, rough-water raft exclusions, shuttle pickup requirements, and budget ceiling.",
        "3. Rank only viable options by stability/comfort, rail-space vs. waterline viewing preference, hydrophone & re-ride guarantee, and morning trade-wind calmness — with zero commercial weight.",
        "4. Always include noncommercial NOAA Sanctuary shore lookouts when viable and clearly state their 0.25–1.5 mile offshore distance limitation.",
      ],
    },
    questions: HAWAII_WHALE_QUESTIONS,
    answerSchema: HAWAII_WHALE_ANSWER_SCHEMA,
    defaultExampleInput: HAWAII_WHALE_DEFAULT_EXAMPLE_INPUT,
    comparisonDimensions: HAWAII_WHALE_COMPARISON_DIMENSIONS,
    candidateOptions: HAWAII_WHALE_CANDIDATE_OPTIONS,
    hardConstraintRules: HAWAII_WHALE_HARD_CONSTRAINTS,
    preferenceRules: HAWAII_WHALE_PREFERENCE_RULES,
    evidenceClaims: HAWAII_WHALE_CLAIMS,
    sourceRecords: HAWAII_WHALE_SOURCES,
    computeTimingForOption: computeHawaiiWhaleOptionTiming,
    isExampleScenarioDetector: (rawInput, normalizedInput) => {
      const rawObj =
        typeof rawInput === "object" && rawInput !== null
          ? (rawInput as Record<string, unknown>)
          : {};
      const hasExplicitDate =
        typeof rawObj.travelDate === "string" &&
        rawObj.travelDate.trim().length > 0;

      if (!hasExplicitDate || !normalizedInput.travelDate) {
        return {
          isExample: true,
          banner:
            "Example Scenario Shown (Maui in February Peak Season, Morning Departure, 5-Hour Window): Enter your actual travel date and island above to get a personalized recommendation.",
          missingInputFacts: [
            {
              factId: "fact-hi-missing-travel-date",
              optionId: null,
              category: "missing_traveler_input",
              summary:
                "Exact travel date not yet entered — displaying a labeled February peak-season example scenario.",
              impactOnDecision:
                "Humpback whale density varies significantly between early/late shoulder weeks (Nov/May) and peak season (Jan–Mar).",
              sourceIds: ["src-noaa-humpback-sanctuary-2026"],
            },
          ],
        };
      }

      return {
        isExample: false,
        banner: null,
        missingInputFacts: [],
      };
    },
    evaluate: (
      rawInput: unknown,
      options?: DecisionEvaluateOptions,
    ): DecisionResult<HawaiiWhaleWatchingInput> => {
      return evaluateDecisionEngine(
        HAWAII_WHALE_DECISION_ENGINE,
        rawInput,
        options,
      );
    },
  };
