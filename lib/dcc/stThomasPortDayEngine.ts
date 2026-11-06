/**
 * St. Thomas (USVI) Port-Day Decision Engine & Actual-Trip Checker
 *
 * Answers:
 * "Which St. Thomas excursions fit my sailing from Havensight (WICO) versus
 * Crown Bay, and when does a St. John ferry or beach day fit my ship window?"
 *
 * Enforces:
 * 1. Public answer comparing Havensight (WICO), Crown Bay (AMSS/AMNS), and
 *    Charlotte Amalie Inner/Outer Harbor tender anchorages (IANCH/OANCH).
 * 2. Deterministic trip-window math using the traveler's actual sailing date,
 *    ship arrival/all-aboard times, dock, party ages, and mobility level.
 * 3. Free / self-guided options ($0 Charlotte Amalie Historic District walk and
 *    $0-admission VIPA Lindbergh Bay / $7 Magens Bay Authority park pass).
 * 4. Explicit `unknown` markers for unsupported or unconfirmed operator/port facts.
 * 5. Zero commercial ranking influence (`commercialWeightApplied: 0`).
 */

export type StThomasArrivalDock =
  | "havensight_wico"
  | "crown_bay"
  | "charlotte_amalie_tender"
  | "unknown_dock";

export type StThomasExcursionFocus =
  | "any_excursion_or_beach"
  | "st_john_ferry_or_catamaran"
  | "mangrove_lagoon_kayak_snorkel"
  | "magens_or_lindbergh_beach"
  | "free_or_self_guided_walk";

export type StThomasMobilityLevel =
  | "unspecified"
  | "step_free_wheelchair"
  | "light_walking"
  | "active_stairs_and_paddle";

export type StThomasOptionCategory =
  | "free_or_self_guided"
  | "guided_eco_or_marine"
  | "two_island_ferry_excursion";

export type StThomasOptionFitStatus =
  | "fits_comfortably"
  | "tight_buffer"
  | "qualified_needs_confirmation"
  | "does_not_fit";

export interface StThomasPortDayScenarioInput {
  travelDate?: string | null; // YYYY-MM-DD in America/St_Thomas (AST, UTC-04:00 year-round)
  shipArrivalTime: string; // HH:MM
  allAboardTime: string; // HH:MM
  arrivalDock: StThomasArrivalDock;
  excursionFocus: StThomasExcursionFocus;
  adults?: number;
  childAges?: number[];
  mobilityLevel?: StThomasMobilityLevel;
  returnBufferMinutes?: number; // default 60 min (90 min minimum enforced for St. John ferry)
}

export interface StThomasUnknownFact {
  factId: string;
  status: "unknown";
  category:
    | "missing_traveler_input"
    | "unverified_schedule_or_tariff"
    | "operator_confirmation_required"
    | "source_change_pending_human_review";
  summary: string;
  impactOnDecision: string;
  sourceUrl: string | null;
  checkedOn: string;
}

export interface StThomasTimingBreakdown {
  timeZone: "America/St_Thomas";
  utcOffsetString: "-04:00";
  shipArrivalTime: string;
  allAboardTime: string;
  totalPortWindowMinutes: number;
  disembarkationMinutes: number;
  checkInLeadMinutes: number;
  outboundTransferMinutes: number;
  activityDurationMinutes: number;
  returnTransferMinutes: number;
  requiredReturnBufferMinutes: number;
  totalRequiredMinutes: number;
  netMarginMinutes: number;
  earliestShoreReadyTime: string;
  estimatedBackAtPierTime: string;
  targetAllAboardCutoffTime: string;
}

export interface StThomasEvaluatedOption {
  optionId: string;
  title: string;
  shortLabel: string;
  category: StThomasOptionCategory;
  isFreeOrSelfGuided: boolean;
  fitStatus: StThomasOptionFitStatus;
  fitBadgeLabel: string;
  conciseVerdict: string;
  dockComparisonNote: string;
  timing: StThomasTimingBreakdown;
  estimatedCostPerAdultUsd: number;
  estimatedCostTotalPartyUsd: number;
  costBasisSummary: string;
  accessibilitySummary: string;
  accessibilityCompatible: boolean;
  supportingSources: Array<{
    organization: string;
    title: string;
    url: string;
    checkedOn: string;
  }>;
  unknownFactsForOption: StThomasUnknownFact[];
  bookingHandoffUrl: string | null;
  bookingChannelLabel: string;
  commercialWeightApplied: 0;
}

export interface StThomasPublicAnswerSummary {
  question: string;
  directAnswer: string;
  dockRules: Record<
    StThomasArrivalDock,
    {
      dockCode: string;
      officialName: string;
      operatorOrAuthority: string;
      walkabilityToDowntown: string;
      bestFitExcursions: string[];
      watchouts: string[];
    }
  >;
  freeAndSelfGuidedSummary: string;
}

export interface StThomasPortDayEvaluationResult {
  portSlug: "st-thomas";
  timeZone: "America/St_Thomas";
  evaluatedInput: Required<StThomasPortDayScenarioInput>;
  isExampleScenario: boolean;
  dayOfWeekLabel: string;
  isWeekdaySailing: boolean;
  publicAnswer: StThomasPublicAnswerSummary;
  conciseVerdict: string;
  recommendedOptions: StThomasEvaluatedOption[];
  eliminatedOptions: StThomasEvaluatedOption[];
  allOptions: StThomasEvaluatedOption[];
  unknownFacts: StThomasUnknownFact[];
  commercialNeutrality: {
    commercialWeightAppliedToRanking: 0;
    includesFreeOrSelfGuidedOption: true;
    humanFactApprovalRequired: true;
  };
}

export const DEFAULT_ST_THOMAS_SCENARIO_INPUT: Required<StThomasPortDayScenarioInput> =
  {
    travelDate: "2026-11-18",
    shipArrivalTime: "08:00",
    allAboardTime: "16:30",
    arrivalDock: "havensight_wico",
    excursionFocus: "any_excursion_or_beach",
    adults: 2,
    childAges: [],
    mobilityLevel: "unspecified",
    returnBufferMinutes: 60,
  };

export const ST_THOMAS_PUBLIC_ANSWER_SUMMARY: StThomasPublicAnswerSummary = {
  question:
    "Which St. Thomas excursions fit my sailing from Havensight (WICO) versus Crown Bay, and when does a St. John ferry or beach day fit my ship window?",
  directAnswer:
    "Your St. Thomas cruise berth changes East End transfer times by 15–20 minutes each way and changes which low-cost beach or walking option works best. Ships at Havensight (WICO) sit 1.5 miles east of Historic Charlotte Amalie (walkable along the flat Veterans Drive waterfront promenade) and are 20–25 minutes from Red Hook (St. John ferry) and Mangrove Lagoon (VI Ecotours kayak/snorkel). Ships at Crown Bay (Austin 'Babe' Monsanto Marine Terminal, AMSS/AMNS) dock 1.7 miles west of downtown in Sub Base: Crown Bay is 5–8 minutes by taxi from VIPA's free-entry Lindbergh Bay (Emerald Beach), but adds 35–45 minutes of cross-island traffic to reach Red Hook. Crucially, VIPA's Crown Bay -> Cruz Bay (St. John) ferry only departs at 2:15 PM (Sat/Sun), 3:30 PM, and 5:30 PM, so morning Crown Bay cruise passengers cannot use the Crown Bay ferry to visit St. John and need at least a 6.5–7.0 hour port window to cross via Red Hook.",
  dockRules: {
    havensight_wico: {
      dockCode: "WICO",
      officialName: "West Indian Company Dock (Havensight)",
      operatorOrAuthority: "The West Indian Company Limited (WICO)",
      walkabilityToDowntown:
        "Walkable ~1.5 miles (30 min each way) along the flat Veterans Drive harbourfront sidewalk into Historic Downtown Charlotte Amalie, or 8–12 min shared safari taxi.",
      bestFitExcursions: [
        "VI Ecotours Cas Cay Kayak, Hike & Snorkel at Mangrove Lagoon (6526 Estate Nadir — ~20–25 min taxi each way)",
        "Self-Guided Historic Charlotte Amalie, Fort Christian Exterior & 99 Steps Walk ($0 walking route)",
        "Magens Bay Park Beach Day ($7/adult, kids <12 free, ~25 min safari taxi each way)",
        "St. John via Red Hook Passenger Ferry (only when total port window is >= 6.5 hours)",
      ],
      watchouts: [
        "Afternoon return traffic along Veterans Drive between 2:30 PM and 4:30 PM can add 15–20 minutes returning from downtown or Magens Bay.",
      ],
    },
    crown_bay: {
      dockCode: "AMSS / AMNS",
      officialName:
        "Austin 'Babe' Monsanto Marine Terminal (Crown Bay Cruise Dock)",
      operatorOrAuthority: "Virgin Islands Port Authority (VIPA)",
      walkabilityToDowntown:
        "Not a shaded leisure walk to Historic Charlotte Amalie (~1.7 miles along industrial Sub Base / Harwood Highway); budget a 10–15 min shared safari taxi each way into downtown.",
      bestFitExcursions: [
        "Self-Guided Lindbergh Bay Park & Beach / Emerald Beach ($0 beach entry, ~5–8 min taxi from Crown Bay)",
        "Half-Day Buck Island / Turtle Cove Catamaran Sail & Snorkel",
        "Magens Bay Park Beach Day ($7/adult, kids <12 free, ~30–35 min safari taxi each way)",
      ],
      watchouts: [
        "Do NOT rely on the Crown Bay -> Cruz Bay (St. John) ferry for a daytime port call: VIPA's published schedule departs Crown Bay only at 2:15 PM (weekends), 3:30 PM, and 5:30 PM.",
        "Reaching Red Hook or Mangrove Lagoon from Crown Bay requires crossing through Charlotte Amalie bottleneck traffic (~35–45 min each way).",
      ],
    },
    charlotte_amalie_tender: {
      dockCode: "IANCH / OANCH",
      officialName: "Charlotte Amalie Harbor Inner / Outer Anchorage (Tender)",
      operatorOrAuthority: "Virgin Islands Port Authority (VIPA)",
      walkabilityToDowntown:
        "Step-off direct onto the downtown Charlotte Amalie waterfront apron (0 min walk to Emancipation Garden, Fort Christian, and 99 Steps).",
      bestFitExcursions: [
        "Free / Self-Guided Historic Charlotte Amalie, Fort Christian & 99 Steps Walk ($0 right off the tender pier)",
        "Magens Bay Park Beach Day (~20–25 min safari taxi from downtown)",
      ],
      watchouts: [
        "Budget 30–40 minutes each way for tender ticket queues and boat transit before your shore excursion check-in.",
      ],
    },
    unknown_dock: {
      dockCode: "UNKNOWN",
      officialName: "Unconfirmed St. Thomas Berth (WICO vs. Crown Bay vs. Tender)",
      operatorOrAuthority: "VIPA / WICO (Check Cruise Line Daily Program)",
      walkabilityToDowntown:
        "Unknown until berth is confirmed; planner applies conservative Crown Bay / tender transfer allowances so you do not miss all-aboard.",
      bestFitExcursions: [
        "Magens Bay or Lindbergh Bay Self-Guided Beach Half-Day",
        "Half-Day Catamaran Turtle Snorkel (180–240 min)",
      ],
      watchouts: [
        "Verify whether your ship docks at WICO (Havensight) or Crown Bay (AMSS/AMNS) on VIPA's seaport schedule before booking East End or St. John transfers.",
      ],
    },
  },
  freeAndSelfGuidedSummary:
    "Two free/low-cost self-guided paths work without a commercial tour: (1) the $0 Historic Charlotte Amalie Waterfront, Fort Christian Exterior, Emancipation Garden & 99 Steps walking loop (walkable from WICO or tender; short safari taxi from Crown Bay), and (2) a self-guided beach transfer to VIPA's free-entry Lindbergh Bay (Emerald Beach, 5–8 min from Crown Bay) or Magens Bay Authority Park ($7/adult non-resident, kids under 12 free, open 7:00 AM–5:30 PM).",
};

function parseHmToMinutes(hm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec((hm || "").trim());
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return hh * 60 + mm;
}

function formatMinutesToHm(totalMin: number): string {
  const normalized = ((Math.round(totalMin) % 1440) + 1440) % 1440;
  const hh = Math.floor(normalized / 60);
  const mm = normalized % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function getDayOfWeekInfo(ymd: string | null | undefined): {
  label: string;
  isWeekday: boolean;
} {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd.trim())) {
    return { label: "Unspecified day of week", isWeekday: true };
  }
  const [y, m, d] = ymd.trim().split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const names = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const dayIdx = dt.getUTCDay();
  return {
    label: names[dayIdx] ?? "Wednesday",
    isWeekday: dayIdx >= 1 && dayIdx <= 5,
  };
}

const DOCK_DISEMBARK_MINUTES: Record<StThomasArrivalDock, number> = {
  havensight_wico: 20,
  crown_bay: 20,
  charlotte_amalie_tender: 35,
  unknown_dock: 30,
};

interface InternalStThomasOptionSpec {
  optionId: string;
  title: string;
  shortLabel: string;
  category: StThomasOptionCategory;
  isFreeOrSelfGuided: boolean;
  focusTags: StThomasExcursionFocus[];
  activityDurationMinutes: number;
  checkInLeadMinutes: number;
  transferEachWayByDock: Record<StThomasArrivalDock, number>;
  minimumReturnBufferMinutes: number;
  adultPriceUsd: number;
  childUnder12PriceUsd: number;
  child12PlusPriceUsd: number;
  estimatedRoundTripTaxiPerPersonUsd: number;
  costBasisSummary: string;
  dockComparisonByDock: Record<StThomasArrivalDock, string>;
  accessibilitySummary: string;
  supportsStepFreeWheelchair: boolean;
  requiresActiveStairsOrPaddle: boolean;
  qualifyPendingHumanConfirmation: boolean;
  qualificationReason?: string;
  supportingSources: Array<{
    organization: string;
    title: string;
    url: string;
    checkedOn: string;
  }>;
  bookingHandoffUrl: string | null;
  bookingChannelLabel: string;
}

const ST_THOMAS_OPTION_SPECS: InternalStThomasOptionSpec[] = [
  {
    optionId: "stt-opt-charlotte-amalie-historic-self-guided",
    title:
      "Free / Self-Guided Charlotte Amalie Historic District, Emancipation Garden & 99 Steps Walk",
    shortLabel: "Self-Guided Historic Charlotte Amalie ($0 Walk)",
    category: "free_or_self_guided",
    isFreeOrSelfGuided: true,
    focusTags: ["any_excursion_or_beach", "free_or_self_guided_walk"],
    activityDurationMinutes: 120,
    checkInLeadMinutes: 0,
    transferEachWayByDock: {
      havensight_wico: 30, // 1.5 mi flat waterfront promenade walk (or 10m safari taxi)
      crown_bay: 15, // 1.7 mi west in Sub Base; requires 10-15m shared safari taxi
      charlotte_amalie_tender: 5, // Direct downtown waterfront drop-off
      unknown_dock: 25,
    },
    minimumReturnBufferMinutes: 45,
    adultPriceUsd: 0,
    childUnder12PriceUsd: 0,
    child12PlusPriceUsd: 0,
    estimatedRoundTripTaxiPerPersonUsd: 0,
    costBasisSummary:
      "$0 public walking route along Veterans Drive, Emancipation Garden, Fort Christian exterior, and the 99 Steps (optional safari taxi extra if riding from Crown Bay or WICO).",
    dockComparisonByDock: {
      havensight_wico:
        "From Havensight (WICO), walk 1.5 miles (~30 min each way) along the flat Veterans Drive waterfront promenade directly into Emancipation Garden, or take a short shared safari taxi.",
      crown_bay:
        "From Crown Bay (AMSS/AMNS), do NOT treat downtown as a shade-covered step-off walk (~1.7 miles through Sub Base commercial road); take a 10–15 min shared safari taxi to Emancipation Garden.",
      charlotte_amalie_tender:
        "From the Charlotte Amalie Inner Harbor tender landing (IANCH), you step directly onto the historic waterfront apron (5 min to Fort Christian and Emancipation Garden).",
      unknown_dock:
        "Walkable from WICO or downtown tender; requires a 10–15 min shared safari taxi each way if your ship berths at Crown Bay.",
    },
    accessibilitySummary:
      "Waterfront promenade, Emancipation Garden, and Main Street (Dronningens Gade) are flat; the historic 99 Steps (103 brick steps up Government Hill) are NOT step-free and should be skipped by wheelchair users.",
    supportsStepFreeWheelchair: false,
    requiresActiveStairsOrPaddle: false,
    qualifyPendingHumanConfirmation: false,
    supportingSources: [
      {
        organization: "Virgin Islands Port Authority (VIPA)",
        title: "Charlotte Amalie Waterfront & Seaport Cruise Schedules",
        url: "https://www.viport.com/schedule-cruise-ports",
        checkedOn: "2026-11-06",
      },
    ],
    bookingHandoffUrl: null,
    bookingChannelLabel: "Free Public / Self-Guided Route (No Booking Needed)",
  },
  {
    optionId: "stt-opt-lindbergh-emerald-beach-self-guided",
    title:
      "Self-Guided Lindbergh Bay Park & Beach (Emerald Beach — Free Entry, Best for Crown Bay)",
    shortLabel: "Self-Guided Lindbergh / Emerald Beach ($0 Entry)",
    category: "free_or_self_guided",
    isFreeOrSelfGuided: true,
    focusTags: [
      "any_excursion_or_beach",
      "magens_or_lindbergh_beach",
      "free_or_self_guided_walk",
    ],
    activityDurationMinutes: 150,
    checkInLeadMinutes: 0,
    transferEachWayByDock: {
      havensight_wico: 22,
      crown_bay: 8, // Only ~1.2 miles from Crown Bay Cruise Dock!
      charlotte_amalie_tender: 15,
      unknown_dock: 22,
    },
    minimumReturnBufferMinutes: 60,
    adultPriceUsd: 0,
    childUnder12PriceUsd: 0,
    child12PlusPriceUsd: 0,
    estimatedRoundTripTaxiPerPersonUsd: 16,
    costBasisSummary:
      "$0 VIPA beach admission at Lindbergh Bay Park and Beach; budget shared safari taxi each way (exact date-specific USVI Taxi Commission fare marked unknown; ~$12–$20/person round-trip planning estimate).",
    dockComparisonByDock: {
      havensight_wico:
        "From Havensight (WICO), Lindbergh Bay is ~20–22 minutes west across Charlotte Amalie by taxi.",
      crown_bay:
        "Best low-cost beach fit for Crown Bay (AMSS/AMNS): VIPA's Lindbergh Bay Park & Beach (Emerald Beach) is only ~1.2 miles (~5–8 minutes by taxi) from the Crown Bay terminal.",
      charlotte_amalie_tender:
        "From downtown Charlotte Amalie, Lindbergh Bay is ~12–15 minutes west by shared taxi.",
      unknown_dock:
        "Closest beach to Crown Bay (5–8 min taxi) and ~20–22 min from Havensight (WICO) with $0 beach admission.",
    },
    accessibilitySummary:
      "Flat sandy shoreline with calm bay water and beachfront resort access; shared open-air safari taxis require stepping up onto bench seating.",
    supportsStepFreeWheelchair: false,
    requiresActiveStairsOrPaddle: false,
    qualifyPendingHumanConfirmation: false,
    supportingSources: [
      {
        organization: "Virgin Islands Port Authority (VIPA)",
        title: "Lindbergh Bay Park and Beach — VIPA Public Facilities",
        url: "https://www.viport.com/",
        checkedOn: "2026-11-06",
      },
    ],
    bookingHandoffUrl: null,
    bookingChannelLabel: "Self-Guided Public Beach via Regulated Shared Taxi",
  },
  {
    optionId: "stt-opt-magens-bay-self-guided-safari",
    title:
      "Self-Guided Magens Bay Authority Park Beach Day ($7 Adult / Kids Under 12 Free)",
    shortLabel: "Self-Guided Magens Bay Beach ($7 Entry)",
    category: "free_or_self_guided",
    isFreeOrSelfGuided: true,
    focusTags: ["any_excursion_or_beach", "magens_or_lindbergh_beach"],
    activityDurationMinutes: 180,
    checkInLeadMinutes: 0,
    transferEachWayByDock: {
      havensight_wico: 25,
      crown_bay: 32,
      charlotte_amalie_tender: 25,
      unknown_dock: 32,
    },
    minimumReturnBufferMinutes: 60,
    adultPriceUsd: 7,
    childUnder12PriceUsd: 0,
    child12PlusPriceUsd: 7,
    estimatedRoundTripTaxiPerPersonUsd: 24,
    costBasisSummary:
      "Magens Bay Authority official non-resident daily pass: $7.00 per adult, $0 free for children under 12 (gate open 7:00 AM–5:30 PM daily), plus shared open-air safari taxi (~$24/person round-trip planning estimate; exact day-of taxi tariff marked unknown).",
    dockComparisonByDock: {
      havensight_wico:
        "From Havensight (WICO), shared open-air safari taxis climb over the central ridge to Magens Bay in ~25 minutes each way.",
      crown_bay:
        "From Crown Bay (AMSS/AMNS), allow ~30–35 minutes each way over the mountain road to Magens Bay.",
      charlotte_amalie_tender:
        "From downtown Charlotte Amalie, shared safari taxis reach Magens Bay in ~25 minutes each way.",
      unknown_dock:
        "Allow 25–35 minutes each way by shared safari taxi plus $7.00/adult Magens Bay Authority gate admission.",
    },
    accessibilitySummary:
      "Paved drop-off loop, bathhouses, Fairchild's Bar & Grill, and boardwalk/flat sand access; open-air mountain safari trucks require climbing steps unless a wheelchair-accessible van is pre-arranged.",
    supportsStepFreeWheelchair: false,
    requiresActiveStairsOrPaddle: false,
    qualifyPendingHumanConfirmation: false,
    supportingSources: [
      {
        organization: "Magens Bay Authority",
        title:
          "Passes – Magens Bay Authority Official Website ($7 Non-Resident / Under 12 Free / 7:00 AM–5:30 PM)",
        url: "https://magensbayauthority.org/passes/",
        checkedOn: "2026-11-06",
      },
    ],
    bookingHandoffUrl: "https://magensbayauthority.org/passes/",
    bookingChannelLabel: "Magens Bay Authority Official Gate / Online Pass",
  },
  {
    optionId: "stt-opt-viecotours-cas-cay-kayak-snorkel",
    title:
      "VI Ecotours — Cas Cay Kayak, Hike & Snorkel Adventure at Mangrove Lagoon (5199KSML)",
    shortLabel: "VI Ecotours Cas Cay Kayak & Snorkel (3h / $99)",
    category: "guided_eco_or_marine",
    isFreeOrSelfGuided: false,
    focusTags: ["any_excursion_or_beach", "mangrove_lagoon_kayak_snorkel"],
    activityDurationMinutes: 180, // Observed 3 Hours on viecotours.com (2026-11-06), up from 150m on 2026-10-30
    checkInLeadMinutes: 15,
    transferEachWayByDock: {
      havensight_wico: 25, // 6526 Estate Nadir is ~20-25m east of WICO
      crown_bay: 35, // Crown Bay must cross Charlotte Amalie + Bovoni Rd (~35m each way)
      charlotte_amalie_tender: 30,
      unknown_dock: 35,
    },
    minimumReturnBufferMinutes: 60,
    adultPriceUsd: 99,
    childUnder12PriceUsd: 99,
    child12PlusPriceUsd: 99,
    estimatedRoundTripTaxiPerPersonUsd: 24,
    costBasisSummary:
      "Published operator rate From $99/person (3 Hours on viecotours.com checked 2026-11-06; transfers to 6526 Estate Nadir Mangrove Lagoon Marina not included in base rate).",
    dockComparisonByDock: {
      havensight_wico:
        "Fits 5.5+ hour Havensight (WICO) port calls: Mangrove Lagoon Marina (6526 Estate Nadir) is ~20–25 minutes east of WICO (total required window: 305 minutes including 180m tour, 15m check-in, 50m round-trip taxi, and 60m ship buffer).",
      crown_bay:
        "From Crown Bay (AMSS/AMNS), East End taxi transfer increases to ~35 minutes each way (total required window: 325 minutes / 5h 25m); tight or ineligible on short 5-hour Crown Bay calls.",
      charlotte_amalie_tender:
        "Requires 35m tender ashore + 30m taxi each way to Mangrove Lagoon; only viable on 6+ hour tender port calls.",
      unknown_dock:
        "Budget 325 minutes total dock-to-dock until your berth (WICO vs. Crown Bay) and the 150m-vs-180m duration change are confirmed.",
    },
    accessibilitySummary:
      "Requires active tandem kayaking through mangrove channels, hiking across uneven volcanic coral trails on Cas Cay, and open-water snorkeling.",
    supportsStepFreeWheelchair: false,
    requiresActiveStairsOrPaddle: true,
    qualifyPendingHumanConfirmation: true,
    qualificationReason:
      "Material change queued 2026-11-06: https://www.viecotours.com/ (published Nov 5, 2026) lists Cas Cay Kayak, Hike & Snorkel as 3 Hours (180 min, From $99) vs. 2h 30m (150 min) in our 2026-10-30 snapshot. Timing uses the conservative 180-minute duration pending human review.",
    supportingSources: [
      {
        organization: "Virgin Islands Ecotours (VI Ecotours)",
        title:
          "St. Thomas Mangrove Lagoon Tours — 6526 Estate Nadir (Checked 2026-11-06)",
        url: "https://www.viecotours.com/",
        checkedOn: "2026-11-06",
      },
    ],
    bookingHandoffUrl:
      "/tours?q=St.+Thomas+Mangrove+Lagoon+Kayak+Hike+Snorkel+5199KSML",
    bookingChannelLabel: "Compare VI Ecotours / Viator 5199KSML",
  },
  {
    optionId: "stt-opt-catamaran-turtle-buck-island",
    title:
      "Half-Day Buck Island / Turtle Cove Catamaran Snorkel & Sail (180–240 min)",
    shortLabel: "Buck Island Catamaran Snorkel (3.5–4h)",
    category: "guided_eco_or_marine",
    isFreeOrSelfGuided: false,
    focusTags: ["any_excursion_or_beach", "st_john_ferry_or_catamaran"],
    activityDurationMinutes: 210,
    checkInLeadMinutes: 20,
    transferEachWayByDock: {
      havensight_wico: 15,
      crown_bay: 20,
      charlotte_amalie_tender: 20,
      unknown_dock: 25,
    },
    minimumReturnBufferMinutes: 60,
    adultPriceUsd: 129,
    childUnder12PriceUsd: 99,
    child12PlusPriceUsd: 129,
    estimatedRoundTripTaxiPerPersonUsd: 0,
    costBasisSummary:
      "Indicative $119–$149 per adult across St. Thomas half-day catamaran turtle snorkel departures; pier pickup vs. marina check-in varies by selected vessel and option.",
    dockComparisonByDock: {
      havensight_wico:
        "From Havensight (WICO), Yacht Haven Grande / Frenchtown / East End marina departures require 10–25 minutes transfer each way.",
      crown_bay:
        "From Crown Bay (AMSS/AMNS), Crown Bay Marina / Frenchtown departures are 5–15 minutes away, while East End marinas require 35–40 minutes.",
      charlotte_amalie_tender:
        "Allow 35 minutes tender ashore plus 15–20 minutes transfer to the departure marina.",
      unknown_dock:
        "Confirm exact departure marina (Crown Bay Marina, Yacht Haven Grande, or Sapphire/Red Hook) against your ship's assigned dock before checkout.",
    },
    accessibilitySummary:
      "Requires boarding a sailing catamaran via gangway and climbing swim ladders from the water; not step-free for motorized wheelchairs.",
    supportsStepFreeWheelchair: false,
    requiresActiveStairsOrPaddle: false,
    qualifyPendingHumanConfirmation: true,
    qualificationReason:
      "Pier-pickup equivalence between WICO and Crown Bay is unconfirmed ('unknown') across third-party catamaran listings until option-level meeting coordinates are verified.",
    supportingSources: [
      {
        organization: "Cruz Bay Watersports & St. Thomas Catalog Snapshot",
        title: "St. Thomas Snorkel & Catamaran Departures (Checked 2026-11-06)",
        url: "https://cruzbaywatersports.com/",
        checkedOn: "2026-11-06",
      },
    ],
    bookingHandoffUrl: "/tours?q=St.+Thomas+Catamaran+Turtle+Snorkel",
    bookingChannelLabel: "Browse St. Thomas Catamaran Snorkel Options",
  },
  {
    optionId: "stt-opt-st-john-trunk-bay-red-hook-ferry",
    title:
      "St. John & Trunk Bay (Virgin Islands National Park) via VIPA Red Hook Passenger Ferry",
    shortLabel: "St. John & Trunk Bay via Red Hook Ferry (6.5h+ Call)",
    category: "two_island_ferry_excursion",
    isFreeOrSelfGuided: true,
    focusTags: ["any_excursion_or_beach", "st_john_ferry_or_catamaran"],
    // 15m Red Hook check-in + 15m outbound ferry + 15m Cruz Bay->Trunk Bay taxi + 120m Trunk Bay beach + 15m return taxi + 15m return ferry wait + 15m return crossing = 210m from Red Hook terminal
    activityDurationMinutes: 195,
    checkInLeadMinutes: 15,
    transferEachWayByDock: {
      havensight_wico: 25, // WICO -> Red Hook (Urman Fredericks Terminal) ~25 min each way
      crown_bay: 40, // Crown Bay -> Red Hook ~40 min each way across island traffic
      charlotte_amalie_tender: 30,
      unknown_dock: 40,
    },
    minimumReturnBufferMinutes: 90, // Mandatory 90-min two-island ferry return buffer
    adultPriceUsd: 16.3, // $8.15 x 2 round-trip VIPA Red Hook <-> Cruz Bay non-resident ferry fare
    childUnder12PriceUsd: 2.0, // $1.00 x 2 round-trip child (2-11) ferry fare
    child12PlusPriceUsd: 16.3,
    estimatedRoundTripTaxiPerPersonUsd: 44, // St. Thomas dock<->Red Hook + St. John Cruz Bay<->Trunk Bay shared taxis
    costBasisSummary:
      "VIPA Red Hook <-> Cruz Bay passenger ferry: $8.15/adult one-way ($16.30 R/T), $1.00/child (ages 2–11) one-way ($2.00 R/T), $4.00/luggage piece, plus St. Thomas dock<->Red Hook and Cruz Bay<->Trunk Bay shared safari taxis (~$40–$48/person combined R/T estimate).",
    dockComparisonByDock: {
      havensight_wico:
        "From Havensight (WICO), Red Hook (Urman Fredericks Marine Terminal) is ~25 minutes east by taxi. With 15m ferry check-in, 15m crossing, St. John taxi to Trunk Bay, 2h beach time, and a mandatory 90-minute two-island return buffer, you need at least 370 minutes (6h 10m) of port time.",
      crown_bay:
        "From Crown Bay (AMSS/AMNS), do NOT attempt to take the Crown Bay -> Cruz Bay ferry outbound (VIPA schedule only departs Crown Bay at 2:15 PM Sat/Sun, 3:30 PM, and 5:30 PM). Riding a taxi across island to Red Hook takes ~40 minutes each way, requiring at least 400 minutes (6h 40m) of port time.",
      charlotte_amalie_tender:
        "Tender queue (35m each way) + 30m taxi to Red Hook + ferry crossing + 90m two-island buffer requires at least 415 minutes (6h 55m) in port.",
      unknown_dock:
        "Requires a 6.5 to 7.0+ hour port window and a mandatory 90-minute return buffer in case a Cruz Bay return ferry fills or hits weekday midday schedule gaps.",
    },
    accessibilitySummary:
      "Requires climbing into shared safari trucks on both St. Thomas and St. John plus passenger ferry gangway boarding at Urman Fredericks (Red Hook) and Loredon Boynes (Cruz Bay) docks.",
    supportsStepFreeWheelchair: false,
    requiresActiveStairsOrPaddle: false,
    qualifyPendingHumanConfirmation: true,
    qualificationReason:
      "VIPA's ferry page (checked 2026-11-06) still displays the temporary off-season schedule banner ('July 26, 2026 through October 31, 2026') with Mon–Fri midday return gaps from Cruz Bay to Red Hook (no 10:00 AM, 12:00 PM, or 2:00 PM weekday departures). Weekday return timing is flagged 'unknown / needs confirmation' until VIPA posts the winter 2026/2027 update.",
    supportingSources: [
      {
        organization: "Virgin Islands Port Authority (VIPA)",
        title:
          "Ferry & Cargo Vessel Schedules — Red Hook ($8.15 / 15m) & Crown Bay Afternoon-Only Schedule",
        url: "https://www.viport.com/schedules-ferrycargoschedules",
        checkedOn: "2026-11-06",
      },
      {
        organization: "U.S. National Park Service",
        title: "Virgin Islands National Park (St. John) — Plan Your Visit",
        url: "https://www.nps.gov/viis/planyourvisit/index.htm",
        checkedOn: "2026-11-06",
      },
    ],
    bookingHandoffUrl: "https://www.viport.com/schedules-ferrycargoschedules",
    bookingChannelLabel: "VIPA Official Red Hook Ferry Schedule & Rates",
  },
];

/**
 * Evaluates a traveler's actual St. Thomas cruise port day and returns ranked options,
 * eliminated options, dock-specific transfer math, free/self-guided choices, and
 * explicit `unknown` markers for unsupported facts.
 */
export function evaluateStThomasPortDayScenario(
  rawInput?: Partial<StThomasPortDayScenarioInput>,
): StThomasPortDayEvaluationResult {
  const isExampleScenario =
    !rawInput ||
    rawInput.travelDate === undefined ||
    rawInput.travelDate === null ||
    String(rawInput.travelDate).trim() === "";

  const input: Required<StThomasPortDayScenarioInput> = {
    travelDate:
      rawInput?.travelDate !== undefined &&
      rawInput?.travelDate !== null &&
      String(rawInput.travelDate).trim() !== ""
        ? String(rawInput.travelDate).trim()
        : DEFAULT_ST_THOMAS_SCENARIO_INPUT.travelDate,
    shipArrivalTime:
      rawInput?.shipArrivalTime || DEFAULT_ST_THOMAS_SCENARIO_INPUT.shipArrivalTime,
    allAboardTime:
      rawInput?.allAboardTime || DEFAULT_ST_THOMAS_SCENARIO_INPUT.allAboardTime,
    arrivalDock:
      rawInput?.arrivalDock || DEFAULT_ST_THOMAS_SCENARIO_INPUT.arrivalDock,
    excursionFocus:
      rawInput?.excursionFocus || DEFAULT_ST_THOMAS_SCENARIO_INPUT.excursionFocus,
    adults: Math.max(1, Number(rawInput?.adults ?? 2)),
    childAges: Array.isArray(rawInput?.childAges) ? rawInput.childAges : [],
    mobilityLevel:
      rawInput?.mobilityLevel || DEFAULT_ST_THOMAS_SCENARIO_INPUT.mobilityLevel,
    returnBufferMinutes: Math.max(
      30,
      Number(
        rawInput?.returnBufferMinutes ??
          DEFAULT_ST_THOMAS_SCENARIO_INPUT.returnBufferMinutes,
      ),
    ),
  };

  const arrivalMin = parseHmToMinutes(input.shipArrivalTime) ?? 8 * 60;
  const allAboardMin = parseHmToMinutes(input.allAboardTime) ?? 16 * 60 + 30;
  const totalPortWindowMinutes = Math.max(0, allAboardMin - arrivalMin);
  const disembarkationMinutes = DOCK_DISEMBARK_MINUTES[input.arrivalDock];
  const dayInfo = getDayOfWeekInfo(input.travelDate);
  const hasChildUnder5 = input.childAges.some((age) => age < 5);

  const globalUnknownFacts: StThomasUnknownFact[] = [
    {
      factId: "stt-unknown-usvi-taxi-tariff-and-dispatch-wait",
      status: "unknown",
      category: "unverified_schedule_or_tariff",
      summary:
        "Exact day-of USVI Taxi Commission per-person shared safari tariff supplements and dispatch hold time at WICO vs. Crown Bay are unknown.",
      impactOnDecision:
        "Open-air safari taxis at both WICO and Crown Bay frequently wait 10–20 minutes to fill multi-passenger benches before departing; solo or couple travelers needing immediate departure must budget private-taxi rates.",
      sourceUrl: "https://www.viport.com/",
      checkedOn: "2026-11-06",
    },
    {
      factId: "stt-unknown-vipa-post-oct31-ferry-winter-bulletin",
      status: "unknown",
      category: "source_change_pending_human_review",
      summary:
        "VIPA's ferry schedule page (checked 2026-11-06) still displays the 'July 26, 2026 through October 31, 2026' temporary off-season passenger ferry notice with Mon–Fri midday Cruz Bay -> Red Hook return gaps (no 10:00 AM, 12:00 PM, or 2:00 PM weekday boats).",
      impactOnDecision:
        "On weekday sailings, missing the 11:00 AM or 1:00 PM Cruz Bay return ferry can cause a 2-hour wait until the next Red Hook crossing unless winter hourly midday service is confirmed.",
      sourceUrl: "https://www.viport.com/schedules-ferrycargoschedules",
      checkedOn: "2026-11-06",
    },
    {
      factId: "stt-unknown-viecotours-duration-delta-150m-vs-180m",
      status: "unknown",
      category: "source_change_pending_human_review",
      summary:
        "Virgin Islands Ecotours' live site (published Nov 5, 2026, checked 2026-11-06) lists Cas Cay Kayak, Hike & Snorkel as 3 Hours (180 min) vs. 2 hours 30 minutes (150 min) in our 2026-10-30 snapshot.",
      impactOnDecision:
        "Planner uses the conservative 180-minute duration (+30 min) until human review confirms whether 180m is on-water time or includes safety/gear staging.",
      sourceUrl: "https://www.viecotours.com/",
      checkedOn: "2026-11-06",
    },
    {
      factId: "stt-unknown-pier-pickup-equivalence-wico-vs-crown-bay",
      status: "unknown",
      category: "operator_confirmation_required",
      summary:
        "Third-party Viator / catamaran listings in St. Thomas do not uniformly guarantee that Crown Bay (AMSS/AMNS) pier pickup is included at the same time or price as Havensight (WICO) pickup.",
      impactOnDecision:
        "Travelers docked at Crown Bay must verify the exact option-level pickup point before assuming pier-side boarding.",
      sourceUrl: "https://www.viport.com/schedule-cruise-ports",
      checkedOn: "2026-11-06",
    },
  ];

  if (isExampleScenario) {
    globalUnknownFacts.unshift({
      factId: "stt-unknown-missing-sailing-date",
      status: "unknown",
      category: "missing_traveler_input",
      summary:
        "Traveler sailing date was not supplied; evaluating against default winter example date (2026-11-18).",
      impactOnDecision:
        "Weekday vs. weekend ferry frequencies (especially Cruz Bay -> Red Hook midday returns and Crown Bay 2:15 PM weekend boat) depend on your exact sailing date.",
      sourceUrl: null,
      checkedOn: "2026-11-06",
    });
  }

  if (input.arrivalDock === "unknown_dock") {
    globalUnknownFacts.unshift({
      factId: "stt-unknown-ship-berth-assignment",
      status: "unknown",
      category: "missing_traveler_input",
      summary:
        "Ship berth (Havensight WICO vs. Crown Bay AMSS/AMNS vs. Inner/Outer Harbor Tender) is unknown.",
      impactOnDecision:
        "Applies a conservative 30-minute disembarkation allowance and Crown Bay East End transfer times (+10–15 min each way) until berth is confirmed.",
      sourceUrl: "https://www.viport.com/schedule-cruise-ports",
      checkedOn: "2026-11-06",
    });
  }

  if (hasChildUnder5) {
    globalUnknownFacts.push({
      factId: "stt-unknown-safari-taxi-child-restraint-policy",
      status: "unknown",
      category: "operator_confirmation_required",
      summary:
        "Open-air bench-style USVI safari taxis generally lack LATCH/seatbelt anchors for infant or toddler car seats (child under age 5 in party).",
      impactOnDecision:
        "Families with children under 5 who require a secured car seat must pre-book an enclosed private van/SUV or choose a walkable option from their pier.",
      sourceUrl: null,
      checkedOn: "2026-11-06",
    });
  }

  const allOptions: StThomasEvaluatedOption[] = ST_THOMAS_OPTION_SPECS.map(
    (spec) => {
      const outboundTransferMinutes =
        spec.transferEachWayByDock[input.arrivalDock];
      const returnTransferMinutes =
        spec.transferEachWayByDock[input.arrivalDock];
      const requiredReturnBufferMinutes = Math.max(
        input.returnBufferMinutes,
        spec.minimumReturnBufferMinutes,
      );
      const totalRequiredMinutes =
        disembarkationMinutes +
        spec.checkInLeadMinutes +
        outboundTransferMinutes +
        spec.activityDurationMinutes +
        returnTransferMinutes +
        requiredReturnBufferMinutes;
      const netMarginMinutes = totalPortWindowMinutes - totalRequiredMinutes;

      const shoreReadyMin = arrivalMin + disembarkationMinutes;
      const estimatedBackAtPierMin =
        shoreReadyMin +
        spec.checkInLeadMinutes +
        outboundTransferMinutes +
        spec.activityDurationMinutes +
        returnTransferMinutes;
      const cutoffMin = allAboardMin - requiredReturnBufferMinutes;

      const childrenUnder12 = input.childAges.filter((a) => a < 12).length;
      const children12Plus = input.childAges.filter((a) => a >= 12).length;
      const admissionTotal =
        input.adults * spec.adultPriceUsd +
        children12Plus * spec.child12PlusPriceUsd +
        childrenUnder12 * spec.childUnder12PriceUsd;
      const totalGuests = input.adults + input.childAges.length;
      const taxiTotal =
        totalGuests * spec.estimatedRoundTripTaxiPerPersonUsd;
      const estimatedCostTotalPartyUsd = Number(
        (admissionTotal + taxiTotal).toFixed(2),
      );
      const estimatedCostPerAdultUsd = Number(
        (spec.adultPriceUsd + spec.estimatedRoundTripTaxiPerPersonUsd).toFixed(
          2,
        ),
      );

      const accessibilityCompatible =
        input.mobilityLevel === "step_free_wheelchair"
          ? spec.supportsStepFreeWheelchair
          : input.mobilityLevel === "light_walking"
            ? !spec.requiresActiveStairsOrPaddle
            : true;

      const matchesFocus =
        input.excursionFocus === "any_excursion_or_beach" ||
        spec.focusTags.includes(input.excursionFocus);

      let fitStatus: StThomasOptionFitStatus;
      let fitBadgeLabel: string;
      let conciseVerdict: string;

      if (!accessibilityCompatible) {
        fitStatus = "does_not_fit";
        fitBadgeLabel = "Eliminated — Accessibility / Mobility Constraint";
        conciseVerdict = `Eliminated for ${input.mobilityLevel}: ${spec.accessibilitySummary}`;
      } else if (netMarginMinutes < 0) {
        fitStatus = "does_not_fit";
        fitBadgeLabel = "Does Not Fit Ship Window";
        conciseVerdict = `Requires ${totalRequiredMinutes} min (${(totalRequiredMinutes / 60).toFixed(1)} hrs) including ${outboundTransferMinutes}m each-way transfer from ${input.arrivalDock} and a ${requiredReturnBufferMinutes}m all-aboard buffer, which exceeds your ${totalPortWindowMinutes} min port window by ${Math.abs(netMarginMinutes)} min.`;
      } else if (!matchesFocus && !spec.isFreeOrSelfGuided) {
        fitStatus = "does_not_fit";
        fitBadgeLabel = "Outside Selected Excursion Focus";
        conciseVerdict = `Fits time window (+${netMarginMinutes}m slack) but does not match selected focus (${input.excursionFocus}).`;
      } else if (spec.qualifyPendingHumanConfirmation) {
        fitStatus =
          netMarginMinutes < 30
            ? "tight_buffer"
            : "qualified_needs_confirmation";
        fitBadgeLabel =
          netMarginMinutes < 30
            ? "Tight Buffer • Needs Confirmation"
            : "Fits Window • Pending Source Confirmation";
        conciseVerdict = `${spec.qualificationReason} Net margin from ${input.arrivalDock}: +${netMarginMinutes} min.`;
      } else if (netMarginMinutes < 40) {
        fitStatus = "tight_buffer";
        fitBadgeLabel = "Tight Buffer (< 40 min Slack)";
        conciseVerdict = `Fits mathematically with +${netMarginMinutes} min slack above your ${requiredReturnBufferMinutes}m return buffer from ${input.arrivalDock}; depart ashore promptly at ${formatMinutesToHm(shoreReadyMin)}.`;
      } else {
        fitStatus = "fits_comfortably";
        fitBadgeLabel = "Fits Comfortably";
        conciseVerdict = `Fits comfortably from ${input.arrivalDock} with +${netMarginMinutes} min slack beyond your ${requiredReturnBufferMinutes}m all-aboard buffer (estimated back at pier by ${formatMinutesToHm(estimatedBackAtPierMin)} vs. ${input.allAboardTime} all-aboard).`;
      }

      const optionUnknowns = globalUnknownFacts.filter((u) => {
        if (
          u.factId === "stt-unknown-vipa-post-oct31-ferry-winter-bulletin" &&
          spec.optionId !== "stt-opt-st-john-trunk-bay-red-hook-ferry"
        ) {
          return false;
        }
        if (
          u.factId === "stt-unknown-viecotours-duration-delta-150m-vs-180m" &&
          spec.optionId !== "stt-opt-viecotours-cas-cay-kayak-snorkel"
        ) {
          return false;
        }
        return true;
      });

      return {
        optionId: spec.optionId,
        title: spec.title,
        shortLabel: spec.shortLabel,
        category: spec.category,
        isFreeOrSelfGuided: spec.isFreeOrSelfGuided,
        fitStatus,
        fitBadgeLabel,
        conciseVerdict,
        dockComparisonNote: spec.dockComparisonByDock[input.arrivalDock],
        timing: {
          timeZone: "America/St_Thomas",
          utcOffsetString: "-04:00",
          shipArrivalTime: input.shipArrivalTime,
          allAboardTime: input.allAboardTime,
          totalPortWindowMinutes,
          disembarkationMinutes,
          checkInLeadMinutes: spec.checkInLeadMinutes,
          outboundTransferMinutes,
          activityDurationMinutes: spec.activityDurationMinutes,
          returnTransferMinutes,
          requiredReturnBufferMinutes,
          totalRequiredMinutes,
          netMarginMinutes,
          earliestShoreReadyTime: formatMinutesToHm(shoreReadyMin),
          estimatedBackAtPierTime: formatMinutesToHm(estimatedBackAtPierMin),
          targetAllAboardCutoffTime: formatMinutesToHm(cutoffMin),
        },
        estimatedCostPerAdultUsd,
        estimatedCostTotalPartyUsd,
        costBasisSummary: spec.costBasisSummary,
        accessibilitySummary: spec.accessibilitySummary,
        accessibilityCompatible,
        supportingSources: spec.supportingSources,
        unknownFactsForOption: optionUnknowns,
        bookingHandoffUrl: spec.bookingHandoffUrl,
        bookingChannelLabel: spec.bookingChannelLabel,
        commercialWeightApplied: 0,
      };
    },
  );

  // Rank viable options: focus match first, then fit tier, then net margin, with zero commercial weight
  const fitOrder: Record<StThomasOptionFitStatus, number> = {
    fits_comfortably: 1,
    qualified_needs_confirmation: 2,
    tight_buffer: 3,
    does_not_fit: 4,
  };

  const recommendedOptions = allOptions
    .filter((o) => o.fitStatus !== "does_not_fit")
    .sort((a, b) => {
      // If user specifically asked forCrown Bay + beach, prefer Lindbergh Bay when dock === crown_bay and short window
      if (
        input.arrivalDock === "crown_bay" &&
        input.excursionFocus === "free_or_self_guided_walk"
      ) {
        if (a.optionId === "stt-opt-lindbergh-emerald-beach-self-guided")
          return -1;
        if (b.optionId === "stt-opt-lindbergh-emerald-beach-self-guided")
          return 1;
      }
      const tierDiff = fitOrder[a.fitStatus] - fitOrder[b.fitStatus];
      if (tierDiff !== 0) return tierDiff;
      return b.timing.netMarginMinutes - a.timing.netMarginMinutes;
    });

  const eliminatedOptions = allOptions.filter(
    (o) => o.fitStatus === "does_not_fit",
  );

  const topOption = recommendedOptions[0] ?? null;
  const dockName =
    ST_THOMAS_PUBLIC_ANSWER_SUMMARY.dockRules[input.arrivalDock].officialName;

  const conciseVerdict = topOption
    ? `For your ${(totalPortWindowMinutes / 60).toFixed(1)}-hour St. Thomas call (${input.shipArrivalTime}–${input.allAboardTime} AST) at ${dockName}, ${recommendedOptions.length} of ${allOptions.length} paths fit your window. Top fit: ${topOption.shortLabel} (${topOption.fitBadgeLabel}, +${topOption.timing.netMarginMinutes}m buffer slack).`
    : `No standard St. Thomas excursion fits your ${(totalPortWindowMinutes / 60).toFixed(1)}-hour window (${input.shipArrivalTime}–${input.allAboardTime}) and mobility profile (${input.mobilityLevel}) without violating the required all-aboard buffer; remain on the immediate pier apron or pre-arrange a step-free accessible van.`;

  return {
    portSlug: "st-thomas",
    timeZone: "America/St_Thomas",
    evaluatedInput: input,
    isExampleScenario,
    dayOfWeekLabel: dayInfo.label,
    isWeekdaySailing: dayInfo.isWeekday,
    publicAnswer: ST_THOMAS_PUBLIC_ANSWER_SUMMARY,
    conciseVerdict,
    recommendedOptions,
    eliminatedOptions,
    allOptions,
    unknownFacts: globalUnknownFacts,
    commercialNeutrality: {
      commercialWeightAppliedToRanking: 0,
      includesFreeOrSelfGuidedOption: true,
      humanFactApprovalRequired: true,
    },
  };
}

export function parseStThomasScenarioFromSearchParams(
  params:
    | URLSearchParams
    | Record<string, string | string[] | undefined>
    | null
    | undefined,
): Required<StThomasPortDayScenarioInput> {
  const getVal = (key: string): string | undefined => {
    if (!params) return undefined;
    if (params instanceof URLSearchParams) {
      return params.get(key) ?? undefined;
    }
    const raw = params[key];
    return Array.isArray(raw) ? raw[0] : raw;
  };

  const dockRaw = getVal("dock") || getVal("arrivalDock");
  const arrivalDock: StThomasArrivalDock =
    dockRaw === "crown_bay" ||
    dockRaw === "charlotte_amalie_tender" ||
    dockRaw === "unknown_dock" ||
    dockRaw === "havensight_wico"
      ? dockRaw
      : DEFAULT_ST_THOMAS_SCENARIO_INPUT.arrivalDock;

  const focusRaw = getVal("focus") || getVal("excursionFocus");
  const excursionFocus: StThomasExcursionFocus =
    focusRaw === "st_john_ferry_or_catamaran" ||
    focusRaw === "mangrove_lagoon_kayak_snorkel" ||
    focusRaw === "magens_or_lindbergh_beach" ||
    focusRaw === "free_or_self_guided_walk" ||
    focusRaw === "any_excursion_or_beach"
      ? focusRaw
      : DEFAULT_ST_THOMAS_SCENARIO_INPUT.excursionFocus;

  const mobilityRaw = getVal("mobility") || getVal("mobilityLevel");
  const mobilityLevel: StThomasMobilityLevel =
    mobilityRaw === "step_free_wheelchair" ||
    mobilityRaw === "light_walking" ||
    mobilityRaw === "active_stairs_and_paddle" ||
    mobilityRaw === "unspecified"
      ? mobilityRaw
      : DEFAULT_ST_THOMAS_SCENARIO_INPUT.mobilityLevel;

  const childAgesRaw = getVal("childAges") || getVal("child_ages") || "";
  const childAges = childAgesRaw
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n >= 0 && n <= 17);

  return {
    travelDate:
      getVal("date") ||
      getVal("travelDate") ||
      DEFAULT_ST_THOMAS_SCENARIO_INPUT.travelDate,
    shipArrivalTime:
      getVal("arrival") ||
      getVal("shipArrivalTime") ||
      DEFAULT_ST_THOMAS_SCENARIO_INPUT.shipArrivalTime,
    allAboardTime:
      getVal("allAboard") ||
      getVal("allAboardTime") ||
      DEFAULT_ST_THOMAS_SCENARIO_INPUT.allAboardTime,
    arrivalDock,
    excursionFocus,
    adults: Math.max(
      1,
      Number(getVal("adults") || getVal("party_size") || 2) || 2,
    ),
    childAges,
    mobilityLevel,
    returnBufferMinutes: Math.max(
      30,
      Number(getVal("buffer") || getVal("returnBufferMinutes") || 60) || 60,
    ),
  };
}
