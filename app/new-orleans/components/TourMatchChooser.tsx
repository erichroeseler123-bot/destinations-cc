"use client";

import { useState } from "react";
import Link from "next/link";
import { PRODUCT_CLAIMS, VerifiedClaims } from "../data/verifiedClaims";
import { STOREFRONT_PRODUCTS } from "../tours/pageConfig";

export default function TourMatchChooser() {
  const [step, setStep] = useState(0);
  const [pace, setPace] = useState<VerifiedClaims["pace"] | null>(null);
  const [location, setLocation] = useState<VerifiedClaims["location"] | null>(null);

  const reset = () => {
    setStep(0);
    setPace(null);
    setLocation(null);
  };

  let matches = STOREFRONT_PRODUCTS.filter(product => {
    if (!pace && !location) return false;
    const claims = PRODUCT_CLAIMS[product.slug];
    if (!claims) return false;
    if (pace && claims.pace !== pace) return false;
    if (location && claims.location !== location) return false;
    return true;
  });

  if (matches.length === 0 && (pace || location)) {
    // deterministic fallback best match
    matches = STOREFRONT_PRODUCTS.filter(product => {
      const claims = PRODUCT_CLAIMS[product.slug];
      if (!claims) return false;
      return location ? claims.location === location : true;
    });
    // if still zero, fallback to the first one (City Tour)
    if (matches.length === 0) {
      matches = [STOREFRONT_PRODUCTS[0]];
    }
  }

  return (
    <div className="bg-[#1a1a1a] rounded-sm shadow-sm border border-[#2a2a2a] p-6 md:p-10 my-8 max-w-4xl mx-auto">
      <h2 className="text-3xl font-[var(--font-accent)] text-[#fdfbf7] mb-6">Tour Match Chooser</h2>
      
      {step === 0 && (
        <div>
          <p className="text-[#aaaaaa] mb-6 font-light text-lg">What pace of tour are you looking for?</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={() => { setPace("Relaxed"); setStep(1); }} className="px-6 py-4 bg-[#151515] border border-[#2a2a2a] hover:border-[#d4af37] rounded-sm font-bold text-[#fdfbf7] transition-colors uppercase tracking-widest text-sm">Relaxed & Easy</button>
            <button onClick={() => { setPace("Moderate"); setStep(1); }} className="px-6 py-4 bg-[#151515] border border-[#2a2a2a] hover:border-[#d4af37] rounded-sm font-bold text-[#fdfbf7] transition-colors uppercase tracking-widest text-sm">Moderate</button>
            <button onClick={() => { setPace("Thrilling"); setStep(1); }} className="px-6 py-4 bg-[#151515] border border-[#2a2a2a] hover:border-[#d4af37] rounded-sm font-bold text-[#fdfbf7] transition-colors uppercase tracking-widest text-sm">Fast & Thrilling</button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <p className="text-[#aaaaaa] mb-6 font-light text-lg">Which setting do you prefer?</p>
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <button onClick={() => { setLocation("City"); setStep(2); }} className="px-6 py-4 bg-[#151515] border border-[#2a2a2a] hover:border-[#d4af37] rounded-sm font-bold text-[#fdfbf7] transition-colors uppercase tracking-widest text-sm">City History & Culture</button>
            <button onClick={() => { setLocation("Plantation"); setStep(2); }} className="px-6 py-4 bg-[#151515] border border-[#2a2a2a] hover:border-[#d4af37] rounded-sm font-bold text-[#fdfbf7] transition-colors uppercase tracking-widest text-sm">Plantations</button>
            <button onClick={() => { setLocation("Swamp"); setStep(2); }} className="px-6 py-4 bg-[#151515] border border-[#2a2a2a] hover:border-[#d4af37] rounded-sm font-bold text-[#fdfbf7] transition-colors uppercase tracking-widest text-sm">Swamp & Nature</button>
          </div>
          <button onClick={reset} className="text-sm font-bold text-[#d4af37] uppercase tracking-widest hover:text-[#fdfbf7] transition-colors">Start Over</button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h3 className="text-xl font-[var(--font-accent)] text-[#d4af37] mb-6">Your Recommended Matches</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {matches.map(product => (
              <div key={product.slug} className="border border-[#2a2a2a] bg-[#101010] rounded-sm p-6 flex flex-col justify-between group hover:border-[#d4af37] transition-colors">
                <div>
                  <h4 className="font-[var(--font-accent)] text-2xl text-[#fdfbf7] mb-2 group-hover:text-[#d4af37] transition-colors">{product.title}</h4>
                  <p className="text-sm text-[#aaaaaa] mb-6 font-light line-clamp-3">{product.description}</p>
                </div>
                <Link href={`/tours/${product.slug}`} className="inline-block text-center px-6 py-3 border border-[#d4af37] text-[#d4af37] rounded-sm font-bold uppercase tracking-widest text-xs hover:bg-[#d4af37] hover:text-[#1a1a1a] transition-colors">
                  View Details
                </Link>
              </div>
            ))}
          </div>
          <button onClick={reset} className="text-sm font-bold text-[#d4af37] uppercase tracking-widest hover:text-[#fdfbf7] transition-colors">Start Over</button>
        </div>
      )}
    </div>
  );
}
