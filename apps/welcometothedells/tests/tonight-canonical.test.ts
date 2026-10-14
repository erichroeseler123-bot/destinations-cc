import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import type { Metadata } from "next";
import { SITE_URL } from "../lib/content";
import sitemap from "../app/sitemap";
import DellsDecisionPage, { type DellsDecisionSection } from "../app/components/DellsDecisionPage";
import TonightPage, { metadata as tonightMetadata } from "../app/tonight/page";
import { metadata as boatToursMetadata } from "../app/boat-tours/page";
import { metadata as thingsToDoMetadata } from "../app/things-to-do/page";
import { metadata as waterparksMetadata } from "../app/waterparks/page";
import { metadata as firstTimeMetadata } from "../app/first-time/page";

const METADATA_BASE = new URL(SITE_URL);
const HOMEPAGE_CANONICAL = new URL(SITE_URL, METADATA_BASE).toString();

function resolveCanonicalWithLayoutFallback(pageMetadata: Metadata): string {
  const rawCanonical = pageMetadata.alternates?.canonical ?? SITE_URL;
  assert.equal(typeof rawCanonical, "string", "Expected canonical metadata to be a string");
  return new URL(String(rawCanonical), METADATA_BASE).toString();
}

test("/tonight defines a self-referential canonical and does not fall back to the homepage canonical", () => {
  const layoutSource = fs.readFileSync(
    fileURLToPath(new URL("../app/layout.tsx", import.meta.url)),
    "utf8",
  );
  assert.match(layoutSource, /metadataBase:\s*new URL\(SITE_URL\)/);
  assert.match(layoutSource, /alternates:\s*\{\s*canonical:\s*SITE_URL\s*\}/);

  assert.ok(
    tonightMetadata.alternates?.canonical,
    "/tonight must explicitly define metadata.alternates.canonical so it does not inherit the root layout homepage canonical",
  );

  const resolvedTonightCanonical = resolveCanonicalWithLayoutFallback(tonightMetadata);
  assert.notEqual(
    resolvedTonightCanonical,
    SITE_URL,
    "/tonight canonical must not fall back to the bare homepage URL",
  );
  assert.notEqual(
    resolvedTonightCanonical,
    HOMEPAGE_CANONICAL,
    "/tonight canonical must not fall back to the normalized homepage canonical",
  );
  assert.equal(
    resolvedTonightCanonical,
    "https://welcometothedells.com/tonight",
  );
});

test("/tonight remains in the governed sitemap and preserves its title, description, H1, copy, and three next-step links", () => {
  const entries = sitemap();
  const tonightSitemapEntry = entries.find(
    (entry) => entry.url === "https://welcometothedells.com/tonight",
  );
  assert.ok(tonightSitemapEntry, "Expected https://welcometothedells.com/tonight in sitemap()");
  assert.equal(
    tonightSitemapEntry.url,
    resolveCanonicalWithLayoutFallback(tonightMetadata),
    "Sitemap URL and resolved canonical URL for /tonight must match",
  );

  assert.equal(
    tonightMetadata.title,
    "What to Do Tonight in Wisconsin Dells",
  );
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
  assert.equal(
    element.props.intro,
    "Choose the kind of evening first, then use the linked planning path to compare the current operator options. Confirm tonight’s hours, tickets, age rules, and weather changes on the operator’s site before you go.",
  );

  const sections = element.props.sections;
  assert.equal(sections.length, 3);
  assert.deepEqual(
    sections.map((section) => ({
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

test("Control pages (/boat-tours, /things-to-do, /waterparks, /first-time) keep their existing self-canonicals", () => {
  assert.equal(
    resolveCanonicalWithLayoutFallback(boatToursMetadata),
    "https://welcometothedells.com/boat-tours",
  );
  assert.equal(
    resolveCanonicalWithLayoutFallback(thingsToDoMetadata),
    "https://welcometothedells.com/things-to-do",
  );
  assert.equal(
    resolveCanonicalWithLayoutFallback(waterparksMetadata),
    "https://welcometothedells.com/waterparks",
  );
  assert.equal(
    resolveCanonicalWithLayoutFallback(firstTimeMetadata),
    "https://welcometothedells.com/first-time",
  );
});
