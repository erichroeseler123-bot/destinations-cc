import React from "react";
import Link from "next/link";
import { getProductById } from "./data";
import ProductCard from "./components/ProductCard";
import MarketplaceSearch from "./components/MarketplaceSearch";
import { getMarketplaceSearchItems } from "./data/searchHelper";
import { NewOrleansHeroFrame, NewOrleansChoiceCard, DecorativeDivider, ConnectedBoard } from "./components/NewOrleansVisual";
import visualStyles from "./components/newOrleansVisual.module.css";
import homeStyles from "./home.module.css";

export const metadata = {
  title: "New Orleans Tours | Discover and Book Real Local Experiences",
  description:
    "Compare New Orleans tours, find real participating experiences, and get local help choosing.",
};

const CityIllustration = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M32 10L24 25H40L32 10Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <rect x="24" y="25" width="16" height="20" stroke="currentColor" strokeWidth="2"/>
    <path d="M28 25V45M36 25V45M24 35H40" stroke="currentColor" strokeWidth="2"/>
    <path d="M32 45V60M25 60H39" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M32 5L32 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const SwampIllustration = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M10 50C15 48 20 49 25 47C30 45 35 48 40 47C45 46 50 48 55 46" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M15 48V25C15 20 25 15 32 15C39 15 49 20 49 25V47" stroke="currentColor" strokeWidth="2"/>
    <path d="M32 15V47" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4"/>
    <path d="M10 40C12 38 18 38 20 40" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M45 42C48 40 52 40 55 42" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="32" cy="30" r="5" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const PlantationIllustration = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M8 55H56" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <rect x="20" y="35" width="24" height="20" stroke="currentColor" strokeWidth="2"/>
    <path d="M15 35L32 20L49 35" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <rect x="28" y="45" width="8" height="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 55V25C12 15 20 10 32 10C44 10 52 15 52 25V55" stroke="currentColor" strokeWidth="2" strokeDasharray="2 4"/>
  </svg>
);

const NotSureIllustration = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M20 15L32 35L44 15H20Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M32 35V55M22 55H42" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="38" cy="20" r="3" fill="currentColor"/>
    <path d="M25 20H40" stroke="currentColor" strokeWidth="1"/>
    <path d="M15 25C12 25 10 20 15 15C20 10 35 5 45 10C55 15 50 30 40 25" stroke="currentColor" strokeWidth="1" strokeDasharray="2 4"/>
  </svg>
);

export default function NewOrleansHomePage() {
  const southernStyle = getProductById("southernstyle-city-tour");
  const southernStylePlantation = getProductById("southernstyle-plantation");
  const raginCajun = getProductById("ragincajun-covered-boat");
  const raginCajunAirboat = getProductById("ragincajun-airboat");
  const searchItems = getMarketplaceSearchItems();

  return (
    <div className="bg-[#151515] text-[#fdfbf7] font-sans overflow-hidden">
      {/* 1. Hero */}
      <NewOrleansHeroFrame>
        <h1 className={visualStyles.headline}>
          <span className={`${visualStyles.headlineLine1} ${visualStyles.accentFont}`}>REAL</span>
          <span className={`${visualStyles.scriptAccent} ${visualStyles.scriptFont}`}>New Orleans.</span>
          <span className={`${visualStyles.headlineLine2} ${visualStyles.displayFont}`}>REAL GOOD TIMES.</span>
        </h1>
        <DecorativeDivider />
        <p className="text-lg md:text-xl text-[#fdfbf7]/80 mb-10 max-w-2xl mx-auto font-light leading-relaxed text-center">
          Compare participating New Orleans tours, book experiences, and get help choosing the right fit.
        </p>
        <div className={homeStyles.heroActions}>
          <Link href="/tours" className={`${visualStyles.buttonPrimary} ${visualStyles.sansFont}`}>
            Explore Tours
          </Link>
          <Link href="/help-me-choose" className={`${visualStyles.buttonPrimary} ${visualStyles.sansFont}`}>
            Help Me Choose
          </Link>
        </div>
      </NewOrleansHeroFrame>

      {/* 2. Four primary choice cards */}
      <section className="py-24 bg-[#151515] relative z-10 -mt-10">
        <ConnectedBoard promptBanner="CHOOSE YOUR NEW ORLEANS EXPERIENCE">
          <NewOrleansChoiceCard
            mode="link"
            title="CITY TOURS"
            desc="See the neighborhoods, architecture, history, and stories that define New Orleans."
            href="/city-tours"
            iconType="city"
            illustration={<CityIllustration />}
            cta="EXPLORE CITY TOURS"
          />
          <NewOrleansChoiceCard
            mode="link"
            title="SWAMP TOURS"
            desc="Choose a covered boat or airboat experience through Louisiana’s bayous."
            href="/swamp-tours"
            iconType="swamp"
            illustration={<SwampIllustration />}
            cta="EXPLORE SWAMP TOURS"
          />
          <NewOrleansChoiceCard
            mode="link"
            title="PLANTATION TOURS"
            desc="Explore historic homes, landscapes, and Louisiana history outside the city."
            href="/plantation-tours"
            iconType="plantation"
            illustration={<PlantationIllustration />}
            cta="EXPLORE PLANTATION TOURS"
          />
          <NewOrleansChoiceCard
            mode="link"
            title="NOT SURE?"
            desc="Answer a few quick questions and we’ll point you toward the best fit."
            href="/help-me-choose"
            iconType="notsure"
            illustration={<NotSureIllustration />}
            cta="HELP ME CHOOSE"
          />
        </ConnectedBoard>
      </section>

      {/* 3. Featured Experiences */}
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
