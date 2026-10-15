import { NextRequest, NextResponse } from "next/server";
import { LicensePlan } from "@/lib/billing/licenses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PLAN_DETAILS: Record<LicensePlan, { name: string; amountCents: number; interval: "month" | "year" | "one_time" }> = {
  venue_monthly: { name: "Venue Widget Pro (Monthly)", amountCents: 3900, interval: "month" },
  venue_annual: { name: "Venue Widget Pro (Annual Pass)", amountCents: 34900, interval: "year" },
  api_builder: { name: "Coordinate Intelligence API - Builder", amountCents: 4900, interval: "month" },
  api_pro: { name: "Coordinate Intelligence API - Pro", amountCents: 19900, interval: "month" },
  sandbox: { name: "Free Sandbox", amountCents: 0, interval: "one_time" },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const plan = (body.plan as LicensePlan) || "venue_monthly";
    const email = (body.email || "").trim().toLowerCase();
    const domain = (body.domain || "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "Valid email address is required" }, { status: 400 });
    }

    const details = PLAN_DETAILS[plan];
    if (!details) {
      return NextResponse.json({ ok: false, error: "Invalid plan selected" }, { status: 400 });
    }

    const origin = request.nextUrl.origin;
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";

    // Strict Production Enforcement: Never permit unverified key issuance
    if (!stripeKey || stripeKey.includes("placeholder") || stripeKey === "") {
      if (isProduction) {
        console.error("FATAL: STRIPE_SECRET_KEY is missing in production environment");
        return NextResponse.json(
          { ok: false, error: "Payment processor is currently undergoing maintenance. Please contact support." },
          { status: 503 },
        );
      }

      // Non-production fallback only if explicitly enabled for local testing
      if (process.env.ALLOW_DEV_MOCK_CHECKOUT === "true") {
        return NextResponse.json({
          ok: false,
          error: "Stripe test mode active. Set STRIPE_SECRET_KEY=sk_test_... in .env.local to execute authenticated checkout tests.",
        }, { status: 400 });
      }

      return NextResponse.json(
        { ok: false, error: "STRIPE_SECRET_KEY is required to initialize checkout sessions." },
        { status: 500 },
      );
    }

    // Call Stripe Checkout API securely
    const params = new URLSearchParams();
    params.append("payment_method_types[]", "card");
    params.append("mode", "subscription");
    params.append("customer_email", email);
    params.append("line_items[0][price_data][currency]", "usd");
    params.append("line_items[0][price_data][product_data][name]", details.name);
    params.append("line_items[0][price_data][unit_amount]", String(details.amountCents));
    params.append("line_items[0][price_data][recurring][interval]", details.interval === "year" ? "year" : "month");
    params.append("line_items[0][quantity]", "1");
    params.append("metadata[plan]", plan);
    params.append("metadata[domain]", domain);
    params.append("metadata[email]", email);
    params.append("subscription_data[metadata][plan]", plan);
    params.append("subscription_data[metadata][domain]", domain);
    params.append("subscription_data[metadata][email]", email);
    params.append("success_url", `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}&domain=${encodeURIComponent(domain)}`);
    params.append("cancel_url", `${origin}/pricing?cancelled=1`);

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!stripeRes.ok) {
      const errBody = await stripeRes.text();
      console.error("Stripe session creation failed:", stripeRes.status, errBody);
      return NextResponse.json({ ok: false, error: "Payment processor error. Check payment details." }, { status: 502 });
    }

    const session = await stripeRes.json();
    return NextResponse.json({ ok: true, checkoutUrl: session.url });
  } catch (err) {
    console.error("Billing checkout exception:", err);
    return NextResponse.json({ ok: false, error: "Internal checkout initialization failure" }, { status: 500 });
  }
}
