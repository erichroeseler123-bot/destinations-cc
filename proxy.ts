import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import {
  BRECKENRIDGE_SHARED_VARIANT_COOKIE,
} from "@/lib/dcc/routing/breckenridgeSharedExperiment";
import { SOMERSET_BASE_PATH, SOMERSET_PAGE_PATHS } from "@/lib/dcc/corridors/somersetPages";
import { getEdgeSignalMapForSubjects } from "@/lib/dcc/routing/edge-signals";
import { isIndexableSurfacePath } from "@/src/data/indexable-surface";
import { verifyServiceRequestHeaders } from "@/lib/dcc/auth/hmac-service-auth";
import {
  ADMIN_SESSION_COOKIE,
  isValidAdminAccessKey,
  isValidAdminSession,
} from "@/lib/adminAccess";
import {
  BRECKENRIDGE_SHARED_GO_PATH,
  JUNEAU_HELICOPTER_GO_PATH,
  JUNEAU_HELICOPTER_SIGNAL_SUBJECT_IDS,
  NEW_ORLEANS_SWAMP_GO_PATH,
  NEW_ORLEANS_SWAMP_SIGNAL_SUBJECT_IDS,
  RED_ROCKS_FASTPASS_GO_PATH,
  RED_ROCKS_FASTPASS_SIGNAL_SUBJECT_IDS,
  RED_ROCKS_SHARED_GO_PATH,
  RED_ROCKS_SHARED_SIGNAL_SUBJECT_IDS,
  VEGAS_DEALS_GO_PATH,
  VEGAS_DEALS_SIGNAL_SUBJECT_IDS,
  resolveGoRedirect,
} from "@/lib/dcc/routing/middleware";

type DccSatelliteId =
  | "partyatredrocks"
  | "redrocksfastpass"
  | "welcometotheswamp"
  | "welcome-to-alaska"
  | "saveonthestrip";

const GONE_EXACT_PATHS = new Set([
  "/www.destinationcommandcenter.com/admin",
  "/yangon/tours",
  "/manaus/helicopter",
]);

const GONE_PREFIXES = [
  "/wp-content/",
] as const;

const SOMERSET_HOSTS = new Set([
  "shuttletosomersetamphitheater.com",
  "www.shuttletosomersetamphitheater.com",
]);

const WTONOT_HOSTS = new Set([
  "welcometoneworleanstours.com",
  "www.welcometoneworleanstours.com",
  "destinations-cc-new-orleans-preview.vercel.app",
]);

const LFSE_HOSTS = new Set([
  "lastfrontiershoreexcursions.com",
  "www.lastfrontiershoreexcursions.com",
]);

const WTONOT_ROOT_PATH = "/new-orleans/tours";
const WTONOT_BRAND_SHELL_HEADER = "x-dcc-brand-shell";

const SOMERSET_HOST_PATH_REWRITES = new Map<string, string>(
  SOMERSET_PAGE_PATHS.map((pathname) => [
    pathname === SOMERSET_BASE_PATH ? "/" : pathname.replace(`${SOMERSET_BASE_PATH}/`, "/"),
    pathname,
  ]),
);

const SOMERSET_INDEXABLE_PATHS = new Set<string>(SOMERSET_PAGE_PATHS);

function shouldReturnGone(pathname: string) {
  if (GONE_EXACT_PATHS.has(pathname)) return true;
  return GONE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function getSomersetBrandShellHeaders(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(WTONOT_BRAND_SHELL_HEADER, "somerset");
  return requestHeaders;
}

export function handleSomersetHost(request: NextRequest) {
  const hostHeader = request.headers.get("x-forwarded-host") || request.nextUrl.hostname;
  const host = hostHeader.split(":")[0].toLowerCase();
  if (!SOMERSET_HOSTS.has(host)) return null;

  const pathname = request.nextUrl.pathname;

  // Allow static next/image/assets resources
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/images/") ||
    pathname === "/favicon.ico"
  ) {
    return null;
  }

  // Allow API routes through directly
  if (pathname.startsWith("/api/")) {
    return null;
  }

  // Obsolete & competing redirects (301 Permanent)
  const SOMERSET_REDIRECTS: Record<string, string> = {
    "/transportation": "/somerset-amphitheater-shuttle",
    "/concerts": "/somerset-concert-transportation",
    "/apple-river-tubing": "/",
    "/rivers-edge-campground": "/somerset-amphitheater-parking-and-transportation",
    "/mystic-lake-amphitheater": "/",
    "/the-ledge-amphitheater": "/",
  };

  if (SOMERSET_REDIRECTS[pathname]) {
    return NextResponse.redirect(new URL(SOMERSET_REDIRECTS[pathname], request.url), 301);
  }

  // Core canonical routes
  const SOMERSET_CANONICAL_REWRITES: Record<string, string> = {
    "/": "/somerset-wi",
    "/somerset-amphitheater-shuttle": "/somerset-wi/somerset-amphitheater-shuttle",
    "/somerset-concert-transportation": "/somerset-wi/somerset-concert-transportation",
    "/somerset-amphitheater-parking-and-transportation": "/somerset-wi/somerset-amphitheater-parking-and-transportation",
    "/sitemap.xml": "/somerset-wi/sitemap.xml",
    "/agent.json": "/somerset-wi/agent.json",
    "/.well-known/agent.json": "/somerset-wi/agent.json",
    "/llms.txt": "/somerset-wi/llms.txt",
  };

  const dest = SOMERSET_CANONICAL_REWRITES[pathname];
  if (dest) {
    const url = request.nextUrl.clone();
    url.pathname = dest;
    const response = NextResponse.rewrite(url, {
      request: { headers: getSomersetBrandShellHeaders(request) },
    });
    response.headers.set("x-robots-tag", "index, follow");
    return response;
  }

  // Any other URL on Somerset host collapses to root
  return NextResponse.redirect(new URL("/", request.url), 301);
}

export function getWtonotHostRewrite(request: NextRequest) {
  const hostHeader = request.headers.get("x-forwarded-host") || request.nextUrl.hostname;
  const host = hostHeader.split(":")[0];
  if (!WTONOT_HOSTS.has(host)) return null;

  const pathname = request.nextUrl.pathname;

  // Allow static next/image/assets resources and API routes
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/api/") ||
    pathname === "/favicon.ico" ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt"
  ) {
    return null;
  }

  const url = request.nextUrl.clone();

  // Root -> /new-orleans
  if (pathname === "/") {
    url.pathname = "/new-orleans";
    return url;
  }

  // Contact
  if (pathname === "/contact") {
    url.pathname = "/new-orleans/contact";
    return url;
  }

  const supportRoutes = new Set([
    "/privacy",
    "/terms",
    "/cancellation-policy",
    "/affiliate-disclosure",
    "/accessibility",
    "/booking-help",
    "/faq",
    "/about",
    "/how-we-choose",
  ]);

  if (supportRoutes.has(pathname)) {
    url.pathname = `/new-orleans${pathname}`;
    return url;
  }

  // Decision comparison hub and detail pages
  if (pathname === "/compare" || pathname.startsWith("/compare/")) {
    url.pathname = `/new-orleans${pathname}`;
    return url;
  }

  // /tours -> /new-orleans/tours
  if (pathname === "/tours") {
    url.pathname = "/new-orleans/tours";
    return url;
  }

  // Tour detail pages
  if (pathname.startsWith("/tours/")) {
    const slug = pathname.slice(7);
    if (slug) {
      url.pathname = `/new-orleans/tours/${slug}`;
      return url;
    }
  }

  // New Orleans Marketplace Top-Level Routes
  const allowedCategories = new Set([
    "city-tours",
    "swamp-tours",
    "airboat-tours",
    "covered-swamp-boat-tours",
    "plantation-tours",
    "ghost-tours",
    "cemetery-tours",
    "cooking-classes",
    "riverboat-cruises",
    "food-tours",
    "walking-tours",
    "private-tours",
    "night-tours"
  ]);

  // Handle /category or /category/comparison
  const pathParts = pathname.split('/').filter(Boolean);
  if (pathParts.length >= 1 && pathParts.length <= 2 && allowedCategories.has(pathParts[0])) {
    url.pathname = `/new-orleans/marketplace-category${pathname}`;
    return url;
  }

  // Areas
  if (pathname.startsWith("/areas/")) {
    url.pathname = `/new-orleans${pathname}`;
    return url;
  }

  // Welcome Stop
  if (pathname === "/french-quarter-welcome-stop") {
    url.pathname = `/new-orleans${pathname}`;
    return url;
  }

  // Help Me Choose
  if (pathname === "/help-me-choose") {
    url.pathname = `/new-orleans${pathname}`;
    return url;
  }

  // Traveler Fit
  if (pathname.startsWith("/tours-for/")) {
    url.pathname = `/new-orleans${pathname}`;
    return url;
  }

  // Guides
  if (pathname.startsWith("/guides/")) {
    url.pathname = `/new-orleans${pathname}`;
    return url;
  }

  // Operators
  if (pathname === "/operators/nola-ghost-riders") {
    url.pathname = "/new-orleans/tours/nola-ghost-riders";
    return url;
  }
  if (pathname === "/operators/airboat-adventures") {
    url.pathname = "/new-orleans/tours/airboat-adventures";
    return url;
  }

  if (pathname === "/operators" || pathname.startsWith("/operators/")) {
    url.pathname = `/new-orleans${pathname}`;
    return url;
  }

  // Block all other DCC/admin/operator pages on New Orleans tours domain by rewriting to /not-found
  url.pathname = "/not-found";
  return url;
}

function getLfseHostRewrite(request: NextRequest) {
  const hostHeader = request.headers.get("x-forwarded-host") || request.nextUrl.hostname;
  const host = hostHeader.split(":")[0];
  if (!LFSE_HOSTS.has(host)) return null;

  const pathname = request.nextUrl.pathname;

  // Allow static next/image/assets resources
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/images/") ||
    pathname === "/favicon.ico" ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt"
  ) {
    return null;
  }

  const url = request.nextUrl.clone();

  // Root -> /alaska
  if (pathname === "/") {
    url.pathname = "/alaska";
    return url;
  }

  // /tours -> /tours (allow)
  if (pathname === "/tours" || pathname.startsWith("/tours/")) {
    return url;
  }

  // /ports -> /ports (allow)
  if (pathname === "/ports") {
    return url;
  }

  // Allowed core Alaska cruise ports only (Juneau, Skagway, Ketchikan)
  const allowedPorts = new Set([
    "juneau",
    "skagway",
    "ketchikan"
  ]);

  if (pathname.startsWith("/ports/")) {
    const slug = pathname.slice(7);
    if (allowedPorts.has(slug)) {
      return url;
    }
  }

  // Block all other DCC/admin/operator pages on LFSE domain by rewriting to /not-found
  url.pathname = "/not-found";
  return url;
}

function getLfseBrandShellHeaders(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(WTONOT_BRAND_SHELL_HEADER, "lfse");
  return requestHeaders;
}

function getWtonotBrandShellHeaders(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(WTONOT_BRAND_SHELL_HEADER, "wtonot");
  return requestHeaders;
}

function isDocumentPath(pathname: string) {
  if (pathname.startsWith("/_next/")) return false;
  if (pathname.startsWith("/api/")) return false;
  if (pathname.includes(".")) return false;
  return true;
}

export function getGovernedRobotsTag(pathname: string) {
  if (!isDocumentPath(pathname)) return null;
  if (pathname.startsWith("/go/")) return null;
  if (SOMERSET_INDEXABLE_PATHS.has(pathname)) return "index, follow";
  return isIndexableSurfacePath(pathname) ? "index, follow" : "noindex, nofollow";
}

function readBearerToken(request: NextRequest): string {
  const raw = request.headers.get("authorization") || "";
  if (!raw.toLowerCase().startsWith("bearer ")) return "";
  return raw.slice(7).trim();
}

function checkInternalApiAuthorization(request: NextRequest): {
  authorized: boolean;
  statusCode?: 401 | 403 | 429;
  error?: string;
  code?: string;
} {
  if (request.nextUrl.pathname === "/api/internal/satellite-handoffs/events") {
    const hasToken = Boolean(
      request.headers.get("x-dcc-satellite-token") ||
        request.nextUrl.searchParams.get("token"),
    );
    return hasToken
      ? { authorized: true }
      : { authorized: false, statusCode: 401, error: "Missing satellite token." };
  }
  if (request.nextUrl.pathname === "/api/internal/hydrate-pipeline") {
    return { authorized: true };
  }

  // 1. HMAC Signature verification (e.g. CP-to-DCC service requests)
  if (
    request.headers.get("x-dcc-signature") ||
    request.headers.get("x-dcc-key-id")
  ) {
    const result = verifyServiceRequestHeaders({
      headers: request.headers,
      method: request.method,
      pathname: request.nextUrl.pathname,
      searchParams: request.nextUrl.searchParams,
    });
    if (!result.authorized) {
      return {
        authorized: false,
        statusCode: result.statusCode,
        error: result.error,
        code: result.code,
      };
    }
    return { authorized: true };
  }

  // 2. Admin session cookie or admin access key
  const adminSession = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (isValidAdminSession(adminSession)) {
    return { authorized: true };
  }
  const adminKeyHeader =
    request.headers.get("x-admin-access-key")?.trim() ||
    request.headers.get("x-earthos-admin-key")?.trim() ||
    "";
  const bearerSecret = readBearerToken(request);
  if (isValidAdminAccessKey(adminKeyHeader) || isValidAdminAccessKey(bearerSecret)) {
    return { authorized: true };
  }

  // 3. EarthOS API / Admin key
  const earthosKey = process.env.EARTHOS_API_KEY?.trim();
  const earthosAdminKey = process.env.EARTHOS_ADMIN_KEY?.trim();
  const earthosHeader = request.headers.get("x-earthos-api-key")?.trim() || "";
  if (earthosKey && (earthosKey === earthosHeader || earthosKey === bearerSecret)) {
    return { authorized: true };
  }
  if (earthosAdminKey && (earthosAdminKey === adminKeyHeader || earthosAdminKey === bearerSecret)) {
    return { authorized: true };
  }

  // 4. Vercel CRON_SECRET (allowed strictly for GET /api/internal/earthos/reference-maintenance detection)
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (cronSecret && bearerSecret === cronSecret) {
    if (
      request.method.toUpperCase() === "GET" &&
      request.nextUrl.pathname === "/api/internal/earthos/reference-maintenance" &&
      request.nextUrl.searchParams.get("mode") !== "state"
    ) {
      return { authorized: true };
    }
    return {
      authorized: false,
      statusCode: 403,
      error: "scheduled_detection_cannot_mutate_or_approve",
    };
  }

  // 5. Internal secret header / Bearer fallback
  const internalSecret = process.env.INTERNAL_API_SECRET?.trim();
  if (!internalSecret)
    return {
      authorized: false,
      statusCode: 401,
      error: "Internal API unconfigured.",
    };
  const headerSecret = request.headers.get("x-internal-secret")?.trim() || "";
  if (internalSecret === headerSecret || internalSecret === bearerSecret) {
    return { authorized: true };
  }

  return { authorized: false, statusCode: 401, error: "Unauthorized." };
}

function buildHandoffEventPayload(request: NextRequest, resolved: NonNullable<ReturnType<typeof resolveGoRedirect>>) {
  const partySizeRaw =
    request.nextUrl.searchParams.get("partySize") || request.nextUrl.searchParams.get("qty");
  const quantity = partySizeRaw ? Number.parseInt(partySizeRaw, 10) : undefined;
  const isJuneauHeli = request.nextUrl.pathname === JUNEAU_HELICOPTER_GO_PATH;
  const isVegasDeals = request.nextUrl.pathname === VEGAS_DEALS_GO_PATH;
  const isRedRocksFastPass = request.nextUrl.pathname === RED_ROCKS_FASTPASS_GO_PATH;
  const isNewOrleansSwamp = request.nextUrl.pathname === NEW_ORLEANS_SWAMP_GO_PATH;
  const decisionCorridor =
    request.nextUrl.searchParams.get("decision_corridor")
    || (isRedRocksFastPass
      ? "red-rocks-fastpass"
      : isNewOrleansSwamp
        ? "swamp-tours"
        : isJuneauHeli
          ? "juneau-helicopter-tours"
          : isVegasDeals
            ? "vegas-deals"
            : "red-rocks-transport");
  const decisionAction =
    request.nextUrl.searchParams.get("decision_action")
    || (isRedRocksFastPass
      ? "continue_red_rocks_fast_pass"
      : isNewOrleansSwamp
        ? "continue_swamp_tour_planning"
        : isJuneauHeli
          ? "continue_juneau_helicopter_booking"
          : isVegasDeals
            ? "continue_vegas_deals"
            : resolved.routeId === "intent_parr_rr_private_fallback"
              ? "book_private_red_rocks_ride"
              : "book_shared_red_rocks_shuttle");
  const decisionProduct =
    request.nextUrl.searchParams.get("decision_product")
    || (isRedRocksFastPass
      ? resolved.routeId === "intent_dcc_red_rocks_status_fallback"
        ? "dcc-red-rocks-status-fallback"
        : "red-rocks-fast-pass-day-trip"
      : isNewOrleansSwamp
        ? resolved.routeId === "intent_dcc_swamp_hub_fallback"
          ? "dcc-new-orleans-swamp-fallback"
          : "wts-swamp-plan"
        : isJuneauHeli
          ? resolved.routeId === "intent_dcc_juneau_whale_fallback"
            ? "dcc-juneau-whale-fallback"
            : "wta-juneau-helicopter-fast-pass"
          : isVegasDeals
            ? resolved.routeId === "intent_dcc_vegas_hub_fallback"
              ? "dcc-vegas-hub-fallback"
              : "sots-vegas-deals"
            : resolved.routeId === "intent_parr_rr_private_fallback"
              ? "parr-private-red-rocks"
              : "parr-shared-red-rocks");
  const decisionOption =
    request.nextUrl.searchParams.get("decision_option")
    || (decisionProduct.includes("private") ? "private" : "shuttle");
  const decisionState =
    request.nextUrl.searchParams.get("decision_state")
    || "continuing";

  return {
    handoffId: resolved.handoffId,
    satelliteId: isRedRocksFastPass
      ? "redrocksfastpass"
      : isNewOrleansSwamp
        ? "welcometotheswamp"
        : isJuneauHeli
      ? "welcome-to-alaska"
      : isVegasDeals
        ? "saveonthestrip"
        : "partyatredrocks",
    eventType: "handoff_viewed",
    occurredAt: new Date().toISOString(),
    source: "dcc_edge_router",
    sourcePath: request.nextUrl.pathname,
    status: resolved.status,
    stage: "partner_handoff",
    message: resolved.reasons.join(" | ") || `Resolved via ${resolved.routeId || "unknown_route"}`,
    attribution: {
      sourcePage:
        request.nextUrl.searchParams.get("sourcePage") ||
        request.nextUrl.searchParams.get("source_page") ||
        request.nextUrl.pathname,
      sourceSlug: isRedRocksFastPass
        ? "dcc-red-rocks-fastpass-go"
        : isNewOrleansSwamp
          ? "dcc-new-orleans-swamp-go"
          : isJuneauHeli
        ? "dcc-juneau-heli-go"
        : isVegasDeals
          ? "dcc-vegas-deals-go"
          : "dcc-red-rocks-shared-go",
      topicSlug: isRedRocksFastPass
        ? "red-rocks-fastpass"
        : isNewOrleansSwamp
          ? "swamp-tours"
          : isJuneauHeli
        ? "helicopter-tours"
        : isVegasDeals
          ? "vegas-deals"
          : "red-rocks-transportation",
    },
    booking: {
      venueSlug: request.nextUrl.searchParams.get("venue") || (
        isJuneauHeli
          ? "juneau"
          : isVegasDeals
            ? "las-vegas"
            : isNewOrleansSwamp
              ? "new-orleans"
              : "red-rocks-amphitheatre"
      ),
      citySlug: isVegasDeals ? "las-vegas" : isNewOrleansSwamp ? "new-orleans" : undefined,
      productSlug: decisionProduct,
      eventDate: request.nextUrl.searchParams.get("date") || undefined,
      quantity: Number.isFinite(quantity) ? quantity : undefined,
    },
    metadata: {
      destinationUrl: resolved.destinationUrl,
      routeId: resolved.routeId || "none",
      ctaText: resolved.ctaText,
      decisionCorridor,
      decisionAction,
      decisionOption,
      decisionProduct,
      decisionState,
      resolverReasons: resolved.reasons.join(" | ") || null,
      activeSignalCount: resolved.activeSignals.length,
      activeSignalsJson: resolved.activeSignals.length
        ? JSON.stringify(
            resolved.activeSignals.map((signal) => ({
              subjectId: signal.subjectId,
              signalType: signal.signalType,
              status: signal.status,
              expiresAt: signal.expiresAt || null,
            }))
          )
        : "[]",
    },
  };
}

function resolveProxySatelliteId(pathname: string): DccSatelliteId {
  if (pathname === RED_ROCKS_FASTPASS_GO_PATH) return "redrocksfastpass";
  if (pathname === NEW_ORLEANS_SWAMP_GO_PATH) return "welcometotheswamp";
  if (pathname === JUNEAU_HELICOPTER_GO_PATH) return "welcome-to-alaska";
  if (pathname === VEGAS_DEALS_GO_PATH) return "saveonthestrip";
  return "partyatredrocks";
}

function resolveEdgeSafeSatelliteWebhookToken(satelliteId: DccSatelliteId) {
  if (satelliteId === "partyatredrocks") {
    return process.env.DCC_PARR_WEBHOOK_TOKEN?.trim()
      || process.env.DCC_SATELLITE_WEBHOOK_TOKEN?.trim()
      || null;
  }

  if (satelliteId === "saveonthestrip") {
    return process.env.DCC_SAVEONTHESTRIP_WEBHOOK_TOKEN?.trim()
      || process.env.DCC_SATELLITE_WEBHOOK_TOKEN?.trim()
      || null;
  }

  if (satelliteId === "redrocksfastpass") {
    return process.env.DCC_REDROCKSFASTPASS_WEBHOOK_TOKEN?.trim()
      || process.env.DCC_SATELLITE_WEBHOOK_TOKEN?.trim()
      || null;
  }

  if (satelliteId === "welcometotheswamp") {
    return process.env.DCC_WTS_WEBHOOK_TOKEN?.trim()
      || process.env.DCC_SATELLITE_WEBHOOK_TOKEN?.trim()
      || null;
  }

  return process.env.DCC_WTA_WEBHOOK_TOKEN?.trim()
    || process.env.DCC_SATELLITE_WEBHOOK_TOKEN?.trim()
    || null;
}

function queueHandoffEvent(request: NextRequest, resolved: NonNullable<ReturnType<typeof resolveGoRedirect>>) {
  const token = resolveEdgeSafeSatelliteWebhookToken(resolveProxySatelliteId(request.nextUrl.pathname));
  if (!token) return Promise.resolve();

  const url = new URL("/api/internal/satellite-handoffs/events", request.url);
  const payload = buildHandoffEventPayload(request, resolved);

  return fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-dcc-satellite-token": token,
      ...(process.env.INTERNAL_API_SECRET ? { "x-internal-secret": process.env.INTERNAL_API_SECRET } : {}),
    },
    body: JSON.stringify(payload),
  }).catch(() => undefined);
}

// Ensure destinationcommandcenter.com/ falls through to standard Next.js routing (app/page.tsx)
export async function proxy(request: NextRequest, event: NextFetchEvent) {
  const hostHeader = request.headers.get("x-forwarded-host") || request.nextUrl.hostname;
  const host = hostHeader.split(":")[0];

  // Enforce www canonical host redirection for LFSE
  if (host === "lastfrontiershoreexcursions.com") {
    return NextResponse.redirect(`https://www.lastfrontiershoreexcursions.com${request.nextUrl.pathname}${request.nextUrl.search}`, 308);
  }

  if (request.nextUrl.pathname.startsWith("/api/internal/")) {
    const auth = checkInternalApiAuthorization(request);
    if (!auth.authorized) {
      return NextResponse.json(
        { ok: false, error: auth.error || "Unauthorized.", code: auth.code },
        { status: auth.statusCode || 401 },
      );
    }
  }

  // Time-decay routing for cruise ports based on hours until arrival parameter `t`
  const portMatch = request.nextUrl.pathname.match(/^\/cruise-ports\/([^/]+)$/);
  if (portMatch) {
    const tRaw = request.nextUrl.searchParams.get("t");
    if (tRaw) {
      const t = parseFloat(tRaw);
      if (!isNaN(t)) {
        if (t <= 12) {
          const transferUrl = process.env.SQUARE_TRANSFER_LINK || "https://checkout.square.site/pay/emergency-port-transfer";
          return NextResponse.redirect(new URL(transferUrl), 307);
        } else if (t <= 48) {
          if (request.nextUrl.searchParams.get("tab") !== "logistics") {
            const url = request.nextUrl.clone();
            url.searchParams.set("tab", "logistics");
            return NextResponse.redirect(url, 307);
          }
        } else {
          if (request.nextUrl.searchParams.get("tab") !== "excursions") {
            const url = request.nextUrl.clone();
            url.searchParams.set("tab", "excursions");
            return NextResponse.redirect(url, 307);
          }
        }
      }
    }
  }

  if (request.nextUrl.pathname === "/dashboard") {
    return NextResponse.redirect(new URL("/internal/dashboard", request.url), 307);
  }
  if (request.nextUrl.pathname.startsWith("/dashboard/")) {
    const relativePath = request.nextUrl.pathname.slice(11);
    return NextResponse.redirect(new URL(`/internal/dashboard/${relativePath}${request.nextUrl.search}`, request.url), 307);
  }

  if (
    request.nextUrl.pathname === "/internal/dashboard" ||
    request.nextUrl.pathname.startsWith("/internal/dashboard/")
  ) {
    const isServerActionPost =
      request.method.toUpperCase() === "POST" && request.headers.has("next-action");
    if (!isServerActionPost) {
      const auth = checkInternalApiAuthorization(request);
      if (!auth.authorized) {
        const safeNext = request.nextUrl.pathname.startsWith("/internal/dashboard")
          ? request.nextUrl.pathname
          : "/internal/dashboard";
        const unlockHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow" />
  <title>EarthOS Mission Control — Operator Unlock Required</title>
  <style>
    body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; background: #09090b; color: #fafafa; display: flex; min-height: 100vh; align-items: center; justify-content: center; }
    .card { max-width: 440px; width: 100%; margin: 24px; padding: 32px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.12); background: rgba(24,24,27,0.92); box-shadow: 0 24px 60px rgba(0,0,0,0.5); }
    .kicker { font-size: 11px; font-weight: 800; letter-spacing: 0.24em; text-transform: uppercase; color: #f5c66c; }
    h1 { margin: 12px 0 8px; font-size: 26px; font-weight: 900; letter-spacing: -0.02em; }
    p { margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #a1a1aa; }
    input[type="password"] { box-sizing: border-box; width: 100%; padding: 12px 14px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.5); color: #fff; font-size: 14px; margin-bottom: 12px; }
    button { width: 100%; padding: 12px 16px; border-radius: 9999px; border: none; background: linear-gradient(180deg, #f5c66c, #21c6da); color: #120f0b; font-size: 13px; font-weight: 900; letter-spacing: 0.14em; text-transform: uppercase; cursor: pointer; }
  </style>
</head>
<body>
  <main class="card" data-earthos-auth-gate="unauthorized">
    <div class="kicker">EarthOS Mission Control · 401 Unauthorized</div>
    <h1>Operator Authentication Required</h1>
    <p>Private maintenance records, evidence reviews, and correction controls require an authorized EarthOS operator session.</p>
    <form action="/admin/unlock" method="post">
      <input type="hidden" name="next" value="${safeNext}" />
      <input type="password" name="key" required placeholder="Enter operator access key" autocomplete="current-password" />
      <button type="submit">Unlock EarthOS Mission Control</button>
    </form>
  </main>
</body>
</html>`;
        return new NextResponse(unlockHtml, {
          status: auth.statusCode || 401,
          headers: {
            "content-type": "text/html; charset=utf-8",
            "x-robots-tag": "noindex, nofollow",
            "cache-control": "no-store",
          },
        });
      }
    }
  }

  const somersetResponse = handleSomersetHost(request);
  if (somersetResponse) {
    return somersetResponse;
  }

  if (WTONOT_HOSTS.has(host.toLowerCase())) {
    if (host.toLowerCase() === "welcometoneworleanstours.com") {
      const targetUrl = new URL(request.url);
      targetUrl.hostname = "www.welcometoneworleanstours.com";
      targetUrl.protocol = "https:";
      return NextResponse.redirect(targetUrl, 308);
    }

    const pathname = request.nextUrl.pathname;
    if (pathname === "/new-orleans/tonight" || pathname === "/guides/new-orleans-tours-tonight") {
      return NextResponse.redirect(new URL("/guides/tonight", request.url), 308);
    }
    if (pathname === "/new-orleans/this-weekend") {
      return NextResponse.redirect(new URL("/guides/this-weekend", request.url), 308);
    }
    if (pathname === "/plantation-tours/oak-alley-vs-laura") {
      return NextResponse.redirect(new URL("/guides/oak-alley-plantation-tour-from-new-orleans", request.url), 308);
    }
    if (pathname === "/new-orleans/restaurant-partners" || pathname === "/guides/restaurant-partners") {
      return NextResponse.redirect(new URL("/contact", request.url), 308);
    }
    if (pathname === "/guides/french-quarter-orientation") {
      return NextResponse.redirect(new URL("/help-me-choose", request.url), 308);
    }
    if (pathname === "/guides/tour-catalog") {
      return NextResponse.redirect(new URL("/tours", request.url), 308);
    }
  }

  const wtonotRewrite = getWtonotHostRewrite(request);
  if (wtonotRewrite) {
    const isNotFound = wtonotRewrite.pathname === "/not-found";
    const response = NextResponse.rewrite(wtonotRewrite, {
      request: { headers: getWtonotBrandShellHeaders(request) },
    });
    response.headers.set("x-robots-tag", isNotFound ? "noindex, nofollow" : "index, follow");
    return response;
  }

  const lfseRewrite = getLfseHostRewrite(request);
  if (lfseRewrite) {
    const isNotFound = lfseRewrite.pathname === "/not-found";
    const response = NextResponse.rewrite(lfseRewrite, {
      request: { headers: getLfseBrandShellHeaders(request) },
    });
    response.headers.set("x-robots-tag", isNotFound ? "noindex, nofollow" : "index, follow");
    return response;
  }

  if (request.nextUrl.pathname === WTONOT_ROOT_PATH) {
    const response = NextResponse.next({
      request: { headers: getWtonotBrandShellHeaders(request) },
    });
    response.headers.set("x-robots-tag", "index, follow");
    return response;
  }

  if (shouldReturnGone(request.nextUrl.pathname)) {
    return new NextResponse("Gone", {
      status: 410,
      headers: {
        "cache-control": "public, max-age=3600",
      },
    });
  }

  const signalMap =
    request.nextUrl.pathname === RED_ROCKS_SHARED_GO_PATH
      ? await getEdgeSignalMapForSubjects([...RED_ROCKS_SHARED_SIGNAL_SUBJECT_IDS])
      : request.nextUrl.pathname === RED_ROCKS_FASTPASS_GO_PATH
        ? await getEdgeSignalMapForSubjects([...RED_ROCKS_FASTPASS_SIGNAL_SUBJECT_IDS])
      : request.nextUrl.pathname === JUNEAU_HELICOPTER_GO_PATH
        ? await getEdgeSignalMapForSubjects([...JUNEAU_HELICOPTER_SIGNAL_SUBJECT_IDS])
        : request.nextUrl.pathname === NEW_ORLEANS_SWAMP_GO_PATH
          ? await getEdgeSignalMapForSubjects([...NEW_ORLEANS_SWAMP_SIGNAL_SUBJECT_IDS])
        : request.nextUrl.pathname === VEGAS_DEALS_GO_PATH
          ? await getEdgeSignalMapForSubjects([...VEGAS_DEALS_SIGNAL_SUBJECT_IDS])
        : undefined;

  const resolved = resolveGoRedirect({
    pathname: request.nextUrl.pathname,
    searchParams: request.nextUrl.searchParams,
    signalMap,
    experimentVariant: request.cookies.get(BRECKENRIDGE_SHARED_VARIANT_COOKIE)?.value,
    experimentBucketKey: request.nextUrl.searchParams.get("dcc_handoff_id") || "breckenridge-gosno-default",
  });

  if (!resolved) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", request.nextUrl.pathname);
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    const robotsTag = getGovernedRobotsTag(request.nextUrl.pathname);
    if (robotsTag) {
      response.headers.set("x-robots-tag", robotsTag);
    }
    return response;
  }

  if (request.nextUrl.pathname !== BRECKENRIDGE_SHARED_GO_PATH) {
    event.waitUntil(queueHandoffEvent(request, resolved));
  }

  const response = NextResponse.redirect(resolved.destinationUrl, 307);

  if (request.nextUrl.pathname === BRECKENRIDGE_SHARED_GO_PATH) {
    const variant = "gosno_default";

    response.cookies.set(BRECKENRIDGE_SHARED_VARIANT_COOKIE, variant, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
      secure: true,
    });
    response.headers.set("x-dcc-page-variant", variant);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
