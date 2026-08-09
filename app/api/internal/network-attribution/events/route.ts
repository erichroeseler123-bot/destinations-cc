import { NextRequest, NextResponse } from "next/server";
import { appendNetworkAttributionEvent, type NetworkAttributionEvent } from "@/lib/dcc/network/attribution";

export const runtime = "nodejs";

const EVENT_NAMES = new Set(["handoff_viewed", "booking_started", "booking_completed", "booking_failed"]);

export async function POST(request: NextRequest) {
  const expected = String(process.env.DCC_NETWORK_ATTRIBUTION_TOKEN || "").trim();
  if (!expected) {
    return NextResponse.json({ ok: false, error: "network_attribution_not_configured" }, { status: 503 });
  }

  const provided = request.headers.get("x-dcc-network-token") || "";
  if (provided !== expected) {
    return NextResponse.json({ ok: false, error: "invalid_network_token" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as NetworkAttributionEvent | null;
  if (
    !body ||
    !body.handoffId ||
    !body.registryHandoffId ||
    !body.sourceSiteId ||
    !body.destinationSiteId ||
    !EVENT_NAMES.has(body.eventName)
  ) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  if (body.eventName === "booking_completed") {
    if (typeof body.amount !== "number" || body.amount < 0 || !body.currency) {
      return NextResponse.json({ ok: false, error: "completed_event_requires_money" }, { status: 400 });
    }
  }

  try {
    const stored = await appendNetworkAttributionEvent(body);
    return NextResponse.json({ ok: true, ...stored });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "storage_failed", message: error instanceof Error ? error.message : "unknown_error" },
      { status: 500 },
    );
  }
}
