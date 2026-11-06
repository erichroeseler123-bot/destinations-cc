/**
 * DCC Coverage — Daily Seasonal Priority Scheduler, Official Source Change Queue,
 * and Preseason Calendar Trigger Engine.
 *
 * Schedule: Daily at 8:00 a.m. Mountain Time (`CRON_TZ=America/Denver 0 8 * * *`),
 * with weekly calendar rechecks (`calendarRecheckIntervalDays: 7`) so the queue
 * follows published ship calls and actual tour booking dates automatically.
 *
 * Human Governance Boundary:
 * - Machine runs NEVER mark any candidate fact as Confirmed (`verified: false`,
 *   `status: "needs confirmation"`, `verified_on: null`, `verified_by: null`).
 * - Fact approval, production publishing, and commercial terms remain strictly
 *   with the human reviewer.
 * - One expansion draft PR is kept in progress and updated after tests pass.
 */

export type DccCoverageTrackStage =
  | "active_winter_build"
  | "active_sales_test"
  | "active_build_ready"
  | "preseason_preparation"
  | "completed_monitoring";

export type DccCoveragePortSlug =
  | "st-thomas"
  | "new-orleans"
  | "ketchikan"
  | "skagway"
  | "sitka";

export interface DccCoverageBuildDeliverables {
  publicAnswerReady: boolean;
  actualTripCheckerReady: boolean;
  freeOrSelfGuidedOptionReady: boolean;
  unsupportedFactsMarkedUnknown: boolean;
  publicAnswerPath: string;
  checkerEngineModule: string | null;
}

export interface DccSeasonalCalendarWindow {
  seasonLabel: string;
  seasonStart: string; // YYYY-MM-DD
  seasonEnd: string; // YYYY-MM-DD
  firstPublishedCallDate: string; // YYYY-MM-DD
  earliestBookableTourDate: string; // YYYY-MM-DD
  publishedCallSourceUrl: string;
  bookingCalendarSourceUrl: string;
  lastCalendarCheckedOn: string; // YYYY-MM-DD
}

export interface DccPreseasonTriggerStatus {
  applicable: boolean;
  leadWindowWeeks: { minWeeks: 8; maxWeeks: 12 };
  firstPublishedCallDate: string;
  fullBuildWindowOpensOn: string; // 12 weeks (84 days) before firstPublishedCallDate
  fullBuildMustStartBy: string; // 8 weeks (56 days) before firstPublishedCallDate
  daysUntilFirstPublishedCall: number;
  weeksUntilFirstPublishedCall: number;
  isWithin8To12WeekBuildWindow: boolean;
  isPast8WeekDeadline: boolean;
  triggerVerdict:
    | "not_applicable_active_winter"
    | "preseason_prep_awaiting_window"
    | "start_full_alaska_build_now";
}

export interface DccCoverageQueueItem {
  portSlug: DccCoveragePortSlug;
  displayName: string;
  priorityRank: number;
  stage: DccCoverageTrackStage;
  coreTravelerQuestion: string;
  seasonalRationale: string;
  calendar: DccSeasonalCalendarWindow;
  preseasonTrigger: DccPreseasonTriggerStatus;
  deliverables: DccCoverageBuildDeliverables;
  stagedResearchCandidatesCount: number;
  queuedMaterialChangesCount: number;
}

export interface DccMaterialChangeQueueItem {
  changeId: string;
  portSlug: DccCoveragePortSlug;
  clusterId:
    | "usvi-st-thomas"
    | "new-orleans-swamp"
    | "alaska-ketchikan"
    | "alaska-skagway"
    | "alaska-sitka";
  productId: string;
  constraintType: string;
  sourceOrganization: string;
  sourceTitle: string;
  sourceUrl: string;
  sourceSha256: string;
  dateChecked: string; // YYYY-MM-DD
  checkedAtIso: string;
  previousPublishedState: string;
  observedOfficialState: string;
  whichRecommendationChanges: string;
  humanDecisionRequired: string;
  reviewStatus: "needs_confirmation";
  verified: false;
  verifiedOn: null;
  verifiedBy: null;
}

export interface DccNewOrleansSalesTestStatus {
  testId: "nola-hotel-pickup-sales-test-2026";
  status: "active_moving";
  conciergePilotProperties: Array<{
    propertySlug: string;
    propertyName: string;
    address: string;
    airboatAdventuresNamedStopStatus:
      | "confirmed_named_stop"
      | "adjacent_stop_confirmation_needed";
    pickupNote: string;
  }>;
  trackedProducts: string[];
  relatedDraftPrNumbers: number[];
  officialSourcesCheckedOn: string;
  keyOperationalFinding: string;
}

export interface DccCoveragePassReport {
  automationId: "dcc-coverage";
  displayName: "DCC Coverage";
  cronExpression: "CRON_TZ=America/Denver 0 8 * * *";
  timeZone: "America/Denver";
  evaluatedOnDate: string;
  evaluatedAtIso: string;
  nextDailyRunMountainIso: string;
  nextDailyRunUtcIso: string;
  calendarRecheckIntervalDays: 7;
  lastCalendarCheckedOn: string;
  nextWeeklyCalendarRecheckOn: string;
  calendarRecheckDueNow: boolean;
  activeBuildPort: DccCoverageQueueItem;
  parallelSalesTest: DccNewOrleansSalesTestStatus;
  orderedQueue: DccCoverageQueueItem[];
  queuedMaterialChanges: DccMaterialChangeQueueItem[];
  humanDecisionsNeeded: Array<{
    decisionId: string;
    area: DccCoveragePortSlug | "commercial_and_publishing";
    summary: string;
    optionsOrAction: string;
    blockingForProductionPublish: boolean;
  }>;
  humanGovernanceBoundary: {
    factApprovalWithHumanReviewer: true;
    productionPublishingWithHumanReviewer: true;
    commercialTermsWithHumanReviewer: true;
    singleExpansionDraftPrInProgress: true;
    autoApprovedFactsCount: 0;
  };
}

export const ALASKA_PRESEASON_LEAD_WINDOW_WEEKS = {
  minWeeks: 8 as const,
  maxWeeks: 12 as const,
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseDateUtcMidnightMs(ymd: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) {
    throw new Error(`Invalid YYYY-MM-DD date string: ${ymd}`);
  }
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function formatUtcMsToYmd(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDaysYmd(ymd: string, days: number): string {
  return formatUtcMsToYmd(parseDateUtcMidnightMs(ymd) + days * MS_PER_DAY);
}

/**
 * Evaluates the 8-12 week preseason lead trigger before a port's first published ship call.
 */
export function evaluateAlaskaPreseasonTrigger(params: {
  asOfDate: string;
  firstPublishedCallDate: string;
  applicable: boolean;
}): DccPreseasonTriggerStatus {
  const { asOfDate, firstPublishedCallDate, applicable } = params;
  const fullBuildWindowOpensOn = addDaysYmd(firstPublishedCallDate, -84); // 12 weeks prior
  const fullBuildMustStartBy = addDaysYmd(firstPublishedCallDate, -56); // 8 weeks prior
  const diffDays = Math.round(
    (parseDateUtcMidnightMs(firstPublishedCallDate) -
      parseDateUtcMidnightMs(asOfDate)) /
      MS_PER_DAY,
  );
  const diffWeeks = Number((diffDays / 7).toFixed(1));

  if (!applicable) {
    return {
      applicable: false,
      leadWindowWeeks: ALASKA_PRESEASON_LEAD_WINDOW_WEEKS,
      firstPublishedCallDate,
      fullBuildWindowOpensOn,
      fullBuildMustStartBy,
      daysUntilFirstPublishedCall: Math.max(0, diffDays),
      weeksUntilFirstPublishedCall: Math.max(0, diffWeeks),
      isWithin8To12WeekBuildWindow: false,
      isPast8WeekDeadline: false,
      triggerVerdict: "not_applicable_active_winter",
    };
  }

  const isWithin8To12WeekBuildWindow = diffDays <= 84 && diffDays >= 56;
  const isPast8WeekDeadline = diffDays < 56 && diffDays >= -150;
  const shouldStartNow = isWithin8To12WeekBuildWindow || isPast8WeekDeadline;

  return {
    applicable: true,
    leadWindowWeeks: ALASKA_PRESEASON_LEAD_WINDOW_WEEKS,
    firstPublishedCallDate,
    fullBuildWindowOpensOn,
    fullBuildMustStartBy,
    daysUntilFirstPublishedCall: diffDays,
    weeksUntilFirstPublishedCall: diffWeeks,
    isWithin8To12WeekBuildWindow,
    isPast8WeekDeadline,
    triggerVerdict: shouldStartNow
      ? "start_full_alaska_build_now"
      : "preseason_prep_awaiting_window",
  };
}

/**
 * Determines whether the weekly calendar recheck is due (every 7 days).
 */
export function isWeeklyCalendarRecheckDue(
  asOfDate: string,
  lastCalendarCheckedOn: string,
): boolean {
  const elapsedDays = Math.round(
    (parseDateUtcMidnightMs(asOfDate) -
      parseDateUtcMidnightMs(lastCalendarCheckedOn)) /
      MS_PER_DAY,
  );
  return elapsedDays >= 7;
}

/**
 * Computes the next daily 8:00 a.m. Mountain Time (`America/Denver`) scheduled run.
 * Note: US Mountain Time transitions from MDT (UTC-06:00) to MST (UTC-07:00) on the
 * first Sunday of November (Nov 1, 2026), and returns to MDT on the second Sunday of March.
 */
export function computeNextDailyMountainRun(asOfDate: string): {
  nextRunDate: string;
  nextDailyRunMountainIso: string;
  nextDailyRunUtcIso: string;
} {
  const nextRunDate = addDaysYmd(asOfDate, 1);
  const month = Number(nextRunDate.slice(5, 7));
  // Nov, Dec, Jan, Feb are standard time (MST -07:00); Apr-Oct are daylight time (MDT -06:00).
  const isMdt = month >= 4 && month <= 10;
  const offset = isMdt ? "-06:00" : "-07:00";
  const utcHour = isMdt ? "14:00:00.000Z" : "15:00:00.000Z";
  return {
    nextRunDate,
    nextDailyRunMountainIso: `${nextRunDate}T08:00:00${offset}`,
    nextDailyRunUtcIso: `${nextRunDate}T${utcHour}`,
  };
}

/**
 * Material changes queued from official port, transportation, and operator sources on 2026-11-06.
 * All items remain `reviewStatus: "needs_confirmation"` and `verified: false` until human review.
 */
export const QUEUED_MATERIAL_CHANGES_2026_11_06: DccMaterialChangeQueueItem[] = [
  {
    changeId: "mc-stt-viecotours-cas-cay-duration-20261106",
    portSlug: "st-thomas",
    clusterId: "usvi-st-thomas",
    productId: "viecotours-cas-cay-kayak-hike-snorkel-direct",
    constraintType: "total_duration",
    sourceOrganization: "Virgin Islands Ecotours (VI Ecotours)",
    sourceTitle:
      "VI Ecotours Official St. Thomas Tours — Cas Cay Kayak, Hike & Snorkel Adventure (Published Nov 5, 2026)",
    sourceUrl: "https://www.viecotours.com/",
    sourceSha256:
      "ffe87b18e633ce15889f0480e241ac81ea52637e6cb719c5d39a5b0b27ff1b52",
    dateChecked: "2026-11-06",
    checkedAtIso: "2026-11-06T10:40:46.000Z",
    previousPublishedState:
      "data/seasonal-operator-pages.json (checked 2026-10-30) and Viator 5199KSML listed duration as 2 hours 30 minutes (150 minutes).",
    observedOfficialState:
      "Live operator homepage (PublicationDate: Nov 05, 2026) lists '3 Hours — Cas Cay Kayak, Hike & Snorkel Adventure — From $99' departing Mangrove Lagoon Marina (6526 Estate Nadir, St. Thomas, VI 00802), alongside a 5-Hour 'Best of Cas Cay with Lunch ($159)' and 2-Hour 'Snorkeling with Sea Turtles ($89)'.",
    whichRecommendationChanges:
      "Increases the St. Thomas Cas Cay Kayak, Hike & Snorkel planning duration from 150m to 180m (+15m check-in, +50m round-trip taxi from Havensight/WICO or +70m from Crown Bay, +60m all-aboard buffer = 305m required from WICO vs. 325m from Crown Bay). Shifts 5.0-to-5.25-hour Crown Bay port calls from 'fits_comfortably' to 'tight_buffer' / 'does_not_fit'.",
    humanDecisionRequired:
      "Confirm whether 180 minutes (3 hours) should replace the 150-minute baseline for VI Ecotours Cas Cay Kayak, Hike & Snorkel (5199KSML / viecotours) in the approved-facts feed.",
    reviewStatus: "needs_confirmation",
    verified: false,
    verifiedOn: null,
    verifiedBy: null,
  },
  {
    changeId: "mc-stt-vipa-ferry-schedule-and-crown-bay-afternoon-only-20261106",
    portSlug: "st-thomas",
    clusterId: "usvi-st-thomas",
    productId: "vipa-red-hook-and-crown-bay-st-john-ferry",
    constraintType: "pickup_and_transport",
    sourceOrganization: "Virgin Islands Port Authority (VIPA)",
    sourceTitle:
      "VIPA Official Ferry & Cargo Vessel Schedules & Seaport Cruise Schedules (FY2027)",
    sourceUrl: "https://www.viport.com/schedules-ferrycargoschedules",
    sourceSha256:
      "acd86c31de4ed5ae57ab2c3cfe17d5200bd1058036cfae35b59ae825520d5464",
    dateChecked: "2026-11-06",
    checkedAtIso: "2026-11-06T11:25:43.000Z",
    previousPublishedState:
      "St. Thomas port pages lacked dock-specific Red Hook vs. Crown Bay vs. Charlotte Amalie St. John passenger ferry rules and weekday return gap warnings.",
    observedOfficialState:
      "VIPA publishes: (1) Red Hook (Urman Fredericks Terminal) <-> Cruz Bay (Loredon Boynes Dock) 15-min crossing at $8.15 non-resident adult / $1.00 child (2-11) / $4.00 luggage with 15-min pre-departure check-in; (2) temporary off-season schedule banner dated 'July 26, 2026 through October 31, 2026' still posted on Nov 6, 2026 showing Mon-Fri Cruz Bay -> Red Hook return gaps (no 10:00 AM, 12:00 PM, or 2:00 PM weekday departures); (3) Crown Bay -> Cruz Bay ferry (Inter Island Boat Services, $20 adult) departs ONLY at 2:15 PM (Sat/Sun), 3:30 PM, and 5:30 PM.",
    whichRecommendationChanges:
      "Disqualifies morning cruise arrivals at Crown Bay (AMSS/AMNS) from using the Crown Bay ferry outbound to St. John (forcing a 35-45 min cross-island taxi to Red Hook or a direct catamaran excursion), requires a >= 6.5-to-7.0 hour port call window for independent St. John Trunk Bay visits, and marks weekday midday Cruz Bay -> Red Hook return departures (10:00, 12:00, 14:00) as 'unknown' until VIPA posts the post-Oct-31 winter bulletin.",
    humanDecisionRequired:
      "Confirm the VIPA Red Hook ($8.15 / 15m crossing) and Crown Bay afternoon-only ferry constraints in the review desk, and verify whether hourly weekday midday returns have resumed for November 2026.",
    reviewStatus: "needs_confirmation",
    verified: false,
    verifiedOn: null,
    verifiedBy: null,
  },
  {
    changeId: "mc-stt-magens-bay-nonresident-admission-20261106",
    portSlug: "st-thomas",
    clusterId: "usvi-st-thomas",
    productId: "magens-bay-authority-beach-admission",
    constraintType: "price",
    sourceOrganization: "Magens Bay Authority (St. Thomas, USVI)",
    sourceTitle:
      "Passes – Magens Bay Authority Official Website (6200 Magens Bay Road)",
    sourceUrl: "https://magensbayauthority.org/passes/",
    sourceSha256:
      "b3b0060dcb2ee2471ee76456251ab03b1c83bf27db5e75c2c2d6f059d91e92b2",
    dateChecked: "2026-11-06",
    checkedAtIso: "2026-11-06T10:43:40.000Z",
    previousPublishedState:
      "No verified Magens Bay Authority park pass tariff or operating gate hours in St. Thomas port config.",
    observedOfficialState:
      "Magens Bay Authority official tariff: Non-Residents Daily $7.00 per person, Kids under 12 FREE, Residents Daily $2.00 (local ID required), Parking $2.00; open daily 7:00 AM - 5:30 PM.",
    whichRecommendationChanges:
      "Sets the self-guided Magens Bay beach option entry cost at $7.00 per non-resident adult ($0 under age 12) and enforces 7:00 AM - 5:30 PM operating hours in the St. Thomas trip checker.",
    humanDecisionRequired:
      "Confirm the $7.00 non-resident adult / $0 under-12 Magens Bay Authority admission fact in the review desk.",
    reviewStatus: "needs_confirmation",
    verified: false,
    verifiedOn: null,
    verifiedBy: null,
  },
  {
    changeId: "mc-nola-airboat-adventures-75min-pickup-window-20261106",
    portSlug: "new-orleans",
    clusterId: "new-orleans-swamp",
    productId: "airboat-adventures-swamp-shuttle-direct",
    constraintType: "pickup_rules",
    sourceOrganization: "Airboat Adventures (5145 Fleming Park Rd, Lafitte, LA)",
    sourceTitle:
      "Pickup Locations & Transportation Policy — Airboat Adventures Official Site",
    sourceUrl: "https://airboatadventures.com/pickup-locations/",
    sourceSha256:
      "cd64cafa213260c685af2269679b77ca38e757790fba6ddf636ac618d3070d56",
    dateChecked: "2026-11-06",
    checkedAtIso: "2026-11-06T10:41:54.000Z",
    previousPublishedState:
      "https://airboatadventures.com/pickup-locations/ previously failed in dcc-research/CHECKPOINT.json; exact pre-tour pickup window duration and Warehouse District stop mapping were unconfirmed.",
    observedOfficialState:
      "Live fetch succeeded on 2026-11-06: 'The pickup window begins 1 hour and 15 minutes (75 minutes) before tour time. Guests must be waiting outside their pickup location for the entire pickup window... Roundtrip transportation is an extra $30 per person.' Named stops include Monteleone (214 Royal St) and Roosevelt (123 Baronne St); Omni Riverfront (701 Convention Center Blvd) is not listed by name (closest named stops: New Orleans Marriott Warehouse Arts District on Convention Center Blvd and Embassy Suites at 315 Julia St).",
    whichRecommendationChanges:
      "Updates the New Orleans hotel-pickup sales test: (1) enforces a 75-minute pre-tour curbside pickup window for Airboat Adventures (6455NOLAAIR) from Hotel Monteleone and The Roosevelt; (2) qualifies Omni Riverfront (omni-riverfront-nola) pickups for 6455NOLAAIR as requiring adjacent Warehouse District pickup-stop confirmation.",
    humanDecisionRequired:
      "Review and confirm the 75-minute pickup window and named hotel stop list for Airboat Adventures in the New Orleans swamp review queue.",
    reviewStatus: "needs_confirmation",
    verified: false,
    verifiedOn: null,
    verifiedBy: null,
  },
  {
    changeId: "mc-ktn-ward-cove-shuttle-and-2027-preseason-20261106",
    portSlug: "ketchikan",
    clusterId: "alaska-ketchikan",
    productId: "ward-cove-complimentary-bus",
    constraintType: "pickup_and_transport",
    sourceOrganization: "The Mill at Ward Cove (Ketchikan, AK)",
    sourceTitle:
      "Schedules & Ward Cove Shuttle Operations — The Mill at Ward Cove",
    sourceUrl: "https://wardcoveak.com/schedules/",
    sourceSha256:
      "e6fbb9328c0f68a3130e4b2086c2dc903326214389df0c1ca28ba6158bccdbe3",
    dateChecked: "2026-11-06",
    checkedAtIso: "2026-11-06T10:40:54.000Z",
    previousPublishedState:
      "Ketchikan Ward Cove shuttle timing and 2027 schedule publication status were awaiting preseason check.",
    observedOfficialState:
      "Official Ward Cove schedules page still displays the 2026 Ship Schedule PDF (2027 schedule PDF not yet published as of 2026-11-06) and specifies: complimentary shuttle runs between the far end of Ward Cove Welcome Center and Berth IV in downtown Ketchikan (~20 min drive each way; allow at least 30 minutes to reach Berth IV for a scheduled appointment, plus 15 minutes walk from Berth IV to the center of downtown).",
    whichRecommendationChanges:
      "Establishes the Ketchikan preseason transfer rule for 'Which excursions fit my sailing from Ward Cove versus a downtown berth?': Ward Cove passengers booking independent excursions that meet in downtown Ketchikan must budget +45 minutes outbound (30m shuttle allowance to Berth IV + 15m walk to downtown core) and +45 minutes return compared with Ward Cove direct-dispatch tours (True Alaskan / Cape Fox Ward Cove departures).",
    humanDecisionRequired:
      "Keep Ketchikan in preseason preparation until the 8-12 week build window opens on 2027-02-01, and confirm the 45-minute Ward Cove -> downtown core transfer rule when reviewing the alaska-ketchikan queue.",
    reviewStatus: "needs_confirmation",
    verified: false,
    verifiedOn: null,
    verifiedBy: null,
  },
];

export const NEW_ORLEANS_HOTEL_PICKUP_SALES_TEST_STATUS: DccNewOrleansSalesTestStatus =
  {
    testId: "nola-hotel-pickup-sales-test-2026",
    status: "active_moving",
    conciergePilotProperties: [
      {
        propertySlug: "hotel-monteleone-nola",
        propertyName: "Hotel Monteleone — French Quarter (214 Royal St)",
        address: "214 Royal St, New Orleans, LA 70130",
        airboatAdventuresNamedStopStatus: "confirmed_named_stop",
        pickupNote:
          "Direct named stop on both Jean Lafitte Swamp Tour (FareHarbor item 763318, pickup option #22056428) and Airboat Adventures (214 Royal St; pickup window begins 75 minutes prior to tour time).",
      },
      {
        propertySlug: "roosevelt-new-orleans",
        propertyName: "The Roosevelt New Orleans (CBD / French Quarter Edge)",
        address: "130 Roosevelt Way / 123 Baronne St, New Orleans, LA 70112",
        airboatAdventuresNamedStopStatus: "confirmed_named_stop",
        pickupNote:
          "Motorcoach and shuttle pickups board at the Baronne Street porte-cochere (listed as 'Roosevelt — 123 Baronne St' on Airboat Adventures' official pickup list).",
      },
      {
        propertySlug: "omni-riverfront-nola",
        propertyName: "Omni Riverfront Hotel (Warehouse District / Cruise Port)",
        address: "701 Convention Center Blvd, New Orleans, LA 70130",
        airboatAdventuresNamedStopStatus: "adjacent_stop_confirmation_needed",
        pickupNote:
          "0.3 km from Erato/Julia cruise terminals. Note: Omni Riverfront is not listed by name on Airboat Adventures' pickup page; nearest named stops are New Orleans Marriott Warehouse Arts District (Convention Center Blvd) and Embassy Suites (315 Julia St).",
      },
    ],
    trackedProducts: [
      "dcc:tour:fh:jeanlafitteswamptour:763318",
      "dcc:tour:viator:6953SWAMPTRANS",
      "dcc:tour:viator:6455NOLAAIR",
      "dcc:tour:viator:3780AIRBOAT",
      "dcc:tour:viator:3780SWAMP",
    ],
    relatedDraftPrNumbers: [222],
    officialSourcesCheckedOn: "2026-11-06",
    keyOperationalFinding:
      "Resolved prior fetch failure on https://airboatadventures.com/pickup-locations/ (2026-11-06): confirmed 75-minute pre-tour pickup window ($30/person roundtrip) and verified direct pickup stop match for Hotel Monteleone (214 Royal St) and The Roosevelt (123 Baronne St).",
  };

/**
 * Evaluates the full DCC Coverage seasonal queue for a given date (`YYYY-MM-DD`).
 * Orders ports using published ship calls and actual tour booking dates, and
 * automatically promotes Alaska ports from `preseason_preparation` into
 * `active_build_ready` when `asOfDate` enters the 8-12 week window before their
 * first published call.
 */
export function evaluateDccCoveragePass(options?: {
  asOfDate?: string;
  evaluatedAtIso?: string;
  lastCalendarCheckedOn?: string;
}): DccCoveragePassReport {
  const evaluatedAtIso =
    options?.evaluatedAtIso ?? new Date().toISOString();
  const asOfDate = options?.asOfDate ?? evaluatedAtIso.slice(0, 10);
  const lastCalendarCheckedOn = options?.lastCalendarCheckedOn ?? "2026-11-06";

  const stThomasTrigger = evaluateAlaskaPreseasonTrigger({
    asOfDate,
    firstPublishedCallDate: "2026-11-06",
    applicable: false,
  });
  const nolaTrigger = evaluateAlaskaPreseasonTrigger({
    asOfDate,
    firstPublishedCallDate: "2026-11-06",
    applicable: false,
  });
  const ketchikanTrigger = evaluateAlaskaPreseasonTrigger({
    asOfDate,
    firstPublishedCallDate: "2027-04-26",
    applicable: true,
  });
  const skagwayTrigger = evaluateAlaskaPreseasonTrigger({
    asOfDate,
    firstPublishedCallDate: "2027-04-28",
    applicable: true,
  });
  const sitkaTrigger = evaluateAlaskaPreseasonTrigger({
    asOfDate,
    firstPublishedCallDate: "2027-04-29",
    applicable: true,
  });

  const baseQueue: DccCoverageQueueItem[] = [
    {
      portSlug: "st-thomas",
      displayName: "St. Thomas, USVI (Havensight WICO & Crown Bay)",
      priorityRank: 1,
      stage: "active_winter_build",
      coreTravelerQuestion:
        "Which St. Thomas excursions fit my sailing from Havensight (WICO) versus Crown Bay, and when does a St. John ferry or beach day fit my ship window?",
      seasonalRationale:
        "Active winter Caribbean cruise season (Nov 2026 – Apr 2027) with daily published ship calls at WICO and Crown Bay and immediate winter tour booking dates open now.",
      calendar: {
        seasonLabel: "Winter 2026/2027 Peak Caribbean Season",
        seasonStart: "2026-11-01",
        seasonEnd: "2027-04-30",
        firstPublishedCallDate: "2026-11-06",
        earliestBookableTourDate: "2026-11-06",
        publishedCallSourceUrl: "https://www.viport.com/schedule-cruise-ports",
        bookingCalendarSourceUrl: "https://www.viecotours.com/",
        lastCalendarCheckedOn,
      },
      preseasonTrigger: stThomasTrigger,
      deliverables: {
        publicAnswerReady: true,
        actualTripCheckerReady: true,
        freeOrSelfGuidedOptionReady: true,
        unsupportedFactsMarkedUnknown: true,
        publicAnswerPath: "/ports/st-thomas",
        checkerEngineModule: "lib/dcc/stThomasPortDayEngine.ts",
      },
      stagedResearchCandidatesCount: 3,
      queuedMaterialChangesCount: QUEUED_MATERIAL_CHANGES_2026_11_06.filter(
        (m) => m.portSlug === "st-thomas",
      ).length,
    },
    {
      portSlug: "new-orleans",
      displayName: "New Orleans Hotel-Pickup Sales Test (French Quarter / CBD / Cruise Port)",
      priorityRank: 2,
      stage: "active_sales_test",
      coreTravelerQuestion:
        "Which New Orleans swamp and bayou tours include verified hotel pickup from my French Quarter, CBD, or Cruise Port hotel versus self-drive or Toulouse Street dock coach boarding?",
      seasonalRationale:
        "Active fall/winter booking window for New Orleans hotel-concierge and pre/post-cruise swamp tour pickups (Hotel Monteleone 214 Royal St pilot, Jean Lafitte 763318, Airboat Adventures 6455NOLAAIR, Cajun Encounters 6953SWAMPTRANS).",
      calendar: {
        seasonLabel: "Year-Round / Winter 2026–2027 Sales Test Window",
        seasonStart: "2026-11-01",
        seasonEnd: "2027-05-31",
        firstPublishedCallDate: "2026-11-06",
        earliestBookableTourDate: "2026-11-06",
        publishedCallSourceUrl: "https://airboatadventures.com/pickup-locations/",
        bookingCalendarSourceUrl:
          "https://www.cajunencounters.com/tours/swamp-tour-new-orleans",
        lastCalendarCheckedOn,
      },
      preseasonTrigger: nolaTrigger,
      deliverables: {
        publicAnswerReady: true,
        actualTripCheckerReady: true,
        freeOrSelfGuidedOptionReady: true,
        unsupportedFactsMarkedUnknown: true,
        publicAnswerPath: "/new-orleans/swamp-tours",
        checkerEngineModule: "lib/dcc/decisionEngines/newOrleansSwampToursEngine.ts",
      },
      stagedResearchCandidatesCount: 15,
      queuedMaterialChangesCount: QUEUED_MATERIAL_CHANGES_2026_11_06.filter(
        (m) => m.portSlug === "new-orleans",
      ).length,
    },
    {
      portSlug: "ketchikan",
      displayName: "Ketchikan, Alaska (Ward Cove vs. Downtown Berths I–IV)",
      priorityRank: 3,
      stage:
        ketchikanTrigger.triggerVerdict === "start_full_alaska_build_now"
          ? "active_build_ready"
          : "preseason_preparation",
      coreTravelerQuestion:
        "Which excursions fit my sailing from Ward Cove versus a downtown berth?",
      seasonalRationale:
        "2026 Alaska season has ended; in preseason preparation with 151 machine research candidates staged. Full Alaska build automatically starts 8–12 weeks before first published 2027 call (window opens 2027-02-01 for 2027-04-26 opener).",
      calendar: {
        seasonLabel: "Alaska 2027 Cruise Season (Preseason Prep)",
        seasonStart: "2027-04-26",
        seasonEnd: "2027-10-15",
        firstPublishedCallDate: "2027-04-26",
        earliestBookableTourDate: "2027-05-01",
        publishedCallSourceUrl: "https://wardcoveak.com/schedules/",
        bookingCalendarSourceUrl:
          "https://www.truealaskantours.com/shore-excursions/",
        lastCalendarCheckedOn,
      },
      preseasonTrigger: ketchikanTrigger,
      deliverables: {
        publicAnswerReady: true,
        actualTripCheckerReady: false,
        freeOrSelfGuidedOptionReady: true,
        unsupportedFactsMarkedUnknown: true,
        publicAnswerPath: "/ports/ketchikan",
        checkerEngineModule: null,
      },
      stagedResearchCandidatesCount: 151,
      queuedMaterialChangesCount: QUEUED_MATERIAL_CHANGES_2026_11_06.filter(
        (m) => m.portSlug === "ketchikan",
      ).length,
    },
    {
      portSlug: "skagway",
      displayName: "Skagway, Alaska (Railroad, Ore, Broadway & White Pass Corridor)",
      priorityRank: 4,
      stage:
        skagwayTrigger.triggerVerdict === "start_full_alaska_build_now"
          ? "active_build_ready"
          : "preseason_preparation",
      coreTravelerQuestion:
        "Which White Pass & Yukon Route rail, Klondike Highway, and glacier excursions fit my Skagway berth and shuttle window?",
      seasonalRationale:
        "In preseason preparation behind Ketchikan; full build triggers 8–12 weeks before first published 2027 Skagway call (window opens 2027-02-03 for 2027-04-28 opener).",
      calendar: {
        seasonLabel: "Alaska 2027 Cruise Season (Preseason Prep)",
        seasonStart: "2027-04-28",
        seasonEnd: "2027-10-12",
        firstPublishedCallDate: "2027-04-28",
        earliestBookableTourDate: "2027-05-01",
        publishedCallSourceUrl: "https://www.skagway.org/",
        bookingCalendarSourceUrl: "https://wpyr.com/excursions/",
        lastCalendarCheckedOn,
      },
      preseasonTrigger: skagwayTrigger,
      deliverables: {
        publicAnswerReady: true,
        actualTripCheckerReady: false,
        freeOrSelfGuidedOptionReady: true,
        unsupportedFactsMarkedUnknown: true,
        publicAnswerPath: "/ports/skagway",
        checkerEngineModule: null,
      },
      stagedResearchCandidatesCount: 0,
      queuedMaterialChangesCount: 0,
    },
    {
      portSlug: "sitka",
      displayName: "Sitka, Alaska (Sitka Sound Cruise Terminal Shuttle vs. Downtown Tender)",
      priorityRank: 5,
      stage:
        sitkaTrigger.triggerVerdict === "start_full_alaska_build_now"
          ? "active_build_ready"
          : "preseason_preparation",
      coreTravelerQuestion:
        "Which Sitka wildlife, Fortress of the Bear, and raptor excursions fit my Sitka Sound Cruise Terminal shuttle window versus a downtown tender call?",
      seasonalRationale:
        "In preseason preparation behind Ketchikan and Skagway; full build triggers 8–12 weeks before first published 2027 Sitka call (window opens 2027-02-04 for 2027-04-29 opener).",
      calendar: {
        seasonLabel: "Alaska 2027 Cruise Season (Preseason Prep)",
        seasonStart: "2027-04-29",
        seasonEnd: "2027-10-10",
        firstPublishedCallDate: "2027-04-29",
        earliestBookableTourDate: "2027-05-01",
        publishedCallSourceUrl: "https://sitkadock.com/cruise-ship-schedule/",
        bookingCalendarSourceUrl: "https://allenmarinetours.com/sitka/",
        lastCalendarCheckedOn,
      },
      preseasonTrigger: sitkaTrigger,
      deliverables: {
        publicAnswerReady: true,
        actualTripCheckerReady: false,
        freeOrSelfGuidedOptionReady: true,
        unsupportedFactsMarkedUnknown: true,
        publicAnswerPath: "/ports/sitka",
        checkerEngineModule: null,
      },
      stagedResearchCandidatesCount: 0,
      queuedMaterialChangesCount: 0,
    },
  ];

  const { nextDailyRunMountainIso, nextDailyRunUtcIso } =
    computeNextDailyMountainRun(asOfDate);
  const nextWeeklyCalendarRecheckOn = addDaysYmd(lastCalendarCheckedOn, 7);
  const calendarRecheckDueNow = isWeeklyCalendarRecheckDue(
    asOfDate,
    lastCalendarCheckedOn,
  );

  return {
    automationId: "dcc-coverage",
    displayName: "DCC Coverage",
    cronExpression: "CRON_TZ=America/Denver 0 8 * * *",
    timeZone: "America/Denver",
    evaluatedOnDate: asOfDate,
    evaluatedAtIso,
    nextDailyRunMountainIso,
    nextDailyRunUtcIso,
    calendarRecheckIntervalDays: 7,
    lastCalendarCheckedOn,
    nextWeeklyCalendarRecheckOn,
    calendarRecheckDueNow,
    activeBuildPort: baseQueue[0],
    parallelSalesTest: NEW_ORLEANS_HOTEL_PICKUP_SALES_TEST_STATUS,
    orderedQueue: baseQueue,
    queuedMaterialChanges: QUEUED_MATERIAL_CHANGES_2026_11_06,
    humanDecisionsNeeded: [
      {
        decisionId: "dec-stt-viecotours-180m-duration-approval",
        area: "st-thomas",
        summary:
          "Approve or reject the VI Ecotours Cas Cay Kayak, Hike & Snorkel duration change from 150 minutes to 180 minutes (3 hours, From $99) observed on https://www.viecotours.com/ (published Nov 5, 2026, checked 2026-11-06).",
        optionsOrAction:
          "Confirm 180 minutes in the review desk (tightens 5-hour Crown Bay port calls) or keep 150 minutes if 3h includes optional transfer.",
        blockingForProductionPublish: true,
      },
      {
        decisionId: "dec-stt-vipa-ferry-and-magens-bay-facts-approval",
        area: "st-thomas",
        summary:
          "Approve VIPA Red Hook <-> Cruz Bay ferry facts ($8.15 adult / 15m crossing / Crown Bay ferry afternoon-only 2:15 PM, 3:30 PM, 5:30 PM) and Magens Bay Authority admission ($7.00 non-resident adult, kids <12 free, 7:00 AM–5:30 PM).",
        optionsOrAction:
          "Confirm in the review desk so St. Thomas facts transition from 'needs_confirmation' to 'verified'.",
        blockingForProductionPublish: true,
      },
      {
        decisionId: "dec-stt-tours-handoff-destination-policy",
        area: "st-thomas",
        summary:
          "Resolve the open policy item in docs/port-tours-coverage-rollout.md (line 126): whether /ports/st-thomas primary tour search CTA should route to canonical destination 'st-thomas' (Viator destinationId 965) or split Charlotte Amalie vs. Red Hook / St. John.",
        optionsOrAction:
          "Currently defaults to /tours?q=St.+Thomas+shore+excursions backed by destination 'st-thomas' (90 catalog products); confirm whether to lock 'st-thomas' as canonical.",
        blockingForProductionPublish: false,
      },
      {
        decisionId: "dec-nola-airboat-75min-window-and-monteleone-pilot",
        area: "new-orleans",
        summary:
          "Confirm Airboat Adventures' 75-minute pre-tour pickup window ($30/person roundtrip) and review Hotel Monteleone (214 Royal St) demo preset approval status + Draft PR #222.",
        optionsOrAction:
          "Approve the Airboat Adventures pickup-window fact in the swamp review desk and decide when to remove the 'DEMO PRESET — Pending Hotel Approval' badge on hotel-monteleone-nola.",
        blockingForProductionPublish: true,
      },
    ],
    humanGovernanceBoundary: {
      factApprovalWithHumanReviewer: true,
      productionPublishingWithHumanReviewer: true,
      commercialTermsWithHumanReviewer: true,
      singleExpansionDraftPrInProgress: true,
      autoApprovedFactsCount: 0,
    },
  };
}
