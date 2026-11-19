import type {
  AnalyticsEnvironment,
  AnalyticsEventType,
  TrafficClassification,
} from "./contract";
import { ANALYTICS_SITE_REGISTRY } from "./contract";

const PRODUCTION_CANONICAL_DOMAINS = new Set(
  ANALYTICS_SITE_REGISTRY.map((s) => s.canonicalDomain.toLowerCase()),
);

const KNOWN_BOT_UA_RE =
  /bot\b|crawler|spider|slurp|bingpreview|duckduckbot|baiduspider|yandex|applebot|mediapartners-google|facebookexternalhit|facebot|slackbot|discordbot|whatsapp|linkedinbot|twitterbot|telegrambot|embedly|pinterest|ahrefs|semrush|mj12bot|dotbot|petalbot|bytespider|gptbot|chatgpt-user|oai-searchbot|claudebot|anthropic-ai|perplexitybot|ccbot|google-extended|lighthouse|pagespeed|gtmetrix|pingdom|uptimerobot|vercel-screenshot|headlesschrome|phantomjs|puppeteer|playwright|cypress|selenium|webdriver|curl\/|wget\/|python-requests|python-urllib|aiohttp|httpx|go-http-client|java\/|axios\/|node-fetch|undici/i;

const SYNTHETIC_TOKEN_RE =
  /(?:^|[-_:/])(smoke|canary|qa|qa_test|qa_smoke|e2e|e2e_test|synthetic|synthetic_probe|dcc_verify|preview_verify|verify_probe|bench_probe|playwright|vitest|demo-2027|whale-split-2027|indy-2027|western-2027|clk_qa|vis_test|wno_test|wno_verify|staging-verification-test)(?:$|[-_:/0-9])/i;

function extractHostname(urlOrHost?: string | null): string | null {
  if (!urlOrHost || typeof urlOrHost !== "string") return null;
  const trimmed = urlOrHost.trim().toLowerCase();
  if (!trimmed) return null;
  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return new URL(trimmed).hostname.toLowerCase().replace(/^www\./, "");
    }
    return trimmed.split("/")[0]!.split(":")[0]!.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function isPreviewOrLocalHostname(hostname: string | null): boolean {
  if (!hostname) return false;
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".vercel.app") ||
    hostname.endsWith(".pages.dev") ||
    hostname.endsWith(".workers.dev")
  ) {
    return true;
  }
  return !PRODUCTION_CANONICAL_DOMAINS.has(hostname);
}

/**
 * Enforces server-side environment normalization.
 * A Preview or localhost client can NEVER self-declare `production` status.
 */
export function resolveAuthoritativeEnvironment(params: {
  claimedEnvironment?: AnalyticsEnvironment | null;
  originHeader?: string | null;
  refererHeader?: string | null;
  hostHeader?: string | null;
}): AnalyticsEnvironment {
  const explicitScope = (
    process.env.DCC_ANALYTICS_ENV ||
    process.env.DCC_ENVIRONMENT_SCOPE ||
    process.env.VERCEL_ENV ||
    ""
  )
    .trim()
    .toLowerCase();

  if (
    !explicitScope &&
    (process.env.DCC_ISOLATED_TEST_DB === "1" || process.env.NODE_ENV === "test")
  ) {
    return params.claimedEnvironment === "preview" ? "preview" : "test";
  }

  if (explicitScope === "preview") return "preview";
  if (explicitScope === "development") return "development";
  if (explicitScope === "test") return "test";

  const originHost = extractHostname(params.originHeader);
  const refererHost = extractHostname(params.refererHeader);
  const reqHost = extractHostname(params.hostHeader);

  if (
    isPreviewOrLocalHostname(originHost) ||
    isPreviewOrLocalHostname(refererHost) ||
    isPreviewOrLocalHostname(reqHost)
  ) {
    if (originHost === "localhost" || reqHost === "localhost" || originHost === "127.0.0.1" || reqHost === "127.0.0.1") {
      return params.claimedEnvironment === "preview" ? "preview" : "development";
    }
    return "preview";
  }

  if (explicitScope === "production") {
    if (params.claimedEnvironment && params.claimedEnvironment !== "production") {
      return params.claimedEnvironment;
    }
    return "production";
  }

  // Default to preview in non-Vercel / local runtimes unless explicitly configured as production
  return params.claimedEnvironment === "development" ? "development" : "preview";
}

export function isPrefetchRequest(headers: Headers): boolean {
  const purpose = (headers.get("purpose") || headers.get("sec-purpose") || headers.get("x-moz") || "").toLowerCase();
  if (purpose.includes("prefetch") || purpose.includes("preview")) return true;
  if (headers.get("next-router-prefetch") === "1") return true;
  if (headers.get("x-middleware-prefetch") === "1") return true;
  return false;
}

export function hasQaQueryOrMarker(rawUrlOrQuery?: string | null): boolean {
  if (!rawUrlOrQuery || typeof rawUrlOrQuery !== "string") return false;
  const qIdx = rawUrlOrQuery.indexOf("?");
  if (qIdx < 0) return false;
  try {
    const qs = new URLSearchParams(rawUrlOrQuery.slice(qIdx + 1).split("#")[0] || "");
    for (const key of [
      "qa",
      "qa_test",
      "is_test",
      "test",
      "synthetic",
      "telemetry_test",
      "dcc_verify",
    ]) {
      const v = (qs.get(key) || "").trim().toLowerCase();
      if (v === "1" || v === "true" || v === "yes") return true;
    }
    const camp = (qs.get("utm_campaign") || qs.get("campaign") || qs.get("source") || "").trim();
    if (camp && SYNTHETIC_TOKEN_RE.test(camp)) return true;
  } catch {
    return false;
  }
  return false;
}

/**
 * Classifies an event into mutually exclusive traffic classes so bots, prefetchers,
 * QA/canary traffic, internal operators, and click-only requests never pollute observed browser metrics.
 */
export function classifyEventTraffic(params: {
  logicalEventId?: string | null;
  eventType: AnalyticsEventType;
  environment: AnalyticsEnvironment;
  headers: Headers;
  hasServerAuth: boolean;
  isTestFlag?: boolean;
  isSyntheticSample?: boolean;
  rawPathOrUrl?: string | null;
  utmCampaign?: string | null;
  utmSource?: string | null;
  browserSeed?: string | null;
  sessionId?: string | null;
  handoffId?: string | null;
  clickId?: string | null;
  tripIdentifier?: string | null;
  isVelocityBurst?: boolean;
}): {
  trafficClass: TrafficClassification;
  classificationReason: string;
  isPrefetch: boolean;
} {
  const { headers } = params;
  const isPrefetch = isPrefetchRequest(headers);
  const ua = (headers.get("user-agent") || "").trim();
  const secChUa = (headers.get("sec-ch-ua") || "").toLowerCase();

  // 1. Internal / Admin sessions
  const cookieHeader = headers.get("cookie") || "";
  if (
    headers.get("x-dcc-internal-actor") === "1" ||
    /(?:^|;\s*)dcc_admin_session=[^;]+/.test(cookieHeader)
  ) {
    return {
      trafficClass: "internal",
      classificationReason: "admin_or_internal_actor",
      isPrefetch,
    };
  }

  // 2. Explicit QA / Synthetic / Canary markers (checked BEFORE bot UA so server-side QA harnesses with explicit flags classify as qa_or_synthetic)
  const qaHeader =
    headers.get("x-qa-test") === "1" ||
    headers.get("x-qa-test") === "true" ||
    headers.get("x-dcc-telemetry-test") === "1" ||
    headers.get("x-dcc-telemetry-test") === "true" ||
    headers.get("x-dcc-synthetic-verification") === "1" ||
    headers.get("x-dcc-synthetic-verification") === "true";

  if (
    params.isTestFlag === true ||
    params.isSyntheticSample === true ||
    qaHeader ||
    hasQaQueryOrMarker(params.rawPathOrUrl) ||
    hasQaQueryOrMarker(headers.get("referer")) ||
    (params.logicalEventId && SYNTHETIC_TOKEN_RE.test(params.logicalEventId)) ||
    (params.utmCampaign && SYNTHETIC_TOKEN_RE.test(params.utmCampaign)) ||
    (params.utmSource && SYNTHETIC_TOKEN_RE.test(params.utmSource)) ||
    (params.sessionId && SYNTHETIC_TOKEN_RE.test(params.sessionId)) ||
    (params.browserSeed && SYNTHETIC_TOKEN_RE.test(params.browserSeed)) ||
    (params.handoffId && SYNTHETIC_TOKEN_RE.test(params.handoffId)) ||
    (params.clickId && SYNTHETIC_TOKEN_RE.test(params.clickId)) ||
    (params.tripIdentifier && SYNTHETIC_TOKEN_RE.test(params.tripIdentifier))
  ) {
    return {
      trafficClass: "qa_or_synthetic",
      classificationReason: "explicit_qa_or_synthetic_marker",
      isPrefetch,
    };
  }

  // 3. Known bots / crawlers / headless browsers (only for non-server-authenticated requests)
  if (!params.hasServerAuth) {
    if (KNOWN_BOT_UA_RE.test(ua) || secChUa.includes("headlesschrome")) {
      return {
        trafficClass: "known_bot",
        classificationReason: "known_bot_user_agent",
        isPrefetch,
      };
    }
  }

  // 4. Prefetch or Suspected Automation
  if (isPrefetch) {
    return {
      trafficClass: "suspected_automation",
      classificationReason: "browser_or_router_prefetch",
      isPrefetch: true,
    };
  }

  if (params.isVelocityBurst) {
    return {
      trafficClass: "suspected_automation",
      classificationReason: "burst_velocity_exceeded",
      isPrefetch: false,
    };
  }

  if (!params.hasServerAuth) {
    if (!ua || ua.length < 12) {
      return {
        trafficClass: "suspected_automation",
        classificationReason: "missing_or_short_user_agent",
        isPrefetch: false,
      };
    }
    const acceptLang = headers.get("accept-language");
    if (!acceptLang && params.eventType === "page_viewed") {
      return {
        trafficClass: "suspected_automation",
        classificationReason: "missing_accept_language_on_pageview",
        isPrefetch: false,
      };
    }
  }

  // 5. Server-side / outbound handoff without browser seed
  const hasBrowserIdentity = Boolean(
    params.browserSeed &&
      params.browserSeed !== "ssr" &&
      params.browserSeed !== "anon" &&
      params.browserSeed.length >= 6,
  );
  if (!hasBrowserIdentity && !params.hasServerAuth) {
    return {
      trafficClass: "unclassified_non_pageview",
      classificationReason: "missing_first_party_browser_seed",
      isPrefetch: false,
    };
  }

  // Note: Server-authenticated lifecycle milestones (e.g. persisted trip, companion RSVP, verified booking outcome)
  // carry `hasServerAuth: true` and are classified as `observed_browser` (or `unclassified_non_pageview` for pure server webhooks without a browser seed,
  // while still counting accurately in Layer 2 Trip Lifecycle & Authoritative Outcomes!).
  if (!hasBrowserIdentity && params.hasServerAuth && params.eventType === "seller_handoff_initiated") {
    return {
      trafficClass: "unclassified_non_pageview",
      classificationReason: "opaque_outbound_handoff_without_browser_seed",
      isPrefetch: false,
    };
  }

  return {
    trafficClass: "observed_browser",
    classificationReason: params.hasServerAuth ? "verified_server_projection" : "first_party_browser_beacon",
    isPrefetch: false,
  };
}
