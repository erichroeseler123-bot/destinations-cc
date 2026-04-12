import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import entrySurfaces from "@/data/generated/entry-surfaces.json";
import HomePage from "@/app/page";
import { CommandEntrySurfaceGrid } from "@/app/components/dcc/command/CommandEntrySurfaceGrid";
import { getCommandViewData } from "@/lib/dcc/command/service";
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

test("entry-surface manifest contains the promoted intake entries with exact labels, paths, and order", () => {
  const promoted = (entrySurfaces as EntrySurface[])
    .filter((entry) => entry.showInHomepage)
    .sort((a, b) => b.rankScore - a.rankScore)
    .slice(0, 7)
    .map((entry) => ({ label: entry.label, path: entry.path }));

  assert.deepEqual(promoted, EXPECTED_PROMOTED_ENTRIES);
});

test("homepage intake section renders the same promoted entries and no extra manifest-external promoted links", async () => {
  const promoted = getHomepageEntrySurfaces()
    .slice(0, 7)
    .map((entry) => ({ label: entry.label, path: entry.path }));

  assert.deepEqual(promoted, EXPECTED_PROMOTED_ENTRIES);

  const html = normalizeWhitespace(renderToStaticMarkup(await HomePage()));
  const sectionMatch = html.match(/Start with a live lane.*?Browse Cities/);
  assert.ok(sectionMatch, "homepage intake section not found");

  const sectionHtml = sectionMatch[0];
  assertOrderedEntries(sectionHtml, EXPECTED_PROMOTED_ENTRIES);

  const renderedPromoted = Array.from(sectionHtml.matchAll(/href="([^"]+)"[^>]*>([^<]+)</g))
    .map((match) => ({ path: match[1], label: match[2].trim() }))
    .filter((entry) => entry.path !== "/cities");

  assert.deepEqual(renderedPromoted, EXPECTED_PROMOTED_ENTRIES);
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
