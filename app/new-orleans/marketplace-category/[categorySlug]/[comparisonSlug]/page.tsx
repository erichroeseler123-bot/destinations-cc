import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';

import { getSeoPageBySlug } from '../../../data/pageMap';
import SeoPageRenderer from '../../../components/SeoPageRenderer';
import { buildSeoMetadata } from '../../../lib/buildSeoMetadata';

const CANONICAL_COMPARISON_REDIRECTS: Record<string, string> = {
  'swamp-tours/airboat-vs-covered-boat': '/compare/covered-swamp-boat-vs-airboat',
  'swamp-tours/small-vs-large-airboat': '/compare/small-vs-large-airboat',
  'swamp-tours/pickup-vs-self-drive': '/compare/swamp-tour-with-vs-without-transportation',
};

export default async function ComparisonPage({ params }: { params: Promise<{ categorySlug: string, comparisonSlug: string }> }) {
  const resolvedParams = await params;
  const slug = `${resolvedParams.categorySlug}/${resolvedParams.comparisonSlug}`;
  const canonicalDestination = CANONICAL_COMPARISON_REDIRECTS[slug];

  if (canonicalDestination) {
    permanentRedirect(canonicalDestination);
  }

  const record = getSeoPageBySlug(slug);
  if (!record || record.status === "draft") {
    notFound();
  }
  return <SeoPageRenderer page={record} />;
}

export async function generateMetadata({ params }: { params: Promise<{ slug?: string, categorySlug?: string, comparisonSlug?: string }> }): Promise<Metadata> {
  const p = await params;
  
  let slugToLookup = "";
  if (p.categorySlug && p.comparisonSlug) {
    slugToLookup = `${p.categorySlug}/${p.comparisonSlug}`;
  } else {
    slugToLookup = p.comparisonSlug || p.slug || p.categorySlug || "";
  }
  
  const record = getSeoPageBySlug(slugToLookup);
  if (!record) return notFound();
  return buildSeoMetadata(record);
}
