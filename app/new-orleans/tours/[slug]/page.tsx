import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Script from "next/script";
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
      images: [
        {
          url: product.imageUrl,
          width: 1200,
          height: 630,
          alt: product.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: product.detailPageTitle,
      description: product.metaDescription,
      images: [product.imageUrl],
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
      <div id="main-content" className="bg-slate-50 min-h-screen text-slate-800 font-sans pb-16">
        <Script src="https://fareharbor.com/embeds/api/v1/?autolightframe=yes" strategy="afterInteractive" />

        {/* Brand Header */}
        <header className="border-b border-slate-200 bg-white py-4 px-6 shadow-sm sticky top-0 z-50">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚜️</span>
              <div>
                <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none uppercase">
                  Welcome To New Orleans Tours
                </h1>
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  Curated local tours
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-8">
          {/* Back link */}
          <div className="mb-6">
            <Link href="/" className="text-sm font-bold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 uppercase tracking-wider">
              ← All New Orleans Tours
            </Link>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Hero Section */}
            <div className="relative aspect-[16/9] md:aspect-[21/9] w-full overflow-hidden">
              <img
                src={product.imageUrl}
                alt={product.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
              <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                {product.category}
              </div>
              <div className="absolute bottom-6 left-6 right-6">
                <h2 className="text-3xl md:text-4xl font-black text-white mb-2 leading-tight">
                  {product.title}
                </h2>
                <p className="text-sm font-bold text-emerald-400 uppercase tracking-wider">
                  Operator: {product.operatorName}
                </p>
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-8">
              {/* Overview */}
              <div>
                {product.bestFor && (
                  <div className="mb-4">
                    <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg inline-block">
                      {product.bestFor}
                    </span>
                  </div>
                )}
                <h3 className="text-xl font-bold text-slate-900 mb-3">About this tour</h3>
                <p className="text-slate-600 leading-relaxed text-base">
                  {product.description}
                </p>
              </div>

              {/* Logistics & Fallback */}
              <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
                <h3 className="text-lg font-bold text-slate-900 mb-3">Practical details</h3>
                <p className="text-emerald-800 text-sm leading-relaxed font-medium">
                  Current schedules, duration, pickup options, pricing, and availability are confirmed during booking.
                </p>
              </div>

              {/* Independent Storefront Clarification */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-sm text-slate-600 leading-relaxed">
                <p>
                  <strong>Welcome to New Orleans Tours is an independent curated storefront.</strong> Booking opens through the operator’s FareHarbor checkout.
                </p>
              </div>

              {/* CTA */}
              <div className="pt-4 border-t border-slate-100">
                <a
                  href={getFareHarborUrl(product.companyShortname, product.itemId, product.flowId)}
                  className="block w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-6 rounded-xl text-base transition-colors uppercase tracking-wider"
                >
                  Check Dates, Pricing & Availability
                </a>
              </div>
            </div>
          </div>

          {/* Related Tour */}
          {relatedProduct && (
            <div className="mt-12">
              <h3 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-wider text-center">
                Also Consider
              </h3>
              <Link href={`/tours/${relatedProduct.slug}`} className="block group">
                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:border-emerald-500/50 transition-colors flex flex-col md:flex-row max-w-3xl mx-auto">
                  <div className="md:w-1/3 aspect-[4/3] md:aspect-auto relative overflow-hidden">
                    <img 
                      src={relatedProduct.imageUrl} 
                      alt={relatedProduct.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-6 md:w-2/3 flex flex-col justify-center">
                    <h4 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-emerald-600 transition-colors">
                      {relatedProduct.title}
                    </h4>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      {relatedProduct.operatorName}
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">
                      {relatedProduct.description}
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
