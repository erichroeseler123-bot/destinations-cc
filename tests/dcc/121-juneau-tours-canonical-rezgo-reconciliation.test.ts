import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";

import { GET as getGoOutRedirect } from "@/app/go/out/route";
import { GET as getAlaskaDirectory } from "@/app/api/v1/alaska/directory/route";
import {
  isOperatorDirectCheckoutConnected,
  isOperatorLiveAvailabilityConnected,
} from "@/lib/dcc/shared/southeastAlaskaDirectoryContract";
import {
  findSoutheastAlaskaOperatorBySlugOrAlias,
  findSoutheastAlaskaTourByOperatorAndSlug,
  getSoutheastAlaskaDirectorySnapshot,
  resolveSoutheastAlaskaTourDirectRezgoHref,
} from "@/lib/dcc/shared/southeastAlaskaDirectoryOperatorsAndTours";
import { buildLfsePublicJuneauAvailabilityView } from "@/apps/last-frontier-shore-excursions/lib/dccJuneauSupplierFeed";

test("Canonical Juneau Tours reconciliation: strictly 1 of 26 operators connected; 20 other indexable & 5 held operators remain false", () => {
  const snapshot = getSoutheastAlaskaDirectorySnapshot();

  assert.equal(snapshot.counts.totalOperatorsModeled, 26);
  assert.equal(snapshot.counts.indexableOperatorProfiles, 21);
  assert.equal(snapshot.counts.liveAvailabilityConnectedOperators, 1);
  assert.equal(snapshot.counts.directCheckoutConnectedOperators, 1);

  const liveConnected = snapshot.operators.filter(
    (entry) => entry.liveAvailabilityConnected,
  );
  const directConnected = snapshot.operators.filter(
    (entry) => entry.directCheckoutConnected,
  );
  assert.equal(liveConnected.length, 1);
  assert.equal(directConnected.length, 1);
  assert.equal(
    liveConnected[0]?.operator.operatorId,
    "operator:juneau-tours-and-whale-watch",
  );
  assert.equal(
    directConnected[0]?.operator.operatorId,
    "operator:juneau-tours-and-whale-watch",
  );

  const jt = findSoutheastAlaskaOperatorBySlugOrAlias(
    "juneau-tours-and-whale-watch",
  );
  assert.ok(jt);
  assert.equal(isOperatorLiveAvailabilityConnected(jt.operator), true);
  assert.equal(isOperatorDirectCheckoutConnected(jt.operator), true);
  assert.equal(jt.gate.metrics.liveAvailabilityConnected, true);
  assert.equal(jt.gate.metrics.directCheckoutConnected, true);
  assert.equal(jt.operator.rezgoDomain, "juneauwhalewatch.rezgo.com");
  assert.equal(
    jt.operator.integrationApproval.publicAttributionParam,
    "refid=dccjuneau10",
  );
  assert.equal(
    jt.operator.integrationApproval.settlementMode,
    "operator_mor_platform_invoices_commission",
  );
  assert.equal(
    jt.operator.integrationApproval.commissionEarnedOn,
    "completed_non_refunded_bookings",
  );
  assert.ok(
    !jt.operator.legacyCompanyAliases?.includes("dolphintours"),
    "Juneau Tours must never claim Dolphin Jet Boat Tours (466119P3) alias",
  );

  // Every other operator must report false for both flags
  for (const entry of snapshot.operators) {
    if (entry.operator.operatorId === "operator:juneau-tours-and-whale-watch") {
      continue;
    }
    assert.equal(
      entry.liveAvailabilityConnected,
      false,
      `${entry.operator.operatorId} must remain liveAvailabilityConnected=false`,
    );
    assert.equal(
      entry.directCheckoutConnected,
      false,
      `${entry.operator.operatorId} must remain directCheckoutConnected=false`,
    );
    assert.equal(entry.gate.metrics.liveAvailabilityConnected, false);
    assert.equal(entry.gate.metrics.directCheckoutConnected, false);
  }
});

test("All 3 canonical Juneau Tours products preserve existing Rezgo/5857 IDs, refid=dccjuneau10, and 302 straight to Serene's Rezgo checkout", async () => {
  const expectedProducts = [
    {
      tourSlug: "auke-bay-whale-watch",
      rezgoCom: "31703",
      viatorCode: "5857P23",
      seoSlug: "juneau-whale-watch-tour",
    },
    {
      tourSlug: "mendenhall-and-whale-combo",
      rezgoCom: "32329",
      viatorCode: "5857P22",
      seoSlug: "mendenhall-glacier-juneau-whale-watching-combo-tour",
    },
    {
      tourSlug: "mendenhall-glacier-shuttle",
      rezgoCom: "344494",
      viatorCode: "5857SHUTTLE",
      seoSlug: "glacier-shuttle-tour",
    },
  ] as const;

  for (const spec of expectedProducts) {
    const tour = findSoutheastAlaskaTourByOperatorAndSlug(
      "juneau-tours-and-whale-watch",
      spec.tourSlug,
    );
    assert.ok(tour, `Missing canonical tour ${spec.tourSlug}`);
    assert.equal(tour.bookingChannel, "supplier_direct_facilitator_10pct");
    assert.ok(tour.authorizedSupplierBinding);
    assert.equal(tour.authorizedSupplierBinding.supplierItemCode, spec.rezgoCom);
    assert.equal(
      tour.authorizedSupplierBinding.matchedPartnerProductCode,
      spec.viatorCode,
    );
    assert.equal(tour.authorizedSupplierBinding.publicRefId, "dccjuneau10");
    assert.equal(tour.authorizedSupplierBinding.merchantOfRecord, "operator");
    assert.equal(
      tour.authorizedSupplierBinding.customerFundsCapturedByPlatform,
      false,
    );
    assert.equal(tour.authorizedSupplierBinding.commissionPercent, 10);
    assert.equal(
      tour.authorizedSupplierBinding.commissionEarnedOn,
      "completed_non_refunded_bookings",
    );

    // Legacy product IDs resolve to the exact same canonical tour (no duplicate products)
    const viaViatorCode = findSoutheastAlaskaTourByOperatorAndSlug(
      "juneau-tours-whale-watch",
      spec.viatorCode,
    );
    const viaRezgoCom = findSoutheastAlaskaTourByOperatorAndSlug(
      "juneau-tours-whale-watch",
      spec.rezgoCom,
    );
    assert.equal(viaViatorCode?.tourId, tour.tourId);
    assert.equal(viaRezgoCom?.tourId, tour.tourId);

    const wrapperHref = resolveSoutheastAlaskaTourDirectRezgoHref(tour, {
      serviceDate: "2027-07-15",
      partySize: 4,
    });
    assert.ok(wrapperHref);
    assert.doesNotMatch(wrapperHref, /viator\.com|tripadvisor\.com/i);

    const goOutReq = new NextRequest(wrapperHref);
    const goOutRes = await getGoOutRedirect(goOutReq);
    assert.equal(goOutRes.status, 302);
    assert.equal(goOutRes.headers.get("x-dcc-provider"), "direct");
    assert.equal(goOutRes.headers.get("x-dcc-provider-account"), "dccjuneau10");

    const location = goOutRes.headers.get("location");
    assert.ok(location);
    const parsedLocation = new URL(location);
    assert.equal(parsedLocation.origin, "https://juneauwhalewatch.rezgo.com");
    assert.equal(
      parsedLocation.pathname,
      `/details/${spec.rezgoCom}/${spec.seoSlug}/${spec.rezgoCom}/2027-07-15`,
    );
    assert.equal(parsedLocation.searchParams.get("refid"), "dccjuneau10");
    assert.equal(parsedLocation.searchParams.get("adult_num"), "4");
    assert.equal(parsedLocation.searchParams.get("party_size"), "4");
    assert.equal(parsedLocation.searchParams.get("tour"), spec.viatorCode);
    assert.equal(
      parsedLocation.searchParams.get("utm_source"),
      "lastfrontiershoreexcursions.com",
    );
    assert.match(parsedLocation.searchParams.get("handoff_id") || "", /^hndf_/);
    assert.match(parsedLocation.searchParams.get("click_id") || "", /^clk_/);
  }
});

test("Fail-closed runtime override & zero credential leakage in snapshot and DCC machine endpoint", async () => {
  const degraded = getSoutheastAlaskaDirectorySnapshot({
    juneauToursRezgo: {
      liveAvailabilityVerified: false,
      directCheckoutVerified: false,
      verifiedRezgoComs: new Set<string>(),
    },
  });
  assert.equal(degraded.counts.liveAvailabilityConnectedOperators, 0);
  assert.equal(degraded.counts.directCheckoutConnectedOperators, 0);

  const jtDegraded = degraded.operators.find(
    (o) => o.operator.operatorId === "operator:juneau-tours-and-whale-watch",
  );
  assert.ok(jtDegraded);
  assert.equal(jtDegraded.liveAvailabilityConnected, false);
  assert.equal(jtDegraded.directCheckoutConnected, false);
  for (const tour of jtDegraded.tours) {
    assert.equal(resolveSoutheastAlaskaTourDirectRezgoHref(tour), null);
  }

  // Zero credentials exposed in snapshot or /api/v1/alaska/directory
  const fullJson = JSON.stringify(getSoutheastAlaskaDirectorySnapshot());
  assert.doesNotMatch(
    fullJson,
    /REZGO_SERENE_CID|REZGO_SERENE_API_KEY|transcode=|api_key|key=/i,
  );

  const apiReq = new NextRequest(
    "https://www.destinationcommandcenter.com/api/v1/alaska/directory?operator=juneau-tours-and-whale-watch",
  );
  const apiRes = await getAlaskaDirectory(apiReq);
  assert.equal(apiRes.status, 200);
  const apiText = await apiRes.text();
  assert.doesNotMatch(
    apiText,
    /REZGO_SERENE_CID|REZGO_SERENE_API_KEY|transcode=|api_key/i,
  );
});

test("Public Juneau availability card preserves party-size filter, hidden raw seat counts, 2-hour return standard & Direct checkout with Juneau Tours", () => {
  const sampleTour = findSoutheastAlaskaTourByOperatorAndSlug(
    "juneau-tours-and-whale-watch",
    "auke-bay-whale-watch",
  )!;
  const directWrapperHref = resolveSoutheastAlaskaTourDirectRezgoHref(
    sampleTour,
    { serviceDate: "2027-07-15", partySize: 4 },
  )!;

  const publicView = buildLfsePublicJuneauAvailabilityView(
    {
      ok: true,
      fallbackActive: false,
      source: "dcc_rezgo_readonly_xml",
      checkedAt: "2026-11-17T12:00:00Z",
      dateChecked: "2027-07-15",
      cachePolicy: {
        scope: "operator_product_service_date",
        operatorKey: "juneau-tours-whale-watch",
        productKey: "all",
        serviceDateKey: "2027-07-15",
        cacheKey: "test",
        maxEntriesBound: 64,
        cacheStatus: "hit",
        cachedAt: "2026-11-17T12:00:00Z",
        expiresAt: "2026-11-17T12:02:00Z",
        ttlSeconds: 120,
      },
      timingSafetyClassification: "live_operator_availability_only",
      verifiedCruiseSafeTiming: false,
      readOnly: true,
      liveDirectRezgoCheckoutEnabled: true,
      verifiedCompanyName: "Juneau Tours",
      verifiedRezgoDomain: "juneauwhalewatch",
      currency: "USD",
      toursCount: 1,
      tours: [
        {
          normalizedTourId: "dcc:rezgo:juneau-tours:31703",
          rezgoUid: "31703",
          rezgoCom: "31703",
          optionUids: ["31703"],
          departureOptions: [
            {
              uid: "31703",
              rezgoCom: "31703",
              optionName: "09:30 AM Departure",
              departureTime: "09:30",
              availableSpots: 18,
              availabilitySemantics: "rezgo_date_search_spots",
              adultPriceUsd: 179,
              childPriceUsd: 149,
              serviceDate: "2027-07-15",
              checkedAt: "2026-11-17T12:00:00Z",
              dccCommerceWrapperHref: directWrapperHref,
              trackedFallbackHref: "https://viator.example/fallback",
              windowAssessment: {
                departureTime: "09:30",
                shipArrivalTime: "08:00",
                shipAllAboardTime: "16:30",
                allAboardConfirmed: true,
                meetingPointAndReturnConfirmed: true,
                durationScope: "dock_to_dock",
                estimatedDockReturnTime: "13:00",
                estimatedTourEndWithoutTransferTime: "13:00",
                upperBoundRemainingSecondsBeforeTransfer: 12600,
                upperBoundRemainingBufferHmsLabel: "3:30:00",
                status: "recommended",
                blockedForSailingWindow: false,
                displayLabel: "Estimated back 2+ hours before all aboard",
              },
            },
          ],
          serviceDate: "2027-07-15",
          checkedAt: "2026-11-17T12:00:00Z",
          dccCommerceWrapperHref: directWrapperHref,
          operatorId: "juneau-tours-whale-watch",
          operatorName: "Juneau Tours & Whale Watch",
          verifiedRezgoCompanyName: "Juneau Tours",
          title: "Juneau Whale Watch Tour",
          optionName: "09:30 AM Departure",
          activityCategory: "whale-watching",
          durationLabel: "3.5 hours",
          durationMinutes: 210,
          durationScope: "dock_to_dock",
          includedOperatorTransportationInPublishedDuration: true,
          adultPriceUsd: 179,
          childPriceUsd: 149,
          currency: "USD",
          departureTimes: ["09:30"],
          blockedOutsideWindowDepartures: [],
          startingLocation: "Downtown Juneau Cruise Docks",
          availableSpots: 18,
          availabilitySemantics: "rezgo_date_search_spots",
          supplierBookingCutoffHours: 2,
          supplierBookingCutoffSemantics:
            "supplier_booking_cutoff_only_never_cruise_return_buffer",
          cruiseTimingVerificationStatus: "dock_to_dock_confirmed_window_evaluated",
          cruiseTimingStatusLabel: "Estimated back 2+ hours before all aboard",
          matchedViatorProductCode: "5857P23",
          approvedFallbackViatorUrl:
            "https://www.viator.com/tours/Juneau/Juneau-Whale-Watching-Tour/d941-5857P23",
          trackedFallbackHref: "https://viator.example/fallback",
          liveDirectRezgoCheckoutEnabled: true,
          safetyNotice: "2-hour return buffer enforced.",
          isolatedSecondaryProperty: true,
          influencesPrimaryDccRanking: false,
        },
      ],
      supplierConflicts: [],
    },
    {
      partySize: 4,
      shipArrivalTime: "08:00",
      shipAllAboardTime: "16:30",
      allAboardConfirmed: true,
    },
  );

  assert.equal(publicView.partySizePrompt, "How many people are going?");
  assert.equal(publicView.cards.length, 1);
  const card = publicView.cards[0]!;
  assert.equal(card.partyAvailabilityLabel, "Available for your group of 4");
  assert.equal(card.checkoutProviderLabel, "Direct checkout with Juneau Tours");
  assert.equal(
    card.recommendedDepartures[0]?.timingStatusLabel,
    "Estimated back 2+ hours before all aboard",
  );
  assert.equal(card.recommendedDepartures[0]?.checkoutHref, directWrapperHref);

  // Hidden raw seat counts: raw `18` spot count must NEVER appear in public card model
  const serializedCard = JSON.stringify(card);
  assert.doesNotMatch(serializedCard, /"availableSpots"|18 spots|18 seats/i);
});
