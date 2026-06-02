import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const PAGE = "app/new-orleans/swamp-tours/page.tsx";

test("New Orleans swamp page uses governed WTS handoff with decision context", () => {
  const source = readFileSync(PAGE, "utf8");

  assert.match(source, /buildDccNewOrleansSwampGoUrl/);
  assert.match(source, /decision_corridor:\s*"swamp-tours"/);
  assert.match(source, /decision_action:/);
  assert.match(source, /decision_product:\s*"wts-swamp-plan"/);
  assert.match(source, /decision_option:\s*input\.subtype/);
  assert.match(source, /decision_state:\s*"continuing"/);
  assert.match(source, /Compare live swamp tour options/);
  assert.match(source, /See swamp tour picks/);
  assert.match(source, /Choose the right swamp tour/);
  assert.doesNotMatch(source, /https:\/\/www\.viator\.com\/tours\//);
  assert.doesNotMatch(source, /welcometotheswamp\.com\/plan/);
});
