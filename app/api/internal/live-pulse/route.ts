import { NextResponse } from "next/server";
import { buildLivePulseFeed } from "@/lib/dcc/livePulse/feed";
import { buildLivePulseSignal, insertRuntimeSignal, readRuntimeSignals } from "@/lib/dcc/livePulse/store";
import type {
  LivePulseCreateInput,
  LivePulseEntityType,
  LivePulseSignalType,
  LivePulseSourcePoster,
  LivePulseVisibilityScope,
} from "@/lib/dcc/livePulse/types";

const MAX_POSTS_PER_HOUR = 3;
const ALLOW_TRUSTED_LOCAL = false;

function parseEntityType(value: string | null): LivePulseEntityType | null {
  if (value === "city" || value === "port" || value === "venue" || value === "event") return value;
  return null;
}

function parseVisibilityScope(value: string | null): LivePulseVisibilityScope | null {
  const scopes: LivePulseVisibilityScope[] = [
    "entity-only",
    "city-feed",
    "next48-overlay",
  ];
  if (!value) return null;
  return scopes.includes(value as LivePulseVisibilityScope)
    ? (value as LivePulseVisibilityScope)
    : null;
}

function parseSignalType(value: string | null): LivePulseSignalType | null {
  const allowed: LivePulseSignalType[] = [
    "packed",
    "long_lines",
    "easy_entry",
    "good_vibe",
    "great_right_now",
    "meh",
    "sold_out_closed",
    "weather_issue",
    "traffic_parking",
  ];
  if (!value) return null;
  return allowed.includes(value as LivePulseSignalType)
    ? (value as LivePulseSignalType)
    : null;
}

function parseTrustTier(value: string | null): LivePulseSourcePoster | null {
  if (value === "dcc-verified" || value === "partner") return value;
  if (value === "trusted-local" && ALLOW_TRUSTED_LOCAL) return value;
  return null;
}

function enforceRateLimit(input: Pick<LivePulseCreateInput, "entityType" | "entitySlug" | "reporterId">, now: Date): boolean {
  const posts = readRuntimeSignals();
  const oneHourAgo = now.getTime() - 60 * 60 * 1000;
  const recentCount = posts.filter((post) => {
    if (post.entityType !== input.entityType || post.entitySlug !== input.entitySlug) return false;
    if (post.reporterId !== input.reporterId) return false;
    return new Date(post.createdAt).getTime() >= oneHourAgo;
  }).length;
  return recentCount < MAX_POSTS_PER_HOUR;
}

function duplicateExists(input: LivePulseCreateInput, now: Date): boolean {
  const posts = readRuntimeSignals();
  const cooldownMs = 20 * 60 * 1000;
  const since = now.getTime() - cooldownMs;
  return posts.some((post) =>
    post.reporterId === input.reporterId &&
    post.entityType === input.entityType &&
    post.entitySlug === input.entitySlug &&
    post.signalType === input.signalType &&
    new Date(post.createdAt).getTime() >= since
  );
}

function hasActiveSignalForSameType(input: LivePulseCreateInput, now: Date): boolean {
  const posts = readRuntimeSignals();
  return posts.some((post) => {
    if (post.status !== "active") return false;
    if (post.reporterId !== input.reporterId) return false;
    if (post.entityType !== input.entityType || post.entitySlug !== input.entitySlug) return false;
    if (post.signalType !== input.signalType) return false;
    return new Date(post.expiresAt).getTime() > now.getTime();
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const entityType = parseEntityType(searchParams.get("entityType"));
  const entitySlug = (searchParams.get("slug") || "").trim().toLowerCase();
  const target = (searchParams.get("target") || "entity") as "entity" | "city-feed" | "next48-overlay";
  const limitRaw = Number(searchParams.get("limit") || "8");

  if (!entityType || !entitySlug) {
    return NextResponse.json({ ok: false, error: "entityType and slug are required" }, { status: 400 });
  }

  const feed = buildLivePulseFeed({
    entityType,
    entitySlug,
    target: target === "city-feed" || target === "next48-overlay" ? target : "entity",
    limit: Number.isFinite(limitRaw) ? Math.max(1, Math.min(20, limitRaw)) : 8,
  });

  return NextResponse.json({ ok: true, feed }, { status: 200 });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const entityType = parseEntityType(String(body.entityType || ""));
  const entitySlug = String(body.entitySlug || "").trim().toLowerCase();
  const signalType = parseSignalType(String(body.signalType || ""));
  const visibilityScope = parseVisibilityScope(String(body.visibilityScope || ""));
  const trustTier = parseTrustTier(String(body.trustTier || ""));
  const location = String(body.location || "").trim();
  const sourceName = String(body.sourceName || "").trim();
  const reporterId = String(body.reporterId || "").trim();
  const note = typeof body.note === "string" ? body.note : undefined;
  const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl : undefined;
  const linkUrl = typeof body.linkUrl === "string" ? body.linkUrl : undefined;
  const actionHint = typeof body.actionHint === "string" ? body.actionHint : undefined;

  if (!entityType || !entitySlug || !signalType || !visibilityScope || !trustTier) {
    return NextResponse.json({ ok: false, error: "Missing required structured signal fields" }, { status: 400 });
  }

  if (!location || !sourceName || !reporterId) {
    return NextResponse.json({ ok: false, error: "location, sourceName, and reporterId are required" }, { status: 400 });
  }

  const input: LivePulseCreateInput = {
    entityType,
    entitySlug,
    signalType,
    visibilityScope,
    trustTier,
    location,
    sourceName,
    reporterId,
    note,
    imageUrl,
    linkUrl,
    actionHint,
  };

  const now = new Date();

  if (!enforceRateLimit(input, now)) {
    return NextResponse.json({ ok: false, error: "Rate limit exceeded for this reporter/entity" }, { status: 429 });
  }

  if (duplicateExists(input, now)) {
    return NextResponse.json({ ok: false, error: "Duplicate signal in cooldown window" }, { status: 409 });
  }

  if (hasActiveSignalForSameType(input, now)) {
    return NextResponse.json(
      { ok: false, error: "Reporter already has an active signal for this signalType on this entity" },
      { status: 409 }
    );
  }

  const signal = buildLivePulseSignal(input, now);
  insertRuntimeSignal(signal);

  return NextResponse.json({ ok: true, signal }, { status: 201 });
}
