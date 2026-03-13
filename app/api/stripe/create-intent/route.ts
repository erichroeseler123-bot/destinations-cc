import { NextRequest } from "next/server";

export const runtime = "nodejs";

type CreateIntentBody = {
  amountCents?: number;
  currency?: string;
  route?: string;
  product?: string;
  qty?: number;
  date?: string;
  pickup?: string;
  customerEmail?: string;
};

function mockIntentId() {
  return `pi_mock_${Date.now()}`;
}

export async function POST(req: NextRequest) {
  if (process.env.ENABLE_ARGO_PAYMENTS !== "true") {
    return Response.json(
      {
        ok: false,
        error: "Argo payments are disabled (prelaunch).",
      },
      { status: 503 },
    );
  }

  const body = (await req.json()) as CreateIntentBody;
  const amountCents = Math.max(0, Number(body.amountCents || 0));

  if (!amountCents) {
    return Response.json({ ok: false, error: "Invalid amount." }, { status: 400 });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!stripeKey) {
    return Response.json({
      ok: true,
      mode: "mock",
      paymentIntentId: mockIntentId(),
      clientSecret: null,
      message: "STRIPE_SECRET_KEY not set. Using mock payment intent.",
    });
  }

  const params = new URLSearchParams();
  params.set("amount", String(Math.round(amountCents)));
  params.set("currency", (body.currency || "usd").toLowerCase());
  params.set("automatic_payment_methods[enabled]", "true");
  params.set("metadata[route]", body.route || "argo");
  params.set("metadata[product]", body.product || "argo-seat");
  params.set("metadata[qty]", String(Math.max(1, Number(body.qty || 1))));
  params.set("metadata[date]", body.date || "");
  params.set("metadata[pickup]", body.pickup || "Denver");
  params.set("metadata[customer_email]", body.customerEmail || "");

  const upstream = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
    cache: "no-store",
  });

  const data = await upstream.json();
  if (!upstream.ok) {
    return Response.json(
      { ok: false, error: data?.error?.message || "Stripe create intent failed." },
      { status: upstream.status },
    );
  }

  return Response.json({
    ok: true,
    mode: "live",
    paymentIntentId: data.id as string,
    clientSecret: data.client_secret as string,
  });
}
