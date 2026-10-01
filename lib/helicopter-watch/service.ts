import { sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db/client";
import { getViatorServerConfig } from "@/lib/viator/config";
import { appendViatorAttribution } from "@/lib/viator/links";
import { createResendClient } from "@/lib/mailer/resendClient";
import { brands } from "@/lib/mailer/brands";
import { OWNER, daysUntil, nextCheck, paxMix, parseOptions, manageToken, type WatchRequest, type Product, type Option } from "./domain";

export const MIGRATION = [
  `CREATE TABLE IF NOT EXISTS jfd_helicopter_watches (id uuid PRIMARY KEY, request_key text NOT NULL UNIQUE, request jsonb NOT NULL, products jsonb NOT NULL, status text NOT NULL DEFAULT 'active', last_options jsonb NOT NULL DEFAULT '[]', revision integer NOT NULL DEFAULT 0, next_check_at timestamptz NOT NULL, lease_until timestamptz, lease_token uuid, last_checked_at timestamptz, last_error text, created_at timestamptz NOT NULL DEFAULT now())`,
  `CREATE INDEX IF NOT EXISTS jfd_watch_due_idx ON jfd_helicopter_watches(status, next_check_at)`,
  `CREATE TABLE IF NOT EXISTS jfd_helicopter_outbox (id uuid PRIMARY KEY, watch_id uuid NOT NULL REFERENCES jfd_helicopter_watches(id), revision integer NOT NULL, payload jsonb NOT NULL, status text NOT NULL DEFAULT 'pending', attempts integer NOT NULL DEFAULT 0, next_attempt_at timestamptz NOT NULL DEFAULT now(), lease_until timestamptz, lease_token uuid, provider_id text, last_error text, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(watch_id, revision))`,
  `CREATE TABLE IF NOT EXISTS jfd_helicopter_catalog (port text PRIMARY KEY, products jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())`,
  `CREATE TABLE IF NOT EXISTS jfd_helicopter_rate_limits (key text PRIMARY KEY, count integer NOT NULL DEFAULT 0, expires_at timestamptz NOT NULL)`,
];
export async function query<T = any>(statement: ReturnType<typeof sql>) { const db = getDb(); if (!db) throw new Error("Watch database unavailable."); const result = await db.execute(statement); return (Array.isArray(result) ? result : result.rows) as T[]; }
let initialized: Promise<void> | undefined;
export async function ensureStore() { if (!initialized) initialized = (async () => { for (const text of MIGRATION) await query(sql.raw(text)); })().catch((e) => { initialized = undefined; throw e; }); await initialized; }
export async function rateLimit(key: string, limit: number) {
  const [row] = await query(sql`INSERT INTO jfd_helicopter_rate_limits(key, count, expires_at) VALUES (${key}, 1, now() + interval '1 hour') ON CONFLICT(key) DO UPDATE SET count = CASE WHEN jfd_helicopter_rate_limits.expires_at < now() THEN 1 ELSE jfd_helicopter_rate_limits.count + 1 END, expires_at = CASE WHEN jfd_helicopter_rate_limits.expires_at < now() THEN now() + interval '1 hour' ELSE jfd_helicopter_rate_limits.expires_at END RETURNING count`);
  return Number(row.count) <= limit;
}
async function viator(path: string, body?: unknown): Promise<any> {
  const c = getViatorServerConfig(); if (!c.apiKey) throw new Error("Live Viator inventory is not configured.");
  const response = await fetch(`${c.apiBase}${path}`, { method: body ? "POST" : "GET", headers: { Accept: "application/json;version=2.0", "Accept-Language": "en-US", "Content-Type": "application/json;charset=UTF-8", "exp-api-key": c.apiKey }, body: body ? JSON.stringify(body) : undefined, cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`Live inventory HTTP ${response.status}.`); return response.json();
}
export async function productsForPort(port: "juneau" | "skagway"): Promise<Product[]> {
  await ensureStore();
  const [cached] = await query(sql`SELECT products, updated_at FROM jfd_helicopter_catalog WHERE port = ${port}`);
  if (cached && Date.now() - new Date(cached.updated_at).getTime() < 86400000) return cached.products;
  const products = new Map<string, Product>();
  for (let start = 1; start <= 201; start += 50) {
    const raw = await viator("/products/search", { filtering: { destination: port === "juneau" ? 941 : 943 }, currency: "USD", pagination: { start, count: 50 } });
    if (!Array.isArray(raw.products)) throw new Error("Invalid live catalog.");
    for (const p of raw.products) {
      if (typeof p.productCode !== "string" || !/^[A-Za-z0-9]+$/.test(p.productCode) || typeof p.title !== "string" || !/helicopter|heli\b/i.test(p.title) || typeof p.productUrl !== "string") continue;
      const url = new URL(p.productUrl); if (url.protocol !== "https:" || !["www.viator.com", "viator.com"].includes(url.hostname)) continue;
      products.set(p.productCode, { code: p.productCode, title: p.title, supplier: p.supplier?.name || null, url: appendViatorAttribution(p.productUrl, { campaign: "jfd-request-watch", medium: "link", preserveExistingCampaign: false }) });
    }
    if (raw.products.length < 50 || (Number.isFinite(raw.totalCount) && start + 49 >= raw.totalCount)) break;
  }
  const list = [...products.values()].sort((a, b) => a.title.localeCompare(b.title)); if (!list.length) throw new Error("No live helicopter tours returned for this port.");
  await query(sql`INSERT INTO jfd_helicopter_catalog(port, products) VALUES (${port}, ${JSON.stringify(list)}::jsonb) ON CONFLICT(port) DO UPDATE SET products = EXCLUDED.products, updated_at = now()`);
  return list;
}
type Watch = { id: string; request: WatchRequest; products: Product[]; last_options: string[]; revision: number; lease_token: string };
async function claimWatch(id?: string) {
  const token = randomUUID();
  const [watch] = await query<Watch>(sql`UPDATE jfd_helicopter_watches SET lease_until = now() + interval '3 minutes', lease_token = ${token}::uuid WHERE id = (SELECT id FROM jfd_helicopter_watches WHERE status = 'active' AND next_check_at <= now() AND (lease_until IS NULL OR lease_until < now()) ${id ? sql`AND id = ${id}::uuid` : sql``} ORDER BY next_check_at LIMIT 1 FOR UPDATE SKIP LOCKED) RETURNING *`);
  return watch;
}
async function check(watch: Watch) {
  const options: Option[] = [], failed: string[] = [], errors: string[] = [];
  await Promise.all(watch.products.map(async (p) => { try {
    const detail = await viator(`/products/${encodeURIComponent(p.code)}`); if (detail.status !== "ACTIVE" || detail.productCode !== p.code) throw new Error("Product is not active.");
    const raw = await viator("/availability/check", { productCode: p.code, travelDate: watch.request.date, currency: "USD", paxMix: paxMix(watch.request.travelerAges, detail.pricingInfo?.ageBands) });
    options.push(...parseOptions(raw, p, watch.request));
  } catch (e) { failed.push(p.code); errors.push(`${p.code}: ${e instanceof Error ? e.message : "Check failed"}`); } }));
  return { options, failed, errors };
}
function emailText(payload: any, id: string) {
  const r: WatchRequest = payload.request;
  return [`${payload.kind === "request" ? "New watch request" : "Matching availability found"}: ${id}`, `${r.name} · ${r.email}${r.phone ? " · " + r.phone : ""}`, `${r.ship} · ${r.port} · ${r.date} · ${r.travelerAges.length} travelers (ages ${r.travelerAges.join(", ")})`, `Departure window (Alaska local time): ${r.earliestStart || "any"} to ${r.latestStart || "any"}`, `Notes: ${r.notes || "None"}`, ...(payload.kind === "request" ? payload.products.map((p: Product) => p.title + "\n" + p.url) : payload.options.map((o: Option) => `${o.product.title}${o.product.supplier ? " — " + o.product.supplier : ""}\nDeparture: ${o.time || "Not supplied; review before booking"} (Alaska local time)\nParty total: ${o.total === null ? "Not supplied" : `${o.currency} ${o.total.toFixed(2)}`}\n${o.product.url}`)), `Checked: ${payload.checkedAt}. Source: live Viator inventory.`, payload.errors?.length ? "Check needs attention: " + payload.errors.join("; ") : "", "Requests are checked daily farther out and every 15 minutes within 21 days of arrival, subject to provider availability and queue capacity.", "No seats have been held or booked. Review tour duration, pickup, ship timing, restrictions and actual cancellation terms before contacting the traveler. Automated emails go only to you.", `Owner controls — pause, resume, or mark filled:\nhttps://destinationcommandcenter.com/juneau/helicopter-watch/${id}?token=${manageToken(id)}`].filter(Boolean).join("\n\n");
}
export async function runWatches(onlyId?: string) {
  await ensureStore(); const started = Date.now(), stats = { checked: 0, sent: 0, errors: 0 };
  for (let i = 0; i < (onlyId ? 1 : 10) && Date.now() - started < 100000; i++) {
    const w = await claimWatch(onlyId); if (!w) break;
    if (daysUntil(w.request.date) < 0) { await query(sql`UPDATE jfd_helicopter_watches SET status = 'expired', lease_until = NULL, lease_token = NULL WHERE id = ${w.id}::uuid AND lease_token = ${w.lease_token}::uuid`); continue; }
    try {
      const c = await check(w), now = new Date();
      if (w.revision === 0) await query(sql`INSERT INTO jfd_helicopter_outbox(id, watch_id, revision, payload) VALUES (${randomUUID()}::uuid, ${w.id}::uuid, -1, ${JSON.stringify({ kind: "request", request: w.request, products: w.products, checkedAt: now.toISOString(), errors: c.errors })}::jsonb) ON CONFLICT DO NOTHING`);
      const added = c.options.filter((o) => !w.last_options.includes(o.key));
      const keys = [...new Set([...w.last_options.filter((key) => c.failed.some((code) => key.startsWith(code + ":"))), ...c.options.map((o) => o.key)])];
      const next = c.errors.length ? new Date(now.getTime() + 900000) : nextCheck(w.request.date, now);
      await query(sql`WITH changed AS (UPDATE jfd_helicopter_watches SET last_options = ${JSON.stringify(keys)}::jsonb, revision = revision + 1, next_check_at = ${next.toISOString()}::timestamptz, last_checked_at = now(), last_error = ${c.errors.length ? c.errors.join("; ").slice(0, 1000) : null}, lease_token = NULL, lease_until = NULL WHERE id = ${w.id}::uuid AND lease_token = ${w.lease_token}::uuid AND status = 'active' RETURNING revision) INSERT INTO jfd_helicopter_outbox(id, watch_id, revision, payload) SELECT ${randomUUID()}::uuid, ${w.id}::uuid, revision, ${JSON.stringify({ kind: "availability", request: w.request, options: added, checkedAt: now.toISOString() })}::jsonb FROM changed WHERE ${added.length > 0} ON CONFLICT DO NOTHING`);
      stats.checked++; stats.errors += c.errors.length;
    } catch (e) { await query(sql`UPDATE jfd_helicopter_watches SET last_error = ${e instanceof Error ? e.message.slice(0, 1000) : "Check failed"}, next_check_at = now() + interval '15 minutes', lease_until = NULL, lease_token = NULL WHERE id = ${w.id}::uuid AND lease_token = ${w.lease_token}::uuid`); stats.errors++; }
  }
  const mailer = createResendClient(); if (!mailer) return { ...stats, errors: stats.errors + 1 };
  for (let i = 0; i < 10 && Date.now() - started < 145000; i++) {
    const token = randomUUID();
    const [email] = await query(sql`UPDATE jfd_helicopter_outbox SET lease_until = now() + interval '3 minutes', lease_token = ${token}::uuid, attempts = attempts + 1 WHERE id = (SELECT id FROM jfd_helicopter_outbox WHERE status = 'pending' AND next_attempt_at <= now() AND (lease_until IS NULL OR lease_until < now()) ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED) RETURNING *`); if (!email) break;
    try {
      const [w] = await query(sql`SELECT status FROM jfd_helicopter_watches WHERE id = ${email.watch_id}::uuid`);
      const disposition = Date.now() - new Date(email.created_at).getTime() > 23 * 3600000 ? "needs_review" : email.payload.kind !== "request" && w?.status !== "active" ? "cancelled" : null;
      if (disposition) { await query(sql`UPDATE jfd_helicopter_outbox SET status = ${disposition}, lease_token = NULL, lease_until = NULL WHERE id = ${email.id}::uuid AND lease_token = ${token}::uuid`); continue; }
      const r = email.payload.request;
      const response = await mailer.resend.emails.send({ from: brands.DCC.from, to: [OWNER], replyTo: OWNER, subject: `[Juneau Flight Deck] ${email.payload.kind === "request" ? "Watch request received" : "Seats found"}: ${r.port} ${r.date} · ${r.travelerAges.length} travelers`, text: emailText(email.payload, email.watch_id) }, { idempotencyKey: `jfd-watch-${email.id}` });
      if (response.error || !response.data?.id) throw new Error(response.error?.message || "Email provider did not accept alert.");
      await query(sql`UPDATE jfd_helicopter_outbox SET status = 'sent', provider_id = ${response.data.id}, last_error = NULL, lease_token = NULL, lease_until = NULL WHERE id = ${email.id}::uuid AND lease_token = ${token}::uuid`); stats.sent++;
    } catch (e) { await query(sql`UPDATE jfd_helicopter_outbox SET last_error = ${e instanceof Error ? e.message.slice(0, 500) : "Email failed"}, next_attempt_at = now() + interval '30 minutes', lease_token = NULL, lease_until = NULL WHERE id = ${email.id}::uuid AND lease_token = ${token}::uuid`); stats.errors++; }
  }
  if (!onlyId) await query(sql`DELETE FROM jfd_helicopter_rate_limits WHERE expires_at < now() - interval '1 day'`);
  return stats;
}
