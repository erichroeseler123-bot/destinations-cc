import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/guides/tour-catalog") {
    return NextResponse.redirect(new URL("/tours", request.url), 308);
  }
  return NextResponse.next();
}
