import { NextResponse, type NextRequest } from "next/server";
import {
  getOrCreateCheckoutSession,
  JFD_CHECKOUT_COOKIE_NAME,
  JFD_CHECKOUT_COOKIE_OPTIONS,
} from "./lib/dccContext";

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname === "/book") {
    const contextId = searchParams.get("ctx")?.trim();
    if (contextId && contextId.startsWith("dcc_ctx_")) {
      const existingCookie = request.cookies.get(JFD_CHECKOUT_COOKIE_NAME)?.value;
      const sessionResult = await getOrCreateCheckoutSession(contextId, existingCookie);

      if (sessionResult.success && sessionResult.sessionToken) {
        const response = NextResponse.next();
        response.cookies.set(
          JFD_CHECKOUT_COOKIE_NAME,
          sessionResult.sessionToken,
          JFD_CHECKOUT_COOKIE_OPTIONS
        );
        return response;
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/book"],
};
