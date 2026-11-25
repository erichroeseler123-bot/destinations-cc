import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import {
  octoOperatorAgreements,
  octoParticipants,
  octoSupplierConnections,
} from "@/lib/db/schema";
import { DccBookingService } from "@/lib/bookings";
import { OctoBookingService } from "@/lib/octo/bookingService";
import {
  deriveOctoAuthorizationSummary,
  INITIAL_OCTO_PARTICIPANTS,
  isConnectionLiveOctoAuthorized,
  isParticipantLiveAuthorized,
  OctoRegistryService,
} from "@/lib/octo/registry";
import { encryptCredential } from "@/lib/octo/security";
import type { OctoOperatorAgreement, OctoParticipant } from "@/lib/octo/types";
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
      options: [
        {
          id: "opt_1",
          default: true,
          title: "Standard",
          units: [{ id: "unit_adult", title: "Adult", type: "ADULT" }],
        },
      ],
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
  const db = getDb();
  assert.ok(db, "Isolated test database must be available");
  DccBookingService.clearPilotSupplierConnections();
  DccBookingService.resetFallbackStoresForTests();

  const { POST: postHold } = await import("@/app/api/octo/hold/route");
  const { POST: postConfirm } = await import("@/app/api/octo/confirm/route");

  const documentedAgreementId = "agr_live_documented_auth_test";
  const documentedOperatorId = "op_documented_alaska";

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

    // 2. Live (isSandbox: false) operator lacking a stored operator agreement rejected before upstream adapter is called
    const unsigned = createCountingAdapter();
    DccBookingService.registerPilotSupplierConnection({
      id: "conn_live_unsigned",
      operatorId: "op_unsigned_glacier",
      operatorSlug: "unsigned-glacier-tours",
      operatorName: "Unsigned Glacier Tours",
      endpoint: "https://unsigned.example/octo",
      reservationPlatform: "direct_octo",
      isSandbox: false,
      connectionStatus: "bookable",
      onboardingStage: "bookable",
      healthStatus: "healthy",
      adapter: unsigned.adapter,
    } as any);

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

    // 3. FareHarbor affiliate-only connection rejected even if marked bookable with an agreement record
    await db
      .insert(octoOperatorAgreements)
      .values({
        id: "agr_fh_affiliate_test",
        operatorId: "op_fh_affiliate_only",
        agreementReference: "FH-AFFILIATE-LINK",
        status: "active",
        agreedCommissionPercent: "6.00",
        paymentModel: "supplier_hosted",
        signatoryName: "FH Affiliate Contact",
        signatoryEmail: "affiliate@example.com",
        signedAt: new Date("2026-11-01T00:00:00.000Z"),
        documentEvidence: "affiliate-portal-note",
      })
      .onConflictDoNothing();

    const fhAffiliate = createCountingAdapter();
    DccBookingService.registerPilotSupplierConnection({
      id: "conn_fh_affiliate_only",
      operatorId: "op_fh_affiliate_only",
      agreementId: "agr_fh_affiliate_test",
      operatorSlug: "fh-affiliate-operator",
      operatorName: "FareHarbor Affiliate Operator",
      endpoint: "https://fareharbor.com/api/external/v1",
      reservationPlatform: "fareharbor",
      isSandbox: false,
      connectionStatus: "bookable",
      onboardingStage: "bookable",
      healthStatus: "healthy",
      fareharborOctoAuthorized: false,
      adapter: fhAffiliate.adapter,
    } as any);

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

    // 4. Positive control + stored agreement revocation / suspension before confirm:
    await db.insert(octoOperatorAgreements).values({
      id: documentedAgreementId,
      operatorId: documentedOperatorId,
      agreementReference: "DCC-OP-2026-001",
      status: "active",
      agreedCommissionPercent: "8.00",
      paymentModel: "supplier_hosted",
      signatoryName: "Dana Signatory",
      signatoryEmail: "dana@documented.example",
      signedAt: new Date("2026-11-15T00:00:00.000Z"),
      documentEvidence: "vault://agreements/DCC-OP-2026-001.pdf",
    });

    const documented = createCountingAdapter();
    DccBookingService.registerPilotSupplierConnection({
      id: "conn_live_documented",
      operatorId: documentedOperatorId,
      agreementId: documentedAgreementId,
      operatorSlug: "documented-alaska-operator",
      operatorName: "Documented Alaska Operator",
      endpoint: "https://documented.example/octo",
      reservationPlatform: "direct_octo",
      isSandbox: false,
      connectionStatus: "bookable",
      onboardingStage: "bookable",
      healthStatus: "healthy",
      adapter: documented.adapter,
    } as any);

    const validHold = await OctoBookingService.createHold({
      supplierConnectionId: "conn_live_documented",
      productId: "prod_live_test",
      optionId: "opt_1",
      availabilityId: "2027-02-15T09:00:00",
      unitItems: [{ unitId: "unit_adult", quantity: 1 }],
    });
    assert.equal(validHold.status, "ON_HOLD");
    assert.equal(documented.getHoldCalls(), 1);

    // Revoke the stored agreement in DB before confirm -> confirm must fail closed with 403!
    await db
      .update(octoOperatorAgreements)
      .set({ status: "revoked", revokedAt: new Date() })
      .where(eq(octoOperatorAgreements.id, documentedAgreementId));

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
    assert.equal(documented.getConfirmCalls(), 0, "Confirm must be blocked once stored agreement is revoked");
  } finally {
    await db
      .delete(octoOperatorAgreements)
      .where(eq(octoOperatorAgreements.id, documentedAgreementId));
    await db
      .delete(octoOperatorAgreements)
      .where(eq(octoOperatorAgreements.id, "agr_fh_affiliate_test"));
    DccBookingService.clearPilotSupplierConnections();
    DccBookingService.resetFallbackStoresForTests();
  }
});

test("First signed-operator DB case: one stored agreement and one stable operator ID across directory and booking connection reports 1 authorized operator and 1 agreed commission while keeping inventory and certification unknown", async () => {
  const db = getDb();
  assert.ok(db, "Isolated test database must be available");

  await OctoRegistryService.seedRegistryIfNeeded();

  const stableOperatorId = "op_first_signed_juneau_kayak";
  const agreementId = "agr_first_signed_juneau_kayak_2026";
  const participantId = "part_first_signed_juneau_kayak";
  const connectionId = "conn_first_signed_juneau_kayak";

  try {
    // 1. Insert one stored operator agreement record with one documented commission
    await db.insert(octoOperatorAgreements).values({
      id: agreementId,
      operatorId: stableOperatorId,
      agreementReference: "DCC-AGR-2026-JK-001",
      status: "active",
      agreedCommissionPercent: "8.50",
      paymentModel: "supplier_hosted",
      signatoryName: "Alex Rivera",
      signatoryEmail: "alex@juneaukayak.example",
      signedAt: new Date("2026-11-20T18:00:00.000Z"),
      documentEvidence: "vault://agreements/DCC-AGR-2026-JK-001.pdf",
      notes: "First signed direct OCTO operator agreement",
    });

    // 2. Insert directory record (octo_participants) with NO inventory evidence and NO certification evidence
    await db.insert(octoParticipants).values({
      id: participantId,
      operatorId: stableOperatorId,
      name: "Juneau Sea Kayak Co.",
      role: "supplier",
      website: "https://juneaukayak.example",
      contactEmail: "ops@juneaukayak.example",
      contactName: "Alex Rivera",
      destinations: ["Juneau", "Auke Bay"],
      endpoint: "https://api.juneaukayak.example/octo",
      certificationEvidence: null,
      inventoryEvidence: null,
      consentStatus: "consented",
      credentialStatus: "verified",
      productsAvailableCount: null,
      bookingPaymentModel: "supplier_hosted",
      outreachStatus: "live_authorized",
      agreedCommissionPercent: "8.50",
      notes: "Signed direct OCTO operator; catalog sync and formal certification pending.",
    });

    // 3. Insert booking connection record (octo_supplier_connections) sharing the SAME stable operatorId
    await db.insert(octoSupplierConnections).values({
      id: connectionId,
      operatorId: stableOperatorId,
      agreementId,
      operatorSlug: "juneau-sea-kayak-co",
      operatorName: "Juneau Sea Kayak Co.",
      endpoint: "https://api.juneaukayak.example/octo",
      encryptedApiKey: encryptCredential("jk_live_octo_key_test"),
      encryptedBearerToken: null,
      capabilities: ["octo/core"],
      isSandbox: false,
      connectionStatus: "bookable",
      reservationPlatform: "direct_octo",
      onboardingStage: "bookable",
      signatoryName: "Alex Rivera",
      signatoryEmail: "alex@juneaukayak.example",
      consentAgreementVersion: "1.0",
      consentedAt: new Date("2026-11-20T18:00:00.000Z"),
      paymentModel: "supplier_hosted",
      commissionPercent: "8.50",
      healthStatus: "healthy",
      catalogSyncStatus: null, // No catalog sync evidence yet
    });

    // Verify both DB records resolve cleanly and share the single stable operatorId
    const authorizedConns = await OctoRegistryService.getAuthorizedConnections();
    assert.equal(authorizedConns.length, 1, "Must expose exactly 1 live-authorized connection");
    assert.equal(authorizedConns[0].id, connectionId);
    assert.equal(authorizedConns[0].operatorId, stableOperatorId);
    assert.equal(authorizedConns[0].agreementId, agreementId);
    assert.equal(authorizedConns[0].agreementReference, "DCC-AGR-2026-JK-001");

    // 4. Call GET /api/octo/participants and verify exact counts + unknown inventory & certification
    const { GET: getParticipants } = await import("@/app/api/octo/participants/route");
    const res = await getParticipants(
      new Request("https://www.destinationcommandcenter.com/api/octo/participants") as any
    );
    assert.equal(res.status, 200);
    const body = await res.json();

    assert.equal(
      body.authorizedOperatorCount,
      1,
      "Having both directory and booking-connection records for one operatorId must count as 1 authorized operator"
    );
    assert.equal(body.liveAuthorizedOperatorCount, 1);
    assert.equal(body.liveAuthorizedParticipantCount, 1);
    assert.equal(body.agreedCommissionsCount, 1, "Must report exactly 1 agreed commission");
    assert.equal(body.directProductionSalesDisabled, false);

    const signedParticipant = body.participants.find((p: any) => p.id === participantId);
    assert.ok(signedParticipant, "Signed operator must be returned by /api/octo/participants");
    assert.equal(signedParticipant.operatorId, stableOperatorId);
    assert.equal(signedParticipant.outreachStatus, "live_authorized");
    assert.equal(signedParticipant.partnershipStatus, "verified");
    assert.equal(signedParticipant.apiAccessStatus, "verified");
    assert.equal(signedParticipant.commercialTermsStatus, "agreed");
    assert.equal(signedParticipant.agreementId, agreementId);
    assert.equal(signedParticipant.agreementReference, "DCC-AGR-2026-JK-001");
    assert.equal(signedParticipant.agreedCommissionPercent, 8.5);

    // Inventory and certification MUST remain unknown until each has its own evidence
    assert.equal(signedParticipant.inventoryStatus, "unknown");
    assert.equal(signedParticipant.productsAvailableCount, null);
    assert.equal(signedParticipant.inventoryEvidence, null);
    assert.equal(signedParticipant.certificationStatus, "unknown");
    assert.equal(signedParticipant.certificationEvidence, null);

    // 5. Verify independent evidence unlocking: inventory evidence unlocks ONLY inventory, leaving certification unknown
    await db
      .update(octoParticipants)
      .set({
        inventoryEvidence: "catalog-sync-run:2026-11-23T22:00:00Z",
        productsAvailableCount: 3,
      })
      .where(eq(octoParticipants.id, participantId));

    const afterInventoryRes = await getParticipants(
      new Request("https://www.destinationcommandcenter.com/api/octo/participants") as any
    );
    const afterInventoryBody = await afterInventoryRes.json();
    const withInventory = afterInventoryBody.participants.find((p: any) => p.id === participantId);
    assert.equal(withInventory.inventoryStatus, "verified");
    assert.equal(withInventory.productsAvailableCount, 3);
    assert.equal(
      withInventory.certificationStatus,
      "unknown",
      "Certification must stay unknown until certificationEvidence is provided"
    );
  } finally {
    await db.delete(octoSupplierConnections).where(eq(octoSupplierConnections.id, connectionId));
    await db.delete(octoParticipants).where(eq(octoParticipants.id, participantId));
    await db.delete(octoOperatorAgreements).where(eq(octoOperatorAgreements.id, agreementId));
  }
});

test("Live-operator counts derive from documented authorizations and FareHarbor affiliate never counts as OCTO", () => {
  const baseSummary = deriveOctoAuthorizationSummary(INITIAL_OCTO_PARTICIPANTS, [], []);
  assert.equal(baseSummary.liveAuthorizedOperatorCount, 0);
  assert.equal(baseSummary.agreedCommissionsCount, 0);

  const activeAgreement: OctoOperatorAgreement = {
    id: "agr_unit_101",
    operatorId: "op_documented_supplier",
    agreementReference: "DCC-AGR-2026-101",
    status: "active",
    agreedCommissionPercent: 8.0,
    paymentModel: "supplier_hosted",
    signatoryName: "Morgan Operator",
    signatoryEmail: "morgan@supplier.example",
    signedAt: "2026-11-20T00:00:00.000Z",
  };

  const authorizedSupplier: OctoParticipant = {
    ...INITIAL_OCTO_PARTICIPANTS.find((p) => p.id === "part_vibe_around_town")!,
    id: "part_documented_supplier",
    operatorId: "op_documented_supplier",
    apiAccessStatus: "verified",
    credentialStatus: "verified",
    consentStatus: "consented",
    outreachStatus: "live_authorized",
    commercialTermsStatus: "agreed",
    agreementId: activeAgreement.id,
    agreedCommissionPercent: 8.0,
    agreementReference: activeAgreement.agreementReference,
    fareharborOctoAuthorized: false,
  };
  assert.equal(isParticipantLiveAuthorized(authorizedSupplier, activeAgreement), true);

  const fhAffiliateCandidate: OctoParticipant = {
    ...authorizedSupplier,
    id: "part_fareharbor_octo",
    operatorId: "op_fh_candidate",
    fareharborOctoAuthorized: false,
  };
  const fhAgreement: OctoOperatorAgreement = {
    ...activeAgreement,
    id: "agr_fh_101",
    operatorId: "op_fh_candidate",
  };
  assert.equal(isParticipantLiveAuthorized(fhAffiliateCandidate, fhAgreement), false);

  const unsignedSupplier: OctoParticipant = {
    ...authorizedSupplier,
    id: "part_unsigned_supplier",
    operatorId: "op_unsigned_supplier",
    agreementId: null,
    agreementReference: null,
  };
  assert.equal(isParticipantLiveAuthorized(unsignedSupplier, null), false);

  // Even when BOTH participant and connection records are passed for op_documented_supplier, count must be 1
  const withBothRecords = deriveOctoAuthorizationSummary(
    [...INITIAL_OCTO_PARTICIPANTS, authorizedSupplier, fhAffiliateCandidate, unsignedSupplier],
    [
      {
        id: "conn_documented_supplier",
        operatorId: "op_documented_supplier",
        agreementId: activeAgreement.id,
        agreementReference: activeAgreement.agreementReference,
        operatorSlug: "documented-supplier",
        operatorName: "Documented Supplier",
        endpoint: "https://supplier.example/octo",
        capabilities: ["octo/core"],
        isSandbox: false,
        onboardingStage: "bookable",
        connectionStatus: "bookable",
        healthStatus: "healthy",
        consentAgreementVersion: "1.0",
        paymentModel: "supplier_hosted",
        commissionPercent: 8.0,
      },
    ],
    [activeAgreement, fhAgreement]
  );
  assert.equal(withBothRecords.liveAuthorizedOperatorCount, 1);
  assert.equal(withBothRecords.agreedCommissionsCount, 1);

  assert.equal(
    isConnectionLiveOctoAuthorized(
      {
        id: "conn_fh_aff",
        operatorId: "op_fh_candidate",
        agreementId: fhAgreement.id,
        operatorSlug: "fh-op",
        isSandbox: false,
        onboardingStage: "bookable",
        connectionStatus: "bookable",
        healthStatus: "healthy",
        reservationPlatform: "fareharbor",
        fareharborOctoAuthorized: false,
        agreementReference: "FH-AFF-01",
      },
      fhAgreement
    ),
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
  const res = await getParticipants(
    new Request("https://www.destinationcommandcenter.com/api/octo/participants") as any
  );
  assert.equal(res.status, 200);
  const bodyText = await res.text();
  assert.doesNotMatch(bodyText, /"agreedPlatformShare"/);
  assert.doesNotMatch(bodyText, /10%/);
});
