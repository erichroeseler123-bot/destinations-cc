import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  extractNonPiiAttribution,
  formatAttributionSummaryLine,
  isPreviewOrLocalRuntime,
} from "@/lib/dcc/commercialAttribution";
import {
  persistDurableTransactionalSubmission,
  resolveRuntimeEnvironmentTag,
} from "@/lib/dcc/storage/transactionalSubmissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Updated automatically when DCC isolated preview deployment URL is provisioned;
// production rollout uses DCC_API_BASE_URL ("https://www.destinationcommandcenter.com").
const DEFAULT_DCC_PREVIEW_INGEST_BASE =
  "https://destinations-9i4htio13-erichroeseler123-bots-projects.vercel.app";

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

    if (typeof body.website === "string" && body.website.trim().length > 0) {
      return NextResponse.json(
        { ok: false, error: "Invalid submission." },
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
        { ok: false, error: "Please enter your name (at least 2 characters)." },
        { status: 400 },
      );
    }
    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json(
        { ok: false, error: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    const parsedPartySize = Math.max(
      1,
      Math.min(200, Math.round(Number(body.partySize) || 2)),
    );
    const shipName =
      typeof body.shipName === "string" && body.shipName.trim()
        ? body.shipName.trim().slice(0, 80)
        : "Port of New Orleans Traveler";
    const sailDate =
      typeof body.sailDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.sailDate.trim())
        ? body.sailDate.trim()
        : null;
    const timingScenario =
      typeof body.timingScenario === "string" && body.timingScenario.trim()
        ? body.timingScenario.trim().slice(0, 64)
        : "day_before_cruise";
    const terminal =
      typeof body.terminal === "string" && body.terminal.trim()
        ? body.terminal.trim().slice(0, 64)
        : "Erato / Julia St Cruise Terminal";
    const luggageStatus =
      typeof body.luggageStatus === "string" && body.luggageStatus.trim()
        ? body.luggageStatus.trim().slice(0, 80)
        : "hotel_or_porter_stored";
    const interestFocus =
      typeof body.interestFocus === "string" && body.interestFocus.trim()
        ? body.interestFocus.trim().slice(0, 80)
        : "riverboat_or_quarter_walk";
    const notes =
      typeof body.notes === "string" && body.notes.trim()
        ? body.notes.trim().slice(0, 1000)
        : null;

    const sourcePath =
      typeof body.sourcePath === "string" && body.sourcePath.trim()
        ? body.sourcePath.trim().slice(0, 160)
        : "/guides/things-to-do-before-a-cruise-new-orleans";

    const previewRuntime = isPreviewOrLocalRuntime(request);
    const effectiveIsTest = Boolean(
      body.isTest === true ||
        previewRuntime ||
        String(body.environment || "").trim().toLowerCase() === "preview",
    );
    const runtimeEnv = previewRuntime
      ? "preview"
      : resolveRuntimeEnvironmentTag();

    const rawAttribution = {
      ...(body.attribution && typeof body.attribution === "object"
        ? (body.attribution as Record<string, unknown>)
        : {}),
      shipName,
      sailDate,
      portDate: sailDate,
      port: "new-orleans",
      terminal,
      partySize: parsedPartySize,
      landingPath: sourcePath,
    };

    const sanitizedAttribution = extractNonPiiAttribution(rawAttribution, {
      specialistSite: "welcometoneworleanstours.com",
      defaultPortSlug: "new-orleans",
      landingPath: sourcePath,
    });

    const submissionId = `WNO-INQ-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 6).toUpperCase()}`;
    const scenarioLabel =
      timingScenario === "embarkation_day"
        ? "Same-Day Embarkation"
        : timingScenario === "post_cruise_debarkation"
          ? "Post-Cruise Debarkation"
          : "Pre-Cruise Day-Prior";
    const headline = `NOLA ${scenarioLabel} Concierge (${interestFocus.replace(/_/g, " ")}) — ${shipName}`;
    const combinedNotes = [
      `Scenario: ${scenarioLabel}`,
      `Terminal: ${terminal}`,
      `Luggage: ${luggageStatus.replace(/_/g, " ")}`,
      `Interest: ${interestFocus.replace(/_/g, " ")}`,
      notes ? `Traveler note: ${notes}` : null,
      "Qualified inquiry only — no payment collected on Welcome to New Orleans Tours.",
    ]
      .filter(Boolean)
      .join(" · ");

    const attrSummary = formatAttributionSummaryLine(sanitizedAttribution);

    // 1. Attempt direct durable write when DATABASE_URL is configured (or local non-serverless dev)
    const directPersisted = await persistDurableTransactionalSubmission({
      submissionId,
      channel: "welcometoneworleanstours-inquiry",
      status: "captured",
      summaryNote: `${headline}${attrSummary ? ` [${attrSummary}]` : ""}`,
      payload: {
        name,
        email,
        phone,
        headline,
        dates: sailDate,
        sailDate,
        portDate: sailDate,
        shipName,
        portCity: "new-orleans",
        partySize: parsedPartySize,
        routeOrLocation: `${shipName} · ${terminal}`,
        notes: combinedNotes,
        sourcePath,
        attribution: sanitizedAttribution,
        namespace: previewRuntime ? "preview" : "production",
        intendedDestination: "help@welcometoneworleanstours.com",
        notificationStatus: effectiveIsTest
          ? "skipped_disabled"
          : "not_configured",
        notificationDelivered: false,
      },
      environment: runtimeEnv,
      isTest: effectiveIsTest,
    });

    if (directPersisted.ok && directPersisted.persisted) {
      return NextResponse.json({
        ok: true,
        persisted: true,
        backend: directPersisted.backend,
        findingId: directPersisted.findingId,
        submissionId,
        environment: runtimeEnv,
        isTest: effectiveIsTest,
        attribution: sanitizedAttribution,
        conversionEvent: "wno_cruise_inquiry_submitted",
        message:
          "Your New Orleans cruise turnaround inquiry is saved in our Unified Operator Inbox (no payment collected). Our concierge desk will follow up with luggage-compatible operator options for your schedule.",
      });
    }

    // 2. Standalone WNO Vercel container fallback: forward server-to-server to DCC specialist-inquiries ingest
    const dccBase = (
      process.env.DCC_SPECIALIST_INQUIRY_INGEST_URL ||
      process.env.DCC_API_BASE_URL ||
      process.env.NEXT_PUBLIC_DCC_API_URL ||
      (previewRuntime
        ? DEFAULT_DCC_PREVIEW_INGEST_BASE
        : "https://www.destinationcommandcenter.com")
    )
      .trim()
      .replace(/\/+$/, "");

    const upstreamHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-specialist-origin-host":
        request.headers.get("host") || "welcometoneworleanstours.vercel.app",
    };
    const internalAuthSecret = (
      process.env.DCC_INTERNAL_API_SECRET ||
      process.env.INTERNAL_API_SECRET ||
      process.env.ADMIN_ACCESS_KEY ||
      ""
    ).trim();
    if (internalAuthSecret) {
      upstreamHeaders["x-admin-access-key"] = internalAuthSecret;
      upstreamHeaders["x-internal-secret"] = internalAuthSecret;
      upstreamHeaders.Authorization = `Bearer ${internalAuthSecret}`;
    }
    const previewBypass = (
      process.env.DCC_PREVIEW_BYPASS_SECRET ||
      process.env.VERCEL_AUTOMATION_BYPASS_SECRET ||
      ""
    ).trim();
    if (previewBypass && dccBase.includes(".vercel.app")) {
      upstreamHeaders["x-vercel-protection-bypass"] = previewBypass;
    }

    const upstreamRes = await fetch(
      `${dccBase}/api/internal/specialist-inquiries`,
      {
        method: "POST",
        headers: upstreamHeaders,
        body: JSON.stringify({
          channel: "welcometoneworleanstours-inquiry",
          submissionId,
          name,
          email,
          phone,
          headline,
          dates: sailDate,
          partySize: parsedPartySize,
          routeOrLocation: `${shipName} · ${terminal}`,
          notes: combinedNotes,
          sourcePath,
          environment: runtimeEnv,
          namespace: previewRuntime ? "preview" : "production",
          isTest: effectiveIsTest,
          notificationStatus: effectiveIsTest
            ? "skipped_disabled"
            : "not_configured",
          attribution: sanitizedAttribution,
        }),
        cache: "no-store",
      },
    );

    const upstreamData = (await upstreamRes.json().catch(() => null)) as {
      ok?: boolean;
      persisted?: boolean;
      backend?: string;
      findingId?: string;
      error?: string;
    } | null;

    if (!upstreamRes.ok || !upstreamData?.ok || !upstreamData.persisted) {
      return NextResponse.json(
        {
          ok: false,
          persisted: false,
          error:
            upstreamData?.error ||
            "Inquiry storage is temporarily unreachable. Please email help@welcometoneworleanstours.com directly.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json({
      ok: true,
      persisted: true,
      backend: upstreamData.backend || "dcc_remote_postgres",
      findingId: upstreamData.findingId || null,
      submissionId,
      environment: runtimeEnv,
      isTest: effectiveIsTest,
      attribution: sanitizedAttribution,
      conversionEvent: "wno_cruise_inquiry_submitted",
      message:
        "Your New Orleans cruise turnaround inquiry is saved in our Unified Operator Inbox (no payment collected). Our concierge desk will follow up with luggage-compatible operator options for your schedule.",
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        persisted: false,
        error:
          err instanceof Error
            ? err.message
            : "Unable to process inquiry right now.",
      },
      { status: 500 },
    );
  }
}
