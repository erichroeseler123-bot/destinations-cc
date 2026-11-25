import { getCachedSereneRezgoInspection, buildDirectJuneauRezgoHostedCheckoutUrl, type RezgoReadOnlyInspectionResult } from "@/lib/dcc/liveSlots/rezgoReadOnly";
import { buildPortMeetupKey, buildOperatorDepartureSlotKey, hashOpaquePartyToken, isDccPortMeetupPilotEnabled, resolvePortMeetupNamespace, readMeetupParties, saveMeetupParty, deleteMeetupParty } from "./meetupStore";
import { lookupVerifiedPortCall, evaluateWhaleGuaranteeWindow, type VerifiedShipPortCallConfig, type VerifiedOperatorMeetupProduct } from "./portCallRegistry";
import type { PublicPortMeetupResolution, PublicMeetupScheduleEvaluation, NormalizedSlotOptionSnapshot, MeetupAttendanceStatus } from "./meetupTypes";
export const INVENTORY_TTL_MS = 5 * 60 * 1000;
function formatClock12h(t: string): string {
  const [h,m] = t.split(":").map(Number); return `${h % 12 || 12}:${String(m).padStart(2,"0")} ${h >= 12 ? "PM" : "AM"}`;
}
function parseClockMinutes(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number.parseInt(m[1], 10);
  const min = Number.parseInt(m[2], 10);
  if (!Number.isFinite(h) || !Number.isFinite(min) || h < 0 || h > 23 || min < 0 || min > 59) {
    return null;
  }
  return h * 60 + min;
}

function minutesToClock24(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, Math.round(totalMinutes)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatDurationMinutesHuman(mins: number): string {
  const safe = Math.max(0, Math.round(mins));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  if (h > 0 && m > 0) return `${h} hr ${m} min`;
  if (h > 0) return `${h} hr`;
  return `${m} min`;
}

function formatServiceDateLong(isoDate: string): string {
  const parsed = new Date(`${isoDate}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatCheckedAtLabel(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Juneau",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(parsed);
  const time = parsed.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Juneau",
    timeZoneName: "short",
  });
  return `${dateParts} ${time}`;
}

function parsePositiveUsd(raw: string | number | null | undefined): number | null {
  if (typeof raw === "number") {
    return Number.isFinite(raw) && raw > 0 ? Number(raw.toFixed(2)) : null;
  }
  if (!raw) return null;
  const cleaned = String(raw).replace(/[^0-9.]/g, "").trim();
  if (!cleaned) return null;
  const num = Number.parseFloat(cleaned);
  return Number.isFinite(num) && num > 0 ? Number(num.toFixed(2)) : null;
}

function normalizeTime24(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const ampm = /^(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*(am|pm)$/i.exec(trimmed);
  if (ampm) {
    let h = Number.parseInt(ampm[1], 10);
    const m = Number.parseInt(ampm[2] || "0", 10);
    const mer = ampm[3].toLowerCase();
    if (mer === "pm" && h !== 12) h += 12;
    if (mer === "am" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  const hhmm = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(trimmed);
  if (hhmm) {
    return `${String(Number.parseInt(hhmm[1], 10)).padStart(2, "0")}:${hhmm[2]}`;
  }
  return null;
}

/**
 * Pass 1: Pure schedule-fit evaluation including outbound disembark/transfer to meeting point,
 * check-in lead time, upper-bound tour duration, AND literal return transfer back to the ship berth
 * before the 2-hour (120-minute) safety cutoff.
 */
export function evaluateDepartureScheduleFit(params: {
  call: VerifiedShipPortCallConfig;
  product: VerifiedOperatorMeetupProduct;
  departureTime24: string;
}): {
  fits: boolean;
  rejectionReason: string | null;
  evaluation: PublicMeetupScheduleEvaluation;
} {
  const { call, product, departureTime24 } = params;
  const arrivalMin = parseClockMinutes(call.publishedArrivalTime24);
  const pubDepMin = parseClockMinutes(call.publishedDepartureTime24);
  const allAboardMin = parseClockMinutes(call.allAboardTime24);
  const depMin = parseClockMinutes(departureTime24);
  if (arrivalMin === null || pubDepMin === null || allAboardMin === null || depMin === null) throw new Error("Invalid port clock; schedule match unavailable.");

  const earliestShoreReadyMin = arrivalMin + call.outboundDisembarkAndTransferMinutes;
  const checkInMin = depMin - product.checkInLeadMinutes;
  const dropoffLowerMin = depMin + product.lowerBoundDurationMinutes;
  const dropoffUpperMin = depMin + product.upperBoundDurationMinutes;
  const backAtBerthUpperMin = dropoffUpperMin + call.returnToBerthTransferMinutes;
  const safetyCutoffMin = allAboardMin - 120;
  const usableAfternoonMin = safetyCutoffMin - backAtBerthUpperMin;

  let fits = true;
  let rejectionReason: string | null = null;
  if (checkInMin < earliestShoreReadyMin) {
    fits = false;
    rejectionReason = `Check-in (${formatClock12h(minutesToClock24(checkInMin))}) is earlier than conservative shore-ready arrival at meeting point (${formatClock12h(minutesToClock24(earliestShoreReadyMin))}).`;
  } else if (backAtBerthUpperMin > safetyCutoffMin) {
    fits = false;
    rejectionReason = `Upper-bound return to ship berth (${formatClock12h(minutesToClock24(backAtBerthUpperMin))}) exceeds the 2-hour safety cutoff (${formatClock12h(minutesToClock24(safetyCutoffMin))}).`;
  }

  const allAboardProvenanceLabel =
    call.allAboardSource === "official"
      ? "Official cruise-line gangway cutoff"
      : call.allAboardSource === "modeled"
        ? `Modeled estimate (30 min before ${formatClock12h(call.publishedDepartureTime24)} scheduled departure; confirm onboard)`
        : "Estimated cutoff (confirm onboard)";

  const evaluation: PublicMeetupScheduleEvaluation = {
    publishedArrivalTime24: call.publishedArrivalTime24,
    publishedArrivalLabel: formatClock12h(call.publishedArrivalTime24),
    outboundDisembarkAndTransferMinutes: call.outboundDisembarkAndTransferMinutes,
    earliestShoreReadyTime24: minutesToClock24(earliestShoreReadyMin),
    earliestShoreReadyLabel: formatClock12h(minutesToClock24(earliestShoreReadyMin)),
    checkInLeadMinutes: product.checkInLeadMinutes,
    checkInTime24: minutesToClock24(checkInMin),
    checkInTimeLabel: formatClock12h(minutesToClock24(checkInMin)),
    departureTime24,
    departureTimeLabel: formatClock12h(departureTime24),
    durationRangeLabel: product.durationRangeLabel,
    lowerBoundDurationMinutes: product.lowerBoundDurationMinutes,
    upperBoundDurationMinutes: product.upperBoundDurationMinutes,
    downtownDropoffWindowLabel: `${formatClock12h(minutesToClock24(dropoffLowerMin))}–${formatClock12h(minutesToClock24(dropoffUpperMin))}`,
    returnToBerthTransferMinutes: call.returnToBerthTransferMinutes,
    latestBackAtShipBerthTime24: minutesToClock24(backAtBerthUpperMin),
    latestBackAtShipBerthLabel: formatClock12h(minutesToClock24(backAtBerthUpperMin)),
    usableFreeAfternoonMinutes: Math.max(0, usableAfternoonMin),
    usableFreeAfternoonLabel: formatDurationMinutesHuman(Math.max(0, usableAfternoonMin)),
    safetyCutoffAtBerthTime24: minutesToClock24(safetyCutoffMin),
    safetyCutoffAtBerthLabel: formatClock12h(minutesToClock24(safetyCutoffMin)),
    requiredSafetyBufferMinutes: 120,
    allAboardTime24: call.allAboardTime24,
    allAboardTimeLabel: formatClock12h(call.allAboardTime24),
    allAboardSource: call.allAboardSource,
    allAboardProvenanceLabel,
    publishedDepartureTime24: call.publishedDepartureTime24,
    publishedDepartureLabel: formatClock12h(call.publishedDepartureTime24),
    berthConfirmed: call.berthConfirmed,
    berthTransferNote: call.berthTransferNote,
    meetingPointLabel: product.meetingPointLabel,
    returnDropoffLabel: product.returnDropoffLabel,
  };

  return { fits, rejectionReason, evaluation };
}


export type MeetupLookup = { physicalSailingId?: string | null; shipSlug?: string | null; sailDate?: string | null; organizerSlug?: string | null; sailingSlug?: string | null; portSlug?: string | null };
export async function resolvePortMeetupForShipCall(params: MeetupLookup & {
  partySize?: number; viewerPartyToken?: string | null;
  rezgoInspectionOverride?: RezgoReadOnlyInspectionResult | null; nowIso?: string;
}): Promise<PublicPortMeetupResolution | null> {
  const matched = lookupVerifiedPortCall(params);
  if (!matched) return null;
  const { call, product, hostedSailing, congestion } = matched;
  const partySize = params.partySize ?? 2;
  if (!Number.isInteger(partySize) || partySize < 1 || partySize > 8) throw new Error("Choose a party size from 1 to 8.");
  const selectedTime24 = call.meetupDepartureTime24;
  const fit = evaluateDepartureScheduleFit({ call, product, departureTime24: selectedTime24 });
  if (!fit.fits) return null;
  const meetupKey = buildPortMeetupKey({ physicalSailingId: call.physicalSailingId, portSlug: call.portSlug, serviceDate: call.serviceDate, operatorId: product.operatorId, productCom: product.productCom, departureTime24: selectedTime24 });
  const slotKey = buildOperatorDepartureSlotKey({ portSlug: call.portSlug, serviceDate: call.serviceDate, operatorId: product.operatorId, productCom: product.productCom, departureTime24: selectedTime24 });
  const nowMs = Date.parse(params.nowIso || new Date().toISOString());
  let inspection: RezgoReadOnlyInspectionResult | null = null;
  try { inspection = params.rezgoInspectionOverride !== undefined ? params.rezgoInspectionOverride : await getCachedSereneRezgoInspection({ searchDate: call.serviceDate, ttlMs: INVENTORY_TTL_MS }); } catch { /* show a truthful unavailable state */ }
  const checkedMs = Date.parse(inspection?.checkedAt || "");
  const feedOk = Boolean(inspection?.ok && inspection.status === "inspected_ok" && inspection.searchDate === call.serviceDate && Number.isFinite(checkedMs) && checkedMs <= nowMs + 60_000 && nowMs - checkedMs <= INVENTORY_TTL_MS);
  const options: NormalizedSlotOptionSnapshot[] = [];
  if (feedOk && inspection) for (const item of inspection.items) {
    if (item.com !== product.productCom || (item.currency && item.currency !== "USD")) continue;
    // A different date or an inactive date-specific slot never inherits generic availability.
    const slots = (item.dateSlots || []).filter(s => s.date === call.serviceDate && s.active !== false);
    if ((item.dateSlots || []).length > 0 && slots.length === 0) continue;
    const candidates = slots.length ? slots : item.searchDateChecked === call.serviceDate ? [{ departureTime: item.departureTime, availableSpots: item.availableSpotsOnSearchDate, adultPrice: item.adultPrice, childPrice: item.childPrice }] : [];
    for (const slot of candidates) {
      const time = normalizeTime24(slot.departureTime || item.departureTime);
      if (!time || parseClockMinutes(time) === null) continue;
      options.push({ uid: item.uid, rezgoCom: product.productCom, optionName: item.optionName, departureTime24: time,
        availableSpots: typeof slot.availableSpots === "number" && Number.isInteger(slot.availableSpots) && slot.availableSpots >= 0 ? slot.availableSpots : null,
        adultPriceUsd: parsePositiveUsd(slot.adultPrice ?? item.adultPrice), childPriceUsd: parsePositiveUsd(slot.childPrice ?? item.childPrice),
        directBookingUrl: buildDirectJuneauRezgoHostedCheckoutUrl({ domain: product.rezgoHost, rezgoCom: product.productCom, optionUid: item.uid, serviceDate: call.serviceDate, refId: product.refId }) });
    }
  }
  const primary = options.filter(o => o.departureTime24 === selectedTime24);
  const known = primary.filter(o => o.availableSpots !== null);
  const unknown = primary.some(o => o.availableSpots === null);
  const maxSeats = known.length ? Math.max(...known.map(o => o.availableSpots!)) : null;
  const state = !feedOk || maxSeats === null || (maxSeats === 0 && unknown) ? "availability_stale" : maxSeats === 0 ? "sold_out" : maxSeats <= 8 ? "low_capacity" : "open";
  const chosen = state !== "availability_stale" ? known.filter(o => o.availableSpots! >= partySize).sort((a,b) => b.availableSpots! - a.availableSpots!)[0] || null : null;
  const productUrl = new URL(`https://${product.rezgoHost}/details/${product.productCom}/${product.rezgoSeoSlug}`);
  productUrl.searchParams.set("refid", product.refId); productUrl.searchParams.set("date", call.serviceDate);
  function bookingUrl(option: NormalizedSlotOptionSnapshot): string | null {
    if (!option.directBookingUrl) return null;
    const u = new URL(option.directBookingUrl);
    // Party size includes children; travelers select the correct ticket types in operator checkout.
    u.searchParams.delete("adult_num"); return u.toString();
  }
  let parties: Awaited<ReturnType<typeof readMeetupParties>> = [];
  let attendanceAvailable = true;
  try { parties = await readMeetupParties(meetupKey); } catch { attendanceAvailable = false; }
  const planning = parties.filter(p => p.status === "planning"), booked = parties.filter(p => p.status === "reported_booked");
  const viewerId = params.viewerPartyToken ? hashOpaquePartyToken(params.viewerPartyToken) : null;
  const viewer = parties.find(p => p.partyId === viewerId);
  const timeLabel = formatClock12h(selectedTime24);
  const checkedAt = inspection?.checkedAt || new Date(nowMs).toISOString();
  let overflow: PublicPortMeetupResolution["overflowCandidate"] = null;
  if (!chosen && state !== "availability_stale") for (const option of options.sort((a,b) => a.departureTime24.localeCompare(b.departureTime24))) {
    if (option.departureTime24 <= selectedTime24 || option.availableSpots === null || option.availableSpots < partySize) continue;
    const backupFit = evaluateDepartureScheduleFit({ call, product, departureTime24: option.departureTime24 });
    if (!backupFit.fits) continue;
    overflow = { departureTime24: option.departureTime24, departureTimeLabel: backupFit.evaluation.departureTimeLabel, checkInTimeLabel: backupFit.evaluation.checkInTimeLabel, latestBackAtShipBerthLabel: backupFit.evaluation.latestBackAtShipBerthLabel, usableFreeAfternoonLabel: backupFit.evaluation.usableFreeAfternoonLabel, maxSingleOptionSeats: option.availableSpots, adultPriceUsd: option.adultPriceUsd, directBookingUrl: bookingUrl(option), chosenOptionUid: option.uid }; break;
  }
  const guarantee = evaluateWhaleGuaranteeWindow(call.serviceDate, product);
  const shareUrl = `https://cruisepromenade.com${hostedSailing?.hostedSailingPath || call.canonicalSailingPath}?utm_source=passenger_meetup#juneau-meetup`;
  const statusDetail = state === "availability_stale" ? "Current seats and prices could not be confirmed. Check the operator’s checkout before booking." : state === "sold_out" ? `The ${timeLabel} departure currently has no seats available. Existing bookings remain with Juneau Tours.` : !chosen ? `No single ${timeLabel} booking option currently has room for your whole party of ${partySize}.` : `Availability checked ${formatCheckedAtLabel(checkedAt)}. Seats are confirmed only when Juneau Tours accepts your booking.`;
  return {
    ok: true, pilotEnabled: isDccPortMeetupPilotEnabled(), namespace: resolvePortMeetupNamespace(), inventoryExpiresAt: new Date(Number.isFinite(checkedMs) ? checkedMs + INVENTORY_TTL_MS : nowMs).toISOString(), meetupKey, slotKey,
    shipCall: { physicalSailingId: call.physicalSailingId, shipSlug: call.shipSlug, shipName: call.shipName, cruiseLine: call.cruiseLine, sailDate: call.sailDate, canonicalSailingPath: call.canonicalSailingPath, dayNumber: call.dayNumber, portSlug: call.portSlug, portName: call.portName, serviceDate: call.serviceDate, serviceDateFormatted: formatServiceDateLong(call.serviceDate), hostedSailing },
    product: { operatorId: product.operatorId, operatorName: product.operatorName, productCom: product.productCom, matchedViatorCode: product.matchedViatorCode, productTitle: product.productTitle, rezgoHost: product.rezgoHost, whaleGuaranteeApplies: guarantee.applies, whaleGuaranteeDisclosure: guarantee.disclosure, noPortNoPayDisclosure: product.noPortNoPayDisclosure, bookingAndCommissionDisclosure: product.bookingAndCommissionDisclosure, officialTourUrl: `https://${product.rezgoHost}/details/${product.productCom}/${product.rezgoSeoSlug}`, officialTermsUrl: `https://${product.rezgoHost}/terms` },
    schedule: fit.evaluation, congestion,
    liveInventory: { state, checkedAt, checkedAtFormatted: formatCheckedAtLabel(checkedAt), bookableSeatsInSingleOption: state === "availability_stale" ? null : maxSeats, optionsCountAtDeparture: primary.length, adultPriceUsd: state === "availability_stale" ? null : chosen?.adultPriceUsd ?? known[0]?.adultPriceUsd ?? null, childPriceUsd: state === "availability_stale" ? null : chosen?.childPriceUsd ?? null, currency: "USD", requestedPartySize: partySize, partyFitsSingleOption: Boolean(chosen), chosenOptionUid: chosen?.uid ?? null, directBookingUrl: chosen ? bookingUrl(chosen) : state === "availability_stale" ? productUrl.toString() : null, statusHeadline: `Meetup-ready whale watch: ${timeLabel}`, statusDetail },
    attendance: { available: attendanceAvailable, planningPartiesCount: planning.length, planningTravelersCount: planning.reduce((n,p)=>n+p.partySize,0), reportedBookedPartiesCount: booked.length, reportedBookedTravelersCount: booked.reduce((n,p)=>n+p.partySize,0), totalCoordinatingPartiesCount: parties.length, totalCoordinatingTravelersCount: parties.reduce((n,p)=>n+p.partySize,0), viewerParty: viewer ? {status: viewer.status, partySize: viewer.partySize, updatedAt: viewer.updatedAt} : null, separationDisclosure: "Live operator seat inventory and traveler self-reported meetup headcounts are independent sources and are never subtracted." },
    overflowCandidate: overflow,
    shareTemplates: { canonicalMeetupUrl: shareUrl, facebookGroupCopy: `Anyone else on ${hostedSailing?.organizerName || call.shipName} interested in whale watching in Juneau on ${formatServiceDateLong(call.serviceDate)}? This page highlights Juneau Tours’ ${timeLabel} departure, with ${fit.evaluation.checkInTimeLabel} check-in. If we book the same departure, we can coordinate here: ${shareUrl} (The operator confirms boat assignments.)`, groupChatCopy: `Whale watching in Juneau, ${formatServiceDateLong(call.serviceDate)}: anyone want to coordinate on the ${timeLabel} Juneau Tours departure? Tour details, booking and headcount: ${shareUrl}`, sharePermissionRule: "Share where permitted by your group’s rules." }
  };
}

export async function upsertMeetupAttendanceParty(params: MeetupLookup & { partyToken: string; status: MeetupAttendanceStatus; partySize: number; sourceSurface?: "hosted_sailing" | "physical_sailing"; rezgoInspectionOverride?: RezgoReadOnlyInspectionResult | null }): Promise<PublicPortMeetupResolution | null> {
  const partyId = hashOpaquePartyToken(params.partyToken);
  if (params.status !== "planning" && params.status !== "reported_booked") throw new Error("Choose Planning or Already booked.");
  const result = await resolvePortMeetupForShipCall(params);
  if (!result) return null;
  const now = new Date().toISOString();
  await saveMeetupParty(result.meetupKey, { partyId, status: params.status, partySize: params.partySize, sourceSurface: params.sourceSurface || "hosted_sailing", hostedSailingId: params.sourceSurface === "physical_sailing" ? null : result.shipCall.hostedSailing?.hostedSailingId || null, createdAt: now, updatedAt: now });
  return resolvePortMeetupForShipCall({ ...params, viewerPartyToken: params.partyToken });
}
export async function removeMeetupAttendanceParty(params: MeetupLookup & { partyToken: string; rezgoInspectionOverride?: RezgoReadOnlyInspectionResult | null }): Promise<PublicPortMeetupResolution | null> {
  const partyId = hashOpaquePartyToken(params.partyToken);
  const result = await resolvePortMeetupForShipCall(params);
  if (!result) return null;
  await deleteMeetupParty(result.meetupKey, partyId);
  return resolvePortMeetupForShipCall({ ...params, viewerPartyToken: params.partyToken });
}
