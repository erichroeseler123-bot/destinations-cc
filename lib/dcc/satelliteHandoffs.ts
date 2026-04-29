import fs from "fs";
import os from "os";
import path from "path";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { dccHandoffEvents, dccHandoffSummaries } from "@/lib/db/schema";

export const runtime = "nodejs";

export const SATELLITE_IDS = [
  "partyatredrocks",
  "shuttleya",
  "gosno",
  "saveonthestrip",
  "redrocksfastpass",
  "welcometotheswamp",
  "welcome-to-alaska",
] as const;

export type DccSatelliteId = (typeof SATELLITE_IDS)[number];

export const SATELLITE_EVENT_TYPES = [
  "handoff_viewed",
  "lead_captured",
  "booking_started",
  "booking_completed",
  "booking_failed",
  "booking_cancelled",
  "status_updated",
  "traveler_returned",
  "ticket_clickout",
  "tour_clickout",
  "inventory_low",
  "inventory_unavailable",
  "response_degraded",
  "booking_failure_rate_high",
  "temporarily_paused",
  "forwarded_to_partner",
  "accepted_from_partner",
  "partner_booking_completed",
  "partner_booking_failed",
] as const;

export type DccSatelliteEventType = (typeof SATELLITE_EVENT_TYPES)[number];

export type DccSatelliteBookingContext = {
  handoffId?: string;
  sourceSlug?: string;
  sourcePage?: string;
  topicSlug?: string;
  venueSlug?: string;
  portSlug?: string;
  citySlug?: string;
  productSlug?: string;
  eventDate?: string;
  quantity?: string | number;
  artist?: string;
  event?: string;
  cruiseShip?: string;
  cruiseShipSlug?: string;
  returnPath?: string;
};

const PartnerContextSchema = z
  .object({
    fromSite: z.string().min(1).optional(),
    toSite: z.string().min(1).optional(),
    partnerHandoffId: z.string().min(1).optional(),
    reason: z.string().min(1).optional(),
  })
  .partial();

export const SatelliteEventPayloadSchema = z.object({
  handoffId: z.string().min(8),
  satelliteId: z.enum(SATELLITE_IDS),
  eventType: z.enum(SATELLITE_EVENT_TYPES),
  occurredAt: z.string().datetime().optional(),
  source: z.string().min(2).default("satellite"),
  sourcePath: z.string().min(1).optional(),
  externalReference: z.string().min(1).optional(),
  status: z.string().min(1).optional(),
  stage: z.string().min(1).optional(),
  message: z.string().min(1).optional(),
  traveler: z
    .object({
      email: z.string().email().optional(),
      phone: z.string().min(5).optional(),
      name: z.string().min(1).optional(),
      partySize: z.number().int().min(1).max(100).optional(),
    })
    .partial()
    .optional(),
  attribution: z
    .object({
      sourceSlug: z.string().min(1).optional(),
      sourcePage: z.string().min(1).optional(),
      topicSlug: z.string().min(1).optional(),
    })
    .partial()
    .optional(),
  booking: z
    .object({
      venueSlug: z.string().min(1).optional(),
      portSlug: z.string().min(1).optional(),
      citySlug: z.string().min(1).optional(),
      productSlug: z.string().min(1).optional(),
      eventDate: z.string().min(1).optional(),
      quantity: z.number().int().min(1).max(100).optional(),
      currency: z.string().length(3).optional(),
      amount: z.number().nonnegative().optional(),
    })
    .partial()
    .optional(),
  partner: PartnerContextSchema.optional(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
});

export type SatelliteEventPayload = z.infer<typeof SatelliteEventPayloadSchema>;

export type StoredSatelliteEvent = SatelliteEventPayload & {
  receivedAt: string;
  eventId: string;
};

export type SatelliteHandoffSummary = {
  handoffId: string;
  satelliteId: DccSatelliteId;
  firstEventAt: string;
  lastEventAt: string;
  latestEventType: DccSatelliteEventType;
  latestStatus: string | null;
  latestStage: string | null;
  latestMessage: string | null;
  eventCount: number;
  externalReferences: string[];
  degraded: boolean;
  traveler: {
    email: string | null;
    phone: string | null;
    name: string | null;
    partySize: number | null;
  };
  attribution: {
    sourceSlug: string | null;
    sourcePage: string | null;
    topicSlug: string | null;
  };
  booking: {
    venueSlug: string | null;
    portSlug: string | null;
    citySlug: string | null;
    productSlug: string | null;
    eventDate: string | null;
    quantity: number | null;
    currency: string | null;
    amount: number | null;
  };
  partner: {
    fromSite: string | null;
    toSite: string | null;
    partnerHandoffId: string | null;
    reason: string | null;
  };
  metadata: Record<string, string | number | boolean | null>;
};

function resolveSatelliteStorageRoot() {
  const configured = trimValue(process.env.DCC_SATELLITE_HANDOFFS_DIR);
  if (configured) return configured;
  if (process.env.VERCEL) {
    return path.join(os.tmpdir(), "dcc-handoffs", "satellites");
  }
  return path.join(process.cwd(), "data", "handoffs", "satellites");
}

const ROOT = resolveSatelliteStorageRoot();
export const SATELLITE_STORAGE_ROOT = ROOT;
const DCC_BASE_URL = "https://destinationcommandcenter.com";
const SATELLITE_DIRS: Record<DccSatelliteId, string> = {
  partyatredrocks: path.join(ROOT, "partyatredrocks"),
  shuttleya: path.join(ROOT, "shuttleya"),
  gosno: path.join(ROOT, "gosno"),
  saveonthestrip: path.join(ROOT, "saveonthestrip"),
  redrocksfastpass: path.join(ROOT, "redrocksfastpass"),
  welcometotheswamp: path.join(ROOT, "welcometotheswamp"),
  "welcome-to-alaska": path.join(ROOT, "welcome-to-alaska"),
};

function getSatelliteTokenEnvKey(satelliteId: DccSatelliteId) {
  if (satelliteId === "partyatredrocks") return "DCC_PARR_WEBHOOK_TOKEN";
  if (satelliteId === "shuttleya") return "DCC_SHUTTLEYA_WEBHOOK_TOKEN";
  if (satelliteId === "gosno") return "DCC_GOSNO_WEBHOOK_TOKEN";
  if (satelliteId === "saveonthestrip") return "DCC_SAVEONTHESTRIP_WEBHOOK_TOKEN";
  if (satelliteId === "redrocksfastpass") return "DCC_REDROCKSFASTPASS_WEBHOOK_TOKEN";
  if (satelliteId === "welcometotheswamp") return "DCC_WTS_WEBHOOK_TOKEN";
  return "DCC_WTA_WEBHOOK_TOKEN";
}

function getSatelliteDir(satelliteId: DccSatelliteId) {
  return SATELLITE_DIRS[satelliteId];
}

function getSatelliteEventsFile(satelliteId: DccSatelliteId) {
  return path.join(getSatelliteDir(satelliteId), "events.jsonl");
}

function getSatelliteSummaryFile(satelliteId: DccSatelliteId, handoffId: string) {
  return path.join(getSatelliteDir(satelliteId), "by-handoff", `${handoffId}.json`);
}

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function dedupe(values: Array<string | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function trimValue(value: string | undefined | null) {
  const next = String(value || "").trim();
  return next || undefined;
}

function toSummary(event: StoredSatelliteEvent, previous?: SatelliteHandoffSummary | null): SatelliteHandoffSummary {
  const externalReferences = dedupe([
    ...(previous?.externalReferences || []),
    event.externalReference,
  ]);

  return {
    handoffId: event.handoffId,
    satelliteId: event.satelliteId,
    firstEventAt: previous?.firstEventAt || event.receivedAt,
    lastEventAt: event.receivedAt,
    latestEventType: event.eventType,
    latestStatus: event.status || previous?.latestStatus || null,
    latestStage: event.stage || previous?.latestStage || null,
    latestMessage: event.message || previous?.latestMessage || null,
    eventCount: (previous?.eventCount || 0) + 1,
    externalReferences,
    degraded:
      [
        "inventory_low",
        "inventory_unavailable",
        "response_degraded",
        "booking_failure_rate_high",
        "temporarily_paused",
      ].includes(event.eventType) || previous?.degraded || false,
    traveler: {
      email: event.traveler?.email || previous?.traveler.email || null,
      phone: event.traveler?.phone || previous?.traveler.phone || null,
      name: event.traveler?.name || previous?.traveler.name || null,
      partySize: event.traveler?.partySize || previous?.traveler.partySize || null,
    },
    attribution: {
      sourceSlug: event.attribution?.sourceSlug || previous?.attribution.sourceSlug || null,
      sourcePage: event.attribution?.sourcePage || previous?.attribution.sourcePage || null,
      topicSlug: event.attribution?.topicSlug || previous?.attribution.topicSlug || null,
    },
    booking: {
      venueSlug: event.booking?.venueSlug || previous?.booking.venueSlug || null,
      portSlug: event.booking?.portSlug || previous?.booking.portSlug || null,
      citySlug: event.booking?.citySlug || previous?.booking.citySlug || null,
      productSlug: event.booking?.productSlug || previous?.booking.productSlug || null,
      eventDate: event.booking?.eventDate || previous?.booking.eventDate || null,
      quantity: event.booking?.quantity || previous?.booking.quantity || null,
      currency: event.booking?.currency || previous?.booking.currency || null,
      amount:
        typeof event.booking?.amount === "number"
          ? event.booking.amount
          : previous?.booking.amount || null,
    },
    partner: {
      fromSite: event.partner?.fromSite || previous?.partner?.fromSite || null,
      toSite: event.partner?.toSite || previous?.partner?.toSite || null,
      partnerHandoffId:
        event.partner?.partnerHandoffId || previous?.partner?.partnerHandoffId || null,
      reason: event.partner?.reason || previous?.partner?.reason || null,
    },
    metadata: {
      ...(previous?.metadata || {}),
      ...(event.metadata || {}),
    },
  };
}

export function resolveSatelliteWebhookToken(satelliteId: DccSatelliteId) {
  const specific = process.env[getSatelliteTokenEnvKey(satelliteId)] || "";
  if (specific.trim()) return specific.trim();
  const shared = process.env.DCC_SATELLITE_WEBHOOK_TOKEN || "";
  return shared.trim() || null;
}

export function verifySatelliteWebhookToken(satelliteId: DccSatelliteId, token: string | null | undefined) {
  const expected = resolveSatelliteWebhookToken(satelliteId);
  if (!expected) return true;
  return token === expected;
}

export function appendSatelliteEvent(input: SatelliteEventPayload): StoredSatelliteEvent {
  const parsed = SatelliteEventPayloadSchema.parse(input);
  const receivedAt = new Date().toISOString();
  const event: StoredSatelliteEvent = {
    ...parsed,
    occurredAt: parsed.occurredAt || receivedAt,
    receivedAt,
    eventId: `${parsed.satelliteId}:${parsed.handoffId}:${Date.now()}`,
  };

  const satelliteDir = getSatelliteDir(parsed.satelliteId);
  ensureDir(path.join(satelliteDir, "by-handoff"));

  fs.appendFileSync(getSatelliteEventsFile(parsed.satelliteId), `${JSON.stringify(event)}\n`, "utf8");

  const previous = readSatelliteHandoffSummary(parsed.satelliteId, parsed.handoffId);
  const summary = toSummary(event, previous);
  fs.writeFileSync(
    getSatelliteSummaryFile(parsed.satelliteId, parsed.handoffId),
    `${JSON.stringify(summary, null, 2)}\n`,
    "utf8"
  );

  return event;
}

function serializeAmount(value: number | null | undefined) {
  return typeof value === "number" ? value.toFixed(2) : null;
}

function buildEventInsertRow(event: StoredSatelliteEvent) {
  return {
    eventId: event.eventId,
    handoffId: event.handoffId,
    satelliteId: event.satelliteId,
    eventType: event.eventType,
    occurredAt: new Date(event.occurredAt || event.receivedAt),
    receivedAt: new Date(event.receivedAt),

    source: event.source ?? null,
    sourcePath: event.sourcePath ?? null,
    externalReference: event.externalReference ?? null,
    status: event.status ?? null,
    stage: event.stage ?? null,
    message: event.message ?? null,

    travelerEmail: event.traveler?.email ?? null,
    travelerPhone: event.traveler?.phone ?? null,
    travelerName: event.traveler?.name ?? null,
    travelerPartySize: event.traveler?.partySize ?? null,

    attributionSourceSlug: event.attribution?.sourceSlug ?? null,
    attributionSourcePage: event.attribution?.sourcePage ?? null,
    attributionTopicSlug: event.attribution?.topicSlug ?? null,

    bookingVenueSlug: event.booking?.venueSlug ?? null,
    bookingPortSlug: event.booking?.portSlug ?? null,
    bookingCitySlug: event.booking?.citySlug ?? null,
    bookingProductSlug: event.booking?.productSlug ?? null,
    bookingEventDate: event.booking?.eventDate ?? null,
    bookingQuantity: event.booking?.quantity ?? null,
    bookingCurrency: event.booking?.currency ?? null,
    bookingAmount: serializeAmount(event.booking?.amount),

    partnerFromSite: event.partner?.fromSite ?? null,
    partnerToSite: event.partner?.toSite ?? null,
    partnerHandoffId: event.partner?.partnerHandoffId ?? null,
    partnerReason: event.partner?.reason ?? null,

    metadata: event.metadata ?? {},
    payload: event as unknown as Record<string, unknown>,
  };
}

function buildSummaryUpsertRow(summary: SatelliteHandoffSummary) {
  return {
    handoffId: summary.handoffId,
    satelliteId: summary.satelliteId,
    firstEventAt: new Date(summary.firstEventAt),
    lastEventAt: new Date(summary.lastEventAt),
    latestEventType: summary.latestEventType,
    latestStatus: summary.latestStatus,
    latestStage: summary.latestStage,
    latestMessage: summary.latestMessage,
    eventCount: summary.eventCount,
    degraded: summary.degraded,

    travelerEmail: summary.traveler.email,
    travelerPhone: summary.traveler.phone,
    travelerName: summary.traveler.name,
    travelerPartySize: summary.traveler.partySize,

    attributionSourceSlug: summary.attribution.sourceSlug,
    attributionSourcePage: summary.attribution.sourcePage,
    attributionTopicSlug: summary.attribution.topicSlug,

    bookingVenueSlug: summary.booking.venueSlug,
    bookingPortSlug: summary.booking.portSlug,
    bookingCitySlug: summary.booking.citySlug,
    bookingProductSlug: summary.booking.productSlug,
    bookingEventDate: summary.booking.eventDate,
    bookingQuantity: summary.booking.quantity,
    bookingCurrency: summary.booking.currency,
    bookingAmount: serializeAmount(summary.booking.amount),

    partnerFromSite: summary.partner.fromSite,
    partnerToSite: summary.partner.toSite,
    partnerHandoffId: summary.partner.partnerHandoffId,
    partnerReason: summary.partner.reason,

    externalReferences: summary.externalReferences,
    metadata: summary.metadata,
    updatedAt: new Date(),
  };
}

export async function appendSatelliteEventDurably(input: SatelliteEventPayload): Promise<StoredSatelliteEvent> {
  const event = appendSatelliteEvent(input);
  const db = getDb();
  if (!db) return event;

  const summary = readSatelliteHandoffSummary(event.satelliteId, event.handoffId);
  if (!summary) return event;

  await db.insert(dccHandoffEvents).values(buildEventInsertRow(event));
  await db
    .insert(dccHandoffSummaries)
    .values({
      ...buildSummaryUpsertRow(summary),
      createdAt: new Date(),
    })
    .onConflictDoUpdate({
      target: dccHandoffSummaries.handoffId,
      set: buildSummaryUpsertRow(summary),
    });

  return event;
}

export function readSatelliteHandoffSummary(satelliteId: DccSatelliteId, handoffId: string) {
  const filePath = getSatelliteSummaryFile(satelliteId, handoffId);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as SatelliteHandoffSummary;
}

export function findSatelliteHandoffSummary(handoffId: string) {
  for (const satelliteId of SATELLITE_IDS) {
    const summary = readSatelliteHandoffSummary(satelliteId, handoffId);
    if (summary) return summary;
  }
  return null;
}

export function listRecentSatelliteEvents(satelliteId: DccSatelliteId, limit = 20) {
  const filePath = getSatelliteEventsFile(satelliteId);
  if (!fs.existsSync(filePath)) return [];
  const lines = fs.readFileSync(filePath, "utf8").trim().split("\n").filter(Boolean);
  return lines
    .slice(Math.max(0, lines.length - limit))
    .reverse()
    .map((line) => JSON.parse(line) as StoredSatelliteEvent);
}

export function listSatelliteHandoffSummaries(satelliteId: DccSatelliteId, limit = 50) {
  const dir = path.join(getSatelliteDir(satelliteId), "by-handoff");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => JSON.parse(fs.readFileSync(path.join(dir, file), "utf8")) as SatelliteHandoffSummary)
    .sort((a, b) => new Date(b.lastEventAt).getTime() - new Date(a.lastEventAt).getTime())
    .slice(0, limit);
}

export function listAllSatelliteHandoffSummaries(limit = 100) {
  return SATELLITE_IDS.flatMap((satelliteId) => listSatelliteHandoffSummaries(satelliteId, limit))
    .sort((a, b) => new Date(b.lastEventAt).getTime() - new Date(a.lastEventAt).getTime())
    .slice(0, limit);
}

export function buildDccReturnUrl(returnPath?: string, handoffId?: string) {
  const base = trimValue(process.env.DCC_PUBLIC_BASE_URL) || DCC_BASE_URL;
  const normalizedPath = trimValue(returnPath)?.startsWith("/")
    ? trimValue(returnPath)
    : "/";
  const url = new URL(normalizedPath || "/", base);
  if (handoffId) {
    url.searchParams.set("dcc_handoff_id", handoffId);
  }
  return url.toString();
}

export function buildSatelliteTrackingParams(
  satelliteId: DccSatelliteId,
  context: DccSatelliteBookingContext = {}
) {
  const params = new URLSearchParams();
  const handoffId = trimValue(context.handoffId);
  if (handoffId) params.set("dcc_handoff_id", handoffId);
  params.set("source", "dcc");
  params.set("satellite", satelliteId);
  if (context.sourceSlug) params.set("source_slug", context.sourceSlug);
  if (context.sourcePage) params.set("source_page", context.sourcePage);
  if (context.topicSlug) params.set("topic", context.topicSlug);
  if (context.venueSlug) params.set("venue", context.venueSlug);
  if (context.portSlug) params.set("port", context.portSlug);
  if (context.citySlug) params.set("city", context.citySlug);
  if (context.productSlug) params.set("product", context.productSlug);
  if (context.eventDate) params.set("date", context.eventDate);
  if (context.quantity) params.set("qty", String(context.quantity));
  if (context.artist) params.set("artist", context.artist);
  if (context.event) params.set("event", context.event);
  if (context.cruiseShip) params.set("ship", context.cruiseShip);
  if (context.cruiseShipSlug) params.set("ship_slug", context.cruiseShipSlug);
  params.set("dcc_return", buildDccReturnUrl(context.returnPath, handoffId));
  return params;
}

export function buildSatelliteHref(
  satelliteId: DccSatelliteId,
  origin: string,
  pathname: string,
  context: DccSatelliteBookingContext = {}
) {
  const url = new URL(pathname, origin);
  const params = buildSatelliteTrackingParams(satelliteId, context);
  params.forEach((value, key) => {
    url.searchParams.set(key, value);
  });
  return url.toString();
}

export function buildParrHandoffHref(
  pathname: string,
  context: DccSatelliteBookingContext = {}
) {
  return buildSatelliteHref("partyatredrocks", "https://www.partyatredrocks.com", pathname, context);
}

export function buildGosnoHandoffHref(
  pathname: string,
  context: DccSatelliteBookingContext = {}
) {
  return buildSatelliteHref("gosno", "https://gosno.co", pathname, context);
}
