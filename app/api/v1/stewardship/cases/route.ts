import { NextResponse } from "next/server";
import {
  activateTemporaryStewardSafeguard,
  assignStewardToReviewCase,
  authenticateStewardRequest,
  getInternalStewardWorkbenchState,
  getPublicMaterialChangeTimeline,
  recordStewardAuditDecision,
  updateSubmittedDocumentMalwareStatus,
  type AuditOutcomeCode,
} from "@/lib/dcc/stewardship";
import { syncDurableLedgerWithPostgres } from "@/lib/dcc/storage/durableTransactionalStore";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("mode")?.trim() || "public";
  const corridorId = url.searchParams.get("corridorId")?.trim() || undefined;
  const hasAuthHeader = Boolean(
    request.headers.get("x-dcc-steward-token")?.trim() ||
      request.headers.get("authorization")?.trim(),
  );

  if (mode === "internal" || hasAuthHeader) {
    try {
      const steward = authenticateStewardRequest(request, "workbench:read");
      await syncDurableLedgerWithPostgres();
      return NextResponse.json(
        {
          ok: true,
          mode: "internal",
          authenticatedStewardId: steward.stewardId,
          workbench: getInternalStewardWorkbenchState(),
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
          : 401;
      const errorCode =
        error &&
        typeof error === "object" &&
        "code" in error &&
        typeof (error as { code?: unknown }).code === "string"
          ? (error as { code: string }).code
          : "STEWARD_AUTH_REQUIRED";
      return NextResponse.json(
        {
          ok: false,
          code: errorCode,
          error:
            error instanceof Error
              ? error.message
              : "Private Steward workbench state requires valid steward authentication.",
        },
        { status: statusCode, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  await syncDurableLedgerWithPostgres();
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
      const steward = authenticateStewardRequest(
        request,
        "document:scan",
        typeof body.stewardId === "string" ? body.stewardId : null,
      );
      await syncDurableLedgerWithPostgres();
      const updated = updateSubmittedDocumentMalwareStatus({
        disputeId: String(body.disputeId ?? ""),
        documentId: String(body.documentId ?? ""),
        malwareScanStatus:
          (body.malwareScanStatus as "pending" | "clean" | "flagged") ??
          "clean",
        actorStewardId: steward.stewardId,
      });
      await syncDurableLedgerWithPostgres({ forcePushLocal: true });
      return NextResponse.json(
        {
          ok: true,
          authenticatedStewardId: steward.stewardId,
          submission: updated,
        },
        { status: 200, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (action === "assign_steward") {
      const claimedStewardId = String(body.stewardId ?? "").trim();
      const steward = authenticateStewardRequest(
        request,
        "case:assign",
        claimedStewardId || null,
      );
      await syncDurableLedgerWithPostgres();
      const updatedCase = assignStewardToReviewCase({
        caseId: String(body.caseId ?? ""),
        stewardId: claimedStewardId || steward.stewardId,
        stewardAffiliatedFirms: Array.isArray(body.stewardAffiliatedFirms)
          ? body.stewardAffiliatedFirms.map((f) => String(f))
          : undefined,
        nextStatus:
          (body.nextStatus as "under_review" | "escalated_legal") ??
          "under_review",
      });
      await syncDurableLedgerWithPostgres({ forcePushLocal: true });
      return NextResponse.json(
        {
          ok: true,
          authenticatedStewardId: steward.stewardId,
          reviewCase: updatedCase,
        },
        { status: 200, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (action === "activate_safeguard") {
      const claimedStewardId = String(body.stewardId ?? "").trim();
      const steward = authenticateStewardRequest(
        request,
        "case:safeguard",
        claimedStewardId || null,
      );
      await syncDurableLedgerWithPostgres();
      const result = activateTemporaryStewardSafeguard({
        caseId: String(body.caseId ?? ""),
        stewardId: claimedStewardId || steward.stewardId,
        safeguardExpiry: String(
          body.safeguardExpiry ?? "2026-11-09T00:00:00.000Z",
        ),
        suspendOperatingAuthority: Boolean(body.suspendOperatingAuthority),
      });
      await syncDurableLedgerWithPostgres({ forcePushLocal: true });
      return NextResponse.json(
        {
          ok: true,
          authenticatedStewardId: steward.stewardId,
          reviewCase: result.reviewCase,
          reEvaluatedOutcome: result.reEvaluatedOutcome,
        },
        { status: 200, headers: { "Cache-Control": "no-store" } },
      );
    }

    // Default: resolve_case
    const claimedStewardId = String(body.stewardId ?? "").trim();
    const steward = authenticateStewardRequest(
      request,
      "case:resolve",
      claimedStewardId || null,
    );
    await syncDurableLedgerWithPostgres();

    const resolved = recordStewardAuditDecision({
      ...body,
      caseId: String(body.caseId ?? ""),
      stewardId: claimedStewardId || steward.stewardId,
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

    await syncDurableLedgerWithPostgres({ forcePushLocal: true });

    return NextResponse.json(
      {
        ok: true,
        authenticatedStewardId: steward.stewardId,
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
      { status: statusCode, headers: { "Cache-Control": "no-store" } },
    );
  }
}
