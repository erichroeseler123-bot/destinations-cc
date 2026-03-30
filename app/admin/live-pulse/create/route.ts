import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/adminAccess";
import { buildLivePulseSignal, insertRuntimeSignal } from "@/lib/dcc/livePulse/store";
import {
  LIVE_PULSE_SIGNAL_CATALOG,
  type LivePulseEntityType,
  type LivePulseSignalType,
  type LivePulseVisibilityScope,
} from "@/lib/dcc/livePulse/types";

export const runtime = "nodejs";

const ENTITY_TYPES: LivePulseEntityType[] = ["city", "port", "venue", "event"];
const VISIBILITY_SCOPES: LivePulseVisibilityScope[] = ["entity-only", "city-feed", "next48-overlay"];

function isEntityType(value: string): value is LivePulseEntityType {
  return ENTITY_TYPES.includes(value as LivePulseEntityType);
}

function isSignalType(value: string): value is LivePulseSignalType {
  return value in LIVE_PULSE_SIGNAL_CATALOG;
}

function isVisibilityScope(value: string): value is LivePulseVisibilityScope {
  return VISIBILITY_SCOPES.includes(value as LivePulseVisibilityScope);
}

export async function POST(request: NextRequest) {
  const session = request.cookies.get(ADMIN_SESSION_COOKIE)?.value || null;
  if (!isValidAdminSession(session)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const formData = await request.formData();
  const entityType = String(formData.get("entityType") || "").trim();
  const entitySlug = String(formData.get("entitySlug") || "").trim().toLowerCase();
  const signalType = String(formData.get("signalType") || "").trim();
  const visibilityScope = String(formData.get("visibilityScope") || "").trim();
  const location = String(formData.get("location") || "").trim();
  const note = String(formData.get("note") || "").trim();
  const actionHint = String(formData.get("actionHint") || "").trim();
  const linkUrl = String(formData.get("linkUrl") || "").trim();

  const redirectUrl = new URL("/admin/live-pulse", request.url);

  if (!entityType || !entitySlug || !signalType || !visibilityScope || !location) {
    redirectUrl.searchParams.set("error", "missing_fields");
    return NextResponse.redirect(redirectUrl);
  }

  if (!isEntityType(entityType)) {
    redirectUrl.searchParams.set("error", "invalid_entity_type");
    return NextResponse.redirect(redirectUrl);
  }

  if (!isSignalType(signalType)) {
    redirectUrl.searchParams.set("error", "invalid_signal_type");
    return NextResponse.redirect(redirectUrl);
  }

  if (!isVisibilityScope(visibilityScope)) {
    redirectUrl.searchParams.set("error", "invalid_visibility_scope");
    return NextResponse.redirect(redirectUrl);
  }

  const signal = buildLivePulseSignal(
    {
      entityType,
      entitySlug,
      signalType,
      location,
      visibilityScope,
      trustTier: "dcc-verified",
      sourceName: "DCC Admin",
      reporterId: "dcc-admin",
      note: note || undefined,
      actionHint: actionHint || undefined,
      linkUrl: linkUrl || undefined,
    },
    new Date()
  );

  insertRuntimeSignal(signal);

  redirectUrl.searchParams.set("created", "1");
  return NextResponse.redirect(redirectUrl);
}
