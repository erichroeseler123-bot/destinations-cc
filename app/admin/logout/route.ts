import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/adminAccess";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const nextParam = req.nextUrl.searchParams.get("next") || "/admin/argo-waitlist";
  const nextPath =
    nextParam.startsWith("/admin") || nextParam.startsWith("/internal/dashboard")
      ? nextParam
      : "/admin/argo-waitlist";
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
