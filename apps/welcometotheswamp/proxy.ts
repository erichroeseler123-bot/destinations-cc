import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
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
      const dccBase = (
        process.env.DCC_API_BASE_URL ||
        process.env.NEXT_PUBLIC_DCC_API_URL ||
        "https://www.destinationcommandcenter.com"
      ).replace(/\/+$/, "");

      let redeemed = false;
      let errorCode = "REDEMPTION_FAILED";
      try {
        const res = await fetch(
          `${dccBase}/api/v1/context/${encodeURIComponent(rawCtx)}/edge-redeem`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ owner: "welcometotheswamp.com" }),
            cache: "no-store",
          }
        );
        const body = (await res.json().catch(() => ({}))) as { ok?: boolean; errorCode?: string };
        redeemed = Boolean(res.ok && body.ok);
        if (!redeemed && body.errorCode) errorCode = body.errorCode;
      } catch {
        errorCode = "DCC_UNREACHABLE_FAIL_CLOSED";
      }

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
      if (!redeemed) {
        redirectRes.headers.set("x-dcc-ctx-redemption", "failed");
        redirectRes.headers.set("x-dcc-ctx-error", errorCode);
        return redirectRes;
      }

      redirectRes.cookies.set("wts_trip_ctx", rawCtx, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24,
      });
      redirectRes.headers.set("x-dcc-ctx-redemption", "redeemed");
      return redirectRes;
    }
  }
  return NextResponse.next();
}
