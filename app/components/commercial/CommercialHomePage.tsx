"use client";

import { useState } from "react";
import Link from "next/link";
import WidgetConfigurator from "@/app/components/widget/WidgetConfigurator";

export default function CommercialHomePage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const [email, setEmail] = useState("");
  const [domain, setDomain] = useState("");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleCheckout = async (plan: string) => {
    setLoadingPlan(plan);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          email: email || "customer@example.com",
          domain: domain || "",
        }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert("Checkout initialization failed. Please try again.");
      }
    } catch {
      alert("Error starting checkout. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#06090e] text-white selection:bg-cyan-500 selection:text-black">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#06090e]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center font-black text-black text-sm shadow-lg shadow-cyan-500/20">
              DCC
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-white block text-sm sm:text-base leading-tight">
                Destination Command Center
              </span>
              <span className="text-[10px] text-cyan-400 tracking-wider uppercase font-semibold block">
                Venue & Coordinate Intelligence
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-white/70">
            <a href="#widget-demo" className="hover:text-cyan-300 transition">Interactive Widget</a>
            <a href="#products" className="hover:text-cyan-300 transition">Products</a>
            <a href="#case-studies" className="hover:text-cyan-300 transition">Live Case Studies</a>
            <a href="#api" className="hover:text-cyan-300 transition">Developers & API</a>
            <a href="#pricing" className="hover:text-cyan-300 transition">Pricing</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/pricing"
              className="text-xs font-semibold text-white/80 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition hidden sm:inline-block"
            >
              Customer Portal
            </Link>
            <a
              href="#pricing"
              className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-cyan-400 to-emerald-400 text-black shadow-lg shadow-cyan-500/20 hover:brightness-110 transition"
            >
              Get Started
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-16 pb-20 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 mb-6">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>Commercial Launch • Real-time Venue & Logistics Intelligence</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight max-w-5xl mx-auto leading-[1.08]">
          Turn Any Coordinate on Earth into a{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
            Live Weather & Logistics Experience
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-xl text-white/70 max-w-3xl mx-auto leading-relaxed">
          Cut inbound guest inquiries about rain, high winds, road delays, and water flow by up to 80%.
          Embed our zero-code interactive widget on your website in 60 seconds, or integrate directly with our high-speed Coordinate Intelligence API.
        </p>

        {/* Action CTAs */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#widget-demo"
            className="px-8 py-4 rounded-xl font-black text-sm uppercase tracking-wider bg-gradient-to-r from-cyan-400 to-emerald-400 text-black shadow-xl shadow-cyan-500/25 hover:brightness-110 transition flex items-center gap-2"
          >
            <span>Live Interactive Preview</span>
            <span>↓</span>
          </a>
          <a
            href="#pricing"
            className="px-8 py-4 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/15 text-white border border-white/15 transition backdrop-blur-md"
          >
            View Pricing ($39/mo or $349/yr)
          </a>
        </div>

        {/* Feature Badges */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
            <div className="text-cyan-400 text-xs font-black uppercase tracking-wider">Sub-50ms</div>
            <div className="text-white font-bold text-sm mt-1">Edge Cached Speed</div>
            <div className="text-white/50 text-xs mt-0.5">Instant guest load times</div>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
            <div className="text-emerald-400 text-xs font-black uppercase tracking-wider">100% Whitelabel</div>
            <div className="text-white font-bold text-sm mt-1">Your Brand Only</div>
            <div className="text-white/50 text-xs mt-0.5">Remove all DCC attribution</div>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
            <div className="text-sky-400 text-xs font-black uppercase tracking-wider">Official Feeds</div>
            <div className="text-white font-bold text-sm mt-1">NOAA & NWS Verified</div>
            <div className="text-white/50 text-xs mt-0.5">Real-time alerts & gauges</div>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
            <div className="text-amber-400 text-xs font-black uppercase tracking-wider">60-Sec Setup</div>
            <div className="text-white font-bold text-sm mt-1">Zero Coding Required</div>
            <div className="text-white/50 text-xs mt-0.5">WordPress, Squarespace & Wix</div>
          </div>
        </div>
      </section>

      {/* SECTION: Live Interactive Widget Configurator */}
      <section id="widget-demo" className="py-16 px-4 sm:px-6 lg:px-8 border-t border-white/10 bg-gradient-to-b from-black/40 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-black uppercase tracking-widest text-cyan-400">
              Interactive Product Demo
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mt-2">
              See the Widget in Action
            </h2>
            <p className="mt-3 text-sm sm:text-base text-white/70">
              Select one of our live venue presets below, or enter your own venue address or coordinates to see the exact widget your guests will experience.
            </p>
          </div>

          <div className="bg-[#0b1019] border border-white/15 rounded-3xl p-4 sm:p-8 shadow-2xl shadow-cyan-950/20">
            <WidgetConfigurator />
          </div>
        </div>
      </section>

      {/* SECTION: The Two Core Products */}
      <section id="products" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
            Two High-Value Products
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white mt-2">
            Built for Venues, Tour Operators & Developers
          </h2>
          <p className="mt-3 text-sm sm:text-base text-white/70">
            Whether you want an instant embeddable widget or programmatic machine intelligence for your booking funnel, DCC delivers.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* PRODUCT 1: The Venue Widget */}
          <div className="border border-cyan-500/30 bg-gradient-to-br from-cyan-950/20 to-black/60 rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -z-10" />
            <div>
              <div className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-cyan-400/10 text-cyan-300 border border-cyan-400/25 mb-4">
                Product 1 • Instant Website Embed
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                Live Venue Intelligence Widget
              </h3>
              <p className="text-sm text-white/70 mt-3 leading-relaxed">
                The single embeddable snippet that gives guests real-time peace of mind before they arrive. Perfect for amphitheaters, ski resorts, rafting outfits, and outdoor excursion operators.
              </p>

              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-2.5 text-xs text-white/80">
                  <span className="text-cyan-400 font-bold">✓</span>
                  <span><strong>100% Whitelabel:</strong> Hide DCC branding with active venue license</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-white/80">
                  <span className="text-cyan-400 font-bold">✓</span>
                  <span><strong>Domain-Locked Protection:</strong> Authorized exclusively for your website</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-white/80">
                  <span className="text-cyan-400 font-bold">✓</span>
                  <span><strong>NOAA River Gauges & USGS Water:</strong> Live cfs flow rates and stage heights</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-white/80">
                  <span className="text-cyan-400 font-bold">✓</span>
                  <span><strong>NWS Weather Alerts:</strong> Automated severe weather, flood, and high-wind banners</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-white/80">
                  <span className="text-cyan-400 font-bold">✓</span>
                  <span><strong>Universal CMS Support:</strong> Works on WordPress, Squarespace, Wix, Shopify</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
              <div>
                <span className="text-3xl font-black text-white">$39</span>
                <span className="text-xs text-white/60"> / month</span>
                <span className="block text-[11px] text-cyan-400 font-bold">or $349/year (Save 25%)</span>
              </div>
              <a
                href="#pricing"
                className="px-6 py-3 rounded-xl bg-cyan-400 text-black font-black text-xs uppercase tracking-wider hover:bg-cyan-300 transition shadow-lg shadow-cyan-400/20"
              >
                Get Venue License →
              </a>
            </div>
          </div>

          {/* PRODUCT 2: The Coordinate API */}
          <div className="border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 to-black/60 rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -z-10" />
            <div>
              <div className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-400/10 text-emerald-300 border border-emerald-400/25 mb-4">
                Product 2 • Programmatic Machine API
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                Coordinate Intelligence API
              </h3>
              <p className="text-sm text-white/70 mt-3 leading-relaxed">
                A single unified JSON endpoint (<code className="text-emerald-300 font-mono text-xs">/api/location/[lat]/[lng]</code>) providing multi-source environmental, weather, hazard, and transit data for any coordinate on Earth.
              </p>

              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-2.5 text-xs text-white/80">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Unified Telemetry:</strong> Weather, radar, air quality, tides, and river flow</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-white/80">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Machine-Readable JSON:</strong> OpenAPI 3.1 & Agent Contract specifications</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-white/80">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>High-Concurrency SLA:</strong> 50,000 monthly requests with &lt;50ms response times</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-white/80">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>AI Agent Ready:</strong> Built-in <code className="font-mono text-[11px]">llms.txt</code> and structured JSON schemas</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-white/80">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Source Timestamps:</strong> Guaranteed provenance and staleness indicators</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
              <div>
                <span className="text-3xl font-black text-white">$99</span>
                <span className="text-xs text-white/60"> / month</span>
                <span className="block text-[11px] text-emerald-400 font-bold">50,000 req/mo included</span>
              </div>
              <a
                href="#pricing"
                className="px-6 py-3 rounded-xl bg-emerald-400 text-black font-black text-xs uppercase tracking-wider hover:bg-emerald-300 transition shadow-lg shadow-emerald-400/20"
              >
                Get API Access →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: Proven Case Studies & Demonstrations */}
      <section id="case-studies" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/10 bg-black/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-sky-400">
              Live Network Case Studies
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mt-2">
              Proven in the Wild Across High-Traffic Tourism Hubs
            </h2>
            <p className="mt-3 text-sm sm:text-base text-white/70">
              Destination Command Center powers real visitor decision intelligence for major concert amphitheaters, river tubing basins, and cruise flightseeing hubs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Case Study 1: Red Rocks */}
            <div className="bg-[#0b1019] border border-white/10 rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-black uppercase tracking-wider text-rose-400">
                  Outdoor Amphitheatre
                </div>
                <h4 className="text-xl font-bold text-white mt-1">Red Rocks Amphitheatre</h4>
                <div className="text-xs text-white/50">Morrison, CO (Elev. 6,450 ft)</div>
                <p className="mt-4 text-xs text-white/70 leading-relaxed">
                  Concertgoers face sudden alpine thunderstorms, lightning delays, and mountain freeze warnings. DCC delivers hourly wind speed gusts, precipitation curves, and shuttle schedules.
                </p>
                <div className="mt-4 p-3 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-white/60">
                  <strong>Measured Impact:</strong> 74% reduction in pre-show weather inquiries; over 12,000 active concertgoers guided per weekend.
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">● Live Active Demo</span>
                <Link
                  href="/embed/v1/39.6654/-105.2057?name=Red+Rocks+Amphitheatre"
                  target="_blank"
                  className="text-xs font-bold text-cyan-300 hover:underline"
                >
                  View Widget →
                </Link>
              </div>
            </div>

            {/* Case Study 2: Somerset */}
            <div className="bg-[#0b1019] border border-white/10 rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-black uppercase tracking-wider text-cyan-400">
                  River Basin & Concerts
                </div>
                <h4 className="text-xl font-bold text-white mt-1">Somerset Amphitheater & Apple River</h4>
                <div className="text-xs text-white/50">Somerset, WI (Apple River Flow)</div>
                <p className="mt-4 text-xs text-white/70 leading-relaxed">
                  Tubers and concertgoers need to know water temperature, river cfs discharge, and rain likelihood before heading out on multi-hour float trips.
                </p>
                <div className="mt-4 p-3 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-white/60">
                  <strong>Measured Impact:</strong> Live USGS gauge integration displays exact discharge in cfs, eliminating unsafe high-water launches.
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">● Live Active Demo</span>
                <Link
                  href="/embed/v1/45.1275/-92.6763?name=Somerset+Amphitheater"
                  target="_blank"
                  className="text-xs font-bold text-cyan-300 hover:underline"
                >
                  View Widget →
                </Link>
              </div>
            </div>

            {/* Case Study 3: Juneau Flight Deck */}
            <div className="bg-[#0b1019] border border-white/10 rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                  Cruise Excursion Hub
                </div>
                <h4 className="text-xl font-bold text-white mt-1">Juneau Flight Deck & Glacier Tours</h4>
                <div className="text-xs text-white/50">Juneau, AK (Mendenhall Icefield)</div>
                <p className="mt-4 text-xs text-white/70 leading-relaxed">
                  Cruisers with strict all-aboard times compare helicopter dog-sledding and glacier treks. Rapid coastal fog and wind determine whether helicopters can fly.
                </p>
                <div className="mt-4 p-3 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-white/60">
                  <strong>Measured Impact:</strong> Dynamic port-docking timing and mountain cloud-ceiling warnings give guests the confidence to book advance excursions.
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">● Live Active Demo</span>
                <Link
                  href="/embed/v1/58.2989/-134.4053?name=Juneau+Cruise+Port"
                  target="_blank"
                  className="text-xs font-bold text-cyan-300 hover:underline"
                >
                  View Widget →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: Developer & API */}
      <section id="api" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
              Developer Ecosystem
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
              One REST API for Complete Coordinate Intelligence
            </h2>
            <p className="text-sm sm:text-base text-white/70 leading-relaxed">
              Stop stitching together separate APIs for weather forecasts, NWS alerts, USGS river gauges, and earthquake data.
              Pass latitude and longitude to DCC, and receive normalized, real-time telemetry in milliseconds.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-xs text-white/80">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">1</span>
                <span>Fully documented OpenAPI 3.1 & JSON Schema specifications</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-white/80">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">2</span>
                <span>Optimized for LLM function calling and autonomous agent workflows</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-white/80">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">3</span>
                <span>Source timestamps, gauge IDs, and distance calculations on every field</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-4">
              <Link
                href="/developers"
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 transition"
              >
                Developer Guide →
              </Link>
              <a
                href="/openapi.json"
                target="_blank"
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 transition"
              >
                OpenAPI Spec
              </a>
              <a
                href="/agent.json"
                target="_blank"
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 transition"
              >
                Agent Contract
              </a>
            </div>
          </div>

          <div className="lg:col-span-6 bg-black/80 border border-white/15 rounded-3xl p-6 font-mono text-xs shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4 text-white/40">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-[11px]">GET /api/location/[lat]/[lng]</span>
            </div>

            <pre className="text-emerald-300/90 overflow-x-auto text-[11px] leading-relaxed">
{`curl -X GET "https://destinationcommandcenter.com/api/location/39.6654/-105.2057" \\
  -H "Authorization: Bearer dcc_live_your_key_here"

{
  "location": {
    "lat": 39.6654,
    "lng": -105.2057,
    "elevationMeters": 1966,
    "name": "Red Rocks Amphitheatre, CO"
  },
  "weather": {
    "tempF": 68,
    "conditions": "Clear",
    "windMph": 7,
    "gustMph": 14,
    "updatedAt": "2026-10-04T00:30:00Z"
  },
  "hazards": {
    "activeAlertsCount": 0,
    "source": "NWS",
    "timestamp": "2026-10-04T00:35:12Z"
  },
  "water": {
    "gaugeId": "USGS-06719505",
    "riverName": "Clear Creek at Golden, CO",
    "dischargeCfs": 142.5,
    "distanceMiles": 4.8
  }
}`}
            </pre>
          </div>
        </div>
      </section>

      {/* SECTION: Commercial Pricing & Direct Purchase */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/10 bg-gradient-to-b from-black/60 to-[#06090e]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-black uppercase tracking-widest text-cyan-400">
              Transparent Access & Licensing
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mt-2">
              Simple, Predictable Pricing
            </h2>
            <p className="mt-3 text-sm sm:text-base text-white/70">
              Start with the live venue widget or build directly on the coordinate API. 14-day money-back guarantee on all plans.
            </p>

            {/* Quick Capture Input */}
            <div className="mt-8 max-w-xl mx-auto bg-white/[0.04] border border-white/15 rounded-2xl p-3 flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address…"
                className="flex-1 bg-black/50 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-cyan-400"
              />
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="Venue website (e.g. venue.com)"
                className="flex-1 bg-black/50 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Monthly / Annual Toggle */}
            <div className="mt-6 inline-flex items-center gap-2 bg-black/60 p-1.5 rounded-2xl border border-white/15">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                  billingCycle === "monthly" ? "bg-white/20 text-white" : "text-white/50 hover:text-white"
                }`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("annual")}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
                  billingCycle === "annual" ? "bg-cyan-400 text-black shadow-lg shadow-cyan-400/25" : "text-white/50 hover:text-white"
                }`}
              >
                <span>Annual Pass</span>
                <span className="bg-black/30 text-black text-[10px] px-1.5 py-0.5 rounded-full font-black uppercase">
                  Save 25%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* PLAN 1: Venue Widget Monthly / Annual */}
            <div className="border border-cyan-500/40 bg-gradient-to-b from-cyan-950/30 to-black/60 rounded-3xl p-8 flex flex-col justify-between relative shadow-xl shadow-cyan-950/20">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-400 text-black">
                Most Popular for Venues
              </div>
              <div>
                <div className="text-sm font-bold text-cyan-400 uppercase tracking-wider">Venue Pass</div>
                <h3 className="text-2xl font-black text-white mt-1">Live Embed Widget</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">
                    {billingCycle === "annual" ? "$349" : "$39"}
                  </span>
                  <span className="text-xs text-white/60">
                    {billingCycle === "annual" ? "/year" : "/month"}
                  </span>
                </div>
                <p className="text-xs text-white/60 mt-2">
                  {billingCycle === "annual" ? "Billed annually ($29/mo equiv). Instant key." : "Billed monthly. Cancel anytime."}
                </p>

                <ul className="mt-6 space-y-2.5 text-xs text-white/80">
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span>
                    <span>100% Whitelabel (no DCC branding)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span>
                    <span>Domain-authorized iframe embed</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span>
                    <span>Up to 50,000 monthly views</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span>
                    <span>NWS alerts & NOAA river gauges</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span>
                    <span>WordPress, Squarespace & Wix install</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => handleCheckout(billingCycle === "annual" ? "venue_annual" : "venue_monthly")}
                  disabled={loadingPlan != null}
                  className="w-full py-3.5 bg-gradient-to-r from-cyan-400 to-emerald-400 text-black font-black text-xs uppercase tracking-wider rounded-xl hover:brightness-110 transition shadow-lg shadow-cyan-500/25 disabled:opacity-50"
                >
                  {loadingPlan ? "Redirecting…" : `Buy Venue Pass (${billingCycle === "annual" ? "$349/yr" : "$39/mo"}) →`}
                </button>
              </div>
            </div>

            {/* PLAN 2: Pro API */}
            <div className="border border-white/10 bg-black/50 rounded-3xl p-8 flex flex-col justify-between">
              <div>
                <div className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Developer Pro</div>
                <h3 className="text-2xl font-black text-white mt-1">Coordinate API</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">
                    {billingCycle === "annual" ? "$899" : "$99"}
                  </span>
                  <span className="text-xs text-white/60">
                    {billingCycle === "annual" ? "/year" : "/month"}
                  </span>
                </div>
                <p className="text-xs text-white/60 mt-2">
                  {billingCycle === "annual" ? "Billed annually ($75/mo equiv)." : "Billed monthly. Cancel anytime."}
                </p>

                <ul className="mt-6 space-y-2.5 text-xs text-white/80">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span>
                    <span>50,000 API requests / month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span>
                    <span>Full /api/location/[lat]/[lng] access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span>
                    <span>Sub-50ms edge cached SLA</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span>
                    <span>OpenAPI & Machine JSON schemas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span>
                    <span>Persistent Neon DB usage tracking</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => handleCheckout("api_pro")}
                  disabled={loadingPlan != null}
                  className="w-full py-3.5 bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-wider rounded-xl border border-white/15 transition disabled:opacity-50"
                >
                  {loadingPlan ? "Redirecting…" : "Get API Pro ($99/mo) →"}
                </button>
              </div>
            </div>

            {/* PLAN 3: Enterprise & Multi-Venue */}
            <div className="border border-white/10 bg-black/50 rounded-3xl p-8 flex flex-col justify-between">
              <div>
                <div className="text-sm font-bold text-sky-400 uppercase tracking-wider">Multi-Venue / Custom</div>
                <h3 className="text-2xl font-black text-white mt-1">Enterprise Hub</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">$299</span>
                  <span className="text-xs text-white/60"> / month</span>
                </div>
                <p className="text-xs text-white/60 mt-2">
                  For tour operators with 5+ locations or high-traffic booking platforms.
                </p>

                <ul className="mt-6 space-y-2.5 text-xs text-white/80">
                  <li className="flex items-center gap-2">
                    <span className="text-sky-400">✓</span>
                    <span>Unlimited venues & domains</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-sky-400">✓</span>
                    <span>250,000+ API requests / month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-sky-400">✓</span>
                    <span>Dedicated gauge sourcing & mapping</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-sky-400">✓</span>
                    <span>Direct integration engineering support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-sky-400">✓</span>
                    <span>Custom uptime SLA & invoice billing</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10">
                <a
                  href="mailto:contact@destinationcommandcenter.com?subject=Enterprise%20DCC%20Inquiry"
                  className="w-full py-3.5 block text-center bg-white/5 hover:bg-white/10 text-white/80 font-bold text-xs uppercase tracking-wider rounded-xl border border-white/10 transition"
                >
                  Contact Enterprise Sales →
                </a>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center text-xs text-white/50">
            <span>Already have an active subscription? </span>
            <Link href="/pricing" className="text-cyan-400 font-bold hover:underline">
              Access the Customer Billing Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/80 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-cyan-400 flex items-center justify-center font-black text-black text-xs">
              DCC
            </div>
            <div className="text-xs text-white/60">
              © {new Date().getFullYear()} Destination Command Center. All rights reserved.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-white/60">
            <Link href="/widget" className="hover:text-white transition">Widget Studio</Link>
            <Link href="/pricing" className="hover:text-white transition">Pricing</Link>
            <Link href="/developers" className="hover:text-white transition">Developers</Link>
            <a href="/openapi.json" target="_blank" className="hover:text-white transition">OpenAPI</a>
            <a href="/agent.json" target="_blank" className="hover:text-white transition">Agent Contract</a>
            <Link href="/terms" className="hover:text-white transition">Terms</Link>
            <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
