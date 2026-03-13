import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/adminAccess";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const redirectUrl = new URL("/admin/argo-waitlist", req.url);
  const res = NextResponse.redirect(redirectUrl);
  res.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: 0,
  });
  return res;
}
