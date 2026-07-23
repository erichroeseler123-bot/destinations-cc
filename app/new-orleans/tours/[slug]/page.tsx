import { notFound } from "next/navigation";
import type { Metadata } from "next";
import FareHarborLightframeLoader from "../../components/FareHarborLightframeLoader";
import FareHarborBookingButton from "../../components/FareHarborBookingButton";
import Link from "next/link";
import { headers } from "next/headers";
import { STOREFRONT_PRODUCTS, getFareHarborUrl, NEW_ORLEANS_TOURS_PATH } from "../pageConfig";
import JsonLd from "@/app/components/dcc/JsonLd";
import { buildBreadcrumbJsonLd, buildWebPageJsonLd } from "@/lib/dcc/jsonld";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = STOREFRONT_PRODUCTS.find((p) => p.slug === slug);
  if (!product) {
    return {};
  }

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
      ...(product.imagePresentation !== "editorial" && {
        images: [
          {
            url: product.imageUrl,
            width: 1200,
            height: 630,
            alt: product.title,
          },
        ],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: product.detailPageTitle,
      description: product.metaDescription,
      ...(product.imagePresentation !== "editorial" && {
        images: [product.imageUrl],
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
  const isAirboat = slug === "ragin-cajun-airboat";
  const refCodeMap: Record<string, string> = {
    "city-tour": "WTONOT-DETAIL-CITY",
    "oak-alley-laura-plantation": "WTONOT-DETAIL-PLANTATION",
    "covered-tour-boat": "WTONOT-DETAIL-COVERED",
    "ragin-cajun-airboat": "WTONOT-DETAIL-AIRBOAT"
  };
  const refCode = refCodeMap[slug] || "WTONOT-DETAIL-UNKNOWN";
  const fallbackHref = getFareHarborUrl(product.companyShortname, product.itemId, product.flowId);
  const ctaText = isAirboat ? "View Details" : "Check Dates & Prices";


  return (
    <>
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
          ],
        }}
      />
      <div id="main-content" className="bg-[#FDFBF7] min-h-screen text-[#1a1a1a] font-[var(--font-sans)] pb-16">
        <FareHarborLightframeLoader />

        {/* Brand Header */}
        <header className="border-b border-[#E5E0D8] bg-[#FDFBF7] py-5 px-6 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚜️</span>
              <div>
                <h1 className="text-xl font-[var(--font-accent)] font-bold text-[#1a1a1a] tracking-tight leading-none uppercase">
                  Welcome To New Orleans Tours
                </h1>
                <span className="text-[10px] font-bold text-[#C5A059] tracking-widest uppercase">
                  A Curated Destination Marketplace
                </span>
              </div>
            </div>
            <Link href="/" className="hidden md:inline-flex text-xs font-bold text-[#1a1a1a] uppercase tracking-widest hover:text-[#C5A059] transition-colors border-b-2 border-transparent hover:border-[#C5A059] pb-1">
              ← View All Tours
            </Link>
          </div>
        </header>

        <main>
          {/* Immersive Hero */}
          <div className="relative w-full h-[60vh] min-h-[400px] max-h-[600px] overflow-hidden bg-[#1a1a1a]">
            {product.imagePresentation === "editorial" ? (
              <>
                <div className="absolute inset-0 bg-[#0B3B24] overflow-hidden">
                   {/* Abstract CSS texture / linework */}
                   <div className="absolute inset-0 opacity-10" style={{ backgroundSize: '20px 20px', backgroundImage: 'radial-gradient(circle at center, #C5A059 1px, transparent 1px)' }} />
                </div>
                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-[#C5A059] opacity-30 transform -translate-y-1/2"></div>
                <div className="absolute left-1/2 top-0 h-full w-[1px] bg-[#C5A059] opacity-30 transform -translate-x-1/2"></div>
              </>
            ) : (
              <>
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/40 to-transparent" />
              </>
            )}

            <div className="absolute inset-0 flex items-end">
              <div className="max-w-4xl mx-auto w-full px-6 pb-12 md:pb-16 text-center md:text-left">
                <div className="mb-4">
                  <span className="inline-block bg-[#FDFBF7] text-[#1a1a1a] px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow-sm">
                    {product.category}
                  </span>
                </div>
                <h2 className="text-4xl md:text-6xl font-[var(--font-accent)] font-bold text-[#FDFBF7] mb-4 leading-tight">
                  {product.title}
                </h2>
                <p className="text-sm md:text-base font-bold text-[#C5A059] uppercase tracking-widest">
                  Operated by {product.operatorName}
                </p>
              </div>
            </div>
          </div>

          {/* Mobile Back Link */}
          <div className="md:hidden px-6 py-6 border-b border-[#E5E0D8]">
            <Link href="/" className="text-xs font-bold text-[#1a1a1a] uppercase tracking-widest flex items-center gap-2">
              ← View All Tours
            </Link>
          </div>

          <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
            <div className="grid md:grid-cols-12 gap-12 md:gap-16">

              {/* Editorial Content */}
              <div className="md:col-span-7 space-y-16 pb-24 md:pb-0">

                <section>
                  {product.bestFor && (
                    <div className="mb-6 border-l-4 border-[#C5A059] pl-4">
                      <span className="text-sm font-bold text-[#1a1a1a] uppercase tracking-widest">
                        {product.bestFor}
                      </span>
                    </div>
                  )}
                  <h3 className="text-3xl font-[var(--font-accent)] font-bold text-[#1a1a1a] mb-6">The Experience</h3>
                  <p className="text-[#444] leading-relaxed text-lg font-light">
                    {product.description}
                  </p>
                </section>

                <section className="bg-[#F4F1EB] p-8">
                  <h3 className="text-xl font-[var(--font-accent)] font-bold text-[#1a1a1a] mb-4 border-b border-[#E5E0D8] pb-4">Practical Details</h3>

                  <div className="space-y-6">
                    {(product.durationLabel || product.transportationSummary || product.pickupSummary) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {product.durationLabel && (
                          <div>
                            <h4 className="text-[10px] font-bold text-[#1a1a1a] uppercase tracking-widest mb-1">Duration</h4>
                            <p className="text-[#666] text-sm leading-relaxed">{product.durationLabel}</p>
                          </div>
                        )}
                        {product.transportationSummary && (
                          <div>
                            <h4 className="text-[10px] font-bold text-[#1a1a1a] uppercase tracking-widest mb-1">Transportation</h4>
                            <p className="text-[#666] text-sm leading-relaxed">{product.transportationSummary}</p>
                          </div>
                        )}
                        {product.pickupSummary && (
                          <div className="md:col-span-2">
                            <h4 className="text-[10px] font-bold text-[#1a1a1a] uppercase tracking-widest mb-1">Pickup</h4>
                            <p className="text-[#666] text-sm leading-relaxed">{product.pickupSummary}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {product.highlights && product.highlights.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-bold text-[#1a1a1a] uppercase tracking-widest mb-2">Highlights</h4>
                        <ul className="list-disc list-inside text-[#666] text-sm leading-relaxed space-y-1">
                          {product.highlights.map((highlight, idx) => (
                            <li key={idx}>{highlight}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {product.bookingNote && (
                      <div className="border-t border-[#E5E0D8] pt-4 mt-4">
                        <h4 className="text-[10px] font-bold text-[#1a1a1a] uppercase tracking-widest mb-1">Booking Note</h4>
                        <p className="text-[#666] text-sm leading-relaxed">{product.bookingNote}</p>
                      </div>
                    )}

                    {!product.durationLabel && !product.transportationSummary && !product.pickupSummary && (!product.highlights || product.highlights.length === 0) && !product.bookingNote && (
                      <p className="text-[#666] leading-relaxed text-sm">
                        Current schedules, tour duration, meeting or pickup locations, pricing, and available capacity are managed directly by {product.operatorName} and will be confirmed during the booking process.
                      </p>
                    )}
                  </div>
                </section>

              </div>

              {/* Booking Sidebar */}
              <div className="md:col-span-5">
                <div className="sticky top-32 bg-white border border-[#E5E0D8] p-8 shadow-xl">
                  <div className="text-center mb-6">
                    <span className="text-[10px] font-bold text-[#C5A059] uppercase tracking-widest block mb-2">Secure Booking</span>
                    <h3 className="text-2xl font-[var(--font-accent)] font-bold text-[#1a1a1a]">Reserve Your Spot</h3>
                  </div>

                  <div className="mb-6 text-sm text-[#666] leading-relaxed text-center bg-[#FDFBF7] p-4 border border-[#E5E0D8]">
                    <p>
                      <strong>Welcome to New Orleans Tours</strong> is an independent curated storefront. Booking opens through the official FareHarbor checkout for {product.operatorName}.
                    </p>
                  </div>

                  {/* Airboat Lightframe disabled pending dedicated item IDs or an airboat-only FareHarbor flow. */}
                  {isAirboat ? (
                    <a
                      href={fallbackHref}
                      className="flex items-center justify-center w-full min-h-[80px] bg-[#0B3B24] hover:bg-[#1a1a1a] text-[#FDFBF7] font-bold px-6 py-4 text-sm transition-colors uppercase tracking-widest text-center shadow-md"
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
                      className="flex items-center justify-center w-full min-h-[80px] bg-[#0B3B24] hover:bg-[#1a1a1a] text-[#FDFBF7] font-bold px-6 py-4 text-sm transition-colors uppercase tracking-widest text-center shadow-md"
                    >
                      {ctaText}
                    </FareHarborBookingButton>
                  )}

                  {!isAirboat && (
                    <p className="mt-4 text-[11px] text-center text-[#666] leading-relaxed">
                      Availability and final pricing are confirmed in the operator’s secure checkout.
                    </p>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Related Tour */}
          {relatedProduct && (
            <div className="bg-[#1a1a1a] py-20 px-6 border-t border-[#333]">
              <div className="max-w-4xl mx-auto">
                <div className="mb-10 text-center">
                  <span className="text-[#C5A059] text-2xl mb-4 block">⚜️</span>
                  <h3 className="text-2xl md:text-3xl font-[var(--font-accent)] font-bold text-[#FDFBF7] uppercase tracking-widest">
                    Also Consider
                  </h3>
                </div>

                <Link href={`/tours/${relatedProduct.slug}`} className="block group">
                  <div className="bg-[#FDFBF7] border border-[#E5E0D8] overflow-hidden hover:border-[#C5A059] transition-colors flex flex-col md:flex-row shadow-lg">
                    <div className="md:w-2/5 aspect-[16/9] md:aspect-auto relative overflow-hidden bg-[#1a1a1a]">
                      {relatedProduct.imagePresentation === "editorial" ? (
                        <div className="w-full h-full bg-[#0a1510] flex flex-col items-center justify-center p-8 group-hover:bg-[#1a1a1a] transition-colors duration-700 relative overflow-hidden">
                          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/[0.05] via-transparent to-black/[0.3]"></div>
                          <div className="absolute inset-4 border border-[#C5A059]/10"></div>
                          <div className="absolute top-4 left-4 w-6 h-6 border-t border-l border-[#C5A059]/40 rounded-tl-xl"></div>
                          <div className="absolute top-4 right-4 w-6 h-6 border-t border-r border-[#C5A059]/40 rounded-tr-xl"></div>
                          <div className="absolute bottom-4 left-4 w-6 h-6 border-b border-l border-[#C5A059]/40 rounded-bl-xl"></div>
                          <div className="absolute bottom-4 right-4 w-6 h-6 border-b border-r border-[#C5A059]/40 rounded-br-xl"></div>
                          <span className="relative z-10 text-[11px] font-bold text-[#C5A059] uppercase tracking-[0.3em] text-center">Plantation History</span>
                        </div>
                      ) : (
                        <img
                          src={relatedProduct.imageUrl}
                          alt={relatedProduct.title}
                          className="w-full h-full object-cover opacity-90 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700"
                        />
                      )}
                    </div>
                    <div className="p-8 md:w-3/5 flex flex-col justify-center">
                      <p className="text-[10px] font-bold text-[#C5A059] uppercase tracking-widest mb-2">
                        Operated by {relatedProduct.operatorName}
                      </p>
                      <h4 className="text-2xl font-[var(--font-accent)] font-bold text-[#1a1a1a] mb-4 group-hover:text-[#0B3B24] transition-colors">
                        {relatedProduct.title}
                      </h4>
                      <p className="text-sm text-[#666] leading-relaxed line-clamp-2 mb-6">
                        {relatedProduct.description}
                      </p>
                      <div>
                        <span className="inline-block border-b-2 border-[#1a1a1a] text-[#1a1a1a] font-bold pb-1 text-xs uppercase tracking-widest group-hover:text-[#C5A059] group-hover:border-[#C5A059] transition-colors">
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
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E0D8] p-4 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
            {isAirboat ? (
              <a
                href={fallbackHref}
                className="flex items-center justify-center w-full min-h-[60px] bg-[#0B3B24] hover:bg-[#1a1a1a] text-[#FDFBF7] font-bold px-4 py-3 text-sm transition-colors uppercase tracking-widest text-center shadow-md"
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
                className="flex items-center justify-center w-full min-h-[60px] bg-[#0B3B24] hover:bg-[#1a1a1a] text-[#FDFBF7] font-bold px-4 py-3 text-sm transition-colors uppercase tracking-widest text-center shadow-md"
              >
                {ctaText}
              </FareHarborBookingButton>
            )}
          </div>

        </main>
      </div>
    </>
  );
}
