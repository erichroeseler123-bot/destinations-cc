import { NextRequest, NextResponse } from "next/server";
import {
  recordTelemetryEvent,
  getTelemetrySummary,
  getRecentTelemetryEvents,
  type TelemetryEventPayload,
} from "../../../../lib/telemetryStore";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization")?.trim();

  const validSecrets = [
    process.env.CRON_SECRET,
    process.env.ADMIN_SECRET,
    process.env.JFD_ADMIN_KEY,
    process.env.INTERNAL_API_SECRET,
  ]
    .filter(Boolean)
    .map((s) => String(s).trim());

  if (validSecrets.length === 0) {
    if (process.env.NODE_ENV !== "production") {
      return true;
    }
    return false;
  }

  // Strictly require Authorization: Bearer <token> header to prevent secrets in URLs/query params
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (validSecrets.includes(token)) return true;
  }

  return false;
}

export async function POST(request: NextRequest) {
  try {
    const raw = await request.text();
    let payload: TelemetryEventPayload = {};

    try {
      payload = JSON.parse(raw);
    } catch {
      // Body was not JSON; proceed with empty payload
    }

    // 1. Record event durably in JFD PostgreSQL / local telemetry store
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
  // 1. Enforce strict admin authorization to protect traveler data and submission details
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized access. Valid Bearer token required in Authorization header to inspect telemetry.",
      },
      { status: 401 }
    );
  }

  const url = new URL(request.url);
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Math.min(200, Math.max(1, parseInt(limitParam, 10))) : 50;
  const includeTest = url.searchParams.get("include_test") === "true";

  const summary = await getTelemetrySummary(includeTest);
  const recentRaw = await getRecentTelemetryEvents(limit, includeTest);

  // 2. Sanitize recent events to ensure no customer PII (emails, phone numbers) is exposed
  const sanitizedRecent = recentRaw.map((e) => {
    const outcomeCopy = e.outcome ? { ...e.outcome } : undefined;
    if (outcomeCopy) {
      delete outcomeCopy.email;
      delete outcomeCopy.phone;
      delete outcomeCopy.name;
    }
    return {
      id: e.id,
      timestamp: e.timestamp,
      site: e.site,
      eventName: e.eventName,
      sessionId: e.sessionId,
      sourcePage: e.sourcePage,
      landingPath: e.landingPath,
      targetPath: e.targetPath,
      provider: e.provider,
      tourSlug: e.tourSlug,
      tourName: e.tourName,
      isTest: e.isTest,
      outcome: outcomeCopy,
    };
  });

  return NextResponse.json({
    ok: true,
    authenticated: true,
    summary,
    recent: sanitizedRecent,
    generatedAt: new Date().toISOString(),
  });
}
