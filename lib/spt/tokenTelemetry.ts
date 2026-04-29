import "server-only";

import { sql } from "drizzle-orm";
import { getDb, hasDb } from "@/lib/db/client";

type SptTokenEventType =
  | "token_created"
  | "token_create_failed"
  | "token_resolved"
  | "token_resolve_invalid"
  | "token_fallback_query";

type RecordSptTokenEventInput = {
  eventType: SptTokenEventType;
  token?: string | null;
  corridorId?: string | null;
  route?: string | null;
  sourcePage?: string | null;
  status?: string | null;
  detail?: Record<string, unknown>;
};

export type SptTokenEventRow = {
  id: number;
  eventType: string;
  token: string | null;
  corridorId: string | null;
  route: string | null;
  sourcePage: string | null;
  status: string | null;
  detail: Record<string, unknown>;
  createdAt: string;
};

const DB_TABLE = "dcc_spt_token_events";

async function ensureDbTable() {
  const db = getDb();
  if (!db) return false;

  await db.execute(sql.raw(`
    create table if not exists ${DB_TABLE} (
      id bigserial primary key,
      event_type text not null,
      token text,
      corridor_id text,
      route text,
      source_page text,
      status text,
      detail jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    )
  `));
  await db.execute(sql.raw(`
    create index if not exists ${DB_TABLE}_created_idx
    on ${DB_TABLE} (created_at desc)
  `));
  await db.execute(sql.raw(`
    create index if not exists ${DB_TABLE}_event_type_idx
    on ${DB_TABLE} (event_type)
  `));
  return true;
}

export async function recordSptTokenEvent(input: RecordSptTokenEventInput) {
  const payload = {
    eventType: input.eventType,
    token: input.token || null,
    corridorId: input.corridorId || null,
    route: input.route || null,
    sourcePage: input.sourcePage || null,
    status: input.status || null,
    detail: input.detail || {},
    createdAt: new Date().toISOString(),
  };

  if (!hasDb()) {
    console.log("dcc-spt-token-event", JSON.stringify(payload));
    return;
  }

  try {
    const db = getDb();
    if (!db || !(await ensureDbTable())) {
      console.log("dcc-spt-token-event", JSON.stringify(payload));
      return;
    }

    await db.execute(
      sql`insert into ${sql.raw(DB_TABLE)} (
        event_type,
        token,
        corridor_id,
        route,
        source_page,
        status,
        detail
      ) values (
        ${payload.eventType},
        ${payload.token},
        ${payload.corridorId},
        ${payload.route},
        ${payload.sourcePage},
        ${payload.status},
        ${JSON.stringify(payload.detail)}::jsonb
      )`,
    );
  } catch {
    console.log("dcc-spt-token-event", JSON.stringify(payload));
  }
}

export async function listRecentSptTokenEvents(limit = 20): Promise<SptTokenEventRow[]> {
  const db = getDb();
  if (!db) return [];

  try {
    if (!(await ensureDbTable())) return [];
    const result = await db.execute(sql.raw(`
      select
        id,
        event_type as "eventType",
        token,
        corridor_id as "corridorId",
        route,
        source_page as "sourcePage",
        status,
        detail,
        created_at as "createdAt"
      from ${DB_TABLE}
      order by created_at desc
      limit ${Math.max(1, Math.min(limit, 100))}
    `));
    return result.rows as unknown as SptTokenEventRow[];
  } catch {
    return [];
  }
}
