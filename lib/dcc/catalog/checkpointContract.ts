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
