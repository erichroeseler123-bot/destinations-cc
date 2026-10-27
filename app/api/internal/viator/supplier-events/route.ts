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
import {
  getPollerCheckpoint,
  pollViatorModifiedSinceWithCheckpoint,
} from "@/lib/dcc/commerce";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const capabilities = getViatorCapabilities();
  if (!capabilities.canUseBookingReporting) {
    return NextResponse.json(
      { ok: false, error: "viator_booking_reporting_not_enabled_for_tier" },
      { status: 501 }
    );
  }

  const durableCheckpoint = await getPollerCheckpoint("viator_modified_since_primary");
  const state = readViatorSupplierState();
  const cursor =
    typeof body.cursor === "string" && body.cursor.trim().length > 0
      ? body.cursor.trim()
      : durableCheckpoint?.cursorValue ?? state.cursor;

  try {
    let rawResponseCapture: Record<string, unknown> = {};
    const pollerRun = await pollViatorModifiedSinceWithCheckpoint({
      pollerId: "viator_modified_since_primary",
      overrideCursor: cursor || null,
      customFetchPage: async ({ cursor: activeCursor }) => {
        const res = (await getViatorClient().getBookingsModifiedSince({
          cursor: activeCursor || undefined,
        })) as Record<string, unknown>;
        rawResponseCapture = res;
        return res;
      },
    });

    const events = extractViatorSupplierEvents(rawResponseCapture);
    const acknowledgements = extractViatorAcknowledgements(rawResponseCapture);
    const nextCursor = pollerRun.nextCursor ?? extractViatorNextCursor(rawResponseCapture);
    const filePath = writeViatorSupplierArtifact({
      kind: "feed",
      cursor,
      payload: { cursor },
      response: rawResponseCapture,
    });
    if (nextCursor) writeViatorSupplierState(nextCursor);
    return NextResponse.json(
      {
        ok: true,
        accessTier: capabilities.accessTier,
        canUseBookingReporting: capabilities.canUseBookingReporting,
        cursor,
        nextCursor,
        events,
        acknowledgements,
        commercialReporting: pollerRun,
        filePath,
        pollEveryMs: getViatorSupplierPollMs(),
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        accessTier: capabilities.accessTier,
        canUseBookingReporting: capabilities.canUseBookingReporting,
        error: error instanceof Error ? error.message : "supplier_events_failed",
        cursor,
        pollEveryMs: getViatorSupplierPollMs(),
      },
      { status: 502 }
    );
  }
}

