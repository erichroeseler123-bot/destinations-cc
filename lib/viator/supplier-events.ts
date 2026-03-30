import fs from "fs";
import path from "path";

const SUPPLIER_DIR = path.join(process.cwd(), "data", "orders", "viator-supplier-events");
const SUPPLIER_STATE_PATH = path.join(SUPPLIER_DIR, "state.json");

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
  }
  return null;
}

export function readViatorSupplierState(): { cursor: string | null } {
  try {
    const raw = JSON.parse(fs.readFileSync(SUPPLIER_STATE_PATH, "utf8")) as { cursor?: unknown };
    return { cursor: typeof raw.cursor === "string" && raw.cursor.trim().length > 0 ? raw.cursor.trim() : null };
  } catch {
    return { cursor: null };
  }
}

export function writeViatorSupplierState(cursor: string | null) {
  fs.mkdirSync(SUPPLIER_DIR, { recursive: true });
  fs.writeFileSync(
    SUPPLIER_STATE_PATH,
    `${JSON.stringify({ updatedAt: new Date().toISOString(), cursor }, null, 2)}\n`
  );
  return SUPPLIER_STATE_PATH;
}

export function extractViatorSupplierEvents(value: unknown): Array<Record<string, unknown>> {
  const root = asRecord(value);
  const bookings = Array.isArray(root?.bookings) ? root.bookings : [];
  return bookings.filter((row): row is Record<string, unknown> => Boolean(asRecord(row))).map((row) => row as Record<string, unknown>);
}

export function extractViatorNextCursor(value: unknown): string | null {
  const root = asRecord(value);
  return firstString(root?.nextCursor, root?.cursor);
}

export function extractViatorAcknowledgements(value: unknown) {
  return extractViatorSupplierEvents(value)
    .map((booking) => {
      const bookingRef = firstString(booking.bookingRef, booking.reference);
      const acknowledgeBy = firstString(booking.acknowledgeBy);
      if (!bookingRef) return null;
      return {
        bookingRef,
        acknowledgeBy,
      };
    })
    .filter((row): row is { bookingRef: string; acknowledgeBy: string | null } => Boolean(row));
}

export function writeViatorSupplierArtifact(input: {
  kind: "feed" | "ack";
  cursor: string | null;
  payload: Record<string, unknown>;
  response: unknown;
}) {
  fs.mkdirSync(SUPPLIER_DIR, { recursive: true });
  const filePath = path.join(
    SUPPLIER_DIR,
    `${new Date().toISOString().replace(/[:.]/g, "-")}.${input.kind}.json`
  );
  fs.writeFileSync(
    filePath,
    `${JSON.stringify(
      {
        updatedAt: new Date().toISOString(),
        kind: input.kind,
        cursor: input.cursor,
        payload: input.payload,
        response: input.response,
      },
      null,
      2
    )}\n`
  );
  return filePath;
}
