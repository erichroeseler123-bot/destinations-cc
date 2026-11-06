import { NextResponse } from "next/server";
import type { CommercialProvider } from "@/lib/dcc/commerce";
import {
  authenticateCommerceAdminRequest,
  authenticatePartnerWebhookOrAdminRequest,
  getFunnelMetricsReport,
  getOpaqueClickAttributionById,
  issueOpaqueClickAttribution,
  listReconciledOutcomesForClickId,
  reconcilePartnerCsvBatchByClickId,
  reconcilePartnerWebhookByClickId,
  recordFunnelVisitorSession,
  type HandoffTripDetails,
} from "@/lib/dcc/commerce/opaqueAttributionLedger";
import { syncDurableLedgerWithPostgres } from "@/lib/dcc/storage/durableTransactionalStore";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  let auth: { authorized: true; actor: string };
  try {
    auth = authenticateCommerceAdminRequest(request);
  } catch (error) {
    const statusCode =
      error &&
      typeof error === "object" &&
      "statusCode" in error &&
      typeof (error as { statusCode?: unknown }).statusCode === "number"
        ? (error as { statusCode: number }).statusCode
        : 401;
    const code =
      error &&
      typeof error === "object" &&
      "code" in error &&
      typeof (error as { code?: unknown }).code === "string"
        ? (error as { code: string }).code
        : "COMMERCE_AUTH_REQUIRED";
    return NextResponse.json(
      {
        ok: false,
        code,
        error:
          error instanceof Error
            ? error.message
            : "Unauthorized attribution lookup.",
      },
      { status: statusCode, headers: { "Cache-Control": "no-store" } },
    );
  }

  const url = new URL(request.url);
  const summaryMode =
    url.searchParams.get("summary")?.trim().toLowerCase() ||
    url.searchParams.get("report")?.trim().toLowerCase() ||
    "";

  if (summaryMode === "funnel") {
    await syncDurableLedgerWithPostgres();
    const funnel = getFunnelMetricsReport({
      routeId: url.searchParams.get("routeId") || url.searchParams.get("route_id"),
      originatingPage:
        url.searchParams.get("originatingPage") ||
        url.searchParams.get("sourcePage"),
      placementId:
        url.searchParams.get("placementId") ||
        url.searchParams.get("placement_id") ||
        url.searchParams.get("placement"),
      propertySlug:
        url.searchParams.get("propertySlug") ||
        url.searchParams.get("property"),
    });
    return NextResponse.json(
      {
        ok: true,
        authenticatedActorId: auth.actor,
        funnel,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

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

  await syncDurableLedgerWithPostgres();
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

  const reconciledOutcomes = listReconciledOutcomesForClickId(record.clickId);

  return NextResponse.json(
    {
      ok: true,
      authenticatedActorId: auth.actor,
      click_id: record.clickId,
      record,
      reconciledOutcomes,
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
    const rawBody = await request.text();
    const body = (rawBody ? JSON.parse(rawBody) : {}) as Record<string, unknown>;
    const action =
      typeof body.action === "string" ? body.action.trim() : "issue_click";
    const provider = ((typeof body.provider === "string"
      ? body.provider
      : typeof body.partnerNetwork === "string"
        ? body.partnerNetwork
        : "direct") as CommercialProvider);

    if (action === "record_visitor") {
      await syncDurableLedgerWithPostgres();
      const visitor = recordFunnelVisitorSession({
        visitorId:
          typeof body.visitorId === "string"
            ? body.visitorId
            : typeof body.visitor_id === "string"
              ? body.visitor_id
              : null,
        sourcePage:
          typeof body.sourcePage === "string"
            ? body.sourcePage
            : typeof body.originatingPage === "string"
              ? body.originatingPage
              : "/transportation/colorado",
        placementId:
          typeof body.placementId === "string"
            ? body.placementId
            : typeof body.placement_id === "string"
              ? body.placement_id
              : null,
        propertySlug:
          typeof body.propertySlug === "string"
            ? body.propertySlug
            : typeof body.property === "string"
              ? body.property
              : null,
        surface: typeof body.surface === "string" ? body.surface : null,
        isTest: typeof body.isTest === "boolean" ? body.isTest : false,
      });
      await syncDurableLedgerWithPostgres({ forcePushLocal: true });
      return NextResponse.json(
        {
          ok: true,
          visitor,
        },
        { status: 201, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (action === "reconcile_webhook") {
      authenticatePartnerWebhookOrAdminRequest(request, rawBody);
      await syncDurableLedgerWithPostgres();

      const fhBooking =
        body.booking && typeof body.booking === "object"
          ? (body.booking as Record<string, unknown>)
          : null;
      const rawRefs = Array.isArray(body.online_booking_references)
        ? body.online_booking_references
        : Array.isArray(body.onlineBookingReferences)
          ? body.onlineBookingReferences
          : Array.isArray(fhBooking?.online_booking_references)
            ? (fhBooking?.online_booking_references as unknown[])
            : [];
      const onlineBookingReferences = rawRefs
        .filter((r): r is string => typeof r === "string" && r.trim().length > 0)
        .map((r) => r.trim());
      if (
        typeof fhBooking?.external_id === "string" &&
        fhBooking.external_id.trim() &&
        !onlineBookingReferences.includes(fhBooking.external_id.trim())
      ) {
        onlineBookingReferences.push(fhBooking.external_id.trim());
      }

      const fhReceiptSubtotalUsd =
        typeof fhBooking?.receipt_subtotal === "number" &&
        Number.isFinite(fhBooking.receipt_subtotal)
          ? Number((fhBooking.receipt_subtotal / 100).toFixed(2))
          : null;
      const fhReceiptFeesUsd =
        typeof fhBooking?.receipt_taxes === "number" &&
        Number.isFinite(fhBooking.receipt_taxes)
          ? Number((fhBooking.receipt_taxes / 100).toFixed(2))
          : null;
      const fhReceiptTotalUsd =
        typeof fhBooking?.receipt_total === "number" &&
        Number.isFinite(fhBooking.receipt_total)
          ? Number((fhBooking.receipt_total / 100).toFixed(2))
          : null;

      const resolvedProviderBookingRef = String(
        body.providerBookingRef ??
          body.provider_booking_ref ??
          body.partnerBookingRef ??
          body.partner_booking_ref ??
          fhBooking?.display_id ??
          fhBooking?.uuid ??
          (fhBooking?.pk !== undefined ? `FH-${fhBooking.pk}` : ""),
      );

      const fhStatus =
        typeof fhBooking?.status === "string"
          ? fhBooking.status.trim().toLowerCase()
          : "";
      const resolvedEventType:
        | "BOOKING_CONFIRMED"
        | "BOOKING_CANCELLED"
        | "BOOKING_REFUNDED"
        | "BOOKING_FULFILLED" =
        ((body.eventType ?? body.event_type) as
          | "BOOKING_CONFIRMED"
          | "BOOKING_CANCELLED"
          | "BOOKING_REFUNDED"
          | "BOOKING_FULFILLED") ??
        (fhStatus === "cancelled"
          ? "BOOKING_CANCELLED"
          : "BOOKING_CONFIRMED");

      const result = reconcilePartnerWebhookByClickId({
        clickId: String(body.clickId ?? body.click_id ?? ""),
        trackingParamValue:
          typeof body.trackingParamValue === "string"
            ? body.trackingParamValue
            : typeof fhBooking?.external_id === "string"
              ? fhBooking.external_id
              : null,
        onlineBookingReferences,
        provider: fhBooking && provider === "direct" ? "fareharbor" : provider,
        providerBookingRef: resolvedProviderBookingRef,
        eventType: resolvedEventType,
        subtotalRevenueUsd:
          typeof body.subtotalRevenueUsd === "number"
            ? body.subtotalRevenueUsd
            : typeof body.subtotal_revenue_usd === "number"
              ? body.subtotal_revenue_usd
              : fhReceiptSubtotalUsd,
        feesUsd:
          typeof body.feesUsd === "number"
            ? body.feesUsd
            : typeof body.fees_usd === "number"
              ? body.fees_usd
              : fhReceiptFeesUsd,
        grossRevenueUsd:
          typeof body.grossRevenueUsd === "number"
            ? body.grossRevenueUsd
            : typeof body.gross_revenue_usd === "number"
              ? body.gross_revenue_usd
              : typeof body.grossBookingAmountUsd === "number"
                ? body.grossBookingAmountUsd
                : fhReceiptTotalUsd,
        estimatedCommissionUsd:
          typeof body.estimatedCommissionUsd === "number"
            ? body.estimatedCommissionUsd
            : typeof body.estimated_commission_usd === "number"
              ? body.estimated_commission_usd
              : typeof body.commissionAmountUsd === "number"
                ? body.commissionAmountUsd
                : null,
        paidCommissionUsd:
          typeof body.paidCommissionUsd === "number"
            ? body.paidCommissionUsd
            : typeof body.paid_commission_usd === "number"
              ? body.paid_commission_usd
              : null,
        currency: typeof body.currency === "string" ? body.currency : "USD",
        occurredAt:
          typeof body.occurredAt === "string"
            ? body.occurredAt
            : typeof body.occurred_at === "string"
              ? body.occurred_at
              : null,
        isTest: typeof body.isTest === "boolean" ? body.isTest : undefined,
      });

      await syncDurableLedgerWithPostgres({ forcePushLocal: true });

      return NextResponse.json(
        {
          ok: true,
          ...result,
          duplicateDelivery: result.matched
            ? result.outcome.duplicateDelivery
            : false,
          reconciliation: result,
        },
        { status: 200, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (action === "reconcile_csv") {
      authenticateCommerceAdminRequest(request);
      await syncDurableLedgerWithPostgres();

      const csvText = String(body.csvText ?? body.csv ?? "");
      const summary = reconcilePartnerCsvBatchByClickId({
        provider,
        csvText,
        isTest: typeof body.isTest === "boolean" ? body.isTest : undefined,
      });

      await syncDurableLedgerWithPostgres({ forcePushLocal: true });

      return NextResponse.json(
        {
          ok: true,
          summary,
        },
        { status: 200, headers: { "Cache-Control": "no-store" } },
      );
    }

    authenticateCommerceAdminRequest(request);
    await syncDurableLedgerWithPostgres();

    const targetUrl = String(
      body.productDestinationUrl ??
        body.targetUrl ??
        body.destinationUrl ??
        "",
    ).trim();
    const decisionReceiptId = String(
      body.decisionReceiptId ?? body.receiptId ?? "",
    ).trim();
    const recommendedOperatorId = String(
      body.recommendedOperatorId ?? body.operatorId ?? "",
    ).trim();
    const evidenceVersion = String(
      body.evidenceVersion ?? "dcc-evidence-bundle/2026.11.02",
    ).trim();

    if (!targetUrl || !decisionReceiptId || !recommendedOperatorId) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "productDestinationUrl, decisionReceiptId, and recommendedOperatorId are required to mint an opaque click_id.",
        },
        { status: 400 },
      );
    }

    const record = issueOpaqueClickAttribution({
      clickId: typeof body.clickId === "string" ? body.clickId : null,
      handoffId: typeof body.handoffId === "string" ? body.handoffId : null,
      decisionReceiptId,
      recommendedOperatorId,
      recommendedOperatorName:
        typeof body.recommendedOperatorName === "string"
          ? body.recommendedOperatorName
          : recommendedOperatorId,
      recommendedVehicleClassId:
        typeof body.recommendedVehicleClassId === "string"
          ? body.recommendedVehicleClassId
          : null,
      evidenceVersion,
      applicabilityModelVersion:
        typeof body.applicabilityModelVersion === "string"
          ? body.applicabilityModelVersion
          : null,
      applicabilityOutcomeHash:
        typeof body.applicabilityOutcomeHash === "string"
          ? body.applicabilityOutcomeHash
          : null,
      originatingSite:
        typeof body.originatingSite === "string"
          ? body.originatingSite
          : "destinationcommandcenter.com",
      originatingPage:
        typeof body.originatingPage === "string"
          ? body.originatingPage
          : typeof body.sourcePage === "string"
            ? body.sourcePage
            : null,
      placementId:
        typeof body.placementId === "string"
          ? body.placementId
          : typeof body.placement_id === "string"
            ? body.placement_id
            : null,
      propertySlug:
        typeof body.propertySlug === "string"
          ? body.propertySlug
          : typeof body.property === "string"
            ? body.property
            : null,
      surface: typeof body.surface === "string" ? body.surface : null,
      tripDetails:
        body.tripDetails && typeof body.tripDetails === "object"
          ? (body.tripDetails as HandoffTripDetails)
          : null,
      isTest: typeof body.isTest === "boolean" ? body.isTest : false,
      provider,
      productCode:
        typeof body.productCode === "string"
          ? body.productCode
          : `${recommendedOperatorId}-default`,
      productDestinationUrl: targetUrl,
    });

    await syncDurableLedgerWithPostgres({ forcePushLocal: true });

    return NextResponse.json(
      {
        ok: true,
        click_id: record.clickId,
        outboundPartnerUrl: record.outboundPartnerUrl,
        strippedLeakParams: record.strippedLeakParams,
        strippedPiiParams: record.strippedPiiParams ?? [],
        originatingPage: record.originatingPage,
        placementId: record.placementId ?? null,
        propertySlug: record.propertySlug ?? null,
        surface: record.surface ?? null,
        tripDetails: record.tripDetails ?? null,
        isTest: Boolean(record.isTest),
        trafficClass: record.trafficClass ?? "production",
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
        ? (error as { statusCode: number }).statusCode
        : 400;
    const code =
      error &&
      typeof error === "object" &&
      "code" in error &&
      typeof (error as { code?: unknown }).code === "string"
        ? (error as { code: string }).code
        : "COMMERCE_ATTRIBUTION_ERROR";
    return NextResponse.json(
      {
        ok: false,
        code,
        error:
          error instanceof Error
            ? error.message
            : "Failed to process opaque click attribution request.",
      },
      { status: statusCode, headers: { "Cache-Control": "no-store" } },
    );
  }
}
