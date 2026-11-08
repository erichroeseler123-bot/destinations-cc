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
  recordMachineFunnelEvent,
  type CommercialProvider,
} from "@/lib/dcc/commerce";
import {
  MAPPED_CRUISE_PORT_EXCURSION_PROFILES,
  preparePortDayTourCheckout,
  queryPortDayExcursionCatalog,
  verifyLiveExcursionAvailability,
  type PortDayExcursionCategoryFilter,
  type PortDayExcursionViewMode,
} from "@/lib/dcc/cruisePortExcursionCatalogEngine";

export const dynamic = "force-dynamic";

const SUPPORTED_MCP_PROTOCOL_VERSIONS = [
  "2025-03-26",
  "2025-06-18",
  "2024-11-05",
] as const;

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Accept, Authorization, Mcp-Session-Id, MCP-Protocol-Version, traceparent, x-dcc-admin-simulation-token",
      "Access-Control-Expose-Headers":
        "Mcp-Session-Id, MCP-Protocol-Version, traceparent, X-DCC-Surface-Class",
    },
  });
}

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

  const hasExplicitId = body.id !== undefined && body.id !== null;
  const rpcId = (body.id as string | number | null) ?? null;
  const method = String(body.method ?? "");
  const params = (body.params as Record<string, unknown>) ?? {};

  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  if (method === "initialize") {
    const doc = buildMcpDiscoveryDocument(baseUrl);
    const requestedVersion =
      typeof params.protocolVersion === "string" && params.protocolVersion.trim()
        ? params.protocolVersion.trim()
        : "2025-03-26";
    const negotiatedProtocolVersion = (
      SUPPORTED_MCP_PROTOCOL_VERSIONS as readonly string[]
    ).includes(requestedVersion)
      ? requestedVersion
      : "2025-03-26";

    return buildMachineJsonResponse(
      {
        jsonrpc: "2.0",
        id: rpcId,
        result: {
          protocolVersion: negotiatedProtocolVersion,
          capabilities: {
            tools: {
              listChanged: false,
            },
          },
          serverInfo: doc.serverInfo,
          instructions:
            "Destination Command Center (DCC) Machine Layer & Port-Day Excursion MCP Server. Use dcc_search_port_excursions to search cruise port excursions and evaluate deterministic sailing-window timing fit (fits, runs_too_late, needs_verification), use dcc_check_tour_availability for read-only live seat/price availability verification, and use dcc_prepare_tour_checkout only after the traveler approves Continue to checkout.",
        },
      },
      {
        cacheControl: "no-store",
        extraHeaders: {
          traceparent,
          "MCP-Protocol-Version": negotiatedProtocolVersion,
          "X-DCC-Surface-Class": "public_discovery",
          "X-DCC-RateLimit-Backend": rateDecision.coordinationBackend,
        },
      },
    );
  }

  if (
    method === "notifications/initialized" ||
    method === "initialized" ||
    method.startsWith("notifications/")
  ) {
    return buildMachineJsonResponse(
      {
        jsonrpc: "2.0",
        id: rpcId,
        result: {
          ok: true,
          status: "initialized",
          method,
        },
      },
      {
        status: hasExplicitId ? 200 : 202,
        cacheControl: "no-store",
        extraHeaders: {
          traceparent,
          "X-DCC-Surface-Class": "public_discovery",
          "X-DCC-RateLimit-Backend": rateDecision.coordinationBackend,
        },
      },
    );
  }

  if (method === "ping") {
    return buildMachineJsonResponse(
      {
        jsonrpc: "2.0",
        id: rpcId,
        result: {},
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
      if (toolName === "dcc_search_port_excursions") {
        const auth = verifyEvaluationAuthAndRateLimit(request, "dcc:read:public");
        const portSlug = String(
          args.port ?? args.portSlug ?? args.destination ?? "reykjavik",
        ).trim();
        const rawViewMode = String(
          args.viewMode ?? args.view ?? "browse_all",
        )
          .trim()
          .toLowerCase();
        const viewMode: PortDayExcursionViewMode =
          rawViewMode === "fits_sailing" ||
          rawViewMode === "fits_my_sailing" ||
          rawViewMode === "fits"
            ? "fits_sailing"
            : "browse_all";

        const rawCategory = String(args.category ?? "all").trim().toLowerCase();
        const allowedCategories = new Set<PortDayExcursionCategoryFilter>([
          "all",
          "sightseeing",
          "wildlife",
          "food",
          "culture",
          "adventure",
          "family",
        ]);
        const category: PortDayExcursionCategoryFilter = allowedCategories.has(
          rawCategory as PortDayExcursionCategoryFilter,
        )
          ? (rawCategory as PortDayExcursionCategoryFilter)
          : "all";

        const rawArrival =
          args.shipArrival ?? args.shipArrivalTime ?? undefined;
        const shipArrivalTime =
          typeof rawArrival === "string" && rawArrival.trim()
            ? rawArrival.trim()
            : undefined;

        const rawAllAboard =
          args.allAboard ?? args.shipAllAboardTime ?? args.allAboardTime ?? undefined;
        const shipAllAboardTime =
          typeof rawAllAboard === "string" && rawAllAboard.trim()
            ? rawAllAboard.trim()
            : undefined;

        const rawDeparture =
          args.shipDeparture ??
          args.shipDepartureTime ??
          args.departureTime ??
          args.departure ??
          undefined;
        const shipDepartureTime =
          typeof rawDeparture === "string" && rawDeparture.trim()
            ? rawDeparture.trim()
            : undefined;

        const rawDate = args.date ?? args.sailingDate ?? undefined;
        const sailingDate =
          typeof rawDate === "string" && rawDate.trim()
            ? rawDate.trim()
            : undefined;

        const rawShip =
          args.ship ?? args.shipSlug ?? args.shipName ?? undefined;
        const shipSlug =
          typeof rawShip === "string" && rawShip.trim()
            ? rawShip.trim()
            : undefined;

        const rawSailing =
          args.sailing ?? args.sailingId ?? args.plan ?? args.planCode ?? undefined;
        const sailingId =
          typeof rawSailing === "string" && rawSailing.trim()
            ? rawSailing.trim()
            : undefined;

        const partySizeRaw = args.partySize ?? args.party_size;
        const partySize =
          partySizeRaw !== undefined && partySizeRaw !== null
            ? Math.max(1, Number(partySizeRaw) || 2)
            : 2;

        const limitRaw = args.limit;
        const limit =
          limitRaw !== undefined && limitRaw !== null
            ? Math.max(1, Math.min(100, Number(limitRaw) || 12))
            : 12;

        const offsetRaw = args.offset;
        const pageRaw = args.page;
        const offset =
          offsetRaw !== undefined && offsetRaw !== null
            ? Math.max(0, Number(offsetRaw) || 0)
            : pageRaw !== undefined && pageRaw !== null
              ? Math.max(0, (Math.max(1, Number(pageRaw) || 1) - 1) * limit)
              : 0;

        const rawSortBy = String(args.sortBy ?? "recommended");
        const sortBy =
          rawSortBy === "rating_desc" ||
          rawSortBy === "price_asc" ||
          rawSortBy === "duration_asc"
            ? rawSortBy
            : "recommended";

        const rawSearch = args.productCode ?? args.search ?? args.q ?? undefined;
        const search =
          typeof rawSearch === "string" && rawSearch.trim()
            ? rawSearch.trim()
            : undefined;

        const originatingSite =
          typeof args.originatingSite === "string" && args.originatingSite.trim()
            ? args.originatingSite.trim()
            : "destinationcommandcenter.com";
        const surface =
          typeof args.surface === "string" && args.surface.trim()
            ? args.surface.trim()
            : "mcp_port_day_excursions";
        const isQaTraffic =
          args.isQaTraffic === true ||
          args.qaTraffic === true ||
          args.isTest === true;

        await recordMachineFunnelEvent({
          stage: "search",
          originatingSite,
          callerClientId: auth.clientId,
          portSlug,
          productCode: typeof args.productCode === "string" ? args.productCode : null,
          intendedDate: sailingDate ?? null,
          partySize,
          isQaTraffic,
          metadata: { viewMode, category, search: search ?? null, surface },
        });

        const result = await queryPortDayExcursionCatalog({
          portSlug,
          viewMode,
          category,
          shipArrivalTime,
          shipAllAboardTime,
          shipDepartureTime,
          sailingDate,
          shipSlug,
          sailingId,
          partySize,
          ship: shipSlug,
          limit,
          offset,
          sortBy,
          search,
          originatingSite,
          surface,
        });

        if (!result) {
          return buildMachineJsonResponse(
            {
              jsonrpc: "2.0",
              id: rpcId,
              error: {
                code: -32602,
                message: `Unsupported or unmapped cruise port slug: ${portSlug}`,
                data: {
                  supportedPorts: MAPPED_CRUISE_PORT_EXCURSION_PROFILES.map(
                    (p) => p.portSlug,
                  ),
                },
              },
            },
            { status: 400, cacheControl: "no-store", extraHeaders: { traceparent } },
          );
        }

        return buildMachineJsonResponse(
          {
            jsonrpc: "2.0",
            id: rpcId,
            result: {
              content: [{ type: "text", text: JSON.stringify(result) }],
              structuredContent: result,
              isError: false,
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

      if (toolName === "dcc_check_tour_availability") {
        const auth = verifyEvaluationAuthAndRateLimit(request, "dcc:read:public");
        const portSlug = String(args.port ?? args.portSlug ?? "reykjavik").trim();
        const tourId = typeof args.tourId === "string" ? args.tourId.trim() : "";
        const productCode =
          typeof args.productCode === "string" && args.productCode.trim()
            ? args.productCode.trim()
            : null;
        const optionCode =
          typeof (args.optionCode ?? args.option) === "string" &&
          String(args.optionCode ?? args.option).trim()
            ? String(args.optionCode ?? args.option).trim()
            : null;
        const date = String(args.date ?? args.sailingDate ?? "2027-07-15").trim();
        const partySize = Math.max(1, Number(args.partySize ?? 2) || 2);
        const departureTime =
          typeof (args.departureTime ?? args.selectedDepartureTime) === "string" &&
          String(args.departureTime ?? args.selectedDepartureTime).trim()
            ? String(args.departureTime ?? args.selectedDepartureTime).trim()
            : null;
        const timeoutMs =
          args.timeoutMs !== undefined && Number.isFinite(Number(args.timeoutMs))
            ? Number(args.timeoutMs)
            : undefined;
        const simulateTimeout =
          args.simulateTimeout === true ||
          args.simulateTimeout === "true" ||
          args.providerTimeout === true ||
          args.providerTimeout === "true";
        const isQaTraffic =
          args.isQaTraffic === true ||
          args.qaTraffic === true ||
          args.isTest === true ||
          simulateTimeout;
        const originatingSite =
          typeof args.originatingSite === "string" && args.originatingSite.trim()
            ? args.originatingSite.trim()
            : "destinationcommandcenter.com";
        const surface =
          typeof args.surface === "string" && args.surface.trim()
            ? args.surface.trim()
            : "mcp_port_day_availability";

        if (!tourId && !productCode) {
          return buildMachineJsonResponse(
            {
              jsonrpc: "2.0",
              id: rpcId,
              error: {
                code: -32602,
                message:
                  "Missing required tourId or productCode for live availability check.",
              },
            },
            { status: 400, cacheControl: "no-store", extraHeaders: { traceparent } },
          );
        }

        await recordMachineFunnelEvent({
          stage: "availability_check",
          originatingSite,
          callerClientId: auth.clientId,
          portSlug,
          productCode,
          optionCode,
          intendedDate: date,
          departureTime,
          partySize,
          isQaTraffic,
          simulateTimeout,
          metadata: { surface, readOnly: true },
        });

        const seatAvailability = await verifyLiveExcursionAvailability({
          portSlug,
          tourId,
          productCode,
          optionCode,
          date,
          partySize,
          departureTime,
          timeoutMs,
          simulateTimeout,
          originatingSite,
          surface,
        });

        const payload = {
          ok: !seatAvailability.pastDepartureRejected,
          readOnly: true,
          createsCommercialHandoff: false,
          portSlug,
          tourId: tourId || null,
          productCode,
          optionCode: seatAvailability.selectedOptionCode ?? optionCode,
          timingFitIncluded: false,
          seatCountStatus:
            seatAvailability.remainingSeats !== null ? "reported_by_provider" : "unknown",
          seatAvailability,
        };

        return buildMachineJsonResponse(
          {
            jsonrpc: "2.0",
            id: rpcId,
            result: {
              content: [{ type: "text", text: JSON.stringify(payload) }],
              structuredContent: payload,
              isError: Boolean(seatAvailability.pastDepartureRejected),
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

      if (toolName === "dcc_prepare_tour_checkout") {
        const auth = verifyEvaluationAuthAndRateLimit(request, "dcc:commerce:handoff");
        const portSlug = String(args.port ?? args.portSlug ?? "new-orleans").trim();
        const productCode =
          typeof args.productCode === "string" ? args.productCode.trim() : null;
        const optionCode =
          typeof (args.optionCode ?? args.option) === "string"
            ? String(args.optionCode ?? args.option).trim()
            : null;
        const date =
          typeof (args.date ?? args.sailingDate) === "string"
            ? String(args.date ?? args.sailingDate).trim()
            : null;
        const departureTime =
          typeof (args.departureTime ?? args.selectedDepartureTime) === "string"
            ? String(args.departureTime ?? args.selectedDepartureTime).trim()
            : null;
        const partySize =
          args.partySize !== undefined && args.partySize !== null
            ? Number(args.partySize)
            : null;
        const travelerApprovedCheckout =
          args.travelerApprovedCheckout === true ||
          args.travelerApprovedCheckout === "true";
        const idempotencyKey =
          typeof args.idempotencyKey === "string" ? args.idempotencyKey.trim() : null;
        const sailingId =
          typeof (args.sailing ?? args.sailingId) === "string"
            ? String(args.sailing ?? args.sailingId).trim()
            : null;
        const shipSlug =
          typeof (args.ship ?? args.shipSlug) === "string"
            ? String(args.ship ?? args.shipSlug).trim()
            : null;
        const shipArrivalTime =
          typeof (args.shipArrival ?? args.shipArrivalTime) === "string"
            ? String(args.shipArrival ?? args.shipArrivalTime).trim()
            : null;
        const shipAllAboardTime =
          typeof (args.allAboard ?? args.shipAllAboardTime) === "string"
            ? String(args.allAboard ?? args.shipAllAboardTime).trim()
            : null;
        const shipDepartureTime =
          typeof (args.shipDeparture ?? args.shipDepartureTime) === "string"
            ? String(args.shipDeparture ?? args.shipDepartureTime).trim()
            : null;
        const originatingSite =
          typeof args.originatingSite === "string" && args.originatingSite.trim()
            ? args.originatingSite.trim()
            : "destinationcommandcenter.com";
        const surface =
          typeof args.surface === "string" && args.surface.trim()
            ? args.surface.trim()
            : "dcc_mcp_prepare_tour_checkout";
        const isQaTraffic =
          args.isQaTraffic === true ||
          args.qaTraffic === true ||
          args.isTest === true;
        const simulateTimeout =
          args.simulateTimeout === true || args.simulateTimeout === "true";

        const checkoutRes = await preparePortDayTourCheckout({
          portSlug,
          productCode,
          optionCode,
          date,
          departureTime,
          partySize,
          travelerApprovedCheckout,
          idempotencyKey,
          sailingId,
          shipSlug,
          shipArrivalTime,
          shipAllAboardTime,
          shipDepartureTime,
          callerClientId: auth.clientId,
          originatingSite,
          surface,
          isQaTraffic,
          simulateTimeout,
        });

        return buildMachineJsonResponse(
          {
            jsonrpc: "2.0",
            id: rpcId,
            result: {
              content: [{ type: "text", text: JSON.stringify(checkoutRes) }],
              structuredContent: checkoutRes,
              isError: !checkoutRes.ok,
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
