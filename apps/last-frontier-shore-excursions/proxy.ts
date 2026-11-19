import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { handleSubAppEdgeContextAndPii } from "../../lib/dcc/shared/edgeContextAndPii";
import {
  SEAK_FISHING_LODGES_PATH,
  SEAK_FISHING_LODGES_RELEASE_READY,
} from "./lib/fishingLodgesConfig";

function withPreviewRobotsHeader<T extends Response>(
  response: T,
  pathname: string,
): T {
  const isNonProdEnv =
    Boolean(process.env.VERCEL_ENV) && process.env.VERCEL_ENV !== "production";
  const isUnreleasedFishingLodgesPreview =
    !SEAK_FISHING_LODGES_RELEASE_READY &&
    (pathname === SEAK_FISHING_LODGES_PATH ||
      pathname.startsWith(`${SEAK_FISHING_LODGES_PATH}/`));

  if (isNonProdEnv || isUnreleasedFishingLodgesPreview) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }
  return response;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const edgeResponse = await handleSubAppEdgeContextAndPii(request, {
    owner: "lastfrontiershoreexcursions.com",
    cookieName: "lfse_trip_ctx",
  });
  if (edgeResponse) {
    return withPreviewRobotsHeader(edgeResponse, pathname);
  }
  return withPreviewRobotsHeader(NextResponse.next(), pathname);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
