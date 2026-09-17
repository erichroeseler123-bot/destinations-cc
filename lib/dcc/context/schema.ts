import { z } from "zod";
import { isValidCanonicalOwner, isValidSourceSite } from "./registry";

/**
 * 1. CLIENT REQUEST SCHEMA (Strict Input Validation)
 * Clients cannot supply contextId, issuedAt, expiresAt, status, or calculated dates.
 */
export const DccContextIssueRequestSchema = z.object({
  sourceSite: z
    .string()
    .min(1)
    .refine(isValidSourceSite, {
      message: "Source site is not cataloged in authoritative DCC registry",
    }),
  destination: z.string().min(1),
  targetOwner: z
    .string()
    .min(1)
    .refine(isValidCanonicalOwner, {
      message: "Target owner is not cataloged in authoritative DCC registry",
    }),
  targetIntent: z.string().optional(),
  
  schedule: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
    arrival: z.string().regex(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, "Arrival must be HH:mm").optional().nullable(),
    departure: z.string().regex(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, "Departure must be HH:mm").optional().nullable(),
    travelers: z.number().int().min(1).max(50).default(1),
    shipOrVenue: z.string().optional().nullable(),
  }),

  safetyOverride: z
    .object({
      bufferMinutes: z.number().int().min(0).max(360).optional(),
    })
    .optional(),

  attribution: z
    .object({
      feederSessionId: z.string().max(128).optional(),
      campaign: z.string().max(128).optional(),
      referrerDomain: z.string().max(256).optional(),
    })
    .optional(),
});

export type DccContextIssueRequest = z.infer<typeof DccContextIssueRequestSchema>;

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