import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { INDEXABLE_SURFACE_PATHS, isIndexableSurfacePath } from "@/src/data/indexable-surface";

test("the published swamp-tour hub and every guide it links to are eligible for search", () => {
  const hub = readFileSync("app/new-orleans-swamp-tours/page.tsx", "utf8");
  const decisionBlock = hub.split("const DECISIONS = [")[1].split("] as const;")[0];
  const guidePaths = [...decisionBlock.matchAll(/"(\/guides\/[^\"]+)"/g)].map((match) => match[1]);
  assert.equal(guidePaths.length, 6, "expected all six published swamp decisions");
  for (const path of ["/new-orleans-swamp-tours", "/guides", "/guides/category/new-orleans", ...guidePaths]) {
    assert.equal(isIndexableSurfacePath(path), true, `${path} must not receive the proxy's noindex header`);
  }
});

test("the swamp indexing repair does not open utility, unknown, or unpromoted routes", () => {
  for (const path of [
    "/admin", "/internal/telemetry", "/dashboard", "/book", "/checkout", "/track",
    "/guides/not-a-published-guide", "/guides/category/not-a-category",
    "/sedona/jeep-tours", "/new-orleans/swamp-tours", "/grand-canyon",
  ]) {
    assert.equal(isIndexableSurfacePath(path), false, `${path} must stay excluded`);
  }
});

test("the indexability allowlist stays unique and preserves existing public surfaces", () => {
  assert.equal(new Set(INDEXABLE_SURFACE_PATHS).size, INDEXABLE_SURFACE_PATHS.length);
  for (const path of ["/", "/about", "/developers", "/juneau", "/new-orleans", "/location/29.95110/-90.07150"]) {
    assert.equal(isIndexableSurfacePath(path), true);
  }
});
