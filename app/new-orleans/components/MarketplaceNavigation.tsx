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
          <Link href="/" className={visualStyles.marketBrand} aria-label="New Orleans Concierge Desk">
            <span className={`${visualStyles.marketBrandWelcome} ${visualStyles.scriptFont}`}>New Orleans</span>{' '}
            <span className={`${visualStyles.marketBrandCity} ${visualStyles.accentFont}`}>Concierge</span>{' '}
            <span className={visualStyles.marketBrandTours}>Desk</span>
          </Link>
          <nav className={visualStyles.marketDesktopNav}>
            <Link href="/tours">Tours</Link><Link href="/help-me-choose">Help Me Choose</Link><Link href="/guides/french-quarter-orientation">$5 Orientation</Link><Link href="/compare">Compare</Link><Link href="/french-quarter-welcome-stop">Concierge</Link><Link href="/guides/visitor-rewards">Visitor Rewards</Link>
          </nav>
          <div className={visualStyles.marketPhoneWrap}><PhoneCta placement="WTONOT-HEADER-PHONE" isGroup className={visualStyles.marketPhone}><span className={visualStyles.marketPhoneLabel}>Questions? Call or text</span><span className={visualStyles.marketPhoneNumber}>504-484-9687</span></PhoneCta></div>
          <button onClick={toggle} className={visualStyles.marketMenuButton} aria-label="Toggle menu" aria-expanded={isOpen}><div className="w-6 h-0.5 bg-[#d4af37]"></div><div className="w-6 h-0.5 bg-[#d4af37]"></div><div className="w-6 h-0.5 bg-[#d4af37]"></div></button>
        </div>
      </header>
      {isOpen && <div className={`md:hidden ${styles.overlayDrawer}`} onClick={toggle}><div className={styles.drawerPanel} onClick={e => e.stopPropagation()}><div className="flex justify-between items-center mb-10"><span className="font-serif text-2xl font-bold text-[#d4af37]">Menu</span><button onClick={toggle} className="text-2xl text-[#d4af37]" aria-label="Close menu">&times;</button></div><nav className="flex flex-col gap-6 font-sans font-bold text-lg tracking-widest uppercase mb-10 text-[#fdfbf7]/80"><Link href="/tours" onClick={toggle}>Tours</Link><Link href="/help-me-choose" onClick={toggle}>Help Me Choose</Link><Link href="/guides/french-quarter-orientation" onClick={toggle}>$5 Orientation</Link><Link href="/compare" onClick={toggle}>Compare Tours</Link><Link href="/french-quarter-welcome-stop" onClick={toggle}>Concierge</Link><Link href="/guides/visitor-rewards" onClick={toggle}>Visitor Rewards</Link></nav><div className="mt-auto pt-8 border-t border-white/10"><PhoneCta placement="WTONOT-HEADER-PHONE" isGroup className="flex flex-col gap-2"><span className="text-xs font-bold uppercase tracking-widest text-[#fdfbf7]/60">Questions or Groups?</span><span className="text-2xl font-bold text-[#d4af37]">504-484-9687</span></PhoneCta></div></div></div>}
    </>
  );
}

export function FooterNav() {
  return (
    <footer className="bg-[#110e14] text-[#fdfbf7] border-t-4 border-[#d4af37]">
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
        <div><h4 className="font-serif text-2xl mb-6 text-[#d4af37]">Explore</h4><nav className="flex flex-col gap-4 font-sans font-light text-[#fdfbf7]/80"><Link href="/tours">All Tours</Link><Link href="/swamp-tours">Swamp Tours</Link><Link href="/plantation-tours">Plantations</Link><Link href="/compare">Compare Tours</Link></nav></div>
        <div><h4 className="font-serif text-2xl mb-6 text-[#d4af37]">Concierge Desk</h4><nav className="flex flex-col gap-4 font-sans font-light text-[#fdfbf7]/80"><Link href="/guides/french-quarter-orientation">$5 French Quarter Orientation</Link><Link href="/french-quarter-welcome-stop">Planning Help</Link><Link href="/guides/visitor-rewards">Visitor Rewards</Link><Link href="/tours-for/first-time-visitors">First-Time Visitors</Link></nav></div>
        <div><h4 className="font-serif text-2xl mb-6 text-[#d4af37]">Planning Guides</h4><nav className="flex flex-col gap-4 font-sans font-light text-[#fdfbf7]/80"><Link href="/guides/how-far-are-swamp-tours-from-new-orleans">Distance to Swamps</Link><Link href="/guides/how-long-does-a-swamp-tour-take">Swamp Tour Duration</Link><Link href="/areas/french-quarter">French Quarter Guides</Link></nav></div>
        <div><h4 className="font-serif text-2xl mb-6 text-[#d4af37]">About the Desk</h4><div className="flex flex-col gap-4 font-sans font-light text-[#fdfbf7]/80 mb-8"><div>New Orleans Concierge Desk is an independent visitor-help and tour recommendation site.</div><div>Participating tour operators control their own pricing, availability, pickup details, and cancellation policies.</div></div><div className="pt-8 border-t border-white/10"><PhoneCta placement="WTONOT-FOOTER-PHONE" isGroup className="flex flex-col gap-2 group"><span className="text-[10px] font-bold uppercase tracking-widest text-[#d4af37]">Questions & Group Help</span><span className="text-xl font-bold text-[#fdfbf7]">504-484-9687</span></PhoneCta></div></div>
      </div>
      <FrenchQuarterBoothBonus variant="oneline" />
      <div className="bg-black/50 px-6 py-6 text-center text-xs font-sans font-light text-white/50 mt-4"><nav className="mx-auto mb-4 flex max-w-5xl flex-wrap justify-center gap-x-4 gap-y-2" aria-label="Support and policy links">{supportLinks.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}</nav><div>&copy; {new Date().getFullYear()} New Orleans Concierge Desk. All rights reserved.</div></div>
    </footer>
  );
}
