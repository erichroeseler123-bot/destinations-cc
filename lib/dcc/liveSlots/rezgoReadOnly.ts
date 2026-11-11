/**
 * Isolated Read-Only Rezgo Inspection & 6-Gate Safe Connection Guard
 * (Serene — Juneau Tours & Whale Watch)
 *
 * Strict Governance & Promise Invariants:
 * 1. Credentials (`REZGO_SERENE_CID` / `REZGO_SERENE_API_KEY`) are read ONLY from server
 *    environment variables — never embedded in source code, client bundles, or public forms.
 * 2. Inspection (`inspectSereneRezgoInventoryReadOnly`) uses strictly read-only Rezgo XML
 *    `i=company` and `i=search` instructions (`GET` only). Zero booking (`i=commit`), hold,
 *    or mutation instructions exist in this module.
 * 3. Property isolation (`isolatedSecondaryProperty: true`, `influencesPrimaryDccRanking: false`)
 *    is hard-pinned in code so Serene's inventory remains isolated and secondary as promised.
 * 4. Live customer booking remains hard-locked (`liveBookingEnabled: false`) until ALL five
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

export interface RezgoInspectedItemSummary {
  uid: string;
  com: string | null;
  itemName: string;
  optionName: string | null;
  duration: string | null;
  adultPrice: string | null;
  currency: string | null;
  startingLocation: string | null;
}

export interface RezgoReadOnlyInspectionResult {
  ok: boolean;
  readOnly: true;
  mutatedRemoteState: false;
  isolatedSecondaryProperty: true;
  checkedAt: string;
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
  errorMessage: string | null;
}

const REZGO_XML_ENDPOINT = "https://xml.rezgo.com/xml";

function isTruthyFlag(value: string | undefined): boolean {
  const norm = (value || "").trim().toLowerCase();
  return norm === "1" || norm === "true" || norm === "yes";
}

function extractXmlTag(xmlBlock: string, tag: string): string | null {
  const cdataRe = new RegExp(
    `<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`,
    "i",
  );
  const cdataMatch = xmlBlock.match(cdataRe);
  if (cdataMatch && cdataMatch[1] !== undefined) {
    return cdataMatch[1].trim() || null;
  }
  const plainRe = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "i");
  const plainMatch = xmlBlock.match(plainRe);
  if (plainMatch && plainMatch[1] !== undefined) {
    return plainMatch[1].trim() || null;
  }
  return null;
}

export function parseRezgoItemsXml(xml: string): RezgoInspectedItemSummary[] {
  const items: RezgoInspectedItemSummary[] = [];
  // In Rezgo XML, each outer <item> block begins with <item><uid>...</uid>, whereas inner title tags are <item><![CDATA[...]]></item>
  const outerItemRe = /<item\b[^>]*>(?=\s*<(?:uid|com)\b)([\s\S]*?)(?=<item\b[^>]*>\s*<(?:uid|com)\b|<\/response>|$)/gi;
  let match: RegExpExecArray | null;
  while ((match = outerItemRe.exec(xml)) !== null) {
    const rawBlock = match[1] || "";
    const lastCloseIdx = rawBlock.lastIndexOf("</item>");
    const block = lastCloseIdx >= 0 ? rawBlock.slice(0, lastCloseIdx) : rawBlock;
    const uid = extractXmlTag(block, "uid") || "";
    const itemName =
      extractXmlTag(block, "item") ||
      extractXmlTag(block, "name") ||
      extractXmlTag(block, "title") ||
      "";
    if (!uid && !itemName) continue;
    items.push({
      uid: uid || "unindexed",
      com: extractXmlTag(block, "com"),
      itemName: itemName || `Rezgo Item ${uid}`,
      optionName: extractXmlTag(block, "option"),
      duration: extractXmlTag(block, "duration"),
      adultPrice:
        extractXmlTag(block, "price_adult") || extractXmlTag(block, "base_prices"),
      currency: extractXmlTag(block, "currency_base") || extractXmlTag(block, "currency"),
      startingLocation:
        extractXmlTag(block, "city") || extractXmlTag(block, "starting_location"),
    });
  }
  return items;
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
 * Never creates holds, bookings, customer records, or mutations.
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

  if (!cid || apiKey.length < 8) {
    return {
      ok: false,
      readOnly: true,
      mutatedRemoteState: false,
      isolatedSecondaryProperty: true,
      checkedAt,
      status: "credentials_missing",
      companyName: null,
      domain: null,
      currency: null,
      itemsCount: 0,
      items: [],
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
    if (
      instruction === "search" &&
      options?.searchDate &&
      /^\d{4}-\d{2}-\d{2}$/.test(options.searchDate)
    ) {
      u.searchParams.set("d", options.searchDate);
    }
    return u.toString();
  };

  try {
    const [companyRes, searchRes] = await Promise.all([
      fetchFn(buildReadOnlyUrl("company"), {
        method: "GET",
        headers: { Accept: "application/xml, text/xml" },
        cache: "no-store",
        signal: AbortSignal.timeout(4000),
      }),
      fetchFn(buildReadOnlyUrl("search"), {
        method: "GET",
        headers: { Accept: "application/xml, text/xml" },
        cache: "no-store",
        signal: AbortSignal.timeout(4000),
      }),
    ]);

    if (!companyRes.ok || !searchRes.ok) {
      return {
        ok: false,
        readOnly: true,
        mutatedRemoteState: false,
        isolatedSecondaryProperty: true,
        checkedAt,
        status: "rezgo_http_error",
        companyName: null,
        domain: null,
        currency: null,
        itemsCount: 0,
        items: [],
        errorMessage: `Rezgo read-only GET returned HTTP ${companyRes.status} / ${searchRes.status}.`,
      };
    }

    const [companyXml, searchXml] = await Promise.all([
      companyRes.text(),
      searchRes.text(),
    ]);

    const xmlError =
      extractXmlTag(companyXml, "error") || extractXmlTag(searchXml, "error");
    if (xmlError) {
      return {
        ok: false,
        readOnly: true,
        mutatedRemoteState: false,
        isolatedSecondaryProperty: true,
        checkedAt,
        status: "rezgo_api_error",
        companyName: null,
        domain: null,
        currency: null,
        itemsCount: 0,
        items: [],
        errorMessage: `Rezgo XML error: ${xmlError}`,
      };
    }

    const items = parseRezgoItemsXml(searchXml);
    return {
      ok: true,
      readOnly: true,
      mutatedRemoteState: false,
      isolatedSecondaryProperty: true,
      checkedAt,
      status: "inspected_ok",
      companyName: extractXmlTag(companyXml, "company_name"),
      domain: extractXmlTag(companyXml, "domain"),
      currency: extractXmlTag(companyXml, "currency"),
      itemsCount: items.length,
      items,
      errorMessage: null,
    };
  } catch (err) {
    return {
      ok: false,
      readOnly: true,
      mutatedRemoteState: false,
      isolatedSecondaryProperty: true,
      checkedAt,
      status: "network_error",
      companyName: null,
      domain: null,
      currency: null,
      itemsCount: 0,
      items: [],
      errorMessage:
        err instanceof Error ? err.message : "Read-only Rezgo request failed.",
    };
  }
}
