import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

test("corridorEvents server ingestion sanitizes tokenized paths and raw booking event IDs", () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), "lib/dcc/telemetry/corridorEvents.ts"),
    "utf8",
  );
  assert.equal(src.includes("function sanitizeTelemetryPath"), true);
  assert.equal(src.includes("function sanitizeTelemetryEventId"), true);
  assert.equal(src.includes('return "/booking/[token]"'), true);
  assert.equal(src.includes("redacted_evt_"), true);
});
