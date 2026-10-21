import type { WaitlistSubmission } from "./db";
import type { TourDeparture } from "./providerAdapter";

export interface AlertMatchResult {
  matches: boolean;
  reason?: string;
}

/**
 * Evaluates whether an open departure satisfies a traveler's saved waitlist request.
 */
export function evaluateDepartureMatch(
  submission: WaitlistSubmission,
  departure: TourDeparture
): AlertMatchResult {
  const totalParty = submission.adults + submission.childrenCount;

  // 1. Availability check
  if (!departure.available) {
    return { matches: false, reason: "Departure is not available." };
  }

  // 2. Capacity check
  if (totalParty > departure.maxPartySize) {
    return {
      matches: false,
      reason: `Party size ${totalParty} exceeds maximum boat capacity of ${departure.maxPartySize}.`,
    };
  }

  // 3. Child age check
  if (Array.isArray(submission.childrenAges) && submission.childrenAges.length > 0) {
    const hasIneligibleChild = submission.childrenAges.some(
      (age) => age < departure.minChildAge
    );
    if (hasIneligibleChild) {
      return {
        matches: false,
        reason: `One or more children under minimum required age of ${departure.minChildAge}.`,
      };
    }
  }

  // 4. Transportation check
  if (
    submission.transportation !== "either" &&
    submission.transportation !== departure.transportation
  ) {
    return {
      matches: false,
      reason: `Requested transportation (${submission.transportation}) does not match departure (${departure.transportation}).`,
    };
  }

  // 5. Boat type check
  if (
    submission.boatType !== "any" &&
    submission.boatType !== departure.boatType
  ) {
    return {
      matches: false,
      reason: `Requested boat type (${submission.boatType}) does not match departure (${departure.boatType}).`,
    };
  }

  // 6. Time of day window check
  if (submission.timeWindow && submission.timeWindow !== "any") {
    const [h] = departure.departureTime.split(":").map(Number);
    if (submission.timeWindow === "morning" && h >= 12) {
      return { matches: false, reason: "Requested morning departure only." };
    }
    if (submission.timeWindow === "afternoon" && h < 12) {
      return { matches: false, reason: "Requested afternoon departure only." };
    }
  }

  return { matches: true };
}

/**
 * Finds all matching departures for a given waitlist submission from a candidate list.
 */
export function findMatchingDepartures(
  submission: WaitlistSubmission,
  departures: TourDeparture[]
): TourDeparture[] {
  return departures.filter((dep) => evaluateDepartureMatch(submission, dep).matches);
}
