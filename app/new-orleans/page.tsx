import React from "react";
import Link from "next/link";
import { getProductById } from "./data";
import ProductCard from "./components/ProductCard";
import MarketplaceSearch from "./components/MarketplaceSearch";
import { getMarketplaceSearchItems } from "./data/searchHelper";
import visualStyles from "./components/newOrleansVisual.module.css";
import NewOrleansRecommendationFlow from "./components/NewOrleansRecommendationFlow";

export const metadata = {
  title: "New Orleans Tours | Discover and Book Real Local Experiences",
  description:
    "Compare New Orleans tours, find real participating experiences, and get local help choosing.",
};



export default function NewOrleansHomePage() {
  const southernStyle = getProductById("southernstyle-city-tour");
  const southernStylePlantation = getProductById("southernstyle-plantation");
  const raginCajun = getProductById("ragincajun-covered-boat");
  const raginCajunAirboat = getProductById("ragincajun-airboat");
  const searchItems = getMarketplaceSearchItems();

  return (
    <div className="bg-[var(--nola-bg-charcoal)] text-[var(--nola-ivory)] font-sans overflow-hidden">
      {/* 1. Hero / Chooser */}
      <NewOrleansRecommendationFlow />

      {/* 2. Featured Experiences */}
      <section className="py-20 px-6 max-w-7xl mx-auto border-t border-[#2a2a2a]">
        <div className="mb-12 text-center">
          <h2 className={`font-serif text-3xl md:text-4xl text-[#d4af37] mb-4 ${visualStyles.accentFont}`}>
            Featured Experiences
          </h2>
          <p className="text-[#fdfbf7]/70 font-light max-w-2xl mx-auto text-lg">
            Directly book participating local operators, with clear descriptions and direct access to inventory.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {southernStyle && <ProductCard product={southernStyle as any} />}
          {southernStylePlantation && <ProductCard product={southernStylePlantation as any} />}
          {raginCajun && <ProductCard product={raginCajun as any} />}
          {raginCajunAirboat && <ProductCard product={raginCajunAirboat as any} />}
        </div>
      </section>

      {/* 4. Compact Find a Tour */}
      <section className="bg-[#1a1a1a] border-y border-[#2a2a2a] py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className={`font-serif text-3xl md:text-4xl text-[#fdfbf7] mb-4 ${visualStyles.accentFont}`}>
              Find a Tour
            </h2>
            <p className="text-[#aaaaaa] font-light text-lg">
              Search by operator, theme, or neighborhood to find your ideal New Orleans experience.
            </p>
          </div>
          <MarketplaceSearch items={searchItems} />
        </div>
      </section>

      {/* 5. Welcome Stop & Group Planning */}
      <section className="py-24 bg-[#101010] border-b border-[#2a2a2a]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="border border-[#2a2a2a] bg-[#151515] p-10 flex flex-col items-start">
            <div className="text-[10px] text-[#d4af37] uppercase tracking-widest font-bold mb-4">
              In-Person Help
            </div>
            <h3 className={`font-serif text-3xl mb-4 ${visualStyles.accentFont}`}>
              French Quarter Welcome Stop
            </h3>
            <p className="text-[#fdfbf7]/70 font-light leading-relaxed mb-8 flex-grow">
              Stop by for local orientation, help choosing a tour, and practical visitor assistance.
            </p>
            <Link
              href="/french-quarter-welcome-stop"
              className="text-xs text-[#fdfbf7] font-bold uppercase tracking-widest border-b border-[#d4af37] pb-1 hover:text-[#d4af37] transition-colors"
            >
              View Location & Hours
            </Link>
          </div>

          <div className="border border-[#2a2a2a] bg-[#1a1423] p-10 flex flex-col items-start">
            <div className="text-[10px] text-[#b8952c] uppercase tracking-widest font-bold mb-4">
              Private Parties
            </div>
            <h3 className={`font-serif text-3xl mb-4 ${visualStyles.accentFont}`}>Group Planning</h3>
            <p className="text-[#fdfbf7]/70 font-light leading-relaxed mb-8 flex-grow">
              Planning a family, wedding, or corporate group? Contact us to discuss available tour options.
            </p>
            <Link
              href="/contact"
              className="text-xs text-[#fdfbf7] font-bold uppercase tracking-widest border-b border-[#b8952c] pb-1 hover:text-[#d4af37] transition-colors"
            >
              Inquire About Groups
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Editorial Guides */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="mb-12">
          <h2 className={`font-serif text-2xl text-[#fdfbf7] mb-2 ${visualStyles.accentFont}`}>
            Editorial Guides
          </h2>
          <p className="text-[#aaaaaa] font-light text-sm">
            Dig deeper before you decide.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <GuideLink
            href="/swamp-tours/types"
            title="Compare Swamp Tour Formats"
          />
          <GuideLink
            href="/swamp-tours/best-time"
            title="When to Visit the Swamp"
          />
          <GuideLink
            href="/swamp-tours/transportation"
            title="Swamp Tour Transportation"
          />
          <GuideLink
            href="/swamp-tours/with-kids"
            title="Swamp Tours with Kids"
          />
        </div>
      </section>
    </div>
  );
}

function GuideLink({ href, title }: { href: string; title: string }) {
  return (
    <Link
      href={href}
      className="block p-6 border border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#d4af37] transition-colors group"
    >
      <h4 className={`font-serif text-lg text-[#fdfbf7] mb-4 group-hover:text-[#d4af37] ${visualStyles.accentFont}`}>
        {title}
      </h4>
      <span className="text-[10px] uppercase tracking-widest font-bold text-[#aaaaaa] group-hover:text-[#fdfbf7]">
        Read Guide →
      </span>
    </Link>
  );
}
