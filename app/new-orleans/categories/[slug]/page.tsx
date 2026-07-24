import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { STOREFRONT_PRODUCTS } from "../../tours/pageConfig";
import JsonLd from "@/app/components/dcc/JsonLd";
import { headers } from "next/headers";
import ProductCard from "../../components/ProductCard";
import { generateCategorySchemaGraph } from "../../lib/schema";

type CategoryConfig = {
  id: string;
  title: string;
  description: string;
  filterFn: (item: typeof STOREFRONT_PRODUCTS[0]) => boolean;
};

const CATEGORIES_MAP: Record<string, CategoryConfig> = {
  "swamp-tours": {
    id: "swamp-tours",
    title: "New Orleans Swamp Tours",
    description: "Narrated boat cruises through protected bayous. Great for all ages.",
    filterFn: (item) => item.category === "Swamp Tours" || item.category === "Airboat Rides",
  },
  "airboat-tours": {
    id: "airboat-tours",
    title: "New Orleans Airboat Tours",
    description: "High-speed open-air airboats that fly over shallow waters and marshes.",
    filterFn: (item) => item.category === "Airboat Rides",
  },
  "covered-swamp-boat-tours": {
    id: "covered-swamp-boat-tours",
    title: "Covered Swamp Boat Tours",
    description: "Shaded, stable, relaxed sightseeing through the Louisiana bayous.",
    filterFn: (item) => item.category === "Swamp Tours",
  },
  "plantation-tours": {
    id: "plantation-tours",
    title: "Plantation Tours",
    description: "Explore historic Louisiana plantations and learn their complex history.",
    filterFn: (item) => item.category === "Plantation Tours",
  },
  "city-tours": {
    id: "city-tours",
    title: "City Tours",
    description: "Comprehensive overviews of New Orleans covering the French Quarter and more.",
    filterFn: (item) => item.category === "City Tours",
  }
};

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return Object.keys(CATEGORIES_MAP).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const config = CATEGORIES_MAP[slug];
  if (!config) {
    return { title: "Category Not Found" };
  }
  const hostHeader = (await headers()).get("x-forwarded-host") || (await headers()).get("host") || "";
  const host = hostHeader.split(":")[0];
  const isWto = host === "welcometoneworleanstours.com" || host === "www.welcometoneworleanstours.com";
  const origin = isWto ? "https://www.welcometoneworleanstours.com" : "https://destinationcommandcenter.com";

  return {
    title: `${config.title} | New Orleans Tours`,
    description: config.description,
    metadataBase: new URL(origin),
    alternates: { canonical: isWto ? `/${slug}` : `/new-orleans/${slug}` },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const config = CATEGORIES_MAP[slug];

  if (!config) {
    notFound();
  }

  const products = STOREFRONT_PRODUCTS.filter(config.filterFn);

  if (products.length === 0) {
    notFound();
  }

  const hostHeader = (await headers()).get("x-forwarded-host") || (await headers()).get("host") || "";
  const host = hostHeader.split(":")[0];
  const isWto = host === "welcometoneworleanstours.com" || host === "www.welcometoneworleanstours.com";
  const urlPath = isWto ? `/${slug}` : `/new-orleans/${slug}`;

  const schemaGraph = generateCategorySchemaGraph({
    urlPath,
    name: config.title,
    description: config.description,
    items: products.map(p => ({
      slug: p.slug,
      name: p.title,
      description: p.description,
      providerName: p.operatorName
    }))
  });

  return (
    <>
      <JsonLd data={schemaGraph} />
      <main className="min-h-screen bg-[#FDFBF7] text-[#1a1a1a] py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <Link href="/tours" className="inline-flex items-center text-sm font-bold text-[#1a1a1a] hover:text-[#C5A059] uppercase tracking-widest mb-6 transition-colors">
            ← Back to All Tours
          </Link>

          {/* Page Header */}
          <header className="mb-10 text-center md:text-left border-b border-[#E5E0D8] pb-10">
            <h1 className="text-4xl font-[var(--font-accent)] font-bold tracking-tight text-[#1a1a1a] sm:text-5xl">
              {config.title}
            </h1>
            <p className="mt-4 text-lg text-[#4a4a4a] leading-relaxed max-w-2xl">
              {config.description}
            </p>
          </header>

          {/* Product Grid */}
          <section className="mb-10">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#4a4a4a] mb-6">Verified Experiences</h2>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {products.map((item) => (
                <ProductCard key={item.id} product={item as any} />
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
