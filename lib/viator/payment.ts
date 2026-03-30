import fs from "fs";
import path from "path";
import { normalizeViatorPaymentSession, type ViatorPaymentSession } from "@/lib/viator/schema";

const HOLD_DIR = path.join(process.cwd(), "data", "orders", "viator-holds");
const PAYMENT_DIR = path.join(process.cwd(), "data", "orders", "viator-payments");

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
  }
  return null;
}

export function readViatorHoldArtifact(preparationId: string): unknown | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(HOLD_DIR, `${preparationId}.json`), "utf8")) as unknown;
  } catch {
    return null;
  }
}

export function extractViatorPaymentSession(preparationId: string, artifact: unknown): ViatorPaymentSession {
  const root = asRecord(artifact);
  const response = asRecord(root?.response);
  const draft = asRecord(root?.draft);

  return normalizeViatorPaymentSession({
    preparationId,
    paymentDataSubmissionMode: firstString(
      response?.paymentDataSubmissionMode,
      draft?.paymentDataSubmissionMode
    ) as "PARTNER_FORM" | "VIATOR_FORM" | null,
    paymentDataSubmissionUrl: firstString(response?.paymentDataSubmissionUrl),
    paymentSessionToken: firstString(response?.paymentSessionToken),
    hostingUrl: firstString(response?.hostingUrl, draft?.hostingUrl),
  });
}

export function writeViatorPaymentArtifact(input: {
  preparationId: string;
  session: ViatorPaymentSession;
  response: unknown;
}) {
  fs.mkdirSync(PAYMENT_DIR, { recursive: true });
  const filePath = path.join(PAYMENT_DIR, `${input.preparationId}.json`);
  fs.writeFileSync(
    filePath,
    `${JSON.stringify(
      {
        updatedAt: new Date().toISOString(),
        session: input.session,
        response: input.response,
      },
      null,
      2
    )}\n`
  );
  return filePath;
}

export function readViatorPaymentArtifact(preparationId: string): unknown | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(PAYMENT_DIR, `${preparationId}.json`), "utf8")) as unknown;
  } catch {
    return null;
  }
}
