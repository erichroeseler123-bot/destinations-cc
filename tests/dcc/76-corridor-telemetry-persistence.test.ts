import test from "node:test";
import assert from "node:assert/strict";
import { getDb } from "../../lib/db/client";
import { appendCorridorEventDurably, listRecentCorridorEvents } from "../../lib/dcc/telemetry/corridorEvents";
import { dccCorridorEvents, dccCorridorCatalog } from "../../lib/db/schema";
import { eq } from "drizzle-orm";

test("DCC Corridor Telemetry Persistence Suite", async (t) => {
  const db = getDb();
  assert.ok(db, "Database connection must be established");

  await t.test("1. Catalog contains live wno-commerce corridor entry", async () => {
    const rows = await db.select().from(dccCorridorCatalog).where(eq(dccCorridorCatalog.corridorId, "wno-commerce"));
    assert.strictEqual(rows.length, 1, "Must find exactly 1 wno-commerce catalog row");
    assert.strictEqual(rows[0].corridorName, "Welcome to New Orleans Tours Commerce");
    assert.strictEqual(rows[0].family, "marketplace");
    assert.strictEqual(rows[0].status, "live");
  });

  await t.test("2. appendCorridorEventDurably inserts and persists an isolated test event", async () => {
    const testSession = `wno_test_unit_${Date.now()}`;
    const result = await appendCorridorEventDurably({
      corridor_id: "wno-commerce",
      event_name: "landing_viewed",
      session_id: testSession,
      source_page: "/direct",
      landing_path: "/",
      target_path: "/tours",
      metadata: {
        test: true,
        unit_test: true,
      },
    });

    assert.strictEqual(result.ok, true, "Must store successfully");
    assert.strictEqual(result.stored, true, "Must confirm stored");
    assert.strictEqual(result.corridorId, "wno-commerce");

    // Query back from database directly
    const storedRows = await db
      .select()
      .from(dccCorridorEvents)
      .where(eq(dccCorridorEvents.sessionId, testSession));

    assert.strictEqual(storedRows.length, 1, "Must retrieve exactly one persisted row");
    assert.strictEqual(storedRows[0].corridorId, "wno-commerce");
    assert.strictEqual(storedRows[0].eventName, "landing_viewed");
    assert.strictEqual(storedRows[0].sessionId, testSession);
    assert.strictEqual(storedRows[0].family, "marketplace");
    assert.strictEqual((storedRows[0].metadata as any)?.unit_test, true);

    // Clean up test event
    await db.delete(dccCorridorEvents).where(eq(dccCorridorEvents.sessionId, testSession));
  });

  await t.test("3. listRecentProductionCorridorEvents strictly excludes synthetic verification sessions", async () => {
    const { listRecentProductionCorridorEvents } = await import("../../lib/dcc/telemetry/corridorEvents");
    const testSession = `wno_verify_live_unit_${Date.now()}`;
    await appendCorridorEventDurably({
      corridor_id: "wno-commerce",
      event_name: "checkout_started",
      session_id: testSession,
      source_page: "/tours/french-quarter",
      landing_path: "/tours/french-quarter",
      metadata: { synthetic: true },
    });

    const prodEvents = await listRecentProductionCorridorEvents(500);
    const found = prodEvents.some((e) => e.sessionId === testSession);
    assert.strictEqual(found, false, "Synthetic verification session must NOT appear in production funnel reporting");

    // Clean up test row
    await db.delete(dccCorridorEvents).where(eq(dccCorridorEvents.sessionId, testSession));
  });
});
