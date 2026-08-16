import { NextRequest, NextResponse } from "next/server";
import { appendCorridorEventDurably } from "@/lib/dcc/telemetry/corridorEvents";
import { sanitizeDccTravelerContext } from "@/lib/dcc/travelerContext";

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

function cleanBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

function cleanNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cleanStringArray(value: unknown, maxItems = 12) {
  if (!Array.isArray(value)) return undefined;
  const values = value.map((item) => clean(item, 160)).filter((item): item is string => Boolean(item)).slice(0, maxItems);
  return values.length ? values : undefined;
}

function cleanChooserInput(value: unknown) {
  if (!isRecord(value)) return undefined;
  return {
    planningWindow: clean(value.planningWindow),
    availableTime: clean(value.availableTime),
    transportation: clean(value.transportation),
    groupStyle: clean(value.groupStyle),
    mixedAges: clean(value.mixedAges, 32),
    historicalInterest: clean(value.historicalInterest),
  };
}

function cleanRecommendationOutput(value: unknown) {
  if (!isRecord(value)) return undefined;
  return {
    version: cleanNumber(value.version),
    destination: clean(value.destination, 80),
    primaryProduct: clean(value.primaryProduct),
    secondaryProduct: clean(value.secondaryProduct),
    bundleId: clean(value.bundleId, 64),
    bundleProducts: cleanStringArray(value.bundleProducts, 4),
    noFit: cleanBoolean(value.noFit),
    primaryReasons: cleanStringArray(value.primaryReasons, 4),
    primaryCautions: cleanStringArray(value.primaryCautions, 3),
  };
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
        product_name: clean(body.productName),
        chooser_recommendation: clean(body.chooserRecommendation || body.primary_recommendation),
        recommendation_match: cleanBoolean(body.recommendationMatch ?? body.recommendation_match),
        recommendation_rank: clean(body.recommendationRank || body.recommendation_rank, 32),
        chooser_to_booking_ms: cleanNumber(body.chooserToBookingMs ?? body.chooser_to_booking_ms),
        bundle_id: clean(body.bundleId || body.bundle_id, 64),
        bundle_products: clean(body.bundleProducts || body.bundle_products, 320),
        bundle_position: cleanNumber(body.bundlePosition ?? body.bundle_position),
        planning_window: clean(body.planningWindow || body.planning_window),
        available_time: clean(body.availableTime || body.available_time),
        transportation: clean(body.transportation),
        group_style: clean(body.groupStyle || body.group_style),
        mixed_ages: clean(body.mixedAges || body.mixed_ages, 32),
        historical_interest: clean(body.historicalInterest || body.historical_interest),
        live_period: clean(body.livePeriod || body.live_period, 32),
        live_rain_risk: clean(body.liveRainRisk || body.live_rain_risk, 32),
        live_music_signal: cleanBoolean(body.liveMusicSignal ?? body.live_music_signal),
        live_outdoor_friendly: cleanBoolean(body.liveOutdoorFriendly ?? body.live_outdoor_friendly),
        primary_recommendation: clean(body.primaryRecommendation || body.primary_recommendation),
        secondary_recommendation: clean(body.secondaryRecommendation || body.secondary_recommendation),
        no_fit: cleanBoolean(body.noFit ?? body.no_fit),
        dcc_context: sanitizeDccTravelerContext(body.dccContext),
        chooser_input: cleanChooserInput(body.chooserInput),
        recommendation_output: cleanRecommendationOutput(body.recommendationOutput),
      },
    });

    return NextResponse.json({ ok: stored.ok });
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }
}
