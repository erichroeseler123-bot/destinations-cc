'use client';

import { useEffect, useState } from 'react';
import styles from './HelicopterArrival.module.css';

const SEEN_KEY = 'jfd-helicopter-arrival-seen';

/** Decorative, non-blocking arrival. A browser remembers it without an account. */
export default function HelicopterArrival() {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    try {
      if (localStorage.getItem(SEEN_KEY)) return;
    } catch {
      // If persistence is unavailable, skip instead of replaying every visit.
      return;
    }
    if (reducedMotion.matches) {
      try { localStorage.setItem(SEEN_KEY, '1'); } catch {}
      return;
    }
    const frame = requestAnimationFrame(() => {
      try { localStorage.setItem(SEEN_KEY, '1'); } catch { return; }
      setPlaying(true);
    });
    const timer = window.setTimeout(() => setPlaying(false), 2400);
    const stop = () => { if (reducedMotion.matches) setPlaying(false); };
    reducedMotion.addEventListener('change', stop);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      reducedMotion.removeEventListener('change', stop);
    };
  }, []);

  if (!playing) return null;

  return (
    <div className={styles.arrival} aria-hidden="true">
      <div className={styles.flight}>
        <div className={styles.rotor} />
        {/* Helicopter icon from Lucide, ISC licensed. */}
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 17v4" /><path d="M14 3v8a2 2 0 0 0 2 2h5.865" />
          <path d="M17 17v4" /><path d="M18 17a4 4 0 0 0 4-4 8 6 0 0 0-8-6 6 5 0 0 0-6 5v3a2 2 0 0 0 2 2z" />
          <path d="M2 10v5" /><path d="M6 3h16" /><path d="M7 21h14" /><path d="M8 13H2" />
        </svg>
        <span>JUNEAU FLIGHT DECK</span>
      </div>
    </div>
  );
}
