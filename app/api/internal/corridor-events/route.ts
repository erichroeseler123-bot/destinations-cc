import { NextRequest, NextResponse } from "next/server";
import {
  appendCorridorEventDurably,
  CorridorEventPayloadSchema,
} from "@/lib/dcc/telemetry/corridorEvents";

export const runtime = "nodejs";

const MAX_EVENT_BODY_BYTES = 16_384;

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
  let rawText: string;
  try {
    rawText = await request.text();
  } catch {
    return withCors(NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 }));
  }

  if (Buffer.byteLength(rawText, "utf8") > MAX_EVENT_BODY_BYTES) {
    return withCors(NextResponse.json({ ok: false, error: "payload_too_large" }, { status: 413 }));
  }

  let body: unknown;
  try {
    body = JSON.parse(rawText);
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
