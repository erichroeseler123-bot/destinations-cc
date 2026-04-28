import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const GONE_EXACT_PATHS = new Set([
  "/www.destinationcommandcenter.com/admin",
  "/yangon/tours",
  "/manaus/helicopter",
]);

const GONE_PREFIXES = [
  "/wp-content/",
] as const;

const VISIBLE_SURFACE_PATHS = new Set([
  "/",
  "/red-rocks-transportation",
  "/red-rocks-shuttle",
  "/red-rocks-parking",
  "/sedona/jeep-tours",
  "/juneau/helicopter-tours",
  "/juneau/whale-watching-tours",
  "/command",
  "/network",
  "/mighty-argo/status",
  "/mighty-argo",
  "/mighty-argo-shuttle",
]);

const GO_REDIRECTS: Record<string, string> = {
  "/go/red-rocks/shared": "https://www.partyatredrocks.com/book/red-rocks-amphitheatre/custom/shared",
  "/go/red-rocks/fastpass": "https://redrocksfastpass.com",
  "/go/new-orleans/swamp-tours": "https://welcometotheswamp.com",
  "/go/juneau/helicopter-tours": "https://welcometoalaskatours.com",
  "/go/vegas/deals": "https://www.saveonthestrip.com/deals",
  "/go/denver/420-airport-pickup": "https://420friendlyairportpickup.com",
};

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
  return !VISIBLE_SURFACE_PATHS.has(pathname);
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

function appendSearchParams(destination: string, source: URLSearchParams) {
  const url = new URL(destination);
  for (const [key, value] of source.entries()) {
    if (value) url.searchParams.set(key, value);
  }
  return url;
}

export function proxy(request: NextRequest) {
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

  const redirectTarget = GO_REDIRECTS[request.nextUrl.pathname];
  if (redirectTarget) {
    return NextResponse.redirect(appendSearchParams(redirectTarget, request.nextUrl.searchParams), 307);
  }

  const response = NextResponse.next();
  if (shouldApplyInvisibleNoindex(request.nextUrl.pathname)) {
    response.headers.set("x-robots-tag", "noindex, nofollow");
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
