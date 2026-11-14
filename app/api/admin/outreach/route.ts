import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  getAdminActorLabel,
  isValidAdminSession,
} from "@/lib/adminAccess";
import {
  createOrganizerOutreachLead,
  deleteOrResetOrganizerOutreachLead,
  getOrganizerOutreachDashboard,
  isValidOutreachStatus,
  isValidQualificationStatus,
  updateOrganizerOutreachLead,
} from "@/lib/dcc/organizerOutreachStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Robots-Tag": "noindex, nofollow",
};

function constantTimeEquals(a: string, b: string): boolean {
  if (!a || !b) return false;
  const digestA = createHash("sha256").update(a).digest();
  const digestB = createHash("sha256").update(b).digest();
  return timingSafeEqual(digestA, digestB);
}

function readCookieFromHeader(
  cookieHeader: string | null,
  cookieName: string,
): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const idx = part.indexOf("=");
    if (idx <= 0) continue;
    const key = part.slice(0, idx).trim();
    if (key === cookieName) {
      return decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return null;
}

async function authorizeAdminOutreachCaller(
  request: Request,
): Promise<{ authorized: true; actor: string } | { authorized: false }> {
  let sessionCookie = readCookieFromHeader(
    request.headers.get("cookie"),
    ADMIN_SESSION_COOKIE,
  );
  if (!sessionCookie) {
    try {
      const store = await cookies();
      sessionCookie = store.get(ADMIN_SESSION_COOKIE)?.value || null;
    } catch {
      sessionCookie = null;
    }
  }

  if (sessionCookie && isValidAdminSession(sessionCookie)) {
    return {
      authorized: true,
      actor: getAdminActorLabel(sessionCookie),
    };
  }

  const bearerRaw = request.headers.get("authorization") || "";
  const bearerToken = /^Bearer\s+/i.test(bearerRaw)
    ? bearerRaw.replace(/^Bearer\s+/i, "").trim()
    : "";
  const candidate = (
    request.headers.get("x-dcc-admin-key") ||
    request.headers.get("x-dcc-internal-key") ||
    bearerToken ||
    ""
  ).trim();

  if (!candidate) {
    return { authorized: false };
  }

  const configuredSecrets: Array<{ label: string; value: string }> = [
    { label: "admin_key", value: (process.env.ADMIN_ACCESS_KEY || "").trim() },
    {
      label: "earthos_admin",
      value: (process.env.EARTHOS_ADMIN_KEY || "").trim(),
    },
    {
      label: "internal_secret",
      value: (process.env.INTERNAL_API_SECRET || "").trim(),
    },
    {
      label: "commerce_admin",
      value: (process.env.DCC_COMMERCE_ADMIN_SECRET || "").trim(),
    },
  ].filter((entry) => entry.value.length > 0);

  let matchedLabel: string | null = null;
  for (const secret of configuredSecrets) {
    if (constantTimeEquals(candidate, secret.value)) {
      matchedLabel = secret.label;
    }
  }

  if (matchedLabel) {
    return {
      authorized: true,
      actor: `header:${matchedLabel}`,
    };
  }

  return { authorized: false };
}

export async function GET(request: Request) {
  const auth = await authorizeAdminOutreachCaller(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  const snapshot = await getOrganizerOutreachDashboard();
  return NextResponse.json(snapshot, {
    status: 200,
    headers: NO_STORE_HEADERS,
  });
}

export async function POST(request: Request) {
  const auth = await authorizeAdminOutreachCaller(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON payload." },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const action =
    typeof body.action === "string" ? body.action.trim().toLowerCase() : "update";

  if (action === "create") {
    const leadName = typeof body.leadName === "string" ? body.leadName : "";
    const hostedCruiseAndSailing =
      typeof body.hostedCruiseAndSailing === "string"
        ? body.hostedCruiseAndSailing
        : "";
    if (
      body.qualificationStatus !== undefined &&
      !isValidQualificationStatus(body.qualificationStatus)
    ) {
      return NextResponse.json(
        { ok: false, error: "Invalid qualificationStatus." },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }
    if (
      body.outreachStatus !== undefined &&
      !isValidOutreachStatus(body.outreachStatus)
    ) {
      return NextResponse.json(
        { ok: false, error: "Invalid outreachStatus." },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }

    const result = await createOrganizerOutreachLead({
      leadName,
      hostedCruiseAndSailing,
      contactName:
        typeof body.contactName === "string" ? body.contactName : null,
      phone: typeof body.phone === "string" ? body.phone : null,
      phoneInvitesText: Boolean(body.phoneInvitesText),
      email: typeof body.email === "string" ? body.email : null,
      officialUrl:
        typeof body.officialUrl === "string" ? body.officialUrl : null,
      cohortDescription:
        typeof body.cohortDescription === "string"
          ? body.cohortDescription
          : undefined,
      shipName: typeof body.shipName === "string" ? body.shipName : undefined,
      sailDate: typeof body.sailDate === "string" ? body.sailDate : null,
      portWindowsSummary:
        typeof body.portWindowsSummary === "string"
          ? body.portWindowsSummary
          : undefined,
      qualificationStatus: isValidQualificationStatus(body.qualificationStatus)
        ? body.qualificationStatus
        : undefined,
      qualificationDetail:
        typeof body.qualificationDetail === "string"
          ? body.qualificationDetail
          : undefined,
      utmSource:
        typeof body.utmSource === "string" ? body.utmSource : undefined,
      sailingPageUrl:
        typeof body.sailingPageUrl === "string" ? body.sailingPageUrl : null,
      valueToPitchSummary:
        typeof body.valueToPitchSummary === "string"
          ? body.valueToPitchSummary
          : undefined,
      outreachStatus: isValidOutreachStatus(body.outreachStatus)
        ? body.outreachStatus
        : undefined,
      followUpDate:
        typeof body.followUpDate === "string" ? body.followUpDate : null,
      notes: typeof body.notes === "string" ? body.notes : "",
      updatedBy: auth.actor,
    });

    if (!result.ok) {
      const isValidation =
        result.error?.includes("required") ||
        result.error?.includes("must be");
      return NextResponse.json(result, {
        status: isValidation ? 400 : 503,
        headers: NO_STORE_HEADERS,
      });
    }

    const dashboard = await getOrganizerOutreachDashboard();
    return NextResponse.json(
      { ok: true, backend: result.backend, lead: result.lead, dashboard },
      { status: 201, headers: NO_STORE_HEADERS },
    );
  }

  if (action === "delete_or_reset") {
    const leadId = typeof body.leadId === "string" ? body.leadId : "";
    const result = await deleteOrResetOrganizerOutreachLead({
      leadId,
      updatedBy: auth.actor,
    });
    if (!result.ok) {
      const isBadReq = result.error?.includes("required");
      return NextResponse.json(result, {
        status: isBadReq ? 400 : 503,
        headers: NO_STORE_HEADERS,
      });
    }
    const dashboard = await getOrganizerOutreachDashboard();
    return NextResponse.json(
      {
        ok: true,
        backend: result.backend,
        actionTaken: result.actionTaken,
        dashboard,
      },
      { status: 200, headers: NO_STORE_HEADERS },
    );
  }

  // Default: update lead
  const leadId = typeof body.leadId === "string" ? body.leadId : "";
  const rawTouch = body.logTouchChannel;
  const logTouchChannel =
    rawTouch === "call" ||
    rawTouch === "text" ||
    rawTouch === "email" ||
    rawTouch === "portal"
      ? rawTouch
      : undefined;

  const result = await updateOrganizerOutreachLead({
    leadId,
    ...(body.outreachStatus !== undefined
      ? { outreachStatus: body.outreachStatus as never }
      : {}),
    ...(body.qualificationStatus !== undefined
      ? { qualificationStatus: body.qualificationStatus as never }
      : {}),
    ...(typeof body.qualificationDetail === "string"
      ? { qualificationDetail: body.qualificationDetail }
      : {}),
    ...(typeof body.hostedCruiseAndSailing === "string"
      ? { hostedCruiseAndSailing: body.hostedCruiseAndSailing }
      : {}),
    ...(typeof body.shipName === "string" ? { shipName: body.shipName } : {}),
    ...(body.sailDate !== undefined
      ? { sailDate: typeof body.sailDate === "string" ? body.sailDate : null }
      : {}),
    ...(body.sailingPageUrl !== undefined
      ? {
          sailingPageUrl:
            typeof body.sailingPageUrl === "string" ? body.sailingPageUrl : null,
        }
      : {}),
    ...(body.phone !== undefined
      ? { phone: typeof body.phone === "string" ? body.phone : null }
      : {}),
    ...(typeof body.phoneInvitesText === "boolean"
      ? { phoneInvitesText: body.phoneInvitesText }
      : {}),
    ...(body.email !== undefined
      ? { email: typeof body.email === "string" ? body.email : null }
      : {}),
    ...(body.officialUrl !== undefined
      ? {
          officialUrl:
            typeof body.officialUrl === "string" ? body.officialUrl : null,
        }
      : {}),
    ...(body.contactName !== undefined
      ? {
          contactName:
            typeof body.contactName === "string" ? body.contactName : null,
        }
      : {}),
    ...(typeof body.valueToPitchSummary === "string"
      ? { valueToPitchSummary: body.valueToPitchSummary }
      : {}),
    ...(typeof body.phoneOrTextScript === "string"
      ? { phoneOrTextScript: body.phoneOrTextScript }
      : {}),
    ...(typeof body.emailSubject === "string"
      ? { emailSubject: body.emailSubject }
      : {}),
    ...(typeof body.emailBody === "string"
      ? { emailBody: body.emailBody }
      : {}),
    ...(body.followUpDate !== undefined
      ? {
          followUpDate:
            typeof body.followUpDate === "string" ? body.followUpDate : null,
        }
      : {}),
    ...(typeof body.notes === "string" ? { notes: body.notes } : {}),
    ...(typeof body.boardCreated === "boolean"
      ? { boardCreated: body.boardCreated }
      : {}),
    ...(body.boardShareCode !== undefined
      ? {
          boardShareCode:
            typeof body.boardShareCode === "string" ? body.boardShareCode : null,
        }
      : {}),
    ...(body.boardUrl !== undefined
      ? { boardUrl: typeof body.boardUrl === "string" ? body.boardUrl : null }
      : {}),
    ...(body.travelersJoined !== undefined
      ? { travelersJoined: Number(body.travelersJoined) || 0 }
      : {}),
    logTouchChannel,
    ...(typeof body.logTouchSummary === "string"
      ? { logTouchSummary: body.logTouchSummary }
      : {}),
    updatedBy: auth.actor,
  });

  if (!result.ok) {
    const status = result.error?.includes("not found")
      ? 404
      : result.error?.includes("Invalid") ||
          result.error?.includes("required") ||
          result.error?.includes("must be")
        ? 400
        : 503;
    return NextResponse.json(result, {
      status,
      headers: NO_STORE_HEADERS,
    });
  }

  const dashboard = await getOrganizerOutreachDashboard();
  return NextResponse.json(
    { ok: true, backend: result.backend, lead: result.lead, dashboard },
    { status: 200, headers: NO_STORE_HEADERS },
  );
}
