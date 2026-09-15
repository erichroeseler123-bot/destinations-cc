import { NextRequest, NextResponse } from "next/server";
import { WebhooksHelper } from "square";
import { DccPaymentService } from "@/lib/payments/paymentService";
import { DccSquareWebhookService } from "@/lib/payments/squareWebhookService";
import { getDb } from "@/lib/db/client";
import { octoAuditLogs } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  // Strip any PANs, CVVs, nonces, tokens, or PII. Log strictly sanitized telemetry.
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

  if (!eventId || !eventType) {
    return NextResponse.json({ ok: false, error: "missing_event_identifiers" }, { status: 400 });
  }

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

  // Extract preliminary IDs from payload
  const dataObj = body.data?.object || body.object || {};
  let preliminaryPaymentId: string | undefined =
    dataObj.payment?.id ||
    dataObj.refund?.payment_id ||
    dataObj.dispute?.disputed_payment?.payment_id;
  let preliminaryOrderId: string | undefined =
    dataObj.payment?.reference_id ||
    dataObj.payment?.order_id ||
    dataObj.refund?.order_id;

  // 4. Durable Atomic Insertion: Unique constraint on square_event_id
  const { isDuplicate } = await DccSquareWebhookService.recordIncomingEventAtomic({
    squareEventId: eventId,
    eventType,
    paymentId: preliminaryPaymentId,
    orderId: preliminaryOrderId,
  });

  if (isDuplicate) {
    logSanitizedWebhook("duplicate_ignored", { eventType, eventId, status: "already_processed" });
    return NextResponse.json({ ok: true, duplicate: true, eventId });
  }

  logSanitizedWebhook("received", { eventType, eventId, paymentId: preliminaryPaymentId, orderId: preliminaryOrderId });

  // 5. Route Event to Handlers & Verify Amount/Currency Matching
  try {
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

        if (paymentId) {
          const targetPayment =
            (await DccPaymentService.getPaymentById(paymentId)) ||
            (orderId ? await DccPaymentService.getPaymentByOrderId(orderId) : null);

          if (!targetPayment) {
            logSanitizedWebhook("payment_not_found", { eventType, eventId, paymentId, orderId });
            await DccSquareWebhookService.markEventProcessed(eventId, "ignored", { reason: "payment_not_found" });
            return NextResponse.json({ ok: true, ignored: true, reason: "payment_not_found" });
          }

          // Verify event amount and currency match the stored order payment
          if (payment.amount_money) {
            const eventAmount = Number(payment.amount_money.amount) / 100;
            const eventCurrency = payment.amount_money.currency;

            if (targetPayment.amount !== undefined && Math.round(eventAmount * 100) !== Math.round(targetPayment.amount * 100)) {
              logSanitizedWebhook("amount_mismatch", {
                eventType,
                eventId,
                paymentId,
                expectedAmount: targetPayment.amount,
                eventAmount,
              });
              await DccSquareWebhookService.markEventProcessed(eventId, "failed", {
                error: "AMOUNT_MISMATCH",
                expectedAmount: targetPayment.amount,
                eventAmount,
              });
              return NextResponse.json({ ok: false, error: "amount_mismatch" }, { status: 400 });
            }

            if (targetPayment.currency && eventCurrency && eventCurrency !== targetPayment.currency) {
              logSanitizedWebhook("currency_mismatch", {
                eventType,
                eventId,
                paymentId,
                expectedCurrency: targetPayment.currency,
                eventCurrency,
              });
              await DccSquareWebhookService.markEventProcessed(eventId, "failed", {
                error: "CURRENCY_MISMATCH",
                expectedCurrency: targetPayment.currency,
                eventCurrency,
              });
              return NextResponse.json({ ok: false, error: "currency_mismatch" }, { status: 400 });
            }
          }

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

          logSanitizedWebhook("payment_updated", {
            eventType,
            eventId,
            paymentId,
            orderId: targetPayment.orderId,
            status: nextStatus,
            amount: targetPayment.amount,
            currency: targetPayment.currency,
          });
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

        if (paymentId && (refundStatus === "SUCCESS" || refundStatus === "COMPLETED")) {
          const targetPayment = await DccPaymentService.getPaymentById(paymentId);
          if (targetPayment) {
            // Verify currency match
            if (targetPayment.currency && currency !== targetPayment.currency) {
              logSanitizedWebhook("currency_mismatch", { eventType, eventId, refundId, expected: targetPayment.currency, received: currency });
              await DccSquareWebhookService.markEventProcessed(eventId, "failed", { error: "CURRENCY_MISMATCH" });
              return NextResponse.json({ ok: false, error: "currency_mismatch" }, { status: 400 });
            }

            // Idempotent refund handling: check if already recorded
            const existingRefunds = await DccPaymentService.getRefundsForOrder(targetPayment.orderId);
            const alreadyRecorded = existingRefunds.some((r) => r.id === refundId);

            if (!alreadyRecorded) {
              await DccPaymentService.recordExternalRefund({
                refundId,
                orderId: targetPayment.orderId,
                amount,
                currency,
                reason: refund.reason || "Square Webhook Refund",
              });
            }

            logSanitizedWebhook("refund_processed", {
              eventType,
              eventId,
              refundId,
              paymentId,
              orderId: targetPayment.orderId,
              amount,
              currency,
              status: "processed",
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

        if (paymentId) {
          const targetPayment = await DccPaymentService.getPaymentById(paymentId);
          if (targetPayment) {
            // Idempotent dispute handling: check if already recorded
            const existingRefunds = await DccPaymentService.getRefundsForOrder(targetPayment.orderId);
            const alreadyRecorded = existingRefunds.some((r) => r.id === disputeId);

            if (!alreadyRecorded) {
              await DccPaymentService.recordChargeback({
                orderId: targetPayment.orderId,
                operatorSlug: "dcc-system",
                amount,
                currency,
                reason: dispute.reason || `Square dispute: ${state}`,
              });
            }

            logSanitizedWebhook("dispute_processed", {
              eventType,
              eventId,
              disputeId,
              paymentId,
              orderId: targetPayment.orderId,
              status: state,
              amount,
              currency,
            });
          }
        }
        break;
      }

      default:
        logSanitizedWebhook("ignored_event", { eventType, eventId });
        break;
    }

    // Mark event successfully processed in durable store
    await DccSquareWebhookService.markEventProcessed(
      eventId,
      "succeeded",
      undefined,
      { paymentId: preliminaryPaymentId, orderId: preliminaryOrderId }
    );

    // Audit log in DB if available
    const db = getDb();
    if (db) {
      try {
        await db.insert(octoAuditLogs).values({
          action: "SQUARE_WEBHOOK_PROCESSED",
          entityType: "WEBHOOK",
          entityId: eventId,
          status: "SUCCESS",
          payload: {
            eventType,
            eventId,
            timestamp: new Date().toISOString(),
          },
        });
      } catch {
        // Non-blocking
      }
    }

    return NextResponse.json({ ok: true, processed: true, eventType, eventId });
  } catch (err: any) {
    logSanitizedWebhook("processing_error", { eventType, eventId, status: err.message });
    await DccSquareWebhookService.markEventProcessed(eventId, "failed", { error: err.message });
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
