import test from "node:test";
import assert from "node:assert/strict";
import sitemap from "../app/sitemap";
import {
  AIRPORT420_INDEXABLE_ROUTE_PATHS,
  AIRPORT420_VISIBLE_ROUTE_PATHS,
  getAirport420RouteGovernance,
  getAirport420RouteGovernanceEntries,
} from "../lib/route-governance";

test("420airport sitemap matches the indexable route-governance contract", () => {
  const pathnames = sitemap().map((entry) => new URL(entry.url).pathname);

  assert.deepEqual(pathnames, AIRPORT420_INDEXABLE_ROUTE_PATHS);
});

test("420airport homepage route stays promoted and operator-owned", () => {
  const governance = getAirport420RouteGovernance("/");
  assert.ok(governance);
  assert.equal(governance?.publishState, "promoted");
  assert.equal(governance?.networkRole, "operator");
  assert.ok(AIRPORT420_VISIBLE_ROUTE_PATHS.includes("/"));
  assert.ok(AIRPORT420_VISIBLE_ROUTE_PATHS.includes("/denver-airport-420-friendly-pickup"));
  assert.ok(AIRPORT420_VISIBLE_ROUTE_PATHS.includes("/420-friendly-airport-transport-denver"));
});

test("420airport sitemap uses the governed homepage metadata", () => {
  const [entry] = sitemap();

  assert.ok(entry.lastModified instanceof Date);
  assert.equal(entry.priority, 1);
  assert.equal(entry.changeFrequency, "weekly");
  assert.equal(entry.url, "https://420friendlyairportpickup.com/");
});

test("420airport route-governance paths stay unique", () => {
  const paths = getAirport420RouteGovernanceEntries().map((entry) => entry.path);
  assert.equal(new Set(paths).size, paths.length);
});

test("420airport SEO entry pages are indexable and in the sitemap", () => {
  const pathnames = sitemap().map((entry) => new URL(entry.url).pathname);

  assert.ok(AIRPORT420_INDEXABLE_ROUTE_PATHS.includes("/denver-airport-420-friendly-pickup"));
  assert.ok(AIRPORT420_INDEXABLE_ROUTE_PATHS.includes("/420-friendly-airport-transport-denver"));
  assert.ok(pathnames.includes("/denver-airport-420-friendly-pickup"));
  assert.ok(pathnames.includes("/420-friendly-airport-transport-denver"));
});
