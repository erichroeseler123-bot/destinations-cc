"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
import { Pinyon_Script } from "next/font/google";
import {
  CategoryId,
  PreferenceId,
  CHOOSER_CATEGORIES,
  getPreferencesForCategory,
  getRecommendation,
} from "./recommendationRules";
import { STOREFRONT_PRODUCTS } from "../tours/pageConfig";
import FareHarborBookingButton from "../components/FareHarborBookingButton";
import styles from "./chooser.module.css";

const pinyonScript = Pinyon_Script({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

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
    <div className={styles.container}>
      <div className={styles.background}></div>
      <div className={styles.overlay}></div>

      <div className={styles.content}>
        {view !== "initial" && view !== "recommendation" && (
          <button onClick={handleBack} className={styles.backButton} aria-label="Go back to previous step">
            &larr; Back
          </button>
        )}

        {view === "initial" && (
          <div aria-live="polite" className="w-full flex flex-col items-center">
            <span className={styles.eyebrow}>Let's find your</span>
            <h1 className={styles.headline}>
              Perfect
              <span className={`${styles.scriptAccent} ${pinyonScript.className}`}>New Orleans</span>
              Adventure
            </h1>
            <p className={styles.supportingLine}>
              Answer a few quick questions and we'll point you toward the best tour for you and your group.
            </p>
            <p className={styles.prompt}>
              What kind of adventure are you after?
            </p>

            <div className={styles.choicesGrid}>
              <button
                onClick={() => handleInitialChoice("swamp")}
                className={`${styles.choiceCard} ${styles.cardSwamp}`}
              >
                <h2 className={styles.cardTitle}>THE SWAMP</h2>
                <p className={styles.cardCopy}>
                  Wild, untamed, and full of Louisiana character. Choose between a covered boat and an airboat.
                </p>
                <span className={styles.cardCta}>Take me to the swamp</span>
              </button>

              <button
                onClick={() => handleInitialChoice("city")}
                className={`${styles.choiceCard} ${styles.cardCity}`}
              >
                <h2 className={styles.cardTitle}>THE CITY</h2>
                <p className={styles.cardCopy}>
                  History, neighborhoods, architecture, stories, and the essential New Orleans overview.
                </p>
                <span className={styles.cardCta}>Show me the city</span>
              </button>

              <button
                onClick={() => handleInitialChoice("plantation")}
                className={`${styles.choiceCard} ${styles.cardPlantation}`}
              >
                <h2 className={styles.cardTitle}>THE PLANTATION</h2>
                <p className={styles.cardCopy}>
                  Historic homes, landscapes, and Louisiana history outside the city.
                </p>
                <span className={styles.cardCta}>Take me back</span>
              </button>

              <button
                onClick={() => handleInitialChoice("notsure")}
                className={`${styles.choiceCard} ${styles.cardNotSure}`}
              >
                <h2 className={styles.cardTitle}>NOT SURE?</h2>
                <p className={styles.cardCopy}>
                  No problem. Answer a few simple questions and we'll narrow it down together.
                </p>
                <span className={styles.cardCta}>Help me decide</span>
              </button>
            </div>
          </div>
        )}

        {view === "swamp-second" && (
          <div aria-live="polite" className="w-full flex flex-col items-center">
            <h1 className={styles.secondaryTitle}>How do you want to explore the swamp?</h1>
            <div className={`${styles.choicesGrid} max-w-[800px] mx-auto`}>
              <button
                onClick={() => handleSwampPreference("swamp-calm")}
                className={`${styles.choiceCard} ${styles.cardSwamp}`}
              >
                <h2 className={styles.cardTitle}>COVERED & CALMER</h2>
                <p className={styles.cardCopy}>
                  A relaxed, shaded boat ride suitable for all ages. Perfect for photography and taking it slow.
                </p>
                <span className={styles.cardCta}>Select</span>
              </button>
              <button
                onClick={() => handleSwampPreference("swamp-active")}
                className={`${styles.choiceCard} ${styles.cardSwamp}`}
              >
                <h2 className={styles.cardTitle}>FASTER & ACTIVE</h2>
                <p className={styles.cardCopy}>
                  An exhilarating airboat experience. Feel the wind and get up close to the wildlife.
                </p>
                <span className={styles.cardCta}>Select</span>
              </button>
            </div>
          </div>
        )}

        {view === "guided-categories" && (
          <div aria-live="polite" className="w-full flex flex-col items-center">
            <h1 className={styles.secondaryTitle}>What sounds best?</h1>
            <div className={styles.choicesGrid}>
              {CHOOSER_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleGuidedCategorySelect(cat.id)}
                  aria-pressed={categoryId === cat.id}
                  className={`${styles.choiceCard} ${styles.cardNotSure}`}
                >
                  <h2 className={styles.cardTitle}>{cat.title}</h2>
                  <p className={styles.cardCopy}>{cat.description}</p>
                  <span className={styles.cardCta}>Select</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {view === "guided-preferences" && currentCategory && (
          <div aria-live="polite" className="w-full flex flex-col items-center">
            <h1 className={styles.secondaryTitle}>Narrow it down</h1>
            <p className={styles.supportingLine}>What kind of {currentCategory.title.toLowerCase()} experience are you looking for?</p>
            <div className={`${styles.choicesGrid} max-w-[800px] mx-auto`}>
              {preferences.map((pref) => (
                <button
                  key={pref.id}
                  onClick={() => handleGuidedPreferenceSelect(pref.id)}
                  aria-pressed={preferenceId === pref.id}
                  className={`${styles.choiceCard} ${styles.cardNotSure}`}
                >
                  <h2 className={styles.cardTitle}>{pref.title}</h2>
                  <span className={styles.cardCta}>Select</span>
                </button>
              ))}
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
                    href="/new-orleans/tours"
                    className="border border-[#d4af37] bg-[#d4af37] text-[#1a1a1a] hover:bg-transparent hover:text-[#d4af37] transition-colors font-bold py-3.5 px-8 text-xs uppercase tracking-widest rounded-sm"
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
                    className="inline-block border border-[#d4af37] bg-[#d4af37] text-[#1a1a1a] hover:bg-transparent hover:text-[#d4af37] transition-colors font-bold py-4 px-10 text-sm uppercase tracking-widest rounded-sm"
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
      </div>
    </div>
  );
}
