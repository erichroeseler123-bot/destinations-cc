import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { buildViatorPreparedBooking } from "@/lib/viator/prebook";
import type { ViatorPrebookState } from "@/lib/viator/schema";

const PREPARED_DIR = path.join(process.cwd(), "data", "orders", "viator-prepared");

export function createViatorPreparationId() {
  return `viator-prep-${randomUUID()}`;
}

export function writePreparedViatorBooking(prebook: ViatorPrebookState, selectedOptionId?: string | null) {
  fs.mkdirSync(PREPARED_DIR, { recursive: true });
  const preparationId = createViatorPreparationId();
  const createdAt = new Date().toISOString();
  const prepared = buildViatorPreparedBooking({
    preparationId,
    createdAt,
    prebook,
    selectedOptionId,
  });
  const filePath = path.join(PREPARED_DIR, `${preparationId}.json`);
  fs.writeFileSync(filePath, `${JSON.stringify(prepared, null, 2)}\n`);
  return { prepared, filePath };
}

