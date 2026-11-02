import { NextResponse } from "next/server";
import type { CommercialProvider } from "@/lib/dcc/commerce";
import {
  getOpaqueClickAttributionById,
  issueOpaqueClickAttribution,
  reconcilePartnerCsvBatchByClickId,
  reconcilePartnerWebhookByClickId,
} from "@/lib/dcc/commerce/opaqueAttributionLedger";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const clickId =
    url.searchParams.get("click_id")?.trim() ||
    url.searchParams.get("clickId")?.trim() ||
    "";

  if (!clickId) {
    return NextResponse.json(
      {
        ok: false,
        error: "click_id query parameter is required.",
      },
      { status: 400 },
    );
  }

  const record = getOpaqueClickAttributionById(clickId);
  if (!record) {
    return NextResponse.json(
      {
        ok: false,
        error: `No opaque attribution record found for click_id '${clickId}'.`,
      },
      { status: 404 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      click_id: record.clickId,
      record,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const action =
      typeof body.action === "string" ? body.action.trim() : "issue_click";
    const provider = ((typeof body.provider === "string"
      ? body.provider
      : typeof body.partnerNetwork === "string"
        ? body.partnerNetwork
        : "direct") as CommercialProvider);

    if (action === "reconcile_webhook") {
      const result = reconcilePartnerWebhookByClickId({
        clickId: String(body.clickId ?? body.click_id ?? ""),
        trackingParamValue:
          typeof body.trackingParamValue === "string"
            ? body.trackingParamValue
            : null,
        provider,
        providerBookingRef: String(
          body.providerBookingRef ??
            body.partnerBookingRef ??
            body.partner_booking_ref ??
            "",
        ),
        eventType:
          (body.eventType as
            | "BOOKING_CONFIRMED"
            | "BOOKING_CANCELLED"
            | "BOOKING_REFUNDED"
            | "BOOKING_FULFILLED") ?? "BOOKING_CONFIRMED",
        grossRevenueUsd:
          typeof body.grossRevenueUsd === "number"
            ? body.grossRevenueUsd
            : typeof body.grossBookingAmountUsd === "number"
              ? body.grossBookingAmountUsd
              : null,
        estimatedCommissionUsd:
          typeof body.estimatedCommissionUsd === "number"
            ? body.estimatedCommissionUsd
            : typeof body.commissionAmountUsd === "number"
              ? body.commissionAmountUsd
              : null,
        paidCommissionUsd:
          typeof body.paidCommissionUsd === "number"
            ? body.paidCommissionUsd
            : null,
        currency: typeof body.currency === "string" ? body.currency : "USD",
        occurredAt:
          typeof body.occurredAt === "string" ? body.occurredAt : null,
      });

      return NextResponse.json(
        {
          ok: true,
          reconciliation: result,
        },
        { status: 200, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (action === "reconcile_csv") {
      const csvText = String(body.csvText ?? body.csv ?? "");
      const summary = reconcilePartnerCsvBatchByClickId({
        provider,
        csvText,
      });
      return NextResponse.json(
        {
          ok: true,
          ...summary,
        },
        { status: 200, headers: { "Cache-Control": "no-store" } },
      );
    }

    // Default: issue_click
    const productDestinationUrl = String(
      body.productDestinationUrl ?? body.destinationUrl ?? body.outboundUrl ?? "",
    ).trim();
    if (!productDestinationUrl) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "productDestinationUrl (or destinationUrl) is required to issue an opaque click_id.",
        },
        { status: 400 },
      );
    }

    const decisionReceiptId =
      typeof body.decisionReceiptId === "string" && body.decisionReceiptId.trim()
        ? body.decisionReceiptId.trim()
        : typeof body.receiptId === "string" && body.receiptId.trim()
          ? body.receiptId.trim()
          : `rcpt:sha256:${"0".repeat(64)}`;

    const record = issueOpaqueClickAttribution({
      decisionReceiptId,
      recommendedOperatorId: String(
        body.recommendedOperatorId ?? body.operatorId ?? "operator:unknown",
      ),
      recommendedOperatorName:
        typeof body.recommendedOperatorName === "string"
          ? body.recommendedOperatorName
          : null,
      recommendedVehicleClassId:
        typeof body.recommendedVehicleClassId === "string"
          ? body.recommendedVehicleClassId
          : typeof body.selectedVehicleClassId === "string"
            ? body.selectedVehicleClassId
            : null,
      evidenceVersion: String(
        body.evidenceVersion ?? "dcc-evidence-stewardship/2026.11",
      ),
      applicabilityModelVersion:
        typeof body.applicabilityModelVersion === "string"
          ? body.applicabilityModelVersion
          : null,
      applicabilityOutcomeHash:
        typeof body.applicabilityOutcomeHash === "string"
          ? body.applicabilityOutcomeHash
          : null,
      provider,
      productCode: String(
        body.productCode ?? body.recommendedOperatorId ?? "dcc-product",
      ),
      productDestinationUrl,
    });

    return NextResponse.json(
      {
        ok: true,
        click_id: record.clickId,
        outboundPartnerUrl: record.outboundPartnerUrl,
        record,
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store",
          "X-DCC-Click-Id": record.clickId,
        },
      },
    );
  } catch (error) {
    const statusCode =
      error &&
      typeof error === "object" &&
      "statusCode" in error &&
      typeof (error as { statusCode?: unknown }).statusCode === "number"
        ? ((error as { statusCode: number }).statusCode)
        : 400;
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to process click attribution request.",
      },
      { status: statusCode },
    );
  }
}
