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

test("LFSE tour highlights generate tracked partner deep links", () => {
  const url = getTrackedTourUrl(
    "Mendenhall Glacier Helicopter Landing & Guided Ice Walk",
    "Juneau",
    "norwegian-jewel"
  );
  assert.ok(url.includes("6251SHOREXICEWALK"), "Must include verified product ID");
  assert.ok(url.includes("mcid=42383"), "Must include Last Frontier mcid");
  assert.ok(url.includes("campaign=last-frontier-ship-norwegian-jewel-juneau"), "Must include structured campaign");
  assert.ok(url.includes("utm_source=lastfrontiershoreexcursions.com"), "Must include utm_source");
});