import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import {
  buildGoSnoPrivateGroupInquiryOption,
  getGoSnoRouteSnapshotDisplayPricing,
  type CorridorId,
} from "@/lib/dcc/applicability";
import { issueOpaqueClickAttribution } from "@/lib/dcc/commerce/opaqueAttributionLedger";
import { syncDurableLedgerWithPostgres } from "@/lib/dcc/storage/durableTransactionalStore";

const ALLOWED_GOSNO_DESTINATIONS = new Set([
  "breckenridge",
  "vail",
  "beaver-creek",
  "keystone",
  "copper",
  "copper-mountain",
  "winter-park",
  "aspen",
  "snowmass",
  "steamboat",
  "steamboat-springs",
  "crested-butte",
  "big-sky",
]);

const DESTINATION_DISPLAY_MAP: Record<string, string> = {
  breckenridge: "Breckenridge",
  vail: "Vail",
  "beaver-creek": "Beaver Creek",
  keystone: "Keystone",
  copper: "Copper Mountain",
  "copper-mountain": "Copper Mountain",
  "winter-park": "Winter Park",
  aspen: "Aspen",
  snowmass: "Snowmass",
  steamboat: "Steamboat Springs",
  "steamboat-springs": "Steamboat Springs",
  "crested-butte": "Crested Butte",
  "big-sky": "Big Sky",
};

const GOSNO_MAX_VAN_PASSENGERS = 10;
const GOSNO_MAX_SUV_PASSENGERS = 6;

function clean(value: string | null, max = 120) {
  return (value || "").trim().slice(0, max);
}

function slug(value: string | null) {
  return clean(value, 64).toLowerCase().replace(/[^a-z0-9-]/g, "");
}

export async function GET(request: Request) {
  await syncDurableLedgerWithPostgres();
  const incoming = new URL(request.url);
  const destination = slug(incoming.searchParams.get("destination"));

  // DCC is coordinate intelligence, not a generic travel referral funnel.
  // A GoSno handoff must represent an explicit supported mountain-transfer
  // destination; stale city-guide URLs must never create unrelated handoffs.
  if (!destination || !ALLOWED_GOSNO_DESTINATIONS.has(destination)) {
    return NextResponse.json(
      {
        ok: false,
        error: "A supported GoSno destination is required for this handoff.",
      },
      {
        status: 400,
        headers: {
          "cache-control": "public, max-age=300",
          "x-robots-tag": "noindex, nofollow",
        },
      },
    );
  }

  const partySizeRaw = clean(
    incoming.searchParams.get("party_size") ||
      incoming.searchParams.get("passengers") ||
      incoming.searchParams.get("passengerCount"),
    3,
  );
  const parsedPartySize = /^\d{1,2}$/.test(partySizeRaw)
    ? Number(partySizeRaw)
    : null;

  const airport = clean(incoming.searchParams.get("airport") || incoming.searchParams.get("origin"), 12).toUpperCase();
  const date = clean(incoming.searchParams.get("date") || incoming.searchParams.get("outboundDate"), 10);
  const standardBags = Number(clean(incoming.searchParams.get("standardBags"), 3)) || 0;
  const skiBags = Number(clean(incoming.searchParams.get("skiBags"), 3)) || 0;
  const rawLuggage = clean(incoming.searchParams.get("luggage"), 180);

  const isBigSky = destination === "big-sky";
  const requestedVehicleType = slug(incoming.searchParams.get("vehicle_type"));
  const maxSingleVehiclePassengers = isBigSky
    ? GOSNO_MAX_SUV_PASSENGERS
    : GOSNO_MAX_VAN_PASSENGERS;

  if (isBigSky && requestedVehicleType === "van" && (parsedPartySize === null || parsedPartySize <= GOSNO_MAX_SUV_PASSENGERS)) {
    const bigSkyPricing = getGoSnoRouteSnapshotDisplayPricing({
      routeId: "BZN-BIG-SKY",
    });
    return NextResponse.json(
      {
        ok: false,
        eligible: false,
        status: "currently_unavailable",
        nextStep: "currently unavailable",
        maxAllowedPassengers: GOSNO_MAX_SUV_PASSENGERS,
        error: `GoSno Big Sky operates Private Chevrolet Suburbans only (up to 6 passengers per vehicle at ${bigSkyPricing.suvOneWayLabel} / ${bigSkyPricing.roundTripSuvPriceLabel} round-trip). Passenger vans are currently unavailable in Big Sky.`,
      },
      {
        status: 422,
        headers: {
          "cache-control": "no-store",
          "x-robots-tag": "noindex, nofollow",
        },
      },
    );
  }

  if (parsedPartySize !== null && parsedPartySize > maxSingleVehiclePassengers) {
    const corridorId: CorridorId =
      destination === "breckenridge"
        ? "corridor:denver-breckenridge-i70"
        : "corridor:denver-vail-i70";
    const displayDestination =
      DESTINATION_DISPLAY_MAP[destination] || destination;
    const directionRaw = clean(incoming.searchParams.get("direction"), 16).toUpperCase();
    const direction =
      directionRaw === "RETURN" || directionRaw === "INBOUND"
        ? "RETURN"
        : directionRaw === "OUTBOUND"
          ? "OUTBOUND"
          : undefined;
    const routeId = clean(
      incoming.searchParams.get("route_id") || incoming.searchParams.get("routeId"),
      64,
    ) || undefined;
    const offerId = clean(
      incoming.searchParams.get("offer_id") || incoming.searchParams.get("offerId"),
      64,
    ) || undefined;
    const groupOption = buildGoSnoPrivateGroupInquiryOption({
      corridorId,
      origin: airport || (isBigSky ? "BZN" : "DEN"),
      destination: displayDestination,
      travelDate: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "2026-12-20",
      passengerCount: parsedPartySize,
      standardBagCount: standardBags || parsedPartySize,
      skiOrOversizeBagCount: skiBags,
      direction,
      routeId,
      offerId,
    });

    if (groupOption && rawLuggage) {
      const customInquiryUrl = new URL(groupOption.inquiryUrl);
      customInquiryUrl.searchParams.set("luggage", rawLuggage);
      groupOption.luggageSummary = rawLuggage;
      groupOption.inquiryUrl = customInquiryUrl.toString();
    }

    const mode = clean(incoming.searchParams.get("mode"), 32);
    const preferPrivate = clean(incoming.searchParams.get("prefer_private"), 8);
    if (groupOption && (mode === "group_inquiry" || preferPrivate === "1")) {
      const handoffId = `ho_${randomUUID()}`;
      const rawSourcePage = clean(incoming.searchParams.get("source_page"), 240);
      const sourcePage = rawSourcePage.startsWith("/location/") ? rawSourcePage : "/go/dcc-to-gosno";
      const receiptId = clean(incoming.searchParams.get("receipt_id") || incoming.searchParams.get("receiptId"), 128) || null;
      const evidenceVersion = clean(incoming.searchParams.get("evidence_version") || incoming.searchParams.get("evidenceVersion"), 128) || "dcc-evidence-stewardship/2026.11";
      const groupTarget = new URL(groupOption.inquiryUrl);

      const opaqueRecord = issueOpaqueClickAttribution({
        decisionReceiptId: receiptId || `rcpt:sha256:${"0".repeat(64)}`,
        recommendedOperatorId: `gosno:${destination}:group`,
        recommendedOperatorName: `GoSno Private Group Inquiry (${displayDestination})`,
        recommendedVehicleClassId: "veh:gosno-multi-vehicle-group",
        evidenceVersion,
        handoffId,
        provider: "direct",
        productCode: `gosno-${destination}-group`,
        productDestinationUrl: groupTarget.toString(),
      });
      await syncDurableLedgerWithPostgres({ forcePushLocal: true });

      groupTarget.searchParams.set("dcc_handoff_id", handoffId);
      groupTarget.searchParams.set("click_id", opaqueRecord.clickId);
      groupTarget.searchParams.set("source_page", sourcePage);
      return NextResponse.redirect(groupTarget, 302);
    }

    return NextResponse.json(
      {
        ok: false,
        eligible: false,
        maxAllowedPassengers: maxSingleVehiclePassengers,
        requestedPassengers: parsedPartySize,
        error: isBigSky
          ? `A group of ${parsedPartySize} passengers exceeds GoSno Big Sky's 6-passenger maximum single-Suburban capacity (passenger vans are currently unavailable in Big Sky; multiple Suburbans require a group quote).`
          : `A group of ${parsedPartySize} passengers exceeds GoSno's 10-passenger maximum single-van capacity (up to 6 in an SUV, or up to 10 in a van, subject to luggage and ski-gear fit).`,
        privateGroupInquiryOption: groupOption,
      },
      {
        status: 422,
        headers: {
          "cache-control": "no-store",
          "x-robots-tag": "noindex, nofollow",
        },
      },
    );
  }

  const target = new URL("https://gosno.co/handoff/dcc");
  const effectiveVehicleType = isBigSky
    ? "suv"
    : parsedPartySize !== null && parsedPartySize > GOSNO_MAX_SUV_PASSENGERS
      ? "van"
      : requestedVehicleType;
  const rawSourcePage = clean(incoming.searchParams.get("source_page"), 240);
  const sourcePage = rawSourcePage.startsWith("/location/") ? rawSourcePage : "/go/dcc-to-gosno";
  const receiptId = clean(incoming.searchParams.get("receipt_id") || incoming.searchParams.get("receiptId"), 128) || null;
  const operatorId = clean(incoming.searchParams.get("operator_id") || incoming.searchParams.get("operatorId"), 96) || `gosno:${destination}`;
  const evidenceVersion = clean(incoming.searchParams.get("evidence_version") || incoming.searchParams.get("evidenceVersion"), 128) || "dcc-evidence-stewardship/2026.11";
  const handoffId = `ho_${randomUUID()}`;

  const opaqueRecord = issueOpaqueClickAttribution({
    decisionReceiptId: receiptId || `rcpt:sha256:${"0".repeat(64)}`,
    recommendedOperatorId: operatorId,
    recommendedOperatorName: `GoSno Mountain Transfer (${destination})`,
    recommendedVehicleClassId: effectiveVehicleType ? `veh:${effectiveVehicleType}` : null,
    evidenceVersion,
    handoffId,
    provider: "direct",
    productCode: `gosno-${destination}`,
    productDestinationUrl: target.toString(),
  });
  await syncDurableLedgerWithPostgres({ forcePushLocal: true });

  target.searchParams.set("destination", destination);
  if (airport) target.searchParams.set("airport", airport);
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) target.searchParams.set("date", date);
  if (parsedPartySize !== null) {
    target.searchParams.set("party_size", String(parsedPartySize));
    target.searchParams.set("passengers", String(parsedPartySize));
    if (parsedPartySize >= 7) {
      target.searchParams.set(
        "fit_note",
        "subject_to_luggage_and_ski_gear_fit_and_availability",
      );
    }
  }
  if (effectiveVehicleType) {
    target.searchParams.set("vehicle_type", effectiveVehicleType);
  }

  target.searchParams.set("dcc_handoff_id", handoffId);
  target.searchParams.set("click_id", opaqueRecord.clickId);
  target.searchParams.set("source_page", sourcePage);

  return NextResponse.redirect(target, 302);
}
