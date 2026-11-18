import {
  UNVERIFIED_CRUISE_PORTAL_PRICE_LABEL,
  VERIFIED_OPERATOR_TARIFFS,
  VERIFIED_TARIFF_DATE_LONG,
  type VerifiedHelicopterTariff,
} from "./verifiedOperatorPricing";

/**
 * Cruise-line shore-excursion prices vary dynamically behind passenger login portals
 * (Princess Cruise Personalizer, HAL Navigator, NCL, Royal Caribbean, Disney, Carnival)
 * and are NEVER hardcoded or estimated here.
 *
 * Instead, travelers select a verified direct operator tariff (verified November 18, 2026)
 * and enter the exact cruise-line price shown in their own sailing portal to compare.
 */
export const SAVINGS_CHECKED_DATE = VERIFIED_TARIFF_DATE_LONG;
export const CRUISE_PORTAL_PRICE_NOTE = UNVERIFIED_CRUISE_PORTAL_PRICE_LABEL;

export const DIRECT_OPERATOR_BENCHMARKS: readonly VerifiedHelicopterTariff[] =
  VERIFIED_OPERATOR_TARIFFS;

export type BenchmarkTourId = VerifiedHelicopterTariff["id"] | "custom";

export const SAVINGS_OPTIONS: ReadonlyArray<{
  value: BenchmarkTourId;
  label: string;
}> = [
  ...VERIFIED_OPERATOR_TARIFFS.map((t) => ({
    value: t.id,
    label: `${t.operatorName} — ${t.tourName} ($${t.basePriceUsd} base, as of Nov 18, 2026)`,
  })),
  {
    value: "custom",
    label: "Enter custom direct / partner checkout total",
  },
];

export function getBenchmarkTariff(
  id: BenchmarkTourId,
): VerifiedHelicopterTariff | null {
  if (id === "custom") return null;
  return VERIFIED_OPERATOR_TARIFFS.find((t) => t.id === id) || null;
}

export function readPriceCents(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(trimmed)) return null;
  const cents = Math.round(Number(trimmed) * 100);
  return Number.isSafeInteger(cents) && cents > 0 && cents <= 10000000
    ? cents
    : null;
}

export function formatDollars(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
