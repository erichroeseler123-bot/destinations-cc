'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import PhoneCta from './PhoneCta';
import FrenchQuarterBoothBonus from './FrenchQuarterBoothBonus';
import styles from '../tours/outpost.module.css';
import visualStyles from './newOrleansVisual.module.css';

export function HeaderNav() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add(styles.noScroll);
    } else {
      document.body.classList.remove(styles.noScroll);
    }
    return () => document.body.classList.remove(styles.noScroll);
  }, [isOpen]);

  const toggle = () => setIsOpen(!isOpen);

  return (
    <>
      <header className={visualStyles.marketHeader}>
        <div className={visualStyles.marketHeaderInner}>
          <Link href="/" className={visualStyles.marketBrand}>
            <span className={`${visualStyles.marketBrandWelcome} ${visualStyles.scriptFont}`}>
              Welcome to
            </span>
            <span className={`${visualStyles.marketBrandCity} ${visualStyles.accentFont}`}>
              New Orleans
            </span>
            <span className={visualStyles.marketBrandTours}>
              Tours
            </span>
          </Link>

          <nav className={visualStyles.marketDesktopNav}>
            <Link href="/city-tours">City Tours</Link>
            <Link href="/swamp-tours">Swamp Tours</Link>
            <Link href="/plantation-tours">Plantation Tours</Link>
            <Link href="/tours-for/first-time-visitors">Plan Your Trip</Link>
          </nav>

          <div className={visualStyles.marketPhoneWrap}>
            <PhoneCta placement="WTONOT-HEADER-PHONE" isGroup className={visualStyles.marketPhone}>
              <span className={visualStyles.marketPhoneLabel}>
                Questions? Call or text
              </span>
              <span className={visualStyles.marketPhoneNumber}>
                <span aria-hidden="true">☎</span> 504-484-9687
              </span>
            </PhoneCta>
          </div>

          <button
            onClick={toggle}
            className={visualStyles.marketMenuButton}
            aria-label="Toggle menu"
            aria-expanded={isOpen}
          >
            <div className={`w-6 h-0.5 bg-[#d4af37]`}></div>
            <div className={`w-6 h-0.5 bg-[#d4af37]`}></div>
            <div className={`w-6 h-0.5 bg-[#d4af37]`}></div>
          </button>
        </div>
      </header>

      {isOpen && (
        <div className={`md:hidden ${styles.overlayDrawer}`} onClick={toggle}>
          <div className={styles.drawerPanel} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-10">
              <span className={`font-serif text-2xl font-bold text-[#d4af37]`}>Menu</span>
              <button onClick={toggle} className="text-2xl text-[#d4af37]" aria-label="Close menu">&times;</button>
            </div>

            <nav className="flex flex-col gap-6 font-sans font-bold text-lg tracking-widest uppercase mb-10 text-[#fdfbf7]/80">
              <Link href="/city-tours" onClick={toggle} className="hover:text-[#d4af37]">City Tours</Link>
              <Link href="/swamp-tours" onClick={toggle} className="hover:text-[#d4af37]">Swamp Tours</Link>
              <Link href="/plantation-tours" onClick={toggle} className="hover:text-[#d4af37]">Plantations</Link>
              <Link href="/tours-for/first-time-visitors" onClick={toggle} className="hover:text-[#d4af37]">Plan Your Trip</Link>
            </nav>

            <div className="mt-auto pt-8 border-t border-white/10">
              <PhoneCta placement="WTONOT-HEADER-PHONE" isGroup className="flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[#fdfbf7]/60">
                  Questions or Groups?
                </span>
                <span className={`text-2xl font-bold text-[#d4af37]`}>
                  504-484-9687
                </span>
              </PhoneCta>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function FooterNav() {
  return (
    <footer className={`bg-[#110e14] text-[#fdfbf7] border-t-4 border-[#d4af37]`}>
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
        <div>
          <h4 className={`font-serif text-2xl mb-6 text-[#d4af37]`}>Categories</h4>
          <nav className="flex flex-col gap-4 font-sans font-light text-[#fdfbf7]/80">
            <Link href="/city-tours" className="hover:text-[#d4af37] transition-colors">City Tours</Link>
            <Link href="/swamp-tours" className="hover:text-[#d4af37] transition-colors">Swamp Tours</Link>
            <Link href="/plantation-tours" className="hover:text-[#d4af37] transition-colors">Plantations</Link>
          </nav>
        </div>

        <div>
          <h4 className={`font-serif text-2xl mb-6 text-[#d4af37]`}>Plan Your Trip</h4>
          <nav className="flex flex-col gap-4 font-sans font-light text-[#fdfbf7]/80">
            <Link href="/tours-for/first-time-visitors" className="hover:text-[#d4af37] transition-colors">First-Time Visitors</Link>
            <Link href="/areas/french-quarter" className="hover:text-[#d4af37] transition-colors">French Quarter Guides</Link>
          </nav>
        </div>

        <div>
          <h4 className={`font-serif text-2xl mb-6 text-[#d4af37]`}>Planning Guides</h4>
          <nav className="flex flex-col gap-4 font-sans font-light text-[#fdfbf7]/80">
            <Link href="/guides/how-far-are-swamp-tours-from-new-orleans" className="hover:text-[#d4af37] transition-colors">Distance to Swamps</Link>
            <Link href="/guides/how-long-does-a-swamp-tour-take" className="hover:text-[#d4af37] transition-colors">Swamp Tour Duration</Link>
          </nav>
        </div>

        <div>
          <h4 className={`font-serif text-2xl mb-6 text-[#d4af37]`}>Marketplace</h4>
          <div className="flex flex-col gap-4 font-sans font-light text-[#fdfbf7]/80 mb-8">
            <div>Independent Marketplace Disclosure</div>
            <div>Local Operator Responsibility</div>
            <div className="text-xs">
              <span className="font-bold">Image Credit:</span><br/>
              Photo by Miguel Discart, CC BY-SA 2.0 via Wikimedia Commons.
            </div>
          </div>

          <div className={`pt-8 border-t border-white/10`}>
            <PhoneCta placement="WTONOT-FOOTER-PHONE" isGroup className="flex flex-col gap-2 group">
              <span className={`text-[10px] font-bold uppercase tracking-widest text-[#d4af37]`}>
                Tour Questions & Group Rates
              </span>
              <span className="text-xl font-bold text-[#fdfbf7] group-hover:text-[#fdfbf7]/80 transition-colors">
                504-484-9687
              </span>
            </PhoneCta>
          </div>
        </div>
      </div>
      <FrenchQuarterBoothBonus variant="oneline" />
      <div className="bg-black/50 py-6 text-center text-xs font-sans font-light text-white/50 mt-4">
        &copy; {new Date().getFullYear()} Welcome to New Orleans Tours. All rights reserved.
      </div>
    </footer>
  );
}
