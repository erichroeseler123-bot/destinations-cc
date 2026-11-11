export const SOUTHERN_STYLE_COMBO_SLUG = "all-day-city-plantation-combo";
export const HELD_COMBO_SLUG = "covered-boat-plantation-combo";
export const HELD_JEAN_LAFITTE_SLUG = "jeanlafitte-swamp-tour-with-hotel-pickup";

export const SOUTHERN_STYLE_COMBO_DURATION_COPY =
  "Duration depends on current itinerary. We can confirm details when you check availability.";

export const HELD_COMBO_REASON =
  "Booking configuration requires manual confirmation.";

export const HELD_COMBO_BANNER =
  "Details pending operator verification — call 504-484-9687 to confirm.";

export const HELD_JEAN_LAFITTE_REASON =
  "Direct Jean Lafitte Swamp Tours partner checkout and hotel-shuttle option mapping are temporarily held pending operator confirmation.";

export const HELD_JEAN_LAFITTE_BANNER =
  "Direct Jean Lafitte checkout is pending operator confirmation — call 504-484-9687 or compare verified hotel-pickup swamp boat options.";

export const TRUTH_LAYER_STATUS = {
  [SOUTHERN_STYLE_COMBO_SLUG]: {
    confidence: "review_needed" as const,
    volatility: "high" as const,
    door_to_door_minutes: null,
  },
  [HELD_COMBO_SLUG]: {
    confidence: "review_needed" as const,
    volatility: "high" as const,
    door_to_door_minutes: null,
  },
  [HELD_JEAN_LAFITTE_SLUG]: {
    confidence: "review_needed" as const,
    volatility: "high" as const,
    door_to_door_minutes: null,
  },
};

export function getDecisionEligibility(slug: string) {
  if (slug === HELD_COMBO_SLUG) {
    return { eligibility: false as const, reason: HELD_COMBO_REASON };
  }
  if (slug === HELD_JEAN_LAFITTE_SLUG) {
    return { eligibility: false as const, reason: HELD_JEAN_LAFITTE_REASON };
  }
  return { eligibility: true as const, reason: null };
}

export function isHeldProduct(slug: string) {
  return slug === HELD_COMBO_SLUG || slug === HELD_JEAN_LAFITTE_SLUG;
}
