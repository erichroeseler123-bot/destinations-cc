import test from "node:test";
import assert from "node:assert/strict";
import { getGovernedRobotsTag } from "@/proxy";
import { INDEXABLE_SURFACE_PATHS } from "@/src/data/indexable-surface";

test("governed document paths emit index-follow only when indexable", () => {
  for (const pathname of ["/", "/sedona/jeep-tours", "/new-orleans/swamp-tours"]) {
    assert.equal(INDEXABLE_SURFACE_PATHS.includes(pathname), true);
    assert.equal(getGovernedRobotsTag(pathname), "index, follow");
  }
});

test("generic document surfaces emit noindex-nofollow when route governance does not expose them", () => {
  for (const pathname of [
    "/grand-canyon",
    "/hoover-dam",
    "/helicopter-tours",
  ]) {
    assert.equal(INDEXABLE_SURFACE_PATHS.includes(pathname), false);
    assert.equal(getGovernedRobotsTag(pathname), "noindex, nofollow");
  }
});

test("non-document paths and go redirects do not receive document robots governance", () => {
  for (const pathname of [
    "/api/public/network-feed",
    "/_next/static/app.js",
    "/favicon.ico",
    "/go/juneau/helicopter",
  ]) {
    assert.equal(getGovernedRobotsTag(pathname), null);
  }
});
