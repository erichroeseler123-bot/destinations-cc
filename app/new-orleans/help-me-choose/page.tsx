"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
import {
  CategoryId,
  PreferenceId,
  CHOOSER_CATEGORIES,
  getPreferencesForCategory,
  getRecommendation,
} from "./recommendationRules";
import { STOREFRONT_PRODUCTS } from "../tours/pageConfig";
import FareHarborBookingButton from "../components/FareHarborBookingButton";

function RecommendationCard({
  productId,
  isAlternative = false,
  explanation,
  categoryId,
  preferenceId,
}: {
  productId: string;
  isAlternative?: boolean;
  explanation?: string;
  categoryId: CategoryId;
  preferenceId?: PreferenceId | null;
}) {
  const product = STOREFRONT_PRODUCTS.find((p) => p.id === productId);
  if (!product) return null;

  const handleProductSelect = () => {
    const props: any = {
      surface: "new_orleans_chooser",
      category_id: categoryId,
      product_id: product.id,
    };
    if (preferenceId) {
      props.preference_id = preferenceId;
    }
    trackEvent("chooser_product_selected", props);
  };

  return (
    <div className={`border ${isAlternative ? 'border-[#2a2a2a]' : 'border-[#d4af37]'} bg-[#1a1a1a] p-6 rounded-sm mb-6 flex flex-col md:flex-row gap-6`}>
      <div className="md:w-1/3">
        <img
          src={product.imageUrl}
          alt={product.imageAlt || product.title}
          className="w-full h-48 md:h-full object-cover rounded-sm"
        />
      </div>
      <div className="md:w-2/3 flex flex-col">
        {!isAlternative && <h3 className="text-[#d4af37] text-[10px] uppercase tracking-widest font-bold mb-2">Recommended for you</h3>}
        {isAlternative && <h3 className="text-[#aaaaaa] text-[10px] uppercase tracking-widest font-bold mb-2">Alternative Option</h3>}
        <h4 className="font-serif text-2xl text-[#fdfbf7] mb-2">{product.title}</h4>
        <p className="text-[10px] font-bold text-[#aaaaaa] uppercase tracking-widest mb-4">
          Operated by {product.operatorName}
        </p>

        {explanation && !isAlternative && (
          <div className="mb-6">
            <h5 className="text-[#fdfbf7] text-sm font-bold mb-1">Why it fits</h5>
            <p className="text-sm text-[#aaaaaa] leading-relaxed">{explanation}</p>
          </div>
        )}

        <div className="mb-8">
          <ul className="text-sm text-[#aaaaaa] space-y-2">
            {product.transportationSummary && <li>• {product.transportationSummary}</li>}
            {product.durationLabel && <li>• {product.durationLabel}</li>}
          </ul>
        </div>

        <div className="mt-auto">
          <FareHarborBookingButton
            productTitle={product.title}
            productSlug={product.slug}
            shortname={product.companyShortname}
            itemId={product.itemId}
            flowId={product.flowId}
            asn="aktourcenter"
            refCode="chooser"
            fallbackHref={`/new-orleans/tours/${product.slug}`}
            placement="chooser_recommendation"
            className={`inline-block text-center border ${isAlternative ? 'border-[#2a2a2a] bg-[#1a1a1a] text-[#fdfbf7] hover:border-[#d4af37]' : 'border-[#d4af37] bg-[#d4af37] text-[#1a1a1a] hover:bg-transparent hover:text-[#d4af37]'} transition-colors font-bold py-3.5 px-8 text-xs uppercase tracking-widest rounded-sm`}
            onBookingClick={handleProductSelect}
          >
            {product.ctaLabel || "Book Now"}
          </FareHarborBookingButton>
        </div>
      </div>
    </div>
  );
}

export default function HelpMeChoosePage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [categoryId, setCategoryId] = useState<CategoryId | null>(null);
  const [preferenceId, setPreferenceId] = useState<PreferenceId | null>(null);

  useEffect(() => {
    trackEvent("chooser_started", { surface: "new_orleans_chooser" });
  }, []);

  const handleCategorySelect = (id: CategoryId) => {
    setCategoryId(id);
    trackEvent("chooser_category_selected", { surface: "new_orleans_chooser", category_id: id });
    const prefs = getPreferencesForCategory(id);
    const cat = CHOOSER_CATEGORIES.find((c) => c.id === id);
    if (cat?.skipPreferences || prefs.length === 0) {
      setStep(3);
      trackEvent("chooser_results_viewed", { surface: "new_orleans_chooser", category_id: id });
    } else {
      setStep(2);
    }
  };

  const handlePreferenceSelect = (id: PreferenceId) => {
    setPreferenceId(id);
    trackEvent("chooser_preferences_selected", { surface: "new_orleans_chooser", preference_id: id });
    setStep(3);
    trackEvent("chooser_results_viewed", { surface: "new_orleans_chooser", category_id: categoryId, preference_id: id });
  };

  const handleRestart = () => {
    setStep(1);
    setCategoryId(null);
    setPreferenceId(null);
  };

  const handleBack = () => {
    if (step === 3) {
      const cat = CHOOSER_CATEGORIES.find((c) => c.id === categoryId);
      const prefs = categoryId ? getPreferencesForCategory(categoryId) : [];
      if (cat?.skipPreferences || prefs.length === 0) {
        setStep(1);
        setCategoryId(null);
      } else {
        setStep(2);
        setPreferenceId(null);
      }
    } else if (step === 2) {
      setStep(1);
      setCategoryId(null);
    }
  };

  const currentCategory = CHOOSER_CATEGORIES.find((c) => c.id === categoryId);
  const preferences = categoryId ? getPreferencesForCategory(categoryId) : [];
  const recommendation = categoryId ? getRecommendation(categoryId, preferenceId || undefined) : null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#fdfbf7] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header / Nav */}
        <div className="flex justify-between items-center mb-12">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="text-[#aaaaaa] hover:text-[#d4af37] transition-colors text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 p-2 -ml-2 focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
              aria-label="Go back to previous step"
            >
              &larr; Back
            </button>
          ) : (
            <Link
              href="/new-orleans"
              className="text-[#aaaaaa] hover:text-[#d4af37] transition-colors text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 p-2 -ml-2 focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
            >
              &larr; Exit
            </Link>
          )}
          <button
            onClick={handleRestart}
            className="text-[#aaaaaa] hover:text-[#d4af37] transition-colors text-[10px] font-bold uppercase tracking-widest p-2 -mr-2 focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
            aria-label="Restart chooser"
          >
            Restart
          </button>
        </div>

        {/* Step 1: Category */}
        {step === 1 && (
          <div aria-live="polite">
            <h1 className="text-3xl md:text-5xl font-serif text-center mb-4">What sounds best?</h1>
            <p className="text-center text-[#aaaaaa] mb-12">Select an experience to get started.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {CHOOSER_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  aria-pressed={categoryId === cat.id}
                  className="relative h-48 overflow-hidden group border border-[#2a2a2a] hover:border-[#d4af37] transition-colors rounded-sm flex items-end p-6 focus:outline-none focus:ring-2 focus:ring-[#d4af37] w-full"
                >
                  <img
                    src={cat.image}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent"></div>
                  <div className="relative z-10 text-left w-full">
                    <h2 className="text-xl font-serif text-[#fdfbf7]">{cat.title}</h2>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Preferences */}
        {step === 2 && currentCategory && (
          <div aria-live="polite">
            <h1 className="text-3xl md:text-5xl font-serif text-center mb-4">Narrow it down</h1>
            <p className="text-center text-[#aaaaaa] mb-12">What kind of {currentCategory.title.toLowerCase()} experience are you looking for?</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {preferences.map((pref) => (
                <button
                  key={pref.id}
                  onClick={() => handlePreferenceSelect(pref.id)}
                  aria-pressed={preferenceId === pref.id}
                  className="border border-[#2a2a2a] hover:border-[#d4af37] bg-[#1a1a1a] p-8 text-center transition-colors rounded-sm focus:outline-none focus:ring-2 focus:ring-[#d4af37] w-full"
                >
                  <span className="text-lg text-[#fdfbf7] block">{pref.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Recommendation */}
        {step === 3 && recommendation && (
          <div aria-live="polite">
            {recommendation.fallbackMessage ? (
              <div className="text-center max-w-2xl mx-auto py-12 border border-[#2a2a2a] bg-[#1a1a1a] p-8 rounded-sm">
                <h1 className="text-3xl md:text-4xl font-serif mb-6 text-[#d4af37]">Coming Soon</h1>
                <p className="text-lg text-[#aaaaaa] mb-12 leading-relaxed">{recommendation.fallbackMessage}</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/new-orleans/tours"
                    className="border border-[#d4af37] bg-[#d4af37] text-[#1a1a1a] hover:bg-transparent hover:text-[#d4af37] transition-colors font-bold py-3.5 px-8 text-[10px] uppercase tracking-widest rounded-sm"
                  >
                    Explore Bookable Tours
                  </Link>
                  <Link
                    href="/contact"
                    className="border border-[#2a2a2a] bg-[#1a1a1a] text-[#fdfbf7] hover:border-[#d4af37] transition-colors font-bold py-3.5 px-8 text-[10px] uppercase tracking-widest rounded-sm"
                  >
                    Contact Us for Help
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-3xl md:text-5xl font-serif text-center mb-12">Here is our recommendation</h1>

                {recommendation.primaryProductId && (
                  <RecommendationCard
                    productId={recommendation.primaryProductId}
                    explanation={recommendation.explanation}
                    categoryId={categoryId as CategoryId}
                    preferenceId={preferenceId}
                  />
                )}

                {recommendation.alternativeProductIds && recommendation.alternativeProductIds.length > 0 && (
                  <div className="mt-16">
                    <h2 className="text-xl font-serif mb-6 text-center text-[#aaaaaa]">Also Consider</h2>
                    {recommendation.alternativeProductIds.map(id => (
                      <RecommendationCard
                        key={id}
                        productId={id}
                        isAlternative={true}
                        categoryId={categoryId as CategoryId}
                        preferenceId={preferenceId}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
