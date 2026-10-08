import { NextResponse } from "next/server";
import { formatTimeNewOrleans, getCurrentNewOrleansTime, getTodayNewOrleansDate } from "../../../../lib/timezone";
import { parseViatorAvailability } from "../../../../lib/searchEngine";

export const dynamic = "force-dynamic";

export interface AvailabilityConfirmRequest {
  provider?: "viator" | "direct_operator" | "getyourguide";
  productCode: string;
  optionCode?: string;
  travelDate: string; // YYYY-MM-DD
  departureTime: string; // HH:MM
  adults: number;
  childrenAges?: number[];
  currency?: string;
}

/**
 * Interactive Live Seat Confirmation:
 * Directly contacts upstream provider API or local schedule validator to confirm
 * group capacity, real-time pricing, and exact departure timeslot.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AvailabilityConfirmRequest;
    const {
      provider = "direct_operator",
      productCode,
      travelDate,
      departureTime,
      adults = 2,
      childrenAges = [],
      currency = "USD",
    } = body;

    const totalParty = Math.max(1, adults + (childrenAges?.length || 0));
    const nowIso = new Date().toISOString();
    const timeNowCt = formatTimeNewOrleans(nowIso);

    // 1. VIATOR LIVE HANDSHAKE
    if (provider === "viator" || productCode.includes("P") || productCode.includes("AIRBOAT")) {
      const apiKey = (process.env.VIATOR_API_KEY || "").trim();

      if (!apiKey || apiKey.length < 20 || apiKey.includes("[SENSITIVE]")) {
        return NextResponse.json({
          ok: true,
          confirmed: false,
          liveHandshakeAvailable: false,
          availabilityType: "scheduled_departure",
          statusText: "Scheduled departure—confirm seats",
          message:
            "Live provider credentials unauthenticated. Departure is scheduled; please verify live seat availability directly through provider checkout.",
        });
      }

      try {
        const viatorRes = await fetch("https://api.viator.com/partner/availability/check", {
          method: "POST",
          headers: {
            "exp-api-key": apiKey,
            Accept: "application/json;version=2.0",
            "Accept-Language": "en-US",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productCode,
            travelDate,
            currency,
            paxMix: [
              { ageBand: "ADULT", numberOfTravelers: adults },
              ...(childrenAges.length > 0
                ? [{ ageBand: "CHILD", numberOfTravelers: childrenAges.length }]
                : []),
            ],
          }),
          cache: "no-store",
        });

        if (!viatorRes.ok) {
          return NextResponse.json({
            ok: true,
            confirmed: false,
            liveHandshakeAvailable: false,
            availabilityType: "scheduled_departure",
            statusText: "Scheduled departure—confirm seats",
            message: `Provider returned HTTP ${viatorRes.status}. Confirm seats directly at checkout.`,
          });
        }

        const data = await viatorRes.json();
        const departures = parseViatorAvailability(data, {
          travelDate,
          adults,
          childrenAges,
          transportation: "either",
          boatType: "any",
        }, nowIso);

        const matchingDeparture = departures.find(
          (d) => d.departureTime === departureTime || d.departureTimeDisplay.startsWith(departureTime)
        );

        if (matchingDeparture && matchingDeparture.available) {
          return NextResponse.json({
            ok: true,
            confirmed: true,
            liveHandshakeAvailable: true,
            availabilityType: "live_inventory",
            statusText: `Live availability checked ${timeNowCt} CT for group of ${totalParty}`,
            totalPrice: matchingDeparture.totalPrice,
            pricePerAdult: matchingDeparture.pricePerAdult,
            bookingUrl: matchingDeparture.bookingUrl,
            checkedAt: nowIso,
          });
        } else {
          return NextResponse.json({
            ok: true,
            confirmed: false,
            liveHandshakeAvailable: true,
            availabilityType: "sold_out",
            statusText: "No seats open for group size",
            message: "This departure time does not currently have enough open seats for your group.",
          });
        }
      } catch (err: any) {
        return NextResponse.json({
          ok: true,
          confirmed: false,
          liveHandshakeAvailable: false,
          availabilityType: "scheduled_departure",
          statusText: "Scheduled departure—confirm seats",
          message: err?.message || "Live handshake error; check availability at checkout.",
        });
      }
    }

    // 2. DIRECT OPERATOR SCHEDULE CONFIRMATION
    const today = getTodayNewOrleansDate();
    const currentCt = getCurrentNewOrleansTime();

    if (travelDate === today && departureTime <= currentCt) {
      return NextResponse.json({
        ok: true,
        confirmed: false,
        liveHandshakeAvailable: false,
        availabilityType: "departed",
        statusText: "Departure has already left dock",
        message: "This tour has already departed today.",
      });
    }

    return NextResponse.json({
      ok: true,
      confirmed: true,
      liveHandshakeAvailable: false,
      availabilityType: "scheduled_departure",
      statusText: "Scheduled departure—confirm seats",
      message: "Departure is active on local operator schedule. Complete checkout to lock seats.",
      checkedAt: nowIso,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Confirmation failed" },
      { status: 500 }
    );
  }
}
