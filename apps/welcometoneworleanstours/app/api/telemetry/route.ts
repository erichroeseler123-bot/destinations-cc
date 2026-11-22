import { NextRequest, NextResponse } from "next/server";
import { resolveDccIngestBaseUrl } from "@/lib/dcc/shared/envCompat";
import { scheduleServerlessAfterTask } from "@/lib/dcc/analytics/serverlessLifecycle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isWnoAnalyticsDisabled(): boolean {
  const vals = [
    process.env.DCC_ANALYTICS_DISABLED,
    process.env.WNO_ANALYTICS_DISABLED,
    process.env.WTNO_ANALYTICS_DISABLED,
    process.env.NEXT_PUBLIC_DCC_ANALYTICS_DISABLED,
    process.env.NEXT_PUBLIC_WNO_ANALYTICS_DISABLED,
    process.env.NEXT_PUBLIC_WTNO_ANALYTICS_DISABLED,
  ];
  return vals.some((v) => {
    const n = (v || "").trim().toLowerCase();
    return n === "1" || n === "true" || n === "yes" || n === "on";
  });
}

function resolveWnoDccCollectEndpoint(): string | null {
  if (isWnoAnalyticsDisabled()) return null;
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
    if (isWnoAnalyticsDisabled()) {
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

    const data = (rawText ? JSON.parse(rawText) : null) as Record<string, unknown> | null;
    if (!data || typeof data !== "object" || !Array.isArray(data.events)) {
      return NextResponse.json(
        { ok: true, accepted: false, reason: "empty_or_invalid_payload" },
        { status: 202 },
      );
    }

    const collectUrl = resolveWnoDccCollectEndpoint();
    const previewBypass =
      process.env.DCC_ANALYTICS_PREVIEW_BYPASS_SECRET?.trim() ||
      process.env.DCC_PREVIEW_BYPASS_SECRET?.trim() ||
      "";

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
        site: "welcometoneworleanstours",
        forwardedTo: collectUrl ? "dcc_v2_collect" : "preview_local_sink",
      },
      { status: 202 },
    );
  } catch {
    return NextResponse.json(
      { ok: true, accepted: false, reason: "malformed_body_ignored" },
      { status: 202 },
    );
  }
}
