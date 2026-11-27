import { NextRequest, NextResponse } from "next/server";
import { appendCorridorEventDurably } from "@/lib/dcc/telemetry/corridorEvents";
import {
  sanitizeTelemetryMetadataObject,
  sanitizeTelemetryPath,
} from "@/lib/dcc/telemetry/privacyTelemetryGuard";
import { resolveCanonicalAnalyticsSite } from "@/lib/dcc/analytics/contract";
import { bridgeLegacyEventToV2Collector } from "@/lib/dcc/analytics/collector";

const BOT_USER_AGENT_RE =
  /bot\b|crawler|spider|slurp|bingpreview|lighthouse|pagespeed|headlesschrome|phantomjs|puppeteer|playwright|curl\/|wget\/|python-requests|go-http-client|ahrefs|semrush|gptbot|claudebot|bytespider|applebot|yandex/i;

const EXPLICIT_PAGEVIEW_EVENTS = new Set([
  "page_viewed",
  "landing_viewed",
  "sailing_page_viewed",
  "planner_viewed",
  "shared_plan_viewed",
  "service_page_view",
  "planner_view",
  "lfse_lodge_page_view",
]);

function clean(value: unknown, max = 180) {
  return typeof value === "string" ? value.trim().slice(0, max) : undefined;
}

function cleanObject(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const raw = await request.text();
    if (raw.length > 16000) return NextResponse.json({ ok: false }, { status: 413 });
    const body = JSON.parse(raw || "{}");
    const site = clean(body.site, 64);
    const resolvedSite = resolveCanonicalAnalyticsSite(site);
    const eventName = clean(body.eventName, 64);
    const sessionId = clean(body.sessionId, 96);
    if (!site || resolvedSite.siteId === "unregistered_or_legacy" || !eventName || !sessionId) {
      return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
    }

    const context = sanitizeTelemetryMetadataObject(cleanObject(body.context));
    const outcome = sanitizeTelemetryMetadataObject(cleanObject(body.outcome));

    // Bridge to v2 analytics collector (truthful mapping — never coerces non-pageview events to page_viewed)
    bridgeLegacyEventToV2Collector({
      rawSite: resolvedSite.siteId,
      rawEventName: eventName,
      eventId: clean(body.eventId, 120),
      sessionId,
      visitorId: clean(body.visitorId, 96),
      sourcePage: clean(body.sourcePage) || "/",
      landingPath: clean(body.landingPath),
      targetPath: clean(body.targetPath, 512),
      isTest: Boolean(body.isTest || outcome?.isTest || request.headers.get("x-qa-test") === "1"),
      metadata: { ...(context || {}), ...(outcome || {}) },
      headers: request.headers,
    });

    const userAgent = request.headers.get("user-agent") || "";
    if (userAgent && BOT_USER_AGENT_RE.test(userAgent)) {
      return NextResponse.json({ ok: true, botFiltered: true }, { status: 202 });
    }

    const mapped =
      (eventName === "planner_view" || eventName === "cp_sailing_started" || eventName === "cp_board_created")
        ? eventName
        : EXPLICIT_PAGEVIEW_EVENTS.has(eventName)
        ? "page_viewed"
        : eventName === "handoff_received"
          ? "handoff_received"
          : eventName === "charter_inquiry_submitted" || eventName === "group_inquiry_submitted"
            ? "lead_captured"
            : eventName === "board_created" || eventName === "printable_view_opened"
              ? "plan_rendered"
              : eventName === "first_guest_joined" ||
                  eventName === "first_activity_response" ||
                  eventName === "passenger_responded" ||
                  eventName === "planner_saved" ||
                  eventName === "trip_customized"
                ? "plan_modified"
                : eventName === "tour_fit_interaction" || eventName === "guide_engaged"
                  ? "recommendation_rendered"
                  : eventName === "booking_handoff_initiated" || eventName === "booking_clicked"
                    ? "booking_opened"
                    : eventName === "start_board_selected" ||
                        eventName === "invite_link_copied_or_shared" ||
                        eventName === "charter_inquiry_opened"
                      ? "cta_clicked_primary"
                      : eventName.includes("booking") || eventName.includes("checkout")
                        ? "booking_opened"
                        : eventName.includes("recommend") || eventName.includes("match") || eventName.includes("route")
                          ? "recommendation_rendered"
                          : eventName.includes("click") || eventName.includes("handoff")
                            ? "cta_clicked_primary"
                            : "plan_modified";

    const stored = await appendCorridorEventDurably({
      corridor_id: "portfolio-network",
      event_name: mapped,
      session_id: sanitizeTelemetryPath(sessionId) || "anon",
      source_page: sanitizeTelemetryPath(clean(body.sourcePage)),
      landing_path: sanitizeTelemetryPath(clean(body.landingPath)),
      target_path: sanitizeTelemetryPath(clean(body.targetPath)),
      metadata: {
        surface: "portfolio-network",
        site: resolvedSite.siteId,
        originating_site: resolvedSite.siteId,
        original_event_name: eventName,
        journey_id: clean(body.journeyId, 96) || clean(context?.journey_id, 96) || sessionId,
        is_test: Boolean(body.isTest || outcome?.isTest || request.headers.get("x-qa-test") === "1"),
        context,
        outcome,
      },
    });

    return NextResponse.json({ ok: stored.ok });
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }
}
