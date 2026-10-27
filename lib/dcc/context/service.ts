import crypto from "crypto";
import { and, eq, gt, lte } from "drizzle-orm";
import { getDb, type DccDb } from "@/lib/db/client";
import { dccContexts, dccInvalidatedSessions, type DccContextRow } from "@/lib/db/schema";
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
  isOwnerEnabled,
  resolveAuthoritativeBuffer,
  resolveCanonicalOwner,
  resolveSourceSite,
} from "./registry";

export const DCC_CONTEXT_TTL_MS = 15 * 60 * 1000; // 15 minutes (900,000 ms) short-lived redemption token TTL
export const DCC_TRIP_CONTEXT_RETENTION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days longer-lived trip context retention

export type DccContextReplayPolicy =
  | "same_owner_idempotent_within_ttl"
  | "strict_single_use";

export const DCC_CONTEXT_REPLAY_POLICY_SPEC = {
  defaultPolicy: "same_owner_idempotent_within_ttl" as const,
  supportedPolicies: [
    "same_owner_idempotent_within_ttl",
    "strict_single_use",
  ] as const,
  description:
    "Under 'same_owner_idempotent_within_ttl', the canonical target owner that first redeemed the token may re-verify it idempotently within its 15-minute TTL (supporting edge-to-SSR hydration), while any other owner is rejected with 403 OWNER_MISMATCH. Under 'strict_single_use', any second redemption attempt—even by the same canonical target owner—fails closed with 409 CONTEXT_ALREADY_REDEEMED.",
} as const;

const memoryContextsByHash = new Map<string, DccContextRow>();
const memoryContextsByIdempotencyKey = new Map<string, DccContextRow>();

export function clearMemoryStore(): void {
  memoryContextsByHash.clear();
  memoryContextsByIdempotencyKey.clear();
}

export interface IssueContextResult {
  success: true;
  contextId: string;
  version: "1.0";
  issuedAt: number;
  expiresAt: number;
  tripContextExpiresAt?: number;
  status: "issued";
  bridgeUrl: string;
  idempotencyReplay?: boolean;
}

export type RedeemContextResult =
  | { success: true; data: DccContextRedeemResponse; idempotencyReplay?: boolean }
  | {
      success: false;
      statusCode: 400 | 403 | 404 | 409 | 410 | 500;
      errorCode:
        | "CONTEXT_NOT_FOUND"
        | "CONTEXT_ALREADY_REDEEMED"
        | "CONTEXT_EXPIRED"
        | "CONTEXT_REVOKED"
        | "OWNER_MISMATCH"
        | "OWNER_DISABLED"
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
    attribution:
      row.attribution && Object.keys(row.attribution).length > 0
        ? row.attribution
        : undefined,
    issuedAt: row.issuedAt.getTime(),
    expiresAt: row.expiresAt.getTime(),
    redeemedAt: row.redeemedAt?.getTime() || Date.now(),
    redeemedBy: row.redeemedBy || row.targetOwner,
  };
}

export function resolveOwnerBaseUrl(ownerId: string): string {
  const sanitized = ownerId.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase();
  const stagingOverride =
    process.env[`DCC_${sanitized}_BASE_URL`]?.trim() ||
    process.env[`${sanitized}_STAGING_URL`]?.trim() ||
    (ownerId === "juneauflightdeck" ? (process.env.JFD_STAGING_URL?.trim() || process.env.DCC_JFD_STAGING_BASE_URL?.trim() || process.env.DCC_JFD_BASE_URL?.trim()) : undefined);

  if (stagingOverride) {
    return stagingOverride.replace(/\/+$/, "");
  }

  const owner = resolveCanonicalOwner(ownerId);
  return `https://${owner?.canonicalDomain || "destinationcommandcenter.com"}`;
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
    input.additionalPreferenceBufferMinutes,
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
      memoryContextsByHash.set(row.contextHash, row);
      const bridgeUrl = `${resolveOwnerBaseUrl(row.targetOwner)}/book?ctx=${row.contextId}`;
      return {
        success: true,
        contextId: row.contextId,
        version: "1.0",
        issuedAt: row.issuedAt.getTime(),
        expiresAt: row.expiresAt.getTime(),
        tripContextExpiresAt: row.issuedAt.getTime() + DCC_TRIP_CONTEXT_RETENTION_MS,
        status: "issued",
        bridgeUrl,
        idempotencyReplay: true,
      };
    }
  } else if (!db && scopedKey) {
    const memIdem = memoryContextsByIdempotencyKey.get(scopedKey);
    if (memIdem) {
      const bridgeUrl = `${resolveOwnerBaseUrl(memIdem.targetOwner)}/book?ctx=${memIdem.contextId}`;
      return {
        success: true,
        contextId: memIdem.contextId,
        version: "1.0",
        issuedAt: memIdem.issuedAt.getTime(),
        expiresAt: memIdem.expiresAt.getTime(),
        tripContextExpiresAt: memIdem.issuedAt.getTime() + DCC_TRIP_CONTEXT_RETENTION_MS,
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

  const rowToStore: DccContextRow = {
    contextId,
    contextHash,
    idempotencyKey: scopedKey,
    version: "1.0",
    status: "issued",
    sourceSite: input.sourceSite,
    destination: input.destination,
    targetOwner: owner ? owner.id : input.targetOwner,
    targetIntent: input.targetIntent || "general",
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
    attribution: input.attribution || {},
    issuedAt: issuedAtDate,
    expiresAt: expiresAtDate,
    redeemedAt: null,
    redeemedBy: null,
    createdAt: issuedAtDate,
    updatedAt: issuedAtDate,
  };

  memoryContextsByHash.set(contextHash, rowToStore);
  if (scopedKey) {
    memoryContextsByIdempotencyKey.set(scopedKey, rowToStore);
  }

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
        targetOwner: owner ? owner.id : input.targetOwner,
        targetIntent: input.targetIntent || "general",
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
        attribution: input.attribution || {},
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
          memoryContextsByHash.set(row.contextHash, row);
          const bridgeUrl = `${resolveOwnerBaseUrl(row.targetOwner)}/book?ctx=${row.contextId}`;
          return {
            success: true,
            contextId: row.contextId,
            version: "1.0",
            issuedAt: row.issuedAt.getTime(),
            expiresAt: row.expiresAt.getTime(),
            tripContextExpiresAt: row.issuedAt.getTime() + DCC_TRIP_CONTEXT_RETENTION_MS,
            status: "issued",
            bridgeUrl,
            idempotencyReplay: true,
          };
        }
      }
      throw insertError;
    }
  }

  const bridgeUrl = `${resolveOwnerBaseUrl(owner ? owner.id : input.targetOwner)}/book?ctx=${contextId}`;

  return {
    success: true,
    contextId,
    version: "1.0",
    issuedAt: now,
    expiresAt: now + DCC_CONTEXT_TTL_MS,
    tripContextExpiresAt: now + DCC_TRIP_CONTEXT_RETENTION_MS,
    status: "issued",
    bridgeUrl,
  };
}

export interface InspectTripContextResult {
  success: true;
  contextId: string;
  version: "1.0";
  redemptionTokenState: "issued" | "redeemed" | "expired" | "revoked";
  tripContextState: "active" | "expired" | "revoked";
  redemptionExpiresAt: number;
  tripContextExpiresAt: number;
  sourceSite: string;
  destination: string;
  targetOwner: string;
  targetIntent: string | null;
  timezone: string;
  schedule: {
    date: string;
    arrival: string | null;
    departure: string | null;
    travelers: number;
    shipOrVenue: string | null;
  };
  safetyConstraint: {
    bufferMinutes: number;
    latestSafeReturnDate: string | null;
    latestSafeReturnTime: string | null;
    midnightCrossed: boolean;
  };
  attribution?: Record<string, unknown>;
}

/**
 * Reads the longer-lived trip context (dates, party size, ship/venue, safety buffer)
 * by opaque `contextId` (`dcc_ctx_...`) without consuming or altering the single-use
 * short-lived redemption token state.
 */
export async function inspectTripContext(
  contextId: string,
  options?: { now?: number; dbOverride?: DccDb | null },
): Promise<
  | InspectTripContextResult
  | {
      success: false;
      statusCode: 404 | 410;
      errorCode: "CONTEXT_NOT_FOUND" | "TRIP_CONTEXT_EXPIRED" | "CONTEXT_REVOKED";
      message: string;
    }
> {
  if (!contextId || !contextId.startsWith("dcc_ctx_")) {
    return {
      success: false,
      statusCode: 404,
      errorCode: "CONTEXT_NOT_FOUND",
      message: "Invalid context identifier format.",
    };
  }

  const nowMs = options?.now ?? Date.now();
  const contextHash = hashContextId(contextId);
  const db = options?.dbOverride !== undefined ? options.dbOverride : getDb();

  let row: DccContextRow | undefined = memoryContextsByHash.get(contextHash);
  if (db) {
    try {
      const existing = await db
        .select()
        .from(dccContexts)
        .where(eq(dccContexts.contextHash, contextHash))
        .limit(1);
      if (existing.length > 0) {
        row = existing[0];
        memoryContextsByHash.set(contextHash, row);
      }
    } catch {
      // Fallback to in-memory cache if DB read fails transiently
    }
  }

  if (!row) {
    return {
      success: false,
      statusCode: 404,
      errorCode: "CONTEXT_NOT_FOUND",
      message: "Context token does not exist.",
    };
  }

  if (row.status === "revoked") {
    return {
      success: false,
      statusCode: 410,
      errorCode: "CONTEXT_REVOKED",
      message: "Context token has been revoked.",
    };
  }

  const redemptionExpiresAt = row.expiresAt.getTime();
  const tripContextExpiresAt = row.issuedAt.getTime() + DCC_TRIP_CONTEXT_RETENTION_MS;

  if (nowMs > tripContextExpiresAt) {
    return {
      success: false,
      statusCode: 410,
      errorCode: "TRIP_CONTEXT_EXPIRED",
      message: "Trip context retention window has expired.",
    };
  }

  const redemptionTokenState: "issued" | "redeemed" | "expired" | "revoked" =
    row.status === "redeemed"
      ? "redeemed"
      : nowMs >= redemptionExpiresAt || row.status === "expired"
        ? "expired"
        : "issued";

  return {
    success: true,
    contextId: row.contextId,
    version: "1.0",
    redemptionTokenState,
    tripContextState: "active",
    redemptionExpiresAt,
    tripContextExpiresAt,
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
  };
}

/**
 * Atomically claims and redeems a context token.
 * Enforces single-use redemption, owner binding, and TTL expiration.
 */
export async function redeemContext(
  contextId: string,
  claimingOwner: string,
  options?: {
    now?: number;
    dbOverride?: DccDb | null;
    replayPolicy?: DccContextReplayPolicy;
    disabledOwners?: string[];
  }
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

  if (!isOwnerEnabled(resolvedClaimingOwner.id, options?.disabledOwners)) {
    return {
      success: false,
      statusCode: 403,
      errorCode: "OWNER_DISABLED",
      message: `Claiming owner '${resolvedClaimingOwner.id}' is currently disabled and cannot redeem trip contexts.`,
    };
  }

  const replayPolicy: DccContextReplayPolicy =
    options?.replayPolicy ?? DCC_CONTEXT_REPLAY_POLICY_SPEC.defaultPolicy;
  const now = options?.now ? new Date(options.now) : new Date();
  const contextHash = hashContextId(contextId);
  const normalizedClaimingId = resolvedClaimingOwner.id;

  const db = options?.dbOverride !== undefined ? options.dbOverride : getDb();
  if (!db) {
    if (options?.dbOverride === null) {
      return {
        success: false,
        statusCode: 500,
        errorCode: "DATABASE_UNAVAILABLE",
        message: "Database connection is not configured.",
      };
    }
    const memRow = memoryContextsByHash.get(contextHash);
    if (!memRow) {
      return {
        success: false,
        statusCode: 404,
        errorCode: "CONTEXT_NOT_FOUND",
        message: "Context token does not exist.",
      };
    }
    if (memRow.status === "revoked") {
      return {
        success: false,
        statusCode: 410,
        errorCode: "CONTEXT_REVOKED",
        message: "Context token has been revoked.",
      };
    }
    if (memRow.expiresAt <= now || memRow.status === "expired") {
      return {
        success: false,
        statusCode: 410,
        errorCode: "CONTEXT_EXPIRED",
        message: `Context token expired at ${memRow.expiresAt.toISOString()}.`,
      };
    }
    if (!isOwnerEnabled(memRow.targetOwner, options?.disabledOwners)) {
      return {
        success: false,
        statusCode: 403,
        errorCode: "OWNER_DISABLED",
        message: `Target owner '${memRow.targetOwner}' is currently disabled.`,
      };
    }
    if (memRow.targetOwner !== normalizedClaimingId) {
      return {
        success: false,
        statusCode: 403,
        errorCode: "OWNER_MISMATCH",
        message: `Context token was issued for owner '${memRow.targetOwner}', but claimed by '${claimingOwner}'.`,
      };
    }
    if (memRow.status === "redeemed") {
      if (
        replayPolicy === "same_owner_idempotent_within_ttl" &&
        memRow.redeemedBy === normalizedClaimingId &&
        memRow.targetOwner === normalizedClaimingId
      ) {
        return {
          success: true,
          data: formatRedeemedResponse(memRow),
          idempotencyReplay: true,
        };
      }
      return {
        success: false,
        statusCode: 409,
        errorCode: "CONTEXT_ALREADY_REDEEMED",
        message: `Context token was already redeemed at ${memRow.redeemedAt?.toISOString()} by '${memRow.redeemedBy}'. Replay policy '${replayPolicy}' prohibits re-redemption.`,
      };
    }
    const updatedMem: DccContextRow = {
      ...memRow,
      status: "redeemed",
      redeemedAt: now,
      redeemedBy: normalizedClaimingId,
      updatedAt: now,
    };
    memoryContextsByHash.set(contextHash, updatedMem);
    return {
      success: true,
      data: formatRedeemedResponse(updatedMem),
    };
  }

  // 1. ATOMIC UPDATE QUERY (Guaranteed Single-Winner Concurrency Lock)
  const updated = await db
    .update(dccContexts)
    .set({
      status: "redeemed",
      redeemedAt: now,
      redeemedBy: normalizedClaimingId,
      updatedAt: now,
    })
    .where(
      and(
        eq(dccContexts.contextHash, contextHash),
        eq(dccContexts.status, "issued"),
        eq(dccContexts.targetOwner, normalizedClaimingId),
        gt(dccContexts.expiresAt, now)
      )
    )
    .returning();

  if (updated.length === 1) {
    memoryContextsByHash.set(contextHash, updated[0]);
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
  memoryContextsByHash.set(contextHash, row);

  if (row.status === "revoked") {
    return {
      success: false,
      statusCode: 410,
      errorCode: "CONTEXT_REVOKED",
      message: "Context token has been revoked.",
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

  if (!isOwnerEnabled(row.targetOwner, options?.disabledOwners)) {
    return {
      success: false,
      statusCode: 403,
      errorCode: "OWNER_DISABLED",
      message: `Target owner '${row.targetOwner}' is currently disabled.`,
    };
  }

  if (row.targetOwner !== normalizedClaimingId) {
    return {
      success: false,
      statusCode: 403,
      errorCode: "OWNER_MISMATCH",
      message: `Context token was issued for owner '${row.targetOwner}', but claimed by '${claimingOwner}'.`,
    };
  }

  if (row.status === "redeemed") {
    if (
      replayPolicy === "same_owner_idempotent_within_ttl" &&
      row.redeemedBy === normalizedClaimingId &&
      row.targetOwner === normalizedClaimingId
    ) {
      return {
        success: true,
        data: formatRedeemedResponse(row),
        idempotencyReplay: true,
      };
    }

    return {
      success: false,
      statusCode: 409,
      errorCode: "CONTEXT_ALREADY_REDEEMED",
      message: `Context token was already redeemed at ${row.redeemedAt?.toISOString()} by '${row.redeemedBy}'. Replay policy '${replayPolicy}' prohibits re-redemption.`,
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

  const now = options?.now ? new Date(options.now) : new Date();
  const contextHash = hashContextId(contextId);

  const db = options?.dbOverride !== undefined ? options.dbOverride : getDb();
  if (!db) {
    if (options?.dbOverride === null) {
      return {
        success: false,
        statusCode: 500,
        errorCode: "DATABASE_UNAVAILABLE",
        message: "Database connection is not configured.",
      };
    }
    const memRow = memoryContextsByHash.get(contextHash);
    if (!memRow) {
      return {
        success: false,
        statusCode: 404,
        errorCode: "CONTEXT_NOT_FOUND",
        message: "Context token does not exist.",
      };
    }
    const updatedMem: DccContextRow = {
      ...memRow,
      status: "revoked",
      updatedAt: now,
    };
    memoryContextsByHash.set(contextHash, updatedMem);
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

  const updated = await db
    .update(dccContexts)
    .set({
      status: "revoked",
      updatedAt: now,
    })
    .where(eq(dccContexts.contextHash, contextHash))
    .returning();

  if (updated.length > 0) {
    memoryContextsByHash.set(contextHash, updated[0]);
  }

  return {
    success: true,
    contextId,
    status: "revoked",
    revokedAt: now.getTime(),
    revokedBy: requestedBy,
  };
}

/**
 * Durably records an invalidated / completed session in Neon PostgreSQL.
 */
export async function invalidateDccSession(
  sessionId: string,
  contextId: string,
  owner: string,
  reason?: string,
  options?: { dbOverride?: DccDb | null; expiresAt?: Date }
): Promise<{ success: boolean }> {
  const db = options?.dbOverride !== undefined ? options.dbOverride : getDb();
  if (!db) return { success: false };

  const expiresAt = options?.expiresAt || new Date(Date.now() + 3600 * 1000);
  try {
    await db
      .insert(dccInvalidatedSessions)
      .values({
        sessionId,
        contextId,
        owner,
        reason: reason || "Session completed or cancelled",
        expiresAt,
      })
      .onConflictDoNothing();
    return { success: true };
  } catch (err) {
    console.error("Failed to persist invalidated session:", err);
    return { success: false };
  }
}

export type CheckSessionInvalidationResult =
  | { success: true; isInvalidated: boolean }
  | { success: false; errorCode: "DATABASE_UNAVAILABLE"; message: string };

/**
 * Durably checks if a session ID is recorded in the Neon PostgreSQL invalidation table.
 * FAIL-CLOSED: If the database is unavailable or throws an error, returns success: false
 * so caller can reject the hydration attempt rather than erroneously treating it as valid.
 */
export async function isDccSessionInvalidated(
  sessionId: string,
  options?: { dbOverride?: DccDb | null; now?: number }
): Promise<CheckSessionInvalidationResult> {
  const db = options?.dbOverride !== undefined ? options.dbOverride : getDb();
  if (!db) {
    return {
      success: false,
      errorCode: "DATABASE_UNAVAILABLE",
      message: "Durable database is unavailable for session verification.",
    };
  }

  const now = options?.now ? new Date(options.now) : new Date();
  try {
    const rows = await db
      .select({ sessionId: dccInvalidatedSessions.sessionId })
      .from(dccInvalidatedSessions)
      .where(
        and(
          eq(dccInvalidatedSessions.sessionId, sessionId),
          gt(dccInvalidatedSessions.expiresAt, now)
        )
      )
      .limit(1);

    return {
      success: true,
      isInvalidated: rows.length > 0,
    };
  } catch (err: any) {
    console.error("Failed to check invalidated session in database:", err);
    return {
      success: false,
      errorCode: "DATABASE_UNAVAILABLE",
      message: err.message || "Failed to query session invalidation table.",
    };
  }
}

/**
 * Scheduled cleanup job: purges expired records from dcc_invalidated_sessions.
 */
export async function cleanupExpiredDccSessions(
  options?: { dbOverride?: DccDb | null; now?: number }
): Promise<{ success: boolean; deletedCount: number }> {
  const db = options?.dbOverride !== undefined ? options.dbOverride : getDb();
  if (!db) return { success: false, deletedCount: 0 };

  const now = options?.now ? new Date(options.now) : new Date();
  try {
    const deleted = await db
      .delete(dccInvalidatedSessions)
      .where(lte(dccInvalidatedSessions.expiresAt, now))
      .returning({ sessionId: dccInvalidatedSessions.sessionId });

    return {
      success: true,
      deletedCount: deleted.length,
    };
  } catch (err) {
    console.error("Failed to clean up expired sessions:", err);
    return { success: false, deletedCount: 0 };
  }
}

/**
 * Scheduled cleanup job: Transitions expired unredeemed context rows to 'expired' status
 * and purges stale unredeemed contexts older than the retention threshold (default 7 days).
 */
export async function cleanupExpiredDccContexts(
  options?: { dbOverride?: DccDb | null; now?: number; purgeOlderThanDays?: number }
): Promise<{ success: boolean; expiredCount: number; purgedCount: number }> {
  const db = options?.dbOverride !== undefined ? options.dbOverride : getDb();
  if (!db) return { success: false, expiredCount: 0, purgedCount: 0 };

  const now = options?.now ? new Date(options.now) : new Date();
  const purgeDays = options?.purgeOlderThanDays ?? 7;
  const purgeThreshold = new Date(now.getTime() - purgeDays * 24 * 60 * 60 * 1000);

  try {
    // 1. Mark unredeemed contexts past expiresAt as 'expired'
    const expiredRows = await db
      .update(dccContexts)
      .set({ status: "expired" })
      .where(
        and(
          eq(dccContexts.status, "issued"),
          lte(dccContexts.expiresAt, now)
        )
      )
      .returning({ contextId: dccContexts.contextId });

    // 2. Purge unredeemed expired contexts older than purge threshold
    const purgedRows = await db
      .delete(dccContexts)
      .where(
        and(
          eq(dccContexts.status, "expired"),
          lte(dccContexts.expiresAt, purgeThreshold)
        )
      )
      .returning({ contextId: dccContexts.contextId });

    return {
      success: true,
      expiredCount: expiredRows.length,
      purgedCount: purgedRows.length,
    };
  } catch (err) {
    console.error("Failed to clean up expired contexts:", err);
    return { success: false, expiredCount: 0, purgedCount: 0 };
  }
}