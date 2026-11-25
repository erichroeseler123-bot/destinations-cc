import { strict as assert } from "node:assert";
import { test } from "node:test";
import { buildProviderAffiliateHandoffUrl } from "../../lib/dcc/commerce";
import { getCheckoutComparison, getAlternateCheckoutIds, type CheckoutComparison } from "../../lib/dcc/cruise/reviewedCheckoutComparisons";
import { buildExactExcursionHandoffLinks, resolveCruisePortExcursionProfile } from "../../lib/dcc/cruisePortExcursionCatalogEngine";
import type { DurableTourRecord } from "../../lib/dcc/catalog/durableCatalogStore";

const site = "cruisepromenade.com";
const tour = {
  tourId: "dcc:tour:viator:217546P4", destinationSlug: "juneau",
  primaryProvider: "viator", providerProductCode: "217546P4",
};
const operatorUrl = "https://fareharbor.com/embeds/book/segwayalaska/items/433263/?asn=fhdn&asn-ref=aktourcenter&full-items=yes&flow=no&branding=yes&bookable-only=yes&ref=cruisepromenade-juneau&back=https://cruisepromenade.com/ports/juneau";
const viatorUrl = "https://www.viator.com/tours/Juneau/Rainforest-eBike-Adventure/d941-217546P4";
const terms = {
  sourceUrl: viatorUrl, priceText: null, cancellationText: null, fullRefundCutoffHours: 24,
  pickupText: null, checkInText: null, departureText: null,
};
const comparison: CheckoutComparison = {
  operatorName: "iRide Alaska Adventures", verifiedAt: "2026-11-23",
  fareharbor: { ...terms, url: operatorUrl, sourceUrl: operatorUrl },
  viator: terms,
};
const reviewed = {
  port: "juneau", alternateTourId: "dcc:tour:fh:segwayalaska:433263", fareharborProductCode: "segwayalaska:433263", viatorProductCode: "217546P4",
  travelerTerms: "equal" as const, comparison,
};
const pilot = {
  dashboardVerifiedRefs: { "cruisepromenade-juneau": "2026-11-23" },
  matches: { [tour.tourId]: reviewed },
};

test("pending pilot publishes nothing, including when only one review passes", () => {
  assert.equal(getCheckoutComparison(tour, site), undefined);
  assert.equal(getCheckoutComparison(tour, site, { ...pilot, dashboardVerifiedRefs: {} }), undefined);
  assert.equal(getCheckoutComparison(tour, site, {
    ...pilot, matches: { [tour.tourId]: { ...reviewed, travelerTerms: "pending" } },
  }), undefined);
});

test("approved comparison applies to one exact CP Juneau tour in either canonical direction", () => {
  assert.deepEqual(getCheckoutComparison(tour, site, pilot), comparison);
  assert.equal(getCheckoutComparison({ ...tour, destinationSlug: "skagway" }, site, pilot), undefined);
  assert.equal(getCheckoutComparison(tour, "cruisepromenade.com.example.org", pilot), undefined);
  assert.equal(getCheckoutComparison({ ...tour, providerProductCode: "MISMATCH" }, site, pilot), undefined);
  const fhPrimary = { ...tour, tourId: "dcc:tour:fh:segwayalaska:433263",
    primaryProvider: "fareharbor", providerProductCode: reviewed.fareharborProductCode };
  const alt = getCheckoutComparison(fhPrimary, site, { ...pilot, matches: { [fhPrimary.tourId]: reviewed } });
  assert.equal(alt?.viator.url, viatorUrl);
  assert.equal(alt?.viator.productCode, tour.providerProductCode);
});

test("wrong item, altered tracking, or a worse documented refund window cannot appear", () => {
  for (const fareharbor of [
    { ...comparison.fareharbor, url: operatorUrl.replace("/433263/", "/433264/") },
    { ...comparison.fareharbor, url: operatorUrl + "&ref=other" },
    { ...comparison.fareharbor, url: operatorUrl.replace("asn-ref=aktourcenter", "asn-ref=other") },
    { ...comparison.fareharbor, fullRefundCutoffHours: 72 },
  ]) {
    const match = { ...reviewed, comparison: { ...comparison, fareharbor } };
    assert.equal(getCheckoutComparison(tour, site, { ...pilot, matches: { [tour.tourId]: match } }), undefined);
  }
});

test("the CP test handoff preserves the issued URL while retaining a local click identifier", () => {
  const args = { originatingSite: site, provider: "fareharbor" as const, providerAccount: "fhdn",
    productCode: tour.providerProductCode, productDestinationUrl: operatorUrl, handoffId: "test-handoff",
    intendedDate: "2027-06-03", partySize: 2, campaign: "cp_port_day" };
  const result = buildProviderAffiliateHandoffUrl(args);
  assert.equal(result.outboundAffiliateUrl, operatorUrl);
  assert.equal(result.providerAccount, "aktourcenter");
  assert.equal(result.attributionParameterValue, "cruisepromenade-juneau");
  assert.match(result.clickId, /^clk_/);
  const unrelated = buildProviderAffiliateHandoffUrl({ ...args, originatingSite: "destinationcommandcenter.com" });
  assert.notEqual(unrelated.attributionParameterValue, "cruisepromenade-juneau");
});

test("existing Juneau FareHarbor-only checkout keeps its destination and has accurate seller metadata", () => {
  const url = "https://fareharbor.com/embeds/book/northstartrekking/items/116037/?asn=fhdn";
  const handoff = buildExactExcursionHandoffLinks({
    rec: { tourId: "dcc:tour:fh:northstartrekking:116037", primaryProvider: "fareharbor",
      providerProductCode: "northstartrekking:116037", bookingUrl: url } as DurableTourRecord,
    profile: resolveCruisePortExcursionProfile("juneau")!, optionCode: null, sailingDate: "2027-06-03",
    shipArrivalTime: "08:00", shipAllAboardTime: "17:00", originatingSite: site,
  });
  assert.equal(handoff.exactProductUrl, url);
  assert.equal(handoff.provider, "fareharbor");
  assert.equal(handoff.approvedAffiliateAccount, undefined);
  assert.equal(handoff.referralCreditStatus, "unverified_affiliate_attribution");
});

test("other ports use the port-specific CP reference and Viator destination", () => {
  const reference = "cruisepromenade-skagway";
  const port = "skagway";
  const target = { ...tour, destinationSlug: port };
  const tagged = operatorUrl.replace("ref=cruisepromenade-juneau", "ref=" + reference);
  const otherPort = { ...reviewed, port, comparison: { ...comparison,
    fareharbor: { ...comparison.fareharbor, url: tagged },
    viator: { ...comparison.viator, sourceUrl: viatorUrl.replace("/d941-", "/d943-") } } };
  const reviews = { dashboardVerifiedRefs: { [reference]: "2026-11-23" }, matches: { [tour.tourId]: otherPort } };
  assert.ok(getCheckoutComparison(target, site, reviews));
  assert.equal(getCheckoutComparison(target, site, { ...reviews, dashboardVerifiedRefs: {} }), undefined);
  assert.deepEqual(getAlternateCheckoutIds(port, site, "", reviews), [reviewed.alternateTourId]);
  assert.deepEqual(getAlternateCheckoutIds(port, site, reviewed.alternateTourId, reviews), []);
  assert.deepEqual(getAlternateCheckoutIds(port, site, "433263", reviews), []);
  assert.deepEqual(getAlternateCheckoutIds(port, "elsewhere.example", "", reviews), []);
});
