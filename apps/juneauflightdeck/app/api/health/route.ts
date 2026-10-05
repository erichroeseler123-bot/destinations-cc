import { NextResponse } from "next/server";
import { getDb } from "../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  let datastore = {
    connected: false,
    type: "in-memory / file fallback",
  };

  const sql = getDb();
  if (sql) {
    try {
      const res = await sql`SELECT 1 as connected, current_database() as db`;
      if (res && res.length > 0) {
        datastore = {
          connected: true,
          type: "neon-postgres-shared",
        };
      }
    } catch {
      datastore = {
        connected: false,
        type: "postgres-connection-error",
      };
    }
  }

  return NextResponse.json(
    {
      ok: true,
      service: "juneauflightdeck",
      role: "owner",
      canonicalHost: "juneauflightdeck.com",
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "staging",
      commitSha: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || "local",
      datastore,
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
