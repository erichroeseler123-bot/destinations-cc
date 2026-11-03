import { NextResponse } from "next/server";
import { verifyServiceRequestHeaders } from "@/lib/dcc/auth/hmac-service-auth";
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

function authorizeResearchFeedRequest(
  request: Request,
  rawBody?: string,
): {
  authorized: boolean;
  statusCode: 401 | 403 | 429;
  error?: string;
  code?: string;
  authMethod?: "hmac_service" | "internal_secret" | "portal_token" | "admin_key";
} {
  const url = new URL(request.url);

  // 1. Check HMAC service headers if provided
  if (
    request.headers.get("x-dcc-signature") ||
    request.headers.get("x-dcc-key-id")
  ) {
    const verify = verifyServiceRequestHeaders({
      headers: request.headers,
      method: request.method,
      pathname: url.pathname,
      searchParams: url.searchParams,
      body: rawBody,
    });
    if (!verify.authorized) {
      return {
        authorized: false,
        statusCode: verify.statusCode,
        error: verify.error,
        code: verify.code,
      };
    }
    return {
      authorized: true,
      statusCode: 401,
      authMethod: "hmac_service",
    };
  }

  // 2. Check INTERNAL_API_SECRET or DCC_PORTAL_TOKEN / DCC_CP_SERVICE_SECRET bearer
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
      statusCode: 401,
      authMethod: "internal_secret",
    };
  }

  if (
    portalToken &&
    (portalHeaderSecret === portalToken || bearerSecret === portalToken)
  ) {
    return {
      authorized: true,
      statusCode: 401,
      authMethod: "portal_token",
    };
  }

  // 3. Check Admin access key
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
      statusCode: 401,
      authMethod: "admin_key",
    };
  }

  return {
    authorized: false,
    statusCode: 401,
    error:
      "Unauthorized. Approved research fact feed requires service HMAC or internal credentials.",
    code: "UNAUTHORIZED",
  };
}

const ALLOWED_PRODUCTION_SYNC_ACTIONS = new Set([
  "sync",
  "upsert_facts",
  "update_sources",
  "withdraw",
]);

export async function GET(request: Request) {
  const auth = authorizeResearchFeedRequest(request);
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

  const auth = authorizeResearchFeedRequest(request, rawBody);
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

  let body: {
    action?: string;
    sync_origin?: string;
    cluster?: string;
    replace_cluster?: boolean;
    rows?: RawResearchDeskFactRow[];
    verified_facts?: RawResearchDeskFactRow[];
    candidates?: RawResearchDeskFactRow[];
    facts?: RawResearchDeskFactRow[];
    withdraw_fact_ids?: string[];
    sources?: DurableResearchSyncMutation["sources"];
    source_fingerprints?: DurableResearchSyncMutation["source_fingerprints"];
    product_id?: string;
    now?: unknown;
  } = {};

  if (rawBody.trim().length > 0) {
    try {
      body = JSON.parse(rawBody);
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

  const requestedAction = body.action ? String(body.action).trim() : "sync";
  if (
    body.now !== undefined ||
    !ALLOWED_PRODUCTION_SYNC_ACTIONS.has(requestedAction)
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Test clock (`now`), `clear`, and ephemeral `evaluate` controls are excluded from production routes. Use durable synchronization actions (`sync`, `upsert_facts`, `update_sources`, `withdraw`) evaluated at server time.",
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

  const syncResult = await synchronizeReviewDeskToDurableStore({
    action: requestedAction as DurableResearchSyncMutation["action"],
    sync_origin: body.sync_origin || `api_${auth.authMethod || "authenticated"}`,
    cluster: body.cluster,
    replace_cluster: body.replace_cluster,
    rows: body.rows,
    verified_facts: body.verified_facts,
    candidates: body.candidates,
    facts: body.facts,
    withdraw_fact_ids: body.withdraw_fact_ids,
    sources: body.sources,
    source_fingerprints: body.source_fingerprints,
  });

  const evaluation = syncResult.evaluation;
  const verifiedFacts = body.product_id
    ? getVerifiedFactsForExactProduct(evaluation.verified_facts, body.product_id)
    : evaluation.verified_facts;

  return NextResponse.json(
    {
      ok: true,
      service: "dcc-research-approved-facts",
      action: requestedAction,
      durable_persisted: syncResult.persisted,
      last_synced_at: syncResult.state.updated_at,
      auth_method: auth.authMethod,
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
