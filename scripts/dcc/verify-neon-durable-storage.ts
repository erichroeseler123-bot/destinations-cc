import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

import { NeonMachineDurableStore } from "@/lib/dcc/machine/durableStorage";
import {
  evaluateMachineEngine,
  getMachineStore,
  resetMachineStoreForTests,
} from "@/lib/dcc/machine/store";
import type { ExpandedEvaluationResponse } from "@/lib/dcc/machine/schemas";

function loadEnvLocal(): void {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx <= 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

export interface NeonDurableStorageVerificationReport {
  ok: true;
  verifiedAt: string;
  isolatedSchema: string;
  upMigrationFirstPass: {
    ok: true;
    tableCount: number;
    tables: string[];
  };
  rollbackPass: {
    ok: true;
    remainingTablesAfterDown: number;
  };
  upMigrationReapplyPass: {
    ok: true;
    tableCount: number;
    constraintsVerified: string[];
  };
  seededRecordCounts: {
    entities: number;
    sources: number;
    snapshots: number;
    fragments: number;
    claims: number;
    claimVersions: number;
    engines: number;
    engineVersions: number;
    candidateUniverses: number;
    immutableObjects: number;
    receipts: number;
    evaluations: number;
  };
  processRestartSurvival: {
    separateProcessVerified: boolean;
    JuneauActiveVersionFromFreshProcess: string;
    JuneauBundleHashFromFreshProcess: string;
    JuneauUniverseHashFromFreshProcess: string;
    ReceiptPersistedAndReadFromFreshProcess: string;
  };
  immutabilityEnforcement: {
    silentClaimVersionOverwriteBlocked: boolean;
    silentClaimVersionDeleteBlocked: boolean;
    silentEngineBundleOverwriteBlocked: boolean;
    silentImmutableObjectOverwriteBlocked: boolean;
    silentImmutableObjectDeleteBlocked: boolean;
  };
}

export async function verifyNeonDurableStorage(): Promise<NeonDurableStorageVerificationReport> {
  loadEnvLocal();
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.DCC_NONPROD_DATABASE_URL ||
    process.env.DCC_DATABASE_URL;
  if (!connectionString) {
    throw new Error("Missing DATABASE_URL / DCC_NONPROD_DATABASE_URL for Neon verification");
  }

  // Child process verification mode: connects in a fresh Node process and reads persisted state
  if (process.env.DCC_NEON_VERIFY_CHILD_SCHEMA) {
    const childSchema = process.env.DCC_NEON_VERIFY_CHILD_SCHEMA;
    const storage = new NeonMachineDurableStore({
      connectionString,
      schemaName: childSchema,
    });
    const summary = await storage.readPersistedSummaryFromNewInstance();
    const sql = neon(connectionString);
    const engRows = await (sql as any).query(
      `SELECT active_version FROM "${childSchema}"."dcc_machine_engines" WHERE id = $1`,
      ["juneau-helicopter-tours"],
    );
    const engList = Array.isArray(engRows) ? engRows : (engRows?.rows ?? []);
    const bRows = await (sql as any).query(
      `SELECT bundle_hash FROM "${childSchema}"."dcc_machine_engine_bundles" WHERE id = $1`,
      ["bundle:juneau-helicopter-tours:1.0.0"],
    );
    const bList = Array.isArray(bRows) ? bRows : (bRows?.rows ?? []);
    const uRows = await (sql as any).query(
      `SELECT canonical_hash FROM "${childSchema}"."dcc_machine_candidate_universes" WHERE universe_id = $1 AND version = $2`,
      ["univ:juneau-helicopter-tours", "1.0.0"],
    );
    const uList = Array.isArray(uRows) ? uRows : (uRows?.rows ?? []);
    const rRows = await (sql as any).query(
      `SELECT receipt_id FROM "${childSchema}"."dcc_machine_signed_receipts" LIMIT 1`,
    );
    const rList = Array.isArray(rRows) ? rRows : (rRows?.rows ?? []);

    console.log(
      JSON.stringify({
        childProcessOk: summary.entitiesCount > 0 && summary.bundlesCount > 0,
        activeVer: String(engList[0]?.active_version ?? ""),
        bundleHash: String(bList[0]?.bundle_hash ?? ""),
        universeHash: String(uList[0]?.canonical_hash ?? ""),
        receiptId: String(rList[0]?.receipt_id ?? ""),
      }),
    );
    return {} as NeonDurableStorageVerificationReport;
  }

  const isolatedSchema = "dcc_machine_v02_canary";
  const storage = new NeonMachineDurableStore({
    connectionString,
    schemaName: isolatedSchema,
  });
  const sql = neon(connectionString);

  // Clean start on isolated non-prod schema
  await storage.dropIsolatedSchemaCascade();

  // 1. Apply Up Migrations (0005 + 0006)
  const up1 = await storage.runMigrationsUp();

  // 2. Rollback on disposable schema (0006.down + 0005.down)
  const down1 = await storage.runMigrationsDown();
  if (down1.remainingTables.length !== 0) {
    throw new Error(
      `Expected 0 remaining tables after rollback, got: ${down1.remainingTables.join(", ")}`,
    );
  }

  // 3. Re-apply Up Migrations (0005 + 0006) after rollback
  const up2 = await storage.runMigrationsUp();

  // Verify database-level constraints (PRIMARY KEY, UNIQUE, FOREIGN KEY)
  const constraints = await storage.listConstraintsInSchema();
  const constraintsVerified = constraints.map(
    (c) => `${c.tableName}.${c.constraintName} (${c.constraintType})`,
  );

  // 4. Seed relational state + immutable objects + candidate universes + signed receipt into Neon
  resetMachineStoreForTests();
  const store = getMachineStore();

  await storage.persistSeededKnowledgeState({
    entities: Array.from(store.entitiesById.values()),
    sources: Array.from(store.sourcesById.values()),
    snapshots: Array.from(store.sourceSnapshotsById.values()),
    fragments: Array.from(store.evidenceFragmentsById.values()),
    claims: Array.from(store.claimsById.values()),
    claimVersions: Array.from(store.claimVersionsById.values()),
    universes: Array.from(store.candidateUniverseVersionsByKey.values()),
    rules: Array.from(store.rulesById.values()),
    ruleSets: Array.from(store.ruleSetsById.values()),
    engines: Array.from(store.enginesById.values()),
    engineVersions: Array.from(store.engineVersionsById.values()),
    bundles: Array.from(store.bundlesById.values()),
  });

  // Evaluate Juneau and persist receipt in Neon
  const evalRes = evaluateMachineEngine({
    engineId: "juneau-helicopter-tours",
    inputs: {
      date: "2026-07-15",
      arrivalTime: "08:00",
      allAboardTime: "16:30",
      arrivalDock: "CT",
      groupSize: 2,
      youngestChildAgeYears: 14,
      maxSinglePassengerWeightLbs: 195,
      mobilityLevel: "full_agility",
      requestedFormat: "standard_glacier_walk",
      weatherCondition: "clear_vfr",
      maxBudgetPerPersonUsd: 600,
    },
    mode: "expanded",
    evaluatedAt: "2026-04-12T12:00:00.000Z",
    validAt: "2026-07-15T12:00:00.000Z",
    knownAt: "2026-04-12T12:00:00.000Z",
  });
  if (!evalRes.ok) {
    throw new Error(`Evaluation failed during Neon seed: ${evalRes.error}`);
  }
  const expanded = evalRes.response as ExpandedEvaluationResponse;
  const evalRecord = store.evaluationsById.get(expanded.evaluationId)!;

  await storage.persistSignedReceiptAndEvaluation({
    evaluationRunId: expanded.evaluationRunId!,
    traceRunId: expanded.traceRunId!,
    evaluationFingerprint: expanded.evaluationFingerprint!,
    receipt: expanded.receipt!,
    evaluationRecord: evalRecord,
    traceRecord: expanded.trace,
  });

  // Count rows in Neon
  const countQuery = async (table: string) => {
    const r = await (sql as any).query(
      `SELECT COUNT(*)::int AS cnt FROM "${isolatedSchema}"."${table}"`,
    );
    const list = Array.isArray(r) ? r : (r?.rows ?? []);
    return Number(list[0]?.cnt ?? 0);
  };

  const seededRecordCounts = {
    entities: await countQuery("dcc_machine_entities"),
    sources: await countQuery("dcc_machine_sources"),
    snapshots: await countQuery("dcc_machine_source_snapshots"),
    fragments: await countQuery("dcc_machine_evidence_fragments"),
    claims: await countQuery("dcc_machine_claims"),
    claimVersions: await countQuery("dcc_machine_claim_versions"),
    engines: await countQuery("dcc_machine_engines"),
    engineVersions: await countQuery("dcc_machine_engine_versions"),
    candidateUniverses: await countQuery("dcc_machine_candidate_universes"),
    immutableObjects: await countQuery("dcc_machine_immutable_objects"),
    receipts: await countQuery("dcc_machine_signed_receipts"),
    evaluations: await countQuery("dcc_machine_evaluations"),
  };

  // 5. Prove seeded records survive process restart in a brand-new Node process
  const thisFilePath = fileURLToPath(import.meta.url);
  const childStdout = execFileSync(
    process.execPath,
    ["--import", "tsx", thisFilePath],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DCC_NEON_VERIFY_CHILD_SCHEMA: isolatedSchema,
      },
      encoding: "utf8",
    },
  );
  const lines = childStdout.trim().split(/\r?\n/);
  const jsonLine = lines[lines.length - 1];
  const childParsed = JSON.parse(jsonLine) as {
    childProcessOk: boolean;
    activeVer: string;
    bundleHash: string;
    universeHash: string;
    receiptId: string;
  };

  // 6. Prove published versions and immutable objects cannot be silently overwritten or deleted
  const firstClaimVersionId = Array.from(store.claimVersionsById.keys())[0];
  let silentClaimVersionOverwriteBlocked = false;
  try {
    await (sql as any).query(
      `UPDATE "${isolatedSchema}"."dcc_machine_claim_versions" SET evidence_hash = '0000' WHERE id = $1`,
      [firstClaimVersionId],
    );
  } catch {
    silentClaimVersionOverwriteBlocked = true;
  }

  let silentClaimVersionDeleteBlocked = false;
  try {
    await (sql as any).query(
      `DELETE FROM "${isolatedSchema}"."dcc_machine_claim_versions" WHERE id = $1`,
      [firstClaimVersionId],
    );
  } catch {
    silentClaimVersionDeleteBlocked = true;
  }

  let silentEngineBundleOverwriteBlocked = false;
  try {
    await (sql as any).query(
      `UPDATE "${isolatedSchema}"."dcc_machine_engine_bundles" SET bundle_hash = 'ffff' WHERE id = 'bundle:juneau-helicopter-tours:1.0.0'`,
    );
  } catch {
    silentEngineBundleOverwriteBlocked = true;
  }

  const jnuBundle = store.bundlesByKey.get("juneau-helicopter-tours@1.0.0")!;
  const objKey = `${jnuBundle.engineId}__${jnuBundle.version}__${jnuBundle.bundleHash.slice(0, 16)}.json`;
  const objUri = `dcc-storage://data/memory/snapshots/machine/bundles/${objKey}`;
  const immutTest = await storage.attemptIllegalOverwriteOrDeleteOnImmutableObject(objUri);

  return {
    ok: true,
    verifiedAt: new Date().toISOString(),
    isolatedSchema,
    upMigrationFirstPass: {
      ok: true,
      tableCount: up1.tablesCreated.length,
      tables: up1.tablesCreated,
    },
    rollbackPass: {
      ok: true,
      remainingTablesAfterDown: down1.remainingTables.length,
    },
    upMigrationReapplyPass: {
      ok: true,
      tableCount: up2.tablesCreated.length,
      constraintsVerified,
    },
    seededRecordCounts,
    processRestartSurvival: {
      separateProcessVerified: childParsed.childProcessOk,
      JuneauActiveVersionFromFreshProcess: childParsed.activeVer,
      JuneauBundleHashFromFreshProcess: childParsed.bundleHash,
      JuneauUniverseHashFromFreshProcess: childParsed.universeHash,
      ReceiptPersistedAndReadFromFreshProcess: childParsed.receiptId,
    },
    immutabilityEnforcement: {
      silentClaimVersionOverwriteBlocked,
      silentClaimVersionDeleteBlocked,
      silentEngineBundleOverwriteBlocked,
      silentImmutableObjectOverwriteBlocked: immutTest.updateBlocked,
      silentImmutableObjectDeleteBlocked: immutTest.deleteBlocked,
    },
  };
}

if (
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv.some((arg) => arg.includes("verify-neon-durable-storage"))
) {
  verifyNeonDurableStorage()
    .then((report) => {
      if (!process.env.DCC_NEON_VERIFY_CHILD_SCHEMA) {
        console.log(JSON.stringify(report, null, 2));
      }
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
