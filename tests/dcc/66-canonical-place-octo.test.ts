import test from "node:test";
import assert from "node:assert/strict";
import { DccCanonicalPlaceService } from "@/lib/dcc/canonicalPlaceService";
import { DccLocationProductService } from "@/lib/octo/locationProductService";
import { MockOctoSupplierEngine } from "@/lib/octo/mockServer";
import { GET as getLocationApi } from "@/app/api/location/[lat]/[lng]/route";
import { NextRequest } from "next/server";
import { OctoProduct } from "@/lib/octo/types";

test("1. Existing location and destination records still resolve canonically", async () => {
  // Test resolving via Backbone place ID
  const juneauById = DccCanonicalPlaceService.resolvePlaceById("dcc:place:us-ak-juneau-ak:0001");
  assert.ok(juneauById, "Juneau should resolve by Backbone ID");
  assert.equal(juneauById.name, "Juneau");
  assert.equal(juneauById.admin.regionCode, "AK");
  assert.equal(juneauById.admin.countryCode, "US");

  // Test resolving via Destination slug
  const denverByDest = DccCanonicalPlaceService.resolvePlaceByDestinationSlug("denver");
  assert.ok(denverByDest, "Denver should resolve by destination slug");
  assert.equal(denverByDest.name, "Denver");
  assert.equal(denverByDest.placeId, "dcc:place:us-co-denver-co:0001");

  // Test resolving venue by slug
  const redRocks = DccCanonicalPlaceService.resolvePlaceBySlug("red-rocks");
  assert.ok(redRocks, "Red Rocks should resolve by slug");
  assert.equal(redRocks.placeType, "venue");
  assert.equal(redRocks.hierarchy.parentPlaceId, "dcc:place:us-co-denver-co:0001");

  // Test resolving port by ID
  const stThomasPort = DccCanonicalPlaceService.resolvePlaceById("dcc:port:vi-st-thomas:0001");
  assert.ok(stThomasPort, "St. Thomas Port should resolve by ID");
  assert.equal(stThomasPort.placeType, "cruise_port");

  // Test resolving by coordinates
  const denverByCoords = DccCanonicalPlaceService.resolvePlaceByCoordinates(39.7392, -104.9903, 20);
  assert.ok(denverByCoords, "Denver should resolve by coordinate proximity");
  assert.equal(denverByCoords.placeId, "dcc:place:us-co-denver-co:0001");
});

test("2. Existing coordinate routes still work with unified geography", async () => {
  // Juneau coordinates: 58.30050, -134.42010
  const req = new NextRequest("https://www.destinationcommandcenter.com/api/location/58.30050/-134.42010?scope=core");
  const res = await getLocationApi(req, {
    params: Promise.resolve({ lat: "58.30050", lng: "-134.42010" }),
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.ok, true);
  assert.equal(data.schema, "dcc-location-v2");
  assert.equal(data.coordinate.lat, 58.3005);
  assert.equal(data.coordinate.lng, -134.4201);
  assert.ok(data.modules.identity);
  assert.ok(data.providerSlots.octo);
  assert.ok(data.providerSlots.octo.products.length > 0);
});

test("3. An OCTO product can attach to a DCC canonical place", async () => {
  const sampleProduct: OctoProduct = {
    id: "prod_custom_kayak",
    internalName: "Mendenhall Glacier Kayak Expedition",
    title: "Mendenhall Glacier Kayak Expedition",
    country: "US",
    defaultCurrency: "USD",
    capabilities: ["octo/core", "octo/pricing"],
    options: [],
  };

  // Attach to Juneau canonical place
  const attached = DccCanonicalPlaceService.attachProductToPlace(sampleProduct, "dcc:place:us-ak-juneau-ak:0001", {
    pickupPoints: [
      {
        id: "pt_mendenhall_visitor",
        name: "Mendenhall Glacier Visitor Center",
        type: "meeting",
        coordinates: { lat: 58.4172, lng: -134.5447 },
      },
    ],
    serviceArea: {
      primaryPlaceId: "dcc:place:us-ak-juneau-ak:0001",
      servedPlaceIds: [
        "dcc:place:us-ak-juneau-ak:0001",
        "dcc:place:us-ak-skagway-ak:0001",
      ],
      radiusKm: 100,
    },
    providerExternalIds: {
      fareharborShortname: "alaskakayak",
      fareharborItem: 9912,
      viatorProductCode: "JNU-KAYAK-01",
    },
  });

  assert.equal(attached.dccPlaceId, "dcc:place:us-ak-juneau-ak:0001");
  assert.equal(attached.destinationSlug, "juneau");
  assert.ok(attached.location?.includes("Juneau"));
  assert.ok(attached.placeCoordinates);
  assert.equal(attached.serviceArea?.primaryPlaceId, "dcc:place:us-ak-juneau-ak:0001");
  assert.ok(attached.serviceArea?.servedPlaceIds.includes("dcc:place:us-ak-skagway-ak:0001"));
  assert.equal(attached.pickupPoints?.length, 1);
  assert.equal(attached.providerExternalIds?.fareharborShortname, "alaskakayak");
});

test("4. Provider IDs remain unchanged and distinct from canonical place ID", async () => {
  const mockProducts = MockOctoSupplierEngine.getProducts();
  const juneauTour = mockProducts.find((p) => p.id === "prod_alaska_whale_glacier");
  const redRocksTour = mockProducts.find((p) => p.id === "prod_redrocks_sunset");
  const denverTour = mockProducts.find((p) => p.id === "prod_denver_craft_brew_culture");

  assert.ok(juneauTour);
  assert.ok(redRocksTour);
  assert.ok(denverTour);

  // Juneau product: Canonical Place vs Provider IDs
  assert.equal(juneauTour.dccPlaceId, "dcc:place:us-ak-juneau-ak:0001");
  assert.equal(juneauTour.providerExternalIds?.viatorDestinationId, 941);
  assert.equal(juneauTour.providerExternalIds?.viatorProductCode, "3858P1");
  assert.equal(juneauTour.providerExternalIds?.fareharborShortname, "alaskapremier");
  assert.equal(juneauTour.providerExternalIds?.rezdyLocation, "Juneau Harbor");

  // Red Rocks product: Canonical Place vs Provider IDs
  assert.equal(redRocksTour.dccPlaceId, "dcc:venue:us-co-morrison-red-rocks:0001");
  assert.equal(redRocksTour.providerExternalIds?.fareharborShortname, "redrocksadventures");
  assert.equal(redRocksTour.providerExternalIds?.viatorProductCode, "DEN-RR-02");

  // Denver product: Canonical Place vs Provider IDs
  assert.equal(denverTour.dccPlaceId, "dcc:place:us-co-denver-co:0001");
  assert.equal(denverTour.providerExternalIds?.bokunActivityId, "act_denver_brew_01");
  assert.equal(denverTour.providerExternalIds?.viatorProductCode, "DEN-BREW-01");
});

test("5. Geographic association strictly does not confer bookability", async () => {
  // Even if attached to a valid canonical place, an unauthorized supplier is never bookable
  const isBookable = DccCanonicalPlaceService.canBookProduct("prod_custom_kayak", {
    connectionStatus: "draft",
    onboardingStage: "technical_onboarding",
    healthStatus: "healthy",
  });

  assert.equal(isBookable, false, "Unauthorized product must be non-bookable despite valid place attachment");

  // Missing reseller agreement blocks booking
  const isBookableNoAgreement = DccCanonicalPlaceService.canBookProduct("prod_custom_kayak", {
    connectionStatus: "authorized",
    onboardingStage: "technical_onboarding", // Not live_authorized!
    healthStatus: "healthy",
  });

  assert.equal(isBookableNoAgreement, false, "Supplier without signed agreement must never be bookable");
});

test("6. Unauthorized and mock suppliers remain directory-only", async () => {
  // Check Vibe Around Town in USVI
  const result = await DccLocationProductService.findProductsForLocation({
    lat: 18.3419,
    lng: -64.9307,
    destinationSlug: "usvi",
  });

  const vibe = result.directoryOnlyOperators.find((op) => op.id === "part_vibe_around_town");
  assert.ok(vibe, "Vibe Around Town should be discovered for USVI");
  assert.equal(vibe.commercialStatus, "directory_only");

  const canBookVibe = await DccLocationProductService.canBookProduct("prod_vibe_island_tour");
  assert.equal(canBookVibe, false, "Vibe must never be bookable");

  // Production mode quarantine: mock suppliers cannot appear
  const originalEnv = process.env.NODE_ENV;
  try {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";

    const prodResult = await DccLocationProductService.findProductsForLocation({
      lat: 58.3005,
      lng: -134.4201,
    });

    const hasMock = prodResult.products.some(
      (p) => p.product.id === "prod_alaska_whale_glacier" || p.supplier.connectionId === "conn_mock_alaska"
    );
    assert.equal(hasMock, false, "Mock product cannot appear on location page in production");

    const canBookMockInProd = await DccLocationProductService.canBookProduct("prod_alaska_whale_glacier");
    assert.equal(canBookMockInProd, false, "Mock product cannot be booked in production");
  } finally {
    (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
  }
});

test("7. Location page combines public destination context with authorized OCTO products", async () => {
  const result = await DccLocationProductService.findProductsForLocation({
    lat: 58.3005,
    lng: -134.4201,
    destinationSlug: "juneau",
  });

  // Verify canonical place was resolved
  assert.ok(result.canonicalPlace);
  assert.ok(result.canonicalPlace.placeId.includes("juneau"));
  assert.equal(result.canonicalPlace.admin.countryCode, "US");

  // Verify meeting points in canonical place
  assert.ok(result.canonicalPlace.meetingPoints.length > 0);
  assert.ok(result.canonicalPlace.meetingPoints.some((m: any) => m.name.includes("Auke Bay")));

  // Verify attached products
  assert.ok(result.products.length > 0);
  const alaskaTour = result.products.find((p) => p.product.id === "prod_alaska_whale_glacier");
  assert.ok(alaskaTour);
  assert.equal(alaskaTour.product.dccPlaceId, "dcc:place:us-ak-juneau-ak:0001");
  assert.ok(alaskaTour.product.pickupPoints && alaskaTour.product.pickupPoints.length > 0);
});

test("8. Multiple products from different providers can be associated with one place", async () => {
  // Query Denver canonical place
  const denverPlace = DccCanonicalPlaceService.resolvePlaceById("dcc:place:us-co-denver-co:0001");
  assert.ok(denverPlace);

  // Find all products serving Denver
  const denverResults = await DccLocationProductService.findProductsForLocation({
    lat: 39.7392,
    lng: -104.9903,
    destinationSlug: "denver",
  });

  const productsInDenver = denverResults.products;
  assert.ok(productsInDenver.length >= 2, "Denver should have multiple products associated");

  // Check Provider 1: Red Rocks Shuttle & Adventure (FareHarbor)
  const redRocks = productsInDenver.find((p) => p.product.id === "prod_redrocks_sunset");
  assert.ok(redRocks, "Red Rocks product should serve Denver");
  assert.equal(redRocks.supplier.providerType, "fareharbor");
  assert.equal(redRocks.product.providerExternalIds?.fareharborShortname, "redrocksadventures");

  // Check Provider 2: RiNo Craft Beer & Street Art Walk (Bókun)
  const rinoBrew = productsInDenver.find((p) => p.product.id === "prod_denver_craft_brew_culture");
  assert.ok(rinoBrew, "RiNo Brewery tour should serve Denver");
  assert.equal(rinoBrew.supplier.providerType, "bokun");
  assert.equal(rinoBrew.product.providerExternalIds?.bokunActivityId, "act_denver_brew_01");
});

test("9. One product can serve multiple related places via provider service area", async () => {
  const mockProducts = MockOctoSupplierEngine.getProducts();
  const alaskaTour = mockProducts.find((p) => p.id === "prod_alaska_whale_glacier")!;
  assert.ok(alaskaTour);
  assert.ok(alaskaTour.serviceArea);

  // Primary place: Juneau
  const servesJuneau = DccCanonicalPlaceService.isProductServingPlace(alaskaTour, "dcc:place:us-ak-juneau-ak:0001");
  assert.equal(servesJuneau.serves, true, "Alaska tour must serve Juneau");

  // Related place 1: Skagway (in servedPlaceIds and Inside Passage corridor)
  const servesSkagway = DccCanonicalPlaceService.isProductServingPlace(alaskaTour, "dcc:place:us-ak-skagway-ak:0001");
  assert.equal(servesSkagway.serves, true, "Alaska tour must serve Skagway via provider service area");

  // Related place 2: Sitka (in servedPlaceIds)
  const servesSitka = DccCanonicalPlaceService.isProductServingPlace(alaskaTour, "dcc:place:us-ak-sitka-ak:0001");
  assert.equal(servesSitka.serves, true, "Alaska tour must serve Sitka via provider service area");

  // Unrelated place: Denver (not served)
  const servesDenver = DccCanonicalPlaceService.isProductServingPlace(alaskaTour, "dcc:place:us-co-denver-co:0001");
  assert.equal(servesDenver.serves, false, "Alaska tour must not serve Denver");
});
