import { NextRequest, NextResponse } from "next/server";
import { verifyServiceRequestHeaders } from "@/lib/dcc/auth/hmac-service-auth";
import { cleanupExpiredDccSessions, cleanupExpiredDccContexts } from "@/lib/dcc/context/service";

export const runtime = "nodejs";

async function handleCleanup(request: NextRequest, method: "GET" | "POST") {
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
      method,
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

  const [sessionCleanup, contextCleanup] = await Promise.all([
    cleanupExpiredDccSessions(),
    cleanupExpiredDccContexts(),
  ]);

  if (!sessionCleanup.success || !contextCleanup.success) {
    return NextResponse.json(
      {
        success: false,
        errorCode: "DATABASE_UNAVAILABLE",
        message: "Failed to purge or transition expired records.",
      },
      { status: 503 }
    );
  }

  return NextResponse.json({
    success: true,
    sessionsDeleted: sessionCleanup.deletedCount,
    contextsExpired: contextCleanup.expiredCount,
    contextsPurged: contextCleanup.purgedCount,
    timestamp: Date.now(),
  });
}

export async function GET(request: NextRequest) {
  return handleCleanup(request, "GET");
}

export async function POST(request: NextRequest) {
  return handleCleanup(request, "POST");
}
