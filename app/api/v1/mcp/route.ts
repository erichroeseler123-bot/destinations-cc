import {
  buildMachineJsonResponse,
  buildMcpDiscoveryDocument,
  ClientSuppliedKnownAtForbiddenError,
  enforceMachineLayerFeatureFlag,
  getV03RuntimeStore,
  handleV03EvaluateRequest,
  handleV03IssueShadowAuthorization,
  handleV03ReplayReceiptRequest,
  toPublicCitationProjection,
  verifyV03DecisionReceiptJws,
  type CommerceAdapterTarget,
} from "@/lib/dcc/machine";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const flagBlocked = enforceMachineLayerFeatureFlag();
  if (flagBlocked) return flagBlocked;

  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  return buildMachineJsonResponse(buildMcpDiscoveryDocument(baseUrl), {
    cacheControl: "public, max-age=300, s-maxage=300",
  });
}

export async function POST(request: Request) {
  const flagBlocked = enforceMachineLayerFeatureFlag();
  if (flagBlocked) return flagBlocked;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return buildMachineJsonResponse(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error" },
      },
      { status: 400, cacheControl: "no-store" },
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
      { cacheControl: "no-store" },
    );
  }

  if (method === "tools/call") {
    const toolName = String(params.name ?? "");
    const args = (params.arguments as Record<string, unknown>) ?? {};

    try {
      if (toolName === "dcc_evaluate_category" || toolName === "dcc_evaluate_current") {
        const evalRes = await handleV03EvaluateRequest(args);
        return buildMachineJsonResponse(
          {
            jsonrpc: "2.0",
            id: rpcId,
            result: {
              content: [{ type: "text", text: JSON.stringify(evalRes) }],
              structuredContent: evalRes,
            },
          },
          { cacheControl: "no-store" },
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
          { cacheControl: "no-store" },
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
          { cacheControl: "no-store" },
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
            { status: 404, cacheControl: "no-store" },
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
          { cacheControl: "no-store" },
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
            { status: 404, cacheControl: "no-store" },
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
          { cacheControl: "no-store" },
        );
      }

      if (toolName === "dcc_issue_shadow_authorization") {
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
          { cacheControl: "no-store" },
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
        { status: 400, cacheControl: "no-store" },
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
