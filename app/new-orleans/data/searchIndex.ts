import { ALL_PRODUCTS, CATEGORIES, AREAS, SEO_PAGES } from './index';
import { SearchIndexEntry } from './types';

// Build the search index only from LIVE and INDEXABLE records
function buildSearchIndex(): SearchIndexEntry[] {
  const index: SearchIndexEntry[] = [];

  // Products
  ALL_PRODUCTS.filter(p => p.status === 'live').forEach(p => {
    index.push({
      id: p.id,
      type: 'product',
      title: p.title,
      url: `/tours/${p.slug}`,
      keywords: (p as any).keywords || [], // type assertion for older data compatibility if any
      categoryIds: p.categoryIds,
      areaIds: p.areaIds,
      operatorName: p.operatorAttribution
    });
  });

  // Categories
  Object.values(CATEGORIES).filter(c => c.status === 'live').forEach(c => {
    index.push({
      id: c.id,
      type: 'category',
      title: c.title,
      url: `/${c.slug}`,
      keywords: [],
      categoryIds: [c.id],
      areaIds: [],
      operatorName: null
    });
  });

  // SEO Pages (Comparisons, Guides, Traveler-Fit)
  Object.values(SEO_PAGES).filter(s => s.status === 'live' && s.isIndexable).forEach(s => {
    index.push({
      id: s.id,
      type: 'page',
      title: s.heroTitle || s.canonicalRoute || "",
      url: s.canonicalRoute || "",
      keywords: [],
      categoryIds: [],
      areaIds: [],
      operatorName: null
    });
  });

  // Areas
  Object.values(AREAS).filter(a => a.status === 'live').forEach(a => {
    index.push({
      id: a.id,
      type: 'area',
      title: a.title,
      url: `/areas/${a.slug}`,
      keywords: [],
      categoryIds: [],
      areaIds: [a.id],
      operatorName: null
    });
  });

  return index;
}

export const SEARCH_INDEX = buildSearchIndex();

function normalize(text: string | null | undefined): string {
  if (!text) return '';
  return text.toLowerCase()
    .replace(/[^\w\s]|_/g, ' ') // replace punctuation with space
    .replace(/\s+/g, ' ') // condense whitespace
    .trim();
}

export function searchMarketplace(query: string): SearchIndexEntry[] {
  const normQuery = normalize(query);
  if (!normQuery) return [];

  const tokens = normQuery.split(' ');

  return SEARCH_INDEX.filter(entry => {
    const fields = [
      normalize(entry.title),
      normalize(entry.operatorName),
      ...entry.keywords.map(normalize)
    ].filter(Boolean);
    
    const combined = fields.join(' ');
    
    // Check if every token from the query exists somewhere in the combined fields
    return tokens.every(token => combined.includes(token));
  });
}
