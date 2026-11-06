import { NextRequest, NextResponse } from "next/server";
import {
  ALL_WINTER_SAILING_PORT_SLUGS,
  evaluateWinterSailingPlan,
  runWinterAttributionReplayAndNolaStatusTrace,
} from "@/lib/dcc/winterExcursionPlanner";
import {
  authenticateCommerceAdminRequest,
  getFunnelMetricsReport,
  recordPlanOpenEvent,
} from "@/lib/dcc/commerce/opaqueAttributionLedger";
import { verifyEarthOSAuthorization } from "@/lib/dcc/earthos/auth";
import { syncDurableLedgerWithPostgres } from "@/lib/dcc/storage/durableTransactionalStore";

export const dynamic = "force-dynamic";

async function isAuthorizedAdminOrQa(req: NextRequest): Promise<boolean> {
  try {
    const auth = authenticateCommerceAdminRequest(req);
    if (auth.authorized) return true;
  } catch {
    // ignore
  }
  const earthAuth = await verifyEarthOSAuthorization(req);
  return earthAuth.authorized;
}

export function extractSavedPortOverridesFromSearchParams(
  searchParams: URLSearchParams,
): Record<string, string | null> {
  const overrides: Record<string, string | null> = {};

  for (const [key, val] of searchParams.entries()) {
    if (key.startsWith("tour_")) {
      const portSlug = key.slice("tour_".length).trim().toLowerCase();
      if (portSlug) {
        overrides[portSlug] = val.trim() === "none" ? null : val.trim();
      }
    }
  }

  for (const portSlug of ALL_WINTER_SAILING_PORT_SLUGS) {
    const paramVal = searchParams.get(`tour_${portSlug}`);
    if (paramVal !== null) {
      overrides[portSlug] = paramVal.trim() === "none" ? null : paramVal.trim();
    }
  }

  // Also support ?saved=cozumel:5553274P1,nassau:254526P1 or ?addTour=cozumel:5553274P1
  const savedParam = searchParams.get("saved") || searchParams.get("addTour");
  if (savedParam) {
    for (const pair of savedParam.split(",")) {
      const trimmed = pair.trim();
      if (!trimmed) continue;
      const colonIdx = trimmed.indexOf(":");
      if (colonIdx > 0) {
        const p = trimmed.slice(0, colonIdx).trim().toLowerCase();
        const t = trimmed.slice(colonIdx + 1).trim();
        if (p && t) overrides[p] = t;
      } else {
        overrides["__unscoped_tour__"] = trimmed;
      }
    }
  }

  return overrides;
}

export async function GET(req: NextRequest) {
  await syncDurableLedgerWithPostgres();
  const { searchParams } = new URL(req.url);

  const planCode = searchParams.get("plan") || "INDY-2027-01-24";
  const shipName = searchParams.get("ship");
  const sailDate = searchParams.get("sailDate");
  const adultsRaw = Number(searchParams.get("adults") || "2");
  const adults = Number.isFinite(adultsRaw) && adultsRaw >= 1 ? Math.floor(adultsRaw) : 2;
  const surface = searchParams.get("surface") === "dcc" ? "dcc" : "cruisepromenade";
  const enableLiveCheck = searchParams.get("live") !== "0";
  const recordOpen = searchParams.get("recordOpen") === "1";
  const isTest = searchParams.get("isTest") !== "0";

  const missingAllAboardParam = searchParams.get("missingAllAboard") || "";
  const missingAllAboardPorts = missingAllAboardParam
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const missingLastTenderParam = searchParams.get("missingLastTender") || "";
  const missingLastTenderPorts = missingLastTenderParam
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const savedPortOverrides = extractSavedPortOverridesFromSearchParams(searchParams);

  const evaluated = await evaluateWinterSailingPlan({
    planCode,
    shipName,
    sailDate,
    adults,
    surface,
    enableShortlistLiveCheck: enableLiveCheck,
    savedPortOverrides:
      Object.keys(savedPortOverrides).length > 0 ? savedPortOverrides : undefined,
    missingAllAboardPorts,
    missingLastTenderPorts,
    recordOpen,
    visitorId: searchParams.get("visitorId"),
    isTest,
  });

  if (recordOpen) {
    await syncDurableLedgerWithPostgres();
  }

  const funnel = getFunnelMetricsReport({
    placementId: evaluated.plan.placementId,
  });

  return NextResponse.json({
    ...evaluated,
    telemetrySummary: {
      placementId: evaluated.plan.placementId,
      production: {
        planOpens: funnel.production.planOpens,
        outboundClicks: funnel.production.actualOutboundClicks,
        providerConfirmedBookings: funnel.production.confirmedPaidBookings,
        paidCommissionsCount: funnel.production.paidCommissionsCount,
        paidCommissionUsd: funnel.production.settledReconciledCommissionUsd,
        duplicateDeliveriesIgnored: funnel.production.duplicateDeliveriesIgnored,
      },
      test: {
        planOpens: funnel.test.planOpens,
        outboundClicks: funnel.test.actualOutboundClicks,
        providerConfirmedBookings: funnel.test.confirmedPaidBookings,
        paidCommissionsCount: funnel.test.paidCommissionsCount,
        paidCommissionUsd: funnel.test.settledReconciledCommissionUsd,
        duplicateDeliveriesIgnored: funnel.test.duplicateDeliveriesIgnored,
      },
    },
  });
}

export async function POST(req: NextRequest) {
  await syncDurableLedgerWithPostgres();
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const action = typeof body.action === "string" ? body.action : "evaluate_plan";

    if (action === "record_plan_open") {
      const planCode =
        typeof body.planCode === "string" && body.planCode.trim()
          ? body.planCode.trim()
          : "INDY-2027-01-24";
      const surface = body.surface === "dcc" ? "dcc" : "cruisepromenade";
      const isTest = body.isTest === true;
      const recorded = recordPlanOpenEvent({
        visitorId: typeof body.visitorId === "string" ? body.visitorId : null,
        planCode,
        sourcePage:
          typeof body.sourcePage === "string"
            ? body.sourcePage
            : surface === "cruisepromenade"
              ? `/p/${planCode}`
              : `/cruises/winter-excursion-planner?plan=${planCode}`,
        placementId: "fp-cp-winter-excursion-planner",
        propertySlug: "independence-of-the-seas",
        surface,
        isTest,
      });
      await syncDurableLedgerWithPostgres();
      return NextResponse.json({
        ok: true,
        action: "record_plan_open",
        recorded,
      });
    }

    if (action === "qa_replay_test_event") {
      if (!(await isAuthorizedAdminOrQa(req))) {
        return NextResponse.json(
          {
            ok: false,
            error: "unauthorized_qa_test",
            message:
              "Running the winter excursion attribution replay test requires admin/QA authorization.",
          },
          { status: 401 },
        );
      }

      const trace = runWinterAttributionReplayAndNolaStatusTrace();
      await syncDurableLedgerWithPostgres();
      return NextResponse.json(trace);
    }

    const planCode =
      typeof body.planCode === "string" ? body.planCode : "INDY-2027-01-24";
    const shipName = typeof body.shipName === "string" ? body.shipName : null;
    const sailDate = typeof body.sailDate === "string" ? body.sailDate : null;
    const adults = typeof body.adults === "number" ? body.adults : 2;
    const surface = body.surface === "dcc" ? "dcc" : "cruisepromenade";
    const enableShortlistLiveCheck = body.enableShortlistLiveCheck !== false;

    const savedPortOverrides: Record<string, string | null | undefined> =
      body.savedPortOverrides && typeof body.savedPortOverrides === "object"
        ? { ...(body.savedPortOverrides as Record<string, string | null | undefined>) }
        : {};

    // Also support direct { portSlug, tourId } or { addTour } payloads
    if (typeof body.portSlug === "string" && typeof body.tourId === "string") {
      savedPortOverrides[body.portSlug.trim().toLowerCase()] = body.tourId.trim();
    } else if (typeof body.tourId === "string" && body.tourId.trim()) {
      savedPortOverrides["__unscoped_tour__"] = body.tourId.trim();
    }

    const missingAllAboardPorts = Array.isArray(body.missingAllAboardPorts)
      ? body.missingAllAboardPorts.map((s) => String(s).trim().toLowerCase()).filter(Boolean)
      : undefined;

    const missingLastTenderPorts = Array.isArray(body.missingLastTenderPorts)
      ? body.missingLastTenderPorts.map((s) => String(s).trim().toLowerCase()).filter(Boolean)
      : undefined;

    const evaluated = await evaluateWinterSailingPlan({
      planCode,
      shipName,
      sailDate,
      adults,
      surface,
      enableShortlistLiveCheck,
      savedPortOverrides:
        Object.keys(savedPortOverrides).length > 0 ? savedPortOverrides : undefined,
      missingAllAboardPorts,
      missingLastTenderPorts,
      recordOpen: body.recordOpen === true,
      visitorId: typeof body.visitorId === "string" ? body.visitorId : null,
      isTest: body.isTest !== false,
    });

    await syncDurableLedgerWithPostgres();

    if (evaluated.offItineraryBlocked) {
      return NextResponse.json(
        {
          ok: false,
          error: "off_itinerary_tour_rejected",
          message:
            evaluated.rejectedOffItineraryRequests[0]?.reason ||
            "Cannot add an off-itinerary tour or port to this verified sailing plan.",
          planCode: evaluated.plan.planCode,
          sailingPortCallSlugs: evaluated.sailingPortCallSlugs,
          offItineraryBlocked: true,
          rejectedOffItineraryRequests: evaluated.rejectedOffItineraryRequests,
          savedPortsSummary: evaluated.savedPortsSummary,
        },
        { status: 422 },
      );
    }

    return NextResponse.json(evaluated);
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: "winter_excursion_plan_error",
        message: err instanceof Error ? err.message : "Failed to evaluate winter excursion plan.",
      },
      { status: 400 },
    );
  }
}
