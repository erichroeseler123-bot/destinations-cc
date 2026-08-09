import type { Metadata } from "next";
import Link from "next/link";
import { PRE_SITE_GUIDES } from "@/src/data/pre-site-guides";

export const metadata: Metadata = {
  title: "Travel Decision Guides | Destination Command Center",
  description:
    "Practical pre-purchase travel guides for cruise ports, tours, transportation, Alaska, New Orleans, Colorado, Red Rocks, and more.",
  alternates: { canonical: "https://www.destinationcommandcenter.com/guides" },
};

const CATEGORY_LABELS: Record<string, string> = {
  cruise: "Cruise planning",
  "new-orleans": "New Orleans",
  alaska: "Alaska",
  colorado: "Colorado mountains",
  "red-rocks": "Red Rocks",
  wisconsin: "Wisconsin Dells",
  transportation: "Transportation",
};

export default function GuidesPage() {
  const grouped = PRE_SITE_GUIDES.reduce<Record<string, typeof PRE_SITE_GUIDES>>((acc, guide) => {
    (acc[guide.category] ||= []).push(guide);
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-[#090d13] text-slate-100">
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">Destination Command Center</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-[-0.04em] text-white sm:text-6xl">
          The pages you need before you are ready to buy.
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
          DCC handles the research, comparisons, timing, constraints, and practical questions. When the decision is clear, the right specialist site takes over.
        </p>

        <div className="mt-14 space-y-14">
          {Object.entries(grouped).map(([category, guides]) => (
            <section key={category}>
              <div className="flex items-end justify-between gap-5 border-b border-slate-800 pb-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Research lane</p>
                  <h2 className="mt-2 text-2xl font-black text-white">{CATEGORY_LABELS[category] || category}</h2>
                </div>
                <span className="text-xs text-slate-500">{guides.length} guides</span>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {guides.map((guide) => (
                  <Link
                    key={guide.slug}
                    href={`/guides/${guide.slug}`}
                    className="group rounded-3xl border border-slate-800 bg-[#0d131d] p-6 transition hover:-translate-y-1 hover:border-cyan-800"
                  >
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">{guide.eyebrow}</p>
                    <h3 className="mt-3 text-xl font-black leading-7 text-white group-hover:text-cyan-100">{guide.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-400">{guide.description}</p>
                    <span className="mt-6 inline-block text-sm font-bold text-slate-200">Read the decision guide →</span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
