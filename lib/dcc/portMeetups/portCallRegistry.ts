import type { PublicPortCongestionSummary } from "./meetupTypes";

export interface VerifiedOperatorMeetupProduct {
  operatorId: string;
  operatorName: string;
  portSlug: string;
  productCom: string;
  matchedViatorCode: string;
  rezgoHost: string;
  rezgoSeoSlug: string;
  refId: string;
  productTitle: string;
  durationRangeLabel: string;
  lowerBoundDurationMinutes: number;
  upperBoundDurationMinutes: number;
  checkInLeadMinutes: number;
  meetingPointLabel: string;
  returnDropoffLabel: string;
  guaranteeApplies: boolean;
  guaranteeDisclosure: string;
  noPortNoPayDisclosure: string;
  bookingAndCommissionDisclosure: string;
}

export interface HostedSailingOnPortCall {
  hostedSailingId: string;
  organizerSlug: string;
  organizerName: string;
  sailingSlug: string;
  sailingTitle: string;
  hostedSailingPath: string;
  organizerExcursionStatusLine: string;
}

export interface VerifiedShipPortCallConfig {
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
  publishedArrivalTime24: string;
  publishedDepartureTime24: string;
  allAboardTime24: string;
  allAboardSource: "official" | "modeled" | "estimated";
  berthConfirmed: boolean;
  outboundDisembarkAndTransferMinutes: number;
  returnToBerthTransferMinutes: number;
  berthTransferNote: string;
  defaultOperatorId: string;
  defaultProductCom: string;
  pilotActive: boolean;
  meetupDepartureTime24: string;
  sourceUrl: string;
  sourceCheckedAt: string;
  hostedSailings: HostedSailingOnPortCall[];
}

export const VERIFIED_OPERATOR_MEETUP_PRODUCTS: Record<
  string,
  VerifiedOperatorMeetupProduct
> = {
  "juneau-tours-whale-watch::31703": {
    operatorId: "juneau-tours-whale-watch",
    operatorName: "Juneau Tours & Whale Watch",
    portSlug: "juneau",
    productCom: "31703",
    matchedViatorCode: "5857P23",
    rezgoHost: "juneauwhalewatch.rezgo.com",
    rezgoSeoSlug: "juneau-whale-watch-tour",
    refId: "dccjuneau10",
    productTitle: "Juneau Whale Watch Tour",
    durationRangeLabel: "3–3.5 hours",
    lowerBoundDurationMinutes: 180,
    upperBoundDurationMinutes: 210,
    checkInLeadMinutes: 15,
    meetingPointLabel:
      "Downtown Juneau — Goldbelt Tramway Plaza (492 S. Franklin St, Juneau, AK 99801; confirm exact voucher pickup instructions with Juneau Tours)",
    returnDropoffLabel:
      "Downtown Juneau — Goldbelt Tramway Plaza (492 S. Franklin St, Juneau, AK 99801)",
    guaranteeApplies: true,
    guaranteeDisclosure:
      "Juneau Tours advertises a whale-sighting guarantee; confirm current 2027 seasonal window, eligibility, and remedy terms directly on Juneau Tours’ published policy before booking.",
    noPortNoPayDisclosure:
      "Juneau Tours publishes a No Port–No Pay refund policy if your ship cannot dock. Review the operator’s current cancellation terms before booking.",
    bookingAndCommissionDisclosure:
      "Bookings happen directly on Juneau Tours & Whale Watch’s official checkout (juneauwhalewatch.rezgo.com); Juneau Tours is the merchant of record and Cruise Promenade may earn a partner commission at no additional cost to travelers.",
  },
};

export const VERIFIED_PORT_CONGESTION_BY_DATE: Record<
  string,
  PublicPortCongestionSummary
> = {
  "juneau::2027-05-18": {
    shipsInPortCount: 4,
    estimatedMaxGuestsInPort: null,
    shipsSummary:
      "Norwegian Bliss (06:30–13:30), Discovery Princess (08:00–21:15), Noordam (12:30–22:30), Norwegian Encore (13:00–22:00)",
    sourceLabel: "CLAA 2027 Juneau Port Schedule",
    sourceUrl: "https://claalaska.com/wp-content/uploads/2026/10/JNU-Juneau-2027.pdf",
    sourceCheckedDate: "2026-11-25",
  },
};

export const VERIFIED_SHIP_PORT_CALLS: readonly VerifiedShipPortCallConfig[] = [
  {
    physicalSailingId: "sailing:pcl:discovery-princess:2027-05-15",
    shipSlug: "discovery-princess",
    shipName: "Discovery Princess",
    cruiseLine: "Princess Cruises",
    sailDate: "2027-05-15",
    canonicalSailingPath: "/sailings/discovery-princess/2027-05-15",
    dayNumber: 4,
    portSlug: "juneau",
    portName: "Juneau, Alaska",
    serviceDate: "2027-05-18",
    publishedArrivalTime24: "08:00",
    publishedDepartureTime24: "21:15",
    allAboardTime24: "20:45",
    allAboardSource: "modeled",
    berthConfirmed: false,
    outboundDisembarkAndTransferMinutes: 40,
    returnToBerthTransferMinutes: 20,
    berthTransferNote:
      "Exact Juneau dock assignment is not confirmed this far in advance; timing includes a conservative 40-min arrival-to-kiosk allowance and a 20-min downtown-to-berth return transfer (covering outer AJ Dock shuttle/walk).",
    defaultOperatorId: "juneau-tours-whale-watch",
    defaultProductCom: "31703",
    pilotActive: true,
    meetupDepartureTime24: "09:30",
    sourceUrl: "https://claalaska.com/wp-content/uploads/2026/10/JNU-Juneau-2027.pdf",
    sourceCheckedAt: "2026-11-25",
    hostedSailings: [
      {
        hostedSailingId:
          "hosted-sailing:adventure-bears:pcl:discovery-princess:2027-05-15",
        organizerSlug: "adventure-bears",
        organizerName: "Adventure Bears",
        sailingSlug: "discovery-princess-2027-05-15",
        sailingTitle: "Alaska Denali Explorer 2027",
        hostedSailingPath:
          "/hosted-cruises/adventure-bears/discovery-princess-2027-05-15",
        organizerExcursionStatusLine:
          "Cruise Promenade has not verified an organizer-selected Juneau excursion as of November 25, 2026.",
      },
    ],
  },

];

export function evaluateWhaleGuaranteeWindow(
  _serviceDate: string,
  product: VerifiedOperatorMeetupProduct,
): { applies: boolean; disclosure: string } {
  return {
    applies: product.guaranteeApplies,
    disclosure: product.guaranteeDisclosure,
  };
}

export function lookupVerifiedPortCall(params: {
  physicalSailingId?: string | null;
  shipSlug?: string | null;
  sailDate?: string | null;
  organizerSlug?: string | null;
  sailingSlug?: string | null;
  portSlug?: string | null;
}): {
  call: VerifiedShipPortCallConfig;
  hostedSailing: HostedSailingOnPortCall | null;
  product: VerifiedOperatorMeetupProduct;
  congestion: PublicPortCongestionSummary | null;
} | null {
  const targetPort = (params.portSlug || "juneau").trim().toLowerCase();
  const orgSlug = (params.organizerSlug || "").trim().toLowerCase();
  const sailSlug = (params.sailingSlug || "").trim().toLowerCase();
  const physId = (params.physicalSailingId || "").trim();
  const shipSlug = (params.shipSlug || "").trim().toLowerCase();
  const sailDate = (params.sailDate || "").trim();

  for (const call of VERIFIED_SHIP_PORT_CALLS) {
    if (call.portSlug !== targetPort) continue;
    if (!call.pilotActive) continue;

    let matchedHosted: HostedSailingOnPortCall | null = null;
    if (orgSlug && sailSlug) {
      matchedHosted =
        call.hostedSailings.find(
          (h) =>
            h.organizerSlug === orgSlug && h.sailingSlug === sailSlug,
        ) || null;
      if (!matchedHosted) continue;
    } else if (physId) {
      if (call.physicalSailingId !== physId) continue;
      matchedHosted = call.hostedSailings[0] || null;
    } else if (shipSlug && sailDate) {
      if (call.shipSlug !== shipSlug || call.sailDate !== sailDate) continue;
      matchedHosted = call.hostedSailings[0] || null;
    } else {
      continue;
    }

    const product =
      VERIFIED_OPERATOR_MEETUP_PRODUCTS[
        `${call.defaultOperatorId}::${call.defaultProductCom}`
      ];
    if (!product) return null;

    const congestion =
      VERIFIED_PORT_CONGESTION_BY_DATE[
        `${call.portSlug}::${call.serviceDate}`
      ] || null;

    return {
      call,
      hostedSailing: matchedHosted,
      product,
      congestion,
    };
  }

  return null;
}
