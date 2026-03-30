import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { getViatorServerConfig } from "@/lib/viator/config";
import {
  normalizeViatorHoldRequestDraft,
  normalizeViatorPreparedBooking,
  type ViatorHoldRequestDraft,
  type ViatorPreparedBooking,
} from "@/lib/viator/schema";

const PREPARED_DIR = path.join(process.cwd(), "data", "orders", "viator-prepared");
const HOLD_DIR = path.join(process.cwd(), "data", "orders", "viator-holds");

export function readPreparedViatorBooking(preparationId: string): ViatorPreparedBooking | null {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(PREPARED_DIR, `${preparationId}.json`), "utf8")) as unknown;
    return normalizeViatorPreparedBooking(raw as ViatorPreparedBooking);
  } catch {
    return null;
  }
}

export function buildViatorCartHoldDraft(input: {
  prepared: ViatorPreparedBooking;
  contact: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
  rawOverrides?: Record<string, unknown>;
}): ViatorHoldRequestDraft {
  const config = getViatorServerConfig();
  const partnerBookingRef = `dcc-booking-${randomUUID()}`;
  const partnerCartRef = `dcc-cart-${randomUUID()}`;

  const bookingQuestionAnswers = Object.entries(input.prepared.answers).map(([questionId, answer]) => ({
    questionId,
    answer,
  }));

  const payload: Record<string, unknown> = {
    partnerBookingRef,
    partnerCartRef,
    currency: input.prepared.currency,
    travelDate: input.prepared.travelDate,
    items: input.prepared.selectedOption
      ? [
          {
            productCode: input.prepared.productCode,
            bookableItemId: input.prepared.selectedOption.id,
            startTime: input.prepared.selectedOption.startTime,
          },
        ]
      : [{ productCode: input.prepared.productCode }],
    paxMix: input.prepared.paxMix,
    bookingQuestionAnswers,
    communication: {
      fullName: [input.contact.firstName, input.contact.lastName].filter(Boolean).join(" ").trim() || null,
      email: input.contact.email || null,
      phone: input.contact.phone || null,
    },
    paymentDataSubmissionMode: config.bookingMode === "viator_form" ? "VIATOR_FORM" : "PARTNER_FORM",
    ...(config.bookingMode === "viator_form" && config.bookingHostingUrl
      ? { hostingUrl: config.bookingHostingUrl }
      : {}),
    ...(input.rawOverrides || {}),
  };

  return normalizeViatorHoldRequestDraft({
    preparationId: input.prepared.preparationId,
    partnerBookingRef,
    partnerCartRef,
    paymentDataSubmissionMode: payload.paymentDataSubmissionMode as "PARTNER_FORM" | "VIATOR_FORM",
    hostingUrl:
      typeof payload.hostingUrl === "string" && payload.hostingUrl.trim().length > 0
        ? payload.hostingUrl
        : null,
    payload,
  });
}

export function writeViatorHoldResult(input: {
  preparationId: string;
  draft: ViatorHoldRequestDraft;
  response: unknown;
  mode: "draft" | "executed";
}) {
  fs.mkdirSync(HOLD_DIR, { recursive: true });
  const filePath = path.join(HOLD_DIR, `${input.preparationId}.json`);
  fs.writeFileSync(
    filePath,
    `${JSON.stringify(
      {
        updatedAt: new Date().toISOString(),
        mode: input.mode,
        draft: input.draft,
        response: input.response,
      },
      null,
      2
    )}\n`
  );
  return filePath;
}
