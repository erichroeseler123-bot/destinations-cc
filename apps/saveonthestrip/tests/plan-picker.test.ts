import assert from "node:assert/strict";
import test from "node:test";
import {
  buildTicketOutHref,
  buildTourOutHref,
  PARTNER_DISCLOSURE_TEXT,
  resolveTicketOutboundDestination,
  resolveTourOutboundDestination,
} from "../lib/outbound";
import { buildVegasPlan } from "../lib/planPicker";
import { isRelevantToSaveOnTheStrip } from "../scripts/vercel-ignore.mjs";

const SAMPLE_SHOW = {
  id: "tm-101",
  name: "Comedy Cellar Showcase",
  url: "https://www.ticketmaster.com/comedy-cellar-las-vegas-tickets/event/101",
  imageUrl: null,
  venueName: "Bellagio Theater",
  cityName: "Las Vegas",
  localDate: "2026-12-04",
  localTime: "20:00:00",
  dateTime: "2026-12-05T04:00:00Z",
  timezone: "America/Los_Angeles",
  status: "onsale",
  minPrice: 65,
  maxPrice: 110,
  currency: "USD",
  segment: "Arts & Theatre",
  genre: "Comedy",
  subGenre: "Stand-up",
  attractionNames: ["Comedy Showcase"],
  summary: "Evening stand-up showcase.",
};

const SAMPLE_EXPENSIVE_SHOW = {
  ...SAMPLE_SHOW,
  id: "tm-sphere-999",
  name: "Wizard of Oz at Sphere",
  url: "https://www.ticketmaster.com/wizard-of-oz-sphere/event/999",
  venueName: "Sphere",
  minPrice: 189,
  maxPrice: 349,
  genre: "Spectacle",
};

const SAMPLE_GRAND_CANYON_TOUR = {
  id: "canyonco:55",
  itemPk: 55,
  company: "canyonco",
  slug: "canyonco-west-rim-day-tour",
  name: "Grand Canyon West Rim Day Tour",
  headline: "Full-day canyon excursion",
  description: "All-day guided Grand Canyon outing from Las Vegas.",
  durationMinutes: 600,
  durationLabel: "10 hours",
  fromPrice: "USD 179",
  imageUrl: null,
  productUrl: "https://fareharbor.com/embeds/book/canyonco/items/55/",
  area: "grand-canyon" as const,
  areaLabel: "Grand Canyon",
};

test("Plan Picker selects a verified in-budget paid listing + free alternative + disclosure", () => {
  const plan = buildVegasPlan(
    {
      startDate: "2026-12-04",
      endDate: "2026-12-05",
      area: "central-strip",
      groupSize: "2",
      time: "evening",
      budget: "under-100",
      interest: "shows",
      dcc_handoff_id: "handoff-abc",
    },
    {
      tours: [SAMPLE_GRAND_CANYON_TOUR],
      ticketmasterShows: [SAMPLE_EXPENSIVE_SHOW, SAMPLE_SHOW],
      seatGeekEvents: [],
    },
  );

  assert.ok(plan.paidSuggestion, "expected a paid suggestion within $100 cap");
  assert.equal(plan.paidSuggestion?.title, "Comedy Cellar Showcase");
  assert.equal(plan.paidSuggestion?.verifiedPrice, 65);
  assert.match(plan.paidSuggestion?.bookingHref || "", /^\/api\/tickets\/out\?/);
  assert.match(plan.paidSuggestion?.bookingHref || "", /sourceSlug=saveonthestrip-plan-picker/);
  assert.match(plan.paidSuggestion?.bookingHref || "", /dcc_handoff_id=handoff-abc/);
  assert.equal(plan.paidSuggestion?.disclosure, PARTNER_DISCLOSURE_TEXT);
  assert.match(plan.freeAlternative.primaryTitle, /Bellagio/);
});

test("Plan Picker never invents prices or dead-end booking links when feeds are empty", () => {
  const plan = buildVegasPlan(
    {
      startDate: "2026-12-10",
      endDate: "2026-12-12",
      area: "downtown-fremont",
      groupSize: "5-8",
      time: "evening",
      budget: "under-100",
    },
    {
      tours: [],
      ticketmasterShows: [],
      seatGeekEvents: [],
    },
  );

  assert.equal(plan.paidSuggestion, null);
  assert.ok(plan.paidFallback);
  assert.equal(plan.paidFallback?.reason, "feeds-empty");
  assert.ok((plan.paidFallback?.nextSteps.length || 0) >= 3);
  assert.match(plan.freeAlternative.primaryTitle, /Fremont Street Experience/);
});

test("Plan Picker protects 2-4h windows from full-day canyon tours and respects $0 free budget", () => {
  const shortPlan = buildVegasPlan(
    {
      startDate: "2026-12-04",
      endDate: "2026-12-04",
      area: "south-strip",
      groupSize: "2",
      time: "2-4h",
      budget: "200-plus",
      interest: "outdoors",
    },
    {
      tours: [SAMPLE_GRAND_CANYON_TOUR],
      ticketmasterShows: [],
      seatGeekEvents: [],
    },
  );

  assert.equal(shortPlan.paidSuggestion, null);
  assert.equal(shortPlan.paidFallback?.reason, "no-matching-listing");
  assert.ok(shortPlan.guides.some((g) => g.href === "/before-a-late-flight"));

  const freePlan = buildVegasPlan(
    {
      startDate: "2026-12-04",
      endDate: "2026-12-05",
      area: "south-strip",
      groupSize: "3-4",
      time: "evening",
      budget: "free",
    },
    {
      tours: [SAMPLE_GRAND_CANYON_TOUR],
      ticketmasterShows: [SAMPLE_SHOW],
      seatGeekEvents: [],
    },
  );

  assert.equal(freePlan.paidSuggestion, null);
  assert.equal(freePlan.paidFallback?.reason, "free-budget");
});

test("Outbound resolvers enforce HTTPS host allowlists and only wrap affiliate templates when configured", () => {
  const cleanTicket = resolveTicketOutboundDestination(
    "https://www.ticketmaster.com/event/123",
    "ticketmaster",
    {} as NodeJS.ProcessEnv,
  );
  assert.equal(cleanTicket.ok, true);
  if (cleanTicket.ok) {
    assert.equal(cleanTicket.destination, "https://www.ticketmaster.com/event/123");
    assert.equal(cleanTicket.affiliateWrapped, false);
  }

  const untrustedTicket = resolveTicketOutboundDestination(
    "https://evil.example.com/phish",
    "ticketmaster",
    {} as NodeJS.ProcessEnv,
  );
  assert.equal(untrustedTicket.ok, false);

  const nonHttpsTour = resolveTourOutboundDestination(
    "http://fareharbor.com/embeds/book/demo/items/1/",
    {} as NodeJS.ProcessEnv,
  );
  assert.equal(nonHttpsTour.ok, false);

  const validTourHref = buildTourOutHref({
    target: "https://fareharbor.com/embeds/book/demo/items/1/",
    productSlug: "demo-1",
    company: "demo",
    itemPk: 1,
    area: "hoover-dam",
    attribution: {
      sourcePath: "/plan",
      sourceSlug: "saveonthestrip-plan-picker",
      sourcePage: "/plan",
      topicSlug: "vegas-plan-picker",
      eventDate: "2026-12-04",
      partySize: 2,
    },
  });
  assert.ok(validTourHref?.startsWith("/api/tours/out?"));

  const rejectedTicketHref = buildTicketOutHref({
    target: "https://malicious.test/ticket",
    affiliateTarget: "seatgeek",
    eventId: "1",
    eventName: "Fake",
    attribution: {
      sourcePath: "/plan",
      sourceSlug: "saveonthestrip-plan-picker",
      sourcePage: "/plan",
      topicSlug: "vegas-plan-picker",
    },
  });
  assert.equal(rejectedTicketHref, null);
});

test("Save on the Strip Vercel ignore matcher scopes strictly to SOTS and shared inputs", () => {
  assert.equal(
    isRelevantToSaveOnTheStrip([
      "apps/juneauflightdeck/app/page.tsx",
      "src/data/portCallRegistry.ts",
    ]),
    false,
  );
  assert.equal(
    isRelevantToSaveOnTheStrip(["apps/saveonthestrip/app/plan/page.tsx"]),
    true,
  );
  assert.equal(
    isRelevantToSaveOnTheStrip(["lib/dcc/shared/edgeContextAndPii.ts"]),
    true,
  );
});
