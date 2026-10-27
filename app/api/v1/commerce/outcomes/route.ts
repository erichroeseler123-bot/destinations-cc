import {
  buildMachineJsonResponse,
  enforceEvaluationRequestSizeLimit,
  MachineSecurityLimitError,
  resolveOrGenerateW3cTraceparent,
  verifyEvaluationAuthAndRateLimit,
} from "@/lib/dcc/machine";
import {
  getPollerCheckpoint,
  listCommercialOutcomes,
  pollViatorModifiedSinceWithCheckpoint,
  recordCommercialOutcome,
  reportGetYourGuideOutcomeAdapter,
  type CommercialProvider,
} from "@/lib/dcc/commerce";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const traceparent = resolveOrGenerateW3cTraceparent(request);
  const url = new URL(request.url);
  const handoffId =
    url.searchParams.get("handoffId")?.trim() ||
    url.searchParams.get("handoff_id")?.trim() ||
    undefined;
  const receiptId = url.searchParams.get("receiptId")?.trim() || undefined;
  const provider =
    (url.searchParams.get("provider")?.trim() as CommercialProvider | undefined) ||
    undefined;
  const pollerId =
    url.searchParams.get("pollerId")?.trim() || "viator_modified_since_primary";

  const outcomes = await listCommercialOutcomes({
    handoffId,
    receiptId,
    provider,
  });
  const checkpoint = await getPollerCheckpoint(pollerId);

  return buildMachineJsonResponse(
    {
      ok: true,
      outcomesCount: outcomes.length,
      outcomes,
      pollerCheckpoint: checkpoint,
      missingOutcomePolicy: "missing_outcome_is_unreported_never_classified_as_failed_booking",
      traceparent,
    },
    {
      status: 200,
      cacheControl: "no-store",
      extraHeaders: {
        traceparent,
        "X-DCC-Surface-Class": "commercial_outcome_lookup",
      },
    },
  );
}

export async function POST(request: Request) {
  const traceparent = resolveOrGenerateW3cTraceparent(request);

  let rawBody: string;
  let reporterClientId: string;
  try {
    rawBody = await request.text();
    enforceEvaluationRequestSizeLimit(rawBody);
    const auth = verifyEvaluationAuthAndRateLimit({
      headers: request.headers,
      requiredScope: "dcc:commerce:report_outcome",
      requireExplicitApiKey: true,
    });
    // Strictly derive calling integration's identity from validated credentials, never request body
    reporterClientId = auth.clientId;
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
        { status: err.statusCode, cacheControl: "no-store", extraHeaders: { traceparent } },
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

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return buildMachineJsonResponse(
      {
        ok: false,
        error: {
          code: "INVALID_JSON_BODY",
          message: "Request body must be valid JSON.",
        },
      },
      { status: 400, cacheControl: "no-store", extraHeaders: { traceparent } },
    );
  }

  if (body.mode === "poll_viator_modified_since") {
    try {
      const pollerRun = await pollViatorModifiedSinceWithCheckpoint({
        pollerId:
          typeof body.pollerId === "string"
            ? body.pollerId
            : "viator_modified_since_primary",
        overrideCursor:
          typeof body.cursor === "string" ? body.cursor : undefined,
      });
      return buildMachineJsonResponse(
        {
          ok: true,
          client_id: reporterClientId,
          pollerRun,
          traceparent,
        },
        {
          status: 200,
          cacheControl: "no-store",
          extraHeaders: {
            traceparent,
            "X-DCC-Surface-Class": "commercial_outcome_poller",
            "X-DCC-Client-Id": reporterClientId,
          },
        },
      );
    } catch (err) {
      return buildMachineJsonResponse(
        {
          ok: false,
          client_id: reporterClientId,
          error: {
            code: "VIATOR_MODIFIED_SINCE_POLL_FAILED",
            message: err instanceof Error ? err.message : "Viator reporting poll failed.",
          },
          traceparent,
        },
        { status: 502, cacheControl: "no-store", extraHeaders: { traceparent } },
      );
    }
  }

  const provider = String(body.provider ?? "viator").trim().toLowerCase() as CommercialProvider;
  const providerBookingRef = String(
    body.providerBookingRef ?? body.bookingRef ?? body.gygBookingReference ?? "",
  ).trim();

  if (!providerBookingRef) {
    return buildMachineJsonResponse(
      {
        ok: false,
        error: {
          code: "MISSING_PROVIDER_BOOKING_REF",
          message: "Field 'providerBookingRef' is required.",
        },
      },
      { status: 400, cacheControl: "no-store", extraHeaders: { traceparent } },
    );
  }

  if (provider === "getyourguide" && body.adapter === "getyourguide_partner_adapter") {
    const gygOutcome = await reportGetYourGuideOutcomeAdapter({
      reporterClientId,
      gygBookingReference: providerBookingRef,
      eventType: String(body.eventType ?? "BOOKING_CONFIRMED"),
      providerEventTime:
        typeof body.providerEventTime === "string" ? body.providerEventTime : null,
      cmpParameterValue:
        typeof body.cmpParameterValue === "string"
          ? body.cmpParameterValue
          : typeof body.campaignOrRefValue === "string"
            ? body.campaignOrRefValue
            : null,
      handoffId: typeof body.handoffId === "string" ? body.handoffId : null,
      bookedTourCode:
        typeof body.bookedProductCode === "string" ? body.bookedProductCode : null,
      bookedDate: typeof body.bookedDate === "string" ? body.bookedDate : null,
      bookedParticipants:
        typeof body.bookedPartySize === "number" ? body.bookedPartySize : null,
      bookingValueAmount:
        typeof body.bookingValueAmount === "number" ? body.bookingValueAmount : null,
      bookingValueCurrency:
        typeof body.bookingValueCurrency === "string" ? body.bookingValueCurrency : null,
      estimatedCommissionAmount:
        typeof body.estimatedCommissionAmount === "number"
          ? body.estimatedCommissionAmount
          : null,
      paidCommissionAmount:
        typeof body.paidCommissionAmount === "number" ? body.paidCommissionAmount : null,
      rawPayload: body,
    });

    return buildMachineJsonResponse(
      {
        ok: true,
        client_id: reporterClientId,
        outcome: gygOutcome,
        traceparent,
      },
      {
        status: gygOutcome.duplicateDelivery ? 200 : 201,
        cacheControl: "no-store",
        extraHeaders: {
          traceparent,
          "X-DCC-Surface-Class": "commercial_outcome_reporting",
          "X-DCC-Client-Id": reporterClientId,
          "X-DCC-Outcome-Id": gygOutcome.outcomeId,
        },
      },
    );
  }

  const outcome = await recordCommercialOutcome({
    reporterClientId,
    reporterProvenance: "authenticated_api_reporter",
    provider,
    providerAccount:
      typeof body.providerAccount === "string" ? body.providerAccount : null,
    providerBookingRef,
    eventType: String(body.eventType ?? "BOOKING_CONFIRMED"),
    providerEventTime:
      typeof body.providerEventTime === "string" ? body.providerEventTime : null,
    handoffId:
      typeof body.handoffId === "string"
        ? body.handoffId
        : typeof body.handoff_id === "string"
          ? body.handoff_id
          : null,
    campaignOrRefValue:
      typeof body.campaignOrRefValue === "string"
        ? body.campaignOrRefValue
        : typeof body.campaign === "string"
          ? body.campaign
          : typeof body.ref === "string"
            ? body.ref
            : null,
    evaluationRunId:
      typeof body.evaluationRunId === "string" ? body.evaluationRunId : null,
    receiptId: typeof body.receiptId === "string" ? body.receiptId : null,
    contextId: typeof body.contextId === "string" ? body.contextId : null,
    bookedProductCode:
      typeof body.bookedProductCode === "string" ? body.bookedProductCode : null,
    bookedDate: typeof body.bookedDate === "string" ? body.bookedDate : null,
    bookedOption: typeof body.bookedOption === "string" ? body.bookedOption : null,
    bookedPartySize:
      typeof body.bookedPartySize === "number" ? body.bookedPartySize : null,
    bookingValueAmount:
      typeof body.bookingValueAmount === "number" ? body.bookingValueAmount : null,
    bookingValueCurrency:
      typeof body.bookingValueCurrency === "string" ? body.bookingValueCurrency : null,
    estimatedCommissionAmount:
      typeof body.estimatedCommissionAmount === "number"
        ? body.estimatedCommissionAmount
        : null,
    estimatedCommissionCurrency:
      typeof body.estimatedCommissionCurrency === "string"
        ? body.estimatedCommissionCurrency
        : null,
    paidCommissionAmount:
      typeof body.paidCommissionAmount === "number" ? body.paidCommissionAmount : null,
    paidCommissionCurrency:
      typeof body.paidCommissionCurrency === "string"
        ? body.paidCommissionCurrency
        : null,
    cancellationReason:
      typeof body.cancellationReason === "string" ? body.cancellationReason : null,
    rawPayload: body,
    traceparent,
  });

  return buildMachineJsonResponse(
    {
      ok: true,
      client_id: reporterClientId,
      outcome,
      traceparent,
    },
    {
      status: outcome.duplicateDelivery ? 200 : 201,
      cacheControl: "no-store",
      extraHeaders: {
        traceparent,
        "X-DCC-Surface-Class": "commercial_outcome_reporting",
        "X-DCC-Client-Id": reporterClientId,
        "X-DCC-Outcome-Id": outcome.outcomeId,
      },
    },
  );
}
