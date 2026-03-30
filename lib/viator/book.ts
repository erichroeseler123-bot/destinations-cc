import fs from "fs";
import path from "path";
import { readViatorHoldArtifact, readViatorPaymentArtifact } from "@/lib/viator/payment";

const BOOKING_DIR = path.join(process.cwd(), "data", "orders", "viator-bookings");

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
  }
  return null;
}

function firstNestedString(root: Record<string, unknown> | null, key: string): string | null {
  if (!root) return null;
  const direct = root[key];
  if (typeof direct === "string" && direct.trim().length > 0) return direct.trim();
  const items = Array.isArray(root.items) ? root.items : [];
  for (const item of items) {
    const record = asRecord(item);
    const nested = record?.[key];
    if (typeof nested === "string" && nested.trim().length > 0) return nested.trim();
  }
  return null;
}

export function extractViatorPaymentToken(preparationId: string): string | null {
  const artifact = readViatorPaymentArtifact(preparationId);
  const root = asRecord(artifact);
  const response = asRecord(root?.response);
  return firstString(
    response?.sessionAccountToken,
    response?.paymentToken,
    firstNestedString(response, "sessionAccountToken"),
    firstNestedString(response, "paymentToken")
  );
}

export function buildViatorCartBookPayload(input: {
  preparationId: string;
  paymentToken?: string | null;
  rawOverrides?: Record<string, unknown>;
}) {
  const holdArtifact = readViatorHoldArtifact(input.preparationId);
  const holdRoot = asRecord(holdArtifact);
  const holdResponse = asRecord(holdRoot?.response);
  const holdDraft = asRecord(holdRoot?.draft);

  const bookingRef = firstString(
    holdResponse?.bookingRef,
    firstNestedString(holdResponse, "bookingRef"),
    holdDraft?.partnerBookingRef
  );
  const partnerBookingRef = firstString(
    holdResponse?.partnerBookingRef,
    firstNestedString(holdResponse, "partnerBookingRef"),
    holdDraft?.partnerBookingRef
  );
  const cartRef = firstString(
    holdResponse?.cartRef,
    firstNestedString(holdResponse, "cartRef"),
    holdDraft?.partnerCartRef
  );
  const partnerCartRef = firstString(
    holdResponse?.partnerCartRef,
    firstNestedString(holdResponse, "partnerCartRef"),
    holdDraft?.partnerCartRef
  );
  const paymentToken = firstString(input.paymentToken, extractViatorPaymentToken(input.preparationId));

  return {
    bookingRef,
    partnerBookingRef,
    cartRef,
    partnerCartRef,
    paymentToken,
    payload: {
      bookingRef,
      partnerBookingRef,
      cartRef,
      partnerCartRef,
      paymentToken,
      ...(input.rawOverrides || {}),
    },
  };
}

export function writeViatorBookingArtifact(input: {
  preparationId: string;
  payload: Record<string, unknown>;
  response: unknown;
  kind: "book" | "status";
}) {
  fs.mkdirSync(BOOKING_DIR, { recursive: true });
  const filePath = path.join(BOOKING_DIR, `${input.preparationId}.${input.kind}.json`);
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
