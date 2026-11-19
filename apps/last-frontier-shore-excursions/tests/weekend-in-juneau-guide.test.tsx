import assert from "node:assert/strict";
import fs from "node:fs";
import Module from "node:module";
import path from "node:path";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const modAny = Module as unknown as {
  _extensions: Record<string, (m: { exports: unknown }) => void>;
};
modAny._extensions[".css"] = (m) => {
  m.exports = {};
};

import sitemap from "../app/sitemap";
import { buildWeekendInJuneauGuideJsonLd } from "../lib/structuredData";
import {
  WEEKEND_ADVENTURE_CARDS,
  WEEKEND_CLAIM_SOURCE_LEDGER,
  WEEKEND_IN_JUNEAU_CANONICAL_URL,
  WEEKEND_IN_JUNEAU_PATH,
  WEEKEND_IN_JUNEAU_RELEASE_READY,
  WEEKEND_ITINERARY_PLANS,
} from "../lib/weekendInJuneauGuideData";

async function renderGuideHtml(): Promise<string> {
  const { default: WeekendInJuneauGuidePage } = await import(
    "../app/guides/weekend-in-juneau/page"
  );
  return renderToStaticMarkup(<WeekendInJuneauGuidePage />);
}

const LFSE_ROOT = path.join(process.cwd(), "apps", "last-frontier-shore-excursions");

function readLfseFile(rel: string): string {
  return fs.readFileSync(path.join(LFSE_ROOT, rel), "utf8");
}

test("Weekend in Juneau: canonical route, positioning headline, positive destination copy, and release gate", async () => {
  assert.equal(WEEKEND_IN_JUNEAU_PATH, "/guides/weekend-in-juneau");
  assert.equal(
    WEEKEND_IN_JUNEAU_CANONICAL_URL,
    "https://www.lastfrontiershoreexcursions.com/guides/weekend-in-juneau",
  );
  assert.equal(WEEKEND_IN_JUNEAU_RELEASE_READY, true);

  const html = await renderGuideHtml();
  assert.match(html, /Your Alaska Adventure, Based in Juneau/);
  assert.match(
    html,
    /Fly in\. Stay a few days\. Explore glaciers, watch whales, enjoy the water—and stay for the evenings\./,
  );

  // Positive tone: never disparage cruise ships/travelers, never claim all ships leave every night, never invent package prices
  assert.doesNotMatch(
    html,
    /cruise cattle|tourist trap|avoid cruise passengers|every ship leaves every night|all ships depart by dusk/i,
  );
  assert.match(html, /some ships remain docked into late evening/i);
});

test("Weekend in Juneau: renders all 8 required standalone sections and separates Arrival/Departure from Full Days", async () => {
  const html = await renderGuideHtml();
  for (const sectionId of [
    'id="why-stay"',
    'id="where-to-base"',
    'id="itinerary-planner"',
    'id="adventure-choices"',
    'id="evenings-in-juneau"',
    'id="getting-around"',
    'id="weather-flexibility"',
    'id="sources-and-freshness"',
    'id="printable-juneau-trip-sheet"',
  ]) {
    assert.ok(html.includes(sectionId), `Missing required section ${sectionId}`);
  }

  // Verify both 2-full-day and 3-full-day plans explicitly separate arrival/departure days from full activity days
  assert.equal(WEEKEND_ITINERARY_PLANS.length, 2);
  for (const plan of WEEKEND_ITINERARY_PLANS) {
    const arrivalOrDep = plan.days.filter((d) => d.dayType === "arrival_departure");
    const fullDays = plan.days.filter((d) => d.dayType === "full_activity_day");
    assert.equal(arrivalOrDep.length, 2);
    assert.equal(fullDays.length, plan.key === "2_full_days" ? 2 : 3);
  }
});

test("Weekend in Juneau: network links, seller handoffs (qa=1 on non-prod), and live cross-links to JFD UnCruise & CP Independent Alaska guides", async () => {
  const html = await renderGuideHtml();

  // Must link to now-live Production JFD UnCruise and CP Independent Alaska guides via external <a> tags (never Next <Link>)
  const pageSrc = readLfseFile("app/guides/weekend-in-juneau/page.tsx");
  assert.doesNotMatch(pageSrc, /<Link[^>]+href=["']https:\/\/juneauflightdeck\.com/i);
  assert.doesNotMatch(pageSrc, /<Link[^>]+href=["']https:\/\/cruisepromenade\.com/i);
  assert.match(html, /https:\/\/juneauflightdeck\.com\/guides\/uncruise-juneau-helicopter-tours/);
  assert.match(html, /https:\/\/cruisepromenade\.com\/guides\/cruise-alaska-without-a-cruise-ship/);
  assert.match(html, /https:\/\/juneauflightdeck\.com\/temsco-vs-coastal-vs-northstar-juneau/);
  assert.match(html, /https:\/\/juneauflightdeck\.com\/juneau-glacier-flight-weather/);
  assert.match(
    html,
    /https:\/\/juneauflightdeck\.com\/juneau-helicopter-tour-weight-limits-and-seating/,
  );
  assert.match(
    html,
    /https:\/\/juneauflightdeck\.com\/juneau\/what-to-do-if-helicopter-tour-canceled/,
  );

  // Verify Rezgo (#31703, #344494, refid=dccjuneau10) and Viator (#331813P1, #6251SHOREXICEWALK, #110048P1, P00281144) seller CTAs
  assert.equal(WEEKEND_ADVENTURE_CARDS.length, 6);
  for (const card of WEEKEND_ADVENTURE_CARDS) {
    assert.ok(card.primaryCta);
    if (card.channelType === "rezgo_direct") {
      assert.match(card.primaryCta.href, /\/go\/out\?/);
      assert.match(card.primaryCta.href, /refid%3Ddccjuneau10|refid=dccjuneau10/);
      assert.match(card.primaryCta.href, /qa=1/);
    } else if (card.channelType === "viator_partner") {
      assert.match(
        card.primaryCta.href,
        /^https:\/\/www\.destinationcommandcenter\.com\/go\/commerce\/handoff\?/,
      );
      assert.match(card.primaryCta.href, /account=P00281144/);
      assert.match(card.primaryCta.href, /qa=1/);
    }
  }
});

test("Weekend in Juneau: distinct telemetry events, Preview indexing exclusion, JSON-LD guardrails, and 8-row source ledger", () => {
  const telemetrySrc = readLfseFile("lib/weekendInJuneauTelemetry.ts");
  for (const eventName of [
    "lfse_guide_engagement",
    "lfse_printable_plan_used",
    "lfse_jfd_guide_handoff",
    "lfse_seller_handoff_click",
  ]) {
    assert.ok(telemetrySrc.includes(`"${eventName}"`), `Missing event ${eventName}`);
  }
  assert.match(telemetrySrc, /bookingConfirmed:\s*false/);

  // Preview indexing exclusion
  const proxySrc = readLfseFile("proxy.ts");
  const robotsSrc = readLfseFile("app/robots.ts");
  assert.match(proxySrc, /"X-Robots-Tag",\s*"noindex, nofollow, noarchive"/);
  assert.match(robotsSrc, /disallow:\s*"\/"/);

  // Production sitemap includes /guides/weekend-in-juneau (158 total deterministic entries)
  const entries = sitemap();
  assert.equal(entries.length, 158);
  assert.equal(
    entries.some(
      (e) => e.url === "https://www.lastfrontiershoreexcursions.com/guides/weekend-in-juneau",
    ),
    true,
  );

  // JSON-LD shape check
  const schema = buildWeekendInJuneauGuideJsonLd({
    title: "Weekend in Juneau",
    description: "Fly-in Juneau guide.",
    lastModifiedAt: "2026-11-19",
  });
  const raw = JSON.stringify(schema);
  assert.doesNotMatch(
    raw,
    /"logo"|"aggregateRating"|"review"|"offers"|"priceRange"|"parentOrganization"/i,
  );
  assert.ok(schema["@graph"].some((n) => n["@type"] === "BreadcrumbList"));
  assert.ok(schema["@graph"].some((n) => n["@type"] === "WebPage"));

  assert.equal(WEEKEND_CLAIM_SOURCE_LEDGER.length, 8);
});
