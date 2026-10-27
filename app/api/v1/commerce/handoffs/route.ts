import {
  buildMachineJsonResponse,
  enforceEvaluationRequestSizeLimit,
  MachineSecurityLimitError,
  resolveOrGenerateW3cTraceparent,
  verifyEvaluationAuthAndRateLimit,
} from "@/lib/dcc/machine";
import {
  createCommercialHandoff,
  getCommercialHandoffById,
  type CommercialPartyDetails,
  type CommercialProvider,
} from "@/lib/dcc/commerce";

export const dynamic = "force-dynamic";

const ALLOWED_PROVIDERS = new Set<CommercialProvider>([
  "viator",
  "fareharbor",
  "getyourguide",
  "rezdy",
  "square",
  "direct",
]);

export async function GET(request: Request) {
  const traceparent = resolveOrGenerateW3cTraceparent(request);
  const url = new URL(request.url);
  const handoffId =
    url.searchParams.get("handoffId")?.trim() ||
    url.searchParams.get("handoff_id")?.trim() ||
    "";

  if (!handoffId) {
    return buildMachineJsonResponse(
      {
        ok: false,
        error: {
          code: "MISSING_HANDOFF_ID",
          message: "Query parameter 'handoffId' (or 'handoff_id') is required.",
        },
      },
      { status: 400, cacheControl: "no-store", extraHeaders: { traceparent } },
    );
  }

  const record = await getCommercialHandoffById(handoffId);
  if (!record) {
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
      ok: true,
      handoff_id: record.handoffId,
      handoff: record,
      traceparent,
    },
    {
      status: 200,
      cacheControl: "no-store",
      extraHeaders: {
        traceparent,
        "X-DCC-Surface-Class": "commercial_handoff_lookup",
        "X-DCC-Handoff-Id": record.handoffId,
      },
    },
  );
}

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

  const providerRaw = String(body.provider ?? "viator").trim().toLowerCase() as CommercialProvider;
  if (!ALLOWED_PROVIDERS.has(providerRaw)) {
    return buildMachineJsonResponse(
      {
        ok: false,
        error: {
          code: "UNSUPPORTED_COMMERCIAL_PROVIDER",
          message: `Provider '${providerRaw}' is not supported. Expected viator, fareharbor, getyourguide, rezdy, square, or direct.`,
        },
      },
      { status: 400, cacheControl: "no-store", extraHeaders: { traceparent } },
    );
  }

  const productCode = String(body.productCode ?? body.product ?? "").trim();
  const productDestinationUrl = String(
    body.productDestinationUrl ?? body.destinationUrl ?? "",
  ).trim();
  if (!productCode || !productDestinationUrl) {
    return buildMachineJsonResponse(
      {
        ok: false,
        error: {
          code: "MISSING_PRODUCT_OR_DESTINATION",
          message: "Both 'productCode' and 'productDestinationUrl' are required.",
        },
      },
      { status: 400, cacheControl: "no-store", extraHeaders: { traceparent } },
    );
  }

  // Note: callerClientId is strictly derived from validated credentials (or anonymous browser tier),
  // NEVER trusted from body.client_id or body.clientId.
  const record = await createCommercialHandoff({
    originatingSite: String(
      body.originatingSite ?? body.site ?? "destinationcommandcenter.com",
    ),
    targetSite: typeof body.targetSite === "string" ? body.targetSite : null,
    provider: providerRaw,
    providerAccount:
      typeof body.providerAccount === "string" ? body.providerAccount : null,
    productCode,
    productTitle: typeof body.productTitle === "string" ? body.productTitle : null,
    productDestinationUrl,
    campaign: typeof body.campaign === "string" ? body.campaign : null,
    contextId: typeof body.contextId === "string" ? body.contextId : null,
    evaluationRunId:
      typeof body.evaluationRunId === "string" ? body.evaluationRunId : null,
    receiptId: typeof body.receiptId === "string" ? body.receiptId : null,
    intendedDate: typeof body.intendedDate === "string" ? body.intendedDate : null,
    intendedOption:
      typeof body.intendedOption === "string" ? body.intendedOption : null,
    partySize: typeof body.partySize === "number" ? body.partySize : null,
    partyDetails:
      body.partyDetails && typeof body.partyDetails === "object"
        ? (body.partyDetails as CommercialPartyDetails)
        : null,
    quotedPriceAmount:
      typeof body.quotedPriceAmount === "number" ? body.quotedPriceAmount : null,
    quotedPriceCurrency:
      typeof body.quotedPriceCurrency === "string" ? body.quotedPriceCurrency : null,
    approvedPartnerAttribution:
      body.approvedPartnerAttribution &&
      typeof body.approvedPartnerAttribution === "object" &&
      typeof (body.approvedPartnerAttribution as Record<string, unknown>).partnerId ===
        "string"
        ? {
            partnerId: String(
              (body.approvedPartnerAttribution as Record<string, unknown>).partnerId,
            ),
            partnerName:
              typeof (body.approvedPartnerAttribution as Record<string, unknown>)
                .partnerName === "string"
                ? String(
                    (body.approvedPartnerAttribution as Record<string, unknown>)
                      .partnerName,
                  )
                : null,
          }
        : null,
    callerClientId,
    traceparent,
    metadata:
      body.metadata && typeof body.metadata === "object"
        ? (body.metadata as Record<string, unknown>)
        : null,
  });

  return buildMachineJsonResponse(
    {
      ok: true,
      client_id: callerClientId,
      handoff_id: record.handoffId,
      handoff: record,
      traceparent,
    },
    {
      status: 201,
      cacheControl: "no-store",
      extraHeaders: {
        traceparent,
        "X-DCC-Surface-Class": "commercial_handoff",
        "X-DCC-Client-Id": callerClientId,
        "X-DCC-Handoff-Id": record.handoffId,
      },
    },
  );
}
