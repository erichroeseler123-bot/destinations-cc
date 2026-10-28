import { NextRequest, NextResponse } from "next/server";
import {
  DCC_CONTEXT_REPLAY_POLICY_SPEC,
  redeemContext,
  type DccContextReplayPolicy,
} from "@/lib/dcc/context/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ contextId: string }>;
}

/**
 * Edge/Middleware Redemption Endpoint (`/api/v1/context/:contextId/edge-redeem`).
 *
 * Used by receiving portfolio site middlewares when a traveler arrives with `?ctx=dcc_ctx_...`.
 * Atomically validates and redeems the opaque token against Neon PostgreSQL (`dcc_contexts`)
 * and returns ONLY non-sensitive redemption metadata (never returning PII).
 *
 * Fails closed on:
 * - Invented / unissued context -> 404 CONTEXT_NOT_FOUND
 * - Wrong target owner -> 403 OWNER_MISMATCH
 * - Disabled owner -> 403 OWNER_DISABLED
 * - Expired context -> 410 CONTEXT_EXPIRED
 * - Revoked context -> 410 CONTEXT_REVOKED
 * - Replay violation -> 409 CONTEXT_ALREADY_REDEEMED
 */
export async function POST(request: NextRequest, context: RouteParams) {
  const { contextId } = await Promise.resolve(context.params);

  let body: Record<string, unknown> = {};
  try {
    const raw = await request.text();
    if (raw.trim().length > 0) {
      body = JSON.parse(raw) as Record<string, unknown>;
    }
  } catch {
    return NextResponse.json(
      {
        ok: false,
        success: false,
        error: "INVALID_JSON",
        errorCode: "INVALID_JSON",
        message: "Malformed JSON request body.",
      },
      { status: 400 }
    );
  }

  const owner = String(
    body.owner ?? body.claimingOwner ?? request.headers.get("x-dcc-owner") ?? ""
  ).trim();

  if (!owner) {
    return NextResponse.json(
      {
        ok: false,
        success: false,
        error: "MISSING_CLAIMING_OWNER",
        errorCode: "MISSING_CLAIMING_OWNER",
        message: "Field 'owner' is required to redeem a trip context.",
      },
      { status: 400 }
    );
  }

  const replayPolicy: DccContextReplayPolicy =
    body.replayPolicy === "strict_single_use"
      ? "strict_single_use"
      : DCC_CONTEXT_REPLAY_POLICY_SPEC.defaultPolicy;

  const disabledOwners = Array.isArray(body.disabledOwners)
    ? body.disabledOwners.filter((x): x is string => typeof x === "string")
    : undefined;

  const result = await redeemContext(contextId, owner, {
    replayPolicy,
    disabledOwners,
  });

  if (!result.success) {
    return NextResponse.json(
      {
        ok: false,
        success: false,
        error: result.errorCode,
        errorCode: result.errorCode,
        message: result.message,
        replayPolicy,
      },
      { status: result.statusCode }
    );
  }

  const maxAgeSeconds = Math.max(
    60,
    Math.min(60 * 60 * 24, Math.floor((result.data.expiresAt - Date.now()) / 1000))
  );

  return NextResponse.json(
    {
      ok: true,
      success: true,
      contextId: result.data.contextId,
      targetOwner: result.data.targetOwner,
      redeemedBy: result.data.redeemedBy,
      sourceSite: result.data.sourceSite,
      destination: result.data.destination,
      targetIntent: result.data.targetIntent,
      timezone: result.data.timezone,
      schedule: result.data.schedule,
      safetyConstraint: result.data.safetyConstraint,
      idempotencyReplay: Boolean(result.idempotencyReplay),
      replayPolicy,
      maxAgeSeconds,
    },
    { status: 200 }
  );
}
