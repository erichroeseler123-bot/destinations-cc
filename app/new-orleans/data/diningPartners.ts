export type DiningPartnerStatus = "prospect" | "active" | "paused" | "ended";

export type DiningPartner = {
  id: string;
  name: string;
  status: DiningPartnerStatus;
  neighborhood: string;
  cuisineTags: string[];
  fitTags: string[];
  reservationUrl?: string;
  referralCode: string;
  seatedGuestFeeUsd: number;
  disclosure: string;
  visitorPerk?: string;
  notes?: string;
};

/**
 * Restaurant referral MVP
 *
 * Do not add a restaurant as `active` until there is an actual agreement.
 * The public dining experience must only surface active partners.
 *
 * Pilot commercial model:
 * - $5 per confirmed seated guest
 * - no upfront listing fee
 * - monthly manual reconciliation
 * - partner-specific fee can be changed only after agreement
 */
export const DEFAULT_SEATED_GUEST_FEE_USD = 5;

export const DINING_PARTNERS: DiningPartner[] = [];

export const ACTIVE_DINING_PARTNERS = DINING_PARTNERS.filter(
  (partner) => partner.status === "active",
);

export function buildDiningReferralUrl(partner: DiningPartner, source: string): string | null {
  if (!partner.reservationUrl) return null;

  try {
    const url = new URL(partner.reservationUrl);
    url.searchParams.set("wtono_ref", partner.referralCode);
    url.searchParams.set("wtono_src", source);
    return url.toString();
  } catch {
    return partner.reservationUrl;
  }
}

export const DINING_DISCLOSURE =
  "Dining Partner — Welcome to New Orleans Tours may receive a referral fee when guests we refer dine here. Recommendations are still based on stated visitor fit and practical logistics.";
