import { Metadata } from 'next';
import { SeoPageRecord } from '../data/types';
import { notFound } from 'next/navigation';

export function buildSeoMetadata(record: SeoPageRecord | undefined): Metadata {
  if (!record || record.status !== 'live' || !record.isIndexable) {
    notFound();
  }

  // Handle defaults from record, or fallback
  const title = record.metadata?.title || record.heroTitle || 'New Orleans Tours';
  const description = record.metadata?.description || record.openingAnswer || '';
  const canonical = record.metadata?.canonicalRoute || record.canonicalRoute || '';

  return {
    title,
    description,
    alternates: {
      canonical
    },
    robots: {
      index: true,
      follow: true
    },
    openGraph: {
      title: record.metadata?.openGraphTitle || title,
      url: record.metadata?.openGraphUrl || canonical,
      siteName: 'Welcome to New Orleans Tours'
    },
    twitter: {
      card: 'summary_large_image',
      title: record.metadata?.twitterTitle || title
    }
  };
}
