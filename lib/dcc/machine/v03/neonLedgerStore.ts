import { neon } from "@neondatabase/serverless";
import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { resolveNeonMigrationDatabaseUrl } from "../durableStorage";
import {
  getStandardJwksDocument,
  rfc8785Canonicalize,
  sha256HexFull,
  type V03SignedDecisionReceipt,
} from "./rfc8785AndJws";
import {
  AppendOnlyKnowledgeLedger,
  type V03KnowledgeEvent,
  type V03ProjectedClaimState,
} from "./temporalLedger";
import type { V03CandidateUniverse } from "./candidateUniverse";
import type { V03CompiledEngineBundle } from "./evaluatorAndReplay";
import type { V03SignedDecisionAuthorization } from "./decisionAuthorization";
import type { V03EvidenceReference } from "./evidenceSelectors";

/**
 * DCC Machine Layer v0.3 — Neon Postgres Append-Only Relational Ledger Store
 *
 * Manages the clean isolated `dcc_machine_v03` schema:
 * - Applies `0007_dcc_machine_layer_v03.sql` and `0007_dcc_machine_layer_v03.down.sql`
 * - Enforces database-level append-only trigger on `dcc_v03_knowledge_events`
 * - Truncates and rebuilds `dcc_v03_claim_projections` 100% from `dcc_v03_knowledge_events`
 * - Enforces database-level identifier reuse prevention on `dcc_v03_allocated_identifiers`
 * - Persists and reloads external signing key metadata in `dcc_v03_signing_keys`
 * - Persists JWS receipts (`dcc_v03_signed_receipts`) and shadow authorizations (`dcc_v03_decision_authorizations`)
 */

const V03_TABLE_NAMES = [
  "dcc_v03_knowledge_events",
  "dcc_v03_allocated_identifiers",
  "dcc_v03_claim_projections",
  "dcc_v03_identity_projections",
  "dcc_v03_signing_keys",
  "dcc_v03_candidate_universes",
  "dcc_v03_engine_bundles",
  "dcc_v03_signed_receipts",
  "dcc_v03_decision_authorizations",
  "dcc_v03_ingestion_idempotency",
  "dcc_v03_rate_limit_buckets",
  "dcc_v03_security_audit_events",
  "dcc_v03_test_object_blobs",
] as const;

const V03_FUNCTION_NAMES = [
  "dcc_v03_prevent_ledger_mutation",
  "dcc_v03_prevent_identifier_deletion",
  "dcc_v03_prevent_blob_mutation",
] as const;

function splitSqlStatements(sqlText: string): string[] {
  const statements: string[] = [];
  let current = "";
  let inDollarQuote = false;
  let inSingleQuote = false;

  for (let i = 0; i < sqlText.length; i++) {
    const ch = sqlText[i]!;
    const next = sqlText[i + 1];

    if (!inSingleQuote && ch === "$" && next === "$") {
      inDollarQuote = !inDollarQuote;
      current += "$$";
      i++;
      continue;
    }
    if (!inDollarQuote && ch === "'") {
      inSingleQuote = !inSingleQuote;
      current += ch;
      continue;
    }
    if (!inDollarQuote && !inSingleQuote && ch === "-" && next === "-") {
      while (i < sqlText.length && sqlText[i] !== "\n") {
        i++;
      }
      current += "\n";
      continue;
    }
    if (!inDollarQuote && !inSingleQuote && ch === ";") {
      const trimmed = current.trim();
      if (trimmed.length > 0) {
        statements.push(trimmed);
      }
      current = "";
      continue;
    }
    current += ch;
  }
  const tail = current.trim();
  if (tail.length > 0) {
    statements.push(tail);
  }
  return statements;
}

function qualifyV03Sql(stmt: string, schemaName: string): string {
  let out = stmt;
  for (const tbl of V03_TABLE_NAMES) {
    out = out.replace(new RegExp(`"${tbl}"`, "g"), `"${schemaName}"."${tbl}"`);
  }
  for (const fn of V03_FUNCTION_NAMES) {
    out = out.replace(new RegExp(`\\b${fn}\\(\\)`, "g"), `"${schemaName}".${fn}()`);
  }
  return out;
}

export class NeonRelationalLedgerStoreV03 {
  public readonly schemaName: string;
  public readonly isConfigured: boolean;
  private readonly sqlClient: ReturnType<typeof neon> | null;
  private schemaEnsured = false;

  constructor(options?: { connectionString?: string; schemaName?: string }) {
    this.schemaName = options?.schemaName ?? "dcc_machine_v03";
    let conn = options?.connectionString;
    if (!conn) {
      try {
        conn = resolveNeonMigrationDatabaseUrl();
      } catch {
        conn = undefined;
      }
    }
    if (conn) {
      this.sqlClient = neon(conn);
      this.isConfigured = true;
    } else {
      this.sqlClient = null;
      this.isConfigured = false;
    }
  }

  async ensureSchemaAndTables(): Promise<void> {
    if (!this.isConfigured || this.schemaEnsured) return;
    await this.runMigrationsUpV03();
    this.schemaEnsured = true;
  }

  async execInSchema(statement: string, params: unknown[] = []): Promise<any[]> {
    if (!this.sqlClient) return [];
    const qualified = qualifyV03Sql(statement, this.schemaName);
    const rows = await (this.sqlClient as any).query(qualified, params);
    return Array.isArray(rows) ? rows : (rows?.rows ?? []);
  }

  async runMigrationsUpV03(): Promise<{
    schemaName: string;
    statementsExecuted: number;
    tablesCreated: string[];
  }> {
    if (!this.sqlClient) {
      return { schemaName: this.schemaName, statementsExecuted: 0, tablesCreated: [] };
    }
    await (this.sqlClient as any).query(`CREATE SCHEMA IF NOT EXISTS "${this.schemaName}"`);
    const sqlPath = path.join(process.cwd(), "drizzle", "0007_dcc_machine_layer_v03.sql");
    const raw = fs.readFileSync(sqlPath, "utf8");
    const stmts = splitSqlStatements(raw);
    let executed = 0;
    for (const stmt of stmts) {
      await this.execInSchema(stmt);
      executed++;
    }
    for (const alterStmt of [
      `ALTER TABLE "dcc_v03_knowledge_events" ALTER COLUMN "recorded_at" DROP NOT NULL`,
      `ALTER TABLE "dcc_v03_allocated_identifiers" ALTER COLUMN "allocated_at" DROP NOT NULL`,
      `ALTER TABLE "dcc_v03_claim_projections" ALTER COLUMN "retrieved_at" DROP NOT NULL`,
      `ALTER TABLE "dcc_v03_claim_projections" ALTER COLUMN "recorded_at" DROP NOT NULL`,
      `ALTER TABLE "dcc_v03_candidate_universes" DROP CONSTRAINT IF EXISTS "dcc_v03_candidate_universes_uid_ver_uniq"`,
      `ALTER TABLE "dcc_v03_engine_bundles" DROP CONSTRAINT IF EXISTS "dcc_v03_engine_bundles_eng_ver_uniq"`,
    ]) {
      try {
        await this.execInSchema(alterStmt);
      } catch {
        // Non-fatal in mock/unit environments
      }
    }
    const tables = await this.listTables();
    return {
      schemaName: this.schemaName,
      statementsExecuted: executed,
      tablesCreated: tables,
    };
  }

  async runMigrationsDownV03(): Promise<{
    schemaName: string;
    statementsExecuted: number;
    remainingTables: string[];
  }> {
    const sqlPath = path.join(process.cwd(), "drizzle", "0007_dcc_machine_layer_v03.down.sql");
    const raw = fs.readFileSync(sqlPath, "utf8");
    const stmts = splitSqlStatements(raw);
    let executed = 0;
    for (const stmt of stmts) {
      await this.execInSchema(stmt);
      executed++;
    }
    const remainingTables = await this.listTables();
    return {
      schemaName: this.schemaName,
      statementsExecuted: executed,
      remainingTables,
    };
  }

  async listTables(): Promise<string[]> {
    if (!this.sqlClient) return [];
    const rows = await (this.sqlClient as any).query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = $1 ORDER BY table_name ASC`,
      [this.schemaName],
    );
    const list = Array.isArray(rows) ? rows : (rows?.rows ?? []);
    return list.map((r: any) => String(r.table_name));
  }

  /**
   * Queries the authoritative database clock (`clock_timestamp()`) in Neon PostgreSQL
   * to assign a genuine database admission timestamp once when admitting events.
   */
  async queryDatabaseClockIso(): Promise<string> {
    if (!this.sqlClient) {
      return new Date().toISOString();
    }
    const rows = await (this.sqlClient as any).query(
      `SELECT clock_timestamp() AS now_iso`,
    );
    const list = Array.isArray(rows) ? rows : (rows?.rows ?? []);
    const raw = list[0]?.now_iso;
    return raw ? new Date(raw).toISOString() : new Date().toISOString();
  }

  async appendKnowledgeEventToNeon(ev: V03KnowledgeEvent): Promise<{ elapsedMs: number }> {
    const t0 = performance.now();
    await this.execInSchema(
      `INSERT INTO "dcc_v03_knowledge_events" (
        event_id, event_type, target_type, target_id, version_id,
        valid_from, valid_to, source_observed_at, source_published_at,
        retrieved_at, recorded_at, actor_id, is_synthetic, provenance_class,
        payload, event_hash, prev_event_hash
      ) VALUES (
        $1, $2, 'claim', $3, $4,
        $5::timestamptz, $6::timestamptz, $7::timestamptz, $8::timestamptz,
        $9::timestamptz, $10::timestamptz, $11, $12, $13,
        $14::jsonb, $15, $16
      ) ON CONFLICT (event_id) DO NOTHING`,
      [
        ev.eventId,
        ev.eventType,
        ev.claimId,
        ev.claimVersionId,
        ev.claimDefinition?.validFrom ?? null,
        ev.claimDefinition?.validTo ?? null,
        ev.claimDefinition?.sourceObservedAt ?? null,
        ev.claimDefinition?.sourcePublishedAt ?? null,
        ev.claimDefinition?.retrievedAt ?? null,
        ev.recordedAt,
        ev.actorId,
        ev.isSynthetic,
        ev.provenanceClass,
        JSON.stringify(ev),
        ev.eventHash,
        ev.prevEventHash,
      ],
    );
    return { elapsedMs: performance.now() - t0 };
  }

  async persistLedgerEventsToNeon(events: readonly V03KnowledgeEvent[]): Promise<void> {
    if (!this.isConfigured) return;
    for (const ev of events) {
      await this.appendKnowledgeEventToNeon(ev);
    }
  }

  async readLedgerEventsFromNeon(): Promise<V03KnowledgeEvent[]> {
    const { events } = await this.readKnowledgeEventsFromNeon();
    return events;
  }

  async persistEvidenceReferenceToNeon(evRef: V03EvidenceReference): Promise<void> {
    if (!this.isConfigured) return;
    await this.execInSchema(
      `INSERT INTO "dcc_v03_allocated_identifiers" (
        dcc_id, id_kind, allocated_at, allocated_by_event_id
      ) VALUES ($1, 'evidence_reference', $2::timestamptz, $3)
      ON CONFLICT (dcc_id) DO NOTHING`,
      [
        evRef.evidenceRefId,
        evRef.retrievedAt,
        `evref-init:${evRef.evidenceRefId}`,
      ],
    );
  }

  async readKnowledgeEventsFromNeon(): Promise<{
    events: V03KnowledgeEvent[];
    elapsedMs: number;
  }> {
    const t0 = performance.now();
    const rows = await this.execInSchema(
      `SELECT payload FROM "dcc_v03_knowledge_events" ORDER BY event_seq ASC`,
    );
    const elapsedMs = performance.now() - t0;
    const rawEvents = rows.map((r: any) => r.payload as V03KnowledgeEvent);
    const normalizedEvents = [...AppendOnlyKnowledgeLedger.fromEvents(rawEvents).getAllEvents()];
    return {
      events: normalizedEvents,
      elapsedMs,
    };
  }

  /**
   * Proves that `dcc_v03_claim_projections` is 100% rebuildable from `dcc_v03_knowledge_events`:
   * Truncates `dcc_v03_claim_projections`, reads all events from `dcc_v03_knowledge_events`,
   * replays them in `AppendOnlyKnowledgeLedger`, and writes the rebuilt projection back to Neon.
   */
  async truncateAndRebuildClaimProjectionsInNeon(params: {
    validAtIso: string;
    knowledgeCutoffIso: string;
    includeSynthetic?: boolean;
  }): Promise<{
    rebuiltClaimVersionCount: number;
    eventsReplayedCount: number;
    projectionDigestSha256: string;
  }> {
    await this.execInSchema(`TRUNCATE TABLE "dcc_v03_claim_projections"`);
    const { events } = await this.readKnowledgeEventsFromNeon();

    const tempLedger = AppendOnlyKnowledgeLedger.fromEvents(events);

    const rebuilt = tempLedger.rebuildProjectionAtCutoff({
      validAtIso: params.validAtIso,
      knowledgeCutoffIso: params.knowledgeCutoffIso,
      includeSynthetic: params.includeSynthetic ?? true,
    });

    const projectedList: V03ProjectedClaimState[] = Array.from(
      rebuilt.versionsByVersionId.values(),
    );

    for (const p of projectedList) {
      await this.execInSchema(
        `INSERT INTO "dcc_v03_claim_projections" (
          claim_version_id, claim_id, subject_dcc_id, predicate, assertion_type,
          epistemic_state, lifecycle_state, typed_value, unit_or_currency,
          valid_from, valid_to, source_observed_at, source_published_at,
          retrieved_at, recorded_at, freshness_ttl_seconds, source_authority,
          evidence_refs, superseded_by_version_id, supersedes_version_id,
          withdrawal_event_id, dispute_event_ids, is_synthetic, projected_at_cutoff, source_event_id
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8::jsonb, $9,
          $10::timestamptz, $11::timestamptz, $12::timestamptz, $13::timestamptz,
          $14::timestamptz, $15::timestamptz, $16, $17::jsonb,
          $18::jsonb, $19, $20,
          $21, $22::jsonb, $23, $24::timestamptz, $25
        )`,
        [
          p.claimVersionId,
          p.claimId,
          p.subjectDccId,
          p.predicate,
          p.assertionType,
          p.epistemicState,
          p.lifecycleState,
          JSON.stringify(p.typedValue),
          p.unitOrCurrency,
          p.validFrom,
          p.validTo,
          p.sourceObservedAt,
          p.sourcePublishedAt,
          p.retrievedAt,
          p.recordedAt,
          p.freshnessTtlSeconds,
          JSON.stringify(p.sourceAuthority),
          JSON.stringify(p.evidenceRefs),
          p.supersededByVersionId,
          p.supersedesVersionId,
          p.withdrawalEventId,
          JSON.stringify(p.disputeEventIds),
          p.isSynthetic,
          params.knowledgeCutoffIso,
          p.latestMutatingEventId,
        ],
      );
    }

    const projectionDigestSha256 = sha256HexFull(
      rfc8785Canonicalize(
        projectedList.map((p) => ({
          claimVersionId: p.claimVersionId,
          epistemicState: p.epistemicState,
          lifecycleState: p.lifecycleState,
          typedValue: p.typedValue,
          supersededByVersionId: p.supersededByVersionId,
          withdrawalEventId: p.withdrawalEventId,
        })),
      ),
    );

    return {
      rebuiltClaimVersionCount: projectedList.length,
      eventsReplayedCount: rebuilt.eventsAppliedCount,
      projectionDigestSha256,
    };
  }

  async verifyAppendOnlyTriggerInNeon(eventId: string): Promise<{
    updateBlocked: boolean;
    deleteBlocked: boolean;
    updateErrorMessage: string;
    deleteErrorMessage: string;
  }> {
    let updateBlocked = false;
    let deleteBlocked = false;
    let updateErrorMessage = "";
    let deleteErrorMessage = "";

    try {
      await this.execInSchema(
        `UPDATE "dcc_v03_knowledge_events" SET actor_id = 'tampered' WHERE event_id = $1`,
        [eventId],
      );
    } catch (err) {
      updateBlocked = true;
      updateErrorMessage = err instanceof Error ? err.message : String(err);
    }

    try {
      await this.execInSchema(
        `DELETE FROM "dcc_v03_knowledge_events" WHERE event_id = $1`,
        [eventId],
      );
    } catch (err) {
      deleteBlocked = true;
      deleteErrorMessage = err instanceof Error ? err.message : String(err);
    }

    return {
      updateBlocked,
      deleteBlocked,
      updateErrorMessage,
      deleteErrorMessage,
    };
  }

  async persistSigningKeysToNeon(): Promise<number> {
    const jwks = getStandardJwksDocument();
    for (const k of jwks.keys) {
      await this.execInSchema(
        `INSERT INTO "dcc_v03_signing_keys" (
          kid, alg, kty, crv, x, jwk_thumbprint_sha256, public_jwk,
          status, issuer, created_at, retired_at, revoked_at, revocation_reason
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7::jsonb,
          $8, $9, $10::timestamptz, $11::timestamptz, $12::timestamptz, $13
        ) ON CONFLICT (kid) DO UPDATE SET
          status = EXCLUDED.status,
          retired_at = EXCLUDED.retired_at,
          revoked_at = EXCLUDED.revoked_at,
          revocation_reason = EXCLUDED.revocation_reason`,
        [
          k.kid,
          k.alg,
          k.kty,
          k.crv,
          k.x,
          k.jwkThumbprintSha256,
          JSON.stringify({ kty: k.kty, crv: k.crv, alg: k.alg, use: k.use, kid: k.kid, x: k.x }),
          k.status,
          jwks.issuer,
          k.createdAt,
          k.retiredAt,
          k.revokedAt,
          k.revocationReason,
        ],
      );
    }
    return jwks.keys.length;
  }

  async readSigningKeysFromNeon(): Promise<Array<Record<string, unknown>>> {
    return this.execInSchema(
      `SELECT kid, alg, kty, crv, x, jwk_thumbprint_sha256, status, issuer FROM "dcc_v03_signing_keys" ORDER BY created_at ASC`,
    );
  }

  async persistCandidateUniverseToNeon(universe: V03CandidateUniverse): Promise<void> {
    if (!this.isConfigured) return;
    await this.execInSchema(
      `INSERT INTO "dcc_v03_candidate_universes" (
        universe_hash, universe_id, version, engine_id, engine_version,
        effective_from, effective_to, knowledge_cutoff, refresh_deadline,
        generator_version, is_synthetic, payload
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6::timestamptz, $7::timestamptz, $8::timestamptz, $9::timestamptz,
        $10, $11, $12::jsonb
      ) ON CONFLICT (universe_hash) DO UPDATE SET
        payload = EXCLUDED.payload`,
      [
        universe.universeHash,
        universe.universeId,
        universe.version,
        universe.engineId,
        universe.engineVersion,
        universe.effectiveFrom,
        universe.effectiveTo,
        universe.knowledgeCutoff,
        universe.refreshDeadline,
        universe.generatorVersion,
        universe.isSynthetic,
        JSON.stringify(universe),
      ],
    );
  }

  async readCandidateUniverseFromNeon(
    lookup:
      | string
      | { universeHash?: string; universeId?: string; version?: string },
  ): Promise<V03CandidateUniverse | null> {
    if (!this.isConfigured) return null;
    if (typeof lookup === "object" && lookup !== null) {
      if (lookup.universeHash) {
        const rows = await this.execInSchema(
          `SELECT payload FROM "dcc_v03_candidate_universes"
           WHERE universe_hash = $1
           LIMIT 1`,
          [lookup.universeHash],
        );
        if (rows[0]?.payload) return rows[0].payload as V03CandidateUniverse;
      }
      if (lookup.universeId && lookup.version) {
        const rows = await this.execInSchema(
          `SELECT payload FROM "dcc_v03_candidate_universes"
           WHERE universe_id = $1 AND version = $2
           ORDER BY recorded_at DESC
           LIMIT 1`,
          [lookup.universeId, lookup.version],
        );
        if (rows[0]?.payload) return rows[0].payload as V03CandidateUniverse;
      }
      if (lookup.universeId) {
        const rows = await this.execInSchema(
          `SELECT payload FROM "dcc_v03_candidate_universes"
           WHERE universe_id = $1
           ORDER BY recorded_at DESC
           LIMIT 1`,
          [lookup.universeId],
        );
        if (rows[0]?.payload) return rows[0].payload as V03CandidateUniverse;
      }
      return null;
    }
    const rows = await this.execInSchema(
      `SELECT payload FROM "dcc_v03_candidate_universes"
       WHERE universe_hash = $1 OR universe_id = $1
       ORDER BY recorded_at DESC
       LIMIT 1`,
      [lookup],
    );
    if (!rows[0]?.payload) return null;
    return rows[0].payload as V03CandidateUniverse;
  }

  async readAllCandidateUniversesFromNeon(): Promise<V03CandidateUniverse[]> {
    if (!this.isConfigured) return [];
    const rows = await this.execInSchema(
      `SELECT payload FROM "dcc_v03_candidate_universes" ORDER BY recorded_at ASC`,
    );
    return rows.map((r: any) => r.payload as V03CandidateUniverse).filter(Boolean);
  }

  async persistEngineBundleToNeon(bundle: V03CompiledEngineBundle): Promise<void> {
    if (!this.isConfigured) return;
    await this.execInSchema(
      `INSERT INTO "dcc_v03_engine_bundles" (
        bundle_hash, engine_id, engine_version, compiler_version,
        universe_hash, knowledge_cutoff, is_synthetic, bundle_payload
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6::timestamptz, $7, $8::jsonb
      ) ON CONFLICT (bundle_hash) DO UPDATE SET
        bundle_payload = EXCLUDED.bundle_payload`,
      [
        bundle.bundleHash,
        bundle.engineId,
        bundle.engineVersion,
        bundle.compilerVersion,
        bundle.universeHash,
        bundle.knowledgeCutoff,
        bundle.isSynthetic,
        JSON.stringify(bundle),
      ],
    );
  }

  async readEngineBundleFromNeon(
    lookup:
      | string
      | { bundleHash?: string; engineId?: string; engineVersion?: string },
  ): Promise<V03CompiledEngineBundle | null> {
    if (!this.isConfigured) return null;
    if (typeof lookup === "object" && lookup !== null) {
      if (lookup.bundleHash) {
        const rows = await this.execInSchema(
          `SELECT bundle_payload FROM "dcc_v03_engine_bundles"
           WHERE bundle_hash = $1
           LIMIT 1`,
          [lookup.bundleHash],
        );
        if (rows[0]?.bundle_payload) {
          return rows[0].bundle_payload as V03CompiledEngineBundle;
        }
      }
      if (lookup.engineId && lookup.engineVersion) {
        const rows = await this.execInSchema(
          `SELECT bundle_payload FROM "dcc_v03_engine_bundles"
           WHERE engine_id = $1 AND engine_version = $2
           ORDER BY recorded_at DESC
           LIMIT 1`,
          [lookup.engineId, lookup.engineVersion],
        );
        if (rows[0]?.bundle_payload) {
          return rows[0].bundle_payload as V03CompiledEngineBundle;
        }
      }
      return null;
    }
    const rows = await this.execInSchema(
      `SELECT bundle_payload FROM "dcc_v03_engine_bundles"
       WHERE bundle_hash = $1 OR engine_id = $1
       ORDER BY recorded_at DESC
       LIMIT 1`,
      [lookup],
    );
    if (!rows[0]?.bundle_payload) return null;
    return rows[0].bundle_payload as V03CompiledEngineBundle;
  }

  async readAllEngineBundlesFromNeon(): Promise<V03CompiledEngineBundle[]> {
    if (!this.isConfigured) return [];
    const rows = await this.execInSchema(
      `SELECT bundle_payload FROM "dcc_v03_engine_bundles" ORDER BY recorded_at ASC`,
    );
    return rows.map((r: any) => r.bundle_payload as V03CompiledEngineBundle).filter(Boolean);
  }

  async persistSignedReceiptToNeon(
    receipt: V03SignedDecisionReceipt,
    originalInputs?: Record<string, unknown>,
    evaluationResult?: unknown,
  ): Promise<void> {
    if (!this.isConfigured) return;
    const p = receipt.payload;
    const traceEnvelope = {
      candidateDispositionSummary: p.candidateDispositionSummary,
      originalInputs: originalInputs ?? null,
      evaluationResult: evaluationResult ?? null,
      signedReceiptEnvelope: receipt,
    };
    await this.execInSchema(
      `INSERT INTO "dcc_v03_signed_receipts" (
        receipt_id, evaluation_run_id, trace_run_id, evaluation_fingerprint,
        execution_class, is_synthetic, engine_id, engine_version, compiler_version,
        bundle_hash, universe_id, universe_version, universe_hash,
        valid_at, knowledge_cutoff, issued_at, kid, alg,
        rfc8785_payload_sha256, jws_compact, receipt_payload, trace_payload
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8, $9,
        $10, $11, $12, $13,
        $14::timestamptz, $15::timestamptz, $16::timestamptz, $17, $18,
        $19, $20, $21::jsonb, $22::jsonb
      ) ON CONFLICT (receipt_id) DO UPDATE SET
        trace_payload = EXCLUDED.trace_payload`,
      [
        receipt.receiptId,
        p.evaluationRunId,
        p.traceRunId,
        p.evaluationFingerprint,
        receipt.executionClass,
        receipt.isSynthetic,
        p.engineId,
        p.engineVersion,
        p.compilerVersion,
        p.decisionIrBundleHash,
        p.candidateUniverseId,
        p.candidateUniverseVersion,
        p.candidateUniverseHash,
        p.validAt,
        p.knowledgeCutoff,
        receipt.issuedAt,
        receipt.kid,
        receipt.alg,
        receipt.rfc8785PayloadSha256,
        receipt.jwsCompact,
        JSON.stringify(receipt.payload),
        JSON.stringify(traceEnvelope),
      ],
    );
  }

  async readSignedReceiptFromNeon(receiptId: string): Promise<{
    receipt: V03SignedDecisionReceipt;
    originalInputs: Record<string, unknown> | null;
    evaluationResult: unknown | null;
  } | null> {
    if (!this.isConfigured) return null;
    const rows = await this.execInSchema(
      `SELECT
        receipt_id, execution_class, is_synthetic, issued_at, kid, alg,
        rfc8785_payload_sha256, jws_compact, receipt_payload, trace_payload
       FROM "dcc_v03_signed_receipts"
       WHERE receipt_id = $1
       LIMIT 1`,
      [receiptId],
    );
    const row = rows[0];
    if (!row) return null;

    const trace = (row.trace_payload ?? {}) as Record<string, any>;
    if (trace.signedReceiptEnvelope && typeof trace.signedReceiptEnvelope === "object") {
      return {
        receipt: trace.signedReceiptEnvelope as V03SignedDecisionReceipt,
        originalInputs: (trace.originalInputs as Record<string, unknown>) ?? null,
        evaluationResult: trace.evaluationResult ?? null,
      };
    }

    const rebuiltReceipt: V03SignedDecisionReceipt = {
      objectType: "DecisionReceipt",
      spec: "dcc-decision-receipt/0.3",
      receiptId: String(row.receipt_id),
      alg: row.alg as "ES256" | "EdDSA",
      kid: String(row.kid),
      typ: "application/dcc-decision-receipt+jws",
      jku: "https://www.destinationcommandcenter.com/.well-known/jwks.json",
      issuedAt: new Date(row.issued_at).toISOString(),
      executionClass: row.execution_class,
      isSynthetic: Boolean(row.is_synthetic),
      rfc8785CanonicalPayload: rfc8785Canonicalize(row.receipt_payload),
      rfc8785PayloadSha256: String(row.rfc8785_payload_sha256),
      jwsCompact: String(row.jws_compact),
      payload: row.receipt_payload,
    };

    return {
      receipt: rebuiltReceipt,
      originalInputs: (trace.originalInputs as Record<string, unknown>) ?? null,
      evaluationResult: trace.evaluationResult ?? null,
    };
  }

  async persistDecisionAuthorizationToNeon(
    auth: V03SignedDecisionAuthorization,
  ): Promise<void> {
    if (!this.isConfigured) return;
    const p = auth.payload;
    await this.execInSchema(
      `INSERT INTO "dcc_v03_decision_authorizations" (
        authorization_id, receipt_id, execution_mode, permitted_action,
        candidate_dcc_entity_id, target_adapter, max_price_minor_units,
        currency, idempotency_key, revocation_status, issued_at, expires_at,
        authorization_jws, authorization_payload
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7,
        $8, $9, $10, $11::timestamptz, $12::timestamptz,
        $13, $14::jsonb
      ) ON CONFLICT (authorization_id) DO UPDATE SET
        revocation_status = EXCLUDED.revocation_status,
        authorization_payload = EXCLUDED.authorization_payload`,
      [
        auth.authorizationId,
        p.decisionReceipt.receiptId,
        p.executionMode,
        p.permittedAction,
        p.providerProductReference.candidateDccEntityId,
        p.opaqueRouting.targetAdapter,
        p.maxPrice.amountMinorUnits,
        p.maxPrice.currency,
        p.idempotencyKey,
        p.revocation.status,
        p.issuedAt,
        p.expiresAt,
        auth.jwsCompact,
        JSON.stringify(auth),
      ],
    );
  }

  async readDecisionAuthorizationFromNeon(
    authorizationId: string,
  ): Promise<V03SignedDecisionAuthorization | null> {
    if (!this.isConfigured) return null;
    const rows = await this.execInSchema(
      `SELECT authorization_payload FROM "dcc_v03_decision_authorizations"
       WHERE authorization_id = $1
       LIMIT 1`,
      [authorizationId],
    );
    if (!rows[0]?.authorization_payload) return null;
    return rows[0].authorization_payload as V03SignedDecisionAuthorization;
  }

  async readDecisionAuthorizationsFromNeon(
    limit = 50,
  ): Promise<V03SignedDecisionAuthorization[]> {
    if (!this.isConfigured) return [];
    const rows = await this.execInSchema(
      `SELECT authorization_payload FROM "dcc_v03_decision_authorizations"
       ORDER BY issued_at DESC
       LIMIT $1`,
      [limit],
    );
    return rows
      .map((r: any) => r.authorization_payload as V03SignedDecisionAuthorization)
      .filter(Boolean);
  }
}
