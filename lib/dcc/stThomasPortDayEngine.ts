/**
 * St. Thomas (USVI) Port-Day Decision Engine & Actual-Trip Checker
 *
 * Answers:
 * "Which St. Thomas excursions fit my sailing from Havensight (WICO) versus
 * Crown Bay, and when does a St. John ferry or beach day fit my ship window?"
 *
 * Enforces:
 * 1. St. Thomas (`st-thomas`) is the main destination; St. John (`st-john`) is
 *    offered as a day-trip choice when both ferry legs (outbound Red Hook ->
 *    Cruz Bay and return Cruz Bay -> Red Hook) fit the sailing.
 * 2. Strict product separation between Viator `5199KSML` (Mangrove Lagoon Kayak
 *    & Snorkel — 150 min, $89, self_drive to 6526 Estate Nadir, d965-5199KSML)
 *    and `5199P27` (Cas Cay Kayak, Hike & Snorkel — 180 min, $99, self_drive to
 *    6526 Estate Nadir, d965-5199P27), plus `5199PRTSTTKSML` (210 min, $79,
 *    shore excursion w/ transport) and `5199P36` (120 min, $89, Sea Turtles).
 * 3. VIPA ferry schedule rule (https://www.viport.com/schedules-ferrycargoschedules):
 *    The temporary VIPA notice (July 26, 2026 through October 31, 2026) ended
 *    October 31 (`2026-10-31`). Evaluates schedules applicable to the trip date
 *    and shows `Needs confirmation` (`qualified_needs_confirmation`) where the
 *    return leg is unresolved.
 * 4. Free / self-guided options ($0 Charlotte Amalie Historic District walk,
 *    $0-admission VIPA Lindbergh Bay, and $7 Magens Bay Authority park pass).
 * 5. Explicit `unknown` markers for unsupported or unconfirmed operator/port facts.
 * 6. Zero commercial ranking influence (`commercialWeightApplied: 0`).
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

export type StThomasPickupMode =
  | "self_drive"
  | "pier_pickup"
  | "hotel_pickup"
  | "public_walk_or_safari_taxi"
  | "public_ferry_and_safari_taxi";

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

export interface StJohnFerryLegEvaluation {
  travelDate: string;
  dayOfWeekLabel: string;
  isWeekdaySailing: boolean;
  temporaryVipaNoticeWindow: {
    startDate: "2026-07-26";
    endDate: "2026-10-31";
    temporaryVipaNoticeEndedOn: "2026-10-31";
    isPastTemporaryNoticeEndDate: boolean;
  };
  applicableScheduleSummary: string;
  outboundLeg: {
    originTerminal: "Red Hook (Urman Victor Fredericks Marine Terminal)";
    destinationTerminal: "Cruz Bay, St. John (Loredon Lorence Boynes Sr. Dock)";
    earliestReachableRedHookArrivalTime: string;
    selectedDepartureTime: string | null;
    arrivalAtCruzBayTime: string | null;
    crossingMinutes: 15;
    fitsOutbound: boolean;
  };
  returnLeg: {
    originTerminal: "Cruz Bay, St. John (Loredon Lorence Boynes Sr. Dock)";
    destinationTerminal: "Red Hook (Urman Victor Fredericks Marine Terminal)";
    latestSafeCruzBayDepartureCutoffTime: string;
    selectedReturnDepartureTime: string | null;
    arrivalAtRedHookTime: string | null;
    estimatedBackAtShipDockTime: string | null;
    crossingMinutes: 15;
    fitsReturn: boolean;
    returnLegResolved: boolean;
    returnLegStatus: "resolved" | "unresolved_needs_confirmation" | "does_not_fit";
    unresolvedReason: string | null;
  };
  bothFerryLegsFit: boolean;
  offerAsDayTripChoice: boolean;
  statusLabel: "Fits Comfortably" | "Needs confirmation" | "Does Not Fit Ship Window";
  sourceUrl: "https://www.viport.com/schedules-ferrycargoschedules";
  checkedOn: string;
}

export interface StThomasEvaluatedOption {
  optionId: string;
  productCode: string | null;
  tourId: string | null;
  title: string;
  shortLabel: string;
  category: StThomasOptionCategory;
  isFreeOrSelfGuided: boolean;
  isDayTripChoice: boolean;
  dayTripDestination: "st-john" | null;
  pickupMode: StThomasPickupMode;
  pickupSummary: string;
  exactMeetingPointOrPickup: string;
  listingPriceUsd: number;
  checkoutUrl: string | null;
  fitStatus: StThomasOptionFitStatus;
  fitBadgeLabel: string;
  conciseVerdict: string;
  dockComparisonNote: string;
  timing: StThomasTimingBreakdown;
  ferryLegs?: StJohnFerryLegEvaluation;
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
  mainDestination: "st-thomas";
  timeZone: "America/St_Thomas";
  evaluatedInput: Required<StThomasPortDayScenarioInput>;
  isExampleScenario: boolean;
  dayOfWeekLabel: string;
  isWeekdaySailing: boolean;
  publicAnswer: StThomasPublicAnswerSummary;
  conciseVerdict: string;
  stJohnDayTripChoice: {
    mainDestination: "st-thomas";
    dayTripDestination: "st-john";
    offeredForSailing: boolean;
    bothFerryLegsFit: boolean;
    fitStatus: StThomasOptionFitStatus;
    fitBadgeLabel: string;
    ferryLegs: StJohnFerryLegEvaluation;
  };
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
    travelDate: "2027-01-28",
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
    "St. Thomas is your primary cruise destination, and your berth changes East End transfer times by 15–20 minutes each way. Ships at Havensight (WICO) sit 1.5 miles east of Historic Charlotte Amalie (walkable along the flat Veterans Drive waterfront promenade) and are 20–25 minutes from Red Hook (St. John ferry) and Mangrove Lagoon Marina (6526 Estate Nadir, where VI Ecotours runs separate 2.5-hour 5199KSML and 3-hour 5199P27 kayak/snorkel tours). Ships at Crown Bay (Austin 'Babe' Monsanto Marine Terminal, AMSS/AMNS) dock 1.7 miles west of downtown in Sub Base: Crown Bay is 5–8 minutes by taxi from VIPA's free-entry Lindbergh Bay (Emerald Beach), but adds 35–45 minutes of cross-island traffic to reach Red Hook. St. John is offered as a day-trip choice only when both Red Hook <-> Cruz Bay ferry legs fit your sailing window with a 90-minute return buffer, and shows 'Needs confirmation' where the post-October 31 return leg schedule is unresolved on VIPA's published notice.",
  dockRules: {
    havensight_wico: {
      dockCode: "WICO",
      officialName: "West Indian Company Dock (Havensight)",
      operatorOrAuthority: "The West Indian Company Limited (WICO)",
      walkabilityToDowntown:
        "Walkable ~1.5 miles (30 min each way) along the flat Veterans Drive harbourfront sidewalk into Historic Downtown Charlotte Amalie, or 8–12 min shared safari taxi.",
      bestFitExcursions: [
        "VI Ecotours Mangrove Lagoon Kayak & Snorkel (5199KSML — 2h 30m, $89, self-drive/taxi to 6526 Estate Nadir)",
        "VI Ecotours Cas Cay Kayak, Hike & Snorkel (5199P27 — 3h 00m, $99, self-drive/taxi to 6526 Estate Nadir)",
        "Shore Excursion: Mangrove Lagoon Kayak & Snorkel w/ transportation (5199PRTSTTKSML — 3h 30m, $79, pickup included)",
        "Self-Guided Historic Charlotte Amalie, Fort Christian Exterior & 99 Steps Walk ($0 walking route)",
        "Magens Bay Park Beach Day ($7/adult, kids <12 free, ~25 min safari taxi each way)",
        "St. John Day-Trip via Red Hook Passenger Ferry (offered when both outbound and return ferry legs fit; shows Needs confirmation where return leg is unresolved)",
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
        "Magens Bay Park Beach Day ($7/adult, kids <12 free, ~30–35 min safari taxi each way)",
        "Snorkeling with Sea Turtles at St. Thomas (5199P36 — 2h 00m, $89, meet at 6526 Estate Nadir)",
      ],
      watchouts: [
        "Do NOT rely on the Crown Bay -> Cruz Bay (St. John) ferry for a morning/daytime port call: VIPA's published schedule departs Crown Bay only at 2:15 PM (weekends), 3:30 PM, and 5:30 PM.",
        "Reaching Red Hook or Mangrove Lagoon (6526 Estate Nadir) from Crown Bay requires crossing through Charlotte Amalie bottleneck traffic (~35–45 min each way).",
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
        "Mangrove Lagoon Kayak & Snorkel (5199KSML 2.5h or 5199P27 3h) once dock is confirmed",
      ],
      watchouts: [
        "Verify whether your ship docks at WICO (Havensight) or Crown Bay (AMSS/AMNS) on VIPA's seaport schedule before booking East End or St. John transfers.",
      ],
    },
  },
  freeAndSelfGuidedSummary:
    "Two free/low-cost self-guided St. Thomas paths work without a commercial tour: (1) the $0 Historic Charlotte Amalie Waterfront, Fort Christian Exterior, Emancipation Garden & 99 Steps walking loop (walkable from WICO or tender; short safari taxi from Crown Bay), and (2) a self-guided beach transfer to VIPA's free-entry Lindbergh Bay (Emerald Beach, 5–8 min from Crown Bay) or Magens Bay Authority Park ($7/adult non-resident, kids under 12 free, open 7:00 AM–5:30 PM).",
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
    label: names[dayIdx] ?? "Thursday",
    isWeekday: dayIdx >= 1 && dayIdx <= 5,
  };
}

const DOCK_DISEMBARK_MINUTES: Record<StThomasArrivalDock, number> = {
  havensight_wico: 20,
  crown_bay: 20,
  charlotte_amalie_tender: 35,
  unknown_dock: 30,
};

/**
 * Evaluates both St. John passenger ferry legs (Red Hook -> Cruz Bay and
 * Cruz Bay -> Red Hook) against the traveler's actual sailing window and trip date.
 *
 * Enforces the VIPA Ferry Schedule Rule:
 * - The temporary VIPA notice (July 26, 2026 through October 31, 2026) ended October 31.
 * - Uses schedules applicable to the trip date (`travelDate`).
 * - Shows `Needs confirmation` where the return leg is unresolved (including all post-Oct 31
 *   dates while VIPA's published schedule page still displays the expired July 26–Oct 31 notice
 *   or weekday midday return gaps).
 */
export function evaluateStJohnFerryLegsForSailing(input: {
  travelDate: string;
  shipArrivalTime: string;
  allAboardTime: string;
  arrivalDock: StThomasArrivalDock;
  returnBufferMinutes?: number;
}): StJohnFerryLegEvaluation {
  const dayInfo = getDayOfWeekInfo(input.travelDate);
  const arrivalMin = parseHmToMinutes(input.shipArrivalTime) ?? 8 * 60;
  const allAboardMin = parseHmToMinutes(input.allAboardTime) ?? 16 * 60 + 30;
  const disembarkMin = DOCK_DISEMBARK_MINUTES[input.arrivalDock];
  const redHookTransferEachWay =
    input.arrivalDock === "havensight_wico"
      ? 25
      : input.arrivalDock === "charlotte_amalie_tender"
        ? 30
        : 40; // crown_bay or unknown_dock
  const mandatoryReturnBufferMin = Math.max(
    90,
    Number(input.returnBufferMinutes ?? 90),
  );

  const isPastTemporaryNoticeEndDate =
    input.travelDate.trim() > "2026-10-31";

  // Earliest passenger arrival at Red Hook Terminal (Urman Fredericks) including 15m ticket/boarding lead
  const earliestRedHookReadyMin =
    arrivalMin + disembarkMin + redHookTransferEachWay + 15;

  // Standard hourly Red Hook -> Cruz Bay departures (06:00 to 23:00 on the hour, plus 05:30)
  // During the temporary notice (Jul 26 - Oct 31) Mon-Fri omitted 09:00, 11:00, 13:00 outbound.
  const standardHourlyDeparturesMin = [
    5 * 60 + 30,
    6 * 60,
    7 * 60,
    8 * 60,
    9 * 60,
    10 * 60,
    11 * 60,
    12 * 60,
    13 * 60,
    14 * 60,
    15 * 60,
    16 * 60,
    17 * 60,
    18 * 60,
  ];
  const weekdayReducedOutboundMin = standardHourlyDeparturesMin.filter(
    (m) => m !== 9 * 60 && m !== 11 * 60 && m !== 13 * 60,
  );

  // Use schedule applicable to travelDate:
  // If within temporary notice window (<= 2026-10-31) and weekday, use weekdayReducedOutboundMin;
  // Post-Oct 31, standard winter hourly departures apply on the hour, but weekday reduced slots are checked for conservative safety.
  const applicableOutboundDeparturesMin =
    !isPastTemporaryNoticeEndDate && dayInfo.isWeekday
      ? weekdayReducedOutboundMin
      : standardHourlyDeparturesMin;

  const selectedOutboundMin =
    applicableOutboundDeparturesMin.find(
      (dep) => dep >= earliestRedHookReadyMin,
    ) ?? null;
  const arrivalAtCruzBayMin =
    selectedOutboundMin !== null ? selectedOutboundMin + 15 : null;

  // Minimum time on St. John for a meaningful Trunk Bay / Cruz Bay visit:
  // 15m Cruz Bay->Trunk Bay taxi + 120m beach/park stay + 15m return taxi + 15m dock boarding lead = 165m after Cruz Bay arrival
  const earliestCruzBayReturnReadyMin =
    arrivalAtCruzBayMin !== null ? arrivalAtCruzBayMin + 165 : null;

  // Latest safe Cruz Bay departure so that (departure + 15m crossing + redHookTransferEachWay <= allAboardMin - mandatoryReturnBufferMin)
  const latestSafeCruzBayDepartureMin =
    allAboardMin - mandatoryReturnBufferMin - redHookTransferEachWay - 15;

  // Standard hourly Cruz Bay -> Red Hook return departures (06:00 to 23:00 on the hour)
  // Temporary notice (Jul 26 - Oct 31) Mon-Fri omitted 10:00, 12:00, 14:00 returns.
  const standardHourlyReturnsMin = [
    7 * 60,
    8 * 60,
    9 * 60,
    10 * 60,
    11 * 60,
    12 * 60,
    13 * 60,
    14 * 60,
    15 * 60,
    16 * 60,
    17 * 60,
    18 * 60,
  ];
  const weekdayReducedReturnsMin = standardHourlyReturnsMin.filter(
    (m) => m !== 10 * 60 && m !== 12 * 60 && m !== 14 * 60,
  );

  const candidateReturnDepartures = standardHourlyReturnsMin.filter(
    (dep) =>
      earliestCruzBayReturnReadyMin !== null &&
      dep >= earliestCruzBayReturnReadyMin &&
      dep <= latestSafeCruzBayDepartureMin,
  );

  // Pick latest safe return that still respects the 90m ship buffer, or earliest after beach stay
  const selectedReturnMin =
    candidateReturnDepartures.length > 0
      ? candidateReturnDepartures[0]!
      : null;

  const arrivalAtRedHookMin =
    selectedReturnMin !== null ? selectedReturnMin + 15 : null;
  const estimatedBackAtShipDockMin =
    arrivalAtRedHookMin !== null
      ? arrivalAtRedHookMin + redHookTransferEachWay
      : null;

  const fitsOutbound = selectedOutboundMin !== null;
  const fitsReturn =
    selectedReturnMin !== null &&
    estimatedBackAtShipDockMin !== null &&
    estimatedBackAtShipDockMin <= allAboardMin - mandatoryReturnBufferMin;

  const bothFerryLegsFit = fitsOutbound && fitsReturn;

  // Determine whether the return leg is resolved or unresolved ("Needs confirmation") for the trip date:
  // 1. The temporary VIPA notice (July 26 – October 31, 2026) ended October 31.
  // 2. For any trip date after October 31, 2026, VIPA's live schedule page (https://www.viport.com/schedules-ferrycargoschedules)
  //    has not yet replaced the expired October 31 notice banner with a verified winter post-Oct 31 return timetable,
  //    or the selected return leg falls in/near the midday Cruz Bay -> Red Hook window where weekday boats (10:00, 12:00, 14:00)
  //    were suspended under the temporary notice.
  const returnHitsTemporaryWeekdayGap =
    selectedReturnMin !== null &&
    dayInfo.isWeekday &&
    !weekdayReducedReturnsMin.includes(selectedReturnMin);

  const returnLegResolved =
    bothFerryLegsFit &&
    !isPastTemporaryNoticeEndDate &&
    !returnHitsTemporaryWeekdayGap;

  let returnLegStatus:
    | "resolved"
    | "unresolved_needs_confirmation"
    | "does_not_fit";
  let unresolvedReason: string | null = null;

  if (!bothFerryLegsFit) {
    returnLegStatus = "does_not_fit";
    unresolvedReason =
      "Outbound Red Hook -> Cruz Bay crossing, 2-hour St. John visit, and return Cruz Bay -> Red Hook leg do not both fit inside the ship's port window with the mandatory 90-minute two-island buffer.";
  } else if (isPastTemporaryNoticeEndDate) {
    returnLegStatus = "unresolved_needs_confirmation";
    unresolvedReason = `The temporary VIPA notice (July 26, 2026 through October 31, 2026) ended October 31, and VIPA's official schedule page (https://www.viport.com/schedules-ferrycargoschedules) has not yet published a replacement winter return timetable for ${input.travelDate} (${dayInfo.label}). Target Cruz Bay -> Red Hook return (${formatMinutesToHm(selectedReturnMin!)}) fits the sailing window mathematically, but the return leg is marked Needs confirmation until VIPA confirms post-October 31 return departures.`;
  } else if (returnHitsTemporaryWeekdayGap) {
    returnLegStatus = "unresolved_needs_confirmation";
    unresolvedReason = `Target Cruz Bay -> Red Hook return (${formatMinutesToHm(selectedReturnMin!)}) falls on a weekday midday slot that requires operator confirmation.`;
  } else {
    returnLegStatus = "resolved";
  }

  const applicableScheduleSummary = isPastTemporaryNoticeEndDate
    ? `Post-October 31 sailing date (${input.travelDate}, ${dayInfo.label}): VIPA's temporary notice (July 26–October 31, 2026) ended October 31. Outbound Red Hook -> Cruz Bay (${selectedOutboundMin !== null ? formatMinutesToHm(selectedOutboundMin) : "none"}) and return Cruz Bay -> Red Hook (${selectedReturnMin !== null ? formatMinutesToHm(selectedReturnMin) : "none"}) are evaluated against the post-Oct 31 hourly baseline; return leg shows 'Needs confirmation' until VIPA publishes the updated winter schedule notice.`
    : `Within July 26–October 31, 2026 VIPA schedule window (${input.travelDate}, ${dayInfo.label}).`;

  return {
    travelDate: input.travelDate,
    dayOfWeekLabel: dayInfo.label,
    isWeekdaySailing: dayInfo.isWeekday,
    temporaryVipaNoticeWindow: {
      startDate: "2026-07-26",
      endDate: "2026-10-31",
      temporaryVipaNoticeEndedOn: "2026-10-31",
      isPastTemporaryNoticeEndDate,
    },
    applicableScheduleSummary,
    outboundLeg: {
      originTerminal: "Red Hook (Urman Victor Fredericks Marine Terminal)",
      destinationTerminal:
        "Cruz Bay, St. John (Loredon Lorence Boynes Sr. Dock)",
      earliestReachableRedHookArrivalTime: formatMinutesToHm(
        earliestRedHookReadyMin,
      ),
      selectedDepartureTime:
        selectedOutboundMin !== null
          ? formatMinutesToHm(selectedOutboundMin)
          : null,
      arrivalAtCruzBayTime:
        arrivalAtCruzBayMin !== null
          ? formatMinutesToHm(arrivalAtCruzBayMin)
          : null,
      crossingMinutes: 15,
      fitsOutbound,
    },
    returnLeg: {
      originTerminal: "Cruz Bay, St. John (Loredon Lorence Boynes Sr. Dock)",
      destinationTerminal:
        "Red Hook (Urman Victor Fredericks Marine Terminal)",
      latestSafeCruzBayDepartureCutoffTime: formatMinutesToHm(
        latestSafeCruzBayDepartureMin,
      ),
      selectedReturnDepartureTime:
        selectedReturnMin !== null
          ? formatMinutesToHm(selectedReturnMin)
          : null,
      arrivalAtRedHookTime:
        arrivalAtRedHookMin !== null
          ? formatMinutesToHm(arrivalAtRedHookMin)
          : null,
      estimatedBackAtShipDockTime:
        estimatedBackAtShipDockMin !== null
          ? formatMinutesToHm(estimatedBackAtShipDockMin)
          : null,
      crossingMinutes: 15,
      fitsReturn,
      returnLegResolved,
      returnLegStatus,
      unresolvedReason,
    },
    bothFerryLegsFit,
    offerAsDayTripChoice: bothFerryLegsFit,
    statusLabel: !bothFerryLegsFit
      ? "Does Not Fit Ship Window"
      : returnLegResolved
        ? "Fits Comfortably"
        : "Needs confirmation",
    sourceUrl: "https://www.viport.com/schedules-ferrycargoschedules",
    checkedOn: "2026-11-06",
  };
}

interface InternalStThomasOptionSpec {
  optionId: string;
  productCode: string | null;
  tourId: string | null;
  title: string;
  shortLabel: string;
  category: StThomasOptionCategory;
  isFreeOrSelfGuided: boolean;
  isDayTripChoice: boolean;
  dayTripDestination: "st-john" | null;
  pickupMode: StThomasPickupMode;
  pickupSummary: string;
  exactMeetingPointOrPickup: string;
  checkoutUrl: string | null;
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
    productCode: null,
    tourId: null,
    title:
      "Free / Self-Guided Charlotte Amalie Historic District, Emancipation Garden & 99 Steps Walk",
    shortLabel: "Self-Guided Historic Charlotte Amalie ($0 Walk)",
    category: "free_or_self_guided",
    isFreeOrSelfGuided: true,
    isDayTripChoice: false,
    dayTripDestination: null,
    pickupMode: "public_walk_or_safari_taxi",
    pickupSummary:
      "Self-guided public walk from WICO/Tender or shared safari taxi from Crown Bay",
    exactMeetingPointOrPickup:
      "Emancipation Garden & Fort Christian Exterior, Downtown Charlotte Amalie, St. Thomas",
    checkoutUrl: null,
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
    productCode: null,
    tourId: null,
    title:
      "Self-Guided Lindbergh Bay Park & Beach (Emerald Beach — Free Entry, Best for Crown Bay)",
    shortLabel: "Self-Guided Lindbergh / Emerald Beach ($0 Entry)",
    category: "free_or_self_guided",
    isFreeOrSelfGuided: true,
    isDayTripChoice: false,
    dayTripDestination: null,
    pickupMode: "public_walk_or_safari_taxi",
    pickupSummary: "Regulated shared safari taxi from cruise dock",
    exactMeetingPointOrPickup:
      "Lindbergh Bay Park and Beach (Emerald Beach), West of Crown Bay, St. Thomas",
    checkoutUrl: null,
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
    productCode: null,
    tourId: null,
    title:
      "Self-Guided Magens Bay Authority Park Beach Day ($7 Adult / Kids Under 12 Free)",
    shortLabel: "Self-Guided Magens Bay Beach ($7 Entry)",
    category: "free_or_self_guided",
    isFreeOrSelfGuided: true,
    isDayTripChoice: false,
    dayTripDestination: null,
    pickupMode: "public_walk_or_safari_taxi",
    pickupSummary:
      "Regulated shared safari taxi from WICO or Crown Bay taxi dispatch stand",
    exactMeetingPointOrPickup:
      "Magens Bay Authority Park Gate (Open 7:00 AM–5:30 PM Daily), North Shore, St. Thomas",
    checkoutUrl: "https://magensbayauthority.org/passes/",
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
    optionId: "stt-opt-viecotours-mangrove-lagoon-5199ksml",
    productCode: "5199KSML",
    tourId: "dcc:tour:viator:5199KSML",
    title:
      "St Thomas Mangrove Lagoon Kayak and Snorkel Tour in the US Virgin Islands (5199KSML)",
    shortLabel: "Mangrove Lagoon Kayak & Snorkel (5199KSML • 2h 30m • $89)",
    category: "guided_eco_or_marine",
    isFreeOrSelfGuided: false,
    isDayTripChoice: false,
    dayTripDestination: null,
    pickupMode: "self_drive",
    pickupSummary:
      "Pickup NOT included (self_drive / taxi to 6526 Estate Nadir Mangrove Lagoon Marina)",
    exactMeetingPointOrPickup:
      "Virgin Islands Ecotours Marina, 6526 Estate Nadir, St. Thomas, VI 00802 (15 min before departure)",
    checkoutUrl:
      "https://www.viator.com/tours/St-Thomas/St-Thomas-Mangrove-Lagoon-Kayak-and-Snorkel-Tour/d965-5199KSML?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=dcc-st-thomas-5199ksml&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
    focusTags: ["any_excursion_or_beach", "mangrove_lagoon_kayak_snorkel"],
    activityDurationMinutes: 150, // Exact listing duration for 5199KSML: 2 hours 30 minutes (150m)
    checkInLeadMinutes: 15,
    transferEachWayByDock: {
      havensight_wico: 25, // 6526 Estate Nadir is ~20-25m east of WICO
      crown_bay: 35, // Crown Bay must cross Charlotte Amalie + Bovoni Rd (~35m each way)
      charlotte_amalie_tender: 30,
      unknown_dock: 35,
    },
    minimumReturnBufferMinutes: 60,
    adultPriceUsd: 89, // Exact listing price for 5199KSML: $89.00
    childUnder12PriceUsd: 89,
    child12PlusPriceUsd: 89,
    estimatedRoundTripTaxiPerPersonUsd: 24,
    costBasisSummary:
      "Exact Viator listing 5199KSML: $89.00/person, 2 hours 30 minutes (150 min), pickup NOT included (meet at 6526 Estate Nadir Mangrove Lagoon Marina; budget ~$24/person R/T taxi).",
    dockComparisonByDock: {
      havensight_wico:
        "From Havensight (WICO), 6526 Estate Nadir is ~20–25 minutes east by taxi. Total required window for 5199KSML (150m tour + 20m disembark + 15m check-in + 50m R/T taxi + 60m buffer) is 295 minutes (4h 55m).",
      crown_bay:
        "From Crown Bay (AMSS/AMNS), taxi transfer to 6526 Estate Nadir is ~35 minutes each way across Charlotte Amalie (total required window: 315 minutes / 5h 15m).",
      charlotte_amalie_tender:
        "Requires 35m tender ashore + 30m taxi each way to 6526 Estate Nadir (total required window: 320 minutes / 5h 20m).",
      unknown_dock:
        "Budget 315 minutes total dock-to-dock for the 150-minute 5199KSML tour until your berth (WICO vs. Crown Bay) is confirmed.",
    },
    accessibilitySummary:
      "Requires active tandem kayaking through Inner Mangrove Lagoon channels and reef snorkeling; not step-free.",
    supportsStepFreeWheelchair: false,
    requiresActiveStairsOrPaddle: true,
    qualifyPendingHumanConfirmation: false,
    supportingSources: [
      {
        organization: "Virgin Islands Ecotours / Viator 5199KSML",
        title:
          "St Thomas Mangrove Lagoon Kayak and Snorkel Tour in the US Virgin Islands (5199KSML — 150m, $89)",
        url: "https://www.viator.com/tours/St-Thomas/St-Thomas-Mangrove-Lagoon-Kayak-and-Snorkel-Tour/d965-5199KSML?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=dcc-st-thomas-5199ksml&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
        checkedOn: "2026-11-06",
      },
    ],
    bookingHandoffUrl:
      "https://www.viator.com/tours/St-Thomas/St-Thomas-Mangrove-Lagoon-Kayak-and-Snorkel-Tour/d965-5199KSML?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=dcc-st-thomas-5199ksml&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
    bookingChannelLabel: "Book Exact Listing 5199KSML (2h 30m • $89)",
  },
  {
    optionId: "stt-opt-viecotours-cas-cay-5199p27",
    productCode: "5199P27",
    tourId: "dcc:tour:viator:5199P27",
    title:
      "Cas Cay Kayak, Hike, and Snorkel Adventure in St. Thomas (5199P27)",
    shortLabel: "Cas Cay Kayak, Hike & Snorkel (5199P27 • 3h 00m • $99)",
    category: "guided_eco_or_marine",
    isFreeOrSelfGuided: false,
    isDayTripChoice: false,
    dayTripDestination: null,
    pickupMode: "self_drive",
    pickupSummary:
      "Pickup NOT included (self_drive / taxi to 6526 Estate Nadir Mangrove Lagoon Marina)",
    exactMeetingPointOrPickup:
      "Virgin Islands Ecotours Marina, 6526 Estate Nadir, St. Thomas, VI 00802 (15 min before departure)",
    checkoutUrl:
      "https://www.viator.com/tours/St-Thomas/Cas-Cay-Kayak-Hike-and-Snorkel-in-St-Thomas/d965-5199P27?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=dcc-st-thomas-5199p27&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
    focusTags: ["any_excursion_or_beach", "mangrove_lagoon_kayak_snorkel"],
    activityDurationMinutes: 180, // Exact listing duration for 5199P27: 3 hours (180m)
    checkInLeadMinutes: 15,
    transferEachWayByDock: {
      havensight_wico: 25,
      crown_bay: 35,
      charlotte_amalie_tender: 30,
      unknown_dock: 35,
    },
    minimumReturnBufferMinutes: 60,
    adultPriceUsd: 99, // Exact listing price for 5199P27: $99.00
    childUnder12PriceUsd: 99,
    child12PlusPriceUsd: 99,
    estimatedRoundTripTaxiPerPersonUsd: 24,
    costBasisSummary:
      "Exact Viator listing 5199P27: $99.00/person, 3 hours (180 min including Cas Cay volcanic cliff & blowhole hike), pickup NOT included (meet at 6526 Estate Nadir Mangrove Lagoon Marina; budget ~$24/person R/T taxi).",
    dockComparisonByDock: {
      havensight_wico:
        "From Havensight (WICO), 6526 Estate Nadir is ~20–25 minutes east by taxi. Total required window for 5199P27 (180m tour + 20m disembark + 15m check-in + 50m R/T taxi + 60m buffer) is 325 minutes (5h 25m).",
      crown_bay:
        "From Crown Bay (AMSS/AMNS), East End taxi transfer increases to ~35 minutes each way (total required window: 345 minutes / 5h 45m).",
      charlotte_amalie_tender:
        "Requires 35m tender ashore + 30m taxi each way to Mangrove Lagoon (total required window: 350 minutes / 5h 50m).",
      unknown_dock:
        "Budget 345 minutes total dock-to-dock for the 180-minute 5199P27 Cas Cay tour until your berth (WICO vs. Crown Bay) is confirmed.",
    },
    accessibilitySummary:
      "Requires active tandem kayaking through mangrove channels, hiking across uneven volcanic coral trails on Cas Cay, and open-water snorkeling.",
    supportsStepFreeWheelchair: false,
    requiresActiveStairsOrPaddle: true,
    qualifyPendingHumanConfirmation: false,
    supportingSources: [
      {
        organization: "Virgin Islands Ecotours / Viator 5199P27",
        title:
          "Cas Cay Kayak, Hike, and Snorkel Adventure in St. Thomas (5199P27 — 180m, $99)",
        url: "https://www.viator.com/tours/St-Thomas/Cas-Cay-Kayak-Hike-and-Snorkel-in-St-Thomas/d965-5199P27?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=dcc-st-thomas-5199p27&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
        checkedOn: "2026-11-06",
      },
      {
        organization: "Virgin Islands Ecotours (VI Ecotours)",
        title:
          "St. Thomas Mangrove Lagoon Tours — 6526 Estate Nadir (Checked 2026-11-06)",
        url: "https://www.viecotours.com/",
        checkedOn: "2026-11-06",
      },
    ],
    bookingHandoffUrl:
      "https://www.viator.com/tours/St-Thomas/Cas-Cay-Kayak-Hike-and-Snorkel-in-St-Thomas/d965-5199P27?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=dcc-st-thomas-5199p27&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
    bookingChannelLabel: "Book Exact Listing 5199P27 (3h 00m • $99)",
  },
  {
    optionId: "stt-opt-viecotours-shorex-transport-5199prtsttksml",
    productCode: "5199PRTSTTKSML",
    tourId: "dcc:tour:viator:5199PRTSTTKSML",
    title:
      "Shore Excursion: Mangrove Lagoon Kayak & Snorkel w transportation (5199PRTSTTKSML)",
    shortLabel:
      "Shore Excursion: Mangrove Kayak & Snorkel w/ Transport (5199PRTSTTKSML • 3h 30m • $79)",
    category: "guided_eco_or_marine",
    isFreeOrSelfGuided: false,
    isDayTripChoice: false,
    dayTripDestination: null,
    pickupMode: "hotel_pickup",
    pickupSummary:
      "Round-trip transportation included in listing (confirm exact WICO vs. Crown Bay gate stop)",
    exactMeetingPointOrPickup:
      "Cruise port / hotel pickup included per 5199PRTSTTKSML listing (confirm exact WICO Gate vs. Crown Bay Windmill dispatch stop on voucher)",
    checkoutUrl:
      "https://www.viator.com/tours/St-Thomas/Shore-Excursion-Mangrove-Lagoon-Kayak-and-Snorkel-w-transportation/d965-5199PRTSTTKSML?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=dcc-st-thomas-5199prtsttksml&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
    focusTags: ["any_excursion_or_beach", "mangrove_lagoon_kayak_snorkel"],
    activityDurationMinutes: 210, // Exact listing duration for 5199PRTSTTKSML: 3h 30m (includes bundled transfer window)
    checkInLeadMinutes: 15,
    transferEachWayByDock: {
      havensight_wico: 10,
      crown_bay: 15,
      charlotte_amalie_tender: 20,
      unknown_dock: 15,
    },
    minimumReturnBufferMinutes: 60,
    adultPriceUsd: 79, // Exact listing price for 5199PRTSTTKSML: $79.00
    childUnder12PriceUsd: 79,
    child12PlusPriceUsd: 79,
    estimatedRoundTripTaxiPerPersonUsd: 0,
    costBasisSummary:
      "Exact Viator listing 5199PRTSTTKSML: $79.00/person, 3 hours 30 minutes (210 min with round-trip transport included).",
    dockComparisonByDock: {
      havensight_wico:
        "From Havensight (WICO), 5199PRTSTTKSML bundles round-trip port transfer into a 210-minute shore excursion window.",
      crown_bay:
        "From Crown Bay (AMSS/AMNS), verify on your voucher that Crown Bay pickup is confirmed for your departure slot.",
      charlotte_amalie_tender:
        "Budget 35m tender ashore to meet the downtown/port pickup point.",
      unknown_dock:
        "Confirm whether your ship docks at WICO or Crown Bay when selecting your pickup point at checkout.",
    },
    accessibilitySummary:
      "Requires tandem kayaking and reef snorkeling; not step-free.",
    supportsStepFreeWheelchair: false,
    requiresActiveStairsOrPaddle: true,
    qualifyPendingHumanConfirmation: false,
    supportingSources: [
      {
        organization: "Virgin Islands Ecotours / Viator 5199PRTSTTKSML",
        title:
          "Shore Excursion: Mangrove Lagoon Kayak & Snorkel w transportation (5199PRTSTTKSML — 210m, $79)",
        url: "https://www.viator.com/tours/St-Thomas/Shore-Excursion-Mangrove-Lagoon-Kayak-and-Snorkel-w-transportation/d965-5199PRTSTTKSML?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=dcc-st-thomas-5199prtsttksml&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
        checkedOn: "2026-11-06",
      },
    ],
    bookingHandoffUrl:
      "https://www.viator.com/tours/St-Thomas/Shore-Excursion-Mangrove-Lagoon-Kayak-and-Snorkel-w-transportation/d965-5199PRTSTTKSML?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=dcc-st-thomas-5199prtsttksml&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
    bookingChannelLabel: "Book Exact Listing 5199PRTSTTKSML (3h 30m • $79)",
  },
  {
    optionId: "stt-opt-snorkeling-with-sea-turtles-5199p36",
    productCode: "5199P36",
    tourId: "dcc:tour:viator:5199P36",
    title: "Snorkeling with Sea Turtles at St. Thomas (5199P36)",
    shortLabel: "Snorkeling with Sea Turtles (5199P36 • 2h 00m • $89)",
    category: "guided_eco_or_marine",
    isFreeOrSelfGuided: false,
    isDayTripChoice: false,
    dayTripDestination: null,
    pickupMode: "self_drive",
    pickupSummary:
      "Pickup NOT included (self_drive / taxi to 6526 Estate Nadir Mangrove Lagoon Marina)",
    exactMeetingPointOrPickup:
      "Virgin Islands Ecotours Marina, 6526 Estate Nadir, St. Thomas, VI 00802 (15 min before departure)",
    checkoutUrl:
      "https://www.viator.com/tours/St-Thomas/Snorkeling-with-Sea-Turtles-at-St.Thomas/d965-5199P36?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=dcc-st-thomas-5199p36&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US".replace(
        "St.Thomas",
        "St-Thomas",
      ),
    focusTags: ["any_excursion_or_beach", "st_john_ferry_or_catamaran"],
    activityDurationMinutes: 120, // Exact listing duration for 5199P36: 2 hours (120m)
    checkInLeadMinutes: 15,
    transferEachWayByDock: {
      havensight_wico: 25,
      crown_bay: 35,
      charlotte_amalie_tender: 30,
      unknown_dock: 35,
    },
    minimumReturnBufferMinutes: 60,
    adultPriceUsd: 89, // Exact listing price for 5199P36: $89.00
    childUnder12PriceUsd: 89,
    child12PlusPriceUsd: 89,
    estimatedRoundTripTaxiPerPersonUsd: 24,
    costBasisSummary:
      "Exact Viator listing 5199P36: $89.00/person, 2 hours (120 min), pickup NOT included (meet at 6526 Estate Nadir; budget ~$24/person R/T taxi).",
    dockComparisonByDock: {
      havensight_wico:
        "From Havensight (WICO), 20–25 minutes east by taxi to 6526 Estate Nadir (total required window: 265 minutes / 4h 25m).",
      crown_bay:
        "From Crown Bay (AMSS/AMNS), allow 35 minutes each way by taxi (total required window: 285 minutes / 4h 45m).",
      charlotte_amalie_tender:
        "Allow 35m tender ashore + 30m taxi each way (total required window: 290 minutes / 4h 50m).",
      unknown_dock:
        "Fits 5+ hour St. Thomas calls from either WICO or Crown Bay.",
    },
    accessibilitySummary:
      "Boat boarding and open-water sea turtle snorkeling; not step-free.",
    supportsStepFreeWheelchair: false,
    requiresActiveStairsOrPaddle: false,
    qualifyPendingHumanConfirmation: false,
    supportingSources: [
      {
        organization: "Virgin Islands Ecotours / Viator 5199P36",
        title: "Snorkeling with Sea Turtles at St. Thomas (5199P36 — 120m, $89)",
        url: "https://www.viator.com/tours/St-Thomas/Snorkeling-with-Sea-Turtles-at-St-Thomas/d965-5199P36?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=dcc-st-thomas-5199p36&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
        checkedOn: "2026-11-06",
      },
    ],
    bookingHandoffUrl:
      "https://www.viator.com/tours/St-Thomas/Snorkeling-with-Sea-Turtles-at-St-Thomas/d965-5199P36?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=dcc-st-thomas-5199p36&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
    bookingChannelLabel: "Book Exact Listing 5199P36 (2h 00m • $89)",
  },
  {
    optionId: "stt-opt-st-john-trunk-bay-red-hook-ferry",
    productCode: null,
    tourId: null,
    title:
      "St. John Day-Trip Choice: Trunk Bay (Virgin Islands National Park) via VIPA Red Hook Passenger Ferry",
    shortLabel: "St. John Day-Trip via Red Hook Ferry (Both Ferry Legs Checked)",
    category: "two_island_ferry_excursion",
    isFreeOrSelfGuided: true,
    isDayTripChoice: true,
    dayTripDestination: "st-john",
    pickupMode: "public_ferry_and_safari_taxi",
    pickupSummary:
      "Shared safari taxi to Red Hook (Urman Fredericks Terminal) + VIPA 15-min ferry to Cruz Bay + St. John safari taxi",
    exactMeetingPointOrPickup:
      "Urman Victor Fredericks Marine Terminal (Red Hook, St. Thomas) <-> Loredon Lorence Boynes Sr. Dock (Cruz Bay, St. John)",
    checkoutUrl: "https://www.viport.com/schedules-ferrycargoschedules",
    focusTags: ["any_excursion_or_beach", "st_john_ferry_or_catamaran"],
    // 15m Red Hook check-in + 15m outbound ferry + 15m Cruz Bay->Trunk Bay taxi + 120m Trunk Bay beach + 15m return taxi + 15m return ferry wait + 15m return crossing = 195m activity from Red Hook check-in completion
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
        "From Havensight (WICO), Red Hook (Urman Fredericks Marine Terminal) is ~25 minutes east by taxi. Offered as a St. John day-trip choice when both outbound (Red Hook -> Cruz Bay) and return (Cruz Bay -> Red Hook) ferry legs fit your sailing with a 90-minute return buffer.",
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
      "The temporary VIPA notice (July 26, 2026 through October 31, 2026) ended October 31. Where the post-October 31 Cruz Bay -> Red Hook return leg schedule is unresolved on VIPA's published page, St. John is shown as 'Needs confirmation'.",
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
 * eliminated options, dock-specific transfer math, free/self-guided choices,
 * St. John day-trip ferry-leg evaluation, and explicit `unknown` markers.
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

  const stJohnFerryEvaluation = evaluateStJohnFerryLegsForSailing({
    travelDate: input.travelDate,
    shipArrivalTime: input.shipArrivalTime,
    allAboardTime: input.allAboardTime,
    arrivalDock: input.arrivalDock,
    returnBufferMinutes: Math.max(input.returnBufferMinutes, 90),
  });

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
        "The temporary VIPA passenger ferry notice ('July 26, 2026 through October 31, 2026') ended October 31, and VIPA's schedule page (checked 2026-11-06) has not yet published the replacement winter 2026/2027 Cruz Bay -> Red Hook return timetable.",
      impactOnDecision:
        "St. John day-trip return ferry timing shows 'Needs confirmation' where the post-October 31 return leg is unresolved.",
      sourceUrl: "https://www.viport.com/schedules-ferrycargoschedules",
      checkedOn: "2026-11-06",
    },
    {
      factId: "stt-unknown-pier-pickup-equivalence-wico-vs-crown-bay",
      status: "unknown",
      category: "operator_confirmation_required",
      summary:
        "Third-party Viator shore excursion listings in St. Thomas do not uniformly guarantee that Crown Bay (AMSS/AMNS) pier pickup is included at the same time or price as Havensight (WICO) pickup.",
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
        "Traveler sailing date was not supplied; evaluating against default winter sailing date (2027-01-28).",
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

      if (spec.optionId === "stt-opt-st-john-trunk-bay-red-hook-ferry") {
        if (!accessibilityCompatible) {
          fitStatus = "does_not_fit";
          fitBadgeLabel = "Eliminated — Accessibility / Mobility Constraint";
          conciseVerdict = `Eliminated for ${input.mobilityLevel}: ${spec.accessibilitySummary}`;
        } else if (!stJohnFerryEvaluation.bothFerryLegsFit || netMarginMinutes < 0) {
          fitStatus = "does_not_fit";
          fitBadgeLabel = "Does Not Fit Ship Window";
          conciseVerdict = `St. John day-trip requires both outbound (Red Hook -> Cruz Bay) and return (Cruz Bay -> Red Hook) ferry legs to fit with a ${requiredReturnBufferMinutes}m return buffer (${totalRequiredMinutes}m total required vs. ${totalPortWindowMinutes}m port window).`;
        } else if (!stJohnFerryEvaluation.returnLeg.returnLegResolved) {
          fitStatus = "qualified_needs_confirmation";
          fitBadgeLabel = "Needs confirmation";
          conciseVerdict = `St. John offered as a day-trip choice (outbound Red Hook ferry ${stJohnFerryEvaluation.outboundLeg.selectedDepartureTime}, target Cruz Bay return ${stJohnFerryEvaluation.returnLeg.selectedReturnDepartureTime}, +${netMarginMinutes}m slack), but shows 'Needs confirmation': ${stJohnFerryEvaluation.returnLeg.unresolvedReason}`;
        } else {
          fitStatus = "fits_comfortably";
          fitBadgeLabel = "Fits Comfortably";
          conciseVerdict = `Both St. John ferry legs fit your sailing (${stJohnFerryEvaluation.outboundLeg.selectedDepartureTime} Red Hook -> Cruz Bay; ${stJohnFerryEvaluation.returnLeg.selectedReturnDepartureTime} Cruz Bay -> Red Hook) with +${netMarginMinutes}m slack beyond the ${requiredReturnBufferMinutes}m two-island buffer.`;
        }
      } else if (!accessibilityCompatible) {
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
        fitStatus = "qualified_needs_confirmation";
        fitBadgeLabel = "Needs confirmation";
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
        return true;
      });

      return {
        optionId: spec.optionId,
        productCode: spec.productCode,
        tourId: spec.tourId,
        title: spec.title,
        shortLabel: spec.shortLabel,
        category: spec.category,
        isFreeOrSelfGuided: spec.isFreeOrSelfGuided,
        isDayTripChoice: spec.isDayTripChoice,
        dayTripDestination: spec.dayTripDestination,
        pickupMode: spec.pickupMode,
        pickupSummary: spec.pickupSummary,
        exactMeetingPointOrPickup: spec.exactMeetingPointOrPickup,
        listingPriceUsd: spec.adultPriceUsd,
        checkoutUrl: spec.checkoutUrl,
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
        ...(spec.optionId === "stt-opt-st-john-trunk-bay-red-hook-ferry"
          ? { ferryLegs: stJohnFerryEvaluation }
          : {}),
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

  // Rank viable options: keep St. Thomas main destination options ahead of St. John day-trip choice unless user focused on St. John, then fit tier, then net margin, with zero commercial weight
  const fitOrder: Record<StThomasOptionFitStatus, number> = {
    fits_comfortably: 1,
    qualified_needs_confirmation: 2,
    tight_buffer: 3,
    does_not_fit: 4,
  };

  const recommendedOptions = allOptions
    .filter((o) => o.fitStatus !== "does_not_fit")
    .sort((a, b) => {
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

  const stJohnOpt = allOptions.find(
    (o) => o.optionId === "stt-opt-st-john-trunk-bay-red-hook-ferry",
  )!;

  const topOption = recommendedOptions[0] ?? null;
  const dockName =
    ST_THOMAS_PUBLIC_ANSWER_SUMMARY.dockRules[input.arrivalDock].officialName;

  const conciseVerdict = topOption
    ? `For your ${(totalPortWindowMinutes / 60).toFixed(1)}-hour St. Thomas call (${input.shipArrivalTime}–${input.allAboardTime} AST) at ${dockName}, ${recommendedOptions.length} of ${allOptions.length} paths fit your window. Top fit: ${topOption.shortLabel} (${topOption.fitBadgeLabel}, +${topOption.timing.netMarginMinutes}m buffer slack).`
    : `No standard St. Thomas excursion fits your ${(totalPortWindowMinutes / 60).toFixed(1)}-hour window (${input.shipArrivalTime}–${input.allAboardTime}) and mobility profile (${input.mobilityLevel}) without violating the required all-aboard buffer; remain on the immediate pier apron or pre-arrange a step-free accessible van.`;

  return {
    portSlug: "st-thomas",
    mainDestination: "st-thomas",
    timeZone: "America/St_Thomas",
    evaluatedInput: input,
    isExampleScenario,
    dayOfWeekLabel: dayInfo.label,
    isWeekdaySailing: dayInfo.isWeekday,
    publicAnswer: ST_THOMAS_PUBLIC_ANSWER_SUMMARY,
    conciseVerdict,
    stJohnDayTripChoice: {
      mainDestination: "st-thomas",
      dayTripDestination: "st-john",
      offeredForSailing:
        stJohnOpt.fitStatus !== "does_not_fit" &&
        stJohnFerryEvaluation.bothFerryLegsFit,
      bothFerryLegsFit: stJohnFerryEvaluation.bothFerryLegsFit,
      fitStatus: stJohnOpt.fitStatus,
      fitBadgeLabel: stJohnOpt.fitBadgeLabel,
      ferryLegs: stJohnFerryEvaluation,
    },
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
