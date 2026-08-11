import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getSeoPageBySlug } from '../../data/pageMap';
import SeoPageRenderer from '../../components/SeoPageRenderer';
import FrenchQuarterCommercialHub from '../FrenchQuarterCommercialHub';
import { buildSeoMetadata } from '../../lib/buildSeoMetadata';

export default async function AreaPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const record = getSeoPageBySlug(`areas/${resolvedParams.slug}`);
  if (!record || record.status === "draft") {
    notFound();
  }

  if (resolvedParams.slug === "french-quarter") {
    return <FrenchQuarterCommercialHub />;
  }

  return <SeoPageRenderer page={record} />;
}

export async function generateMetadata({ params }: { params: Promise<{ slug?: string, categorySlug?: string, comparisonSlug?: string }> }): Promise<Metadata> {
  const p = await params;
  const record = getSeoPageBySlug(`areas/${p.slug}`);
  if (!record) return notFound();
  return buildSeoMetadata(record);
}
