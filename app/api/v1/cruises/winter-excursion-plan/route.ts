import { NextRequest, NextResponse } from "next/server";
import {
  evaluateWinterSailingPlan,
  runWinterAttributionReplayAndNolaStatusTrace,
  WINTER_EXCURSION_PORT_SLUGS,
  type WinterExcursionPortSlug,
} from "@/lib/dcc/winterExcursionPlanner";
import {
  authenticateCommerceAdminRequest,
  getFunnelMetricsReport,
  recordPlanOpenEvent,
} from "@/lib/dcc/commerce/opaqueAttributionLedger";
import { verifyEarthOSAuthorization } from "@/lib/dcc/auth";
import { syncDurableLedgerWithPostgres } from "@/lib/dcc/storage/durableTransactionalStore";

export const dynamic = "force-dynamic";

function isValidWinterPortSlug(val: string): val is WinterExcursionPortSlug {
  return (WINTER_EXCURSION_PORT_SLUGS as readonly string[]).includes(val);
}

function isAuthorizedAdminOrQa(req: NextRequest): boolean {
  try {
    const auth = authenticateCommerceAdminRequest(req);
    if (auth.authorized) return true;
  } catch {
    // ignore
  }
  return verifyEarthOSAuthorization(req);
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
    .filter(isValidWinterPortSlug);

  const savedPortOverrides: Partial<Record<WinterExcursionPortSlug, string | null>> = {};
  for (const portSlug of WINTER_EXCURSION_PORT_SLUGS) {
    const paramVal = searchParams.get(`tour_${portSlug}`);
    if (paramVal !== null) {
      savedPortOverrides[portSlug] = paramVal.trim() === "none" ? null : paramVal.trim();
    }
  }

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
    recordOpen,
    visitorId: searchParams.get("visitorId"),
    isTest,
  });

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
      if (!isAuthorizedAdminOrQa(req)) {
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
    const savedPortOverrides =
      body.savedPortOverrides && typeof body.savedPortOverrides === "object"
        ? (body.savedPortOverrides as Partial<Record<WinterExcursionPortSlug, string | null>>)
        : undefined;
    const missingAllAboardPorts = Array.isArray(body.missingAllAboardPorts)
      ? body.missingAllAboardPorts
          .map((s) => String(s).trim().toLowerCase())
          .filter(isValidWinterPortSlug)
      : undefined;

    const evaluated = await evaluateWinterSailingPlan({
      planCode,
      shipName,
      sailDate,
      adults,
      surface,
      enableShortlistLiveCheck,
      savedPortOverrides,
      missingAllAboardPorts,
      recordOpen: body.recordOpen === true,
      visitorId: typeof body.visitorId === "string" ? body.visitorId : null,
      isTest: body.isTest !== false,
    });
    await syncDurableLedgerWithPostgres();
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
