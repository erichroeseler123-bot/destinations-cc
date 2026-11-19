import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { handleSubAppEdgeContextAndPii } from "../../lib/dcc/shared/edgeContextAndPii";
import {
  SEAK_FISHING_LODGES_CANONICAL_URL,
  SEAK_FISHING_LODGES_PATH,
  SEAK_FISHING_LODGES_RELEASE_READY,
} from "./lib/fishingLodgesConfig";

function withRobotsAndCanonicalHeaders<T extends Response>(
  response: T,
  request: NextRequest,
): T {
  const pathname = request.nextUrl.pathname;
  const isNonProdEnv =
    Boolean(process.env.VERCEL_ENV) && process.env.VERCEL_ENV !== "production";
  const isUnreleasedFishingLodges =
    !SEAK_FISHING_LODGES_RELEASE_READY &&
    (pathname === SEAK_FISHING_LODGES_PATH ||
      pathname.startsWith(`${SEAK_FISHING_LODGES_PATH}/`));

  if (isNonProdEnv || isUnreleasedFishingLodges) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    return response;
  }

  // Consolidate comparison / filter / print query variants on /southeast-alaska/fishing-lodges to canonical hub
  if (
    pathname === SEAK_FISHING_LODGES_PATH &&
    request.nextUrl.searchParams.size > 0
  ) {
    response.headers.set("X-Robots-Tag", "noindex, follow");
    response.headers.set(
      "Link",
      `<${SEAK_FISHING_LODGES_CANONICAL_URL}>; rel="canonical"`,
    );
  }

  return response;
}

export async function proxy(request: NextRequest) {
  const edgeResponse = await handleSubAppEdgeContextAndPii(request, {
    owner: "lastfrontiershoreexcursions.com",
    cookieName: "lfse_trip_ctx",
  });
  if (edgeResponse) {
    return withRobotsAndCanonicalHeaders(edgeResponse, request);
  }
  return withRobotsAndCanonicalHeaders(NextResponse.next(), request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
