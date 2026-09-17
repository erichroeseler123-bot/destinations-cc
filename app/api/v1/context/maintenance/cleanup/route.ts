import { NextRequest, NextResponse } from "next/server";
import { verifyServiceRequestHeaders } from "@/lib/dcc/auth/hmac-service-auth";
import { cleanupExpiredDccSessions } from "@/lib/dcc/context/service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  // 1. Check CRON_SECRET authorization (e.g. Vercel Cron or Cloudflare Cron Trigger)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET?.trim();
  const isCronAuthorized =
    cronSecret &&
    authHeader &&
    (authHeader === `Bearer ${cronSecret}` || authHeader === cronSecret);

  // 2. Or verify DCC HMAC Service Authentication headers
  const isHmacAuthorized = (() => {
    if (isCronAuthorized) return true;
    const keyId = request.headers.get("x-dcc-key-id");
    if (!keyId) return false;
    const auth = verifyServiceRequestHeaders({
      headers: request.headers,
      method: "POST",
      pathname: "/api/v1/context/maintenance/cleanup",
    });
    return auth.authorized;
  })();

  if (!isCronAuthorized && !isHmacAuthorized) {
    return NextResponse.json(
      {
        success: false,
        errorCode: "UNAUTHORIZED",
        message: "Missing or invalid Cron Secret / HMAC Service Authorization.",
      },
      { status: 401 }
    );
  }

  const result = await cleanupExpiredDccSessions();

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        errorCode: "DATABASE_UNAVAILABLE",
        message: "Failed to purge expired records.",
      },
      { status: 503 }
    );
  }

  return NextResponse.json({
    success: true,
    deletedCount: result.deletedCount,
    timestamp: Date.now(),
  });
}
