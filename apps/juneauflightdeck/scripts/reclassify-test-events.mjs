import fs from 'fs';
import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

const env = dotenv.parse(fs.readFileSync('apps/juneauflightdeck/.env.local'));
const sql = neon(env.DATABASE_URL);

async function main() {
  const result = await sql`
    UPDATE jfd_telemetry_events 
    SET is_test = true 
    WHERE session_id IN (
      'dcc_muyh0o7f_pge8v343',
      'dcc_muyh2g23_5rmtorsc',
      'dcc_muyh323t_poa16h6t',
      'dcc_muyh3sq9_067lj7oc',
      'dcc_muyh4doh_ltqnvl0e',
      'dcc_muyhd61q_dfv4e8j4',
      'dcc_muyhik6t_keb5ehvq',
      'test_live_verify_no_auth'
    );
  `;
  console.log('Reclassification update executed.');

  const res = await fetch('https://juneauflightdeck.com/api/network/telemetry', {
    headers: { Authorization: `Bearer ${env.CRON_SECRET}` }
  });
  const data = await res.json();
  console.log('Verified Live Production Customer Metrics (WHERE is_test = false):');
  console.log(JSON.stringify(data.summary, null, 2));
}

main().catch(console.error);
