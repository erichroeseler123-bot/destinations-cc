import { getDb } from "@/lib/db/client";
import { octoSettlementLedger, octoAuditLogs } from "@/lib/db/schema";
import { CreateSettlementParams, DccSettlementLedgerEntry, DccSettlementShares } from "./types";
import { eq } from "drizzle-orm";

export const DCC_DEFAULT_COMMISSION_PERCENT: number | null = null;

export class DccSettlementEngine {
  /**
   * Calculate operator payout and DCC share based on agreed supplier commission rate.
   * If commission is undecided/unspecified (null/undefined), dccShare is 0 and status is flagged as pending negotiation.
   */
  static calculateShares(
    grossAmount: number,
    commissionPercent?: number | null
  ): DccSettlementShares {
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
    params: CreateSettlementParams
  ): Promise<DccSettlementLedgerEntry> {
    const commissionPercent = params.commissionPercent ?? DCC_DEFAULT_COMMISSION_PERCENT;
    const { dccShareAmount, operatorShareAmount } = this.calculateShares(
      params.grossAmount,
      commissionPercent
    );

    const ledgerId = `dcc:ledg:${params.dccReference.replace(/^dcc:bk:/, "")}`;
    const now = new Date().toISOString();

    const entry: DccSettlementLedgerEntry = {
      id: ledgerId,
      bookingId: params.bookingId,
      orderId: params.orderId,
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
            grossAmount: entry.grossAmount,
            dccShareAmount: entry.dccShareAmount,
            operatorShareAmount: entry.operatorShareAmount,
          },
        });
      } catch (err: any) {
        console.error("Database insert error on settlement ledger:", err.message);
      }
    }

    return entry;
  }

  /**
   * Reverse or adjust settlement on cancellation
   */
  static async recordCancellationSettlement(params: {
    ledgerId: string;
    refundType: "full" | "partial" | "none";
    refundAmount?: number;
  }) {
    const db = getDb();
    if (!db) return;

    try {
      await db
        .update(octoSettlementLedger)
        .set({
          settlementStatus: "refunded",
          cancellationStatus:
            params.refundType === "full" ? "cancelled_full_refund" : "cancelled_penalty",
          updatedAt: new Date(),
        })
        .where(eq(octoSettlementLedger.id, params.ledgerId));

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
  }
}
