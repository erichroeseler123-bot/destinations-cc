import fs from "fs";
import path from "path";
import { buildViatorCartBookPayload } from "@/lib/viator/book";

const CANCEL_DIR = path.join(process.cwd(), "data", "orders", "viator-cancellations");

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
  }
  return null;
}

export function resolveViatorBookingReference(preparationId: string): {
  bookingReference: string | null;
  partnerBookingRef: string | null;
} {
  const draft = buildViatorCartBookPayload({ preparationId });
  return {
    bookingReference: firstString(draft.bookingRef, draft.partnerBookingRef),
    partnerBookingRef: draft.partnerBookingRef,
  };
}

export function extractCancelReasons(value: unknown): Array<{ reasonCode: string; label: string }> {
  const root = asRecord(value);
  const rows = Array.isArray(root?.reasons)
    ? root?.reasons
    : Array.isArray(value)
      ? value
      : [];
  return rows
    .map((row) => {
      const record = asRecord(row);
      const reasonCode = firstString(
        record?.reasonCode,
        record?.code,
        record?.cancellationReasonCode
      );
      const label = firstString(record?.label, record?.reason, record?.description, record?.name);
      if (!reasonCode || !label) return null;
      return { reasonCode, label };
    })
    .filter((row): row is { reasonCode: string; label: string } => Boolean(row));
}

export function buildViatorCancelPayload(input: {
  preparationId: string;
  cancellationReasonCode?: string | null;
  rawOverrides?: Record<string, unknown>;
}) {
  const refs = resolveViatorBookingReference(input.preparationId);
  return {
    bookingReference: refs.bookingReference,
    payload: {
      cancellationReasonCode:
        typeof input.cancellationReasonCode === "string" && input.cancellationReasonCode.trim().length > 0
          ? input.cancellationReasonCode.trim()
          : null,
      ...(input.rawOverrides || {}),
    },
  };
}

export function writeViatorCancellationArtifact(input: {
  preparationId: string;
  kind: "reasons" | "quote" | "cancel";
  payload: Record<string, unknown>;
  response: unknown;
}) {
  fs.mkdirSync(CANCEL_DIR, { recursive: true });
  const filePath = path.join(CANCEL_DIR, `${input.preparationId}.${input.kind}.json`);
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
