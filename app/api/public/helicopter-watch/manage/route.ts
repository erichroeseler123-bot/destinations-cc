import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { canManage, daysUntil } from "@/lib/helicopter-watch/domain";
import { ensureStore, query } from "@/lib/helicopter-watch/service";
export const dynamic = "force-dynamic";
function reply(value: unknown, status = 200) { return NextResponse.json(value, { status, headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex, nofollow" } }); }
export async function GET(request: Request) {
  const p = new URL(request.url).searchParams, id = p.get("id") || "", token = p.get("token") || "";
  if (!canManage(id, token)) return reply({ error: "Unauthorized" }, 401);
  try { await ensureStore(); const [watch] = await query(sql`SELECT id, request, products, status, last_checked_at, next_check_at, last_error, last_options FROM jfd_helicopter_watches WHERE id = ${id}::uuid`); if (!watch) return reply({ error: "Not found" }, 404); const emails = await query(sql`SELECT status, provider_id, last_error FROM jfd_helicopter_outbox WHERE watch_id = ${id}::uuid`); return reply({ watch, emails, cronConfigured: Boolean(process.env.CRON_SECRET?.trim()) }); } catch { return reply({ error: "Controls unavailable" }, 503); }
}
export async function POST(request: Request) {
  const origin = request.headers.get("origin"); if (origin && !["https://destinationcommandcenter.com", "https://www.destinationcommandcenter.com"].includes(origin)) return reply({ error: "Invalid origin" }, 403);
  let v; try { v = await request.json(); } catch { return reply({ error: "Invalid request" }, 400); }
  if (!canManage(v?.id, v?.token)) return reply({ error: "Unauthorized" }, 401);
  if (!["active", "paused", "filled"].includes(v.status)) return reply({ error: "Invalid status" }, 400);
  try { await ensureStore(); const [w] = await query(sql`SELECT request FROM jfd_helicopter_watches WHERE id = ${v.id}::uuid`); if (!w) return reply({ error: "Not found" }, 404); if (v.status === "active" && daysUntil(w.request.date) < 0) return reply({ error: "Port date has passed" }, 400); await query(sql`UPDATE jfd_helicopter_watches SET status = ${v.status}, lease_token = NULL, lease_until = NULL ${v.status === "active" ? sql`, next_check_at = now(), last_options = '[]'::jsonb` : sql``} WHERE id = ${v.id}::uuid`); return reply({ ok: true, status: v.status }); } catch { return reply({ error: "Unable to update" }, 503); }
}
