import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
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
    return NextResponse.redirect(new URL("/guides/oak-alley-plantation-tour-from-new-orleans", request.url), 308);
  }
  if (request.nextUrl.pathname === "/new-orleans/restaurant-partners") {
    return NextResponse.redirect(new URL("/contact", request.url), 308);
  }
  return NextResponse.next();
}
