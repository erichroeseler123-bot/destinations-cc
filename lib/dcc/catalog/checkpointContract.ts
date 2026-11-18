export const SAVED_PRE_JUNEAU_GLOBAL_SCHEDULE_CURSOR_C0 =
  "MTc5MzQ4MTA1OTAwMDAwMHwxMDA1MzlQOQ==";

export const CLOBBERED_POST_JUNEAU_GLOBAL_SCHEDULE_CURSOR_C1 =
  "MTc5MzQ4NTEzMTAwMDAwMHw1NTY2ODM5UDE=";

export const GLOBAL_PRODUCTS_MODIFIED_SINCE_STREAM_KEY = "viator_products_modified_since";
export const GLOBAL_SCHEDULES_MODIFIED_SINCE_STREAM_KEY =
  "viator_availability_schedules_modified_since";

export type GlobalModifiedSinceStreamKey =
  | typeof GLOBAL_PRODUCTS_MODIFIED_SINCE_STREAM_KEY
  | typeof GLOBAL_SCHEDULES_MODIFIED_SINCE_STREAM_KEY;

export const DESTINATION_SCHEDULE_REFRESH_PREFIX = "viator_destination_schedule_refresh:";
export const DESTINATION_SCHEDULE_REFRESH_PROVIDER = "viator_destination_schedule_refresh";
export const DESTINATION_BACKFILL_PREFIX = "viator_backfill:";

/**
 * Compile-time mutually exclusive selector for Viator Partner API v2
 * `/availability/schedules/modified-since` and `/products/modified-since`.
 * Per Viator documentation, `cursor` and `modified-since` must NEVER be combined.
 */
export type ViatorModifiedSinceEntrySelector =
  | { cursor?: string; modifiedSince?: never }
  | { modifiedSince?: string; cursor?: never };

export type ValidatedViatorModifiedSinceSelector =
  | { mode: "none"; cursor?: undefined; modifiedSince?: undefined }
  | { mode: "cursor"; cursor: string; modifiedSince?: undefined }
  | { mode: "modified_since"; modifiedSince: string; cursor?: undefined };

const VIATOR_ISO8601_UTC_REGEX =
  /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(?:\.(\d{1,9}))?Z$/;

/**
 * Validates that a `modified-since` value is a genuine ISO-8601 UTC timestamp (`...Z`)
 * accepted by Viator Partner API v2, rejecting non-UTC offsets, pre-encoded `%3A` strings,
 * impossible calendar dates, Base64 tokens, and future timestamps.
 */
export function assertViatorIso8601UtcTimestamp(raw: unknown): string {
  if (typeof raw !== "string") {
    throw new Error("viator_modified_since_invalid_timestamp_type: modifiedSince must be an ISO-8601 UTC string");
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("viator_modified_since_empty_timestamp: modifiedSince must be non-empty when supplied");
  }
  if (trimmed.includes("%3A") || trimmed.includes("%3a")) {
    throw new Error(
      "viator_modified_since_preencoded_timestamp: pass raw ISO-8601 UTC ending in Z; URLSearchParams encodes colons once",
    );
  }
  const match = VIATOR_ISO8601_UTC_REGEX.exec(trimmed);
  if (!match) {
    throw new Error(
      `viator_modified_since_invalid_iso8601_utc: '${trimmed}' must match YYYY-MM-DDTHH:mm:ss[.sss]Z in UTC`,
    );
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  const fracMs = match[7] ? Number(match[7].slice(0, 3).padEnd(3, "0")) : 0;

  const utcMs = Date.UTC(year, month - 1, day, hour, minute, second, fracMs);
  const verifyDate = new Date(utcMs);
  if (
    !Number.isFinite(utcMs) ||
    verifyDate.getUTCFullYear() !== year ||
    verifyDate.getUTCMonth() !== month - 1 ||
    verifyDate.getUTCDate() !== day ||
    verifyDate.getUTCHours() !== hour ||
    verifyDate.getUTCMinutes() !== minute ||
    verifyDate.getUTCSeconds() !== second
  ) {
    throw new Error(
      `viator_modified_since_invalid_calendar_date: '${trimmed}' is not a valid calendar UTC timestamp`,
    );
  }
  if (utcMs > Date.now() + 60_000) {
    throw new Error(
      `viator_modified_since_future_timestamp: '${trimmed}' cannot be in the future`,
    );
  }
  return trimmed;
}

/**
 * Runtime validation enforcing strict mutual exclusion between `cursor` and `modifiedSince`,
 * non-empty opaque cursor strings, and strict ISO-8601 UTC `modifiedSince` timestamps.
 */
export function validateViatorModifiedSinceSelector(
  input?: { cursor?: unknown; modifiedSince?: unknown } | null,
): ValidatedViatorModifiedSinceSelector {
  if (!input) {
    return { mode: "none" };
  }
  const hasCursorProp = input.cursor !== undefined && input.cursor !== null;
  const hasModifiedSinceProp = input.modifiedSince !== undefined && input.modifiedSince !== null;

  if (hasCursorProp && typeof input.cursor !== "string") {
    throw new Error("viator_modified_since_invalid_cursor_type: cursor must be a string");
  }
  if (hasModifiedSinceProp && typeof input.modifiedSince !== "string") {
    throw new Error("viator_modified_since_invalid_timestamp_type: modifiedSince must be an ISO-8601 UTC string");
  }
  if (hasCursorProp && hasModifiedSinceProp) {
    throw new Error(
      "viator_modified_since_and_cursor_mutually_exclusive: cursor and modifiedSince cannot both be supplied",
    );
  }

  if (hasCursorProp) {
    const rawCursor = input.cursor as string;
    const trimmedCursor = rawCursor.trim();
    if (!trimmedCursor) {
      throw new Error("viator_modified_since_empty_cursor: cursor must be non-empty when supplied");
    }
    return { mode: "cursor", cursor: trimmedCursor };
  }

  if (hasModifiedSinceProp) {
    const validatedIso = assertViatorIso8601UtcTimestamp(input.modifiedSince);
    return { mode: "modified_since", modifiedSince: validatedIso };
  }

  return { mode: "none" };
}

/**
 * Extracts only the literal opaque `nextCursor` string emitted by Viator's response.
 * Never constructs, Base64-encodes, decodes, or infers a cursor locally.
 */
export function extractLiteralProviderNextCursor(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const raw = (payload as Record<string, unknown>).nextCursor;
  if (raw === undefined || raw === null || raw === "") {
    return null;
  }
  if (typeof raw !== "string") {
    throw new Error("viator_modified_since_invalid_provider_next_cursor: nextCursor must be a string");
  }
  if (raw.trim().length === 0 || raw !== raw.trim()) {
    throw new Error(
      "viator_modified_since_invalid_provider_next_cursor: nextCursor contained unexpected leading/trailing whitespace",
    );
  }
  return raw;
}

export function normalizeCheckpointDestinationSlug(slug: string): string {
  const norm = String(slug || "").trim().toLowerCase();
  if (!norm) {
    throw new Error("checkpoint_scope_violation: destination_slug must be non-empty");
  }
  return norm;
}

export function buildDestinationScheduleRefreshStreamKey(destinationSlug: string): string {
  const norm = normalizeCheckpointDestinationSlug(destinationSlug);
  return `${DESTINATION_SCHEDULE_REFRESH_PREFIX}${norm}`;
}

export function isGlobalModifiedSinceStreamKey(streamKey: string, provider?: string): boolean {
  const key = String(streamKey || "").trim();
  const prov = String(provider || "").trim();
  return (
    key === GLOBAL_PRODUCTS_MODIFIED_SINCE_STREAM_KEY ||
    key === GLOBAL_SCHEDULES_MODIFIED_SINCE_STREAM_KEY ||
    key.endsWith("_modified_since") ||
    prov === "viator_incremental" ||
    prov === "viator_schedule_pricing"
  );
}

export function assertValidCheckpointScope(input: {
  streamKey: string;
  provider: string;
  destinationSlug: string | null | undefined;
}): {
  streamKey: string;
  provider: string;
  destinationSlug: string | null;
} {
  const streamKey = String(input.streamKey || "").trim();
  const provider = String(input.provider || "").trim();
  if (!streamKey) {
    throw new Error("checkpoint_scope_violation: stream_key is required");
  }
  if (!provider) {
    throw new Error("checkpoint_scope_violation: provider is required");
  }

  const rawSlug = input.destinationSlug;
  const normalizedSlug =
    rawSlug === null || rawSlug === undefined ? null : String(rawSlug).trim().toLowerCase();

  const isGlobal = isGlobalModifiedSinceStreamKey(streamKey, provider);
  if (isGlobal) {
    if (rawSlug !== null && rawSlug !== undefined) {
      throw new Error(
        `checkpoint_scope_violation: global modified-since key '${streamKey}' requires destination_slug IS NULL (received '${String(rawSlug)}')`,
      );
    }
    if (
      streamKey.startsWith(DESTINATION_SCHEDULE_REFRESH_PREFIX) ||
      provider === DESTINATION_SCHEDULE_REFRESH_PROVIDER
    ) {
      throw new Error(
        `checkpoint_scope_violation: destination schedule refresh provider/key cannot target global modified-since cursor '${streamKey}'`,
      );
    }
    return { streamKey, provider, destinationSlug: null };
  }

  if (!normalizedSlug) {
    throw new Error(
      `checkpoint_scope_violation: non-global key '${streamKey}' requires a non-empty destination_slug`,
    );
  }
  if (rawSlug !== normalizedSlug) {
    throw new Error(
      `checkpoint_scope_violation: destination_slug '${String(rawSlug)}' must be lowercase and trimmed ('${normalizedSlug}')`,
    );
  }

  const isDestScheduleKey = streamKey.startsWith(DESTINATION_SCHEDULE_REFRESH_PREFIX);
  const isDestScheduleProvider = provider === DESTINATION_SCHEDULE_REFRESH_PROVIDER;
  if (isDestScheduleKey || isDestScheduleProvider) {
    if (!isDestScheduleKey || !isDestScheduleProvider) {
      throw new Error(
        `checkpoint_scope_violation: destination schedule refresh requires both stream_key prefix '${DESTINATION_SCHEDULE_REFRESH_PREFIX}' and provider '${DESTINATION_SCHEDULE_REFRESH_PROVIDER}'`,
      );
    }
    const expectedKey = `${DESTINATION_SCHEDULE_REFRESH_PREFIX}${normalizedSlug}`;
    if (streamKey !== expectedKey) {
      throw new Error(
        `checkpoint_scope_violation: stream_key '${streamKey}' does not match destination_slug '${normalizedSlug}' (expected '${expectedKey}')`,
      );
    }
  }

  if (streamKey.startsWith(DESTINATION_BACKFILL_PREFIX)) {
    const expectedBackfillKey = `${DESTINATION_BACKFILL_PREFIX}${normalizedSlug}`;
    if (streamKey !== expectedBackfillKey) {
      throw new Error(
        `checkpoint_scope_violation: backfill stream_key '${streamKey}' does not match destination_slug '${normalizedSlug}' (expected '${expectedBackfillKey}')`,
      );
    }
  }

  return { streamKey, provider, destinationSlug: normalizedSlug };
}
