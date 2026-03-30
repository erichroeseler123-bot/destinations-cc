import { NextRequest, NextResponse } from "next/server";
import {
  appendSatelliteEvent,
  SatelliteEventPayloadSchema,
  verifySatelliteWebhookToken,
} from "@/lib/dcc/satelliteHandoffs";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = SatelliteEventPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const token =
    request.headers.get("x-dcc-satellite-token") ||
    request.nextUrl.searchParams.get("token") ||
    null;

  if (!verifySatelliteWebhookToken(parsed.data.satelliteId, token)) {
    return NextResponse.json({ ok: false, error: "invalid_webhook_token" }, { status: 401 });
  }

  let event;
  try {
    event = appendSatelliteEvent(parsed.data);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "event_storage_failed",
        message: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      handoffId: event.handoffId,
      satelliteId: event.satelliteId,
      eventId: event.eventId,
      receivedAt: event.receivedAt,
    },
    { status: 200 }
  );
}
