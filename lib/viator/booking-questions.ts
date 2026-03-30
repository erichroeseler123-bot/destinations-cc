import {
  getViatorBookingQuestionsCachePath,
  readViatorBookingQuestionsCache,
  writeViatorBookingQuestionsCache,
} from "@/lib/viator/cache";
import { getViatorClient } from "@/lib/viator/client";

export { getViatorBookingQuestionsCachePath, readViatorBookingQuestionsCache, writeViatorBookingQuestionsCache };

export type ViatorBookingQuestionSummary = {
  id: string;
  label: string;
  required: boolean;
  type: string | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
  }
  return null;
}

export function summarizeBookingQuestion(value: unknown, fallbackIndex = 0): ViatorBookingQuestionSummary | null {
  const record = asRecord(value);
  if (!record) return null;

  const id =
    firstString(record.id, record.questionId, record.bookingQuestionId, record.code, record.label) ||
    `question-${fallbackIndex + 1}`;

  const label =
    firstString(
      record.label,
      record.question,
      record.text,
      record.title,
      asRecord(record.localizedQuestion)?.text,
      asRecord(record.localizedLabel)?.text
    ) || id;

  const required =
    typeof record.required === "boolean"
      ? record.required
      : typeof record.mandatory === "boolean"
        ? record.mandatory
        : typeof record.isRequired === "boolean"
          ? record.isRequired
          : false;

  const type = firstString(record.type, record.questionType, record.dataType);

  return {
    id,
    label,
    required,
    type,
  };
}

export function summarizeBookingQuestions(values: unknown[]): ViatorBookingQuestionSummary[] {
  return values
    .map((value, index) => summarizeBookingQuestion(value, index))
    .filter((value): value is ViatorBookingQuestionSummary => Boolean(value));
}

export async function getCachedOrFetchViatorBookingQuestions(
  productCode: string,
  options: { forceRefresh?: boolean } = {}
): Promise<unknown[]> {
  if (!options.forceRefresh) {
    const cached = readViatorBookingQuestionsCache(productCode);
    if (cached.length > 0) return cached;
  }

  const questions = await getViatorClient().getProductBookingQuestions(productCode);
  writeViatorBookingQuestionsCache(productCode, questions);
  return questions;
}

