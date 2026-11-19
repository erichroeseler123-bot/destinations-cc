import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/adminAccess";
import { verifyCollectorServerAuth } from "@/lib/dcc/analytics/collector";
import { resolveCanonicalAnalyticsSite } from "@/lib/dcc/analytics/contract";
import {
  describeActiveAnalyticsBackend,
  getAnalyticsRuntimeControls,
  setAnalyticsRuntimeControls,
  withAnalyticsDbTelemetry,
} from "@/lib/dcc/analytics/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveAuthorizedControlActor(request: NextRequest): string | null {
  const session = request.cookies.get(ADMIN_SESSION_COOKIE)?.value || null;
  if (isValidAdminSession(session)) {
    return "admin_session";
  }
  if (verifyCollectorServerAuth(request.headers)) {
    return "internal_server_auth";
  }
  return null;
}

export async function GET(request: NextRequest) {
  const actor = resolveAuthorizedControlActor(request);
  if (!actor) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { result: controls, dbTelemetry } = await withAnalyticsDbTelemetry(async () =>
    getAnalyticsRuntimeControls({ bypassCache: true }),
  );
  const backendInfo = describeActiveAnalyticsBackend();

  return NextResponse.json(
    {
      ok: true,
      backend: backendInfo,
      runtimeControls: controls,
      dbTelemetry,
      cacheTtlMs: 1500,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store",
        "X-DCC-Analytics-Backend": `${backendInfo.backend}:${backendInfo.databaseName}`,
      },
    },
  );
}

export async function POST(request: NextRequest) {
  const actor = resolveAuthorizedControlActor(request);
  if (!actor) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: {
    killSwitchActive?: unknown;
    simulateOutageActive?: unknown;
    disabledSites?: unknown;
    siteControl?: unknown;
    actorNote?: unknown;
  } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const hasKillSwitchField = typeof body.killSwitchActive === "boolean";
  const hasOutageField = typeof body.simulateOutageActive === "boolean";
  const hasDisabledSitesField = Array.isArray(body.disabledSites);
  const parsedSiteControl =
    body.siteControl &&
    typeof body.siteControl === "object" &&
    !Array.isArray(body.siteControl) &&
    typeof (body.siteControl as { siteId?: unknown }).siteId === "string" &&
    typeof (body.siteControl as { disabled?: unknown }).disabled === "boolean"
      ? {
          siteId: resolveCanonicalAnalyticsSite(
            (body.siteControl as { siteId: string }).siteId,
          ).siteId,
          disabled: Boolean((body.siteControl as { disabled: boolean }).disabled),
        }
      : undefined;

  if (
    !hasKillSwitchField &&
    !hasOutageField &&
    !hasDisabledSitesField &&
    !parsedSiteControl
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: "missing_boolean_control_field",
        message:
          "Provide `killSwitchActive`, `simulateOutageActive`, `disabledSites`, and/or `siteControl`.",
      },
      { status: 400 },
    );
  }

  const normalizedDisabledSites = hasDisabledSitesField
    ? (body.disabledSites as unknown[])
        .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
        .map((s) => resolveCanonicalAnalyticsSite(s).siteId)
    : undefined;

  const actorLabel =
    typeof body.actorNote === "string" && body.actorNote.trim()
      ? `${actor}:${body.actorNote.trim().slice(0, 64)}`
      : actor;

  try {
    const { result: updatedControls, dbTelemetry } = await withAnalyticsDbTelemetry(async () =>
      setAnalyticsRuntimeControls({
        ...(hasKillSwitchField ? { killSwitchActive: Boolean(body.killSwitchActive) } : {}),
        ...(hasOutageField ? { simulateOutageActive: Boolean(body.simulateOutageActive) } : {}),
        ...(normalizedDisabledSites !== undefined
          ? { disabledSites: normalizedDisabledSites }
          : {}),
        ...(parsedSiteControl ? { siteControl: parsedSiteControl } : {}),
        actor: actorLabel,
      }),
    );
    const backendInfo = describeActiveAnalyticsBackend();

    return NextResponse.json(
      {
        ok: true,
        backend: backendInfo,
        runtimeControls: updatedControls,
        dbTelemetry,
        effectiveWithinMs: 1500,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-store",
          "X-DCC-Analytics-Backend": `${backendInfo.backend}:${backendInfo.databaseName}`,
        },
      },
    );
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: "control_update_failed",
        message: err instanceof Error ? err.message : "unknown_error",
      },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
