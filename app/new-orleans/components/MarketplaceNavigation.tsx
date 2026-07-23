'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import PhoneCta from './PhoneCta';
import styles from '../tours/outpost.module.css';

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
      <header className={`${styles.bgNolaCharcoal} ${styles.nolaIvory} border-b ${styles.nolaBorder} sticky top-0 z-40`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex flex-col">
            <span className={`font-serif text-2xl md:text-3xl font-bold tracking-tight ${styles.nolaBrass}`}>
              Welcome to
            </span>
            <span className="font-sans text-[10px] md:text-xs tracking-[0.2em] uppercase font-bold text-white/80">
              New Orleans Tours
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 font-sans font-bold text-sm tracking-widest uppercase">
            <Link href="/city-tours" className="hover:text-white transition-colors">City</Link>
            <Link href="/swamp-tours" className="hover:text-white transition-colors">Swamps</Link>
            <Link href="/plantation-tours" className="hover:text-white transition-colors">Plantations</Link>
            <Link href="/tours-for/first-time-visitors" className="hover:text-white transition-colors">Plan Your Trip</Link>
          </nav>

          <div className="hidden md:flex items-center gap-6">
            <PhoneCta placement="WTONOT-HEADER-PHONE" isGroup className="flex flex-col items-end group">
              <span className={`text-[10px] font-bold uppercase tracking-widest text-white/60 group-hover:text-white transition-colors`}>
                Questions or Groups?
              </span>
              <span className={`text-lg font-bold ${styles.nolaBrass} group-hover:text-white transition-colors`}>
                504-484-9687
              </span>
            </PhoneCta>
          </div>

          <button onClick={toggle} className="md:hidden flex flex-col gap-1.5 p-2" aria-label="Toggle menu">
            <div className={`w-6 h-0.5 ${styles.bgNolaBrass}`}></div>
            <div className={`w-6 h-0.5 ${styles.bgNolaBrass}`}></div>
            <div className={`w-6 h-0.5 ${styles.bgNolaBrass}`}></div>
          </button>
        </div>
      </header>

      {isOpen && (
        <div className={`md:hidden ${styles.overlayDrawer}`} onClick={toggle}>
          <div className={styles.drawerPanel} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-10">
              <span className={`font-serif text-2xl font-bold ${styles.nolaBrass}`}>Menu</span>
              <button onClick={toggle} className="text-2xl" aria-label="Close menu">&times;</button>
            </div>

            <nav className="flex flex-col gap-6 font-sans font-bold text-lg tracking-widest uppercase mb-10">
              <Link href="/city-tours" onClick={toggle}>City Tours</Link>
              <Link href="/swamp-tours" onClick={toggle}>Swamp Tours</Link>
              <Link href="/plantation-tours" onClick={toggle}>Plantations</Link>
              <Link href="/tours-for/first-time-visitors" onClick={toggle}>Plan Your Trip</Link>
            </nav>

            <div className="mt-auto pt-8 border-t border-white/10">
              <PhoneCta placement="WTONOT-HEADER-PHONE" isGroup className="flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-white/60">
                  Questions or Groups?
                </span>
                <span className={`text-2xl font-bold ${styles.nolaBrass}`}>
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
    <footer className={`${styles.bgNolaCharcoal} ${styles.nolaIvory} border-t-4 border-[#d4af37]`}>
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
        <div>
          <h4 className={`font-serif text-2xl mb-6 ${styles.nolaBrass}`}>Categories</h4>
          <nav className="flex flex-col gap-4 font-sans font-light text-white/80">
            <Link href="/city-tours" className="hover:text-white transition-colors">City Tours</Link>
            <Link href="/swamp-tours" className="hover:text-white transition-colors">Swamp Tours</Link>
            <Link href="/plantation-tours" className="hover:text-white transition-colors">Plantations</Link>
          </nav>
        </div>

        <div>
          <h4 className={`font-serif text-2xl mb-6 ${styles.nolaBrass}`}>Plan Your Trip</h4>
          <nav className="flex flex-col gap-4 font-sans font-light text-white/80">
            <Link href="/tours-for/first-time-visitors" className="hover:text-white transition-colors">First-Time Visitors</Link>
            <Link href="/areas/french-quarter" className="hover:text-white transition-colors">French Quarter Guides</Link>
          </nav>
        </div>

        <div>
          <h4 className={`font-serif text-2xl mb-6 ${styles.nolaBrass}`}>Planning Guides</h4>
          <nav className="flex flex-col gap-4 font-sans font-light text-white/80">
            <Link href="/guides/how-far-are-swamp-tours-from-new-orleans" className="hover:text-white transition-colors">Distance to Swamps</Link>
            <Link href="/guides/how-long-does-a-swamp-tour-take" className="hover:text-white transition-colors">Swamp Tour Duration</Link>
          </nav>
        </div>

        <div>
          <h4 className={`font-serif text-2xl mb-6 ${styles.nolaBrass}`}>Marketplace</h4>
          <div className="flex flex-col gap-4 font-sans font-light text-white/80 mb-8">
            <div>Independent Marketplace Disclosure</div>
            <div>Local Operator Responsibility</div>
            <div className="text-xs">
              <span className="font-bold">Image Credit:</span><br/>
              Photo by Miguel Discart, CC BY-SA 2.0 via Wikimedia Commons.
            </div>
          </div>

          <div className={`pt-8 border-t border-white/10`}>
            <PhoneCta placement="WTONOT-FOOTER-PHONE" isGroup className="flex flex-col gap-2 group">
              <span className={`text-[10px] font-bold uppercase tracking-widest ${styles.nolaBrass}`}>
                Tour Questions & Group Rates
              </span>
              <span className="text-xl font-bold text-white group-hover:text-white/80 transition-colors">
                504-484-9687
              </span>
            </PhoneCta>
          </div>
        </div>
      </div>
      <div className="bg-black/50 py-6 text-center text-xs font-sans font-light text-white/50">
        &copy; {new Date().getFullYear()} Welcome to New Orleans Tours. All rights reserved.
      </div>
    </footer>
  );
}
