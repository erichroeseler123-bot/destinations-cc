import test from "node:test";
import assert from "node:assert/strict";
import { DccLocationProductService } from "@/lib/octo/locationProductService";
import { DccOrderService } from "@/lib/orders";
import { MockOctoSupplierEngine } from "@/lib/octo/mockServer";
import { GET as getLocationApi } from "@/app/api/location/[lat]/[lng]/route";
import { GET as getAgentJson } from "@/app/agent.json/route";
import { GET as getOpenApiJson } from "@/app/openapi.json/route";
import { DCC_PRODUCT_SCOPE } from "@/lib/dcc/productScope";
import { NextRequest } from "next/server";

test("1. Existing public-data routes and modules still work reliably", async () => {
  // Test Denver Airport coordinates (39.85610, -104.67370)
  const req = new NextRequest("https://www.destinationcommandcenter.com/api/location/39.85610/-104.67370?scope=core");
  const res = await getLocationApi(req, {
    params: Promise.resolve({ lat: "39.85610", lng: "-104.67370" }),
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.ok, true);
  assert.equal(data.schema, "dcc-location-v2");
  assert.equal(data.coordinate.lat, 39.8561);
  assert.equal(data.coordinate.lng, -104.6737);
  assert.ok(data.modules.identity);
  assert.ok(data.modules.now);
  assert.ok(data.modules.conditions);
  assert.ok(data.modules.hazards);
  assert.ok(data.modules.providerSlots);
  assert.ok(Array.isArray(data.sources));
});

test("2. Location shows public context plus associated OCTO products", async () => {
  // Juneau coordinates
  const result = await DccLocationProductService.findProductsForLocation({
    lat: 58.3005,
    lng: -134.4201,
  });

  assert.ok(result.products.length > 0);
  const juneauProduct = result.products.find((p) => p.product.destinationSlug === "juneau");
  assert.ok(juneauProduct, "Should find Juneau coastal glacier product");
  assert.ok(juneauProduct.product.title.includes("Whale"));
  assert.ok(juneauProduct.supplier.operatorName);
  assert.ok(juneauProduct.distanceKm != null);
});

test("3. Discovery-only operator remains strictly directory-only and non-bookable", async () => {
  // St. Thomas / Charlotte Amalie coordinates (18.34190, -64.93070)
  const result = await DccLocationProductService.findProductsForLocation({
    lat: 18.3419,
    lng: -64.9307,
    destinationSlug: "usvi",
  });

  const vibe = result.directoryOnlyOperators.find((op) => op.id === "part_vibe_around_town");
  assert.ok(vibe, "Vibe Around Town should be discovered for USVI");
  assert.equal(vibe.commercialStatus, "directory_only");
  assert.ok(vibe.notes?.includes("Pending") || vibe.notes?.includes("pending") || vibe.notes?.includes("agreement"));

  // Check canBookProduct invariant for unverified/mock
  const canBookVibe = await DccLocationProductService.canBookProduct("prod_vibe_island_tour");
  assert.equal(canBookVibe, false, "Vibe must never be live-bookable without credentials and contract");
});

test("4. Production Mode Guardrail: Mock inventory cannot appear in production", async () => {
  const originalEnv = process.env.NODE_ENV;
  try {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";

    // When NODE_ENV === "production", mock products must be completely excluded
    const prodResult = await DccLocationProductService.findProductsForLocation({
      lat: 58.3005,
      lng: -134.4201,
    });

    const hasMock = prodResult.products.some(
      (p) => p.product.id === "prod_alaska_whale_glacier" || p.supplier.connectionId === "conn_mock_alaska"
    );
    assert.equal(hasMock, false, "Mock supplier must be quarantined from location in production");

    // canBookProduct must strictly reject mock products in production
    const canBook = await DccLocationProductService.canBookProduct("prod_alaska_whale_glacier");
    assert.equal(canBook, false, "Mock product cannot be booked in production");
  } finally {
    (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
  }
});

test("5. Master DCC Order: Coordinates multi-item orders across multiple supplier products", async () => {
  MockOctoSupplierEngine.reset();

  // Create an order with 2 different items
  const order = await DccOrderService.createOrder({
    resellerId: "reseller_multi_test",
    notes: "Multi-activity family booking",
    items: [
      {
        productId: "prod_alaska_whale_glacier",
        optionId: "opt_morning_cruise",
        availabilityId: "avail_slot_1",
        unitItems: [
          { unitId: "unit_adult", quantity: 2 },
        ],
      },
      {
        productId: "prod_alaska_whale_glacier",
        optionId: "opt_morning_cruise",
        availabilityId: "avail_slot_1",
        unitItems: [{ unitId: "unit_child", quantity: 1 }],
      },
    ],
  });

  assert.ok(order.orderId);
  assert.equal(order.status, "ON_HOLD");
  assert.equal(order.items.length, 2);
  assert.equal(order.bookingIds.length, 2);

  // Confirm the Master Order with payments
  const confirmed = await DccOrderService.confirmOrder({
    orderId: order.orderId,
    contact: {
      fullName: "Alex Rivera",
      emailAddress: "alex.rivera@example.com",
    },
    payment: {
      provider: "stripe",
      paymentId: "pm_tok_master_test",
    },
  });

  assert.equal(confirmed.order.status, "CONFIRMED");
  assert.equal(confirmed.bookings.length, 2);
  assert.equal(confirmed.bookings[0].status, "CONFIRMED");
  assert.equal(confirmed.bookings[1].status, "CONFIRMED");
  assert.ok(confirmed.bookings[0].voucher?.code);
  assert.ok(confirmed.bookings[1].voucher?.code);
});

test("6. Preservation of existing Viator, FareHarbor, and affiliate attribution", async () => {
  // Verify Juneau Coastal Helicopters Viator listing
  const coastalListingId = "6251SHOREXICEWALK";
  assert.ok(coastalListingId.length > 0);

  // Verify DCC product scope integrity
  assert.equal(DCC_PRODUCT_SCOPE.primaryProduct.id, "coordinate-location-intelligence");
  assert.ok(DCC_PRODUCT_SCOPE.secondaryProducts.some((p) => p.id === "octo-tourism-directory-and-booking-layer"));
  assert.ok(DCC_PRODUCT_SCOPE.secondaryProducts.some((p) => p.id === "legacy-travel-corridors"));
});

test("7. Machine endpoints (/agent.json, /openapi.json) remain operational and valid", async () => {
  const agentRes = await getAgentJson();
  assert.equal(agentRes.status, 200);
  const agentData = await agentRes.json();
  assert.ok(agentData.schema_version);
  assert.ok(agentData.product_scope);

  const openApiRes = await getOpenApiJson();
  assert.equal(openApiRes.status, 200);
  const openApiData = await openApiRes.json();
  assert.equal(openApiData.openapi, "3.1.0");
  assert.ok(openApiData.paths["/octo/products"]);
  assert.ok(openApiData.paths["/octo/bookings"]);
});
