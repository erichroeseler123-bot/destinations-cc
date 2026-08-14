import Link from "next/link";
import ProductCard from "../components/ProductCard";
import CinematicPageHero from "../components/CinematicPageHero";
import { STOREFRONT_PRODUCTS } from "../tours/pageConfig";
import { FAREHARBOR_SOURCES } from "../lib/fareHarborAttribution";

export const metadata = {
  title: "Things to Do in New Orleans Today | Tours & Last-Minute Ideas",
  description:
    "Already in New Orleans? Compare tours, river cruises, swamp trips, city sightseeing and evening experiences, then check current times and availability with the operator.",
  alternates: { canonical: "/guides/things-to-do-in-new-orleans-today" },
};

const sameDaySlugs = [
  "city-tour-of-new-orleans",
  "daytime-jazz-cruise",
  "evening-jazz-cruise",
  "covered-tour-boat",
  "ragin-cajun-airboat-options",
  "craft-cocktail-walking-tour",
  "ghosts-spirits-walking-tour",
];

export default function ThingsToDoTodayPage() {
  const products = sameDaySlugs
    .map((slug) => STOREFRONT_PRODUCTS.find((product) => product.slug === slug))
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-[#080708] text-[#fdfbf7]">
      <CinematicPageHero
        eyebrow="Already in New Orleans?"
        title="Things to do in New Orleans today"
        script="make today count"
        intro="Need a plan for the next few hours? Start with experiences that make sense for a same-day decision, then check live times, prices and availability with the tour operator before booking."
        image="/images/travel-markets/new-orleans/french-quarter-street.jpg"
        actions={[
          { href: "#options", label: "See Tour Options", detail: "Start with today's best fits", primary: true },
          { href: "/guides/tonight", label: "Tonight", detail: "Evening experiences" },
          { href: "/help-me-choose", label: "Help Me Choose", detail: "Answer a few questions" },
        ]}
      />

      <section id="options" className="px-6 py-14 md:py-20 bg-[radial-gradient(circle_at_50%_0%,rgba(132,82,18,.12),transparent_34%),#080708]">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#d4af37]">Check current availability</p>
            <h2 className="mt-3 font-serif text-3xl md:text-4xl">Good places to start</h2>
            <p className="mt-4 text-white/70">Availability changes throughout the day. These are planning options, not a claim that a specific departure is still open.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => product && (
              <ProductCard
                key={product.id}
                attributionSource={FAREHARBOR_SOURCES.home}
                product={{ ...product, operatorAttribution: product.operatorName, isBookable: true, ctaLabel: "Check Times & Prices" } as any}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[#d4af37]/20 bg-[#0b090c] px-6 py-14">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">Still deciding?</p>
          <h2 className="font-serif text-3xl mt-3">Tell us what kind of day you want.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/70">The chooser narrows the catalog around your group, timing and logistics instead of making you sort through everything.</p>
          <Link href="/help-me-choose" className="mt-7 inline-block bg-[#d4af37] px-6 py-3 text-xs font-bold uppercase tracking-widest text-[#171717]">Find my best fit</Link>
        </div>
      </section>
    </div>
  );
}
