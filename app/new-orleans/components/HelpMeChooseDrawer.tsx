'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import PhoneCta from './PhoneCta';
import styles from '../tours/outpost.module.css';

interface HelpMeChooseDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpMeChooseDrawer({ isOpen, onClose }: HelpMeChooseDrawerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add(styles.noScroll);
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleEsc);
      return () => {
        document.body.classList.remove(styles.noScroll);
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlayDrawer}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Help me choose a tour"
    >
      <div
        className={styles.drawerPanel}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-8 border-b border-[#2a2a2a] pb-6">
          <h2 className={`font-serif text-3xl font-bold ${styles.nolaBrass}`}>Help Me Choose</h2>
          <button
            onClick={onClose}
            className="text-3xl text-white/50 hover:text-white transition-colors"
            aria-label="Close drawer"
          >
            &times;
          </button>
        </div>

        <div className="flex flex-col flex-grow gap-8">
          <div>
            <h3 className="font-sans text-sm font-bold uppercase tracking-widest text-white/80 mb-4">
              What kind of experience?
            </h3>
            <div className="flex flex-col gap-2">
              <Link href="/city-tours" className={styles.nolaButtonOutline} onClick={onClose}>
                In The City
              </Link>
              <Link href="/swamp-tours" className={styles.nolaButtonOutline} onClick={onClose}>
                Out on the Swamp
              </Link>
              <Link href="/plantation-tours" className={styles.nolaButtonOutline} onClick={onClose}>
                Historic Plantations
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-sans text-sm font-bold uppercase tracking-widest text-white/80 mb-4">
              First Time Visitor?
            </h3>
            <Link href="/tours-for/first-time-visitors" className={styles.nolaButton} onClick={onClose}>
              View First-Timer Recommendations
            </Link>
          </div>

          <div className="mt-auto pt-8 border-t border-[#2a2a2a]">
            <p className="font-sans text-xs font-light text-white/60 mb-4 line-height-relaxed">
              Prefer to talk to someone local? Tell us your group size, what days you are in town, and if you prefer morning or afternoon.
            </p>
            <PhoneCta placement="WTONOT-DRAWER-PHONE" isGroup className="flex flex-col gap-2 group">
              <span className={`text-xs font-bold uppercase tracking-widest ${styles.nolaBrass}`}>
                Call for assistance
              </span>
              <span className="text-3xl font-bold text-white group-hover:text-white/80 transition-colors">
                504-484-9687
              </span>
            </PhoneCta>
          </div>
        </div>
      </div>
    </div>
  );
}
