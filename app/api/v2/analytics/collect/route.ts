import { NextRequest, NextResponse } from "next/server";
import { collectAnalyticsRawPayload } from "@/lib/dcc/analytics/collector";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    "Content-Type, Authorization, x-dcc-internal-secret, x-dcc-service-secret, x-qa-test, x-dcc-telemetry-test",
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

  const result = collectAnalyticsRawPayload({
    rawBodyText,
    headers: request.headers,
  });

  const response = NextResponse.json(result, { status: result.status });
  if (result.status === 429) {
    response.headers.set("Retry-After", "60");
  }
  return withCollectorCors(request, response);
}
