import {
  CompilerValidationError,
  ImmutableVersionMutationError,
  compileDecisionEngineBundle,
  type EngineCompilationInput,
  type KnowledgeGraphContext,
} from "./compiler";
import {
  canonicalJsonStringify,
  hashCanonicalJson,
} from "./cryptoAndStorage";
import {
  clearSafeEvaluationCache,
  evaluateDecisionIrBundle,
  evaluateDecisionIrBundleBatch,
  type RuntimeEpistemicOverrides,
} from "./irEvaluator";
import {
  type CompactEvaluationResponse,
  type DecisionIrBundle,
  type DecisionIrRule,
  type EpistemicStatus,
  type ExpandedEvaluationResponse,
  type MachineClaim,
  type MachineClaimConflict,
  type MachineClaimVersion,
  type MachineEngine,
  type MachineEngineVersion,
  type MachineEntity,
  type MachineEvaluationTrace,
  type MachineEvidenceFragment,
  type MachineRetraction,
  type MachineRuleSet,
  type MachineSource,
  type MachineSourceSnapshot,
  type ReferenceResolutionEnvelope,
  ReferenceResolutionEnvelopeSchema,
  type TypedClaimValue,
} from "./schemas";
import { buildJuneauAndHawaiiMachineSeed } from "./seedJuneauAndHawaii";

export interface CompilationFailure {
  code: string;
  message: string;
  details: string[];
}

export type CompilationResult =
  | {
      ok: true;
      bundle: DecisionIrBundle;
      ruleSet: MachineRuleSet;
      engineVersion: MachineEngineVersion;
    }
  | {
      ok: false;
      errors: CompilationFailure[];
    };

export interface MachineEvaluationRecord {
  objectType: "Evaluation";
  id: string;
  traceId: string;
  engineId: string;
  engineVersion: string;
  bundleHash: string;
  normalizedInputHash: string;
  resultHash: string;
  traceHash: string;
  decisionState: CompactEvaluationResponse["decisionState"];
  recommendedCandidateId: string | null;
  viableCandidateIds: string[];
  excludedCandidateIds: string[];
  contingencyCandidateIds: string[];
  unknownFields: string[];
  conflictIds: string[];
  withdrawnClaimVersionIds: string[];
  reasonCodes: string[];
  referenceIds: string[];
  immutableReferenceUris: string[];
  evaluatedAt: string;
  stableReferenceUri: string;
  immutableReferenceUri: string;
}

export interface MachineChangeEvent {
  cursor: number;
  eventType:
    | "entity_published"
    | "source_snapshot_ingested"
    | "claim_published"
    | "claim_superseded"
    | "claim_withdrawn"
    | "conflict_opened"
    | "conflict_resolved"
    | "engine_bundle_published"
    | "engine_active_version_changed"
    | "engine_rolled_back";
  objectType: ReferenceResolutionEnvelope["objectType"];
  objectId: string;
  versionId: string;
  summary: string;
  payload: Record<string, unknown>;
  occurredAt: string;
}

export interface ResolvedMachineReferenceResult {
  envelope: ReferenceResolutionEnvelope;
  etag: string;
  lastModified: string;
  cacheControl: string;
  jsonLd: Record<string, unknown>;
  cslJson: Record<string, unknown>;
  html: string;
}

interface MachineKnowledgeStore {
  initializedAt: string;
  entitiesById: Map<string, MachineEntity>;
  entityVersionsByKey: Map<string, MachineEntity>;
  sourcesById: Map<string, MachineSource>;
  sourceVersionsByKey: Map<string, MachineSource>;
  sourceSnapshotsById: Map<string, MachineSourceSnapshot>;
  evidenceFragmentsById: Map<string, MachineEvidenceFragment>;
  claimsById: Map<string, MachineClaim>;
  claimVersionsById: Map<string, MachineClaimVersion>;
  claimConflictsById: Map<string, MachineClaimConflict>;
  rulesById: Map<string, DecisionIrRule>;
  ruleVersionsByKey: Map<string, DecisionIrRule>;
  ruleSetsById: Map<string, MachineRuleSet>;
  ruleSetVersionsByKey: Map<string, MachineRuleSet>;
  enginesById: Map<string, MachineEngine>;
  engineVersionsById: Map<string, MachineEngineVersion>;
  engineVersionsByKey: Map<string, MachineEngineVersion>;
  bundlesById: Map<string, DecisionIrBundle>;
  bundlesByKey: Map<string, DecisionIrBundle>;
  evaluationsById: Map<string, MachineEvaluationRecord>;
  evaluationTracesById: Map<string, MachineEvaluationTrace>;
  retractionsById: Map<string, MachineRetraction>;
  changeEvents: MachineChangeEvent[];
}

let globalMachineStore: MachineKnowledgeStore | null = null;

function appendChangeEvent(
  store: MachineKnowledgeStore,
  event: Omit<MachineChangeEvent, "cursor">,
): MachineChangeEvent {
  const cursor = store.changeEvents.length + 1;
  const record: MachineChangeEvent = {
    cursor,
    ...event,
  };
  store.changeEvents.push(record);
  return record;
}

function buildKnowledgeGraphContext(store: MachineKnowledgeStore): KnowledgeGraphContext {
  return {
    entities: store.entitiesById,
    sources: store.sourcesById,
    sourceSnapshots: store.sourceSnapshotsById,
    evidenceFragments: store.evidenceFragmentsById,
    claimVersions: store.claimVersionsById,
    conflicts: store.claimConflictsById,
    publishedBundles: store.bundlesByKey,
  };
}

function safeCompileEngineBundle(
  spec: EngineCompilationInput,
  graph: KnowledgeGraphContext,
): CompilationResult {
  try {
    const { bundle, ruleSet } = compileDecisionEngineBundle(spec, graph);
    const engineVersion: MachineEngineVersion = {
      objectType: "EngineVersion",
      id: `engv:${spec.engineId}:${spec.version}`,
      engineId: spec.engineId,
      version: spec.version,
      ruleSetId: ruleSet.id,
      sourceRevision: spec.sourceRevision,
      bundleHash: bundle.bundleHash,
      manifest: bundle.manifest,
      status: "verified",
      published_at: bundle.manifest.createdAt,
      stableReferenceUri: `/r/${spec.engineId}`,
      immutableReferenceUri: `/r/${spec.engineId}/v/${spec.version}`,
    };
    return {
      ok: true,
      bundle,
      ruleSet,
      engineVersion,
    };
  } catch (err) {
    if (err instanceof CompilerValidationError) {
      return {
        ok: false,
        errors: [
          {
            code: err.code,
            message: err.message,
            details: err.details,
          },
        ],
      };
    }
    if (err instanceof ImmutableVersionMutationError) {
      return {
        ok: false,
        errors: [
          {
            code: "IMMUTABLE_VERSION_MUTATION_BLOCKED",
            message: err.message,
            details: [`${err.engineId}@${err.version}`],
          },
        ],
      };
    }
    return {
      ok: false,
      errors: [
        {
          code: "COMPILATION_FAILED",
          message: err instanceof Error ? err.message : String(err),
          details: [],
        },
      ],
    };
  }
}

function registerCompiledBundleInStore(
  store: MachineKnowledgeStore,
  spec: EngineCompilationInput,
  compiled: Extract<CompilationResult, { ok: true }>,
  setActive: boolean,
): void {
  const { bundle, ruleSet, engineVersion } = compiled;

  for (const rule of bundle.rules) {
    store.rulesById.set(rule.id, rule);
    store.ruleVersionsByKey.set(`${rule.id}@${rule.version}`, rule);
  }

  store.ruleSetsById.set(ruleSet.id, ruleSet);
  store.ruleSetVersionsByKey.set(`${ruleSet.id}@${ruleSet.version}`, ruleSet);

  store.engineVersionsById.set(engineVersion.id, engineVersion);
  store.engineVersionsByKey.set(`${spec.engineId}@${spec.version}`, engineVersion);

  store.bundlesById.set(bundle.id, bundle);
  store.bundlesByKey.set(`${spec.engineId}@${spec.version}`, bundle);

  const existingEngine = store.enginesById.get(spec.engineId);
  if (!existingEngine) {
    const engine: MachineEngine = {
      objectType: "Engine",
      id: spec.engineId,
      title: spec.title,
      domainCategory: spec.domainCategory,
      destinationEntityId: spec.destinationEntityId,
      activeVersion: spec.version,
      previousActiveVersion: null,
      availableVersions: [spec.version],
      status: "verified",
      activeBundleUri: `/api/v1/bundles/${spec.engineId}/${spec.version}`,
      stableReferenceUri: `/r/${spec.engineId}`,
      immutableReferenceUri: `/r/${spec.engineId}/v/${spec.version}`,
    };
    store.enginesById.set(spec.engineId, engine);
  } else {
    const availableVersions = existingEngine.availableVersions.includes(spec.version)
      ? existingEngine.availableVersions
      : [...existingEngine.availableVersions, spec.version];
    const nextActiveVersion = setActive ? spec.version : existingEngine.activeVersion;
    const prevActive =
      setActive && existingEngine.activeVersion !== spec.version
        ? existingEngine.activeVersion
        : existingEngine.previousActiveVersion;

    const updatedEngine: MachineEngine = {
      ...existingEngine,
      activeVersion: nextActiveVersion,
      previousActiveVersion: prevActive,
      availableVersions,
      activeBundleUri: `/api/v1/bundles/${spec.engineId}/${nextActiveVersion}`,
      immutableReferenceUri: `/r/${spec.engineId}/v/${nextActiveVersion}`,
    };
    store.enginesById.set(spec.engineId, updatedEngine);
  }

  appendChangeEvent(store, {
    eventType: "engine_bundle_published",
    objectType: "EngineBundle",
    objectId: bundle.id,
    versionId: bundle.version,
    summary: `Compiled and published ${spec.engineId}@${spec.version} (bundleHash=${bundle.bundleHash.slice(0, 12)})`,
    payload: {
      engineId: spec.engineId,
      version: spec.version,
      bundleId: bundle.id,
      bundleHash: bundle.bundleHash,
      setActive,
    },
    occurredAt: bundle.manifest.createdAt,
  });
}

function initializeMachineStore(): MachineKnowledgeStore {
  const seed = buildJuneauAndHawaiiMachineSeed();

  const store: MachineKnowledgeStore = {
    initializedAt: "2026-04-12T00:00:00.000Z",
    entitiesById: new Map(),
    entityVersionsByKey: new Map(),
    sourcesById: new Map(),
    sourceVersionsByKey: new Map(),
    sourceSnapshotsById: new Map(),
    evidenceFragmentsById: new Map(),
    claimsById: new Map(),
    claimVersionsById: new Map(),
    claimConflictsById: new Map(),
    rulesById: new Map(),
    ruleVersionsByKey: new Map(),
    ruleSetsById: new Map(),
    ruleSetVersionsByKey: new Map(),
    enginesById: new Map(),
    engineVersionsById: new Map(),
    engineVersionsByKey: new Map(),
    bundlesById: new Map(),
    bundlesByKey: new Map(),
    evaluationsById: new Map(),
    evaluationTracesById: new Map(),
    retractionsById: new Map(),
    changeEvents: [],
  };

  for (const entity of seed.entities) {
    store.entitiesById.set(entity.id, entity);
    store.entityVersionsByKey.set(`${entity.id}@${entity.version}`, entity);
    appendChangeEvent(store, {
      eventType: "entity_published",
      objectType: "Entity",
      objectId: entity.id,
      versionId: entity.version,
      summary: `Published entity ${entity.id} (${entity.canonicalName})`,
      payload: { entityType: entity.entityType, jurisdiction: entity.jurisdiction },
      occurredAt: entity.retrieved_at,
    });
  }

  for (const bundle of seed.sourceBundles) {
    store.sourcesById.set(bundle.source.id, bundle.source);
    store.sourceVersionsByKey.set(`${bundle.source.id}@${bundle.source.version}`, bundle.source);
    store.sourceSnapshotsById.set(bundle.snapshot.id, bundle.snapshot);
    for (const fragment of bundle.fragments) {
      store.evidenceFragmentsById.set(fragment.id, fragment);
    }
    appendChangeEvent(store, {
      eventType: "source_snapshot_ingested",
      objectType: "SourceSnapshot",
      objectId: bundle.snapshot.id,
      versionId: bundle.source.version,
      summary: `Ingested source snapshot ${bundle.snapshot.id} from ${bundle.source.organization}`,
      payload: {
        sourceId: bundle.source.id,
        contentHash: bundle.snapshot.contentHash,
        fragmentCount: bundle.fragments.length,
      },
      occurredAt: bundle.snapshot.retrieved_at,
    });
  }

  for (const pair of seed.claimPairs) {
    store.claimsById.set(pair.claim.id, pair.claim);
    store.claimVersionsById.set(pair.claimVersion.versionId, pair.claimVersion);
    appendChangeEvent(store, {
      eventType: "claim_published",
      objectType: "ClaimVersion",
      objectId: pair.claim.id,
      versionId: pair.claimVersion.versionId,
      summary: `Published claim ${pair.claim.id} (${pair.claim.predicate}) -> ${pair.claimVersion.versionId}`,
      payload: {
        claimId: pair.claim.id,
        versionId: pair.claimVersion.versionId,
        subject: pair.claimVersion.subject,
        predicate: pair.claimVersion.predicate,
        evidenceHash: pair.claimVersion.evidenceHash,
      },
      occurredAt: pair.claimVersion.retrieved_at,
    });
  }

  const graph = buildKnowledgeGraphContext(store);

  const juneauCompiled = safeCompileEngineBundle(seed.juneauCompilationSpec, graph);
  if (!juneauCompiled.ok) {
    throw new Error(
      `Failed to compile seed Juneau Decision IR bundle: ${JSON.stringify(juneauCompiled.errors)}`,
    );
  }
  registerCompiledBundleInStore(store, seed.juneauCompilationSpec, juneauCompiled, true);

  const hawaiiCompiled = safeCompileEngineBundle(seed.hawaiiCompilationSpec, graph);
  if (!hawaiiCompiled.ok) {
    throw new Error(
      `Failed to compile seed Hawaii Decision IR bundle: ${JSON.stringify(hawaiiCompiled.errors)}`,
    );
  }
  registerCompiledBundleInStore(store, seed.hawaiiCompilationSpec, hawaiiCompiled, true);

  return store;
}

export function getMachineStore(): MachineKnowledgeStore {
  if (!globalMachineStore) {
    globalMachineStore = initializeMachineStore();
  }
  return globalMachineStore;
}

export function resetMachineStoreForTests(): MachineKnowledgeStore {
  clearSafeEvaluationCache();
  globalMachineStore = initializeMachineStore();
  return globalMachineStore;
}

export function getRuntimeEpistemicOverrides(nowIso?: string): RuntimeEpistemicOverrides {
  const store = getMachineStore();
  return {
    claimVersions: store.claimVersionsById,
    conflicts: store.claimConflictsById,
    retractions: store.retractionsById,
    entities: store.entitiesById,
    sources: store.sourcesById,
    sourceSnapshots: store.sourceSnapshotsById,
    evidenceFragments: store.evidenceFragmentsById,
    nowIso,
  };
}

// ============================================================================
// Direct Object Getters
// ============================================================================

export function getMachineEntity(id: string): MachineEntity | null {
  return getMachineStore().entitiesById.get(id) ?? null;
}

export function listMachineEntities(): MachineEntity[] {
  return Array.from(getMachineStore().entitiesById.values());
}

export function getMachineSource(id: string): {
  source: MachineSource;
  snapshots: MachineSourceSnapshot[];
  fragments: MachineEvidenceFragment[];
} | null {
  const store = getMachineStore();
  const source = store.sourcesById.get(id);
  if (!source) return null;
  const snapshots = Array.from(store.sourceSnapshotsById.values()).filter(
    (s) => s.sourceId === id,
  );
  const fragments = Array.from(store.evidenceFragmentsById.values()).filter(
    (f) => f.sourceId === id,
  );
  return { source, snapshots, fragments };
}

export function getMachineClaim(id: string): {
  claim: MachineClaim;
  versions: MachineClaimVersion[];
  conflicts: MachineClaimConflict[];
  retractions: MachineRetraction[];
} | null {
  const store = getMachineStore();
  let claim = store.claimsById.get(id);
  if (!claim) {
    const cv = store.claimVersionsById.get(id);
    if (cv) {
      claim = store.claimsById.get(cv.claimId);
    }
  }
  if (!claim) return null;

  const versions = claim.versionHistoryIds
    .map((vid) => store.claimVersionsById.get(vid))
    .filter((v): v is MachineClaimVersion => Boolean(v));
  const conflicts = Array.from(store.claimConflictsById.values()).filter(
    (c) => c.claimId === claim.id,
  );
  const retractions = Array.from(store.retractionsById.values()).filter(
    (r) =>
      r.targetId === claim.id ||
      claim.versionHistoryIds.includes(r.targetVersionId) ||
      claim.versionHistoryIds.includes(r.targetId),
  );
  return { claim, versions, conflicts, retractions };
}

export function getMachineRule(id: string): DecisionIrRule | null {
  return getMachineStore().rulesById.get(id) ?? null;
}

export function getMachineEngine(id: string): {
  engine: MachineEngine;
  versions: MachineEngineVersion[];
  activeBundle: DecisionIrBundle;
} | null {
  const store = getMachineStore();
  const engine = store.enginesById.get(id);
  if (!engine) return null;
  const versions = engine.availableVersions
    .map((ver) => store.engineVersionsByKey.get(`${id}@${ver}`))
    .filter((v): v is MachineEngineVersion => Boolean(v));
  const activeBundle = store.bundlesByKey.get(`${id}@${engine.activeVersion}`);
  if (!activeBundle) return null;
  return { engine, versions, activeBundle };
}

export function listMachineEngines(): MachineEngine[] {
  return Array.from(getMachineStore().enginesById.values());
}

export function getMachineBundle(engineId: string, version?: string): DecisionIrBundle | null {
  const store = getMachineStore();
  const engine = store.enginesById.get(engineId);
  const resolvedVersion = version && version !== "active" ? version : engine?.activeVersion;
  if (!resolvedVersion) return null;
  return store.bundlesByKey.get(`${engineId}@${resolvedVersion}`) ?? null;
}

export function getMachineChangesSince(sinceCursor = 0, limit = 100): {
  sinceCursor: number;
  nextCursor: number;
  hasMore: boolean;
  events: MachineChangeEvent[];
} {
  const store = getMachineStore();
  const filtered = store.changeEvents.filter((ev) => ev.cursor > sinceCursor);
  const sliced = filtered.slice(0, limit);
  const nextCursor =
    sliced.length > 0 ? sliced[sliced.length - 1].cursor : sinceCursor;
  return {
    sinceCursor,
    nextCursor,
    hasMore: filtered.length > sliced.length,
    events: sliced,
  };
}

// ============================================================================
// Evaluation & Batch Evaluation Entrypoints (Persists Trace & Reference IDs)
// ============================================================================

export function evaluateMachineEngine(params: {
  engineId: string;
  engineVersion?: string;
  inputs: Record<string, unknown>;
  mode?: "compact" | "expanded";
  evaluatedAt?: string;
  bypassCache?: boolean;
}):
  | { ok: true; response: CompactEvaluationResponse | ExpandedEvaluationResponse }
  | { ok: false; status: number; error: string; code: string } {
  const store = getMachineStore();
  const engine = store.enginesById.get(params.engineId);
  if (!engine) {
    return {
      ok: false,
      status: 404,
      code: "ENGINE_NOT_FOUND",
      error: `Decision engine "${params.engineId}" does not exist.`,
    };
  }

  const pinnedVersionRequested = Boolean(
    params.engineVersion && params.engineVersion !== "active",
  );
  const targetVersion = pinnedVersionRequested
    ? params.engineVersion!
    : engine.activeVersion;

  const bundle = store.bundlesByKey.get(`${params.engineId}@${targetVersion}`);
  if (!bundle) {
    return {
      ok: false,
      status: 404,
      code: "ENGINE_VERSION_NOT_FOUND",
      error: `Decision engine "${params.engineId}" version "${targetVersion}" does not exist. Available versions: ${engine.availableVersions.join(", ")}`,
    };
  }

  let expanded: ExpandedEvaluationResponse;
  try {
    expanded = evaluateDecisionIrBundle({
      bundle,
      input: params.inputs,
      mode: "expanded",
      pinnedVersionRequested,
      overrides: getRuntimeEpistemicOverrides(params.evaluatedAt),
      bypassCache: params.bypassCache,
    }) as ExpandedEvaluationResponse;
  } catch (err) {
    return {
      ok: false,
      status: 400,
      code: "INVALID_EVALUATION_INPUT",
      error: err instanceof Error ? err.message : String(err),
    };
  }

  const evalRecord: MachineEvaluationRecord = {
    objectType: "Evaluation",
    id: expanded.evaluationId,
    traceId: expanded.traceId,
    engineId: expanded.engineId,
    engineVersion: expanded.engineVersion,
    bundleHash: expanded.bundleHash,
    normalizedInputHash: expanded.normalizedInputHash,
    resultHash: expanded.resultHash,
    traceHash: expanded.traceHash,
    decisionState: expanded.decisionState,
    recommendedCandidateId: expanded.recommendedCandidateId,
    viableCandidateIds: expanded.viableCandidates.map((c) => c.candidateId),
    excludedCandidateIds: expanded.excludedCandidates.map((c) => c.candidateId),
    contingencyCandidateIds: expanded.contingencyCandidates.map((c) => c.candidateId),
    unknownFields: expanded.unknownFields,
    conflictIds: expanded.conflictIds,
    withdrawnClaimVersionIds: expanded.withdrawnClaimVersionIds,
    reasonCodes: expanded.reasonCodes,
    referenceIds: expanded.referenceIds,
    immutableReferenceUris: expanded.immutableReferenceUris,
    evaluatedAt: expanded.evaluatedAt,
    stableReferenceUri: `/r/${expanded.evaluationId}`,
    immutableReferenceUri: `/r/${expanded.evaluationId}/v/1`,
  };

  store.evaluationsById.set(evalRecord.id, evalRecord);
  store.evaluationTracesById.set(expanded.trace.id, expanded.trace);

  if (params.mode === "expanded") {
    return { ok: true, response: expanded };
  }

  const { trace: _trace, provenanceGraph: _graph, ...compactRest } = expanded;
  const compact: CompactEvaluationResponse = {
    ...compactRest,
    mode: "compact",
  };
  return { ok: true, response: compact };
}

export function evaluateMachineEngineBatch(params: {
  items: Array<{
    requestId?: string;
    engineId: string;
    engineVersion?: string;
    inputs: Record<string, unknown>;
    mode?: "compact" | "expanded";
  }>;
  evaluatedAt?: string;
}): {
  ok: true;
  batchSize: number;
  results: Array<{
    requestId: string;
    ok: boolean;
    evaluation?: CompactEvaluationResponse | ExpandedEvaluationResponse;
    error?: { code: string; message: string };
  }>;
} {
  const results = params.items.map((item, idx) => {
    const requestId = item.requestId ?? `req_${idx + 1}`;
    const res = evaluateMachineEngine({
      engineId: item.engineId,
      engineVersion: item.engineVersion,
      inputs: item.inputs,
      mode: item.mode ?? "compact",
      evaluatedAt: params.evaluatedAt,
    });
    if (!res.ok) {
      return {
        requestId,
        ok: false,
        error: { code: res.code, message: res.error },
      };
    }
    return {
      requestId,
      ok: true,
      evaluation: res.response,
    };
  });

  void evaluateDecisionIrBundleBatch;

  return {
    ok: true,
    batchSize: results.length,
    results,
  };
}

// ============================================================================
// Epistemic Lifecycle Mutations: Supersession, Withdrawal, Conflicts, Rollback
// ============================================================================

export function supersedeMachineClaim(params: {
  claimId: string;
  newTypedValue: TypedClaimValue;
  newValidFrom?: string;
  newValidTo?: string | null;
  newSupportingExcerpt?: string;
  reason: string;
  issuedBy: string;
  occurredAt?: string;
}): {
  claim: MachineClaim;
  previousVersion: MachineClaimVersion;
  newVersion: MachineClaimVersion;
  retraction: MachineRetraction;
} {
  const store = getMachineStore();
  const claim = store.claimsById.get(params.claimId);
  if (!claim) {
    throw new Error(`Cannot supersede unknown claimId "${params.claimId}"`);
  }

  const prevVersion = store.claimVersionsById.get(claim.currentVersionId);
  if (!prevVersion) {
    throw new Error(`Current claim version "${claim.currentVersionId}" missing from store`);
  }

  const occurredAt = params.occurredAt ?? new Date().toISOString();
  const nextVersionNumber = prevVersion.versionNumber + 1;
  const baseSlug = params.claimId.replace(/^clm:/, "");
  const newVersionId = `clmv:${baseSlug}:v${nextVersionNumber}`;

  const updatedSupportingFragment = {
    ...prevVersion.supportingFragment,
    verbatimExcerpt:
      params.newSupportingExcerpt ?? prevVersion.supportingFragment.verbatimExcerpt,
    structuredValue: params.newTypedValue.value,
  };

  const evidenceHash = hashCanonicalJson({
    claimId: params.claimId,
    versionId: newVersionId,
    subject: prevVersion.subject,
    predicate: prevVersion.predicate,
    typedValue: params.newTypedValue,
    sourceSnapshotId: prevVersion.sourceSnapshotId,
    evidenceFragmentId: prevVersion.evidenceFragmentId,
    verbatimExcerpt: updatedSupportingFragment.verbatimExcerpt,
  });

  const newVersion: MachineClaimVersion = {
    ...prevVersion,
    versionId: newVersionId,
    versionNumber: nextVersionNumber,
    typedValue: params.newTypedValue,
    valid_from: params.newValidFrom ?? occurredAt,
    valid_to: params.newValidTo !== undefined ? params.newValidTo : prevVersion.valid_to,
    observed_at: occurredAt,
    retrieved_at: occurredAt,
    status: "verified",
    supportingFragment: updatedSupportingFragment,
    evidenceHash,
    supersededByVersionId: null,
    supersedesVersionId: prevVersion.versionId,
    retractionId: null,
    withdrawalInfo: null,
    stableReferenceUri: `/r/${params.claimId}`,
    immutableReferenceUri: `/r/${newVersionId}/v/${nextVersionNumber}`,
  };

  const retractionId = `ret:${baseSlug}:superseded-v${prevVersion.versionNumber}`;
  const retractionCore = {
    objectType: "RetractionOrWithdrawal" as const,
    id: retractionId,
    version: "1.0.0",
    targetType: "claim_version" as const,
    targetId: params.claimId,
    targetVersionId: prevVersion.versionId,
    action: "superseded" as const,
    reason: params.reason,
    replacementVersionId: newVersionId,
    issuedBy: params.issuedBy,
    occurred_at: occurredAt,
    stableReferenceUri: `/r/${retractionId}`,
    immutableReferenceUri: `/r/${retractionId}/v/1.0.0`,
  };
  const retraction: MachineRetraction = {
    ...retractionCore,
    contentHash: hashCanonicalJson(retractionCore),
  };

  const supersededPrevVersion: MachineClaimVersion = {
    ...prevVersion,
    status: "superseded",
    supersededByVersionId: newVersionId,
    retractionId,
  };

  const updatedClaim: MachineClaim = {
    ...claim,
    currentVersionId: newVersionId,
    status: "verified",
    versionHistoryIds: [...claim.versionHistoryIds, newVersionId],
    currentVersion: newVersion,
    immutableReferenceUri: `/r/${params.claimId}/v/${newVersionId}`,
  };

  store.claimVersionsById.set(prevVersion.versionId, supersededPrevVersion);
  store.claimVersionsById.set(newVersionId, newVersion);
  store.claimsById.set(claim.id, updatedClaim);
  store.retractionsById.set(retraction.id, retraction);

  clearSafeEvaluationCache();

  appendChangeEvent(store, {
    eventType: "claim_superseded",
    objectType: "ClaimVersion",
    objectId: claim.id,
    versionId: newVersionId,
    summary: `Superseded ${prevVersion.versionId} with ${newVersionId}: ${params.reason}`,
    payload: {
      claimId: claim.id,
      previousVersionId: prevVersion.versionId,
      newVersionId,
      retractionId,
      reason: params.reason,
    },
    occurredAt,
  });

  return {
    claim: updatedClaim,
    previousVersion: supersededPrevVersion,
    newVersion,
    retraction,
  };
}

export function withdrawMachineClaimVersion(params: {
  claimVersionId: string;
  reason: string;
  issuedBy: string;
  occurredAt?: string;
}): {
  withdrawnVersion: MachineClaimVersion;
  claim: MachineClaim;
  retraction: MachineRetraction;
} {
  const store = getMachineStore();
  const targetVersion = store.claimVersionsById.get(params.claimVersionId);
  if (!targetVersion) {
    throw new Error(`ClaimVersion "${params.claimVersionId}" not found`);
  }
  const claim = store.claimsById.get(targetVersion.claimId);
  if (!claim) {
    throw new Error(`Parent claim "${targetVersion.claimId}" not found`);
  }

  const occurredAt = params.occurredAt ?? new Date().toISOString();
  const slug = params.claimVersionId.replace(/^clmv:/, "").replace(/:/g, "-");
  const retractionId = `ret:withdraw:${slug}`;
  const retractionCore = {
    objectType: "RetractionOrWithdrawal" as const,
    id: retractionId,
    version: "1.0.0",
    targetType: "claim_version" as const,
    targetId: claim.id,
    targetVersionId: targetVersion.versionId,
    action: "withdrawn" as const,
    reason: params.reason,
    replacementVersionId: null,
    issuedBy: params.issuedBy,
    occurred_at: occurredAt,
    stableReferenceUri: `/r/${retractionId}`,
    immutableReferenceUri: `/r/${retractionId}/v/1.0.0`,
  };
  const retraction: MachineRetraction = {
    ...retractionCore,
    contentHash: hashCanonicalJson(retractionCore),
  };

  const withdrawnVersion: MachineClaimVersion = {
    ...targetVersion,
    status: "withdrawn",
    retractionId,
    withdrawalInfo: {
      withdrawnAt: occurredAt,
      reason: params.reason,
      issuedBy: params.issuedBy,
      retractionId,
    },
  };

  store.claimVersionsById.set(withdrawnVersion.versionId, withdrawnVersion);
  store.retractionsById.set(retraction.id, retraction);

  const updatedClaim: MachineClaim =
    claim.currentVersionId === withdrawnVersion.versionId
      ? {
          ...claim,
          status: "withdrawn",
          currentVersion: withdrawnVersion,
        }
      : claim;
  store.claimsById.set(claim.id, updatedClaim);

  clearSafeEvaluationCache();

  appendChangeEvent(store, {
    eventType: "claim_withdrawn",
    objectType: "RetractionOrWithdrawal",
    objectId: retraction.id,
    versionId: withdrawnVersion.versionId,
    summary: `Withdrew claim version ${withdrawnVersion.versionId}: ${params.reason}`,
    payload: {
      claimId: claim.id,
      claimVersionId: withdrawnVersion.versionId,
      retractionId: retraction.id,
      reason: params.reason,
      issuedBy: params.issuedBy,
    },
    occurredAt,
  });

  return {
    withdrawnVersion,
    claim: updatedClaim,
    retraction,
  };
}

export function openMachineClaimConflict(params: {
  id: string;
  claimId: string;
  claimVersionIds: string[];
  conflictType: MachineClaimConflict["conflictType"];
  summary: string;
  resolutionPolicy: MachineClaimConflict["resolutionPolicy"];
  winningClaimVersionId?: string | null;
  detectedAt?: string;
}): MachineClaimConflict {
  const store = getMachineStore();
  const claim = store.claimsById.get(params.claimId);
  if (!claim) {
    throw new Error(`Claim "${params.claimId}" not found`);
  }

  const detectedAt = params.detectedAt ?? new Date().toISOString();
  const core = {
    objectType: "ClaimConflict" as const,
    id: params.id,
    version: "1.0.0",
    claimId: params.claimId,
    claimVersionIds: params.claimVersionIds,
    subjectId: claim.subjectId,
    predicate: claim.predicate,
    conflictType: params.conflictType,
    status: "disputed" as const,
    summary: params.summary,
    resolutionPolicy: params.resolutionPolicy,
    winningClaimVersionId: params.winningClaimVersionId ?? null,
    detected_at: detectedAt,
    resolved_at: null,
    stableReferenceUri: `/r/${params.id}`,
    immutableReferenceUri: `/r/${params.id}/v/1.0.0`,
  };
  const conflict: MachineClaimConflict = {
    ...core,
    contentHash: hashCanonicalJson(core),
  };

  store.claimConflictsById.set(conflict.id, conflict);

  for (const cvId of params.claimVersionIds) {
    const cv = store.claimVersionsById.get(cvId);
    if (cv) {
      const updatedCv: MachineClaimVersion = {
        ...cv,
        status: "disputed",
        conflictingClaimVersionIds: Array.from(
          new Set([...cv.conflictingClaimVersionIds, ...params.claimVersionIds.filter((id) => id !== cvId)]),
        ),
      };
      store.claimVersionsById.set(cvId, updatedCv);
      if (claim.currentVersionId === cvId) {
        store.claimsById.set(claim.id, {
          ...claim,
          status: "disputed",
          hasOpenConflict: true,
          currentVersion: updatedCv,
        });
      }
    }
  }

  clearSafeEvaluationCache();

  appendChangeEvent(store, {
    eventType: "conflict_opened",
    objectType: "ClaimConflict",
    objectId: conflict.id,
    versionId: conflict.version,
    summary: `Opened conflict ${conflict.id} on ${params.claimId}: ${params.summary}`,
    payload: {
      conflictId: conflict.id,
      claimId: params.claimId,
      claimVersionIds: params.claimVersionIds,
      resolutionPolicy: params.resolutionPolicy,
    },
    occurredAt: detectedAt,
  });

  return conflict;
}

export function publishMachineEngineBundle(
  spec: EngineCompilationInput,
  setActive = true,
): CompilationResult {
  const store = getMachineStore();
  const result = safeCompileEngineBundle(spec, buildKnowledgeGraphContext(store));

  if (!result.ok) {
    return result;
  }

  registerCompiledBundleInStore(store, spec, result, setActive);
  clearSafeEvaluationCache();
  return result;
}

export function rollbackMachineEngineVersion(
  engineId: string,
  targetVersion?: string,
): { ok: true; engine: MachineEngine } | { ok: false; error: string } {
  const store = getMachineStore();
  const engine = store.enginesById.get(engineId);
  if (!engine) {
    return { ok: false, error: `Engine "${engineId}" not found.` };
  }
  const rollbackTo = targetVersion ?? engine.previousActiveVersion;
  if (!rollbackTo) {
    return {
      ok: false,
      error: `Engine "${engineId}" has no previousActiveVersion to roll back to.`,
    };
  }
  if (!engine.availableVersions.includes(rollbackTo)) {
    return {
      ok: false,
      error: `Target version "${rollbackTo}" is not available on engine "${engineId}".`,
    };
  }

  const updated: MachineEngine = {
    ...engine,
    previousActiveVersion: engine.activeVersion,
    activeVersion: rollbackTo,
    activeBundleUri: `/api/v1/bundles/${engineId}/${rollbackTo}`,
    immutableReferenceUri: `/r/${engineId}/v/${rollbackTo}`,
  };
  store.enginesById.set(engineId, updated);
  clearSafeEvaluationCache();

  appendChangeEvent(store, {
    eventType: "engine_rolled_back",
    objectType: "Engine",
    objectId: engineId,
    versionId: rollbackTo,
    summary: `Rolled back ${engineId} active version from ${engine.activeVersion} to ${rollbackTo}`,
    payload: {
      engineId,
      fromVersion: engine.activeVersion,
      toVersion: rollbackTo,
    },
    occurredAt: new Date().toISOString(),
  });

  return { ok: true, engine: updated };
}

// ============================================================================
// Universal Reference Resolver (/r/{id} and /r/{id}/v/{version})
// ============================================================================

function toHttpLastModified(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return new Date("2026-04-12T00:00:00.000Z").toUTCString();
  }
  return parsed.toUTCString();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildProjectionsForEnvelope(
  envelope: ReferenceResolutionEnvelope,
): ResolvedMachineReferenceResult {
  const validated = ReferenceResolutionEnvelopeSchema.parse(envelope);
  const etag = `"sha256-${validated.contentHash.slice(0, 32)}"`;
  const lastModified = toHttpLastModified(validated.retrievalDate);
  const cacheControl =
    validated.resolutionMode === "immutable_version"
      ? "public, max-age=31536000, immutable"
      : "public, max-age=60, must-revalidate";

  const jsonLd: Record<string, unknown> = {
    "@context": [
      "https://schema.org",
      {
        prov: "http://www.w3.org/ns/prov#",
        dcc: "https://www.destinationcommandcenter.com/ns/machine/v0.1#",
      },
    ],
    "@id": `https://www.destinationcommandcenter.com${validated.canonicalCitationUri}`,
    "@type": [`dcc:${validated.objectType}`, "CreativeWork"],
    identifier: validated.referenceId,
    version: validated.immutableVersion,
    "dcc:resolutionMode": validated.resolutionMode,
    "dcc:epistemicStatus": validated.currentStatus,
    "dcc:contentHash": validated.contentHash,
    "dcc:stableAliasUri": `https://www.destinationcommandcenter.com${validated.stableAliasUri}`,
    "dcc:canonicalCitationUri": `https://www.destinationcommandcenter.com${validated.canonicalCitationUri}`,
    dateModified: validated.retrievalDate,
    isBasedOn: validated.sourceMetadata.canonicalSourceUrl ?? undefined,
    publisher: validated.sourceMetadata.organization
      ? {
          "@type": "Organization",
          name: validated.sourceMetadata.organization,
        }
      : {
          "@type": "Organization",
          name: "Destination Command Center Machine Fabric",
        },
    "dcc:validityDates": validated.validityDates,
    "dcc:evidenceLocation": validated.evidenceLocation,
    "dcc:supersessionOrWithdrawal": validated.supersessionOrWithdrawal,
    "dcc:connectedReferences": validated.connectedReferences,
    "dcc:payload": validated.payload,
  };

  const cslJson: Record<string, unknown> = {
    id: `${validated.referenceId}@${validated.immutableVersion}`,
    type: "dataset",
    title: `DCC ${validated.objectType} ${validated.referenceId} (v${validated.immutableVersion})`,
    author: [
      {
        literal:
          validated.sourceMetadata.organization ??
          "Destination Command Center Machine Layer",
      },
    ],
    issued: {
      "date-parts": [[2026, 4, 12]],
    },
    accessed: {
      "date-parts": [[2026, 4, 12]],
    },
    version: validated.immutableVersion,
    URL: `https://www.destinationcommandcenter.com${validated.canonicalCitationUri}`,
    note: `Status: ${validated.currentStatus}. SHA-256: ${validated.contentHash}`,
  };

  const statusBanner = validated.supersessionOrWithdrawal.isWithdrawn
    ? `<div style="background:#450a0a;border:1px solid #ef4444;color:#fecaca;padding:12px;border-radius:6px;margin-bottom:16px;">
         <strong>WITHDRAWN / RETRACTED:</strong> This object version is withdrawn (${escapeHtml(
           validated.supersessionOrWithdrawal.withdrawalReason ?? "Withdrawn",
         )}). Retraction ID: <code>${escapeHtml(
        validated.supersessionOrWithdrawal.retractionId ?? "",
      )}</code>
       </div>`
    : validated.supersessionOrWithdrawal.isSuperseded
      ? `<div style="background:#422006;border:1px solid #f59e0b;color:#fde68a;padding:12px;border-radius:6px;margin-bottom:16px;">
           <strong>SUPERSEDED VERSION:</strong> This immutable historical version has been superseded by <a style="color:#fcd34d;" href="${escapeHtml(
             validated.supersessionOrWithdrawal.supersededByUri ?? "#",
           )}"><code>${escapeHtml(
          validated.supersessionOrWithdrawal.supersededByVersionId ?? "",
        )}</code></a>.
         </div>`
      : "";

  const connectedHtml = validated.connectedReferences
    .map(
      (ref) =>
        `<li><strong>${escapeHtml(ref.relation)}:</strong> <a href="${escapeHtml(
          ref.immutableUri ?? ref.stableUri,
        )}"><code>${escapeHtml(ref.targetId)}</code></a> (<a href="${escapeHtml(
          ref.stableUri,
        )}">stable</a>)</li>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>DCC Reference ${escapeHtml(validated.referenceId)} (v${escapeHtml(validated.immutableVersion)})</title>
  <style>
    body { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; background: #090d16; color: #e2e8f0; padding: 24px; max-width: 980px; margin: 0 auto; line-height: 1.5; }
    a { color: #38bdf8; }
    pre { background: #111827; border: 1px solid #1f2937; padding: 14px; border-radius: 6px; overflow-x: auto; font-size: 12px; }
    .meta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px; margin-bottom: 16px; }
    .card { background: #111827; border: 1px solid #1e293b; padding: 12px; border-radius: 6px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; background: #1e293b; font-weight: bold; }
  </style>
</head>
<body>
  <h1>DCC Machine Reference: <code>${escapeHtml(validated.referenceId)}</code></h1>
  ${statusBanner}
  <div class="meta-grid">
    <div class="card">
      <div><strong>Object Type:</strong> <span class="badge">${escapeHtml(validated.objectType)}</span></div>
      <div><strong>Epistemic Status:</strong> <span class="badge">${escapeHtml(validated.currentStatus)}</span></div>
      <div><strong>Resolution Mode:</strong> <code>${escapeHtml(validated.resolutionMode)}</code></div>
      <div><strong>Immutable Version:</strong> <code>${escapeHtml(validated.immutableVersion)}</code></div>
    </div>
    <div class="card">
      <div><strong>Canonical Citation URI:</strong> <a href="${escapeHtml(validated.canonicalCitationUri)}"><code>${escapeHtml(validated.canonicalCitationUri)}</code></a></div>
      <div><strong>Stable Alias URI:</strong> <a href="${escapeHtml(validated.stableAliasUri)}"><code>${escapeHtml(validated.stableAliasUri)}</code></a></div>
      <div><strong>Content Hash:</strong> <code>${escapeHtml(validated.contentHash)}</code></div>
      <div><strong>Retrieved At:</strong> <code>${escapeHtml(validated.retrievalDate)}</code></div>
    </div>
  </div>
  ${
    validated.evidenceLocation.verbatimExcerpt
      ? `<div class="card" style="margin-bottom:16px;">
           <strong>Verbatim Evidence Excerpt (${escapeHtml(validated.evidenceLocation.locator ?? "")}):</strong>
           <blockquote>${escapeHtml(validated.evidenceLocation.verbatimExcerpt)}</blockquote>
         </div>`
      : ""
  }
  <h2>Connected Provenance References</h2>
  <ul>${connectedHtml || "<li>None</li>"}</ul>
  <h2>Canonical Machine Payload (JSON)</h2>
  <pre>${escapeHtml(JSON.stringify(validated, null, 2))}</pre>
</body>
</html>`;

  return {
    envelope: validated,
    etag,
    lastModified,
    cacheControl,
    jsonLd,
    cslJson,
    html,
  };
}

export function resolveMachineReference(
  rawId: string,
  rawVersion?: string,
): ResolvedMachineReferenceResult | null {
  const store = getMachineStore();
  const id = decodeURIComponent(rawId);
  const version = rawVersion ? decodeURIComponent(rawVersion) : undefined;
  const resolutionMode: ReferenceResolutionEnvelope["resolutionMode"] = version
    ? "immutable_version"
    : "stable_alias";

  // 1. ClaimVersion (`clmv:...`)
  if (store.claimVersionsById.has(id)) {
    const cv = store.claimVersionsById.get(id)!;
    if (
      version &&
      version !== String(cv.versionNumber) &&
      version !== `v${cv.versionNumber}` &&
      version !== cv.versionId
    ) {
      return null;
    }
    const snapshot = store.sourceSnapshotsById.get(cv.sourceSnapshotId);
    return buildProjectionsForEnvelope({
      spec: "dcc-reference-envelope/0.1",
      referenceId: cv.versionId,
      resolutionMode,
      objectType: "ClaimVersion",
      currentStatus: cv.status,
      immutableVersion: String(cv.versionNumber),
      canonicalCitationUri: `/r/${cv.versionId}/v/${cv.versionNumber}`,
      stableAliasUri: `/r/${cv.claimId}`,
      sourceMetadata: {
        sourceId: cv.sourceId,
        organization: cv.sourceOrganization,
        canonicalSourceUrl: cv.canonicalSourceUrl,
        sourceSnapshotId: cv.sourceSnapshotId,
        artifactStorageUri: snapshot?.artifactStorageUri ?? null,
        licenseOrReuseStatus: cv.licenseOrReuseStatus,
        retrievalMethod: cv.retrievalMethod,
      },
      evidenceLocation: {
        evidenceFragmentId: cv.evidenceFragmentId,
        locator: cv.supportingFragment.locator,
        verbatimExcerpt: cv.supportingFragment.verbatimExcerpt,
      },
      validityDates: {
        valid_from: cv.valid_from,
        valid_to: cv.valid_to,
        observed_at: cv.observed_at,
      },
      retrievalDate: cv.retrieved_at,
      contentHash: cv.evidenceHash,
      supersessionOrWithdrawal: {
        isSuperseded: cv.status === "superseded" || Boolean(cv.supersededByVersionId),
        supersededByVersionId: cv.supersededByVersionId,
        supersededByUri: cv.supersededByVersionId ? `/r/${cv.supersededByVersionId}` : null,
        supersedesVersionId: cv.supersedesVersionId,
        isWithdrawn: cv.status === "withdrawn" || Boolean(cv.withdrawalInfo),
        retractionId: cv.retractionId,
        withdrawalReason: cv.withdrawalInfo?.reason ?? null,
        withdrawnAt: cv.withdrawalInfo?.withdrawnAt ?? null,
      },
      connectedReferences: [
        {
          relation: "parent_claim",
          targetId: cv.claimId,
          stableUri: `/r/${cv.claimId}`,
          immutableUri: `/r/${cv.claimId}/v/${cv.versionId}`,
        },
        {
          relation: "subject_entity",
          targetId: cv.subject,
          stableUri: `/r/${cv.subject}`,
          immutableUri: `/r/${cv.subject}/v/1.0.0`,
        },
        {
          relation: "evidence_fragment",
          targetId: cv.evidenceFragmentId,
          stableUri: `/r/${cv.evidenceFragmentId}`,
          immutableUri: `/r/${cv.evidenceFragmentId}/v/1`,
        },
        {
          relation: "source_snapshot",
          targetId: cv.sourceSnapshotId,
          stableUri: `/r/${cv.sourceSnapshotId}`,
          immutableUri: `/r/${cv.sourceSnapshotId}/v/1`,
        },
        {
          relation: "source",
          targetId: cv.sourceId,
          stableUri: `/r/${cv.sourceId}`,
          immutableUri: `/r/${cv.sourceId}/v/1.0.0`,
        },
        ...(cv.supersededByVersionId
          ? [
              {
                relation: "superseded_by",
                targetId: cv.supersededByVersionId,
                stableUri: `/r/${cv.supersededByVersionId}`,
              },
            ]
          : []),
        ...(cv.retractionId
          ? [
              {
                relation: "retraction_record",
                targetId: cv.retractionId,
                stableUri: `/r/${cv.retractionId}`,
                immutableUri: `/r/${cv.retractionId}/v/1.0.0`,
              },
            ]
          : []),
      ],
      payload: cv as unknown as Record<string, unknown>,
    });
  }

  // 2. Claim (`clm:...`)
  if (store.claimsById.has(id)) {
    const claim = store.claimsById.get(id)!;
    let targetCv: MachineClaimVersion | undefined;

    if (!version) {
      targetCv = claim.currentVersion;
    } else {
      targetCv = store.claimVersionsById.get(version);
      if (!targetCv || targetCv.claimId !== claim.id) {
        const normalizedNum = Number(version.replace(/^v/i, ""));
        if (!Number.isNaN(normalizedNum)) {
          for (const vid of claim.versionHistoryIds) {
            const candidate = store.claimVersionsById.get(vid);
            if (candidate && candidate.versionNumber === normalizedNum) {
              targetCv = candidate;
              break;
            }
          }
        }
      }
    }

    if (!targetCv) return null;
    const snapshot = store.sourceSnapshotsById.get(targetCv.sourceSnapshotId);

    return buildProjectionsForEnvelope({
      spec: "dcc-reference-envelope/0.1",
      referenceId: claim.id,
      resolutionMode,
      objectType: version ? "ClaimVersion" : "Claim",
      currentStatus: targetCv.status,
      immutableVersion: targetCv.versionId,
      canonicalCitationUri: `/r/${claim.id}/v/${targetCv.versionId}`,
      stableAliasUri: `/r/${claim.id}`,
      sourceMetadata: {
        sourceId: targetCv.sourceId,
        organization: targetCv.sourceOrganization,
        canonicalSourceUrl: targetCv.canonicalSourceUrl,
        sourceSnapshotId: targetCv.sourceSnapshotId,
        artifactStorageUri: snapshot?.artifactStorageUri ?? null,
        licenseOrReuseStatus: targetCv.licenseOrReuseStatus,
        retrievalMethod: targetCv.retrievalMethod,
      },
      evidenceLocation: {
        evidenceFragmentId: targetCv.evidenceFragmentId,
        locator: targetCv.supportingFragment.locator,
        verbatimExcerpt: targetCv.supportingFragment.verbatimExcerpt,
      },
      validityDates: {
        valid_from: targetCv.valid_from,
        valid_to: targetCv.valid_to,
        observed_at: targetCv.observed_at,
      },
      retrievalDate: targetCv.retrieved_at,
      contentHash: targetCv.evidenceHash,
      supersessionOrWithdrawal: {
        isSuperseded:
          targetCv.status === "superseded" || Boolean(targetCv.supersededByVersionId),
        supersededByVersionId: targetCv.supersededByVersionId,
        supersededByUri: targetCv.supersededByVersionId
          ? `/r/${claim.id}/v/${targetCv.supersededByVersionId}`
          : null,
        supersedesVersionId: targetCv.supersedesVersionId,
        isWithdrawn: targetCv.status === "withdrawn" || Boolean(targetCv.withdrawalInfo),
        retractionId: targetCv.retractionId,
        withdrawalReason: targetCv.withdrawalInfo?.reason ?? null,
        withdrawnAt: targetCv.withdrawalInfo?.withdrawnAt ?? null,
      },
      connectedReferences: [
        {
          relation: "current_claim_version",
          targetId: claim.currentVersionId,
          stableUri: `/r/${claim.currentVersionId}`,
          immutableUri: `/r/${claim.currentVersionId}/v/${claim.currentVersion.versionNumber}`,
        },
        {
          relation: "resolved_claim_version",
          targetId: targetCv.versionId,
          stableUri: `/r/${targetCv.versionId}`,
          immutableUri: `/r/${targetCv.versionId}/v/${targetCv.versionNumber}`,
        },
        {
          relation: "evidence_fragment",
          targetId: targetCv.evidenceFragmentId,
          stableUri: `/r/${targetCv.evidenceFragmentId}`,
          immutableUri: `/r/${targetCv.evidenceFragmentId}/v/1`,
        },
        {
          relation: "source_snapshot",
          targetId: targetCv.sourceSnapshotId,
          stableUri: `/r/${targetCv.sourceSnapshotId}`,
          immutableUri: `/r/${targetCv.sourceSnapshotId}/v/1`,
        },
        {
          relation: "source",
          targetId: targetCv.sourceId,
          stableUri: `/r/${targetCv.sourceId}`,
          immutableUri: `/r/${targetCv.sourceId}/v/1.0.0`,
        },
      ],
      payload: (version ? targetCv : claim) as unknown as Record<string, unknown>,
    });
  }

  // 3. EvidenceFragment (`frag:...`)
  if (store.evidenceFragmentsById.has(id)) {
    const frag = store.evidenceFragmentsById.get(id)!;
    if (version && version !== "1" && version !== "1.0.0" && version !== "v1") {
      return null;
    }
    const source = store.sourcesById.get(frag.sourceId);
    const snapshot = store.sourceSnapshotsById.get(frag.snapshotId);
    return buildProjectionsForEnvelope({
      spec: "dcc-reference-envelope/0.1",
      referenceId: frag.id,
      resolutionMode,
      objectType: "EvidenceFragment",
      currentStatus: frag.status,
      immutableVersion: "1",
      canonicalCitationUri: `/r/${frag.id}/v/1`,
      stableAliasUri: `/r/${frag.id}`,
      sourceMetadata: {
        sourceId: frag.sourceId,
        organization: source?.organization ?? null,
        canonicalSourceUrl: source?.canonicalUrl ?? null,
        sourceSnapshotId: frag.snapshotId,
        artifactStorageUri: snapshot?.artifactStorageUri ?? null,
        licenseOrReuseStatus: source?.licenseOrReuseStatus ?? null,
        retrievalMethod: source?.retrievalMethod ?? null,
      },
      evidenceLocation: {
        evidenceFragmentId: frag.id,
        locator: frag.locator,
        verbatimExcerpt: frag.excerptOrStructuredField.verbatimExcerpt,
      },
      validityDates: {
        valid_from: frag.valid_from,
        valid_to: frag.valid_to,
        observed_at: frag.observed_at,
      },
      retrievalDate: frag.retrieved_at,
      contentHash: frag.contentHash,
      supersessionOrWithdrawal: {
        isSuperseded: false,
        supersededByVersionId: null,
        supersededByUri: null,
        supersedesVersionId: null,
        isWithdrawn: false,
        retractionId: null,
        withdrawalReason: null,
        withdrawnAt: null,
      },
      connectedReferences: [
        {
          relation: "source_snapshot",
          targetId: frag.snapshotId,
          stableUri: `/r/${frag.snapshotId}`,
          immutableUri: `/r/${frag.snapshotId}/v/1`,
        },
        {
          relation: "source",
          targetId: frag.sourceId,
          stableUri: `/r/${frag.sourceId}`,
          immutableUri: `/r/${frag.sourceId}/v/1.0.0`,
        },
      ],
      payload: frag as unknown as Record<string, unknown>,
    });
  }

  // 4. SourceSnapshot (`snap:...`)
  if (store.sourceSnapshotsById.has(id)) {
    const snap = store.sourceSnapshotsById.get(id)!;
    if (version && version !== "1" && version !== "1.0.0" && version !== "v1") {
      return null;
    }
    const source = store.sourcesById.get(snap.sourceId);
    return buildProjectionsForEnvelope({
      spec: "dcc-reference-envelope/0.1",
      referenceId: snap.id,
      resolutionMode,
      objectType: "SourceSnapshot",
      currentStatus: snap.status,
      immutableVersion: "1",
      canonicalCitationUri: `/r/${snap.id}/v/1`,
      stableAliasUri: `/r/${snap.id}`,
      sourceMetadata: {
        sourceId: snap.sourceId,
        organization: source?.organization ?? null,
        canonicalSourceUrl: source?.canonicalUrl ?? null,
        sourceSnapshotId: snap.id,
        artifactStorageUri: snap.artifactStorageUri,
        licenseOrReuseStatus: snap.licenseOrReuseStatus,
        retrievalMethod: snap.retrievalMethod,
      },
      evidenceLocation: {
        evidenceFragmentId: null,
        locator: snap.artifactStorageUri,
        verbatimExcerpt: null,
      },
      validityDates: {
        valid_from: snap.valid_from,
        valid_to: snap.valid_to,
        observed_at: snap.observed_at,
      },
      retrievalDate: snap.retrieved_at,
      contentHash: snap.contentHash,
      supersessionOrWithdrawal: {
        isSuperseded: false,
        supersededByVersionId: null,
        supersededByUri: null,
        supersedesVersionId: null,
        isWithdrawn: false,
        retractionId: null,
        withdrawalReason: null,
        withdrawnAt: null,
      },
      connectedReferences: [
        {
          relation: "source",
          targetId: snap.sourceId,
          stableUri: `/r/${snap.sourceId}`,
          immutableUri: `/r/${snap.sourceId}/v/1.0.0`,
        },
      ],
      payload: snap as unknown as Record<string, unknown>,
    });
  }

  // 5. Source (`src:...`)
  if (store.sourcesById.has(id)) {
    const src = store.sourcesById.get(id)!;
    if (version && version !== src.version && version !== "1") {
      return null;
    }
    return buildProjectionsForEnvelope({
      spec: "dcc-reference-envelope/0.1",
      referenceId: src.id,
      resolutionMode,
      objectType: "Source",
      currentStatus: src.status,
      immutableVersion: src.version,
      canonicalCitationUri: `/r/${src.id}/v/${src.version}`,
      stableAliasUri: `/r/${src.id}`,
      sourceMetadata: {
        sourceId: src.id,
        organization: src.organization,
        canonicalSourceUrl: src.canonicalUrl,
        sourceSnapshotId: src.latestSnapshotId,
        artifactStorageUri: null,
        licenseOrReuseStatus: src.licenseOrReuseStatus,
        retrievalMethod: src.retrievalMethod,
      },
      evidenceLocation: {
        evidenceFragmentId: null,
        locator: src.canonicalUrl,
        verbatimExcerpt: null,
      },
      validityDates: {
        valid_from: src.valid_from,
        valid_to: src.valid_to,
        observed_at: src.retrieved_at,
      },
      retrievalDate: src.retrieved_at,
      contentHash: src.contentHash,
      supersessionOrWithdrawal: {
        isSuperseded: false,
        supersededByVersionId: null,
        supersededByUri: null,
        supersedesVersionId: null,
        isWithdrawn: false,
        retractionId: null,
        withdrawalReason: null,
        withdrawnAt: null,
      },
      connectedReferences: [
        {
          relation: "latest_snapshot",
          targetId: src.latestSnapshotId,
          stableUri: `/r/${src.latestSnapshotId}`,
          immutableUri: `/r/${src.latestSnapshotId}/v/1`,
        },
      ],
      payload: src as unknown as Record<string, unknown>,
    });
  }

  // 6. Entity (`ent:...`)
  if (store.entitiesById.has(id)) {
    const ent = store.entitiesById.get(id)!;
    if (version && version !== ent.version && version !== "1") {
      return null;
    }
    return buildProjectionsForEnvelope({
      spec: "dcc-reference-envelope/0.1",
      referenceId: ent.id,
      resolutionMode,
      objectType: "Entity",
      currentStatus: ent.status,
      immutableVersion: ent.version,
      canonicalCitationUri: `/r/${ent.id}/v/${ent.version}`,
      stableAliasUri: `/r/${ent.id}`,
      sourceMetadata: {
        sourceId: null,
        organization: "Destination Command Center Knowledge Graph",
        canonicalSourceUrl: null,
        sourceSnapshotId: null,
        artifactStorageUri: null,
        licenseOrReuseStatus: "dcc_first_party_graph",
        retrievalMethod: "canonical_entity_registry",
      },
      evidenceLocation: {
        evidenceFragmentId: null,
        locator: ent.id,
        verbatimExcerpt: null,
      },
      validityDates: {
        valid_from: ent.valid_from,
        valid_to: ent.valid_to,
        observed_at: ent.observed_at,
      },
      retrievalDate: ent.retrieved_at,
      contentHash: ent.contentHash,
      supersessionOrWithdrawal: {
        isSuperseded: false,
        supersededByVersionId: null,
        supersededByUri: null,
        supersedesVersionId: null,
        isWithdrawn: false,
        retractionId: null,
        withdrawalReason: null,
        withdrawnAt: null,
      },
      connectedReferences: ent.connectedIds.map((cid) => ({
        relation: "connected_entity",
        targetId: cid,
        stableUri: `/r/${cid}`,
      })),
      payload: ent as unknown as Record<string, unknown>,
    });
  }

  // 7. Rule (`rule:...`)
  if (store.rulesById.has(id)) {
    const rule = version
      ? store.ruleVersionsByKey.get(`${id}@${version}`)
      : store.rulesById.get(id);
    if (!rule) return null;
    return buildProjectionsForEnvelope({
      spec: "dcc-reference-envelope/0.1",
      referenceId: rule.id,
      resolutionMode,
      objectType: "Rule",
      currentStatus: "verified",
      immutableVersion: rule.version,
      canonicalCitationUri: `/r/${rule.id}/v/${rule.version}`,
      stableAliasUri: `/r/${rule.id}`,
      sourceMetadata: {
        sourceId: null,
        organization: "DCC Decision IR Compiler",
        canonicalSourceUrl: null,
        sourceSnapshotId: null,
        artifactStorageUri: null,
        licenseOrReuseStatus: "dcc_decision_ir_v0.1",
        retrievalMethod: "compiled_decision_rule",
      },
      evidenceLocation: {
        evidenceFragmentId: null,
        locator: rule.reasonCode,
        verbatimExcerpt: rule.description,
      },
      validityDates: {
        valid_from: "2026-01-01T00:00:00.000Z",
        valid_to: "2027-12-31T23:59:59.000Z",
        observed_at: "2026-04-12T00:00:00.000Z",
      },
      retrievalDate: "2026-04-12T00:00:00.000Z",
      contentHash: rule.contentHash,
      supersessionOrWithdrawal: {
        isSuperseded: false,
        supersededByVersionId: null,
        supersededByUri: null,
        supersedesVersionId: null,
        isWithdrawn: false,
        retractionId: null,
        withdrawalReason: null,
        withdrawnAt: null,
      },
      connectedReferences: rule.claimVersionDependencies.map((cvId) => ({
        relation: "depends_on_claim_version",
        targetId: cvId,
        stableUri: `/r/${cvId}`,
        immutableUri: `/r/${cvId}/v/1`,
      })),
      payload: rule as unknown as Record<string, unknown>,
    });
  }

  // 8. RuleSet (`rset:...`)
  if (store.ruleSetsById.has(id)) {
    const rset = version
      ? store.ruleSetVersionsByKey.get(`${id}@${version}`)
      : store.ruleSetsById.get(id);
    if (!rset) return null;
    return buildProjectionsForEnvelope({
      spec: "dcc-reference-envelope/0.1",
      referenceId: rset.id,
      resolutionMode,
      objectType: "RuleSet",
      currentStatus: "verified",
      immutableVersion: rset.version,
      canonicalCitationUri: `/r/${rset.id}/v/${rset.version}`,
      stableAliasUri: `/r/${rset.id}`,
      sourceMetadata: {
        sourceId: null,
        organization: "DCC Decision IR Compiler",
        canonicalSourceUrl: null,
        sourceSnapshotId: null,
        artifactStorageUri: null,
        licenseOrReuseStatus: "dcc_decision_ir_v0.1",
        retrievalMethod: "compiled_rule_set",
      },
      evidenceLocation: {
        evidenceFragmentId: null,
        locator: rset.id,
        verbatimExcerpt: `RuleSet for ${rset.engineId} v${rset.version}`,
      },
      validityDates: {
        valid_from: "2026-01-01T00:00:00.000Z",
        valid_to: "2027-12-31T23:59:59.000Z",
        observed_at: "2026-04-12T00:00:00.000Z",
      },
      retrievalDate: "2026-04-12T00:00:00.000Z",
      contentHash: rset.contentHash,
      supersessionOrWithdrawal: {
        isSuperseded: false,
        supersededByVersionId: null,
        supersededByUri: null,
        supersedesVersionId: null,
        isWithdrawn: false,
        retractionId: null,
        withdrawalReason: null,
        withdrawnAt: null,
      },
      connectedReferences: rset.ruleIds.map((rid) => ({
        relation: "includes_rule",
        targetId: rid,
        stableUri: `/r/${rid}`,
        immutableUri: `/r/${rid}/v/${rset.version}`,
      })),
      payload: rset as unknown as Record<string, unknown>,
    });
  }

  // 9. Engine (`juneau-helicopter-tours`, `hawaii-whale-watching`)
  if (store.enginesById.has(id)) {
    const engine = store.enginesById.get(id)!;
    const targetVer = version ?? engine.activeVersion;
    const engineVersion = store.engineVersionsByKey.get(`${id}@${targetVer}`);
    const bundle = store.bundlesByKey.get(`${id}@${targetVer}`);
    if (!engineVersion || !bundle) return null;

    return buildProjectionsForEnvelope({
      spec: "dcc-reference-envelope/0.1",
      referenceId: engine.id,
      resolutionMode,
      objectType: version ? "EngineVersion" : "Engine",
      currentStatus: engineVersion.status,
      immutableVersion: targetVer,
      canonicalCitationUri: `/r/${engine.id}/v/${targetVer}`,
      stableAliasUri: `/r/${engine.id}`,
      sourceMetadata: {
        sourceId: null,
        organization: "DCC Decision Engine Runtime",
        canonicalSourceUrl: null,
        sourceSnapshotId: null,
        artifactStorageUri: bundle.storageUri,
        licenseOrReuseStatus: "dcc_decision_ir_v0.1",
        retrievalMethod: "compiled_engine_bundle",
      },
      evidenceLocation: {
        evidenceFragmentId: null,
        locator: bundle.storageUri,
        verbatimExcerpt: engine.title,
      },
      validityDates: {
        valid_from: "2026-01-01T00:00:00.000Z",
        valid_to: "2027-12-31T23:59:59.000Z",
        observed_at: engineVersion.published_at,
      },
      retrievalDate: engineVersion.published_at,
      contentHash: bundle.bundleHash,
      supersessionOrWithdrawal: {
        isSuperseded: targetVer !== engine.activeVersion,
        supersededByVersionId:
          targetVer !== engine.activeVersion ? engine.activeVersion : null,
        supersededByUri:
          targetVer !== engine.activeVersion
            ? `/r/${engine.id}/v/${engine.activeVersion}`
            : null,
        supersedesVersionId: engine.previousActiveVersion,
        isWithdrawn: false,
        retractionId: null,
        withdrawalReason: null,
        withdrawnAt: null,
      },
      connectedReferences: [
        {
          relation: "compiled_bundle",
          targetId: bundle.id,
          stableUri: `/r/${bundle.id}`,
          immutableUri: `/r/${bundle.id}/v/${bundle.version}`,
        },
        {
          relation: "rule_set",
          targetId: engineVersion.ruleSetId,
          stableUri: `/r/${engineVersion.ruleSetId}`,
          immutableUri: `/r/${engineVersion.ruleSetId}/v/${targetVer}`,
        },
        {
          relation: "destination_entity",
          targetId: engine.destinationEntityId,
          stableUri: `/r/${engine.destinationEntityId}`,
          immutableUri: `/r/${engine.destinationEntityId}/v/1.0.0`,
        },
      ],
      payload: (version ? engineVersion : engine) as unknown as Record<string, unknown>,
    });
  }

  // 10. EngineVersion (`engv:...`) or EngineBundle (`bundle:...`)
  if (store.engineVersionsById.has(id)) {
    const ev = store.engineVersionsById.get(id)!;
    if (version && version !== ev.version && version !== "1") return null;
    const bundle = store.bundlesByKey.get(`${ev.engineId}@${ev.version}`);
    return buildProjectionsForEnvelope({
      spec: "dcc-reference-envelope/0.1",
      referenceId: ev.id,
      resolutionMode,
      objectType: "EngineVersion",
      currentStatus: ev.status,
      immutableVersion: ev.version,
      canonicalCitationUri: `/r/${ev.id}/v/${ev.version}`,
      stableAliasUri: `/r/${ev.id}`,
      sourceMetadata: {
        sourceId: null,
        organization: "DCC Decision IR Compiler",
        canonicalSourceUrl: null,
        sourceSnapshotId: null,
        artifactStorageUri: bundle?.storageUri ?? null,
        licenseOrReuseStatus: "dcc_decision_ir_v0.1",
        retrievalMethod: "compiled_engine_version",
      },
      evidenceLocation: {
        evidenceFragmentId: null,
        locator: ev.id,
        verbatimExcerpt: null,
      },
      validityDates: {
        valid_from: "2026-01-01T00:00:00.000Z",
        valid_to: "2027-12-31T23:59:59.000Z",
        observed_at: ev.published_at,
      },
      retrievalDate: ev.published_at,
      contentHash: ev.bundleHash,
      supersessionOrWithdrawal: {
        isSuperseded: false,
        supersededByVersionId: null,
        supersededByUri: null,
        supersedesVersionId: null,
        isWithdrawn: false,
        retractionId: null,
        withdrawalReason: null,
        withdrawnAt: null,
      },
      connectedReferences: [
        {
          relation: "engine",
          targetId: ev.engineId,
          stableUri: `/r/${ev.engineId}`,
          immutableUri: `/r/${ev.engineId}/v/${ev.version}`,
        },
      ],
      payload: ev as unknown as Record<string, unknown>,
    });
  }

  if (store.bundlesById.has(id)) {
    const bundle = store.bundlesById.get(id)!;
    if (version && version !== bundle.version && version !== "1") return null;
    return buildProjectionsForEnvelope({
      spec: "dcc-reference-envelope/0.1",
      referenceId: bundle.id,
      resolutionMode,
      objectType: "EngineBundle",
      currentStatus: "verified",
      immutableVersion: bundle.version,
      canonicalCitationUri: `/r/${bundle.id}/v/${bundle.version}`,
      stableAliasUri: `/r/${bundle.id}`,
      sourceMetadata: {
        sourceId: null,
        organization: "DCC Decision IR Compiler",
        canonicalSourceUrl: null,
        sourceSnapshotId: null,
        artifactStorageUri: bundle.storageUri,
        licenseOrReuseStatus: "dcc_decision_ir_v0.1",
        retrievalMethod: "compiled_engine_bundle",
      },
      evidenceLocation: {
        evidenceFragmentId: null,
        locator: bundle.storageUri,
        verbatimExcerpt: bundle.title,
      },
      validityDates: {
        valid_from: "2026-01-01T00:00:00.000Z",
        valid_to: "2027-12-31T23:59:59.000Z",
        observed_at: bundle.manifest.createdAt,
      },
      retrievalDate: bundle.manifest.createdAt,
      contentHash: bundle.bundleHash,
      supersessionOrWithdrawal: {
        isSuperseded: false,
        supersededByVersionId: null,
        supersededByUri: null,
        supersedesVersionId: null,
        isWithdrawn: false,
        retractionId: null,
        withdrawalReason: null,
        withdrawnAt: null,
      },
      connectedReferences: [
        {
          relation: "engine",
          targetId: bundle.engineId,
          stableUri: `/r/${bundle.engineId}`,
          immutableUri: `/r/${bundle.engineId}/v/${bundle.version}`,
        },
        ...bundle.rules.map((r) => ({
          relation: "rule",
          targetId: r.id,
          stableUri: `/r/${r.id}`,
          immutableUri: `/r/${r.id}/v/${r.version}`,
        })),
      ],
      payload: bundle as unknown as Record<string, unknown>,
    });
  }

  // 11. ClaimConflict (`conf:...`)
  if (store.claimConflictsById.has(id)) {
    const conf = store.claimConflictsById.get(id)!;
    if (version && version !== conf.version && version !== "1") return null;
    return buildProjectionsForEnvelope({
      spec: "dcc-reference-envelope/0.1",
      referenceId: conf.id,
      resolutionMode,
      objectType: "ClaimConflict",
      currentStatus: conf.status,
      immutableVersion: conf.version,
      canonicalCitationUri: `/r/${conf.id}/v/${conf.version}`,
      stableAliasUri: `/r/${conf.id}`,
      sourceMetadata: {
        sourceId: null,
        organization: "DCC Epistemic Conflict Ledger",
        canonicalSourceUrl: null,
        sourceSnapshotId: null,
        artifactStorageUri: null,
        licenseOrReuseStatus: "dcc_epistemic_ledger",
        retrievalMethod: "conflict_detection",
      },
      evidenceLocation: {
        evidenceFragmentId: null,
        locator: conf.claimId,
        verbatimExcerpt: conf.summary,
      },
      validityDates: {
        valid_from: conf.detected_at,
        valid_to: conf.resolved_at,
        observed_at: conf.detected_at,
      },
      retrievalDate: conf.detected_at,
      contentHash: conf.contentHash,
      supersessionOrWithdrawal: {
        isSuperseded: false,
        supersededByVersionId: null,
        supersededByUri: null,
        supersedesVersionId: null,
        isWithdrawn: false,
        retractionId: null,
        withdrawalReason: null,
        withdrawnAt: null,
      },
      connectedReferences: [
        {
          relation: "claim",
          targetId: conf.claimId,
          stableUri: `/r/${conf.claimId}`,
        },
        ...conf.claimVersionIds.map((cvId) => ({
          relation: "conflicting_claim_version",
          targetId: cvId,
          stableUri: `/r/${cvId}`,
          immutableUri: `/r/${cvId}/v/1`,
        })),
      ],
      payload: conf as unknown as Record<string, unknown>,
    });
  }

  // 12. RetractionOrWithdrawal (`ret:...`)
  if (store.retractionsById.has(id)) {
    const ret = store.retractionsById.get(id)!;
    if (version && version !== ret.version && version !== "1") return null;
    return buildProjectionsForEnvelope({
      spec: "dcc-reference-envelope/0.1",
      referenceId: ret.id,
      resolutionMode,
      objectType: "RetractionOrWithdrawal",
      currentStatus: ret.action === "withdrawn" ? "withdrawn" : "superseded",
      immutableVersion: ret.version,
      canonicalCitationUri: `/r/${ret.id}/v/${ret.version}`,
      stableAliasUri: `/r/${ret.id}`,
      sourceMetadata: {
        sourceId: null,
        organization: ret.issuedBy,
        canonicalSourceUrl: null,
        sourceSnapshotId: null,
        artifactStorageUri: null,
        licenseOrReuseStatus: "dcc_epistemic_ledger",
        retrievalMethod: "retraction_or_withdrawal",
      },
      evidenceLocation: {
        evidenceFragmentId: null,
        locator: ret.targetVersionId,
        verbatimExcerpt: ret.reason,
      },
      validityDates: {
        valid_from: ret.occurred_at,
        valid_to: null,
        observed_at: ret.occurred_at,
      },
      retrievalDate: ret.occurred_at,
      contentHash: ret.contentHash,
      supersessionOrWithdrawal: {
        isSuperseded: ret.action === "superseded",
        supersededByVersionId: ret.replacementVersionId,
        supersededByUri: ret.replacementVersionId
          ? `/r/${ret.replacementVersionId}`
          : null,
        supersedesVersionId: ret.targetVersionId,
        isWithdrawn: ret.action === "withdrawn",
        retractionId: ret.id,
        withdrawalReason: ret.reason,
        withdrawnAt: ret.occurred_at,
      },
      connectedReferences: [
        {
          relation: "target_object",
          targetId: ret.targetId,
          stableUri: `/r/${ret.targetId}`,
        },
        {
          relation: "target_version",
          targetId: ret.targetVersionId,
          stableUri: `/r/${ret.targetVersionId}`,
        },
      ],
      payload: ret as unknown as Record<string, unknown>,
    });
  }

  // 13. Evaluation (`eval:...`) and EvaluationTrace (`trace:...`)
  if (store.evaluationsById.has(id)) {
    const ev = store.evaluationsById.get(id)!;
    if (version && version !== "1" && version !== "1.0.0") return null;
    return buildProjectionsForEnvelope({
      spec: "dcc-reference-envelope/0.1",
      referenceId: ev.id,
      resolutionMode,
      objectType: "Evaluation",
      currentStatus: "verified",
      immutableVersion: "1",
      canonicalCitationUri: `/r/${ev.id}/v/1`,
      stableAliasUri: `/r/${ev.id}`,
      sourceMetadata: {
        sourceId: null,
        organization: "DCC Deterministic IR Evaluator",
        canonicalSourceUrl: null,
        sourceSnapshotId: null,
        artifactStorageUri: null,
        licenseOrReuseStatus: "dcc_evaluation_record",
        retrievalMethod: "deterministic_evaluation",
      },
      evidenceLocation: {
        evidenceFragmentId: null,
        locator: ev.traceId,
        verbatimExcerpt: `Decision state: ${ev.decisionState}`,
      },
      validityDates: {
        valid_from: ev.evaluatedAt,
        valid_to: null,
        observed_at: ev.evaluatedAt,
      },
      retrievalDate: ev.evaluatedAt,
      contentHash: ev.resultHash,
      supersessionOrWithdrawal: {
        isSuperseded: false,
        supersededByVersionId: null,
        supersededByUri: null,
        supersedesVersionId: null,
        isWithdrawn: false,
        retractionId: null,
        withdrawalReason: null,
        withdrawnAt: null,
      },
      connectedReferences: [
        {
          relation: "evaluation_trace",
          targetId: ev.traceId,
          stableUri: `/r/${ev.traceId}`,
          immutableUri: `/r/${ev.traceId}/v/1`,
        },
        {
          relation: "engine",
          targetId: ev.engineId,
          stableUri: `/r/${ev.engineId}`,
          immutableUri: `/r/${ev.engineId}/v/${ev.engineVersion}`,
        },
      ],
      payload: ev as unknown as Record<string, unknown>,
    });
  }

  if (store.evaluationTracesById.has(id)) {
    const tr = store.evaluationTracesById.get(id)!;
    if (version && version !== "1" && version !== "1.0.0") return null;
    return buildProjectionsForEnvelope({
      spec: "dcc-reference-envelope/0.1",
      referenceId: tr.id,
      resolutionMode,
      objectType: "EvaluationTrace",
      currentStatus: "verified",
      immutableVersion: "1",
      canonicalCitationUri: `/r/${tr.id}/v/1`,
      stableAliasUri: `/r/${tr.id}`,
      sourceMetadata: {
        sourceId: null,
        organization: "DCC Deterministic IR Evaluator",
        canonicalSourceUrl: null,
        sourceSnapshotId: null,
        artifactStorageUri: null,
        licenseOrReuseStatus: "dcc_evaluation_trace",
        retrievalMethod: "deterministic_evaluation_trace",
      },
      evidenceLocation: {
        evidenceFragmentId: null,
        locator: tr.evaluationId,
        verbatimExcerpt: null,
      },
      validityDates: {
        valid_from: "2026-04-12T00:00:00.000Z",
        valid_to: null,
        observed_at: "2026-04-12T00:00:00.000Z",
      },
      retrievalDate: "2026-04-12T00:00:00.000Z",
      contentHash: tr.traceHash,
      supersessionOrWithdrawal: {
        isSuperseded: false,
        supersededByVersionId: null,
        supersededByUri: null,
        supersedesVersionId: null,
        isWithdrawn: false,
        retractionId: null,
        withdrawalReason: null,
        withdrawnAt: null,
      },
      connectedReferences: [
        {
          relation: "evaluation",
          targetId: tr.evaluationId,
          stableUri: `/r/${tr.evaluationId}`,
          immutableUri: `/r/${tr.evaluationId}/v/1`,
        },
        ...tr.resolvedClaimVersionIds.map((cvId) => ({
          relation: "resolved_claim_version",
          targetId: cvId,
          stableUri: `/r/${cvId}`,
          immutableUri: `/r/${cvId}/v/1`,
        })),
      ],
      payload: JSON.parse(canonicalJsonStringify(tr)) as Record<string, unknown>,
    });
  }

  return null;
}
