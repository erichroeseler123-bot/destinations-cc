import test from "node:test";
import assert from "node:assert/strict";
import {
  NETWORK_NODE_BY_ID,
  NETWORK_NODE_REGISTRY,
  resolveNodeForRequest,
  routePatternMatches,
  type NetworkNodeId,
} from "@/lib/network/nodes";

const REQUIRED_NODE_IDS: NetworkNodeId[] = [
  "dcc",
  "wtonot",
  "wts",
  "wta",
  "jfd",
  "gosno",
  "apex",
  "somerset",
  "blue-hills",
  "dells",
  "shuttleya",
  "redrocksfastpass",
  "saveonthestrip",
  "sedona-jeep",
  "lake-tahoe",
  "marketplace-generic",
];

test("network node registry contains the first governed node set", () => {
  const ids = NETWORK_NODE_REGISTRY.map((node) => node.id);
  assert.deepEqual([...ids].sort(), [...REQUIRED_NODE_IDS].sort());
  assert.equal(new Set(ids).size, ids.length);
});

test("every network node has complete Phase 1 governance metadata", () => {
  for (const node of NETWORK_NODE_REGISTRY) {
    assert.equal(node.id, NETWORK_NODE_BY_ID[node.id].id);
    assert.ok(node.displayName, `${node.id} missing displayName`);
    assert.ok(node.hue.name, `${node.id} missing hue name`);
    assert.ok(node.hue.primaryAccent, `${node.id} missing primary accent`);
    assert.ok(node.hue.secondaryAccent, `${node.id} missing secondary accent`);
    assert.ok(node.hue.localAccent, `${node.id} missing local accent`);
    assert.ok(node.hue.surfaceTone, `${node.id} missing surface tone`);
    assert.ok(node.brandMode, `${node.id} missing brand mode`);
    assert.ok(node.navItems.length > 0, `${node.id} missing nav items`);
    assert.ok(node.primaryCta, `${node.id} missing primary CTA`);
    assert.ok(node.footerTrustLine, `${node.id} missing footer trust line`);
  }
});

test("public satellite domains resolve to satellite nodes instead of dcc", () => {
  const cases: Array<[string, NetworkNodeId]> = [
    ["www.welcometoneworleanstours.com", "wtonot"],
    ["welcometoneworleanstours.com", "wtonot"],
    ["www.welcometotheswamp.com", "wts"],
    ["juneauflightdeck.com", "jfd"],
    ["welcometoalaskatours.com", "wta"],
    ["gosno.co", "gosno"],
    ["www.welcometoapexlimo.com", "apex"],
    ["shuttletosomersetamphitheater.com", "somerset"],
    ["bluehillsoutpost.com", "blue-hills"],
    ["welcometothedells.com", "dells"],
  ];

  for (const [host, expectedNodeId] of cases) {
    const resolution = resolveNodeForRequest({ host, pathname: "/" });
    assert.equal(resolution.nodeId, expectedNodeId, host);
    assert.equal(resolution.reason, "domain", host);
    assert.notEqual(resolution.nodeId, "dcc", host);
  }
});

test("DCC core routes resolve to dcc on the DCC host", () => {
  for (const pathname of [
    "/",
    "/network",
    "/command",
    "/internal/telemetry",
    "/operator/register",
    "/privacy",
    "/terms",
  ]) {
    const resolution = resolveNodeForRequest({
      host: "www.destinationcommandcenter.com",
      pathname,
    });
    assert.equal(resolution.nodeId, "dcc", pathname);
    assert.equal(resolution.reason, "domain", pathname);
  }
});

test("known customer route families resolve to their intended nodes without host context", () => {
  const cases: Array<[string, NetworkNodeId]> = [
    ["/new-orleans/tours", "wtonot"],
    ["/new-orleans/swamp-tours", "wts"],
    ["/new-orleans/swamp-tours/best-time", "wts"],
    ["/somerset-wi", "somerset"],
    ["/somerset-wi/rivers-edge-campground", "somerset"],
    ["/juneau/helicopter-tours", "jfd"],
    ["/skagway/white-pass-worth-it", "jfd"],
    ["/transportation/colorado/denver-to-vail-shuttle-guide", "gosno"],
    ["/mighty-argo-shuttle", "shuttleya"],
    ["/red-rocks-shuttle-vs-uber", "redrocksfastpass"],
    ["/las-vegas/helicopter-tours", "saveonthestrip"],
    ["/wisconsin-dells-large-group-dinner", "dells"],
    ["/western-wisconsin/stays", "blue-hills"],
    ["/sedona/jeep-tours", "sedona-jeep"],
    ["/lake-tahoe/things-to-do", "lake-tahoe"],
  ];

  for (const [pathname, expectedNodeId] of cases) {
    const resolution = resolveNodeForRequest({ pathname });
    assert.equal(resolution.nodeId, expectedNodeId, pathname);
    assert.equal(resolution.reason, "route", pathname);
  }
});

test("route pattern matching treats exact routes and wildcard families differently", () => {
  assert.equal(routePatternMatches("/", "/network"), false);
  assert.equal(routePatternMatches("/", "/"), true);
  assert.equal(routePatternMatches("/new-orleans/swamp-tours", "/new-orleans/swamp-tours/best"), false);
  assert.equal(routePatternMatches("/new-orleans/swamp-tours/*", "/new-orleans/swamp-tours"), true);
  assert.equal(routePatternMatches("/new-orleans/swamp-tours/*", "/new-orleans/swamp-tours/best"), true);
});

test("unknown visible route families fall back to marketplace-generic until assigned", () => {
  const resolution = resolveNodeForRequest({ pathname: "/unassigned/future-route" });
  assert.equal(resolution.nodeId, "marketplace-generic");
  assert.equal(resolution.reason, "fallback");
});
