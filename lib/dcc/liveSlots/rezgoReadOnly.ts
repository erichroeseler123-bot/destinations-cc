/**
 * Isolated Read-Only Rezgo Inspection & 6-Gate Safe Connection Guard
 * (Serene — Juneau Tours & Whale Watch)
 *
 * Strict Governance & Promise Invariants:
 * 1. Credentials (`REZGO_SERENE_CID` / `REZGO_SERENE_API_KEY`) are read ONLY from server
 *    environment variables — never embedded in source code, client bundles, or public forms.
 * 2. Inspection (`inspectSereneRezgoInventoryReadOnly`) uses strictly read-only Rezgo XML
 *    `i=company` and `i=search` instructions (`GET` only). Zero booking (`i=commit`), hold,
 *    payment, cancellation, or customer-message instructions exist in this module.
 * 3. Property isolation (`isolatedSecondaryProperty: true`, `influencesPrimaryDccRanking: false`)
 *    is hard-pinned in code so Serene's inventory remains isolated and secondary as promised.
 * 4. Live customer booking remains hard-locked (`liveBookingAllowed: false`) until ALL five
 *    upstream gates are explicitly confirmed (`credentials_stored_securely`,
 *    `readonly_inventory_inspected`, `dcc_product_mapping_verified`,
 *    `written_commission_ownership_confirmed`, `non_customer_booking_flow_tested`) AND
 *    `REZGO_SERENE_LIVE_BOOKING_ENABLED=true`.
 */

export type SereneRezgoGateStage =
  | "awaiting_credentials"
  | "ready_for_readonly_inspection"
  | "readonly_inspected_awaiting_mapping_and_written_commission"
  | "awaiting_non_customer_booking_test"
  | "ready_for_isolated_live_enablement"
  | "live_isolated_secondary";

export interface SereneRezgoReadinessStatus {
  operatorId: "juneau-tours-whale-watch";
  operatorName: "Juneau Tours & Whale Watch";
  contactReference: "Serene";
  isolatedSecondaryProperty: true;
  influencesPrimaryDccRanking: false;
  stage: SereneRezgoGateStage;
  liveBookingAllowed: boolean;
  gates: {
    credentialsStoredSecurelyInEnv: boolean;
    readOnlyInventoryInspected: boolean;
    dccProductMappingVerified: boolean;
    writtenCommissionOwnershipConfirmed: boolean;
    nonCustomerTestBookingVerified: boolean;
    liveBookingToggleEnabled: boolean;
  };
  knownViatorSupplierPrefix: "5857";
  candidateSkusToReconcile: readonly string[];
  nextActionLabel: string;
}

export interface RezgoDateAvailabilitySlot {
  date: string;
  departureTime: string | null;
  availableSpots: number | null;
  maxAvailability: number | null;
  adultPrice: string | null;
  childPrice: string | null;
  seniorPrice: string | null;
  active: boolean | null;
}

export interface RezgoInspectedItemSummary {
  uid: string;
  com: string | null;
  itemName: string;
  optionName: string | null;
  duration: string | null;
  durationMinutes?: number | null;
  departureTime?: string | null;
  departureTimes?: string[];
  adultPrice: string | null;
  childPrice?: string | null;
  seniorPrice?: string | null;
  priceTiers?: Array<{ label: string; amount: string }>;
  currency: string | null;
  startingLocation: string | null;
  availabilityOverall?: number | null;
  availableSpotsOnSearchDate?: number | null;
  maxAvailability?: number | null;
  searchDateChecked?: string | null;
  cutoffWindow?: string | null;
  cancellationSummary?: string | null;
  dateSlots?: RezgoDateAvailabilitySlot[];
}

export interface RezgoProductCrossSurfaceReconciliation {
  rezgoUid: string;
  rezgoCom: string | null;
  rezgoItemName: string;
  rezgoOptionName: string | null;
  duration: string | null;
  durationMinutes: number | null;
  adultPriceUsd: number | null;
  childPriceUsd: number | null;
  departureTimes: string[];
  availableSpotsOnDate: number | null;
  dateChecked: string | null;
  matchConfidence: "high_exact_code" | "medium_title_and_operator" | "unmatched_rezgo_only";
  matchedDccCatalogProductCode: string | null;
  matchedDccCatalogTitle: string | null;
  matchedLastFrontierCatalogProductId: string | null;
  matchedCruisePromenadeSeedProductCode: string | null;
  supplierConflictStatus:
    | "none_same_operator_5857"
    | "conflicts_with_466119P3_dolphin_jet_boat"
    | "unmapped_needs_owner_confirmation";
  supplierConflictNote: string;
  activeSafeBookingFallbackProductCode: string | null;
  activeSafeBookingFallbackUrl: string | null;
  liveDirectRezgoCheckoutEnabled: false;
}

export interface SupplierIdentityConflictReport {
  conflictId: string;
  severity: "high" | "info";
  productCode: string;
  surfaceImpact: Array<"destinations-cc" | "last-frontier-shore-excursions" | "cruisepromenade">;
  listedViatorSupplier: string;
  rezgoVerifiedCompanyName: string | null;
  summary: string;
  safeFallbackBehavior: string;
}

export interface RezgoReadOnlyInspectionResult {
  ok: boolean;
  readOnly: true;
  mutatedRemoteState: false;
  isolatedSecondaryProperty: true;
  checkedAt: string;
  searchDate?: string | null;
  status:
    | "credentials_missing"
    | "inspected_ok"
    | "rezgo_http_error"
    | "rezgo_api_error"
    | "network_error";
  companyName: string | null;
  domain: string | null;
  currency: string | null;
  itemsCount: number;
  items: RezgoInspectedItemSummary[];
  reconciliation?: RezgoProductCrossSurfaceReconciliation[];
  supplierConflicts?: SupplierIdentityConflictReport[];
  writeCapabilitiesDisabled?: {
    commitBookingDisabled: true;
    paymentCaptureDisabled: true;
    cancellationDisabled: true;
    customerMessagingDisabled: true;
    liveDirectCheckoutEnabled: false;
  };
  errorMessage: string | null;
}

export interface NormalizedJuneauSupplierTour {
  normalizedTourId: string;
  rezgoUid: string;
  rezgoCom: string | null;
  operatorId: "juneau-tours-whale-watch";
  operatorName: string;
  verifiedRezgoCompanyName: string | null;
  title: string;
  optionName: string | null;
  activityCategory: "whale-watching" | "mendenhall-glacier-tours" | "combo-whale-glacier" | "juneau-sightseeing";
  durationLabel: string | null;
  durationMinutes: number | null;
  adultPriceUsd: number | null;
  childPriceUsd: number | null;
  currency: string;
  departureTimes: string[];
  startingLocation: string | null;
  dateChecked: string | null;
  availableSpots: number | null;
  availabilitySemantics: "rezgo_date_search_spots" | "rezgo_catalog_overall" | "unconfirmed_check_provider";
  matchConfidence: "high_exact_code" | "medium_title_and_operator" | "unmatched_rezgo_only";
  matchedViatorProductCode: string | null;
  approvedFallbackViatorUrl: string | null;
  liveDirectRezgoCheckoutEnabled: false;
  isolatedSecondaryProperty: true;
  influencesPrimaryDccRanking: false;
}

export interface NormalizedJuneauSupplierFeed {
  ok: boolean;
  source: "dcc_rezgo_readonly_xml" | "dcc_approved_fallback";
  generatedAt: string;
  checkedAt: string;
  dateChecked: string | null;
  readOnly: true;
  liveDirectRezgoCheckoutEnabled: false;
  isolatedSecondaryProperty: true;
  influencesPrimaryDccRanking: false;
  rezgoStatus: RezgoReadOnlyInspectionResult["status"];
  verifiedCompanyName: string | null;
  verifiedRezgoDomain: string | null;
  currency: string;
  toursCount: number;
  tours: NormalizedJuneauSupplierTour[];
  supplierConflicts: SupplierIdentityConflictReport[];
}

const REZGO_XML_ENDPOINT = "https://xml.rezgo.com/xml";

const APPROVED_JUNEAU_5857_VIATOR_CATALOG: Record<
  string,
  {
    productCode: string;
    title: string;
    canonicalViatorUrl: string;
    inLastFrontierStaticCatalog: boolean;
    durationMinutes: number;
  }
> = {
  "5857P22": {
    productCode: "5857P22",
    title: "Mendenhall Glacier Park and Ultimate Whale Watch Combo",
    canonicalViatorUrl:
      "https://www.viator.com/tours/Juneau/Whale-Watch-and-Mendenhall-Glacier-Combo-Tour/d941-5857P22",
    inLastFrontierStaticCatalog: false,
    durationMinutes: 300,
  },
  "5857P23": {
    productCode: "5857P23",
    title: "Ultimate Juneau Whale Watch",
    canonicalViatorUrl:
      "https://www.viator.com/tours/Juneau/Juneau-Whale-Watching-Tour/d941-5857P23",
    inLastFrontierStaticCatalog: false,
    durationMinutes: 180,
  },
  "5857SHUTTLE": {
    productCode: "5857SHUTTLE",
    title: "Mendenhall Glacier Express Round-Trip Shuttle",
    canonicalViatorUrl:
      "https://www.viator.com/tours/Juneau/Round-Trip-Mendenhall-Glacier-Shuttle-Service/d941-5857SHUTTLE",
    inLastFrontierStaticCatalog: true,
    durationMinutes: 180,
  },
  "5857P31": {
    productCode: "5857P31",
    title: "Ultimate Whale Watch and Tracy's Crab Shack Meal",
    canonicalViatorUrl:
      "https://www.viator.com/tours/Juneau/Whale-Watching-and-Tracys-King-Crab-Shack-Combo/d941-5857P31",
    inLastFrontierStaticCatalog: false,
    durationMinutes: 270,
  },
};

function isTruthyFlag(value: string | undefined): boolean {
  const norm = (value || "").trim().toLowerCase();
  return norm === "1" || norm === "true" || norm === "yes";
}

/**
 * Scrubs any Rezgo credential values or query parameters from error messages or strings.
 * Ensures CID (`transcode`) and API key (`key`) can NEVER appear in responses or logs.
 */
export function sanitizeRezgoDiagnosticMessage(
  rawMessage: string | null | undefined,
  secretsToScrub: Array<string | undefined> = [],
): string | null {
  if (!rawMessage) return null;
  let cleaned = String(rawMessage)
    .replace(/([?&](?:transcode|key|cid|api_key|apikey)=)[^&\s"']+/gi, "$1[REDACTED]")
    .replace(/(<(?:transcode|key|api_key)>)\s*[\s\S]*?\s*(<\/(?:transcode|key|api_key)>)/gi, "$1[REDACTED]$2");

  for (const sec of secretsToScrub) {
    const trimmed = (sec || "").trim();
    if (trimmed.length >= 3) {
      cleaned = cleaned.split(trimmed).join("[REDACTED]");
    }
  }
  return cleaned;
}

function decodeBasicXmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

function stripHtmlTags(input: string): string {
  return decodeBasicXmlEntities(input)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractXmlTag(xmlBlock: string, tag: string): string | null {
  const cdataRe = new RegExp(
    `<${tag}\\b[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`,
    "i",
  );
  const cdataMatch = xmlBlock.match(cdataRe);
  if (cdataMatch && cdataMatch[1] !== undefined) {
    const val = decodeBasicXmlEntities(cdataMatch[1].trim());
    return val || null;
  }
  const plainRe = new RegExp(`<${tag}\\b[^>]*>([^<]*)</${tag}>`, "i");
  const plainMatch = xmlBlock.match(plainRe);
  if (plainMatch && plainMatch[1] !== undefined) {
    const val = decodeBasicXmlEntities(plainMatch[1].trim());
    return val || null;
  }
  return null;
}

export function parseDurationToMinutes(rawDuration: string | null | undefined): number | null {
  if (!rawDuration) return null;
  const text = rawDuration.trim().toLowerCase();
  if (!text) return null;

  // Match e.g. "3.5 hours", "3 hours", "3 hrs 30 mins", "2.5 - 3 hours"
  const rangeHoursMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h\b)/);
  if (rangeHoursMatch) {
    const high = Number(rangeHoursMatch[2]);
    if (Number.isFinite(high) && high > 0) return Math.round(high * 60);
  }

  const hoursAndMinsMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h\b)(?:\s*(\d+)\s*(?:minutes?|mins?|m\b))?/);
  if (hoursAndMinsMatch) {
    const hrs = Number(hoursAndMinsMatch[1]);
    const mins = hoursAndMinsMatch[2] ? Number(hoursAndMinsMatch[2]) : 0;
    if (Number.isFinite(hrs)) {
      const total = Math.round(hrs * 60 + (Number.isFinite(mins) ? mins : 0));
      return total > 0 ? total : null;
    }
  }

  const minsOnlyMatch = text.match(/(\d+)\s*(?:minutes?|mins?|m\b)/);
  if (minsOnlyMatch) {
    const mins = Number(minsOnlyMatch[1]);
    return Number.isFinite(mins) && mins > 0 ? mins : null;
  }

  const daysMatch = text.match(/(\d+(?:\.\d+)?)\s*days?/);
  if (daysMatch) {
    const days = Number(daysMatch[1]);
    return Number.isFinite(days) && days > 0 ? Math.round(days * 1440) : null;
  }

  return null;
}

function normalizeRezgoClockTime(rawTime: string | null | undefined): string | null {
  if (!rawTime) return null;
  const cleaned = rawTime.trim();
  if (!cleaned) return null;

  // Handle "9:00 AM", "09:30 am", "1:15 PM", "13:30", "09:00:00"
  const ampmMatch = cleaned.match(/^(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*(am|pm)$/i);
  if (ampmMatch) {
    let hour = Number(ampmMatch[1]);
    const min = Number(ampmMatch[2] || "0");
    const mer = ampmMatch[3].toLowerCase();
    if (hour < 1 || hour > 12 || min < 0 || min > 59) return cleaned;
    if (mer === "pm" && hour !== 12) hour += 12;
    if (mer === "am" && hour === 12) hour = 0;
    return `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  }

  const hhmmMatch = cleaned.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (hhmmMatch) {
    const hour = Number(hhmmMatch[1]);
    const min = Number(hhmmMatch[2]);
    if (hour >= 0 && hour <= 23 && min >= 0 && min <= 59) {
      return `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
    }
  }

  return cleaned;
}

function parseNonNegativeInt(raw: string | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  const trimmed = String(raw).trim();
  if (!trimmed || !/^-?\d+$/.test(trimmed)) return null;
  const num = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(num) || num < 0) return null;
  return num;
}

function parsePositivePrice(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const cleaned = String(raw).replace(/[^0-9.]/g, "").trim();
  if (!cleaned) return null;
  const num = Number.parseFloat(cleaned);
  return Number.isFinite(num) && num > 0 ? Number(num.toFixed(2)) : null;
}

function splitOuterRezgoItemBlocks(xml: string): string[] {
  const blocks: string[] = [];
  // Use stack-based balanced <item>...</item> extraction so inner <item><![CDATA[Title]]></item>
  // or arbitrary child tag ordering (<id>, <uid>, <com>, etc.) is parsed cleanly without regex backtracking bugs.
  const tokenRe = /<item\b[^>]*>|<\/item>/gi;
  let depth = 0;
  let outerStartContentIdx = -1;
  let match: RegExpExecArray | null;

  while ((match = tokenRe.exec(xml)) !== null) {
    const token = match[0].toLowerCase();
    if (token.startsWith("</item")) {
      if (depth === 1 && outerStartContentIdx >= 0) {
        const innerContent = xml.slice(outerStartContentIdx, match.index);
        blocks.push(innerContent);
        outerStartContentIdx = -1;
      }
      if (depth > 0) depth -= 1;
    } else {
      if (depth === 0) {
        outerStartContentIdx = match.index + match[0].length;
      }
      depth += 1;
    }
  }

  return blocks;
}

export function parseRezgoItemsXml(
  xml: string,
  options?: { searchDate?: string | null },
): RezgoInspectedItemSummary[] {
  const items: RezgoInspectedItemSummary[] = [];
  const rawBlocks = splitOuterRezgoItemBlocks(xml);
  const searchDate =
    options?.searchDate && /^\d{4}-\d{2}-\d{2}$/.test(options.searchDate)
      ? options.searchDate
      : null;

  for (const block of rawBlocks) {
    const uid = extractXmlTag(block, "uid") || "";
    const com = extractXmlTag(block, "com");
    // Only treat <item> blocks that look like Rezgo inventory records (have <uid>, <com>, <option>, or <price_adult>)
    const itemName =
      extractXmlTag(block, "item") ||
      extractXmlTag(block, "name") ||
      extractXmlTag(block, "title") ||
      "";
    if (!uid && !com && !itemName) continue;

    const optionName = extractXmlTag(block, "option");
    const duration = extractXmlTag(block, "duration");
    const durationMinutes = parseDurationToMinutes(duration);

    const rawTime = extractXmlTag(block, "time");
    const normalizedItemTime = normalizeRezgoClockTime(rawTime);

    // Parse optional nested <date> availability blocks when `d=YYYY-MM-DD` is queried
    const dateSlots: RezgoDateAvailabilitySlot[] = [];
    const dateBlockRe = /<date\b([^>]*)>([\s\S]*?)<\/date>/gi;
    let dMatch: RegExpExecArray | null;
    while ((dMatch = dateBlockRe.exec(block)) !== null) {
      const attrs = dMatch[1] || "";
      const dBody = dMatch[2] || "";
      const attrDateMatch = attrs.match(/\b(?:val|value|date|day)=["'](\d{4}-\d{2}-\d{2})["']/i);
      const tagDate =
        attrDateMatch?.[1] ||
        extractXmlTag(dBody, "day") ||
        extractXmlTag(dBody, "date_iso") ||
        searchDate ||
        "";
      const slotTime = normalizeRezgoClockTime(extractXmlTag(dBody, "time")) || normalizedItemTime;
      const slotAvail =
        parseNonNegativeInt(extractXmlTag(dBody, "availability")) ??
        parseNonNegativeInt(extractXmlTag(dBody, "spots")) ??
        parseNonNegativeInt(extractXmlTag(dBody, "remaining"));
      const slotMax = parseNonNegativeInt(extractXmlTag(dBody, "max_availability"));
      const activeRaw = extractXmlTag(dBody, "active");
      dateSlots.push({
        date: tagDate,
        departureTime: slotTime,
        availableSpots: slotAvail,
        maxAvailability: slotMax,
        adultPrice: extractXmlTag(dBody, "price_adult") || extractXmlTag(dBody, "base_prices"),
        childPrice: extractXmlTag(dBody, "price_child"),
        seniorPrice: extractXmlTag(dBody, "price_senior"),
        active: activeRaw !== null ? activeRaw !== "0" && activeRaw.toLowerCase() !== "false" : null,
      });
    }

    const departureSet = new Set<string>();
    if (normalizedItemTime) {
      for (const part of normalizedItemTime.split(/[,;/]+/)) {
        const norm = normalizeRezgoClockTime(part);
        if (norm) departureSet.add(norm);
      }
    }
    for (const ds of dateSlots) {
      if (ds.departureTime) departureSet.add(ds.departureTime);
    }
    const departureTimes = Array.from(departureSet);

    const adultPrice =
      extractXmlTag(block, "price_adult") ||
      dateSlots.find((d) => d.adultPrice)?.adultPrice ||
      extractXmlTag(block, "base_prices");
    const childPrice =
      extractXmlTag(block, "price_child") ||
      dateSlots.find((d) => d.childPrice)?.childPrice ||
      null;
    const seniorPrice =
      extractXmlTag(block, "price_senior") ||
      dateSlots.find((d) => d.seniorPrice)?.seniorPrice ||
      null;

    const priceTiers: Array<{ label: string; amount: string }> = [];
    if (adultPrice) priceTiers.push({ label: "Adult", amount: adultPrice });
    if (childPrice) priceTiers.push({ label: "Child", amount: childPrice });
    if (seniorPrice) priceTiers.push({ label: "Senior", amount: seniorPrice });
    // Also inspect any custom <price_*> or <tier> tags
    for (const customTag of ["price_youth", "price_infant", "price_group", "price_private"]) {
      const val = extractXmlTag(block, customTag);
      if (val) {
        const label = customTag.replace(/^price_/, "");
        priceTiers.push({
          label: label.charAt(0).toUpperCase() + label.slice(1),
          amount: val,
        });
      }
    }

    const directAvail = parseNonNegativeInt(extractXmlTag(block, "availability"));
    const overallAvail = parseNonNegativeInt(extractXmlTag(block, "overall_availability"));
    const maxAvailability =
      parseNonNegativeInt(extractXmlTag(block, "max_availability")) ??
      dateSlots.find((d) => d.maxAvailability !== null)?.maxAvailability ??
      null;

    const availableSpotsOnSearchDate = searchDate
      ? (dateSlots.find((d) => !d.date || d.date === searchDate)?.availableSpots ?? directAvail)
      : null;

    const rawCancel =
      extractXmlTag(block, "cancellation") ||
      extractXmlTag(block, "cancellation_policy") ||
      null;
    const cancellationSummary = rawCancel ? stripHtmlTags(rawCancel).slice(0, 240) : null;

    items.push({
      uid: uid || "unindexed",
      com,
      itemName: itemName || `Rezgo Item ${uid}`,
      optionName,
      duration,
      durationMinutes,
      departureTime: normalizedItemTime || departureTimes[0] || null,
      departureTimes,
      adultPrice,
      childPrice,
      seniorPrice,
      priceTiers,
      currency: extractXmlTag(block, "currency_base") || extractXmlTag(block, "currency"),
      startingLocation:
        extractXmlTag(block, "starting_location") || extractXmlTag(block, "city"),
      availabilityOverall: overallAvail ?? directAvail,
      availableSpotsOnSearchDate,
      maxAvailability,
      searchDateChecked: searchDate,
      cutoffWindow: extractXmlTag(block, "cutoff"),
      cancellationSummary,
      ...(dateSlots.length > 0 ? { dateSlots } : {}),
    });
  }
  return items;
}

export function reconcileRezgoItemsAcrossSurfaces(params: {
  items: RezgoInspectedItemSummary[];
  companyName: string | null;
  searchDate?: string | null;
}): {
  reconciliation: RezgoProductCrossSurfaceReconciliation[];
  supplierConflicts: SupplierIdentityConflictReport[];
} {
  const reconciliation: RezgoProductCrossSurfaceReconciliation[] = [];

  for (const item of params.items) {
    const comUpper = (item.com || "").trim().toUpperCase();
    const uidUpper = (item.uid || "").trim().toUpperCase();
    const combinedTitle = `${item.itemName} ${item.optionName || ""}`.toLowerCase();

    let matchConfidence: RezgoProductCrossSurfaceReconciliation["matchConfidence"] =
      "unmatched_rezgo_only";
    let matchedViatorCode: string | null = null;

    if (APPROVED_JUNEAU_5857_VIATOR_CATALOG[comUpper]) {
      matchConfidence = "high_exact_code";
      matchedViatorCode = comUpper;
    } else if (APPROVED_JUNEAU_5857_VIATOR_CATALOG[uidUpper]) {
      matchConfidence = "high_exact_code";
      matchedViatorCode = uidUpper;
    } else if (/crab|tracy/i.test(combinedTitle) && /whale/i.test(combinedTitle)) {
      matchConfidence = "medium_title_and_operator";
      matchedViatorCode = "5857P31";
    } else if (
      (/mendenhall|glacier/i.test(combinedTitle) && /whale/i.test(combinedTitle)) ||
      /combo/i.test(combinedTitle)
    ) {
      matchConfidence = "medium_title_and_operator";
      matchedViatorCode = "5857P22";
    } else if (
      (/shuttle|trolley|express|blue bus/i.test(combinedTitle) &&
        /mendenhall|glacier/i.test(combinedTitle) &&
        !/whale/i.test(combinedTitle))
    ) {
      matchConfidence = "medium_title_and_operator";
      matchedViatorCode = "5857SHUTTLE";
    } else if (/whale/i.test(combinedTitle) && !/mendenhall|glacier|crab|tracy/i.test(combinedTitle)) {
      matchConfidence = "medium_title_and_operator";
      matchedViatorCode = "5857P23";
    }

    const catalogSpec = matchedViatorCode
      ? APPROVED_JUNEAU_5857_VIATOR_CATALOG[matchedViatorCode]
      : null;

    const isComboCandidate = matchedViatorCode === "5857P22";

    reconciliation.push({
      rezgoUid: item.uid,
      rezgoCom: item.com,
      rezgoItemName: item.itemName,
      rezgoOptionName: item.optionName,
      duration: item.duration,
      durationMinutes: item.durationMinutes ?? catalogSpec?.durationMinutes ?? null,
      adultPriceUsd: parsePositivePrice(item.adultPrice),
      childPriceUsd: parsePositivePrice(item.childPrice),
      departureTimes: item.departureTimes || (item.departureTime ? [item.departureTime] : []),
      availableSpotsOnDate: item.availableSpotsOnSearchDate ?? null,
      dateChecked: params.searchDate ?? item.searchDateChecked ?? null,
      matchConfidence,
      matchedDccCatalogProductCode: catalogSpec?.productCode ?? null,
      matchedDccCatalogTitle: catalogSpec?.title ?? null,
      matchedLastFrontierCatalogProductId:
        catalogSpec?.inLastFrontierStaticCatalog ? catalogSpec.productCode : null,
      matchedCruisePromenadeSeedProductCode: null, // CP static fallback seed currently uses 466119P3 (Dolphin Jet Boat Tours); CP receives 5857* via DCC live API
      supplierConflictStatus: isComboCandidate
        ? "conflicts_with_466119P3_dolphin_jet_boat"
        : catalogSpec
          ? "none_same_operator_5857"
          : "unmapped_needs_owner_confirmation",
      supplierConflictNote: isComboCandidate
        ? "Matches Juneau Tours & Whale Watch Viator SKU 5857P22 in DCC SQL catalog, whereas Last Frontier's static combo card and Cruise Promenade's offline fallback seed currently reference Viator 466119P3 (verified supplier: Dolphin Jet Boat Tours). Must NOT merge Rezgo availability or direct referral credit onto 466119P3."
        : catalogSpec
          ? `Reconciles to Juneau Tours & Whale Watch Viator prefix 5857 (${catalogSpec.productCode})${
              matchConfidence === "medium_title_and_operator"
                ? " by operator + title/duration heuristic; requires owner SKU sign-off before enabling direct checkout."
                : " by exact Rezgo COM code."
            }`
          : "No exact 5857* Viator SKU match established yet; kept read-only until owner confirms mapping.",
      activeSafeBookingFallbackProductCode: catalogSpec?.productCode ?? null,
      activeSafeBookingFallbackUrl: catalogSpec?.canonicalViatorUrl ?? null,
      liveDirectRezgoCheckoutEnabled: false,
    });
  }

  const supplierConflicts: SupplierIdentityConflictReport[] = [
    {
      conflictId: "juneau-466119p3-vs-5857-supplier-mismatch",
      severity: "high",
      productCode: "466119P3",
      surfaceImpact: [
        "destinations-cc",
        "last-frontier-shore-excursions",
        "cruisepromenade",
      ],
      listedViatorSupplier: "Dolphin Jet Boat Tours",
      rezgoVerifiedCompanyName: params.companyName || "Juneau Tours & Whale Watch",
      summary:
        "Viator product d941-466119P3 (Mendenhall Glacier Waterfall and Whale Watching Tour) is supplied by Dolphin Jet Boat Tours, NOT Juneau Tours & Whale Watch. Juneau Tours & Whale Watch operates Viator prefix 5857 (5857P22, 5857P23, 5857SHUTTLE, 5857P31).",
      safeFallbackBehavior:
        "466119P3 remains attributed strictly to Dolphin Jet Boat Tours via Viator affiliate checkout; Rezgo inventory from Juneau Tours & Whale Watch is isolated to prefix-5857 / juneau-tours-whale-watch records with direct Rezgo checkout disabled.",
    },
  ];

  return { reconciliation, supplierConflicts };
}

export function getSereneRezgoReadinessStatus(
  env: Record<string, string | undefined> = process.env,
): SereneRezgoReadinessStatus {
  const cid = (env.REZGO_SERENE_CID || "").trim();
  const apiKey = (env.REZGO_SERENE_API_KEY || "").trim();
  const credentialsStoredSecurelyInEnv = Boolean(cid && apiKey.length >= 8);
  const readOnlyInventoryInspected =
    credentialsStoredSecurelyInEnv &&
    isTruthyFlag(env.REZGO_SERENE_READONLY_INSPECTED);
  const dccProductMappingVerified =
    readOnlyInventoryInspected &&
    isTruthyFlag(env.REZGO_SERENE_PRODUCT_MAPPING_VERIFIED);
  const writtenCommissionOwnershipConfirmed =
    readOnlyInventoryInspected &&
    isTruthyFlag(env.REZGO_SERENE_WRITTEN_COMMISSION_CONFIRMED);
  const nonCustomerTestBookingVerified =
    dccProductMappingVerified &&
    writtenCommissionOwnershipConfirmed &&
    isTruthyFlag(env.REZGO_SERENE_NON_CUSTOMER_TEST_VERIFIED);
  const liveBookingToggleEnabled =
    nonCustomerTestBookingVerified &&
    isTruthyFlag(env.REZGO_SERENE_LIVE_BOOKING_ENABLED);

  let stage: SereneRezgoGateStage = "awaiting_credentials";
  let nextActionLabel =
    "Awaiting Serene's active Rezgo CID + API key (store in REZGO_SERENE_CID & REZGO_SERENE_API_KEY; never in code/forms).";

  if (liveBookingToggleEnabled) {
    stage = "live_isolated_secondary";
    nextActionLabel =
      "Live isolated Rezgo connection active (secondary property boundary enforced).";
  } else if (nonCustomerTestBookingVerified) {
    stage = "ready_for_isolated_live_enablement";
    nextActionLabel =
      "All 5 safety gates passed — set REZGO_SERENE_LIVE_BOOKING_ENABLED=true when ready to open bookings.";
  } else if (dccProductMappingVerified && writtenCommissionOwnershipConfirmed) {
    stage = "awaiting_non_customer_booking_test";
    nextActionLabel =
      "Run non-customer Rezgo test booking flow and verify clean cancellation/void before live enablement.";
  } else if (readOnlyInventoryInspected) {
    stage = "readonly_inspected_awaiting_mapping_and_written_commission";
    nextActionLabel =
      "Map Rezgo UIDs to DCC Juneau whale/shuttle SKUs and confirm 10% direct commission ownership in writing.";
  } else if (credentialsStoredSecurelyInEnv) {
    stage = "ready_for_readonly_inspection";
    nextActionLabel =
      "Credentials stored — run read-only Rezgo inventory & availability inspection (zero mutations).";
  }

  return {
    operatorId: "juneau-tours-whale-watch",
    operatorName: "Juneau Tours & Whale Watch",
    contactReference: "Serene",
    isolatedSecondaryProperty: true,
    influencesPrimaryDccRanking: false,
    stage,
    liveBookingAllowed: liveBookingToggleEnabled,
    gates: {
      credentialsStoredSecurelyInEnv,
      readOnlyInventoryInspected,
      dccProductMappingVerified,
      writtenCommissionOwnershipConfirmed,
      nonCustomerTestBookingVerified,
      liveBookingToggleEnabled,
    },
    knownViatorSupplierPrefix: "5857",
    candidateSkusToReconcile: ["5857P22", "5857P23", "5857SHUTTLE"],
    nextActionLabel,
  };
}

/**
 * Strictly read-only Rezgo inspection (`i=company` and `i=search` via HTTP GET).
 * Never creates holds, bookings, payments, cancellations, customer messages, or mutations.
 */
export async function inspectSereneRezgoInventoryReadOnly(options?: {
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
  searchDate?: string;
}): Promise<RezgoReadOnlyInspectionResult> {
  const env = options?.env ?? process.env;
  const checkedAt = new Date().toISOString();
  const cid = (env.REZGO_SERENE_CID || "").trim();
  const apiKey = (env.REZGO_SERENE_API_KEY || "").trim();
  const searchDate =
    options?.searchDate && /^\d{4}-\d{2}-\d{2}$/.test(options.searchDate)
      ? options.searchDate
      : null;

  const writeCapabilitiesDisabled = {
    commitBookingDisabled: true as const,
    paymentCaptureDisabled: true as const,
    cancellationDisabled: true as const,
    customerMessagingDisabled: true as const,
    liveDirectCheckoutEnabled: false as const,
  };

  if (!cid || apiKey.length < 8) {
    const { supplierConflicts } = reconcileRezgoItemsAcrossSurfaces({
      items: [],
      companyName: null,
      searchDate,
    });
    return {
      ok: false,
      readOnly: true,
      mutatedRemoteState: false,
      isolatedSecondaryProperty: true,
      checkedAt,
      searchDate,
      status: "credentials_missing",
      companyName: null,
      domain: null,
      currency: null,
      itemsCount: 0,
      items: [],
      reconciliation: [],
      supplierConflicts,
      writeCapabilitiesDisabled,
      errorMessage:
        "Missing REZGO_SERENE_CID or REZGO_SERENE_API_KEY in server environment.",
    };
  }

  const fetchFn = options?.fetchImpl ?? fetch;
  const buildReadOnlyUrl = (instruction: "company" | "search") => {
    const u = new URL(REZGO_XML_ENDPOINT);
    u.searchParams.set("transcode", cid);
    u.searchParams.set("key", apiKey);
    u.searchParams.set("i", instruction);
    if (instruction === "search" && searchDate) {
      u.searchParams.set("d", searchDate);
    }
    return u.toString();
  };

  try {
    const requestHeaders = {
      Accept: "*/*",
      "User-Agent": "DestinationCommandCenter-ReadOnlyInspector/1.0",
    };
    const [companyRes, searchRes] = await Promise.all([
      fetchFn(buildReadOnlyUrl("company"), {
        method: "GET",
        headers: requestHeaders,
        cache: "no-store",
        signal: AbortSignal.timeout(6500),
      }),
      fetchFn(buildReadOnlyUrl("search"), {
        method: "GET",
        headers: requestHeaders,
        cache: "no-store",
        signal: AbortSignal.timeout(6500),
      }),
    ]);

    const [companyXml, searchXml] = await Promise.all([
      companyRes.text(),
      searchRes.text(),
    ]);

    if (!companyRes.ok || !searchRes.ok) {
      const responseNoteRaw =
        extractXmlTag(companyXml, "error") ||
        extractXmlTag(searchXml, "error") ||
        extractXmlTag(companyXml, "response") ||
        extractXmlTag(searchXml, "response") ||
        null;
      const safeNote = sanitizeRezgoDiagnosticMessage(responseNoteRaw, [cid, apiKey]);
      const { supplierConflicts } = reconcileRezgoItemsAcrossSurfaces({
        items: [],
        companyName: null,
        searchDate,
      });
      return {
        ok: false,
        readOnly: true,
        mutatedRemoteState: false,
        isolatedSecondaryProperty: true,
        checkedAt,
        searchDate,
        status: "rezgo_http_error",
        companyName: null,
        domain: null,
        currency: null,
        itemsCount: 0,
        items: [],
        reconciliation: [],
        supplierConflicts,
        writeCapabilitiesDisabled,
        errorMessage: `Rezgo read-only GET returned HTTP ${companyRes.status} / ${searchRes.status}${
          safeNote ? ` (${safeNote.slice(0, 140)})` : ""
        }.`,
      };
    }

    const xmlError =
      extractXmlTag(companyXml, "error") || extractXmlTag(searchXml, "error");
    if (xmlError) {
      const safeError = sanitizeRezgoDiagnosticMessage(xmlError, [cid, apiKey]);
      const { supplierConflicts } = reconcileRezgoItemsAcrossSurfaces({
        items: [],
        companyName: extractXmlTag(companyXml, "company_name"),
        searchDate,
      });
      return {
        ok: false,
        readOnly: true,
        mutatedRemoteState: false,
        isolatedSecondaryProperty: true,
        checkedAt,
        searchDate,
        status: "rezgo_api_error",
        companyName: extractXmlTag(companyXml, "company_name"),
        domain: extractXmlTag(companyXml, "domain"),
        currency: extractXmlTag(companyXml, "currency"),
        itemsCount: 0,
        items: [],
        reconciliation: [],
        supplierConflicts,
        writeCapabilitiesDisabled,
        errorMessage: `Rezgo XML error: ${safeError}`,
      };
    }

    const companyName = extractXmlTag(companyXml, "company_name");
    const domain = extractXmlTag(companyXml, "domain");
    const currency = extractXmlTag(companyXml, "currency");
    const items = parseRezgoItemsXml(searchXml, { searchDate });
    const { reconciliation, supplierConflicts } = reconcileRezgoItemsAcrossSurfaces({
      items,
      companyName,
      searchDate,
    });

    return {
      ok: true,
      readOnly: true,
      mutatedRemoteState: false,
      isolatedSecondaryProperty: true,
      checkedAt,
      searchDate,
      status: "inspected_ok",
      companyName,
      domain,
      currency,
      itemsCount: items.length,
      items,
      reconciliation,
      supplierConflicts,
      writeCapabilitiesDisabled,
      errorMessage: null,
    };
  } catch (err) {
    const rawErr =
      err instanceof Error ? err.message : "Read-only Rezgo request failed.";
    const safeError =
      sanitizeRezgoDiagnosticMessage(rawErr, [cid, apiKey]) ||
      "Read-only Rezgo request failed.";
    const { supplierConflicts } = reconcileRezgoItemsAcrossSurfaces({
      items: [],
      companyName: null,
      searchDate,
    });
    return {
      ok: false,
      readOnly: true,
      mutatedRemoteState: false,
      isolatedSecondaryProperty: true,
      checkedAt,
      searchDate,
      status: "network_error",
      companyName: null,
      domain: null,
      currency: null,
      itemsCount: 0,
      items: [],
      reconciliation: [],
      supplierConflicts,
      writeCapabilitiesDisabled,
      errorMessage: safeError,
    };
  }
}

interface CachedInspectionEntry {
  expiresAtMs: number;
  result: RezgoReadOnlyInspectionResult;
}

const rezgoReadOnlyCache = new Map<string, CachedInspectionEntry>();

export function clearRezgoReadOnlyCacheForTesting(): void {
  rezgoReadOnlyCache.clear();
}

export async function getCachedSereneRezgoInspection(options?: {
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
  searchDate?: string;
  ttlMs?: number;
  bypassCache?: boolean;
}): Promise<RezgoReadOnlyInspectionResult> {
  const useCache =
    !options?.bypassCache && !options?.fetchImpl && (!options?.env || options.env === process.env);
  const cacheKey = `serene:${options?.searchDate || "catalog"}`;
  const now = Date.now();

  if (useCache) {
    const existing = rezgoReadOnlyCache.get(cacheKey);
    if (existing && existing.expiresAtMs > now) {
      return existing.result;
    }
  }

  const result = await inspectSereneRezgoInventoryReadOnly({
    env: options?.env,
    fetchImpl: options?.fetchImpl,
    searchDate: options?.searchDate,
  });

  if (useCache) {
    const ttlMs =
      typeof options?.ttlMs === "number" && Number.isFinite(options.ttlMs)
        ? Math.max(5_000, options.ttlMs)
        : result.ok
          ? 120_000
          : 30_000;
    rezgoReadOnlyCache.set(cacheKey, {
      expiresAtMs: now + ttlMs,
      result,
    });
  }

  return result;
}

function classifyJuneauTourActivity(
  title: string,
  optionName: string | null,
): NormalizedJuneauSupplierTour["activityCategory"] {
  const text = `${title} ${optionName || ""}`.toLowerCase();
  const hasWhale = /whale/i.test(text);
  const hasGlacier = /mendenhall|glacier/i.test(text);
  if (hasWhale && hasGlacier) return "combo-whale-glacier";
  if (hasWhale) return "whale-watching";
  if (hasGlacier || /shuttle|trolley|blue bus/i.test(text)) return "mendenhall-glacier-tours";
  return "juneau-sightseeing";
}

export async function buildNormalizedJuneauSupplierFeed(options?: {
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
  searchDate?: string;
  bypassCache?: boolean;
}): Promise<NormalizedJuneauSupplierFeed> {
  const inspection = await getCachedSereneRezgoInspection({
    env: options?.env,
    fetchImpl: options?.fetchImpl,
    searchDate: options?.searchDate,
    bypassCache: options?.bypassCache,
  });

  const reconciliations = inspection.reconciliation || [];
  const recByUidAndOption = new Map<string, RezgoProductCrossSurfaceReconciliation>();
  for (const r of reconciliations) {
    recByUidAndOption.set(`${r.rezgoUid}|${r.rezgoOptionName || ""}`, r);
  }

  const normalizedTours: NormalizedJuneauSupplierTour[] = inspection.items.map((item, idx) => {
    const rec = recByUidAndOption.get(`${item.uid}|${item.optionName || ""}`);
    const matchedCode = rec?.matchedDccCatalogProductCode ?? null;
    const approvedSpec = matchedCode ? APPROVED_JUNEAU_5857_VIATOR_CATALOG[matchedCode] : null;
    const spots =
      item.availableSpotsOnSearchDate !== undefined && item.availableSpotsOnSearchDate !== null
        ? item.availableSpotsOnSearchDate
        : null;
    const overallSpots =
      item.availabilityOverall !== undefined && item.availabilityOverall !== null
        ? item.availabilityOverall
        : null;

    return {
      normalizedTourId: `dcc:rezgo:juneau-tours:${item.uid || idx + 1}`,
      rezgoUid: item.uid,
      rezgoCom: item.com,
      operatorId: "juneau-tours-whale-watch",
      operatorName: inspection.companyName || "Juneau Tours & Whale Watch",
      verifiedRezgoCompanyName: inspection.companyName,
      title: item.itemName,
      optionName: item.optionName,
      activityCategory: classifyJuneauTourActivity(item.itemName, item.optionName),
      durationLabel: item.duration,
      durationMinutes: item.durationMinutes ?? approvedSpec?.durationMinutes ?? null,
      adultPriceUsd: parsePositivePrice(item.adultPrice),
      childPriceUsd: parsePositivePrice(item.childPrice),
      currency: item.currency || inspection.currency || "USD",
      departureTimes: item.departureTimes || (item.departureTime ? [item.departureTime] : []),
      startingLocation: item.startingLocation,
      dateChecked: inspection.searchDate ?? null,
      availableSpots: spots ?? overallSpots,
      availabilitySemantics:
        spots !== null
          ? "rezgo_date_search_spots"
          : overallSpots !== null
            ? "rezgo_catalog_overall"
            : "unconfirmed_check_provider",
      matchConfidence: rec?.matchConfidence ?? "unmatched_rezgo_only",
      matchedViatorProductCode: matchedCode,
      approvedFallbackViatorUrl: approvedSpec?.canonicalViatorUrl ?? null,
      liveDirectRezgoCheckoutEnabled: false,
      isolatedSecondaryProperty: true,
      influencesPrimaryDccRanking: false,
    };
  });

  return {
    ok: inspection.ok,
    source: inspection.ok ? "dcc_rezgo_readonly_xml" : "dcc_approved_fallback",
    generatedAt: new Date().toISOString(),
    checkedAt: inspection.checkedAt,
    dateChecked: inspection.searchDate ?? null,
    readOnly: true,
    liveDirectRezgoCheckoutEnabled: false,
    isolatedSecondaryProperty: true,
    influencesPrimaryDccRanking: false,
    rezgoStatus: inspection.status,
    verifiedCompanyName: inspection.companyName,
    verifiedRezgoDomain: inspection.domain,
    currency: inspection.currency || "USD",
    toursCount: normalizedTours.length,
    tours: normalizedTours,
    supplierConflicts: inspection.supplierConflicts || [],
  };
}
