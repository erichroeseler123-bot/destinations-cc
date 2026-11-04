import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { compileApplicableDecisionContext } from "@/lib/dcc/applicability";
import {
  activateTemporaryStewardSafeguard,
  assignStewardToReviewCase,
  getInternalStewardWorkbenchState,
  getPublicMaterialChangeTimeline,
  issueStewardCredentialToken,
  recordStewardAuditDecision,
  resetEvidenceStewardWorkflowForTests,
  submitOperatorDisputeToQuarantine,
  updateSubmittedDocumentMalwareStatus,
} from "@/lib/dcc/stewardship";
import {
  GET as stewardshipCasesGet,
  POST as stewardshipCasesPost,
} from "@/app/api/v1/stewardship/cases/route";

test("1. Targeted Scopes (targetClaimId) & Quarantine by Default: rejects rank/route disputes and quarantines claim disputes", () => {
  resetEvidenceStewardWorkflowForTests();

  // Attempt to dispute "being ranked 3rd" instead of a specific claim
  assert.throws(
    () =>
      submitOperatorDisputeToQuarantine({
        targetClaimId: "rank:3",
        submitter: {
          identityId: "op:unhappy-shuttle",
          trustLevel: "verified_operator",
          declaredAffiliation: "unhappy-shuttle",
        },
        submittedEvidence: {
          description: "We should be ranked #1 on the Denver to Vail route.",
          sourceUrls: ["https://example.com"],
        },
      }),
    (err: unknown) =>
      Boolean(
        err &&
          typeof err === "object" &&
          "code" in err &&
          (err as { code: string }).code === "DISPUTE_MUST_TARGET_SPECIFIC_CLAIM",
      ),
  );

  // Attempt to pass requestedRank override in dispute submission
  assert.throws(
    () =>
      submitOperatorDisputeToQuarantine({
        targetClaimId: "claim:gosno:vail-private-van:cargo-capacity",
        requestedRank: 1,
        submitter: {
          identityId: "op:gosno",
          trustLevel: "verified_operator",
          declaredAffiliation: "gosno",
        },
        submittedEvidence: {
          description: "Update cargo capacity and make us rank 1.",
          sourceUrls: ["https://gosno.co/vail"],
        },
      }),
    (err: unknown) =>
      Boolean(
        err &&
          typeof err === "object" &&
          "code" in err &&
          (err as { code: string }).code === "MANUAL_RANK_OVERRIDE_FORBIDDEN",
      ),
  );

  // Valid claim-scoped submission is quarantined by default with operator_supplied provenance
  const { submission, reviewCase } = submitOperatorDisputeToQuarantine({
    targetClaimId: "claim:gosno:vail-private-van:operating-authority",
    submitter: {
      identityId: "op:competitor-audit",
      trustLevel: "verified_operator",
      declaredAffiliation: "competitor-shuttle",
    },
    submittedEvidence: {
      description: "Submitted winter PUC permit certificate for inspection.",
      sourceUrls: ["https://puc.colorado.gov/carriers"],
      uploadedDocuments: [
        {
          documentId: "doc_puc_cert_2026.pdf",
          malwareScanStatus: "pending",
        },
      ],
    },
    submittedAt: "2026-11-02T10:00:00.000Z",
  });

  assert.equal(reviewCase.status, "quarantined");
  assert.equal(reviewCase.affectedMarketId, "corridor:denver-vail");
  assert.equal(reviewCase.requiredRecusalFirms.includes("gosno"), true);
  assert.equal(
    submission.submittedEvidence.uploadedDocuments[0].provenance,
    "operator_supplied",
  );
  assert.equal(
    submission.submittedEvidence.uploadedDocuments[0].malwareScanStatus,
    "pending",
  );
});

test("2. Uploaded Document Malware Controls & Conflict-of-Interest Recusal Safeguards (requiredRecusalFirms)", () => {
  resetEvidenceStewardWorkflowForTests();

  const { submission, reviewCase } = submitOperatorDisputeToQuarantine({
    targetClaimId: "claim:gosno:vail-private-van:operating-authority",
    submitter: {
      identityId: "user:traveler-99",
      trustLevel: "authenticated_traveler",
      declaredAffiliation: null,
    },
    submittedEvidence: {
      description: "Uploaded carrier certificate PDF.",
      sourceUrls: ["https://puc.colorado.gov"],
      uploadedDocuments: [
        {
          documentId: "doc_carrier_upload.pdf",
          malwareScanStatus: "pending",
        },
      ],
    },
    submittedAt: "2026-11-02T11:00:00.000Z",
  });

  // 2a. Pending malware scan blocks moving case out of quarantine into under_review
  assert.throws(
    () =>
      assignStewardToReviewCase({
        caseId: reviewCase.caseId,
        stewardId: "steward:independent-compliance-01",
      }),
    (err: unknown) =>
      Boolean(
        err &&
          typeof err === "object" &&
          "code" in err &&
          (err as { code: string }).code ===
            "PENDING_MALWARE_SCAN_BLOCKS_RESOLUTION",
      ),
  );

  // 2b. Flagged malware document blocks case review
  updateSubmittedDocumentMalwareStatus({
    disputeId: submission.disputeId,
    documentId: "doc_carrier_upload.pdf",
    malwareScanStatus: "flagged",
  });

  assert.throws(
    () =>
      assignStewardToReviewCase({
        caseId: reviewCase.caseId,
        stewardId: "steward:independent-compliance-01",
      }),
    (err: unknown) =>
      Boolean(
        err &&
          typeof err === "object" &&
          "code" in err &&
          (err as { code: string }).code === "MALWARE_FLAGGED_DOCUMENT_BLOCKED",
      ),
  );

  // 2c. Mark document clean, then verify GoSno-affiliated steward is blocked by requiredRecusalFirms
  updateSubmittedDocumentMalwareStatus({
    disputeId: submission.disputeId,
    documentId: "doc_carrier_upload.pdf",
    malwareScanStatus: "clean",
  });

  assert.throws(
    () =>
      assignStewardToReviewCase({
        caseId: reviewCase.caseId,
        stewardId: "steward:gosno-ops-conflict",
      }),
    (err: unknown) =>
      Boolean(
        err &&
          typeof err === "object" &&
          "code" in err &&
          (err as { code: string; statusCode: number }).code ===
            "STEWARD_RECUSAL_CONFLICT_OF_INTEREST" &&
          (err as { code: string; statusCode: number }).statusCode === 403,
      ),
  );

  // 2d. Independent steward with zero overlap in requiredRecusalFirms is permitted
  const assigned = assignStewardToReviewCase({
    caseId: reviewCase.caseId,
    stewardId: "steward:independent-compliance-01",
  });
  assert.equal(assigned.status, "under_review");
  assert.equal(
    assigned.assignedStewardId,
    "steward:independent-compliance-01",
  );
});

test("3. Decoupled Rationale: privateInternalRationale is shielded while PublicMaterialChangeEntry renders neutral vocabulary", () => {
  resetEvidenceStewardWorkflowForTests();

  const { submission, reviewCase } = submitOperatorDisputeToQuarantine({
    targetClaimId: "claim:gosno:vail-private-van:operating-authority",
    submitter: {
      identityId: "op:external-submitter",
      trustLevel: "verified_operator",
      declaredAffiliation: "external",
    },
    submittedEvidence: {
      description: "Submitted insurance certificate PDF.",
      sourceUrls: ["https://puc.colorado.gov"],
      uploadedDocuments: [
        {
          documentId: "doc_ins_cert.pdf",
          malwareScanStatus: "clean",
        },
      ],
    },
    submittedAt: "2026-11-02T12:00:00.000Z",
  });

  assignStewardToReviewCase({
    caseId: reviewCase.caseId,
    stewardId: "steward:independent-compliance-01",
    nextStatus: "escalated_legal",
  });

  const sensitivePrivateRationale =
    "The operator's submitted insurance cert looks forged, escalating to state registry.";

  const { decision, publicTimelineEntry } = recordStewardAuditDecision({
    caseId: reviewCase.caseId,
    stewardId: "steward:independent-compliance-01",
    outcomeCode: "evidence_inconclusive",
    privateInternalRationale: sensitivePrivateRationale,
    decisionTimestamp: "2026-11-02T14:30:00.000Z",
  });

  // Internal decision record retains the private rationale
  assert.equal(decision.privateInternalRationale, sensitivePrivateRationale);
  assert.equal(decision.reEvaluationRequired, false);
  assert.equal(decision.resultingEvidenceSnapshotId, null);

  // Public timeline entry uses strictly neutral, template-bound wording and never leaks private rationale
  assert.equal(
    publicTimelineEntry.publicSummaryTemplateCode,
    "OPERATING_AUTHORITY_INCONCLUSIVE",
  );
  assert.equal(
    publicTimelineEntry.renderedPublicSummary,
    "Operating-authority evidence was reviewed and marked inconclusive.",
  );
  assert.equal(publicTimelineEntry.auditedByRole, "DCC Evidence Steward");
  assert.equal(publicTimelineEntry.auditTimestamp, "Verified on Nov 2, 2026");
  assert.equal(publicTimelineEntry.resolvedClaimId, submission.targetClaimId);

  const serializedPublic = JSON.stringify(getPublicMaterialChangeTimeline());
  assert.equal(
    serializedPublic.includes("forged"),
    false,
    "Public timeline must never leak privateInternalRationale",
  );
  assert.equal(
    serializedPublic.includes("privateInternalRationale"),
    false,
    "Public timeline must never include privateInternalRationale field",
  );

  // Internal workbench still holds the private record for authorized auditors
  const internalState = getInternalStewardWorkbenchState();
  assert.equal(
    internalState.decisions[0].privateInternalRationale,
    sensitivePrivateRationale,
  );
});

test("4. No Manual Overrides & Deterministic Market Re-Evaluation: steward updates evidence and compiler recalculates corridor winner", () => {
  resetEvidenceStewardWorkflowForTests();

  const tripRequest = {
    corridorId: "corridor:denver-vail-i70" as const,
    travelDate: "2026-12-15",
    passengerCount: 7,
    standardBagCount: 6,
    skiOrOversizeBagCount: 2,
    activeSegmentConditions: {
      i70TractionLawActive: true,
      vailPassChainLawActive: true,
    },
  };

  // Baseline before steward evidence mutation: GoSno up-to-10-passenger private van is recommended
  const baselineOutcome = compileApplicableDecisionContext(tripRequest);
  assert.equal(
    baselineOutcome.recommendedVehicleClassId,
    "veh:private-transit-van-10",
  );
  assert.equal(
    baselineOutcome.recommendedOperatorId,
    "op:gosno",
  );

  const { reviewCase } = submitOperatorDisputeToQuarantine({
    targetClaimId: "claim:gosno:vail-private-van:operating-authority",
    submitter: {
      identityId: "auditor:cdot-puc-feed",
      trustLevel: "internal_auditor",
      declaredAffiliation: "CDOT/PUC Registry Monitor",
    },
    submittedEvidence: {
      description:
        "Primary state registry shows temporary suspension of commercial van operating permit.",
      sourceUrls: ["https://puc.colorado.gov/carrier-status"],
    },
    submittedAt: "2026-11-02T15:00:00.000Z",
  });

  // Attempting to pass overrideWinner or newRank in recordStewardAuditDecision is forbidden
  assert.throws(
    () =>
      recordStewardAuditDecision({
        caseId: reviewCase.caseId,
        stewardId: "steward:independent-compliance-01",
        outcomeCode: "evidence_contradicted",
        privateInternalRationale: "Try to manually pick winner",
        overrideWinner: "epic-mountain-express",
      }),
    (err: unknown) =>
      Boolean(
        err &&
          typeof err === "object" &&
          "code" in err &&
          (err as { code: string }).code === "MANUAL_RANK_OVERRIDE_FORBIDDEN",
      ),
  );

  // Test emergency circuit breaker (temporarySafeguardActive) before final resolution
  const safeguardRes = activateTemporaryStewardSafeguard({
    caseId: reviewCase.caseId,
    stewardId: "steward:independent-compliance-01",
    safeguardExpiry: "2026-11-09T00:00:00.000Z",
    suspendOperatingAuthority: true,
    reEvaluationTripRequest: tripRequest,
  });
  assert.equal(safeguardRes.reviewCase.temporarySafeguardActive, true);
  assert.ok(safeguardRes.reEvaluatedOutcome);
  assert.notEqual(
    safeguardRes.reEvaluatedOutcome.recommendedVehicleClassId,
    "veh:private-transit-van-10",
  );

  // Final steward decision updates the evidence snapshot (operatingAuthorityValid: false) and triggers re-evaluation
  const resolved = recordStewardAuditDecision({
    caseId: reviewCase.caseId,
    stewardId: "steward:compliance-legal-02",
    outcomeCode: "evidence_contradicted",
    privateInternalRationale:
      "Verified PUC permit expiration on primary state portal; mutating operatingAuthorityValid to false.",
    evidenceMutation: {
      operatingAuthorityValid: false,
    },
    reEvaluationTripRequest: tripRequest,
    decisionTimestamp: "2026-11-02T16:00:00.000Z",
  });

  assert.equal(resolved.decision.reEvaluationRequired, true);
  assert.match(
    resolved.decision.resultingEvidenceSnapshotId ?? "",
    /^evsnap:sha256:[0-9a-f]{32}$/,
  );
  assert.equal(resolved.reviewCase.status, "resolved");
  assert.equal(resolved.reviewCase.temporarySafeguardActive, false);

  // Deterministic engine recalculated the market without manual rank overrides:
  assert.ok(resolved.reEvaluatedMarketOutcome);
  assert.equal(
    resolved.reEvaluatedMarketOutcome.evidenceVersion,
    resolved.decision.resultingEvidenceSnapshotId,
  );
  assert.notEqual(
    resolved.reEvaluatedMarketOutcome.decisionReceiptId,
    baselineOutcome.decisionReceiptId,
  );

  const disqualifiedVan =
    resolved.reEvaluatedMarketOutcome.vehicleClassEvaluations.find(
      (v) => v.vehicleClassId === "veh:private-transit-van-10",
    );
  assert.ok(disqualifiedVan);
  assert.equal(disqualifiedVan.disposition, "ineligible");
  assert.equal(
    disqualifiedVan.constraintCodes.includes(
      "DISQUALIFIED_STEWARD_OPERATING_AUTHORITY_SUSPENDED",
    ),
    true,
  );

  // Machine automatically promoted the next eligible vehicle class (Epic Mountain Express Shared Shuttle)
  assert.equal(
    resolved.reEvaluatedMarketOutcome.recommendedVehicleClassId,
    "veh:shared-mountain-shuttle",
  );
  assert.equal(
    resolved.reEvaluatedMarketOutcome.recommendedOperatorId,
    "op:epic-mountain-express",
  );

  // Public timeline entry reflects neutral vocabulary
  assert.equal(
    resolved.publicTimelineEntry.publicSummaryTemplateCode,
    "OPERATING_AUTHORITY_UPDATED",
  );
  assert.equal(
    resolved.publicTimelineEntry.renderedPublicSummary,
    "Operating-authority evidence was updated and the corridor model was re-evaluated.",
  );
  assert.equal(
    resolved.publicTimelineEntry.auditedByRole,
    "DCC Compliance Team",
  );

  // Clean up patches for subsequent tests
  resetEvidenceStewardWorkflowForTests();
});

test("5. Authenticated Steward Identities, Permissions, and Recusal Controls on API & Workflow (rejects invalid credentials & unregistered stewards)", async () => {
  resetEvidenceStewardWorkflowForTests();

  const { submission, reviewCase } = submitOperatorDisputeToQuarantine({
    targetClaimId: "claim:gosno:vail-private-van:operating-authority",
    submitter: {
      identityId: "op:carrier-review",
      trustLevel: "verified_operator",
      declaredAffiliation: "carrier-review",
    },
    submittedEvidence: {
      description: "Submitted updated commercial carrier filing.",
      sourceUrls: ["https://puc.colorado.gov"],
      uploadedDocuments: [
        {
          documentId: "doc_puc_2026_clean.pdf",
          malwareScanStatus: "pending",
        },
      ],
    },
    submittedAt: "2026-11-02T17:00:00.000Z",
  });

  // 5a. Unregistered steward identities are rejected in direct workflow functions (cannot bypass recusal controls)
  assert.throws(
    () =>
      assignStewardToReviewCase({
        caseId: reviewCase.caseId,
        stewardId: "steward:unregistered-bypass-attempt",
      }),
    (err: unknown) =>
      Boolean(
        err &&
          typeof err === "object" &&
          "code" in err &&
          (err as { code: string; statusCode: number }).code ===
            "UNREGISTERED_STEWARD_IDENTITY" &&
          (err as { code: string; statusCode: number }).statusCode === 403,
      ),
  );

  assert.throws(
    () => issueStewardCredentialToken("steward:unregistered-bypass-attempt"),
    (err: unknown) =>
      Boolean(
        err &&
          typeof err === "object" &&
          "code" in err &&
          (err as { code: string }).code === "UNREGISTERED_STEWARD_IDENTITY",
      ),
  );

  // 5b. Internal GET workbench rejects missing token AND rejects arbitrary nonempty token
  const noTokenGetRes = await stewardshipCasesGet(
    new Request(
      "https://destinationcommandcenter.com/api/v1/stewardship/cases?mode=internal",
    ),
  );
  assert.equal(noTokenGetRes.status, 401);
  const noTokenGetJson = (await noTokenGetRes.json()) as {
    ok: boolean;
    code: string;
  };
  assert.equal(noTokenGetJson.code, "STEWARD_AUTH_REQUIRED");

  const arbitraryTokenGetRes = await stewardshipCasesGet(
    new Request(
      "https://destinationcommandcenter.com/api/v1/stewardship/cases?mode=internal",
      {
        headers: {
          "x-dcc-steward-token": "any-nonempty-token-must-be-rejected",
        },
      },
    ),
  );
  assert.equal(arbitraryTokenGetRes.status, 401);
  const arbitraryTokenGetJson = (await arbitraryTokenGetRes.json()) as {
    ok: boolean;
    code: string;
  };
  assert.equal(arbitraryTokenGetJson.code, "STEWARD_INVALID_CREDENTIALS");

  // 5c. Case-changing POST requests reject unauthenticated or invalidly signed tokens
  const unauthPostRes = await stewardshipCasesPost(
    new Request(
      "https://destinationcommandcenter.com/api/v1/stewardship/cases",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "assign_steward",
          caseId: reviewCase.caseId,
          stewardId: "steward:independent-compliance-01",
        }),
      },
    ),
  );
  assert.equal(unauthPostRes.status, 401);
  const unauthPostJson = (await unauthPostRes.json()) as {
    ok: boolean;
    code: string;
  };
  assert.equal(unauthPostJson.code, "STEWARD_AUTH_REQUIRED");

  const arbitraryPostRes = await stewardshipCasesPost(
    new Request(
      "https://destinationcommandcenter.com/api/v1/stewardship/cases",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-dcc-steward-token": "forged-token-value",
        },
        body: JSON.stringify({
          action: "assign_steward",
          caseId: reviewCase.caseId,
          stewardId: "steward:independent-compliance-01",
        }),
      },
    ),
  );
  assert.equal(arbitraryPostRes.status, 401);
  const arbitraryPostJson = (await arbitraryPostRes.json()) as {
    ok: boolean;
    code: string;
  };
  assert.equal(arbitraryPostJson.code, "STEWARD_INVALID_CREDENTIALS");

  // 5d. Role-based permission checks: read-only auditor can read workbench, but cannot scan documents or assign/resolve cases
  const readonlyToken = issueStewardCredentialToken(
    "steward:auditor-readonly-01",
  );
  const readonlyGetRes = await stewardshipCasesGet(
    new Request(
      "https://destinationcommandcenter.com/api/v1/stewardship/cases?mode=internal",
      {
        headers: { "x-dcc-steward-token": readonlyToken },
      },
    ),
  );
  assert.equal(readonlyGetRes.status, 200);

  const readonlyAssignRes = await stewardshipCasesPost(
    new Request(
      "https://destinationcommandcenter.com/api/v1/stewardship/cases",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-dcc-steward-token": readonlyToken,
        },
        body: JSON.stringify({
          action: "assign_steward",
          caseId: reviewCase.caseId,
          stewardId: "steward:auditor-readonly-01",
        }),
      },
    ),
  );
  assert.equal(readonlyAssignRes.status, 403);
  const readonlyAssignJson = (await readonlyAssignRes.json()) as {
    ok: boolean;
    code: string;
  };
  assert.equal(readonlyAssignJson.code, "STEWARD_PERMISSION_DENIED");

  // 5e. Scanner bot can scan documents, but cannot resolve cases
  const scannerToken = issueStewardCredentialToken(
    "steward:document-scanner-bot",
  );
  const scanRes = await stewardshipCasesPost(
    new Request(
      "https://destinationcommandcenter.com/api/v1/stewardship/cases",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-dcc-steward-token": scannerToken,
        },
        body: JSON.stringify({
          action: "scan_document",
          disputeId: submission.disputeId,
          documentId: "doc_puc_2026_clean.pdf",
          malwareScanStatus: "clean",
        }),
      },
    ),
  );
  assert.equal(scanRes.status, 200);

  const scannerResolveRes = await stewardshipCasesPost(
    new Request(
      "https://destinationcommandcenter.com/api/v1/stewardship/cases",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-dcc-steward-token": scannerToken,
        },
        body: JSON.stringify({
          action: "resolve_case",
          caseId: reviewCase.caseId,
          stewardId: "steward:document-scanner-bot",
          outcomeCode: "evidence_confirmed",
          privateInternalRationale: "Bot trying to resolve case.",
        }),
      },
    ),
  );
  assert.equal(scannerResolveRes.status, 403);
  const scannerResolveJson = (await scannerResolveRes.json()) as {
    ok: boolean;
    code: string;
  };
  assert.equal(scannerResolveJson.code, "STEWARD_PERMISSION_DENIED");

  // 5f. Identity binding check: token for steward:independent-compliance-01 cannot impersonate steward:compliance-legal-02 in request body
  const independentToken = issueStewardCredentialToken(
    "steward:independent-compliance-01",
  );
  const mismatchRes = await stewardshipCasesPost(
    new Request(
      "https://destinationcommandcenter.com/api/v1/stewardship/cases",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-dcc-steward-token": independentToken,
        },
        body: JSON.stringify({
          action: "assign_steward",
          caseId: reviewCase.caseId,
          stewardId: "steward:compliance-legal-02",
        }),
      },
    ),
  );
  assert.equal(mismatchRes.status, 403);
  const mismatchJson = (await mismatchRes.json()) as {
    ok: boolean;
    code: string;
  };
  assert.equal(mismatchJson.code, "STEWARD_IDENTITY_MISMATCH");

  // 5g. Authenticated steward with recusal conflict (GoSno) is still blocked by requiredRecusalFirms
  const gosnoStewardToken = issueStewardCredentialToken(
    "steward:gosno-ops-conflict",
  );
  const conflictAssignRes = await stewardshipCasesPost(
    new Request(
      "https://destinationcommandcenter.com/api/v1/stewardship/cases",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-dcc-steward-token": gosnoStewardToken,
        },
        body: JSON.stringify({
          action: "assign_steward",
          caseId: reviewCase.caseId,
          stewardId: "steward:gosno-ops-conflict",
        }),
      },
    ),
  );
  assert.equal(conflictAssignRes.status, 403);
  const conflictAssignJson = (await conflictAssignRes.json()) as {
    ok: boolean;
    code: string;
  };
  assert.equal(
    conflictAssignJson.code,
    "STEWARD_RECUSAL_CONFLICT_OF_INTEREST",
  );

  // 5h. Authenticated independent steward assigns and resolves the case cleanly
  const validAssignRes = await stewardshipCasesPost(
    new Request(
      "https://destinationcommandcenter.com/api/v1/stewardship/cases",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-dcc-steward-token": independentToken,
        },
        body: JSON.stringify({
          action: "assign_steward",
          caseId: reviewCase.caseId,
          stewardId: "steward:independent-compliance-01",
        }),
      },
    ),
  );
  assert.equal(validAssignRes.status, 200);

  const validResolveRes = await stewardshipCasesPost(
    new Request(
      "https://destinationcommandcenter.com/api/v1/stewardship/cases",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-dcc-steward-token": independentToken,
        },
        body: JSON.stringify({
          action: "resolve_case",
          caseId: reviewCase.caseId,
          stewardId: "steward:independent-compliance-01",
          outcomeCode: "evidence_confirmed",
          privateInternalRationale:
            "Verified active PUC certificate directly with state portal.",
        }),
      },
    ),
  );
  assert.equal(validResolveRes.status, 200);
  const validResolveJson = (await validResolveRes.json()) as {
    ok: boolean;
    authenticatedStewardId: string;
    reviewCase: { status: string };
  };
  assert.equal(validResolveJson.ok, true);
  assert.equal(
    validResolveJson.authenticatedStewardId,
    "steward:independent-compliance-01",
  );
  assert.equal(validResolveJson.reviewCase.status, "resolved");

  resetEvidenceStewardWorkflowForTests();
});

test("6. Durable Transactional Storage Survives Separate OS Processes and Enforces Atomic Rollback", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dcc-durable-tx-"));
  const storePath = path.join(tempDir, "durable-ledger.json");
  const scriptAPath = path.join(tempDir, "proc-a.ts");
  const scriptBPath = path.join(tempDir, "proc-b.ts");

  try {
    const childEnv = {
      ...process.env,
      DCC_DURABLE_STORE_PATH: storePath,
      DCC_DISABLE_DURABLE_POSTGRES: "1",
    };

    // Spawn Process A (separate OS process) to write click attribution, booking reconciliation,
    // dispute, steward decision, evidence patch, and verify atomic rollback on error.
    const processAScript = `
      import assert from "node:assert/strict";
      import {
        issueOpaqueClickAttribution,
        reconcilePartnerWebhookByClickId,
      } from "@/lib/dcc/commerce/opaqueAttributionLedger";
      import {
        assignStewardToReviewCase,
        recordStewardAuditDecision,
        submitOperatorDisputeToQuarantine,
        updateSubmittedDocumentMalwareStatus,
      } from "@/lib/dcc/stewardship/evidenceStewardWorkflow";
      import { runDurableLedgerTransaction } from "@/lib/dcc/storage/durableTransactionalStore";

      const click = issueOpaqueClickAttribution({
        decisionReceiptId: "rcpt:sha256:9999999999999999999999999999999999999999999999999999999999999999",
        recommendedOperatorId: "gosno:vail-private-van",
        recommendedOperatorName: "GoSno Mountain Transfer",
        recommendedVehicleClassId: "veh:private-transit-van-10",
        evidenceVersion: "dcc-evidence-stewardship/2026.11",
        provider: "direct",
        productCode: "gosno-vail-van",
        productDestinationUrl: "https://gosno.co/vail?origin=DEN&destination=Vail",
      });

      const reconciled = reconcilePartnerWebhookByClickId({
        clickId: click.clickId,
        provider: "direct",
        providerBookingRef: "PROC-A-BOOKING-001",
        eventType: "BOOKING_CONFIRMED",
        grossRevenueUsd: 825,
        estimatedCommissionUsd: 123.75,
        paidCommissionUsd: 123.75,
      });
      assert.equal(reconciled.matched, true);

      const { submission, reviewCase } = submitOperatorDisputeToQuarantine({
        targetClaimId: "claim:gosno:vail-private-van:operating-authority",
        submitter: {
          identityId: "auditor:proc-a",
          trustLevel: "internal_auditor",
          declaredAffiliation: "State Registry Monitor",
        },
        submittedEvidence: {
          description: "Process A durable persistence verification.",
          sourceUrls: ["https://puc.colorado.gov"],
          uploadedDocuments: [
            { documentId: "doc_proc_a.pdf", malwareScanStatus: "pending" },
          ],
        },
        submittedAt: "2026-11-02T18:00:00.000Z",
      });

      updateSubmittedDocumentMalwareStatus({
        disputeId: submission.disputeId,
        documentId: "doc_proc_a.pdf",
        malwareScanStatus: "clean",
      });

      assignStewardToReviewCase({
        caseId: reviewCase.caseId,
        stewardId: "steward:independent-compliance-01",
      });

      const resolved = recordStewardAuditDecision({
        caseId: reviewCase.caseId,
        stewardId: "steward:independent-compliance-01",
        outcomeCode: "evidence_contradicted",
        privateInternalRationale: "Process A confirmed permit lapse; persisting durable mutation.",
        evidenceMutation: {
          operatingAuthorityValid: false,
        },
        decisionTimestamp: "2026-11-02T18:15:00.000Z",
      });

      // Verify that a failed transaction inside runDurableLedgerTransaction rolls back atomically
      assert.throws(() => {
        runDurableLedgerTransaction((state) => {
          state.opaqueClicksById["clk_rolledback00000000000000"] = {
            clickId: "clk_rolledback00000000000000",
            decisionReceiptId: "rcpt:sha256:bad",
            recommendedOperatorId: "bad",
            recommendedOperatorName: null,
            recommendedVehicleClassId: null,
            evidenceVersion: "bad",
            applicabilityModelVersion: null,
            applicabilityOutcomeHash: null,
            handoffId: null,
            provider: "direct",
            productCode: "bad",
            outboundPartnerUrl: "https://example.com",
            strippedLeakParams: [],
            reconciliationState: "unmatched",
            lastReconciledOutcomeId: null,
            lastReconciledAt: null,
            createdAt: new Date().toISOString(),
          };
          throw new Error("SIMULATED_TX_FAILURE");
        });
      }, /SIMULATED_TX_FAILURE/);

      process.stdout.write(JSON.stringify({
        clickId: click.clickId,
        disputeId: submission.disputeId,
        caseId: reviewCase.caseId,
        decisionId: resolved.decision.decisionId,
        snapshotId: resolved.decision.resultingEvidenceSnapshotId,
      }));
    `;

    fs.writeFileSync(scriptAPath, processAScript, "utf8");
    const procAOutRaw = execFileSync(
      process.execPath,
      ["--import", "tsx", scriptAPath],
      {
        cwd: process.cwd(),
        env: childEnv,
        encoding: "utf8",
      },
    );
    const procAData = JSON.parse(procAOutRaw.trim()) as {
      clickId: string;
      disputeId: string;
      caseId: string;
      decisionId: string;
      snapshotId: string;
    };

    assert.match(procAData.clickId, /^clk_[0-9a-f]{24}$/);

    // Now spawn Process B (a completely separate OS process) to read the durable ledger
    // and verify all records survived Process A exit and that the aborted transaction rolled back.
    const processBScript = `
      import assert from "node:assert/strict";
      import {
        getOpaqueClickAttributionById,
        listReconciledOutcomesForClickId,
      } from "@/lib/dcc/commerce/opaqueAttributionLedger";
      import {
        getInternalStewardWorkbenchState,
        getPublicMaterialChangeTimeline,
      } from "@/lib/dcc/stewardship/evidenceStewardWorkflow";
      import { compileApplicableDecisionContext } from "@/lib/dcc/applicability";

      const expected = ${JSON.stringify(procAData)};

      // 1. Verify rolled-back click ID does not exist
      assert.equal(getOpaqueClickAttributionById("clk_rolledback00000000000000"), null);

      // 2. Verify committed click attribution and reconciled booking survived across processes
      const clickRecord = getOpaqueClickAttributionById(expected.clickId);
      assert.ok(clickRecord, "Click attribution record must survive across separate processes");
      assert.equal(
        clickRecord.decisionReceiptId,
        "rcpt:sha256:9999999999999999999999999999999999999999999999999999999999999999"
      );

      const outcomes = listReconciledOutcomesForClickId(expected.clickId);
      assert.equal(outcomes.length, 1);
      assert.equal(outcomes[0].providerBookingRef, "PROC-A-BOOKING-001");
      assert.equal(outcomes[0].paidCommissionUsd, 123.75);

      // 3. Verify dispute, resolved case, decision, and public timeline survived across processes
      const workbench = getInternalStewardWorkbenchState();
      assert.equal(workbench.disputes.length, 1);
      assert.equal(workbench.disputes[0].disputeId, expected.disputeId);
      assert.equal(workbench.cases.length, 1);
      assert.equal(workbench.cases[0].caseId, expected.caseId);
      assert.equal(workbench.cases[0].status, "resolved");
      assert.equal(workbench.decisions.length, 1);
      assert.equal(workbench.decisions[0].decisionId, expected.decisionId);
      assert.equal(
        workbench.decisions[0].privateInternalRationale,
        "Process A confirmed permit lapse; persisting durable mutation."
      );

      const publicTimeline = getPublicMaterialChangeTimeline("corridor:denver-vail");
      assert.ok(
        publicTimeline.some((e) => e.resolvedClaimId === "claim:gosno:vail-private-van:operating-authority"),
        "Public timeline entry must survive across separate processes"
      );

      // 4. Verify steward evidence mutation survived across processes and deterministically alters compilation
      const reEvaluated = compileApplicableDecisionContext({
        corridorId: "corridor:denver-vail-i70",
        travelDate: "2026-12-15",
        passengerCount: 7,
        standardBagCount: 6,
        skiOrOversizeBagCount: 2,
        activeSegmentConditions: {
          i70TractionLawActive: true,
          vailPassChainLawActive: true,
        },
      });
      assert.equal(reEvaluated.recommendedVehicleClassId, "veh:shared-mountain-shuttle");
      assert.equal(reEvaluated.recommendedOperatorId, "op:epic-mountain-express");

      process.stdout.write(JSON.stringify({ verifiedInProcessB: true }));
    `;

    fs.writeFileSync(scriptBPath, processBScript, "utf8");
    const procBOutRaw = execFileSync(
      process.execPath,
      ["--import", "tsx", scriptBPath],
      {
        cwd: process.cwd(),
        env: childEnv,
        encoding: "utf8",
      },
    );
    const procBData = JSON.parse(procBOutRaw.trim()) as {
      verifiedInProcessB: boolean;
    };
    assert.equal(procBData.verifiedInProcessB, true);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
