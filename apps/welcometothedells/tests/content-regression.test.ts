import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { BOAT_TOUR_FIT_GUIDE, BOAT_TOUR_ITEMS } from "../app/boat-tours/page";
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
  const promotedText = JSON.stringify({
    ACTION_CARDS,
    HUBS,
    RIVER_OPS_TERMINAL,
    BOAT_TOUR_ITEMS,
    BOAT_TOUR_FIT_GUIDE,
  }).toLowerCase();
  assert.equal(promotedText.includes("hotel"), false);
  assert.equal(promotedText.includes("waterpark"), false);
});

test("DellsLiveNow reserves a minimum-height status shell with aria-live polite instead of returning null and clears aria-busy on failed requests", () => {
  const liveNowSource = fs.readFileSync(
    fileURLToPath(new URL("../app/components/DellsLiveNow.tsx", import.meta.url)),
    "utf8",
  );

  assert.equal(
    /if\s*\(\s*!data\s*\)\s*return\s+null/.test(liveNowSource),
    false,
    "DellsLiveNow must not return null when data is pending hydration",
  );
  assert.equal(
    /aria-busy=\{\s*!data\s*\}/.test(liveNowSource),
    false,
    "DellsLiveNow must not tie aria-busy directly to !data so failed requests clear busy state",
  );
  assert.match(liveNowSource, /aria-live="polite"/);
  assert.match(liveNowSource, /aria-busy=\{isLoading\}/);
  assert.match(liveNowSource, /setStatus\("error"\)/);
  assert.match(liveNowSource, /Weather unavailable/);
  assert.match(liveNowSource, /River data unavailable/);
  assert.match(liveNowSource, /minHeight:\s*"360px"/);
});

test("DellsHomeClient provides explicit aria-label attributes on header primary and quick-jump nav bars with mobile overflow protection", () => {
  const homeClientSource = fs.readFileSync(
    fileURLToPath(new URL("../app/components/DellsHomeClient.tsx", import.meta.url)),
    "utf8",
  );

  assert.match(homeClientSource, /<header[\s\S]*?<nav[\s\S]*?aria-label="Primary navigation"/);
  assert.match(homeClientSource, /<nav[\s\S]*?aria-label="Quick-jump navigation"/);
  assert.match(homeClientSource, /flexWrap:\s*"wrap"/);
  assert.match(homeClientSource, /overflowX:\s*"hidden"/);
});

test("/boat-tours and /first-time include the 60-Second Fit Guide comparing ashore canyon walks, splash/thrill level, duration, and mobility comfort", () => {
  const boatToursSource = fs.readFileSync(
    fileURLToPath(new URL("../app/boat-tours/page.tsx", import.meta.url)),
    "utf8",
  );
  const firstTimeSource = fs.readFileSync(
    fileURLToPath(new URL("../app/first-time/page.tsx", import.meta.url)),
    "utf8",
  );

  assert.match(
    boatToursSource,
    /Upper Dells vs\. Lower Dells vs\. Original Wisconsin Ducks: 60-Second Fit Guide/,
  );
  assert.match(boatToursSource, /overflowX:\s*"hidden"/);
  assert.match(boatToursSource, /overflowWrap:\s*"break-word"/);

  assert.deepEqual(
    BOAT_TOUR_FIT_GUIDE.map((entry) => entry.id),
    [
      "upper-dells-scenic",
      "lower-dells-scenic",
      "original-wisconsin-ducks",
      "jet-boat-adventures",
    ],
  );

  const upperDells = BOAT_TOUR_FIT_GUIDE.find((entry) => entry.id === "upper-dells-scenic");
  assert.ok(upperDells);
  assert.match(upperDells.badge, /Two signature shore landings/i);
  assert.match(upperDells.ashoreWalks, /Witches Gulch/);
  assert.match(upperDells.ashoreWalks, /Stand Rock/);
  assert.match(upperDells.splashThrill, /Scenic sightseeing cruise above the dam/i);
  assert.match(upperDells.duration, /2 hours/);
  assert.match(upperDells.comfort, /leave wheelchairs at the dock/i);
  assert.match(upperDells.comfort, /sit without assistance/i);
  assert.match(upperDells.comfort, /dispatchers/i);
  assert.equal(/transfer.*without assistance|transfer.*unassisted/i.test(upperDells.comfort), false);

  const lowerDells = BOAT_TOUR_FIT_GUIDE.find((entry) => entry.id === "lower-dells-scenic");
  assert.ok(lowerDells);
  assert.match(lowerDells.ashoreWalks, /below the dam.*Rocky Islands.*Hawk's Bill/i);
  assert.match(lowerDells.splashThrill, /Scenic sightseeing cruise below the dam/i);
  assert.match(lowerDells.duration, /1 hour/);
  assert.match(lowerDells.comfort, /leave wheelchairs at the dock/i);
  assert.match(lowerDells.comfort, /sit without assistance/i);
  assert.match(lowerDells.comfort, /dispatchers assist with loading and unloading/i);
  assert.equal(/transfer.*without assistance|transfer.*unassisted/i.test(lowerDells.comfort), false);

  const ducks = BOAT_TOUR_FIT_GUIDE.find((entry) => entry.id === "original-wisconsin-ducks");
  assert.ok(ducks);
  assert.match(ducks.splashThrill, /Land-to-water Duck/i);
  assert.match(ducks.ashoreWalks, /Dells Scenic Park.*Wisconsin River.*Dell Creek.*Lake Delton/i);
  assert.match(ducks.duration, /1 hour/);
  assert.match(ducks.comfort, /leave wheelchairs at the dock/i);
  assert.match(ducks.comfort, /sit without assistance/i);
  assert.match(ducks.comfort, /dispatchers assist with loading and unloading/i);

  const jetBoat = BOAT_TOUR_FIT_GUIDE.find((entry) => entry.id === "jet-boat-adventures");
  assert.ok(jetBoat);
  assert.match(jetBoat.splashThrill, /jet boat/i);
  assert.match(jetBoat.ashoreWalks, /Upper Dells jet boat \(~75 min\).*Witches Gulch/i);
  assert.match(jetBoat.ashoreWalks, /Lower Dells jet boat \(~50 min\).*separate river adventure/i);
  assert.match(jetBoat.duration, /50 minutes on Lower Dells/i);
  assert.match(jetBoat.duration, /75 minutes on Upper Dells/i);
  assert.match(jetBoat.comfort, /ages 4\+/i);
  assert.match(jetBoat.comfort, /age 3 and younger are not permitted/i);
  assert.match(jetBoat.comfort, /2022 rider guide/i);
  assert.match(jetBoat.comfort, /Confirm current rider restrictions/i);
  assert.equal(/40-inch/i.test(jetBoat.comfort), false);

  // Replaced earlier unassisted-transfer assertion because official Dells Boat Tours accessibility guidance states
  // wheelchairs stay at the dock, passengers must sit without assistance, and dispatchers assist with loading/unloading.
  assert.match(
    boatToursSource,
    /Comparing time and boarding needs\?[\s\S]*?Lower Dells Scenic Cruise and Original Wisconsin Ducks[\s\S]*?wheelchairs must remain at the dock[\s\S]*?sit without assistance[\s\S]*?dispatchers assist with\s+loading and unloading[\s\S]*?rather than assuming either trip is step-free/,
  );
  assert.equal(/transfer.*without assistance|transfer.*unassisted/i.test(boatToursSource), false);
  // Operator pages support routes/durations and independent seating with assisted loading, not
  // universal dry, smooth, stair-free, all-ages or extra parking/drying-time promises.
  for (const source of [boatToursSource, firstTimeSource]) {
    assert.equal(/mostly dry|Smooth boat ride|zero canyon stairs|steep ladder|all-ages|2\.5 hours|20–30 extra/i.test(source), false);
  }

  for (const entry of BOAT_TOUR_FIT_GUIDE) {
    assert.ok(entry.ashoreWalks.length > 10);
    assert.ok(entry.splashThrill.length > 10);
    assert.ok(entry.duration.length > 5);
    assert.ok(entry.comfort.length > 10);
    assert.ok(entry.href.startsWith("/out/wisconsin-dells/"));
  }

  assert.match(firstTimeSource, /\/boat-tours#fit-guide/);
  assert.match(firstTimeSource, /Witches Gulch/);
  assert.match(firstTimeSource, /Stand Rock/);
  assert.match(firstTimeSource, /75-minute Upper Dells/);
  assert.match(firstTimeSource, /50-minute Lower Dells/);
  assert.match(firstTimeSource, /60-Second Fit Guide/);
  assert.match(firstTimeSource, /wheelchairs must be left at the dock/i);
  assert.match(firstTimeSource, /sit without assistance/i);
  assert.match(firstTimeSource, /dispatchers assisting with loading and unloading/i);
  assert.equal(/transfer.*without assistance|transfer.*unassisted/i.test(firstTimeSource), false);
});
