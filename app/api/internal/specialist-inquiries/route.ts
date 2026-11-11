import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  extractNonPiiAttribution,
  formatAttributionSummaryLine,
  isPreviewOrLocalRuntime,
  type SpecialistCommercialHost,
} from "@/lib/dcc/commercialAttribution";
import {
  persistDurableTransactionalSubmission,
  resolveRuntimeEnvironmentTag,
  type TransactionalSubmissionChannel,
} from "@/lib/dcc/storage/transactionalSubmissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_SPECIALIST_CHANNELS: Record<
  string,
  {
    channel: TransactionalSubmissionChannel;
    specialistSite: SpecialistCommercialHost;
    defaultPortSlug: string;
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
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
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
          error:
            "Unsupported specialist inquiry channel. Expected juneauflightdeck-inquiry, welcometoneworleanstours-inquiry, or lastfrontiershoreexcursions-inquiry.",
        },
        { status: 400 },
      );
    }

    const name =
      typeof body.name === "string" ? body.name.trim().slice(0, 120) : "";
    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase().slice(0, 160)
        : "";
    const phone =
      typeof body.phone === "string" && body.phone.trim()
        ? body.phone.trim().slice(0, 40)
        : null;

    if (name.length < 2) {
      return NextResponse.json(
        { ok: false, error: "Please provide your name (at least 2 characters)." },
        { status: 400 },
      );
    }
    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json(
        { ok: false, error: "Please provide a valid email address." },
        { status: 400 },
      );
    }

    const partySize =
      body.partySize !== undefined && body.partySize !== null
        ? Math.max(1, Math.min(200, Math.round(Number(body.partySize) || 2)))
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

    const notes =
      typeof body.notes === "string" && body.notes.trim()
        ? body.notes.trim().slice(0, 1200)
        : null;

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
            : null,
        headline,
        dates,
        portDate: sanitizedAttribution.portDate,
        sailDate: sanitizedAttribution.sailDate,
        shipName: sanitizedAttribution.shipName,
        portCity: sanitizedAttribution.portSlug,
        partySize,
        routeOrLocation,
        notes,
        sourcePath: sanitizedAttribution.landingPath,
        attribution: sanitizedAttribution,
        namespace: previewContext ? "preview" : "production",
        intendedDestination: channelSpec.intendedDestination,
        notificationStatus:
          typeof body.notificationStatus === "string"
            ? body.notificationStatus
            : "not_configured",
        notificationDelivered: Boolean(body.notificationDelivered === true),
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
