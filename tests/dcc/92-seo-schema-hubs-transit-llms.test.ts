import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import {
  buildEventVenueJsonLd,
  buildPlaceJsonLd,
  resolveVenueGeo,
} from "@/lib/dcc/jsonld";
import {
  generateMetadata as generateLocationMetadata,
  generateStaticParams as generateLocationStaticParams,
  revalidate as locationRevalidate,
} from "@/app/location/[lat]/[lng]/page";
import { getEffectivePorts } from "@/lib/dcc/ports";
import {
  getAllTravelReferenceNodes,
  resolveTransportModeComparison,
} from "@/lib/dcc/travelReferenceCore";
import {
  getRegionalHubByStateSlug,
  listPromotedRegionalHubs,
  listRegionalHubs,
} from "@/lib/dcc/regionalHubs";
import {
  getPublicationManifestEntry,
} from "@/src/data/publication-manifest";
import { INDEXABLE_SURFACE_PATHS } from "@/src/data/indexable-surface";
import { getGovernedRobotsTag } from "@/proxy";
import { GET as getRootLlmsTxt } from "@/app/llms.txt/route";
import { GET as getJuneauLlmsTxt } from "@/app/juneau/llms.txt/route";
import { GET as getRedRocksLlmsTxt } from "@/app/red-rocks/llms.txt/route";
import { GET as getNolaLlmsTxt } from "@/app/new-orleans/llms.txt/route";
import { GET as getVegasLlmsTxt } from "@/app/vegas/llms.txt/route";
import { GET as getRouteLlmsTxt } from "@/app/routes/[slug]/llms.txt/route";
import { GET as getDestinationStateLlmsTxt } from "@/app/destinations/[state]/llms.txt/route";
import { GET as getRegionLlmsTxt } from "@/app/regions/[region]/llms.txt/route";

test("1. Schema.org Engine: buildEventVenueJsonLd and buildPlaceJsonLd emit GeoCoordinates when known and omit geo when venue coordinates are unknown", () => {
  const rrGeo = resolveVenueGeo("red-rocks-amphitheatre");
  assert.deepEqual(rrGeo, {
    lat: 39.6654,
    lng: -105.2057,
    capacity: 9525,
    region: "CO",
  });

  // Unknown venue coordinates must remain undefined (never fall back to city coordinates)
  const unknownGeo = resolveVenueGeo("unmapped-venue-in-denver");
  assert.equal(unknownGeo, undefined);

  const unknownVenueSchema = buildEventVenueJsonLd({
    path: "/venues/unmapped-venue-in-denver",
    name: "Unmapped Venue",
    geo: unknownGeo,
  });
  assert.equal(unknownVenueSchema["@type"], "EventVenue");
  assert.equal(
    "geo" in unknownVenueSchema && unknownVenueSchema.geo !== undefined,
    false,
    "EventVenue schema must omit geo when venue coordinates are unknown",
  );

  const venueSchema = buildEventVenueJsonLd({
    path: "/venues/red-rocks-amphitheatre",
    name: "Red Rocks Park & Amphitheatre",
    description: "Open-air amphitheatre in Morrison, Colorado.",
    address: {
      streetAddress: "18300 W Alameda Pkwy",
      locality: "Morrison",
      region: "CO",
      postalCode: "80465",
      country: "US",
    },
    geo: rrGeo ? { lat: rrGeo.lat, lng: rrGeo.lng } : undefined,
    maximumAttendeeCapacity: rrGeo?.capacity,
    containedInPlaceName: "Morrison",
    containedInPlacePath: "/destinations/colorado",
  });

  assert.equal(venueSchema["@type"], "EventVenue");
  assert.equal(
    venueSchema["@id"],
    "https://destinationcommandcenter.com/venues/red-rocks-amphitheatre#venue",
  );
  assert.equal(venueSchema.maximumAttendeeCapacity, 9525);
  assert.deepEqual(venueSchema.geo, {
    "@type": "GeoCoordinates",
    latitude: 39.6654,
    longitude: -105.2057,
  });
  assert.deepEqual(venueSchema.address, {
    "@type": "PostalAddress",
    streetAddress: "18300 W Alameda Pkwy",
    addressLocality: "Morrison",
    addressRegion: "CO",
    postalCode: "80465",
    addressCountry: "US",
  });

  const ports = getEffectivePorts();
  const juneauPort = ports.find((p) => p.slug === "juneau");
  assert.ok(juneauPort, "Expected Juneau port in getEffectivePorts()");
  assert.equal(typeof juneauPort.lat, "number");
  assert.equal(typeof (juneauPort.lng ?? juneauPort.lon), "number");

  const portSchema = buildPlaceJsonLd({
    path: `/ports/${juneauPort.slug}`,
    name: juneauPort.name,
    description: juneauPort.description,
    address: {
      locality: juneauPort.city || juneauPort.name,
      region: juneauPort.state,
      country: juneauPort.country,
    },
    geo: {
      lat: juneauPort.lat,
      lng: juneauPort.lng ?? juneauPort.lon,
    },
  });

  assert.deepEqual(portSchema.geo, {
    "@type": "GeoCoordinates",
    latitude: juneauPort.lat,
    longitude: juneauPort.lng ?? juneauPort.lon,
  });
});

test("2. Auto-Generated Regional Hub Pages group coordinates, reference nodes, venues, ports, and decision guides from manifest", () => {
  const allHubs = listRegionalHubs();
  assert.equal(allHubs.length, 8);

  const promotedHubs = listPromotedRegionalHubs();
  assert.deepEqual(
    promotedHubs.map((h) => h.slug),
    ["colorado", "alaska", "louisiana", "nevada"],
  );

  // Verify Colorado Hub
  const coHub = getRegionalHubByStateSlug("colorado");
  assert.ok(coHub);
  assert.equal(coHub.stateCode, "US-CO");
  assert.deepEqual(
    coHub.referenceNodes.map((n) => n.id),
    ["red-rocks", "denver-breckenridge"],
  );
  assert.ok(
    coHub.coordinates.some((c) => c.locationPath === "/location/39.66540/-105.20570"),
    "Colorado hub must link Red Rocks coordinate",
  );
  assert.ok(
    coHub.coordinates.some((c) => c.locationPath === "/location/39.48170/-106.03840"),
    "Colorado hub must link Breckenridge coordinate",
  );
  assert.ok(
    coHub.venues.some((v) => v.href === "/venues/red-rocks-amphitheatre"),
    "Colorado hub must link Red Rocks venue",
  );

  // Verify Alaska Hub
  const akHub = getRegionalHubByStateSlug("alaska");
  assert.ok(akHub);
  assert.equal(akHub.referenceNodes[0]?.id, "juneau");
  assert.ok(akHub.ports.some((p) => p.href === "/ports/juneau"));
  assert.ok(
    akHub.coordinates.some((c) => c.locationPath === "/location/58.30190/-134.41970"),
  );

  // Verify Louisiana Hub
  const laHub = getRegionalHubByStateSlug("louisiana");
  assert.ok(laHub);
  assert.equal(laHub.referenceNodes[0]?.id, "new-orleans");
  assert.ok(laHub.ports.some((p) => p.href === "/ports/new-orleans"));
  assert.ok(laHub.decisionGuides.length >= 6, "Louisiana hub must pull in published swamp decision guides");

  // Verify Publication Manifest & Indexable Surface governance for canonical /destinations/[state] hubs
  for (const path of [
    "/destinations",
    "/destinations/colorado",
    "/destinations/alaska",
    "/destinations/louisiana",
    "/destinations/nevada",
  ]) {
    const entry = getPublicationManifestEntry(path);
    assert.ok(entry, `Expected ${path} in PUBLICATION_MANIFEST`);
    assert.equal(entry.acceptanceState, "public_indexable");
    assert.equal(INDEXABLE_SURFACE_PATHS.includes(path), true);
    assert.equal(getGovernedRobotsTag(path), "index, follow");
  }

  // Duplicate /regions/[state] aliases are withdrawn from indexability and canonicalize to /destinations/[state]
  for (const state of ["colorado", "alaska", "louisiana", "nevada"]) {
    const aliasPath = `/regions/${state}`;
    const entry = getPublicationManifestEntry(aliasPath);
    assert.ok(entry, `Expected ${aliasPath} in PUBLICATION_MANIFEST`);
    assert.equal(entry.acceptanceState, "withdrawn_historical");
    assert.equal(entry.includeInSitemap, false);
    assert.equal(entry.canonicalUrl, `https://destinationcommandcenter.com/destinations/${state}`);
    assert.equal(INDEXABLE_SURFACE_PATHS.includes(aliasPath), false);
    assert.equal(getGovernedRobotsTag(aliasPath), "noindex, nofollow");
  }

  // Unpromoted telemetry state hubs remain public_non_indexable
  const flEntry = getPublicationManifestEntry("/destinations/florida");
  assert.equal(flEntry?.acceptanceState, "public_non_indexable");
  assert.equal(getGovernedRobotsTag("/destinations/florida"), "noindex, nofollow");
});

test("3. Transit Comparison Component & Data: every transport mode across all 5 flagship nodes exposes pricing, egress timing, and statutory rules", () => {
  const nodes = getAllTravelReferenceNodes();
  assert.equal(nodes.length, 5);

  for (const node of nodes) {
    assert.ok(node.gettingThereAndAround.modes.length >= 3);
    for (const mode of node.gettingThereAndAround.modes) {
      const comp = resolveTransportModeComparison(mode);
      assert.ok(comp.pricingModel && comp.pricingModel.length > 10, `Missing pricingModel for ${mode.id}`);
      assert.ok(
        comp.egressOrTransitTiming && comp.egressOrTransitTiming.length > 10,
        `Missing egressOrTransitTiming for ${mode.id}`,
      );
      assert.ok(
        comp.statutoryOrOperationalRule && comp.statutoryOrOperationalRule.length > 10,
        `Missing statutoryOrOperationalRule for ${mode.id}`,
      );
      assert.equal(mode.pricingModel, comp.pricingModel);
      assert.equal(mode.egressOrTransitTiming, comp.egressOrTransitTiming);
      assert.equal(mode.statutoryOrOperationalRule, comp.statutoryOrOperationalRule);
    }
  }

  const redRocks = nodes.find((n) => n.id === "red-rocks")!;
  const rrRideshare = redRocks.gettingThereAndAround.modes.find((m) => m.id === "rr-rideshare")!;
  assert.match(rrRideshare.egressOrTransitTiming || "", /Jurassic Lot/i);
  assert.match(rrRideshare.egressOrTransitTiming || "", /60–90/);

  const i70 = nodes.find((n) => n.id === "denver-breckenridge")!;
  const rentalMode = i70.gettingThereAndAround.modes.find((m) => m.id === "db-rental-car-driving")!;
  assert.match(rentalMode.statutoryOrOperationalRule || "", /42-4-106/);
  assert.match(rentalMode.statutoryOrOperationalRule || "", /Code 15/);
});

test("4. Granular Regional AI Readmes (/[region]/llms.txt) serve lightweight, rule-based sub-manifests", async () => {
  const rootRes = await getRootLlmsTxt();
  const rootText = await rootRes.text();
  assert.match(rootText, /\/juneau\/llms\.txt/);
  assert.match(rootText, /\/red-rocks\/llms\.txt/);
  assert.match(rootText, /\/routes\/denver-breckenridge\/llms\.txt/);
  assert.match(rootText, /\/destinations\/colorado\/llms\.txt/);
  assert.match(rootText, /\/destinations\/alaska\/llms\.txt/);

  const juneauRes = await getJuneauLlmsTxt();
  assert.equal(juneauRes.status, 200);
  const juneauText = await juneauRes.text();
  assert.match(juneauText, /Juneau Cruise Port-Day Buffer Math/);
  assert.match(juneauText, /1:59:59\+/);
  assert.match(juneauText, /120-minute/);
  assert.doesNotMatch(juneauText, /42-4-106/, "Juneau llms.txt should not contain Colorado I-70 statute");

  const rrRes = await getRedRocksLlmsTxt();
  assert.equal(rrRes.status, 200);
  const rrText = await rrRes.text();
  assert.match(rrText, /Jurassic Lot/);
  assert.match(rrText, /6,450 ft/);

  const nolaRes = await getNolaLlmsTxt();
  assert.equal(nolaRes.status, 200);
  const nolaText = await nolaRes.text();
  assert.match(nolaText, /162-609/);
  assert.match(nolaText, /\$36\.00/);

  const vegasRes = await getVegasLlmsTxt();
  assert.equal(vegasRes.status, 200);
  const vegasText = await vegasRes.text();
  assert.match(vegasText, /Nevada Taxicab Authority/);
  assert.match(vegasText, /Red Rock Canyon/);

  const routeRes = await getRouteLlmsTxt(
    new NextRequest("https://destinationcommandcenter.com/routes/denver-breckenridge/llms.txt"),
    { params: Promise.resolve({ slug: "denver-breckenridge" }) },
  );
  assert.equal(routeRes.status, 200);
  const routeText = await routeRes.text();
  assert.match(routeText, /C\.R\.S\. § 42-4-106/);

  const coHubRes = await getDestinationStateLlmsTxt(
    new NextRequest("https://destinationcommandcenter.com/destinations/colorado/llms.txt"),
    { params: Promise.resolve({ state: "colorado" }) },
  );
  assert.equal(coHubRes.status, 200);
  const coHubText = await coHubRes.text();
  assert.match(coHubText, /Colorado \(US-CO\) — DCC Regional AI Sub-Manifest/);
  assert.match(coHubText, /\/red-rocks\/llms\.txt/);
  assert.match(coHubText, /\/routes\/denver-breckenridge\/llms\.txt/);

  const akRegionRes = await getRegionLlmsTxt(
    new NextRequest("https://destinationcommandcenter.com/regions/alaska/llms.txt"),
    { params: Promise.resolve({ region: "alaska" }) },
  );
  assert.equal(akRegionRes.status, 200);
  const akRegionText = await akRegionRes.text();
  assert.match(akRegionText, /Alaska \(US-AK\) — DCC Regional AI Sub-Manifest/);
  assert.match(akRegionText, /\/juneau\/llms\.txt/);
});

test("5. Root-layout caching fix and location-page ISR / robots metadata alignment are preserved", async () => {
  const rootDir = process.cwd();
  const staticIsrFiles = [
    "app/layout.tsx",
    "app/location/[lat]/[lng]/page.tsx",
    "app/juneau/page.tsx",
    "app/red-rocks/page.tsx",
    "app/new-orleans/page.tsx",
    "app/vegas/page.tsx",
    "app/routes/[slug]/page.tsx",
    "app/ports/[slug]/page.tsx",
    "app/venues/[slug]/page.tsx",
    "app/destinations/page.tsx",
    "app/destinations/[state]/page.tsx",
  ];

  for (const relPath of staticIsrFiles) {
    const content = fs.readFileSync(path.join(rootDir, relPath), "utf8");
    assert.doesNotMatch(
      content,
      /from ["']next\/headers["']/,
      `${relPath} must not import next/headers (would opt route out of ISR caching)`,
    );
    assert.doesNotMatch(
      content,
      /export const dynamic\s*=\s*["']force-dynamic["']/,
      `${relPath} must not use force-dynamic`,
    );
  }

  assert.equal(locationRevalidate, 300);
  const staticParams = generateLocationStaticParams();
  assert.equal(staticParams.length, 16);
  assert.deepEqual(staticParams[1], { lat: "39.66540", lng: "-105.20570" });

  // Coordinate with canonicalNamedPath (/red-rocks) respects canonicalNamedPath in metadata and manifest
  const rrMeta = await generateLocationMetadata({
    params: Promise.resolve({ lat: "39.66540", lng: "-105.20570" }),
  });
  assert.deepEqual(rrMeta.robots, { index: false, follow: false });
  assert.equal(
    rrMeta.alternates?.canonical,
    "https://destinationcommandcenter.com/red-rocks",
  );
  const rrManifest = getPublicationManifestEntry("/location/39.66540/-105.20570");
  assert.equal(
    rrManifest?.canonicalUrl,
    "https://destinationcommandcenter.com/red-rocks",
  );

  // Coordinate without canonicalNamedPath (Big Sky, MT) falls back to /location/{lat}/{lng}
  const bigSkyMeta = await generateLocationMetadata({
    params: Promise.resolve({ lat: "45.26180", lng: "-111.30800" }),
  });
  assert.deepEqual(bigSkyMeta.robots, { index: false, follow: false });
  assert.equal(
    bigSkyMeta.alternates?.canonical,
    "https://destinationcommandcenter.com/location/45.26180/-111.30800",
  );
  const bigSkyManifest = getPublicationManifestEntry("/location/45.26180/-111.30800");
  assert.equal(
    bigSkyManifest?.canonicalUrl,
    "https://destinationcommandcenter.com/location/45.26180/-111.30800",
  );
});

test("6. /vegas ISR policy (3600s) and separation of short-lived telemetry from HTML revalidation (300s / 3600s)", async () => {
  const rootDir = process.cwd();

  const ticketmasterSrc = fs.readFileSync(
    path.join(rootDir, "lib/dcc/providers/adapters/ticketmaster.ts"),
    "utf8",
  );
  assert.doesNotMatch(
    ticketmasterSrc,
    /cache:\s*["']no-store["']/,
    "ticketmasterAdapter must not use cache: 'no-store' (would force /vegas into dynamic rendering)",
  );
  assert.match(ticketmasterSrc, /next:\s*\{\s*revalidate:\s*3600\s*\}/);

  const locationPageSrc = fs.readFileSync(
    path.join(rootDir, "app/location/[lat]/[lng]/page.tsx"),
    "utf8",
  );
  assert.match(locationPageSrc, /export const revalidate = 300;/);
  assert.match(locationPageSrc, /minRevalidateSeconds:\s*300/);
  assert.match(locationPageSrc, /revalidateSeconds:\s*300/);

  const travelRefExpSrc = fs.readFileSync(
    path.join(rootDir, "app/components/dcc/TravelReferenceExperience.tsx"),
    "utf8",
  );
  assert.match(travelRefExpSrc, /minRevalidateSeconds:\s*3600/);
  assert.match(travelRefExpSrc, /LiveCoordinateTelemetryCards/);

  for (const relPath of [
    "app/red-rocks/page.tsx",
    "app/juneau/page.tsx",
    "app/new-orleans/page.tsx",
    "app/routes/[slug]/page.tsx",
    "app/vegas/page.tsx",
  ]) {
    const pageSrc = fs.readFileSync(path.join(rootDir, relPath), "utf8");
    assert.match(
      pageSrc,
      /export const revalidate = 3600;/,
      `Expected export const revalidate = 3600 in ${relPath}`,
    );
  }
});

test("7. Sitemap excludes duplicate /regions/[state], proxy 308 redirects /regions/[state] -> /destinations/[state], and visitor browser event collection works without admin credentials", async () => {
  const { buildDccSitemapXml, listDccSitemapPaths } = await import("@/app/sitemap.xml/handler");
  const { proxy } = await import("@/proxy");
  const { POST: postPublicCorridorEvent } = await import("@/app/api/public/corridor-events/route");
  const { POST: postInternalCorridorEvent } = await import("@/app/api/internal/corridor-events/route");
  const { buildDecisionFunnelPayload, CORRIDOR_EVENT_ENDPOINT } = await import("@/lib/analytics");

  const paths = listDccSitemapPaths();
  const xml = buildDccSitemapXml();
  assert.equal(paths.length, 33, "Sitemap should contain 33 canonical indexable URLs after removing 4 duplicate /regions/[state] aliases");
  for (const state of ["colorado", "alaska", "louisiana", "nevada"]) {
    assert.equal(paths.includes(`/destinations/${state}`), true);
    assert.equal(paths.includes(`/regions/${state}`), false);
    assert.equal(xml.includes(`https://destinationcommandcenter.com/destinations/${state}`), true);
    assert.equal(xml.includes(`https://destinationcommandcenter.com/regions/${state}`), false);
  }

  for (const state of ["colorado", "alaska", "louisiana", "nevada", "florida"]) {
    const req = new NextRequest(`https://destinationcommandcenter.com/regions/${state}?date=2026-07-15`);
    const res = await proxy(req);
    assert.equal(res.status, 308);
    assert.equal(
      res.headers.get("location"),
      `https://destinationcommandcenter.com/destinations/${state}?date=2026-07-15`,
    );
  }

  // Unauthenticated browser event POST must pass proxy without 401
  const eventPayload = {
    corridor_id: "juneau",
    event_name: "plan_modified",
    session_id: "smoke_unit_visitor_event",
    source_page: "/juneau",
    landing_path: "/juneau",
    target_path: "/juneau",
    fit_signal: "two_activity_combo",
    metadata: {
      test: true,
      synthetic: true,
      modified_field: "arrivalDock",
      arrival_dock: "aj_dock",
    },
  };

  const proxyPublicReq = new NextRequest("https://destinationcommandcenter.com/api/public/corridor-events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(eventPayload),
  });
  const proxyPublicRes = await proxy(proxyPublicReq);
  assert.notEqual(proxyPublicRes.status, 401, "Public visitor event endpoint must never return 401");

  const proxyInternalReq = new NextRequest("https://destinationcommandcenter.com/api/internal/corridor-events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(eventPayload),
  });
  const proxyInternalRes = await proxy(proxyInternalReq);
  assert.notEqual(proxyInternalRes.status, 401, "Legacy visitor event POST endpoint must not return 401 in proxy");

  // Protected internal admin API route still requires admin authorization
  const protectedAdminReq = new NextRequest("https://destinationcommandcenter.com/api/internal/earthos/reference-maintenance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "refresh_snapshot" }),
  });
  const protectedAdminRes = await proxy(protectedAdminReq);
  assert.equal(protectedAdminRes.status, 401, "Admin endpoints under /api/internal/* must still enforce 401 when unauthenticated");

  // Route handler accepts unauthenticated visitor event POST and returns 200
  const routeReq1 = new NextRequest("https://destinationcommandcenter.com/api/public/corridor-events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(eventPayload),
  });
  const routeRes1 = await postPublicCorridorEvent(routeReq1);
  assert.equal(routeRes1.status, 200);
  const routeData1 = await routeRes1.json();
  assert.equal(routeData1.ok, true);
  assert.equal(routeData1.corridorId, "juneau");

  const routeReq2 = new NextRequest("https://destinationcommandcenter.com/api/internal/corridor-events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(eventPayload),
  });
  const routeRes2 = await postInternalCorridorEvent(routeReq2);
  assert.equal(routeRes2.status, 200);

  // Verify client analytics builder maps decision-interaction events
  assert.equal(CORRIDOR_EVENT_ENDPOINT, "/api/public/corridor-events");
  const funnelModified = buildDecisionFunnelPayload("plan_modified", {
    surface: "juneau",
    corridor: "juneau",
    page: "/juneau",
    intent: "two_activity_combo",
    modified_field: "arrivalDock",
  });
  assert.ok(funnelModified);
  assert.equal(funnelModified.corridor_id, "juneau");
  assert.equal(funnelModified.event_name, "plan_modified");
  assert.equal(funnelModified.fit_signal, "two_activity_combo");
});

test("8. Administrator review demonstration: evidence-backed candidate approval reaches published output in both dcc-research (dcc.answers.v1) and DCC Travel Reference / Port-Day Decision Engine", async () => {
  const {
    evaluatePilotTransportationAnswer,
    filterDccAnswerForConsumer,
    buildPilotQuestionFaqEntry,
    inspectPortalApprovalCapability,
  } = await import("../../../dcc-research/lib/dcc/answers/dccAnswersV1");
  const { evaluateTravelReferenceNodePublishability } = await import("@/src/data/publication-manifest");
  const { getTravelReferenceNode } = await import("@/lib/dcc/travelReferenceCore");
  const {
    DEFAULT_JUNEAU_SCENARIO_INPUT,
    evaluateJuneauPortDayScenario,
  } = await import("@/lib/dcc/juneauPortDayEngine");

  const nowUtcIso = "2026-10-21T18:02:00Z";
  const grayLineSha = "3d75567b7bbad0683d75567b7bbad0683d75567b7bbad0683d75567b7bbad068";
  const grayLineFaqSha = "a1ef9012bc345678a1ef9012bc345678a1ef9012bc345678a1ef9012bc345678";

  // 1. Before approval: candidate 4d242c7a31e7e6aea34b02c0 is in "Needs confirmation" (0 human-confirmed facts)
  const unconfirmedStore: any = {
    schema_version: "dcc.producer-input.v1",
    authority: "dcc-research-review",
    store_authority: "dcc-research-review",
    cluster: "new-orleans-swamp",
    read_at: "2026-10-21T18:01:00Z",
    complete: true,
    human_review_audits: {},
    candidates: {
      "4d242c7a31e7e6aea34b02c0": {
        claim_id: "claim:gray-line-large-airboat:pickup-rules",
        fact_id: "4d242c7a31e7e6aea34b02c0",
        product_id: "gray-line-large-airboat",
        product_name: "Large Airboat Swamp Adventure",
        operator_name: "Gray Line New Orleans",
        variant_id: "large-airboat-15-27-pax",
        variant_label: "Large Airboat (15-27 passenger)",
        booking_channel: "direct_operator_website",
        product_mapping_verified: true,
        claim_domain: "transportation",
        constraint_type: "pickup_rules",
        summary_text:
          "Gray Line New Orleans provides round-trip transportation on its Large Airboat Swamp Adventure departing from the Gray Line Lighthouse Ticket Office at 400 Toulouse St. (Steamboat NATCHEZ dock), with Downtown/CBD hotel pickup available only for groups of 10+ arranged 24 hours in advance.",
        prose_heading: "Gray Line New Orleans — Large Airboat Swamp Adventure",
        prose_body:
          "On the direct Gray Line Large Airboat page, round-trip motorcoach transportation is offered from 400 Toulouse St. in the French Quarter, while Downtown/CBD hotel pickup requires a group of 10 or more arranged at least 24 hours in advance.",
        structured_value: "Round-trip transportation from 400 Toulouse St.; group hotel pickup for 10+ with 24h notice",
        unit: "policy",
        conditions: "Departing from Gray Line Lighthouse Ticket Office at 400 Toulouse St.; hotel pickup for groups of 10+ with 24h advance arrangement.",
        transportation_offered: "Yes (round-trip motorcoach from 400 Toulouse St.)",
        included_or_fee: "Select With Transportation fare option on direct operator page",
        pickup_scope: "400 Toulouse St. (Steamboat NATCHEZ dock); CBD/French Quarter hotels for groups of 10+ with 24h notice",
        temporal_bounds: {
          valid_from: null,
          valid_through: null,
          requires_trip_date: false,
        },
        source_url: "https://www.graylineneworleans.com/swamp-tours/large-airboat-swamp-adventure/",
        source_excerpt: "Round-trip transportation",
        approved_revision: 1,
        current_revision: 1,
        approved_readable_text_sha256: grayLineSha,
        current_readable_text_sha256: grayLineSha,
        raw_html_sha256: null,
        source_checked_at: "2026-10-21T18:00:00Z",
        snapshot_expires_at: "2026-10-21T18:04:30Z",
        source_healthy: true,
        review_status: "Needs confirmation",
        verified_on: null,
        verified_by: null,
        review_due_on: null,
        last_review_token: null,
        approval_origin: "hosted_portal_human_review",
        approval_revoked_by_source_change: false,
        companion_dependencies: {
          e5530f35d8cf28936a19781f: {
            fact_id: "e5530f35d8cf28936a19781f",
            constraint_type: "meeting_point",
            required: true,
            product_id: "gray-line-large-airboat",
            variant_id: "large-airboat-15-27-pax",
            booking_channel: "direct_operator_website",
            source_url: "https://www.graylineneworleans.com/swamp-tours/large-airboat-swamp-adventure/",
            source_excerpt: "Gray Line Lighthouse Ticket Office at Toulouse St. Wharf (400 Toulouse St.)",
            structured_value: "400 Toulouse St. (Steamboat NATCHEZ dock)",
            approved_revision: 1,
            current_revision: 1,
            approved_readable_text_sha256: grayLineSha,
            current_readable_text_sha256: grayLineSha,
            source_checked_at: "2026-10-21T18:00:00Z",
            snapshot_expires_at: "2026-10-21T18:04:30Z",
            source_healthy: true,
            review_status: "Needs confirmation",
            verified_on: null,
            verified_by: null,
            review_due_on: null,
            last_review_token: null,
            approval_origin: "hosted_portal_human_review",
            approval_revoked_by_source_change: false,
          },
        },
      },
    },
  };

  const beforeAnswer = evaluatePilotTransportationAnswer(unconfirmedStore, { nowUtcIso });
  assert.equal(beforeAnswer.outcome, "insufficient_confirmed_evidence");
  assert.equal(beforeAnswer.opening_claims.length, 0);
  assert.equal(beforeAnswer.comparison_rows.length, 0);
  assert.equal(buildPilotQuestionFaqEntry(beforeAnswer), null);

  // 2. Administrator reviews primary source, sets Confirmed status + review_due_on expiry, and consumes review token
  const approvedStore: any = structuredClone(unconfirmedStore);
  const cand = approvedStore.candidates["4d242c7a31e7e6aea34b02c0"];
  cand.review_status = "Confirmed";
  cand.verified_on = "2026-10-21";
  cand.verified_by = "dcc-editorial-review";
  cand.review_due_on = "2026-11-20";
  cand.last_review_token = "tok_grayline_4d242c7a31e7e6aea34b";

  const dep = cand.companion_dependencies["e5530f35d8cf28936a19781f"];
  dep.review_status = "Confirmed";
  dep.verified_on = "2026-10-21";
  dep.verified_by = "dcc-editorial-review";
  dep.review_due_on = "2026-11-20";
  dep.last_review_token = "tok_grayline_e5530f35d8cf28936a19";

  approvedStore.human_review_audits = {
    "4d242c7a31e7e6aea34b02c0": {
      fact_id: "4d242c7a31e7e6aea34b02c0",
      decision: "Confirmed",
      action: "confirm",
      human_attested: true,
      reviewer_id: "dcc-editorial-review",
      approved_revision: 1,
      approved_readable_text_sha256: grayLineSha,
      verified_on: "2026-10-21",
      review_due_on: "2026-11-20",
      source_opened_at: "2026-10-21T17:58:00Z",
      reviewed_at: "2026-10-21T17:59:00Z",
      review_token: "tok_grayline_4d242c7a31e7e6aea34b",
      review_token_consumed: true,
      review_token_consumed_at: "2026-10-21T17:59:00Z",
      canonical_product_id: "gray-line-large-airboat",
      atomic_constraint_type: "pickup_rules",
      value: cand.structured_value,
      source_url: cand.source_url,
    },
    e5530f35d8cf28936a19781f: {
      fact_id: "e5530f35d8cf28936a19781f",
      decision: "Confirmed",
      action: "confirm",
      human_attested: true,
      reviewer_id: "dcc-editorial-review",
      approved_revision: 1,
      approved_readable_text_sha256: grayLineSha,
      verified_on: "2026-10-21",
      review_due_on: "2026-11-20",
      source_opened_at: "2026-10-21T17:58:10Z",
      reviewed_at: "2026-10-21T17:59:10Z",
      review_token: "tok_grayline_e5530f35d8cf28936a19",
      review_token_consumed: true,
      review_token_consumed_at: "2026-10-21T17:59:10Z",
      canonical_product_id: "gray-line-large-airboat",
      atomic_constraint_type: "meeting_point",
      value: dep.structured_value,
      source_url: dep.source_url,
    },
  };

  const capability = inspectPortalApprovalCapability(approvedStore, nowUtcIso);
  assert.equal(capability.can_project_public_claims, true);
  assert.equal(capability.verified_fact_count, 1);

  const afterAnswer = evaluatePilotTransportationAnswer(approvedStore, { nowUtcIso });
  const consumerFiltered = filterDccAnswerForConsumer(afterAnswer, { nowUtcIso });
  assert.equal(consumerFiltered.outcome, "partially_supported");
  assert.equal(consumerFiltered.opening_claims.length, 1);
  assert.equal(consumerFiltered.opening_claims[0].fact_id, "4d242c7a31e7e6aea34b02c0");
  assert.equal(consumerFiltered.comparison_rows.length, 1);
  assert.equal(
    consumerFiltered.comparison_rows[0].pickup_scope,
    "400 Toulouse St. (Steamboat NATCHEZ dock); CBD/French Quarter hotels for groups of 10+ with 24h notice",
  );
  assert.ok(
    consumerFiltered.handoffs.some((h) => h.handoff_id === "handoff:direct:gray-line-large-airboat"),
    "Approved claim unlocks the direct operator handoff in the published answer",
  );
  const faqEntry = buildPilotQuestionFaqEntry(consumerFiltered);
  assert.ok(faqEntry, "Approved claim populates FAQPage JSON-LD acceptedAnswer");
  assert.match(faqEntry.acceptedAnswer.text, /400 Toulouse St\./);

  // 3. Demonstrate DCC Travel Reference / Juneau Port-Day Decision Engine approval flow:
  // Flagging citation jun-cbj-harbors as "stale" withdraws /juneau indexability and qualifies affected port-day options;
  // approving the refreshed citation restores public_indexable and fits_comfortably.
  const baseJuneau = getAllTravelReferenceNodes().find((n) => n.id === "juneau")!;
  const staleJuneau = structuredClone(baseJuneau);
  const dockCitation = staleJuneau.evidenceRegistry.find((c) => c.id === "jun-cbj-harbors")!;
  dockCitation.evidenceStatusOverride = "conflicted";

  const stalePub = evaluateTravelReferenceNodePublishability(staleJuneau);
  assert.equal(stalePub[0].route, "/juneau");
  assert.equal(stalePub[0].acceptanceState, "public_non_indexable");
  assert.deepEqual(stalePub[0].blockingReasonCodes, [
    "blocking_defect_unresolved",
    "unverified_evidence_snapshot",
  ]);

  const staleScenario = evaluateJuneauPortDayScenario(DEFAULT_JUNEAU_SCENARIO_INPUT, {
    node: staleJuneau,
  });
  assert.equal(staleScenario.evidenceHealth.hasWithdrawnOrConflictedClaims, true);
  const staleWhaleOption = staleScenario.options.find(
    (o) => o.optionId === "jun-opt-auke-bay-whale-direct",
  )!;
  assert.equal(staleWhaleOption.fitStatus, "withdrawn_or_qualified_evidence");

  // Administrator approves refreshed source citation with updated review/expiry window
  const approvedJuneau = structuredClone(staleJuneau);
  const approvedDockCitation = approvedJuneau.evidenceRegistry.find((c) => c.id === "jun-cbj-harbors")!;
  approvedDockCitation.evidenceStatusOverride = "current";
  approvedDockCitation.lastCheckedAt = "2026-11-02";
  approvedDockCitation.verifiedAt = "2026-11-02T15:00:00.000Z";

  const approvedPub = evaluateTravelReferenceNodePublishability(approvedJuneau);
  assert.equal(approvedPub[0].route, "/juneau");
  assert.equal(approvedPub[0].acceptanceState, "public_indexable");
  assert.deepEqual(approvedPub[0].blockingReasonCodes, []);

  const approvedScenario = evaluateJuneauPortDayScenario(DEFAULT_JUNEAU_SCENARIO_INPUT, {
    node: approvedJuneau,
  });
  assert.equal(approvedScenario.evidenceHealth.hasWithdrawnOrConflictedClaims, false);
  const restoredWhaleOption = approvedScenario.options.find(
    (o) => o.optionId === "jun-opt-auke-bay-whale-direct",
  )!;
  assert.equal(restoredWhaleOption.fitStatus, "fits_comfortably");
  assert.equal(restoredWhaleOption.evidenceQualificationNote, null);
});



