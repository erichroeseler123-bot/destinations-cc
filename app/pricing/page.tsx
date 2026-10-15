"use client";

import { useState } from "react";
import Link from "next/link";

export default function PricingPage() {
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
    <main className="min-h-screen bg-[#070b10] text-white font-sans selection:bg-cyan-500 selection:text-black">
      {/* Hero */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-16 pb-12 text-center max-w-5xl mx-auto">
        <span className="inline-block px-3.5 py-1 rounded-full text-xs font-black tracking-widest uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 mb-4">
          Commercial Pricing & Access
        </span>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight">
          Simple, Transparent Pricing for Venues & Developers
        </h1>
        <p className="mt-4 text-base sm:text-lg text-white/70 max-w-2xl mx-auto">
          Equip your guests with live coordinate-native weather, water flow, and hazard intelligence. Or build directly on our high-speed developer API.
        </p>

        {/* Quick Email & Domain capture */}
        <div className="mt-8 max-w-xl mx-auto bg-white/[0.04] border border-white/10 rounded-2xl p-4 backdrop-blur-md flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your work email…"
            className="flex-1 bg-black/50 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-cyan-400"
          />
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="Venue domain (e.g. venue.com)"
            className="flex-1 bg-black/50 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </section>

      {/* PRODUCT 1: The Venue Widget */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto mb-20">
        <div className="border border-cyan-500/30 bg-gradient-to-b from-cyan-950/30 to-black/40 rounded-3xl p-6 sm:p-10 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-10" />

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8 mb-8">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-cyan-400">
                Product 1 • For Outdoor Venues & Tour Operators
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white mt-1">
                The "Know Before You Go" Live Venue Widget
              </h2>
              <p className="text-sm text-white/70 mt-2 max-w-xl">
                A single embeddable line of code for your website. Cuts guest calls about weather, parking, road closures, and water conditions by up to 80%.
              </p>
            </div>

            {/* Monthly / Annual Toggle */}
            <div className="flex items-center gap-2 bg-black/60 p-1.5 rounded-2xl border border-white/15 self-start md:self-auto">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                  billingCycle === "monthly" ? "bg-white/20 text-white" : "text-white/50 hover:text-white"
                }`}
              >
                Monthly ($39/mo)
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("annual")}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
                  billingCycle === "annual" ? "bg-cyan-400 text-black shadow-lg shadow-cyan-400/25" : "text-white/50 hover:text-white"
                }`}
              >
                <span>Annual Pass ($349/yr)</span>
                <span className="bg-black/30 text-black text-[10px] px-1.5 py-0.5 rounded-full font-black uppercase">
                  Save 25%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Features */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Everything Included in Your Venue Pass:
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-white/80">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">✓</span>
                  <span><strong>100% Whitelabel:</strong> Zero DCC branding or external links</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">✓</span>
                  <span><strong>Authorized Domain Whitelist:</strong> Locked to your official URL</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">✓</span>
                  <span><strong>Live NOAA Water Gauges:</strong> River levels & flood warnings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">✓</span>
                  <span><strong>Official NWS Alerts:</strong> High-wind, freeze & storm warnings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">✓</span>
                  <span><strong>Up to 50,000 Monthly Loads:</strong> Fast Vercel edge caching</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">✓</span>
                  <span><strong>WordPress, Squarespace & Wix:</strong> 60-second copy-paste install</span>
                </li>
              </ul>

              <div className="pt-2">
                <Link
                  href="/widget"
                  className="text-xs font-bold text-cyan-300 hover:underline flex items-center gap-1"
                >
                  <span>→ Customize and preview your venue widget first</span>
                </Link>
              </div>
            </div>

            {/* CTA Box */}
            <div className="lg:col-span-5 bg-black/50 border border-white/10 rounded-2xl p-6 text-center space-y-4">
              <div className="text-4xl font-black text-white">
                {billingCycle === "annual" ? "$349" : "$39"}
                <span className="text-sm font-normal text-white/60">
                  {billingCycle === "annual" ? "/year" : "/month"}
                </span>
              </div>
              <p className="text-xs text-white/60">
                {billingCycle === "annual"
                  ? "Billed annually ($29/mo equivalent). Instant setup & key generation."
                  : "Billed monthly. Cancel anytime with one click."}
              </p>

              <button
                type="button"
                onClick={() => handleCheckout(billingCycle === "annual" ? "venue_annual" : "venue_monthly")}
                disabled={loadingPlan != null}
                className="w-full py-4 bg-gradient-to-r from-cyan-400 to-emerald-400 text-black font-black text-sm uppercase tracking-wider rounded-xl hover:brightness-110 transition shadow-xl shadow-cyan-500/25 disabled:opacity-50"
              >
                {loadingPlan ? "Connecting to Checkout…" : `Get Venue Pass (${billingCycle === "annual" ? "$349/yr" : "$39/mo"}) →`}
              </button>
              <p className="text-[10px] text-white/40">Includes 14-day money-back guarantee.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCT 2: The Coordinate API */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto mb-24">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
            Product 2 • For Developers & AI Agents
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white mt-1">
            Coordinate Intelligence API
          </h2>
          <p className="text-sm text-white/70 mt-2">
            One unified endpoint (`/api/location/[lat]/[lng]`). Stop maintaining 6 separate weather, earthquake, hazard, and river integrations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free Sandbox */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-black text-white">Free Sandbox</h3>
              <div className="text-3xl font-black mt-2 text-white">$0</div>
              <p className="text-xs text-white/60 mt-1">For testing, hobbyists, and initial development.</p>
              <ul className="mt-6 space-y-2.5 text-xs text-white/80 border-t border-white/10 pt-4">
                <li>• 100 requests / day</li>
                <li>• Full `dcc-location-v2` schema</li>
                <li>• Weather, AQI, USGS, NOAA gauges</li>
                <li>• Community support</li>
              </ul>
            </div>
            <Link
              href="/developers"
              className="mt-6 w-full py-2.5 bg-white/10 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl text-center hover:bg-white/20 transition"
            >
              Start Free in Sandbox
            </Link>
          </div>

          {/* Builder Plan */}
          <div className="bg-white/[0.04] border border-cyan-500/40 rounded-2xl p-6 flex flex-col justify-between relative shadow-xl shadow-cyan-500/10">
            <span className="absolute -top-3 right-4 bg-cyan-400 text-black text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
              Most Popular
            </span>
            <div>
              <h3 className="text-lg font-black text-white">Builder Plan</h3>
              <div className="text-3xl font-black mt-2 text-white">
                $49<span className="text-xs font-normal text-white/60">/month</span>
              </div>
              <p className="text-xs text-white/60 mt-1">For production travel apps, outdoor platforms & clubs.</p>
              <ul className="mt-6 space-y-2.5 text-xs text-white/80 border-t border-white/10 pt-4">
                <li>• <strong>25,000 requests / month</strong></li>
                <li>• Sub-second cached edge delivery</li>
                <li>• Real-time NWS Alert Webhooks</li>
                <li>• Commercial production rights</li>
                <li>• Email developer support</li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => handleCheckout("api_builder")}
              disabled={loadingPlan != null}
              className="mt-6 w-full py-3 bg-cyan-400 text-black font-black text-xs uppercase tracking-wider rounded-xl text-center hover:bg-cyan-300 transition shadow-lg shadow-cyan-400/20"
            >
              {loadingPlan === "api_builder" ? "Starting…" : "Subscribe ($49/mo) →"}
            </button>
          </div>

          {/* Pro / AI Agent Plan */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-black text-white">Pro / AI Agent Tier</h3>
              <div className="text-3xl font-black mt-2 text-white">
                $199<span className="text-xs font-normal text-white/60">/month</span>
              </div>
              <p className="text-xs text-white/60 mt-1">For high-traffic platforms, AI trip planners & logistics.</p>
              <ul className="mt-6 space-y-2.5 text-xs text-white/80 border-t border-white/10 pt-4">
                <li>• <strong>150,000 requests / month</strong></li>
                <li>• High-concurrency throughput</li>
                <li>• Automated failover upstream routes</li>
                <li>• Priority agent & developer Slack support</li>
                <li>• Custom update polling intervals</li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => handleCheckout("api_pro")}
              disabled={loadingPlan != null}
              className="mt-6 w-full py-2.5 bg-white/15 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl text-center hover:bg-white/25 transition border border-white/15"
            >
              {loadingPlan === "api_pro" ? "Starting…" : "Subscribe ($199/mo) →"}
            </button>
          </div>
        </div>
      </section>

      {/* Live Demonstrations / Case Studies */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto mb-20 border-t border-white/10 pt-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-black uppercase tracking-widest text-white/50">
            Field-Tested Production Demonstrations
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
            See the Platform Working in the Real World
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
            <span className="text-2xl">🎸</span>
            <h4 className="font-extrabold text-white text-base mt-2">Red Rocks Concert Amphitheatre</h4>
            <p className="text-xs text-white/60 mt-1">
              High-attendance outdoor venue using DCC coordinate feeds for real-time wind gusts, sunset timing, rain alerts, and parking logistics.
            </p>
            <Link href="/location/39.66540/-105.20570" className="inline-block mt-3 text-xs font-bold text-cyan-300 hover:underline">
              View Red Rocks Node →
            </Link>
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
            <span className="text-2xl">⛷️</span>
            <h4 className="font-extrabold text-white text-base mt-2">Breckenridge Mountain Pass</h4>
            <p className="text-xs text-white/60 mt-1">
              Mountain transit operations using elevation, snow depth, freeze alerts, and severe winter driving forecasts.
            </p>
            <Link href="/location/39.48170/-106.03840" className="inline-block mt-3 text-xs font-bold text-cyan-300 hover:underline">
              View Breckenridge Node →
            </Link>
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
            <span className="text-2xl">🌊</span>
            <h4 className="font-extrabold text-white text-base mt-2">Clear Creek Whitewater Rafting</h4>
            <p className="text-xs text-white/60 mt-1">
              Adventure outfitters monitoring live NOAA NWPS river gauge heights and cubic-feet-per-second discharge to manage guest safety.
            </p>
            <Link href="/location/39.75310/-105.23470" className="inline-block mt-3 text-xs font-bold text-cyan-300 hover:underline">
              View Clear Creek Node →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
