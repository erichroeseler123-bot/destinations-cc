import React from "react";
import Link from "next/link";
import visualStyles from "./components/newOrleansVisual.module.css";
import NewOrleansRecommendationFlow from "./components/NewOrleansRecommendationFlow";
import ProductCard from "./components/ProductCard";
import { STOREFRONT_PRODUCTS } from "./tours/pageConfig";
import { buildAttributedTourHref, FAREHARBOR_SOURCES } from "./lib/fareHarborAttribution";

export const metadata = {
  title: "New Orleans Tours, Cruises & Experiences | Welcome to New Orleans Tours",
  description:
    "Compare New Orleans tours, river cruises, swamp trips, plantation tours and evening experiences. Get visitor help and check current times and prices with participating operators.",
  openGraph: {
    title: "Welcome to New Orleans Tours | Tours & Concierge Help",
    description:
      "Compare New Orleans experiences, use the tour chooser, and get visitor help from the New Orleans Concierge Desk.",
  },
};

export default function NewOrleansHomePage() {
  const productBySlug = (slug: string) => STOREFRONT_PRODUCTS.find((product) => product.slug === slug);
  const categoryLinks = [
    { href: "/city-tours", label: "Explore the City", text: "History, neighborhoods, architecture, and local landmarks.", image: "/images/travel-markets/new-orleans/french-quarter-street.jpg" },
    { href: "/swamp-tours", label: "Swamps & Airboats", text: "Covered boats and airboats beyond the city.", image: "/images/travel-markets/new-orleans/airboat-swamp.png" },
    { href: "/tours#river-cruises", label: "River Cruises", text: "Mississippi views, jazz, brunch, and riverboat options.", image: "/images/travel-markets/new-orleans/steamboat-natchez.jpg" },
    { href: "/plantation-tours", label: "Plantations", text: "Louisiana history and historic sites outside the city.", image: "/images/wikimedia/originals/oak-alley-front.jpg" },
    { href: buildAttributedTourHref("craft-cocktail-walking-tour", FAREHARBOR_SOURCES.home), label: "Food & Cocktails", text: "Taste and walk your way through New Orleans culture.", image: "/images/wikimedia/originals/gumbo-dish.jpg" },
    { href: buildAttributedTourHref("ghosts-spirits-walking-tour", FAREHARBOR_SOURCES.home), label: "Ghosts & Spirits", text: "After-dark stories through the historic city.", image: "/images/wikimedia/originals/lalaurie-mansion-1906.jpg" },
    { href: "/tours#combo-tours", label: "Full-Day Combos", text: "Pair the city, plantations, and swamps in one outing.", image: "/images/travel-markets/new-orleans/swamp-plantation-combo.png" },
    { href: "/help-me-choose", label: "Help Me Choose", text: "Answer six quick traveler questions and get a best fit plus an alternative.", image: "/images/new-orleans/hero-french-quarter-balcony.jpg" },
  ];

  const curatedSections = [
    { eyebrow: "Start with the classics", title: "Popular ways to experience New Orleans", script: "The good stuff, curated.", slugs: ["city-tour-of-new-orleans", "evening-jazz-cruise", "covered-tour-boat"] },
    { eyebrow: "First visit? Start here", title: "First time in New Orleans?", script: "Start with these.", slugs: ["city-tour-of-new-orleans", "daytime-jazz-cruise", "oak-alley-or-laura-plantation-tour"] },
    { eyebrow: "After the sun goes down", title: "Tonight in the city", script: "Something fun after dark.", slugs: ["evening-jazz-cruise", "craft-cocktail-walking-tour", "ghosts-spirits-walking-tour"] },
    { eyebrow: "Beyond the streetcar line", title: "Get out of town", script: "Swamps, plantations & bayou country.", slugs: ["covered-tour-boat", "ragin-cajun-airboat-options", "whitney-plantation-tour"] },
    { eyebrow: "Make the day count", title: "Make a day of it", script: "When one stop is not enough.", slugs: ["all-day-city-plantation-combo", "covered-boat-plantation-combo", "swamp-boat-oak-alley-combo"] },
  ];

  const alreadyHereLinks = [
    { href: "/guides/things-to-do-in-new-orleans-today", title: "Things to do today", image: "/images/travel-markets/new-orleans/french-quarter-street.jpg" },
    { href: "/guides/new-orleans-tours-tonight", title: "Tours tonight", image: "/images/wikimedia/originals/french-quarter-night.jpg" },
    { href: "/tours#river-cruises", title: "River cruises", image: "/images/travel-markets/new-orleans/steamboat-natchez.jpg" },
    { href: buildAttributedTourHref("craft-cocktail-walking-tour", FAREHARBOR_SOURCES.home), title: "Cocktail walking tours", image: "/images/wikimedia/originals/gumbo-dish.jpg" },
    { href: "/french-quarter-welcome-stop", title: "Concierge help choosing", image: "/images/wikimedia/originals/french-quarter-night.jpg" },
  ];

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
            <p className={visualStyles.homeHeroCopy}>Compare participating local tours and experiences, check current times and prices, or tell us what kind of day you want and we&apos;ll help narrow the choices.</p>
            <div className={visualStyles.homeHeroActions}>
              <Link href="/guides/things-to-do-in-new-orleans-today" className="border border-[var(--nola-gold)] bg-[var(--nola-gold)] px-6 py-3 text-xs font-bold uppercase tracking-widest text-[#171717] hover:bg-[var(--nola-ivory)]">Find Something Today</Link>
              <a href="#chooser" className="border border-[var(--nola-gold)] px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--nola-ivory)]">Help Me Choose</a>
              <a href="tel:+15044849687" className={visualStyles.homeHeroPhoneAction}>Let&apos;s talk&nbsp; 504-484-9687</a>
            </div>
          </div>
        </div>
      </section>

      <section id="category-paths" className={visualStyles.homeCategorySection}>
        <div className={visualStyles.homeSectionInner}>
          <div className={visualStyles.homeSectionHeading}>
            <div><p className={visualStyles.homeSectionEyebrow}>Choose your mood</p><h2 className={`${visualStyles.homeSectionTitle} ${visualStyles.displayFont}`}>What sounds good?</h2><p className={`${visualStyles.homeSectionScript} ${visualStyles.scriptFont}`}>Pick your kind of New Orleans.</p></div>
            <Link href="/tours" className={visualStyles.homeSectionLink}>See the full catalog <span aria-hidden="true">↗</span></Link>
          </div>
          <div className={visualStyles.homeCategoryGrid}>
            {categoryLinks.map((category) => <Link key={category.label} href={category.href} className={visualStyles.homeCategoryCard}>
              <div className={visualStyles.homeCategoryMedia}><img src={category.image} alt="" /><span className={visualStyles.homeCategoryIndex} aria-hidden="true">{String(categoryLinks.indexOf(category) + 1).padStart(2, "0")}</span><span className={visualStyles.homeCategoryArrow} aria-hidden="true">↗</span></div>
              <div className={visualStyles.homeCategoryBody}><h3 className={visualStyles.homeCategoryTitle}>{category.label}</h3><p>{category.label === "Explore the City" ? "Neighborhoods, stories & landmarks." : category.label === "Swamps & Airboats" ? "Get out into the bayou." : category.label === "River Cruises" ? "Jazz, brunch & Mississippi views." : category.label === "Plantations" ? "History beneath the oaks." : category.label === "Food & Cocktails" ? "Taste your way through the Quarter." : category.label === "Ghosts & Spirits" ? "Strange stories after dark." : category.label === "Full-Day Combos" ? "More of Louisiana in one day." : "A better answer starts here."}</p></div>
            </Link>)}
          </div>
        </div>
      </section>

      <section id="chooser" className={visualStyles.homeChooserSection}>
        <div className={visualStyles.homeChooserInner}><p className={visualStyles.homeSectionEyebrow}>Not sure where to start?</p><h2 className={`${visualStyles.homeSectionTitle} ${visualStyles.displayFont}`}>Help Me Choose</h2><p className={visualStyles.homeChooserCopy}>No plan yet? A few answers can narrow the field to experiences that fit your group, pace, and appetite for adventure.</p><NewOrleansRecommendationFlow /></div>
      </section>

      <section className={visualStyles.homeAlreadyHereSection}>
        <div className={visualStyles.homeSectionInner}>
          <div className={visualStyles.homeAlreadyHereIntro}><p className={visualStyles.homeSectionEyebrow}>For plans taking shape now</p><h2 className={`${visualStyles.homeSectionTitle} ${visualStyles.displayFont}`}>Already here?</h2><p className={`${visualStyles.homeSectionScript} ${visualStyles.scriptFont}`}>No plans? Perfect.</p><p className={visualStyles.homeAlreadyHereCopy}>Skip the giant catalog. Start with what makes sense for today or tonight, then check live operator availability.</p><div className={visualStyles.homeAlreadyHereActions}><Link href="/guides/things-to-do-in-new-orleans-today" className={visualStyles.homeGoldButton}>Things to do today</Link><Link href="/guides/new-orleans-tours-tonight" className={visualStyles.homeTextButton}>Find something tonight</Link><Link href="/french-quarter-welcome-stop" className={visualStyles.homeTextButton}>Ask the Concierge Desk</Link></div></div>
          <div className={visualStyles.homeAlreadyHereGrid}>{alreadyHereLinks.map((item) => <Link key={item.title} href={item.href} className={visualStyles.homeMomentCard}><div className={visualStyles.homeMomentMedia}><img src={item.image} alt="" /></div><div className={visualStyles.homeMomentBody}><h3>{item.title}</h3><span>Check times &amp; availability</span></div></Link>)}</div>
        </div>
      </section>

      <section className={visualStyles.homeCuratedSection}><div className={visualStyles.homeSectionInner}>{curatedSections.map((section, index) => {
        const products = section.slugs.map(productBySlug).filter(Boolean);
        return <section key={section.title} className={`${visualStyles.homeCuratedBlock} ${index % 2 === 1 ? visualStyles.homeCuratedBlockAlt : ""}`}><div className={visualStyles.homeCuratedHeading}><div><p className={visualStyles.homeSectionEyebrow}>{section.eyebrow}</p><h2 className={`${visualStyles.homeCuratedTitle} ${visualStyles.displayFont}`}>{section.title}</h2><p className={`${visualStyles.homeCuratedScript} ${visualStyles.scriptFont}`}>{section.script}</p></div><Link href="/tours" className={visualStyles.homeSectionLink}>See all tours <span aria-hidden="true">↗</span></Link></div><div className={visualStyles.homeProductGrid}>{products.map((product) => product && <ProductCard key={product.id} attributionSource={FAREHARBOR_SOURCES.home} product={{ ...product, operatorAttribution: product.operatorName, isBookable: true, ctaLabel: "Check Times & Prices" } as any} />)}</div></section>;
      })}</div></section>

      <section className={visualStyles.homeCatalogCta}><p className={visualStyles.homeSectionEyebrow}>The complete collection</p><h2 className={`${visualStyles.homeCatalogTitle} ${visualStyles.displayFont}`}>Already know what you want?</h2><p>Compare the full selection of current tours and booking options.</p><Link href="/tours" className={visualStyles.homeGoldButton}>Browse all tours</Link></section>

      <section className={visualStyles.homeConciergeSection}>
        <div className={visualStyles.homeSectionInner}><div className={visualStyles.homeConciergeGrid}>
          <div className={visualStyles.homeConciergePanel}><div className={visualStyles.homeSectionEyebrow}>Welcome to New Orleans Tours</div><h3 className={`${visualStyles.homePanelTitle} ${visualStyles.displayFont}`}>New Orleans Concierge Desk</h3><p className={visualStyles.homePanelCopy}>The Concierge Desk is our visitor-help side: already here and still deciding? Call or text for help comparing tours, timing, transportation, and what fits your group. You can also start your morning with our $5 French Quarter Orientation.</p><Link href="/french-quarter-welcome-stop" className={visualStyles.homeTextButton}>Visit the Concierge Desk</Link></div>
          <div className={visualStyles.homeConciergePanelAlt}><div className={visualStyles.homeSectionEyebrow}>Private Parties</div><h3 className={`${visualStyles.homePanelTitle} ${visualStyles.displayFont}`}>Group Planning</h3><p className={visualStyles.homePanelCopy}>Planning a family, wedding, or corporate group? Contact us to discuss available tour options.</p><Link href="/contact" className={visualStyles.homeTextButton}>Inquire About Groups</Link></div>
        </div></div>
      </section>

      <section className={visualStyles.homeGuidesSection}><div className={visualStyles.homeSectionInner}><div className={visualStyles.homeGuidesHeading}><p className={visualStyles.homeSectionEyebrow}>Before you decide</p><h2 className={`${visualStyles.homeCatalogTitle} ${visualStyles.displayFont}`}>Field notes from New Orleans</h2><p className={`${visualStyles.homeSectionScript} ${visualStyles.scriptFont}`}>A little context goes a long way.</p></div><div className={visualStyles.homeGuideGrid}><GuideLink href="/compare/covered-swamp-boat-vs-airboat" title="Compare Swamp Tour Formats" /><GuideLink href="/guides/how-far-are-swamp-tours-from-new-orleans" title="How Far Are Swamp Tours From New Orleans?" /><GuideLink href="/compare/swamp-tour-with-vs-without-transportation" title="Swamp Tour Transportation" /><GuideLink href="/guides/how-long-does-a-swamp-tour-take" title="How Long Does a Swamp Tour Take?" /></div></div></section>
    </div>
  );
}

function GuideLink({ href, title }: { href: string; title: string }) {
  return <Link href={href} className="block p-6 border border-[var(--nola-border)] bg-[var(--nola-surface-subtle)] hover:border-[var(--nola-gold)] transition-colors group"><h4 className={`font-serif text-lg text-[var(--nola-ivory)] mb-4 group-hover:text-[var(--nola-gold)] ${visualStyles.accentFont}`}>{title}</h4><span className="text-[10px] uppercase tracking-widest font-bold text-[var(--nola-text-muted)] group-hover:text-[var(--nola-ivory)]">Read Guide →</span></Link>;
}