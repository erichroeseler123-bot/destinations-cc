import test from "node:test";
import assert from "node:assert/strict";
import { isAlaskaCruisePortSlug, matchCruiseShip } from "@/lib/dcc/cruise/shipRegistry";
import { normalizeCruiseRow } from "@/lib/dcc/action/cruiseActionProviders/shared";

test("matchCruiseShip resolves aliases to canonical DCC ship identity", () => {
  const match = matchCruiseShip("NCL Bliss");
  assert.ok(match);
  assert.equal(match.cruiseShip, "Norwegian Bliss");
  assert.equal(match.cruiseShipSlug, "norwegian-bliss");
  assert.equal(match.lineSlug, "norwegian-cruise-line");
});

test("normalizeCruiseRow emits canonical ship slug/name when alias is matched", () => {
  const row = normalizeCruiseRow(
    {
      sailing_id: "NCL-ALIAS-1",
      line: "NCL",
      ship: "bliss",
      departure_date: "2026-07-01",
      duration_days: 7,
      ports: [
        { port_name: "Seattle, USA", arrival: "2026-07-01T12:00:00Z", departure: "2026-07-01T18:00:00Z" },
        { port_name: "Seattle, USA", arrival: "2026-07-08T11:00:00Z", departure: "2026-07-08T13:00:00Z" },
      ],
      amenities: { dining: [], entertainment: [], activities: [], wellness: [], other: [] },
    },
    "norwegian"
  );

  assert.ok(row);
  assert.equal(row.ship, "Norwegian Bliss");
  assert.equal(row.ship_slug, "norwegian-bliss");
  assert.equal(row.line_slug, "norwegian-cruise-line");
});

test("isAlaskaCruisePortSlug resolves known alaska ports from registry metadata", () => {
  assert.equal(isAlaskaCruisePortSlug("juneau"), true);
  assert.equal(isAlaskaCruisePortSlug("skagway"), true);
  assert.equal(isAlaskaCruisePortSlug("galveston"), false);
});
