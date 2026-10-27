import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { POST as postV03EvaluateRoute } from "@/app/api/v1/v03/evaluate/route";
import { GET as getReceiptRoute } from "@/app/api/v1/receipts/[id]/route";
import { POST as postReceiptReplayRoute } from "@/app/api/v1/receipts/[id]/replay/route";
import {
  getV03RuntimeStore,
  setDccMachineV1RuntimeOverride,
} from "@/lib/dcc/machine";

const __filename = fileURLToPath(import.meta.url);

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

async function runChildWriteStep() {
  loadEnvLocal();
  setDccMachineV1RuntimeOverride(true);

  const evalReq = new Request(
    "https://www.destinationcommandcenter.com/api/v1/v03/evaluate",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        engineId: "denver-to-mountain-transportation",
        validAt: "2026-12-20T15:00:00.000Z",
        constraints: {
          corridorRouteId: "den-winter-park",
          passengerCount: 4,
          serviceType: "private",
        },
      }),
    },
  );
  const evalRes = await postV03EvaluateRoute(evalReq);
  assert.equal(evalRes.status, 200);
  const evalBody = (await evalRes.json()) as Record<string, any>;

  const output = {
    step: "write",
    pid: process.pid,
    receiptId: String(evalBody.evaluation.receiptId),
    recommendedCandidateLegacyCode: String(
      evalBody.evaluation.recommendedCandidateLegacyCode,
    ),
    originalResultHash: String(evalBody.evaluation.resultHash),
    originalTraceHash: String(evalBody.evaluation.traceHash),
    evaluationFingerprint: String(evalBody.evaluation.evaluationFingerprint),
  };
  process.stdout.write(`__CHILD_JSON_START__${JSON.stringify(output)}__CHILD_JSON_END__\n`);
}

async function runChildReadStep(receiptId: string) {
  loadEnvLocal();
  setDccMachineV1RuntimeOverride(true);

  const store = getV03RuntimeStore();
  // Prove this is a brand-new OS process with an empty in-memory receipt map prior to Neon lookup
  assert.equal(
    store.receiptsById.size,
    0,
    "Fresh OS child process must start with zero in-memory receipts",
  );
  assert.equal(store.receiptsById.has(receiptId), false);

  const getRes = await getReceiptRoute(
    new Request(
      `https://www.destinationcommandcenter.com/api/v1/receipts/${encodeURIComponent(receiptId)}`,
    ),
    { params: Promise.resolve({ id: receiptId }) },
  );
  assert.equal(getRes.status, 200);
  const getBody = (await getRes.json()) as Record<string, any>;
  assert.equal(getBody.receipt.receiptId, receiptId);

  const output = {
    step: "read",
    pid: process.pid,
    initialInMemoryReceiptCount: 0,
    retrievedReceiptId: String(getBody.receipt.receiptId),
    retrievedResultHash: String(getBody.receipt.payload.resultHash),
    retrievedTraceHash: String(getBody.receipt.payload.traceHash),
  };
  process.stdout.write(`__CHILD_JSON_START__${JSON.stringify(output)}__CHILD_JSON_END__\n`);
}

async function runChildReplayStep(
  receiptId: string,
  expectedResultHash: string,
  expectedTraceHash: string,
) {
  loadEnvLocal();
  setDccMachineV1RuntimeOverride(true);

  const store = getV03RuntimeStore();
  // Prove this is a brand-new OS process with an empty in-memory receipt map prior to Neon replay
  assert.equal(
    store.receiptsById.size,
    0,
    "Fresh OS child process for replay must start with zero in-memory receipts",
  );
  assert.equal(store.receiptsById.has(receiptId), false);

  const replayRes = await postReceiptReplayRoute(
    new Request(
      `https://www.destinationcommandcenter.com/api/v1/receipts/${encodeURIComponent(receiptId)}/replay`,
      { method: "POST", body: "{}" },
    ),
    { params: Promise.resolve({ id: receiptId }) },
  );
  assert.equal(replayRes.status, 200);
  const replayBody = (await replayRes.json()) as Record<string, any>;
  assert.equal(replayBody.replay.matchesOriginalHashes, true);
  assert.equal(replayBody.replay.matchesOriginalReceipt, true);
  assert.equal(replayBody.replay.replayedReceiptId, receiptId);
  assert.equal(replayBody.replay.replayResult.resultHash, expectedResultHash);
  assert.equal(replayBody.replay.replayResult.traceHash, expectedTraceHash);

  const output = {
    step: "replay",
    pid: process.pid,
    initialInMemoryReceiptCount: 0,
    replayedReceiptId: String(replayBody.replay.replayedReceiptId),
    replayedResultHash: String(replayBody.replay.replayResult.resultHash),
    replayedTraceHash: String(replayBody.replay.replayResult.traceHash),
    matchesOriginalHashes: Boolean(replayBody.replay.matchesOriginalHashes),
    matchesOriginalReceipt: Boolean(replayBody.replay.matchesOriginalReceipt),
    jwsVerified: Boolean(replayBody.replay.jwsVerified),
  };
  process.stdout.write(`__CHILD_JSON_START__${JSON.stringify(output)}__CHILD_JSON_END__\n`);
}

function spawnIsolatedNodeStep<T>(args: string[]): T {
  const tsxCli = path.join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs");
  const rawOut = execFileSync(process.execPath, [tsxCli, __filename, ...args], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DCC_MACHINE_V1: "1",
    },
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const startIdx = rawOut.indexOf("__CHILD_JSON_START__");
  const endIdx = rawOut.indexOf("__CHILD_JSON_END__");
  if (startIdx < 0 || endIdx < 0) {
    throw new Error(`Child process did not emit JSON payload. Output:\n${rawOut}`);
  }
  const jsonStr = rawOut.slice(startIdx + "__CHILD_JSON_START__".length, endIdx);
  return JSON.parse(jsonStr) as T;
}

export async function runLiveNeonPersistenceAndReplayProofV031() {
  loadEnvLocal();

  // 1. Spawn isolated OS Process A to evaluate and write the receipt to Neon PostgreSQL, then terminate
  const writeResult = spawnIsolatedNodeStep<{
    step: "write";
    pid: number;
    receiptId: string;
    recommendedCandidateLegacyCode: string;
    originalResultHash: string;
    originalTraceHash: string;
    evaluationFingerprint: string;
  }>(["--child-step=write"]);

  // 2. Spawn a genuinely separate OS Process B (fresh V8 heap, empty in-memory maps) to retrieve via GET /api/v1/receipts/[id]
  const readResult = spawnIsolatedNodeStep<{
    step: "read";
    pid: number;
    initialInMemoryReceiptCount: number;
    retrievedReceiptId: string;
    retrievedResultHash: string;
    retrievedTraceHash: string;
  }>(["--child-step=read", `--receipt-id=${writeResult.receiptId}`]);

  // 3. Spawn a third genuinely separate OS Process C (fresh V8 heap, empty in-memory maps) to replay via POST /api/v1/receipts/[id]/replay
  const replayResult = spawnIsolatedNodeStep<{
    step: "replay";
    pid: number;
    initialInMemoryReceiptCount: number;
    replayedReceiptId: string;
    replayedResultHash: string;
    replayedTraceHash: string;
    matchesOriginalHashes: boolean;
    matchesOriginalReceipt: boolean;
    jwsVerified: boolean;
  }>([
    "--child-step=replay",
    `--receipt-id=${writeResult.receiptId}`,
    `--expected-result-hash=${writeResult.originalResultHash}`,
    `--expected-trace-hash=${writeResult.originalTraceHash}`,
  ]);

  assert.notEqual(
    writeResult.pid,
    readResult.pid,
    "Writer and Reader must be genuinely separate OS processes with distinct PIDs",
  );
  assert.notEqual(
    writeResult.pid,
    replayResult.pid,
    "Writer and Replayer must be genuinely separate OS processes with distinct PIDs",
  );
  assert.equal(readResult.initialInMemoryReceiptCount, 0);
  assert.equal(replayResult.initialInMemoryReceiptCount, 0);
  assert.equal(readResult.retrievedReceiptId, writeResult.receiptId);
  assert.equal(replayResult.replayedReceiptId, writeResult.receiptId);
  assert.equal(replayResult.matchesOriginalHashes, true);
  assert.equal(replayResult.matchesOriginalReceipt, true);

  return {
    verified: true,
    multiProcessIsolationVerified: true,
    databaseSchema: "dcc_machine_v03",
    orchestratorPid: process.pid,
    writerProcessPid: writeResult.pid,
    readerProcessPid: readResult.pid,
    replayerProcessPid: replayResult.pid,
    distinctProcessPidsVerified:
      writeResult.pid !== readResult.pid &&
      writeResult.pid !== replayResult.pid &&
      readResult.pid !== replayResult.pid,
    receiptId: writeResult.receiptId,
    recommendedCandidateLegacyCode: writeResult.recommendedCandidateLegacyCode,
    originalResultHash: writeResult.originalResultHash,
    originalTraceHash: writeResult.originalTraceHash,
    replayedResultHash: replayResult.replayedResultHash,
    replayedTraceHash: replayResult.replayedTraceHash,
    matchesOriginalHashes: replayResult.matchesOriginalHashes,
    jwsVerified: replayResult.jwsVerified,
  };
}

const childStepArg = process.argv.find((a) => a.startsWith("--child-step="))?.split("=")[1];
if (childStepArg === "write") {
  runChildWriteStep().catch((err) => {
    console.error(err);
    process.exit(1);
  });
} else if (childStepArg === "read") {
  const receiptId =
    process.argv.find((a) => a.startsWith("--receipt-id="))?.split("=")[1] ?? "";
  runChildReadStep(receiptId).catch((err) => {
    console.error(err);
    process.exit(1);
  });
} else if (childStepArg === "replay") {
  const receiptId =
    process.argv.find((a) => a.startsWith("--receipt-id="))?.split("=")[1] ?? "";
  const expectedResultHash =
    process.argv.find((a) => a.startsWith("--expected-result-hash="))?.split("=")[1] ?? "";
  const expectedTraceHash =
    process.argv.find((a) => a.startsWith("--expected-trace-hash="))?.split("=")[1] ?? "";
  runChildReplayStep(receiptId, expectedResultHash, expectedTraceHash).catch((err) => {
    console.error(err);
    process.exit(1);
  });
} else if (
  typeof process !== "undefined" &&
  process.argv[1] &&
  process.argv[1].includes("verify-neon-persistence-replay-v031")
) {
  runLiveNeonPersistenceAndReplayProofV031()
    .then((res) => {
      console.log(JSON.stringify(res, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error("LIVE NEON MULTI-PROCESS PERSISTENCE & REPLAY PROOF FAILED:", err);
      process.exit(1);
    });
}
