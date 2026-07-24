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
    <div className="bg-white rounded-lg shadow-sm border border-[#e5e5e5] p-6 my-8">
      <h2 className="text-2xl font-[var(--font-heading)] text-[#1a1a1a] mb-4">Tour Match Chooser</h2>
      
      {step === 0 && (
        <div>
          <p className="text-[#4a4a4a] mb-6">What pace of tour are you looking for?</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={() => { setPace("Relaxed"); setStep(1); }} className="px-6 py-3 bg-[#f5f5f5] hover:bg-[#e0e0e0] rounded-md font-semibold text-[#1a1a1a] transition-colors">Relaxed & Easy</button>
            <button onClick={() => { setPace("Moderate"); setStep(1); }} className="px-6 py-3 bg-[#f5f5f5] hover:bg-[#e0e0e0] rounded-md font-semibold text-[#1a1a1a] transition-colors">Moderate</button>
            <button onClick={() => { setPace("Thrilling"); setStep(1); }} className="px-6 py-3 bg-[#f5f5f5] hover:bg-[#e0e0e0] rounded-md font-semibold text-[#1a1a1a] transition-colors">Fast & Thrilling</button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <p className="text-[#4a4a4a] mb-6">Which setting do you prefer?</p>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <button onClick={() => { setLocation("City"); setStep(2); }} className="px-6 py-3 bg-[#f5f5f5] hover:bg-[#e0e0e0] rounded-md font-semibold text-[#1a1a1a] transition-colors">City History & Culture</button>
            <button onClick={() => { setLocation("Plantation"); setStep(2); }} className="px-6 py-3 bg-[#f5f5f5] hover:bg-[#e0e0e0] rounded-md font-semibold text-[#1a1a1a] transition-colors">Plantations</button>
            <button onClick={() => { setLocation("Swamp"); setStep(2); }} className="px-6 py-3 bg-[#f5f5f5] hover:bg-[#e0e0e0] rounded-md font-semibold text-[#1a1a1a] transition-colors">Swamp & Nature</button>
          </div>
          <button onClick={reset} className="text-sm text-[#0066cc] hover:underline">Start Over</button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h3 className="text-xl font-[var(--font-heading)] text-[#1a1a1a] mb-4">Your Recommended Matches</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {matches.map(product => (
              <div key={product.slug} className="border border-[#e5e5e5] rounded-md p-4 flex flex-col justify-between">
                <div>
                  <h4 className="font-semibold text-[#1a1a1a] mb-2">{product.title}</h4>
                  <p className="text-sm text-[#4a4a4a] mb-4">{product.description}</p>
                </div>
                <Link href={`/tours/${product.slug}`} className="inline-block text-center px-4 py-2 bg-[#d9381e] text-white rounded-md font-semibold hover:bg-[#b02c17] transition-colors">
                  View Details
                </Link>
              </div>
            ))}
          </div>
          <button onClick={reset} className="text-sm text-[#0066cc] hover:underline">Start Over</button>
        </div>
      )}
    </div>
  );
}
