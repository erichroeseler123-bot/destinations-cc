import { notFound } from "next/navigation";
import type { Metadata } from "next";
import FareHarborLightframeLoader from "../../components/FareHarborLightframeLoader";
import FareHarborBookingButton from "../../components/FareHarborBookingButton";
import PhoneCta from "../../components/PhoneCta";
import Link from "next/link";
import { headers } from "next/headers";
import { STOREFRONT_PRODUCTS, getFareHarborUrl, NEW_ORLEANS_TOURS_PATH } from "../pageConfig";
import JsonLd from "@/app/components/dcc/JsonLd";
import { buildBreadcrumbJsonLd, buildWebPageJsonLd } from "@/lib/dcc/jsonld";
import { PRODUCT_IMAGES } from "../../data/imageRegistry";
import { WIKIMEDIA_IMAGES } from "../../data/wikimedia";
import WikimediaImageCredit from "../../components/WikimediaImageCredit";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = STOREFRONT_PRODUCTS.find((p) => p.slug === slug);
  if (!product) {
    return {};
  }

  const imgRecord = PRODUCT_IMAGES[slug];
  const wikimediaImage = product.wikimediaId ? require("../../data/wikimedia").WIKIMEDIA_IMAGES[product.wikimediaId] : null;
  const canUseImage = wikimediaImage || (product.imagePresentation !== "editorial" && imgRecord?.verifiedRights);

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
      ...(canUseImage && {
        images: [
          {
            url: wikimediaImage ? wikimediaImage.url : product.imageUrl,
            width: 1200,
            height: 630,
            alt: wikimediaImage ? wikimediaImage.alt : product.title,
          },
        ],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: product.detailPageTitle,
      description: product.metaDescription,
      ...(canUseImage && {
        images: [wikimediaImage ? wikimediaImage.url : product.imageUrl],
      }),
    },
  };
}

export default async function TourDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = STOREFRONT_PRODUCTS.find((p) => p.slug === slug);

  if (!product) {
    notFound();
  }

  const relatedProduct = STOREFRONT_PRODUCTS.find((p) => p.slug === product.relatedTourSlug);

  const requestHeaders = await headers();
  const hostHeader = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "";
  const host = hostHeader.split(":")[0];
  const isWto = host === "welcometoneworleanstours.com" || host === "www.welcometoneworleanstours.com";

  const basePath = isWto ? "" : NEW_ORLEANS_TOURS_PATH;
  const pagePath = `${basePath}/tours/${slug}`;
  const isAirboat = slug === "ragin-cajun-airboat-options";
  const refCodeMap: Record<string, string> = {
    "city-tour-of-new-orleans": "WTONOT-DETAIL-CITY",
    "oak-alley-or-laura-plantation-tour": "WTONOT-DETAIL-PLANTATION",
    "covered-tour-boat": "WTONOT-DETAIL-COVERED",
    "ragin-cajun-airboat-options": "WTONOT-DETAIL-AIRBOAT"
  };
  const refCode = refCodeMap[slug] || "WTONOT-DETAIL-UNKNOWN";
  const fallbackHref = getFareHarborUrl(product.companyShortname, product.itemId, product.flowId);
  const ctaText = product.ctaLabel || "Check Dates & Prices";

  const phoneMessages: Record<string, string> = {
    "city-tour-of-new-orleans": "Questions about pickup or group arrangements?",
    "oak-alley-or-laura-plantation-tour": "Need help choosing Oak Alley or Laura Plantation?",
    "covered-tour-boat": "Questions about transportation, timing, or groups?",
    "ragin-cajun-airboat-options": "Need help choosing an airboat option?"
  };
  const productPhoneMessage = phoneMessages[slug] || "Questions before booking?";

  const phonePlacementMap: Record<string, string> = {
    "city-tour-of-new-orleans": "WTONOT-DETAIL-CITY-PHONE",
    "oak-alley-or-laura-plantation-tour": "WTONOT-DETAIL-PLANTATION-PHONE",
    "covered-tour-boat": "WTONOT-DETAIL-COVERED-PHONE",
    "ragin-cajun-airboat-options": "WTONOT-DETAIL-AIRBOAT-PHONE"
  };
  const phonePlacement = phonePlacementMap[slug] || "WTONOT-DETAIL-UNKNOWN-PHONE";

  const imgRecord = PRODUCT_IMAGES[slug];
  const wikimediaImage = product.wikimediaId ? WIKIMEDIA_IMAGES[product.wikimediaId] : null;
  const canUseImage = wikimediaImage || (product.imagePresentation !== "editorial" && imgRecord?.verifiedRights);


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
              description: product.description,
              providerName: product.operatorName
            })["@graph"]
          ],
        }}
      />

      <FareHarborLightframeLoader />

      <main id="main-content">
        {/* Hero Section */}
        {!canUseImage ? (
          <div className="w-full bg-[#1a1a1a] border-b border-[#2a2a2a] pt-12 pb-12 px-6">
            <div className="max-w-4xl mx-auto flex flex-col items-center md:items-start text-center md:text-left gap-4">
              <span className="inline-block bg-[#2a2a2a] text-[#fdfbf7] px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow-sm border border-[#333]">
                {product.category}
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-[var(--font-accent)] font-bold text-[#fdfbf7] leading-tight">
                {product.title}
              </h1>
              <p className="text-sm md:text-base font-bold text-[#d4af37] uppercase tracking-widest">
                Operated by {product.operatorName}
              </p>
              {product.bestFor && (
                <div className="mt-2 border-l-4 border-[#d4af37] pl-4">
                  <span className="text-sm font-bold text-[#fdfbf7] uppercase tracking-widest">
                    {product.bestFor}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="relative w-full h-[60vh] min-h-[400px] max-h-[600px] overflow-hidden bg-[#1a1a1a]">
            <img
              src={wikimediaImage ? wikimediaImage.url : product.imageUrl!}
              alt={wikimediaImage ? wikimediaImage.alt : product.title}
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#151515] via-[#151515]/40 to-transparent" />
            <div className="absolute inset-0 flex items-end">
              <div className="max-w-4xl mx-auto w-full px-6 pb-12 md:pb-16 text-center md:text-left">
                <div className="mb-4">
                  <span className="inline-block bg-[#1a1a1a] border border-[#2a2a2a] text-[#fdfbf7] px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow-sm">
                    {product.category}
                  </span>
                </div>
                <h1 className="text-4xl md:text-6xl font-[var(--font-accent)] font-bold text-[#fdfbf7] mb-4 leading-tight">
                  {product.title}
                </h1>
                <p className="text-sm md:text-base font-bold text-[#d4af37] uppercase tracking-widest">
                  Operated by {product.operatorName}
                </p>
                {wikimediaImage && (
                  <div className="mt-4">
                    {product.representativeCaption && (
                      <p className="text-xs text-[#d4af37] mb-1">{product.representativeCaption}</p>
                    )}
                    <WikimediaImageCredit image={wikimediaImage} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Back Link */}
        <div className="md:hidden px-6 py-6 border-b border-[#2a2a2a] bg-[#1a1a1a]">
          <Link href="/" className="text-xs font-bold text-[#d4af37] uppercase tracking-widest flex items-center gap-2">
            ← View All Tours
          </Link>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
          <div className="grid md:grid-cols-12 gap-12 md:gap-16">

            {/* Editorial Content */}
            <div className="md:col-span-7 space-y-16 pb-24 md:pb-0">
              <section>
                {canUseImage && product.bestFor && (
                  <div className="mb-6 border-l-4 border-[#d4af37] pl-4">
                    <span className="text-sm font-bold text-[#fdfbf7] uppercase tracking-widest">
                      {product.bestFor}
                    </span>
                  </div>
                )}
                <h2 className="text-3xl font-[var(--font-accent)] font-bold text-[#fdfbf7] mb-6">The Experience</h2>
                <p className="text-[#cccccc] leading-relaxed text-lg font-light">
                  {product.description}
                </p>
              </section>

              <section className="bg-[#1a1a1a] p-8 border border-[#2a2a2a]">
                <h3 className="text-xl font-[var(--font-accent)] font-bold text-[#fdfbf7] mb-4 border-b border-[#2a2a2a] pb-4">Practical Details</h3>

                <div className="space-y-6">
                  {(product.durationLabel || product.transportationSummary || product.pickupSummary) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {product.durationLabel && (
                        <div>
                          <h4 className="text-[10px] font-bold text-[#fdfbf7] uppercase tracking-widest mb-1">Duration</h4>
                          <p className="text-[#aaaaaa] text-sm leading-relaxed">{product.durationLabel}</p>
                        </div>
                      )}
                      {product.transportationSummary && (
                        <div>
                          <h4 className="text-[10px] font-bold text-[#fdfbf7] uppercase tracking-widest mb-1">Transportation</h4>
                          <p className="text-[#aaaaaa] text-sm leading-relaxed">{product.transportationSummary}</p>
                        </div>
                      )}
                      {product.pickupSummary && (
                        <div className="md:col-span-2">
                          <h4 className="text-[10px] font-bold text-[#fdfbf7] uppercase tracking-widest mb-1">Pickup</h4>
                          <p className="text-[#aaaaaa] text-sm leading-relaxed">{product.pickupSummary}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {product.highlights && product.highlights.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-bold text-[#fdfbf7] uppercase tracking-widest mb-2">Highlights</h4>
                      <ul className="list-disc list-inside text-[#aaaaaa] text-sm leading-relaxed space-y-1">
                        {product.highlights.map((highlight, idx) => (
                          <li key={idx}>{highlight}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {product.bookingNote && (
                    <div className="border-t border-[#2a2a2a] pt-4 mt-4">
                      <h4 className="text-[10px] font-bold text-[#fdfbf7] uppercase tracking-widest mb-1">Booking Note</h4>
                      <p className="text-[#aaaaaa] text-sm leading-relaxed">{product.bookingNote}</p>
                    </div>
                  )}

                  {!product.durationLabel && !product.transportationSummary && !product.pickupSummary && (!product.highlights || product.highlights.length === 0) && !product.bookingNote && (
                    <p className="text-[#aaaaaa] leading-relaxed text-sm">
                      Current schedules, tour duration, meeting or pickup locations, pricing, and available capacity are managed directly by {product.operatorName} and will be confirmed during the booking process.
                    </p>
                  )}
                </div>
              </section>
              <section className="bg-[#1a1a1a] p-8 border border-[#2a2a2a] mt-16">
                <h3 className="text-xl font-[var(--font-accent)] font-bold text-[#fdfbf7] mb-4 border-b border-[#2a2a2a] pb-4">Explore More</h3>
                <div className="space-y-4">
                  {slug === "oak-alley-or-laura-plantation-tour" && (
                    <>
                      <Link href="/plantation-tours" className="block text-[#d4af37] hover:text-[#fdfbf7] transition-colors">
                        &rarr; View our full guide to Louisiana Plantation Tours
                      </Link>
                      <Link href="/plantation-tours/oak-alley-vs-laura" className="block text-[#d4af37] hover:text-[#fdfbf7] transition-colors">
                        &rarr; Compare Oak Alley vs. Laura Plantation
                      </Link>
                    </>
                  )}
                  {(slug === "ragin-cajun-airboat-options" || slug === "covered-tour-boat") && (
                    <>
                      <Link href="/swamp-tours" className="block text-[#d4af37] hover:text-[#fdfbf7] transition-colors">
                        &rarr; Explore all New Orleans Swamp Tours
                      </Link>
                      <Link href="/swamp-tours/airboat-vs-covered-boat" className="block text-[#d4af37] hover:text-[#fdfbf7] transition-colors">
                        &rarr; Read our comparison: Airboat vs. Covered Swamp Boat
                      </Link>
                    </>
                  )}
                  {slug === "city-tour-of-new-orleans" && (
                    <>
                      <Link href="/city-tours" className="block text-[#d4af37] hover:text-[#fdfbf7] transition-colors">
                        &rarr; Browse City Tours of New Orleans
                      </Link>
                      <Link href="/tours-for/first-time-visitors" className="block text-[#d4af37] hover:text-[#fdfbf7] transition-colors">
                        &rarr; See our recommendations for first-time visitors
                      </Link>
                    </>
                  )}
                  <Link href="/french-quarter-welcome-stop" className="block text-[#d4af37] hover:text-[#fdfbf7] transition-colors">
                    &rarr; Stop by our French Quarter Welcome Stop for in-person assistance
                  </Link>
                </div>
              </section>
            </div>

            {/* Booking Sidebar */}
            <div className="md:col-span-5">
              <div className="sticky top-32 bg-[#1a1a1a] border border-[#2a2a2a] p-8 shadow-xl">
                <div className="text-center mb-6">
                  <span className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest block mb-2">Secure Booking</span>
                  <h3 className="text-2xl font-[var(--font-accent)] font-bold text-[#fdfbf7]">Reserve Your Spot</h3>
                </div>

                <div className="mb-6 text-sm text-[#aaaaaa] leading-relaxed text-center bg-[#151515] p-4 border border-[#2a2a2a]">
                  <p>
                    <strong>Welcome to New Orleans Tours</strong> is an independent curated storefront. Booking opens through the official checkout for {product.operatorName}.
                  </p>
                </div>

                {isAirboat ? (
                  <a
                    href={fallbackHref}
                    className="flex items-center justify-center w-full min-h-[80px] bg-[#d4af37] hover:bg-[#fdfbf7] text-[#1a1a1a] font-bold px-6 py-4 text-sm transition-colors uppercase tracking-widest text-center shadow-md"
                  >
                    {ctaText}
                  </a>
                ) : (
                  <FareHarborBookingButton
                    productTitle={product.title}
                    productSlug={product.slug}
                    shortname={product.companyShortname}
                    itemId={product.itemId}
                    flowId={product.flowId}
                    asn="aktourcenter"
                    refCode={refCode}
                    fallbackHref={fallbackHref}
                    placement="desktop-sidebar"
                    className="flex items-center justify-center w-full min-h-[80px] bg-[#d4af37] hover:bg-[#fdfbf7] text-[#1a1a1a] font-bold px-6 py-4 text-sm transition-colors uppercase tracking-widest text-center shadow-md"
                  >
                    {ctaText}
                  </FareHarborBookingButton>
                )}

                <div className="mt-4 text-[11px] text-center text-[#aaaaaa] leading-relaxed space-y-2">
                  <p className="font-bold uppercase tracking-widest text-[#d4af37]">
                    Secure Booking With Operator
                  </p>
                  <p>
                    Availability and final pricing are confirmed in the operator’s checkout.
                  </p>
                  <p className="italic">
                    We may earn a commission when you book through links on this site, but all tours are operated by independent local providers.
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-[#2a2a2a] text-center">
                  <p className="text-[#fdfbf7] font-bold text-sm mb-1">{productPhoneMessage}</p>
                  <PhoneCta placement={phonePlacement} productId={product.itemId ? String(product.itemId) : undefined} productSlug={product.slug} className="text-[#d4af37] hover:text-[#fdfbf7] font-bold transition-colors">
                    Call 504-484-9687
                  </PhoneCta>
                </div>

                <div className="mt-4 pt-4 border-t border-[#2a2a2a]/50 text-center">
                  <p className="text-[#aaaaaa] text-sm mb-1">Planning for a group?</p>
                  <PhoneCta isGroup placement={phonePlacement} productId={product.itemId ? String(product.itemId) : undefined} productSlug={product.slug} className="text-[#d4af37] hover:text-[#fdfbf7] font-bold text-sm transition-colors">
                    Call for group rates and availability.
                  </PhoneCta>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Related Tour */}
        {relatedProduct && (
          <div className="bg-[#101010] py-20 px-6 border-t border-[#2a2a2a]">
            <div className="max-w-4xl mx-auto">
              <div className="mb-10 text-center">
                <span className="text-[#d4af37] text-2xl mb-4 block">⚜️</span>
                <h3 className="text-2xl md:text-3xl font-[var(--font-accent)] font-bold text-[#fdfbf7] uppercase tracking-widest">
                  Also Consider
                </h3>
              </div>

              <Link href={`/tours/${relatedProduct.slug}`} className="block group">
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] overflow-hidden hover:border-[#d4af37] transition-colors flex flex-col md:flex-row shadow-lg">
                  <div className="md:w-2/5 aspect-[16/9] md:aspect-auto relative overflow-hidden bg-[#151515]">
                    {(() => {
                      const relWikimediaImage = relatedProduct.wikimediaId ? WIKIMEDIA_IMAGES[relatedProduct.wikimediaId] : null;
                      const relCanUseImage = relWikimediaImage || (relatedProduct.imagePresentation !== "editorial" && PRODUCT_IMAGES[relatedProduct.slug]?.verifiedRights);

                      if (!relCanUseImage) {
                        return (
                          <div className="w-full h-full bg-[#1a1a1a] flex flex-col items-center justify-center p-8 group-hover:bg-[#2a2a2a] transition-colors duration-700 relative overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/[0.05] via-transparent to-black/[0.3]"></div>
                            <div className="absolute inset-4 border border-[#d4af37]/10"></div>
                            <span className="relative z-10 text-[11px] font-bold text-[#d4af37] uppercase tracking-[0.3em] text-center">{relatedProduct.category || "Tour"}</span>
                          </div>
                        );
                      }

                      return (
                        <img
                          src={relWikimediaImage ? relWikimediaImage.url : relatedProduct.imageUrl!}
                          alt={relWikimediaImage ? relWikimediaImage.alt : relatedProduct.title}
                          className="w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700"
                        />
                      );
                    })()}
                  </div>
                  <div className="p-8 md:w-3/5 flex flex-col justify-center">
                    <p className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest mb-2">
                      Operated by {relatedProduct.operatorName}
                    </p>
                    <h4 className="text-2xl font-[var(--font-accent)] font-bold text-[#fdfbf7] mb-4 group-hover:text-[#d4af37] transition-colors">
                      {relatedProduct.title}
                    </h4>
                    <p className="text-sm text-[#aaaaaa] leading-relaxed line-clamp-2 mb-6">
                      {relatedProduct.description}
                    </p>
                    <div>
                      <span className="inline-block border-b-2 border-[#fdfbf7] text-[#fdfbf7] font-bold pb-1 text-xs uppercase tracking-widest group-hover:text-[#d4af37] group-hover:border-[#d4af37] transition-colors">
                        View Details →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* Sticky Mobile CTA */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-[#2a2a2a] p-3 z-50 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.5)] pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
           <div className="flex gap-2">
             <PhoneCta placement="WTONOT-MOBILE-PHONE" productId={product.itemId ? String(product.itemId) : undefined} productSlug={product.slug} className="flex-1 flex items-center justify-center min-h-[50px] border border-[#d4af37] text-[#d4af37] bg-transparent font-bold text-[11px] uppercase tracking-widest text-center transition-colors">
               Call With<br/>Questions
             </PhoneCta>
             {isAirboat ? (
               <a
                 href={fallbackHref}
                 className="flex-1 flex items-center justify-center min-h-[50px] bg-[#d4af37] hover:bg-[#fdfbf7] text-[#1a1a1a] font-bold px-2 text-[11px] transition-colors uppercase tracking-widest text-center"
               >
                 {ctaText}
               </a>
             ) : (
               <FareHarborBookingButton
                 productTitle={product.title}
                 productSlug={product.slug}
                 shortname={product.companyShortname}
                 itemId={product.itemId}
                 flowId={product.flowId}
                 asn="aktourcenter"
                 refCode={refCode}
                 fallbackHref={fallbackHref}
                 placement="mobile-sticky"
                 className="flex-1 flex items-center justify-center min-h-[50px] bg-[#d4af37] hover:bg-[#fdfbf7] text-[#1a1a1a] font-bold px-2 text-[11px] transition-colors uppercase tracking-widest text-center"
               >
                 {ctaText}
               </FareHarborBookingButton>
             )}
           </div>
        </div>

      </main>
    </div>
  );
}
