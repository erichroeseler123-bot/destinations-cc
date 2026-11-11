import { NextRequest, NextResponse } from "next/server";
import { handleSubAppEdgeContextAndPii } from "../../lib/dcc/shared/edgeContextAndPii";

export async function proxy(request: NextRequest) {
  const host = (
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    request.nextUrl.hostname ||
    ""
  )
    .split(":")[0]
    .toLowerCase();
  if (host === "welcometoneworleanstours.com") {
    const targetUrl = new URL(request.url);
    targetUrl.hostname = "www.welcometoneworleanstours.com";
    targetUrl.protocol = "https:";
    return NextResponse.redirect(targetUrl, 308);
  }

  const legacyRootGuideRedirects: Record<string, string> = {
    "/things-to-do-in-new-orleans-today": "/guides/things-to-do-in-new-orleans-today",
    "/things-to-do-before-a-cruise-new-orleans": "/guides/things-to-do-before-a-cruise-new-orleans",
    "/things-to-do-after-a-cruise-new-orleans": "/guides/things-to-do-after-a-cruise-new-orleans",
    "/4-hours-in-new-orleans": "/guides/4-hours-in-new-orleans",
    "/first-time-new-orleans-tours": "/guides/first-time-new-orleans-tours",
  };

  const legacyGuideDest = legacyRootGuideRedirects[request.nextUrl.pathname];
  if (legacyGuideDest) {
    const targetUrl = new URL(legacyGuideDest, request.url);
    targetUrl.search = request.nextUrl.search;
    return NextResponse.redirect(targetUrl, 308);
  }
  if (request.nextUrl.pathname === "/guides/tour-catalog") {
    return NextResponse.redirect(new URL("/tours", request.url), 308);
  }
  if (request.nextUrl.pathname === "/guides/restaurant-partners") {
    return NextResponse.redirect(new URL("/contact", request.url), 308);
  }
  if (request.nextUrl.pathname === "/guides/new-orleans-tours-tonight") {
    return NextResponse.redirect(new URL("/guides/tonight", request.url), 308);
  }
  if (request.nextUrl.pathname === "/guides/french-quarter-orientation") {
    return NextResponse.redirect(new URL("/help-me-choose", request.url), 308);
  }
  if (request.nextUrl.pathname === "/new-orleans/tonight") {
    return NextResponse.redirect(new URL("/guides/tonight", request.url), 308);
  }
  if (request.nextUrl.pathname === "/new-orleans/this-weekend") {
    return NextResponse.redirect(new URL("/guides/this-weekend", request.url), 308);
  }
  if (request.nextUrl.pathname === "/plantation-tours/oak-alley-vs-laura") {
    return NextResponse.redirect(
      new URL("/guides/oak-alley-plantation-tour-from-new-orleans", request.url),
      308,
    );
  }
  if (request.nextUrl.pathname === "/new-orleans/restaurant-partners") {
    return NextResponse.redirect(new URL("/contact", request.url), 308);
  }
  if (request.nextUrl.pathname === "/operators/nola-ghost-riders") {
    return NextResponse.rewrite(new URL("/tours/nola-ghost-riders", request.url));
  }
  if (request.nextUrl.pathname === "/operators/airboat-adventures") {
    return NextResponse.rewrite(new URL("/tours/airboat-adventures", request.url));
  }

  const edgeResponse = await handleSubAppEdgeContextAndPii(request, {
    owner: "welcometoneworleanstours.com",
    cookieName: "wtno_trip_ctx",
  });
  if (edgeResponse) {
    return edgeResponse;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
