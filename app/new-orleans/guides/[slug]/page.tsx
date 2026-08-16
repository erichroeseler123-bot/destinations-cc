import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getSeoPageBySlug } from '../../data/pageMap';
import { getIntentSeoPage } from '../../data/intentSeoPages';
import { getAudienceIntentSeoPage } from '../../data/audienceIntentSeoPages';
import { CinematicIntentGuide, CinematicSeoGuide } from '../../components/CinematicGuideLayer';
import { buildSeoMetadata } from '../../lib/buildSeoMetadata';
import ConciergeQaChecklist from '../../admin/qa/ConciergeQaChecklist';
import LiveRouteAudit from '../../admin/qa/LiveRouteAudit';
import WnoWeeklyKpiDashboard from '../../admin/qa/WnoWeeklyKpiDashboard';
import { STOREFRONT_PRODUCTS } from '../../tours/pageConfig';

function getGovernedIntentPage(slug: string) {
  return getIntentSeoPage(slug) || getAudienceIntentSeoPage(slug);
}

function InternalQaDashboard() {
  const tours = STOREFRONT_PRODUCTS.map((product) => ({
    id: product.id,
    title: product.title,
    slug: product.slug,
    itemId: product.itemId,
    flowId: product.flowId,
    variantCount: product.bookingVariants?.length ?? 0,
  }));

  return (
    <>
      <WnoWeeklyKpiDashboard />
      <ConciergeQaChecklist tours={tours} />
      <LiveRouteAudit tours={tours} />
    </>
  );
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;

  if (resolvedParams.slug === 'internal-qa') return <InternalQaDashboard />;

  const intentPage = getGovernedIntentPage(resolvedParams.slug);
  if (intentPage) return <CinematicIntentGuide config={intentPage.config} />;

  const record = getSeoPageBySlug(`guides/${resolvedParams.slug}`);
  if (!record || record.status === "draft") notFound();
  return <CinematicSeoGuide page={record} />;
}

export async function generateMetadata({ params }: { params: Promise<{ slug?: string }> }): Promise<Metadata> {
  const p = await params;
  if (!p.slug) return notFound();

  if (p.slug === 'internal-qa') {
    return {
      title: 'New Orleans Concierge QA | Internal',
      robots: { index: false, follow: false, nocache: true },
    };
  }

  const intentPage = getGovernedIntentPage(p.slug);
  if (intentPage) {
    const canonical = `https://www.welcometoneworleanstours.com/guides/${intentPage.slug}`;
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
