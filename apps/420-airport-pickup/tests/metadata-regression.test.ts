import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));

test("420 homepage stays self-canonical and indexable", () => {
  const pageSource = fs.readFileSync(
    path.join(TEST_DIR, "../app/page.tsx"),
    "utf8",
  );

  assert.match(pageSource, /alternates:\s*\{\s*canonical:\s*"\/"\s*\}/);
  assert.match(pageSource, /robots:\s*\{\s*index:\s*true,\s*follow:\s*true,\s*\}/s);
  assert.match(pageSource, /url:\s*"https:\/\/420friendlyairportpickup\.com\/"/);
});
