import test from "node:test";
import assert from "node:assert/strict";
import {
  getRootPathsByPublishState,
  getRootRouteGovernance,
  getRootRouteGovernanceEntries,
} from "@/src/data/route-governance";
import { INDEXABLE_SURFACE_PATHS } from "@/src/data/indexable-surface";
import { VISIBLE_SURFACE_PATHS } from "@/src/data/visible-surface";

test("root route governance keeps path definitions unique", () => {
  const paths = getRootRouteGovernanceEntries().map((entry) => entry.path);
  assert.equal(new Set(paths).size, paths.length);
});

test("indexable surface paths derive from promoted and indexable publish states only", () => {
  assert.deepEqual(
    INDEXABLE_SURFACE_PATHS,
    getRootPathsByPublishState("indexable", "promoted").sort((a, b) => a.localeCompare(b)),
  );
});

test("visible surface paths exclude utility and live-unpromoted routes", () => {
  assert.equal(VISIBLE_SURFACE_PATHS.includes("/book"), false);
  assert.equal(VISIBLE_SURFACE_PATHS.includes("/checkout"), false);
  assert.equal(VISIBLE_SURFACE_PATHS.includes("/track"), false);
  assert.equal(VISIBLE_SURFACE_PATHS.includes("/colorado/what-to-do-if-rafting-is-canceled"), false);
  assert.equal(VISIBLE_SURFACE_PATHS.includes("/how-to-get-to-argo-cable-car-from-denver"), false);
  assert.equal(getRootRouteGovernance("/book")?.publishState, "live_unpromoted");
  assert.equal(getRootRouteGovernance("/book")?.networkRole, "utility");
  assert.equal(
    getRootRouteGovernance("/colorado/what-to-do-if-rafting-is-canceled")?.publishState,
    "live_unpromoted",
  );
});

test("newly promoted corridor routes stay governed by publish-state metadata", () => {
  for (const pathname of [
    "/lake-tahoe/things-to-do",
    "/new-orleans/swamp-tours",
    "/denver/weed-airport-pickup",
  ]) {
    const entry = getRootRouteGovernance(pathname);
    assert.equal(entry?.publishState, "promoted", `expected ${pathname} to be promoted`);
    assert.equal(INDEXABLE_SURFACE_PATHS.includes(pathname), true, `expected ${pathname} to be indexable`);
    assert.equal(VISIBLE_SURFACE_PATHS.includes(pathname), true, `expected ${pathname} to be visible`);
  }
});

test("verified cruise-port proxy routes are visible without promoting expansion candidates", () => {
  for (const pathname of [
    "/cruise-ports/port-canaveral",
    "/cruise-ports/portmiami",
    "/cruise-ports/nassau",
    "/cruise-ports/port-everglades",
    "/cruise-ports/cozumel",
    "/cruise-ports/key-west",
  ]) {
    const entry = getRootRouteGovernance(pathname);
    assert.equal(entry?.publishState, "indexable", `expected ${pathname} to be indexable`);
    assert.equal(entry?.networkRole, "dcc", `expected ${pathname} to remain a DCC proxy surface`);
    assert.equal(entry?.handoffPolicy, "outbound_only", `expected ${pathname} to hand off into TravelMarket`);
    assert.equal(INDEXABLE_SURFACE_PATHS.includes(pathname), true, `expected ${pathname} to be indexable`);
    assert.equal(VISIBLE_SURFACE_PATHS.includes(pathname), true, `expected ${pathname} to be visible`);
  }

  for (const pathname of [
    "/cruise-ports/st-thomas",
    "/cruise-ports/san-juan",
    "/cruise-ports/costa-maya",
    "/cruise-ports/roatan",
    "/cruise-ports/belize-city",
    "/cruise-ports/grand-cayman",
  ]) {
    assert.equal(getRootRouteGovernance(pathname), null);
    assert.equal(VISIBLE_SURFACE_PATHS.includes(pathname), false);
  }
});

test("selected Red Rocks decision pages stay indexable and governed", () => {
  for (const pathname of [
    "/red-rocks-shuttle-vs-uber",
    "/how-to-get-to-red-rocks-without-parking-hassle",
  ]) {
    const entry = getRootRouteGovernance(pathname);
    assert.equal(entry?.publishState, "indexable", `expected ${pathname} to be indexable`);
    assert.equal(entry?.networkRole, "dcc", `expected ${pathname} to remain a DCC decision page`);
    assert.equal(entry?.handoffPolicy, "outbound_only", `expected ${pathname} to hand off booking intent`);
    assert.equal(INDEXABLE_SURFACE_PATHS.includes(pathname), true, `expected ${pathname} to be indexable`);
    assert.equal(VISIBLE_SURFACE_PATHS.includes(pathname), true, `expected ${pathname} to be visible`);
  }
});

test("Red Rocks feeder pages stay narrow, indexable, and governed", () => {
  for (const pathname of [
    "/red-rocks-shuttle-cost",
    "/red-rocks-shuttle-from-denver",
    "/red-rocks-shuttle-pickup-locations",
    "/uber-after-red-rocks",
    "/red-rocks-parking-cost",
  ]) {
    const entry = getRootRouteGovernance(pathname);
    assert.equal(entry?.publishState, "indexable", `expected ${pathname} to be indexable`);
    assert.equal(entry?.networkRole, "dcc", `expected ${pathname} to remain a DCC feeder page`);
    assert.equal(entry?.handoffPolicy, "outbound_only", `expected ${pathname} to funnel into decision/execution`);
    assert.equal(INDEXABLE_SURFACE_PATHS.includes(pathname), true, `expected ${pathname} to be indexable`);
    assert.equal(VISIBLE_SURFACE_PATHS.includes(pathname), true, `expected ${pathname} to be visible`);
  }
});
