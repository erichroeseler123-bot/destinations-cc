export function validateWaitlistRequest(body: unknown, today: string) {
  if (!body || typeof body !== "object") throw new Error("Please complete the request form.");
  const b = body as Record<string, unknown>;
  if (b.website || b.consent !== true) throw new Error("Please agree to save your request before continuing.");
  const email = typeof b.email === "string" ? b.email.trim() : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Please enter a valid email address.");
  const date = typeof b.travelDate === "string" ? b.travelDate.trim() : "";
  const parsed = new Date(`${date}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date || date < today) throw new Error("Choose a valid travel date that is not in the past.");
  const adults = b.adults === undefined ? 2 : b.adults, count = b.childrenCount === undefined ? 0 : b.childrenCount, ages = b.childrenAges === undefined ? [] : b.childrenAges;
  if (typeof adults !== "number" || !Number.isInteger(adults) || adults < 1 || adults > 50 || typeof count !== "number" || !Number.isInteger(count) || count < 0 || count > 8 || !Array.isArray(ages) || ages.length !== count || !ages.every(a => Number.isInteger(a) && a >= 0 && a <= 12)) throw new Error("Enter 1–50 adults and an age for each child (up to eight children aged 0–12).");
  const transportation = b.transportation ?? "either", boatType = b.boatType ?? "any", timeWindow = b.timeWindow ?? "any";
  if (!["hotel_pickup", "self_drive", "either"].includes(String(transportation)) || !["small_airboat", "large_airboat", "any"].includes(String(boatType)) || !["morning", "afternoon", "any"].includes(String(timeWindow))) throw new Error("Choose valid transportation, boat, and time preferences.");
  if ((b.name != null && (typeof b.name !== "string" || b.name.length > 120)) || (b.phone != null && (typeof b.phone !== "string" || b.phone.length > 40)) || (b.specificTourId !== undefined && (typeof b.specificTourId !== "string" || b.specificTourId.length > 100))) throw new Error("One of your contact fields is too long.");
  return { email, name: typeof b.name === "string" ? b.name.trim() : undefined, phone: typeof b.phone === "string" ? b.phone.trim() : undefined, travelDate: date, adults, childrenCount: count, childrenAges: ages as number[], transportation: transportation as "hotel_pickup" | "self_drive" | "either", boatType: boatType as "small_airboat" | "large_airboat" | "any", timeWindow: timeWindow as "morning" | "afternoon" | "any", specificTourId: b.specificTourId as string | undefined };
}
