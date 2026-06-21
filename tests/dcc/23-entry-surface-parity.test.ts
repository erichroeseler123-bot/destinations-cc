import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import entrySurfaces from "@/data/generated/entry-surfaces.json";
import { CommandEntrySurfaceGrid } from "@/app/components/dcc/command/CommandEntrySurfaceGrid";
import { getCommandViewData } from "@/lib/dcc/command/service";
import { getHeaderSearchEntries } from "@/src/data/header-search-registry";
import { getHomepageEntrySurfaces } from "@/src/data/entry-surfaces";
import type { EntrySurface } from "@/src/data/entry-surfaces-types";

const EXPECTED_PROMOTED_ENTRIES = [
  { label: "Red Rocks Transport", path: "/red-rocks-transportation" },
  { label: "Sedona Jeep Tours", path: "/sedona/jeep-tours" },
  { label: "Lake Tahoe Activities", path: "/lake-tahoe/things-to-do" },
  { label: "New Orleans Swamp Tours", path: "/new-orleans/swamp-tours" },
  { label: "Juneau Helicopter Tours", path: "/juneau/helicopter-tours" },
  { label: "Juneau Whale Watching Tours", path: "/juneau/whale-watching-tours" },
  { label: "Denver Weed Airport Pickup", path: "/denver/weed-airport-pickup" },
] as const;

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ");
}

function assertOrderedEntries(html: string, entries: readonly { label: string; path: string }[]) {
  let lastIndex = -1;

  for (const entry of entries) {
    const pair = `href="${entry.path}"`;
    const pathIndex = html.indexOf(pair);
    const labelIndex = html.indexOf(entry.label, Math.max(pathIndex, 0));

    assert.ok(pathIndex >= 0, `missing promoted path ${entry.path}`);
    assert.ok(labelIndex >= 0, `missing promoted label ${entry.label}`);
    assert.ok(pathIndex > lastIndex, `promoted entry out of order: ${entry.label}`);
    lastIndex = pathIndex;
  }
}

function searchHeaderEntries(query: string) {
  const q = query.trim().toLowerCase();

  return getHeaderSearchEntries()
    .map((entry) => {
      const haystack = entry.searchText.toLowerCase();
      let score = 0;

      if (entry.path.replace(/^\/+/, "") === q) score += 100;
      if (entry.label.toLowerCase() === q) score += 90;
      if (entry.label.toLowerCase().startsWith(q)) score += 40;
      if (entry.searchText.startsWith(q)) score += 35;
      if (haystack.includes(q)) score += 10;
      score += Math.round(entry.rankScore / 10);

      return { entry, score };
    })
    .filter((result) => result.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 6)
    .map((result) => result.entry);
}

test("entry-surface manifest contains the promoted intake entries with exact labels, paths, and order", () => {
  const promoted = (entrySurfaces as EntrySurface[])
    .filter((entry) => entry.showInHomepage)
    .sort((a, b) => b.rankScore - a.rankScore)
    .slice(0, 7)
    .map((entry) => ({ label: entry.label, path: entry.path }));

  assert.deepEqual(promoted, EXPECTED_PROMOTED_ENTRIES);
});

test("header search includes live cruise-port lanes and safe expansion candidates", () => {
  const entries = getHeaderSearchEntries();
  const byId = new Map(entries.map((entry) => [entry.id, entry]));

  for (const expected of [
    { id: "key-west-cruise-desk", label: "Key West Cruise Desk", path: "/cruise-ports/key-west" },
    { id: "cozumel-cruise-desk", label: "Cozumel Cruise Desk", path: "/cruise-ports/cozumel" },
    {
      id: "port-canaveral-cruise-desk",
      label: "Port Canaveral Cruise Desk",
      path: "/cruise-ports/port-canaveral",
    },
  ]) {
    const entry = byId.get(expected.id);
    assert.equal(entry?.label, expected.label);
    assert.equal(entry?.path, expected.path);
    assert.equal(entry?.availabilityStatus, "live");
    assert.equal(entry?.statusLabel, "Live cruise-port lane");
  }

  for (const expected of [
    { id: "st-thomas-cruise-expansion", label: "St. Thomas" },
    { id: "san-juan-cruise-expansion", label: "San Juan" },
  ]) {
    const entry = byId.get(expected.id);
    assert.equal(entry?.label, expected.label);
    assert.equal(entry?.availabilityStatus, "expansion_candidate");
    assert.equal(entry?.statusLabel, "Expansion candidate");
    assert.equal(entry?.showInHomepage, false);
    assert.equal(entry?.showInCommand, false);
    assert.notEqual(entry?.path.startsWith("/cruise-ports/"), true);
  }
});

test("header search finds cruise lanes without losing promoted corridor matches", () => {
  const expectedTopLabels = new Map([
    ["st thomas", "St. Thomas"],
    ["key west", "Key West Cruise Desk"],
    ["cozumel", "Cozumel Cruise Desk"],
    ["port canaveral", "Port Canaveral Cruise Desk"],
    ["red rocks", "Red Rocks Transport"],
  ]);

  for (const [query, expectedLabel] of expectedTopLabels) {
    assert.equal(searchHeaderEntries(query)[0]?.label, expectedLabel);
  }

  const juneauLabels = searchHeaderEntries("juneau").map((entry) => entry.label);
  assert(juneauLabels.includes("Juneau Helicopter Tours"));
  assert(juneauLabels.includes("Juneau Whale Watching Tours"));
});

test("homepage promoted entry-surface registry keeps the same promoted entries", () => {
  const promoted = getHomepageEntrySurfaces()
    .slice(0, 7)
    .map((entry) => ({ label: entry.label, path: entry.path }));

  assert.deepEqual(promoted, EXPECTED_PROMOTED_ENTRIES);
});

test("homepage public cruise status copy reflects the six-market reference set and expansion queue", async () => {
  const html = normalizeWhitespace(fs.readFileSync("app/page.tsx", "utf8"));

  assert.match(html, /6 live markets/);
  assert.match(html, /Key West/);
  assert.match(html, /Cozumel/);
  assert.match(html, /St\. Thomas/);
  assert.match(html, /Expansion candidate|expansion candidates/);
});

test("command intake section renders the same promoted entries and no extra manifest-external promoted links", async () => {
  const data = await getCommandViewData();
  const promoted = data.entrySurfaces.map((entry) => ({ label: entry.label, path: entry.path }));

  assert.deepEqual(promoted, EXPECTED_PROMOTED_ENTRIES);

  const html = normalizeWhitespace(
    renderToStaticMarkup(React.createElement(CommandEntrySurfaceGrid, { entries: data.entrySurfaces })),
  );

  assertOrderedEntries(html, EXPECTED_PROMOTED_ENTRIES);

  const renderedPromoted = Array.from(html.matchAll(/href="([^"]+)"[^>]*>.*?<h3[^>]*>([^<]+)<\/h3>/g)).map(
    (match) => ({ path: match[1], label: match[2].trim() }),
  );

  assert.deepEqual(renderedPromoted, EXPECTED_PROMOTED_ENTRIES);
});
