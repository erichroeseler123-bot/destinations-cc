import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/guides/tour-catalog") {
    return NextResponse.redirect(new URL("/tours", request.url), 308);
  }
  if (request.nextUrl.pathname === "/guides/restaurant-partners") {
    return NextResponse.redirect(new URL("/guides/where-to-eat", request.url), 308);
  }
  if (request.nextUrl.pathname === "/guides/new-orleans-tours-tonight") {
    return NextResponse.redirect(new URL("/guides/tonight", request.url), 308);
  }
  return NextResponse.next();
}
