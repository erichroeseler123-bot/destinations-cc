import { NextResponse } from "next/server";
import {
  compileApplicableDecisionContext,
  getVersionedApplicabilityContextModel,
  type CorridorId,
  type TripApplicabilityRequest,
} from "@/lib/dcc/applicability";
import { issueOpaqueClickAttribution } from "@/lib/dcc/commerce/opaqueAttributionLedger";

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
  const model = getVersionedApplicabilityContextModel();
  return NextResponse.json(
    {
      ok: true,
      modelVersion: model.modelVersion,
      compilerVersion: model.compilerVersion,
      modelHash: model.modelHash,
      segmentsCount: model.segments.length,
      vehicleClassesCount: model.vehicleClasses.length,
      regulationsCount: model.regulations.length,
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
    const body = (await request.json()) as Partial<TripApplicabilityRequest> & {
      partnerDestinationUrl?: string;
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
    };

    const outcome = compileApplicableDecisionContext(applicabilityRequest);

    const basePartnerUrl =
      body.partnerDestinationUrl?.trim() ||
      DEFAULT_PARTNER_URLS[corridorId] ||
      "https://gosno.co/vail?origin=DEN&destination=Vail";

    const opaqueRecord = issueOpaqueClickAttribution({
      decisionReceiptId: outcome.decisionReceiptId,
      recommendedOperatorId:
        outcome.recommendedOperatorId || `operator:${corridorId}`,
      recommendedOperatorName: outcome.recommendedOperatorName,
      recommendedVehicleClassId: outcome.recommendedVehicleClassId,
      evidenceVersion: outcome.evidenceVersion,
      applicabilityModelVersion: outcome.modelVersion,
      applicabilityOutcomeHash: outcome.outcomeHash,
      provider: body.partnerNetwork ?? "direct",
      productCode: outcome.recommendedVehicleClassId || corridorId,
      productDestinationUrl: basePartnerUrl,
    });

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
