import {
  canonicalJsonStringify,
  hashCanonicalJson,
  writeImmutableArtifact,
} from "./cryptoAndStorage";
import {
  CANDIDATE_UNIVERSE_JSON_SCHEMA,
  CandidateUniverseSchema,
  DECISION_IR_JSON_SCHEMA,
  DecisionIrBundleSchema,
  validateAgainstJsonSchema,
  type CandidateUniverse,
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
import { enforceBundleComplexityLimits } from "./securityLimits";

/**
 * DCC Decision IR Compiler v0.2
 *
 * Compiles a declarative engine specification + evidence graph into a canonical,
 * immutable `DecisionIrBundle` (`EngineBundle`) and a versioned, content-addressed
 * `CandidateUniverse` artifact with SHA-256 manifest verification.
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

export type CandidateUniverseDraftSpec = {
  universeId?: string;
  version?: string;
  domainPackVersion?: string;
  temporalScope?: {
    validFrom: string;
    validTo: string;
  };
  inclusionMethodology?: string;
  knownExclusions?: CandidateUniverse["knownExclusions"];
  unresolvedCoverageGaps?: CandidateUniverse["unresolvedCoverageGaps"];
  refreshedAt?: string;
  coverageStatus?: CandidateUniverse["coverageStatus"];
  epistemicDisclaimer?: string;
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
  candidateUniverseSpec?: CandidateUniverseDraftSpec;
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
  candidateUniverse: CandidateUniverse;
} {
  enforceBundleComplexityLimits({
    candidateCount: spec.candidates.length,
    ruleCount: spec.rules.length,
  });

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
  const consultedSourceIds = new Set<string>();

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
    } else {
      consultedSourceIds.add(source.id);
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

  const destinationEntity = graph.entities.get(spec.destinationEntityId)!;
  const createdAt = spec.createdAt ?? "2026-04-20T00:00:00.000Z";

  // Build versioned, content-addressed CandidateUniverse artifact
  const universeId = spec.candidateUniverseSpec?.universeId ?? `univ:${spec.engineId}`;
  const universeVersion = spec.candidateUniverseSpec?.version ?? spec.version;
  const domainPackVersion = spec.candidateUniverseSpec?.domainPackVersion ?? spec.version;
  const temporalScope = spec.candidateUniverseSpec?.temporalScope ?? {
    validFrom: "2026-01-01T00:00:00.000Z",
    validTo: "2027-06-30T23:59:59.000Z",
  };
  const inclusionMethodology =
    spec.candidateUniverseSpec?.inclusionMethodology ??
    `Permitted commercial operators and verified noncommercial/contingency alternatives in ${destinationEntity.canonicalName} (${spec.jurisdiction}) backed by primary regulatory and operator tariff snapshots.`;
  const knownExclusions =
    spec.candidateUniverseSpec?.knownExclusions ??
    (spec.engineId === "juneau-helicopter-tours"
      ? [
          {
            candidateOrOperator:
              "Third-Party Tour Resellers & Specialist Portals (Non-Operator Distribution Channels)",
            reasonCode: "EXCLUDED_NON_OPERATOR_RESELLER_OR_PORTAL_ROLE",
            explanation:
              "Candidate universe evaluates direct FAA Part 135 / USFS Tongass permitted aircraft operators; specialist portals (Juneau Flight Deck, Last Frontier Shore Excursions) and third-party resellers are downstream booking/comparison channels rather than operating carriers.",
          },
          {
            candidateOrOperator: "Unpermitted Part 91 / Private Charter Flights",
            reasonCode: "EXCLUDED_NO_USFS_ICEFIELD_LANDING_PERMIT",
            explanation:
              "Only USFS Tongass permitted commercial helicopter operators (TEMSCO, Coastal, NorthStar) may land commercially on the Juneau Icefield.",
          },
        ]
      : [
          {
            candidateOrOperator: "Unpermitted Peer-to-Peer Boat Rentals",
            reasonCode: "EXCLUDED_NO_DOBOR_COMMERCIAL_SLIP_PERMIT",
            explanation:
              "Excluded because vessels lack State of Hawaiʻi DLNR DOBOR commercial whale-watching permits and USCG inspected passenger certification.",
          },
        ]);
  const unresolvedCoverageGaps =
    spec.candidateUniverseSpec?.unresolvedCoverageGaps ??
    (spec.engineId === "juneau-helicopter-tours"
      ? [
          {
            gapId: "gap:jnu:same-day-ship-allotment-inventory",
            description:
              "Cruise-line shore-excursion desk holdbacks vs direct operator seat inventory fluctuate intraday.",
            impactOnCompleteness:
              "Evaluates structural, regulatory, weight, age, and port-window eligibility across all permitted Juneau Icefield operators, not live seat counts.",
          },
          {
            gapId: "gap:jnu:private-bespoke-part135-charters",
            description:
              "Unpublished bespoke private Part 135 charter configurations outside USFS Tongass Icefield landing allocations are not enumerated.",
            impactOnCompleteness:
              "Commercial icefield landing coverage is complete (all 3 USFS-permitted operators included); bespoke non-icefield charters are outside scope.",
          },
        ]
      : [
          {
            gapId: "gap:hi:small-harbor-private-six-pack-charters",
            description:
              "Independent 6-pack sportfishing boats offering ad-hoc whale watches from secondary slips are not comprehensively indexed.",
            impactOnCompleteness:
              "Universe covers verified primary DOBOR commercial catamaran, raft, and stabilized ship operators plus public NOAA shoreline lookouts.",
          },
          {
            gapId: "gap:hi:live-swell-and-harbor-surge-closures",
            description:
              "Day-of-departure harbor master surge holds at Mala Wharf or Maʻalaea are evaluated structurally rather than via live buoy telemetry.",
            impactOnCompleteness:
              "Applies NOAA/NWS diurnal trade-wind and seasonal humpback presence rules across the declared vessel roster.",
          },
        ]);
  const coverageStatus =
    spec.candidateUniverseSpec?.coverageStatus ??
    (spec.engineId === "juneau-helicopter-tours"
      ? "comprehensive_permitted_roster"
      : "declared_bounded_universe");
  const epistemicDisclaimer =
    spec.candidateUniverseSpec?.epistemicDisclaimer ??
    `Evaluates only the declared CandidateUniverse '${universeId}@${universeVersion}' (${spec.candidates.length} candidates). This engine does NOT claim that these are the only valid options in the world outside this declared universe.`;

  const universePreHash = {
    objectType: "CandidateUniverse" as const,
    universeId,
    version: universeVersion,
    domainPackVersion,
    engineId: spec.engineId,
    engineVersion: spec.version,
    geographicScope: destinationEntity.geographicScope,
    temporalScope,
    inclusionMethodology,
    sourcesConsulted: Array.from(consultedSourceIds).sort(),
    includedCandidateIds: spec.candidates.map((c) => c.candidateId),
    knownExclusions,
    unresolvedCoverageGaps,
    refreshedAt: spec.candidateUniverseSpec?.refreshedAt ?? createdAt,
    coverageStatus,
    epistemicDisclaimer,
  };
  const candidateUniverseHash = hashCanonicalJson(universePreHash);
  const universeStorageUri = `dcc-storage://data/memory/snapshots/machine/universes/${universeId.replace(/:/g, "_")}__${universeVersion}__${candidateUniverseHash.slice(0, 16)}.json`;

  const candidateUniverse: CandidateUniverse = {
    ...universePreHash,
    canonicalHash: candidateUniverseHash,
    storageUri: universeStorageUri,
    stableReferenceUri: `/r/${universeId}`,
    immutableReferenceUri: `/r/${universeId}/v/${universeVersion}`,
  };

  const universeZodCheck = CandidateUniverseSchema.safeParse(candidateUniverse);
  if (!universeZodCheck.success) {
    throw new CompilerValidationError(
      "UNIVERSE_SCHEMA_INVALID",
      `CandidateUniverse failed validation: ${universeZodCheck.error.message}`,
      universeZodCheck.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    );
  }
  const universeJsonCheck = validateAgainstJsonSchema(
    candidateUniverse,
    CANDIDATE_UNIVERSE_JSON_SCHEMA,
  );
  if (!universeJsonCheck.valid) {
    throw new CompilerValidationError(
      "UNIVERSE_JSON_SCHEMA_INVALID",
      `CandidateUniverse failed JSON Schema validation: ${universeJsonCheck.errors.join("; ")}`,
      universeJsonCheck.errors,
    );
  }

  writeImmutableArtifact({
    category: "universes",
    filename: `${universeId.replace(/:/g, "_")}__${universeVersion}__${candidateUniverseHash.slice(0, 16)}.json`,
    content: canonicalJsonStringify(candidateUniverse),
  });

  dependencyHashes[universeId] = candidateUniverseHash;

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
    candidateUniverseId: universeId,
    candidateUniverseVersion: universeVersion,
    candidateUniverseHash,
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
    candidateUniverseId: universeId,
    candidateUniverseVersion: universeVersion,
    candidateUniverseHash,
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
    candidateUniverse,
  };
}
