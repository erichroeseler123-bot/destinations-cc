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

  // Verify Publication Manifest & Indexable Surface governance for regional hubs
  for (const path of [
    "/destinations",
    "/destinations/colorado",
    "/destinations/alaska",
    "/destinations/louisiana",
    "/destinations/nevada",
    "/regions/colorado",
    "/regions/alaska",
    "/regions/louisiana",
    "/regions/nevada",
  ]) {
    const entry = getPublicationManifestEntry(path);
    assert.ok(entry, `Expected ${path} in PUBLICATION_MANIFEST`);
    assert.equal(entry.acceptanceState, "public_indexable");
    assert.equal(INDEXABLE_SURFACE_PATHS.includes(path), true);
    assert.equal(getGovernedRobotsTag(path), "index, follow");
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
  assert.match(juneauText, /60–90 minute/);
  assert.match(juneauText, /90–120 minute/);
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

