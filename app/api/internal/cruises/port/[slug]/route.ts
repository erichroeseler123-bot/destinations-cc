import { NextResponse } from "next/server";
import {
  buildCruisePayload,
  normalizeCruiseSortMode,
} from "@/lib/dcc/internal/cruisePayload";
import { verifyServiceRequestHeaders } from "@/lib/dcc/auth/hmac-service-auth";
import { ingestApprovedFactsFromReviewDesk } from "@/lib/dcc/research/approvedFactsFeed";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const url = new URL(request.url);
  if (
    request.headers.get("x-dcc-signature") ||
    request.headers.get("x-dcc-key-id")
  ) {
    const auth = verifyServiceRequestHeaders({
      headers: request.headers,
      method: request.method,
      pathname: url.pathname,
      searchParams: url.searchParams,
    });
    if (!auth.authorized) {
      return NextResponse.json(
        { ok: false, error: auth.error, code: auth.code },
        {
          status: auth.statusCode,
          headers: {
            "Cache-Control": "private, no-store, max-age=0, must-revalidate",
          },
        },
      );
    }
  }

  const resolved = await params;
  const { searchParams } = url;
  const sortMode = normalizeCruiseSortMode(searchParams.get("sort"));
  const dateStart = searchParams.get("start") || undefined;
  const dateEnd = searchParams.get("end") || undefined;
  const rawNow = searchParams.get("now")?.trim();
  const parsedNow = rawNow
    ? /^\d+$/.test(rawNow)
      ? Number(rawNow)
      : Date.parse(rawNow)
    : undefined;
  const nowMs =
    parsedNow !== undefined && Number.isFinite(parsedNow) ? parsedNow : undefined;

  const [payload, researchIngestion] = await Promise.all([
    buildCruisePayload({
      type: "port",
      value: resolved.slug,
      dateStart,
      dateEnd,
      sortMode,
    }),
    ingestApprovedFactsFromReviewDesk({
      portSlug: resolved.slug.toLowerCase(),
      nowMs,
    }),
  ]);

  return NextResponse.json(
    {
      ...payload,
      approved_research_facts: {
        evaluated_at: researchIngestion.evaluated_at,
        review_desk_url: researchIngestion.review_desk_url,
        live_portal_readback_status: researchIngestion.live_portal_readback_status,
        live_portal_verified: researchIngestion.live_portal_verified,
        access_blocker: researchIngestion.access_blocker,
        verified_count: researchIngestion.verified_count,
        verified_facts: researchIngestion.verified_facts,
        recommended_max_age_seconds: researchIngestion.recommended_max_age_seconds,
      },
    },
    {
      status: 200,
      headers: {
        "Cache-Control": researchIngestion.cache_control_header,
        "X-DCC-Approved-Facts-Count": String(researchIngestion.verified_count),
      },
    },
  );
}
