import { NextRequest, NextResponse } from "next/server";
import { resolveDccIngestBaseUrl } from "../../../../../lib/dcc/shared/envCompat";
import { EDGE_PII_QUERY_PARAM_KEYS } from "../../../../../lib/dcc/shared/edgeContextAndPii";
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

function isLfseAnalyticsDisabled(): boolean {
  const vals = [
    process.env.DCC_ANALYTICS_DISABLED,
    process.env.LFSE_ANALYTICS_DISABLED,
    process.env.NEXT_PUBLIC_DCC_ANALYTICS_DISABLED,
    process.env.NEXT_PUBLIC_LFSE_ANALYTICS_DISABLED,
  ];
  return vals.some((v) => {
    const n = (v || "").trim().toLowerCase();
    return n === "1" || n === "true" || n === "yes" || n === "on";
  });
}

function resolveLfseDccCollectEndpoint(): string | null {
  if (isLfseAnalyticsDisabled()) return null;
  const explicit = process.env.DCC_ANALYTICS_COLLECT_URL?.trim();
  if (explicit) return explicit;
  const base = resolveDccIngestBaseUrl()?.trim().replace(/\/+$/, "");
  if (base && (process.env.VERCEL_ENV === "production" || Boolean(process.env.DCC_BASE_URL))) {
    return `${base}/api/v2/analytics/collect`;
  }
  if (process.env.VERCEL_ENV === "production") {
    return "https://www.destinationcommandcenter.com/api/v2/analytics/collect";
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    if (isLfseAnalyticsDisabled()) {
      return NextResponse.json(
        { ok: true, accepted: false, reason: "site_analytics_disabled" },
        { status: 202 },
      );
    }
    const rawText = await req.text().catch(() => "");
    if (rawText.length > 32_768) {
      return NextResponse.json(
        { ok: false, accepted: false, reason: "payload_too_large" },
        { status: 413 },
      );
    }
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

    // Native v2 batched analytics envelope support -> forward via supported `after()` lifecycle
    if (Array.isArray(data.events)) {
      const collectUrl = resolveLfseDccCollectEndpoint();
      const previewBypass = process.env.DCC_ANALYTICS_PREVIEW_BYPASS_SECRET?.trim() || "";
      if (collectUrl && data.events.length > 0) {
        const incomingUa = req.headers.get("user-agent")?.trim() || "";
        const incomingLang = req.headers.get("accept-language")?.trim() || "";
        const incomingHost = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
        const isQa =
          req.headers.get("x-qa-test") === "1" ||
          req.headers.get("x-dcc-synthetic-verification") === "1";
        scheduleServerlessAfterTask(async () => {
          await fetch(collectUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(incomingUa ? { "User-Agent": incomingUa } : {}),
              ...(incomingLang ? { "Accept-Language": incomingLang } : {}),
              ...(incomingHost ? { "x-forwarded-host": incomingHost } : {}),
              ...(previewBypass ? { "x-vercel-protection-bypass": previewBypass } : {}),
              ...(isQa ? { "x-qa-test": "1" } : {}),
            },
            body: rawText,
            cache: "no-store",
            signal:
              typeof AbortSignal !== "undefined" && "timeout" in AbortSignal
                ? AbortSignal.timeout(1200)
                : undefined,
          }).catch(() => undefined);
        });
      }
      return NextResponse.json(
        {
          ok: true,
          accepted: true,
          batchSize: data.events.length,
          forwardedTo: collectUrl ? "dcc_v2_collect" : "preview_local_sink",
        },
        { status: 202 },
      );
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
