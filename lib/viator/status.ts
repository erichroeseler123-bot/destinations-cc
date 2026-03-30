const DEFAULT_TIMEOUT_MS = 120_000;
const DEFAULT_RETRY_DELAY_MS = 60_000;
const DEFAULT_SUPPLIER_POLL_MS = 300_000;

export function getViatorApiTimeoutMs() {
  const raw = Number(process.env.VIATOR_API_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
  if (!Number.isFinite(raw)) return DEFAULT_TIMEOUT_MS;
  return Math.max(DEFAULT_TIMEOUT_MS, Math.trunc(raw));
}

export function getViatorStatusRetryDelayMs() {
  const raw = Number(process.env.VIATOR_STATUS_RETRY_DELAY_MS || DEFAULT_RETRY_DELAY_MS);
  if (!Number.isFinite(raw)) return DEFAULT_RETRY_DELAY_MS;
  return Math.max(DEFAULT_RETRY_DELAY_MS, Math.trunc(raw));
}

export function getViatorSupplierPollMs() {
  const raw = Number(process.env.VIATOR_SUPPLIER_POLL_MS || DEFAULT_SUPPLIER_POLL_MS);
  if (!Number.isFinite(raw)) return DEFAULT_SUPPLIER_POLL_MS;
  return Math.max(10_000, Math.trunc(raw));
}
