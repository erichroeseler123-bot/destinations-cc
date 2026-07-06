"use client";

import { useState } from "react";
import Link from "next/link";
import { DIRECTORY_DATA, ListingNode } from "./pageConfig";
import WnoNetworkStrip from "@/components/WnoNetworkStrip";

const TOUR_IMAGES: Record<string, string> = {
  "steamboat-natchez": "/images/travel-markets/new-orleans/steamboat-natchez.jpg",
  "airboat-swamp": "/images/travel-markets/new-orleans/covered-boat-swamp.png",
  "airboat-adventure-large": "/images/travel-markets/new-orleans/airboat-swamp.png",
  "airboat-adventure-small": "/images/travel-markets/new-orleans/small-group-airboat.png",
  "ghost-cemetery": "/images/travel-markets/new-orleans/french-quarter-street.jpg",
  "food-cocktail": "/images/travel-markets/new-orleans/new-orleans-live-music.jpg",
  "free-tours-foot": "/images/travel-markets/new-orleans/french-quarter-street.jpg",
  "preservation-hall": "/images/travel-markets/new-orleans/new-orleans-live-music.jpg",
};

const CATEGORIES_MAP = [
  {
    id: "swamp",
    slug: "swamp-tours",
    title: "Swamp Tours",
    hook: "Covered pontoon boat bayou crawls, perfect for families and photography.",
    imageUrl: "/images/travel-markets/new-orleans/covered-boat-swamp.png",
    vessel: "Covered Pontoon Boat"
  },
  {
    id: "airboat",
    slug: "airboat-tours",
    title: "Airboat Tours",
    hook: "High-speed thrill rides through shallow marshes and gator nesting spots.",
    imageUrl: "/images/travel-markets/new-orleans/airboat-swamp.png",
    vessel: "Open-Air Airboat"
  },
  {
    id: "history",
    slug: "french-quarter-tours",
    title: "French Quarter Tours",
    hook: "Historical walks, architectural tours, and classic jazz history walks.",
    imageUrl: "/images/travel-markets/new-orleans/french-quarter-street.jpg",
    vessel: "Walking Excursion"
  },
  {
    id: "food",
    slug: "food-and-cocktail-tours",
    title: "Food & Cocktail Tours",
    hook: "Sample gumbo, jambalaya, and Sazerac cocktails in historic dining rooms.",
    imageUrl: "/images/travel-markets/new-orleans/new-orleans-live-music.jpg",
    vessel: "Culinary Walk"
  },
  {
    id: "ghost",
    slug: "ghost-and-cemetery-tours",
    title: "Ghost & Cemetery Tours",
    hook: "Nighttime candlelit walks through haunted gates and voodoo history.",
    imageUrl: "/images/travel-markets/new-orleans/french-quarter-street.jpg",
    vessel: "Walking Excursion"
  },
  {
    id: "cruise",
    slug: "riverboat-cruises",
    title: "Riverboat Cruises",
    hook: "Authentic paddlewheel steamboat rides with Dixieland jazz and river buffet.",
    imageUrl: "/images/travel-markets/new-orleans/steamboat-natchez.jpg",
    vessel: "Paddlewheel Steamboat"
  }
];

export default function NewOrleansToursStorefront() {
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
                Premium Sightseeing & Swamp Tours
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
      <header className="bg-slate-900 text-white py-16 md:py-24 px-6 relative overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_50%)]">
        <div className="max-w-6xl mx-auto grid md:grid-cols-12 gap-8 items-center relative z-10">
          <div className="md:col-span-7 space-y-6 text-left">
            <span className="inline-flex rounded-full bg-emerald-500/10 border border-emerald-400/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-emerald-400">
              New Orleans Tours & Experiences
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05]">
              New Orleans tours built for first-time visitors.
            </h2>
            <p className="text-base md:text-lg text-slate-300 font-medium leading-relaxed">
              Compare swamp tours, airboat rides, French Quarter walks, food and cocktail tours, ghost stories, cemetery tours, and riverboat cruises — with clear provider booking links.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <a href="#tours-grid" className="bg-emerald-600 text-white font-bold px-6 py-3 rounded-2xl hover:bg-emerald-500 transition shadow-lg text-sm">
                Browse New Orleans Tours
              </a>
              <a href="#categories-section" className="bg-white/10 text-white border border-white/20 font-bold px-6 py-3 rounded-2xl hover:bg-white/20 transition text-sm">
                Explore Tour Categories
              </a>
            </div>
          </div>
          <div className="md:col-span-5 relative group">
            <div className="absolute inset-0 bg-emerald-500/10 rounded-3xl blur-2xl group-hover:bg-emerald-500/20 transition" />
            <div className="relative rounded-3xl overflow-hidden aspect-[4/3] shadow-2xl border border-white/10">
              <img 
                src="/images/travel-markets/new-orleans/french-quarter-street.jpg" 
                alt="New Orleans French Quarter streetscape" 
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 text-left">
                <p className="text-xs font-bold text-white uppercase tracking-wider">Royal Street, French Quarter</p>
                <p className="text-[10px] text-slate-300">Verified storefront exit path active</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Category cards section */}
      <section id="categories-section" className="max-w-6xl mx-auto py-16 px-6">
        <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
          <h3 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Explore Tour Categories</h3>
          <p className="text-slate-500 text-sm">Select a category to read detailed timing guides or compare specific excursions.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES_MAP.map((cat) => (
            <div key={cat.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between text-left">
              {/* Card Image */}
              <div className="relative aspect-[16/10] w-full overflow-hidden">
                <img src={cat.imageUrl} alt={cat.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-slate-900/10" />
                <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  {cat.vessel}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h4 className="text-lg font-black text-slate-900">{cat.title}</h4>
                  <p className="text-slate-600 text-xs leading-relaxed">{cat.hook}</p>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                  <Link href={`/categories/${cat.slug}`} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-sm">
                    View Guide
                  </Link>
                  <button
                    onClick={() => {
                      setActiveCategory(cat.id);
                      document.getElementById("tours-grid")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 font-bold px-4 py-2 rounded-xl text-xs transition shadow-sm"
                  >
                    Compare Tours
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Decision Board (Trip-Fit Filter) */}
      <section id="decision-board" className="max-w-6xl mx-auto px-6 mb-12">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm text-left">
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
              <article key={item.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between hover:border-emerald-500/50 transition-colors text-left group">
                {/* Tour Card Image */}
                <div className="relative aspect-[16/9] w-full overflow-hidden">
                  <img
                    src={TOUR_IMAGES[item.id] || "/images/travel-markets/new-orleans/french-quarter-street.jpg"}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-slate-900/10" />
                </div>

                <div className="p-6 flex-grow flex flex-col justify-between">
                  <div>
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
                  </div>
                  
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
      <section className="max-w-6xl mx-auto px-6 mb-16 text-left">
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

      {/* DCC Network Verification Strip */}
      <div className="pt-10 max-w-6xl mx-auto px-6">
        <WnoNetworkStrip />
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6 border-t border-slate-800 text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm font-bold text-white mb-4 uppercase tracking-wider">
            ⚜️ Welcome To New Orleans Tours
          </p>
          <p className="text-xs leading-relaxed max-w-xl mx-auto font-medium">
            Bookings are handled in association with authorized Viator and local tour operator partners. Tour availability, pricing, and timing fluctuate seasonally depending on delta river conditions and festival calendars.
          </p>
          <div className="mt-6 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
            © 2026 Welcome To New Orleans Tours. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
}
