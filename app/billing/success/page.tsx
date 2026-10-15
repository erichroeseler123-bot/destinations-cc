"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import Link from "next/link";

function SuccessContent() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "venue_monthly";
  const initialKey = searchParams.get("key") || "dcc_venue_live_active_key";
  const initialDomain = searchParams.get("domain") || "yourvenue.com";
  const email = searchParams.get("email") || "subscriber@yourvenue.com";

  const [copiedKey, setCopiedKey] = useState(false);
  const [domainInput, setDomainInput] = useState(initialDomain);
  const [authorizedDomains, setAuthorizedDomains] = useState<string[]>([initialDomain]);
  const [domainSaved, setDomainSaved] = useState(false);

  const isVenuePlan = plan.startsWith("venue");

  const copyKey = () => {
    navigator.clipboard.writeText(initialKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainInput.trim()) return;
    if (!authorizedDomains.includes(domainInput.trim())) {
      setAuthorizedDomains([...authorizedDomains, domainInput.trim()]);
    }
    setDomainSaved(true);
    setTimeout(() => setDomainSaved(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-16 text-white font-sans">
      <div className="text-center mb-10">
        <span className="inline-block p-3 rounded-full bg-emerald-500/20 text-emerald-400 text-3xl mb-4 border border-emerald-500/30">
          ✓
        </span>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
          Subscription Active!
        </h1>
        <p className="mt-3 text-base text-white/70">
          Welcome to Destination Command Center. Your access is live immediately.
        </p>
      </div>

      <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-md space-y-6">
        {/* License Key Box */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
            {isVenuePlan ? "Your Venue License Key" : "Your API Secret Key"}
          </span>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={initialKey}
              className="flex-1 bg-black/60 border border-white/15 rounded-xl px-4 py-3 text-sm font-mono text-cyan-200 select-all focus:outline-none"
            />
            <button
              type="button"
              onClick={copyKey}
              className="px-5 py-3 bg-cyan-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-cyan-300 transition"
            >
              {copiedKey ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="text-[11px] text-white/50 mt-1.5">
            Confirmation details sent to <strong>{email}</strong>.
          </p>
        </div>

        {/* Authorized Domains (For Venues) */}
        {isVenuePlan && (
          <div className="border-t border-white/10 pt-6">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Authorized Website Domains
            </span>
            <p className="text-xs text-white/60 mt-1 mb-3">
              Your widget is authorized to load on these websites. Add your production domain or staging site:
            </p>

            <form onSubmit={handleAddDomain} className="flex gap-2 mb-3">
              <input
                type="text"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                placeholder="e.g. redrocksonline.com or myvenue.squarespace.com"
                className="flex-1 bg-black/60 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-emerald-300 transition"
              >
                {domainSaved ? "Saved!" : "Authorize Domain"}
              </button>
            </form>

            <div className="flex flex-wrap gap-2">
              {authorizedDomains.map((dom, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 flex items-center gap-1.5"
                >
                  <span>🌐</span>
                  <span>{dom}</span>
                  <span className="text-[10px] text-emerald-400 font-bold">✓ Whitelisted</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Next Steps CTA */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-white text-sm">Ready to install your widget?</h4>
            <p className="text-xs text-white/60">Customize your colors and grab your unbranded embed code.</p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/widget"
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-400 to-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:brightness-110 transition shadow-lg shadow-cyan-500/20"
            >
              Open Widget Configurator →
            </Link>
            <Link
              href="/developers"
              className="px-5 py-2.5 bg-white/10 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-white/15 transition border border-white/10"
            >
              API Documentation
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <main className="min-h-screen bg-[#070b10]">
      <Suspense fallback={<div className="p-10 text-white text-center">Loading license details…</div>}>
        <SuccessContent />
      </Suspense>
    </main>
  );
}
