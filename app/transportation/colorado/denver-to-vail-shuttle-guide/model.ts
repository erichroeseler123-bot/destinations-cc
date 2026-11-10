import {
  compileApplicableDecisionContext,
  getGoSnoRouteSnapshotDisplayPricing,
} from "@/lib/dcc/applicability";
import type { RecommendationAction } from "@/lib/dcc/handoffAnalytics";
import { getPublicMaterialChangeTimeline } from "@/lib/dcc/stewardship";
import { resolvePortfolioSiteContractByUrl } from "@/src/data/portfolio-site-contracts";
import { getPublicationManifestEntry } from "@/src/data/publication-manifest";
import { getPublishedDecisionGuide } from "@/src/data/published-decision-guides";

export const DENVER_TO_VAIL_SHUTTLE_GUIDE_PATH =
  "/transportation/colorado/denver-to-vail-shuttle-guide";

export function buildDenverToVailShuttleGuidePageModel() {
  const manifestEntry = getPublicationManifestEntry(
    DENVER_TO_VAIL_SHUTTLE_GUIDE_PATH,
  );
  const vailGuide = getPublishedDecisionGuide(
    "denver-airport-to-vail-rental-car-vs-private-transfer",
  );
  const vailPricing = getGoSnoRouteSnapshotDisplayPricing({
    routeId: "DEN-VAIL",
  });
  const verifiedAt =
    vailGuide?.verifiedAt || manifestEntry?.materialChangeDate || "2026-11-03";
  const citations = vailGuide?.citations || [];
  const gosnoContract = resolvePortfolioSiteContractByUrl(
    "https://gosno.co/vail",
  );
  const materialChangeEntries = getPublicMaterialChangeTimeline(
    "corridor:denver-vail-i70",
  );

  const vailVanPriceParam =
    vailPricing.vanFare.amountUsd !== null
      ? `&publishedPrice=${vailPricing.vanFare.amountUsd}`
      : "";

  const actions: RecommendationAction[] = [
    {
      id: "gosno-vail",
      label: "Continue to GoSno Vail Corridor Page",
      href: `https://gosno.co/vail?origin=DEN&destination=Vail&passengers=7&passengerCount=7&vehicleClass=van${vailVanPriceParam}`,
      kind: "external",
      score: 3,
      reason:
        "Routes directly to the Vail corridor booking wizard on GoSno (preserving DEN origin, Vail destination, 7-passenger count, and van vehicle class; ski-bag counts are entered on the form) instead of the generic homepage.",
    },
    {
      id: "gosno-vail-group-inquiry",
      label: "GoSno Private Multi-Vehicle Group Inquiry (11–50 Passengers)",
      href: "https://gosno.co/request-quote?origin=DEN&destination=Vail&passengers=16&passengerCount=16&party_size=16&vehicleType=van&vehicleSuggestion=1+Private+Passenger+Van+%2B+1+Private+Chevrolet+Suburban",
      kind: "external",
      score: 2,
      reason:
        "When a party exceeds GoSno's 10-passenger single-van cap, carries the full party size, route, date, and gear into GoSno's group inquiry (suggesting a van plus a Suburban for 16, or two vans for 20; GoSno confirms gear fit, availability, and one group total).",
    },
    {
      id: "gosno-operator-profile",
      label: "Review GoSno Operator Evidence Profile on DCC",
      href: "/operators/gosno",
      kind: "internal",
      score: 2,
      reason: `Inspect sourced vehicle caps (up to 6 in an SUV for ${vailPricing.suvPriceLabel}, or up to 10 in a van for ${vailPricing.vanPriceLabel} published / quoteOnly: true on /api/availability, subject to luggage and ski-gear fit; 11+ passengers exceed a single GoSno van), luggage rules, and alternatives before clicking out.`,
    },
    {
      id: "vail-decision-guide",
      label: "DEN to Vail: Rental Car vs. Private Transfer vs. Shuttle Guide",
      href: "/guides/denver-airport-to-vail-rental-car-vs-private-transfer",
      kind: "internal",
      score: 1,
      reason:
        "Compare private van vs. per-seat shared shuttle vs. two AWD rental SUVs vs. Bustang public transit.",
    },
  ];

  const basePartnerDestinationUrl = `https://gosno.co/vail?origin=DEN&destination=Vail&date=2026-12-15&passengers=6&passengerCount=6&party_size=6&standardBags=6&skiBags=2&vehicleClass=van${vailVanPriceParam}`;

  const initialOutcome = compileApplicableDecisionContext({
    corridorId: "corridor:denver-vail-i70",
    travelDate: "2026-12-15",
    passengerCount: 6,
    standardBagCount: 6,
    skiOrOversizeBagCount: 2,
    activeSegmentConditions: {
      i70TractionLawActive: true,
      vailPassChainLawActive: true,
    },
  });

  const capacityRuleSummary = `On GoSno, private SUV transfers cap at up to 6 passengers (${vailPricing.suvOneWayLabel} DEN to Vail), while private passenger vans carry up to 10 passengers, subject to luggage and ski-gear fit and availability (GoSno publishes a ${vailPricing.vanOneWayLabel} DEN–Vail van rate on gosno.co/vail, while its live /api/availability endpoint marks van requests quoteOnly: true).`;

  return {
    vailGuide,
    vailPricing,
    verifiedAt,
    citations,
    gosnoContract,
    materialChangeEntries,
    actions,
    basePartnerDestinationUrl,
    initialOutcome,
    capacityRuleSummary,
  };
}
