import { randomUUID } from "crypto";
import { NextRequest } from "next/server";
import { SquareClient, SquareEnvironment } from "square";
import {
  getBalanceDueAt,
  getCheckoutPricing,
  getCheckoutProduct,
  getCheckoutRouteConfig,
} from "@/lib/checkoutProducts";
import { writeStoredOrder } from "@/lib/orders";
import { getParrPrivateAvailability } from "@/lib/parrPrivateAvailability";
import { getParrSharedAvailability } from "@/lib/parrSharedAvailability";
import {
  getSquareAccessToken,
  getSquareApplicationId,
  getSquareEnvironment,
  getSquareLocationId,
} from "@/lib/squareConfig";

export const runtime = "nodejs";

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
  sourceId?: string;
};

type AvailabilityRow = {
  productKey: string;
  total: number;
  booked: number;
  remaining: number;
  available: boolean;
};

function getSquareEnvironmentValue(value?: string) {
  return value?.toLowerCase() === "production"
    ? SquareEnvironment.Production
    : SquareEnvironment.Sandbox;
}

function logParrNeedsReview(
  stage: string,
  details: Record<string, string | number | boolean | null | undefined>,
) {
  console.error("parr-needs-review", {
    stage,
    ...details,
  });
}

function getRouteLabels(route: string, qty: number) {
  if (route === "parr-shared") {
    return {
      heading: "Party at Red Rocks Shared Shuttle Confirmation",
      subject: `Party at Red Rocks Shared Shuttle Confirmed`,
      quantityLabel: qty === 1 ? "Seat" : "Seats",
    };
  }

  return {
    heading: "Party at Red Rocks Private Ride Confirmation",
    subject: `Party at Red Rocks Private Ride Confirmed`,
    quantityLabel: qty === 1 ? "Vehicle" : "Vehicles",
  };
}

async function maybeSendConfirmationEmail({
  to,
  orderId,
  route,
  productTitle,
  date,
  qty,
  partySize,
  pickup,
  dropoff,
  amountPaid,
  remainingBalance,
  total,
  balanceDueAt,
}: {
  to: string;
  orderId: string;
  route: string;
  productTitle: string;
  date: string;
  qty: number;
  partySize: number;
  pickup: string;
  dropoff: string;
  amountPaid: number;
  remainingBalance: number;
  total: number;
  balanceDueAt?: string | null;
}) {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail =
    process.env.PARR_PRIVATE_FROM_EMAIL?.trim() ||
    process.env.ARGO_FROM_EMAIL?.trim();
  if (resendKey == null || resendKey === "" || fromEmail == null || fromEmail === "") {
    return { sent: false, reason: "Email not configured." };
  }

  const labels = getRouteLabels(route, qty);
  const balanceMarkup = balanceDueAt
    ? `<p><strong>Balance due:</strong> ${balanceDueAt}</p>`
    : "";
  const balanceLinkMarkup =
    remainingBalance > 0
      ? `<p><a href="https://www.destinationcommandcenter.com/pay-balance/${orderId}">Pay remaining balance</a></p>`
      : "";
  const html = `
    <h2>${labels.heading}</h2>
    <p><strong>Order ID:</strong> ${orderId}</p>
    <p><strong>Product:</strong> ${productTitle}</p>
    <p><strong>Date:</strong> ${date}</p>
    <p><strong>Pickup:</strong> ${pickup}</p>
    <p><strong>Drop-off:</strong> ${dropoff}</p>
    <p><strong>${labels.quantityLabel}:</strong> ${qty}</p>
    <p><strong>Party Size:</strong> ${partySize}</p>
    <p><strong>Total:</strong> $${total.toFixed(2)}</p>
    <p><strong>Paid now:</strong> $${amountPaid.toFixed(2)}</p>
    <p><strong>Remaining balance:</strong> $${remainingBalance.toFixed(2)}</p>
    ${balanceMarkup}
    ${balanceLinkMarkup}
  `;

  const upstream = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [to],
      subject: `${labels.subject} (${orderId})`,
      html,
    }),
  });

  if (upstream.ok === false) {
    const data = await upstream.json().catch(() => null);
    return { sent: false, reason: data?.message || "Resend rejected request." };
  }

  return { sent: true };
}

async function getAvailabilityForRoute(route: string, date: string): Promise<AvailabilityRow[]> {
  if (route === "parr-shared") {
    return getParrSharedAvailability(date);
  }
  return getParrPrivateAvailability(date);
}

export async function POST(req: NextRequest) {
  const appId = getSquareApplicationId();
  const locationId = getSquareLocationId();
  const accessToken = getSquareAccessToken();

  if (appId == null || appId === "" || locationId == null || locationId === "" || accessToken == null || accessToken === "") {
    return Response.json(
      { ok: false, error: "Square is not configured." },
      { status: 503 },
    );
  }

  const body = (await req.json()) as CreateSquarePaymentBody;
  const route = body.route || "parr-private";
  const routeConfig = getCheckoutRouteConfig(route);
  const product = getCheckoutProduct(body.product);
  const customerName = (body.customerName || "").trim();
  const customerPhone = (body.customerPhone || "").trim();
  const pickup = (body.pickup || "").trim();
  const isSupportedRoute = ["parr-private", "parr-shared"].includes(route);
  const hasDate = typeof body.date === "string" && body.date.trim() !== "";
  const validProduct = product != null && product.route === route;

  if (isSupportedRoute === false || routeConfig == null || validProduct === false || hasDate === false) {
    return Response.json({ ok: false, error: "Invalid route, product, or date." }, { status: 400 });
  }

  if (customerName === "" || customerPhone === "" || pickup === "") {
    return Response.json(
      { ok: false, error: "Name, phone, pickup, and date are required." },
      { status: 400 },
    );
  }

  const sourceId = (body.sourceId || "").trim();
  if (sourceId === "") {
    return Response.json({ ok: false, error: "Missing Square payment token." }, { status: 400 });
  }

  const qty = Math.min(product.maxQty, Math.max(1, Number(body.qty || 1)));
  const partySize =
    product.kind === "seat"
      ? qty
      : Math.min(product.maxPassengers || 24, Math.max(1, Number(body.partySize || 1)));
  const pricing = getCheckoutPricing(route, product.key, qty);
  if (pricing == null) {
    return Response.json({ ok: false, error: "Unable to price this booking." }, { status: 400 });
  }

  const totalCents = pricing.totalCents;
  const amountPaidCents = pricing.amountDueNowCents;
  const remainingBalanceCents = pricing.remainingBalanceCents;
  const availability = await getAvailabilityForRoute(route, body.date || "");
  const row = availability.find((item) => item.productKey === product.key) || null;
  const inventoryMessage = product.kind === "seat"
    ? "Those seats are no longer available for this date."
    : "That vehicle is no longer available for this date.";

  if (row == null || row.available === false || row.remaining < qty) {
    return Response.json({ ok: false, error: inventoryMessage }, { status: 409 });
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
      amount: BigInt(amountPaidCents),
      currency: "USD",
    },
    autocomplete: true,
    referenceId: `${route}:${product.key}:${body.date}`,
    note: `${product.title} for ${body.date}`,
  });

  const payment = paymentResponse.payment;
  if (payment?.id == null || payment.id === "") {
    return Response.json({ ok: false, error: "Square payment failed." }, { status: 502 });
  }

  const balanceDueAt = getBalanceDueAt(body.date || "", routeConfig.balanceDueHours);
  const bookingStatus = remainingBalanceCents > 0 ? "deposit_paid" : "paid_in_full";
  const orderId = `${route}_${Date.now()}_${randomUUID().slice(0, 8)}`;
  const orderRecord = {
    orderId,
    createdAt: new Date().toISOString(),
    route,
    product: product.key,
    productTitle: product.title,
    qty,
    partySize,
    date: body.date,
    pickup,
    dropoff: body.dropoff || routeConfig.defaultDropoff || null,
    pickupTime: body.pickupTime || null,
    specialRequests: body.specialRequests || null,
    customer: {
      name: customerName,
      email: body.customerEmail || null,
      phone: customerPhone,
    },
    pricing: {
      unitPriceCents: product.priceCents,
      totalCents,
      amountPaidCents,
      remainingBalanceCents,
      currency: "usd",
    },
    status: bookingStatus,
    balanceDueAt,
    payment: {
      provider: "square",
      paymentId: payment.id,
      status: bookingStatus,
      rawStatus: payment.status || null,
      sourceType: payment.sourceType || null,
    },
  };

  let emailResult: { sent: boolean; reason?: string } = {
    sent: false,
    reason: "No customer email provided.",
  };

  try {
    await writeStoredOrder(orderRecord);

    if (typeof body.customerEmail === "string" && body.customerEmail.trim() !== "") {
      emailResult = await maybeSendConfirmationEmail({
        to: body.customerEmail,
        orderId,
        route,
        productTitle: product.title,
        date: body.date || "",
        qty,
        partySize,
        pickup,
        dropoff: body.dropoff || routeConfig.defaultDropoff || "",
        amountPaid: amountPaidCents / 100,
        remainingBalance: remainingBalanceCents / 100,
        total: totalCents / 100,
        balanceDueAt,
      });
    }
  } catch (error) {
    logParrNeedsReview("post_payment_finalize_failed", {
      orderId,
      paymentId: payment.id,
      route,
      product: product.key,
      date: body.date,
      pickup,
      customerPhone,
      message: error instanceof Error ? error.message : "unknown_error",
    });

    return Response.json({
      ok: true,
      orderId,
      paymentStatus: "needs_review",
      totalCents,
      amountPaidCents,
      remainingBalanceCents,
      balanceDueAt,
      error: "Payment succeeded but this booking needs manual review.",
      paymentId: payment.id,
    });
  }

  if (emailResult.sent === false && typeof body.customerEmail === "string" && body.customerEmail.trim() !== "") {
    logParrNeedsReview("confirmation_email_failed", {
      orderId,
      paymentId: payment.id,
      route,
      product: product.key,
      date: body.date,
      pickup,
      customerPhone,
      message: emailResult.reason || "email_send_failed",
    });
  }

  return Response.json({
    ok: true,
    orderId,
    paymentStatus: bookingStatus,
    totalCents,
    amountPaidCents,
    remainingBalanceCents,
    balanceDueAt,
    email: emailResult,
    paymentId: payment.id,
  });
}
