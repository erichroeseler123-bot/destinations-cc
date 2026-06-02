import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const pageSource = readFileSync(
  "apps/welcometotheswamp/app/plan/page.tsx",
  "utf8",
);
const gygSource = readFileSync(
  "apps/welcometotheswamp/lib/getyourguide.ts",
  "utf8",
);

test("WTS plan page is GetYourGuide-first with tracked Viator fallbacks", () => {
  assert.match(pageSource, /<h1>Book a New Orleans swamp tour\.<\/h1>/);
  assert.match(pageSource, /<h2 id="wts-gyg-booking">Book a New Orleans swamp tour<\/h2>/);
  assert.match(pageSource, /Check availability/);
  assert.match(pageSource, /Book this tour/);

  assert.match(pageSource, /buildWtsGetYourGuideSearchHref\("airboat", "wts-plan-airboat"\)/);
  assert.match(pageSource, /buildWtsGetYourGuideSearchHref\("boat", "wts-plan-covered-boat"\)/);
  assert.match(pageSource, /href=\{gygAirboatHref\}/);
  assert.match(pageSource, /data-warm-transfer-click="gyg_hero_airboat"/);
  assert.match(pageSource, /Book through GetYourGuide/);
  assert.match(pageSource, /GetYourGuide activity widget/);
  assert.match(pageSource, /<ActivitiesWidget/);
  assert.match(pageSource, /GetYourGuide availability widget goes here once activity URLs are configured\./);

  assert.match(pageSource, /href=\{links\.airboatHref\}/);
  assert.match(pageSource, /href=\{links\.smallBoatHref\}/);
  assert.match(pageSource, /href=\{links\.pickupHref\}/);
  assert.match(pageSource, /Viator fallback links/);
  assert.match(pageSource, /rel="sponsored noopener noreferrer"/);
  assert.match(pageSource, /data-warm-transfer-click=\{trackingId\}/);

  assert.doesNotMatch(pageSource, /https:\/\/(?:www\.)?viator\.com/i);
});

test("WTS plan renders GetYourGuide booking before Viator fallback", () => {
  const h1Index = pageSource.indexOf("<h1>Book a New Orleans swamp tour.</h1>");
  const gygIndex = pageSource.indexOf("Book through GetYourGuide");
  const activitiesIndex = pageSource.indexOf("<ActivitiesWidget");
  const viatorIndex = pageSource.indexOf("Viator fallback links");

  assert.notEqual(h1Index, -1);
  assert.notEqual(gygIndex, -1);
  assert.notEqual(activitiesIndex, -1);
  assert.notEqual(viatorIndex, -1);
  assert.ok(h1Index < gygIndex);
  assert.ok(gygIndex < activitiesIndex);
  assert.ok(activitiesIndex < viatorIndex);
});

test("WTS GetYourGuide links preserve partner attribution", () => {
  assert.match(gygSource, /NEXT_PUBLIC_GETYOURGUIDE_PARTNER_ID/);
  assert.match(gygSource, /GETYOURGUIDE_PARTNER_ID/);
  assert.match(gygSource, /normalized\.searchParams\.set\("partner_id", partnerId\)/);
  assert.match(gygSource, /normalized\.searchParams\.set\("cmp", campaign\)/);
  assert.match(gygSource, /NEXT_PUBLIC_WTS_GYG_AIRBOAT_TOUR_URL/);
  assert.match(gygSource, /NEXT_PUBLIC_WTS_GYG_BOAT_TOUR_URL/);
});

test("WTS plan mounts existing GetYourGuide availability widgets when configured", () => {
  assert.match(pageSource, /import AvailabilityWidget from "@\/app\/components\/AvailabilityWidget"/);
  assert.match(pageSource, /getWtsAvailabilityTourUrl\("airboat"\)/);
  assert.match(pageSource, /getWtsAvailabilityTourUrl\("boat"\)/);
  assert.match(pageSource, /<AvailabilityWidget/);
  assert.match(pageSource, /campaign="wts-plan-airboat-availability"/);
  assert.match(pageSource, /campaign="wts-plan-boat-availability"/);
  assert.match(pageSource, /data-warm-transfer-click=\{trackingId\}/);
});
