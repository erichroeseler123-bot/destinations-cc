import { NextResponse } from "next/server";
import { authorizeControlCenterCaller } from "@/app/api/admin/control-center/route";
import {
  getCommercialHandoffById,
  isDccInternalArtifactNotProviderConfirmation,
  listCommercialOutcomes,
  recordCommercialOutcome,
  type CommercialProvider,
} from "@/lib/dcc/commerce";
import { syncAuthorizedBookingToCruisePromenade } from "@/lib/dcc/commerce/directOperatorActivationKit";
import { syncDurableLedgerWithPostgres } from "@/lib/dcc/storage/durableTransactionalStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  "X-Robots-Tag": "noindex, nofollow",
};

export const FAREHARBOR_WEBHOOK_ENDPOINT_URL =
  "https://www.destinationcommandcenter.com/api/v1/commerce/webhooks/fareharbor";

export const SAMPLE_RECONCILE_CSV = [
  "booking_ref,provider,handoff_id,product_code,gross_usd,commission_usd,status,booked_date,party_size,share_code,traveler_id",
  "VIA-2027-991042,viator,hof_sample_jfd_01,6251SHOREXICEWALK,918.00,73.44,confirmed,2027-06-14,2,,ctx_jfd_01",
  "GYG-2027-558210,getyourguide,,t598272,896.00,71.68,settled,2027-07-08,4,CPPLAN27,",
].join("\n");

type SupportedImportProvider = "viator" | "getyourguide" | "fareharbor" | "direct";

const ALLOWED_PROVIDERS = new Set<SupportedImportProvider>([
  "viator",
  "getyourguide",
  "fareharbor",
  "direct",
]);

function normalizeHeaderKey(raw: string): string {
  return raw
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function parseRfc4180Csv(rawCsv: string): Array<Record<string, string>> {
  const cleaned = rawCsv.replace(/^\uFEFF/, "").trim();
  if (!cleaned) return [];

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < cleaned.length; i += 1) {
    const ch = cleaned[i];
    if (inQuotes) {
      if (ch === '"') {
        if (cleaned[i + 1] === '"') {
          currentField += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        currentField += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      currentRow.push(currentField);
      currentField = "";
    } else if (ch === "\r" || ch === "\n") {
      if (ch === "\r" && cleaned[i + 1] === "\n") {
        i += 1;
      }
      currentRow.push(currentField);
      currentField = "";
      if (currentRow.some((cell) => cell.trim().length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentField += ch;
    }
  }

  currentRow.push(currentField);
  if (currentRow.some((cell) => cell.trim().length > 0)) {
    rows.push(currentRow);
  }

  if (rows.length < 2) return [];

  const headers = rows[0].map(normalizeHeaderKey);
  const objects: Array<Record<string, string>> = [];

  for (let r = 1; r < rows.length; r += 1) {
    const row = rows[r];
    const obj: Record<string, string> = {};
    for (let c = 0; c < headers.length; c += 1) {
      const key = headers[c];
      if (!key) continue;
      obj[key] = (row[c] ?? "").trim();
    }
    if (Object.values(obj).some((val) => val.length > 0)) {
      objects.push(obj);
    }
  }

  return objects;
}

function pickField(
  normalizedRow: Record<string, unknown>,
  aliases: readonly string[],
): string {
  for (const alias of aliases) {
    const val = normalizedRow[alias];
    if (val !== undefined && val !== null) {
      const str = String(val).trim();
      if (str.length > 0) return str;
    }
  }
  return "";
}

function parseMoneyAmount(raw: string): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[$,\sUSDusd]/g, "").trim();
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) return null;
  return Number(parsed.toFixed(2));
}

function normalizeProvider(
  raw: string,
  fallback: SupportedImportProvider,
): CommercialProvider {
  const lower = raw.trim().toLowerCase();
  if (!lower) return fallback;
  if (lower.includes("viator") || lower.includes("tripadvisor")) return "viator";
  if (lower.includes("getyourguide") || lower === "gyg") return "getyourguide";
  if (lower.includes("fareharbor") || lower === "fh") return "fareharbor";
  if (lower.includes("rezdy")) return "rezdy";
  if (lower.includes("square")) return "square";
  if (lower.includes("direct")) return "direct";
  if (ALLOWED_PROVIDERS.has(lower as SupportedImportProvider)) {
    return lower as SupportedImportProvider;
  }
  return fallback;
}

function mapStatusToEventType(
  rawStatus: string,
  paidCommissionAmount: number | null,
): string {
  const s = rawStatus.trim().toLowerCase();
  if (s.includes("cancel")) return "BOOKING_CANCELLED";
  if (s.includes("refund")) return "BOOKING_REFUNDED";
  if (s.includes("amend")) return "BOOKING_AMENDED";
  if (s.includes("pend")) return "BOOKING_PENDING";
  if (
    s.includes("settl") ||
    s.includes("reconcil") ||
    s.includes("paid") ||
    (paidCommissionAmount !== null && paidCommissionAmount > 0)
  ) {
    return "COMMISSION_RECONCILED";
  }
  if (s.includes("fulfill") || s.includes("complet") || s.includes("flown")) {
    return "BOOKING_FULFILLED";
  }
  return "BOOKING_CONFIRMED";
}

function buildWebhookReadinessSummary() {
  const queryTokenConfigured = Boolean(
    (process.env.FAREHARBOR_WEBHOOK_TOKEN || "").trim().length >= 16 ||
      (process.env.DCC_WTA_WEBHOOK_HMAC_SECRET || "").trim().length >= 16 ||
      (process.env.FAREHARBOR_USER_KEY || "").trim().length >= 16,
  );
  const apiHeadersConfigured = Boolean(
    (process.env.FAREHARBOR_APP_KEY || "").trim() &&
      (process.env.FAREHARBOR_USER_KEY || "").trim(),
  );
  const cpSyncSecretConfigured = Boolean(
    (process.env.DCC_CP_SERVICE_SECRET || "").trim(),
  );

  return {
    fareharborWebhookEndpointUrl: FAREHARBOR_WEBHOOK_ENDPOINT_URL,
    fareharborAuthReady: queryTokenConfigured || apiHeadersConfigured,
    fareharborQueryTokenConfigured: queryTokenConfigured,
    fareharborApiCredentialsConfigured: apiHeadersConfigured,
    cruisePromenadeSyncReady: cpSyncSecretConfigured,
  };
}

export async function GET(request: Request) {
  const callerAuth = await authorizeControlCenterCaller(request);
  if (!callerAuth.authorized) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      readiness: buildWebhookReadinessSummary(),
      sampleCsv: SAMPLE_RECONCILE_CSV,
    },
    { status: 200, headers: NO_STORE_HEADERS },
  );
}

export async function POST(request: Request) {
  const callerAuth = await authorizeControlCenterCaller(request);
  if (!callerAuth.authorized) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  let body: {
    format?: string;
    defaultProvider?: string;
    payload?: unknown;
  };
  try {
    body = (await request.json()) as {
      format?: string;
      defaultProvider?: string;
      payload?: unknown;
    };
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON request body." },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const format = (body.format || "").trim().toLowerCase();
  if (format !== "csv" && format !== "json") {
    return NextResponse.json(
      { ok: false, error: 'format must be "csv" or "json".' },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const rawDefaultProvider = (body.defaultProvider || "viator")
    .trim()
    .toLowerCase();
  const defaultProvider: SupportedImportProvider = ALLOWED_PROVIDERS.has(
    rawDefaultProvider as SupportedImportProvider,
  )
    ? (rawDefaultProvider as SupportedImportProvider)
    : "viator";

  let rawRows: Array<Record<string, unknown>> = [];
  if (format === "csv") {
    if (typeof body.payload !== "string" || !body.payload.trim()) {
      return NextResponse.json(
        { ok: false, error: "CSV payload must be a non-empty string." },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }
    rawRows = parseRfc4180Csv(body.payload);
  } else {
    if (typeof body.payload === "string") {
      try {
        const parsed = JSON.parse(body.payload);
        if (!Array.isArray(parsed)) {
          return NextResponse.json(
            { ok: false, error: "JSON string payload must parse to an array of rows." },
            { status: 400, headers: NO_STORE_HEADERS },
          );
        }
        rawRows = parsed as Array<Record<string, unknown>>;
      } catch {
        return NextResponse.json(
          { ok: false, error: "Invalid JSON string in payload." },
          { status: 400, headers: NO_STORE_HEADERS },
        );
      }
    } else if (Array.isArray(body.payload)) {
      rawRows = body.payload as Array<Record<string, unknown>>;
    } else {
      return NextResponse.json(
        { ok: false, error: "JSON payload must be an array of row objects." },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }
  }

  if (rawRows.length === 0) {
    return NextResponse.json(
      { ok: false, error: "No importable rows found in payload." },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  if (rawRows.length > 500) {
    return NextResponse.json(
      { ok: false, error: "Maximum 500 rows per reconcile import batch." },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  await syncDurableLedgerWithPostgres();

  const existingOutcomes = await listCommercialOutcomes({
    limit: 500,
    excludeQa: false,
  });
  const seenIdempotencyKeys = new Set<string>();
  for (const existing of existingOutcomes) {
    const key = `reconcile:${existing.provider}:${existing.providerBookingRef.trim().toLowerCase()}`;
    seenIdempotencyKeys.add(`${key}::${existing.eventType.toUpperCase()}`);
    if (
      existing.eventType === "COMMISSION_RECONCILED" ||
      (existing.paidCommission.amount ?? 0) > 0
    ) {
      seenIdempotencyKeys.add(key);
    }
  }

  let importedCount = 0;
  let duplicateCount = 0;
  let matchedHandoffCount = 0;
  let unmatchedCount = 0;
  let rejectedCount = 0;
  let importedGrossUsd = 0;
  let importedCommissionUsd = 0;
  const cpSyncDispatches: Promise<unknown>[] = [];
  const cpSyncShareCodes: string[] = [];

  const rowResults: Array<{
    rowIndex: number;
    idempotencyKey: string | null;
    provider: string;
    bookingRef: string;
    status: "imported" | "duplicate_skipped" | "rejected";
    outcomeId?: string;
    reconciliationStatus?: "matched" | "unmatched";
    matchedHandoffId?: string | null;
    cpShareCode?: string | null;
    reason?: string;
  }> = [];

  for (let idx = 0; idx < rawRows.length; idx += 1) {
    const rawObj = rawRows[idx];
    if (!rawObj || typeof rawObj !== "object") {
      rejectedCount += 1;
      rowResults.push({
        rowIndex: idx + 1,
        idempotencyKey: null,
        provider: defaultProvider,
        bookingRef: "",
        status: "rejected",
        reason: "Row is not an object.",
      });
      continue;
    }

    const normalizedRow: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(rawObj)) {
      normalizedRow[normalizeHeaderKey(k)] = v;
    }

    const bookingRef = pickField(normalizedRow, [
      "booking_ref",
      "order_id",
      "reference",
      "provider_booking_ref",
      "booking_id",
      "transaction_ref",
      "external_order_id",
    ]);
    const provider = normalizeProvider(
      pickField(normalizedRow, ["provider", "source", "network", "platform"]),
      defaultProvider,
    );

    if (!bookingRef) {
      rejectedCount += 1;
      rowResults.push({
        rowIndex: idx + 1,
        idempotencyKey: null,
        provider,
        bookingRef: "",
        status: "rejected",
        reason: "Missing booking_ref / order_id / reference.",
      });
      continue;
    }

    if (isDccInternalArtifactNotProviderConfirmation(bookingRef)) {
      rejectedCount += 1;
      rowResults.push({
        rowIndex: idx + 1,
        idempotencyKey: null,
        provider,
        bookingRef,
        status: "rejected",
        reason:
          "DCC internal receipt or handoff ID cannot be used as provider booking_ref.",
      });
      continue;
    }

    const handoffHint = pickField(normalizedRow, [
      "handoff_id",
      "sub_id",
      "utm_content",
      "dcc_handoff_id",
      "click_id",
      "partner_booking_ref",
    ]);
    const grossUsd = parseMoneyAmount(
      pickField(normalizedRow, [
        "gross_usd",
        "amount",
        "total",
        "booking_value",
        "gross",
        "total_price",
        "sale_amount",
      ]),
    );
    const commissionUsd = parseMoneyAmount(
      pickField(normalizedRow, [
        "commission_usd",
        "payout",
        "earnings",
        "commission",
        "paid_commission",
        "net_commission",
      ]),
    );
    const productCode =
      pickField(normalizedRow, [
        "product_code",
        "product",
        "sku",
        "tour_code",
        "item_id",
      ]) || null;
    const rawStatus = pickField(normalizedRow, [
      "status",
      "booking_status",
      "state",
      "event_type",
    ]);
    const rowShareCode =
      pickField(normalizedRow, [
        "share_code",
        "cp_share_code",
        "planner_code",
        "plan_code",
      ]) || null;
    const travelerId =
      pickField(normalizedRow, ["traveler_id", "context_id", "ctx"]) || null;
    const bookedDate =
      pickField(normalizedRow, [
        "booked_date",
        "travel_date",
        "tour_date",
        "date",
      ]) || null;
    const rawPartySize = pickField(normalizedRow, [
      "party_size",
      "guests",
      "pax",
      "travelers",
    ]);
    const parsedPartySize = rawPartySize ? Number(rawPartySize) : NaN;
    const bookedPartySize =
      Number.isInteger(parsedPartySize) && parsedPartySize > 0
        ? parsedPartySize
        : null;

    const eventType = mapStatusToEventType(rawStatus, commissionUsd);
    const idempotencyKey = `reconcile:${provider}:${bookingRef.trim().toLowerCase()}`;
    const scopedEventKey = `${idempotencyKey}::${eventType}`;

    if (
      seenIdempotencyKeys.has(scopedEventKey) ||
      (eventType === "COMMISSION_RECONCILED" &&
        seenIdempotencyKeys.has(idempotencyKey))
    ) {
      duplicateCount += 1;
      rowResults.push({
        rowIndex: idx + 1,
        idempotencyKey,
        provider,
        bookingRef,
        status: "duplicate_skipped",
      });
      continue;
    }

    const isCancelledOrRefunded =
      eventType === "BOOKING_CANCELLED" || eventType === "BOOKING_REFUNDED";
    const effectivePaidCommission = isCancelledOrRefunded ? 0 : commissionUsd;

    const outcome = await recordCommercialOutcome({
      reporterClientId: "admin:owner-control-center-reconcile-importer",
      reporterProvenance: "authorized_operational_evidence",
      provider,
      providerBookingRef: bookingRef.trim(),
      eventType,
      providerEventTime: null,
      handoffId: handoffHint || null,
      clickId: handoffHint || null,
      campaignOrRefValue: handoffHint || null,
      contextId: travelerId,
      bookedProductCode: productCode,
      bookedDate,
      bookedPartySize,
      bookingValueAmount: grossUsd,
      bookingValueCurrency: grossUsd !== null ? "USD" : null,
      estimatedCommissionAmount: effectivePaidCommission,
      estimatedCommissionCurrency:
        effectivePaidCommission !== null ? "USD" : null,
      paidCommissionAmount: effectivePaidCommission,
      paidCommissionCurrency: effectivePaidCommission !== null ? "USD" : null,
      rawPayload: {
        idempotencyKey,
        importFormat: format,
        rawStatus: rawStatus || "confirmed",
        shareCode: rowShareCode,
        travelerId,
      },
    });

    seenIdempotencyKeys.add(scopedEventKey);
    if (eventType === "COMMISSION_RECONCILED") {
      seenIdempotencyKeys.add(idempotencyKey);
    }

    if (outcome.duplicateDelivery) {
      duplicateCount += 1;
      rowResults.push({
        rowIndex: idx + 1,
        idempotencyKey,
        provider,
        bookingRef,
        status: "duplicate_skipped",
        outcomeId: outcome.outcomeId,
        reconciliationStatus: outcome.reconciliationStatus,
        matchedHandoffId: outcome.handoffId,
      });
      continue;
    }

    importedCount += 1;
    if (outcome.reconciliationStatus === "matched") {
      matchedHandoffCount += 1;
    } else {
      unmatchedCount += 1;
    }
    if (grossUsd !== null && !isCancelledOrRefunded) {
      importedGrossUsd = Number((importedGrossUsd + grossUsd).toFixed(2));
    }
    if (effectivePaidCommission !== null && effectivePaidCommission > 0) {
      importedCommissionUsd = Number(
        (importedCommissionUsd + effectivePaidCommission).toFixed(2),
      );
    }

    let resolvedShareCode = rowShareCode;
    if (!resolvedShareCode && outcome.handoffId) {
      const linkedHandoff = await getCommercialHandoffById(outcome.handoffId);
      const metaShare =
        (typeof linkedHandoff?.metadata?.shareCode === "string" &&
          linkedHandoff.metadata.shareCode.trim()) ||
        (typeof linkedHandoff?.metadata?.cpShareCode === "string" &&
          linkedHandoff.metadata.cpShareCode.trim()) ||
        null;
      if (metaShare) {
        resolvedShareCode = metaShare;
      }
    }

    if (resolvedShareCode) {
      cpSyncShareCodes.push(resolvedShareCode);
      cpSyncDispatches.push(
        syncAuthorizedBookingToCruisePromenade({
          shareCode: resolvedShareCode,
          bookingRef: bookingRef.trim(),
          provider,
          productCode,
          status: rawStatus || "confirmed",
          bookedDate,
          partySize: bookedPartySize,
        }),
      );
    }

    rowResults.push({
      rowIndex: idx + 1,
      idempotencyKey,
      provider,
      bookingRef,
      status: "imported",
      outcomeId: outcome.outcomeId,
      reconciliationStatus: outcome.reconciliationStatus,
      matchedHandoffId: outcome.handoffId,
      cpShareCode: resolvedShareCode,
    });
  }

  // Persist durable ledger state after batch reconciliation
  await syncDurableLedgerWithPostgres({ forcePushLocal: true });

  // Non-blocking Cruise Promenade booking sync (bounded to 1.8s timeout inside helper; fire-and-forget)
  if (cpSyncDispatches.length > 0) {
    void Promise.allSettled(cpSyncDispatches);
  }

  return NextResponse.json(
    {
      ok: true,
      format,
      totalRows: rawRows.length,
      importedCount,
      duplicateCount,
      matchedHandoffCount,
      unmatchedCount,
      rejectedCount,
      importedGrossUsd,
      importedCommissionUsd,
      cpSyncTriggeredCount: cpSyncShareCodes.length,
      cpSyncShareCodes,
      readiness: buildWebhookReadinessSummary(),
      rows: rowResults,
    },
    { status: 200, headers: NO_STORE_HEADERS },
  );
}
