import { NextResponse } from "next/server";
import { saveWaitlistSubmission } from "../../../../lib/db";
import { getTodayNewOrleansDate } from "../../../../lib/timezone";

export const dynamic = "force-dynamic";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      email,
      name,
      phone,
      travelDate,
      adults = 2,
      childrenCount = 0,
      childrenAges = [],
      transportation = "either",
      boatType = "any",
      timeWindow = "any",
      specificTourId,
    } = body;

    // 1. Validation
    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json(
        { ok: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (!travelDate || typeof travelDate !== "string" || !DATE_REGEX.test(travelDate.trim())) {
      return NextResponse.json(
        { ok: false, error: "Please select a valid travel date (YYYY-MM-DD)." },
        { status: 400 }
      );
    }

    const todayCt = getTodayNewOrleansDate();
    if (travelDate.trim() < todayCt) {
      return NextResponse.json(
        { ok: false, error: "Travel date cannot be in the past." },
        { status: 400 }
      );
    }

    const parsedAdults = Math.max(1, parseInt(String(adults), 10));
    const parsedChildrenCount = Math.max(0, parseInt(String(childrenCount), 10));

    let sanitizedChildrenAges: number[] = [];
    if (Array.isArray(childrenAges)) {
      sanitizedChildrenAges = childrenAges
        .map((a: unknown) => parseInt(String(a), 10))
        .filter((a: number) => !isNaN(a) && a >= 0 && a <= 17);
    }

    // 2. Persist in Neon DB
    const submission = await saveWaitlistSubmission({
      email: email.trim(),
      name: name ? String(name).trim() : undefined,
      phone: phone ? String(phone).trim() : undefined,
      travelDate: travelDate.trim(),
      adults: parsedAdults,
      childrenCount: parsedChildrenCount,
      childrenAges: sanitizedChildrenAges,
      transportation:
        transportation === "hotel_pickup" || transportation === "self_drive"
          ? transportation
          : "either",
      boatType:
        boatType === "small_airboat" || boatType === "large_airboat"
          ? boatType
          : "any",
      timeWindow:
        timeWindow === "morning" || timeWindow === "afternoon"
          ? timeWindow
          : "any",
      specificTourId: specificTourId ? String(specificTourId) : undefined,
    });

    const unsubscribeUrl = `https://welcometotheswamp.com/api/waitlist/unsubscribe?token=${submission.unsubscribeToken}`;

    return NextResponse.json({
      ok: true,
      submissionId: submission.id,
      unsubscribeToken: submission.unsubscribeToken,
      unsubscribeUrl,
      status: submission.status,
      message:
        "Your request is saved. Automated alerts are currently inactive.",
      details: {
        travelDate: submission.travelDate,
        partySize: submission.adults + submission.childrenCount,
        transportation: submission.transportation,
        boatType: submission.boatType,
        expiresAt: submission.expiresAt,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Failed to process enrollment.",
      },
      { status: 500 }
    );
  }
}
