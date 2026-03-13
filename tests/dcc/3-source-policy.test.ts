import test from "node:test";
import assert from "node:assert/strict";
import { loadCruiseSailings, buildCruisePayload } from "@/lib/dcc/internal/cruisePayload";
import { makeSailing } from "./helpers";

test("source policy: cache returns cache rows", async () => {
  const out = await loadCruiseSailings({ policy: "cache" });
  assert.equal(out.source, "cache");
  assert.ok(out.sailings.length >= 1);
});

test("source policy: live falls back to cache when live empty", async () => {
  const out = await loadCruiseSailings({
    policy: "live",
    liveFetcher: async () => ({ sailings: [] }),
  });
  assert.equal(out.source, "cache");
  assert.equal(out.fallback_reason, "live_no_results_fallback_cache");
  assert.ok(out.sailings.length >= 1);
});

test("source policy: hybrid merges and dedupes by sailing_id", async () => {
  const liveRow = makeSailing({ sailing_id: "RCL-ICON-20260705-MIA", source: "live" });
  const out = await loadCruiseSailings({
    policy: "hybrid",
    liveFetcher: async () => ({ sailings: [liveRow] }),
  });

  assert.equal(out.source, "live_api");
  const ids = out.sailings.map((s) => s.sailing_id);
  const uniqueIds = new Set(ids);
  assert.equal(ids.length, uniqueIds.size);
});

test("buildCruisePayload diagnostics reflect fallback path", async () => {
  const payload = await buildCruisePayload({ type: "port", value: "miami", sortMode: "departure" });
  assert.ok(payload.diagnostics.source === "cache" || payload.diagnostics.source === "live_api");
  assert.ok(typeof payload.diagnostics.cache_status === "string");
  assert.ok(typeof payload.diagnostics.stale === "boolean");
  assert.ok("last_updated" in payload.diagnostics);
  assert.ok("stale_after" in payload.diagnostics);
  assert.ok("fallback_reason" in payload.diagnostics);
  assert.ok(typeof payload.summary?.sort_mode === "string");
});
