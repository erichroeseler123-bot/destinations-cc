import { notFound } from "next/navigation";
import type { Metadata } from "next";
import FareHarborLightframeLoader from "../../components/FareHarborLightframeLoader";
import TourDetailBookingAction from "./TourDetailBookingAction";
import { headers } from "next/headers";
import { STOREFRONT_PRODUCTS, getFareHarborUrl, NEW_ORLEANS_TOURS_PATH } from "../pageConfig";
import JsonLd from "@/app/components/dcc/JsonLd";
import { buildBreadcrumbJsonLd, buildWebPageJsonLd } from "@/lib/dcc/jsonld";
import WikimediaImageCredit from "../../components/WikimediaImageCredit";
import TourDetailAnalytics from "./TourDetailAnalytics";
import RelatedTourLink from "./RelatedTourLink";
import { resolveProductImage } from "../../lib/imageResolver";
import RecommendationCallout from "./RecommendationCallout";
import { getRecommendation, CHOOSER_CATEGORIES, CHOOSER_PREFERENCES, CategoryId } from "../../help-me-choose/recommendationRules";
import TourLogisticsSummary from "../../components/TourLogisticsSummary";
import { TOUR_RECORDS } from "../../lib/tourRecommendationRules";
import { TOUR_DECISION_COPY } from "../../data/tourDecisionCopy";
import {
  isApprovedProductSlug,
  resolveFareHarborSource,
} from "../../lib/fareHarborAttribution";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = STOREFRONT_PRODUCTS.find((p) => p.slug === slug);
  if (!product) return {};

  const resolvedImage = resolveProductImage(product);
  const requestHeaders = await headers();
  const hostHeader = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "";
  const host = hostHeader.split(":")[0];
  const isWto = host === "welcometoneworleanstours.com" || host === "www.welcometoneworleanstours.com";
  const origin = isWto ? "https://www.welcometoneworleanstours.com" : "https://destinationcommandcenter.com";
  const canonical = isWto ? `/tours/${slug}` : `${NEW_ORLEANS_TOURS_PATH}/${slug}`;

  return {
    applicationName: "Welcome to New Orleans Tours",
    title: product.detailPageTitle,
    description: product.metaDescription,
    alternates: { canonical },
    metadataBase: new URL(origin),
    openGraph: {
      siteName: "Welcome to New Orleans Tours",
      title: product.detailPageTitle,
      description: product.metaDescription,
      url: canonical,
      type: "website",
      ...(resolvedImage && {
        images: [{ url: resolvedImage.src, width: 1200, height: 630, alt: resolvedImage.alt }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: product.detailPageTitle,
      description: product.metaDescription,
      ...(resolvedImage && { images: [resolvedImage.src] }),
    },
  };
}

export default async function TourDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const product = STOREFRONT_PRODUCTS.find((p) => p.slug === slug);
  if (!product) notFound();

  const relatedProduct = STOREFRONT_PRODUCTS.find((p) => p.slug === product.relatedTourSlug);
  const requestHeaders = await headers();
  const hostHeader = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "";
  const host = hostHeader.split(":")[0];
  const isWto = host === "welcometoneworleanstours.com" || host === "www.welcometoneworleanstours.com";
  const basePath = isWto ? "" : NEW_ORLEANS_TOURS_PATH;
  const pagePath = `${basePath}/tours/${slug}`;
  const fallbackHref = getFareHarborUrl(product.companyShortname, product.itemId, product.flowId);
  const ctaText = product.ctaLabel || "Check Dates & Prices";
  const resolvedImage = resolveProductImage(product);

  const decisionCopy = TOUR_DECISION_COPY[product.slug];
  const bestFit = product.bestFit?.length ? product.bestFit : decisionCopy?.bestFit;
  const notIdealFor = product.notIdealFor?.length ? product.notIdealFor : decisionCopy?.notIdealFor;
  const childrenConsiderations = product.childrenConsiderations?.length
    ? product.childrenConsiderations
    : decisionCopy?.childrenConsiderations;

  const resolvedSearchParams = await searchParams;
  const recommendedParam = typeof resolvedSearchParams.recommended === "string" ? resolvedSearchParams.recommended : "";
  let recommendationExplanation = "";
  if (recommendedParam) {
    const isCategory = CHOOSER_CATEGORIES.some((c) => c.id === recommendedParam);
    const pref = CHOOSER_PREFERENCES.find((p) => p.id === recommendedParam);
    let recResult = null;
    if (isCategory) recResult = getRecommendation(recommendedParam as CategoryId);
    else if (pref) recResult = getRecommendation(pref.categoryId, pref.id);
    if (recResult && recResult.primaryProductId === product.id) recommendationExplanation = recResult.explanation;
  }

  if (!isApprovedProductSlug(slug)) notFound();

  const requestedSource = typeof resolvedSearchParams.src === "string" ? resolvedSearchParams.src : undefined;
  const refCode = resolveFareHarborSource({
    productSlug: slug,
    requestedSource,
    hasValidRecommendation: Boolean(recommendationExplanation),
  });

  const bookingActions = (className: string) =>
    product.bookingVariants && product.bookingVariants.length > 0 ? (
      product.bookingVariants.map((variant: any, idx: number) => (
        <TourDetailBookingAction
          key={idx}
          product={product}
          refCode={refCode}
          fallbackHref={variant.bookingUrl || fallbackHref}
          ctaText={variant.label}
          variantLabel={variant.label}
          itemId={variant.itemId}
          flowId={variant.flowId}
          className={className}
        />
      ))
    ) : (
      <TourDetailBookingAction
        product={product}
        refCode={refCode}
        fallbackHref={fallbackHref}
        ctaText={ctaText}
        className={className}
      />
    );

  return (
    <div className="bg-[#151515] min-h-screen text-[#fdfbf7] font-[var(--font-sans)]">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            buildWebPageJsonLd({
              path: pagePath,
              name: product.detailPageTitle,
              description: product.metaDescription,
              isPartOfPath: isWto ? undefined : "/new-orleans",
            }),
            buildBreadcrumbJsonLd(
              isWto
                ? [
                    { name: "New Orleans Tours", item: "/" },
                    { name: product.title, item: pagePath },
                  ]
                : [
                    { name: "New Orleans", item: "/new-orleans" },
                    { name: "Tours", item: NEW_ORLEANS_TOURS_PATH },
                    { name: product.title, item: pagePath },
                  ]
            ),
            ...require("../../lib/schema").generateProductSchemaGraph({
              slug,
              name: product.title,
              description: product.detailSummary || product.description,
              providerName: product.operatorName,
            })["@graph"],
          ],
        }}
      />

      <TourDetailAnalytics productId={product.id} operatorId={product.companyShortname} />
      <FareHarborLightframeLoader />

      <main id="main-content">
        {!resolvedImage ? (
          <div className="w-full bg-[#1a1a1a] border-b border-[#2a2a2a] pt-12 pb-12 px-6">
            <div className="max-w-4xl mx-auto flex flex-col items-center md:items-start text-center md:text-left gap-4">
              <span className="inline-block bg-[#2a2a2a] text-[#fdfbf7] px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow-sm border border-[#333]">
                {product.category}
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-[var(--font-accent)] font-bold text-[#fdfbf7] leading-tight">{product.title}</h1>
              <p className="text-sm md:text-base font-bold text-[#d4af37] uppercase tracking-widest">Operated by {product.operatorName}</p>
              {product.detailSummary && (
                <div className="mt-2 border-l-4 border-[#d4af37] pl-4">
                  <span className="text-sm font-bold text-[#fdfbf7] tracking-wider">{product.detailSummary}</span>
                </div>
              )}
              <div className="mt-6 w-full md:w-auto flex flex-col gap-3">
                {bookingActions("inline-block w-full bg-[#d4af37] hover:bg-[#fdfbf7] text-[#1a1a1a] font-bold px-8 py-4 text-sm transition-colors uppercase tracking-widest text-center shadow-md")}
              </div>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-[70vh] min-h-[500px] max-h-[700px] overflow-hidden bg-[#1a1a1a]">
            <img src={resolvedImage.src} alt={resolvedImage.alt} className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#151515] via-[#151515]/60 to-[#151515]/20" />
            <div className="absolute inset-0 flex items-end">
              <div className="max-w-4xl mx-auto w-full px-6 pb-12 md:pb-16 text-center md:text-left">
                <div className="mb-4">
                  <span className="inline-block bg-[#1a1a1a] border border-[#2a2a2a] text-[#fdfbf7] px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow-sm">{product.category}</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-[var(--font-accent)] font-bold text-[#fdfbf7] mb-4 leading-tight">{product.title}</h1>
                <p className="text-sm md:text-base font-bold text-[#d4af37] uppercase tracking-widest mb-6">Operated by {product.operatorName}</p>
                {product.detailSummary && (
                  <div className="mb-8 border-l-4 border-[#d4af37] pl-4 max-w-2xl mx-auto md:mx-0">
                    <span className="text-base md:text-lg font-bold text-[#fdfbf7] tracking-wider">{product.detailSummary}</span>
                  </div>
                )}
                <div className="w-full md:w-auto flex flex-col justify-center md:justify-start gap-3">
                  {bookingActions("inline-block w-full bg-[#d4af37] hover:bg-[#fdfbf7] text-[#1a1a1a] font-bold px-8 py-4 text-sm transition-colors uppercase tracking-widest text-center shadow-md")}
                </div>
                {resolvedImage.attribution && (
                  <div className="mt-8 text-left">
                    {product.representativeCaption && <p className="text-xs text-[#aaaaaa] mb-1">{product.representativeCaption}</p>}
                    <WikimediaImageCredit image={resolvedImage.attribution as any} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
          <div className="grid md:grid-cols-12 gap-12 md:gap-16">
            <div className="md:col-span-7 space-y-12">
              <section className="grid sm:grid-cols-2 gap-8">
                <div>
                  <h2 className="text-xl font-[var(--font-accent)] font-bold text-[#fdfbf7] mb-4 border-b border-[#2a2a2a] pb-4">Best For</h2>
                  {bestFit && bestFit.length > 0 ? (
                    <ul className="space-y-3">
                      {bestFit.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-[#cccccc] leading-relaxed">
                          <span className="text-[#d4af37] mt-0.5">✓</span><span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-[#aaaaaa]">Review the experience format and logistics below to decide whether it fits your group.</p>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-[var(--font-accent)] font-bold text-[#fdfbf7] mb-4 border-b border-[#2a2a2a] pb-4">Not Ideal For</h2>
                  {notIdealFor && notIdealFor.length > 0 ? (
                    <ul className="space-y-3">
                      {notIdealFor.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-[#cccccc] leading-relaxed">
                          <span className="text-[#aaaaaa] mt-0.5">✕</span><span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-[#aaaaaa]">Check walking, timing, age, noise, and accessibility details before booking.</p>
                  )}
                </div>
              </section>

              <section>
                {recommendationExplanation && (
                  <RecommendationCallout explanation={recommendationExplanation} productId={product.id} contextId={recommendedParam} />
                )}
                <h2 className="text-2xl md:text-3xl font-[var(--font-accent)] font-bold text-[#fdfbf7] mb-6">What This Experience Is</h2>
                <p className="text-[#cccccc] leading-relaxed text-lg font-light">{product.detailSummary || product.description}</p>
                {product.historicalContextNote && (
                  <div className="mt-6 p-6 bg-[#1a1a1a] border-l-2 border-[#aaaaaa]">
                    <h3 className="text-[10px] font-bold text-[#aaaaaa] uppercase tracking-widest mb-2">Historical Context Note</h3>
                    <p className="text-sm text-[#aaaaaa] leading-relaxed">{product.historicalContextNote}</p>
                  </div>
                )}
              </section>

              <TourLogisticsSummary tourRecord={TOUR_RECORDS[product.slug]} />

              <section className="bg-[#1a1a1a] p-8 border border-[#2a2a2a]">
                <h2 className="text-xl font-[var(--font-accent)] font-bold text-[#fdfbf7] mb-4 border-b border-[#2a2a2a] pb-4">Children & Group Considerations</h2>
                {childrenConsiderations && childrenConsiderations.length > 0 ? (
                  <ul className="list-disc list-inside text-[#cccccc] space-y-2 text-sm leading-relaxed">
                    {childrenConsiderations.map((inc, idx) => <li key={idx}>{inc}</li>)}
                  </ul>
                ) : (
                  <p className="text-sm text-[#cccccc] leading-relaxed">Verify age minimums, child eligibility, and accessibility options directly in the operator checkout.</p>
                )}
              </section>

              {product.confirmedInclusions && product.confirmedInclusions.length > 0 && (
                <section className="bg-[#1a1a1a] p-8 border border-[#2a2a2a]">
                  <h2 className="text-xl font-[var(--font-accent)] font-bold text-[#fdfbf7] mb-4 border-b border-[#2a2a2a] pb-4">What’s Included</h2>
                  <ul className="list-disc list-inside text-[#cccccc] space-y-2 text-sm leading-relaxed mb-4">
                    {product.confirmedInclusions.map((inc, idx) => <li key={idx}>{inc}</li>)}
                  </ul>
                  <div className="bg-[#151515] p-4 border border-[#2a2a2a]">
                    <p className="text-[#aaaaaa] text-sm leading-relaxed"><strong>Note:</strong> Review the operator’s current inclusions in the FareHarbor checkout before completing your purchase.</p>
                  </div>
                </section>
              )}
            </div>

            <div className="md:col-span-5 space-y-8">
              <div className="sticky top-24 space-y-8">
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] p-8 shadow-xl">
                  <div className="text-center mb-6">
                    <span className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest block mb-2">Secure Booking</span>
                    <h3 className="text-2xl font-[var(--font-accent)] font-bold text-[#fdfbf7] leading-tight mb-2">{product.title}</h3>
                    <p className="text-sm font-bold text-[#aaaaaa]">Operated by {product.operatorName}</p>
                  </div>
                  <div className="mb-6 text-sm text-[#aaaaaa] leading-relaxed text-center bg-[#151515] p-4 border border-[#2a2a2a]">
                    <p><strong>Welcome to New Orleans Tours</strong> is an independent planning and booking-assistance site. Booking and payment are completed through the participating operator’s FareHarbor checkout. Exact times, availability, inclusions, restrictions, and operator terms are confirmed during checkout.</p>
                  </div>
                  <div className="space-y-3">
                    {bookingActions("flex items-center justify-center w-full min-h-[60px] bg-[#d4af37] hover:bg-[#fdfbf7] text-[#1a1a1a] font-bold px-6 py-4 text-sm transition-colors uppercase tracking-widest text-center shadow-md")}
                  </div>
                  <div className="mt-4 text-[11px] text-center text-[#aaaaaa] leading-relaxed space-y-2">
                    <p>Operator terms and policies apply. We are not the tour operator.</p>
                  </div>
                </div>

                <section className="bg-[#1a1a1a] p-8 border border-[#2a2a2a]">
                  <h2 className="text-xl font-[var(--font-accent)] font-bold text-[#fdfbf7] mb-4 border-b border-[#2a2a2a] pb-4">Verify Before Booking</h2>
                  <p className="text-sm text-[#aaaaaa] mb-4 leading-relaxed">Check the following details on the operator’s FareHarbor checkout:</p>
                  {product.bookingConfirmations && product.bookingConfirmations.length > 0 ? (
                    <ul className="space-y-3">
                      {product.bookingConfirmations.map((conf, idx) => (
                        <li key={idx} className="flex gap-3 text-sm text-[#cccccc] leading-relaxed"><span className="text-[#d4af37]">✓</span><span>{conf}</span></li>
                      ))}
                    </ul>
                  ) : (
                    <ul className="space-y-3">
                      {[
                        "Exact start time",
                        "Meeting or transportation location",
                        "Total duration",
                        "Cancellation policy",
                      ].map((item) => (
                        <li key={item} className="flex gap-3 text-sm text-[#cccccc] leading-relaxed"><span className="text-[#d4af37]">✓</span><span>{item}</span></li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            </div>
          </div>
        </div>

        {relatedProduct && (
          <div className="bg-[#101010] py-20 px-6 border-t border-[#2a2a2a]">
            <div className="max-w-4xl mx-auto">
              <div className="mb-10 text-center">
                <span className="text-[#d4af37] text-2xl mb-4 block">⚜️</span>
                <h2 className="text-2xl md:text-3xl font-[var(--font-accent)] font-bold text-[#fdfbf7] uppercase tracking-widest">Also Consider</h2>
              </div>
              <RelatedTourLink currentProductId={product.id} relatedProduct={relatedProduct} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
