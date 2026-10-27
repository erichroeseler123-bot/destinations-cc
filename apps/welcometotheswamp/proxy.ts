import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  if (
    request.method === "GET" &&
    !request.nextUrl.pathname.startsWith("/api/") &&
    !request.nextUrl.pathname.startsWith("/.well-known/")
  ) {
    const rawCtx =
      request.nextUrl.searchParams.get("ctx")?.trim() ||
      request.nextUrl.searchParams.get("dcc_ctx")?.trim() ||
      "";
    if (rawCtx.startsWith("dcc_ctx_")) {
      const cleanUrl = request.nextUrl.clone();
      for (const param of [
        "ctx",
        "dcc_ctx",
        "name",
        "fullName",
        "firstName",
        "lastName",
        "email",
        "phone",
        "weight",
        "passengerWeight",
        "weights",
        "accessibility",
        "medicalNotes",
        "cabin",
        "cabinNumber",
        "stateroom",
        "stateroomNumber",
        "bookingRef",
        "reservationNumber",
        "pnr",
      ]) {
        cleanUrl.searchParams.delete(param);
      }

      const redirectRes = NextResponse.redirect(cleanUrl, 302);
      redirectRes.cookies.set("wts_trip_ctx", rawCtx, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24,
      });
      return redirectRes;
    }
  }
  return NextResponse.next();
}
