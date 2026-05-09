import assert from "node:assert/strict";
import test from "node:test";
import { ACTION_CARDS, HUBS, RIVER_OPS_OUTBOUND_TARGETS, RIVER_OPS_TERMINAL, SITE_URL } from "../lib/content";

test("Dells Next Stop MVP has the three physical hubs", () => {
  assert.deepEqual(
    HUBS.map((hub) => hub.id),
    ["downtown-broadway", "parkway", "lake-delton-outskirts"],
  );
});

test("every Dells action card has logistics metadata and a handoff", () => {
  assert.ok(ACTION_CARDS.length >= 6);

  for (const card of ACTION_CARDS) {
    assert.ok(card.parkingFriction);
    assert.ok(card.timeCommitment);
    assert.ok(card.escapeRoute);
    assert.ok(card.href.startsWith("https://"));
  }
});

test("River Ops terminal leads with monetizable non-hotel activity inventory", () => {
  assert.equal(RIVER_OPS_TERMINAL.length, 5);
  assert.equal(RIVER_OPS_TERMINAL[0]?.slug, "jet-boat-adventures");
  assert.deepEqual(
    RIVER_OPS_TERMINAL.map((card) => card.slug),
    [
      "jet-boat-adventures",
      "original-wisconsin-ducks",
      "ghost-boat",
      "sunset-dinner-cruise",
      "upper-dells-boat-tour",
    ],
  );

  for (const card of RIVER_OPS_TERMINAL) {
    assert.ok(card.href.startsWith(`${SITE_URL}/out/wisconsin-dells/`));
    assert.equal(card.href.includes("searchResults"), false);
    assert.notEqual(card.category, "hotel");
  }
});

test("River Ops outbound targets are deterministic product or operator endpoints", () => {
  const targetsBySlug = new Map(RIVER_OPS_OUTBOUND_TARGETS.map((target) => [target.slug, target]));

  assert.equal(targetsBySlug.get("jet-boat-primary")?.targetUrl.includes("ticket-hub/jet-boat.jsp"), true);
  assert.equal(targetsBySlug.get("ducks-primary")?.targetUrl.includes("ticket-hub/ducks.jsp"), true);
  assert.equal(targetsBySlug.get("ghost-boat")?.targetUrl.includes("ticket-hub/ghost-boat.jsp"), true);

  for (const card of RIVER_OPS_TERMINAL) {
    const routeSlug = card.href.split("/").pop();
    assert.ok(routeSlug);
    const target = targetsBySlug.get(routeSlug);
    assert.ok(target, `missing outbound target for ${card.slug}`);
    assert.equal(target.targetUrl.includes("searchResults"), false);
    assert.ok(target.targetUrl.startsWith("https://"));
    assert.ok(target.fallbackUrl.startsWith("https://"));
    assert.ok(target.routeKind === "controlled_operator" || target.routeKind === "marketplace_fallback");
  }
});

test("WTD teaches DCC satellite to Feastly execution continuity", () => {
  const content = JSON.stringify({ ACTION_CARDS, RIVER_OPS_OUTBOUND_TARGETS }).toLowerCase();

  assert.equal(content.includes("kitchen helper"), false);
  assert.ok(content.includes("feastly"));
  assert.ok(content.includes("owned_execution"));
  assert.ok(content.includes("controlled_execution"));
  assert.ok(content.includes("marketplace_fallback"));
});

test("promoted Dells content excludes hotels and waterparks", () => {
  const promotedText = JSON.stringify({ ACTION_CARDS, HUBS, RIVER_OPS_TERMINAL }).toLowerCase();
  assert.equal(promotedText.includes("hotel"), false);
  assert.equal(promotedText.includes("waterpark"), false);
});
