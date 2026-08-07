import React from "react";
import Link from "next/link";
import visualStyles from "./components/newOrleansVisual.module.css";
import NewOrleansChooser from "./components/NewOrleansChooser";
import { CHOOSER_CATEGORIES } from "./help-me-choose/recommendationRules";

export const metadata = {
  title: "New Orleans Tours | Discover and Book Real Local Experiences",
  description:
    "Compare New Orleans tours, find real participating experiences, and get local help choosing.",
  openGraph: {
    title: "New Orleans Tours | Discover and Book Real Local Experiences",
    description:
      "Compare New Orleans tours, use the tour chooser, and schedule New Orleans Tour Concierge help.",
  },
};

export default function NewOrleansHomePage() {
  const categoryLinks = [
    { id: "swamp-airboat", href: "/swamp-tours", label: "Swamp", text: "Covered boats and airboats beyond the city." },
    { id: "city-highlights", href: "/city-tours", label: "City", text: "History, neighborhoods, and local landmarks." },
    { id: "plantations-history", href: "/plantation-tours", label: "Plantation", text: "Louisiana history with transportation options." },
    { id: "haunted-after-dark", href: "/tours/ghosts-spirits-walking-tour", label: "Ghosts & Spirits", text: "After-dark stories through the historic city." },
    { id: "food-cooking", href: "/tours/craft-cocktail-walking-tour", label: "Food & Cocktails", text: "Taste and walk your way through New Orleans." },
    { id: "river-music", href: "/tours/evening-jazz-cruise", label: "River Cruise", text: "Mississippi views with live New Orleans music." },
  ];

  return (
    <div className="bg-[var(--nola-bg-charcoal)] text-[var(--nola-ivory)] font-sans overflow-hidden">
      {/* 1. Hero */}
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
            <div className={visualStyles.homeDivider} aria-hidden="true">
              <span />
              <span className={visualStyles.homeFleur}>⚜</span>
              <span />
            </div>
            <p className={visualStyles.homeHeroCopy}>
              Tell us what kind of day you want and we&apos;ll help you compare participating local experiences.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a href="#chooser" className="border border-[var(--nola-gold)] bg-[var(--nola-gold)] px-6 py-3 text-xs font-bold uppercase tracking-widest text-[#171717] hover:bg-[var(--nola-ivory)]">
                Help Me Choose
              </a>
              <Link href="/tours" className="border border-[var(--nola-ivory)]/50 px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--nola-ivory)] hover:border-[var(--nola-gold)] hover:text-[var(--nola-gold)]">
                Browse All Tours
              </Link>
            </div>
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

      {/* 2. Primary chooser */}
      <section id="chooser" className="border-y border-[var(--nola-border)] bg-[var(--nola-bg-black)] px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--nola-gold)]">Start here</p>
          <h2 className={`mb-4 font-serif text-3xl text-[var(--nola-ivory)] md:text-5xl ${visualStyles.accentFont}`}>Help Me Choose</h2>
          <p className="mx-auto mb-10 max-w-2xl text-lg font-light leading-relaxed text-[var(--nola-text-muted)]">No plan yet? A few answers can narrow the field to experiences that fit your group, pace, and appetite for adventure.</p>
          <NewOrleansChooser surface="homepage" />
        </div>
      </section>

      {/* 3. Curated category paths */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--nola-gold)]">Choose by experience</p>
            <h2 className={`font-serif text-3xl text-[var(--nola-ivory)] md:text-4xl ${visualStyles.accentFont}`}>What kind of day sounds right?</h2>
          </div>
          <Link href="/tours" className="text-xs font-bold uppercase tracking-widest text-[var(--nola-gold)] hover:text-[var(--nola-ivory)]">See the full catalog</Link>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categoryLinks.map((category) => {
            const image = CHOOSER_CATEGORIES.find((item) => item.id === category.id)?.image;
            return <Link key={category.id} href={category.href} className="group border border-[var(--nola-border)] bg-[var(--nola-surface-subtle)] transition-colors hover:border-[var(--nola-gold)]">
              <div className="relative aspect-[16/10] overflow-hidden bg-[#101010]">
                <img src={image} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="p-5">
                <h3 className={`mb-2 font-serif text-2xl text-[var(--nola-ivory)] group-hover:text-[var(--nola-gold)] ${visualStyles.accentFont}`}>{category.label}</h3>
                <p className="text-sm font-light leading-relaxed text-[var(--nola-text-muted)]">{category.text}</p>
              </div>
            </Link>;
          })}
        </div>
      </section>

      {/* 4. Full catalog path */}
      <section className="border-y border-[var(--nola-border)] bg-[var(--nola-surface-subtle)] px-6 py-16 text-center">
        <h2 className={`mb-3 font-serif text-3xl text-[var(--nola-ivory)] ${visualStyles.accentFont}`}>Already know what you want?</h2>
        <p className="mb-6 text-[var(--nola-text-muted)]">Compare the full selection of current tours and booking options.</p>
        <Link href="/tours" className="inline-block border border-[var(--nola-gold)] px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--nola-gold)] hover:bg-[var(--nola-gold)] hover:text-[#171717]">Browse All Tours</Link>
      </section>

      {/* 5. Tour Concierge & Group Planning */}
      <section className="border-b border-[var(--nola-border)] bg-[var(--nola-bg-black)] py-24">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="border border-[var(--nola-border)] bg-[var(--nola-bg-charcoal)] p-10 flex flex-col items-start">
            <div className="text-[10px] text-[var(--nola-gold)] uppercase tracking-widest font-bold mb-4">
              Scheduled Planning Help
            </div>
            <h3 className={`font-serif text-3xl mb-4 ${visualStyles.accentFont}`}>
              New Orleans Tour Concierge
            </h3>
            <p className="text-[var(--nola-ivory)]/70 font-light leading-relaxed mb-8 flex-grow">
              Already here and still deciding? We can arrange a relaxed conversation at an agreed hotel lobby or bar,
              French Quarter location, or another convenient public meeting place. Meetings are arranged in advance,
              availability varies, and we help families and groups compare their options.
            </p>
            <Link
              href="/french-quarter-welcome-stop"
              className="text-xs text-[var(--nola-ivory)] font-bold uppercase tracking-widest border-b border-[var(--nola-gold)] pb-1 hover:text-[var(--nola-gold)] transition-colors"
            >
              Talk Through Your Options
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
