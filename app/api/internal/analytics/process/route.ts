import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/adminAccess";
import { verifyCollectorServerAuth } from "@/lib/dcc/analytics/collector";
import { runAnalyticsWorker } from "@/lib/dcc/analytics/worker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorizedWorkerTrigger(request: NextRequest): boolean {
  if (verifyCollectorServerAuth(request.headers)) return true;

  const cronSecret = process.env.CRON_SECRET?.trim() || process.env.INTERNAL_CRON_KEY?.trim();
  const auth = request.headers.get("authorization")?.trim() || "";
  if (cronSecret && auth === `Bearer ${cronSecret}`) return true;

  const session = request.cookies.get(ADMIN_SESSION_COOKIE)?.value || null;
  if (isValidAdminSession(session)) return true;

  // Allow Preview local/nonprod trigger when explicitly non-production
  if (process.env.VERCEL_ENV !== "production" && request.headers.get("x-dcc-preview-worker") === "1") {
    return true;
  }

  return false;
}

export async function POST(request: NextRequest) {
  if (!isAuthorizedWorkerTrigger(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      batchSize?: number;
      maxBatches?: number;
    };
    const result = runAnalyticsWorker({
      batchSize: typeof body.batchSize === "number" ? body.batchSize : undefined,
      maxBatches: typeof body.maxBatches === "number" ? body.maxBatches : undefined,
    });
    return NextResponse.json(result, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: "worker_failed",
        message: err instanceof Error ? err.message : "unknown_error",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedWorkerTrigger(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = runAnalyticsWorker();
    return NextResponse.json(result, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: "worker_failed",
        message: err instanceof Error ? err.message : "unknown_error",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
