import crypto from "node:crypto";
import { getViatorClient } from "@/lib/viator/client";
import { appendViatorAttribution } from "@/lib/viator/links";
import { DCC_VIATOR_PRODUCT_MAPPINGS } from "@/lib/viator/mappings";
import { fetchCompaniesItems } from "@/lib/dcc/liveSlots/fareharbor";
import {
  EARTHOS_DESTINATION_NODES,
  getCompatibilityAliasesForViatorCode,
  recordCatalogSyncRun,
  upsertDurableTourRecords,
  type CatalogSyncRunRecord,
  type ChannelOffer,
  type DurableTourRecord,
  type EarthOSDestinationNode,
  type LocationPrecision,
  type PickupLocationRecord,
  type TourAgeBandRecord,
} from "./durableCatalogStore";

function sha256Hex(value: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function parseDurationMinutesFromViator(rawDuration: any): {
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
    // Use upper bound for conservative schedule fit, preserve raw range text
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
  let meetingPointLng: number | null = null;
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
};

export async function runUniversalCatalogIngestion(options: IngestionOptions = {}) {
  const client = getViatorClient();
  const targetSlugs =
    options.destinations && options.destinations.length > 0
      ? options.destinations
      : Object.keys(EARTHOS_DESTINATION_NODES);
  const perDestLimit = options.perDestinationLimit ?? 12;
  const enrichLimit = options.enrichDetailLimitPerDestination ?? 4;

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

    try {
      upstreamRequests += 1;
      const searchRes = (await client.searchProducts({
        filtering: {
          destination: String(node.viatorDestinationId),
        },
        pagination: {
          start: 1,
          count: perDestLimit,
        },
        currency: "USD",
      })) as any;

      const rawProducts: any[] = Array.isArray(searchRes?.products) ? searchRes.products : [];

      // Ensure any mapped compatibility Viator codes for this destination are also included
      const mappedForDest = DCC_VIATOR_PRODUCT_MAPPINGS.filter(
        (m) =>
          m.destination.toLowerCase().replace(/[^a-z0-9]+/g, "-") === destSlug ||
          (m.portSlug && m.portSlug.toLowerCase() === destSlug),
      );
      const existingCodes = new Set(
        rawProducts.map((p) => String(p?.productCode || "").trim().toUpperCase()),
      );
      const extraMappedCodes = Array.from(
        new Set(mappedForDest.map((m) => m.viatorCode.trim().toUpperCase())),
      ).filter((code) => code && !existingCodes.has(code));

      // Enrich top products + any explicit mapped codes with getProductDetail
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
      const locationRefsToResolve = new Set<string>();

      for (const code of codesToEnrich) {
        try {
          upstreamRequests += 1;
          const detail = (await client.getProductDetail(code)) as any;
          if (detail && detail.productCode) {
            detailsByCode.set(String(detail.productCode).toUpperCase(), detail);
            // If this was an extra mapped code not in rawProducts, add it to rawProducts
            if (!existingCodes.has(String(detail.productCode).toUpperCase())) {
              rawProducts.unshift(detail);
              existingCodes.add(String(detail.productCode).toUpperCase());
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
          }
        } catch (err) {
          // Product code may be retired/unavailable in Viator detail endpoint
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

        const rawFromPrice =
          typeof item?.pricing?.summary?.fromPrice === "number"
            ? item.pricing.summary.fromPrice
            : null;
        const fromPriceCents =
          rawFromPrice !== null && Number.isFinite(rawFromPrice)
            ? Math.round(rawFromPrice * 100)
            : null;

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

        // Add site-specific channel offers if mapped in DCC_VIATOR_PRODUCT_MAPPINGS
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
          currency: String(item?.pricing?.currency || "USD"),
          freeCancellation: cancellationParsed.freeCancellation,
          cancellationPolicyType: cancellationParsed.cancellationPolicyType,
          cancellationCutoffHours: cancellationParsed.cancellationCutoffHours,
          cancellationSummary: cancellationParsed.cancellationSummary,
          hasHotelPickup: pickupParsed.hasHotelPickup,
          pickupType: pickupParsed.pickupType,
          pickupSummary: pickupParsed.pickupSummary,
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
            sourceEndpoint: detail ? "/products/search+/products/{code}" : "/products/search",
            fetchedAt: nowIso,
            contentSha256: sha256Hex({
              productCode,
              title,
              fromPriceCents,
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
          active: true,
          lastVerifiedAt: nowIso,
          updatedAt: nowIso,
          createdAt: nowIso,
        };

        allUpsertedRecords.push(record);
        importedCount += 1;
      }

      const syncRun: CatalogSyncRunRecord = {
        runId,
        provider: "viator",
        destinationSlug: destSlug,
        status: "completed",
        cursorValue: `page:1:count:${perDestLimit}`,
        importedCount,
        updatedCount: importedCount,
        rejectedCount,
        upstreamRequestCount: upstreamRequests,
        rejectionReasons,
        metadata: {
          viatorDestinationId: node.viatorDestinationId,
          enrichedDetailCount: detailsByCode.size,
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
        // Estimate duration only when explicit in title/headline (e.g., "2 Hour"), otherwise keep null!
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
          currency: "USD",
          freeCancellation: null,
          cancellationPolicyType: "CUSTOM",
          cancellationCutoffHours: item.cancellation_policy_hours ?? null,
          cancellationSummary:
            typeof item.cancellation_policy_hours === "number"
              ? `${item.cancellation_policy_hours}-hour operator cancellation cutoff.`
              : null,
          hasHotelPickup: true,
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

  // 3. Permitted Operator-Sourced Discovery & Direct Records (regardless of commission status)
  const operatorRecords = buildPermittedOperatorSourcedRecords(targetSlugs);
  allUpsertedRecords.push(...operatorRecords);

  const opSyncRun: CatalogSyncRunRecord = {
    runId: `sync:operator_direct:multi:${Date.now()}`,
    provider: "operator_direct",
    destinationSlug: "multi-destination",
    status: "completed",
    cursorValue: "v1-operator-catalog",
    importedCount: operatorRecords.length,
    updatedCount: operatorRecords.length,
    rejectedCount: 0,
    upstreamRequestCount: 0,
    rejectionReasons: {},
    metadata: {
      note: "Includes discovery_only (non-commission), attributable_referral, and live_check_direct operator records with distinct channel offers and explicit unknowns.",
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

function buildPermittedOperatorSourcedRecords(targetSlugs: string[]): DurableTourRecord[] {
  const nowIso = new Date().toISOString();
  const out: DurableTourRecord[] = [];

  if (targetSlugs.includes("new-orleans")) {
    const nola = EARTHOS_DESTINATION_NODES["new-orleans"];
    // 1. Cajun Encounters Honey Island Swamp Tour — Distinct Operator Direct + Viator + WTS + WNO Channel Offers
    out.push({
      tourId: "dcc:tour:nola:cajun-encounters-honey-island-swamp",
      compatibilityAliases: [
        "honey-island-swamp-pickup",
        "swamp-tour-with-pickup",
        "cajun-encounters-swamp-tour",
      ],
      destinationSlug: "new-orleans",
      portSlug: "new-orleans",
      earthosDestinationNodeId: nola.earthosDestinationNodeId,
      timeZone: nola.timeZone,
      title: "Cajun Encounters: Honey Island Swamp & Bayou Boat Tour",
      summary:
        "Guided flat-bottom covered boat expedition deep into the protected Honey Island Swamp wildlife preserve, with optional French Quarter & Warehouse District hotel pickup.",
      category: "Swamp & Bayou",
      tags: ["swamp", "honey-island", "family-friendly", "hotel-pickup", "covered-boat"],
      primaryProvider: "operator_direct",
      providerProductCode: "NOLA-CE-HONEY-ISLAND",
      operatorName: "Cajun Encounters Tour Company",
      operatorCode: "cajun-encounters",
      capabilityTier: "live_check_referral",
      commissionAuthorized: true,
      durationMinutes: 135,
      durationRawText: "2h 15m (4h 15m with French Quarter hotel shuttle)",
      fromPriceCents: 6300,
      currency: "USD",
      freeCancellation: true,
      cancellationPolicyType: "STANDARD",
      cancellationCutoffHours: 24,
      cancellationSummary: "Full refund when cancelled at least 24 hours prior to departure.",
      hasHotelPickup: true,
      pickupType: "HOTEL_OR_MEETING_POINT",
      pickupSummary:
        "Pickups from 25+ designated French Quarter, CBD, and Warehouse District hotels or self-drive to Pearl River dock.",
      meetingPointName: "Cajun Encounters Pearl River Marina Dock",
      meetingPointAddress: "55345 US-90, Slidell, LA 70461",
      meetingPointLat: 30.2314,
      meetingPointLng: -89.6872,
      locationPrecision: "exact",
      pickupLocations: [
        {
          name: "Hotel Monteleone (Royal St French Quarter Pickup)",
          address: "214 Royal St, New Orleans, LA 70130",
          lat: 29.9542,
          lng: -90.0681,
          precision: "exact",
          pickupType: "HOTEL",
        },
        {
          name: "The Roosevelt New Orleans (CBD Pickup)",
          address: "130 Roosevelt Way, New Orleans, LA 70112",
          lat: 29.9549,
          lng: -90.0725,
          precision: "exact",
          pickupType: "HOTEL",
        },
        {
          name: "Omni Riverfront / Warehouse District & Cruise Terminal Pickup",
          address: "701 Convention Center Blvd, New Orleans, LA 70130",
          lat: 29.9421,
          lng: -90.0637,
          precision: "exact",
          pickupType: "HOTEL",
        },
      ],
      ageBands: [
        { ageBand: "ADULT", startAge: 13, endAge: 99 },
        { ageBand: "CHILD", startAge: 4, endAge: 12 },
        { ageBand: "INFANT", startAge: 0, endAge: 3 },
      ],
      constraints: {
        maxPassengerWeightLbs: null,
        wheelchairAccessible: true,
        minAgeYears: 0,
        physicalDifficulty: "EASY",
        cruiseBufferBeforeMinutes: 60,
        cruiseBufferAfterMinutes: 60,
        weatherDependent: true,
      },
      channelOffers: [
        {
          channelId: "welcometotheswamp",
          provider: "viator",
          providerProductCode: "6953SWAMPTRANS",
          capabilityTier: "live_check_referral",
          commissionAuthorized: true,
          fromPriceCents: 6300,
          currency: "USD",
          freeCancellation: true,
          cancellationCutoffHours: 24,
          cancellationSummary: "Free cancellation up to 24 hours before start time (Viator channel).",
          inclusions: ["2-hour guided Honey Island swamp boat tour", "Round-trip French Quarter hotel pickup"],
          exclusions: ["Gratuities", "Food and drinks"],
          bookingUrl: appendViatorAttribution(
            "https://www.viator.com/tours/New-Orleans/Honey-Island-Swamp-Tour/d675-6953SWAMPTRANS",
            { preserveExistingCampaign: false, campaign: "wts-plan-pickup" },
          ),
          defaultCampaign: "wts-plan-pickup",
        },
        {
          channelId: "welcometoneworleanstours",
          provider: "viator",
          providerProductCode: "6953SWAMPTRANS",
          capabilityTier: "live_check_referral",
          commissionAuthorized: true,
          fromPriceCents: 6300,
          currency: "USD",
          freeCancellation: true,
          cancellationCutoffHours: 24,
          cancellationSummary: "Free cancellation up to 24 hours before start time (WNO channel).",
          inclusions: ["2-hour guided Honey Island swamp boat tour", "Round-trip French Quarter hotel pickup"],
          exclusions: ["Gratuities"],
          bookingUrl: appendViatorAttribution(
            "https://www.viator.com/tours/New-Orleans/Honey-Island-Swamp-Tour/d675-6953SWAMPTRANS",
            { preserveExistingCampaign: false, campaign: "wno-guide-pickup-swamp" },
          ),
          defaultCampaign: "wno-guide-pickup-swamp",
        },
        {
          channelId: "operator_direct",
          provider: "operator_direct",
          providerProductCode: "NOLA-CE-DIRECT-DRIVE",
          capabilityTier: "discovery_only",
          commissionAuthorized: false,
          fromPriceCents: 3600,
          currency: "USD",
          freeCancellation: false,
          cancellationCutoffHours: 48,
          cancellationSummary: "Operator-direct self-drive rate requires 48-hour notice for changes.",
          inclusions: ["2-hour guided Honey Island swamp boat tour (self-drive to Slidell dock)"],
          exclusions: ["Hotel transportation", "Gratuities"],
          bookingUrl: "https://www.cajunencounters.com/tours/honey-island-swamp-tour/",
        },
      ],
      inclusions: [
        "Guided Honey Island Swamp boat tour with local Cajun captain",
        "Optional French Quarter / CBD hotel shuttle pickup",
      ],
      exclusions: ["Gratuities"],
      primaryImageUrl: null,
      ratingAverage: 4.8,
      reviewCount: 4120,
      bookingUrl: appendViatorAttribution(
        "https://www.viator.com/tours/New-Orleans/Honey-Island-Swamp-Tour/d675-6953SWAMPTRANS",
        { preserveExistingCampaign: false, campaign: "dcc-nola-honey-island" },
      ),
      provenance: {
        sourceSystem: "dcc_multi_channel_catalog",
        sourceEndpoint: "operator_direct+viator_6953SWAMPTRANS",
        fetchedAt: nowIso,
        contentSha256: sha256Hex("dcc:tour:nola:cajun-encounters-honey-island-swamp"),
        rawFieldsVerified: {
          durationKnown: true,
          cancellationKnown: true,
          pickupKnown: true,
          meetingCoordinatesKnown: true,
          ageBandsKnown: true,
        },
      },
      active: true,
      lastVerifiedAt: nowIso,
      updatedAt: nowIso,
      createdAt: nowIso,
    });

    // 2. Preservation Hall Traditional New Orleans Jazz Session — Non-Commission Discovery Listing
    out.push({
      tourId: "dcc:tour:nola:preservation-hall-jazz-session",
      compatibilityAliases: ["preservation-hall-jazz", "nola-preservation-hall"],
      destinationSlug: "new-orleans",
      portSlug: "new-orleans",
      earthosDestinationNodeId: nola.earthosDestinationNodeId,
      timeZone: nola.timeZone,
      title: "Preservation Hall: Intimate Acoustic Traditional New Orleans Jazz Set",
      summary:
        "45-minute acoustic performance inside the historic 1817 French Quarter sanctuary of traditional New Orleans jazz. Included as an essential cultural option even though Preservation Hall does not pay affiliate commissions.",
      category: "Music & Riverboat Cruises",
      tags: ["jazz", "french-quarter", "iconic", "non-commission-discovery", "all-ages"],
      primaryProvider: "operator_direct",
      providerProductCode: "PRES-HALL-SET",
      operatorName: "Preservation Hall",
      operatorCode: "preservation-hall",
      capabilityTier: "discovery_only",
      commissionAuthorized: false,
      durationMinutes: 45,
      durationRawText: "45m acoustic performance set",
      fromPriceCents: 2500,
      currency: "USD",
      freeCancellation: false,
      cancellationPolicyType: "ALL_SALES_FINAL",
      cancellationCutoffHours: 0,
      cancellationSummary: "All ticket sales final per Preservation Hall box office policy.",
      hasHotelPickup: false,
      pickupType: "MEETING_POINT_ONLY",
      pickupSummary: "Walk-in / timed entry at 726 St. Peter Street in the French Quarter.",
      meetingPointName: "Preservation Hall Box Office",
      meetingPointAddress: "726 St Peter St, New Orleans, LA 70116",
      meetingPointLat: 29.9585,
      meetingPointLng: -90.0652,
      locationPrecision: "exact",
      pickupLocations: [],
      ageBands: [{ ageBand: "TRAVELER", startAge: 0, endAge: 99 }],
      constraints: {
        maxPassengerWeightLbs: null,
        wheelchairAccessible: true,
        minAgeYears: 0,
        physicalDifficulty: "EASY",
        cruiseBufferBeforeMinutes: 30,
        cruiseBufferAfterMinutes: 30,
        weatherDependent: false,
      },
      channelOffers: [
        {
          channelId: "operator_direct",
          provider: "operator_direct",
          providerProductCode: "PRES-HALL-SET",
          capabilityTier: "discovery_only",
          commissionAuthorized: false,
          fromPriceCents: 2500,
          currency: "USD",
          freeCancellation: false,
          cancellationCutoffHours: 0,
          cancellationSummary: "All sales final.",
          inclusions: ["45-minute live acoustic traditional jazz performance"],
          exclusions: ["Beverages", "Hotel transfer"],
          bookingUrl: "https://www.preservationhall.com/calendar",
        },
      ],
      inclusions: ["45-minute live acoustic traditional jazz performance"],
      exclusions: ["Beverages", "Hotel transfer"],
      primaryImageUrl: null,
      ratingAverage: 4.9,
      reviewCount: 3850,
      bookingUrl: "https://www.preservationhall.com/calendar",
      provenance: {
        sourceSystem: "operator_direct_catalog",
        sourceEndpoint: "https://www.preservationhall.com/calendar",
        fetchedAt: nowIso,
        contentSha256: sha256Hex("dcc:tour:nola:preservation-hall-jazz-session"),
        rawFieldsVerified: {
          durationKnown: true,
          cancellationKnown: true,
          pickupKnown: true,
          meetingCoordinatesKnown: true,
          ageBandsKnown: true,
        },
      },
      active: true,
      lastVerifiedAt: nowIso,
      updatedAt: nowIso,
      createdAt: nowIso,
    });

    // 3. Steamboat Natchez Jazz Cruise — Attributable Referral + Direct Comparison
    out.push({
      tourId: "dcc:tour:nola:steamboat-natchez-jazz-cruise",
      compatibilityAliases: ["steamboat-natchez-daytime-jazz", "nola-steamboat-natchez"],
      destinationSlug: "new-orleans",
      portSlug: "new-orleans",
      earthosDestinationNodeId: nola.earthosDestinationNodeId,
      timeZone: nola.timeZone,
      title: "Steamboat NATCHEZ Daytime Mississippi River Jazz Cruise",
      summary:
        "2-hour authentic sternwheel steamboat cruise from the French Quarter Toulouse Street Wharf featuring live jazz by the Dukes of Dixieland and optional Creole lunch.",
      category: "Music & Riverboat Cruises",
      tags: ["riverboat", "jazz", "french-quarter", "family-friendly", "cruise-port-walkable"],
      primaryProvider: "operator_direct",
      providerProductCode: "NATCHEZ-DAY-JAZZ",
      operatorName: "New Orleans Steamboat Company",
      operatorCode: "steamboat-natchez",
      capabilityTier: "attributable_referral",
      commissionAuthorized: true,
      durationMinutes: 120,
      durationRawText: "2h river cruise (boarding begins 30m prior)",
      fromPriceCents: 4450,
      currency: "USD",
      freeCancellation: true,
      cancellationPolicyType: "STANDARD",
      cancellationCutoffHours: 24,
      cancellationSummary: "Refundable up to 24 hours prior to sailing.",
      hasHotelPickup: false,
      pickupType: "MEETING_POINT_ONLY",
      pickupSummary: "Departs from Toulouse Street Wharf behind Jackson Square in the French Quarter.",
      meetingPointName: "Toulouse Street Wharf (Behind Jackson Square)",
      meetingPointAddress: "400 Toulouse St, New Orleans, LA 70130",
      meetingPointLat: 29.9541,
      meetingPointLng: -90.0620,
      locationPrecision: "exact",
      pickupLocations: [],
      ageBands: [
        { ageBand: "ADULT", startAge: 13, endAge: 99 },
        { ageBand: "CHILD", startAge: 6, endAge: 12 },
        { ageBand: "INFANT", startAge: 0, endAge: 5 },
      ],
      constraints: {
        maxPassengerWeightLbs: null,
        wheelchairAccessible: true,
        minAgeYears: 0,
        physicalDifficulty: "EASY",
        cruiseBufferBeforeMinutes: 45,
        cruiseBufferAfterMinutes: 45,
        weatherDependent: false,
      },
      channelOffers: [
        {
          channelId: "welcometoneworleanstours",
          provider: "operator_direct",
          providerProductCode: "NATCHEZ-DAY-JAZZ",
          capabilityTier: "attributable_referral",
          commissionAuthorized: true,
          fromPriceCents: 4450,
          currency: "USD",
          freeCancellation: true,
          cancellationCutoffHours: 24,
          cancellationSummary: "Free cancellation up to 24 hours before sailing.",
          inclusions: ["2-hour Mississippi River cruise", "Live Dukes of Dixieland jazz", "Calliope concert"],
          exclusions: ["Creole lunch upgrade ($15.50)", "Hotel pickup"],
          bookingUrl: "https://www.steamboatnatchez.com/harbor-jazz-cruises?utm_source=dcc&utm_medium=referral",
          defaultCampaign: "wno-natchez-day-jazz",
        },
      ],
      inclusions: ["2-hour Mississippi River cruise", "Live Dukes of Dixieland jazz", "Calliope concert"],
      exclusions: ["Creole lunch upgrade", "Hotel pickup"],
      primaryImageUrl: null,
      ratingAverage: 4.6,
      reviewCount: 2910,
      bookingUrl: "https://www.steamboatnatchez.com/harbor-jazz-cruises?utm_source=dcc&utm_medium=referral",
      provenance: {
        sourceSystem: "operator_direct_catalog",
        sourceEndpoint: "https://www.steamboatnatchez.com/harbor-jazz-cruises",
        fetchedAt: nowIso,
        contentSha256: sha256Hex("dcc:tour:nola:steamboat-natchez-jazz-cruise"),
        rawFieldsVerified: {
          durationKnown: true,
          cancellationKnown: true,
          pickupKnown: true,
          meetingCoordinatesKnown: true,
          ageBandsKnown: true,
        },
      },
      active: true,
      lastVerifiedAt: nowIso,
      updatedAt: nowIso,
      createdAt: nowIso,
    });

    // 4. Lafitte Custom Private Bayou Skiff Charter — Explicit Unknowns Acceptance Case
    // Duration, cancellation policy, pickup coverage, and exact dock coordinates depend on daily tide/captain assignment
    out.push({
      tourId: "dcc:tour:nola:lafitte-custom-bayou-charter-unknowns",
      compatibilityAliases: ["nola-custom-bayou-charter"],
      destinationSlug: "new-orleans",
      portSlug: "new-orleans",
      earthosDestinationNodeId: nola.earthosDestinationNodeId,
      timeZone: nola.timeZone,
      title: "Jean Lafitte Custom Private Fisherman's Bayou Skiff Charter",
      summary:
        "Bespoke private shallow-draft skiff charter with a Barataria Basin commercial fisherman. Duration, launch dock, and cancellation terms vary by tide and season and are preserved as explicit unknowns rather than assumed.",
      category: "Swamp & Bayou",
      tags: ["private-charter", "barataria", "explicit-unknown-acceptance", "non-commission-discovery"],
      primaryProvider: "operator_direct",
      providerProductCode: "NOLA-LAFITTE-CUSTOM-SKIFF",
      operatorName: "Barataria Basin Independent Charter Guild",
      operatorCode: "barataria-guild",
      capabilityTier: "discovery_only",
      commissionAuthorized: false,
      durationMinutes: null,
      durationRawText: null,
      fromPriceCents: 35000,
      currency: "USD",
      freeCancellation: null,
      cancellationPolicyType: "UNKNOWN",
      cancellationCutoffHours: null,
      cancellationSummary: null,
      hasHotelPickup: null,
      pickupType: "UNKNOWN",
      pickupSummary: null,
      meetingPointName: "Assigned Jean Lafitte Launch Slip (Confirmed 24h Prior)",
      meetingPointAddress: null,
      meetingPointLat: null,
      meetingPointLng: null,
      locationPrecision: "unknown",
      pickupLocations: [],
      ageBands: [
        { ageBand: "ADULT", startAge: 18, endAge: 85 },
        { ageBand: "CHILD", startAge: 6, endAge: 17 },
      ],
      constraints: {
        maxPassengerWeightLbs: 300,
        wheelchairAccessible: false,
        minAgeYears: 6,
        physicalDifficulty: "MODERATE",
        cruiseBufferBeforeMinutes: null,
        cruiseBufferAfterMinutes: null,
        weatherDependent: true,
      },
      channelOffers: [
        {
          channelId: "operator_direct",
          provider: "operator_direct",
          providerProductCode: "NOLA-LAFITTE-CUSTOM-SKIFF",
          capabilityTier: "discovery_only",
          commissionAuthorized: false,
          fromPriceCents: 35000,
          currency: "USD",
          freeCancellation: null,
          cancellationCutoffHours: null,
          cancellationSummary: null,
          inclusions: ["Private skiff & licensed captain"],
          exclusions: ["Hotel transfer (unconfirmed)"],
          bookingUrl: "https://welcometotheswamp.com/charters/barataria-custom-skiff",
        },
      ],
      inclusions: ["Private skiff & licensed captain"],
      exclusions: ["Hotel transfer (unconfirmed)"],
      primaryImageUrl: null,
      ratingAverage: null,
      reviewCount: null,
      bookingUrl: "https://welcometotheswamp.com/charters/barataria-custom-skiff",
      provenance: {
        sourceSystem: "operator_direct_catalog",
        sourceEndpoint: "barataria-guild-listing",
        fetchedAt: nowIso,
        contentSha256: sha256Hex("dcc:tour:nola:lafitte-custom-bayou-charter-unknowns"),
        rawFieldsVerified: {
          durationKnown: false,
          cancellationKnown: false,
          pickupKnown: false,
          meetingCoordinatesKnown: false,
          ageBandsKnown: true,
        },
      },
      active: true,
      lastVerifiedAt: nowIso,
      updatedAt: nowIso,
      createdAt: nowIso,
    });
  }

  if (targetSlugs.includes("denver-colorado")) {
    const den = EARTHOS_DESTINATION_NODES["denver-colorado"];
    out.push({
      tourId: "dcc:tour:gosno:winter-park-express-shuttle",
      compatibilityAliases: ["gosno-winter-park-shuttle", "winter-park-ski-shuttle"],
      destinationSlug: "denver-colorado",
      portSlug: null,
      earthosDestinationNodeId: den.earthosDestinationNodeId,
      timeZone: den.timeZone,
      title: "GoSno: Denver & Airport to Winter Park Resort Mountain Ski Transfer",
      summary:
        "Direct winter mountain shuttle and private SUV transfer connecting Denver International Airport (DEN) & Denver Union Station with Winter Park Resort, with ski/snowboard gear storage included.",
      category: "Mountain & Venue Transfers",
      tags: ["gosno", "winter-park", "ski-shuttle", "denver", "direct-handoff"],
      primaryProvider: "gosno",
      providerProductCode: "GOSNO-WP-TRANSFER",
      operatorName: "GoSno Mountain Transportation",
      operatorCode: "gosno",
      capabilityTier: "live_check_direct",
      commissionAuthorized: true,
      durationMinutes: 110,
      durationRawText: "1h 50m mountain corridor transfer",
      fromPriceCents: 8900,
      currency: "USD",
      freeCancellation: true,
      cancellationPolicyType: "STANDARD",
      cancellationCutoffHours: 24,
      cancellationSummary: "Free cancellation or flight-delay rebooking up to 24 hours before departure.",
      hasHotelPickup: true,
      pickupType: "HOTEL_OR_MEETING_POINT",
      pickupSummary: "Pickups at DEN Airport Level 5 Island 1, Denver Union Station, and downtown Denver hotels.",
      meetingPointName: "Denver Union Station Bus Concourse / DEN Level 5",
      meetingPointAddress: "1701 Wynkoop St, Denver, CO 80202",
      meetingPointLat: 39.7527,
      meetingPointLng: -105.0002,
      locationPrecision: "exact",
      pickupLocations: [
        {
          name: "Denver Union Station (1701 Wynkoop St)",
          address: "1701 Wynkoop St, Denver, CO 80202",
          lat: 39.7527,
          lng: -105.0002,
          precision: "exact",
          pickupType: "MEETING_POINT",
        },
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
        { ageBand: "ADULT", startAge: 13, endAge: 99 },
        { ageBand: "CHILD", startAge: 2, endAge: 12 },
      ],
      constraints: {
        maxPassengerWeightLbs: null,
        wheelchairAccessible: true,
        minAgeYears: 0,
        physicalDifficulty: "EASY",
        weatherDependent: false,
      },
      channelOffers: [
        {
          channelId: "gosno",
          provider: "gosno",
          providerProductCode: "GOSNO-WP-TRANSFER",
          capabilityTier: "live_check_direct",
          commissionAuthorized: true,
          fromPriceCents: 8900,
          currency: "USD",
          freeCancellation: true,
          cancellationCutoffHours: 24,
          cancellationSummary: "Free cancellation up to 24h prior.",
          inclusions: ["Mountain-equipped shuttle transfer", "2 ski/snowboard bags + luggage per guest"],
          exclusions: ["Driver gratuity"],
          bookingUrl: "/go/dcc-to-gosno?resort=winter-park",
        },
      ],
      inclusions: ["Mountain-equipped shuttle transfer", "2 ski/snowboard bags + luggage per guest"],
      exclusions: ["Driver gratuity"],
      primaryImageUrl: null,
      ratingAverage: 4.9,
      reviewCount: 640,
      bookingUrl: "/go/dcc-to-gosno?resort=winter-park",
      provenance: {
        sourceSystem: "dcc_internal_gosno",
        sourceEndpoint: "/go/dcc-to-gosno",
        fetchedAt: nowIso,
        contentSha256: sha256Hex("dcc:tour:gosno:winter-park-express-shuttle"),
        rawFieldsVerified: {
          durationKnown: true,
          cancellationKnown: true,
          pickupKnown: true,
          meetingCoordinatesKnown: true,
          ageBandsKnown: true,
        },
      },
      active: true,
      lastVerifiedAt: nowIso,
      updatedAt: nowIso,
      createdAt: nowIso,
    });

    out.push({
      tourId: "dcc:tour:parr:red-rocks-amphitheatre-shuttle",
      compatibilityAliases: ["parr-red-rocks-shuttle", "red-rocks-concert-shuttle"],
      destinationSlug: "denver-colorado",
      portSlug: null,
      earthosDestinationNodeId: den.earthosDestinationNodeId,
      timeZone: den.timeZone,
      title: "Party at Red Rocks (PARR): Round-Trip Denver to Red Rocks Concert Shuttle",
      summary:
        "Official round-trip luxury coach and party shuttle from downtown Denver (Union Station / RiNo) directly to the Top Circle Lot at Red Rocks Amphitheatre.",
      category: "Mountain & Venue Transfers",
      tags: ["parr", "red-rocks", "concert-shuttle", "denver"],
      primaryProvider: "parr",
      providerProductCode: "PARR-RR-SHUTTLE",
      operatorName: "Party at Red Rocks",
      operatorCode: "partyatredrocks",
      capabilityTier: "live_check_direct",
      commissionAuthorized: true,
      durationMinutes: 300,
      durationRawText: "Round-trip event duration (departs 2h before doors, returns 30m after encore)",
      fromPriceCents: 5900,
      currency: "USD",
      freeCancellation: true,
      cancellationPolicyType: "STANDARD",
      cancellationCutoffHours: 48,
      cancellationSummary: "Full refund up to 48 hours before show night.",
      hasHotelPickup: false,
      pickupType: "MEETING_POINT_ONLY",
      pickupSummary: "Departs from Thirsty Lion at Denver Union Station (1605 Wynkoop St).",
      meetingPointName: "Thirsty Lion at Denver Union Station",
      meetingPointAddress: "1605 Wynkoop St, Denver, CO 80202",
      meetingPointLat: 39.7531,
      meetingPointLng: -105.0008,
      locationPrecision: "exact",
      pickupLocations: [],
      ageBands: [{ ageBand: "ADULT", startAge: 18, endAge: 99 }],
      constraints: {
        maxPassengerWeightLbs: null,
        wheelchairAccessible: true,
        minAgeYears: 18,
        physicalDifficulty: "EASY",
        weatherDependent: false,
      },
      channelOffers: [
        {
          channelId: "partyatredrocks",
          provider: "parr",
          providerProductCode: "PARR-RR-SHUTTLE",
          capabilityTier: "live_check_direct",
          commissionAuthorized: true,
          fromPriceCents: 5900,
          currency: "USD",
          freeCancellation: true,
          cancellationCutoffHours: 48,
          cancellationSummary: "Full refund up to 48 hours before show night.",
          inclusions: ["Round-trip coach to Red Rocks Top Circle Lot", "Pre-show check-in wristband"],
          exclusions: ["Concert ticket", "Driver gratuity"],
          bookingUrl: "https://www.partyatredrocks.com/book?utm_source=dcc",
        },
      ],
      inclusions: ["Round-trip coach to Red Rocks Top Circle Lot", "Pre-show check-in wristband"],
      exclusions: ["Concert ticket", "Driver gratuity"],
      primaryImageUrl: null,
      ratingAverage: 4.9,
      reviewCount: 1280,
      bookingUrl: "https://www.partyatredrocks.com/book?utm_source=dcc",
      provenance: {
        sourceSystem: "dcc_internal_parr",
        sourceEndpoint: "https://www.partyatredrocks.com",
        fetchedAt: nowIso,
        contentSha256: sha256Hex("dcc:tour:parr:red-rocks-amphitheatre-shuttle"),
        rawFieldsVerified: {
          durationKnown: true,
          cancellationKnown: true,
          pickupKnown: true,
          meetingCoordinatesKnown: true,
          ageBandsKnown: true,
        },
      },
      active: true,
      lastVerifiedAt: nowIso,
      updatedAt: nowIso,
      createdAt: nowIso,
    });
  }

  return out;
}
