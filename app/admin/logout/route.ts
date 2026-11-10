import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/adminAccess";

export const runtime = "nodejs";

function isPrefetchRequest(req: NextRequest): boolean {
  if (req.nextUrl.searchParams.has("_rsc")) return true;
  if (req.headers.get("next-router-prefetch") === "1") return true;
  const purpose = (
    req.headers.get("purpose") ||
    req.headers.get("sec-purpose") ||
    ""
  ).toLowerCase();
  return purpose.includes("prefetch") || purpose.includes("prerender");
}

function clearAdminSessionAndRedirect(req: NextRequest) {
  const nextParam = req.nextUrl.searchParams.get("next") || "/admin/inbox";
  const nextPath =
    nextParam.startsWith("/admin") || nextParam.startsWith("/internal/dashboard")
      ? nextParam
      : "/admin/inbox";
  const redirectUrl = new URL(nextPath, req.url);
  const res = NextResponse.redirect(redirectUrl);
  res.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}

export async function GET(req: NextRequest) {
  // Never clear the operator's active session cookie on Next.js RSC / browser link prefetches
  if (isPrefetchRequest(req)) {
    return new NextResponse(null, {
      status: 204,
      headers: { "Cache-Control": "private, no-store" },
    });
  }
  return clearAdminSessionAndRedirect(req);
}

export async function POST(req: NextRequest) {
  return clearAdminSessionAndRedirect(req);
}
