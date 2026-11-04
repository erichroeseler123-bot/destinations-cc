import {
  buildMachineJsonResponse,
  MachineSecurityLimitError,
  resolveOrGenerateW3cTraceparent,
  verifyEvaluationAuthAndRateLimit,
} from "@/lib/dcc/machine";
import {
  evaluateWtaAffiliateActivationGate,
  inspectWtaReferralLifecycleSeparation,
  runWtaAffiliatePreviewSimulation,
  WtaAffiliateProductionGateError,
} from "@/lib/dcc/commerce";
import { DCC_PORTFOLIO_NETWORK_SITES } from "@/lib/dcc/portfolioNetworkRegistry";

export const dynamic = "force-dynamic";

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
      s.siteId === "welcome-to-alaska" ||
      s.primaryDomain === "welcometoalaskatours.com",
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

  try {
    verifyEvaluationAuthAndRateLimit({
      headers: request.headers,
      requiredScope: "dcc:commerce:handoff",
      requireExplicitApiKey: true,
    });
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
          message: "Valid WTA or DCC commerce API key is required.",
        },
        traceparent,
      },
      { status: 401, cacheControl: "no-store", extraHeaders: { traceparent } },
    );
  }

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

  try {
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
  } catch (err) {
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

    return buildMachineJsonResponse(
      {
        ok: false,
        error: {
          code: "WTA_PREVIEW_SIMULATION_FAILED",
          message:
            err instanceof Error
              ? err.message
              : "Failed to run WTA affiliate preview simulation.",
        },
        traceparent,
      },
      { status: 500, cacheControl: "no-store", extraHeaders: { traceparent } },
    );
  }
}
