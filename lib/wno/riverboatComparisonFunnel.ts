import { listRecentCorridorEvents } from "@/lib/dcc/telemetry/corridorEvents";
import { listCommercialOutcomes, type CommercialOutcomeRecord } from "@/lib/dcc/commerce";

export function separateFareHarborCommissionBreakdown(
  bookingOutcome: Pick<
    CommercialOutcomeRecord,
    "eventType" | "estimatedCommission" | "paidCommission"
  >,
): {
  estimatedCommissionUsd: number;
  confirmedEarningsUsd: number;
  payoutsUsd: number;
  commissionStage: "estimated_only" | "confirmed_earned" | "payout_settled";
} {
  const estimatedCommissionUsd =
    typeof bookingOutcome.estimatedCommission?.amount === "number" &&
    Number.isFinite(bookingOutcome.estimatedCommission.amount)
      ? bookingOutcome.estimatedCommission.amount
      : 0;
  const paidAmount =
    typeof bookingOutcome.paidCommission?.amount === "number" &&
    Number.isFinite(bookingOutcome.paidCommission.amount) &&
    bookingOutcome.paidCommission.amount > 0
      ? bookingOutcome.paidCommission.amount
      : 0;

  // Never include an unconfirmed booking estimate inside confirmedEarningsUsd or payoutsUsd
  const isFulfilledOrReconciled =
    bookingOutcome.eventType === "BOOKING_FULFILLED" ||
    bookingOutcome.eventType === "COMMISSION_RECONCILED";
  const isSettledPayout = bookingOutcome.eventType === "COMMISSION_RECONCILED" && paidAmount > 0;

  const confirmedEarningsUsd = isFulfilledOrReconciled ? paidAmount : 0;
  const payoutsUsd = isSettledPayout ? paidAmount : 0;
  const commissionStage = isSettledPayout
    ? "payout_settled"
    : confirmedEarningsUsd > 0
      ? "confirmed_earned"
      : "estimated_only";

  return {
    estimatedCommissionUsd,
    confirmedEarningsUsd,
    payoutsUsd,
    commissionStage,
  };
}

export const RIVERBOAT_COMPARISON_SLUG = "natchez-vs-city-of-new-orleans-riverboat" as const;
export const DCC_AUTHORITY_NOLA_RIVERBOATS_SRC = "dcc-authority-nola-riverboats" as const;
export const RIVERBOAT_COMPARISON_PATHS = [
  "/compare/natchez-vs-city-of-new-orleans-riverboat",
  "/new-orleans/compare/natchez-vs-city-of-new-orleans-riverboat",
] as const;

export const NATCHEZ_DAYTIME_PRODUCT_SLUG = "daytime-jazz-cruise" as const;
export const NATCHEZ_DAYTIME_PRIMARY_ITEM_ID = "561220" as const;
export const NATCHEZ_DAYTIME_FLOW_ID = "1621342" as const;
export const NATCHEZ_ALL_ITEM_IDS = new Set([
  "561220", // Sightseeing
  "561185", // 11:00 AM Lunch
  "561216", // 12:15 PM Lunch
  "566787", // 2:00 PM Lunch
  "566794", // 3:15 PM Lunch
  "561392", // Seasonal Party Package
]);

export const CITY_RIVERBOAT_PRODUCT_SLUG = "city-of-new-orleans-riverboat-cruise" as const;
export const CITY_RIVERBOAT_PRIMARY_ITEM_ID = "694782" as const;
export const CITY_RIVERBOAT_FLOW_ID = "1621347" as const;
export const CITY_RIVERBOAT_ALL_ITEM_IDS = new Set(["694782"]);

export type RiverboatVesselKey = "natchez" | "city_of_new_orleans";

export type RiverboatFunnelStage =
  | "comparison_visit"
  | "boat_selected"
  | "checkout_opened"
  | "provider_confirmed_booking";

export interface RiverboatVesselFunnelMetrics {
  vesselKey: RiverboatVesselKey;
  vesselLabel: string;
  productSlug: string;
  tourDetailPath: string;
  operatorShortname: "neworleanssteamboatcompany";
  primaryFareHarborItemId: string;
  primaryFareHarborFlowId: string;
  publishedAdultPriceUsd: number;
  boatSelectedEvents: number;
  boatSelectedUniqueSessions: number;
  tourDetailOpenedEvents: number;
  tourDetailOpenedFromComparisonSessions: number;
  checkoutOpenedPrimaryItemEvents: number;
  checkoutOpenedAllVariantsEvents: number;
  checkoutOpenedFromComparisonSessions: number;
  providerConfirmedBookingsCount: number;
  providerConfirmedFromComparisonCount: number;
  confirmedGrossSalesUsd: number;
  estimatedCommissionUsd: number;
  confirmedEarningsUsd: number;
  payoutsUsd: number;
  confirmedCommissionsUsd: number;
  unconfirmedCheckoutOpensCount: number;
  providerConfirmationStatus: "confirmed_bookings_present" | "awaiting_provider_confirmation";
}

export interface RiverboatEntryPageBreakdownRow {
  entryPage: string;
  comparisonVisits: number;
  natchezSelected: number;
  citySelected: number;
  natchezCheckoutOpened561220: number;
  cityCheckoutOpened694782: number;
  providerConfirmedBookings: number;
  confirmedGrossSalesUsd: number;
  estimatedCommissionUsd: number;
  confirmedEarningsUsd: number;
  payoutsUsd: number;
  confirmedCommissionsUsd: number;
}

export interface RiverboatEntrySourceBreakdownRow {
  entrySource: string;
  comparisonVisits: number;
  uniqueVisitorSessions: number;
  natchezSelected: number;
  citySelected: number;
  natchezCheckoutOpened561220: number;
  cityCheckoutOpened694782: number;
  providerConfirmedBookings: number;
  confirmedGrossSalesUsd: number;
  estimatedCommissionUsd: number;
  confirmedEarningsUsd: number;
  payoutsUsd: number;
  confirmedCommissionsUsd: number;
}

export interface DccAuthorityRiverboatsCohortSummary {
  sourceTag: typeof DCC_AUTHORITY_NOLA_RIVERBOATS_SRC;
  dccGuideUrl: string;
  targetComparisonUrl: string;
  excludedTestSessionsFromCustomerTotals: true;
  visitorsArrived: {
    totalEvents: number;
    uniqueSessions: number;
  };
  boatChosen: {
    totalEvents: number;
    uniqueSessions: number;
    natchezEvents: number;
    natchezUniqueSessions: number;
    cityOfNewOrleansEvents: number;
    cityOfNewOrleansUniqueSessions: number;
  };
  exactFareHarborItemOpened: {
    totalEvents: number;
    uniqueSessions: number;
    natchez561220Events: number;
    natchez561220UniqueSessions: number;
    city694782Events: number;
    city694782UniqueSessions: number;
  };
  providerConfirmedOutcomes: {
    confirmedBookingsCount: number;
    confirmedGrossSalesUsd: number;
    estimatedCommissionUsd: number;
    confirmedEarningsUsd: number;
    payoutsUsd: number;
    confirmedCommissionsUsd: number;
    status: "confirmed_bookings_present" | "awaiting_provider_confirmation";
  };
}

export interface VerifiedRiverboatTestSessionRecord {
  sessionId: string;
  entrySource: string;
  landingPath: string | null;
  comparisonVisited: boolean;
  boatSelected: RiverboatVesselKey | null;
  tourDetailOpened: string | null;
  checkoutOpenedItemId: string | null;
  completedAllStagesThroughCheckout: boolean;
  excludedFromCustomerTotals: true;
  lastEventAt: string;
}

export interface RiverboatComparisonFunnelReport {
  generatedAt: string;
  funnelId: "wno_riverboat_comparison";
  comparisonSlug: typeof RIVERBOAT_COMPARISON_SLUG;
  comparisonUrl: string;
  windowDays: number;
  includeSyntheticTests: boolean;
  customerTotalsExcludeTestSessions: true;
  commissionBreakdown: {
    estimatedCommissionUsd: number;
    confirmedEarningsUsd: number;
    payoutsUsd: number;
    confirmedFieldIncludesEstimate: false;
    policyNote: string;
  };
  stages: {
    comparisonVisits: {
      totalEvents: number;
      uniqueSessions: number;
    };
    boatSelected: {
      totalEvents: number;
      uniqueSessions: number;
      conversionFromVisitPct: number | null;
    };
    checkoutOpened: {
      totalEvents: number;
      primaryItems561220And694782Events: number;
      uniqueSessionsFromComparison: number;
      conversionFromBoatSelectedPct: number | null;
      conversionFromVisitPct: number | null;
    };
    providerConfirmedBookings: {
      totalConfirmedBookings: number;
      confirmedFromComparisonSessions: number;
      confirmedGrossSalesUsd: number;
      estimatedCommissionUsd: number;
      confirmedEarningsUsd: number;
      payoutsUsd: number;
      confirmedCommissionsUsd: number;
      conversionFromCheckoutOpenedPct: number | null;
      status: "confirmed_bookings_present" | "awaiting_provider_confirmation";
    };
  };
  dccAuthorityRiverboatsCorridor: DccAuthorityRiverboatsCohortSummary;
  vessels: {
    natchez: RiverboatVesselFunnelMetrics;
    cityOfNewOrleans: RiverboatVesselFunnelMetrics;
  };
  entryPageBreakdown: RiverboatEntryPageBreakdownRow[];
  entrySourceBreakdown: RiverboatEntrySourceBreakdownRow[];
  verifiedTestSessions: {
    excludedFromCustomerTotals: true;
    totalTestSessionsCount: number;
    dccAuthorityRiverboatsTestSessionsCount: number;
    verifiedCheckoutTestSessionsCount: number;
    sessions: VerifiedRiverboatTestSessionRecord[];
  };
  recentFunnelEvents: Array<{
    occurredAt: string;
    sessionId: string | null;
    stage: RiverboatFunnelStage;
    vesselKey: RiverboatVesselKey | null;
    productSlug: string | null;
    itemId: string | null;
    entrySource: string | null;
    landingPath: string | null;
    sourcePage: string | null;
    targetPath: string | null;
  }>;
}

function normalizePath(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "";
  const raw = value.trim();
  try {
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      return new URL(raw).pathname.replace(/\/+$/, "") || "/";
    }
  } catch {}
  return raw.split("?")[0].replace(/\/+$/, "") || "/";
}

export function isRiverboatComparisonPath(pathOrUrl: unknown): boolean {
  const norm = normalizePath(pathOrUrl).toLowerCase();
  return (
    norm === "/compare/natchez-vs-city-of-new-orleans-riverboat" ||
    norm === "/new-orleans/compare/natchez-vs-city-of-new-orleans-riverboat" ||
    norm.endsWith("/compare/natchez-vs-city-of-new-orleans-riverboat")
  );
}

export function isRiverboatTestEvent(ev: any): boolean {
  const sessionId = String(ev?.sessionId || ev?.session_id || "").trim().toLowerCase();
  const handoffId = String(ev?.handoffId || ev?.handoff_id || "").trim().toLowerCase();
  if (
    sessionId.startsWith("wno_test_") ||
    sessionId.startsWith("wno_verify_") ||
    sessionId.startsWith("test_") ||
    sessionId.startsWith("smoke_") ||
    handoffId.startsWith("wno_test_") ||
    handoffId.startsWith("test_") ||
    handoffId.startsWith("smoke_")
  ) {
    return true;
  }
  const meta =
    ev?.metadata && typeof ev.metadata === "object"
      ? (ev.metadata as Record<string, unknown>)
      : {};
  return Boolean(meta.is_test === true || meta.test === true || meta.synthetic === true);
}

export function inferRiverboatVesselFromData(input: {
  productSlug?: unknown;
  targetPath?: unknown;
  itemId?: unknown;
  selectedBoat?: unknown;
}): RiverboatVesselKey | null {
  const boat = typeof input.selectedBoat === "string" ? input.selectedBoat.trim().toLowerCase() : "";
  if (boat === "natchez" || boat === "steamboat_natchez") return "natchez";
  if (boat === "city_of_new_orleans" || boat === "city") return "city_of_new_orleans";

  const itemId =
    typeof input.itemId === "string" || typeof input.itemId === "number"
      ? String(input.itemId).trim()
      : "";
  if (itemId && NATCHEZ_ALL_ITEM_IDS.has(itemId)) return "natchez";
  if (itemId && CITY_RIVERBOAT_ALL_ITEM_IDS.has(itemId)) return "city_of_new_orleans";

  const target = typeof input.targetPath === "string" ? input.targetPath : "";
  if (target.includes(`/items/${NATCHEZ_DAYTIME_PRIMARY_ITEM_ID}`)) return "natchez";
  if (target.includes(`/items/${CITY_RIVERBOAT_PRIMARY_ITEM_ID}`)) return "city_of_new_orleans";

  const slug = typeof input.productSlug === "string" ? input.productSlug.trim().toLowerCase() : "";
  if (slug === NATCHEZ_DAYTIME_PRODUCT_SLUG || target.includes("/tours/daytime-jazz-cruise")) {
    return "natchez";
  }
  if (
    slug === CITY_RIVERBOAT_PRODUCT_SLUG ||
    target.includes("/tours/city-of-new-orleans-riverboat-cruise")
  ) {
    return "city_of_new_orleans";
  }
  return null;
}

export function extractFareHarborItemId(input: {
  itemId?: unknown;
  targetPath?: unknown;
  productSlug?: unknown;
}): string | null {
  if (typeof input.itemId === "string" && input.itemId.trim()) {
    return input.itemId.trim();
  }
  if (typeof input.itemId === "number" && Number.isFinite(input.itemId)) {
    return String(input.itemId);
  }
  if (typeof input.targetPath === "string") {
    const match = input.targetPath.match(/\/items\/(\d+)/i);
    if (match?.[1]) return match[1];
  }
  const slug = typeof input.productSlug === "string" ? input.productSlug.trim().toLowerCase() : "";
  if (slug === NATCHEZ_DAYTIME_PRODUCT_SLUG) return NATCHEZ_DAYTIME_PRIMARY_ITEM_ID;
  if (slug === CITY_RIVERBOAT_PRODUCT_SLUG) return CITY_RIVERBOAT_PRIMARY_ITEM_ID;
  return null;
}

function pct(num: number, den: number): number | null {
  if (!den || den <= 0) return null;
  return Math.round((num / den) * 1000) / 10;
}

function roundUsd(amount: number): number {
  return Math.round(amount * 100) / 100;
}

function extractRawSourceTag(ev: any): string | null {
  const meta =
    ev?.metadata && typeof ev.metadata === "object"
      ? (ev.metadata as Record<string, unknown>)
      : {};
  const explicitEntrySource = String(meta.entry_source || meta.entrySource || "").trim();
  if (explicitEntrySource) return explicitEntrySource;

  const rawSourcePage = String(ev?.sourcePage || ev?.source_page || "").trim();
  if (
    rawSourcePage &&
    !rawSourcePage.startsWith("/") &&
    !rawSourcePage.startsWith("http://") &&
    !rawSourcePage.startsWith("https://")
  ) {
    return rawSourcePage;
  }
  return null;
}

export async function buildRiverboatComparisonFunnelReport(options?: {
  windowDays?: number;
  customEvents?: any[];
  customOutcomes?: any[];
}): Promise<RiverboatComparisonFunnelReport> {
  const windowDays = options?.windowDays ?? 28;
  const cutoffMs = Date.now() - windowDays * 24 * 60 * 60 * 1000;

  const rawEvents = options?.customEvents ?? (await listRecentCorridorEvents(10000));
  const outcomes =
    options?.customOutcomes ??
    (options?.customEvents ? [] : await listCommercialOutcomes().catch(() => []));

  const allWnoEvents = rawEvents.filter((ev: any) => {
    const cid = ev.corridorId || ev.corridor_id;
    if (cid !== "wno-commerce") return false;
    const ts = Date.parse(ev.occurredAt || ev.occurred_at || ev.createdAt || ev.created_at || "");
    return !Number.isFinite(ts) || ts >= cutoffMs;
  });

  // Partition customer events vs tagged test events so test sessions are excluded from customer totals
  const wnoEvents = allWnoEvents.filter((ev: any) => !isRiverboatTestEvent(ev));
  const wnoTestEvents = allWnoEvents.filter((ev: any) => isRiverboatTestEvent(ev));

  // Track sessions that visited the riverboat comparison page and map sessionId -> entrySource
  const comparisonSessions = new Set<string>();
  const sessionEntrySourceMap = new Map<string, string>();
  let comparisonVisitEvents = 0;

  // First pass on customer events: identify all sessions that touched /compare/natchez-vs-city-of-new-orleans-riverboat and their entrySource
  for (const ev of wnoEvents) {
    const sessionId = String(ev.sessionId || ev.session_id || "").trim();
    const landingPath = ev.landingPath || ev.landing_path || "";
    const sourcePage = ev.sourcePage || ev.source_page || "";
    const targetPath = ev.targetPath || ev.target_path || "";
    const meta = (ev.metadata && typeof ev.metadata === "object" ? ev.metadata : {}) as Record<
      string,
      unknown
    >;
    const compSlug = String(meta.comparison_slug || meta.comparisonSlug || "").trim();

    const touchedComparison =
      compSlug === RIVERBOAT_COMPARISON_SLUG ||
      isRiverboatComparisonPath(landingPath) ||
      isRiverboatComparisonPath(sourcePage) ||
      isRiverboatComparisonPath(targetPath);

    if (touchedComparison && sessionId) {
      comparisonSessions.add(sessionId);
    }

    const rawSourceTag = extractRawSourceTag(ev);
    if (sessionId && rawSourceTag) {
      if (
        !sessionEntrySourceMap.has(sessionId) ||
        rawSourceTag === DCC_AUTHORITY_NOLA_RIVERBOATS_SRC
      ) {
        sessionEntrySourceMap.set(sessionId, rawSourceTag);
      }
    }
  }

  const boatSelectedSessions = new Set<string>();
  let boatSelectedEvents = 0;

  const checkoutOpenedFromCompSessions = new Set<string>();
  let checkoutOpenedTotalEvents = 0;
  let checkoutOpenedPrimaryEvents = 0;

  const confirmedFromCompSessions = new Set<string>();

  const vesselAcc: Record<
    RiverboatVesselKey,
    {
      boatSelectedEvents: number;
      boatSelectedSessions: Set<string>;
      tourDetailOpenedEvents: number;
      tourDetailFromCompSessions: Set<string>;
      checkoutPrimaryItemEvents: number;
      checkoutAllVariantsEvents: number;
      checkoutFromCompSessions: Set<string>;
      confirmedCount: number;
      confirmedFromCompCount: number;
      confirmedGrossSalesUsd: number;
      estimatedCommissionUsd: number;
      confirmedEarningsUsd: number;
      payoutsUsd: number;
      confirmedCommissionsUsd: number;
    }
  > = {
    natchez: {
      boatSelectedEvents: 0,
      boatSelectedSessions: new Set(),
      tourDetailOpenedEvents: 0,
      tourDetailFromCompSessions: new Set(),
      checkoutPrimaryItemEvents: 0,
      checkoutAllVariantsEvents: 0,
      checkoutFromCompSessions: new Set(),
      confirmedCount: 0,
      confirmedFromCompCount: 0,
      confirmedGrossSalesUsd: 0,
      estimatedCommissionUsd: 0,
      confirmedEarningsUsd: 0,
      payoutsUsd: 0,
      confirmedCommissionsUsd: 0,
    },
    city_of_new_orleans: {
      boatSelectedEvents: 0,
      boatSelectedSessions: new Set(),
      tourDetailOpenedEvents: 0,
      tourDetailFromCompSessions: new Set(),
      checkoutPrimaryItemEvents: 0,
      checkoutAllVariantsEvents: 0,
      checkoutFromCompSessions: new Set(),
      confirmedCount: 0,
      confirmedFromCompCount: 0,
      confirmedGrossSalesUsd: 0,
      estimatedCommissionUsd: 0,
      confirmedEarningsUsd: 0,
      payoutsUsd: 0,
      confirmedCommissionsUsd: 0,
    },
  };

  const entryPageMap = new Map<string, RiverboatEntryPageBreakdownRow>();
  function getEntryRow(entryPage: string): RiverboatEntryPageBreakdownRow {
    const key = entryPage || "/compare/natchez-vs-city-of-new-orleans-riverboat";
    let row = entryPageMap.get(key);
    if (!row) {
      row = {
        entryPage: key,
        comparisonVisits: 0,
        natchezSelected: 0,
        citySelected: 0,
        natchezCheckoutOpened561220: 0,
        cityCheckoutOpened694782: 0,
        providerConfirmedBookings: 0,
        confirmedGrossSalesUsd: 0,
        estimatedCommissionUsd: 0,
        confirmedEarningsUsd: 0,
        payoutsUsd: 0,
        confirmedCommissionsUsd: 0,
      };
      entryPageMap.set(key, row);
    }
    return row;
  }

  const entrySourceMap = new Map<
    string,
    RiverboatEntrySourceBreakdownRow & { sessions: Set<string> }
  >();
  function getSourceRow(entrySource: string) {
    const key = entrySource || "direct-or-untagged";
    let row = entrySourceMap.get(key);
    if (!row) {
      row = {
        entrySource: key,
        comparisonVisits: 0,
        uniqueVisitorSessions: 0,
        natchezSelected: 0,
        citySelected: 0,
        natchezCheckoutOpened561220: 0,
        cityCheckoutOpened694782: 0,
        providerConfirmedBookings: 0,
        confirmedGrossSalesUsd: 0,
        estimatedCommissionUsd: 0,
        confirmedEarningsUsd: 0,
        payoutsUsd: 0,
        confirmedCommissionsUsd: 0,
        sessions: new Set<string>(),
      };
      entrySourceMap.set(key, row);
    }
    return row;
  }

  // Dedicated accumulator for src=dcc-authority-nola-riverboats
  const dccCohortAcc = {
    arrivedEvents: 0,
    arrivedSessions: new Set<string>(),
    boatChosenEvents: 0,
    boatChosenSessions: new Set<string>(),
    natchezChosenEvents: 0,
    natchezChosenSessions: new Set<string>(),
    cityChosenEvents: 0,
    cityChosenSessions: new Set<string>(),
    checkoutOpenedEvents: 0,
    checkoutOpenedSessions: new Set<string>(),
    natchez561220Events: 0,
    natchez561220Sessions: new Set<string>(),
    city694782Events: 0,
    city694782Sessions: new Set<string>(),
    confirmedBookingsCount: 0,
    confirmedGrossSalesUsd: 0,
    estimatedCommissionUsd: 0,
    confirmedEarningsUsd: 0,
    payoutsUsd: 0,
    confirmedCommissionsUsd: 0,
  };

  const recentFunnelEvents: RiverboatComparisonFunnelReport["recentFunnelEvents"] = [];
  const seenCorridorBookingRefs = new Set<string>();
  const seenCorridorEstimatedRefs = new Set<string>();
  const seenCorridorEarnedRefs = new Set<string>();
  const seenCorridorPayoutRefs = new Set<string>();

  for (const ev of wnoEvents) {
    const eventName = String(ev.eventName || ev.event_name || "").trim();
    const sessionId = String(ev.sessionId || ev.session_id || "").trim() || null;
    const landingPath = normalizePath(ev.landingPath || ev.landing_path || "") || null;
    const sourcePage = normalizePath(ev.sourcePage || ev.source_page || "") || null;
    const targetPath = String(ev.targetPath || ev.target_path || "").trim() || null;
    const clickedProductSlug =
      String(ev.clickedProductSlug || ev.clicked_product_slug || "").trim() || null;
    const meta = (ev.metadata && typeof ev.metadata === "object" ? ev.metadata : {}) as Record<
      string,
      unknown
    >;
    const originalEventName = String(meta.original_event_name || eventName).trim();
    const funnelStageMeta = String(meta.funnel_stage || "").trim();
    const compSlug = String(meta.comparison_slug || meta.comparisonSlug || "").trim();
    const occurredAt = String(
      ev.occurredAt || ev.occurred_at || ev.createdAt || ev.created_at || new Date().toISOString(),
    );

    const resolvedEntrySource =
      extractRawSourceTag(ev) ||
      (sessionId ? sessionEntrySourceMap.get(sessionId) : undefined) ||
      "direct-or-untagged";

    const isDccRiverboatsSource = resolvedEntrySource === DCC_AUTHORITY_NOLA_RIVERBOATS_SRC;

    const isFromComparisonSession =
      (sessionId !== null && comparisonSessions.has(sessionId)) ||
      compSlug === RIVERBOAT_COMPARISON_SLUG ||
      isRiverboatComparisonPath(landingPath) ||
      isRiverboatComparisonPath(sourcePage);

    const vessel = inferRiverboatVesselFromData({
      productSlug: clickedProductSlug || meta.product_slug,
      targetPath,
      itemId: meta.item_id,
      selectedBoat: meta.selected_boat,
    });

    const itemId = extractFareHarborItemId({
      itemId: meta.item_id,
      targetPath,
      productSlug: clickedProductSlug || meta.product_slug,
    });

    const entryKey =
      landingPath ||
      (isRiverboatComparisonPath(sourcePage)
        ? sourcePage!
        : "/compare/natchez-vs-city-of-new-orleans-riverboat");

    // Stage 1: Comparison visit
    if (
      funnelStageMeta === "comparison_visit" ||
      originalEventName === "comparison_viewed" ||
      ((eventName === "landing_viewed" || eventName === "page_viewed") &&
        (isRiverboatComparisonPath(targetPath) ||
          isRiverboatComparisonPath(landingPath) ||
          compSlug === RIVERBOAT_COMPARISON_SLUG))
    ) {
      comparisonVisitEvents++;
      if (sessionId) comparisonSessions.add(sessionId);
      getEntryRow(entryKey).comparisonVisits++;
      const sRow = getSourceRow(resolvedEntrySource);
      sRow.comparisonVisits++;
      if (sessionId) sRow.sessions.add(sessionId);

      if (isDccRiverboatsSource) {
        dccCohortAcc.arrivedEvents++;
        if (sessionId) dccCohortAcc.arrivedSessions.add(sessionId);
      }

      recentFunnelEvents.push({
        occurredAt,
        sessionId,
        stage: "comparison_visit",
        vesselKey: null,
        productSlug: null,
        itemId: null,
        entrySource: resolvedEntrySource,
        landingPath,
        sourcePage,
        targetPath,
      });
      continue;
    }

    // Stage 2: Boat selected (click on comparison page OR opening the distinct tour detail page from comparison)
    const isBoatSelectedClick =
      funnelStageMeta === "boat_selected" ||
      originalEventName === "comparison_boat_selected" ||
      originalEventName === "boat_selected" ||
      (isRiverboatComparisonPath(sourcePage) &&
        vessel !== null &&
        (eventName === "cta_clicked_primary" ||
          originalEventName === "booking_button_clicked" ||
          eventName === "recommendation_clicked"));

    if (isBoatSelectedClick && vessel) {
      boatSelectedEvents++;
      if (sessionId) {
        boatSelectedSessions.add(sessionId);
        vesselAcc[vessel].boatSelectedSessions.add(sessionId);
      }
      vesselAcc[vessel].boatSelectedEvents++;
      const row = getEntryRow(entryKey);
      const sRow = getSourceRow(resolvedEntrySource);
      if (sessionId) sRow.sessions.add(sessionId);
      if (vessel === "natchez") {
        row.natchezSelected++;
        sRow.natchezSelected++;
      } else {
        row.citySelected++;
        sRow.citySelected++;
      }

      if (isDccRiverboatsSource) {
        dccCohortAcc.boatChosenEvents++;
        if (sessionId) dccCohortAcc.boatChosenSessions.add(sessionId);
        if (vessel === "natchez") {
          dccCohortAcc.natchezChosenEvents++;
          if (sessionId) dccCohortAcc.natchezChosenSessions.add(sessionId);
        } else {
          dccCohortAcc.cityChosenEvents++;
          if (sessionId) dccCohortAcc.cityChosenSessions.add(sessionId);
        }
      }

      recentFunnelEvents.push({
        occurredAt,
        sessionId,
        stage: "boat_selected",
        vesselKey: vessel,
        productSlug:
          vessel === "natchez" ? NATCHEZ_DAYTIME_PRODUCT_SLUG : CITY_RIVERBOAT_PRODUCT_SLUG,
        itemId:
          vessel === "natchez" ? NATCHEZ_DAYTIME_PRIMARY_ITEM_ID : CITY_RIVERBOAT_PRIMARY_ITEM_ID,
        entrySource: resolvedEntrySource,
        landingPath,
        sourcePage,
        targetPath,
      });
      continue;
    }

    // Tour detail opened (tracks arrival on /tours/daytime-jazz-cruise or /tours/city-of-new-orleans-riverboat-cruise)
    if (eventName === "product_opened" && vessel) {
      vesselAcc[vessel].tourDetailOpenedEvents++;
      if (isFromComparisonSession && sessionId) {
        vesselAcc[vessel].tourDetailFromCompSessions.add(sessionId);
        if (!boatSelectedSessions.has(sessionId)) {
          boatSelectedSessions.add(sessionId);
          vesselAcc[vessel].boatSelectedSessions.add(sessionId);
          boatSelectedEvents++;
          const row = getEntryRow(entryKey);
          const sRow = getSourceRow(resolvedEntrySource);
          sRow.sessions.add(sessionId);
          if (vessel === "natchez") {
            row.natchezSelected++;
            sRow.natchezSelected++;
          } else {
            row.citySelected++;
            sRow.citySelected++;
          }
          if (isDccRiverboatsSource) {
            dccCohortAcc.boatChosenEvents++;
            dccCohortAcc.boatChosenSessions.add(sessionId);
            if (vessel === "natchez") {
              dccCohortAcc.natchezChosenEvents++;
              dccCohortAcc.natchezChosenSessions.add(sessionId);
            } else {
              dccCohortAcc.cityChosenEvents++;
              dccCohortAcc.cityChosenSessions.add(sessionId);
            }
          }
        }
      }
      continue;
    }

    // Stage 3: Checkout opened (FareHarbor items 561220 for Natchez daytime cruise and 694782 for City riverboat)
    const isCheckoutOpened =
      (eventName === "booking_opened" ||
        funnelStageMeta === "checkout_opened" ||
        originalEventName === "fareharbor_checkout_opened") &&
      !isRiverboatComparisonPath(sourcePage); // Never count comparison-page clicks as checkout opens

    if (isCheckoutOpened && vessel) {
      vesselAcc[vessel].checkoutAllVariantsEvents++;
      checkoutOpenedTotalEvents++;
      const isPrimaryItem =
        (vessel === "natchez" && itemId === NATCHEZ_DAYTIME_PRIMARY_ITEM_ID) ||
        (vessel === "city_of_new_orleans" && itemId === CITY_RIVERBOAT_PRIMARY_ITEM_ID);
      if (isPrimaryItem) {
        vesselAcc[vessel].checkoutPrimaryItemEvents++;
        checkoutOpenedPrimaryEvents++;
      }
      if (isFromComparisonSession && sessionId) {
        checkoutOpenedFromCompSessions.add(sessionId);
        vesselAcc[vessel].checkoutFromCompSessions.add(sessionId);
      }
      const row = getEntryRow(entryKey);
      const sRow = getSourceRow(resolvedEntrySource);
      if (sessionId) sRow.sessions.add(sessionId);
      if (vessel === "natchez" && itemId === NATCHEZ_DAYTIME_PRIMARY_ITEM_ID) {
        row.natchezCheckoutOpened561220++;
        sRow.natchezCheckoutOpened561220++;
      } else if (vessel === "city_of_new_orleans" && itemId === CITY_RIVERBOAT_PRIMARY_ITEM_ID) {
        row.cityCheckoutOpened694782++;
        sRow.cityCheckoutOpened694782++;
      }

      if (isDccRiverboatsSource && isPrimaryItem) {
        dccCohortAcc.checkoutOpenedEvents++;
        if (sessionId) dccCohortAcc.checkoutOpenedSessions.add(sessionId);
        if (vessel === "natchez" && itemId === NATCHEZ_DAYTIME_PRIMARY_ITEM_ID) {
          dccCohortAcc.natchez561220Events++;
          if (sessionId) dccCohortAcc.natchez561220Sessions.add(sessionId);
        } else if (
          vessel === "city_of_new_orleans" &&
          itemId === CITY_RIVERBOAT_PRIMARY_ITEM_ID
        ) {
          dccCohortAcc.city694782Events++;
          if (sessionId) dccCohortAcc.city694782Sessions.add(sessionId);
        }
      }

      recentFunnelEvents.push({
        occurredAt,
        sessionId,
        stage: "checkout_opened",
        vesselKey: vessel,
        productSlug:
          vessel === "natchez" ? NATCHEZ_DAYTIME_PRODUCT_SLUG : CITY_RIVERBOAT_PRODUCT_SLUG,
        itemId,
        entrySource: resolvedEntrySource,
        landingPath,
        sourcePage,
        targetPath,
      });
      continue;
    }

    // Stage 4: Provider-confirmed booking (recorded in corridor events via authenticated FareHarbor webhook/lookup)
    if (
      (eventName === "booking_completed" ||
        eventName === "purchase_completed" ||
        funnelStageMeta === "provider_confirmed_booking") &&
      vessel
    ) {
      const bookingRef =
        typeof meta.provider_booking_ref === "string" && meta.provider_booking_ref.trim()
          ? meta.provider_booking_ref.trim()
          : null;
      const outcomeEventType =
        typeof meta.outcome_event_type === "string"
          ? meta.outcome_event_type.trim().toUpperCase()
          : "BOOKING_CONFIRMED";
      const grossUsd =
        typeof meta.booking_value_usd === "number"
          ? meta.booking_value_usd
          : typeof meta.booking_value_cents === "number"
            ? meta.booking_value_cents / 100
            : 0;

      // Strictly separate estimated commission, confirmed earnings, and settled payouts.
      // Legacy commission_amount_usd without explicit confirmed_earnings_usd is treated as an estimate, NEVER confirmed earnings.
      const legacyCommissionUsd =
        typeof meta.commission_amount_usd === "number"
          ? meta.commission_amount_usd
          : typeof meta.commission_amount_cents === "number"
            ? meta.commission_amount_cents / 100
            : 0;

      const estimatedUsd =
        typeof meta.estimated_commission_usd === "number"
          ? meta.estimated_commission_usd
          : typeof meta.estimated_commission_cents === "number"
            ? meta.estimated_commission_cents / 100
            : typeof meta.confirmed_earnings_usd !== "number" &&
                typeof meta.payouts_usd !== "number" &&
                legacyCommissionUsd > 0
              ? legacyCommissionUsd
              : 0;

      const confirmedEarningsUsd =
        typeof meta.confirmed_earnings_usd === "number"
          ? meta.confirmed_earnings_usd
          : typeof meta.confirmed_earnings_cents === "number"
            ? meta.confirmed_earnings_cents / 100
            : typeof meta.paid_commission_usd === "number" &&
                (outcomeEventType === "BOOKING_FULFILLED" ||
                  outcomeEventType === "COMMISSION_RECONCILED")
              ? meta.paid_commission_usd
              : 0;

      const payoutsUsd =
        typeof meta.payouts_usd === "number"
          ? meta.payouts_usd
          : typeof meta.payouts_cents === "number"
            ? meta.payouts_cents / 100
            : typeof meta.paid_commission_usd === "number" &&
                outcomeEventType === "COMMISSION_RECONCILED"
              ? meta.paid_commission_usd
              : 0;

      const isDuplicateBookingCount =
        bookingRef !== null && seenCorridorBookingRefs.has(bookingRef);
      if (bookingRef) {
        seenCorridorBookingRefs.add(bookingRef);
        if (estimatedUsd > 0) seenCorridorEstimatedRefs.add(bookingRef);
        if (confirmedEarningsUsd > 0) seenCorridorEarnedRefs.add(bookingRef);
        if (payoutsUsd > 0) seenCorridorPayoutRefs.add(bookingRef);
      }

      if (!isDuplicateBookingCount) {
        vesselAcc[vessel].confirmedCount++;
        vesselAcc[vessel].confirmedGrossSalesUsd += grossUsd;
        if (isFromComparisonSession) {
          vesselAcc[vessel].confirmedFromCompCount++;
          if (sessionId) confirmedFromCompSessions.add(sessionId);
        }
      }
      vesselAcc[vessel].estimatedCommissionUsd += estimatedUsd;
      vesselAcc[vessel].confirmedEarningsUsd += confirmedEarningsUsd;
      vesselAcc[vessel].payoutsUsd += payoutsUsd;
      vesselAcc[vessel].confirmedCommissionsUsd += confirmedEarningsUsd;

      const row = getEntryRow(entryKey);
      if (!isDuplicateBookingCount) {
        row.providerConfirmedBookings++;
        row.confirmedGrossSalesUsd = roundUsd(row.confirmedGrossSalesUsd + grossUsd);
      }
      row.estimatedCommissionUsd = roundUsd(row.estimatedCommissionUsd + estimatedUsd);
      row.confirmedEarningsUsd = roundUsd(row.confirmedEarningsUsd + confirmedEarningsUsd);
      row.payoutsUsd = roundUsd(row.payoutsUsd + payoutsUsd);
      row.confirmedCommissionsUsd = row.confirmedEarningsUsd;

      const sRow = getSourceRow(resolvedEntrySource);
      if (sessionId) sRow.sessions.add(sessionId);
      if (!isDuplicateBookingCount) {
        sRow.providerConfirmedBookings++;
        sRow.confirmedGrossSalesUsd = roundUsd(sRow.confirmedGrossSalesUsd + grossUsd);
      }
      sRow.estimatedCommissionUsd = roundUsd(sRow.estimatedCommissionUsd + estimatedUsd);
      sRow.confirmedEarningsUsd = roundUsd(sRow.confirmedEarningsUsd + confirmedEarningsUsd);
      sRow.payoutsUsd = roundUsd(sRow.payoutsUsd + payoutsUsd);
      sRow.confirmedCommissionsUsd = sRow.confirmedEarningsUsd;

      if (isDccRiverboatsSource) {
        if (!isDuplicateBookingCount) {
          dccCohortAcc.confirmedBookingsCount++;
          dccCohortAcc.confirmedGrossSalesUsd = roundUsd(
            dccCohortAcc.confirmedGrossSalesUsd + grossUsd,
          );
        }
        dccCohortAcc.estimatedCommissionUsd = roundUsd(
          dccCohortAcc.estimatedCommissionUsd + estimatedUsd,
        );
        dccCohortAcc.confirmedEarningsUsd = roundUsd(
          dccCohortAcc.confirmedEarningsUsd + confirmedEarningsUsd,
        );
        dccCohortAcc.payoutsUsd = roundUsd(dccCohortAcc.payoutsUsd + payoutsUsd);
        dccCohortAcc.confirmedCommissionsUsd = dccCohortAcc.confirmedEarningsUsd;
      }

      recentFunnelEvents.push({
        occurredAt,
        sessionId,
        stage: "provider_confirmed_booking",
        vesselKey: vessel,
        productSlug:
          vessel === "natchez" ? NATCHEZ_DAYTIME_PRODUCT_SLUG : CITY_RIVERBOAT_PRODUCT_SLUG,
        itemId,
        entrySource: resolvedEntrySource,
        landingPath,
        sourcePage,
        targetPath,
      });
    }
  }

  // Also check commercial outcomes ledger for any authenticated FareHarbor outcomes on 561220 / 694782 not yet in corridor events
  const seenOutcomeBookingRefs = new Set<string>(seenCorridorBookingRefs);
  const seenOutcomeEstimatedRefs = new Set<string>(seenCorridorEstimatedRefs);
  const seenOutcomeEarnedRefs = new Set<string>(seenCorridorEarnedRefs);
  const seenOutcomePayoutRefs = new Set<string>(seenCorridorPayoutRefs);

  for (const outcome of outcomes) {
    if (outcome.provider !== "fareharbor") continue;
    if (
      outcome.eventType !== "BOOKING_CONFIRMED" &&
      outcome.eventType !== "BOOKING_FULFILLED" &&
      outcome.eventType !== "COMMISSION_RECONCILED"
    ) {
      continue;
    }
    const ref = String(outcome.providerBookingRef || "").trim();
    const refLower = ref.toLowerCase();
    if (
      !ref ||
      refLower.startsWith("test_") ||
      refLower.startsWith("wno_test_") ||
      refLower.includes("synthetic")
    ) {
      continue;
    }
    const outcomeAny = outcome as unknown as Record<string, unknown>;
    const rawPayload = (outcomeAny.rawPayload || outcomeAny.rawProviderPayload || {}) as Record<
      string,
      unknown
    >;
    const vessel = inferRiverboatVesselFromData({
      productSlug: outcome.bookedProductCode,
      itemId: rawPayload.itemPk || outcome.bookedOption || outcome.bookedProductCode,
    });
    if (!vessel) continue;

    if (!seenOutcomeBookingRefs.has(ref)) {
      seenOutcomeBookingRefs.add(ref);
      vesselAcc[vessel].confirmedCount++;
      if (outcome.bookingValue?.amount) {
        vesselAcc[vessel].confirmedGrossSalesUsd += outcome.bookingValue.amount;
      }
    }

    // Strictly separate estimated commission, confirmed earnings, and settled payouts:
    // - BOOKING_CONFIRMED: estimatedCommission is an estimate only; NEVER added to confirmedEarningsUsd or payoutsUsd.
    // - BOOKING_FULFILLED: verified paidCommission is added to confirmedEarningsUsd (never fallback to estimatedCommission).
    // - COMMISSION_RECONCILED: settled paidCommission is added to payoutsUsd (and confirmedEarningsUsd if not already recorded).
    const estAmount =
      typeof outcome.estimatedCommission?.amount === "number" &&
      outcome.estimatedCommission.amount > 0
        ? outcome.estimatedCommission.amount
        : 0;
    const paidAmount =
      typeof outcome.paidCommission?.amount === "number" && outcome.paidCommission.amount > 0
        ? outcome.paidCommission.amount
        : 0;

    if (estAmount > 0 && !seenOutcomeEstimatedRefs.has(ref)) {
      seenOutcomeEstimatedRefs.add(ref);
      vesselAcc[vessel].estimatedCommissionUsd += estAmount;
    }

    if (
      (outcome.eventType === "BOOKING_FULFILLED" ||
        outcome.eventType === "COMMISSION_RECONCILED") &&
      paidAmount > 0 &&
      !seenOutcomeEarnedRefs.has(ref)
    ) {
      seenOutcomeEarnedRefs.add(ref);
      vesselAcc[vessel].confirmedEarningsUsd += paidAmount;
      vesselAcc[vessel].confirmedCommissionsUsd += paidAmount;
    }

    if (
      outcome.eventType === "COMMISSION_RECONCILED" &&
      paidAmount > 0 &&
      !seenOutcomePayoutRefs.has(ref)
    ) {
      seenOutcomePayoutRefs.add(ref);
      vesselAcc[vessel].payoutsUsd += paidAmount;
    }
  }

  // Summarize verified test sessions separately so they can be verified without polluting customer totals
  const testSessionsMap = new Map<string, VerifiedRiverboatTestSessionRecord>();
  for (const ev of wnoTestEvents) {
    const sessionId = String(ev.sessionId || ev.session_id || "").trim();
    if (!sessionId) continue;
    const eventName = String(ev.eventName || ev.event_name || "").trim();
    const landingPath = normalizePath(ev.landingPath || ev.landing_path || "") || null;
    const sourcePage = normalizePath(ev.sourcePage || ev.source_page || "") || null;
    const targetPath = String(ev.targetPath || ev.target_path || "").trim() || null;
    const clickedProductSlug =
      String(ev.clickedProductSlug || ev.clicked_product_slug || "").trim() || null;
    const meta = (ev.metadata && typeof ev.metadata === "object" ? ev.metadata : {}) as Record<
      string,
      unknown
    >;
    const originalEventName = String(meta.original_event_name || eventName).trim();
    const funnelStageMeta = String(meta.funnel_stage || "").trim();
    const compSlug = String(meta.comparison_slug || meta.comparisonSlug || "").trim();
    const occurredAt = String(
      ev.occurredAt || ev.occurred_at || ev.createdAt || ev.created_at || new Date().toISOString(),
    );
    const rawSource = extractRawSourceTag(ev);

    let rec = testSessionsMap.get(sessionId);
    if (!rec) {
      rec = {
        sessionId,
        entrySource: rawSource || "direct-or-untagged",
        landingPath,
        comparisonVisited: false,
        boatSelected: null,
        tourDetailOpened: null,
        checkoutOpenedItemId: null,
        completedAllStagesThroughCheckout: false,
        excludedFromCustomerTotals: true,
        lastEventAt: occurredAt,
      };
      testSessionsMap.set(sessionId, rec);
    }
    if (
      rawSource &&
      (rec.entrySource === "direct-or-untagged" || rawSource === DCC_AUTHORITY_NOLA_RIVERBOATS_SRC)
    ) {
      rec.entrySource = rawSource;
    }
    if (!rec.landingPath && landingPath) {
      rec.landingPath = landingPath;
    }
    if (occurredAt > rec.lastEventAt) {
      rec.lastEventAt = occurredAt;
    }

    const vessel = inferRiverboatVesselFromData({
      productSlug: clickedProductSlug || meta.product_slug,
      targetPath,
      itemId: meta.item_id,
      selectedBoat: meta.selected_boat,
    });
    const itemId = extractFareHarborItemId({
      itemId: meta.item_id,
      targetPath,
      productSlug: clickedProductSlug || meta.product_slug,
    });

    if (
      funnelStageMeta === "comparison_visit" ||
      originalEventName === "comparison_viewed" ||
      isRiverboatComparisonPath(targetPath) ||
      isRiverboatComparisonPath(landingPath) ||
      compSlug === RIVERBOAT_COMPARISON_SLUG
    ) {
      rec.comparisonVisited = true;
    }

    if (
      (funnelStageMeta === "boat_selected" ||
        originalEventName === "comparison_boat_selected" ||
        originalEventName === "boat_selected" ||
        eventName === "product_opened") &&
      vessel
    ) {
      rec.boatSelected = vessel;
      if (eventName === "product_opened") {
        rec.tourDetailOpened =
          vessel === "natchez"
            ? "/tours/daytime-jazz-cruise"
            : "/tours/city-of-new-orleans-riverboat-cruise";
      }
    }

    if (
      (eventName === "booking_opened" ||
        funnelStageMeta === "checkout_opened" ||
        originalEventName === "fareharbor_checkout_opened") &&
      !isRiverboatComparisonPath(sourcePage) &&
      vessel
    ) {
      rec.checkoutOpenedItemId = itemId;
    }

    rec.completedAllStagesThroughCheckout = Boolean(
      rec.comparisonVisited && rec.boatSelected && rec.checkoutOpenedItemId,
    );
  }

  const verifiedTestSessionList = Array.from(testSessionsMap.values()).sort((a, b) =>
    b.lastEventAt.localeCompare(a.lastEventAt),
  );

  const totalConfirmedBookings =
    vesselAcc.natchez.confirmedCount + vesselAcc.city_of_new_orleans.confirmedCount;
  const totalConfirmedGrossUsd = roundUsd(
    vesselAcc.natchez.confirmedGrossSalesUsd +
      vesselAcc.city_of_new_orleans.confirmedGrossSalesUsd,
  );
  const totalEstimatedCommissionUsd = roundUsd(
    vesselAcc.natchez.estimatedCommissionUsd +
      vesselAcc.city_of_new_orleans.estimatedCommissionUsd,
  );
  const totalConfirmedEarningsUsd = roundUsd(
    vesselAcc.natchez.confirmedEarningsUsd +
      vesselAcc.city_of_new_orleans.confirmedEarningsUsd,
  );
  const totalPayoutsUsd = roundUsd(
    vesselAcc.natchez.payoutsUsd + vesselAcc.city_of_new_orleans.payoutsUsd,
  );

  return {
    generatedAt: new Date().toISOString(),
    funnelId: "wno_riverboat_comparison",
    comparisonSlug: RIVERBOAT_COMPARISON_SLUG,
    comparisonUrl:
      "https://www.welcometoneworleanstours.com/compare/natchez-vs-city-of-new-orleans-riverboat",
    windowDays,
    includeSyntheticTests: Boolean(options?.customEvents),
    customerTotalsExcludeTestSessions: true,
    commissionBreakdown: {
      estimatedCommissionUsd: totalEstimatedCommissionUsd,
      confirmedEarningsUsd: totalConfirmedEarningsUsd,
      payoutsUsd: totalPayoutsUsd,
      confirmedFieldIncludesEstimate: false,
      policyNote:
        "Estimated commissions on confirmed bookings are tracked separately from confirmed earnings (fulfilled bookings with verified provider commission) and settled payouts (reconciled commission disbursements). Unconfirmed estimates are never included in confirmedEarningsUsd or confirmedCommissionsUsd.",
    },
    stages: {
      comparisonVisits: {
        totalEvents: comparisonVisitEvents,
        uniqueSessions: comparisonSessions.size,
      },
      boatSelected: {
        totalEvents: boatSelectedEvents,
        uniqueSessions: boatSelectedSessions.size,
        conversionFromVisitPct: pct(boatSelectedSessions.size, comparisonSessions.size),
      },
      checkoutOpened: {
        totalEvents: checkoutOpenedTotalEvents,
        primaryItems561220And694782Events: checkoutOpenedPrimaryEvents,
        uniqueSessionsFromComparison: checkoutOpenedFromCompSessions.size,
        conversionFromBoatSelectedPct: pct(
          checkoutOpenedFromCompSessions.size,
          boatSelectedSessions.size,
        ),
        conversionFromVisitPct: pct(checkoutOpenedFromCompSessions.size, comparisonSessions.size),
      },
      providerConfirmedBookings: {
        totalConfirmedBookings,
        confirmedFromComparisonSessions: confirmedFromCompSessions.size,
        confirmedGrossSalesUsd: totalConfirmedGrossUsd,
        estimatedCommissionUsd: totalEstimatedCommissionUsd,
        confirmedEarningsUsd: totalConfirmedEarningsUsd,
        payoutsUsd: totalPayoutsUsd,
        confirmedCommissionsUsd: totalConfirmedEarningsUsd,
        conversionFromCheckoutOpenedPct: pct(totalConfirmedBookings, checkoutOpenedTotalEvents),
        status:
          totalConfirmedBookings > 0
            ? "confirmed_bookings_present"
            : "awaiting_provider_confirmation",
      },
    },
    dccAuthorityRiverboatsCorridor: {
      sourceTag: DCC_AUTHORITY_NOLA_RIVERBOATS_SRC,
      dccGuideUrl: "https://www.destinationcommandcenter.com/new-orleans/tours#river-cruises",
      targetComparisonUrl:
        "https://www.welcometoneworleanstours.com/compare/natchez-vs-city-of-new-orleans-riverboat?src=dcc-authority-nola-riverboats",
      excludedTestSessionsFromCustomerTotals: true,
      visitorsArrived: {
        totalEvents: dccCohortAcc.arrivedEvents,
        uniqueSessions: dccCohortAcc.arrivedSessions.size,
      },
      boatChosen: {
        totalEvents: dccCohortAcc.boatChosenEvents,
        uniqueSessions: dccCohortAcc.boatChosenSessions.size,
        natchezEvents: dccCohortAcc.natchezChosenEvents,
        natchezUniqueSessions: dccCohortAcc.natchezChosenSessions.size,
        cityOfNewOrleansEvents: dccCohortAcc.cityChosenEvents,
        cityOfNewOrleansUniqueSessions: dccCohortAcc.cityChosenSessions.size,
      },
      exactFareHarborItemOpened: {
        totalEvents: dccCohortAcc.checkoutOpenedEvents,
        uniqueSessions: dccCohortAcc.checkoutOpenedSessions.size,
        natchez561220Events: dccCohortAcc.natchez561220Events,
        natchez561220UniqueSessions: dccCohortAcc.natchez561220Sessions.size,
        city694782Events: dccCohortAcc.city694782Events,
        city694782UniqueSessions: dccCohortAcc.city694782Sessions.size,
      },
      providerConfirmedOutcomes: {
        confirmedBookingsCount: dccCohortAcc.confirmedBookingsCount,
        confirmedGrossSalesUsd: dccCohortAcc.confirmedGrossSalesUsd,
        estimatedCommissionUsd: dccCohortAcc.estimatedCommissionUsd,
        confirmedEarningsUsd: dccCohortAcc.confirmedEarningsUsd,
        payoutsUsd: dccCohortAcc.payoutsUsd,
        confirmedCommissionsUsd: dccCohortAcc.confirmedEarningsUsd,
        status:
          dccCohortAcc.confirmedBookingsCount > 0
            ? "confirmed_bookings_present"
            : "awaiting_provider_confirmation",
      },
    },
    vessels: {
      natchez: {
        vesselKey: "natchez",
        vesselLabel: "Steamboat NATCHEZ Daytime Jazz Cruise",
        productSlug: NATCHEZ_DAYTIME_PRODUCT_SLUG,
        tourDetailPath: "/tours/daytime-jazz-cruise",
        operatorShortname: "neworleanssteamboatcompany",
        primaryFareHarborItemId: NATCHEZ_DAYTIME_PRIMARY_ITEM_ID,
        primaryFareHarborFlowId: NATCHEZ_DAYTIME_FLOW_ID,
        publishedAdultPriceUsd: 44,
        boatSelectedEvents: vesselAcc.natchez.boatSelectedEvents,
        boatSelectedUniqueSessions: vesselAcc.natchez.boatSelectedSessions.size,
        tourDetailOpenedEvents: vesselAcc.natchez.tourDetailOpenedEvents,
        tourDetailOpenedFromComparisonSessions: vesselAcc.natchez.tourDetailFromCompSessions.size,
        checkoutOpenedPrimaryItemEvents: vesselAcc.natchez.checkoutPrimaryItemEvents,
        checkoutOpenedAllVariantsEvents: vesselAcc.natchez.checkoutAllVariantsEvents,
        checkoutOpenedFromComparisonSessions: vesselAcc.natchez.checkoutFromCompSessions.size,
        providerConfirmedBookingsCount: vesselAcc.natchez.confirmedCount,
        providerConfirmedFromComparisonCount: vesselAcc.natchez.confirmedFromCompCount,
        confirmedGrossSalesUsd: roundUsd(vesselAcc.natchez.confirmedGrossSalesUsd),
        estimatedCommissionUsd: roundUsd(vesselAcc.natchez.estimatedCommissionUsd),
        confirmedEarningsUsd: roundUsd(vesselAcc.natchez.confirmedEarningsUsd),
        payoutsUsd: roundUsd(vesselAcc.natchez.payoutsUsd),
        confirmedCommissionsUsd: roundUsd(vesselAcc.natchez.confirmedEarningsUsd),
        unconfirmedCheckoutOpensCount: Math.max(
          0,
          vesselAcc.natchez.checkoutAllVariantsEvents - vesselAcc.natchez.confirmedCount,
        ),
        providerConfirmationStatus:
          vesselAcc.natchez.confirmedCount > 0
            ? "confirmed_bookings_present"
            : "awaiting_provider_confirmation",
      },
      cityOfNewOrleans: {
        vesselKey: "city_of_new_orleans",
        vesselLabel: "Riverboat CITY of NEW ORLEANS (75-Min Sightseeing Cruise)",
        productSlug: CITY_RIVERBOAT_PRODUCT_SLUG,
        tourDetailPath: "/tours/city-of-new-orleans-riverboat-cruise",
        operatorShortname: "neworleanssteamboatcompany",
        primaryFareHarborItemId: CITY_RIVERBOAT_PRIMARY_ITEM_ID,
        primaryFareHarborFlowId: CITY_RIVERBOAT_FLOW_ID,
        publishedAdultPriceUsd: 25.75,
        boatSelectedEvents: vesselAcc.city_of_new_orleans.boatSelectedEvents,
        boatSelectedUniqueSessions: vesselAcc.city_of_new_orleans.boatSelectedSessions.size,
        tourDetailOpenedEvents: vesselAcc.city_of_new_orleans.tourDetailOpenedEvents,
        tourDetailOpenedFromComparisonSessions:
          vesselAcc.city_of_new_orleans.tourDetailFromCompSessions.size,
        checkoutOpenedPrimaryItemEvents: vesselAcc.city_of_new_orleans.checkoutPrimaryItemEvents,
        checkoutOpenedAllVariantsEvents: vesselAcc.city_of_new_orleans.checkoutAllVariantsEvents,
        checkoutOpenedFromComparisonSessions:
          vesselAcc.city_of_new_orleans.checkoutFromCompSessions.size,
        providerConfirmedBookingsCount: vesselAcc.city_of_new_orleans.confirmedCount,
        providerConfirmedFromComparisonCount: vesselAcc.city_of_new_orleans.confirmedFromCompCount,
        confirmedGrossSalesUsd: roundUsd(vesselAcc.city_of_new_orleans.confirmedGrossSalesUsd),
        estimatedCommissionUsd: roundUsd(vesselAcc.city_of_new_orleans.estimatedCommissionUsd),
        confirmedEarningsUsd: roundUsd(vesselAcc.city_of_new_orleans.confirmedEarningsUsd),
        payoutsUsd: roundUsd(vesselAcc.city_of_new_orleans.payoutsUsd),
        confirmedCommissionsUsd: roundUsd(vesselAcc.city_of_new_orleans.confirmedEarningsUsd),
        unconfirmedCheckoutOpensCount: Math.max(
          0,
          vesselAcc.city_of_new_orleans.checkoutAllVariantsEvents -
            vesselAcc.city_of_new_orleans.confirmedCount,
        ),
        providerConfirmationStatus:
          vesselAcc.city_of_new_orleans.confirmedCount > 0
            ? "confirmed_bookings_present"
            : "awaiting_provider_confirmation",
      },
    },
    entryPageBreakdown: Array.from(entryPageMap.values()).sort(
      (a, b) =>
        b.comparisonVisits +
        b.natchezSelected +
        b.citySelected -
        (a.comparisonVisits + a.natchezSelected + a.citySelected),
    ),
    entrySourceBreakdown: Array.from(entrySourceMap.values())
      .map(({ sessions, ...rest }) => ({
        ...rest,
        uniqueVisitorSessions: sessions.size,
      }))
      .sort(
        (a, b) =>
          b.comparisonVisits +
          b.natchezSelected +
          b.citySelected -
          (a.comparisonVisits + a.natchezSelected + a.citySelected),
      ),
    verifiedTestSessions: {
      excludedFromCustomerTotals: true,
      totalTestSessionsCount: verifiedTestSessionList.length,
      dccAuthorityRiverboatsTestSessionsCount: verifiedTestSessionList.filter(
        (s) => s.entrySource === DCC_AUTHORITY_NOLA_RIVERBOATS_SRC,
      ).length,
      verifiedCheckoutTestSessionsCount: verifiedTestSessionList.filter(
        (s) => s.completedAllStagesThroughCheckout,
      ).length,
      sessions: verifiedTestSessionList.slice(0, 20),
    },
    recentFunnelEvents: recentFunnelEvents.slice(0, 25),
  };
}
