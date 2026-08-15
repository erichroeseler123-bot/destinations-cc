"use client";

import { useEffect, useMemo, useState } from "react";

export type QaTour = {
  id: string;
  title: string;
  slug: string;
  itemId?: string;
  flowId?: string;
  variantCount: number;
};

type ChecklistItem = {
  id: string;
  label: string;
  note?: string;
};

type ChecklistSection = {
  id: string;
  title: string;
  items: ChecklistItem[];
};

const STORAGE_KEY = "wno-concierge-qa-v1";

const sections: ChecklistSection[] = [
  {
    id: "visual-brand",
    title: "Visual & Brand",
    items: [
      { id: "hero-mockup", label: "Hero matches the dark-gold concierge mockup with the approved headline and three CTAs." },
      { id: "eight-tiles", label: "8 discovery tiles are present: City Tours, Swamps & Airboats, River Cruises, Plantations, Food & Cocktails, Ghosts & Cemetery, Garden District, Jazz / Music." },
      { id: "trust-bar", label: "Trust bar shows Trusted Local Partners / Curated Experiences / Local Concierge Support." },
      { id: "no-catalog-emphasis", label: "Homepage does not emphasize See Full Catalog / See All Tours / Browse All Tours." },
    ],
  },
  {
    id: "copy-positioning",
    title: "Copy & Positioning",
    items: [
      { id: "concierge-subcopy", label: "Hero sub-copy uses concierge framing: New Orleans is better when you choose the right experience…" },
      { id: "no-compare-copy", label: "No Compare participating local tours… language remains in the customer-facing homepage." },
      { id: "our-pick-copy", label: "Recommendation cards use Our pick for… editorial language rather than catalog numbering." },
      { id: "operator-suppression", label: "Operator names are hidden during discovery/recommendation and appear only at detail/booking." },
    ],
  },
  {
    id: "chooser",
    title: "Chooser / Recommendation Engine",
    items: [
      { id: "chooser-21", label: "Chooser evaluates all current parent experiences, not only the four legacy products." },
      { id: "six-hours", label: "6 hours available → full-day combinations disappear." },
      { id: "tonight-suppression", label: "Tonight → plantation and swamp day trips disappear." },
      { id: "rain-evening", label: "Rainy evening → exposed outdoor options are demoted." },
      { id: "family-demotion", label: "Family/mixed ages → cocktails and after-dark options are demoted." },
      { id: "history-rise", label: "History preference → Whitney / plantation / city-history experiences rise." },
      { id: "music-rise", label: "Music + evening → jazz cruises rise." },
      { id: "no-four-message", label: "No-fit message does not reference four current bookable experiences." },
      { id: "result-format", label: "Result shows OUR PICK FOR YOUR GROUP + Why we picked it + See Availability." },
    ],
  },
  {
    id: "booking",
    title: "Booking Path",
    items: [
      { id: "all-detail-pages", label: "Every experience detail page loads." },
      { id: "direct-fareharbor", label: "See Availability opens FareHarbor directly in a new tab; Lightframe is not required." },
      { id: "affiliate-params", label: "Affiliate parameters are normalized on every booking URL." },
      { id: "variant-links", label: "Variant-level links work for experiences with multiple times / meals / formats." },
      { id: "dead-routes", label: "Homepage tiles, editorial cards, chooser results, category links, logo/home links, and CTAs have no dead internal routes." },
    ],
  },
  {
    id: "live-intelligence",
    title: "48-Hour Intelligence Layer",
    items: [
      { id: "live-section", label: "What’s Happening in New Orleans — Next 48 Hours section renders." },
      { id: "live-cards", label: "Tonight / Tomorrow / Weather / River / Swamp / Concierge Pick signals are represented." },
      { id: "no-fake-data", label: "No fake live data: signals are real, sourced, or clearly identified as placeholders." },
      { id: "live-modifiers", label: "Live context changes chooser scoring rather than acting as decorative copy only." },
    ],
  },
  {
    id: "performance",
    title: "Performance & Tech",
    items: [
      { id: "no-js-booking", label: "No client-side JavaScript is required to reach a valid booking URL." },
      { id: "third-party-fail-safe", label: "No third-party / FareHarbor JavaScript failure can prevent a customer from reaching checkout." },
      { id: "vercel-ready", label: "Production Vercel deployment is READY." },
      { id: "runtime-errors", label: "No unresolved production server runtime errors in the last 24 hours." },
    ],
  },
];

export default function ConciergeQaChecklist({ tours }: { tours: QaTour[] }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setChecked(JSON.parse(stored));
    } catch {
      // Keep the checklist usable even when storage is unavailable.
    }
  }, []);

  const setItem = (id: string, value: boolean) => {
    setChecked((current) => {
      const next = { ...current, [id]: value };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Persistence is a convenience, not a requirement.
      }
      return next;
    });
  };

  const checklistIds = useMemo(
    () => [
      ...sections.flatMap((section) => section.items.map((item) => item.id)),
      ...tours.map((tour) => `tour-${tour.id}`),
    ],
    [tours],
  );

  const completed = checklistIds.filter((id) => checked[id]).length;
  const percent = checklistIds.length ? Math.round((completed / checklistIds.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#09090a] text-[#f4ead3]">
      <header className="border-b border-[#342d20] bg-[#0d0d0e]">
        <div className="mx-auto w-[min(1180px,calc(100%-2rem))] py-10">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#c9a86a]">Internal QA · Welcome to New Orleans Tours</p>
          <h1 className="mt-3 font-serif text-4xl md:text-5xl">21-Experience Concierge QA</h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-[#bdb5a7]">
            The operating checklist for brand, recommendation quality, booking integrity, live intelligence, and production health. Checks are saved in this browser.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <div className="h-2 w-64 overflow-hidden rounded-full bg-[#24211b]">
              <div className="h-full bg-[#c9a86a] transition-all" style={{ width: `${percent}%` }} />
            </div>
            <span className="text-sm font-semibold text-[#e8d8b4]">{completed} / {checklistIds.length} complete · {percent}%</span>
            <button
              type="button"
              onClick={() => {
                setChecked({});
                try { window.localStorage.removeItem(STORAGE_KEY); } catch {}
              }}
              className="ml-auto border border-[#4a4130] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#c9a86a] hover:border-[#c9a86a]"
            >
              Reset checks
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-[min(1180px,calc(100%-2rem))] gap-8 py-10 lg:grid-cols-[1fr_1.05fr]">
        <div className="space-y-7">
          {sections.map((section) => (
            <section key={section.id} className="border border-[#2a261e] bg-[#101011] p-5 md:p-6">
              <h2 className="font-serif text-2xl text-[#f3dfb3]">{section.title}</h2>
              <div className="mt-4 space-y-3">
                {section.items.map((item) => (
                  <label key={item.id} className="flex cursor-pointer gap-3 border-t border-[#211f1a] pt-3 first:border-t-0 first:pt-0">
                    <input
                      type="checkbox"
                      checked={Boolean(checked[item.id])}
                      onChange={(event) => setItem(item.id, event.target.checked)}
                      className="mt-1 h-4 w-4 accent-[#c9a86a]"
                    />
                    <span className={`text-sm leading-6 ${checked[item.id] ? "text-[#7f796e] line-through" : "text-[#d2cabd]"}`}>{item.label}</span>
                  </label>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="h-fit border border-[#4a3d26] bg-[#0f0e0b] p-5 md:p-6 lg:sticky lg:top-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#c9a86a]">21-for-21 booking audit</p>
              <h2 className="mt-2 font-serif text-3xl">Current experience inventory</h2>
            </div>
            <span className="text-xs text-[#968e80]">{tours.length} parent experiences</span>
          </div>

          <div className="mt-6 space-y-2">
            {tours.map((tour, index) => {
              const id = `tour-${tour.id}`;
              const mapping = tour.itemId ? "Item-level" : tour.flowId ? "Flow-level" : "Needs mapping";
              return (
                <label key={tour.id} className="grid cursor-pointer grid-cols-[auto_1fr_auto] gap-3 border border-[#252119] bg-[#12110e] p-3">
                  <input
                    type="checkbox"
                    checked={Boolean(checked[id])}
                    onChange={(event) => setItem(id, event.target.checked)}
                    className="mt-1 h-4 w-4 accent-[#c9a86a]"
                  />
                  <div>
                    <div className="flex gap-2">
                      <span className="text-[10px] font-bold text-[#776e60]">{String(index + 1).padStart(2, "0")}</span>
                      <p className={`text-sm font-semibold ${checked[id] ? "text-[#797268] line-through" : "text-[#eee3cc]"}`}>{tour.title}</p>
                    </div>
                    <p className="mt-1 text-[11px] text-[#8f877a]">/tours/{tour.slug}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.12em]">
                      <span className={`border px-2 py-1 ${mapping === "Item-level" ? "border-[#40523b] text-[#9dbb91]" : mapping === "Flow-level" ? "border-[#66522f] text-[#d5b36d]" : "border-[#6a3434] text-[#d78b8b]"}`}>{mapping}</span>
                      {tour.variantCount > 0 && <span className="border border-[#34302a] px-2 py-1 text-[#aaa295]">{tour.variantCount} variants</span>}
                    </div>
                  </div>
                  <a
                    href={`/tours/${tour.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(event) => event.stopPropagation()}
                    className="self-start text-[10px] font-bold uppercase tracking-[0.14em] text-[#c9a86a] hover:text-[#f0d79f]"
                  >
                    Open ↗
                  </a>
                </label>
              );
            })}
          </div>

          <div className="mt-5 border-t border-[#30291d] pt-4 text-xs leading-5 text-[#9d9587]">
            <strong className="text-[#d8bd84]">Audit rule:</strong> check a tour only after the detail page renders, its See Availability path reaches the intended FareHarbor destination, and every visible variant is valid. Flow-level products are allowed but should remain explicitly noted.
          </div>
        </section>
      </main>
    </div>
  );
}
