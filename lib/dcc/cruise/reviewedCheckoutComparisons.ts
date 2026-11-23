import registryFile from "../../../data/catalog/cp-reviewed-checkouts.json";

type CheckoutTerms = {
  priceText: string | null;
  cancellationText: string | null;
  fullRefundCutoffHours: number | null;
  pickupText: string | null;
  checkInText: string | null;
  departureText: string | null;
  sourceUrl: string;
};

export type CheckoutComparison = {
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
  port: string;
  viatorProductCode: string;
  fareharborProductCode: string;
  alternateTourId?: string | null;
  evidenceUrl?: string;
  travelerTerms: "pending" | "equal" | "better" | "worse";
  comparison: Omit<CheckoutComparison, "fareharbor"> & { fareharbor: CheckoutTerms & { url: string | null } };
};

type Registry = {
  dashboardVerifiedRefs: Readonly<Record<string, string>>;
  matches: Readonly<Record<string, ReviewedMatch>>;
};

const registry = registryFile as Registry;

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

function referralReference(match: ReviewedMatch): string | undefined {
  const href = match.comparison.fareharbor.url;
  if (!href) return;
  const tags = exactFareHarborItem(href, match.fareharborProductCode)?.searchParams;
  if (!tags || tags.getAll("asn").join() !== "fhdn" || tags.getAll("asn-ref").join() !== "aktourcenter") return;
  const ref = tags.getAll("ref").join();
  if (ref === "cruisepromenade" || ref === `cruisepromenade-${match.port}`) return ref;
}

// Registered pilot links can be tested before their reference is visible in the booking report.
export function findCpFareHarborReferral(originatingSite: string, target: string) {
  if (originatingSite !== "cruisepromenade.com") return;
  const match = Object.values(registry.matches).find(entry => entry.comparison.fareharbor.url === target);
  if (!match) return;
  const reference = referralReference(match);
  if (!reference) return;
  const [operator, item] = match.fareharborProductCode.split(":");
  return { operator, item, account: "aktourcenter", reference };
}

export function getCheckoutComparison(
  tour: CatalogIdentity,
  originatingSite: string | null | undefined,
  reviews: Registry = registry,
): CheckoutComparison | undefined {
  if (originatingSite !== "cruisepromenade.com") return;
  const match = reviews.matches[tour.tourId];
  if (!match || match.port !== tour.destinationSlug ||
      (match.travelerTerms !== "equal" && match.travelerTerms !== "better")) return;
  const ref = referralReference(match);
  if (!ref || !Number.isFinite(Date.parse(reviews.dashboardVerifiedRefs[ref]))) return;

  const { fareharbor, viator } = match.comparison;
  if (!fareharbor.url || !Number.isFinite(Date.parse(match.comparison.verifiedAt))) return;
  const code = tour.primaryProvider === "viator" ? match.viatorProductCode : match.fareharborProductCode;
  if ((tour.primaryProvider !== "viator" && tour.primaryProvider !== "fareharbor") || tour.providerProductCode !== code) return;
  if (fareharbor.fullRefundCutoffHours !== null && viator.fullRefundCutoffHours !== null &&
      fareharbor.fullRefundCutoffHours > viator.fullRefundCutoffHours) return;
  let viatorUrl: URL;
  try {
    viatorUrl = new URL(viator.url ?? viator.sourceUrl);
  } catch {
    return;
  }
  const target = viatorUrl.pathname.match(/^\/tours\/.+\/d\d+-([\w-]+)\/?$/);
  if (viatorUrl.origin !== "https://www.viator.com" || viatorUrl.username || viatorUrl.password || target?.[1] !== match.viatorProductCode) return;
  return {
    ...match.comparison,
    fareharbor: { ...fareharbor, url: fareharbor.url },
    viator: tour.primaryProvider === "viator" ? viator : { ...viator, url: viatorUrl.href, productCode: match.viatorProductCode },
  };
}

// Suppress the alternate only on approved CP browse cards. Its original durable ID still resolves.
export function getAlternateCheckoutIds(
  port: string, site: string | null | undefined, search?: string, reviews: Registry = registry,
): string[] {
  if (site !== "cruisepromenade.com") return [];
  const query = search?.trim().toLowerCase();
  const ids: string[] = [];
  for (const [tourId, match] of Object.entries(reviews.matches)) {
    if (!match.alternateTourId || match.port !== port) continue;
    const identifiers = [match.alternateTourId, match.fareharborProductCode, match.fareharborProductCode.split(":")[1], match.viatorProductCode];
    if (query && identifiers.some(id => id?.toLowerCase() === query)) continue;
    const isViator = tourId === `dcc:tour:viator:${match.viatorProductCode}`;
    const tour = { tourId, primaryProvider: isViator ? "viator" : "fareharbor",
      providerProductCode: isViator ? match.viatorProductCode : match.fareharborProductCode, destinationSlug: port };
    if (getCheckoutComparison(tour, site, reviews)) ids.push(match.alternateTourId);
  }
  return ids;
}
