// Consolidates route validation logic
import { SEO_PAGES } from './pages';
import { COMMERCIAL_CATEGORY_PAGES } from './commercialCategoryPages';
import { ADDITIONAL_COMMERCIAL_CATEGORY_PAGES } from './additionalCommercialCategoryPages';

export function getSeoPageBySlug(slug: string) {
  const publicRoute = `/${slug}`;
  const commercial = [
    ...Object.values(COMMERCIAL_CATEGORY_PAGES),
    ...Object.values(ADDITIONAL_COMMERCIAL_CATEGORY_PAGES),
  ].find((page) => page.publicRoute === publicRoute);
  if (commercial) return commercial;

  const matchingKey = Object.keys(SEO_PAGES).find((key) => {
    return SEO_PAGES[key].publicRoute === publicRoute;
  });
  if (!matchingKey) return null;
  return SEO_PAGES[matchingKey];
}
