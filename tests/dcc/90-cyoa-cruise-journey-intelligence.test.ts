import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextRequest } from "next/server";

import {
  GET as getJourneyIntelligence,
  OPTIONS as optionsJourneyIntelligence,
} from "@/app/api/v1/cruise/journey-intelligence/route";
import {
  GET as getPortReplan,
  OPTIONS as optionsPortReplan,
} from "@/app/ports/[slug]/replan/route";
import { GET as getDccToCruisePromenade } from "@/app/go/dcc-to-cruise-promenade/route";
import { OPTIONS as optionsPublicCorridorEvents } from "@/app/api/public/corridor-events/route";
import { OPTIONS as optionsInternalCorridorEvents } from "@/app/api/internal/corridor-events/route";
import { proxy } from "@/proxy";
import { buildAddToCruisePromenadeUrl } from "@/lib/dcc/shared/addToCruisePromenadeUrl";
import { resolveContextualCruiseReturnBanner } from "@/app/components/dcc/ContextualCruiseReturnBanner";
import CruiseFitWizard from "@/app/components/dcc/CruiseFitWizard";
import CruiseJourneyStageStrip from "@/app/components/dcc/CruiseJourneyStageStrip";
import PortDayExcursionCatalogSection from "@/app/components/dcc/PortDayExcursionCatalogSection";
import {
  DCC_EXCLUDED_PORTFOLIO_SITES,
  DCC_PORTFOLIO_NETWORK_SITES,
  isExcludedPortfolioSite,
} from "@/lib/dcc/portfolioNetworkRegistry";

test("1. Journey Intelligence API returns exact v1 contract across regions, ports, turnaround homeports, and playbooks", async () => {
  const req = new NextRequest(
    "https://destinationcommandcenter.com/api/v1/cruise/journey-intelligence?stage=excursions&region=alaska&month=7&port=juneau&ship=royal-princess&sailDate=2027-07-15&partySize=4",
    {
      method: "GET",
      headers: {
        Origin: "https://cruisepromenade.com",
      },
    },
  );

  const res = await getJourneyIntelligence(req);
  assert.equal(res.status, 200);
  assert.equal(
    res.headers.get("access-control-allow-origin"),
    "https://cruisepromenade.com",
  );

  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.schema, "dcc.cruise-journey-intelligence.v1");
  assert.equal(body.returnBufferRuleMinutes, 120);
  assert.equal(body.leadRule, "Available departures that match your port schedule");
  assert.equal(typeof body.generatedAt, "string");

  // Seasonal guidance
  assert.equal(body.seasonalGuidance.region, "alaska");
  assert.equal(body.seasonalGuidance.month, 7);
  assert.ok(body.seasonalGuidance.weatherSummary.length > 20);
  assert.ok(body.seasonalGuidance.stormOrEnvironmentalWatch?.includes("fog"));
  assert.ok(Array.isArray(body.seasonalGuidance.wildlifeHighlights));
  assert.ok(body.seasonalGuidance.wildlifeHighlights.length >= 2);
  assert.ok(
    body.seasonalGuidance.officialPassportAndVisaLinks.some((l: { url: string }) =>
      l.url.includes("travel.state.gov"),
    ),
  );
  assert.ok(
    body.seasonalGuidance.officialPassportAndVisaLinks.some((l: { url: string }) =>
      l.url.includes("canada.ca"),
    ),
  );

  // Port intelligence
  assert.ok(body.portIntelligence);
  assert.equal(body.portIntelligence.portSlug, "juneau");
  assert.equal(body.portIntelligence.recommendedReturnBufferMinutes, 120);
  assert.equal(
    body.portIntelligence.replanUrl,
    "https://destinationcommandcenter.com/ports/juneau/replan",
  );
  assert.equal(
    body.portIntelligence.portGuideUrl,
    "https://destinationcommandcenter.com/ports/juneau",
  );
  assert.ok(
    ["dock", "tender", "mixed"].includes(body.portIntelligence.dockOrTender),
  );
  assert.ok(Array.isArray(body.portIntelligence.matchingExcursionsPreview));
  for (const item of body.portIntelligence.matchingExcursionsPreview) {
    assert.equal(typeof item.productCode, "string");
    assert.equal(typeof item.title, "string");
    assert.equal(typeof item.durationMinutes, "number");
    assert.ok(
      ["preferred", "reduced_buffer", "needs_verification"].includes(item.bufferState),
    );
    assert.ok(["commissionable", "direct"].includes(item.bookingPathType));
  }

  // Step 31 playbooks
  const scenarioIds = body.emergencyAndChangePlaybooks.map(
    (p: { scenarioId: string }) => p.scenarioId,
  );
  assert.deepEqual(scenarioIds, [
    "flight_delay",
    "missed_embarkation",
    "tender_or_port_cancellation",
    "late_tour_return",
    "lost_luggage",
    "medical_or_insurance",
  ]);
});

test("2. Journey Intelligence API covers all 8 regions, homeport turnaround guidance, CORS rules, and proxy public pass-through", async () => {
  const regions = [
    "caribbean",
    "alaska",
    "europe",
    "bahamas",
    "mexico",
    "hawaii",
    "new-england",
    "transatlantic",
  ];

  for (const region of regions) {
    const req = new NextRequest(
      `https://destinationcommandcenter.com/api/v1/cruise/journey-intelligence?stage=dreaming&region=${region}&month=9`,
    );
    const res = await getJourneyIntelligence(req);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.seasonalGuidance.region, region);
    assert.equal(json.seasonalGuidance.month, 9);
    assert.equal(json.portIntelligence, null);
  }

  // Homeports turnaround check
  const homeports = [
    "miami",
    "port-canaveral",
    "port-everglades",
    "new-orleans",
    "seattle",
    "vancouver",
    "galveston",
    "san-juan",
  ];
  for (const hp of homeports) {
    const req = new NextRequest(
      `https://destinationcommandcenter.com/api/v1/cruise/journey-intelligence?stage=embarkation&port=${hp}&sailDate=2027-03-14`,
    );
    const res = await getJourneyIntelligence(req);
    const json = await res.json();
    assert.ok(json.turnaroundGuidance, `expected turnaroundGuidance for ${hp}`);
    assert.equal(json.turnaroundGuidance.homeportSlug, hp);
    assert.ok(json.turnaroundGuidance.recommendedArrivalLead.length > 15);
    assert.ok(json.turnaroundGuidance.airportTransferBufferNote.length > 15);
    assert.ok(json.turnaroundGuidance.debarkFlightCutoffNote.length > 15);
  }

  // CORS origin checks (trusted vs untrusted)
  for (const trustedOrigin of [
    "https://cruisepromenade.com",
    "https://www.cruisepromenade.com",
    "https://rollcallusa.com",
    "https://www.rollcallusa.com",
    "http://localhost:3000",
  ]) {
    const optRes = await optionsJourneyIntelligence(
      new NextRequest(
        "https://destinationcommandcenter.com/api/v1/cruise/journey-intelligence",
        { method: "OPTIONS", headers: { Origin: trustedOrigin } },
      ),
    );
    assert.equal(optRes.status, 204);
    assert.equal(optRes.headers.get("access-control-allow-origin"), trustedOrigin);
  }

  const untrustedRes = await optionsJourneyIntelligence(
    new NextRequest(
      "https://destinationcommandcenter.com/api/v1/cruise/journey-intelligence",
      { method: "OPTIONS", headers: { Origin: "https://untrusted-scraper.example.com" } },
    ),
  );
  assert.equal(untrustedRes.headers.get("access-control-allow-origin"), null);

  // Proxy public pass-through (must not return 401/403 without internal secret)
  const proxyRes = await proxy(
    new NextRequest(
      "https://destinationcommandcenter.com/api/v1/cruise/journey-intelligence?region=caribbean&month=2",
      { method: "GET" },
    ),
    { waitUntil: () => {} } as any,
  );
  assert.notEqual(proxyRes.status, 401);
  assert.notEqual(proxyRes.status, 403);
});

test("3. Low-bandwidth /ports/[slug]/replan serves <50KB HTML + JSON for juneau & cozumel, preserves journey_id/shareCode, strips PII, and 404s unknown slugs", async () => {
  // Juneau HTML
  const juneauHtmlRes = await getPortReplan(
    new Request(
      "https://destinationcommandcenter.com/ports/juneau/replan?ship=Royal+Princess&date=2027-07-15&arrival=09:00&all_aboard=16:30&disruption=late_docking&journey_id=jrn_test123456&shareCode=BOARD99A&email=leak@example.com&cabin=CABIN9214X&weight=WEIGHT237LBS",
    ),
    { params: Promise.resolve({ slug: "juneau" }) },
  );
  assert.equal(juneauHtmlRes.status, 200);
  assert.equal(
    juneauHtmlRes.headers.get("x-dcc-cold-first-load-budget"),
    "under-50kb-html-css-js",
  );
  const juneauHtml = await juneauHtmlRes.text();
  const juneauBytes = Buffer.byteLength(juneauHtml, "utf8");
  assert.ok(
    juneauBytes < 50 * 1024,
    `Expected Juneau replan HTML < 50 KB, got ${juneauBytes} bytes`,
  );
  assert.ok(juneauHtml.includes("120-minute (2-hour) return buffer"));
  assert.ok(juneauHtml.includes("Available departures that match your port schedule"));
  assert.ok(
    juneauHtml.includes(
      "https://cruisepromenade.com/p/BOARD99A?journey_id=jrn_test123456",
    ),
  );
  // Zero PII leak check
  assert.equal(juneauHtml.includes("leak@example.com"), false);
  assert.equal(juneauHtml.includes("CABIN9214X"), false);
  assert.equal(juneauHtml.includes("WEIGHT237LBS"), false);

  // Cozumel HTML + JSON without shareCode -> links to /journey?stage=in_port
  const cozumelHtmlRes = await getPortReplan(
    new Request(
      "https://destinationcommandcenter.com/ports/cozumel/replan?ship=Icon+of+the+Seas&date=2027-02-18&arrival=08:00&all_aboard=17:00&journey_id=jrn_cozumel88",
    ),
    { params: Promise.resolve({ slug: "cozumel" }) },
  );
  assert.equal(cozumelHtmlRes.status, 200);
  const cozumelHtml = await cozumelHtmlRes.text();
  assert.ok(Buffer.byteLength(cozumelHtml, "utf8") < 50 * 1024);
  assert.ok(cozumelHtml.includes("Cozumel"));
  assert.ok(cozumelHtml.includes("stage=in_port"));
  assert.ok(cozumelHtml.includes("journey_id=jrn_cozumel88"));

  const cozumelJsonRes = await getPortReplan(
    new Request(
      "https://destinationcommandcenter.com/ports/cozumel/replan?format=json&arrival=08:00&all_aboard=17:00&journey_id=jrn_cozumel88",
      { headers: { Origin: "https://cruisepromenade.com" } },
    ),
    { params: Promise.resolve({ slug: "cozumel" }) },
  );
  assert.equal(cozumelJsonRes.status, 200);
  assert.equal(
    cozumelJsonRes.headers.get("access-control-allow-origin"),
    "https://cruisepromenade.com",
  );
  const cozumelJson = await cozumelJsonRes.json();
  assert.equal(cozumelJson.ok, true);
  assert.equal(cozumelJson.schema, "dcc.port-replan.v1");
  assert.equal(cozumelJson.portSlug, "cozumel");
  assert.equal(cozumelJson.returnBufferRuleMinutes, 120);
  assert.equal(cozumelJson.schedule.recommendedBackByPierTime, "15:00");
  assert.ok(cozumelJson.walkableNearPierOptions.length >= 2);
  assert.ok(cozumelJson.emergencyReturnChecklist.length >= 3);
  assert.ok(
    cozumelJson.links.cruisePromenadeReturnUrl.includes("journey_id=jrn_cozumel88"),
  );

  // Reference-tier canonical port also works (<50KB)
  const corunaRes = await getPortReplan(
    new Request("https://destinationcommandcenter.com/ports/a-coruna/replan"),
    { params: Promise.resolve({ slug: "a-coruna" }) },
  );
  assert.equal(corunaRes.status, 200);
  assert.ok(Buffer.byteLength(await corunaRes.text(), "utf8") < 50 * 1024);

  // Unknown port slug -> 404
  const unknownHtmlRes = await getPortReplan(
    new Request("https://destinationcommandcenter.com/ports/not-a-valid-port-xyz/replan"),
    { params: Promise.resolve({ slug: "not-a-valid-port-xyz" }) },
  );
  assert.equal(unknownHtmlRes.status, 404);

  const unknownJsonRes = await getPortReplan(
    new Request(
      "https://destinationcommandcenter.com/ports/not-a-valid-port-xyz/replan?format=json",
    ),
    { params: Promise.resolve({ slug: "not-a-valid-port-xyz" }) },
  );
  assert.equal(unknownJsonRes.status, 404);

  const replanOptRes = await optionsPortReplan(
    new Request("https://destinationcommandcenter.com/ports/juneau/replan", {
      method: "OPTIONS",
      headers: { Origin: "https://rollcallusa.com" },
    }),
  );
  assert.equal(replanOptRes.status, 204);
  assert.equal(
    replanOptRes.headers.get("access-control-allow-origin"),
    "https://rollcallusa.com",
  );
});

test("4. Cross-site journey_id, stage, schedule params, return banner, and corridor-events CORS work with zero PII or governance regressions", async () => {
  // /go/dcc-to-cruise-promenade redirect check
  const goRes = await getDccToCruisePromenade(
    new Request(
      "https://destinationcommandcenter.com/go/dcc-to-cruise-promenade?port=juneau&port_date=2027-07-15&party_size=4&ship=Royal+Princess&journey_id=jrn_handoff_42&stage=excursions&shipArrival=08:00&allAboard=16:30&berth=FKL&tender=dock&qa_test=1&cabin=8102&email=test@example.com&ctx=dcc_ctx_secret",
    ),
  );
  assert.equal(goRes.status, 302);
  const loc = new URL(goRes.headers.get("location")!);
  assert.equal(loc.origin, "https://cruisepromenade.com");
  assert.equal(loc.pathname, "/api/dcc-handoff");
  assert.equal(loc.searchParams.get("journey_id"), "jrn_handoff_42");
  assert.equal(loc.searchParams.get("stage"), "excursions");
  assert.equal(loc.searchParams.get("shipArrival"), "08:00");
  assert.equal(loc.searchParams.get("allAboard"), "16:30");
  assert.equal(loc.searchParams.get("berth"), "FKL");
  assert.equal(loc.searchParams.get("tender"), "dock");
  assert.equal(loc.searchParams.get("qa_test"), "1");
  assert.equal(loc.searchParams.get("cabin"), null);
  assert.equal(loc.searchParams.get("email"), null);
  assert.equal(loc.searchParams.get("ctx"), null);

  // buildAddToCruisePromenadeUrl check
  const addUrl = new URL(
    buildAddToCruisePromenadeUrl({
      title: "Mendenhall Whale Combo",
      port: "juneau",
      date: "2027-07-15",
      partySize: 4,
      journey_id: "jrn_planner_99",
      journeyId: "jrn_planner_99",
      stage: "excursions",
      shareCode: "GRP2027A",
      cabinNumber: "10204",
      email: "hidden@example.com",
      ctx: "dcc_ctx_should_strip",
    }),
  );
  assert.equal(addUrl.searchParams.get("journey_id"), "jrn_planner_99");
  assert.equal(addUrl.searchParams.get("journeyId"), "jrn_planner_99");
  assert.equal(addUrl.searchParams.get("stage"), "excursions");
  assert.equal(addUrl.searchParams.get("shareCode"), "GRP2027A");
  assert.equal(addUrl.searchParams.get("cabinNumber"), null);
  assert.equal(addUrl.searchParams.get("email"), null);
  assert.equal(addUrl.searchParams.get("ctx"), null);

  // ContextualCruiseReturnBanner pure model checks
  const cpGroupBanner = resolveContextualCruiseReturnBanner(
    new URLSearchParams(
      "source=cruisepromenade&shareCode=FAM2027&stage=excursions&port=cozumel&journey_id=jrn_ret_001",
    ),
  );
  assert.ok(cpGroupBanner);
  assert.equal(cpGroupBanner.source, "cruisepromenade");
  assert.equal(
    cpGroupBanner.href,
    "https://cruisepromenade.com/p/FAM2027?journey_id=jrn_ret_001",
  );

  const cpJourneyBanner = resolveContextualCruiseReturnBanner(
    new URLSearchParams(
      "source=cruisepromenade&stage=comparing&ship=icon-of-the-seas&sailDate=2027-04-10&journey_id=jrn_ret_002",
    ),
  );
  assert.ok(cpJourneyBanner);
  assert.equal(
    cpJourneyBanner.href,
    "https://cruisepromenade.com/journey?stage=comparing&ship=icon-of-the-seas&sailDate=2027-04-10&journey_id=jrn_ret_002",
  );

  const rcBanner = resolveContextualCruiseReturnBanner(
    new URLSearchParams(
      "source=rollcallusa&ship=carnival-jubilee&sailDate=2027-06-12&journey_id=jrn_ret_003&ctx=dcc_ctx_forbidden",
    ),
  );
  assert.ok(rcBanner);
  assert.equal(rcBanner.source, "rollcallusa");
  assert.equal(
    rcBanner.href,
    "https://rollcallusa.com/?ship=carnival-jubilee&sailDate=2027-06-12&journey_id=jrn_ret_003",
  );
  assert.equal(rcBanner.href.includes("dcc_ctx_"), false);

  // Corridor events CORS for rollcallusa.com & www.rollcallusa.com
  for (const rcOrigin of ["https://rollcallusa.com", "https://www.rollcallusa.com"]) {
    const pubCors = await optionsPublicCorridorEvents(
      new NextRequest("https://destinationcommandcenter.com/api/public/corridor-events", {
        method: "OPTIONS",
        headers: { Origin: rcOrigin },
      }),
    );
    assert.equal(pubCors.headers.get("access-control-allow-origin"), rcOrigin);

    const intCors = await optionsInternalCorridorEvents(
      new NextRequest("https://destinationcommandcenter.com/api/internal/corridor-events", {
        method: "OPTIONS",
        headers: { Origin: rcOrigin },
      }),
    );
    assert.equal(intCors.headers.get("access-control-allow-origin"), rcOrigin);
  }

  // UI SSR smoke checks
  const wizardHtml = renderToStaticMarkup(React.createElement(CruiseFitWizard));
  assert.ok(wizardHtml.includes("Where are you in your cruise journey?"));
  assert.ok(wizardHtml.includes("cyoa-stage-selector"));

  const stripHtml = renderToStaticMarkup(React.createElement(CruiseJourneyStageStrip));
  assert.ok(stripHtml.includes("12-Stage Cruise Journey: Choose Where You Are"));
  assert.ok(stripHtml.includes("rollcallusa.com"));

  const catalogHtml = renderToStaticMarkup(
    React.createElement(PortDayExcursionCatalogSection, {
      portSlug: "juneau",
      initialShipArrivalTime: "08:00",
      initialShipAllAboardTime: "16:30",
    }),
  );
  assert.ok(catalogHtml.includes('data-testid="tab-shortlist-2h"'));
  assert.ok(catalogHtml.includes("Available departures that match your port schedule"));

  // Mandatory Governance Guardrail 1 check
  assert.equal(DCC_PORTFOLIO_NETWORK_SITES.length, 12);
  assert.equal(DCC_EXCLUDED_PORTFOLIO_SITES.length, 2);
  assert.equal(
    isExcludedPortfolioSite("rollcallusa.com"),
    true,
    "rollcallusa must remain in DCC_EXCLUDED_PORTFOLIO_SITES",
  );
  assert.equal(
    isExcludedPortfolioSite("welcometoalaskatours.com"),
    true,
    "welcometoalaskatours must remain in DCC_EXCLUDED_PORTFOLIO_SITES",
  );
});
