export type MeetupAttendanceStatus = "planning" | "reported_booked";
export type SlotInventoryState = "open" | "low_capacity" | "sold_out" | "availability_stale";

export interface MeetupAttendanceParty {
  /** SHA-256 digest of the traveler's opaque local partyToken (raw token is never stored or logged). */
  partyId: string;
  status: MeetupAttendanceStatus;
  partySize: number;
  sourceSurface: "hosted_sailing" | "physical_sailing" | "rollcall" | "port_day";
  hostedSailingId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NormalizedSlotOptionSnapshot {
  uid: string;
  rezgoCom: string;
  optionName: string | null;
  departureTime24: string;
  availableSpots: number | null;
  adultPriceUsd: number | null;
  childPriceUsd: number | null;
  directBookingUrl: string | null;
}

export interface PublicMeetupScheduleEvaluation {
  publishedArrivalTime24: string;
  publishedArrivalLabel: string;
  outboundDisembarkAndTransferMinutes: number;
  earliestShoreReadyTime24: string;
  earliestShoreReadyLabel: string;
  checkInLeadMinutes: number;
  checkInTime24: string;
  checkInTimeLabel: string;
  departureTime24: string;
  departureTimeLabel: string;
  durationRangeLabel: string;
  lowerBoundDurationMinutes: number;
  upperBoundDurationMinutes: number;
  downtownDropoffWindowLabel: string;
  returnToBerthTransferMinutes: number;
  latestBackAtShipBerthTime24: string;
  latestBackAtShipBerthLabel: string;
  usableFreeAfternoonMinutes: number;
  usableFreeAfternoonLabel: string;
  safetyCutoffAtBerthTime24: string;
  safetyCutoffAtBerthLabel: string;
  requiredSafetyBufferMinutes: 120;
  allAboardTime24: string;
  allAboardTimeLabel: string;
  allAboardSource: "official" | "modeled" | "estimated";
  allAboardProvenanceLabel: string;
  publishedDepartureTime24: string;
  publishedDepartureLabel: string;
  berthConfirmed: boolean;
  berthTransferNote: string;
  meetingPointLabel: string;
  returnDropoffLabel: string;
}

export interface PublicPortCongestionSummary {
  shipsInPortCount: number;
  estimatedMaxGuestsInPort: number | null;
  shipsSummary: string;
  sourceLabel: string;
  sourceUrl: string;
  sourceCheckedDate?: string;
}

export interface PublicOverflowDepartureCandidate {
  departureTime24: string;
  departureTimeLabel: string;
  checkInTimeLabel: string;
  latestBackAtShipBerthLabel: string;
  usableFreeAfternoonLabel: string;
  maxSingleOptionSeats: number | null;
  adultPriceUsd: number | null;
  directBookingUrl: string | null;
  chosenOptionUid: string | null;
}

export interface PublicPortMeetupResolution {
  ok: true;
  pilotEnabled: boolean;
  namespace: string;
  inventoryExpiresAt: string;
  meetupKey: string;
  slotKey: string;
  shipCall: {
    physicalSailingId: string;
    shipSlug: string;
    shipName: string;
    cruiseLine: string;
    sailDate: string;
    canonicalSailingPath: string;
    dayNumber: number;
    portSlug: string;
    portName: string;
    serviceDate: string;
    serviceDateFormatted: string;
    hostedSailing: {
      hostedSailingId: string;
      organizerSlug: string;
      organizerName: string;
      sailingSlug: string;
      sailingTitle: string;
      hostedSailingPath: string;
      organizerExcursionStatusLine: string;
    } | null;
  };
  product: {
    operatorId: string;
    operatorName: string;
    productCom: string;
    matchedViatorCode: string;
    productTitle: string;
    rezgoHost: string;
    whaleGuaranteeApplies: boolean;
    officialTourUrl: string;
    officialTermsUrl: string;
    whaleGuaranteeDisclosure: string;
    noPortNoPayDisclosure: string;
    bookingAndCommissionDisclosure: string;
  };
  schedule: PublicMeetupScheduleEvaluation;
  congestion: PublicPortCongestionSummary | null;
  liveInventory: {
    state: SlotInventoryState;
    checkedAt: string;
    checkedAtFormatted: string;
    /** Maximum seats bookable in a SINGLE checkout option at 9:30 AM (never summed across split options). */
    bookableSeatsInSingleOption: number | null;
    optionsCountAtDeparture: number;
    adultPriceUsd: number | null;
    childPriceUsd: number | null;
    currency: "USD";
    requestedPartySize: number;
    partyFitsSingleOption: boolean;
    chosenOptionUid: string | null;
    directBookingUrl: string | null;
    statusHeadline: string;
    statusDetail: string;
  };
  /** Self-reported CP meetup headcounts — NEVER subtracted from liveInventory.bookableSeatsInSingleOption. */
  attendance: {
    available: boolean;
    planningPartiesCount: number;
    planningTravelersCount: number;
    reportedBookedPartiesCount: number;
    reportedBookedTravelersCount: number;
    totalCoordinatingPartiesCount: number;
    totalCoordinatingTravelersCount: number;
    viewerParty: {
      status: MeetupAttendanceStatus;
      partySize: number;
      updatedAt: string;
    } | null;
    separationDisclosure: "Live operator seat inventory and traveler self-reported meetup headcounts are independent sources and are never subtracted.";
  };
  /** Optional later departure when the selected departure cannot fit the party. */
  overflowCandidate: PublicOverflowDepartureCandidate | null;
  shareTemplates: {
    canonicalMeetupUrl: string;
    facebookGroupCopy: string;
    groupChatCopy: string;
    sharePermissionRule: "Share where permitted by your group’s rules.";
  };
}

