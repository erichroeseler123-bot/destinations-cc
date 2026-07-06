"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DIRECTORY_DATA, ListingNode } from "./pageConfig";

export default function NewOrleansStorefront() {
  // Filters state
  const [selectedVessel, setSelectedVessel] = useState<string>("all"); // all, land, boat
  const [selectedPickup, setSelectedPickup] = useState<string>("all"); // all, pickup, meet
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<string>("all"); // all, morning, afternoon, evening
  const [selectedIntensity, setSelectedIntensity] = useState<string>("all"); // all, low, moderate

  const [activeCategory, setActiveCategory] = useState<string>("all");

  // NOLA categories definition
  const CATEGORIES = [
    { id: "all", label: "All Tours", slug: "tours", icon: "⚜️" },
    { id: "swamp", label: "Swamp Tours", slug: "swamp-tours", icon: "🐊" },
    { id: "airboat", label: "Airboat Runs", slug: "airboat-tours", icon: "🚤" },
    { id: "history", label: "French Quarter Walks", slug: "french-quarter-tours", icon: "⛪" },
    { id: "food", label: "Food & Cocktail Crawls", slug: "food-and-cocktail-tours", icon: "🍹" },
    { id: "ghost", label: "Ghost & Cemetery Tours", slug: "ghost-and-cemetery-tours", icon: "👻" },
    { id: "cruise", label: "Mississippi Cruises", slug: "riverboat-cruises", icon: "🚢" },
  ];

  // Helper to determine filters
  const filteredListings = DIRECTORY_DATA.filter((item) => {
    // 1. Category check
    if (activeCategory !== "all") {
      if (activeCategory === "airboat") {
        if (item.category !== "swamp" || !item.name.toLowerCase().includes("airboat")) return false;
      } else if (activeCategory === "swamp") {
        if (item.category !== "swamp" || item.name.toLowerCase().includes("airboat")) return false;
      } else {
        if (item.category !== activeCategory) return false;
      }
    }

    // 2. Filter out essentials or guides that aren't public tours
    if (item.category === "essentials" || item.category === "living-here" || item.category === "incubator") {
      return false;
    }

    // 3. Vessel / Location type check
    if (selectedVessel === "boat") {
      if (item.category !== "swamp" && item.category !== "cruise") return false;
    }
    if (selectedVessel === "land") {
      if (item.category === "swamp" || item.category === "cruise") return false;
    }

    // 4. Hotel pickup check
    if (selectedPickup === "pickup") {
      if (item.logistics["Hotel Pickup"] !== "Yes") return false;
    }
    if (selectedPickup === "meet") {
      if (item.logistics["Hotel Pickup"] === "Yes") return false;
    }

    // 5. Time of day check
    if (selectedTimeOfDay === "morning") {
      if (item.hours.open >= 12) return false;
    }
    if (selectedTimeOfDay === "afternoon") {
      if (item.hours.open < 11 || item.hours.open >= 16) return false;
    }
    if (selectedTimeOfDay === "evening") {
      if (item.hours.open < 16) return false;
    }

    // 6. Intensity / Walking check
    if (selectedIntensity === "low") {
      if (item.logistics["Walking"] && !item.logistics["Walking"].includes("leisurely")) return false;
      if (item.category === "history" || item.category === "ghost") return false; // walking intensive
    }
    if (selectedIntensity === "moderate") {
      if (item.category !== "history" && item.category !== "ghost" && item.category !== "food") return false;
    }

    return true;
  });

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 font-sans">
      
      {/* Brand Header */}
      <header className="border-b border-slate-200 bg-white py-4 px-6 shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚜️</span>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none uppercase">
                Welcome To New Orleans Tours
              </h1>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                Public Tour Storefront & Guide
              </span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
            <button onClick={() => { setActiveCategory("swamp"); }} className="hover:text-emerald-600 transition-colors">Swamps</button>
            <button onClick={() => { setActiveCategory("history"); }} className="hover:text-emerald-600 transition-colors">French Quarter</button>
            <button onClick={() => { setActiveCategory("food"); }} className="hover:text-emerald-600 transition-colors">Food & Drink</button>
            <button onClick={() => { setActiveCategory("cruise"); }} className="hover:text-emerald-600 transition-colors">River Cruises</button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-900 to-slate-950 text-white py-16 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-white uppercase">
            New Orleans tours that fit your trip.
          </h2>
          <p className="mt-6 text-lg text-emerald-100 max-w-2xl mx-auto leading-relaxed">
            Compare swamp tours, French Quarter walks, food tours, river cruises, and more with clear timing and booking links.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a 
              href="#decision-board" 
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-xl transition-colors text-sm uppercase tracking-wider"
            >
              Start with a tour type
            </a>
            <a 
              href="#tours-grid" 
              className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 rounded-xl transition-colors border border-white/20 text-sm uppercase tracking-wider"
            >
              Browse tours
            </a>
            <button 
              onClick={() => {
                setActiveCategory("swamp");
                document.getElementById("tours-grid")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="bg-emerald-500/25 hover:bg-emerald-500/40 text-emerald-300 font-bold py-3 px-6 rounded-xl transition-colors text-sm uppercase tracking-wider"
            >
              Find swamp tours
            </button>
          </div>
        </div>
      </section>

      {/* Category Links Grid */}
      <section className="max-w-6xl mx-auto py-12 px-6">
        <h3 className="text-xl font-extrabold text-slate-900 uppercase tracking-wider mb-6 text-center">
          Explore Tour Types
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                document.getElementById("tours-grid")?.scrollIntoView({ behavior: "smooth" });
              }}
              className={`p-4 rounded-2xl border text-center transition-all ${
                activeCategory === cat.id 
                  ? "border-emerald-600 bg-emerald-50/50 shadow-sm" 
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <span className="block text-3xl mb-2">{cat.icon}</span>
              <span className="block text-xs font-bold text-slate-700 leading-tight">{cat.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Decision Board (Trip-Fit Filter) */}
      <section id="decision-board" className="max-w-6xl mx-auto px-6 mb-12">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
            ⚜️ Tour Decision Helper
          </h3>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            
            {/* Vessel Type */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Water vs Land</label>
              <div className="flex gap-2">
                <button 
                  onClick={() => setSelectedVessel("all")} 
                  className={`flex-1 text-xs font-bold py-2 rounded-xl transition-all ${selectedVessel === "all" ? "bg-slate-900 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
                >
                  All
                </button>
                <button 
                  onClick={() => setSelectedVessel("boat")} 
                  className={`flex-1 text-xs font-bold py-2 rounded-xl transition-all ${selectedVessel === "boat" ? "bg-slate-900 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
                >
                  Boat
                </button>
                <button 
                  onClick={() => setSelectedVessel("land")} 
                  className={`flex-1 text-xs font-bold py-2 rounded-xl transition-all ${selectedVessel === "land" ? "bg-slate-900 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
                >
                  Land
                </button>
              </div>
            </div>

            {/* Hotel Pickup */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Hotel Pickup</label>
              <div className="flex gap-2">
                <button 
                  onClick={() => setSelectedPickup("all")} 
                  className={`flex-1 text-xs font-bold py-2 rounded-xl transition-all ${selectedPickup === "all" ? "bg-slate-900 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
                >
                  All
                </button>
                <button 
                  onClick={() => setSelectedPickup("pickup")} 
                  className={`flex-1 text-xs font-bold py-2 rounded-xl transition-all ${selectedPickup === "pickup" ? "bg-slate-900 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
                >
                  Shuttle
                </button>
                <button 
                  onClick={() => setSelectedPickup("meet")} 
                  className={`flex-1 text-xs font-bold py-2 rounded-xl transition-all ${selectedPickup === "meet" ? "bg-slate-900 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
                >
                  Meet there
                </button>
              </div>
            </div>

            {/* Time of Day */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Departure Window</label>
              <div className="flex gap-1.5">
                <button 
                  onClick={() => setSelectedTimeOfDay("all")} 
                  className={`flex-1 text-xs font-bold py-2 rounded-xl transition-all ${selectedTimeOfDay === "all" ? "bg-slate-900 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
                >
                  Any
                </button>
                <button 
                  onClick={() => setSelectedTimeOfDay("morning")} 
                  className={`flex-1 text-[10px] font-bold py-2 rounded-xl transition-all ${selectedTimeOfDay === "morning" ? "bg-slate-900 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
                >
                  Morning
                </button>
                <button 
                  onClick={() => setSelectedTimeOfDay("afternoon")} 
                  className={`flex-1 text-[10px] font-bold py-2 rounded-xl transition-all ${selectedTimeOfDay === "afternoon" ? "bg-slate-900 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
                >
                  PM
                </button>
                <button 
                  onClick={() => setSelectedTimeOfDay("evening")} 
                  className={`flex-1 text-[10px] font-bold py-2 rounded-xl transition-all ${selectedTimeOfDay === "evening" ? "bg-slate-900 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
                >
                  Night
                </button>
              </div>
            </div>

            {/* Walking Intensity */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Walking Level</label>
              <div className="flex gap-2">
                <button 
                  onClick={() => setSelectedIntensity("all")} 
                  className={`flex-1 text-xs font-bold py-2 rounded-xl transition-all ${selectedIntensity === "all" ? "bg-slate-900 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
                >
                  All
                </button>
                <button 
                  onClick={() => setSelectedIntensity("low")} 
                  className={`flex-1 text-xs font-bold py-2 rounded-xl transition-all ${selectedIntensity === "low" ? "bg-slate-900 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
                >
                  Light / Boat
                </button>
                <button 
                  onClick={() => setSelectedIntensity("moderate")} 
                  className={`flex-1 text-xs font-bold py-2 rounded-xl transition-all ${selectedIntensity === "moderate" ? "bg-slate-900 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
                >
                  Walking
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Tours Grid */}
      <section id="tours-grid" className="max-w-6xl mx-auto px-6 mb-16">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-black text-slate-900">
            {activeCategory === "all" ? "Live New Orleans Excursions" : CATEGORIES.find(c => c.id === activeCategory)?.label}
          </h3>
          <span className="text-xs font-bold text-slate-400 bg-slate-200/50 px-2.5 py-1 rounded-lg">
            {filteredListings.length} matching tours
          </span>
        </div>

        {filteredListings.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredListings.map((item) => (
              <article key={item.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between hover:border-emerald-500/50 transition-colors">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      {item.price ? `${item.price}` : "Book Excursion"}
                    </span>
                    {item.rating && (
                      <span className="text-xs font-bold text-slate-500">
                        ★ {item.rating} ({item.reviewsCount} reviews)
                      </span>
                    )}
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 mb-2">{item.name}</h4>
                  <p className="text-xs text-slate-400 font-bold mb-4 uppercase tracking-wider">{item.vibe}</p>
                  
                  <div className="border-t border-slate-100 pt-4 space-y-2 text-xs text-slate-600">
                    {item.logistics["Duration"] && (
                      <div className="flex justify-between">
                        <span className="font-medium text-slate-400">Duration:</span>
                        <span>{item.logistics["Duration"]}</span>
                      </div>
                    )}
                    {item.logistics["Hotel Pickup"] && (
                      <div className="flex justify-between">
                        <span className="font-medium text-slate-400">Hotel Pickup:</span>
                        <span>{item.logistics["Hotel Pickup"]}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-400">Location:</span>
                      <span>{item.location}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                  <a 
                    href={item.menuUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="block w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors uppercase tracking-wider"
                  >
                    Book Tour →
                  </a>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
            <span className="text-4xl block mb-4">🐊</span>
            <h4 className="text-lg font-bold text-slate-900 mb-2">No matching tours found</h4>
            <p className="text-sm text-slate-500 mb-6">Try resetting some filters (like Hotel Pickup or Walking Level) to view more New Orleans excursions.</p>
            <button 
              onClick={() => {
                setSelectedVessel("all");
                setSelectedPickup("all");
                setSelectedTimeOfDay("all");
                setSelectedIntensity("all");
                setActiveCategory("all");
              }}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-6 rounded-xl text-xs transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </section>

      {/* Guide / Decision Layer Links */}
      <section className="max-w-6xl mx-auto px-6 mb-16">
        <h3 className="text-xl font-extrabold text-slate-900 uppercase tracking-wider mb-6 text-center">
          New Orleans Excursion Guides
        </h3>
        <div className="grid gap-6 sm:grid-cols-2">
          
          {/* Guide 1 */}
          <article className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm">
            <div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-2">Excursion Advice</span>
              <h4 className="text-lg font-bold text-slate-900 mb-2">How to Choose the Best New Orleans Swamp Tour</h4>
              <p className="text-sm text-slate-500 leading-relaxed">
                Compare covered pontoon cruises with high-speed airboats. Learn what fits your travel group, family, or physical needs.
              </p>
            </div>
            <div className="mt-6">
              <Link 
                href="/guides/best-new-orleans-swamp-tour" 
                className="inline-flex items-center text-sm font-bold text-emerald-600 hover:text-emerald-700"
              >
                Read Swamp Tour Guide →
              </Link>
            </div>
          </article>

          {/* Guide 2 */}
          <article className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm">
            <div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-2">Timing Advice</span>
              <h4 className="text-lg font-bold text-slate-900 mb-2">French Quarter Tour Timing Guide</h4>
              <p className="text-sm text-slate-500 leading-relaxed">
                Timing walks, food tours, ghost legends, and river cruises block-by-block. Avoid the heavy heat and align with daylight profiles.
              </p>
            </div>
            <div className="mt-6">
              <Link 
                href="/guides/french-quarter-tour-timing" 
                className="inline-flex items-center text-sm font-bold text-emerald-600 hover:text-emerald-700"
              >
                Read Timing Guide →
              </Link>
            </div>
          </article>

        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6 border-t border-slate-800 text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm font-bold text-white mb-4 uppercase tracking-wider">
            ⚜️ Welcome To New Orleans Tours
          </p>
          <p className="text-xs leading-relaxed max-w-xl mx-auto">
            Bookings are handled in association with authorized Viator and local tour operator partners. Tour availability, pricing, and timing fluctuate seasonally depending on delta river conditions and festival calendars.
          </p>
          <div className="mt-6 text-[10px] text-slate-500 uppercase tracking-wider">
            © 2026 Welcome To New Orleans Tours. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
}
