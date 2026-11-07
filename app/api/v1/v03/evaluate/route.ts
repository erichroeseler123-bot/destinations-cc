import {
  buildMachineJsonResponse,
  checkDistributedRateLimitV03,
  ClientSuppliedKnownAtForbiddenError,
  enforceEvaluationRequestSizeLimit,
  enforceMachineLayerFeatureFlag,
  handleV03EvaluateRequest,
  MachineSecurityLimitError,
  recordSecurityAuditEvent,
  resolveOrGenerateW3cTraceparent,
  UnauthorizedAdminSimulationError,
  verifyEvaluationAuthAndRateLimit,
  type AuthAndRateLimitResult,
} from "@/lib/dcc/machine";
import {
  evaluateDenArrivalTripRecheck,
  evaluateRedRocksRideHomeRecheck,
  evaluateUnifiedJuneauTripRecheck,
  JUNEAU_COORDINATE,
} from "@/lib/dcc/sharedTripRecheck";
import { readCoops } from "@/lib/dcc/extendedCoordinateFeeds";

export const dynamic = "force-dynamic";

const ENGINE_ALIAS_MAP: Record<string, string> = {
  "juneau-port-day": "juneau-helicopter-tours",
  "juneau-port-day-recheck": "juneau-helicopter-tours",
  "den-arrival-recheck": "denver-to-mountain-transportation",
  "red-rocks-ride-home-recheck": "denver-to-mountain-transportation",
};

export async function POST(request: Request) {
  const flagBlocked = enforceMachineLayerFeatureFlag();
  if (flagBlocked) return flagBlocked;

  const traceparent = resolveOrGenerateW3cTraceparent(request);

  let rawBody: string;
  let authResult: AuthAndRateLimitResult;
  try {
    rawBody = await request.text();
    enforceEvaluationRequestSizeLimit(rawBody);
    authResult = verifyEvaluationAuthAndRateLimit(request, "evaluate:single");
  } catch (err) {
    if (err instanceof MachineSecurityLimitError) {
      return buildMachineJsonResponse(
        {
          ok: false,
          error: {
            code: err.code,
            message: err.message,
          },
        },
        {
          status: err.statusCode,
          cacheControl: "no-store",
          extraHeaders: { traceparent },
        },
      );
    }
    return buildMachineJsonResponse(
      {
        ok: false,
        error: {
          code: "INVALID_REQUEST_STREAM",
          message: err instanceof Error ? err.message : "Failed to read request body.",
        },
      },
      { status: 400, cacheControl: "no-store", extraHeaders: { traceparent } },
    );
  }

  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local-client";
  const rateDecision = await checkDistributedRateLimitV03({
    clientKey: clientIp,
    endpoint: "/api/v1/v03/evaluate",
  });
  if (!rateDecision.allowed) {
    return buildMachineJsonResponse(
      {
        ok: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Distributed evaluation rate limit exceeded.",
          coordinationBackend: rateDecision.coordinationBackend,
          resetAtEpochMs: rateDecision.resetAtEpochMs,
        },
      },
      { status: 429, cacheControl: "no-store", extraHeaders: { traceparent } },
    );
  }

  let parsed: Record<string, unknown>;
  try {
    const json = JSON.parse(rawBody);
    if (typeof json !== "object" || json === null || Array.isArray(json)) {
      throw new Error("Request body must be a JSON object.");
    }
    parsed = json as Record<string, unknown>;
  } catch (err) {
    return buildMachineJsonResponse(
      {
        ok: false,
        error: {
          code: "INVALID_JSON_BODY",
          message: err instanceof Error ? err.message : "Invalid JSON request body.",
        },
      },
      { status: 400, cacheControl: "no-store", extraHeaders: { traceparent } },
    );
  }

  const requestedEngineId =
    typeof parsed.engineId === "string"
      ? parsed.engineId
      : typeof parsed.corridorId === "string"
        ? parsed.corridorId
        : "";
  if (!requestedEngineId) {
    return buildMachineJsonResponse(
      {
        ok: false,
        error: {
          code: "MISSING_ENGINE_ID",
          message: "Field 'engineId' is required.",
        },
      },
      { status: 400, cacheControl: "no-store", extraHeaders: { traceparent } },
    );
  }

  const engineId = ENGINE_ALIAS_MAP[requestedEngineId] || requestedEngineId;
  const rawInputs = ((parsed.inputs ?? parsed.constraints ?? parsed.context) ??
    {}) as Record<string, unknown>;
  const normalizedParsed = {
    ...parsed,
    engineId,
    inputs: parsed.inputs ?? rawInputs,
  };

  const adminToken =
    request.headers.get("x-dcc-admin-simulation-token") ??
    (typeof parsed.adminAuthToken === "string" ? parsed.adminAuthToken : undefined);
  const surfaceClass =
    parsed.mode === "admin_simulation"
      ? "privileged_simulation"
      : "authenticated_evaluation";

  try {
    let evalRes: Awaited<ReturnType<typeof handleV03EvaluateRequest>> | null =
      null;
    try {
      evalRes = await handleV03EvaluateRequest(normalizedParsed, {
        adminToken,
        authenticatedClientId: authResult.clientId,
        traceparent,
      });
    } catch (innerErr) {
      const isRecheckAlias =
        requestedEngineId === "juneau-port-day" ||
        requestedEngineId === "juneau-port-day-recheck" ||
        requestedEngineId === "den-arrival-recheck" ||
        requestedEngineId === "red-rocks-ride-home-recheck";
      if (!isRecheckAlias) {
        throw innerErr;
      }
    }

    let sharedTripRecheck: unknown = null;
    if (
      requestedEngineId === "juneau-helicopter-tours" ||
      requestedEngineId === "juneau-port-day" ||
      requestedEngineId === "juneau-port-day-recheck"
    ) {
      const targetDate =
        typeof rawInputs.date === "string"
          ? rawInputs.date
          : typeof rawInputs.travelDate === "string"
            ? rawInputs.travelDate
            : "2027-07-15";
      const simulateNoaaTimeout = Boolean(rawInputs.simulateNoaaTimeout);
      const liveCoopsResult = await readCoops(JUNEAU_COORDINATE, {
        targetDate,
        coopsTimeZone: "lst_ldt",
        simulateNoaaTimeout,
        timeoutMs: 4500,
      }).catch((err) => ({
        provider: "noaa-coops",
        attribution: "Tides, water levels and coastal stations: NOAA CO-OPS",
        available: false,
        checkedAt: new Date().toISOString(),
        data: null,
        error: err instanceof Error ? err.message : "NOAA CO-OPS timeout",
      }));

      sharedTripRecheck = await evaluateUnifiedJuneauTripRecheck({
        ship:
          typeof rawInputs.ship === "string" ? rawInputs.ship : "Royal Princess",
        date: targetDate,
        arrivalTime:
          typeof rawInputs.arrival === "string"
            ? rawInputs.arrival
            : typeof rawInputs.arrivalTime === "string"
              ? rawInputs.arrivalTime
              : typeof rawInputs.shipArrivalTime === "string"
                ? rawInputs.shipArrivalTime
                : "08:00",
        allAboardTime:
          typeof rawInputs.all_aboard === "string"
            ? rawInputs.all_aboard
            : typeof rawInputs.allAboardTime === "string"
              ? rawInputs.allAboardTime
              : "16:30",
        berth:
          typeof rawInputs.berth === "string"
            ? rawInputs.berth
            : typeof rawInputs.arrivalDock === "string"
              ? rawInputs.arrivalDock
              : "FKL",
        returnBufferMinutes:
          typeof rawInputs.returnBufferMinutes === "number"
            ? rawInputs.returnBufferMinutes
            : undefined,
        partySize:
          typeof rawInputs.partySize === "number"
            ? rawInputs.partySize
            : typeof rawInputs.party_size === "number"
              ? rawInputs.party_size
              : 2,
        flightCanceled: Boolean(
          rawInputs.flightCanceled ?? rawInputs.flight_canceled,
        ),
        operatorConfirmedTideLimitFt:
          typeof rawInputs.operatorConfirmedTideLimitFt === "number"
            ? rawInputs.operatorConfirmedTideLimitFt
            : null,
        simulateNoaaTimeout,
        liveCoopsResult,
      });
    } else if (
      requestedEngineId === "den-arrival-recheck" ||
      (requestedEngineId === "denver-to-mountain-transportation" &&
        rawInputs.recheckMode !== "red_rocks_ride_home")
    ) {
      sharedTripRecheck = evaluateDenArrivalTripRecheck({
        date: typeof rawInputs.date === "string" ? rawInputs.date : "2026-12-19",
        flightNumber:
          typeof rawInputs.flightNumber === "string"
            ? rawInputs.flightNumber
            : null,
        scheduledEtaLocal:
          typeof rawInputs.scheduledEtaLocal === "string"
            ? rawInputs.scheduledEtaLocal
            : "13:30",
        revisedEtaLocal:
          typeof rawInputs.revisedEtaLocal === "string"
            ? rawInputs.revisedEtaLocal
            : "14:45",
        destination:
          typeof rawInputs.destination === "string"
            ? rawInputs.destination
            : "Vail",
        partySize:
          typeof rawInputs.partySize === "number"
            ? rawInputs.partySize
            : typeof rawInputs.passengerCount === "number"
              ? rawInputs.passengerCount
              : 4,
        skiBags:
          typeof rawInputs.skiBags === "number"
            ? rawInputs.skiBags
            : typeof rawInputs.luggageSkiBagCount === "number"
              ? rawInputs.luggageSkiBagCount
              : 2,
      });
    } else if (
      requestedEngineId === "red-rocks-ride-home-recheck" ||
      rawInputs.recheckMode === "red_rocks_ride_home"
    ) {
      sharedTripRecheck = evaluateRedRocksRideHomeRecheck({
        date: typeof rawInputs.date === "string" ? rawInputs.date : "2026-07-18",
        eventName:
          typeof rawInputs.eventName === "string"
            ? rawInputs.eventName
            : "Red Rocks Headline Concert",
        encoreCutoffLocal:
          typeof rawInputs.encoreCutoffLocal === "string"
            ? rawInputs.encoreCutoffLocal
            : "23:15",
        partySize:
          typeof rawInputs.partySize === "number" ? rawInputs.partySize : 4,
      });
    }

    return buildMachineJsonResponse(
      {
        ok: true,
        protocolVersion: "0.3.0",
        client_id: authResult.clientId,
        evaluationRunId: evalRes?.evaluationRunId ?? "recheck-direct",
        cacheStatus: evalRes?.cacheStatus ?? "computed",
        receiptId: evalRes?.receiptId ?? null,
        traceparent,
        sharedTripRecheck,
        evaluation: evalRes,
      },
      {
        status: 200,
        etag: evalRes?.resultHash ? `"sha256-${evalRes.resultHash}"` : undefined,
        cacheControl: "no-store",
        extraHeaders: {
          traceparent,
          "X-DCC-Protocol-Version": "0.3.0",
          "X-DCC-Surface-Class": surfaceClass,
          "X-DCC-Client-Id": authResult.clientId,
          "X-DCC-Cache-Status": evalRes?.cacheStatus ?? "computed",
          "X-DCC-RateLimit-Backend": rateDecision.coordinationBackend,
          "X-DCC-RateLimit-Remaining": String(rateDecision.remaining),
          "X-DCC-Engine-Id": evalRes?.engineId ?? engineId,
          "X-DCC-Engine-Version": evalRes?.engineVersion ?? "0.3.0",
          "X-DCC-Receipt-Id": evalRes?.receiptId ?? "recheck-receipt",
          "X-DCC-Evaluation-Run-Id": evalRes?.evaluationRunId ?? "recheck-direct",
          "X-DCC-Evaluation-Fingerprint":
            evalRes?.evaluationFingerprint ?? "recheck-fp",
          "X-DCC-Knowledge-Cutoff": evalRes?.knowledgeCutoff ?? "2026-11-07",
          "X-DCC-Decision-State": evalRes?.decisionState ?? "evaluated",
        },
      },
    );
  } catch (err) {
    if (err instanceof ClientSuppliedKnownAtForbiddenError) {
      recordSecurityAuditEvent({
        eventCategory: "client_known_at_rejected",
        severity: "warn",
        actorOrIp: clientIp,
        endpointOrTarget: "/api/v1/v03/evaluate",
        reasonCode: err.code,
        details: { engineId, message: err.message },
      });
      return buildMachineJsonResponse(
        {
          ok: false,
          error: {
            code: err.code,
            message: err.message,
          },
        },
        { status: 400, cacheControl: "no-store" },
      );
    }
    if (err instanceof UnauthorizedAdminSimulationError) {
      recordSecurityAuditEvent({
        eventCategory: "unauthorized_api_scope",
        severity: "high",
        actorOrIp: clientIp,
        endpointOrTarget: "/api/v1/v03/evaluate",
        reasonCode: err.code,
        details: { engineId },
      });
      return buildMachineJsonResponse(
        {
          ok: false,
          error: {
            code: err.code,
            message: err.message,
          },
        },
        { status: 403, cacheControl: "no-store" },
      );
    }
    return buildMachineJsonResponse(
      {
        ok: false,
        error: {
          code: "EVALUATION_FAILED",
          message: err instanceof Error ? err.message : "v0.3 evaluation failed.",
        },
      },
      { status: 404, cacheControl: "no-store" },
    );
  }
}
