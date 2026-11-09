import { NextRequest, NextResponse } from "next/server";
import {
  queryPortDayExcursionCatalog,
  verifyLiveExcursionAvailability,
  CONNECTED_CRUISE_PORT_COUNT,
  MAPPED_CRUISE_PORT_EXCURSION_PROFILES,
  MAPPED_CRUISE_PORT_BATCH_SUMMARY,
  type PortDayExcursionViewMode,
  type PortDayExcursionCategoryFilter,
} from "@/lib/dcc/cruisePortExcursionCatalogEngine";
import { recordMachineFunnelEvent } from "@/lib/dcc/commerce";
import { enforceEvaluationRequestSizeLimit, MachineSecurityLimitError } from "@/lib/dcc/machine/securityLimits";
import { prepareTourCheckoutFromRequest } from "@/lib/dcc/machine/v03/prepareTourCheckoutRequest";
import {
  getLocalNowInTimeZone,
  resolveApprovedCatalogCheckoutSpec,
} from "@/lib/dcc/catalog/provenToursCatalog";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-DCC-API-Key",
  "Cache-Control": "no-store, max-age=0",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const batchesOnly =
      searchParams.get("batches") === "true" || searchParams.get("batches") === "1";

    if (batchesOnly) {
      return NextResponse.json(
        {
          ok: true,
          generatedAt: new Date().toISOString(),
          totalMappedPorts: MAPPED_CRUISE_PORT_EXCURSION_PROFILES.length,
          totalConnectedDiscoveryPorts: CONNECTED_CRUISE_PORT_COUNT,
          batches: MAPPED_CRUISE_PORT_BATCH_SUMMARY,
          ports: MAPPED_CRUISE_PORT_EXCURSION_PROFILES,
        },
        { headers: CORS_HEADERS }
      );
    }

    const portSlug =
      searchParams.get("port") ||
      searchParams.get("portSlug") ||
      searchParams.get("destination") ||
      "reykjavik";

    const rawViewMode = (
      searchParams.get("viewMode") ||
      searchParams.get("view") ||
      "browse_all"
    )
      .trim()
      .toLowerCase();
    const viewMode: PortDayExcursionViewMode =
      rawViewMode === "shortlist_2h" ||
      rawViewMode === "two_hour_shortlist" ||
      rawViewMode === "estimated_back_2h_plus" ||
      rawViewMode === "2h"
        ? "shortlist_2h"
        : rawViewMode === "fits_sailing" ||
            rawViewMode === "fits_my_sailing" ||
            rawViewMode === "fits"
          ? "fits_sailing"
          : "browse_all";

    const rawCategory = (searchParams.get("category") || "all").toLowerCase();
    const allowedCategories = new Set<PortDayExcursionCategoryFilter>([
      "all",
      "sightseeing",
      "wildlife",
      "food",
      "culture",
      "adventure",
      "family",
    ]);
    const category: PortDayExcursionCategoryFilter = allowedCategories.has(
      rawCategory as PortDayExcursionCategoryFilter
    )
      ? (rawCategory as PortDayExcursionCategoryFilter)
      : "all";

    const shipArrivalTime =
      searchParams.get("shipArrival") ||
      searchParams.get("shipArrivalTime") ||
      undefined;
    const shipAllAboardTime =
      searchParams.get("allAboard") ||
      searchParams.get("shipAllAboardTime") ||
      searchParams.get("allAboardTime") ||
      undefined;
    const shipDepartureTime =
      searchParams.get("shipDeparture") ||
      searchParams.get("shipDepartureTime") ||
      searchParams.get("departureTime") ||
      searchParams.get("departure") ||
      undefined;
    const sailingDate =
      searchParams.get("date") || searchParams.get("sailingDate") || undefined;
    const shipSlug =
      searchParams.get("ship") ||
      searchParams.get("shipSlug") ||
      searchParams.get("shipName") ||
      undefined;
    const sailingId =
      searchParams.get("sailing") ||
      searchParams.get("sailingId") ||
      searchParams.get("plan") ||
      searchParams.get("planCode") ||
      undefined;
    const partySizeRaw =
      searchParams.get("partySize") || searchParams.get("party_size");
    const partySize = partySizeRaw ? Math.max(1, Number(partySizeRaw) || 2) : 2;
    const ship = searchParams.get("ship") || shipSlug || undefined;
    const cruiseSailDate =
      searchParams.get("sailing_date") ||
      searchParams.get("cruiseSailDate") ||
      undefined;

    const dockOrTender =
      searchParams.get("dockOrTender") ||
      searchParams.get("berthType") ||
      searchParams.get("tender") ||
      undefined;
    const datedBerth =
      searchParams.get("datedBerth") ??
      searchParams.get("berth") ??
      undefined;
    const transfers =
      searchParams.get("transfers") ??
      searchParams.get("transferEvidence") ??
      undefined;
    const tenderTravelRaw =
      searchParams.get("tenderTravelMinutes") ?? searchParams.get("tenderMinutes");
    const tenderCutoffRaw = searchParams.get("tenderCutoffMinutes");
    const parseOptionalMinutes = (val: string | null): number | null | undefined => {
      if (val === null) return undefined;
      const trimmed = val.trim().toLowerCase();
      if (!trimmed || trimmed === "missing" || trimmed === "unknown") return -1;
      const n = Number(trimmed);
      return Number.isFinite(n) ? n : -1;
    };
    const tenderTravelMinutes = parseOptionalMinutes(tenderTravelRaw);
    const tenderCutoffMinutes = parseOptionalMinutes(tenderCutoffRaw);

    const limitRaw = searchParams.get("limit");
    const limit = limitRaw ? Math.max(1, Math.min(100, Number(limitRaw) || 12)) : 12;

    const pageRaw = searchParams.get("page");
    const offsetRaw = searchParams.get("offset");
    const offset =
      offsetRaw !== null
        ? Math.max(0, Number(offsetRaw) || 0)
        : pageRaw !== null
          ? Math.max(0, (Math.max(1, Number(pageRaw) || 1) - 1) * limit)
          : 0;

    const rawSortBy = searchParams.get("sortBy") || "recommended";
    const sortBy =
      rawSortBy === "rating_desc" ||
      rawSortBy === "price_asc" ||
      rawSortBy === "duration_asc"
        ? rawSortBy
        : "recommended";

    const search =
      searchParams.get("search") ||
      searchParams.get("q") ||
      searchParams.get("productCode") ||
      undefined;
    const originatingSite =
      searchParams.get("originatingSite") || searchParams.get("site") || undefined;
    const surface = searchParams.get("surface") || undefined;

    const result = await queryPortDayExcursionCatalog({
      portSlug,
      viewMode,
      category,
      shipArrivalTime,
      shipAllAboardTime,
      shipDepartureTime,
      sailingDate,
      shipSlug,
      sailingId,
      partySize,
      ship,
      cruiseSailDate,
      dockOrTender,
      datedBerth,
      transfers,
      tenderTravelMinutes,
      tenderCutoffMinutes,
      limit,
      offset,
      sortBy,
      search,
      originatingSite,
      surface,
    });

    if (!result) {
      return NextResponse.json(
        {
          ok: false,
          error: `Unsupported or unmapped cruise port slug: ${portSlug}`,
          totalConnectedDiscoveryPorts: CONNECTED_CRUISE_PORT_COUNT,
          supportedPorts: MAPPED_CRUISE_PORT_EXCURSION_PROFILES.map((p) => p.portSlug),
        },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    await recordMachineFunnelEvent({
      stage: "search",
      callerClientId: originatingSite || "rest:anonymous",
      originatingSite: originatingSite || "destinationcommandcenter.com",
      portSlug: result.port.portSlug,
      productCode: searchParams.get("productCode") || null,
      intendedDate: sailingDate || null,
      partySize,
      metadata: {
        surface: surface || "/api/v1/cruise/port-day-excursions",
        viewMode,
        timeFitStatus: result.tours[0]?.timeFit?.status ?? null,
        totalCatalogTours: result.pagination.totalMatchedInSql,
        totalFittingSailing: result.pagination.totalFittingSailing,
      },
    }).catch(() => {});

    return NextResponse.json(result, { headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Failed to query port-day shore excursion catalog.",
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch {
      body = {};
    }
    if (body?.action === "prepare_checkout") {
      enforceEvaluationRequestSizeLimit(rawBody);
      const checkout = await prepareTourCheckoutFromRequest(request, body, "dcc_rest_prepare_tour_checkout");
      return NextResponse.json(checkout, {
        status: checkout.ok ? 200 : checkout.errorCode === "DURABLE_HANDOFF_UNAVAILABLE" ? 503 : 409,
        headers: CORS_HEADERS,
      });
    }
    const portSlug = String(body.portSlug || body.port || "reykjavik");
    const tourId = String(body.tourId || "");
    const productCode = body.productCode ? String(body.productCode) : null;
    const optionCode =
      body.optionCode || body.option ? String(body.optionCode || body.option) : null;
    const rawDateInput = body.date || body.sailingDate ? String(body.date || body.sailingDate).trim() : "";
    const approvedSpec = resolveApprovedCatalogCheckoutSpec(productCode || tourId);
    const date =
      !rawDateInput || rawDateInput.toLowerCase() === "today"
        ? approvedSpec
          ? getLocalNowInTimeZone(approvedSpec.portTimezone).dateIso
          : portSlug === "new-orleans" || (productCode && productCode.toUpperCase().startsWith("15200P"))
            ? getLocalNowInTimeZone("America/Chicago").dateIso
            : portSlug === "cozumel"
              ? getLocalNowInTimeZone("America/Cancun").dateIso
              : "2027-07-15"
        : rawDateInput;
    const partySize = Math.max(1, Number(body.partySize) || 2);
    const departureTime =
      body.departureTime || body.selectedDepartureTime
        ? String(body.departureTime || body.selectedDepartureTime)
        : null;
    const autoSelectNextDeparture =
      body.autoSelectNextDeparture === true ||
      body.autoSelectNextDeparture === "true" ||
      (!optionCode && !departureTime);
    const timeoutMs =
      body.timeoutMs !== undefined && Number.isFinite(Number(body.timeoutMs))
        ? Number(body.timeoutMs)
        : undefined;
    const simulateTimeout =
      body.simulateTimeout === true ||
      body.simulateTimeout === "true" ||
      body.providerTimeout === true ||
      body.providerTimeout === "true";
    const originatingSite = body.originatingSite ? String(body.originatingSite) : null;
    const surface = body.surface ? String(body.surface) : null;

    if (!tourId && !productCode) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing required tourId or productCode for live availability check.",
        },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const seatAvailability = await verifyLiveExcursionAvailability({
      portSlug,
      tourId,
      productCode,
      optionCode,
      date,
      partySize,
      departureTime,
      autoSelectNextDeparture,
      timeoutMs,
      simulateTimeout,
      originatingSite,
      surface,
    });

    await recordMachineFunnelEvent({
      stage: "availability_check",
      callerClientId: originatingSite || "rest:anonymous",
      originatingSite: originatingSite || "destinationcommandcenter.com",
      portSlug,
      productCode: productCode || tourId || null,
      optionCode: seatAvailability.selectedOptionCode ?? optionCode,
      intendedDate: date,
      departureTime: seatAvailability.selectedDepartureTime ?? departureTime,
      partySize,
      isQaTraffic: Boolean(body.isQaTraffic || body.isTest || simulateTimeout),
      simulateTimeout,
      metadata: {
        surface: surface || "/api/v1/cruise/port-day-excursions",
        availabilityStatus: seatAvailability.status,
        unitPriceUsd: seatAvailability.fromPriceUsd,
        totalPriceUsd: seatAvailability.totalPriceUsd,
        currency: seatAvailability.currency,
        readOnly: true,
        createsCommercialHandoff: false,
      },
    }).catch(() => {});

    if (seatAvailability.pastDepartureRejected) {
      return NextResponse.json(
        {
          ok: false,
          readOnly: true,
          createsCommercialHandoff: false,
          error: "past_departure_rejected",
          message: seatAvailability.rejectionReason,
          portSlug,
          tourId,
          productCode,
          optionCode: seatAvailability.selectedOptionCode ?? optionCode,
          seatAvailability,
        },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        readOnly: true,
        createsCommercialHandoff: false,
        portSlug,
        tourId,
        productCode,
        optionCode: seatAvailability.selectedOptionCode ?? optionCode,
        date,
        departureTime: seatAvailability.selectedDepartureTime ?? departureTime,
        partySize,
        seatAvailability,
      },
      { headers: CORS_HEADERS }
    );
  } catch (err: any) {
    if (err instanceof MachineSecurityLimitError) {
      return NextResponse.json(
        { ok: false, error: err.code, message: err.message },
        { status: err.statusCode, headers: CORS_HEADERS },
      );
    }
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Failed to verify live excursion availability.",
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
