import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import {
  DCC_CAPABILITY_TRUTH_MATRIX,
  getTravelReferenceNodeById,
  listTravelReferenceNodes,
  resolveTravelReferenceForCoordinate,
} from "@/lib/dcc/travelReference";
import { DCC_PRODUCT_SCOPE } from "@/lib/dcc/productScope";
import { GET as getLocationApi } from "@/app/api/location/[lat]/[lng]/route";
import { GET as getAgentJson } from "@/app/agent.json/route";
import { GET as getLlmsTxt } from "@/app/llms.txt/route";
import { GET as getOpenApiJson } from "@/app/openapi.json/route";
import { INDEXABLE_SURFACE_PATHS } from "@/src/data/indexable-surface";
import { getDecisionEnginePageByPath } from "@/src/data/decision-engine-pages";

test("1. Five flagship destination reference nodes have complete evidence, 6-factor entry dependencies, and safety boundaries", () => {
  const nodes = listTravelReferenceNodes();
  assert.equal(nodes.length, 5);

  for (const id of ["juneau", "red-rocks", "denver-breckenridge", "new-orleans", "las-vegas"] as const) {
    const node = getTravelReferenceNodeById(id);
    assert.ok(node, `Expected reference node for ${id}`);
    assert.ok(node.overviewAndContext.geographyAndTopography.length >= 2);
    assert.ok(node.overviewAndContext.historyAndCulture.length >= 2);
    assert.ok(node.gettingThereAndAround.modes.length >= 3);
    assert.ok(node.beforeYouGo.safetyHealthAndEmergency.length >= 3);
    assert.ok(node.timingSeasonalityAndAccess.items.length >= 3);
    assert.ok(node.operationalBoundaries.whatRequiresOfficialExternalCheck.length >= 2);
    assert.ok(node.specialistHandoffs.options.length >= 1);
    assert.ok(node.relationships.length >= 4);
    assert.ok(node.evidenceRegistry.length >= 5);

    // Verify 6-factor entry dependency model
    assert.ok(node.beforeYouGo.entryScenarios.length >= 2);
    for (const scenario of node.beforeYouGo.entryScenarios) {
      assert.ok(scenario.dependencies.nationality);
      assert.ok(scenario.dependencies.passportAndDocuments);
      assert.ok(scenario.dependencies.residenceContext);
      assert.ok(scenario.dependencies.routingAndTransit);
      assert.ok(scenario.dependencies.tripPurpose);
      assert.ok(scenario.dependencies.dateAndValidityRule);
      assert.ok(scenario.officialLinks.length >= 1);
      assert.ok(scenario.citationIds.length >= 1);
    }

    // Verify every evidence record has mandatory provenance fields
    for (const ev of node.evidenceRegistry) {
      assert.ok(ev.sourceUrl.startsWith("https://"), `Expected https sourceUrl for ${ev.id}`);
      assert.ok(ev.issuingOrganization.length > 0);
      assert.ok(ev.geographicScope.length > 0);
      assert.ok(ev.applicableTravelerContext.length > 0);
      assert.ok(ev.lastCheckedAt.length > 0);
    }
  }
});

test("2. Coordinate-to-reference resolution connects flagship coordinates and returns null outside curated coverage", () => {
  const juneauMatch = resolveTravelReferenceForCoordinate(58.3019, -134.4197);
  assert.equal(juneauMatch?.primaryNode.id, "juneau");

  const juneauPortMatch = resolveTravelReferenceForCoordinate(58.2989, -134.4053);
  assert.equal(juneauPortMatch?.primaryNode.id, "juneau");

  const redRocksMatch = resolveTravelReferenceForCoordinate(39.6654, -105.2057);
  assert.equal(redRocksMatch?.primaryNode.id, "red-rocks");

  const breckMatch = resolveTravelReferenceForCoordinate(39.4817, -106.0384);
  assert.equal(breckMatch?.primaryNode.id, "denver-breckenridge");

  const tunnelMatch = resolveTravelReferenceForCoordinate(39.6779, -105.9056);
  assert.equal(tunnelMatch?.primaryNode.id, "denver-breckenridge");

  const nolaMatch = resolveTravelReferenceForCoordinate(29.9511, -90.0715);
  assert.equal(nolaMatch?.primaryNode.id, "new-orleans");

  const nolaPortMatch = resolveTravelReferenceForCoordinate(29.9395, -90.0617);
  assert.equal(nolaPortMatch?.primaryNode.id, "new-orleans");

  const vegasMatch = resolveTravelReferenceForCoordinate(36.1147, -115.1728);
  assert.equal(vegasMatch?.primaryNode.id, "las-vegas");

  const redRockCanyonMatch = resolveTravelReferenceForCoordinate(36.1358, -115.4275);
  assert.equal(redRockCanyonMatch?.primaryNode.id, "las-vegas");

  const oceanMatch = resolveTravelReferenceForCoordinate(0, 0);
  assert.equal(oceanMatch, null);
});

test("3. Capability truth matrix explicitly distinguishes live integrations, linked official resources, and pilot/onboarding items", () => {
  assert.ok(DCC_CAPABILITY_TRUTH_MATRIX.length >= 11);
  const lightning = DCC_CAPABILITY_TRUTH_MATRIX.find((c) => c.capability.includes("Venue Lightning Holds"));
  assert.equal(lightning?.status, "official_link_only");

  const traction = DCC_CAPABILITY_TRUTH_MATRIX.find((c) => c.capability.includes("Highway Traction Laws"));
  assert.equal(traction?.status, "official_link_only");

  const booking = DCC_CAPABILITY_TRUTH_MATRIX.find((c) => c.capability.includes("Downstream Specialist Handoffs"));
  assert.equal(booking?.status, "pilot_bounded_feed");
});

test("4. /api/location/[lat]/[lng] preserves dcc-location-v2 contract while exposing travelReference and safety non-conflation flags", async () => {
  const req = new NextRequest("https://www.destinationcommandcenter.com/api/location/39.66540/-105.20570?scope=core");
  const res = await getLocationApi(req, {
    params: Promise.resolve({ lat: "39.66540", lng: "-105.20570" }),
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.ok, true);
  assert.equal(data.schema, "dcc-location-v2");
  assert.equal(data.travelReference?.available, true);
  assert.equal(data.travelReference?.id, "red-rocks");
  assert.equal(data.canonical?.destinationReference, "https://www.destinationcommandcenter.com/red-rocks");
  assert.equal(data.policy?.weatherDoesNotEstablishVenueOrRoadStatus, true);
  assert.equal(data.policy?.missingDataNeverImpliesAllClear, true);
  assert.equal(data.policy?.entryRequirementsRequireTravelerContextNotCoordinates, true);
});

test("5. Machine contracts (/scope.json, /agent.json, /llms.txt, /openapi.json) and indexable surfaces align with v3 travel reference release", async () => {
  assert.equal(DCC_PRODUCT_SCOPE.schemaVersion, 3);
  assert.equal(DCC_PRODUCT_SCOPE.travelReferenceArchitecture.status, "first_class_travel_reference");

  const agentRes = await getAgentJson();
  const agentData = await agentRes.json();
  assert.equal(agentData.schema_version, "2026-10-23");
  assert.ok(agentData.travel_reference_architecture);
  assert.equal(agentData.octo_connectivity.status, "pilot_and_directory_onboarding_layer");

  const llmsRes = await getLlmsTxt();
  const llmsText = await llmsRes.text();
  assert.ok(llmsText.includes("Flagship Travel Reference Releases"));
  assert.ok(llmsText.includes("6-Factor Entry Dependency Rule"));
  assert.ok(llmsText.includes("Weather Does Not Establish Operating Status"));

  const openApiRes = await getOpenApiJson();
  const openApiData = await openApiRes.json();
  assert.ok(openApiData.components.schemas.DccLocationResponse.properties.travelReference);

  for (const path of [
    "/juneau",
    "/ports/juneau",
    "/red-rocks",
    "/venues/red-rocks-amphitheatre",
    "/routes/denver-breckenridge",
    "/transportation/colorado",
    "/regions/colorado",
    "/widget",
    "/pricing",
  ]) {
    assert.equal(INDEXABLE_SURFACE_PATHS.includes(path), true, `Expected ${path} in INDEXABLE_SURFACE_PATHS`);
  }

  assert.ok(getDecisionEnginePageByPath("/routes/denver-breckenridge"));
});

test("6. Aviation bounding-box fallback resolves PAJN/KBJC and out-of-coverage coordinates never imply all-clear", async () => {
  const { readExtendedCoordinateFeeds } = await import("@/lib/dcc/extendedCoordinateFeeds");
  const juneauExt = await readExtendedCoordinateFeeds({ lat: 58.3019, lng: -134.4197 });
  assert.ok(
    juneauExt.aviation.some((s: any) => s.airport?.icao === "PAJN" || s.metar?.icaoId === "PAJN"),
    "Expected PAJN aviation station for Juneau via bounding-box fallback",
  );

  const oceanReq = new NextRequest("https://www.destinationcommandcenter.com/api/location/0.00000/0.00000?scope=core");
  const oceanRes = await getLocationApi(oceanReq, {
    params: Promise.resolve({ lat: "0.00000", lng: "0.00000" }),
  });
  assert.equal(oceanRes.status, 200);
  const oceanData = await oceanRes.json();
  assert.equal(oceanData.travelReference?.available, false);
  const nwsSource = oceanData.sources.find((s: any) => s.provider === "nws");
  assert.equal(nwsSource?.available, false, "NWS outside US must report available: false, never an implicit all-clear");
});

