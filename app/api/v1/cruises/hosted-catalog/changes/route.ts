import { NextRequest, NextResponse } from "next/server";
import {
  computeStrongRfc8785Etag,
  getDccHostedProvenanceLedger,
  matchesIfNoneMatch,
} from "@/lib/dcc/cruise/hostedProvenanceLedger";

export const dynamic = "force-dynamic";

const BASE_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-DCC-API-Key, If-None-Match",
  "Access-Control-Expose-Headers": "ETag, X-DCC-Ledger-Cursor, X-Robots-Tag",
  "Cache-Control": "public, max-age=30, stale-while-revalidate=120",
  "X-Robots-Tag": "noindex, nofollow",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: BASE_HEADERS });
}

async function handleChangesRequest(request: NextRequest, headOnly: boolean) {
  const { searchParams } = new URL(request.url);
  const sinceRaw = searchParams.get("since") ?? searchParams.get("cursor") ?? "0";
  const ledger = getDccHostedProvenanceLedger();

  try {
    const delta = ledger.getIncrementalChangesSince(sinceRaw);
    const hashChainIntegrity = ledger.verifyHashChainIntegrity();
    const { etag } = computeStrongRfc8785Etag({
      sinceCursor: delta.sinceCursor,
      latestCursor: delta.latestCursor,
      events: delta.events,
    });

    const headers = {
      ...BASE_HEADERS,
      ETag: etag,
      "X-DCC-Ledger-Cursor": delta.latestCursorToken,
    };

    if (matchesIfNoneMatch(request.headers.get("if-none-match"), etag)) {
      return new NextResponse(null, { status: 304, headers });
    }

    if (headOnly) {
      return new NextResponse(null, { status: 200, headers });
    }

    return NextResponse.json(
      {
        ok: true,
        machineAccessOnly: true,
        robotsPolicy: "noindex, nofollow",
        etag,
        hashChainIntegrity,
        sinceCursor: delta.sinceCursor,
        sinceCursorToken: delta.sinceCursorToken,
        latestCursor: delta.latestCursor,
        latestCursorToken: delta.latestCursorToken,
        upToDate: delta.upToDate,
        eventCount: delta.events.length,
        events: delta.events,
      },
      { status: 200, headers },
    );
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Invalid cursor parameter",
      },
      { status: 400, headers: BASE_HEADERS },
    );
  }
}

export async function GET(request: NextRequest) {
  return handleChangesRequest(request, false);
}

export async function HEAD(request: NextRequest) {
  return handleChangesRequest(request, true);
}
