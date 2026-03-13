import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import {
  readCruiseProviderHealthSnapshot,
  getCruiseProviderHealthSnapshotStatus,
  getCruiseProviderHealthDiagnostics,
} from "@/lib/dcc/action/cruiseProviderHealth";

test("health snapshot: missing file is stale", () => {
  const tmp = path.join(os.tmpdir(), `missing-${Date.now()}.json`);
  const snapshot = readCruiseProviderHealthSnapshot(tmp);
  const status = getCruiseProviderHealthSnapshotStatus(snapshot, 60);
  assert.equal(status.exists, false);
  assert.equal(status.stale, true);
});

test("health snapshot: fresh snapshot detected", () => {
  const tmp = path.join(os.tmpdir(), `fresh-${Date.now()}.json`);
  fs.writeFileSync(
    tmp,
    JSON.stringify({
      generated_at: new Date().toISOString(),
      timeout_ms: 5000,
      duration_ms: 10,
      totals: { providers_total: 3, providers_configured: 1, live_rows: 2, provider_errors: 0 },
      provider_status: [],
    })
  );
  const snapshot = readCruiseProviderHealthSnapshot(tmp);
  const status = getCruiseProviderHealthSnapshotStatus(snapshot, 60);
  assert.equal(status.exists, true);
  assert.equal(status.stale, false);
});

test("health snapshot: stale snapshot + env max-age override behavior", () => {
  const old = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();
  const snapshot = {
    generated_at: old,
    timeout_ms: 5000,
    duration_ms: 10,
    totals: { providers_total: 3, providers_configured: 1, live_rows: 2, provider_errors: 0 },
    provider_status: [],
  } as any;

  const statusStrict = getCruiseProviderHealthSnapshotStatus(snapshot, 60);
  const statusLoose = getCruiseProviderHealthSnapshotStatus(snapshot, 600);
  assert.equal(statusStrict.stale, true);
  assert.equal(statusLoose.stale, false);
});

test("health snapshot: diagnostics uses normalized keys", () => {
  const old = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
  const snapshot = {
    generated_at: old,
    timeout_ms: 5000,
    duration_ms: 10,
    totals: { providers_total: 3, providers_configured: 1, live_rows: 2, provider_errors: 0 },
    provider_status: [],
  } as any;
  const diagnostics = getCruiseProviderHealthDiagnostics(snapshot, 60);
  assert.equal(typeof diagnostics.source, "string");
  assert.equal(typeof diagnostics.cache_status, "string");
  assert.equal(typeof diagnostics.stale, "boolean");
  assert.ok("last_updated" in diagnostics);
  assert.ok("stale_after" in diagnostics);
  assert.ok("fallback_reason" in diagnostics);
});
