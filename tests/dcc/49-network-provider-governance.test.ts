import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const NETWORK_PAGE_SOURCE = readFileSync("app/network/page.tsx", "utf8");

test("network page omits stale broad provider claims", () => {
  for (const staleClaim of [
    "Viator and Rezdy excursion inventory",
    "FareHarbor, Viator, and Rezdy operator inventory",
    "Operators, GetYourGuide, Viator, Rezdy, FareHarbor",
  ]) {
    assert.equal(
      NETWORK_PAGE_SOURCE.includes(staleClaim),
      false,
      `network page should not include stale claim: ${staleClaim}`,
    );
  }
});

test("network page describes governed replaceable fulfillment", () => {
  for (const requiredCopy of [
    "Earth OS",
    "Destination Command Center",
    "Satellite sites",
    "Fulfillment",
    "Fulfillment is replaceable",
    "approved partner",
    "owned checkout",
    "direct operator handoff",
    "GetYourGuide",
  ]) {
    assert.match(NETWORK_PAGE_SOURCE, new RegExp(requiredCopy));
  }
});

