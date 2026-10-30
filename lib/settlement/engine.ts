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
import { DccPaymentService } from "@/lib/payments/paymentService";
import { eq, and, or } from "drizzle-orm";

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
    ...(typeof ev.orderId === "string" ? { orderId: ev.orderId.trim() } : {}),
    ...(typeof ev.bookingId === "string" ? { bookingId: ev.bookingId.trim() } : {}),
    ...(typeof ev.provenanceSource === "string"
      ? { provenanceSource: ev.provenanceSource as any }
      : {}),
    ...(typeof ev.providerRecordId === "string"
      ? { providerRecordId: ev.providerRecordId }
      : {}),
    ...(typeof ev.webhookEventId === "string" ? { webhookEventId: ev.webhookEventId } : {}),
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
    ...(typeof ev.orderId === "string" ? { orderId: ev.orderId.trim() } : {}),
    ...(typeof ev.bookingId === "string" ? { bookingId: ev.bookingId.trim() } : {}),
    ...(typeof ev.reason === "string" ? { reason: ev.reason } : {}),
    ...(typeof ev.provenanceSource === "string"
      ? { provenanceSource: ev.provenanceSource as any }
      : {}),
    ...(typeof ev.providerRecordId === "string"
      ? { providerRecordId: ev.providerRecordId }
      : {}),
    ...(typeof ev.webhookEventId === "string" ? { webhookEventId: ev.webhookEventId } : {}),
  };
}

function buildSettlementMetadata(
  entry: DccSettlementLedgerEntry,
  extra?: Record<string, unknown>
): Record<string, unknown> {
  return {
    ...(extra || {}),
    orderId: entry.orderId || null,
    orderItemId: entry.orderItemId || null,
    capturedAmount: entry.capturedAmount ?? 0,
    refundedAmount: entry.refundedAmount ?? 0,
    reserveHoldAmount: entry.reserveHoldAmount ?? 0,
    verifiedPaymentEvidence: entry.verifiedPaymentEvidence || null,
    verifiedRefundEvidence: entry.verifiedRefundEvidence || null,
    commissionEligibilityStatus: entry.commissionEligibilityStatus,
    refundStatus: entry.refundStatus,
    serviceCompleted: entry.serviceCompleted,
    serviceCompletionStatus: entry.serviceCompletionStatus,
    scheduledServiceDate: entry.scheduledServiceDate || null,
    completedAt: entry.completedAt || null,
    reconciledAt: entry.reconciledAt || null,
  };
}

function reconstructLedgerEntryFromRow(row: any): DccSettlementLedgerEntry {
  const meta =
    row.metadata && typeof row.metadata === "object"
      ? (row.metadata as Record<string, any>)
      : {};
  const paymentStatus = (row.paymentStatus || "unpaid") as DccSettlementLedgerEntry["paymentStatus"];
  const settlementStatus = (row.settlementStatus || "pending") as DccSettlementLedgerEntry["settlementStatus"];
  const cancellationStatus = (row.cancellationStatus || "none") as DccSettlementLedgerEntry["cancellationStatus"];
  const serviceCompleted = Boolean(meta.serviceCompleted);
  const serviceCompletionStatus =
    meta.serviceCompletionStatus || (serviceCompleted ? "completed" : "scheduled");
  const commissionEligibilityStatus =
    meta.commissionEligibilityStatus ||
    (cancellationStatus !== "none"
      ? "ineligible_cancelled"
      : paymentStatus === "captured" || paymentStatus === "partially_refunded"
      ? serviceCompleted
        ? "eligible"
        : "pending_service_completion"
      : "ineligible_unpaid");
  const refundStatus =
    meta.refundStatus ||
    (paymentStatus === "refunded"
      ? "full_refund"
      : paymentStatus === "partially_refunded"
      ? "partial_refund"
      : "none");

  return {
    id: row.id,
    bookingId: row.bookingId,
    orderId: meta.orderId || undefined,
    orderItemId: meta.orderItemId || undefined,
    dccReference: row.dccReference,
    supplierReference: row.supplierReference || undefined,
    operatorSlug: row.operatorSlug,
    operatorName: row.operatorName,
    currency: row.currency,
    grossAmount: Number(row.grossAmount),
    capturedAmount:
      typeof meta.capturedAmount === "number"
        ? meta.capturedAmount
        : paymentStatus === "captured"
        ? Number(row.grossAmount)
        : 0,
    refundedAmount: typeof meta.refundedAmount === "number" ? meta.refundedAmount : 0,
    dccSharePercent: Number(row.dccSharePercent ?? 0),
    dccShareAmount: Number(row.dccShareAmount),
    operatorShareAmount: Number(row.operatorShareAmount),
    reserveHoldAmount: typeof meta.reserveHoldAmount === "number" ? meta.reserveHoldAmount : 0,
    paymentStatus,
    verifiedPaymentEvidence: meta.verifiedPaymentEvidence || undefined,
    verifiedRefundEvidence: meta.verifiedRefundEvidence || undefined,
    settlementStatus,
    commissionEligibilityStatus,
    cancellationStatus,
    refundStatus,
    serviceCompleted,
    serviceCompletionStatus,
    scheduledServiceDate: meta.scheduledServiceDate || undefined,
    completedAt: meta.completedAt || undefined,
    reconciledAt: meta.reconciledAt || undefined,
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : String(row.createdAt || new Date().toISOString()),
  };
}

export class DccSettlementEngine {
  static setSimulatePersistenceFailureForTests(enabled: boolean): void {
    simulateSettlementPersistenceFailure = enabled;
  }

  static clearInMemoryStoresForProcessRestartSimulation(): void {
    fallbackSettlementStore.clear();
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
   * - paymentStatus is NEVER marked 'captured' without traceable verifiedPaymentEvidence.
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
      const structurallyValid = validateVerifiedPaymentEvidence(
        params.verifiedPaymentEvidence,
        params.grossAmount,
        currency
      );
      verifiedEvidence = await DccPaymentService.assertTraceablePaymentEvidence(
        structurallyValid,
        params.grossAmount,
        currency,
        {
          bookingId: params.bookingId,
          orderId: params.orderId,
          orderItemId: params.orderItemId,
          ledgerId: `dcc:ledg:${params.dccReference.replace(/^dcc:bk:/, "")}`,
        }
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
    const payableId = `op_pay_${ledgerId.replace("dcc:ledg:", "")}`;
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

    const metadataPayload = buildSettlementMetadata(entry, params.metadata);

    const db = getDb();
    if (db) {
      try {
        await db
          .insert(octoSettlementLedger)
          .values({
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
            metadata: metadataPayload,
          })
          .onConflictDoUpdate({
            target: octoSettlementLedger.id,
            set: {
              dccSharePercent: entry.dccSharePercent.toFixed(2),
              dccShareAmount: entry.dccShareAmount.toFixed(2),
              operatorShareAmount: entry.operatorShareAmount.toFixed(2),
              paymentStatus: entry.paymentStatus as any,
              settlementStatus: entry.settlementStatus as any,
              cancellationStatus: entry.cancellationStatus,
              metadata: metadataPayload,
              updatedAt: new Date(),
            },
          });

        await db
          .insert(dccOperatorPayables)
          .values({
            id: payableId,
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
            reserveAmount: (entry.reserveHoldAmount ?? 0).toFixed(2),
            settlementStatus: entry.settlementStatus,
            serviceDate: params.scheduledServiceDate
              ? params.scheduledServiceDate.slice(0, 10)
              : null,
            cancellationStatus: "none",
            metadata: metadataPayload,
          })
          .onConflictDoUpdate({
            target: dccOperatorPayables.id,
            set: {
              dccCommissionPercent: entry.dccSharePercent.toFixed(2),
              dccCommissionAmount: entry.dccShareAmount.toFixed(2),
              operatorPayableAmount: entry.operatorShareAmount.toFixed(2),
              reserveAmount: (entry.reserveHoldAmount ?? 0).toFixed(2),
              settlementStatus: entry.settlementStatus,
              cancellationStatus: entry.cancellationStatus,
              metadata: metadataPayload,
              updatedAt: new Date(),
            },
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
        throw new OctoApiError(
          503,
          "SETTLEMENT_PERSISTENCE_FAILED",
          `Database persistence failed on recordBookingSettlement(${entry.id}): ${err.message}`
        );
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
    if (simulateSettlementPersistenceFailure) {
      throw new OctoApiError(
        503,
        "SETTLEMENT_PERSISTENCE_FAILED",
        "Simulated settlement persistence failure"
      );
    }

    const identifier =
      typeof identifierOrParams === "string"
        ? identifierOrParams
        : identifierOrParams.bookingId || identifierOrParams.ledgerId || "";
    const evidence =
      typeof identifierOrParams === "string"
        ? evidenceArg!
        : identifierOrParams.verifiedPaymentEvidence;

    const entry = await this.getSettlementEntry(identifier);
    if (!entry) {
      throw new OctoApiError(
        404,
        "SETTLEMENT_NOT_FOUND",
        `Settlement entry for ${identifier} not found`
      );
    }

    const structurallyValid = validateVerifiedPaymentEvidence(
      evidence,
      entry.grossAmount,
      entry.currency
    );
    const validated = await DccPaymentService.assertTraceablePaymentEvidence(
      structurallyValid,
      entry.grossAmount,
      entry.currency,
      {
        bookingId: entry.bookingId,
        orderId: entry.orderId,
        orderItemId: entry.orderItemId,
        ledgerId: entry.id,
      }
    );
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
      if (entry.serviceCompletionStatus === "completed" || entry.serviceCompleted) {
        entry.commissionEligibilityStatus = "eligible";
        entry.settlementStatus = "ready_for_payout";
      } else {
        entry.commissionEligibilityStatus = "pending_service_completion";
        entry.settlementStatus = "pending";
      }
    }

    const metadataPayload = buildSettlementMetadata(entry);
    const db = getDb();
    if (db) {
      try {
        await db
          .update(octoSettlementLedger)
          .set({
            paymentStatus: entry.paymentStatus as any,
            dccShareAmount: entry.dccShareAmount.toFixed(2),
            operatorShareAmount: entry.operatorShareAmount.toFixed(2),
            settlementStatus: entry.settlementStatus as any,
            metadata: metadataPayload,
            updatedAt: new Date(),
          })
          .where(eq(octoSettlementLedger.id, entry.id));

        await db
          .update(dccOperatorPayables)
          .set({
            dccCommissionAmount: entry.dccShareAmount.toFixed(2),
            operatorPayableAmount: entry.operatorShareAmount.toFixed(2),
            reserveAmount: (entry.reserveHoldAmount ?? 0).toFixed(2),
            settlementStatus: entry.settlementStatus,
            metadata: metadataPayload,
            updatedAt: new Date(),
          })
          .where(eq(dccOperatorPayables.bookingId, entry.bookingId));

        await db.insert(octoAuditLogs).values({
          action: "SETTLEMENT_PAYMENT_CAPTURED",
          entityType: "LEDGER_ENTRY",
          entityId: entry.id,
          status: "SUCCESS",
          payload: {
            bookingId: entry.bookingId,
            capturedAmount: entry.capturedAmount,
            dccShareAmount: entry.dccShareAmount,
            operatorShareAmount: entry.operatorShareAmount,
            settlementStatus: entry.settlementStatus,
            commissionEligibilityStatus: entry.commissionEligibilityStatus,
            transactionId: validated.transactionId,
            provenanceSource: validated.provenanceSource,
          },
        });
      } catch (err: any) {
        throw new OctoApiError(
          503,
          "SETTLEMENT_PERSISTENCE_FAILED",
          `Database persistence failed on recordVerifiedPaymentCapture(${entry.id}): ${err.message}`
        );
      }
    }

    fallbackSettlementStore.set(entry.id, entry);
    fallbackSettlementStore.set(entry.bookingId, entry);
    if (entry.orderItemId) {
      fallbackSettlementStore.set(entry.orderItemId, entry);
    }

    return { ...entry };
  }

  /**
   * Mark service as fulfilled / completed.
   * INVARIANT (Requirement 1):
   * Database payables (`dccOperatorPayables`) and ledger rows (`octoSettlementLedger`) MUST remain
   * ineligible (`settlementStatus: 'awaiting_payment'`, `commissionEligibilityStatus: 'ineligible_unpaid'`)
   * until BOTH authenticated payment capture and service completion are established.
   * Never updates `ready_for_payout` unconditionally.
   */
  static async markServiceCompleted(
    identifier: string,
    completedAt?: string
  ): Promise<DccSettlementLedgerEntry | null> {
    if (simulateSettlementPersistenceFailure) {
      throw new OctoApiError(
        503,
        "SETTLEMENT_PERSISTENCE_FAILED",
        "Simulated settlement persistence failure"
      );
    }

    const entry = await this.getSettlementEntry(identifier);
    if (!entry) {
      return null;
    }

    if (entry.cancellationStatus !== "none") {
      throw new OctoApiError(
        409,
        "CANNOT_COMPLETE_CANCELLED_BOOKING",
        `Cannot mark cancelled booking ${identifier} as service completed`
      );
    }

    const now = completedAt || new Date().toISOString();
    entry.serviceCompleted = true;
    entry.serviceCompletionStatus = "completed";
    entry.completedAt = now;

    const hasAuthenticatedPaymentCapture =
      (entry.paymentStatus === "captured" || entry.paymentStatus === "partially_refunded") &&
      Boolean(entry.verifiedPaymentEvidence?.verified);

    if (hasAuthenticatedPaymentCapture) {
      if (entry.paymentStatus === "partially_refunded") {
        const baseAmount = entry.capturedAmount || entry.grossAmount;
        const netRetained = Math.max(0, baseAmount - (entry.refundedAmount || 0));
        const { dccShareAmount, operatorShareAmount } = this.calculateShares(
          netRetained,
          entry.dccSharePercent
        );
        entry.dccShareAmount = dccShareAmount;
        entry.operatorShareAmount = operatorShareAmount;
        entry.commissionEligibilityStatus = "adjusted_partial_refund";
      } else {
        entry.commissionEligibilityStatus = "eligible";
      }
      if (entry.settlementStatus === "pending" || entry.settlementStatus === "adjusted") {
        entry.settlementStatus = "ready_for_payout";
      }
    } else {
      entry.commissionEligibilityStatus = "ineligible_unpaid";
      entry.settlementStatus = "awaiting_payment";
    }

    const metadataPayload = buildSettlementMetadata(entry);
    const db = getDb();
    if (db) {
      try {
        await db
          .update(octoSettlementLedger)
          .set({
            dccShareAmount: entry.dccShareAmount.toFixed(2),
            operatorShareAmount: entry.operatorShareAmount.toFixed(2),
            settlementStatus: entry.settlementStatus as any,
            metadata: metadataPayload,
            updatedAt: new Date(),
          })
          .where(eq(octoSettlementLedger.id, entry.id));

        await db
          .update(dccOperatorPayables)
          .set({
            dccCommissionAmount: entry.dccShareAmount.toFixed(2),
            operatorPayableAmount: entry.operatorShareAmount.toFixed(2),
            settlementStatus: entry.settlementStatus,
            serviceCompletedAt: new Date(now),
            metadata: metadataPayload,
            updatedAt: new Date(),
          })
          .where(eq(dccOperatorPayables.bookingId, entry.bookingId));

        await db.insert(octoAuditLogs).values({
          action: hasAuthenticatedPaymentCapture
            ? "SERVICE_COMPLETED_PAYABLE_READY"
            : "SERVICE_COMPLETED_AWAITING_PAYMENT",
          entityType: "LEDGER_ENTRY",
          entityId: entry.id,
          status: "SUCCESS",
          payload: {
            completedAt: now,
            paymentStatus: entry.paymentStatus,
            settlementStatus: entry.settlementStatus,
            commissionEligibilityStatus: entry.commissionEligibilityStatus,
          },
        });
      } catch (err: any) {
        throw new OctoApiError(
          503,
          "SETTLEMENT_PERSISTENCE_FAILED",
          `Database update failed on markServiceCompleted(${entry.id}): ${err.message}`
        );
      }
    }

    fallbackSettlementStore.set(entry.id, entry);
    fallbackSettlementStore.set(entry.bookingId, entry);
    if (entry.orderItemId) {
      fallbackSettlementStore.set(entry.orderItemId, entry);
    }

    return { ...entry };
  }

  /**
   * Record cancellation or verified refund against a settlement entry.
   * INVARIANT:
   * 1. A cancellation does NOT automatically mean a full refund occurred.
   * 2. Retained money on a cancelled booking alone does NOT establish completed service!
   *    Unless service was completed (`entry.serviceCompleted === true` and not cancelled) OR an explicit
   *    cancellation-penalty commission policy was agreed (`params.allowCancellationPenaltyCommission === true`),
   *    DCC commission (`dccShareAmount`) on a cancelled or uncompleted booking is $0.00 and
   *    `commissionEligibilityStatus` is `'ineligible_cancelled'` (or `'pending_service_completion'` if active).
   */
  static async recordCancellationSettlement(params: {
    ledgerId: string;
    bookingId?: string;
    refundType: "full" | "partial" | "none" | "pending" | "unpaid";
    refundAmount?: number;
    verifiedRefundEvidence?: OctoVerifiedRefundEvidence;
    isBookingCancelled?: boolean;
    allowCancellationPenaltyCommission?: boolean;
    cancellationPenaltyCommissionPercent?: number;
  }): Promise<DccSettlementLedgerEntry | null> {
    if (simulateSettlementPersistenceFailure) {
      throw new OctoApiError(
        503,
        "SETTLEMENT_PERSISTENCE_FAILED",
        "Simulated settlement persistence failure"
      );
    }

    const entry =
      (await this.getSettlementEntry(params.ledgerId)) ||
      (params.bookingId ? await this.getSettlementEntry(params.bookingId) : null);

    if (!entry) {
      return null;
    }

    const isCancelled = params.isBookingCancelled !== false;
    const wasServiceCompletedBeforeRefund =
      Boolean(entry.serviceCompleted && entry.serviceCompletionStatus === "completed") &&
      !isCancelled;

    if (isCancelled) {
      entry.serviceCompleted = false;
      entry.serviceCompletionStatus = "cancelled_before_service";
    } else if (!entry.serviceCompleted) {
      entry.serviceCompletionStatus = "cancelled_before_service";
    }

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
      const retainedBase = Math.max(0, (entry.capturedAmount || 0) - (entry.refundedAmount || 0));
      if (params.allowCancellationPenaltyCommission === true && retainedBase > 0) {
        const penaltyRate =
          params.cancellationPenaltyCommissionPercent ?? entry.dccSharePercent;
        const shares = this.calculateShares(retainedBase, penaltyRate);
        entry.dccShareAmount = shares.dccShareAmount;
        entry.operatorShareAmount = shares.operatorShareAmount;
        entry.commissionEligibilityStatus = "adjusted_partial_refund";
      } else {
        entry.dccShareAmount = 0;
        entry.operatorShareAmount = retainedBase;
        entry.reserveHoldAmount = 0;
        entry.commissionEligibilityStatus = "ineligible_cancelled";
      }
    } else if (params.refundType === "pending") {
      entry.settlementStatus = "cancelled_pending_refund";
      entry.cancellationStatus = "cancelled_pending_refund";
      entry.refundStatus = "pending_refund";
      entry.commissionEligibilityStatus = "ineligible_cancelled";
      entry.dccShareAmount = 0;
      entry.operatorShareAmount = 0;
      entry.reserveHoldAmount = 0;
    } else if (params.refundType === "full") {
      const maxRefundable = entry.capturedAmount || entry.grossAmount;
      const previouslyRefunded = entry.refundedAmount || 0;
      const structurallyValid = validateVerifiedRefundEvidence(
        params.verifiedRefundEvidence,
        maxRefundable,
        entry.currency
      );
      const isSingleShotFull =
        Math.abs(structurallyValid.refundedAmount - maxRefundable) <= 0.01;
      const isCumulativeFull =
        previouslyRefunded > 0 &&
        Math.abs(previouslyRefunded + structurallyValid.refundedAmount - maxRefundable) <= 0.01;
      if (!isSingleShotFull && !isCumulativeFull) {
        throw new OctoApiError(
          422,
          "UNVERIFIED_REFUND_EVIDENCE",
          `Full refund evidence amount (${structurallyValid.refundedAmount}) does not match remaining capturedAmount (${maxRefundable - previouslyRefunded} of ${maxRefundable})`
        );
      }
      const tracedRefund = await DccPaymentService.assertTraceableRefundEvidence(
        structurallyValid,
        maxRefundable,
        entry.currency,
        {
          bookingId: entry.bookingId,
          orderId: entry.orderId,
          orderItemId: entry.orderItemId,
          ledgerId: entry.id,
        }
      );
      entry.verifiedRefundEvidence = { ...tracedRefund, refundType: "full" };
      entry.refundedAmount = maxRefundable;
      entry.paymentStatus = "refunded";
      entry.settlementStatus = "reversed";
      entry.cancellationStatus = "cancelled_full_refund";
      entry.refundStatus = "full_refund";
      entry.commissionEligibilityStatus = "reversed_on_refund";
      entry.operatorShareAmount = 0;
      entry.dccShareAmount = 0;
      entry.reserveHoldAmount = 0;
    } else if (params.refundType === "partial") {
      const maxRefundable = entry.capturedAmount || entry.grossAmount;
      const structurallyValid = validateVerifiedRefundEvidence(
        params.verifiedRefundEvidence,
        maxRefundable,
        entry.currency
      );
      const tracedRefund = await DccPaymentService.assertTraceableRefundEvidence(
        structurallyValid,
        maxRefundable,
        entry.currency,
        {
          bookingId: entry.bookingId,
          orderId: entry.orderId,
          orderItemId: entry.orderItemId,
          ledgerId: entry.id,
        }
      );
      entry.verifiedRefundEvidence = { ...tracedRefund, refundType: "partial" };
      entry.refundedAmount = tracedRefund.refundedAmount;
      entry.paymentStatus = "partially_refunded";
      entry.settlementStatus = "adjusted";
      entry.cancellationStatus = "cancelled_penalty";
      entry.refundStatus = "partial_refund";

      const baseAmount = entry.capturedAmount || entry.grossAmount;
      const netRetained = Math.max(
        0,
        Math.round((baseAmount - entry.refundedAmount) * 100) / 100
      );

      // Completed-booking commission rule:
      // Retained funds on a cancelled or uncompleted booking do NOT earn DCC commission unless
      // either service was actually completed or a cancellation-penalty commission policy was explicitly agreed.
      if (wasServiceCompletedBeforeRefund || params.allowCancellationPenaltyCommission === true) {
        const effectivePercent =
          params.allowCancellationPenaltyCommission &&
          params.cancellationPenaltyCommissionPercent !== undefined
            ? params.cancellationPenaltyCommissionPercent
            : entry.dccSharePercent;
        const { dccShareAmount, operatorShareAmount } = this.calculateShares(
          netRetained,
          effectivePercent
        );
        entry.dccShareAmount = dccShareAmount;
        entry.operatorShareAmount = operatorShareAmount;
        entry.commissionEligibilityStatus = "adjusted_partial_refund";
      } else {
        entry.dccShareAmount = 0;
        entry.operatorShareAmount = netRetained;
        entry.reserveHoldAmount = 0;
        entry.commissionEligibilityStatus = isCancelled
          ? "ineligible_cancelled"
          : "pending_service_completion";
      }
    }

    const metadataPayload = buildSettlementMetadata(entry);
    const db = getDb();
    if (db) {
      try {
        await db
          .update(octoSettlementLedger)
          .set({
            paymentStatus: entry.paymentStatus as any,
            dccShareAmount: entry.dccShareAmount.toFixed(2),
            operatorShareAmount: entry.operatorShareAmount.toFixed(2),
            settlementStatus: entry.settlementStatus as any,
            cancellationStatus: entry.cancellationStatus,
            metadata: metadataPayload,
            updatedAt: new Date(),
          })
          .where(eq(octoSettlementLedger.id, entry.id));

        await db
          .update(dccOperatorPayables)
          .set({
            dccCommissionAmount: entry.dccShareAmount.toFixed(2),
            operatorPayableAmount: entry.operatorShareAmount.toFixed(2),
            reserveAmount: (entry.reserveHoldAmount ?? 0).toFixed(2),
            settlementStatus: entry.settlementStatus,
            cancellationStatus: entry.cancellationStatus,
            metadata: metadataPayload,
            updatedAt: new Date(),
          })
          .where(eq(dccOperatorPayables.bookingId, entry.bookingId));

        await db.insert(octoAuditLogs).values({
          action: "SETTLEMENT_REFUND_RECORDED",
          entityType: "LEDGER_ENTRY",
          entityId: entry.id,
          status: "SUCCESS",
          payload: {
            refundType: params.refundType,
            refundAmount: entry.refundedAmount,
            paymentStatus: entry.paymentStatus,
            settlementStatus: entry.settlementStatus,
            cancellationStatus: entry.cancellationStatus,
            refundStatus: entry.refundStatus,
          },
        });
      } catch (err: any) {
        throw new OctoApiError(
          503,
          "SETTLEMENT_PERSISTENCE_FAILED",
          `Database update failed on recordCancellationSettlement(${entry.id}): ${err.message}`
        );
      }
    }

    fallbackSettlementStore.set(entry.id, entry);
    fallbackSettlementStore.set(entry.bookingId, entry);
    if (entry.orderItemId) {
      fallbackSettlementStore.set(entry.orderItemId, entry);
    }

    return { ...entry };
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
    const entry = params.bookingId
      ? await this.getSettlementEntry(params.bookingId)
      : null;
    if (entry) {
      entry.settlementStatus = "disputed";
      entry.operatorShareAmount = Math.max(0, entry.operatorShareAmount - params.chargebackAmount);
      fallbackSettlementStore.set(entry.id, entry);
      fallbackSettlementStore.set(entry.bookingId, entry);
    }

    const db = getDb();
    if (db && params.bookingId) {
      try {
        if (entry) {
          await db
            .update(octoSettlementLedger)
            .set({
              settlementStatus: "disputed" as any,
              operatorShareAmount: entry.operatorShareAmount.toFixed(2),
              metadata: buildSettlementMetadata(entry),
              updatedAt: new Date(),
            })
            .where(eq(octoSettlementLedger.id, entry.id));
        }
        await db
          .update(dccOperatorPayables)
          .set({
            settlementStatus: "disputed",
            ...(entry ? { operatorPayableAmount: entry.operatorShareAmount.toFixed(2) } : {}),
            updatedAt: new Date(),
          })
          .where(eq(dccOperatorPayables.bookingId, params.bookingId));
      } catch (err: any) {
        throw new OctoApiError(
          503,
          "SETTLEMENT_PERSISTENCE_FAILED",
          `Database update failed on adjustForChargeback(${params.bookingId}): ${err.message}`
        );
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

          if (r.settlementStatus !== "reversed" && r.settlementStatus !== "refunded") {
            totalGross += gross;
          }
          totalDccCommission += comm;
          totalReserveHeld += reserve;

          if (r.settlementStatus === "pending" || r.settlementStatus === "adjusted") {
            totalPendingPayable += payable;
          } else if (r.settlementStatus === "ready_for_payout") {
            totalReadyForPayout += payable;
          } else if (r.settlementStatus === "paid") {
            totalPaid += payable;
          }
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

      if (e.settlementStatus === "pending" || e.settlementStatus === "adjusted") {
        totalPendingPayable += e.operatorShareAmount;
      } else if (e.settlementStatus === "ready_for_payout") {
        totalReadyForPayout += e.operatorShareAmount;
      } else if (e.settlementStatus === "paid") {
        totalPaid += e.operatorShareAmount;
      }
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
   * Get settlement ledger entry by booking ID or ledger ID (queries database first).
   */
  static async getSettlementEntry(identifier: string): Promise<DccSettlementLedgerEntry | null> {
    const normalizedLedgerId = identifier.startsWith("dcc:ledg:")
      ? identifier
      : `dcc:ledg:${identifier.replace(/^dcc:bk:/, "")}`;

    const db = getDb();
    if (db) {
      const rows = await db
        .select()
        .from(octoSettlementLedger)
        .where(
          or(
            eq(octoSettlementLedger.id, identifier),
            eq(octoSettlementLedger.id, normalizedLedgerId),
            eq(octoSettlementLedger.bookingId, identifier)
          )
        );
      if (rows.length > 0) {
        const reconstructed = reconstructLedgerEntryFromRow(rows[0]);
        fallbackSettlementStore.set(reconstructed.id, reconstructed);
        fallbackSettlementStore.set(reconstructed.bookingId, reconstructed);
        return { ...reconstructed };
      }
    }

    const entry =
      fallbackSettlementStore.get(identifier) ||
      fallbackSettlementStore.get(normalizedLedgerId);
    return entry ? { ...entry } : null;
  }

  /**
   * Direct database lookup for `dcc_operator_payables` row by booking ID or payable ID.
   */
  static async getOperatorPayableRow(identifier: string): Promise<any | null> {
    const db = getDb();
    if (!db) return null;
    const rows = await db
      .select()
      .from(dccOperatorPayables)
      .where(
        or(
          eq(dccOperatorPayables.bookingId, identifier),
          eq(dccOperatorPayables.id, identifier),
          eq(dccOperatorPayables.orderItemId, identifier)
        )
      );
    const row = rows[0];
    if (!row) return null;
    return {
      ...row,
      grossAmount: Number(row.grossAmount ?? 0),
      dccCommissionPercent:
        row.dccCommissionPercent != null ? Number(row.dccCommissionPercent) : null,
      dccCommissionAmount: Number(row.dccCommissionAmount ?? 0),
      operatorPayableAmount: Number(row.operatorPayableAmount ?? 0),
      reserveAmount: Number(row.reserveAmount ?? 0),
      serviceCompleted: Boolean(row.serviceCompletedAt),
    };
  }

  static resetFallbackStoreForTests(): void {
    fallbackSettlementStore.clear();
  }
}

