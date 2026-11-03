import { NextResponse } from "next/server";
import {
  checkAndRecordNonce,
  hashBody,
  isResearchProducerKey,
  verifyServiceRequestHeaders,
} from "@/lib/dcc/auth/hmac-service-auth";
import { isValidAdminAccessKey } from "@/lib/adminAccess";
import {
  getVerifiedFactsForExactProduct,
  ingestApprovedFactsFromReviewDesk,
  synchronizeReviewDeskToDurableStore,
  type DurableResearchSyncMutation,
  type RawResearchDeskFactRow,
} from "@/lib/dcc/research/approvedFactsFeed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function authorizeResearchFeedRequest(
  request: Request,
  rawBody?: string,
): Promise<{
  authorized: boolean;
  statusCode: 401 | 403 | 429;
  error?: string;
  code?: string;
  keyId?: string;
  authMethod?: "hmac_service" | "internal_secret" | "portal_token" | "admin_key";
}> {
  const url = new URL(request.url);

  // 1. Check HMAC service headers if provided
  if (
    request.headers.get("x-dcc-signature") ||
    request.headers.get("x-dcc-key-id") ||
    request.headers.get("x-service-key-id") ||
    request.headers.get("x-key-id") ||
    request.headers.get("x-signature")
  ) {
    const verify = verifyServiceRequestHeaders({
      headers: request.headers,
      method: request.method,
      pathname: url.pathname,
      searchParams: url.searchParams,
      body: rawBody,
      recordNonce: false,
    });
    if (!verify.authorized) {
      return {
        authorized: false,
        statusCode: verify.statusCode,
        error: verify.error,
        code: verify.code,
      };
    }

    const nonce =
      (
        request.headers.get("x-dcc-nonce") ||
        request.headers.get("x-nonce") ||
        request.headers.get("x-dcc-delivery-id") ||
        request.headers.get("x-delivery-id") ||
        ""
      ).trim() ||
      `producer:${request.headers.get("x-dcc-timestamp") || request.headers.get("x-timestamp") || ""}:${hashBody(rawBody)}`;
    const nonceCheck = await checkAndRecordNonce(nonce);
    if (!nonceCheck.ok) {
      return {
        authorized: false,
        statusCode: 401,
        error: nonceCheck.reason || "Nonce replay rejected.",
        code: "NONCE_REPLAY_REJECTED",
      };
    }

    return {
      authorized: true,
      statusCode: 200 as unknown as 401,
      keyId: verify.keyId,
      authMethod: "hmac_service",
    };
  }

  // 2. Check INTERNAL_API_SECRET or DCC_PORTAL_TOKEN (read-only fallback)
  const internalSecret = process.env.INTERNAL_API_SECRET?.trim();
  const portalToken =
    process.env.DCC_PORTAL_BEARER_TOKEN?.trim() ||
    process.env.DCC_PORTAL_TOKEN?.trim();
  const headerSecret = request.headers.get("x-internal-secret")?.trim() || "";
  const portalHeaderSecret =
    request.headers.get("x-dcc-portal-token")?.trim() || "";
  const authHeader = request.headers.get("authorization") || "";
  const bearerSecret = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";

  if (
    internalSecret &&
    (headerSecret === internalSecret || bearerSecret === internalSecret)
  ) {
    return {
      authorized: true,
      statusCode: 200 as unknown as 401,
      authMethod: "internal_secret",
    };
  }

  if (
    portalToken &&
    (portalHeaderSecret === portalToken || bearerSecret === portalToken)
  ) {
    return {
      authorized: true,
      statusCode: 200 as unknown as 401,
      authMethod: "portal_token",
    };
  }

  // 3. Check Admin access key (read-only fallback)
  const adminKeyHeader =
    request.headers.get("x-admin-access-key")?.trim() ||
    request.headers.get("x-earthos-admin-key")?.trim() ||
    "";
  if (
    isValidAdminAccessKey(adminKeyHeader) ||
    isValidAdminAccessKey(bearerSecret)
  ) {
    return {
      authorized: true,
      statusCode: 200 as unknown as 401,
      authMethod: "admin_key",
    };
  }

  return {
    authorized: false,
    statusCode: 401,
    error:
      "Unauthorized. Approved research fact feed requires service HMAC credentials.",
    code: "UNAUTHORIZED",
  };
}

const FORBIDDEN_TEST_ACTIONS = new Set(["clear", "evaluate", "reset"]);

function normalizeSyncAction(
  rawAction: string | undefined,
): "sync" | "upsert_facts" | "update_sources" | "withdraw" {
  const cleaned = String(rawAction ?? "sync")
    .trim()
    .toLowerCase();
  if (
    cleaned === "withdraw" ||
    cleaned === "retire" ||
    cleaned === "discard" ||
    cleaned === "revoke" ||
    cleaned === "fact.withdrawn"
  ) {
    return "withdraw";
  }
  if (
    cleaned === "update_sources" ||
    cleaned === "source_update" ||
    cleaned === "source_changed" ||
    cleaned === "source.changed" ||
    cleaned === "invalidate"
  ) {
    return "update_sources";
  }
  if (
    cleaned === "upsert_facts" ||
    cleaned === "upsert" ||
    cleaned === "approve" ||
    cleaned === "confirm" ||
    cleaned === "review" ||
    cleaned === "fact.confirmed"
  ) {
    return "upsert_facts";
  }
  return "sync";
}

export async function GET(request: Request) {
  const auth = await authorizeResearchFeedRequest(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { ok: false, error: auth.error, code: auth.code },
      {
        status: auth.statusCode,
        headers: {
          "Cache-Control": "private, no-store, max-age=0, must-revalidate",
        },
      },
    );
  }

  const url = new URL(request.url);
  if (url.searchParams.has("now") || url.searchParams.has("clear")) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Test clock and clear controls are excluded from production routes. Production eligibility always uses server time.",
        code: "PRODUCTION_TEST_CONTROL_FORBIDDEN",
      },
      {
        status: 400,
        headers: {
          "Cache-Control": "private, no-store, max-age=0, must-revalidate",
        },
      },
    );
  }

  const portSlug = url.searchParams.get("port")?.trim().toLowerCase() || undefined;
  const clusterId =
    url.searchParams.get("cluster")?.trim().toLowerCase() || undefined;
  const productId = url.searchParams.get("product_id")?.trim() || undefined;

  const ingestion = await ingestApprovedFactsFromReviewDesk({
    portSlug,
    clusterId,
    productId,
  });

  const verifiedFacts = productId
    ? getVerifiedFactsForExactProduct(ingestion.verified_facts, productId)
    : ingestion.verified_facts;

  return NextResponse.json(
    {
      ok: true,
      service: "dcc-research-approved-facts",
      auth_method: auth.authMethod,
      key_id: auth.keyId ?? null,
      evaluated_at: ingestion.evaluated_at,
      review_desk_url: ingestion.review_desk_url,
      live_portal_readback_status: ingestion.live_portal_readback_status,
      live_portal_verified: ingestion.live_portal_verified,
      access_blocker: ingestion.access_blocker,
      last_synced_at: ingestion.last_synced_at,
      total_evaluated: ingestion.total_evaluated,
      verified_count: verifiedFacts.length,
      verified_facts: verifiedFacts,
      all_evaluated_facts: ingestion.all_evaluated_facts,
      recommended_max_age_seconds: ingestion.recommended_max_age_seconds,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": ingestion.cache_control_header,
        "X-DCC-Approved-Facts-Count": String(verifiedFacts.length),
        "X-DCC-Recommended-Max-Age": String(
          ingestion.recommended_max_age_seconds,
        ),
      },
    },
  );
}

export async function POST(request: Request) {
  let rawBody = "";
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body.", code: "INVALID_BODY" },
      {
        status: 400,
        headers: {
          "Cache-Control": "private, no-store, max-age=0, must-revalidate",
        },
      },
    );
  }

  const auth = await authorizeResearchFeedRequest(request, rawBody);
  if (!auth.authorized) {
    return NextResponse.json(
      { ok: false, error: auth.error, code: auth.code },
      {
        status: auth.statusCode,
        headers: {
          "Cache-Control": "private, no-store, max-age=0, must-revalidate",
        },
      },
    );
  }

  // Enforce producer-only writes: consumer credentials must remain read-only
  if (
    auth.authMethod !== "hmac_service" ||
    !auth.keyId ||
    !isResearchProducerKey(auth.keyId)
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Consumer service credentials are read-only. Only the dedicated review-desk producer key (review_desk_service_key) is permitted to write to /api/internal/research/approved-facts.",
        code: "FORBIDDEN_CONSUMER_WRITE",
      },
      {
        status: 403,
        headers: {
          "Cache-Control": "private, no-store, max-age=0, must-revalidate",
        },
      },
    );
  }

  const url = new URL(request.url);
  if (url.searchParams.has("now") || url.searchParams.has("clear")) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Test clock and clear controls are excluded from production routes. Production eligibility always uses server time.",
        code: "PRODUCTION_TEST_CONTROL_FORBIDDEN",
      },
      {
        status: 400,
        headers: {
          "Cache-Control": "private, no-store, max-age=0, must-revalidate",
        },
      },
    );
  }

  let parsedBody: Record<string, unknown> = {};
  if (rawBody.trim().length > 0) {
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { ok: false, error: "Malformed JSON body.", code: "INVALID_JSON" },
        {
          status: 400,
          headers: {
            "Cache-Control": "private, no-store, max-age=0, must-revalidate",
          },
        },
      );
    }
  }

  // Unwrap optional envelope (`payload` or `data`) if present
  const envelope =
    parsedBody.payload && typeof parsedBody.payload === "object" && !Array.isArray(parsedBody.payload)
      ? { ...parsedBody, ...(parsedBody.payload as Record<string, unknown>) }
      : parsedBody.data && typeof parsedBody.data === "object" && !Array.isArray(parsedBody.data)
        ? { ...parsedBody, ...(parsedBody.data as Record<string, unknown>) }
        : parsedBody;

  const rawAction = String(
    envelope.action ?? envelope.event ?? envelope.type ?? "sync",
  ).trim();

  if (
    envelope.now !== undefined ||
    envelope.clear !== undefined ||
    FORBIDDEN_TEST_ACTIONS.has(rawAction.toLowerCase())
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Test clock (`now`), `clear`, and ephemeral `evaluate` controls are excluded from production routes. Use durable synchronization actions evaluated at server time.",
        code: "PRODUCTION_TEST_CONTROL_FORBIDDEN",
      },
      {
        status: 400,
        headers: {
          "Cache-Control": "private, no-store, max-age=0, must-revalidate",
        },
      },
    );
  }

  const normalizedAction = normalizeSyncAction(rawAction);

  const syncResult = await synchronizeReviewDeskToDurableStore({
    action: normalizedAction,
    sync_origin:
      typeof envelope.sync_origin === "string" && envelope.sync_origin.trim()
        ? envelope.sync_origin.trim()
        : `producer_${auth.keyId}`,
    cluster:
      typeof envelope.cluster === "string"
        ? envelope.cluster
        : typeof envelope.cluster_id === "string"
          ? envelope.cluster_id
          : undefined,
    replace_cluster: Boolean(envelope.replace_cluster),
    rows: envelope.rows as RawResearchDeskFactRow[] | undefined,
    verified_facts: envelope.verified_facts as RawResearchDeskFactRow[] | undefined,
    approved_facts: envelope.approved_facts as RawResearchDeskFactRow[] | undefined,
    eligible_facts: envelope.eligible_facts as RawResearchDeskFactRow[] | undefined,
    candidates: envelope.candidates as RawResearchDeskFactRow[] | undefined,
    facts: envelope.facts as
      | RawResearchDeskFactRow[]
      | Record<string, RawResearchDeskFactRow>
      | undefined,
    fact: envelope.fact as RawResearchDeskFactRow | undefined,
    withdraw_fact_ids: Array.isArray(envelope.withdraw_fact_ids)
      ? (envelope.withdraw_fact_ids as string[])
      : undefined,
    sources: envelope.sources as DurableResearchSyncMutation["sources"],
    source_fingerprints:
      envelope.source_fingerprints as DurableResearchSyncMutation["source_fingerprints"],
  });

  const evaluation = syncResult.evaluation;
  const productId =
    typeof envelope.product_id === "string" ? envelope.product_id.trim() : "";
  const verifiedFacts = productId
    ? getVerifiedFactsForExactProduct(evaluation.verified_facts, productId)
    : evaluation.verified_facts;

  return NextResponse.json(
    {
      ok: true,
      service: "dcc-research-approved-facts",
      action: normalizedAction,
      durable_persisted: syncResult.persisted,
      last_synced_at: syncResult.state.updated_at,
      auth_method: auth.authMethod,
      producer_key_id: auth.keyId,
      evaluated_at: evaluation.evaluated_at,
      total_evaluated: evaluation.total_evaluated,
      verified_count: verifiedFacts.length,
      verified_facts: verifiedFacts,
      all_evaluated_facts: evaluation.all_evaluated_facts,
      recommended_max_age_seconds: evaluation.recommended_max_age_seconds,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": evaluation.cache_control_header,
        "X-DCC-Approved-Facts-Count": String(verifiedFacts.length),
        "X-DCC-Recommended-Max-Age": String(
          evaluation.recommended_max_age_seconds,
        ),
      },
    },
  );
}
