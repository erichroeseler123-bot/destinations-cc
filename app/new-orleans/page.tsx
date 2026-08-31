import React from "react";
import Link from "next/link";
import visualStyles from "./components/newOrleansVisual.module.css";
import NewOrleansRecommendationFlow from "./components/NewOrleansRecommendationFlow";
import LiveIntelligencePanel from "./components/LiveIntelligencePanel";
import DailyBriefSignup from "./components/DailyBriefSignup";
import { STOREFRONT_PRODUCTS } from "./tours/pageConfig";

export const metadata = {
  title: "Welcome to New Orleans Tours | Curated New Orleans Experiences",
  description:
    "Handpicked New Orleans tours and experiences for your group. Tell us what kind of day you want and we’ll narrow the city down to the experiences that fit.",
  openGraph: {
    title: "Welcome to New Orleans Tours | Local Planning Help",
    description:
      "Find the right New Orleans experience for your group with curated recommendations, timely local context, and direct booking when you’re ready.",
  },
};

const categoryLinks = [
  { href: "/city-tours", label: "City Tours", text: "Neighborhoods, stories & landmarks.", image: "/images/travel-markets/new-orleans/french-quarter-street.jpg" },
  { href: "/swamp-tours", label: "Swamps & Airboats", text: "Get out into the bayou.", image: "/images/travel-markets/new-orleans/airboat-swamp.png" },
  { href: "/riverboat-cruises", label: "River Cruises", text: "Jazz, brunch & Mississippi views.", image: "/images/travel-markets/new-orleans/steamboat-natchez.jpg" },
  { href: "/plantation-tours", label: "Plantations", text: "History beneath the oaks.", image: "/images/wikimedia/originals/oak-alley-front.jpg" },
  { href: "/food-tours", label: "Food & Cocktails", text: "Taste your way through the Quarter.", image: "/images/wikimedia/originals/gumbo-dish.jpg" },
  { href: "/ghost-tours", label: "Ghosts & Cemetery", text: "Strange stories after dark.", image: "/images/wikimedia/originals/lalaurie-mansion-1906.jpg" },
  { href: "/city-tours", label: "Garden District", text: "Mansions, history & neighborhood character.", image: "/images/travel-markets/new-orleans/french-quarter-street.jpg" },
  { href: "/riverboat-cruises", label: "Jazz / Music", text: "Build the night around New Orleans sound.", image: "/images/travel-markets/new-orleans/steamboat-natchez.jpg" },
];

const editorialPicks = [
  { slug: "evening-jazz-cruise", kicker: "Our pick for a classic night", note: "Live music on the river with skyline views." },
  { slug: "covered-tour-boat", kicker: "Our pick for swamp without the speed", note: "Calm, shaded, and easy for mixed-age groups." },
  { slug: "whitney-plantation-tour", kicker: "Our pick for plantation history", note: "Focused, respectful history outside the city." },
  { slug: "city-tour-of-new-orleans", kicker: "Our pick for a first afternoon", note: "French Quarter, Garden District, and more." },
  { slug: "craft-cocktail-walking-tour", kicker: "Our pick for a local food crawl", note: "History and tastings in the French Quarter." },
  { slug: "all-day-city-plantation-combo", kicker: "Our pick for an easy full day", note: "Morning city highlights, then Oak Alley or Laura." },
];

const guideCards = [
  { href: "/guides/things-to-do-in-new-orleans-today", title: "Things to do today", copy: "Same-day picks that fit your window." },
  { href: "/guides/tonight", title: "What’s on tonight", copy: "Live music, dinner, and evening tours." },
  { href: "/guides", title: "Plan by trip type", copy: "Families, couples, first timers, and cruise visitors." },
];

export default function NewOrleansHomePage() {
  const productBySlug = (slug: string) => STOREFRONT_PRODUCTS.find((product) => product.slug === slug);

  return (
    <div className="bg-[var(--nola-bg-charcoal)] text-[var(--nola-ivory)] font-sans overflow-hidden">
      <section className={visualStyles.homeHero}>
        <div className={visualStyles.homeHeroBackground} aria-hidden="true" />
        <div className={visualStyles.homeHeroOverlay} aria-hidden="true" />
        <div className={visualStyles.homeHeroContent}>
          <div className={visualStyles.homeHeroIntro}>
            <h1 className={visualStyles.homeHeadline}>
              <span className={`${visualStyles.homeHeadlineLead} ${visualStyles.accentFont}`}>Find the right</span>
              <span className={`${visualStyles.homeHeadlineDisplay} ${visualStyles.displayFont}`}>New Orleans</span>
              <span className={`${visualStyles.homeHeadlineScript} ${visualStyles.scriptFont}`}>experience</span>
              <span className={`${visualStyles.homeHeadlineDisplay} ${visualStyles.displayFont}`}>for your group</span>
            </h1>
            <div className={visualStyles.homeDivider} aria-hidden="true"><span /><span className={visualStyles.homeFleur}>⚜</span><span /></div>
            <p className={visualStyles.homeHeroCopy}>New Orleans is better when you choose the right experience. Tell us who you’re traveling with and what kind of day you want. We’ll narrow the city down to the experiences that actually fit.</p>
            <div className={visualStyles.homeHeroActions}>
              <Link href="/guides/things-to-do-in-new-orleans-today" data-wno-event="hero_cta_clicked" data-wno-label="Find Something Today" className="border border-[var(--nola-gold)] bg-[var(--nola-gold)] px-6 py-3 text-xs font-bold uppercase tracking-widest text-[#171717] hover:bg-[var(--nola-ivory)]">Find Something Today</Link>
              <a href="#chooser" data-wno-event="hero_cta_clicked" data-wno-label="Help Me Choose" className="border border-[var(--nola-gold)] px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--nola-ivory)]">Help Me Choose</a>
              <a href="tel:+15044849687" data-wno-event="hero_cta_clicked" data-wno-label="Call or Text 504-484-9687" className={visualStyles.homeHeroPhoneAction}>Call or Text&nbsp; 504-484-9687</a>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--nola-border)] bg-[#09090a]">
        <div className="mx-auto grid w-[min(1100px,calc(100%-2rem))] grid-cols-1 divide-y divide-[var(--nola-border)] py-4 text-center sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--nola-gold)]">Trusted Local Partners</p></div>
          <div className="px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--nola-gold)]">Curated Experiences</p></div>
          <div className="px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--nola-gold)]">Local Planning Support</p></div>
        </div>
      </section>

      <section id="category-paths" className={visualStyles.homeCategorySection}>
        <div className={visualStyles.homeSectionInner}>
          <div className={visualStyles.homeSectionHeading}>
            <div>
              <p className={visualStyles.homeSectionEyebrow}>Explore New Orleans Your Way</p>
              <h2 className={`${visualStyles.homeSectionTitle} ${visualStyles.displayFont}`}>Handpicked experiences. Local help. Better decisions.</h2>
            </div>
          </div>
          <div className={visualStyles.homeCategoryGrid}>
            {categoryLinks.map((category, index) => (
              <Link key={`${category.label}-${index}`} href={category.href} data-wno-event="intent_tile_clicked" data-wno-label={category.label} className={visualStyles.homeCategoryCard}>
                <div className={visualStyles.homeCategoryMedia}>
                  <img src={category.image} alt="" loading={index < 4 ? "eager" : "lazy"} />
                  <span className={visualStyles.homeCategoryIndex} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  <span className={visualStyles.homeCategoryArrow} aria-hidden="true">↗</span>
                </div>
                <div className={visualStyles.homeCategoryBody}>
                  <h3 className={visualStyles.homeCategoryTitle}>{category.label}</h3>
                  <p>{category.text}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <DailyBriefSignup source="home-intents" />

      <section id="chooser" className={visualStyles.homeChooserSection}>
        <div className={visualStyles.homeChooserInner}>
          <p className={visualStyles.homeSectionEyebrow}>Not sure?</p>
          <h2 className={`${visualStyles.homeSectionTitle} ${visualStyles.displayFont}`}>Help Me Choose</h2>
          <p className={visualStyles.homeChooserCopy}>Answer a few questions. We’ll narrow the city to the experiences that fit.</p>
          <NewOrleansRecommendationFlow />
        </div>
      </section>

      <section className="border-y border-[var(--nola-border)] bg-[#0b0b0c] py-16">
        <div className="mx-auto w-[min(1240px,calc(100%-3rem))]">
          <p className={visualStyles.homeSectionEyebrow}>Live local notes</p>
          <h2 className={`${visualStyles.homeSectionTitle} ${visualStyles.displayFont}`}>What’s happening next 48 hours</h2>
          <LiveIntelligencePanel />
          <div className="mt-8"><a href="#chooser" data-wno-event="live_intelligence_chooser_clicked" data-wno-label="Not sure? Help Me Choose" className={visualStyles.homeGoldButton}>Not sure? Help Me Choose</a></div>
        </div>
      </section>

      <section className={visualStyles.homeCuratedSection}>
        <div className={visualStyles.homeSectionInner}>
          <div className={visualStyles.homeCuratedHeading}>
            <div>
              <p className={visualStyles.homeSectionEyebrow}>Curated picks</p>
              <h2 className={`${visualStyles.homeCuratedTitle} ${visualStyles.displayFont}`}>A few places we’d start</h2>
            </div>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {editorialPicks.map((pick) => {
              const product = productBySlug(pick.slug);
              if (!product) return null;
              return (
                <Link key={pick.slug} href={`/tours/${pick.slug}`} data-wno-event="editorial_pick_clicked" data-wno-product={pick.slug} data-wno-label={pick.kicker} className="group block border border-[var(--nola-border)] bg-[var(--nola-surface)] p-6 transition hover:border-[var(--nola-gold)]">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--nola-gold)]">{pick.kicker}</p>
                  <h3 className={`mt-3 text-2xl text-[var(--nola-ivory)] ${visualStyles.accentFont}`}>{product.title}</h3>
                  <p className="mt-2 text-sm leading-5 text-[var(--nola-text-muted)]">{pick.note}</p>
                  <span className="mt-4 inline-block text-xs font-bold uppercase tracking-widest text-[var(--nola-gold)]">See Availability →</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--nola-border)] bg-[#0b0b0c] py-16">
        <div className="mx-auto w-[min(1240px,calc(100%-3rem))]">
          <div className="grid gap-5 md:grid-cols-3">
            {guideCards.map((card) => (
              <Link key={card.href} href={card.href} data-wno-event="guide_summary_clicked" data-wno-label={card.title} className="group border border-[var(--nola-border)] bg-[var(--nola-surface)] p-6 transition hover:border-[var(--nola-gold)]">
                <h3 className={`text-2xl text-[var(--nola-ivory)] ${visualStyles.accentFont}`}>{card.title}</h3>
                <p className="mt-2 text-sm leading-5 text-[var(--nola-text-muted)]">{card.copy}</p>
                <span className="mt-4 inline-block text-xs font-bold uppercase tracking-widest text-[var(--nola-gold)]">Browse Guides →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={visualStyles.homeConciergeSection}>
        <div className={visualStyles.homeSectionInner}>
          <div className="border border-[var(--nola-border)] bg-[var(--nola-surface)] p-6 md:flex md:items-center md:justify-between md:gap-8">
            <div>
              <p className={visualStyles.homeSectionEyebrow}>Local Planning Help</p>
              <p className="mt-2 max-w-3xl text-base leading-6 text-[var(--nola-ivory)]">Want help now? Call or text 504-484-9687 or book a $5 French Quarter Orientation at 8:00 or 9:30 AM daily.</p>
            </div>
            <div className="mt-5 flex flex-wrap gap-3 md:mt-0">
              <a href="tel:+15044849687" data-wno-event="concierge_phone_clicked" className={visualStyles.homeGoldButton}>Call or Text</a>
              <Link href="/guides/french-quarter-orientation" data-wno-event="orientation_clicked" className={visualStyles.homeTextButton}>French Quarter Orientation</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
