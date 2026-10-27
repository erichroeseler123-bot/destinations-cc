import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || request.nextUrl.hostname || "").split(":")[0].toLowerCase();
  if (host === "welcometoneworleanstours.com") {
    const targetUrl = new URL(request.url);
    targetUrl.hostname = "www.welcometoneworleanstours.com";
    targetUrl.protocol = "https:";
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
    return NextResponse.redirect(new URL("/guides/oak-alley-plantation-tour-from-new-orleans", request.url), 308);
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
            body: JSON.stringify({ owner: "welcometoneworleanstours.com" }),
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

      redirectRes.cookies.set("wtno_trip_ctx", rawCtx, {
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
