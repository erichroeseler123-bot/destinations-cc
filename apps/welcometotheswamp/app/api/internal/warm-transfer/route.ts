import fs from "fs";
import os from "os";
import path from "path";
import { NextResponse } from "next/server";
import {
  WARM_TRANSFER_CONTEXTS,
  WARM_TRANSFER_INTENTS,
  WARM_TRANSFER_SOURCE_PAGES,
  WARM_TRANSFER_SOURCES,
  WARM_TRANSFER_SUBTYPES,
} from "@/lib/warmTransfer";

export const runtime = "nodejs";

type WarmTransferEvent = {
  eventType: "plan_viewed" | "plan_click";
  pagePath: "/plan";
  intent: (typeof WARM_TRANSFER_INTENTS)[number];
  topic: "swamp-tours";
  subtype: (typeof WARM_TRANSFER_SUBTYPES)[number] | null;
  context: (typeof WARM_TRANSFER_CONTEXTS)[number] | null;
  source: (typeof WARM_TRANSFER_SOURCES)[number];
  sourcePage: (typeof WARM_TRANSFER_SOURCE_PAGES)[number] | null;
  targetId?: string;
  targetHref?: string;
  lane?: string | null;
  timestamp?: string;
};

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function optionalNullableAllowed<T extends readonly string[]>(value: unknown, allowed: T): T[number] | null {
  if (value == null) return null;
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T[number]) : null;
}

function parseEvent(payload: unknown): WarmTransferEvent | null {
  if (!payload || typeof payload !== "object") return null;
  const input = payload as Record<string, unknown>;
  const eventType = input.eventType;
  const pagePath = input.pagePath;
  const intent = input.intent;
  const topic = input.topic;
  const source = input.source;

  if (eventType !== "plan_viewed" && eventType !== "plan_click") return null;
  if (pagePath !== "/plan") return null;
  if (!isString(intent) || !WARM_TRANSFER_INTENTS.includes(intent as (typeof WARM_TRANSFER_INTENTS)[number])) return null;
  if (topic !== "swamp-tours") return null;
  if (!isString(source) || !WARM_TRANSFER_SOURCES.includes(source as (typeof WARM_TRANSFER_SOURCES)[number])) return null;

  const subtype = optionalNullableAllowed(input.subtype, WARM_TRANSFER_SUBTYPES);
  const context = optionalNullableAllowed(input.context, WARM_TRANSFER_CONTEXTS);
  const sourcePage = optionalNullableAllowed(input.sourcePage, WARM_TRANSFER_SOURCE_PAGES);
  if (input.subtype != null && subtype === null) return null;
  if (input.context != null && context === null) return null;
  if (input.sourcePage != null && sourcePage === null) return null;

  const timestamp = optionalString(input.timestamp);
  if (timestamp) {
    const parsed = Date.parse(timestamp);
    if (Number.isNaN(parsed)) return null;
  }

  return {
    eventType,
    pagePath,
    intent: intent as WarmTransferEvent["intent"],
    topic: "swamp-tours",
    subtype,
    context,
    source: source as WarmTransferEvent["source"],
    sourcePage,
    targetId: optionalString(input.targetId),
    targetHref: optionalString(input.targetHref),
    lane: input.lane == null ? null : optionalString(input.lane) ?? null,
    timestamp,
  };
}

function getStorageRoot() {
  if (process.env.VERCEL) return path.join(os.tmpdir(), "wts-analytics");
  return path.join(process.cwd(), "data", "analytics", "warm-transfer");
}

function writeEvent(payload: WarmTransferEvent) {
  const dir = getStorageRoot();
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "events.jsonl");
  const event = {
    ...payload,
    receivedAt: new Date().toISOString(),
  };
  fs.appendFileSync(file, `${JSON.stringify(event)}
`, "utf8");
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = parseEvent(payload);
  if (!parsed) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  writeEvent(parsed);
  return NextResponse.json({ ok: true }, { status: 200 });
}
