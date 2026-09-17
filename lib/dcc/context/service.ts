import crypto from "crypto";
import { and, eq, gt } from "drizzle-orm";
import { getDb, type DccDb } from "@/lib/db/client";
import { dccContexts, type DccContextRow } from "@/lib/db/schema";
import {
  DccContextIssueRequestSchema,
  DccContextRedeemResponseSchema,
  buildScopedIdempotencyKey,
  type DccContextIssueRequest,
  type DccContextRedeemResponse,
} from "./schema";
import {
  DCC_CANONICAL_OWNERS,
  getAuthoritativeSafetyProfile,
  resolveAuthoritativeBuffer,
  resolveCanonicalOwner,
  resolveSourceSite,
} from "./registry";

export const DCC_CONTEXT_TTL_MS = 15 * 60 * 1000; // 15 minutes (900,000 ms)

export interface IssueContextResult {
  success: true;
  contextId: string;
  version: "1.0";
  issuedAt: number;
  expiresAt: number;
  status: "issued";
  bridgeUrl: string;
  idempotencyReplay?: boolean;
}

export type RedeemContextResult =
  | { success: true; data: DccContextRedeemResponse }
  | {
      success: false;
      statusCode: 400 | 403 | 404 | 409 | 410 | 500;
      errorCode:
        | "CONTEXT_NOT_FOUND"
        | "CONTEXT_ALREADY_REDEEMED"
        | "CONTEXT_EXPIRED"
        | "OWNER_MISMATCH"
        | "INVALID_OWNER"
        | "DATABASE_UNAVAILABLE";
      message: string;
    };

export function hashContextId(contextId: string): string {
  return crypto.createHash("sha256").update(contextId).digest("hex");
}

function calculateReturnSchedule(
  scheduleDate: string,
  departureTime: string | null | undefined,
  bufferMinutes: number
): {
  latestSafeReturnDate: string | null;
  latestSafeReturnTime: string | null;
  midnightCrossed: boolean;
} {
  if (!departureTime) {
    return {
      latestSafeReturnDate: null,
      latestSafeReturnTime: null,
      midnightCrossed: false,
    };
  }

  const [dh, dm] = departureTime.split(":").map(Number);
  const depMinutes = dh * 60 + dm;
  let returnMinutes = depMinutes - bufferMinutes;
  let midnightCrossed = false;
  let latestSafeReturnDate = scheduleDate;

  if (returnMinutes < 0) {
    returnMinutes += 1440;
    midnightCrossed = true;
    const d = new Date(`${scheduleDate}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 1);
    latestSafeReturnDate = d.toISOString().split("T")[0];
  }

  const retH = String(Math.floor(returnMinutes / 60)).padStart(2, "0");
  const retM = String(returnMinutes % 60).padStart(2, "0");

  return {
    latestSafeReturnDate,
    latestSafeReturnTime: `${retH}:${retM}`,
    midnightCrossed,
  };
}

export function formatRedeemedResponse(row: DccContextRow): DccContextRedeemResponse {
  return {
    contextId: row.contextId,
    version: "1.0",
    status: "redeemed",
    sourceSite: row.sourceSite,
    destination: row.destination,
    targetOwner: row.targetOwner,
    targetIntent: row.targetIntent,
    timezone: row.timezone,
    schedule: {
      date: row.scheduleDate,
      arrival: row.arrival,
      departure: row.departure,
      travelers: row.travelers,
      shipOrVenue: row.shipOrVenue,
    },
    safetyConstraint: {
      bufferMinutes: row.bufferMinutes,
      latestSafeReturnDate: row.latestSafeReturnDate,
      latestSafeReturnTime: row.latestSafeReturnTime,
      midnightCrossed: row.midnightCrossed,
    },
    attribution: row.attribution || undefined,
    issuedAt: row.issuedAt.getTime(),
    expiresAt: row.expiresAt.getTime(),
    redeemedAt: row.redeemedAt?.getTime() || Date.now(),
    redeemedBy: row.redeemedBy || row.targetOwner,
  };
}

/**
 * Issues a new opaque DCC context token.
 * Server strictly calculates authoritative buffer, return windows, and TTL.
 */
export async function issueContext(
  rawInput: unknown,
  options?: { now?: number; dbOverride?: DccDb | null }
): Promise<IssueContextResult> {
  const input: DccContextIssueRequest = DccContextIssueRequestSchema.parse(rawInput);
  const now = options?.now ?? Date.now();
  const issuedAtDate = new Date(now);
  const expiresAtDate = new Date(now + DCC_CONTEXT_TTL_MS);

  // 1. Authoritative Safety & Timezone Resolution
  const profile = getAuthoritativeSafetyProfile(input.destination);
  const owner = resolveCanonicalOwner(input.targetOwner);
  const authoritativeBuffer = resolveAuthoritativeBuffer(
    input.destination,
    input.safetyOverride?.bufferMinutes,
    input.operatorModifier
  );

  const scheduleCalc = calculateReturnSchedule(
    input.schedule.date,
    input.schedule.departure,
    authoritativeBuffer
  );

  // 2. Scoped Idempotency Key Handling
  const scopedKey = buildScopedIdempotencyKey(
    input.sourceSite,
    input.targetOwner,
    input.idempotencyKey
  );

  const db = options?.dbOverride !== undefined ? options.dbOverride : getDb();

  if (db && scopedKey) {
    const existing = await db
      .select()
      .from(dccContexts)
      .where(eq(dccContexts.idempotencyKey, scopedKey))
      .limit(1);

    if (existing.length > 0) {
      const row = existing[0];
      const owner = DCC_CANONICAL_OWNERS[row.targetOwner];
      const bridgeUrl = `https://${owner?.canonicalDomain || "destinationcommandcenter.com"}/book?ctx=${row.contextId}`;
      return {
        success: true,
        contextId: row.contextId,
        version: "1.0",
        issuedAt: row.issuedAt.getTime(),
        expiresAt: row.expiresAt.getTime(),
        status: "issued",
        bridgeUrl,
        idempotencyReplay: true,
      };
    }
  }

  // 3. Generate Secure Opaque Identifier & Hash
  const rawIdBytes = crypto.randomBytes(16).toString("hex");
  const contextId = `dcc_ctx_${rawIdBytes}`;
  const contextHash = hashContextId(contextId);

  // 4. Persist to Database
  if (db) {
    try {
      await db.insert(dccContexts).values({
        contextId,
        contextHash,
        idempotencyKey: scopedKey,
        version: "1.0",
        status: "issued",
        sourceSite: input.sourceSite,
        destination: input.destination,
        targetOwner: owner ? owner.canonicalDomain : input.targetOwner,
        targetIntent: input.targetIntent || null,
        timezone: profile.timezone,
        scheduleDate: input.schedule.date,
        arrival: input.schedule.arrival || null,
        departure: input.schedule.departure || null,
        travelers: input.schedule.travelers,
        shipOrVenue: input.schedule.shipOrVenue || null,
        bufferMinutes: authoritativeBuffer,
        latestSafeReturnDate: scheduleCalc.latestSafeReturnDate,
        latestSafeReturnTime: scheduleCalc.latestSafeReturnTime,
        midnightCrossed: scheduleCalc.midnightCrossed,
        attribution: input.attribution || null,
        issuedAt: issuedAtDate,
        expiresAt: expiresAtDate,
      });
    } catch (insertError: any) {
      // If concurrent race condition hit unique constraint on idempotencyKey
      if (scopedKey && (insertError?.code === "23505" || String(insertError).includes("dcc_contexts_idempotency_uidx"))) {
        const raceExisting = await db
          .select()
          .from(dccContexts)
          .where(eq(dccContexts.idempotencyKey, scopedKey))
          .limit(1);

        if (raceExisting.length > 0) {
          const row = raceExisting[0];
          const rowOwner = resolveCanonicalOwner(row.targetOwner);
          const bridgeUrl = `https://${rowOwner?.canonicalDomain || "destinationcommandcenter.com"}/book?ctx=${row.contextId}`;
          return {
            success: true,
            contextId: row.contextId,
            version: "1.0",
            issuedAt: row.issuedAt.getTime(),
            expiresAt: row.expiresAt.getTime(),
            status: "issued",
            bridgeUrl,
            idempotencyReplay: true,
          };
        }
      }
      throw insertError;
    }
  }

  const bridgeUrl = `https://${owner?.canonicalDomain || "destinationcommandcenter.com"}/book?ctx=${contextId}`;

  return {
    success: true,
    contextId,
    version: "1.0",
    issuedAt: now,
    expiresAt: now + DCC_CONTEXT_TTL_MS,
    status: "issued",
    bridgeUrl,
  };
}

/**
 * Atomically claims and redeems a context token.
 * Enforces single-use redemption, owner binding, and TTL expiration.
 */
export async function redeemContext(
  contextId: string,
  claimingOwner: string,
  options?: { now?: number; dbOverride?: DccDb | null }
): Promise<RedeemContextResult> {
  if (!contextId || !contextId.startsWith("dcc_ctx_")) {
    return {
      success: false,
      statusCode: 404,
      errorCode: "CONTEXT_NOT_FOUND",
      message: "Invalid context identifier format.",
    };
  }

  const resolvedClaimingOwner = resolveCanonicalOwner(claimingOwner);
  if (!resolvedClaimingOwner) {
    return {
      success: false,
      statusCode: 403,
      errorCode: "INVALID_OWNER",
      message: `Claiming owner '${claimingOwner}' is not a registered canonical booking owner.`,
    };
  }

  const db = options?.dbOverride !== undefined ? options.dbOverride : getDb();
  if (!db) {
    return {
      success: false,
      statusCode: 500,
      errorCode: "DATABASE_UNAVAILABLE",
      message: "Database connection is not configured.",
    };
  }

  const now = options?.now ? new Date(options.now) : new Date();
  const contextHash = hashContextId(contextId);
  const normalizedClaimingDomain = resolvedClaimingOwner.canonicalDomain;

  // 1. ATOMIC UPDATE QUERY (Guaranteed Single-Winner Concurrency Lock)
  const updated = await db
    .update(dccContexts)
    .set({
      status: "redeemed",
      redeemedAt: now,
      redeemedBy: normalizedClaimingDomain,
      updatedAt: now,
    })
    .where(
      and(
        eq(dccContexts.contextHash, contextHash),
        eq(dccContexts.status, "issued"),
        eq(dccContexts.targetOwner, normalizedClaimingDomain),
        gt(dccContexts.expiresAt, now)
      )
    )
    .returning();

  if (updated.length === 1) {
    return {
      success: true,
      data: formatRedeemedResponse(updated[0]),
    };
  }

  // 2. Failure Diagnostic (Query row to return exact rejection reason)
  const existing = await db
    .select()
    .from(dccContexts)
    .where(eq(dccContexts.contextHash, contextHash))
    .limit(1);

  if (existing.length === 0) {
    return {
      success: false,
      statusCode: 404,
      errorCode: "CONTEXT_NOT_FOUND",
      message: "Context token does not exist.",
    };
  }

  const row = existing[0];

  if (row.targetOwner !== normalizedClaimingDomain) {
    return {
      success: false,
      statusCode: 403,
      errorCode: "OWNER_MISMATCH",
      message: `Context token was issued for owner '${row.targetOwner}', but claimed by '${claimingOwner}'.`,
    };
  }

  if (row.status === "redeemed") {
    return {
      success: false,
      statusCode: 409,
      errorCode: "CONTEXT_ALREADY_REDEEMED",
      message: `Context token was already redeemed at ${row.redeemedAt?.toISOString()} by '${row.redeemedBy}'. Replay attacks are prohibited.`,
    };
  }

  if (row.expiresAt <= now || row.status === "expired") {
    return {
      success: false,
      statusCode: 410,
      errorCode: "CONTEXT_EXPIRED",
      message: `Context token expired at ${row.expiresAt.toISOString()}.`,
    };
  }

  return {
    success: false,
    statusCode: 400,
    errorCode: "CONTEXT_NOT_FOUND",
    message: `Context is in '${row.status}' state and cannot be claimed.`,
  };
}

export type RevokeContextResult =
  | { success: true; contextId: string; status: "revoked"; revokedAt: number; revokedBy: string }
  | {
      success: false;
      statusCode: 400 | 403 | 404 | 500;
      errorCode: "CONTEXT_NOT_FOUND" | "UNAUTHORIZED" | "ALREADY_REDEEMED" | "DATABASE_UNAVAILABLE";
      message: string;
    };

/**
 * Authenticated revocation of an unredeemed context token.
 */
export async function revokeContext(
  contextId: string,
  requestedBy: string,
  reason?: string,
  options?: { now?: number; dbOverride?: DccDb | null }
): Promise<RevokeContextResult> {
  if (!contextId || !contextId.startsWith("dcc_ctx_")) {
    return {
      success: false,
      statusCode: 404,
      errorCode: "CONTEXT_NOT_FOUND",
      message: "Invalid context identifier format.",
    };
  }

  const db = options?.dbOverride !== undefined ? options.dbOverride : getDb();
  if (!db) {
    return {
      success: false,
      statusCode: 500,
      errorCode: "DATABASE_UNAVAILABLE",
      message: "Database connection is not configured.",
    };
  }

  const now = options?.now ? new Date(options.now) : new Date();
  const contextHash = hashContextId(contextId);

  const updated = await db
    .update(dccContexts)
    .set({
      status: "revoked",
      updatedAt: now,
    })
    .where(
      and(
        eq(dccContexts.contextHash, contextHash),
        eq(dccContexts.status, "issued")
      )
    )
    .returning();

  if (updated.length === 1) {
    return {
      success: true,
      contextId,
      status: "revoked",
      revokedAt: now.getTime(),
      revokedBy: requestedBy,
    };
  }

  const existing = await db
    .select()
    .from(dccContexts)
    .where(eq(dccContexts.contextHash, contextHash))
    .limit(1);

  if (existing.length === 0) {
    return {
      success: false,
      statusCode: 404,
      errorCode: "CONTEXT_NOT_FOUND",
      message: "Context token does not exist.",
    };
  }

  const row = existing[0];
  if (row.status === "redeemed") {
    return {
      success: false,
      statusCode: 400,
      errorCode: "ALREADY_REDEEMED",
      message: "Cannot revoke a context token that has already been redeemed.",
    };
  }

  return {
    success: true,
    contextId,
    status: "revoked",
    revokedAt: now.getTime(),
    revokedBy: requestedBy,
  };
}