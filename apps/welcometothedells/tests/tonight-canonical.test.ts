import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import type { Metadata } from "next";
import sitemap from "../app/sitemap";
import DellsDecisionPage, { type DellsDecisionSection } from "../app/components/DellsDecisionPage";
import { metadata as adultsMetadata } from "../app/adults/page";
import { metadata as boatToursMetadata } from "../app/boat-tours/page";
import { metadata as downtownMetadata } from "../app/downtown/page";
import { metadata as familiesMetadata } from "../app/families/page";
import { metadata as firstTimeMetadata } from "../app/first-time/page";
import { metadata as lakeDeltonMetadata } from "../app/lake-delton/page";
import { metadata as largeGroupsMetadata } from "../app/large-groups/page";
import { metadata as loungeMetadata } from "../app/lounge/page";
import { metadata as parkwayMetadata } from "../app/parkway/page";
import { metadata as rainyDayMetadata } from "../app/rainy-day/page";
import { metadata as thingsToDoMetadata } from "../app/things-to-do/page";
import TonightPage, { metadata as tonightMetadata } from "../app/tonight/page";
import { metadata as waterparksMetadata } from "../app/waterparks/page";
import { SITE_URL } from "../lib/content";
import {
  getWelcomeToTheDellsRouteGovernanceEntries,
  WELCOME_TO_THE_DELLS_INDEXABLE_ROUTE_PATHS,
} from "../lib/route-governance";

const GOVERNED_CANONICAL_ORIGIN = "https://www.welcometothedells.com";
const METADATA_BASE = new URL(SITE_URL);
const HOMEPAGE_CANONICAL = new URL(SITE_URL, METADATA_BASE).toString();
const ROOT_LAYOUT_METADATA: Metadata = {
  metadataBase: METADATA_BASE,
  alternates: { canonical: SITE_URL },
};

const ROUTE_METADATA_BY_PATH: Record<string, Metadata> = {
  "/": ROOT_LAYOUT_METADATA,
  "/adults": adultsMetadata,
  "/boat-tours": boatToursMetadata,
  "/downtown": downtownMetadata,
  "/families": familiesMetadata,
  "/first-time": firstTimeMetadata,
  "/lake-delton": lakeDeltonMetadata,
  "/large-groups": largeGroupsMetadata,
  "/lounge": loungeMetadata,
  "/parkway": parkwayMetadata,
  "/rainy-day": rainyDayMetadata,
  "/things-to-do": thingsToDoMetadata,
  "/tonight": tonightMetadata,
  "/waterparks": waterparksMetadata,
};

function resolveRenderedCanonical(pageMetadata: Metadata): string {
  const rawCanonical = pageMetadata.alternates?.canonical ?? SITE_URL;
  assert.equal(typeof rawCanonical, "string", "Expected canonical metadata to resolve to a string");
  return new URL(String(rawCanonical), METADATA_BASE).toString();
}

test("SITE_URL and root layout metadataBase use the governed www canonical host and never the redirecting apex host", () => {
  const layoutSource = fs.readFileSync(
    fileURLToPath(new URL("../app/layout.tsx", import.meta.url)),
    "utf8",
  );
  assert.match(layoutSource, /metadataBase:\s*new URL\(SITE_URL\)/);
  assert.match(layoutSource, /alternates:\s*\{\s*canonical:\s*SITE_URL\s*\}/);

  assert.equal(SITE_URL, GOVERNED_CANONICAL_ORIGIN);
  assert.equal(METADATA_BASE.origin, GOVERNED_CANONICAL_ORIGIN);
  assert.equal(METADATA_BASE.hostname, "www.welcometothedells.com");
  assert.notEqual(METADATA_BASE.hostname, "welcometothedells.com");
  assert.equal(HOMEPAGE_CANONICAL, `${GOVERNED_CANONICAL_ORIGIN}/`);
});

test("Every governed indexable/promoted route in sitemap and rendered page metadata uses www host, matching path, and unique self-canonical", () => {
  const governanceEntries = getWelcomeToTheDellsRouteGovernanceEntries();
  const governedIndexablePaths = governanceEntries
    .filter((entry) => entry.publishState === "indexable" || entry.publishState === "promoted")
    .map((entry) => entry.path);

  assert.deepEqual(WELCOME_TO_THE_DELLS_INDEXABLE_ROUTE_PATHS, governedIndexablePaths);
  assert.equal(governedIndexablePaths.length, 14);

  const sitemapEntries = sitemap();
  const sitemapUrls = sitemapEntries.map((entry) => entry.url);
  assert.equal(
    sitemapUrls.length,
    governedIndexablePaths.length,
    "Sitemap must not have missing or extra routes relative to governed indexable/promoted routes",
  );
  assert.equal(
    new Set(sitemapUrls).size,
    sitemapUrls.length,
    "Sitemap URLs must not contain duplicates",
  );

  const renderedCanonicals = new Set<string>();

  for (const routePath of governedIndexablePaths) {
    const pageMetadata = ROUTE_METADATA_BY_PATH[routePath];
    assert.ok(pageMetadata, `Missing route metadata mapping for governed path ${routePath}`);

    if (routePath !== "/") {
      assert.ok(
        pageMetadata.alternates?.canonical,
        `Route ${routePath} must define explicit alternates.canonical so it cannot fall back to the homepage canonical`,
      );
    }

    const expectedUrl = new URL(routePath, `${GOVERNED_CANONICAL_ORIGIN}/`).toString();
    const resolvedCanonical = resolveRenderedCanonical(pageMetadata);
    const parsedCanonical = new URL(resolvedCanonical);

    assert.equal(
      parsedCanonical.hostname,
      "www.welcometothedells.com",
      `Canonical for ${routePath} must use www.welcometothedells.com (no apex regression)`,
    );
    assert.equal(
      parsedCanonical.pathname,
      routePath,
      `Canonical pathname for ${routePath} must match route path`,
    );
    assert.equal(
      resolvedCanonical,
      expectedUrl,
      `Rendered canonical for ${routePath} must equal ${expectedUrl}`,
    );

    if (routePath !== "/") {
      assert.notEqual(
        resolvedCanonical,
        HOMEPAGE_CANONICAL,
        `Non-home route ${routePath} must not fall back to homepage canonical`,
      );
      assert.notEqual(
        resolvedCanonical,
        SITE_URL,
        `Non-home route ${routePath} must not fall back to bare SITE_URL`,
      );
    }

    assert.equal(
      renderedCanonicals.has(resolvedCanonical),
      false,
      `Duplicate canonical detected for ${routePath}: ${resolvedCanonical}`,
    );
    renderedCanonicals.add(resolvedCanonical);

    assert.ok(
      sitemapUrls.includes(expectedUrl),
      `Expected governed route ${expectedUrl} in sitemap.xml`,
    );
  }
});

test("/tonight resolves to https://www.welcometothedells.com/tonight and preserves visible copy and next-step links", () => {
  const resolvedTonightCanonical = resolveRenderedCanonical(tonightMetadata);
  assert.equal(resolvedTonightCanonical, "https://www.welcometothedells.com/tonight");
  assert.notEqual(resolvedTonightCanonical, "https://welcometothedells.com/tonight");
  assert.notEqual(resolvedTonightCanonical, HOMEPAGE_CANONICAL);

  assert.equal(tonightMetadata.title, "What to Do Tonight in Wisconsin Dells");
  assert.equal(
    tonightMetadata.description,
    "A fast Wisconsin Dells evening plan for dinner, downtown, river experiences, shows, and after-dark options.",
  );

  const element = TonightPage() as unknown as {
    type: unknown;
    props: {
      eyebrow: string;
      title: string;
      intro: string;
      sections: DellsDecisionSection[];
      ctaHref?: string;
      ctaLabel?: string;
    };
  };

  assert.equal(element.type, DellsDecisionPage);
  assert.equal(element.props.eyebrow, "Tonight");
  assert.equal(element.props.title, "Pick one strong Dells night.");
  assert.deepEqual(
    element.props.sections.map((section) => ({
      title: section.title,
      href: section.href,
      cta: section.cta,
    })),
    [
      {
        title: "Want atmosphere?",
        href: "/boat-tours",
        cta: "Compare river experiences",
      },
      {
        title: "Want entertainment?",
        href: "/things-to-do",
        cta: "Compare activity types",
      },
      {
        title: "Want easy?",
        href: "/downtown",
        cta: "Plan a simple downtown night",
      },
    ],
  );
  assert.equal(element.props.ctaHref, "/adults");
  assert.equal(element.props.ctaLabel, "See adults-only ideas");
});

test("Explicit controls (/boat-tours, /things-to-do, /waterparks, /first-time) resolve to www self-canonicals", () => {
  assert.equal(
    resolveRenderedCanonical(boatToursMetadata),
    "https://www.welcometothedells.com/boat-tours",
  );
  assert.equal(
    resolveRenderedCanonical(thingsToDoMetadata),
    "https://www.welcometothedells.com/things-to-do",
  );
  assert.equal(
    resolveRenderedCanonical(waterparksMetadata),
    "https://www.welcometothedells.com/waterparks",
  );
  assert.equal(
    resolveRenderedCanonical(firstTimeMetadata),
    "https://www.welcometothedells.com/first-time",
  );
});
