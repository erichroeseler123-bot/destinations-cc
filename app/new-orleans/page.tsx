import React from "react";
import Link from "next/link";
import TravelReferenceExperience from "@/app/components/dcc/TravelReferenceExperience";
import MsyTaxiFareScheduleCard from "@/app/components/dcc/MsyTaxiFareScheduleCard";
import { getPublishedTravelReferenceNodeById } from "@/lib/dcc/travelReference";
import visualStyles from "./components/newOrleansVisual.module.css";
import NewOrleansRecommendationFlow from "./components/NewOrleansRecommendationFlow";
import LiveIntelligencePanel from "./components/LiveIntelligencePanel";
import DailyBriefSignup from "./components/DailyBriefSignup";
import { STOREFRONT_PRODUCTS } from "./tours/pageConfig";

export const revalidate = 3600;

export const metadata = {
  title: "New Orleans, Louisiana Travel Reference, Port Logistics & Bayou Guide | Destination Command Center",
  description:
    "Comprehensive New Orleans travel reference combining French Quarter & river port geography, MSY airport & streetcar logistics, Port NOLA WHTI entry rules, live NWS/NOAA conditions, and bayou/plantation specialist handoffs.",
  alternates: {
    canonical: "https://destinationcommandcenter.com/new-orleans",
  },
  robots: { index: true, follow: true },

  openGraph: {
    title: "New Orleans Travel Reference & Local Planning Hub | Destination Command Center",
    description:
      "Source-attributed New Orleans travel reference with live NWS weather, Mississippi River conditions, MSY aviation telemetry, and curated tour handoffs.",
  },
};

const categoryLinks = [
  { href: "/city-tours", label: "City Tours", text: "Neighborhoods, stories & landmarks.", image: "/images/travel-markets/new-orleans/french-quarter-street.jpg", alt: "Sunlit historic architecture and balconies in the French Quarter, New Orleans" },
  { href: "/swamp-tours", label: "Swamps & Airboats", text: "Get out into the bayou.", image: "/images/portfolio/louisiana-airboat-marsh.webp", alt: "Airboat skimming across coastal Louisiana marshland near New Orleans" },
  { href: "/riverboat-cruises", label: "River Cruises", text: "Jazz, brunch & Mississippi views.", image: "/images/travel-markets/new-orleans/steamboat-natchez.jpg", alt: "Steamboat Natchez paddlewheeler cruising on the Mississippi River in New Orleans" },
  { href: "/plantation-tours", label: "Plantations", text: "History beneath the oaks.", image: "/images/wikimedia/originals/oak-alley-front.jpg", alt: "Avenue of centuries-old live oaks leading to Oak Alley Plantation" },
  { href: "/food-tours", label: "Food & Cocktails", text: "Taste your way through the Quarter.", image: "/images/wikimedia/originals/gumbo-dish.jpg", alt: "Traditional New Orleans gumbo served in the French Quarter" },
  { href: "/ghost-tours", label: "Ghosts & Spirits", text: "Strange stories after dark.", image: "/images/wikimedia/originals/lalaurie-mansion-1906.jpg", alt: "Historic LaLaurie Mansion on Royal Street in the French Quarter" },
  { href: "/city-tours", label: "Garden District", text: "Mansions, history & neighborhood character.", image: "/images/portfolio/garden-district-mansion.webp", alt: "Historic Greek Revival mansion shaded by live oaks in the Garden District" },
  { href: "/tours#combo-tours", label: "Full-Day Combos", text: "Combine the city and plantation in one day.", image: "/images/portfolio/laura-plantation.webp", alt: "Colorful Creole architecture at Laura Plantation on a full-day New Orleans excursion" },
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
  { href: "/guides/new-orleans-tours-tonight", title: "What’s on tonight", copy: "Live music, dinner, and evening tours." },
  { href: "/guides", title: "Plan by trip type", copy: "Families, couples, first timers, and cruise visitors." },
];

export default async function NewOrleansHomePage() {
  const productBySlug = (slug: string) => STOREFRONT_PRODUCTS.find((product) => product.slug === slug);
  const nolaReference = await getPublishedTravelReferenceNodeById("new-orleans");

  return (
    <div className="bg-[var(--nola-bg-charcoal)] text-[var(--nola-ivory)] font-sans overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 space-y-6">
        <TravelReferenceExperience node={nolaReference} />
        <section
          data-testid="dcc-new-orleans-hub-authority-card"
          data-dcc-authority-market="new-orleans"
          className="rounded-3xl border border-cyan-400/30 bg-[#0d141d] p-6 md:p-8 space-y-4 shadow-xl"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
              DCC Public Authority · Direct Answer &amp; Portfolio Next Step
            </span>
            <span className="text-xs font-semibold text-emerald-300">
              Evidence Verified: 2026-11-06
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white">
            How to choose the right New Orleans excursion before you book
          </h2>
          <p className="text-sm leading-6 text-white/85">
            <strong>1. Swamp &amp; Bayou without a car or with kids under 5:</strong> Choose a covered pontoon boat with round-trip French Quarter/Downtown hotel pickup (<strong>15200P6 Option TG10</strong> $60 w/ 8:00–8:30 AM pickup; <strong>6953SWAMPTRANS</strong> $75.52; or <strong>Gray Line</strong> $65 w/ coach from 400 Toulouse St.). Rural bayou docks 30–45 min outside the city have <strong>no return Uber/Lyft coverage</strong>, and the <strong>NPS Barataria Preserve Visitor Center &amp; most trails are closed for ~2 years starting Feb 2, 2026</strong>.{" "}
            <strong>2. High-speed Airboats (Age 5+ only):</strong> Enforce a strict minimum age of 5, prohibit pregnancy and back/neck injuries, and charge $30/pp extra for Downtown/FQ hotel shuttle on Airboat Adventures (no Airbnbs).{" "}
            <strong>3. Plantations:</strong> Pick <strong>Whitney ($79)</strong> for the museum of slavery, <strong>Oak Alley ($82)</strong> for antebellum architecture, or <strong>Laura ($89)</strong> for Creole history.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <a
              href="https://www.welcometoneworleanstours.com/swamp-tours?src=dcc-authority-new-orleans&from=dcc-new-orleans"
              data-testid="dcc-hub-to-wno-swamp"
              data-dcc-next-step="welcometoneworleanstours"
              className="rounded-xl bg-emerald-400 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#04120a] hover:bg-emerald-300 transition"
            >
              Compare Swamp Tours on Welcome to New Orleans Tours →
            </a>
            <a
              href="https://www.welcometoneworleanstours.com/tours?src=dcc-authority-new-orleans&from=dcc-new-orleans"
              data-testid="dcc-hub-to-wno-tours"
              data-dcc-next-step="welcometoneworleanstours"
              className="rounded-xl border border-cyan-300/40 bg-cyan-500/15 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-cyan-100 hover:bg-cyan-500/25 transition"
            >
              Open Full WNO Storefront (23 Verified Tours) →
            </a>
            <Link
              href="/new-orleans/swamp-tours"
              className="rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-xs font-bold text-white hover:bg-white/15 transition"
            >
              Inspect DCC Swamp Decision Matrix →
            </Link>
          </div>
        </section>
        <MsyTaxiFareScheduleCard />
      </div>
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
              <Link href="/tours" data-wno-event="hero_cta_clicked" data-wno-label="Browse All Tours" className="border border-[var(--nola-gold)] bg-[var(--nola-gold)] px-6 py-3 text-xs font-bold uppercase tracking-widest text-[#171717] hover:bg-[var(--nola-ivory)]">Browse All Tours</Link>
              <Link href="/guides/things-to-do-in-new-orleans-today" data-wno-event="hero_cta_clicked" data-wno-label="Find Something Today" className="border border-[var(--nola-gold)] px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--nola-ivory)] hover:bg-[var(--nola-gold)] hover:text-[#171717]">Find Something Today</Link>
              <a href="#chooser" data-wno-event="hero_cta_clicked" data-wno-label="Help Me Choose" className="border border-[var(--nola-gold)] px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--nola-ivory)]">Help Me Choose</a>
              <a href="tel:+15044849687" data-wno-event="hero_cta_clicked" data-wno-label="Call or Text 504-484-9687" className={visualStyles.homeHeroPhoneAction}>Call or Text&nbsp; 504-484-9687</a>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--nola-border)] bg-[#09090a]">
        <div className="mx-auto grid w-[min(1100px,calc(100%-2rem))] grid-cols-1 divide-y divide-[var(--nola-border)] py-4 text-center sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--nola-gold)]">Trusted Local Partners<br /><span className="normal-case tracking-normal text-[11px] text-[var(--nola-text-muted)]">Southern Style Tours · Ragin Cajun Tours · New Orleans Steamboat Company</span></p></div>
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
                  <img src={category.image} alt={category.alt} width={640} height={400} loading={index < 4 ? "eager" : "lazy"} />
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

      <section className="border-y border-[var(--nola-gold)]/30 bg-gradient-to-b from-[#12100c] to-[#0b0b0c] py-12 md:py-16">
        <div className="mx-auto w-[min(900px,calc(100%-3rem))]">
          <div className="relative overflow-hidden border border-[var(--nola-gold)]/40 bg-[var(--nola-surface)] p-8 md:p-10 md:flex md:items-center md:gap-10">
            <div className="absolute left-0 top-0 h-full w-1 bg-[var(--nola-gold)]" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--nola-gold)]">In New Orleans Now?</p>
              <h2 className={`mt-2 text-2xl md:text-3xl text-[var(--nola-ivory)] ${visualStyles.accentFont}`}>
                Meet a Tour Concierge
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--nola-text-muted)]">
                Talk through the available tours, compare formats, and get honest help choosing — before you book anything.
                Concierge meetings are arranged in advance at a convenient French Quarter location.
              </p>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-xl font-bold text-[var(--nola-ivory)]">From $5</span>
                <span className="text-xs text-[var(--nola-text-muted)]">per person · 8:00 or 9:30 AM daily</span>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3 md:mt-0 md:flex-col md:items-stretch shrink-0">
              <Link
                href="/french-quarter-welcome-stop"
                data-wno-event="concierge_cta_clicked"
                data-wno-label="Schedule Tour Help"
                className="inline-flex items-center justify-center bg-[var(--nola-gold)] px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-[#171717] hover:bg-[var(--nola-ivory)] transition"
              >
                Schedule Tour Help
              </Link>
              <a
                href="tel:+15044849687"
                data-wno-event="concierge_phone_clicked"
                data-wno-label="Call Now"
                className="inline-flex items-center justify-center border border-[var(--nola-gold)] px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-[var(--nola-ivory)] hover:bg-[var(--nola-gold)] hover:text-[#171717] transition"
              >
                Call 504-484-9687
              </a>
            </div>
          </div>
        </div>
      </section>

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
                <Link key={pick.slug} href={`/tours/${pick.slug}`} data-wno-event="editorial_pick_clicked" data-wno-product={pick.slug} data-wno-label={pick.kicker} className="group block overflow-hidden border border-[var(--nola-border)] bg-[var(--nola-surface)] transition hover:border-[var(--nola-gold)]">
                  {product.imageUrl ? (
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#161411]">
                      <img
                        src={product.imageUrl}
                        alt={product.imageAlt || product.title}
                        width={640}
                        height={400}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    </div>
                  ) : null}
                  <div className="p-6">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--nola-gold)]">{pick.kicker}</p>
                    <h3 className={`mt-3 text-2xl text-[var(--nola-ivory)] ${visualStyles.accentFont}`}>{product.title}</h3>
                    <p className="mt-2 text-sm leading-5 text-[var(--nola-text-muted)]">{pick.note}</p>
                    <span className="mt-4 inline-block text-xs font-bold uppercase tracking-widest text-[var(--nola-gold)]">See Availability →</span>
                  </div>
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
              <Link href="/french-quarter-welcome-stop" data-wno-event="welcome_stop_clicked" className={visualStyles.homeTextButton}>French Quarter Welcome Stop</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
