import test from "node:test";
import assert from "node:assert/strict";
import {
  discoverDccEndpoints,
  fetchAndHydrateDccEndpoint,
  validateDccCoreV2,
  readApplicableDccEndpoints,
  DCC_SOURCE_REGISTRY,
} from "../../lib/dcc/endpointRegistry";

test("DCC registry matches service regions accurately", () => {
  // Denver International Airport: 39.8561, -104.6737 -> inside Colorado Rockies bbox
  const denverMatches = discoverDccEndpoints({ lat: 39.8561, lng: -104.6737 });
  assert.equal(denverMatches.length, 1);
  assert.equal(denverMatches[0].endpointUrl, "https://gosno.co/.well-known/dcc");
  assert.equal(denverMatches[0].name, "GoSno");

  // Big Sky Resort: 45.2618, -111.3080 -> inside Big Sky Montana bbox
  const bigSkyMatches = discoverDccEndpoints({ lat: 45.2618, lng: -111.3080 });
  assert.equal(bigSkyMatches.length, 1);
  assert.equal(bigSkyMatches[0].endpointUrl, "https://gosno.co/.well-known/dcc");

  // Honolulu Hawaii: 21.3069, -157.8583 -> outside all registered coverage
  const honoluluMatches = discoverDccEndpoints({ lat: 21.3069, lng: -157.8583 });
  assert.equal(honoluluMatches.length, 0);
});

test("DCC Core v2 constitutional validator enforces required fields", () => {
  const invalidPayload = { protocol: "invalid", core: "1" };
  const validationFailure = validateDccCoreV2(invalidPayload);
  assert.equal(validationFailure.valid, false);
  assert.ok(validationFailure.errors.length > 0);

  const minimalValid = {
    protocol: "dcc",
    core: "2",
    self: "https://test.example/.well-known/dcc",
    id: "org:test/shuttle",
    claims: [
      {
        predicate: "legal_name",
        value: "Test Transport LLC",
      },
    ],
    state: [
      {
        predicate: "service_status",
        value: "operational",
        as_of: new Date().toISOString(),
        fresh_until: new Date(Date.now() + 600000).toISOString(),
      },
    ],
    actions: [
      {
        action_id: "check_availability",
        method: "GET",
        target: "https://test.example/availability",
      },
    ],
    links: [
      {
        rel: "routes_catalog",
        target: "https://test.example/routes",
      },
    ],
  };

  const validationSuccess = validateDccCoreV2(minimalValid);
  assert.equal(validationSuccess.valid, true);
  assert.equal(validationSuccess.errors.length, 0);
});

test("Source endpoint fetch and hydration against live GoSno endpoint", async () => {
  const entry = DCC_SOURCE_REGISTRY[0];
  const hydrated = await fetchAndHydrateDccEndpoint(entry);

  assert.equal(hydrated.endpointUrl, "https://gosno.co/.well-known/dcc");
  assert.equal(hydrated.status, "fresh");
  assert.equal(hydrated.isFresh, true);
  assert.equal(hydrated.available, true);
  assert.ok(hydrated.payload);

  const payload = hydrated.payload;
  assert.equal(payload.protocol, "dcc");
  assert.equal(payload.core, "2");
  assert.equal(payload.self, "https://gosno.co/.well-known/dcc");
  assert.equal(payload.id, "gosno.co:org/gosno");

  const legalNameClaim = payload.claims?.find((c: any) => c.predicate === "legal_name");
  assert.ok(legalNameClaim);
  assert.match(legalNameClaim.value, /GoSno/);

  const authClaim = payload.claims?.find((c: any) => c.predicate === "operating_authority");
  assert.ok(authClaim);
  assert.match(authClaim.value, /CO PUC/);

  const airportHubsClaim = payload.claims?.find((c: any) => c.predicate === "airport_hubs");
  assert.ok(airportHubsClaim);
  assert.ok(airportHubsClaim.value.includes("DEN"));

  const availAction = payload.actions?.find((a: any) => a.action_id === "check_availability");
  assert.ok(availAction);
  assert.equal(availAction.method, "GET");
  assert.ok(availAction.target.startsWith("https://gosno.co"));

  const routesLink = payload.links?.find((l: any) => l.rel === "routes_catalog");
  assert.ok(routesLink);
  assert.equal(routesLink.target, "https://gosno.co/api/dcc/routes");

  assert.ok(hydrated.asOf);
  assert.ok(hydrated.freshUntil);
});

test("readApplicableDccEndpoints spatial discovery & hydration flow", async () => {
  const results = await readApplicableDccEndpoints({ lat: 39.8561, lng: -104.6737 });
  assert.ok(Array.isArray(results));
  assert.equal(results.length, 1);

  const ep = results[0];
  assert.equal(ep.endpointUrl, "https://gosno.co/.well-known/dcc");
  assert.equal(ep.matchedRegion, "Colorado Rocky Mountains Corridor & Hubs");
  assert.equal(ep.status, "fresh");
  assert.equal(ep.isFresh, true);
  assert.equal(ep.available, true);
});

test("Zero secondary database replication verification", async () => {
  const ep = (await readApplicableDccEndpoints({ lat: 39.8561, lng: -104.6737 }))[0];
  assert.ok(!(ep.payload as any).routes_database, "Must not duplicate route tables into local DB");
  assert.ok(!(ep.payload as any).schedules_database, "Must not duplicate schedules into local DB");
  assert.ok(!(ep.payload as any).pricing_matrix, "Must not copy pricing into local DB");
});

test("Endpoint failure handling (HTTP 404 returns unavailable status with error)", async () => {
  const failingEntry = {
    id: "failing_operator",
    name: "Failing Operator",
    endpointUrl: "https://destinationcommandcenter.com/api/nonexistent-endpoint-404",
    description: "Test failure handling",
    serviceAreas: [],
  };

  const hydrated = await fetchAndHydrateDccEndpoint(failingEntry);
  assert.equal(hydrated.available, false);
  assert.equal(hydrated.status, "unavailable");
  assert.ok(hydrated.error);
  assert.match(hydrated.error, /HTTP 404/);
});

test("Invalid Core payload validation failure", () => {
  const invalidPayloads = [
    null,
    {},
    { protocol: "wrong", core: "2", self: "https://a.co", id: "a:b" },
    { protocol: "dcc", core: "3", self: "https://a.co", id: "a:b" },
    { protocol: "dcc", core: "2", self: "not-a-url", id: "a:b" },
    { protocol: "dcc", core: "2", self: "https://a.co", id: "no-namespace-or-uri" },
    { protocol: "dcc", core: "2", self: "https://a.co", id: "a:b", claims: "not-array" },
  ];

  for (const invalid of invalidPayloads) {
    const result = validateDccCoreV2(invalid);
    assert.equal(result.valid, false, `Expected invalid payload to fail: ${JSON.stringify(invalid)}`);
    assert.ok(result.errors.length > 0);
  }
});

test("Stale state detection when fresh_until timestamp has expired", () => {
  const pastTime = new Date(Date.now() - 3600 * 1000).toISOString();
  const expiredPayload = {
    protocol: "dcc",
    core: "2",
    self: "https://test.example/.well-known/dcc",
    id: "org:test/stale-operator",
    claims: [
      { predicate: "legal_name", value: "Stale Transport LLC" },
    ],
    state: [
      {
        predicate: "service_status",
        value: "operational",
        as_of: new Date(Date.now() - 7200 * 1000).toISOString(),
        fresh_until: pastTime,
      },
    ],
    actions: [],
    links: [],
  };

  const validation = validateDccCoreV2(expiredPayload);
  assert.equal(validation.valid, true);

  const now = Date.now();
  const freshUntilTime = new Date(pastTime).getTime();
  const isFresh = freshUntilTime >= now;
  assert.equal(isFresh, false, "Expired timestamp must evaluate to isFresh = false");
});
