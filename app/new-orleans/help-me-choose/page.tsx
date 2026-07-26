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
import { NewOrleansHeroFrame, NewOrleansChoiceCard, DecorativeDivider } from "../components/NewOrleansVisual";
import visualStyles from "../components/newOrleansVisual.module.css";
import styles from "./chooser.module.css";

const SwampIllustration = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M10 50C15 48 20 49 25 47C30 45 35 48 40 47C45 46 50 48 55 46" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M15 48V25C15 20 25 15 32 15C39 15 49 20 49 25V47" stroke="currentColor" strokeWidth="2"/>
    <path d="M32 15V47" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4"/>
    <path d="M10 40C12 38 18 38 20 40" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M45 42C48 40 52 40 55 42" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="32" cy="30" r="5" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const CityIllustration = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M32 10L24 25H40L32 10Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <rect x="24" y="25" width="16" height="20" stroke="currentColor" strokeWidth="2"/>
    <path d="M28 25V45M36 25V45M24 35H40" stroke="currentColor" strokeWidth="2"/>
    <path d="M32 45V60M25 60H39" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M32 5L32 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const PlantationIllustration = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M8 55H56" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <rect x="20" y="35" width="24" height="20" stroke="currentColor" strokeWidth="2"/>
    <path d="M15 35L32 20L49 35" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <rect x="28" y="45" width="8" height="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 55V25C12 15 20 10 32 10C44 10 52 15 52 25V55" stroke="currentColor" strokeWidth="2" strokeDasharray="2 4"/>
  </svg>
);

const NotSureIllustration = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M20 15L32 35L44 15H20Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M32 35V55M22 55H42" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="38" cy="20" r="3" fill="currentColor"/>
    <path d="M25 20H40" stroke="currentColor" strokeWidth="1"/>
    <path d="M15 25C12 25 10 20 15 15C20 10 35 5 45 10C55 15 50 30 40 25" stroke="currentColor" strokeWidth="1" strokeDasharray="2 4"/>
  </svg>
);

export default function HelpMeChoosePage() {
  const [view, setView] = useState<"initial" | "swamp-second" | "guided-categories" | "guided-preferences" | "recommendation">("initial");

  const [categoryId, setCategoryId] = useState<CategoryId | null>(null);
  const [preferenceId, setPreferenceId] = useState<PreferenceId | null>(null);

  useEffect(() => {
    trackEvent("chooser_started", { surface: "new_orleans_chooser" });
  }, []);

  const handleInitialChoice = (choice: "swamp" | "city" | "plantation" | "notsure") => {
    if (choice === "swamp") {
      setCategoryId("swamp-airboat");
      trackEvent("chooser_category_selected", { surface: "new_orleans_chooser", category_id: "swamp-airboat" });
      setView("swamp-second");
    } else if (choice === "city") {
      setCategoryId("city-highlights");
      trackEvent("chooser_category_selected", { surface: "new_orleans_chooser", category_id: "city-highlights" });
      setView("recommendation");
      trackEvent("chooser_results_viewed", { surface: "new_orleans_chooser", category_id: "city-highlights" });
    } else if (choice === "plantation") {
      setCategoryId("plantations-history");
      trackEvent("chooser_category_selected", { surface: "new_orleans_chooser", category_id: "plantations-history" });
      setView("recommendation");
      trackEvent("chooser_results_viewed", { surface: "new_orleans_chooser", category_id: "plantations-history" });
    } else if (choice === "notsure") {
      setView("guided-categories");
    }
  };

  const handleSwampPreference = (pref: PreferenceId) => {
    setPreferenceId(pref);
    trackEvent("chooser_preferences_selected", { surface: "new_orleans_chooser", preference_id: pref });
    setView("recommendation");
    trackEvent("chooser_results_viewed", { surface: "new_orleans_chooser", category_id: "swamp-airboat", preference_id: pref });
  };

  const handleGuidedCategorySelect = (id: CategoryId) => {
    setCategoryId(id);
    trackEvent("chooser_category_selected", { surface: "new_orleans_chooser", category_id: id });
    const prefs = getPreferencesForCategory(id);
    const cat = CHOOSER_CATEGORIES.find((c) => c.id === id);
    if (cat?.skipPreferences || prefs.length === 0) {
      setView("recommendation");
      trackEvent("chooser_results_viewed", { surface: "new_orleans_chooser", category_id: id });
    } else {
      setView("guided-preferences");
    }
  };

  const handleGuidedPreferenceSelect = (id: PreferenceId) => {
    setPreferenceId(id);
    trackEvent("chooser_preferences_selected", { surface: "new_orleans_chooser", preference_id: id });
    setView("recommendation");
    trackEvent("chooser_results_viewed", { surface: "new_orleans_chooser", category_id: categoryId, preference_id: id });
  };

  const handleRestart = () => {
    setView("initial");
    setCategoryId(null);
    setPreferenceId(null);
  };

  const handleBack = () => {
    if (view === "swamp-second" || view === "guided-categories") {
      setView("initial");
      setCategoryId(null);
    } else if (view === "guided-preferences") {
      setView("guided-categories");
      setPreferenceId(null);
    }
  };

  const handleProductSelect = () => {
    if (!product || !categoryId) return;
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

  const currentCategory = CHOOSER_CATEGORIES.find((c) => c.id === categoryId);
  const preferences = categoryId ? getPreferencesForCategory(categoryId) : [];
  const recommendation = categoryId ? getRecommendation(categoryId, preferenceId || undefined) : null;
  const product = recommendation?.primaryProductId ? STOREFRONT_PRODUCTS.find((p) => p.id === recommendation.primaryProductId) : null;

  return (
    <NewOrleansHeroFrame>
      {view !== "initial" && view !== "recommendation" && (
        <button onClick={handleBack} className={styles.backButton} aria-label="Go back to previous step">
          &larr; Back
        </button>
      )}

      {view === "initial" && (
        <div aria-live="polite" className="w-full flex flex-col items-center">
          <h1 className={`${visualStyles.headline} ${visualStyles.displayFont}`}>
            LET’S FIND YOUR
            <span className={`${visualStyles.scriptAccent} ${visualStyles.scriptFont}`}>New Orleans</span>
            PERFECT ADVENTURE
          </h1>
          <DecorativeDivider />

          <div className={visualStyles.boardContainer}>
            <div className={visualStyles.promptBanner}>
              What kind of adventure are you after?
            </div>
            <div className={visualStyles.boardGrid}>
              <NewOrleansChoiceCard
                mode="action"
                onClick={() => handleInitialChoice("city")}
                iconType="city"
                illustration={<CityIllustration />}
                title="THE CITY"
                desc="History, neighborhoods, architecture, stories, and the essential New Orleans overview."
                cta="SHOW ME THE CITY"
              />
              <NewOrleansChoiceCard
                mode="action"
                onClick={() => handleInitialChoice("swamp")}
                iconType="swamp"
                illustration={<SwampIllustration />}
                title="THE SWAMP"
                desc="Wild, untamed, and full of Louisiana character. Choose between a covered boat and an airboat."
                cta="TAKE ME TO THE SWAMP"
              />
              <NewOrleansChoiceCard
                mode="action"
                onClick={() => handleInitialChoice("plantation")}
                iconType="plantation"
                illustration={<PlantationIllustration />}
                title="THE PLANTATION"
                desc="Historic homes, landscapes, and Louisiana history outside the city."
                cta="TAKE ME BACK"
              />
              <NewOrleansChoiceCard
                mode="action"
                onClick={() => handleInitialChoice("notsure")}
                iconType="notsure"
                illustration={<NotSureIllustration />}
                title="NOT SURE?"
                desc="No problem. Answer a few simple questions and we'll narrow it down together."
                cta="HELP ME DECIDE"
              />
            </div>
          </div>
        </div>
      )}

      {view === "swamp-second" && (
        <div aria-live="polite" className="w-full flex flex-col items-center">
          <h1 className={styles.secondaryTitle}>How do you want to explore the swamp?</h1>
          <div className={visualStyles.boardContainer}>
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-[800px] mx-auto`}>
              <NewOrleansChoiceCard
                mode="action"
                onClick={() => handleSwampPreference("swamp-calm")}
                iconType="swamp"
                illustration={<SwampIllustration />}
                title="COVERED & CALMER"
                desc="A relaxed, shaded boat ride suitable for all ages. Perfect for photography and taking it slow."
                cta="SELECT"
              />
              <NewOrleansChoiceCard
                mode="action"
                onClick={() => handleSwampPreference("swamp-active")}
                iconType="swamp"
                illustration={<SwampIllustration />}
                title="FASTER & ACTIVE"
                desc="An exhilarating airboat experience. Feel the wind and get up close to the wildlife."
                cta="SELECT"
              />
            </div>
          </div>
        </div>
      )}

      {view === "guided-categories" && (
        <div aria-live="polite" className="w-full flex flex-col items-center">
          <h1 className={styles.secondaryTitle}>What sounds best?</h1>
          <div className={visualStyles.boardContainer}>
            <div className={visualStyles.boardGrid}>
              {CHOOSER_CATEGORIES.map((cat, i) => (
                <NewOrleansChoiceCard
                  key={cat.id}
                  mode="action"
                  onClick={() => handleGuidedCategorySelect(cat.id)}
                  isActive={categoryId === cat.id}
                  iconType="notsure"
                  illustration={<NotSureIllustration />}
                  title={cat.title.toUpperCase()}
                  desc={cat.description}
                  cta="SELECT"
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {view === "guided-preferences" && currentCategory && (
        <div aria-live="polite" className="w-full flex flex-col items-center">
          <h1 className={styles.secondaryTitle}>Narrow it down</h1>
          <p className={styles.supportingLine}>What kind of {currentCategory.title.toLowerCase()} experience are you looking for?</p>
          <div className={visualStyles.boardContainer}>
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-[800px] mx-auto`}>
              {preferences.map((pref, i) => (
                <NewOrleansChoiceCard
                  key={pref.id}
                  mode="action"
                  onClick={() => handleGuidedPreferenceSelect(pref.id)}
                  isActive={preferenceId === pref.id}
                  iconType="notsure"
                  illustration={<NotSureIllustration />}
                  title={pref.title.toUpperCase()}
                  desc=""
                  cta="SELECT"
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {view === "recommendation" && recommendation && (
        <div aria-live="polite" className="w-full flex flex-col items-center">
          {recommendation.fallbackMessage || !product ? (
            <div className={styles.matchContainer}>
              <span className={styles.matchLabel}>Coming Soon</span>
              <h1 className={styles.matchTitle}>More Options on the Way</h1>
              <p className={styles.matchReason}>{recommendation.fallbackMessage || "This category guide is being prepared."}</p>
              <div className={styles.matchControls}>
                <Link
                  href="/tours"
                  className={`${visualStyles.buttonPrimary} ${visualStyles.sansFont}`}
                >
                  Explore Bookable Tours
                </Link>
                <button onClick={handleRestart} className="text-[#aaaaaa] hover:text-[#d4af37] transition-colors text-xs font-bold uppercase tracking-widest mt-4">
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.matchContainer}>
              <span className={styles.matchLabel}>Your New Orleans Match</span>
              <h1 className={styles.matchTitle}>{product.title}</h1>
              <p className={styles.matchReason}>{recommendation.explanation}</p>
              <div className={styles.matchControls}>
                <FareHarborBookingButton
                  productTitle={product.title}
                  productSlug={product.slug}
                  shortname={product.companyShortname}
                  itemId={product.itemId}
                  flowId={product.flowId}
                  asn="aktourcenter"
                  refCode="chooser"
                  fallbackHref={`/tours/${product.slug}`}
                  placement="chooser_recommendation"
                  className={`${visualStyles.buttonPrimary} ${visualStyles.sansFont}`}
                  onBookingClick={handleProductSelect}
                >
                  View This Tour
                </FareHarborBookingButton>
                <button onClick={handleRestart} className="text-[#aaaaaa] hover:text-[#d4af37] transition-colors text-xs font-bold uppercase tracking-widest mt-4">
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </NewOrleansHeroFrame>
  );
}
