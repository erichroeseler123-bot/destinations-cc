/**
 * Shareable January 24 Sailing Preview Builder (Nassau + St. Thomas Options)
 *
 * Models a 7-Night Eastern Caribbean Winter Sailing departing Sunday, January 24, 2027
 * (`2027-01-24`) with:
 * - Day 2 (Mon, Jan 25, 2027): Nassau, Bahamas (`08:00–16:30 EST` at Prince George Wharf NCP)
 * - Day 5 (Thu, Jan 28, 2027): St. Thomas, USVI (`08:00–16:30 AST` at Havensight WICO, with
 *   Crown Bay comparison and St. John day-trip ferry leg evaluation)
 *
 * Strictly separates Preview status (Draft PR #223 on `feat/dcc-coverage-expansion`)
 * from Production status (`main` untouched until human approval).
 */

import {
  evaluateStThomasPortDayScenario,
  type StThomasArrivalDock,
  type StThomasPortDayEvaluationResult,
} from "../stThomasPortDayEngine";
import {
  evaluateWinterPortDayScenario,
  type WinterPortEvaluationResult,
} from "./fivePortWinterReleaseEngine";

export interface January24SailingPreviewInput {
  adults?: number;
  childAges?: number[];
  nassauArrivalTime?: string;
  nassauAllAboardTime?: string;
  nassauDock?: "prince_george_wharf_ncp" | "prince_george_wharf_outer";
  stThomasArrivalTime?: string;
  stThomasAllAboardTime?: string;
  stThomasDock?: StThomasArrivalDock;
}

export interface January24SailingPreviewReport {
  sailingId: "january-24-eastern-caribbean-sailing-preview";
  sailingTitle: string;
  sailingDepartureDate: "2027-01-24";
  shareablePreviewPath: "/cruises/preview/january-24-sailing";
  shareableQueryExample: string;
  previewStatus: {
    environment: "preview_branch_pr_223";
    branch: "feat/dcc-coverage-expansion";
    draftPrNumber: 223;
    draftPrUrl: "https://github.com/erichroeseler123-bot/destinations-cc/pull/223";
    status: "ready_for_human_review";
    fiveWinterPortsReadyInPreview: readonly [
      "st-thomas",
      "nassau",
      "cozumel",
      "roatan",
      "grand-cayman",
    ];
    stThomas5199ksmlAnd5199p27Separated: true;
    vipaTemporaryNoticeEndedOn: "2026-10-31";
    vipaPostOct31NeedsConfirmationApplied: true;
    newOrleansAirboat75mSeparatedFromJeanLafitte: true;
    omniRiverfrontPickupStatus: "unconfirmed";
    hotelMonteleonePlacementStatus: "pending_operator_terms_and_hotel_approval";
  };
  productionStatus: {
    environment: "production_main";
    branch: "main";
    status: "unmodified_pending_human_approval";
    productionPublishingBlockedUntilHumanApproval: true;
    commercialTermsLockedUntilHumanApproval: true;
    summary: string;
  };
  calls: {
    nassau: {
      callDate: "2027-01-25";
      dayOfWeek: "Monday";
      evaluation: WinterPortEvaluationResult;
    };
    stThomas: {
      callDate: "2027-01-28";
      dayOfWeek: "Thursday";
      mainDestination: "st-thomas";
      evaluation: StThomasPortDayEvaluationResult;
      separateViEcoToursListings: {
        listing5199KSML: {
          productCode: "5199KSML";
          title: string;
          durationMinutes: 150;
          pickupMode: "self_drive";
          pickupSummary: string;
          priceUsd: 89;
          checkoutUrl: string;
          fitBadgeLabel: string;
          netMarginMinutes: number;
        };
        listing5199P27: {
          productCode: "5199P27";
          title: string;
          durationMinutes: 180;
          pickupMode: "self_drive";
          pickupSummary: string;
          priceUsd: 99;
          checkoutUrl: string;
          fitBadgeLabel: string;
          netMarginMinutes: number;
        };
      };
    };
  };
}

export function buildJanuary24SailingPreview(
  rawInput?: January24SailingPreviewInput,
): January24SailingPreviewReport {
  const adults = Math.max(1, Number(rawInput?.adults ?? 2));
  const childAges = Array.isArray(rawInput?.childAges)
    ? rawInput.childAges
    : [];
  const nassauArrivalTime = rawInput?.nassauArrivalTime || "08:00";
  const nassauAllAboardTime = rawInput?.nassauAllAboardTime || "16:30";
  const nassauDock = rawInput?.nassauDock || "prince_george_wharf_ncp";

  const stThomasArrivalTime = rawInput?.stThomasArrivalTime || "08:00";
  const stThomasAllAboardTime = rawInput?.stThomasAllAboardTime || "16:30";
  const stThomasDock: StThomasArrivalDock =
    rawInput?.stThomasDock || "havensight_wico";

  const nassauEval = evaluateWinterPortDayScenario({
    portSlug: "nassau",
    travelDate: "2027-01-25",
    shipArrivalTime: nassauArrivalTime,
    allAboardTime: nassauAllAboardTime,
    arrivalDock: nassauDock,
    adults,
    childAges,
    returnBufferMinutes: 60,
  });

  const stThomasEval = evaluateStThomasPortDayScenario({
    travelDate: "2027-01-28",
    shipArrivalTime: stThomasArrivalTime,
    allAboardTime: stThomasAllAboardTime,
    arrivalDock: stThomasDock,
    adults,
    childAges,
    returnBufferMinutes: 60,
  });

  const opt5199ksml = stThomasEval.allOptions.find(
    (o) => o.productCode === "5199KSML",
  )!;
  const opt5199p27 = stThomasEval.allOptions.find(
    (o) => o.productCode === "5199P27",
  )!;

  return {
    sailingId: "january-24-eastern-caribbean-sailing-preview",
    sailingTitle:
      "January 24 Winter Sailing Preview — Nassau (Jan 25) & St. Thomas (Jan 28) Port-Day Fit Report",
    sailingDepartureDate: "2027-01-24",
    shareablePreviewPath: "/cruises/preview/january-24-sailing",
    shareableQueryExample: `/cruises/preview/january-24-sailing?adults=${adults}&nassauDock=${nassauDock}&stThomasDock=${stThomasDock}&stThomasArrival=${stThomasArrivalTime}&stThomasAllAboard=${stThomasAllAboardTime}`,
    previewStatus: {
      environment: "preview_branch_pr_223",
      branch: "feat/dcc-coverage-expansion",
      draftPrNumber: 223,
      draftPrUrl:
        "https://github.com/erichroeseler123-bot/destinations-cc/pull/223",
      status: "ready_for_human_review",
      fiveWinterPortsReadyInPreview: [
        "st-thomas",
        "nassau",
        "cozumel",
        "roatan",
        "grand-cayman",
      ],
      stThomas5199ksmlAnd5199p27Separated: true,
      vipaTemporaryNoticeEndedOn: "2026-10-31",
      vipaPostOct31NeedsConfirmationApplied: true,
      newOrleansAirboat75mSeparatedFromJeanLafitte: true,
      omniRiverfrontPickupStatus: "unconfirmed",
      hotelMonteleonePlacementStatus:
        "pending_operator_terms_and_hotel_approval",
    },
    productionStatus: {
      environment: "production_main",
      branch: "main",
      status: "unmodified_pending_human_approval",
      productionPublishingBlockedUntilHumanApproval: true,
      commercialTermsLockedUntilHumanApproval: true,
      summary:
        "Production (`main`) remains unmodified. No candidate facts, St. Thomas / 5-port winter release pages, or New Orleans hotel-pickup changes are published to production until human reviewer sign-off and PR #223 merge.",
    },
    calls: {
      nassau: {
        callDate: "2027-01-25",
        dayOfWeek: "Monday",
        evaluation: nassauEval,
      },
      stThomas: {
        callDate: "2027-01-28",
        dayOfWeek: "Thursday",
        mainDestination: "st-thomas",
        evaluation: stThomasEval,
        separateViEcoToursListings: {
          listing5199KSML: {
            productCode: "5199KSML",
            title: opt5199ksml.title,
            durationMinutes: 150,
            pickupMode: "self_drive",
            pickupSummary: opt5199ksml.pickupSummary,
            priceUsd: 89,
            checkoutUrl: opt5199ksml.checkoutUrl!,
            fitBadgeLabel: opt5199ksml.fitBadgeLabel,
            netMarginMinutes: opt5199ksml.timing.netMarginMinutes,
          },
          listing5199P27: {
            productCode: "5199P27",
            title: opt5199p27.title,
            durationMinutes: 180,
            pickupMode: "self_drive",
            pickupSummary: opt5199p27.pickupSummary,
            priceUsd: 99,
            checkoutUrl: opt5199p27.checkoutUrl!,
            fitBadgeLabel: opt5199p27.fitBadgeLabel,
            netMarginMinutes: opt5199p27.timing.netMarginMinutes,
          },
        },
      },
    },
  };
}
