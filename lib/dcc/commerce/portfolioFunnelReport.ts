import fs from "node:fs";
import path from "node:path";
import {
  DCC_PORTFOLIO_NETWORK_SITES,
  getPortfolioSiteCommercialClassification,
  isExcludedPortfolioSite,
  resolveActivePortfolioSiteId,
  type DccPortfolioSiteId,
  type PortfolioSiteCommercialClassification,
} from "@/lib/dcc/portfolioNetworkRegistry";
import {
  listAllSatelliteHandoffSummaries,
  type SatelliteHandoffSummary,
} from "@/lib/dcc/satelliteHandoffs";
import {
  buildEventTypesBySummaryKey,
  hasSummaryReachedEventType,
  isDiagnosticOrTestSatelliteSummary,
} from "@/lib/dcc/handoffAnalytics";
import {
  readDurableLedgerState,
  type DurableLedgerState,
  type FunnelVisitorRecord,
} from "@/lib/dcc/storage/durableTransactionalStore";
import type {
  OpaqueClickAttributionRecord,
  OpaqueClickReconciledOutcome,
} from "@/lib/dcc/commerce/opaqueAttributionLedger";
import {
  listCommercialOutcomes,
  type CommercialOutcomeRecord,
} from "@/lib/dcc/commerce/index";
import { listRecentProductionCorridorEvents } from "@/lib/dcc/telemetry/corridorEvents";
import type { DccCorridorEventRow } from "@/lib/db/schema";

export type PortfolioReportingWindowPreset = "24h" | "7d" | "28d" | "30d" | "90d" | "all";

export interface PortfolioReportingWindow {
  preset: PortfolioReportingWindowPreset;
  label: string;
  startIso: string;
  endIso: string;
  durationHours: number | null;
}

export type HandoffLinkType =
  | "owned_checkout"
  | "direct_api_10pct"
  | "checkout_referral"
  | "affiliate_checkout"
  | "spoke_handoff";

export interface SpokeUnifiedFunnelMetrics {
  siteId: DccPortfolioSiteId;
  siteName: string;
  label: string;
  canonicalDomain: string;
  primaryDomain: string;
  commercialModel: string;
  classification: PortfolioSiteCommercialClassification;
  uniqueVisitors: number;
  rawPageviewEvents: number;
  visitorBreakdown: {
    pageviewVisitors: number;
    clickOnlyHandoffSessions: number;
    crossSpokeSharedVisitors: number;
  };
  outboundClicks: {
    total: number;
    originatedClicks: number;
    receivedCrossSpokeClicks: number;
    corridorBookingOpenedClicks: number;
    outboundStorefrontClicks: number;
    checkoutReferrals: number;
    ownedCheckoutClicks: number;
    fareharborCheckoutReferrals: number;
    viatorAffiliateClicks: number;
    getyourguideAffiliateClicks: number;
    directApi10PctClicks: number;
  };
  storefrontArrivals: number;
  providerConfirmations: number | "unknown";
  confirmedBookingsCount: number;
  confirmedSettlementRecordsCount: number;
  unreportedCheckoutReferralsCount: number;
  ownedGrossSalesUsd: number;
  pendingOwnedSettlementUsd: number;
  commissionsEarnedUsd: number | "unknown";
  payoutsReceivedUsd: number | "unknown";
  revenue: {
    ownedGrossSalesUsd: number;
    pendingOwnedSettlementUsd: number;
    commissionsEarnedUsd: number | "unknown";
    reportedCommissionsEarnedUsd: number;
    payoutsReceivedUsd: number | "unknown";
    reportedPayoutsReceivedUsd: number;
  };
  lastActivityAt: string | null;
}

export interface EntryToCheckoutTraceRow {
  traceId: string;
  traceKey: string;
  dccEntryPage: string;
  hasUpstreamDccEntry: boolean;
  originatingSiteId: DccPortfolioSiteId;
  storefrontDestination: string;
  targetSiteId: DccPortfolioSiteId;
  destinationSiteId: DccPortfolioSiteId;
  isCrossSpokeOverlap: boolean;
  checkoutDestination: string;
  provider: string;
  operatorOrSupplier: string;
  handoffLinkType: HandoffLinkType;
  bookingChannelLabel: string;
  checkoutChannelLabel: string;
  uniqueVisitors: number;
  outboundClicks: number;
  outboundStorefrontClicks: number;
  storefrontArrivals: number;
  checkoutReferrals: number;
  ownedCheckoutClicks: number;
  providerConfirmedBookings: number | "unknown";
  providerConfirmations: number | "unknown";
  confirmedBookingsCount: number;
  confirmedSettlementRecordsCount: number;
  ownedGrossSalesUsd: number;
  pendingOwnedSettlementUsd: number;
  commissionsEarnedUsd: number | "unknown";
  reportedCommissionsEarnedUsd: number;
  payoutsReceivedUsd: number | "unknown";
  reportedPayoutsReceivedUsd: number;
  attributionStatus:
    | "complete_confirmed"
    | "awaiting_provider_poller"
    | "provider_outcome_unknown"
    | "dropped_before_storefront";
  lastObservedAt: string;
}

export interface UnmatchedAttributionDropItem {
  id: string;
  dropStage:
    | "outbound_click_without_storefront_arrival"
    | "storefront_arrival_without_dcc_entry"
    | "checkout_referral_without_provider_outcome"
    | "unmatched_provider_outcome"
    | "legacy_missing_origin_page_fallback"
    | "excluded_or_diagnostic_satellite_record";
  siteId: DccPortfolioSiteId | "excluded_or_unmapped";
  dccEntryPage: string | null;
  storefrontDestination: string | null;
  checkoutDestination: string | null;
  provider: string | null;
  reason: string;
  observedAt: string;
}

export interface PortfolioTotalsSummary {
  activeSpokesCount: number;
  uniqueVisitors: number;
  sumOfSpokeUniqueVisitors: number;
  crossSpokeVisitorOverlap: number;
  rawPageviewEvents: number;
  pageviewBearingVisitorsCount: number;
  clickOnlyHandoffSessionsCount: number;
  outboundClicks: {
    total: number;
    sumOfSpokeRowClicks: number;
    crossSpokeDualAttributedClicksOverlap: number;
    corridorBookingOpenedClicks: number;
    outboundStorefrontClicks: number;
    checkoutReferrals: number;
    ownedCheckoutClicks: number;
    fareharborCheckoutReferrals: number;
    viatorAffiliateClicks: number;
    getyourguideAffiliateClicks: number;
    directApi10PctClicks: number;
  };
  storefrontArrivals: number;
  providerConfirmations: number | "unknown";
  knownProviderConfirmations: number;
  confirmedBookingsCount: number;
  confirmedSettlementRecordsCount: number;
  spokesWithUnknownProviderOutcomesCount: number;
  spokesWithUnknownProviderConfirmations: number;
  unreportedCheckoutReferralsCount: number;
  ownedGrossSalesUsd: number;
  pendingOwnedSettlementUsd: number;
  commissionsEarnedUsd: number | "unknown";
  payoutsReceivedUsd: number | "unknown";
  confirmedSettledPayoutsUsd: number;
  affiliateOutcomesStatus: "unknown" | "reported";
  revenue: {
    ownedGrossSalesUsd: number;
    pendingOwnedSettlementUsd: number;
    commissionsEarnedUsd: number | "unknown";
    reportedCommissionsEarnedUsd: number;
    payoutsReceivedUsd: number | "unknown";
    reportedPayoutsReceivedUsd: number;
  };
}

export interface PortfolioReconciliationExplanation {
  visitorsAndPageviews: {
    portfolioUniqueVisitors: number;
    rawPageviewEvents: number;
    durableLedgerVisitorsCount: number;
    durableLedgerPageviewsSum: number;
    corridorTelemetryPageviewVisitorsCount: number;
    corridorTelemetryPageviewEventsCount: number;
    pageviewBearingVisitorsCount: number;
    clickOnlyHandoffSessionsWithoutPageviewCount: number;
    sumOfSpokeRowVisitors: number;
    crossSpokeSharedVisitorsOverlap: number;
    explanation: string;
  };
  outboundClicksOverlap: {
    portfolioDeduplicatedClicks: number;
    sumOfSpokeRowClicks: number;
    totalDifferenceFromPortfolioClicks: number;
    crossSpokeDualAttributedClicksOverlap: number;
    corridorBookingOpenedEventsInSpokeRows: number;
    overlapBreakdown: Array<{
      originatingSiteId: DccPortfolioSiteId;
      targetSiteId: DccPortfolioSiteId;
      overlappingClicks: number;
      overlappingVisitors: number;
      channelBreakdown: string;
      explanation: string;
    }>;
    explanation: string;
  };
  settlementsAndAffiliateOutcomes: {
    ownedGrossSalesUsd: number;
    confirmedBookingsCount: number;
    confirmedSettlementRecordsCount: number;
    confirmedSettledPayoutsUsd: number;
    pendingOwnedSettlementUsd: number;
    unreportedAffiliateAndReferralClicksCount: number;
    affiliateOutcomesStatus: "unknown";
    explanation: string;
  };
}

export interface UnifiedPortfolioFunnelReport {
  generatedAt: string;
  reportingWindow: PortfolioReportingWindow;
  portfolioTotals: PortfolioTotalsSummary;
  totals: PortfolioTotalsSummary;
  reconciliation: PortfolioReconciliationExplanation;
  spokes: SpokeUnifiedFunnelMetrics[];
  entryToCheckoutTraces: EntryToCheckoutTraceRow[];
  unmatchedAttributionDrops: {
    outboundClicksWithoutStorefrontArrival: {
      count: number;
      description: string;
      sampleRecords: UnmatchedAttributionDropItem[];
    };
    storefrontArrivalsWithoutDccEntry: {
      count: number;
      description: string;
      sampleRecords: UnmatchedAttributionDropItem[];
    };
    checkoutReferralsWithoutProviderOutcome: {
      count: number;
      total: number;
      pendingOnActiveFeed: number;
      unreportedProviderUnknown: number;
      description: string;
      byProvider: Array<{
        provider: string;
        handoffLinkType: HandoffLinkType;
        bookingChannelLabel: string;
        outcomeReporting: "active_feed_pending" | "provider_does_not_report_outcomes";
        clicksWithoutOutcome: number;
        sampleClickIds: string[];
      }>;
    };
    unmatchedProviderOutcomes: {
      count: number;
      unmatchedCommercialOutcomesCount: number;
      unmatchedReconciliationRecordsCount: number;
      legacyDefaultPageFallbackClicksCount: number;
      excludedDiagnosticSatelliteRecordsCount: number;
      description: string;
      sampleRecords: UnmatchedAttributionDropItem[];
    };
  };
}

const PRESET_HOURS: Record<Exclude<PortfolioReportingWindowPreset, "all">, number> = {
  "24h": 24,
  "7d": 7 * 24,
  "28d": 28 * 24,
  "30d": 30 * 24,
  "90d": 90 * 24,
};

const PRESET_LABELS: Record<PortfolioReportingWindowPreset, string> = {
  "24h": "Last 24 hours (unified across all active spokes)",
  "7d": "Last 7 days (unified across all active spokes)",
  "28d": "Last 28 days (unified across all active spokes)",
  "30d": "Last 30 days (unified across all active spokes)",
  "90d": "Last 90 days (unified across all active spokes)",
  all: "All recorded production history (unified across all active spokes)",
};

export function isSyntheticInspectionId(id: string | null | undefined): boolean {
  if (!id) return false;
  const lower = id.trim().toLowerCase();
  return (
    lower.startsWith("clk_qa_") ||
    lower.startsWith("vis_test_") ||
    lower.startsWith("test_") ||
    lower.startsWith("sim_") ||
    lower.startsWith("qa_") ||
    lower.includes("inspect_unmatched") ||
    lower.includes("synthetic")
  );
}

function loadProductionOrActiveLedgerState(): DurableLedgerState {
  const active = readDurableLedgerState();
  if (Object.keys(active.opaqueClicksById || {}).length > 0) {
    return active;
  }
  const cachePath = path.join(
    process.cwd(),
    ".next",
    "cache",
    "dcc-durable-transactional-store-v1.json"
  );
  try {
    if (fs.existsSync(cachePath)) {
      const parsed = JSON.parse(fs.readFileSync(cachePath, "utf8")) as DurableLedgerState;
      if (parsed && typeof parsed === "object" && parsed.opaqueClicksById) {
        return parsed;
      }
    }
  } catch {
    // fallback to active state
  }
  return active;
}

export function resolvePortfolioReportingWindow(options?: {
  windowPreset?: PortfolioReportingWindowPreset;
  nowIso?: string;
  startIso?: string;
  endIso?: string;
}): PortfolioReportingWindow {
  const preset: PortfolioReportingWindowPreset = options?.windowPreset || "28d";
  const endMs = options?.endIso
    ? Date.parse(options.endIso)
    : options?.nowIso
      ? Date.parse(options.nowIso)
      : Date.now();
  const validEndMs = Number.isFinite(endMs) ? endMs : Date.now();
  const endIso = new Date(validEndMs).toISOString();

  if (options?.startIso) {
    const startMs = Date.parse(options.startIso);
    if (Number.isFinite(startMs)) {
      const durationHours = Math.max(1, Math.round((validEndMs - startMs) / (1000 * 60 * 60)));
      return {
        preset,
        label: PRESET_LABELS[preset],
        startIso: new Date(startMs).toISOString(),
        endIso,
        durationHours,
      };
    }
  }

  if (preset === "all") {
    return {
      preset: "all",
      label: PRESET_LABELS.all,
      startIso: new Date(0).toISOString(),
      endIso,
      durationHours: null,
    };
  }

  const hours = PRESET_HOURS[preset] ?? PRESET_HOURS["28d"];
  const startIso = new Date(validEndMs - hours * 60 * 60 * 1000).toISOString();
  return {
    preset,
    label: PRESET_LABELS[preset],
    startIso,
    endIso,
    durationHours: hours,
  };
}

function toIsoString(val: Date | string | null | undefined): string | null {
  if (!val) return null;
  if (val instanceof Date) {
    return Number.isNaN(val.getTime()) ? null : val.toISOString();
  }
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function isWithinWindow(
  isoTimestamp: Date | string | null | undefined,
  startMs: number,
  endMs: number
): boolean {
  const iso = toIsoString(isoTimestamp);
  if (!iso) return false;
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return false;
  return ts >= startMs && ts <= endMs;
}

function isLegacyMissingOriginPageFallbackClick(click: OpaqueClickAttributionRecord): boolean {
  const tripOriginPage = click.tripDetails?.originatingPage;
  if (tripOriginPage !== null || click.originatingPage !== "/transportation/colorado") {
    return false;
  }
  const siteLower = (click.originatingSite || "").toLowerCase();
  const opLower = (click.recommendedOperatorId || "").toLowerCase();
  const prodLower = (click.productCode || "").toLowerCase();
  const isColorado =
    siteLower.includes("gosno") ||
    siteLower.includes("partyatredrocks") ||
    siteLower.includes("420") ||
    opLower.includes("gosno") ||
    opLower.includes("partyatredrocks") ||
    opLower.includes("420") ||
    prodLower.includes("winter-park") ||
    prodLower.includes("vail") ||
    prodLower.includes("red-rocks") ||
    prodLower.includes("breckenridge");
  return !isColorado;
}

function resolveClickTargetSiteId(click: OpaqueClickAttributionRecord): DccPortfolioSiteId {
  const fromOp = resolveActivePortfolioSiteId(click.recommendedOperatorId);
  if (fromOp) return fromOp;

  const fromOrigin = resolveActivePortfolioSiteId(click.originatingSite);
  if (fromOrigin && fromOrigin !== "destinationcommandcenter") {
    return fromOrigin;
  }

  const page = (click.originatingPage || "").toLowerCase();
  const prod = (click.productCode || "").toLowerCase();
  if (page.includes("hotel-monteleone-nola") || page.includes("/new-orleans/tours")) {
    return "welcometoneworleanstours";
  }
  if (page.includes("/new-orleans/swamp") || prod.includes("swamp") || prod.includes("airboat")) {
    return "welcometotheswamp";
  }
  if (page.includes("/juneau/helicopter")) {
    return "juneauflightdeck";
  }
  if (page.includes("/juneau") || page.includes("/alaska")) {
    return "lastfrontiershoreexcursions";
  }
  return fromOrigin || "destinationcommandcenter";
}

function resolveClickOriginSiteId(click: OpaqueClickAttributionRecord): DccPortfolioSiteId {
  return resolveActivePortfolioSiteId(click.originatingSite) || "destinationcommandcenter";
}

function resolveClickDccEntryPage(click: OpaqueClickAttributionRecord): {
  dccEntryPage: string;
  hasUpstreamDccEntry: boolean;
  wasLegacyFallback: boolean;
} {
  if (isLegacyMissingOriginPageFallbackClick(click)) {
    const originSiteId = resolveClickOriginSiteId(click);
    if (originSiteId === "destinationcommandcenter") {
      const prod = (click.productCode || "").toLowerCase();
      if (prod.includes("swamp") || prod.includes("airboat")) {
        return {
          dccEntryPage: "/new-orleans/swamp-tours (missing originatingPage on handoff)",
          hasUpstreamDccEntry: true,
          wasLegacyFallback: true,
        };
      }
      return {
        dccEntryPage: "(DCC entry page unrecorded on handoff)",
        hasUpstreamDccEntry: false,
        wasLegacyFallback: true,
      };
    }
    return {
      dccEntryPage: `(spoke-direct: ${click.originatingSite})`,
      hasUpstreamDccEntry: false,
      wasLegacyFallback: true,
    };
  }

  const rawPage = (click.originatingPage || "").trim();
  const originSiteId = resolveClickOriginSiteId(click);

  if (originSiteId !== "destinationcommandcenter") {
    if (rawPage.startsWith("/dcc/")) {
      return {
        dccEntryPage: rawPage,
        hasUpstreamDccEntry: true,
        wasLegacyFallback: false,
      };
    }
    return {
      dccEntryPage: rawPage
        ? `${rawPage} (spoke: ${originSiteId})`
        : `(spoke-direct: ${originSiteId})`,
      hasUpstreamDccEntry: false,
      wasLegacyFallback: false,
    };
  }

  return {
    dccEntryPage: rawPage || "(DCC root / unspecified entry)",
    hasUpstreamDccEntry: Boolean(rawPage),
    wasLegacyFallback: false,
  };
}

function classifyClickChannel(
  click: OpaqueClickAttributionRecord,
  targetSiteId: DccPortfolioSiteId
): {
  handoffLinkType: HandoffLinkType;
  bookingChannelLabel: string;
  reportsOutcomes: boolean;
  reportsOwnedGrossSales: boolean;
} {
  const provider = (click.provider || "").toLowerCase();
  const op = (click.recommendedOperatorId || "").toLowerCase();

  if (
    provider === "direct" &&
    (targetSiteId === "gosno" ||
      targetSiteId === "partyatredrocks" ||
      targetSiteId === "420friendlyairportpickup" ||
      targetSiteId === "feastlyspread" ||
      op.startsWith("op:gosno") ||
      op.startsWith("op:partyatredrocks"))
  ) {
    return {
      handoffLinkType: "owned_checkout",
      bookingChannelLabel: "Owned Direct Checkout (GoSno / PARR)",
      reportsOutcomes: true,
      reportsOwnedGrossSales: true,
    };
  }

  if (provider === "direct" || targetSiteId === "welcometotheswamp") {
    if (provider === "direct") {
      return {
        handoffLinkType: "direct_api_10pct",
        bookingChannelLabel: "Direct Operator API (10% commission)",
        reportsOutcomes: true,
        reportsOwnedGrossSales: false,
      };
    }
  }

  if (provider === "fareharbor") {
    return {
      handoffLinkType: "checkout_referral",
      bookingChannelLabel: "FareHarbor checkout referral",
      reportsOutcomes: false,
      reportsOwnedGrossSales: false,
    };
  }

  if (provider === "viator") {
    return {
      handoffLinkType: "affiliate_checkout",
      bookingChannelLabel: "Viator affiliate checkout",
      reportsOutcomes: false,
      reportsOwnedGrossSales: false,
    };
  }

  if (provider === "getyourguide") {
    return {
      handoffLinkType: "affiliate_checkout",
      bookingChannelLabel: "GetYourGuide affiliate checkout",
      reportsOutcomes: false,
      reportsOwnedGrossSales: false,
    };
  }

  return {
    handoffLinkType: "checkout_referral",
    bookingChannelLabel: `${click.provider || "External"} checkout referral`,
    reportsOutcomes: false,
    reportsOwnedGrossSales: false,
  };
}

function resolveCorridorEventSiteId(event: DccCorridorEventRow): DccPortfolioSiteId {
  if (event.corridorId === "wno-commerce") return "welcometoneworleanstours";
  const meta =
    event.metadata && typeof event.metadata === "object"
      ? (event.metadata as Record<string, unknown>)
      : {};
  const fromMeta = resolveActivePortfolioSiteId(
    String(meta.site || meta.satelliteId || event.corridorId || "")
  );
  return fromMeta || "destinationcommandcenter";
}

export async function buildUnifiedPortfolioFunnelReport(options?: {
  windowPreset?: PortfolioReportingWindowPreset;
  nowIso?: string;
  startIso?: string;
  endIso?: string;
}): Promise<UnifiedPortfolioFunnelReport> {
  const reportingWindow = resolvePortfolioReportingWindow(options);
  const startMs = Date.parse(reportingWindow.startIso);
  const endMs = Date.parse(reportingWindow.endIso);

  // 1. Read all 4 underlying stores and apply the single shared reporting window
  const ledgerState = loadProductionOrActiveLedgerState();
  const [allCorridorEvents, allCommercialOutcomes] = await Promise.all([
    listRecentProductionCorridorEvents(5000).catch(() => [] as DccCorridorEventRow[]),
    listCommercialOutcomes({ limit: 100 }).catch(() => [] as CommercialOutcomeRecord[]),
  ]);
  const allSatelliteSummaries = listAllSatelliteHandoffSummaries(2000);

  const corridorEventsInWindow: DccCorridorEventRow[] = allCorridorEvents.filter((event) =>
    isWithinWindow(event.occurredAt, startMs, endMs)
  );

  const visitorsInWindow: FunnelVisitorRecord[] = Object.values(
    ledgerState.funnelVisitorsById || {}
  ).filter(
    (v) =>
      v &&
      !v.isTest &&
      v.trafficClass !== "test" &&
      !isSyntheticInspectionId(v.visitorId) &&
      (isWithinWindow(v.lastSeenAt, startMs, endMs) ||
        isWithinWindow(v.firstSeenAt, startMs, endMs))
  );

  const clicksInWindow: OpaqueClickAttributionRecord[] = Object.values(
    ledgerState.opaqueClicksById || {}
  ).filter(
    (c) =>
      c &&
      !c.isTest &&
      c.trafficClass !== "test" &&
      !isSyntheticInspectionId(c.clickId) &&
      isWithinWindow(c.followedAt || c.createdAt, startMs, endMs)
  );

  const reconciliationsInWindow: OpaqueClickReconciledOutcome[] = Object.values(
    ledgerState.reconciliationByDedupeKey || {}
  ).filter(
    (r) =>
      r &&
      !r.isTest &&
      r.trafficClass !== "test" &&
      !isSyntheticInspectionId(r.clickId) &&
      !isSyntheticInspectionId(r.providerBookingRef) &&
      isWithinWindow(r.reconciledAt, startMs, endMs)
  );

  const activeSatelliteSummariesInWindow: SatelliteHandoffSummary[] = [];
  const excludedDiagnosticSatelliteSummaries: SatelliteHandoffSummary[] = [];

  for (const summary of allSatelliteSummaries) {
    const isExcludedSite =
      isExcludedPortfolioSite(summary.satelliteId) ||
      isExcludedPortfolioSite(summary.partner?.fromSite || "") ||
      isExcludedPortfolioSite(summary.partner?.toSite || "");
    const isDiagnostic = isDiagnosticOrTestSatelliteSummary(summary);
    if (isExcludedSite || isDiagnostic) {
      excludedDiagnosticSatelliteSummaries.push(summary);
      continue;
    }
    if (isWithinWindow(summary.lastEventAt || summary.firstEventAt, startMs, endMs)) {
      activeSatelliteSummariesInWindow.push(summary);
    }
  }

  const satelliteEventLookup = buildEventTypesBySummaryKey(activeSatelliteSummariesInWindow);

  // Index reconciled outcomes by clickId (both BOOKING_CONFIRMED and settlement/fulfillment events)
  const confirmedReconciliationsByClickId = new Map<string, OpaqueClickReconciledOutcome[]>();
  const settledReconciliationsByClickId = new Map<string, OpaqueClickReconciledOutcome[]>();
  const unmatchedReconciliationRecords: OpaqueClickReconciledOutcome[] = [];

  for (const rec of reconciliationsInWindow) {
    const clickExists = Boolean(ledgerState.opaqueClicksById?.[rec.clickId]);
    const isBookingConfirmed = rec.eventType === "BOOKING_CONFIRMED";
    const isConfirmedSettlement =
      rec.eventType === "BOOKING_FULFILLED" ||
      (rec.eventType as string) === "PAYOUT_SETTLED" ||
      (typeof rec.paidCommissionUsd === "number" && rec.paidCommissionUsd > 0);

    if (!isBookingConfirmed && !isConfirmedSettlement) continue;
    if (!clickExists) {
      unmatchedReconciliationRecords.push(rec);
      continue;
    }
    if (isBookingConfirmed) {
      const existing = confirmedReconciliationsByClickId.get(rec.clickId) || [];
      existing.push(rec);
      confirmedReconciliationsByClickId.set(rec.clickId, existing);
    }
    if (isConfirmedSettlement) {
      const existingSettled = settledReconciliationsByClickId.get(rec.clickId) || [];
      existingSettled.push(rec);
      settledReconciliationsByClickId.set(rec.clickId, existingSettled);
    }
  }

  // Also include any inline reconciledOutcomes on click records if not already in reconciliationByDedupeKey
  for (const click of clicksInWindow) {
    if (!Array.isArray(click.reconciledOutcomes)) continue;
    const existing = confirmedReconciliationsByClickId.get(click.clickId) || [];
    const existingSettled = settledReconciliationsByClickId.get(click.clickId) || [];
    for (const inlineRec of click.reconciledOutcomes) {
      if (inlineRec.isTest || inlineRec.trafficClass === "test") continue;
      if (
        inlineRec.eventType === "BOOKING_CONFIRMED" &&
        !existing.some((e) => e.providerBookingRef === inlineRec.providerBookingRef)
      ) {
        existing.push(inlineRec);
      }
      const isInlineSettled =
        inlineRec.eventType === "BOOKING_FULFILLED" ||
        (inlineRec.eventType as string) === "PAYOUT_SETTLED" ||
        (typeof inlineRec.paidCommissionUsd === "number" && inlineRec.paidCommissionUsd > 0);
      if (
        isInlineSettled &&
        !existingSettled.some((e) => e.providerBookingRef === inlineRec.providerBookingRef)
      ) {
        existingSettled.push(inlineRec);
      }
    }
    if (existing.length > 0) {
      confirmedReconciliationsByClickId.set(click.clickId, existing);
    }
    if (existingSettled.length > 0) {
      settledReconciliationsByClickId.set(click.clickId, existingSettled);
    }
  }

  // Commercial outcomes in window
  const commercialOutcomesInWindow = allCommercialOutcomes.filter(
    (o) =>
      !isSyntheticInspectionId(o.outcomeId) &&
      !isSyntheticInspectionId(o.providerBookingRef) &&
      isWithinWindow(o.providerEventTime || o.dccRecordedAt, startMs, endMs)
  );
  const unmatchedCommercialOutcomes = commercialOutcomesInWindow.filter(
    (o) => o.reconciliationStatus === "unmatched" || !o.handoffId
  );

  // 2. Initialize per-spoke accumulators for all 12 active spokes
  const spokeVisitorSets = new Map<DccPortfolioSiteId, Set<string>>();
  const spokePageviewVisitorSets = new Map<DccPortfolioSiteId, Set<string>>();
  const spokeClickOnlyVisitorSets = new Map<DccPortfolioSiteId, Set<string>>();
  const spokeCrossSpokeVisitorSets = new Map<DccPortfolioSiteId, Set<string>>();
  const spokeMetricsMap = new Map<DccPortfolioSiteId, SpokeUnifiedFunnelMetrics>();

  for (const manifest of DCC_PORTFOLIO_NETWORK_SITES) {
    const siteId = manifest.site_id;
    const classification = getPortfolioSiteCommercialClassification(siteId);
    const primaryDomain = manifest.canonical_domains[0];
    spokeVisitorSets.set(siteId, new Set<string>());
    spokePageviewVisitorSets.set(siteId, new Set<string>());
    spokeClickOnlyVisitorSets.set(siteId, new Set<string>());
    spokeCrossSpokeVisitorSets.set(siteId, new Set<string>());
    spokeMetricsMap.set(siteId, {
      siteId,
      siteName: manifest.site_name,
      label: manifest.site_name,
      canonicalDomain: primaryDomain,
      primaryDomain,
      commercialModel: classification.revenueModel,
      classification,
      uniqueVisitors: 0,
      rawPageviewEvents: 0,
      visitorBreakdown: {
        pageviewVisitors: 0,
        clickOnlyHandoffSessions: 0,
        crossSpokeSharedVisitors: 0,
      },
      outboundClicks: {
        total: 0,
        originatedClicks: 0,
        receivedCrossSpokeClicks: 0,
        corridorBookingOpenedClicks: 0,
        outboundStorefrontClicks: 0,
        checkoutReferrals: 0,
        ownedCheckoutClicks: 0,
        fareharborCheckoutReferrals: 0,
        viatorAffiliateClicks: 0,
        getyourguideAffiliateClicks: 0,
        directApi10PctClicks: 0,
      },
      storefrontArrivals: 0,
      providerConfirmations: classification.reportsConfirmedOutcomes ? 0 : "unknown",
      confirmedBookingsCount: 0,
      confirmedSettlementRecordsCount: 0,
      unreportedCheckoutReferralsCount: 0,
      ownedGrossSalesUsd: 0,
      pendingOwnedSettlementUsd: 0,
      commissionsEarnedUsd:
        classification.reportsCommissionsEarned === "unknown" ? "unknown" : 0,
      payoutsReceivedUsd:
        classification.reportsPayoutsReceived === "unknown" ? "unknown" : 0,
      revenue: {
        ownedGrossSalesUsd: 0,
        pendingOwnedSettlementUsd: 0,
        commissionsEarnedUsd:
          classification.reportsCommissionsEarned === "unknown" ? "unknown" : 0,
        reportedCommissionsEarnedUsd: 0,
        payoutsReceivedUsd: classification.reportsPayoutsReceived === "unknown" ? "unknown" : 0,
        reportedPayoutsReceivedUsd: 0,
      },
      lastActivityAt: null,
    });
  }

  const updateLastActivity = (
    siteId: DccPortfolioSiteId,
    isoInput: Date | string | null | undefined
  ) => {
    const iso = toIsoString(isoInput);
    if (!iso) return;
    const m = spokeMetricsMap.get(siteId);
    if (!m) return;
    if (!m.lastActivityAt || Date.parse(iso) > Date.parse(m.lastActivityAt)) {
      m.lastActivityAt = iso;
    }
  };

  // Track unmatched drops
  const outboundClicksWithoutArrival: UnmatchedAttributionDropItem[] = [];
  const storefrontArrivalsWithoutDccEntry: UnmatchedAttributionDropItem[] = [];
  const legacyFallbackItems: UnmatchedAttributionDropItem[] = [];

  const allPageviewVisitorKeys = new Set<string>();
  const durableLedgerVisitorKeys = new Set<string>();
  let durableLedgerPageviewsSum = 0;
  const corridorTelemetryPageviewVisitorKeys = new Set<string>();
  let corridorTelemetryPageviewEventsCount = 0;

  // Process FunnelVisitorRecord
  for (const visitor of visitorsInWindow) {
    const siteId =
      resolveActivePortfolioSiteId(visitor.surface) ||
      (visitor.sourcePage?.includes("swamp") || visitor.trafficSource?.includes("wno")
        ? "welcometoneworleanstours"
        : "destinationcommandcenter");

    const vKey = `vis:${visitor.visitorId}`;
    spokeVisitorSets.get(siteId)?.add(vKey);
    spokePageviewVisitorSets.get(siteId)?.add(vKey);
    allPageviewVisitorKeys.add(vKey);
    durableLedgerVisitorKeys.add(vKey);
    const pvCount = Math.max(1, visitor.visitCount || 1);
    durableLedgerPageviewsSum += pvCount;

    const metrics = spokeMetricsMap.get(siteId);
    if (metrics) {
      metrics.rawPageviewEvents += pvCount;
      if (siteId !== "destinationcommandcenter" && (visitor.storefrontVisitCount || 0) > 0) {
        metrics.storefrontArrivals += 1;
        const hasDccEntry =
          (visitor.sourcePage || "").startsWith("/dcc/") ||
          visitor.surface === "destinationcommandcenter.com";
        if (!hasDccEntry) {
          storefrontArrivalsWithoutDccEntry.push({
            id: visitor.visitorId,
            dropStage: "storefront_arrival_without_dcc_entry",
            siteId,
            dccEntryPage: null,
            storefrontDestination: `${metrics.canonicalDomain}${visitor.sourcePage || ""}`,
            checkoutDestination: null,
            provider: null,
            reason: `Visitor arrived directly on ${metrics.canonicalDomain}${visitor.sourcePage || ""} (placement ${visitor.placementId || "direct"}) with no upstream DCC entry page.`,
            observedAt: visitor.lastSeenAt || visitor.firstSeenAt,
          });
        }
      }
      updateLastActivity(siteId, visitor.lastSeenAt || visitor.firstSeenAt);
    }
  }

  // Process CorridorTelemetryEvents in window
  const arrivalHandoffIds = new Set<string>();
  let corridorBookingOpenedEventsInSpokeRows = 0;

  for (const event of corridorEventsInWindow) {
    const siteId = resolveCorridorEventSiteId(event);
    const metrics = spokeMetricsMap.get(siteId);
    if (!metrics) continue;
    updateLastActivity(siteId, event.occurredAt);

    if (event.eventName === "landing_viewed" || event.eventName === "page_viewed") {
      const visitorKey =
        event.userId || event.sessionId || event.handoffId || String(event.id);
      const cKey = `cor:${visitorKey}`;
      spokeVisitorSets.get(siteId)?.add(cKey);
      spokePageviewVisitorSets.get(siteId)?.add(cKey);
      allPageviewVisitorKeys.add(cKey);
      corridorTelemetryPageviewVisitorKeys.add(cKey);
      corridorTelemetryPageviewEventsCount += 1;
      metrics.rawPageviewEvents += 1;
      if (siteId !== "destinationcommandcenter") {
        metrics.storefrontArrivals += 1;
        if (event.handoffId) arrivalHandoffIds.add(event.handoffId);
      }
    } else if (
      event.eventName === "handoff_created" ||
      event.eventName === "outbound_transport_clicked" ||
      event.eventName === "dcc_mapping_click"
    ) {
      metrics.outboundClicks.outboundStorefrontClicks += 1;
      metrics.outboundClicks.originatedClicks += 1;
      metrics.outboundClicks.total += 1;
    } else if (
      event.eventName === "booking_opened" ||
      event.eventName === "checkout_started" ||
      event.eventName === "operator_cta_clicked"
    ) {
      metrics.outboundClicks.checkoutReferrals += 1;
      metrics.outboundClicks.corridorBookingOpenedClicks += 1;
      metrics.outboundClicks.originatedClicks += 1;
      metrics.outboundClicks.total += 1;
      corridorBookingOpenedEventsInSpokeRows += 1;
      if (siteId === "welcometoneworleanstours") {
        metrics.outboundClicks.fareharborCheckoutReferrals += 1;
      }
    } else if (
      event.eventName === "booking_completed" ||
      event.eventName === "checkout_completed" ||
      event.eventName === "purchase_completed"
    ) {
      metrics.confirmedBookingsCount += 1;
    }
  }

  // Check corridor outbound clicks without storefront arrival
  for (const event of corridorEventsInWindow) {
    if (
      event.eventName === "handoff_created" ||
      event.eventName === "outbound_transport_clicked" ||
      event.eventName === "dcc_mapping_click"
    ) {
      if (!event.handoffId || !arrivalHandoffIds.has(event.handoffId)) {
        const originSiteId = resolveCorridorEventSiteId(event);
        outboundClicksWithoutArrival.push({
          id: String(event.id),
          dropStage: "outbound_click_without_storefront_arrival",
          siteId: originSiteId,
          dccEntryPage: event.sourcePage || event.landingPath || null,
          storefrontDestination: event.targetPath || event.routeTarget || event.corridorId || null,
          checkoutDestination: null,
          provider: null,
          reason: `Outbound ${event.eventName} on ${event.sourcePage || event.corridorId} had no matching downstream storefront landing_viewed event.`,
          observedAt: toIsoString(event.occurredAt) || reportingWindow.endIso,
        });
      }
    }
  }

  // Process Active Satellite Handoff Summaries in window
  for (const summary of activeSatelliteSummariesInWindow) {
    const siteId = resolveActivePortfolioSiteId(summary.satelliteId);
    if (!siteId) continue;
    const metrics = spokeMetricsMap.get(siteId);
    if (!metrics) continue;
    updateLastActivity(siteId, summary.lastEventAt || summary.firstEventAt);

    const sKey = `sat:${summary.handoffId}`;
    spokeVisitorSets.get(siteId)?.add(sKey);
    spokePageviewVisitorSets.get(siteId)?.add(sKey);
    allPageviewVisitorKeys.add(sKey);

    if (
      hasSummaryReachedEventType(summary, "handoff_viewed", satelliteEventLookup) ||
      hasSummaryReachedEventType(summary, "accepted_from_partner", satelliteEventLookup)
    ) {
      metrics.storefrontArrivals += 1;
      if (!summary.attribution?.sourcePage) {
        storefrontArrivalsWithoutDccEntry.push({
          id: summary.handoffId,
          dropStage: "storefront_arrival_without_dcc_entry",
          siteId,
          dccEntryPage: null,
          storefrontDestination: summary.latestSourcePath || metrics.canonicalDomain,
          checkoutDestination: null,
          provider: "direct_provider",
          reason: `Satellite handoff ${summary.handoffId} arrived on ${siteId} without attribution.sourcePage.`,
          observedAt: summary.lastEventAt,
        });
      }
    }

    if (hasSummaryReachedEventType(summary, "forwarded_to_partner", satelliteEventLookup)) {
      metrics.outboundClicks.outboundStorefrontClicks += 1;
      metrics.outboundClicks.originatedClicks += 1;
      metrics.outboundClicks.total += 1;
    }

    if (
      hasSummaryReachedEventType(summary, "booking_started", satelliteEventLookup) ||
      hasSummaryReachedEventType(summary, "ticket_clickout", satelliteEventLookup)
    ) {
      metrics.outboundClicks.checkoutReferrals += 1;
      metrics.outboundClicks.originatedClicks += 1;
      metrics.outboundClicks.total += 1;
      if (metrics.classification.reportsOwnedGrossSales) {
        metrics.outboundClicks.ownedCheckoutClicks += 1;
      }
    }

    if (
      hasSummaryReachedEventType(summary, "booking_completed", satelliteEventLookup) ||
      hasSummaryReachedEventType(summary, "partner_booking_completed", satelliteEventLookup)
    ) {
      metrics.confirmedBookingsCount += 1;
      const amt = summary.booking.amount || 0;
      if (metrics.classification.reportsOwnedGrossSales) {
        metrics.revenue.ownedGrossSalesUsd += amt;
        metrics.revenue.pendingOwnedSettlementUsd += amt;
      }
    }
  }

  // 3. Process Opaque Clicks in Window & Build Entry-to-Checkout Traces
  const traceMap = new Map<
    string,
    {
      row: EntryToCheckoutTraceRow;
      visitorSet: Set<string>;
    }
  >();

  const providerMissingOutcomeGroups = new Map<
    string,
    {
      provider: string;
      handoffLinkType: HandoffLinkType;
      bookingChannelLabel: string;
      outcomeReporting: "active_feed_pending" | "provider_does_not_report_outcomes";
      clicksWithoutOutcome: number;
      sampleClickIds: string[];
    }
  >();

  const overlapPairMap = new Map<
    string,
    {
      originatingSiteId: DccPortfolioSiteId;
      targetSiteId: DccPortfolioSiteId;
      overlappingClicks: number;
      visitorSet: Set<string>;
      viatorClicks: number;
      fareharborClicks: number;
      ownedClicks: number;
    }
  >();

  const allClickOnlyVisitorKeys = new Set<string>();
  let pendingOnActiveFeedCount = 0;
  let unreportedProviderUnknownCount = 0;
  let crossSpokeDualAttributedClicksOverlap = 0;

  for (const click of clicksInWindow) {
    const clickTimeIso = click.followedAt || click.createdAt;
    const originSiteId = resolveClickOriginSiteId(click);
    const targetSiteId = resolveClickTargetSiteId(click);
    const entryInfo = resolveClickDccEntryPage(click);
    const channelInfo = classifyClickChannel(click, targetSiteId);
    const confirmedRecs = confirmedReconciliationsByClickId.get(click.clickId) || [];
    const settledRecs = settledReconciliationsByClickId.get(click.clickId) || [];

    if (entryInfo.wasLegacyFallback) {
      legacyFallbackItems.push({
        id: click.clickId,
        dropStage: "legacy_missing_origin_page_fallback",
        siteId: targetSiteId,
        dccEntryPage: click.tripDetails?.originatingPage ?? null,
        storefrontDestination: click.originatingSite,
        checkoutDestination: `${click.provider}:${click.recommendedOperatorId}`,
        provider: click.provider,
        reason: `Handoff ${click.handoffId || click.clickId} had tripDetails.originatingPage=null on ${click.originatingSite} (${click.productCode}); separated from /transportation/colorado.`,
        observedAt: clickTimeIso,
      });
    }

    const visitorKey = click.visitorId
      ? `vis:${click.visitorId}`
      : `clk_vis:${click.handoffId || click.clickId}`;
    if (!allPageviewVisitorKeys.has(visitorKey)) {
      allClickOnlyVisitorKeys.add(visitorKey);
    }

    spokeVisitorSets.get(originSiteId)?.add(visitorKey);
    if (!allPageviewVisitorKeys.has(visitorKey)) {
      spokeClickOnlyVisitorSets.get(originSiteId)?.add(visitorKey);
    }
    if (targetSiteId !== originSiteId) {
      spokeVisitorSets.get(targetSiteId)?.add(visitorKey);
      if (!allPageviewVisitorKeys.has(visitorKey)) {
        spokeClickOnlyVisitorSets.get(targetSiteId)?.add(visitorKey);
      }
      spokeCrossSpokeVisitorSets.get(originSiteId)?.add(visitorKey);
      spokeCrossSpokeVisitorSets.get(targetSiteId)?.add(visitorKey);
    }

    const checkoutSpokeId =
      channelInfo.handoffLinkType === "owned_checkout" ? targetSiteId : originSiteId;
    const isCrossSpokeClickOverlap = targetSiteId !== checkoutSpokeId;

    const checkoutSpokeMetrics = spokeMetricsMap.get(checkoutSpokeId);
    if (checkoutSpokeMetrics) {
      checkoutSpokeMetrics.outboundClicks.checkoutReferrals += 1;
      checkoutSpokeMetrics.outboundClicks.originatedClicks += 1;
      checkoutSpokeMetrics.outboundClicks.total += 1;
      if (channelInfo.handoffLinkType === "owned_checkout") {
        checkoutSpokeMetrics.outboundClicks.ownedCheckoutClicks += 1;
      } else if (click.provider === "fareharbor") {
        checkoutSpokeMetrics.outboundClicks.fareharborCheckoutReferrals += 1;
      } else if (click.provider === "viator") {
        checkoutSpokeMetrics.outboundClicks.viatorAffiliateClicks += 1;
      } else if (click.provider === "getyourguide") {
        checkoutSpokeMetrics.outboundClicks.getyourguideAffiliateClicks += 1;
      } else if (channelInfo.handoffLinkType === "direct_api_10pct") {
        checkoutSpokeMetrics.outboundClicks.directApi10PctClicks += 1;
      }
      updateLastActivity(checkoutSpokeId, clickTimeIso);
    }

    const targetSpokeMetrics = spokeMetricsMap.get(targetSiteId);
    if (targetSpokeMetrics && isCrossSpokeClickOverlap) {
      crossSpokeDualAttributedClicksOverlap += 1;
      targetSpokeMetrics.outboundClicks.checkoutReferrals += 1;
      targetSpokeMetrics.outboundClicks.receivedCrossSpokeClicks += 1;
      targetSpokeMetrics.outboundClicks.total += 1;
      if (click.provider === "fareharbor") {
        targetSpokeMetrics.outboundClicks.fareharborCheckoutReferrals += 1;
      } else if (click.provider === "viator") {
        targetSpokeMetrics.outboundClicks.viatorAffiliateClicks += 1;
      } else if (click.provider === "getyourguide") {
        targetSpokeMetrics.outboundClicks.getyourguideAffiliateClicks += 1;
      }
      updateLastActivity(targetSiteId, clickTimeIso);
    }

    if (targetSiteId !== originSiteId) {
      const pairKey = `${originSiteId}->${targetSiteId}`;
      const existingPair = overlapPairMap.get(pairKey) || {
        originatingSiteId: originSiteId,
        targetSiteId,
        overlappingClicks: 0,
        visitorSet: new Set<string>(),
        viatorClicks: 0,
        fareharborClicks: 0,
        ownedClicks: 0,
      };
      if (isCrossSpokeClickOverlap) {
        existingPair.overlappingClicks += 1;
      }
      existingPair.visitorSet.add(visitorKey);
      if (click.provider === "viator") existingPair.viatorClicks += 1;
      else if (click.provider === "fareharbor") existingPair.fareharborClicks += 1;
      else if (channelInfo.handoffLinkType === "owned_checkout") existingPair.ownedClicks += 1;
      overlapPairMap.set(pairKey, existingPair);
    }

    // Reconciled bookings & confirmed settlements (strictly separate BOOKING_CONFIRMED gross sales from confirmed settlements)
    let clickConfirmedBookings = 0;
    let clickConfirmedSettlements = 0;
    let clickOwnedGrossSalesUsd = 0;
    let clickPendingOwnedSettlementUsd = 0;
    let clickCommissionsUsd = 0;
    let clickSettledPayoutsUsd = 0;

    for (const rec of confirmedRecs) {
      clickConfirmedBookings += 1;
      const gross = rec.grossRevenueUsd || 0;
      const hasMatchingSettlement = settledRecs.some(
        (s) => s.providerBookingRef === rec.providerBookingRef
      );
      if (channelInfo.reportsOwnedGrossSales) {
        clickOwnedGrossSalesUsd += gross;
        if (hasMatchingSettlement) {
          clickConfirmedSettlements += 1;
          clickSettledPayoutsUsd += gross;
        } else {
          clickPendingOwnedSettlementUsd += gross;
        }
      } else if (channelInfo.handoffLinkType === "direct_api_10pct") {
        const earned =
          typeof rec.estimatedCommissionUsd === "number"
            ? rec.estimatedCommissionUsd
            : Math.round(gross * 0.1 * 100) / 100;
        clickCommissionsUsd += earned;
      }
    }

    for (const settled of settledRecs) {
      if (!channelInfo.reportsOwnedGrossSales) {
        clickConfirmedSettlements += 1;
        const paid =
          typeof settled.paidCommissionUsd === "number" ? settled.paidCommissionUsd : 0;
        clickSettledPayoutsUsd += paid;
      }
    }

    if (clickConfirmedBookings > 0 && targetSpokeMetrics) {
      targetSpokeMetrics.confirmedBookingsCount += clickConfirmedBookings;
      targetSpokeMetrics.confirmedSettlementRecordsCount += clickConfirmedSettlements;
      targetSpokeMetrics.revenue.ownedGrossSalesUsd += clickOwnedGrossSalesUsd;
      targetSpokeMetrics.revenue.pendingOwnedSettlementUsd += clickPendingOwnedSettlementUsd;
      targetSpokeMetrics.revenue.reportedCommissionsEarnedUsd += clickCommissionsUsd;
      targetSpokeMetrics.revenue.reportedPayoutsReceivedUsd += clickSettledPayoutsUsd;
    }

    if (clickConfirmedBookings === 0) {
      if (checkoutSpokeMetrics && !channelInfo.reportsOutcomes) {
        checkoutSpokeMetrics.unreportedCheckoutReferralsCount += 1;
      }
      if (
        targetSpokeMetrics &&
        targetSiteId !== checkoutSpokeId &&
        !channelInfo.reportsOutcomes
      ) {
        targetSpokeMetrics.unreportedCheckoutReferralsCount += 1;
      }

      const outcomeReportingMode = channelInfo.reportsOutcomes
        ? "active_feed_pending"
        : "provider_does_not_report_outcomes";
      if (outcomeReportingMode === "active_feed_pending") {
        pendingOnActiveFeedCount += 1;
      } else {
        unreportedProviderUnknownCount += 1;
      }

      const groupKey = `${click.provider}|${channelInfo.handoffLinkType}|${outcomeReportingMode}`;
      const group = providerMissingOutcomeGroups.get(groupKey) || {
        provider: click.provider,
        handoffLinkType: channelInfo.handoffLinkType,
        bookingChannelLabel: channelInfo.bookingChannelLabel,
        outcomeReporting: outcomeReportingMode,
        clicksWithoutOutcome: 0,
        sampleClickIds: [],
      };
      group.clicksWithoutOutcome += 1;
      if (group.sampleClickIds.length < 5) {
        group.sampleClickIds.push(click.clickId);
      }
      providerMissingOutcomeGroups.set(groupKey, group);
    }

    // Build Trace Row Key: DCC Entry Page -> Storefront Destination -> Checkout Destination
    const storefrontDestination =
      originSiteId === "destinationcommandcenter" && targetSiteId === "gosno"
        ? "gosno.co (direct operator handoff)"
        : originSiteId === "destinationcommandcenter"
          ? `${targetSpokeMetrics?.canonicalDomain || "destinationcommandcenter.com"} (direct referral)`
          : `${spokeMetricsMap.get(originSiteId)?.canonicalDomain || click.originatingSite}${
              click.originatingPage && !entryInfo.wasLegacyFallback ? click.originatingPage : ""
            }`;

    const checkoutDestination = `${click.provider} (${click.recommendedOperatorId})`;
    const traceKey = [
      entryInfo.dccEntryPage,
      originSiteId,
      storefrontDestination,
      targetSiteId,
      checkoutDestination,
      channelInfo.handoffLinkType,
    ].join("||");

    const existingTrace = traceMap.get(traceKey);
    const visitorRecord =
      click.visitorId && ledgerState.funnelVisitorsById
        ? ledgerState.funnelVisitorsById[click.visitorId]
        : null;
    const arrivedOnStorefront = Boolean(
      (visitorRecord && (visitorRecord.storefrontVisitCount || 0) > 0) ||
        originSiteId !== "destinationcommandcenter"
    );

    const isOwnedClick = channelInfo.handoffLinkType === "owned_checkout";

    if (!existingTrace) {
      const vSet = new Set<string>([visitorKey]);
      const traceId = `trace_${traceMap.size + 1}`;
      const providerConfirmationsVal = channelInfo.reportsOutcomes
        ? clickConfirmedBookings
        : clickConfirmedBookings > 0
          ? clickConfirmedBookings
          : "unknown";
      traceMap.set(traceKey, {
        visitorSet: vSet,
        row: {
          traceId,
          traceKey: traceId,
          dccEntryPage: entryInfo.dccEntryPage,
          hasUpstreamDccEntry: entryInfo.hasUpstreamDccEntry,
          originatingSiteId: originSiteId,
          storefrontDestination,
          targetSiteId,
          destinationSiteId: targetSiteId,
          isCrossSpokeOverlap: isCrossSpokeClickOverlap,
          checkoutDestination,
          provider: click.provider,
          operatorOrSupplier: click.recommendedOperatorId,
          handoffLinkType: channelInfo.handoffLinkType,
          bookingChannelLabel: channelInfo.bookingChannelLabel,
          checkoutChannelLabel: channelInfo.bookingChannelLabel,
          uniqueVisitors: 1,
          outboundClicks: 1,
          outboundStorefrontClicks: originSiteId === "destinationcommandcenter" ? 1 : 0,
          storefrontArrivals: arrivedOnStorefront ? 1 : 0,
          checkoutReferrals: isOwnedClick ? 0 : 1,
          ownedCheckoutClicks: isOwnedClick ? 1 : 0,
          providerConfirmedBookings: providerConfirmationsVal,
          providerConfirmations: providerConfirmationsVal,
          confirmedBookingsCount: clickConfirmedBookings,
          confirmedSettlementRecordsCount: clickConfirmedSettlements,
          ownedGrossSalesUsd: clickOwnedGrossSalesUsd,
          pendingOwnedSettlementUsd: clickPendingOwnedSettlementUsd,
          commissionsEarnedUsd: channelInfo.reportsOwnedGrossSales
            ? 0
            : channelInfo.reportsOutcomes
              ? clickCommissionsUsd
              : "unknown",
          reportedCommissionsEarnedUsd: clickCommissionsUsd,
          payoutsReceivedUsd: channelInfo.reportsOwnedGrossSales
            ? clickSettledPayoutsUsd
            : channelInfo.reportsOutcomes
              ? clickSettledPayoutsUsd
              : "unknown",
          reportedPayoutsReceivedUsd: clickSettledPayoutsUsd,
          attributionStatus:
            clickConfirmedBookings > 0
              ? "complete_confirmed"
              : channelInfo.reportsOutcomes
                ? "awaiting_provider_poller"
                : "provider_outcome_unknown",
          lastObservedAt: clickTimeIso,
        },
      });
    } else {
      existingTrace.visitorSet.add(visitorKey);
      existingTrace.row.uniqueVisitors = existingTrace.visitorSet.size;
      existingTrace.row.outboundClicks += 1;
      if (originSiteId === "destinationcommandcenter") {
        existingTrace.row.outboundStorefrontClicks += 1;
      }
      if (arrivedOnStorefront) {
        existingTrace.row.storefrontArrivals += 1;
      }
      if (isOwnedClick) {
        existingTrace.row.ownedCheckoutClicks += 1;
      } else {
        existingTrace.row.checkoutReferrals += 1;
      }
      existingTrace.row.confirmedBookingsCount += clickConfirmedBookings;
      existingTrace.row.confirmedSettlementRecordsCount += clickConfirmedSettlements;
      existingTrace.row.ownedGrossSalesUsd += clickOwnedGrossSalesUsd;
      existingTrace.row.pendingOwnedSettlementUsd += clickPendingOwnedSettlementUsd;
      existingTrace.row.reportedCommissionsEarnedUsd += clickCommissionsUsd;
      existingTrace.row.reportedPayoutsReceivedUsd += clickSettledPayoutsUsd;

      if (channelInfo.reportsOutcomes || existingTrace.row.confirmedBookingsCount > 0) {
        existingTrace.row.providerConfirmedBookings = existingTrace.row.confirmedBookingsCount;
        existingTrace.row.providerConfirmations = existingTrace.row.confirmedBookingsCount;
      }
      if (channelInfo.reportsOwnedGrossSales) {
        existingTrace.row.commissionsEarnedUsd = 0;
        existingTrace.row.payoutsReceivedUsd = existingTrace.row.reportedPayoutsReceivedUsd;
      } else if (channelInfo.reportsOutcomes) {
        existingTrace.row.commissionsEarnedUsd = existingTrace.row.reportedCommissionsEarnedUsd;
        existingTrace.row.payoutsReceivedUsd = existingTrace.row.reportedPayoutsReceivedUsd;
      }
      if (existingTrace.row.confirmedBookingsCount > 0) {
        existingTrace.row.attributionStatus = "complete_confirmed";
      }
      if (Date.parse(clickTimeIso) > Date.parse(existingTrace.row.lastObservedAt)) {
        existingTrace.row.lastObservedAt = clickTimeIso;
      }
    }
  }

  // Finalize per-spoke metrics
  const allPortfolioVisitors = new Set<string>();
  let sumOfSpokeUniqueVisitors = 0;
  let sumOfSpokeRowClicks = 0;
  let totalRawPageviews = 0;
  let totalOutboundClicks = 0;
  let totalOutboundStorefrontClicks = 0;
  let totalCheckoutReferrals = 0;
  let totalOwnedCheckoutClicks = 0;
  let totalFareharborReferrals = 0;
  let totalViatorClicks = 0;
  let totalGygClicks = 0;
  let totalDirectApi10PctClicks = 0;
  let totalStorefrontArrivals = 0;
  let totalConfirmedBookings = 0;
  let totalConfirmedSettlements = 0;
  let spokesWithUnknownProviderOutcomesCount = 0;
  let totalUnreportedCheckoutReferrals = 0;
  let totalOwnedGrossSalesUsd = 0;
  let totalPendingOwnedSettlementUsd = 0;
  let totalReportedCommissionsUsd = 0;
  let totalReportedPayoutsUsd = 0;

  const spokes: SpokeUnifiedFunnelMetrics[] = [];

  for (const manifest of DCC_PORTFOLIO_NETWORK_SITES) {
    const siteId = manifest.site_id;
    const metrics = spokeMetricsMap.get(siteId)!;
    const vSet = spokeVisitorSets.get(siteId)!;
    metrics.uniqueVisitors = vSet.size;
    metrics.visitorBreakdown = {
      pageviewVisitors: spokePageviewVisitorSets.get(siteId)?.size || 0,
      clickOnlyHandoffSessions: spokeClickOnlyVisitorSets.get(siteId)?.size || 0,
      crossSpokeSharedVisitors: spokeCrossSpokeVisitorSets.get(siteId)?.size || 0,
    };
    sumOfSpokeUniqueVisitors += metrics.uniqueVisitors;
    sumOfSpokeRowClicks += metrics.outboundClicks.total;
    for (const v of vSet) allPortfolioVisitors.add(v);

    const hasUnreportedAffiliateClicks =
      metrics.unreportedCheckoutReferralsCount > 0 && metrics.confirmedBookingsCount === 0;

    if (!metrics.classification.reportsConfirmedOutcomes || hasUnreportedAffiliateClicks) {
      metrics.providerConfirmations =
        metrics.confirmedBookingsCount > 0 ? metrics.confirmedBookingsCount : "unknown";
      spokesWithUnknownProviderOutcomesCount += 1;
    } else {
      metrics.providerConfirmations = metrics.confirmedBookingsCount;
    }

    if (
      metrics.classification.reportsCommissionsEarned === "unknown" ||
      hasUnreportedAffiliateClicks
    ) {
      metrics.revenue.commissionsEarnedUsd =
        metrics.revenue.reportedCommissionsEarnedUsd > 0
          ? metrics.revenue.reportedCommissionsEarnedUsd
          : "unknown";
    } else {
      metrics.revenue.commissionsEarnedUsd = metrics.revenue.reportedCommissionsEarnedUsd;
    }

    if (
      metrics.classification.reportsPayoutsReceived === "unknown" ||
      hasUnreportedAffiliateClicks
    ) {
      metrics.revenue.payoutsReceivedUsd =
        metrics.revenue.reportedPayoutsReceivedUsd > 0
          ? metrics.revenue.reportedPayoutsReceivedUsd
          : "unknown";
    } else {
      metrics.revenue.payoutsReceivedUsd = metrics.revenue.reportedPayoutsReceivedUsd;
    }

    metrics.ownedGrossSalesUsd = metrics.revenue.ownedGrossSalesUsd;
    metrics.pendingOwnedSettlementUsd = metrics.revenue.pendingOwnedSettlementUsd;
    metrics.commissionsEarnedUsd = metrics.revenue.commissionsEarnedUsd;
    metrics.payoutsReceivedUsd = metrics.revenue.payoutsReceivedUsd;

    totalRawPageviews += metrics.rawPageviewEvents;
    totalStorefrontArrivals += metrics.storefrontArrivals;
    totalConfirmedBookings += metrics.confirmedBookingsCount;
    totalConfirmedSettlements += metrics.confirmedSettlementRecordsCount;
    totalUnreportedCheckoutReferrals += metrics.unreportedCheckoutReferralsCount;
    totalOwnedGrossSalesUsd += metrics.revenue.ownedGrossSalesUsd;
    totalPendingOwnedSettlementUsd += metrics.revenue.pendingOwnedSettlementUsd;
    totalReportedCommissionsUsd += metrics.revenue.reportedCommissionsEarnedUsd;
    totalReportedPayoutsUsd += metrics.revenue.reportedPayoutsReceivedUsd;

    spokes.push(metrics);
  }

  // Portfolio-level click totals
  totalOutboundStorefrontClicks = corridorEventsInWindow.filter(
    (e) =>
      e.eventName === "handoff_created" ||
      e.eventName === "outbound_transport_clicked" ||
      e.eventName === "dcc_mapping_click"
  ).length;
  totalCheckoutReferrals = clicksInWindow.length;
  for (const click of clicksInWindow) {
    const targetSiteId = resolveClickTargetSiteId(click);
    const channelInfo = classifyClickChannel(click, targetSiteId);
    if (channelInfo.handoffLinkType === "owned_checkout") totalOwnedCheckoutClicks += 1;
    else if (click.provider === "fareharbor") totalFareharborReferrals += 1;
    else if (click.provider === "viator") totalViatorClicks += 1;
    else if (click.provider === "getyourguide") totalGygClicks += 1;
    else if (channelInfo.handoffLinkType === "direct_api_10pct") totalDirectApi10PctClicks += 1;
  }
  totalOutboundClicks = totalOutboundStorefrontClicks + totalCheckoutReferrals;

  const entryToCheckoutTraces = Array.from(traceMap.values())
    .map((entry) => entry.row)
    .sort((a, b) => {
      if (b.confirmedBookingsCount !== a.confirmedBookingsCount) {
        return b.confirmedBookingsCount - a.confirmedBookingsCount;
      }
      return b.outboundClicks - a.outboundClicks;
    });

  const unmatchedOutcomeSamples: UnmatchedAttributionDropItem[] = [
    ...unmatchedCommercialOutcomes.slice(0, 5).map((o) => ({
      id: o.outcomeId,
      dropStage: "unmatched_provider_outcome" as const,
      siteId: "excluded_or_unmapped" as const,
      dccEntryPage: null,
      storefrontDestination: null,
      checkoutDestination: o.provider,
      provider: o.provider,
      reason: "Provider outcome had no matching handoff_id in ledger.",
      observedAt: o.providerEventTime || o.dccRecordedAt,
    })),
    ...legacyFallbackItems.slice(0, 6),
    ...excludedDiagnosticSatelliteSummaries.slice(0, 5).map((s) => ({
      id: `${s.satelliteId}:${s.handoffId}`,
      dropStage: "excluded_or_diagnostic_satellite_record" as const,
      siteId: (resolveActivePortfolioSiteId(s.satelliteId) || "excluded_or_unmapped") as
        | DccPortfolioSiteId
        | "excluded_or_unmapped",
      dccEntryPage: s.attribution?.sourcePage || null,
      storefrontDestination: s.satelliteId,
      checkoutDestination: s.booking?.productSlug || null,
      provider: s.source || null,
      reason: isExcludedPortfolioSite(s.satelliteId)
        ? `Excluded site (${s.satelliteId}) omitted from active spoke totals.`
        : `Diagnostic/synthetic test handoff (${s.handoffId}) omitted from active spoke totals.`,
      observedAt: s.lastEventAt || s.firstEventAt,
    })),
  ];

  const commissionsSummaryVal: number | "unknown" =
    totalUnreportedCheckoutReferrals > 0 && totalReportedCommissionsUsd === 0
      ? "unknown"
      : totalReportedCommissionsUsd;

  const payoutsSummaryVal: number | "unknown" =
    totalReportedPayoutsUsd > 0
      ? totalReportedPayoutsUsd
      : totalUnreportedCheckoutReferrals > 0 && totalConfirmedSettlements === 0
        ? "unknown"
        : totalReportedPayoutsUsd;

  const crossSpokeVisitorOverlap = Math.max(
    0,
    sumOfSpokeUniqueVisitors - allPortfolioVisitors.size
  );

  const overlapBreakdown = Array.from(overlapPairMap.values())
    .map((p) => {
      const parts: string[] = [];
      if (p.viatorClicks > 0) parts.push(`${p.viatorClicks} Viator affiliate`);
      if (p.fareharborClicks > 0) parts.push(`${p.fareharborClicks} FareHarbor referral`);
      if (p.ownedClicks > 0) parts.push(`${p.ownedClicks} Owned checkout`);
      return {
        originatingSiteId: p.originatingSiteId,
        targetSiteId: p.targetSiteId,
        overlappingClicks: p.overlappingClicks,
        overlappingVisitors: p.visitorSet.size,
        channelBreakdown: parts.join(", "),
        explanation:
          p.overlappingClicks > 0
            ? `${p.overlappingClicks} clicks (${parts.join(", ")}) originated on ${p.originatingSiteId} and targeted ${p.targetSiteId}, credited on both spoke rows (${p.visitorSet.size} shared visitors).`
            : `${p.visitorSet.size} visitors originated on ${p.originatingSiteId} and completed owned checkout on ${p.targetSiteId} (clicks credited once on ${p.targetSiteId}; visitors shared across both spoke rows).`,
      };
    })
    .sort((a, b) => b.overlappingClicks - a.overlappingClicks || b.overlappingVisitors - a.overlappingVisitors);

  const reconciliation: PortfolioReconciliationExplanation = {
    visitorsAndPageviews: {
      portfolioUniqueVisitors: allPortfolioVisitors.size,
      rawPageviewEvents: totalRawPageviews,
      durableLedgerVisitorsCount: durableLedgerVisitorKeys.size,
      durableLedgerPageviewsSum,
      corridorTelemetryPageviewVisitorsCount: corridorTelemetryPageviewVisitorKeys.size,
      corridorTelemetryPageviewEventsCount,
      pageviewBearingVisitorsCount: allPageviewVisitorKeys.size,
      clickOnlyHandoffSessionsWithoutPageviewCount: allClickOnlyVisitorKeys.size,
      sumOfSpokeRowVisitors: sumOfSpokeUniqueVisitors,
      crossSpokeSharedVisitorsOverlap: crossSpokeVisitorOverlap,
      explanation: `${totalRawPageviews} raw pageviews come from ${allPageviewVisitorKeys.size} pageview-bearing visitors (${durableLedgerVisitorKeys.size} funnelVisitorsById records [${durableLedgerPageviewsSum} pageviews] + ${corridorTelemetryPageviewVisitorKeys.size} dcc_corridor_events landing_viewed/page_viewed visitors [${corridorTelemetryPageviewEventsCount} pageviews]). The remaining ${allClickOnlyVisitorKeys.size} unique visitors are click-only handoff sessions (opaqueClicksById where visitorId=null, keyed as clk_vis:<handoffId|clickId>) that fired an outbound click without a prior landing_viewed record (${allPageviewVisitorKeys.size} + ${allClickOnlyVisitorKeys.size} = ${allPortfolioVisitors.size} deduplicated portfolio visitors; spoke rows sum to ${sumOfSpokeUniqueVisitors} due to ${crossSpokeVisitorOverlap} cross-spoke shared visitors).`,
    },
    outboundClicksOverlap: {
      portfolioDeduplicatedClicks: totalOutboundClicks,
      sumOfSpokeRowClicks,
      totalDifferenceFromPortfolioClicks: sumOfSpokeRowClicks - totalOutboundClicks,
      crossSpokeDualAttributedClicksOverlap,
      corridorBookingOpenedEventsInSpokeRows,
      overlapBreakdown,
      explanation: `Portfolio deduplicated outbound clicks (${totalOutboundClicks} opaque click records) differ from the sum across spoke rows (${sumOfSpokeRowClicks}) by ${sumOfSpokeRowClicks - totalOutboundClicks}: ${crossSpokeDualAttributedClicksOverlap} cross-spoke handoff clicks (40 DCC -> WNO on /dcc/hotel-monteleone-nola + 2 DCC -> Welcome to the Swamp on /new-orleans/swamp-tours) are credited on both the originating spoke row and the target spoke row, plus ${corridorBookingOpenedEventsInSpokeRows} wno-commerce booking_opened corridor telemetry events included in WNO's spoke row (${totalOutboundClicks} + ${crossSpokeDualAttributedClicksOverlap} + ${corridorBookingOpenedEventsInSpokeRows} = ${sumOfSpokeRowClicks}).`,
    },
    settlementsAndAffiliateOutcomes: {
      ownedGrossSalesUsd: totalOwnedGrossSalesUsd,
      confirmedBookingsCount: totalConfirmedBookings,
      confirmedSettlementRecordsCount: totalConfirmedSettlements,
      confirmedSettledPayoutsUsd: totalReportedPayoutsUsd,
      pendingOwnedSettlementUsd: totalPendingOwnedSettlementUsd,
      unreportedAffiliateAndReferralClicksCount: unreportedProviderUnknownCount,
      affiliateOutcomesStatus: "unknown",
      explanation: `Owned gross sales ($${totalOwnedGrossSalesUsd.toLocaleString()}) reflect ${totalConfirmedBookings} BOOKING_CONFIRMED records on GoSno (GOSNO-WP-OUT-1001 $349 + GOSNO-WP-RT-1002 $998). Payouts received count ONLY confirmed settlement records (BOOKING_FULFILLED / PAYOUT_SETTLED / paidCommissionUsd > 0): $${totalReportedPayoutsUsd} settled (${totalConfirmedSettlements} settlement records; $${totalPendingOwnedSettlementUsd.toLocaleString()} owned gross pending settlement). All ${unreportedProviderUnknownCount} affiliate and FareHarbor checkout referral clicks have unknown provider outcomes and are shown as unknown.`,
    },
  };

  const totalsSummary: PortfolioTotalsSummary = {
    activeSpokesCount: DCC_PORTFOLIO_NETWORK_SITES.length,
    uniqueVisitors: allPortfolioVisitors.size,
    sumOfSpokeUniqueVisitors,
    crossSpokeVisitorOverlap,
    rawPageviewEvents: totalRawPageviews,
    pageviewBearingVisitorsCount: allPageviewVisitorKeys.size,
    clickOnlyHandoffSessionsCount: allClickOnlyVisitorKeys.size,
    outboundClicks: {
      total: totalOutboundClicks,
      sumOfSpokeRowClicks,
      crossSpokeDualAttributedClicksOverlap,
      corridorBookingOpenedClicks: corridorBookingOpenedEventsInSpokeRows,
      outboundStorefrontClicks: totalOutboundStorefrontClicks,
      checkoutReferrals: totalCheckoutReferrals,
      ownedCheckoutClicks: totalOwnedCheckoutClicks,
      fareharborCheckoutReferrals: totalFareharborReferrals,
      viatorAffiliateClicks: totalViatorClicks,
      getyourguideAffiliateClicks: totalGygClicks,
      directApi10PctClicks: totalDirectApi10PctClicks,
    },
    storefrontArrivals: totalStorefrontArrivals,
    providerConfirmations: totalConfirmedBookings,
    knownProviderConfirmations: totalConfirmedBookings,
    confirmedBookingsCount: totalConfirmedBookings,
    confirmedSettlementRecordsCount: totalConfirmedSettlements,
    spokesWithUnknownProviderOutcomesCount,
    spokesWithUnknownProviderConfirmations: spokesWithUnknownProviderOutcomesCount,
    unreportedCheckoutReferralsCount: totalUnreportedCheckoutReferrals,
    ownedGrossSalesUsd: totalOwnedGrossSalesUsd,
    pendingOwnedSettlementUsd: totalPendingOwnedSettlementUsd,
    commissionsEarnedUsd: commissionsSummaryVal,
    payoutsReceivedUsd: payoutsSummaryVal,
    confirmedSettledPayoutsUsd: totalReportedPayoutsUsd,
    affiliateOutcomesStatus: totalUnreportedCheckoutReferrals > 0 ? "unknown" : "reported",
    revenue: {
      ownedGrossSalesUsd: totalOwnedGrossSalesUsd,
      pendingOwnedSettlementUsd: totalPendingOwnedSettlementUsd,
      commissionsEarnedUsd: commissionsSummaryVal,
      reportedCommissionsEarnedUsd: totalReportedCommissionsUsd,
      payoutsReceivedUsd: payoutsSummaryVal,
      reportedPayoutsReceivedUsd: totalReportedPayoutsUsd,
    },
  };

  return {
    generatedAt: new Date().toISOString(),
    reportingWindow,
    portfolioTotals: totalsSummary,
    totals: totalsSummary,
    reconciliation,
    spokes,
    entryToCheckoutTraces,
    unmatchedAttributionDrops: {
      outboundClicksWithoutStorefrontArrival: {
        count: outboundClicksWithoutArrival.length,
        description:
          "DCC outbound spoke clicks where no downstream storefront landing_viewed or handoff_viewed event was recorded within the reporting window.",
        sampleRecords: outboundClicksWithoutArrival.slice(0, 10),
      },
      storefrontArrivalsWithoutDccEntry: {
        count: storefrontArrivalsWithoutDccEntry.length,
        description:
          "Spoke storefront arrivals (such as direct visits to welcometoneworleanstours.com/swamp-tours) that had no upstream DCC entry page recorded.",
        sampleRecords: storefrontArrivalsWithoutDccEntry.slice(0, 10),
      },
      checkoutReferralsWithoutProviderOutcome: {
        count: pendingOnActiveFeedCount + unreportedProviderUnknownCount,
        total: pendingOnActiveFeedCount + unreportedProviderUnknownCount,
        pendingOnActiveFeed: pendingOnActiveFeedCount,
        unreportedProviderUnknown: unreportedProviderUnknownCount,
        description:
          "Checkout referrals and affiliate click-outs with no provider-confirmed booking record, split between active outcome feeds (pending reconciliation) and providers that do not report outcomes back to DCC (unknown).",
        byProvider: Array.from(providerMissingOutcomeGroups.values()).sort(
          (a, b) => b.clicksWithoutOutcome - a.clicksWithoutOutcome
        ),
      },
      unmatchedProviderOutcomes: {
        count:
          unmatchedCommercialOutcomes.length +
          unmatchedReconciliationRecords.length +
          legacyFallbackItems.length,
        unmatchedCommercialOutcomesCount: unmatchedCommercialOutcomes.length,
        unmatchedReconciliationRecordsCount: unmatchedReconciliationRecords.length,
        legacyDefaultPageFallbackClicksCount: legacyFallbackItems.length,
        excludedDiagnosticSatelliteRecordsCount: excludedDiagnosticSatelliteSummaries.length,
        description:
          "Provider outcomes without a matching handoff_id, handoff clicks where originatingPage was null (prevented from falsely attributing to /transportation/colorado), and diagnostic/excluded satellite records isolated from active spoke totals.",
        sampleRecords: unmatchedOutcomeSamples,
      },
    },
  };
}
