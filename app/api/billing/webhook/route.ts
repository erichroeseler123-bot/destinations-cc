import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createVerifiedLicense, updateLicenseStatus, LicensePlan } from "@/lib/billing/licenses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function verifyStripeSignature(payload: string, header: string | null, secret: string): boolean {
  if (!header || !secret) return false;
  try {
    const parts = header.split(",").reduce((acc, part) => {
      const [key, val] = part.split("=");
      if (key && val) acc[key.trim()] = val.trim();
      return acc;
    }, {} as Record<string, string>);

    const timestamp = parts["t"];
    const signature = parts["v1"];
    if (!timestamp || !signature) return false;

    // Check tolerance (5 minutes)
    const timeNum = parseInt(timestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timeNum) > 300) return false;

    const signedPayload = `${timestamp}.${payload}`;
    const expected = crypto.createHmac("sha256", secret).update(signedPayload, "utf8").digest("hex");

    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signatureHeader = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (webhookSecret && !webhookSecret.includes("placeholder")) {
    const valid = verifyStripeSignature(rawBody, signatureHeader, webhookSecret);
    if (!valid) {
      console.error("Invalid Stripe webhook signature");
      return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 400 });
    }
  } else if (process.env.NODE_ENV === "production") {
    console.error("STRIPE_WEBHOOK_SECRET is missing in production");
    return NextResponse.json({ ok: false, error: "Webhook secret unconfigured" }, { status: 500 });
  }

  let event: any = null;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  console.log(`Processing Stripe webhook event: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const email = session.customer_details?.email || session.customer_email || session.metadata?.email;
        const plan = (session.metadata?.plan as LicensePlan) || "venue_monthly";
        const domain = session.metadata?.domain || "";
        const customerId = session.customer;
        const subscriptionId = session.subscription;

        if (email) {
          const isLive = event.livemode === true;
          const license = await createVerifiedLicense({
            email,
            plan,
            authorizedDomains: domain ? [domain] : [],
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            livemode: isLive,
          });
          console.log(`✓ Active license generated for ${email} (${license.key}) on plan ${plan} [livemode: ${isLive}]`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object;
        const status = sub.status === "active" ? "active" : sub.status === "past_due" ? "past_due" : "cancelled";
        const updated = await updateLicenseStatus(sub.id, status);
        if (updated) {
          console.log(`✓ Subscription ${sub.id} status updated to ${status}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const updated = await updateLicenseStatus(sub.id, "cancelled");
        if (updated) {
          console.log(`✓ Subscription ${sub.id} cancelled; license revoked.`);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        if (invoice.subscription) {
          await updateLicenseStatus(invoice.subscription, "past_due");
          console.log(`⚠ Invoice payment failed for subscription ${invoice.subscription}; status set to past_due`);
        }
        break;
      }

      default:
        // Ignore unhandled events
        break;
    }

    return NextResponse.json({ received: true, event: event.type });
  } catch (err) {
    console.error("Error executing Stripe webhook action:", err);
    return NextResponse.json({ ok: false, error: "Webhook handler failed" }, { status: 500 });
  }
}
