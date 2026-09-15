import { getDb } from "@/lib/db/client";
import { octoSettlementLedger, octoAuditLogs } from "@/lib/db/schema";
import { OctoCommissionLedgerEntry } from "./types";
import { eq } from "drizzle-orm";

// Commission rate is negotiated per operator/supplier agreement and not globally fixed.
export const DCC_DEFAULT_COMMISSION_PERCENT: number | null = null;

export interface CreateSettlementRecordParams {
  bookingId: string;
  dccReference: string;
  supplierReference?: string;
  operatorSlug: string;
  operatorName: string;
  currency: string;
  grossAmount: number;
  commissionPercent?: number | null;
  paymentStatus?: "unpaid" | "authorized" | "captured" | "refunded" | "failed";
  settlementStatus?: "pending" | "settled" | "disputed" | "refunded";
  metadata?: Record<string, unknown>;
}

export class OctoSettlementEngine {
  /**
   * Calculate operator payout and DCC share based on agreed supplier commission rate.
   * If commission is undecided/unspecified (null/undefined), dccShare is 0 and status is flagged as pending negotiation.
   */
  static calculateShares(
    grossAmount: number,
    commissionPercent?: number | null
  ) {
    const rate = typeof commissionPercent === "number" ? commissionPercent : 0;
    const dccShareAmount = Math.round(grossAmount * (rate / 100) * 100) / 100;
    const operatorShareAmount = Math.round((grossAmount - dccShareAmount) * 100) / 100;

    return {
      dccSharePercent: rate,
      dccShareAmount,
      operatorShareAmount,
      isUndecided: commissionPercent == null,
    };
  }

  /**
   * Create an authorized financial settlement record in Neon
   */
  static async recordBookingSettlement(
    params: CreateSettlementRecordParams
  ): Promise<OctoCommissionLedgerEntry> {
    const commissionPercent = params.commissionPercent ?? DCC_DEFAULT_COMMISSION_PERCENT;
    const { dccShareAmount, operatorShareAmount } = this.calculateShares(
      params.grossAmount,
      commissionPercent
    );

    const ledgerId = `dcc:ledg:${params.dccReference.replace(/^dcc:bk:/, "")}`;
    const now = new Date().toISOString();

    const entry: OctoCommissionLedgerEntry = {
      id: ledgerId,
      bookingId: params.bookingId,
      dccReference: params.dccReference,
      supplierReference: params.supplierReference,
      operatorSlug: params.operatorSlug,
      operatorName: params.operatorName,
      currency: params.currency || "USD",
      grossAmount: params.grossAmount,
      dccSharePercent: commissionPercent ?? 0,
      dccShareAmount,
      operatorShareAmount,
      paymentStatus: params.paymentStatus || "captured",
      settlementStatus: params.settlementStatus || "pending",
      cancellationStatus: "none",
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
          paymentStatus: entry.paymentStatus,
          settlementStatus: entry.settlementStatus,
          cancellationStatus: entry.cancellationStatus,
          metadata: params.metadata || {},
        });

        await db.insert(octoAuditLogs).values({
          action: "SETTLEMENT_RECORDED",
          entityType: "LEDGER_ENTRY",
          entityId: entry.id,
          status: "SUCCESS",
          payload: {
            dccReference: entry.dccReference,
            gross: entry.grossAmount,
            dccShare: entry.dccShareAmount,
            operatorShare: entry.operatorShareAmount,
          },
        });
      } catch (err: any) {
        console.error("Failed to write settlement record to DB:", err.message);
      }
    }

    return entry;
  }

  /**
   * Update settlement on cancellation/refund
   */
  static async handleBookingCancellation(
    bookingId: string,
    refundType: "full" | "penalty" = "full"
  ) {
    const db = getDb();
    if (!db) return;

    const cancellationStatus =
      refundType === "full" ? "cancelled_full_refund" : "cancelled_penalty";
    const settlementStatus = refundType === "full" ? "refunded" : "disputed";

    await db
      .update(octoSettlementLedger)
      .set({
        cancellationStatus,
        settlementStatus,
        paymentStatus: refundType === "full" ? "refunded" : "captured",
        updatedAt: new Date(),
      })
      .where(eq(octoSettlementLedger.bookingId, bookingId));

    await db.insert(octoAuditLogs).values({
      action: "SETTLEMENT_CANCELLED",
      entityType: "BOOKING",
      entityId: bookingId,
      status: "SUCCESS",
      payload: { refundType, cancellationStatus },
    });
  }
}
