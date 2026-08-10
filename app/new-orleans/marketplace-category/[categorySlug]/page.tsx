import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getSeoPageBySlug } from '../../data/pageMap';
import SeoPageRenderer from '../../components/SeoPageRenderer';
import WnoBreadcrumbs from '../../components/WnoBreadcrumbs';
import { buildSeoMetadata } from '../../lib/buildSeoMetadata';

export default async function CategoryPage({ params }: { params: Promise<{ categorySlug: string }> }) {
  const resolvedParams = await params;
  const record = getSeoPageBySlug(resolvedParams.categorySlug);
  if (!record || record.status === "draft") {
    notFound();
  }

  return (
    <>
      <WnoBreadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "New Orleans Tours", path: "/tours" },
          { name: record.heroTitle, path: record.publicRoute },
        ]}
      />
      <SeoPageRenderer page={record} />
    </>
  );
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
