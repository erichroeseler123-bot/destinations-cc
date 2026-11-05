import crypto from "node:crypto";
import { getViatorClient } from "@/lib/viator/client";
import { appendViatorAttribution } from "@/lib/viator/links";
import { DCC_VIATOR_PRODUCT_MAPPINGS } from "@/lib/viator/mappings";
import { fetchCompaniesItems } from "@/lib/dcc/liveSlots/fareharbor";
import { getActiveGoSnoRouteFeedSnapshotState } from "@/lib/dcc/applicability/gosnoRouteFeedSnapshot";
import { RED_ROCKS_CONCERT_CANDIDATE_OPTIONS } from "@/lib/dcc/decisionEngines/redRocksConcertTransportationEngine";
import { DCC_SITE_TRUTH } from "@/lib/dcc/siteTruth";
import {
  EARTHOS_DESTINATION_NODES,
  getCompatibilityAliasesForViatorCode,
  readLocalCatalogSnapshot,
  recordCatalogSyncRun,
  upsertDurableTourRecords,
  type CatalogSyncRunRecord,
  type ChannelOffer,
  type DurableTourRecord,
  type EarthOSDestinationNode,
  type LocationPrecision,
  type PickupLocationRecord,
  type PriceBasis,
  type TourAgeBandRecord,
  type TourProductOptionRecord,
} from "./durableCatalogStore";

function sha256Hex(value: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function parseDurationMinutesFromViator(rawDuration: any): {
  durationMinutes: number | null;
  durationRawText: string | null;
} {
  if (!rawDuration || typeof rawDuration !== "object") {
    return { durationMinutes: null, durationRawText: null };
  }
  if (typeof rawDuration.fixedDurationInMinutes === "number" && rawDuration.fixedDurationInMinutes > 0) {
    return {
      durationMinutes: Math.round(rawDuration.fixedDurationInMinutes),
      durationRawText: `${Math.round(rawDuration.fixedDurationInMinutes)}m fixed`,
    };
  }
  const fromMin =
    typeof rawDuration.variableDurationFromMinutes === "number"
      ? rawDuration.variableDurationFromMinutes
      : null;
  const toMin =
    typeof rawDuration.variableDurationToMinutes === "number"
      ? rawDuration.variableDurationToMinutes
      : null;
  if (fromMin && toMin && fromMin > 0 && toMin >= fromMin) {
    return {
      durationMinutes: Math.round(toMin),
      durationRawText: `${Math.round(fromMin)}-${Math.round(toMin)}m variable`,
    };
  }
  if (fromMin && fromMin > 0) {
    return {
      durationMinutes: Math.round(fromMin),
      durationRawText: `${Math.round(fromMin)}m+`,
    };
  }
  return { durationMinutes: null, durationRawText: null };
}

function parseCancellationFromViator(
  detailPolicy: any,
  searchFlags: unknown[],
): {
  freeCancellation: boolean | null;
  cancellationPolicyType: "STANDARD" | "ALL_SALES_FINAL" | "CUSTOM" | "UNKNOWN" | null;
  cancellationCutoffHours: number | null;
  cancellationSummary: string | null;
} {
  const flags = Array.isArray(searchFlags)
    ? searchFlags.map((f) => String(f || "").toUpperCase())
    : [];

  if (detailPolicy && typeof detailPolicy === "object") {
    const pType = String(detailPolicy.type || "").toUpperCase();
    const desc = typeof detailPolicy.description === "string" ? detailPolicy.description.trim() : null;
    if (pType === "STANDARD") {
      return {
        freeCancellation: true,
        cancellationPolicyType: "STANDARD",
        cancellationCutoffHours: 24,
        cancellationSummary:
          desc || "Full refund if cancelled at least 24 hours before the experience start time.",
      };
    }
    if (pType === "ALL_SALES_FINAL") {
      return {
        freeCancellation: false,
        cancellationPolicyType: "ALL_SALES_FINAL",
        cancellationCutoffHours: 0,
        cancellationSummary: desc || "All sales final; non-refundable once booked.",
      };
    }
    if (pType === "CUSTOM") {
      const eligibility = Array.isArray(detailPolicy.refundEligibility)
        ? detailPolicy.refundEligibility
        : [];
      const fullRefundRule = eligibility.find(
        (r: any) => typeof r?.percentageRefundable === "number" && r.percentageRefundable === 100,
      );
      const cutoffDays =
        typeof fullRefundRule?.dayRangeMin === "number" ? fullRefundRule.dayRangeMin : null;
      return {
        freeCancellation: Boolean(fullRefundRule),
        cancellationPolicyType: "CUSTOM",
        cancellationCutoffHours: cutoffDays !== null ? cutoffDays * 24 : null,
        cancellationSummary: desc || "Custom operator cancellation terms apply.",
      };
    }
  }

  if (flags.includes("FREE_CANCELLATION")) {
    return {
      freeCancellation: true,
      cancellationPolicyType: "STANDARD",
      cancellationCutoffHours: 24,
      cancellationSummary: "Free cancellation flag verified in Viator search response.",
    };
  }

  // Explicit null when unknown — NEVER default to freeCancellation: true
  return {
    freeCancellation: null,
    cancellationPolicyType: null,
    cancellationCutoffHours: null,
    cancellationSummary: null,
  };
}

function parsePickupAndLocationsFromViator(
  detail: any,
  resolvedLocationsByRef: Map<string, any>,
): {
  hasHotelPickup: boolean | null;
  pickupType:
    | "HOTEL_PICKUP"
    | "MEETING_POINT_ONLY"
    | "HOTEL_OR_MEETING_POINT"
    | "CRUISE_PIER_PICKUP"
    | "UNKNOWN"
    | null;
  pickupSummary: string | null;
  meetingPointName: string | null;
  meetingPointAddress: string | null;
  meetingPointLat: number | null;
  meetingPointLng: number | null;
  locationPrecision: LocationPrecision;
  pickupLocations: PickupLocationRecord[];
} {
  const logistics = detail?.logistics;
  if (!logistics || typeof logistics !== "object") {
    return {
      hasHotelPickup: null,
      pickupType: null,
      pickupSummary: null,
      meetingPointName: null,
      meetingPointAddress: null,
      meetingPointLat: null,
      meetingPointLng: null,
      locationPrecision: "unknown",
      pickupLocations: [],
    };
  }

  const tp = logistics.travelerPickup;
  const tpType = String(tp?.pickupOptionType || "").toUpperCase();
  let hasHotelPickup: boolean | null = null;
  let pickupType:
    | "HOTEL_PICKUP"
    | "MEETING_POINT_ONLY"
    | "HOTEL_OR_MEETING_POINT"
    | "CRUISE_PIER_PICKUP"
    | "UNKNOWN"
    | null = null;

  if (tpType === "PICKUP_EVERYONE") {
    hasHotelPickup = true;
    pickupType = "HOTEL_PICKUP";
  } else if (tpType === "PICKUP_AND_MEET_AT_START_POINT") {
    hasHotelPickup = true;
    pickupType = "HOTEL_OR_MEETING_POINT";
  } else if (tpType === "MEET_EVERYONE_AT_START_POINT") {
    hasHotelPickup = false;
    pickupType = "MEETING_POINT_ONLY";
  } else if (typeof tp?.allowCustomTravelerPickup === "boolean" && tp.allowCustomTravelerPickup) {
    hasHotelPickup = true;
    pickupType = "HOTEL_OR_MEETING_POINT";
  }

  const pickupSummary =
    typeof tp?.additionalInfo === "string" && tp.additionalInfo.trim()
      ? tp.additionalInfo.trim()
      : null;

  let meetingPointName: string | null = null;
  let meetingPointAddress: string | null = null;
  let meetingPointLat: number | null = null;
  let meetingPointLng: number | null;
  meetingPointLng = null;
  let locationPrecision: LocationPrecision = "unknown";

  const startArr = Array.isArray(logistics.start) ? logistics.start : [];
  if (startArr.length > 0) {
    const firstStart = startArr[0];
    const startDesc =
      typeof firstStart?.description === "string" && firstStart.description.trim()
        ? firstStart.description.trim()
        : null;
    const locRef = String(firstStart?.location?.ref || "").trim();
    const resolved = locRef ? resolvedLocationsByRef.get(locRef) : null;
    if (resolved) {
      meetingPointName = resolved.name || startDesc || null;
      const addrParts = [
        resolved.address?.street,
        resolved.address?.city,
        resolved.address?.state,
        resolved.address?.postcode,
      ].filter(Boolean);
      meetingPointAddress = addrParts.length > 0 ? addrParts.join(", ") : startDesc;
      const lat = resolved.center?.latitude ?? resolved.latitude ?? null;
      const lng = resolved.center?.longitude ?? resolved.longitude ?? null;
      if (typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng)) {
        meetingPointLat = lat;
        meetingPointLng = lng;
        locationPrecision = "exact";
      }
    } else if (startDesc) {
      meetingPointName = startDesc.slice(0, 140);
      meetingPointAddress = startDesc;
    }
  }

  const pickupLocations: PickupLocationRecord[] = [];
  const rawPickupLocs = Array.isArray(tp?.locations) ? tp.locations : [];
  for (const item of rawPickupLocs.slice(0, 25)) {
    const ref = String(item?.location?.ref || "").trim();
    const resolved = ref ? resolvedLocationsByRef.get(ref) : null;
    const pType = String(item?.pickupType || "OTHER").toUpperCase();
    if (resolved) {
      const lat = resolved.center?.latitude ?? resolved.latitude ?? null;
      const lng = resolved.center?.longitude ?? resolved.longitude ?? null;
      const hasCoords =
        typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng);
      pickupLocations.push({
        ref,
        name: String(resolved.name || ref),
        address:
          [resolved.address?.street, resolved.address?.city, resolved.address?.state]
            .filter(Boolean)
            .join(", ") || null,
        lat: hasCoords ? lat : null,
        lng: hasCoords ? lng : null,
        precision: hasCoords ? "exact" : "unknown",
        pickupType:
          pType === "HOTEL" || pType === "CRUISE_PORT" || pType === "AIRPORT"
            ? (pType as any)
            : "OTHER",
      });
    }
  }

  return {
    hasHotelPickup,
    pickupType,
    pickupSummary,
    meetingPointName,
    meetingPointAddress,
    meetingPointLat,
    meetingPointLng,
    locationPrecision,
    pickupLocations,
  };
}

const NEGATIVE_PICKUP_OPTION_REGEX =
  /\b(no\s+(hotel\s+)?pick\s*-?\s*up|without\s+(hotel\s+)?pick\s*-?\s*up|no\s+transport(ation)?|without\s+transport(ation)?|self\s*-?\s*drive|drive\s+yourself|meet\s+at\s+(site|location|dock|pier|marina))\b/i;

const POSITIVE_PICKUP_OPTION_REGEX =
  /(?:\+\s*transport(?:ation)?\b|\b(?:with\s+(?:hotel\s+)?pick\s*-?\s*up|with\s+transport(?:ation)?|pick\s*-?\s*up\s+included|transport(?:ation)?\s+included|includes\s+(?:hotel\s+)?pick\s*-?\s*up|includes\s+(?:round-?\s*trip\s+)?transport(?:ation)?|\d{1,2}:\d{2}\s*(?:am|pm)?\s*pick\s*-?\s*up|hotel\s+pick\s*-?\s*up)\b)/i;

function parseDurationFromOptionText(text: string | null): number | null {
  if (!text) return null;
  const m = text.match(
    /Duration:\s*(?:(\d+)\s*hours?)?\s*(?:(\d+)\s*minutes?)?/i,
  );
  if (!m || (!m[1] && !m[2])) return null;
  const hours = m[1] ? Number.parseInt(m[1], 10) : 0;
  const mins = m[2] ? Number.parseInt(m[2], 10) : 0;
  const total = hours * 60 + mins;
  return total > 0 ? total : null;
}

export function parseProductOptionsAndScheduleFromViator(
  detail: any,
  schedule: any,
  hasHotelPickup: boolean | null,
  defaultDurationMinutes: number | null,
  productTitle: string,
  productSummary: string | null,
): {
  scheduleFromPriceCents: number | null;
  priceBasis: PriceBasis;
  productOptions: TourProductOptionRecord[];
  lowestPriceIncludesPickup: boolean | null;
  effectiveHasHotelPickup: boolean | null;
} {
  const rawPricingType = String(detail?.pricingInfo?.type || "").toUpperCase();
  const productPriceBasis: PriceBasis =
    rawPricingType === "UNIT" || rawPricingType === "PER_GROUP"
      ? "per_group"
      : "per_person";

  const rawScheduleFrom =
    typeof schedule?.summary?.fromPrice === "number" && Number.isFinite(schedule.summary.fromPrice)
      ? Math.round(schedule.summary.fromPrice * 100)
      : null;

  const bookableItemsByOptionCode = new Map<
    string,
    { minPriceCents: number | null; startTimes: string[]; durationMinutes: number | null }
  >();

  const bookableItems = Array.isArray(schedule?.bookableItems) ? schedule.bookableItems : [];
  for (const bi of bookableItems) {
    const optCode = String(bi?.productOptionCode || "DEFAULT").trim();
    let minAdultOrTravelerPrice: number | null = null;
    let minAnyPrice: number | null = null;
    const startTimesSet = new Set<string>();
    const seasons = Array.isArray(bi?.seasons) ? bi.seasons : [];

    for (const season of seasons) {
      const pricingRecords = Array.isArray(season?.pricingRecords) ? season.pricingRecords : [];
      for (const pr of pricingRecords) {
        const timedEntries = Array.isArray(pr?.timedEntries) ? pr.timedEntries : [];
        for (const te of timedEntries) {
          const st = typeof te?.startTime === "string" ? te.startTime.trim() : "";
          if (/^\d{2}:\d{2}$/.test(st)) {
            startTimesSet.add(st);
          }
        }
        const pricingDetails = Array.isArray(pr?.pricingDetails) ? pr.pricingDetails : [];
        for (const pd of pricingDetails) {
          const ageBand = String(pd?.ageBand || "").toUpperCase();
          const prices = Array.isArray(pd?.price?.original?.recommendedRetailPrice)
            ? pd.price.original.recommendedRetailPrice
            : typeof pd?.price?.original?.recommendedRetailPrice === "number"
              ? [pd.price.original.recommendedRetailPrice]
              : [];
          for (const pVal of prices) {
            if (typeof pVal === "number" && Number.isFinite(pVal) && pVal > 0) {
              const cents = Math.round(pVal * 100);
              if (minAnyPrice === null || cents < minAnyPrice) {
                minAnyPrice = cents;
              }
              if (ageBand === "ADULT" || ageBand === "TRAVELER" || !ageBand) {
                if (minAdultOrTravelerPrice === null || cents < minAdultOrTravelerPrice) {
                  minAdultOrTravelerPrice = cents;
                }
              }
            }
          }
        }
      }
    }

    const parsedDur = parseDurationMinutesFromViator(bi?.duration);
    bookableItemsByOptionCode.set(optCode, {
      minPriceCents: minAdultOrTravelerPrice ?? minAnyPrice,
      startTimes: Array.from(startTimesSet).sort(),
      durationMinutes: parsedDur.durationMinutes,
    });
  }

  const rawOptions = Array.isArray(detail?.productOptions) ? detail.productOptions : [];
  const anyOptionMatchesNegativePickup = rawOptions.some((o: any) =>
    NEGATIVE_PICKUP_OPTION_REGEX.test(`${o?.title || ""} ${o?.description || ""}`),
  );
  const anyOptionMatchesPositivePickup = rawOptions.some((o: any) =>
    POSITIVE_PICKUP_OPTION_REGEX.test(`${o?.title || ""} ${o?.description || ""}`),
  );

  // Also check itinerary items if option codes have specific durations
  const durationByOptionCode = new Map<string, number>();
  if (
    anyOptionMatchesPositivePickup &&
    anyOptionMatchesNegativePickup &&
    typeof detail?.itinerary?.duration?.variableDurationFromMinutes === "number" &&
    typeof detail?.itinerary?.duration?.variableDurationToMinutes === "number"
  ) {
    // When itinerary duration is a variable range (e.g. 90m self-drive vs 225m with transportation),
    // map self-drive options to variableDurationFromMinutes and pickup options to variableDurationToMinutes
    for (const o of rawOptions) {
      const code = String(o?.productOptionCode || "").trim();
      const text = `${o?.title || ""} ${o?.description || ""}`;
      if (NEGATIVE_PICKUP_OPTION_REGEX.test(text)) {
        durationByOptionCode.set(code, Math.round(detail.itinerary.duration.variableDurationFromMinutes));
      } else if (POSITIVE_PICKUP_OPTION_REGEX.test(text)) {
        durationByOptionCode.set(code, Math.round(detail.itinerary.duration.variableDurationToMinutes));
      }
    }
  }

  const productOptions: TourProductOptionRecord[] = [];
  for (const rawOpt of rawOptions) {
    const optionCode = String(rawOpt?.productOptionCode || "").trim();
    if (!optionCode) continue;
    const title = String(rawOpt?.title || optionCode).trim();
    const description =
      typeof rawOpt?.description === "string" && rawOpt.description.trim()
        ? rawOpt.description.trim()
        : null;
    const combinedText = `${title} ${description || ""}`;

    let includesPickup: boolean | null = null;
    if (NEGATIVE_PICKUP_OPTION_REGEX.test(combinedText)) {
      includesPickup = false;
    } else if (POSITIVE_PICKUP_OPTION_REGEX.test(combinedText)) {
      includesPickup = true;
    } else if (hasHotelPickup === false) {
      includesPickup = false;
    } else if (hasHotelPickup === true) {
      if (anyOptionMatchesNegativePickup) {
        // Other options explicitly say "No Pickup" / "No Transportation", so this option includes pickup
        includesPickup = true;
      } else if (anyOptionMatchesPositivePickup) {
        // Other options explicitly say "With Pickup", and this option does not
        includesPickup = false;
      } else {
        // Hotel pickup applies across all options of this product
        includesPickup = true;
      }
    }

    const scheduleMatch = bookableItemsByOptionCode.get(optionCode);
    const optDur =
      parseDurationMinutesFromViator(rawOpt?.duration).durationMinutes ??
      parseDurationFromOptionText(description) ??
      durationByOptionCode.get(optionCode) ??
      scheduleMatch?.durationMinutes ??
      defaultDurationMinutes;

    productOptions.push({
      optionCode,
      title,
      description,
      includesPickup,
      durationMinutes: optDur ?? null,
      fromPriceCents: scheduleMatch?.minPriceCents ?? null,
      priceBasis: productPriceBasis,
      scheduledStartTimes: scheduleMatch?.startTimes || [],
    });
  }

  // If product has no explicit productOptions array in detail, but has a single DEFAULT bookableItem
  if (productOptions.length === 0 && bookableItemsByOptionCode.size === 1) {
    const [optCode, itemInfo] = Array.from(bookableItemsByOptionCode.entries())[0];
    productOptions.push({
      optionCode: optCode,
      title: productTitle,
      description: null,
      includesPickup: hasHotelPickup,
      durationMinutes: itemInfo.durationMinutes ?? defaultDurationMinutes,
      fromPriceCents: itemInfo.minPriceCents ?? rawScheduleFrom,
      priceBasis: productPriceBasis,
      scheduledStartTimes: itemInfo.startTimes,
    });
  }

  const effectiveHasHotelPickup =
    productOptions.some((o) => o.includesPickup === true) ? true : hasHotelPickup;

  let lowestPriceIncludesPickup: boolean | null = null;
  if (effectiveHasHotelPickup === false) {
    lowestPriceIncludesPickup = false;
  } else if (effectiveHasHotelPickup === true) {
    if (productOptions.length > 0) {
      const pricedOpts = productOptions.filter(
        (o) => typeof o.fromPriceCents === "number" && Number.isFinite(o.fromPriceCents),
      );
      if (pricedOpts.length > 0) {
        const minAll = Math.min(...pricedOpts.map((o) => o.fromPriceCents as number));
        const cheapestOpts = pricedOpts.filter((o) => o.fromPriceCents === minAll);
        if (cheapestOpts.some((o) => o.includesPickup === false)) {
          lowestPriceIncludesPickup = false;
        } else if (cheapestOpts.every((o) => o.includesPickup === true)) {
          lowestPriceIncludesPickup = true;
        }
      } else {
        if (productOptions.some((o) => o.includesPickup === false)) {
          lowestPriceIncludesPickup = false;
        } else if (productOptions.every((o) => o.includesPickup === true)) {
          lowestPriceIncludesPickup = true;
        }
      }
    } else {
      const titleAndSummary = `${productTitle} ${productSummary || ""}`;
      if (/\boptional\s+(hotel\s+)?(transport(ation)?|pick\s*-?\s*up|shuttle)\b/i.test(titleAndSummary)) {
        lowestPriceIncludesPickup = false;
      } else {
        lowestPriceIncludesPickup = null;
      }
    }
  }

  return {
    scheduleFromPriceCents: rawScheduleFrom,
    priceBasis: productPriceBasis,
    productOptions,
    lowestPriceIncludesPickup,
    effectiveHasHotelPickup,
  };
}

function parseAgeBandsFromViator(detail: any): TourAgeBandRecord[] {
  const rawBands = detail?.pricingInfo?.ageBands;
  if (!Array.isArray(rawBands)) return [];
  const out: TourAgeBandRecord[] = [];
  for (const b of rawBands) {
    const band = String(b?.ageBand || "").toUpperCase();
    if (
      (band === "ADULT" ||
        band === "CHILD" ||
        band === "INFANT" ||
        band === "YOUTH" ||
        band === "SENIOR" ||
        band === "TRAVELER") &&
      typeof b?.startAge === "number" &&
      typeof b?.endAge === "number"
    ) {
      out.push({
        ageBand: band as TourAgeBandRecord["ageBand"],
        startAge: b.startAge,
        endAge: b.endAge,
        minTravelersPerBooking:
          typeof b?.minTravelersPerBooking === "number" ? b.minTravelersPerBooking : undefined,
        maxTravelersPerBooking:
          typeof b?.maxTravelersPerBooking === "number" ? b.maxTravelersPerBooking : undefined,
      });
    }
  }
  return out;
}

function inferCategoryFromTitleAndSummary(title: string, summary: string | null): string {
  const text = `${title} ${summary || ""}`.toLowerCase();
  if (text.includes("swamp") || text.includes("bayou") || text.includes("airboat")) {
    return "Swamp & Bayou";
  }
  if (text.includes("helicopter") || text.includes("flightseeing") || text.includes("floatplane")) {
    return "Helicopter & Flightseeing";
  }
  if (text.includes("whale") || text.includes("dolphin") || text.includes("wildlife") || text.includes("marine")) {
    return "Whale Watching & Marine Wildlife";
  }
  if (text.includes("glacier") || text.includes("dogsled") || text.includes("icefield")) {
    return "Glacier & Adventure";
  }
  if (text.includes("ghost") || text.includes("vampire") || text.includes("haunted") || text.includes("cemetery")) {
    return "Ghost, History & Walking";
  }
  if (text.includes("jazz") || text.includes("steamboat") || text.includes("riverboat") || text.includes("music")) {
    return "Music & Riverboat Cruises";
  }
  if (text.includes("food") || text.includes("culinary") || text.includes("cooking") || text.includes("cocktail")) {
    return "Food, Drink & Culture";
  }
  if (text.includes("snorkel") || text.includes("reef") || text.includes("catamaran") || text.includes("beach")) {
    return "Snorkeling, Reef & Beach";
  }
  if (text.includes("shuttle") || text.includes("transfer") || text.includes("transport")) {
    return "Mountain & Venue Transfers";
  }
  return "Guided Sightseeing & Excursions";
}

function extractPrimaryImageUrl(images: unknown): string | null {
  if (!Array.isArray(images) || images.length === 0) return null;
  const first = images[0] as any;
  const variants = Array.isArray(first?.variants) ? first.variants : [];
  const preferred =
    variants.find((v: any) => typeof v?.width === "number" && v.width >= 600 && v.width <= 1000) ||
    variants[0];
  return typeof preferred?.url === "string" ? preferred.url : null;
}

function extractStringDescriptions(items: unknown): string[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((item: any) => {
      if (typeof item === "string") return item.trim();
      if (typeof item?.otherDescription === "string" && item.otherDescription.trim()) {
        return item.otherDescription.trim();
      }
      if (typeof item?.description === "string" && item.description.trim()) {
        return item.description.trim();
      }
      if (typeof item?.typeDescription === "string" && item.typeDescription.trim()) {
        return item.typeDescription.trim();
      }
      return "";
    })
    .filter(Boolean)
    .slice(0, 12);
}

export type IngestionOptions = {
  destinations?: string[];
  perDestinationLimit?: number;
  enrichDetailLimitPerDestination?: number;
  startOffset?: number;
  maxPagesPerDestination?: number;
  resumeFromCheckpoint?: boolean;
};

export async function runUniversalCatalogIngestion(options: IngestionOptions = {}) {
  const client = getViatorClient();
  const targetSlugs =
    options.destinations && options.destinations.length > 0
      ? options.destinations
      : Object.keys(EARTHOS_DESTINATION_NODES);
  const pageSize = Math.min(Math.max(options.perDestinationLimit ?? 12, 1), 50);
  const maxPages = Math.max(options.maxPagesPerDestination ?? 1, 1);
  const enrichLimit = options.enrichDetailLimitPerDestination ?? 6;

  const existingSnapshot = readLocalCatalogSnapshot();
  const allUpsertedRecords: DurableTourRecord[] = [];
  const allSyncRuns: CatalogSyncRunRecord[] = [];

  for (const destSlug of targetSlugs) {
    const node = EARTHOS_DESTINATION_NODES[destSlug];
    if (!node) continue;

    const runId = `sync:viator:${destSlug}:${Date.now()}`;
    const startedAt = new Date().toISOString();
    let upstreamRequests = 0;
    let importedCount = 0;
    let rejectedCount = 0;
    const rejectionReasons: Record<string, number> = {};

    // Determine starting 1-based offset from checkpoint if resumeFromCheckpoint is enabled
    let initialStartOffset = options.startOffset ?? 1;
    if (options.resumeFromCheckpoint) {
      const priorRun = existingSnapshot.syncRuns.find(
        (r) => r.provider === "viator" && r.destinationSlug === destSlug && r.status === "completed",
      );
      const savedNext = priorRun?.metadata?.nextStartOffset;
      if (typeof savedNext === "number" && Number.isFinite(savedNext) && savedNext >= 1) {
        initialStartOffset = savedNext;
      }
    }

    try {
      const rawProducts: any[] = [];
      const seenProductCodes = new Set<string>();
      let currentStart = initialStartOffset;
      let pagesFetched = 0;
      let providerTotalCount = 0;

      while (pagesFetched < maxPages) {
        upstreamRequests += 1;
        const searchRes = (await client.searchProducts({
          filtering: {
            destination: String(node.viatorDestinationId),
          },
          pagination: {
            start: currentStart,
            count: pageSize,
          },
          currency: "USD",
        })) as any;

        if (typeof searchRes?.totalCount === "number" && searchRes.totalCount > 0) {
          providerTotalCount = searchRes.totalCount;
        }
        const pageItems: any[] = Array.isArray(searchRes?.products) ? searchRes.products : [];
        pagesFetched += 1;

        if (pageItems.length === 0) {
          break;
        }

        for (const p of pageItems) {
          const code = String(p?.productCode || "").trim().toUpperCase();
          if (code && !seenProductCodes.has(code)) {
            seenProductCodes.add(code);
            rawProducts.push(p);
          }
        }

        currentStart += pageItems.length;
        if (providerTotalCount > 0 && currentStart > providerTotalCount) {
          break;
        }
        if (pageItems.length < pageSize) {
          break;
        }
      }

      // Ensure any mapped compatibility Viator codes for this destination are also included
      const mappedForDest = DCC_VIATOR_PRODUCT_MAPPINGS.filter(
        (m) =>
          m.destination.toLowerCase().replace(/[^a-z0-9]+/g, "-") === destSlug ||
          (m.portSlug && m.portSlug.toLowerCase() === destSlug),
      );
      const extraMappedCodes = Array.from(
        new Set(mappedForDest.map((m) => m.viatorCode.trim().toUpperCase())),
      ).filter((code) => code && !seenProductCodes.has(code));

      // Enrich top products + any explicit mapped codes with getProductDetail + getProductSchedules
      const codesToEnrich = Array.from(
        new Set([
          ...extraMappedCodes,
          ...rawProducts
            .slice(0, destSlug === "new-orleans" ? Math.max(enrichLimit, 6) : enrichLimit)
            .map((p) => String(p?.productCode || "").trim())
            .filter(Boolean),
        ]),
      );

      const detailsByCode = new Map<string, any>();
      const schedulesByCode = new Map<string, any>();
      const locationRefsToResolve = new Set<string>();

      for (const code of codesToEnrich) {
        try {
          upstreamRequests += 1;
          const detail = (await client.getProductDetail(code)) as any;
          if (detail && detail.productCode) {
            const codeUpper = String(detail.productCode).toUpperCase();
            detailsByCode.set(codeUpper, detail);
            if (!seenProductCodes.has(codeUpper)) {
              rawProducts.unshift(detail);
              seenProductCodes.add(codeUpper);
            }
            const starts = Array.isArray(detail?.logistics?.start) ? detail.logistics.start : [];
            for (const s of starts) {
              const ref = String(s?.location?.ref || "").trim();
              if (ref && ref.startsWith("LOC-")) locationRefsToResolve.add(ref);
            }
            const pickups = Array.isArray(detail?.logistics?.travelerPickup?.locations)
              ? detail.logistics.travelerPickup.locations
              : [];
            for (const p of pickups.slice(0, 15)) {
              const ref = String(p?.location?.ref || "").trim();
              if (ref && ref.startsWith("LOC-")) locationRefsToResolve.add(ref);
            }

            // Also fetch pricing/option schedules for enriched products
            try {
              upstreamRequests += 1;
              const sched = await client.getProductSchedules(codeUpper);
              if (sched) {
                schedulesByCode.set(codeUpper, sched);
              }
            } catch {
              // Schedule fetch is optional if unavailable for a given product
            }
          }
        } catch {
          rejectedCount += 1;
          rejectionReasons.detail_fetch_unavailable =
            (rejectionReasons.detail_fetch_unavailable || 0) + 1;
        }
      }

      const resolvedLocationsByRef = new Map<string, any>();
      if (locationRefsToResolve.size > 0) {
        try {
          upstreamRequests += 1;
          const bulkLocs = (await client.getLocationsBulk(
            Array.from(locationRefsToResolve).slice(0, 100),
          )) as any;
          const locList = Array.isArray(bulkLocs?.locations) ? bulkLocs.locations : [];
          for (const loc of locList) {
            if (loc?.reference) {
              resolvedLocationsByRef.set(String(loc.reference), loc);
            }
          }
        } catch {
          // Non-fatal if bulk locations lookup fails for non-LOC refs
        }
      }

      const nowIso = new Date().toISOString();

      for (const item of rawProducts) {
        const productCode = String(item?.productCode || "").trim();
        const title = String(item?.title || "").trim();
        if (!productCode || !title) {
          rejectedCount += 1;
          rejectionReasons.missing_code_or_title =
            (rejectionReasons.missing_code_or_title || 0) + 1;
          continue;
        }

        const detail = detailsByCode.get(productCode.toUpperCase()) || null;
        const schedule = schedulesByCode.get(productCode.toUpperCase()) || null;
        if (detail?.status && String(detail.status).toUpperCase() === "INACTIVE") {
          rejectedCount += 1;
          rejectionReasons.inactive_status = (rejectionReasons.inactive_status || 0) + 1;
          continue;
        }

        const summary =
          typeof item?.description === "string" && item.description.trim()
            ? item.description.trim().slice(0, 420)
            : typeof detail?.description === "string" && detail.description.trim()
              ? detail.description.trim().slice(0, 420)
              : null;

        const durationParsed = parseDurationMinutesFromViator(
          item?.duration || detail?.itinerary?.duration || detail?.duration,
        );
        const cancellationParsed = parseCancellationFromViator(
          detail?.cancellationPolicy,
          item?.flags,
        );
        const pickupParsed = parsePickupAndLocationsFromViator(detail, resolvedLocationsByRef);
        const ageBands = parseAgeBandsFromViator(detail);

        const optionsAndSchedule = parseProductOptionsAndScheduleFromViator(
          detail,
          schedule,
          pickupParsed.hasHotelPickup,
          durationParsed.durationMinutes,
          title,
          summary,
        );

        const rawFromPrice =
          typeof item?.pricing?.summary?.fromPrice === "number"
            ? item.pricing.summary.fromPrice
            : null;
        const searchFromPriceCents =
          rawFromPrice !== null && Number.isFinite(rawFromPrice)
            ? Math.round(rawFromPrice * 100)
            : null;
        const fromPriceCents = searchFromPriceCents ?? optionsAndSchedule.scheduleFromPriceCents;

        const effectiveHasHotelPickup = optionsAndSchedule.effectiveHasHotelPickup;
        let effectivePickupType = pickupParsed.pickupType;
        let effectivePickupSummary = pickupParsed.pickupSummary;
        if (effectiveHasHotelPickup === true && effectivePickupType === "MEETING_POINT_ONLY") {
          effectivePickupType =
            optionsAndSchedule.lowestPriceIncludesPickup === true
              ? "HOTEL_PICKUP"
              : "HOTEL_OR_MEETING_POINT";
        }
        if (
          effectiveHasHotelPickup === true &&
          optionsAndSchedule.lowestPriceIncludesPickup === false
        ) {
          effectivePickupType = "HOTEL_OR_MEETING_POINT";
          const pickupOpt = optionsAndSchedule.productOptions
            .filter((o) => o.includesPickup === true && o.fromPriceCents !== null)
            .sort((a, b) => (a.fromPriceCents as number) - (b.fromPriceCents as number))[0];
          const pickupPriceNote = pickupOpt?.fromPriceCents
            ? `Hotel pickup requires selecting a pickup-inclusive option (from $${(pickupOpt.fromPriceCents / 100).toFixed(2)}); lowest-priced option is self-drive / meeting-point only.`
            : `Hotel pickup requires selecting a pickup-inclusive tour option; lowest-priced option does not include hotel transportation.`;
          effectivePickupSummary = effectivePickupSummary
            ? `${pickupPriceNote} ${effectivePickupSummary}`
            : pickupPriceNote;
        }

        const rawProductUrl =
          typeof item?.productUrl === "string" && item.productUrl.trim()
            ? item.productUrl.trim()
            : typeof detail?.productUrl === "string" && detail.productUrl.trim()
              ? detail.productUrl.trim()
              : `https://www.viator.com/tours/${encodeURIComponent(node.destinationSlug)}/${encodeURIComponent(title.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}/d${node.viatorDestinationId}-${encodeURIComponent(productCode)}`;

        const trackedViatorUrl = appendViatorAttribution(rawProductUrl, {
          preserveExistingCampaign: false,
          campaign: `dcc-${node.destinationSlug}-${productCode}`,
        });

        const compatibilityAliases = getCompatibilityAliasesForViatorCode(productCode);
        const category = inferCategoryFromTitleAndSummary(title, summary);
        const inclusions = extractStringDescriptions(detail?.inclusions);
        const exclusions = extractStringDescriptions(detail?.exclusions);
        const supplierName =
          typeof detail?.supplier?.name === "string" && detail.supplier.name.trim()
            ? detail.supplier.name.trim()
            : null;

        const channelOffers: ChannelOffer[] = [
          {
            channelId: "viator",
            provider: "viator",
            providerProductCode: productCode,
            capabilityTier: "live_check_referral",
            commissionAuthorized: true,
            fromPriceCents,
            priceBasis: optionsAndSchedule.priceBasis,
            currency: String(item?.pricing?.currency || "USD"),
            freeCancellation: cancellationParsed.freeCancellation,
            cancellationCutoffHours: cancellationParsed.cancellationCutoffHours,
            cancellationSummary: cancellationParsed.cancellationSummary,
            inclusions,
            exclusions,
            bookingUrl: trackedViatorUrl,
            defaultCampaign: `dcc-${node.destinationSlug}-${productCode}`,
          },
        ];

        const siteMappings = DCC_VIATOR_PRODUCT_MAPPINGS.filter(
          (m) => m.viatorCode.toUpperCase() === productCode.toUpperCase(),
        );
        for (const sm of siteMappings) {
          channelOffers.push({
            channelId: sm.siteId as ChannelOffer["channelId"],
            provider: "viator",
            providerProductCode: productCode,
            capabilityTier: "live_check_referral",
            commissionAuthorized: true,
            fromPriceCents,
            priceBasis: optionsAndSchedule.priceBasis,
            currency: "USD",
            freeCancellation: cancellationParsed.freeCancellation,
            cancellationCutoffHours: cancellationParsed.cancellationCutoffHours,
            cancellationSummary: cancellationParsed.cancellationSummary,
            inclusions,
            exclusions,
            bookingUrl: appendViatorAttribution(rawProductUrl, {
              preserveExistingCampaign: false,
              campaign: sm.defaultCampaign,
            }),
            defaultCampaign: sm.defaultCampaign,
          });
        }

        const textLower = `${title} ${summary || ""}`.toLowerCase();
        const isHeli = textLower.includes("helicopter") || textLower.includes("flightseeing");

        const record: DurableTourRecord = {
          tourId: `dcc:tour:viator:${productCode}`,
          compatibilityAliases,
          destinationSlug: node.destinationSlug,
          portSlug: node.portSlug,
          earthosDestinationNodeId: node.earthosDestinationNodeId,
          timeZone: node.timeZone,
          title,
          summary,
          category,
          tags: Array.isArray(item?.tags) ? item.tags.map((t: any) => String(t)) : [],
          primaryProvider: "viator",
          providerProductCode: productCode,
          operatorName: supplierName,
          operatorCode: null,
          capabilityTier: "live_check_referral",
          commissionAuthorized: true,
          durationMinutes: durationParsed.durationMinutes,
          durationRawText: durationParsed.durationRawText,
          fromPriceCents,
          priceBasis: optionsAndSchedule.priceBasis,
          currency: String(item?.pricing?.currency || "USD"),
          freeCancellation: cancellationParsed.freeCancellation,
          cancellationPolicyType: cancellationParsed.cancellationPolicyType,
          cancellationCutoffHours: cancellationParsed.cancellationCutoffHours,
          cancellationSummary: cancellationParsed.cancellationSummary,
          hasHotelPickup: effectiveHasHotelPickup,
          lowestPriceIncludesPickup: optionsAndSchedule.lowestPriceIncludesPickup,
          pickupType: effectivePickupType,
          pickupSummary: effectivePickupSummary,
          meetingPointName: pickupParsed.meetingPointName,
          meetingPointAddress: pickupParsed.meetingPointAddress,
          meetingPointLat: pickupParsed.meetingPointLat,
          meetingPointLng: pickupParsed.meetingPointLng,
          locationPrecision: pickupParsed.locationPrecision,
          pickupLocations: pickupParsed.pickupLocations,
          ageBands,
          constraints: {
            maxPassengerWeightLbs: isHeli ? 250 : null,
            wheelchairAccessible: null,
            cruiseBufferBeforeMinutes: 60,
            cruiseBufferAfterMinutes: 60,
            weatherDependent: isHeli || category === "Swamp & Bayou",
          },
          channelOffers,
          productOptions: optionsAndSchedule.productOptions,
          serviceDetails: {},
          inclusions,
          exclusions,
          primaryImageUrl: extractPrimaryImageUrl(item?.images || detail?.images),
          ratingAverage:
            typeof item?.reviews?.combinedAverageRating === "number"
              ? Math.round(item.reviews.combinedAverageRating * 100) / 100
              : null,
          reviewCount:
            typeof item?.reviews?.totalReviews === "number" ? item.reviews.totalReviews : null,
          bookingUrl: trackedViatorUrl,
          provenance: {
            sourceSystem: "viator_partner_api_v2",
            sourceEndpoint: detail
              ? schedule
                ? "/products/search+/products/{code}+/availability/schedules/{code}"
                : "/products/search+/products/{code}"
              : "/products/search",
            fetchedAt: nowIso,
            contentSha256: sha256Hex({
              productCode,
              title,
              fromPriceCents,
              lowestPriceIncludesPickup: optionsAndSchedule.lowestPriceIncludesPickup,
              optionsCount: optionsAndSchedule.productOptions.length,
              durationMinutes: durationParsed.durationMinutes,
              freeCancellation: cancellationParsed.freeCancellation,
            }),
            rawFieldsVerified: {
              durationKnown: durationParsed.durationMinutes !== null,
              cancellationKnown: cancellationParsed.freeCancellation !== null,
              pickupKnown: pickupParsed.hasHotelPickup !== null,
              meetingCoordinatesKnown:
                pickupParsed.meetingPointLat !== null && pickupParsed.meetingPointLng !== null,
              ageBandsKnown: ageBands.length > 0,
            },
          },
          quarantined: false,
          quarantineReason: null,
          active: true,
          lastVerifiedAt: nowIso,
          updatedAt: nowIso,
          createdAt: nowIso,
        };

        allUpsertedRecords.push(record);
        importedCount += 1;
      }

      const isCompleteCoverage =
        providerTotalCount > 0 && currentStart > providerTotalCount && initialStartOffset === 1;
      const nextStartOffset =
        providerTotalCount > 0 && currentStart <= providerTotalCount ? currentStart : 1;

      const syncRun: CatalogSyncRunRecord = {
        runId,
        provider: "viator",
        destinationSlug: destSlug,
        status: "completed",
        cursorValue: `offset:${currentStart}:total:${providerTotalCount}`,
        importedCount,
        updatedCount: importedCount,
        rejectedCount,
        upstreamRequestCount: upstreamRequests,
        rejectionReasons,
        metadata: {
          viatorDestinationId: node.viatorDestinationId,
          startOffset: initialStartOffset,
          nextStartOffset,
          pagesFetched,
          pageSize,
          providerTotalCount,
          coverageStatus: isCompleteCoverage ? "complete" : "sampled",
          enrichedDetailCount: detailsByCode.size,
          enrichedSchedulesCount: schedulesByCode.size,
          resolvedLocationsCount: resolvedLocationsByRef.size,
        },
        startedAt,
        completedAt: new Date().toISOString(),
      };
      allSyncRuns.push(syncRun);
      await recordCatalogSyncRun(syncRun);
    } catch (err) {
      const syncRun: CatalogSyncRunRecord = {
        runId,
        provider: "viator",
        destinationSlug: destSlug,
        status: "failed",
        cursorValue: null,
        importedCount,
        updatedCount: 0,
        rejectedCount,
        upstreamRequestCount: upstreamRequests,
        rejectionReasons: {
          ...rejectionReasons,
          api_error: 1,
        },
        metadata: {
          error: err instanceof Error ? err.message : String(err),
        },
        startedAt,
        completedAt: new Date().toISOString(),
      };
      allSyncRuns.push(syncRun);
      await recordCatalogSyncRun(syncRun);
    }
  }

  // 2. Authorized FareHarbor Southeast Alaska Operators (live_check_direct)
  const fhConfigs: Array<{
    shortname: string;
    operatorName: string;
    destinationSlug: string;
    meetingPointName: string;
    meetingPointAddress: string;
    meetingPointLat: number;
    meetingPointLng: number;
  }> = [
    {
      shortname: "temscoair-juneau",
      operatorName: "TEMSCO Helicopters Juneau",
      destinationSlug: "juneau",
      meetingPointName: "TEMSCO Helicopters Juneau Airport Terminal",
      meetingPointAddress: "1650 Maplesden Way, Juneau, AK 99801",
      meetingPointLat: 58.3547,
      meetingPointLng: -134.5762,
    },
    {
      shortname: "coastalhelicopters",
      operatorName: "Coastal Helicopters",
      destinationSlug: "juneau",
      meetingPointName: "Coastal Helicopters Juneau Flight Base",
      meetingPointAddress: "8995 Yandukin Dr, Juneau, AK 99801",
      meetingPointLat: 58.3585,
      meetingPointLng: -134.5681,
    },
    {
      shortname: "northstartrekking",
      operatorName: "NorthStar Trekking",
      destinationSlug: "juneau",
      meetingPointName: "NorthStar Trekking Heliport Base",
      meetingPointAddress: "8991 Yandukin Dr, Juneau, AK 99801",
      meetingPointLat: 58.3581,
      meetingPointLng: -134.5692,
    },
    {
      shortname: "temscoair-skagway",
      operatorName: "TEMSCO Helicopters Skagway",
      destinationSlug: "skagway",
      meetingPointName: "Skagway Waterfront Heliport",
      meetingPointAddress: "250 Congress Way, Skagway, AK 99840",
      meetingPointLat: 59.4491,
      meetingPointLng: -135.3218,
    },
  ];

  for (const fh of fhConfigs) {
    if (!targetSlugs.includes(fh.destinationSlug)) continue;
    const node = EARTHOS_DESTINATION_NODES[fh.destinationSlug];
    if (!node) continue;
    const runId = `sync:fareharbor:${fh.shortname}:${Date.now()}`;
    const startedAt = new Date().toISOString();
    let importedCount = 0;

    try {
      const items = await fetchCompaniesItems(fh.shortname);
      const nowIso = new Date().toISOString();

      for (const item of items) {
        const title = String(item.name || "").trim();
        if (!title) continue;
        const textLower = `${title} ${item.headline || ""}`.toLowerCase();
        const hoursMatch = textLower.match(/(\d+(?:\.\d+)?)\s*(?:hour|hr)/i);
        const durationMinutes = hoursMatch ? Math.round(Number(hoursMatch[1]) * 60) : null;
        const durationRawText = hoursMatch ? `${hoursMatch[1]} hours` : null;

        const directUrl = `https://fareharbor.com/embeds/book/${encodeURIComponent(fh.shortname)}/items/${item.pk}/?asn=fhdn`;
        const record: DurableTourRecord = {
          tourId: `dcc:tour:fh:${fh.shortname}:${item.pk}`,
          compatibilityAliases: [`fh-${fh.shortname}-${item.pk}`, String(item.pk)],
          destinationSlug: node.destinationSlug,
          portSlug: node.portSlug,
          earthosDestinationNodeId: node.earthosDestinationNodeId,
          timeZone: node.timeZone,
          title: `${fh.operatorName}: ${title}`,
          summary:
            (item.headline && item.headline.trim()) ||
            (item.description && item.description.trim().slice(0, 320)) ||
            `Authorized FareHarbor direct excursion operated by ${fh.operatorName}.`,
          category: "Helicopter & Flightseeing",
          tags: ["fareharbor-direct", "helicopter", "glacier", fh.shortname],
          primaryProvider: "fareharbor",
          providerProductCode: `${fh.shortname}:${item.pk}`,
          operatorName: fh.operatorName,
          operatorCode: fh.shortname,
          capabilityTier: "live_check_direct",
          commissionAuthorized: true,
          durationMinutes,
          durationRawText,
          fromPriceCents: null,
          priceBasis: "per_person",
          currency: "USD",
          freeCancellation: null,
          cancellationPolicyType: "CUSTOM",
          cancellationCutoffHours: item.cancellation_policy_hours ?? null,
          cancellationSummary:
            typeof item.cancellation_policy_hours === "number"
              ? `${item.cancellation_policy_hours}-hour operator cancellation cutoff.`
              : null,
          hasHotelPickup: true,
          lowestPriceIncludesPickup: true,
          pickupType: "CRUISE_PIER_PICKUP",
          pickupSummary:
            "Round-trip shuttle transfer from downtown cruise ship docks to the heliport included.",
          meetingPointName: fh.meetingPointName,
          meetingPointAddress: fh.meetingPointAddress,
          meetingPointLat: fh.meetingPointLat,
          meetingPointLng: fh.meetingPointLng,
          locationPrecision: "exact",
          pickupLocations: [
            {
              name: node.cruisePierName || `${node.displayName} Cruise Dock`,
              address: node.displayName,
              lat: node.cruisePierLat,
              lng: node.cruisePierLng,
              precision: "exact",
              pickupType: "CRUISE_PORT",
            },
          ],
          ageBands: [
            { ageBand: "ADULT", startAge: 12, endAge: 99 },
            { ageBand: "CHILD", startAge: 2, endAge: 11 },
          ],
          constraints: {
            maxPassengerWeightLbs: 250,
            wheelchairAccessible: false,
            cruiseBufferBeforeMinutes: 60,
            cruiseBufferAfterMinutes: 60,
            weatherDependent: true,
            requiresClosedToeShoes: true,
          },
          channelOffers: [
            {
              channelId: "fareharbor",
              provider: "fareharbor",
              providerProductCode: `${fh.shortname}:${item.pk}`,
              capabilityTier: "live_check_direct",
              commissionAuthorized: true,
              fromPriceCents: null,
              priceBasis: "per_person",
              currency: "USD",
              freeCancellation: null,
              cancellationCutoffHours: item.cancellation_policy_hours ?? null,
              cancellationSummary: null,
              inclusions: [
                "Round-trip dock shuttle transfer",
                "Glacier overflight & landing gear",
                "FAA-certified glacier pilot narration",
              ],
              exclusions: ["Gratuities", "Weight surcharge if over 250 lbs"],
              bookingUrl: directUrl,
            },
          ],
          productOptions: [],
          serviceDetails: {},
          inclusions: [
            "Round-trip dock shuttle transfer",
            "Glacier overflight & landing gear",
            "FAA-certified glacier pilot narration",
          ],
          exclusions: ["Gratuities", "Weight surcharge if over 250 lbs"],
          primaryImageUrl: item.image_cdn_url || null,
          ratingAverage: null,
          reviewCount: null,
          bookingUrl: directUrl,
          provenance: {
            sourceSystem: "fareharbor_external_api_v1",
            sourceEndpoint: `/companies/${fh.shortname}/items/`,
            fetchedAt: nowIso,
            contentSha256: sha256Hex({ shortname: fh.shortname, pk: item.pk, name: item.name }),
            rawFieldsVerified: {
              durationKnown: durationMinutes !== null,
              cancellationKnown: typeof item.cancellation_policy_hours === "number",
              pickupKnown: true,
              meetingCoordinatesKnown: true,
              ageBandsKnown: true,
            },
          },
          quarantined: false,
          quarantineReason: null,
          active: true,
          lastVerifiedAt: nowIso,
          updatedAt: nowIso,
          createdAt: nowIso,
        };

        allUpsertedRecords.push(record);
        importedCount += 1;
      }

      const run: CatalogSyncRunRecord = {
        runId,
        provider: "fareharbor",
        destinationSlug: fh.destinationSlug,
        status: "completed",
        cursorValue: fh.shortname,
        importedCount,
        updatedCount: importedCount,
        rejectedCount: 0,
        upstreamRequestCount: 1,
        rejectionReasons: {},
        metadata: { shortname: fh.shortname },
        startedAt,
        completedAt: new Date().toISOString(),
      };
      allSyncRuns.push(run);
      await recordCatalogSyncRun(run);
    } catch (err) {
      const run: CatalogSyncRunRecord = {
        runId,
        provider: "fareharbor",
        destinationSlug: fh.destinationSlug,
        status: "failed",
        cursorValue: fh.shortname,
        importedCount: 0,
        updatedCount: 0,
        rejectedCount: 0,
        upstreamRequestCount: 1,
        rejectionReasons: { api_error: 1 },
        metadata: { error: err instanceof Error ? err.message : String(err) },
        startedAt,
        completedAt: new Date().toISOString(),
      };
      allSyncRuns.push(run);
      await recordCatalogSyncRun(run);
    }
  }

  // 3. Authoritative GoSno & PARR Published Offers (replacing deprecated hardcoded records)
  const authoritativePartnerRecords = buildAuthoritativeGoSnoAndParrRecords(targetSlugs);
  allUpsertedRecords.push(...authoritativePartnerRecords);

  const opSyncRun: CatalogSyncRunRecord = {
    runId: `sync:authoritative_corridors:denver-colorado:${Date.now()}`,
    provider: "gosno+parr",
    destinationSlug: "denver-colorado",
    status: "completed",
    cursorValue: "v2-authoritative-gosno-parr",
    importedCount: authoritativePartnerRecords.length,
    updatedCount: authoritativePartnerRecords.length,
    rejectedCount: 0,
    upstreamRequestCount: 0,
    rejectionReasons: {},
    metadata: {
      note: "Authoritative GoSno route-feed snapshot offers and PARR published private vehicle charters (flat_rate_per_vehicle). Acceptance fixtures and unsupported operator listings are quarantined.",
    },
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };
  allSyncRuns.push(opSyncRun);
  await recordCatalogSyncRun(opSyncRun);

  const upsertResult = await upsertDurableTourRecords(allUpsertedRecords);
  return {
    upsertedCount: upsertResult.upsertedCount,
    persistedToPostgres: upsertResult.persistedToPostgres,
    syncRuns: allSyncRuns,
  };
}

export type IncrementalRefreshOptions = {
  cursor?: string;
  count?: number;
};

/**
 * Incremental refresh job using Viator /products/modified-since cursor pagination.
 * Updates any existing catalog records whose productCode appears in the modified-since feed.
 */
export async function runIncrementalViatorCatalogRefresh(options: IncrementalRefreshOptions = {}) {
  const client = getViatorClient();
  const snapshot = readLocalCatalogSnapshot();
  const existingByProviderCode = new Map<string, DurableTourRecord>();
  for (const rec of snapshot.records) {
    if (rec.primaryProvider === "viator") {
      existingByProviderCode.set(rec.providerProductCode.toUpperCase(), rec);
    }
  }

  const runId = `sync:viator:incremental:${Date.now()}`;
  const startedAt = new Date().toISOString();
  let upstreamRequests = 0;
  let updatedCount = 0;
  let rejectedCount = 0;

  try {
    upstreamRequests += 1;
    const modRes = (await client.getProductsModifiedSince(
      options.cursor,
      Math.min(Math.max(options.count ?? 50, 1), 500),
    )) as any;

    const nextCursor = typeof modRes?.nextCursor === "string" ? modRes.nextCursor : null;
    const modProducts: any[] = Array.isArray(modRes?.products) ? modRes.products : [];
    const updatedRecords: DurableTourRecord[] = [];
    const nowIso = new Date().toISOString();

    for (const item of modProducts) {
      const code = String(item?.productCode || "").trim().toUpperCase();
      if (!code) continue;
      const existing = existingByProviderCode.get(code);
      if (!existing) continue;

      if (String(item?.status || "").toUpperCase() === "INACTIVE") {
        updatedRecords.push({
          ...existing,
          active: false,
          updatedAt: nowIso,
          lastVerifiedAt: nowIso,
        });
        updatedCount += 1;
        continue;
      }

      upstreamRequests += 1;
      const sched = await client.getProductSchedules(code).catch(() => null);
      const durationParsed = parseDurationMinutesFromViator(
        item?.itinerary?.duration || item?.duration,
      );
      const cancellationParsed = parseCancellationFromViator(item?.cancellationPolicy, []);
      const pickupParsed = parsePickupAndLocationsFromViator(item, new Map());
      const optionsAndSchedule = parseProductOptionsAndScheduleFromViator(
        item,
        sched,
        pickupParsed.hasHotelPickup ?? existing.hasHotelPickup,
        durationParsed.durationMinutes ?? existing.durationMinutes,
        String(item?.title || existing.title),
        typeof item?.description === "string" ? item.description : existing.summary,
      );

      updatedRecords.push({
        ...existing,
        title: String(item?.title || existing.title),
        durationMinutes: durationParsed.durationMinutes ?? existing.durationMinutes,
        durationRawText: durationParsed.durationRawText ?? existing.durationRawText,
        fromPriceCents: optionsAndSchedule.scheduleFromPriceCents ?? existing.fromPriceCents,
        priceBasis: optionsAndSchedule.priceBasis,
        freeCancellation: cancellationParsed.freeCancellation ?? existing.freeCancellation,
        cancellationPolicyType:
          cancellationParsed.cancellationPolicyType ?? existing.cancellationPolicyType,
        cancellationCutoffHours:
          cancellationParsed.cancellationCutoffHours ?? existing.cancellationCutoffHours,
        cancellationSummary: cancellationParsed.cancellationSummary ?? existing.cancellationSummary,
        hasHotelPickup: pickupParsed.hasHotelPickup ?? existing.hasHotelPickup,
        lowestPriceIncludesPickup:
          optionsAndSchedule.lowestPriceIncludesPickup ?? existing.lowestPriceIncludesPickup,
        productOptions:
          optionsAndSchedule.productOptions.length > 0
            ? optionsAndSchedule.productOptions
            : existing.productOptions,
        provenance: {
          ...existing.provenance,
          sourceEndpoint: "/products/modified-since",
          fetchedAt: nowIso,
          modifiedSinceCursor: nextCursor,
        },
        lastVerifiedAt: nowIso,
        updatedAt: nowIso,
      });
      updatedCount += 1;
    }

    if (updatedRecords.length > 0) {
      await upsertDurableTourRecords(updatedRecords);
    }

    const syncRun: CatalogSyncRunRecord = {
      runId,
      provider: "viator_incremental",
      destinationSlug: "multi-destination",
      status: "completed",
      cursorValue: nextCursor,
      importedCount: 0,
      updatedCount,
      rejectedCount,
      upstreamRequestCount: upstreamRequests,
      rejectionReasons: {},
      metadata: {
        inputCursor: options.cursor || null,
        nextCursor,
        modifiedProductsScanned: modProducts.length,
        catalogMatchesUpdated: updatedCount,
      },
      startedAt,
      completedAt: new Date().toISOString(),
    };
    await recordCatalogSyncRun(syncRun);
    return syncRun;
  } catch (err) {
    const syncRun: CatalogSyncRunRecord = {
      runId,
      provider: "viator_incremental",
      destinationSlug: "multi-destination",
      status: "failed",
      cursorValue: options.cursor || null,
      importedCount: 0,
      updatedCount,
      rejectedCount,
      upstreamRequestCount: upstreamRequests,
      rejectionReasons: { api_error: 1 },
      metadata: {
        error: err instanceof Error ? err.message : String(err),
      },
      startedAt,
      completedAt: new Date().toISOString(),
    };
    await recordCatalogSyncRun(syncRun);
    return syncRun;
  }
}

export function buildAuthoritativeGoSnoAndParrRecords(targetSlugs: string[]): DurableTourRecord[] {
  const nowIso = new Date().toISOString();
  const out: DurableTourRecord[] = [];
  if (!targetSlugs.includes("denver-colorado")) {
    return out;
  }

  const den = EARTHOS_DESTINATION_NODES["denver-colorado"];
  const gosnoState = getActiveGoSnoRouteFeedSnapshotState();
  const feed = gosnoState.snapshot.feed;
  const cancellationPolicy = (feed as any).governance?.cancellation_policy || null;
  const cutoffHours = 48;
  const cancellationSummary =
    "100% refund 48+ hours before pickup; 50% refund 24–48 hours before pickup; 0% refund under 24 hours or no-show (https://gosno.co/cancellation-policy).";

  const roundTripsByOutboundId = new Map(
    (feed.round_trips || []).map((rt) => [rt.outbound_route_id, rt]),
  );

  // 1. Authoritative GoSno published offers from data/network/audit/satellite/gosno/route-feed.snapshot.json
  for (const route of feed.routes) {
    if (
      route.direction !== "OUTBOUND" ||
      route.origin !== "DEN" ||
      !route.booking_eligibility?.published_booking_eligible
    ) {
      continue;
    }

    const roundTrip =
      roundTripsByOutboundId.get(route.offer_id) ||
      roundTripsByOutboundId.get(route.record_id) ||
      (feed.round_trips || []).find(
        (rt) =>
          rt.airport === "DEN" &&
          rt.resort === route.destination &&
          rt.vehicle_class === route.vehicle_class,
      ) ||
      null;

    const oneWayCents = route.pricing.amount_cents;
    const roundTripCents = roundTrip ? roundTrip.pricing.total_amount_cents : null;
    const vehicleShortLabel = route.vehicle_class === "suv" ? "Private SUV" : "Private Passenger Van";
    const resortSlug = route.destination
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const aliases = [
      route.offer_id,
      route.offer_id.toLowerCase(),
      route.record_id,
      `gosno-${resortSlug}-${route.vehicle_class}`,
    ];
    if (route.offer_id === "DEN-WINTER-PARK-SUV") {
      aliases.push("gosno-winter-park-shuttle", "winter-park-ski-shuttle");
    }
    if (roundTrip) {
      aliases.push(roundTrip.offer_id, roundTrip.offer_id.toLowerCase(), roundTrip.record_id);
    }

    const bookingUrl = `/go/dcc-to-gosno?resort=${encodeURIComponent(resortSlug)}&vehicle=${encodeURIComponent(route.vehicle_class)}&route=${encodeURIComponent(route.offer_id)}`;
    const pickupText =
      route.pickup_instructions ||
      "DEN Level 5 Curbside (Island 2, Doors 506–510 West or 507–511 East)";
    const gearText =
      route.gear_policy ||
      "Skis, snowboards, boots, and standard luggage are included at no extra charge when they fit safely inside the reserved private vehicle.";

    const productOptions: TourProductOptionRecord[] = [
      {
        optionCode: route.offer_id,
        title: `One-Way ${vehicleShortLabel} (DEN to ${route.destination}, up to ${route.seating_limit} guests)`,
        description: `All-inclusive flat rate per vehicle ($${route.pricing.amount_usd}). ${pickupText}`,
        includesPickup: true,
        durationMinutes: null,
        fromPriceCents: oneWayCents,
        priceBasis: "flat_rate_per_vehicle",
        scheduledStartTimes: [],
      },
    ];

    if (roundTrip && roundTripCents !== null) {
      productOptions.push({
        optionCode: roundTrip.offer_id,
        title: `Round-Trip ${vehicleShortLabel} (DEN <-> ${route.destination}, up to ${route.seating_limit} guests)`,
        description: `All-inclusive round-trip flat rate per vehicle ($${roundTrip.pricing.total_amount_usd}). ${roundTrip.outbound_pickup_instructions || pickupText}`,
        includesPickup: true,
        durationMinutes: null,
        fromPriceCents: roundTripCents,
        priceBasis: "flat_rate_per_vehicle",
        scheduledStartTimes: [],
      });
    }

    const inclusions = [
      ...(route.pricing.inclusions || [
        `Private ${route.vehicle_class.toUpperCase()} charter for 1-${route.seating_limit} passengers (flat rate per vehicle, not per seat)`,
      ]),
      gearText,
      pickupText,
    ];
    const exclusions = ["Driver gratuity (discretionary)"];

    out.push({
      tourId: `dcc:tour:gosno:${route.offer_id.toLowerCase()}`,
      compatibilityAliases: aliases,
      destinationSlug: "denver-colorado",
      portSlug: null,
      earthosDestinationNodeId: den.earthosDestinationNodeId,
      timeZone: den.timeZone,
      title: `GoSno ${vehicleShortLabel}: DEN to ${route.destination} ($${route.pricing.amount_usd} Flat/Vehicle, Up to ${route.seating_limit} Guests)`,
      summary: `Authoritative GoSno private ${route.vehicle_label} charter from Denver International Airport (DEN) to ${route.destination}. Flat rate $${route.pricing.amount_usd} per vehicle (1–${route.seating_limit} guests)${roundTrip ? ` or $${roundTrip.pricing.total_amount_usd} round-trip` : ""}. ${pickupText}`,
      category: "Mountain & Venue Transfers",
      tags: [
        "gosno",
        resortSlug,
        route.route_id.toLowerCase(),
        route.vehicle_class,
        "flat-rate-per-vehicle",
        "private-mountain-transfer",
      ],
      primaryProvider: "gosno",
      providerProductCode: route.offer_id,
      operatorName: "GoSno Mountain Transportation",
      operatorCode: "gosno",
      capabilityTier: "attributable_referral",
      commissionAuthorized: true,
      durationMinutes: null,
      durationRawText: null,
      fromPriceCents: oneWayCents,
      priceBasis: "flat_rate_per_vehicle",
      currency: route.pricing.currency,
      freeCancellation: true,
      cancellationPolicyType: "CUSTOM",
      cancellationCutoffHours: cutoffHours,
      cancellationSummary,
      hasHotelPickup: true,
      lowestPriceIncludesPickup: true,
      pickupType: "HOTEL_OR_MEETING_POINT",
      pickupSummary: pickupText,
      meetingPointName: "Denver International Airport (DEN) Jeppesen Terminal",
      meetingPointAddress: "8500 Pena Blvd, Denver, CO 80249",
      meetingPointLat: 39.8561,
      meetingPointLng: -104.6737,
      locationPrecision: "exact",
      pickupLocations: [
        {
          name: "Denver International Airport (DEN) Jeppesen Terminal",
          address: "8500 Pena Blvd, Denver, CO 80249",
          lat: 39.8561,
          lng: -104.6737,
          precision: "exact",
          pickupType: "AIRPORT",
        },
      ],
      ageBands: [
        { ageBand: "ADULT", startAge: 13, endAge: 99, maxTravelersPerBooking: route.seating_limit },
        { ageBand: "CHILD", startAge: 0, endAge: 12, maxTravelersPerBooking: route.seating_limit },
      ],
      constraints: {
        maxPassengerWeightLbs: null,
        maxPassengers: route.seating_limit,
        wheelchairAccessible: null,
        minAgeYears: 0,
        physicalDifficulty: "EASY",
        weatherDependent: true,
      },
      channelOffers: [
        {
          channelId: "gosno",
          provider: "gosno",
          providerProductCode: route.offer_id,
          capabilityTier: "attributable_referral",
          commissionAuthorized: true,
          fromPriceCents: oneWayCents,
          priceBasis: "flat_rate_per_vehicle",
          currency: route.pricing.currency,
          freeCancellation: true,
          cancellationCutoffHours: cutoffHours,
          cancellationSummary,
          inclusions,
          exclusions,
          bookingUrl,
        },
      ],
      productOptions,
      serviceDetails: {
        recordId: route.record_id,
        offerId: route.offer_id,
        routeId: route.route_id,
        resortSlug,
        destination: route.destination,
        vehicleClass: route.vehicle_class,
        vehicleLabel: route.vehicle_label,
        seatingLimit: route.seating_limit,
        pricingModel: route.pricing.pricing_model,
        oneWayPriceUsd: route.pricing.amount_usd,
        roundTripOfferId: roundTrip?.offer_id || null,
        roundTripPriceUsd: roundTrip?.pricing.total_amount_usd || null,
        canonicalBookingUrl: route.canonical_booking_url,
        quoteUrl: route.quote_url,
        rezdyProductCode: route.booking_eligibility.rezdy_product_code,
        pickupInstructions: pickupText,
        gearPolicy: gearText,
        cancellationPolicy,
      },
      inclusions,
      exclusions,
      primaryImageUrl: null,
      ratingAverage: null,
      reviewCount: null,
      bookingUrl,
      provenance: {
        sourceSystem: "gosno_route_feed_snapshot_v1",
        sourceEndpoint: gosnoState.snapshot.sourceUrl,
        fetchedAt: gosnoState.snapshot.fetchedAt,
        contentSha256: sha256Hex(route),
        rawFieldsVerified: {
          durationKnown: false,
          cancellationKnown: true,
          pickupKnown: true,
          meetingCoordinatesKnown: true,
          ageBandsKnown: true,
        },
      },
      quarantined: false,
      quarantineReason: null,
      active: true,
      lastVerifiedAt: gosnoState.snapshot.fetchedAt,
      updatedAt: nowIso,
      createdAt: nowIso,
    });
  }

  // 2. Authoritative PARR published offers from RED_ROCKS_CONCERT_CANDIDATE_OPTIONS & DCC_SITE_TRUTH
  const parrSiteTruth = DCC_SITE_TRUTH.find((r) => r.id === "party-at-red-rocks");
  const parrClaims = parrSiteTruth?.public_claims || {};
  const parrCandidates = RED_ROCKS_CONCERT_CANDIDATE_OPTIONS.filter(
    (c) => c.optionId === "rr-parr-private-suburban-6pax" || c.optionId === "rr-parr-private-van-10pax",
  );

  for (const cand of parrCandidates) {
    const isSuburban = cand.optionId === "rr-parr-private-suburban-6pax";
    const priceUsd = Number(
      isSuburban
        ? (parrClaims.suburban_usd ?? cand.indicativePriceUsd.max)
        : (parrClaims.van_usd ?? cand.indicativePriceUsd.max),
    );
    const priceCents = priceUsd * 100;
    const seatingLimit = cand.groupCapacityRange.max;
    const vehicleClass = isSuburban ? "suburban" : "sprinter_van";
    const bookingUrl =
      cand.bookingDestinations[0]?.url ||
      "https://www.partyatredrocks.com/book/red-rocks-amphitheatre/private";

    const aliases = isSuburban
      ? [
          "rr-parr-private-suburban-6pax",
          "parr-private-suburban-6pax",
          "parr-suburban",
          "parr-red-rocks-shuttle",
          "red-rocks-concert-shuttle",
        ]
      : ["rr-parr-private-van-10pax", "parr-private-van-10pax", "parr-van"];

    const inclusions = [
      ...cand.tradeoffs.strengths,
      `Flat rate $${priceUsd} per vehicle round-trip for 1-${seatingLimit} passengers (shared seat shuttle service is not offered)`,
    ];
    const exclusions = ["Concert admission ticket", "Driver gratuity"];

    out.push({
      tourId: `dcc:tour:parr:${cand.optionId}`,
      compatibilityAliases: aliases,
      destinationSlug: "denver-colorado",
      portSlug: null,
      earthosDestinationNodeId: den.earthosDestinationNodeId,
      timeZone: den.timeZone,
      title: cand.title,
      summary: `${cand.viewingSpaceDescription} ${cand.indicativePriceUsd.basisLabel}.`,
      category: "Mountain & Venue Transfers",
      tags: [
        "parr",
        "red-rocks",
        "private-charter",
        "flat-rate-per-vehicle",
        vehicleClass,
      ],
      primaryProvider: "parr",
      providerProductCode: cand.optionId,
      operatorName: "Party at Red Rocks",
      operatorCode: "partyatredrocks",
      capabilityTier: "attributable_referral",
      commissionAuthorized: true,
      durationMinutes: null,
      durationRawText:
        "Round-trip concert charter (departs on your group's schedule; dedicated driver waits on-site through the final encore)",
      fromPriceCents: priceCents,
      priceBasis: "flat_rate_per_vehicle",
      currency: "USD",
      freeCancellation: null,
      cancellationPolicyType: "CUSTOM",
      cancellationCutoffHours: null,
      cancellationSummary: cand.cancellationTerms,
      hasHotelPickup: true,
      lowestPriceIncludesPickup: true,
      pickupType: "HOTEL_PICKUP",
      pickupSummary:
        "Custom door-to-door pickup for your group across Denver / metro area with Red Rocks Top Circle drop-off and dedicated waiting driver.",
      meetingPointName: "Custom Door-to-Door Group Pickup (Denver Metro to Red Rocks Top Circle)",
      meetingPointAddress: null,
      meetingPointLat: null,
      meetingPointLng: null,
      locationPrecision: "unknown",
      pickupLocations: [],
      ageBands: [
        { ageBand: "ADULT", startAge: 18, endAge: 99, maxTravelersPerBooking: seatingLimit },
        { ageBand: "YOUTH", startAge: 0, endAge: 17, maxTravelersPerBooking: seatingLimit },
      ],
      constraints: {
        maxPassengerWeightLbs: null,
        maxPassengers: seatingLimit,
        wheelchairAccessible: cand.accessibilityProfile.stepFreeWheelchairSupported,
        minAgeYears: cand.minimumAgeYears,
        physicalDifficulty: "EASY",
        weatherDependent: false,
      },
      channelOffers: [
        {
          channelId: "partyatredrocks",
          provider: "parr",
          providerProductCode: cand.optionId,
          capabilityTier: "attributable_referral",
          commissionAuthorized: true,
          fromPriceCents: priceCents,
          priceBasis: "flat_rate_per_vehicle",
          currency: "USD",
          freeCancellation: null,
          cancellationCutoffHours: null,
          cancellationSummary: cand.cancellationTerms,
          inclusions,
          exclusions,
          bookingUrl,
        },
      ],
      productOptions: [
        {
          optionCode: cand.optionId,
          title: cand.shortLabel,
          description: cand.viewingSpaceDescription,
          includesPickup: true,
          durationMinutes: null,
          fromPriceCents: priceCents,
          priceBasis: "flat_rate_per_vehicle",
          scheduledStartTimes: [],
        },
      ],
      serviceDetails: {
        optionId: cand.optionId,
        vehicleClass,
        vesselOrVehicleType: cand.vesselOrVehicleType,
        seatingLimit,
        pricingModel: "flat_rate_per_vehicle",
        flatRateUsd: priceUsd,
        basisLabel: cand.indicativePriceUsd.basisLabel,
        sharedSeatService: Boolean(parrClaims.shared_seat_service ?? false),
        pickupModel: "Custom door-to-door pickup for your group",
        dropOffZone: "Red Rocks Top Circle Drop-Off",
        returnGuarantee: "Dedicated driver waits on-site through the final encore",
        tailgateGearPolicy:
          "Space in the vehicle for drinks and pre-show gear; cooler storage during the concert",
        strengths: cand.tradeoffs.strengths,
        limitations: cand.tradeoffs.limitations,
      },
      inclusions,
      exclusions,
      primaryImageUrl: null,
      ratingAverage: null,
      reviewCount: null,
      bookingUrl,
      provenance: {
        sourceSystem: "dcc_site_truth_parr_v1",
        sourceEndpoint: bookingUrl,
        fetchedAt: nowIso,
        contentSha256: sha256Hex({ id: cand.optionId, priceUsd, seatingLimit }),
        rawFieldsVerified: {
          durationKnown: false,
          cancellationKnown: false,
          pickupKnown: true,
          meetingCoordinatesKnown: false,
          ageBandsKnown: true,
        },
      },
      quarantined: false,
      quarantineReason: null,
      active: true,
      lastVerifiedAt: nowIso,
      updatedAt: nowIso,
      createdAt: nowIso,
    });
  }

  return out;
}
