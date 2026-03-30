import { NextRequest } from "next/server";
import { getCheckoutPricing, isCheckoutPaymentsEnabled } from "@/lib/checkoutProducts";

export const runtime = "nodejs";

type CreateIntentBody = {
  currency?: string;
  route?: string;
  product?: string;
  qty?: number;
  partySize?: number;
  date?: string;
  pickup?: string;
  customerEmail?: string;
};

export async function POST(req: NextRequest) {
  const body = (await req.json()) as CreateIntentBody;
  const route = body.route || "argo";

  if (!isCheckoutPaymentsEnabled(route)) {
    return Response.json(
      {
        ok: false,
        error: "Payments are disabled for this route.",
      },
      { status: 503 },
    );
  }

  const pricing = getCheckoutPricing(route, body.product, Number(body.qty || 1));
  if (!pricing) {
    return Response.json({ ok: false, error: "Invalid route or product." }, { status: 400 });
  }

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

  const params = new URLSearchParams();
  params.set("amount", String(Math.round(pricing.amountDueNowCents)));
  params.set("currency", (body.currency || "usd").toLowerCase());
  params.set("automatic_payment_methods[enabled]", "true");
  params.set("metadata[route]", route);
  params.set("metadata[product]", body.product || "argo-seat");
  params.set("metadata[qty]", String(Math.max(1, Number(body.qty || 1))));
  params.set("metadata[party_size]", String(Math.max(1, Number(body.partySize || body.qty || 1))));
  params.set("metadata[date]", body.date || "");
  params.set("metadata[pickup]", body.pickup || "Denver");
  params.set("metadata[customer_email]", body.customerEmail || "");
  params.set("metadata[total_cents]", String(pricing.totalCents));
  params.set("metadata[amount_due_now_cents]", String(pricing.amountDueNowCents));
  params.set("metadata[remaining_balance_cents]", String(pricing.remainingBalanceCents));
  params.set("metadata[deposit_percentage]", String(pricing.depositPercentage));

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
    amountDueNowCents: pricing.amountDueNowCents,
    totalCents: pricing.totalCents,
    remainingBalanceCents: pricing.remainingBalanceCents,
  });
}
