import {
  buildMachineJsonResponse,
  buildMcpDiscoveryDocument,
  checkDistributedRateLimitV03,
  ClientSuppliedKnownAtForbiddenError,
  enforceEvaluationRequestSizeLimit,
  enforceMachineLayerFeatureFlag,
  getV03RuntimeStore,
  handleV03EvaluateRequest,
  handleV03IssueShadowAuthorization,
  handleV03ReplayReceiptRequest,
  MachineSecurityLimitError,
  PrivilegedSurfaceAccessError,
  resolveOrGenerateW3cTraceparent,
  toPublicCitationProjection,
  UnauthorizedAdminSimulationError,
  verifyEvaluationAuthAndRateLimit,
  verifyV03DecisionReceiptJws,
  verifyV031SurfaceAccess,
  type CommerceAdapterTarget,
} from "@/lib/dcc/machine";
import {
  createCommercialHandoff,
  recordCommercialOutcome,
  type CommercialProvider,
} from "@/lib/dcc/commerce";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const flagBlocked = enforceMachineLayerFeatureFlag();
  if (flagBlocked) return flagBlocked;

  const traceparent = resolveOrGenerateW3cTraceparent(request);
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  return buildMachineJsonResponse(buildMcpDiscoveryDocument(baseUrl), {
    cacheControl: "public, max-age=300, s-maxage=300",
    extraHeaders: {
      traceparent,
      "X-DCC-Surface-Class": "public_discovery",
    },
  });
}

export async function POST(request: Request) {
  const flagBlocked = enforceMachineLayerFeatureFlag();
  if (flagBlocked) return flagBlocked;

  const traceparent = resolveOrGenerateW3cTraceparent(request);
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local-client";
  const rateDecision = await checkDistributedRateLimitV03({
    clientKey: clientIp,
    endpoint: "/api/v1/mcp",
  });
  if (!rateDecision.allowed) {
    return buildMachineJsonResponse(
      {
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32029,
          message: "Distributed MCP rate limit exceeded.",
          data: {
            errorCode: "RATE_LIMIT_EXCEEDED",
            coordinationBackend: rateDecision.coordinationBackend,
          },
        },
      },
      { status: 429, cacheControl: "no-store", extraHeaders: { traceparent } },
    );
  }

  let rawBody: string;
  let body: Record<string, unknown>;
  try {
    rawBody = await request.text();
    enforceEvaluationRequestSizeLimit(rawBody);
    body = JSON.parse(rawBody) as Record<string, unknown>;
  } catch (err) {
    if (err instanceof MachineSecurityLimitError) {
      return buildMachineJsonResponse(
        {
          jsonrpc: "2.0",
          id: null,
          error: {
            code: -32600,
            message: err.message,
            data: { errorCode: err.code },
          },
        },
        { status: err.statusCode, cacheControl: "no-store", extraHeaders: { traceparent } },
      );
    }
    return buildMachineJsonResponse(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error" },
      },
      { status: 400, cacheControl: "no-store", extraHeaders: { traceparent } },
    );
  }

  const rpcId = (body.id as string | number | null) ?? null;
  const method = String(body.method ?? "");
  const params = (body.params as Record<string, unknown>) ?? {};

  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  if (method === "tools/list") {
    const doc = buildMcpDiscoveryDocument(baseUrl);
    return buildMachineJsonResponse(
      {
        jsonrpc: "2.0",
        id: rpcId,
        result: {
          tools: doc.tools,
        },
      },
      {
        cacheControl: "no-store",
        extraHeaders: {
          traceparent,
          "X-DCC-Surface-Class": "public_discovery",
          "X-DCC-RateLimit-Backend": rateDecision.coordinationBackend,
        },
      },
    );
  }

  if (method === "tools/call") {
    const toolName = String(params.name ?? "");
    const args = (params.arguments as Record<string, unknown>) ?? {};

    try {
      if (toolName === "dcc_evaluate_category" || toolName === "dcc_evaluate_current") {
        const auth = verifyEvaluationAuthAndRateLimit(request, "evaluate:single");
        const isSim = args.mode === "admin_simulation";
        const adminToken =
          request.headers.get("x-dcc-admin-simulation-token") ??
          (typeof args.adminAuthToken === "string" ? args.adminAuthToken : undefined);
        if (isSim) {
          verifyV031SurfaceAccess({
            surfaceClass: "privileged_simulation",
            request,
            endpoint: `/api/v1/mcp:${toolName}`,
            explicitToken: adminToken,
          });
        }
        const evalRes = await handleV03EvaluateRequest(args, {
          adminToken,
          authenticatedClientId: auth.clientId,
          traceparent,
        });
        return buildMachineJsonResponse(
          {
            jsonrpc: "2.0",
            id: rpcId,
            result: {
              content: [{ type: "text", text: JSON.stringify(evalRes) }],
              structuredContent: evalRes,
            },
          },
          {
            cacheControl: "no-store",
            extraHeaders: {
              traceparent,
              "X-DCC-Client-Id": auth.clientId,
              "X-DCC-Surface-Class": isSim
                ? "privileged_simulation"
                : "authenticated_evaluation",
              "X-DCC-RateLimit-Backend": rateDecision.coordinationBackend,
            },
          },
        );
      }

      if (toolName === "dcc_verify_receipt_jws") {
        const jwsCompact = String(args.jwsCompact ?? "");
        const verification = await verifyV03DecisionReceiptJws({ jwsCompact });
        return buildMachineJsonResponse(
          {
            jsonrpc: "2.0",
            id: rpcId,
            result: {
              content: [{ type: "text", text: JSON.stringify(verification) }],
              structuredContent: verification,
            },
          },
          {
            cacheControl: "no-store",
            extraHeaders: {
              traceparent,
              "X-DCC-Surface-Class": "public_verification",
              "X-DCC-RateLimit-Backend": rateDecision.coordinationBackend,
            },
          },
        );
      }

      if (toolName === "dcc_replay_receipt") {
        const receiptId = String(args.receiptId ?? "");
        const replayRes = await handleV03ReplayReceiptRequest(receiptId);
        return buildMachineJsonResponse(
          {
            jsonrpc: "2.0",
            id: rpcId,
            result: {
              content: [{ type: "text", text: JSON.stringify(replayRes) }],
              structuredContent: replayRes,
            },
          },
          {
            cacheControl: "no-store",
            extraHeaders: {
              traceparent,
              "X-DCC-Surface-Class": "public_verification",
              "X-DCC-RateLimit-Backend": rateDecision.coordinationBackend,
            },
          },
        );
      }

      if (toolName === "dcc_resolve_citation") {
        const referenceId = String(args.referenceId ?? "");
        const store = getV03RuntimeStore();
        const evRef = store.evidenceRefsById.get(referenceId);
        if (!evRef) {
          return buildMachineJsonResponse(
            {
              jsonrpc: "2.0",
              id: rpcId,
              error: {
                code: -32004,
                message: `Evidence reference "${referenceId}" not found.`,
              },
            },
            { status: 404, cacheControl: "no-store", extraHeaders: { traceparent } },
          );
        }
        const projection = toPublicCitationProjection(evRef);
        return buildMachineJsonResponse(
          {
            jsonrpc: "2.0",
            id: rpcId,
            result: {
              content: [{ type: "text", text: JSON.stringify(projection) }],
              structuredContent: projection,
            },
          },
          {
            cacheControl: "no-store",
            extraHeaders: {
              traceparent,
              "X-DCC-Surface-Class": "public_verification",
              "X-DCC-RateLimit-Backend": rateDecision.coordinationBackend,
            },
          },
        );
      }

      if (toolName === "dcc_get_candidate_universe") {
        const universeId = String(args.universeId ?? "");
        const store = getV03RuntimeStore();
        const universe = store.universesByIdAndVersion.get(universeId);
        if (!universe) {
          return buildMachineJsonResponse(
            {
              jsonrpc: "2.0",
              id: rpcId,
              error: {
                code: -32004,
                message: `CandidateUniverse "${universeId}" not found.`,
              },
            },
            { status: 404, cacheControl: "no-store", extraHeaders: { traceparent } },
          );
        }
        return buildMachineJsonResponse(
          {
            jsonrpc: "2.0",
            id: rpcId,
            result: {
              content: [{ type: "text", text: JSON.stringify(universe) }],
              structuredContent: universe,
            },
          },
          {
            cacheControl: "no-store",
            extraHeaders: {
              traceparent,
              "X-DCC-Surface-Class": "public_discovery",
              "X-DCC-RateLimit-Backend": rateDecision.coordinationBackend,
            },
          },
        );
      }

      if (toolName === "dcc_issue_shadow_authorization") {
        const auth = verifyEvaluationAuthAndRateLimit(request, "evaluate:single");
        verifyV031SurfaceAccess({
          surfaceClass: "privileged_authorization",
          request,
          endpoint: `/api/v1/mcp:${toolName}`,
          explicitToken:
            typeof args.authorizationToken === "string"
              ? args.authorizationToken
              : undefined,
        });
        const receiptId = String(args.receiptId ?? "");
        const targetAdapter = (args.targetAdapter ?? "octo") as CommerceAdapterTarget;
        const issued = await handleV03IssueShadowAuthorization({
          receiptId,
          targetAdapter,
        });
        return buildMachineJsonResponse(
          {
            jsonrpc: "2.0",
            id: rpcId,
            result: {
              content: [{ type: "text", text: JSON.stringify(issued) }],
              structuredContent: issued,
            },
          },
          {
            cacheControl: "no-store",
            extraHeaders: {
              traceparent,
              "X-DCC-Client-Id": auth.clientId,
              "X-DCC-Surface-Class": "privileged_authorization",
              "X-DCC-RateLimit-Backend": rateDecision.coordinationBackend,
            },
          },
        );
      }

      if (toolName === "dcc_create_commercial_handoff") {
        const auth = verifyEvaluationAuthAndRateLimit(request, "dcc:commerce:handoff");
        const handoff = await createCommercialHandoff({
          originatingSite: String(args.originatingSite ?? "destinationcommandcenter.com"),
          provider: (args.provider as CommercialProvider) ?? "viator",
          providerAccount:
            typeof args.providerAccount === "string" ? args.providerAccount : null,
          productCode: String(args.productCode ?? ""),
          productTitle: typeof args.productTitle === "string" ? args.productTitle : null,
          productDestinationUrl: String(args.productDestinationUrl ?? ""),
          campaign: typeof args.campaign === "string" ? args.campaign : null,
          contextId: typeof args.contextId === "string" ? args.contextId : null,
          evaluationRunId:
            typeof args.evaluationRunId === "string" ? args.evaluationRunId : null,
          receiptId: typeof args.receiptId === "string" ? args.receiptId : null,
          intendedDate: typeof args.intendedDate === "string" ? args.intendedDate : null,
          intendedOption:
            typeof args.intendedOption === "string" ? args.intendedOption : null,
          partySize: typeof args.partySize === "number" ? args.partySize : null,
          callerClientId: auth.clientId,
          traceparent,
        });
        return buildMachineJsonResponse(
          {
            jsonrpc: "2.0",
            id: rpcId,
            result: {
              content: [{ type: "text", text: JSON.stringify(handoff) }],
              structuredContent: handoff,
            },
          },
          {
            cacheControl: "no-store",
            extraHeaders: {
              traceparent,
              "X-DCC-Client-Id": auth.clientId,
              "X-DCC-Surface-Class": "commercial_handoff",
              "X-DCC-RateLimit-Backend": rateDecision.coordinationBackend,
            },
          },
        );
      }

      if (toolName === "dcc_report_commercial_outcome") {
        const auth = verifyEvaluationAuthAndRateLimit({
          headers: request.headers,
          requiredScope: "dcc:commerce:report_outcome",
          requireExplicitApiKey: true,
        });
        const outcome = await recordCommercialOutcome({
          reporterClientId: auth.clientId,
          reporterProvenance: "authenticated_api_reporter",
          provider: (args.provider as CommercialProvider) ?? "viator",
          providerAccount:
            typeof args.providerAccount === "string" ? args.providerAccount : null,
          providerBookingRef: String(args.providerBookingRef ?? ""),
          eventType: String(args.eventType ?? "BOOKING_CONFIRMED"),
          providerEventTime:
            typeof args.providerEventTime === "string" ? args.providerEventTime : null,
          handoffId: typeof args.handoffId === "string" ? args.handoffId : null,
          campaignOrRefValue:
            typeof args.campaignOrRefValue === "string" ? args.campaignOrRefValue : null,
          bookedProductCode:
            typeof args.bookedProductCode === "string" ? args.bookedProductCode : null,
          bookedDate: typeof args.bookedDate === "string" ? args.bookedDate : null,
          bookedPartySize:
            typeof args.bookedPartySize === "number" ? args.bookedPartySize : null,
          bookingValueAmount:
            typeof args.bookingValueAmount === "number" ? args.bookingValueAmount : null,
          bookingValueCurrency:
            typeof args.bookingValueCurrency === "string"
              ? args.bookingValueCurrency
              : null,
          estimatedCommissionAmount:
            typeof args.estimatedCommissionAmount === "number"
              ? args.estimatedCommissionAmount
              : null,
          paidCommissionAmount:
            typeof args.paidCommissionAmount === "number"
              ? args.paidCommissionAmount
              : null,
          traceparent,
        });
        return buildMachineJsonResponse(
          {
            jsonrpc: "2.0",
            id: rpcId,
            result: {
              content: [{ type: "text", text: JSON.stringify(outcome) }],
              structuredContent: outcome,
            },
          },
          {
            cacheControl: "no-store",
            extraHeaders: {
              traceparent,
              "X-DCC-Client-Id": auth.clientId,
              "X-DCC-Surface-Class": "commercial_outcome_reporting",
              "X-DCC-RateLimit-Backend": rateDecision.coordinationBackend,
            },
          },
        );
      }

      return buildMachineJsonResponse(
        {
          jsonrpc: "2.0",
          id: rpcId,
          error: {
            code: -32601,
            message: `Unknown MCP tool "${toolName}".`,
          },
        },
        { status: 400, cacheControl: "no-store", extraHeaders: { traceparent } },
      );
    } catch (err) {
      if (err instanceof ClientSuppliedKnownAtForbiddenError) {
        return buildMachineJsonResponse(
          {
            jsonrpc: "2.0",
            id: rpcId,
            error: {
              code: -32602,
              message: err.message,
              data: { errorCode: err.code },
            },
          },
          { status: 400, cacheControl: "no-store" },
        );
      }
      if (
        err instanceof PrivilegedSurfaceAccessError ||
        err instanceof UnauthorizedAdminSimulationError ||
        err instanceof MachineSecurityLimitError
      ) {
        const statusCode =
          err instanceof PrivilegedSurfaceAccessError ||
          err instanceof MachineSecurityLimitError
            ? err.statusCode
            : 403;
        return buildMachineJsonResponse(
          {
            jsonrpc: "2.0",
            id: rpcId,
            error: {
              code: -32003,
              message: err.message,
              data: { errorCode: err.code },
            },
          },
          { status: statusCode, cacheControl: "no-store" },
        );
      }
      return buildMachineJsonResponse(
        {
          jsonrpc: "2.0",
          id: rpcId,
          error: {
            code: -32000,
            message: err instanceof Error ? err.message : "MCP tool execution failed",
          },
        },
        { status: 500, cacheControl: "no-store" },
      );
    }
  }

  return buildMachineJsonResponse(
    {
      jsonrpc: "2.0",
      id: rpcId,
      error: {
        code: -32601,
        message: `Method "${method}" not found.`,
      },
    },
    { status: 400, cacheControl: "no-store" },
  );
}
