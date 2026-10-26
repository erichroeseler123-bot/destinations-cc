import {
  computeV03FreshnessState,
  evaluateClaimSupportEligibility,
  evaluateSourceHierarchyOverridePolicy,
  type V03AssertionType,
  type V03EpistemicState,
  type V03FreshnessState,
  type V03LifecycleState,
  type V03SourceAuthority,
} from "./claimSemantics";
import type { V03EvidenceReference } from "./evidenceSelectors";
import { rfc8785Canonicalize, sha256HexFull } from "./rfc8785AndJws";

/**
 * DCC Machine Layer v0.3 — Append-Only Knowledge Event Ledger & Rebuildable Projections
 *
 * Implements Requirement 1:
 * - Replaces authoritative `known_to` mutation with append-only knowledge events.
 * - Distinguishes:
 *   - `validFrom` / `validTo`: applicability in the world
 *   - `sourceObservedAt` / `sourcePublishedAt`
 *   - `retrievedAt`: when DCC captured the evidence
 *   - `recordedAt`: when DCC stored the event in the append-only ledger
 *   - `knowledgeCutoff`: what an evaluation was permitted to know (`recordedAt <= knowledgeCutoff`)
 * - Supersession, correction, withdrawal, dispute, approval, and retraction are appended events.
 * - Mutable projections are 100% rebuildable from the immutable event ledger.
 * - Rejects client-supplied `knownAt` / `knowledgeCutoff` in ordinary evaluation.
 */

export class ClientSuppliedKnownAtForbiddenError extends Error {
  public readonly code = "CLIENT_SUPPLIED_KNOWN_AT_FORBIDDEN";
  public readonly statusCode = 400;
  constructor(fieldName: string) {
    super(
      `CLIENT_SUPPLIED_KNOWN_AT_FORBIDDEN: Ordinary evaluations cannot supply "${fieldName}". The server establishes knowledgeCutoff automatically. Use historical receipt replay (/api/v1/receipts/{id}/replay) or authenticated administrative simulation.`,
    );
    this.name = "ClientSuppliedKnownAtForbiddenError";
  }
}

export class AppendOnlyLedgerMutationError extends Error {
  public readonly code = "APPEND_ONLY_LEDGER_VIOLATION";
  constructor(message: string) {
    super(message);
    this.name = "AppendOnlyLedgerMutationError";
  }
}

export type KnowledgeEventType =
  | "claim_created"
  | "claim_quarantined"
  | "claim_approved_and_activated"
  | "claim_corroborated"
  | "claim_superseded"
  | "claim_corrected_retroactively"
  | "claim_disputed"
  | "claim_withdrawn"
  | "claim_retracted"
  | "reseller_conflict_recorded"
  | "shadow_authorization_dry_run_recorded";

export interface V03ClaimDefinition {
  claimId: string;
  claimVersionId: string;
  subjectDccId: string;
  predicate: string;
  assertionType: V03AssertionType;
  epistemicState: V03EpistemicState;
  typedValue: string | number | boolean | null;
  unitOrCurrency?: string | null;
  validFrom: string;
  validTo: string | null;
  sourceObservedAt: string | null;
  sourcePublishedAt: string | null;
  retrievedAt: string;
  freshnessTtlSeconds: number;
  sourceAuthority: V03SourceAuthority;
  evidenceRefs: V03EvidenceReference[];
}

export interface V03KnowledgeEvent {
  readonly eventSeq: number;
  readonly eventId: string;
  readonly eventType: KnowledgeEventType;
  readonly claimId: string;
  readonly claimVersionId: string;
  readonly targetPreviousVersionId: string | null;
  readonly recordedAt: string;
  readonly actorId: string;
  readonly isSynthetic: boolean;
  readonly provenanceClass:
    | "operational_evidence"
    | "synthetic_test_fixture"
    | "admin_simulation"
    | "withdrawn_unsupported";
  readonly claimDefinition: V03ClaimDefinition | null;
  readonly reason: string;
  readonly corroboratingSourceDccId: string | null;
  readonly eventHash: string;
  readonly prevEventHash: string | null;
}

export interface V03ProjectedClaimState {
  claimId: string;
  claimVersionId: string;
  subjectDccId: string;
  predicate: string;
  assertionType: V03AssertionType;
  epistemicState: V03EpistemicState;
  lifecycleState: V03LifecycleState;
  freshnessStateAtEval: V03FreshnessState;
  canSupportPositiveEligibility: boolean;
  ineligibilityOrIndeterminateReason: string | null;
  typedValue: string | number | boolean | null;
  unitOrCurrency: string | null;
  validFrom: string;
  validTo: string | null;
  sourceObservedAt: string | null;
  sourcePublishedAt: string | null;
  retrievedAt: string;
  recordedAt: string;
  freshnessTtlSeconds: number;
  sourceAuthority: V03SourceAuthority;
  evidenceRefs: V03EvidenceReference[];
  supersededByVersionId: string | null;
  supersedesVersionId: string | null;
  withdrawalEventId: string | null;
  disputeEventIds: string[];
  originatingEventId: string;
  originatingEventHash: string;
  latestMutatingEventId: string;
  latestMutatingEventHash: string;
  isSynthetic: boolean;
}

export class AppendOnlyKnowledgeLedger {
  private readonly events: V03KnowledgeEvent[] = [];

  static fromEvents(events: readonly V03KnowledgeEvent[]): AppendOnlyKnowledgeLedger {
    const ledger = new AppendOnlyKnowledgeLedger();
    for (const ev of events) {
      ledger.events.push(Object.freeze({ ...ev }));
    }
    return ledger;
  }

  getEvents(): readonly V03KnowledgeEvent[] {
    return this.events;
  }

  getAllEvents(): readonly V03KnowledgeEvent[] {
    return this.events;
  }

  /**
   * Verifies the cryptographic hash chain of every event in the append-only ledger,
   * proving zero historical events were modified or deleted.
   */
  verifyHashChainIntegrity(): {
    intact: boolean;
    eventCount: number;
    headEventHash: string | null;
  } {
    let prevHash: string | null = null;
    for (let i = 0; i < this.events.length; i++) {
      const ev = this.events[i]!;
      if (ev.eventSeq !== i + 1 || ev.prevEventHash !== prevHash) {
        return { intact: false, eventCount: this.events.length, headEventHash: null };
      }
      const expectedHash = sha256HexFull(
        rfc8785Canonicalize({
          eventSeq: ev.eventSeq,
          eventId: ev.eventId,
          eventType: ev.eventType,
          claimId: ev.claimId,
          claimVersionId: ev.claimVersionId,
          targetPreviousVersionId: ev.targetPreviousVersionId,
          recordedAt: ev.recordedAt,
          actorId: ev.actorId,
          isSynthetic: ev.isSynthetic,
          provenanceClass: ev.provenanceClass,
          claimDefinition: ev.claimDefinition,
          reason: ev.reason,
          corroboratingSourceDccId: ev.corroboratingSourceDccId ?? null,
          prevEventHash: ev.prevEventHash,
        }),
      );
      if (expectedHash !== ev.eventHash) {
        return { intact: false, eventCount: this.events.length, headEventHash: null };
      }
      prevHash = ev.eventHash;
    }
    return {
      intact: true,
      eventCount: this.events.length,
      headEventHash: prevHash,
    };
  }

  appendEvent(params: {
    eventType: KnowledgeEventType;
    claimId: string;
    claimVersionId: string;
    targetPreviousVersionId?: string | null;
    recordedAt: string;
    actorId: string;
    isSynthetic?: boolean;
    provenanceClass?: V03KnowledgeEvent["provenanceClass"];
    claimDefinition?: V03ClaimDefinition | null;
    reason: string;
    corroboratingSourceDccId?: string | null;
  }): V03KnowledgeEvent {
    const eventSeq = this.events.length + 1;
    const prevEventHash = eventSeq > 1 ? this.events[eventSeq - 2]!.eventHash : null;
    const isSynthetic = params.isSynthetic ?? false;
    const provenanceClass =
      params.provenanceClass ??
      (isSynthetic ? "synthetic_test_fixture" : "operational_evidence");

    const seedCore = rfc8785Canonicalize({
      eventSeq,
      eventType: params.eventType,
      claimId: params.claimId,
      claimVersionId: params.claimVersionId,
      recordedAt: params.recordedAt,
    });
    const eventId = `kevt:${eventSeq}:${sha256HexFull(seedCore).slice(0, 24)}`;

    const normalizedDef = params.claimDefinition
      ? (JSON.parse(JSON.stringify(params.claimDefinition)) as V03ClaimDefinition)
      : null;

    const hashCore = rfc8785Canonicalize({
      eventSeq,
      eventId,
      eventType: params.eventType,
      claimId: params.claimId,
      claimVersionId: params.claimVersionId,
      targetPreviousVersionId: params.targetPreviousVersionId ?? null,
      recordedAt: params.recordedAt,
      actorId: params.actorId,
      isSynthetic,
      provenanceClass,
      claimDefinition: normalizedDef,
      reason: params.reason,
      corroboratingSourceDccId: params.corroboratingSourceDccId ?? null,
      prevEventHash,
    });
    const eventHash = sha256HexFull(hashCore);

    const frozenDef = normalizedDef ? Object.freeze(normalizedDef) : null;

    const ev: V03KnowledgeEvent = Object.freeze({
      eventSeq,
      eventId,
      eventType: params.eventType,
      claimId: params.claimId,
      claimVersionId: params.claimVersionId,
      targetPreviousVersionId: params.targetPreviousVersionId ?? null,
      recordedAt: params.recordedAt,
      actorId: params.actorId,
      isSynthetic,
      provenanceClass,
      claimDefinition: frozenDef,
      reason: params.reason,
      corroboratingSourceDccId: params.corroboratingSourceDccId ?? null,
      eventHash,
      prevEventHash,
    });

    this.events.push(ev);
    return ev;
  }

  /**
   * Enforces the v0.3.1 5-tier Source Hierarchy (`operator_direct` > `government_regulatory` >
   * `authorized_distributor` > `reseller` > `secondary_editorial`):
   * A reseller (or lower-authority) claim may NOT override a direct operator policy claim
   * without recording an explicit conflict event (`reseller_conflict_recorded`).
   */
  attemptAppendClaimWithSourceHierarchyGuard(params: {
    claimDefinition: V03ClaimDefinition;
    targetPreviousVersionId?: string | null;
    recordedAt: string;
    actorId: string;
    isSynthetic?: boolean;
    reason: string;
  }): {
    overrodeExistingClaim: boolean;
    conflictRecorded: boolean;
    recordedEvent: V03KnowledgeEvent;
    reasonCode: string;
  } {
    const proj = this.rebuildProjectionAtCutoff({
      validAtIso: params.claimDefinition.validFrom,
      knowledgeCutoffIso: params.recordedAt,
      includeSynthetic: params.isSynthetic ?? false,
    });
    const existing = proj.effectiveClaimByClaimId.get(params.claimDefinition.claimId);
    if (existing && existing.typedValue !== params.claimDefinition.typedValue) {
      const policy = evaluateSourceHierarchyOverridePolicy({
        existingClaimTier: existing.sourceAuthority.authorityTier,
        existingAssertionType: existing.assertionType,
        incomingClaimTier: params.claimDefinition.sourceAuthority.authorityTier,
        incomingAssertionType: params.claimDefinition.assertionType,
      });
      if (!policy.overrideAllowed && policy.requiresExplicitConflictRecord) {
        const conflictEvent = this.appendEvent({
          eventType: "reseller_conflict_recorded",
          claimId: params.claimDefinition.claimId,
          claimVersionId: params.claimDefinition.claimVersionId,
          targetPreviousVersionId: existing.claimVersionId,
          recordedAt: params.recordedAt,
          actorId: params.actorId,
          isSynthetic: params.isSynthetic ?? false,
          claimDefinition: params.claimDefinition,
          reason: `${policy.reasonCode}: ${params.reason}`,
        });
        return {
          overrodeExistingClaim: false,
          conflictRecorded: true,
          recordedEvent: conflictEvent,
          reasonCode: policy.reasonCode,
        };
      }
    }

    const activatedEvent = this.appendEvent({
      eventType: existing ? "claim_superseded" : "claim_approved_and_activated",
      claimId: params.claimDefinition.claimId,
      claimVersionId: params.claimDefinition.claimVersionId,
      targetPreviousVersionId: existing?.claimVersionId ?? params.targetPreviousVersionId ?? null,
      recordedAt: params.recordedAt,
      actorId: params.actorId,
      isSynthetic: params.isSynthetic ?? false,
      claimDefinition: params.claimDefinition,
      reason: params.reason,
    });
    return {
      overrodeExistingClaim: true,
      conflictRecorded: false,
      recordedEvent: activatedEvent,
      reasonCode: "HIERARCHY_OVERRIDE_PERMITTED",
    };
  }

  /**
   * Rebuilds the complete claim projection from scratch using ONLY events with
   * `recordedAt <= knowledgeCutoffIso`, and evaluates world applicability at `validAtIso`.
   *
   * Zero historical events are ever mutated!
   */
  rebuildProjectionAtCutoff(params: {
    validAtIso: string;
    knowledgeCutoffIso: string;
    includeSynthetic?: boolean;
    pinnedClaimEventHashes?: Record<string, string>;
  }): {
    versionsByVersionId: Map<string, V03ProjectedClaimState>;
    effectiveClaimByClaimId: Map<string, V03ProjectedClaimState>;
    eventsAppliedCount: number;
  } {
    const cutoffMs = Date.parse(params.knowledgeCutoffIso);
    const validAtMs = Date.parse(params.validAtIso);
    const includeSynthetic = params.includeSynthetic ?? false;

    const versionsByVersionId = new Map<string, V03ProjectedClaimState>();
    let eventsAppliedCount = 0;

    for (const ev of this.events) {
      const recMs = Date.parse(ev.recordedAt);
      if (recMs > cutoffMs) {
        continue;
      }
      if (!includeSynthetic && ev.isSynthetic) {
        continue;
      }

      eventsAppliedCount++;

      if (
        (ev.eventType === "claim_created" ||
          ev.eventType === "claim_quarantined" ||
          ev.eventType === "claim_approved_and_activated" ||
          ev.eventType === "claim_superseded" ||
          ev.eventType === "claim_corrected_retroactively") &&
        ev.claimDefinition
      ) {
        const def = ev.claimDefinition;
        const initialLifecycle: V03LifecycleState =
          ev.eventType === "claim_quarantined" ? "quarantined" : "active";

        // If this event supersedes or retroactively corrects a previous version, mark that previous version superseded as of this event
        if (
          (ev.eventType === "claim_superseded" ||
            ev.eventType === "claim_corrected_retroactively") &&
          ev.targetPreviousVersionId
        ) {
          const prev = versionsByVersionId.get(ev.targetPreviousVersionId);
          if (prev) {
            prev.lifecycleState = "superseded";
            prev.supersededByVersionId = def.claimVersionId;
            prev.latestMutatingEventId = ev.eventId;
            prev.latestMutatingEventHash = ev.eventHash;
          }
        }

        const existing = versionsByVersionId.get(def.claimVersionId);
        if (existing && ev.eventType === "claim_approved_and_activated") {
          existing.lifecycleState = "active";
          existing.epistemicState = def.epistemicState;
          existing.latestMutatingEventId = ev.eventId;
          existing.latestMutatingEventHash = ev.eventHash;
        } else {
          versionsByVersionId.set(def.claimVersionId, {
            claimId: def.claimId,
            claimVersionId: def.claimVersionId,
            subjectDccId: def.subjectDccId,
            predicate: def.predicate,
            assertionType: def.assertionType,
            epistemicState: def.epistemicState,
            lifecycleState: initialLifecycle,
            freshnessStateAtEval: "current",
            canSupportPositiveEligibility: false,
            ineligibilityOrIndeterminateReason: null,
            typedValue: def.typedValue,
            unitOrCurrency: def.unitOrCurrency ?? null,
            validFrom: def.validFrom,
            validTo: def.validTo,
            sourceObservedAt: def.sourceObservedAt,
            sourcePublishedAt: def.sourcePublishedAt,
            retrievedAt: def.retrievedAt,
            recordedAt: ev.recordedAt,
            freshnessTtlSeconds: def.freshnessTtlSeconds,
            sourceAuthority: {
              ...def.sourceAuthority,
              competentDomains: [...def.sourceAuthority.competentDomains],
              independentlyCorroboratedBySourceDccIds: [
                ...def.sourceAuthority.independentlyCorroboratedBySourceDccIds,
              ],
            },
            evidenceRefs: [...def.evidenceRefs],
            supersededByVersionId: null,
            supersedesVersionId: ev.targetPreviousVersionId,
            withdrawalEventId: null,
            disputeEventIds: [],
            originatingEventId: ev.eventId,
            originatingEventHash: ev.eventHash,
            latestMutatingEventId: ev.eventId,
            latestMutatingEventHash: ev.eventHash,
            isSynthetic: ev.isSynthetic,
          });
        }
      } else if (ev.eventType === "claim_approved_and_activated") {
        const target = versionsByVersionId.get(ev.claimVersionId);
        if (target) {
          target.lifecycleState = "active";
          if (target.epistemicState === "source_asserted") {
            target.epistemicState = "verified_against_identified_evidence";
          }
          target.latestMutatingEventId = ev.eventId;
          target.latestMutatingEventHash = ev.eventHash;
        }
      } else if (ev.eventType === "claim_corroborated") {
        const target = versionsByVersionId.get(ev.claimVersionId);
        if (target) {
          target.epistemicState = "corroborated";
          if (ev.corroboratingSourceDccId) {
            target.sourceAuthority.independentlyCorroboratedBySourceDccIds.push(
              ev.corroboratingSourceDccId,
            );
          }
          target.latestMutatingEventId = ev.eventId;
          target.latestMutatingEventHash = ev.eventHash;
        }
      } else if (ev.eventType === "claim_disputed") {
        const target = versionsByVersionId.get(ev.claimVersionId);
        if (target) {
          target.epistemicState = "disputed";
          target.disputeEventIds.push(ev.eventId);
          target.latestMutatingEventId = ev.eventId;
          target.latestMutatingEventHash = ev.eventHash;
        }
      } else if (ev.eventType === "claim_withdrawn" || ev.eventType === "claim_retracted") {
        const target =
          (ev.targetPreviousVersionId
            ? versionsByVersionId.get(ev.targetPreviousVersionId)
            : undefined) ?? versionsByVersionId.get(ev.claimVersionId);
        if (target) {
          target.lifecycleState = "withdrawn";
          target.withdrawalEventId = ev.eventId;
          target.latestMutatingEventId = ev.eventId;
          target.latestMutatingEventHash = ev.eventHash;
        }
      }
    }

    // Compute freshnessState and support eligibility at (validAtIso, knowledgeCutoffIso)
    for (const v of versionsByVersionId.values()) {
      const supportCheck = evaluateClaimSupportEligibility({
        assertionType: v.assertionType,
        epistemicState: v.epistemicState,
        lifecycleState: v.lifecycleState,
        sourceAuthority: v.sourceAuthority,
        validFrom: v.validFrom,
        validTo: v.validTo,
        retrievedAt: v.retrievedAt,
        freshnessTtlSeconds: v.freshnessTtlSeconds,
        validAtIso: params.validAtIso,
        knowledgeCutoffIso: params.knowledgeCutoffIso,
      });
      v.freshnessStateAtEval = supportCheck.freshnessState;
      v.canSupportPositiveEligibility = supportCheck.canSupportEligibility;
      v.ineligibilityOrIndeterminateReason = supportCheck.disqualificationOrIndeterminateReason;
    }

    // Resolve effective claim version per claimId as of (validAtIso, knowledgeCutoffIso)
    const effectiveClaimByClaimId = new Map<string, V03ProjectedClaimState>();
    const byClaimId = new Map<string, V03ProjectedClaimState[]>();
    for (const v of versionsByVersionId.values()) {
      const list = byClaimId.get(v.claimId) ?? [];
      list.push(v);
      byClaimId.set(v.claimId, list);
    }

    for (const [claimId, versions] of byClaimId.entries()) {
      // Filter versions applicable at validAt (or fallback to latest known version so withdrawal/dispute is preserved)
      const applicableAtValidAt = versions.filter((v) => {
        const vf = Date.parse(v.validFrom);
        const vt = v.validTo ? Date.parse(v.validTo) : null;
        return validAtMs >= vf && (vt === null || validAtMs <= vt);
      });

      const pool = applicableAtValidAt.length > 0 ? applicableAtValidAt : versions;
      // Prefer active (non-superseded, non-quarantined) version recorded latest <= knowledgeCutoff
      const activePool = pool.filter(
        (v) => v.lifecycleState === "active" || v.lifecycleState === "withdrawn",
      );
      const selectedPool = activePool.length > 0 ? activePool : pool;
      selectedPool.sort((a, b) => Date.parse(b.recordedAt) - Date.parse(a.recordedAt));
      effectiveClaimByClaimId.set(claimId, selectedPool[0]!);
    }

    return {
      versionsByVersionId,
      effectiveClaimByClaimId,
      eventsAppliedCount,
    };
  }
}
