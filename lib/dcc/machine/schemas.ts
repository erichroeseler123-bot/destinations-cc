import { z } from "zod";

/**
 * DCC Machine Layer v0.1 — Core Epistemic & Data Model Schemas + DCC Decision IR
 */

export const EpistemicStatusSchema = z.enum([
  "observed",
  "verified",
  "inferred",
  "disputed",
  "stale",
  "superseded",
  "withdrawn",
  "unknown",
]);
export type EpistemicStatus = z.infer<typeof EpistemicStatusSchema>;

export const EpistemicKindSchema = z.enum([
  "fact",
  "inference",
  "policy",
  "recommendation",
  "user_preference",
]);
export type EpistemicKind = z.infer<typeof EpistemicKindSchema>;

export const GeographicScopeSchema = z
  .object({
    country: z.string(),
    stateOrProvince: z.string().optional(),
    region: z.string().optional(),
    localityOrIsland: z.string().optional(),
    corridorOrHarbor: z.string().optional(),
    coordinates: z
      .object({
        lat: z.number(),
        lng: z.number(),
      })
      .optional(),
  })
  .strict();
export type GeographicScope = z.infer<typeof GeographicScopeSchema>;

export const TypedClaimValueSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("number"), value: z.number() }).strict(),
  z.object({ type: z.literal("string"), value: z.string() }).strict(),
  z.object({ type: z.literal("boolean"), value: z.boolean() }).strict(),
  z.object({ type: z.literal("string_array"), value: z.array(z.string()) }).strict(),
  z.object({ type: z.literal("number_array"), value: z.array(z.number()) }).strict(),
  z
    .object({
      type: z.literal("number_range"),
      value: z.object({ min: z.number(), max: z.number() }).strict(),
    })
    .strict(),
  z
    .object({
      type: z.literal("object"),
      value: z.record(z.string(), z.unknown()),
    })
    .strict(),
]);
export type TypedClaimValue = z.infer<typeof TypedClaimValueSchema>;

export const MachineEntitySchema = z
  .object({
    objectType: z.literal("Entity"),
    id: z.string().min(1),
    version: z.string().min(1),
    entityType: z.enum([
      "place",
      "port",
      "harbor",
      "operator",
      "tour_option",
      "agency",
      "vessel",
      "corridor",
      "jurisdiction",
    ]),
    canonicalName: z.string().min(1),
    jurisdiction: z.string().nullable(),
    geographicScope: GeographicScopeSchema,
    status: EpistemicStatusSchema,
    valid_from: z.string(),
    valid_to: z.string().nullable(),
    observed_at: z.string(),
    retrieved_at: z.string(),
    attributes: z.record(z.string(), z.unknown()),
    connectedIds: z.array(z.string()),
    contentHash: z.string().min(16),
    stableReferenceUri: z.string(),
    immutableReferenceUri: z.string(),
  })
  .strict();
export type MachineEntity = z.infer<typeof MachineEntitySchema>;

export const ProvenanceOriginSchema = z.enum([
  "curated_seed_fixture",
  "live_authoritative_capture",
]);
export type ProvenanceOrigin = z.infer<typeof ProvenanceOriginSchema>;

export const MachineSourceSchema = z
  .object({
    objectType: z.literal("Source"),
    id: z.string().min(1),
    version: z.string().min(1),
    title: z.string().min(1),
    organization: z.string().min(1),
    authorityTier: z.enum([
      "official_government_agency",
      "municipal_port_or_harbor",
      "official_weather_or_marine_service",
      "verified_direct_operator",
      "approved_reseller",
      "dcc_derived_synthesis",
    ]),
    canonicalUrl: z.string().url(),
    jurisdiction: z.string().nullable(),
    retrievalMethod: z.string().min(1),
    licenseOrReuseStatus: z.string().min(1),
    provenanceOrigin: ProvenanceOriginSchema.optional(),
    status: EpistemicStatusSchema,
    latestSnapshotId: z.string().min(1),
    valid_from: z.string(),
    valid_to: z.string().nullable(),
    observed_at: z.string(),
    retrieved_at: z.string(),
    contentHash: z.string().min(16),
    stableReferenceUri: z.string(),
    immutableReferenceUri: z.string(),
  })
  .strict();
export type MachineSource = z.infer<typeof MachineSourceSchema>;

export const MachineSourceSnapshotSchema = z
  .object({
    objectType: z.literal("SourceSnapshot"),
    id: z.string().min(1),
    sourceId: z.string().min(1),
    version: z.string().min(1),
    canonicalUrl: z.string().url(),
    retrieved_at: z.string(),
    observed_at: z.string(),
    valid_from: z.string(),
    valid_to: z.string().nullable(),
    httpStatus: z.number().int(),
    contentType: z.string().min(1),
    retrievalMethod: z.string().min(1),
    licenseOrReuseStatus: z.string().min(1),
    provenanceOrigin: ProvenanceOriginSchema.optional(),
    artifactStorageUri: z.string().min(1),
    contentHash: z.string().min(16),
    byteLength: z.number().int().nonnegative(),
    status: EpistemicStatusSchema,
    stableReferenceUri: z.string(),
    immutableReferenceUri: z.string(),
  })
  .strict();
export type MachineSourceSnapshot = z.infer<typeof MachineSourceSnapshotSchema>;

export const MachineEvidenceFragmentSchema = z
  .object({
    objectType: z.literal("EvidenceFragment"),
    id: z.string().min(1),
    sourceId: z.string().min(1),
    snapshotId: z.string().min(1),
    version: z.string().min(1),
    locator: z.string().min(1),
    excerptOrStructuredField: z
      .object({
        verbatimExcerpt: z.string().min(1),
        structuredFieldPath: z.string().min(1),
        structuredValue: z.unknown(),
      })
      .strict(),
    contentHash: z.string().min(16),
    observed_at: z.string(),
    retrieved_at: z.string(),
    valid_from: z.string(),
    valid_to: z.string().nullable(),
    provenanceOrigin: ProvenanceOriginSchema.optional(),
    status: EpistemicStatusSchema,
    stableReferenceUri: z.string(),
    immutableReferenceUri: z.string(),
  })
  .strict();
export type MachineEvidenceFragment = z.infer<typeof MachineEvidenceFragmentSchema>;

export const MachineClaimVersionSchema = z
  .object({
    objectType: z.literal("ClaimVersion"),
    claimId: z.string().min(1),
    versionId: z.string().min(1),
    versionNumber: z.number().int().positive(),
    epistemicKind: EpistemicKindSchema,
    subject: z.string().min(1),
    predicate: z.string().min(1),
    typedValue: TypedClaimValueSchema,
    unitOrCurrency: z.string().nullable(),
    geographicScope: GeographicScopeSchema,
    jurisdiction: z.string().nullable(),
    valid_from: z.string(),
    valid_to: z.string().nullable(),
    known_from: z.string().optional(),
    known_to: z.string().nullable().optional(),
    observed_at: z.string(),
    retrieved_at: z.string(),
    provenanceOrigin: ProvenanceOriginSchema.optional(),
    status: EpistemicStatusSchema,
    sourceId: z.string().min(1),
    sourceOrganization: z.string().min(1),
    canonicalSourceUrl: z.string().url(),
    sourceSnapshotId: z.string().min(1),
    evidenceFragmentId: z.string().min(1),
    supportingFragment: z
      .object({
        locator: z.string().min(1),
        verbatimExcerpt: z.string().min(1),
        structuredFieldPath: z.string().min(1),
        structuredValue: z.unknown(),
      })
      .strict(),
    evidenceHash: z.string().min(16),
    retrievalMethod: z.string().min(1),
    licenseOrReuseStatus: z.string().min(1),
    supersededByVersionId: z.string().nullable(),
    supersedesVersionId: z.string().nullable(),
    retractionId: z.string().nullable(),
    withdrawalInfo: z
      .object({
        withdrawnAt: z.string(),
        reason: z.string(),
        issuedBy: z.string(),
        retractionId: z.string(),
      })
      .nullable(),
    conflictingClaimVersionIds: z.array(z.string()),
    verificationApprovedBy: z.string().nullable(),
    stableReferenceUri: z.string(),
    immutableReferenceUri: z.string(),
  })
  .strict();
export type MachineClaimVersion = z.infer<typeof MachineClaimVersionSchema>;

export const MachineClaimSchema = z
  .object({
    objectType: z.literal("Claim"),
    id: z.string().min(1),
    currentVersionId: z.string().min(1),
    subjectId: z.string().min(1),
    predicate: z.string().min(1),
    epistemicKind: EpistemicKindSchema,
    status: EpistemicStatusSchema,
    hasOpenConflict: z.boolean(),
    versionHistoryIds: z.array(z.string()).min(1),
    currentVersion: MachineClaimVersionSchema,
    stableReferenceUri: z.string(),
    immutableReferenceUri: z.string(),
  })
  .strict();
export type MachineClaim = z.infer<typeof MachineClaimSchema>;

export const MachineClaimConflictSchema = z
  .object({
    objectType: z.literal("ClaimConflict"),
    id: z.string().min(1),
    version: z.string().min(1),
    claimId: z.string().min(1),
    claimVersionIds: z.array(z.string()).min(2),
    subjectId: z.string().min(1),
    predicate: z.string().min(1),
    conflictType: z.enum([
      "contradictory_value",
      "jurisdiction_mismatch",
      "stale_vs_current",
      "operator_vs_regulator",
    ]),
    status: EpistemicStatusSchema,
    summary: z.string().min(1),
    resolutionPolicy: z.enum([
      "block_positive_recommendation",
      "qualify_with_warning",
      "resolved_to_authoritative_source",
    ]),
    winningClaimVersionId: z.string().nullable(),
    detected_at: z.string(),
    resolved_at: z.string().nullable(),
    contentHash: z.string().min(16),
    stableReferenceUri: z.string(),
    immutableReferenceUri: z.string(),
  })
  .strict();
export type MachineClaimConflict = z.infer<typeof MachineClaimConflictSchema>;

export const MachineRetractionSchema = z
  .object({
    objectType: z.literal("RetractionOrWithdrawal"),
    id: z.string().min(1),
    version: z.string().min(1),
    targetType: z.enum([
      "claim",
      "claim_version",
      "source",
      "source_snapshot",
      "rule",
      "engine_version",
    ]),
    targetId: z.string().min(1),
    targetVersionId: z.string().min(1),
    action: z.enum(["withdrawn", "superseded", "disputed"]),
    reason: z.string().min(1),
    replacementVersionId: z.string().nullable(),
    issuedBy: z.string().min(1),
    occurred_at: z.string(),
    contentHash: z.string().min(16),
    stableReferenceUri: z.string(),
    immutableReferenceUri: z.string(),
  })
  .strict();
export type MachineRetraction = z.infer<typeof MachineRetractionSchema>;

// ============================================================================
// DCC Decision IR (Language-Neutral Canonical JSON Representation)
// ============================================================================

export type DecisionIrOperand =
  | { ref: "input"; field: string }
  | { ref: "derived"; field: string }
  | { ref: "candidate"; field: string }
  | { ref: "claim"; claimVersionId: string; path?: string }
  | { ref: "literal"; value: string | number | boolean | string[] | number[] | null };

export type DecisionIrExpression =
  | { op: "all"; args: DecisionIrExpression[] }
  | { op: "any"; args: DecisionIrExpression[] }
  | { op: "not"; arg: DecisionIrExpression }
  | { op: "is_known"; target: DecisionIrOperand }
  | { op: "is_unknown"; target: DecisionIrOperand }
  | { op: "eq"; left: DecisionIrOperand; right: DecisionIrOperand }
  | { op: "neq"; left: DecisionIrOperand; right: DecisionIrOperand }
  | { op: "in"; item: DecisionIrOperand; set: DecisionIrOperand }
  | { op: "not_in"; item: DecisionIrOperand; set: DecisionIrOperand }
  | { op: "contains"; collection: DecisionIrOperand; item: DecisionIrOperand }
  | { op: "intersects"; left: DecisionIrOperand; right: DecisionIrOperand }
  | { op: "gt"; left: DecisionIrOperand; right: DecisionIrOperand }
  | { op: "gte"; left: DecisionIrOperand; right: DecisionIrOperand }
  | { op: "lt"; left: DecisionIrOperand; right: DecisionIrOperand }
  | { op: "lte"; left: DecisionIrOperand; right: DecisionIrOperand }
  | {
      op: "between";
      value: DecisionIrOperand;
      min: DecisionIrOperand;
      max: DecisionIrOperand;
      inclusive?: boolean;
    }
  | {
      op: "time_window_fits";
      availableMinutes: DecisionIrOperand;
      requiredMinutes: DecisionIrOperand;
      timezone: string;
    }
  | {
      op: "month_in";
      month: DecisionIrOperand;
      allowedMonths: DecisionIrOperand;
    }
  | {
      op: "date_within_range";
      dateIso: DecisionIrOperand;
      startIso: DecisionIrOperand;
      endIso: DecisionIrOperand;
    }
  | {
      op: "geo_scope_matches";
      requestedGeo: DecisionIrOperand;
      candidateGeo: DecisionIrOperand;
      jurisdiction?: string;
    }
  | {
      op: "capacity_fits";
      requestedGroupSize: DecisionIrOperand;
      maxCapacity: DecisionIrOperand;
    };

export const DecisionIrOperandSchema: z.ZodType<DecisionIrOperand> = z.discriminatedUnion("ref", [
  z.object({ ref: z.literal("input"), field: z.string().min(1) }).strict(),
  z.object({ ref: z.literal("derived"), field: z.string().min(1) }).strict(),
  z.object({ ref: z.literal("candidate"), field: z.string().min(1) }).strict(),
  z
    .object({
      ref: z.literal("claim"),
      claimVersionId: z.string().min(1),
      path: z.string().optional(),
    })
    .strict(),
  z
    .object({
      ref: z.literal("literal"),
      value: z.union([
        z.string(),
        z.number(),
        z.boolean(),
        z.array(z.string()),
        z.array(z.number()),
        z.null(),
      ]),
    })
    .strict(),
]);

export const DecisionIrExpressionSchema: z.ZodType<DecisionIrExpression> = z.lazy(() =>
  z.discriminatedUnion("op", [
    z.object({ op: z.literal("all"), args: z.array(DecisionIrExpressionSchema).min(1) }).strict(),
    z.object({ op: z.literal("any"), args: z.array(DecisionIrExpressionSchema).min(1) }).strict(),
    z.object({ op: z.literal("not"), arg: DecisionIrExpressionSchema }).strict(),
    z.object({ op: z.literal("is_known"), target: DecisionIrOperandSchema }).strict(),
    z.object({ op: z.literal("is_unknown"), target: DecisionIrOperandSchema }).strict(),
    z
      .object({
        op: z.literal("eq"),
        left: DecisionIrOperandSchema,
        right: DecisionIrOperandSchema,
      })
      .strict(),
    z
      .object({
        op: z.literal("neq"),
        left: DecisionIrOperandSchema,
        right: DecisionIrOperandSchema,
      })
      .strict(),
    z
      .object({
        op: z.literal("in"),
        item: DecisionIrOperandSchema,
        set: DecisionIrOperandSchema,
      })
      .strict(),
    z
      .object({
        op: z.literal("not_in"),
        item: DecisionIrOperandSchema,
        set: DecisionIrOperandSchema,
      })
      .strict(),
    z
      .object({
        op: z.literal("contains"),
        collection: DecisionIrOperandSchema,
        item: DecisionIrOperandSchema,
      })
      .strict(),
    z
      .object({
        op: z.literal("intersects"),
        left: DecisionIrOperandSchema,
        right: DecisionIrOperandSchema,
      })
      .strict(),
    z
      .object({
        op: z.literal("gt"),
        left: DecisionIrOperandSchema,
        right: DecisionIrOperandSchema,
      })
      .strict(),
    z
      .object({
        op: z.literal("gte"),
        left: DecisionIrOperandSchema,
        right: DecisionIrOperandSchema,
      })
      .strict(),
    z
      .object({
        op: z.literal("lt"),
        left: DecisionIrOperandSchema,
        right: DecisionIrOperandSchema,
      })
      .strict(),
    z
      .object({
        op: z.literal("lte"),
        left: DecisionIrOperandSchema,
        right: DecisionIrOperandSchema,
      })
      .strict(),
    z
      .object({
        op: z.literal("between"),
        value: DecisionIrOperandSchema,
        min: DecisionIrOperandSchema,
        max: DecisionIrOperandSchema,
        inclusive: z.boolean().optional(),
      })
      .strict(),
    z
      .object({
        op: z.literal("time_window_fits"),
        availableMinutes: DecisionIrOperandSchema,
        requiredMinutes: DecisionIrOperandSchema,
        timezone: z.string().min(1),
      })
      .strict(),
    z
      .object({
        op: z.literal("month_in"),
        month: DecisionIrOperandSchema,
        allowedMonths: DecisionIrOperandSchema,
      })
      .strict(),
    z
      .object({
        op: z.literal("date_within_range"),
        dateIso: DecisionIrOperandSchema,
        startIso: DecisionIrOperandSchema,
        endIso: DecisionIrOperandSchema,
      })
      .strict(),
    z
      .object({
        op: z.literal("geo_scope_matches"),
        requestedGeo: DecisionIrOperandSchema,
        candidateGeo: DecisionIrOperandSchema,
        jurisdiction: z.string().optional(),
      })
      .strict(),
    z
      .object({
        op: z.literal("capacity_fits"),
        requestedGroupSize: DecisionIrOperandSchema,
        maxCapacity: DecisionIrOperandSchema,
      })
      .strict(),
  ]),
);

export const DecisionIrInputFieldSchema = z
  .object({
    field: z.string().min(1),
    type: z.enum(["string", "number", "boolean", "enum", "date", "time_hhmm"]),
    required: z.boolean(),
    allowUnknown: z.boolean().default(true),
    enumValues: z.array(z.string()).optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    unit: z.string().optional(),
    defaultWhenOmitted: z.union([z.string(), z.number(), z.boolean(), z.literal("unknown")]).optional(),
    description: z.string().min(1),
  })
  .strict();
export type DecisionIrInputField = z.infer<typeof DecisionIrInputFieldSchema>;

export const DecisionIrDerivedInputSchema = z
  .object({
    field: z.string().min(1),
    type: z.enum(["number", "string", "boolean"]),
    formula: z.enum([
      "month_from_date_or_month_field",
      "hhmm_window_minutes",
      "candidate_total_door_to_door_minutes",
      "candidate_port_timing_slack_minutes",
      "date_exceeds_schedule_horizon",
    ]),
    params: z.record(z.string(), z.unknown()),
    description: z.string().min(1),
  })
  .strict();
export type DecisionIrDerivedInput = z.infer<typeof DecisionIrDerivedInputSchema>;

export const DecisionIrCandidateSchema = z
  .object({
    candidateId: z.string().min(1),
    entityId: z.string().min(1),
    title: z.string().min(1),
    candidateClass: z.enum(["commercial_tour", "noncommercial_or_contingency"]),
    operatorEntityId: z.string().min(1),
    operatorName: z.string().min(1),
    jurisdiction: z.string().min(1),
    geographicScope: GeographicScopeSchema,
    attributes: z.record(z.string(), z.unknown()),
    claimVersionIds: z.array(z.string()).min(1),
    bookingHandoffs: z.array(
      z
        .object({
          handoffId: z.string().min(1),
          sellerType: z.enum([
            "direct_operator",
            "dcc_owned_specialist",
            "affiliate_marketplace",
            "public_or_diy",
          ]),
          sellerName: z.string().min(1),
          url: z.string().url(),
          commercialWeightOnRanking: z.literal(0),
        })
        .strict(),
    ),
  })
  .strict();
export type DecisionIrCandidate = z.infer<typeof DecisionIrCandidateSchema>;

export const DecisionIrRuleSchema = z
  .object({
    objectType: z.literal("Rule"),
    id: z.string().min(1),
    version: z.string().min(1),
    engineId: z.string().min(1),
    ruleKind: z.enum([
      "candidate_selection",
      "hard_exclusion",
      "preference_ranking",
      "contingency_trigger",
      "unknown_or_stale_guard",
    ]),
    title: z.string().min(1),
    description: z.string().min(1),
    reasonCode: z.string().min(1),
    severityOrWeight: z.number(),
    onUnknownResult: z.enum(["keep_and_qualify_unknown", "exclude_as_unverified", "skip_bonus"]),
    claimVersionDependencies: z.array(z.string()).min(1),
    when: DecisionIrExpressionSchema,
    remediationHint: z.string().min(1),
    status: EpistemicStatusSchema,
    contentHash: z.string().min(16),
    stableReferenceUri: z.string(),
    immutableReferenceUri: z.string(),
  })
  .strict();
export type DecisionIrRule = z.infer<typeof DecisionIrRuleSchema>;

export const MachineRuleSetSchema = z
  .object({
    objectType: z.literal("RuleSet"),
    id: z.string().min(1),
    engineId: z.string().min(1),
    version: z.string().min(1),
    ruleIds: z.array(z.string()).min(1),
    claimVersionDependencies: z.array(z.string()).min(1),
    contentHash: z.string().min(16),
    stableReferenceUri: z.string(),
    immutableReferenceUri: z.string(),
  })
  .strict();
export type MachineRuleSet = z.infer<typeof MachineRuleSetSchema>;

export const DecisionIrTieBreakFieldSchema = z
  .object({
    field: z.enum([
      "preferenceScore",
      "totalDoorToDoorMinutes",
      "priceFromUsd",
      "candidateId",
    ]),
    direction: z.enum(["asc", "desc"]),
  })
  .strict();

export const CandidateUniverseSchema = z
  .object({
    objectType: z.literal("CandidateUniverse"),
    universeId: z.string().min(1),
    version: z.string().min(1),
    domainPackVersion: z.string().min(1),
    engineId: z.string().min(1),
    engineVersion: z.string().min(1),
    geographicScope: GeographicScopeSchema,
    temporalScope: z
      .object({
        validFrom: z.string(),
        validTo: z.string(),
      })
      .strict(),
    inclusionMethodology: z.string().min(1),
    sourcesConsulted: z.array(z.string()).min(1),
    includedCandidateIds: z.array(z.string()).min(1),
    knownExclusions: z.array(
      z
        .object({
          candidateOrOperator: z.string(),
          reasonCode: z.string(),
          explanation: z.string(),
        })
        .strict(),
    ),
    unresolvedCoverageGaps: z.array(
      z
        .object({
          gapId: z.string(),
          description: z.string(),
          impactOnCompleteness: z.string(),
        })
        .strict(),
    ),
    refreshedAt: z.string(),
    coverageStatus: z.enum([
      "declared_bounded_universe",
      "partial_known_gaps",
      "comprehensive_permitted_roster",
    ]),
    epistemicDisclaimer: z.string().min(1),
    canonicalHash: z.string().min(16),
    storageUri: z.string().min(1),
    stableReferenceUri: z.string(),
    immutableReferenceUri: z.string(),
  })
  .strict();
export type CandidateUniverse = z.infer<typeof CandidateUniverseSchema>;

export const CandidateDispositionEnumSchema = z.enum([
  "eligible",
  "qualified",
  "ineligible",
  "indeterminate",
]);
export type CandidateDisposition = z.infer<typeof CandidateDispositionEnumSchema>;

export const CandidateUniverseDispositionRecordSchema = z
  .object({
    candidateId: z.string(),
    candidateClass: z.enum(["commercial_tour", "noncommercial_or_contingency"]),
    disposition: CandidateDispositionEnumSchema,
    status: z.string(),
    reasonCodes: z.array(z.string()),
    evidenceDependencies: z.array(z.string()),
  })
  .strict();
export type CandidateUniverseDispositionRecord = z.infer<
  typeof CandidateUniverseDispositionRecordSchema
>;

export const SignedDecisionReceiptPayloadSchema = z
  .object({
    spec: z.literal("dcc-decision-receipt/0.2"),
    receiptId: z.string().min(1),
    evaluationFingerprint: z.string().min(16),
    engineId: z.string().min(1),
    engineVersion: z.string().min(1),
    bundleHash: z.string().min(16),
    candidateUniverseId: z.string().min(1),
    candidateUniverseVersion: z.string().min(1),
    candidateUniverseHash: z.string().min(16),
    normalizedInputHash: z.string().min(16),
    validAt: z.string(),
    knownAt: z.string(),
    decisionState: z.string(),
    recommendedCandidateId: z.string().nullable(),
    candidateDispositionSummary: z.array(
      z
        .object({
          candidateId: z.string(),
          disposition: CandidateDispositionEnumSchema,
          reasonCodes: z.array(z.string()),
          evidenceDependencies: z.array(z.string()),
        })
        .strict(),
    ),
    resolvedClaimVersionIds: z.array(z.string()),
    resultHash: z.string().min(16),
    traceHash: z.string().min(16),
    epistemicLimitationStatement: z.string().min(1),
  })
  .strict();

export const SignedDecisionReceiptSchema = z
  .object({
    objectType: z.literal("DecisionReceipt"),
    receiptId: z.string().min(1),
    keyId: z.string().min(1),
    algorithm: z.literal("Ed25519"),
    issuedAt: z.string(),
    canonicalPayloadHash: z.string().min(16),
    signature: z.string().min(16),
    signatureBase64Url: z.string().min(16),
    publicKeyDiscoveryUri: z.literal("/.well-known/dcc/keys.json"),
    immutableReferenceUri: z.string(),
    stableReferenceUri: z.string(),
    epistemicLimitationStatement: z.string(),
    payload: SignedDecisionReceiptPayloadSchema,
    canonicalPayload: SignedDecisionReceiptPayloadSchema,
  })
  .strict();
export type SignedDecisionReceiptObject = z.infer<typeof SignedDecisionReceiptSchema>;

export const DecisionIrManifestSchema = z
  .object({
    engineId: z.string().min(1),
    version: z.string().min(1),
    irSchemaVersion: z.literal("dcc-decision-ir/0.1"),
    sourceRevision: z.string().min(1),
    ruleSetId: z.string().min(1),
    ruleSetHash: z.string().min(16),
    candidateUniverseId: z.string().min(1).optional(),
    candidateUniverseVersion: z.string().min(1).optional(),
    candidateUniverseHash: z.string().min(16).optional(),
    dependencyHashes: z.record(z.string(), z.string()),
    conflictIds: z.array(z.string()),
    candidateCount: z.number().int().positive(),
    ruleCount: z.number().int().positive(),
    createdAt: z.string(),
    bundleHash: z.string().min(16),
  })
  .strict();
export type DecisionIrManifest = z.infer<typeof DecisionIrManifestSchema>;

export const DecisionIrBundleSchema = z
  .object({
    objectType: z.literal("EngineBundle"),
    id: z.string().min(1),
    engineId: z.string().min(1),
    version: z.string().min(1),
    irSchemaVersion: z.literal("dcc-decision-ir/0.1"),
    title: z.string().min(1),
    domainCategory: z.string().min(1),
    destinationEntityId: z.string().min(1),
    jurisdiction: z.string().min(1),
    timezone: z.string().min(1),
    candidateUniverseId: z.string().min(1).optional(),
    candidateUniverseVersion: z.string().min(1).optional(),
    candidateUniverseHash: z.string().min(16).optional(),
    inputSchema: z.array(DecisionIrInputFieldSchema).min(1),
    derivedInputs: z.array(DecisionIrDerivedInputSchema),
    candidateSelection: z
      .object({
        commercialFilterField: z.literal("candidateClass"),
        commercialFilterValue: z.literal("commercial_tour"),
        includeContingencyCandidatesWhenZeroViable: z.boolean(),
      })
      .strict(),
    candidates: z.array(DecisionIrCandidateSchema).min(1),
    rules: z.array(DecisionIrRuleSchema).min(1),
    tieBreakers: z.array(DecisionIrTieBreakFieldSchema).min(1),
    embeddedClaims: z.record(z.string(), MachineClaimVersionSchema),
    embeddedConflicts: z.record(z.string(), MachineClaimConflictSchema),
    manifest: DecisionIrManifestSchema,
    storageUri: z.string().min(1),
    bundleHash: z.string().min(16),
    stableReferenceUri: z.string(),
    immutableReferenceUri: z.string(),
  })
  .strict();
export type DecisionIrBundle = z.infer<typeof DecisionIrBundleSchema>;

export const MachineEngineSchema = z
  .object({
    objectType: z.literal("Engine"),
    id: z.string().min(1),
    title: z.string().min(1),
    domainCategory: z.string().min(1),
    destinationEntityId: z.string().min(1),
    activeVersion: z.string().min(1),
    previousActiveVersion: z.string().nullable(),
    availableVersions: z.array(z.string()).min(1),
    status: EpistemicStatusSchema,
    activeBundleUri: z.string(),
    stableReferenceUri: z.string(),
    immutableReferenceUri: z.string(),
  })
  .strict();
export type MachineEngine = z.infer<typeof MachineEngineSchema>;

export const MachineEngineVersionSchema = z
  .object({
    objectType: z.literal("EngineVersion"),
    id: z.string().min(1),
    engineId: z.string().min(1),
    version: z.string().min(1),
    ruleSetId: z.string().min(1),
    sourceRevision: z.string().min(1),
    bundleHash: z.string().min(16),
    manifest: DecisionIrManifestSchema,
    status: EpistemicStatusSchema,
    published_at: z.string(),
    stableReferenceUri: z.string(),
    immutableReferenceUri: z.string(),
  })
  .strict();
export type MachineEngineVersion = z.infer<typeof MachineEngineVersionSchema>;

// ============================================================================
// Evaluation & Trace Schemas (Compact & Expanded Provenance Modes)
// ============================================================================

export const RuleExecutionRecordSchema = z
  .object({
    ruleId: z.string(),
    ruleVersion: z.string(),
    ruleKind: z.string(),
    reasonCode: z.string(),
    outcome: z.enum(["passed", "triggered", "not_triggered", "unknown", "conflict_blocked", "withdrawn_blocked"]),
    scoreDelta: z.number(),
    claimVersionIds: z.array(z.string()),
    immutableRuleReferenceUri: z.string(),
    immutableClaimReferenceUris: z.array(z.string()),
    remediationHint: z.string().optional(),
  })
  .strict();
export type RuleExecutionRecord = z.infer<typeof RuleExecutionRecordSchema>;

export const CandidateEvaluationSummarySchema = z
  .object({
    candidateId: z.string(),
    entityId: z.string(),
    title: z.string(),
    candidateClass: z.enum(["commercial_tour", "noncommercial_or_contingency"]),
    disposition: CandidateDispositionEnumSchema.optional(),
    status: z.enum([
      "recommended",
      "viable_qualified_unknown_or_stale",
      "conflict_blocked",
      "excluded",
      "contingency_fallback",
    ]),
    preferenceScore: z.number(),
    commercialWeightApplied: z.literal(0),
    totalDoorToDoorMinutes: z.number().nullable(),
    priceFromUsd: z.number().nullable(),
    reasonCodes: z.array(z.string()),
    failedHardRuleIds: z.array(z.string()),
    matchedPreferenceRuleIds: z.array(z.string()),
    qualificationWarnings: z.array(z.string()),
    remediationHints: z.array(z.string()),
    supportingClaimVersionIds: z.array(z.string()),
    evidenceDependencies: z.array(z.string()).optional(),
    referenceUris: z.array(z.string()),
    bookingHandoffs: DecisionIrCandidateSchema.shape.bookingHandoffs,
  })
  .strict();
export type CandidateEvaluationSummary = z.infer<typeof CandidateEvaluationSummarySchema>;

export const MachineEvaluationTraceSchema = z
  .object({
    objectType: z.literal("EvaluationTrace"),
    id: z.string(),
    traceRunId: z.string().optional(),
    evaluationId: z.string(),
    evaluationRunId: z.string().optional(),
    evaluationFingerprint: z.string().optional(),
    engineId: z.string(),
    engineVersion: z.string(),
    bundleHash: z.string(),
    candidateUniverseId: z.string().optional(),
    candidateUniverseVersion: z.string().optional(),
    candidateUniverseHash: z.string().optional(),
    validAt: z.string().optional(),
    knownAt: z.string().optional(),
    normalizedInput: z.record(z.string(), z.unknown()),
    derivedInput: z.record(z.string(), z.unknown()),
    unknownFields: z.array(z.string()),
    conflictsEncountered: z.array(z.string()),
    withdrawnClaimsEncountered: z.array(z.string()),
    staleClaimsEncountered: z.array(z.string()),
    candidateTraces: z.array(
      z
        .object({
          candidateId: z.string(),
          disposition: CandidateDispositionEnumSchema.optional(),
          status: z.string(),
          preferenceScore: z.number(),
          ruleExecutions: z.array(RuleExecutionRecordSchema),
        })
        .strict(),
    ),
    resolvedClaimVersionIds: z.array(z.string()),
    traceHash: z.string(),
    stableReferenceUri: z.string(),
    immutableReferenceUri: z.string(),
  })
  .strict();
export type MachineEvaluationTrace = z.infer<typeof MachineEvaluationTraceSchema>;

export const CompactEvaluationResponseSchema = z
  .object({
    ok: z.literal(true),
    mode: z.literal("compact"),
    evaluationId: z.string(),
    evaluationRunId: z.string(),
    evaluationFingerprint: z.string(),
    traceId: z.string(),
    traceRunId: z.string(),
    receiptId: z.string(),
    engineId: z.string(),
    engineVersion: z.string(),
    pinnedVersionRequested: z.boolean(),
    bundleHash: z.string(),
    candidateUniverseId: z.string(),
    candidateUniverseVersion: z.string(),
    candidateUniverseHash: z.string(),
    normalizedInputHash: z.string(),
    resultHash: z.string(),
    traceHash: z.string(),
    validAt: z.string(),
    knownAt: z.string(),
    cacheHit: z.boolean(),
    decisionState: z.enum([
      "recommended",
      "qualified_with_warnings",
      "conflict_blocked",
      "unknown_insufficient_inputs",
      "no_viable_candidates",
    ]),
    epistemicScopeDisclaimer: z.string(),
    recommendedCandidateId: z.string().nullable(),
    recommendedCandidate: CandidateEvaluationSummarySchema.nullable(),
    viableCandidates: z.array(CandidateEvaluationSummarySchema),
    excludedCandidates: z.array(CandidateEvaluationSummarySchema),
    contingencyCandidates: z.array(CandidateEvaluationSummarySchema),
    candidateDispositions: z.array(CandidateUniverseDispositionRecordSchema),
    unknownFields: z.array(z.string()),
    conflictIds: z.array(z.string()),
    withdrawnClaimVersionIds: z.array(z.string()),
    reasonCodes: z.array(z.string()),
    referenceIds: z.array(z.string()),
    immutableReferenceUris: z.array(z.string()),
    receipt: SignedDecisionReceiptSchema,
    evaluatedAt: z.string(),
  })
  .strict();
export type CompactEvaluationResponse = z.infer<typeof CompactEvaluationResponseSchema>;

export const ExpandedEvaluationResponseSchema = CompactEvaluationResponseSchema.extend({
  mode: z.literal("expanded"),
  trace: MachineEvaluationTraceSchema,
  provenanceGraph: z
    .object({
      entities: z.record(z.string(), MachineEntitySchema),
      rules: z.record(z.string(), DecisionIrRuleSchema),
      claimVersions: z.record(z.string(), MachineClaimVersionSchema),
      evidenceFragments: z.record(z.string(), MachineEvidenceFragmentSchema),
      sourceSnapshots: z.record(z.string(), MachineSourceSnapshotSchema),
      sources: z.record(z.string(), MachineSourceSchema),
      conflicts: z.record(z.string(), MachineClaimConflictSchema),
      retractions: z.record(z.string(), MachineRetractionSchema),
    })
    .strict(),
}).strict();
export type ExpandedEvaluationResponse = z.infer<typeof ExpandedEvaluationResponseSchema>;

export const ReferenceResolutionEnvelopeSchema = z
  .object({
    spec: z.literal("dcc-reference-envelope/0.1"),
    referenceId: z.string(),
    resolutionMode: z.enum(["stable_alias", "immutable_version"]),
    objectType: z.enum([
      "Entity",
      "Source",
      "SourceSnapshot",
      "EvidenceFragment",
      "Claim",
      "ClaimVersion",
      "ClaimConflict",
      "Rule",
      "RuleSet",
      "Engine",
      "EngineVersion",
      "EngineBundle",
      "CandidateUniverse",
      "DecisionReceipt",
      "Evaluation",
      "EvaluationTrace",
      "RetractionOrWithdrawal",
    ]),
    currentStatus: EpistemicStatusSchema,
    immutableVersion: z.string(),
    canonicalCitationUri: z.string(),
    stableAliasUri: z.string(),
    sourceMetadata: z
      .object({
        sourceId: z.string().nullable(),
        organization: z.string().nullable(),
        canonicalSourceUrl: z.string().nullable(),
        sourceSnapshotId: z.string().nullable(),
        artifactStorageUri: z.string().nullable(),
        licenseOrReuseStatus: z.string().nullable(),
        retrievalMethod: z.string().nullable(),
      })
      .strict(),
    evidenceLocation: z
      .object({
        evidenceFragmentId: z.string().nullable(),
        locator: z.string().nullable(),
        verbatimExcerpt: z.string().nullable(),
      })
      .strict(),
    validityDates: z
      .object({
        valid_from: z.string().nullable(),
        valid_to: z.string().nullable(),
        observed_at: z.string().nullable(),
        known_from: z.string().nullable().optional(),
        known_to: z.string().nullable().optional(),
      })
      .strict(),
    retrievalDate: z.string(),
    contentHash: z.string(),
    supersessionOrWithdrawal: z
      .object({
        isSuperseded: z.boolean(),
        supersededByVersionId: z.string().nullable(),
        supersededByUri: z.string().nullable(),
        supersedesVersionId: z.string().nullable(),
        isWithdrawn: z.boolean(),
        retractionId: z.string().nullable(),
        withdrawalReason: z.string().nullable(),
        withdrawnAt: z.string().nullable(),
      })
      .strict(),
    connectedReferences: z.array(
      z
        .object({
          relation: z.string(),
          targetId: z.string(),
          stableUri: z.string(),
          immutableUri: z.string().optional(),
        })
        .strict(),
    ),
    payload: z.record(z.string(), z.unknown()),
  })
  .strict();
export type ReferenceResolutionEnvelope = z.infer<typeof ReferenceResolutionEnvelopeSchema>;

// ============================================================================
// Published Canonical JSON Schemas (Draft 2020-12) & Structural Validator
// ============================================================================

export const CANDIDATE_UNIVERSE_JSON_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://www.destinationcommandcenter.com/schemas/dcc-candidate-universe-v0.2.json",
  title: "DCC CandidateUniverse v0.2",
  type: "object",
  required: [
    "objectType",
    "universeId",
    "version",
    "domainPackVersion",
    "engineId",
    "engineVersion",
    "geographicScope",
    "temporalScope",
    "inclusionMethodology",
    "sourcesConsulted",
    "includedCandidateIds",
    "knownExclusions",
    "unresolvedCoverageGaps",
    "refreshedAt",
    "coverageStatus",
    "epistemicDisclaimer",
    "canonicalHash",
    "storageUri",
    "stableReferenceUri",
    "immutableReferenceUri",
  ],
  properties: {
    objectType: { const: "CandidateUniverse" },
    universeId: { type: "string", minLength: 1 },
    version: { type: "string", minLength: 1 },
    domainPackVersion: { type: "string", minLength: 1 },
    engineId: { type: "string", minLength: 1 },
    engineVersion: { type: "string", minLength: 1 },
    includedCandidateIds: { type: "array", minItems: 1 },
    sourcesConsulted: { type: "array", minItems: 1 },
    canonicalHash: { type: "string", minLength: 16 },
  },
} as const;

export const SIGNED_RECEIPT_JSON_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://www.destinationcommandcenter.com/schemas/dcc-signed-receipt-v0.2.json",
  title: "DCC Signed Decision Receipt v0.2",
  type: "object",
  required: [
    "objectType",
    "receiptId",
    "keyId",
    "algorithm",
    "issuedAt",
    "canonicalPayloadHash",
    "signature",
    "publicKeyDiscoveryUri",
    "immutableReferenceUri",
    "payload",
  ],
  properties: {
    objectType: { const: "DecisionReceipt" },
    receiptId: { type: "string", minLength: 1 },
    keyId: { type: "string", minLength: 1 },
    algorithm: { const: "Ed25519" },
    canonicalPayloadHash: { type: "string", minLength: 16 },
    signature: { type: "string", minLength: 16 },
    publicKeyDiscoveryUri: { const: "/.well-known/dcc/keys.json" },
    payload: {
      type: "object",
      required: [
        "spec",
        "receiptId",
        "evaluationFingerprint",
        "engineId",
        "engineVersion",
        "bundleHash",
        "candidateUniverseId",
        "candidateUniverseVersion",
        "candidateUniverseHash",
        "normalizedInputHash",
        "validAt",
        "knownAt",
        "decisionState",
        "recommendedCandidateId",
        "candidateDispositionSummary",
        "resolvedClaimVersionIds",
        "resultHash",
        "traceHash",
        "epistemicLimitationStatement",
      ],
    },
  },
} as const;

export const DECISION_IR_JSON_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://www.destinationcommandcenter.com/schemas/dcc-decision-ir-v0.1.json",
  title: "DCC Decision IR Bundle v0.1",
  type: "object",
  required: [
    "objectType",
    "id",
    "engineId",
    "version",
    "irSchemaVersion",
    "title",
    "domainCategory",
    "destinationEntityId",
    "jurisdiction",
    "timezone",
    "inputSchema",
    "derivedInputs",
    "candidateSelection",
    "candidates",
    "rules",
    "tieBreakers",
    "embeddedClaims",
    "embeddedConflicts",
    "manifest",
    "storageUri",
    "bundleHash",
    "stableReferenceUri",
    "immutableReferenceUri",
  ],
  properties: {
    objectType: { const: "EngineBundle" },
    id: { type: "string", minLength: 1 },
    engineId: { type: "string", minLength: 1 },
    version: { type: "string", minLength: 1 },
    irSchemaVersion: { const: "dcc-decision-ir/0.1" },
    title: { type: "string", minLength: 1 },
    domainCategory: { type: "string", minLength: 1 },
    destinationEntityId: { type: "string", minLength: 1 },
    jurisdiction: { type: "string", minLength: 1 },
    timezone: { type: "string", minLength: 1 },
    inputSchema: { type: "array", minItems: 1 },
    derivedInputs: { type: "array" },
    candidateSelection: { type: "object" },
    candidates: { type: "array", minItems: 1 },
    rules: { type: "array", minItems: 1 },
    tieBreakers: { type: "array", minItems: 1 },
    embeddedClaims: { type: "object" },
    embeddedConflicts: { type: "object" },
    manifest: {
      type: "object",
      required: [
        "engineId",
        "version",
        "irSchemaVersion",
        "sourceRevision",
        "ruleSetId",
        "ruleSetHash",
        "dependencyHashes",
        "conflictIds",
        "candidateCount",
        "ruleCount",
        "createdAt",
        "bundleHash",
      ],
    },
    storageUri: { type: "string", minLength: 1 },
    bundleHash: { type: "string", minLength: 16 },
    stableReferenceUri: { type: "string", minLength: 1 },
    immutableReferenceUri: { type: "string", minLength: 1 },
  },
} as const;

export const CLAIM_VERSION_JSON_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://www.destinationcommandcenter.com/schemas/dcc-claim-version-v0.1.json",
  title: "DCC Machine ClaimVersion v0.1",
  type: "object",
  required: [
    "objectType",
    "claimId",
    "versionId",
    "versionNumber",
    "epistemicKind",
    "subject",
    "predicate",
    "typedValue",
    "unitOrCurrency",
    "geographicScope",
    "jurisdiction",
    "valid_from",
    "valid_to",
    "observed_at",
    "retrieved_at",
    "status",
    "sourceId",
    "sourceOrganization",
    "canonicalSourceUrl",
    "sourceSnapshotId",
    "evidenceFragmentId",
    "supportingFragment",
    "evidenceHash",
    "retrievalMethod",
    "licenseOrReuseStatus",
    "supersededByVersionId",
    "supersedesVersionId",
    "retractionId",
    "withdrawalInfo",
    "conflictingClaimVersionIds",
    "verificationApprovedBy",
    "stableReferenceUri",
    "immutableReferenceUri",
  ],
} as const;

export const REFERENCE_ENVELOPE_JSON_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://www.destinationcommandcenter.com/schemas/dcc-reference-envelope-v0.1.json",
  title: "DCC Reference Resolution Envelope v0.1",
  type: "object",
  required: [
    "spec",
    "referenceId",
    "resolutionMode",
    "objectType",
    "currentStatus",
    "immutableVersion",
    "canonicalCitationUri",
    "stableAliasUri",
    "sourceMetadata",
    "evidenceLocation",
    "validityDates",
    "retrievalDate",
    "contentHash",
    "supersessionOrWithdrawal",
    "connectedReferences",
    "payload",
  ],
} as const;

export const COMPACT_EVALUATION_JSON_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://www.destinationcommandcenter.com/schemas/dcc-evaluation-compact-v0.2.json",
  title: "DCC Compact Evaluation Response v0.2",
  type: "object",
  required: [
    "ok",
    "mode",
    "evaluationId",
    "evaluationRunId",
    "evaluationFingerprint",
    "traceId",
    "traceRunId",
    "receiptId",
    "engineId",
    "engineVersion",
    "pinnedVersionRequested",
    "bundleHash",
    "candidateUniverseId",
    "candidateUniverseVersion",
    "candidateUniverseHash",
    "normalizedInputHash",
    "resultHash",
    "traceHash",
    "validAt",
    "knownAt",
    "cacheHit",
    "decisionState",
    "epistemicScopeDisclaimer",
    "recommendedCandidateId",
    "recommendedCandidate",
    "viableCandidates",
    "excludedCandidates",
    "contingencyCandidates",
    "candidateDispositions",
    "unknownFields",
    "conflictIds",
    "withdrawnClaimVersionIds",
    "reasonCodes",
    "referenceIds",
    "immutableReferenceUris",
    "receipt",
    "evaluatedAt",
  ],
} as const;

export const EXPANDED_EVALUATION_JSON_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://www.destinationcommandcenter.com/schemas/dcc-evaluation-expanded-v0.2.json",
  title: "DCC Expanded Evaluation Response v0.2",
  type: "object",
  required: [
    ...COMPACT_EVALUATION_JSON_SCHEMA.required,
    "trace",
    "provenanceGraph",
  ],
} as const;

export const DCC_MACHINE_JSON_SCHEMAS = {
  DecisionIrBundle: DECISION_IR_JSON_SCHEMA,
  ClaimVersion: CLAIM_VERSION_JSON_SCHEMA,
  CandidateUniverse: CANDIDATE_UNIVERSE_JSON_SCHEMA,
  SignedDecisionReceipt: SIGNED_RECEIPT_JSON_SCHEMA,
  ReferenceResolutionEnvelope: REFERENCE_ENVELOPE_JSON_SCHEMA,
  CompactEvaluationResponse: COMPACT_EVALUATION_JSON_SCHEMA,
  ExpandedEvaluationResponse: EXPANDED_EVALUATION_JSON_SCHEMA,
} as const;

export function validateAgainstJsonSchema(
  data: unknown,
  schema: {
    type?: string;
    const?: unknown;
    required?: readonly string[];
    properties?: Record<string, Record<string, unknown>>;
    minItems?: number;
    minLength?: number;
  },
  path = "$",
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (schema.const !== undefined && data !== schema.const) {
    errors.push(`${path}: expected const ${JSON.stringify(schema.const)}, got ${JSON.stringify(data)}`);
  }

  if (schema.type === "object") {
    if (typeof data !== "object" || data === null || Array.isArray(data)) {
      errors.push(`${path}: expected object`);
      return { valid: false, errors };
    }
    const obj = data as Record<string, unknown>;
    if (schema.required) {
      for (const reqKey of schema.required) {
        if (!(reqKey in obj) || obj[reqKey] === undefined) {
          errors.push(`${path}.${reqKey}: required property missing`);
        }
      }
    }
    if (schema.properties) {
      for (const [propKey, propSchema] of Object.entries(schema.properties)) {
        if (propKey in obj && obj[propKey] !== undefined) {
          const sub = validateAgainstJsonSchema(
            obj[propKey],
            propSchema as typeof schema,
            `${path}.${propKey}`,
          );
          errors.push(...sub.errors);
        }
      }
    }
  } else if (schema.type === "array") {
    if (!Array.isArray(data)) {
      errors.push(`${path}: expected array`);
      return { valid: false, errors };
    }
    if (schema.minItems !== undefined && data.length < schema.minItems) {
      errors.push(`${path}: expected at least ${schema.minItems} items, got ${data.length}`);
    }
  } else if (schema.type === "string") {
    if (typeof data !== "string") {
      errors.push(`${path}: expected string`);
      return { valid: false, errors };
    }
    if (schema.minLength !== undefined && data.length < schema.minLength) {
      errors.push(`${path}: expected minLength ${schema.minLength}, got ${data.length}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
