import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionMaxAgeSeconds,
  buildAdminSessionValue,
  isValidAdminAccessKey,
} from "@/lib/adminAccess";

export const runtime = "nodejs";

const MAX_FAILED_ATTEMPTS = 6;
const WINDOW_MS = 15 * 60 * 1000;
const attemptsByIp = new Map<string, { count: number; firstTs: number; blockedUntil?: number }>();

function getClientIp(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(ip: string) {
  const entry = attemptsByIp.get(ip);
  if (!entry) return false;
  if (entry.blockedUntil && Date.now() < entry.blockedUntil) return true;
  return false;
}

function registerFailure(ip: string) {
  const now = Date.now();
  const existing = attemptsByIp.get(ip);
  if (!existing || now - existing.firstTs > WINDOW_MS) {
    attemptsByIp.set(ip, { count: 1, firstTs: now });
    return;
  }

  const count = existing.count + 1;
  const next = { ...existing, count };
  if (count >= MAX_FAILED_ATTEMPTS) {
    next.blockedUntil = now + WINDOW_MS;
  }
  attemptsByIp.set(ip, next);
}

function clearFailures(ip: string) {
  attemptsByIp.delete(ip);
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return new Response("Too many attempts. Try again later.", { status: 429 });
  }

  const formData = await req.formData();
  const key = String(formData.get("key") || "");
  const nextPathRaw = String(formData.get("next") || "/admin/argo-waitlist");
  const nextPath = nextPathRaw.startsWith("/admin") ? nextPathRaw : "/admin/argo-waitlist";

  const redirectUrl = new URL(nextPath, req.url);
  if (!isValidAdminAccessKey(key)) {
    registerFailure(ip);
    return NextResponse.redirect(redirectUrl);
  }

  clearFailures(ip);
  const res = NextResponse.redirect(redirectUrl);
  res.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: buildAdminSessionValue(),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: adminSessionMaxAgeSeconds(),
  });
  return res;
}
