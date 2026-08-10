import { NextRequest, NextResponse } from "next/server";
import { appendCorridorEventDurably } from "@/lib/dcc/telemetry/corridorEvents";

const ALLOWED_EVENTS = new Set(["landing_viewed", "product_opened", "booking_opened"]);
const MAX_TEXT = 160;

function clean(value: unknown, max = MAX_TEXT) {
  return typeof value === "string" ? value.trim().slice(0, max) : undefined;
}

export async function POST(request: NextRequest) {
  try {
    const raw = await request.text();
    if (raw.length > 6000) return NextResponse.json({ ok: false }, { status: 413 });
    const body = JSON.parse(raw || "{}");
    const eventName = clean(body.eventName, 40);
    if (!eventName || !ALLOWED_EVENTS.has(eventName)) {
      return NextResponse.json({ ok: false, error: "unsupported_event" }, { status: 400 });
    }

    const sessionId = clean(body.sessionId, 96);
    if (!sessionId || !sessionId.startsWith("wno_")) {
      return NextResponse.json({ ok: false, error: "invalid_session" }, { status: 400 });
    }

    const stored = await appendCorridorEventDurably({
      corridor_id: "wno-commerce",
      event_name: eventName as "landing_viewed" | "product_opened" | "booking_opened",
      session_id: sessionId,
      source_page: clean(body.sourcePage),
      landing_path: clean(body.landingPath),
      target_path: clean(body.targetPath),
      clicked_product_slug: clean(body.productSlug),
      route_target: clean(body.operatorId),
      metadata: {
        surface: "wno-commerce",
        operator_id: clean(body.operatorId),
        variant_label: clean(body.variantLabel),
        item_id: clean(body.itemId),
        flow_id: clean(body.flowId),
      },
    });

    return NextResponse.json({ ok: stored.ok });
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }
}
