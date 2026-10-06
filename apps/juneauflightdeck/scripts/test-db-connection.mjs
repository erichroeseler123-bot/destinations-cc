import dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";

dotenv.config({ path: "./.env.local" });

if (!process.env.DATABASE_URL) {
  console.log("No DATABASE_URL found");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function test() {
  try {
    const res = await sql`SELECT 1 as connected, current_database() as db`;
    console.log("Successfully connected to Postgres:", res);
    const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
    console.log("Existing public tables:", tables.map(t => t.table_name));
  } catch (e) {
    console.error("Connection error:", e.message);
  }
}

test();
