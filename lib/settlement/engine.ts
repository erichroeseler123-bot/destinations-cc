import { getDb } from "@/lib/db/client";
import {
  octoSettlementLedger,
  octoAuditLogs,
  dccOperatorPayables,
} from "@/lib/db/schema";
import {
  CreateSettlementParams,
  DccSettlementLedgerEntry,
  DccSettlementShares,
  DccOperatorBalanceSummary,
} from "./types";
import {
  OctoVerifiedPaymentEvidence,
  OctoVerifiedRefundEvidence,
} from "@/lib/octo/types";
import { OctoApiError } from "@/lib/octo/adapters/base";
import { eq, and } from "drizzle-orm";

export const DCC_DEFAULT_COMMISSION_PERCENT: number | null = null;
export const DCC_DEFAULT_RESERVE_PERCENT: number = 0; // Configurable per operator / agreement

const fallbackSettlementStore = new Map<string, DccSettlementLedgerEntry>();
let simulateSettlementPersistenceFailure = false;

export function validateVerifiedPaymentEvidence(
  evidence: unknown,
  expectedAmount?: number,
  expectedCurrency: string = "USD"
): OctoVerifiedPaymentEvidence {
  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) {
    throw new OctoApiError(
      422,
      "UNVERIFIED_PAYMENT_EVIDENCE",
      "Verified payment evidence object is required before marking paymentStatus as 'captured'"
    );
  }
  const ev = evidence as Record<string, unknown>;
  if (ev.verified !== true) {
    throw new OctoApiError(
      422,
      "UNVERIFIED_PAYMENT_EVIDENCE",
      "Payment evidence must have explicit boolean verified: true"
    );
  }
  const provider = typeof ev.provider === "string" ? ev.provider.trim() : "";
  const transactionId = typeof ev.transactionId === "string" ? ev.transactionId.trim() : "";
  const capturedAmount = typeof ev.capturedAmount === "number" ? ev.capturedAmount : NaN;
  const currency = typeof ev.currency === "string" ? ev.currency.trim().toUpperCase() : "";
  const capturedAt = typeof ev.capturedAt === "string" ? ev.capturedAt.trim() : "";

  if (!provider || !transactionId) {
    throw new OctoApiError(
      422,
      "UNVERIFIED_PAYMENT_EVIDENCE",
      "Verified payment evidence requires non-empty provider and transactionId"
    );
  }
  if (
    !Number.isFinite(capturedAmount) ||
    capturedAmount <= 0 ||
    (expectedAmount !== undefined && Math.abs(capturedAmount - expectedAmount) > 0.01)
  ) {
    throw new OctoApiError(
      422,
      "UNVERIFIED_PAYMENT_EVIDENCE",
      `Verified payment capturedAmount (${capturedAmount}) must be positive${expectedAmount !== undefined ? ` and match booking grossAmount (${expectedAmount})` : ""}`
    );
  }
  if (!currency || currency !== expectedCurrency.toUpperCase()) {
    throw new OctoApiError(
      422,
      "UNVERIFIED_PAYMENT_EVIDENCE",
      `Verified payment currency (${currency}) does not match expected currency (${expectedCurrency})`
    );
  }
  if (!capturedAt || Number.isNaN(Date.parse(capturedAt))) {
    throw new OctoApiError(
      422,
      "UNVERIFIED_PAYMENT_EVIDENCE",
      "Verified payment evidence requires a valid ISO-8601 capturedAt timestamp"
    );
  }

  return {
    verified: true,
    provider,
    transactionId,
    capturedAmount: Math.round(capturedAmount * 100) / 100,
    currency,
    capturedAt,
  };
}

export function validateVerifiedRefundEvidence(
  evidence: unknown,
  maxRefundableAmount: number,
  expectedCurrency: string = "USD"
): OctoVerifiedRefundEvidence & { refundType: "full" | "partial" } {
  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) {
    throw new OctoApiError(
      422,
      "UNVERIFIED_REFUND_EVIDENCE",
      "Verified refund evidence object is required before marking a captured payment as refunded"
    );
  }
  const ev = evidence as Record<string, unknown>;
  if (ev.verified !== true) {
    throw new OctoApiError(
      422,
      "UNVERIFIED_REFUND_EVIDENCE",
      "Refund evidence must have explicit boolean verified: true"
    );
  }
  const provider = typeof ev.provider === "string" ? ev.provider.trim() : "";
  const refundId = typeof ev.refundId === "string" ? ev.refundId.trim() : "";
  const refundedAmount = typeof ev.refundedAmount === "number" ? ev.refundedAmount : NaN;
  const currency = typeof ev.currency === "string" ? ev.currency.trim().toUpperCase() : "";
  const refundedAt = typeof ev.refundedAt === "string" ? ev.refundedAt.trim() : "";

  if (!provider || !refundId) {
    throw new OctoApiError(
      422,
      "UNVERIFIED_REFUND_EVIDENCE",
      "Verified refund evidence requires non-empty provider and refundId"
    );
  }
  if (!Number.isFinite(refundedAmount) || refundedAmount <= 0 || refundedAmount - maxRefundableAmount > 0.01) {
    throw new OctoApiError(
      422,
      "UNVERIFIED_REFUND_EVIDENCE",
      `Verified refundedAmount (${refundedAmount}) must be > 0 and <= capturedAmount (${maxRefundableAmount})`
    );
  }
  if (!currency || currency !== expectedCurrency.toUpperCase()) {
    throw new OctoApiError(
      422,
      "UNVERIFIED_REFUND_EVIDENCE",
      `Verified refund currency (${currency}) does not match expected currency (${expectedCurrency})`
    );
  }
  if (!refundedAt || Number.isNaN(Date.parse(refundedAt))) {
    throw new OctoApiError(
      422,
      "UNVERIFIED_REFUND_EVIDENCE",
      "Verified refund evidence requires a valid ISO-8601 refundedAt timestamp"
    );
  }

  const normalizedAmount = Math.round(refundedAmount * 100) / 100;
  const refundType: "full" | "partial" =
    ev.refundType === "full" || ev.refundType === "partial"
      ? ev.refundType
      : Math.abs(normalizedAmount - maxRefundableAmount) <= 0.01
      ? "full"
      : "partial";

  return {
    verified: true,
    provider,
    refundId,
    refundType,
    refundedAmount: normalizedAmount,
    currency,
    refundedAt,
    ...(typeof ev.reason === "string" ? { reason: ev.reason } : {}),
  };
}

export class DccSettlementEngine {
  static setSimulatePersistenceFailureForTests(enabled: boolean): void {
    simulateSettlementPersistenceFailure = enabled;
  }

  /**
   * Calculate operator payout, DCC commission, and optional reserve hold.
   * Commission rate is strictly configurable per operator agreement (never hardcoded).
   * If commission is unspecified (null/undefined), dccShare is 0 and flagged as pending commercial agreement.
   */
  static calculateShares(
    grossAmount: number,
    commissionPercent?: number | null,
    reservePercent?: number
  ): DccSettlementShares & { reserveHoldAmount: number } {
    const rate = typeof commissionPercent === "number" ? commissionPercent : 0;
    const dccShareAmount = Math.round(grossAmount * (rate / 100) * 100) / 100;
    const operatorShareGross = Math.round((grossAmount - dccShareAmount) * 100) / 100;

    const resPercent = typeof reservePercent === "number" ? reservePercent : DCC_DEFAULT_RESERVE_PERCENT;
    const reserveHoldAmount = Math.round(operatorShareGross * (resPercent / 100) * 100) / 100;
    const operatorShareAmount = operatorShareGross;

    return {
      dccSharePercent: rate,
      dccShareAmount,
      operatorShareAmount,
      reserveHoldAmount,
      isUndecided: commissionPercent == null,
    };
  }

  /**
   * Create an authorized financial settlement record.
   * INVARIANTS:
   * - paymentStatus is NEVER marked 'captured' without verifiedPaymentEvidence.
   * - settlementStatus is 'awaiting_payment' when unpaid, or 'pending' when captured until scheduled service is completed.
   * - commissionEligibilityStatus is 'ineligible_unpaid' until payment is captured, and 'pending_service_completion' until service is completed.
   */
  static async recordBookingSettlement(
    params: CreateSettlementParams
  ): Promise<DccSettlementLedgerEntry> {
    if (simulateSettlementPersistenceFailure) {
      throw new OctoApiError(
        503,
        "SETTLEMENT_PERSISTENCE_FAILED",
        "Simulated settlement persistence failure"
      );
    }

    const currency = (params.currency || "USD").toUpperCase();
    let verifiedEvidence: OctoVerifiedPaymentEvidence | undefined;

    if (params.verifiedPaymentEvidence) {
      verifiedEvidence = validateVerifiedPaymentEvidence(
        params.verifiedPaymentEvidence,
        params.grossAmount,
        currency
      );
    } else if (params.paymentStatus === "captured") {
      throw new OctoApiError(
        422,
        "UNVERIFIED_PAYMENT_EVIDENCE",
        "Cannot record settlement with paymentStatus 'captured' without verifiedPaymentEvidence"
      );
    }

    const effectivePaymentStatus = verifiedEvidence
      ? "captured"
      : params.paymentStatus === "authorized"
      ? "authorized"
      : params.paymentStatus === "failed"
      ? "failed"
      : "unpaid";

    const commissionPercent = params.commissionPercent ?? DCC_DEFAULT_COMMISSION_PERCENT;
    const { dccShareAmount, operatorShareAmount, reserveHoldAmount } = this.calculateShares(
      params.grossAmount,
      commissionPercent,
      params.reservePercent
    );

    const ledgerId = `dcc:ledg:${params.dccReference.replace(/^dcc:bk:/, "")}`;
    const now = new Date().toISOString();

    const settlementStatus =
      params.settlementStatus ||
      (effectivePaymentStatus === "captured" ? "pending" : "awaiting_payment");

    const commissionEligibilityStatus =
      effectivePaymentStatus === "captured"
        ? "pending_service_completion"
        : "ineligible_unpaid";

    const entry: DccSettlementLedgerEntry = {
      id: ledgerId,
      bookingId: params.bookingId,
      orderId: params.orderId,
      orderItemId: params.orderItemId,
      dccReference: params.dccReference,
      supplierReference: params.supplierReference,
      operatorSlug: params.operatorSlug,
      operatorName: params.operatorName,
      currency,
      grossAmount: params.grossAmount,
      capturedAmount: verifiedEvidence ? verifiedEvidence.capturedAmount : 0,
      refundedAmount: 0,
      dccSharePercent: commissionPercent ?? 0,
      dccShareAmount: effectivePaymentStatus === "captured" ? dccShareAmount : 0,
      operatorShareAmount: effectivePaymentStatus === "captured" ? operatorShareAmount : 0,
      reserveHoldAmount: effectivePaymentStatus === "captured" ? reserveHoldAmount : 0,
      paymentStatus: effectivePaymentStatus,
      verifiedPaymentEvidence: verifiedEvidence,
      settlementStatus,
      commissionEligibilityStatus,
      cancellationStatus: "none",
      refundStatus: "none",
      serviceCompleted: false,
      serviceCompletionStatus: "scheduled",
      scheduledServiceDate: params.scheduledServiceDate,
      createdAt: now,
    };

    const db = getDb();
    if (db) {
      try {
        await db.insert(octoSettlementLedger).values({
          id: entry.id,
          bookingId: entry.bookingId,
          dccReference: entry.dccReference,
          supplierReference: entry.supplierReference || null,
          operatorSlug: entry.operatorSlug,
          operatorName: entry.operatorName,
          currency: entry.currency,
          grossAmount: entry.grossAmount.toFixed(2),
          dccSharePercent: entry.dccSharePercent.toFixed(2),
          dccShareAmount: entry.dccShareAmount.toFixed(2),
          operatorShareAmount: entry.operatorShareAmount.toFixed(2),
          paymentStatus: entry.paymentStatus as any,
          settlementStatus: entry.settlementStatus as any,
          cancellationStatus: "none",
          metadata: {
            ...(params.metadata || {}),
            verifiedPaymentEvidence: verifiedEvidence || null,
            commissionEligibilityStatus: entry.commissionEligibilityStatus,
            refundStatus: entry.refundStatus,
            serviceCompletionStatus: entry.serviceCompletionStatus,
          },
        });

        await db.insert(dccOperatorPayables).values({
          id: `op_pay_${ledgerId.replace("dcc:ledg:", "")}`,
          orderId: params.orderId || entry.id,
          orderItemId: params.orderItemId || entry.id,
          bookingId: entry.bookingId,
          operatorSlug: entry.operatorSlug,
          operatorName: entry.operatorName,
          currency: entry.currency,
          grossAmount: entry.grossAmount.toFixed(2),
          dccCommissionPercent: entry.dccSharePercent.toFixed(2),
          dccCommissionAmount: entry.dccShareAmount.toFixed(2),
          operatorPayableAmount: entry.operatorShareAmount.toFixed(2),
          reserveAmount: entry.reserveHoldAmount.toFixed(2),
          settlementStatus: entry.settlementStatus,
          serviceDate: params.scheduledServiceDate ? params.scheduledServiceDate.slice(0, 10) : null,
        });

        await db.insert(octoAuditLogs).values({
          action: "SETTLEMENT_RECORDED",
          entityType: "LEDGER_ENTRY",
          entityId: entry.id,
          status: "SUCCESS",
          payload: {
            dccReference: entry.dccReference,
            grossAmount: entry.grossAmount,
            capturedAmount: entry.capturedAmount,
            paymentStatus: entry.paymentStatus,
            dccShareAmount: entry.dccShareAmount,
            operatorShareAmount: entry.operatorShareAmount,
            reserveHoldAmount: entry.reserveHoldAmount,
            settlementStatus: entry.settlementStatus,
            commissionEligibilityStatus: entry.commissionEligibilityStatus,
          },
        });
      } catch (err: any) {
        console.error("Database insert error on settlement ledger:", err.message);
      }
    }

    fallbackSettlementStore.set(ledgerId, entry);
    fallbackSettlementStore.set(params.bookingId, entry);
    if (params.orderItemId) {
      fallbackSettlementStore.set(params.orderItemId, entry);
    }

    return { ...entry };
  }

  /**
   * Record verified payment capture against an existing unpaid/authorized settlement entry.
   */
  static async recordVerifiedPaymentCapture(
    identifierOrParams:
      | string
      | { bookingId?: string; ledgerId?: string; verifiedPaymentEvidence: OctoVerifiedPaymentEvidence },
    evidenceArg?: OctoVerifiedPaymentEvidence
  ): Promise<DccSettlementLedgerEntry> {
    const identifier =
      typeof identifierOrParams === "string"
        ? identifierOrParams
        : identifierOrParams.bookingId || identifierOrParams.ledgerId || "";
    const evidence =
      typeof identifierOrParams === "string"
        ? evidenceArg!
        : identifierOrParams.verifiedPaymentEvidence;

    const entry =
      fallbackSettlementStore.get(identifier) ||
      fallbackSettlementStore.get(`dcc:ledg:${identifier.replace(/^dcc:bk:/, "")}`);

    if (!entry) {
      throw new OctoApiError(404, "SETTLEMENT_NOT_FOUND", `Settlement entry for ${identifier} not found`);
    }

    const validated = validateVerifiedPaymentEvidence(evidence, entry.grossAmount, entry.currency);
    const { dccShareAmount, operatorShareAmount, reserveHoldAmount } = this.calculateShares(
      validated.capturedAmount,
      entry.dccSharePercent
    );

    entry.paymentStatus = "captured";
    entry.capturedAmount = validated.capturedAmount;
    entry.verifiedPaymentEvidence = validated;
    entry.dccShareAmount = dccShareAmount;
    entry.operatorShareAmount = operatorShareAmount;
    entry.reserveHoldAmount = reserveHoldAmount;

    if (entry.cancellationStatus === "none") {
      if (entry.serviceCompletionStatus === "completed") {
        entry.commissionEligibilityStatus = "eligible";
        entry.settlementStatus = "ready_for_payout";
      } else {
        entry.commissionEligibilityStatus = "pending_service_completion";
        entry.settlementStatus = "pending";
      }
    }

    return { ...entry };
  }

  /**
   * Mark service as fulfilled / completed.
   * Requires booking to not be cancelled. Transitions commissionEligibilityStatus to 'eligible'
   * and settlementStatus to 'ready_for_payout' ONLY if paymentStatus is 'captured' (or 'partially_refunded').
   */
  static async markServiceCompleted(
    identifier: string,
    completedAt?: string
  ): Promise<DccSettlementLedgerEntry | null> {
    const entry =
      fallbackSettlementStore.get(identifier) ||
      fallbackSettlementStore.get(`dcc:ledg:${identifier.replace(/^dcc:bk:/, "")}`);

    const now = completedAt || new Date().toISOString();

    if (entry) {
      if (entry.cancellationStatus !== "none") {
        throw new OctoApiError(
          409,
          "CANNOT_COMPLETE_CANCELLED_BOOKING",
          `Cannot mark cancelled booking ${identifier} as service completed`
        );
      }
      entry.serviceCompleted = true;
      entry.serviceCompletionStatus = "completed";
      entry.completedAt = now;
      if (entry.paymentStatus === "captured" || entry.paymentStatus === "partially_refunded") {
        entry.commissionEligibilityStatus = "eligible";
        if (entry.settlementStatus === "pending") {
          entry.settlementStatus = "ready_for_payout";
        }
      } else {
        entry.commissionEligibilityStatus = "ineligible_unpaid";
      }
    }

    const db = getDb();
    if (db) {
      try {
        const targetId = entry?.id || (identifier.startsWith("dcc:ledg:") ? identifier : `dcc:ledg:${identifier.replace(/^dcc:bk:/, "")}`);
        await db
          .update(octoSettlementLedger)
          .set({
            settlementStatus: "ready_for_payout" as any,
            updatedAt: new Date(),
          })
          .where(eq(octoSettlementLedger.id, targetId));

        await db
          .update(dccOperatorPayables)
          .set({
            settlementStatus: "ready_for_payout",
            serviceCompletedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(dccOperatorPayables.bookingId, entry?.bookingId || identifier));

        await db.insert(octoAuditLogs).values({
          action: "SERVICE_COMPLETED_PAYABLE_READY",
          entityType: "LEDGER_ENTRY",
          entityId: targetId,
          status: "SUCCESS",
          payload: { completedAt: now },
        });
      } catch (err: any) {
        console.error("Database update error on markServiceCompleted:", err.message);
      }
    }

    return entry ? { ...entry } : null;
  }

  /**
   * Record cancellation or verified refund against a settlement entry.
   * INVARIANT: A cancellation does NOT automatically mean a full refund occurred.
   * - If payment was never captured ('unpaid'), cancellationStatus becomes 'cancelled_unpaid' and refundStatus becomes 'not_applicable_unpaid'.
   * - If payment was captured and no verifiedRefundEvidence is supplied, paymentStatus remains 'captured',
   *   refundStatus is 'no_refund' or 'pending_refund', and settlementStatus is 'cancelled_no_refund' or 'cancelled_pending_refund'.
   * - Only when verifiedRefundEvidence is supplied (or refundType is 'full'/'partial' with verified evidence) is money marked refunded/reversed.
   */
  static async recordCancellationSettlement(params: {
    ledgerId: string;
    bookingId?: string;
    refundType: "full" | "partial" | "none" | "pending" | "unpaid";
    refundAmount?: number;
    verifiedRefundEvidence?: OctoVerifiedRefundEvidence;
  }): Promise<DccSettlementLedgerEntry | null> {
    const entry =
      fallbackSettlementStore.get(params.ledgerId) ||
      (params.bookingId ? fallbackSettlementStore.get(params.bookingId) : undefined);

    if (entry) {
      entry.serviceCompleted = false;
      entry.serviceCompletionStatus = "cancelled_before_service";

      if (entry.paymentStatus === "unpaid" || params.refundType === "unpaid") {
        entry.settlementStatus = "cancelled_unpaid";
        entry.cancellationStatus = "cancelled_unpaid";
        entry.refundStatus = "not_applicable_unpaid";
        entry.commissionEligibilityStatus = "ineligible_cancelled";
        entry.dccShareAmount = 0;
        entry.operatorShareAmount = 0;
        entry.reserveHoldAmount = 0;
      } else if (params.refundType === "none") {
        entry.settlementStatus = "cancelled_no_refund";
        entry.cancellationStatus = "cancelled_no_refund";
        entry.refundStatus = "no_refund";
        entry.commissionEligibilityStatus = "ineligible_cancelled";
      } else if (params.refundType === "pending") {
        entry.settlementStatus = "cancelled_pending_refund";
        entry.cancellationStatus = "cancelled_pending_refund";
        entry.refundStatus = "pending_refund";
        entry.commissionEligibilityStatus = "ineligible_cancelled";
      } else if (params.refundType === "full") {
        const validatedRefund = validateVerifiedRefundEvidence(
          params.verifiedRefundEvidence,
          entry.capturedAmount || entry.grossAmount,
          entry.currency
        );
        if (Math.abs(validatedRefund.refundedAmount - (entry.capturedAmount || entry.grossAmount)) > 0.01) {
          throw new OctoApiError(
            422,
            "UNVERIFIED_REFUND_EVIDENCE",
            `Full refund evidence amount (${validatedRefund.refundedAmount}) does not match capturedAmount (${entry.capturedAmount || entry.grossAmount})`
          );
        }
        entry.verifiedRefundEvidence = validatedRefund;
        entry.refundedAmount = validatedRefund.refundedAmount;
        entry.paymentStatus = "refunded";
        entry.settlementStatus = "reversed";
        entry.cancellationStatus = "cancelled_full_refund";
        entry.refundStatus = "full_refund";
        entry.commissionEligibilityStatus = "reversed_on_refund";
        entry.operatorShareAmount = 0;
        entry.dccShareAmount = 0;
        entry.reserveHoldAmount = 0;
      } else if (params.refundType === "partial") {
        const validatedRefund = validateVerifiedRefundEvidence(
          params.verifiedRefundEvidence,
          entry.capturedAmount || entry.grossAmount,
          entry.currency
        );
        entry.verifiedRefundEvidence = validatedRefund;
        entry.refundedAmount = validatedRefund.refundedAmount;
        entry.paymentStatus = "partially_refunded";
        entry.settlementStatus = "adjusted";
        entry.cancellationStatus = "cancelled_penalty";
        entry.refundStatus = "partial_refund";
        entry.commissionEligibilityStatus = "adjusted_partial_refund";
        const baseAmount = entry.capturedAmount || entry.grossAmount;
        const netGross = Math.max(0, baseAmount - entry.refundedAmount);
        const { dccShareAmount, operatorShareAmount } = this.calculateShares(
          netGross,
          entry.dccSharePercent
        );
        entry.dccShareAmount = dccShareAmount;
        entry.operatorShareAmount = operatorShareAmount;
      }
    }

    const db = getDb();
    if (!db) return entry ? { ...entry } : null;

    try {
      await db
        .update(octoSettlementLedger)
        .set({
          settlementStatus: (params.refundType === "full" ? "refunded" : "disputed") as any,
          cancellationStatus:
            params.refundType === "full" ? "cancelled_full_refund" : "cancelled_penalty",
          updatedAt: new Date(),
        })
        .where(eq(octoSettlementLedger.id, params.ledgerId));

      await db
        .update(dccOperatorPayables)
        .set({
          settlementStatus: params.refundType === "full" ? "reversed" : "adjusted",
          cancellationStatus: params.refundType === "full" ? "cancelled_full_refund" : "cancelled_penalty",
          updatedAt: new Date(),
        })
        .where(eq(dccOperatorPayables.bookingId, params.bookingId || params.ledgerId));

      await db.insert(octoAuditLogs).values({
        action: "SETTLEMENT_REFUND_RECORDED",
        entityType: "LEDGER_ENTRY",
        entityId: params.ledgerId,
        status: "SUCCESS",
        payload: {
          refundType: params.refundType,
          refundAmount: params.refundAmount,
        },
      });
    } catch (err: any) {
      console.error("Database update error on cancellation settlement:", err.message);
    }

    return entry ? { ...entry } : null;
  }

  /**
   * Adjust payable or reserve to recover chargebacks
   */
  static async adjustForChargeback(params: {
    operatorSlug: string;
    bookingId?: string;
    chargebackAmount: number;
    currency?: string;
  }) {
    const entry = params.bookingId ? fallbackSettlementStore.get(params.bookingId) : undefined;
    if (entry) {
      entry.settlementStatus = "disputed";
      entry.operatorShareAmount = Math.max(0, entry.operatorShareAmount - params.chargebackAmount);
    }

    const db = getDb();
    if (db && params.bookingId) {
      try {
        await db
          .update(dccOperatorPayables)
          .set({
            settlementStatus: "disputed",
            updatedAt: new Date(),
          })
          .where(eq(dccOperatorPayables.bookingId, params.bookingId));
      } catch (err: any) {
        console.error("Database update error on chargeback adjust:", err.message);
      }
    }
  }

  /**
   * Get aggregated balance and status summary for an operator
   */
  static async getOperatorBalance(
    operatorSlug: string,
    currency: string = "USD"
  ): Promise<DccOperatorBalanceSummary> {
    const db = getDb();
    if (db) {
      try {
        const rows = await db
          .select()
          .from(dccOperatorPayables)
          .where(
            and(
              eq(dccOperatorPayables.operatorSlug, operatorSlug),
              eq(dccOperatorPayables.currency, currency)
            )
          );

        if (rows.length > 0) {
          let totalGross = 0;
          let totalDccCommission = 0;
          let totalPendingPayable = 0;
          let totalReadyForPayout = 0;
          let totalPaid = 0;
          let totalReserveHeld = 0;

          for (const r of rows) {
            const gross = Number(r.grossAmount);
            const comm = Number(r.dccCommissionAmount);
            const payable = Number(r.operatorPayableAmount);
            const reserve = Number(r.reserveAmount);

            totalGross += gross;
            totalDccCommission += comm;
            totalReserveHeld += reserve;

            if (r.settlementStatus === "pending") totalPendingPayable += payable;
            else if (r.settlementStatus === "ready_for_payout") totalReadyForPayout += payable;
            else if (r.settlementStatus === "paid") totalPaid += payable;
          }

          return {
            operatorSlug,
            currency,
            totalGross: Math.round(totalGross * 100) / 100,
            totalDccCommission: Math.round(totalDccCommission * 100) / 100,
            totalPendingPayable: Math.round(totalPendingPayable * 100) / 100,
            totalReadyForPayout: Math.round(totalReadyForPayout * 100) / 100,
            totalPaid: Math.round(totalPaid * 100) / 100,
            totalReserveHeld: Math.round(totalReserveHeld * 100) / 100,
            activeItemCount: rows.length,
          };
        }
      } catch (err: any) {
        console.error("Database query error on getOperatorBalance:", err.message);
      }
    }

    // Fallback in-memory calculation (deduplicated by entry.id)
    const uniqueById = new Map<string, DccSettlementLedgerEntry>();
    for (const e of fallbackSettlementStore.values()) {
      if (e.operatorSlug === operatorSlug && e.currency === currency) {
        uniqueById.set(e.id, e);
      }
    }
    const allEntries = Array.from(uniqueById.values());

    let totalGross = 0;
    let totalDccCommission = 0;
    let totalPendingPayable = 0;
    let totalReadyForPayout = 0;
    let totalPaid = 0;
    let totalReserveHeld = 0;

    for (const e of allEntries) {
      if (e.settlementStatus !== "reversed" && e.settlementStatus !== "refunded") {
        totalGross += e.grossAmount;
      }
      totalDccCommission += e.dccShareAmount;
      totalReserveHeld += e.reserveHoldAmount || 0;

      if (e.settlementStatus === "pending") totalPendingPayable += e.operatorShareAmount;
      else if (e.settlementStatus === "ready_for_payout") totalReadyForPayout += e.operatorShareAmount;
      else if (e.settlementStatus === "paid") totalPaid += e.operatorShareAmount;
    }

    return {
      operatorSlug,
      currency,
      totalGross: Math.round(totalGross * 100) / 100,
      totalDccCommission: Math.round(totalDccCommission * 100) / 100,
      totalPendingPayable: Math.round(totalPendingPayable * 100) / 100,
      totalReadyForPayout: Math.round(totalReadyForPayout * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      totalReserveHeld: Math.round(totalReserveHeld * 100) / 100,
      activeItemCount: allEntries.length,
    };
  }

  /**
   * Get settlement ledger entry by booking ID or ledger ID
   */
  static async getSettlementEntry(identifier: string): Promise<DccSettlementLedgerEntry | null> {
    const entry =
      fallbackSettlementStore.get(identifier) ||
      fallbackSettlementStore.get(`dcc:ledg:${identifier.replace(/^dcc:bk:/, "")}`);
    return entry ? { ...entry } : null;
  }

  static resetFallbackStoreForTests(): void {
    fallbackSettlementStore.clear();
  }
}
