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
import DailyBriefSignup from "../components/DailyBriefSignup";
import { headers } from "next/headers";
import { generateCategorySchemaGraph } from "../lib/schema";
import { isHeldProduct } from "../data/truthPolicy";
import { FAREHARBOR_SOURCES } from "../lib/fareHarborAttribution";

const BOOKABLE_PRODUCT_COUNT = STOREFRONT_PRODUCTS.filter((product) => !isHeldProduct(product.slug)).length;
const CURRENT_TOURS_DESCRIPTION =
  `Compare ${BOOKABLE_PRODUCT_COUNT} bookable New Orleans tours across river cruises, city tours, swamps, airboats, plantation history, walking tours, and full-day combinations. Check live dates and prices without leaving WNO.`;

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

export const dynamic = "force-dynamic";

export default async function NewOrleansToursPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
} = {}) {
  const resolvedSearch = searchParams ? await searchParams : {};
  const firstStr = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;
  const defaultFutureDate = new Date(Date.now() + 30 * 86400000)
    .toISOString()
    .slice(0, 10);
  const selectedDate =
    firstStr(resolvedSearch.date) ||
    firstStr(resolvedSearch.arrivalDate) ||
    defaultFutureDate;
  const selectedPartySize =
    firstStr(resolvedSearch.party_size) ||
    firstStr(resolvedSearch.travelers) ||
    firstStr(resolvedSearch.passengerCount) ||
    firstStr(resolvedSearch.passengers) ||
    firstStr(resolvedSearch.qty) ||
    "2";

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
          intro="Compare bookable experiences by type, or tell us what kind of day you want. When you are ready, check live operator dates and prices directly from the tour card."
          image="/images/travel-markets/new-orleans/french-quarter-street.jpg"
          actions={[
            { href: "#tour-collection", label: "Browse Tours", detail: `${BOOKABLE_PRODUCT_COUNT} bookable experiences`, primary: true },
            { href: "/help-me-choose", label: "Help Me Choose", detail: "Narrow it down for me" },
            { href: "tel:+15044849687", label: "Ask Us", detail: "504-484-9687" },
          ]}
        />

        <div id="tour-collection" className="max-w-7xl mx-auto px-6 py-14 md:py-20 space-y-20 scroll-mt-24">
          <form
            method="get"
            action={isWto ? "/tours" : NEW_ORLEANS_TOURS_PATH}
            className="rounded-2xl border border-[#d4af37]/30 bg-[#141210] p-5 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#d4af37]">
                Active Tour Date &amp; Party Size
              </span>
              <span className="text-xs text-[#9f9588]">
                Prefilled from your New Orleans trip context
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 items-end">
              <div>
                <label
                  htmlFor="booking-context-date"
                  className="block text-[11px] font-semibold uppercase tracking-wider text-[#e5dec9] mb-1"
                >
                  Preferred Tour Date
                </label>
                <input
                  id="booking-context-date"
                  type="date"
                  name="date"
                  defaultValue={selectedDate}
                  className="w-full rounded-lg border border-[#d4af37]/30 bg-[#080708] px-3 py-2 text-xs md:text-sm text-[#fdfbf7]"
                />
              </div>
              <div>
                <label
                  htmlFor="booking-context-party-size"
                  className="block text-[11px] font-semibold uppercase tracking-wider text-[#e5dec9] mb-1"
                >
                  Travelers / Party Size
                </label>
                <select
                  id="booking-context-party-size"
                  name="party_size"
                  defaultValue={selectedPartySize}
                  className="w-full rounded-lg border border-[#d4af37]/30 bg-[#080708] px-3 py-2 text-xs md:text-sm text-[#fdfbf7]"
                >
                  {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((num) => (
                    <option key={num} value={String(num)}>
                      {num} {num === 1 ? "Guest" : "Guests"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <button
                  type="submit"
                  className="w-full rounded-lg border border-[#d4af37] bg-[#d4af37]/15 px-4 py-2 text-xs md:text-sm font-bold text-[#f7efe2] hover:bg-[#d4af37]/25"
                >
                  Update Availability Context
                </button>
              </div>
            </div>
          </form>

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
                    <ProductCard
                      key={product.id}
                      attributionSource={FAREHARBOR_SOURCES.tours}
                      product={{
                        ...product,
                        operatorAttribution: product.operatorName,
                        isBookable: !isHeldProduct(product.slug),
                        ctaLabel: isHeldProduct(product.slug) ? "View details · call to confirm" : undefined,
                      } as any}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <DailyBriefSignup source="tour-catalog" />
      </main>
    </>
  );
}
