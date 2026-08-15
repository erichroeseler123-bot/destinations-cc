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
    title: "Welcome to New Orleans Tours | Local Concierge Help",
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
  { slug: "evening-jazz-cruise", kicker: "Our pick for a classic New Orleans night", note: "Live jazz, Mississippi views, and an easy evening plan for first-time visitors." },
  { slug: "covered-tour-boat", kicker: "Our pick when you want swamp without the speed", note: "A calmer, shaded way to get into the bayou — especially good for mixed-age groups." },
  { slug: "whitney-plantation-tour", kicker: "Our pick for understanding plantation history", note: "A history-focused visit centered on the lives and experiences of enslaved people." },
  { slug: "city-tour-of-new-orleans", kicker: "Our pick for a first afternoon", note: "A broad introduction to the city when you want context before exploring on your own." },
  { slug: "craft-cocktail-walking-tour", kicker: "Our pick for a local food crawl", note: "A French Quarter walking option built around New Orleans cocktail culture, local history, and the flavor of the neighborhood." },
  { slug: "all-day-city-plantation-combo", kicker: "Our pick for an easy full day", note: "A city overview plus a plantation visit when you want one plan to carry the day." },
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
          <div className="px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--nola-gold)]">Local Concierge Support</p></div>
        </div>
      </section>

      <section id="category-paths" className={visualStyles.homeCategorySection}>
        <div className={visualStyles.homeSectionInner}>
          <div className={visualStyles.homeSectionHeading}>
            <div>
              <p className={visualStyles.homeSectionEyebrow}>Choose your mood</p>
              <h2 className={`${visualStyles.homeSectionTitle} ${visualStyles.displayFont}`}>What sounds good?</h2>
              <p className={`${visualStyles.homeSectionScript} ${visualStyles.scriptFont}`}>Pick your kind of New Orleans.</p>
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
          <p className={visualStyles.homeSectionEyebrow}>Not sure where to start?</p>
          <h2 className={`${visualStyles.homeSectionTitle} ${visualStyles.displayFont}`}>Help Me Choose</h2>
          <p className={visualStyles.homeChooserCopy}>A few quick answers help us narrow 21 curated experiences to the ones that make sense for your time, group, pace, and interests.</p>
          <NewOrleansRecommendationFlow />
        </div>
      </section>

      <section className="border-y border-[var(--nola-border)] bg-[#0b0b0c] py-16">
        <div className="mx-auto w-[min(1240px,calc(100%-3rem))]">
          <p className={visualStyles.homeSectionEyebrow}>Live concierge notes</p>
          <h2 className={`${visualStyles.homeSectionTitle} ${visualStyles.displayFont}`}>What’s happening in New Orleans — next 48 hours</h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--nola-text-muted)]">Timely music, weather, and city context changes what we recommend. These signals feed the chooser instead of sitting here as decorative copy.</p>
          <LiveIntelligencePanel />
          <div className="mt-8"><a href="#chooser" data-wno-event="live_intelligence_chooser_clicked" data-wno-label="Not sure what fits? Help Me Choose" className={visualStyles.homeGoldButton}>Not sure what fits? Help Me Choose</a></div>
        </div>
      </section>

      <section className={visualStyles.homeCuratedSection}>
        <div className={visualStyles.homeSectionInner}>
          <div className={visualStyles.homeCuratedHeading}>
            <div>
              <p className={visualStyles.homeSectionEyebrow}>Curated for real trips</p>
              <h2 className={`${visualStyles.homeCuratedTitle} ${visualStyles.displayFont}`}>A few places we’d start</h2>
              <p className={`${visualStyles.homeCuratedScript} ${visualStyles.scriptFont}`}>The inventory stays behind the recommendation.</p>
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
                  <p className="mt-3 text-sm leading-6 text-[var(--nola-text-muted)]">{pick.note}</p>
                  <span className="mt-5 inline-block text-xs font-bold uppercase tracking-widest text-[var(--nola-gold)]">See Availability →</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className={visualStyles.homeConciergeSection}>
        <div className={visualStyles.homeSectionInner}>
          <div className={visualStyles.homeConciergeGrid}>
            <div className={visualStyles.homeConciergePanel}>
              <div className={visualStyles.homeSectionEyebrow}>Welcome to New Orleans Tours</div>
              <h3 className={`${visualStyles.homePanelTitle} ${visualStyles.displayFont}`}>New Orleans Concierge Desk</h3>
              <p className={visualStyles.homePanelCopy}>Already here and still deciding? Start with the $5 French Quarter Orientation, call or text for help, or ask about a concierge visit where you’re staying when available.</p>
              <Link href="/french-quarter-welcome-stop" data-wno-event="concierge_desk_clicked" className={visualStyles.homeTextButton}>Visit the Concierge Desk</Link>
            </div>
            <div className={visualStyles.homeConciergePanelAlt}>
              <div className={visualStyles.homeSectionEyebrow}>Private Parties</div>
              <h3 className={`${visualStyles.homePanelTitle} ${visualStyles.displayFont}`}>Group Planning</h3>
              <p className={visualStyles.homePanelCopy}>Planning a family, wedding, or corporate group? Tell us the group and timing and we’ll help narrow the options.</p>
              <Link href="/contact" data-wno-event="group_planning_clicked" className={visualStyles.homeTextButton}>Inquire About Groups</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
