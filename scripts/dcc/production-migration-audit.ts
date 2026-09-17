/**
 * Production Readiness & Database Migration Pre-Flight Audit
 * 
 * Non-destructive pre-flight CLI tool for inspecting production environment variables,
 * database connectivity, schema definitions, and cron secrets.
 * 
 * Usage:
 *   node --import tsx scripts/dcc/production-migration-audit.ts [--env-file <path>]
 */

import { getDb } from "@/lib/db/client";
import { sql } from "drizzle-orm";

async function runProductionAudit() {
  console.log("==================================================================");
  console.log("DCC CONTEXT PROTOCOL: PRODUCTION READINESS PRE-FLIGHT AUDIT");
  console.log("==================================================================");

  let issuesFound = 0;

  // 1. Environment & Secrets Check
  console.log("\n1. Environment Variable & Secret Configuration:");

  const checkSecret = (name: string, minLength: number = 32, isJson: boolean = false) => {
    const val = process.env[name]?.trim();
    if (!val) {
      console.log(`  ❌ ${name}: Missing`);
      issuesFound++;
      return false;
    }
    if (isJson) {
      try {
        const parsed = JSON.parse(val);
        const keys = Object.keys(parsed);
        if (keys.length === 0) {
          console.log(`  ❌ ${name}: Empty JSON key map`);
          issuesFound++;
          return false;
        }
        console.log(`  ✔ ${name}: Valid JSON rotation map (keys: ${keys.join(", ")})`);
        return true;
      } catch {
        console.log(`  ❌ ${name}: Invalid JSON format`);
        issuesFound++;
        return false;
      }
    }
    if (val.length < minLength) {
      console.log(`  ⚠️ ${name}: Present but short (${val.length} chars, recommended >= ${minLength})`);
    } else {
      console.log(`  ✔ ${name}: Configured (${val.length} chars)`);
    }
    return true;
  };

  checkSecret("DATABASE_URL", 20);
  checkSecret("JFD_SESSION_SECRET", 32, true);
  checkSecret("DCC_JFD_SERVICE_KEY_ID", 8);
  checkSecret("DCC_JFD_SERVICE_SECRET", 32);
  checkSecret("DCC_CP_SERVICE_KEY_ID", 8);
  checkSecret("DCC_CP_SERVICE_SECRET", 32);
  checkSecret("CRON_SECRET", 32);

  // 2. Database Connectivity & Schema Audit (Zero Mutation)
  console.log("\n2. Database Connectivity & Schema Inspection:");
  const db = getDb();
  if (!db) {
    console.log("  ❌ Unable to establish database connection with DATABASE_URL.");
    issuesFound++;
  } else {
    try {
      // Check dcc_contexts table
      const contextTableCheck = await db.execute(
        sql`SELECT table_name FROM information_schema.tables WHERE table_name = 'dcc_contexts' AND table_schema = 'public';`
      );
      if (contextTableCheck.rows.length > 0) {
        console.log("  ✔ Table 'dcc_contexts' exists in public schema.");
      } else {
        console.log("  ❌ Table 'dcc_contexts' DOES NOT EXIST (requires migration).");
        issuesFound++;
      }

      // Check dcc_invalidated_sessions table
      const sessionsTableCheck = await db.execute(
        sql`SELECT table_name FROM information_schema.tables WHERE table_name = 'dcc_invalidated_sessions' AND table_schema = 'public';`
      );
      if (sessionsTableCheck.rows.length > 0) {
        console.log("  ✔ Table 'dcc_invalidated_sessions' exists in public schema.");
      } else {
        console.log("  ❌ Table 'dcc_invalidated_sessions' DOES NOT EXIST (requires migration).");
        issuesFound++;
      }

      // Check indexes
      const indexesCheck = await db.execute(
        sql`SELECT indexname FROM pg_indexes WHERE tablename IN ('dcc_contexts', 'dcc_invalidated_sessions');`
      );
      const indexNames = indexesCheck.rows.map((r: any) => r.indexname);
      console.log(`  ✔ Discovered ${indexNames.length} active indexes: ${indexNames.join(", ")}`);
    } catch (dbErr: any) {
      console.log(`  ❌ Database query failed: ${dbErr.message}`);
      issuesFound++;
    }
  }

  console.log("\n==================================================================");
  if (issuesFound === 0) {
    console.log("✔ PRE-FLIGHT AUDIT PASSED: Environment & Database schema ready.");
  } else {
    console.log(`⚠️ AUDIT COMPLETE: ${issuesFound} items require configuration or migration before promotion.`);
  }
  console.log("==================================================================\n");
}

runProductionAudit();
