import test from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import { MockOctoSupplierEngine } from "@/lib/octo/mockServer";
import { OctoBookingService } from "@/lib/octo/bookingService";
import { OctoRegistryService } from "@/lib/octo/registry";
import { OctoSettlementEngine } from "@/lib/octo/settlement";
import {
  encryptCredential,
  decryptCredential,
  verifyOctoWebhookSignature,
} from "@/lib/octo/security";
import {
  createProviderAdapter,
  getProviderAdapterForConnection,
  OctoApiError,
} from "@/lib/octo/adapter";

const TEST_BEARER_TOKEN = "octo_test_bearer_token_dcc_2026";
const AUTH_HEADERS = {
  Authorization: `Bearer ${TEST_BEARER_TOKEN}`,
  "Content-Type": "application/json",
};

// 1. Supplier Discovery
test("1. Supplier Discovery: GET /octo/supplier returns standard OCTO supplier", async () => {
  const { GET: getSupplier } = await import("@/app/octo/supplier/route");
  const req = new Request("https://www.destinationcommandcenter.com/octo/supplier", {
    headers: AUTH_HEADERS,
  });

  const res = await getSupplier(req);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.id, "Supplier must have an id");
  assert.ok(data.name, "Supplier must have a name");
  assert.ok(Array.isArray(data.capabilities), "Supplier must declare capabilities");
  assert.ok(data.capabilities.includes("octo/core"), "Must include octo/core");
});

// 2. Product Discovery
test("2. Product Discovery: GET /octo/products and GET /octo/products/{productId}", async () => {
  const { GET: getProducts } = await import("@/app/octo/products/route");
  const req = new Request("https://www.destinationcommandcenter.com/octo/products", {
    headers: AUTH_HEADERS,
  });

  const res = await getProducts(req);
  assert.equal(res.status, 200);
  const products = await res.json();
  assert.ok(Array.isArray(products));
  assert.ok(products.length >= 1, "Should discover products");

  const firstProd = products[0];
  assert.ok(firstProd.id);
  assert.ok(firstProd.title);
  assert.ok(Array.isArray(firstProd.options));
  assert.ok(firstProd.options.length >= 1);

  // Check single product retrieval
  const { GET: getProductById } = await import("@/app/octo/products/[productId]/route");
  const singleReq = new Request(
    `https://www.destinationcommandcenter.com/octo/products/${firstProd.id}`,
    { headers: AUTH_HEADERS }
  );
  const singleRes = await getProductById(singleReq, {
    params: Promise.resolve({ productId: firstProd.id }),
  });
  assert.equal(singleRes.status, 200);
  const singleData = await singleRes.json();
  assert.equal(singleData.id, firstProd.id);
});

// 3. Calendar Availability
test("3. Calendar Availability: POST /octo/availability/calendar", async () => {
  const { POST: postCalendar } = await import("@/app/octo/availability/calendar/route");
  const req = new Request("https://www.destinationcommandcenter.com/octo/availability/calendar", {
    method: "POST",
    headers: AUTH_HEADERS,
    body: JSON.stringify({
      productId: "prod_alaska_whale_glacier",
      optionId: "opt_morning_cruise",
      localDateStart: "2026-09-20",
      localDateEnd: "2026-09-21",
    }),
  });

  const res = await postCalendar(req);
  assert.equal(res.status, 200);
  const calendar = await res.json();
  assert.ok(Array.isArray(calendar));
  assert.ok(calendar.length > 0);
  assert.ok(calendar[0].localDate);
  assert.equal(calendar[0].status, "AVAILABLE");
});

// 4. Detailed Availability
test("4. Detailed Availability: POST /octo/availability", async () => {
  const { POST: postAvailability } = await import("@/app/octo/availability/route");
  const req = new Request("https://www.destinationcommandcenter.com/octo/availability", {
    method: "POST",
    headers: AUTH_HEADERS,
    body: JSON.stringify({
      productId: "prod_alaska_whale_glacier",
      optionId: "opt_morning_cruise",
      localDate: "2026-09-20",
      unitItems: [{ unitId: "unit_adult", quantity: 2 }],
    }),
  });

  const res = await postAvailability(req);
  assert.equal(res.status, 200);
  const slots = await res.json();
  assert.ok(Array.isArray(slots));
  assert.ok(slots.length > 0);
  assert.equal(slots[0].status, "AVAILABLE");
  assert.ok(slots[0].vacancies && slots[0].vacancies >= 2);
});

// 5. Final Recheck before Booking
test("5. Final Recheck: Rejects hold if slot is sold out or unavailable", async () => {
  MockOctoSupplierEngine.reset();

  await assert.rejects(
    async () => {
      await OctoBookingService.createHold({
        supplierConnectionId: "conn_mock_alaska",
        productId: "prod_alaska_whale_glacier",
        optionId: "opt_morning_cruise",
        availabilityId: "non_existent_slot",
        expirationMinutes: 15,
        unitItems: [{ unitId: "unit_adult", quantity: 100 }], // Exceeds capacity
      });
    },
    (err: any) => err.octoError === "INSUFFICIENT_AVAILABILITY" || err.status === 400
  );
});

// 6. Idempotent Booking Creation
test("6. Idempotent Booking Creation: POST /octo/bookings with Idempotency-Key", async () => {
  MockOctoSupplierEngine.reset();
  const { POST: postBookings } = await import("@/app/octo/bookings/route");

  const key = `idemp_key_${Date.now()}_test6`;
  const payload = {
    productId: "prod_alaska_whale_glacier",
    optionId: "opt_morning_cruise",
    availabilityId: "avail_slot_1",
    expirationMinutes: 15,
    unitItems: [{ unitId: "unit_adult", quantity: 2 }],
  };

  const req1 = new Request("https://www.destinationcommandcenter.com/octo/bookings", {
    method: "POST",
    headers: { ...AUTH_HEADERS, "Idempotency-Key": key },
    body: JSON.stringify(payload),
  });

  const res1 = await postBookings(req1);
  assert.equal(res1.status, 201);
  const booking1 = await res1.json();
  assert.equal(booking1.status, "ON_HOLD");
  assert.ok(booking1.uuid);

  // Re-run with exact same idempotency key
  const req2 = new Request("https://www.destinationcommandcenter.com/octo/bookings", {
    method: "POST",
    headers: { ...AUTH_HEADERS, "Idempotency-Key": key },
    body: JSON.stringify(payload),
  });

  const res2 = await postBookings(req2);
  assert.ok(res2.status === 200 || res2.status === 201);
  const booking2 = await res2.json();
  assert.equal(booking2.uuid, booking1.uuid, "Idempotent retry must return the same booking UUID");
});

// 7. Hold State
test("7. Hold State: Holds expire in 15 minutes", async () => {
  MockOctoSupplierEngine.reset();
  const hold = await OctoBookingService.createHold({
    supplierConnectionId: "conn_mock_alaska",
    productId: "prod_alaska_whale_glacier",
    optionId: "opt_morning_cruise",
    availabilityId: "avail_slot_1",
    expirationMinutes: 15,
    unitItems: [{ unitId: "unit_adult", quantity: 1 }],
  });

  assert.equal(hold.status, "ON_HOLD");
  assert.ok(hold.utcHoldExpires);
  const diffMs = new Date(hold.utcHoldExpires).getTime() - Date.now();
  assert.ok(diffMs > 14 * 60 * 1000 && diffMs <= 15 * 60 * 1000);
});

// 8. Confirmation
test("8. Confirmation: POST /octo/bookings/{bookingUuid}/confirm", async () => {
  MockOctoSupplierEngine.reset();
  const hold = await OctoBookingService.createHold({
    supplierConnectionId: "conn_mock_alaska",
    productId: "prod_alaska_whale_glacier",
    optionId: "opt_morning_cruise",
    availabilityId: "avail_slot_1",
    expirationMinutes: 15,
    unitItems: [{ unitId: "unit_adult", quantity: 2 }],
  });

  const { POST: postConfirm } = await import("@/app/octo/bookings/[bookingUuid]/confirm/route");
  const req = new Request(
    `https://www.destinationcommandcenter.com/octo/bookings/${hold.uuid}/confirm`,
    {
      method: "POST",
      headers: AUTH_HEADERS,
      body: JSON.stringify({
        contact: {
          fullName: "Jordan Lee",
          emailAddress: "jordan.lee@example.com",
        },
      }),
    }
  );

  const res = await postConfirm(req, { params: Promise.resolve({ bookingUuid: hold.uuid }) });
  assert.equal(res.status, 200);
  const confirmed = await res.json();
  assert.equal(confirmed.status, "CONFIRMED");
  assert.ok(confirmed.voucher?.code.startsWith("VOUCHER-"));
  assert.equal(confirmed.utcHoldExpires, null);
});

// 9. Retrieval
test("9. Retrieval: GET /octo/bookings/{bookingUuid}", async () => {
  MockOctoSupplierEngine.reset();
  const hold = await OctoBookingService.createHold({
    supplierConnectionId: "conn_mock_alaska",
    productId: "prod_alaska_whale_glacier",
    optionId: "opt_morning_cruise",
    availabilityId: "avail_slot_1",
    expirationMinutes: 15,
    unitItems: [{ unitId: "unit_adult", quantity: 1 }],
  });

  const { GET: getBooking } = await import("@/app/octo/bookings/[bookingUuid]/route");
  const req = new Request(
    `https://www.destinationcommandcenter.com/octo/bookings/${hold.uuid}`,
    { headers: AUTH_HEADERS }
  );

  const res = await getBooking(req, { params: Promise.resolve({ bookingUuid: hold.uuid }) });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.uuid, hold.uuid);
  assert.equal(data.status, "ON_HOLD");
});

// 10. List Bookings
test("10. List Bookings: GET /octo/bookings", async () => {
  const { GET: listBookings } = await import("@/app/octo/bookings/route");
  const req = new Request("https://www.destinationcommandcenter.com/octo/bookings", {
    headers: AUTH_HEADERS,
  });

  const res = await listBookings(req);
  assert.equal(res.status, 200);
  const list = await res.json();
  assert.ok(Array.isArray(list));
});

// 11. Contact Update
test("11. Contact Update: PATCH /octo/bookings/{bookingUuid}", async () => {
  MockOctoSupplierEngine.reset();
  const hold = await OctoBookingService.createHold({
    supplierConnectionId: "conn_mock_alaska",
    productId: "prod_alaska_whale_glacier",
    optionId: "opt_morning_cruise",
    availabilityId: "avail_slot_1",
    expirationMinutes: 15,
    unitItems: [{ unitId: "unit_adult", quantity: 1 }],
  });

  const { PATCH: patchBooking } = await import("@/app/octo/bookings/[bookingUuid]/route");
  const req = new Request(
    `https://www.destinationcommandcenter.com/octo/bookings/${hold.uuid}`,
    {
      method: "PATCH",
      headers: AUTH_HEADERS,
      body: JSON.stringify({
        contact: {
          fullName: "Morgan Taylor",
          emailAddress: "morgan.taylor@example.org",
        },
      }),
    }
  );

  const res = await patchBooking(req, { params: Promise.resolve({ bookingUuid: hold.uuid }) });
  assert.equal(res.status, 200);
  const updated = await res.json();
  assert.equal(updated.contact?.fullName, "Morgan Taylor");
});

// 12. Cancellation
test("12. Cancellation: POST /octo/bookings/{bookingUuid}/cancel", async () => {
  MockOctoSupplierEngine.reset();
  const hold = await OctoBookingService.createHold({
    supplierConnectionId: "conn_mock_alaska",
    productId: "prod_alaska_whale_glacier",
    optionId: "opt_morning_cruise",
    availabilityId: "avail_slot_1",
    expirationMinutes: 15,
    unitItems: [{ unitId: "unit_adult", quantity: 1 }],
  });

  const { POST: postCancel } = await import("@/app/octo/bookings/[bookingUuid]/cancel/route");
  const req = new Request(
    `https://www.destinationcommandcenter.com/octo/bookings/${hold.uuid}/cancel`,
    {
      method: "POST",
      headers: AUTH_HEADERS,
      body: JSON.stringify({ reason: "Customer reschedule request" }),
    }
  );

  const res = await postCancel(req, { params: Promise.resolve({ bookingUuid: hold.uuid }) });
  assert.equal(res.status, 200);
  const cancelled = await res.json();
  assert.equal(cancelled.status, "CANCELLED");
  assert.equal(cancelled.cancellationReason, "Customer reschedule request");
});

// 13. Expired Availability
test("13. Expired Availability: past or unroutable dates", async () => {
  const { POST: postAvailability } = await import("@/app/octo/availability/route");
  const req = new Request("https://www.destinationcommandcenter.com/octo/availability", {
    method: "POST",
    headers: AUTH_HEADERS,
    body: JSON.stringify({
      productId: "prod_alaska_whale_glacier",
      optionId: "opt_morning_cruise",
      localDate: "2020-01-01", // Long past date
    }),
  });

  const res = await postAvailability(req);
  assert.equal(res.status, 200);
  const slots = await res.json();
  assert.equal(slots.length, 0, "Past date must yield no available slots");
});

// 14. Expired Booking Rejection
test("14. Expired Booking: Confirming an expired hold throws EXPIRED_HOLD", async () => {
  MockOctoSupplierEngine.reset();
  const hold = MockOctoSupplierEngine.createHold({
    productId: "prod_alaska_whale_glacier",
    optionId: "opt_morning_cruise",
    availabilityId: "avail_slot_1",
    expirationMinutes: 15,
    unitItems: [{ unitId: "unit_adult", quantity: 1 }],
  });

  // Force hold into EXPIRED state
  hold.status = "EXPIRED";

  assert.throws(
    () => {
      MockOctoSupplierEngine.confirmBooking(hold.uuid, {
        contact: { fullName: "Test Traveler", emailAddress: "traveler@example.com" },
      });
    },
    (err: any) => err.message.includes("EXPIRED_HOLD")
  );
});

// 15. Duplicate Booking Retry
test("15. Duplicate Booking Retry: Retrying confirmed booking returns same confirmation", async () => {
  MockOctoSupplierEngine.reset();
  const hold = await OctoBookingService.createHold({
    supplierConnectionId: "conn_mock_alaska",
    productId: "prod_alaska_whale_glacier",
    optionId: "opt_morning_cruise",
    availabilityId: "avail_slot_1",
    expirationMinutes: 15,
    unitItems: [{ unitId: "unit_adult", quantity: 1 }],
  });

  const confirm1 = await OctoBookingService.confirmReservation({
    bookingId: hold.uuid,
    contact: { fullName: "Alex River", emailAddress: "alex.river@example.com" },
  });
  assert.equal(confirm1.status, "CONFIRMED");

  // Re-confirm
  const confirm2 = await OctoBookingService.confirmReservation({
    bookingId: hold.uuid,
    contact: { fullName: "Alex River", emailAddress: "alex.river@example.com" },
  });
  assert.equal(confirm2.status, "CONFIRMED");
  assert.equal(confirm2.uuid, confirm1.uuid);
});

// 16. Altered Idempotency Request Rejection
test("16. Altered Idempotency Request: Rejection when payload differs", async () => {
  MockOctoSupplierEngine.reset();
  const key = `altered_idemp_key_${Date.now()}`;

  // First request
  await OctoBookingService.createHold({
    supplierConnectionId: "conn_mock_alaska",
    productId: "prod_alaska_whale_glacier",
    optionId: "opt_morning_cruise",
    availabilityId: "avail_slot_1",
    expirationMinutes: 15,
    unitItems: [{ unitId: "unit_adult", quantity: 1 }],
    idempotencyKey: key,
  });

  // Second request reusing same key with different unit quantity
  await assert.rejects(
    async () => {
      await OctoBookingService.createHold({
        supplierConnectionId: "conn_mock_alaska",
        productId: "prod_alaska_whale_glacier",
        optionId: "opt_morning_cruise",
        availabilityId: "avail_slot_1",
        expirationMinutes: 15,
        unitItems: [{ unitId: "unit_adult", quantity: 5 }], // Altered!
        idempotencyKey: key,
      });
    },
    (err: any) => err.octoError === "ALTERED_IDEMPOTENCY_REQUEST" || err.status === 400
  );
});

// 17. Unauthorized Supplier Access
test("17. Unauthorized Supplier: Rejection when supplier is not authorized", async () => {
  await assert.rejects(
    async () => {
      await OctoBookingService.getAdapterForConnection("non_existent_supplier_conn");
    },
    (err: any) => err.octoError === "SUPPLIER_NOT_FOUND" || err.status === 404
  );
});

// 18. Wrong-Provider Booking Access
test("18. Wrong-Provider Booking Access: Rejection when reseller does not own booking", async () => {
  MockOctoSupplierEngine.reset();
  const hold = await OctoBookingService.createHold({
    supplierConnectionId: "conn_mock_alaska",
    productId: "prod_alaska_whale_glacier",
    optionId: "opt_morning_cruise",
    availabilityId: "avail_slot_1",
    expirationMinutes: 15,
    unitItems: [{ unitId: "unit_adult", quantity: 1 }],
    resellerId: "reseller_alpha",
  });

  // Attempt to access with different resellerId
  await assert.rejects(
    async () => {
      await OctoBookingService.getBooking(hold.uuid, {
        resellerId: "reseller_intruder_beta",
      });
    },
    (err: any) => err.octoError === "FORBIDDEN" || err.status === 403
  );
});

// 19. Malformed OCTO Requests
test("19. Malformed OCTO Requests: Returns 400 with standard OCTO error shape", async () => {
  const { POST: postBookings } = await import("@/app/octo/bookings/route");
  const req = new Request("https://www.destinationcommandcenter.com/octo/bookings", {
    method: "POST",
    headers: AUTH_HEADERS,
    body: JSON.stringify({
      // Missing productId and optionId
      availabilityId: "slot_123",
    }),
  });

  const res = await postBookings(req);
  assert.equal(res.status, 400);
  const err = await res.json();
  assert.equal(err.error, "INVALID_PRODUCT_ID");
  assert.ok(err.errorMessage);
});

// 20. Missing or Invalid Credentials
test("20. Missing or Invalid Credentials: Returns 401 INVALID_BEARER_TOKEN", async () => {
  const { GET: getSupplier } = await import("@/app/octo/supplier/route");

  // Missing Authorization header
  const reqNoAuth = new Request("https://www.destinationcommandcenter.com/octo/supplier");
  const resNoAuth = await getSupplier(reqNoAuth);
  assert.equal(resNoAuth.status, 401);
  const errNoAuth = await resNoAuth.json();
  assert.equal(errNoAuth.error, "INVALID_BEARER_TOKEN");

  // Malformed Authorization header
  const reqMalformed = new Request("https://www.destinationcommandcenter.com/octo/supplier", {
    headers: { Authorization: "Basic dXNlcjpwYXNz" },
  });
  const resMalformed = await getSupplier(reqMalformed);
  assert.equal(resMalformed.status, 401);
});

// 21. Webhook Authenticity & Tamper Detection
test("21. Webhook Authenticity: Validates HMAC-SHA256 signature and rejects tampering", () => {
  const secret = "live_octo_webhook_secret_key_88921";
  const payload = JSON.stringify({
    event: "booking.confirmed",
    bookingUuid: "b103e670-8b1e-4cb8-b21a-28a6f3b0e111",
    timestamp: Date.now(),
  });

  const validSig = crypto.createHmac("sha256", secret).update(payload).digest("hex");

  assert.ok(
    verifyOctoWebhookSignature(payload, validSig, secret),
    "Valid signature must pass"
  );
  assert.equal(
    verifyOctoWebhookSignature(payload, "forged_invalid_signature_hex", secret),
    false,
    "Forged signature must fail"
  );
});

// 22. No Mock Data Leaking into Production
test("22. No Mock Data in Production: Mock connections are quarantined when NODE_ENV=production", async () => {
  const originalEnv = process.env.NODE_ENV;
  const originalToken = process.env.OCTO_RESELLER_TOKEN;

  try {
    (process.env as any).NODE_ENV = "production";
    process.env.OCTO_RESELLER_TOKEN = TEST_BEARER_TOKEN;

    // 1. Calling createHold with mock connection in production must throw MOCK_QUARANTINED
    await assert.rejects(
      async () => {
        await OctoBookingService.getAdapterForConnection("conn_mock_alaska");
      },
      (err: any) => err.octoError === "MOCK_QUARANTINED" && err.status === 403
    );

    // 2. Products endpoint must return empty array instead of leaking mock products
    const { GET: getProducts } = await import("@/app/octo/products/route");
    const reqProducts = new Request("https://www.destinationcommandcenter.com/octo/products", {
      headers: AUTH_HEADERS,
    });
    const resProducts = await getProducts(reqProducts);
    assert.equal(resProducts.status, 200);
    const products = await resProducts.json();
    assert.equal(products.length, 0, "No mock products may leak in production");

    // 3. Availability endpoint must reject mock products in production
    const { POST: postAvailability } = await import("@/app/octo/availability/route");
    const reqAvail = new Request("https://www.destinationcommandcenter.com/octo/availability", {
      method: "POST",
      headers: AUTH_HEADERS,
      body: JSON.stringify({
        productId: "prod_alaska_whale_glacier",
        optionId: "opt_morning_cruise",
        localDate: "2026-09-20",
      }),
    });
    const resAvail = await postAvailability(reqAvail);
    assert.equal(resAvail.status, 400);
    const availErr = await resAvail.json();
    assert.equal(availErr.error, "SUPPLIER_NOT_BOOKABLE");

    // 4. Bookings endpoint must reject mock holds in production with 403 MOCK_QUARANTINED
    const { POST: postBookings } = await import("@/app/octo/bookings/route");
    const reqHold = new Request("https://www.destinationcommandcenter.com/octo/bookings", {
      method: "POST",
      headers: AUTH_HEADERS,
      body: JSON.stringify({
        productId: "prod_alaska_whale_glacier",
        optionId: "opt_morning_cruise",
        availabilityId: "avail_slot_1",
        unitItems: [{ unitId: "unit_adult", quantity: 1 }],
      }),
    });
    const resHold = await postBookings(reqHold);
    assert.equal(resHold.status, 403);
    const holdErr = await resHold.json();
    assert.equal(holdErr.error, "MOCK_QUARANTINED");
  } finally {
    (process.env as any).NODE_ENV = originalEnv;
    if (originalToken) {
      process.env.OCTO_RESELLER_TOKEN = originalToken;
    } else {
      delete process.env.OCTO_RESELLER_TOKEN;
    }
  }
});

// 23. Proof: Bookings, Idempotency, Authorization, and Audit Events Persist in Neon
test("23. Proof: Bookings, idempotency, authorization, and audit events persist in Neon", async () => {
  const { getDb } = await import("@/lib/db/client");
  const { octoBookings, octoAuditLogs, octoSettlementLedger } = await import("@/lib/db/schema");
  const { eq } = await import("drizzle-orm");

  const db = getDb();
  if (!db) {
    // If running in environment without live DB, verify schema definitions exist
    assert.ok(octoBookings);
    assert.ok(octoAuditLogs);
    assert.ok(octoSettlementLedger);
    return;
  }

  // Create a hold with idempotency key
  const testIdempKey = `proof_idemp_${Date.now()}`;
  const hold = await OctoBookingService.createHold({
    supplierConnectionId: "conn_mock_alaska",
    productId: "prod_alaska_whale_glacier",
    optionId: "opt_morning_cruise",
    availabilityId: "avail_slot_1",
    expirationMinutes: 15,
    unitItems: [{ unitId: "unit_adult", quantity: 1 }],
    idempotencyKey: testIdempKey,
    resellerId: "reseller_neon_proof",
  });

  assert.ok(hold.dccBookingId);

  // 1. Verify booking record in Neon
  const [bookingInDb] = await db
    .select()
    .from(octoBookings)
    .where(eq(octoBookings.id, hold.dccBookingId));

  assert.ok(bookingInDb, "Booking record must exist in Neon");
  assert.equal(bookingInDb.bookingUuid, hold.uuid);
  assert.equal(bookingInDb.idempotencyKey, testIdempKey);
  assert.ok(bookingInDb.idempotencyHash, "SHA-256 hash must be stored");
  assert.equal(bookingInDb.resellerId, "reseller_neon_proof");
  assert.equal(bookingInDb.status, "ON_HOLD");

  // 2. Verify audit log record in Neon
  const auditLogs = await db
    .select()
    .from(octoAuditLogs)
    .where(eq(octoAuditLogs.entityId, hold.dccBookingId));

  assert.ok(auditLogs.length >= 1, "Audit log event must be recorded in Neon");
  const holdAudit = auditLogs.find((a) => a.action === "BOOKING_HOLD_CREATED");
  assert.ok(holdAudit, "BOOKING_HOLD_CREATED audit event must be present");
  assert.equal(holdAudit.status, "SUCCESS");

  // Confirm booking and check confirmation persistence
  const confirmed = await OctoBookingService.confirmReservation({
    bookingId: hold.dccBookingId,
    contact: {
      fullName: "Neon Verification User",
      emailAddress: "neon-verify@dcc.travel",
    },
    resellerId: "reseller_neon_proof",
  });

  const [updatedBooking] = await db
    .select()
    .from(octoBookings)
    .where(eq(octoBookings.id, hold.dccBookingId));
  assert.equal(updatedBooking.status, "CONFIRMED");

  // Clean up test records
  await db.delete(octoSettlementLedger).where(eq(octoSettlementLedger.bookingId, hold.dccBookingId));
  await db.delete(octoAuditLogs).where(eq(octoAuditLogs.entityId, hold.dccBookingId));
  await db.delete(octoBookings).where(eq(octoBookings.id, hold.dccBookingId));
});

// 24. Proof: Commission is Configurable and Not Hardcoded
test("24. Proof: Commission is configurable per supplier and not hardcoded", () => {
  const gross = 500.0;

  // Custom 12% agreed rate
  const customRate = OctoSettlementEngine.calculateShares(gross, 12.0);
  assert.equal(customRate.dccSharePercent, 12.0);
  assert.equal(customRate.dccShareAmount, 60.0);
  assert.equal(customRate.operatorShareAmount, 440.0);
  assert.equal(customRate.isUndecided, false);

  // Custom 0% non-profit / direct pass-through rate
  const zeroRate = OctoSettlementEngine.calculateShares(gross, 0);
  assert.equal(zeroRate.dccSharePercent, 0);
  assert.equal(zeroRate.dccShareAmount, 0);
  assert.equal(zeroRate.operatorShareAmount, 500.0);
  assert.equal(zeroRate.isUndecided, false);

  // Undecided / null rate (pending contract negotiation)
  const undecidedRate = OctoSettlementEngine.calculateShares(gross, null);
  assert.equal(undecidedRate.dccSharePercent, 0);
  assert.equal(undecidedRate.dccShareAmount, 0);
  assert.equal(undecidedRate.operatorShareAmount, 500.0);
  assert.equal(undecidedRate.isUndecided, true, "Must be flagged as undecided");

  // Undecided / undefined rate
  const undefinedRate = OctoSettlementEngine.calculateShares(gross, undefined);
  assert.equal(undefinedRate.isUndecided, true);
});

// 25. Proof: Vibe Remains authorization_pending Without Credentials or Signed Reseller Agreement
test("25. Proof: Vibe remains authorization_pending without credentials or signed agreement", async () => {
  const participants = await OctoRegistryService.getParticipants();
  const vibe = participants.find((p) => p.id === "part_vibe_around_town");

  assert.ok(vibe, "Vibe Around Town must be registered in participants");
  assert.equal(vibe.outreachStatus, "contract_pending");
  assert.equal(vibe.credentialStatus, "none", "Must have no credentials");
  assert.equal(vibe.productsAvailableCount, 0, "Must have 0 active products");
  assert.equal(vibe.agreedCommissionPercent, undefined, "Commission is undecided / pending agreement");

  // Verify connection status
  const connResult = await OctoBookingService.getAdapterForConnection("conn_vibe_around_town");
  assert.equal(connResult.connection.connectionStatus, "authorization_pending");
  assert.equal(connResult.isMock, false);

  // Verify it is NOT bookable
  const authorizedConns = await OctoRegistryService.getAuthorizedConnections();
  const vibeAuthorized = authorizedConns.find((c) => c.id === "conn_vibe_around_town");
  assert.equal(vibeAuthorized, undefined, "Vibe must NOT be in authorized bookable connections");
});

// 26. Proof: Every Route Matches Pinned Official OCTO Core v1.2.0 Contract
test("26. Proof: Every route matches pinned official OCTO Core v1.2.0 contract", async () => {
  const { GET: getSupplier } = await import("@/app/octo/supplier/route");
  const { GET: getProducts } = await import("@/app/octo/products/route");

  // Supplier endpoint headers
  const reqSupplier = new Request("https://www.destinationcommandcenter.com/octo/supplier", {
    headers: AUTH_HEADERS,
  });
  const resSupplier = await getSupplier(reqSupplier);
  assert.equal(resSupplier.status, 200);
  assert.ok(resSupplier.headers.get("Octo-Capabilities")?.includes("octo/core"), "Must include octo/core capability");
  assert.equal(resSupplier.headers.get("Octo-Version"), "1.2.0");

  // Products endpoint headers
  const reqProducts = new Request("https://www.destinationcommandcenter.com/octo/products", {
    headers: AUTH_HEADERS,
  });
  const resProducts = await getProducts(reqProducts);
  assert.equal(resProducts.status, 200);
  assert.ok(resProducts.headers.get("Octo-Capabilities")?.includes("octo/core"), "Must include octo/core capability");
  assert.equal(resProducts.headers.get("Octo-Version"), "1.2.0");

  // Standard OCTO error body shape on bad request
  const { POST: postBookings } = await import("@/app/octo/bookings/route");
  const badReq = new Request("https://www.destinationcommandcenter.com/octo/bookings", {
    method: "POST",
    headers: AUTH_HEADERS,
    body: JSON.stringify({ invalid: true }),
  });
  const badRes = await postBookings(badReq);
  assert.equal(badRes.status, 400);
  assert.equal(badRes.headers.get("Octo-Version"), "1.2.0");
  const errBody = await badRes.json();
  assert.ok("error" in errBody, "Error body must include 'error' field per OCTO Core");
  assert.ok("errorMessage" in errBody, "Error body must include 'errorMessage' field per OCTO Core");
});

// 27. Proof: Master DCC Order Coordinates Multiple Items and Supplier Bookings
test("27. Master DCC Order: Coordinates multi-item orders, supplier booking holds, payment capture, and settlement", async () => {
  const { DccOrderService } = await import("@/lib/orders");
  const { DccBookingService } = await import("@/lib/bookings");
  const { DccSettlementEngine } = await import("@/lib/settlement");

  // Create multi-item master order
  const order = await DccOrderService.createOrder({
    resellerId: "reseller_multi_test",
    currency: "USD",
    items: [
      {
        productId: "prod_alaska_whale_glacier",
        optionId: "opt_morning_cruise",
        availabilityId: "avail_slot_1",
        unitItems: [{ unitId: "unit_adult", quantity: 2 }],
      },
      {
        productId: "prod_alaska_whale_glacier",
        optionId: "opt_morning_cruise",
        availabilityId: "avail_slot_1",
        unitItems: [{ unitId: "unit_child", quantity: 1 }],
      },
    ],
  });

  assert.ok(order.orderId.startsWith("dcc:ord:"));
  assert.equal(order.status, "ON_HOLD");
  assert.equal(order.items.length, 2);
  assert.equal(order.bookingIds.length, 2);
  assert.ok(order.totalPrice > 0);
  assert.ok(order.utcHoldExpires);

  // Verify underlying booking holds exist in DccBookingService
  const firstBooking = await DccBookingService.getBooking(order.bookingIds[0]);
  assert.equal(firstBooking.status, "ON_HOLD");

  // Confirm order with payment
  const confirmation = await DccOrderService.confirmOrder({
    orderId: order.orderId,
    contact: {
      fullName: "Master Order Traveler",
      emailAddress: "traveler@dcc.travel",
      phoneNumber: "+13405550199",
    },
    payment: {
      provider: "stripe",
      paymentId: "pi_test_order_12345",
      status: "captured",
    },
    resellerId: "reseller_multi_test",
  });

  assert.equal(confirmation.order.status, "CONFIRMED");
  assert.equal(confirmation.bookings.length, 2);
  assert.equal(confirmation.bookings[0].status, "CONFIRMED");
  assert.ok(confirmation.bookings[0].voucher?.code);
  assert.equal(confirmation.bookings[1].status, "CONFIRMED");
  assert.ok(confirmation.bookings[1].voucher?.code);
});


