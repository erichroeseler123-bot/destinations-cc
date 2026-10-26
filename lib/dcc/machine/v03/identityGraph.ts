import { rfc8785Canonicalize, sha256HexFull } from "./rfc8785AndJws";

/**
 * DCC Machine Layer v0.3 — DCC-Native Opaque Identity & Versioned External Aliases
 *
 * Implements Requirement 7:
 * - Stable opaque DCC identifiers (`dcc:ent:<kind>:<24-hex>`)
 * - External IDs (Google Place ID, Viator, Rezdy, OCTO, GDS, operator internal, government permit/station)
 *   stored strictly as versioned external alias mappings with mapping evidence and recorded time
 * - Alias supersession and redirect
 * - Entity merge (redirecting source entity & aliases to surviving entity)
 * - Entity split (retiring original entity into child entities with disambiguation required)
 * - Strict prevention of identifier reuse
 */

export type DccEntityKind =
  | "destination"
  | "operator"
  | "tour_candidate"
  | "regulatory_agency"
  | "infrastructure_node"
  | "evidence_source";

export type ExternalAliasNamespace =
  | "google_place_id"
  | "viator_product_code"
  | "rezdy_product_code"
  | "octo_product_id"
  | "gds_code"
  | "operator_internal_id"
  | "government_permit_or_station_id"
  | "legacy_dcc_slug";

export type AliasMappingStatus =
  | "active"
  | "superseded"
  | "redirected"
  | "withdrawn"
  | "disputed";

export interface ExternalAliasMapping {
  aliasVersionId: string;
  namespace: ExternalAliasNamespace;
  externalId: string;
  dccEntityId: string;
  redirectTargetDccEntityId: string | null;
  mappingStatus: AliasMappingStatus;
  mappingEvidenceRefIds: string[];
  recordedAt: string;
  supersededByAliasVersionId: string | null;
  supersedesAliasVersionId: string | null;
}

export type DccEntityLifecycleStatus =
  | "active"
  | "merged_redirected"
  | "split_retired"
  | "retired";

export interface DccEntityProjection {
  dccEntityId: string;
  entityKind: DccEntityKind;
  displayName: string;
  lifecycleStatus: DccEntityLifecycleStatus;
  mergedIntoDccEntityId: string | null;
  splitIntoDccEntityIds: string[];
  activeExternalAliases: ExternalAliasMapping[];
  historicalExternalAliases: ExternalAliasMapping[];
  attributes: Record<string, unknown>;
  isSynthetic: boolean;
  recordedAt: string;
}

export class IdentifierReuseForbiddenError extends Error {
  public readonly code = "IDENTIFIER_REUSE_FORBIDDEN";
  constructor(dccId: string) {
    super(
      `IDENTIFIER_REUSE_FORBIDDEN: DCC identifier "${dccId}" has already been allocated and can never be reused or reassigned.`,
    );
    this.name = "IdentifierReuseForbiddenError";
  }
}

/**
 * Generates a deterministic opaque DCC entity identifier (`dcc:ent:<kind>:<24-hex>`)
 * from an immutable creation seed so that the identifier contains no mutable human slug.
 */
export function mintOpaqueDccEntityId(kind: DccEntityKind, creationSeed: string): string {
  const digest = sha256HexFull(`dcc-v03-entity:${kind}:${creationSeed}`).slice(0, 24);
  return `dcc:ent:${kind}:${digest}`;
}

export type IdentityLedgerEventPayload =
  | {
      kind: "identity_registered";
      dccEntityId: string;
      entityKind: DccEntityKind;
      displayName: string;
      attributes: Record<string, unknown>;
    }
  | {
      kind: "identity_alias_mapped";
      aliasVersionId: string;
      namespace: ExternalAliasNamespace;
      externalId: string;
      dccEntityId: string;
      mappingEvidenceRefIds: string[];
      supersedesAliasVersionId: string | null;
    }
  | {
      kind: "identity_merged";
      sourceDccEntityId: string;
      survivingDccEntityId: string;
      reason: string;
      evidenceRefIds: string[];
    }
  | {
      kind: "identity_split";
      originalDccEntityId: string;
      newDccEntities: Array<{
        dccEntityId: string;
        entityKind: DccEntityKind;
        displayName: string;
        attributes: Record<string, unknown>;
      }>;
      reason: string;
      evidenceRefIds: string[];
    };

export interface IdentityLedgerEvent {
  eventId: string;
  recordedAt: string;
  actorId: string;
  isSynthetic: boolean;
  payload: IdentityLedgerEventPayload;
  eventHash: string;
}

export class DccIdentityLedger {
  private readonly allocatedEntityIds = new Set<string>();
  private readonly allocatedAliasVersionIds = new Set<string>();
  private readonly events: IdentityLedgerEvent[] = [];

  getEvents(): readonly IdentityLedgerEvent[] {
    return this.events;
  }

  registerEntity(params: {
    dccEntityId: string;
    entityKind: DccEntityKind;
    displayName: string;
    attributes?: Record<string, unknown>;
    recordedAt: string;
    actorId?: string;
    isSynthetic?: boolean;
  }): IdentityLedgerEvent {
    if (this.allocatedEntityIds.has(params.dccEntityId)) {
      throw new IdentifierReuseForbiddenError(params.dccEntityId);
    }
    this.allocatedEntityIds.add(params.dccEntityId);

    const payload: IdentityLedgerEventPayload = {
      kind: "identity_registered",
      dccEntityId: params.dccEntityId,
      entityKind: params.entityKind,
      displayName: params.displayName,
      attributes: params.attributes ?? {},
    };
    return this.appendEvent({
      recordedAt: params.recordedAt,
      actorId: params.actorId ?? "dcc-identity-registrar",
      isSynthetic: params.isSynthetic ?? false,
      payload,
    });
  }

  mapExternalAlias(params: {
    aliasVersionId: string;
    namespace: ExternalAliasNamespace;
    externalId: string;
    dccEntityId: string;
    mappingEvidenceRefIds: string[];
    supersedesAliasVersionId?: string | null;
    recordedAt: string;
    actorId?: string;
    isSynthetic?: boolean;
  }): IdentityLedgerEvent {
    if (this.allocatedAliasVersionIds.has(params.aliasVersionId)) {
      throw new IdentifierReuseForbiddenError(params.aliasVersionId);
    }
    if (!this.allocatedEntityIds.has(params.dccEntityId)) {
      throw new Error(`Cannot map alias to unregistered DCC entity "${params.dccEntityId}".`);
    }
    this.allocatedAliasVersionIds.add(params.aliasVersionId);

    const payload: IdentityLedgerEventPayload = {
      kind: "identity_alias_mapped",
      aliasVersionId: params.aliasVersionId,
      namespace: params.namespace,
      externalId: params.externalId,
      dccEntityId: params.dccEntityId,
      mappingEvidenceRefIds: params.mappingEvidenceRefIds,
      supersedesAliasVersionId: params.supersedesAliasVersionId ?? null,
    };
    return this.appendEvent({
      recordedAt: params.recordedAt,
      actorId: params.actorId ?? "dcc-identity-registrar",
      isSynthetic: params.isSynthetic ?? false,
      payload,
    });
  }

  mergeEntities(params: {
    sourceDccEntityId: string;
    survivingDccEntityId: string;
    reason: string;
    evidenceRefIds: string[];
    recordedAt: string;
    actorId?: string;
    isSynthetic?: boolean;
  }): IdentityLedgerEvent {
    if (params.sourceDccEntityId === params.survivingDccEntityId) {
      throw new Error("Cannot merge an entity into itself.");
    }
    if (
      !this.allocatedEntityIds.has(params.sourceDccEntityId) ||
      !this.allocatedEntityIds.has(params.survivingDccEntityId)
    ) {
      throw new Error("Both source and surviving entities must exist before merging.");
    }
    return this.appendEvent({
      recordedAt: params.recordedAt,
      actorId: params.actorId ?? "dcc-identity-registrar",
      isSynthetic: params.isSynthetic ?? false,
      payload: {
        kind: "identity_merged",
        sourceDccEntityId: params.sourceDccEntityId,
        survivingDccEntityId: params.survivingDccEntityId,
        reason: params.reason,
        evidenceRefIds: params.evidenceRefIds,
      },
    });
  }

  splitEntity(params: {
    originalDccEntityId: string;
    newDccEntities: Array<{
      dccEntityId: string;
      entityKind: DccEntityKind;
      displayName: string;
      attributes?: Record<string, unknown>;
    }>;
    reason: string;
    evidenceRefIds: string[];
    recordedAt: string;
    actorId?: string;
    isSynthetic?: boolean;
  }): IdentityLedgerEvent {
    if (!this.allocatedEntityIds.has(params.originalDccEntityId)) {
      throw new Error(`Original entity "${params.originalDccEntityId}" does not exist.`);
    }
    for (const child of params.newDccEntities) {
      if (this.allocatedEntityIds.has(child.dccEntityId)) {
        throw new IdentifierReuseForbiddenError(child.dccEntityId);
      }
      this.allocatedEntityIds.add(child.dccEntityId);
    }

    return this.appendEvent({
      recordedAt: params.recordedAt,
      actorId: params.actorId ?? "dcc-identity-registrar",
      isSynthetic: params.isSynthetic ?? false,
      payload: {
        kind: "identity_split",
        originalDccEntityId: params.originalDccEntityId,
        newDccEntities: params.newDccEntities.map((c) => ({
          dccEntityId: c.dccEntityId,
          entityKind: c.entityKind,
          displayName: c.displayName,
          attributes: c.attributes ?? {},
        })),
        reason: params.reason,
        evidenceRefIds: params.evidenceRefIds,
      },
    });
  }

  /**
   * Rebuilds the complete identity & alias projection purely from the immutable event log
   * up to `knowledgeCutoffIso`.
   */
  projectAtCutoff(options?: {
    knowledgeCutoffIso?: string;
    includeSynthetic?: boolean;
  }): {
    entitiesById: Map<string, DccEntityProjection>;
    resolveEntityId: (dccEntityId: string) => {
      resolutionStatus: "active" | "merged_redirect" | "split_ambiguous" | "not_found";
      canonicalDccEntityId: string | null;
      splitCandidates: string[];
      entity: DccEntityProjection | null;
    };
    resolveExternalAlias: (
      namespace: ExternalAliasNamespace,
      externalId: string,
    ) => {
      found: boolean;
      aliasMapping: ExternalAliasMapping | null;
      canonicalDccEntityId: string | null;
      redirectedViaMerge: boolean;
    };
  } {
    const cutoffMs = options?.knowledgeCutoffIso
      ? Date.parse(options.knowledgeCutoffIso)
      : Number.POSITIVE_INFINITY;
    const includeSynthetic = options?.includeSynthetic ?? true;

    const entitiesById = new Map<string, DccEntityProjection>();
    const aliasesByVersionId = new Map<string, ExternalAliasMapping>();

    for (const ev of this.events) {
      if (Date.parse(ev.recordedAt) > cutoffMs) continue;
      if (!includeSynthetic && ev.isSynthetic) continue;

      const p = ev.payload;
      if (p.kind === "identity_registered") {
        entitiesById.set(p.dccEntityId, {
          dccEntityId: p.dccEntityId,
          entityKind: p.entityKind,
          displayName: p.displayName,
          lifecycleStatus: "active",
          mergedIntoDccEntityId: null,
          splitIntoDccEntityIds: [],
          activeExternalAliases: [],
          historicalExternalAliases: [],
          attributes: { ...p.attributes },
          isSynthetic: ev.isSynthetic,
          recordedAt: ev.recordedAt,
        });
      } else if (p.kind === "identity_alias_mapped") {
        const entity = entitiesById.get(p.dccEntityId);
        if (!entity) continue;

        if (p.supersedesAliasVersionId) {
          const prev = aliasesByVersionId.get(p.supersedesAliasVersionId);
          if (prev) {
            prev.mappingStatus = "superseded";
            prev.supersededByAliasVersionId = p.aliasVersionId;
          }
        }

        const mapping: ExternalAliasMapping = {
          aliasVersionId: p.aliasVersionId,
          namespace: p.namespace,
          externalId: p.externalId,
          dccEntityId: p.dccEntityId,
          redirectTargetDccEntityId: entity.mergedIntoDccEntityId,
          mappingStatus: entity.mergedIntoDccEntityId ? "redirected" : "active",
          mappingEvidenceRefIds: [...p.mappingEvidenceRefIds],
          recordedAt: ev.recordedAt,
          supersededByAliasVersionId: null,
          supersedesAliasVersionId: p.supersedesAliasVersionId,
        };
        aliasesByVersionId.set(mapping.aliasVersionId, mapping);
      } else if (p.kind === "identity_merged") {
        const source = entitiesById.get(p.sourceDccEntityId);
        const surviving = entitiesById.get(p.survivingDccEntityId);
        if (source && surviving) {
          source.lifecycleStatus = "merged_redirected";
          source.mergedIntoDccEntityId = surviving.dccEntityId;
          for (const alias of aliasesByVersionId.values()) {
            if (alias.dccEntityId === source.dccEntityId && alias.mappingStatus === "active") {
              alias.mappingStatus = "redirected";
              alias.redirectTargetDccEntityId = surviving.dccEntityId;
            }
          }
        }
      } else if (p.kind === "identity_split") {
        const orig = entitiesById.get(p.originalDccEntityId);
        if (orig) {
          orig.lifecycleStatus = "split_retired";
          orig.splitIntoDccEntityIds = p.newDccEntities.map((c) => c.dccEntityId);
        }
        for (const child of p.newDccEntities) {
          entitiesById.set(child.dccEntityId, {
            dccEntityId: child.dccEntityId,
            entityKind: child.entityKind,
            displayName: child.displayName,
            lifecycleStatus: "active",
            mergedIntoDccEntityId: null,
            splitIntoDccEntityIds: [],
            activeExternalAliases: [],
            historicalExternalAliases: [],
            attributes: { ...child.attributes, splitFromDccEntityId: p.originalDccEntityId },
            isSynthetic: ev.isSynthetic,
            recordedAt: ev.recordedAt,
          });
        }
      }
    }

    // Attach active and historical aliases to projected entities
    for (const alias of aliasesByVersionId.values()) {
      const owner = entitiesById.get(alias.dccEntityId);
      if (!owner) continue;
      if (alias.mappingStatus === "active") {
        owner.activeExternalAliases.push(alias);
      } else {
        owner.historicalExternalAliases.push(alias);
      }
      if (alias.redirectTargetDccEntityId) {
        const target = entitiesById.get(alias.redirectTargetDccEntityId);
        if (target) {
          target.activeExternalAliases.push(alias);
        }
      }
    }

    const resolveEntityId = (dccEntityId: string) => {
      const ent = entitiesById.get(dccEntityId);
      if (!ent) {
        return {
          resolutionStatus: "not_found" as const,
          canonicalDccEntityId: null,
          splitCandidates: [],
          entity: null,
        };
      }
      if (ent.lifecycleStatus === "merged_redirected" && ent.mergedIntoDccEntityId) {
        let curr = ent;
        const visited = new Set<string>([curr.dccEntityId]);
        while (curr.mergedIntoDccEntityId && !visited.has(curr.mergedIntoDccEntityId)) {
          visited.add(curr.mergedIntoDccEntityId);
          const next = entitiesById.get(curr.mergedIntoDccEntityId);
          if (!next) break;
          curr = next;
        }
        return {
          resolutionStatus: "merged_redirect" as const,
          canonicalDccEntityId: curr.dccEntityId,
          splitCandidates: [],
          entity: curr,
        };
      }
      if (ent.lifecycleStatus === "split_retired") {
        return {
          resolutionStatus: "split_ambiguous" as const,
          canonicalDccEntityId: null,
          splitCandidates: [...ent.splitIntoDccEntityIds],
          entity: ent,
        };
      }
      return {
        resolutionStatus: "active" as const,
        canonicalDccEntityId: ent.dccEntityId,
        splitCandidates: [],
        entity: ent,
      };
    };

    const resolveExternalAlias = (namespace: ExternalAliasNamespace, externalId: string) => {
      const matching = Array.from(aliasesByVersionId.values()).filter(
        (a) =>
          a.namespace === namespace &&
          a.externalId === externalId &&
          (a.mappingStatus === "active" || a.mappingStatus === "redirected"),
      );
      if (matching.length === 0) {
        return {
          found: false,
          aliasMapping: null,
          canonicalDccEntityId: null,
          redirectedViaMerge: false,
        };
      }
      const latest = matching[matching.length - 1]!;
      const resolved = resolveEntityId(
        latest.redirectTargetDccEntityId ?? latest.dccEntityId,
      );
      return {
        found: true,
        aliasMapping: latest,
        canonicalDccEntityId: resolved.canonicalDccEntityId,
        redirectedViaMerge:
          latest.mappingStatus === "redirected" ||
          resolved.resolutionStatus === "merged_redirect",
      };
    };

    return {
      entitiesById,
      resolveEntityId,
      resolveExternalAlias,
    };
  }

  private appendEvent(params: {
    recordedAt: string;
    actorId: string;
    isSynthetic: boolean;
    payload: IdentityLedgerEventPayload;
  }): IdentityLedgerEvent {
    const seq = this.events.length + 1;
    const prevHash = seq > 1 ? this.events[seq - 2]!.eventHash : null;
    const eventId = `idev:${seq}:${sha256HexFull(rfc8785Canonicalize(params)).slice(0, 16)}`;
    const eventHash = sha256HexFull(
      rfc8785Canonicalize({
        eventId,
        recordedAt: params.recordedAt,
        actorId: params.actorId,
        isSynthetic: params.isSynthetic,
        payload: params.payload,
        prevHash,
      }),
    );
    const ev: IdentityLedgerEvent = Object.freeze({
      eventId,
      recordedAt: params.recordedAt,
      actorId: params.actorId,
      isSynthetic: params.isSynthetic,
      payload: Object.freeze(params.payload),
      eventHash,
    });
    this.events.push(ev);
    return ev;
  }
}
