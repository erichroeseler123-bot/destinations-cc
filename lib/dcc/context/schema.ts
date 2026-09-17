import { z } from "zod";
import {
  isValidCanonicalOwner,
  isValidDestination,
  isValidSourceSite,
  isOwnerValidForDestination,
} from "./registry";

/**
 * Validates real calendar date (1-12 months, 1-31 days, leap years, no phantom dates).
 */
export function isValidCalendarDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const dateObj = new Date(Date.UTC(year, month - 1, day));
  return (
    dateObj.getUTCFullYear() === year &&
    dateObj.getUTCMonth() === month - 1 &&
    dateObj.getUTCDate() === day
  );
}

/**
 * 1. CLIENT REQUEST SCHEMA (Strict Input Validation)
 * Uses .strict() to reject all unrecognized or client-injected authoritative fields.
 */
export const DccContextIssueRequestSchema = z
  .object({
    sourceSite: z
      .string()
      .min(1)
      .refine(isValidSourceSite, {
        message: "Source site is not cataloged in authoritative DCC registry",
      }),
    destination: z
      .string()
      .min(1)
      .refine(isValidDestination, {
        message: "Destination is not cataloged in authoritative DCC safety registry",
      }),
    targetOwner: z
      .string()
      .min(1)
      .refine(isValidCanonicalOwner, {
        message: "Target owner is not cataloged in authoritative DCC registry",
      }),
    targetIntent: z.string().optional(),
    operatorModifier: z.string().optional(),

    schedule: z
      .object({
        date: z
          .string()
          .refine(isValidCalendarDate, { message: "Schedule date must be a valid calendar date (YYYY-MM-DD)" }),
        arrival: z
          .string()
          .regex(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, "Arrival must be HH:mm 24-hour format")
          .optional()
          .nullable(),
        departure: z
          .string()
          .regex(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, "Departure must be HH:mm 24-hour format")
          .optional()
          .nullable(),
        travelers: z.number().int().min(1).max(50).default(1),
        shipOrVenue: z.string().max(128).optional().nullable(),
      })
      .strict(),

    safetyOverride: z
      .object({
        bufferMinutes: z.number().int().min(0).max(360).optional(),
      })
      .strict()
      .optional(),

    attribution: z
      .object({
        feederSessionId: z.string().max(128).optional(),
        campaign: z.string().max(128).optional(),
        referrerDomain: z.string().max(256).optional(),
      })
      .strict()
      .optional(),

    idempotencyKey: z.string().max(128).optional(),
  })
  .strict()
  .refine(
    (data) => isOwnerValidForDestination(data.targetOwner, data.destination),
    {
      message: "Target owner is not authorized to operate in the specified destination",
      path: ["targetOwner"],
    }
  );

export type DccContextIssueRequest = z.infer<typeof DccContextIssueRequestSchema>;

/**
 * Builds a composite idempotency key scoped by sourceSite and targetOwner.
 */
export function buildScopedIdempotencyKey(
  sourceSite: string,
  targetOwner: string,
  rawKey?: string | null
): string | null {
  if (!rawKey) return null;
  return `${sourceSite}:${targetOwner}:${rawKey.trim()}`;
}

/**
 * 2. STORED DATABASE RECORD SCHEMA
 */
export const DccContextRecordSchema = z.object({
  contextId: z.string().regex(/^dcc_ctx_[a-zA-Z0-9_-]{16,32}$/),
  contextHash: z.string().length(64), // sha256 hex
  idempotencyKey: z.string().nullable().optional(),
  version: z.literal("1.0"),
  status: z.enum(["issued", "redeemed", "expired", "revoked"]),
  sourceSite: z.string(),
  destination: z.string(),
  targetOwner: z.string(),
  targetIntent: z.string().nullable().optional(),
  timezone: z.string(),

  // Schedule
  scheduleDate: z.string(),
  arrival: z.string().nullable().optional(),
  departure: z.string().nullable().optional(),
  travelers: z.number().int().default(1),
  shipOrVenue: z.string().nullable().optional(),

  // Safety Constraints
  bufferMinutes: z.number().int().default(0),
  latestSafeReturnDate: z.string().nullable().optional(),
  latestSafeReturnTime: z.string().nullable().optional(),
  midnightCrossed: z.boolean().default(false),

  // Minimal Attribution
  attribution: z
    .object({
      feederSessionId: z.string().optional(),
      campaign: z.string().optional(),
      referrerDomain: z.string().optional(),
    })
    .nullable()
    .optional(),

  issuedAt: z.date(),
  expiresAt: z.date(),
  redeemedAt: z.date().nullable().optional(),
  redeemedBy: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type DccContextRecord = z.infer<typeof DccContextRecordSchema>;

/**
 * 3. AUTHORITATIVE OWNER REDEMPTION RESPONSE SCHEMA
 */
export const DccContextRedeemResponseSchema = z.object({
  contextId: z.string(),
  version: z.literal("1.0"),
  status: z.literal("redeemed"),
  sourceSite: z.string(),
  destination: z.string(),
  targetOwner: z.string(),
  targetIntent: z.string().nullable().optional(),
  timezone: z.string(),

  schedule: z.object({
    date: z.string(),
    arrival: z.string().nullable().optional(),
    departure: z.string().nullable().optional(),
    travelers: z.number().int(),
    shipOrVenue: z.string().nullable().optional(),
  }),

  safetyConstraint: z.object({
    bufferMinutes: z.number().int(),
    latestSafeReturnDate: z.string().nullable().optional(),
    latestSafeReturnTime: z.string().nullable().optional(),
    midnightCrossed: z.boolean(),
  }),

  attribution: z
    .object({
      feederSessionId: z.string().optional(),
      campaign: z.string().optional(),
      referrerDomain: z.string().optional(),
    })
    .nullable()
    .optional(),

  issuedAt: z.number(), // Epoch ms
  expiresAt: z.number(), // Epoch ms
  redeemedAt: z.number(), // Epoch ms
  redeemedBy: z.string(),
});

export type DccContextRedeemResponse = z.infer<typeof DccContextRedeemResponseSchema>;