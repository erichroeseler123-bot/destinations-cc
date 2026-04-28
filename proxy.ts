import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { getEdgeSignalMapForSubjects } from "@/lib/dcc/routing/edge-signals";
import { isVisibleSurfacePath } from "@/src/data/visible-surface";
import {
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

function shouldReturnGone(pathname: string) {
  if (GONE_EXACT_PATHS.has(pathname)) return true;
  return GONE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isDocumentPath(pathname: string) {
  if (pathname.startsWith("/_next/")) return false;
  if (pathname.startsWith("/api/")) return false;
  if (pathname.includes(".")) return false;
  return true;
}

function shouldApplyInvisibleNoindex(pathname: string) {
  if (!isDocumentPath(pathname)) return false;
  if (pathname.startsWith("/go/")) return false;
  return !isVisibleSurfacePath(pathname);
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
      productSlug: isRedRocksFastPass
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
            : "parr-shared-red-rocks",
      eventDate: request.nextUrl.searchParams.get("date") || undefined,
      quantity: Number.isFinite(quantity) ? quantity : undefined,
    },
    metadata: {
      destinationUrl: resolved.destinationUrl,
      routeId: resolved.routeId || "none",
      ctaText: resolved.ctaText,
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

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  if (request.nextUrl.pathname.startsWith("/api/internal/") && !isInternalApiAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
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
  });

  if (!resolved) {
    const response = NextResponse.next();
    if (shouldApplyInvisibleNoindex(request.nextUrl.pathname)) {
      response.headers.set("x-robots-tag", "noindex, nofollow");
    }
    return response;
  }

  event.waitUntil(queueHandoffEvent(request, resolved));
  return NextResponse.redirect(resolved.destinationUrl, 307);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
