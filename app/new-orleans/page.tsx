import React from "react";
import Link from "next/link";
import { getProductById } from "./data";
import ProductCard from "./components/ProductCard";
import MarketplaceSearch from "./components/MarketplaceSearch";
import { getMarketplaceSearchItems } from "./data/searchHelper";
import visualStyles from "./components/newOrleansVisual.module.css";
import NewOrleansChooser from "./components/NewOrleansChooser";

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
      {/* 1. Integrated hero and chooser */}
      <section className={visualStyles.homeHero}>
        <Link href="#chooser" className="sr-only">
          Help Me Choose
        </Link>
        <div className={visualStyles.homeHeroBackground} aria-hidden="true" />
        <div className={visualStyles.homeHeroOverlay} aria-hidden="true" />
        <div className={visualStyles.homeHeroContent}>
          <div className={visualStyles.homeHeroIntro}>
            <h1 className={visualStyles.homeHeadline}>
              <span className={`${visualStyles.homeHeadlineLead} ${visualStyles.accentFont}`}>
                Let&apos;s find your
              </span>
              <span className={`${visualStyles.homeHeadlineDisplay} ${visualStyles.displayFont}`}>
                Perfect
              </span>
              <span className={`${visualStyles.homeHeadlineScript} ${visualStyles.scriptFont}`}>
                New Orleans
              </span>
              <span className={`${visualStyles.homeHeadlineDisplay} ${visualStyles.displayFont}`}>
                Adventure
              </span>
            </h1>
            <div className={visualStyles.homeDivider} aria-hidden="true">
              <span />
              <span className={visualStyles.homeFleur}>⚜</span>
              <span />
            </div>
            <p className={visualStyles.homeHeroCopy}>
              Answer a few quick questions and we&apos;ll point you to the best tours for you and your crew.
            </p>
          </div>

          <div id="chooser" className={visualStyles.homeChooserAnchor}>
            <NewOrleansChooser surface="homepage" />
          </div>
          <div className={visualStyles.homeQuestionBar}>
            <span className={`${visualStyles.scriptFont} ${visualStyles.homeQuestionScript}`}>
              Still have questions?
            </span>
            <a href="tel:+15044849687" className={visualStyles.homePhoneAction}>
              <span aria-hidden="true">☎</span>
              Let&apos;s talk&nbsp; 504-484-9687
            </a>
          </div>
        </div>
      </section>

      {/* 2. Featured Experiences */}
      <section className="py-20 px-6 max-w-7xl mx-auto border-t border-[var(--nola-border)]">
        <div className="mb-12 text-center">
          <h2 className={`font-serif text-3xl md:text-4xl text-[var(--nola-gold)] mb-4 ${visualStyles.accentFont}`}>
            Featured Experiences
          </h2>
          <p className="text-[var(--nola-ivory)]/70 font-light max-w-2xl mx-auto text-lg">
            Directly book participating local operators, with clear descriptions and direct access to inventory.
          </p>
          <Link
            href="/tours"
            className="mt-5 inline-block text-xs font-bold uppercase tracking-[0.16em] text-[var(--nola-gold)] hover:text-[var(--nola-ivory)]"
          >
            Explore All Tours
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {southernStyle && <ProductCard product={southernStyle as any} />}
          {southernStylePlantation && <ProductCard product={southernStylePlantation as any} />}
          {raginCajun && <ProductCard product={raginCajun as any} />}
          {raginCajunAirboat && <ProductCard product={raginCajunAirboat as any} />}
        </div>
      </section>

      {/* 4. Compact Find a Tour */}
      <section className="bg-[var(--nola-surface-subtle)] border-y border-[var(--nola-border)] py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className={`font-serif text-3xl md:text-4xl text-[var(--nola-ivory)] mb-4 ${visualStyles.accentFont}`}>
              Find a Tour
            </h2>
            <p className="text-[var(--nola-text-muted)] font-light text-lg">
              Search by operator, theme, or neighborhood to find your ideal New Orleans experience.
            </p>
          </div>
          <MarketplaceSearch items={searchItems} />
        </div>
      </section>

      {/* 5. Tour Concierge & Group Planning */}
      <section className="py-24 bg-[var(--nola-bg-black)] border-b border-[var(--nola-border)]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="border border-[var(--nola-border)] bg-[var(--nola-bg-charcoal)] p-10 flex flex-col items-start">
            <div className="text-[10px] text-[var(--nola-gold)] uppercase tracking-widest font-bold mb-4">
              Scheduled Planning Help
            </div>
            <h3 className={`font-serif text-3xl mb-4 ${visualStyles.accentFont}`}>
              New Orleans Tour Concierge
            </h3>
            <p className="text-[var(--nola-ivory)]/70 font-light leading-relaxed mb-8 flex-grow">
              Already in New Orleans? Arrange a tour-planning conversation at an agreed hotel,
              French Quarter, or nearby public meeting location. Availability varies.
            </p>
            <Link
              href="/french-quarter-welcome-stop"
              className="text-xs text-[var(--nola-ivory)] font-bold uppercase tracking-widest border-b border-[var(--nola-gold)] pb-1 hover:text-[var(--nola-gold)] transition-colors"
            >
              Schedule Tour Help
            </Link>
          </div>

          <div className="border border-[var(--nola-border)] bg-[var(--nola-surface-strong)] p-10 flex flex-col items-start">
            <div className="text-[10px] text-[var(--nola-gold-muted)] uppercase tracking-widest font-bold mb-4">
              Private Parties
            </div>
            <h3 className={`font-serif text-3xl mb-4 ${visualStyles.accentFont}`}>Group Planning</h3>
            <p className="text-[var(--nola-ivory)]/70 font-light leading-relaxed mb-8 flex-grow">
              Planning a family, wedding, or corporate group? Contact us to discuss available tour options.
            </p>
            <Link
              href="/contact"
              className="text-xs text-[var(--nola-ivory)] font-bold uppercase tracking-widest border-b border-[var(--nola-gold-muted)] pb-1 hover:text-[var(--nola-gold)] transition-colors"
            >
              Inquire About Groups
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Editorial Guides */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="mb-12">
          <h2 className={`font-serif text-2xl text-[var(--nola-ivory)] mb-2 ${visualStyles.accentFont}`}>
            Editorial Guides
          </h2>
          <p className="text-[var(--nola-text-muted)] font-light text-sm">
            Dig deeper before you decide.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <GuideLink
            href="/swamp-tours/airboat-vs-covered-boat"
            title="Compare Swamp Tour Formats"
          />
          <GuideLink
            href="/guides/how-far-are-swamp-tours-from-new-orleans"
            title="How Far Are Swamp Tours From New Orleans?"
          />
          <GuideLink
            href="/swamp-tours/pickup-vs-self-drive"
            title="Swamp Tour Transportation"
          />
          <GuideLink
            href="/guides/how-long-does-a-swamp-tour-take"
            title="How Long Does a Swamp Tour Take?"
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
      className="block p-6 border border-[var(--nola-border)] bg-[var(--nola-surface-subtle)] hover:border-[var(--nola-gold)] transition-colors group"
    >
      <h4 className={`font-serif text-lg text-[var(--nola-ivory)] mb-4 group-hover:text-[var(--nola-gold)] ${visualStyles.accentFont}`}>
        {title}
      </h4>
      <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--nola-text-muted)] group-hover:text-[var(--nola-ivory)]">
        Read Guide →
      </span>
    </Link>
  );
}
