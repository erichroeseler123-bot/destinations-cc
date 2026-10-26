import {
  buildMachineJsonResponse,
  enforceMachineLayerFeatureFlag,
  handleV03IssueShadowAuthorization,
  SHADOW_COMMERCE_ADAPTERS,
  verifyShadowDecisionAuthorizationJws,
  type CommerceAdapterTarget,
} from "@/lib/dcc/machine";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const flagBlocked = enforceMachineLayerFeatureFlag();
  if (flagBlocked) return flagBlocked;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return buildMachineJsonResponse(
      {
        ok: false,
        error: {
          code: "INVALID_JSON_BODY",
          message: "Request body must be valid JSON.",
        },
      },
      { status: 400, cacheControl: "no-store" },
    );
  }

  const receiptId = String(body.receiptId ?? "");
  try {
    const issued = await handleV03IssueShadowAuthorization({
      receiptId,
      targetAdapter: "octo",
      maxPriceUsdDecimal:
        typeof body.maxPriceMinorUnits === "number"
          ? body.maxPriceMinorUnits / 100
          : typeof body.maxPriceUsdDecimal === "number"
            ? body.maxPriceUsdDecimal
            : 625,
    });

    const verification = await verifyShadowDecisionAuthorizationJws(
      issued.signedAuthorization.jwsCompact,
    );

    const providerTargets: CommerceAdapterTarget[] = Array.isArray(body.providers)
      ? (body.providers as string[]).map(
          (p) => p.toLowerCase() as CommerceAdapterTarget,
        )
      : ["octo", "ap2", "acp", "rezdy", "square"];

    const dryRunDispatches = await Promise.all(
      providerTargets.map(async (target) => {
        const adapter = SHADOW_COMMERCE_ADAPTERS[target];
        const sim = await adapter.validateAndSimulateShadowPayload(
          issued.signedAuthorization.payload,
        );
        return {
          provider: target.toUpperCase(),
          ...sim,
          sideEffectsVerify: {
            networkCallsMade: sim.liveNetworkCallMade ? 1 : 0,
            bookingCreated: sim.bookingSubmitted,
            inventoryDecremented: sim.inventoryReserved,
            paymentCaptured: sim.paymentCharged,
            externalCommunicationSent: sim.travelerContacted,
          },
        };
      }),
    );

    return buildMachineJsonResponse(
      {
        ok: true,
        protocolVersion: "0.3.0",
        authorization: {
          ...issued.signedAuthorization,
          payload: {
            ...issued.signedAuthorization.payload,
            mode: issued.signedAuthorization.payload.executionMode,
          },
        },
        signatureVerification: verification,
        dryRunDispatches,
      },
      { status: 200, cacheControl: "no-store" },
    );
  } catch (err) {
    return buildMachineJsonResponse(
      {
        ok: false,
        error: {
          code: "AUTHORIZATION_ISSUANCE_FAILED",
          message:
            err instanceof Error ? err.message : "Failed to issue shadow authorization.",
        },
      },
      { status: 400, cacheControl: "no-store" },
    );
  }
}
