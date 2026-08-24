import test from "node:test";
import assert from "node:assert/strict";
import { resolveBinaryDecision } from "../../../lib/decision/binaryDecision";

test("420 airport standard-vs-420 decision uses booking CTA mode", () => {
  const decision = resolveBinaryDecision("standard-vs-420", {
    standardHref: "https://www.destinationcommandcenter.com/checkout?product=airport-pickup",
    enhanced420Href:
      "https://www.destinationcommandcenter.com/checkout?product=airport-dispensary",
  });

  assert.equal(decision.layer, "act");
  assert.equal(decision.choices[0].ctaMode, "booking");
  assert.equal(decision.choices[1].ctaMode, "booking");
});
