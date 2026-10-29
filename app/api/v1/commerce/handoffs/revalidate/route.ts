import {
  buildMachineJsonResponse,
  enforceEvaluationRequestSizeLimit,
  MachineSecurityLimitError,
  resolveOrGenerateW3cTraceparent,
  verifyEvaluationAuthAndRateLimit,
} from "@/lib/dcc/machine";
import { getV03ReceiptWithFallback } from "@/lib/dcc/machine/v03/runtimeStoreV03";
import {
  getCommercialHandoffById,
  revalidateCommercialHandoffBeforeCommitment,
} from "@/lib/dcc/commerce";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const traceparent = resolveOrGenerateW3cTraceparent(request);

  let rawBody: string;
  let callerClientId = "client:public_traveler_browser";
  try {
    rawBody = await request.text();
    enforceEvaluationRequestSizeLimit(rawBody);
    const auth = verifyEvaluationAuthAndRateLimit(request, "dcc:commerce:handoff");
    callerClientId = auth.clientId;
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

  const handoffId = String(body.handoffId ?? body.handoff_id ?? "").trim();
  if (!handoffId) {
    return buildMachineJsonResponse(
      {
        ok: false,
        error: {
          code: "MISSING_HANDOFF_ID",
          message: "Field 'handoffId' is required for pre-booking revalidation.",
        },
      },
      { status: 400, cacheControl: "no-store", extraHeaders: { traceparent } },
    );
  }

  const handoff = await getCommercialHandoffById(handoffId);
  if (!handoff) {
    return buildMachineJsonResponse(
      {
        ok: false,
        error: {
          code: "HANDOFF_NOT_FOUND",
          message: `Commercial handoff '${handoffId}' not found.`,
        },
      },
      { status: 404, cacheControl: "no-store", extraHeaders: { traceparent } },
    );
  }

  let receiptEvaluatedPartySize: number | null = null;
  let receiptEvaluatedDate: string | null = null;
  if (handoff.receiptId) {
    const storedReceipt = await getV03ReceiptWithFallback(handoff.receiptId);
    if (storedReceipt) {
      const inputs = (storedReceipt.inputs ?? {}) as Record<string, unknown>;
      receiptEvaluatedPartySize =
        typeof inputs.partySize === "number"
          ? inputs.partySize
          : typeof inputs.passengerCount === "number"
            ? inputs.passengerCount
            : null;
      receiptEvaluatedDate = storedReceipt.receipt.payload.validAt
        ? storedReceipt.receipt.payload.validAt.slice(0, 10)
        : null;
    }
  }

  const UNTRUSTED_OPERATOR_FACT_KEYS = [
    "liveOperatorPricePerPersonUsd",
    "liveAvailableSeats",
    "liveDepartureStatus",
    "live_price",
    "available_seats",
    "departure_status",
  ] as const;

  const ignoredUntrustedOperatorFactFields = UNTRUSTED_OPERATOR_FACT_KEYS.filter(
    (k) => body[k] !== undefined,
  );

  const declaredWeightRaw =
    typeof body.declaredMaxSinglePassengerWeightLbs === "number"
      ? body.declaredMaxSinglePassengerWeightLbs
      : typeof body.maxSinglePassengerWeightLbs === "number"
        ? body.maxSinglePassengerWeightLbs
        : null;

  const declaredAgeRaw =
    typeof body.declaredYoungestPassengerAgeYears === "number"
      ? body.declaredYoungestPassengerAgeYears
      : typeof body.youngestPassengerAgeYears === "number"
        ? body.youngestPassengerAgeYears
        : null;

  const revalidation = await revalidateCommercialHandoffBeforeCommitment({
    handoffId,
    receiptEvaluatedPartySize,
    receiptEvaluatedDate,
    requestedPartySize:
      typeof body.requestedPartySize === "number" ? body.requestedPartySize : null,
    requestedDate: typeof body.requestedDate === "string" ? body.requestedDate : null,
    requestedDepartureId:
      typeof body.requestedDepartureId === "string" ? body.requestedDepartureId : null,
    requestedDepartureTime:
      typeof body.requestedDepartureTime === "string" ? body.requestedDepartureTime : null,
    requestedFareharborItemId:
      typeof body.requestedFareharborItemId === "string"
        ? body.requestedFareharborItemId
        : null,
    requestedTourCode:
      typeof body.requestedTourCode === "string" ? body.requestedTourCode : null,
    requestedReceiptId:
      typeof body.requestedReceiptId === "string" ? body.requestedReceiptId : null,
    declaredMaxSinglePassengerWeightLbs: declaredWeightRaw,
    declaredYoungestPassengerAgeYears: declaredAgeRaw,
    hasLapChildUnder2:
      typeof body.hasLapChildUnder2 === "boolean" ? body.hasLapChildUnder2 : null,
    requiresAssistedAircraftBoarding:
      typeof body.requiresAssistedAircraftBoarding === "boolean"
        ? body.requiresAssistedAircraftBoarding
        : null,
    canWalkUnassistedOneHourUnevenTerrain:
      typeof body.canWalkUnassistedOneHourUnevenTerrain === "boolean"
        ? body.canWalkUnassistedOneHourUnevenTerrain
        : null,
    carryingDrone: typeof body.carryingDrone === "boolean" ? body.carryingDrone : null,
    carryingSelfieStickOrExtension:
      typeof body.carryingSelfieStickOrExtension === "boolean"
        ? body.carryingSelfieStickOrExtension
        : null,
    carryingBagsOrPursesOnFlight:
      typeof body.carryingBagsOrPursesOnFlight === "boolean"
        ? body.carryingBagsOrPursesOnFlight
        : null,
    hasServiceAnimal:
      typeof body.hasServiceAnimal === "boolean" ? body.hasServiceAnimal : null,
    shipArrivalTime:
      typeof body.shipArrivalTime === "string" ? body.shipArrivalTime : null,
    shipDepartureTime:
      typeof body.shipDepartureTime === "string" ? body.shipDepartureTime : null,
    travelerAcceptedWeightSurcharge:
      typeof body.travelerAcceptedWeightSurcharge === "boolean"
        ? body.travelerAcceptedWeightSurcharge
        : null,
    ignoredUntrustedOperatorFactFields,
  });

  if (!revalidation) {
    return buildMachineJsonResponse(
      {
        ok: false,
        error: {
          code: "HANDOFF_NOT_FOUND",
          message: `Commercial handoff '${handoffId}' not found.`,
        },
      },
      { status: 404, cacheControl: "no-store", extraHeaders: { traceparent } },
    );
  }

  return buildMachineJsonResponse(
    {
      ok: revalidation.progressionAllowed,
      client_id: callerClientId,
      handoff_id: revalidation.handoffId,
      progressionAllowed: revalidation.progressionAllowed,
      revalidationStatus: revalidation.revalidationStatus,
      blockingReasons: revalidation.blockingReasons,
      providerConfirmation: revalidation.providerConfirmation,
      handoff,
      revalidation,
      traceparent,
    },
    {
      status: revalidation.progressionAllowed ? 200 : 409,
      cacheControl: "no-store",
      extraHeaders: {
        traceparent,
        "X-DCC-Surface-Class": "commercial_handoff_revalidation",
        "X-DCC-Handoff-Id": revalidation.handoffId,
        "X-DCC-Progression-Allowed": String(revalidation.progressionAllowed),
        "X-DCC-Provider-Confirmation-Status": revalidation.providerConfirmation.status,
      },
    },
  );
}
