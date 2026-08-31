'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import PhoneCta from './PhoneCta';
import styles from '../tours/outpost.module.css';
import visualStyles from './newOrleansVisual.module.css';
import footerStyles from './marketplaceFooter.module.css';

const usefulLinks = [
  { href: "/guides", label: "Planning Guides" },
  { href: "/guides/things-to-do-in-new-orleans-today", label: "Things To Do Today" },
  { href: "/guides/tonight", label: "Tonight" },
  { href: "/faq", label: "FAQ" },
  { href: "/booking-help", label: "Booking Help" },
  { href: "/about", label: "About" },
];

const policyLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/cancellation-policy", label: "Cancellation" },
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
        <div className={`${visualStyles.marketHeaderInner} relative`}>
          <Link href="/" className={visualStyles.marketBrand} aria-label="Welcome to New Orleans Tours">
            <span className={`${visualStyles.marketBrandWelcome} ${visualStyles.scriptFont}`}>Welcome to</span>{' '}
            <span className={`${visualStyles.marketBrandCity} ${visualStyles.accentFont}`}>New Orleans</span>{' '}
            <span className={visualStyles.marketBrandTours}>Tours</span>
          </Link>
          <nav className={visualStyles.marketDesktopNav}>
            <Link href="/tours">Tours</Link>
            <Link href="/help-me-choose">Help Me Choose</Link>
            <Link href="/guides/things-to-do-in-new-orleans-today">Today</Link>
            <Link href="/guides/tonight">Tonight</Link>
            <Link href="/compare">Compare</Link>
          </nav>
          <div className={visualStyles.marketPhoneWrap}>
            <PhoneCta placement="WTONOT-HEADER-PHONE" isGroup className={visualStyles.marketPhone}>
              <span className={visualStyles.marketPhoneLabel}>Call or text</span>
              <span className={visualStyles.marketPhoneNumber}>504-484-9687</span>
            </PhoneCta>
          </div>
          <PhoneCta placement="WTONOT-HEADER-PHONE-MOBILE" isGroup className="md:hidden absolute right-14 top-1/2 -translate-y-1/2 flex flex-col items-end leading-none text-[#fdfbf7]">
            <span className="text-[8px] font-bold uppercase tracking-[0.08em] text-[#fdfbf7]/70">Call or text</span>
            <span className="mt-1 text-[11px] font-black tracking-[0.02em] text-[#e3a72f]">504-484-9687</span>
          </PhoneCta>
          <button onClick={toggle} className={visualStyles.marketMenuButton} aria-label="Toggle menu" aria-expanded={isOpen}>
            <div className="w-6 h-px bg-[#c7a96b]"></div>
            <div className="w-6 h-px bg-[#c7a96b]"></div>
            <div className="w-6 h-px bg-[#c7a96b]"></div>
          </button>
        </div>
      </header>
      {isOpen && <div className={`md:hidden ${styles.overlayDrawer}`} onClick={toggle}><div className={styles.drawerPanel} onClick={e => e.stopPropagation()}><div className="flex justify-between items-center mb-10"><span className="font-serif text-2xl font-medium text-[#c7a96b]">Menu</span><button onClick={toggle} className="text-2xl text-[#c7a96b]" aria-label="Close menu">&times;</button></div><nav className="flex flex-col gap-6 font-sans font-semibold text-base tracking-[0.12em] uppercase mb-10 text-[#fdfbf7]/80"><Link href="/tours" onClick={toggle}>Tours</Link><Link href="/help-me-choose" onClick={toggle}>Help Me Choose</Link><Link href="/guides/things-to-do-in-new-orleans-today" onClick={toggle}>Today</Link><Link href="/guides/tonight" onClick={toggle}>Tonight</Link><Link href="/compare" onClick={toggle}>Compare</Link><Link href="/guides/plan-new-orleans-tours" onClick={toggle}>Plan By Need</Link></nav><div className="mt-auto pt-8 border-t border-white/10"><PhoneCta placement="WTONOT-HEADER-PHONE" isGroup className="flex flex-col gap-2"><span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#fdfbf7]/50">Questions or groups</span><span className="text-2xl font-medium text-[#c7a96b]">504-484-9687</span></PhoneCta></div></div></div>}
    </>
  );
}

export function FooterNav() {
  return (
    <footer className={footerStyles.footer}>
      <div className={footerStyles.inner}>
        <div>
          <p className={footerStyles.brandKicker}>Welcome to New Orleans Tours</p>
          <h4 className={footerStyles.brandTitle}>A better way to choose your New Orleans experience.</h4>
          <p className={footerStyles.brandCopy}>Curated experiences, timely local context, and personal planning help when you want a hand deciding what fits.</p>
        </div>

        <div>
          <p className={footerStyles.label}>More information</p>
          <nav className={footerStyles.links} aria-label="Visitor information links">
            {usefulLinks.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
          </nav>
        </div>

        <div>
          <p className={footerStyles.label}>Need help?</p>
          <PhoneCta placement="WTONOT-FOOTER-PHONE" isGroup className={footerStyles.phone}>
            <small>Call or text</small>
            <strong>504-484-9687</strong>
          </PhoneCta>
          <nav className={footerStyles.contactLinks} aria-label="Planning help links">
            <Link href="/help-me-choose">Help Me Choose</Link>
            <Link href="/compare">Compare Tours</Link>
          </nav>
        </div>
      </div>

      <div className={footerStyles.bottom}>
        <nav className={footerStyles.policyNav} aria-label="Support and policy links">
          {policyLinks.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
        </nav>
        <div className={footerStyles.copyright}>&copy; {new Date().getFullYear()} Welcome to New Orleans Tours. All rights reserved.</div>
      </div>
    </footer>
  );
}
