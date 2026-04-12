import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "@/lib/db/schema";

export type DccDb = NeonHttpDatabase<typeof schema>;

let cachedDb: DccDb | null | undefined;

function resolveDatabaseUrl() {
  return (
    process.env.DCC_DATABASE_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    ""
  ).trim();
}

export function getDb(): DccDb | null {
  if (cachedDb !== undefined) return cachedDb;

  const connectionString = resolveDatabaseUrl();
  if (!connectionString) {
    cachedDb = null;
    return cachedDb;
  }

  const client = neon(connectionString);
  cachedDb = drizzle(client, { schema });
  return cachedDb;
}

export function hasDb() {
  return Boolean(resolveDatabaseUrl());
}
