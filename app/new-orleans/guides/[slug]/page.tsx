import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getSeoPageBySlug } from '../../data/pageMap';
import { getIntentSeoPage } from '../../data/intentSeoPages';
import { getAudienceIntentSeoPage } from '../../data/audienceIntentSeoPages';
import SeoPageRenderer from '../../components/SeoPageRenderer';
import IntentSeoLanding from '../../components/IntentSeoLanding';
import { buildSeoMetadata } from '../../lib/buildSeoMetadata';

function getGovernedIntentPage(slug: string) {
  return getIntentSeoPage(slug) || getAudienceIntentSeoPage(slug);
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const intentPage = getGovernedIntentPage(resolvedParams.slug);
  if (intentPage) return <IntentSeoLanding config={intentPage.config} />;

  const record = getSeoPageBySlug(`guides/${resolvedParams.slug}`);
  if (!record || record.status === "draft") notFound();
  return <SeoPageRenderer page={record} />;
}

export async function generateMetadata({ params }: { params: Promise<{ slug?: string }> }): Promise<Metadata> {
  const p = await params;
  if (!p.slug) return notFound();

  const intentPage = getGovernedIntentPage(p.slug);
  if (intentPage) {
    const canonical = `https://welcometoneworleanstours.com/guides/${intentPage.slug}`;
    return {
      title: intentPage.title,
      description: intentPage.description,
      alternates: { canonical },
      robots: { index: true, follow: true },
      openGraph: { title: intentPage.title, description: intentPage.description, url: canonical, type: 'website' },
      twitter: { card: 'summary_large_image', title: intentPage.title, description: intentPage.description },
    };
  }

  const record = getSeoPageBySlug(`guides/${p.slug}`);
  if (!record) return notFound();
  return buildSeoMetadata(record);
}
