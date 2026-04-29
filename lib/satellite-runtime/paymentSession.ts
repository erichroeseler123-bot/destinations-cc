import type { PaymentSessionRequest, PaymentSessionResponse } from "./types";

export function buildPaymentSessionPayload(request: PaymentSessionRequest): Record<string, unknown> {
  return {
    satelliteId: request.satelliteId,
    brandId: request.brandId,
    dcc_handoff_id: request.dccHandoffId,
    amountCents: request.amountCents,
    currency: request.currency,
    provider: request.provider,
    decision_corridor: request.decision_corridor,
    decision_action: request.decision_action,
    decision_option: request.decision_option,
    decision_product: request.decision_product,
    source_url: request.source_url,
    destination_url: request.destination_url,
    metadata: request.metadata || {},
  };
}

export async function createPaymentSession(
  request: PaymentSessionRequest,
  options: {
    satelliteSecret?: string;
    fetchImpl?: typeof fetch;
    dryRun?: boolean;
    endpointPath?: string;
  } = {},
): Promise<PaymentSessionResponse> {
  if (options.dryRun !== false) {
    return {
      ok: true,
      dccHandoffId: request.dccHandoffId,
      sessionToken: "dry_run_payment_session",
    };
  }

  const satelliteSecret = options.satelliteSecret?.trim();
  if (!satelliteSecret) {
    return { ok: false, dccHandoffId: request.dccHandoffId, error: "Missing satellite secret." };
  }

  const endpoint = new URL(options.endpointPath || "/api/internal/payment-sessions", request.dccBaseUrl);
  const fetcher = options.fetchImpl || fetch;

  try {
    const response = await fetcher(endpoint.toString(), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-dcc-satellite-token": satelliteSecret,
      },
      body: JSON.stringify(buildPaymentSessionPayload(request)),
    });
    const payload = (await response.json().catch(() => null)) as Partial<PaymentSessionResponse> | null;

    return {
      ok: response.ok,
      dccHandoffId: request.dccHandoffId,
      sessionToken: payload?.sessionToken,
      checkoutUrl: payload?.checkoutUrl,
      error: response.ok ? undefined : payload?.error || `Payment session endpoint returned ${response.status}`,
    };
  } catch (error) {
    return {
      ok: false,
      dccHandoffId: request.dccHandoffId,
      error: error instanceof Error ? error.message : "payment_session_failed",
    };
  }
}
