import { NextRequest, NextResponse } from "next/server";
import { appendCorridorEventDurably } from "@/lib/dcc/telemetry/corridorEvents";
import { appendSatelliteEventDurably } from "@/lib/dcc/satelliteHandoffs";
import { verifySatelliteWebhookToken } from "@/lib/dcc/satelliteHandoffs";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const token = request.headers.get("x-dcc-satellite-token") || request.nextUrl.searchParams.get("token") || null;

  if (!verifySatelliteWebhookToken(body.satelliteId, token)) {
    return NextResponse.json({ ok: false, error: "invalid_webhook_token" }, { status: 401 });
  }

  // 1. Log the booking_opened event in the corridor telemetry
  try {
    await appendCorridorEventDurably({
      corridor_id: body.decision_corridor || "feastly-dinner-night",
      event_name: "booking_opened",
      occurred_at: new Date().toISOString(),
      handoff_id: body.dcc_handoff_id || undefined,
      source_page: body.source_url || undefined,
      target_path: body.destination_url || undefined,
      default_card_slug: body.decision_product || undefined,
      metadata: body.metadata || {},
    });
  } catch (err) {
    console.error("Failed to log booking_opened corridor event:", err);
  }

  // 2. Log the booking_started event in the satellite handoff events
  try {
    await appendSatelliteEventDurably({
      handoffId: body.dcc_handoff_id || `feastly_handoff_${Date.now()}`,
      satelliteId: body.satelliteId || "feastly",
      eventType: "booking_started",
      occurredAt: new Date().toISOString(),
      source: "satellite",
      sourcePath: body.source_url || undefined,
      attribution: {
        sourcePage: body.source_url || undefined,
      },
    });
  } catch (err) {
    console.error("Failed to log booking_started satellite event:", err);
  }

  // Return session token and the checkout URL
  const checkoutUrl = `/checkout?route=feastly&product=feastly-booking-fee&handoffId=${body.dcc_handoff_id || ""}`;

  return NextResponse.json({
    ok: true,
    dccHandoffId: body.dcc_handoff_id,
    sessionToken: `feastly_session_${Date.now()}`,
    checkoutUrl,
  });
}
