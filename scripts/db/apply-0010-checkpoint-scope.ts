import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { Client, neonConfig } from "@neondatabase/serverless";

const MIGRATION_ID = "0010_dcc_checkpoint_scope_and_rewind";
const MIGRATION_SQL_PATH = path.join(
  process.cwd(),
  "drizzle",
  `${MIGRATION_ID}.sql`,
);

function parseDirectMigrationUrl(target: "preview" | "production"): string {
  const raw = (
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL ||
    ""
  )
    .trim()
    .replace(/^['"]|['"]$/g, "");
  if (!raw) {
    throw new Error("Missing DATABASE_URL_UNPOOLED / DATABASE_URL for migration 0010.");
  }
  const parsed = new URL(raw);
  parsed.hostname = parsed.hostname.replace(/-pooler\./, ".");
  if (parsed.hostname.includes("-pooler")) {
    throw new Error(`Refusing pooled connection host for migration 0010: ${parsed.hostname}`);
  }
  const dbName = parsed.pathname.replace(/^\//, "");
  if (target === "preview" && dbName !== "neondb_nonprod") {
    throw new Error(
      `Refusing non-preview database '${dbName}' when --target=preview is required.`,
    );
  }
  if (target === "production" && dbName !== "neondb") {
    throw new Error(
      `Refusing database '${dbName}' when --target=production is requested.`,
    );
  }
  parsed.searchParams.delete("channel_binding");
  return parsed.toString();
}

async function main() {
  const args = process.argv.slice(2);
  const targetArg = args.find((a) => a.startsWith("--target="))?.split("=")[1] || "preview";
  if (targetArg !== "preview" && targetArg !== "production") {
    throw new Error(`Unsupported --target=${targetArg}; expected 'preview' or 'production'.`);
  }
  if (targetArg === "production" && !args.includes("--confirm-production")) {
    throw new Error("Production execution requires explicit --confirm-production flag.");
  }

  const directUrl = parseDirectMigrationUrl(targetArg);
  const parsed = new URL(directUrl);
  if (parsed.hostname.endsWith(".neon.tech") && typeof globalThis.WebSocket === "function") {
    neonConfig.webSocketConstructor = globalThis.WebSocket as any;
    neonConfig.wsProxy = (host: string) => `${host}/v2`;
    neonConfig.useSecureWebSocket = true;
    neonConfig.pipelineConnect = "password";
    neonConfig.forceDisablePgSSL = true;
  }
  const sqlContent = fs.readFileSync(MIGRATION_SQL_PATH, "utf8");
  const checksum = crypto.createHash("sha256").update(sqlContent, "utf8").digest("hex");

  const client = new Client({ connectionString: directUrl });
  await client.connect();
  const startedMs = performance.now();
  try {
    const preLsnRes = await client.query("SELECT pg_current_wal_lsn()::text AS wal_lsn");
    const preMigrationWalLsn = String(preLsnRes.rows[0]?.wal_lsn || "");

    await client.query("BEGIN");
    try {
      await client.query(sqlContent);
      const ledgerRes = await client.query(
        `
          INSERT INTO earthos_schema_migrations (
            migration_id,
            checksum,
            first_applied_at,
            last_applied_at,
            execution_count
          ) VALUES (
            $1,
            $2,
            now(),
            now(),
            1
          )
          ON CONFLICT (migration_id) DO UPDATE SET
            checksum = EXCLUDED.checksum,
            last_applied_at = now(),
            execution_count = earthos_schema_migrations.execution_count + 1
          RETURNING
            migration_id,
            checksum,
            first_applied_at::text AS first_applied_at,
            last_applied_at::text AS last_applied_at,
            execution_count::int AS execution_count
        `,
        [MIGRATION_ID, checksum],
      );
      await client.query("COMMIT");

      const postLsnRes = await client.query("SELECT pg_current_wal_lsn()::text AS wal_lsn");
      const postMigrationWalLsn = String(postLsnRes.rows[0]?.wal_lsn || "");
      const constraintsRes = await client.query(`
        SELECT conname, contype, pg_get_constraintdef(oid) AS definition
        FROM pg_constraint
        WHERE conrelid = 'public.dcc_catalog_refresh_checkpoints'::regclass
        ORDER BY conname
      `);
      const triggersRes = await client.query(`
        SELECT tgname
        FROM pg_trigger
        WHERE tgrelid = 'public.dcc_catalog_refresh_checkpoints'::regclass
          AND NOT tgisinternal
        ORDER BY tgname
      `);
      const ckptRes = await client.query(`
        SELECT stream_key, provider, destination_slug, cursor_value, status, metadata_json, updated_at::text
        FROM dcc_catalog_refresh_checkpoints
        WHERE stream_key IN (
          'viator_availability_schedules_modified_since',
          'viator_products_modified_since',
          'viator_destination_schedule_refresh:juneau'
        )
        ORDER BY stream_key ASC
      `);

      console.log(
        JSON.stringify(
          {
            ok: true,
            target: targetArg,
            host: `${parsed.hostname}${parsed.pathname}`,
            database: parsed.pathname.replace(/^\//, ""),
            preMigrationWalLsn,
            postMigrationWalLsn,
            ddlDurationMs: Number((performance.now() - startedMs).toFixed(2)),
            migrationRecord: ledgerRes.rows[0],
            constraintsAfter: constraintsRes.rows,
            triggersAfter: triggersRes.rows.map((r: any) => r.tgname),
            keyCheckpointsAfter: ckptRes.rows,
          },
          null,
          2,
        ),
      );
    } catch (err) {
      await client.query("ROLLBACK").catch(() => {});
      throw err;
    }
  } finally {
    await client.end().catch(() => {});
  }
}

main().catch((err) => {
  console.error("Migration 0010 failed:", err);
  process.exit(1);
});
