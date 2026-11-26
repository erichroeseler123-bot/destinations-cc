import { getVegasShowSlug, getVegasTourSlug } from "./content";
import type { VegasTour } from "./fareharbor";
import {
  buildTicketOutHref,
  buildTourOutHref,
  PARTNER_DISCLOSURE_TEXT,
} from "./outbound";
import type { VegasMarketplaceShow } from "./seatgeek";
import type { VegasShow } from "./ticketmaster";

export type HotelAreaKey =
  | "central-strip"
  | "south-strip"
  | "north-strip"
  | "downtown-fremont"
  | "off-strip";

export type GroupSizeKey = "1" | "2" | "3-4" | "5-8" | "9+";

export type TimeAvailableKey = "2-4h" | "evening" | "half-day" | "full-day";

export type BudgetTierKey =
  | "free"
  | "under-50"
  | "under-100"
  | "100-200"
  | "200-plus";

export type PlanInterestKey = "best-fit" | "shows" | "outdoors" | "classic-vegas";

export type PlanPickerInput = {
  startDate: string;
  endDate: string;
  area: HotelAreaKey;
  groupSize: GroupSizeKey;
  partyQuantity: number;
  timeAvailable: TimeAvailableKey;
  budget: BudgetTierKey;
  interest: PlanInterestKey;
  handoffId: string | null;
  hasExplicitParams: boolean;
};

export type PlanOptionItem<K extends string> = {
  value: K;
  label: string;
  shortLabel: string;
  helper: string;
};

export const HOTEL_AREA_OPTIONS: readonly PlanOptionItem<HotelAreaKey>[] = [
  {
    value: "central-strip",
    label: "Central Strip (Bellagio, Caesars, LINQ, Paris, Venetian, TI)",
    shortLabel: "Central Strip",
    helper: "Walkable core cluster—best when you keep evening plans tight.",
  },
  {
    value: "south-strip",
    label: "South Strip (MGM Grand, Park MGM, NY-NY, Luxor, Mandalay Bay)",
    shortLabel: "South Strip",
    helper: "Strong arena/theater cluster connected by trams and walkways.",
  },
  {
    value: "north-strip",
    label: "North Strip (Wynn/Encore, Resorts World, SAHARA, Fontainebleau, STRAT)",
    shortLabel: "North Strip",
    helper: "Spaced-out resort properties—group trips by stop to avoid long walks.",
  },
  {
    value: "downtown-fremont",
    label: "Downtown / Fremont Street",
    shortLabel: "Downtown / Fremont",
    helper: "Compact neon-canopy zone; treat Strip visits as one deliberate ride.",
  },
  {
    value: "off-strip",
    label: "Off-Strip / Rio / Rental Car Base",
    shortLabel: "Off-Strip / Rio",
    helper: "Bigger room value and easier parking—batch Strip stops into one block.",
  },
];

export const GROUP_SIZE_OPTIONS: readonly PlanOptionItem<GroupSizeKey>[] = [
  { value: "1", label: "Solo (1 traveler)", shortLabel: "Solo", helper: "Easy single-seat and counter flexibility." },
  { value: "2", label: "2 travelers", shortLabel: "2 travelers", helper: "Fits one rideshare and standard pair seating." },
  { value: "3-4", label: "3–4 travelers", shortLabel: "3–4 travelers", helper: "Still fits one standard rideshare if you stay in one zone." },
  { value: "5-8", label: "5–8 travelers", shortLabel: "5–8 travelers", helper: "Requires XL or two rideshares—staying in one cluster saves real money." },
  { value: "9+", label: "9+ group", shortLabel: "9+ group", helper: "Pick one anchor time and one walkable zone so the group stays together." },
];

export const TIME_AVAILABLE_OPTIONS: readonly PlanOptionItem<TimeAvailableKey>[] = [
  {
    value: "2-4h",
    label: "2–4 hours (short window or before a late flight)",
    shortLabel: "2–4 hours",
    helper: "Stay in one zone; skip cross-valley transfers and long day trips.",
  },
  {
    value: "evening",
    label: "One night / evening out (4–5 hours)",
    shortLabel: "Evening out",
    helper: "Dinner or a free reset plus one show or walkable Strip block.",
  },
  {
    value: "half-day",
    label: "Half day (4–6 hours)",
    shortLabel: "Half day",
    helper: "Fits Hoover Dam, Red Rock, or a relaxed Strip + show combination.",
  },
  {
    value: "full-day",
    label: "Full day or trip anchor (6+ hours)",
    shortLabel: "Full day",
    helper: "Room for one marquee outing (Grand Canyon) or a two-part Strip day.",
  },
];

export const BUDGET_TIER_OPTIONS: readonly PlanOptionItem<BudgetTierKey>[] = [
  { value: "free", label: "$0 — Free-only plan", shortLabel: "$0 (Free only)", helper: "Zero ticket spend; focus on walkable Vegas classics." },
  { value: "under-50", label: "Under $50 per person", shortLabel: "Under $50/person", helper: "Low-cost comedy, daytime attractions, and free anchors." },
  { value: "under-100", label: "Under $100 per person", shortLabel: "Under $100/person", helper: "One value show or nearby experience plus free stops—leave room for fees." },
  { value: "100-200", label: "$100–$200 per person", shortLabel: "$100–$200/person", helper: "Opens strong Strip shows, Hoover Dam, and Red Rock tours." },
  { value: "200-plus", label: "$200+ per person (splurge once)", shortLabel: "$200+/person", helper: "Fits Sphere, headliner residencies, or Grand Canyon outings." },
];

export const PLAN_INTEREST_OPTIONS: readonly PlanOptionItem<PlanInterestKey>[] = [
  { value: "best-fit", label: "Best overall fit", shortLabel: "Best fit", helper: "Matches your time window and budget first." },
  { value: "shows", label: "Live show, comedy, or concert", shortLabel: "Shows & nights", helper: "Prioritizes verified Vegas stage and arena listings." },
  { value: "outdoors", label: "Canyon, Hoover Dam, or desert escape", shortLabel: "Outdoors & tours", helper: "Prioritizes off-Strip scenery that fits your clock." },
  { value: "classic-vegas", label: "Classic Strip & neon landmarks", shortLabel: "Classic Vegas", helper: "Iconic fountains, neon, and signature Vegas rooms." },
];

export type PaidSuggestion = {
  id: string;
  kind: "tour" | "show";
  providerLabel: "FareHarbor operator" | "Ticketmaster" | "SeatGeek";
  title: string;
  subtitle: string;
  scheduleNote: string;
  priceNote: string;
  verifiedPrice: number | null;
  whyItFits: string;
  geographyNote: string;
  bookingHref: string;
  bookingLabel: string;
  detailHref: string;
  detailLabel: string;
  disclosure: string;
};

export type PaidFallbackPlan = {
  reason: "free-budget" | "feeds-empty" | "no-matching-listing";
  headline: string;
  explanation: string;
  recommendedLaneTitle: string;
  recommendedLaneCopy: string;
  nextSteps: Array<{
    href: string;
    label: string;
    note: string;
  }>;
};

export type FreeOrLowCostAlternative = {
  primaryTitle: string;
  primaryCostBadge: string;
  primaryAreaLabel: string;
  primarySummary: string;
  lowCostBackupTitle: string;
  lowCostBackupSummary: string;
  links: Array<{
    href: string;
    label: string;
  }>;
};

export type GuideLinkItem = {
  href: string;
  title: string;
  reason: string;
};

export type BuiltVegasPlan = {
  input: PlanPickerInput;
  headline: string;
  verdict: string;
  setupSummaryChips: string[];
  paidSuggestion: PaidSuggestion | null;
  paidFallback: PaidFallbackPlan | null;
  freeAlternative: FreeOrLowCostAlternative;
  guardrails: string[];
  guides: GuideLinkItem[];
  feedSummary: {
    toursCount: number;
    showsCount: number;
    marketplaceCount: number;
    anyLiveInventory: boolean;
  };
  disclosure: string;
};

export type PlanPickerFeeds = {
  tours: VegasTour[];
  toursConfigured?: boolean;
  ticketmasterShows: VegasShow[];
  seatGeekEvents: VegasMarketplaceShow[];
};

const BUDGET_CEILING: Record<BudgetTierKey, number | null> = {
  free: 0,
  "under-50": 50,
  "under-100": 100,
  "100-200": 200,
  "200-plus": null,
};

function isIsoDate(value: string | undefined | null): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value.trim()));
}

function addDaysIso(isoDate: string, days: number): string {
  const base = new Date(`${isoDate}T12:00:00Z`);
  if (Number.isNaN(base.getTime())) return isoDate;
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

function pickFirst(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return (value[0] || "").trim();
  return (value || "").trim();
}

function normalizeGroupSize(raw: string): { groupSize: GroupSizeKey; partyQuantity: number } {
  if (raw === "1") return { groupSize: "1", partyQuantity: 1 };
  if (raw === "2") return { groupSize: "2", partyQuantity: 2 };
  if (raw === "3-4") return { groupSize: "3-4", partyQuantity: 4 };
  if (raw === "5-8") return { groupSize: "5-8", partyQuantity: 6 };
  if (raw === "9+") return { groupSize: "9+", partyQuantity: 10 };

  const numeric = Number.parseInt(raw, 10);
  if (Number.isFinite(numeric) && numeric > 0) {
    if (numeric === 1) return { groupSize: "1", partyQuantity: 1 };
    if (numeric === 2) return { groupSize: "2", partyQuantity: 2 };
    if (numeric <= 4) return { groupSize: "3-4", partyQuantity: numeric };
    if (numeric <= 8) return { groupSize: "5-8", partyQuantity: numeric };
    return { groupSize: "9+", partyQuantity: numeric };
  }

  return { groupSize: "2", partyQuantity: 2 };
}

export function normalizePlanInput(
  rawParams: Record<string, string | string[] | undefined> = {},
  now = new Date(),
): PlanPickerInput {
  const defaultStart = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10);
  const rawStart = pickFirst(rawParams.startDate) || pickFirst(rawParams.date);
  const startDate = isIsoDate(rawStart) ? rawStart : defaultStart;

  const rawEnd = pickFirst(rawParams.endDate);
  const candidateEnd = isIsoDate(rawEnd) ? rawEnd : addDaysIso(startDate, 2);
  const endDate = candidateEnd >= startDate ? candidateEnd : startDate;

  const rawArea = pickFirst(rawParams.area) as HotelAreaKey;
  const area: HotelAreaKey = HOTEL_AREA_OPTIONS.some((opt) => opt.value === rawArea)
    ? rawArea
    : "central-strip";

  const { groupSize, partyQuantity } = normalizeGroupSize(
    pickFirst(rawParams.groupSize) || pickFirst(rawParams.party_size),
  );

  const rawTime = pickFirst(rawParams.time) as TimeAvailableKey;
  const timeAvailable: TimeAvailableKey = TIME_AVAILABLE_OPTIONS.some((opt) => opt.value === rawTime)
    ? rawTime
    : "evening";

  const rawBudget = pickFirst(rawParams.budget) as BudgetTierKey;
  const budget: BudgetTierKey = BUDGET_TIER_OPTIONS.some((opt) => opt.value === rawBudget)
    ? rawBudget
    : "under-100";

  const rawInterest = pickFirst(rawParams.interest) as PlanInterestKey;
  const interest: PlanInterestKey = PLAN_INTEREST_OPTIONS.some((opt) => opt.value === rawInterest)
    ? rawInterest
    : "best-fit";

  const handoffId =
    pickFirst(rawParams.dcc_handoff_id) || pickFirst(rawParams.handoffId) || null;

  const hasExplicitParams = Boolean(
    rawStart || rawEnd || rawParams.area || rawParams.groupSize || rawParams.time || rawParams.budget || rawParams.interest,
  );

  return {
    startDate,
    endDate,
    area,
    groupSize,
    partyQuantity,
    timeAvailable,
    budget,
    interest,
    handoffId,
    hasExplicitParams,
  };
}

export function parseTourPriceDollars(fromPrice: string | null | undefined): number | null {
  const text = String(fromPrice || "").trim();
  if (!text) return null;
  const match = text.match(/^[A-Z]{3}\s+(\d+(?:\.\d+)?)$/);
  if (!match) return null;
  const num = Number.parseFloat(match[1]);
  return Number.isFinite(num) && num > 0 ? num : null;
}

function inferVenueArea(venueName: string | null | undefined): HotelAreaKey | null {
  const text = String(venueName || "").toLowerCase();
  if (!text) return null;

  if (
    /bellagio|caesars|colosseum|flamingo|linq|harrah|paris|planet hollywood|bakkt|ph live|cosmopolitan|chelsea|venetian|palazzo|sphere|treasure island|mirage|cromwell/.test(
      text,
    )
  ) {
    return "central-strip";
  }
  if (
    /mgm grand|park mgm|dolby live|new york-new york|t-mobile arena|excalibur|luxor|mandalay bay|house of blues|michelob ultra|allegiant|trop/.test(
      text,
    )
  ) {
    return "south-strip";
  }
  if (
    /wynn|encore|resorts world|sahara|fontainebleau|strat|circus circus|westgate|las vegas festival grounds/.test(
      text,
    )
  ) {
    return "north-strip";
  }
  if (/fremont|golden nugget|plaza|downtown|smith center|container park|circa/.test(text)) {
    return "downtown-fremont";
  }
  if (/rio|palms|pearl|orleans|thomas & mack|area15|red rock casino|south point|silverton/.test(text)) {
    return "off-strip";
  }
  return null;
}

function areaShortLabel(area: HotelAreaKey): string {
  return HOTEL_AREA_OPTIONS.find((item) => item.value === area)?.shortLabel || "Las Vegas";
}

function buildVenueGeographyNote(userArea: HotelAreaKey, venueArea: HotelAreaKey | null, venueName: string | null): string {
  const venueLabel = venueName || "the venue";
  if (venueArea && venueArea === userArea) {
    return `${venueLabel} sits in your ${areaShortLabel(userArea)} cluster, keeping rideshare spend and transfer time low.`;
  }
  if (venueArea) {
    return `${venueLabel} is in ${areaShortLabel(venueArea)}—plan one direct ride from ${areaShortLabel(userArea)} instead of crisscrossing the Strip twice.`;
  }
  return `Confirm ${venueLabel} arrival and pickup logistics from ${areaShortLabel(userArea)} before showtime.`;
}

function isDateWithinWindow(localDate: string | null, startDate: string, endDate: string): boolean {
  if (!localDate || !isIsoDate(localDate)) return false;
  return localDate >= startDate && localDate <= endDate;
}

function selectPaidSuggestion(
  input: PlanPickerInput,
  feeds: PlanPickerFeeds,
): PaidSuggestion | null {
  const ceiling = BUDGET_CEILING[input.budget];
  if (ceiling === 0) {
    return null;
  }

  const attribution = {
    sourcePath: "/plan",
    sourceSlug: "saveonthestrip-plan-picker",
    sourcePage: "/plan",
    topicSlug: "vegas-plan-picker",
    handoffId: input.handoffId,
    eventDate: input.startDate,
    partySize: input.partyQuantity,
  };

  type ScoredCandidate = {
    score: number;
    suggestion: PaidSuggestion;
  };

  const candidates: ScoredCandidate[] = [];

  // 1. Score Ticketmaster shows (strictly date-matched to [startDate, endDate] and allowlisted URL).
  for (const show of feeds.ticketmasterShows) {
    if (!isDateWithinWindow(show.localDate, input.startDate, input.endDate)) continue;
    const bookingHref = buildTicketOutHref({
      target: show.url,
      affiliateTarget: "ticketmaster",
      eventId: show.id,
      eventName: show.name,
      eventDate: show.localDate,
      attribution,
    });
    if (!bookingHref) continue;

    const minPrice = typeof show.minPrice === "number" && show.minPrice > 0 ? show.minPrice : null;
    if (ceiling !== null) {
      if (minPrice !== null && minPrice > ceiling) continue;
      if (minPrice === null && input.budget === "under-50") continue;
    }

    let score = 40;
    if (minPrice !== null) {
      score += 22;
      if (ceiling === null && minPrice >= 120) score += 8;
    } else if (ceiling !== null) {
      // Unpriced shows rank below verified in-budget listings.
      score -= 12;
    }

    if (input.timeAvailable === "evening") score += 26;
    if (input.timeAvailable === "2-4h") score += 14;
    if (input.timeAvailable === "half-day") score += 8;
    if (input.timeAvailable === "full-day") score += 6;

    if (input.interest === "shows") score += 30;
    if (input.interest === "classic-vegas") score += 14;
    if (input.interest === "outdoors") score -= 18;

    const venueArea = inferVenueArea(show.venueName);
    if (venueArea === input.area) score += 18;

    const haystack = [show.name, show.venueName, show.genre, show.subGenre, show.summary]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (input.budget === "200-plus" && /sphere|wizard of oz|cirque|residency/.test(haystack)) {
      score += 18;
    }
    if ((input.budget === "under-50" || input.budget === "under-100") && /comedy|magic|variety/.test(haystack)) {
      score += 15;
    }

    const currency = show.currency || "USD";
    const priceNote =
      minPrice !== null
        ? `Provider-listed from ${currency} ${minPrice}${show.maxPrice ? `–${show.maxPrice}` : ""} per ticket (before taxes & service fees)`
        : "Ticket price not listed in feed — confirm current seat pricing and fees on Ticketmaster";

    candidates.push({
      score,
      suggestion: {
        id: `tm:${show.id}`,
        kind: "show",
        providerLabel: "Ticketmaster",
        title: show.name,
        subtitle: [show.venueName || "Las Vegas", show.genre || show.segment].filter(Boolean).join(" • "),
        scheduleNote: `${show.localDate}${show.localTime ? ` at ${show.localTime.slice(0, 5)}` : ""}`,
        priceNote,
        verifiedPrice: minPrice,
        whyItFits:
          minPrice !== null
            ? `Matches your ${input.startDate === input.endDate ? input.startDate : `${input.startDate} to ${input.endDate}`} window with a provider-listed starting price inside your per-person target.`
            : `Scheduled during your ${input.startDate === input.endDate ? input.startDate : `${input.startDate} to ${input.endDate}`} trip window; verify current seat tiers before buying.`,
        geographyNote: buildVenueGeographyNote(input.area, venueArea, show.venueName),
        bookingHref,
        bookingLabel: "Check tickets on Ticketmaster",
        detailHref: `/shows/${getVegasShowSlug(show)}`,
        detailLabel: "Read show breakdown",
        disclosure: PARTNER_DISCLOSURE_TEXT,
      },
    });
  }

  // 2. Score SeatGeek marketplace shows (strictly date-matched and allowlisted URL).
  for (const event of feeds.seatGeekEvents) {
    if (!isDateWithinWindow(event.localDate, input.startDate, input.endDate)) continue;
    const bookingHref = buildTicketOutHref({
      target: event.url,
      affiliateTarget: "seatgeek",
      eventId: event.id,
      eventName: event.title,
      eventDate: event.localDate,
      attribution,
    });
    if (!bookingHref) continue;

    const lowest =
      typeof event.lowestPrice === "number" && event.lowestPrice > 0 ? event.lowestPrice : null;
    if (ceiling !== null) {
      if (lowest !== null && lowest > ceiling) continue;
      if (lowest === null && input.budget === "under-50") continue;
    }

    let score = 36;
    if (lowest !== null) {
      score += 22;
    } else if (ceiling !== null) {
      score -= 12;
    }

    if (input.timeAvailable === "evening") score += 24;
    if (input.timeAvailable === "2-4h") score += 14;
    if (input.interest === "shows") score += 28;
    if (input.interest === "outdoors") score -= 18;

    const venueArea = inferVenueArea(event.venueName);
    if (venueArea === input.area) score += 18;

    const haystack = [event.title, event.venueName, event.genre].filter(Boolean).join(" ").toLowerCase();
    if ((input.budget === "under-50" || input.budget === "under-100") && /comedy|magic|strat/.test(haystack)) {
      score += 15;
    }

    const priceNote =
      lowest !== null
        ? `Marketplace listings from USD ${lowest}${event.highestPrice ? `–${event.highestPrice}` : ""} (before fees)`
        : "Price not listed in feed — confirm live marketplace seat pricing and fees on SeatGeek";

    candidates.push({
      score,
      suggestion: {
        id: event.id,
        kind: "show",
        providerLabel: "SeatGeek",
        title: event.title,
        subtitle: [event.venueName || "Las Vegas", event.genre].filter(Boolean).join(" • "),
        scheduleNote: `${event.localDate}${event.localTime ? ` at ${event.localTime.slice(0, 5)}` : ""}`,
        priceNote,
        verifiedPrice: lowest,
        whyItFits:
          lowest !== null
            ? `Real marketplace event during your selected dates with a listed starting price within your budget filter.`
            : `Real marketplace event on your selected dates; check SeatGeek for current seat tiers.`,
        geographyNote: buildVenueGeographyNote(input.area, venueArea, event.venueName),
        bookingHref,
        bookingLabel: "Compare seats on SeatGeek",
        detailHref: `/shows?q=${encodeURIComponent(event.shortTitle || event.title)}`,
        detailLabel: "Compare on Shows page",
        disclosure: PARTNER_DISCLOSURE_TEXT,
      },
    });
  }

  // 3. Score FareHarbor tours (filtered by time commitment & budget).
  for (const tour of feeds.tours) {
    // Protect short windows / late-flight blocks from long canyon/dam day trips.
    if (input.timeAvailable === "2-4h") {
      if (tour.area === "grand-canyon" || tour.area === "day-trips" || tour.area === "hoover-dam") {
        continue;
      }
      if (tour.durationMinutes !== null && tour.durationMinutes > 240) {
        continue;
      }
    }
    if (input.timeAvailable === "evening") {
      if (tour.area === "grand-canyon" || tour.area === "day-trips" || tour.area === "hoover-dam") {
        continue;
      }
      if (tour.durationMinutes !== null && tour.durationMinutes > 240) {
        continue;
      }
    }
    if (input.timeAvailable === "half-day") {
      if (tour.area === "grand-canyon" && (tour.durationMinutes === null || tour.durationMinutes > 360)) {
        continue;
      }
      if (tour.durationMinutes !== null && tour.durationMinutes > 390) {
        continue;
      }
    }

    const slug = getVegasTourSlug(tour);
    const bookingHref = buildTourOutHref({
      target: tour.productUrl,
      productSlug: slug,
      company: tour.company,
      itemPk: tour.itemPk,
      area: tour.area,
      attribution,
    });
    if (!bookingHref) continue;

    const priceDollars = parseTourPriceDollars(tour.fromPrice);
    if (ceiling !== null) {
      if (priceDollars !== null && priceDollars > ceiling) continue;
      if (priceDollars === null && input.budget === "under-50") continue;
    }

    let score = 38;
    if (priceDollars !== null) {
      score += 20;
    } else if (ceiling !== null) {
      score -= 10;
    }

    if (input.interest === "outdoors") {
      score += tour.area === "las-vegas" ? 12 : 34;
    } else if (input.interest === "shows") {
      score -= 14;
    } else if (input.interest === "classic-vegas" && tour.area === "las-vegas") {
      score += 14;
    }

    if (input.timeAvailable === "full-day") {
      if (tour.area === "grand-canyon") score += 28;
      else if (tour.area === "hoover-dam" || tour.area === "red-rock" || tour.area === "day-trips") score += 20;
    } else if (input.timeAvailable === "half-day") {
      if (tour.area === "hoover-dam" || tour.area === "red-rock") score += 28;
      else if (tour.area === "las-vegas") score += 16;
    } else if (input.timeAvailable === "2-4h" && tour.area === "las-vegas") {
      score += 18;
    }

    const priceNote = tour.fromPrice
      ? `Operator-listed from ${tour.fromPrice} per person (before taxes & operator fees)`
      : "Rate varies by date and option — confirm live pricing on the operator page";

    candidates.push({
      score,
      suggestion: {
        id: `fh:${tour.id}`,
        kind: "tour",
        providerLabel: "FareHarbor operator",
        title: tour.name,
        subtitle: [tour.areaLabel, tour.durationLabel || "Duration varies", tour.company]
          .filter(Boolean)
          .join(" • "),
        scheduleNote: `Check open departures for ${input.startDate} (${input.partyQuantity} ${input.partyQuantity === 1 ? "guest" : "guests"}) on operator calendar`,
        priceNote,
        verifiedPrice: priceDollars,
        whyItFits:
          tour.area === "grand-canyon"
            ? "Fits a full-day commitment when you want one unforgettable outing outside casino corridors."
            : tour.area === "hoover-dam" || tour.area === "red-rock"
              ? "Gives your group real desert or landmark contrast without losing the evening."
              : "Keeps the commitment inside Las Vegas so you do not burn your schedule in transit.",
        geographyNote:
          tour.area === "las-vegas"
            ? `Check the exact Strip meeting point relative to ${areaShortLabel(input.area)} before booking.`
            : `Most ${tour.areaLabel} operators use designated Strip/Downtown pickup points—confirm the closest pickup to ${areaShortLabel(input.area)}.`,
        bookingHref,
        bookingLabel: "Check live calendar on operator page",
        detailHref: `/tours/${slug}`,
        detailLabel: "Read tour breakdown",
        disclosure: PARTNER_DISCLOSURE_TEXT,
      },
    });
  }

  if (!candidates.length) {
    return null;
  }

  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const leftPrice = a.suggestion.verifiedPrice ?? Number.MAX_SAFE_INTEGER;
    const rightPrice = b.suggestion.verifiedPrice ?? Number.MAX_SAFE_INTEGER;
    return leftPrice - rightPrice;
  });

  return candidates[0].suggestion;
}

function buildPaidFallback(
  input: PlanPickerInput,
  anyLiveInventory: boolean,
): PaidFallbackPlan {
  if (input.budget === "free") {
    return {
      reason: "free-budget",
      headline: "Paid ticket slot skipped ($0 budget selected)",
      explanation:
        "You set your per-person budget to $0, so we are not pushing a paid booking link. Use the two zero-cost moves on the right as your full block—or open the under-$100 guide only if your group decides to add one low-cost anchor later.",
      recommendedLaneTitle: "Keep the whole block ticket-free",
      recommendedLaneCopy:
        "Pair one scheduled free attraction (fountains, Conservatory, or Fremont stages) with one walkable resort cluster so the plan still has structure.",
      nextSteps: [
        { href: "/free-things", label: "Browse all free Vegas stops", note: "Iconic shows, habitats, and desert art" },
        { href: "/near-your-hotel", label: "Cluster by your hotel area", note: "Avoid spending $40+ on unnecessary rideshares" },
        { href: "/under-100", label: "If you add budget later: Under-$100 rules", note: "How to pick one anchor without junk fees" },
      ],
    };
  }

  const isOutdoors =
    input.interest === "outdoors" ||
    (input.interest === "best-fit" && (input.timeAvailable === "half-day" || input.timeAvailable === "full-day"));

  const isShortWindow = input.timeAvailable === "2-4h";

  const recommendedLaneTitle = isShortWindow
    ? "Compact in-zone Vegas experience (skip long tours)"
    : isOutdoors
      ? input.timeAvailable === "full-day"
        ? "One marquee outing: Grand Canyon vs. Hoover Dam"
        : "Half-day desert contrast: Hoover Dam or Red Rock"
      : input.budget === "200-plus"
        ? "One signature night: Sphere vs. a Strip headliner"
        : input.budget === "under-50" || input.budget === "under-100"
          ? "One value ticket (comedy, magic, or afternoon attraction) under $100"
          : "One anchor Vegas show night matched to your hotel zone";

  const recommendedLaneCopy = isShortWindow
    ? "With 2–4 hours, do not book an off-Strip bus tour or cross town twice. Only buy a compact, timed attraction near your bags or hotel cluster."
    : isOutdoors
      ? "Decide the size of the day before comparing operators: Grand Canyon takes most of the day, while Hoover Dam or Red Rock leaves your Vegas evening intact."
      : input.budget === "200-plus"
        ? "Spend once on a room or performer you will actually remember—Sphere for immersive scale, or a residency/Cirque room when the show format comes first."
        : "Treat your budget as an all-in cap including taxes, ticket fees, and rideshare—one real show beats three forgettable add-ons.";

  const nextSteps: PaidFallbackPlan["nextSteps"] = [];

  if (isShortWindow) {
    nextSteps.push(
      { href: "/four-hours-in-vegas", label: "Open the 4-hour Vegas plan", note: "Tight single-zone blocks" },
      { href: "/before-a-late-flight", label: "Late-flight timing checklist", note: "Protect luggage and airport margin" },
    );
  } else if (isOutdoors) {
    nextSteps.push(
      { href: "/compare/grand-canyon-vs-hoover-dam", label: "Compare Grand Canyon vs. Hoover Dam", note: "Scale vs. hours traded" },
      { href: `/tours?date=${encodeURIComponent(input.startDate)}&party_size=${encodeURIComponent(String(input.partyQuantity))}`, label: "Open Vegas tour lanes", note: "Grand Canyon, Hoover Dam, Red Rock & in-city" },
    );
  } else if (input.budget === "200-plus") {
    nextSteps.push(
      { href: "/compare/sphere-vs-vegas-show", label: "Compare Sphere vs. a Vegas show", note: "Pressure-test the splurge" },
      { href: "/shows/sphere", label: "Check the Sphere guide", note: "What to know before buying" },
      { href: `/shows?date=${encodeURIComponent(input.startDate)}&party_size=${encodeURIComponent(String(input.partyQuantity))}`, label: "Browse Vegas show lanes", note: "Residencies, Cirque, and comedy" },
    );
  } else {
    nextSteps.push(
      { href: "/under-100", label: "Use the Vegas under-$100 guide", note: "Keep fees from blowing the cap" },
      { href: `/shows?date=${encodeURIComponent(input.startDate)}&party_size=${encodeURIComponent(String(input.partyQuantity))}`, label: "Open Vegas show lanes", note: "Comedy, magic, and Strip nights" },
      { href: "/deals", label: "Check official resort & voucher deal lanes", note: "Direct resort offers, Travelzoo & value picks" },
    );
  }

  nextSteps.push({
    href: "#plan-help",
    label: "Ask us for a manual pick for your dates",
    note: "No account needed—send your dates and budget below",
  });

  if (!anyLiveInventory) {
    return {
      reason: "feeds-empty",
      headline: "Live partner inventory is offline right now—use this paid decision lane instead",
      explanation:
        "Save On The Strip never invents prices, seat counts, or placeholder booking buttons when partner feeds are empty or unconfigured. Use the exact decision lane below for your setup, or send your dates at the bottom of the page.",
      recommendedLaneTitle,
      recommendedLaneCopy,
      nextSteps,
    };
  }

  return {
    reason: "no-matching-listing",
    headline: `No verified partner listing matched ${input.startDate}–${input.endDate} inside ${BUDGET_TIER_OPTIONS.find((b) => b.value === input.budget)?.shortLabel || "your budget"}`,
    explanation:
      "Rather than showing an out-of-budget or wrong-date booking button, here is the cleanest next move to adjust or compare before spending.",
    recommendedLaneTitle,
    recommendedLaneCopy,
    nextSteps,
  };
}

function buildFreeAlternative(input: PlanPickerInput): FreeOrLowCostAlternative {
  switch (input.area) {
    case "central-strip":
      return {
        primaryTitle: "Fountains of Bellagio + Bellagio Conservatory loop",
        primaryCostBadge: "$0 admission • Walkable Central Strip",
        primaryAreaLabel: "Central Strip",
        primarySummary:
          "Pair an outdoor fountain show (typically every 30 minutes afternoons, every 15 minutes evenings) with the seasonal indoor floral display inside Bellagio—zero ticket cost and zero rideshare needed.",
        lowCostBackupTitle: "Lower-cost nearby swap: Flamingo Wildlife Habitat + Fall of Atlantis",
        lowCostBackupSummary:
          "Walk across to the free tropical flamingo & koi habitat at Flamingo, or catch the free hourly animatronic show inside the Forum Shops at Caesars.",
        links: [
          { href: "/free-things", label: "See all free Vegas stops" },
          { href: "/near-your-hotel", label: "Central Strip cluster guide" },
        ],
      };

    case "south-strip":
      return {
        primaryTitle: "The Park & Bliss Dance walk + Pinball Hall of Fame",
        primaryCostBadge: "$0 entry (quarters per game) • South Strip",
        primaryAreaLabel: "South Strip",
        primarySummary:
          "Start at the outdoor plaza between New York-New York and Park MGM, then hit the Pinball Hall of Fame on South Las Vegas Blvd—admission is free and you only spend a few dollars in quarters if you play.",
        lowCostBackupTitle: "Free classic add-on: Welcome to Fabulous Las Vegas Sign",
        lowCostBackupSummary:
          "Right next to Pinball Hall of Fame on the south end of the Strip—combine both in one stop so your group avoids paying for two separate rides.",
        links: [
          { href: "/free-things", label: "See all free Vegas stops" },
          { href: "/deals", label: "South Strip MGM & food deal lanes" },
        ],
      };

    case "north-strip":
      return {
        primaryTitle: "Wynn floral atrium walk or Circus Circus daytime acts",
        primaryCostBadge: "$0 admission • North Strip",
        primaryAreaLabel: "North Strip",
        primarySummary:
          input.timeAvailable === "evening"
            ? "Walk the Wynn/Encore public atrium gardens for a polished zero-ticket Strip evening reset before dinner or drinks."
            : "Catch the free daytime acrobat and circus acts at the Circus Circus Midway, or stroll the Wynn indoor gardens without buying an attraction ticket.",
        lowCostBackupTitle: "Lower-cost paid swap: STRAT comedy & North Strip value offers",
        lowCostBackupSummary:
          "If you want a live stage night without residency prices, North Strip rooms like STRAT comedy and SAHARA direct offers typically undercut center-Strip theater pricing.",
        links: [
          { href: "/free-things", label: "See all free Vegas stops" },
          { href: "/deals", label: "SAHARA & Resorts World offer lanes" },
        ],
      };

    case "downtown-fremont":
      return {
        primaryTitle: "Fremont Street Experience LED canopy & free live music stages",
        primaryCostBadge: "$0 admission • Walkable Downtown",
        primaryAreaLabel: "Downtown / Fremont",
        primarySummary:
          "Downtown's pedestrian mall gives groups live bands, street energy, and overhead Viva Vision light shows across five compact blocks—no cover charge and no splitting into multiple rideshares.",
        lowCostBackupTitle: "Lower-cost nearby swap: Downtown value dining & coupon lanes",
        lowCostBackupSummary:
          "Keep dinner and drinks inside Downtown/Arts District rather than paying peak Strip resort markups.",
        links: [
          { href: "/free-things", label: "See all free Vegas stops" },
          { href: "/deals", label: "Fremont & cheap-eats deal lanes" },
        ],
      };

    case "off-strip":
      return {
        primaryTitle: "Shelby Heritage Center or Silverton Reef Aquarium",
        primaryCostBadge: "$0 admission • Easy parking Off-Strip",
        primaryAreaLabel: "Off-Strip / Car-Friendly",
        primarySummary:
          input.timeAvailable === "evening"
            ? "Use Silverton's free 117,000-gallon reef aquarium or park once at Bellagio/Town Square for a single planned evening walk instead of bouncing between paid garages."
            : "Take advantage of easy off-Strip driving with the free self-guided Shelby Heritage Center car collection—or hit Seven Magic Mountains south of town for a zero-ticket desert art stop.",
        lowCostBackupTitle: "Off-Strip value base: Rio Canteen Food Hall & Station Casinos offers",
        lowCostBackupSummary:
          "If you are staying near Rio or another off-Strip resort, eat on-property at value food halls before making one intentional trip to the Strip.",
        links: [
          { href: "/hotels/rio-las-vegas-renovation-update", label: "Rio 2026 renovation & value guide" },
          { href: "/free-things", label: "See free desert & museum stops" },
        ],
      };
  }
}

function buildGuardrails(input: PlanPickerInput): string[] {
  const notes: string[] = [];

  if (input.partyQuantity >= 5) {
    notes.push(
      `Group of ${input.groupSize}: every cross-Strip move usually means two rideshares or an XL vehicle each way. Anchor dinner, your free stop, and any ticket in the same resort zone.`,
    );
  } else {
    notes.push(
      `Stay geographically tight around ${areaShortLabel(input.area)} first—casino blocks take 15–25 minutes to walk even when resorts look adjacent.`,
    );
  }

  if (input.timeAvailable === "2-4h") {
    notes.push(
      "Short 2–4 hour window: lock down luggage storage and work backward from your hard stop or airport departure before adding a second stop.",
    );
  } else if (input.budget === "under-50" || input.budget === "under-100") {
    notes.push(
      "Count ticket service fees, taxes, parking, and rideshares inside your per-person cap—a $79 headline ticket often checks out closer to $105.",
    );
  } else {
    notes.push(
      "Splurge once, save twice: let one anchor ticket carry the plan and surround it with zero-cost Vegas stops instead of stacking mediocre add-ons.",
    );
  }

  if (input.area === "central-strip" || input.area === "north-strip") {
    notes.push(
      "Strip construction reality: the former Mirage site (and old Volcano) is closed for the Hard Rock / Guitar Hotel build targeting late 2027—use Bellagio, Venetian, or Treasure Island nearby instead.",
    );
  } else if (input.area === "off-strip") {
    notes.push(
      "Off-Strip stays (like renovated Ipanema suites at Rio) save on room size and parking—protect those savings by batching Strip time into one trip per day.",
    );
  }

  return notes;
}

function buildMatchedGuides(input: PlanPickerInput): GuideLinkItem[] {
  const guides: GuideLinkItem[] = [];

  if (input.timeAvailable === "2-4h") {
    guides.push(
      {
        href: "/four-hours-in-vegas",
        title: "What to Do With 4 Hours in Las Vegas",
        reason: "Built specifically for tight 2–4 hour windows without transit waste.",
      },
      {
        href: "/before-a-late-flight",
        title: "Before a Late Flight in Las Vegas",
        reason: "How to handle bags and finish strong without risking your airport clock.",
      },
    );
  } else if (input.timeAvailable === "evening") {
    guides.push({
      href: "/tonight",
      title: "What to Do in Las Vegas Tonight",
      reason: "Short same-night decision board when you want one clear evening plan.",
    });
  }

  if (input.budget === "under-50" || input.budget === "under-100" || input.budget === "free") {
    guides.push({
      href: "/under-100",
      title: "Things to Do in Las Vegas Under $100",
      reason: "How to pick one paid anchor and keep service fees from wrecking the cap.",
    });
  }

  if (
    input.interest === "outdoors" ||
    input.timeAvailable === "half-day" ||
    input.timeAvailable === "full-day"
  ) {
    guides.push({
      href: "/compare/grand-canyon-vs-hoover-dam",
      title: "Grand Canyon vs. Hoover Dam",
      reason: "Decide whether your schedule fits an all-day canyon run or a half-day dam trip.",
    });
  }

  if (input.interest === "shows" || input.budget === "200-plus") {
    guides.push({
      href: "/compare/sphere-vs-vegas-show",
      title: "Sphere vs. a Traditional Vegas Show",
      reason: "Compare immersive venue spectacle against performer-driven Strip shows.",
    });
  }

  guides.push(
    {
      href: "/near-your-hotel",
      title: "Things to Do Near Your Hotel",
      reason: `Keep your ${areaShortLabel(input.area)} plan clustered before paying to cross town.`,
    },
    {
      href: "/worth-it",
      title: "What Is Actually Worth It in Las Vegas",
      reason: "Quick pressure-test before paying for any Vegas ticket or upgrade.",
    },
    {
      href: "/what-to-skip-in-las-vegas",
      title: "What to Skip in Las Vegas",
      reason: "Avoid urgency traps, bad geography, and high-fee filler attractions.",
    },
  );

  // Deduplicate and cap at 4 focused guides.
  const seen = new Set<string>();
  return guides
    .filter((item) => {
      if (seen.has(item.href)) return false;
      seen.add(item.href);
      return true;
    })
    .slice(0, 4);
}

export function buildVegasPlan(
  rawParams: Record<string, string | string[] | undefined>,
  feeds: PlanPickerFeeds,
  now = new Date(),
): BuiltVegasPlan {
  const input = normalizePlanInput(rawParams, now);
  const anyLiveInventory =
    feeds.tours.length > 0 ||
    feeds.ticketmasterShows.length > 0 ||
    feeds.seatGeekEvents.length > 0;

  const paidSuggestion = selectPaidSuggestion(input, feeds);
  const paidFallback = paidSuggestion
    ? null
    : buildPaidFallback(input, anyLiveInventory);
  const freeAlternative = buildFreeAlternative(input);
  const guardrails = buildGuardrails(input);
  const guides = buildMatchedGuides(input);

  const areaLabel = areaShortLabel(input.area);
  const timeLabel =
    TIME_AVAILABLE_OPTIONS.find((item) => item.value === input.timeAvailable)?.shortLabel ||
    input.timeAvailable;
  const budgetLabel =
    BUDGET_TIER_OPTIONS.find((item) => item.value === input.budget)?.shortLabel ||
    input.budget;
  const groupLabel =
    GROUP_SIZE_OPTIONS.find((item) => item.value === input.groupSize)?.shortLabel ||
    `${input.partyQuantity} travelers`;

  const headline =
    input.budget === "free"
      ? `${timeLabel} zero-spend plan around ${areaLabel}`
      : `${timeLabel} Vegas plan near ${areaLabel} (${budgetLabel})`;

  const verdict = paidSuggestion
    ? `Anchor ${timeLabel.toLowerCase()} with ${paidSuggestion.title}, then balance the spend with ${freeAlternative.primaryTitle} so ${groupLabel.toLowerCase()} get a complete Vegas block without stacking extra tickets.`
    : input.budget === "free"
      ? `Lock in ${freeAlternative.primaryTitle} first and keep ${groupLabel.toLowerCase()} inside ${areaLabel} so $0 on tickets does not turn into $60 on rideshares.`
      : `Start in ${areaLabel} with ${freeAlternative.primaryTitle}, and use the matched paid lane below to pick one worthwhile anchor inside ${budgetLabel} once you confirm live provider pricing.`;

  const dateChip =
    input.startDate === input.endDate
      ? input.startDate
      : `${input.startDate} → ${input.endDate}`;

  return {
    input,
    headline,
    verdict,
    setupSummaryChips: [dateChip, areaLabel, groupLabel, timeLabel, budgetLabel],
    paidSuggestion,
    paidFallback,
    freeAlternative,
    guardrails,
    guides,
    feedSummary: {
      toursCount: feeds.tours.length,
      showsCount: feeds.ticketmasterShows.length,
      marketplaceCount: feeds.seatGeekEvents.length,
      anyLiveInventory,
    },
    disclosure: PARTNER_DISCLOSURE_TEXT,
  };
}
