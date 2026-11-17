/**
 * Operator-MoR Completed-Booking & Refund Settlement Ledger
 * (`lib/dcc/commerce/operatorMorSettlementLedger.ts`)
 *
 * Pure TypeScript, zero `node:fs`, zero database imports, zero evaluator coupling.
 *
 * Truthful Reconciliation Model:
 *   - `reconciliationMechanism = "provider_report_or_authorized_api_reconciliation"`
 *   - `automaticRealTimeOutcomeKnowledge = false`
 *   - `AUTO_INVOICE_DISPATCH_ENABLED = false`
 *
 * Destination Command Center does NOT claim automatic real-time outcome knowledge
 * on external supplier-hosted checkouts. Outcomes are recorded strictly when
 * authenticated provider reports, CSV/JSON settlement exports, or authorized
 * webhooks are reconciled by the owner. No invoices, outreach, or operator
 * messages are ever dispatched automatically.
 *
 * Settlement Rules (e.g., Juneau Tours & Whale Watch `refid=dccjuneau10`):
 * 1. Operator remains Merchant of Record (`customerFundsCapturedByDcc: false`).
 * 2. Outbound `/go/out` clicks are NEVER bookings and carry $0 commission.
 * 3. `confirmed` / `booked` / `pending` reservations (prior to tour completion)
 *    carry $0 invoiceable commission (`booked_pending_completion`).
 * 4. Commission (10% DCC-sourced direct / 5% machine or Cruise Promenade planner
 *    distributed) becomes invoiceable ONLY after verified tour completion
 *    (`completed_invoiceable`), calculated on net non-refunded gross revenue.
 * 5. Cancellations, weather groundings, missed ship calls, full refunds, disputes,
 *    and chargebacks carry $0 commission (`zero_fee_non_commissionable`).
 * 6. Post-completion full or partial refunds adjust or reverse prior invoiceable
 *    commission and compute `creditOrReversalDueToOperatorUsd` if an invoice was
 *    already paid prior to the refund/dispute/chargeback.
 * 7. Source provenance, import timestamp, and full correction history remain
 *    auditable on every booking position.
 */

export const AUTO_INVOICE_DISPATCH_ENABLED = false as const;

export const OPERATOR_MOR_RECONCILIATION_GOVERNANCE = {
  reconciliationMechanism:
    "provider_report_or_authorized_api_reconciliation" as const,
  automaticRealTimeOutcomeKnowledge: false as const,
  automaticInvoiceDispatchEnabled: false as const,
  autoOutreachDispatchEnabled: false as const,
  clicksCarryZeroCommission: true as const,
  zeroPiiEnforced: true as const,
} as const;

export type OperatorMorBookingLifecycleStage =
  | "booked_pending_completion"
  | "completed_invoiceable"
  | "partially_refunded_adjusted"
  | "settled_paid"
  | "zero_fee_non_commissionable";

export type NonCommissionableReason =
  | "cancelled"
  | "refunded"
  | "disputed"
  | "chargeback"
  | "weather_grounded"
  | "ship_missed_port"
  | "not_successfully_fulfilled";

export interface OperatorMorAuditHistoryEntry {
  outcomeId: string | null;
  sourceProvenance: string;
  reporterClientId: string | null;
  importFormat: string | null;
  importedAt: string;
  providerEventTime: string | null;
  rawStatusOrEventType: string;
  mappedStage:
    | "pending_or_confirmed"
    | "completed"
    | "settled_paid"
    | "partial_refund"
    | "non_commissionable";
  grossAmountUsd: number | null;
  refundedAmountUsd: number | null;
  paidCommissionAmountUsd: number | null;
}

export interface OperatorMorOutcomeEventInput {
  outcomeId?: string | null;
  sourceProvenance?: string | null;
  reporterClientId?: string | null;
  importFormat?: string | null;
  providerEventTime?: string | null;
  providerBookingRef: string;
  operatorId?: string | null;
  operatorName?: string | null;
  providerAccountOrRefId?: string | null;
  handoffId?: string | null;
  clickId?: string | null;
  productCode?: string | null;
  serviceDate?: string | null;
  rawStatusOrEventType: string;
  grossAmountUsd: number | null;
  refundedAmountUsd?: number | null;
  reportedCommissionRateBps?: number | null;
  paidCommissionAmountUsd?: number | null;
  distributionRoute?: "dcc_direct_10pct" | "machine_or_planner_5pct";
  recordedAt: string;
}

export interface OperatorMorBookingLedgerPosition {
  providerBookingRef: string;
  operatorId: string;
  operatorName: string;
  providerAccountOrRefId: string | null;
  handoffId: string | null;
  clickId: string | null;
  productCode: string | null;
  serviceDate: string | null;
  distributionRoute: "dcc_direct_10pct" | "machine_or_planner_5pct";
  agreedCommissionRateBps: 1000 | 500;
  lifecycleStage: OperatorMorBookingLifecycleStage;
  nonCommissionableReason: NonCommissionableReason | null;
  hadPriorCompletedOrSettledState: boolean;
  postCompletionReversalApplied: boolean;
  grossAmountUsd: number;
  refundedAmountUsd: number;
  netRetainedGrossUsd: number;
  estimatedPendingCommissionUsd: number;
  invoiceableCommissionUsd: number;
  settledPaidCommissionUsd: number;
  unpaidInvoiceableBalanceUsd: number;
  creditOrReversalDueToOperatorUsd: number;
  eventHistoryCount: number;
  auditHistory: OperatorMorAuditHistoryEntry[];
  lastUpdatedAt: string;
}

export interface OperatorMorSettlementLedgerSummary {
  operatorId: string;
  operatorName: string;
  merchantOfRecord: "operator";
  customerFundsCapturedByDcc: false;
  reconciliationMechanism: "provider_report_or_authorized_api_reconciliation";
  automaticRealTimeOutcomeKnowledge: false;
  automaticInvoiceDispatchEnabled: false;
  autoOutreachDispatchEnabled: false;
  totalTrackedBookings: number;
  bookedPendingCompletionCount: number;
  completedInvoiceableCount: number;
  partiallyRefundedAdjustedCount: number;
  settledPaidCount: number;
  zeroFeeNonCommissionableCount: number;
  postCompletionReversalCount: number;
  grossBookedPendingUsd: number;
  grossCompletedRetainedUsd: number;
  refundedTotalUsd: number;
  estimatedPendingCommissionUsd: number;
  totalEarnedInvoiceableCommissionUsd: number;
  settledPaidCommissionUsd: number;
  unpaidInvoiceableBalanceUsd: number;
  creditOrReversalDueToOperatorUsd: number;
  netBalanceDueToDccUsd: number;
  positions: OperatorMorBookingLedgerPosition[];
}

function roundCents(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

export function classifyOperatorMorStatus(rawStatusOrEventType: string): {
  stage:
    | "pending_or_confirmed"
    | "completed"
    | "settled_paid"
    | "partial_refund"
    | "non_commissionable";
  nonCommissionableReason: NonCommissionableReason | null;
  mappedCommerceEventType:
    | "BOOKING_PENDING"
    | "BOOKING_CONFIRMED"
    | "BOOKING_FULFILLED"
    | "BOOKING_AMENDED"
    | "COMMISSION_RECONCILED"
    | "BOOKING_CANCELLED"
    | "BOOKING_REFUNDED";
} {
  const s = (rawStatusOrEventType || "").trim().toLowerCase();

  if (s.includes("chargeback")) {
    return {
      stage: "non_commissionable",
      nonCommissionableReason: "chargeback",
      mappedCommerceEventType: "BOOKING_REFUNDED",
    };
  }
  if (s.includes("disput")) {
    return {
      stage: "non_commissionable",
      nonCommissionableReason: "disputed",
      mappedCommerceEventType: "BOOKING_REFUNDED",
    };
  }
  if (s.includes("weather") || s.includes("ground") || s.includes("ceiling")) {
    return {
      stage: "non_commissionable",
      nonCommissionableReason: "weather_grounded",
      mappedCommerceEventType: "BOOKING_CANCELLED",
    };
  }
  if (s.includes("missed_port") || s.includes("missed port")) {
    return {
      stage: "non_commissionable",
      nonCommissionableReason: "ship_missed_port",
      mappedCommerceEventType: "BOOKING_CANCELLED",
    };
  }
  if (s.includes("partial_refund") || s.includes("partially_refunded")) {
    return {
      stage: "partial_refund",
      nonCommissionableReason: null,
      mappedCommerceEventType: "BOOKING_AMENDED",
    };
  }
  if (s.includes("refund")) {
    return {
      stage: "non_commissionable",
      nonCommissionableReason: "refunded",
      mappedCommerceEventType: "BOOKING_REFUNDED",
    };
  }
  if (s.includes("cancel") || s.includes("void")) {
    return {
      stage: "non_commissionable",
      nonCommissionableReason: "cancelled",
      mappedCommerceEventType: "BOOKING_CANCELLED",
    };
  }
  if (s.includes("unfulfill") || s.includes("not_completed")) {
    return {
      stage: "non_commissionable",
      nonCommissionableReason: "not_successfully_fulfilled",
      mappedCommerceEventType: "BOOKING_CANCELLED",
    };
  }
  if (
    s.includes("settl") ||
    s.includes("reconcil") ||
    s.includes("commission_paid") ||
    s.includes("invoice_paid") ||
    s === "paid"
  ) {
    return {
      stage: "settled_paid",
      nonCommissionableReason: null,
      mappedCommerceEventType: "COMMISSION_RECONCILED",
    };
  }
  if (
    s.includes("fulfill") ||
    s.includes("complet") ||
    s.includes("flown") ||
    s.includes("sailed")
  ) {
    return {
      stage: "completed",
      nonCommissionableReason: null,
      mappedCommerceEventType: "BOOKING_FULFILLED",
    };
  }
  if (s.includes("pend") || s.includes("hold")) {
    return {
      stage: "pending_or_confirmed",
      nonCommissionableReason: null,
      mappedCommerceEventType: "BOOKING_PENDING",
    };
  }

  return {
    stage: "pending_or_confirmed",
    nonCommissionableReason: null,
    mappedCommerceEventType: "BOOKING_CONFIRMED",
  };
}

/**
 * Evaluates a chronological stream of reconciled outcome events for an external
 * Operator-MoR partner into truthful per-booking positions, auditable correction
 * history, and an invoiceable/reversal summary. Idempotent against duplicate rows.
 */
export function evaluateOperatorMorSettlementLedger(params: {
  operatorId: string;
  operatorName: string;
  events: readonly OperatorMorOutcomeEventInput[];
}): OperatorMorSettlementLedgerSummary {
  const grouped = new Map<string, OperatorMorOutcomeEventInput[]>();
  const seenEventFingerprints = new Set<string>();

  for (const ev of params.events) {
    const key = ev.providerBookingRef.trim().toUpperCase();
    if (!key) continue;
    const cls = classifyOperatorMorStatus(ev.rawStatusOrEventType);
    const fingerprint = ev.outcomeId
      ? `oid:${ev.outcomeId}`
      : `dedupe:${key}::${cls.mappedCommerceEventType}::${ev.grossAmountUsd ?? 0}::${ev.refundedAmountUsd ?? 0}::${ev.paidCommissionAmountUsd ?? 0}`;
    if (seenEventFingerprints.has(fingerprint)) {
      continue;
    }
    seenEventFingerprints.add(fingerprint);
    const list = grouped.get(key) || [];
    list.push(ev);
    grouped.set(key, list);
  }

  const positions: OperatorMorBookingLedgerPosition[] = [];

  for (const [, rawEvents] of grouped) {
    const events = [...rawEvents].sort((a, b) =>
      a.recordedAt.localeCompare(b.recordedAt),
    );

    const first = events[0]!;
    const latest = events[events.length - 1]!;

    let grossAmountUsd = 0;
    let refundedAmountUsd = 0;
    let cumulativePaidCommissionUsd = 0;
    let hadPriorCompletedOrSettledState = false;
    let currentClassification = classifyOperatorMorStatus(
      first.rawStatusOrEventType,
    );
    let distributionRoute: "dcc_direct_10pct" | "machine_or_planner_5pct" =
      first.distributionRoute || "dcc_direct_10pct";
    let handoffId: string | null = first.handoffId ?? null;
    let clickId: string | null = first.clickId ?? null;
    let productCode: string | null = first.productCode ?? null;
    let serviceDate: string | null = first.serviceDate ?? null;
    let providerAccountOrRefId: string | null =
      first.providerAccountOrRefId ?? null;

    const auditHistory: OperatorMorAuditHistoryEntry[] = [];

    for (const ev of events) {
      const cls = classifyOperatorMorStatus(ev.rawStatusOrEventType);
      currentClassification = cls;

      if (typeof ev.grossAmountUsd === "number" && ev.grossAmountUsd > 0) {
        grossAmountUsd = roundCents(ev.grossAmountUsd);
      }
      if (typeof ev.refundedAmountUsd === "number" && ev.refundedAmountUsd >= 0) {
        refundedAmountUsd = roundCents(ev.refundedAmountUsd);
      }
      if (ev.distributionRoute) {
        distributionRoute = ev.distributionRoute;
      }
      if (ev.handoffId) handoffId = ev.handoffId;
      if (ev.clickId) clickId = ev.clickId;
      if (ev.productCode) productCode = ev.productCode;
      if (ev.serviceDate) serviceDate = ev.serviceDate;
      if (ev.providerAccountOrRefId) {
        providerAccountOrRefId = ev.providerAccountOrRefId;
      }

      if (cls.stage === "completed" || cls.stage === "settled_paid") {
        hadPriorCompletedOrSettledState = true;
      }
      if (
        cls.stage === "settled_paid" &&
        typeof ev.paidCommissionAmountUsd === "number" &&
        ev.paidCommissionAmountUsd > 0
      ) {
        cumulativePaidCommissionUsd = roundCents(ev.paidCommissionAmountUsd);
      }

      auditHistory.push({
        outcomeId: ev.outcomeId ?? null,
        sourceProvenance:
          ev.sourceProvenance || "provider_report_or_csv_reconciliation",
        reporterClientId: ev.reporterClientId ?? null,
        importFormat: ev.importFormat ?? null,
        importedAt: ev.recordedAt,
        providerEventTime: ev.providerEventTime ?? null,
        rawStatusOrEventType: ev.rawStatusOrEventType,
        mappedStage: cls.stage,
        grossAmountUsd:
          typeof ev.grossAmountUsd === "number"
            ? roundCents(ev.grossAmountUsd)
            : null,
        refundedAmountUsd:
          typeof ev.refundedAmountUsd === "number"
            ? roundCents(ev.refundedAmountUsd)
            : null,
        paidCommissionAmountUsd:
          typeof ev.paidCommissionAmountUsd === "number"
            ? roundCents(ev.paidCommissionAmountUsd)
            : null,
      });
    }

    const agreedCommissionRateBps: 1000 | 500 =
      distributionRoute === "machine_or_planner_5pct" ? 500 : 1000;
    const rateFraction = agreedCommissionRateBps / 10_000;

    const isFullZeroFee =
      currentClassification.stage === "non_commissionable" ||
      (grossAmountUsd > 0 && refundedAmountUsd >= grossAmountUsd - 0.009);

    const effectiveRefundedUsd = isFullZeroFee
      ? currentClassification.nonCommissionableReason === "refunded" ||
        currentClassification.nonCommissionableReason === "chargeback" ||
        currentClassification.nonCommissionableReason === "disputed"
        ? Math.max(refundedAmountUsd, grossAmountUsd)
        : refundedAmountUsd
      : Math.min(grossAmountUsd, refundedAmountUsd);

    const netRetainedGrossUsd = isFullZeroFee
      ? 0
      : roundCents(Math.max(0, grossAmountUsd - effectiveRefundedUsd));

    let lifecycleStage: OperatorMorBookingLifecycleStage;
    let nonCommissionableReason: NonCommissionableReason | null = null;
    let estimatedPendingCommissionUsd = 0;
    let invoiceableCommissionUsd = 0;

    if (isFullZeroFee) {
      lifecycleStage = "zero_fee_non_commissionable";
      nonCommissionableReason =
        currentClassification.nonCommissionableReason || "refunded";
      estimatedPendingCommissionUsd = 0;
      invoiceableCommissionUsd = 0;
    } else if (
      currentClassification.stage === "partial_refund" ||
      (effectiveRefundedUsd > 0 && hadPriorCompletedOrSettledState)
    ) {
      lifecycleStage = "partially_refunded_adjusted";
      invoiceableCommissionUsd = roundCents(netRetainedGrossUsd * rateFraction);
    } else if (currentClassification.stage === "settled_paid") {
      lifecycleStage = "settled_paid";
      invoiceableCommissionUsd = roundCents(netRetainedGrossUsd * rateFraction);
      if (cumulativePaidCommissionUsd <= 0) {
        cumulativePaidCommissionUsd = invoiceableCommissionUsd;
      }
    } else if (currentClassification.stage === "completed") {
      lifecycleStage = "completed_invoiceable";
      invoiceableCommissionUsd = roundCents(netRetainedGrossUsd * rateFraction);
    } else {
      lifecycleStage = "booked_pending_completion";
      estimatedPendingCommissionUsd = roundCents(
        netRetainedGrossUsd * rateFraction,
      );
      invoiceableCommissionUsd = 0;
    }

    const postCompletionReversalApplied =
      hadPriorCompletedOrSettledState &&
      (lifecycleStage === "zero_fee_non_commissionable" ||
        lifecycleStage === "partially_refunded_adjusted");

    const unpaidInvoiceableBalanceUsd = roundCents(
      Math.max(0, invoiceableCommissionUsd - cumulativePaidCommissionUsd),
    );
    const creditOrReversalDueToOperatorUsd = roundCents(
      Math.max(0, cumulativePaidCommissionUsd - invoiceableCommissionUsd),
    );

    positions.push({
      providerBookingRef: latest.providerBookingRef.trim(),
      operatorId: params.operatorId,
      operatorName: params.operatorName,
      providerAccountOrRefId,
      handoffId,
      clickId,
      productCode,
      serviceDate,
      distributionRoute,
      agreedCommissionRateBps,
      lifecycleStage,
      nonCommissionableReason,
      hadPriorCompletedOrSettledState,
      postCompletionReversalApplied,
      grossAmountUsd,
      refundedAmountUsd: roundCents(effectiveRefundedUsd),
      netRetainedGrossUsd,
      estimatedPendingCommissionUsd,
      invoiceableCommissionUsd,
      settledPaidCommissionUsd: cumulativePaidCommissionUsd,
      unpaidInvoiceableBalanceUsd,
      creditOrReversalDueToOperatorUsd,
      eventHistoryCount: auditHistory.length,
      auditHistory,
      lastUpdatedAt: latest.recordedAt,
    });
  }

  let bookedPendingCompletionCount = 0;
  let completedInvoiceableCount = 0;
  let partiallyRefundedAdjustedCount = 0;
  let settledPaidCount = 0;
  let zeroFeeNonCommissionableCount = 0;
  let postCompletionReversalCount = 0;
  let grossBookedPendingUsd = 0;
  let grossCompletedRetainedUsd = 0;
  let refundedTotalUsd = 0;
  let estimatedPendingCommissionUsd = 0;
  let totalEarnedInvoiceableCommissionUsd = 0;
  let settledPaidCommissionUsd = 0;
  let unpaidInvoiceableBalanceUsd = 0;
  let creditOrReversalDueToOperatorUsd = 0;

  for (const pos of positions) {
    if (pos.lifecycleStage === "booked_pending_completion") {
      bookedPendingCompletionCount += 1;
      grossBookedPendingUsd = roundCents(
        grossBookedPendingUsd + pos.grossAmountUsd,
      );
    } else if (pos.lifecycleStage === "completed_invoiceable") {
      completedInvoiceableCount += 1;
      grossCompletedRetainedUsd = roundCents(
        grossCompletedRetainedUsd + pos.netRetainedGrossUsd,
      );
    } else if (pos.lifecycleStage === "partially_refunded_adjusted") {
      partiallyRefundedAdjustedCount += 1;
      grossCompletedRetainedUsd = roundCents(
        grossCompletedRetainedUsd + pos.netRetainedGrossUsd,
      );
    } else if (pos.lifecycleStage === "settled_paid") {
      settledPaidCount += 1;
      grossCompletedRetainedUsd = roundCents(
        grossCompletedRetainedUsd + pos.netRetainedGrossUsd,
      );
    } else {
      zeroFeeNonCommissionableCount += 1;
    }

    if (pos.postCompletionReversalApplied) {
      postCompletionReversalCount += 1;
    }

    refundedTotalUsd = roundCents(refundedTotalUsd + pos.refundedAmountUsd);
    estimatedPendingCommissionUsd = roundCents(
      estimatedPendingCommissionUsd + pos.estimatedPendingCommissionUsd,
    );
    totalEarnedInvoiceableCommissionUsd = roundCents(
      totalEarnedInvoiceableCommissionUsd + pos.invoiceableCommissionUsd,
    );
    settledPaidCommissionUsd = roundCents(
      settledPaidCommissionUsd + pos.settledPaidCommissionUsd,
    );
    unpaidInvoiceableBalanceUsd = roundCents(
      unpaidInvoiceableBalanceUsd + pos.unpaidInvoiceableBalanceUsd,
    );
    creditOrReversalDueToOperatorUsd = roundCents(
      creditOrReversalDueToOperatorUsd + pos.creditOrReversalDueToOperatorUsd,
    );
  }

  return {
    operatorId: params.operatorId,
    operatorName: params.operatorName,
    merchantOfRecord: "operator",
    customerFundsCapturedByDcc: false,
    reconciliationMechanism:
      OPERATOR_MOR_RECONCILIATION_GOVERNANCE.reconciliationMechanism,
    automaticRealTimeOutcomeKnowledge:
      OPERATOR_MOR_RECONCILIATION_GOVERNANCE.automaticRealTimeOutcomeKnowledge,
    automaticInvoiceDispatchEnabled:
      OPERATOR_MOR_RECONCILIATION_GOVERNANCE.automaticInvoiceDispatchEnabled,
    autoOutreachDispatchEnabled:
      OPERATOR_MOR_RECONCILIATION_GOVERNANCE.autoOutreachDispatchEnabled,
    totalTrackedBookings: positions.length,
    bookedPendingCompletionCount,
    completedInvoiceableCount,
    partiallyRefundedAdjustedCount,
    settledPaidCount,
    zeroFeeNonCommissionableCount,
    postCompletionReversalCount,
    grossBookedPendingUsd,
    grossCompletedRetainedUsd,
    refundedTotalUsd,
    estimatedPendingCommissionUsd,
    totalEarnedInvoiceableCommissionUsd,
    settledPaidCommissionUsd,
    unpaidInvoiceableBalanceUsd,
    creditOrReversalDueToOperatorUsd,
    netBalanceDueToDccUsd: roundCents(
      unpaidInvoiceableBalanceUsd - creditOrReversalDueToOperatorUsd,
    ),
    positions,
  };
}
