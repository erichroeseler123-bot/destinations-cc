import assert from "node:assert/strict";
import test from "node:test";
import sitemap from "../app/sitemap";
import {
  getWelcomeToTheDellsRouteGovernanceEntries,
  WELCOME_TO_THE_DELLS_INDEXABLE_ROUTE_PATHS,
} from "../lib/route-governance";
import { SITE_URL } from "../lib/content";

test("Welcome to the Dells only promotes governed indexable routes", () => {
  const governanceEntries = getWelcomeToTheDellsRouteGovernanceEntries();
  assert.equal(governanceEntries.length, 15);

  // Retain explicit operator-route governance assertion
  const operatorEntry = governanceEntries.find(
    (entry) => entry.path === "/river-ops/jet-boat-adventures",
  );
  assert.ok(operatorEntry, "Expected /river-ops/jet-boat-adventures in route governance");
  assert.equal(operatorEntry.publishState, "live_unpromoted");
  assert.equal(operatorEntry.networkRole, "operator");

  // Derive expected paths directly from authoritative governance entries
  const expectedGovernedPaths = governanceEntries
    .filter((entry) => entry.publishState === "indexable" || entry.publishState === "promoted")
    .map((entry) => entry.path);

  assert.deepEqual(WELCOME_TO_THE_DELLS_INDEXABLE_ROUTE_PATHS, expectedGovernedPaths);
  assert.equal(expectedGovernedPaths.length, 14);

  const expectedUrls = expectedGovernedPaths.map((pathname) => `${SITE_URL}${pathname}`);

  const entries = sitemap();
  const actualUrls = entries.map((entry) => entry.url);

  // Exhaustively compare the complete sitemap URL set against authoritative governance
  assert.deepEqual(actualUrls, expectedUrls);
  assert.equal(entries.length, 14);

  // Verify explicit governance properties on primary entry
  assert.equal(entries[0]?.url, `${SITE_URL}/`);
  assert.equal(entries[0]?.priority, 1);

  // Retain explicit operator-route exclusion assertion to verify it is never present in sitemap
  assert.ok(
    !entries.some((entry) => entry.url.includes("/river-ops")),
    "Operator routes must be explicitly excluded from the sitemap",
  );
});

