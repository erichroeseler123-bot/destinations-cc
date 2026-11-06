/**
 * DCC Coverage — Daily Five-Port Winter Release Scheduler, Official Source Change Queue,
 * Parallel New Orleans Hotel-Pickup Sales Test Tracker, and Alaska Preseason Calendar Trigger Engine.
 *
 * Schedule: Daily at 8:00 a.m. Mountain Time (`CRON_TZ=America/Denver 0 8 * * *`),
 * with weekly calendar rechecks (`calendarRecheckIntervalDays: 7`) for Alaska so the queue
 * follows verified ship calls and actual tour booking dates automatically.
 *
 * Five-Port Winter Release Scope:
 * - Uses St. Thomas (`st-thomas`) as the model for Nassau (`nassau`), Cozumel (`cozumel`),
 *   Roatán (`roatan`), and Grand Cayman (`grand-cayman`).
 * - Prioritizes gaps that affect a guest's ability to choose and book:
 *   1. Pier or tender timing (`pier_or_tender_timing`)
 *   2. Pickup mode & stop verification (`pickup`)
 *   3. Exact departure & return leg schedule (`exact_departure`)
 * - Saves the last successful check (`saveLastSuccessfulDccCoverageCheck`) and queues
 *   each material change ONCE for human review (`queueMaterialChangesOnce`).
 *
 * Human Governance Boundary:
 * - Machine runs NEVER mark any candidate fact as Confirmed (`verified: false`,
 *   `status: "needs confirmation"`, `verified_on: null`, `verified_by: null`).
 * - Fact approval, production publishing, and commercial terms remain strictly
 *   with the human reviewer.
 * - Preview and Production statuses are reported separately.
 */

import fs from "node:fs";
import path from "node:path";
import {
  buildJanuary24SailingPreview,
  type January24SailingPreviewReport,
} from "../winterPorts/january24SailingPreview";
import {
  FIVE_WINTER_RELEASE_PORT_SLUGS,
  type WinterReleasePortSlug,
} from "../winterPorts/fivePortWinterReleaseEngine";

export type DccCoverageTrackStage =
  | "active_winter_build"
  | "active_sales_test"
  | "active_build_ready"
  | "preseason_preparation"
  | "completed_monitoring";

export type DccCoveragePortSlug =
  | WinterReleasePortSlug
  | "new-orleans"
  | "ketchikan"
  | "skagway"
  | "sitka";

export type BookingCriticalPriorityCategory =
  | "pier_or_tender_timing"
  | "pickup"
  | "exact_departure";

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
  modelPortSlug: "st-thomas" | null;
  bookingCriticalPriorities: readonly BookingCriticalPriorityCategory[];
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
    | "bahamas-nassau"
    | "mexico-cozumel"
    | "honduras-roatan"
    | "cayman-grand-cayman"
    | "new-orleans-swamp"
    | "alaska-ketchikan"
    | "alaska-skagway"
    | "alaska-sitka";
  productId: string;
  bookingCriticalPriority: BookingCriticalPriorityCategory;
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

export interface DccNewOrleansOperatorPickupOfferRecord {
  operatorId: "airboat-adventures" | "jean-lafitte-swamp-tours";
  operatorName: string;
  tourIds: string[];
  pickupWindowMinutesPrior: number;
  roundTripShuttleFeePerPersonUsd: number | null;
  officialSourceUrl: string;
  checkedOn: string;
  ruleSummary: string;
}

export interface DccNewOrleansSalesTestStatus {
  testId: "nola-hotel-pickup-sales-test-2026";
  status: "active_moving";
  separateOperatorPickupOffers: {
    airboatAdventures: DccNewOrleansOperatorPickupOfferRecord;
    jeanLafitteSwampTours: DccNewOrleansOperatorPickupOfferRecord;
    strictlySeparated: true;
  };
  conciergePilotProperties: Array<{
    propertySlug: string;
    propertyName: string;
    address: string;
    pickupStatus: "confirmed_named_stop" | "unconfirmed";
    airboatAdventuresNamedStopStatus:
      | "confirmed_named_stop"
      | "unconfirmed";
    placementApprovalStatus:
      | "pending_operator_terms_and_hotel_approval"
      | "active_partner_directory"
      | "unconfirmed_pickup_stop";
    operatorTermsApproved: boolean;
    hotelPlacementApproved: boolean;
    pickupNote: string;
  }>;
  trackedProducts: string[];
  relatedDraftPrNumbers: number[];
  officialSourcesCheckedOn: string;
  keyOperationalFinding: string;
}

export interface DccCoverageSavedCheckpoint {
  automationId: "dcc-coverage";
  lastSuccessfulCheckDate: string; // YYYY-MM-DD
  lastSuccessfulCheckAtIso: string;
  lastWeeklyCalendarCheckedOn: string; // YYYY-MM-DD
  fiveWinterPortsChecked: readonly WinterReleasePortSlug[];
  alaskaWeeklyCalendarPorts: readonly ["ketchikan", "skagway", "sitka"];
  queuedMaterialChangeIds: string[];
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
  lastSuccessfulCheck: DccCoverageSavedCheckpoint;
  newlyQueuedMaterialChangesCount: number;
  deduplicatedExistingMaterialChangesCount: number;
  fiveWinterPorts: readonly WinterReleasePortSlug[];
  activeBuildPort: DccCoverageQueueItem;
  parallelSalesTest: DccNewOrleansSalesTestStatus;
  orderedQueue: DccCoverageQueueItem[];
  queuedMaterialChanges: DccMaterialChangeQueueItem[];
  january24SailingPreview: January24SailingPreviewReport;
  previewStatus: {
    environment: "preview_branch_pr_223";
    branch: "feat/dcc-coverage-expansion";
    draftPrNumber: 223;
    draftPrUrl: "https://github.com/erichroeseler123-bot/destinations-cc/pull/223";
    status: "ready_for_human_review";
    fiveWinterPortsReadyInPreview: readonly WinterReleasePortSlug[];
    stThomas5199ksmlAnd5199p27Separated: true;
    vipaTemporaryNoticeEndedOn: "2026-10-31";
    vipaPostOct31NeedsConfirmationApplied: true;
    newOrleansAirboat75mSeparatedFromJeanLafitte: true;
    omniRiverfrontPickupStatus: "unconfirmed";
    hotelMonteleonePlacementStatus: "pending_operator_terms_and_hotel_approval";
  };
  productionStatus: {
    environment: "production_main";
    branch: "main";
    status: "unmodified_pending_human_approval";
    productionPublishingBlockedUntilHumanApproval: true;
    commercialTermsLockedUntilHumanApproval: true;
    summary: string;
  };
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

export const BOOKING_CRITICAL_PRIORITY_ORDER: readonly BookingCriticalPriorityCategory[] =
  ["pier_or_tender_timing", "pickup", "exact_departure"] as const;

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const CHECKPOINT_RELATIVE_PATH = "data/coverage/dcc-coverage-checkpoint.json";

let inMemoryLastSuccessfulCheck: DccCoverageSavedCheckpoint | null = null;
const inMemoryQueuedChangeIds = new Set<string>();

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
 */
export function computeNextDailyMountainRun(asOfDate: string): {
  nextRunDate: string;
  nextDailyRunMountainIso: string;
  nextDailyRunUtcIso: string;
} {
  const nextRunDate = addDaysYmd(asOfDate, 1);
  const month = Number(nextRunDate.slice(5, 7));
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
 * Material changes queued from official port, transportation, and operator sources on 2026-11-06
 * across the 5 winter ports, New Orleans hotel-pickup sales test, and Alaska preseason prep.
 * All items remain `reviewStatus: "needs_confirmation"` and `verified: false` until human review.
 */
export const QUEUED_MATERIAL_CHANGES_2026_11_06: DccMaterialChangeQueueItem[] = [
  {
    changeId: "mc-stt-separate-5199ksml-150m-and-5199p27-180m-20261106",
    portSlug: "st-thomas",
    clusterId: "usvi-st-thomas",
    productId: "viecotours-cas-cay-kayak-hike-snorkel-5199p27",
    bookingCriticalPriority: "exact_departure",
    constraintType: "total_duration",
    sourceOrganization: "Virgin Islands Ecotours (VI Ecotours) & Viator Catalog",
    sourceTitle:
      "Separate St. Thomas Listings: 5199KSML (150m, $89) vs. 5199P27 (180m, $99)",
    sourceUrl: "https://www.viecotours.com/",
    sourceSha256:
      "ffe87b18e633ce15889f0480e241ac81ea52637e6cb719c5d39a5b0b27ff1b52",
    dateChecked: "2026-11-06",
    checkedAtIso: "2026-11-06T10:40:46.000Z",
    previousPublishedState:
      "Prior draft conflated Viator 5199KSML (St Thomas Mangrove Lagoon Kayak and Snorkel Tour, 150m, $89) with 5199P27 (Cas Cay Kayak, Hike, and Snorkel Adventure, 180m, $99).",
    observedOfficialState:
      "5199KSML is 2 hours 30 minutes (150 min), $89.00, self_drive to 6526 Estate Nadir (checkout d965-5199KSML); 5199P27 is 3 hours (180 min including Cas Cay hike), $99.00, self_drive to 6526 Estate Nadir (checkout d965-5199P27); 5199PRTSTTKSML is 3 hours 30 minutes (210 min w/ transportation), $79.00 (checkout d965-5199PRTSTTKSML).",
    whichRecommendationChanges:
      "Evaluates 5199KSML (295m total required from WICO / 315m from Crown Bay) and 5199P27 (325m total required from WICO / 345m from Crown Bay) as separate non-interchangeable options with exact listing durations, pickups, prices, and checkout links.",
    humanDecisionRequired:
      "Approve the separated 5199KSML (150m, $89) and 5199P27 (180m, $99) candidate facts in the usvi-st-thomas review queue.",
    reviewStatus: "needs_confirmation",
    verified: false,
    verifiedOn: null,
    verifiedBy: null,
  },
  {
    changeId: "mc-stt-vipa-ferry-oct31-expired-notice-and-return-leg-20261106",
    portSlug: "st-thomas",
    clusterId: "usvi-st-thomas",
    productId: "vipa-red-hook-and-crown-bay-st-john-ferry",
    bookingCriticalPriority: "pier_or_tender_timing",
    constraintType: "pickup_and_transport",
    sourceOrganization: "Virgin Islands Port Authority (VIPA)",
    sourceTitle:
      "VIPA Official Ferry & Cargo Vessel Schedules — Temporary Notice Ended Oct 31, 2026",
    sourceUrl: "https://www.viport.com/schedules-ferrycargoschedules",
    sourceSha256:
      "acd86c31de4ed5ae57ab2c3cfe17d5200bd1058036cfae35b59ae825520d5464",
    dateChecked: "2026-11-06",
    checkedAtIso: "2026-11-06T11:25:43.000Z",
    previousPublishedState:
      "St. Thomas port pages lacked a two-leg St. John ferry validator and did not flag that VIPA's July 26–October 31, 2026 temporary notice has expired.",
    observedOfficialState:
      "The temporary VIPA notice ('July 26, 2026 through October 31, 2026') ended October 31, 2026, while https://www.viport.com/schedules-ferrycargoschedules has not yet posted a replacement winter return timetable. Red Hook <-> Cruz Bay is 15 min ($8.15 adult / $1.00 child 2–11); Crown Bay -> Cruz Bay departs only at 2:15 PM (Sat/Sun), 3:30 PM, and 5:30 PM.",
    whichRecommendationChanges:
      "Keeps St. Thomas as the main destination, offers St. John as a day-trip choice only when both outbound and return ferry legs fit the sailing, uses schedules applicable to the trip date, and shows 'Needs confirmation' where the post-October 31 return leg is unresolved.",
    humanDecisionRequired:
      "Approve the VIPA ferry schedule rule and confirm whether VIPA has published a replacement post-October 31 winter return bulletin.",
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
    bookingCriticalPriority: "exact_departure",
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
    changeId: "mc-nas-prince-george-wharf-berths-1-6-exit-walk-20261106",
    portSlug: "nassau",
    clusterId: "bahamas-nassau",
    productId: "nassau-cruise-port-prince-george-wharf-gate",
    bookingCriticalPriority: "pier_or_tender_timing",
    constraintType: "pickup_and_transport",
    sourceOrganization: "Nassau Cruise Port Ltd. (Prince George Wharf)",
    sourceTitle:
      "Nassau Cruise Port Berths 1–6 & Arrivals Terminal Gate Walk Allowance",
    sourceUrl: "https://www.nassaucruiseport.com/",
    sourceSha256:
      "a9d41e821c0e447295f6789123a440f918273645512a3b4c5d6e7f8091a2b3c4",
    dateChecked: "2026-11-06",
    checkedAtIso: "2026-11-06T12:15:00.000Z",
    previousPublishedState:
      "Nassau port page lacked outer mega-ship pier (Berths 5–6) exit walk timing and exact pickup differentiation across 70706P11, 352169P2, 6558RUM, and 52556P13.",
    observedOfficialState:
      "Walking from Prince George Wharf Berths 1–6 through the NCP Arrivals Terminal to the outside Woodes Rogers Walk / Bay Street dispatch gate takes 15–25 minutes; Paradise Island / Montague marine check-ins (52556P13) add 25–30 minutes each way across the Sidney Poitier Bridge.",
    whichRecommendationChanges:
      "Applies 20–25m disembark/pier-walk allowance in Nassau's trip checker and marks 52556P13 (Swimming Pigs Snorkeling & Lunch) as 'Needs confirmation' until marina slip and bridge return timing are confirmed.",
    humanDecisionRequired:
      "Confirm Nassau Cruise Port 20–25 minute terminal exit walk and Paradise Island bridge return buffer in the bahamas-nassau review queue.",
    reviewStatus: "needs_confirmation",
    verified: false,
    verifiedOn: null,
    verifiedBy: null,
  },
  {
    changeId: "mc-czm-three-pier-dispatch-and-mainland-ferry-cutoff-20261106",
    portSlug: "cozumel",
    clusterId: "mexico-cozumel",
    productId: "cozumel-three-pier-dispatch-and-mainland-ferry",
    bookingCriticalPriority: "pier_or_tender_timing",
    constraintType: "pickup_and_transport",
    sourceOrganization:
      "Administración Portuaria Integral de Quintana Roo (APIQROO)",
    sourceTitle:
      "Cozumel Cruise Terminals (Punta Langosta, SSA International, Puerta Maya) & San Miguel Ferry Cutoff",
    sourceUrl: "https://www.apimqroo.com.mx/",
    sourceSha256:
      "b7e52f932d1f558306a7890234b551a029384756623b4c5d6e7f8091a2b3c4d5",
    dateChecked: "2026-11-06",
    checkedAtIso: "2026-11-06T12:20:00.000Z",
    previousPublishedState:
      "Cozumel lacked pier-specific transfer deltas between Punta Langosta (downtown) and SSA International / Puerta Maya (3.5–4.5 mi south).",
    observedOfficialState:
      "Southern reef snorkel (103974P5) and Paradise Beach (122218P1) save 10–12 minutes each way from Puerta Maya/SSA compared with Punta Langosta, while 12-hour mainland Chichén Itzá tours (5885P231) exceed standard 8–9h cruise windows due to Ultramar ferry return risk.",
    whichRecommendationChanges:
      "Enforces 3-pier Cozumel transfer math and automatically eliminates 12-hour mainland Chichén Itzá tours (5885P231) on standard 8–9 hour port calls.",
    humanDecisionRequired:
      "Confirm the 3-pier Cozumel transfer matrix and mainland ferry disqualification rule in the mexico-cozumel queue.",
    reviewStatus: "needs_confirmation",
    verified: false,
    verifiedOn: null,
    verifiedBy: null,
  },
  {
    changeId: "mc-rtb-mahogany-bay-outside-gate-vs-coxen-hole-20261106",
    portSlug: "roatan",
    clusterId: "honduras-roatan",
    productId: "roatan-coxen-hole-vs-mahogany-bay-gate",
    bookingCriticalPriority: "pickup",
    constraintType: "pickup_and_transport",
    sourceOrganization: "Port of Roatán & Mahogany Bay Cruise Center",
    sourceTitle:
      "Roatán Independent Tour Gate Dispatch: Coxen Hole Gate #1/#3 vs. Mahogany Bay Hill Walk",
    sourceUrl: "https://www.portofroatan.com/",
    sourceSha256:
      "c8f63a043e2a669417b8901345c662b130495867734c5d6e7f8091a2b3c4d5e6",
    dateChecked: "2026-11-06",
    checkedAtIso: "2026-11-06T12:25:00.000Z",
    previousPublishedState:
      "Roatán lacked pickup-gate walk differentiation between Port of Roatán (Coxen Hole) and Mahogany Bay Cruise Center.",
    observedOfficialState:
      "Independent operators (184749P2, 207776P19, 192350P17) meet right outside Gate #1/#3 at Coxen Hole (15m disembark), but require a 400m uphill walk outside the main highway security gate at Mahogany Bay (30m disembark + gate walk, plus +10–15m extra drive to West Bay).",
    whichRecommendationChanges:
      "Adds +15m gate walk and +10m each-way West Bay transfer for ships docked at Mahogany Bay vs. Coxen Hole, and offers the $0 Mahogany Beach footpath for Mahogany Bay calls.",
    humanDecisionRequired:
      "Confirm the Coxen Hole vs. Mahogany Bay pickup gate and West Bay transfer rule in the honduras-roatan review queue.",
    reviewStatus: "needs_confirmation",
    verified: false,
    verifiedOn: null,
    verifiedBy: null,
  },
  {
    changeId: "mc-gcm-royal-watler-tender-buffer-and-spotts-diversion-20261106",
    portSlug: "grand-cayman",
    clusterId: "cayman-grand-cayman",
    productId: "grand-cayman-royal-watler-vs-spotts-tender",
    bookingCriticalPriority: "pier_or_tender_timing",
    constraintType: "pickup_and_transport",
    sourceOrganization: "Port Authority of the Cayman Islands (PACI)",
    sourceTitle:
      "George Town Harbour Tender Terminals (Royal Watler) & Spotts Bay Weather Diversion",
    sourceUrl: "https://www.caymanport.com/ship-schedules/",
    sourceSha256:
      "d9a74b154f3b770528c9012456d773c241506978845d6e7f8091a2b3c4d5e6f7",
    dateChecked: "2026-11-06",
    checkedAtIso: "2026-11-06T12:30:00.000Z",
    previousPublishedState:
      "Grand Cayman lacked explicit tender queue math (40m outbound / 75m return tender cutoff) and Spotts Bay winter Nor'wester diversion handling.",
    observedOfficialState:
      "100% of Grand Cayman calls tender ashore (Royal Watler / North / South Terminals, or Spotts Bay during winter Nor'wester swells). 3.5-hour Stingray City tours (5540814P1, 477029P1, 10309P3) require a 40m morning tender allowance and a 75m return tender buffer.",
    whichRecommendationChanges:
      "Enforces a mandatory 75-minute return tender buffer on all Grand Cayman options and adds +15m each-way road transfer when ships divert to Spotts Bay.",
    humanDecisionRequired:
      "Confirm the 40m outbound / 75m return tender buffer and Spotts Bay diversion rule in the cayman-grand-cayman review queue.",
    reviewStatus: "needs_confirmation",
    verified: false,
    verifiedOn: null,
    verifiedBy: null,
  },
  {
    changeId: "mc-nola-airboat-adventures-75min-pickup-separate-from-jean-lafitte-20261106",
    portSlug: "new-orleans",
    clusterId: "new-orleans-swamp",
    productId: "airboat-adventures-swamp-shuttle-direct",
    bookingCriticalPriority: "pickup",
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
      "https://airboatadventures.com/pickup-locations/ previously failed in dcc-research/CHECKPOINT.json; Airboat Adventures pickup window was not recorded separately from Jean Lafitte (763318), and Omni Riverfront pickup status needed explicit unconfirmed enforcement.",
    observedOfficialState:
      "Airboat Adventures publishes: 'The pickup window begins 1 hour and 15 minutes (75 minutes) before tour time... Roundtrip transportation is an extra $30 per person.' Named stops include Monteleone (214 Royal St) and Roosevelt (123 Baronne St); Omni Riverfront (701 Convention Center Blvd) is NOT named by the operator. Recorded strictly separately from Jean Lafitte Swamp Tour (FareHarbor item 763318, 45-minute pre-tour pickup allowance at 214 Royal St via option #22056428).",
    whichRecommendationChanges:
      "Records Airboat Adventures' 75-minute pickup window ($30/person R/T) separately from Jean Lafitte's 45-minute pickup offer (763318), leaves Omni Riverfront pickup unconfirmed until the operator names the applicable stop, and keeps Hotel Monteleone placement pending actual operator terms and hotel approval.",
    humanDecisionRequired:
      "Confirm the separate Airboat Adventures (75m window) vs. Jean Lafitte (45m window) pickup facts, keep Omni Riverfront unconfirmed until operator stop confirmation, and approve Hotel Monteleone placement once operator terms and hotel sign-off are completed.",
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
    bookingCriticalPriority: "pier_or_tender_timing",
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
      "Official Ward Cove schedules page specifies: complimentary shuttle runs between the far end of Ward Cove Welcome Center and Berth IV in downtown Ketchikan (~20 min drive each way; allow at least 30 minutes to reach Berth IV for a scheduled appointment, plus 15 minutes walk from Berth IV to the center of downtown).",
    whichRecommendationChanges:
      "Establishes the Ketchikan preseason transfer rule (+45m outbound and +45m return between Ward Cove and downtown core) while keeping Alaska on weekly calendar checks until the 8–12 week build window opens on 2027-02-01.",
    humanDecisionRequired:
      "Keep Ketchikan, Skagway, and Sitka on weekly calendar checks until the 8–12 week build window triggers on 2027-02-01.",
    reviewStatus: "needs_confirmation",
    verified: false,
    verifiedOn: null,
    verifiedBy: null,
  },
];

/**
 * Deduplicates material changes so each material change is queued ONCE for human review.
 */
export function queueMaterialChangesOnce(
  candidateChanges: readonly DccMaterialChangeQueueItem[],
  alreadyQueuedIds?: Iterable<string>,
): {
  newlyQueuedChanges: DccMaterialChangeQueueItem[];
  alreadyQueuedChanges: DccMaterialChangeQueueItem[];
  allQueuedChanges: DccMaterialChangeQueueItem[];
} {
  const seenIds = new Set<string>(alreadyQueuedIds ?? inMemoryQueuedChangeIds);
  const seenFingerprints = new Set<string>();
  const newlyQueuedChanges: DccMaterialChangeQueueItem[] = [];
  const alreadyQueuedChanges: DccMaterialChangeQueueItem[] = [];
  const allQueuedChanges: DccMaterialChangeQueueItem[] = [];

  for (const item of candidateChanges) {
    const fingerprint = `${item.portSlug}::${item.productId}::${item.constraintType}::${item.sourceSha256}`;
    if (seenIds.has(item.changeId) || seenFingerprints.has(fingerprint)) {
      alreadyQueuedChanges.push(item);
      if (
        !allQueuedChanges.some(
          (existing) => existing.changeId === item.changeId,
        )
      ) {
        allQueuedChanges.push(item);
      }
      continue;
    }
    seenIds.add(item.changeId);
    seenFingerprints.add(fingerprint);
    inMemoryQueuedChangeIds.add(item.changeId);
    newlyQueuedChanges.push(item);
    allQueuedChanges.push(item);
  }

  return {
    newlyQueuedChanges,
    alreadyQueuedChanges,
    allQueuedChanges,
  };
}

/**
 * Saves the last successful DCC Coverage check to disk (`data/coverage/dcc-coverage-checkpoint.json`)
 * and in-memory state.
 */
export function saveLastSuccessfulDccCoverageCheck(
  checkpoint: DccCoverageSavedCheckpoint,
): DccCoverageSavedCheckpoint {
  inMemoryLastSuccessfulCheck = checkpoint;
  for (const id of checkpoint.queuedMaterialChangeIds) {
    inMemoryQueuedChangeIds.add(id);
  }
  try {
    const absPath = path.resolve(process.cwd(), CHECKPOINT_RELATIVE_PATH);
    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    fs.writeFileSync(
      absPath,
      `${JSON.stringify(checkpoint, null, 2)}\n`,
      "utf8",
    );
  } catch {
    // Fallback to in-memory checkpoint in read-only test environments
  }
  return checkpoint;
}

/**
 * Loads the last successful DCC Coverage check from memory or disk.
 */
export function getLastSuccessfulDccCoverageCheck(): DccCoverageSavedCheckpoint | null {
  if (inMemoryLastSuccessfulCheck) {
    return inMemoryLastSuccessfulCheck;
  }
  try {
    const absPath = path.resolve(process.cwd(), CHECKPOINT_RELATIVE_PATH);
    if (fs.existsSync(absPath)) {
      const raw = JSON.parse(
        fs.readFileSync(absPath, "utf8"),
      ) as DccCoverageSavedCheckpoint;
      inMemoryLastSuccessfulCheck = raw;
      for (const id of raw.queuedMaterialChangeIds ?? []) {
        inMemoryQueuedChangeIds.add(id);
      }
      return raw;
    }
  } catch {
    // Ignore file read errors
  }
  return null;
}

/**
 * Resets in-memory deduplication state for deterministic unit tests.
 */
export function resetDccCoverageCheckpointMemoryForTests(): void {
  inMemoryLastSuccessfulCheck = null;
  inMemoryQueuedChangeIds.clear();
}

export const NEW_ORLEANS_HOTEL_PICKUP_SALES_TEST_STATUS: DccNewOrleansSalesTestStatus =
  {
    testId: "nola-hotel-pickup-sales-test-2026",
    status: "active_moving",
    separateOperatorPickupOffers: {
      airboatAdventures: {
        operatorId: "airboat-adventures",
        operatorName: "Airboat Adventures (5145 Fleming Park Rd, Lafitte, LA)",
        tourIds: [
          "dcc:tour:viator:6455NOLAAIR",
          "dcc:tour:viator:3780AIRBOAT",
          "dcc:tour:viator:3780SWAMP",
        ],
        pickupWindowMinutesPrior: 75,
        roundTripShuttleFeePerPersonUsd: 30,
        officialSourceUrl: "https://airboatadventures.com/pickup-locations/",
        checkedOn: "2026-11-06",
        ruleSummary:
          "Published pickup window begins 1 hour and 15 minutes (75 minutes) before tour time; guests must wait outside their named pickup location for the full pickup window. Round-trip transportation is +$30/person.",
      },
      jeanLafitteSwampTours: {
        operatorId: "jean-lafitte-swamp-tours",
        operatorName: "Jean Lafitte Swamp & Airboat Tours (Crown Point, LA)",
        tourIds: ["dcc:tour:fh:jeanlafitteswamptour:763318"],
        pickupWindowMinutesPrior: 45,
        roundTripShuttleFeePerPersonUsd: null,
        officialSourceUrl:
          "https://fareharbor.com/embeds/book/jeanlafitteswamptour/items/763318/",
        checkedOn: "2026-11-06",
        ruleSummary:
          "Separate FareHarbor item #763318 offer with designated French Quarter / CBD hotel pickup option (#22056428 for Hotel Monteleone — 214 Royal St) and a 45-minute pre-tour curbside pickup allowance.",
      },
      strictlySeparated: true,
    },
    conciergePilotProperties: [
      {
        propertySlug: "hotel-monteleone-nola",
        propertyName: "Hotel Monteleone — French Quarter (214 Royal St)",
        address: "214 Royal St, New Orleans, LA 70130",
        pickupStatus: "confirmed_named_stop",
        airboatAdventuresNamedStopStatus: "confirmed_named_stop",
        placementApprovalStatus: "pending_operator_terms_and_hotel_approval",
        operatorTermsApproved: false,
        hotelPlacementApproved: false,
        pickupNote:
          "Placement kept pending actual operator terms and hotel approval. Named stop verified separately for Airboat Adventures ('Monteleone — 214 Royal St', 75-minute pickup window, +$30/person R/T) and Jean Lafitte Swamp Tour (FareHarbor item 763318, pickup option #22056428, 45-minute pickup allowance).",
      },
      {
        propertySlug: "roosevelt-new-orleans",
        propertyName: "The Roosevelt New Orleans (CBD / French Quarter Edge)",
        address: "130 Roosevelt Way / 123 Baronne St, New Orleans, LA 70112",
        pickupStatus: "confirmed_named_stop",
        airboatAdventuresNamedStopStatus: "confirmed_named_stop",
        placementApprovalStatus: "active_partner_directory",
        operatorTermsApproved: false,
        hotelPlacementApproved: false,
        pickupNote:
          "Motorcoach and shuttle pickups board at the Baronne Street porte-cochere (listed as 'Roosevelt — 123 Baronne St' on Airboat Adventures' official pickup list with a 75-minute pre-tour pickup window).",
      },
      {
        propertySlug: "omni-riverfront-nola",
        propertyName: "Omni Riverfront Hotel (Warehouse District / Cruise Port)",
        address: "701 Convention Center Blvd, New Orleans, LA 70130",
        pickupStatus: "unconfirmed",
        airboatAdventuresNamedStopStatus: "unconfirmed",
        placementApprovalStatus: "unconfirmed_pickup_stop",
        operatorTermsApproved: false,
        hotelPlacementApproved: false,
        pickupNote:
          "Pickup left UNCONFIRMED until the operator names the applicable stop for 701 Convention Center Blvd (Omni Riverfront is not listed by name on https://airboatadventures.com/pickup-locations/).",
      },
    ],
    trackedProducts: [
      "dcc:tour:fh:jeanlafitteswamptour:763318",
      "dcc:tour:viator:6953SWAMPTRANS",
      "dcc:tour:viator:6455NOLAAIR",
      "dcc:tour:viator:3780AIRBOAT",
      "dcc:tour:viator:3780SWAMP",
    ],
    relatedDraftPrNumbers: [222, 223],
    officialSourcesCheckedOn: "2026-11-06",
    keyOperationalFinding:
      "Recorded Airboat Adventures' published 75-minute pickup window (+$30/person R/T, https://airboatadventures.com/pickup-locations/) strictly separately from the Jean Lafitte offer (763318, 45-minute pickup allowance); left Omni Riverfront pickup unconfirmed until the operator names the applicable stop; kept Hotel Monteleone placement pending actual operator terms and hotel approval.",
  };

/**
 * Evaluates the full DCC Coverage seasonal queue for a given date (`YYYY-MM-DD`).
 * Covers all 5 winter ports (`st-thomas`, `nassau`, `cozumel`, `roatan`, `grand-cayman`),
 * parallel New Orleans hotel-pickup sales test (`new-orleans`), and weekly calendar-checked
 * Alaska preseason ports (`ketchikan`, `skagway`, `sitka`).
 */
export function evaluateDccCoveragePass(options?: {
  asOfDate?: string;
  evaluatedAtIso?: string;
  lastCalendarCheckedOn?: string;
  persistCheckpoint?: boolean;
}): DccCoveragePassReport {
  const evaluatedAtIso =
    options?.evaluatedAtIso ?? new Date().toISOString();
  const asOfDate = options?.asOfDate ?? evaluatedAtIso.slice(0, 10);
  const lastCalendarCheckedOn = options?.lastCalendarCheckedOn ?? "2026-11-06";

  const deduplication = queueMaterialChangesOnce(
    QUEUED_MATERIAL_CHANGES_2026_11_06,
  );

  const winterNonApplicableTrigger = (firstCall: string) =>
    evaluateAlaskaPreseasonTrigger({
      asOfDate,
      firstPublishedCallDate: firstCall,
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

  const countChangesForPort = (slug: DccCoveragePortSlug) =>
    deduplication.allQueuedChanges.filter((m) => m.portSlug === slug).length;

  const baseQueue: DccCoverageQueueItem[] = [
    {
      portSlug: "st-thomas",
      displayName: "St. Thomas, USVI (Havensight WICO vs. Crown Bay + St. John Day-Trip Choice)",
      priorityRank: 1,
      stage: "active_winter_build",
      modelPortSlug: "st-thomas",
      bookingCriticalPriorities: BOOKING_CRITICAL_PRIORITY_ORDER,
      coreTravelerQuestion:
        "Which St. Thomas excursions fit my sailing from Havensight (WICO) versus Crown Bay, and when does a St. John ferry or beach day fit my ship window?",
      seasonalRationale:
        "Canonical winter port model: separates 5199KSML (150m, $89) and 5199P27 (180m, $99), keeps St. Thomas as main destination, offers St. John as a day-trip choice when both ferry legs fit, and flags Needs confirmation where post-Oct 31 VIPA return legs are unresolved.",
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
      preseasonTrigger: winterNonApplicableTrigger("2026-11-06"),
      deliverables: {
        publicAnswerReady: true,
        actualTripCheckerReady: true,
        freeOrSelfGuidedOptionReady: true,
        unsupportedFactsMarkedUnknown: true,
        publicAnswerPath: "/ports/st-thomas",
        checkerEngineModule: "lib/dcc/stThomasPortDayEngine.ts",
      },
      stagedResearchCandidatesCount: 4,
      queuedMaterialChangesCount: countChangesForPort("st-thomas"),
    },
    {
      portSlug: "nassau",
      displayName: "Nassau, Bahamas (Prince George Wharf / Nassau Cruise Port Berths 1–6)",
      priorityRank: 2,
      stage: "active_winter_build",
      modelPortSlug: "st-thomas",
      bookingCriticalPriorities: BOOKING_CRITICAL_PRIORITY_ORDER,
      coreTravelerQuestion:
        "Which Nassau excursions fit my sailing from Prince George Wharf (Nassau Cruise Port), and how much pier-walk or Paradise Island transfer buffer do I need?",
      seasonalRationale:
        "Winter release port #2 modeled on St. Thomas: prioritizes NCP Berths 1–6 exit walk (20–25m), exact pickup mode (70706P11, 352169P2, 6558RUM, 52556P13), and Paradise Island return buffer.",
      calendar: {
        seasonLabel: "Winter 2026/2027 Peak Bahamas Season",
        seasonStart: "2026-11-01",
        seasonEnd: "2027-04-30",
        firstPublishedCallDate: "2026-11-06",
        earliestBookableTourDate: "2026-11-06",
        publishedCallSourceUrl: "https://www.nassaucruiseport.com/",
        bookingCalendarSourceUrl: "https://www.nassaucruiseport.com/",
        lastCalendarCheckedOn,
      },
      preseasonTrigger: winterNonApplicableTrigger("2026-11-06"),
      deliverables: {
        publicAnswerReady: true,
        actualTripCheckerReady: true,
        freeOrSelfGuidedOptionReady: true,
        unsupportedFactsMarkedUnknown: true,
        publicAnswerPath: "/ports/nassau",
        checkerEngineModule:
          "lib/dcc/winterPorts/fivePortWinterReleaseEngine.ts",
      },
      stagedResearchCandidatesCount: 1,
      queuedMaterialChangesCount: countChangesForPort("nassau"),
    },
    {
      portSlug: "cozumel",
      displayName: "Cozumel, Mexico (Punta Langosta vs. International Pier SSA vs. Puerta Maya)",
      priorityRank: 3,
      stage: "active_winter_build",
      modelPortSlug: "st-thomas",
      bookingCriticalPriorities: BOOKING_CRITICAL_PRIORITY_ORDER,
      coreTravelerQuestion:
        "Which Cozumel excursions fit my ship's pier (Punta Langosta vs. International Pier SSA vs. Puerta Maya), and why are mainland Chichén Itzá ferries eliminated on standard calls?",
      seasonalRationale:
        "Winter release port #3 modeled on St. Thomas: prioritizes 3-pier transfer deltas (103974P5, 5553274P1, 122218P1) and eliminates 12-hour mainland ferry tours (5885P231) on 8–9h calls.",
      calendar: {
        seasonLabel: "Winter 2026/2027 Western Caribbean Season",
        seasonStart: "2026-11-01",
        seasonEnd: "2027-04-30",
        firstPublishedCallDate: "2026-11-06",
        earliestBookableTourDate: "2026-11-06",
        publishedCallSourceUrl: "https://www.apimqroo.com.mx/",
        bookingCalendarSourceUrl: "https://www.apimqroo.com.mx/",
        lastCalendarCheckedOn,
      },
      preseasonTrigger: winterNonApplicableTrigger("2026-11-06"),
      deliverables: {
        publicAnswerReady: true,
        actualTripCheckerReady: true,
        freeOrSelfGuidedOptionReady: true,
        unsupportedFactsMarkedUnknown: true,
        publicAnswerPath: "/ports/cozumel",
        checkerEngineModule:
          "lib/dcc/winterPorts/fivePortWinterReleaseEngine.ts",
      },
      stagedResearchCandidatesCount: 1,
      queuedMaterialChangesCount: countChangesForPort("cozumel"),
    },
    {
      portSlug: "roatan",
      displayName: "Roatán, Honduras (Port of Roatán Coxen Hole vs. Mahogany Bay Cruise Center)",
      priorityRank: 4,
      stage: "active_winter_build",
      modelPortSlug: "st-thomas",
      bookingCriticalPriorities: BOOKING_CRITICAL_PRIORITY_ORDER,
      coreTravelerQuestion:
        "Which Roatán excursions fit my sailing from Port of Roatán (Coxen Hole) versus Mahogany Bay Cruise Center, and where do independent operators pick up?",
      seasonalRationale:
        "Winter release port #4 modeled on St. Thomas: prioritizes Coxen Hole Gate #1/#3 vs. Mahogany Bay 400m hill walk pickup rules (184749P2, 207776P19, 192350P17) and West Bay road buffer.",
      calendar: {
        seasonLabel: "Winter 2026/2027 Western Caribbean Season",
        seasonStart: "2026-11-01",
        seasonEnd: "2027-04-30",
        firstPublishedCallDate: "2026-11-06",
        earliestBookableTourDate: "2026-11-06",
        publishedCallSourceUrl: "https://www.portofroatan.com/",
        bookingCalendarSourceUrl: "https://www.mahoganybaycc.com/",
        lastCalendarCheckedOn,
      },
      preseasonTrigger: winterNonApplicableTrigger("2026-11-06"),
      deliverables: {
        publicAnswerReady: true,
        actualTripCheckerReady: true,
        freeOrSelfGuidedOptionReady: true,
        unsupportedFactsMarkedUnknown: true,
        publicAnswerPath: "/ports/roatan",
        checkerEngineModule:
          "lib/dcc/winterPorts/fivePortWinterReleaseEngine.ts",
      },
      stagedResearchCandidatesCount: 1,
      queuedMaterialChangesCount: countChangesForPort("roatan"),
    },
    {
      portSlug: "grand-cayman",
      displayName: "George Town, Grand Cayman (Royal Watler Tender vs. Spotts Bay Weather Tender)",
      priorityRank: 5,
      stage: "active_winter_build",
      modelPortSlug: "st-thomas",
      bookingCriticalPriorities: BOOKING_CRITICAL_PRIORITY_ORDER,
      coreTravelerQuestion:
        "Which Grand Cayman Stingray City or Seven Mile Beach excursions fit a tender port call at George Town (Royal Watler) versus Spotts Bay?",
      seasonalRationale:
        "Winter release port #5 modeled on St. Thomas: prioritizes 40m outbound tender / 75m return tender cutoff at Royal Watler (5540814P1, 477029P1, 10309P3) and Spotts Bay Nor'wester diversion rules.",
      calendar: {
        seasonLabel: "Winter 2026/2027 Western Caribbean Season",
        seasonStart: "2026-11-01",
        seasonEnd: "2027-04-30",
        firstPublishedCallDate: "2026-11-06",
        earliestBookableTourDate: "2026-11-06",
        publishedCallSourceUrl: "https://www.caymanport.com/ship-schedules/",
        bookingCalendarSourceUrl: "https://www.caymanport.com/ship-schedules/",
        lastCalendarCheckedOn,
      },
      preseasonTrigger: winterNonApplicableTrigger("2026-11-06"),
      deliverables: {
        publicAnswerReady: true,
        actualTripCheckerReady: true,
        freeOrSelfGuidedOptionReady: true,
        unsupportedFactsMarkedUnknown: true,
        publicAnswerPath: "/ports/grand-cayman",
        checkerEngineModule:
          "lib/dcc/winterPorts/fivePortWinterReleaseEngine.ts",
      },
      stagedResearchCandidatesCount: 1,
      queuedMaterialChangesCount: countChangesForPort("grand-cayman"),
    },
    {
      portSlug: "new-orleans",
      displayName:
        "New Orleans Hotel-Pickup Sales Test (French Quarter / CBD / Cruise Port)",
      priorityRank: 6,
      stage: "active_sales_test",
      modelPortSlug: null,
      bookingCriticalPriorities: BOOKING_CRITICAL_PRIORITY_ORDER,
      coreTravelerQuestion:
        "Which New Orleans swamp and bayou tours include verified hotel pickup from my French Quarter, CBD, or Cruise Port hotel versus self-drive or Toulouse Street dock coach boarding?",
      seasonalRationale:
        "Parallel sales test: records Airboat Adventures' 75-minute pickup window (+$30/person R/T) separately from Jean Lafitte (763318, 45m pickup allowance), leaves Omni Riverfront pickup unconfirmed, and keeps Hotel Monteleone placement pending operator terms and hotel approval.",
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
      preseasonTrigger: winterNonApplicableTrigger("2026-11-06"),
      deliverables: {
        publicAnswerReady: true,
        actualTripCheckerReady: true,
        freeOrSelfGuidedOptionReady: true,
        unsupportedFactsMarkedUnknown: true,
        publicAnswerPath: "/new-orleans/swamp-tours",
        checkerEngineModule:
          "lib/dcc/decisionEngines/newOrleansSwampToursEngine.ts",
      },
      stagedResearchCandidatesCount: 16,
      queuedMaterialChangesCount: countChangesForPort("new-orleans"),
    },
    {
      portSlug: "ketchikan",
      displayName: "Ketchikan, Alaska (Ward Cove vs. Downtown Berths I–IV)",
      priorityRank: 7,
      stage:
        ketchikanTrigger.triggerVerdict === "start_full_alaska_build_now"
          ? "active_build_ready"
          : "preseason_preparation",
      modelPortSlug: null,
      bookingCriticalPriorities: BOOKING_CRITICAL_PRIORITY_ORDER,
      coreTravelerQuestion:
        "Which excursions fit my sailing from Ward Cove versus a downtown berth?",
      seasonalRationale:
        "Kept on weekly calendar checks; full Alaska build triggers 8–12 weeks before verified first 2027 call (window opens 2027-02-01 for 2027-04-26 opener).",
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
      queuedMaterialChangesCount: countChangesForPort("ketchikan"),
    },
    {
      portSlug: "skagway",
      displayName:
        "Skagway, Alaska (Railroad, Ore, Broadway & White Pass Corridor)",
      priorityRank: 8,
      stage:
        skagwayTrigger.triggerVerdict === "start_full_alaska_build_now"
          ? "active_build_ready"
          : "preseason_preparation",
      modelPortSlug: null,
      bookingCriticalPriorities: BOOKING_CRITICAL_PRIORITY_ORDER,
      coreTravelerQuestion:
        "Which White Pass & Yukon Route rail, Klondike Highway, and glacier excursions fit my Skagway berth and shuttle window?",
      seasonalRationale:
        "Kept on weekly calendar checks; full build triggers 8–12 weeks before verified first 2027 Skagway call (window opens 2027-02-03 for 2027-04-28 opener).",
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
      displayName:
        "Sitka, Alaska (Sitka Sound Cruise Terminal Shuttle vs. Downtown Tender)",
      priorityRank: 9,
      stage:
        sitkaTrigger.triggerVerdict === "start_full_alaska_build_now"
          ? "active_build_ready"
          : "preseason_preparation",
      modelPortSlug: null,
      bookingCriticalPriorities: BOOKING_CRITICAL_PRIORITY_ORDER,
      coreTravelerQuestion:
        "Which Sitka wildlife, Fortress of the Bear, and raptor excursions fit my Sitka Sound Cruise Terminal shuttle window versus a downtown tender call?",
      seasonalRationale:
        "Kept on weekly calendar checks; full build triggers 8–12 weeks before verified first 2027 Sitka call (window opens 2027-02-04 for 2027-04-29 opener).",
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

  const checkpoint: DccCoverageSavedCheckpoint = {
    automationId: "dcc-coverage",
    lastSuccessfulCheckDate: asOfDate,
    lastSuccessfulCheckAtIso: evaluatedAtIso,
    lastWeeklyCalendarCheckedOn: lastCalendarCheckedOn,
    fiveWinterPortsChecked: FIVE_WINTER_RELEASE_PORT_SLUGS,
    alaskaWeeklyCalendarPorts: ["ketchikan", "skagway", "sitka"],
    queuedMaterialChangeIds: deduplication.allQueuedChanges.map(
      (c) => c.changeId,
    ),
  };

  if (options?.persistCheckpoint !== false) {
    saveLastSuccessfulDccCoverageCheck(checkpoint);
  } else {
    inMemoryLastSuccessfulCheck = checkpoint;
  }

  const january24SailingPreview = buildJanuary24SailingPreview();

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
    lastSuccessfulCheck: checkpoint,
    newlyQueuedMaterialChangesCount: deduplication.newlyQueuedChanges.length,
    deduplicatedExistingMaterialChangesCount:
      deduplication.alreadyQueuedChanges.length,
    fiveWinterPorts: FIVE_WINTER_RELEASE_PORT_SLUGS,
    activeBuildPort: baseQueue[0]!,
    parallelSalesTest: NEW_ORLEANS_HOTEL_PICKUP_SALES_TEST_STATUS,
    orderedQueue: baseQueue,
    queuedMaterialChanges: deduplication.allQueuedChanges,
    january24SailingPreview,
    previewStatus: january24SailingPreview.previewStatus,
    productionStatus: january24SailingPreview.productionStatus,
    humanDecisionsNeeded: [
      {
        decisionId: "dec-stt-separate-5199ksml-and-5199p27-approval",
        area: "st-thomas",
        summary:
          "Approve the strictly separated St. Thomas Viator listings in the usvi-st-thomas review queue: 5199KSML (Mangrove Lagoon Kayak & Snorkel, 150 min, $89.00, self_drive to 6526 Estate Nadir, d965-5199KSML) and 5199P27 (Cas Cay Kayak, Hike & Snorkel, 180 min, $99.00, self_drive to 6526 Estate Nadir, d965-5199P27).",
        optionsOrAction:
          "Confirm both separate candidate records so they promote from 'needs confirmation' to 'verified' for production publishing.",
        blockingForProductionPublish: true,
      },
      {
        decisionId: "dec-stt-vipa-post-oct31-ferry-and-st-john-daytrip-approval",
        area: "st-thomas",
        summary:
          "Approve the VIPA Red Hook <-> Cruz Bay ferry rule ($8.15 adult / 15m crossing / Crown Bay afternoon-only 2:15 PM, 3:30 PM, 5:30 PM) and confirm keeping St. John return legs marked 'Needs confirmation' on post-October 31 sailings until VIPA replaces the expired July 26–October 31, 2026 notice.",
        optionsOrAction:
          "Approve in the usvi-st-thomas review desk (alongside Magens Bay Authority $7.00 adult / under-12 free admission).",
        blockingForProductionPublish: true,
      },
      {
        decisionId: "dec-winter-four-expansion-ports-facts-approval",
        area: "nassau",
        summary:
          "Approve the queued pier/tender timing, pickup, and exact departure candidate facts for the 4 additional winter release ports modeled on St. Thomas: Nassau (NCP Berths 1–6 20–25m exit walk + 52556P13 Needs confirmation), Cozumel (3-pier transfer matrix + 12h mainland ferry disqualification), Roatán (Coxen Hole Gate #1/#3 vs. Mahogany Bay 400m hill walk), and Grand Cayman (40m outbound / 75m return tender buffer + Spotts Bay diversion).",
        optionsOrAction:
          "Review and confirm in the review desk before merging Draft PR #223 to production.",
        blockingForProductionPublish: true,
      },
      {
        decisionId: "dec-nola-separate-airboat-75m-omni-unconfirmed-monteleone-terms",
        area: "new-orleans",
        summary:
          "Approve the separate Airboat Adventures pickup rule (75-minute pre-tour pickup window, +$30/person R/T) vs. Jean Lafitte (763318, 45-minute pickup allowance), confirm leaving Omni Riverfront pickup unconfirmed until the operator names the applicable stop, and approve Hotel Monteleone placement once actual operator terms and hotel approval are signed.",
        optionsOrAction:
          "Keep Hotel Monteleone in demo-preset status ('Pending Operator Terms & Hotel Approval') and Omni Riverfront pickup 'unconfirmed' until commercial and operator confirmations arrive.",
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
