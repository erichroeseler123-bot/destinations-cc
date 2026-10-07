const fs = require('fs');
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync('apps/juneauflightdeck/.env.local'));
const { neon } = require('@neondatabase/serverless');

const sql = neon(env.DATABASE_URL);
async function run() {
  const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
  console.log('Tables in public schema:');
  console.log(tables.map(t => t.table_name));
}
run().catch(console.error);
