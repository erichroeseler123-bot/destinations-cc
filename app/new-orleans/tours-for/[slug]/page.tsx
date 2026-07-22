import type { Metadata } from 'next';
import { SEO_PAGES } from '../../data/index';
import { notFound } from 'next/navigation';

import { getSeoPageBySlug } from '../../data/pageMap';
import SeoPageRenderer from '../../components/SeoPageRenderer';

export default async function TravelerFitPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const record = getSeoPageBySlug(`tours-for/${resolvedParams.slug}`);
  if (!record || record.status === "draft") {
    notFound();
  }
  return <SeoPageRenderer page={record} />;
}
import { buildSeoMetadata } from '../../lib/buildSeoMetadata';

export async function generateMetadata({ params }: { params: Promise<{ slug?: string, categorySlug?: string, comparisonSlug?: string }> }): Promise<Metadata> {
  const p = await params;
  const record = getSeoPageBySlug(`tours-for/${p.slug}`);
  if (!record) return notFound();
  return buildSeoMetadata(record);
}

