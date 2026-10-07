const fs = require('fs');
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync('apps/juneauflightdeck/.env.local'));
const { neon } = require('@neondatabase/serverless');

const sql = neon(env.DATABASE_URL);
async function run() {
  const updated = await sql`
    UPDATE jfd_telemetry_events
    SET is_test = true
    WHERE session_id ILIKE '%test%' OR payload::text ILIKE '%test%';
  `;
  console.log('Marked prior synthetic events as is_test = true in Neon database.');
  
  const counts = await sql`
    SELECT is_test, count(*) as count
    FROM jfd_telemetry_events
    GROUP BY is_test;
  `;
  console.log('Current events count in Neon by is_test:', counts);
}
run().catch(console.error);
