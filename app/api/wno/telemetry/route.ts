import { NextRequest, NextResponse } from "next/server";
import { appendCorridorEventDurably } from "@/lib/dcc/telemetry/corridorEvents";

const MAX_TEXT = 160;
const CANONICAL_EVENTS = new Set([
  "landing_viewed",
  "product_opened",
  "booking_opened",
  "lead_captured",
]);

function clean(value: unknown, max = MAX_TEXT) {
  return typeof value === "string" ? value.trim().slice(0, max) : undefined;
}

function cleanEmail(value: unknown) {
  const email = clean(value, 254)?.toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return undefined;
  return email;
}

function mapEventName(eventName: string) {
  if (CANONICAL_EVENTS.has(eventName)) return eventName;
  if (eventName.includes("booking") || eventName.includes("fareharbor")) return "booking_opened";
  if (eventName.includes("recommendation") && eventName.includes("click")) return "recommendation_clicked";
  if (eventName.includes("bundle") && eventName.includes("click")) return "recommendation_clicked";
  if (eventName.includes("chooser") && eventName.includes("completed")) return "recommendation_rendered";
  if (eventName.includes("bundle") && eventName.includes("shown")) return "recommendation_rendered";
  if (eventName.includes("chooser") || eventName.includes("cta") || eventName.includes("click")) return "cta_clicked_primary";
  return "page_viewed";
}

export async function POST(request: NextRequest) {
  try {
    const raw = await request.text();
    if (raw.length > 8000) return NextResponse.json({ ok: false }, { status: 413 });
    const body = JSON.parse(raw || "{}");
    const originalEventName = clean(body.eventName, 64);
    if (!originalEventName) {
      return NextResponse.json({ ok: false, error: "missing_event" }, { status: 400 });
    }

    const sessionId = clean(body.sessionId, 96);
    if (!sessionId || !sessionId.startsWith("wno_")) {
      return NextResponse.json({ ok: false, error: "invalid_session" }, { status: 400 });
    }

    const email = originalEventName === "lead_captured" ? cleanEmail(body.email) : undefined;
    if (originalEventName === "lead_captured" && !email) {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }

    const mappedEventName = mapEventName(originalEventName);
    const stored = await appendCorridorEventDurably({
      corridor_id: "wno-commerce",
      event_name: mappedEventName as
        | "landing_viewed"
        | "product_opened"
        | "booking_opened"
        | "lead_captured"
        | "recommendation_clicked"
        | "recommendation_rendered"
        | "cta_clicked_primary"
        | "page_viewed",
      session_id: sessionId,
      source_page: clean(body.sourcePage),
      landing_path: clean(body.landingPath),
      target_path: clean(body.targetPath),
      clicked_product_slug: clean(body.productSlug),
      route_target: clean(body.operatorId),
      subtype: clean(body.briefType || body.consent, 80),
      metadata: {
        surface: "wno-commerce",
        original_event_name: originalEventName,
        operator_id: clean(body.operatorId),
        variant_label: clean(body.variantLabel),
        item_id: clean(body.itemId),
        flow_id: clean(body.flowId),
        cta_location: clean(body.ctaLocation),
        cta_label: clean(body.ctaLabel),
        signal: clean(body.signal),
        signup_source: clean(body.signupSource),
        consent: clean(body.consent, 80),
        email,
      },
    });

    return NextResponse.json({ ok: stored.ok });
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }
}
