import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { POST as postV03EvaluateRoute } from "@/app/api/v1/v03/evaluate/route";
import { GET as getReceiptRoute } from "@/app/api/v1/receipts/[id]/route";
import { POST as postReceiptReplayRoute } from "@/app/api/v1/receipts/[id]/replay/route";
import {
  getV03RuntimeStore,
  resetV03RuntimeStore,
  setDccMachineV1RuntimeOverride,
} from "@/lib/dcc/machine";

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

export async function runLiveNeonPersistenceAndReplayProofV031() {
  loadEnvLocal();
  setDccMachineV1RuntimeOverride(true);
  resetV03RuntimeStore();

  // Process 1: Issue a signed decision receipt through POST /api/v1/v03/evaluate (persisted to live Neon PostgreSQL)
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
  const receiptId = String(evalBody.evaluation.receiptId);
  const originalResultHash = String(evalBody.evaluation.resultHash);
  const originalTraceHash = String(evalBody.evaluation.traceHash);

  // Process 2 (fresh instance simulation): Clear all in-memory maps (receipts, bundles, universes)
  const store = getV03RuntimeStore();
  store.receiptsById.clear();
  store.bundlesByHash.clear();
  store.universesByHash.clear();
  assert.equal(store.receiptsById.size, 0);
  assert.equal(store.bundlesByHash.size, 0);
  assert.equal(store.universesByHash.size, 0);

  // Retrieve receipt via GET /api/v1/receipts/[id] (reads from live Neon PostgreSQL dcc_machine_v03.signed_decision_receipts)
  const getRes = await getReceiptRoute(
    new Request(
      `https://www.destinationcommandcenter.com/api/v1/receipts/${encodeURIComponent(receiptId)}`,
    ),
    { params: Promise.resolve({ id: receiptId }) },
  );
  assert.equal(getRes.status, 200);
  const getBody = (await getRes.json()) as Record<string, any>;
  assert.equal(getBody.receipt.receiptId, receiptId);

  // Clear in-memory maps again and execute POST /api/v1/receipts/[id]/replay (reads receipt, pinned bundle, and pinned universe from Neon)
  store.receiptsById.clear();
  store.bundlesByHash.clear();
  store.universesByHash.clear();

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
  assert.equal(replayBody.replay.replayResult.resultHash, originalResultHash);
  assert.equal(replayBody.replay.replayResult.traceHash, originalTraceHash);

  return {
    verified: true,
    databaseSchema: "dcc_machine_v03",
    receiptId,
    recommendedCandidateLegacyCode:
      evalBody.evaluation.recommendedCandidateLegacyCode,
    originalResultHash,
    originalTraceHash,
    replayedFromClearedMemoryViaNeon: true,
    matchesOriginalHashes: replayBody.replay.matchesOriginalHashes,
    jwsVerified: replayBody.replay.jwsVerified,
  };
}

if (
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
      console.error("LIVE NEON PERSISTENCE & REPLAY PROOF FAILED:", err);
      process.exit(1);
    });
}
