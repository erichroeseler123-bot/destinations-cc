import { listRecentProductionCorridorEvents } from "@/lib/dcc/telemetry/corridorEvents";
import { listCommercialOutcomes } from "@/lib/dcc/commerce";

export const RIVERBOAT_COMPARISON_SLUG = "natchez-vs-city-of-new-orleans-riverboat" as const;
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
}

export interface RiverboatComparisonFunnelReport {
  generatedAt: string;
  funnelId: "wno_riverboat_comparison";
  comparisonSlug: typeof RIVERBOAT_COMPARISON_SLUG;
  comparisonUrl: string;
  windowDays: number;
  includeSyntheticTests: boolean;
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
      conversionFromCheckoutOpenedPct: number | null;
      status: "confirmed_bookings_present" | "awaiting_provider_confirmation";
    };
  };
  vessels: {
    natchez: RiverboatVesselFunnelMetrics;
    cityOfNewOrleans: RiverboatVesselFunnelMetrics;
  };
  entryPageBreakdown: RiverboatEntryPageBreakdownRow[];
  recentFunnelEvents: Array<{
    occurredAt: string;
    sessionId: string | null;
    stage: RiverboatFunnelStage;
    vesselKey: RiverboatVesselKey | null;
    productSlug: string | null;
    itemId: string | null;
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

export function inferRiverboatVesselFromData(input: {
  productSlug?: unknown;
  targetPath?: unknown;
  itemId?: unknown;
  selectedBoat?: unknown;
}): RiverboatVesselKey | null {
  const boat = typeof input.selectedBoat === "string" ? input.selectedBoat.trim().toLowerCase() : "";
  if (boat === "natchez" || boat === "steamboat_natchez") return "natchez";
  if (boat === "city_of_new_orleans" || boat === "city") return "city_of_new_orleans";

  const itemId = typeof input.itemId === "string" || typeof input.itemId === "number"
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

export async function buildRiverboatComparisonFunnelReport(options?: {
  windowDays?: number;
  customEvents?: any[];
}): Promise<RiverboatComparisonFunnelReport> {
  const windowDays = options?.windowDays ?? 28;
  const cutoffMs = Date.now() - windowDays * 24 * 60 * 60 * 1000;

  const rawEvents = options?.customEvents ?? (await listRecentProductionCorridorEvents(10000));
  const outcomes = await listCommercialOutcomes().catch(() => []);

  const wnoEvents = rawEvents.filter((ev: any) => {
    const cid = ev.corridorId || ev.corridor_id;
    if (cid !== "wno-commerce") return false;
    const ts = Date.parse(ev.occurredAt || ev.occurred_at || ev.createdAt || ev.created_at || "");
    return !Number.isFinite(ts) || ts >= cutoffMs;
  });

  // Track sessions that visited the riverboat comparison page
  const comparisonSessions = new Set<string>();
  let comparisonVisitEvents = 0;

  // First pass: identify all sessions that touched /compare/natchez-vs-city-of-new-orleans-riverboat
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
      };
      entryPageMap.set(key, row);
    }
    return row;
  }

  const recentFunnelEvents: RiverboatComparisonFunnelReport["recentFunnelEvents"] = [];

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
      recentFunnelEvents.push({
        occurredAt,
        sessionId,
        stage: "comparison_visit",
        vesselKey: null,
        productSlug: null,
        itemId: null,
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
      if (vessel === "natchez") row.natchezSelected++;
      else row.citySelected++;

      recentFunnelEvents.push({
        occurredAt,
        sessionId,
        stage: "boat_selected",
        vesselKey: vessel,
        productSlug:
          vessel === "natchez" ? NATCHEZ_DAYTIME_PRODUCT_SLUG : CITY_RIVERBOAT_PRODUCT_SLUG,
        itemId:
          vessel === "natchez" ? NATCHEZ_DAYTIME_PRIMARY_ITEM_ID : CITY_RIVERBOAT_PRIMARY_ITEM_ID,
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
          if (vessel === "natchez") row.natchezSelected++;
          else row.citySelected++;
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
      if (vessel === "natchez" && itemId === NATCHEZ_DAYTIME_PRIMARY_ITEM_ID) {
        row.natchezCheckoutOpened561220++;
      } else if (vessel === "city_of_new_orleans" && itemId === CITY_RIVERBOAT_PRIMARY_ITEM_ID) {
        row.cityCheckoutOpened694782++;
      }

      recentFunnelEvents.push({
        occurredAt,
        sessionId,
        stage: "checkout_opened",
        vesselKey: vessel,
        productSlug:
          vessel === "natchez" ? NATCHEZ_DAYTIME_PRODUCT_SLUG : CITY_RIVERBOAT_PRODUCT_SLUG,
        itemId,
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
      const grossUsd =
        typeof meta.booking_value_usd === "number"
          ? meta.booking_value_usd
          : typeof meta.booking_value_cents === "number"
            ? meta.booking_value_cents / 100
            : 0;
      vesselAcc[vessel].confirmedCount++;
      vesselAcc[vessel].confirmedGrossSalesUsd += grossUsd;
      if (isFromComparisonSession) {
        vesselAcc[vessel].confirmedFromCompCount++;
        if (sessionId) confirmedFromCompSessions.add(sessionId);
      }
      getEntryRow(entryKey).providerConfirmedBookings++;
      recentFunnelEvents.push({
        occurredAt,
        sessionId,
        stage: "provider_confirmed_booking",
        vesselKey: vessel,
        productSlug:
          vessel === "natchez" ? NATCHEZ_DAYTIME_PRODUCT_SLUG : CITY_RIVERBOAT_PRODUCT_SLUG,
        itemId,
        landingPath,
        sourcePage,
        targetPath,
      });
    }
  }

  // Also check commercial outcomes ledger for any authenticated FareHarbor outcomes on 561220 / 694782 not yet in corridor events
  const seenOutcomeRefs = new Set<string>();
  for (const outcome of outcomes) {
    if (outcome.provider !== "fareharbor") continue;
    if (outcome.eventType !== "BOOKING_CONFIRMED" && outcome.eventType !== "BOOKING_FULFILLED") {
      continue;
    }
    if (seenOutcomeRefs.has(outcome.providerBookingRef)) continue;
    const vessel = inferRiverboatVesselFromData({
      productSlug: outcome.bookedProductCode,
      itemId: outcome.bookedOption || outcome.bookedProductCode,
    });
    if (!vessel) continue;
    seenOutcomeRefs.add(outcome.providerBookingRef);
    vesselAcc[vessel].confirmedCount++;
    if (outcome.bookingValue?.amount) {
      vesselAcc[vessel].confirmedGrossSalesUsd += outcome.bookingValue.amount;
    }
  }

  const totalConfirmedBookings =
    vesselAcc.natchez.confirmedCount + vesselAcc.city_of_new_orleans.confirmedCount;
  const totalConfirmedGrossUsd =
    Math.round(
      (vesselAcc.natchez.confirmedGrossSalesUsd +
        vesselAcc.city_of_new_orleans.confirmedGrossSalesUsd) *
        100,
    ) / 100;

  return {
    generatedAt: new Date().toISOString(),
    funnelId: "wno_riverboat_comparison",
    comparisonSlug: RIVERBOAT_COMPARISON_SLUG,
    comparisonUrl:
      "https://www.welcometoneworleanstours.com/compare/natchez-vs-city-of-new-orleans-riverboat",
    windowDays,
    includeSyntheticTests: Boolean(options?.customEvents),
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
        conversionFromCheckoutOpenedPct: pct(totalConfirmedBookings, checkoutOpenedTotalEvents),
        status:
          totalConfirmedBookings > 0
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
        confirmedGrossSalesUsd: Math.round(vesselAcc.natchez.confirmedGrossSalesUsd * 100) / 100,
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
        confirmedGrossSalesUsd:
          Math.round(vesselAcc.city_of_new_orleans.confirmedGrossSalesUsd * 100) / 100,
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
    recentFunnelEvents: recentFunnelEvents.slice(0, 25),
  };
}
