import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { GET as getDccGoOut } from "@/app/go/out/route";
import { flushServerlessAfterTasks } from "@/lib/dcc/analytics/serverlessLifecycle";
import { getApprovedExperiencesForPlace } from "@/lib/getyourguide-approved-experiences";
import { PORT_AUTHORITY_CONFIG } from "@/src/data/port-authority-config";
import { buildPortExcursionHref, buildPortTrackedHref } from "@/src/lib/port-analytics";
import {
  buildWtsGetYourGuideSearchHref,
  getWtsAvailabilityTourUrl,
} from "../../apps/welcometotheswamp/lib/getyourguide";

test("Port Authority excursion links never generate malformed viator.com/tours/<code> URLs and route exact tours via /go/out", async () => {
  for (const [portSlug, cfg] of Object.entries(PORT_AUTHORITY_CONFIG)) {
    for (const item of cfg.excursionCategories) {
      const rawHref = buildPortExcursionHref(portSlug, item, portSlug);
      const tracked = buildPortTrackedHref({
        href: rawHref,
        port: portSlug,
        lane: "authority",
        sourceSection: "port_excursions_category",
        intentQuery: item.viatorQuery || `${portSlug} ${item.label}`,
        categoryLabel: item.label,
      });

      assert.doesNotMatch(
        tracked,
        /^https:\/\/www\.viator\.com\/tours\/[A-Za-z0-9_]+(?:\?|$)/,
        `Malformed direct Viator URL generated for ${portSlug} (${item.label}): ${tracked}`,
      );

      if (item.viatorTourId) {
        assert.ok(
          tracked.startsWith("/go/out?"),
          `Exact tour category for ${portSlug} must route through /go/out: ${tracked}`,
        );
        assert.ok(
          item.viatorBookingUrl &&
            /\/tours\/[^/]+\/[^/]+\/d\d+-[A-Za-z0-9_]+$/.test(item.viatorBookingUrl),
          `Exact tour category for ${portSlug} (${item.viatorTourId}) must include canonical Viator product URL`,
        );

        const res = await getDccGoOut(
          new NextRequest(`https://www.destinationcommandcenter.com${tracked}&qa=1`),
        );
        await flushServerlessAfterTasks();
        assert.equal(res.status, 302);
        const loc = new URL(res.headers.get("location") || "");
        assert.equal(loc.hostname, "www.viator.com");
        assert.equal(loc.searchParams.get("pid"), "P00306962");
        assert.equal(loc.searchParams.get("mcid"), "42383");
        assert.match(loc.pathname, new RegExp(`-${item.viatorTourId}$`, "i"));
      } else {
        assert.ok(tracked.startsWith("/tours?"), `Category search must use /tours?q=: ${tracked}`);
      }
    }
  }
});

test("DCC /go/out detects GetYourGuide provider accurately and attaches partner_id=F2MMUUH", async () => {
  const gygTarget =
    "https://www.getyourguide.com/juneau-alaska-l171160/juneau-mount-roberts-tram-ride-with-app-and-map-t1040499/";
  const res = await getDccGoOut(
    new NextRequest(
      `https://www.destinationcommandcenter.com/go/out?u=${encodeURIComponent(gygTarget)}&port=juneau&product=t1040499&qa=1`,
    ),
  );
  await flushServerlessAfterTasks();

  assert.equal(res.status, 302);
  assert.equal(res.headers.get("x-dcc-provider"), "getyourguide");
  assert.equal(res.headers.get("x-dcc-provider-account"), "F2MMUUH");

  const loc = new URL(res.headers.get("location") || "");
  assert.equal(loc.hostname, "www.getyourguide.com");
  assert.equal(loc.searchParams.get("partner_id"), "F2MMUUH");
  assert.match(loc.searchParams.get("cmp") || "", /__hndf_[0-9a-f]{24}$/);
  assert.match(loc.pathname, /-t1040499\/$/);
});

test("DCC /go/out browser fallback redirects safely when u= is omitted and product= is unknown", async () => {
  const browserRes = await getDccGoOut(
    new Request(
      "https://www.destinationcommandcenter.com/go/out?product=NONEXISTENT_TOUR_999&port=st-thomas&qa=1",
      { headers: { accept: "text/html,application/xhtml+xml" } },
    ),
  );
  assert.equal(browserRes.status, 302);
  assert.equal(
    browserRes.headers.get("x-dcc-handoff-fallback"),
    "unresolved_destination",
  );
  assert.equal(new URL(browserRes.headers.get("location") || "").pathname, "/ports/st-thomas");

  const apiRes = await getDccGoOut(
    new Request(
      "https://www.destinationcommandcenter.com/go/out?product=NONEXISTENT_TOUR_999&mode=json&qa=1",
    ),
  );
  assert.equal(apiRes.status, 400);
});

test("Welcome to the Swamp and DCC approved GetYourGuide helpers resolve verified -t<id> tours with partner_id=F2MMUUH", () => {
  const savedPartner = process.env.NEXT_PUBLIC_GETYOURGUIDE_PARTNER_ID;
  const savedAirboat = process.env.NEXT_PUBLIC_WTS_GYG_AIRBOAT_TOUR_URL;
  const savedBoat = process.env.NEXT_PUBLIC_WTS_GYG_BOAT_TOUR_URL;
  delete process.env.NEXT_PUBLIC_GETYOURGUIDE_PARTNER_ID;
  delete process.env.NEXT_PUBLIC_WTS_GYG_AIRBOAT_TOUR_URL;
  delete process.env.NEXT_PUBLIC_WTS_GYG_BOAT_TOUR_URL;

  try {
    const airboatHref = new URL(buildWtsGetYourGuideSearchHref("airboat", "wts-plan-airboat"));
    assert.equal(airboatHref.searchParams.get("partner_id"), "F2MMUUH");
    assert.match(airboatHref.pathname, /-t69191\/$/);

    const boatHref = new URL(buildWtsGetYourGuideSearchHref("boat", "wts-plan-covered-boat"));
    assert.equal(boatHref.searchParams.get("partner_id"), "F2MMUUH");
    assert.match(boatHref.pathname, /-t20064\/$/);

    assert.match(getWtsAvailabilityTourUrl("airboat"), /-t69191\/$/);
    assert.match(getWtsAvailabilityTourUrl("boat"), /-t20064\/$/);

    assert.ok(getApprovedExperiencesForPlace("cozumel").length >= 5);
    assert.ok(getApprovedExperiencesForPlace("juneau").some((e) => e.booking_url.includes("-t1040499/")));
  } finally {
    if (savedPartner !== undefined) process.env.NEXT_PUBLIC_GETYOURGUIDE_PARTNER_ID = savedPartner;
    if (savedAirboat !== undefined) process.env.NEXT_PUBLIC_WTS_GYG_AIRBOAT_TOUR_URL = savedAirboat;
    if (savedBoat !== undefined) process.env.NEXT_PUBLIC_WTS_GYG_BOAT_TOUR_URL = savedBoat;
  }
});
