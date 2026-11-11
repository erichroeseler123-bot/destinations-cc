import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  extractNonPiiAttribution,
  formatAttributionSummaryLine,
  isPreviewOrLocalRuntime,
  type SpecialistCommercialHost,
} from "@/lib/dcc/commercialAttribution";
import { resolveDccInternalSecret } from "@/lib/dcc/shared/envCompat";
import {
  persistDurableTransactionalSubmission,
  resolveRuntimeEnvironmentTag,
  type TransactionalSubmissionChannel,
} from "@/lib/dcc/storage/transactionalSubmissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const ALLOWED_SPECIALIST_CHANNELS: Record<
  string,
  {
    channel: TransactionalSubmissionChannel;
    specialistSite: SpecialistCommercialHost;
    defaultPortSlug: string | null;
    intendedDestination: string;
  }
> = {
  "juneauflightdeck-inquiry": {
    channel: "juneauflightdeck-inquiry",
    specialistSite: "juneauflightdeck.com",
    defaultPortSlug: "juneau",
    intendedDestination: "alerts@juneauflightdeck.com",
  },
  "welcometoneworleanstours-inquiry": {
    channel: "welcometoneworleanstours-inquiry",
    specialistSite: "welcometoneworleanstours.com",
    defaultPortSlug: "new-orleans",
    intendedDestination: "help@welcometoneworleanstours.com",
  },
  "lastfrontiershoreexcursions-inquiry": {
    channel: "lastfrontiershoreexcursions-inquiry",
    specialistSite: "lastfrontiershoreexcursions.com",
    defaultPortSlug: "juneau",
    intendedDestination: "concierge@lastfrontiershoreexcursions.com",
  },
  "welcometothedells-inquiry": {
    channel: "welcometothedells-inquiry",
    specialistSite: "welcometothedells.com",
    defaultPortSlug: null,
    intendedDestination: "hello@welcometothedells.com",
  },
  "saveonthestrip-help-request": {
    channel: "saveonthestrip-help-request",
    specialistSite: "saveonthestrip.com",
    defaultPortSlug: null,
    intendedDestination: "laurensanders123@gmail.com",
  },
  "welcometotheswamp-inquiry": {
    channel: "welcometotheswamp-inquiry",
    specialistSite: "welcometotheswamp.com",
    defaultPortSlug: "new-orleans",
    intendedDestination: "concierge@welcometotheswamp.com",
  },
  "gosno-dispatch": {
    channel: "gosno-dispatch",
    specialistSite: "gosno.co",
    defaultPortSlug: null,
    intendedDestination: "dispatch@gosno.co",
  },
  "parr-inquiry": {
    channel: "parr-inquiry",
    specialistSite: "partyatredrocks.com",
    defaultPortSlug: null,
    intendedDestination: "hello@partyatredrocks.com",
  },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readBearerToken(request: Request): string {
  const auth = request.headers.get("authorization") || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}

function authorizeSpecialistIngestRequest(request: Request): {
  authorized: boolean;
  error?: string;
} {
  const configuredSecret = resolveDccInternalSecret();
  const dccHeaderSecret = request.headers.get("x-dcc-internal-secret")?.trim() || "";
  const legacyHeaderSecret = request.headers.get("x-internal-secret")?.trim() || "";
  const bearerSecret = readBearerToken(request);

  if (configuredSecret) {
    if (
      configuredSecret === dccHeaderSecret ||
      configuredSecret === legacyHeaderSecret ||
      configuredSecret === bearerSecret
    ) {
      return { authorized: true };
    }
    return {
      authorized: false,
      error: "Invalid or missing specialist ingest secret.",
    };
  }

  // Allow isolated local unit tests without a secret configured; fail closed elsewhere
  if (process.env.DCC_ISOLATED_TEST_DB === "1") {
    return { authorized: true };
  }

  return {
    authorized: false,
    error: "Internal API secret unconfigured.",
  };
}

export async function POST(request: Request) {
  try {
    const auth = authorizeSpecialistIngestRequest(request);
    if (!auth.authorized) {
      return NextResponse.json(
        { ok: false, error: auth.error || "Unauthorized." },
        { status: 401 },
      );
    }

    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON payload." },
        { status: 400 },
      );
    }

    // Honeypot check
    if (typeof body.website === "string" && body.website.trim().length > 0) {
      return NextResponse.json(
        { ok: false, error: "Invalid submission." },
        { status: 400 },
      );
    }

    const rawChannel = String(body.channel || "").trim();
    const channelSpec = ALLOWED_SPECIALIST_CHANNELS[rawChannel];
    if (!channelSpec) {
      return NextResponse.json(
        {
          ok: false,
          error: `Unsupported specialist inquiry channel. Expected one of: ${Object.keys(ALLOWED_SPECIALIST_CHANNELS).join(", ")}.`,
        },
        { status: 400 },
      );
    }

    const rawName =
      typeof body.name === "string" ? body.name.trim().slice(0, 120) : "";
    if (typeof body.name === "string" && rawName.length > 0 && rawName.length < 2) {
      return NextResponse.json(
        { ok: false, error: "Please provide your name (at least 2 characters)." },
        { status: 400 },
      );
    }
    const name = rawName || "Guest";

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase().slice(0, 160)
        : "";
    const phone =
      typeof body.phone === "string" && body.phone.trim()
        ? body.phone.trim().slice(0, 40)
        : null;

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json(
        { ok: false, error: "Please provide a valid email address." },
        { status: 400 },
      );
    }

    const rawPartySize = body.partySize ?? body.groupSize;
    const partySize =
      rawPartySize !== undefined && rawPartySize !== null && String(rawPartySize).trim() !== ""
        ? Math.max(1, Math.min(200, Math.round(Number(rawPartySize) || 2)))
        : 2;

    const previewContext =
      isPreviewOrLocalRuntime(request) ||
      String(body.environment || "").trim().toLowerCase() === "preview" ||
      String(body.namespace || "").trim().toLowerCase() === "preview" ||
      body.isTest === true;

    const environment = previewContext
      ? "preview"
      : resolveRuntimeEnvironmentTag();
    const isTest = Boolean(previewContext || body.isTest);

    const rawAttribution =
      body.attribution && typeof body.attribution === "object"
        ? (body.attribution as Record<string, unknown>)
        : body;

    const sanitizedAttribution = extractNonPiiAttribution(rawAttribution, {
      specialistSite: channelSpec.specialistSite,
      defaultPortSlug: channelSpec.defaultPortSlug,
      landingPath:
        typeof body.sourcePath === "string"
          ? body.sourcePath
          : typeof body.sourcePage === "string"
            ? body.sourcePage
            : null,
    });

    const submissionId =
      typeof body.submissionId === "string" && body.submissionId.trim()
        ? body.submissionId
            .trim()
            .replace(/[^a-zA-Z0-9_-]/g, "")
            .slice(0, 80)
        : `SPEC-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 8).toUpperCase()}`;

    const headline =
      typeof body.headline === "string" && body.headline.trim()
        ? body.headline.trim().slice(0, 180)
        : `${channelSpec.specialistSite} Qualified Inquiry`;

    const dates =
      typeof body.dates === "string" && body.dates.trim()
        ? body.dates.trim().slice(0, 80)
        : typeof body.portDate === "string" && body.portDate.trim()
          ? body.portDate.trim().slice(0, 80)
          : sanitizedAttribution.portDate || sanitizedAttribution.sailDate || null;

    const routeOrLocation =
      typeof body.routeOrLocation === "string" && body.routeOrLocation.trim()
        ? body.routeOrLocation.trim().slice(0, 140)
        : [
            sanitizedAttribution.shipName,
            sanitizedAttribution.portSlug,
            sanitizedAttribution.berthOrTerminal,
          ]
            .filter(Boolean)
            .join(" · ") || null;

    const notesRaw =
      typeof body.notes === "string" && body.notes.trim()
        ? body.notes.trim()
        : typeof body.message === "string" && body.message.trim()
          ? body.message.trim()
          : "";
    const notes = notesRaw ? notesRaw.slice(0, 1200) : null;

    const emailSent =
      typeof body.emailSent === "boolean"
        ? body.emailSent
        : body.notificationDelivered === true;
    const emailReason =
      typeof body.emailReason === "string" && body.emailReason.trim()
        ? body.emailReason.trim().slice(0, 240)
        : null;
    const emailProviderId =
      typeof body.emailProviderId === "string" && body.emailProviderId.trim()
        ? body.emailProviderId.trim().slice(0, 120)
        : null;
    const notificationStatus =
      typeof body.notificationStatus === "string" && body.notificationStatus.trim()
        ? body.notificationStatus.trim()
        : emailSent
          ? "sent"
          : isTest
            ? "suppressed_test"
            : "not_configured";

    const intendedDestination =
      typeof body.intendedDestination === "string" && body.intendedDestination.trim()
        ? body.intendedDestination.trim().slice(0, 160)
        : channelSpec.intendedDestination;

    const createdAt = new Date().toISOString();
    const attrSummary = formatAttributionSummaryLine(sanitizedAttribution);

    const persisted = await persistDurableTransactionalSubmission({
      submissionId,
      channel: channelSpec.channel,
      status: "captured",
      summaryNote: `${headline}${attrSummary ? ` [${attrSummary}]` : ""}`,
      payload: {
        name,
        email,
        phone,
        company:
          typeof body.company === "string" && body.company.trim()
            ? body.company.trim().slice(0, 100)
            : typeof body.cruiseLine === "string" && body.cruiseLine.trim()
              ? body.cruiseLine.trim().slice(0, 100)
              : null,
        headline,
        dates,
        portDate: sanitizedAttribution.portDate,
        sailDate: sanitizedAttribution.sailDate,
        shipName: sanitizedAttribution.shipName,
        portCity: sanitizedAttribution.portSlug,
        partySize,
        tourType:
          typeof body.tourType === "string" && body.tourType.trim()
            ? body.tourType.trim().slice(0, 80)
            : null,
        bookingMode:
          typeof body.bookingMode === "string" && body.bookingMode.trim()
            ? body.bookingMode.trim().slice(0, 80)
            : null,
        routeOrLocation,
        notes,
        sourcePath: sanitizedAttribution.landingPath,
        attribution: sanitizedAttribution,
        namespace: previewContext ? "preview" : "production",
        intendedDestination,
        emailSent,
        emailReason,
        emailProviderId,
        notificationStatus,
        notificationDelivered: Boolean(
          body.notificationDelivered === true ||
            emailSent === true ||
            notificationStatus === "sent",
        ),
      },
      environment,
      isTest,
      createdAt,
    });

    if (!persisted.ok || !persisted.persisted) {
      return NextResponse.json(
        {
          ok: false,
          persisted: false,
          error:
            persisted.error ||
            "Durable operator inbox storage is temporarily unavailable.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        persisted: true,
        backend: persisted.backend,
        findingId: persisted.findingId,
        submissionId,
        environment,
        isTest,
        classification: isTest ? "test" : "genuine",
        attribution: sanitizedAttribution,
      },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "Failed to process specialist inquiry.",
      },
      { status: 500 },
    );
  }
}
