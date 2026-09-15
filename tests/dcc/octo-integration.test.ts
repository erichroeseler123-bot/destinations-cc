import test from "node:test";
import assert from "node:assert/strict";
import { MockOctoSupplierEngine } from "@/lib/octo/mockServer";
import { OctoAdapter, OctoApiError } from "@/lib/octo/adapter";
import { OctoSettlementEngine } from "@/lib/octo/settlement";
import { OctoBookingService } from "@/lib/octo/bookingService";
import { OctoRegistryService } from "@/lib/octo/registry";
import {
  encryptCredential,
  decryptCredential,
  maskCredential,
  verifyOctoWebhookSignature,
} from "@/lib/octo/security";

test("OCTO Security: AES-256-GCM encryption and credential masking", () => {
  const plainSecret = "sk_live_ventrata_enterprise_secure_token_99812";
  const encrypted = encryptCredential(plainSecret);

  assert.notEqual(encrypted, plainSecret);
  assert.ok(encrypted.includes(":"), "Encrypted string must contain iv:tag:ciphertext separators");

  const decrypted = decryptCredential(encrypted);
  assert.equal(decrypted, plainSecret, "Decrypted text must match original secret");

  const masked = maskCredential(plainSecret);
  assert.equal(masked, "sk_l...9812", "Credential masking must protect raw secret");
  assert.equal(maskCredential(""), "none");
});

test("OCTO Webhooks: HMAC-SHA256 signature verification and tamper detection", () => {
  const secret = "octo_webhook_shared_signing_secret_xyz";
  const payload = JSON.stringify({
    event: "booking.status_changed",
    bookingUuid: "b103e670-8b1e-4cb8-b21a-28a6f3b0e111",
    status: "CONFIRMED",
  });

  const crypto = require("crypto");
  const validSignature = crypto.createHmac("sha256", secret).update(payload).digest("hex");

  assert.ok(
    verifyOctoWebhookSignature(payload, validSignature, secret),
    "Valid HMAC signature must verify successfully"
  );
  assert.equal(
    verifyOctoWebhookSignature(payload, "invalid_tampered_signature", secret),
    false,
    "Tampered signature must be rejected"
  );
});

test("OCTO Mock Engine: Catalog and product options conform to OCTO Core", () => {
  MockOctoSupplierEngine.reset();
  const supplier = MockOctoSupplierEngine.getSupplier();
  assert.equal(supplier.id, "mock-octo-alaska-expeditions");

  const products = MockOctoSupplierEngine.getProducts();
  assert.ok(products.length >= 2);

  const alaskaTour = MockOctoSupplierEngine.getProduct("prod_alaska_whale_glacier");
  assert.ok(alaskaTour);
  assert.equal(alaskaTour.destinationSlug, "juneau");
  assert.equal(alaskaTour.defaultCurrency, "USD");
  assert.ok(alaskaTour.options.length >= 1);

  const defaultOption = alaskaTour.options[0];
  assert.equal(defaultOption.id, "opt_morning_cruise");
  assert.ok(defaultOption.units.some((u) => u.type === "ADULT"));
  assert.ok(defaultOption.units.some((u) => u.type === "CHILD"));
});

test("OCTO Settlement Engine: Configurable take-rate calculation and undecided status", () => {
  const gross = 358.0; // Two adults @ $179.00
  // Test with agreed 5.0% rate
  const agreedShares = OctoSettlementEngine.calculateShares(gross, 5.0);
  assert.equal(agreedShares.dccSharePercent, 5.0);
  assert.equal(agreedShares.dccShareAmount, 17.9); // 5% of 358.00
  assert.equal(agreedShares.operatorShareAmount, 340.1); // 95% of 358.00
  assert.equal(agreedShares.isUndecided, false);
  assert.equal(
    Math.round((agreedShares.dccShareAmount + agreedShares.operatorShareAmount) * 100) / 100,
    gross,
    "Sum of shares must equal gross booking amount exactly"
  );

  // Test with undecided / pending commercial agreement (null)
  const undecidedShares = OctoSettlementEngine.calculateShares(gross, null);
  assert.equal(undecidedShares.dccSharePercent, 0);
  assert.equal(undecidedShares.dccShareAmount, 0);
  assert.equal(undecidedShares.operatorShareAmount, gross);
  assert.equal(undecidedShares.isUndecided, true);
});

test("OCTO Full Booking Lifecycle: Availability -> Hold (15 min) -> Confirm -> Voucher -> Cancel", async () => {
  MockOctoSupplierEngine.reset();

  // 1. Live Availability Check
  const slots = MockOctoSupplierEngine.checkAvailability(
    "prod_alaska_whale_glacier",
    "opt_morning_cruise",
    "2026-09-20"
  );
  assert.ok(slots.length > 0);
  const slot = slots[0];
  assert.equal(slot.status, "AVAILABLE");
  assert.ok(slot.vacancies && slot.vacancies >= 2);

  // 2. Create Booking Hold enforcing expirationMinutes: 15
  const hold = await OctoBookingService.createHold({
    supplierConnectionId: "conn_mock_alaska",
    productId: "prod_alaska_whale_glacier",
    optionId: "opt_morning_cruise",
    availabilityId: slot.id,
    expirationMinutes: 15,
    unitItems: [{ unitId: "unit_adult", quantity: 2 }],
  });

  assert.equal(hold.status, "ON_HOLD");
  assert.equal(hold.totalPrice, 358.0);
  assert.ok(hold.utcHoldExpires);

  const expiresDiff = new Date(hold.utcHoldExpires).getTime() - Date.now();
  assert.ok(
    expiresDiff > 14 * 60 * 1000 && expiresDiff <= 15 * 60 * 1000,
    "utcHoldExpires must be ~15 minutes into the future"
  );

  // 3. Confirm Reservation & Trigger 5% DCC Settlement
  const confirmed = await OctoBookingService.confirmReservation({
    bookingId: hold.dccBookingId,
    contact: {
      fullName: "Alexander Sterling",
      emailAddress: "alex.sterling@example.com",
      phoneNumber: "+1-907-555-0182",
    },
    payment: {
      provider: "supplier_hosted",
      status: "AUTHORIZED",
      amount: 358.0,
      currency: "USD",
    },
  });

  assert.equal(confirmed.status, "CONFIRMED");
  assert.ok(confirmed.voucher?.code.startsWith("VOUCHER-"));
  assert.equal(confirmed.utcHoldExpires, null);

  // 4. Retrieve Current Booking
  const fetched = await OctoBookingService.getBooking(hold.dccBookingId);
  assert.ok(fetched);
  assert.equal(fetched.status, "CONFIRMED");

  // 5. Cancellation
  const cancelled = await OctoBookingService.cancelReservation(
    hold.dccBookingId,
    "Traveler requested reschedule via DCC"
  );
  assert.equal(cancelled.status, "CANCELLED");
  assert.equal(cancelled.cancellationReason, "Traveler requested reschedule via DCC");
});

test("OCTO Failure Modes: Expired hold rejection and error handling", () => {
  MockOctoSupplierEngine.reset();

  const hold = MockOctoSupplierEngine.createHold({
    productId: "prod_alaska_whale_glacier",
    optionId: "opt_morning_cruise",
    availabilityId: "avail_slot_1",
    expirationMinutes: 15,
    unitItems: [{ unitId: "unit_adult", quantity: 1 }],
  });

  // Artificially expire the hold
  hold.status = "EXPIRED";

  assert.throws(
    () => {
      MockOctoSupplierEngine.confirmBooking(hold.uuid, {
        contact: { fullName: "Test User", emailAddress: "test@example.com" },
      });
    },
    /EXPIRED_HOLD/,
    "Confirming an expired hold must throw EXPIRED_HOLD"
  );
});

test("OCTO Participant Registry: Standard ecosystem directory and roles", async () => {
  const participants = await OctoRegistryService.getParticipants();
  assert.ok(participants.length >= 6);

  const ventrata = participants.find((p) => p.name === "Ventrata");
  assert.ok(ventrata);
  assert.equal(ventrata.role, "booking_system");
  assert.equal(ventrata.outreachStatus, "technical_onboarding");

  const bokun = participants.find((p) => p.name === "Bókun");
  assert.ok(bokun);
  assert.equal(bokun.role, "booking_system");

  const suppliers = participants.filter((p) => p.role === "supplier");
  assert.ok(suppliers.length >= 1);
});

test("OCTO Machine Manifests: /scope.json and /openapi.json reflect authorized OCTO layer", async () => {
  const { GET: getScope } = await import("@/app/scope.json/route");
  const scopeRes = await getScope();
  assert.equal(scopeRes.status, 200);
  const scopeData = await scopeRes.json();
  const secondaryIds = scopeData.scope.secondaryProducts.map((p: any) => p.id);
  assert.ok(
    secondaryIds.includes("octo-tourism-directory-and-booking-layer"),
    "/scope.json must include octo-tourism-directory-and-booking-layer"
  );
  assert.ok(
    !scopeData.scope.outOfScopeAsPrimaryIdentity.includes("booking marketplace"),
    "Old contradictory outOfScopeAsPrimaryIdentity must not remain"
  );

  const { GET: getOpenApi } = await import("@/app/openapi.json/route");
  const openApiRes = await getOpenApi();
  assert.equal(openApiRes.status, 200);
  const openApiData = await openApiRes.json();
  assert.ok(openApiData.paths["/api/octo/participants"]);
  assert.ok(openApiData.paths["/api/octo/availability"]);
  assert.ok(openApiData.paths["/api/octo/hold"]);
  assert.ok(openApiData.paths["/api/octo/confirm"]);
});

test("OCTO API Endpoints: Route handlers return expected status and schema", async () => {
  const { GET: getParticipants } = await import("@/app/api/octo/participants/route");
  const req = new Request("https://www.destinationcommandcenter.com/api/octo/participants");
  const res = await getParticipants(req as any);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.spec, "octo-participant-registry");
  assert.equal(data.agreedPlatformShare, "5.0%");
  assert.ok(data.participants.length >= 6);

  const { POST: postAvailability } = await import("@/app/api/octo/availability/route");
  const availReq = new Request("https://www.destinationcommandcenter.com/api/octo/availability", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: "prod_alaska_whale_glacier",
      optionId: "opt_morning_cruise",
      localDate: "2026-09-25",
    }),
  });
  const availRes = await postAvailability(availReq as any);
  assert.equal(availRes.status, 200);
  const availData = await availRes.json();
  assert.ok(availData.slots.length > 0);
  assert.equal(availData.slots[0].status, "AVAILABLE");

  const { POST: postHold } = await import("@/app/api/octo/hold/route");
  const holdReq = new Request("https://www.destinationcommandcenter.com/api/octo/hold", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: "prod_alaska_whale_glacier",
      optionId: "opt_morning_cruise",
      availabilityId: availData.slots[0].id,
      expirationMinutes: 15,
      unitItems: [{ unitId: "unit_adult", quantity: 2 }],
    }),
  });
  const holdRes = await postHold(holdReq as any);
  assert.equal(holdRes.status, 201);
  const holdData = await holdRes.json();
  assert.equal(holdData.status, "ON_HOLD");
  assert.equal(holdData.totalPrice, 358.0);
  assert.ok(holdData.dccBookingId);
});

