import { randomUUID } from "crypto";
import { NextRequest } from "next/server";
import { SquareClient, SquareEnvironment } from "square";
import { writeStoredOrder, type StoredOrder } from "@/lib/orders";
import {
  ARGO_MAX_QTY,
  ARGO_PRODUCT_ID,
  ARGO_ROUTE_KEY,
  ARGO_SEAT_PRICE_CENTS,
  resolveArgoReservation,
} from "@/lib/argoReservation";
import {
  hasLegacySquareEnvAlias,
  readCanonicalSquareEnv,
  reportLegacySquareEnvAlias,
} from "@/lib/squareEnvDrift";

export const runtime = "nodejs";

const ARGO_DROP_OFF = "Argo Mill and Tunnel";

type CreateSquarePaymentBody = {
  route?: string;
  product?: string;
  date?: string;
  qty?: number;
  partySize?: number;
  pickup?: string;
  dropoff?: string;
  pickupTime?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  specialRequests?: string;
  decisionMeta?: {
    corridorId?: string;
    recommendationId?: string;
    handoffId?: string;
    sourcePage?: string;
    modifiedFields?: string[];
    timeToCheckoutStartMs?: number;
  };
  sourceId?: string;
};

function getSquareEnvironmentValue(value?: string) {
  return value?.toLowerCase() === "production" ? SquareEnvironment.Production : SquareEnvironment.Sandbox;
}

function getSquareEnvironment() {
  const explicit = process.env.SQUARE_ENVIRONMENT?.trim();
  if (explicit) return explicit.toLowerCase();

  if (hasLegacySquareEnvAlias("SQUARE_sandbox_access_token")) {
    reportLegacySquareEnvAlias(
      { name: "SQUARE_sandbox_access_token", replacement: "SQUARE_ENVIRONMENT + SQUARE_ACCESS_TOKEN" },
      "shuttleya.square.environment",
    );
    return "sandbox";
  }

  if (hasLegacySquareEnvAlias("SQUARE_Sandbox_App_ID")) {
    reportLegacySquareEnvAlias(
      { name: "SQUARE_Sandbox_App_ID", replacement: "SQUARE_ENVIRONMENT + SQUARE_APP_ID" },
      "shuttleya.square.environment",
    );
    return "sandbox";
  }

  return "production";
}

function getSquareLocationId() {
  return readCanonicalSquareEnv(
    ["NEXT_PUBLIC_SQUARE_LOCATION_ID", "SQUARE_LOCATION_ID"],
    [{ name: "SQUARE_location_id", replacement: "SQUARE_LOCATION_ID" }],
    "shuttleya.square.location_id",
  );
}

function getSquareAccessToken() {
  const env = getSquareEnvironment();
  if (env === "sandbox") {
    return readCanonicalSquareEnv(
      ["SQUARE_ACCESS_TOKEN"],
      [
        { name: "SQUARE_access_token", replacement: "SQUARE_ACCESS_TOKEN" },
        { name: "SQUARE_sandbox_access_token", replacement: "SQUARE_ACCESS_TOKEN" },
      ],
      "shuttleya.square.access_token",
    );
  }

  return readCanonicalSquareEnv(
    ["SQUARE_ACCESS_TOKEN"],
    [
      { name: "SQUARE_access_token", replacement: "SQUARE_ACCESS_TOKEN" },
      { name: "SQUARE_sandbox_access_token", replacement: "SQUARE_ACCESS_TOKEN" },
    ],
    "shuttleya.square.access_token",
  );
}

async function maybeSendConfirmationEmail(options: {
  to: string;
  orderId: string;
  productTitle: string;
  date: string;
  qty: number;
  pickup: string;
  dropoff: string;
  amountPaid: number;
}) {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.ARGO_FROM_EMAIL?.trim() || process.env.PARR_PRIVATE_FROM_EMAIL?.trim();
  if (!resendKey || !fromEmail) {
    return { sent: false, reason: "Email not configured." };
  }

  const html = `
    <h2>Argo Shuttle Confirmed</h2>
    <p><strong>Order ID:</strong> ${options.orderId}</p>
    <p><strong>Ride:</strong> ${options.productTitle}</p>
    <p><strong>Date:</strong> ${options.date}</p>
    <p><strong>Pickup:</strong> ${options.pickup}</p>
    <p><strong>Drop-off:</strong> ${options.dropoff}</p>
    <p><strong>Seats:</strong> ${options.qty}</p>
    <p><strong>Paid:</strong> $${options.amountPaid.toFixed(2)}</p>
  `;

  const upstream = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [options.to],
      subject: `Argo Shuttle Confirmed (${options.orderId})`,
      html,
    }),
  });

  if (!upstream.ok) {
    const data = await upstream.json().catch(() => null);
    return { sent: false, reason: data?.message || "Resend rejected request." };
  }

  return { sent: true };
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as CreateSquarePaymentBody;
  const route = body.route || "argo";
  const productKey = body.product || "argo-seat";
  const date = (body.date || "").trim();
  const customerName = (body.customerName || "").trim();
  const customerEmail = (body.customerEmail || "").trim();
  const customerPhone = (body.customerPhone || "").trim();
  const pickup = (body.pickup || "").trim();
  const pickupTime = (body.pickupTime || "").trim();
  const sourceId = (body.sourceId || "").trim();

  if (route !== ARGO_ROUTE_KEY || productKey !== ARGO_PRODUCT_ID) {
    return Response.json({ ok: false, error: "Invalid Argo product." }, { status: 400 });
  }

  if (!date || !customerName || !customerEmail || !customerPhone || !pickup || !pickupTime || !sourceId) {
    return Response.json({ ok: false, error: "Date, pickup, pickup window, name, email, phone, and payment are required." }, { status: 400 });
  }

  const qty = Math.min(ARGO_MAX_QTY, Math.max(1, Number(body.qty || 1)));
  const partySize = Math.max(1, Number(body.partySize || qty));
  const requestedPlan = resolveArgoReservation(
    new URLSearchParams({
      c_id: body.decisionMeta?.corridorId || "argo-day-transport",
      r_id: body.decisionMeta?.recommendationId || "argo-8am-seat",
      h_id: body.decisionMeta?.handoffId || "direct-entry",
      pid: productKey,
      dep_ts: `${date}T${pickupTime.includes("10:00 AM") ? "10:00" : "08:00"}:00-06:00`,
      qty: String(qty),
    }),
  );

  if (requestedPlan.status === "product_unavailable" || requestedPlan.status === "invalid_payload") {
    return Response.json({ ok: false, error: "Requested Argo plan is no longer sellable." }, { status: 400 });
  }

  const pricing = {
    totalCents: ARGO_SEAT_PRICE_CENTS * qty,
    amountDueNowCents: ARGO_SEAT_PRICE_CENTS * qty,
    remainingBalanceCents: 0,
  };

  const locationId = getSquareLocationId();
  const accessToken = getSquareAccessToken();
  if (!locationId || !accessToken) {
    return Response.json({ ok: false, error: "Square is not configured." }, { status: 503 });
  }

  const client = new SquareClient({
    token: accessToken,
    environment: getSquareEnvironmentValue(getSquareEnvironment()),
  });

  const paymentResponse = await client.payments.create({
    sourceId,
    idempotencyKey: randomUUID(),
    locationId,
    amountMoney: {
      amount: BigInt(pricing.amountDueNowCents),
      currency: "USD",
    },
    autocomplete: true,
    referenceId: body.decisionMeta?.handoffId || `${route}:${productKey}:${date}`,
    note: [
      `Argo Shuttle Seat for ${date}`,
      `pickup:${pickup}`,
      `pickup_time:${pickupTime}`,
      body.decisionMeta?.handoffId ? `dcc_handoff_id:${body.decisionMeta.handoffId}` : null,
      body.decisionMeta?.recommendationId ? `dcc_recommendation_id:${body.decisionMeta.recommendationId}` : null,
    ]
      .filter(Boolean)
      .join(" | "),
  });

  const payment = paymentResponse.payment;
  if (!payment?.id) {
    return Response.json({ ok: false, error: "Square payment failed." }, { status: 502 });
  }

  const orderId = `${route}_${Date.now()}_${randomUUID().slice(0, 8)}`;
  const orderRecord: StoredOrder = {
    orderId,
    createdAt: new Date().toISOString(),
    route,
    product: productKey,
    productTitle: "Argo Shuttle Seat",
    qty,
    partySize,
    date,
    pickup,
    dropoff: body.dropoff || ARGO_DROP_OFF,
    pickupTime,
    specialRequests: body.specialRequests || null,
    customer: {
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
    },
    pricing: {
      unitPriceCents: ARGO_SEAT_PRICE_CENTS,
      totalCents: pricing.totalCents,
      amountPaidCents: pricing.amountDueNowCents,
      remainingBalanceCents: pricing.remainingBalanceCents,
      currency: "usd",
    },
    status: "paid_in_full",
    payment: {
      provider: "square",
      paymentId: payment.id,
      status: "paid_in_full",
      rawStatus: payment.status || null,
      sourceType: payment.sourceType || null,
    },
  };

  let emailResult: { sent: boolean; reason?: string } = {
    sent: false,
    reason: customerEmail ? "Email not configured." : "No customer email provided.",
  };

  try {
    await writeStoredOrder(orderRecord);
    if (customerEmail) {
      emailResult = await maybeSendConfirmationEmail({
        to: customerEmail,
        orderId,
        productTitle: "Argo Shuttle Seat",
        date,
        qty,
        pickup,
        dropoff: body.dropoff || ARGO_DROP_OFF,
        amountPaid: pricing.amountDueNowCents / 100,
      });
    }
  } catch (error) {
    console.error("argo-post-payment-finalize-failed", {
      orderId,
      paymentId: payment.id,
      route,
      product: productKey,
      date,
      pickup,
      customerEmail,
      message: error instanceof Error ? error.message : "unknown_error",
    });
    return Response.json({
      ok: true,
      orderId,
      paymentStatus: "needs_review",
      totalCents: pricing.totalCents,
      amountPaidCents: pricing.amountDueNowCents,
      remainingBalanceCents: pricing.remainingBalanceCents,
      error: "Payment succeeded but booking storage needs manual review.",
    });
  }

  if (!emailResult.sent && customerEmail) {
    console.error("argo-confirmation-email-failed", {
      orderId,
      paymentId: payment.id,
      route,
      product: productKey,
      date,
      pickup,
      customerEmail,
      message: emailResult.reason || "email_send_failed",
    });
  }

  return Response.json({
    ok: true,
    orderId,
    paymentStatus: "paid_in_full",
    totalCents: pricing.totalCents,
    amountPaidCents: pricing.amountDueNowCents,
    remainingBalanceCents: pricing.remainingBalanceCents,
    email: emailResult,
    paymentId: payment.id,
  });
}
