"use client";

import { useEffect, useState } from "react";
import {
  getOrCreateJourneyId,
  isQaTestMode,
  trackNetworkEvent,
} from "@/lib/dcc/telemetry/clientNetworkEvents";

const SAFE_SHARE_CODE_RE = /^[a-zA-Z0-9_-]{6,32}$/;
const SAFE_JOURNEY_ID_RE = /^[a-zA-Z0-9_-]{8,64}$/;
const SAFE_STAGE_RE = /^[a-zA-Z0-9_-]{1,48}$/;
const SAFE_SLUG_RE = /^[a-z0-9-]{1,64}$/;
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const SAFE_CP_PREVIEW_ORIGIN_RE = /^https:\/\/cruisepromenade(?:-[a-z0-9-]+)?\.vercel\.app$/i;
const SAFE_RC_PREVIEW_ORIGIN_RE = /^https:\/\/roll-call(?:-usa)?(?:-[a-z0-9-]+)?\.vercel\.app$/i;

export interface ContextualCruiseReturnBannerModel {
  source: "cruisepromenade" | "rollcallusa";
  href: string;
  label: string;
  eyebrow: string;
  sublabel: string;
}

function readParam(
  raw: URLSearchParams | Record<string, string | undefined | null>,
  key: string,
): string | null {
  if (raw instanceof URLSearchParams) {
    return raw.get(key);
  }
  const val = raw[key];
  return typeof val === "string" ? val : null;
}

function cleanText(raw: string | null | undefined, maxLen = 80): string | null {
  if (!raw) return null;
  const cleaned = raw
    .replace(EMAIL_RE, "")
    .replace(/\bdcc_ctx_[a-z0-9_-]+/gi, "")
    .trim()
    .slice(0, maxLen);
  return cleaned || null;
}

export function resolveContextualCruiseReturnBanner(
  rawParams: URLSearchParams | Record<string, string | undefined | null>,
  options?: {
    fallbackJourneyId?: string | null;
    fallbackPortSlug?: string | null;
    qaTest?: boolean;
  },
): ContextualCruiseReturnBannerModel | null {
  const rawSource = cleanText(
    readParam(rawParams, "source") ||
      readParam(rawParams, "utm_source") ||
      readParam(rawParams, "from"),
    40,
  )?.toLowerCase();

  if (rawSource !== "cruisepromenade" && rawSource !== "rollcallusa") {
    return null;
  }

  const rawJourney = cleanText(
    readParam(rawParams, "journey_id") ||
      readParam(rawParams, "journeyId") ||
      options?.fallbackJourneyId,
    64,
  );
  const journeyId =
    rawJourney && SAFE_JOURNEY_ID_RE.test(rawJourney) && !rawJourney.startsWith("dcc_ctx_")
      ? rawJourney
      : null;

  const ship = cleanText(readParam(rawParams, "ship"), 80);
  const rawSailDate = cleanText(
    readParam(rawParams, "sailDate") ||
      readParam(rawParams, "sailing_date") ||
      readParam(rawParams, "date"),
    16,
  );
  const sailDate = rawSailDate && /^\d{4}-\d{2}-\d{2}$/.test(rawSailDate) ? rawSailDate : null;

  const rawPort = cleanText(
    readParam(rawParams, "port") || options?.fallbackPortSlug,
    64,
  )?.toLowerCase();
  const port = rawPort && SAFE_SLUG_RE.test(rawPort) ? rawPort : null;

  const rawStage = cleanText(readParam(rawParams, "stage"), 48);
  const stage = rawStage && SAFE_STAGE_RE.test(rawStage) ? rawStage : null;

  const rawShareCode = cleanText(
    readParam(rawParams, "shareCode") || readParam(rawParams, "share_code"),
    32,
  );
  const shareCode =
    rawShareCode &&
    SAFE_SHARE_CODE_RE.test(rawShareCode) &&
    !rawShareCode.startsWith("dcc_ctx_")
      ? rawShareCode
      : null;

  const qaTest =
    options?.qaTest === true ||
    readParam(rawParams, "qa_test") === "1" ||
    readParam(rawParams, "is_test") === "1";

  const rawReturnOrigin = cleanText(readParam(rawParams, "return_origin"), 120)?.replace(
    /\/+$/,
    "",
  );

  if (rawSource === "cruisepromenade") {
    const cpOrigin =
      rawReturnOrigin && SAFE_CP_PREVIEW_ORIGIN_RE.test(rawReturnOrigin)
        ? rawReturnOrigin
        : "https://cruisepromenade.com";
    const targetUrl = shareCode
      ? new URL(`${cpOrigin}/p/${encodeURIComponent(shareCode)}`)
      : new URL(`${cpOrigin}/journey`);

    if (!shareCode) {
      if (stage) targetUrl.searchParams.set("stage", stage);
      if (port) targetUrl.searchParams.set("port", port);
      if (ship) targetUrl.searchParams.set("ship", ship);
      if (sailDate) targetUrl.searchParams.set("sailDate", sailDate);
    }
    if (journeyId) targetUrl.searchParams.set("journey_id", journeyId);
    if (qaTest) targetUrl.searchParams.set("qa_test", "1");

    return {
      source: "cruisepromenade",
      href: targetUrl.toString(),
      eyebrow: "Connected Cruise Journey · Cruise Promenade",
      label: shareCode
        ? `← Return to your Cruise Promenade Group Board (${shareCode})`
        : "← Return to your Cruise Promenade Journey / Group Board",
      sublabel: [
        stage ? `Stage: ${stage.replace(/[_-]/g, " ")}` : null,
        ship ? `Ship: ${ship}` : null,
        port ? `Port: ${port}` : null,
        sailDate ? `Sailing: ${sailDate}` : null,
      ]
        .filter(Boolean)
        .join(" · ") || "Your active journey context is preserved across DCC & Cruise Promenade.",
    };
  }

  // Non-commercial social sailing board return link for RollCallUSA (never attaches dcc_ctx_*)
  const rcOrigin =
    rawReturnOrigin && SAFE_RC_PREVIEW_ORIGIN_RE.test(rawReturnOrigin)
      ? rawReturnOrigin
      : "https://rollcallusa.com";
  const rollCallUrl = new URL(`${rcOrigin}/`);
  if (ship) rollCallUrl.searchParams.set("ship", ship);
  if (sailDate) rollCallUrl.searchParams.set("sailDate", sailDate);
  if (journeyId) rollCallUrl.searchParams.set("journey_id", journeyId);
  if (qaTest) rollCallUrl.searchParams.set("qa_test", "1");

  return {
    source: "rollcallusa",
    href: rollCallUrl.toString(),
    eyebrow: "Connected Sailing Community · RollCallUSA",
    label: "← Return to your RollCallUSA Sailing Board",
    sublabel:
      [ship ? `Ship: ${ship}` : null, sailDate ? `Sailing: ${sailDate}` : null]
        .filter(Boolean)
        .join(" · ") ||
      "Return to your sailing roll call conversation with your journey context preserved.",
  };
}

export default function ContextualCruiseReturnBanner({
  defaultPortSlug,
  initialSearchParams,
}: {
  defaultPortSlug?: string;
  initialSearchParams?: Record<string, string | undefined>;
}) {
  const [banner, setBanner] = useState<ContextualCruiseReturnBannerModel | null>(() =>
    initialSearchParams
      ? resolveContextualCruiseReturnBanner(initialSearchParams, {
          fallbackPortSlug: defaultPortSlug,
        })
      : null,
  );

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const resolved = resolveContextualCruiseReturnBanner(params, {
        fallbackJourneyId: getOrCreateJourneyId(),
        fallbackPortSlug: defaultPortSlug,
        qaTest: isQaTestMode(),
      });
      setBanner(resolved);
    } catch {
      // no-op
    }
  }, [defaultPortSlug]);

  if (!banner) return null;

  return (
    <div
      role="region"
      aria-label="Connected Cruise Return Navigation"
      data-testid="contextual-cruise-return-banner"
      data-return-source={banner.source}
      className="mx-auto w-full max-w-5xl rounded-2xl border border-cyan-400/35 bg-cyan-950/55 px-4 py-3 text-white shadow-lg backdrop-blur-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-300">
            {banner.eyebrow}
          </div>
          <div className="text-xs text-cyan-100/90">{banner.sublabel}</div>
        </div>
        <a
          href={banner.href}
          data-testid="contextual-cruise-return-link"
          onClick={() => {
            if (banner.source === "cruisepromenade") {
              trackNetworkEvent({
                eventName: "network_handoff",
                originatingSite: "dcc",
                destinationSite: "cruisepromenade",
                travelIntent: "cruise-journey-return",
                corridorId: "portfolio-network",
              });
            }
          }}
          className="inline-flex min-h-10 items-center justify-center rounded-full bg-cyan-300 px-4 py-2 text-xs font-black text-slate-950 transition hover:bg-cyan-200"
        >
          {banner.label}
        </a>
      </div>
    </div>
  );
}
