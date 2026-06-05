import assert from "node:assert/strict";
import test from "node:test";
import sitemap from "../app/sitemap";
import {
  getWelcomeToTheDellsRouteGovernanceEntries,
  WELCOME_TO_THE_DELLS_INDEXABLE_ROUTE_PATHS,
} from "../lib/route-governance";
import { SITE_URL } from "../lib/content";

test("Welcome to the Dells only promotes governed indexable routes", () => {
  assert.deepEqual(WELCOME_TO_THE_DELLS_INDEXABLE_ROUTE_PATHS, ["/", "/lounge"]);
  assert.equal(getWelcomeToTheDellsRouteGovernanceEntries().length, 3);
  assert.ok(
    getWelcomeToTheDellsRouteGovernanceEntries().some(
      (entry) =>
        entry.path === "/river-ops/jet-boat-adventures" &&
        entry.publishState === "live_unpromoted" &&
        entry.networkRole === "operator",
    ),
  );

  const entries = sitemap();
  assert.equal(entries.length, 2);
  assert.equal(entries[0]?.url, `${SITE_URL}/`);
  assert.equal(entries[0]?.priority, 1);
  assert.equal(entries[1]?.url, `${SITE_URL}/lounge`);
});
