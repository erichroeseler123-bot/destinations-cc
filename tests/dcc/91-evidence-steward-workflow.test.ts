import test from "node:test";
import assert from "node:assert/strict";
import { compileApplicableDecisionContext } from "@/lib/dcc/applicability";
import {
  activateTemporaryStewardSafeguard,
  assignStewardToReviewCase,
  getInternalStewardWorkbenchState,
  getPublicMaterialChangeTimeline,
  recordStewardAuditDecision,
  resetEvidenceStewardWorkflowForTests,
  submitOperatorDisputeToQuarantine,
  updateSubmittedDocumentMalwareStatus,
} from "@/lib/dcc/stewardship";

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

  // Baseline before steward evidence mutation: GoSno 10-14 passenger private van is recommended
  const baselineOutcome = compileApplicableDecisionContext(tripRequest);
  assert.equal(
    baselineOutcome.recommendedVehicleClassId,
    "veh:private-transit-van-10-14",
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
    "veh:private-transit-van-10-14",
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
      (v) => v.vehicleClassId === "veh:private-transit-van-10-14",
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
