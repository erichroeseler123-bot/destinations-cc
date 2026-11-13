import { NextRequest, NextResponse } from "next/server";
import {
  appendCorridorEventDurably,
  CorridorEventPayloadSchema,
} from "@/lib/dcc/telemetry/corridorEvents";

export const runtime = "nodejs";

const MAX_EVENT_BODY_BYTES = 16_384;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_EVENTS = 80;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

const BOT_USER_AGENT_RE =
  /bot\b|crawler|spider|slurp|bingpreview|lighthouse|pagespeed|headlesschrome|phantomjs|puppeteer|playwright|curl\/|wget\/|python-requests|go-http-client|ahrefs|semrush|gptbot|claudebot|bytespider|applebot|yandex/i;

function withCors(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-internal-secret, x-qa-test");
  return response;
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  if (rateBuckets.size > 5000) {
    for (const [k, v] of rateBuckets.entries()) {
      if (v.resetAt <= now) rateBuckets.delete(k);
    }
  }
  const existing = rateBuckets.get(key);
  if (!existing || existing.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  existing.count += 1;
  return existing.count > RATE_LIMIT_MAX_EVENTS;
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

  const meta = (parsed.data.metadata || {}) as Record<string, unknown>;
  const isExplicitTest =
    Boolean(parsed.data.is_test) ||
    meta.is_test === true ||
    request.headers.get("x-qa-test") === "1";

  const userAgent = request.headers.get("user-agent") || "";
  if (!isExplicitTest && (!userAgent.trim() || BOT_USER_AGENT_RE.test(userAgent))) {
    return withCors(
      NextResponse.json({ ok: true, stored: false, reason: "bot_filtered" }, { status: 202 }),
    );
  }

  const rateKey = `${getClientIp(request)}:${parsed.data.session_id || parsed.data.journey_id || "anon"}`;
  if (!isExplicitTest && isRateLimited(rateKey)) {
    const res = NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    res.headers.set("Retry-After", "60");
    return withCors(res);
  }

  try {
    const stored = await appendCorridorEventDurably({
      ...parsed.data,
      is_test: isExplicitTest,
    });
    return withCors(NextResponse.json(stored, { status: 200 }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    const status = message.startsWith("unknown_corridor:") ? 400 : 500;
    return withCors(
      NextResponse.json({ ok: false, error: "event_storage_failed", message }, { status }),
    );
  }
}
