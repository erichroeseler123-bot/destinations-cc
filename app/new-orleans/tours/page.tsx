import type { Metadata } from "next";
import JsonLd from "@/app/components/dcc/JsonLd";
import ProductCard from "../components/ProductCard";
import CinematicPageHero from "../components/CinematicPageHero";
import {
  buildBreadcrumbJsonLd,
  buildWebPageJsonLd,
} from "@/lib/dcc/jsonld";
import {
  buildWnoBreadcrumbJsonLd,
  buildWnoWebPageJsonLd,
} from "../lib/structuredData";
import { NEW_ORLEANS_TOURS_PATH, METADATA, STOREFRONT_PRODUCTS } from "./pageConfig";
import { headers } from "next/headers";
import { generateCategorySchemaGraph } from "../lib/schema";

const CURRENT_TOURS_DESCRIPTION =
  "Browse 21 curated New Orleans experiences across river cruises, city tours, swamps, airboats, plantation history, walking tours, and full-day combinations, with concierge help when you want it.";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const hostHeader = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "";
  const host = hostHeader.split(":")[0];
  const isWto = host === "welcometoneworleanstours.com" || host === "www.welcometoneworleanstours.com";
  const origin = isWto ? "https://welcometoneworleanstours.com" : "https://destinationcommandcenter.com";
  const canonical = isWto ? "/tours" : NEW_ORLEANS_TOURS_PATH;

  return {
    applicationName: "Welcome to New Orleans Tours",
    title: METADATA.title,
    description: CURRENT_TOURS_DESCRIPTION,
    keywords: METADATA.keywords,
    metadataBase: new URL(origin),
    alternates: { canonical },
    openGraph: { siteName: "Welcome to New Orleans Tours", title: METADATA.title, description: CURRENT_TOURS_DESCRIPTION, url: canonical, type: "website" },
    twitter: { card: "summary_large_image", title: METADATA.title, description: CURRENT_TOURS_DESCRIPTION },
  };
}

const sections = [
  { id: "River Cruises", title: "River Cruises", note: "Jazz, brunch, dinner and Mississippi views." },
  { id: "Swamp Tours", title: "Swamp Adventures", note: "Covered boats and bayou country." },
  { id: "Airboat Rides", title: "Airboat Adventures", note: "A faster way into the wetlands." },
  { id: "Plantation Tours", title: "Plantation History", note: "River Road sites and historical context." },
  { id: "Combo Tours", title: "Combination Tours", note: "Build more of Louisiana into one day." },
  { id: "City Tours", title: "City Highlights", note: "Neighborhoods, architecture and local landmarks." },
  { id: "Walking Tours", title: "Food, Cocktails & Ghosts", note: "Experience the Quarter on foot." },
];

export default async function NewOrleansToursPage() {
  const requestHeaders = await headers();
  const hostHeader = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "";
  const host = hostHeader.split(":")[0];
  const isWto = host === "welcometoneworleanstours.com" || host === "www.welcometoneworleanstours.com";
  const basePath = isWto ? "" : NEW_ORLEANS_TOURS_PATH;

  const productItems = STOREFRONT_PRODUCTS.map((item) => ({ name: item.title, description: item.description, url: `${basePath}/tours/${item.slug}`, slug: item.slug, providerName: item.operatorName }));
  const pageSchema = isWto
    ? buildWnoWebPageJsonLd({ path: "/tours", name: "Welcome To New Orleans Tours", description: CURRENT_TOURS_DESCRIPTION })
    : buildWebPageJsonLd({ path: NEW_ORLEANS_TOURS_PATH, name: "Welcome To New Orleans Tours", description: CURRENT_TOURS_DESCRIPTION, isPartOfPath: "/new-orleans" });
  const breadcrumbSchema = isWto
    ? buildWnoBreadcrumbJsonLd([{ name: "New Orleans Tours", path: "/tours" }])
    : buildBreadcrumbJsonLd([{ name: "New Orleans", item: "/new-orleans" }, { name: "Tours", item: NEW_ORLEANS_TOURS_PATH }]);

  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org",
        "@graph": [
          pageSchema,
          breadcrumbSchema,
          ...generateCategorySchemaGraph({ urlPath: isWto ? "/tours" : NEW_ORLEANS_TOURS_PATH, name: "Welcome To New Orleans Tours", description: CURRENT_TOURS_DESCRIPTION, items: productItems.map((p: any) => ({ slug: p.slug, name: p.name, description: p.description, providerName: p.providerName })) })["@graph"],
        ],
      }} />

      <main className="w-full min-h-screen bg-[#080708] text-[#fdfbf7] font-[var(--font-sans)]">
        <CinematicPageHero
          eyebrow="The complete collection"
          title="New Orleans Tours"
          script="find your kind of New Orleans"
          intro="Browse the live collection by experience type, or jump to the chooser if you would rather tell us what kind of day you want. Practical details and current operator booking paths stay attached to every tour."
          image="/images/travel-markets/new-orleans/french-quarter-street.jpg"
          actions={[
            { href: "#tour-collection", label: "Browse Tours", detail: `${STOREFRONT_PRODUCTS.length} current experiences`, primary: true },
            { href: "/help-me-choose", label: "Help Me Choose", detail: "Narrow it down for me" },
            { href: "tel:+15044849687", label: "Ask the Desk", detail: "504-484-9687" },
          ]}
        />

        <div id="tour-collection" className="max-w-7xl mx-auto px-6 py-14 md:py-20 space-y-20 scroll-mt-24">
          {sections.map((section, sectionIndex) => {
            const sectionProducts = STOREFRONT_PRODUCTS.filter((p) => p.category === section.id);
            if (sectionProducts.length === 0) return null;
            return (
              <section id={section.id.toLowerCase().replace(/\s+/g, "-")} key={section.id} className="space-y-8 scroll-mt-28">
                <div className="grid md:grid-cols-[auto_1fr] md:items-end gap-4 border-b border-[#d4af37]/22 pb-5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#d4af37]">Collection {String(sectionIndex + 1).padStart(2, "0")}</p>
                    <h2 className="mt-2 text-3xl md:text-4xl font-[var(--font-accent)] font-bold text-[#f7efe2]">{section.title}</h2>
                  </div>
                  <p className="md:text-right text-sm text-[#9f9588]">{section.note}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {sectionProducts.map((product) => (
                    <ProductCard key={product.id} product={{ ...product, operatorAttribution: undefined, isBookable: true, ctaLabel: "View Details" } as any} />
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