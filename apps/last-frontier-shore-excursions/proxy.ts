import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { handleSubAppEdgeContextAndPii } from "../../lib/dcc/shared/edgeContextAndPii";

function withPreviewRobotsHeader<T extends Response>(response: T): T {
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }
  return response;
}

export async function proxy(request: NextRequest) {
  const edgeResponse = await handleSubAppEdgeContextAndPii(request, {
    owner: "lastfrontiershoreexcursions.com",
    cookieName: "lfse_trip_ctx",
  });
  if (edgeResponse) {
    return withPreviewRobotsHeader(edgeResponse);
  }
  return withPreviewRobotsHeader(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
