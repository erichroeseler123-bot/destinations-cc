import { NextRequest, NextResponse } from "next/server";
import { OctoRegistryService } from "@/lib/octo/registry";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role") || undefined;

  const summary = await OctoRegistryService.getSummary(role);
  const directProductionSalesDisabled = summary.liveAuthorizedOperatorCount === 0;

  return NextResponse.json(
    {
      spec: "octo-participant-registry",
      version: "1.1",
      directProductionSalesDisabled,
      totalParticipants: summary.participants.length,
      authorizedOperatorCount: summary.liveAuthorizedOperatorCount,
      liveAuthorizedOperatorCount: summary.liveAuthorizedOperatorCount,
      liveAuthorizedParticipantCount: summary.liveAuthorizedOperatorCount,
      agreedCommissionsCount: summary.agreedCommissionsCount,
      commercialTermsPolicy: {
        bookingSystemCommercialArrangements: "unknown",
        unsignedOperatorTerms: "unknown",
        note:
          "Commercial terms with reservation software vendors, channel managers, and unsigned operator candidates are unknown unless backed by a documented agreementReference.",
      },
      fareharborPolicy:
        "FareHarbor uses its proprietary External API v1 and Lightframe embeds (not OCTO). FareHarbor affiliate or partner access alone never marks an operator as OCTO-authorized.",
      unknownsRepresentationPolicy:
        "Unverified API endpoints, access credentials, product inventory counts, certifications, and unsigned commercial terms are represented as unknown or null.",
      governanceModel:
        "Direct operator authority; neutral open connectivity; commercial terms never affect traveler suitability ranking",
      participants: summary.participants,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}
