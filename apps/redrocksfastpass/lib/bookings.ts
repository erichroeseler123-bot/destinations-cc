import { randomUUID } from "crypto";
import { kv } from "@vercel/kv";

const HAS_KV = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
export const HAS_DURABLE_BOOKING_STORE = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
const memoryBookings = new Map<string, DayPassBooking>();
const memoryOrderIndex = new Map<string, string>();
const memoryDateIndex = new Map<string, Set<string>>();
const memorySlotIndex = new Map<string, Set<string>>();

export type DayPassBookingStatus = "pending_payment" | "paid" | "cancelled" | "refunded" | "expired" | "needs_review";
export const HOLD_WINDOW_MINUTES = 20;

export type DayPassBooking = {
  token: string;
  createdAt: string;
  status: DayPassBookingStatus;
  expiresAt?: string | null;
  phone: string;
  slotId: string;
  dateLabel: string;
  departLabel: string;
  quantity: number;
  amountUsd: number;
  handoffId: string;
  dccReturn: string;
  payerName?: string | null;
  squarePaymentLinkId?: string | null;
  squarePaymentLinkUrl?: string | null;
  squareTransactionId?: string | null;
  squareReferenceId?: string | null;
  squareOrderId?: string | null;
  squarePaymentStatus?: string | null;
  squareRefundId?: string | null;
  reviewReason?: string | null;
  paidAt?: string | null;
  refundedAt?: string | null;
  smsPayLinkSentAt?: string | null;
  smsTicketSentAt?: string | null;
};

function bookingKey(token: string) {
  return `redrocksfastpass:booking:${token}`;
}

function squareOrderKey(orderId: string) {
  return `redrocksfastpass:square-order:${orderId}`;
}

function dateIndexKey(serviceDate: string) {
  return `redrocksfastpass:date:${serviceDate}:tokens`;
}

function slotIndexKey(slotId: string) {
  return `redrocksfastpass:slot:${slotId}:tokens`;
}

export function getServiceDateFromSlotId(slotId: string) {
  return slotId.split("-").slice(0, 3).join("-");
}

export function getDepartureKey(slotId: string, departLabel: string) {
  return `${getServiceDateFromSlotId(slotId)}__${departLabel}`;
}

function addToMemoryIndex(index: Map<string, Set<string>>, key: string, token: string) {
  const current = index.get(key);
  if (current) {
    current.add(token);
    return;
  }

  index.set(key, new Set([token]));
}

export function createBookingToken() {
  return randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();
}

export async function saveBooking(booking: DayPassBooking) {
  const serviceDate = getServiceDateFromSlotId(booking.slotId);
  if (HAS_DURABLE_BOOKING_STORE) {
    await kv.set(bookingKey(booking.token), booking);
    await kv.sadd(dateIndexKey(serviceDate), booking.token);
    await kv.sadd(slotIndexKey(booking.slotId), booking.token);
    if (booking.squareOrderId) {
      await kv.set(squareOrderKey(booking.squareOrderId), booking.token);
    }
    return;
  }

  memoryBookings.set(booking.token, booking);
  addToMemoryIndex(memoryDateIndex, serviceDate, booking.token);
  addToMemoryIndex(memorySlotIndex, booking.slotId, booking.token);
  if (booking.squareOrderId) {
    memoryOrderIndex.set(booking.squareOrderId, booking.token);
  }
}

export async function getBooking(token: string): Promise<DayPassBooking | null> {
  if (HAS_DURABLE_BOOKING_STORE) {
    const booking = await kv.get<DayPassBooking>(bookingKey(token));
    return materializeBookingState(booking || null);
  }

  return materializeBookingState(memoryBookings.get(token) || null);
}

export async function updateBooking(token: string, patch: Partial<DayPassBooking>) {
  const current = await getBooking(token);
  if (!current) return null;
  const next = { ...current, ...patch };
  await saveBooking(next);
  return next;
}

export async function getBookingBySquareOrderId(orderId: string) {
  if (!orderId) return null;
  if (HAS_DURABLE_BOOKING_STORE) {
    const token = await kv.get<string>(squareOrderKey(orderId));
    if (!token) return null;
    return getBooking(token);
  }

  const token = memoryOrderIndex.get(orderId);
  if (!token) return null;
  return materializeBookingState(memoryBookings.get(token) || null);
}

function sortBookings(bookings: DayPassBooking[]) {
  return [...bookings].sort((a, b) => {
    if (a.slotId !== b.slotId) return a.slotId.localeCompare(b.slotId);
    return a.createdAt.localeCompare(b.createdAt);
  });
}

export async function listBookingsByDate(serviceDate: string) {
  if (!serviceDate) return [];
  if (HAS_DURABLE_BOOKING_STORE) {
    const tokens = await kv.smembers<string[]>(dateIndexKey(serviceDate));
    if (!tokens?.length) return [];
    const bookings = await kv.mget<DayPassBooking[]>(...tokens.map((token) => bookingKey(token)));
    return sortBookings(bookings.map((booking) => materializeBookingState(booking || null)).filter(Boolean) as DayPassBooking[]);
  }

  const tokens = memoryDateIndex.get(serviceDate);
  if (!tokens?.size) return [];
  return sortBookings(
    Array.from(tokens)
      .map((token) => materializeBookingState(memoryBookings.get(token) || null))
      .filter(Boolean) as DayPassBooking[]
  );
}

export async function listBookingsBySlot(slotId: string) {
  if (!slotId) return [];
  if (HAS_DURABLE_BOOKING_STORE) {
    const tokens = await kv.smembers<string[]>(slotIndexKey(slotId));
    if (!tokens?.length) return [];
    const bookings = await kv.mget<DayPassBooking[]>(...tokens.map((token) => bookingKey(token)));
    return sortBookings(bookings.map((booking) => materializeBookingState(booking || null)).filter(Boolean) as DayPassBooking[]);
  }

  const tokens = memorySlotIndex.get(slotId);
  if (!tokens?.size) return [];
  return sortBookings(
    Array.from(tokens)
      .map((token) => materializeBookingState(memoryBookings.get(token) || null))
      .filter(Boolean) as DayPassBooking[]
  );
}

export function getBookingExpiresAt(createdAt: string) {
  return new Date(new Date(createdAt).getTime() + HOLD_WINDOW_MINUTES * 60 * 1000).toISOString();
}

export function isBookingExpired(booking: Pick<DayPassBooking, "status" | "expiresAt">, now = new Date()) {
  if (booking.status !== "pending_payment") return false;
  if (!booking.expiresAt) return false;
  return new Date(booking.expiresAt).getTime() <= now.getTime();
}

export function isBookingHoldingSeats(booking: Pick<DayPassBooking, "status" | "expiresAt">, now = new Date()) {
  if (booking.status === "paid") return true;
  if (booking.status !== "pending_payment") return false;
  return !isBookingExpired(booking, now);
}

function materializeBookingState(booking: DayPassBooking | null, now = new Date()) {
  if (!booking) return null;
  if (booking.status === "pending_payment" && !booking.expiresAt) {
    return { ...booking, expiresAt: getBookingExpiresAt(booking.createdAt) };
  }
  if (isBookingExpired(booking, now)) {
    return { ...booking, status: "expired" as const };
  }
  return booking;
}
