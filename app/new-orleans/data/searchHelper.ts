import { ALL_PRODUCTS, LiveProductAdapter } from './index';
import { CATEGORIES, AREAS, SEO_PAGES, PROVIDERS } from './index';

export type SearchItemType = 'product' | 'category' | 'area' | 'guide';

export interface MarketplaceSearchItem {
  id: string;
  type: SearchItemType;
  title: string;
  description: string;
  href: string;
  keywords: string[];
  tags: string[];
  operator?: string;
}

export function getMarketplaceSearchItems(): MarketplaceSearchItem[] {
  const liveCategories = Object.values(CATEGORIES).filter(c => c.status === "live");
  const liveAreas = Object.values(AREAS).filter(a => a.status === "live");
  const liveGuides = Object.values(SEO_PAGES).filter(p => p.status === "live" && p.variant === "guide");
  const liveProducts = ALL_PRODUCTS.filter(p => p.status === "live") as LiveProductAdapter[];

  const searchItems: MarketplaceSearchItem[] = [
    ...liveProducts.map(p => {
      const provider = p.providerId ? PROVIDERS[p.providerId]?.publicAttributionName : undefined;
      const catId = p.categoryIds && p.categoryIds.length > 0 ? p.categoryIds[0] : '';
      return {
        id: p.id,
        type: 'product' as const,
        title: p.title,
        description: p.description,
        href: `/tours/${p.slug}`,
        keywords: [p.title, p.slug, provider || ''],
        operator: provider,
        tags: [catId === 'city-tours' ? 'City' : catId === 'swamp-tours' ? 'Swamp' : 'Plantation', 'Tour'],
      }
    }),
    ...liveCategories.map(c => ({
      id: c.id,
      type: 'category' as const,
      title: c.title,
      description: c.title,
      href: `/${c.slug}`,
      keywords: [c.title, c.slug],
      tags: ['Category']
    })),
    ...liveAreas.map(a => ({
      id: a.id,
      type: 'area' as const,
      title: a.title,
      description: a.visitorSummary || a.title,
      href: `/areas/${a.slug}`,
      keywords: [a.title, a.slug],
      tags: ['Area']
    })),
    ...liveGuides.map(g => ({
      id: g.id,
      type: 'guide' as const,
      title: g.heroTitle,
      description: g.openingAnswer || g.heroTitle,
      href: g.publicRoute,
      keywords: [g.heroTitle, g.id],
      tags: ['Guide']
    }))
  ];

  return searchItems;
}
