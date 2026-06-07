import test from "node:test";
import assert from "node:assert/strict";
import { buildNodeClassificationReport } from "@/scripts/dcc/report-node-classification";

test("node classification report includes routes, domains, and findings", () => {
  const report = buildNodeClassificationReport("2026-06-06T00:00:00.000Z");

  assert.equal(report.version, "network-node-classification.v1");
  assert.ok(report.summary.routeCount > 0);
  assert.ok(report.summary.domainCount > 0);
  assert.ok(report.routes.some((route) => route.projectApp === "destinations-cc" && route.routePath === "/"));
  assert.ok(report.domains.some((domain) => domain.domain === "www.destinationcommandcenter.com"));
  assert.ok(Array.isArray(report.findings.satellitePagesInheritingDccChrome));
});

test("DCC core routes report as DCC chrome routes", () => {
  const report = buildNodeClassificationReport("2026-06-06T00:00:00.000Z");
  const command = report.routes.find((route) => route.projectApp === "destinations-cc" && route.routePath === "/command");

  assert.ok(command);
  assert.equal(command.shouldBeNode, "dcc");
  assert.equal(command.currentShell, "dcc-root-chrome");
  assert.equal(command.dccChromeCorrect, true);
  assert.equal(command.brandShellNeeded, false);
});

test("WTONOT public route is reported as brand-shell protected", () => {
  const report = buildNodeClassificationReport("2026-06-06T00:00:00.000Z");
  const wtonot = report.routes.find((route) => route.projectApp === "destinations-cc" && route.routePath === "/new-orleans/tours");

  assert.ok(wtonot);
  assert.equal(wtonot.shouldBeNode, "wtonot");
  assert.equal(wtonot.currentShell, "dcc-root-suppressed-by-host-or-proxy");
  assert.equal(wtonot.brandShellNeeded, false);
});

test("root-hosted satellite routes inherited from DCC are reported as drift", () => {
  const report = buildNodeClassificationReport("2026-06-06T00:00:00.000Z");
  const swamp = report.routes.find((route) => route.projectApp === "destinations-cc" && route.routePath === "/new-orleans/swamp-tours");

  assert.ok(swamp);
  assert.equal(swamp.shouldBeNode, "wts");
  assert.equal(swamp.currentShell, "dcc-root-chrome");
  assert.equal(swamp.brandShellNeeded, true);
  assert.equal(swamp.visualDrift, "likely");
  assert.ok(report.findings.satellitePagesInheritingDccChrome.includes(swamp));
});
