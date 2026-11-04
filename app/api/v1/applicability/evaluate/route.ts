import { NextResponse } from "next/server";
import {
  DEFAULT_GOSNO_SNAPSHOT_TTL_MS,
  SCHEDULED_GOSNO_FEED_REFRESH_CRON,
  SCHEDULED_GOSNO_FEED_REFRESH_INTERVAL_MS,
  SCHEDULED_GOSNO_FEED_REFRESH_PATH,
  compileApplicableDecisionContext,
  getActiveGoSnoRouteFeedSnapshotState,
  getVersionedApplicabilityContextModel,
  type CompiledApplicableDecisionOutcome,
  type CorridorId,
  type GoSnoRouteDirection,
  type TripApplicabilityRequest,
} from "@/lib/dcc/applicability";
import { issueOpaqueClickAttribution } from "@/lib/dcc/commerce/opaqueAttributionLedger";
import { syncDurableLedgerWithPostgres } from "@/lib/dcc/storage/durableTransactionalStore";

export const dynamic = "force-dynamic";

const DEFAULT_PARTNER_URLS: Record<CorridorId, string> = {
  "corridor:denver-vail-i70":
    "https://gosno.co/vail?origin=DEN&destination=Vail&passengers=6&passengerCount=6&vehicleClass=van",
  "corridor:denver-breckenridge-i70":
    "https://gosno.co/breckenridge?origin=DEN&destination=Breckenridge&passengers=6&passengerCount=6&vehicleClass=van",
  "corridor:denver-red-rocks":
    "https://www.partyatredrocks.com/book?corridor=denver-red-rocks",
  "corridor:juneau-port-icefield":
    "https://www.coastalhelicopters.com/tours/icefield-excursion/",
  "corridor:new-orleans-barataria-swamp":
    "https://airboatadventures.com/tours/",
};

export async function GET() {
  await syncDurableLedgerWithPostgres();
  const model = getVersionedApplicabilityContextModel();
  const gosnoState = getActiveGoSnoRouteFeedSnapshotState();
  return NextResponse.json(
    {
      ok: true,
      modelVersion: model.modelVersion,
      compilerVersion: model.compilerVersion,
      modelHash: model.modelHash,
      segmentsCount: model.segments.length,
      vehicleClassesCount: model.vehicleClasses.length,
      regulationsCount: model.regulations.length,
      scheduledRefreshCadence: {
        endpoint: SCHEDULED_GOSNO_FEED_REFRESH_PATH,
        cron: SCHEDULED_GOSNO_FEED_REFRESH_CRON,
        intervalMs: SCHEDULED_GOSNO_FEED_REFRESH_INTERVAL_MS,
        snapshotTtlMs: DEFAULT_GOSNO_SNAPSHOT_TTL_MS,
        refreshesBeforeExpiry: Math.floor(
          DEFAULT_GOSNO_SNAPSHOT_TTL_MS /
            SCHEDULED_GOSNO_FEED_REFRESH_INTERVAL_MS,
        ),
      },
      gosnoRouteFeedSnapshot: {
        snapshotId: gosnoState.snapshot.snapshotId,
        sourceUrl: gosnoState.snapshot.sourceUrl,
        feedVersion: gosnoState.snapshot.feedVersion,
        feedGeneratedAt: gosnoState.snapshot.feedGeneratedAt,
        contentHash: gosnoState.snapshot.contentHash,
        rawPayloadHash: gosnoState.snapshot.rawPayloadHash,
        fetchedAt: gosnoState.snapshot.fetchedAt,
        expiresAt: gosnoState.snapshot.expiresAt,
        ageMs: gosnoState.ageMs,
        ageLabel: gosnoState.ageLabel,
        isExpired: gosnoState.isExpired,
        freshnessStatus: gosnoState.freshnessStatus,
        statusBanner: gosnoState.statusBanner,
        routeCount: gosnoState.snapshot.routeCount,
        roundTripCount: gosnoState.snapshot.roundTripCount,
      },
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=300",
      },
    },
  );
}

export async function POST(request: Request) {
  try {
    await syncDurableLedgerWithPostgres();
    const body = (await request.json()) as Partial<TripApplicabilityRequest> & {
      partnerDestinationUrl?: string;
      preferPrivateTransfer?: boolean;
      partnerNetwork?:
        | "viator"
        | "fareharbor"
        | "getyourguide"
        | "rezdy"
        | "square"
        | "direct";
    };

    const corridorId: CorridorId =
      body.corridorId ?? "corridor:denver-vail-i70";
    const applicabilityRequest: TripApplicabilityRequest = {
      corridorId,
      routeId: body.routeId,
      offerId: body.offerId,
      direction:
        body.direction === "RETURN" || body.direction === "OUTBOUND"
          ? (body.direction as GoSnoRouteDirection)
          : undefined,
      origin: body.origin,
      destination: body.destination,
      travelDate: body.travelDate ?? "2026-12-15",
      passengerCount: Number(body.passengerCount ?? 4),
      standardBagCount: Number(body.standardBagCount ?? 6),
      skiOrOversizeBagCount: Number(body.skiOrOversizeBagCount ?? 0),
      roofBoxConfirmed: Boolean(body.roofBoxConfirmed),
      staggeredFlightArrivals: Boolean(body.staggeredFlightArrivals),
      youngestPassengerAgeYears:
        typeof body.youngestPassengerAgeYears === "number"
          ? body.youngestPassengerAgeYears
          : null,
      maxSinglePassengerWeightLbs:
        typeof body.maxSinglePassengerWeightLbs === "number"
          ? body.maxSinglePassengerWeightLbs
          : null,
      activeSegmentConditions: body.activeSegmentConditions ?? {},
      evaluationTimestamp: body.evaluationTimestamp,
    };

    const outcome: CompiledApplicableDecisionOutcome =
      compileApplicableDecisionContext(applicabilityRequest);

    const explicitPartnerUrl = body.partnerDestinationUrl?.trim();
    const defaultPartnerUrl =
      DEFAULT_PARTNER_URLS[corridorId] ||
      "https://gosno.co/vail?origin=DEN&destination=Vail";

    let basePartnerUrl = explicitPartnerUrl || defaultPartnerUrl;

    if (
      outcome.privateGroupInquiryOption &&
      (body.preferPrivateTransfer === true || !outcome.recommendedOperatorId)
    ) {
      basePartnerUrl = outcome.privateGroupInquiryOption.inquiryUrl;
    } else if (outcome.recommendedOperatorId === "op:gosno") {
      const matchedSnap = outcome.gosnoPricingSnapshot;
      const isSuv = outcome.recommendedVehicleClassId === "veh:awd-full-size-suv";
      const matchedOffer = isSuv
        ? matchedSnap?.suvOffer
        : matchedSnap?.vanOffer;
      const isSnapshotExpired = Boolean(matchedSnap?.isExpired);

      const hasCustomRouteOrDest = Boolean(
        body.routeId ||
          body.offerId ||
          body.direction === "RETURN" ||
          (body.destination &&
            body.destination !== "Vail" &&
            body.destination !== "Breckenridge"),
      );

      const fallbackGoSnoBase =
        corridorId === "corridor:denver-breckenridge-i70"
          ? "https://gosno.co/breckenridge"
          : "https://gosno.co/vail";

      const goSnoBase = isSnapshotExpired
        ? matchedOffer?.quoteUrl || "https://gosno.co/request-quote"
        : matchedOffer?.canonicalBookingUrl || fallbackGoSnoBase;

      const parsed = new URL(
        !isSnapshotExpired &&
          !hasCustomRouteOrDest &&
          explicitPartnerUrl &&
          explicitPartnerUrl.includes("gosno.co")
          ? explicitPartnerUrl
          : goSnoBase,
      );
      parsed.searchParams.set(
        "origin",
        matchedSnap?.matchedOrigin || "DEN",
      );
      parsed.searchParams.set(
        "destination",
        matchedSnap?.matchedDestination ||
          (corridorId === "corridor:denver-breckenridge-i70"
            ? "Breckenridge"
            : "Vail"),
      );
      if (matchedSnap?.matchedRouteId) {
        parsed.searchParams.set("routeId", matchedSnap.matchedRouteId);
      }
      if (matchedOffer?.offerId) {
        parsed.searchParams.set("offerId", matchedOffer.offerId);
      }
      if (applicabilityRequest.travelDate) {
        parsed.searchParams.set("date", applicabilityRequest.travelDate);
      }
      parsed.searchParams.set(
        "passengers",
        String(applicabilityRequest.passengerCount),
      );
      parsed.searchParams.set(
        "passengerCount",
        String(applicabilityRequest.passengerCount),
      );
      parsed.searchParams.set(
        "party_size",
        String(applicabilityRequest.passengerCount),
      );
      parsed.searchParams.set(
        "standardBags",
        String(applicabilityRequest.standardBagCount),
      );
      parsed.searchParams.set(
        "skiBags",
        String(applicabilityRequest.skiOrOversizeBagCount),
      );
      parsed.searchParams.set("vehicleClass", isSuv ? "suv" : "van");
      if (isSnapshotExpired) {
        parsed.searchParams.delete("publishedPrice");
        if (applicabilityRequest.travelDate) {
          parsed.searchParams.set(
            "outboundDate",
            applicabilityRequest.travelDate,
          );
        }
        parsed.searchParams.set("vehicleType", isSuv ? "suv" : "van");
      }
      basePartnerUrl = parsed.toString();
    } else if (
      outcome.recommendedOperatorId === "op:epic-mountain-express" &&
      basePartnerUrl.includes("gosno.co")
    ) {
      const epicUrl = new URL("https://www.epicmountainexpress.com/shuttle-rates");
      epicUrl.searchParams.set("origin", "DEN");
      epicUrl.searchParams.set(
        "destination",
        corridorId === "corridor:denver-breckenridge-i70"
          ? "Breckenridge"
          : "Vail",
      );
      if (applicabilityRequest.travelDate) {
        epicUrl.searchParams.set("date", applicabilityRequest.travelDate);
      }
      epicUrl.searchParams.set(
        "passengers",
        String(applicabilityRequest.passengerCount),
      );
      basePartnerUrl = epicUrl.toString();
    }

    const usePrivateGroupAsPrimary =
      Boolean(outcome.privateGroupInquiryOption) &&
      (body.preferPrivateTransfer === true || !outcome.recommendedOperatorId);

    const opaqueRecord = issueOpaqueClickAttribution({
      decisionReceiptId: outcome.decisionReceiptId,
      recommendedOperatorId: usePrivateGroupAsPrimary
        ? "op:gosno"
        : outcome.recommendedOperatorId || `operator:${corridorId}`,
      recommendedOperatorName: usePrivateGroupAsPrimary
        ? "GoSno Mountain Transport (Multi-Vehicle Group Inquiry)"
        : outcome.recommendedOperatorName,
      recommendedVehicleClassId: usePrivateGroupAsPrimary
        ? "veh:gosno-multi-vehicle-group"
        : outcome.recommendedVehicleClassId,
      evidenceVersion: outcome.evidenceVersion,
      applicabilityModelVersion: outcome.modelVersion,
      applicabilityOutcomeHash: outcome.outcomeHash,
      provider: body.partnerNetwork ?? "direct",
      productCode: usePrivateGroupAsPrimary
        ? "gosno-multi-vehicle-group"
        : outcome.recommendedVehicleClassId || corridorId,
      productDestinationUrl: basePartnerUrl,
    });

    const privateGroupInquiryAttribution = outcome.privateGroupInquiryOption
      ? usePrivateGroupAsPrimary
        ? {
            clickId: opaqueRecord.clickId,
            outboundPartnerUrl: opaqueRecord.outboundPartnerUrl,
            recommendedOperatorId: "op:gosno",
            recommendedOperatorName:
              "GoSno Mountain Transport (Multi-Vehicle Group Inquiry)",
            vehicleSuggestion:
              outcome.privateGroupInquiryOption.vehicleSuggestion,
            confirmationPolicy:
              outcome.privateGroupInquiryOption.confirmationPolicy,
          }
        : (() => {
            const groupOpaque = issueOpaqueClickAttribution({
              decisionReceiptId: outcome.decisionReceiptId,
              recommendedOperatorId: "op:gosno",
              recommendedOperatorName:
                "GoSno Mountain Transport (Multi-Vehicle Group Inquiry)",
              recommendedVehicleClassId: "veh:gosno-multi-vehicle-group",
              evidenceVersion: outcome.evidenceVersion,
              applicabilityModelVersion: outcome.modelVersion,
              applicabilityOutcomeHash: outcome.outcomeHash,
              provider: "direct",
              productCode: "gosno-multi-vehicle-group",
              productDestinationUrl:
                outcome.privateGroupInquiryOption!.inquiryUrl,
            });
            return {
              clickId: groupOpaque.clickId,
              outboundPartnerUrl: groupOpaque.outboundPartnerUrl,
              recommendedOperatorId: "op:gosno",
              recommendedOperatorName:
                "GoSno Mountain Transport (Multi-Vehicle Group Inquiry)",
              vehicleSuggestion:
                outcome.privateGroupInquiryOption!.vehicleSuggestion,
              confirmationPolicy:
                outcome.privateGroupInquiryOption!.confirmationPolicy,
            };
          })()
      : null;

    await syncDurableLedgerWithPostgres({ forcePushLocal: true });

    return NextResponse.json(
      {
        ok: true,
        outcome,
        opaqueAttribution: {
          clickId: opaqueRecord.clickId,
          outboundPartnerUrl: opaqueRecord.outboundPartnerUrl,
          recommendedOperatorId: opaqueRecord.recommendedOperatorId,
          recommendedOperatorName: opaqueRecord.recommendedOperatorName,
        },
        privateGroupInquiryAttribution,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
          "X-DCC-Decision-Receipt-Id": outcome.decisionReceiptId,
          "X-DCC-Click-Id": opaqueRecord.clickId,
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to compile applicable decision context.",
      },
      { status: 400 },
    );
  }
}
