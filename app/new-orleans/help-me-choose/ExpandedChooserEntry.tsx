"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CHOOSER_CATEGORIES,
  CategoryId,
  getPreferencesForCategory,
  getRecommendation,
  PreferenceId,
} from "./recommendationRules";
import { STOREFRONT_PRODUCTS } from "../tours/pageConfig";
import {
  buildAttributedTourHref,
  FAREHARBOR_SOURCES,
  isApprovedProductSlug,
} from "../lib/fareHarborAttribution";
import { trackEvent } from "@/lib/analytics";

export default function ExpandedChooserEntry() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const preferences = selectedCategory ? getPreferencesForCategory(selectedCategory) : [];

  const routeRecommendation = (categoryId: CategoryId, preferenceId?: PreferenceId) => {
    const recommendation = getRecommendation(categoryId, preferenceId);
    if (!recommendation.primaryProductId) return;

    const product = STOREFRONT_PRODUCTS.find((item) => item.id === recommendation.primaryProductId);
    if (!product) return;

    const contextId = preferenceId || categoryId;
    trackEvent("chooser_product_selected", {
      surface: "new_orleans_help_expanded_entry",
      category_id: categoryId,
      preference_id: preferenceId,
      product_id: product.id,
    });

    const href = isApprovedProductSlug(product.slug)
      ? buildAttributedTourHref(product.slug, FAREHARBOR_SOURCES.helpChooser, contextId)
      : `/tours/${product.slug}?recommended=${contextId}`;
    router.push(href);
  };

  const selectCategory = (categoryId: CategoryId) => {
    const category = CHOOSER_CATEGORIES.find((item) => item.id === categoryId);
    const categoryPreferences = getPreferencesForCategory(categoryId);
    trackEvent("chooser_category_selected", {
      surface: "new_orleans_help_expanded_entry",
      category_id: categoryId,
    });

    if (category?.skipPreferences || categoryPreferences.length === 0) {
      routeRecommendation(categoryId);
      return;
    }

    setSelectedCategory(categoryId);
  };

  const scrollToGuidedPlanner = () => {
    trackEvent("chooser_help_requested", { surface: "new_orleans_help_expanded_entry" });
    document.getElementById("guided-planner")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="bg-[#151515] text-[#fdfbf7] px-5 py-10 md:py-14 border-b border-[#2a2a2a]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <p className="text-[#d4af37] text-xs font-bold uppercase tracking-[0.25em] mb-3">Start with what sounds good</p>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">What do you feel like doing?</h1>
          <p className="text-[#b9b9b9] leading-relaxed">
            Pick an experience type and we’ll narrow it down. If you truly have no idea, use the guided planner below.
          </p>
        </div>

        {!selectedCategory ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CHOOSER_CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => selectCategory(category.id)}
                className="group relative min-h-[210px] overflow-hidden border border-[#333] bg-[#1b1b1b] text-left focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
              >
                <img
                  src={category.image}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover opacity-35 transition duration-300 group-hover:scale-105 group-hover:opacity-45"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/70 to-[#111]/20" />
                <div className="relative h-full min-h-[210px] p-5 flex flex-col justify-end">
                  <h2 className="text-xl font-bold mb-2">{category.title}</h2>
                  <p className="text-sm text-[#d7d7d7] leading-relaxed">{category.description}</p>
                  <span className="text-[#d4af37] text-xs font-bold uppercase tracking-wider mt-4">Choose this →</span>
                </div>
              </button>
            ))}

            <button
              type="button"
              onClick={scrollToGuidedPlanner}
              className="min-h-[210px] border border-[#d4af37] bg-[#201c14] p-5 text-left flex flex-col justify-end focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
            >
              <h2 className="text-xl font-bold mb-2">Not Sure</h2>
              <p className="text-sm text-[#d7d7d7] leading-relaxed">Tell us about your time, transportation, group and interests instead.</p>
              <span className="text-[#d4af37] text-xs font-bold uppercase tracking-wider mt-4">Help me decide ↓</span>
            </button>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto border border-[#333] bg-[#1b1b1b] p-6 md:p-8">
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className="text-[#d4af37] text-xs font-bold uppercase tracking-wider mb-6"
            >
              ← All experience types
            </button>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              {CHOOSER_CATEGORIES.find((item) => item.id === selectedCategory)?.title}
            </h2>
            <p className="text-[#b9b9b9] mb-6">Which version sounds more like your group?</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {preferences.map((preference) => (
                <button
                  key={preference.id}
                  type="button"
                  onClick={() => routeRecommendation(selectedCategory, preference.id)}
                  className="border border-[#444] bg-[#121212] hover:border-[#d4af37] p-5 text-left transition-colors"
                >
                  <span className="font-bold text-[#fdfbf7]">{preference.title}</span>
                  <span className="block text-[#d4af37] text-xs font-bold uppercase tracking-wider mt-3">Show my match →</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
