import { NextResponse, type NextRequest } from "next/server";
import {
  redeemOpaqueContextEdge,
  signSessionTokenEdge,
  JFD_CHECKOUT_COOKIE_NAME,
  JFD_CHECKOUT_COOKIE_OPTIONS,
} from "./lib/edgeDcc";

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname === "/book") {
    const contextId = searchParams.get("ctx")?.trim();
    if (contextId && contextId.startsWith("dcc_ctx_")) {
      const existingCookie = request.cookies.get(JFD_CHECKOUT_COOKIE_NAME)?.value;
      if (!existingCookie) {
        const redeemResult = await redeemOpaqueContextEdge(contextId);
        if (redeemResult.success && redeemResult.data) {
          const sessionId = `jfd_sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
          const expiresAt = Date.now() + 60 * 60 * 1000;
          const token = await signSessionTokenEdge({
            sessionId,
            contextId,
            expiresAt,
          });

          const response = NextResponse.next();
          response.cookies.set(
            JFD_CHECKOUT_COOKIE_NAME,
            token,
            JFD_CHECKOUT_COOKIE_OPTIONS
          );
          return response;
        }
      }
    }
  }

  if (
    request.method === "GET" &&
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/.well-known/")
  ) {
    const rawCtx =
      searchParams.get("ctx")?.trim() ||
      searchParams.get("dcc_ctx")?.trim() ||
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
      redirectRes.cookies.set(JFD_CHECKOUT_COOKIE_NAME, rawCtx, {
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

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
