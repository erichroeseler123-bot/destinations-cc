import { NextRequest, NextResponse } from "next/server";
import {
  recordTelemetryEvent,
  getTelemetrySummary,
  getRecentTelemetryEvents,
  type TelemetryEventPayload,
} from "../../../../lib/telemetryStore";
import {
  bridgeLegacyEventToV2Collector,
  collectAnalyticsRawPayload,
} from "@/lib/dcc/analytics/collector";
import { scheduleServerlessAfterTask } from "@/lib/dcc/analytics/serverlessLifecycle";

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
    let payload: TelemetryEventPayload & { events?: Array<Record<string, unknown>> } = {};

    try {
      payload = JSON.parse(raw);
    } catch {
      // Body was not JSON; proceed with empty payload
    }

    const incomingUa = request.headers.get("user-agent")?.trim() || "";
    const incomingLang = request.headers.get("accept-language")?.trim() || "";
    const incomingHost =
      request.headers.get("x-forwarded-host") || request.headers.get("host") || "";

    // Support native v2 batched analytics envelopes
    if (payload && Array.isArray(payload.events)) {
      for (const evt of payload.events) {
        if (evt && typeof evt === "object") {
          recordTelemetryEvent({
            site: "juneau-flight-deck",
            eventName: String(evt.eventType || "page_viewed"),
            sessionId: typeof evt.sessionId === "string" ? evt.sessionId : undefined,
            sourcePage: typeof evt.path === "string" ? evt.path : undefined,
            landingPath: typeof evt.landingPath === "string" ? evt.landingPath : undefined,
            targetPath: typeof evt.targetSite === "string" ? evt.targetSite : undefined,
          });
        }
      }

      const collectRes = await collectAnalyticsRawPayload({
        rawBodyText: raw,
        headers: request.headers,
      });

      const explicitCollectUrl = process.env.DCC_ANALYTICS_COLLECT_URL?.trim();
      const prodDccOrigin =
        process.env.DCC_ORIGIN?.trim() ||
        (process.env.VERCEL_ENV === "production"
          ? "https://www.destinationcommandcenter.com"
          : "");
      const upstreamUrl =
        explicitCollectUrl ||
        (prodDccOrigin ? `${prodDccOrigin}/api/v2/analytics/collect` : "");

      if (upstreamUrl) {
        scheduleServerlessAfterTask(async () => {
          await fetch(upstreamUrl, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              ...(incomingUa ? { "user-agent": incomingUa } : {}),
              ...(incomingLang ? { "accept-language": incomingLang } : {}),
              ...(incomingHost ? { "x-forwarded-host": incomingHost } : {}),
            },
            body: raw,
          }).catch(() => undefined);
        });
      }

      return NextResponse.json(collectRes, { status: collectRes.status });
    }

    // 1. Record legacy single event durably in JFD PostgreSQL / local telemetry store
    if (payload && typeof payload === "object") {
      recordTelemetryEvent(payload);
      bridgeLegacyEventToV2Collector({
        rawSite: "juneauflightdeck",
        rawEventName: String(payload.eventName || "page_viewed"),
        sessionId: typeof payload.sessionId === "string" ? payload.sessionId : undefined,
        sourcePage: typeof payload.sourcePage === "string" ? payload.sourcePage : "/",
        landingPath: typeof payload.landingPath === "string" ? payload.landingPath : undefined,
        targetPath: typeof payload.targetPath === "string" ? payload.targetPath : undefined,
        isTest: request.headers.get("x-qa-test") === "1",
        metadata:
          payload.outcome && typeof payload.outcome === "object"
            ? (payload.outcome as Record<string, unknown>)
            : {},
        headers: request.headers,
      });
    }

    // 2. Fire-and-forget relay to upstream DCC telemetry endpoint ONLY when explicitly configured or in Production (never leak Preview hits to Production)
    const dccOrigin =
      process.env.DCC_ORIGIN?.trim() ||
      (process.env.VERCEL_ENV === "production"
        ? "https://www.destinationcommandcenter.com"
        : "");
    if (dccOrigin) {
      scheduleServerlessAfterTask(async () => {
        await fetch(`${dccOrigin}/api/network/telemetry`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            ...(incomingUa ? { "user-agent": incomingUa } : {}),
            ...(incomingLang ? { "accept-language": incomingLang } : {}),
            ...(incomingHost ? { "x-forwarded-host": incomingHost } : {}),
          },
          body: raw,
        }).catch(() => undefined);
      });
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
