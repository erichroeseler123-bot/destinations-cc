import type { Metadata } from "next";
import JsonLd from "@/app/components/dcc/JsonLd";
import { HeaderNav, FooterNav } from "../components/MarketplaceNavigation";
import ProductCard from "../components/ProductCard";
import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  buildWebPageJsonLd,
} from "@/lib/dcc/jsonld";
import { NEW_ORLEANS_TOURS_PATH, METADATA, STOREFRONT_PRODUCTS } from "./pageConfig";
import { headers } from "next/headers";
import { generateCategorySchemaGraph } from "../lib/schema";
export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const hostHeader = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "";
  const host = hostHeader.split(":")[0];
  const isWto = host === "welcometoneworleanstours.com" || host === "www.welcometoneworleanstours.com";
  const origin = isWto ? "https://www.welcometoneworleanstours.com" : "https://destinationcommandcenter.com";

  const canonical = isWto ? "/tours" : NEW_ORLEANS_TOURS_PATH;

  return {
    applicationName: "Welcome to New Orleans Tours",
    title: METADATA.title,
    description: METADATA.description,
    keywords: METADATA.keywords,
    metadataBase: new URL(origin),
    alternates: { canonical },
    openGraph: {
      siteName: "Welcome to New Orleans Tours",
      title: METADATA.title,
      description: METADATA.description,
      url: canonical,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: METADATA.title,
      description: METADATA.description,
    },
  };
}

export default async function NewOrleansToursPage() {
  const requestHeaders = await headers();
  const hostHeader = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "";
  const host = hostHeader.split(":")[0];
  const isWto = host === "welcometoneworleanstours.com" || host === "www.welcometoneworleanstours.com";

  const basePath = isWto ? "" : NEW_ORLEANS_TOURS_PATH;

  const productItems = STOREFRONT_PRODUCTS.map((item) => ({
    name: item.title,
    description: item.description,
    url: `${basePath}/tours/${item.slug}`,
    slug: item.slug,
    providerName: item.operatorName,
  }));

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            buildWebPageJsonLd({
              path: isWto ? "/tours" : NEW_ORLEANS_TOURS_PATH,
              name: "Welcome To New Orleans Tours",
              description: METADATA.description,
              isPartOfPath: isWto ? undefined : "/new-orleans",
            }),
            buildBreadcrumbJsonLd(
              isWto
                ? [ { name: "New Orleans Tours", item: "/tours" } ]
                : [
                    { name: "New Orleans", item: "/new-orleans" },
                    { name: "Tours", item: NEW_ORLEANS_TOURS_PATH },
                  ]
            ),
            ...generateCategorySchemaGraph({
              urlPath: isWto ? "/tours" : NEW_ORLEANS_TOURS_PATH,
              name: "Welcome To New Orleans Tours",
              description: METADATA.description,
              items: productItems.map((p: any) => ({
                slug: p.slug,
                name: p.name,
                description: p.description,
                providerName: p.providerName
              })),
            })["@graph"],
          ],
        }}
      />
      <main className="w-full min-h-screen bg-[#151515] text-[#fdfbf7] font-[var(--font-sans)]">
        <section className="px-6 py-14 md:py-20 border-b border-[#2a2a2a] bg-[#101010]">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.24em] text-[#d4af37] mb-4">
              Browse All Live Experiences
            </p>
            <h1 className="font-[var(--font-accent)] text-4xl md:text-6xl text-[#fdfbf7] mb-5 font-bold">
              New Orleans Tours
            </h1>
            <p className="max-w-2xl mx-auto text-base md:text-lg text-[#cccccc] font-light leading-relaxed">
              Compare river cruises, swamp adventures, plantation history, and walking tours from participating local operators.
              Practical details help you choose the right fit for your group.
            </p>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 space-y-20">
          {[
            { id: "River Cruises", title: "River Cruises" },
            { id: "Swamp Tours", title: "Swamp Adventures" },
            { id: "Airboat Rides", title: "Airboat Adventures" },
            { id: "Plantation Tours", title: "Plantation History" },
            { id: "Combo Tours", title: "Combination Tours" },
            { id: "City Tours", title: "City Highlights" },
            { id: "Walking Tours", title: "Walking Tours (Food, Cocktails & Ghosts)" }
          ].map(section => {
            // Find products matching this section's category
            const sectionProducts = STOREFRONT_PRODUCTS.filter(p => p.category === section.id);

            if (sectionProducts.length === 0) return null;

            return (
              <section key={section.id} className="space-y-8">
                <div className="border-b border-[#2a2a2a] pb-4">
                  <h2 className="text-3xl font-[var(--font-accent)] font-bold text-[#d4af37]">{section.title}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {sectionProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      product={{
                        ...product,
                        operatorAttribution: product.operatorName,
                        isBookable: true,
                        ctaLabel: "View Details"
                      } as any}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </>
  );
}
