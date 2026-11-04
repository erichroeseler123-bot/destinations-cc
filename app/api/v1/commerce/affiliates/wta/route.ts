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
  createWtaTaggedReferralHandoff,
  evaluateWtaAffiliateActivationGate,
  getDccFareHarborCredentials,
  inspectWtaReferralLifecycleSeparation,
  runWtaAffiliatePreviewSimulation,
  settleWtaCommissionFromSettlementRecord,
  WtaAffiliateProductionGateError,
  WtaReferralKeyCannotWriteOutcomeError,
  WtaSimulatorPreviewOnlyError,
  type FareHarborExternalBookingRecord,
  type WtaCommissionSettlementRecord,
} from "@/lib/dcc/commerce";
import { DCC_PORTFOLIO_NETWORK_SITES } from "@/lib/dcc/portfolioNetworkRegistry";

export const dynamic = "force-dynamic";

function verifyFareHarborHeaderCaller(headers: Headers): string | null {
  try {
    const providedApp = (headers.get("x-fareharbor-api-app") || "").trim();
    const providedUser = (headers.get("x-fareharbor-api-user") || "").trim();
    if (!providedApp || !providedUser) return null;
    const { appKey, userKey } = getDccFareHarborCredentials();
    if (providedApp === appKey && providedUser === userKey) {
      return "client:fareharbor-authorized-api";
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const traceparent = resolveOrGenerateW3cTraceparent(request);
  const url = new URL(request.url);
  const handoffId =
    url.searchParams.get("handoffId")?.trim() ||
    url.searchParams.get("handoff_id")?.trim() ||
    "";

  const gateStatus = evaluateWtaAffiliateActivationGate();
  const inPortfolioList = DCC_PORTFOLIO_NETWORK_SITES.some(
    (s) =>
      String(s.site_id) === "welcome-to-alaska" ||
      s.canonical_domains.includes("welcometoalaskatours.com"),
  );

  let lifecycleProof = null;
  if (handoffId) {
    lifecycleProof = await inspectWtaReferralLifecycleSeparation(handoffId);
  }

  return buildMachineJsonResponse(
    {
      ok: true,
      enrollment: {
        ...gateStatus,
        inDccPortfolioNetworkSites: inPortfolioList,
      },
      lifecycleProof,
      traceparent,
    },
    {
      status: 200,
      cacheControl: "no-store",
      extraHeaders: {
        traceparent,
        "X-DCC-Surface-Class": "commercial_affiliate_enrollment",
      },
    },
  );
}

export async function POST(request: Request) {
  const traceparent = resolveOrGenerateW3cTraceparent(request);

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
          message: "Request body must be valid JSON.",
        },
        traceparent,
      },
      { status: 400, cacheControl: "no-store", extraHeaders: { traceparent } },
    );
  }

  const requestedAction = String(
    body.action ??
      body.mode ??
      (body.bookingUuid || body.booking_uuid
        ? "lookup_and_confirm_fareharbor_booking"
        : body.booking
          ? "confirm_fareharbor_booking"
          : body.settlement
            ? "record_settlement"
            : "create_referral"),
  )
    .trim()
    .toLowerCase();

  const fhCallerId = verifyFareHarborHeaderCaller(request.headers);

  // Step 1: Authenticate caller with base read/handoff scope (or FareHarbor API headers for booking lookup)
  let baseAuth: { clientId: string; keyId: string; scopes: string[] };
  try {
    const hasExplicitDccKey = Boolean(
      request.headers.get("x-dcc-api-key") || request.headers.get("authorization"),
    );
    if (!hasExplicitDccKey && fhCallerId) {
      baseAuth = {
        clientId: fhCallerId,
        keyId: "fh_api_headers",
        scopes: ["dcc:read:public", "dcc:commerce:report_outcome"],
      };
    } else {
      baseAuth = verifyEvaluationAuthAndRateLimit({
        headers: request.headers,
        requiredScope: "dcc:read:public",
        requireExplicitApiKey: true,
      });
    }
  } catch (err) {
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
    return buildMachineJsonResponse(
      {
        ok: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Valid WTA, FareHarbor, or DCC commerce credential is required.",
        },
        traceparent,
      },
      { status: 401, cacheControl: "no-store", extraHeaders: { traceparent } },
    );
  }

  try {
    // Action A0: Authorized FareHarbor booking lookup + sale confirmation (no custom X-DCC-API-Key header required when X-FareHarbor-API-App/User are supplied)
    if (
      requestedAction === "lookup_and_confirm_fareharbor_booking" ||
      requestedAction === "authorized_fareharbor_booking_lookup"
    ) {
      assertCallerIsNotWtaReferralKey(baseAuth.clientId, "booking");

      const reporterClientId = fhCallerId
        ? fhCallerId
        : verifyEvaluationAuthAndRateLimit({
            headers: request.headers,
            requiredScope: "dcc:commerce:report_outcome",
            requireExplicitApiKey: true,
          }).clientId;

      const companyShortname = String(
        body.companyShortname ||
          body.company ||
          body.fareharborShortname ||
          "coastalhelicopters",
      ).trim();
      const bookingUuid = String(
        body.bookingUuid || body.booking_uuid || body.uuid || "",
      ).trim();

      const lookupResult = await confirmWtaSaleViaAuthorizedFareHarborLookup({
        reporterClientId,
        companyShortname,
        bookingUuid,
        environment:
          body.environment === "demo" || body.sandbox === true ? "demo" : "live",
        handoffId: typeof body.handoffId === "string" ? body.handoffId : undefined,
        lookupBaseUrlOverride:
          typeof body.lookupBaseUrl === "string" ? body.lookupBaseUrl : undefined,
      });

      const lifecycleProof = lookupResult.bookingOutcome.handoffId
        ? await inspectWtaReferralLifecycleSeparation(
            lookupResult.bookingOutcome.handoffId,
          )
        : null;

      return buildMachineJsonResponse(
        {
          ok: true,
          action: "lookup_and_confirm_fareharbor_booking",
          lookupSource: lookupResult.lookupSource,
          extractedHandoffId: lookupResult.extractedHandoffId,
          authorizedBooking: lookupResult.booking,
          bookingOutcome: lookupResult.bookingOutcome,
          lifecycleProof,
          traceparent,
        },
        {
          status: lookupResult.bookingOutcome.duplicateDelivery ? 200 : 201,
          cacheControl: "no-store",
          extraHeaders: {
            traceparent,
            "X-DCC-Surface-Class":
              "commercial_affiliate_authorized_booking_lookup",
            "X-DCC-Client-Id": reporterClientId,
            "X-DCC-Outcome-Id": lookupResult.bookingOutcome.outcomeId,
          },
        },
      );
    }

    // Action A: Confirm sale from a genuine FareHarbor booking record
    if (
      requestedAction === "confirm_fareharbor_booking" ||
      requestedAction === "confirm_booking"
    ) {
      // Explicitly prove WTA's referral key cannot write booking outcomes
      assertCallerIsNotWtaReferralKey(baseAuth.clientId, "booking");

      const reporterClientId = fhCallerId
        ? fhCallerId
        : verifyEvaluationAuthAndRateLimit({
            headers: request.headers,
            requiredScope: "dcc:commerce:report_outcome",
            requireExplicitApiKey: true,
          }).clientId;

      const bookingOutcome = await confirmWtaSaleFromFareHarborBooking({
        reporterClientId,
        booking: body.booking as FareHarborExternalBookingRecord,
        handoffId:
          typeof body.handoffId === "string" ? body.handoffId : undefined,
      });

      const lifecycleProof = bookingOutcome.handoffId
        ? await inspectWtaReferralLifecycleSeparation(bookingOutcome.handoffId)
        : null;

      return buildMachineJsonResponse(
        {
          ok: true,
          action: "confirm_fareharbor_booking",
          bookingOutcome,
          lifecycleProof,
          traceparent,
        },
        {
          status: bookingOutcome.duplicateDelivery ? 200 : 201,
          cacheControl: "no-store",
          extraHeaders: {
            traceparent,
            "X-DCC-Surface-Class": "commercial_affiliate_booking_confirmation",
            "X-DCC-Client-Id": reporterClientId,
            "X-DCC-Outcome-Id": bookingOutcome.outcomeId,
          },
        },
      );
    }

    // Action B: Mark commission paid from a settlement record
    if (
      requestedAction === "record_settlement" ||
      requestedAction === "settle_commission"
    ) {
      // Explicitly prove WTA's referral key cannot write settlement/commission outcomes
      assertCallerIsNotWtaReferralKey(baseAuth.clientId, "settlement");

      const outcomeAuth = verifyEvaluationAuthAndRateLimit({
        headers: request.headers,
        requiredScope: "dcc:commerce:report_outcome",
        requireExplicitApiKey: true,
      });

      const commissionOutcome = await settleWtaCommissionFromSettlementRecord({
        reporterClientId: outcomeAuth.clientId,
        settlement: body.settlement as WtaCommissionSettlementRecord,
      });

      const lifecycleProof = commissionOutcome.handoffId
        ? await inspectWtaReferralLifecycleSeparation(
            commissionOutcome.handoffId,
          )
        : null;

      return buildMachineJsonResponse(
        {
          ok: true,
          action: "record_settlement",
          commissionOutcome,
          lifecycleProof,
          traceparent,
        },
        {
          status: commissionOutcome.duplicateDelivery ? 200 : 201,
          cacheControl: "no-store",
          extraHeaders: {
            traceparent,
            "X-DCC-Surface-Class": "commercial_affiliate_commission_settlement",
            "X-DCC-Client-Id": outcomeAuth.clientId,
            "X-DCC-Outcome-Id": commissionOutcome.outcomeId,
          },
        },
      );
    }

    // Action C: Preview-only simulator (`preview_simulate`)
    if (
      requestedAction === "preview_simulate" ||
      requestedAction === "simulate"
    ) {
      verifyEvaluationAuthAndRateLimit({
        headers: request.headers,
        requiredScope: "dcc:commerce:handoff",
        requireExplicitApiKey: true,
      });

      const proof = await runWtaAffiliatePreviewSimulation({
        intendedDate:
          typeof body.intendedDate === "string" ? body.intendedDate : undefined,
        partySize:
          typeof body.partySize === "number" ? body.partySize : undefined,
        productCode:
          typeof body.productCode === "string" ? body.productCode : undefined,
        quotedPriceAmount:
          typeof body.quotedPriceAmount === "number"
            ? body.quotedPriceAmount
            : undefined,
      });

      return buildMachineJsonResponse(
        {
          ok: true,
          action: "preview_simulate",
          enrollment: evaluateWtaAffiliateActivationGate(),
          lifecycleProof: proof,
          traceparent,
        },
        {
          status: 201,
          cacheControl: "no-store",
          extraHeaders: {
            traceparent,
            "X-DCC-Surface-Class": "commercial_affiliate_preview_proof",
          },
        },
      );
    }

    // Action D (Default live path): Create tagged referral handoff from WTA site
    const handoffAuth = verifyEvaluationAuthAndRateLimit({
      headers: request.headers,
      requiredScope: "dcc:commerce:handoff",
      requireExplicitApiKey: true,
    });

    const { handoff, gateStatus } = await createWtaTaggedReferralHandoff({
      callerClientId: handoffAuth.clientId,
      originatingSite:
        typeof body.originatingSite === "string"
          ? body.originatingSite
          : undefined,
      sourcePagePath:
        typeof body.sourcePagePath === "string"
          ? body.sourcePagePath
          : undefined,
      targetSite:
        typeof body.targetSite === "string" ? body.targetSite : undefined,
      fareharborShortname:
        typeof body.fareharborShortname === "string"
          ? body.fareharborShortname
          : undefined,
      fareharborItemId:
        typeof body.fareharborItemId === "string"
          ? body.fareharborItemId
          : undefined,
      productCode:
        typeof body.productCode === "string" ? body.productCode : undefined,
      productTitle:
        typeof body.productTitle === "string" ? body.productTitle : undefined,
      productDestinationUrl:
        typeof body.productDestinationUrl === "string"
          ? body.productDestinationUrl
          : undefined,
      campaign: typeof body.campaign === "string" ? body.campaign : undefined,
      intendedDate:
        typeof body.intendedDate === "string" ? body.intendedDate : undefined,
      partySize:
        typeof body.partySize === "number" ? body.partySize : undefined,
      quotedPriceAmount:
        typeof body.quotedPriceAmount === "number"
          ? body.quotedPriceAmount
          : undefined,
      quotedPriceCurrency:
        typeof body.quotedPriceCurrency === "string"
          ? body.quotedPriceCurrency
          : undefined,
      metadata:
        body.metadata && typeof body.metadata === "object"
          ? (body.metadata as Record<string, unknown>)
          : undefined,
    });

    const lifecycleProof = await inspectWtaReferralLifecycleSeparation(
      handoff.handoffId,
    );

    return buildMachineJsonResponse(
      {
        ok: true,
        action: "create_referral",
        enrollment: gateStatus,
        handoff,
        lifecycleProof,
        traceparent,
      },
      {
        status: 201,
        cacheControl: "no-store",
        extraHeaders: {
          traceparent,
          "X-DCC-Surface-Class": "commercial_affiliate_referral_handoff",
          "X-DCC-Client-Id": handoffAuth.clientId,
          "X-DCC-Handoff-Id": handoff.handoffId,
        },
      },
    );
  } catch (err) {
    if (err instanceof WtaSimulatorPreviewOnlyError) {
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
          code: typedErr?.code || "WTA_AFFILIATE_OPERATION_FAILED",
          message:
            err instanceof Error
              ? err.message
              : "Failed to process WTA affiliate operation.",
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
