import {
  buildMachineJsonResponse,
  MachineSecurityLimitError,
  resolveOrGenerateW3cTraceparent,
  verifyEvaluationAuthAndRateLimit,
} from "@/lib/dcc/machine";
import {
  assertCallerIsNotWtaReferralKey,
  confirmWtaSaleFromFareHarborBooking,
  confirmWtaSaleViaAuthorizedFareHarborLookup,
  evaluateWtaAffiliateActivationGate,
  extractDccHandoffIdFromFareHarborBooking,
  getDccFareHarborCredentials,
  inspectWtaReferralLifecycleSeparation,
  WtaAffiliateProductionGateError,
  WtaReferralKeyCannotWriteOutcomeError,
  type FareHarborExternalBookingRecord,
} from "@/lib/dcc/commerce";

export const dynamic = "force-dynamic";

function detectWtaReferralCallerIfPresent(request: Request): string | null {
  const hasKeyHeader = Boolean(
    request.headers.get("x-dcc-api-key") || request.headers.get("authorization"),
  );
  if (!hasKeyHeader) return null;
  try {
    const auth = verifyEvaluationAuthAndRateLimit({
      headers: request.headers,
      requiredScope: "dcc:read:public",
      requireExplicitApiKey: true,
    });
    return auth.clientId;
  } catch {
    return null;
  }
}

function verifyWebhookQueryToken(url: URL): boolean {
  const token = (
    url.searchParams.get("token") ||
    url.searchParams.get("webhook_token") ||
    url.searchParams.get("secret") ||
    ""
  ).trim();
  if (!token) return false;

  const allowedSecrets = [
    (process.env.FAREHARBOR_WEBHOOK_TOKEN || "").trim(),
    (process.env.DCC_WTA_WEBHOOK_HMAC_SECRET || "").trim(),
    (process.env.FAREHARBOR_USER_KEY || "").trim(),
  ].filter((s) => s.length >= 16);

  return allowedSecrets.some((secret) => secret === token);
}

function verifyFareHarborApiHeaders(headers: Headers): boolean {
  try {
    const providedApp = (headers.get("x-fareharbor-api-app") || "").trim();
    const providedUser = (headers.get("x-fareharbor-api-user") || "").trim();
    if (!providedApp || !providedUser) return false;
    const { appKey, userKey } = getDccFareHarborCredentials();
    return providedApp === appKey && providedUser === userKey;
  } catch {
    return false;
  }
}

/**
 * FareHarbor-supported webhook receiver (`POST /api/v1/commerce/webhooks/fareharbor`).
 *
 * Since FareHarbor's webhook system cannot send custom `X-DCC-API-Key` headers, this receiver:
 * 1. Does NOT require a custom `X-DCC-API-Key` header from FareHarbor.
 * 2. Explicitly rejects WTA's referral credential (`403 WTA_REFERRAL_KEY_CANNOT_WRITE_OUTCOMES`) if someone
 *    attempts to call the webhook receiver with a WTA referral key.
 * 3. Enforces the production activation gate (`403 WTA_AFFILIATE_PRODUCTION_ACTIVATION_GATED`) while terms are unsigned.
 * 4. Verifies the incoming FareHarbor `{ booking: { ... } }` payload via either:
 *    - An authorized FareHarbor booking lookup (`GET .../companies/{shortname}/bookings/{uuid}/` using DCC's
 *      server-side `X-FareHarbor-API-App` and `X-FareHarbor-API-User` credentials), OR
 *    - A FareHarbor webhook URL query parameter token (`?token=...`) / FareHarbor API headers.
 */
export async function POST(request: Request) {
  const traceparent = resolveOrGenerateW3cTraceparent(request);
  const url = new URL(request.url);

  let body: Record<string, unknown> = {};
  try {
    const raw = await request.text();
    if (raw.trim()) {
      body = JSON.parse(raw) as Record<string, unknown>;
    }
  } catch {
    return buildMachineJsonResponse(
      {
        ok: false,
        error: {
          code: "INVALID_JSON_BODY",
          message: "FareHarbor webhook payload must be valid JSON.",
        },
        traceparent,
      },
      { status: 400, cacheControl: "no-store", extraHeaders: { traceparent } },
    );
  }

  try {
    // 1. If a DCC API key was supplied, ensure WTA's referral key is immediately rejected
    const maybeDccCaller = detectWtaReferralCallerIfPresent(request);
    if (maybeDccCaller) {
      assertCallerIsNotWtaReferralKey(maybeDccCaller, "booking");
    }

    // 2. Enforce production activation gate while commercial terms are unsigned
    const gate = evaluateWtaAffiliateActivationGate();
    if (gate.isProductionRuntime && !gate.productionActivationAllowed) {
      throw new WtaAffiliateProductionGateError(gate);
    }

    const incomingBooking = (
      body.booking && typeof body.booking === "object"
        ? body.booking
        : body
    ) as Partial<FareHarborExternalBookingRecord> & Record<string, unknown>;

    const bookingUuid = String(
      incomingBooking?.uuid ||
        body.bookingUuid ||
        body.booking_uuid ||
        url.searchParams.get("uuid") ||
        "",
    ).trim();
    const companyShortname = String(
      incomingBooking?.company?.shortname ||
        body.companyShortname ||
        body.company ||
        url.searchParams.get("company") ||
        "coastalhelicopters",
    ).trim();
    const lookupBaseUrlOverride =
      typeof body.lookupBaseUrl === "string"
        ? body.lookupBaseUrl
        : url.searchParams.get("lookupBaseUrl") || undefined;

    const hasValidQueryToken = verifyWebhookQueryToken(url);
    const hasValidFhHeaders = verifyFareHarborApiHeaders(request.headers);

    // 3. Prefer authorized FareHarbor booking lookup when bookingUuid is present and lookup succeeds
    if (bookingUuid && companyShortname) {
      try {
        const lookupConfirmation =
          await confirmWtaSaleViaAuthorizedFareHarborLookup({
            reporterClientId: "client:fareharbor-webhook-authorized-lookup",
            companyShortname,
            bookingUuid,
            handoffId:
              typeof body.handoffId === "string" ? body.handoffId : undefined,
            lookupBaseUrlOverride,
          });

        const lifecycleProof = lookupConfirmation.bookingOutcome.handoffId
          ? await inspectWtaReferralLifecycleSeparation(
              lookupConfirmation.bookingOutcome.handoffId,
            )
          : null;

        return buildMachineJsonResponse(
          {
            ok: true,
            receiver: "fareharbor_webhook_receiver",
            requiresCustomDccHeader: false,
            verificationMode: "authorized_fareharbor_booking_lookup",
            lookupSource: lookupConfirmation.lookupSource,
            extractedHandoffId: lookupConfirmation.extractedHandoffId,
            authorizedBooking: lookupConfirmation.booking,
            bookingOutcome: lookupConfirmation.bookingOutcome,
            lifecycleProof,
            traceparent,
          },
          {
            status: lookupConfirmation.bookingOutcome.duplicateDelivery
              ? 200
              : 201,
            cacheControl: "no-store",
            extraHeaders: {
              traceparent,
              "X-DCC-Surface-Class": "commercial_fareharbor_webhook_receiver",
              "X-DCC-Outcome-Id": lookupConfirmation.bookingOutcome.outcomeId,
            },
          },
        );
      } catch (lookupErr) {
        // If caller did NOT authenticate via query token or FH headers, require the authorized lookup to succeed
        if (!hasValidQueryToken && !hasValidFhHeaders) {
          throw lookupErr;
        }
      }
    }

    if (!hasValidQueryToken && !hasValidFhHeaders) {
      return buildMachineJsonResponse(
        {
          ok: false,
          error: {
            code: "FAREHARBOR_WEBHOOK_VERIFICATION_REQUIRED",
            message:
              "FareHarbor webhook requires either a verifiable booking UUID for authorized FareHarbor API lookup or a valid ?token= query parameter.",
          },
          traceparent,
        },
        { status: 401, cacheControl: "no-store", extraHeaders: { traceparent } },
      );
    }

    const extractedHandoffId = extractDccHandoffIdFromFareHarborBooking(
      incomingBooking,
      typeof body.handoffId === "string" ? body.handoffId : undefined,
    );

    const bookingOutcome = await confirmWtaSaleFromFareHarborBooking({
      reporterClientId: hasValidFhHeaders
        ? "client:fareharbor-authorized-api"
        : "client:fareharbor-webhook-query-token",
      booking: incomingBooking as FareHarborExternalBookingRecord,
      handoffId: extractedHandoffId,
      reporterProvenance: "fareharbor_booking_webhook",
    });

    const lifecycleProof = bookingOutcome.handoffId
      ? await inspectWtaReferralLifecycleSeparation(bookingOutcome.handoffId)
      : null;

    return buildMachineJsonResponse(
      {
        ok: true,
        receiver: "fareharbor_webhook_receiver",
        requiresCustomDccHeader: false,
        verificationMode: hasValidFhHeaders
          ? "fareharbor_api_headers"
          : "webhook_url_query_token",
        extractedHandoffId,
        bookingOutcome,
        lifecycleProof,
        traceparent,
      },
      {
        status: bookingOutcome.duplicateDelivery ? 200 : 201,
        cacheControl: "no-store",
        extraHeaders: {
          traceparent,
          "X-DCC-Surface-Class": "commercial_fareharbor_webhook_receiver",
          "X-DCC-Outcome-Id": bookingOutcome.outcomeId,
        },
      },
    );
  } catch (err) {
    if (err instanceof WtaReferralKeyCannotWriteOutcomeError) {
      return buildMachineJsonResponse(
        {
          ok: false,
          error: {
            code: err.code,
            message: err.message,
            callerClientId: err.callerClientId,
          },
          traceparent,
        },
        {
          status: err.statusCode,
          cacheControl: "no-store",
          extraHeaders: { traceparent },
        },
      );
    }

    if (err instanceof WtaAffiliateProductionGateError) {
      return buildMachineJsonResponse(
        {
          ok: false,
          error: {
            code: err.code,
            message: err.message,
            missingProductionRequirements:
              err.gateStatus.missingProductionRequirements,
            gateStatus: err.gateStatus,
          },
          traceparent,
        },
        {
          status: err.statusCode,
          cacheControl: "no-store",
          extraHeaders: { traceparent },
        },
      );
    }

    if (err instanceof MachineSecurityLimitError) {
      return buildMachineJsonResponse(
        {
          ok: false,
          error: {
            code: err.code,
            message: err.message,
          },
          traceparent,
        },
        {
          status: err.statusCode,
          cacheControl: "no-store",
          extraHeaders: { traceparent },
        },
      );
    }

    const typedErr = err as Error & { code?: string; statusCode?: number };
    return buildMachineJsonResponse(
      {
        ok: false,
        error: {
          code: typedErr?.code || "FAREHARBOR_WEBHOOK_FAILED",
          message:
            err instanceof Error
              ? err.message
              : "Failed to process FareHarbor webhook.",
        },
        traceparent,
      },
      {
        status: typedErr?.statusCode || 500,
        cacheControl: "no-store",
        extraHeaders: { traceparent },
      },
    );
  }
}
