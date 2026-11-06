import { NextRequest, NextResponse } from "next/server";
import {
  buildEarthOSUnauthorizedResponse,
  verifyEarthOSAuthorization,
} from "@/lib/dcc/earthos/auth";
import {
  deleteOperatorOnboardingApplicationById,
  getOperatorOnboardingApplicationById,
  isJeanLafitte763318Offer,
  listOperatorOnboardingReviewQueue,
  reviewOperatorOnboardingApplication,
  submitOperatorOnboardingApplication,
  type OperatorReviewQueueState,
  type ReviewOperatorOnboardingInput,
} from "@/lib/dcc/operatorOnboardingStore";
import {
  buildJeanLafitteOnboardingLifecyclePreview,
  getReadOnlyJeanLafitteSamplePreview,
  traceCheckoutOnboardingReferral,
} from "@/lib/dcc/operatorOnboardingPreview";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;

    if (body.action === "review_application") {
      return handleReviewRequest(req, body);
    }

    if (body.action === "qa_lifecycle_test") {
      const auth = await verifyEarthOSAuthorization(req);
      const isAuthorizedReviewer = auth.authorized && auth.actor !== "vercel:cron";
      if (!isAuthorizedReviewer) {
        return NextResponse.json(
          {
            ok: false,
            errorCode: "qa_authentication_required",
            message:
              "The end-to-end Jean Lafitte (#763318) onboarding lifecycle and attribution ledger test is restricted to authenticated QA.",
          },
          { status: 401 },
        );
      }
      const preview = await buildJeanLafitteOnboardingLifecyclePreview();
      return NextResponse.json({
        ok: true,
        mode: "authenticated_qa_live_test",
        actor: auth.actor,
        preview,
      });
    }

    // Block unauthenticated public POST submissions of the read-only Jean Lafitte (#763318) demo preset
    const isJeanLafitteDemoOffer = isJeanLafitte763318Offer({
      operatorName:
        typeof body.operatorName === "string"
          ? body.operatorName
          : typeof body.companyName === "string"
            ? body.companyName
            : undefined,
      exactTourOption:
        typeof body.exactTourOption === "string" ? body.exactTourOption : undefined,
      existingCheckoutLink:
        typeof body.existingCheckoutLink === "string"
          ? body.existingCheckoutLink
          : undefined,
      tourId: typeof body.tourId === "string" ? body.tourId : undefined,
      offerItemId: typeof body.offerItemId === "string" ? body.offerItemId : undefined,
    });

    if (isJeanLafitteDemoOffer) {
      const auth = await verifyEarthOSAuthorization(req);
      const isAuthorizedReviewer = auth.authorized && auth.actor !== "vercel:cron";
      if (!isAuthorizedReviewer) {
        return NextResponse.json(
          {
            ok: false,
            readOnlyDemo: true,
            isSampleData: true,
            queueAndLedgerUntouched: true,
            errorCode: "read_only_demo_submission_blocked",
            message:
              "Jean Lafitte (#763318) is a read-only sample demo on the public page and leaves the application queue and attribution ledger untouched. Switch to 'Enter Your Own Tour (Live Intake)' to submit a real tour, or authenticate with QA credentials to run the end-to-end test.",
          },
          { status: 403 },
        );
      }
    }

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

async function handleReviewRequest(
  req: NextRequest,
  body: Record<string, unknown>,
) {
  const url = new URL(req.url);
  const applicationId = String(
    body.applicationId || url.searchParams.get("applicationId") || "",
  ).trim();
  const retrievalToken =
    (typeof body.retrievalToken === "string" ? body.retrievalToken.trim() : "") ||
    url.searchParams.get("retrievalToken")?.trim() ||
    req.headers.get("x-onboarding-retrieval-token")?.trim() ||
    null;

  const auth = await verifyEarthOSAuthorization(req);
  const isAuthorizedReviewer = auth.authorized && auth.actor !== "vercel:cron";

  const reviewInput: ReviewOperatorOnboardingInput = {
    affiliateAccount:
      typeof body.affiliateAccount === "string" ? body.affiliateAccount : undefined,
    commissionRatePercent:
      typeof body.commissionRatePercent === "number"
        ? body.commissionRatePercent
        : typeof body.commissionRatePercent === "string" &&
            body.commissionRatePercent.trim() !== ""
          ? Number(body.commissionRatePercent)
          : undefined,
    refundTreatment:
      typeof body.refundTreatment === "string" ? body.refundTreatment : undefined,
    payoutTiming: typeof body.payoutTiming === "string" ? body.payoutTiming : undefined,
    bookingRecordDeliveryMethod:
      typeof body.bookingRecordDeliveryMethod === "string"
        ? body.bookingRecordDeliveryMethod
        : undefined,
    eligiblePickupStopsConfirmed: Array.isArray(body.eligiblePickupStopsConfirmed)
      ? body.eligiblePickupStopsConfirmed.map((s) => String(s))
      : undefined,
    reviewNotes: typeof body.reviewNotes === "string" ? body.reviewNotes : undefined,
    checkoutEvidence:
      body.checkoutEvidence && typeof body.checkoutEvidence === "object"
        ? (body.checkoutEvidence as ReviewOperatorOnboardingInput["checkoutEvidence"])
        : undefined,
    seatAvailabilityEvidence:
      body.seatAvailabilityEvidence && typeof body.seatAvailabilityEvidence === "object"
        ? (body.seatAvailabilityEvidence as ReviewOperatorOnboardingInput["seatAvailabilityEvidence"])
        : undefined,
    commissionEvidence:
      body.commissionEvidence && typeof body.commissionEvidence === "object"
        ? (body.commissionEvidence as ReviewOperatorOnboardingInput["commissionEvidence"])
        : undefined,
    apiBookingEvidence:
      body.apiBookingEvidence && typeof body.apiBookingEvidence === "object"
        ? (body.apiBookingEvidence as ReviewOperatorOnboardingInput["apiBookingEvidence"])
        : undefined,
  };

  for (const key of Object.keys(body)) {
    if (
      !(key in reviewInput) &&
      key !== "action" &&
      key !== "applicationId" &&
      key !== "retrievalToken" &&
      key !== "traceReferral" &&
      key !== "placementId"
    ) {
      (reviewInput as Record<string, unknown>)[key] = body[key];
    }
  }

  const reviewed = await reviewOperatorOnboardingApplication(applicationId, reviewInput, {
    retrievalToken,
    bypassTokenForAuthorizedReviewer: isAuthorizedReviewer,
    reviewerActor: isAuthorizedReviewer ? auth.actor || "dcc_reviewer" : "applicant_token_review",
  });

  if (!reviewed.ok) {
    return NextResponse.json(reviewed, { status: reviewed.status });
  }

  const shouldTrace =
    body.traceReferral === true || url.searchParams.get("traceReferral") === "true";
  const referralTrace = shouldTrace
    ? await traceCheckoutOnboardingReferral({
        application: reviewed.application,
        placementId:
          typeof body.placementId === "string"
            ? body.placementId
            : url.searchParams.get("placementId") || undefined,
        isTest: true,
      })
    : undefined;

  return NextResponse.json(
    {
      ok: true,
      persisted: true,
      storageBackend: reviewed.application.storageBackend,
      application: reviewed.application,
      ...(referralTrace ? { referralTrace } : {}),
    },
    { status: 200 },
  );
}

export async function PATCH(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    return handleReviewRequest(req, body);
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
  const previewSlug = url.searchParams.get("preview")?.trim();
  const mode = url.searchParams.get("mode")?.trim();

  if (previewSlug === "jean-lafitte-763318") {
    if (mode === "qa_live_test") {
      const auth = await verifyEarthOSAuthorization(req);
      const isAuthorizedReviewer = auth.authorized && auth.actor !== "vercel:cron";
      if (!isAuthorizedReviewer) {
        return NextResponse.json(
          {
            ok: false,
            errorCode: "qa_authentication_required",
            message:
              "Running the live end-to-end Jean Lafitte (#763318) submission-through-review test requires authenticated QA authorization.",
          },
          { status: 401 },
        );
      }
      const preview = await buildJeanLafitteOnboardingLifecyclePreview();
      return NextResponse.json({
        ok: true,
        mode: "authenticated_qa_live_test",
        readOnlyDemo: false,
        isSampleData: false,
        actor: auth.actor,
        preview,
      });
    }

    // Default public preview: strictly read-only sample data; leaves queue and attribution ledger untouched
    const samplePreview = getReadOnlyJeanLafitteSamplePreview();
    return NextResponse.json({
      ok: true,
      mode: "public_read_only_sample",
      readOnlyDemo: true,
      isSampleData: true,
      queueAndLedgerUntouched: true,
      preview: samplePreview,
    });
  }

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
    const shouldTrace = url.searchParams.get("traceReferral") === "true";
    const referralTrace = shouldTrace
      ? await traceCheckoutOnboardingReferral({
          application: lookup.application,
          placementId: url.searchParams.get("placementId") || undefined,
          isTest: true,
        })
      : undefined;

    return NextResponse.json({
      ok: true,
      persisted: true,
      storageBackend: lookup.application.storageBackend,
      application: lookup.application,
      ...(referralTrace ? { referralTrace } : {}),
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

