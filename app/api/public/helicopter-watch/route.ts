import { NextResponse, after } from "next/server";
import { createHash, randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { validateRequest, requestKey, localDate } from "@/lib/helicopter-watch/domain";
import { ensureStore, query, rateLimit, productsForPort, runWatches } from "@/lib/helicopter-watch/service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 180;
const ORIGINS = new Set(["https://juneauflightdeck.com", "https://www.juneauflightdeck.com", "https://destinationcommandcenter.com", "https://www.destinationcommandcenter.com"]);
function cors(request: Request) { const origin = request.headers.get("origin"); return { "Cache-Control": "no-store", Vary: "Origin", ...(origin && ORIGINS.has(origin) ? { "Access-Control-Allow-Origin": origin } : {}) }; }
function reply(request: Request, value: unknown, status = 200) { return NextResponse.json(value, { status, headers: cors(request) }); }
export async function OPTIONS(request: Request) { return new Response(null, { status: ORIGINS.has(request.headers.get("origin") || "") ? 204 : 403, headers: { ...cors(request), "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } }); }
export async function GET(request: Request) {
  const port = new URL(request.url).searchParams.get("port"); if (port !== "juneau" && port !== "skagway") return reply(request, { error: "Choose a port." }, 400);
  try { return reply(request, { products: await productsForPort(port), minimumDate: localDate(), source: "viator-live-catalog", alertRecipient: "owner-only" }); } catch { return reply(request, { error: "Live tour list unavailable. Please try again shortly." }, 503); }
}
export async function POST(request: Request) {
  const origin = request.headers.get("origin"); if (origin && !ORIGINS.has(origin)) return reply(request, { error: "Invalid origin" }, 403);
  if (!request.headers.get("content-type")?.includes("application/json")) return reply(request, { error: "JSON required" }, 415);
  const raw = await request.text(); if (raw.length > 10000) return reply(request, { error: "Request too large" }, 413);
  let input; try { input = validateRequest(JSON.parse(raw)); } catch { return reply(request, { error: "Check the name, email, ship, date, traveler ages and tour selections." }, 400); }
  try {
    await ensureStore();
    const ip = request.headers.get("x-vercel-forwarded-for") || request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    if (!await rateLimit("ip:" + createHash("sha256").update(ip).digest("hex"), 5) || !await rateLimit("global-intake", 100)) return reply(request, { error: "Too many requests. Try later." }, 429);
    const catalog = await productsForPort(input.port), products = catalog.filter((p) => input.productCodes.includes(p.code));
    if (products.length !== input.productCodes.length) return reply(request, { error: "Choose tours from this port's current list." }, 400);
    const key = requestKey(input), id = randomUUID();
    const inserted = await query(sql`INSERT INTO jfd_helicopter_watches(id, request_key, request, products, next_check_at) VALUES (${id}::uuid, ${key}, ${JSON.stringify(input)}::jsonb, ${JSON.stringify(products)}::jsonb, now()) ON CONFLICT(request_key) DO NOTHING RETURNING id`);
    const saved = inserted[0] || (await query(sql`SELECT id FROM jfd_helicopter_watches WHERE request_key = ${key}`))[0]; if (!saved) throw new Error("Not stored.");
    if (inserted.length) after(async () => { try { await runWatches(saved.id); } catch { console.error("JFD first check deferred", saved.id); } });
    return reply(request, { ok: true, requestId: saved.id, duplicate: !inserted.length, message: "Request saved. Our team reviews matching availability. No seats reserved." }, inserted.length ? 201 : 200);
  } catch { return reply(request, { error: "Unable to save request. Please try again." }, 503); }
}
