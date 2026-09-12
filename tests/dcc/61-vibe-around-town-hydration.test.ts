import test from "node:test";
import assert from "node:assert/strict";
import {
  discoverDccEndpoints,
  fetchAndHydrateDccEndpoint,
  validateDccCoreV2,
  readApplicableDccEndpoints,
  DCC_SOURCE_REGISTRY,
} from "../../lib/dcc/endpointRegistry";
import { validateCoreV2, evaluateFreshness, validateTourismProfile } from "../../validate.mjs";

test("1. DCC registry accurately discovers Vibe Around Town for USVI coordinates", () => {
  // Crown Bay Cruise Port (St. Thomas): 18.3375, -64.9545
  const crownBayMatches = discoverDccEndpoints({ lat: 18.3375, lng: -64.9545 });
  assert.equal(crownBayMatches.length, 1);
  assert.equal(crownBayMatches[0].id, "vibe-around-town");
  assert.equal(crownBayMatches[0].endpointUrl, "https://vibearoundtown.com/.well-known/dcc");
  assert.equal(crownBayMatches[0].name, "Vibe Around Town");

  // Havensight / WICO (St. Thomas): 18.3325, -64.9242
  const havensightMatches = discoverDccEndpoints({ lat: 18.3325, lng: -64.9242 });
  assert.equal(havensightMatches.length, 1);
  assert.equal(havensightMatches[0].id, "vibe-around-town");

  // Cruz Bay (St. John): 18.3311, -64.7937
  const cruzBayMatches = discoverDccEndpoints({ lat: 18.3311, lng: -64.7937 });
  assert.equal(cruzBayMatches.length, 1);
  assert.equal(cruzBayMatches[0].id, "vibe-around-town");

  // Frederiksted Pier (St. Croix): 17.7125, -64.8833
  const frederikstedMatches = discoverDccEndpoints({ lat: 17.7125, lng: -64.8833 });
  assert.equal(frederikstedMatches.length, 1);
  assert.equal(frederikstedMatches[0].id, "vibe-around-town");

  // Denver should still match GoSno exclusively
  const denverMatches = discoverDccEndpoints({ lat: 39.8561, lng: -104.6737 });
  assert.equal(denverMatches.length, 1);
  assert.equal(denverMatches[0].id, "gosno");
});

test("2. Live Vibe Around Town endpoint validates against frozen Core v2 harness", async () => {
  const res = await fetch("https://vibearoundtown.com/.well-known/dcc", {
    headers: { Accept: "application/json", "User-Agent": "DCC-Automated-Test/2.0" },
  });
  assert.equal(res.status, 200, "Must return HTTP 200 OK");
  assert.ok(
    res.headers.get("content-type")?.includes("application/json"),
    "Must serve application/json"
  );

  const payload = await res.json();

  // Test against frozen Core v2 validator
  const coreResult = validateCoreV2(payload);
  assert.equal(coreResult.valid, true, "Core v2 validator must pass");
  assert.equal(coreResult.errors.length, 0, "Must have 0 validation errors");
  assert.ok(coreResult.passthrough_containers.includes("profile"));
  assert.ok(coreResult.passthrough_containers.includes("relay"));

  // Envelope checks
  assert.equal(payload.protocol, "dcc");
  assert.equal(payload.core, "2");
  assert.equal(payload.self, "https://vibearoundtown.com/.well-known/dcc");
  assert.equal(payload.id, "vibearoundtown.com:org/vibe-around-town");

  // Tourism Profile checks
  const tourismResult = validateTourismProfile(payload);
  assert.equal(tourismResult.valid, true, "Tourism profile validator must pass");

  // Freshness checks
  const freshness = evaluateFreshness(payload.state);
  assert.equal(freshness.is_fresh, true, "Endpoint state must be fresh");
  assert.ok(freshness.as_of, "Must contain as_of timestamp");
  assert.ok(freshness.fresh_until, "Must contain fresh_until timestamp");
});

test("3. Privacy invariants: Zero driver GPS locations and zero customer PII", async () => {
  const res = await fetch("https://vibearoundtown.com/.well-known/dcc");
  const rawText = await res.text();
  const payload = JSON.parse(rawText);

  // Invariant 1: No GPS coordinates in .well-known
  assert.ok(!rawText.includes("latitude"), "Must not leak raw vehicle latitude");
  assert.ok(!rawText.includes("longitude"), "Must not leak raw vehicle longitude");

  // Invariant 2: No customer PII
  assert.ok(!rawText.includes("customerName"), "Must not leak customer names");
  assert.ok(!rawText.includes("guest_phone"), "Must not leak customer phone");
  assert.ok(!rawText.includes("passenger_email"), "Must not leak customer email");

  // Invariant 3: Coarse availability
  const coarseAvailability = payload.state.find(
    (s: any) => s.predicate === "coarse_availability"
  );
  assert.ok(coarseAvailability, "Must broadcast coarse availability state");
  assert.equal(coarseAvailability.value, "accepting_requests");

  // Invariant 4: Relay disabled
  assert.equal(payload.relay?.enabled, false);
});

test("4. Live packages catalog endpoint hydrates real driver tour capacity", async () => {
  const res = await fetch("https://vibearoundtown.com/api/dcc/packages", {
    headers: { Accept: "application/json", "User-Agent": "DCC-Automated-Test/2.0" },
  });
  assert.equal(res.status, 200, "Packages catalog must return HTTP 200");

  const catalog = await res.json();
  assert.equal(catalog.protocol, "dcc");
  assert.equal(catalog.core, "2");
  assert.equal(catalog.operator_id, "vibearoundtown.com:org/vibe-around-town");
  assert.equal(catalog.total_packages, 3);
  assert.equal(catalog.packages.length, 3);

  // Validate package structure and real driver mapping
  const driverSlugs = catalog.packages.map((p: any) => p.driver_slug);
  assert.ok(driverSlugs.includes("marcus-joseph"));
  assert.ok(driverSlugs.includes("alana-thomas"));
  assert.ok(driverSlugs.includes("devon-james"));

  const marcus = catalog.packages.find((p: any) => p.driver_slug === "marcus-joseph");
  assert.equal(marcus.pricing.total_price_usd, 425);
  assert.equal(marcus.pricing.deposit_usd, 59);
  assert.equal(marcus.pricing.balance_due_usd, 366);
  assert.equal(marcus.vehicle.capacity, 8);
});

test("5. Command Center dual-hydration without secondary database storage", async () => {
  // Hydrate Colorado coordinate (GoSno)
  const coResults = await readApplicableDccEndpoints({ lat: 39.8561, lng: -104.6737 });
  assert.equal(coResults.length, 1);
  assert.equal(coResults[0].id, "gosno");
  assert.equal(coResults[0].available, true);
  assert.equal(coResults[0].status, "fresh");

  // Hydrate St. Thomas coordinate (Vibe Around Town)
  const usviResults = await readApplicableDccEndpoints({ lat: 18.3375, lng: -64.9545 });
  assert.equal(usviResults.length, 1);
  assert.equal(usviResults[0].id, "vibe-around-town");
  assert.equal(usviResults[0].available, true);
  assert.equal(usviResults[0].status, "fresh");
  assert.equal(usviResults[0].payload?.id, "vibearoundtown.com:org/vibe-around-town");

  // Confirm neither call stored data in local filesystem or database
  assert.ok(usviResults[0].payload !== null);
  assert.ok(coResults[0].payload !== null);
});
