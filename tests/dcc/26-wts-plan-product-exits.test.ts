import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const PLAN_PAGE = "apps/welcometotheswamp/app/plan/page.tsx";

test("WTS plan visible shortlist cards expose attributed product bookHref exits", () => {
  const source = readFileSync(PLAN_PAGE, "utf8");

  assert.match(source, /href=\{product\.bookHref\}/);
  assert.match(source, /data-warm-transfer-click=\{`product_\$\{product\.id\}`\}/);
  assert.match(source, /rel="sponsored noopener noreferrer"/);
  assert.doesNotMatch(source, /href=\{product\.url\}/);
});
