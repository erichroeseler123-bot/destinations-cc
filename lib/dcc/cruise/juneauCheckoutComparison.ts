type CheckoutTerms = {
  priceText: string | null;
  cancellationText: string | null;
  fullRefundCutoffHours: number | null;
  pickupText: string | null;
  checkInText: string | null;
  departureText: string | null;
  sourceUrl: string;
};

export type JuneauCheckoutComparison = {
  operatorName: string;
  verifiedAt: string;
  fareharbor: CheckoutTerms & { url: string };
  viator: CheckoutTerms & { url?: string; productCode?: string };
};

type CatalogIdentity = {
  tourId: string;
  primaryProvider: string;
  providerProductCode: string;
  destinationSlug: string;
};

type ReviewedMatch = {
  viatorProductCode: string;
  fareharborProductCode: string;
  travelerTerms: "pending" | "equal" | "better" | "worse";
  comparison: JuneauCheckoutComparison;
};

type CheckoutPilot = {
  dashboardReferenceVerifiedAt: string | null;
  matches: Readonly<Record<string, ReviewedMatch>>;
};

const viatorEbike = "https://www.viator.com/tours/Juneau/Rainforest-eBike-Adventure/d941-217546P4";
const fareharborEbike = "https://fareharbor.com/embeds/book/segwayalaska/items/433263/?asn=fhdn&asn-ref=aktourcenter&full-items=yes&flow=no&branding=yes&bookable-only=yes&ref=cruisepromenade-juneau&back=https://cruisepromenade.com/ports/juneau";

// Keep the original issued account parameters. Only the source reference identifies CP.
const juneauPilot: CheckoutPilot = {
  dashboardReferenceVerifiedAt: null,
  matches: {
    "dcc:tour:viator:217546P4": {
      viatorProductCode: "217546P4",
      fareharborProductCode: "segwayalaska:433263",
      travelerTerms: "pending",
      comparison: {
        operatorName: "iRide Alaska Adventures",
        verifiedAt: "2026-11-23",
        fareharbor: {
          url: fareharborEbike,
          sourceUrl: fareharborEbike,
          priceText: null,
          cancellationText: "Call at least 24 hours in advance for a full refund or credit. No-shows are charged.",
          fullRefundCutoffHours: null,
          pickupText: "490 South Franklin Street, Juneau",
          checkInText: null,
          departureText: null,
        },
        viator: {
          sourceUrl: viatorEbike,
          priceText: null,
          cancellationText: "Full refund with at least 24 hours’ notice.",
          fullRefundCutoffHours: 24,
          pickupText: "Roadside of the Mount Roberts Tramway, 490 South Franklin Street, Juneau",
          checkInText: "Arrive 10–15 minutes before the start.",
          departureText: null,
        },
      },
    },
  },
};

function exactFareHarborItem(rawUrl: string, productCode: string): URL | undefined {
  const [company, item] = productCode.split(":");
  if (!company || !/^\d+$/.test(item || "") || productCode !== `${company}:${item}`) return;
  try {
    const url = new URL(rawUrl);
    if (url.origin === "https://fareharbor.com" && !url.username && !url.password &&
        url.pathname === `/embeds/book/${company}/items/${item}/`) return url;
  } catch {
    return;
  }
}

export function isExactFareHarborItem(rawUrl: string, productCode: string): boolean {
  return Boolean(exactFareHarborItem(rawUrl, productCode));
}

function hasJuneauReferral(rawUrl: string, productCode: string): boolean {
  const tags = exactFareHarborItem(rawUrl, productCode)?.searchParams;
  return tags?.getAll("asn").join() === "fhdn" &&
    tags.getAll("asn-ref").join() === "aktourcenter" &&
    tags.getAll("ref").join() === "cruisepromenade-juneau";
}

/** Includes the one test link so its dashboard attribution can be checked before publication. */
export function findJuneauFareHarborReferral(originatingSite: string, target: string) {
  if (originatingSite !== "cruisepromenade.com") return;
  const match = Object.values(juneauPilot.matches).find(
    (entry) => entry.comparison.fareharbor.url === target,
  );
  if (!match || !hasJuneauReferral(target, match.fareharborProductCode)) return;
  const [operator, item] = match.fareharborProductCode.split(":");
  return { operator, item, account: "aktourcenter", reference: "cruisepromenade-juneau" };
}

export function getJuneauCheckoutComparison(
  tour: CatalogIdentity,
  originatingSite: string | null | undefined,
  pilot: CheckoutPilot = juneauPilot,
): JuneauCheckoutComparison | undefined {
  if (originatingSite !== "cruisepromenade.com" || tour.destinationSlug !== "juneau" || !pilot.dashboardReferenceVerifiedAt) {
    return;
  }

  const match = pilot.matches[tour.tourId];
  if (!match || (match.travelerTerms !== "equal" && match.travelerTerms !== "better")) return;

  const { fareharbor, viator } = match.comparison;
  const canonicalCode = tour.primaryProvider === "viator" ? match.viatorProductCode : match.fareharborProductCode;
  if ((tour.primaryProvider !== "viator" && tour.primaryProvider !== "fareharbor") || tour.providerProductCode !== canonicalCode) return;
  if (fareharbor.fullRefundCutoffHours !== null && viator.fullRefundCutoffHours !== null &&
      fareharbor.fullRefundCutoffHours > viator.fullRefundCutoffHours) return;

  if (!hasJuneauReferral(fareharbor.url, match.fareharborProductCode)) return;
  let viatorUrl: URL;
  try {
    viatorUrl = new URL(viator.sourceUrl);
  } catch {
    return;
  }
  if (viatorUrl.origin !== "https://www.viator.com" || viatorUrl.username || viatorUrl.password ||
      !viatorUrl.pathname.startsWith("/tours/") || !viatorUrl.pathname.endsWith(`/d941-${match.viatorProductCode}`)) return;

  return tour.primaryProvider === "viator" ? match.comparison : {
    ...match.comparison,
    viator: { ...viator, url: viatorUrl.href, productCode: match.viatorProductCode },
  };
}
