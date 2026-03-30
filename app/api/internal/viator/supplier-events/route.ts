import { NextRequest, NextResponse } from "next/server";
import { getViatorCapabilities } from "@/lib/viator/access";
import { getViatorClient } from "@/lib/viator/client";
import {
  extractViatorAcknowledgements,
  extractViatorNextCursor,
  extractViatorSupplierEvents,
  readViatorSupplierState,
  writeViatorSupplierArtifact,
  writeViatorSupplierState,
} from "@/lib/viator/supplier-events";
import { getViatorSupplierPollMs } from "@/lib/viator/status";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const capabilities = getViatorCapabilities();
  if (!capabilities.canUseBooking) {
    return NextResponse.json({ ok: false, error: "viator_booking_not_enabled_for_tier" }, { status: 501 });
  }

  const state = readViatorSupplierState();
  const cursor =
    typeof body.cursor === "string" && body.cursor.trim().length > 0
      ? body.cursor.trim()
      : state.cursor;

  try {
    const response = await getViatorClient().getBookingsModifiedSince({ cursor: cursor || undefined });
    const events = extractViatorSupplierEvents(response);
    const acknowledgements = extractViatorAcknowledgements(response);
    const nextCursor = extractViatorNextCursor(response);
    const filePath = writeViatorSupplierArtifact({
      kind: "feed",
      cursor,
      payload: { cursor },
      response,
    });
    if (nextCursor) writeViatorSupplierState(nextCursor);
    return NextResponse.json(
      {
        ok: true,
        cursor,
        nextCursor,
        events,
        acknowledgements,
        filePath,
        pollEveryMs: getViatorSupplierPollMs(),
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "supplier_events_failed",
        cursor,
        pollEveryMs: getViatorSupplierPollMs(),
      },
      { status: 502 }
    );
  }
}
