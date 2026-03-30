import fs from "fs";
import path from "path";
import { resolveViatorBookingReference } from "@/lib/viator/cancel";

const AMENDMENT_DIR = path.join(process.cwd(), "data", "orders", "viator-amendments");

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
  }
  return null;
}

export function extractAmendmentTypes(value: unknown): string[] {
  const root = asRecord(value);
  const types = Array.isArray(root?.amendmentTypes) ? root?.amendmentTypes : [];
  return types.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

export function buildViatorAmendmentQuotePayload(input: {
  preparationId: string;
  amendmentType?: string | null;
  travelDate?: string | null;
  rawOverrides?: Record<string, unknown>;
}) {
  const refs = resolveViatorBookingReference(input.preparationId);
  return {
    bookingReference: refs.bookingReference,
    payload: {
      bookingReference: refs.bookingReference,
      amendmentType:
        typeof input.amendmentType === "string" && input.amendmentType.trim().length > 0
          ? input.amendmentType.trim()
          : null,
      ...(typeof input.travelDate === "string" && input.travelDate.trim().length > 0
        ? { travelDate: input.travelDate.trim() }
        : {}),
      ...(input.rawOverrides || {}),
    },
  };
}

export function extractQuoteReference(value: unknown): string | null {
  const root = asRecord(value);
  return firstString(root?.quoteReference, root?.quoteRef, root?.reference);
}

export function writeViatorAmendmentArtifact(input: {
  preparationId: string;
  kind: "check" | "quote" | "amend";
  payload: Record<string, unknown>;
  response: unknown;
}) {
  fs.mkdirSync(AMENDMENT_DIR, { recursive: true });
  const filePath = path.join(AMENDMENT_DIR, `${input.preparationId}.${input.kind}.json`);
  fs.writeFileSync(
    filePath,
    `${JSON.stringify(
      {
        updatedAt: new Date().toISOString(),
        kind: input.kind,
        payload: input.payload,
        response: input.response,
      },
      null,
      2
    )}\n`
  );
  return filePath;
}
