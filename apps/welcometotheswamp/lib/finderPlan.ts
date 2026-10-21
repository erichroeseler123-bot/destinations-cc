export const FINDER_PLAN_KEY = "wts-finder-plan-v1";

export type FinderPlan = {
  travelDate: string;
  adults: number;
  childrenAges: number[];
  transportation: "hotel_pickup" | "self_drive" | "either";
  boatType: "small_airboat" | "large_airboat" | "any";
};

// Save choices only. Availability and seat confirmations must always be rechecked.
export function readFinderPlan(raw: string | null, today: string): FinderPlan | null {
  try {
    const p = JSON.parse(raw || "null");
    if (!p || p.version !== 1 ||
      typeof p.travelDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(p.travelDate) ||
      !Number.isFinite(Date.parse(`${p.travelDate}T12:00:00Z`)) ||
      new Date(`${p.travelDate}T12:00:00Z`).toISOString().slice(0, 10) !== p.travelDate ||
      ![1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20].includes(p.adults) ||
      !Array.isArray(p.childrenAges) || ![0, 1, 2, 3, 4, 5, 6, 8].includes(p.childrenAges.length) ||
      !p.childrenAges.every((age: unknown) => Number.isInteger(age) && Number(age) >= 0 && Number(age) <= 12) ||
      !["hotel_pickup", "self_drive", "either"].includes(p.transportation) ||
      !["small_airboat", "large_airboat", "any"].includes(p.boatType)) return null;
    return {
      travelDate: p.travelDate < today ? today : p.travelDate,
      adults: p.adults,
      childrenAges: [...p.childrenAges],
      transportation: p.transportation,
      boatType: p.boatType,
    };
  } catch {
    return null;
  }
}
