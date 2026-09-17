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

  return NextResponse.next();
}

export const config = {
  matcher: ["/book"],
};
