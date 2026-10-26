import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";
import {
  type ArtifactCategory,
  DurableStorageConfigurationError,
  ImmutableArtifactMutationError,
  assertStorageBackendAllowed,
  sha256Hex,
} from "./cryptoAndStorage";

/**
 * DCC Machine Layer v0.2 — Real Durable Storage (Neon Postgres + Cloudflare R2 / Durable Object Store)
 *
 * - Relational state, version metadata, bitemporal claim intervals, audit events, and active pointers live in Neon Postgres.
 * - Immutable source snapshots, candidate universes, compiled bundles, and signed receipts live in Cloudflare R2 or Neon Postgres content-addressed immutable object table.
 * - Local filesystem storage is restricted to tests/development; production fails closed if configured with local_fs.
 */

export interface DurableObjectStore {
  readonly backendName: "cloudflare_r2" | "neon_immutable_object_store" | "local_fs_dev_only";
  putImmutableObject(params: {
    category: ArtifactCategory;
    key: string;
    content: string;
    contentType?: string;
  }): Promise<{
    storageUri: string;
    sha256Hash: string;
    sizeBytes: number;
    backend: string;
  }>;
  getImmutableObject(
    storageUri: string,
    expectedSha256?: string,
  ): Promise<{ content: string; sha256Hash: string; backend: string } | null>;
}

/**
 * S3-compatible AWS Signature V4 client for Cloudflare R2 immutable object storage.
 * Uses `If-None-Match: "*"` conditional writes so published objects can never be silently overwritten.
 */
export class CloudflareR2ObjectStore implements DurableObjectStore {
  public readonly backendName = "cloudflare_r2" as const;
  private readonly endpoint: string;
  private readonly accessKeyId: string;
  private readonly secretAccessKey: string;
  private readonly bucket: string;
  private readonly fetchImpl: typeof fetch;

  constructor(config?: {
    endpoint?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    bucket?: string;
    fetchImpl?: typeof fetch;
  }) {
    this.endpoint = (
      config?.endpoint ??
      process.env.DCC_MACHINE_R2_ENDPOINT ??
      ""
    ).replace(/\/+$/, "");
    this.accessKeyId =
      config?.accessKeyId ?? process.env.DCC_MACHINE_R2_ACCESS_KEY_ID ?? "";
    this.secretAccessKey =
      config?.secretAccessKey ?? process.env.DCC_MACHINE_R2_SECRET_ACCESS_KEY ?? "";
    this.bucket = config?.bucket ?? process.env.DCC_MACHINE_R2_BUCKET ?? "dcc-machine-artifacts";
    this.fetchImpl = config?.fetchImpl ?? globalThis.fetch;

    if (!this.endpoint || !this.accessKeyId || !this.secretAccessKey) {
      throw new DurableStorageConfigurationError(
        "R2_CREDENTIALS_MISSING",
        "Cloudflare R2 requires DCC_MACHINE_R2_ENDPOINT, DCC_MACHINE_R2_ACCESS_KEY_ID, and DCC_MACHINE_R2_SECRET_ACCESS_KEY.",
      );
    }
  }

  private signRequest(
    method: "PUT" | "GET",
    objectPath: string,
    payloadSha256: string,
    extraHeaders: Record<string, string> = {},
  ): { url: string; headers: Record<string, string> } {
    const urlObj = new URL(`${this.endpoint}/${this.bucket}/${objectPath.replace(/^\/+/, "")}`);
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
    const dateStamp = amzDate.slice(0, 8);
    const region = "auto";
    const service = "s3";

    const headers: Record<string, string> = {
      host: urlObj.host,
      "x-amz-content-sha256": payloadSha256,
      "x-amz-date": amzDate,
      ...extraHeaders,
    };

    const sortedHeaderKeys = Object.keys(headers)
      .map((k) => k.toLowerCase())
      .sort();
    const canonicalHeaders = sortedHeaderKeys
      .map((k) => `${k}:${headers[k].trim()}\n`)
      .join("");
    const signedHeaders = sortedHeaderKeys.join(";");

    const canonicalRequest = [
      method,
      urlObj.pathname,
      "",
      canonicalHeaders,
      signedHeaders,
      payloadSha256,
    ].join("\n");

    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      credentialScope,
      sha256Hex(canonicalRequest),
    ].join("\n");

    const hmac = (key: Buffer | string, data: string) =>
      crypto.createHmac("sha256", key).update(data, "utf8").digest();

    const kDate = hmac(`AWS4${this.secretAccessKey}`, dateStamp);
    const kRegion = hmac(kDate, region);
    const kService = hmac(kRegion, service);
    const kSigning = hmac(kService, "aws4_request");
    const signature = crypto
      .createHmac("sha256", kSigning)
      .update(stringToSign, "utf8")
      .digest("hex");

    headers.authorization = `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
    return { url: urlObj.toString(), headers };
  }

  async putImmutableObject(params: {
    category: ArtifactCategory;
    key: string;
    content: string;
    contentType?: string;
  }) {
    const safeKey = `${params.category}/${params.key.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const storageUri = `r2://${this.bucket}/${safeKey}`;
    const sha256Hash = sha256Hex(params.content);
    const sizeBytes = Buffer.byteLength(params.content, "utf8");

    // Check if object already exists to enforce immutability
    const existing = await this.getImmutableObject(storageUri);
    if (existing) {
      if (existing.sha256Hash !== sha256Hash) {
        throw new ImmutableArtifactMutationError(
          `R2 immutable artifact conflict for ${storageUri}: existing hash ${existing.sha256Hash} !== ${sha256Hash}`,
        );
      }
      return { storageUri, sha256Hash, sizeBytes, backend: this.backendName };
    }

    const signed = this.signRequest("PUT", safeKey, sha256Hash, {
      "content-type": params.contentType ?? "application/json",
      "if-none-match": "*",
    });
    const res = await this.fetchImpl(signed.url, {
      method: "PUT",
      headers: signed.headers,
      body: params.content,
    });
    if (res.status === 412) {
      // Precondition failed -> object already exists; verify hash matches
      const current = await this.getImmutableObject(storageUri, sha256Hash);
      if (!current) {
        throw new ImmutableArtifactMutationError(`R2 conditional write rejected for ${storageUri}.`);
      }
      return { storageUri, sha256Hash, sizeBytes, backend: this.backendName };
    }
    if (!res.ok) {
      throw new Error(`R2 PUT failed (${res.status}) for ${storageUri}`);
    }

    return { storageUri, sha256Hash, sizeBytes, backend: this.backendName };
  }

  async getImmutableObject(storageUri: string, expectedSha256?: string) {
    const prefix = `r2://${this.bucket}/`;
    const key = storageUri.startsWith(prefix)
      ? storageUri.slice(prefix.length)
      : storageUri.replace(/^dcc-storage:\/\/data\/memory\/snapshots\/machine\//, "");

    const emptyPayloadHash = sha256Hex("");
    const signed = this.signRequest("GET", key, emptyPayloadHash);
    const res = await this.fetchImpl(signed.url, {
      method: "GET",
      headers: signed.headers,
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`R2 GET failed (${res.status}) for ${storageUri}`);
    }
    const content = await res.text();
    const sha256Hash = sha256Hex(content);
    if (expectedSha256 && sha256Hash !== expectedSha256) {
      throw new Error(
        `R2 artifact hash mismatch for ${storageUri}: expected ${expectedSha256}, got ${sha256Hash}`,
      );
    }
    return { content, sha256Hash, backend: this.backendName };
  }
}

function sanitizePgIdentifier(identifier: string): string {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
    throw new Error(`Unsafe PostgreSQL identifier: ${identifier}`);
  }
  return identifier;
}

export function resolveNeonMigrationDatabaseUrl(): string {
  // Prefer owner/unpooled DATABASE_URL for DDL migrations on isolated schemas, or DCC_NONPROD_DATABASE_URL
  const raw = (
    process.env.DCC_MACHINE_NEON_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.DATABASE_URL ||
    process.env.DCC_NONPROD_DATABASE_URL ||
    process.env.DCC_DATABASE_URL ||
    process.env.POSTGRES_URL ||
    ""
  ).trim();
  if (!raw) {
    throw new DurableStorageConfigurationError(
      "NEON_DATABASE_URL_MISSING",
      "Neon Postgres connection string is not configured.",
    );
  }
  return raw;
}

/**
 * Split multi-statement SQL migration file while respecting $$ dollar-quoted PL/pgSQL blocks.
 */
export function splitPostgresStatements(sqlText: string): string[] {
  const statements: string[] = [];
  let current = "";
  let inDollarQuote = false;
  let inSingleQuote = false;

  const lines = sqlText
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");

  for (let i = 0; i < lines.length; i++) {
    const ch = lines[i];
    const next = lines[i + 1];

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

const DCC_MACHINE_TABLE_NAMES = [
  "dcc_machine_entities",
  "dcc_machine_sources",
  "dcc_machine_source_snapshots",
  "dcc_machine_evidence_fragments",
  "dcc_machine_claims",
  "dcc_machine_claim_versions",
  "dcc_machine_claim_conflicts",
  "dcc_machine_rules",
  "dcc_machine_rule_sets",
  "dcc_machine_engines",
  "dcc_machine_engine_versions",
  "dcc_machine_engine_bundles",
  "dcc_machine_evaluations",
  "dcc_machine_evaluation_traces",
  "dcc_machine_retractions",
  "dcc_machine_change_events",
  "dcc_machine_candidate_universes",
  "dcc_machine_signed_receipts",
  "dcc_machine_immutable_objects",
] as const;

const DCC_MACHINE_ENUM_NAMES = [
  "dcc_machine_epistemic_status",
  "dcc_machine_epistemic_kind",
] as const;

function qualifySqlForSchema(stmt: string, schemaName: string): string {
  const s = schemaName;
  let out = stmt;
  for (const table of DCC_MACHINE_TABLE_NAMES) {
    out = out.replace(new RegExp(`"${table}"`, "g"), `"${s}"."${table}"`);
  }
  for (const enumName of DCC_MACHINE_ENUM_NAMES) {
    out = out.replace(new RegExp(`"?\\b${enumName}\\b"?`, "g"), `"${s}"."${enumName}"`);
  }
  out = out.replace(
    /DROP INDEX IF EXISTS "(dcc_machine_[a-z0-9_]+)"/g,
    `DROP INDEX IF EXISTS "${s}"."$1"`,
  );
  out = out.replace(
    /\bdcc_machine_prevent_immutable_mutation\(\)/g,
    `"${s}".dcc_machine_prevent_immutable_mutation()`,
  );
  return out;
}

export class NeonMachineDurableStore implements DurableObjectStore {
  public readonly backendName = "neon_immutable_object_store" as const;
  private readonly sqlClient: ReturnType<typeof neon>;
  public readonly schemaName: string;

  constructor(options?: { connectionString?: string; schemaName?: string }) {
    assertStorageBackendAllowed();
    const conn = options?.connectionString ?? resolveNeonMigrationDatabaseUrl();
    this.sqlClient = neon(conn);
    this.schemaName = sanitizePgIdentifier(
      options?.schemaName ?? process.env.DCC_MACHINE_DB_SCHEMA ?? "dcc_machine_v02_canary",
    );
  }

  private async execInSchema(statement: string, params: unknown[] = []): Promise<any[]> {
    const qualifiedStatement = qualifySqlForSchema(statement, this.schemaName);
    const rows = await (this.sqlClient as any).query(qualifiedStatement, params);
    return Array.isArray(rows) ? rows : (rows?.rows ?? []);
  }

  async ensureIsolatedSchemaExists(): Promise<void> {
    await (this.sqlClient as any).query(`CREATE SCHEMA IF NOT EXISTS "${this.schemaName}"`);
  }

  async dropIsolatedSchemaCascade(): Promise<void> {
    if (this.schemaName === "public") {
      throw new Error("Refusing to drop 'public' schema.");
    }
    await (this.sqlClient as any).query(`DROP SCHEMA IF EXISTS "${this.schemaName}" CASCADE`);
  }

  async runMigrationsUp(): Promise<{
    schemaName: string;
    statementsExecuted: number;
    tablesCreated: string[];
  }> {
    await this.ensureIsolatedSchemaExists();
    const s = this.schemaName;

    const mig0005Path = path.join(process.cwd(), "drizzle", "0005_dcc_machine_layer_v01.sql");
    const mig0006Path = path.join(process.cwd(), "drizzle", "0006_dcc_machine_layer_v02.sql");
    const raw0005 = fs.readFileSync(mig0005Path, "utf8");
    const raw0006 = fs.readFileSync(mig0006Path, "utf8");

    const allStatements = [
      ...splitPostgresStatements(raw0005),
      ...splitPostgresStatements(raw0006),
    ];

    let executed = 0;
    for (const stmt of allStatements) {
      const schemaQualified = qualifySqlForSchema(stmt, s);
      await (this.sqlClient as any).query(schemaQualified);
      executed++;
    }

    const tables = await this.listTablesInSchema();
    return {
      schemaName: this.schemaName,
      statementsExecuted: executed,
      tablesCreated: tables,
    };
  }

  async runMigrationsDown(): Promise<{
    schemaName: string;
    statementsExecuted: number;
    remainingTables: string[];
  }> {
    const s = this.schemaName;
    const down0006Path = path.join(process.cwd(), "drizzle", "0006_dcc_machine_layer_v02.down.sql");
    const down0005Path = path.join(process.cwd(), "drizzle", "0005_dcc_machine_layer_v01.down.sql");
    const rawDown0006 = fs.readFileSync(down0006Path, "utf8");
    const rawDown0005 = fs.readFileSync(down0005Path, "utf8");

    const allStatements = [
      ...splitPostgresStatements(rawDown0006),
      ...splitPostgresStatements(rawDown0005),
    ];

    let executed = 0;
    for (const stmt of allStatements) {
      const schemaQualified = qualifySqlForSchema(stmt, s);
      await (this.sqlClient as any).query(schemaQualified);
      executed++;
    }

    const remainingTables = await this.listTablesInSchema();
    return {
      schemaName: this.schemaName,
      statementsExecuted: executed,
      remainingTables,
    };
  }

  async listTablesInSchema(): Promise<string[]> {
    const rows = await (this.sqlClient as any).query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = $1 ORDER BY table_name ASC`,
      [this.schemaName],
    );
    const list = Array.isArray(rows) ? rows : (rows?.rows ?? []);
    return list.map((r: any) => String(r.table_name));
  }

  async listConstraintsInSchema(): Promise<Array<{ tableName: string; constraintName: string; constraintType: string }>> {
    const rows = await (this.sqlClient as any).query(
      `SELECT table_name, constraint_name, constraint_type
       FROM information_schema.table_constraints
       WHERE table_schema = $1 AND constraint_type IN ('PRIMARY KEY', 'UNIQUE', 'FOREIGN KEY')
       ORDER BY table_name, constraint_name`,
      [this.schemaName],
    );
    const list = Array.isArray(rows) ? rows : (rows?.rows ?? []);
    return list.map((r: any) => ({
      tableName: String(r.table_name),
      constraintName: String(r.constraint_name),
      constraintType: String(r.constraint_type),
    }));
  }

  async putImmutableObject(params: {
    category: ArtifactCategory;
    key: string;
    content: string;
    contentType?: string;
  }) {
    const safeKey = params.key.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storageUri = `dcc-storage://data/memory/snapshots/machine/${params.category}/${safeKey}`;
    const sha256Hash = sha256Hex(params.content);
    const sizeBytes = Buffer.byteLength(params.content, "utf8");

    const existingRows = await this.execInSchema(
      `SELECT sha256_hash FROM "dcc_machine_immutable_objects" WHERE object_uri = $1`,
      [storageUri],
    );
    if (existingRows.length > 0) {
      const existingHash = String(existingRows[0].sha256_hash);
      if (existingHash !== sha256Hash) {
        throw new ImmutableArtifactMutationError(
          `IMMUTABLE_ARTIFACT_MUTATION_FORBIDDEN: Cannot overwrite ${storageUri} (existing hash ${existingHash} !== ${sha256Hash}).`,
        );
      }
      return { storageUri, sha256Hash, sizeBytes, backend: this.backendName };
    }

    await this.execInSchema(
      `INSERT INTO "dcc_machine_immutable_objects" (object_uri, category, sha256_hash, content_type, size_bytes, body_text)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        storageUri,
        params.category,
        sha256Hash,
        params.contentType ?? "application/json",
        sizeBytes,
        params.content,
      ],
    );

    return { storageUri, sha256Hash, sizeBytes, backend: this.backendName };
  }

  async getImmutableObject(storageUri: string, expectedSha256?: string) {
    const rows = await this.execInSchema(
      `SELECT body_text, sha256_hash FROM "dcc_machine_immutable_objects" WHERE object_uri = $1`,
      [storageUri],
    );
    if (rows.length === 0) return null;
    const content = String(rows[0].body_text);
    const sha256Hash = String(rows[0].sha256_hash);
    const computedHash = sha256Hex(content);
    if (computedHash !== sha256Hash || (expectedSha256 && sha256Hash !== expectedSha256)) {
      throw new Error(
        `Durable object integrity mismatch for ${storageUri}: stored=${sha256Hash}, computed=${computedHash}, expected=${expectedSha256 ?? "any"}`,
      );
    }
    return { content, sha256Hash, backend: this.backendName };
  }

  async attemptIllegalOverwriteOrDeleteOnImmutableObject(storageUri: string): Promise<{
    updateBlocked: boolean;
    deleteBlocked: boolean;
    updateError: string;
    deleteError: string;
  }> {
    let updateBlocked = false;
    let deleteBlocked = false;
    let updateError = "";
    let deleteError = "";

    try {
      await this.execInSchema(
        `UPDATE "dcc_machine_immutable_objects" SET body_text = 'tampered' WHERE object_uri = $1`,
        [storageUri],
      );
    } catch (err) {
      updateBlocked = true;
      updateError = err instanceof Error ? err.message : String(err);
    }

    try {
      await this.execInSchema(
        `DELETE FROM "dcc_machine_immutable_objects" WHERE object_uri = $1`,
        [storageUri],
      );
    } catch (err) {
      deleteBlocked = true;
      deleteError = err instanceof Error ? err.message : String(err);
    }

    return { updateBlocked, deleteBlocked, updateError, deleteError };
  }

  async persistSeededKnowledgeState(state: {
    entities: any[];
    sources: any[];
    snapshots: any[];
    fragments: any[];
    claims: any[];
    claimVersions: any[];
    universes: any[];
    rules: any[];
    ruleSets: any[];
    engines: any[];
    engineVersions: any[];
    bundles: any[];
    receipts?: any[];
  }): Promise<{
    entitiesCount: number;
    sourcesCount: number;
    snapshotsCount: number;
    fragmentsCount: number;
    claimsCount: number;
    claimVersionsCount: number;
    universesCount: number;
    bundlesCount: number;
  }> {
    for (const ent of state.entities) {
      await this.execInSchema(
        `INSERT INTO "dcc_machine_entities" (
          id, version, entity_type, canonical_name, jurisdiction, geographic_scope,
          status, valid_from, valid_to, observed_at, retrieved_at, attributes, connected_ids, content_hash
        ) VALUES (
          $1, $2, $3, $4, $5, $6::jsonb,
          $7, $8::timestamptz, $9::timestamptz, $10::timestamptz, $11::timestamptz, $12::jsonb, $13::jsonb, $14
        ) ON CONFLICT (id) DO NOTHING`,
        [
          ent.id,
          ent.version ?? "1.0.0",
          ent.entityType,
          ent.canonicalName,
          ent.jurisdiction ?? null,
          JSON.stringify(ent.geographicScope ?? {}),
          ent.status ?? "verified",
          ent.valid_from ?? "2026-01-01T00:00:00.000Z",
          ent.valid_to ?? null,
          ent.observed_at ?? "2026-01-01T00:00:00.000Z",
          ent.retrieved_at ?? "2026-01-01T00:00:00.000Z",
          JSON.stringify(ent.attributes ?? {}),
          JSON.stringify(ent.connectedIds ?? []),
          ent.contentHash ?? sha256Hex(JSON.stringify(ent)),
        ],
      );
    }

    for (const src of state.sources) {
      await this.execInSchema(
        `INSERT INTO "dcc_machine_sources" (
          id, version, title, organization, authority_tier, canonical_url, jurisdiction,
          retrieval_method, license_or_reuse_status, status, latest_snapshot_id,
          valid_from, valid_to, observed_at, retrieved_at, content_hash
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11,
          $12::timestamptz, $13::timestamptz, $14::timestamptz, $15::timestamptz, $16
        ) ON CONFLICT (id) DO NOTHING`,
        [
          src.id,
          src.version ?? "1.0.0",
          src.title,
          src.organization,
          src.authorityTier,
          src.canonicalUrl,
          src.jurisdiction ?? null,
          src.retrievalMethod,
          src.licenseOrReuseStatus,
          src.status ?? "verified",
          src.latestSnapshotId ?? "snap:unknown",
          src.valid_from ?? "2026-01-01T00:00:00.000Z",
          src.valid_to ?? null,
          src.observed_at ?? "2026-01-01T00:00:00.000Z",
          src.retrieved_at ?? "2026-01-01T00:00:00.000Z",
          src.contentHash ?? sha256Hex(JSON.stringify(src)),
        ],
      );
    }

    for (const snap of state.snapshots) {
      await this.execInSchema(
        `INSERT INTO "dcc_machine_source_snapshots" (
          id, source_id, version, canonical_url, retrieved_at, observed_at,
          valid_from, valid_to, http_status, content_type, retrieval_method,
          license_or_reuse_status, artifact_storage_uri, content_hash, byte_length, status
        ) VALUES (
          $1, $2, $3, $4, $5::timestamptz, $6::timestamptz,
          $7::timestamptz, $8::timestamptz, $9, $10, $11,
          $12, $13, $14, $15, $16
        ) ON CONFLICT (id) DO NOTHING`,
        [
          snap.id,
          snap.sourceId,
          snap.version ?? "1.0.0",
          snap.canonicalUrl,
          snap.retrieved_at ?? "2026-01-01T00:00:00.000Z",
          snap.observed_at ?? snap.retrieved_at ?? "2026-01-01T00:00:00.000Z",
          snap.valid_from ?? "2026-01-01T00:00:00.000Z",
          snap.valid_to ?? null,
          snap.httpStatus ?? 200,
          snap.contentType ?? snap.mimeType ?? "application/json",
          snap.retrievalMethod,
          snap.licenseOrReuseStatus,
          snap.artifactStorageUri ?? snap.storageUri ?? `dcc-storage://${snap.id}`,
          snap.contentHash,
          snap.byteLength ?? 0,
          snap.status ?? "verified",
        ],
      );
    }

    for (const frag of state.fragments) {
      await this.execInSchema(
        `INSERT INTO "dcc_machine_evidence_fragments" (
          id, source_id, snapshot_id, version, locator, excerpt_or_structured_field,
          content_hash, observed_at, retrieved_at, valid_from, valid_to, status
        ) VALUES (
          $1, $2, $3, $4, $5, $6::jsonb,
          $7, $8::timestamptz, $9::timestamptz, $10::timestamptz, $11::timestamptz, $12
        ) ON CONFLICT (id) DO NOTHING`,
        [
          frag.id,
          frag.sourceId,
          frag.snapshotId ?? frag.sourceSnapshotId,
          frag.version ?? "1.0.0",
          frag.locator,
          JSON.stringify(
            frag.excerptOrStructuredField ?? {
              verbatimExcerpt: frag.verbatimExcerpt ?? "",
              structuredFieldPath: frag.structuredFieldPath ?? "$",
              structuredValue: frag.structuredValue ?? null,
            },
          ),
          frag.contentHash,
          frag.observed_at ?? "2026-01-01T00:00:00.000Z",
          frag.retrieved_at ?? "2026-01-01T00:00:00.000Z",
          frag.valid_from ?? "2026-01-01T00:00:00.000Z",
          frag.valid_to ?? null,
          frag.status ?? "verified",
        ],
      );
    }

    for (const clm of state.claims) {
      await this.execInSchema(
        `INSERT INTO "dcc_machine_claims" (id, current_version_id, subject_id, predicate, epistemic_kind, status, has_open_conflict)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET current_version_id = EXCLUDED.current_version_id, status = EXCLUDED.status, has_open_conflict = EXCLUDED.has_open_conflict`,
        [
          clm.id,
          clm.currentVersionId,
          clm.subjectId,
          clm.predicate,
          clm.epistemicKind ?? "fact",
          clm.status ?? "verified",
          Boolean(clm.hasOpenConflict),
        ],
      );
    }

    for (const cv of state.claimVersions) {
      await this.execInSchema(
        `INSERT INTO "dcc_machine_claim_versions" (
          id, claim_id, version_number, epistemic_kind, subject, predicate, typed_value,
          unit_or_currency, geographic_scope, jurisdiction, valid_from, valid_to,
          known_from, known_to, provenance_origin, observed_at, retrieved_at, status,
          source_id, source_organization, canonical_source_url, source_snapshot_id,
          evidence_fragment_id, supporting_fragment, evidence_hash, retrieval_method,
          license_or_reuse_status, superseded_by_version_id, supersedes_version_id,
          retraction_id, withdrawal_info, conflicting_claim_version_ids, verification_approved_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7::jsonb,
          $8, $9::jsonb, $10, $11::timestamptz, $12::timestamptz,
          $13::timestamptz, $14::timestamptz, $15, $16::timestamptz, $17::timestamptz, $18,
          $19, $20, $21, $22,
          $23, $24::jsonb, $25, $26,
          $27, $28, $29,
          $30, $31::jsonb, $32::jsonb, $33
        ) ON CONFLICT (id) DO NOTHING`,
        [
          cv.versionId,
          cv.claimId,
          cv.versionNumber,
          cv.epistemicKind ?? "fact",
          cv.subject,
          cv.predicate,
          JSON.stringify(cv.typedValue),
          cv.unitOrCurrency ?? null,
          JSON.stringify(cv.geographicScope ?? {}),
          cv.jurisdiction ?? null,
          cv.valid_from,
          cv.valid_to ?? null,
          cv.known_from ?? cv.observed_at,
          cv.known_to ?? null,
          cv.provenanceOrigin ?? "curated_seed_fixture",
          cv.observed_at,
          cv.retrieved_at,
          cv.status ?? "verified",
          cv.sourceId,
          cv.sourceOrganization,
          cv.canonicalSourceUrl,
          cv.sourceSnapshotId,
          cv.evidenceFragmentId,
          JSON.stringify(cv.supportingFragment),
          cv.evidenceHash,
          cv.retrievalMethod,
          cv.licenseOrReuseStatus,
          cv.supersededByVersionId ?? null,
          cv.supersedesVersionId ?? null,
          cv.retractionId ?? null,
          JSON.stringify(cv.withdrawalInfo ?? null),
          JSON.stringify(cv.conflictingClaimVersionIds ?? []),
          cv.verificationApprovedBy ?? "dcc-seed-verifier",
        ],
      );
    }

    for (const univ of state.universes) {
      await this.execInSchema(
        `INSERT INTO "dcc_machine_candidate_universes" (
          id, universe_id, version, domain_pack_version, engine_id, engine_version,
          geographic_scope, temporal_scope, inclusion_methodology, sources_consulted,
          included_candidate_ids, known_exclusions, unresolved_coverage_gaps,
          refreshed_at, coverage_status, epistemic_disclaimer, canonical_hash, storage_uri, payload
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7::jsonb, $8::jsonb, $9, $10::jsonb,
          $11::jsonb, $12::jsonb, $13::jsonb,
          $14::timestamptz, $15, $16, $17, $18, $19::jsonb
        ) ON CONFLICT (id) DO NOTHING`,
        [
          `${univ.universeId}@${univ.version}`,
          univ.universeId,
          univ.version,
          univ.domainPackVersion,
          univ.engineId,
          univ.engineVersion,
          JSON.stringify(univ.geographicScope),
          JSON.stringify(univ.temporalScope),
          univ.inclusionMethodology,
          JSON.stringify(univ.sourcesConsulted),
          JSON.stringify(univ.includedCandidateIds),
          JSON.stringify(univ.knownExclusions),
          JSON.stringify(univ.unresolvedCoverageGaps),
          univ.refreshedAt,
          univ.coverageStatus,
          univ.epistemicDisclaimer,
          univ.canonicalHash,
          univ.storageUri,
          JSON.stringify(univ),
        ],
      );
      await this.putImmutableObject({
        category: "universes",
        key: `${univ.universeId.replace(/:/g, "_")}__${univ.version}__${univ.canonicalHash.slice(0, 16)}.json`,
        content: JSON.stringify(univ),
      });
    }

    for (const rule of state.rules) {
      await this.execInSchema(
        `INSERT INTO "dcc_machine_rules" (id, version, engine_id, rule_kind, title, description, severity_or_weight, reason_code, claim_version_dependencies, ir_expression, remediation_hint, status, content_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11, $12, $13)
         ON CONFLICT (id) DO NOTHING`,
        [
          rule.id,
          rule.version,
          rule.engineId,
          rule.ruleKind,
          rule.title,
          rule.description,
          String(rule.severityOrWeight ?? 0),
          rule.reasonCode,
          JSON.stringify(rule.claimVersionDependencies ?? []),
          JSON.stringify(rule.when ?? {}),
          rule.remediationHint ?? "",
          rule.status ?? "verified",
          rule.contentHash,
        ],
      );
    }

    for (const rs of state.ruleSets) {
      await this.execInSchema(
        `INSERT INTO "dcc_machine_rule_sets" (id, engine_id, version, rule_ids, claim_version_dependencies, content_hash)
         VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6)
         ON CONFLICT (id) DO NOTHING`,
        [
          rs.id,
          rs.engineId,
          rs.version,
          JSON.stringify(rs.ruleIds ?? []),
          JSON.stringify(rs.claimVersionDependencies ?? []),
          rs.contentHash,
        ],
      );
    }

    for (const eng of state.engines) {
      await this.execInSchema(
        `INSERT INTO "dcc_machine_engines" (id, title, domain_category, destination_entity_id, active_version, previous_active_version, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET active_version = EXCLUDED.active_version, previous_active_version = EXCLUDED.previous_active_version`,
        [
          eng.id,
          eng.title,
          eng.domainCategory,
          eng.destinationEntityId,
          eng.activeVersion,
          eng.previousActiveVersion ?? null,
          eng.status ?? "verified",
        ],
      );
    }

    for (const ev of state.engineVersions) {
      await this.execInSchema(
        `INSERT INTO "dcc_machine_engine_versions" (id, engine_id, version, rule_set_id, source_revision, bundle_hash, manifest, status, published_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9::timestamptz)
         ON CONFLICT (id) DO NOTHING`,
        [
          ev.id,
          ev.engineId,
          ev.version,
          ev.ruleSetId,
          ev.sourceRevision,
          ev.bundleHash,
          JSON.stringify(ev.manifest),
          ev.status ?? "verified",
          ev.published_at,
        ],
      );
    }

    for (const b of state.bundles) {
      await this.execInSchema(
        `INSERT INTO "dcc_machine_engine_bundles" (id, engine_id, version, bundle_hash, storage_uri, manifest, ir_bundle)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb)
         ON CONFLICT (id) DO NOTHING`,
        [
          b.id,
          b.engineId,
          b.version,
          b.bundleHash,
          b.storageUri,
          JSON.stringify(b.manifest),
          JSON.stringify(b),
        ],
      );
      await this.putImmutableObject({
        category: "bundles",
        key: `${b.engineId}__${b.version}__${b.bundleHash.slice(0, 16)}.json`,
        content: JSON.stringify(b),
      });
    }

    return {
      entitiesCount: state.entities.length,
      sourcesCount: state.sources.length,
      snapshotsCount: state.snapshots.length,
      fragmentsCount: state.fragments.length,
      claimsCount: state.claims.length,
      claimVersionsCount: state.claimVersions.length,
      universesCount: state.universes.length,
      bundlesCount: state.bundles.length,
    };
  }

  async persistSignedReceiptAndEvaluation(params: {
    evaluationRunId: string;
    traceRunId: string;
    evaluationFingerprint: string;
    receipt: any;
    evaluationRecord: any;
    traceRecord: any;
  }): Promise<void> {
    const r = params.receipt;
    const cp = r.canonicalPayload ?? r.payload;
    await this.execInSchema(
      `INSERT INTO "dcc_machine_evaluations" (
        id, evaluation_run_id, trace_run_id, evaluation_fingerprint, receipt_id,
        universe_id, universe_version, valid_at, known_at, engine_id, engine_version,
        bundle_hash, normalized_input_hash, result_hash, trace_id, trace_hash,
        decision_state, recommended_candidate_id, reason_codes, reference_ids, evaluated_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8::timestamptz, $9::timestamptz, $10, $11,
        $12, $13, $14, $15, $16,
        $17, $18, $19::jsonb, $20::jsonb, $21::timestamptz
      ) ON CONFLICT (id) DO NOTHING`,
      [
        params.evaluationRunId,
        params.evaluationRunId,
        params.traceRunId,
        params.evaluationFingerprint,
        r.receiptId,
        cp.candidateUniverseId,
        cp.candidateUniverseVersion,
        cp.validAt,
        cp.knownAt,
        cp.engineId,
        cp.engineVersion,
        cp.bundleHash,
        cp.normalizedInputHash,
        cp.resultHash,
        params.traceRunId,
        cp.traceHash,
        cp.decisionState,
        cp.recommendedCandidateId ?? null,
        JSON.stringify(params.evaluationRecord.reasonCodes ?? []),
        JSON.stringify(params.evaluationRecord.referenceIds ?? []),
        r.issuedAt,
      ],
    );

    await this.execInSchema(
      `INSERT INTO "dcc_machine_evaluation_traces" (
        id, trace_run_id, evaluation_run_id, evaluation_fingerprint, valid_at, known_at,
        evaluation_id, engine_id, engine_version, trace_hash, candidate_traces,
        rule_executions, resolved_claim_versions, conflicts_encountered, unknown_fields
      ) VALUES (
        $1, $2, $3, $4, $5::timestamptz, $6::timestamptz,
        $7, $8, $9, $10, $11::jsonb,
        $12::jsonb, $13::jsonb, $14::jsonb, $15::jsonb
      ) ON CONFLICT (id) DO NOTHING`,
      [
        params.traceRunId,
        params.traceRunId,
        params.evaluationRunId,
        params.evaluationFingerprint,
        cp.validAt,
        cp.knownAt,
        params.evaluationRunId,
        cp.engineId,
        cp.engineVersion,
        cp.traceHash,
        JSON.stringify(params.traceRecord.candidateTraces ?? []),
        JSON.stringify([]),
        JSON.stringify(params.traceRecord.resolvedClaimVersionIds ?? []),
        JSON.stringify(params.traceRecord.conflictsEncountered ?? []),
        JSON.stringify(params.traceRecord.unknownFields ?? []),
      ],
    );

    await this.execInSchema(
      `INSERT INTO "dcc_machine_signed_receipts" (
        receipt_id, evaluation_run_id, trace_run_id, evaluation_fingerprint,
        engine_id, engine_version, bundle_hash, universe_id, universe_version, universe_hash,
        valid_at, known_at, normalized_input_hash, result_hash, trace_hash,
        decision_state, recommended_candidate_id, key_id, algorithm, signature,
        issued_at, public_key_discovery_uri, epistemic_limitation_statement,
        canonical_payload, receipt_envelope
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8, $9, $10,
        $11::timestamptz, $12::timestamptz, $13, $14, $15,
        $16, $17, $18, $19, $20,
        $21::timestamptz, $22, $23,
        $24::jsonb, $25::jsonb
      ) ON CONFLICT (receipt_id) DO NOTHING`,
      [
        r.receiptId,
        params.evaluationRunId,
        params.traceRunId,
        params.evaluationFingerprint,
        cp.engineId,
        cp.engineVersion,
        cp.bundleHash,
        cp.candidateUniverseId,
        cp.candidateUniverseVersion,
        cp.candidateUniverseHash,
        cp.validAt,
        cp.knownAt,
        cp.normalizedInputHash,
        cp.resultHash,
        cp.traceHash,
        cp.decisionState,
        cp.recommendedCandidateId ?? null,
        r.keyId,
        r.algorithm,
        r.signature,
        r.issuedAt,
        r.publicKeyDiscoveryUri,
        r.epistemicLimitationStatement,
        JSON.stringify(cp),
        JSON.stringify(r),
      ],
    );
  }

  async readPersistedSummaryFromNewInstance(): Promise<{
    entitiesCount: number;
    claimsCount: number;
    claimVersionsCount: number;
    universesCount: number;
    bundlesCount: number;
    immutableObjectsCount: number;
    receiptsCount: number;
    evaluationsCount: number;
    sampleBundle: Record<string, unknown> | null;
    sampleUniverse: Record<string, unknown> | null;
    sampleReceipt: Record<string, unknown> | null;
  }> {
    const countTable = async (tableName: string) => {
      const rows = await this.execInSchema(`SELECT COUNT(*)::int AS cnt FROM "${tableName}"`);
      return Number(rows[0]?.cnt ?? 0);
    };

    const [
      entitiesCount,
      claimsCount,
      claimVersionsCount,
      universesCount,
      bundlesCount,
      immutableObjectsCount,
      receiptsCount,
      evaluationsCount,
      bundleRows,
      universeRows,
      receiptRows,
    ] = await Promise.all([
      countTable("dcc_machine_entities"),
      countTable("dcc_machine_claims"),
      countTable("dcc_machine_claim_versions"),
      countTable("dcc_machine_candidate_universes"),
      countTable("dcc_machine_engine_bundles"),
      countTable("dcc_machine_immutable_objects"),
      countTable("dcc_machine_signed_receipts"),
      countTable("dcc_machine_evaluations"),
      this.execInSchema(`SELECT ir_bundle FROM "dcc_machine_engine_bundles" ORDER BY id LIMIT 1`),
      this.execInSchema(`SELECT payload FROM "dcc_machine_candidate_universes" ORDER BY id LIMIT 1`),
      this.execInSchema(`SELECT receipt_envelope FROM "dcc_machine_signed_receipts" ORDER BY created_at DESC LIMIT 1`),
    ]);

    return {
      entitiesCount,
      claimsCount,
      claimVersionsCount,
      universesCount,
      bundlesCount,
      immutableObjectsCount,
      receiptsCount,
      evaluationsCount,
      sampleBundle: bundleRows[0]?.ir_bundle ?? null,
      sampleUniverse: universeRows[0]?.payload ?? null,
      sampleReceipt: receiptRows[0]?.receipt_envelope ?? null,
    };
  }
}
