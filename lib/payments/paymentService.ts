import crypto from "crypto";
import { getDb } from "@/lib/db/client";
import { dccOrderPayments, dccDisputesAndRefunds, octoAuditLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  DccPaymentResult,
  DccProcessPaymentParams,
  DccOrderPaymentRecord,
  DccRefundParams,
  DccRefundRecord,
  DccChargebackParams,
} from "./types";

const fallbackPaymentStore = new Map<string, DccOrderPaymentRecord>();
const fallbackRefundStore = new Map<string, DccRefundRecord>();

export class DccPaymentService {
  /**
   * Process or record payment for a master DCC order (one payment per master DCC Order)
   */
  static async processPayment(params: DccProcessPaymentParams): Promise<DccPaymentResult> {
    const paymentId = params.paymentInfo?.paymentId || `pay_${crypto.randomUUID().slice(0, 16)}`;
    const provider = params.paymentInfo?.provider || "octo_reseller";
    const status = params.paymentInfo?.status || "captured";
    const now = new Date().toISOString();

    const paymentRecord: DccOrderPaymentRecord = {
      id: paymentId,
      orderId: params.orderId,
      paymentProvider: provider,
      providerPaymentId: params.paymentInfo?.paymentIntentId || paymentId,
      amount: params.amount,
      currency: params.currency || "USD",
      status,
      rawMetadata: {
        customerEmail: params.customer?.emailAddress,
        customerName: params.customer?.fullName,
      },
      createdAt: now,
      updatedAt: now,
    };

    fallbackPaymentStore.set(params.orderId, paymentRecord);
    fallbackPaymentStore.set(paymentId, paymentRecord);

    const db = getDb();
    if (db) {
      try {
        await db.insert(dccOrderPayments).values({
          id: paymentRecord.id,
          orderId: paymentRecord.orderId,
          provider: paymentRecord.paymentProvider,
          amount: paymentRecord.amount.toFixed(2),
          currency: paymentRecord.currency,
          status: paymentRecord.status,
          customerEmail: params.customer?.emailAddress,
        });

        await db.insert(octoAuditLogs).values({
          action: "ORDER_PAYMENT_PROCESSED",
          entityType: "ORDER_PAYMENT",
          entityId: paymentRecord.id,
          status: "SUCCESS",
          payload: {
            orderId: paymentRecord.orderId,
            amount: paymentRecord.amount,
            status: paymentRecord.status,
            provider,
          },
        });
      } catch (err: any) {
        console.error("Database insert error on order payment:", err.message);
      }
    }

    return {
      success: status === "captured" || status === "authorized",
      paymentId,
      status,
      amount: params.amount,
      currency: params.currency || "USD",
      processedAt: now,
      provider,
    };
  }

  /**
   * Retrieve the primary payment record for an order
   */
  static async getPaymentByOrderId(orderId: string): Promise<DccOrderPaymentRecord | null> {
    const db = getDb();
    if (db) {
      try {
        const rows = await db
          .select()
          .from(dccOrderPayments)
          .where(eq(dccOrderPayments.orderId, orderId));
        if (rows.length > 0) {
          const r = rows[0];
          return {
            id: r.id,
            orderId: r.orderId,
            paymentProvider: r.provider,
            providerPaymentId: r.id,
            amount: Number(r.amount),
            currency: r.currency,
            status: r.status as any,
            rawMetadata: { customerEmail: r.customerEmail },
            createdAt: r.createdAt?.toISOString() || new Date().toISOString(),
            updatedAt: r.updatedAt?.toISOString() || new Date().toISOString(),
          };
        }
      } catch (err: any) {
        console.error("Database query error on getPaymentByOrderId:", err.message);
      }
    }

    return fallbackPaymentStore.get(orderId) || null;
  }

  /**
   * Process and record a refund (item-level or order-level)
   */
  static async processRefund(params: DccRefundParams): Promise<DccRefundRecord> {
    const refundId = `ref_${crypto.randomUUID().slice(0, 16)}`;
    const now = new Date().toISOString();

    const refundRecord: DccRefundRecord = {
      id: refundId,
      orderId: params.orderId,
      orderItemId: params.orderItemId,
      bookingId: params.bookingId,
      operatorSlug: params.operatorSlug,
      type: "refund",
      amount: params.amount,
      currency: params.currency || "USD",
      status: "processed",
      reason: params.reason || "Customer cancellation refund",
      settlementAdjusted: false,
      createdAt: now,
    };

    fallbackRefundStore.set(refundId, refundRecord);

    // Update payment record status in fallback store
    const payment = fallbackPaymentStore.get(params.orderId);
    if (payment) {
      payment.status = payment.amount <= params.amount ? "refunded" : "partially_refunded";
      payment.updatedAt = now;
    }

    const db = getDb();
    if (db) {
      try {
        await db.insert(dccDisputesAndRefunds).values({
          id: refundRecord.id,
          orderId: refundRecord.orderId,
          orderItemId: refundRecord.orderItemId || null,
          bookingId: refundRecord.bookingId || null,
          paymentId: payment?.id || "pay_unspecified",
          operatorSlug: refundRecord.operatorSlug,
          type: refundRecord.type,
          amount: refundRecord.amount.toFixed(2),
          currency: refundRecord.currency,
          status: refundRecord.status,
          reason: refundRecord.reason || null,
          settlementImpact: "reduced_pending",
        });

        if (payment) {
          await db
            .update(dccOrderPayments)
            .set({ status: payment.status, updatedAt: new Date() })
            .where(eq(dccOrderPayments.orderId, params.orderId));
        }

        await db.insert(octoAuditLogs).values({
          action: "REFUND_PROCESSED",
          entityType: "REFUND",
          entityId: refundRecord.id,
          status: "SUCCESS",
          payload: {
            orderId: params.orderId,
            orderItemId: params.orderItemId,
            amount: params.amount,
          },
        });
      } catch (err: any) {
        console.error("Database insert error on processRefund:", err.message);
      }
    }

    return refundRecord;
  }

  /**
   * Record a chargeback dispute against an order
   */
  static async recordChargeback(params: DccChargebackParams): Promise<DccRefundRecord> {
    const disputeId = `chg_${crypto.randomUUID().slice(0, 16)}`;
    const now = new Date().toISOString();

    const record: DccRefundRecord = {
      id: disputeId,
      orderId: params.orderId,
      operatorSlug: params.operatorSlug,
      type: "chargeback",
      amount: params.amount,
      currency: params.currency || "USD",
      status: "initiated",
      reason: params.reason || "Bank chargeback dispute",
      settlementAdjusted: false,
      createdAt: now,
    };

    fallbackRefundStore.set(disputeId, record);

    const payment = fallbackPaymentStore.get(params.orderId);
    if (payment) {
      payment.status = "chargeback";
      payment.updatedAt = now;
    }

    const db = getDb();
    if (db) {
      try {
        await db.insert(dccDisputesAndRefunds).values({
          id: record.id,
          orderId: record.orderId,
          paymentId: payment?.id || "pay_unspecified",
          operatorSlug: record.operatorSlug,
          type: record.type,
          amount: record.amount.toFixed(2),
          currency: record.currency,
          status: record.status,
          reason: record.reason || null,
          settlementImpact: "deducted_future_payout",
        });

        if (payment) {
          await db
            .update(dccOrderPayments)
            .set({ status: "chargeback", updatedAt: new Date() })
            .where(eq(dccOrderPayments.orderId, params.orderId));
        }
      } catch (err: any) {
        console.error("Database insert error on recordChargeback:", err.message);
      }
    }

    return record;
  }

  /**
   * List refunds and disputes for an order
   */
  static async getRefundsForOrder(orderId: string): Promise<DccRefundRecord[]> {
    const db = getDb();
    if (db) {
      try {
        const rows = await db
          .select()
          .from(dccDisputesAndRefunds)
          .where(eq(dccDisputesAndRefunds.orderId, orderId));
        if (rows.length > 0) {
          return rows.map((r) => ({
            id: r.id,
            orderId: r.orderId,
            orderItemId: r.orderItemId || undefined,
            bookingId: r.bookingId || undefined,
            operatorSlug: r.operatorSlug,
            type: r.type as any,
            amount: Number(r.amount),
            currency: r.currency,
            status: r.status as any,
            reason: r.reason || undefined,
            settlementAdjusted: Boolean(r.settlementImpact),
            createdAt: r.createdAt?.toISOString() || new Date().toISOString(),
          }));
        }
      } catch (err: any) {
        console.error("Database query error on getRefundsForOrder:", err.message);
      }
    }

    return Array.from(fallbackRefundStore.values()).filter((r) => r.orderId === orderId);
  }
}
