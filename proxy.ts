import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import {
  BRECKENRIDGE_SHARED_VARIANT_COOKIE,
} from "@/lib/dcc/routing/breckenridgeSharedExperiment";
import { SOMERSET_BASE_PATH, SOMERSET_PAGE_PATHS } from "@/lib/dcc/corridors/somersetPages";
import { getEdgeSignalMapForSubjects } from "@/lib/dcc/routing/edge-signals";
import { isIndexableSurfacePath } from "@/src/data/indexable-surface";
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

function getSomersetHostRewrite(request: NextRequest) {
  if (!SOMERSET_HOSTS.has(request.nextUrl.hostname)) return null;
  if (request.nextUrl.pathname.startsWith(SOMERSET_BASE_PATH)) return null;

  const destinationPath = SOMERSET_HOST_PATH_REWRITES.get(request.nextUrl.pathname);
  if (!destinationPath) return null;

  const url = request.nextUrl.clone();
  url.pathname = destinationPath;
  return url;
}

function getWtonotHostRewrite(request: NextRequest) {
  const hostHeader = request.headers.get("x-forwarded-host") || request.nextUrl.hostname;
  const host = hostHeader.split(":")[0];
  if (!WTONOT_HOSTS.has(host)) return null;

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

  // Root or /tours -> /new-orleans/tours
  if (pathname === "/" || pathname === "/tours") {
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

function isInternalApiAuthorized(request: NextRequest) {
  if (request.nextUrl.pathname === "/api/internal/satellite-handoffs/events") {
    return Boolean(request.headers.get("x-dcc-satellite-token") || request.nextUrl.searchParams.get("token"));
  }
  if (request.nextUrl.pathname === "/api/internal/hydrate-pipeline") {
    return true;
  }

  const internalSecret = process.env.INTERNAL_API_SECRET?.trim();
  if (!internalSecret) return false;
  const headerSecret = request.headers.get("x-internal-secret")?.trim() || "";
  const bearerSecret = readBearerToken(request);
  return internalSecret === headerSecret || internalSecret === bearerSecret;
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

  if (request.nextUrl.pathname.startsWith("/api/internal/") && !isInternalApiAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
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

  const somersetRewrite = getSomersetHostRewrite(request);
  if (somersetRewrite) {
    const response = NextResponse.rewrite(somersetRewrite);
    response.headers.set("x-robots-tag", "index, follow");
    return response;
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
