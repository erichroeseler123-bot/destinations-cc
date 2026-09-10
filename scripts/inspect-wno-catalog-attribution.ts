import { STOREFRONT_PRODUCTS } from '../app/new-orleans/tours/pageConfig';
import { getExpectedFareHarborAsn, normalizeFareHarborFallbackHref } from '../app/new-orleans/lib/fareHarborAttribution';

console.log(`Total Storefront Products: ${STOREFRONT_PRODUCTS.length}`);

const catalogSummary = STOREFRONT_PRODUCTS.map((p) => {
  const effectiveAsn = getExpectedFareHarborAsn(p.companyShortname, 'aktourcenter');
  const sampleUrl = `https://fareharbor.com/embeds/book/${p.companyShortname}/items/${p.itemId || 'general'}/?asn=${effectiveAsn}`;
  const normalizedFallback = normalizeFareHarborFallbackHref({
    href: sampleUrl,
    shortname: p.companyShortname,
    requestedAsn: 'wrong',
  });
  return {
    slug: p.slug,
    title: p.title,
    category: p.category,
    operator: p.companyShortname,
    itemId: p.itemId,
    flowId: p.flowId,
    effectiveAsn,
    normalizedFallback,
  };
});

console.log(JSON.stringify(catalogSummary, null, 2));
