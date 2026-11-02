import { NextResponse } from "next/server";
import {
  getPublicMaterialChangeTimeline,
  REGISTERED_CLAIM_FACTS,
  submitOperatorDisputeToQuarantine,
  type SubmitterTrustLevel,
} from "@/lib/dcc/stewardship";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const corridorId = url.searchParams.get("corridorId")?.trim() || undefined;

  return NextResponse.json(
    {
      ok: true,
      registeredClaims: Object.values(REGISTERED_CLAIM_FACTS),
      publicMaterialChangeTimeline: getPublicMaterialChangeTimeline(corridorId),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const submitterRaw =
      body.submitter && typeof body.submitter === "object"
        ? (body.submitter as Record<string, unknown>)
        : {};
    const evidenceRaw =
      body.submittedEvidence && typeof body.submittedEvidence === "object"
        ? (body.submittedEvidence as Record<string, unknown>)
        : {};

    const uploadedDocsRaw = Array.isArray(evidenceRaw.uploadedDocuments)
      ? (evidenceRaw.uploadedDocuments as Array<Record<string, unknown>>)
      : [];

    const result = submitOperatorDisputeToQuarantine({
      ...body,
      targetClaimId: String(body.targetClaimId ?? ""),
      submitter: {
        identityId: String(submitterRaw.identityId ?? "anon:traveler"),
        trustLevel: ((submitterRaw.trustLevel as SubmitterTrustLevel) ??
          "anonymous_user") as SubmitterTrustLevel,
        declaredAffiliation:
          typeof submitterRaw.declaredAffiliation === "string"
            ? submitterRaw.declaredAffiliation
            : null,
      },
      submittedEvidence: {
        description: String(evidenceRaw.description ?? ""),
        sourceUrls: Array.isArray(evidenceRaw.sourceUrls)
          ? evidenceRaw.sourceUrls.map((u) => String(u))
          : [],
        uploadedDocuments: uploadedDocsRaw.map((doc) => ({
          documentId: String(doc.documentId ?? ""),
          malwareScanStatus:
            (doc.malwareScanStatus as "pending" | "clean" | "flagged") ??
            "pending",
        })),
      },
    });

    return NextResponse.json(
      {
        ok: true,
        quarantined: true,
        submission: result.submission,
        reviewCase: result.reviewCase,
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store",
          "X-DCC-Dispute-Id": result.submission.disputeId,
          "X-DCC-Case-Id": result.reviewCase.caseId,
        },
      },
    );
  } catch (error) {
    const statusCode =
      error &&
      typeof error === "object" &&
      "statusCode" in error &&
      typeof (error as { statusCode?: unknown }).statusCode === "number"
        ? (error as { statusCode: number }).statusCode
        : 400;
    const errorCode =
      error &&
      typeof error === "object" &&
      "code" in error &&
      typeof (error as { code?: unknown }).code === "string"
        ? (error as { code: string }).code
        : "STEWARDSHIP_SUBMISSION_ERROR";

    return NextResponse.json(
      {
        ok: false,
        code: errorCode,
        error:
          error instanceof Error
            ? error.message
            : "Failed to process dispute submission.",
      },
      { status: statusCode },
    );
  }
}
