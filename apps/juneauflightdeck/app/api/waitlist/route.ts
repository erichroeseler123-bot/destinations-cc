import { NextResponse } from "next/server";
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
      status: isTest ? "test_excluded" : "active_scanning",
      isTest: Boolean(isTest),
      operatorHoldStatus: "not_held",
      estimatedValue: parsedPartySize * perSeat,
    };

    await saveWaitlistEntry(entry);

    let notificationDispatched = false;
    try {
      const intakeNotification = await dispatchWaitlistIntakeNotification(entry);
      notificationDispatched = Boolean(intakeNotification);
    } catch (notifErr) {
      console.warn("[WaitlistAPI] Intake notification dispatch error:", notifErr);
    }

    return NextResponse.json({
      ok: true,
      submissionId,
      notificationDispatched,
      bookingMode: entry.bookingMode,
      isTest: entry.isTest,
      message:
        entry.bookingMode === "concierge_dispatch"
          ? "Concierge Dispatch Alert activated! Our 10:00 AM daily sweep will monitor operator drops. If seats open, dispatch will alert you via email and personal coordination with direct flight checkout."
          : "Daily 10:00 AM Seat Drop Alert activated! Our automated daily sweep monitors operator cancellations. When seats open, you will receive an email alert with direct operator checkout links.",
      details: {
        portDate: entry.portDate,
        juneauDate: entry.juneauDate,
        skagwayDate: entry.skagwayDate,
        partySize: entry.partySize,
        bookingMode: entry.bookingMode,
        dateVerification: entry.dateVerification,
        operatorHoldStatus: entry.operatorHoldStatus,
        cancellationNotice:
          "• Customer Cancellation Cutoff: Full refund according to operator policy (TEMSCO/NorthStar: 48h prior; Coastal: 7+ days prior). • Operator Weather & Port Policy: 100% full refund if flight is grounded due to weather/safety or if ship misses port (independent of the customer cancellation cutoff).",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to process waitlist request." },
      { status: 500 }
    );
  }
}
