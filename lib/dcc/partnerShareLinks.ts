export type PartnerRole =
  | "hotel_concierge"
  | "cruise_planner"
  | "flight_operator";

export type NetworkMarketId =
  | "new-orleans"
  | "juneau"
  | "colorado-red-rocks"
  | "colorado-mountain"
  | "cruise-ports";

export interface PartnerShareLinkSpec {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerRole: PartnerRole;
  partnerRoleLabel: string;
  market: NetworkMarketId;
  dccPagePath: string;
  shareableUrl: string;
  guestQuestionAnswered: string;
  whyPartnerSharesIt: string;
  nextStepStorefrontLabel: string;
  nextStepStorefrontDomain: string;
  nextStepStorefrontUrl: string;
  monetizationModel: "partner_commission" | "owned_operated" | "hybrid";
}

const DCC_BASE_URL = "https://www.destinationcommandcenter.com";

export function buildPartnerShareUrl(params: {
  dccPagePath: string;
  partnerId: string;
  partnerRole: PartnerRole;
  extraParams?: Record<string, string>;
}): string {
  const path = params.dccPagePath.startsWith("/")
    ? params.dccPagePath
    : `/${params.dccPagePath}`;
  const url = new URL(path, DCC_BASE_URL);
  url.searchParams.set("partner", params.partnerId.trim().toLowerCase());
  url.searchParams.set("partner_role", params.partnerRole);
  url.searchParams.set(
    "src",
    `dcc-partner-${params.partnerRole.replace(/_/g, "-")}:${params.partnerId.trim().toLowerCase()}`,
  );
  if (params.extraParams) {
    for (const [k, v] of Object.entries(params.extraParams)) {
      if (v) url.searchParams.set(k, v);
    }
  }
  return url.toString();
}

export function resolvePartnerAttributionFromParams(input: {
  partner?: string | null;
  partnerRole?: string | null;
  trafficSource?: string | null;
  cancelRef?: string | null;
  originatingPage?: string | null;
}): {
  partnerId: string | null;
  partnerRole: PartnerRole | null;
  isPartnerAttributed: boolean;
} {
  const rawPartner = (input.partner || "").trim().toLowerCase();
  const rawRole = (input.partnerRole || "").trim().toLowerCase();
  const rawSrc = (input.trafficSource || "").trim().toLowerCase();
  const rawPage = (input.originatingPage || "").trim();

  let partnerId: string | null = rawPartner || null;
  let partnerRole: PartnerRole | null = null;

  if (
    rawRole === "hotel_concierge" ||
    rawRole === "cruise_planner" ||
    rawRole === "flight_operator"
  ) {
    partnerRole = rawRole;
  }

  // Also check query params inside originatingPage if present
  if ((!partnerId || !partnerRole) && rawPage.includes("?")) {
    try {
      const parsed = new URL(rawPage, DCC_BASE_URL);
      if (!partnerId) {
        partnerId =
          parsed.searchParams.get("partner")?.trim().toLowerCase() || null;
      }
      const pageRole = parsed.searchParams
        .get("partner_role")
        ?.trim()
        .toLowerCase();
      if (
        !partnerRole &&
        (pageRole === "hotel_concierge" ||
          pageRole === "cruise_planner" ||
          pageRole === "flight_operator")
      ) {
        partnerRole = pageRole;
      }
    } catch {
      // ignore malformed URL
    }
  }

  // Infer from structured trafficSource e.g. dcc-partner-hotel-concierge:hotel-monteleone
  if (rawSrc.startsWith("dcc-partner-")) {
    const [prefixPart, partnerPart] = rawSrc.split(":");
    if (!partnerId && partnerPart) {
      partnerId = partnerPart.trim();
    }
    if (!partnerRole) {
      if (prefixPart.includes("hotel-concierge") || prefixPart.includes("concierge")) {
        partnerRole = "hotel_concierge";
      } else if (prefixPart.includes("cruise-planner") || prefixPart.includes("cruise")) {
        partnerRole = "cruise_planner";
      } else if (prefixPart.includes("flight-operator") || prefixPart.includes("flight")) {
        partnerRole = "flight_operator";
      }
    }
  }

  if (!partnerRole && input.cancelRef) {
    partnerRole = "flight_operator";
    if (!partnerId) {
      partnerId = `flight-op-${input.cancelRef.trim().toLowerCase()}`;
    }
  }

  if (partnerId && !partnerRole) {
    if (partnerId.includes("concierge") || partnerId.includes("hotel") || partnerId.includes("lodge")) {
      partnerRole = "hotel_concierge";
    } else if (partnerId.includes("cruise") || partnerId.includes("claa")) {
      partnerRole = "cruise_planner";
    } else if (partnerId.includes("flight") || partnerId.includes("heli") || partnerId.includes("air")) {
      partnerRole = "flight_operator";
    }
  }

  return {
    partnerId,
    partnerRole,
    isPartnerAttributed: Boolean(partnerId || partnerRole),
  };
}

export const PARTNER_SHARE_LINKS: readonly PartnerShareLinkSpec[] = [
  // 1. New Orleans — Hotel Concierges
  {
    id: "nola-hotel-concierge-swamp-pickup",
    partnerId: "fq-hotel-concierge",
    partnerName: "French Quarter Hotel Concierge Desk",
    partnerRole: "hotel_concierge",
    partnerRoleLabel: "Hotel Concierge",
    market: "new-orleans",
    dccPagePath: "/new-orleans/swamp-tours",
    shareableUrl: buildPartnerShareUrl({
      dccPagePath: "/new-orleans/swamp-tours",
      partnerId: "fq-hotel-concierge",
      partnerRole: "hotel_concierge",
      extraParams: { pickup: "hotel" },
    }),
    guestQuestionAnswered:
      "Which New Orleans swamp tour includes French Quarter hotel pickup, and should our family take a covered boat (all ages) or airboat (age 5+)?",
    whyPartnerSharesIt:
      "Prevents guests from stranding themselves at rural Slidell/Jean Lafitte docks without return Uber/Lyft or booking an airboat with kids under 5.",
    nextStepStorefrontLabel: "Welcome to New Orleans Tours (WNO Swamp Storefront)",
    nextStepStorefrontDomain: "welcometoneworleanstours.com",
    nextStepStorefrontUrl:
      "https://www.welcometoneworleanstours.com/swamp-tours?partner=fq-hotel-concierge&partner_role=hotel_concierge&src=dcc-partner-hotel-concierge:fq-hotel-concierge",
    monetizationModel: "partner_commission",
  },
  // 2. New Orleans — Cruise Planners
  {
    id: "nola-cruise-planner-port-window",
    partnerId: "nola-cruise-planner",
    partnerName: "Port of New Orleans Cruise & Pre/Post-Stay Planner",
    partnerRole: "cruise_planner",
    partnerRoleLabel: "Cruise Planner",
    market: "new-orleans",
    dccPagePath: "/new-orleans/tours",
    shareableUrl: buildPartnerShareUrl({
      dccPagePath: "/new-orleans/tours",
      partnerId: "nola-cruise-planner",
      partnerRole: "cruise_planner",
      extraParams: { berth: "ERATO", all_aboard: "14:30" },
    }),
    guestQuestionAnswered:
      "Which New Orleans swamp, riverboat, or city tours fit a pre-cruise embarkation morning or post-cruise flight window from Erato / Julia St. Terminals?",
    whyPartnerSharesIt:
      "Calculates exact gangway return margin (60–90 min buffer) and routes directly to Gray Line, Ragin Cajun, and Southern Style tours on WNO.",
    nextStepStorefrontLabel: "Welcome to New Orleans Tours (Full Storefront)",
    nextStepStorefrontDomain: "welcometoneworleanstours.com",
    nextStepStorefrontUrl:
      "https://www.welcometoneworleanstours.com/tours?partner=nola-cruise-planner&partner_role=cruise_planner&src=dcc-partner-cruise-planner:nola-cruise-planner",
    monetizationModel: "partner_commission",
  },
  // 3. Juneau — Cruise Planners (Short Port Call)
  {
    id: "juneau-cruise-planner-short-port-call",
    partnerId: "alaska-cruise-planner",
    partnerName: "Alaska Cruise Planner & Shore Excursion Desk",
    partnerRole: "cruise_planner",
    partnerRoleLabel: "Cruise Planner",
    market: "juneau",
    dccPagePath: "/juneau/cruise-excursions-what-to-do",
    shareableUrl: buildPartnerShareUrl({
      dccPagePath: "/juneau/cruise-excursions-what-to-do",
      partnerId: "alaska-cruise-planner",
      partnerRole: "cruise_planner",
      extraParams: { claa_arrival: "07:00", all_aboard: "13:00", berth: "AJ" },
    }),
    guestQuestionAnswered:
      "Which Juneau whale watching or glacier excursions safely fit a short 5.5–6.5 hour port call with a 60–90 minute all-aboard buffer?",
    whyPartnerSharesIt:
      "Shows CLAA berth transfer + tour duration math so cruise guests book 3.5h Auke Bay Whale Watching (331813P1) or 3.0h Mendenhall Express (5857SHUTTLE) instead of missing all-aboard on a 5.5h combo.",
    nextStepStorefrontLabel: "Last Frontier Shore Excursions & Juneau Flight Deck",
    nextStepStorefrontDomain: "lastfrontiershoreexcursions.com",
    nextStepStorefrontUrl:
      "https://www.lastfrontiershoreexcursions.com/juneau/whale-watching?partner=alaska-cruise-planner&partner_role=cruise_planner&src=dcc-partner-cruise-planner:alaska-cruise-planner",
    monetizationModel: "partner_commission",
  },
  // 4. Juneau — Flight Operators (Canceled Helicopter Backup)
  {
    id: "juneau-flight-operator-weather-backup",
    partnerId: "juneau-heli-dispatch",
    partnerName: "Juneau Helicopter Dispatch & Weather Recovery Desk",
    partnerRole: "flight_operator",
    partnerRoleLabel: "Flight Operator",
    market: "juneau",
    dccPagePath: "/juneau/what-to-do-if-helicopter-tour-canceled",
    shareableUrl: buildPartnerShareUrl({
      dccPagePath: "/juneau/what-to-do-if-helicopter-tour-canceled",
      partnerId: "juneau-heli-dispatch",
      partnerRole: "flight_operator",
      extraParams: { flight_canceled: "1", cancel_ref: "wx-ceiling-hold" },
    }),
    guestQuestionAnswered:
      "My Juneau glacier helicopter tour was just canceled for low cloud ceilings — what same-day excursion can still run before my ship departs?",
    whyPartnerSharesIt:
      "Gives grounded helicopter passengers an immediate, constructive same-day Auke Bay Whale Deck backup while PAJN ceilings are MVFR/IFR, reducing dock desk friction.",
    nextStepStorefrontLabel: "Juneau Flight Deck (Whale Deck Backup Flow)",
    nextStepStorefrontDomain: "juneauflightdeck.com",
    nextStepStorefrontUrl:
      "https://juneauflightdeck.com/juneau-whale-watching-tours?flight_canceled=1&cancel_ref=wx-ceiling-hold&partner=juneau-heli-dispatch&partner_role=flight_operator&src=dcc-partner-flight-operator:juneau-heli-dispatch",
    monetizationModel: "partner_commission",
  },
  // 5. Colorado Red Rocks — Hotel Concierges & Venue Hosts
  {
    id: "colorado-red-rocks-hotel-concierge",
    partnerId: "denver-hotel-concierge",
    partnerName: "Denver Downtown & Golden Hotel Concierge Desk",
    partnerRole: "hotel_concierge",
    partnerRoleLabel: "Hotel Concierge",
    market: "colorado-red-rocks",
    dccPagePath: "/red-rocks-transportation",
    shareableUrl: buildPartnerShareUrl({
      dccPagePath: "/red-rocks-transportation",
      partnerId: "denver-hotel-concierge",
      partnerRole: "hotel_concierge",
    }),
    guestQuestionAnswered:
      "Should our hotel guests take Uber/Lyft, drive and park, or book a round-trip shuttle / private SUV to Red Rocks Amphitheatre?",
    whyPartnerSharesIt:
      "Explains why post-show Uber from Jurassic Lot breaks at 11:30 PM and routes guests directly to our owned Party at Red Rocks shared shuttle or private Suburban/Sprinter.",
    nextStepStorefrontLabel: "Party at Red Rocks (Owned & Operated)",
    nextStepStorefrontDomain: "partyatredrocks.com",
    nextStepStorefrontUrl:
      "https://www.partyatredrocks.com/book/red-rocks-amphitheatre/custom/shared?partner=denver-hotel-concierge&partner_role=hotel_concierge&src=dcc-partner-hotel-concierge:denver-hotel-concierge",
    monetizationModel: "owned_operated",
  },
  // 6. Colorado I-70 Mountain Travel — Resort & Lodge Concierges
  {
    id: "colorado-mountain-lodge-concierge",
    partnerId: "colorado-lodge-concierge",
    partnerName: "Vail & Breckenridge Resort Concierge Desk",
    partnerRole: "hotel_concierge",
    partnerRoleLabel: "Hotel Concierge",
    market: "colorado-mountain",
    dccPagePath: "/transportation/colorado",
    shareableUrl: buildPartnerShareUrl({
      dccPagePath: "/transportation/colorado",
      partnerId: "colorado-lodge-concierge",
      partnerRole: "hotel_concierge",
    }),
    guestQuestionAnswered:
      "What is the safest transfer from Denver Airport (DEN) to Vail or Breckenridge with ski bags under Colorado I-70 Traction Law (Code 15)?",
    whyPartnerSharesIt:
      "Prevents guests from booking an undersized 6-seat SUV for 6 people with 180cm ski bags or violating C.R.S. § 42-4-106 in an unequipped rental car, routing to GoSno private vans/SUVs.",
    nextStepStorefrontLabel: "GoSno Mountain Transfers (Owned & Operated)",
    nextStepStorefrontDomain: "gosno.co",
    nextStepStorefrontUrl:
      "https://gosno.co/vail?origin=DEN&destination=Vail&passengers=7&passengerCount=7&vehicleClass=van&partner=colorado-lodge-concierge&partner_role=hotel_concierge&src=dcc-partner-hotel-concierge:colorado-lodge-concierge",
    monetizationModel: "owned_operated",
  },
] as const;

export function getPartnerShareLinksForMarket(
  market: NetworkMarketId,
): PartnerShareLinkSpec[] {
  return PARTNER_SHARE_LINKS.filter((link) => link.market === market);
}
