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
import { isApprovedProductSlug, resolveFareHarborSource } from "../../lib/fareHarborAttribution";
import { buildWnoBreadcrumbJsonLd, buildWnoWebPageJsonLd, generateProductSchemaGraph } from "../../lib/structuredData";
import styles from "./tourDetail.module.css";

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
    title: isWto ? { absolute: product.detailPageTitle } : product.detailPageTitle,
    description: product.metaDescription,
    alternates: { canonical },
    metadataBase: new URL(origin),
    openGraph: {
      siteName: "Welcome to New Orleans Tours",
      title: product.detailPageTitle,
      description: product.metaDescription,
      url: canonical,
      type: "website",
      ...(resolvedImage && { images: [{ url: resolvedImage.src, width: 1200, height: 630, alt: resolvedImage.alt }] }),
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
  if (!isApprovedProductSlug(slug)) notFound();

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
  const childrenConsiderations = product.childrenConsiderations?.length ? product.childrenConsiderations : decisionCopy?.childrenConsiderations;

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

  const requestedSource = typeof resolvedSearchParams.src === "string" ? resolvedSearchParams.src : undefined;
  const refCode = resolveFareHarborSource({
    productSlug: slug,
    requestedSource,
    hasValidRecommendation: Boolean(recommendationExplanation),
  });

  const bookingActions = (className: string) =>
    product.bookingVariants && product.bookingVariants.length > 0
      ? product.bookingVariants.map((variant: any, idx: number) => (
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
      : (
          <TourDetailBookingAction
            product={product}
            refCode={refCode}
            fallbackHref={fallbackHref}
            ctaText={ctaText}
            className={className}
          />
        );

  const identityGraph = isWto
    ? [
        buildWnoWebPageJsonLd({ path: pagePath, name: product.detailPageTitle, description: product.metaDescription }),
        buildWnoBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "New Orleans Tours", path: "/tours" },
          { name: product.title, path: pagePath },
        ]),
      ]
    : [
        buildWebPageJsonLd({ path: pagePath, name: product.detailPageTitle, description: product.metaDescription, isPartOfPath: "/new-orleans" }),
        buildBreadcrumbJsonLd([
          { name: "New Orleans", item: "/new-orleans" },
          { name: "Tours", item: NEW_ORLEANS_TOURS_PATH },
          { name: product.title, item: pagePath },
        ]),
      ];

  const firstBestFit = bestFit?.[0] || "Visitors comparing the right fit for their day";
  const secondBestFit = bestFit?.[1] || "Groups who want a curated New Orleans experience";

  return (
    <div className={styles.page}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            ...identityGraph,
            ...generateProductSchemaGraph({
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
        <section className={`${styles.hero} ${!resolvedImage ? styles.noImageHero : ""}`}>
          {resolvedImage && <img src={resolvedImage.src} alt={resolvedImage.alt} className={styles.heroImage} />}
          <div className={styles.heroShade} />
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <div className={styles.eyebrow}>{product.category} · Curated experience</div>
              <h1 className={styles.title}>{product.title}</h1>
              <div className={styles.operator}>Operated by {product.operatorName}</div>
              <p className={styles.summary}>{product.detailSummary || product.description}</p>
              <div className={styles.heroActions}>{bookingActions(styles.bookingButton)}</div>
            </div>
          </div>
          {resolvedImage?.attribution && (
            <div className={styles.heroCredit}>
              {product.representativeCaption && <p>{product.representativeCaption}</p>}
              <WikimediaImageCredit image={resolvedImage.attribution as any} />
            </div>
          )}
        </section>

        <section className={styles.decisionBar} aria-label="Quick fit summary">
          <div className={styles.decisionCell}>
            <div className={styles.decisionLabel}>Best fit</div>
            <div className={styles.decisionValue}>{firstBestFit}</div>
          </div>
          <div className={styles.decisionCell}>
            <div className={styles.decisionLabel}>Also works well for</div>
            <div className={styles.decisionValue}>{secondBestFit}</div>
          </div>
          <div className={styles.decisionCell}>
            <div className={styles.decisionLabel}>Booking</div>
            <div className={styles.decisionValue}>Current times & prices in FareHarbor</div>
          </div>
        </section>

        <div className={styles.main}>
          <div className={styles.content}>
            {recommendationExplanation && (
              <section className={styles.section}>
                <RecommendationCallout explanation={recommendationExplanation} productId={product.id} contextId={recommendedParam} />
              </section>
            )}

            <section className={styles.section}>
              <div className={styles.sectionKicker}>Why choose this</div>
              <h2 className={styles.sectionTitle}>Know the fit before you book</h2>
              <div className={styles.fitGrid} style={{ marginTop: 24 }}>
                <div className={styles.fitCard}>
                  <h3 className={styles.fitTitle}>Best for</h3>
                  {bestFit && bestFit.length > 0 ? (
                    <div className={styles.list}>
                      {bestFit.map((item, idx) => (
                        <div className={styles.listItem} key={idx}><span className={styles.check}>✓</span><span>{item}</span></div>
                      ))}
                    </div>
                  ) : <p className={styles.body}>Review the experience format and logistics below to decide whether it fits your group.</p>}
                </div>
                <div className={`${styles.fitCard} ${styles.fitCardMuted}`}>
                  <h3 className={styles.fitTitle}>Maybe skip it if</h3>
                  {notIdealFor && notIdealFor.length > 0 ? (
                    <div className={styles.list}>
                      {notIdealFor.map((item, idx) => (
                        <div className={styles.listItem} key={idx}><span className={styles.muted}>✕</span><span>{item}</span></div>
                      ))}
                    </div>
                  ) : <p className={styles.body}>Walking, timing, age, noise, or accessibility constraints matter for your group.</p>}
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionKicker}>The experience</div>
              <h2 className={styles.sectionTitle}>What this actually is</h2>
              <p className={styles.body}>{product.detailSummary || product.description}</p>
              {product.historicalContextNote && (
                <div className={styles.panel} style={{ marginTop: 24 }}>
                  <div className={styles.sectionKicker}>Historical context</div>
                  <p className={styles.body}>{product.historicalContextNote}</p>
                </div>
              )}
            </section>

            <section className={styles.section}>
              <div className={styles.sectionKicker}>Plan the day</div>
              <h2 className={styles.sectionTitle}>Timing, transportation & logistics</h2>
              <div style={{ marginTop: 24 }}><TourLogisticsSummary tourRecord={TOUR_RECORDS[product.slug]} /></div>
            </section>

            <section className={styles.section}>
              <div className={styles.panel}>
                <div className={styles.sectionKicker}>Groups & families</div>
                <h2 className={styles.sectionTitle} style={{ fontSize: "1.8rem" }}>Children & group considerations</h2>
                {childrenConsiderations && childrenConsiderations.length > 0 ? (
                  <div className={styles.list}>
                    {childrenConsiderations.map((item, idx) => (
                      <div className={styles.listItem} key={idx}><span className={styles.check}>•</span><span>{item}</span></div>
                    ))}
                  </div>
                ) : <p className={styles.body}>Verify age minimums, child eligibility, and accessibility options directly in the operator checkout.</p>}
              </div>
            </section>

            {product.confirmedInclusions && product.confirmedInclusions.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionKicker}>Included</div>
                <h2 className={styles.sectionTitle}>What comes with the experience</h2>
                <div className={styles.list}>
                  {product.confirmedInclusions.map((item, idx) => (
                    <div className={styles.listItem} key={idx}><span className={styles.check}>✓</span><span>{item}</span></div>
                  ))}
                </div>
                <p className={styles.body} style={{ fontSize: ".82rem" }}>Review the operator’s current inclusions in the FareHarbor checkout before completing your purchase.</p>
              </section>
            )}
          </div>

          <aside className={styles.sidebar}>
            <div className={styles.sticky}>
              <div className={styles.bookingCard}>
                <div className={styles.bookingKicker}>Check live availability</div>
                <h2 className={styles.bookingTitle}>{product.title}</h2>
                <div className={styles.bookingOperator}>Operated by {product.operatorName}</div>
                <p className={styles.bookingNote}>Choose a date and variant in the participating operator’s FareHarbor checkout. Exact times, availability, inclusions, restrictions and terms are confirmed there.</p>
                <div className={styles.bookingStack}>{bookingActions(styles.bookingButton)}</div>
              </div>

              <div className={styles.panel}>
                <h3 className={styles.verifyTitle}>Before you book</h3>
                <div className={styles.list}>
                  {(product.bookingConfirmations && product.bookingConfirmations.length > 0
                    ? product.bookingConfirmations
                    : ["Exact start time", "Meeting or transportation location", "Total duration", "Cancellation policy"]
                  ).map((item, idx) => (
                    <div className={styles.listItem} key={idx}><span className={styles.check}>✓</span><span>{item}</span></div>
                  ))}
                </div>
              </div>

              <div className={styles.panel}>
                <div className={styles.sectionKicker}>Independent concierge</div>
                <p className={styles.body} style={{ marginTop: 10, fontSize: ".84rem" }}>Welcome to New Orleans Tours helps visitors compare and choose participating experiences. Booking and payment are completed with the operator through FareHarbor.</p>
              </div>
            </div>
          </aside>
        </div>

        {relatedProduct && (
          <section className={styles.related}>
            <div className={styles.relatedInner}>
              <div className={styles.relatedHeading}>
                <span>Keep comparing</span>
                <h2>Also consider this experience</h2>
              </div>
              <RelatedTourLink currentProductId={product.id} relatedProduct={relatedProduct} />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
