import { NextRequest, NextResponse } from "next/server";
import { WebhooksHelper } from "square";
import { DccPaymentService } from "@/lib/payments/paymentService";
import { getDb } from "@/lib/db/client";
import { octoAuditLogs } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// In-memory replay protection cache (stores recently processed event IDs)
const processedWebhookEventIds = new Set<string>();

function getSignatureKey(): string {
  return (
    process.env.SQUARE_WEBHOOK_SIGNATURE_KEY_DCC ||
    process.env.SQUARE_WEBHOOK_SIGNATURE_KEY ||
    ""
  ).trim();
}

function getWebhookNotificationUrl(request: NextRequest): string {
  return (
    process.env.SQUARE_WEBHOOK_URL_DCC ||
    process.env.SQUARE_WEBHOOK_URL ||
    request.nextUrl.toString()
  );
}

function logSanitizedWebhook(action: string, data: Record<string, unknown>) {
  // Strip any PANs, CVVs, nonces, or tokens. Log only sanitized fields.
  const sanitized = {
    action,
    timestamp: new Date().toISOString(),
    eventType: data.eventType,
    eventId: data.eventId,
    orderId: data.orderId,
    paymentId: data.paymentId,
    refundId: data.refundId,
    disputeId: data.disputeId,
    status: data.status,
    amount: data.amount,
    currency: data.currency,
  };
  console.log("[DCC_SQUARE_WEBHOOK]", JSON.stringify(sanitized));
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signatureKey = getSignatureKey();
  const isProd = process.env.NODE_ENV === "production";
  const isTestBypass = !isProd && request.headers.get("x-dcc-test-bypass") === "true";

  // 1. Signature Verification
  if (!isTestBypass) {
    if (!signatureKey) {
      logSanitizedWebhook("misconfigured", { eventType: "unknown", status: "missing_signature_key" });
      if (isProd) {
        return NextResponse.json(
          { ok: false, error: "DCC_SQUARE_WEBHOOK_CONFIG_ERROR: Missing SQUARE_WEBHOOK_SIGNATURE_KEY_DCC" },
          { status: 503 }
        );
      }
    } else {
      const signatureHeader = String(request.headers.get("x-square-hmacsha256-signature") || "").trim();
      const notificationUrl = getWebhookNotificationUrl(request);

      let isValid = false;
      try {
        isValid = await WebhooksHelper.verifySignature({
          requestBody: rawBody,
          signatureHeader,
          signatureKey,
          notificationUrl,
        });
      } catch (err: any) {
        logSanitizedWebhook("signature_error", { status: err.message });
      }

      if (!isValid) {
        logSanitizedWebhook("rejected", { status: "invalid_signature" });
        return NextResponse.json({ ok: false, error: "invalid_square_signature" }, { status: 401 });
      }
    }
  }

  // 2. Parse payload
  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json_payload" }, { status: 400 });
  }

  const eventType: string = body.type || body.event_type || "";
  const eventId: string = body.event_id || body.id || "";
  const createdAt: string = body.created_at || "";

  // 3. Replay Protection: Timestamp window (5 minutes)
  if (createdAt && !isTestBypass) {
    const eventTime = new Date(createdAt).getTime();
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    if (Math.abs(now - eventTime) > fiveMinutes) {
      logSanitizedWebhook("replay_rejected", { eventType, eventId, status: "stale_timestamp" });
      return NextResponse.json(
        { ok: false, error: "stale_event_timestamp", message: "Event timestamp exceeds 5-minute tolerance window" },
        { status: 400 }
      );
    }
  }

  // 4. Replay Protection: Idempotent Event Deduplication
  if (eventId) {
    if (processedWebhookEventIds.has(eventId)) {
      logSanitizedWebhook("duplicate_ignored", { eventType, eventId, status: "already_processed" });
      return NextResponse.json({ ok: true, duplicate: true, eventId });
    }
    processedWebhookEventIds.add(eventId);
    if (processedWebhookEventIds.size > 5000) {
      const oldest = processedWebhookEventIds.values().next().value;
      if (oldest) processedWebhookEventIds.delete(oldest);
    }
  }

  logSanitizedWebhook("received", { eventType, eventId });

  // 5. Route Event to Dedicated Handlers
  try {
    const dataObj = body.data?.object || body.object || {};

    switch (eventType) {
      case "payment.created": {
        const payment = dataObj.payment || dataObj;
        logSanitizedWebhook("payment_created", {
          eventType,
          eventId,
          paymentId: payment.id,
          orderId: payment.reference_id || payment.order_id,
          status: payment.status,
          amount: payment.amount_money ? Number(payment.amount_money.amount) / 100 : undefined,
          currency: payment.amount_money?.currency,
        });
        break;
      }

      case "payment.updated": {
        const payment = dataObj.payment || dataObj;
        const paymentId = payment.id;
        const squareStatus = payment.status; // COMPLETED, APPROVED, CANCELED, FAILED
        const orderId = payment.reference_id;

        logSanitizedWebhook("payment_updated", {
          eventType,
          eventId,
          paymentId,
          orderId,
          status: squareStatus,
          amount: payment.amount_money ? Number(payment.amount_money.amount) / 100 : undefined,
          currency: payment.amount_money?.currency,
        });

        if (paymentId) {
          const targetPayment = (await DccPaymentService.getPaymentById(paymentId)) ||
            (orderId ? await DccPaymentService.getPaymentByOrderId(orderId) : null);

          if (targetPayment) {
            let nextStatus = targetPayment.status;
            if (squareStatus === "COMPLETED") {
              nextStatus = "captured";
            } else if (squareStatus === "CANCELED") {
              nextStatus = "cancelled";
            } else if (squareStatus === "FAILED") {
              nextStatus = "failed";
            }

            if (nextStatus !== targetPayment.status) {
              await DccPaymentService.updatePaymentStatus(targetPayment.orderId, nextStatus);
            }
          }
        }
        break;
      }

      case "refund.created":
      case "refund.updated": {
        const refund = dataObj.refund || dataObj;
        const refundId = refund.id;
        const paymentId = refund.payment_id;
        const refundStatus = refund.status; // SUCCESS, PENDING, FAILED, REJECTED
        const amountCents = refund.amount_money ? Number(refund.amount_money.amount) : 0;
        const amount = amountCents / 100;
        const currency = refund.amount_money?.currency || "USD";

        logSanitizedWebhook("refund_event", {
          eventType,
          eventId,
          refundId,
          paymentId,
          status: refundStatus,
          amount,
          currency,
        });

        if (paymentId && (refundStatus === "SUCCESS" || refundStatus === "COMPLETED")) {
          const targetPayment = await DccPaymentService.getPaymentById(paymentId);
          if (targetPayment) {
            await DccPaymentService.recordExternalRefund({
              refundId,
              orderId: targetPayment.orderId,
              amount,
              currency,
              reason: refund.reason || "Square Webhook Refund",
            });
          }
        }
        break;
      }

      case "dispute.created":
      case "dispute.state.updated": {
        const dispute = dataObj.dispute || dataObj;
        const disputeId = dispute.id;
        const paymentId = dispute.disputed_payment?.payment_id;
        const amountCents = dispute.amount_money ? Number(dispute.amount_money.amount) : 0;
        const amount = amountCents / 100;
        const currency = dispute.amount_money?.currency || "USD";
        const state = dispute.state || dispute.status;

        logSanitizedWebhook("dispute_event", {
          eventType,
          eventId,
          disputeId,
          paymentId,
          status: state,
          amount,
          currency,
        });

        if (paymentId) {
          const targetPayment = await DccPaymentService.getPaymentById(paymentId);
          if (targetPayment) {
            await DccPaymentService.recordChargeback({
              orderId: targetPayment.orderId,
              operatorSlug: "dcc-system",
              amount,
              currency,
              reason: dispute.reason || `Square dispute: ${state}`,
            });
          }
        }
        break;
      }

      default:
        logSanitizedWebhook("ignored_event", { eventType, eventId });
        break;
    }

    // Persist audit log in DB if available
    const db = getDb();
    if (db) {
      try {
        await db.insert(octoAuditLogs).values({
          action: "SQUARE_WEBHOOK_PROCESSED",
          entityType: "WEBHOOK",
          entityId: eventId || `ev_${Date.now()}`,
          status: "SUCCESS",
          payload: {
            eventType,
            eventId,
            timestamp: new Date().toISOString(),
          },
        });
      } catch {
        // Non-blocking audit log
      }
    }

    return NextResponse.json({ ok: true, processed: true, eventType, eventId });
  } catch (err: any) {
    logSanitizedWebhook("processing_error", { eventType, eventId, status: err.message });
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
