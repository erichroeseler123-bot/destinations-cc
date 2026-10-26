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
  private readonly sqlClient: ReturnType<typeof neon>;

  constructor(options?: { connectionString?: string; schemaName?: string }) {
    const conn = options?.connectionString ?? resolveNeonMigrationDatabaseUrl();
    this.sqlClient = neon(conn);
    this.schemaName = options?.schemaName ?? "dcc_machine_v03";
  }

  async execInSchema(statement: string, params: unknown[] = []): Promise<any[]> {
    const qualified = qualifyV03Sql(statement, this.schemaName);
    const rows = await (this.sqlClient as any).query(qualified, params);
    return Array.isArray(rows) ? rows : (rows?.rows ?? []);
  }

  async runMigrationsUpV03(): Promise<{
    schemaName: string;
    statementsExecuted: number;
    tablesCreated: string[];
  }> {
    await (this.sqlClient as any).query(`CREATE SCHEMA IF NOT EXISTS "${this.schemaName}"`);
    const sqlPath = path.join(process.cwd(), "drizzle", "0007_dcc_machine_layer_v03.sql");
    const raw = fs.readFileSync(sqlPath, "utf8");
    const stmts = splitSqlStatements(raw);
    let executed = 0;
    for (const stmt of stmts) {
      await this.execInSchema(stmt);
      executed++;
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
    const rows = await (this.sqlClient as any).query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = $1 ORDER BY table_name ASC`,
      [this.schemaName],
    );
    const list = Array.isArray(rows) ? rows : (rows?.rows ?? []);
    return list.map((r: any) => String(r.table_name));
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

  async readKnowledgeEventsFromNeon(): Promise<{
    events: V03KnowledgeEvent[];
    elapsedMs: number;
  }> {
    const t0 = performance.now();
    const rows = await this.execInSchema(
      `SELECT payload FROM "dcc_v03_knowledge_events" ORDER BY event_seq ASC`,
    );
    const elapsedMs = performance.now() - t0;
    return {
      events: rows.map((r: any) => r.payload as V03KnowledgeEvent),
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

    const tempLedger = new AppendOnlyKnowledgeLedger();
    for (const ev of events) {
      tempLedger.appendEvent({
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
        corroboratingSourceDccId: ev.corroboratingSourceDccId,
      });
    }

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

  async persistSignedReceiptToNeon(receipt: V03SignedDecisionReceipt): Promise<void> {
    const p = receipt.payload;
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
      ) ON CONFLICT (receipt_id) DO NOTHING`,
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
        JSON.stringify(p.candidateDispositionSummary),
      ],
    );
  }
}
