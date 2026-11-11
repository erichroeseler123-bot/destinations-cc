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
import { saveWaitlistEntry, normalizeTourPreference, type WaitlistEntry } from "../../../lib/waitlistStore";
import { dispatchWaitlistIntakeNotification } from "../../../lib/notificationDispatcher";

export const dynamic = "force-dynamic";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidIsoDate(str: unknown): str is string {
  if (typeof str !== "string" || !DATE_REGEX.test(str)) return false;
  const d = new Date(str);
  return !isNaN(d.getTime()) && str === d.toISOString().slice(0, 10);
}

function getTodayAlaskaDate(): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Juneau",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      cruiseLine,
      shipName,
      portDate,
      juneauDate,
      skagwayDate,
      portCity = "juneau",
      tourType = "any",
      partySize = 2,
      allowSplitParty = false,
      preferredOperator,
      bookingMode = "instant_alert",
      notes,
    } = body;
    const isTest = Boolean(body.isTest ?? body.is_test ?? false);

    // 1. Basic Identity Validation
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { ok: false, error: "Please enter your full passenger or party name." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json(
        { ok: false, error: "Please enter a valid email address to receive seat notifications." },
        { status: 400 }
      );
    }

    // 2. Party Size Validation
    const parsedPartySize = parseInt(String(partySize), 10);
    if (isNaN(parsedPartySize) || parsedPartySize < 1 || parsedPartySize > 20) {
      return NextResponse.json(
        { ok: false, error: "Party size must be between 1 and 20 passengers." },
        { status: 400 }
      );
    }

    // 3. Port Location Validation
    const normalizedPortCity =
      portCity === "skagway" ? "skagway" : portCity === "either" ? "either" : "juneau";

    // 4. Booking Mode & Phone Validation
    const normalizedMode =
      bookingMode === "concierge_dispatch" || bookingMode === "priority_hold"
        ? "concierge_dispatch"
        : "instant_alert";

    if (normalizedMode === "concierge_dispatch" && (!phone || String(phone).replace(/\D/g, "").length < 7)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "A valid contact phone number is required for Concierge Dispatch so our dispatch team can coordinate directly with you when seats drop.",
        },
        { status: 400 }
      );
    }

    // 5. Date Validation
    const today = getTodayAlaskaDate();

    let resolvedJuneauDate: string | undefined;
    let resolvedSkagwayDate: string | undefined;

    if (normalizedPortCity === "juneau") {
      const candidate = (juneauDate || portDate || "").trim();
      if (!isValidIsoDate(candidate)) {
        return NextResponse.json(
          { ok: false, error: "Please enter a valid Juneau cruise port date (YYYY-MM-DD)." },
          { status: 400 }
        );
      }
      if (candidate < today) {
        return NextResponse.json(
          { ok: false, error: "Juneau port date cannot be in the past." },
          { status: 400 }
        );
      }
      resolvedJuneauDate = candidate;
    } else if (normalizedPortCity === "skagway") {
      const candidate = (skagwayDate || portDate || "").trim();
      if (!isValidIsoDate(candidate)) {
        return NextResponse.json(
          { ok: false, error: "Please enter a valid Skagway cruise port date (YYYY-MM-DD)." },
          { status: 400 }
        );
      }
      if (candidate < today) {
        return NextResponse.json(
          { ok: false, error: "Skagway port date cannot be in the past." },
          { status: 400 }
        );
      }
      resolvedSkagwayDate = candidate;
    } else {
      const jCandidate = (juneauDate || portDate || "").trim();
      const sCandidate = (skagwayDate || "").trim();

      if (!isValidIsoDate(jCandidate)) {
        return NextResponse.json(
          {
            ok: false,
            error: "A valid Juneau port date (YYYY-MM-DD) is required when scanning both ports.",
          },
          { status: 400 }
        );
      }
      if (jCandidate < today) {
        return NextResponse.json(
          { ok: false, error: "Juneau port date cannot be in the past." },
          { status: 400 }
        );
      }

      if (!isValidIsoDate(sCandidate)) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "A valid Skagway port date (YYYY-MM-DD) is required when scanning both ports. Check your ship itinerary for your Skagway call date.",
          },
          { status: 400 }
        );
      }
      if (sCandidate < today) {
        return NextResponse.json(
          { ok: false, error: "Skagway port date cannot be in the past." },
          { status: 400 }
        );
      }

      resolvedJuneauDate = jCandidate;
      resolvedSkagwayDate = sCandidate;
    }

    const primaryPortDate = resolvedJuneauDate || resolvedSkagwayDate || String(portDate).trim();
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const submissionId = `JFD-SCAN-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`;

    const { tourType: normalizedTourType, preferredOperator: normalizedPreferredOp } =
      normalizeTourPreference(tourType, preferredOperator);

    const perSeat =
      normalizedTourType === "dog_sledding" ? 649 : normalizedTourType === "ice_trek" ? 599 : 449;

    const previewRuntime = isPreviewOrLocalRuntime(request);
    const effectiveIsTest = Boolean(
      isTest ||
        previewRuntime ||
        String(body.environment || "").trim().toLowerCase() === "preview",
    );
    const runtimeEnv = previewRuntime
      ? "preview"
      : resolveRuntimeEnvironmentTag();

    const sourcePage =
      typeof body.sourcePage === "string" && body.sourcePage.trim()
        ? body.sourcePage.trim().slice(0, 160)
        : "/juneau-helicopter-tour-sold-out";

    const rawAttrInput: Record<string, unknown> = {
      ...(body.attribution && typeof body.attribution === "object"
        ? (body.attribution as Record<string, unknown>)
        : {}),
      shipName: String(shipName || "Unspecified").trim(),
      sailDate:
        typeof body.sailDate === "string" && body.sailDate.trim()
          ? body.sailDate.trim()
          : primaryPortDate,
      portDate: primaryPortDate,
      port: normalizedPortCity === "skagway" ? "skagway" : "juneau",
      partySize: parsedPartySize,
      landingPath: sourcePage,
    };

    const sanitizedAttribution = extractNonPiiAttribution(rawAttrInput, {
      specialistSite: "juneauflightdeck.com",
      defaultPortSlug: normalizedPortCity === "skagway" ? "skagway" : "juneau",
      landingPath: sourcePage,
    });

    const entry: WaitlistEntry = {
      id: submissionId,
      createdAt: new Date().toISOString(),
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      phone: phone ? String(phone).trim() : undefined,
      cruiseLine: String(cruiseLine || "Unspecified").trim(),
      shipName: String(shipName || "Unspecified").trim(),
      portDate: primaryPortDate,
      juneauDate: resolvedJuneauDate,
      skagwayDate: resolvedSkagwayDate,
      dateVerification: "passenger_supplied",
      portCity: normalizedPortCity,
      tourType: normalizedTourType,
      preferredOperator: normalizedPreferredOp !== "any" ? normalizedPreferredOp : undefined,
      partySize: parsedPartySize,
      allowSplitParty: Boolean(allowSplitParty ?? body.allow_split_party ?? false),
      bookingMode: normalizedMode,
      notes: notes ? String(notes).trim() : undefined,
      status: effectiveIsTest ? "test_excluded" : "concierge_review",
      isTest: effectiveIsTest,
      operatorHoldStatus: "not_held",
      estimatedValue: parsedPartySize * perSeat,
      environment: runtimeEnv,
      sourcePage,
      attribution: sanitizedAttribution as unknown as Record<string, unknown>,
    };

    await saveWaitlistEntry(entry);

    let notificationDispatched = false;
    if (!effectiveIsTest) {
      try {
        const intakeNotification = await dispatchWaitlistIntakeNotification(entry);
        notificationDispatched = Boolean(intakeNotification);
      } catch (notifErr) {
        console.warn("[WaitlistAPI] Intake notification dispatch error:", notifErr);
      }
    }

    const attrSummary = formatAttributionSummaryLine(sanitizedAttribution);
    const headline = `Glacier ${normalizedTourType.replace(/_/g, " ")} (${normalizedMode.replace(/_/g, " ")}) — ${entry.shipName}`;

    const datesLabel =
      [
        resolvedJuneauDate ? `Juneau ${resolvedJuneauDate}` : null,
        resolvedSkagwayDate ? `Skagway ${resolvedSkagwayDate}` : null,
      ]
        .filter(Boolean)
        .join(" / ") || primaryPortDate;
    const combinedNotes = [
      entry.notes,
      `Est. gross booking value: $${entry.estimatedValue?.toLocaleString() || 0} (no payment collected; qualified availability inquiry)`,
    ]
      .filter(Boolean)
      .join(" · ");
    const resolvedNotifStatus = effectiveIsTest
      ? "skipped_disabled"
      : notificationDispatched
        ? "delivered"
        : "not_configured";

    const inboxPersistence = await persistDurableTransactionalSubmission({
      submissionId,
      channel: "juneauflightdeck-inquiry",
      status: "captured",
      summaryNote: `${headline}${attrSummary ? ` [${attrSummary}]` : ""}`,
      payload: {
        name: entry.name,
        email: entry.email,
        phone: entry.phone || null,
        company: entry.cruiseLine,
        headline,
        dates: datesLabel,
        portDate: primaryPortDate,
        sailDate: sanitizedAttribution.sailDate,
        shipName: entry.shipName,
        portCity: normalizedPortCity,
        partySize: parsedPartySize,
        routeOrLocation: `${entry.shipName} · ${normalizedPortCity.toUpperCase()}`,
        notes: combinedNotes,
        sourcePath: sourcePage,
        attribution: sanitizedAttribution,
        namespace: previewRuntime ? "preview" : "production",
        intendedDestination: "alerts@juneauflightdeck.com",
        notificationStatus: resolvedNotifStatus,
        notificationDelivered: notificationDispatched,
      },
      environment: runtimeEnv,
      isTest: effectiveIsTest,
      createdAt: entry.createdAt,
    });

    // Cross-container sync when DCC_SPECIALIST_INQUIRY_INGEST_URL is configured
    // (e.g. isolated Vercel Preview where JFD and DCC use separate non-prod DBs)
    // or when local serverless DB persistence is unavailable.
    let remoteInboxPersisted = false;
    let remoteFindingId: string | null = null;
    const explicitDccIngestBase = (
      process.env.DCC_SPECIALIST_INQUIRY_INGEST_URL || ""
    )
      .trim()
      .replace(/\/+$/, "");
    const fallbackDccIngestBase = !inboxPersistence.persisted
      ? (
          process.env.DCC_API_BASE_URL ||
          "https://www.destinationcommandcenter.com"
        )
          .trim()
          .replace(/\/+$/, "")
      : "";
    const targetDccBase = explicitDccIngestBase || fallbackDccIngestBase;

    if (targetDccBase) {
      try {
        const upstreamHeaders: Record<string, string> = {
          "Content-Type": "application/json",
          Accept: "application/json",
          "x-specialist-origin-host":
            request.headers.get("host") || "juneauflightdeck.vercel.app",
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
        if (previewBypass && targetDccBase.includes(".vercel.app")) {
          upstreamHeaders["x-vercel-protection-bypass"] = previewBypass;
        }

        const remoteRes = await fetch(
          `${targetDccBase}/api/internal/specialist-inquiries`,
          {
            method: "POST",
            headers: upstreamHeaders,
            body: JSON.stringify({
              channel: "juneauflightdeck-inquiry",
              submissionId,
              name: entry.name,
              email: entry.email,
              phone: entry.phone || null,
              company: entry.cruiseLine,
              headline,
              dates: datesLabel,
              partySize: parsedPartySize,
              routeOrLocation: `${entry.shipName} · ${normalizedPortCity.toUpperCase()}`,
              notes: combinedNotes,
              sourcePath: sourcePage,
              environment: runtimeEnv,
              namespace: previewRuntime ? "preview" : "production",
              isTest: effectiveIsTest,
              notificationStatus: resolvedNotifStatus,
              notificationDelivered: notificationDispatched,
              attribution: sanitizedAttribution,
            }),
            cache: "no-store",
          },
        );
        const remoteJson = (await remoteRes.json().catch(() => null)) as {
          ok?: boolean;
          persisted?: boolean;
          findingId?: string;
        } | null;
        if (remoteRes.ok && remoteJson?.ok && remoteJson.persisted) {
          remoteInboxPersisted = true;
          remoteFindingId = remoteJson.findingId || null;
        }
      } catch (syncErr) {
        console.warn("[WaitlistAPI] Remote DCC specialist ingest sync warning:", syncErr);
      }
    }

    return NextResponse.json({
      ok: true,
      id: submissionId,
      submissionId,
      operatorInboxPersisted: Boolean(
        inboxPersistence.persisted || remoteInboxPersisted,
      ),
      operatorInboxFindingId: remoteFindingId || inboxPersistence.findingId,
      environment: runtimeEnv,
      notificationDispatched,
      bookingMode: entry.bookingMode,
      isTest: entry.isTest,
      attribution: sanitizedAttribution,
      conversionEvent: "jfd_qualified_inquiry_submitted",
      message:
        entry.bookingMode === "concierge_dispatch"
          ? "Qualified concierge availability request logged (no payment collected). Our Juneau desk reviews local Part 135 operator schedules and contacts you directly with verified partner or direct operator checkout links if matching seats open."
          : "Qualified availability alert request logged (no payment collected). When matching seats open on local Part 135 operator schedules for your port date, we email you direct operator or verified partner checkout links.",
      details: {
        portDate: entry.portDate,
        juneauDate: entry.juneauDate,
        skagwayDate: entry.skagwayDate,
        partySize: entry.partySize,
        bookingMode: entry.bookingMode,
        dateVerification: entry.dateVerification,
        operatorHoldStatus: entry.operatorHoldStatus,
        cancellationNotice:
          "• No payment or card hold is collected by Juneau Flight Deck. • Published Operator Terms: TEMSCO (48h full refund), Coastal (7+ days full refund; 4–6 days 50%), NorthStar (48h full refund); Viator partner bookings follow listing terms (typically 24h free cancellation + Section 20 Worry-Free Shore Excursion protection on qualifying tours). • 100% weather-grounding refund across all three FAA Part 135 operators.",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to process waitlist request." },
      { status: 500 }
    );
  }
}
