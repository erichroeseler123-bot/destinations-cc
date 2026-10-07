import {
  CURATED_SWAMP_CATALOG,
  type CuratedSwampTour,
  type ProviderCheckResult,
  type SearchParams,
  type TourDeparture,
} from "./providerAdapter";
import {
  formatTimeNewOrleans,
  getCurrentNewOrleansTime,
  getTodayNewOrleansDate,
} from "./timezone";

export interface SearchResponse {
  state: "AVAILABLE" | "PARTIAL" | "NO_MATCH" | "UNCHECKED";
  summaryMessage: string;
  travelDate: string;
  winningDeparture?: TourDeparture;
  allDepartures: TourDeparture[];
  providerStatuses: Array<{
    provider: string;
    status: "checked" | "unreachable" | "disabled";
    error?: string;
  }>;
  totalGroupSize: number;
  checkedAt: string;
}

/**
 * Checks live Viator API if credentials are valid and active.
 */
async function checkViatorLive(params: SearchParams): Promise<ProviderCheckResult> {
  const apiKey = (process.env.VIATOR_API_KEY || "").trim();

  // If no key or key is a placeholder
  if (!apiKey || apiKey.length < 20 || apiKey.includes("[SENSITIVE]")) {
    return {
      providerName: "Viator",
      status: "unreachable",
      departures: [],
      error: "Viator API key not configured or unauthenticated.",
    };
  }

  try {
    const today = getTodayNewOrleansDate();
    const res = await fetch("https://api.viator.com/partner/availability/check", {
      method: "POST",
      headers: {
        "exp-api-key": apiKey,
        Accept: "application/json;version=2.0",
        "Accept-Language": "en-US",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productCode: "112604P2", // Airboat Adventures
        travelDate: params.travelDate,
        currency: "USD",
        paxMix: [
          { ageBand: "ADULT", numberOfTravelers: params.adults },
          ...(params.childrenAges.length > 0
            ? [{ ageBand: "CHILD", numberOfTravelers: params.childrenAges.length }]
            : []),
        ],
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      const errorText = await res.text();
      return {
        providerName: "Viator",
        status: "unreachable",
        departures: [],
        error: `HTTP ${res.status}: ${errorText.slice(0, 100)}`,
      };
    }

    const data = await res.json();
    const departures: TourDeparture[] = [];

    if (data.available && Array.isArray(data.bookableItems)) {
      for (const item of data.bookableItems) {
        if (!item.available || !item.startTime) continue;

        const timeStr = item.startTime;
        const total = item.price?.pricing?.totalPrice || item.totalPrice?.price?.recommendedRetailPrice || 190;
        
        departures.push({
          id: `viator-112604P2-${timeStr}`,
          provider: "viator",
          productCode: "112604P2",
          optionCode: item.productOptionCode || "DEFAULT",
          operatorName: "Airboat Adventures",
          title: "New Orleans Airboat Tour (Viator Partner Feed)",
          boatType: "large_airboat",
          transportation: "self_drive",
          departureTime: timeStr,
          departureTimeDisplay: formatTimeNewOrleans(timeStr),
          dockArrivalTimeDisplay: formatTimeNewOrleans(computeDockArrivalTime(timeStr, 30)),
          minChildAge: 2,
          maxPartySize: 20,
          pricePerAdult: Math.round(total / (params.adults + params.childrenAges.length)),
          pricePerChild: Math.round(total / (params.adults + params.childrenAges.length)),
          totalPrice: total,
          currency: "USD",
          availabilityType: "live_inventory",
          available: true,
          bookingUrl: "https://www.viator.com/tours/New-Orleans/New-Orleans-Airboat-Tour/d675-112604P2",
          checkedAt: new Date().toISOString(),
        });
      }
    }

    return {
      providerName: "Viator",
      status: "checked",
      departures,
    };
  } catch (err: any) {
    return {
      providerName: "Viator",
      status: "unreachable",
      departures: [],
      error: err?.message || "Network error checking Viator",
    };
  }
}

/**
 * Checks connected local Louisiana swamp tour operators.
 * Evaluates current day schedule cutoffs and age eligibility.
 */
async function checkDirectOperators(params: SearchParams): Promise<ProviderCheckResult> {
  const isToday = params.travelDate === getTodayNewOrleansDate();
  const currentCtTime = getCurrentNewOrleansTime(); // "HH:MM:SS"
  const departures: TourDeparture[] = [];

  const totalParty = params.adults + params.childrenAges.length;

  for (const tour of CURATED_SWAMP_CATALOG) {
    // 1. Boat type filter
    if (params.boatType && params.boatType !== "any" && tour.boatType !== params.boatType) {
      continue;
    }

    // 2. Transportation filter
    if (
      params.transportation !== "either" &&
      tour.transportation !== params.transportation
    ) {
      continue;
    }

    // 3. Party size capacity filter
    if (totalParty > tour.maxCapacity) {
      continue;
    }

    // 4. Child age restriction filter
    // e.g. Small airboats require all passengers to be at least 5 years old.
    const hasIneligibleChild = params.childrenAges.some((age) => age < tour.minChildAge);
    if (hasIneligibleChild) {
      continue;
    }

    // 5. Evaluate available timeslots
    for (const timeStr of tour.departureTimes) {
      // If searching today, check whether the booking cutoff or departure has already passed in New Orleans
      if (isToday) {
        const [depHours, depMins] = timeStr.split(":").map(Number);
        const depTotalMins = depHours * 60 + depMins;
        const [curHours, curMins] = currentCtTime.split(":").map(Number);
        const curTotalMins = curHours * 60 + curMins;

        // Cutoff in minutes before departure
        const effectiveCutoff = tour.bookingCutoffMinutes || 45;
        if (curTotalMins + effectiveCutoff >= depTotalMins) {
          // Booking deadline has passed for this slot today
          continue;
        }
      }

      // Time of day filter (morning vs afternoon)
      const depHour = parseInt(timeStr.split(":")[0], 10);
      if (params.preferredTimeWindow === "morning" && depHour >= 12) continue;
      if (params.preferredTimeWindow === "afternoon" && depHour < 12) continue;

      const groupTotal =
        params.adults * tour.pricePerAdult +
        params.childrenAges.length * tour.pricePerChild;

      const dockArrival = computeDockArrivalTime(timeStr, 30);
      const pickupWindow =
        tour.transportation === "hotel_pickup"
          ? computePickupWindow(timeStr, tour.pickupLeadMinutes)
          : undefined;

      departures.push({
        id: `${tour.productCode}-${timeStr}`,
        provider: "direct_operator",
        productCode: tour.productCode,
        optionCode: tour.optionCode,
        operatorName: tour.operatorName,
        title: tour.title,
        boatType: tour.boatType,
        transportation: tour.transportation,
        departureTime: timeStr,
        departureTimeDisplay: formatTimeNewOrleans(timeStr),
        dockArrivalTimeDisplay: formatTimeNewOrleans(dockArrival),
        pickupWindowDisplay: pickupWindow,
        minChildAge: tour.minChildAge,
        maxPartySize: tour.maxCapacity,
        pricePerAdult: tour.pricePerAdult,
        pricePerChild: tour.pricePerChild,
        totalPrice: groupTotal,
        currency: "USD",
        availabilityType: "scheduled_departure",
        available: true,
        bookingUrl: tour.bookingUrl,
        checkedAt: new Date().toISOString(),
      });
    }
  }

  return {
    providerName: "Direct Swamp Operators",
    status: "checked",
    departures,
  };
}

function computeDockArrivalTime(departureTime: string, leadMinutes: number): string {
  const [h, m] = departureTime.split(":").map(Number);
  const total = h * 60 + m - leadMinutes;
  const newH = Math.floor(total / 60);
  const newM = total % 60;
  return `${newH.toString().padStart(2, "0")}:${newM.toString().padStart(2, "0")}`;
}

function computePickupWindow(departureTime: string, leadMinutes: number): string {
  const [h, m] = departureTime.split(":").map(Number);
  const total = h * 60 + m - leadMinutes;
  const targetH = Math.floor(total / 60);
  const targetM = total % 60;
  const targetStr = `${targetH.toString().padStart(2, "0")}:${targetM.toString().padStart(2, "0")}`;

  return `${formatTimeNewOrleans(targetStr)} (1 hr 15 min prior to tour)`;
}

/**
 * Main Search Execution: Evaluates all connected providers and generates
 * the honest 4-state response: AVAILABLE, PARTIAL, NO_MATCH, or UNCHECKED.
 */
export async function searchNextAirboatDepartures(
  params: SearchParams
): Promise<SearchResponse> {
  const checkedAt = new Date().toISOString();
  const totalGroupSize = params.adults + params.childrenAges.length;

  // Run provider checks in parallel
  const [viatorResult, directResult] = await Promise.all([
    checkViatorLive(params),
    checkDirectOperators(params),
  ]);

  const providerStatuses = [
    {
      provider: viatorResult.providerName,
      status: viatorResult.status,
      error: viatorResult.error,
    },
    {
      provider: directResult.providerName,
      status: directResult.status,
      error: directResult.error,
    },
  ];

  const hasUnreachable = providerStatuses.some((p) => p.status === "unreachable");
  const allUnreachable = providerStatuses.every((p) => p.status === "unreachable");

  const combinedDepartures: TourDeparture[] = [
    ...viatorResult.departures,
    ...directResult.departures,
  ];

  // Sort chronologically by departure time ASC
  combinedDepartures.sort((a, b) => a.departureTime.localeCompare(b.departureTime));

  const winningDeparture = combinedDepartures.length > 0 ? combinedDepartures[0] : undefined;

  // Case 1: All providers failed to check
  if (allUnreachable) {
    return {
      state: "UNCHECKED",
      summaryMessage: "We couldn't check availability right now.",
      travelDate: params.travelDate,
      allDepartures: [],
      providerStatuses,
      totalGroupSize,
      checkedAt,
    };
  }

  // Case 2: At least one departure found
  if (winningDeparture) {
    const isLive = winningDeparture.availabilityType === "live_inventory";
    const baseSummary = isLive
      ? "Earliest departure with live availability checked."
      : "Next scheduled departure among the tours checked; confirm seats with the operator.";

    if (hasUnreachable) {
      return {
        state: "PARTIAL",
        summaryMessage: `${baseSummary} (Some providers couldn't be checked).`,
        travelDate: params.travelDate,
        winningDeparture,
        allDepartures: combinedDepartures,
        providerStatuses,
        totalGroupSize,
        checkedAt,
      };
    }

    return {
      state: "AVAILABLE",
      summaryMessage: baseSummary,
      travelDate: params.travelDate,
      winningDeparture,
      allDepartures: combinedDepartures,
      providerStatuses,
      totalGroupSize,
      checkedAt,
    };
  }

  // Case 3: Checked, but no matching departures
  return {
    state: "NO_MATCH",
    summaryMessage: "No matching departures found.",
    travelDate: params.travelDate,
    allDepartures: [],
    providerStatuses,
    totalGroupSize,
    checkedAt,
  };
}
