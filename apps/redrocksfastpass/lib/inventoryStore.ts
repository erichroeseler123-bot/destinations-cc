import { HAS_DURABLE_BOOKING_STORE, isBookingHoldingSeats, listBookingsBySlot } from "@/lib/bookings";
import { getFastPassSlotById, getFastPassSlots, type FastPassSlot } from "@/lib/inventory";

export type ReserveSeatResult =
  | { ok: true; slot: FastPassSlot }
  | { ok: false; reason: "sold_out" | "not_found" | "storage_error" | "invalid_quantity" };

async function readReservedCounts(slotIds: string[]) {
  const entries = await Promise.all(
    slotIds.map(async (slotId) => {
      const bookings = await listBookingsBySlot(slotId);
      const reserved = bookings.filter((booking) => isBookingHoldingSeats(booking)).reduce((sum, booking) => sum + booking.quantity, 0);
      return [slotId, reserved] as const;
    })
  );
  return new Map(entries);
}

function applyReservations(slot: FastPassSlot, reserved: number): FastPassSlot {
  const seatsLeft = Math.max(0, slot.maxSeats - reserved);
  const availabilityLabel =
    seatsLeft <= 0 ? "sold_out" : reserved >= slot.targetCapacity ? "limited" : "available";
  return {
    ...slot,
    seatsLeft,
    soldOut: seatsLeft <= 0,
    availabilityLabel,
  };
}

export async function listInventory(now = new Date()) {
  const slots = getFastPassSlots(now);
  const reservedMap = await readReservedCounts(slots.map((slot) => slot.id));
  return slots.map((slot) => applyReservations(slot, reservedMap.get(slot.id) ?? 0));
}

export async function getInventorySlot(slotId: string, now = new Date()) {
  const slot = getFastPassSlotById(slotId, now);
  if (!slot) return null;
  const bookings = await listBookingsBySlot(slotId);
  const reserved = bookings.filter((booking) => isBookingHoldingSeats(booking, now)).reduce((sum, booking) => sum + booking.quantity, 0);
  return applyReservations(slot, reserved);
}

export async function reserveSeat(slotId: string, quantity = 1, now = new Date()): Promise<ReserveSeatResult> {
  const slot = getFastPassSlotById(slotId, now);
  if (!slot) {
    return { ok: false, reason: "not_found" };
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > slot.maxSeats) {
    return { ok: false, reason: "invalid_quantity" };
  }

  try {
    const bookings = await listBookingsBySlot(slotId);
    const reserved = bookings.filter((booking) => isBookingHoldingSeats(booking, now)).reduce((sum, booking) => sum + booking.quantity, 0);
    if (reserved + quantity > slot.maxSeats) {
      return { ok: false, reason: "sold_out" };
    }

    return { ok: true, slot: applyReservations(slot, reserved + quantity) };
  } catch {
    return { ok: false, reason: "storage_error" };
  }
}

export function usingDurableInventoryStore() {
  return HAS_DURABLE_BOOKING_STORE;
}
