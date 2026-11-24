import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DccBookingService } from "@/lib/bookings";
import { OctoBookingService } from "@/lib/octo/bookingService";
import {
  deriveOctoAuthorizationSummary,
  INITIAL_OCTO_PARTICIPANTS,
  isConnectionLiveOctoAuthorized,
  isParticipantLiveAuthorized,
} from "@/lib/octo/registry";
import type { OctoParticipant } from "@/lib/octo/types";
import type { OctoProviderAdapter } from "@/lib/providers";

function createCountingAdapter() {
  let holdCalls = 0;
  let confirmCalls = 0;
  const adapter: OctoProviderAdapter = {
    providerType: "direct_octo",
    getSupplier: async () => ({ id: "sup_1", name: "Test Supplier", capabilities: ["octo/core"] }),
    getProducts: async () => [],
    getProduct: async (id: string) => ({
      id,
      internalName: "Test Tour",
      reference: id,
      title: "Test Tour",
      defaultCurrency: "USD",
      capabilities: ["octo/core"],
      options: [{ id: "opt_1", default: true, title: "Standard", units: [{ id: "unit_adult", title: "Adult", type: "ADULT" }] }],
    }),
    checkAvailability: async () => [
      {
        id: "2027-02-15T09:00:00",
        localDateTimeStart: "2027-02-15T09:00:00",
        localDateTimeEnd: "2027-02-15T11:00:00",
        allDay: false,
        available: true,
        status: "AVAILABLE",
        vacancies: 8,
        capacity: 10,
      },
    ],
    createBookingHold: async (params) => {
      holdCalls++;
      return {
        id: params.uuid || "bk_hold_1",
        uuid: params.uuid || "bk_hold_1",
        status: "ON_HOLD",
        productId: params.productId,
        optionId: params.optionId,
        availabilityId: params.availabilityId,
        utcHoldExpires: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        totalPrice: 150,
        currency: "USD",
        unitItems: params.unitItems.map((u, idx) => ({
          uuid: `ui_${idx}`,
          unitId: u.unitId,
          unitType: "ADULT",
          status: "ON_HOLD",
          price: 150,
          currency: "USD",
        })),
        supplierReference: `SUP-${params.uuid || "1"}`,
      };
    },
    confirmBooking: async (bookingId, params) => {
      confirmCalls++;
      return {
        id: bookingId,
        uuid: bookingId,
        status: "CONFIRMED",
        productId: "prod_live_test",
        optionId: "opt_1",
        availabilityId: "2027-02-15T09:00:00",
        utcHoldExpires: null,
        totalPrice: 150,
        currency: "USD",
        unitItems: [],
        contact: params.contact,
        confirmedAt: new Date().toISOString(),
        voucher: { code: "VCH-LIVE-1", deliveryMethod: "VOUCHER_CODE" },
      };
    },
    getBooking: async (bookingId) => ({
      id: bookingId,
      uuid: bookingId,
      status: "ON_HOLD",
      productId: "prod_live_test",
      optionId: "opt_1",
      availabilityId: "2027-02-15T09:00:00",
      utcHoldExpires: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      totalPrice: 150,
      currency: "USD",
      unitItems: [],
    }),
    cancelBooking: async (bookingId, reason) => ({
      id: bookingId,
      uuid: bookingId,
      status: "CANCELLED",
      productId: "prod_live_test",
      optionId: "opt_1",
      availabilityId: "2027-02-15T09:00:00",
      totalPrice: 150,
      currency: "USD",
      unitItems: [],
      cancellationReason: typeof reason === "string" ? reason : reason?.reason,
    }),
  } as OctoProviderAdapter;

  return { adapter, getHoldCalls: () => holdCalls, getConfirmCalls: () => confirmCalls };
}

test("Unauthorized operators cannot create a live hold or confirm a booking (service + HTTP routes)", async () => {
  DccBookingService.clearPilotSupplierConnections();
  DccBookingService.resetFallbackStoresForTests();

  const { POST: postHold } = await import("@/app/api/octo/hold/route");
  const { POST: postConfirm } = await import("@/app/api/octo/confirm/route");

  try {
    // 1. Directory-only / authorization_pending operator (Vibe Around Town) rejected on hold and confirm
    const vibeHoldRes = await postHold(
      new Request("https://www.destinationcommandcenter.com/api/octo/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierConnectionId: "conn_vibe_around_town",
          productId: "prod_vibe_st_thomas_tour",
          optionId: "opt_1",
          availabilityId: "2027-02-15T09:00:00",
          unitItems: [{ unitId: "unit_adult", quantity: 2 }],
        }),
      }) as any
    );
    assert.equal(vibeHoldRes.status, 403);
    const vibeHoldBody = await vibeHoldRes.json();
    assert.equal(vibeHoldBody.error, "UNAUTHORIZED_SUPPLIER");

    await assert.rejects(
      () =>
        OctoBookingService.confirmReservation({
          bookingId: "dcc:bk:vibe-unauth",
          supplierConnectionId: "conn_vibe_around_town",
          contact: { fullName: "Test Traveler", emailAddress: "traveler@example.com" },
        } as any),
      (err: any) => err.status === 403 && err.code === "UNAUTHORIZED_SUPPLIER"
    );

    // 2. Live (isSandbox: false) operator lacking documented agreementReference rejected before upstream adapter is called
    const unsigned = createCountingAdapter();
    DccBookingService.registerPilotSupplierConnection({
      id: "conn_live_unsigned",
      operatorSlug: "unsigned-glacier-tours",
      operatorName: "Unsigned Glacier Tours",
      endpoint: "https://unsigned.example/octo",
      reservationPlatform: "direct_octo",
      isSandbox: false,
      connectionStatus: "bookable",
      onboardingStage: "bookable",
      healthStatus: "healthy",
      agreementReference: null, // Missing documented agreement!
      adapter: unsigned.adapter,
    });

    const unsignedHoldRes = await postHold(
      new Request("https://www.destinationcommandcenter.com/api/octo/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierConnectionId: "conn_live_unsigned",
          productId: "prod_live_test",
          optionId: "opt_1",
          availabilityId: "2027-02-15T09:00:00",
          unitItems: [{ unitId: "unit_adult", quantity: 1 }],
        }),
      }) as any
    );
    assert.equal(unsignedHoldRes.status, 403);
    assert.equal(unsigned.getHoldCalls(), 0, "Adapter createBookingHold must never fire for unsigned live operator");

    await assert.rejects(
      () =>
        OctoBookingService.confirmReservation({
          bookingId: "dcc:bk:unsigned0001",
          supplierConnectionId: "conn_live_unsigned",
          contact: { fullName: "Test Traveler", emailAddress: "traveler@example.com" },
        } as any),
      (err: any) => err.status === 403 && err.code === "UNAUTHORIZED_SUPPLIER"
    );
    assert.equal(unsigned.getConfirmCalls(), 0, "Adapter confirmBooking must never fire for unsigned live operator");

    // 3. FareHarbor affiliate-only connection rejected even if marked bookable with an affiliate reference
    const fhAffiliate = createCountingAdapter();
    DccBookingService.registerPilotSupplierConnection({
      id: "conn_fh_affiliate_only",
      operatorSlug: "fh-affiliate-operator",
      operatorName: "FareHarbor Affiliate Operator",
      endpoint: "https://fareharbor.com/api/external/v1",
      reservationPlatform: "fareharbor",
      isSandbox: false,
      connectionStatus: "bookable",
      onboardingStage: "bookable",
      healthStatus: "healthy",
      agreementReference: "FH-AFFILIATE-LINK",
      fareharborOctoAuthorized: false,
      adapter: fhAffiliate.adapter,
    });

    await assert.rejects(
      () =>
        OctoBookingService.createHold({
          supplierConnectionId: "conn_fh_affiliate_only",
          productId: "prod_fh_tour",
          optionId: "opt_1",
          availabilityId: "2027-02-15T09:00:00",
          unitItems: [{ unitId: "unit_adult", quantity: 2 }],
        }),
      (err: any) => err.status === 403 && err.code === "UNAUTHORIZED_SUPPLIER"
    );
    assert.equal(fhAffiliate.getHoldCalls(), 0);

    // 4. Positive control + revocation before confirm:
    // A documented live operator CAN hold, and if deauthorized/suspended before confirm, CANNOT confirm!
    const documented = createCountingAdapter();
    DccBookingService.registerPilotSupplierConnection({
      id: "conn_live_documented",
      operatorSlug: "documented-alaska-operator",
      operatorName: "Documented Alaska Operator",
      endpoint: "https://documented.example/octo",
      reservationPlatform: "direct_octo",
      isSandbox: false,
      connectionStatus: "bookable",
      onboardingStage: "bookable",
      healthStatus: "healthy",
      agreementReference: "DCC-OP-2026-001",
      adapter: documented.adapter,
    });

    const validHold = await OctoBookingService.createHold({
      supplierConnectionId: "conn_live_documented",
      productId: "prod_live_test",
      optionId: "opt_1",
      availabilityId: "2027-02-15T09:00:00",
      unitItems: [{ unitId: "unit_adult", quantity: 1 }],
    });
    assert.equal(validHold.status, "ON_HOLD");
    assert.equal(documented.getHoldCalls(), 1);

    // Suspend / revoke authorization before confirm
    DccBookingService.registerPilotSupplierConnection({
      id: "conn_live_documented",
      operatorSlug: "documented-alaska-operator",
      operatorName: "Documented Alaska Operator",
      endpoint: "https://documented.example/octo",
      reservationPlatform: "direct_octo",
      isSandbox: false,
      connectionStatus: "suspended",
      onboardingStage: "bookable",
      healthStatus: "healthy",
      agreementReference: "DCC-OP-2026-001",
      adapter: documented.adapter,
    });

    const confirmRevokedRes = await postConfirm(
      new Request("https://www.destinationcommandcenter.com/api/octo/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: validHold.dccBookingId,
          contact: { fullName: "Test Traveler", emailAddress: "traveler@example.com" },
        }),
      }) as any
    );
    assert.equal(confirmRevokedRes.status, 403);
    const confirmRevokedBody = await confirmRevokedRes.json();
    assert.equal(confirmRevokedBody.error, "UNAUTHORIZED_SUPPLIER");
    assert.equal(documented.getConfirmCalls(), 0, "Confirm must be blocked once operator is unauthorized");
  } finally {
    DccBookingService.clearPilotSupplierConnections();
    DccBookingService.resetFallbackStoresForTests();
  }
});

test("Live-operator counts derive from documented authorizations and FareHarbor affiliate never counts as OCTO", () => {
  const baseSummary = deriveOctoAuthorizationSummary(INITIAL_OCTO_PARTICIPANTS, []);
  assert.equal(baseSummary.liveAuthorizedOperatorCount, 0);
  assert.equal(baseSummary.agreedCommissionsCount, 0);

  const authorizedSupplier: OctoParticipant = {
    ...INITIAL_OCTO_PARTICIPANTS.find((p) => p.id === "part_vibe_around_town")!,
    id: "part_documented_supplier",
    apiAccessStatus: "verified",
    credentialStatus: "verified",
    consentStatus: "consented",
    outreachStatus: "live_authorized",
    commercialTermsStatus: "agreed",
    agreedCommissionPercent: 8.0,
    agreementReference: "DCC-AGR-2026-101",
    fareharborOctoAuthorized: false,
  };
  assert.equal(isParticipantLiveAuthorized(authorizedSupplier), true);

  const fhAffiliateCandidate: OctoParticipant = {
    ...authorizedSupplier,
    id: "part_fareharbor_octo",
    fareharborOctoAuthorized: false,
  };
  assert.equal(isParticipantLiveAuthorized(fhAffiliateCandidate), false);

  const unsignedSupplier: OctoParticipant = {
    ...authorizedSupplier,
    id: "part_unsigned_supplier",
    agreementReference: null,
  };
  assert.equal(isParticipantLiveAuthorized(unsignedSupplier), false);

  const withOneAuthorized = deriveOctoAuthorizationSummary(
    [...INITIAL_OCTO_PARTICIPANTS, authorizedSupplier, fhAffiliateCandidate, unsignedSupplier],
    []
  );
  assert.equal(withOneAuthorized.liveAuthorizedOperatorCount, 1);
  assert.equal(withOneAuthorized.agreedCommissionsCount, 1);

  assert.equal(
    isConnectionLiveOctoAuthorized({
      id: "conn_fh_aff",
      operatorSlug: "fh-op",
      isSandbox: false,
      onboardingStage: "bookable",
      connectionStatus: "bookable",
      healthStatus: "healthy",
      reservationPlatform: "fareharbor",
      fareharborOctoAuthorized: false,
      agreementReference: "FH-AFF-01",
    }),
    false
  );
});

test("Public OCTO directory, tour pages, and participant API exclude unverified 5% and unadopted 10% commission copy", async () => {
  const root = process.cwd();
  for (const relPath of [
    "app/octo/page.tsx",
    "app/tours/page.tsx",
    "app/tours/octo/[productId]/page.tsx",
    "app/tours/octo/[productId]/BookingPanel.tsx",
    "app/api/octo/participants/route.ts",
  ]) {
    const src = readFileSync(join(root, relPath), "utf8");
    assert.doesNotMatch(src, /5%\s*(Fixed|Platform|DCC|Take-Rate)/i, `${relPath} must not claim a 5% rate`);
    assert.doesNotMatch(src, /10%\s*(Proposed|Direct|Commission|Platform)/i, `${relPath} must keep proposed 10% rate out of public copy`);
  }

  const { GET: getParticipants } = await import("@/app/api/octo/participants/route");
  const res = await getParticipants(new Request("https://destinationcommandcenter.com/api/octo/participants") as any);
  const jsonText = await res.text();
  assert.doesNotMatch(jsonText, /10%|5\.0%|5%/);
});
