export const BRECKENRIDGE_SHARED_EXPERIMENT_ID = "breckenridge-shared-v1";
export const BRECKENRIDGE_SHARED_VARIANT_COOKIE = "dcc_breck_shared_v1";

export type BreckenridgeSharedVariant = "gosno_default";

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function readBreckenridgeSharedRolloutPercent(envValue = process.env.DCC_BRECKENRIDGE_SHARED_CHALLENGER_PERCENT) {
  const parsed = Number.parseInt(String(envValue || "0"), 10);
  return clampPercent(parsed);
}

export function normalizeBreckenridgeSharedVariant(value?: string | null): BreckenridgeSharedVariant | null {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return null;

  if ([
    "gosno",
    "default",
    "operator",
    "operator_execution",
    "gosno_default",
  ].includes(normalized)) {
    return "gosno_default";
  }

  return null;
}

export function resolveBreckenridgeSharedVariant(input: {
  override?: string | null;
  cookieVariant?: string | null;
  bucketKey: string;
  challengerPercent?: number;
}): BreckenridgeSharedVariant {
  const explicit = normalizeBreckenridgeSharedVariant(input.override);
  if (explicit) return explicit;

  const cookieVariant = normalizeBreckenridgeSharedVariant(input.cookieVariant);
  if (cookieVariant) return cookieVariant;

  clampPercent(input.challengerPercent ?? readBreckenridgeSharedRolloutPercent());
  hashString(input.bucketKey);
  return "gosno_default";
}

export function buildBreckenridgeSharedBucketKey(input: {
  forwardedFor?: string | null;
  userAgent?: string | null;
  acceptLanguage?: string | null;
  handoffId?: string | null;
}) {
  return [
    String(input.forwardedFor || "").split(",")[0]?.trim() || "no-ip",
    String(input.userAgent || "").trim() || "no-ua",
    String(input.acceptLanguage || "").trim() || "no-lang",
    String(input.handoffId || "").trim() || "no-handoff",
  ].join("|");
}
