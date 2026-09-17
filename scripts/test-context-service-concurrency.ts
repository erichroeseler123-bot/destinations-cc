import { issueContext, redeemContext, hashContextId } from "../lib/dcc/context/service";
import type { DccContextRow } from "../lib/db/schema";

console.log("======================================================");
console.log("DCC CONTEXT SERVICE CONCURRENCY & ATOMIC REDEEM TEST");
console.log("======================================================\n");

let passed = 0;
let failed = 0;

function assert(name: string, condition: boolean, details?: string) {
  if (condition) {
    console.log(` PASS: ${name}`);
    passed++;
  } else {
    console.error(` FAIL: ${name} ${details ? "- " + details : ""}`);
    failed++;
  }
}

// Safely extract string values from Drizzle SQL/BinaryOperator expression trees
function extractDrizzleValues(obj: any, visited = new Set()): string[] {
  if (!obj || typeof obj !== "object" || visited.has(obj)) return [];
  visited.add(obj);

  const values: string[] = [];
  if (typeof obj.value === "string") values.push(obj.value);
  if (typeof obj.val === "string") values.push(obj.val);

  if (Array.isArray(obj.queryChunks)) {
    for (const chunk of obj.queryChunks) {
      if (typeof chunk === "string") values.push(chunk);
      else if (chunk && typeof chunk === "object") {
        values.push(...extractDrizzleValues(chunk, visited));
      }
    }
  }

  if (obj.left) values.push(...extractDrizzleValues(obj.left, visited));
  if (obj.right) values.push(...extractDrizzleValues(obj.right, visited));

  return values;
}

// In-memory mock database table implementing strict atomic UPDATE semantics matching Drizzle ORM
class MockDccDatabase {
  rows: Map<string, DccContextRow> = new Map();
  idempotencyIndex: Map<string, string> = new Map();

  insert(table: any) {
    return {
      values: async (data: any) => {
        if (data.idempotencyKey && this.idempotencyIndex.has(data.idempotencyKey)) {
          throw new Error(`Unique constraint violation: idempotency_key '${data.idempotencyKey}'`);
        }
        const row: DccContextRow = {
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.rows.set(data.contextHash, row);
        if (data.idempotencyKey) {
          this.idempotencyIndex.set(data.idempotencyKey, data.contextHash);
        }
      },
    };
  }

  select() {
    return {
      from: (table: any) => ({
        where: (condition: any) => ({
          limit: async (num: number) => {
            const values = extractDrizzleValues(condition);
            for (const row of this.rows.values()) {
              if (
                values.includes(row.contextHash) ||
                (row.idempotencyKey && values.includes(row.idempotencyKey))
              ) {
                return [row];
              }
            }
            return [];
          },
        }),
      }),
    };
  }

  update(table: any) {
    return {
      set: (updates: Partial<DccContextRow>) => ({
        where: (conditions: any) => ({
          returning: async (): Promise<DccContextRow[]> => {
            const values = extractDrizzleValues(conditions);
            const now = updates.updatedAt || new Date();

            for (const [hash, row] of this.rows.entries()) {
              if (values.includes(hash)) {
                if (
                  row.status === "issued" &&
                  values.includes(row.targetOwner) &&
                  row.expiresAt > now
                ) {
                  const updatedRow: DccContextRow = {
                    ...row,
                    ...updates,
                    updatedAt: new Date(),
                  };
                  this.rows.set(hash, updatedRow);
                  return [updatedRow]; // Exactly 1 row updated atomically
                }
              }
            }
            return []; // 0 rows updated
          },
        }),
      }),
    };
  }
}

const mockDb: any = new MockDccDatabase();

async function runTests() {
  const baseNow = 1789574400000;

  // 1. Issue Context Test
  const issuePayload = {
    sourceSite: "cruisepromenade",
    destination: "juneau",
    targetOwner: "juneauflightdeck",
    targetIntent: "glacier-helicopter-landing",
    schedule: {
      date: "2027-06-16",
      arrival: "08:00",
      departure: "17:00",
      travelers: 4,
      shipOrVenue: "norwegian-jewel",
    },
    safetyOverride: {
      bufferMinutes: 0, // Client tries 0m buffer!
    },
    idempotencyKey: "cart_user_9921",
  };

  const issued = await issueContext(issuePayload, { now: baseNow, dbOverride: mockDb });
  assert("1. Context successfully issued with secure opaque ID", issued.success && issued.contextId.startsWith("dcc_ctx_"));
  assert("2. Authoritative buffer clamped to 90m in DB row", mockDb.rows.get(hashContextId(issued.contextId))?.bufferMinutes === 90);
  assert("3. Latest safe return time calculated as 15:30", mockDb.rows.get(hashContextId(issued.contextId))?.latestSafeReturnTime === "15:30");

  // 2. Idempotent Issue Replay Test
  const reissued = await issueContext(issuePayload, { now: baseNow + 1000, dbOverride: mockDb });
  assert("4. Idempotent issue returns original context ID", reissued.contextId === issued.contextId);
  assert("5. Idempotent flag set on replay", reissued.idempotencyReplay === true);
  assert("6. No duplicate DB rows created", mockDb.rows.size === 1);

  // 3. CONCURRENT REDEMPTION RACE CONDITION TEST
  console.log("\n--- Executing Concurrent Redemption Race Condition (2 Simultaneous Calls) ---");
  const [redeemResult1, redeemResult2] = await Promise.all([
    redeemContext(issued.contextId, "juneauflightdeck", { now: baseNow + 5000, dbOverride: mockDb }),
    redeemContext(issued.contextId, "juneauflightdeck", { now: baseNow + 5000, dbOverride: mockDb }),
  ]);

  const winnerCount = (redeemResult1.success ? 1 : 0) + (redeemResult2.success ? 1 : 0);
  const replayCount = (!redeemResult1.success && redeemResult1.errorCode === "CONTEXT_ALREADY_REDEEMED" ? 1 : 0) +
                      (!redeemResult2.success && redeemResult2.errorCode === "CONTEXT_ALREADY_REDEEMED" ? 1 : 0);

  assert("7. Exactly ONE concurrent redemption succeeds (Winner count: 1)", winnerCount === 1);
  assert("8. Exactly ONE concurrent redemption fails with CONTEXT_ALREADY_REDEEMED (Replay count: 1)", replayCount === 1);

  const loser = !redeemResult1.success ? redeemResult1 : redeemResult2;
  assert("9. Failed redemption returned HTTP 409 Conflict", !loser.success && loser.statusCode === 409);

  // 4. Owner Mismatch Test
  const secondIssuePayload = {
    ...issuePayload,
    idempotencyKey: "cart_user_owner_mismatch",
  };
  const secondIssued = await issueContext(secondIssuePayload, { now: baseNow, dbOverride: mockDb });
  const wrongOwnerRedeem = await redeemContext(secondIssued.contextId, "gosno", { now: baseNow + 5000, dbOverride: mockDb });
  assert("10. Unauthorized owner rejected with 403 OWNER_MISMATCH", !wrongOwnerRedeem.success && wrongOwnerRedeem.statusCode === 403 && wrongOwnerRedeem.errorCode === "OWNER_MISMATCH");

  // 5. Expiration Test (15 minutes + 1ms)
  const thirdIssuePayload = {
    ...issuePayload,
    idempotencyKey: "cart_user_expired_test",
  };
  const thirdIssued = await issueContext(thirdIssuePayload, { now: baseNow, dbOverride: mockDb });
  const expiredRedeem = await redeemContext(thirdIssued.contextId, "juneauflightdeck", { now: baseNow + (15 * 60 * 1000) + 1, dbOverride: mockDb });
  assert("11. Expired token rejected with 410 CONTEXT_EXPIRED", !expiredRedeem.success && expiredRedeem.statusCode === 410 && expiredRedeem.errorCode === "CONTEXT_EXPIRED");

  // 6. Midnight Wrap-around Test
  const midnightIssuePayload = {
    sourceSite: "wno",
    destination: "new-orleans",
    targetOwner: "welcometotheswamp",
    schedule: {
      date: "2026-11-01",
      departure: "00:30",
      travelers: 2,
    },
    idempotencyKey: "cart_midnight_wrap",
  };
  const midnightIssued = await issueContext(midnightIssuePayload, { now: baseNow, dbOverride: mockDb });
  const midnightRow = mockDb.rows.get(hashContextId(midnightIssued.contextId));
  assert("12. Midnight wrap return date decrements to 2026-10-31", midnightRow?.latestSafeReturnDate === "2026-10-31");
  assert("13. Midnight wrap return time wraps to 23:45 (00:30 - 45m buffer)", midnightRow?.latestSafeReturnTime === "23:45");
  assert("14. Midnight crossed flag is true", midnightRow?.midnightCrossed === true);

  console.log("\n======================================================");
  console.log(`SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log("======================================================\n");

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error("Test suite runtime exception:", err);
  process.exit(1);
});