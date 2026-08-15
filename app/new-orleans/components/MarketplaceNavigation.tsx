'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import PhoneCta from './PhoneCta';
import FrenchQuarterBoothBonus from './FrenchQuarterBoothBonus';
import styles from '../tours/outpost.module.css';
import visualStyles from './newOrleansVisual.module.css';

const supportLinks = [
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/booking-help", label: "Booking Help" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/cancellation-policy", label: "Cancellation Policy" },
  { href: "/affiliate-disclosure", label: "Affiliate Disclosure" },
  { href: "/accessibility", label: "Accessibility" },
];

export function HeaderNav() {
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    if (isOpen) document.body.classList.add(styles.noScroll);
    else document.body.classList.remove(styles.noScroll);
    return () => document.body.classList.remove(styles.noScroll);
  }, [isOpen]);
  const toggle = () => setIsOpen(!isOpen);

  return (
    <>
      <header className={visualStyles.marketHeader}>
        <div className={visualStyles.marketHeaderInner}>
          <Link href="/" className={visualStyles.marketBrand} aria-label="Welcome to New Orleans Tours">
            <span className={`${visualStyles.marketBrandWelcome} ${visualStyles.scriptFont}`}>Welcome to</span>{' '}
            <span className={`${visualStyles.marketBrandCity} ${visualStyles.accentFont}`}>New Orleans</span>{' '}
            <span className={visualStyles.marketBrandTours}>Tours</span>
          </Link>
          <nav className={visualStyles.marketDesktopNav}>
            <Link href="/tours">Experiences</Link>
            <Link href="/help-me-choose">Help Me Choose</Link>
            <Link href="/guides/things-to-do-in-new-orleans-today">Today</Link>
            <Link href="/guides/new-orleans-tours-tonight">Tonight</Link>
            <Link href="/french-quarter-welcome-stop">Concierge</Link>
          </nav>
          <div className={visualStyles.marketPhoneWrap}>
            <PhoneCta placement="WTONOT-HEADER-PHONE" isGroup className={visualStyles.marketPhone}>
              <span className={visualStyles.marketPhoneLabel}>Call or text</span>
              <span className={visualStyles.marketPhoneNumber}>504-484-9687</span>
            </PhoneCta>
          </div>
          <button onClick={toggle} className={visualStyles.marketMenuButton} aria-label="Toggle menu" aria-expanded={isOpen}>
            <div className="w-6 h-px bg-[#c7a96b]"></div>
            <div className="w-6 h-px bg-[#c7a96b]"></div>
            <div className="w-6 h-px bg-[#c7a96b]"></div>
          </button>
        </div>
      </header>
      {isOpen && <div className={`md:hidden ${styles.overlayDrawer}`} onClick={toggle}><div className={styles.drawerPanel} onClick={e => e.stopPropagation()}><div className="flex justify-between items-center mb-10"><span className="font-serif text-2xl font-medium text-[#c7a96b]">Menu</span><button onClick={toggle} className="text-2xl text-[#c7a96b]" aria-label="Close menu">&times;</button></div><nav className="flex flex-col gap-6 font-sans font-semibold text-base tracking-[0.12em] uppercase mb-10 text-[#fdfbf7]/80"><Link href="/tours" onClick={toggle}>Experiences</Link><Link href="/help-me-choose" onClick={toggle}>Help Me Choose</Link><Link href="/guides/things-to-do-in-new-orleans-today" onClick={toggle}>Things To Do Today</Link><Link href="/guides/new-orleans-tours-tonight" onClick={toggle}>Tonight</Link><Link href="/french-quarter-welcome-stop" onClick={toggle}>Concierge</Link><Link href="/guides/french-quarter-orientation" onClick={toggle}>$5 Orientation</Link><Link href="/guides/plan-new-orleans-tours" onClick={toggle}>Plan By Need</Link></nav><div className="mt-auto pt-8 border-t border-white/10"><PhoneCta placement="WTONOT-HEADER-PHONE" isGroup className="flex flex-col gap-2"><span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#fdfbf7]/50">Questions or groups</span><span className="text-2xl font-medium text-[#c7a96b]">504-484-9687</span></PhoneCta></div></div></div>}
    </>
  );
}

export function FooterNav() {
  return (
    <footer className="bg-[#151116] text-[#f6f1e8] border-t border-[#c7a96b]/35">
      <div className="max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.1fr_1fr_1fr_1.2fr] gap-14 lg:gap-10">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#c7a96b] mb-5">Welcome to New Orleans Tours</div>
          <h4 className="font-serif text-3xl font-medium leading-tight mb-5">A better way to choose your New Orleans experience.</h4>
          <p className="font-sans font-light leading-relaxed text-[#f6f1e8]/60 max-w-sm">Curated New Orleans experiences, timely local context, and concierge help when you want a hand choosing what fits your group.</p>
        </div>
        <div><h4 className="font-serif text-xl mb-6 text-[#e1c98f] font-medium">Explore</h4><nav className="flex flex-col gap-3.5 font-sans font-light text-sm text-[#f6f1e8]/70"><Link href="/tours">All Experiences</Link><Link href="/riverboat-cruises">River Cruises</Link><Link href="/ghost-tours">Ghosts & Cemetery</Link><Link href="/food-tours">Food & Cocktails</Link><Link href="/guides/things-to-do-in-new-orleans-today">Things To Do Today</Link><Link href="/guides/new-orleans-tours-tonight">Tonight</Link><Link href="/swamp-tours">Swamps & Airboats</Link><Link href="/plantation-tours">Plantation Experiences</Link></nav></div>
        <div><h4 className="font-serif text-xl mb-6 text-[#e1c98f] font-medium">Concierge</h4><nav className="flex flex-col gap-3.5 font-sans font-light text-sm text-[#f6f1e8]/70"><Link href="/help-me-choose">Help Me Choose</Link><Link href="/french-quarter-welcome-stop">Planning Help</Link><Link href="/guides/french-quarter-orientation">$5 French Quarter Orientation</Link><Link href="/guides/first-time-new-orleans-tours">First-Time Visitors</Link><Link href="/guides/new-orleans-tours-for-families">Families</Link><Link href="/guides/plan-new-orleans-tours">Plan By Need</Link></nav></div>
        <div><h4 className="font-serif text-xl mb-6 text-[#e1c98f] font-medium">Talk to a person</h4><p className="font-sans font-light text-sm leading-relaxed text-[#f6f1e8]/60 mb-7">Need help with timing, pickup options, group fit, or what makes sense right now? Call or text the Concierge Desk.</p><PhoneCta placement="WTONOT-FOOTER-PHONE" isGroup className="inline-flex flex-col gap-1.5 group"><span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c7a96b]">Call or text</span><span className="text-2xl font-medium text-[#f6f1e8]">504-484-9687</span></PhoneCta></div>
      </div>
      <FrenchQuarterBoothBonus variant="oneline" />
      <div className="border-t border-white/8 px-6 py-7 text-center text-[11px] font-sans font-light text-white/40"><nav className="mx-auto mb-4 flex max-w-5xl flex-wrap justify-center gap-x-5 gap-y-2" aria-label="Support and policy links">{supportLinks.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}</nav><div>&copy; {new Date().getFullYear()} Welcome to New Orleans Tours. All rights reserved.</div></div>
    </footer>
  );
}
