import { NextRequest, NextResponse } from "next/server";
import { WebhooksHelper } from "square";
import { getBookingBySquareOrderId } from "@/lib/bookings";
import { canFinalizePaidBooking, finalizePaidBooking, markBookingNeedsReview } from "@/lib/finalizeBooking";
import { getSquarePayment } from "@/lib/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function read(name: string) {
  return String(process.env[name] || "").trim();
}

function getWebhookSecret() {
  return read("SQUARE_WEBHOOK_SECRET") || read("SQUARE_WEBHOOK_TOKEN");
}

function getSignatureKey() {
  return read("SQUARE_WEBHOOK_SIGNATURE_KEY");
}

function firstString(...values: Array<unknown>) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function getNested(root: Record<string, unknown>, path: string[]) {
  let current: unknown = root;
  for (const key of path) {
    if (!current || typeof current !== "object" || !(key in (current as Record<string, unknown>))) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function buildPayerName(payment: {
  card_details?: { card?: { cardholder_name?: string | null } };
  buyer_details?: { contact?: { given_name?: string | null; family_name?: string | null } };
}) {
  const direct = payment.card_details?.card?.cardholder_name;
  if (direct) return direct;
  const given = payment.buyer_details?.contact?.given_name || "";
  const family = payment.buyer_details?.contact?.family_name || "";
  const full = `${given} ${family}`.trim();
  return full || null;
}

function logWebhook(event: string, details: Record<string, string | number | boolean | null | undefined>) {
  console.log("redrocksfastpass-square-webhook", {
    event,
    ...details,
  });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signatureKey = getSignatureKey();
  const verificationMode = signatureKey ? "square_signature" : "token";

  if (signatureKey) {
    const signatureHeader = String(request.headers.get("x-square-hmacsha256-signature") || "").trim();
    const isValid = await WebhooksHelper.verifySignature({
      requestBody: rawBody,
      signatureHeader,
      signatureKey,
      notificationUrl: request.nextUrl.toString(),
    });

    if (!isValid) {
      logWebhook("rejected", {
        verificationMode,
        reason: "invalid_square_signature",
      });
      return NextResponse.json({ ok: false, error: "invalid_square_signature" }, { status: 401 });
    }
  } else {
    const expected = getWebhookSecret();
    if (!expected) {
      logWebhook("misconfigured", {
        verificationMode,
        reason: "missing_webhook_secret",
      });
      return NextResponse.json({ ok: false, error: "missing_webhook_secret" }, { status: 503 });
    }

    const provided =
      String(request.nextUrl.searchParams.get("token") || "").trim() ||
      String(request.headers.get("x-webhook-token") || "").trim();

    if (provided !== expected) {
      logWebhook("rejected", {
        verificationMode,
        reason: "invalid_webhook_token",
      });
      return NextResponse.json({ ok: false, error: "invalid_webhook_token" }, { status: 401 });
    }
  }

  const body = (() => {
    try {
      return JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return null;
    }
  })();
  if (!body) {
    logWebhook("rejected", {
      verificationMode,
      reason: "invalid_json",
    });
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const eventType = firstString(body.type, body.event_type, getNested(body, ["data", "type"]));
  const paymentId = firstString(
    getNested(body, ["data", "object", "payment", "id"]),
    getNested(body, ["data", "object", "id"]),
    getNested(body, ["object", "payment", "id"]),
    getNested(body, ["object", "id"])
  );
  const orderIdFromPayload = firstString(
    getNested(body, ["data", "object", "payment", "order_id"]),
    getNested(body, ["data", "object", "order_id"]),
    getNested(body, ["object", "payment", "order_id"]),
    getNested(body, ["object", "order_id"])
  );

  logWebhook("received", {
    verificationMode,
    eventType,
    paymentId: paymentId || null,
    orderId: orderIdFromPayload || null,
  });

  if (!paymentId && !orderIdFromPayload) {
    logWebhook("skipped", {
      verificationMode,
      eventType,
      reason: "no_payment_reference",
    });
    return NextResponse.json({ ok: true, skipped: true, reason: "no_payment_reference", eventType });
  }

  let orderId = orderIdFromPayload;
  let transactionId = "";
  let payerName: string | null = null;
  let amountCents = 0;
  let status = "";

  if (paymentId) {
    const paymentResponse = await getSquarePayment(paymentId);
    const payment = paymentResponse.payment;
    orderId = orderId || payment?.order_id || "";
    transactionId = payment?.id || paymentId;
    amountCents = Number(payment?.amount_money?.amount || 0);
    status = String(payment?.status || "");
    payerName = payment ? buildPayerName(payment) : null;
  }

  if (!orderId) {
    logWebhook("skipped", {
      verificationMode,
      eventType,
      paymentId: paymentId || null,
      reason: "missing_order_id",
    });
    return NextResponse.json({ ok: true, skipped: true, reason: "missing_order_id", eventType });
  }

  const booking = await getBookingBySquareOrderId(orderId);
  if (!booking) {
    logWebhook("skipped", {
      verificationMode,
      eventType,
      paymentId: paymentId || null,
      orderId,
      reason: "booking_not_found",
    });
    return NextResponse.json({ ok: true, skipped: true, reason: "booking_not_found", orderId, eventType });
  }

  if (booking.status === "paid") {
    logWebhook("duplicate", {
      verificationMode,
      eventType,
      paymentId: paymentId || null,
      orderId,
      booking: booking.token,
    });
    return NextResponse.json({ ok: true, booking: booking.token, status: "already_paid" });
  }

  if (status && status !== "COMPLETED") {
    logWebhook("ignored", {
      verificationMode,
      eventType,
      paymentId: paymentId || null,
      orderId,
      booking: booking.token,
      paymentStatus: status,
    });
    return NextResponse.json({ ok: true, booking: booking.token, status: "ignored", paymentStatus: status });
  }

  if (amountCents && amountCents < Math.round(booking.amountUsd * 100)) {
    logWebhook("ignored", {
      verificationMode,
      eventType,
      paymentId: paymentId || null,
      orderId,
      booking: booking.token,
      reason: "amount_mismatch",
      amountCents,
      expectedAmountCents: Math.round(booking.amountUsd * 100),
    });
    return NextResponse.json({ ok: true, booking: booking.token, status: "ignored", reason: "amount_mismatch" });
  }

  const validation = await canFinalizePaidBooking(booking);
  if (!validation.ok) {
    const next = await markBookingNeedsReview(booking, {
      reason: validation.reason,
      payerName,
      squareTransactionId: transactionId || null,
      squareOrderId: orderId,
      sourcePath: "/api/square/webhook",
    });
    logWebhook("ignored", {
      verificationMode,
      eventType,
      paymentId: transactionId || paymentId || null,
      orderId,
      booking: next.token,
      reason: validation.reason,
    });
    return NextResponse.json({ ok: true, booking: next.token, status: next.status, reason: validation.reason });
  }

  const next = await finalizePaidBooking(booking, {
    payerName,
    squareTransactionId: transactionId || null,
    squareOrderId: orderId,
    sourcePath: "/api/square/webhook",
  });

  logWebhook("paid", {
    verificationMode,
    eventType,
    paymentId: transactionId || paymentId || null,
    orderId,
    booking: next.token,
    amountCents: amountCents || Math.round(next.amountUsd * 100),
  });

  return NextResponse.json({ ok: true, booking: next.token, status: next.status });
}
