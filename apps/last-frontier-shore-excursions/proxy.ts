import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { handleSubAppEdgeContextAndPii } from "../../lib/dcc/shared/edgeContextAndPii";

export async function proxy(request: NextRequest) {
  const edgeResponse = await handleSubAppEdgeContextAndPii(request, {
    owner: "lastfrontiershoreexcursions.com",
    cookieName: "lfse_trip_ctx",
  });
  if (edgeResponse) {
    return edgeResponse;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
