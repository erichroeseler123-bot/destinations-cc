import { NextRequest, NextResponse } from "next/server";
import { collectAnalyticsRawPayload } from "@/lib/dcc/analytics/collector";
import { scheduleServerlessAfterTask } from "@/lib/dcc/analytics/serverlessLifecycle";
import { runAnalyticsWorker } from "@/lib/dcc/analytics/worker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OPPORTUNISTIC_WORKER_COOLDOWN_MS = 15_000;
let lastOpportunisticWorkerTriggeredAt = 0;

const ALLOWED_ORIGIN_RE =
  /^https?:\/\/([a-z0-9-]+\.)?(destinationcommandcenter\.com|cruisepromenade\.com|lastfrontiershoreexcursions\.com|juneauflightdeck\.com|welcometoneworleanstours\.com|welcometotheswamp\.com|vibearoundtown\.com|gosno\.co|feastlyspread\.com|brinkberry\.com|partyatredrocks\.com|420friendlyairportpickup\.com|welcometothedells\.com|saveonthestrip\.com|frenchquarterorientation\.com|vercel\.app|localhost|127\.0\.0\.1)(:\d+)?$/i;

function withCollectorCors(request: NextRequest, response: NextResponse): NextResponse {
  const origin = request.headers.get("origin");
  if (origin && ALLOWED_ORIGIN_RE.test(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Vary", "Origin");
  } else {
    response.headers.set("Access-Control-Allow-Origin", "*");
  }
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-dcc-internal-secret, x-dcc-service-secret, x-qa-test, x-dcc-telemetry-test, x-dcc-synthetic-verification, x-dcc-defer-worker",
  );
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function OPTIONS(request: NextRequest) {
  return withCollectorCors(request, new NextResponse(null, { status: 204 }));
}

export async function POST(request: NextRequest) {
  let rawBodyText = "";
  try {
    rawBodyText = await request.text();
  } catch {
    return withCollectorCors(
      request,
      NextResponse.json({ ok: false, accepted: false, error: "unreadable_body" }, { status: 400 }),
    );
  }

  const result = await collectAnalyticsRawPayload({
    rawBodyText,
    headers: request.headers,
  });

  // Piggyback non-blocking worker drain inside `after()` while Neon compute is ALREADY awake for this collector write (0 extra idle DB wakes).
  // Callers verifying cross-instance queue survival can pass `x-dcc-defer-worker: 1` to keep rows queued for a separate worker.
  const deferWorker =
    request.headers.get("x-dcc-defer-worker") === "1" ||
    process.env.DCC_DISABLE_OPPORTUNISTIC_WORKER === "1";
  const nowMs = Date.now();
  if (
    result.queuedCount > 0 &&
    !deferWorker &&
    nowMs - lastOpportunisticWorkerTriggeredAt >= OPPORTUNISTIC_WORKER_COOLDOWN_MS
  ) {
    lastOpportunisticWorkerTriggeredAt = nowMs;
    scheduleServerlessAfterTask(async () => {
      await runAnalyticsWorker({ batchSize: 100, maxBatches: 2 });
    });
  }

  const response = NextResponse.json(result, { status: result.status });
  if (result.dbTelemetry) {
    response.headers.set(
      "X-DCC-Analytics-Backend",
      `${result.dbTelemetry.backend}:${result.dbTelemetry.databaseName}`,
    );
  }
  if (result.status === 429) {
    response.headers.set("Retry-After", "60");
  }
  return withCollectorCors(request, response);
}
