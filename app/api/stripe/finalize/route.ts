import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextRequest } from "next/server";
import { getArgoProduct } from "@/lib/argoProducts";

export const runtime = "nodejs";

type FinalizeBody = {
  route?: string;
  product?: string;
  date?: string;
  qty?: number;
  pickup?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  paymentIntentId?: string;
};

type StripeIntent = {
  id: string;
  status: string;
  amount: number;
  currency: string;
};

async function fetchStripeIntent(intentId: string, key: string): Promise<StripeIntent> {
  const upstream = await fetch(`https://api.stripe.com/v1/payment_intents/${intentId}`, {
    headers: {
      Authorization: `Bearer ${key}`,
    },
    cache: "no-store",
  });

  const data = await upstream.json();
  if (!upstream.ok) {
    throw new Error(data?.error?.message || "Unable to verify Stripe PaymentIntent.");
  }

  return data as StripeIntent;
}

async function maybeSendConfirmationEmail({
  to,
  orderId,
  productTitle,
  date,
  qty,
  pickup,
  total,
}: {
  to: string;
  orderId: string;
  productTitle: string;
  date: string;
  qty: number;
  pickup: string;
  total: number;
}) {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.ARGO_FROM_EMAIL?.trim();
  if (!resendKey || !fromEmail) return { sent: false, reason: "Email not configured." };

  const html = `
    <h2>Mighty Argo Shuttle Confirmation</h2>
    <p><strong>Order ID:</strong> ${orderId}</p>
    <p><strong>Product:</strong> ${productTitle}</p>
    <p><strong>Date:</strong> ${date}</p>
    <p><strong>Pickup:</strong> ${pickup}</p>
    <p><strong>Quantity:</strong> ${qty}</p>
    <p><strong>Total:</strong> $${total.toFixed(2)}</p>
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
      subject: `Mighty Argo Shuttle Booking Confirmed (${orderId})`,
      html,
    }),
  });

  if (!upstream.ok) {
    const data = await upstream.json().catch(() => null);
    return {
      sent: false,
      reason: data?.message || "Resend rejected request.",
    };
  }

  return { sent: true };
}

export async function POST(req: NextRequest) {
  if (process.env.ENABLE_ARGO_PAYMENTS !== "true") {
    return Response.json(
      {
        ok: false,
        error: "Argo order finalization is disabled (prelaunch).",
      },
      { status: 503 },
    );
  }

  const body = (await req.json()) as FinalizeBody;

  if (body.route !== "argo") {
    return Response.json({ ok: false, error: "Only route=argo is supported." }, { status: 400 });
  }

  const product = getArgoProduct(body.product);
  if (!product || !body.date) {
    return Response.json({ ok: false, error: "Missing product or date." }, { status: 400 });
  }

  const qty = Math.min(product.maxQty, Math.max(1, Number(body.qty || 1)));
  const totalCents = product.priceCents * qty;
  const paymentIntentId = (body.paymentIntentId || "").trim();
  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!stripeKey) {
    return Response.json(
      {
        ok: false,
        error: "Stripe is not configured.",
      },
      { status: 503 }
    );
  }

  if (!paymentIntentId || paymentIntentId.startsWith("pi_mock_")) {
    return Response.json(
      { ok: false, error: "A live Stripe PaymentIntent is required." },
      { status: 400 }
    );
  }

  const intent = await fetchStripeIntent(paymentIntentId, stripeKey);
  if (intent.status !== "succeeded") {
    return Response.json(
      { ok: false, error: `PaymentIntent not succeeded (status: ${intent.status}).` },
      { status: 400 },
    );
  }
  const paymentStatus = intent.status;

  const orderId = `argo_${Date.now()}_${randomUUID().slice(0, 8)}`;
  const orderRecord = {
    orderId,
    createdAt: new Date().toISOString(),
    route: "argo",
    product: product.key,
    productTitle: product.title,
    qty,
    date: body.date,
    pickup: body.pickup || "Denver",
    customer: {
      name: body.customerName || null,
      email: body.customerEmail || null,
      phone: body.customerPhone || null,
    },
    pricing: {
      unitPriceCents: product.priceCents,
      totalCents,
      currency: "usd",
    },
    payment: {
      provider: "stripe",
      paymentIntentId: paymentIntentId || null,
      status: paymentStatus,
    },
  };

  const outDir = path.join(process.cwd(), "data", "orders", "argo");
  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, `${orderId}.json`), JSON.stringify(orderRecord, null, 2), "utf8");

  let emailResult: { sent: boolean; reason?: string } = {
    sent: false,
    reason: "No customer email provided.",
  };
  if (body.customerEmail) {
    emailResult = await maybeSendConfirmationEmail({
      to: body.customerEmail,
      orderId,
      productTitle: product.title,
      date: body.date,
      qty,
      pickup: body.pickup || "Denver",
      total: totalCents / 100,
    });
  }

  return Response.json({
    ok: true,
    orderId,
    paymentStatus,
    totalCents,
    email: emailResult,
  });
}
