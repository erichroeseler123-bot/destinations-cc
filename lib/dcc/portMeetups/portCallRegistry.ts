import type { PublicPortCongestionSummary } from "./meetupTypes";

export interface VerifiedOperatorMeetupProduct {
  operatorId: string;
  operatorName: string;
  operatorContactName: string;
  operatorPhone: string;
  operatorEmail: string;
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
  guaranteeWindowStartMmDd: string;
  guaranteeWindowEndMmDd: string;
  guaranteeAppliesDisclosure: string;
  guaranteeOutsideWindowDisclosure: string;
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
    operatorContactName: "Serene",
    operatorPhone: "1-907-621-6502",
    operatorEmail: "info@juneautours.com",
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
      "Downtown Juneau — Goldbelt Tramway Kiosk (490 S. Franklin St)",
    returnDropoffLabel:
      "Downtown Juneau — Goldbelt Tramway (490 S. Franklin St)",
    guaranteeWindowStartMmDd: "05-15",
    guaranteeWindowEndMmDd: "09-15",
    guaranteeAppliesDisclosure:
      "Whale-sighting guarantee applies May 15–September 15; remedy subject to Juneau Tours’ published guarantee policy.",
    guaranteeOutsideWindowDisclosure:
      "Outside Juneau Tours’ May 15–September 15 whale-sighting guarantee window; confirm current seasonal terms with Juneau Tours before booking.",
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
  serviceDate: string,
  product: VerifiedOperatorMeetupProduct,
): { applies: boolean; disclosure: string } {
  const match = /^\d{4}-(\d{2}-\d{2})$/.exec(serviceDate.trim());
  if (!match) {
    return {
      applies: false,
      disclosure: product.guaranteeOutsideWindowDisclosure,
    };
  }
  const mmDd = match[1];
  const applies =
    mmDd >= product.guaranteeWindowStartMmDd &&
    mmDd <= product.guaranteeWindowEndMmDd;
  return {
    applies,
    disclosure: applies
      ? product.guaranteeAppliesDisclosure
      : product.guaranteeOutsideWindowDisclosure,
  };
}

export function lookupVerifiedPortCall(params: {
  physicalSailingId?: string | null;
  shipSlug?: string | null;
  sailDate?: string | null;
  organizerSlug?: string | null;
  sailingSlug?: string | null;
  portSlug?: string | null;
  includeNonPilot?: boolean;
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
    if (!call.pilotActive && !params.includeNonPilot) continue;

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
