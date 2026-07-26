import React from "react";
import Link from "next/link";
import Image from "next/image";
import { getProductById } from "./data";
import ProductCard from "./components/ProductCard";
import MarketplaceSearch from "./components/MarketplaceSearch";
import { getMarketplaceSearchItems } from "./data/searchHelper";
import styles from "./home.module.css";

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
    <div className="bg-[#151515] text-[#fdfbf7] font-sans overflow-hidden">
      {/* 1. Hero */}
      <section className={styles.hero}>
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/new-orleans/hero-french-quarter-balcony.jpg"
            alt="French Quarter Balcony in New Orleans"
            fill
            className="object-cover object-center"
            priority
          />
          <div className={styles.heroOverlay}></div>
        </div>

        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            <span>REAL NEW ORLEANS.</span>
            <span className={styles.heroTitleHighlight}>REAL GOOD TIMES.</span>
          </h1>
          <p className="text-lg md:text-xl text-[#fdfbf7]/80 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
            Compare participating New Orleans tours, book experiences, and get help choosing the right fit.
          </p>
          <div className={styles.heroActions}>
            <Link href="/tours" className={styles.heroCta}>
              Explore Tours
            </Link>
            <Link href="/help-me-choose" className={styles.heroCta}>
              Help Me Choose
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Four primary choice cards */}
      <section className="py-24 bg-[#151515] relative z-10 -mt-10">
        <div className={styles.choiceGrid}>
          <ChoiceCard
            title="CITY TOURS"
            desc="See the neighborhoods, architecture, history, and stories that define New Orleans."
            href="/city-tours"
            iconClass={styles.iconCity}
            iconPath="M3 21h18 M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16 M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4 M10 9h.01 M14 9h.01 M10 13h.01 M14 13h.01"
            cta="EXPLORE CITY TOURS"
          />
          <ChoiceCard
            title="SWAMP TOURS"
            desc="Choose a covered boat or airboat experience through Louisiana’s bayous."
            href="/swamp-tours"
            iconClass={styles.iconSwamp}
            iconPath="M2 12h20 M4 12v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4 M12 12v-6l-3 3 M12 6l3 3"
            cta="EXPLORE SWAMP TOURS"
          />
          <ChoiceCard
            title="PLANTATION TOURS"
            desc="Explore historic homes, landscapes, and Louisiana history outside the city."
            href="/plantation-tours"
            iconClass={styles.iconPlantation}
            iconPath="M3 21h18 M5 21V7l7-4 7 4v14 M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"
            cta="EXPLORE PLANTATION TOURS"
          />
          <ChoiceCard
            title="NOT SURE?"
            desc="Answer a few quick questions and we’ll point you toward the best fit."
            href="/help-me-choose"
            iconClass={styles.iconNotSure}
            iconPath="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3 M12 17h.01"
            hasCircle={true}
            cta="HELP ME CHOOSE"
          />
        </div>
      </section>

      {/* 3. Featured Experiences */}
      <section className="py-20 px-6 max-w-7xl mx-auto border-t border-[#2a2a2a]">
        <div className="mb-12">
          <h2 className="font-serif text-3xl md:text-4xl text-[#d4af37] mb-4">
            Featured Experiences
          </h2>
          <p className="text-[#fdfbf7]/70 font-light max-w-2xl text-lg">
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
            <h2 className="font-serif text-3xl md:text-4xl text-[#fdfbf7] mb-4">
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
            <h3 className="font-serif text-3xl mb-4">
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
            <h3 className="font-serif text-3xl mb-4">Group Planning</h3>
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
          <h2 className="font-serif text-2xl text-[#fdfbf7] mb-2">
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

function ChoiceCard({
  title,
  desc,
  href,
  iconClass,
  iconPath,
  hasCircle,
  cta
}: {
  title: string;
  desc: string;
  href: string;
  iconClass: string;
  iconPath: string;
  hasCircle?: boolean;
  cta: string;
}) {
  return (
    <Link href={href} className={styles.choiceCard} aria-label={`${title} - ${desc}`}>
      <div className={`${styles.choiceIcon} ${iconClass}`}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          {hasCircle && <circle cx="12" cy="12" r="10"></circle>}
          {iconPath.split(' M').map((pathSegment, i) => (
            <path key={i} d={i === 0 ? pathSegment : `M${pathSegment}`}></path>
          ))}
        </svg>
      </div>
      <h3 className={styles.choiceTitle}>{title}</h3>
      <p className={styles.choiceCopy}>{desc}</p>
      <span className={styles.choiceCta}>{cta}</span>
    </Link>
  );
}

function GuideLink({ href, title }: { href: string; title: string }) {
  return (
    <Link
      href={href}
      className="block p-6 border border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#d4af37] transition-colors group"
    >
      <h4 className="font-serif text-lg text-[#fdfbf7] mb-4 group-hover:text-[#d4af37]">
        {title}
      </h4>
      <span className="text-[10px] uppercase tracking-widest font-bold text-[#aaaaaa] group-hover:text-[#fdfbf7]">
        Read Guide →
      </span>
    </Link>
  );
}
