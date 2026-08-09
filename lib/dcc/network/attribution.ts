import { randomUUID } from "crypto";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";

export type NetworkAttributionEvent = {
  eventId?: string;
  handoffId: string;
  registryHandoffId: string;
  eventName: "handoff_viewed" | "booking_started" | "booking_completed" | "booking_failed";
  sourceSiteId: string;
  destinationSiteId: string;
  intentId?: string | null;
  sourcePage?: string | null;
  externalReference?: string | null;
  amount?: number | null;
  currency?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
  occurredAt?: string;
};

let schemaReady = false;

async function ensureSchema() {
  if (schemaReady) return;
  const db = getDb();
  if (!db) throw new Error("DCC database is not configured");
  await db.execute(sql`
    create table if not exists dcc_network_attribution_events (
      event_id text primary key,
      handoff_id text not null,
      registry_handoff_id text not null,
      event_name text not null,
      source_site_id text not null,
      destination_site_id text not null,
      intent_id text,
      source_page text,
      external_reference text,
      amount numeric(12,2),
      currency text,
      metadata jsonb not null default '{}'::jsonb,
      occurred_at timestamptz not null,
      received_at timestamptz not null default now()
    )
  `);
  await db.execute(sql`create index if not exists dcc_network_attr_handoff_idx on dcc_network_attribution_events (handoff_id)`);
  await db.execute(sql`create index if not exists dcc_network_attr_route_idx on dcc_network_attribution_events (registry_handoff_id, occurred_at)`);
  await db.execute(sql`create index if not exists dcc_network_attr_event_idx on dcc_network_attribution_events (event_name, occurred_at)`);
  schemaReady = true;
}

export async function appendNetworkAttributionEvent(input: NetworkAttributionEvent) {
  await ensureSchema();
  const db = getDb();
  if (!db) throw new Error("DCC database is not configured");
  const eventId = input.eventId || `nae_${randomUUID()}`;
  const occurredAt = input.occurredAt || new Date().toISOString();
  const currency = input.currency?.toUpperCase() || null;
  const amount = typeof input.amount === "number" ? input.amount : null;
  const metadata = input.metadata || {};

  await db.execute(sql`
    insert into dcc_network_attribution_events (
      event_id, handoff_id, registry_handoff_id, event_name,
      source_site_id, destination_site_id, intent_id, source_page,
      external_reference, amount, currency, metadata, occurred_at
    ) values (
      ${eventId}, ${input.handoffId}, ${input.registryHandoffId}, ${input.eventName},
      ${input.sourceSiteId}, ${input.destinationSiteId}, ${input.intentId || null}, ${input.sourcePage || null},
      ${input.externalReference || null}, ${amount}, ${currency}, ${JSON.stringify(metadata)}::jsonb, ${occurredAt}::timestamptz
    )
    on conflict (event_id) do nothing
  `);

  return { eventId, occurredAt };
}
