import { NextRequest, NextResponse } from "next/server";
import { isInternalAuthorized } from "@/lib/api/internalAuth";
import { getDb } from "@/lib/db/client";
import { sql } from "drizzle-orm";
import { ensureCorridorTables, ensureCorridorCatalogRows } from "@/lib/dcc/telemetry/corridorEvents";
import { dccCorridorCatalog, dccCorridorEvents } from "@/lib/db/schema";

export const runtime = "nodejs";

function withCors(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-internal-secret");
  return response;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function POST(request: NextRequest) {
  if (!isInternalAuthorized(request)) {
    return withCors(NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 }));
  }

  const db = getDb();
  if (!db) {
    return withCors(NextResponse.json({ ok: false, error: "no_database" }, { status: 500 }));
  }

  try {
    await ensureCorridorTables();
    await ensureCorridorCatalogRows();

    // Check count of catalog entries and tables
    const catalogRows = await db.select().from(dccCorridorCatalog);
    const eventCount = await db.execute(sql`SELECT count(*)::int as count FROM dcc_corridor_events`);

    return withCors(
      NextResponse.json({
        ok: true,
        status: "migration_verified",
        catalogCount: catalogRows.length,
        corridorIds: catalogRows.map((r) => r.corridorId),
        eventCount: (eventCount.rows[0] as any)?.count ?? 0,
      }),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return withCors(
      NextResponse.json({ ok: false, error: "migration_failed", message }, { status: 500 }),
    );
  }
}
