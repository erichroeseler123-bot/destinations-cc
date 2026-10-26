import { z } from "zod";
import {
  evaluateJuneauPortDayScenario,
  type JuneauPortDayEvaluationResult,
  type JuneauPortDayScenarioInput,
} from "@/lib/dcc/juneauPortDayEngine";
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

export type JuneauDockCode =
  | "CT"
  | "FKL"
  | "AS"
  | "AJ"
  | "ACT"
  | "TENDER_FKL"
  | "UNKNOWN";

export type JuneauHelicopterMobilityLevel =
  | "standard"
  | "limited_mobility"
  | "step_free_wheelchair";

export type JuneauHelicopterWeatherCondition =
  | "clear_vfr"
  | "marginal_ceiling_1200ft"
  | "low_ceiling_under_800ft"
  | "unknown";

export const JUNEAU_DOCK_TRANSFER_TABLE: Record<
  JuneauDockCode,
  { minutesToJnuAirport: number; minutesToAukeBay: number }
> = {
  CT: { minutesToJnuAirport: 25, minutesToAukeBay: 25 },
  FKL: { minutesToJnuAirport: 25, minutesToAukeBay: 25 },
  AS: { minutesToJnuAirport: 25, minutesToAukeBay: 25 },
  ACT: { minutesToJnuAirport: 30, minutesToAukeBay: 30 },
  AJ: { minutesToJnuAirport: 35, minutesToAukeBay: 35 },
  TENDER_FKL: { minutesToJnuAirport: 45, minutesToAukeBay: 45 },
  UNKNOWN: { minutesToJnuAirport: 35, minutesToAukeBay: 35 },
};

export interface JuneauHelicopterEngineInput {
  date: string | null;
  travelMonth: number;
  arrivalTime: string;
  allAboardTime: string;
  arrivalDock: JuneauDockCode;
  returnBufferMinutes: number;
  weatherCondition: JuneauHelicopterWeatherCondition;
  mobilityLevel: JuneauHelicopterMobilityLevel;
  passengerWeightAbove250Lbs: boolean;
  youngestChildAgeYears: number | null;
  partySize: number;
  budgetMaxPerPersonUsd: number | null;
  formatPreference:
    | "any"
    | "standard_glacier_walk"
    | "extended_trek_walkabout"
    | "glacier_dogsled_camp"
    | "two_activity_combo";
  goalMode: "helicopter_landing_priority" | "weather_resilient_port_day" | "budget_or_diy";
}

export const JUNEAU_HELICOPTER_DEFAULT_EXAMPLE_INPUT: JuneauHelicopterEngineInput = {
  date: null,
  travelMonth: 7,
  arrivalTime: "08:00",
  allAboardTime: "16:30",
  arrivalDock: "CT",
  returnBufferMinutes: 60,
  weatherCondition: "marginal_ceiling_1200ft",
  mobilityLevel: "standard",
  passengerWeightAbove250Lbs: false,
  youngestChildAgeYears: null,
  partySize: 2,
  budgetMaxPerPersonUsd: null,
  formatPreference: "any",
  goalMode: "helicopter_landing_priority",
};

const hhmmRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const ymdRegex = /^\d{4}-\d{2}-\d{2}$/;

export const JUNEAU_HELICOPTER_ANSWER_SCHEMA = z
  .object({
    date: z
      .string()
      .regex(ymdRegex, "date must be YYYY-MM-DD when provided")
      .nullable()
      .default(JUNEAU_HELICOPTER_DEFAULT_EXAMPLE_INPUT.date),
    travelMonth: z
      .number()
      .int()
      .min(1)
      .max(12)
      .default(JUNEAU_HELICOPTER_DEFAULT_EXAMPLE_INPUT.travelMonth),
    arrivalTime: z
      .string()
      .regex(hhmmRegex, "arrivalTime must be HH:MM (24-hour)")
      .default(JUNEAU_HELICOPTER_DEFAULT_EXAMPLE_INPUT.arrivalTime),
    allAboardTime: z
      .string()
      .regex(hhmmRegex, "allAboardTime must be HH:MM (24-hour)")
      .default(JUNEAU_HELICOPTER_DEFAULT_EXAMPLE_INPUT.allAboardTime),
    arrivalDock: z
      .enum(["CT", "FKL", "AS", "AJ", "ACT", "TENDER_FKL", "UNKNOWN"])
      .default(JUNEAU_HELICOPTER_DEFAULT_EXAMPLE_INPUT.arrivalDock),
    returnBufferMinutes: z
      .number()
      .int()
      .min(30)
      .max(180)
      .default(JUNEAU_HELICOPTER_DEFAULT_EXAMPLE_INPUT.returnBufferMinutes),
    weatherCondition: z
      .enum(["clear_vfr", "marginal_ceiling_1200ft", "low_ceiling_under_800ft", "unknown"])
      .default(JUNEAU_HELICOPTER_DEFAULT_EXAMPLE_INPUT.weatherCondition),
    mobilityLevel: z
      .enum(["standard", "limited_mobility", "step_free_wheelchair"])
      .default(JUNEAU_HELICOPTER_DEFAULT_EXAMPLE_INPUT.mobilityLevel),
    passengerWeightAbove250Lbs: z
      .boolean()
      .default(JUNEAU_HELICOPTER_DEFAULT_EXAMPLE_INPUT.passengerWeightAbove250Lbs),
    youngestChildAgeYears: z
      .number()
      .int()
      .min(0)
      .max(17)
      .nullable()
      .default(JUNEAU_HELICOPTER_DEFAULT_EXAMPLE_INPUT.youngestChildAgeYears),
    partySize: z
      .number()
      .int()
      .min(1)
      .max(18)
      .default(JUNEAU_HELICOPTER_DEFAULT_EXAMPLE_INPUT.partySize),
    budgetMaxPerPersonUsd: z
      .number()
      .min(0)
      .max(5000)
      .nullable()
      .default(JUNEAU_HELICOPTER_DEFAULT_EXAMPLE_INPUT.budgetMaxPerPersonUsd),
    formatPreference: z
      .enum([
        "any",
        "standard_glacier_walk",
        "extended_trek_walkabout",
        "glacier_dogsled_camp",
        "two_activity_combo",
      ])
      .default(JUNEAU_HELICOPTER_DEFAULT_EXAMPLE_INPUT.formatPreference),
    goalMode: z
      .enum([
        "helicopter_landing_priority",
        "weather_resilient_port_day",
        "budget_or_diy",
      ])
      .default(JUNEAU_HELICOPTER_DEFAULT_EXAMPLE_INPUT.goalMode),
  })
  .strict();

export const JUNEAU_HELICOPTER_SOURCES: SourceRecord[] = [
  {
    sourceId: "src-usfs-mendenhall-permits-2026",
    sourceOrganization: "U.S. Forest Service — Tongass National Forest",
    sourceTitle: "Mendenhall Glacier Recreation Area Commercial Visitor Permits & Hours",
    sourceUrl: "https://www.fs.usda.gov/detail/tongass/about-forest/offices/?cid=fseprd1093566",
    claimsSupported: ["claim-jnu-usfs-glacier-permits", "claim-jnu-usfs-visitor-center"],
    retrievedAt: "2026-04-14T18:00:00Z",
    verifiedAt: "2026-04-14T18:00:00Z",
    expiresAt: "2026-10-31T23:59:59Z",
    freshnessCategory: "regulatory_annual",
    status: "current",
  },
  {
    sourceId: "src-cbj-docks-harbors-2026",
    sourceOrganization: "City and Borough of Juneau — Docks & Harbors",
    sourceTitle: "2026 Cruise Ship Dock Berthing & Shuttle Staging Map (CT, FKL, AS, AJ, ACT)",
    sourceUrl: "https://juneau.org/harbors/cruise-ship-calendar",
    claimsSupported: ["claim-jnu-dock-transfer-windows"],
    retrievedAt: "2026-04-15T16:30:00Z",
    verifiedAt: "2026-04-15T16:30:00Z",
    expiresAt: "2026-10-15T23:59:59Z",
    freshnessCategory: "seasonal_schedule",
    status: "current",
  },
  {
    sourceId: "src-temsco-juneau-ops-2026",
    sourceOrganization: "TEMSCO Helicopters (Juneau Base — JNU)",
    sourceTitle: "Mendenhall Glacier & Pilot's Choice Check-In, Weight Policy, and Cancellation Terms",
    sourceUrl: "https://temscoair.com/juneau-tours/",
    claimsSupported: [
      "claim-jnu-temsco-mendenhall-specs",
      "claim-jnu-operator-weight-surcharge",
      "claim-jnu-dogsled-camp-season",
    ],
    retrievedAt: "2026-04-15T19:00:00Z",
    verifiedAt: "2026-04-15T19:00:00Z",
    expiresAt: "2026-09-30T23:59:59Z",
    freshnessCategory: "operator_tariff_and_policy",
    status: "current",
  },
  {
    sourceId: "src-coastal-helicopters-2026",
    sourceOrganization: "Coastal Helicopters (Juneau Airport North Ramp)",
    sourceTitle: "Icefield Excursion & Dog Sled Tour Specifications, Weight Policy, and Refunds",
    sourceUrl: "https://www.coastalhelicopters.com/tours/",
    claimsSupported: [
      "claim-jnu-coastal-icefield-specs",
      "claim-jnu-operator-weight-surcharge",
      "claim-jnu-dogsled-camp-season",
    ],
    retrievedAt: "2026-04-15T19:15:00Z",
    verifiedAt: "2026-04-15T19:15:00Z",
    expiresAt: "2026-09-30T23:59:59Z",
    freshnessCategory: "operator_tariff_and_policy",
    status: "current",
  },
  {
    sourceId: "src-northstar-trekking-2026",
    sourceOrganization: "NorthStar Trekking (Juneau International Airport)",
    sourceTitle: "Glacier Walkabout & X-Trek Minimum Age, Gear, and Duration Requirements",
    sourceUrl: "https://www.northstartrekking.com/glacier-treks/",
    claimsSupported: ["claim-jnu-northstar-walkabout-specs", "claim-jnu-operator-weight-surcharge"],
    retrievedAt: "2026-04-15T19:30:00Z",
    verifiedAt: "2026-04-15T19:30:00Z",
    expiresAt: "2026-09-30T23:59:59Z",
    freshnessCategory: "operator_tariff_and_policy",
    status: "current",
  },
  {
    sourceId: "src-faa-pajn-weather-cams-2026",
    sourceOrganization: "FAA Alaska Weather Cameras & NWS Juneau (PAJN)",
    sourceTitle: "Juneau Icefield VFR Ceiling & Visibility Operational Guidance",
    sourceUrl: "https://weathercams.faa.gov/",
    claimsSupported: ["claim-jnu-vfr-ceiling-thresholds"],
    retrievedAt: "2026-04-16T08:00:00Z",
    verifiedAt: "2026-04-16T08:00:00Z",
    expiresAt: "2026-12-31T23:59:59Z",
    freshnessCategory: "live_telemetry",
    status: "current",
  },
  {
    sourceId: "src-allen-marine-auke-bay-2026",
    sourceOrganization: "Allen Marine Tours (Auke Bay / Statter Harbor)",
    sourceTitle: "Juneau Whale Watching & Wildlife Quest Accessibility and Sighting Guarantee",
    sourceUrl: "https://allenmarinetours.com/juneau/whale-watching-wildlife-quest/",
    claimsSupported: ["claim-jnu-auke-bay-whale-backup"],
    retrievedAt: "2026-04-15T20:00:00Z",
    verifiedAt: "2026-04-15T20:00:00Z",
    expiresAt: "2026-10-15T23:59:59Z",
    freshnessCategory: "operator_tariff_and_policy",
    status: "current",
  },
  {
    sourceId: "src-cbj-capital-transit-2026",
    sourceOrganization: "City and Borough of Juneau — Capital Transit",
    sourceTitle: "Route 3 & Route 4 Mendenhall Valley Bus Schedule and 1.5-Mile Trailhead Notice",
    sourceUrl: "https://juneaucapitaltransit.org/",
    claimsSupported: ["claim-jnu-usfs-visitor-center"],
    retrievedAt: "2026-04-14T18:30:00Z",
    verifiedAt: "2026-04-14T18:30:00Z",
    expiresAt: "2026-10-31T23:59:59Z",
    freshnessCategory: "regulatory_annual",
    status: "current",
  },
];

export const JUNEAU_HELICOPTER_CLAIMS: EvidenceClaim[] = [
  {
    claimId: "claim-jnu-usfs-glacier-permits",
    classification: "official_rule",
    statement:
      "Commercial helicopter landings on the Juneau Icefield and Mendenhall Glacier require a Tongass National Forest special-use permit held by three Juneau operators: TEMSCO Helicopters, Coastal Helicopters, and NorthStar Trekking.",
    fieldsSupported: ["actualOperators", "operatingMonths"],
    sourceIds: ["src-usfs-mendenhall-permits-2026"],
    isDecisionChanging: true,
    verificationNote: "Verified against USFS Tongass commercial permit roster.",
  },
  {
    claimId: "claim-jnu-dock-transfer-windows",
    classification: "official_rule",
    statement:
      "Downtown cruise berths (CT, FKL, AS) require ~25 minutes each way to Juneau Airport (JNU) heliports, while AJ Dock requires ~35 minutes and Tender to Franklin requires ~45 minutes including launch queue.",
    fieldsSupported: ["durationMinutes.typicalTransferEachWay"],
    sourceIds: ["src-cbj-docks-harbors-2026"],
    isDecisionChanging: true,
    verificationNote: "Verified against CBJ Docks & Harbors 2026 staging guidance.",
  },
  {
    claimId: "claim-jnu-temsco-mendenhall-specs",
    classification: "operator_published_fact",
    statement:
      "TEMSCO Mendenhall Glacier & Guided Walk operates May–September with ~30–35 minutes total flight time, ~20–25 minutes on the glacier, 45-minute pre-flight check-in & safety briefing, and ~2.25 hours at the heliport (~3.25 hours dock-to-dock from downtown).",
    fieldsSupported: ["durationMinutes", "indicativePriceUsd", "cancellationTerms"],
    sourceIds: ["src-temsco-juneau-ops-2026"],
    isDecisionChanging: true,
    verificationNote: "Verified directly from TEMSCO Juneau tour tariff.",
  },
  {
    claimId: "claim-jnu-coastal-icefield-specs",
    classification: "operator_published_fact",
    statement:
      "Coastal Helicopters Icefield Excursion operates May–September from JNU North Ramp with ~30 minutes flight time, ~15–20 minutes on Herbert or Norris Glacier, and a 45-minute check-in lead (~3.0–3.25 hours dock-to-dock).",
    fieldsSupported: ["durationMinutes", "indicativePriceUsd", "cancellationTerms"],
    sourceIds: ["src-coastal-helicopters-2026"],
    isDecisionChanging: true,
    verificationNote: "Verified directly from Coastal Helicopters Juneau tariff.",
  },
  {
    claimId: "claim-jnu-northstar-walkabout-specs",
    classification: "operator_published_fact",
    statement:
      "NorthStar Trekking Glacier Walkabout includes a 2-hour guided crampon hike on the glacier (~3.5 hours airport-to-airport, ~4.25–4.5 hours dock-to-dock) and enforces a minimum age of 7 years and standard hiking agility.",
    fieldsSupported: ["durationMinutes", "minimumAgeYears", "accessibilityProfile"],
    sourceIds: ["src-northstar-trekking-2026"],
    isDecisionChanging: true,
    verificationNote: "Verified from NorthStar Trekking Glacier Walkabout requirements.",
  },
  {
    claimId: "claim-jnu-dogsled-camp-season",
    classification: "operator_published_fact",
    statement:
      "Upper-elevation glacier dog sled camps operate on snowpack from May through late August (~3.25–3.75 hours dock-to-dock) and carry higher cloud-base cancellation risk than lower-glacier ice landings.",
    fieldsSupported: ["operatingMonths", "durationMinutes", "indicativePriceUsd"],
    sourceIds: ["src-temsco-juneau-ops-2026", "src-coastal-helicopters-2026"],
    isDecisionChanging: true,
    verificationNote: "Verified from TEMSCO and Coastal dog sled camp seasonal terms.",
  },
  {
    claimId: "claim-jnu-operator-weight-surcharge",
    classification: "operator_published_fact",
    statement:
      "TEMSCO, Coastal, and NorthStar require accurate clothed body weight at booking for FAA weight-and-balance and assess a comfort/balance surcharge ($150–$215) above 250–260 lbs.",
    fieldsSupported: ["indicativePriceUsd", "comparisonValues"],
    sourceIds: [
      "src-temsco-juneau-ops-2026",
      "src-coastal-helicopters-2026",
      "src-northstar-trekking-2026",
    ],
    isDecisionChanging: true,
    verificationNote: "Verified across all three Juneau helicopter operators.",
  },
  {
    claimId: "claim-jnu-vfr-ceiling-thresholds",
    classification: "forecast_or_model_output",
    statement:
      "Helicopter glacier flights require VFR ceiling and visibility clearances into the Juneau Icefield; ceilings below 800 ft overcast frequently ground upper-glacier flights while marine whale watching and valley shuttles continue operating.",
    fieldsSupported: ["tradeoffs", "comparisonValues"],
    sourceIds: ["src-faa-pajn-weather-cams-2026"],
    isDecisionChanging: true,
    verificationNote: "DCC operational decision boundary using FAA PAJN ceiling thresholds.",
  },
  {
    claimId: "claim-jnu-auke-bay-whale-backup",
    classification: "operator_published_fact",
    statement:
      "Auke Bay whale watching catamarans (e.g., Allen Marine) operate in low cloud ceilings with enclosed heated cabins, step-free main-deck wheelchair boarding on designated departures, and a 100% whale sighting refund guarantee.",
    fieldsSupported: ["accessibilityProfile", "whaleSightingOrReRidePolicy"],
    sourceIds: ["src-allen-marine-auke-bay-2026"],
    isDecisionChanging: true,
    verificationNote: "Verified from Allen Marine Juneau Wildlife Quest specifications.",
  },
  {
    claimId: "claim-jnu-usfs-visitor-center",
    classification: "official_rule",
    statement:
      "The USFS Mendenhall Glacier Visitor Center ($5 pass) and Steep Creek / Photo Point trails are paved or boardwalk step-free; Capital Transit city bus ($2) stops at Mendenhall Loop & Glacier Spur, requiring a 1.5-mile walk each way to the visitor center.",
    fieldsSupported: ["accessibilityProfile", "indicativePriceUsd", "transportationAvailability"],
    sourceIds: ["src-usfs-mendenhall-permits-2026", "src-cbj-capital-transit-2026"],
    isDecisionChanging: true,
    verificationNote: "Verified against USFS Tongass fee schedule and CBJ Capital Transit map.",
  },
];

export const JUNEAU_HELICOPTER_QUESTIONS: QuestionDefinition[] = [
  {
    questionId: "date",
    label: "Cruise or port call date",
    helpText: "Leave blank to explore the labeled example scenario, or enter your exact port date.",
    inputType: "date",
    requiredForPersonalizedVerdict: true,
    decisionImpactExplanation:
      "Determines whether Juneau heliports and upper-elevation dog sled camps (May–August) are in season and whether operator departure times are confirmed.",
    drivenByClaimIds: ["claim-jnu-usfs-glacier-permits", "claim-jnu-dogsled-camp-season"],
    defaultValue: null,
  },
  {
    questionId: "travelMonth",
    label: "Month of travel (if exact date not set)",
    helpText: "Juneau glacier helicopter flights operate May through September.",
    inputType: "select",
    requiredForPersonalizedVerdict: false,
    decisionImpactExplanation:
      "Eliminates seasonal glacier helicopter options outside May–September and glacier dog sled camps in September after snowpack closes.",
    drivenByClaimIds: ["claim-jnu-usfs-glacier-permits", "claim-jnu-dogsled-camp-season"],
    options: [
      { value: "5", label: "May (Spring snowpack)" },
      { value: "6", label: "June (Peak daylight)" },
      { value: "7", label: "July (Mid-summer)" },
      { value: "8", label: "August (Late summer)" },
      { value: "9", label: "September (Glacier ice only; dog camps closed)" },
      { value: "4", label: "April (Shoulder / pre-heli season)" },
      { value: "10", label: "October (Late shoulder / post-heli season)" },
    ],
    defaultValue: 7,
  },
  {
    questionId: "arrivalTime",
    label: "Ship arrival time (24h HH:MM)",
    helpText: "Scheduled berthing time in Juneau.",
    inputType: "time",
    requiredForPersonalizedVerdict: true,
    decisionImpactExplanation:
      "Sets the start of your usable port window before gangway clearance and airport shuttle transfer.",
    drivenByClaimIds: ["claim-jnu-dock-transfer-windows"],
    defaultValue: "08:00",
  },
  {
    questionId: "allAboardTime",
    label: "All-aboard time (24h HH:MM)",
    helpText: "Hard ship cutoff (typically 30 minutes prior to departure).",
    inputType: "time",
    requiredForPersonalizedVerdict: true,
    decisionImpactExplanation:
      "Hard upper bound used to eliminate excursions that violate your return buffer.",
    drivenByClaimIds: ["claim-jnu-dock-transfer-windows"],
    defaultValue: "16:30",
  },
  {
    questionId: "arrivalDock",
    label: "Juneau cruise dock or tender",
    helpText: "AJ Dock and Tender adds 20–40 minutes round-trip transfer time compared to Downtown (CT/FKL/AS).",
    inputType: "select",
    requiredForPersonalizedVerdict: false,
    decisionImpactExplanation:
      "Adjusts round-trip ground transfer allowance between ship and Juneau Airport (JNU) or Auke Bay.",
    drivenByClaimIds: ["claim-jnu-dock-transfer-windows"],
    options: [
      { value: "CT", label: "Cruise Terminal (CT — Downtown, ~25m to JNU)" },
      { value: "FKL", label: "South Franklin (FKL — Downtown, ~25m to JNU)" },
      { value: "AS", label: "Alaska Steamship (AS — Downtown, ~25m to JNU)" },
      { value: "AJ", label: "AJ Dock (AJ — South of downtown, ~35m to JNU)" },
      { value: "ACT", label: "Anchor / Subport (ACT — Downtown, ~30m to JNU)" },
      { value: "TENDER_FKL", label: "Tender to Franklin Dock (~45m to JNU incl. tender)" },
      { value: "UNKNOWN", label: "Not sure yet (uses 35m conservative estimate)" },
    ],
    defaultValue: "CT",
  },
  {
    questionId: "returnBufferMinutes",
    label: "Minimum return buffer before all-aboard (minutes)",
    helpText: "60 minutes recommended for independent bookings.",
    inputType: "number",
    requiredForPersonalizedVerdict: false,
    decisionImpactExplanation:
      "Hard safety margin between estimated dock return and ship all-aboard cutoff.",
    drivenByClaimIds: ["claim-jnu-dock-transfer-windows"],
    min: 30,
    max: 180,
    defaultValue: 60,
  },
  {
    questionId: "weatherCondition",
    label: "Expected ceiling / visibility scenario",
    helpText: "Scenario assumption used to test VFR aviation sensitivity vs. surface backups.",
    inputType: "select",
    requiredForPersonalizedVerdict: false,
    decisionImpactExplanation:
      "Under low ceilings (<800 ft), helicopter glacier flights face high cancellation probability while Auke Bay whale watching and USFS valley shuttles operate normally.",
    drivenByClaimIds: ["claim-jnu-vfr-ceiling-thresholds", "claim-jnu-auke-bay-whale-backup"],
    options: [
      { value: "clear_vfr", label: "Clear VFR (>2,500 ft ceiling)" },
      { value: "marginal_ceiling_1200ft", label: "Marginal ceiling (1,000–1,500 ft)" },
      { value: "low_ceiling_under_800ft", label: "Low ceiling / fog (<800 ft — high aviation hold risk)" },
      { value: "unknown", label: "Unknown / more than 48h out" },
    ],
    defaultValue: "marginal_ceiling_1200ft",
  },
  {
    questionId: "mobilityLevel",
    label: "Walking, boarding, and accessibility requirement",
    helpText: "Glacier surface walks involve uneven ice; NorthStar requires a 2-hour crampon hike.",
    inputType: "select",
    requiredForPersonalizedVerdict: false,
    decisionImpactExplanation:
      "Eliminates strenuous crampon treks or unconfirmed helicopter transfers when step-free wheelchair access is required.",
    drivenByClaimIds: [
      "claim-jnu-northstar-walkabout-specs",
      "claim-jnu-auke-bay-whale-backup",
      "claim-jnu-usfs-visitor-center",
    ],
    options: [
      { value: "standard", label: "Standard (able to step into cabin and walk on uneven glacier ice)" },
      { value: "limited_mobility", label: "Limited mobility (short flat walks only; no 2-hour crampon treks)" },
      { value: "step_free_wheelchair", label: "Step-free / wheelchair user (requires ramp/lift boarding)" },
    ],
    defaultValue: "standard",
  },
  {
    questionId: "youngestChildAgeYears",
    label: "Youngest child age (years, or leave empty if adults only)",
    helpText: "NorthStar Trekking Glacier Walkabout requires minimum age 7+.",
    inputType: "number",
    requiredForPersonalizedVerdict: false,
    decisionImpactExplanation:
      "Eliminates extended crampon treks that enforce minimum age 7+ when younger children are in the party.",
    drivenByClaimIds: ["claim-jnu-northstar-walkabout-specs"],
    min: 0,
    max: 17,
    defaultValue: null,
  },
  {
    questionId: "passengerWeightAbove250Lbs",
    label: "Any traveler over 250 lbs clothed?",
    helpText: "All three Juneau helicopter operators assess an FAA weight-and-balance surcharge above 250–260 lbs.",
    inputType: "boolean",
    requiredForPersonalizedVerdict: false,
    decisionImpactExplanation:
      "Triggers mandatory FAA weight-surcharge disclosure ($150–$215) and adjusts budget checks.",
    drivenByClaimIds: ["claim-jnu-operator-weight-surcharge"],
    defaultValue: false,
  },
  {
    questionId: "budgetMaxPerPersonUsd",
    label: "Maximum budget per person (USD, optional)",
    helpText: "Standard glacier landings start ~$419; dog sled camps ~$679; Auke Bay whale ~$179; USFS shuttle ~$45.",
    inputType: "number",
    requiredForPersonalizedVerdict: false,
    decisionImpactExplanation:
      "Eliminates options whose minimum published fare (plus applicable weight surcharge) exceeds your ceiling.",
    drivenByClaimIds: [
      "claim-jnu-temsco-mendenhall-specs",
      "claim-jnu-coastal-icefield-specs",
      "claim-jnu-dogsled-camp-season",
    ],
    min: 0,
    max: 5000,
    defaultValue: null,
  },
  {
    questionId: "formatPreference",
    label: "Preferred excursion format",
    helpText: "Used to rank viable options after hard time, season, and mobility constraints are checked.",
    inputType: "select",
    requiredForPersonalizedVerdict: false,
    decisionImpactExplanation:
      "Orders viable options by preferred glacier time, dog sled camp, or two-activity combination without hiding viable single-activity alternatives.",
    drivenByClaimIds: [
      "claim-jnu-temsco-mendenhall-specs",
      "claim-jnu-northstar-walkabout-specs",
      "claim-jnu-dogsled-camp-season",
    ],
    options: [
      { value: "any", label: "Any viable glacier or port-day format" },
      { value: "standard_glacier_walk", label: "Standard Helicopter + 20-min Glacier Walk" },
      { value: "extended_trek_walkabout", label: "Extended 2-Hour Guided Glacier Trek (NorthStar)" },
      { value: "glacier_dogsled_camp", label: "Helicopter + Upper Glacier Dog Sled Camp" },
      { value: "two_activity_combo", label: "Two-Activity Combo (Helicopter + Mendenhall Visitor Center)" },
    ],
    defaultValue: "any",
  },
];

export const JUNEAU_HELICOPTER_COMPARISON_DIMENSIONS: ComparisonDimension[] = [
  {
    dimensionId: "operatorAndPermit",
    label: "Actual Operator & Base",
    description: "Permitted Tongass National Forest operator or marine/surface provider.",
  },
  {
    dimensionId: "flightAndGlacierTime",
    label: "Flight vs. Glacier Surface Time",
    description: "Airborne scenic flight minutes vs. time on the ice.",
  },
  {
    dimensionId: "dockToDockDuration",
    label: "Total Dock-to-Dock Window",
    description: "Includes shuttle transfer, 45-minute check-in/gear briefing, and return.",
  },
  {
    dimensionId: "weatherSensitivity",
    label: "Ceiling & Weather Sensitivity",
    description: "Vulnerability to low cloud ceilings in the Juneau Icefield.",
  },
  {
    dimensionId: "mobilityAndAge",
    label: "Mobility & Age Rule",
    description: "Walking surface, boarding steps, and minimum age requirements.",
  },
  {
    dimensionId: "priceAndWeightPolicy",
    label: "Published Price & Weight Rule",
    description: "Per-person tariff range and FAA >250–260 lb balance policy.",
  },
];

export const JUNEAU_HELICOPTER_CANDIDATE_OPTIONS: CandidateOption[] = [
  {
    optionId: "jnu-heli-temsco-mendenhall",
    title: "TEMSCO Helicopters: Mendenhall Glacier & Guided Walk",
    shortLabel: "TEMSCO Mendenhall Landing",
    optionKind: "guided_commercial",
    actualOperators: ["TEMSCO Helicopters"],
    islandsOrRegions: ["Juneau"],
    departureAreas: ["Juneau International Airport (JNU — TEMSCO Heliport)"],
    operatingMonths: [5, 6, 7, 8, 9],
    scheduleVerifiedThroughDate: "2026-09-30",
    vesselOrVehicleType: "AStar AS350 / Airbus H125 Helicopter (6 passengers)",
    groupCapacityRange: { min: 1, max: 6, label: "Up to 6 guests per helicopter" },
    rideComfortLevel: "high_motion_raft_or_aircraft",
    viewingSpaceDescription: "Wrap-around bubble canopy with headset narration and 20–25 min guided walk on Mendenhall Glacier.",
    durationMinutes: {
      activity: 90,
      checkInLead: 45,
      typicalTransferEachWay: 25,
      totalDockOrHotelRange: { min: 185, max: 215 },
      label: "~3.25 hrs dock-to-dock (30–35m flight, 20–25m on ice, 45m check-in/gear)",
    },
    minimumAgeYears: 2,
    minimumAgeNote: "Children 2+ require an individual seat; infants under 2 lap policy requires direct operator confirmation.",
    accessibilityProfile: {
      stepFreeWheelchairSupported: false,
      limitedMobilitySupported: true,
      walkingAndBoardingRequirement:
        "Guests step into the helicopter cabin (ground crew assistance available) and walk slowly on uneven glacier ice in provided traction overboots. Folding wheelchair ramp/lift transfers require advance confirmation with TEMSCO.",
      confirmationStatus: "operator_confirmation_required",
      note: "Contact TEMSCO directly before booking if step-free transfer assistance is needed.",
    },
    transportationAvailability: {
      hotelPickupAvailable: true,
      cruisePortShuttleAvailable: true,
      selfDriveParkingNote: "Complimentary parking at TEMSCO JNU terminal.",
    },
    cancellationTerms: "100% full refund if TEMSCO cancels due to ceiling or visibility holds.",
    whaleSightingOrReRidePolicy: "N/A (Aviation VFR refund guarantee applies)",
    indicativePriceUsd: {
      min: 419,
      max: 459,
      basisLabel: "per person (+$175–$215 FAA weight surcharge if >250 lbs)",
    },
    comparisonValues: {
      operatorAndPermit: "TEMSCO Helicopters (USFS Mendenhall permit, JNU Base)",
      flightAndGlacierTime: "30–35 min flight + 20–25 min guided glacier walk",
      dockToDockDuration: "3.0–3.5 hrs dock-to-dock (incl. 45m check-in)",
      weatherSensitivity: "Moderate-High (requires VFR into Mendenhall valley)",
      mobilityAndAge: "Short walk on uneven ice in traction boots; lift assist by request",
      priceAndWeightPolicy: "$419–$459 pp; >250 lb surcharge applies",
    },
    tradeoffs: {
      strengths: [
        "Only operator holding the primary Mendenhall Glacier landing permit",
        "Fits standard 6+ hour cruise port calls with comfortable return margin",
        "Full refund if grounded by weather",
      ],
      limitations: [
        "20–25 minutes on the ice is shorter than NorthStar's 2-hour trek",
        "Subject to VFR ceiling holds when clouds drop below 1,000 ft",
      ],
    },
    claimIds: [
      "claim-jnu-usfs-glacier-permits",
      "claim-jnu-dock-transfer-windows",
      "claim-jnu-temsco-mendenhall-specs",
      "claim-jnu-operator-weight-surcharge",
      "claim-jnu-vfr-ceiling-thresholds",
    ],
    sourceIds: [
      "src-usfs-mendenhall-permits-2026",
      "src-cbj-docks-harbors-2026",
      "src-temsco-juneau-ops-2026",
      "src-faa-pajn-weather-cams-2026",
    ],
    bookingDestinations: [
      {
        destinationId: "dest-temsco-direct",
        optionId: "jnu-heli-temsco-mendenhall",
        sellerType: "direct_operator",
        sellerName: "TEMSCO Helicopters (Direct Operator)",
        actualOperatorName: "TEMSCO Helicopters",
        label: "Book direct with TEMSCO Helicopters",
        url: "https://temscoair.com/juneau-tours/",
        supportedContextParams: [],
        relationshipDisclosure: "Direct operator link — no DCC affiliate markup.",
        isCommercialPartner: false,
        commissionInfluenceOnRanking: 0,
      },
      {
        destinationId: "dest-jfd-temsco-comparison",
        optionId: "jnu-heli-temsco-mendenhall",
        sellerType: "dcc_owned_specialist",
        sellerName: "Juneau Flight Deck (DCC Owned Specialist)",
        actualOperatorName: "TEMSCO Helicopters",
        label: "Compare departure windows on Juneau Flight Deck",
        url: "https://juneauflightdeck.com/",
        supportedContextParams: ["port", "category", "corridor", "dock", "date"],
        relationshipDisclosure: "DCC owned specialist aviation site. Ownership never affects fit ranking.",
        isCommercialPartner: true,
        commissionInfluenceOnRanking: 0,
      },
    ],
    reviewEvidenceConfig: {
      productCode: "JNU-TEMSCO-MENDENHALL",
      reviews: [],
      checkStatus: "unavailable",
      lastRetrievedAt: null,
      sourcesQueried: ["verified_booking_feed"],
    },
  },
  {
    optionId: "jnu-heli-coastal-icefield",
    title: "Coastal Helicopters: Icefield Excursion (Herbert / Norris Glacier)",
    shortLabel: "Coastal Icefield Excursion",
    optionKind: "guided_commercial",
    actualOperators: ["Coastal Helicopters"],
    islandsOrRegions: ["Juneau"],
    departureAreas: ["Juneau International Airport (JNU — North Ramp)"],
    operatingMonths: [5, 6, 7, 8, 9],
    scheduleVerifiedThroughDate: "2026-09-30",
    vesselOrVehicleType: "AStar AS350 Helicopter (6 passengers)",
    groupCapacityRange: { min: 1, max: 6, label: "Up to 6 guests per helicopter" },
    rideComfortLevel: "high_motion_raft_or_aircraft",
    viewingSpaceDescription: "Flexible routing to Herbert, Taku, or Norris Glacier depending on micro-weather.",
    durationMinutes: {
      activity: 80,
      checkInLead: 45,
      typicalTransferEachWay: 25,
      totalDockOrHotelRange: { min: 175, max: 205 },
      label: "~3.0–3.25 hrs dock-to-dock (30m flight, 15–20m on glacier, 45m check-in)",
    },
    minimumAgeYears: 2,
    minimumAgeNote: "Children 2+ require a ticketed seat.",
    accessibilityProfile: {
      stepFreeWheelchairSupported: false,
      limitedMobilitySupported: true,
      walkingAndBoardingRequirement:
        "Requires stepping into the helicopter cabin and walking on compact glacier ice with overboots. Operator confirmation required for transfer assistance.",
      confirmationStatus: "operator_confirmation_required",
      note: "Confirm mobility assistance directly with Coastal Helicopters prior to booking.",
    },
    transportationAvailability: {
      hotelPickupAvailable: true,
      cruisePortShuttleAvailable: true,
      selfDriveParkingNote: "Parking available at JNU North Ramp.",
    },
    cancellationTerms: "100% refund if cancelled due to weather holds.",
    whaleSightingOrReRidePolicy: "N/A (Aviation VFR refund guarantee applies)",
    indicativePriceUsd: {
      min: 399,
      max: 439,
      basisLabel: "per person (+$150–$200 FAA weight surcharge if >260 lbs)",
    },
    comparisonValues: {
      operatorAndPermit: "Coastal Helicopters (USFS Icefield permit, JNU North Ramp)",
      flightAndGlacierTime: "30 min flight + 15–20 min glacier walk",
      dockToDockDuration: "3.0–3.25 hrs dock-to-dock",
      weatherSensitivity: "Moderate (can route between Herbert and Taku valleys)",
      mobilityAndAge: "Short glacier walk; step-in cabin boarding",
      priceAndWeightPolicy: "$399–$439 pp; >260 lb surcharge applies",
    },
    tradeoffs: {
      strengths: [
        "Multi-glacier routing flexibility (Herbert, Taku, Norris) when one valley has localized clouds",
        "Slightly shorter total duration for tighter port calls",
      ],
      limitations: [
        "Does not land on Mendenhall Glacier itself (lands on adjacent Juneau Icefield glaciers)",
        "15–20 minutes on the ice is geared toward scenic photography rather than trekking",
      ],
    },
    claimIds: [
      "claim-jnu-usfs-glacier-permits",
      "claim-jnu-dock-transfer-windows",
      "claim-jnu-coastal-icefield-specs",
      "claim-jnu-operator-weight-surcharge",
      "claim-jnu-vfr-ceiling-thresholds",
    ],
    sourceIds: [
      "src-usfs-mendenhall-permits-2026",
      "src-cbj-docks-harbors-2026",
      "src-coastal-helicopters-2026",
      "src-faa-pajn-weather-cams-2026",
    ],
    bookingDestinations: [
      {
        destinationId: "dest-coastal-direct",
        optionId: "jnu-heli-coastal-icefield",
        sellerType: "direct_operator",
        sellerName: "Coastal Helicopters (Direct Operator)",
        actualOperatorName: "Coastal Helicopters",
        label: "Book direct with Coastal Helicopters",
        url: "https://www.coastalhelicopters.com/tours/",
        supportedContextParams: [],
        relationshipDisclosure: "Direct operator link — no DCC affiliate markup.",
        isCommercialPartner: false,
        commissionInfluenceOnRanking: 0,
      },
      {
        destinationId: "dest-jfd-coastal-comparison",
        optionId: "jnu-heli-coastal-icefield",
        sellerType: "dcc_owned_specialist",
        sellerName: "Juneau Flight Deck (DCC Owned Specialist)",
        actualOperatorName: "Coastal Helicopters",
        label: "Compare on Juneau Flight Deck",
        url: "https://juneauflightdeck.com/",
        supportedContextParams: ["port", "category", "corridor", "dock", "date"],
        relationshipDisclosure: "DCC owned specialist aviation site. Ownership never affects fit ranking.",
        isCommercialPartner: true,
        commissionInfluenceOnRanking: 0,
      },
    ],
  },
  {
    optionId: "jnu-heli-northstar-walkabout",
    title: "NorthStar Trekking: Glacier Walkabout (2-Hour Guided Crampon Hike)",
    shortLabel: "NorthStar 2-Hr Glacier Trek",
    optionKind: "guided_commercial",
    actualOperators: ["NorthStar Trekking"],
    islandsOrRegions: ["Juneau"],
    departureAreas: ["Juneau International Airport (JNU — NorthStar Base)"],
    operatingMonths: [5, 6, 7, 8, 9],
    scheduleVerifiedThroughDate: "2026-09-30",
    vesselOrVehicleType: "AStar AS350 Helicopter + Guided Mountaineering Crampon Trek",
    groupCapacityRange: { min: 1, max: 6, label: "6 guests per guide pod" },
    rideComfortLevel: "high_motion_raft_or_aircraft",
    viewingSpaceDescription: "2 full hours hiking across crevasses, moulins, and blue ice walls with mountaineering gear.",
    durationMinutes: {
      activity: 165,
      checkInLead: 45,
      typicalTransferEachWay: 25,
      totalDockOrHotelRange: { min: 255, max: 280 },
      label: "~4.25–4.5 hrs dock-to-dock (30m flight, 2 full hrs on glacier, 45m gear outfitting)",
    },
    minimumAgeYears: 7,
    minimumAgeNote: "Strict minimum age 7 years for Glacier Walkabout (12+ for 3-hour X-Trek).",
    accessibilityProfile: {
      stepFreeWheelchairSupported: false,
      limitedMobilitySupported: false,
      walkingAndBoardingRequirement:
        "Requires 2 continuous hours of hiking on sloped, uneven glacier ice in rigid mountaineering boots and crampons.",
      confirmationStatus: "not_accessible",
      note: "Not suitable for guests with limited mobility, knee/ankle instability, or wheelchair requirements.",
    },
    transportationAvailability: {
      hotelPickupAvailable: true,
      cruisePortShuttleAvailable: true,
      selfDriveParkingNote: "Parking at NorthStar JNU hangar.",
    },
    cancellationTerms: "Full refund if cancelled by operator due to aviation weather.",
    whaleSightingOrReRidePolicy: "N/A (Aviation VFR refund guarantee applies)",
    indicativePriceUsd: {
      min: 539,
      max: 589,
      basisLabel: "per person (+$175 FAA weight surcharge if >250 lbs)",
    },
    comparisonValues: {
      operatorAndPermit: "NorthStar Trekking (USFS Trekking permit, JNU Base)",
      flightAndGlacierTime: "30 min flight + 120 min guided crampon trek",
      dockToDockDuration: "4.25–4.5 hrs dock-to-dock",
      weatherSensitivity: "Moderate-High (VFR flight clearance required)",
      mobilityAndAge: "Ages 7+; active 2-hr crampon hike on sloped ice",
      priceAndWeightPolicy: "$539–$589 pp; >250 lb surcharge applies",
    },
    tradeoffs: {
      strengths: [
        "4x more time on the ice (2 full hours) than standard 20-minute landing tours",
        "Full mountaineering gear (boots, crampons, rain jacket/pants, gaiters) provided",
      ],
      limitations: [
        "Requires a longer port window (~4.5 hours plus ship buffer)",
        "Not eligible for children under 7 or travelers needing flat/low-impact walking",
      ],
    },
    claimIds: [
      "claim-jnu-usfs-glacier-permits",
      "claim-jnu-dock-transfer-windows",
      "claim-jnu-northstar-walkabout-specs",
      "claim-jnu-operator-weight-surcharge",
      "claim-jnu-vfr-ceiling-thresholds",
    ],
    sourceIds: [
      "src-usfs-mendenhall-permits-2026",
      "src-cbj-docks-harbors-2026",
      "src-northstar-trekking-2026",
      "src-faa-pajn-weather-cams-2026",
    ],
    bookingDestinations: [
      {
        destinationId: "dest-northstar-direct",
        optionId: "jnu-heli-northstar-walkabout",
        sellerType: "direct_operator",
        sellerName: "NorthStar Trekking (Direct Operator)",
        actualOperatorName: "NorthStar Trekking",
        label: "Book direct with NorthStar Trekking",
        url: "https://www.northstartrekking.com/glacier-treks/",
        supportedContextParams: [],
        relationshipDisclosure: "Direct operator link — no DCC affiliate markup.",
        isCommercialPartner: false,
        commissionInfluenceOnRanking: 0,
      },
      {
        destinationId: "dest-jfd-northstar-comparison",
        optionId: "jnu-heli-northstar-walkabout",
        sellerType: "dcc_owned_specialist",
        sellerName: "Juneau Flight Deck (DCC Owned Specialist)",
        actualOperatorName: "NorthStar Trekking",
        label: "Compare trekking windows on Juneau Flight Deck",
        url: "https://juneauflightdeck.com/",
        supportedContextParams: ["port", "category", "corridor", "dock", "date"],
        relationshipDisclosure: "DCC owned specialist aviation site. Ownership never affects fit ranking.",
        isCommercialPartner: true,
        commissionInfluenceOnRanking: 0,
      },
    ],
  },
  {
    optionId: "jnu-heli-dogsled-camp",
    title: "Helicopter + Upper Glacier Dog Sled Camp (TEMSCO / Coastal)",
    shortLabel: "Glacier Dog Sled Camp",
    optionKind: "guided_commercial",
    actualOperators: ["TEMSCO Helicopters", "Coastal Helicopters"],
    islandsOrRegions: ["Juneau"],
    departureAreas: ["Juneau International Airport (JNU)"],
    operatingMonths: [5, 6, 7, 8],
    scheduleVerifiedThroughDate: "2026-08-31",
    vesselOrVehicleType: "Helicopter Transfer + Upper-Snowpack Mushers Camp",
    groupCapacityRange: { min: 1, max: 6, label: "Up to 6 guests per flight" },
    rideComfortLevel: "high_motion_raft_or_aircraft",
    viewingSpaceDescription: "Upper-elevation snowfield camp (~3,500+ ft) with husky teams and sled run.",
    durationMinutes: {
      activity: 110,
      checkInLead: 45,
      typicalTransferEachWay: 25,
      totalDockOrHotelRange: { min: 205, max: 230 },
      label: "~3.5–3.75 hrs dock-to-dock (30–35m flight, ~60m at snow camp, 45m check-in)",
    },
    minimumAgeYears: 2,
    minimumAgeNote: "Children 2+ ticketed; sled standing vs. sitting options at camp.",
    accessibilityProfile: {
      stepFreeWheelchairSupported: false,
      limitedMobilitySupported: true,
      walkingAndBoardingRequirement:
        "Requires stepping into helicopter and walking in deep or packed snow at upper elevation camp.",
      confirmationStatus: "operator_confirmation_required",
      note: "Confirm snow-camp transfer assistance directly with TEMSCO or Coastal.",
    },
    transportationAvailability: {
      hotelPickupAvailable: true,
      cruisePortShuttleAvailable: true,
      selfDriveParkingNote: "Parking at JNU heliport.",
    },
    cancellationTerms: "Full refund if grounded by upper-elevation cloud ceilings (or optional downgrade to lower-ice landing if available).",
    whaleSightingOrReRidePolicy: "N/A",
    indicativePriceUsd: {
      min: 679,
      max: 749,
      basisLabel: "per person (+$175–$215 FAA weight surcharge if >250 lbs)",
    },
    comparisonValues: {
      operatorAndPermit: "TEMSCO (Mendenhall/Norris Camp) or Coastal (Herbert Camp)",
      flightAndGlacierTime: "30–35 min flight + ~60 min at upper snow mushing camp",
      dockToDockDuration: "3.5–3.75 hrs dock-to-dock",
      weatherSensitivity: "Highest (upper snow camps sit in the 3,000–4,000 ft cloud deck)",
      mobilityAndAge: "Walking on packed snow at camp; May–August only",
      priceAndWeightPolicy: "$679–$749 pp; >250 lb surcharge applies",
    },
    tradeoffs: {
      strengths: [
        "Authentic snow-surface dog mushing on the Juneau Icefield",
        "Includes both scenic glacier flight and 1 hour with sled dogs and mushers",
      ],
      limitations: [
        "Highest weather cancellation rate in Juneau because camps sit higher in the cloud deck",
        "Closes in late August / September when snowpack melts to bare ice",
      ],
    },
    claimIds: [
      "claim-jnu-usfs-glacier-permits",
      "claim-jnu-dock-transfer-windows",
      "claim-jnu-dogsled-camp-season",
      "claim-jnu-operator-weight-surcharge",
      "claim-jnu-vfr-ceiling-thresholds",
    ],
    sourceIds: [
      "src-usfs-mendenhall-permits-2026",
      "src-cbj-docks-harbors-2026",
      "src-temsco-juneau-ops-2026",
      "src-coastal-helicopters-2026",
      "src-faa-pajn-weather-cams-2026",
    ],
    bookingDestinations: [
      {
        destinationId: "dest-temsco-dogsled-direct",
        optionId: "jnu-heli-dogsled-camp",
        sellerType: "direct_operator",
        sellerName: "TEMSCO Helicopters (Direct Operator)",
        actualOperatorName: "TEMSCO Helicopters",
        label: "Book Glacier Dog Sledding direct with TEMSCO",
        url: "https://temscoair.com/juneau-tours/",
        supportedContextParams: [],
        relationshipDisclosure: "Direct operator link — no DCC affiliate markup.",
        isCommercialPartner: false,
        commissionInfluenceOnRanking: 0,
      },
      {
        destinationId: "dest-jfd-dogsled-comparison",
        optionId: "jnu-heli-dogsled-camp",
        sellerType: "dcc_owned_specialist",
        sellerName: "Juneau Flight Deck (DCC Owned Specialist)",
        actualOperatorName: "TEMSCO / Coastal Helicopters",
        label: "Compare snow-camp risk & availability on Juneau Flight Deck",
        url: "https://juneauflightdeck.com/",
        supportedContextParams: ["port", "category", "corridor", "dock", "date"],
        relationshipDisclosure: "DCC owned specialist aviation site. Ownership never affects fit ranking.",
        isCommercialPartner: true,
        commissionInfluenceOnRanking: 0,
      },
    ],
  },
  {
    optionId: "jnu-heli-mendenhall-combo",
    title: "Two-Activity Combo: Helicopter Landing + Mendenhall Visitor Center",
    shortLabel: "Heli + Mendenhall Combo",
    optionKind: "guided_commercial",
    actualOperators: ["TEMSCO / Coastal + USFS Visitor Center Transfer"],
    islandsOrRegions: ["Juneau"],
    departureAreas: ["Juneau International Airport (JNU) & Mendenhall Valley"],
    operatingMonths: [5, 6, 7, 8, 9],
    scheduleVerifiedThroughDate: "2026-09-30",
    vesselOrVehicleType: "Helicopter + Dedicated Valley Coach Transfer",
    groupCapacityRange: { min: 1, max: 6, label: "6 per helicopter + valley transfer" },
    rideComfortLevel: "high_motion_raft_or_aircraft",
    viewingSpaceDescription: "Combines ice landing with ground-level Photo Point & Nugget Falls viewpoints.",
    durationMinutes: {
      activity: 210,
      checkInLead: 45,
      typicalTransferEachWay: 25,
      totalDockOrHotelRange: { min: 300, max: 330 },
      label: "~5.0–5.5 hrs dock-to-dock (requires 6.5+ hour port window)",
    },
    minimumAgeYears: 2,
    minimumAgeNote: "Children 2+ ticketed.",
    accessibilityProfile: {
      stepFreeWheelchairSupported: false,
      limitedMobilitySupported: true,
      walkingAndBoardingRequirement:
        "Glacier landing requires walking on ice; Mendenhall Visitor Center portion has step-free ramps and paved Photo Point trail.",
      confirmationStatus: "operator_confirmation_required",
      note: "Confirm helicopter boarding assistance directly with operator.",
    },
    transportationAvailability: {
      hotelPickupAvailable: true,
      cruisePortShuttleAvailable: true,
      selfDriveParkingNote: "Coordinated JNU + Mendenhall Valley transfer.",
    },
    cancellationTerms: "Helicopter leg refunded if weather cancels flight; ground portion can proceed.",
    whaleSightingOrReRidePolicy: "N/A",
    indicativePriceUsd: {
      min: 469,
      max: 529,
      basisLabel: "per person (+$175–$215 FAA weight surcharge if >250 lbs)",
    },
    comparisonValues: {
      operatorAndPermit: "Permitted JNU Helicopter Operator + USFS Mendenhall Pass",
      flightAndGlacierTime: "30m flight + 20m ice walk + 90m Visitor Center/trails",
      dockToDockDuration: "5.0–5.5 hrs dock-to-dock",
      weatherSensitivity: "Moderate (ground portion operates even if flight holds)",
      mobilityAndAge: "Ice walk on heli leg; paved trails at Visitor Center",
      priceAndWeightPolicy: "$469–$529 pp; >250 lb surcharge applies",
    },
    tradeoffs: {
      strengths: [
        "Delivers both aerial icefield landing and classic ground-level Mendenhall viewpoints in one coordinated transfer",
      ],
      limitations: [
        "Requires at least 6.5 hours in port to preserve a 60-minute return buffer",
      ],
    },
    claimIds: [
      "claim-jnu-usfs-glacier-permits",
      "claim-jnu-dock-transfer-windows",
      "claim-jnu-temsco-mendenhall-specs",
      "claim-jnu-usfs-visitor-center",
    ],
    sourceIds: [
      "src-usfs-mendenhall-permits-2026",
      "src-cbj-docks-harbors-2026",
      "src-temsco-juneau-ops-2026",
    ],
    bookingDestinations: [
      {
        destinationId: "dest-lfse-juneau-combo",
        optionId: "jnu-heli-mendenhall-combo",
        sellerType: "dcc_owned_specialist",
        sellerName: "Last Frontier Shore Excursions (DCC Owned Specialist)",
        actualOperatorName: "Permitted Juneau Operators",
        label: "Compare port-day combinations on Last Frontier Shore Excursions",
        url: "https://www.lastfrontiershoreexcursions.com/",
        supportedContextParams: ["port", "category", "corridor", "dock", "date"],
        relationshipDisclosure: "DCC owned Alaska shore-excursion specialist site. Ownership never affects fit ranking.",
        isCommercialPartner: true,
        commissionInfluenceOnRanking: 0,
      },
      {
        destinationId: "dest-jfd-combo-comparison",
        optionId: "jnu-heli-mendenhall-combo",
        sellerType: "dcc_owned_specialist",
        sellerName: "Juneau Flight Deck (DCC Owned Specialist)",
        actualOperatorName: "Permitted Juneau Helicopter Operators",
        label: "Inspect flight window timing on Juneau Flight Deck",
        url: "https://juneauflightdeck.com/",
        supportedContextParams: ["port", "category", "corridor", "dock", "date"],
        relationshipDisclosure: "DCC owned specialist aviation site. Ownership never affects fit ranking.",
        isCommercialPartner: true,
        commissionInfluenceOnRanking: 0,
      },
    ],
  },
  {
    optionId: "jnu-backup-auke-bay-whale",
    title: "Low-Ceiling Surface Backup: Auke Bay Whale Watching Catamaran",
    shortLabel: "Auke Bay Whale Backup",
    optionKind: "guided_commercial",
    actualOperators: ["Allen Marine Tours", "Juneau Auke Bay Operators"],
    islandsOrRegions: ["Juneau"],
    departureAreas: ["Auke Bay / Statter Harbor"],
    operatingMonths: [4, 5, 6, 7, 8, 9, 10],
    scheduleVerifiedThroughDate: "2026-10-15",
    vesselOrVehicleType: "Waterjet Heated Cabin Catamaran",
    groupCapacityRange: { min: 1, max: 120, label: "Spacious multi-deck catamaran" },
    rideComfortLevel: "high_stability",
    viewingSpaceDescription: "Enclosed heated main cabin plus open upper observation deck in sheltered Stephens Passage.",
    durationMinutes: {
      activity: 150,
      checkInLead: 30,
      typicalTransferEachWay: 25,
      totalDockOrHotelRange: { min: 220, max: 245 },
      label: "~3.75 hrs dock-to-dock (2.5 hr sheltered marine cruise + shuttle)",
    },
    minimumAgeYears: null,
    minimumAgeNote: "All ages welcome.",
    accessibilityProfile: {
      stepFreeWheelchairSupported: true,
      limitedMobilitySupported: true,
      walkingAndBoardingRequirement:
        "Step-free ramp boarding to main enclosed cabin and accessible restroom on designated Allen Marine catamarans (tide-dependent dock ramp slope).",
      confirmationStatus: "confirmed_accessible",
      note: "Step-free wheelchair boarding supported on designated departures.",
    },
    transportationAvailability: {
      hotelPickupAvailable: false,
      cruisePortShuttleAvailable: true,
      selfDriveParkingNote: "Direct shuttle from downtown cruise docks to Statter Harbor.",
    },
    cancellationTerms: "Operates reliably in rain and low ceilings; $100 cash refund if no whale is sighted.",
    whaleSightingOrReRidePolicy: "100% whale sighting guarantee ($100 cash refund if no humpback or killer whale sighted).",
    indicativePriceUsd: {
      min: 169,
      max: 209,
      basisLabel: "per person (no passenger weight surcharge)",
    },
    comparisonValues: {
      operatorAndPermit: "Allen Marine / Auke Bay Operators (Statter Harbor)",
      flightAndGlacierTime: "N/A (2.5 hr marine wildlife & Mendenhall channel views)",
      dockToDockDuration: "3.75–4.0 hrs dock-to-dock",
      weatherSensitivity: "Low (operates under <800 ft ceilings that ground helicopters)",
      mobilityAndAge: "Step-free main deck wheelchair access on designated vessels; all ages",
      priceAndWeightPolicy: "$169–$209 pp; no weight surcharge",
    },
    tradeoffs: {
      strengths: [
        "Operates reliably when low clouds (<800 ft) ground all Juneau glacier helicopters",
        "Confirmed step-free wheelchair access on designated catamarans and zero weight surcharge",
      ],
      limitations: [
        "Does not land on a glacier (marine wildlife and distant Mendenhall views from water)",
      ],
    },
    claimIds: [
      "claim-jnu-dock-transfer-windows",
      "claim-jnu-vfr-ceiling-thresholds",
      "claim-jnu-auke-bay-whale-backup",
    ],
    sourceIds: [
      "src-cbj-docks-harbors-2026",
      "src-faa-pajn-weather-cams-2026",
      "src-allen-marine-auke-bay-2026",
    ],
    bookingDestinations: [
      {
        destinationId: "dest-allen-marine-direct",
        optionId: "jnu-backup-auke-bay-whale",
        sellerType: "direct_operator",
        sellerName: "Allen Marine Tours (Direct Operator)",
        actualOperatorName: "Allen Marine Tours",
        label: "View direct operator details at Allen Marine",
        url: "https://allenmarinetours.com/juneau/whale-watching-wildlife-quest/",
        supportedContextParams: [],
        relationshipDisclosure: "Direct operator link — no DCC affiliate markup.",
        isCommercialPartner: false,
        commissionInfluenceOnRanking: 0,
      },
      {
        destinationId: "dest-lfse-whale-backup",
        optionId: "jnu-backup-auke-bay-whale",
        sellerType: "dcc_owned_specialist",
        sellerName: "Last Frontier Shore Excursions (DCC Owned Specialist)",
        actualOperatorName: "Auke Bay Whale Watching Operators",
        label: "Compare Juneau whale watching on Last Frontier Shore Excursions",
        url: "https://www.lastfrontiershoreexcursions.com/",
        supportedContextParams: ["port", "category", "corridor", "dock", "date"],
        relationshipDisclosure: "DCC owned Alaska shore-excursion specialist site. Ownership never affects fit ranking.",
        isCommercialPartner: true,
        commissionInfluenceOnRanking: 0,
      },
    ],
  },
  {
    optionId: "jnu-diy-usfs-mendenhall-shuttle",
    title: "Public/Surface Alternative: USFS Mendenhall Glacier Visitor Center & Trails",
    shortLabel: "USFS Mendenhall Visitor Center (DIY / Shuttle)",
    optionKind: "public_or_diy",
    actualOperators: ["U.S. Forest Service — Tongass National Forest", "CBJ Capital Transit / Direct Shuttles"],
    islandsOrRegions: ["Juneau"],
    departureAreas: ["Downtown Juneau Transit Center / Cruise Berths"],
    operatingMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    scheduleVerifiedThroughDate: "2026-12-31",
    vesselOrVehicleType: "Paved/Boardwalk USFS Trails + Express Shuttle or $2 City Bus",
    groupCapacityRange: { min: 1, max: 50, label: "Self-paced public recreation area" },
    rideComfortLevel: "shore_stationary",
    viewingSpaceDescription: "Elevated Visitor Center, paved Photo Point trail, Steep Creek bear-viewing boardwalk, and Nugget Falls trail.",
    durationMinutes: {
      activity: 120,
      checkInLead: 15,
      typicalTransferEachWay: 25,
      totalDockOrHotelRange: { min: 165, max: 210 },
      label: "~2.75–3.5 hrs dock-to-dock (self-paced)",
    },
    minimumAgeYears: null,
    minimumAgeNote: "All ages welcome.",
    accessibilityProfile: {
      stepFreeWheelchairSupported: true,
      limitedMobilitySupported: true,
      walkingAndBoardingRequirement:
        "Visitor Center elevator, Steep Creek boardwalk, and Photo Point trail are step-free. Note: $2 Capital Transit bus stops 1.5 miles from the Visitor Center; use direct express shuttle or accessible taxi for drop-off at the Visitor Center plaza.",
      confirmationStatus: "confirmed_accessible",
      note: "Fully accessible at Visitor Center plaza.",
    },
    transportationAvailability: {
      hotelPickupAvailable: false,
      cruisePortShuttleAvailable: true,
      selfDriveParkingNote: "$5 USFS day-use fee; $2 Capital Transit bus + 1.5-mile walk each way or $45–$60 direct shuttle.",
    },
    cancellationTerms: "Public federal recreation site — operates in all ceiling conditions.",
    whaleSightingOrReRidePolicy: "N/A",
    indicativePriceUsd: {
      min: 9,
      max: 60,
      basisLabel: "$5 USFS pass + $4 round-trip city bus (or $45–$60 direct shuttle)",
    },
    comparisonValues: {
      operatorAndPermit: "U.S. Forest Service Tongass National Forest (Public Site)",
      flightAndGlacierTime: "Ground-level glacier face, Photo Point & Nugget Falls",
      dockToDockDuration: "2.75–3.5 hrs (flexible)",
      weatherSensitivity: "Immune to aviation ceiling holds",
      mobilityAndAge: "Step-free Visitor Center elevator, Steep Creek boardwalk & Photo Point",
      priceAndWeightPolicy: "$5 USFS pass + $4 city bus (or $45–$60 direct shuttle)",
    },
    tradeoffs: {
      strengths: [
        "Zero aviation weather cancellation risk and lowest cost ($9 DIY bus + pass or $45–$60 shuttle)",
        "Confirmed step-free accessibility at Visitor Center elevator and Photo Point",
      ],
      limitations: [
        "Views Mendenhall Glacier from the lake shore rather than landing on the upper ice",
        "$2 Capital Transit city bus stops 1.5 miles away (3.0 miles extra walking round-trip)",
      ],
    },
    claimIds: [
      "claim-jnu-dock-transfer-windows",
      "claim-jnu-usfs-visitor-center",
    ],
    sourceIds: [
      "src-cbj-docks-harbors-2026",
      "src-usfs-mendenhall-permits-2026",
      "src-cbj-capital-transit-2026",
    ],
    bookingDestinations: [
      {
        destinationId: "dest-usfs-mendenhall-official",
        optionId: "jnu-diy-usfs-mendenhall-shuttle",
        sellerType: "public_or_diy",
        sellerName: "U.S. Forest Service — Mendenhall Glacier Visitor Center",
        actualOperatorName: "U.S. Forest Service",
        label: "Official USFS Mendenhall Glacier Visitor Center info",
        url: "https://www.fs.usda.gov/detail/tongass/about-forest/offices/?cid=fseprd1093566",
        supportedContextParams: [],
        relationshipDisclosure: "Public federal agency link — noncommercial.",
        isCommercialPartner: false,
        commissionInfluenceOnRanking: 0,
      },
      {
        destinationId: "dest-cbj-capital-transit",
        optionId: "jnu-diy-usfs-mendenhall-shuttle",
        sellerType: "public_or_diy",
        sellerName: "CBJ Capital Transit ($2 Public Bus)",
        actualOperatorName: "City and Borough of Juneau",
        label: "CBJ Capital Transit bus schedule (1.5-mile walk from stop)",
        url: "https://juneaucapitaltransit.org/",
        supportedContextParams: [],
        relationshipDisclosure: "Municipal public transit link — noncommercial.",
        isCommercialPartner: false,
        commissionInfluenceOnRanking: 0,
      },
    ],
  },
];

function parseHhmmToMinutes(hhmm: string): number {
  const [hh, mm] = hhmm.split(":").map((part) => Number(part));
  return hh * 60 + mm;
}

export function computeJuneauOptionTiming(
  option: CandidateOption,
  input: JuneauHelicopterEngineInput,
): TimingCalculationResult {
  const arrivalMin = parseHhmmToMinutes(input.arrivalTime);
  const allAboardMin = parseHhmmToMinutes(input.allAboardTime);
  const availableWindowMinutes = Math.max(0, allAboardMin - arrivalMin);
  const dockTransfer =
    JUNEAU_DOCK_TRANSFER_TABLE[input.arrivalDock] ?? JUNEAU_DOCK_TRANSFER_TABLE.UNKNOWN;
  const transferEachWay =
    option.optionId === "jnu-backup-auke-bay-whale"
      ? dockTransfer.minutesToAukeBay
      : dockTransfer.minutesToJnuAirport;
  const transferMinutesRoundTrip = transferEachWay * 2;
  const checkInLeadMinutes = option.durationMinutes.checkInLead;
  const activityMinutes = option.durationMinutes.activity;
  const returnBufferMinutes = input.returnBufferMinutes;
  const requiredTotalMinutes =
    transferMinutesRoundTrip + checkInLeadMinutes + activityMinutes + returnBufferMinutes;
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
        ? `Fits your ${availableWindowMinutes}-minute port window with ${netSlackMinutes} minutes of extra slack above your ${returnBufferMinutes}-minute return buffer.`
        : `Requires ${requiredTotalMinutes} total minutes (including ${transferMinutesRoundTrip}m dock transfer and ${returnBufferMinutes}m buffer), exceeding your ${availableWindowMinutes}-minute port window by ${Math.abs(netSlackMinutes)} minutes.`,
  };
}

export const JUNEAU_HELICOPTER_HARD_CONSTRAINTS: HardConstraintRule<JuneauHelicopterEngineInput>[] = [
  {
    ruleId: "hc-jnu-operating-season",
    label: "Operating season & snowpack availability",
    description:
      "Commercial glacier helicopters operate May–September; upper-glacier dog sled camps operate May–August while snowpack lasts.",
    sourceIds: ["src-usfs-mendenhall-permits-2026", "src-temsco-juneau-ops-2026"],
    evaluate: (option, input) => {
      const month = input.date ? Number(input.date.slice(5, 7)) : input.travelMonth;
      if (!option.operatingMonths.includes(month)) {
        return {
          passed: false,
          eliminationReason: `${option.shortLabel} does not operate in month ${month} (operating months: ${option.operatingMonths.join(", ")}).`,
          whatInputChangeWouldAlterResult:
            option.optionId === "jnu-heli-dogsled-camp"
              ? "Select a travel date between May and August when upper-glacier dog sled snow camps are open."
              : "Select a travel date between May and September for commercial Juneau helicopter operations.",
        };
      }
      return { passed: true };
    },
  },
  {
    ruleId: "hc-jnu-port-window-and-buffer",
    label: "Port window & ship return buffer",
    description:
      "Total excursion duration plus dock-specific ground transfers and check-in must fit inside arrival-to-all-aboard minus your required return buffer.",
    sourceIds: ["src-cbj-docks-harbors-2026", "src-temsco-juneau-ops-2026"],
    evaluate: (option, input, context) => {
      const timing = context.computeTimingForOption(option);
      if (timing.netSlackMinutes !== null && timing.netSlackMinutes < 0) {
        return {
          passed: false,
          eliminationReason: timing.summary,
          whatInputChangeWouldAlterResult: `Increase port window by at least ${Math.abs(timing.netSlackMinutes)} minutes or choose a shorter single-activity excursion.`,
        };
      }

      const unknownDockWarning: UnknownOrStaleFact | undefined =
        input.arrivalDock === "UNKNOWN"
          ? {
              factId: `fact-jnu-unknown-dock-${option.optionId}`,
              optionId: option.optionId,
              category: "missing_traveler_input",
              summary:
                "Dock unknown; transfer allowance is a conservative 35-minute each-way estimate.",
              impactOnDecision:
                "Confirm whether your ship berths Downtown (CT/FKL/AS, ~25m) or tenders/berths at AJ (~35–45m).",
              sourceIds: ["src-cbj-docks-harbors-2026"],
            }
          : undefined;

      return {
        passed: true,
        unknownOrStaleWarning: unknownDockWarning,
        decisionChangingWarning:
          timing.netSlackMinutes !== null && timing.netSlackMinutes < 30
            ? `Tight schedule margin: only ${timing.netSlackMinutes} minutes of slack above your ${input.returnBufferMinutes}-minute buffer.`
            : undefined,
      };
    },
  },
  {
    ruleId: "hc-jnu-mobility-and-accessibility",
    label: "Mobility, crampon hike & wheelchair boarding compatibility",
    description:
      "Strenuous 2-hour crampon treks are eliminated for limited mobility or step-free wheelchair needs; unconfirmed helicopter boarding is flagged.",
    sourceIds: [
      "src-northstar-trekking-2026",
      "src-allen-marine-auke-bay-2026",
      "src-usfs-mendenhall-permits-2026",
    ],
    evaluate: (option, input) => {
      if (input.mobilityLevel === "step_free_wheelchair") {
        if (option.accessibilityProfile.confirmationStatus === "not_accessible") {
          return {
            passed: false,
            eliminationReason: `${option.shortLabel} is not wheelchair accessible (${option.accessibilityProfile.walkingAndBoardingRequirement}).`,
            whatInputChangeWouldAlterResult:
              "Select standard mobility or choose an accessible option such as Auke Bay Whale Watching or the USFS Mendenhall Visitor Center.",
          };
        }
        if (
          option.accessibilityProfile.confirmationStatus ===
          "operator_confirmation_required"
        ) {
          return {
            passed: true,
            unknownOrStaleWarning: {
              factId: `fact-jnu-accessibility-confirm-${option.optionId}`,
              optionId: option.optionId,
              category: "operator_confirmation_required",
              summary: `${option.shortLabel}: ${option.accessibilityProfile.note}`,
              impactOnDecision:
                "Step-free lift/ramp transfer into helicopter cabins must be confirmed directly with the operator for your specific departure.",
              sourceIds: option.sourceIds,
            },
            decisionChangingWarning: `Operator accessibility confirmation required for ${option.shortLabel}.`,
          };
        }
      }

      if (
        input.mobilityLevel === "limited_mobility" &&
        !option.accessibilityProfile.limitedMobilitySupported
      ) {
        return {
          passed: false,
          eliminationReason: `${option.shortLabel} requires a 2-hour crampon hike on sloped glacier ice and is incompatible with limited-mobility preferences.`,
          whatInputChangeWouldAlterResult:
            "Choose a standard 20-minute glacier landing (TEMSCO or Coastal) or surface alternative.",
        };
      }

      return { passed: true };
    },
  },
  {
    ruleId: "hc-jnu-minimum-age",
    label: "Minimum child age rule",
    description:
      "NorthStar Trekking Glacier Walkabout enforces a minimum age of 7 years.",
    sourceIds: ["src-northstar-trekking-2026"],
    evaluate: (option, input) => {
      if (
        input.youngestChildAgeYears !== null &&
        option.minimumAgeYears !== null &&
        input.youngestChildAgeYears < option.minimumAgeYears
      ) {
        return {
          passed: false,
          eliminationReason: `${option.shortLabel} requires a minimum age of ${option.minimumAgeYears}+ years (youngest traveler entered: ${input.youngestChildAgeYears}).`,
          whatInputChangeWouldAlterResult: `Select an option accepting age ${input.youngestChildAgeYears} (e.g., TEMSCO, Coastal, Auke Bay Whale, or USFS Visitor Center).`,
        };
      }
      return { passed: true };
    },
  },
  {
    ruleId: "hc-jnu-budget-ceiling",
    label: "Per-person budget ceiling (including FAA weight surcharge when applicable)",
    description:
      "Eliminates options whose minimum published per-person price plus any mandatory >250 lb FAA balance surcharge exceeds the traveler's budget ceiling.",
    sourceIds: [
      "src-temsco-juneau-ops-2026",
      "src-coastal-helicopters-2026",
      "src-northstar-trekking-2026",
    ],
    evaluate: (option, input) => {
      const isHeli = option.optionId.startsWith("jnu-heli-");
      const weightSurcharge =
        isHeli && input.passengerWeightAbove250Lbs ? 175 : 0;
      const effectiveMinPrice = option.indicativePriceUsd.min + weightSurcharge;

      if (
        input.budgetMaxPerPersonUsd !== null &&
        effectiveMinPrice > input.budgetMaxPerPersonUsd
      ) {
        return {
          passed: false,
          eliminationReason: `${option.shortLabel} starts at $${option.indicativePriceUsd.min}${weightSurcharge > 0 ? ` + ~$${weightSurcharge} FAA >250 lb weight surcharge ($${effectiveMinPrice} effective)` : ""}, which exceeds your $${input.budgetMaxPerPersonUsd} budget ceiling.`,
          whatInputChangeWouldAlterResult: `Increase per-person budget to at least $${effectiveMinPrice} or consider Auke Bay Whale Watching ($169+) or USFS Mendenhall ($9–$60).`,
        };
      }

      if (isHeli && input.passengerWeightAbove250Lbs) {
        return {
          passed: true,
          decisionChangingWarning:
            "FAA weight-and-balance policy: TEMSCO, Coastal, and NorthStar assess a $150–$215 comfort/balance surcharge for travelers over 250–260 lbs clothed.",
        };
      }

      return { passed: true };
    },
  },
  {
    ruleId: "hc-jnu-schedule-verification-horizon",
    label: "Departure schedule confirmation horizon",
    description:
      "Flags unconfirmed operator departure times when travel date is missing or beyond the verified 2026 schedule window.",
    sourceIds: ["src-temsco-juneau-ops-2026", "src-coastal-helicopters-2026"],
    evaluate: (option, input) => {
      if (
        input.date &&
        option.scheduleVerifiedThroughDate &&
        input.date > option.scheduleVerifiedThroughDate
      ) {
        return {
          passed: true,
          unknownOrStaleWarning: {
            factId: `fact-jnu-future-schedule-${option.optionId}`,
            optionId: option.optionId,
            category: "unverified_schedule_or_availability",
            summary: `Departure schedule still needs confirmation for ${input.date} (verified through ${option.scheduleVerifiedThroughDate}).`,
            impactOnDecision:
              "Time-budget math is valid, but exact flight departure slots for future seasons must be confirmed with the operator.",
            sourceIds: option.sourceIds,
          },
        };
      }
      return { passed: true };
    },
  },
];

export const JUNEAU_HELICOPTER_PREFERENCE_RULES: PreferenceRule<JuneauHelicopterEngineInput>[] = [
  {
    ruleId: "pref-jnu-weather-resilience",
    label: "Ceiling & VFR weather scenario alignment",
    maxPoints: 40,
    evaluate: (option, input) => {
      const isHeli = option.optionId.startsWith("jnu-heli-");
      if (input.weatherCondition === "low_ceiling_under_800ft") {
        if (!isHeli) {
          return {
            points: 40,
            reason:
              "Under a low ceiling (<800 ft) scenario assumption, surface and marine excursions operate reliably while Icefield flights face high VFR hold risk.",
          };
        }
        return {
          points: 5,
          reason:
            "Scenario assumption (<800 ft ceiling) carries high VFR aviation hold risk; keep a surface backup ready.",
        };
      }

      if (input.weatherCondition === "clear_vfr" && isHeli) {
        return {
          points: 35,
          reason:
            "Clear VFR scenario assumption favors glacier helicopter landings on the Juneau Icefield.",
        };
      }

      if (option.optionId === "jnu-heli-coastal-icefield") {
        return {
          points: 28,
          reason:
            "Multi-valley routing (Herbert, Taku, Norris) provides added flexibility under marginal 1,200 ft ceilings.",
        };
      }

      return {
        points: isHeli ? 25 : 20,
        reason: "Viable under current weather scenario assumption.",
      };
    },
  },
  {
    ruleId: "pref-jnu-format-match",
    label: "Excursion format & activity depth preference",
    maxPoints: 35,
    evaluate: (option, input) => {
      if (input.goalMode === "budget_or_diy" && option.optionKind === "public_or_diy") {
        return {
          points: 35,
          reason: "Matches budget / self-guided public transit & USFS priority.",
        };
      }
      if (
        input.formatPreference === "standard_glacier_walk" &&
        (option.optionId === "jnu-heli-temsco-mendenhall" ||
          option.optionId === "jnu-heli-coastal-icefield")
      ) {
        return {
          points: 35,
          reason: "Matches standard helicopter + guided glacier walk format.",
        };
      }
      if (
        input.formatPreference === "extended_trek_walkabout" &&
        option.optionId === "jnu-heli-northstar-walkabout"
      ) {
        return {
          points: 35,
          reason: "Matches extended 2-hour guided crampon glacier trek preference.",
        };
      }
      if (
        input.formatPreference === "glacier_dogsled_camp" &&
        option.optionId === "jnu-heli-dogsled-camp"
      ) {
        return {
          points: 35,
          reason: "Matches upper-glacier dog sled camp preference.",
        };
      }
      if (
        input.formatPreference === "two_activity_combo" &&
        option.optionId === "jnu-heli-mendenhall-combo"
      ) {
        return {
          points: 35,
          reason: "Satisfies two-activity combination preference (Helicopter + Mendenhall Visitor Center).",
        };
      }
      if (
        input.formatPreference === "any" &&
        option.optionId === "jnu-heli-temsco-mendenhall"
      ) {
        return {
          points: 30,
          reason: "Primary USFS-permitted Mendenhall Glacier landing with balanced port-day timing.",
        };
      }
      return {
        points: 15,
        reason:
          input.formatPreference === "two_activity_combo"
            ? "Fits your time budget as a single-activity alternative."
            : "Viable alternative format.",
      };
    },
  },
  {
    ruleId: "pref-jnu-schedule-cushion",
    label: "Port return schedule cushion",
    maxPoints: 25,
    evaluate: (option, _input, context) => {
      const timing = context.computeTimingForOption(option);
      const slack = timing.netSlackMinutes ?? 0;
      if (slack >= 90) {
        return {
          points: 25,
          reason: `Generous ${slack}-minute cushion above your return buffer.`,
        };
      }
      if (slack >= 45) {
        return {
          points: 18,
          reason: `Comfortable ${slack}-minute cushion above your return buffer.`,
        };
      }
      return {
        points: 10,
        reason: `Fits port window with ${slack} minutes of extra slack.`,
      };
    },
  },
];

export function evaluateJuneauHelicopterParityWithPortDay(
  input: JuneauHelicopterEngineInput,
): JuneauPortDayEvaluationResult {
  const mappedDock: JuneauPortDayScenarioInput["arrivalDock"] =
    input.arrivalDock === "FKL"
      ? "franklin_dock"
      : input.arrivalDock === "AJ"
        ? "aj_dock"
        : input.arrivalDock === "TENDER_FKL"
          ? "tender_anchor"
          : input.arrivalDock === "UNKNOWN"
            ? "unknown_dock"
            : "downtown_walkoff";

  const mappedWeather: JuneauPortDayScenarioInput["weatherCondition"] =
    input.weatherCondition === "clear_vfr"
      ? "clear_high_ceiling"
      : input.weatherCondition === "low_ceiling_under_800ft"
        ? "low_ceiling_rain_fog"
        : "unknown_or_forecast_only";

  const mappedMobility: JuneauPortDayScenarioInput["mobilityLevel"] =
    input.mobilityLevel === "step_free_wheelchair"
      ? "step_free_wheelchair"
      : input.mobilityLevel === "limited_mobility"
        ? "light_walking_1mi"
        : "active_walking_3mi";

  const mappedGoal: JuneauPortDayScenarioInput["goalMode"] =
    input.formatPreference === "two_activity_combo"
      ? "two_activity_combo"
      : input.goalMode === "budget_or_diy"
        ? "public_or_free_only"
        : "single_activity_focus";

  const portDayInput: JuneauPortDayScenarioInput = {
    shipArrivalTime: input.arrivalTime,
    allAboardTime: input.allAboardTime,
    arrivalDock: mappedDock,
    goalMode: mappedGoal,
    travelMonth: input.travelMonth,
    travelDate: input.date,
    partySize: input.partySize,
    mobilityLevel: mappedMobility,
    returnBufferMinutes: input.returnBufferMinutes,
    weatherCondition: mappedWeather,
    budgetMaxPerPersonUsd: input.budgetMaxPerPersonUsd,
  };
  return evaluateJuneauPortDayScenario(portDayInput);
}

export const JUNEAU_HELICOPTER_DECISION_ENGINE: DecisionEngineDefinition<JuneauHelicopterEngineInput> =
  {
    engineId: "juneau-helicopter-tours",
    version: "2.0.0",
    slug: "helicopter-tours",
    canonicalPath: "/juneau/helicopter-tours",
    canonicalUrl: "https://destinationcommandcenter.com/juneau/helicopter-tours",
    title: "Juneau Helicopter Tours & Glacier Landing Decision Engine",
    destinationName: "Juneau, Alaska",
    categoryName: "Helicopter Tours & Glacier Landings",
    heroQuestion:
      "Which Juneau glacier helicopter tour — or weather-resilient port-day alternative — actually fits your ship window, dock, mobility, and ceiling risk?",
    summaryDescription:
      "Evidence-backed decision engine comparing USFS-permitted Juneau helicopter operators (TEMSCO, Coastal, NorthStar), upper-snowpack dog sled camps, and low-ceiling surface backups.",
    referenceGuide: {
      importantDecisionFactors: [
        {
          title: "Dock-Specific Ground Transfer Windows",
          detail:
            "Downtown docks (CT, FKL, AS) require ~25 minutes each way to Juneau Airport (JNU), while AJ Dock requires ~35 minutes and Tender to Franklin requires ~45 minutes including launch queues.",
          sourceIds: ["src-cbj-docks-harbors-2026"],
        },
        {
          title: "USFS Tongass Permit Separation by Operator",
          detail:
            "TEMSCO holds the primary Mendenhall Glacier landing permit, Coastal routes across Herbert/Taku/Norris glaciers, and NorthStar specializes in 2-to-3 hour guided crampon treks.",
          sourceIds: [
            "src-usfs-mendenhall-permits-2026",
            "src-temsco-juneau-ops-2026",
            "src-coastal-helicopters-2026",
            "src-northstar-trekking-2026",
          ],
        },
        {
          title: "VFR Cloud Ceiling & Upper-Elevation Dog Sled Risk",
          detail:
            "Glacier dog sled camps sit at 3,000–4,000+ ft on persistent snowpack (May–August) and experience higher cloud-ceiling cancellation rates than lower-glacier ice landings.",
          sourceIds: ["src-faa-pajn-weather-cams-2026", "src-temsco-juneau-ops-2026"],
        },
        {
          title: "FAA 250–260 lb Weight Balance Surcharge",
          detail:
            "All three Juneau helicopter operators require accurate clothed weight at booking and assess a $150–$215 comfort/balance seat surcharge above 250–260 lbs.",
          sourceIds: [
            "src-temsco-juneau-ops-2026",
            "src-coastal-helicopters-2026",
            "src-northstar-trekking-2026",
          ],
        },
      ],
      experienceAndVesselTypes: [
        {
          typeName: "Standard Glacier Landing + 20-Min Guided Ice Walk (TEMSCO / Coastal)",
          capacityAndStability: "6 passengers per AStar AS350 / Airbus H125 helicopter",
          bestFor: "First-time glacier flyers wanting aerial views and 20 minutes on the ice within a 3.25-hour window",
          limitations: "Brief surface time; subject to VFR ceiling holds",
          sourceIds: ["src-temsco-juneau-ops-2026", "src-coastal-helicopters-2026"],
        },
        {
          typeName: "Extended 2-Hour Mountaineering Crampon Trek (NorthStar)",
          capacityAndStability: "6 passengers per helicopter + 2 full hours on the ice with guide",
          bestFor: "Active hikers (ages 7+) wanting 2 hours exploring crevasses and blue ice features",
          limitations: "Requires 4.25–4.5 hours dock-to-dock and steady hiking ability",
          sourceIds: ["src-northstar-trekking-2026"],
        },
        {
          typeName: "Upper-Glacier Snowpack Dog Sled Camp (TEMSCO / Coastal)",
          capacityAndStability: "Helicopter flight to 3,500+ ft snow camp + 1 hour with husky team",
          bestFor: "Families and bucket-list travelers visiting May through August",
          limitations: "Highest cloud-ceiling cancellation risk and $679–$749+ per-person tariff; closed in September",
          sourceIds: ["src-temsco-juneau-ops-2026", "src-coastal-helicopters-2026"],
        },
        {
          typeName: "Low-Ceiling Surface Backups (Auke Bay Whale Catamaran & USFS Visitor Center)",
          capacityAndStability: "Heated cabin catamaran or paved USFS trails",
          bestFor: "Low-ceiling (<800 ft) days, step-free wheelchair accessibility, or budget-conscious travelers",
          limitations: "Views Mendenhall from water or valley floor rather than landing on the upper ice",
          sourceIds: ["src-allen-marine-auke-bay-2026", "src-usfs-mendenhall-permits-2026"],
        },
      ],
      departureLocations: [
        {
          islandOrRegion: "Juneau Airport Corridor",
          harborOrArea: "Juneau International Airport (JNU) Heliports",
          logisticsNote:
            "TEMSCO, Coastal, and NorthStar all stage from JNU (~9 miles north of downtown docks; 25–45 min transfer depending on dock/tender).",
          sourceIds: ["src-cbj-docks-harbors-2026"],
        },
        {
          islandOrRegion: "Auke Bay",
          harborOrArea: "Statter Harbor (Auke Bay)",
          logisticsNote:
            "Staging harbor for whale watching catamarans (~25–45 min transfer from cruise docks).",
          sourceIds: ["src-allen-marine-auke-bay-2026"],
        },
        {
          islandOrRegion: "Mendenhall Valley",
          harborOrArea: "USFS Mendenhall Glacier Visitor Center",
          logisticsNote:
            "Direct express shuttles drop at the Visitor Center plaza; $2 Capital Transit bus stops 1.5 miles away at Glacier Spur & Mendenhall Loop.",
          sourceIds: ["src-usfs-mendenhall-permits-2026", "src-cbj-capital-transit-2026"],
        },
      ],
      commonTradeoffs: [
        {
          tradeoff: "20-Minute Ice Walk (TEMSCO/Coastal) vs. 2-Hour Crampon Trek (NorthStar)",
          explanation:
            "Standard landings cost ~$140 less and save 75 minutes of port time, while NorthStar provides 4x more time hiking on the glacier with crampons.",
        },
        {
          tradeoff: "Upper Snowpack Dog Sledding vs. Lower-Ice Landing",
          explanation:
            "Dog sled camps sit higher in the cloud deck (3,000–4,000 ft) and cancel more often on marginal ceiling days than lower glacier landings (~1,500 ft).",
        },
      ],
      operationalDependencies: [
        {
          dependency: "FAA VFR Ceiling & Visibility Clearance (PAJN)",
          impact:
            "Pilots require visual flight clearance into the Juneau Icefield; ceilings under 800 ft typically ground helicopter departures with full refunds.",
          sourceIds: ["src-faa-pajn-weather-cams-2026"],
        },
        {
          dependency: "Snowpack Persistence for Dog Camps",
          impact:
            "Glacier dog sled camps close by late August when summer melt exposes bare ice.",
          sourceIds: ["src-temsco-juneau-ops-2026"],
        },
      ],
      methodologySteps: [
        "1. Compute usable port window from ship arrival to all-aboard minus your required return buffer and dock-specific JNU transfer times.",
        "2. Apply hard constraints first: operating month, net port slack, minimum child age, mobility/wheelchair compatibility, and budget ceiling (including >250 lb FAA balance surcharge).",
        "3. Rank only viable options by VFR ceiling scenario resilience, preferred glacier format, and schedule cushion — with zero commercial weight.",
        "4. Attach parity calculations from the Juneau Port-Day Engine and disclose direct operator, DCC-owned specialist (Juneau Flight Deck / Last Frontier Shore Excursions), and public USFS links.",
      ],
    },
    questions: JUNEAU_HELICOPTER_QUESTIONS,
    answerSchema: JUNEAU_HELICOPTER_ANSWER_SCHEMA,
    defaultExampleInput: JUNEAU_HELICOPTER_DEFAULT_EXAMPLE_INPUT,
    comparisonDimensions: JUNEAU_HELICOPTER_COMPARISON_DIMENSIONS,
    candidateOptions: JUNEAU_HELICOPTER_CANDIDATE_OPTIONS,
    hardConstraintRules: JUNEAU_HELICOPTER_HARD_CONSTRAINTS,
    preferenceRules: JUNEAU_HELICOPTER_PREFERENCE_RULES,
    evidenceClaims: JUNEAU_HELICOPTER_CLAIMS,
    sourceRecords: JUNEAU_HELICOPTER_SOURCES,
    computeTimingForOption: computeJuneauOptionTiming,
    isExampleScenarioDetector: (rawInput, normalizedInput) => {
      const rawObj =
        typeof rawInput === "object" && rawInput !== null
          ? (rawInput as Record<string, unknown>)
          : {};
      const hasExplicitDate =
        typeof rawObj.date === "string" && rawObj.date.trim().length > 0;

      if (!hasExplicitDate || !normalizedInput.date) {
        return {
          isExample: true,
          banner:
            "Example Scenario Shown (08:00–16:30 at Cruise Terminal CT in July): Enter your actual sailing date and dock above to get a personalized port-day verdict.",
          missingInputFacts: [
            {
              factId: "fact-jnu-missing-travel-date",
              optionId: null,
              category: "missing_traveler_input",
              summary:
                "Travel date not yet entered — displaying a labeled mid-July example scenario.",
              impactOnDecision:
                "Departure schedule availability and dog-sled snowpack status require your actual sailing date.",
              sourceIds: ["src-temsco-juneau-ops-2026"],
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
    customizeBookingDestinations: (option, input, isExample) => {
      return option.bookingDestinations.map((dest) => {
        if (dest.supportedContextParams.length === 0) {
          return dest;
        }
        const url = new URL(dest.url);
        url.searchParams.set("port", "juneau");
        url.searchParams.set(
          "category",
          option.optionId === "jnu-backup-auke-bay-whale"
            ? "whale-watching"
            : "helicopter-tours",
        );
        url.searchParams.set("corridor", "juneau-heli-glacier");
        if (input.arrivalDock !== "UNKNOWN") {
          url.searchParams.set("dock", input.arrivalDock);
        }
        if (!isExample && input.date) {
          url.searchParams.set("date", input.date);
        }
        return {
          ...dest,
          url: url.toString(),
        };
      });
    },
    evaluate: (
      rawInput: unknown,
      options?: DecisionEvaluateOptions,
    ): DecisionResult<JuneauHelicopterEngineInput> => {
      const result = evaluateDecisionEngine(
        JUNEAU_HELICOPTER_DECISION_ENGINE,
        rawInput,
        options,
      );
      const juneauPortDayParity = evaluateJuneauHelicopterParityWithPortDay(
        result.normalizedAnswers,
      );
      return {
        ...result,
        categorySpecificMeta: {
          juneauPortDayParity,
        },
      };
    },
  };
