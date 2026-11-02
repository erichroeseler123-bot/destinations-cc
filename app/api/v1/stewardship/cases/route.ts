import { NextResponse } from "next/server";
import {
  activateTemporaryStewardSafeguard,
  assignStewardToReviewCase,
  getInternalStewardWorkbenchState,
  getPublicMaterialChangeTimeline,
  recordStewardAuditDecision,
  updateSubmittedDocumentMalwareStatus,
  type AuditOutcomeCode,
} from "@/lib/dcc/stewardship";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("mode")?.trim() || "public";
  const corridorId = url.searchParams.get("corridorId")?.trim() || undefined;

  if (mode === "internal") {
    const stewardToken = request.headers.get("x-dcc-steward-token")?.trim();
    if (!stewardToken) {
      return NextResponse.json(
        {
          ok: false,
          code: "STEWARD_AUTH_REQUIRED",
          error:
            "Private Steward workbench state requires x-dcc-steward-token authentication.",
        },
        { status: 401 },
      );
    }
    return NextResponse.json(
      {
        ok: true,
        mode: "internal",
        workbench: getInternalStewardWorkbenchState(),
      },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      mode: "public",
      publicMaterialChangeTimeline: getPublicMaterialChangeTimeline(corridorId),
    },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action ?? "resolve_case").trim();

    if (action === "scan_document") {
      const updated = updateSubmittedDocumentMalwareStatus({
        disputeId: String(body.disputeId ?? ""),
        documentId: String(body.documentId ?? ""),
        malwareScanStatus:
          (body.malwareScanStatus as "pending" | "clean" | "flagged") ??
          "clean",
      });
      return NextResponse.json(
        { ok: true, submission: updated },
        { status: 200, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (action === "assign_steward") {
      const updatedCase = assignStewardToReviewCase({
        caseId: String(body.caseId ?? ""),
        stewardId: String(body.stewardId ?? ""),
        stewardAffiliatedFirms: Array.isArray(body.stewardAffiliatedFirms)
          ? body.stewardAffiliatedFirms.map((f) => String(f))
          : undefined,
        nextStatus:
          (body.nextStatus as "under_review" | "escalated_legal") ??
          "under_review",
      });
      return NextResponse.json(
        { ok: true, reviewCase: updatedCase },
        { status: 200, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (action === "activate_safeguard") {
      const result = activateTemporaryStewardSafeguard({
        caseId: String(body.caseId ?? ""),
        stewardId: String(body.stewardId ?? ""),
        safeguardExpiry: String(
          body.safeguardExpiry ?? "2026-11-09T00:00:00.000Z",
        ),
        suspendOperatingAuthority: Boolean(body.suspendOperatingAuthority),
      });
      return NextResponse.json(
        {
          ok: true,
          reviewCase: result.reviewCase,
          reEvaluatedOutcome: result.reEvaluatedOutcome,
        },
        { status: 200, headers: { "Cache-Control": "no-store" } },
      );
    }

    // Default: resolve_case
    const resolved = recordStewardAuditDecision({
      ...body,
      caseId: String(body.caseId ?? ""),
      stewardId: String(body.stewardId ?? ""),
      stewardAffiliatedFirms: Array.isArray(body.stewardAffiliatedFirms)
        ? body.stewardAffiliatedFirms.map((f) => String(f))
        : undefined,
      outcomeCode: ((body.outcomeCode as AuditOutcomeCode) ??
        "evidence_confirmed") as AuditOutcomeCode,
      privateInternalRationale: String(body.privateInternalRationale ?? ""),
      evidenceMutation:
        body.evidenceMutation && typeof body.evidenceMutation === "object"
          ? (body.evidenceMutation as Record<string, unknown>)
          : null,
    });

    return NextResponse.json(
      {
        ok: true,
        reviewCase: resolved.reviewCase,
        publicTimelineEntry: resolved.publicTimelineEntry,
        resultingEvidenceSnapshotId:
          resolved.decision.resultingEvidenceSnapshotId,
        reEvaluationRequired: resolved.decision.reEvaluationRequired,
        reEvaluatedMarketOutcome: resolved.reEvaluatedMarketOutcome,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } },
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
        : "STEWARDSHIP_CASE_ERROR";

    return NextResponse.json(
      {
        ok: false,
        code: errorCode,
        error:
          error instanceof Error
            ? error.message
            : "Failed to process steward case operation.",
      },
      { status: statusCode },
    );
  }
}
