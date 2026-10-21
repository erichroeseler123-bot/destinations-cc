// Editorial records. Update checkedOn only after reviewing that specific fact's source.
export type FactStatus = "verified" | "unclear" | "conflicting" | "stale" | "unknown";
export type Category = "restrictions" | "pickup" | "pricing" | "timing" | "experience" | "terms";
export interface Fact { value: string | number | boolean | null; text: string; category: Category; status: FactStatus; sourceUrl: string | null; checkedOn: string | null; appliesTo: string; qualification?: string }
export interface FamilyTour { id: string; operator: string; name: string; officialUrl: string; bookingUrl: string; bookingInstruction: string; facts: Record<string, Fact> }
const CE = "https://www.cajunencounters.com/tours/swamp-tour-new-orleans";
const VIP = "https://www.cajunencounters.com/tours/vip-swamp-tour";
const AA = "https://airboatadventures.com/swamp-tours/";
const LTC = "https://louisianaswamp.com/swamp-tours/airboat-swamp-tour/";
const GL = "https://www.graylineneworleans.com/swamp-tours/large-airboat-swamp-adventure/";
const BE = "https://bigeasyswampadventures.com/reserve-online/";
const DATE = "2026-10-21";
function known(category: Category, value: Fact["value"], text: string, sourceUrl: string, appliesTo: string, qualification?: string): Fact { return { category, value, text, sourceUrl, appliesTo, qualification, checkedOn: DATE, status: "verified" }; }
function unknown(category: Category, text: string): Fact { return { category, value: null, text, status: "unknown", checkedOn: null, sourceUrl: null, appliesTo: "Selected product" }; }
function record(id: string, operator: string, name: string, officialUrl: string, bookingUrl: string, bookingInstruction: string, facts: Record<string, Fact>): FamilyTour {
  return { id, operator, name, officialUrl, bookingUrl, bookingInstruction, facts: {
    minAge: unknown("restrictions", "Minimum age not independently verified; ask the operator."),
    minHeight: unknown("restrictions", "No verified height rule in this record. This does not establish that none applies."),
    boarding: unknown("restrictions", "Boarding assistance and mobility requirements need confirmation."),
    weight: unknown("restrictions", "Weight limits or related charges have not been verified."),
    bathroom: unknown("experience", "Onboard bathroom access has not been verified."),
    capacity: unknown("experience", "Exact vessel capacity needs confirmation."),
    shade: unknown("experience", "Shade and rain protection need confirmation."),
    pickupWindow: unknown("pickup", "Exact pickup window and return location need confirmation for your booking."),
    totalMinutes: unknown("timing", "Total pickup-to-return time has not been verified."),
    cancellation: unknown("terms", "Current cancellation and weather terms need confirmation in the selected booking channel."),
    ...facts,
  } };
}
export const FAMILY_TOURS: FamilyTour[] = [
  record("ce-original", "Cajun Encounters", "Original Swamp Tour", CE, "https://book.singenuity.com/461/activity/details/2141/rates", "Select Original Swamp Tour and add transportation if needed.", {
    minAge: known("restrictions", 0, "All ages welcome on the Original tour.", CE, "Original public tour"),
    ride: known("experience", "calm", "Covered flat-bottom boat; wildlife-focused ride.", CE, "Original tour"),
    shade: known("experience", true, "Covered boat.", CE, "Original tour"),
    capacity: known("experience", 22, "Up to 22 guests per boat.", CE, "Original tour"),
    pickup: known("pickup", "hotel_addon", "Paid transport option from select French Quarter hotels and downtown visitor centers.", CE, "Original with transport", "Your exact pickup point must be confirmed."),
    onWater: known("timing", 120, "About 2 hours on the water.", CE, "Original tour"),
    totalMinutes: known("timing", 300, "Allow approximately 4–5 hours with transportation.", CE, "Original with transport", "An estimate, not a guaranteed return time."),
    price: known("pricing", "from", "Published from $39.99 per person; transportation costs extra. Child rates and final total need confirmation.", CE, "Original tour"),
  }),
  record("ce-vip", "Cajun Encounters", "VIP Small-Boat Swamp Tour", VIP, "https://book.singenuity.com/461/activity/details/3154/rates", "Select the public VIP tour. Ask separately about a private charter.", {
    minAge: known("restrictions", 13, "Public VIP tour: ages 13+. Private bookings have different rules.", VIP, "Public VIP departure only"),
    ride: known("experience", "calm", "Small flat-bottom boat; smaller-group wildlife experience.", VIP, "Public VIP tour"),
    capacity: known("experience", 12, "Operator lists 10–12 guests; confirm the assigned boat for a large party.", VIP, "Public VIP tour"),
    pickup: known("pickup", "hotel_addon", "Transportation add-on from select hotels and downtown visitor centers.", VIP, "VIP with transport"),
    onWater: known("timing", 120, "About 2 hours on the water.", CE, "VIP tour"),
    totalMinutes: known("timing", 300, "Allow approximately 4–5 hours with transportation.", CE, "VIP with transport", "An estimate, not a guaranteed return time."),
    price: known("pricing", "from", "Published from $99.99 per person; transportation costs extra.", VIP, "Public VIP tour"),
  }),
  record("aa-pontoon", "Airboat Adventures", "Pontoon Boat Swamp Tour", AA, AA, "Choose Book Pontoon Boat, then select hotel pickup if required.", {
    ride: known("experience", "calm", "Leisurely flat-bottom boat tour.", AA, "Pontoon tour"),
    pickup: known("pickup", "hotel_addon", "Hotel transport must be selected. Residential and Airbnb pickup is excluded.", AA, "Pontoon with transport"),
    pickupWindow: known("pickup", "lead", "Pickup begins 75 minutes before the scheduled tour; confirm your meeting instructions.", AA, "Hotel transportation"),
    onWater: known("timing", 90, "Published pontoon duration: 1 hour 30 minutes.", AA, "Pontoon tour", "The page also includes general airboat copy; use the pontoon-specific duration."),
    price: known("pricing", "bands", "Published from $35 ages 13+, $15 ages 5–12, and free ages 0–4. Round-trip transport is listed at $30 per person; confirm infant transport charges.", AA, "Pontoon tour", "Pricing categories alone do not establish all participation rules."),
  }),
  record("ltc-large-pickup", "Louisiana Tour Company", "Airboat Swamp Tour — Large Boat — Pickup", LTC, LTC, "Use the operator’s Book Now link and choose Large Boat — Pickup, not Drive Out.", {
    minHeight: known("restrictions", 48, "Minimum height: 48 inches.", LTC, "Large airboat"),
    ride: known("experience", "thrill", "Airboat with faster sections and stops.", LTC, "Large airboat"),
    capacity: known("experience", 16, "Published large-boat capacity: 16 passengers.", LTC, "Large airboat"),
    pickup: known("pickup", "hotel_included", "Pickup package; some locations are outside the pickup zone.", LTC, "Large Boat — Pickup"),
    pickupWindow: known("pickup", "windows", "Published pickup windows: 8–8:30 AM, 10:20–10:50 AM, 12:30–1 PM, and 3–3:30 PM. Confirm the window for your selected departure.", LTC, "Pickup variants"),
    onWater: known("timing", 90, "About 1.5 hours on the tour.", LTC, "Large airboat"),
    totalMinutes: known("timing", 240, "Approximately 4 hours including round-trip drive.", LTC, "Large Boat — Pickup", "Return time is approximate."),
    price: known("pricing", "bands", "Pickup variant: published $90 ages 18+, $86 ages 17 and under. Drive-out variant lists $65 / $61. Final total needs confirmation.", LTC, "Large-boat variants"),
  }),
  record("gray-large", "Gray Line New Orleans", "Large Airboat Swamp Adventure Tour", GL, "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/562175/calendar/?ref=https%3A%2F%2Fwww.graylineneworleans.com", "This package departs from 400 Toulouse Street. It is not hotel pickup.", {
    minAge: known("restrictions", 5, "Minimum age five; children cannot sit on laps.", GL, "Large Airboat Swamp Adventure"),
    boarding: known("restrictions", "independent", "Not wheelchair or stroller accessible; passengers must board without staff assistance. Other participation restrictions are listed by the operator.", GL, "Large Airboat Swamp Adventure"),
    ride: known("experience", "thrill", "Faster airboat experience.", GL, "Large Airboat Swamp Adventure"),
    capacity: known("experience", 27, "Published boat range: 15–27 passengers; assigned vessel needs confirmation.", GL, "Large Airboat Swamp Adventure"),
    pickup: known("pickup", "central_included", "Round-trip transportation from 400 Toulouse St, New Orleans; reach this central meeting point yourself.", GL, "Large Airboat Swamp Adventure"),
    pickupWindow: known("pickup", "checkin", "Present your voucher at the Lighthouse Ticket Office 15 minutes before departure.", GL, "400 Toulouse St departure"),
    totalMinutes: known("timing", 225, "Published excursion duration: 3 hours 45 minutes; add travel to and from the meeting point.", GL, "Central departure", "Not a door-to-door or guaranteed return time."),
    price: known("pricing", "bands", "Published $90 ages 13+ and 5–12; $81 seniors 65+. Food, drinks, and gratuity excluded.", GL, "Large Airboat Swamp Adventure"),
    cancellation: known("terms", "nonrefundable", "Published bookings are non-refundable; weather may change, shorten, or postpone the tour.", GL, "Official product page", "Read the terms displayed in your selected checkout before paying."),
  }),
  record("big-easy-small", "Big Easy Swamp Adventures", "Small Airboat — Hotel Pickup", BE, BE, "Select Small Boat and Hotel Pickup. Call 504-621-3858 for same/next-day requests.", {
    minHeight: known("restrictions", 48, "Airboat minimum height: 48 inches.", BE, "Airboat tours"),
    ride: known("experience", "thrill", "Small-airboat format.", BE, "Small Boat — Hotel Pickup"),
    capacity: known("experience", 13, "Small boats listed as 6, 8, 10, or 13 passengers; confirm the assigned boat.", BE, "Small-boat variants"),
    pickup: known("pickup", "hotel_included", "Hotel-pickup variant; downtown hotel coverage is published. Confirm your hotel.", BE, "Small Boat — Hotel Pickup"),
    price: known("pricing", "bands", "Published small boat: $115 hotel pickup or $105 drive out per person. Child rates need confirmation.", BE, "Small-boat variants"),
    booking: known("pickup", "phone_soon", "Same-day and next-day reservations are by phone only: 504-621-3858.", BE, "All reservation types"),
    cancellation: known("terms", "notice", "Airboat cancellations require 24 hours’ notice. Confirm refund details; the five-day rule on the page applies to the separate booze cruise.", BE, "Airboat tour", "Your booking channel’s displayed terms control."),
  }),
];

export const CATEGORY_LABELS: Record<Category, string> = { restrictions: "Restrictions and boarding", pickup: "Pickup and booking instructions", pricing: "Published pricing", timing: "Time commitment", experience: "Boat and comfort", terms: "Cancellation and weather terms" };
export function effectiveStatus(fact: Fact, asOf: string): FactStatus {
  if (fact.status !== "verified") return fact.status;
  if (fact.value === null || !fact.sourceUrl || !fact.checkedOn || !/^https:\/\//.test(fact.sourceUrl)) return "unknown";
  const age = (Date.parse(asOf + "T12:00:00Z") - Date.parse(fact.checkedOn + "T12:00:00Z")) / 86400000;
  if (!Number.isFinite(age) || age < 0) return "unclear";
  const month = Number(asOf.slice(5, 7)), checkedMonth = Number(fact.checkedOn.slice(5, 7));
  const monthly = (month >= 3 && month <= 10) || (checkedMonth >= 3 && checkedMonth <= 10);
  return age > (monthly ? 30 : 90) ? "stale" : "verified";
}
export function trustedValue(tour: FamilyTour, key: string, asOf: string) { const f = tour.facts[key]; return f && effectiveStatus(f, asOf) === "verified" ? f.value : null; }
export function validateEditorialData(tours: FamilyTour[]) {
  const ids = new Set<string>();
  for (const t of tours) {
    if (ids.has(t.id)) throw new Error("Duplicate product ID"); ids.add(t.id);
    if (!t.name || !t.bookingInstruction || !t.officialUrl.startsWith("https://") || !t.bookingUrl.startsWith("https://")) throw new Error("Missing product identity or destination");
    for (const f of Object.values(t.facts)) {
      if (!["verified","unclear","conflicting","stale","unknown"].includes(f.status) || !f.text || !f.appliesTo) throw new Error("Facts require a valid status and product scope");
      if (f.status === "verified" && (f.value == null || (typeof f.value === "number" && !Number.isFinite(f.value)) || !f.sourceUrl?.startsWith("https://") || !f.checkedOn || !/^\d{4}-\d{2}-\d{2}$/.test(f.checkedOn) || new Date(f.checkedOn + "T12:00:00Z").toISOString().slice(0,10) !== f.checkedOn)) throw new Error("Verified facts require a value, source and real review date");
      if (f.status === "unknown" && f.value !== null) throw new Error("Unknown facts cannot assert a value");
    }
  }
}
validateEditorialData(FAMILY_TOURS);
