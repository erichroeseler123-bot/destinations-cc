import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import CruisePortAuthorityPage from "@/app/dcc/cruise-ports/[marketId]/page";
import NetworkPage from "@/app/network/page";
import {
  CRUISE_PORT_TELEMETRY_EVENTS,
  listDccCruisePortEntrypoints,
} from "@/lib/dcc/cruisePortAuthority";

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ");
}

async function renderCruisePortPage(marketId: string) {
  const element = await CruisePortAuthorityPage({
    params: Promise.resolve({ marketId }),
  });

  return normalizeWhitespace(
    renderToStaticMarkup(element),
  );
}

test("DCC cruise-port authority registry classifies all queued markets honestly", () => {
  const entrypoints = listDccCruisePortEntrypoints();

  assert.deepEqual(
    entrypoints.map((entrypoint) => entrypoint.id),
    [
      "port-canaveral-orlando",
      "portmiami",
      "nassau",
      "port-everglades-fort-lauderdale",
      "cozumel",
    ],
  );

  for (const entrypoint of entrypoints) {
    assert.match(entrypoint.dccAuthorityPath, /^\/dcc\/cruise-ports\//);
    assert.equal(entrypoint.providerMode, "needs_market_build");
    assert.equal(entrypoint.completionStatus, "needs_domain");
    assert.notEqual(entrypoint.completionStatus, "juneau_standard_live");
    assert.equal(entrypoint.travelMarketTemplateStatus, "not_configured");
    assert.equal(entrypoint.productLanes.length >= 5, true);
    assert.deepEqual(entrypoint.expectedTelemetryEvents, CRUISE_PORT_TELEMETRY_EVENTS);
    assert(!entrypoint.providerMode.includes("demo"));
    assert(!entrypoint.providerMode.includes("sample"));
  }
});

test("DCC cruise-port authority pages render authority content without booking surfaces", async () => {
  for (const entrypoint of listDccCruisePortEntrypoints()) {
    const html = await renderCruisePortPage(entrypoint.id);

    assert.match(html, new RegExp(entrypoint.portName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(html, /DCC cruise-port authority/);
    assert.match(html, /TravelMarket queue/);
    assert.match(html, /needs_market_build/);
    assert.match(html, /needs_domain/);
    assert.match(html, /Product lanes to implement/);
    assert.match(html, /Launch gate/);

    for (const lane of entrypoint.productLanes) {
      assert.ok(html.includes(lane), `${entrypoint.id} missing lane ${lane}`);
    }

    assert.doesNotMatch(html, /juneau_standard_live/);
    assert.doesNotMatch(html, /Check Availability/i);
    assert.doesNotMatch(html, /\/tours\//);
    assert.doesNotMatch(html, /href="#"/);
    assert.doesNotMatch(html, /booking_url/);
    assert.doesNotMatch(html, /fake booking/i);
    assert.doesNotMatch(html, /product card/i);
    assert.doesNotMatch(html, /demo inventory/i);
    assert.doesNotMatch(html, /sample inventory/i);
    assert.doesNotMatch(html, /coming soon/i);
    assert.doesNotMatch(html, /provider links under review/i);
  }
});

test("existing active DCC route files remain present", () => {
  for (const routeFile of [
    "app/internal/telemetry/page.tsx",
    "app/command/page.tsx",
    "app/network/page.tsx",
    "app/tours/page.tsx",
  ]) {
    assert.equal(fs.existsSync(routeFile), true, `${routeFile} must remain present.`);
  }
});

test("network page exposes the cruise-port authority queue without booking CTAs", () => {
  const html = normalizeWhitespace(renderToStaticMarkup(React.createElement(NetworkPage)));

  assert.match(html, /Cruise-port authority queue/);
  for (const entrypoint of listDccCruisePortEntrypoints()) {
    assert.ok(html.includes(entrypoint.portName), `${entrypoint.portName} should be linked from network.`);
    assert.ok(html.includes(entrypoint.dccAuthorityPath), `${entrypoint.dccAuthorityPath} should be linked from network.`);
  }
  assert.doesNotMatch(html, /Check Availability/i);
  assert.doesNotMatch(html, /href="#"/);
});
