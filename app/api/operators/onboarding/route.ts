import { NextRequest, NextResponse } from "next/server";
import {
  buildEarthOSUnauthorizedResponse,
  verifyEarthOSAuthorization,
} from "@/lib/dcc/earthos/auth";
import {
  deleteOperatorOnboardingApplicationById,
  getOperatorOnboardingApplicationById,
  listOperatorOnboardingReviewQueue,
  submitOperatorOnboardingApplication,
  validateOperatorOnboardingApplication,
  type OperatorReviewQueueState,
} from "@/lib/dcc/operatorOnboardingStore";

export const dynamic = "force-dynamic";

export {
  validateOperatorOnboardingApplication,
  submitOperatorOnboardingApplication,
  getOperatorOnboardingApplicationById,
  listOperatorOnboardingReviewQueue,
  deleteOperatorOnboardingApplicationById,
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const result = await submitOperatorOnboardingApplication(body);
    return NextResponse.json(result, { status: result.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, errorCode: "invalid_request_body", message },
      { status: 400 },
    );
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const applicationId = url.searchParams.get("applicationId")?.trim();
  const retrievalToken =
    url.searchParams.get("retrievalToken")?.trim() ||
    req.headers.get("x-onboarding-retrieval-token")?.trim() ||
    null;

  const auth = await verifyEarthOSAuthorization(req);
  const isAuthorizedReviewer = auth.authorized && auth.actor !== "vercel:cron";

  // 1. Retrieve a specific persisted onboarding application (via retrievalToken or reviewer auth)
  if (applicationId) {
    const lookup = await getOperatorOnboardingApplicationById(applicationId, {
      retrievalToken,
      bypassTokenForAuthorizedReviewer: isAuthorizedReviewer,
    });
    if (!lookup.ok) {
      return NextResponse.json(lookup, { status: lookup.status });
    }
    return NextResponse.json({
      ok: true,
      persisted: true,
      storageBackend: lookup.application.storageBackend,
      application: lookup.application,
    });
  }

  // 2. Private Review Queue: requires reviewer/admin authorization
  if (!isAuthorizedReviewer) {
    return buildEarthOSUnauthorizedResponse(auth);
  }

  const reviewQueueState = (url.searchParams.get("reviewQueueState") || undefined) as
    | OperatorReviewQueueState
    | undefined;
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit")) || 100));

  const reviewQueue = await listOperatorOnboardingReviewQueue({
    reviewQueueState,
    limit,
  });

  return NextResponse.json({
    ok: true,
    actor: auth.actor,
    count: reviewQueue.length,
    reviewQueue,
  });
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const applicationId = url.searchParams.get("applicationId")?.trim() || "";
  const retrievalToken =
    url.searchParams.get("retrievalToken")?.trim() ||
    req.headers.get("x-onboarding-retrieval-token")?.trim() ||
    null;

  const auth = await verifyEarthOSAuthorization(req);
  const isAuthorizedReviewer = auth.authorized && auth.actor !== "vercel:cron";

  const result = await deleteOperatorOnboardingApplicationById(applicationId, {
    retrievalToken,
    bypassTokenForAuthorizedReviewer: isAuthorizedReviewer,
  });

  return NextResponse.json(result, { status: result.status });
}
