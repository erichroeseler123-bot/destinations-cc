import crypto from "crypto";
import { getDb } from "@/lib/db/client";
import {
  dccOrderPayments,
  dccDisputesAndRefunds,
  dccSquareWebhookEvents,
  octoAuditLogs,
} from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";
import { SquareClient, SquareEnvironment } from "square";
import {
  getSquareAccessToken,
  getSquareEnvironment,
  getSquareLocationIdDcc,
  assertValidDccSquareProductionConfig,
  isSquareProduction,
} from "@/lib/squareConfig";
import {
  OctoVerifiedPaymentEvidence,
  OctoVerifiedRefundEvidence,
  PaymentEvidenceProvenanceSource,
} from "@/lib/octo/types";
import { OctoApiError } from "@/lib/octo/adapters/base";
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

function isExplicitPaymentTestSimulation(options?: {
  allowTestSimulation?: boolean;
  simulateCapture?: boolean;
}): boolean {
  return Boolean(
    options?.allowTestSimulation ||
      options?.simulateCapture ||
      process.env.DCC_PAYMENT_SIMULATION_MODE === "explicit_test"
  );
}

function encodePaymentProvenanceMeta(meta: {
  method?: string;
  provenanceSource: PaymentEvidenceProvenanceSource;
  providerPaymentId?: string;
  webhookEventId?: string;
}): string {
  return JSON.stringify(meta);
}

function decodePaymentProvenanceMeta(raw: string | null | undefined): {
  method?: string;
  provenanceSource?: PaymentEvidenceProvenanceSource;
  providerPaymentId?: string;
  webhookEventId?: string;
} {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  } catch {}
  return { method: raw };
}

function encodeRefundReasonMeta(meta: {
  reason: string;
  provenanceSource: PaymentEvidenceProvenanceSource;
  webhookEventId?: string;
}): string {
  return JSON.stringify(meta);
}

function decodeRefundReasonMeta(raw: string | null | undefined): {
  reason?: string;
  provenanceSource?: PaymentEvidenceProvenanceSource;
  webhookEventId?: string;
} {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "provenanceSource" in parsed) {
      return parsed;
    }
  } catch {}
  return { reason: raw };
}

export class DccPaymentService {
  static clearInMemoryStoresForProcessRestartSimulation(): void {
    fallbackPaymentStore.clear();
    fallbackRefundStore.clear();
  }

  /**
   * Process or record payment for a master DCC order (one payment per master DCC Order).
   * Outside explicit test simulation (`options.allowTestSimulation` / `DCC_PAYMENT_SIMULATION_MODE=explicit_test`),
   * requires a valid `sourceId`, valid provider configuration (`SQUARE_ACCESS_TOKEN` & `SQUARE_LOCATION_ID_DCC`),
   * and an authoritative provider response (never falling back to a generated `sq_pay_...` ID).
   */
  static async processPayment(params: DccProcessPaymentParams): Promise<DccPaymentResult> {
    const requestedStatus = params.paymentInfo?.status || "captured";
    const explicitSim = isExplicitPaymentTestSimulation(params.options);

    // 1. Idempotency / Two-phase capture check:
    const existingPayment = await this.getPaymentByOrderId(params.orderId);
    if (existingPayment) {
      if (
        existingPayment.status === "captured" ||
        (existingPayment.status === "authorized" && requestedStatus === "authorized")
      ) {
        return {
          success: true,
          paymentId: existingPayment.id,
          status: existingPayment.status,
          amount: existingPayment.amount,
          currency: existingPayment.currency,
          processedAt: existingPayment.updatedAt,
          provider: existingPayment.paymentProvider,
          provenanceSource: existingPayment.provenanceSource,
          webhookEventId: existingPayment.webhookEventId,
        };
      }

      // Two-phase transition from "authorized" -> "captured"
      if (existingPayment.status === "authorized" && requestedStatus === "captured") {
        if (params.options?.simulateFailure) {
          throw new Error("Square payment failed: Simulated payment gateway decline");
        }
        const token = getSquareAccessToken();
        if (!explicitSim && !params.options?.squareClient && !token) {
          throw new OctoApiError(
            503,
            "MISSING_PAYMENT_PROVIDER_CONFIG",
            "Missing SQUARE_ACCESS_TOKEN required to capture authorized payment outside explicit test simulation"
          );
        }
        if (
          (params.options?.squareClient || token) &&
          existingPayment.providerPaymentId &&
          !existingPayment.providerPaymentId.startsWith("sq_pay_")
        ) {
          try {
            const client =
              params.options?.squareClient ||
              new SquareClient({
                token,
                environment:
                  getSquareEnvironment() === "production"
                    ? SquareEnvironment.Production
                    : SquareEnvironment.Sandbox,
              });
            if (typeof client.payments?.complete === "function") {
              await client.payments.complete({ paymentId: existingPayment.providerPaymentId });
            }
          } catch (err: any) {
            if (!explicitSim) {
              throw new OctoApiError(
                502,
                "PAYMENT_PROVIDER_ERROR",
                `Square payment completion failed: ${err.message}`
              );
            }
          }
        }
        await this.updatePaymentStatus(params.orderId, "captured");
        const updated = (await this.getPaymentByOrderId(params.orderId)) || existingPayment;
        return {
          success: true,
          paymentId: updated.id,
          status: "captured",
          amount: updated.amount,
          currency: updated.currency,
          processedAt: updated.updatedAt,
          provider: updated.paymentProvider,
          provenanceSource: updated.provenanceSource,
          webhookEventId: updated.webhookEventId,
        };
      }
    }

    if (params.options?.simulateFailure) {
      throw new Error("Square payment failed: Simulated payment gateway decline");
    }

    if (isSquareProduction()) {
      assertValidDccSquareProductionConfig();
    }

    const provider = params.paymentInfo?.provider || "square";
    const status = requestedStatus;
    const now = new Date().toISOString();
    const sourceId = params.sourceId || (params.paymentInfo as any)?.sourceId;
    const token = getSquareAccessToken();
    const locationId = getSquareLocationIdDcc();

    if (!explicitSim) {
      if (params.paymentInfo?.paymentId && !sourceId) {
        throw new OctoApiError(
          422,
          "UNVERIFIED_CALLER_PAYMENT_STATUS",
          `Caller-supplied paymentId '${params.paymentInfo.paymentId}' or captured status without a real provider sourceId is rejected outside explicit test simulation.`
        );
      }
      if (!sourceId || !String(sourceId).trim()) {
        throw new OctoApiError(
          422,
          "MISSING_PAYMENT_SOURCE",
          "Missing payment sourceId. Outside explicit test simulation, payment processing must fail closed when source information is missing."
        );
      }
      if (!params.options?.squareClient && (!token || !locationId)) {
        throw new OctoApiError(
          503,
          "MISSING_PAYMENT_PROVIDER_CONFIG",
          "Missing SQUARE_ACCESS_TOKEN or SQUARE_LOCATION_ID_DCC configuration. Payment processing must fail closed when provider configuration is missing."
        );
      }
    }

    let paymentId = "";
    let providerPaymentId = "";
    let provenanceSource: PaymentEvidenceProvenanceSource = "explicit_test_simulation";

    if (sourceId && (params.options?.squareClient || (token && locationId)) && !params.paymentInfo?.paymentId) {
      try {
        const client =
          params.options?.squareClient ||
          new SquareClient({
            token,
            environment:
              getSquareEnvironment() === "production"
                ? SquareEnvironment.Production
                : SquareEnvironment.Sandbox,
          });

        const amountCents = Math.round(params.amount * 100);
        const sqResponse = await client.payments.create({
          sourceId,
          idempotencyKey: params.idempotencyKey || `sq_idem_${params.orderId}_${Date.now()}`,
          locationId: locationId || "loc_sim_default",
          amountMoney: {
            amount: BigInt(amountCents),
            currency: params.currency || "USD",
          },
          autocomplete: status === "captured",
          referenceId: params.orderId,
          note: `DCC Master Order ${params.orderId}`,
        });

        const returnedId = sqResponse?.payment?.id;
        const returnedStatus = String(sqResponse?.payment?.status || "COMPLETED").toUpperCase();
        if (!returnedId) {
          throw new OctoApiError(
            502,
            "PAYMENT_PROVIDER_INVALID_RESPONSE",
            "Square payments.create did not return a payment.id"
          );
        }
        if (returnedStatus === "FAILED" || returnedStatus === "CANCELED") {
          throw new OctoApiError(
            422,
            "PAYMENT_PROVIDER_DECLINED",
            `Square payment returned non-capturable status '${returnedStatus}'`
          );
        }
        paymentId = returnedId;
        providerPaymentId = returnedId;
        provenanceSource = "provider_api_response";
      } catch (err: any) {
        if (!explicitSim || process.env.NODE_ENV === "production" || params.options?.simulateFailure) {
          if (err instanceof OctoApiError) throw err;
          throw new OctoApiError(
            502,
            "PAYMENT_PROVIDER_ERROR",
            `Square payment failed: ${err.message}`
          );
        }
        paymentId = `sq_pay_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
        providerPaymentId = paymentId;
        provenanceSource = "explicit_test_simulation";
      }
    } else if (explicitSim) {
      paymentId =
        params.paymentInfo?.paymentId ||
        `sq_pay_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
      providerPaymentId = params.paymentInfo?.paymentIntentId || paymentId;
      provenanceSource = "explicit_test_simulation";
    } else {
      throw new OctoApiError(
        422,
        "UNVERIFIED_CALLER_PAYMENT_STATUS",
        "Cannot record payment without an authoritative provider response or explicit test simulation."
      );
    }

    const paymentRecord: DccOrderPaymentRecord = {
      id: paymentId,
      orderId: params.orderId,
      paymentProvider: provider,
      providerPaymentId,
      amount: params.amount,
      currency: params.currency || "USD",
      status,
      provenanceSource,
      rawMetadata: {
        customerEmail: params.customer?.emailAddress,
        customerName: params.customer?.fullName,
        provenanceSource,
        providerPaymentId,
      },
      createdAt: now,
      updatedAt: now,
    };

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
          paymentMethod: encodePaymentProvenanceMeta({
            method: provider,
            provenanceSource,
            providerPaymentId,
          }),
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
            provenanceSource,
          },
        });
      } catch (err: any) {
        throw new OctoApiError(
          503,
          "PAYMENT_PERSISTENCE_FAILED",
          `Failed to persist order payment ${paymentRecord.id} to database: ${err.message}`
        );
      }
    }

    fallbackPaymentStore.set(params.orderId, paymentRecord);
    fallbackPaymentStore.set(paymentId, paymentRecord);

    return {
      success: status === "captured" || status === "authorized",
      paymentId,
      status,
      amount: params.amount,
      currency: params.currency || "USD",
      processedAt: now,
      provider,
      provenanceSource,
    };
  }

  /**
   * Records or updates an authoritative payment capture from an authenticated Square webhook event.
   */
  static async recordWebhookPaymentCapture(params: {
    paymentId: string;
    orderId: string;
    amount: number;
    currency: string;
    webhookEventId: string;
    provenanceSource?: PaymentEvidenceProvenanceSource;
  }): Promise<OctoVerifiedPaymentEvidence> {
    if (!params.webhookEventId || !params.webhookEventId.trim()) {
      throw new OctoApiError(
        422,
        "MISSING_WEBHOOK_EVENT_ID",
        "Webhook payment capture requires an authenticated webhookEventId"
      );
    }
    const provenanceSource: PaymentEvidenceProvenanceSource =
      params.provenanceSource || "authenticated_webhook";
    const now = new Date().toISOString();
    const existing =
      (await this.getPaymentById(params.paymentId)) ||
      (await this.getPaymentByOrderId(params.orderId));

    const db = getDb();
    if (existing) {
      existing.status = "captured";
      existing.provenanceSource = provenanceSource;
      existing.webhookEventId = params.webhookEventId;
      existing.updatedAt = now;
      if (db) {
        try {
          await db
            .update(dccOrderPayments)
            .set({
              status: "captured",
              paymentMethod: encodePaymentProvenanceMeta({
                method: existing.paymentProvider,
                provenanceSource,
                providerPaymentId: existing.providerPaymentId || existing.id,
                webhookEventId: params.webhookEventId,
              }),
              updatedAt: new Date(),
            })
            .where(eq(dccOrderPayments.id, existing.id));
        } catch (err: any) {
          throw new OctoApiError(
            503,
            "PAYMENT_PERSISTENCE_FAILED",
            `Failed to update webhook payment capture ${existing.id}: ${err.message}`
          );
        }
      }
      fallbackPaymentStore.set(existing.orderId, existing);
      fallbackPaymentStore.set(existing.id, existing);
    } else {
      const record: DccOrderPaymentRecord = {
        id: params.paymentId,
        orderId: params.orderId,
        paymentProvider: "square",
        providerPaymentId: params.paymentId,
        amount: params.amount,
        currency: params.currency || "USD",
        status: "captured",
        provenanceSource,
        webhookEventId: params.webhookEventId,
        createdAt: now,
        updatedAt: now,
      };
      if (db) {
        try {
          await db.insert(dccOrderPayments).values({
            id: record.id,
            orderId: record.orderId,
            provider: "square",
            amount: record.amount.toFixed(2),
            currency: record.currency,
            status: "captured",
            paymentMethod: encodePaymentProvenanceMeta({
              method: "square",
              provenanceSource,
              providerPaymentId: record.id,
              webhookEventId: params.webhookEventId,
            }),
          });
        } catch (err: any) {
          throw new OctoApiError(
            503,
            "PAYMENT_PERSISTENCE_FAILED",
            `Failed to insert webhook payment capture ${record.id}: ${err.message}`
          );
        }
      }
      fallbackPaymentStore.set(record.orderId, record);
      fallbackPaymentStore.set(record.id, record);
    }

    return {
      verified: true,
      provider: "square",
      transactionId: existing?.id || params.paymentId,
      capturedAmount: existing?.amount ?? params.amount,
      currency: existing?.currency || params.currency || "USD",
      capturedAt: now,
      provenanceSource,
      providerRecordId: existing?.id || params.paymentId,
      webhookEventId: params.webhookEventId,
    };
  }

  /**
   * Verifies that a supplied `OctoVerifiedPaymentEvidence` object is traced to an authoritative
   * recorded payment in `DccPaymentService` (`dccOrderPayments` / `dccSquareWebhookEvents`).
   * Rejects generated payment IDs, caller-supplied `captured` statuses, or bare `verified: true` objects.
   */
  static async assertTraceablePaymentEvidence(
    evidence: OctoVerifiedPaymentEvidence | null | undefined,
    expectedAmount?: number,
    expectedCurrency?: string
  ): Promise<OctoVerifiedPaymentEvidence> {
    if (
      !evidence ||
      evidence.verified !== true ||
      typeof evidence.provider !== "string" ||
      !evidence.provider.trim() ||
      typeof evidence.transactionId !== "string" ||
      !evidence.transactionId.trim() ||
      typeof evidence.capturedAmount !== "number" ||
      !Number.isFinite(evidence.capturedAmount) ||
      evidence.capturedAmount <= 0 ||
      typeof evidence.currency !== "string" ||
      !evidence.currency.trim() ||
      typeof evidence.capturedAt !== "string" ||
      Number.isNaN(Date.parse(evidence.capturedAt))
    ) {
      throw new OctoApiError(
        422,
        "INVALID_VERIFIED_PAYMENT_EVIDENCE",
        "Payment evidence is incomplete or malformed."
      );
    }

    const explicitSim = isExplicitPaymentTestSimulation();
    const record = await this.getPaymentById(evidence.transactionId.trim());
    if (!record) {
      if (explicitSim && evidence.provenanceSource === "explicit_test_simulation") {
        return evidence;
      }
      throw new OctoApiError(
        422,
        "UNTRACEABLE_PAYMENT_EVIDENCE",
        `Payment transactionId '${evidence.transactionId}' is not backed by any recorded provider payment capture or authenticated webhook in DccPaymentService. Generated payment IDs or caller-supplied verified:true fields are rejected.`
      );
    }

    if (
      record.status !== "captured" &&
      record.status !== "partially_refunded" &&
      record.status !== "refunded"
    ) {
      throw new OctoApiError(
        422,
        "UNTRACEABLE_PAYMENT_EVIDENCE",
        `Recorded payment '${evidence.transactionId}' has status '${record.status}', not 'captured'.`
      );
    }

    const provenance = record.provenanceSource || "explicit_test_simulation";
    if (!explicitSim && provenance === "explicit_test_simulation") {
      throw new OctoApiError(
        422,
        "UNTRACEABLE_PAYMENT_EVIDENCE",
        `Payment '${evidence.transactionId}' was created via test simulation, which is rejected outside explicit test simulation mode.`
      );
    }

    if (provenance === "authenticated_webhook" && record.webhookEventId) {
      const db = getDb();
      if (db) {
        const evtRows = await db
          .select()
          .from(dccSquareWebhookEvents)
          .where(eq(dccSquareWebhookEvents.squareEventId, record.webhookEventId));
        if (evtRows.length === 0 || evtRows[0].processingStatus === "failed") {
          throw new OctoApiError(
            422,
            "UNTRACEABLE_PAYMENT_EVIDENCE",
            `Webhook payment '${evidence.transactionId}' references unverified or failed webhook event '${record.webhookEventId}'.`
          );
        }
      }
    }

    if (
      expectedCurrency &&
      record.currency.toUpperCase() !== expectedCurrency.toUpperCase()
    ) {
      throw new OctoApiError(
        422,
        "PAYMENT_CURRENCY_MISMATCH",
        `Recorded payment '${evidence.transactionId}' currency '${record.currency}' does not match booking currency '${expectedCurrency}'.`
      );
    }

    if (
      typeof expectedAmount === "number" &&
      Number.isFinite(expectedAmount) &&
      Math.round(record.amount * 100) < Math.round(expectedAmount * 100)
    ) {
      throw new OctoApiError(
        422,
        "INSUFFICIENT_CAPTURED_PAYMENT",
        `Recorded payment '${evidence.transactionId}' amount (${record.amount}) is less than required amount (${expectedAmount}).`
      );
    }

    return {
      ...evidence,
      provenanceSource: provenance,
      providerRecordId: record.id,
      ...(record.webhookEventId ? { webhookEventId: record.webhookEventId } : {}),
    };
  }

  /**
   * Verifies that a supplied `OctoVerifiedRefundEvidence` object is traced to an authoritative
   * recorded refund in `DccPaymentService` (`dccDisputesAndRefunds` / `dccSquareWebhookEvents`).
   */
  static async assertTraceableRefundEvidence(
    evidence: OctoVerifiedRefundEvidence | null | undefined,
    maxRefundableAmount: number,
    expectedCurrency?: string
  ): Promise<OctoVerifiedRefundEvidence> {
    if (
      !evidence ||
      evidence.verified !== true ||
      typeof evidence.provider !== "string" ||
      !evidence.provider.trim() ||
      typeof evidence.refundId !== "string" ||
      !evidence.refundId.trim() ||
      typeof evidence.refundedAmount !== "number" ||
      !Number.isFinite(evidence.refundedAmount) ||
      evidence.refundedAmount <= 0 ||
      typeof evidence.currency !== "string" ||
      !evidence.currency.trim() ||
      typeof evidence.refundedAt !== "string" ||
      Number.isNaN(Date.parse(evidence.refundedAt))
    ) {
      throw new OctoApiError(
        422,
        "INVALID_VERIFIED_REFUND_EVIDENCE",
        "Refund evidence is incomplete or malformed."
      );
    }

    const explicitSim = isExplicitPaymentTestSimulation();
    const refundRecord = await this.getRefundById(evidence.refundId.trim());
    if (!refundRecord) {
      if (explicitSim && evidence.provenanceSource === "explicit_test_simulation") {
        return evidence;
      }
      throw new OctoApiError(
        422,
        "UNTRACEABLE_REFUND_EVIDENCE",
        `Refund ID '${evidence.refundId}' is not backed by any recorded provider refund or authenticated webhook in DccPaymentService. Generated refund IDs or caller-supplied verified:true fields are rejected.`
      );
    }

    const provenance = refundRecord.provenanceSource || "explicit_test_simulation";
    if (!explicitSim && provenance === "explicit_test_simulation") {
      throw new OctoApiError(
        422,
        "UNTRACEABLE_REFUND_EVIDENCE",
        `Refund '${evidence.refundId}' was created via test simulation, which is rejected outside explicit test simulation mode.`
      );
    }

    if (
      expectedCurrency &&
      refundRecord.currency.toUpperCase() !== expectedCurrency.toUpperCase()
    ) {
      throw new OctoApiError(
        422,
        "REFUND_CURRENCY_MISMATCH",
        `Recorded refund '${evidence.refundId}' currency '${refundRecord.currency}' does not match expected '${expectedCurrency}'.`
      );
    }

    if (
      Math.round(refundRecord.amount * 100) !== Math.round(evidence.refundedAmount * 100)
    ) {
      throw new OctoApiError(
        422,
        "REFUND_AMOUNT_MISMATCH",
        `Refund evidence amount (${evidence.refundedAmount}) does not match recorded provider refund amount (${refundRecord.amount}).`
      );
    }

    if (
      Number.isFinite(maxRefundableAmount) &&
      Math.round(refundRecord.amount * 100) > Math.round(maxRefundableAmount * 100)
    ) {
      throw new OctoApiError(
        422,
        "REFUND_EXCEEDS_CAPTURED_AMOUNT",
        `Refund amount (${refundRecord.amount}) exceeds captured amount (${maxRefundableAmount}).`
      );
    }

    return {
      ...evidence,
      provenanceSource: provenance,
      providerRecordId: refundRecord.id,
      ...(refundRecord.webhookEventId ? { webhookEventId: refundRecord.webhookEventId } : {}),
    };
  }

  /**
   * Retrieve the primary payment record for an order
   */
  static async getPaymentByOrderId(orderId: string): Promise<DccOrderPaymentRecord | null> {
    const db = getDb();
    if (db) {
      const rows = await db
        .select()
        .from(dccOrderPayments)
        .where(eq(dccOrderPayments.orderId, orderId));
      if (rows.length > 0) {
        const r = rows[0];
        const meta = decodePaymentProvenanceMeta(r.paymentMethod);
        return {
          id: r.id,
          orderId: r.orderId,
          paymentProvider: r.provider,
          providerPaymentId: meta.providerPaymentId || r.id,
          amount: Number(r.amount),
          currency: r.currency,
          status: r.status as any,
          provenanceSource: meta.provenanceSource,
          webhookEventId: meta.webhookEventId,
          rawMetadata: { customerEmail: r.customerEmail, ...meta },
          createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt || new Date().toISOString()),
          updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : String(r.updatedAt || new Date().toISOString()),
        };
      }
    }

    return fallbackPaymentStore.get(orderId) || null;
  }

  /**
   * Retrieve a payment record by either internal DCC ID or provider payment ID
   */
  static async getPaymentById(id: string): Promise<DccOrderPaymentRecord | null> {
    const db = getDb();
    if (db) {
      const rows = await db
        .select()
        .from(dccOrderPayments)
        .where(or(eq(dccOrderPayments.id, id), eq(dccOrderPayments.orderId, id)));
      if (rows.length > 0) {
        const r = rows[0];
        const meta = decodePaymentProvenanceMeta(r.paymentMethod);
        return {
          id: r.id,
          orderId: r.orderId,
          paymentProvider: r.provider,
          providerPaymentId: meta.providerPaymentId || r.id,
          amount: Number(r.amount),
          currency: r.currency,
          status: r.status as any,
          provenanceSource: meta.provenanceSource,
          webhookEventId: meta.webhookEventId,
          rawMetadata: { customerEmail: r.customerEmail, ...meta },
          createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt || new Date().toISOString()),
          updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : String(r.updatedAt || new Date().toISOString()),
        };
      }
    }

    return fallbackPaymentStore.get(id) || null;
  }

  /**
   * Retrieve a recorded refund by ID
   */
  static async getRefundById(refundId: string): Promise<DccRefundRecord | null> {
    const db = getDb();
    if (db) {
      const rows = await db
        .select()
        .from(dccDisputesAndRefunds)
        .where(eq(dccDisputesAndRefunds.id, refundId));
      if (rows.length > 0) {
        const r = rows[0];
        const meta = decodeRefundReasonMeta(r.reason);
        return {
          id: r.id,
          orderId: r.orderId,
          orderItemId: r.orderItemId || undefined,
          bookingId: r.bookingId || undefined,
          operatorSlug: r.operatorSlug,
          type: r.type as any,
          amount: Number(r.amount),
          currency: r.currency,
          status: (r.status === "succeeded" ? "processed" : r.status) as any,
          reason: meta.reason || r.reason || undefined,
          provenanceSource: meta.provenanceSource,
          webhookEventId: meta.webhookEventId,
          settlementAdjusted: Boolean(r.settlementImpact),
          createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt || new Date().toISOString()),
        };
      }
    }
    return fallbackRefundStore.get(refundId) || null;
  }

  /**
   * Update the status of an existing payment record
   */
  static async updatePaymentStatus(
    orderId: string,
    status: any,
    webhookMeta?: {
      webhookEventId?: string;
      provenanceSource?: PaymentEvidenceProvenanceSource;
    }
  ): Promise<boolean> {
    const payment = await this.getPaymentByOrderId(orderId);
    if (!payment) return false;

    payment.status = status;
    if (webhookMeta?.provenanceSource) {
      payment.provenanceSource = webhookMeta.provenanceSource;
    }
    if (webhookMeta?.webhookEventId) {
      payment.webhookEventId = webhookMeta.webhookEventId;
    }
    payment.updatedAt = new Date().toISOString();

    const db = getDb();
    if (db) {
      try {
        await db
          .update(dccOrderPayments)
          .set({
            status,
            paymentMethod: encodePaymentProvenanceMeta({
              method: payment.paymentProvider,
              provenanceSource: payment.provenanceSource || "explicit_test_simulation",
              providerPaymentId: payment.providerPaymentId || payment.id,
              webhookEventId: payment.webhookEventId,
            }),
            updatedAt: new Date(),
          })
          .where(eq(dccOrderPayments.orderId, orderId));
      } catch (err: any) {
        throw new OctoApiError(
          503,
          "PAYMENT_PERSISTENCE_FAILED",
          `Failed to update payment status for order ${orderId}: ${err.message}`
        );
      }
    }

    fallbackPaymentStore.set(orderId, payment);
    fallbackPaymentStore.set(payment.id, payment);

    return true;
  }

  /**
   * Record an external refund event (e.g. from authenticated Square webhook)
   */
  static async recordExternalRefund(params: {
    refundId: string;
    orderId: string;
    amount: number;
    currency?: string;
    reason?: string;
    webhookEventId?: string;
    provenanceSource?: PaymentEvidenceProvenanceSource;
  }): Promise<DccRefundRecord> {
    const now = new Date().toISOString();
    const payment = await this.getPaymentByOrderId(params.orderId);
    const provenanceSource: PaymentEvidenceProvenanceSource =
      params.provenanceSource ||
      (params.webhookEventId ? "authenticated_webhook" : "explicit_test_simulation");

    const refundRecord: DccRefundRecord = {
      id: params.refundId,
      orderId: params.orderId,
      operatorSlug: "dcc-system",
      type: "refund",
      amount: params.amount,
      currency: params.currency || "USD",
      status: "processed",
      reason: params.reason || "External Square Refund",
      provenanceSource,
      webhookEventId: params.webhookEventId,
      settlementAdjusted: false,
      createdAt: now,
    };

    const existingRefunds = await this.getRefundsForOrder(params.orderId);
    const totalRefunded =
      existingRefunds.reduce((sum, r) => (r.id === params.refundId ? sum : sum + r.amount), 0) +
      params.amount;

    if (payment) {
      payment.status = totalRefunded >= payment.amount ? "refunded" : "partially_refunded";
      payment.updatedAt = now;
    }

    const db = getDb();
    if (db) {
      try {
        await db.insert(dccDisputesAndRefunds).values({
          id: refundRecord.id,
          orderId: refundRecord.orderId,
          paymentId: payment?.id || "pay_unspecified",
          operatorSlug: refundRecord.operatorSlug,
          type: refundRecord.type,
          amount: refundRecord.amount.toFixed(2),
          currency: refundRecord.currency,
          status: refundRecord.status,
          reason: encodeRefundReasonMeta({
            reason: refundRecord.reason || "External Square Refund",
            provenanceSource,
            webhookEventId: params.webhookEventId,
          }),
          settlementImpact: "reduced_pending",
        });

        if (payment) {
          await db
            .update(dccOrderPayments)
            .set({ status: payment.status, updatedAt: new Date() })
            .where(eq(dccOrderPayments.orderId, params.orderId));
        }

        await db.insert(octoAuditLogs).values({
          action: "WEBHOOK_REFUND_RECORDED",
          entityType: "REFUND",
          entityId: refundRecord.id,
          status: "SUCCESS",
          payload: {
            orderId: params.orderId,
            amount: params.amount,
            provenanceSource,
            webhookEventId: params.webhookEventId,
          },
        });
      } catch (err: any) {
        throw new OctoApiError(
          503,
          "REFUND_PERSISTENCE_FAILED",
          `Failed to persist external refund ${refundRecord.id}: ${err.message}`
        );
      }
    }

    fallbackRefundStore.set(params.refundId, refundRecord);
    if (payment) {
      fallbackPaymentStore.set(params.orderId, payment);
      fallbackPaymentStore.set(payment.id, payment);
    }

    return refundRecord;
  }

  /**
   * Process and record a refund (item-level or order-level)
   */
  static async processRefund(params: DccRefundParams): Promise<DccRefundRecord> {
    const now = new Date().toISOString();
    const explicitSim = isExplicitPaymentTestSimulation(params.options);
    const payment = await this.getPaymentByOrderId(params.orderId);
    const token = getSquareAccessToken();

    if (!explicitSim) {
      if (!payment || (payment.status !== "captured" && payment.status !== "partially_refunded")) {
        throw new OctoApiError(
          422,
          "MISSING_CAPTURED_PAYMENT_FOR_REFUND",
          `Order ${params.orderId} does not have a captured payment eligible for provider refund.`
        );
      }
      if (!params.options?.squareClient && !token) {
        throw new OctoApiError(
          503,
          "MISSING_PAYMENT_PROVIDER_CONFIG",
          "Missing SQUARE_ACCESS_TOKEN required to execute provider refund outside explicit test simulation."
        );
      }
    }

    let refundId = `ref_${crypto.randomUUID().slice(0, 16)}`;
    let provenanceSource: PaymentEvidenceProvenanceSource = "explicit_test_simulation";

    if (
      payment?.paymentProvider === "square" &&
      payment.providerPaymentId &&
      (params.options?.squareClient || (token && !payment.providerPaymentId.startsWith("mock_")))
    ) {
      if (isSquareProduction()) {
        assertValidDccSquareProductionConfig();
      }
      try {
        const client =
          params.options?.squareClient ||
          new SquareClient({
            token,
            environment:
              getSquareEnvironment() === "production"
                ? SquareEnvironment.Production
                : SquareEnvironment.Sandbox,
          });
        const amountCents = Math.round(params.amount * 100);
        const sqRefundRes = await client.refunds.refundPayment({
          idempotencyKey: refundId,
          amountMoney: {
            amount: BigInt(amountCents),
            currency: (params.currency || "USD") as any,
          },
          paymentId: payment.providerPaymentId,
          reason: params.reason || "DCC Order Cancellation",
        });
        const providerRefundId = sqRefundRes?.refund?.id;
        if (!providerRefundId && !explicitSim) {
          throw new OctoApiError(
            502,
            "REFUND_PROVIDER_INVALID_RESPONSE",
            "Square refunds.refundPayment did not return a refund.id"
          );
        }
        if (providerRefundId) {
          refundId = providerRefundId;
        }
        provenanceSource = "provider_api_response";
      } catch (sqErr: any) {
        if (!explicitSim || process.env.NODE_ENV === "production") {
          if (sqErr instanceof OctoApiError) throw sqErr;
          throw new OctoApiError(
            502,
            "REFUND_PROVIDER_ERROR",
            `Square refund failed: ${sqErr.message}`
          );
        }
      }
    }

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
      provenanceSource,
      settlementAdjusted: false,
      createdAt: now,
    };

    const existingRefunds = await this.getRefundsForOrder(params.orderId);
    const totalRefunded =
      existingRefunds.reduce((sum, r) => (r.id === refundId ? sum : sum + r.amount), 0) +
      params.amount;

    if (payment) {
      payment.status = totalRefunded >= payment.amount ? "refunded" : "partially_refunded";
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
          reason: encodeRefundReasonMeta({
            reason: refundRecord.reason || "Customer cancellation refund",
            provenanceSource,
          }),
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
            provenanceSource,
          },
        });
      } catch (err: any) {
        throw new OctoApiError(
          503,
          "REFUND_PERSISTENCE_FAILED",
          `Failed to persist refund ${refundRecord.id} to database: ${err.message}`
        );
      }
    }

    fallbackRefundStore.set(refundId, refundRecord);
    if (payment) {
      fallbackPaymentStore.set(params.orderId, payment);
      fallbackPaymentStore.set(payment.id, payment);
    }

    return refundRecord;
  }

  /**
   * Cancel or void an authorized payment when a booking fails before capture
   */
  static async cancelOrVoidPayment(orderId: string, reason?: string): Promise<boolean> {
    const payment = await this.getPaymentByOrderId(orderId);
    if (!payment) return false;

    if (payment.status === "authorized") {
      const token = getSquareAccessToken();
      if (
        payment.paymentProvider === "square" &&
        payment.providerPaymentId &&
        token &&
        !payment.providerPaymentId.startsWith("mock_")
      ) {
        try {
          const client = new SquareClient({
            token,
            environment:
              getSquareEnvironment() === "production"
                ? SquareEnvironment.Production
                : SquareEnvironment.Sandbox,
          });
          await client.payments.cancel({ paymentId: payment.providerPaymentId });
        } catch {
          // Void attempt completed
        }
      }
      await this.updatePaymentStatus(orderId, "failed");
      return true;
    } else if (payment.status === "captured") {
      await this.processRefund({
        orderId,
        operatorSlug: "dcc-system",
        amount: payment.amount,
        currency: payment.currency,
        reason: reason || "Void/Refund after checkout failure",
      });
      return true;
    }

    return false;
  }

  /**
   * Record a chargeback dispute against an order
   */
  static async recordChargeback(params: DccChargebackParams): Promise<DccRefundRecord> {
    const disputeId = `chg_${crypto.randomUUID().slice(0, 16)}`;
    const now = new Date().toISOString();
    const payment = await this.getPaymentByOrderId(params.orderId);

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
        throw new OctoApiError(
          503,
          "CHARGEBACK_PERSISTENCE_FAILED",
          `Failed to persist chargeback ${record.id}: ${err.message}`
        );
      }
    }

    fallbackRefundStore.set(disputeId, record);
    if (payment) {
      payment.status = "chargeback";
      payment.updatedAt = now;
      fallbackPaymentStore.set(params.orderId, payment);
      fallbackPaymentStore.set(payment.id, payment);
    }

    return record;
  }

  /**
   * List refunds and disputes for an order
   */
  static async getRefundsForOrder(orderId: string): Promise<DccRefundRecord[]> {
    const db = getDb();
    if (db) {
      const rows = await db
        .select()
        .from(dccDisputesAndRefunds)
        .where(eq(dccDisputesAndRefunds.orderId, orderId));
      if (rows.length > 0) {
        return rows.map((r) => {
          const meta = decodeRefundReasonMeta(r.reason);
          return {
            id: r.id,
            orderId: r.orderId,
            orderItemId: r.orderItemId || undefined,
            bookingId: r.bookingId || undefined,
            operatorSlug: r.operatorSlug,
            type: r.type as any,
            amount: Number(r.amount),
            currency: r.currency,
            status: (r.status === "succeeded" ? "processed" : r.status) as any,
            reason: meta.reason || r.reason || undefined,
            provenanceSource: meta.provenanceSource,
            webhookEventId: meta.webhookEventId,
            settlementAdjusted: Boolean(r.settlementImpact),
            createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt || new Date().toISOString()),
          };
        });
      }
    }

    return Array.from(fallbackRefundStore.values()).filter((r) => r.orderId === orderId);
  }
}

