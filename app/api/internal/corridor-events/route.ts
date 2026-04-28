import { NextRequest, NextResponse } from "next/server";
import {
  appendCorridorEventDurably,
  CorridorEventPayloadSchema,
} from "@/lib/dcc/telemetry/corridorEvents";
import { isInternalAuthorized } from "@/lib/api/internalAuth";

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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return withCors(NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 }));
  }

  const parsed = CorridorEventPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return withCors(
      NextResponse.json(
        { ok: false, error: "invalid_payload", details: parsed.error.flatten() },
        { status: 400 },
      ),
    );
  }

  try {
    const stored = await appendCorridorEventDurably(parsed.data);
    return withCors(NextResponse.json(stored, { status: 200 }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    const status = message.startsWith("unknown_corridor:") ? 400 : 500;
    return withCors(
      NextResponse.json({ ok: false, error: "event_storage_failed", message }, { status }),
    );
  }
}
