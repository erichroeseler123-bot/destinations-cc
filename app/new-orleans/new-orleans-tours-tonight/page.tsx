import Link from "next/link";
import ProductCard from "../components/ProductCard";
import { STOREFRONT_PRODUCTS } from "../tours/pageConfig";
import { FAREHARBOR_SOURCES } from "../lib/fareHarborAttribution";

export const metadata = {
  title: "New Orleans Tours Tonight | Evening Cruises, Cocktails & Ghosts",
  description:
    "Compare New Orleans evening experiences including jazz cruises, cocktail walks and ghost tours, then check current times, prices and operator availability.",
  alternates: { canonical: "/new-orleans-tours-tonight" },
};

const tonightSlugs = [
  "evening-jazz-cruise",
  "craft-cocktail-walking-tour",
  "ghosts-spirits-walking-tour",
];

export default function NewOrleansToursTonightPage() {
  const products = tonightSlugs
    .map((slug) => STOREFRONT_PRODUCTS.find((product) => product.slug === slug))
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-[#151515] text-[#fdfbf7]">
      <section className="border-b border-white/10 bg-[#110e14] px-6 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-[#d4af37]">Tonight in New Orleans</p>
          <h1 className="max-w-4xl font-serif text-4xl leading-tight md:text-6xl">Find something worth doing tonight</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/75">
            Compare evening options without digging through the whole catalog. Choose an experience below, then check the operator&apos;s current departure times, pricing and availability.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#tonight-options" className="bg-[#d4af37] px-5 py-3 text-xs font-bold uppercase tracking-widest text-[#171717]">Check tonight&apos;s options</a>
            <Link href="/things-to-do-in-new-orleans-today" className="border border-[#d4af37] px-5 py-3 text-xs font-bold uppercase tracking-widest text-[#fdfbf7]">Need a daytime plan?</Link>
          </div>
        </div>
      </section>

      <section id="tonight-options" className="px-6 py-14 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#d4af37]">Evening experiences</p>
            <h2 className="mt-3 font-serif text-3xl md:text-4xl">Start here</h2>
            <p className="mt-4 text-white/70">Departure inventory changes in real time. Use these as tonight-oriented choices and confirm the actual time with the participating operator.</p>
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

      <section className="border-t border-white/10 bg-[#110e14] px-6 py-14">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="font-serif text-3xl">Want help choosing?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/70">Use the quick chooser or contact the Concierge Desk if you are already in town and trying to make a plan.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/help-me-choose" className="bg-[#d4af37] px-6 py-3 text-xs font-bold uppercase tracking-widest text-[#171717]">Help me choose</Link>
            <a href="tel:+15044849687" className="border border-[#d4af37] px-6 py-3 text-xs font-bold uppercase tracking-widest text-[#fdfbf7]">Call or text 504-484-9687</a>
          </div>
        </div>
      </section>
    </div>
  );
}
