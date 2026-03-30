import {
  summarizeBookingQuestions,
  type ViatorBookingQuestionSummary,
} from "@/lib/viator/booking-questions";
import {
  normalizeViatorPrebookState,
  normalizeViatorPreparedBooking,
  type ViatorPassengerMixItem,
  type ViatorPreparedBooking,
  type ViatorPrebookState,
} from "@/lib/viator/schema";

function getBookableItems(payload: unknown): unknown[] {
  const record = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : null;
  if (Array.isArray(record?.bookableItems)) return record.bookableItems;
  if (Array.isArray(record?.items)) return record.items;
  return [];
}

function getFirstPrice(payload: unknown): number | null {
  const record = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : null;
  const candidates = [record?.totalPrice, record?.price, record?.fromPrice];
  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) return candidate;
  }
  return null;
}

function summarizeBookableOptions(payload: unknown) {
  return getBookableItems(payload).map((item, index) => {
    const record = item && typeof item === "object" ? (item as Record<string, unknown>) : null;
    const id =
      (typeof record?.bookableItemId === "string" && record.bookableItemId) ||
      (typeof record?.id === "string" && record.id) ||
      (typeof record?.productOptionCode === "string" && record.productOptionCode) ||
      `option-${index + 1}`;
    const label =
      (typeof record?.label === "string" && record.label) ||
      (typeof record?.productOptionTitle === "string" && record.productOptionTitle) ||
      (typeof record?.title === "string" && record.title) ||
      `Bookable option ${index + 1}`;
    const startTime =
      (typeof record?.startTime === "string" && record.startTime) ||
      (typeof record?.departureTime === "string" && record.departureTime) ||
      null;
    const price =
      typeof record?.totalPrice === "number"
        ? record.totalPrice
        : typeof record?.price === "number"
          ? record.price
          : null;
    return { id, label, startTime, price };
  });
}

function answerMap(input: unknown): Record<string, string> {
  if (!input || typeof input !== "object") return {};
  const output: Record<string, string> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (typeof value === "string" && value.trim().length > 0) {
      output[key] = value.trim();
    }
  }
  return output;
}

function annotateQuestions(
  questions: ViatorBookingQuestionSummary[],
  answers: Record<string, string>
) {
  return questions.map((question) => ({
    ...question,
    answered: typeof answers[question.id] === "string" && answers[question.id].trim().length > 0,
  }));
}

export function buildViatorPrebookState(input: {
  productCode: string;
  travelDate: string;
  currency: string;
  paxMix: ViatorPassengerMixItem[];
  bookingQuestionsRaw: unknown[];
  answers?: Record<string, unknown>;
  availabilityPayload: unknown;
}): ViatorPrebookState {
  const answers = answerMap(input.answers);
  const bookingQuestions = annotateQuestions(summarizeBookingQuestions(input.bookingQuestionsRaw), answers);
  const bookableOptions = summarizeBookableOptions(input.availabilityPayload);
  const optionCount = getBookableItems(input.availabilityPayload).length;
  const hasBookableItems = optionCount > 0;
  const firstPrice = getFirstPrice(input.availabilityPayload);
  const readyForHold =
    hasBookableItems && bookingQuestions.every((question) => !question.required || question.answered);

  return normalizeViatorPrebookState({
    productCode: input.productCode,
    travelDate: input.travelDate,
    currency: input.currency,
    paxMix: input.paxMix,
    bookableOptions,
    bookingQuestions,
    answers,
    availabilitySummary: {
      optionCount,
      hasBookableItems,
      firstPrice,
    },
    readyForHold,
  });
}

export function buildViatorPreparedBooking(input: {
  preparationId: string;
  createdAt: string;
  prebook: ViatorPrebookState;
  selectedOptionId?: string | null;
}): ViatorPreparedBooking {
  const selectedOption =
    input.selectedOptionId && input.prebook.bookableOptions.length > 0
      ? input.prebook.bookableOptions.find((option) => option.id === input.selectedOptionId) || null
      : input.prebook.bookableOptions.length === 1
        ? input.prebook.bookableOptions[0]
        : null;

  const missingRequiredAnswers = input.prebook.bookingQuestions
    .filter((question) => question.required && !question.answered)
    .map((question) => question.id);
  const missingSelectedOption = input.prebook.bookableOptions.length > 0 && !selectedOption;
  const readyForHold =
    input.prebook.readyForHold && missingRequiredAnswers.length === 0 && !missingSelectedOption;

  return normalizeViatorPreparedBooking({
    preparationId: input.preparationId,
    createdAt: input.createdAt,
    productCode: input.prebook.productCode,
    travelDate: input.prebook.travelDate,
    currency: input.prebook.currency,
    paxMix: input.prebook.paxMix,
    selectedOption,
    bookingQuestions: input.prebook.bookingQuestions,
    answers: input.prebook.answers,
    validation: {
      readyForHold,
      missingRequiredAnswers,
      missingSelectedOption,
    },
  });
}
