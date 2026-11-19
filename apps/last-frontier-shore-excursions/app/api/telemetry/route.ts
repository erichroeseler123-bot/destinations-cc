import { NextRequest, NextResponse } from "next/server";
import { resolveDccIngestBaseUrl } from "../../../../../lib/dcc/shared/envCompat";
import { EDGE_PII_QUERY_PARAM_KEYS } from "../../../../../lib/dcc/shared/edgeContextAndPii";
import {
  bridgeLegacyEventToV2Collector,
  collectAnalyticsRawPayload,
} from "../../../../../lib/dcc/analytics/collector";
import { scheduleServerlessAfterTask } from "../../../../../lib/dcc/analytics/serverlessLifecycle";
import { getLfseTelemetryFetch } from "@/lib/fishingLodgesTelemetry";

const PII_KEY_SET = new Set<string>(
  EDGE_PII_QUERY_PARAM_KEYS.map((key) => key.toLowerCase()),
);

function scrubEventProperties(
  raw: Record<string, unknown>,
): Record<string, string | number | boolean> {
  const safe: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (PII_KEY_SET.has(k.toLowerCase())) continue;
    if (typeof v === "string") {
      if (v.includes("@")) continue;
      safe[k] = v.slice(0, 160);
    } else if (typeof v === "number" && Number.isFinite(v)) {
      safe[k] = v;
    } else if (typeof v === "boolean") {
      safe[k] = v;
    }
  }
  return safe;
}

function mapLfseEventToCorridorEventName(eventName: string): string {
  if (
    eventName === "lfse_lodge_official_outbound_click" ||
    eventName === "lfse_seller_handoff_click" ||
    eventName === "affiliate_link_click"
  ) {
    return "booking_handoff";
  }
  if (
    eventName === "lfse_lodge_ecosystem_handoff" ||
    eventName === "lfse_jfd_guide_handoff"
  ) {
    return "network_handoff";
  }
  if (eventName === "lfse_lodge_compare_used") {
    return "plan_modified";
  }
  if (
    eventName === "lfse_lodge_printable_compare_used" ||
    eventName === "lfse_printable_plan_used"
  ) {
    return "plan_rendered";
  }
  if (
    eventName === "lfse_lodge_directory_filter" ||
    eventName === "lfse_guide_engagement" ||
    eventName === "eligible_results_shown"
  ) {
    return "recommendation_rendered";
  }
  if (
    eventName === "lfse_lodge_page_view" ||
    eventName === "page_viewed" ||
    eventName === "landing_viewed"
  ) {
    return "page_viewed";
  }
  return "plan_modified";
}

export async function POST(req: NextRequest) {
  try {
    const rawText = await req.text().catch(() => "");
    const data = (rawText ? JSON.parse(rawText) : null) as Record<
      string,
      unknown
    > | null;

    if (!data || typeof data !== "object") {
      return NextResponse.json(
        { ok: true, accepted: false, reason: "empty_or_invalid_payload" },
        { status: 202 },
      );
    }

    // Native v2 batched analytics envelope support
    if (Array.isArray(data.events)) {
      const collectRes = await collectAnalyticsRawPayload({
        rawBodyText: rawText,
        headers: req.headers,
      });
      if (process.env.DCC_ANALYTICS_COLLECT_URL) {
        const collectUrl = process.env.DCC_ANALYTICS_COLLECT_URL;
        const incomingUa = req.headers.get("user-agent")?.trim() || "";
        const incomingLang = req.headers.get("accept-language")?.trim() || "";
        const incomingHost = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
        scheduleServerlessAfterTask(async () => {
          await fetch(collectUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(incomingUa ? { "User-Agent": incomingUa } : {}),
              ...(incomingLang ? { "Accept-Language": incomingLang } : {}),
              ...(incomingHost ? { "x-forwarded-host": incomingHost } : {}),
            },
            body: rawText,
            cache: "no-store",
          }).catch(() => undefined);
        });
      }
      return NextResponse.json(collectRes, { status: collectRes.status });
    }

    const eventName = String(
      data.event ?? data.eventName ?? data.type ?? "",
    )
      .trim()
      .slice(0, 80);

    if (!eventName) {
      return NextResponse.json(
        { ok: true, accepted: false, reason: "missing_event_name" },
        { status: 202 },
      );
    }

    const sanitizedProps = scrubEventProperties(data);
    const host = (
      req.headers.get("x-forwarded-host") ||
      req.headers.get("host") ||
      ""
    ).toLowerCase();

    const isQaOrPreview =
      sanitizedProps.qa === true ||
      sanitizedProps.is_test === true ||
      req.headers.get("x-qa-test") === "1" ||
      (Boolean(process.env.VERCEL_ENV) &&
        process.env.VERCEL_ENV !== "production") ||
      host.includes(".vercel.app") ||
      host.includes("localhost") ||
      host.includes("127.0.0.1") ||
      req.url.includes(".vercel.app") ||
      req.url.includes("localhost");

    const pagePath = (
      typeof sanitizedProps.path === "string" && sanitizedProps.path.trim()
        ? sanitizedProps.path.trim()
        : typeof sanitizedProps.page === "string" && sanitizedProps.page.trim()
          ? sanitizedProps.page.trim()
          : "/"
    ).split("?")[0] || "/";

    const dccBase = resolveDccIngestBaseUrl();
    let forwarded = false;
    let storedEventId: string | null = null;

    // Ingest into bounded v2 durable analytics queue (classifies QA/Preview vs Production cleanly without leaking Preview hits to Production)
    if (process.env.DCC_ANALYTICS_PREVIEW_INGEST !== "0") {
      bridgeLegacyEventToV2Collector({
        rawSite: "lastfrontiershoreexcursions",
        rawEventName: eventName,
        sessionId:
          typeof sanitizedProps.sessionId === "string" ? sanitizedProps.sessionId : undefined,
        sourcePage: pagePath,
        landingPath: pagePath,
        targetPath:
          typeof sanitizedProps.targetUrl === "string"
            ? sanitizedProps.targetUrl
            : typeof sanitizedProps.destinationUrl === "string"
              ? sanitizedProps.destinationUrl
              : undefined,
        isTest: Boolean(
          sanitizedProps.qa === true ||
            sanitizedProps.is_test === true ||
            req.headers.get("x-qa-test") === "1",
        ),
        metadata: sanitizedProps,
        headers: req.headers,
      });
    }

    if (
      !isQaOrPreview &&
      process.env.DCC_FORWARD_SUBAPP_TELEMETRY !== "0" &&
      dccBase
    ) {
      try {
        const fetchFn = getLfseTelemetryFetch();
        const incomingUa = req.headers.get("user-agent")?.trim() || "";
        const targetPath =
          typeof sanitizedProps.targetUrl === "string"
            ? sanitizedProps.targetUrl
            : typeof sanitizedProps.destinationUrl === "string"
              ? sanitizedProps.destinationUrl
              : undefined;

        const corridorPayload = {
          corridor_id: "lastfrontier-alaska",
          event_name: mapLfseEventToCorridorEventName(eventName),
          session_id:
            typeof sanitizedProps.sessionId === "string" &&
            sanitizedProps.sessionId
              ? sanitizedProps.sessionId
              : "lfse_web",
          source_page: pagePath,
          landing_path: pagePath,
          ...(targetPath ? { target_path: targetPath } : {}),
          ...(typeof sanitizedProps.port === "string" && sanitizedProps.port
            ? { port: sanitizedProps.port }
            : {}),
          ...(pagePath.startsWith("/southeast-alaska/fishing-lodges")
            ? { topic: "fishing-lodges" }
            : {}),
          is_test: false,
          occurred_at: new Date().toISOString(),
          metadata: {
            ...sanitizedProps,
            site: "lastfrontiershoreexcursions.com",
            originating_site: "lastfrontiershoreexcursions.com",
            page: pagePath,
            original_event: eventName,
            is_test: false,
          },
        };

        const res = await fetchFn(`${dccBase}/api/internal/corridor-events`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(incomingUa ? { "User-Agent": incomingUa } : {}),
          },
          body: JSON.stringify(corridorPayload),
          cache: "no-store",
        });

        if (res.ok) {
          const upstream = (await res.json().catch(() => ({}))) as {
            stored?: boolean;
            eventId?: string;
          };
          forwarded = upstream.stored !== false;
          storedEventId =
            typeof upstream.eventId === "string" ? upstream.eventId : null;
        }
      } catch {
        // Never fail client pages if upstream telemetry collector is unreachable
        forwarded = false;
      }
    }

    return NextResponse.json(
      {
        ok: true,
        accepted: true,
        received: eventName,
        site: "lastfrontiershoreexcursions.com",
        page: pagePath,
        qaExcluded: isQaOrPreview,
        forwarded,
        ...(storedEventId ? { eventId: storedEventId } : {}),
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { ok: true, accepted: false, reason: "malformed_body_ignored" },
      { status: 202 },
    );
  }
}
