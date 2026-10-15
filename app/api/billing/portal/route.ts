import { NextRequest, NextResponse } from "next/server";
import { findLicense } from "@/lib/billing/licenses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const key = body.key || body.licenseKey;
    const email = body.email;

    const license = await findLicense(key || email);
    if (!license || !license.stripeCustomerId) {
      return NextResponse.json(
        { ok: false, error: "No active Stripe customer found for this license or email." },
        { status: 404 },
      );
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ ok: false, error: "Stripe billing unconfigured" }, { status: 500 });
    }

    const origin = request.nextUrl.origin;
    const params = new URLSearchParams();
    params.append("customer", license.stripeCustomerId);
    params.append("return_url", `${origin}/pricing`);

    const stripeRes = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!stripeRes.ok) {
      const err = await stripeRes.text();
      console.error("Stripe portal creation failed:", err);
      return NextResponse.json({ ok: false, error: "Unable to create portal session" }, { status: 502 });
    }

    const portal = await stripeRes.json();
    return NextResponse.json({ ok: true, portalUrl: portal.url });
  } catch (err) {
    console.error("Billing portal error:", err);
    return NextResponse.json({ ok: false, error: "Portal error" }, { status: 500 });
  }
}
