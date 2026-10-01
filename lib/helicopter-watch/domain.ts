import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
export const OWNER = "erichroeseler123@gmail.com";
export const RELEASE_WINDOW_DAYS = 21;
export const WatchInput = z.object({
  name: z.string().trim().min(2).max(120), email: z.email().max(254),
  phone: z.string().trim().max(40).default(""), ship: z.string().trim().min(2).max(120),
  port: z.enum(["juneau", "skagway"]), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  productCodes: z.array(z.string().regex(/^[A-Za-z0-9]+$/).max(40)).min(1).max(6),
  travelerAges: z.array(z.number().int().min(0).max(120)).min(1).max(12),
  earliestStart: z.string().regex(/^\d{2}:\d{2}$/).or(z.literal("")).default(""),
  latestStart: z.string().regex(/^\d{2}:\d{2}$/).or(z.literal("")).default(""),
  notes: z.string().trim().max(1000).default(""), website: z.string().max(200).default(""),
});
export type WatchRequest = z.infer<typeof WatchInput>;
export type Product = { code: string; title: string; url: string; supplier: string | null };
export type Option = { key: string; product: Product; option: string; time: string | null; total: number | null; currency: string };
export function localDate(now = new Date()) { return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Anchorage", year: "numeric", month: "2-digit", day: "2-digit" }).format(now); }
export function daysUntil(date: string, now = new Date()) { return Math.round((Date.parse(date + "T00:00:00Z") - Date.parse(localDate(now) + "T00:00:00Z")) / 86400000); }
export function validateRequest(raw: unknown, now = new Date()) {
  const value = WatchInput.parse(raw), date = new Date(value.date + "T00:00:00Z");
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value.date || daysUntil(value.date, now) < 0 || daysUntil(value.date, now) > 550 || value.website) throw new Error("Invalid port date or request.");
  for (const time of [value.earliestStart, value.latestStart]) if (time && (+time.slice(0, 2) > 23 || +time.slice(3) > 59)) throw new Error("Invalid departure time.");
  if (value.earliestStart && value.latestStart && value.earliestStart > value.latestStart) throw new Error("Invalid departure window.");
  return { ...value, email: value.email.toLowerCase(), productCodes: [...new Set(value.productCodes)].sort() };
}
export function nextCheck(date: string, now = new Date()) {
  const next = now.getTime() + (daysUntil(date, now) <= RELEASE_WINDOW_DAYS ? 900000 : 86400000);
  const release = Date.parse(date + "T00:00:00Z") - RELEASE_WINDOW_DAYS * 86400000;
  return new Date(release > now.getTime() ? Math.min(next, release) : next);
}
export function requestKey(r: WatchRequest) { return createHash("sha256").update(JSON.stringify([r.email, r.port, r.date, r.productCodes, r.travelerAges, r.earliestStart, r.latestStart])).digest("hex"); }
export function paxMix(ages: number[], bands: unknown) {
  if (!Array.isArray(bands) || !bands.length) throw new Error("Product age bands unavailable; manual review required.");
  const counts = new Map<string, number>();
  for (const age of ages) { const b = bands.find((b) => typeof b.ageBand === "string" && Number.isFinite(b.startAge) && Number.isFinite(b.endAge) && age >= b.startAge && age <= b.endAge); if (!b) throw new Error("Traveler age outside product limits."); counts.set(b.ageBand, (counts.get(b.ageBand) || 0) + 1); }
  return [...counts].map(([ageBand, numberOfTravelers]) => ({ ageBand, numberOfTravelers }));
}
export function parseOptions(raw: any, product: Product, r: WatchRequest): Option[] {
  if (!raw || raw.productCode !== product.code || !Array.isArray(raw.bookableItems)) throw new Error("Unexpected availability response.");
  return raw.bookableItems.filter((item: any) => {
    if (item.available !== true || typeof item.productOptionCode !== "string") return false;
    const time = typeof item.startTime === "string" ? item.startTime.slice(0, 5) : "";
    return ((!r.earliestStart && !r.latestStart) || Boolean(time)) && (!r.earliestStart || time >= r.earliestStart) && (!r.latestStart || time <= r.latestStart);
  }).map((item: any) => ({ key: [product.code, item.productOptionCode, item.startTime || "unspecified"].join(":"), product, option: item.productOptionCode, time: item.startTime || null, total: Number.isFinite(item.totalPrice?.price?.recommendedRetailPrice) ? item.totalPrice.price.recommendedRetailPrice : null, currency: raw.currency || "USD" }));
}
function controlSecret() { return process.env.INTERNAL_API_SECRET?.trim() || process.env.CRON_SECRET?.trim() || ""; }
export function manageToken(id: string) { const key = controlSecret(); if (!key) throw new Error("Owner controls not configured."); return createHmac("sha256", key).update(`jfd-watch:${id}`).digest("hex"); }
export function canManage(id: string, token: string) { if (!controlSecret() || typeof id !== "string" || typeof token !== "string" || !/^[a-f0-9-]{36}$/.test(id) || !/^[a-f0-9]{64}$/.test(token)) return false; return timingSafeEqual(Buffer.from(token), Buffer.from(manageToken(id))); }
