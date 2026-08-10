import Link from "next/link";
import ProductCard from "./ProductCard";
import { STOREFRONT_PRODUCTS } from "../tours/pageConfig";

type IntentLink = { href: string; label: string };

type IntentTourPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  decisionTitle: string;
  decisionPoints: string[];
  productSlugs: string[];
  relatedLinks?: IntentLink[];
};

export default function IntentTourPage({
  eyebrow,
  title,
  intro,
  decisionTitle,
  decisionPoints,
  productSlugs,
  relatedLinks = [],
}: IntentTourPageProps) {
  const products = productSlugs
    .map((slug) => STOREFRONT_PRODUCTS.find((product) => product.slug === slug))
    .filter(Boolean);

  return (
    <div className="bg-[var(--nola-bg-charcoal)] text-[var(--nola-ivory)] min-h-screen">
      <section className="mx-auto max-w-6xl px-6 pb-12 pt-16 md:pt-24">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-[var(--nola-gold)]">{eyebrow}</p>
        <h1 className="max-w-4xl font-serif text-4xl leading-tight md:text-6xl">{title}</h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--nola-text-muted)]">{intro}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="#tour-options" className="bg-[var(--nola-gold)] px-5 py-3 text-xs font-bold uppercase tracking-widest text-[#171717]">Check Tour Options</Link>
          <Link href="/help-me-choose" className="border border-[var(--nola-border)] px-5 py-3 text-xs font-bold uppercase tracking-widest">Help Me Choose</Link>
        </div>
      </section>

      <section className="border-y border-[var(--nola-border)] bg-[var(--nola-surface-subtle)]">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 md:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--nola-gold)]">How to decide</p>
            <h2 className="mt-3 font-serif text-3xl">{decisionTitle}</h2>
          </div>
          <ul className="space-y-4 text-[var(--nola-text-muted)]">
            {decisionPoints.map((point) => <li key={point} className="border-l-2 border-[var(--nola-gold)] pl-4">{point}</li>)}
          </ul>
        </div>
      </section>

      <section id="tour-options" className="mx-auto max-w-6xl px-6 py-14">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--nola-gold)]">Current participating options</p>
          <h2 className="mt-3 font-serif text-3xl md:text-4xl">Tours worth comparing for this plan</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--nola-text-muted)]">Schedules, live pricing, pickup details, eligibility and availability are controlled by the participating operator and confirmed during booking.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => product && (
            <ProductCard
              key={product.id}
              product={{ ...product, operatorAttribution: product.operatorName, isBookable: true, ctaLabel: "Check Times & Prices" } as any}
            />
          ))}
        </div>
      </section>

      {relatedLinks.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pb-16">
          <div className="border-t border-[var(--nola-border)] pt-8">
            <h2 className="font-serif text-2xl">Keep narrowing it down</h2>
            <div className="mt-5 flex flex-wrap gap-3">
              {relatedLinks.map((link) => <Link key={link.href} href={link.href} className="border border-[var(--nola-border)] px-4 py-2 text-sm hover:border-[var(--nola-gold)]">{link.label}</Link>)}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
