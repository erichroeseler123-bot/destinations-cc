export interface VerifiedClaims {
  hasHotelPickup: boolean;
  hasMinibus: boolean;
  hasVerifiedCoveredBoat: boolean;
  isFamilyFriendly: boolean;
  pace: "Relaxed" | "Moderate" | "Thrilling";
  groupSize: "Small Group" | "Medium Group" | "Large Group";
  location: "City" | "Plantation" | "Swamp";
}

export const PRODUCT_CLAIMS: Record<string, VerifiedClaims> = {
  "city-tour-of-new-orleans": {
    hasHotelPickup: true,
    hasMinibus: true,
    hasVerifiedCoveredBoat: false,
    isFamilyFriendly: true,
    pace: "Relaxed",
    groupSize: "Medium Group",
    location: "City",
  },
  "oak-alley-or-laura-plantation-tour": {
    hasHotelPickup: true,
    hasMinibus: true,
    hasVerifiedCoveredBoat: false,
    isFamilyFriendly: true,
    pace: "Moderate",
    groupSize: "Medium Group",
    location: "Plantation",
  },
  "covered-tour-boat": {
    hasHotelPickup: false,
    hasMinibus: false,
    hasVerifiedCoveredBoat: true,
    isFamilyFriendly: true,
    pace: "Relaxed",
    groupSize: "Medium Group",
    location: "Swamp",
  },
  "ragin-cajun-airboat-options": {
    hasHotelPickup: false,
    hasMinibus: false,
    hasVerifiedCoveredBoat: false,
    isFamilyFriendly: false,
    pace: "Thrilling",
    groupSize: "Small Group",
    location: "Swamp",
  }
};
