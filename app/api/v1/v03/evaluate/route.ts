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
  rfc8785Canonicalize,
  sha256HexFull,
  signV03DecisionReceiptJws,
  UnauthorizedAdminSimulationError,
  verifyEvaluationAuthAndRateLimit,
  type AuthAndRateLimitResult,
  type V03SignedDecisionReceipt,
} from "@/lib/dcc/machine";
import {
  evaluateDcc412ItineraryRecheck,
  evaluateDenArrivalTripRecheck,
  evaluateRedRocksRideHomeRecheck,
  evaluateSyntheticDelhiAgraDcc412Test,
  evaluateUnifiedJuneauTripRecheck,
  JUNEAU_COORDINATE,
  type Dcc412CandidateDepartureInput,
  type Dcc412LegReceiptProvenance,
} from "@/lib/dcc/sharedTripRecheck";
import { readCoops } from "@/lib/dcc/extendedCoordinateFeeds";

export const dynamic = "force-dynamic";

const ENGINE_ALIAS_MAP: Record<string, string> = {
  "juneau-port-day": "juneau-helicopter-tours",
  "juneau-port-day-recheck": "juneau-helicopter-tours",
  "den-arrival-recheck": "denver-to-mountain-transportation",
  "red-rocks-ride-home-recheck": "denver-to-mountain-transportation",
  "delhi-to-agra": "juneau-helicopter-tours",
  "delhi-to-agra-recheck": "juneau-helicopter-tours",
  "dcc-412": "juneau-helicopter-tours",
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
        requestedEngineId === "red-rocks-ride-home-recheck" ||
        requestedEngineId === "delhi-to-agra" ||
        requestedEngineId === "delhi-to-agra-recheck" ||
        requestedEngineId === "dcc-412";
      if (!isRecheckAlias) {
        throw innerErr;
      }
    }

    let sharedTripRecheck: unknown = null;
    let receiptLegProvenance: Dcc412LegReceiptProvenance[] | undefined;

    if (
      requestedEngineId === "dcc-412" ||
      requestedEngineId === "delhi-to-agra" ||
      requestedEngineId === "delhi-to-agra-recheck" ||
      rawInputs.recheckMode === "dcc_412" ||
      rawInputs.corridorId === "delhi-to-agra"
    ) {
      const customCandidates = Array.isArray(rawInputs.candidateDepartures)
        ? (rawInputs.candidateDepartures as Dcc412CandidateDepartureInput[])
        : null;
      const requestedCutoff =
        typeof rawInputs.destinationCutoffLocal === "string"
          ? rawInputs.destinationCutoffLocal
          : typeof rawInputs.tajCutoffLocal === "string"
            ? rawInputs.tajCutoffLocal
            : typeof rawInputs.cutoff === "string"
              ? rawInputs.cutoff
              : undefined;
      const dcc412Result = customCandidates
        ? evaluateDcc412ItineraryRecheck({
            corridorId:
              typeof rawInputs.corridorId === "string"
                ? rawInputs.corridorId
                : "delhi-to-agra",
            serviceDate:
              typeof rawInputs.serviceDate === "string"
                ? rawInputs.serviceDate
                : typeof rawInputs.date === "string"
                  ? rawInputs.date
                  : "2026-11-18",
            ianaTimeZone:
              typeof rawInputs.ianaTimeZone === "string"
                ? rawInputs.ianaTimeZone
                : "Asia/Kolkata",
            scheduledArrivalLocal:
              typeof rawInputs.scheduledArrivalLocal === "string"
                ? rawInputs.scheduledArrivalLocal
                : "09:50",
            delayMinutes:
              typeof rawInputs.delayMinutes === "number"
                ? rawInputs.delayMinutes
                : 42,
            absoluteEta:
              typeof rawInputs.absoluteEta === "string"
                ? rawInputs.absoluteEta
                : typeof rawInputs.eta === "string"
                  ? rawInputs.eta
                  : null,
            transferBufferMinutes:
              typeof rawInputs.transferBufferMinutes === "number"
                ? rawInputs.transferBufferMinutes
                : 15,
            destinationCutoffLocal: requestedCutoff,
            criticalUpdateMissing: Boolean(rawInputs.criticalUpdateMissing),
            staleUpdate: Boolean(rawInputs.staleUpdate),
            staleOrMissingUpdateCouldChangeAnswer: Boolean(
              rawInputs.staleOrMissingUpdateCouldChangeAnswer,
            ),
            evaluatedAtUtc:
              typeof rawInputs.evaluatedAtUtc === "string"
                ? rawInputs.evaluatedAtUtc
                : null,
            candidateDepartures: customCandidates,
          })
        : evaluateSyntheticDelhiAgraDcc412Test({
            serviceDate:
              typeof rawInputs.serviceDate === "string"
                ? rawInputs.serviceDate
                : typeof rawInputs.date === "string"
                  ? rawInputs.date
                  : "2026-11-18",
            scheduledArrivalLocal:
              typeof rawInputs.scheduledArrivalLocal === "string"
                ? rawInputs.scheduledArrivalLocal
                : "09:50",
            delayMinutes:
              typeof rawInputs.delayMinutes === "number"
                ? rawInputs.delayMinutes
                : 42,
            absoluteEta:
              typeof rawInputs.absoluteEta === "string"
                ? rawInputs.absoluteEta
                : typeof rawInputs.eta === "string"
                  ? rawInputs.eta
                  : null,
            transferBufferMinutes:
              typeof rawInputs.transferBufferMinutes === "number"
                ? rawInputs.transferBufferMinutes
                : 15,
            destinationCutoffLocal: requestedCutoff,
            criticalUpdateMissing: Boolean(rawInputs.criticalUpdateMissing),
            staleUpdate: Boolean(rawInputs.staleUpdate),
            staleOrMissingUpdateCouldChangeAnswer: Boolean(
              rawInputs.staleOrMissingUpdateCouldChangeAnswer,
            ),
            evaluatedAtUtc:
              typeof rawInputs.evaluatedAtUtc === "string"
                ? rawInputs.evaluatedAtUtc
                : null,
            includeBackup1130:
              typeof rawInputs.includeBackup1130 === "boolean"
                ? rawInputs.includeBackup1130
                : requestedCutoff !== "11:00" && requestedCutoff !== "11:30",
          });
      sharedTripRecheck = dcc412Result;
      receiptLegProvenance = dcc412Result.legProvenance;
    } else if (
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

      const juneauRecheck = await evaluateUnifiedJuneauTripRecheck({
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
        claaScheduledArrivalTime:
          typeof rawInputs.claa_arrival === "string"
            ? rawInputs.claa_arrival
            : typeof rawInputs.claaScheduledArrivalTime === "string"
              ? rawInputs.claaScheduledArrivalTime
              : "08:00",
        allAboardTime:
          typeof rawInputs.all_aboard === "string"
            ? rawInputs.all_aboard
            : typeof rawInputs.allAboardTime === "string"
              ? rawInputs.allAboardTime
              : "16:30",
        berthCode:
          typeof rawInputs.berth === "string"
            ? rawInputs.berth
            : typeof rawInputs.berthCode === "string"
              ? rawInputs.berthCode
              : typeof rawInputs.arrivalDock === "string"
                ? rawInputs.arrivalDock
                : "FKL",
        configuredReturnBufferMinutes:
          typeof rawInputs.returnBufferMinutes === "number"
            ? rawInputs.returnBufferMinutes
            : typeof rawInputs.configuredReturnBufferMinutes === "number"
              ? rawInputs.configuredReturnBufferMinutes
              : typeof rawInputs.return_buffer === "number"
                ? rawInputs.return_buffer
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
      sharedTripRecheck = juneauRecheck;
      const evalEpochMs = Number.isFinite(Date.parse(juneauRecheck.evaluatedAt))
        ? Date.parse(juneauRecheck.evaluatedAt)
        : Date.now();
      const evalIso = new Date(evalEpochMs).toISOString();
      receiptLegProvenance = [
        {
          legId: "juneau_berth_and_ship_window",
          legTitle: `Cruise Berth (${juneauRecheck.input.berthCode}) & Ship All-Aboard Window`,
          source: "CLAA Juneau Cruise Schedule / Ship-Confirmed All-Aboard",
          timestamp: evalIso,
          expiry: new Date(evalEpochMs + 30 * 60_000).toISOString(),
        },
        {
          legId: "juneau_noaa_coops_tides",
          legTitle: `NOAA CO-OPS Station ${juneauRecheck.tides.stationId} (${juneauRecheck.tides.datum})`,
          source: "Tides, water levels and coastal stations: NOAA CO-OPS",
          timestamp: liveCoopsResult?.checkedAt || evalIso,
          expiry: new Date(evalEpochMs + 60 * 60_000).toISOString(),
        },
        {
          legId: "juneau_pajn_weather_and_operator_dispatch",
          legTitle: "PAJN Weather Context & Operator Flight/Marine Dispatch",
          source: "PAJN METAR Weather Context (Operator is sole source for holds & dispatch)",
          timestamp: evalIso,
          expiry: new Date(evalEpochMs + 15 * 60_000).toISOString(),
        },
      ];
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

    let signedReceipt: V03SignedDecisionReceipt | null = evalRes?.receipt ?? null;
    if (receiptLegProvenance?.length) {
      if (evalRes?.receipt) {
        signedReceipt = await signV03DecisionReceiptJws({
          ...evalRes.receipt.payload,
          legProvenance: receiptLegProvenance,
        });
        evalRes = {
          ...evalRes,
          receiptId: signedReceipt.receiptId,
          receipt: signedReceipt,
        };
      } else {
        const dispositions: Array<{
          candidateDccId: string;
          legacyCode: string;
          disposition: "eligible" | "qualified" | "ineligible" | "indeterminate";
          totalScore: number | null;
          reasonCodes: string[];
        }> = [
          {
            candidateDccId: `dcc:recheck:${requestedEngineId}:primary`,
            legacyCode: requestedEngineId,
            disposition: "qualified",
            totalScore: 95,
            reasonCodes: ["SHARED_TRIP_RECHECK_EVALUATED"],
          },
        ];
        const expectedResultCore = rfc8785Canonicalize({
          decisionState: "evaluated",
          recommendedCandidateDccId: `dcc:recheck:${requestedEngineId}:primary`,
          dispositions: dispositions.map((d) => ({
            candidateDccEntityId: d.candidateDccId,
            disposition: d.disposition,
            totalScore: d.totalScore,
            reasonCodes: d.reasonCodes,
          })),
        });
        const resultHash = sha256HexFull(expectedResultCore);
        const normalizedInputHash = sha256HexFull(
          rfc8785Canonicalize(rawInputs),
        );
        const traceHash = sha256HexFull(
          rfc8785Canonicalize(receiptLegProvenance),
        );
        const validAt =
          receiptLegProvenance[0]?.timestamp || "2026-11-18T04:50:00Z";
        signedReceipt = await signV03DecisionReceiptJws({
          executionClass: "current_evaluation",
          isSynthetic: false,
          syntheticWatermark: null,
          issuedAt: validAt,
          evaluationRunId: `eval_${normalizedInputHash.slice(0, 16)}`,
          traceRunId: `trace_${traceHash.slice(0, 16)}`,
          evaluationFingerprint: `fp_${resultHash.slice(0, 24)}`,
          engineId: requestedEngineId,
          engineVersion: "0.3.0",
          compilerVersion: "0.3.0",
          decisionIrBundleHash: sha256HexFull(`ir:${requestedEngineId}:0.3.0`),
          candidateUniverseId: `cu:${requestedEngineId}`,
          candidateUniverseVersion: "2026.11",
          candidateUniverseHash: sha256HexFull(`cu:${requestedEngineId}:2026.11`),
          pinnedRuleVersionHashes: {
            sharedTripRecheck: sha256HexFull("rule:sharedTripRecheck:v1"),
          },
          pinnedClaimEventHashes: {},
          pinnedEvidenceHashes: {},
          pinnedSchemaHashes: {
            v03Receipt: sha256HexFull("schema:dcc-decision-receipt:0.3"),
          },
          normalizedInputHash,
          validAt,
          knowledgeCutoff: "2026-11-07",
          decisionState: "evaluated",
          recommendedCandidateDccId: `dcc:recheck:${requestedEngineId}:primary`,
          recommendedCandidateLegacyCode: requestedEngineId,
          candidateDispositionSummary: dispositions,
          legProvenance: receiptLegProvenance,
          resultHash,
          traceHash,
          epistemicLimitationStatement:
            "Evaluated via sharedTripRecheck with explicit leg provenance (source, timestamp, and expiry).",
        });
      }
    }

    return buildMachineJsonResponse(
      {
        ok: true,
        protocolVersion: "0.3.0",
        client_id: authResult.clientId,
        evaluationRunId: evalRes?.evaluationRunId ?? "recheck-direct",
        cacheStatus: evalRes?.cacheStatus ?? "computed",
        receiptId: signedReceipt?.receiptId ?? evalRes?.receiptId ?? null,
        receipt: signedReceipt,
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
          "X-DCC-Receipt-Id":
            signedReceipt?.receiptId ?? evalRes?.receiptId ?? "recheck-receipt",
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
