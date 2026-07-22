// Consolidates route validation logic
import { SEO_PAGES } from './pages';

export function getSeoPageBySlug(slug: string) {
  const matchingKey = Object.keys(SEO_PAGES).find(key => {
    return SEO_PAGES[key].publicRoute === `/${slug}`;
  });
  if (!matchingKey) return null;
  return SEO_PAGES[matchingKey];
}