import { NextRequest, NextResponse } from "next/server";
import {
  recordTelemetryEvent,
  getTelemetrySummary,
  getRecentTelemetryEvents,
  type TelemetryEventPayload,
} from "../../../../lib/telemetryStore";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const raw = await request.text();
    let payload: TelemetryEventPayload = {};

    try {
      payload = JSON.parse(raw);
    } catch {
      // Body was not JSON; proceed with raw text if any
    }

    // 1. Record event locally in JFD telemetry store
    if (payload && typeof payload === "object") {
      recordTelemetryEvent(payload);
    }

    // 2. Fire-and-forget relay to upstream DCC telemetry endpoint if available
    const dccOrigin = process.env.DCC_ORIGIN || "https://www.destinationcommandcenter.com";
    try {
      fetch(`${dccOrigin}/api/network/telemetry`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: raw,
      }).catch(() => undefined);
    } catch {
      // Silently ignore upstream connection or certificate failures
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Math.min(200, Math.max(1, parseInt(limitParam, 10))) : 50;

  const summary = getTelemetrySummary();
  const recent = getRecentTelemetryEvents(limit);

  return NextResponse.json({
    ok: true,
    summary,
    recent,
    generatedAt: new Date().toISOString(),
  });
}
