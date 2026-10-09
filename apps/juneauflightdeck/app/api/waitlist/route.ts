import { NextResponse } from "next/server";
import { getDb } from "../../../lib/db";
import { saveWaitlistEntry, type WaitlistEntry } from "../../../lib/waitlistStore";
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
      bookingMode = "availability_inquiry",
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
        { ok: false, error: "Please enter a valid email address for your availability inquiry." },
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

    // Public submissions are on-demand inquiries, never automated alert enrollment.
    const normalizedMode = "availability_inquiry" as const;

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
            error: "A valid Juneau port date (YYYY-MM-DD) is required when requesting help for both ports.",
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
              "A valid Skagway port date (YYYY-MM-DD) is required when requesting help for both ports. Check your ship itinerary for your Skagway call date.",
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
    const submissionId = `JFD-INQUIRY-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`;

    const perSeat =
      tourType === "dog_sledding" ? 649 : tourType === "ice_trek" ? 599 : 449;

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
      tourType: tourType || "any",
      partySize: parsedPartySize,
      bookingMode: normalizedMode,
      notes: notes ? String(notes).trim() : undefined,
      status: isTest ? "test_excluded" : "inquiry_received",
      isTest: Boolean(isTest),
      operatorHoldStatus: "not_held",
      estimatedValue: parsedPartySize * perSeat,
    };

    await saveWaitlistEntry(entry);

    let notificationDispatched = false;
    try {
      const intakeNotification = await dispatchWaitlistIntakeNotification(entry);
      notificationDispatched = intakeNotification?.status === "delivered";
    } catch (notifErr) {
      console.warn("[WaitlistAPI] Intake notification dispatch error:", notifErr);
    }

    if (!notificationDispatched && !getDb()) {
      return NextResponse.json({ok: false, error: "We could not reliably deliver your inquiry. Please email dispatch@juneauflightdeck.com directly."}, {status: 503});
    }

    return NextResponse.json({
      ok: true,
      submissionId,
      notificationDispatched,
      bookingMode: entry.bookingMode,
      isTest: entry.isTest,
      message: notificationDispatched
        ? "Availability inquiry received. This is not a reservation or an automated alert subscription."
        : "Your inquiry was saved, but dispatch email could not be confirmed. Contact dispatch@juneauflightdeck.com with your inquiry reference.",
      details: {
        portDate: entry.portDate,
        juneauDate: entry.juneauDate,
        skagwayDate: entry.skagwayDate,
        partySize: entry.partySize,
        bookingMode: entry.bookingMode,
        dateVerification: entry.dateVerification,
        operatorHoldStatus: entry.operatorHoldStatus,
        cancellationNotice:
          "Cancellation, weather, and missed-port terms depend on your operator and booking channel. Verify current terms before booking.",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to process waitlist request." },
      { status: 500 }
    );
  }
}
