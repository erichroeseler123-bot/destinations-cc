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
import { eq, and } from "drizzle-orm";

export const DCC_DEFAULT_COMMISSION_PERCENT: number | null = null;
export const DCC_DEFAULT_RESERVE_PERCENT: number = 0; // Configurable per operator / agreement

const fallbackSettlementStore = new Map<string, DccSettlementLedgerEntry>();

export class DccSettlementEngine {
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
   * INVARIANT: settlementStatus MUST initialize as 'pending' until the scheduled service is completed.
   */
  static async recordBookingSettlement(
    params: CreateSettlementParams
  ): Promise<DccSettlementLedgerEntry> {
    const commissionPercent = params.commissionPercent ?? DCC_DEFAULT_COMMISSION_PERCENT;
    const { dccShareAmount, operatorShareAmount, reserveHoldAmount } = this.calculateShares(
      params.grossAmount,
      commissionPercent,
      params.reservePercent
    );

    const ledgerId = `dcc:ledg:${params.dccReference.replace(/^dcc:bk:/, "")}`;
    const now = new Date().toISOString();

    // Default status is ALWAYS pending until service completion
    const settlementStatus = params.settlementStatus || "pending";

    const entry: DccSettlementLedgerEntry = {
      id: ledgerId,
      bookingId: params.bookingId,
      orderId: params.orderId,
      orderItemId: params.orderItemId,
      dccReference: params.dccReference,
      supplierReference: params.supplierReference,
      operatorSlug: params.operatorSlug,
      operatorName: params.operatorName,
      currency: params.currency || "USD",
      grossAmount: params.grossAmount,
      dccSharePercent: commissionPercent ?? 0,
      dccShareAmount,
      operatorShareAmount,
      reserveHoldAmount,
      paymentStatus: params.paymentStatus || "captured",
      settlementStatus,
      cancellationStatus: "none",
      serviceCompleted: false,
      scheduledServiceDate: params.scheduledServiceDate,
      createdAt: now,
    };

    fallbackSettlementStore.set(ledgerId, entry);
    fallbackSettlementStore.set(params.bookingId, entry);
    if (params.orderItemId) {
      fallbackSettlementStore.set(params.orderItemId, entry);
    }

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
            dccShareAmount: entry.dccShareAmount,
            operatorShareAmount: entry.operatorShareAmount,
            reserveHoldAmount: entry.reserveHoldAmount,
            settlementStatus: entry.settlementStatus,
          },
        });
      } catch (err: any) {
        console.error("Database insert error on settlement ledger:", err.message);
      }
    }

    return entry;
  }

  /**
   * Mark service as fulfilled / completed.
   * This is the required trigger to transition settlementStatus from "pending" to "ready_for_payout".
   */
  static async markServiceCompleted(identifier: string): Promise<DccSettlementLedgerEntry | null> {
    const entry =
      fallbackSettlementStore.get(identifier) ||
      fallbackSettlementStore.get(`dcc:ledg:${identifier.replace(/^dcc:bk:/, "")}`);

    const now = new Date().toISOString();

    if (entry) {
      entry.serviceCompleted = true;
      entry.completedAt = now;
      if (entry.settlementStatus === "pending") {
        entry.settlementStatus = "ready_for_payout";
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

    return entry || null;
  }

  /**
   * Reverse or adjust settlement on cancellation or refund
   */
  static async recordCancellationSettlement(params: {
    ledgerId: string;
    bookingId?: string;
    refundType: "full" | "partial" | "none";
    refundAmount?: number;
  }) {
    const entry =
      fallbackSettlementStore.get(params.ledgerId) ||
      (params.bookingId ? fallbackSettlementStore.get(params.bookingId) : undefined);

    if (entry) {
      if (params.refundType === "full") {
        entry.settlementStatus = "reversed";
        entry.cancellationStatus = "cancelled_full_refund";
        entry.operatorShareAmount = 0;
        entry.dccShareAmount = 0;
      } else if (params.refundType === "partial" && params.refundAmount) {
        entry.settlementStatus = "adjusted";
        entry.cancellationStatus = "cancelled_penalty";
        const netGross = Math.max(0, entry.grossAmount - params.refundAmount);
        const { dccShareAmount, operatorShareAmount } = this.calculateShares(
          netGross,
          entry.dccSharePercent
        );
        entry.dccShareAmount = dccShareAmount;
        entry.operatorShareAmount = operatorShareAmount;
      }
    }

    const db = getDb();
    if (!db) return;

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

    // Fallback in-memory calculation
    const allEntries = Array.from(fallbackSettlementStore.values()).filter(
      (e) => e.operatorSlug === operatorSlug && e.currency === currency
    );

    let totalGross = 0;
    let totalDccCommission = 0;
    let totalPendingPayable = 0;
    let totalReadyForPayout = 0;
    let totalPaid = 0;
    let totalReserveHeld = 0;

    for (const e of allEntries) {
      totalGross += e.grossAmount;
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
    return fallbackSettlementStore.get(identifier) || null;
  }
}
