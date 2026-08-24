import type { Metadata } from "next";
import { SHUTTLEYA_TRUTH } from "@/lib/siteTruth";

const truth = SHUTTLEYA_TRUTH;

export const metadata: Metadata = {
  title: "ShuttleYa | Find the Right Ride",
  description:
    "Transportation discovery for airport transfers, mountain rides, concert transportation and cruise-port ground transportation. ShuttleYa helps you choose; the listed operator provides the ride.",
  alternates: { canonical: `${truth.site.url}/` },
};

export default function ShuttleYaHome() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: truth.site.name,
    url: truth.site.url,
    description: truth.site.description,
    mainEntity: {
      "@type": "ItemList",
      name: "Transportation categories",
      itemListElement: truth.categories.map((category, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: category.title,
        url: `${truth.site.url}${category.href}`,
      })),
    },
  };

  return (
    <main className="min-h-screen bg-[#091014] text-[#f7f5ef]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_38%),radial-gradient(circle_at_top_right,rgba(34,197,94,0.12),transparent_30%)]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 md:py-24">
          <div className="inline-flex rounded-full border border-sky-300/30 bg-sky-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-sky-200">
            Transportation finder · not a carrier
          </div>
          <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-[-0.055em] text-white sm:text-6xl md:text-7xl">
            Find the right ride. Then book with the operator.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl">
            ShuttleYa helps travelers sort out ground transportation without creating another transportation company. Compare the trip type, see the relevant operator, and continue to the provider that actually controls vehicles, pricing, availability and pickup details.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#find-a-ride" className="rounded-xl bg-sky-300 px-5 py-3 text-sm font-black text-[#071016]">Find a ride ↓</a>
            <a href="https://www.destinationcommandcenter.com" className="rounded-xl border border-white/15 px-5 py-3 text-sm font-black text-white">Ask DCC ↗</a>
          </div>
        </div>
      </section>

      <section id="find-a-ride" className="mx-auto max-w-6xl px-5 py-14 sm:px-8 md:py-20">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-300">Start with the trip</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">What kind of transportation do you need?</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {truth.categories.map((item) => (
            <a key={item.href} href={item.href} className="rounded-3xl border border-white/10 bg-white/[0.045] p-6 transition hover:-translate-y-1 hover:border-sky-300/45">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">{item.eyebrow}</p>
              <h3 className="mt-3 text-2xl font-black text-white">{item.title}</h3>
              <p className="mt-3 leading-7 text-slate-300">{item.copy}</p>
              <span className="mt-6 inline-block text-sm font-black text-sky-200">Explore options →</span>
            </a>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0d171d]">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 md:py-20">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">Current operator handoffs</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white">Real services, clearly separated.</h2>
          <div className="mt-8 grid gap-4 lg:grid-cols-5">
            {truth.operator_handoffs.map((operator) => (
              <a key={operator.name} href={operator.url} className="rounded-2xl border border-white/10 bg-black/20 p-5 hover:border-emerald-300/40">
                <h3 className="font-black text-white">{operator.name}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{operator.scope}</p>
                <span className="mt-4 inline-block text-sm font-bold text-emerald-200">Visit operator ↗</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-5 py-14 sm:px-8 md:grid-cols-2 md:py-20">
        <div className="rounded-3xl border border-emerald-300/20 bg-emerald-300/[0.06] p-7">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">What ShuttleYa does</p>
          <ul className="mt-5 space-y-3 text-slate-200">
            <li>• Helps identify the right transportation category.</li>
            <li>• Routes travelers to a relevant operating company or destination specialist.</li>
            <li>• Publishes comparison and decision-support information.</li>
            <li>• Connects transportation discovery to Destination Command Center.</li>
          </ul>
        </div>
        <div className="rounded-3xl border border-rose-300/20 bg-rose-300/[0.05] p-7">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-200">What ShuttleYa does not do</p>
          <ul className="mt-5 space-y-3 text-slate-200">
            <li>• ShuttleYa does not operate vehicles or publish a house shuttle schedule.</li>
            <li>• ShuttleYa does not set an operator&apos;s live price or availability.</li>
            <li>• ShuttleYa does not take payment for transportation shown on this site.</li>
            <li>• The former Denver ↔ Mighty Argo scheduled shuttle is {truth.legacy_service.denver_to_mighty_argo_scheduled_shuttle === "retired_not_operating" ? "not operating" : "status unknown"}.</li>
          </ul>
        </div>
      </section>

      <footer className="border-t border-white/10 px-5 py-8 text-center text-sm leading-6 text-slate-500">
        ShuttleYa is a transportation discovery property affiliated with Destination Command Center. {truth.booking_boundary.rule}
      </footer>
    </main>
  );
}
