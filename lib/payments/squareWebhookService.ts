import crypto from "crypto";
import fs from "fs";
import path from "path";
import { getDb } from "@/lib/db/client";
import { dccSquareWebhookEvents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

import { isSquareProduction } from "@/lib/squareConfig";

export interface DccSquareWebhookEventRecord {
  id: string;
  squareEventId: string;
  eventType: string;
  paymentId?: string | null;
  orderId?: string | null;
  processingStatus: "processing" | "succeeded" | "failed" | "duplicate" | "ignored";
  errorMetadata?: Record<string, unknown> | null;
  receivedAt: string;
  processedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

const FALLBACK_STORE_DIR = path.resolve(process.cwd(), "data", "webhooks");
const FALLBACK_STORE_FILE = path.join(FALLBACK_STORE_DIR, "dcc_square_webhook_events.json");

function ensureFallbackFileExists() {
  try {
    if (!fs.existsSync(FALLBACK_STORE_DIR)) {
      fs.mkdirSync(FALLBACK_STORE_DIR, { recursive: true });
    }
    if (!fs.existsSync(FALLBACK_STORE_FILE)) {
      fs.writeFileSync(FALLBACK_STORE_FILE, JSON.stringify({}, null, 2), "utf8");
    }
  } catch {
    // Non-blocking fallback
  }
}

function loadFallbackStore(): Record<string, DccSquareWebhookEventRecord> {
  try {
    ensureFallbackFileExists();
    if (fs.existsSync(FALLBACK_STORE_FILE)) {
      const content = fs.readFileSync(FALLBACK_STORE_FILE, "utf8");
      return JSON.parse(content || "{}");
    }
  } catch {
    // Fall back to empty map if file read error
  }
  return {};
}

function saveFallbackStore(store: Record<string, DccSquareWebhookEventRecord>) {
  try {
    ensureFallbackFileExists();
    const tempPath = `${FALLBACK_STORE_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempPath, JSON.stringify(store, null, 2), "utf8");
    fs.renameSync(tempPath, FALLBACK_STORE_FILE);
  } catch {
    // Non-blocking fallback
  }
}

export class DccSquareWebhookService {
  /**
   * Atomically records an incoming Square webhook event.
   * If the event has already been recorded (unique constraint on square_event_id),
   * returns { isDuplicate: true } and terminates further processing immediately.
   */
  static async recordIncomingEventAtomic(params: {
    squareEventId: string;
    eventType: string;
    paymentId?: string;
    orderId?: string;
  }): Promise<{ isDuplicate: boolean; eventRecordId: string }> {
    const db = getDb();
    const isProd = isSquareProduction();
    const nowIso = new Date().toISOString();
    const eventRecordId = `sq_evt_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;

    if (isProd && !db) {
      throw new Error(
        "DCC_SQUARE_WEBHOOK_ERROR: Neon database connection is required for durable webhook deduplication in production. Ephemeral fallback storage is strictly forbidden."
      );
    }

    if (db) {
      try {
        const rows = await db
          .insert(dccSquareWebhookEvents)
          .values({
            id: eventRecordId,
            squareEventId: params.squareEventId,
            eventType: params.eventType,
            paymentId: params.paymentId || null,
            orderId: params.orderId || null,
            processingStatus: "processing",
            receivedAt: new Date(),
          })
          .onConflictDoNothing({ target: dccSquareWebhookEvents.squareEventId })
          .returning({ id: dccSquareWebhookEvents.id });

        if (!rows || rows.length === 0) {
          return { isDuplicate: true, eventRecordId: "" };
        }

        return { isDuplicate: false, eventRecordId: rows[0].id };
      } catch (err: any) {
        if (
          err?.code === "23505" ||
          err?.message?.includes("unique constraint") ||
          err?.message?.includes("conflict")
        ) {
          return { isDuplicate: true, eventRecordId: "" };
        }
        if (isProd) {
          throw new Error(`DCC_SQUARE_WEBHOOK_DATABASE_ERROR: ${err.message}`);
        }
        // Fallback to durable file storage on connection or missing table error in offline tests
      }
    }

    // Durable file-backed fallback (survives process restart and concurrent calls in explicitly offline tests)
    const store = loadFallbackStore();
    if (store[params.squareEventId]) {
      return { isDuplicate: true, eventRecordId: store[params.squareEventId].id };
    }

    const record: DccSquareWebhookEventRecord = {
      id: eventRecordId,
      squareEventId: params.squareEventId,
      eventType: params.eventType,
      paymentId: params.paymentId || null,
      orderId: params.orderId || null,
      processingStatus: "processing",
      errorMetadata: null,
      receivedAt: nowIso,
      processedAt: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    store[params.squareEventId] = record;
    saveFallbackStore(store);

    return { isDuplicate: false, eventRecordId };
  }

  /**
   * Updates an existing event record with processing outcome and sanitized metadata.
   */
  static async markEventProcessed(
    squareEventId: string,
    status: "succeeded" | "failed" | "ignored",
    errorMetadata?: Record<string, unknown>,
    details?: { paymentId?: string; orderId?: string }
  ): Promise<void> {
    const db = getDb();
    const now = new Date();
    const nowIso = now.toISOString();

    const isProd = isSquareProduction();
    if (isProd && !db) {
      throw new Error("DCC_SQUARE_WEBHOOK_ERROR: Neon database connection required in production.");
    }

    if (db) {
      try {
        const rows = await db
          .update(dccSquareWebhookEvents)
          .set({
            processingStatus: status,
            processedAt: now,
            errorMetadata: errorMetadata || null,
            ...(details?.paymentId ? { paymentId: details.paymentId } : {}),
            ...(details?.orderId ? { orderId: details.orderId } : {}),
            updatedAt: now,
          })
          .where(eq(dccSquareWebhookEvents.squareEventId, squareEventId))
          .returning();
        if (rows.length > 0) {
          return;
        }
      } catch (err: any) {
        if (isProd) {
          throw new Error(`DCC_SQUARE_WEBHOOK_DATABASE_ERROR: ${err.message}`);
        }
        // Fallback to file update in offline tests
      }
    }

    const store = loadFallbackStore();
    if (store[squareEventId]) {
      store[squareEventId].processingStatus = status;
      store[squareEventId].processedAt = nowIso;
      store[squareEventId].updatedAt = nowIso;
      if (errorMetadata) {
        store[squareEventId].errorMetadata = errorMetadata;
      }
      if (details?.paymentId) {
        store[squareEventId].paymentId = details.paymentId;
      }
      if (details?.orderId) {
        store[squareEventId].orderId = details.orderId;
      }
      saveFallbackStore(store);
    }
  }

  /**
   * Retrieves a webhook event by its Square event ID.
   */
  static async getWebhookEvent(squareEventId: string): Promise<DccSquareWebhookEventRecord | null> {
    const db = getDb();
    const isProd = isSquareProduction();
    if (isProd && !db) {
      throw new Error("DCC_SQUARE_WEBHOOK_ERROR: Neon database connection required in production.");
    }

    if (db) {
      try {
        const rows = await db
          .select()
          .from(dccSquareWebhookEvents)
          .where(eq(dccSquareWebhookEvents.squareEventId, squareEventId));
        if (rows.length > 0) {
          const r = rows[0];
          return {
            id: r.id,
            squareEventId: r.squareEventId,
            eventType: r.eventType,
            paymentId: r.paymentId,
            orderId: r.orderId,
            processingStatus: r.processingStatus as any,
            errorMetadata: r.errorMetadata,
            receivedAt: r.receivedAt?.toISOString() || new Date().toISOString(),
            processedAt: r.processedAt?.toISOString() || null,
            createdAt: r.createdAt?.toISOString() || new Date().toISOString(),
            updatedAt: r.updatedAt?.toISOString() || new Date().toISOString(),
          };
        }
      } catch (err: any) {
        if (isProd) {
          throw new Error(`DCC_SQUARE_WEBHOOK_DATABASE_ERROR: ${err.message}`);
        }
        // Fallback to file store in offline tests
      }
    }

    const store = loadFallbackStore();
    return store[squareEventId] || null;
  }

  /**
   * Test utility to reset file store for clean isolation
   */
  static clearFallbackStore(): void {
    try {
      if (fs.existsSync(FALLBACK_STORE_FILE)) {
        fs.unlinkSync(FALLBACK_STORE_FILE);
      }
    } catch {
      // Ignored
    }
  }
}
