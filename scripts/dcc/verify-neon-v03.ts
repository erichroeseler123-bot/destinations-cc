import fs from "node:fs";
import path from "node:path";
import {
  checkDistributedRateLimitV03,
  getV03RuntimeStore,
  handleV03EvaluateRequest,
  NeonRelationalLedgerStoreV03,
  resetV03RuntimeStore,
} from "@/lib/dcc/machine";
import { resolveNeonMigrationDatabaseUrl } from "@/lib/dcc/machine/durableStorage";

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

export async function verifyNeonV03SchemaAndAppendOnlyLedger() {
  loadEnvLocal();
  const connUrl = resolveNeonMigrationDatabaseUrl();
  const neonStore = new NeonRelationalLedgerStoreV03({
    connectionString: connUrl,
    schemaName: "dcc_machine_v03",
  });

  // 1. Clean start: run down then up, down, up to prove full reversibility
  await neonStore.runMigrationsDownV03();
  const up1 = await neonStore.runMigrationsUpV03();
  const down1 = await neonStore.runMigrationsDownV03();
  const up2 = await neonStore.runMigrationsUpV03();

  if (down1.remainingTables.length !== 0) {
    throw new Error(
      `Expected 0 tables after 0007 down migration, found: ${down1.remainingTables.join(", ")}`,
    );
  }
  if (up2.tablesCreated.length < 13) {
    throw new Error(
      `Expected at least 13 tables in dcc_machine_v03 after 0007 up migration, found ${up2.tablesCreated.length}`,
    );
  }

  // 2. Append runtime knowledge events to Neon
  resetV03RuntimeStore();
  const runtimeStore = getV03RuntimeStore();
  const events = runtimeStore.knowledgeLedger.getAllEvents();
  const writeLatenciesMs: number[] = [];
  for (const ev of events) {
    const { elapsedMs } = await neonStore.appendKnowledgeEventToNeon(ev);
    writeLatenciesMs.push(elapsedMs);
  }

  // 3. Prove database-level append-only trigger blocks UPDATE and DELETE on dcc_v03_knowledge_events
  const firstEventId = events[0]!.eventId;
  const triggerCheck = await neonStore.verifyAppendOnlyTriggerInNeon(firstEventId);
  if (!triggerCheck.updateBlocked || !triggerCheck.deleteBlocked) {
    throw new Error(
      `Neon append-only trigger check failed: updateBlocked=${triggerCheck.updateBlocked}, deleteBlocked=${triggerCheck.deleteBlocked}`,
    );
  }

  // 4. Prove truncate-and-rebuild of dcc_v03_claim_projections from dcc_v03_knowledge_events
  const rebuild1 = await neonStore.truncateAndRebuildClaimProjectionsInNeon({
    validAtIso: "2026-07-15T12:00:00.000Z",
    knowledgeCutoffIso: "2026-10-26T12:00:00.000Z",
  });
  const rebuild2 = await neonStore.truncateAndRebuildClaimProjectionsInNeon({
    validAtIso: "2026-07-15T12:00:00.000Z",
    knowledgeCutoffIso: "2026-10-26T12:00:00.000Z",
  });
  if (
    rebuild1.projectionDigestSha256 !== rebuild2.projectionDigestSha256 ||
    rebuild1.rebuiltClaimVersionCount === 0
  ) {
    throw new Error("Projection truncate-and-rebuild determinism check failed in Neon.");
  }

  // 5. Persist signing keys & signed JWS receipt to Neon and read back
  const keysPersisted = await neonStore.persistSigningKeysToNeon();
  const keysReadBack = await neonStore.readSigningKeysFromNeon();

  const evalRes = await handleV03EvaluateRequest({
    engineId: "juneau-helicopter-tours",
    validAt: "2026-07-15T12:00:00.000Z",
    inputs: {
      maxSinglePassengerWeightLbs: 220,
      maxBudgetPerPersonUsd: 600,
      requestedFormat: "standard_glacier_walk",
    },
  });
  await neonStore.persistSignedReceiptToNeon(evalRes.receipt);

  // 6. Test distributed rate-limit counter in Neon Postgres
  const rl1 = await checkDistributedRateLimitV03({
    clientKey: "neon-test-client",
    endpoint: "/api/v1/v03/evaluate",
    maxRequests: 2,
    windowMs: 60_000,
    neonDatabaseUrl: connUrl,
    schemaName: "dcc_machine_v03",
  });
  const rl2 = await checkDistributedRateLimitV03({
    clientKey: "neon-test-client",
    endpoint: "/api/v1/v03/evaluate",
    maxRequests: 2,
    windowMs: 60_000,
    neonDatabaseUrl: connUrl,
    schemaName: "dcc_machine_v03",
  });
  const rl3 = await checkDistributedRateLimitV03({
    clientKey: "neon-test-client",
    endpoint: "/api/v1/v03/evaluate",
    maxRequests: 2,
    windowMs: 60_000,
    neonDatabaseUrl: connUrl,
    schemaName: "dcc_machine_v03",
  });

  if (
    rl1.coordinationBackend !== "neon_postgres_distributed" ||
    !rl1.allowed ||
    !rl2.allowed ||
    rl3.allowed
  ) {
    throw new Error(
      `Neon distributed rate limiter check failed: rl1=${rl1.allowed}, rl2=${rl2.allowed}, rl3=${rl3.allowed}`,
    );
  }

  return {
    ok: true,
    verifiedAt: new Date().toISOString(),
    schemaName: "dcc_machine_v03",
    migrations: {
      up1TablesCount: up1.tablesCreated.length,
      downRemainingTablesCount: down1.remainingTables.length,
      up2TablesCount: up2.tablesCreated.length,
      tables: up2.tablesCreated,
    },
    appendOnlyTriggerVerification: triggerCheck,
    projectionRebuildVerification: {
      eventsReplayedCount: rebuild1.eventsReplayedCount,
      rebuiltClaimVersionCount: rebuild1.rebuiltClaimVersionCount,
      rebuild1DigestSha256: rebuild1.projectionDigestSha256,
      rebuild2DigestSha256: rebuild2.projectionDigestSha256,
      deterministicRebuildMatched:
        rebuild1.projectionDigestSha256 === rebuild2.projectionDigestSha256,
    },
    signingKeyPersistence: {
      keysPersisted,
      keysReadBackCount: keysReadBack.length,
      activeKid: keysReadBack[0]?.kid,
    },
    receiptPersistence: {
      persistedReceiptId: evalRes.receiptId,
    },
    distributedRateLimitVerification: {
      coordinationBackend: rl1.coordinationBackend,
      survivesColdStarts: rl1.survivesColdStarts,
      coordinatesAcrossInstances: rl1.coordinatesAcrossInstances,
      request1Allowed: rl1.allowed,
      request2Allowed: rl2.allowed,
      request3BlockedWhenLimit2: !rl3.allowed,
    },
  };
}

const isMainModule =
  typeof process !== "undefined" &&
  process.argv[1] &&
  (process.argv[1].endsWith("verify-neon-v03.ts") ||
    process.argv[1].endsWith("verify-neon-v03"));

if (isMainModule) {
  verifyNeonV03SchemaAndAppendOnlyLedger()
    .then((report) => {
      console.log(JSON.stringify(report, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error("NEON V0.3 VERIFICATION FAILED:", err);
      process.exit(1);
    });
}
