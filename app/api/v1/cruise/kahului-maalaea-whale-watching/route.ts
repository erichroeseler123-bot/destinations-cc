import { NextRequest, NextResponse } from "next/server";
import {
  KAHULUI_MAALAEA_DEFAULT_SAILING_WINDOW,
  evaluateKahuluiMaalaeaPortDay,
} from "@/lib/dcc/decisionEngines/hawaiiWhaleWatchingEngine";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shipArrivalTime =
    searchParams.get("shipArrival") ||
    KAHULUI_MAALAEA_DEFAULT_SAILING_WINDOW.shipArrivalTime;
  const shipAllAboardTime =
    searchParams.get("allAboard") ||
    KAHULUI_MAALAEA_DEFAULT_SAILING_WINDOW.shipAllAboardTime;
  const shipDepartureTime =
    searchParams.get("shipDeparture") ||
    KAHULUI_MAALAEA_DEFAULT_SAILING_WINDOW.shipDepartureTime;
  const bufferParam = Number(searchParams.get("bufferMinutes") || "");
  const cruiseReturnBufferMinutes =
    Number.isFinite(bufferParam) && bufferParam >= 30
      ? bufferParam
      : KAHULUI_MAALAEA_DEFAULT_SAILING_WINDOW.cruiseReturnBufferMinutes;
  const scenarioFilter = searchParams.get("scenario");

  const result = evaluateKahuluiMaalaeaPortDay({
    shipArrivalTime,
    shipAllAboardTime,
    shipDepartureTime,
    cruiseReturnBufferMinutes,
  });

  const filteredTrips =
    scenarioFilter === "fits" ||
    scenarioFilter === "runs_too_late" ||
    scenarioFilter === "missing_operator_info"
      ? result.trips.filter((t) => t.scenarioRole === scenarioFilter)
      : result.trips;

  return NextResponse.json({
    ok: true,
    ...result,
    trips: filteredTrips,
  });
}
