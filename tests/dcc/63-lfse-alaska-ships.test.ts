import test from "node:test";
import assert from "node:assert/strict";
import {
  getAllAlaskaShips,
  getShipBySlug,
  getShipPortPair,
  getTrackedTourUrl,
} from "../../apps/last-frontier-shore-excursions/lib/alaska-ships";

test("LFSE Alaska Ships fleet loads verified ships and port combinations", () => {
  const ships = getAllAlaskaShips();
  assert.ok(ships.length >= 9, "Expected at least 9 verified Alaska cruise ships");

  const jewel = getShipBySlug("norwegian-jewel");
  assert.ok(jewel, "Expected norwegian-jewel in fleet");
  assert.equal(jewel.cruiseLine, "Norwegian Cruise Line");
  assert.ok(jewel.ports["juneau"], "Expected Juneau port in Norwegian Jewel");
  assert.ok(jewel.ports["skagway"], "Expected Skagway port in Norwegian Jewel");
  assert.ok(jewel.ports["ketchikan"], "Expected Ketchikan port in Norwegian Jewel");
});

test("LFSE ship-port pairs contain realistic buffer times and dock logistics", () => {
  const jewelJuneau = getShipPortPair("norwegian-jewel", "juneau");
  assert.ok(jewelJuneau, "Expected Norwegian Jewel + Juneau pair");
  assert.equal(jewelJuneau.port.portName, "Juneau");
  assert.ok(jewelJuneau.port.recommendedBufferMinutes >= 45, "Buffer minutes must be at least 45 minutes");
  assert.ok(jewelJuneau.port.sampleTours.length > 0, "Must have sample tours");

  // Ensure no claims of guaranteed ship return or exact berths
  const notes = jewelJuneau.port.dockLogisticsNotes.toLowerCase();
  assert.ok(!notes.includes("guaranteed return"), "Must not claim guaranteed return");
  assert.ok(!notes.includes("real-time availability"), "Must not claim real-time availability");
});

test("LFSE tour highlights generate tracked partner deep links routed via DCC commerce handoff", () => {
  const url = getTrackedTourUrl(
    "Mendenhall Glacier Helicopter Landing & Guided Ice Walk",
    "Juneau",
    "norwegian-jewel"
  );
  assert.ok(url, "Must return tracked URL");
  assert.ok(
    url.startsWith("https://www.destinationcommandcenter.com/go/commerce/handoff?"),
    `Expected DCC commerce handoff URL, got ${url}`
  );
  const outer = new URL(url);
  assert.equal(outer.searchParams.get("site"), "lastfrontiershoreexcursions.com");
  assert.equal(outer.searchParams.get("provider"), "viator");
  assert.equal(outer.searchParams.get("account"), "P00281144");
  const innerUrl = outer.searchParams.get("url") || "";
  assert.ok(innerUrl.includes("6251SHOREXICEWALK"), "Must include verified product ID");
  assert.ok(innerUrl.includes("mcid=42383"), "Must include Last Frontier mcid");
  assert.ok(innerUrl.includes("campaign=last-frontier-ship-norwegian-jewel-juneau"), "Must include structured campaign");
  assert.ok(innerUrl.includes("utm_source=lastfrontiershoreexcursions.com"), "Must include utm_source");

  const aleutianUrl = getTrackedTourUrl(
    "Bering Sea Crab Fishermen’s Tour aboard the Aleutian Ballad",
    "Ketchikan",
    "royal-princess"
  );
  assert.ok(aleutianUrl, "Aleutian Ballad must be unheld with verified GYG link");
  const aleutianOuter = new URL(aleutianUrl);
  assert.equal(aleutianOuter.searchParams.get("provider"), "getyourguide");
  assert.equal(aleutianOuter.searchParams.get("account"), "F2MMUUH");
  assert.equal(aleutianOuter.searchParams.get("product"), "t598272");
  assert.ok((aleutianOuter.searchParams.get("url") || "").includes("partner_id=F2MMUUH"));
});