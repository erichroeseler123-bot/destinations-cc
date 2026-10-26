import {
  canonicalJsonStringify,
  hashCanonicalJson,
  writeImmutableArtifact,
} from "./cryptoAndStorage";
import {
  DECISION_IR_JSON_SCHEMA,
  DecisionIrBundleSchema,
  validateAgainstJsonSchema,
  type DecisionIrBundle,
  type DecisionIrCandidate,
  type DecisionIrDerivedInput,
  type DecisionIrExpression,
  type DecisionIrInputField,
  type DecisionIrManifest,
  type DecisionIrOperand,
  type DecisionIrRule,
  type MachineClaimConflict,
  type MachineClaimVersion,
  type MachineEntity,
  type MachineEvidenceFragment,
  type MachineRuleSet,
  type MachineSource,
  type MachineSourceSnapshot,
} from "./schemas";

/**
 * DCC Decision IR Compiler v0.1
 *
 * Compiles a declarative engine specification + evidence graph into a canonical,
 * immutable `DecisionIrBundle` (`EngineBundle`) with SHA-256 manifest verification.
 */

export class CompilerValidationError extends Error {
  public readonly code: string;
  public readonly details: string[];
  constructor(code: string, message: string, details: string[] = []) {
    super(message);
    this.name = "CompilerValidationError";
    this.code = code;
    this.details = details;
  }
}

export class ImmutableVersionMutationError extends Error {
  public readonly engineId: string;
  public readonly version: string;
  constructor(engineId: string, version: string, message: string) {
    super(message);
    this.name = "ImmutableVersionMutationError";
    this.engineId = engineId;
    this.version = version;
  }
}

export type CompilerRuleDraft = {
  id: string;
  version: string;
  ruleKind: DecisionIrRule["ruleKind"];
  title: string;
  description: string;
  reasonCode: string;
  severityOrWeight: number;
  onUnknownResult: DecisionIrRule["onUnknownResult"];
  claimVersionDependencies: string[];
  when: DecisionIrExpression;
  remediationHint: string;
};

export type EngineCompilationInput = {
  engineId: string;
  version: string;
  sourceRevision: string;
  title: string;
  domainCategory: string;
  destinationEntityId: string;
  jurisdiction: string;
  timezone: string;
  createdAt?: string;
  inputSchema: DecisionIrInputField[];
  derivedInputs: DecisionIrDerivedInput[];
  candidates: DecisionIrCandidate[];
  rules: CompilerRuleDraft[];
  tieBreakers?: DecisionIrBundle["tieBreakers"];
};

export type KnowledgeGraphContext = {
  entities: Map<string, MachineEntity>;
  sources: Map<string, MachineSource>;
  sourceSnapshots: Map<string, MachineSourceSnapshot>;
  evidenceFragments: Map<string, MachineEvidenceFragment>;
  claimVersions: Map<string, MachineClaimVersion>;
  conflicts: Map<string, MachineClaimConflict>;
  publishedBundles: Map<string, DecisionIrBundle>; // key: `${engineId}@${version}`
};

function collectExpressionOperands(expr: DecisionIrExpression, out: DecisionIrOperand[] = []): DecisionIrOperand[] {
  switch (expr.op) {
    case "all":
    case "any":
      for (const child of expr.args) collectExpressionOperands(child, out);
      break;
    case "not":
      collectExpressionOperands(expr.arg, out);
      break;
    case "is_known":
    case "is_unknown":
      out.push(expr.target);
      break;
    case "eq":
    case "neq":
    case "gt":
    case "gte":
    case "lt":
    case "lte":
    case "intersects":
      out.push(expr.left, expr.right);
      break;
    case "in":
    case "not_in":
      out.push(expr.item, expr.set);
      break;
    case "contains":
      out.push(expr.collection, expr.item);
      break;
    case "between":
      out.push(expr.value, expr.min, expr.max);
      break;
    case "time_window_fits":
      out.push(expr.availableMinutes, expr.requiredMinutes);
      break;
    case "month_in":
      out.push(expr.month, expr.allowedMonths);
      break;
    case "date_within_range":
      out.push(expr.dateIso, expr.startIso, expr.endIso);
      break;
    case "geo_scope_matches":
      out.push(expr.requestedGeo, expr.candidateGeo);
      break;
    case "capacity_fits":
      out.push(expr.requestedGroupSize, expr.maxCapacity);
      break;
  }
  return out;
}

export function compileDecisionEngineBundle(
  spec: EngineCompilationInput,
  graph: KnowledgeGraphContext,
): {
  bundle: DecisionIrBundle;
  ruleSet: MachineRuleSet;
  compiledRules: DecisionIrRule[];
} {
  const validationErrors: string[] = [];

  if (!spec.engineId || !/^[a-z0-9-]+$/.test(spec.engineId)) {
    validationErrors.push(`Invalid engineId '${spec.engineId}'.`);
  }
  if (!spec.version || !/^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/.test(spec.version)) {
    validationErrors.push(`Invalid semantic version '${spec.version}'.`);
  }

  // Verify destination entity exists
  if (!graph.entities.has(spec.destinationEntityId)) {
    validationErrors.push(
      `Orphaned destinationEntityId '${spec.destinationEntityId}': entity not found in knowledge graph.`,
    );
  }

  // Validate inputSchema uniqueness
  const declaredInputFields = new Set<string>();
  for (const fieldDef of spec.inputSchema) {
    if (declaredInputFields.has(fieldDef.field)) {
      validationErrors.push(`Duplicate input field '${fieldDef.field}' in inputSchema.`);
    }
    declaredInputFields.add(fieldDef.field);
    if (fieldDef.type === "enum" && (!fieldDef.enumValues || fieldDef.enumValues.length === 0)) {
      validationErrors.push(`Enum input field '${fieldDef.field}' must define enumValues.`);
    }
  }

  const declaredDerivedFields = new Set<string>();
  for (const derived of spec.derivedInputs) {
    if (declaredDerivedFields.has(derived.field) || declaredInputFields.has(derived.field)) {
      validationErrors.push(`Duplicate or colliding derived input field '${derived.field}'.`);
    }
    declaredDerivedFields.add(derived.field);
  }

  // Validate candidates and their entity/claim references
  const embeddedClaims: Record<string, MachineClaimVersion> = {};
  const embeddedConflicts: Record<string, MachineClaimConflict> = {};
  const dependencyHashes: Record<string, string> = {};

  function resolveAndVerifyClaimVersion(claimVersionId: string, contextLabel: string): void {
    const claimVer = graph.claimVersions.get(claimVersionId);
    if (!claimVer) {
      validationErrors.push(
        `Orphaned claimVersionId '${claimVersionId}' referenced by ${contextLabel}: not found in graph.`,
      );
      return;
    }
    const snapshot = graph.sourceSnapshots.get(claimVer.sourceSnapshotId);
    if (!snapshot) {
      validationErrors.push(
        `ClaimVersion '${claimVersionId}' references missing SourceSnapshot '${claimVer.sourceSnapshotId}'.`,
      );
    }
    const fragment = graph.evidenceFragments.get(claimVer.evidenceFragmentId);
    if (!fragment) {
      validationErrors.push(
        `ClaimVersion '${claimVersionId}' references missing EvidenceFragment '${claimVer.evidenceFragmentId}'.`,
      );
    }
    const source = graph.sources.get(claimVer.sourceId);
    if (!source) {
      validationErrors.push(
        `ClaimVersion '${claimVersionId}' references missing Source '${claimVer.sourceId}'.`,
      );
    }
    if (!graph.entities.has(claimVer.subject)) {
      validationErrors.push(
        `ClaimVersion '${claimVersionId}' references missing subject Entity '${claimVer.subject}'.`,
      );
    }

    embeddedClaims[claimVersionId] = claimVer;
    dependencyHashes[claimVersionId] = claimVer.evidenceHash;

    // Preserve any known conflicts referencing this claimVersionId or claimId
    for (const conflict of graph.conflicts.values()) {
      if (
        conflict.claimId === claimVer.claimId ||
        conflict.claimVersionIds.includes(claimVersionId)
      ) {
        embeddedConflicts[conflict.id] = conflict;
        dependencyHashes[conflict.id] = conflict.contentHash;
      }
    }
  }

  if (spec.candidates.length === 0) {
    validationErrors.push(`Engine '${spec.engineId}' must declare at least 1 candidate.`);
  }

  const candidateIds = new Set<string>();
  for (const candidate of spec.candidates) {
    if (candidateIds.has(candidate.candidateId)) {
      validationErrors.push(`Duplicate candidateId '${candidate.candidateId}'.`);
    }
    candidateIds.add(candidate.candidateId);

    if (!graph.entities.has(candidate.entityId)) {
      validationErrors.push(
        `Candidate '${candidate.candidateId}' references missing entityId '${candidate.entityId}'.`,
      );
    }
    if (!graph.entities.has(candidate.operatorEntityId)) {
      validationErrors.push(
        `Candidate '${candidate.candidateId}' references missing operatorEntityId '${candidate.operatorEntityId}'.`,
      );
    }
    if (!candidate.claimVersionIds || candidate.claimVersionIds.length === 0) {
      validationErrors.push(
        `Candidate '${candidate.candidateId}' has no supporting claimVersionIds.`,
      );
    }
    for (const cvId of candidate.claimVersionIds) {
      resolveAndVerifyClaimVersion(cvId, `candidate:${candidate.candidateId}`);
    }
    for (const handoff of candidate.bookingHandoffs) {
      const lowerUrl = handoff.url.toLowerCase();
      const lowerSeller = handoff.sellerName.toLowerCase();
      if (
        lowerUrl.includes("welcometoalaskatours") ||
        lowerSeller.includes("welcome to alaska tours")
      ) {
        validationErrors.push(
          `Disallowed Welcome to Alaska Tours handoff in candidate '${candidate.candidateId}'.`,
        );
      }
    }
  }

  // Validate rules and their claim dependencies & operand references
  if (spec.rules.length === 0) {
    validationErrors.push(`Engine '${spec.engineId}' must declare at least 1 rule.`);
  }

  const ruleIds = new Set<string>();
  const compiledRules: DecisionIrRule[] = [];
  const allRuleClaimDeps = new Set<string>();

  for (const draft of spec.rules) {
    if (ruleIds.has(draft.id)) {
      validationErrors.push(`Duplicate rule id '${draft.id}'.`);
    }
    ruleIds.add(draft.id);

    if (!draft.claimVersionDependencies || draft.claimVersionDependencies.length === 0) {
      validationErrors.push(
        `Rule '${draft.id}' has empty claimVersionDependencies; every rule must reference at least 1 immutable ClaimVersion.`,
      );
    }

    for (const cvId of draft.claimVersionDependencies) {
      resolveAndVerifyClaimVersion(cvId, `rule:${draft.id}`);
      allRuleClaimDeps.add(cvId);
    }

    const operands = collectExpressionOperands(draft.when);
    for (const operand of operands) {
      if (operand.ref === "input" && !declaredInputFields.has(operand.field)) {
        validationErrors.push(
          `Rule '${draft.id}' references undeclared input field '${operand.field}'.`,
        );
      }
      if (operand.ref === "derived" && !declaredDerivedFields.has(operand.field)) {
        validationErrors.push(
          `Rule '${draft.id}' references undeclared derived input field '${operand.field}'.`,
        );
      }
      if (operand.ref === "claim") {
        if (!draft.claimVersionDependencies.includes(operand.claimVersionId)) {
          validationErrors.push(
            `Rule '${draft.id}' expression references claim '${operand.claimVersionId}' not listed in its claimVersionDependencies.`,
          );
        }
        resolveAndVerifyClaimVersion(operand.claimVersionId, `rule:${draft.id}:expr`);
      }
    }

    const ruleCore = {
      objectType: "Rule" as const,
      id: draft.id,
      version: draft.version,
      engineId: spec.engineId,
      ruleKind: draft.ruleKind,
      title: draft.title,
      description: draft.description,
      reasonCode: draft.reasonCode,
      severityOrWeight: draft.severityOrWeight,
      onUnknownResult: draft.onUnknownResult,
      claimVersionDependencies: [...draft.claimVersionDependencies].sort(),
      when: draft.when,
      remediationHint: draft.remediationHint,
      status: "verified" as const,
      stableReferenceUri: `/r/${draft.id}`,
      immutableReferenceUri: `/r/${draft.id}/v/${draft.version}`,
    };

    const contentHash = hashCanonicalJson(ruleCore);
    compiledRules.push({
      ...ruleCore,
      contentHash,
    });
    dependencyHashes[draft.id] = contentHash;
  }

  if (validationErrors.length > 0) {
    throw new CompilerValidationError(
      "COMPILER_VALIDATION_FAILED",
      `Failed to compile engine '${spec.engineId}@${spec.version}': ${validationErrors.join(" | ")}`,
      validationErrors,
    );
  }

  const ruleSetId = `ruleset:${spec.engineId}:${spec.version}`;
  const sortedRuleIds = compiledRules.map((r) => r.id);
  const sortedRuleClaimDeps = Array.from(allRuleClaimDeps).sort();
  const ruleSetCore = {
    objectType: "RuleSet" as const,
    id: ruleSetId,
    engineId: spec.engineId,
    version: spec.version,
    ruleIds: sortedRuleIds,
    claimVersionDependencies: sortedRuleClaimDeps,
    stableReferenceUri: `/r/${ruleSetId}`,
    immutableReferenceUri: `/r/${ruleSetId}/v/${spec.version}`,
  };
  const ruleSetHash = hashCanonicalJson(ruleSetCore);
  const ruleSet: MachineRuleSet = {
    ...ruleSetCore,
    contentHash: ruleSetHash,
  };

  const createdAt = spec.createdAt ?? "2026-04-20T00:00:00.000Z";
  const tieBreakers: DecisionIrBundle["tieBreakers"] = spec.tieBreakers ?? [
    { field: "preferenceScore", direction: "desc" },
    { field: "totalDoorToDoorMinutes", direction: "asc" },
    { field: "priceFromUsd", direction: "asc" },
    { field: "candidateId", direction: "asc" },
  ];

  const bundleId = `bundle:${spec.engineId}:${spec.version}`;
  const preHashBundlePayload = {
    objectType: "EngineBundle" as const,
    id: bundleId,
    engineId: spec.engineId,
    version: spec.version,
    irSchemaVersion: "dcc-decision-ir/0.1" as const,
    title: spec.title,
    domainCategory: spec.domainCategory,
    destinationEntityId: spec.destinationEntityId,
    jurisdiction: spec.jurisdiction,
    timezone: spec.timezone,
    inputSchema: spec.inputSchema,
    derivedInputs: spec.derivedInputs,
    candidateSelection: {
      commercialFilterField: "candidateClass" as const,
      commercialFilterValue: "commercial_tour" as const,
      includeContingencyCandidatesWhenZeroViable: true,
    },
    candidates: spec.candidates,
    rules: compiledRules,
    tieBreakers,
    embeddedClaims,
    embeddedConflicts,
  };

  const bundleHash = hashCanonicalJson(preHashBundlePayload);
  const manifest: DecisionIrManifest = {
    engineId: spec.engineId,
    version: spec.version,
    irSchemaVersion: "dcc-decision-ir/0.1",
    sourceRevision: spec.sourceRevision,
    ruleSetId,
    ruleSetHash,
    dependencyHashes,
    conflictIds: Object.keys(embeddedConflicts).sort(),
    candidateCount: spec.candidates.length,
    ruleCount: compiledRules.length,
    createdAt,
    bundleHash,
  };

  // Prevent mutation of an already-published engine version
  const existingPublished = graph.publishedBundles.get(`${spec.engineId}@${spec.version}`);
  if (existingPublished && existingPublished.bundleHash !== bundleHash) {
    throw new ImmutableVersionMutationError(
      spec.engineId,
      spec.version,
      `Published engine version '${spec.engineId}@${spec.version}' is immutable (existing hash ${existingPublished.bundleHash} != ${bundleHash}). Publish a new semantic version instead.`,
    );
  }

  const tempStorageUri = `dcc-storage://data/memory/snapshots/machine/bundles/${spec.engineId}__${spec.version}__${bundleHash.slice(0, 16)}.json`;

  const bundle: DecisionIrBundle = {
    ...preHashBundlePayload,
    manifest,
    storageUri: tempStorageUri,
    bundleHash,
    stableReferenceUri: `/r/${bundleId}`,
    immutableReferenceUri: `/r/${bundleId}/v/${spec.version}`,
  };

  // Validate compiled bundle against both Zod and published JSON Schema
  const zodValidation = DecisionIrBundleSchema.safeParse(bundle);
  if (!zodValidation.success) {
    throw new CompilerValidationError(
      "BUNDLE_SCHEMA_INVALID",
      `Compiled bundle failed DecisionIrBundleSchema validation: ${zodValidation.error.message}`,
      zodValidation.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    );
  }

  const jsonSchemaValidation = validateAgainstJsonSchema(bundle, DECISION_IR_JSON_SCHEMA);
  if (!jsonSchemaValidation.valid) {
    throw new CompilerValidationError(
      "BUNDLE_JSON_SCHEMA_INVALID",
      `Compiled bundle failed JSON Schema validation: ${jsonSchemaValidation.errors.join("; ")}`,
      jsonSchemaValidation.errors,
    );
  }

  // Persist immutable artifact in existing storage
  writeImmutableArtifact({
    category: "bundles",
    filename: `${spec.engineId}__${spec.version}__${bundleHash.slice(0, 16)}.json`,
    content: canonicalJsonStringify(bundle),
  });

  return {
    bundle,
    ruleSet,
    compiledRules,
  };
}
