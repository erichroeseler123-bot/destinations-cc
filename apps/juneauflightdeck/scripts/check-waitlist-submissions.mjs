import fs from 'fs';
import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

const env = dotenv.parse(fs.readFileSync('apps/juneauflightdeck/.env.local'));
const sql = neon(env.DATABASE_URL);

async function main() {
  const submissions = await sql`
    SELECT id, created_at, name, email, port_date, ship_name, tour_type, party_size, is_test
    FROM jfd_waitlist_submissions
    ORDER BY created_at DESC;
  `;
  console.log('--- ALL WAITLIST SUBMISSIONS IN NEON DB ---');
  console.table(submissions);

  const telemetry = await sql`
    SELECT id, created_at, event_name, session_id, source_page, is_test, payload
    FROM jfd_telemetry_events
    WHERE event_name = 'waitlist_submitted'
    ORDER BY created_at DESC;
  `;
  console.log('\n--- WAITLIST TELEMETRY EVENTS ---');
  console.table(telemetry.map(t => ({
    id: t.id,
    created_at: t.created_at,
    session_id: t.session_id,
    is_test: t.is_test,
    tour: t.payload?.outcome?.tourType,
    ship: t.payload?.outcome?.shipName,
    date: t.payload?.outcome?.portDate
  })));

  const notifs = await sql`
    SELECT delivery_id, entry_id, recipient_email, tour_name, port_date, status, is_test, dispatched_at, payload->>'emailSubject' as subject
    FROM jfd_waitlist_notifications
    ORDER BY dispatched_at DESC
    LIMIT 10;
  `;
  console.log('\n--- RECENT WAITLIST NOTIFICATIONS ---');
  console.table(notifs);
}

main().catch(console.error);
